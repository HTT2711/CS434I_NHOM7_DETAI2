import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo, { FoodClocheIcon } from '../../components/common/BrandLogo';
import logoImg from '../../assets/logo.jpg';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

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
      else if (data.user.role === 'KITCHEN') navigate('/bep');
      else if (data.user.role === 'CASHIER') navigate('/thu-ngan');
      else navigate('/admin/tables');
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 space-y-6">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-navy-900 transition"
        >
          <ArrowLeft size={14} />
          <span>Về trang chủ</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img
              src={logoImg}
              alt="Tasty House Logo"
              className="w-20 h-20 rounded-full border-2 border-gold shadow-md object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden">
              <FoodClocheIcon className="w-20 h-20" color="#dfc9a5" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-wider font-display uppercase">
            TASTY HOUSE
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Đăng nhập hệ thống Quản trị & Vận hành POS
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Tên đăng nhập
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username nhân viên"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 text-sm font-medium text-navy-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 text-sm font-medium text-navy-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl transition shadow text-sm flex justify-center items-center disabled:opacity-60"
          >
            {submitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider text-center">
            Đăng nhập nhanh 1 chạm (Mật khẩu: 123456)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', '123456')}
              className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-navy-900 rounded-lg text-xs font-semibold text-center transition"
            >
              Quản trị viên
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cashier', '123456')}
              className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-navy-900 rounded-lg text-xs font-semibold text-center transition"
            >
              Thu ngân
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('kitchen', '123456')}
              className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-navy-900 rounded-lg text-xs font-semibold text-center transition"
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
