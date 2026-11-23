import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import BrandLogo from '../common/BrandLogo';
import {
  BarChart2,
  ClipboardList,
  Receipt,
  UtensilsCrossed,
  Grid,
  CalendarCheck,
  Tag,
  User,
  ChefHat,
  History,
  Bell,
  LogOut,
  Menu as MenuIcon,
  X,
  Radio,
  Sliders,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Tải danh sách thông báo thực tế từ các yêu cầu hỗ trợ bàn
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/support-requests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const pending = data.data.filter((r) => r.status === 'cho_xu_ly');
          setNotifications(
            pending.map((r) => ({
              id: r.id,
              title: `Yêu cầu hỗ trợ Bàn ${r.tableId}`,
              desc: r.reason,
              time: 'Cần hỗ trợ',
              unread: true,
              link: '/thu-ngan',
            }))
          );
        }
      } catch {
        // silent
      }
    };
    fetchInitialNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (order) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: 'Đơn hàng mới',
          desc: `Có đơn mới từ ${order.table?.tableNumber || 'Bàn'} (${order.totalAmount?.toLocaleString('vi-VN')}đ)`,
          time: 'Vừa xong',
          unread: true,
          link: '/thu-ngan',
        },
        ...prev,
      ]);
    };

    const handleCallWaiter = (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: 'Khách gọi phục vụ',
          desc: `${data.tableNumber || 'Bàn'}: ${data.reason}`,
          time: 'Vừa xong',
          unread: true,
          link: '/thu-ngan',
        },
        ...prev,
      ]);
    };

    socket.emit('join-staff');

    socket.on('new_order', handleNewOrder);
    socket.on('order-created', handleNewOrder);
    socket.on('call-waiter', handleCallWaiter);
    socket.on('waiter-called', handleCallWaiter);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order-created', handleNewOrder);
      socket.off('call-waiter', handleCallWaiter);
      socket.off('waiter-called', handleCallWaiter);
    };
  }, [socket]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isKitchenPath = location.pathname.startsWith('/bep') || location.pathname.startsWith('/kitchen');
  const isCashierPath = location.pathname.startsWith('/thu-ngan') || location.pathname.startsWith('/cashier');

  // Dynamic navigation strictly based on user.role
  const getNavItems = () => {
    // 1. Kitchen Staff: only Kitchen tasks
    if (user?.role === 'KITCHEN') {
      return [
        { name: 'Đơn cần chế biến', path: '/bep', icon: ChefHat, badge: 3 },
        { name: 'Lịch sử chế biến', path: '/bep/lich-su', icon: History },
      ];
    }

    // 2. Cashier: 6 mục chuẩn theo hình ảnh giao diện Thu ngân
    if (user?.role === 'CASHIER') {
      return [
        { name: 'Sơ đồ bàn', path: '/thu-ngan', icon: Grid },
        { name: 'Đơn hàng', path: '/thu-ngan/don-hang', icon: ClipboardList },
        { name: 'Hóa đơn', path: '/thu-ngan/hoa-don', icon: Receipt, badge: 1 },
        { name: 'Yêu cầu hỗ trợ', path: '/thu-ngan/yeu-cau', icon: Bell, badge: 1 },
        { name: 'Đặt bàn trước', path: '/thu-ngan/dat-ban', icon: CalendarCheck, badge: 1 },
        { name: 'Thống kê & báo cáo', path: '/thu-ngan/thong-ke', icon: BarChart2 },
      ];
    }

    // 3. Admin: 9 mục chuẩn như hình ảnh thiết kế
    return [
      { name: 'Thống kê & báo cáo', path: '/admin/dashboard', icon: BarChart2 },
      { name: 'Đơn hàng', path: '/admin/don-hang', icon: ClipboardList },
      { name: 'Hóa đơn', path: '/admin/hoa-don', icon: Receipt },
      { name: 'Thực đơn', path: '/admin/menu', icon: UtensilsCrossed },
      { name: 'Bàn & mã QR', path: '/admin/tables', icon: Grid },
      { name: 'Đặt bàn', path: '/admin/dat-ban', icon: CalendarCheck },
      { name: 'Khuyến mãi', path: '/admin/khuyen-mai', icon: Tag },
      { name: 'Nhân viên', path: '/admin/users', icon: User },
      { name: 'Cài đặt', path: '/admin/settings', icon: Sliders },
    ];
  };

  const navItems = getNavItems();

  const getSubheading = () => {
    if (user?.role === 'ADMIN') return 'QUẢN TRỊ VIÊN';
    if (user?.role === 'CASHIER') return 'THU NGÂN';
    if (user?.role === 'KITCHEN') return 'NHÂN VIÊN BẾP';
    return 'HỆ THỐNG POS';
  };

  const getDisplayName = () => {
    if (user) {
      const roleText =
        user.role === 'ADMIN'
          ? 'Quản trị viên'
          : user.role === 'CASHIER'
          ? 'Thu ngân'
          : 'Bếp trưởng';
      return {
        name: user.fullName || user.username,
        username: `@${user.username} • ${roleText}`,
        role: user.role,
      };
    }
    return { name: 'Nhân viên Tasty House', username: '@pos', role: null };
  };

  const userInfo = getDisplayName();

  return (
    <div className="min-h-screen flex bg-white text-navy-900 font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Ảnh 5, 6, 7: Nền xanh đen sâu #0b1329, mục chọn nền vàng kem #dfc9a5) */}
      <aside
        style={{ backgroundColor: '#0b1329' }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Subheading (Ảnh 5, 6, 7) */}
          <div className="px-6 pt-6 pb-4">
            <Link to="/" className="block">
              <BrandLogo size="md" lightText={true} />
            </Link>
            <div className="mt-3 text-[11px] font-bold text-gold tracking-widest uppercase">
              {getSubheading()}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: '#dfc9a5', color: '#0b1329' }
                      : { color: '#d6d3d1' }
                  }
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gold text-navy-900 font-bold shadow-sm'
                        : 'text-stone-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-navy-900 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout (Ảnh 5, 6, 7) */}
        <div className="p-4 border-t border-white/10">
          <div className="mb-2 text-xs">
            <div className="font-bold text-white truncate">{userInfo.name}</div>
            <div className="text-stone-400 text-[11px]">{userInfo.username}</div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-stone-300 hover:text-white transition py-1"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Navbar */}
        <header className="h-16 px-6 lg:px-8 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              <MenuIcon size={22} />
            </button>
            <h2 className="text-lg font-bold text-navy-900 hidden sm:block">
              {isKitchenPath
                ? 'Màn hình Bếp (KDS)'
                : isCashierPath
                ? 'Khu vực Thu ngân'
                : 'Bảng điều khiển Quản trị'}
            </h2>
          </div>

          {/* Right Controls: Bếp trực tuyến, Chuông thông báo */}
          <div className="flex items-center gap-4">
            {isKitchenPath && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Bếp trực tuyến
              </span>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl transition relative"
                title="Thông báo hệ thống"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-navy-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden font-sans">
                  <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-navy-900 font-display">Thông báo</h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-bold text-navy-900 hover:underline"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400">
                        Chưa có thông báo nào.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (n.link) navigate(n.link);
                          }}
                          className={`p-3.5 hover:bg-stone-50 cursor-pointer transition flex items-start gap-3 ${
                            n.unread ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-amber-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-navy-900 line-clamp-1">{n.title}</h5>
                              <span className="text-[10px] text-stone-400 shrink-0 ml-2">{n.time}</span>
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5 leading-snug">{n.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
