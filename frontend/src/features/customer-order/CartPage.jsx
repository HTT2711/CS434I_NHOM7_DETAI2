import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../services/order.api';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Utensils } from 'lucide-react';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount, totalCount } = useCart();
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const savedTable = localStorage.getItem('current_table');
  const table = savedTable ? JSON.parse(savedTable) : null;

  const handlePlaceOrder = async () => {
    if (!table) {
      alert('Không tìm thấy thông tin bàn! Vui lòng quét lại mã QR tại bàn.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
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
        localStorage.setItem('current_order_id', res.data.id);
        navigate(`/order/status?orderId=${res.data.id}`);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi đơn đặt món');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft size={16} />
          <span>Tiếp tục chọn món</span>
        </button>

        {table && (
          <span className="text-xs font-extrabold text-navy-900 bg-stone-100 px-3 py-1 rounded-full border border-gold/50">
            {table.tableNumber}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-navy-900" size={20} />
            <h2 className="font-extrabold text-base text-slate-800">
              Giỏ hàng của bạn ({totalCount})
            </h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Giỏ hàng chưa có món nào</p>
            <button
              onClick={() => navigate('/order')}
              className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.menuItemId}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl shrink-0 border border-stone-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
                    <p className="text-xs font-extrabold text-navy-900">
                      {item.price.toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
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

                {/* Individual item note input (US08: không hành, ít cay...) */}
                <div>
                  <input
                    type="text"
                    value={item.note || ''}
                    onChange={(e) => {
                      const newNote = e.target.value;
                      // Update note in cart item
                      updateQuantity(item.menuItemId, item.quantity); // triggers re-render
                      item.note = newNote;
                    }}
                    placeholder="Ghi chú món: không hành, ít cay..."
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900 text-slate-600"
                  />
                </div>
              </div>
            ))}

            {/* Overall Order Note */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Ghi chú chung cho toàn bộ đơn:
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ví dụ: Đem món khai vị trước, làm nhanh giúp mình..."
                rows={2}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>

            {/* Pricing Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng món:</span>
                <span className="font-bold text-slate-800">{totalCount} phần</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                <span>Tạm tính thanh toán:</span>
                <span className="text-base text-navy-900 font-extrabold">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-3.5 bg-navy-900 hover:bg-navy-800 active:bg-orange-800 text-white font-extrabold rounded-xl text-sm transition-colors shadow-lg shadow-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Đang gửi gọi món...' : `Gửi đơn đặt món (${table?.tableNumber || 'Bàn'})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
