import React, { useState, useEffect } from 'react';
import { supportApi } from '../../services/support.api';
import { useSocket } from '../../context/SocketContext';
import { Bell, CheckCircle2, XCircle, Clock, Utensils, RefreshCw, AlertCircle } from 'lucide-react';

const SupportRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('cho_xu_ly'); // 'all' | 'cho_xu_ly' | 'da_xu_ly'
  const { socket } = useSocket();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await supportApi.getAll();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Lỗi tải yêu cầu hỗ trợ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Lắng nghe socket realtime
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      setRequests((prev) => [data, ...prev]);
    };

    const handleUpdate = (data) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, status: data.status } : r))
      );
    };

    socket.on('support_request_created', handleNewRequest);
    socket.on('support_request_updated', handleUpdate);

    return () => {
      socket.off('support_request_created', handleNewRequest);
      socket.off('support_request_updated', handleUpdate);
    };
  }, [socket]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await supportApi.updateStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'cho_xu_ly').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 text-primary rounded-xl">
              <Bell className="w-6 h-6 animate-bounce" />
            </span>
            <h1 className="text-2xl font-bold text-stone-900 font-display">
              Yêu Cầu Hỗ Trợ Tại Bàn
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Nhận tín hiệu gọi phục vụ, xin đá/nước, thêm chén đũa và yêu cầu thanh toán thời gian thực từ khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-700 font-medium text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <div className="px-4 py-2 bg-red-50 text-primary font-bold text-sm rounded-xl border border-red-200">
            Chờ xử lý: {pendingCount}
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('cho_xu_ly')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filter === 'cho_xu_ly'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Cần xử lý ngay ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('da_xu_ly')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filter === 'da_xu_ly'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Đã phục vụ
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Tất cả yêu cầu
        </button>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-500">Đang tải dữ liệu yêu cầu...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">Không có yêu cầu nào tồn đọng</h3>
          <p className="text-sm text-stone-500 mt-1">Toàn bộ khách hàng tại các bàn đã được phục vụ chu đáo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'cho_xu_ly';
            const timeStr = new Date(req.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={req.id}
                className={`rounded-2xl border p-5 transition relative overflow-hidden bg-white ${
                  isPending
                    ? 'border-primary shadow-md ring-2 ring-red-100'
                    : 'border-stone-200 opacity-75'
                }`}
              >
                {isPending && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 font-bold rounded-lg text-sm border border-amber-200 shadow-xs">
                        {req.tableNumber || req.table?.tableNumber || `Bàn ${req.tableId}`}
                      </span>
                      {req.table?.area && (
                        <span className="text-xs text-stone-500 font-medium">
                          {req.table.area}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mt-2 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      {req.reason}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'da_xu_ly'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {isPending ? 'Đang chờ' : req.status === 'da_xu_ly' ? 'Đã xong' : 'Đã hủy'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500 mt-4 pt-3 border-t border-stone-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Gửi lúc: {timeStr}</span>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 mt-4 pt-2">
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'da_xu_ly')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Đã phục vụ
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'da_huy')}
                      className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
                    >
                      Bỏ qua
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportRequestsPage;
