import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../services/order.api';
import { invoiceApi } from '../../services/invoice.api';
import { tableApi } from '../../services/table.api';
import { settingsApi } from '../../services/settings.api';
import { promotionApi } from '../../services/promotion.api';
import { useSocket } from '../../context/SocketContext';
import InvoiceTemplate from './InvoiceTemplate';
import {
  Receipt,
  DollarSign,
  CheckCircle,
  CheckCircle2,
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
  Bell,
  X,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Tag,
} from 'lucide-react';

const CashierDashboard = () => {
  const { user, login } = useAuth();
  const canCheckout = user?.role === 'ADMIN' || user?.role === 'CASHIER';
  const [searchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Settings: VAT & Discount limit (US21)
  const [vatRate, setVatRate] = useState(8);
  const [discountLimitPercent, setDiscountLimitPercent] = useState(10);

  // Checkout modal
  const [orderForCheckout, setOrderForCheckout] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminApproved, setAdminApproved] = useState(false);

  // Voucher / Promotion state (Áp mã thanh toán)
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [availablePromos, setAvailablePromos] = useState([]);

  // Merge table modal (US13)
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [sourceTableId, setSourceTableId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');

  // Split bill modal (US14)
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [orderForSplit, setOrderForSplit] = useState(null);
  const [splitItemsState, setSplitItemsState] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, invRes, tableRes, setRes, promoRes] = await Promise.all([
        orderApi.getOrders({ activeOnly: true }),
        invoiceApi.getAll(),
        tableApi.getAll(),
        settingsApi.get().catch(() => ({ data: { vatRate: 8, discountLimitPercent: 10 } })),
        promotionApi.getAll().catch(() => ({ data: [] })),
      ]);
      if (orderRes.success) setActiveOrders(orderRes.data);
      if (invRes.success) setInvoices(invRes.data);
      if (promoRes?.success && Array.isArray(promoRes.data)) {
        setAvailablePromos(promoRes.data.filter((p) => p.active));
      }
      if (tableRes.success) {
        setTables(tableRes.data);
        // Đồng bộ selectedTable nếu drawer đang mở
        setSelectedTable((prev) => {
          if (!prev) return null;
          const fresh = tableRes.data.find((t) => t.id === prev.id);
          return fresh ? fresh : prev;
        });

        const queryTableId = searchParams.get('tableId');
        if (queryTableId) {
          const matched = tableRes.data.find((t) => String(t.id) === String(queryTableId));
          if (matched) setSelectedTable(matched);
        }
      }
      if (setRes && setRes.data) {
        setVatRate(setRes.data.vatRate ?? 8);
        setDiscountLimitPercent(setRes.data.discountLimitPercent ?? 10);
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

      const handleUpdate = () => fetchData();
      const handleTableUpdated = (updated) => {
        if (!updated) return;
        const targetId = updated.id || updated.tableId;
        const targetStatus = updated.status;
        setTables((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, status: targetStatus } : t))
        );
        setSelectedTable((prev) =>
          prev && prev.id === targetId ? { ...prev, status: targetStatus } : prev
        );
        fetchData();
      };

      socket.on('new_order', handleUpdate);
      socket.on('order-created', handleUpdate);
      socket.on('order-status-updated', handleUpdate);
      socket.on('order_item_updated', handleUpdate);
      socket.on('order-item-status-updated', handleUpdate);
      socket.on('table_status_updated', handleTableUpdated);
      socket.on('table-status-updated', handleTableUpdated);
      socket.on('order-completed', handleUpdate);
      socket.on('order-confirmed', handleUpdate);
      socket.on('invoice-created', handleUpdate);

      return () => {
        socket.off('new_order', handleUpdate);
        socket.off('order-created', handleUpdate);
        socket.off('order-status-updated', handleUpdate);
        socket.off('order_item_updated', handleUpdate);
        socket.off('order-item-status-updated', handleUpdate);
        socket.off('table_status_updated', handleTableUpdated);
        socket.off('table-status-updated', handleTableUpdated);
        socket.off('order-completed', handleUpdate);
        socket.off('order-confirmed', handleUpdate);
        socket.off('invoice-created', handleUpdate);
      };
    }
  }, [socket]);

  // Get effective status of table: if table has active unpaid orders, it cannot be AVAILABLE!
  const getTableEffectiveStatus = (table) => {
    const hasOrders = activeOrders.some((o) => o.tableId === table.id);
    if (table.status === 'AVAILABLE' && hasOrders) return 'OCCUPIED';
    return table.status;
  };

  // Counts for Top Pills (Ảnh 7 & doc.md Mục 3.2 #12, #14: AVAILABLE, OCCUPIED, WAITING_PAYMENT)
  const emptyCount = tables.filter((t) => getTableEffectiveStatus(t) === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => getTableEffectiveStatus(t) === 'OCCUPIED').length;
  const waitingPayCount = tables.filter((t) => getTableEffectiveStatus(t) === 'WAITING_PAYMENT').length;

  // Orders awaiting confirmation from cashier (US19)
  const pendingConfirmOrders = activeOrders.filter(
    (o) => o.status === 'AWAITING_CONFIRMATION' || (o.status === 'PENDING' && o.table?.status === 'AVAILABLE')
  );

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    const eff = getTableEffectiveStatus(t);
    if (statusFilter !== 'ALL' && eff !== statusFilter) return false;
    if (areaFilter !== 'ALL' && t.area !== areaFilter) return false;
    return true;
  });

  // Unique areas for dropdown
  const uniqueAreas = Array.from(new Set(tables.map((t) => t.area || 'Khu A - Tầng 1')));

  // Get all active orders of a table
  const getTableOrders = (tableId) => {
    return activeOrders.filter((o) => o.tableId === tableId);
  };

  // Get primary active order of a table
  const getTableOrder = (tableId) => {
    return activeOrders.find((o) => o.tableId === tableId);
  };

  // Get total amount for table
  const getTableTotal = (tableId) => {
    const ords = getTableOrders(tableId);
    return ords.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  };

  // US19: Confirm / Reject first order of table
  const handleConfirmOrder = async (orderId) => {
    try {
      await orderApi.confirmOrder(orderId);
      fetchData();
      alert('Đã xác nhận đơn hàng thành công! Đơn đã được chuyển xuống Màn hình Bếp (KDS).');
    } catch (err) {
      alert(err.message || 'Lỗi khi xác nhận đơn');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Nhập lý do từ chối đơn hàng (bắt buộc):', 'Khách không có mặt tại bàn');
    if (!reason) return;
    try {
      await orderApi.cancelOrder(orderId, reason);
      fetchData();
      alert('Đã từ chối đơn hàng!');
    } catch (err) {
      alert(err.message || 'Lỗi khi từ chối đơn');
    }
  };

  // US20: Cancel item from cashier
  const handleCancelItemCashier = async (itemId) => {
    const reason = prompt('Nhập lý do hủy món (bắt buộc):', 'Khách báo hủy');
    if (!reason) return;
    try {
      await orderApi.cancelItem(itemId, reason, false);
      fetchData();
      alert('Đã hủy món thành công!');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi hủy món');
    }
  };

  // Manual table status toggle (US12)
  const handleToggleTableStatus = async (tableId, currentStatus) => {
    const nextStatus = currentStatus === 'WAITING_PAYMENT' ? 'OCCUPIED' : 'WAITING_PAYMENT';
    // Cập nhật ngay tức thì 0ms trên giao diện
    setSelectedTable((prev) => (prev && prev.id === tableId ? { ...prev, status: nextStatus } : prev));
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: nextStatus } : t)));

    try {
      const res = await tableApi.updateStatus(tableId, nextStatus);
      if (res?.data) {
        setSelectedTable((prev) => (prev && prev.id === tableId ? { ...prev, ...res.data } : prev));
      }
      fetchData();
    } catch (err) {
      // Revert lại nếu có lỗi
      setSelectedTable((prev) => (prev && prev.id === tableId ? { ...prev, status: currentStatus } : prev));
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: currentStatus } : t)));
      alert(err.message || 'Lỗi cập nhật trạng thái bàn');
    }
  };

  // US13: Handle merge table
  const handleMergeTables = async (e) => {
    e.preventDefault();
    if (!sourceTableId || !targetTableId || sourceTableId === targetTableId) {
      alert('Vui lòng chọn 2 bàn khác nhau để gộp');
      return;
    }
    setSubmitting(true);
    try {
      const res = await invoiceApi.mergeTables(sourceTableId, targetTableId);
      if (res.success) {
        setShowMergeModal(false);
        setSourceTableId('');
        setTargetTableId('');
        fetchData();
        alert('Gộp bàn thành công!');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gộp bàn');
    } finally {
      setSubmitting(false);
    }
  };

  // US14: Handle split bill (chỉ cho phép tách món READY hoặc SERVED)
  const handleOpenSplitModal = (order) => {
    setOrderForSplit(order);
    const initialSplit = {};
    order.items?.forEach((item) => {
      initialSplit[item.id] = 0;
    });
    setSplitItemsState(initialSplit);
    setShowSplitModal(true);
  };

  const handleConfirmSplit = async () => {
    if (!orderForSplit) return;
    const itemsToSplit = Object.entries(splitItemsState)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        orderDetailId: Number(itemId),
        quantity: qty,
      }));

    if (itemsToSplit.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món để tách hóa đơn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await invoiceApi.splitBill(orderForSplit.id, itemsToSplit);
      if (res.success) {
        setShowSplitModal(false);
        setOrderForSplit(null);
        fetchData();
        alert('Tách hóa đơn thành công! Đã tạo đơn mới cho phần được tách.');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tách hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý áp dụng mã khuyến mãi / voucher khi thanh toán
  const handleApplyPromo = async (codeToUse) => {
    const code = (codeToUse || promoCodeInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    setCheckingPromo(true);
    setPromoError('');
    try {
      const res = await promotionApi.check(code);
      if (res.success && res.data) {
        const promo = res.data;
        const subtotal = orderForCheckout?.totalAmount || 0;
        if (promo.minOrder && subtotal < promo.minOrder) {
          setPromoError(`Đơn hàng tối thiểu ${promo.minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này (hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`);
          return;
        }

        let calculatedDiscount = 0;
        if (promo.type === 'percent') {
          calculatedDiscount = Math.round((subtotal * promo.value) / 100);
          if (promo.maxDiscount && calculatedDiscount > promo.maxDiscount) {
            calculatedDiscount = promo.maxDiscount;
          }
        } else {
          calculatedDiscount = promo.value;
        }

        if (calculatedDiscount > subtotal) {
          calculatedDiscount = subtotal;
        }

        setDiscount(calculatedDiscount);
        setAppliedPromo(promo);
        setPromoCodeInput(promo.code);
        setPromoError('');
      } else {
        setPromoError(res.message || 'Mã không hợp lệ hoặc đã hết hạn');
      }
    } catch (err) {
      setPromoError(err.message || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setDiscount(0);
    setPromoError('');
  };

  const handleSelectPromo = (promo) => {
    setPromoCodeInput(promo.code);
    handleApplyPromo(promo.code);
  };

  // US15: Handle checkout and open invoice preview with VAT calculation
  const handleProcessCheckout = async () => {
    if (!orderForCheckout) return;

    if (!canCheckout) {
      alert(`Bạn đang ở phiên đăng nhập của ${user?.role === 'KITCHEN' ? 'Nhân viên Bếp' : user?.role || 'khác'}. Chỉ Thu ngân (cashier) hoặc Quản trị viên (admin) mới có quyền thanh toán.`);
      return;
    }

    // Check discount limit (miễn yêu cầu mật khẩu nếu là voucher hợp lệ của hệ thống)
    const subtotal = orderForCheckout.totalAmount || 0;
    const discountVal = Number(discount) || 0;
    const discountPercent = subtotal > 0 ? (discountVal / subtotal) * 100 : 0;

    if (!appliedPromo && discountPercent > discountLimitPercent && !adminApproved) {
      if (adminPassword !== '123456') {
        alert(`Mức chiết khấu (${discountPercent.toFixed(1)}%) vượt quá hạn mức Thu ngân (${discountLimitPercent}%). Vui lòng nhập mật khẩu Admin để duyệt!`);
        return;
      }
    }

    if (paymentMethod !== 'CASH' && !paidConfirmed) {
      alert('Vui lòng tick chọn "Đã nhận tiền từ khách" trước khi hoàn tất thanh toán!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await invoiceApi.checkout({
        orderId: orderForCheckout.id,
        paymentMethod,
        discount: discountVal,
        vatRate,
        voucherCode: appliedPromo?.code || null,
      });

      if (res.success) {
        setViewingInvoice(res.data);
        setOrderForCheckout(null);
        setSelectedTable(null);
        setDiscount(0);
        setAppliedPromo(null);
        setPromoCodeInput('');
        setPromoError('');
        setPaidConfirmed(false);
        setAdminPassword('');
        setAdminApproved(false);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi thực hiện thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto bg-white font-sans">
      {/* 1. Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
          Sơ đồ bàn & Thu ngân
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMergeModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-navy-900 hover:bg-stone-50 transition"
          >
            <Combine size={14} />
            <span>Gộp bàn</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 border border-stone-300 text-stone-600 rounded-xl hover:bg-stone-50 transition"
            title="Làm mới"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ALERT: ĐƠN CHỜ XÁC NHẬN (US19) */}
      {pendingConfirmOrders.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <Bell className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
            <div>
              <p className="font-extrabold text-sm">
                Có {pendingConfirmOrders.length} đơn gọi món mới đang chờ Thu ngân duyệt!
              </p>
              <p className="text-xs text-amber-800">
                Xác nhận khách đã ngồi đúng bàn để đơn được chuyển xuống màn hình bếp KDS.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingConfirmOrders.map((po) => (
              <div key={po.id} className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-navy-900 shadow-xs">
                <span>{po.table?.tableNumber || `Bàn ${po.tableId}`} ({po.items?.length} món)</span>
                <button
                  onClick={() => handleConfirmOrder(po.id)}
                  className="px-2 py-0.5 bg-navy-900 text-white rounded-lg text-[11px] hover:bg-navy-800"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => handleRejectOrder(po.id)}
                  className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px]"
                >
                  Từ chối
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Top Legend Filter Pills (Trống, Có khách, Chờ thanh toán) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ● Trống (Xanh lá) */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Trống</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-extrabold">
            {emptyCount}
          </span>
        </button>

        {/* ● Có khách (Xanh dương / Navy) */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
          style={statusFilter === 'OCCUPIED' ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'OCCUPIED'
              ? 'bg-navy-900 text-white border-navy-900'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Có khách</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-extrabold">
            {occupiedCount}
          </span>
        </button>

        {/* ● Chờ thanh toán (Cam) */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'WAITING_PAYMENT' ? 'ALL' : 'WAITING_PAYMENT')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'WAITING_PAYMENT'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Chờ thanh toán</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-extrabold">
            {waitingPayCount}
          </span>
        </button>

        {statusFilter !== 'ALL' && (
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-xs text-stone-500 hover:text-navy-900 font-semibold underline ml-1"
          >
            Bỏ lọc trạng thái
          </button>
        )}
      </div>

      {/* 3. Area Select Dropdown (Ảnh 7: Tất cả khu vực ⌵) */}
      <div className="pt-1">
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3.5 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 bg-white hover:border-stone-400 focus:outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả khu vực</option>
          {uniqueAreas.map((area, idx) => (
            <option key={idx} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Table Cards Grid (Ảnh 7: 4 Cột trên Desktop, Card Trắng Viền Nhạt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isSelected = selectedTable?.id === table.id;
          const tableOrders = getTableOrders(table.id);
          const hasOrders = tableOrders.length > 0;
          const totalAmount = tableOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          const totalItemsCount = tableOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
          const isAwaitingConfirm = tableOrders.some(
            (o) => o.status === 'AWAITING_CONFIRMATION' || (o.status === 'PENDING' && table.status === 'AVAILABLE')
          );
          const effectiveStatus = getTableEffectiveStatus(table);

          // Status Badge details matching doc.md (Mục 3.2 #14: Trống = xanh lá, Có khách = xanh dương, Chờ thanh toán = cam)
          let statusPill = (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Trống
            </span>
          );

          if (effectiveStatus === 'OCCUPIED') {
            statusPill = (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Có khách
              </span>
            );
          } else if (effectiveStatus === 'WAITING_PAYMENT') {
            statusPill = (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Chờ thanh toán
              </span>
            );
          }

          return (
            <div
              key={table.id}
              onClick={() => {
                setSelectedTable(table);
                setSelectedOrderId(null);
              }}
              className={`p-5 rounded-2xl border bg-white cursor-pointer transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-navy-900 ring-2 ring-navy-900/10'
                  : 'border-stone-200'
              }`}
              style={{ minHeight: '140px' }}
            >
              {/* Top Row: Table icon on Left, Table Number on Right */}
              <div className="flex items-start justify-between">
                <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
                  <Grid size={13} />
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-base text-navy-900 font-display">
                    {table.tableNumber}
                  </h3>
                  {isAwaitingConfirm && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      Chờ xác nhận
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Status pill + Area & Capacity */}
              <div className="my-2 space-y-1">
                <div>{statusPill}</div>
                <div className="text-[11px] text-stone-500 font-medium">
                  {table.area?.split(' - ')[0] || 'Tầng 1'} · {table.capacity} chỗ
                </div>
              </div>

              {/* Bottom Row: Amount */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-navy-900 font-display">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </span>
                {hasOrders && (
                  <span className="text-[10px] font-bold text-stone-400">
                    {totalItemsCount} món {tableOrders.length > 1 ? `(${tableOrders.length} bill)` : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Selected Table Action Drawer / Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-xl font-extrabold text-navy-900 font-display">
                    {selectedTable.tableNumber}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedTable.area} · Sức chứa {selectedTable.capacity} khách
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1.5 text-stone-400 hover:text-navy-900 rounded-lg hover:bg-stone-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Table Order Details */}
              {(() => {
                const tableOrders = getTableOrders(selectedTable.id);
                if (tableOrders.length === 0) {
                  return (
                    <div className="py-12 text-center text-stone-400 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                        <Grid size={24} />
                      </div>
                      <p className="text-sm font-semibold text-stone-600">Bàn hiện đang trống</p>
                      <p className="text-xs text-stone-400">Chưa có đơn hàng nào được đặt tại bàn này.</p>
                      <Link
                        to={`/ban/${selectedTable.id}`}
                        target="_blank"
                        className="inline-block px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition"
                      >
                        Mở menu gọi món bàn này
                      </Link>
                    </div>
                  );
                }

                const order = (selectedOrderId ? tableOrders.find((o) => o.id === selectedOrderId) : null) || tableOrders[0];

                return (
                  <div className="py-4 space-y-4">
                    {/* Multi-bill Tabs (nếu bàn có nhiều hóa đơn sau khi tách bill) */}
                    {tableOrders.length > 1 && (
                      <div className="space-y-1.5 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                          <span>Bàn có {tableOrders.length} bill cần thanh toán:</span>
                          <span className="text-[11px] font-normal text-amber-700">Chọn bill để thu tiền</span>
                        </div>
                        <div className="flex gap-2">
                          {tableOrders.map((ord, idx) => {
                            const isTabActive = ord.id === order.id;
                            return (
                              <button
                                key={ord.id}
                                type="button"
                                onClick={() => setSelectedOrderId(ord.id)}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center border ${
                                  isTabActive
                                    ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                                    : 'bg-white text-stone-700 border-amber-200 hover:bg-stone-50'
                                }`}
                              >
                                <span>Bill #{idx + 1}</span>
                                <span className={`text-[10px] font-extrabold ${isTabActive ? 'text-amber-300' : 'text-navy-900'}`}>
                                  {Number(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Mã đơn: <b className="font-mono text-navy-900">#{order.orderNumber}</b></span>
                      <span>Giờ gọi: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>

                    {/* Table Status Switcher button (US12) */}
                    <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl text-xs border border-stone-200">
                      <span className="font-bold text-stone-700">Trạng thái bàn hiện tại:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTableStatus(selectedTable.id, selectedTable.status)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5 ${
                          selectedTable.status === 'WAITING_PAYMENT'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="Bấm để chuyển đổi trạng thái bàn"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>
                          {selectedTable.status === 'WAITING_PAYMENT' ? 'Chờ thanh toán (Bấm đổi)' : 'Có khách (Bấm đổi)'}
                        </span>
                      </button>
                    </div>

                    {/* Order items list with status & Cancel action (US20) */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-xs border border-stone-100"
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`font-bold ${item.status === 'CANCELLED' ? 'line-through text-stone-400' : 'text-navy-900'}`}>
                              {item.quantity} × {item.menuItem?.name}
                            </div>
                            {item.note && (
                              <div className="text-[11px] text-amber-700 italic">
                                Ghi chú: {item.note}
                              </div>
                            )}
                            {item.status === 'CANCELLED' && (
                              <div className="text-[10px] text-rose-600 font-semibold">
                                Đã hủy: {item.cancelReason}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'SERVED'
                                ? 'bg-purple-100 text-purple-800'
                                : item.status === 'READY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'COOKING'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status === 'SERVED'
                                ? 'Đã lên món'
                                : item.status === 'READY'
                                ? 'Nấu xong'
                                : item.status === 'COOKING'
                                ? 'Đang nấu'
                                : item.status === 'CANCELLED'
                                ? 'Đã hủy'
                                : 'Chờ nấu'}
                            </span>

                            {item.status !== 'CANCELLED' && item.status !== 'SERVED' && (
                              <button
                                onClick={() => handleCancelItemCashier(item.id)}
                                className="text-[11px] font-bold text-rose-600 hover:underline px-1"
                                title="Hủy món"
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Split bill & Merge buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleOpenSplitModal(order)}
                        className="flex-1 py-2 px-3 border border-stone-300 hover:bg-stone-50 text-navy-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Split size={14} />
                        <span>Tách bill</span>
                      </button>

                      <button
                        onClick={() => {
                          setSourceTableId(selectedTable.id.toString());
                          setShowMergeModal(true);
                        }}
                        className="flex-1 py-2 px-3 border border-stone-300 hover:bg-stone-50 text-navy-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Combine size={14} />
                        <span>Gộp bàn</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Checkout Actions */}
            {(() => {
              const tableOrders = getTableOrders(selectedTable.id);
              if (tableOrders.length === 0) return null;
              const order = (selectedOrderId ? tableOrders.find((o) => o.id === selectedOrderId) : null) || tableOrders[0];

              return (
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-600">
                      {tableOrders.length > 1 ? `Tạm tính Bill đang chọn:` : `Tạm tính tiền món:`}
                    </span>
                    <span className="text-2xl font-extrabold text-navy-900 font-display">
                      {Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button
                    onClick={() => setOrderForCheckout(order)}
                    style={{ backgroundColor: '#0b1329' }}
                    className="w-full py-3.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition shadow flex items-center justify-center gap-2"
                  >
                    <Receipt size={17} />
                    <span>
                      {tableOrders.length > 1
                        ? `Thanh toán Bill này (${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ)`
                        : 'Thanh toán & Xuất hóa đơn'}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. Modal Thanh Toán */}
      {orderForCheckout && (() => {
        const subtotal = orderForCheckout.totalAmount || 0;
        const discountVal = Number(discount) || 0;
        const taxable = Math.max(0, subtotal - discountVal);
        const vatAmount = Math.round(taxable * (vatRate / 100));
        const finalAmount = taxable + vatAmount;
        const discountPercent = subtotal > 0 ? (discountVal / subtotal) * 100 : 0;
        const exceedsLimit = !appliedPromo && discountPercent > discountLimitPercent;
        const hasUnfinished = orderForCheckout.items?.some((it) => ['PENDING', 'COOKING'].includes(it.status));

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="font-extrabold text-lg text-navy-900 font-display">
                  Thanh toán đơn #{orderForCheckout.orderNumber}
                </h3>
                <button
                  onClick={() => {
                    setOrderForCheckout(null);
                    setPaidConfirmed(false);
                    setAdminPassword('');
                    setAppliedPromo(null);
                    setPromoCodeInput('');
                    setPromoError('');
                    setDiscount(0);
                  }}
                  className="p-1 text-stone-400 hover:text-navy-900"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Warning if items are still cooking */}
              {hasUnfinished && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Cảnh báo món chưa hoàn thành:</p>
                    <p>Bàn vẫn còn món đang chờ chế biến hoặc đang nấu. Hãy xác nhận với khách trước khi xuất hóa đơn.</p>
                  </div>
                </div>
              )}

              {/* Cảnh báo nếu tài khoản hiện tại không phải Thu ngân hoặc Admin */}
              {!canCheckout && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <AlertTriangle size={16} />
                    <span>Bạn đang ở phiên tài khoản: {user?.role === 'KITCHEN' ? 'Nhân viên Bếp' : user?.role || 'Khác'} (@{user?.username})</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Bếp không có quyền thu tiền và xuất hóa đơn. Hãy đăng nhập tài khoản <b>Thu ngân (cashier)</b> hoặc <b>Quản trị viên (admin)</b> để hoàn tất.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await login('cashier', '123456');
                        alert('Đã chuyển nhanh sang tài khoản Thu ngân (cashier) thành công! Bây giờ bạn có thể bấm Xác nhận thanh toán.');
                      } catch (e) {
                        alert(e.message);
                      }
                    }}
                    className="w-full py-2 px-3 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    Bấm vào đây để chuyển sang Thu ngân (cashier)
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>Tiền món (Tạm tính):</span>
                  <span className="font-bold text-navy-900">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Khung Áp dụng Mã khuyến mãi / Voucher */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-navy-900 flex items-center gap-1.5 text-xs">
                      <Tag size={14} className="text-amber-700" />
                      <span>Áp mã khuyến mãi / Voucher:</span>
                    </label>
                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <X size={12} /> Bỏ mã
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã (VD: TASTY10, VIP50K)..."
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      disabled={!!appliedPromo}
                      className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-stone-300 rounded-xl uppercase tracking-wider focus:outline-none focus:border-navy-900 disabled:bg-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={checkingPromo || !!appliedPromo || !promoCodeInput.trim()}
                      className="px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 disabled:bg-stone-300 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      {checkingPromo ? 'Kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{promoError}</span>
                    </p>
                  )}

                  {appliedPromo && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-extrabold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Mã <b>{appliedPromo.code}</b>: {appliedPromo.name}</span>
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">
                          {appliedPromo.type === 'percent'
                            ? `Giảm ${appliedPromo.value}% (tối đa ${(appliedPromo.maxDiscount || 0).toLocaleString('vi-VN')}đ)`
                            : `Giảm ${appliedPromo.value.toLocaleString('vi-VN')}đ`}
                        </p>
                      </div>
                      <span className="font-extrabold text-xs text-emerald-700">
                        -{(Number(discount) || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}

                  {/* Gợi ý các mã voucher đang có sẵn */}
                  {!appliedPromo && availablePromos.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-stone-500 mb-1">Mã có sẵn cho bàn:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availablePromos.map((p) => {
                          const isEligible = subtotal >= (p.minOrder || 0);
                          return (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => handleSelectPromo(p)}
                              disabled={!isEligible}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                isEligible
                                  ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer shadow-xs active:scale-95'
                                  : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                              }`}
                              title={
                                !isEligible
                                  ? `Cần đơn từ ${(p.minOrder || 0).toLocaleString('vi-VN')}đ (hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`
                                  : p.name
                              }
                            >
                              🏷️ {p.code} ({p.type === 'percent' ? `-${p.value}%` : `-${Math.round(p.value / 1000)}k`})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-stone-700">
                      Chiết khấu / Giảm giá (đ):
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Tối đa Thu ngân: <strong>{discountLimitPercent}%</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:border-navy-900"
                  />
                  {exceedsLimit && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1.5">
                      <p className="font-bold flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>Vượt hạn mức {discountLimitPercent}% ({discountPercent.toFixed(1)}%). Cần Admin duyệt:</span>
                      </p>
                      <input
                        type="password"
                        placeholder="Nhập mật khẩu Admin (123456)..."
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Thuế VAT ({vatRate}%):</span>
                  <span className="font-bold text-navy-900">
                    +{vatAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Phương thức thanh toán:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentMethod === 'CASH'
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <Banknote size={14} />
                      <span>Tiền mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Chuyển khoản</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR_CODE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        paymentMethod === 'QR_CODE'
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <QrCode size={14} />
                      <span>VietQR</span>
                    </button>
                  </div>
                </div>

                {/* Non-cash manual confirmation checkbox (US15) */}
                {paymentMethod !== 'CASH' && (
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="paidConfirmCheck"
                      checked={paidConfirmed}
                      onChange={(e) => setPaidConfirmed(e.target.checked)}
                      className="w-4 h-4 text-navy-900 rounded cursor-pointer"
                    />
                    <label htmlFor="paidConfirmCheck" className="font-bold text-navy-900 cursor-pointer">
                      Đã nhận đủ tiền từ khách (Thu ngân tick tay)
                    </label>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-stone-800">Tổng thực thu:</span>
                  <span className="text-2xl font-extrabold text-navy-900 font-display">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderForCheckout(null);
                    setPaidConfirmed(false);
                  }}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={submitting || !canCheckout}
                  onClick={handleProcessCheckout}
                  style={{ backgroundColor: canCheckout ? '#0b1329' : '#9ca3af' }}
                  className="flex-1 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {!canCheckout ? 'Cần quyền Thu ngân / Admin' : submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Modal Gộp Bàn (US13) */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                Gộp Bàn Ăn
              </h3>
              <button
                onClick={() => setShowMergeModal(false)}
                className="p-1 text-stone-400 hover:text-navy-900"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMergeTables} className="space-y-4 text-xs font-bold text-stone-700">
              <div>
                <label className="block mb-1">Bàn nguồn (chuyển món đi):</label>
                <select
                  value={sourceTableId}
                  onChange={(e) => setSourceTableId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-semibold"
                >
                  <option value="">Chọn bàn nguồn</option>
                  {tables
                    .filter((t) => t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} ({getTableTotal(t.id).toLocaleString('vi-VN')}đ)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Bàn đích (nhận món gộp vào):</label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-semibold"
                >
                  <option value="">Chọn bàn đích</option>
                  {tables
                    .filter((t) => t.id.toString() !== sourceTableId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} ({t.status === 'AVAILABLE' ? 'Trống' : 'Có khách'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="flex-1 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#0b1329' }}
                  className="flex-1 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Đang gộp...' : 'Xác nhận gộp bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Tách Hóa Đơn (US14: chỉ cho phép tách món READY hoặc SERVED) */}
      {showSplitModal && orderForSplit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                Tách Hóa Đơn
              </h3>
              <button
                onClick={() => setShowSplitModal(false)}
                className="p-1 text-stone-400 hover:text-navy-900"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Chỉ được tách các món đã nấu xong hoặc đã lên bàn để tránh xung đột với bếp:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {orderForSplit.items?.map((item) => {
                const currentQty = splitItemsState[item.id] || 0;
                const canSplit = ['READY', 'SERVED'].includes(item.status);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-navy-900">{item.menuItem?.name}</div>
                      <div className="text-stone-500">
                        Gốc: {item.quantity} · {item.price.toLocaleString('vi-VN')}đ
                      </div>
                      {!canSplit && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Đang nấu (chưa thể tách)
                        </span>
                      )}
                    </div>

                    {canSplit ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSplitItemsState({
                              ...splitItemsState,
                              [item.id]: Math.max(0, currentQty - 1),
                            })
                          }
                          className="w-7 h-7 rounded-lg border border-stone-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-navy-900">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSplitItemsState({
                              ...splitItemsState,
                              [item.id]: Math.min(item.quantity, currentQty + 1),
                            })
                          }
                          className="w-7 h-7 rounded-lg border border-stone-300 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs font-semibold">Khóa</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSplit}
                style={{ backgroundColor: '#0b1329' }}
                className="flex-1 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {submitting ? 'Đang tách...' : 'Xác nhận tách bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Xem trước & In Hóa Đơn PDF (US15) */}
      {viewingInvoice && (
        <InvoiceTemplate
          invoiceData={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};

export default CashierDashboard;
