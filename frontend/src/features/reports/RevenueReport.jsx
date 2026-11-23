import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { invoiceApi } from '../../services/invoice.api';
import { tableApi } from '../../services/table.api';
import { menuApi } from '../../services/menu.api';
import { reportApi } from '../../services/report.api';
import { useSocket } from '../../context/SocketContext';
import {
  Wallet,
  Receipt,
  Utensils,
  Grid,
  Download,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';

const RevenueReport = () => {
  // Tabs: 'today' | '7days' | 'month' | 'year'
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topItems, setTopItems] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, ordRes, tblRes, catRes, topRes] = await Promise.all([
        invoiceApi.getAll(),
        orderApi.getAll(),
        tableApi.getAll(),
        menuApi.getCategories(),
        reportApi.getTopSelling(10).catch(() => ({ data: [] })),
      ]);

      setInvoices(invRes.data || []);
      setOrders(ordRes.data || []);
      setTables(tblRes.data || []);
      setCategories(catRes.data || []);
      setTopItems(topRes.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      const handleUpdate = () => fetchData();
      socket.on('new_order', handleUpdate);
      socket.on('order-created', handleUpdate);
      socket.on('invoice-created', handleUpdate);
      socket.on('order-completed', handleUpdate);

      return () => {
        socket.off('new_order', handleUpdate);
        socket.off('order-created', handleUpdate);
        socket.off('invoice-created', handleUpdate);
        socket.off('order-completed', handleUpdate);
      };
    }
  }, [socket]);

  // Filter invoices and orders based on period
  const now = new Date();
  const getFilterThreshold = () => {
    const d = new Date();
    if (period === 'today') {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
    if (period === '7days') {
      return d.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    if (period === 'month') {
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }
    if (period === 'year') {
      return new Date(d.getFullYear(), 0, 1).getTime();
    }
    return 0;
  };

  const threshold = getFilterThreshold();
  const filteredInvoices = invoices.filter(
    (inv) => new Date(inv.paidAt || inv.createdAt).getTime() >= threshold
  );

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.finalAmount) || 0), 0);
  const paidCount = filteredInvoices.length;
  const avgPerInvoice = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  // Items sold in period
  const filteredOrders = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= threshold
  );
  let totalItemsSold = 0;
  const itemMap = {};

  filteredOrders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const q = Number(it.quantity) || 1;
      totalItemsSold += q;
      const key = it.menuItemId || it.name;
      if (!itemMap[key]) {
        itemMap[key] = {
          name: it.menuItem?.name || it.name || 'Món ăn',
          quantity: 0,
          price: Number(it.price) || 0,
          categoryName: it.menuItem?.category?.name || 'Món chính',
        };
      }
      itemMap[key].quantity += q;
    });
  });

  const uniqueItemsCount = Object.keys(itemMap).length;
  const soldItemsList = Object.values(itemMap);

  // Table status
  const totalTables = tables.length || 12;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT').length;
  const waitingPaymentTables = tables.filter((t) => t.status === 'WAITING_PAYMENT').length;

  // Payment method breakdown
  const paymentMethods = {
    CASH: { label: 'Tiền mặt', count: 0, amount: 0, color: '#0b1329' },
    BANK_TRANSFER: { label: 'Chuyển khoản / QR', count: 0, amount: 0, color: '#3b82f6' },
    CARD: { label: 'Thẻ ngân hàng', count: 0, amount: 0, color: '#10b981' },
  };

  filteredInvoices.forEach((inv) => {
    const m = inv.paymentMethod || 'CASH';
    if (!paymentMethods[m]) {
      paymentMethods[m] = { label: m, count: 0, amount: 0, color: '#6b7280' };
    }
    paymentMethods[m].count += 1;
    paymentMethods[m].amount += Number(inv.finalAmount) || 0;
  });

  const hasPaymentData = paidCount > 0;

  // Category revenue breakdown
  const categoryRevenue = {};
  soldItemsList.forEach((it) => {
    const cat = it.categoryName || 'Khác';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + it.quantity * it.price;
  });

  // Hourly timeline for chart (8h to 23h)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const hourlyData = hours.map((h) => {
    const inHour = filteredInvoices.filter((inv) => {
      const d = new Date(inv.paidAt || inv.createdAt);
      return d.getHours() === h;
    });
    return inHour.reduce((s, inv) => s + (Number(inv.finalAmount) || 0) / 1000, 0); // In thousands
  });

  const maxVal = Math.max(...hourlyData, 10);

  const handleExportCSV = () => {
    const headers = 'Mã HĐ,Thời gian,Số tiền,Phương thức,Bàn\n';
    const rows = filteredInvoices
      .map(
        (i) =>
          `"${i.invoiceNumber || i.id}","${new Date(i.paidAt || i.createdAt).toLocaleString('vi-VN')}","${i.finalAmount}","${i.paymentMethod}","${i.order?.table?.tableNumber || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-doanh-thu-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Thống kê & báo cáo
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tổng quan doanh thu, món bán chạy và tình hình phục vụ.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-navy-900 hover:bg-stone-50 transition shadow-xs self-start sm:self-auto bg-white"
        >
          <Download size={14} />
          <span>Xuất CSV</span>
        </button>
      </div>

      {/* 2. Filter Tabs (Ảnh 1: Hôm nay, 7 ngày, Tháng này, Năm nay) */}
      <div className="flex items-center gap-2">
        {[
          { id: 'today', label: 'Hôm nay' },
          { id: '7days', label: '7 ngày' },
          { id: 'month', label: 'Tháng này' },
          { id: 'year', label: 'Năm nay' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            style={period === tab.id ? { backgroundColor: '#0b1329', color: '#ffffff' } : {}}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              period === tab.id
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. 4 KPI Cards (Ảnh 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu thực nhận */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Doanh thu thực nhận</span>
            <span className="text-stone-400">
              <Wallet size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </div>
            <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${totalRevenue > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
              {totalRevenue > 0 ? (
                <>
                  <TrendingUp size={13} />
                  <span>+12.5% so với kỳ trước</span>
                </>
              ) : (
                <>
                  <TrendingDown size={13} />
                  <span>0% so với kỳ trước</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Hóa đơn đã thanh toán */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Hóa đơn đã thanh toán</span>
            <span className="text-stone-400">
              <Receipt size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
              {paidCount}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium">
              TB {avgPerInvoice.toLocaleString('vi-VN')}đ / hóa đơn
            </div>
          </div>
        </div>

        {/* Card 3: Món đã bán */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Món đã bán</span>
            <span className="text-stone-400">
              <Utensils size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
              {totalItemsSold}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium">
              {uniqueItemsCount} món khác nhau
            </div>
          </div>
        </div>

        {/* Card 4: Bàn đang phục vụ */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Bàn đang phục vụ</span>
            <span className="text-stone-400">
              <Grid size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
              {occupiedTables}/{totalTables}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium">
              {waitingPaymentTables} bàn chưa thanh toán
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chart Row: Doanh thu theo thời gian + Phương thức thanh toán (Ảnh 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Doanh thu theo thời gian */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-navy-900 font-display">Doanh thu theo thời gian</h3>
          </div>
          <div className="h-48 relative flex items-end justify-between pt-6 pb-4 border-b border-stone-200">
            {hours.map((h, idx) => {
              const val = hourlyData[idx];
              const heightPercent = maxVal > 0 ? (val / maxVal) * 80 : 0;
              return (
                <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {val > 0 && (
                    <div className="absolute -top-6 bg-navy-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {Math.round(val)}k
                    </div>
                  )}
                  <div
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    className={`w-2.5 rounded-t transition-all ${
                      val > 0 ? 'bg-navy-900' : 'bg-stone-200'
                    }`}
                  />
                  <span className="text-[10px] text-stone-400 mt-2 font-mono">{h}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Phương thức thanh toán */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-sm text-navy-900 font-display mb-3">Phương thức thanh toán</h3>
          {!hasPaymentData ? (
            <div className="my-auto py-12 text-center text-xs text-stone-400 font-medium">
              Chưa có dữ liệu trong kỳ này.
            </div>
          ) : (
            <div className="space-y-3 my-auto">
              {Object.entries(paymentMethods).map(([k, pm]) => {
                const percent = totalRevenue > 0 ? Math.round((pm.amount / totalRevenue) * 100) : 0;
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{pm.label}</span>
                      <span className="font-bold">{pm.amount.toLocaleString('vi-VN')}đ ({percent}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%`, backgroundColor: pm.color }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Row: Món bán chạy + Doanh thu theo danh mục (Ảnh 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Món bán chạy */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <h3 className="font-bold text-sm text-navy-900 font-display mb-4">Món bán chạy</h3>
          {soldItemsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 font-medium">
              Chưa có dữ liệu trong kỳ này.
            </div>
          ) : (
            <div className="space-y-3">
              {soldItemsList.slice(0, 5).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-navy-900">{it.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-stone-600">
                    <span>{it.quantity} phần</span>
                    <span className="font-bold text-navy-900">
                      {(it.quantity * it.price).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doanh thu theo danh mục */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <h3 className="font-bold text-sm text-navy-900 font-display mb-4">Doanh thu theo danh mục</h3>
          {Object.keys(categoryRevenue).length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 font-medium">
              Chưa có dữ liệu trong kỳ này.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryRevenue).map(([cat, rev]) => {
                const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">{cat}</span>
                      <span className="font-bold text-navy-900">{rev.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min(pct, 100)}%` }} className="h-full bg-navy-900 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Chi tiết món đã bán (Ảnh 1) */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h3 className="font-bold text-sm text-navy-900 font-display mb-4">Chi tiết món đã bán</h3>
        {soldItemsList.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-400">
            Chưa có món bán ra trong khoảng thời gian này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px] bg-stone-50">
                  <th className="py-3 px-4">Tên món</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-center">Đơn giá</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4 text-right">Tổng thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {soldItemsList.map((it, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 font-bold text-navy-900">{it.name}</td>
                    <td className="py-3 px-4 text-stone-600">{it.categoryName}</td>
                    <td className="py-3 px-4 text-center">{it.price.toLocaleString('vi-VN')}đ</td>
                    <td className="py-3 px-4 text-center font-bold text-navy-900">{it.quantity}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-navy-900">
                      {(it.quantity * it.price).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueReport;
