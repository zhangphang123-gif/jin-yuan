import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Globe,
  ShieldCheck,
  Flame,
  Leaf,
  PackageCheck,
  Tv,
  Newspaper,
  ZoomIn,
  X,
  MapPin,
  Phone,
  ExternalLink,
  Play,
  MessageCircle
} from 'lucide-react';
import { StoreSettings } from '../../types/store';
import { SocialFollowLinks } from './SocialFollowLinks';
import { OFFICIAL_LOGO_URL } from '../../utils/productImages';
import { useLanguage } from '../../context/LanguageContext';

interface BrandStoryViewProps {
  settings: StoreSettings;
  onBackToStore: () => void;
}

const STORY_WORKSHOP_IMG = '/src/assets/images/story_charcoal_workshop_1794634473097.jpg';
const STORY_FAMILY_HERITAGE_IMG = '/src/assets/images/story_family_heritage_1794634472318.jpg';
const MEDIA_TV_INTERVIEW_IMG = '/assets/aistudio/IMG_1721_ad5f503b.jpg';
const MEDIA_ORIENTAL_DAILY_IMG = '/assets/aistudio/IMG_1722_cd8d52ce.jpg';
const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/h94fX0ytGIE';
const OFFICIAL_FB_URL = 'https://www.facebook.com/profile.php?id=61596513451447&sk=directory_links';
const OFFICIAL_SITE_URL = 'https://sites.google.com/view/jinyuantraditionalenterprise';

export const BrandStoryView: React.FC<BrandStoryViewProps> = ({
  settings,
  onBackToStore,
}) => {
  const { lang, toggleLang, t } = useLanguage();
  const displayLogo = settings.logoUrl || OFFICIAL_LOGO_URL;
  const workshopImg = settings.brandStoryWorkshopImg || STORY_WORKSHOP_IMG;
  const heritageImg = settings.brandStoryHeritageImg || STORY_FAMILY_HERITAGE_IMG;
  const [lightboxMedia, setLightboxMedia] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!lightboxMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia]);

  const craftsmanshipPillars = [
    {
      num: '01 · FRESH CUTS',
      icon: ShieldCheck,
      title: t('嚴選新鮮優質肉源', 'Fresh Daily Selected Cuts'),
      desc: t(
        '清晨挑揀上等鮮豬後腿精肉與優質雞肉，堅持當日鮮肉現切現製，絕不使用冷凍隔夜肉，只為鎖住肉質最本真的鮮甜與彈潤咬勁。',
        'Every morning begins with hand-picked fresh pork leg cuts and premium chicken — never frozen overnight meat — preserving natural sweetness and tender bounce.'
      ),
    },
    {
      num: '02 · CHARCOAL FIRE',
      icon: Flame,
      title: t('老師傅看火慢烤', 'Master Charcoal Hearth Roasting'),
      desc: t(
        '沿襲古法炭爐手工烘烤，老師傅守在熾熱火塘前精準拿捏火候、細心翻動烤網，讓天然木炭燻香滲入絲絲肌理，烤出油亮多汁的焦香韻味。',
        'Seasoned masters tend glowing wood-charcoal hearths by hand, turning wire racks at exact heat so smoky depth infuses every glistening caramelized slice.'
      ),
    },
    {
      num: '03 · SECRET RECIPE',
      icon: Leaf,
      title: t('天然傳統香料醃製', 'Natural Heritage Spice Marinade'),
      desc: t(
        '循用鄭家傳承四十餘年的祖傳秘方，嚴選天然香料配搭醇厚上等生抽與溫潤冰糖慢工醃漬入味，拒絕多餘人工添加，還原記憶中最純粹的古早年味。',
        'Marinated slowly in our 40-year Teh family blend of natural spices, aged soy sauce, and rock sugar — free of unnecessary additives for pure festive nostalgia.'
      ),
    },
    {
      num: '04 · VACUUM SEALED',
      icon: PackageCheck,
      title: t('獨立真空衛生包裝', 'Individual Vacuum-Sealed Freshness'),
      desc: t(
        '出爐靜置微涼後即以食品級獨立真空密封封存，牢牢鎖住剛離火的蜜汁鮮香與溫潤口感，潔淨體面、便攜耐存，無論佳節饋贈或日常品嚐皆宜。',
        'Once cooled after roasting, slices are individually sealed in food-grade vacuum packs to lock in oven-fresh honey glaze cleanly for gifting or everyday enjoyment.'
      ),
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] dark:bg-stone-950 text-[#2C1810] dark:text-stone-100 font-sans">
      
      {/* Sticky Top Heritage Bar */}
      <header className="sticky top-0 z-40 bg-[#4A0E0E]/96 backdrop-blur-md border-b border-[#D4AF37]/40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-[74px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/45 bg-[#2E0707]/60 hover:bg-[#8B1A1A] text-[#EED584] text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t('返回商城', 'Back to Shop')}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-[#2E0707] shrink-0">
                <img
                  src={displayLogo}
                  alt={t('錦源官方徽章', 'Jin Yuan Official Emblem')}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="font-serif-brand font-black text-base text-[#FFF8E7] truncate">
                  {t('錦源傳統肉乾肉絲專賣', 'Jin Yuan Bak Kwa')}
                </div>
                <div className="text-[10px] tracking-[0.16em] text-[#EED584] uppercase truncate">
                  JIN YUAN TRADITIONAL ENTERPRISE
                </div>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#F6E7CF]">
            <button
              type="button"
              onClick={() => scrollToSection('story-craftsmanship')}
              className="hover:text-[#EED584] transition cursor-pointer whitespace-nowrap"
            >
              {t('四大匠心堅持', 'Craftsmanship')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-narrative')}
              className="hover:text-[#EED584] transition cursor-pointer whitespace-nowrap"
            >
              {t('品牌故事', 'Our Story')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-media')}
              className="hover:text-[#EED584] transition cursor-pointer whitespace-nowrap"
            >
              {t('媒體專題報導', 'Press & TV')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-footer')}
              className="hover:text-[#EED584] transition cursor-pointer whitespace-nowrap"
            >
              {t('聯繫我們', 'Contact')}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-[#D4AF37]/45 bg-[#2E0707]/60 text-[#FFF8E7] hover:border-[#EED584] text-xs font-bold transition cursor-pointer"
              title="Switch Language / 切換語言"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-[#EED584] via-[#D4AF37] to-[#B88E1F] hover:brightness-105 text-[#360A0A] text-xs sm:text-sm font-black shadow-md transition cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>{t('立即選購', 'Order Now')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 1. Top Brand Visual Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3A0909] via-[#5D1010] to-[#8B1A1A] text-[#FFF9EE] py-14 sm:py-20 px-4 sm:px-6 border-b-4 border-[#D4AF37]">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #D4AF37 1px, transparent 1px), linear-gradient(-45deg, #D4AF37 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="rounded-3xl border border-[#D4AF37]/45 bg-gradient-to-b from-[#2E0707]/45 to-[#4A0E0E]/60 p-7 sm:p-12 text-center shadow-2xl ring-4 ring-[#D4AF37]/10">
            <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-6 rounded-full overflow-hidden border-[3px] border-[#D4AF37] bg-[#3A0808] shadow-2xl ring-4 ring-[#D4AF37]/20">
              <img
                src={displayLogo}
                alt={t('錦源傳統肉乾肉絲專賣官方徽章', 'Jin Yuan Official Seal')}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-xs sm:text-sm font-bold tracking-[0.26em] text-[#EED584] uppercase mb-3">
              EST. 1985 · CHAI LENG PARK, PENANG
            </p>

            <h1 className="font-serif-brand text-3xl sm:text-5xl lg:text-6xl font-black tracking-wide text-[#FFFBF2] leading-tight">
              {t('錦源傳統肉乾肉絲專賣', 'Jin Yuan Traditional Bak Kwa')}
            </h1>

            <p className="mt-2.5 text-sm sm:text-lg font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
              JIN YUAN TRADITIONAL ENTERPRISE
            </p>

            <p className="mt-5 font-serif-brand text-base sm:text-xl text-[#F7E8D0] tracking-wider">
              {t(
                '始於1985 · 檳城北海四十年家族傳承 · 古早味手工炭烤',
                'Est. 1985 · 40 Years of Family Heritage in Butterworth, Penang · Traditional Charcoal Grill'
              )}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => scrollToSection('story-narrative')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#EED584] via-[#D4AF37] to-[#B88E1F] text-[#360A0A] font-bold text-sm sm:text-base shadow-lg hover:brightness-105 transition cursor-pointer"
              >
                <span>{t('品讀四十年家族故事', 'Read Our 40-Year Story')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('story-media')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D4AF37]/75 bg-[#2E0707]/45 hover:bg-[#D4AF37]/15 text-[#FFF4DC] font-semibold text-sm sm:text-base transition cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#EED584]" />
                <span>{t('觀看電視專題專訪', 'Watch TV Feature')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 四大匠心工藝堅持 (Craftsmanship Highlights) */}
      <section id="story-craftsmanship" className="py-14 sm:py-20 px-4 sm:px-6 bg-[#FDF8F0] dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
            <span className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-[0.22em] text-[#8B1A1A] dark:text-[#EED584] uppercase">
              <span className="w-7 h-px bg-[#D4AF37]" />
              Craftsmanship &amp; Integrity
              <span className="w-7 h-px bg-[#D4AF37]" />
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-4xl font-black text-[#4A0E0E] dark:text-[#FFF8E7]">
              {t('四大匠心工藝堅持', 'Four Core Craft Commitments')}
            </h2>
            <p className="text-sm sm:text-base text-[#5F463D] dark:text-stone-400">
              {t(
                '歲月流轉，唯獨爐火前的守候與手藝的誠意從不妥協。每一片肉乾出爐，皆是四十年老字號對品質與人情味的鄭重承諾。',
                'Decades pass, yet our devotion before the charcoal hearth never wavers — every slice honors 40 years of sincerity and heritage.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {craftsmanshipPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.num}
                  className="group relative bg-white dark:bg-stone-900 border border-[#D4AF37]/45 dark:border-[#D4AF37]/30 rounded-2xl p-6 sm:p-7 shadow-md transition-all duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#4A0E0E]/15 dark:hover:shadow-black/50 hover:border-[#D4AF37] motion-reduce:transition-none motion-reduce:hover:transform-none flex flex-col"
                >
                  <div className="absolute top-0 left-6 right-6 h-1 rounded-b bg-gradient-to-r from-[#8B1A1A] via-[#D4AF37] to-[#8B1A1A] opacity-85 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[#8B1A1A] to-[#4A0E0E] border border-[#D4AF37] text-[#EED584] flex items-center justify-center mb-5 shadow transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md motion-reduce:group-hover:transform-none">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.16em] text-[#B88E1F] dark:text-[#D4AF37] mb-1">
                    {pillar.num}
                  </span>
                  <h3 className="font-serif-brand text-lg sm:text-xl font-black text-[#4A0E0E] dark:text-amber-100 mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[#5F463D] dark:text-stone-300 leading-relaxed">
                    {pillar.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. 我們的品牌故事 (Deeply Polished Brand Story + 2 High-Craft Story Photos) */}
      <section
        id="story-narrative"
        className="py-14 sm:py-20 px-4 sm:px-6 bg-[#F6ECE0] dark:bg-stone-900/70 border-y border-[#D4AF37]/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
            <span className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-[0.22em] text-[#8B1A1A] dark:text-[#EED584] uppercase">
              <span className="w-7 h-px bg-[#D4AF37]" />
              Our Heritage · Since 1985
              <span className="w-7 h-px bg-[#D4AF37]" />
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-4xl font-black text-[#4A0E0E] dark:text-[#FFF8E7]">
              {lang === 'zh' && settings.brandStoryTitleZh
                ? settings.brandStoryTitleZh
                : t('我們的品牌故事', 'Our Brand Story')}
            </h2>
            <p className="text-sm sm:text-base text-[#5F463D] dark:text-stone-400">
              {lang === 'zh' && settings.brandStorySubtitleZh
                ? settings.brandStorySubtitleZh
                : t(
                    '千里肉香是年味，萬變不離其宗，是一代代守護家的味道。',
                    'A thousand miles of smoky aroma carries the warmth of Chinese New Year and home.'
                  )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-[#D4AF37]/45 rounded-2xl p-6 sm:p-10 shadow-lg space-y-7">
              <div className="pb-6 border-b border-dashed border-[#8B1A1A]/20 dark:border-stone-700 space-y-3">
                <span className="inline-block font-serif-brand text-xs sm:text-sm font-bold text-[#8B1A1A] dark:text-[#EED584] tracking-widest">
                  {t('緣起 · 一九八〇年代初', 'Origins · Early 1980s')}
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#4A0E0E] dark:text-amber-100">
                  {lang === 'zh' && settings.brandStorySection1TitleZh
                    ? settings.brandStorySection1TitleZh
                    : t('一念初心，點亮小鎮新春的炭火香', 'One Spark of Curiosity That Lit Four Decades of Charcoal Fire')}
                </h3>
                <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  {lang === 'zh' && settings.brandStorySection1BodyZh
                    ? settings.brandStorySection1BodyZh
                    : t(
                        '故事的起點，藏在一份樸素卻真摯的年節記憶裡。在1980年代初的馬來西亞小鎮，創辦人王鑾嬌女士在婚後隨丈夫一同置辦年貨時，人生第一次嚐到了肉乾的焦香滋味。',
                        'Our journey began in an early-1980s Malaysian town when founder Madam Ong Luan Kiau first tasted charcoal-grilled bak kwa while shopping for Chinese New Year supplies with her husband.'
                      )}
                </p>
                <blockquote className="p-4 sm:p-5 rounded-xl bg-[#FCF5E8] dark:bg-stone-950 border border-[#D4AF37]/50 font-serif-brand text-sm sm:text-base text-[#4A0E0E] dark:text-amber-200 leading-relaxed whitespace-pre-line">
                  {lang === 'zh' && settings.brandStoryQuoteZh
                    ? settings.brandStoryQuoteZh
                    : t(
                        '「以前過年，祖父只買臘腸掛在家裡，從未見過其他年貨。直到結婚後跟著丈夫辦年貨，我才第一次知道世上有肉乾這麼香的滋味。既然家裡自己養豬，我們何不試著親手來做？」',
                        '"In my childhood, grandfather only hung traditional lap cheong at home for New Year. After marriage, tasting bak kwa for the first time sparked a thought: since we raise pigs ourselves, why not try crafting our own?"'
                      )}
                </blockquote>
                <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed">
                  {t(
                    '正是夫妻倆這句質樸的好奇與膽識，為日後的四十餘載老字號埋下了第一顆火種。',
                    'That simple curiosity and determination planted the seed for over forty years of family heritage.'
                  )}
                </p>
              </div>

              <div className="pb-6 border-b border-dashed border-[#8B1A1A]/20 dark:border-stone-700 space-y-3">
                <span className="inline-block font-serif-brand text-xs sm:text-sm font-bold text-[#8B1A1A] dark:text-[#EED584] tracking-widest">
                  {t('立業 · 一九八五年起', 'Founding · Since 1985')}
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#4A0E0E] dark:text-amber-100">
                  {lang === 'zh' && settings.brandStorySection2TitleZh
                    ? settings.brandStorySection2TitleZh
                    : t('清晨四點到午夜十二點，披星戴月的煙火歲月', 'From 4 AM Roasts to Midnight Watches Around the Hearth')}
                </h3>
                {lang === 'zh' && settings.brandStorySection2BodyZh ? (
                  <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed whitespace-pre-line">
                    {settings.brandStorySection2BodyZh}
                  </p>
                ) : (
                  <>
                    <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed">
                      {t(
                        '1985年，王鑾嬌女士與丈夫正式開啟手工製作肉乾之路，自此四十餘個春秋寒暑未曾間斷。在物資與機械尚不寬裕的年代，夫妻倆靠著一雙手，在炭火燻烤中撐起整個家的生計。',
                        'In 1985, Madam Ong Luan Kiau and her husband lit their very first charcoal grill and have never missed a season in over four decades.'
                      )}
                    </p>
                    <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed">
                      {t(
                        '每逢農曆新年前夕，便是鄭家最忙碌也最刻骨銘心的時節——凌晨四點天色未明，夫妻倆已起身趕製燒豬、燒臘並挑往巴剎開檔；收檔歸來連口氣也顧不上喘，便立即守回爐前揉肉、鋪篩、翻烤肉乾，燈火與炭影往往一直亮到午夜十二點才肯歇息。',
                        'Every Chinese New Year eve, the couple woke at 4 AM to roast crispy pork and rush to the morning market stall. Returning home, they barely paused before preparing and charcoal-roasting bak kwa until midnight.'
                      )}
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <span className="inline-block font-serif-brand text-xs sm:text-sm font-bold text-[#8B1A1A] dark:text-[#EED584] tracking-widest">
                  {t('傳承 · 兩代同心', 'Legacy · Two Generations United')}
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#4A0E0E] dark:text-amber-100">
                  {lang === 'zh' && settings.brandStorySection3TitleZh
                    ? settings.brandStorySection3TitleZh
                    : t('父母是榜樣，五名子女在爐邊長大', 'Five Children Raised Beside the Charcoal Fire')}
                </h3>
                {lang === 'zh' && settings.brandStorySection3BodyZh ? (
                  <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed whitespace-pre-line">
                    {settings.brandStorySection3BodyZh}
                  </p>
                ) : (
                  <>
                    <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed">
                      {t(
                        '性情堅毅的王鑾嬌女士，始終是全家最穩固的頂樑柱。回憶往昔，她笑中帶著感慨：「現在回頭看，也不敢相信當年自己是怎麼一竹篩一竹篩做出來的。」',
                        'Resilient and steadfast, Madam Ong served as the family anchor, smiling today as she marvels at how she once hand-pressed tray after tray from dawn till night.'
                      )}
                    </p>
                    <p className="text-sm sm:text-base text-[#2C1810] dark:text-stone-300 leading-relaxed">
                      {t(
                        '夫婦倆育有五名子女，當年無暇聘人照看，孩子們自學會走路起便穿梭在工坊之間，幫忙遞篩、拿料、打點瑣務。如今已獨當一面的二兒子鄭瑞傑（Teh Swee Keat）總想起父母被炭火燻紅的雙頰與不曾停歇的背影：「爸媽那麼辛苦，我們做孩子的自然想幫忙分擔。雖說童年起會羨慕別人過年能出門玩耍，可守在家裡一家人埋頭齊心，反而成了這輩子最難忘的年味。」',
                        'Raising five children inside the family workshop, each child began helping around the trays as soon as they could walk. Second son Teh Swee Keat recalls: "Seeing how hard our parents worked, we naturally stepped in to share the load—and working side by side became our warmest festive bond."'
                      )}
                    </p>
                  </>
                )}
              </div>

              <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-[#4A0E0E] to-[#8B1A1A] border border-[#D4AF37] text-[#FFF7E8] shadow-md">
                <p className="font-serif-brand text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {lang === 'zh' && settings.brandStoryClosingZh
                    ? settings.brandStoryClosingZh
                    : t(
                        '四十餘載爐火不息，時光雖移，唯有對家的牽掛與對古早味的敬畏始終如一。每一片「錦源」肉乾，承載的不只是傳統炭烤的微焦蜜香，更是王鑾嬌夫婦與五名兒女同心協力的堅守——讓您在入口的那一刻，品嚐到最溫暖的家的味道。',
                        'For over forty years the embers have never gone cold. Every slice of Jin Yuan bak kwa carries not just smoky honey glaze, but the enduring dedication of a whole family preserving the taste of home.'
                      )}
                </p>
              </div>
            </div>

            {/* Right Column: 2 High-Craft Story Photo Frames */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <figure className="bg-white dark:bg-stone-900 p-3.5 pb-5 rounded-2xl border-2 border-[#D4AF37] shadow-lg">
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#2E0707]">
                  <img
                    src={workshopImg}
                    alt={t('錦源老師傅守在炭爐前手工翻烤肉乾', 'Master artisan grilling bak kwa over glowing wood charcoal')}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <figcaption className="pt-4 px-2 text-center">
                  <strong className="block font-serif-brand text-base sm:text-lg text-[#4A0E0E] dark:text-amber-200 mb-1">
                    {lang === 'zh' && settings.brandStoryWorkshopTitleZh
                      ? settings.brandStoryWorkshopTitleZh
                      : t('爐火旁的四十年堅守', '40 Years by the Glowing Charcoal Hearth')}
                  </strong>
                  <span className="block text-xs sm:text-sm text-[#5F463D] dark:text-stone-400">
                    {lang === 'zh' && settings.brandStoryWorkshopCaptionZh
                      ? settings.brandStoryWorkshopCaptionZh
                      : t(
                          '老師傅守在紅彤彤的木炭火塘前逐網細烤，以數十年如一日的手溫延續古早焦香。',
                          'Hand-turned patiently over glowing embers to seal rich smoky aroma into every slice.'
                        )}
                  </span>
                </figcaption>
              </figure>

              <figure className="bg-white dark:bg-stone-900 p-3.5 pb-5 rounded-2xl border-2 border-[#D4AF37] shadow-lg">
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#2E0707]">
                  <img
                    src={heritageImg}
                    alt={t('竹篩炭烤肉乾與天然香料及新春紅金禮盒', 'Handcrafted bak kwa on woven bamboo trays with natural spices and CNY gift boxes')}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <figcaption className="pt-4 px-2 text-center">
                  <strong className="block font-serif-brand text-base sm:text-lg text-[#4A0E0E] dark:text-amber-200 mb-1">
                    {lang === 'zh' && settings.brandStoryHeritageTitleZh
                      ? settings.brandStoryHeritageTitleZh
                      : t('兩代同心 · 守護家的味道', 'Two Generations United · Taste of Home')}
                  </strong>
                  <span className="block text-xs sm:text-sm text-[#5F463D] dark:text-stone-400">
                    {lang === 'zh' && settings.brandStoryHeritageCaptionZh
                      ? settings.brandStoryHeritageCaptionZh
                      : t(
                          '嚴選天然香料配搭紅金年節禮盒，用厚實蜜汁肉香牽起幾代馬來西亞華人的團圓記憶。',
                          'Crafted with whole natural spices and heirloom glaze for cherished family reunions.'
                        )}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 媒體專題報導與影音專訪 (Media & Press Feature) */}
      <section
        id="story-media"
        className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-[#4A0E0E] to-[#330808] text-[#FDF8F0] border-b-4 border-[#D4AF37]"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-[0.22em] text-[#EED584] uppercase">
              <span className="w-7 h-px bg-[#D4AF37]" />
              Media &amp; Press Spotlight
              <span className="w-7 h-px bg-[#D4AF37]" />
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-4xl font-black text-[#FFF9EC]">
              {t('媒體專題報導與影音專訪', 'Media Spotlights & Video Documentary')}
            </h2>
            <p className="text-sm sm:text-base text-[#E7D5C0]">
              {t(
                '四十載腳踏實地的古法手藝，先後獲馬來西亞權威電視新聞雜誌與主流華文報章深入走訪，記錄屬於檳城北海柴楞公園的傳奇年味。',
                'Four decades of authentic charcoal craft captured by Malaysia’s leading television broadcast and national Chinese press.'
              )}
            </p>
          </div>

          {/* 4.1 YouTube 影音專訪嵌入 */}
          <div className="bg-white/[0.05] border border-[#D4AF37]/55 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.14em] text-[#EED584] uppercase">
              <Tv className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>{t('Astro AEC 電視專題專訪 · 實景紀錄片', 'Astro AEC TV Feature · On-Site Documentary')}</span>
            </div>
            <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#FFFBF2]">
              {t(
                'Astro AEC《八點最熱報》專題專訪 —— 檳城肉乾家族三十餘年來的堅持',
                'Astro AEC《Evening Edition》Feature — A Penang Bak Kwa Family’s 30+ Year Dedication'
              )}
            </h3>
            <p className="text-xs sm:text-sm text-[#E6D3BD] leading-relaxed">
              {t(
                '跟隨《八點最熱報》鏡頭走進檳城北海柴楞公園工坊，親眼見證紅彤彤炭火上的快手翻烤，聆聽王鑾嬌女士與二兒子鄭瑞傑娓娓道出兩代人守護傳統年味的動人歷程。',
                'Step inside our Chai Leng Park workshop with Astro AEC’s cameras as Madam Ong Luan Kiau and second son Teh Swee Keat share how two generations keep wood-charcoal bak kwa alive.'
              )}
            </p>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[#D4AF37]/50 bg-[#140303] shadow-xl">
              <iframe
                src={YOUTUBE_EMBED_URL}
                title={t('Astro AEC《八點最熱報》專題專訪 —— 錦源傳統肉乾', 'Astro AEC Feature - Jin Yuan Bak Kwa')}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </div>

          {/* 4.2 電視採訪紀實 + 4.3 東方日報全版專訪 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* 電視採訪紀實卡片 */}
            <article className="bg-[#FDF8F0] dark:bg-stone-900 text-[#2C1810] dark:text-stone-100 border-2 border-[#D4AF37] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <button
                type="button"
                onClick={() =>
                  setLightboxMedia({
                    src: MEDIA_TV_INTERVIEW_IMG,
                    title: t(
                      'Astro AEC《八點最熱報》深入錦源工坊採訪實況',
                      'Astro AEC Evening Edition On-Site Workshop Filming'
                    ),
                  })
                }
                className="relative aspect-[16/10] bg-[#2C0707] overflow-hidden border-b-2 border-[#D4AF37] group cursor-zoom-in text-left"
              >
                <img
                  src={MEDIA_TV_INTERVIEW_IMG}
                  alt={t('八點最熱報採訪錦源工坊與全體員工合照', 'Astro Evening Edition filming Jin Yuan bak kwa workshop and team photo')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute right-3.5 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37] bg-[#2E0707]/90 text-[#EED584] text-xs font-bold shadow">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{t('點擊放大查看', 'Zoom Photo')}</span>
                </span>
              </button>

              <div className="p-6 sm:p-7 flex-1 flex flex-col">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-[#8B1A1A] dark:text-[#EED584] uppercase mb-2">
                  <Tv className="w-3.5 h-3.5" />
                  <span>{t('TV INTERVIEW · 八點最熱報-採訪紀實', 'TV INTERVIEW · EVENING EDITION')}</span>
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#4A0E0E] dark:text-amber-100 mb-3 leading-snug">
                  {t('深入工坊實景記錄 · 採訪接班人與全體團隊', 'Inside the Workshop · Interviewing Our Successor & Team')}
                </h3>
                <p className="text-sm text-[#5F463D] dark:text-stone-300 leading-relaxed mb-4">
                  {t(
                    '攝製團隊親臨「錦源」工作坊貼身拍攝傳統鮮肉醃製與製餅工序，專訪接棒家業的二兒子鄭瑞傑（Teh Swee Keat），並在極具老字號風貌的店門牌匾下，與全體辛勤趕工的團隊成員留下珍貴合影。',
                    'The television crew filmed marinating and preparation up close inside our Chai Leng Park shop, interviewed second-generation successor Teh Swee Keat, and posed with the full Jin Yuan team under our classic signboard.'
                  )}
                </p>
                <div className="mt-auto pt-3.5 border-t border-[#8B1A1A]/15 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-[#8B1A1A] dark:text-[#EED584]">
                  <span>{t('製作過程直擊 · 二代訪談 · 門前合影', 'Production · Interview · Team Photo')}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMedia({
                        src: MEDIA_TV_INTERVIEW_IMG,
                        title: t(
                          'Astro AEC《八點最熱報》深入錦源工坊採訪實況',
                          'Astro AEC Evening Edition On-Site Workshop Filming'
                        ),
                      })
                    }
                    className="underline underline-offset-4 hover:text-[#4A0E0E] dark:hover:text-white cursor-pointer"
                  >
                    {t('查看大圖', 'View Full Photo')}
                  </button>
                </div>
              </div>
            </article>

            {/* 東方日報全版專訪卡片 */}
            <article className="bg-[#FDF8F0] dark:bg-stone-900 text-[#2C1810] dark:text-stone-100 border-2 border-[#D4AF37] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <button
                type="button"
                onClick={() =>
                  setLightboxMedia({
                    src: MEDIA_ORIENTAL_DAILY_IMG,
                    title: t(
                      '2018年2月15日《東方日報》除夕特刊深度專訪版面',
                      'Oriental Daily Feb 15, 2018 CNY Eve Two-Page Feature'
                    ),
                  })
                }
                className="relative aspect-[16/10] bg-[#2C0707] overflow-hidden border-b-2 border-[#D4AF37] group cursor-zoom-in text-left"
              >
                <img
                  src={MEDIA_ORIENTAL_DAILY_IMG}
                  alt={t('2018年2月15日東方日報全版報導：全家趕製肉乾 千里肉香是年味', 'Oriental Daily full-page press feature on Jin Yuan Bak Kwa')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute right-3.5 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37] bg-[#2E0707]/90 text-[#EED584] text-xs font-bold shadow">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{t('放大閱讀全文', 'Zoom Newspaper')}</span>
                </span>
              </button>

              <div className="p-6 sm:p-7 flex-1 flex flex-col">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-[#8B1A1A] dark:text-[#EED584] uppercase mb-2">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>{t('ORIENTAL DAILY · 2018年2月15日 除夕特刊', 'ORIENTAL DAILY · FEB 15, 2018 CNY EVE EDITION')}</span>
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-[#4A0E0E] dark:text-amber-100 mb-3 leading-snug">
                  {t('《全家趕製肉乾 · 千里肉香是年味》', '"Family Crafting Bak Kwa · A Thousand Miles of Festive Aroma"')}
                </h3>
                <p className="text-sm text-[#5F463D] dark:text-stone-300 leading-relaxed mb-4">
                  {t(
                    '《東方日報》大篇幅專訪以《爐火從早燒到晚 · 萬變不離其宗 守護家的味道》為題，細述王鑾嬌女士與丈夫自1985年起白手興家，及鄭家二代齊心堅守家庭式手工肉乾、拒絕量產代工的老字號風骨。',
                    'Oriental Daily’s double-page CNY Eve feature ("From Dawn to Night Over the Hearth — Preserving Home Flavor") highlights Madam Ong’s founding years since 1985 and the family’s commitment to hands-on small-batch charcoal roasting.'
                  )}
                </p>
                <div className="mt-auto pt-3.5 border-t border-[#8B1A1A]/15 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-[#8B1A1A] dark:text-[#EED584]">
                  <span>{t('支援點擊全版高清放大閱讀', 'Click to Zoom High-Resolution Press Spread')}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxMedia({
                        src: MEDIA_ORIENTAL_DAILY_IMG,
                        title: t(
                          '2018年2月15日《東方日報》除夕特刊深度專訪版面',
                          'Oriental Daily Feb 15, 2018 CNY Eve Two-Page Feature'
                        ),
                      })
                    }
                    className="underline underline-offset-4 hover:text-[#4A0E0E] dark:hover:text-white cursor-pointer"
                  >
                    {t('高清看報', 'Read Press Spread')}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Footer Brand Information & Official Links */}
      <footer id="story-footer" className="bg-[#250606] text-[#F4E6CE] pt-14 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-9 pb-10 border-b border-[#D4AF37]/25">
            <div>
              <h3 className="font-serif-brand text-2xl font-black text-[#FFFBF2] mb-1">
                {t('錦源傳統肉乾肉絲專賣', 'Jin Yuan Traditional Bak Kwa')}
              </h3>
              <p className="text-xs tracking-[0.18em] text-[#D4AF37] uppercase mb-4">
                JIN YUAN TRADITIONAL ENTERPRISE
              </p>
              <p className="text-sm text-[#DEC8AF] leading-relaxed">
                {t(
                  '始於1985年，立足馬來西亞檳城北海柴楞公園（Chai Leng Park）四十餘載。以一爐木炭餘溫、一門兩代手藝，守護馬來西亞華人代代相傳的新春團圓味。',
                  'Established in 1985 in Chai Leng Park, Prai, Penang. Two generations tending wood-charcoal hearths to preserve treasured Chinese New Year flavors.'
                )}
              </p>
            </div>

            <div>
              <h4 className="font-serif-brand text-base font-bold text-[#EED584] pb-2.5 mb-4 border-b border-[#D4AF37]/25">
                {t('工坊地址與聯絡專線', 'Workshop Address & Hotline')}
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#FFF7E8] mb-0.5">
                      {t('傳統手工工坊 / 門市地址', 'Workshop & Storefront Address')}
                    </strong>
                    <span>29, Medan Kurau 1, Chai Leng Park, 13600 Perai, Pulau Pinang.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#FFF7E8] mb-0.5">
                      {t('聯絡電話', 'Contact Numbers')}
                    </strong>
                    <a href="tel:0124947842" className="hover:text-[#EED584] underline-offset-4 hover:underline">
                      012-494 7842
                    </a>
                    <span className="mx-2 text-[#D4AF37]">/</span>
                    <a href="tel:01129163398" className="hover:text-[#EED584] underline-offset-4 hover:underline">
                      011-2916 3398
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif-brand text-base font-bold text-[#EED584] pb-2.5 mb-4 border-b border-[#D4AF37]/25">
                {t('官方平台與選購入口', 'Official Links & Shop')}
              </h4>
              <div className="space-y-2.5">
                <a
                  href={OFFICIAL_FB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#EED584] to-[#D4AF37] text-[#360A0A] font-bold text-sm hover:brightness-105 transition shadow"
                >
                  <span>{t('錦源 Facebook 官方專頁', 'Jin Yuan Official Facebook Page')}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>

                <a
                  href={OFFICIAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#D4AF37]/50 bg-[#8B1A1A]/35 hover:bg-[#D4AF37]/15 text-[#FFF7E7] font-semibold text-sm transition"
                >
                  <span>{t('訪問錦源原有官方檔案網站', 'Visit Original Jin Yuan Archive Site')}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                </a>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onBackToStore}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8E7] text-xs font-bold transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#EED584]" />
                    <span>{t('立即下單選購', 'Shop Now')}</span>
                  </button>

                  <a
                    href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                      t('您好！我想了解更多錦源肉乾的故事與訂購詳情。', 'Hello! I would like to learn more about Jin Yuan Bak Kwa orders.')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{t('WhatsApp 諮詢', 'WhatsApp')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-6">
            <SocialFollowLinks darkSurface />
            <p className="text-center text-xs text-[#B99D82]">
              © {new Date().getFullYear()} {t('錦源傳統肉乾肉絲專賣 JIN YUAN TRADITIONAL ENTERPRISE. 保留所有權利。', 'JIN YUAN TRADITIONAL ENTERPRISE. All Rights Reserved.')}
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal for Newspaper & TV Interview High-Res Zoom */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-[#120303]/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxMedia.title}
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="w-full max-w-5xl max-h-[92vh] flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 text-[#FFF8E7]">
              <h4 className="font-serif-brand text-sm sm:text-lg font-bold text-[#EED584]">
                {lightboxMedia.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                aria-label={t('關閉大圖', 'Close Lightbox')}
                className="w-10 h-10 rounded-full border border-[#D4AF37] bg-[#4A0E0E] hover:bg-[#8B1A1A] text-white flex items-center justify-center cursor-pointer shrink-0 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto rounded-xl border-2 border-[#D4AF37] bg-[#1A0404] max-h-[calc(92vh-72px)] flex justify-center">
              <img
                src={lightboxMedia.src}
                alt={lightboxMedia.title}
                className="max-h-[calc(92vh-80px)] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
