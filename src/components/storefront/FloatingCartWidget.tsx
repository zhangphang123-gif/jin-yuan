import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { CartItem, StoreSettings } from '../../types/store';
import { useLanguage } from '../../context/LanguageContext';

interface FloatingCartWidgetProps {
  cartItems: CartItem[];
  settings: StoreSettings;
  onOpenCart: () => void;
}

export const FloatingCartWidget: React.FC<FloatingCartWidgetProps> = ({
  cartItems,
  settings,
  onOpenCart,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const { lang, t } = useLanguage();

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.selectedPrice !== undefined ? item.selectedPrice : item.product.price) * item.quantity,
    0
  );

  const freeShippingThreshold = settings.freeShippingThreshold || 300;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const diffToFree = Math.max(0, freeShippingThreshold - subtotal);

  // Even when cart is empty, user still sees a mini shopping cart icon so they know where it is!
  return (
    <aside aria-label="購物車快速檢視" className="fixed right-2.5 sm:right-6 bottom-3.5 sm:bottom-8 z-40 flex flex-col items-end">
      
      {/* Quick Preview Popover ("看到它買什麼東西") */}
      {showPreview && cartItems.length > 0 && (
        <div className="mb-2.5 w-[min(calc(100vw-1.25rem),22rem)] sm:w-96 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border-2 border-amber-500/40 p-3.5 sm:p-4 animate-fade text-stone-900 dark:text-stone-100 max-h-[70vh] sm:max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <div>
                <h4 className="font-serif-brand font-black text-sm text-red-950 dark:text-red-200">
                  {lang === 'en' ? `My Cart (${totalQuantity} items)` : `我的購物車清單 (${totalQuantity} 件)`}
                </h4>
                <span className="text-[10px] text-stone-500">
                  {t('點擊查看詳情或直接出單結帳', 'Tap below to edit cart or checkout')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              aria-label="Close cart preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items list preview */}
          <div className="py-2 overflow-y-auto space-y-2 flex-1 max-h-52 pr-1 custom-scroll">
            {cartItems.map((item) => {
              const itemPrice = item.selectedPrice !== undefined ? item.selectedPrice : item.product.price;
              const weight = item.weightVariant || item.product.unitWeight;
              const itemName = lang === 'en' ? item.product.nameEn : item.product.nameZh;
              return (
                <div
                  key={`${item.productId}-${weight}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60"
                >
                  <img
                    src={item.product.image}
                    alt={itemName}
                    className="w-11 h-11 rounded-lg object-cover border border-amber-400/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-stone-900 dark:text-stone-100">
                      {itemName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                      <span className="px-1.5 py-0.2 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded font-mono font-bold">
                        {weight}
                      </span>
                      <span>× {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-red-800 dark:text-red-400">
                      RM {itemPrice * item.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal & Free Shipping Progress */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">{t('商品小計：', 'Subtotal:')}</span>
              <span className="font-mono font-black text-sm text-red-900 dark:text-red-400">
                RM {subtotal}
              </span>
            </div>

            {/* Free Shipping Tip */}
            <div className="text-[11px] p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              {isFreeShipping ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    {lang === 'en'
                      ? `Free shipping unlocked (>= RM ${freeShippingThreshold})!`
                      : `恭喜！已達 RM ${freeShippingThreshold} 全馬免運費門檻！`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {lang === 'en' ? (
                      <>Add <strong className="font-mono font-black text-red-700">RM {diffToFree}</strong> more for Free Shipping!</>
                    ) : (
                      <>再買 <strong className="font-mono font-black text-red-700">RM {diffToFree}</strong> 即可享全馬免運費！</>
                    )}
                  </span>
                </>
              )}
            </div>

            {/* View Full Cart Button */}
            <button
              onClick={() => {
                setShowPreview(false);
                onOpenCart();
              }}
              className="w-full py-2.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
            >
              <span>{t('查看購物車與出單結帳', 'Open Cart & Checkout')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Cart Vehicle / Tracking Car Widget */}
      <div className="relative group">
        <button
          onClick={() => {
            if (cartItems.length > 0) {
              setShowPreview(!showPreview);
            } else {
              onOpenCart();
            }
          }}
          className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 border-2 ${
            totalQuantity > 0
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white border-amber-400 hover:border-amber-300 ring-4 ring-amber-400/20 shadow-red-950/50'
              : 'bg-white/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-red-700 shadow-stone-900/20'
          }`}
          title="跟隨購物車：點擊檢視已選商品"
          aria-label="隨身購物車"
        >
          {/* Animated Vehicle / Cart Icon */}
          <div className="relative flex items-center justify-center">
            {/* Cute mini car/cart body */}
            <div className={`p-1.5 sm:p-2 rounded-full ${totalQuantity > 0 ? 'bg-amber-400 text-stone-950' : 'bg-red-900 text-white'}`}>
              <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            {/* Rotating Wheels effect ("它走转转") */}
            <span
              className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-900 bg-amber-500 ${
                totalQuantity > 0 ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s' }}
            />
            <span
              className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-900 bg-amber-500 ${
                totalQuantity > 0 ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Text & Counter Info */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black font-serif-brand">
                {totalQuantity > 0 ? t('我的採購車', 'My Cart') : t('購物車', 'Cart')}
              </span>
              {totalQuantity > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-mono font-black shadow-xs">
                  {totalQuantity} {t('件', '')}
                </span>
              )}
            </div>

            {totalQuantity > 0 ? (
              <span className="font-mono text-xs sm:text-sm font-black text-amber-300">
                RM {subtotal}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400">{t('目前空空', 'Empty')}</span>
            )}
          </div>

          {/* Quick arrow */}
          <ChevronRight className="w-4 h-4 text-amber-300 hidden sm:inline" />
        </button>

        {/* Hover Hint on Desktop */}
        <div className="absolute right-0 bottom-full mb-2 hidden md:group-hover:block pointer-events-none">
          <div className="bg-stone-950 text-white text-[11px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md border border-stone-700">
            {totalQuantity > 0 ? t('點擊預覽採購清單或結帳', 'Preview cart & checkout') : t('點擊查看購物車', 'View Cart')}
          </div>
        </div>
      </div>

    </aside>
  );
};
