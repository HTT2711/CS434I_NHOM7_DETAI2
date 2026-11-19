import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Smartphone, Monitor } from 'lucide-react';

const QrCodeModal = ({ isOpen, onClose, table }) => {
  const svgRef = useRef(null);
  const [useWifiIp, setUseWifiIp] = useState(false);
  const [customIp, setCustomIp] = useState('192.168.1.14:5173');

  if (!isOpen || !table) return null;

  const currentHost = useWifiIp ? `http://${customIp}` : window.location.origin;
  const orderUrl = `${currentHost}/order?tableId=${table.id}`;

  const handleDownloadPNG = () => {
    try {
      const svg = svgRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 500;
      canvas.height = 500;

      img.onload = () => {
        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw QR
        ctx.drawImage(img, 50, 50, 400, 400);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-TastyHouse-${table.tableNumber.replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Lỗi tải ảnh PNG:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={20} />
        </button>

        <div className="mb-3">
          <span className="text-3xl">🍽️</span>
          <h3 className="font-extrabold text-xl text-slate-800 mt-1">Tasty House</h3>
          <p className="text-sm font-bold text-orange-600">Mã QR Đặt món - {table.tableNumber}</p>
        </div>

        {/* Device Mode Switcher for QR */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold mb-3">
          <button
            type="button"
            onClick={() => setUseWifiIp(false)}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              !useWifiIp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Monitor size={13} />
            <span>Test trên máy tính</span>
          </button>
          <button
            type="button"
            onClick={() => setUseWifiIp(true)}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              useWifiIp ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Smartphone size={13} />
            <span>Quét bằng điện thoại</span>
          </button>
        </div>

        {useWifiIp && (
          <div className="mb-3 text-left">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              IP máy tính trong mạng Wi-Fi:
            </label>
            <input
              type="text"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="192.168.1.14:5173"
              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              * Điện thoại kết nối chung Wi-Fi với máy tính này sẽ quét và mở được ngay.
            </p>
          </div>
        )}

        {/* QR Code Container */}
        <div
          ref={svgRef}
          className="p-3 bg-orange-50 border-2 border-orange-200 rounded-2xl inline-block mx-auto mb-3"
        >
          <QRCodeSVG value={orderUrl} size={170} level="H" includeMargin={true} />
        </div>

        <p className="text-[11px] text-slate-400 font-mono truncate mb-4 px-2">
          {orderUrl}
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 py-2 px-3 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <Download size={14} />
            <span>Tải ảnh PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer size={14} />
            <span>In</span>
          </button>
          <a
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
          >
            Mở thử
          </a>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
