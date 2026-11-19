import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoiceTemplate = ({ invoice, onClose }) => {
  const invoiceRef = useRef(null);

  if (!invoice) return null;

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
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
      pdf.save(`Hoa-don-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
    }
  };

  const formattedDate = new Date(invoice.createdAt).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={20} />
        </button>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-6 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 space-y-4 overflow-y-auto">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-extrabold tracking-wide uppercase">Tasty House Restaurant</h2>
            <p className="text-[11px] text-slate-500">Đ/c: 123 Đường Ẩm Thực, Quận 1, TP.HCM</p>
            <p className="text-[11px] text-slate-500">Hotline: 0988 888 888</p>
            <h3 className="font-bold text-sm mt-2 text-slate-900 uppercase">HÓA ĐƠN THANH TOÁN</h3>
            <p className="text-[10px] text-slate-400">{invoice.invoiceNumber}</p>
          </div>

          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Bàn phục vụ:</span>
              <strong className="text-slate-900">{invoice.order?.table?.tableNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{invoice.cashier?.fullName || 'Thu ngân'}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-semibold">
                <th className="pb-1">Món</th>
                <th className="pb-1 text-center">SL</th>
                <th className="pb-1 text-right">Đ.Giá</th>
                <th className="pb-1 text-right">T.Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.order?.items?.map((it) => (
                <tr key={it.id}>
                  <td className="py-1.5">{it.menuItem?.name}</td>
                  <td className="py-1.5 text-center">{it.quantity}</td>
                  <td className="py-1.5 text-right">{it.price.toLocaleString('vi-VN')}</td>
                  <td className="py-1.5 text-right font-medium">
                    {(it.price * it.quantity).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Tổng tiền món:</span>
              <span>{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Giảm giá:</span>
                <span>-{invoice.discount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>KHÁCH PHẢI TRẢ:</span>
              <span>{invoice.finalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Phương thức thanh toán:</span>
              <span className="font-semibold text-slate-800">{invoice.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
            <p>Cảm ơn quý khách đã ủng hộ Tasty House!</p>
            <p>Hẹn gặp lại quý khách!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            <span>In hóa đơn</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
          >
            <Download size={16} />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
