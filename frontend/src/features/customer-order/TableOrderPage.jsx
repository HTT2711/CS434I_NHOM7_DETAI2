import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { tableApi } from '../../services/table.api';
import { menuApi } from '../../services/menu.api';
import { orderApi } from '../../services/order.api';
import { supportApi } from '../../services/support.api';
import { promotionApi } from '../../services/promotion.api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Bell,
  Clock,
  CheckCircle2,
  ChefHat,
  AlertTriangle,
  UtensilsCrossed,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';

const reasons = ['Gọi thanh toán', 'Thêm đá / nước', 'Thêm chén đũa', 'Khác…'];

// Bỏ dấu tiếng Việt chuẩn xác theo file mẫu
function normalize(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const TableOrderPage = () => {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const queryTableId = searchParams.get('tableId');
  const [qrError, setQrError] = useState(null);
  const activeLookup = queryToken || tableId || queryTableId || '1';

  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalAmount, totalCount } = useCart();
  const { socket } = useSocket();

  const [table, setTable] = useState(null);
  const activeTableId = table?.id || Number(tableId) || Number(queryTableId) || 1;
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Voucher / Promotion state for customer
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [availablePromos, setAvailablePromos] = useState([]);

  // Active table orders for realtime tracking
  const [tableOrders, setTableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('MENU'); // 'MENU' | 'TRACKING'
  const [pageLoading, setPageLoading] = useState(true);

  const fetchTableData = async () => {
    try {
      let res;
      if (queryToken) {
        res = await tableApi.getByToken(queryToken);
      } else {
        res = await tableApi.getById(activeLookup);
      }

      if (res && res.success && res.data) {
        setTable(res.data);
        setQrError(null);
        localStorage.setItem('current_table', JSON.stringify(res.data));
        if (res.data.orders) {
          const activeOnes = res.data.orders.filter(
            (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
          );
          setTableOrders(activeOnes);
        }
      } else {
        if (queryToken) {
          setQrError('Mã QR không hợp lệ, vui lòng liên hệ nhân viên');
        } else {
          setTable({
            id: Number(activeLookup) || 1,
            tableNumber: `Bàn ${String(activeLookup).padStart(2, '0')}`,
            area: 'Tầng 1',
            capacity: 4,
          });
        }
      }
    } catch {
      if (queryToken) {
        setQrError('Mã QR không hợp lệ, vui lòng liên hệ nhân viên');
      } else {
        setTable({
          id: Number(activeLookup) || 1,
          tableNumber: `Bàn ${String(activeLookup).padStart(2, '0')}`,
          area: 'Tầng 1',
          capacity: 4,
        });
      }
    }
  };

  const handleCancelItem = async (itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy món này không?')) return;
    try {
      await orderApi.cancelItem(itemId, 'Khách hàng hủy món', true);
      fetchTableOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi hủy món');
    }
  };

  const fetchMenuData = async () => {
    try {
      const [catRes, itemRes, promoRes] = await Promise.all([
        menuApi.getCategories(true).catch(() => ({ success: true, data: [] })),
        menuApi.getItems({ forCustomer: true }).catch(() => ({ success: true, data: [] })),
        promotionApi.getAll().catch(() => ({ data: [] })),
      ]);
      if (catRes?.success) setCategories(catRes.data || []);
      if (itemRes?.success) setMenuItems(itemRes.data || []);
      if (promoRes?.success && Array.isArray(promoRes.data)) {
        setAvailablePromos(promoRes.data.filter((p) => p.active));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTableOrders = async () => {
    const tid = table?.id || activeTableId;
    if (!tid) return;
    try {
      const res = await orderApi.getOrders({ tableId: tid, activeOnly: true });
      if (res.success && Array.isArray(res.data)) {
        setTableOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Khởi tạo trang: Tải song song Bàn ăn, Thực đơn và Danh mục
  useEffect(() => {
    let isMounted = true;
    const initPage = async () => {
      try {
        setPageLoading(true);
        await Promise.all([fetchTableData(), fetchMenuData()]);
      } catch (err) {
        console.error('Lỗi khởi tạo bàn:', err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    initPage();

    return () => {
      isMounted = false;
    };
  }, [queryToken, tableId, queryTableId]);

  // Lắng nghe socket realtime
  useEffect(() => {
    if (!socket || !table?.id) return;

    socket.emit('join-table', table.id);

    const handleItemUpdate = (updatedItem) => {
      setMenuItems((prev) => {
        if (!updatedItem.isSelling || updatedItem.isDeleted) {
          return prev.filter((it) => it.id !== updatedItem.id);
        }
        const exists = prev.some((it) => it.id === updatedItem.id);
        if (exists) {
          return prev.map((it) => (it.id === updatedItem.id ? { ...it, ...updatedItem } : it));
        }
        return [...prev, updatedItem];
      });
    };

    const handleOrderStatusUpdate = () => fetchTableOrders();
    const handleOrderCompleted = () => {
      fetchTableOrders();
      fetchTableData();
    };

    const handleNewOrder = (ord) => {
      const currentTid = table?.id || activeTableId;
      if (ord && (ord.tableId === currentTid || ord.table?.id === currentTid)) {
        setTableOrders((prev) => [ord, ...prev.filter((o) => o.id !== ord.id)]);
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order-created', handleNewOrder);
    socket.on('menu_item_updated', handleItemUpdate);
    socket.on('menu-updated', fetchMenuData);
    socket.on('order-status-updated', handleOrderStatusUpdate);
    socket.on('order_item_updated', handleOrderStatusUpdate);
    socket.on('order-completed', handleOrderCompleted);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order-created', handleNewOrder);
      socket.off('menu_item_updated', handleItemUpdate);
      socket.off('menu-updated', fetchMenuData);
      socket.off('order-status-updated', handleOrderStatusUpdate);
      socket.off('order_item_updated', handleOrderStatusUpdate);
      socket.off('order-completed', handleOrderCompleted);
    };
  }, [socket, table?.id]);

  // Handle call staff / support
  const handleSendSupport = async () => {
    let reasonText = selectedReason === 'Khác…' ? customReason : selectedReason;
    if (selectedReason === 'Gọi thanh toán' && appliedPromo) {
      reasonText += ` (Khách có voucher: ${appliedPromo.code})`;
    }
    try {
      await supportApi.create({
        tableId: activeTableId,
        reason: reasonText,
      });
      if (socket) {
        socket.emit('call-waiter', {
          tableId: activeTableId,
          tableNumber: table?.tableNumber || `Bàn ${activeTableId}`,
          reason: reasonText,
          time: new Date().toLocaleTimeString('vi-VN'),
        });
      }
      alert(`Đã gửi yêu cầu "${reasonText}" tới nhân viên cho ${table?.tableNumber || 'Bàn'}!`);
      setIsSupportOpen(false);
    } catch (err) {
      alert('Không thể gửi yêu cầu: ' + (err.response?.data?.message || err.message));
    }
  };

  // Tự động đồng bộ giỏ hàng với danh mục món ăn thực tế
  useEffect(() => {
    if (menuItems.length > 0 && cartItems.length > 0) {
      let changed = false;
      cartItems.forEach((cartItem) => {
        const found = menuItems.find((m) => m.id === cartItem.menuItemId);
        if (!found) {
          const matchedByName = menuItems.find((m) => m.name === cartItem.name);
          if (matchedByName) {
            cartItem.menuItemId = matchedByName.id;
            cartItem.price = matchedByName.price;
            cartItem.imageUrl = matchedByName.imageUrl;
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem('tasty_cart', JSON.stringify([...cartItems]));
      }
    }
  }, [menuItems]);

  // Ưu đãi voucher khách hàng
  const handleApplyPromo = async (codeToUse) => {
    const code = (codeToUse || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    setPromoError('');
    try {
      const res = await promotionApi.check(code);
      if (res.success && res.data) {
        const promo = res.data;
        if (promo.minOrder && totalAmount < promo.minOrder) {
          setPromoError(`Đơn cần từ ${promo.minOrder.toLocaleString('vi-VN')}đ (hiện có: ${totalAmount.toLocaleString('vi-VN')}đ)`);
          return;
        }
        setAppliedPromo(promo);
        setPromoCodeInput(promo.code);
        setPromoError('');
      } else {
        setPromoError(res.message || 'Mã không hợp lệ hoặc đã hết hạn');
      }
    } catch (err) {
      setPromoError(err.message || 'Mã không hợp lệ');
    }
  };

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.minOrder && totalAmount < appliedPromo.minOrder) return 0;
    if (appliedPromo.type === 'percent') {
      const val = Math.round((totalAmount * appliedPromo.value) / 100);
      return appliedPromo.maxDiscount ? Math.min(val, appliedPromo.maxDiscount) : val;
    }
    return Math.min(appliedPromo.value, totalAmount);
  }, [appliedPromo, totalAmount]);

  // Handle place order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmittingOrder(true);
    try {
      const finalNote = appliedPromo
        ? `[Mã giảm: ${appliedPromo.code} (-${promoDiscount.toLocaleString('vi-VN')}đ)] ${orderNote}`.trim()
        : orderNote;

      const payload = {
        tableId: Number(table?.id || activeLookup),
        items: cartItems.map((it) => ({
          menuItemId: it.menuItemId,
          name: it.name,
          quantity: it.quantity,
          note: it.note || '',
        })),
        note: finalNote,
      };

      const res = await orderApi.create(payload);
      if (res.success && res.data) {
        // Cập nhật ngay đơn mới vào danh sách món đã gọi tức thì (0ms)
        setTableOrders((prev) => [res.data, ...prev.filter((o) => o.id !== res.data.id)]);
        clearCart();
        setIsCartOpen(false);
        setActiveTab('TRACKING');
        fetchTableOrders();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi đơn gọi món');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filtered menu items using normalized search (Vietnamese accents insensitive)
  const filteredItems = useMemo(() => {
    const query = normalize(searchQuery.trim());
    return menuItems.filter((item) => {
      const matchCat = selectedCatId ? item.categoryId === selectedCatId : true;
      const matchSearch = normalize(item.name).includes(query);
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCatId, searchQuery]);

  if (qrError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center max-w-sm w-full shadow-lg space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-[#0b1329] font-display">Mã QR không hợp lệ</h2>
          <p className="text-sm text-[#786f66]">
            {qrError}
          </p>
        </div>
      </div>
    );
  }

  if (pageLoading && !table) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc] text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#0b1329] flex items-center justify-center text-[#dfc9a5] shadow-lg animate-pulse mb-3">
          <UtensilsCrossed size={28} />
        </div>
        <h3 className="text-base font-extrabold text-[#0b1329] font-display">Đang tải thực đơn bàn...</h3>
        <p className="text-xs text-[#786f66] mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] max-w-md mx-auto shadow-2xl relative border-x border-[#e2e8f0] flex flex-col">
      {/* Table Tent Header */}
      <header className="sticky top-0 z-30 bg-[#fffdfa]/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#786f66]">
            <span>🏮 TASTY HOUSE</span>
            <span>·</span>
            <span>{table?.area || 'Khu A - Tầng 1'}</span>
          </div>
          <h2 className="text-lg font-extrabold text-[#0b1329] font-display">
            {table ? table.tableNumber : `Bàn số ${activeTableId}`}
            <span className="text-xs font-medium text-[#786f66] ml-2">
              ({table?.capacity || 4} chỗ ngồi)
            </span>
          </h2>
        </div>

        {/* Nút Gọi nhân viên hỗ trợ */}
        <button
          onClick={() => setIsSupportOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] rounded-full text-xs font-bold active:scale-95 transition-transform"
        >
          <Bell size={13} />
          <span>Gọi nhân viên</span>
        </button>
      </header>

      {/* Navigation Sub-Tabs: Thực Đơn & Theo Dõi Món Đã Gọi */}
      <div className="bg-white border-b border-[#e2e8f0] px-4 py-2 flex gap-2 text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('MENU')}
          className={`flex-1 py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'MENU'
              ? 'bg-[#0b1329] text-white shadow-sm'
              : 'bg-[#f8fafc] text-[#786f66]'
          }`}
        >
          <UtensilsCrossed size={14} />
          <span>Thực đơn gọi món</span>
        </button>
        <button
          onClick={() => setActiveTab('TRACKING')}
          className={`flex-1 py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 relative ${
            activeTab === 'TRACKING'
              ? 'bg-[#0b1329] text-white shadow-sm'
              : 'bg-[#f8fafc] text-[#786f66]'
          }`}
        >
          <Clock size={14} />
          <span>Món đã gọi ({tableOrders.length})</span>
        </button>
      </div>

      {activeTab === 'MENU' ? (
        <div className="p-4 space-y-4 flex-1 pb-24">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#786f66]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm món ăn, đồ uống..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b1329] font-medium"
            />
          </div>

          {/* Categories Horizontal Slider */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCatId === null
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'bg-white text-[#786f66] border border-[#e2e8f0]'
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCatId === c.id
                    ? 'bg-[#0b1329] text-white shadow-xs'
                    : 'bg-white text-[#786f66] border border-[#e2e8f0]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Dishes List */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs flex gap-3 transition-all ${
                  !item.isAvailable ? 'opacity-50 grayscale select-none' : ''
                }`}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                )}

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#0f172a] truncate">{item.name}</h4>
                      {!item.isAvailable && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Tạm hết
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-[#786f66] line-clamp-2 mt-0.5">{item.description}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-extrabold text-sm text-[#0b1329]">
                      {item.price.toLocaleString('vi-VN')} đ
                    </span>

                    {item.isAvailable ? (
                      <button
                        onClick={() => addToCart(item, 1)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#fdf2f0] hover:bg-[#0b1329] hover:text-white text-[#0b1329] rounded-xl text-xs font-extrabold transition-colors active:scale-95 shadow-xs"
                      >
                        <Plus size={13} />
                        <span>Chọn món</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-red-500 font-semibold">Tạm hết món</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Realtime Tracking of Placed Orders */
        <div className="p-4 space-y-4 flex-1 pb-24">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-[#0f172a]">
              Lịch sử các món đã gọi tại bàn ({tableOrders.length} lượt gọi)
            </h3>

            {tableOrders.length === 0 ? (
              <p className="text-xs text-[#786f66] py-6 text-center">Bàn chưa gửi đợt gọi món nào.</p>
            ) : (
              <div className="space-y-3">
                {tableOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-1.5">
                      <span className="font-bold text-[#0b1329]">{ord.orderNumber}</span>
                      {(() => {
                        const activeItems = ord.items?.filter((it) => it.status !== 'CANCELLED') || [];
                        const isAllServed = activeItems.length > 0 && activeItems.every((it) => it.status === 'SERVED');
                        const isAllReadyOrServed = activeItems.length > 0 && activeItems.every((it) => ['READY', 'SERVED'].includes(it.status));
                        const isCooking = activeItems.some((it) => ['COOKING', 'READY', 'SERVED'].includes(it.status));

                        let displayStatus = ord.status;
                        if (ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED') {
                          if (isAllServed) displayStatus = 'SERVED';
                          else if (isAllReadyOrServed) displayStatus = 'READY';
                          else if (isCooking) displayStatus = 'COOKING';
                        }

                        const badgeConfig = {
                          AWAITING_CONFIRMATION: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-900 border border-amber-300' },
                          CONFIRMED: { label: 'Đã tiếp nhận', cls: 'bg-blue-100 text-blue-800' },
                          COOKING: { label: 'Đang chế biến', cls: 'bg-blue-100 text-blue-800' },
                          READY: { label: 'Món đã sẵn sàng', cls: 'bg-emerald-100 text-emerald-800' },
                          SERVED: { label: 'Đã lên đủ món', cls: 'bg-purple-100 text-purple-800 font-extrabold' },
                          COMPLETED: { label: 'Đã hoàn thành', cls: 'bg-emerald-100 text-emerald-800' },
                          CANCELLED: { label: 'Đã hủy', cls: 'bg-rose-100 text-rose-800' },
                          PENDING: { label: 'Chờ chế biến', cls: 'bg-amber-100 text-amber-800' },
                        };

                        const conf = badgeConfig[displayStatus] || badgeConfig.PENDING;

                        return (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${conf.cls}`}>
                            {conf.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      {ord.items?.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs p-1.5 bg-white rounded-lg border border-stone-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={it.menuItem?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                              alt={it.menuItem?.name}
                              className={`w-9 h-9 rounded-lg object-cover shrink-0 border border-stone-100 ${
                                it.status === 'CANCELLED' ? 'opacity-40 grayscale' : ''
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120';
                              }}
                            />
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${
                                it.status === 'CANCELLED' ? 'text-stone-400 line-through' : 'text-navy-900'
                              }`}>
                                {it.quantity}× {it.menuItem?.name}
                              </p>
                              {it.note && (
                                <p className="text-[10px] text-amber-700 italic">
                                  {it.note}
                                </p>
                              )}
                              {it.status === 'CANCELLED' && it.cancelReason && (
                                <p className="text-[10px] text-rose-600 font-semibold">
                                  Lý do hủy: {it.cancelReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                it.status === 'SERVED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : it.status === 'READY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : it.status === 'COOKING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : it.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800 line-through'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {it.status === 'SERVED'
                                ? 'Đã lên món'
                                : it.status === 'READY'
                                ? 'Nấu xong'
                                : it.status === 'COOKING'
                                ? 'Đang nấu'
                                : it.status === 'CANCELLED'
                                ? 'Đã hủy'
                                : 'Chờ chế biến'}
                            </span>

                            {it.status === 'PENDING' && (
                              <button
                                onClick={() => handleCancelItem(it.id)}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                                title="Hủy món này"
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex justify-between font-extrabold text-xs">
                      <span>Tổng tiền:</span>
                      <span className="text-[#0b1329]">{Number(ord.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#0b1329] hover:bg-[#17223b] text-white rounded-2xl p-4 shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#0b1329] flex items-center justify-center font-extrabold text-sm">
                {totalCount}
              </div>
              <div className="text-left leading-tight">
                <p className="text-[11px] opacity-90">Giỏ món ăn</p>
                <p className="font-extrabold text-base">{totalAmount.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-extrabold text-xs bg-white/20 px-3 py-1.5 rounded-xl">
              <span>Xem giỏ hàng</span>
              <ShoppingBag size={15} />
            </div>
          </button>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-[#fffdfa] h-full flex flex-col shadow-2xl z-10">
            <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-[#0b1329]" size={18} />
                <h3 className="font-extrabold text-sm text-[#0f172a]">Giỏ món ({totalCount})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 text-[#786f66] hover:text-[#0f172a]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.menuItemId} className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2.5">
                  <div className="flex items-start gap-3">
                    {/* Ảnh món ăn bên cạnh để dễ hình dung */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      <img
                        src={item.imageUrl || menuItems.find(m => m.id === item.menuItemId)?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                        }}
                      />
                    </div>

                    {/* Thông tin món & nút tăng giảm */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-navy-900 leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="text-stone-400 hover:text-rose-600 p-0.5 transition"
                          title="Xóa món khỏi giỏ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs font-extrabold text-navy-900">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </p>

                        <div className="flex items-center gap-2 bg-stone-100 px-2 py-1 rounded-xl border border-stone-200">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="text-stone-600 hover:text-navy-900 font-bold"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-xs font-extrabold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="text-stone-600 hover:text-navy-900 font-bold"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ô nhập ghi chú riêng từng món */}
                  <input
                    type="text"
                    value={item.note || ''}
                    onChange={(e) => {
                      item.note = e.target.value;
                      updateQuantity(item.menuItemId, item.quantity);
                    }}
                    placeholder="Ghi chú món (không hành, ít cay, ít đá...)"
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900 text-stone-700"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#e2e8f0] bg-white space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#786f66] mb-1">
                  Ghi chú cho toàn bộ đơn:
                </label>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Làm nhanh giúp bàn mình..."
                  className="w-full p-2 text-xs border border-[#e2e8f0] rounded-xl focus:outline-none"
                />
              </div>

              {/* Voucher ưu đãi cho khách */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#0b1329] flex items-center gap-1 text-[11px]">
                    <Tag size={13} className="text-amber-700" />
                    <span>Mã ưu đãi / Voucher:</span>
                  </span>
                  {appliedPromo && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCodeInput('');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Bỏ mã
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nhập mã (VD: TASTY10)..."
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    disabled={!!appliedPromo}
                    className="flex-1 px-2.5 py-1 text-xs font-mono font-bold uppercase bg-white border border-stone-300 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    disabled={!!appliedPromo || !promoCodeInput.trim()}
                    className="px-2.5 py-1 bg-[#0b1329] text-white rounded-lg text-xs font-bold disabled:bg-stone-300 cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>

                {promoError && (
                  <p className="text-[10px] text-rose-600 font-semibold">{promoError}</p>
                )}

                {appliedPromo && (
                  <div className="flex justify-between items-center text-[11px] text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                    <span>Đã áp dụng {appliedPromo.code}:</span>
                    <span>-{promoDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {!appliedPromo && availablePromos.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {availablePromos.slice(0, 3).map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => {
                          setPromoCodeInput(p.code);
                          handleApplyPromo(p.code);
                        }}
                        className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-bold text-amber-900 active:scale-95 cursor-pointer"
                      >
                        🏷️ {p.code} ({p.type === 'percent' ? `-${p.value}%` : `-${Math.round(p.value / 1000)}k`})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-1 border-t border-stone-200 text-xs">
                <div className="flex justify-between text-[#786f66]">
                  <span>Tạm tính món:</span>
                  <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Giảm giá ({appliedPromo?.code}):</span>
                    <span>-{promoDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-extrabold text-sm pt-0.5 text-[#0b1329]">
                  <span>Dự kiến thanh toán:</span>
                  <span className="text-base text-[#0b1329]">
                    {Math.max(0, totalAmount - promoDiscount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full py-3 bg-[#0b1329] hover:bg-[#a32617] text-white font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-[#0b1329]/20"
              >
                {submittingOrder ? 'Đang gửi...' : 'Xác nhận đặt món'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu cầu Hỗ trợ (Gọi nước, Chén đũa, Thanh toán...) */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-[#0f172a] flex items-center gap-1.5">
              <Bell size={16} className="text-[#b45309]" />
              <span>Yêu cầu nhân viên hỗ trợ</span>
            </h3>

            <div className="space-y-1.5">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    selectedReason === r
                      ? 'border-[#0b1329] bg-[#fdf2f0] text-[#0b1329]'
                      : 'border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a]'
                  }`}
                >
                  {r}
                </button>
              ))}

              {selectedReason === 'Khác…' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập yêu cầu của bạn..."
                  className="w-full p-2 text-xs border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b1329]"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsSupportOpen(false)}
                className="flex-1 py-2 bg-[#f3ede2] text-[#0f172a] rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleSendSupport}
                className="flex-1 py-2 bg-[#0b1329] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0b1329]/20"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOrderPage;
