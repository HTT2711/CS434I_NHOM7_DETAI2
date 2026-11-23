import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { useSocket } from '../../context/SocketContext';
import { Search, Calendar, ChevronLeft, ChevronRight, X, Clock, CheckCircle2 } from 'lucide-react';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getAll();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.emit('join-staff');
      const handleUpdate = () => fetchOrders();

      socket.on('new_order', handleUpdate);
      socket.on('order-created', handleUpdate);
      socket.on('order-status-updated', handleUpdate);
      socket.on('order_item_updated', handleUpdate);
      socket.on('order-confirmed', handleUpdate);
      socket.on('order-completed', handleUpdate);

      return () => {
        socket.off('new_order', handleUpdate);
        socket.off('order-created', handleUpdate);
        socket.off('order-status-updated', handleUpdate);
        socket.off('order_item_updated', handleUpdate);
        socket.off('order-confirmed', handleUpdate);
        socket.off('order-completed', handleUpdate);
      };
    }
  }, [socket]);

  const filteredOrders = orders.filter((o) => {
    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const code = (o.orderNumber || `DH${o.id}`).toLowerCase();
      const table = (o.table?.tableNumber || `Bàn ${o.tableId}`).toLowerCase();
      if (!code.includes(term) && !table.includes(term)) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'NEW' && o.status !== 'PENDING') return false;
      if (statusFilter === 'COOKING' && o.status !== 'COOKING') return false;
      if (statusFilter === 'COMPLETED' && o.status !== 'COMPLETED' && o.status !== 'SERVED' && o.status !== 'READY') return false;
      if (statusFilter === 'CANCELLED' && o.status !== 'CANCELLED') return false;
    }

    // Date filter
    if (dateFilter) {
      const oDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (oDate !== dateFilter) return false;
    }

    return true;
  });

  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCookingBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Đơn mới
          </span>
        );
      case 'COOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Đang chế biến
          </span>
        );
      case 'READY':
      case 'SERVED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Đã hủy
          </span>
        );
      default:
        return <span className="text-xs text-stone-500">{status}</span>;
    }
  };

  const formatOrderCode = (order) => {
    if (order.orderNumber) {
      if (order.orderNumber.startsWith('DH')) return order.orderNumber;
      const parts = order.orderNumber.split('-');
      if (parts.length >= 3 && parts[1].length > 4) {
        return `DH0${parts[2] || parts[parts.length - 1].slice(-3)}`;
      }
      if (parts.length >= 2) return `DH${parts[1]}`;
      return order.orderNumber;
    }
    return `DH0${order.id}`;
  };

  const formatTableNumber = (table) => {
    if (!table) return '—';
    const num = table.tableNumber || '';
    return num.replace(/^Bàn\s*/i, '');
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} · ${date}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 2) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
          Đơn hàng
        </h1>
      </div>

      {/* 2. Search & Filter Bar (Ảnh 2) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Mã đơn hoặc số bàn"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 placeholder-stone-400 focus:ring-1 focus:ring-navy-900 bg-white"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="NEW">Đơn mới</option>
          <option value="COOKING">Đang chế biến</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        {/* Date input */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
          />
        </div>

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-stone-500 hover:text-navy-900 underline"
          >
            Xóa ngày
          </button>
        )}
      </div>

      {/* 3. Orders Table (Ảnh 2) */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-600 font-bold bg-stone-50/70">
                <th className="py-3 px-4 font-bold">Mã đơn</th>
                <th className="py-3 px-4 font-bold text-center">Bàn</th>
                <th className="py-3 px-4 font-bold">Thời gian</th>
                <th className="py-3 px-4 font-bold">Tổng tiền</th>
                <th className="py-3 px-4 font-bold">Chế biến</th>
                <th className="py-3 px-4 font-bold">Thanh toán</th>
                <th className="py-3 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isPaid = order.status === 'COMPLETED' || order.invoice;
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        {formatOrderCode(order)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-navy-900">
                        {formatTableNumber(order.table)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        {(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-4">
                        {getCookingBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-navy-900 hover:bg-stone-50 transition"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination (Ảnh 2) */}
        <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div>
            Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalOrders)} / {totalOrders}
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={currentPage === page ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition ${
                  currentPage === page
                    ? 'bg-navy-900 text-white'
                    : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {page}
              </button>
            ))}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-stone-400">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-7 h-7 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold text-xs"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modal Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-base text-navy-900 font-display">
                  Chi tiết đơn #{formatOrderCode(selectedOrder)}
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedOrder.table?.tableNumber || `Bàn ${selectedOrder.tableId}`} · {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
              {(selectedOrder.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                  <div>
                    <span className="font-bold text-navy-900">{it.menuItem?.name || it.name}</span>
                    <span className="text-stone-500 ml-2">x{it.quantity}</span>
                    {it.notes && <p className="text-[10px] text-amber-700 italic">Ghi chú: {it.notes}</p>}
                  </div>
                  <span className="font-bold text-navy-900">
                    {((it.price || 0) * (it.quantity || 1)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">Tổng cộng:</span>
              <span className="text-base font-extrabold text-navy-900 font-display">
                {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderListPage;
