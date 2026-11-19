import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { ShoppingBag, BellRing } from 'lucide-react';

const CustomerLayout = () => {
  const { totalCount } = useCart();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleCallWaiter = () => {
    const tableInfo = localStorage.getItem('current_table');
    const table = tableInfo ? JSON.parse(tableInfo) : null;

    if (socket && table) {
      socket.emit('call-waiter', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        time: new Date().toLocaleTimeString(),
      });
      alert(`Đã gửi yêu cầu gọi phục vụ tới nhân viên cho ${table.tableNumber}!`);
    } else {
      alert('Đã gửi yêu cầu gọi phục vụ!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl relative border-x border-slate-200">
      {/* Customer Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight text-base">Tasty House</h1>
            <p className="text-xs text-orange-600 font-medium">Đặt món tại bàn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCallWaiter}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 active:scale-95 transition-transform"
          >
            <BellRing size={14} />
            <span>Gọi phục vụ</span>
          </button>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
