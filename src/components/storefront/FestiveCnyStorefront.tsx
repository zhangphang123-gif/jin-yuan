import React, { useState, useMemo } from 'react';
import { StoreProduct, CartItem, StoreSettings, BannerSlide } from '../../types/store';
import { HeroBannerSlider } from './HeroBannerSlider';
import { ProductImageCarousel } from './ProductImageCarousel';
import { ProductDetailModal } from './ProductDetailModal';
import { FloatingCartWidget } from './FloatingCartWidget';
import { SocialFollowLinks } from './SocialFollowLinks';
import { useLanguage, getCategoryLabel } from '../../context/LanguageContext';
import { OFFICIAL_LOGO_URL, IMG_ZONGZI, IMG_MOONCAKE } from '../../utils/productImages';
import { formatDisplayPhone, formatTelHref, formatWhatsAppPhone } from '../../utils/whatsapp';
import {
  CategoryFilterOption,
  MeatFilterOption,
  ProductSortOption,
  SHAPED_BAKKWA_OPTIONS,
  ShapeSubFilter,
  getMeatLabel,
  inferProductMeatTag,
  isShapedBakKwa,
  matchesProductFilters,
  matchesShapeSubFilter,
  resolveStoreCategories,
  sortCatalogProducts,
} from '../../utils/productFilters';
import {
  Search,
  ShoppingBag,
  Plus,
  Check,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageCircle,
  BookOpen,
  AlertCircle,
  RotateCcw,
  LayoutDashboard,
  Sparkles,
  Flame,
  Gift,
  Truck,
} from 'lucide-react';

import cnyBanquetImg from '../../assets/images/cny_festive_banquet_hero_1794982522087.jpg';
import cnyHamperImg from '../../assets/images/cny_imperial_gift_hamper_1794982523395.jpg';

interface FestiveCnyStorefrontProps {
  products: StoreProduct[];
  cartItems: CartItem[];
  settings: StoreSettings;
  isLoadingProducts?: boolean;
  onAddToCart: (product: StoreProduct, selectedWeight?: string, selectedPrice?: number) => void;
  onOpenCart: () => void;
  onSwitchToAdmin: () => void;
  onOpenStory: () => void;
}

export const FestiveCnyStorefront: React.FC<FestiveCnyStorefrontProps> = ({
  products,
  cartItems,
  settings,
  isLoadingProducts = false,
  onAddToCart,
  onOpenCart,
  onSwitchToAdmin,
  onOpenStory,
}) => {
  const { lang, setLang, t } = useLanguage();

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [banquetImgFailed, setBanquetImgFailed] = useState(false);
  const [hamperImgFailed, setHamperImgFailed] = useState(false);
  const [zongziImgFailed, setZongziImgFailed] = useState(false);
  const [mooncakeImgFailed, setMooncakeImgFailed] = useState(false);

  // Full catalog filtering state
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('all');
  const [selectedShape, setSelectedShape] = useState<ShapeSubFilter>('all');
  const [selectedMeat, setSelectedMeat] = useState<MeatFilterOption>('all');
  const [sortBy, setSortBy] = useState<ProductSortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, { spec: string; price: number }>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'jy-seasonal-mooncake': '豆沙口味',
  });
  const [highlightMissingSpecId, setHighlightMissingSpecId] = useState<string | null>(null);

  const storeCategories = resolveStoreCategories(settings);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const freeThreshold = settings.freeShippingThreshold || 300;
  const whatsappClean = formatWhatsAppPhone(settings.whatsappNumber || '60124947842');
  const whatsappInquiryUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    t('您好王女士！我想諮詢錦源新年年貨、吉祥造型肉乾與企業禮盒團購。', 'Hello Jin Yuan! I would like to inquire about CNY gift hampers and bulk orders.')
  )}`;

  // Ensure Monumental Hero Banner uses admin bannerSlides, enhanced with CNY festive banquet lead if no custom pure-image slides exist
  const festiveBannerSlides = useMemo<BannerSlide[]>(() => {
    const activeAdminSlides = (settings.bannerSlides || []).filter((s) => s.active !== false);
    if (activeAdminSlides.length > 0) {
      return activeAdminSlides;
    }
    return [
      {
        id: 'cny-festive-lead',
        title: '駿馬迎春 · 四十年古法炭烤肉乾年禮',
        titleEn: 'Imperial Lunar New Year · 40-Year Charcoal Heritage',
        subtitle: '檳城柴楞公園老字號每日現烤 · 獨立真空送禮禮盒 · 滿 RM 300 全馬免運配送',
        subtitleEn: 'Fresh charcoal-grilled daily in Penang · Vacuum-sealed gifting packs · Free MY delivery RM 300+',
        imageUrl: cnyBanquetImg,
        badge: '🏮 新春賀歲珍饈',
        badgeEn: '🏮 CNY Heritage Edition',
        ctaText: '挑選新年年貨',
        ctaTextEn: 'Shop CNY Collection',
        ctaAction: 'products',
        active: true,
      },
    ];
  }, [settings.bannerSlides]);

  const categoryTabs: { id: CategoryFilterOption; labelZh: string; labelEn: string }[] = useMemo(() => {
    const list: { id: CategoryFilterOption; labelZh: string; labelEn: string }[] = [
      { id: 'all', labelZh: '全部年貨', labelEn: 'All' },
    ];
    let insertedShaped = false;
    storeCategories.forEach((cat) => {
      list.push({ id: cat.id, labelZh: cat.labelZh, labelEn: cat.labelEn });
      if (cat.id === 'bakkwa') {
        list.push({ id: 'shaped', labelZh: '吉祥造型肉乾', labelEn: 'Shaped Bak Kwa' });
        insertedShaped = true;
      }
    });
    if (!insertedShaped) {
      list.splice(1, 0, { id: 'shaped', labelZh: '吉祥造型肉乾', labelEn: 'Shaped Bak Kwa' });
    }
    return list;
  }, [storeCategories]);

  const filteredByCriteria = products.filter((p) =>
    matchesProductFilters(p, selectedMeat, selectedCategory, searchQuery, inStockOnly, selectedShape)
  );
  const filteredProducts =
    sortBy === 'price_asc'
      ? [...filteredByCriteria].sort((a, b) => a.price - b.price)
      : sortBy === 'price_desc'
      ? [...filteredByCriteria].sort((a, b) => b.price - a.price)
      : sortCatalogProducts(filteredByCriteria);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedShape('all');
    setSelectedMeat('all');
    setSortBy('featured');
    setInStockOnly(false);
    setSearchQuery('');
  };

  const handleSelectCategory = (cat: CategoryFilterOption) => {
    setSelectedCategory(cat);
    if (cat !== 'shaped') setSelectedShape('all');
    if (cat === 'seasonal' && selectedMeat !== 'all' && selectedMeat !== 'seasonal') {
      setSelectedMeat('all');
    } else if (cat !== 'seasonal' && cat !== 'all' && selectedMeat === 'seasonal') {
      setSelectedMeat('all');
    } else if (cat === 'all' && selectedMeat === 'seasonal') {
      setSelectedMeat('all');
    }
  };

  const handleSelectMeat = (meat: MeatFilterOption) => {
    setSelectedMeat(meat);
    if (meat === 'seasonal') {
      setSelectedCategory('seasonal');
      setSelectedShape('all');
    } else if (selectedCategory === 'seasonal') {
      setSelectedCategory('all');
      setSelectedShape('all');
    }
  };

  const handleSelectWeight = (productId: string, spec: { spec: string; price: number }) => {
    setSelectedSpecs((prev) => ({ ...prev, [productId]: spec }));
    if (highlightMissingSpecId === productId) setHighlightMissingSpecId(null);
  };

  const handleSelectVariant = (productId: string, variantZh: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantZh }));
    if (highlightMissingSpecId === productId) setHighlightMissingSpecId(null);
  };

  const handleAdd = (product: StoreProduct) => {
    const hasSpecs = Boolean(product.specs && product.specs.length > 0);
    const hasVariants = Boolean(product.variantOptions && product.variantOptions.length > 0);
    const currentSpec = selectedSpecs[product.id];
    const currentVariant = selectedVariants[product.id];

    if ((hasSpecs && !currentSpec) || (hasVariants && !currentVariant)) {
      setHighlightMissingSpecId(product.id);
      setTimeout(() => setHighlightMissingSpecId(null), 2600);
      return;
    }

    const baseUnit = currentSpec ? currentSpec.spec : product.unitWeight;
    const finalWeightLabel = currentVariant ? `${baseUnit} · ${currentVariant}` : baseUnit;
    const finalPrice = currentSpec ? currentSpec.price : product.price;

    onAddToCart(product, finalWeightLabel, finalPrice);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const zongziProduct: StoreProduct = products.find((p) => p.id === 'jy-seasonal-zongzi') || {
    id: 'jy-seasonal-zongzi',
    sku: 'JY-SN-01',
    nameZh: '端午節限定供應：【五香肉粽】',
    nameEn: 'Dragon Boat Special: Five-Spice Bak Chang (Pork Zongzi)',
    category: 'seasonal',
    categoryLabelZh: '節慶限定',
    meatType: 'seasonal',
    price: 11,
    stock: 120,
    unitWeight: '1 粒',
    image: IMG_ZONGZI,
    descriptionZh: '傳統古早味五香鹹肉粽，餡料飽滿鹹香，僅限每年端午節期間限定推出。',
    descriptionEn: 'Traditional savory five-spice Bak Chang packed with braised pork belly, mushrooms & chestnuts.',
    hasWeightOptions: false,
  };

  const mooncakeProduct: StoreProduct = products.find((p) => p.id === 'jy-seasonal-mooncake') || {
    id: 'jy-seasonal-mooncake',
    sku: 'JY-SN-02',
    nameZh: '中秋節限定供應：【傳統月餅】',
    nameEn: 'Mid-Autumn Special: Traditional Baked Mooncake',
    category: 'seasonal',
    categoryLabelZh: '節慶限定',
    meatType: 'seasonal',
    price: 15,
    stock: 120,
    unitWeight: '1 粒',
    image: IMG_MOONCAKE,
    descriptionZh: '傳統手工烘焙中秋月餅，皮薄餡足，可選口味：豆沙口味、肉鬆口味、蓮蓉蛋黃口味。',
    descriptionEn: 'Hand-baked Mid-Autumn mooncakes in Red Bean, Meat Floss, or Lotus Paste with Egg Yolk.',
    hasWeightOptions: false,
    variantOptionLabelZh: '選擇月餅口味',
    variantOptionLabelEn: 'Select Mooncake Flavor',
    variantOptions: ['豆沙口味', '肉鬆口味', '蓮蓉蛋黃口味'],
    variantOptionsEn: ['Red Bean Paste', 'Crispy Meat Floss', 'Lotus Paste & Yolk'],
  };

  const mooncakeVariants = mooncakeProduct.variantOptions || ['豆沙口味', '肉鬆口味', '蓮蓉蛋黃口味'];
  const mooncakeVariantsEn = mooncakeProduct.variantOptionsEn || ['Red Bean Paste', 'Crispy Meat Floss', 'Lotus Paste & Yolk'];
  const selectedMooncakeFlavor = selectedVariants[mooncakeProduct.id] || '豆沙口味';

  const topNotice =
    settings.promoAnnouncements?.[0] ||
    settings.announcementText ||
    t(
      `新春年禮熱烈預訂中 · 全馬滿 RM ${freeThreshold} 即享免運費直送府上`,
      `Lunar New Year Pre-Orders Open · Free Malaysia Shipping Over RM ${freeThreshold}`
    );

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-[#211715] flex flex-col font-sans selection:bg-[#7A1215] selection:text-[#FBF7F0]">
      {/* Slim Dismissible Imperial Crimson Announcement Bar */}
      {!announcementDismissed && topNotice && (
        <div className="bg-[#580A0D] text-[#F9E8C4] text-[11px] sm:text-xs py-1.5 px-4 border-b border-[#D4AF37]/30 no-print">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            <span className="font-mono tracking-widest text-[#E3BE6A] hidden sm:inline shrink-0">
              EST. 1985 · 恭賀新禧
            </span>
            <p className="truncate text-center flex-1 font-medium tracking-wide">{topNotice}</p>
            <button
              type="button"
              onClick={() => setAnnouncementDismissed(true)}
              className="text-[#F9E8C4]/70 hover:text-white cursor-pointer shrink-0 p-0.5"
              aria-label={t('關閉公告', 'Dismiss notice')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Contract: 3 Clean Zones (Logo | 5 Nav Links | Lang + Bag CTA) */}
      <header className="sticky top-0 z-30 bg-[#FBF7F0]/95 backdrop-blur-md border-b border-[#DFD2BC] no-print">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Festive Seal & Wordmark */}
          <a href="#" className="flex items-center gap-3 shrink-0 group">
            <img
              src={settings.logoUrl || OFFICIAL_LOGO_URL}
              alt="錦源 Jin Yuan"
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#C69736] shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-serif-brand text-xl sm:text-2xl font-black tracking-[0.14em] text-[#6D0F14] whitespace-nowrap">
              {lang === 'en' ? 'JIN YUAN' : '錦源 · JIN YUAN'}
            </span>
          </a>

          {/* Zone 2: Concise Single-Line Navigation */}
          <nav
            className="hidden lg:flex items-center gap-8 text-[13.5px] font-serif-brand font-bold text-[#4A3834]"
            aria-label={t('主導覽列', 'Main Navigation')}
          >
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('bakkwa');
                scrollToSection('cny-catalog');
              }}
              className="hover:text-[#7A1215] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('炭烤肉乾', 'Charcoal Bak Kwa')}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('shaped');
                scrollToSection('cny-catalog');
              }}
              className="hover:text-[#7A1215] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('吉祥造型', 'Auspicious Shapes')}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('cookies');
                scrollToSection('cny-catalog');
              }}
              className="hover:text-[#7A1215] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('新春年餅', 'CNY Cookies')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('cny-seasonal')}
              className="hover:text-[#7A1215] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('歲時節慶', 'Seasonal Editions')}
            </button>
            <button
              type="button"
              onClick={onOpenStory}
              className="hover:text-[#B47D18] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('四十載物語', 'Heritage 1985')}
            </button>
          </nav>

          {/* Zone 3: Language Toggle + Primary Imperial Crimson Bag CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center text-xs font-mono border border-[#DFD2BC] rounded-md overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`px-2.5 py-1.5 cursor-pointer transition ${
                  lang === 'zh' ? 'bg-[#7A1215] text-[#F9E8C4] font-bold' : 'text-[#665852] hover:text-[#211715]'
                }`}
              >
                中
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1.5 cursor-pointer transition ${
                  lang === 'en' ? 'bg-[#7A1215] text-[#F9E8C4] font-bold' : 'text-[#665852] hover:text-[#211715]'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#7A1215] hover:bg-[#580A0D] text-[#FBF7F0] text-xs sm:text-[13px] font-bold tracking-wide transition cursor-pointer border border-[#D4AF37]/50 shadow-sm whitespace-nowrap shrink-0"
              aria-label={t('開啟年貨袋', 'Open Shopping Bag')}
            >
              <ShoppingBag className="w-4 h-4 text-[#E3BE6A]" />
              <span className="hidden sm:inline">{t('年貨袋', 'Bag')}</span>
              <span className="font-mono tabular-nums text-[#E3BE6A]">({totalItemCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md border border-[#DFD2BC] text-[#211715] hover:bg-[#F3ECE0] cursor-pointer"
              aria-label={t('開啟選單', 'Toggle Menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DFD2BC] bg-[#FBF7F0] px-4 py-4 space-y-2 text-sm font-serif-brand font-bold">
            {[
              { label: t('全場年貨大目錄', 'Full CNY Catalog'), action: () => scrollToSection('cny-catalog') },
              { label: t('古法炭烤豬 / 雞肉乾', 'Charcoal Bak Kwa'), action: () => { handleSelectCategory('bakkwa'); scrollToSection('cny-catalog'); } },
              { label: t('吉祥造型迎春肉乾', 'Auspicious Shaped Bak Kwa'), action: () => { handleSelectCategory('shaped'); scrollToSection('cny-catalog'); } },
              { label: t('新春手工鳳梨酥＆年餅', 'Artisan CNY Cookies'), action: () => { handleSelectCategory('cookies'); scrollToSection('cny-catalog'); } },
              { label: t('歲時節慶限定點心', 'Seasonal Exclusives'), action: () => scrollToSection('cny-seasonal') },
              { label: t('錦源四十載品牌傳奇', '1985 Heritage Story'), action: () => { setMobileMenuOpen(false); onOpenStory(); } },
              { label: t('檳城柴楞公園門市自取', 'Penang Flagship Store'), action: () => scrollToSection('cny-contact') },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={item.action}
                className="w-full text-left py-2.5 px-3 rounded-md hover:bg-[#F3ECE0] flex items-center justify-between text-[#211715] cursor-pointer"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-[#B47D18]" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* SECTION 1: MONUMENTAL WIDESCREEN HERO BANNER (Noticeably Larger Showcase!) */}
      <section className="bg-gradient-to-b from-[#580A0D] via-[#6D0F14] to-[#FBF7F0] pt-3 sm:pt-6 pb-8 sm:pb-12">
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-8 space-y-5 sm:space-y-7">
          {/* Oversized / Grand HeroBannerSlider preserving pure-image & overlay modes */}
          <div className="rounded-2xl sm:rounded-3xl ring-2 ring-[#D4AF37]/50 shadow-2xl overflow-hidden">
            <HeroBannerSlider
              slides={festiveBannerSlides}
              heroBannerUrl={cnyBanquetImg}
              autoRotateSeconds={settings.bannerAutoRotateSeconds}
              grand={true}
              onSelectCategory={(cat) => {
                handleSelectCategory(cat as CategoryFilterOption);
                scrollToSection('cny-catalog');
              }}
              onOpenStory={onOpenStory}
            />
          </div>

          {/* Auspicious Festive Banquet Strip & Key Trust Specs (Clean architectural bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Festive Editorial Card 1 */}
            <div className="lg:col-span-6 bg-white border border-[#DFD2BC] rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 shadow-sm hover:border-[#C69736] transition">
              <div className="sm:col-span-5 aspect-[16/10] sm:aspect-auto bg-[#F3ECE0] overflow-hidden">
                {!banquetImgFailed ? (
                  <img
                    src={cnyBanquetImg}
                    alt={t('新春炭烤肉乾圍爐盛宴', 'Lunar New Year Charcoal Bak Kwa Platter')}
                    referrerPolicy="no-referrer"
                    onError={() => setBanquetImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#580A0D] text-[#E3BE6A]">
                    <Flame className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#7A1215] font-bold">
                    {t('賀歲團圓首選 · 1985', 'FESTIVE SIGNATURE · EST. 1985')}
                  </div>
                  <h2 className="font-serif-brand text-lg sm:text-xl font-black text-[#211715] mt-1">
                    {t('古法炭火現烤 · 團圓紅火味', 'Hand-Grilled Charcoal Bak Kwa')}
                  </h2>
                  <p className="text-xs text-[#665852] mt-1.5 leading-relaxed">
                    {t(
                      '嚴選新鮮上等豬腿與雞肉，每日老師傅守爐慢烤，油亮紅潤最添新年喜氣。',
                      'Marinated in heirloom spices and roasted over live charcoal daily for Lunar New Year celebrations.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory('bakkwa');
                    scrollToSection('cny-catalog');
                  }}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-[#7A1215] hover:text-[#B47D18] cursor-pointer"
                >
                  <span>{t('挑選招牌炭烤肉乾', 'Shop Charcoal Bak Kwa')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Festive Editorial Card 2 */}
            <div className="lg:col-span-6 bg-white border border-[#DFD2BC] rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 shadow-sm hover:border-[#C69736] transition">
              <div className="sm:col-span-5 aspect-[16/10] sm:aspect-auto bg-[#F3ECE0] overflow-hidden">
                {!hamperImgFailed ? (
                  <img
                    src={cnyHamperImg}
                    alt={t('新春紅金體面送禮禮盒', 'Imperial Red & Gold CNY Gift Hampers')}
                    referrerPolicy="no-referrer"
                    onError={() => setHamperImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#580A0D] text-[#E3BE6A]">
                    <Gift className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#B47D18] font-bold">
                    {t('體面拜年禮贈 · 企業團購', 'GIFTING & CORPORATE HAMPERS')}
                  </div>
                  <h2 className="font-serif-brand text-lg sm:text-xl font-black text-[#211715] mt-1">
                    {t('吉祥造型肉乾 ＆ 年餅禮盒', 'Auspicious Shapes & Artisan Cookies')}
                  </h2>
                  <p className="text-xs text-[#665852] mt-1.5 leading-relaxed">
                    {t(
                      '金錢、元寶、兔子、老虎等造型肉乾配搭黃金黃梨酥與肉鬆，送禮體面大方。',
                      'Gold coin & ingot shaped bak kwa paired with hand-baked pineapple tarts and crispy floss.'
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCategory('shaped');
                      scrollToSection('cny-catalog');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A1215] hover:text-[#B47D18] cursor-pointer"
                  >
                    <span>{t('瀏覽造型肉乾', 'View Shaped Bak Kwa')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCategory('cookies');
                      scrollToSection('cny-catalog');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#665852] hover:text-[#7A1215] cursor-pointer"
                  >
                    <span>{t('瀏覽年餅系列', 'View Cookies')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Trust Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-semibold text-[#4A3834]">
            <div className="bg-white/90 border border-[#DFD2BC] rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#7A1215] shrink-0" />
              <span className="truncate">{t('40年古法炭火現烤', '40-Yr Charcoal Grill')}</span>
            </div>
            <div className="bg-white/90 border border-[#DFD2BC] rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#B47D18] shrink-0" />
              <span className="truncate">{t('獨立真空鎖鮮衛生包裝', 'Vacuum Sealed Fresh')}</span>
            </div>
            <div className="bg-white/90 border border-[#DFD2BC] rounded-lg px-3.5 py-2.5 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#7A1215] shrink-0" />
              <span className="truncate">{t(`滿 RM ${freeThreshold} 全馬免運`, `Free MY Delivery > RM${freeThreshold}`)}</span>
            </div>
            <button
              type="button"
              onClick={onOpenStory}
              className="bg-white/90 hover:bg-[#7A1215] hover:text-[#F9E8C4] border border-[#DFD2BC] rounded-lg px-3.5 py-2.5 flex items-center gap-2 transition cursor-pointer text-left"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('閱讀 1985 錦源品牌誌', 'Read 1985 Heritage Story')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: IMPERIAL CNY PRODUCT CATALOG */}
      <section id="cny-catalog" className="py-10 sm:py-14 flex-1">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-7">
          {/* Editorial Catalog Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A1215] font-bold">
                IMPERIAL FESTIVE CATALOG · 新春年貨全目錄
              </div>
              <h2 className="font-serif-brand text-2xl sm:text-4xl font-black text-[#211715] text-balance">
                {t('錦源新春年貨與炭烤珍饈', 'Jin Yuan Festive Collection')}
              </h2>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#665852]">
              <span>
                {lang === 'en' ? `${filteredProducts.length} ITEMS` : `共 ${filteredProducts.length} 款佳節好味`}
              </span>
              {(selectedMeat !== 'all' || selectedCategory !== 'all' || selectedShape !== 'all' || searchQuery.trim() || inStockOnly) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[#7A1215] hover:text-[#B47D18] underline cursor-pointer font-sans font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('重置全部', 'Reset')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Hairline Gold-Accented Filter Toolbar */}
          <div className="border-y border-[#DFD2BC] py-4 space-y-4 bg-white/70 px-3 sm:px-5 rounded-xl">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-none border-b border-[#DFD2BC]/70 pb-2.5">
              {categoryTabs.map((c) => {
                const isActive = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.id)}
                    className={`pb-1.5 text-xs sm:text-sm font-serif-brand font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'text-[#7A1215] border-b-2 border-[#7A1215]'
                        : 'text-[#665852] hover:text-[#211715]'
                    }`}
                  >
                    {lang === 'en' ? c.labelEn : c.labelZh}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(
                  [
                    { id: 'all', label: t('全部口味', 'All') },
                    { id: 'pork', label: t('豬肉系列', 'Pork') },
                    { id: 'chicken', label: t('雞肉系列', 'Chicken') },
                    { id: 'duck', label: t('燒鴨燒臘', 'Duck') },
                    { id: 'cookies', label: t('手工年餅', 'Cookies') },
                    { id: 'seasonal', label: t('節慶限定', 'Seasonal') },
                  ] as { id: MeatFilterOption; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMeat(m.id)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-bold transition cursor-pointer ${
                      selectedMeat === m.id
                        ? 'bg-[#7A1215] text-[#F9E8C4] border-[#7A1215]'
                        : 'bg-[#FBF7F0] text-[#4A3834] border-[#DFD2BC] hover:border-[#7A1215]/50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}

                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#665852] cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#7A1215] cursor-pointer"
                  />
                  <span>{t('僅看現貨', 'In Stock Only')}</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative min-w-[220px] sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#8A7B73] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('搜尋肉乾、造型、肉鬆、黃梨酥...', 'Search bak kwa, cookies, floss...')}
                    className="w-full pl-8.5 pr-3 py-2 text-xs bg-[#FBF7F0] border border-[#DFD2BC] rounded-md text-[#211715] placeholder-[#8A7B73] focus:outline-none focus:border-[#7A1215]"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                  aria-label={t('商品排序', 'Sort products')}
                  className="px-3 py-2 text-xs bg-[#FBF7F0] border border-[#DFD2BC] rounded-md text-[#211715] font-semibold focus:outline-none focus:border-[#7A1215] cursor-pointer"
                >
                  <option value="featured">{t('精選熱銷排序', 'Featured Order')}</option>
                  <option value="price_asc">{t('價格由低到高', 'Price: Low → High')}</option>
                  <option value="price_desc">{t('價格由高到低', 'Price: High → Low')}</option>
                </select>
              </div>
            </div>

            {selectedCategory === 'shaped' && (
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#DFD2BC]/60">
                <span className="text-[11px] font-bold text-[#7A1215] mr-1">
                  {t('吉祥造型挑選：', 'Select Auspicious Shape:')}
                </span>
                {SHAPED_BAKKWA_OPTIONS.map((shape) => {
                  const count =
                    shape.id === 'all'
                      ? products.filter((p) => isShapedBakKwa(p)).length
                      : products.filter((p) => matchesShapeSubFilter(p, shape.id)).length;
                  const active = selectedShape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => setSelectedShape(shape.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-[#7A1215] text-[#F9E8C4] border-[#7A1215]'
                          : 'bg-[#FBF7F0] text-[#4A3834] border-[#DFD2BC] hover:border-[#7A1215]'
                      }`}
                    >
                      {shape.emoji} {t(shape.labelZh, shape.labelEn)} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3-Column Luxury Festive Product Grid */}
          {isLoadingProducts && products.length === 0 ? (
            <div className="py-16 text-center border border-[#DFD2BC] rounded-xl bg-white">
              <p className="font-serif-brand font-bold text-lg text-[#211715]">
                {t('正在載入錦源新春年貨目錄...', 'Loading Jin Yuan festive catalog...')}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 px-6 text-center border border-[#DFD2BC] rounded-xl bg-white space-y-3">
              <p className="font-serif-brand font-bold text-lg text-[#211715]">
                {t('目前篩選條件下沒有符合的年貨商品', 'No items match your current filters')}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#7A1215] text-[#F9E8C4] text-xs font-bold rounded-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('顯示全部商品', 'Show All Items')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
              {filteredProducts.map((product) => {
                const isAdded = addedIds[product.id];
                const hasSpecs = Boolean(product.specs && product.specs.length > 0);
                const hasVariants = Boolean(product.variantOptions && product.variantOptions.length > 0);
                const currentSpec = selectedSpecs[product.id];
                const currentVariant = selectedVariants[product.id];
                const currentPrice = currentSpec ? currentSpec.price : product.price;
                const isMissingSelection = highlightMissingSpecId === product.id;
                const needsSelection = (hasSpecs && !currentSpec) || (hasVariants && !currentVariant);
                const meatLabel = getMeatLabel(inferProductMeatTag(product), lang);

                return (
                  <article
                    key={product.id}
                    className={`group bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(122,18,21,0.16)] ${
                      isMissingSelection ? 'border-[#7A1215] ring-2 ring-[#7A1215]/35' : 'border-[#DFD2BC] hover:border-[#C69736]'
                    }`}
                  >
                    <div>
                      <div className="bg-[#F5EFE4] relative">
                        <ProductImageCarousel
                          product={product}
                          variant="festive"
                          onImageClick={() => setQuickViewProduct(product)}
                        />
                      </div>

                      <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#7A1215]">
                          <span className="truncate uppercase tracking-wider">
                            {getCategoryLabel(product.category, product.categoryLabelZh, lang, storeCategories)} · {meatLabel}
                          </span>
                          <span className="shrink-0 font-mono text-[#8A7B73]">
                            {currentSpec ? currentSpec.spec : product.unitWeight}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setQuickViewProduct(product)}
                          className="text-left w-full cursor-pointer block"
                        >
                          <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#211715] group-hover:text-[#7A1215] transition-colors line-clamp-1">
                            {lang === 'en' ? product.nameEn : product.nameZh}
                          </h3>
                        </button>

                        <p className="text-xs text-[#8A7B73] truncate">
                          {lang === 'en' ? product.nameZh : product.nameEn}
                        </p>

                        <p className="text-xs text-[#665852] line-clamp-2 leading-relaxed">
                          {lang === 'en' ? product.descriptionEn || product.descriptionZh : product.descriptionZh}
                        </p>

                        {/* Specs Picker */}
                        {hasSpecs && (
                          <div className="pt-3 border-t border-[#F1E8D8] space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#4A3834]">{t('規格重量：', 'Size / Weight:')}</span>
                              <span className={`font-mono font-bold ${currentSpec ? 'text-emerald-700' : 'text-[#7A1215]'}`}>
                                {currentSpec ? currentSpec.spec : t('* 請先選擇', '* Required')}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {product.specs!.map((specItem, idx) => {
                                const isSel = currentSpec?.spec === specItem.spec;
                                return (
                                  <button
                                    key={`${product.id}-cny-spec-${specItem.spec}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectWeight(product.id, specItem)}
                                    className={`py-1.5 px-1.5 rounded-md border text-center transition cursor-pointer ${
                                      isSel
                                        ? 'bg-[#7A1215] text-[#F9E8C4] border-[#7A1215] shadow-2xs'
                                        : 'bg-[#FBF7F0] text-[#211715] border-[#DFD2BC] hover:border-[#7A1215]'
                                    }`}
                                  >
                                    <div className="text-[11px] font-bold leading-tight truncate">{specItem.spec}</div>
                                    <div className="text-[10px] font-mono opacity-90 tabular-nums">
                                      RM {specItem.price.toLocaleString()}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Variant Picker */}
                        {hasVariants && (
                          <div className="pt-2.5 border-t border-[#F1E8D8] space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#4A3834]">
                                {lang === 'en' ? product.variantOptionLabelEn || 'Option' : product.variantOptionLabelZh || '選擇款式'}
                              </span>
                              <span className={`font-bold ${currentVariant ? 'text-emerald-700' : 'text-[#7A1215]'}`}>
                                {currentVariant || t('* 必選', '* Required')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {product.variantOptions!.map((optionZh, idx) => {
                                const optionEn = product.variantOptionsEn?.[idx] || optionZh;
                                const isSel = currentVariant === optionZh;
                                return (
                                  <button
                                    key={`${product.id}-cny-var-${optionZh}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelectVariant(product.id, optionZh)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                                      isSel
                                        ? 'bg-[#B47D18] text-white border-[#B47D18]'
                                        : 'bg-[#FBF7F0] text-[#211715] border-[#DFD2BC] hover:border-[#B47D18]'
                                    }`}
                                  >
                                    {lang === 'en' ? optionEn : optionZh}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {isMissingSelection && (
                          <p className="text-[11px] font-bold text-[#7A1215] flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('請先點選上方規格／款式後再加入', 'Please select required option above')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Consistent Bottom Pricing & Add Action */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-[#F1E8D8] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono tabular-nums text-xl font-black text-[#7A1215]">
                            RM {currentPrice.toLocaleString()}
                          </span>
                          {product.originalPrice && !currentSpec && (
                            <span className="font-mono text-xs text-[#8A7B73] line-through">
                              RM {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              product.stock <= 0
                                ? 'bg-red-500'
                                : product.stock <= 10
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            aria-hidden="true"
                          />
                          <span
                            className={
                              product.stock <= 0
                                ? 'text-red-600 font-bold'
                                : product.stock <= 10
                                ? 'text-amber-700 font-bold'
                                : 'text-[#665852] font-semibold'
                            }
                          >
                            {product.stock <= 0
                              ? t('暫時售完', 'Out of stock')
                              : product.stock <= 10
                              ? t(`僅剩 ${product.stock} 件`, `Only ${product.stock} left`)
                              : t(`現貨庫存：${product.stock} 件`, `In Stock: ${product.stock}`)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        className={`px-3.5 sm:px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs ${
                          isAdded
                            ? 'bg-emerald-700 text-white'
                            : needsSelection
                            ? 'bg-[#F3ECE0] text-[#580A0D] border border-[#DFD2BC] hover:bg-[#EADBC3]'
                            : 'bg-gradient-to-r from-[#7A1215] to-[#580A0D] hover:from-[#8C161A] hover:to-[#6D0F14] text-[#F9E8C4] border border-[#D4AF37]/40'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('已加入', 'Added')}</span>
                          </>
                        ) : needsSelection ? (
                          <span>{hasSpecs && !currentSpec ? t('先選規格', 'Pick Size') : t('先選款式', 'Pick Style')}</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('加入年貨袋', 'Add to Bag')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: IMPERIAL CRIMSON SEASONAL & 1985 HERITAGE BAND */}
      <section id="cny-seasonal" className="bg-gradient-to-br from-[#580A0D] via-[#711014] to-[#450709] text-[#FBF7F0] py-14 sm:py-20 border-y border-[#D4AF37]/35">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D4AF37]/25 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#E3BE6A] font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{t('歲時節慶典藏 · 四十年品牌傳承', 'SEASONAL EXCLUSIVES & 1985 HERITAGE')}</span>
              </div>
              <h2 className="font-serif-brand text-2xl sm:text-4xl font-black text-[#FBF7F0] text-balance">
                {t('端午五香肉粽 · 中秋手工月餅 ＆ 1985 傳奇故事', 'Festive Exclusives & Heritage Story')}
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenStory}
              className="px-5 py-2.5 rounded-lg bg-[#E3BE6A] hover:bg-[#D4AF37] text-[#211715] font-black text-xs sm:text-sm transition cursor-pointer inline-flex items-center gap-2 self-start md:self-auto shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('閱讀《錦源四十載品牌誌》', 'Read 1985 Brand Story')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zongzi Card */}
            <div className="bg-[#FBF7F0] text-[#211715] rounded-2xl overflow-hidden border border-[#D4AF37]/60 shadow-xl flex flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setQuickViewProduct(zongziProduct)}
                className="sm:w-5/12 aspect-[4/3] sm:aspect-auto bg-[#F3ECE0] shrink-0 overflow-hidden cursor-pointer"
              >
                {!zongziImgFailed ? (
                  <img
                    src={zongziProduct.image || IMG_ZONGZI}
                    alt={t('端午五香肉粽', 'Five-Spice Zongzi')}
                    referrerPolicy="no-referrer"
                    onError={() => setZongziImgFailed(true)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#580A0D] text-[#E3BE6A] font-serif-brand font-bold">
                    {t('五香肉粽', 'Zongzi')}
                  </div>
                )}
              </button>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A1215]">
                    {t('端午節限定 · 手工古早味', 'Dragon Boat Festival Exclusive')}
                  </div>
                  <h3 className="font-serif-brand text-xl font-black text-[#211715]">
                    {t('端午節限定：五香肉粽', 'Dragon Boat: Five-Spice Zongzi')}
                  </h3>
                  <p className="text-xs text-[#665852] leading-relaxed">
                    {t('嚴選上等五花肉、香菇與五香滷料飽滿包裹，香氣濃郁，節慶佳餚必備。', 'Traditional five-spice braised pork belly & mushroom Bak Chang wrapped by hand.')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#DFD2BC]">
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-mono tabular-nums text-2xl font-black text-[#7A1215] block leading-none">
                      RM {zongziProduct.price} <span className="text-xs font-semibold text-[#665852]">/ {t('粒', 'pc')}</span>
                    </span>
                    <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          zongziProduct.stock <= 0 ? 'bg-red-500' : zongziProduct.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={zongziProduct.stock <= 0 ? 'text-red-600 font-bold' : 'text-[#665852] font-semibold'}>
                        {zongziProduct.stock <= 0
                          ? t('暫時售完', 'Out of stock')
                          : t(`現貨庫存：${zongziProduct.stock} 粒`, `In Stock: ${zongziProduct.stock}`)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(zongziProduct)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
                      addedIds[zongziProduct.id]
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#7A1215] hover:bg-[#580A0D] text-[#F9E8C4]'
                    }`}
                  >
                    {addedIds[zongziProduct.id] ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{addedIds[zongziProduct.id] ? t('已加入', 'Added') : t('預訂五香肉粽', 'Add Zongzi')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mooncake Card */}
            <div className="bg-[#FBF7F0] text-[#211715] rounded-2xl overflow-hidden border border-[#D4AF37]/60 shadow-xl flex flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setQuickViewProduct(mooncakeProduct)}
                className="sm:w-5/12 aspect-[4/3] sm:aspect-auto bg-[#F3ECE0] shrink-0 overflow-hidden cursor-pointer"
              >
                {!mooncakeImgFailed ? (
                  <img
                    src={mooncakeProduct.image || IMG_MOONCAKE}
                    alt={t('傳統手工烘焙月餅', 'Traditional Baked Mooncake')}
                    referrerPolicy="no-referrer"
                    onError={() => setMooncakeImgFailed(true)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#580A0D] text-[#E3BE6A] font-serif-brand font-bold">
                    {t('傳統月餅', 'Mooncake')}
                  </div>
                )}
              </button>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A1215]">
                    {t('中秋節限定 · 傳統手工烘焙', 'Mid-Autumn Festival Exclusive')}
                  </div>
                  <h3 className="font-serif-brand text-xl font-black text-[#211715]">
                    {t('中秋節限定：傳統月餅', 'Mid-Autumn: Traditional Mooncake')}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mooncakeVariants.map((flavorZh, idx) => {
                      const flavorEn = mooncakeVariantsEn[idx] || flavorZh;
                      const active = selectedMooncakeFlavor === flavorZh;
                      return (
                        <button
                          key={flavorZh}
                          type="button"
                          onClick={() => handleSelectVariant(mooncakeProduct.id, flavorZh)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer ${
                            active
                              ? 'bg-[#7A1215] text-[#F9E8C4] border-[#7A1215]'
                              : 'bg-white text-[#211715] border-[#DFD2BC] hover:border-[#7A1215]'
                          }`}
                        >
                          {lang === 'en' ? flavorEn : flavorZh}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#DFD2BC]">
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-mono tabular-nums text-2xl font-black text-[#7A1215] block leading-none">
                      RM {mooncakeProduct.price} <span className="text-xs font-semibold text-[#665852]">/ {t('粒', 'pc')}</span>
                    </span>
                    <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          mooncakeProduct.stock <= 0 ? 'bg-red-500' : mooncakeProduct.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={mooncakeProduct.stock <= 0 ? 'text-red-600 font-bold' : 'text-[#665852] font-semibold'}>
                        {mooncakeProduct.stock <= 0
                          ? t('暫時售完', 'Out of stock')
                          : t(`現貨庫存：${mooncakeProduct.stock} 粒`, `In Stock: ${mooncakeProduct.stock}`)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(mooncakeProduct)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
                      addedIds[mooncakeProduct.id]
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#7A1215] hover:bg-[#580A0D] text-[#F9E8C4]'
                    }`}
                  >
                    {addedIds[mooncakeProduct.id] ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{addedIds[mooncakeProduct.id] ? t('已加入', 'Added') : t('預訂傳統月餅', 'Add Mooncake')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARCHITECTURAL FESTIVE FOOTER */}
      <footer id="cny-contact" className="bg-[#F3ECE0] border-t border-[#DFD2BC] text-[#211715] py-12 pb-28 sm:pb-14">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs sm:text-sm">
            {/* Col 1: Brand & Admin Entry */}
            <div className="space-y-4">
              <div>
                <div className="font-serif-brand font-black text-xl text-[#7A1215] tracking-wider">
                  {t('錦源 · JIN YUAN', 'JIN YUAN TRADITIONAL')}
                </div>
                <p className="text-xs text-[#665852] mt-1 leading-relaxed">
                  {t('1985 年創立於馬來西亞檳城北海柴楞公園，四十載古法炭烤肉乾與年餅老字號。', 'Established 1985 in Chai Leng Park, Penang — artisanal charcoal bak kwa & festive pastries.')}
                </p>
              </div>
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#7A1215] text-[#211715] hover:text-[#F9E8C4] border border-[#DFD2BC] text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('店長後台登入', 'Admin Dashboard')}</span>
              </button>
            </div>

            {/* Col 2: Store Address */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A1215] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{t('門市自取地址', 'Pickup Address')}</span>
              </div>
              <p className="text-xs text-[#211715] leading-relaxed">{settings.storeAddress}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#665852] font-mono">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>8:00 AM – 10:00 PM Daily</span>
              </div>
            </div>

            {/* Col 3: Direct Call, WhatsApp & Corporate Bulk Orders */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A1215]">
                {t('聯繫與年節企業團購', 'Contact & CNY Corporate Orders')}
              </div>
              <p className="text-xs font-bold text-[#211715]">{settings.contactPerson}</p>
              <div className="flex flex-col items-start gap-2">
                <a
                  href={formatTelHref(settings.whatsappNumber)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#7A1215] hover:bg-[#580A0D] text-[#F9E8C4] text-xs font-mono font-bold transition shadow-2xs touch-manipulation"
                  aria-label={t(`撥打電話 ${formatDisplayPhone(settings.whatsappNumber)}`, `Call ${formatDisplayPhone(settings.whatsappNumber)}`)}
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{formatDisplayPhone(settings.whatsappNumber)}</span>
                </a>
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-700/10 hover:bg-emerald-700/20 border border-emerald-700/25 text-xs font-mono font-bold text-emerald-800 transition touch-manipulation"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('WhatsApp 線上諮詢', 'WhatsApp Chat')}</span>
                </a>
              </div>
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#665852] hover:text-[#7A1215] font-mono break-all py-0.5 transition"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{settings.email}</span>
              </a>
            </div>

            {/* Col 4: Courier & Social */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#7A1215]">
                {t('配送與官方社群', 'Courier & Channels')}
              </div>
              <p className="text-xs text-[#665852] leading-relaxed">
                {t(
                  `全馬常溫獨立真空郵寄，訂單滿 RM ${freeThreshold} 免運費直送府上。`,
                  `Nationwide vacuum-sealed courier. Free shipping on orders RM ${freeThreshold}+.`
                )}
              </p>
              <SocialFollowLinks />
            </div>
          </div>

          <div className="pt-6 border-t border-[#DFD2BC] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#665852]">
            <span>© {new Date().getFullYear()} JIN YUAN TRADITIONAL ENTERPRISE. All Rights Reserved.</span>
            <span className="font-serif-brand font-bold text-[#7A1215]">尊榮新春賀歲版 · FESTIVE HERITAGE EDITION</span>
          </div>
        </div>
      </footer>

      {/* Shared Product Detail Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        categories={storeCategories}
        initialSpec={quickViewProduct ? selectedSpecs[quickViewProduct.id] : undefined}
        initialVariant={quickViewProduct ? selectedVariants[quickViewProduct.id] : undefined}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />

      {/* Shared Floating Cart Widget */}
      <FloatingCartWidget
        cartItems={cartItems}
        settings={settings}
        onOpenCart={onOpenCart}
      />
    </div>
  );
};
