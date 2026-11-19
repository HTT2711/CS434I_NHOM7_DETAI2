import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Lock, User, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(username, password);
      if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.user.role === 'KITCHEN') navigate('/kitchen');
      else if (data.user.role === 'CASHIER') navigate('/cashier');
      else navigate('/admin/tables');
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Utensils size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Tasty House POS</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống Quản lý Bán hàng & Gọi món QR</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tài khoản</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold rounded-xl transition duration-150 shadow-md shadow-orange-500/20 text-sm flex justify-center items-center"
          >
            {submitting ? 'Đang xử lý...' : 'Đăng nhập hệ thống'}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
            Tài khoản dùng thử (Mật khẩu: 123456)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', '123456')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cashier', '123456')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
            >
              Thu ngân
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('kitchen', '123456')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
            >
              Bếp trưởng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
