import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FoodClocheIcon } from '../../components/common/BrandLogo';

const InvoiceTemplate = ({ invoice, invoiceData, onClose }) => {
  const currentInvoice = invoice || invoiceData;
  const invoiceRef = useRef(null);

  if (!currentInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const imgWidth = 148;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
      pdf.save(`Hoa-don-${currentInvoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
    }
  };

  const formattedDate = new Date(currentInvoice.paidAt || currentInvoice.createdAt).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-navy-900 p-1 no-print"
        >
          <X size={20} />
        </button>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-6 bg-white border border-stone-200 rounded-xl font-mono text-xs text-navy-900 space-y-4 overflow-y-auto">
          <div className="text-center pb-3 border-b border-dashed border-stone-300">
            <div className="flex justify-center mb-1">
              <FoodClocheIcon className="w-8 h-8" color="#0b1329" />
            </div>
            <h2 className="text-base font-extrabold tracking-wide uppercase font-display text-navy-900">
              TASTY HOUSE
            </h2>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-sans">
              A Taste to Remember · EST 2026
            </p>
            <p className="text-[11px] text-stone-500 font-sans mt-1">120 Nguyễn Văn Linh, Q. Hải Châu, TP. Đà Nẵng</p>
            <p className="text-[11px] text-stone-500 font-sans">Hotline: 0905 123 456</p>
            <h3 className="font-bold text-sm mt-3 text-navy-900 uppercase">HÓA ĐƠN THANH TOÁN</h3>
            <p className="text-[10px] text-stone-400">#{currentInvoice.invoiceNumber}</p>
          </div>

          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-stone-300 font-sans">
            <div className="flex justify-between">
              <span>Bàn phục vụ:</span>
              <strong className="text-navy-900">
                {currentInvoice.order?.table?.tableNumber || `Bàn ${currentInvoice.order?.tableId || ''}`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{currentInvoice.cashier?.fullName || 'Thu ngân'}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px] font-sans">
            <thead>
              <tr className="border-b border-stone-300 text-stone-500 font-semibold">
                <th className="pb-1">Món</th>
                <th className="pb-1 text-center">SL</th>
                <th className="pb-1 text-right">Đ.Giá</th>
                <th className="pb-1 text-right">T.Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {currentInvoice.order?.items?.map((it) => (
                <tr key={it.id}>
                  <td className="py-1.5 font-medium">{it.menuItem?.name}</td>
                  <td className="py-1.5 text-center font-bold">{it.quantity}</td>
                  <td className="py-1.5 text-right">{it.price.toLocaleString('vi-VN')}</td>
                  <td className="py-1.5 text-right font-bold text-navy-900">
                    {(it.price * it.quantity).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div className="pt-2 border-t border-dashed border-stone-300 space-y-1 text-[11px] font-sans">
            <div className="flex justify-between">
              <span>Tạm tính tiền món:</span>
              <span>{currentInvoice.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            {currentInvoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Chiết khấu giảm giá:</span>
                <span>-{currentInvoice.discount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            {(currentInvoice.vatAmount > 0 || currentInvoice.vatRate > 0) && (
              <div className="flex justify-between text-stone-600">
                <span>Thuế VAT ({currentInvoice.vatRate || 8}%):</span>
                <span>+{Number(currentInvoice.vatAmount || 0).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-navy-900 pt-1.5 border-t border-stone-200">
              <span>KHÁCH PHẢI TRẢ:</span>
              <span>{currentInvoice.finalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 pt-1">
              <span>Phương thức:</span>
              <span className="font-bold text-navy-900">
                {currentInvoice.paymentMethod === 'CASH'
                  ? 'Tiền mặt'
                  : currentInvoice.paymentMethod === 'BANK_TRANSFER'
                  ? 'Chuyển khoản'
                  : 'VietQR'}
              </span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-400 font-sans">
            <p className="font-medium">Cảm ơn quý khách đã dùng bữa tại Tasty House!</p>
            <p>Hẹn gặp lại quý khách lần sau!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Printer size={15} />
            <span>In hóa đơn</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 border border-stone-300 hover:bg-stone-50 text-navy-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download size={15} />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
