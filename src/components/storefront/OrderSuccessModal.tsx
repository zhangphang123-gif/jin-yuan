import React, { useState } from 'react';
import { StoreOrder, StoreSettings } from '../../types/store';
import { formatWhatsAppOrderMessage, generateWhatsAppLink } from '../../utils/whatsapp';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle2,
  MessageCircle,
  Copy,
  Download,
  Check,
  ExternalLink,
  Share2,
  Image as ImageIcon,
  Gift
} from 'lucide-react';

interface OrderSuccessModalProps {
  order: StoreOrder | null;
  onClose: () => void;
  settings: StoreSettings;
  onPrintInvoice: (order: StoreOrder) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  settings,
  onPrintInvoice,
}) => {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const whatsappUrl = generateWhatsAppLink(order, settings, lang);
  const formattedText = formatWhatsAppOrderMessage(order, settings, lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        if (order.paymentProofUrl) {
          try {
            const resp = await fetch(order.paymentProofUrl);
            const blob = await resp.blob();
            const file = new File([blob], `JinYuan_Receipt_${order.id}.jpg`, {
              type: blob.type || 'image/jpeg',
            });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `錦源訂單 #${order.id}`,
                text: formattedText,
                files: [file],
              });
              return;
            }
          } catch {
            // fallback to sharing text + url
          }
        }
        await navigator.share({
          title: `錦源訂單 #${order.id}`,
          text: formattedText,
        });
      }
    } catch {
      // user cancelled or share unsupported
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-center space-y-5 max-h-[94vh] overflow-y-auto">
        
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-mono font-semibold tracking-wider text-amber-800 dark:text-amber-500 uppercase">
            Order Submitted & Saved to Cloud
          </span>
          <h2 className="font-serif-brand text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {t('下單成功！訂單與截圖已保存', 'Order Placed & Saved to Cloud!')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t('訂單編號：', 'Order ID: ')}
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">#{order.id}</span>
          </p>
        </div>

        {/* Uploaded Receipt Proof Preview + WhatsApp Instruction */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-left space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('下一步：一鍵發送訂單與付款截圖至店主 WhatsApp', 'Next: One-Click Send Order & Receipt to WhatsApp')}</span>
          </div>
          <p className="text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed text-[11px]">
            {t(
              '我們已將您的商品明細、金額與付款截圖雲端連結排版完成！點擊下方綠色按鈕即可打開 WhatsApp 直接送出給商家核對出貨。',
              'Your order details and receipt screenshot link are ready! Tap the green button below to send everything to our WhatsApp in one click.'
            )}
          </p>

          {order.paymentProofUrl && (
            <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-stone-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <img
                src={order.paymentProofUrl}
                alt="Payment Proof"
                className="w-12 h-12 rounded-md object-cover border border-stone-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('付款截圖已夾帶至訂單', 'Receipt Attached')}</span>
                </div>
                <p className="text-[10px] text-stone-500 truncate">
                  {order.paymentProofUrl.startsWith('http')
                    ? order.paymentProofUrl
                    : t('已在訂單記錄中儲存', 'Saved with order')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Order Brief Summary */}
        <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200/80 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 text-left space-y-1">
          <div className="flex justify-between">
            <span>{t('收件人：', 'Recipient: ')}</span>
            <span className="text-stone-900 dark:text-stone-100 font-medium">{order.customer.name} ({order.customer.phone})</span>
          </div>
          <div className="flex justify-between">
            <span>{t('訂購品項：', 'Items: ')}</span>
            <span>{order.items.length} {t('款', 'types')} ({order.items.reduce((a, b) => a + b.quantity, 0)} {t('件', 'qty')})</span>
          </div>
          {order.appliedPromoCode && (
            <div className="flex justify-between text-red-700 dark:text-red-400 font-semibold">
              <span>{t('優惠碼：', 'Promo Code: ')}</span>
              <span className="font-mono">{order.appliedPromoCode} {order.discount > 0 ? `(-RM ${order.discount})` : ''}</span>
            </div>
          )}
          {order.freeGiftName && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
              <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> {t('隨單贈品：', 'Free Gift: ')}</span>
              <span className="truncate max-w-[60%] text-right">{order.freeGiftName}</span>
            </div>
          )}
          {order.referralCode && (
            <div className="flex justify-between text-amber-800 dark:text-amber-300 font-semibold">
              <span>{t('推薦人 / 代理：', 'Referrer: ')}</span>
              <span className="font-mono">
                {order.referralName && order.referralName !== '自然流量 / 直客'
                  ? `${order.referralName} (${order.referralCode})`
                  : order.referralCode}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t('總付款額：', 'Total Paid: ')}</span>
            <span className="font-mono font-bold text-amber-800 dark:text-amber-400">RM {order.total}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          
          {/* Primary WhatsApp Action */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('一鍵發送訂單與付款截圖至 WhatsApp', 'Send Order & Receipt to WhatsApp')}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Share Receipt Image Directly (useful on phones) + Copy + PDF */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('已複製！', 'Copied!') : t('複製訂單文本', 'Copy Order Text')}</span>
            </button>

            <button
              onClick={() => onPrintInvoice(order)}
              className="py-2.5 px-3 text-xs font-bold text-red-900 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-amber-300 dark:border-stone-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('下載 PDF 單據', 'Download PDF')}</span>
            </button>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleShareNative}
              className="w-full py-2.5 px-3 text-xs font-bold text-stone-700 dark:text-stone-200 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('手機分享截圖檔案與訂單給商家 App', 'Share Screenshot Image File via App')}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            {t('返回商城繼續選購', 'Back to Storefront')}
          </button>
        </div>

      </div>
    </div>
  );
};
