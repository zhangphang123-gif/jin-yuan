import React, { useState } from 'react';
import { CartItem, OrderCustomerInfo, StoreOrder, StoreSettings } from '../../types/store';
import { OFFICIAL_QR_URL } from '../../utils/productImages';
import { resolveReferralForOrder } from '../../utils/referralTracker';
import { formatDisplayPhone, formatTelHref } from '../../utils/whatsapp';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Truck,
  CreditCard,
  MessageCircle,
  ArrowRight,
  QrCode,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Gift,
  ZoomIn
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  discountAmount: number;
  promoCode: string;
  freeShippingGranted?: boolean;
  freeGiftName?: string;
  settings: StoreSettings;
  onOrderCreated: (order: StoreOrder) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  discountAmount,
  promoCode,
  freeShippingGranted = false,
  freeGiftName = '',
  settings,
  onOrderCreated,
}) => {
  const { lang, t } = useLanguage();

  const [formData, setFormData] = useState<OrderCustomerInfo>({
    name: '',
    phone: '',
    email: '',
    deliveryMethod: 'express_delivery',
    address: '',
    postalCode: '',
    paymentMethod: 'duitnow',
    notes: '',
  });

  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.selectedPrice || item.product.price) * item.quantity,
    0
  );
  const isFreeShipping = subtotal >= settings.freeShippingThreshold || freeShippingGranted;
  const shippingFee =
    isFreeShipping || formData.deliveryMethod === 'store_pickup' ? 0 : settings.defaultShippingFee;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const qrImageSrc = settings.paymentQrCodeUrl || OFFICIAL_QR_URL;

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const isImageFile =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isImageFile) {
      setProofError(t('請選擇 JPG、PNG 或截圖圖片檔案', 'Please upload an image file (JPG/PNG)'));
      return;
    }

    setProofError(null);
    setIsUploadingProof(true);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'receipts', {
        cloudName: settings.cloudinaryCloudName,
        uploadPreset: settings.cloudinaryUploadPreset,
      });
      setPaymentProofUrl(secureUrl);
    } catch (err) {
      console.warn('Receipt upload error:', err);
      setProofError(
        err instanceof Error
          ? err.message
          : t('上傳付款截圖至雲端圖床失敗，請稍後重試。', 'Upload failed, please try another screenshot.')
      );
    } finally {
      setIsUploadingProof(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofUrl) {
      setProofError(
        t(
          '請先掃描上方 QR Code / 轉賬並上傳付款截圖！',
          'Please scan the QR Code or transfer and upload your payment screenshot before submitting!'
        )
      );
      return;
    }

    setProofError(null);
    setIsSubmitting(true);

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `JY-${dateStr}-${randNum}`;
    const { referralCode, referralName } = resolveReferralForOrder(settings);

    const newOrder: StoreOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      customer: {
        ...formData,
        address:
          formData.deliveryMethod === 'store_pickup'
            ? settings.storeAddress
            : formData.address,
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        productName: lang === 'en' ? `${item.product.nameZh} (${item.product.nameEn})` : item.product.nameZh,
        sku: item.product.sku,
        price: item.selectedPrice || item.product.price,
        quantity: item.quantity,
        unitWeight: item.weightVariant || item.product.unitWeight,
        image: item.product.image,
      })),
      subtotal,
      shippingFee,
      discount: discountAmount,
      total,
      appliedPromoCode: promoCode || undefined,
      freeShippingGranted: freeShippingGranted || undefined,
      freeGiftName: freeGiftName || undefined,
      paymentProofUrl,
      paymentStatus: 'paid',
      whatsappSent: false,
      referralCode,
      referralName,
    };

    try {
      await Promise.resolve(onOrderCreated(newOrder));
      setPaymentProofUrl('');
    } catch (err) {
      console.warn('Order submission error:', err);
      setProofError(
        t(
          '送出訂單失敗（請確認網路連線或重新壓縮截圖後再試）。',
          'Failed to submit order. Please check your connection and try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center pt-12 sm:p-6 no-print"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[86dvh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Mobile Sheet Grab Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-stone-50 dark:bg-stone-950 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>

        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between gap-3 shrink-0 relative z-20">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="font-serif-brand text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
              {t('確認訂單、掃碼付款與送出', 'Checkout & QR Payment')}
            </h2>
            <span className="text-xs text-stone-500 font-mono shrink-0">
              ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} {t('件', 'items')})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('關閉結帳視窗', 'Close checkout')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-stone-200/90 dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          
          {/* Step 1: Customer Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <span>{t('1. 顧客基本資料 (Customer Contact)', '1. Customer Contact')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-500 mb-1">{t('收件人姓名 *', 'Recipient Name *')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('例：林偉強 (Lim Wai Keong)', 'e.g. Lim Wai Keong')}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-stone-500 mb-1">
                  {t('WhatsApp / 手機號碼 *', 'WhatsApp / Mobile *')}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="012-345 6789"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-500 mb-1">{t('電子郵件 (選填)', 'Email (Optional)')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="lim@example.com"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Method */}
          <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-red-700" />
              <span>{t('2. 配送方式 (Delivery Method)', '2. Delivery Method')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.deliveryMethod === 'express_delivery'
                    ? 'border-red-800 dark:border-red-400 bg-red-50/50 dark:bg-red-950/30 font-semibold'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="express_delivery"
                  checked={formData.deliveryMethod === 'express_delivery'}
                  onChange={() => setFormData({ ...formData, deliveryMethod: 'express_delivery' })}
                  className="sr-only"
                />
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  {t('全馬快遞宅配 (Express Delivery)', 'Express Delivery (Malaysia)')}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {t('PosLaju / J&T 專屬紙箱真空發貨', 'Vacuum-packed courier nationwide')}
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.deliveryMethod === 'store_pickup'
                    ? 'border-red-800 dark:border-red-400 bg-red-50/50 dark:bg-red-950/30 font-semibold'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="store_pickup"
                  checked={formData.deliveryMethod === 'store_pickup'}
                  onChange={() => setFormData({ ...formData, deliveryMethod: 'store_pickup' })}
                  className="sr-only"
                />
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  {t('門市自取 (Store Pickup)', 'Store Pickup (Penang)')}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {t('錦源柴楞公園門市自取免運費', 'Free pickup at Chai Leng Park store')}
                </div>
              </label>
            </div>

            <div className="text-xs space-y-2 pt-1">
              {formData.deliveryMethod === 'express_delivery' ? (
                <>
                  <div>
                    <label className="block text-stone-500 mb-1">
                      {t('詳細送貨地址 (門牌 / 路名 / 州屬) *', 'Delivery Address *')}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="No. 18, Jalan Austin Heights 8/3, Taman Mount Austin, 81100 Johor Bahru, Johor"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">{t('郵政編號 (Postal Code) *', 'Postal Code *')}</label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="81100"
                      className="w-36 px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </>
              ) : (
                <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-md text-stone-600 dark:text-stone-300 text-xs leading-relaxed">
                  <strong>{t('自取地點：', 'Pickup Location: ')}</strong>
                  <span>{settings.storeAddress} </span>
                  <a
                    href={formatTelHref(settings.whatsappNumber)}
                    className="inline-flex items-center font-mono font-bold text-red-700 dark:text-amber-300 underline underline-offset-2 whitespace-nowrap py-0.5"
                  >
                    ({formatDisplayPhone(settings.whatsappNumber)})
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Payment Method (NO COD - QR Code + Upload Screenshot) */}
          <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-red-700" />
              <span>{t('3. 線上付款與上傳截圖 (QR Pay & Receipt Upload)', '3. Online Payment & Receipt Upload')}</span>
            </h3>

            {/* 3 Options only (COD removed) */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                  formData.paymentMethod === 'duitnow'
                    ? 'border-red-800 dark:border-red-400 bg-red-50/50 dark:bg-red-950/30 font-bold text-red-900 dark:text-red-200'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="duitnow"
                  checked={formData.paymentMethod === 'duitnow'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'duitnow' })}
                  className="sr-only"
                />
                <div>DuitNow QR</div>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                  formData.paymentMethod === 'tng'
                    ? 'border-red-800 dark:border-red-400 bg-red-50/50 dark:bg-red-950/30 font-bold text-red-900 dark:text-red-200'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="tng"
                  checked={formData.paymentMethod === 'tng'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'tng' })}
                  className="sr-only"
                />
                <div>TNG eWallet</div>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                  formData.paymentMethod === 'bank_transfer'
                    ? 'border-red-800 dark:border-red-400 bg-red-50/50 dark:bg-red-950/30 font-bold text-red-900 dark:text-red-200'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={formData.paymentMethod === 'bank_transfer'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                  className="sr-only"
                />
                <div>{t('Public Bank 轉賬', 'Public Bank Transfer')}</div>
              </label>
            </div>

            {/* DuitNow QR Code Picture Box + Account Info */}
            <div className="p-4 bg-gradient-to-br from-pink-50/70 via-white to-amber-50/70 dark:from-stone-950 dark:to-stone-900 rounded-xl border border-pink-200 dark:border-stone-700 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setQrZoomOpen(true)}
                  className="relative group bg-white p-2 rounded-xl border-2 border-pink-300 shadow-sm cursor-pointer overflow-hidden"
                  title={t('點擊放大 QR Code', 'Tap to zoom QR')}
                >
                  <img
                    src={qrImageSrc}
                    alt="Jin Yuan DuitNow Payment QR Code"
                    className="w-40 h-44 sm:w-44 sm:h-48 object-contain rounded-lg"
                  />
                  <span className="absolute bottom-2 right-2 bg-stone-900/80 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" />
                    <span>{t('放大', 'Zoom')}</span>
                  </span>
                </button>
              </div>

              <div className="sm:col-span-7 space-y-2 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-600 text-white rounded-full font-bold text-[11px]">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{t('支援所有馬來西亞銀行與 TNG 掃碼付款', 'Scan with any MY Bank / TNG App')}</span>
                </div>

                <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {t('應付總額：', 'Total Payable: ')}
                  <span className="font-mono text-red-700 dark:text-red-400 text-base font-black">RM {total}</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 space-y-1 text-[11px] text-stone-700 dark:text-stone-300">
                  {formData.paymentMethod === 'duitnow' && (
                    <div><strong>DuitNow ID:</strong> {settings.duitnowId}</div>
                  )}
                  {formData.paymentMethod === 'tng' && (
                    <div><strong>Touch 'n Go:</strong> {settings.tngEwalletPhone}</div>
                  )}
                  {formData.paymentMethod === 'bank_transfer' && (
                    <div><strong>{settings.bankAccount}</strong></div>
                  )}
                  <p className="text-stone-500">
                    {t(
                      '請掃描左側二維碼或轉賬至上述帳號，完成後在下方上傳付款截圖即可送出訂單。',
                      'Scan the QR code or transfer to the account above, then upload your payment screenshot below.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Payment Receipt Screenshot Upload */}
            <div className="p-4 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/70 bg-red-50/40 dark:bg-red-950/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-red-700" />
                  <span>{t('上傳付款轉賬截圖 (必傳) *', 'Upload Payment Receipt Screenshot (Required) *')}</span>
                </label>
                {paymentProofUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('截圖已就緒', 'Screenshot Ready')}</span>
                  </span>
                )}
              </div>

              {paymentProofUrl ? (
                <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <img
                    src={paymentProofUrl}
                    alt="Receipt Proof Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      {t('已成功上傳付款截圖至雲端！', 'Payment screenshot uploaded to cloud!')}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {t('確認下單後將附帶在 WhatsApp 訂單訊息傳給老闆娘', 'Link will be included in your one-click WhatsApp message.')}
                    </p>
                  </div>
                  <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 rounded-lg text-[11px] font-bold cursor-pointer shrink-0">
                    {t('更換圖片', 'Replace')}
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-5 px-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-red-600 cursor-pointer transition text-center space-y-1.5">
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-6 h-6 text-red-700 animate-spin" />
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {t('正在上傳付款截圖至雲端...', 'Uploading receipt screenshot...')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-red-700" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {t('點擊從手機相冊 / 電腦選取轉賬付款截圖', 'Tap to upload payment receipt screenshot')}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {t('支援 JPG / PNG 截圖 · 自動生成連結隨單發送至商家 WhatsApp', 'JPG / PNG supported · Sent directly with your WhatsApp order')}
                      </span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              )}

              {proofError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{proofError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">
                {t('訂單備註 (選填，如送禮代寫卡片、指定出爐日期等)', 'Order Notes (Optional)')}
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('例如：請盡量在上午派送 / 附送新年送禮手提袋', 'e.g. Morning delivery / Include festive carrier bag')}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Step 4: Summary & Submit */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            {freeGiftName && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-300 text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-red-700 shrink-0" />
                <span>{t('隨單贈品：', 'Free Gift: ')}{freeGiftName}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>{t(`商品合計 (${cartItems.reduce((acc, i) => acc + i.quantity, 0)} 件):`, 'Items Subtotal:')}</span>
                <span className="font-mono text-stone-900 dark:text-stone-100">RM {subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-700 dark:text-red-400">
                  <span>{t('折扣減免', 'Discount')} {promoCode ? `(${promoCode})` : ''}:</span>
                  <span className="font-mono">-RM {discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('快遞運費:', 'Delivery Fee:')}</span>
                <span className="font-mono text-stone-900 dark:text-stone-100">
                  {shippingFee === 0 ? t('全馬免運 (Free)', 'Free') : `RM ${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-stone-900 dark:text-stone-100 pt-1.5 border-t border-stone-200 dark:border-stone-800">
                <span>{t('實付總額:', 'Total Paid:')}</span>
                <span className="font-mono text-base text-red-800 dark:text-red-400">
                  RM {total}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingProof}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-60 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>
                {isSubmitting
                  ? t('正在建立訂單...', 'Submitting order...')
                  : t('確認下單，一鍵傳送訂單與截圖至 WhatsApp', 'Submit Order & Send via WhatsApp')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition cursor-pointer touch-manipulation"
            >
              {t('返回繼續選購 / 關閉視窗', 'Back to Store / Close')}
            </button>
          </div>

        </form>

      </div>

      {/* Lightbox Zoom for QR Code */}
      {qrZoomOpen && (
        <div
          onClick={() => setQrZoomOpen(false)}
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-4"
        >
          <div className="bg-white p-4 rounded-2xl max-w-sm w-full space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <img src={qrImageSrc} alt="Payment QR Zoom" className="w-full h-auto rounded-xl" />
            <p className="text-xs font-bold text-stone-800">
              JIN YUAN TRADITIONAL ENTERPRISE · DuitNow QR (RM {total})
            </p>
            <button
              type="button"
              onClick={() => setQrZoomOpen(false)}
              className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {t('關閉放大圖', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
