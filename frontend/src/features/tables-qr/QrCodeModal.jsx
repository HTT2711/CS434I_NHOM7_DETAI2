import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Smartphone, Monitor, Wifi, ExternalLink, Globe, Sparkles, RefreshCw } from 'lucide-react';
import { FoodClocheIcon } from '../../components/common/BrandLogo';
import axiosClient from '../../services/axiosClient';

const QrCodeModal = ({ isOpen, onClose, table }) => {
  const cardRef = useRef(null);

  const defaultLocalHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Mode: 'LOCAL' (localhost) | 'WIFI' (LAN IP)
  const [mode, setMode] = useState('WIFI');
  const [detectedIp, setDetectedIp] = useState('192.168.1.4:5173');
  const [customIp, setCustomIp] = useState('192.168.1.4:5173');
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [loadingIp, setLoadingIp] = useState(false);

  // Tự động phát hiện IP Wi-Fi mạng hiện tại từ backend
  const fetchNetworkInfo = async () => {
    try {
      setLoadingIp(true);
      const res = await axiosClient.get('/network-info');
      const full = res.data?.fullAddress || (res.data?.ip ? `${res.data.ip}:5173` : null);
      if (full) {
        setDetectedIp(full);
        setCustomIp(full);
      }
    } catch (err) {
      console.warn('Không thể tự động phát hiện IP máy tính:', err);
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  // Khi chuyển sang tab Wi-Fi, tự động quét lại IP mới nhất
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'WIFI') {
      fetchNetworkInfo();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !table) return null;

  // Tính toán Base URL theo chế độ quét
  let currentHost = defaultLocalHost;
  if (mode === 'WIFI') {
    const ipToUse = (customIp || detectedIp || '192.168.1.14:5173').trim();
    currentHost = ipToUse.startsWith('http') ? ipToUse : `http://${ipToUse}`;
  }

  const orderUrl = `${currentHost.replace(/\/$/, '')}/order?token=${table.token || table.id}`;

  const handleOpenCustomerMenu = () => {
    window.open(orderUrl, '_blank');
  };

  const handleDownloadPNG = () => {
    try {
      const svg = cardRef.current?.querySelector('svg.qr-svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 600;
      canvas.height = 800;

      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#0b1329';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        ctx.strokeStyle = '#dfc9a5';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        ctx.fillStyle = '#0b1329';
        ctx.font = 'bold 30px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TASTY HOUSE', canvas.width / 2, 90);

        ctx.fillStyle = '#64748b';
        ctx.font = '600 13px "Be Vietnam Pro", sans-serif';
        ctx.fillText('A TASTE TO REMEMBER · EST 2026', canvas.width / 2, 115);

        ctx.fillStyle = '#0b1329';
        ctx.font = 'bold 44px "Be Vietnam Pro", sans-serif';
        ctx.fillText(table.tableNumber.toUpperCase(), canvas.width / 2, 185);

        ctx.fillStyle = '#64748b';
        ctx.font = '600 16px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`${table.area || 'Khu A'} · Sức chứa ${table.capacity} chỗ`, canvas.width / 2, 220);

        ctx.drawImage(img, 130, 260, 340, 340);

        ctx.fillStyle = '#0b1329';
        ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
        ctx.fillText('QUÉT MÃ ĐỂ GỌI MÓN TẠI BÀN', canvas.width / 2, 650);

        ctx.fillStyle = '#64748b';
        ctx.font = '14px "Be Vietnam Pro", sans-serif';
        ctx.fillText('Wi-Fi: TASTY_HOUSE_GUEST · Pass: 88888888', canvas.width / 2, 690);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `TentCard-TastyHouse-${table.tableNumber.replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Lỗi tải thẻ bàn:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header with Title and Close Button */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <h3 className="font-extrabold text-navy-900 text-sm font-display">
              Thẻ bàn & Mã QR: {table.tableNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-white hover:bg-rose-600 bg-stone-200/80 rounded-full transition cursor-pointer"
            title="Đóng cửa sổ (Esc)"
          >
            <X size={15} />
            <span>Đóng</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action: Mở trực tiếp thực đơn */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gold-300">Dành cho Quản trị viên / Test máy tính:</div>
              <div className="text-[11px] text-stone-300">Xem ngay trang gọi món của {table.tableNumber}</div>
            </div>
            <button
              onClick={handleOpenCustomerMenu}
              className="px-3.5 py-1.5 bg-gold-400 hover:bg-gold-300 text-navy-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              style={{ backgroundColor: '#dfc9a5' }}
            >
              <ExternalLink size={14} />
              <span>Mở thực đơn</span>
            </button>
          </div>

          {/* 2 Chế độ: Máy tính & Quét điện thoại (Wi-Fi) */}
          <div className="no-print space-y-2">
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchMode('LOCAL')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-center ${
                  mode === 'LOCAL' ? 'bg-navy-900 text-white shadow-sm font-bold' : 'text-stone-600 hover:text-navy-900'
                }`}
              >
                <Monitor size={14} />
                <span>Máy tính (Localhost)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('WIFI')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-center ${
                  mode === 'WIFI' ? 'bg-navy-900 text-white shadow-sm font-bold' : 'text-stone-600 hover:text-navy-900'
                }`}
              >
                <Smartphone size={14} />
                <span>Quét điện thoại (Wi-Fi)</span>
              </button>
            </div>

            {/* Chi tiết cho Chế độ Cùng Wi-Fi */}
            {mode === 'WIFI' && (
              <div className="text-left bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wifi size={14} className="text-blue-600 shrink-0" />
                    <span className="text-blue-950 font-medium truncate">
                      IP Wi-Fi hiện tại: <b className="font-mono text-blue-700">{customIp || detectedIp}</b>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingIp(!isEditingIp)}
                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      {isEditingIp ? 'Đóng' : 'Sửa IP'}
                    </button>
                    <button
                      type="button"
                      onClick={fetchNetworkInfo}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1 transition cursor-pointer"
                      title="Quét lại IP mới nhất của máy tính"
                    >
                      <RefreshCw size={11} className={loadingIp ? 'animate-spin' : ''} />
                      <span>Quét lại IP</span>
                    </button>
                  </div>
                </div>

                {isEditingIp && (
                  <div className="pt-2 border-t border-blue-200/60 flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 font-semibold shrink-0">Nhập IP máy:</span>
                    <input
                      type="text"
                      value={customIp}
                      onChange={(e) => setCustomIp(e.target.value)}
                      placeholder="192.168.1.4:5173"
                      className="flex-1 px-2.5 py-1 text-xs border border-blue-300 rounded-lg font-mono bg-white text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- TENT CARD PREVIEW (Hệ màu Xanh đen Navy & Vàng Gold) --- */}
          <div
            ref={cardRef}
            className="p-5 rounded-2xl border-2 border-navy-900 relative overflow-hidden bg-white shadow-inner text-center"
          >
            {/* Inner decorative gold border */}
            <div className="absolute inset-1.5 border border-gold/60 rounded-xl pointer-events-none" />

            {/* Logo & Tagline */}
            <div className="mb-2 flex flex-col items-center">
              <FoodClocheIcon className="w-8 h-8 mb-1" color="#dfc9a5" />
              <div className="text-navy-900 font-display font-extrabold text-base tracking-wider">
                TASTY HOUSE
              </div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-stone-400">
                A Taste to Remember · EST 2026
              </div>
            </div>

            {/* Table Badge */}
            <div className="my-2">
              <h2 className="text-2xl font-extrabold text-navy-900 font-display">
                {table.tableNumber}
              </h2>
              <div className="inline-block mt-0.5 px-3 py-0.5 bg-stone-100 text-navy-900 font-bold text-[11px] rounded-full">
                {table.area || 'Khu vực Tầng 1'} · {table.capacity} chỗ ngồi
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-sm inline-block border border-stone-200 mx-auto my-2">
              <QRCodeSVG
                className="qr-svg"
                value={orderUrl}
                size={160}
                level="H"
                includeMargin={false}
                fgColor="#0b1329"
              />
            </div>

            {/* Slogan & Instructions */}
            <div className="mt-2 text-navy-900">
              <p className="font-bold text-xs tracking-wide">
                QUÉT MÃ ĐỂ GỌI MÓN TẠI BÀN
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Dùng máy ảnh điện thoại hoặc Zalo để quét gọi món nhanh
              </p>
            </div>

            {/* Wi-Fi Info */}
            <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-center gap-1.5 text-[11px] text-stone-600 font-medium">
              <Wifi className="w-3.5 h-3.5 text-gold-600" />
              <span>Wi-Fi: <b>TASTY_HOUSE_GUEST</b> · Pass: <b>88888888</b></span>
            </div>

            {/* Clickable link */}
            <div className="mt-2 text-[10px] font-mono text-navy-900 bg-stone-100 py-1.5 px-2.5 rounded-xl truncate">
              <a
                href={orderUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-700 hover:text-blue-900 font-semibold"
                title="Bấm để mở trang thực đơn bàn này"
              >
                {orderUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer with Explicit Close */}
        <div className="no-print p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-2 sticky bottom-0 z-20">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Tải ảnh Tent Card</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-stone-300 rounded-xl hover:bg-stone-100 font-bold text-xs text-navy-900 transition cursor-pointer"
          >
            <Printer size={14} />
            <span>In thẻ bàn</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
