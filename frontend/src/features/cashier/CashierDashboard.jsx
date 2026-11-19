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
} from 'lucide-react';

const CashierDashboard = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout modal
  const [selectedOrderForCheckout, setSelectedOrderForCheckout] = useState(null);
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
      if (tableRes.success) setTables(tableRes.data);
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
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order-created');
        socket.off('order-status-updated');
        socket.off('invoice-created');
        socket.off('table_status_updated');
      }
    };
  }, [socket]);

  // Handle Checkout (US15)
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedOrderForCheckout) return;

    setSubmitting(true);
    try {
      const res = await invoiceApi.create({
        orderId: selectedOrderForCheckout.id,
        discount: Number(discount) || 0,
        paymentMethod,
      });

      if (res.success) {
        setSelectedOrderForCheckout(null);
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

  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED' || (t.orders && t.orders.length > 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-orange-600" />
            <span>Thu ngân & Quản lý Hóa đơn (US12 - US15)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Thanh toán, gộp bàn, tách bill và xuất hóa đơn PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* US13 Merge Table Button */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Waiting for Payment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Đơn hàng đang phục vụ tại bàn ({activeOrders.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <CheckCircle size={40} className="mx-auto mb-2 opacity-30 text-emerald-500" />
              <p className="text-sm font-semibold">Tất cả bàn hiện đã được thanh toán hoàn tất</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-base text-slate-800">
                        {order.table?.tableNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-3">{order.orderNumber}</p>

                    <div className="space-y-1 mb-4 text-xs text-slate-600 max-h-32 overflow-y-auto">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.menuItem?.name}
                          </span>
                          <span className="font-medium">
                            {(it.price * it.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div>
                      <p className="text-[10px] text-slate-400">Tổng tiền:</p>
                      <p className="font-extrabold text-sm text-orange-600">
                        {order.totalAmount.toLocaleString('vi-VN')} đ
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* US14 Split Bill Button */}
                      <button
                        onClick={() => openSplitModal(order)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                        title="Tách món / Tách bill (US14)"
                      >
                        <Split size={14} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedOrderForCheckout(order);
                          setDiscount(0);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                      >
                        <DollarSign size={14} />
                        <span>Thanh toán</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Invoices History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Hóa đơn gần đây ({invoices.length})</h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {invoices.slice(0, 15).map((inv) => (
              <div
                key={inv.id}
                onClick={() => setViewingInvoice(inv)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-slate-800">{inv.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500">
                    {inv.order?.table?.tableNumber} • {new Date(inv.createdAt).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs text-emerald-600">
                    {inv.finalAmount.toLocaleString('vi-VN')} đ
                  </p>
                  <span className="text-[10px] text-slate-400">{inv.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal (US15) */}
      {selectedOrderForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-1">Thanh toán đơn hàng (US15)</h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedOrderForCheckout.table?.tableNumber} • {selectedOrderForCheckout.orderNumber}
            </p>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Tổng tiền món:</span>
                  <span className="font-bold">
                    {selectedOrderForCheckout.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Giảm giá:</span>
                  <span>-{(Number(discount) || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Cần thanh toán:</span>
                  <span className="text-orange-600">
                    {Math.max(
                      0,
                      selectedOrderForCheckout.totalAmount - (Number(discount) || 0)
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
                  onClick={() => setSelectedOrderForCheckout(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20"
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Tables Modal (US13) */}
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
                  Chọn bàn nguồn (Bàn sẽ được giải phóng)
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
                      {t.tableNumber} (Đang có khách)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn bàn đích (Bàn nhận toàn bộ đơn)
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

      {/* Split Bill Modal (US14) */}
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

      {/* View Printable Invoice */}
      <InvoiceTemplate invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
    </div>
  );
};

export default CashierDashboard;
