import React from 'react';
import { ChefHat, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const OrderTicketCard = ({ order, onUpdateStatus, onUpdateItemStatus }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">Mới nhận</span>;
      case 'COOKING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">Đang nấu</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">Xong</span>;
      default:
        return null;
    }
  };

  const timeFormatted = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Ticket Header */}
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <span className="text-base font-extrabold text-gold-500">{order.table?.tableNumber}</span>
          <p className="text-[10px] text-slate-400 font-mono">{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <Clock size={12} />
            {timeFormatted}
          </span>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Ticket Items */}
      <div className="p-4 space-y-3 flex-1">
        {order.items.map((item) => (
          <div
            key={item.id}
            className={`p-2 rounded-xl border flex items-start justify-between gap-2 transition-colors ${
              item.status === 'READY'
                ? 'bg-emerald-50/50 border-emerald-200 opacity-60'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-stone-200 text-navy-900 font-bold text-xs flex items-center justify-center shrink-0">
                {item.quantity}
              </span>
              <div>
                <p className="font-bold text-xs text-slate-800 leading-snug">{item.menuItem?.name}</p>
                {item.note && (
                  <p className="text-[11px] text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    <span>{item.note}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateItemStatus(
                  item.id,
                  item.status === 'READY' ? 'COOKING' : 'READY'
                )
              }
              className={`p-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                item.status === 'READY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500'
              }`}
            >
              <CheckCircle2 size={16} />
            </button>
          </div>
        ))}

        {order.note && (
          <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
            <strong>Ghi chú đơn:</strong> {order.note}
          </div>
        )}
      </div>

      {/* Ticket Footer Action Buttons */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
        {order.status === 'PENDING' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'COOKING')}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ChefHat size={16} />
            <span>Bắt đầu nấu</span>
          </button>
        )}

        {order.status === 'COOKING' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'READY')}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 size={16} />
            <span>Báo đã xong món</span>
          </button>
        )}

        {order.status === 'READY' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'SERVED')}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <span>Đã đưa ra bàn</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderTicketCard;
