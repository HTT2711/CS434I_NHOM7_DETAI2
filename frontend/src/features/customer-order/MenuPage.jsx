import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { tableApi } from '../../services/table.api';
import { menuApi } from '../../services/menu.api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import CartDrawer from './CartDrawer';
import { Search, Plus, ShoppingBag, Utensils, Check, AlertTriangle } from 'lucide-react';

const MenuPage = () => {
  const { tableToken } = useParams();
  const [searchParams] = useSearchParams();
  const tableIdFromQuery = searchParams.get('tableId');

  const { addToCart, totalCount, totalAmount } = useCart();
  const { socket } = useSocket();

  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedAnimationId, setAddedAnimationId] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        let currentTable = null;

        // 1. Fetch table by tableId or token
        if (tableIdFromQuery) {
          const res = await tableApi.getById(tableIdFromQuery);
          if (res.success) {
            currentTable = res.data;
            setTable(currentTable);
            localStorage.setItem('current_table', JSON.stringify(currentTable));
          }
        } else if (tableToken) {
          const res = await tableApi.getByToken(tableToken);
          if (res.success) {
            currentTable = res.data;
            setTable(currentTable);
            localStorage.setItem('current_table', JSON.stringify(currentTable));
          }
        } else {
          const savedTable = localStorage.getItem('current_table');
          if (savedTable) {
            setTable(JSON.parse(savedTable));
          }
        }

        // 2. Fetch Categories (only selling)
        const catRes = await menuApi.getCategories();
        if (catRes.success) {
          setCategories(catRes.data);
        }

        // 3. Fetch Items: US07 (forCustomer = true => only items isSelling === true)
        const itemRes = await menuApi.getItems({ forCustomer: true });
        if (itemRes.success) {
          setMenuItems(itemRes.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải thực đơn:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [tableToken, tableIdFromQuery]);

  // Realtime update when kitchen changes stock status (US11)
  useEffect(() => {
    if (socket) {
      socket.on('menu_item_updated', (updatedItem) => {
        setMenuItems((prev) =>
          prev.map((it) => (it.id === updatedItem.id ? { ...it, ...updatedItem } : it))
        );
      });
    }

    return () => {
      if (socket) socket.off('menu_item_updated');
    };
  }, [socket]);

  const handleAddToCart = (item) => {
    if (!item.isAvailable) {
      alert(`Món "${item.name}" hiện đang tạm hết nguyên liệu!`);
      return;
    }
    addToCart(item, 1);
    setAddedAnimationId(item.id);
    setTimeout(() => setAddedAnimationId(null), 1000);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Table Greeting Card */}
      {table ? (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-orange-100">
              Bạn đang ngồi tại
            </span>
            <h2 className="text-xl font-extrabold">{table.tableNumber}</h2>
            <p className="text-xs text-orange-100">Sức chứa: {table.capacity} người</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Utensils size={24} />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Vui lòng quét mã QR tại bàn để xác định vị trí ngồi của bạn.</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm món ăn, đồ uống..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Item Grid / List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border border-slate-100 p-3 shadow-sm flex gap-3 transition-all ${
              !item.isAvailable ? 'opacity-50 grayscale select-none' : ''
            }`}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                <Utensils size={24} />
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">{item.name}</h3>
                  {!item.isAvailable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      Tạm hết món
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm text-navy-900">
                  {item.price.toLocaleString('vi-VN')} đ
                </span>

                {item.isAvailable ? (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      addedAnimationId === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-navy-900 hover:bg-stone-200 active:scale-95'
                    }`}
                  >
                    {addedAnimationId === item.id ? (
                      <>
                        <Check size={14} />
                        <span>Đã thêm</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Thêm</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    Hết nguyên liệu
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center font-bold text-sm">
                {totalCount}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-300">Tổng tạm tính</p>
                <p className="font-bold text-base">{totalAmount.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm text-gold-500">
              <span>Xem giỏ hàng</span>
              <ShoppingBag size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} table={table} />
    </div>
  );
};

export default MenuPage;
