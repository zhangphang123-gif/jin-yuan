import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PromoTickerBannerProps {
  announcements?: string[];
  fallbackText?: string;
}

const DEFAULT_EN_ANNOUNCEMENTS = [
  '🔥 CNY Special: Spend RM 100 on Handmade Cookies & get FREE 50g Crispy Meat Floss!',
  '🚚 Nationwide Vacuum-Sealed Delivery: Free Shipping across Malaysia on orders RM 300+!',
  '🍖 Charcoal Roast Pork Belly & Whole Roasted Pig Pre-Orders Now Open!',
  '🥩 Fresh Charcoal Bak Kwa: Select 100g, 300g, 500g, or 1kg packs before adding to cart!',
  '📍 Penang Store Pickup: Open daily 8:00 AM - 10:00 PM at Chai Leng Park, Perai!',
];

export const PromoTickerBanner: React.FC<PromoTickerBannerProps> = ({
  announcements = [],
}) => {
  const { lang, t } = useLanguage();
  const zhItems =
    announcements && announcements.length > 0
      ? announcements
      : [
          '🔥 新春限時特惠：購買任意傳統手工年餅滿 RM 100，即免費贈送 50g 招牌酥脆肉鬆！',
          '🚚 全馬常溫獨立真空郵寄服務：訂單累計滿 RM 300 即享免運費直送到府！',
          '🍖 清晨炭火現烤脆皮燒肉、祭神祈福【全隻金牌大燒豬 / 乳豬】新春火熱預訂中！',
          '🥩 正宗古法炭火手工慢烤肉乾：提供 100g、300g、500g、1kg 多克數挑選，先選克數再加入購物車！',
          '📍 門市自取：檳城北賴柴楞公園 Chai Leng Park 門市營業中 (8:00 AM - 10:00 PM)！',
        ];
  const items = lang === 'en' ? DEFAULT_EN_ANNOUNCEMENTS : zhItems;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  const safeIndex = currentIndex >= items.length ? 0 : currentIndex;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) {
      handlePrev();
    } else if (deltaX < -40) {
      handleNext();
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-amber-100 border-b border-amber-500/20 py-1.5 sm:py-2 px-2 sm:px-6 relative select-none shadow-xs text-xs sm:text-sm font-bold tracking-wide"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        <button
          onClick={handlePrev}
          aria-label="Previous announcement"
          className="p-1 rounded-full text-amber-300 hover:text-white hover:bg-red-800/60 transition cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex-1 overflow-hidden text-center relative min-h-[20px] flex items-center justify-center">
          <div
            key={`${lang}-${safeIndex}`}
            className="animate-fade flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 px-1 max-w-full"
          >
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-stone-950 shadow-xs shrink-0">
              <Sparkles className="w-3 h-3 text-red-900" />
              <span>{t('優惠', 'Promo')} {safeIndex + 1}/{items.length}</span>
            </span>

            <span className="text-amber-100 text-[11px] sm:text-sm font-bold tracking-wide truncate sm:whitespace-normal">
              {items[safeIndex]}
            </span>
          </div>
        </div>

        {/* Right Arrow & Indicator */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? '繼續自動輪播' : '暫停輪播'}
            className="hidden sm:inline-flex p-1 rounded-full text-amber-300/80 hover:text-white hover:bg-red-800/60 transition cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleNext}
            aria-label="Next announcement"
            className="p-1 rounded-full text-amber-300 hover:text-white hover:bg-red-800/60 transition cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

      </div>

      {/* Mini Dot Indicators (Desktop/Tablet) */}
      <div className="hidden sm:flex items-center justify-center gap-1.5 pt-1">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all cursor-pointer ${
              idx === currentIndex ? 'w-5 bg-amber-300' : 'w-1.5 bg-amber-400/40 hover:bg-amber-400/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
