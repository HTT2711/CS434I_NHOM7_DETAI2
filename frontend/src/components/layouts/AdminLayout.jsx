import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Grid,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  LogOut,
  Menu as MenuIcon,
  X,
  User,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Thống kê & Báo cáo', path: '/admin/reports', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Quản lý Bàn & QR', path: '/admin/tables', icon: Grid, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Quản lý Thực đơn', path: '/admin/menu', icon: UtensilsCrossed, roles: ['ADMIN'] },
    { name: 'Quản lý Nhân viên', path: '/admin/users', icon: User, roles: ['ADMIN'] },
    { name: 'Màn hình Bếp (KDS)', path: '/kitchen', icon: ChefHat, roles: ['ADMIN', 'KITCHEN'] },
    { name: 'Thu ngân & Hóa đơn', path: '/cashier', icon: Receipt, roles: ['ADMIN', 'CASHIER'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 font-bold text-xl tracking-wide text-orange-400">
          <span>🍽️ Tasty House POS</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-orange-400">
              <User size={16} />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-white">{user?.fullName || user?.username}</p>
              <p className="text-orange-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <MenuIcon size={24} />
          </button>

          <div className="text-sm font-medium text-slate-500">
            Hệ thống Quản lý Nhà hàng & Gọi món QR
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              ● Trực tuyến
            </span>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
