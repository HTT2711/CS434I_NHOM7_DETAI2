import React, { useState, useEffect } from 'react';
import { tableApi } from '../../services/table.api';
import { useSocket } from '../../context/SocketContext';
import QrCodeModal from './QrCodeModal';
import { Plus, QrCode, Users, Trash2, Edit2, RefreshCw, AlertCircle } from 'lucide-react';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableForQr, setSelectedTableForQr] = useState(null);

  // Add Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);

  // Edit Table Modal
  const [editingTable, setEditingTable] = useState(null);
  const [editTableNumber, setEditTableNumber] = useState('');
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
      socket.on('table_status_updated', () => fetchTables());
      socket.on('table-status-updated', () => fetchTables());
    }

    return () => {
      if (socket) {
        socket.off('table_status_updated');
        socket.off('table-status-updated');
      }
    };
  }, [socket]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const res = await tableApi.create({
        tableNumber: newTableNumber,
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
    setEditCapacity(table.capacity);
    setEditStatus(table.status);
  };

  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return;
    try {
      await tableApi.update(editingTable.id, {
        tableNumber: editTableNumber,
        capacity: editCapacity,
        status: editStatus,
      });
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật thông tin bàn');
    }
  };

  const handleDeleteTable = async (tableId) => {
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Trống</span>;
      case 'OCCUPIED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Có khách</span>;
      case 'WAITING_PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ thanh toán</span>;
      case 'RESERVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Đã đặt trước</span>;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Sơ đồ bàn & Mã QR (US05 & US06)</h2>
          <p className="text-xs text-slate-500">
            Giám sát trạng thái bàn thời gian thực và tự động tạo mã QR (/order?tableId=X) tải ảnh PNG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTables}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus size={16} />
            <span>Thêm bàn mới</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                table.status === 'OCCUPIED'
                  ? 'border-orange-300 ring-1 ring-orange-200'
                  : table.status === 'WAITING_PAYMENT'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-base text-slate-800">{table.tableNumber}</h3>
                  {getStatusBadge(table.status)}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Users size={14} />
                  <span>Sức chứa: <strong>{table.capacity}</strong> người</span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-1.5 rounded-lg mb-4 truncate">
                  /order?tableId={table.id}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setSelectedTableForQr(table)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <QrCode size={14} />
                  <span>Mã QR (PNG)</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(table)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Sửa thông tin bàn"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa bàn"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Thêm bàn mới</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên / Số bàn</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bàn 09"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sức chứa (người)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-md shadow-orange-500/20"
                >
                  Tạo bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Chỉnh sửa thông tin bàn</h3>
            <form onSubmit={handleUpdateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên / Số bàn</label>
                <input
                  type="text"
                  required
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sức chứa (người)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Trạng thái bàn</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="AVAILABLE">Trống</option>
                  <option value="OCCUPIED">Có khách</option>
                  <option value="WAITING_PAYMENT">Chờ thanh toán</option>
                  <option value="RESERVED">Đặt trước</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal (US06: qrcode.react + PNG Download) */}
      <QrCodeModal
        isOpen={!!selectedTableForQr}
        onClose={() => setSelectedTableForQr(null)}
        table={selectedTableForQr}
      />
    </div>
  );
};

export default TableManagement;
