import React, { useState, useEffect, useRef } from 'react';
import { BannerSlide } from '../../types/store';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play, Flame } from 'lucide-react';

interface HeroBannerSliderProps {
  slides?: BannerSlide[];
  heroBannerUrl?: string;
  autoRotateSeconds?: number;
  grand?: boolean;
  onSelectCategory?: (category: string) => void;
  onOpenStory?: () => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
  slides = [],
  heroBannerUrl,
  autoRotateSeconds = 5,
  grand = false,
  onSelectCategory,
  onOpenStory,
}) => {
  const { lang, t } = useLanguage();

  const fallbackSlide: BannerSlide = {
    id: 'fallback-hero',
    title: '錦源古法炭烤肉乾 · 傳承四十年家的年味',
    titleEn: 'Jin Yuan 40-Year Charcoal Heritage Bak Kwa',
    subtitle: '嚴選上等鮮肉每日炭火現烤 · 滿 RM 300 全馬免運費',
    subtitleEn: 'Fresh charcoal-grilled daily · Free Malaysia shipping over RM 300',
    imageUrl: heroBannerUrl || '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg',
    badge: '40年老字號',
    badgeEn: 'Heritage Since 1985',
    ctaText: '立即選購',
    ctaTextEn: 'Shop Now',
    ctaAction: 'products',
    active: true,
  };

  const activeSlides = slides.filter((s) => s.active !== false);
  const displaySlides = activeSlides.length > 0 ? activeSlides : [fallbackSlide];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [slideRatios, setSlideRatios] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  const safeIndex = currentIndex >= displaySlides.length ? 0 : currentIndex;

  useEffect(() => {
    if (displaySlides.length <= 1 || isPaused) return;
    const intervalMs = Math.max(2000, Math.round((autoRotateSeconds || 5) * 1000));
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [displaySlides.length, isPaused, autoRotateSeconds]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 40) {
        handlePrev();
      } else if (deltaX < -40) {
        handleNext();
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    else if (e.key === 'ArrowRight') handleNext();
  };

  const handleCtaClick = (slide: BannerSlide) => {
    if (slide.ctaAction === 'story') {
      onOpenStory && onOpenStory();
    } else if (slide.ctaAction === 'category' && slide.ctaTarget) {
      onSelectCategory && onSelectCategory(slide.ctaTarget);
      const targetId = slide.ctaTarget === 'seasonal' ? 'seasonal-specials' : 'store-products';
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('store-products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleImageLoaded = (slideKey: string, img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const rawRatio = img.naturalWidth / img.naturalHeight;
      setSlideRatios((prev) => {
        if (prev[slideKey] && Math.abs(prev[slideKey] - rawRatio) < 0.01) {
          return prev;
        }
        return { ...prev, [slideKey]: rawRatio };
      });
    }
  };

  // Compute active slide mode & exact aspect ratio so pure-image banners auto-fit with zero empty gaps
  const activeSlide = displaySlides[safeIndex] || displaySlides[0];
  const activeSlideKey = activeSlide.id || String(safeIndex);
  const activeTitle = lang === 'en' && activeSlide.titleEn ? activeSlide.titleEn : activeSlide.title;
  const activeSubtitle = lang === 'en' && activeSlide.subtitleEn ? activeSlide.subtitleEn : activeSlide.subtitle;
  const activeBadge = lang === 'en' && activeSlide.badgeEn ? activeSlide.badgeEn : activeSlide.badge;
  const activeCta = lang === 'en' && activeSlide.ctaTextEn ? activeSlide.ctaTextEn : activeSlide.ctaText;
  const activeHasText = Boolean(
    activeTitle?.trim() || activeSubtitle?.trim() || activeBadge?.trim() || activeCta?.trim()
  );
  const isActivePureImage = Boolean(activeSlide.imageOnly) || !activeHasText;
  const activeMeasuredRatio = slideRatios[activeSlideKey] || 16 / 9;
  const isActivePortrait = activeMeasuredRatio < 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t('首頁促銷橫幅輪播', 'Promotional Hero Banners')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={
        isActivePureImage
          ? {
              aspectRatio: String(
                isActivePortrait ? 16 / 9 : Math.max(1.1, Math.min(2.6, activeMeasuredRatio))
              ),
            }
          : undefined
      }
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-stone-950 border border-stone-200/80 dark:border-stone-800 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-[aspect-ratio] duration-300 ${
        !isActivePureImage
          ? grand
            ? 'min-h-[320px] sm:aspect-[16/9] sm:max-h-[760px]'
            : 'min-h-[270px] sm:aspect-[16/9] sm:max-h-[680px]'
          : ''
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Smooth Horizontal Sliding Track */}
      <div
        className="flex h-full transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {displaySlides.map((slide, idx) => {
          const slideKey = slide.id || String(idx);
          const slideBadge = lang === 'en' && slide.badgeEn ? slide.badgeEn : slide.badge;
          const slideTitle = lang === 'en' && slide.titleEn ? slide.titleEn : slide.title;
          const slideSubtitle = lang === 'en' && slide.subtitleEn ? slide.subtitleEn : slide.subtitle;
          const slideCta = lang === 'en' && slide.ctaTextEn ? slide.ctaTextEn : slide.ctaText;
          const hasImageError = failedImages[slideKey];
          const hasAnyTextContent = Boolean(
            slideTitle?.trim() || slideSubtitle?.trim() || slideBadge?.trim() || slideCta?.trim()
          );
          const isPureImageMode = Boolean(slide.imageOnly) || !hasAnyTextContent;
          const showDarkScrim = !isPureImageMode && !slide.hideOverlay;
          const slideRatio = slideRatios[slideKey] || 16 / 9;
          const slideIsPortrait = slideRatio < 1;

          return (
            <div
              key={slideKey}
              aria-hidden={idx !== safeIndex}
              onClick={isPureImageMode && slide.ctaAction ? () => handleCtaClick(slide) : undefined}
              className={`w-full shrink-0 relative flex items-center overflow-hidden ${
                isActivePureImage
                  ? 'h-full'
                  : idx === safeIndex && !isPureImageMode
                  ? grand
                    ? 'min-h-[320px] sm:min-h-[480px] h-full'
                    : 'min-h-[270px] sm:min-h-[420px] h-full'
                  : 'h-full'
              } ${isPureImageMode && slide.ctaAction ? 'cursor-pointer' : ''}`}
            >
              {/* Slide Background Image (+ optional Contrast Scrim only in text-overlay mode) */}
              <div className="absolute inset-0">
                {!hasImageError && slide.imageUrl ? (
                  isPureImageMode && slideIsPortrait ? (
                    <>
                      <img
                        src={slide.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src={slide.imageUrl}
                        alt={slideTitle || t('錦源促銷橫幅', 'Jin Yuan Banner')}
                        onLoad={(e) => handleImageLoaded(slideKey, e.currentTarget)}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [slideKey]: true,
                          }))
                        }
                        className="relative z-10 w-full h-full object-contain object-center"
                        referrerPolicy="no-referrer"
                      />
                    </>
                  ) : (
                    <img
                      src={slide.imageUrl}
                      alt={slideTitle || t('錦源促銷橫幅', 'Jin Yuan Banner')}
                      onLoad={(e) => handleImageLoaded(slideKey, e.currentTarget)}
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [slideKey]: true,
                        }))
                      }
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-950 via-stone-900 to-amber-950 flex items-center justify-end pr-12">
                    <Flame className="w-32 h-32 text-amber-500/15" />
                  </div>
                )}
                {showDarkScrim && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-950/75 to-stone-950/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-black/25" />
                  </>
                )}
              </div>

              {/* Slide Text & CTA Content (hidden in Pure Image mode) */}
              {!isPureImageMode && (
                <div className="relative z-10 max-w-4xl px-10 sm:px-14 lg:px-16 py-6 sm:py-10 space-y-2.5 sm:space-y-4 text-white">
                  {(slideBadge || displaySlides.length > 1) && (
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wider text-amber-300 drop-shadow-xs">
                      {slideBadge && <span>{slideBadge}</span>}
                      {slideBadge && displaySlides.length > 1 && <span aria-hidden="true">·</span>}
                      {displaySlides.length > 1 && (
                        <span className="font-mono tabular-nums text-amber-200/90">
                          {String(idx + 1).padStart(2, '0')} / {String(displaySlides.length).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )}

                  {slideTitle && (
                    <h2 className="font-serif-brand text-xl sm:text-4xl lg:text-5xl font-black text-amber-50 tracking-tight leading-snug sm:leading-[1.18] drop-shadow-md text-balance max-w-3xl">
                      {slideTitle}
                    </h2>
                  )}

                  {slideSubtitle && (
                    <p className="text-xs sm:text-base lg:text-lg text-amber-100/95 leading-relaxed max-w-2xl font-normal drop-shadow-sm line-clamp-2 sm:line-clamp-none">
                      {slideSubtitle}
                    </p>
                  )}

                  {(slideCta || onOpenStory) && (
                    <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {slideCta && (
                        <button
                          type="button"
                          onClick={() => handleCtaClick(slide)}
                          className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-amber-50 font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base border border-amber-400/35 whitespace-nowrap"
                        >
                          <span>{slideCta}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                        </button>
                      )}

                      {onOpenStory && (
                        <button
                          type="button"
                          onClick={onOpenStory}
                          className="px-3.5 py-2 sm:px-4 sm:py-3 bg-stone-950/45 hover:bg-stone-950/65 backdrop-blur-md text-amber-200 font-bold rounded-xl transition text-xs sm:text-sm border border-white/25 cursor-pointer whitespace-nowrap"
                        >
                          {t('品牌故事', 'Our Story')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Left/Right Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label={t('上一張橫幅', 'Previous slide')}
            className="absolute left-2 sm:left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-stone-900/75 hover:bg-stone-900 text-amber-200 border border-amber-400/30 flex items-center justify-center transition opacity-85 sm:opacity-75 group-hover:opacity-100 hover:scale-105 cursor-pointer z-20 backdrop-blur-xs shadow-md"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label={t('下一張橫幅', 'Next slide')}
            className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-stone-900/75 hover:bg-stone-900 text-amber-200 border border-amber-400/30 flex items-center justify-center transition opacity-85 sm:opacity-75 group-hover:opacity-100 hover:scale-105 cursor-pointer z-20 backdrop-blur-xs shadow-md"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 pointer-events-none">
            <span className="text-[11px] font-mono tabular-nums text-amber-200/90 bg-stone-950/70 px-2 py-0.5 rounded border border-white/10 backdrop-blur-xs">
              {String(safeIndex + 1).padStart(2, '0')} / {String(displaySlides.length).padStart(2, '0')}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              {displaySlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? 'w-7 sm:w-9 bg-amber-400 shadow-sm shadow-amber-400/50'
                      : 'w-2 bg-white/45 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="pointer-events-auto p-1.5 text-amber-300/90 hover:text-white bg-stone-950/70 rounded-lg border border-white/15 transition cursor-pointer"
              aria-label={isPaused ? t('繼續自動輪播', 'Resume auto-rotation') : t('暫停自動輪播', 'Pause auto-rotation')}
              title={isPaused ? t('繼續自動輪播', 'Resume') : t('暫停自動輪播', 'Pause')}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
