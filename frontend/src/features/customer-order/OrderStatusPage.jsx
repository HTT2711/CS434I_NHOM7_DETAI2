import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/order.api';
import { useSocket } from '../../context/SocketContext';
import { Clock, CheckCircle2, ChefHat, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const statusStepMap = {
  PENDING: { label: 'Chờ chế biến', desc: 'Đơn hàng đang chờ nhà bếp tiếp nhận', color: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Đã tiếp nhận', desc: 'Nhà bếp đã nhận đơn của bạn', color: 'bg-blue-100 text-blue-800' },
  COOKING: { label: 'Đang nấu', desc: 'Đầu bếp đang chế biến các món ăn', color: 'bg-indigo-100 text-indigo-800' },
  READY: { label: 'Hoàn thành món', desc: 'Món đã nấu xong, chuẩn bị đưa ra bàn', color: 'bg-emerald-100 text-emerald-800' },
  SERVED: { label: 'Đã phục vụ', desc: 'Món ăn đã được phục vụ tại bàn', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: 'Đã thanh toán', desc: 'Cảm ơn quý khách đã dùng bữa tại Tasty House!', color: 'bg-slate-100 text-slate-800' },
  CANCELLED: { label: 'Đã hủy đơn', desc: 'Đơn hàng đã được hủy', color: 'bg-red-100 text-red-800' },
};

const OrderStatusPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const orderId = id || queryOrderId || localStorage.getItem('current_order_id');
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const res = await orderApi.getById(orderId);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    if (socket && orderId) {
      socket.on('order-status-updated', (updatedOrder) => {
        if (updatedOrder.id === Number(orderId)) {
          setOrder((prev) => ({ ...prev, ...updatedOrder }));
        }
      });

      socket.on('order_item_updated', (updatedItem) => {
        if (updatedItem.orderId === Number(orderId)) {
          setOrder((prev) => {
            if (!prev) return prev;
            const updatedItems = prev.items.map((it) =>
              it.id === updatedItem.id ? { ...it, status: updatedItem.status } : it
            );
            return { ...prev, items: updatedItems };
          });
        }
      });

      socket.on('order-completed', (invoice) => {
        if (invoice.orderId === Number(orderId)) {
          fetchOrder();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('order-status-updated');
        socket.off('order_item_updated');
        socket.off('order-completed');
      }
    };
  }, [orderId, socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle size={32} />
        </div>
        <p className="text-slate-600 font-semibold text-sm">Chưa có đơn hàng nào tại bàn hiện tại</p>
        <button
          onClick={() => navigate('/order')}
          className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
        >
          Xem thực đơn đặt món
        </button>
      </div>
    );
  }

  const currentStatusInfo = statusStepMap[order.status] || statusStepMap.PENDING;

  return (
    <div className="p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/order')}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft size={14} />
          <span>Gọi thêm món</span>
        </button>
        <button
          onClick={fetchOrder}
          className="p-1.5 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-200"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main Status Hero */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          {order.status === 'COOKING' ? (
            <ChefHat size={32} className="animate-pulse" />
          ) : order.status === 'READY' || order.status === 'COMPLETED' ? (
            <CheckCircle2 size={32} className="text-emerald-500" />
          ) : (
            <Clock size={32} />
          )}
        </div>

        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide mb-2 ${currentStatusInfo.color}`}>
          {currentStatusInfo.label}
        </span>
        <p className="text-xs text-slate-500">{currentStatusInfo.desc}</p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-600">
          <span>Mã đơn: <strong className="text-slate-800 font-mono">{order.orderNumber}</strong></span>
          <span>Bàn: <strong className="text-slate-800">{order.table?.tableNumber}</strong></span>
        </div>
      </div>

      {/* Order Item List with Per-item Realtime Status (US10) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2">
          Chi tiết món đã gọi ({order.items.length})
        </h3>

        <div className="space-y-2.5">
          {order.items.map((item) => (
            <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-700 font-extrabold text-[11px] flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="font-bold text-slate-800">{item.menuItem?.name}</span>
                </div>
                <span className="font-extrabold text-slate-800">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400 italic">
                  {item.note ? `Ghi chú: ${item.note}` : 'Không có ghi chú'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    item.status === 'READY'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'COOKING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status === 'READY'
                    ? 'Hoàn thành'
                    : item.status === 'COOKING'
                    ? 'Đang nấu'
                    : 'Chờ chế biến'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-extrabold text-sm">
          <span>Tổng tạm tính:</span>
          <span className="text-base text-orange-600">
            {order.totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
