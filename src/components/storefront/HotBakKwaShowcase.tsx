import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSettings } from '../../types/store';
import { getProductImages } from '../../utils/productImages';
import { resolveHotShowcaseProducts } from '../../utils/productFilters';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface HotBakKwaShowcaseProps {
  products: StoreProduct[];
  settings: StoreSettings;
  onQuickView: (product: StoreProduct) => void;
}

export const HotBakKwaShowcase: React.FC<HotBakKwaShowcaseProps> = ({
  products,
  settings,
  onQuickView,
}) => {
  const { lang, t } = useLanguage();
  const hotProducts = resolveHotShowcaseProducts(products, settings);

  const [startIndex, setStartIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 3;
    return 2;
  });

  const dragStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  // Responsive visible card slots: 2 on mobile, 3 on tablet, 4 on desktop
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth >= 1024) setVisibleCount(4);
      else if (window.innerWidth >= 640) setVisibleCount(3);
      else setVisibleCount(2);
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const maxStart = Math.max(0, hotProducts.length - visibleCount);
  const safeStart = startIndex > maxStart ? 0 : startIndex;

  // Fast, automatic rotation whenever customer is not touching/hovering/dragging
  useEffect(() => {
    if (hotProducts.length <= visibleCount || isInteracting) return;

    const configuredSeconds =
      settings.hotAutoRotateSeconds && settings.hotAutoRotateSeconds > 0
        ? settings.hotAutoRotateSeconds
        : 1.8;
    const intervalMs = Math.max(1000, Math.round(configuredSeconds * 1000));

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev >= maxStart ? 0 : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hotProducts.length, visibleCount, maxStart, isInteracting, settings.hotAutoRotateSeconds]);

  if (hotProducts.length === 0) return null;

  const sectionTitle =
    lang === 'en'
      ? settings.hotSectionTitleEn || 'Signature Favorites · Bak Kwa · Pork & Chicken Floss · Festive Shapes'
      : settings.hotSectionTitleZh || '熱門主打招牌 · 炭烤肉乾・豬肉絲・雞肉絲・各式造型肉乾';

  const handlePrev = () => {
    setStartIndex((prev) => (prev <= 0 ? maxStart : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= maxStart ? 0 : prev + 1));
  };

  // Unified touch & mouse drag swipe handlers
  const beginDrag = (clientX: number) => {
    dragStartX.current = clientX;
    didSwipe.current = false;
    setIsDragging(true);
    setIsInteracting(true);
    setDragOffsetPx(0);
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 6) {
      didSwipe.current = true;
    }
    setDragOffsetPx(delta);
  };

  const endDrag = (clientX?: number) => {
    if (dragStartX.current !== null) {
      const delta = clientX !== undefined ? clientX - dragStartX.current : dragOffsetPx;
      if (delta > 32) {
        handlePrev();
      } else if (delta < -32) {
        handleNext();
      }
      dragStartX.current = null;
    }
    setIsDragging(false);
    setDragOffsetPx(0);
    setIsInteracting(false);
  };

  const stepPercent = 100 / visibleCount;

  return (
    <section
      aria-label={t('熱門肉乾自動旋轉展示區', 'Hot Bak Kwa Auto-Rotating Showcase')}
      className="py-4 sm:py-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-b border-stone-200/80 dark:border-stone-800"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        if (isDragging) endDrag();
        else setIsInteracting(false);
      }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 space-y-3 sm:space-y-4">
        {/* Clean Cohesive Section Header + Manual Arrows */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif-brand text-base sm:text-xl font-black text-stone-900 dark:text-stone-100 leading-snug truncate">
            {sectionTitle}
          </h2>

          {hotProducts.length > visibleCount && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                aria-label={t('向左滑動', 'Slide left')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                aria-label={t('向右滑動', 'Slide right')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Swipable & Auto-Moving Track Viewport (Photo + Product Name ONLY) */}
        <div
          className="relative overflow-hidden -mx-1.5 sm:-mx-2 touch-pan-y select-none cursor-grab active:cursor-grabbing"
          onTouchStart={(e) => beginDrag(e.touches[0].clientX)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
          onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX)}
          onTouchCancel={() => endDrag()}
          onMouseDown={(e) => beginDrag(e.clientX)}
          onMouseMove={(e) => {
            if (isDragging) moveDrag(e.clientX);
          }}
          onMouseUp={(e) => {
            if (isDragging) endDrag(e.clientX);
          }}
        >
          <div
            className={`flex will-change-transform ${
              isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'
            }`}
            style={{
              transform: `translateX(calc(-${safeStart * stepPercent}% + ${dragOffsetPx}px))`,
            }}
          >
            {hotProducts.map((product) => {
              const images = getProductImages(product);
              const title = lang === 'en' ? product.nameEn : product.nameZh;
              const imgFailed = failedImages[product.id];

              return (
                <div
                  key={product.id}
                  style={{ flex: `0 0 ${stepPercent}%` }}
                  className="px-1.5 sm:px-2 min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!didSwipe.current) {
                        onQuickView(product);
                      }
                    }}
                    className="w-full h-full text-left bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-red-800/35 dark:hover:border-amber-500/40 rounded-2xl overflow-hidden flex flex-col transition-all shadow-2xs hover:shadow-md cursor-pointer group/card"
                  >
                    {/* Clean Product Photo (Zero Overlay Badges) */}
                    <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      {!imgFailed ? (
                        <img
                          src={images[0]}
                          alt={title}
                          draggable={false}
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                          }
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 text-stone-500 px-3 text-center">
                          <Flame className="w-6 h-6 text-red-800/60 mb-1" />
                          <span className="text-xs font-medium line-clamp-1">{title}</span>
                        </div>
                      )}
                    </div>

                    {/* Product Name & Compact Stock Status */}
                    <div className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex-1 flex flex-col items-center sm:items-start justify-center gap-1">
                      <h3 className="font-serif-brand font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover/card:text-red-900 dark:group-hover/card:text-amber-300 transition-colors line-clamp-2 text-center sm:text-left leading-snug">
                        {title}
                      </h3>
                      <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono tabular-nums">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            product.stock <= 0
                              ? 'bg-red-500'
                              : product.stock <= 10
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={
                            product.stock <= 0
                              ? 'text-red-600 dark:text-red-400 font-bold'
                              : product.stock <= 10
                              ? 'text-amber-700 dark:text-amber-400 font-bold'
                              : 'text-stone-500 dark:text-stone-400 font-medium'
                          }
                        >
                          {product.stock <= 0
                            ? t('暫時售完', 'Sold out')
                            : product.stock <= 10
                            ? t(`僅剩 ${product.stock} 件`, `${product.stock} left`)
                            : t(`庫存 ${product.stock} 件`, `Stock: ${product.stock}`)}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
