import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../services/order.api';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose, table }) => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount, totalCount } = useCart();
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    if (!table) {
      alert('Không tìm thấy thông tin bàn!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tableId: table.id,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          note: item.note || '',
        })),
        note: orderNote,
      };

      const res = await orderApi.create(payload);
      if (res.success) {
        clearCart();
        onClose();
        navigate(`/order-status/${res.data.id}`);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-navy-900" size={20} />
            <h2 className="font-bold text-slate-800">Giỏ hàng của bạn ({totalCount})</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
              <p>Giỏ hàng chưa có món nào</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs font-bold text-navy-900">
                    {item.price.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="text-slate-500 hover:text-navy-900"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="text-slate-500 hover:text-navy-900"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ghi chú cho toàn bộ đơn hàng
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ví dụ: Ăn liền, không hành, làm nhanh giúp mình..."
                rows={2}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="flex justify-between items-center text-sm font-semibold text-slate-800 pt-1">
              <span>Tổng thanh toán tạm tính:</span>
              <span className="text-lg font-bold text-navy-900">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 active:bg-orange-800 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Đang gửi gọi món...' : `Gửi gọi món (${table?.tableNumber || 'Bàn'})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
