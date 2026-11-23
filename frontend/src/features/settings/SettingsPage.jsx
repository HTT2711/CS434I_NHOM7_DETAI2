import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../services/settings.api';
import { menuApi } from '../../services/menu.api';
import { tableApi } from '../../services/table.api';
import { authApi } from '../../services/auth.api';
import { orderApi } from '../../services/order.api';
import { invoiceApi } from '../../services/invoice.api';
import { Info, Bell, Shield, RotateCcw, Check } from 'lucide-react';

const SettingsPage = () => {
  const [counts, setCounts] = useState({
    menuItems: 0,
    tables: 0,
    users: 0,
    orders: 0,
    invoices: 0,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    kitchenNewOrder: true,
    cashierOrderPlaced: true,
    cashierCallWaiter: true,
    cashierOrderReady: true,
    cashierItemStock: true,
    customerStatusUpdate: true,
    showFloatingToast: true,
    playNotificationSound: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireCaptcha: false,
  });

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    // Load real counts from DB
    const loadCounts = async () => {
      try {
        const [mRes, tRes, uRes, oRes, iRes] = await Promise.all([
          menuApi.getItems().catch(() => ({ data: [] })),
          tableApi.getAll().catch(() => ({ data: [] })),
          authApi.getUsers().catch(() => ({ data: [] })),
          orderApi.getAll().catch(() => ({ data: [] })),
          invoiceApi.getAll().catch(() => ({ data: [] })),
        ]);
        setCounts({
          menuItems: Array.isArray(mRes.data) ? mRes.data.length : 0,
          tables: Array.isArray(tRes.data) ? tRes.data.length : 0,
          users: Array.isArray(uRes.data) ? uRes.data.length : (Array.isArray(uRes) ? uRes.length : 0),
          orders: Array.isArray(oRes.data) ? oRes.data.length : 0,
          invoices: Array.isArray(iRes.data) ? iRes.data.length : 0,
        });
      } catch (e) {
        console.warn('Using default counts', e);
      }
    };
    loadCounts();
  }, []);

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    flashSaved();
  };

  const toggleSecurity = (key) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: !prev[key] }));
    flashSaved();
  };

  const flashSaved = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Khôi phục toàn bộ cài đặt thông báo và bảo mật về mặc định?')) return;
    setNotificationSettings({
      kitchenNewOrder: true,
      cashierOrderPlaced: true,
      cashierCallWaiter: true,
      cashierOrderReady: true,
      cashierItemStock: true,
      customerStatusUpdate: true,
      showFloatingToast: true,
      playNotificationSound: false,
    });
    setSecuritySettings({
      requireCaptcha: false,
    });
    flashSaved();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Cài đặt
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Thông tin ứng dụng và các tùy chỉnh dùng chung cho toàn nhà hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check size={14} />
              Đã lưu cài đặt
            </span>
          )}

          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition bg-white shadow-2xs"
          >
            Khôi phục mặc định
          </button>
        </div>
      </div>

      {/* 2. Grid 2 Cột (Ảnh 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cột Trái: Thông tin ứng dụng */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-navy-900 font-display flex items-center gap-1.5">
              <Info size={15} className="text-stone-500" />
              <span>Thông tin ứng dụng</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Phiên bản, nhà hàng và số liệu hiện có.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Tên ứng dụng</span>
              <span className="font-bold text-navy-900">TASTY HOUSE – Gọi món bằng mã QR</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Phiên bản</span>
              <span className="font-semibold text-stone-800">1.0.0 (bản chạy thử)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Địa chỉ nhà hàng</span>
              <span className="font-medium text-stone-800">128 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Hotline</span>
              <span className="font-bold text-navy-900">028 3822 8899</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Vai trò sử dụng</span>
              <span className="font-medium text-stone-700">Khách hàng · Thu ngân · Nhân viên bếp · Quản trị viên</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-500">Lưu trữ dữ liệu</span>
              <span className="font-semibold text-emerald-700">Trên máy tính này (Đã kết nối cơ sở dữ liệu MySQL)</span>
            </div>
          </div>

          {/* 5-cell KPI summary bar (Ảnh 8) */}
          <div className="grid grid-cols-5 border border-stone-200 rounded-xl overflow-hidden divide-x divide-stone-200 text-center py-2 bg-stone-50/50">
            <div>
              <div className="font-extrabold text-sm text-navy-900">{counts.menuItems}</div>
              <div className="text-[10px] text-stone-500 font-medium">Món ăn</div>
            </div>
            <div>
              <div className="font-extrabold text-sm text-navy-900">{counts.tables}</div>
              <div className="text-[10px] text-stone-500 font-medium">Bàn</div>
            </div>
            <div>
              <div className="font-extrabold text-sm text-navy-900">{counts.users}</div>
              <div className="text-[10px] text-stone-500 font-medium">Nhân viên</div>
            </div>
            <div>
              <div className="font-extrabold text-sm text-navy-900">{counts.orders}</div>
              <div className="text-[10px] text-stone-500 font-medium">Đơn hàng</div>
            </div>
            <div>
              <div className="font-extrabold text-sm text-navy-900">{counts.invoices}</div>
              <div className="text-[10px] text-stone-500 font-medium">Hóa đơn</div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Cài đặt thông báo & Bảo mật (Ảnh 8) */}
        <div className="space-y-6">
          {/* Box 1: Cài đặt thông báo */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-navy-900 font-display flex items-center gap-1.5">
                <Bell size={15} className="text-stone-500" />
                <span>Cài đặt thông báo</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Chọn loại thông báo được gửi tự động.
              </p>
            </div>

            <div className="space-y-4 text-xs divide-y divide-stone-100">
              {/* GỬI CHO BẾP */}
              <div className="pt-2">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Gửi cho bếp
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Có đơn mới</div>
                    <div className="text-[11px] text-stone-500">Báo bếp ngay khi khách gửi đơn từ mã QR.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('kitchenNewOrder')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.kitchenNewOrder ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.kitchenNewOrder ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* GỬI CHO THU NGÂN */}
              <div className="pt-3 space-y-3">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Gửi cho thu ngân
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Bàn vừa đặt món</div>
                    <div className="text-[11px] text-stone-500">Khi một bàn gửi đơn xuống bếp.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('cashierOrderPlaced')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.cashierOrderPlaced ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.cashierOrderPlaced ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Khách gọi nhân viên</div>
                    <div className="text-[11px] text-stone-500">Khi khách bấm gọi nhân viên hỗ trợ.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('cashierCallWaiter')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.cashierCallWaiter ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.cashierCallWaiter ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Bàn đã đủ món</div>
                    <div className="text-[11px] text-stone-500">Khi bếp hoàn thành toàn bộ đơn.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('cashierOrderReady')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.cashierOrderReady ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.cashierOrderReady ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Món hết / có hàng trở lại</div>
                    <div className="text-[11px] text-stone-500">Khi bếp đổi tình trạng còn hàng của món.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('cashierItemStock')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.cashierItemStock ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.cashierItemStock ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* GỬI CHO KHÁCH HÀNG */}
              <div className="pt-3">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Gửi cho khách hàng
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Cập nhật món & yêu cầu</div>
                    <div className="text-[11px] text-stone-500">Món đã sẵn sàng, yêu cầu hỗ trợ đã được tiếp nhận.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('customerStatusUpdate')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.customerStatusUpdate ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.customerStatusUpdate ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* CÁCH HIỂN THỊ */}
              <div className="pt-3 space-y-3">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Cách hiển thị
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Hiện thông báo nổi</div>
                    <div className="text-[11px] text-stone-500">Hộp thông báo nhỏ ở góc màn hình nhân viên.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('showFloatingToast')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.showFloatingToast ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.showFloatingToast ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-navy-900">Phát âm thanh</div>
                    <div className="text-[11px] text-stone-500">Tiếng chuông ngắn khi có thông báo mới.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('playNotificationSound')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                      notificationSettings.playNotificationSound ? 'bg-navy-900' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                        notificationSettings.playNotificationSound ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Bảo mật đăng nhập */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-navy-900 font-display flex items-center gap-1.5">
                <Shield size={15} className="text-stone-500" />
                <span>Bảo mật đăng nhập</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Áp dụng cho trang đăng nhập của mọi nhân viên.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div>
                <div className="font-bold text-navy-900">Yêu cầu mã xác thực (captcha)</div>
                <div className="text-[11px] text-stone-500">Nhân viên phải nhập mã trong hình trước khi đăng nhập.</div>
              </div>
              <button
                type="button"
                onClick={() => toggleSecurity('requireCaptcha')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition shrink-0 ml-3 ${
                  securitySettings.requireCaptcha ? 'bg-navy-900' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    securitySettings.requireCaptcha ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
