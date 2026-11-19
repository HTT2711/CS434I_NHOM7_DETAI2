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
import { DollarSign, ShoppingBag, Grid, TrendingUp, RefreshCw } from 'lucide-react';

const RevenueReport = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, topRes] = await Promise.all([
        reportApi.getStats(),
        reportApi.getRevenueChart(),
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
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-orange-600" />
            <span>Thống kê Doanh thu & Báo cáo</span>
          </h2>
          <p className="text-xs text-slate-500">Tổng quan tình hình kinh doanh và doanh số nhà hàng</p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Doanh Thu</p>
            <h3 className="text-xl font-extrabold text-slate-800">
              {(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Hóa Đơn Hoàn Tất</p>
            <h3 className="text-xl font-extrabold text-slate-800">
              {stats?.totalCompletedOrders || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Grid size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Bàn Đang Có Khách</p>
            <h3 className="text-xl font-extrabold text-slate-800">
              {stats?.occupiedTables || 0} / {stats?.totalTables || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Đơn Đang Chế Biến</p>
            <h3 className="text-xl font-extrabold text-slate-800">
              {stats?.activeOrdersCount || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Chart and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Biểu đồ doanh thu gần đây</h3>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Chưa có dữ liệu giao dịch gần đây
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
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Top 5 món bán chạy nhất</h3>

          <div className="space-y-3">
            {topItems.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">Chưa có số liệu bán hàng</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-orange-600">
                      {item.soldQuantity} phần
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;
