import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../../services/invoice.api';
import { Search, ChevronLeft, ChevronRight, X, Printer } from 'lucide-react';

const InvoiceListPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getAll();
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách hóa đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    // Search by invoice code or table
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const code = (inv.invoiceNumber || `HD${inv.id}`).toLowerCase();
      const table = (inv.order?.table?.tableNumber || '').toLowerCase();
      if (!code.includes(term) && !table.includes(term)) return false;
    }

    // Payment method
    if (methodFilter !== 'ALL') {
      if (methodFilter === 'CASH' && inv.paymentMethod !== 'CASH') return false;
      if (methodFilter === 'TRANSFER' && inv.paymentMethod !== 'BANK_TRANSFER') return false;
      if (methodFilter === 'CARD' && inv.paymentMethod !== 'CARD') return false;
    }

    // Date
    if (dateFilter) {
      const d = new Date(inv.paidAt || inv.createdAt).toISOString().split('T')[0];
      if (d !== dateFilter) return false;
    }

    return true;
  });

  const totalInvoices = filteredInvoices.length;
  const totalPages = Math.ceil(totalInvoices / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatInvoiceCode = (inv) => {
    if (inv.invoiceNumber) {
      // E.g. INV-20261122-0011 -> HD0321
      const parts = inv.invoiceNumber.split('-');
      if (parts.length >= 3) return `HD0${parts[2].slice(-3)}`;
      return inv.invoiceNumber;
    }
    return `HD0${inv.id}`;
  };

  const formatMethodLabel = (method) => {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản / QR';
      case 'CARD':
        return 'Thẻ ngân hàng';
      default:
        return method || 'Tiền mặt';
    }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} · ${date}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 3) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
          Hóa đơn & thanh toán
        </h1>
        <h2 className="text-sm font-bold text-stone-700 mt-2 font-display">
          Lịch sử thanh toán
        </h2>
      </div>

      {/* 2. Filters (Ảnh 3) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Mã hóa đơn hoặc bàn"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 placeholder-stone-400 focus:ring-1 focus:ring-navy-900 bg-white"
          />
        </div>

        {/* Date */}
        <div>
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

        {/* Payment Method */}
        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
        >
          <option value="ALL">Tất cả phương thức</option>
          <option value="CASH">Tiền mặt</option>
          <option value="TRANSFER">Chuyển khoản / QR</option>
          <option value="CARD">Thẻ ngân hàng</option>
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

      {/* 3. Invoices List (Ảnh 3) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100">
        {paginatedInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Không tìm thấy hóa đơn nào phù hợp.
          </div>
        ) : (
          paginatedInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition"
            >
              {/* Left Column: Code, Table, Date, Method */}
              <div>
                <div className="text-xs font-extrabold text-navy-900">
                  {formatInvoiceCode(inv)} · {inv.order?.table?.tableNumber || `Bàn ${inv.order?.tableId || ''}`}
                </div>
                <div className="text-[11px] text-stone-500 mt-1 font-medium">
                  {formatDateTime(inv.paidAt || inv.createdAt)} · {formatMethodLabel(inv.paymentMethod)}
                </div>
              </div>

              {/* Right Column: Amount & Button */}
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <span className="text-sm font-extrabold text-navy-900 font-display">
                  {(inv.finalAmount || 0).toLocaleString('vi-VN')}đ
                </span>

                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="px-3.5 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-navy-900 hover:bg-stone-100 transition shadow-2xs bg-white"
                >
                  Xem hóa đơn
                </button>
              </div>
            </div>
          ))
        )}

        {/* 4. Pagination (Ảnh 3) */}
        <div className="p-4 flex items-center justify-between text-xs text-stone-500 bg-white">
          <div>
            Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalInvoices)} / {totalInvoices}
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

      {/* 5. Modal Xem Hóa Đơn */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                Hóa đơn #{formatInvoiceCode(selectedInvoice)}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Bàn:</span>
                <span className="font-bold text-navy-900">
                  {selectedInvoice.order?.table?.tableNumber || `Bàn ${selectedInvoice.order?.tableId || ''}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Thời gian:</span>
                <span className="font-medium text-stone-700">{formatDateTime(selectedInvoice.paidAt || selectedInvoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phương thức:</span>
                <span className="font-bold text-navy-900">{formatMethodLabel(selectedInvoice.paymentMethod)}</span>
              </div>

              <div className="border-t border-dashed border-stone-200 my-2 pt-2 space-y-1.5">
                {(selectedInvoice.order?.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.menuItem?.name || it.name} <b className="text-stone-400">x{it.quantity}</b>
                    </span>
                    <span className="font-medium">{((it.price || 0) * (it.quantity || 1)).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-2 space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính:</span>
                  <span>{(selectedInvoice.subtotal || selectedInvoice.finalAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Chiết khấu:</span>
                    <span>-{Number(selectedInvoice.discountAmount).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Thuế VAT:</span>
                  <span>+{Number(selectedInvoice.vatAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-navy-900 pt-1 border-t border-stone-100">
                  <span>Tổng thanh toán:</span>
                  <span className="font-display">{(selectedInvoice.finalAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-xs font-bold text-navy-900 hover:bg-stone-50 flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                In hóa đơn
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800"
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

export default InvoiceListPage;
