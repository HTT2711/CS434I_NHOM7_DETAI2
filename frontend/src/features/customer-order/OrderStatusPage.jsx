import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/order.api';
import { useSocket } from '../../context/SocketContext';
import { Clock, CheckCircle2, ChefHat, Utensils, ArrowLeft, RefreshCw } from 'lucide-react';

const statusStepMap = {
  PENDING: { label: 'Đã nhận đơn', step: 1, desc: 'Đơn hàng đang chờ nhà bếp tiếp nhận' },
  CONFIRMED: { label: 'Đã xác nhận', step: 2, desc: 'Bếp đã tiếp nhận đơn của bạn' },
  COOKING: { label: 'Đang chế biến', step: 3, desc: 'Đầu bếp đang thực hiện các món ăn' },
  READY: { label: 'Món ăn đã sẵn sàng', step: 4, desc: 'Món đã hoàn thành, chuẩn bị đem ra bàn' },
  SERVED: { label: 'Đã phục vụ', step: 5, desc: 'Món ăn đã được phục vụ tại bàn' },
  COMPLETED: { label: 'Đã thanh toán', step: 6, desc: 'Cảm ơn quý khách đã dùng bữa!' },
  CANCELLED: { label: 'Đã hủy đơn', step: 0, desc: 'Đơn hàng đã được hủy' },
};

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await orderApi.getById(id);
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

    if (socket) {
      socket.on('order-status-updated', (updatedOrder) => {
        if (updatedOrder.id === Number(id)) {
          setOrder((prev) => ({ ...prev, ...updatedOrder }));
        }
      });

      socket.on('order-completed', (invoice) => {
        if (invoice.orderId === Number(id)) {
          fetchOrder();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('order-status-updated');
        socket.off('order-completed');
      }
    };
  }, [id, socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 mb-4">Không tìm thấy đơn hàng</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold"
        >
          Quay lại thực đơn
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
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
        >
          <ArrowLeft size={14} />
          <span>Gọi thêm món</span>
        </button>
        <button
          onClick={fetchOrder}
          className="p-1.5 text-slate-500 hover:text-slate-900 bg-white rounded-lg border border-slate-200"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main Status Hero */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          {order.status === 'COOKING' ? (
            <ChefHat size={32} className="animate-pulse" />
          ) : order.status === 'COMPLETED' ? (
            <CheckCircle2 size={32} className="text-emerald-500" />
          ) : (
            <Clock size={32} />
          )}
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 mb-2">
          {currentStatusInfo.label}
        </span>
        <p className="text-xs text-slate-500">{currentStatusInfo.desc}</p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-600">
          <span>Mã đơn: <strong className="text-slate-800">{order.orderNumber}</strong></span>
          <span>Bàn: <strong className="text-slate-800">{order.table?.tableNumber}</strong></span>
        </div>
      </div>

      {/* Order Item List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
          Chi tiết món đã đặt ({order.items.length})
        </h3>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">{item.quantity}x</span>
                <div>
                  <p className="font-medium text-slate-800">{item.menuItem?.name}</p>
                  {item.note && <p className="text-xs text-slate-400 italic">{item.note}</p>}
                </div>
              </div>
              <span className="font-semibold text-slate-700">
                {(item.price * item.quantity).toLocaleString('vi-VN')} đ
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-bold text-base">
          <span>Tổng cộng:</span>
          <span className="text-orange-600">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
