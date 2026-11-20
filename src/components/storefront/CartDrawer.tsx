import React, { useState } from 'react';
import { CartItem, PromoCode, StoreSettings } from '../../types/store';
import { DEFAULT_PROMO_CODES } from '../../data/initialStoreData';
import { useLanguage } from '../../context/LanguageContext';
import { X, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, Gift, Truck, Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, weightVariant?: string) => void;
  onRemoveItem: (productId: string, weightVariant?: string) => void;
  onProceedToCheckout: (checkoutPromo: {
    discount: number;
    promoCode: string;
    freeShipping: boolean;
    freeGiftName?: string;
  }) => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings,
}) => {
  const { lang, t } = useLanguage();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoObj, setAppliedPromoObj] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availablePromoCodes = (
    settings.promoCodes && settings.promoCodes.length > 0
      ? settings.promoCodes
      : DEFAULT_PROMO_CODES
  ).filter((p) => p.active);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.selectedPrice || item.product.price) * item.quantity,
    0
  );

  // Check if applied promo still meets minSpend
  const promoMeetsMin =
    appliedPromoObj && (!appliedPromoObj.minSpend || subtotal >= appliedPromoObj.minSpend);

  let discountAmount = 0;
  let promoFreeShipping = false;
  let promoGiftText = '';

  if (appliedPromoObj && promoMeetsMin) {
    if (appliedPromoObj.discountType === 'fixed') {
      discountAmount = Math.min(subtotal, Math.round(appliedPromoObj.discountValue));
    } else if (appliedPromoObj.discountType === 'percent') {
      discountAmount = Math.round((subtotal * appliedPromoObj.discountValue) / 100);
    }
    promoFreeShipping = Boolean(appliedPromoObj.freeShipping);
    if (appliedPromoObj.freeGiftName) {
      promoGiftText =
        lang === 'en' && appliedPromoObj.freeGiftNameEn
          ? appliedPromoObj.freeGiftNameEn
          : appliedPromoObj.freeGiftName;
    }
  }

  const freeShippingThreshold = settings.freeShippingThreshold || 300;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const isFreeShipping = remainingForFreeShipping === 0 || promoFreeShipping;
  const shippingFee = subtotal === 0 || isFreeShipping ? 0 : settings.defaultShippingFee;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  // Free floss promo: Spend RM 100 on cookies/pastries
  const cookiesSubtotal = cartItems
    .filter((i) => i.product.category === 'cookies')
    .reduce((acc, i) => acc + (itemPriceHelper(i)) * i.quantity, 0);
  const isCookiesEligible = cookiesSubtotal >= 100;
  const remainingForCookiesPromo = Math.max(0, 100 - cookiesSubtotal);

  function itemPriceHelper(i: CartItem) {
    return i.selectedPrice !== undefined ? i.selectedPrice : i.product.price;
  }

  const combinedFreeGifts = [
    isCookiesEligible ? t('50g 招牌酥脆肉鬆 (年餅滿百贈品)', '50g Crispy Meat Floss (RM100 Cookies Promo)') : '',
    promoGiftText ? `${promoGiftText} (${appliedPromoObj?.code})` : '',
  ]
    .filter(Boolean)
    .join(' + ');

  const applyCodeByString = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    const matched = availablePromoCodes.find((p) => p.code.toUpperCase() === cleanCode);
    if (!matched) {
      setAppliedPromoObj(null);
      setPromoError(t('無效或已停用的優惠碼', 'Invalid or inactive promo code'));
      return;
    }

    if (matched.minSpend && matched.minSpend > 0 && subtotal < matched.minSpend) {
      setAppliedPromoObj(null);
      setPromoError(
        t(
          `此優惠碼需消費滿 RM ${matched.minSpend} 方可使用（還差 RM ${matched.minSpend - subtotal}）`,
          `Minimum spend RM ${matched.minSpend} required (add RM ${matched.minSpend - subtotal} more)`
        )
      );
      return;
    }

    setPromoInput(matched.code);
    setAppliedPromoObj(matched);
    setPromoError(null);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    applyCodeByString(promoInput);
  };

  const handleClearPromo = () => {
    setPromoInput('');
    setAppliedPromoObj(null);
    setPromoError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/50 backdrop-blur-xs no-print">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-800 dark:text-red-400" />
              <h2 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('購物車', 'Shopping Cart')}
              </h2>
              <span className="text-xs text-stone-500 font-mono">
                ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} {t('件', 'items')})
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping & Gift Progress Bar */}
          <div className="px-5 sm:px-6 py-3.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-800/40 text-xs space-y-2">
            {isFreeShipping ? (
              <p className="text-amber-950 dark:text-amber-200 font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {promoFreeShipping && remainingForFreeShipping > 0
                    ? t(`已套用優惠碼免運費 (${appliedPromoObj?.code})！`, `Free shipping unlocked via code (${appliedPromoObj?.code})!`)
                    : t(`恭喜！已達全馬快遞免運費 (滿 RM ${freeShippingThreshold})！`, `Congrats! Unlocked Free Malaysia Delivery (RM ${freeShippingThreshold}+)!`)}
                </span>
              </p>
            ) : (
              <div>
                <p className="text-stone-800 dark:text-stone-200 font-medium">
                  {t('全馬快遞滿', 'Free shipping over')}{' '}
                  <span className="font-mono font-bold text-red-900 dark:text-red-300">RM {freeShippingThreshold}</span>
                  {t(' 免運費，還差', ', add')}{' '}
                  <span className="font-mono font-black text-red-700 dark:text-red-400">
                    RM {remainingForFreeShipping}
                  </span>
                </p>
                <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-red-700 transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Special Promo Note: RM 100 Cookies for 50g Floss */}
            {settings.freeFlossPromoActive !== false && (
              <div className="p-2 bg-white dark:bg-stone-900 rounded-lg border border-amber-300/80 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 font-bold">
                <div className="flex items-center gap-1.5">
                  <span>🎁</span>
                  {isCookiesEligible ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {t(`年餅已滿 RM ${cookiesSubtotal}，隨箱自動贈送 50g 招牌酥脆肉鬆！`, `RM ${cookiesSubtotal} cookies reached — Free 50g Crispy Floss included!`)}
                    </span>
                  ) : cookiesSubtotal > 0 ? (
                    <span>
                      {t('年餅已購', 'Cookies subtotal')} RM {cookiesSubtotal}，{t('還差', 'add')}{' '}
                      <span className="text-red-700 underline font-mono">RM {remainingForCookiesPromo}</span>{' '}
                      {t('即送 50g 肉鬆！', 'for Free 50g Floss!')}
                    </span>
                  ) : (
                    <span>
                      {t('購買傳統手工年餅滿 RM 100 即免費贈送 50g 招牌肉鬆！', 'Spend RM 100 on CNY Cookies & get Free 50g Crispy Meat Floss!')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center text-stone-400 dark:text-stone-500 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-1 opacity-50" />
                <p className="text-base font-bold">{t('購物車目前是空的', 'Your cart is empty')}</p>
                <p className="text-xs text-stone-400">
                  {t(
                    '快去選購炭烤切片肉乾、金元寶造型肉乾、酥香肉鬆與金牌黃梨酥吧！',
                    'Browse our Charcoal Bak Kwa, Roast Meats, Floss, Cookies & Sausages!'
                  )}
                </p>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemKey = `${item.productId}-${item.weightVariant || item.product.unitWeight}`;
                const itemPrice = itemPriceHelper(item);
                const itemWeight = item.weightVariant || item.product.unitWeight;
                const displayName = lang === 'en' ? item.product.nameEn : item.product.nameZh;

                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-3.5 pb-4 border-b border-stone-100 dark:border-stone-800"
                  >
                    <img
                      src={item.product.image}
                      alt={displayName}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs text-stone-500 font-mono mt-0.5 font-medium flex items-center gap-1.5">
                        <span className="font-bold text-red-700 dark:text-red-400">RM {itemPrice}</span>
                        <span>/</span>
                        <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-semibold text-stone-700 dark:text-stone-300">
                          {itemWeight}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1), item.weightVariant)}
                            className="px-2.5 py-1 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.weightVariant)}
                            className="px-2 py-0.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.productId, item.weightVariant)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title={t('刪除商品', 'Remove item')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                        RM {itemPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cartItems.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-3.5">
              
              {/* Dynamic Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={t('請輸入優惠碼', 'Enter promo code')}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 uppercase font-mono"
                    />
                  </div>
                  {appliedPromoObj ? (
                    <button
                      type="button"
                      onClick={handleClearPromo}
                      className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer"
                    >
                      {t('移除', 'Clear')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 rounded-md transition-colors cursor-pointer"
                    >
                      {t('套用', 'Apply')}
                    </button>
                  )}
                </div>

                {promoError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                    {promoError}
                  </p>
                )}

                {appliedPromoObj && !promoMeetsMin && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    {t(
                      `優惠碼 ${appliedPromoObj.code} 需滿 RM ${appliedPromoObj.minSpend} 才會生效`,
                      `Code ${appliedPromoObj.code} requires RM ${appliedPromoObj.minSpend} minimum spend`
                    )}
                  </p>
                )}

                {appliedPromoObj && promoMeetsMin && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {t('已套用', 'Applied')} {appliedPromoObj.code}：
                      {lang === 'en' && appliedPromoObj.titleEn ? appliedPromoObj.titleEn : appliedPromoObj.titleZh}
                    </span>
                  </div>
                )}
              </form>

              {/* Unlocked Free Gift Alert */}
              {combinedFreeGifts && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 rounded-lg text-[11px] text-amber-950 dark:text-amber-200 font-bold flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{t('隨單免費贈送：', 'Included Free Gift: ')}{combinedFreeGifts}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex justify-between">
                  <span>{t('商品小計 Subtotal', 'Subtotal')}</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100">RM {subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-700 dark:text-red-400 font-medium">
                    <span>{t('優惠折扣 Discount', 'Promo Discount')} ({appliedPromoObj?.code})</span>
                    <span className="font-mono">-RM {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {t('快遞運費 (西馬 / 東馬)', 'Delivery Fee')}
                    {promoFreeShipping && promoMeetsMin && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded font-bold flex items-center gap-0.5">
                        <Truck className="w-2.5 h-2.5" />
                        {t('免運碼', 'Promo')}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-stone-900 dark:text-stone-100">
                    {shippingFee === 0 ? t('免費 Free', 'Free') : `RM ${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <span>{t('應付總額 Total', 'Total')}</span>
                  <span className="font-mono text-base text-red-800 dark:text-red-400">
                    RM {total}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() =>
                  onProceedToCheckout({
                    discount: discountAmount,
                    promoCode: appliedPromoObj && promoMeetsMin ? appliedPromoObj.code : '',
                    freeShipping: Boolean(promoFreeShipping && promoMeetsMin),
                    freeGiftName: combinedFreeGifts || undefined,
                  })
                }
                className="w-full py-3 px-4 text-xs font-semibold text-white bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <span>{t('前往結帳並上傳付款截圖', 'Proceed to Checkout & QR Payment')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
