import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';

const QrCodeModal = ({ isOpen, onClose, table }) => {
  const svgRef = useRef(null);

  if (!isOpen || !table) return null;

  // Specified in doc: /order?tableId=5
  const orderUrl = `${window.location.origin}/order?tableId=${table.id}`;

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

        <div className="mb-4">
          <span className="text-3xl">🍽️</span>
          <h3 className="font-bold text-xl text-slate-800 mt-1">Tasty House</h3>
          <p className="text-sm font-semibold text-orange-600">Mã QR Đặt món - {table.tableNumber}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{orderUrl}</p>
        </div>

        {/* QR Code Container */}
        <div
          ref={svgRef}
          className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl inline-block mx-auto mb-4"
        >
          <QRCodeSVG value={orderUrl} size={180} level="H" includeMargin={true} />
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Quét mã QR bằng điện thoại để xem thực đơn và gọi món trực tiếp tại bàn.
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 py-2 px-3 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <Download size={15} />
            <span>Tải ảnh PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>In mã QR</span>
          </button>
          <a
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
          >
            Mở
          </a>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
