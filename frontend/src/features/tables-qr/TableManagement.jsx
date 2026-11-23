import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../services/table.api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import QrCodeModal from './QrCodeModal';
import { Plus, QrCode, Users, Trash2, Edit2, RefreshCw, RotateCcw, AlertCircle, MapPin, Printer, Receipt } from 'lucide-react';

const TableManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableForQr, setSelectedTableForQr] = useState(null);

  // Add Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newArea, setNewArea] = useState('Tầng 1');
  const [newCapacity, setNewCapacity] = useState(4);

  // Edit Table Modal
  const [editingTable, setEditingTable] = useState(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editArea, setEditArea] = useState('Khu A - Tầng 1');
  const [editCapacity, setEditCapacity] = useState(4);
  const [editStatus, setEditStatus] = useState('AVAILABLE');

  const { socket } = useSocket();

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await tableApi.getAll();
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    if (socket) {
      socket.emit('join-staff');
      socket.on('table_status_updated', () => fetchTables());
      socket.on('table-status-updated', () => fetchTables());
      socket.on('new_order', () => fetchTables());
      socket.on('order-created', () => fetchTables());
      socket.on('order-completed', () => fetchTables());
    }

    return () => {
      if (socket) {
        socket.off('table_status_updated');
        socket.off('table-status-updated');
        socket.off('new_order');
        socket.off('order-created');
        socket.off('order-completed');
      }
    };
  }, [socket]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const res = await tableApi.create({
        tableNumber: newTableNumber,
        area: newArea,
        capacity: newCapacity,
      });
      if (res.success) {
        setNewTableNumber('');
        setShowAddModal(false);
        fetchTables();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo bàn');
    }
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setEditTableNumber(table.tableNumber);
    setEditArea(table.area || 'Khu A - Tầng 1');
    setEditCapacity(table.capacity);
    setEditStatus(table.status);
  };

  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return;
    try {
      await tableApi.update(editingTable.id, {
        tableNumber: editTableNumber,
        area: editArea,
        capacity: editCapacity,
        status: editStatus,
      });
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật thông tin bàn');
    }
  };

  const handleRegenerateQr = async (tableId) => {
    if (!window.confirm('Tạo lại mã QR mới sẽ vô hiệu hóa mã QR cũ của bàn này. Bạn có chắc chắn muốn tạo lại không?')) return;
    try {
      const res = await tableApi.regenerateQr(tableId);
      if (res.success) {
        alert('Tạo lại mã QR mới thành công!');
        fetchTables();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo lại mã QR');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!isAdmin) {
      alert('Thao tác không được phép: Chỉ Quản trị viên (ADMIN) mới có quyền xóa bàn ăn. Tài khoản hiện tại: ' + (user?.role || 'Khác'));
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này không?')) return;
    try {
      await tableApi.delete(tableId);
      fetchTables();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa bàn');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Trống</span>;
      case 'OCCUPIED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Có khách</span>;
      case 'WAITING_PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ thanh toán</span>;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-900 text-gold rounded-xl">
              <QrCode className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-navy-900 font-display">
              Quản Lý Bàn Ăn & Mã QR
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Quản lý sơ đồ bàn, tự động sinh mã QR token ngẫu nhiên và in thẻ Tent Card đặt món tại bàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="p-2.5 bg-white border border-stone-300 text-stone-600 rounded-xl hover:bg-stone-50 transition shadow-sm"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: '#0b1329' }}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus size={18} />
            <span>Thêm bàn mới</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Đang tải danh sách bàn...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                table.status === 'OCCUPIED'
                  ? 'border-blue-300 ring-2 ring-blue-100'
                  : table.status === 'WAITING_PAYMENT'
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-lg text-navy-900 font-display">{table.tableNumber}</h3>
                  {getStatusBadge(table.status)}
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-navy-900" />
                    <span>Khu vực: <strong>{table.area || 'Khu A - Tầng 1'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-stone-400" />
                    <span>Sức chứa: <strong>{table.capacity}</strong> khách</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-navy-900 bg-stone-50 p-2 rounded-xl mb-3 truncate border border-stone-100">
                  /order?token={table.token || table.id}
                </div>

                {(table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') && (
                  <button
                    onClick={() => navigate(`/thu-ngan?tableId=${table.id}`)}
                    className="w-full mb-3 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Receipt size={14} />
                    <span>Mở POS thanh toán</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setSelectedTableForQr(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 text-navy-900 hover:bg-stone-200 rounded-xl text-xs font-bold transition"
                >
                  <Printer size={14} />
                  <span>Tent Card</span>
                </button>

                <button
                  onClick={() => handleRegenerateQr(table.id)}
                  className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition"
                  title="Tạo lại mã QR mới"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={() => openEditModal(table)}
                  className="p-2 text-stone-500 hover:text-navy-900 hover:bg-stone-100 rounded-xl transition"
                  title="Chỉnh sửa bàn"
                >
                  <Edit2 size={15} />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Xóa bàn"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Bàn */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 font-display mb-4">Thêm Bàn Ăn Mới</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Tên / Số bàn (Ví dụ: Bàn 09)
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="Bàn ..."
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Khu vực đặt bàn
                </label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm bg-white"
                >
                  <option value="Tầng 1">Tầng 1 (Sảnh chính)</option>
                  <option value="Tầng 2">Tầng 2 (Không gian ấm cúng)</option>
                  <option value="Sân vườn">Sân vườn (Thoáng đãng)</option>
                  <option value="Phòng VIP">Phòng VIP (Riêng tư)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Sức chứa (Số ghế)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                >
                  Thêm bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Bàn */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 font-display mb-4">Cập Nhật Thông Tin Bàn</h3>
            <form onSubmit={handleUpdateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Tên / Số bàn</label>
                <input
                  type="text"
                  required
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Khu vực</label>
                <input
                  type="text"
                  required
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Sức chứa</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Trạng thái hiện tại</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 text-sm bg-white"
                >
                  <option value="AVAILABLE">Trống (Sẵn sàng phục vụ)</option>
                  <option value="OCCUPIED">Có khách đang ngồi</option>
                  <option value="WAITING_PAYMENT">Chờ thanh toán</option>
                  <option value="RESERVED">Đã đặt trước</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mã QR & In Tent Card */}
      <QrCodeModal
        isOpen={!!selectedTableForQr}
        onClose={() => setSelectedTableForQr(null)}
        table={selectedTableForQr}
      />
    </div>
  );
};

export default TableManagement;
