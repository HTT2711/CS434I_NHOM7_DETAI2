import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Phân quyền theo vai trò người dùng (doc.md mục 10.5 & US01)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Điều hướng êm dịu về đúng không gian làm việc của vai trò hiện tại
    if (user.role === 'CASHIER') {
      return <Navigate to="/thu-ngan" replace />;
    }
    if (user.role === 'KITCHEN') {
      return <Navigate to="/bep" replace />;
    }
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
