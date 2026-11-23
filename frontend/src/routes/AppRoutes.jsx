import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../components/layouts/AdminLayout';
import CustomerLayout from '../components/layouts/CustomerLayout';

// Features
import HomePage from '../features/home/HomePage';
import LoginPage from '../features/auth/LoginPage';
import UserManagement from '../features/auth/UserManagement';
import TableOrderPage from '../features/customer-order/TableOrderPage';
import CartPage from '../features/customer-order/CartPage';
import OrderStatusPage from '../features/customer-order/OrderStatusPage';
import TableManagement from '../features/tables-qr/TableManagement';
import MenuManagement from '../features/menu-admin/MenuManagement';
import KitchenBoard from '../features/kitchen-kds/KitchenBoard';
import KitchenHistoryPage from '../features/kitchen-kds/KitchenHistoryPage';
import CashierDashboard from '../features/cashier/CashierDashboard';
import SupportRequestsPage from '../features/cashier/SupportRequestsPage';
import RevenueReport from '../features/reports/RevenueReport';
import PromotionManagement from '../features/promotions/PromotionManagement';
import ReservationManagement from '../features/reservations/ReservationManagement';
import OrderListPage from '../features/orders/OrderListPage';
import InvoiceListPage from '../features/invoices/InvoiceListPage';
import SettingsPage from '../features/settings/SettingsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Trang chủ giới thiệu ẩm thực & Lối vào nhân viên (/) */}
      <Route path="/" element={<HomePage />} />

      {/* 2. Đăng nhập (US01) - /login */}
      <Route path="/login" element={<LoginPage />} />

      {/* 3. Khách hàng gọi món tại bàn (Mobile-first) */}
      <Route path="/ban/:tableId" element={<TableOrderPage />} />
      <Route path="/order" element={<TableOrderPage />} />
      <Route path="/order/:tableId" element={<TableOrderPage />} />
      <Route path="/menu" element={<TableOrderPage />} />
      <Route path="/menu/:tableToken" element={<TableOrderPage />} />

      {/* Trang giỏ hàng & theo dõi đơn khách hàng */}
      <Route element={<CustomerLayout />}>
        <Route path="/order/cart" element={<CartPage />} />
        <Route path="/order/status" element={<OrderStatusPage />} />
        <Route path="/order-status/:id" element={<OrderStatusPage />} />
      </Route>

      {/* 4. Phân hệ Dành riêng cho Quản trị viên (ADMIN ONLY) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          {/* Dashboard & Thống kê doanh thu (US22) */}
          <Route path="/admin" element={<RevenueReport />} />
          <Route path="/admin/dashboard" element={<RevenueReport />} />
          <Route path="/admin/reports" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Sơ đồ Bàn & Tent Card QR (US05, US06) */}
          <Route path="/admin/tables" element={<TableManagement />} />
          <Route path="/admin/ban" element={<TableManagement />} />

          {/* Quản lý Thực đơn & Danh mục (US03, US04) */}
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/thuc-don" element={<MenuManagement />} />

          {/* Quản lý Nhân sự (US02) */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/nhan-vien" element={<UserManagement />} />

          {/* Cấu hình hệ thống & Thuế VAT (US21) */}
          <Route path="/admin/settings" element={<SettingsPage />} />

          {/* Khuyến mãi & Voucher */}
          <Route path="/admin/khuyen-mai" element={<PromotionManagement />} />

          {/* Quản lý Đặt bàn */}
          <Route path="/admin/dat-ban" element={<ReservationManagement />} />

          {/* Tra cứu Toàn bộ Đơn hàng & Lịch sử Hóa đơn */}
          <Route path="/admin/don-hang" element={<OrderListPage />} />
          <Route path="/admin/hoa-don" element={<InvoiceListPage />} />
        </Route>
      </Route>

      {/* 5. Phân hệ Thu ngân & POS (Dành cho CASHIER & ADMIN) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/thu-ngan" element={<CashierDashboard />} />
          <Route path="/thu-ngan/yeu-cau" element={<SupportRequestsPage />} />
          <Route path="/thu-ngan/dat-ban" element={<ReservationManagement />} />
          <Route path="/thu-ngan/don-hang" element={<OrderListPage />} />
          <Route path="/thu-ngan/hoa-don" element={<InvoiceListPage />} />
          <Route path="/thu-ngan/thong-ke" element={<RevenueReport />} />
          <Route path="/thu-ngan/reports" element={<RevenueReport />} />
        </Route>
      </Route>

      {/* 6. Phân hệ Màn hình Bếp KDS (Dành cho KITCHEN & ADMIN) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'KITCHEN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/kitchen" element={<KitchenBoard />} />
          <Route path="/bep" element={<KitchenBoard />} />
          <Route path="/bep/lich-su" element={<KitchenHistoryPage />} />
        </Route>
      </Route>

      {/* Fallback Redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
