import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Menu,
  X,
  Globe,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  Flame,
  MapPin
} from 'lucide-react';
import { CartItem, StoreProduct, StoreSettings } from '../../types/store';
import {
  OFFICIAL_LOGO_URL,
  IMG_BAKKWA_SLICES,
  IMG_BAKKWA_CHARCOAL,
  IMG_WORKSHOP_CHARCOAL,
  IMG_HERITAGE_TRAYS,
  IMG_FLOSS,
  IMG_ROAST_MEATS,
  IMG_ROAST_POULTRY,
  IMG_COOKIES_TARTS,
  IMG_CNY_BISCUITS,
  IMG_LAPCHEONG,
  IMG_ZONGZI,
  IMG_MOONCAKE
} from '../../utils/productImages';
import { useLanguage } from '../../context/LanguageContext';

type NavKey = 'story' | 'bakkwa' | 'roast' | 'floss' | 'cookies' | 'cured' | 'seasonal' | 'contact';

interface PreviewPhotoCard {
  id: string;
  imageUrl: string;
  titleZh: string;
  titleEn: string;
  captionZh?: string;
  captionEn?: string;
  product?: StoreProduct;
}

interface NavSectionMeta {
  key: NavKey;
  labelZh: string;
  labelEn: string;
  eyebrowEn: string;
  headingZh: string;
  headingEn: string;
  subtitleZh: string;
  subtitleEn: string;
  ctaZh: string;
  ctaEn: string;
}

interface StoreNavbarProps {
  cartItems: CartItem[];
  settings: StoreSettings;
  products?: StoreProduct[];
  onOpenCart: () => void;
  onOpenStory: () => void;
  onSelectCategory?: (category: string) => void;
  onQuickViewProduct?: (product: StoreProduct) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const NAV_SECTIONS: NavSectionMeta[] = [
  {
    key: 'story',
    labelZh: '四十載品牌誌',
    labelEn: 'Heritage Story',
    eyebrowEn: 'PENANG HERITAGE · EST. 1985',
    headingZh: '四十載爐火傳承 · 家族手作風骨',
    headingEn: 'Four Decades of Charcoal Craft & Family Devotion',
    subtitleZh: '自 1985 年王鑾嬌女士與丈夫點起第一口炭爐，兩代人堅守鮮肉慢烤與媒體專訪實錄。',
    subtitleEn: 'From Madam Ong Luan Kiau’s first 1985 charcoal hearth to a second-generation Penang landmark.',
    ctaZh: '品讀完整品牌誌',
    ctaEn: 'Read Full Chronicle',
  },
  {
    key: 'bakkwa',
    labelZh: '古法炭烤肉乾',
    labelEn: 'Charcoal Bak Kwa',
    eyebrowEn: 'SIGNATURE CHARCOAL ROAST',
    headingZh: '古法炭烤肉乾珍饈',
    headingEn: 'Master-Grilled Charcoal Bak Kwa',
    subtitleZh: '每日嚴選鮮切豬腿與雞胸精肉，天然香料醃製後守候炭火慢烤，油亮多汁。',
    subtitleEn: 'Daily fresh cuts marinated in heirloom spices and master-roasted over glowing charcoal.',
    ctaZh: '瀏覽炭烤肉乾系列',
    ctaEn: 'Explore Bak Kwa',
  },
  {
    key: 'roast',
    labelZh: '御品燒豬燒臘',
    labelEn: 'Roast Specialties',
    eyebrowEn: 'DAWN HEARTH ROASTERY',
    headingZh: '御品脆皮燒豬與傳統燒臘',
    headingEn: 'Crispy Roast Pork, Duck & Ceremonial Whole Pig',
    subtitleZh: '清晨炭火出爐，皮酥化脆、肉質豐腴鮮甜，亦備節慶拜神全豬預訂。',
    subtitleEn: 'Crackling golden skin roasted fresh each morning, alongside ceremonial whole-pig bookings.',
    ctaZh: '瀏覽燒臘熟食系列',
    ctaEn: 'Explore Roast Meats',
  },
  {
    key: 'floss',
    labelZh: '金絲香酥肉鬆',
    labelEn: 'Crispy Floss',
    eyebrowEn: 'GOLDEN CRISPY FLOSS',
    headingZh: '金絲特脆香酥肉鬆',
    headingEn: 'Artisanal Crispy Pork & Chicken Floss',
    subtitleZh: '精肉細拆絲後小火慢焙至金黃蓬鬆，入口酥香化渣，居家佐餐送禮皆宜。',
    subtitleEn: 'Slow-toasted to golden crisp perfection — a timeless pantry classic for family meals & gifting.',
    ctaZh: '瀏覽香酥肉鬆系列',
    ctaEn: 'Explore Meat Floss',
  },
  {
    key: 'cookies',
    labelZh: '匠心手作年餅',
    labelEn: 'Artisan Cookies',
    eyebrowEn: 'FESTIVE PASTRY & TREATS',
    headingZh: '匠心古早手作年餅茶點',
    headingEn: 'Handcrafted Traditional Cookies & Rolls',
    subtitleZh: '杏仁餅、花生餅、黃金鳳梨酥與香脆雞絲卷，承載馬來西亞華人年節茶香記憶。',
    subtitleEn: 'Melt-in-the-mouth almond cookies, pineapple tarts & crispy floss rolls baked in small batches.',
    ctaZh: '瀏覽年餅小吃系列',
    ctaEn: 'Explore Cookies',
  },
  {
    key: 'cured',
    labelZh: '古早陳年臘味',
    labelEn: 'Cured Meats',
    eyebrowEn: 'ROSE WINE CURED SELECTION',
    headingZh: '古法陳釀手工臘腸與臘肉',
    headingEn: 'Rose Wine Lap Cheong & Traditional Cured Belly',
    subtitleZh: '精選玫瑰露酒與天然腸衣灌製風乾，備普通臘腸、特製臘腸、豬肝腸及傳統臘肉。',
    subtitleEn: 'Air-dried cured sausages infused with aromatic rose wine, liver sausages & cured pork belly.',
    ctaZh: '瀏覽手工臘味系列',
    ctaEn: 'Explore Cured Meats',
  },
  {
    key: 'seasonal',
    labelZh: '歲時節慶典藏',
    labelEn: 'Seasonal Limited',
    eyebrowEn: 'DRAGON BOAT & MID-AUTUMN',
    headingZh: '歲時節慶典藏限定',
    headingEn: 'Dragon Boat Zongzi & Mid-Autumn Mooncakes',
    subtitleZh: '端午限定古早五香鹹肉粽（RM 11）與中秋手工烘焙傳統月餅（RM 15）。',
    subtitleEn: 'Savory Five-Spice Bak Chang (RM 11) and traditional hand-baked Mooncakes (RM 15).',
    ctaZh: '前往節慶典藏專區',
    ctaEn: 'View Seasonal Specials',
  },
  {
    key: 'contact',
    labelZh: '老店門市雅址',
    labelEn: 'Penang Store',
    eyebrowEn: 'CHAI LENG PARK · BUTTERWORTH',
    headingZh: '檳城柴楞公園老店門市自取',
    headingEn: 'Chai Leng Park Flagship Workshop & Pickup',
    subtitleZh: '29, Medan Kurau 1, Taman Chai Leng · 每日 8:00 AM – 10:00 PM 新鮮供應並寄送全馬。',
    subtitleEn: 'Visit our Penang workshop for fresh pickup or order nationwide vacuum-sealed delivery.',
    ctaZh: '查看門市與聯絡方式',
    ctaEn: 'View Store Info',
  },
];

export const StoreNavbar: React.FC<StoreNavbarProps> = ({
  cartItems,
  settings,
  products = [],
  onOpenCart,
  onOpenStory,
  onSelectCategory,
  onQuickViewProduct,
}) => {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<NavKey | null>(null);
  const [mobilePreviewKey, setMobilePreviewKey] = useState<NavKey>('bakkwa');

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) =>
      acc +
      (item.selectedPrice !== undefined ? item.selectedPrice : item.product.price) *
        item.quantity,
    0
  );

  // Build dynamic 3-photo preview cards per nav category using live product data + heritage imagery
  const previewGalleryMap = useMemo<Record<NavKey, PreviewPhotoCard[]>>(() => {
    const pickCategoryCards = (
      category: StoreProduct['category'],
      fallbackCards: PreviewPhotoCard[]
    ): PreviewPhotoCard[] => {
      const matched = products.filter((p) => p.category === category).slice(0, 3);
      if (matched.length === 0) return fallbackCards;
      return matched.map((p) => ({
        id: p.id,
        imageUrl: p.image || fallbackCards[0]?.imageUrl || IMG_BAKKWA_SLICES,
        titleZh: p.nameZh,
        titleEn: p.nameEn,
        captionZh: `RM ${p.price.toLocaleString()} · ${p.unitWeight}`,
        captionEn: `RM ${p.price.toLocaleString()} · ${p.unitWeight}`,
        product: p,
      }));
    };

    return {
      story: [
        {
          id: 'story-tv',
          imageUrl: '/assets/aistudio/IMG_1721_ad5f503b.jpg',
          titleZh: 'Astro《八點最熱報》專題專訪',
          titleEn: 'Astro AEC Documentary Feature',
          captionZh: '兩代同心 · 實景記錄製作工藝',
          captionEn: 'Two Generations · Workshop Feature',
        },
        {
          id: 'story-hearth',
          imageUrl: IMG_WORKSHOP_CHARCOAL,
          titleZh: '古法炭爐 · 老師傅看火慢烤',
          titleEn: 'Charcoal Hearth Craftsmanship',
          captionZh: '始於 1985 · 四十年爐火不熄',
          captionEn: 'Est. 1985 · 40 Years Strong',
        },
        {
          id: 'story-heritage',
          imageUrl: IMG_HERITAGE_TRAYS,
          titleZh: '天然香料醃製 · 真空鎖鮮禮贈',
          titleEn: 'Heirloom Spices & Vacuum Freshness',
          captionZh: '無人工添加 · 純粹古早年味',
          captionEn: 'Natural Spices · Vacuum Packed',
        },
      ],
      bakkwa: pickCategoryCards('bakkwa', [
        {
          id: 'bak-1',
          imageUrl: IMG_BAKKWA_SLICES,
          titleZh: '原味豬肉乾（經典主打）',
          titleEn: 'Signature Original Pork Bak Kwa',
          captionZh: '250g RM 35 起',
          captionEn: 'From RM 35 / 250g',
        },
        {
          id: 'bak-2',
          imageUrl: IMG_BAKKWA_CHARCOAL,
          titleZh: '炭爐慢烤 · 原味雞肉乾',
          titleEn: 'Original Chicken Bak Kwa',
          captionZh: '老師傅守爐現烤',
          captionEn: 'Charcoal Grilled Fresh',
        },
        {
          id: 'bak-3',
          imageUrl: IMG_HERITAGE_TRAYS,
          titleZh: '迷你肉乾 & 吉祥造型系列',
          titleEn: 'Mini & Auspicious Shaped Bak Kwa',
          captionZh: '送禮體面首選',
          captionEn: 'Festive Gifting Choice',
        },
      ]),
      roast: pickCategoryCards('roast', [
        {
          id: 'roast-1',
          imageUrl: IMG_ROAST_MEATS,
          titleZh: '脆皮燒肉 & 傳統蜜汁叉燒',
          titleEn: 'Crispy Roast Pork & Char Siu',
          captionZh: '每日清晨新鮮出爐',
          captionEn: 'Fresh Morning Roast',
        },
        {
          id: 'roast-2',
          imageUrl: IMG_ROAST_POULTRY,
          titleZh: '金牌燒雞 & 脆皮燒鴨',
          titleEn: 'Roast Chicken & Crispy Duck',
          captionZh: '半隻 / 全隻任選',
          captionEn: 'Half / Whole Available',
        },
        {
          id: 'roast-3',
          imageUrl: IMG_WORKSHOP_CHARCOAL,
          titleZh: '節慶拜神炭火大燒豬',
          titleEn: 'Ceremonial Whole Roast Pig',
          captionZh: '半條 / 一條禮訂',
          captionEn: 'Half / Whole Pre-Order',
        },
      ]),
      floss: pickCategoryCards('floss', [
        {
          id: 'floss-1',
          imageUrl: IMG_FLOSS,
          titleZh: '傳統豬肉鬆（特脆口感）',
          titleEn: 'Traditional Crispy Pork Floss',
          captionZh: '90g / 180g / 300g',
          captionEn: '90g / 180g / 300g',
        },
        {
          id: 'floss-2',
          imageUrl: IMG_FLOSS,
          titleZh: '傳統雞肉鬆（特脆口感）',
          titleEn: 'Traditional Crispy Chicken Floss',
          captionZh: 'RM 12 起',
          captionEn: 'From RM 12',
        },
        {
          id: 'floss-3',
          imageUrl: IMG_HERITAGE_TRAYS,
          titleZh: '禮盒罐裝 · 鮮香酥脆不膩',
          titleEn: 'Gift Jar Freshly Sealed',
          captionZh: '佐粥吐司佳品',
          captionEn: 'Sealed Golden Crisp',
        },
      ]),
      cookies: pickCategoryCards('cookies', [
        {
          id: 'cook-1',
          imageUrl: IMG_CNY_BISCUITS,
          titleZh: '古早杏仁餅 & 花生餅',
          titleEn: 'Almond & Peanut Cookies',
          captionZh: '每罐 RM 28',
          captionEn: 'RM 28 / Jar',
        },
        {
          id: 'cook-2',
          imageUrl: IMG_COOKIES_TARTS,
          titleZh: '手作黃金鳳梨酥',
          titleEn: 'Golden Pineapple Tarts',
          captionZh: '每盒 RM 28',
          captionEn: 'RM 28 / Box',
        },
        {
          id: 'cook-3',
          imageUrl: IMG_CNY_BISCUITS,
          titleZh: '香脆肉鬆雞絲卷',
          titleEn: 'Crispy Chicken Floss Rolls',
          captionZh: '每罐 RM 29',
          captionEn: 'RM 29 / Jar',
        },
      ]),
      cured: pickCategoryCards('cured', [
        {
          id: 'cured-1',
          imageUrl: IMG_LAPCHEONG,
          titleZh: '玫瑰露臘腸 & 特製臘腸',
          titleEn: 'Rose Wine & Special Lap Cheong',
          captionZh: '500g 起訂 · 酒香濃郁',
          captionEn: 'Min 500g · Rose Wine Aroma',
        },
        {
          id: 'cured-2',
          imageUrl: IMG_LAPCHEONG,
          titleZh: '古法豬肝腸 & 普通臘腸',
          titleEn: 'Liver & Classic Pork Sausage',
          captionZh: '按克數新鮮秤重',
          captionEn: 'Custom Weight Fresh Cut',
        },
        {
          id: 'cured-3',
          imageUrl: IMG_ROAST_MEATS,
          titleZh: '傳統風乾臘肉',
          titleEn: 'Traditional Cured Pork Belly',
          captionZh: '肥瘦相間鹹香入味',
          captionEn: 'Rich Savory Heirloom Cure',
        },
      ]),
      seasonal: pickCategoryCards('seasonal', [
        {
          id: 'seas-1',
          imageUrl: IMG_ZONGZI,
          titleZh: '端午限定：古早五香肉粽',
          titleEn: 'Dragon Boat: Five-Spice Zongzi',
          captionZh: 'RM 11 / 粒',
          captionEn: 'RM 11 / pc',
        },
        {
          id: 'seas-2',
          imageUrl: IMG_MOONCAKE,
          titleZh: '中秋限定：傳統手工月餅',
          titleEn: 'Mid-Autumn: Traditional Mooncake',
          captionZh: 'RM 15 / 粒 · 三款口味',
          captionEn: 'RM 15 / pc · 3 Flavors',
        },
        {
          id: 'seas-3',
          imageUrl: IMG_HERITAGE_TRAYS,
          titleZh: '佳節手工限量製作',
          titleEn: 'Handcrafted Seasonal Batches',
          captionZh: '嚴選食材傳統秘方',
          captionEn: 'Heirloom Holiday Recipes',
        },
      ]),
      contact: [
        {
          id: 'loc-1',
          imageUrl: '/assets/aistudio/IMG_1721_ad5f503b.jpg',
          titleZh: '檳城北海柴楞公園老店',
          titleEn: 'Chai Leng Park Flagship Store',
          captionZh: '29, Medan Kurau 1',
          captionEn: '29, Medan Kurau 1',
        },
        {
          id: 'loc-2',
          imageUrl: IMG_BAKKWA_CHARCOAL,
          titleZh: '每日炭火現烤 · 8AM–10PM',
          titleEn: 'Grilled Fresh Daily · 8AM–10PM',
          captionZh: '門市自取免等候',
          captionEn: 'Fresh Pickup Available',
        },
        {
          id: 'loc-3',
          imageUrl: OFFICIAL_LOGO_URL,
          titleZh: '全馬獨立真空郵寄服務',
          titleEn: 'Nationwide Vacuum Courier',
          captionZh: '滿 RM 300 免運費',
          captionEn: 'Free Shipping > RM 300',
        },
      ],
    };
  }, [products]);

  const navigateToSection = (key: NavKey) => {
    setHoveredKey(null);
    setMobileMenuOpen(false);

    if (key === 'story') {
      onOpenStory();
      return;
    }
    if (key === 'contact') {
      const el = document.getElementById('store-contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (onSelectCategory) {
      onSelectCategory(key);
    }
    const targetId = key === 'seasonal' ? 'seasonal-specials' : 'store-products';
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePhotoCardClick = (key: NavKey, card: PreviewPhotoCard) => {
    if (card.product && onQuickViewProduct) {
      setHoveredKey(null);
      setMobileMenuOpen(false);
      onQuickViewProduct(card.product);
      return;
    }
    navigateToSection(key);
  };

  const activeDesktopSection = hoveredKey
    ? NAV_SECTIONS.find((s) => s.key === hoveredKey) || null
    : null;

  const activeMobileSection =
    NAV_SECTIONS.find((s) => s.key === mobilePreviewKey) || NAV_SECTIONS[1];

  return (
    <header
      className="sticky top-0 z-30 bg-stone-50/98 dark:bg-stone-950/98 backdrop-blur-md border-b border-amber-500/25 shadow-sm transition-colors no-print"
      onMouseLeave={() => setHoveredKey(null)}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 sm:h-22 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Big Logo and Brand Sign */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <a href="#" className="flex items-center gap-2 sm:gap-3.5 group min-w-0">
            <div className="relative shrink-0">
              <img
                src={settings?.logoUrl || OFFICIAL_LOGO_URL}
                alt="錦源 Jin Yuan"
                className="w-10 h-10 sm:w-15 sm:h-15 rounded-full object-cover border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform duration-200 bg-stone-950"
              />
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <span className="font-serif-brand text-xl sm:text-3xl font-black tracking-wider text-red-950 dark:text-red-100 leading-none group-hover:text-red-800 transition-colors whitespace-nowrap">
                {lang === 'en' ? 'JIN YUAN' : '錦源'}
              </span>
              <span className="hidden sm:block text-[11px] tracking-[0.18em] text-amber-800 dark:text-amber-400 font-extrabold uppercase mt-1 whitespace-nowrap">
                {lang === 'en'
                  ? 'CHARCOAL BAK KWA · EST. 1985'
                  : '古法炭烤肉乾 · 始於一九八五'}
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Desktop Heritage Editorial Navigation Links (Hover triggers visual photo gallery) */}
        <nav
          className="hidden xl:flex items-center gap-5 text-[13.5px] font-serif-brand font-bold text-stone-800 dark:text-stone-200"
          aria-label={t('主導覽列', 'Main Navigation')}
        >
          {NAV_SECTIONS.map((item) => {
            const isHovered = hoveredKey === item.key;
            const isStory = item.key === 'story';
            const isSeasonal = item.key === 'seasonal';
            return (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setHoveredKey(item.key)}
                onFocus={() => setHoveredKey(item.key)}
                onClick={() => navigateToSection(item.key)}
                className={`relative py-2 tracking-wide transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isHovered
                    ? 'text-red-800 dark:text-amber-300'
                    : isStory
                    ? 'text-red-900 dark:text-amber-200'
                    : isSeasonal
                    ? 'text-amber-800 dark:text-amber-400'
                    : 'hover:text-red-800 dark:hover:text-amber-300'
                }`}
              >
                {isStory && <BookOpen className="w-3.5 h-3.5 text-red-800 dark:text-amber-400 shrink-0" />}
                <span>{lang === 'en' ? item.labelEn : item.labelZh}</span>
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-red-800 via-amber-500 to-red-800 transition-transform duration-200 origin-center ${
                    isHovered ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher + Cart + Mobile Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div
            className="flex items-center bg-stone-200/90 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl p-0.5 text-[11px] sm:text-xs font-bold"
            role="group"
            aria-label="Language switch"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500 ml-1.5 mr-1 hidden sm:block" />
            <button
              type="button"
              onClick={() => setLang('zh')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                lang === 'zh'
                  ? 'bg-red-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              中
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-red-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap border border-amber-400/40"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span className="hidden sm:inline">{t('購物袋', 'Bag')}</span>
            <span className="px-1.5 py-0.5 text-[11px] sm:text-xs font-mono font-black bg-amber-400 text-stone-950 rounded-full">
              {totalItemCount}
            </span>
            {subtotal > 0 && (
              <span className="hidden lg:inline text-xs font-mono text-amber-200 font-bold border-l border-red-700 pl-2">
                RM {subtotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label={t('開啟導覽與照片預覽', 'Toggle menu and photo preview')}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Hover Heritage Lookbook Preview Bar */}
      {activeDesktopSection && (
        <div className="hidden xl:block border-t border-amber-500/20 bg-[#FDF8F0]/98 dark:bg-stone-950/98 backdrop-blur-md shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-12 gap-6 items-center">
            {/* Editorial Copy Column */}
            <div className="col-span-4 space-y-2.5 pr-4 border-r border-stone-200/80 dark:border-stone-800">
              <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-red-800 dark:text-amber-400">
                {activeDesktopSection.eyebrowEn}
              </div>
              <h3 className="font-serif-brand text-xl font-black text-stone-900 dark:text-amber-50 leading-snug">
                {lang === 'en' ? activeDesktopSection.headingEn : activeDesktopSection.headingZh}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {lang === 'en' ? activeDesktopSection.subtitleEn : activeDesktopSection.subtitleZh}
              </p>
              <button
                type="button"
                onClick={() => navigateToSection(activeDesktopSection.key)}
                className="inline-flex items-center gap-1.5 pt-1 text-xs font-black text-red-800 dark:text-amber-300 hover:text-red-600 cursor-pointer transition-colors"
              >
                <span>{lang === 'en' ? activeDesktopSection.ctaEn : activeDesktopSection.ctaZh}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Curated Photo Preview Cards */}
            <div className="col-span-8 grid grid-cols-3 gap-4">
              {previewGalleryMap[activeDesktopSection.key].map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handlePhotoCardClick(activeDesktopSection.key, card)}
                  className="group/photo text-left rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-amber-500/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-200 dark:bg-stone-800">
                    <img
                      src={card.imageUrl}
                      alt={lang === 'en' ? card.titleEn : card.titleZh}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between gap-2">
                      <span className="font-serif-brand text-xs font-bold text-amber-50 line-clamp-1 drop-shadow-xs">
                        {lang === 'en' ? card.titleEn : card.titleZh}
                      </span>
                    </div>
                  </div>
                  {(card.captionZh || card.captionEn) && (
                    <div className="px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                      <span className="truncate font-mono tabular-nums">
                        {lang === 'en' ? card.captionEn : card.captionZh}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-800 dark:text-amber-400 shrink-0" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu with Tap-to-Preview Real Photo Gallery */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#FDF8F0] dark:bg-stone-950 border-b border-amber-500/25 px-3.5 py-4 space-y-4 shadow-2xl max-h-[82vh] overflow-y-auto">
          {/* Interactive Category Grid (Tap any zone to preview its real photos right below) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-stone-500 dark:text-stone-400 px-1">
              <span>{t('點選專區即時預覽實拍照片', 'Tap Any Zone to Preview Photos')}</span>
              <span className="font-serif-brand text-red-800 dark:text-amber-300">
                {lang === 'en' ? activeMobileSection.labelEn : activeMobileSection.labelZh}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-serif-brand font-bold">
              {NAV_SECTIONS.map((item) => {
                const isSelected = mobilePreviewKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMobilePreviewKey(item.key)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-900 text-amber-50 border-red-900 shadow-sm'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-800'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {item.key === 'story' && <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-85" />}
                      {item.key === 'bakkwa' && <Flame className="w-3.5 h-3.5 shrink-0 opacity-85" />}
                      {item.key === 'seasonal' && <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-85" />}
                      {item.key === 'contact' && <MapPin className="w-3.5 h-3.5 shrink-0 opacity-85" />}
                      <span className="truncate">{lang === 'en' ? item.labelEn : item.labelZh}</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-stone-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Tap-Activated Photo Preview Strip for Mobile */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-amber-500/35 p-3 space-y-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-red-800 dark:text-amber-400">
                  {activeMobileSection.eyebrowEn}
                </div>
                <h4 className="font-serif-brand text-sm font-black text-stone-900 dark:text-amber-50 truncate">
                  {lang === 'en' ? activeMobileSection.headingEn : activeMobileSection.headingZh}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => navigateToSection(activeMobileSection.key)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-amber-100 text-[11px] font-black cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>{lang === 'en' ? 'Go' : '前往'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {previewGalleryMap[activeMobileSection.key].map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handlePhotoCardClick(activeMobileSection.key, card)}
                  className="text-left rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 cursor-pointer active:scale-95 transition"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={card.imageUrl}
                      alt={lang === 'en' ? card.titleEn : card.titleZh}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-1.5">
                    <div className="font-serif-brand text-[10px] font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                      {lang === 'en' ? card.titleEn : card.titleZh}
                    </div>
                    {(card.captionZh || card.captionEn) && (
                      <div className="text-[9px] font-mono text-red-800 dark:text-amber-300 truncate">
                        {lang === 'en' ? card.captionEn : card.captionZh}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <span>{t('檳城柴楞公園老店 · Medan Kurau 1', 'Chai Leng Park, Penang')}</span>
            <button
              type="button"
              onClick={() => navigateToSection('contact')}
              className="text-red-800 dark:text-amber-300 font-bold underline cursor-pointer"
            >
              {t('門市與聯絡資訊 ➔', 'Contact & Store ➔')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
