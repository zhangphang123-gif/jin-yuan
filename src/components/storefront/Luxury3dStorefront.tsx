import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StoreProduct, CartItem, StoreSettings, BannerSlide } from '../../types/store';
import { CharcoalParticlesCanvas } from './CharcoalParticlesCanvas';
import { ProductImageCarousel } from './ProductImageCarousel';
import { ProductDetailModal } from './ProductDetailModal';
import { FloatingCartWidget } from './FloatingCartWidget';
import { SocialFollowLinks } from './SocialFollowLinks';
import { useLanguage, getCategoryLabel } from '../../context/LanguageContext';
import {
  OFFICIAL_LOGO_URL,
  IMG_BAKKWA_CHARCOAL,
  IMG_COOKIES_TARTS,
  IMG_FLOSS,
  IMG_WORKSHOP_CHARCOAL,
  IMG_BAKKWA_SLICES,
  IMG_ZONGZI,
  IMG_MOONCAKE,
} from '../../utils/productImages';
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
  ChevronLeft,
  ChevronRight,
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
  Flame,
  Gift,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface Luxury3dStorefrontProps {
  products: StoreProduct[];
  cartItems: CartItem[];
  settings: StoreSettings;
  isLoadingProducts?: boolean;
  onAddToCart: (product: StoreProduct, selectedWeight?: string, selectedPrice?: number) => void;
  onOpenCart: () => void;
  onSwitchToAdmin: () => void;
  onOpenStory: () => void;
}

const updateSpotlightCoords = (e: React.PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--spot-x', `${x}px`);
  e.currentTarget.style.setProperty('--spot-y', `${y}px`);
};

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  resetKey?: string;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = '',
  delayMs = 0,
  resetKey = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.05) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [resetKey]);

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`luxury-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const Luxury3dStorefront: React.FC<Luxury3dStorefrontProps> = ({
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

  // Image fallback guards
  const [heroImgFailed, setHeroImgFailed] = useState<Record<string, boolean>>({});
  const [cookieImgFailed, setCookieImgFailed] = useState(false);
  const [flossImgFailed, setFlossImgFailed] = useState(false);
  const [workshopImgFailed, setWorkshopImgFailed] = useState(false);
  const [zongziImgFailed, setZongziImgFailed] = useState(false);
  const [mooncakeImgFailed, setMooncakeImgFailed] = useState(false);

  // Banner slide index for pure-photo hero stage
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Full catalog filtering state (100% shared parity with Version 1)
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

  // 3D Tilt Parallax Refs (direct DOM transforms for 60fps zero-re-render tracking)
  const tiltContainerRef = useRef<HTMLDivElement | null>(null);
  const tiltImageLayerRef = useRef<HTMLDivElement | null>(null);
  const tiltGlowLayerRef = useRef<HTMLDivElement | null>(null);

  const heroSlides = useMemo<BannerSlide[]>(() => {
    const activeSlides = (settings.bannerSlides || []).filter((s) => s.active !== false);
    if (activeSlides.length > 0) return activeSlides;
    return [
      {
        id: 'luxury-hero-lead',
        title: settings.storeName,
        subtitle: settings.storeSubname,
        imageUrl: settings.heroBannerUrl || IMG_BAKKWA_CHARCOAL,
        active: true,
        imageOnly: true,
      },
    ];
  }, [settings.bannerSlides, settings.heroBannerUrl, settings.storeName, settings.storeSubname]);

  const safeSlideIdx = heroSlideIdx >= heroSlides.length ? 0 : heroSlideIdx;
  const activeHeroSlide = heroSlides[safeSlideIdx] || heroSlides[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const ms = Math.max(3000, Math.round((settings.bannerAutoRotateSeconds || 5) * 1000));
    const timer = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, ms);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, settings.bannerAutoRotateSeconds]);

  // 3D Gyroscope parallax on mobile devices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const applyTilt = (rx: number, ry: number) => {
      if (tiltContainerRef.current) {
        tiltContainerRef.current.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (tiltImageLayerRef.current) {
        tiltImageLayerRef.current.style.transform = `translate3d(${(ry * 1.8).toFixed(1)}px, ${(-rx * 1.8).toFixed(1)}px, 28px)`;
      }
      if (tiltGlowLayerRef.current) {
        tiltGlowLayerRef.current.style.transform = `translate3d(${(-ry * 2.5).toFixed(1)}px, ${(rx * 2.5).toFixed(1)}px, -12px)`;
      }
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      const ry = clamp((e.gamma / 30) * 6, -6, 6);
      const rx = clamp(((e.beta - 42) / 30) * -6, -6, 6);
      applyTilt(rx, ry);
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    return () => window.removeEventListener('deviceorientation', handleDeviceOrientation);
  }, []);

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const normY = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    const rotateY = normX * 10; // -5deg..5deg
    const rotateX = -normY * 8; // -4deg..4deg

    if (tiltContainerRef.current) {
      tiltContainerRef.current.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    }
    if (tiltImageLayerRef.current) {
      tiltImageLayerRef.current.style.transform = `translate3d(${(normX * 14).toFixed(1)}px, ${(normY * 12).toFixed(1)}px, 30px)`;
    }
    if (tiltGlowLayerRef.current) {
      tiltGlowLayerRef.current.style.transform = `translate3d(${(-normX * 20).toFixed(1)}px, ${(-normY * 18).toFixed(1)}px, -14px)`;
    }
  };

  const handleHeroPointerLeave = () => {
    if (tiltContainerRef.current) {
      tiltContainerRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    }
    if (tiltImageLayerRef.current) {
      tiltImageLayerRef.current.style.transform = 'translate3d(0px, 0px, 24px)';
    }
    if (tiltGlowLayerRef.current) {
      tiltGlowLayerRef.current.style.transform = 'translate3d(0px, 0px, -12px)';
    }
  };

  const storeCategories = resolveStoreCategories(settings);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const freeThreshold = settings.freeShippingThreshold || 300;
  const whatsappClean = formatWhatsAppPhone(settings.whatsappNumber || '60124947842');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    t('您好錦源店長！我想訂購古法炭烤肉乾與傳統年餅。', 'Hello Jin Yuan! I would like to inquire about ordering Charcoal Bak Kwa & Cookies.')
  )}`;

  const categoryTabs: { id: CategoryFilterOption; labelZh: string; labelEn: string }[] = useMemo(() => {
    const list: { id: CategoryFilterOption; labelZh: string; labelEn: string }[] = [
      { id: 'all', labelZh: '全部品項', labelEn: 'All' },
    ];
    let insertedShaped = false;
    storeCategories.forEach((cat) => {
      list.push({ id: cat.id, labelZh: cat.labelZh, labelEn: cat.labelEn });
      if (cat.id === 'bakkwa') {
        list.push({ id: 'shaped', labelZh: '造型肉乾', labelEn: 'Shaped Bak Kwa' });
        insertedShaped = true;
      }
    });
    if (!insertedShaped) {
      list.splice(1, 0, { id: 'shaped', labelZh: '造型肉乾', labelEn: 'Shaped Bak Kwa' });
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
      `年餅滿 RM 100 贈 50g 招牌酥脆肉鬆 · 全馬滿 RM ${freeThreshold} 即享真空免運直送`,
      `Free 50g Crispy Floss with RM 100 Cookies · Free Shipping Over RM ${freeThreshold}`
    );

  const filterResetKey = `${selectedCategory}-${selectedMeat}-${selectedShape}-${searchQuery}-${inStockOnly}-${sortBy}`;

  return (
    <div className="min-h-screen luxury-bg-canvas text-[#F5EDE0] flex flex-col font-sans selection:bg-[#E5B869] selection:text-[#0B0807] overflow-x-hidden">
      {/* Slim Dismissible Obsidian & Champagne Gold Notice Bar */}
      {!announcementDismissed && topNotice && (
        <div className="bg-[#0B0807]/95 backdrop-blur-md text-[#E5B869] text-[11px] sm:text-xs py-1.5 px-4 border-b border-[#E5B869]/20 no-print">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            <span className="font-mono tracking-widest text-[#E5B869]/80 hidden sm:inline shrink-0">
              EST. 1985 · 檳城古法炭烤
            </span>
            <p className="truncate text-center flex-1 font-medium text-[#F6DFA9]">{topNotice}</p>
            <button
              type="button"
              onClick={() => setAnnouncementDismissed(true)}
              className="text-[#E5B869]/70 hover:text-[#F6DFA9] cursor-pointer shrink-0 p-0.5"
              aria-label={t('關閉公告', 'Dismiss notice')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Contract: Frosted Dark Glass 3-Zone Header */}
      <header className="sticky top-0 z-30 bg-[#0B0807]/75 backdrop-blur-2xl border-b border-[#E5B869]/20 no-print">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a href="#" className="flex items-center gap-3 shrink-0 group">
            <img
              src={settings.logoUrl || OFFICIAL_LOGO_URL}
              alt="錦源 Jin Yuan"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#E5B869]/70 shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-serif-brand text-lg sm:text-xl font-bold tracking-[0.14em] text-[#F6DFA9] whitespace-nowrap shrink-0">
              {lang === 'en' ? 'JIN YUAN' : '錦源 · JIN YUAN'}
            </span>
          </a>

          {/* Zone 2: Clean Single-Line Typography Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-7 text-[13.5px] font-medium text-[#D6C7B2]"
            aria-label={t('主導覽列', 'Main Navigation')}
          >
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('bakkwa');
                scrollToSection('store-products');
              }}
              className="hover:text-[#E5B869] hover:underline underline-offset-8 decoration-[#E5B869]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('炭烤肉乾', 'Charcoal Bak Kwa')}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('shaped');
                scrollToSection('store-products');
              }}
              className="hover:text-[#E5B869] hover:underline underline-offset-8 decoration-[#E5B869]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('造型肉乾', 'Shaped Editions')}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('cookies');
                scrollToSection('store-products');
              }}
              className="hover:text-[#E5B869] hover:underline underline-offset-8 decoration-[#E5B869]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('酥香年餅', 'Artisan Cookies')}
            </button>
            <button
              type="button"
              onClick={onOpenStory}
              className="hover:text-[#E5B869] hover:underline underline-offset-8 decoration-[#E5B869]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('品牌故事', 'Heritage Story')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('luxury-contact')}
              className="hover:text-[#E5B869] hover:underline underline-offset-8 decoration-[#E5B869]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('門市資訊', 'Boutique')}
            </button>
          </nav>

          {/* Zone 3: Language Switch + Primary Shimmer Shopping Bag CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center text-xs font-mono border border-[#E5B869]/25 rounded-lg overflow-hidden bg-white/5">
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`px-2.5 py-1.5 cursor-pointer transition whitespace-nowrap ${
                  lang === 'zh' ? 'bg-[#E5B869] text-[#0B0807] font-bold' : 'text-[#D6C7B2] hover:text-white'
                }`}
              >
                中
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1.5 cursor-pointer transition whitespace-nowrap ${
                  lang === 'en' ? 'bg-[#E5B869] text-[#0B0807] font-bold' : 'text-[#D6C7B2] hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="luxury-shimmer-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7A1215] via-[#8F191D] to-[#7A1215] hover:from-[#8F191D] hover:to-[#A42025] text-[#F6DFA9] text-xs sm:text-[13px] font-bold tracking-wide transition cursor-pointer border border-[#E5B869]/55 shadow-lg shadow-[#7A1215]/30 whitespace-nowrap shrink-0"
              aria-label={t('開啟購物袋', 'Open Shopping Bag')}
            >
              <ShoppingBag className="w-4 h-4 text-[#E5B869]" />
              <span className="hidden sm:inline">{t('購物袋', 'Bag')}</span>
              <span className="font-mono tabular-nums text-[#F6DFA9]">({totalItemCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border border-[#E5B869]/25 text-[#F6DFA9] bg-white/5 hover:bg-white/10 cursor-pointer"
              aria-label={t('開啟選單', 'Toggle Menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5B869]/20 bg-[#0F0A09]/95 backdrop-blur-2xl px-4 py-4 space-y-2 text-sm font-medium">
            {[
              { label: t('全系列商品目錄', 'Full Catalog'), action: () => scrollToSection('store-products') },
              { label: t('古法炭烤肉乾', 'Charcoal Bak Kwa'), action: () => { handleSelectCategory('bakkwa'); scrollToSection('store-products'); } },
              { label: t('吉祥造型肉乾', 'Shaped Bak Kwa'), action: () => { handleSelectCategory('shaped'); scrollToSection('store-products'); } },
              { label: t('手工年餅＆肉鬆', 'Artisan Cookies & Floss'), action: () => { handleSelectCategory('cookies'); scrollToSection('store-products'); } },
              { label: t('錦源四十載品牌誌', '1985 Heritage Story'), action: () => { setMobileMenuOpen(false); onOpenStory(); } },
              { label: t('檳城柴楞公園門市', 'Penang Flagship Store'), action: () => scrollToSection('luxury-contact') },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={item.action}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-white/5 flex items-center justify-between text-[#F5EDE0] cursor-pointer"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-[#E5B869]" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* SECTION 1: HERO WITH CHARCOAL EMBER PARTICLES, 3D TILT PARALLAX & FLOATING GLASS PILLS */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-10 sm:pb-14 border-b border-[#E5B869]/15">
        {/* Background Rising Charcoal Ember Canvas */}
        <CharcoalParticlesCanvas className="absolute inset-0 w-full h-full z-0" />

        {/* Ambient Warm Depth Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[440px] rounded-full bg-[#E5B869]/10 blur-[120px] z-0"
        />

        <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-8 space-y-6 sm:space-y-8">
          {/* Main 3D Tilt Interactive Hero Card */}
          <div
            onPointerMove={handleHeroPointerMove}
            onPointerLeave={handleHeroPointerLeave}
            className="relative"
          >
            <div
              ref={tiltContainerRef}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="luxury-glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)] relative overflow-visible"
            >
              {/* Depth Ambient Glow Behind Image */}
              <div
                ref={tiltGlowLayerRef}
                aria-hidden="true"
                style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 w-80 h-80 sm:w-[460px] sm:h-[360px] rounded-full bg-gradient-to-tr from-[#7A1215]/45 via-[#E5B869]/20 to-transparent blur-3xl opacity-80"
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center relative z-10">
                {/* Left Column: Editorial Headline, Subcopy & Shimmer CTA */}
                <div className="lg:col-span-5 space-y-5" style={{ transform: 'translateZ(20px)' }}>
                  <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#E5B869]">
                    {t('檳城北海柴楞公園 · 創立於 1985', 'PENANG CHARCOAL ATELIER · EST. 1985')}
                  </div>

                  <h1
                    style={{ fontSize: 'clamp(2rem, 3.6vw, 3.25rem)' }}
                    className="font-serif-brand font-bold text-[#FBF7F0] leading-[1.15] tracking-tight text-balance"
                  >
                    {t(
                      '古法炭火淬鍊 · 四十年黑金級現烤肉乾',
                      '40 Years of Live-Charcoal Culinary Craft'
                    )}
                  </h1>

                  <p className="text-sm sm:text-base text-[#D6C7B2] leading-relaxed max-w-xl">
                    {t(
                      '嚴選上等鮮肉以傳家秘方醃製，老師傅每日守爐直火慢烤出琥珀焦香與豐盈肉汁，搭配手工酥香年餅與獨立真空鎖鮮包裝，全馬宅配直送府上。',
                      'Hand-grilled daily over glowing charcoal for caramelized edges and tender juiciness. Paired with artisan festive cookies and vacuum-sealed for nationwide delivery.'
                    )}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('store-products')}
                      className="luxury-shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#E5B869] via-[#F2D28E] to-[#C8943E] hover:brightness-105 text-[#0B0807] font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-[#E5B869]/20 cursor-pointer active:scale-95 transition whitespace-nowrap"
                    >
                      <span>{t('立即選購招牌珍饈', 'Explore Flagship Menu')}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={onOpenStory}
                      className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F6DFA9] border border-[#E5B869]/35 font-semibold text-sm flex items-center gap-2 backdrop-blur-md cursor-pointer transition whitespace-nowrap"
                    >
                      <BookOpen className="w-4 h-4 text-[#E5B869] shrink-0" />
                      <span>{t('四十載品牌誌', 'Our Heritage')}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: 3D Suspended Pure-Photo Showcase (Zero Text Stamped on Image) */}
                <div className="lg:col-span-7 relative">
                  <div
                    ref={tiltImageLayerRef}
                    style={{
                      transform: 'translate3d(0px, 0px, 24px)',
                      transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="relative aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden border border-[#E5B869]/35 bg-[#120B09] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)]"
                  >
                    {!heroImgFailed[activeHeroSlide.id] && activeHeroSlide.imageUrl ? (
                      <img
                        src={activeHeroSlide.imageUrl}
                        alt={
                          (lang === 'en' && activeHeroSlide.titleEn) ||
                          activeHeroSlide.title ||
                          t('錦源古法炭烤肉乾旗艦海報', 'Jin Yuan Flagship Bak Kwa Poster')
                        }
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setHeroImgFailed((prev) => ({ ...prev, [activeHeroSlide.id]: true }))
                        }
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2B0C0B] via-[#170A08] to-[#0B0807] text-[#E5B869] gap-3">
                        <Flame className="w-12 h-12 opacity-70" />
                        <span className="font-serif-brand text-lg font-bold tracking-wider">
                          {settings.storeName}
                        </span>
                      </div>
                    )}

                    {/* Minimal Slide Arrows ONLY if admin configured multiple banner slides */}
                    {heroSlides.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setHeroSlideIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                          }
                          aria-label={t('上一張海報', 'Previous poster')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0B0807]/65 hover:bg-[#0B0807]/90 text-[#F6DFA9] border border-[#E5B869]/35 flex items-center justify-center backdrop-blur-md transition cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length)}
                          aria-label={t('下一張海報', 'Next poster')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0B0807]/65 hover:bg-[#0B0807]/90 text-[#F6DFA9] border border-[#E5B869]/35 flex items-center justify-center backdrop-blur-md transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {heroSlides.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {heroSlides.map((s, idx) => (
                        <button
                          key={s.id || idx}
                          type="button"
                          onClick={() => setHeroSlideIdx(idx)}
                          aria-label={`Slide ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === safeSlideIdx
                              ? 'w-7 bg-[#E5B869]'
                              : 'w-2 bg-[#E5B869]/30 hover:bg-[#E5B869]/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Floating Glass Capsules (Decoupled from Hero Poster Surface!) */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
            <div className="luxury-glass-panel px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#F6DFA9] flex items-center gap-2 shadow-lg max-w-full">
              <Flame className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
              <span className="truncate">{t('40年古法炭火現烤 · 每日新鮮出爐', '40-Year Live Charcoal Grill · Baked Daily')}</span>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection('luxury-contact')}
              className="luxury-glass-panel min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#F5EDE0] hover:border-[#E5B869]/60 flex items-center gap-2 shadow-lg transition cursor-pointer max-w-full touch-manipulation"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-md">{settings.storeAddress}</span>
            </button>

            <a
              href={formatTelHref(settings.whatsappNumber)}
              className="luxury-glass-panel min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full text-xs font-mono font-semibold text-[#F6DFA9] hover:border-[#E5B869]/60 flex items-center gap-2 shadow-lg transition touch-manipulation"
              aria-label={t(`撥打電話 ${formatDisplayPhone(settings.whatsappNumber)}`, `Call ${formatDisplayPhone(settings.whatsappNumber)}`)}
            >
              <Phone className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
              <span className="whitespace-nowrap">{formatDisplayPhone(settings.whatsappNumber)}</span>
            </a>

            <div className="luxury-glass-panel px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#E5B869] flex items-center gap-2 shadow-lg max-w-full">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {t(`滿 RM ${freeThreshold} 全馬真空免運`, `Free MY Vacuum Delivery RM ${freeThreshold}+`)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MODERN APPLE-STYLE BENTO GRID WITH SPOTLIGHT GOLDEN BORDERS */}
      <section className="py-10 sm:py-14 border-b border-[#E5B869]/15">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-6">
          <RevealOnScroll>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-[#E5B869]">
                  {t('精選禮遇與匠心工藝', 'FLAGSHIP HIGHLIGHTS')}
                </span>
                <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#FBF7F0] text-balance">
                  {t('四十年傳承核心優勢與限時禮遇', 'Heritage Standards & Exclusive Offers')}
                </h2>
              </div>
              <span className="text-xs text-[#BFA98D]">
                {t('移動游標探索卡片金色光暈', 'Hover cards for spotlight luminescence')}
              </span>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-5">
            {/* Bento 1 (Wide 4-Col): 年餅滿 RM100 贈 50g 招牌酥脆肉鬆 */}
            <RevealOnScroll className="md:col-span-4" delayMs={40}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl p-6 sm:p-7 h-full flex flex-col justify-between gap-5 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-7 space-y-3">
                    <div className="text-xs font-mono tracking-wider uppercase text-[#E5B869]">
                      {t('限時滿額禮贈 · COOKIE GIFT OFFER', 'LIMITED COOKIE OFFER')}
                    </div>
                    <h3 className="font-serif-brand text-xl sm:text-2xl font-bold text-[#FBF7F0] leading-snug text-balance">
                      {t(
                        '年餅滿 RM 100 贈 50g 招牌酥脆肉鬆',
                        'Free 50g Signature Crispy Floss with RM 100 Cookies'
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D6C7B2] leading-relaxed">
                      {t(
                        '凡選購錦源手工黃梨酥、杏仁餅、花生餅或脆香雞絲卷滿 RM 100，結帳自動隨單贈送 50g 招牌黃金酥脆肉鬆乙份。',
                        'Order RM 100+ across hand-baked pineapple tarts and festive cookies to receive a complimentary 50g pack of crispy signature floss.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCategory('cookies');
                        scrollToSection('store-products');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E5B869]/15 hover:bg-[#E5B869] text-[#F6DFA9] hover:text-[#0B0807] border border-[#E5B869]/40 text-xs font-bold transition cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('立即挑選年餅領好禮', 'Shop Cookies & Claim Gift')}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>

                  <div className="sm:col-span-5 grid grid-cols-2 gap-2.5">
                    <div className="aspect-[4/4] rounded-xl overflow-hidden border border-[#E5B869]/25 bg-[#120B09]">
                      {!cookieImgFailed ? (
                        <img
                          src={IMG_COOKIES_TARTS}
                          alt={t('錦源手工黃梨酥與年餅', 'Artisan Pineapple Tarts & Cookies')}
                          referrerPolicy="no-referrer"
                          onError={() => setCookieImgFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#E5B869]">
                          <Gift className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <div className="aspect-[4/4] rounded-xl overflow-hidden border border-[#E5B869]/25 bg-[#120B09]">
                      {!flossImgFailed ? (
                        <img
                          src={IMG_FLOSS}
                          alt={t('50g 招牌酥脆肉鬆贈品', '50g Signature Crispy Meat Floss')}
                          referrerPolicy="no-referrer"
                          onError={() => setFlossImgFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#E5B869]">
                          <Flame className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Bento 2 (2-Col): 40年古法炭火現烤 */}
            <RevealOnScroll className="md:col-span-2" delayMs={100}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl p-6 h-full flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#E5B869]/25 bg-[#120B09]">
                    {!workshopImgFailed ? (
                      <img
                        src={IMG_WORKSHOP_CHARCOAL}
                        alt={t('1985 古法炭火現烤工坊', '1985 Live Charcoal Roasting Workshop')}
                        referrerPolicy="no-referrer"
                        onError={() => setWorkshopImgFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#E5B869]">
                        <Flame className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-mono tracking-wider uppercase text-[#E5B869]">
                    {t('匠心直火工藝', 'CHARCOAL CRAFTSMANSHIP')}
                  </div>
                  <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#FBF7F0]">
                    {t('40年古法炭火現烤', '40-Year Charcoal Roasting')}
                  </h3>
                  <p className="text-xs text-[#D6C7B2] leading-relaxed">
                    {t(
                      '堅持手工翻烤與實木炭火控溫，鎖住油脂焦香而不焦苦。',
                      'Turned by hand over live hardwood charcoal to lock in natural meat juices and smoky aroma.'
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenStory}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-[#E5B869] hover:text-[#F6DFA9] cursor-pointer"
                >
                  <span>{t('探索 1985 品牌故事', 'Read 1985 Heritage')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </RevealOnScroll>

            {/* Bento 3 (3-Col): 全馬真空常溫郵寄 */}
            <RevealOnScroll className="md:col-span-3" delayMs={140}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl p-6 h-full flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono tracking-wider uppercase text-[#E5B869]">
                      {t('鎖鮮宅配物流', 'NATIONWIDE VACUUM DELIVERY')}
                    </div>
                    <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#FBF7F0]">
                      {t('全馬真空常溫郵寄', 'All-Malaysia Vacuum Courier')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D6C7B2] leading-relaxed">
                      {t(
                        `每片肉乾皆經高溫殺菌並採食品級獨立真空密封，常溫配送至東西馬各地依然鮮嫩衛生。單筆滿 RM ${freeThreshold} 即享全馬免運。`,
                        `Individually vacuum-sealed for freshness and hygiene across Peninsular & East Malaysia. Free shipping on orders RM ${freeThreshold}+.`
                      )}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#E5B869]/15 border border-[#E5B869]/35 flex items-center justify-center shrink-0 text-[#E5B869]">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5B869]/15 flex items-center justify-between text-xs">
                  <span className="text-[#BFA98D] font-mono tabular-nums">
                    {t(`免運門檻：RM ${freeThreshold}`, `Free Threshold: RM ${freeThreshold}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('store-products')}
                    className="inline-flex items-center gap-1 font-bold text-[#E5B869] hover:text-[#F6DFA9] cursor-pointer"
                  >
                    <span>{t('瀏覽商品價格', 'View Pricing')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </RevealOnScroll>

            {/* Bento 4 (3-Col): 吉祥造型肉乾＆安全衛生保證 */}
            <RevealOnScroll className="md:col-span-3" delayMs={180}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl p-6 h-full flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono tracking-wider uppercase text-[#E5B869]">
                      {t('商務伴手禮 ＆ 年節送禮', 'BESPOKE GIFTING')}
                    </div>
                    <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#FBF7F0]">
                      {t('吉祥造型肉乾 · 體面大方', 'Auspicious Shaped Bak Kwa')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D6C7B2] leading-relaxed">
                      {t(
                        '提供金錢、金元寶、愛心與生肖造型，搭配 250g / 500g / 1kg 多規格選配，個人自享與企業商務送禮皆相宜。',
                        'Available in Coin, Gold Ingot, Heart, and Zodiac molds in 250g, 500g, and 1kg packs for effortless luxury gifting.'
                      )}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#7A1215]/40 border border-[#E5B869]/35 flex items-center justify-center shrink-0 text-[#E5B869]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5B869]/15 flex items-center justify-between text-xs">
                  <span className="text-[#BFA98D]">
                    {t('250g / 500g / 1kg 彈性選購', '250g · 500g · 1kg Packs')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCategory('shaped');
                      scrollToSection('store-products');
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#E5B869] hover:text-[#F6DFA9] cursor-pointer"
                  >
                    <span>{t('篩選造型肉乾', 'Browse Shapes')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* SECTION 3: FULL PRODUCT CATALOG IN FROSTED GLASS & GOLD SPOTLIGHT */}
      <section id="store-products" className="py-10 sm:py-14 flex-1">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-6">
          <RevealOnScroll>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#E5B869]">
                  {t('錦源全系列美食價目', 'COMPLETE ARCHIVE MENU')}
                </div>
                <h2 className="font-serif-brand text-2xl sm:text-4xl font-bold text-[#FBF7F0] text-balance">
                  {t('黑金旗艦版 · 全系列產品目錄', 'Jin Yuan Full Product Catalog')}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#BFA98D]">
                <span>
                  {lang === 'en' ? `${filteredProducts.length} ITEMS` : `共 ${filteredProducts.length} 款美味`}
                </span>
                {(selectedMeat !== 'all' || selectedCategory !== 'all' || selectedShape !== 'all' || searchQuery.trim() || inStockOnly) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-[#E5B869] hover:text-[#F6DFA9] underline cursor-pointer font-sans font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('清除篩選', 'Reset')}</span>
                  </button>
                )}
              </div>
            </div>
          </RevealOnScroll>

          {/* Frosted Glass Filter Toolbar */}
          <div className="luxury-glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 border-b border-[#E5B869]/15">
              {categoryTabs.map((c) => {
                const isActive = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#E5B869] text-[#0B0807] shadow-md shadow-[#E5B869]/20'
                        : 'text-[#D6C7B2] hover:text-[#FBF7F0] hover:bg-white/5'
                    }`}
                  >
                    {lang === 'en' ? c.labelEn : c.labelZh}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: t('全部肉類與品類', 'All') },
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                      selectedMeat === m.id
                        ? 'bg-[#7A1215] text-[#F6DFA9] border-[#E5B869]/60'
                        : 'bg-white/5 text-[#D6C7B2] border-[#E5B869]/20 hover:border-[#E5B869]/50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}

                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#D6C7B2] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#E5B869] cursor-pointer"
                  />
                  <span>{t('僅看現貨', 'In Stock Only')}</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative min-w-[220px] sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#BFA98D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('搜尋肉乾、造型、肉鬆、年餅...', 'Search bak kwa, cookies, floss...')}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#0B0807]/70 border border-[#E5B869]/25 rounded-lg text-[#FBF7F0] placeholder-[#8C7A68] focus:outline-none focus:border-[#E5B869]"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                  aria-label={t('商品排序', 'Sort products')}
                  className="px-3 py-2 text-xs bg-[#0B0807]/70 border border-[#E5B869]/25 rounded-lg text-[#FBF7F0] font-semibold focus:outline-none focus:border-[#E5B869] cursor-pointer"
                >
                  <option value="featured">{t('精選熱銷排序', 'Featured Order')}</option>
                  <option value="price_asc">{t('價格由低到高', 'Price: Low → High')}</option>
                  <option value="price_desc">{t('價格由高到低', 'Price: High → Low')}</option>
                </select>
              </div>
            </div>

            {selectedCategory === 'shaped' && (
              <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-[#E5B869]/15">
                <span className="text-xs font-semibold text-[#E5B869] mr-1">
                  {t('造型分類挑選：', 'Select Shape:')}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-[#E5B869] text-[#0B0807] border-[#E5B869]'
                          : 'bg-white/5 text-[#D6C7B2] border-[#E5B869]/20 hover:border-[#E5B869]/60'
                      }`}
                    >
                      {shape.emoji} {t(shape.labelZh, shape.labelEn)} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Grid */}
          {isLoadingProducts && products.length === 0 ? (
            <div className="luxury-glass-panel rounded-2xl py-16 text-center">
              <p className="font-serif-brand font-bold text-lg text-[#F6DFA9]">
                {t('正在從雲端載入錦源商品目錄...', 'Loading catalog from cloud...')}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="luxury-glass-panel rounded-2xl py-14 px-6 text-center space-y-3">
              <p className="font-serif-brand font-bold text-lg text-[#F6DFA9]">
                {t('目前篩選條件下沒有符合的商品', 'No products match your current filters')}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#E5B869] text-[#0B0807] text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('顯示全部商品', 'Show All Items')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((product, index) => {
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
                  <RevealOnScroll
                    key={product.id}
                    delayMs={(index % 3) * 60}
                    resetKey={filterResetKey}
                  >
                    <article
                      onPointerMove={updateSpotlightCoords}
                      className={`luxury-spotlight-card rounded-2xl overflow-hidden flex flex-col justify-between h-full ${
                        isMissingSelection ? 'border-[#EF4444] ring-2 ring-red-500/40' : ''
                      }`}
                    >
                      <div>
                        <ProductImageCarousel
                          product={product}
                          variant="luxury_3d"
                          onImageClick={() => setQuickViewProduct(product)}
                        />

                        <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                          {/* Clean Unboxed Metadata Row */}
                          <div className="flex items-center justify-between gap-2 text-xs text-[#BFA98D]">
                            <span className="truncate text-[#E5B869] font-medium">
                              {getCategoryLabel(product.category, product.categoryLabelZh, lang, storeCategories)}
                              {' · '}
                              {meatLabel}
                            </span>
                            <span className="shrink-0 font-mono tabular-nums text-[#BFA98D]">
                              {currentSpec ? currentSpec.spec : product.unitWeight}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setQuickViewProduct(product)}
                            className="text-left w-full cursor-pointer block"
                          >
                            <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#FBF7F0] hover:text-[#E5B869] transition-colors line-clamp-1">
                              {lang === 'en' ? product.nameEn : product.nameZh}
                            </h3>
                          </button>

                          <p className="text-xs text-[#9C8874] truncate">
                            {lang === 'en' ? product.nameZh : product.nameEn}
                          </p>

                          <p className="text-xs sm:text-sm text-[#D6C7B2] line-clamp-2 leading-relaxed">
                            {lang === 'en' ? product.descriptionEn || product.descriptionZh : product.descriptionZh}
                          </p>

                          {/* Weight Specification Selector */}
                          {hasSpecs && (
                            <div className="pt-3 border-t border-[#E5B869]/15 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#F5EDE0]">
                                  {t('選擇重量規格：', 'Weight Spec:')}
                                </span>
                                <span className={`font-mono font-semibold ${currentSpec ? 'text-emerald-400' : 'text-[#E5B869]'}`}>
                                  {currentSpec ? currentSpec.spec : t('* 請選擇', '* Required')}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {product.specs!.map((specItem, sIdx) => {
                                  const isSel = currentSpec?.spec === specItem.spec;
                                  return (
                                    <button
                                      key={`${product.id}-lux-spec-${specItem.spec}-${sIdx}`}
                                      type="button"
                                      onClick={() => handleSelectWeight(product.id, specItem)}
                                      className={`py-1.5 px-1.5 rounded-lg border text-center transition cursor-pointer ${
                                        isSel
                                          ? 'bg-[#E5B869] text-[#0B0807] border-[#E5B869] shadow-sm'
                                          : 'bg-white/5 text-[#F5EDE0] border-[#E5B869]/20 hover:border-[#E5B869]/60'
                                      }`}
                                    >
                                      <div className="text-[11px] font-bold leading-tight truncate">{specItem.spec}</div>
                                      <div className="text-[10px] font-mono tabular-nums opacity-90">
                                        RM {specItem.price.toLocaleString()}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Style / Flavor Variant Selector */}
                          {hasVariants && (
                            <div className="pt-2.5 border-t border-[#E5B869]/15 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#F5EDE0]">
                                  {lang === 'en' ? product.variantOptionLabelEn || 'Option' : product.variantOptionLabelZh || '選擇款式'}
                                </span>
                                <span className={`font-semibold ${currentVariant ? 'text-emerald-400' : 'text-[#E5B869]'}`}>
                                  {currentVariant || t('* 必選', '* Required')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {product.variantOptions!.map((optionZh, vIdx) => {
                                  const optionEn = product.variantOptionsEn?.[vIdx] || optionZh;
                                  const isSel = currentVariant === optionZh;
                                  return (
                                    <button
                                      key={`${product.id}-lux-var-${optionZh}-${vIdx}`}
                                      type="button"
                                      onClick={() => handleSelectVariant(product.id, optionZh)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                        isSel
                                          ? 'bg-[#7A1215] text-[#F6DFA9] border-[#E5B869]/70'
                                          : 'bg-white/5 text-[#D6C7B2] border-[#E5B869]/20 hover:border-[#E5B869]/55'
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
                            <p className="text-xs font-semibold text-red-400 flex items-center gap-1 pt-0.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{t('請先選擇重量規格或款式後再加入', 'Please select required options first')}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Shimmer Add to Cart Footer */}
                      <div className="p-4 sm:p-5 pt-0">
                        <div className="pt-3.5 border-t border-[#E5B869]/15 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-[#F6DFA9]">
                                RM {currentPrice.toLocaleString()}
                              </span>
                              {product.originalPrice && !currentSpec && (
                                <span className="font-mono tabular-nums text-[11px] text-[#8C7A68] line-through">
                                  RM {product.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
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
                              <span
                                className={
                                  product.stock <= 0
                                    ? 'text-red-400 font-bold'
                                    : product.stock <= 10
                                    ? 'text-amber-300 font-bold'
                                    : 'text-[#D6C7B2] font-semibold'
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
                            className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
                              isAdded
                                ? 'bg-emerald-600 text-white shadow-md'
                                : needsSelection
                                ? 'bg-[#E5B869]/15 text-[#F6DFA9] border border-[#E5B869]/40 hover:bg-[#E5B869]/25'
                                : 'luxury-shimmer-btn bg-gradient-to-r from-[#7A1215] to-[#9E1B1F] hover:from-[#8F191D] hover:to-[#B52227] text-[#F6DFA9] border border-[#E5B869]/45 shadow-lg shadow-[#7A1215]/30'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4 shrink-0" />
                                <span>{t('已加入', 'Added')}</span>
                              </>
                            ) : needsSelection ? (
                              <span>{t('請選規格', 'Pick Spec')}</span>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 shrink-0" />
                                <span>{t('加入購物袋', 'Add to Bag')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  </RevealOnScroll>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: SEASONAL EXCLUSIVES */}
      <section id="seasonal-specials" className="py-10 sm:py-14 border-t border-[#E5B869]/15">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-6">
          <RevealOnScroll>
            <div className="space-y-1">
              <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#E5B869]">
                {t('歲時節慶限定', 'SEASONAL EXCLUSIVES')}
              </div>
              <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#FBF7F0]">
                {t('端午五香肉粽 · 中秋傳統烘焙月餅', 'Festival Editions: Zongzi & Mooncakes')}
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Zongzi Card */}
            <RevealOnScroll delayMs={40}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 h-full"
              >
                <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#120B09]">
                  {!zongziImgFailed ? (
                    <img
                      src={zongziProduct.image || IMG_ZONGZI}
                      alt={t('端午五香肉粽', 'Five-Spice Bak Chang')}
                      referrerPolicy="no-referrer"
                      onError={() => setZongziImgFailed(true)}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setQuickViewProduct(zongziProduct)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#E5B869]">
                      <Flame className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[#E5B869]">
                      {t('端午限定 · 每粒 1 顆裝', 'Dragon Boat Edition')}
                    </div>
                    <h3 className="font-serif-brand text-lg font-bold text-[#FBF7F0]">
                      {lang === 'en' ? zongziProduct.nameEn : zongziProduct.nameZh}
                    </h3>
                    <p className="text-xs text-[#D6C7B2] leading-relaxed">
                      {lang === 'en' ? zongziProduct.descriptionEn : zongziProduct.descriptionZh}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#E5B869]/15">
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-mono tabular-nums text-xl font-bold text-[#F6DFA9] block leading-none">
                        RM {zongziProduct.price}
                      </span>
                      <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            zongziProduct.stock <= 0 ? 'bg-red-400' : zongziProduct.stock <= 10 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className={zongziProduct.stock <= 0 ? 'text-red-400 font-bold' : 'text-[#D6C7B2]'}>
                          {zongziProduct.stock <= 0
                            ? t('暫時售完', 'Out of stock')
                            : t(`現貨庫存：${zongziProduct.stock} 粒`, `In Stock: ${zongziProduct.stock}`)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(zongziProduct)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7A1215] to-[#9E1B1F] text-[#F6DFA9] border border-[#E5B869]/45 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer hover:brightness-110 transition"
                    >
                      {addedIds[zongziProduct.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('已加入', 'Added')}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('加入購物袋', 'Add')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Mooncake Card */}
            <RevealOnScroll delayMs={100}>
              <div
                onPointerMove={updateSpotlightCoords}
                className="luxury-spotlight-card rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 h-full"
              >
                <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#120B09]">
                  {!mooncakeImgFailed ? (
                    <img
                      src={mooncakeProduct.image || IMG_MOONCAKE}
                      alt={t('中秋傳統月餅', 'Traditional Mid-Autumn Mooncake')}
                      referrerPolicy="no-referrer"
                      onError={() => setMooncakeImgFailed(true)}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setQuickViewProduct(mooncakeProduct)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#E5B869]">
                      <Gift className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono text-[#E5B869]">
                      {t('中秋限定 · 3 款經典口味', 'Mid-Autumn Edition')}
                    </div>
                    <h3 className="font-serif-brand text-lg font-bold text-[#FBF7F0]">
                      {lang === 'en' ? mooncakeProduct.nameEn : mooncakeProduct.nameZh}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {mooncakeVariants.map((flavorZh, idx) => {
                        const flavorEn = mooncakeVariantsEn[idx] || flavorZh;
                        const active = selectedMooncakeFlavor === flavorZh;
                        return (
                          <button
                            key={flavorZh}
                            type="button"
                            onClick={() => handleSelectVariant(mooncakeProduct.id, flavorZh)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                              active
                                ? 'bg-[#E5B869] text-[#0B0807] border-[#E5B869]'
                                : 'bg-white/5 text-[#D6C7B2] border-[#E5B869]/20'
                            }`}
                          >
                            {lang === 'en' ? flavorEn : flavorZh}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#E5B869]/15">
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-mono tabular-nums text-xl font-bold text-[#F6DFA9] block leading-none">
                        RM {mooncakeProduct.price}
                      </span>
                      <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            mooncakeProduct.stock <= 0 ? 'bg-red-400' : mooncakeProduct.stock <= 10 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className={mooncakeProduct.stock <= 0 ? 'text-red-400 font-bold' : 'text-[#D6C7B2]'}>
                          {mooncakeProduct.stock <= 0
                            ? t('暫時售完', 'Out of stock')
                            : t(`現貨庫存：${mooncakeProduct.stock} 粒`, `In Stock: ${mooncakeProduct.stock}`)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(mooncakeProduct)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7A1215] to-[#9E1B1F] text-[#F6DFA9] border border-[#E5B869]/45 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer hover:brightness-110 transition"
                    >
                      {addedIds[mooncakeProduct.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('已加入', 'Added')}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('加入購物袋', 'Add')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* SECTION 5: DARK LUXURY BOUTIQUE FOOTER */}
      <footer id="luxury-contact" className="bg-[#080504] border-t border-[#E5B869]/20 pt-12 pb-28 sm:pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Admin Portal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logoUrl || OFFICIAL_LOGO_URL}
                  alt={settings.storeName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-[#E5B869]/60"
                />
                <div>
                  <div className="font-serif-brand font-bold text-base text-[#F6DFA9]">
                    {settings.storeName}
                  </div>
                  <div className="text-xs text-[#9C8874]">{settings.storeSubname}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-[#E5B869] text-[#F6DFA9] hover:text-[#0B0807] border border-[#E5B869]/30 text-xs font-bold transition cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('店長後台管理', 'Admin Panel')}</span>
              </button>
            </div>

            {/* Pickup Address */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E5B869] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{t('門市自取地址', 'Boutique Address')}</span>
              </div>
              <p className="text-xs text-[#D6C7B2] leading-relaxed">{settings.storeAddress}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#9C8874] font-mono">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>8:00 AM – 10:00 PM Daily</span>
              </div>
            </div>

            {/* Direct Call, WhatsApp & Email */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E5B869]">
                {t('聯繫訂購與批發', 'Order & Wholesale')}
              </div>
              <p className="text-xs font-semibold text-[#F5EDE0]">{settings.contactPerson}</p>
              <div className="flex flex-col items-start gap-2">
                <a
                  href={formatTelHref(settings.whatsappNumber)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#E5B869]/15 hover:bg-[#E5B869]/25 border border-[#E5B869]/40 text-xs font-mono font-bold text-[#F6DFA9] transition touch-manipulation"
                  aria-label={t(`撥打電話 ${formatDisplayPhone(settings.whatsappNumber)}`, `Call ${formatDisplayPhone(settings.whatsappNumber)}`)}
                >
                  <Phone className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
                  <span className="whitespace-nowrap">{formatDisplayPhone(settings.whatsappNumber)}</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-mono font-bold text-emerald-300 transition touch-manipulation"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('WhatsApp 線上諮詢', 'WhatsApp Chat')}</span>
                </a>
              </div>
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#BFA98D] hover:text-[#F6DFA9] font-mono break-all py-0.5 transition"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{settings.email}</span>
              </a>
            </div>

            {/* Delivery & Social */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E5B869]">
                {t('配送與官方社群', 'Courier & Channels')}
              </div>
              <p className="text-xs text-[#D6C7B2] leading-relaxed">
                {t(
                  `全馬常溫獨立真空郵寄，訂單滿 RM ${freeThreshold} 免運費直送府上。`,
                  `Nationwide vacuum-sealed courier. Free shipping on orders RM ${freeThreshold}+.`
                )}
              </p>
              <SocialFollowLinks />
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5B869]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#9C8874]">
            <span>© {new Date().getFullYear()} JIN YUAN TRADITIONAL ENTERPRISE. All Rights Reserved.</span>
            <span className="font-serif-brand text-[#E5B869]/90">
              {t('檳城柴楞公園古法炭烤肉乾專賣店', 'Penang Charcoal Bak Kwa Specialist')}
            </span>
          </div>
        </div>
      </footer>

      {/* Shared Product Detail Modal (auto-closes after adding to cart) */}
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
