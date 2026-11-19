import React, { useState, useEffect } from 'react';
import { reportApi } from '../../services/report.api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, RefreshCw, Calendar, Award } from 'lucide-react';

const RevenueReport = () => {
  const [period, setPeriod] = useState('all'); // 'all', 'today', 'month'
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, topRes] = await Promise.all([
        reportApi.getStats(period),
        reportApi.getRevenueChart(period),
        reportApi.getTopSelling(5),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (chartRes.success) setChartData(chartRes.data);
      if (topRes.success) setTopItems(topRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header with Date/Month Filter (US16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-orange-600" />
            <span>Báo cáo & Thống kê Doanh thu (US16)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tổng quan hiệu quả kinh doanh, phân tích doanh số và xu hướng ẩm thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bộ lọc ngày/tháng */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Toàn thời gian
            </button>
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'month' ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
          </div>

          <button
            onClick={fetchReports}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 3 Thẻ chỉ số tổng quan theo đúng yêu cầu: Tổng doanh thu, Tổng số đơn, Giá trị đơn TB (US16) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Thẻ 1: Tổng doanh thu */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">● Doanh thu thực tế đã thu</p>
          </div>
        </div>

        {/* Thẻ 2: Tổng số đơn */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Đơn</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {stats?.totalCompletedOrders || 0} <span className="text-sm font-semibold text-slate-500">đơn</span>
            </h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">● Hóa đơn thanh toán hoàn tất</p>
          </div>
        </div>

        {/* Thẻ 3: Giá trị đơn TB */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giá Trị Đơn Trung Bình (TB)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {(stats?.averageOrderValue || 0).toLocaleString('vi-VN')} đ
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">● Trung bình mỗi hóa đơn</p>
          </div>
        </div>
      </div>

      {/* Biểu đồ Recharts & Bảng Top món bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu Recharts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">Biểu đồ doanh thu theo thời gian</h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Calendar size={13} />
              <span>Đơn vị: VNĐ</span>
            </span>
          </div>

          <div className="h-80 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    formatter={(val) => [`${Number(val).toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bảng Top món bán chạy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <Award className="text-amber-500" size={18} />
                <span>Top món bán chạy</span>
              </h3>
              <span className="text-[11px] text-slate-400">Top 5</span>
            </div>

            <div className="space-y-3">
              {topItems.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">Chưa có số liệu bán hàng</p>
              ) : (
                topItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span
                      className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {item.price?.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-orange-600">
                        {item.soldQuantity} phần
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs text-orange-800 font-medium">
            💡 Dữ liệu tự động đồng bộ theo các hóa đơn đã thanh toán thành công
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
