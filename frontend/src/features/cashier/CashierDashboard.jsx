import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { invoiceApi } from '../../services/invoice.api';
import { tableApi } from '../../services/table.api';
import { useSocket } from '../../context/SocketContext';
import InvoiceTemplate from './InvoiceTemplate';
import {
  Receipt,
  DollarSign,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Banknote,
  QrCode,
  Combine,
  Split,
  Plus,
  Minus,
  Grid,
  Users,
  Clock,
} from 'lucide-react';

const CashierDashboard = () => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkout modal
  const [orderForCheckout, setOrderForCheckout] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Merge table modal (US13)
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [sourceTableId, setSourceTableId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');

  // Split bill modal (US14)
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [orderForSplit, setOrderForSplit] = useState(null);
  const [splitItemsState, setSplitItemsState] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, invRes, tableRes] = await Promise.all([
        orderApi.getOrders({ activeOnly: true }),
        invoiceApi.getAll(),
        tableApi.getAll(),
      ]);
      if (orderRes.success) setActiveOrders(orderRes.data);
      if (invRes.success) setInvoices(invRes.data);
      if (tableRes.success) {
        setTables(tableRes.data);
        // Retain or select default table
        if (!selectedTable && tableRes.data.length > 0) {
          const firstOccupied = tableRes.data.find(
            (t) => t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT'
          );
          setSelectedTable(firstOccupied || tableRes.data[0]);
        } else if (selectedTable) {
          const current = tableRes.data.find((t) => t.id === selectedTable.id);
          if (current) setSelectedTable(current);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.emit('join-staff');

      socket.on('new_order', () => fetchData());
      socket.on('order-created', () => fetchData());
      socket.on('order-status-updated', () => fetchData());
      socket.on('invoice-created', () => fetchData());
      socket.on('table_status_updated', () => fetchData());
      socket.on('table-status-updated', () => fetchData());
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order-created');
        socket.off('order-status-updated');
        socket.off('invoice-created');
        socket.off('table_status_updated');
        socket.off('table-status-updated');
      }
    };
  }, [socket]);

  // Handle Checkout (US15)
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!orderForCheckout) return;

    setSubmitting(true);
    try {
      const res = await invoiceApi.create({
        orderId: orderForCheckout.id,
        discount: Number(discount) || 0,
        paymentMethod,
      });

      if (res.success) {
        setOrderForCheckout(null);
        setDiscount(0);
        setViewingInvoice(res.data);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Merge Tables (US13)
  const handleMergeTables = async (e) => {
    e.preventDefault();
    if (!sourceTableId || !targetTableId) {
      alert('Vui lòng chọn bàn nguồn và bàn đích!');
      return;
    }
    setSubmitting(true);
    try {
      const res = await invoiceApi.mergeTables({ sourceTableId, targetTableId });
      if (res.success) {
        alert('Gộp bàn thành công! Toàn bộ món đã được chuyển sang bàn đích.');
        setShowMergeModal(false);
        setSourceTableId('');
        setTargetTableId('');
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gộp bàn');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Split Bill modal (US14)
  const openSplitModal = (order) => {
    setOrderForSplit(order);
    const initialSplit = {};
    order.items.forEach((it) => {
      initialSplit[it.id] = 0;
    });
    setSplitItemsState(initialSplit);
    setShowSplitModal(true);
  };

  // Handle Split Bill Submit (US14)
  const handleSplitBill = async (e) => {
    e.preventDefault();
    if (!orderForSplit) return;

    const itemsToSplit = Object.keys(splitItemsState)
      .filter((id) => splitItemsState[id] > 0)
      .map((id) => ({
        orderDetailId: Number(id),
        quantity: splitItemsState[id],
      }));

    if (itemsToSplit.length === 0) {
      alert('Vui lòng chọn số lượng món cần tách!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await invoiceApi.splitBill({
        orderId: orderForSplit.id,
        itemsToSplit,
      });
      if (res.success) {
        alert('Đã tách thành công hóa đơn/đơn mới!');
        setShowSplitModal(false);
        setOrderForSplit(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tách hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  // Change table to WAITING_PAYMENT status
  const handleChangeStatus = async (tableId, status) => {
    try {
      await tableApi.updateStatus(tableId, status);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Orders of currently selected table
  const selectedTableOrders = activeOrders.filter((o) => o.tableId === selectedTable?.id);
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-orange-600" />
            <span>Thu ngân — Sơ đồ bàn & Thanh toán (US12 - US15)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Sơ đồ bàn đổi màu realtime (Trống, Có khách, Chờ thanh toán), gộp bàn, tách bill và xuất hóa đơn PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* US13 Gộp bàn Button */}
          <button
            onClick={() => setShowMergeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 transition-colors"
          >
            <Combine size={15} />
            <span>Gộp bàn (US13)</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Table Grid, Right Selected Table Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Realtime Table Map Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Grid size={16} className="text-orange-600" />
              <span>Sơ đồ bàn thời gian thực ({tables.length} bàn)</span>
            </h3>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Trống</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Có khách</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Chờ TT</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {tables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              const hasOrders = activeOrders.some((o) => o.tableId === table.id);

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-slate-900 shadow-md' : 'shadow-sm hover:shadow'
                  } ${
                    table.status === 'AVAILABLE'
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                      : table.status === 'OCCUPIED'
                      ? 'bg-orange-50 border-orange-400 text-orange-900'
                      : 'bg-amber-50 border-amber-400 text-amber-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-extrabold text-base leading-tight">{table.tableNumber}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        table.status === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : table.status === 'OCCUPIED'
                          ? 'bg-orange-500 animate-pulse'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>

                  <div className="text-[11px] font-medium space-y-1">
                    <p className="flex items-center gap-1 opacity-80">
                      <Users size={12} />
                      <span>{table.capacity} chỗ</span>
                    </p>
                    <p className="font-bold">
                      {table.status === 'AVAILABLE'
                        ? 'Trống'
                        : table.status === 'OCCUPIED'
                        ? 'Có khách'
                        : 'Chờ thanh toán'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Invoices Strip */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Lịch sử hóa đơn gần đây
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {invoices.slice(0, 8).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setViewingInvoice(inv)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200 shrink-0 text-left transition-colors"
                >
                  <p className="font-bold text-xs text-slate-800">{inv.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500">{inv.order?.table?.tableNumber}</p>
                  <p className="font-extrabold text-xs text-emerald-600">
                    {inv.finalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Table Order Details & Actions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            {/* Table Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-slate-400">Chi tiết bàn đang chọn:</span>
                <h3 className="font-extrabold text-xl text-slate-900">
                  {selectedTable ? selectedTable.tableNumber : 'Chưa chọn bàn'}
                </h3>
              </div>

              {selectedTable && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTable.status}
                    onChange={(e) => handleChangeStatus(selectedTable.id, e.target.value)}
                    className="text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="AVAILABLE">Trống</option>
                    <option value="OCCUPIED">Có khách</option>
                    <option value="WAITING_PAYMENT">Chờ thanh toán</option>
                  </select>
                </div>
              )}
            </div>

            {/* List of active orders on selected table */}
            <div className="mt-4 space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {selectedTableOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle size={40} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-semibold">Bàn hiện không có đơn hàng nào cần thanh toán</p>
                </div>
              ) : (
                selectedTableOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 font-mono">{ord.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                        {ord.status}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/60 text-xs text-slate-700">
                      {ord.items.map((it) => (
                        <div key={it.id} className="py-1.5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-orange-600">{it.quantity}x</span>
                            <span>{it.menuItem?.name}</span>
                          </div>
                          <span className="font-medium">
                            {(it.price * it.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.note && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-md italic">
                        {ord.note}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Tổng đơn:</span>
                      <span className="text-sm font-extrabold text-orange-600">
                        {ord.totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {/* Quick per-order actions: Split Bill (US14) or Checkout (US15) */}
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => openSplitModal(ord)}
                        className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Split size={13} />
                        <span>Tách bill (US14)</span>
                      </button>

                      <button
                        onClick={() => {
                          setOrderForCheckout(ord);
                          setDiscount(0);
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <DollarSign size={13} />
                        <span>Thanh toán & In PDF</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Total Summary of selected table */}
          {selectedTableOrders.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span>Tổng cộng cần thu tại bàn:</span>
                <span className="text-lg text-orange-600">
                  {selectedTableOrders
                    .reduce((sum, o) => sum + o.totalAmount, 0)
                    .toLocaleString('vi-VN')}{' '}
                  đ
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Thanh toán & In PDF (US15, UC05) */}
      {orderForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-1">Xác nhận thanh toán (US15)</h3>
            <p className="text-xs text-slate-500 mb-4">
              {orderForCheckout.table?.tableNumber} • {orderForCheckout.orderNumber}
            </p>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Tổng tiền món:</span>
                  <span className="font-bold">
                    {orderForCheckout.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Giảm giá:</span>
                  <span>-{(Number(discount) || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Khách phải trả:</span>
                  <span className="text-orange-600">
                    {Math.max(
                      0,
                      orderForCheckout.totalAmount - (Number(discount) || 0)
                    ).toLocaleString('vi-VN')}{' '}
                    đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Giảm giá khuyến mãi (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote size={16} />
                    <span>Tiền mặt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-colors ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span>Chuyển khoản</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QR_CODE')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-colors ${
                      paymentMethod === 'QR_CODE'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <QrCode size={16} />
                    <span>QR Pay</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderForCheckout(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20"
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận & Xuất hóa đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gộp bàn (US13, UC05) */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
              <Combine className="text-indigo-600" size={20} />
              <span>Gộp bàn ăn (US13)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Chuyển toàn bộ món từ bàn nguồn sang bàn đích và giải phóng bàn nguồn về trạng thái Trống.
            </p>

            <form onSubmit={handleMergeTables} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn bàn nguồn (Sẽ được giải phóng)
                </label>
                <select
                  value={sourceTableId}
                  onChange={(e) => setSourceTableId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn bàn nguồn --</option>
                  {occupiedTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber} ({t.status === 'OCCUPIED' ? 'Có khách' : 'Chờ TT'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn bàn đích (Bàn gom toàn bộ đơn)
                </label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn bàn đích --</option>
                  {occupiedTables
                    .filter((t) => String(t.id) !== String(sourceTableId))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận gộp bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tách bill (US14, UC05) */}
      {showSplitModal && orderForSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
              <Split className="text-orange-600" size={20} />
              <span>Tách hóa đơn / Tách món (US14)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Chọn số lượng món cần tách sang hóa đơn riêng cho bàn {orderForSplit.table?.tableNumber}.
            </p>

            <form onSubmit={handleSplitBill} className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {orderForSplit.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{it.menuItem?.name}</p>
                      <p className="text-slate-400">
                        {it.price.toLocaleString('vi-VN')} đ (Đơn gốc có: {it.quantity})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setSplitItemsState((prev) => ({
                            ...prev,
                            [it.id]: Math.max(0, (prev[it.id] || 0) - 1),
                          }))
                        }
                        className="text-slate-500 hover:text-orange-600"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {splitItemsState[it.id] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSplitItemsState((prev) => ({
                            ...prev,
                            [it.id]: Math.min(it.quantity, (prev[it.id] || 0) + 1),
                          }))
                        }
                        className="text-slate-500 hover:text-orange-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md"
                >
                  {submitting ? 'Đang tách...' : 'Xác nhận tách bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem trước & Xuất hóa đơn PDF (US15, UC05) */}
      <InvoiceTemplate invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
    </div>
  );
};

export default CashierDashboard;
