import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { ShoppingBag, BellRing, Utensils, Clock } from 'lucide-react';

const CustomerLayout = () => {
  const { totalCount } = useCart();
  const { socket } = useSocket();

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
            <p className="text-[11px] text-navy-900 font-semibold">Đặt món QR tại bàn</p>
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

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex justify-around items-center z-40">
        <NavLink
          to="/order"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Utensils size={18} />
          <span>Thực đơn</span>
        </NavLink>

        <NavLink
          to="/order/cart"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors relative ${
              isActive ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-navy-900 text-white rounded-full w-4 h-4 text-[9px] font-extrabold flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </div>
          <span>Giỏ hàng</span>
        </NavLink>

        <NavLink
          to="/order/status"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Clock size={18} />
          <span>Theo dõi đơn</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CustomerLayout;
