import React, { useState, useRef } from 'react';
import { StoreProduct } from '../../types/store';
import { getProductImages } from '../../utils/productImages';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ProductImageCarouselProps {
  product: StoreProduct;
  compactMobile?: boolean;
  variant?: 'classic' | 'festive' | 'luxury_3d';
  onImageClick?: () => void;
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  product,
  compactMobile = false,
  variant = 'classic',
  onImageClick,
}) => {
  const { lang, t } = useLanguage();
  const images = getProductImages(product);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isFestive = variant === 'festive';
  const isLuxury = variant === 'luxury_3d';

  const safeIndex = currentIndex >= images.length ? 0 : currentIndex;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 30) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    } else if (deltaX < -30) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
    touchStartX.current = null;
  };

  return (
    <div className="select-none">
      {/* Main Swipable Image Viewport */}
      <div
        onClick={onImageClick}
        className={`relative overflow-hidden group/carousel ${
          isLuxury
            ? 'bg-[#120B09]'
            : isFestive
            ? 'bg-[#F5EFE4]'
            : 'bg-stone-100 dark:bg-stone-950'
        } ${compactMobile ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'} ${
          onImageClick ? 'cursor-pointer' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={images[safeIndex]}
          src={images[safeIndex]}
          alt={`${lang === 'en' ? product.nameEn : product.nameZh} - Photo ${safeIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Top Overlay Bar: Left Badge + Right Stock Indicator (Flex row prevents overlap on narrow 2-col mobile cards) */}
        <div className="absolute top-1.5 sm:top-2.5 inset-x-1.5 sm:inset-x-2.5 z-10 flex items-start justify-between gap-1 pointer-events-none">
          <div className="min-w-0 max-w-[54%]">
            {isLuxury ? (
              product.badge ? (
                <span className="inline-block max-w-full truncate text-[10px] font-semibold tracking-wider text-[#F6DFA9] bg-[#0B0807]/85 px-2 py-0.5 rounded-sm border border-[#E5B869]/40 backdrop-blur-md">
                  {lang === 'en' && product.badgeEn ? product.badgeEn : product.badge}
                </span>
              ) : null
            ) : isFestive ? (
              product.badge ? (
                <span className="inline-block max-w-full truncate text-[10px] font-semibold tracking-wider text-[#FBF7F0] bg-[#7A1215]/90 px-2 py-0.5 rounded-sm border border-[#D4AF37]/40 backdrop-blur-xs">
                  {lang === 'en' && product.badgeEn ? product.badgeEn : product.badge}
                </span>
              ) : null
            ) : product.badge ? (
              <span className="inline-block max-w-full truncate text-[10px] sm:text-xs font-bold text-white bg-red-800/90 px-1.5 sm:px-2 py-0.5 rounded shadow-xs backdrop-blur-xs">
                {lang === 'en' && product.badgeEn ? product.badgeEn : product.badge}
              </span>
            ) : (
              <span className="hidden sm:inline-block max-w-full truncate text-xs font-mono font-bold tracking-wider text-stone-700 dark:text-stone-300 bg-white/90 dark:bg-stone-900/90 px-2 py-0.5 rounded shadow-xs">
                {product.sku}
              </span>
            )}
          </div>

          <div
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-[10px] sm:text-xs font-mono tabular-nums font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-xs backdrop-blur-xs ${
              product.stock <= 0
                ? 'bg-red-900/95 text-red-100 border border-red-400/50'
                : product.stock <= 10
                ? 'bg-amber-900/95 text-amber-100 border border-amber-400/50'
                : isLuxury
                ? 'bg-[#0B0807]/85 text-[#F6DFA9] border border-[#E5B869]/40'
                : isFestive
                ? 'bg-[#580A0D]/88 text-[#F9E8C4] border border-[#D4AF37]/40'
                : 'bg-stone-950/85 text-stone-100'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                product.stock <= 0
                  ? 'bg-red-400'
                  : product.stock <= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              aria-hidden="true"
            />
            <span>
              {product.stock <= 0
                ? t('已售完', 'Sold Out')
                : `${t('庫存', 'Stock')} ${product.stock}`}
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous product image"
              className={`absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 rounded-full bg-stone-900/70 hover:bg-stone-900/95 text-white flex items-center justify-center transition opacity-85 sm:opacity-0 sm:group-hover/carousel:opacity-100 cursor-pointer shadow-md z-10 ${
                compactMobile ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8'
              }`}
            >
              <ChevronLeft className={compactMobile ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4'} />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next product image"
              className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 rounded-full bg-stone-900/70 hover:bg-stone-900/95 text-white flex items-center justify-center transition opacity-85 sm:opacity-0 sm:group-hover/carousel:opacity-100 cursor-pointer shadow-md z-10 ${
                compactMobile ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8'
              }`}
            >
              <ChevronRight className={compactMobile ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4'} />
            </button>

            {/* Bottom Counter & Dots */}
            <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-between px-3 pointer-events-none">
              <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded-sm backdrop-blur-xs flex items-center gap-1">
                <ImageIcon className="w-2.5 h-2.5" />
                <span>{safeIndex + 1}/{images.length}</span>
              </span>

              <div className="flex items-center gap-1 pointer-events-auto">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex
                        ? isLuxury
                          ? 'w-4 bg-[#E5B869]'
                          : isFestive
                          ? 'w-4 bg-[#D4AF37]'
                          : 'w-3 sm:w-4 bg-amber-400'
                        : 'w-1.5 bg-white/70 hover:bg-white'
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini Thumbnail Strip (Hidden in festive/luxury editorial mode for clean framing and in 2-col compact mobile cards) */}
      {!isFestive && !isLuxury && images.length > 1 && (
        <div
          className={`${
            compactMobile ? 'hidden sm:flex' : 'flex'
          } items-center gap-1.5 px-3 py-2 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-100 dark:border-stone-800 overflow-x-auto scrollbar-none`}
        >
          {images.map((imgUrl, idx) => (
            <button
              key={`${imgUrl}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative w-11 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                idx === safeIndex
                  ? 'border-red-800 dark:border-amber-400 scale-105 shadow-xs'
                  : 'border-transparent opacity-65 hover:opacity-100'
              }`}
              title={`檢視第 ${idx + 1} 張照片`}
            >
              <img
                src={imgUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
