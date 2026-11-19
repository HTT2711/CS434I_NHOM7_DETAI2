import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../components/layouts/AdminLayout';
import CustomerLayout from '../components/layouts/CustomerLayout';

// Features (10 Pages required in CS434 specification)
import LoginPage from '../features/auth/LoginPage';
import UserManagement from '../features/auth/UserManagement';
import MenuPage from '../features/customer-order/MenuPage';
import CartPage from '../features/customer-order/CartPage';
import OrderStatusPage from '../features/customer-order/OrderStatusPage';
import TableManagement from '../features/tables-qr/TableManagement';
import MenuManagement from '../features/menu-admin/MenuManagement';
import KitchenBoard from '../features/kitchen-kds/KitchenBoard';
import CashierDashboard from '../features/cashier/CashierDashboard';
import RevenueReport from '../features/reports/RevenueReport';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Đăng nhập (US01) - /login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Customer Mobile-first Pages */}
      <Route element={<CustomerLayout />}>
        {/* 2. Thực đơn Khách hàng (US07) - /order?tableId=X */}
        <Route path="/order" element={<MenuPage />} />
        <Route path="/order/:tableId" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:tableToken" element={<MenuPage />} />

        {/* 3. Giỏ hàng & Đặt món (US08) - /order/cart */}
        <Route path="/order/cart" element={<CartPage />} />

        {/* 4. Theo dõi trạng thái món (US08, US10) - /order/status */}
        <Route path="/order/status" element={<OrderStatusPage />} />
        <Route path="/order-status/:id" element={<OrderStatusPage />} />
      </Route>

      {/* Admin & Staff Desktop/Tablet Pages */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER', 'KITCHEN', 'WAITER']} />}>
        <Route element={<AdminLayout />}>
          {/* 9. Báo cáo & Thống kê Doanh thu (US16) - /admin/dashboard */}
          <Route path="/admin/dashboard" element={<RevenueReport />} />
          <Route path="/admin/reports" element={<Navigate to="/admin/dashboard" replace />} />

          {/* 8. Quản lý Sơ đồ bàn & Mã QR (US05, US06) - /admin/tables */}
          <Route path="/admin/tables" element={<TableManagement />} />

          {/* 7. Quản lý Thực đơn & Danh mục (US03, US04) - /admin/menu */}
          <Route path="/admin/menu" element={<MenuManagement />} />

          {/* 10. Quản lý Nhân viên (US02) - /admin/users */}
          <Route path="/admin/users" element={<UserManagement />} />

          {/* 5. Màn hình Bếp (KDS) (US09, US10, US11) - /kitchen */}
          <Route path="/kitchen" element={<KitchenBoard />} />

          {/* 6. Thu ngân — Sơ đồ bàn & Thanh toán (US12, US13, US14, US15) - /cashier */}
          <Route path="/cashier" element={<CashierDashboard />} />
        </Route>
      </Route>

      {/* Root Redirection */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
