import React, { useState, useEffect } from 'react';
import { orderApi } from '../../services/order.api';
import { menuApi } from '../../services/menu.api';
import { useSocket } from '../../context/SocketContext';
import OrderTicketCard from './OrderTicketCard';
import { ChefHat, RefreshCw, Layers, CheckCircle, AlertOctagon, Volume2 } from 'lucide-react';

const KitchenBoard = () => {
  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' or 'STOCK'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { socket } = useSocket();

  // Play browser chime on new order
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders({ activeOnly: true });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await menuApi.getItems();
      if (res.success) {
        setMenuItems(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    fetchMenuItems();

    if (socket) {
      socket.emit('join-staff');

      // US09: new_order socket event
      const handleNewOrder = (newOrder) => {
        playAlertSound();
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      };

      socket.on('new_order', handleNewOrder);
      socket.on('order-created', handleNewOrder);

      // US10: order status update
      socket.on('order-status-updated', (updatedOrder) => {
        if (['COMPLETED', 'CANCELLED', 'SERVED'].includes(updatedOrder.status)) {
          setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
        }
      });

      // US10: order item status update
      socket.on('order_item_updated', (updatedItem) => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === updatedItem.orderId) {
              const updatedItems = o.items.map((it) =>
                it.id === updatedItem.id ? { ...it, status: updatedItem.status } : it
              );
              return { ...o, items: updatedItems };
            }
            return o;
          })
        );
      });

      // US11: menu item stock update
      socket.on('menu_item_updated', (updatedItem) => {
        setMenuItems((prev) =>
          prev.map((it) => (it.id === updatedItem.id ? { ...it, ...updatedItem } : it))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order-created');
        socket.off('order-status-updated');
        socket.off('order_item_updated');
        socket.off('menu_item_updated');
      }
    };
  }, [socket]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      fetchActiveOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      await orderApi.updateItemStatus(itemId, newStatus);
      fetchActiveOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // US11: Kitchen toggles stock availability
  const handleToggleStock = async (itemId) => {
    try {
      await menuApi.toggleStock(itemId);
      fetchMenuItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="text-orange-600" />
            <span>Màn hình Điều phối Bếp (KDS - US09 & US10)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tiếp nhận đơn hàng theo thời gian thực và quản lý tồn kho nguyên liệu trong ngày
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Tab Switcher */}
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'ORDERS' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Layers size={14} />
              <span>Đơn cần chế biến ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'STOCK' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <AlertOctagon size={14} />
              <span>Tình trạng món (US11)</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchActiveOrders();
              fetchMenuItems();
            }}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {activeTab === 'ORDERS' ? (
        <>
          {/* Subfilter */}
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
                }`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === 'PENDING' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-600'
                }`}
              >
                Chờ chế biến
              </button>
              <button
                onClick={() => setFilter('COOKING')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === 'COOKING' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'
                }`}
              >
                Đang nấu
              </button>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Volume2 size={14} className="text-emerald-500" />
              <span>Chuông âm báo tự động bật</span>
            </div>
          </div>

          {/* Orders Board */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Hiện không có đơn hàng nào đang chờ chế biến</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <OrderTicketCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateItemStatus={handleUpdateItemStatus}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* US11: Kitchen Stock Availability Management */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Cập nhật nhanh tình trạng còn / hết món trong ca (US11)
            </h3>
            <p className="text-xs text-slate-500">
              Gạt để đánh dấu tạm hết nguyên liệu. Trạng thái sẽ lập tức làm mờ và khóa chọn trên điện thoại của khách hàng theo thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItems
              .filter((it) => it.isSelling)
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    item.isAvailable ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.category?.name}</p>
                  </div>

                  <button
                    onClick={() => handleToggleStock(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                      item.isAvailable
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {item.isAvailable ? 'Còn hàng' : 'Tạm hết món'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenBoard;
