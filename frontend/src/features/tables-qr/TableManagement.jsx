import React, { useState, useEffect } from 'react';
import { tableApi } from '../../services/table.api';
import { useSocket } from '../../context/SocketContext';
import QrCodeModal from './QrCodeModal';
import { Grid, Plus, QrCode, Users, Trash2, Edit2, RefreshCw } from 'lucide-react';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableForQr, setSelectedTableForQr] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
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
      socket.on('table-status-updated', (updated) => {
        setTables((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t))
        );
      });
    }

    return () => {
      if (socket) socket.off('table-status-updated');
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
      alert(err.message);
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await tableApi.updateStatus(tableId, newStatus);
      fetchTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này không?')) return;
    try {
      await tableApi.delete(tableId);
      fetchTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Trống</span>;
      case 'OCCUPIED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Có khách</span>;
      case 'RESERVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Đã đặt trước</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Bàn & Mã QR</h2>
          <p className="text-xs text-slate-500">Giám sát trạng thái bàn theo thời gian thực và in mã QR gọi món</p>
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
              className={`bg-white rounded-2xl p-5 border transition-shadow shadow-sm hover:shadow-md flex flex-col justify-between ${
                table.status === 'OCCUPIED'
                  ? 'border-orange-300 ring-1 ring-orange-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-slate-800">{table.tableNumber}</h3>
                  {getStatusBadge(table.status)}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Users size={14} />
                  <span>Sức chứa: {table.capacity} người</span>
                </div>

                {/* Active orders count on table */}
                {table.orders && table.orders.length > 0 && (
                  <div className="mb-4 p-2 bg-orange-50 rounded-lg text-xs text-orange-800 font-medium">
                    Có {table.orders.length} đơn đang gọi món
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedTableForQr(table)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <QrCode size={14} />
                  <span>Mã QR</span>
                </button>

                <div className="flex items-center gap-1">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-medium focus:outline-none"
                  >
                    <option value="AVAILABLE">Trống</option>
                    <option value="OCCUPIED">Có khách</option>
                    <option value="RESERVED">Đặt trước</option>
                  </select>

                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
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

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={!!selectedTableForQr}
        onClose={() => setSelectedTableForQr(null)}
        table={selectedTableForQr}
      />
    </div>
  );
};

export default TableManagement;
