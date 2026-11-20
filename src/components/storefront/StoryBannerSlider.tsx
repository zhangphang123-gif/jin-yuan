import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Tv, Newspaper, Calendar, Award, Pause, Play } from 'lucide-react';
import { OFFICIAL_LOGO_URL } from '../../utils/productImages';
import { useLanguage } from '../../context/LanguageContext';

export interface StorySlide {
  id: string;
  tag: string;
  tagEn: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  description: string;
  descriptionEn: string;
  imageUrl: string;
  year?: string;
  yearEn?: string;
  icon?: 'tv' | 'newspaper' | 'calendar' | 'award';
}

const DEFAULT_STORY_SLIDES: StorySlide[] = [
  {
    id: 'story-astro-feature',
    tag: '電視媒體專題',
    tagEn: 'TV Feature',
    title: 'Astro AEC《八點最熱報》深入錦源工坊專題專訪',
    titleEn: 'Astro AEC《Evening Edition》On-Site Documentary',
    subtitle: '檳城肉乾家族三十餘年來的堅持 · 二代接棒同心傳承',
    subtitleEn: '30+ Years of Dedication in Penang · Two Generations United',
    description:
      '電視台採訪團隊親臨柴楞公園工作坊，實景拍攝傳統鮮肉醃製與炭烤工序，專訪接棒家業的二兒子鄭瑞傑（Teh Swee Keat）及全體團隊。',
    descriptionEn:
      'The TV crew visited our Chai Leng Park workshop to film traditional charcoal grilling up close and interview second-generation successor Teh Swee Keat and our team.',
    imageUrl: '/assets/aistudio/IMG_1721_ad5f503b.jpg',
    year: '電視專訪',
    yearEn: 'TV Feature',
    icon: 'tv',
  },
  {
    id: 'story-oriental-daily',
    tag: '報章除夕全版專訪',
    tagEn: 'Press Coverage',
    title: '《東方日報》專題：「全家趕製肉乾 · 千里肉香是年味」',
    titleEn: 'Oriental Daily: "Family Crafting Bak Kwa · Festive Aroma Across Miles"',
    subtitle: '爐火從早燒到晚 · 萬變不離其宗 守護家的味道',
    subtitleEn: 'From Dawn to Night Over the Hearth · Preserving Home Flavor',
    description:
      '2018年2月15日《東方日報》除夕特刊大篇幅專訪，細述王鑾嬌女士與丈夫自1985年起白手興家、拒絕量產代工的老字號手工風骨。',
    descriptionEn:
      'Featured across a two-page CNY Eve spread in Oriental Daily, celebrating Madam Ong Luan Kiau’s 1985 origins and steadfast commitment to authentic handmade charcoal bak kwa.',
    imageUrl: '/assets/aistudio/IMG_1722_cd8d52ce.jpg',
    year: '2018 除夕特刊',
    yearEn: '2018 CNY Special',
    icon: 'newspaper',
  },
  {
    id: 'story-founding-origins',
    tag: '創辦傳奇 1985',
    tagEn: 'Founded 1985',
    title: '凌晨四點到午夜十二點，一爐炭火守望四十載',
    titleEn: '4 AM Roasts to Midnight Charcoal Watches Since 1985',
    subtitle: '創辦人王鑾嬌女士與鄭家兩代人的煙火歲月',
    subtitleEn: 'Founder Madam Ong Luan Kiau & Four Decades of Family Devotion',
    description:
      '從1980年代初辦年貨萌生「用自家養的豬試做肉乾」的初心，到1985年點起第一口炭火，五名子女在爐邊長大並肩撐起老字號招牌。',
    descriptionEn:
      'Sparked by a simple idea during 1980s festive shopping, Madam Ong and her husband lit their first charcoal hearth in 1985, raising five children beside the family craft.',
    imageUrl: '/src/assets/images/story_charcoal_workshop_1794634473097.jpg',
    year: 'EST. 1985',
    yearEn: 'EST. 1985',
    icon: 'calendar',
  },
  {
    id: 'story-craftsmanship-pillars',
    tag: '四大匠心堅持',
    tagEn: 'Four Craft Pillars',
    title: '鮮肉現烤 · 天然香料 · 獨立真空封存每一份年味',
    titleEn: 'Fresh Cuts · Natural Spices · Vacuum-Sealed Freshness',
    subtitle: '拒絕冷凍隔夜肉與多餘人工添加 · 乾淨衛生禮贈皆宜',
    subtitleEn: 'Zero Overnight Frozen Meat · No Artificial Additives',
    description:
      '每日嚴選鮮豬後腿精肉與雞肉，以祖傳天然香料配生抽冰糖慢工醃製，老師傅炭爐細烤微涼後即獨立真空密封，鎖住剛離火的蜜汁焦香。',
    descriptionEn:
      'Daily fresh cuts marinated in heirloom spices, soy sauce, and rock sugar, master-grilled over charcoal and individually vacuum-packed at peak aroma.',
    imageUrl: '/src/assets/images/story_family_heritage_1794634472318.jpg',
    year: '四大匠心',
    yearEn: 'Four Pillars',
    icon: 'award',
  },
  {
    id: 'story-brand-seal',
    tag: '官方金印印記',
    tagEn: 'Official Seal',
    title: '「錦源傳統肉乾肉絲專賣」四十載品質金字招牌',
    titleEn: 'Jin Yuan Traditional Enterprise · 40 Years of Trusted Quality',
    subtitle: '檳城北海柴楞公園 29, Medan Kurau 1 老字號工坊',
    subtitleEn: '29, Medan Kurau 1, Chai Leng Park, Perai, Pulau Pinang',
    description:
      '四十餘載爐火不息，每一片「錦源」肉乾承載的不只是傳統手工的溫度，更凝聚著一家人同心協力的堅守與家的味道。',
    descriptionEn:
      'Over forty years on, every slice of Jin Yuan bak kwa carries authentic charcoal warmth and the enduring love of a family kitchen.',
    imageUrl: OFFICIAL_LOGO_URL,
    year: '老字號傳承',
    yearEn: 'Quality Seal',
    icon: 'award',
  },
];

export const StoryBannerSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { lang, t } = useLanguage();

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEFAULT_STORY_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentSlide = DEFAULT_STORY_SLIDES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + DEFAULT_STORY_SLIDES.length) % DEFAULT_STORY_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DEFAULT_STORY_SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 40) handlePrev();
    else if (deltaX < -40) handleNext();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-stone-900 shadow-2xl select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Banner Tag Bar */}
      <div className="bg-stone-950/80 backdrop-blur-md px-5 py-3 border-b border-stone-800 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2">
          {currentSlide.icon === 'tv' && <Tv className="w-4 h-4 text-red-500" />}
          {currentSlide.icon === 'newspaper' && <Newspaper className="w-4 h-4 text-amber-400" />}
          {currentSlide.icon === 'calendar' && <Calendar className="w-4 h-4 text-emerald-400" />}
          {currentSlide.icon === 'award' && <Award className="w-4 h-4 text-amber-400" />}
          <span className="font-bold tracking-wider uppercase">
            {lang === 'en' ? currentSlide.tagEn : currentSlide.tag}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-stone-400">{currentIndex + 1} / {DEFAULT_STORY_SLIDES.length}</span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:text-white transition cursor-pointer"
            title={isPaused ? t('繼續播放', 'Resume') : t('暫停', 'Pause')}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Slide Visual and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px] sm:min-h-[420px]">
        
        {/* Slide Image (7 cols) */}
        <div className="lg:col-span-7 relative bg-stone-950 flex items-center justify-center overflow-hidden aspect-[16/10] lg:aspect-auto">
          <img
            src={currentSlide.imageUrl}
            alt={lang === 'en' ? currentSlide.titleEn : currentSlide.title}
            className="w-full h-full object-contain sm:object-cover transition-transform duration-700 group-hover:scale-102"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Slide Text Details (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-stone-900 text-white space-y-4">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-red-950 border border-red-800 text-amber-300 text-xs font-bold">
              {lang === 'en' ? currentSlide.yearEn || 'Jin Yuan Heritage' : currentSlide.year || '錦源傳承'}
            </div>
            <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-amber-100 leading-snug">
              {lang === 'en' ? currentSlide.titleEn : currentSlide.title}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-400">
              {lang === 'en' ? currentSlide.subtitleEn : currentSlide.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed pt-1">
              {lang === 'en' ? currentSlide.descriptionEn : currentSlide.description}
            </p>
          </div>

          {/* Quick thumbnails navigation bar */}
          <div className="pt-4 border-t border-stone-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DEFAULT_STORY_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex ? 'border-amber-400 scale-105 shadow-md' : 'border-stone-700 opacity-60 hover:opacity-100'
                }`}
                title={lang === 'en' ? slide.titleEn : slide.title}
              >
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous story slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-950/80 hover:bg-stone-900 text-amber-300 border border-amber-400/30 flex items-center justify-center transition opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next story slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-950/80 hover:bg-stone-900 text-amber-300 border border-amber-400/30 flex items-center justify-center transition opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
