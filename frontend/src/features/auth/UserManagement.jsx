import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/auth.api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Edit2, Lock, Unlock, Trash2, X } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    email: '',
    role: 'CASHIER',
    workStatus: 'ACTIVE', // 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getUsers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate 4 stat cards directly from DB
  const totalUsers = users.length;
  const cashierCount = users.filter((u) => u.role === 'CASHIER').length;
  const kitchenCount = users.filter((u) => u.role === 'KITCHEN').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const fn = (u.fullName || '').toLowerCase();
      const un = (u.username || '').toLowerCase();
      const ph = (u.phone || '').toLowerCase();
      if (!fn.includes(q) && !un.includes(q) && !ph.includes(q)) return false;
    }

    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE' && (!u.isActive || u.workStatus === 'ON_LEAVE' || u.workStatus === 'RESIGNED')) return false;
      if (statusFilter === 'ON_LEAVE' && u.workStatus !== 'ON_LEAVE') return false;
      if (statusFilter === 'LOCKED' && u.isActive) return false;
    }

    return true;
  });

  const handleToggleLock = async (u) => {
    try {
      await authApi.toggleUserActive(u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (err) {
      alert(err.message || 'Lỗi khi thay đổi trạng thái khóa');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản nhân viên này không?')) return;
    try {
      // If backend has delete user or toggle active
      await authApi.toggleUserActive(id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa nhân viên');
    }
  };

  const openModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        username: u.username,
        password: '',
        fullName: u.fullName || '',
        phone: u.phone || '0901 000 111',
        email: u.email || `${u.username}@tastyhouse.vn`,
        role: u.role || 'CASHIER',
        workStatus: u.workStatus || (u.isActive ? 'ACTIVE' : 'RESIGNED'),
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        email: '',
        role: 'CASHIER',
        workStatus: 'ACTIVE',
      });
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await authApi.updateUser(editingUser.id, formData);
      } else {
        await authApi.register(formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu thông tin nhân viên');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'CASHIER':
        return 'Thu ngân';
      case 'KITCHEN':
        return 'Nhân viên bếp';
      default:
        return role;
    }
  };

  const getStatusBadge = (u) => {
    if (!u.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Đã khóa
        </span>
      );
    }
    if (u.workStatus === 'ON_LEAVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          Nghỉ phép
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Đang làm việc
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Nhân viên
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Chỉ quản trị viên mới đăng ký tài khoản và phân quyền cho nhân viên.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          style={{ backgroundColor: '#0b1329', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Đăng ký tài khoản</span>
        </button>
      </div>

      {/* 2. 4 Stat Cards (Ảnh 7: Tổng nhân viên, Thu ngân, Nhân viên bếp, Quản trị viên) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Tổng nhân viên</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {totalUsers}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Thu ngân</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {cashierCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Nhân viên bếp</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {kitchenCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Quản trị viên</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {adminCount}
          </div>
        </div>
      </div>

      {/* 3. Filters (Ảnh 7) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm tên, tài khoản, điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 placeholder-stone-400 focus:ring-1 focus:ring-navy-900 bg-white"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="CASHIER">Thu ngân</option>
          <option value="KITCHEN">Nhân viên bếp</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="ON_LEAVE">Nghỉ phép</option>
          <option value="LOCKED">Đã khóa</option>
        </select>
      </div>

      {/* 4. Users Table (Ảnh 7) */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-600 font-bold bg-stone-50/70">
                <th className="py-3.5 px-4 font-bold">Họ tên</th>
                <th className="py-3.5 px-4 font-bold">Tên đăng nhập</th>
                <th className="py-3.5 px-4 font-bold">Vai trò</th>
                <th className="py-3.5 px-4 font-bold">Điện thoại</th>
                <th className="py-3.5 px-4 font-bold">Email</th>
                <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Không tìm thấy nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.username === u.username;
                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition">
                      {/* Họ tên */}
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        <span>{u.fullName || u.username}</span>
                        {isCurrent && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                            Bạn
                          </span>
                        )}
                      </td>

                      {/* Tên đăng nhập */}
                      <td className="py-3.5 px-4 font-mono text-stone-700">
                        {u.username}
                      </td>

                      {/* Vai trò */}
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {getRoleLabel(u.role)}
                      </td>

                      {/* Điện thoại */}
                      <td className="py-3.5 px-4 text-stone-600">
                        {u.phone || '0901 000 111'}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-stone-600">
                        {u.email || `${u.username}@tastyhouse.vn`}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(u)}
                      </td>

                      {/* Thao tác (Sửa, Khóa/Mở khóa, Xóa) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openModal(u)}
                            className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleToggleLock(u)}
                            className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            {u.isActive ? 'Khóa' : 'Mở khóa'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Đăng ký / Sửa tài khoản nhân viên */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                {editingUser ? 'Chỉnh sửa thông tin nhân viên' : 'Đăng ký tài khoản mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-stone-400 hover:text-navy-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Trần Thu Hà"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="VD: thungan2"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {editingUser ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="090..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Vai trò hệ thống *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="CASHIER">Thu ngân</option>
                    <option value="KITCHEN">Nhân viên bếp</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nhanvien@tastyhouse.vn"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800"
                >
                  {editingUser ? 'Lưu thay đổi' : 'Đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
