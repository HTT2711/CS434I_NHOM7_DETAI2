import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { menuApi } from '../../services/menu.api';
import { useSocket } from '../../context/SocketContext';
import {
  Printer,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ChefHat,
  UtensilsCrossed,
  X,
  AlertTriangle,
  Flame,
  Check,
  Search,
} from 'lucide-react';

const KitchenBoard = () => {
  const [mainTab, setMainTab] = useState('KDS'); // 'KDS' | 'STOCK'
  const [viewMode, setViewMode] = useState('BY_ORDER'); // 'BY_ORDER' | 'BY_ITEM'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockCatFilter, setStockCatFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Cancel item modal state (US20)
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('Hết nguyên liệu');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Audio chime when new order arrives
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio policy
    }
  };

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders({ activeOnly: true });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async () => {
    try {
      const [itemRes, catRes] = await Promise.all([
        menuApi.getItems(),
        menuApi.getCategories(),
      ]);
      if (itemRes.success) setMenuItems(itemRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    fetchMenuData();

    if (socket) {
      socket.emit('join-staff');

      const handleNewOrder = (newOrder) => {
        playAlertSound();
        if (newOrder && newOrder.id) {
          setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        }
        fetchActiveOrders();
      };

      socket.on('new_order', handleNewOrder);
      socket.on('order-created', handleNewOrder);
      socket.on('order-confirmed', handleNewOrder);
      socket.on('order-completed', () => fetchActiveOrders());

      socket.on('order-status-updated', (updatedOrder) => {
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
        }
      });

      socket.on('order_item_updated', (updatedItem) => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === updatedItem.orderId) {
              const updatedItems = o.items.map((it) =>
                it.id === updatedItem.id ? { ...it, ...updatedItem } : it
              );
              return { ...o, items: updatedItems };
            }
            return o;
          })
        );
      });

      socket.on('menu_item_updated', (updatedItem) => {
        setMenuItems((prev) =>
          prev.map((it) => (it.id === updatedItem.id ? { ...it, ...updatedItem } : it))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order-created');
        socket.off('order-confirmed');
        socket.off('order-status-updated');
        socket.off('order_item_updated');
        socket.off('menu_item_updated');
      }
    };
  }, [socket]);

  // Update single item status: PENDING -> COOKING -> READY -> SERVED (US10)
  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      await orderApi.updateItemStatus(itemId, newStatus);
      fetchActiveOrders();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật món');
    }
  };

  // Start all items in order (convenience action)
  const handleStartAllItems = async (order) => {
    try {
      const pendingItems = order.items.filter((i) => i.status === 'PENDING');
      await Promise.all(
        pendingItems.map((i) => orderApi.updateItemStatus(i.id, 'COOKING'))
      );
      await orderApi.updateStatus(order.id, 'COOKING');
      fetchActiveOrders();
    } catch (err) {
      alert(err.message || 'Lỗi khi bắt đầu nấu tất cả');
    }
  };

  // Finish all items in order
  const handleFinishAllItems = async (order) => {
    try {
      const cookingItems = order.items.filter((i) => ['PENDING', 'COOKING'].includes(i.status));
      await Promise.all(
        cookingItems.map((i) => orderApi.updateItemStatus(i.id, 'READY'))
      );
      await orderApi.updateStatus(order.id, 'READY');
      fetchActiveOrders();
    } catch (err) {
      alert(err.message || 'Lỗi khi hoàn thành tất cả');
    }
  };

  // Serve all items in order
  const handleServeAllItems = async (order) => {
    try {
      const readyItems = order.items.filter((i) => i.status === 'READY');
      await Promise.all(
        readyItems.map((i) => orderApi.updateItemStatus(i.id, 'SERVED'))
      );
      fetchActiveOrders();
    } catch (err) {
      alert(err.message || 'Lỗi khi phục vụ');
    }
  };

  // Cancel item handler (US20)
  const handleConfirmCancelItem = async () => {
    if (!cancelModalItem) return;
    const finalReason = cancelReason === 'Khác…' ? customCancelReason : cancelReason;
    if (!finalReason) {
      alert('Vui lòng nhập lý do hủy món');
      return;
    }

    setCancelling(true);
    try {
      await orderApi.cancelItem(cancelModalItem.id, finalReason, false);
      setCancelModalItem(null);
      setCustomCancelReason('');
      fetchActiveOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi hủy món');
    } finally {
      setCancelling(false);
    }
  };

  // Toggle item stock (US11: Bếp tồn kho trong ngày)
  const handleToggleStock = async (itemId) => {
    try {
      await menuApi.toggleStock(itemId);
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        )
      );
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật tình trạng món');
    }
  };

  // Classify orders into 3 Columns per doc.md (US09):
  // 1. Đơn mới: mọi món chưa bị hủy đều PENDING
  // 2. Đang chế biến: có ít nhất 1 món COOKING, hoặc đang xử lý dở
  // 3. Đã xong: mọi món còn lại đều READY hoặc SERVED
  const validOrders = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));

  const newOrders = validOrders.filter((o) => {
    const activeItems = o.items?.filter((it) => it.status !== 'CANCELLED') || [];
    if (activeItems.length === 0) return false;
    return activeItems.every((it) => it.status === 'PENDING');
  });

  const cookingOrders = validOrders.filter((o) => {
    const activeItems = o.items?.filter((it) => it.status !== 'CANCELLED') || [];
    if (activeItems.length === 0) return false;
    const hasCooking = activeItems.some((it) => it.status === 'COOKING');
    const hasPendingAndReady = activeItems.some((it) => it.status === 'PENDING') && activeItems.some((it) => ['READY', 'SERVED'].includes(it.status));
    return hasCooking || hasPendingAndReady;
  });

  const readyOrders = validOrders.filter((o) => {
    const activeItems = o.items?.filter((it) => it.status !== 'CANCELLED') || [];
    if (activeItems.length === 0) return false;
    const allReadyOrServed = activeItems.every((it) => ['READY', 'SERVED'].includes(it.status));
    // Don't show if all items are already SERVED (archived from main board)
    const allServed = activeItems.every((it) => it.status === 'SERVED');
    return allReadyOrServed && !allServed;
  });

  // Total items currently to cook
  const totalItemsToCook = validOrders.reduce((sum, order) => {
    const items = order.items?.filter((it) => ['PENDING', 'COOKING'].includes(it.status)) || [];
    return sum + items.reduce((s, i) => s + (i.quantity || 1), 0);
  }, 0);

  const getElapsedMinutes = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  // Filtered menu items for Tab 2 (Tình trạng món)
  const filteredStockItems = menuItems.filter((item) => {
    if (!item.isSelling) return false; // Chỉ hiện món đang kinh doanh
    if (stockCatFilter !== 'ALL' && item.categoryId !== Number(stockCatFilter)) return false;
    if (stockSearch.trim()) {
      return item.name.toLowerCase().includes(stockSearch.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto bg-white font-sans">
      {/* 1. Header with Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-amber-600" />
            <span>Màn Hình Bếp KDS</span>
          </h1>
        </div>

        {/* 2 Primary Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setMainTab('KDS')}
              style={mainTab === 'KDS' ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                mainTab === 'KDS' ? 'bg-navy-900 text-white shadow-sm' : 'text-stone-600 hover:text-navy-900'
              }`}
            >
              <ChefHat size={14} />
              <span>Tab 1 — Đơn hàng (KDS)</span>
            </button>
            <button
              onClick={() => setMainTab('STOCK')}
              style={mainTab === 'STOCK' ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                mainTab === 'STOCK' ? 'bg-navy-900 text-white shadow-sm' : 'text-stone-600 hover:text-navy-900'
              }`}
            >
              <Layers size={14} />
              <span>Tab 2 — Tình trạng món ({menuItems.filter((i) => !i.isAvailable && i.isSelling).length} tạm hết)</span>
            </button>
          </div>

          <button
            onClick={() => { fetchActiveOrders(); fetchMenuData(); }}
            className="p-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {mainTab === 'KDS' ? (
        <div className="space-y-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#edf2fe] border border-blue-100 flex flex-col justify-between">
              <div className="text-xs font-bold text-navy-900">Đơn mới</div>
              <div className="text-3xl font-extrabold text-navy-900 font-display mt-1">{newOrders.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#fef3c7] border border-amber-200 flex flex-col justify-between">
              <div className="text-xs font-bold text-amber-900">Đang chế biến</div>
              <div className="text-3xl font-extrabold text-amber-900 font-display mt-1">{cookingOrders.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-emerald-200 flex flex-col justify-between">
              <div className="text-xs font-bold text-emerald-900">Đã xong / Chờ lên món</div>
              <div className="text-3xl font-extrabold text-emerald-900 font-display mt-1">{readyOrders.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#e0f2fe] border border-sky-200 flex flex-col justify-between">
              <div className="text-xs font-bold text-sky-950">Món cần làm</div>
              <div className="text-3xl font-extrabold text-sky-950 font-display mt-1">{totalItemsToCook}</div>
            </div>
          </div>

          {/* Sub Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold self-start">
              <button
                onClick={() => setViewMode('BY_ORDER')}
                style={viewMode === 'BY_ORDER' ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
                className={`px-4 py-1.5 rounded-lg transition ${
                  viewMode === 'BY_ORDER' ? 'bg-navy-900 text-white shadow-sm' : 'text-stone-600 hover:text-navy-900'
                }`}
              >
                Theo đơn (3 Cột)
              </button>
              <button
                onClick={() => setViewMode('BY_ITEM')}
                style={viewMode === 'BY_ITEM' ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
                className={`px-4 py-1.5 rounded-lg transition ${
                  viewMode === 'BY_ITEM' ? 'bg-navy-900 text-white shadow-sm' : 'text-stone-600 hover:text-navy-900'
                }`}
              >
                Tổng hợp theo món
              </button>
            </div>

            <div className="text-xs text-stone-500 font-medium">
              Chờ ≥ 10 phút: <span className="text-amber-600 font-bold">lưu ý</span> · ≥ 20 phút:{' '}
              <span className="text-rose-600 font-bold">ưu tiên</span>
            </div>
          </div>

          {viewMode === 'BY_ORDER' ? (
            /* 3 COLUMNS KDS GRID (US09, US10) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* Column 1: ĐƠN MỚI */}
              <div className="space-y-4 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h2 className="text-base font-extrabold text-navy-900 font-display">Đơn mới</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-extrabold">
                    {newOrders.length}
                  </span>
                </div>

                {newOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400">Không có đơn mới</div>
                ) : (
                  newOrders.map((order) => {
                    const elapsed = getElapsedMinutes(order.createdAt);
                    const tableName = order.table?.tableNumber || `Bàn ${order.tableId}`;
                    return (
                      <div key={order.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[11px] font-mono text-stone-400 font-semibold">{order.orderNumber}</div>
                            <h3 className="text-xl font-extrabold text-navy-900 font-display">{tableName}</h3>
                          </div>
                          <span className={`text-xs font-bold ${elapsed >= 20 ? 'text-rose-600' : elapsed >= 10 ? 'text-amber-600' : 'text-stone-500'}`}>
                            {elapsed} phút
                          </span>
                        </div>

                        {/* Order note */}
                        {order.note && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
                            📌 {order.note}
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
                          {order.items?.map((it) => (
                            <div key={it.id} className="flex items-center justify-between py-1 border-b border-stone-50">
                              <div className="min-w-0 pr-2">
                                <p className={`font-bold ${it.status === 'CANCELLED' ? 'text-stone-400 line-through' : 'text-navy-900'}`}>
                                  {it.quantity} × {it.menuItem?.name}
                                </p>
                                {it.note && <p className="text-[10px] text-amber-700 italic">Ghi chú: {it.note}</p>}
                                {it.status === 'CANCELLED' && (
                                  <p className="text-[10px] text-rose-600">Đã hủy: {it.cancelReason}</p>
                                )}
                              </div>
                              {it.status !== 'CANCELLED' && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleUpdateItemStatus(it.id, 'COOKING')}
                                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] rounded-lg transition"
                                  >
                                    Nấu
                                  </button>
                                  <button
                                    onClick={() => setCancelModalItem(it)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                                    title="Hủy món"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Footer action */}
                        <div className="pt-2 flex justify-between items-center border-t border-stone-100">
                          <button
                            onClick={() => window.print()}
                            className="text-[11px] text-stone-500 hover:text-navy-900 font-semibold flex items-center gap-1"
                          >
                            <Printer size={12} />
                            <span>In phiếu</span>
                          </button>
                          <button
                            onClick={() => handleStartAllItems(order)}
                            style={{ backgroundColor: '#0b1329' }}
                            className="px-3.5 py-1.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition"
                          >
                            Bắt đầu tất cả
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column 2: ĐANG CHẾ BIẾN */}
              <div className="space-y-4 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h2 className="text-base font-extrabold text-navy-900 font-display">Đang chế biến</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                    {cookingOrders.length}
                  </span>
                </div>

                {cookingOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400">Không có đơn đang nấu</div>
                ) : (
                  cookingOrders.map((order) => {
                    const elapsed = getElapsedMinutes(order.createdAt);
                    const tableName = order.table?.tableNumber || `Bàn ${order.tableId}`;
                    return (
                      <div key={order.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[11px] font-mono text-stone-400 font-semibold">{order.orderNumber}</div>
                            <h3 className="text-xl font-extrabold text-navy-900 font-display">{tableName}</h3>
                          </div>
                          <span className={`text-xs font-bold ${elapsed >= 20 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {elapsed} phút
                          </span>
                        </div>

                        {order.note && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
                            📌 {order.note}
                          </div>
                        )}

                        <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
                          {order.items?.map((it) => (
                            <div key={it.id} className="flex items-center justify-between py-1 border-b border-stone-50">
                              <div className="min-w-0 pr-2">
                                <p className={`font-bold ${it.status === 'CANCELLED' ? 'text-stone-400 line-through' : 'text-navy-900'}`}>
                                  {it.quantity} × {it.menuItem?.name}
                                </p>
                                {it.note && <p className="text-[10px] text-amber-700 italic">Ghi chú: {it.note}</p>}
                                {it.status === 'CANCELLED' && (
                                  <p className="text-[10px] text-rose-600">Đã hủy: {it.cancelReason}</p>
                                )}
                              </div>
                              {it.status !== 'CANCELLED' && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {it.status === 'COOKING' ? (
                                    <button
                                      onClick={() => handleUpdateItemStatus(it.id, 'READY')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition"
                                    >
                                      Xong
                                    </button>
                                  ) : it.status === 'READY' ? (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                      Đã nấu xong
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateItemStatus(it.id, 'COOKING')}
                                      className="px-2 py-1 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-lg"
                                    >
                                      Bắt đầu
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setCancelModalItem(it)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                                    title="Hủy món"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                          <button
                            onClick={() => handleFinishAllItems(order)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                          >
                            Xong tất cả
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column 3: ĐÃ XONG / CHỜ LÊN MÓN */}
              <div className="space-y-4 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h2 className="text-base font-extrabold text-navy-900 font-display">Đã xong / Lên món</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                    {readyOrders.length}
                  </span>
                </div>

                {readyOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400">Không có đơn đang chờ bưng</div>
                ) : (
                  readyOrders.map((order) => {
                    const tableName = order.table?.tableNumber || `Bàn ${order.tableId}`;
                    return (
                      <div key={order.id} className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[11px] font-mono text-stone-400 font-semibold">{order.orderNumber}</div>
                            <h3 className="text-xl font-extrabold text-navy-900 font-display">{tableName}</h3>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Chờ bưng ra bàn
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-stone-100 text-xs">
                          {order.items?.map((it) => (
                            <div key={it.id} className="flex items-center justify-between py-1 border-b border-stone-50">
                              <span className={`font-bold ${it.status === 'SERVED' ? 'line-through text-stone-400' : 'text-navy-900'}`}>
                                {it.quantity} × {it.menuItem?.name}
                              </span>
                              {it.status === 'READY' ? (
                                <button
                                  onClick={() => handleUpdateItemStatus(it.id, 'SERVED')}
                                  className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] rounded-lg transition"
                                >
                                  Lên món
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-purple-700">Đã lên bàn</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-end border-t border-stone-100">
                          <button
                            onClick={() => handleServeAllItems(order)}
                            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                          >
                            Đã lên bàn tất cả
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* VIEW MODE: BY_ITEM */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((dish) => {
                const count = validOrders.reduce((sum, order) => {
                  const item = order.items?.find((i) => i.menuItemId === dish.id && ['PENDING', 'COOKING'].includes(i.status));
                  return sum + (item ? item.quantity : 0);
                }, 0);

                if (count === 0) return null;

                return (
                  <div
                    key={dish.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-white shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-navy-900 text-base">{dish.name}</h4>
                      <span className="text-xs text-stone-500 font-medium">
                        {dish.price?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-white font-extrabold flex items-center justify-center text-lg">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: TÌNH TRẠNG MÓN (US11: Bếp Tồn Kho Trong Ngày) */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Tìm món để gạt Còn hàng / Tạm hết..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-navy-900 text-navy-900 font-medium"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Danh mục:</span>
              <select
                value={stockCatFilter}
                onChange={(e) => setStockCatFilter(e.target.value)}
                className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs font-bold text-navy-900 bg-white cursor-pointer"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of Dishes with Quick Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStockItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                  item.isAvailable
                    ? 'bg-white border-stone-200 hover:border-stone-300'
                    : 'bg-stone-50 border-rose-200'
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                    alt={item.name}
                    className={`w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-100 ${
                      !item.isAvailable ? 'grayscale opacity-60' : ''
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-navy-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-stone-500">{item.category?.name}</p>
                    <p className="text-xs font-bold text-navy-900 mt-0.5">
                      {item.price?.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${item.isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {item.isAvailable ? '● Còn hàng' : '✕ Tạm hết món'}
                  </span>

                  <button
                    onClick={() => handleToggleStock(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs ${
                      item.isAvailable
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {item.isAvailable ? 'Gạt Tạm hết' : 'Gạt Còn hàng'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL HỦY MÓN KÈM LÝ DO (US20) */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle size={18} />
                </span>
                <h3 className="font-extrabold text-base text-navy-900 font-display">
                  Xác nhận Hủy món
                </h3>
              </div>
              <button
                onClick={() => setCancelModalItem(null)}
                className="text-stone-400 hover:text-navy-900 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Bạn đang hủy món: <strong>{cancelModalItem.quantity}× {cancelModalItem.menuItem?.name}</strong>.
              Món bị hủy sẽ không tính tiền vào hóa đơn và gửi thông báo tới khách hàng & thu ngân.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Lý do hủy (Bắt buộc):
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white font-medium"
              >
                <option value="Hết nguyên liệu trong ca">Hết nguyên liệu trong ca</option>
                <option value="Món bị lỗi / hỏng khi chế biến">Món bị lỗi / hỏng khi chế biến</option>
                <option value="Khách đổi ý yêu cầu hủy">Khách đổi ý yêu cầu hủy</option>
                <option value="Khác…">Lý do khác…</option>
              </select>

              {cancelReason === 'Khác…' && (
                <input
                  type="text"
                  placeholder="Nhập lý do cụ thể..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-medium"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalItem(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCancelItem}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy món'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenBoard;
