import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../components/layouts/AdminLayout';
import CustomerLayout from '../components/layouts/CustomerLayout';

// Features
import LoginPage from '../features/auth/LoginPage';
import UserManagement from '../features/auth/UserManagement';
import MenuPage from '../features/customer-order/MenuPage';
import OrderStatusPage from '../features/customer-order/OrderStatusPage';
import TableManagement from '../features/tables-qr/TableManagement';
import MenuManagement from '../features/menu-admin/MenuManagement';
import KitchenBoard from '../features/kitchen-kds/KitchenBoard';
import CashierDashboard from '../features/cashier/CashierDashboard';
import RevenueReport from '../features/reports/RevenueReport';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Customer QR Ordering Routes (US07, UC03: /order?tableId=X or /order/:tableId or /menu/:tableToken) */}
      <Route element={<CustomerLayout />}>
        <Route path="/order" element={<MenuPage />} />
        <Route path="/order/:tableId" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:tableToken" element={<MenuPage />} />
        <Route path="/order-status/:id" element={<OrderStatusPage />} />
      </Route>

      {/* Admin / Staff Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER', 'KITCHEN', 'WAITER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/reports" element={<RevenueReport />} />
          <Route path="/admin/tables" element={<TableManagement />} />
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/kitchen" element={<KitchenBoard />} />
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
