import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { ChefHat, Clock, CheckCircle2, Search, ArrowLeft, RefreshCw, Calendar, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

const KitchenHistoryPage = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      // Lấy các đơn đã READY, SERVED, COMPLETED hoặc có món đã nấu xong
      const finished = rawList.filter(
        (o) =>
          o.status === 'READY' ||
          o.status === 'COMPLETED' ||
          o.status === 'SERVED' ||
          o.items?.some((it) => it.status === 'READY' || it.status === 'SERVED')
      );
      setCompletedOrders(finished);
    } catch (err) {
      console.error('Lỗi tải lịch sử bếp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredOrders = completedOrders.filter((order) => {
    const tableStr = order.table?.tableNumber || `Bàn ${order.tableId}`;
    const matchTable = tableStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDish = order.items?.some((i) =>
      i.menuItem?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchTable || matchDish;
  });

  const totalFinishedDishes = completedOrders.reduce((sum, order) => {
    return sum + (order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/bep"
            className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-700 transition"
            title="Quay lại Màn hình Bếp KDS"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-navy-900 text-gold rounded-xl shadow-xs">
                <ChefHat className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-extrabold text-navy-900 font-display">
                Lịch Sử Chế Biến Món Bếp
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-medium">
              Nhật ký các phiếu order và món ăn đã hoàn thành nấu trong ca làm việc.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 font-bold text-sm rounded-xl border border-emerald-200">
            Tổng món nấu xong: {totalFinishedDishes}
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-700 font-medium text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Tìm theo số bàn hoặc tên món ăn đã nấu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
      </div>

      {/* Danh sách các phiếu order hoàn thành */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Đang tải nhật ký lịch sử...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">Chưa có dữ liệu lịch sử hoàn thành</h3>
          <p className="text-sm text-stone-500 mt-1">Khi bếp hoàn thành các đơn nấu, lịch sử sẽ được lưu trữ tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const tableTitle = order.table?.tableNumber || `Bàn ${order.tableId}`;
            const timeStr = new Date(order.updatedAt || order.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN');

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-stone-100 font-extrabold text-stone-900 rounded-lg text-sm">
                        {tableTitle}
                      </span>
                      <span className="font-mono text-xs text-stone-500">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Hoàn thành
                    </span>
                  </div>

                  {/* Danh sách món */}
                  <div className="mt-3 space-y-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm py-1 border-b border-stone-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-primary w-5 text-right">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-stone-800">
                            {item.menuItem?.name}
                          </span>
                        </div>

                        {item.note && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded italic">
                            {item.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Xong lúc: {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenHistoryPage;
