import React, { useState, useEffect } from 'react';
import { reservationApi } from '../../services/reservation.api';
import { tableApi } from '../../services/table.api';
import { Plus, Search, Calendar, X, Users, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal
  const [selectedResv, setSelectedResv] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 4,
    reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    tableId: '',
    note: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resResv, resTables] = await Promise.all([
        reservationApi.getAll(),
        tableApi.getAll(),
      ]);
      setReservations(resResv.data || []);
      setTables(resTables.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đặt bàn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReservations = reservations.filter((r) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (r.customerName || '').toLowerCase();
      const phone = (r.customerPhone || '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q)) return false;
    }

    if (dateFilter) {
      const rDate = new Date(r.reservationTime).toISOString().split('T')[0];
      if (rDate !== dateFilter) return false;
    }

    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    return true;
  });

  const handleUpdateStatus = async (id, status) => {
    try {
      await reservationApi.update(id, { status });
      setSelectedResv((prev) => (prev ? { ...prev, status } : null));
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...addFormData,
        partySize: Number(addFormData.partySize),
        tableId: addFormData.tableId ? Number(addFormData.tableId) : null,
      };
      await reservationApi.create(payload);
      setShowAddModal(false);
      setAddFormData({
        customerName: '',
        customerPhone: '',
        partySize: 4,
        reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        tableId: '',
        note: '',
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi tạo lịch đặt bàn');
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING' || s === 'CHO_XAC_NHAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Chờ xác nhận
        </span>
      );
    }
    if (s === 'CONFIRMED' || s === 'DA_XAC_NHAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Đã xác nhận
        </span>
      );
    }
    if (s === 'ARRIVED' || s === 'COMPLETED' || s === 'DA_DEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Đã đến
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'DA_HUY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Đã hủy
        </span>
      );
    }
    return <span className="text-xs text-stone-500">{status}</span>;
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} · ${date}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Đặt bàn trước
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#0b1329', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Thêm lịch đặt bàn</span>
        </button>
      </div>

      {/* 2. Filters Bar (Ảnh 5) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 bg-white"
          />
        </div>

        {/* Date */}
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="ARRIVED">Đã đến</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-stone-500 hover:text-navy-900 underline"
          >
            Xóa ngày
          </button>
        )}
      </div>

      {/* 3. Reservations List (Ảnh 5) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100">
        {filteredReservations.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Chưa có lịch đặt bàn nào.
          </div>
        ) : (
          filteredReservations.map((resv) => (
            <div
              key={resv.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition"
            >
              {/* Left Column: Tên khách, SĐT, số khách, Bàn, Giờ */}
              <div>
                <div className="text-xs font-bold text-navy-900 font-display">
                  {resv.customerName}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 font-medium">
                  {resv.customerPhone} · {resv.partySize} khách · {resv.table?.tableNumber || tables.find((t) => t.id === resv.tableId)?.tableNumber || 'Chưa xếp bàn'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {formatDateTime(resv.reservationTime)}
                </div>
              </div>

              {/* Right Column: Badge & Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div>{getStatusBadge(resv.status)}</div>

                <button
                  onClick={() => setSelectedResv(resv)}
                  className="px-3.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-navy-900 hover:bg-stone-100 transition shadow-2xs bg-white"
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Modal Chi Tiết Đặt Bàn */}
      {selectedResv && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                Chi tiết đặt bàn
              </h3>
              <button
                onClick={() => setSelectedResv(null)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Khách hàng:</span>
                <span className="font-bold text-navy-900">{selectedResv.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Số điện thoại:</span>
                <span className="font-medium text-stone-800">{selectedResv.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Số lượng:</span>
                <span className="font-bold text-navy-900">{selectedResv.partySize} khách</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Thời gian hẹn:</span>
                <span className="font-medium text-stone-800">{formatDateTime(selectedResv.reservationTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Bàn xếp:</span>
                <select
                  value={selectedResv.tableId || ''}
                  onChange={async (e) => {
                    const newTableId = e.target.value ? Number(e.target.value) : null;
                    try {
                      await reservationApi.update(selectedResv.id, { tableId: newTableId });
                      setSelectedResv((prev) => ({ ...prev, tableId: newTableId }));
                      setReservations((prev) =>
                        prev.map((r) => (r.id === selectedResv.id ? { ...r, tableId: newTableId } : r))
                      );
                    } catch (err) {
                      alert('Lỗi khi xếp bàn: ' + err.message);
                    }
                  }}
                  className="px-2 py-1 border border-stone-300 rounded-lg text-xs font-bold text-navy-900 bg-white"
                >
                  <option value="">Chưa chọn bàn</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber} ({t.capacity} chỗ · {t.status === 'AVAILABLE' ? 'Trống' : 'Có khách'})
                    </option>
                  ))}
                </select>
              </div>
              {selectedResv.note && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Ghi chú: {selectedResv.note}
                </div>
              )}
            </div>

            {(() => {
              const normStatus = String(selectedResv.status || '').toUpperCase();
              const isPending = normStatus === 'PENDING' || normStatus === 'CHO_XAC_NHAN';
              const isConfirmed = normStatus === 'CONFIRMED' || normStatus === 'DA_XAC_NHAN';
              const isCancelled = normStatus === 'CANCELLED' || normStatus === 'DA_HUY';

              return (
                <div className="pt-3 border-t border-stone-200 flex flex-wrap gap-2">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(selectedResv.id, 'CONFIRMED')}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
                    >
                      Xác nhận
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      onClick={() => handleUpdateStatus(selectedResv.id, 'ARRIVED')}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
                    >
                      Khách đã đến (Nhận bàn)
                    </button>
                  )}
                  {!isCancelled && (
                    <button
                      onClick={() => handleUpdateStatus(selectedResv.id, 'CANCELLED')}
                      className="py-2 px-3 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50"
                    >
                      Hủy đặt
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedResv(null)}
                    className="py-2 px-4 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200 ml-auto"
                  >
                    Đóng
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 5. Modal Thêm Lịch Đặt Bàn */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                Thêm lịch đặt bàn
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="py-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={addFormData.customerName}
                  onChange={(e) => setAddFormData({ ...addFormData, customerName: e.target.value })}
                  placeholder="Nhập họ và tên khách hàng"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={addFormData.customerPhone}
                  onChange={(e) => setAddFormData({ ...addFormData, customerPhone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Số khách *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addFormData.partySize}
                    onChange={(e) => setAddFormData({ ...addFormData, partySize: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Xếp bàn</label>
                  <select
                    value={addFormData.tableId}
                    onChange={(e) => setAddFormData({ ...addFormData, tableId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 bg-white focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                  >
                    <option value="">Chưa xếp bàn</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} ({t.capacity} chỗ)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Thời gian hẹn *</label>
                <input
                  type="datetime-local"
                  required
                  value={addFormData.reservationTime}
                  onChange={(e) => setAddFormData({ ...addFormData, reservationTime: e.target.value })}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Ghi chú</label>
                <input
                  type="text"
                  value={addFormData.note}
                  onChange={(e) => setAddFormData({ ...addFormData, note: e.target.value })}
                  placeholder="Nhập ghi chú (nếu có)"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800"
                >
                  Tạo lịch hẹn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;
