import React, { useRef, useState } from 'react';
import { StoreOrder, StoreSettings } from '../../types/store';
import { Printer, X, Download, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface InvoicePrintViewProps {
  order: StoreOrder | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  order,
  settings,
  onClose,
}) => {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!order) return null;

  const orderDate = new Date(order.createdAt).toLocaleString('zh-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const deliveryMethodLabels: Record<string, string> = {
    express_delivery: '全馬快遞宅配 (Express Delivery)',
    store_pickup: '門市自取 (Store Pickup)',
    self_collection: '自提點取貨 (Collection Point)',
  };

  const paymentMethodLabels: Record<string, string> = {
    duitnow: 'DuitNow QR 快速轉賬',
    tng: "Touch 'n Go eWallet",
    bank_transfer: '銀行轉賬 (Public Bank)',
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsDownloadingPdf(true);
    setPdfSuccess(false);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save(`錦源出貨單_${order.id}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback to native print dialog ("Save as PDF")
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:bg-white">
      
      {/* Control Bar (hidden when printing) */}
      <div className="fixed top-4 right-4 z-60 flex flex-wrap items-center gap-2 sm:gap-3 no-print bg-white dark:bg-stone-900 p-2.5 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800">
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>生成 PDF 中...</span>
            </>
          ) : pdfSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>已下載 PDF！</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>下載 PDF 單據</span>
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>立即列印 (Print)</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable & PDF Exportable Invoice / Packing Slip Document */}
      <div
        ref={invoiceRef}
        className="w-full max-w-2xl bg-white text-stone-900 p-8 sm:p-10 shadow-2xl rounded-xl border border-stone-200 print:shadow-none print:border-none print:rounded-none print:p-0 font-sans my-14 sm:my-10 print:my-0"
      >
        
        {/* Top Header */}
        <div className="border-b-2 border-red-900 pb-5 mb-6 flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                crossOrigin="anonymous"
                className="w-14 h-14 rounded-full object-cover border-2 border-red-900 shadow-sm shrink-0"
              />
            )}
            <div>
              <h1 className="font-serif-brand text-2xl font-bold tracking-tight text-red-950">
                {settings.storeName}
              </h1>
              <p className="text-xs text-stone-600 font-mono tracking-wider mt-0.5">
                {settings.storeSubname} · EST. 1985
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                負責人: {settings.contactPerson} · WhatsApp: {settings.whatsappNumber}
              </p>
              <p className="text-[11px] text-stone-500">
                門市: {settings.storeAddress}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-red-900 text-white rounded">
              出貨裝箱單 / 收據 (PACKING SLIP)
            </span>
            <div className="font-mono text-sm font-bold text-stone-950 mt-2">
              #{order.id}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              訂單日期: {orderDate}
            </div>
          </div>
        </div>

        {/* Customer & Shipping Information Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-300 rounded-lg mb-6 text-xs">
          <div>
            <span className="font-mono text-[10px] font-bold text-stone-400 uppercase block mb-1">
              收件人資料 (SHIP TO)
            </span>
            <p className="font-bold text-sm text-stone-900">{order.customer.name}</p>
            <p className="text-stone-700 mt-0.5">電話: {order.customer.phone}</p>
            {order.customer.email && <p className="text-stone-500">{order.customer.email}</p>}
            <p className="text-stone-700 mt-1 font-medium">
              配送方式: {deliveryMethodLabels[order.customer.deliveryMethod] || order.customer.deliveryMethod}
            </p>
            <p className="text-stone-700 mt-0.5">
              收件地址: {order.customer.address} {order.customer.postalCode ? `(${order.customer.postalCode})` : ''}
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] font-bold text-stone-400 uppercase block mb-1">
              付款與物流細節 (PAYMENT & LOGISTICS)
            </span>
            <p className="text-stone-700">
              付款方式: <strong>{paymentMethodLabels[order.customer.paymentMethod] || order.customer.paymentMethod}</strong>
            </p>
            <p className="text-stone-700 mt-0.5">
              付款狀態: <span className="font-semibold text-emerald-800">{order.paymentStatus === 'paid' ? '已付款 / 已核對轉賬' : '待付款'}</span>
            </p>
            {order.trackingNumber && (
              <p className="text-stone-700 mt-0.5">
                快遞運單號: <span className="font-mono font-bold">{order.trackingNumber}</span>
              </p>
            )}
            {order.customer.notes && (
              <div className="mt-2 pt-2 border-t border-stone-200 text-stone-600">
                <span>備註: </span>
                <em>{order.customer.notes}</em>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full border-collapse border border-stone-300 text-xs mb-6">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-300 text-left font-semibold">
              <th className="p-2.5">編號</th>
              <th className="p-2.5">貨號 SKU</th>
              <th className="p-2.5">商品名稱與規格</th>
              <th className="p-2.5 text-center">數量 (QTY)</th>
              <th className="p-2.5 text-right">單價 (RM)</th>
              <th className="p-2.5 text-right">小計 (Subtotal)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b border-stone-200">
                <td className="p-2.5 font-mono text-stone-500">{idx + 1}</td>
                <td className="p-2.5 font-mono font-semibold">{item.sku}</td>
                <td className="p-2.5">
                  <div className="font-bold text-stone-900">{item.productName}</div>
                  <div className="text-[11px] text-stone-500 font-mono">{item.unitWeight}</div>
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-sm">
                  {item.quantity}
                </td>
                <td className="p-2.5 text-right font-mono">RM {item.price}</td>
                <td className="p-2.5 text-right font-mono font-bold">
                  RM {item.price * item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Calculations & Promo/Gift Notes */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 text-xs">
          <div className="space-y-1.5">
            {order.appliedPromoCode && (
              <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-900 font-semibold">
                使用優惠碼 Promo: <span className="font-mono font-bold">{order.appliedPromoCode}</span>
              </div>
            )}
            {order.freeGiftName && (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded text-amber-950 font-bold">
                🎁 隨箱贈送禮品 Free Gift: {order.freeGiftName}
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-1.5 border border-stone-200 p-4 rounded-lg bg-stone-50 ml-auto">
            <div className="flex justify-between text-stone-600">
              <span>商品小計 (Subtotal):</span>
              <span className="font-mono text-stone-900 font-semibold">RM {order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-700">
                <span>折扣扣除 (Discount):</span>
                <span className="font-mono font-semibold">-RM {order.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>快遞運費 (Shipping):</span>
              <span className="font-mono text-stone-900">
                {order.shippingFee === 0 ? '免費 (Free)' : `RM ${order.shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-300">
              <span>應付總額 (Total):</span>
              <span className="font-mono text-base text-red-900">RM {order.total}</span>
            </div>
          </div>
        </div>

        {/* Packing Verification */}
        <div className="border-t-2 border-dashed border-stone-300 pt-6 flex justify-between items-end text-[11px] text-stone-500">
          <div>
            <p className="font-bold text-stone-700">錦源傳統肉乾肉絲專賣店 出貨檢驗合格</p>
            <p className="font-mono text-[10px] mt-0.5">QC & FRESH PACKING VERIFIED</p>
            <p className="mt-1">手工炭烤無防腐劑，開封後請冷藏並於兩週內食用完畢。</p>
          </div>
          <div className="text-right border-t border-stone-400 pt-1 w-44">
            <p>包裝員簽署 / 日期 Packer</p>
          </div>
        </div>

      </div>

    </div>
  );
};
