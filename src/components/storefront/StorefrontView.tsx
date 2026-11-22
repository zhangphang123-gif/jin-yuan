import React, { useState } from 'react';
import { StoreProduct, CartItem, StoreSettings } from '../../types/store';
import { StoreNavbar } from './StoreNavbar';
import { PromoTickerBanner } from './PromoTickerBanner';
import { HeroBannerSlider } from './HeroBannerSlider';
import { HotBakKwaShowcase } from './HotBakKwaShowcase';
import { ProductFilterSidebar } from './ProductFilterSidebar';
import { ProductImageCarousel } from './ProductImageCarousel';
import { ProductDetailModal } from './ProductDetailModal';
import { StoryBannerSlider } from './StoryBannerSlider';
import { FloatingCartWidget } from './FloatingCartWidget';
import { SocialFollowLinks } from './SocialFollowLinks';
import { useLanguage, getCategoryLabel } from '../../context/LanguageContext';
import { IMG_ZONGZI, IMG_MOONCAKE } from '../../utils/productImages';
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
  sortCatalogProducts
} from '../../utils/productFilters';
import {
  Search,
  Plus,
  Check,
  Truck,
  Sparkles,
  Flame,
  Phone,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  AlertCircle,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  X,
  RotateCcw,
  LayoutDashboard,
  Calendar,
  MessageCircle
} from 'lucide-react';

interface StorefrontViewProps {
  products: StoreProduct[];
  cartItems: CartItem[];
  settings: StoreSettings;
  isLoadingProducts?: boolean;
  onAddToCart: (product: StoreProduct, selectedWeight?: string, selectedPrice?: number) => void;
  onOpenCart: () => void;
  onSwitchToAdmin: () => void;
  onOpenStory: () => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  cartItems,
  settings,
  isLoadingProducts = false,
  onAddToCart,
  onOpenCart,
  onSwitchToAdmin,
  onOpenStory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('all');
  const [selectedShape, setSelectedShape] = useState<ShapeSubFilter>('all');
  const [selectedMeat, setSelectedMeat] = useState<MeatFilterOption>('all');
  const [sortBy, setSortBy] = useState<ProductSortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(2);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);

  // Track selected weight specs and shape/flavor variants per product
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, { spec: string; price: number }>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'jy-seasonal-mooncake': '豆沙口味',
  });
  const [highlightMissingSpecId, setHighlightMissingSpecId] = useState<string | null>(null);
  const [zongziImgError, setZongziImgError] = useState(false);
  const [mooncakeImgError, setMooncakeImgError] = useState(false);
  const { lang, t } = useLanguage();

  const storeCategories = resolveStoreCategories(settings);

  // Quick horizontal chips for mobile & tablet compact filter bar (consolidated Shaped Bak Kwa + dynamic categories)
  const quickCategoryChips: { id: CategoryFilterOption; label: string }[] = (() => {
    const chips: { id: CategoryFilterOption; label: string }[] = [
      { id: 'all', label: t('全部品項', 'All') },
    ];
    let insertedShaped = false;
    storeCategories.forEach((cat) => {
      chips.push({
        id: cat.id,
        label: `${cat.emoji} ${t(cat.labelZh, cat.labelEn)}`,
      });
      if (cat.id === 'bakkwa') {
        chips.push({ id: 'shaped', label: t('🏮 造型肉乾', '🏮 Shaped') });
        insertedShaped = true;
      }
    });
    if (!insertedShaped) {
      chips.splice(1, 0, { id: 'shaped', label: t('🏮 造型肉乾', '🏮 Shaped') });
    }
    return chips;
  })();

  // Mobile 4-column quick access navigation tiles (refined heritage typography)
  const mobileQuickTiles = [
    { id: 'all', label: t('全館珍饈', 'All Menu'), sub: t('精選', 'ALL'), action: 'category' as const },
    { id: 'bakkwa', label: t('炭烤肉乾', 'Bak Kwa'), sub: t('主打', 'GRILL'), action: 'category' as const },
    { id: 'shaped', label: t('造型肉乾', 'Shaped'), sub: t('多款', 'SHAPE'), action: 'category' as const },
    { id: 'floss', label: t('香酥肉鬆', 'Floss'), sub: t('脆焙', 'FLOSS'), action: 'category' as const },
    { id: 'cured', label: t('古早臘味', 'Cured'), sub: t('陳釀', 'CURED'), action: 'category' as const },
    { id: 'roast', label: t('御品燒臘', 'Roast'), sub: t('現烤', 'ROAST'), action: 'category' as const },
    { id: 'cookies', label: t('手作年餅', 'Cookies'), sub: t('茶點', 'SWEET'), action: 'category' as const },
    { id: 'story', label: t('四十載誌', 'Heritage'), sub: t('1985', 'STORY'), action: 'story' as const },
  ];

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedShape('all');
    setSelectedMeat('all');
    setSortBy('featured');
    setInStockOnly(false);
    setSearchQuery('');
  };

  const filteredByCriteria = products.filter((p) =>
    matchesProductFilters(p, selectedMeat, selectedCategory, searchQuery, inStockOnly, selectedShape)
  );
  const filtered =
    sortBy === 'price_asc'
      ? [...filteredByCriteria].sort((a, b) => a.price - b.price)
      : sortBy === 'price_desc'
      ? [...filteredByCriteria].sort((a, b) => b.price - a.price)
      : sortCatalogProducts(filteredByCriteria);

  const handleSelectWeight = (productId: string, spec: { spec: string; price: number }) => {
    setSelectedSpecs((prev) => ({
      ...prev,
      [productId]: spec,
    }));
    if (highlightMissingSpecId === productId) {
      setHighlightMissingSpecId(null);
    }
  };

  const handleSelectVariant = (productId: string, variantZh: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantZh,
    }));
    if (highlightMissingSpecId === productId) {
      setHighlightMissingSpecId(null);
    }
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

  const handleSelectCategory = (cat: CategoryFilterOption) => {
    setSelectedCategory(cat);
    if (cat !== 'shaped') {
      setSelectedShape('all');
    }
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

  const handleMobileTileClick = (tile: (typeof mobileQuickTiles)[number]) => {
    if (tile.action === 'story') {
      onOpenStory();
    } else if (tile.id === 'seasonal') {
      handleSelectCategory('seasonal');
      const el = document.getElementById('seasonal-specials');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      handleSelectCategory(tile.id as CategoryFilterOption);
      const el = document.getElementById('store-products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Resolve the two seasonal special items for the dedicated showcase section
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
    descriptionEn: 'Traditional savory five-spice Bak Chang packed with braised pork belly, mushrooms & chestnuts — Dragon Boat Festival exclusive.',
    badge: '端午節限定',
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
    descriptionZh: '傳統手工烘焙中秋月餅，皮薄餡足，僅限每年中秋節期間限定推出。可選口味：豆沙口味、肉鬆口味、蓮蓉蛋黃口味。',
    descriptionEn: 'Hand-baked traditional Mid-Autumn mooncakes with thin golden crust. Flavors: Red Bean Paste, Meat Floss, or Lotus Paste with Salted Egg Yolk.',
    badge: '中秋節限定',
    hasWeightOptions: false,
    variantOptionLabelZh: '選擇月餅口味',
    variantOptionLabelEn: 'Select Mooncake Flavor',
    variantOptions: ['豆沙口味', '肉鬆口味', '蓮蓉蛋黃口味'],
    variantOptionsEn: ['Red Bean Paste', 'Crispy Meat Floss', 'Lotus Paste & Yolk'],
  };

  const mooncakeVariants = mooncakeProduct.variantOptions || ['豆沙口味', '肉鬆口味', '蓮蓉蛋黃口味'];
  const mooncakeVariantsEn = mooncakeProduct.variantOptionsEn || ['Red Bean Paste', 'Crispy Meat Floss', 'Lotus Paste & Yolk'];
  const selectedMooncakeFlavor = selectedVariants[mooncakeProduct.id];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans relative selection:bg-red-800 selection:text-white">
      
      {/* 1. Top Sliding Announcement Banner */}
      <PromoTickerBanner
        announcements={settings.promoAnnouncements}
        fallbackText={settings.announcementText}
      />

      {/* 2. Storefront Navigation Bar (Big Logo, Refined Nav & Photo Hover/Tap Previews) */}
      <StoreNavbar
        cartItems={cartItems}
        settings={settings}
        products={products}
        onOpenCart={onOpenCart}
        onOpenStory={onOpenStory}
        onSelectCategory={(cat) => handleSelectCategory(cat as CategoryFilterOption)}
        onQuickViewProduct={(product) => setQuickViewProduct(product)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 3. Hero Section with Touch Swipable Promotional Banner Slider */}
      <section className="pt-3 sm:pt-5 pb-4 sm:pb-6 border-b border-stone-200/80 dark:border-stone-800">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-6 space-y-3 sm:space-y-4">
          
          {/* Main Swipable Auto-Rotating Hero Banner */}
          <HeroBannerSlider
            slides={settings.bannerSlides}
            heroBannerUrl={settings.heroBannerUrl}
            autoRotateSeconds={settings.bannerAutoRotateSeconds}
            grand={true}
            onSelectCategory={(cat) => handleSelectCategory(cat as CategoryFilterOption)}
            onOpenStory={onOpenStory}
          />

          {/* Mobile 4-Column Quick Access Grid */}
          <div className="grid grid-cols-4 sm:hidden gap-1.5 pt-0.5">
            {mobileQuickTiles.map((tile) => {
              const isActive = tile.action === 'category' && selectedCategory === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleMobileTileClick(tile)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-red-900 text-amber-100 border-red-900 shadow-sm'
                      : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-800'
                  }`}
                >
                  <span
                    className={`text-[9px] font-mono tracking-[0.18em] uppercase mb-0.5 ${
                      isActive ? 'text-amber-300' : 'text-red-800/75 dark:text-amber-400/80'
                    }`}
                  >
                    {tile.sub}
                  </span>
                  <span className="font-serif-brand text-[11px] font-bold leading-tight whitespace-nowrap">
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Trust Highlights */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 pt-1">
            
            {/* Search bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('搜尋美食（肉乾、造型、肉鬆、臘味、燒肉、肉粽、月餅）...', 'Search (Bak Kwa, Floss, Cured, Roast, Zongzi, Mooncake)...')}
                className="w-full pl-10 pr-4 py-2 sm:py-3 text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-xl sm:rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-red-800 shadow-xs"
              />
            </div>

            {/* Trust highlights */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm font-bold text-stone-700 dark:text-stone-300">
              <div className="flex items-center justify-center sm:justify-start gap-1 px-2.5 py-1.5 bg-red-100/70 dark:bg-red-950/40 text-red-900 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/60">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
                <span className="truncate">{t('40年古法炭火現烤', '40-Yr Charcoal Grill')}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 px-2.5 py-1.5 bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 rounded-xl border border-amber-300/60 dark:border-amber-900/60">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 shrink-0" />
                <span className="truncate">{t(`滿 RM ${settings.freeShippingThreshold || 300} 全馬免運`, `Free Shipping > RM${settings.freeShippingThreshold || 300}`)}</span>
              </div>
              <button
                onClick={onOpenStory}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-200/90 dark:bg-stone-800 hover:bg-red-900 hover:text-amber-100 text-stone-800 dark:text-stone-200 rounded-xl cursor-pointer transition font-serif-brand font-bold"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('四十載品牌誌', 'Our Heritage')}</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 3B. Hot Bak Kwa Auto-Rotating Showcase */}
      <HotBakKwaShowcase
        products={products}
        settings={settings}
        onQuickView={(product) => setQuickViewProduct(product)}
      />

      {/* 4. Full Product Catalog Section with Side Order Filter Panel */}
      <section id="store-products" className="py-5 sm:py-10 flex-1">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 space-y-4 sm:space-y-6">

          {/* Mobile/Tablet Quick Ingredient + Category Chips & Drawer Trigger (< lg) */}
          <div className="lg:hidden space-y-2.5 pb-2 border-b border-stone-200 dark:border-stone-800">
            {/* Quick Meat Pills row */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-900 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t('全部篩選', 'Filters')}</span>
              </button>

              {(
                [
                  { id: 'all', label: t('全部', 'All') },
                  { id: 'pork', label: t('🐷 豬肉', '🐷 Pork') },
                  { id: 'chicken', label: t('🐔 雞肉', '🐔 Chicken') },
                  { id: 'duck', label: t('🦆 燒鴨', '🦆 Duck') },
                  { id: 'cookies', label: t('🍪 年餅', '🍪 Cookies') },
                  { id: 'seasonal', label: t('🎋 節慶限定', '🎋 Seasonal') },
                ] as { id: MeatFilterOption; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMeat(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    selectedMeat === m.id
                      ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 border-stone-900'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Category Pills row */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/75 dark:bg-stone-900 rounded-xl overflow-x-auto scrollbar-none text-xs">
              {quickCategoryChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-red-900 text-white shadow-xs'
                      : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Storefront Catalog Layout: Left Sticky Filter Sidebar + Right Product Grid */}
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-7 items-start">

            {/* Left Sticky Order Filter Sidebar */}
            <ProductFilterSidebar
              products={products}
              settings={settings}
              selectedMeat={selectedMeat}
              selectedCategory={selectedCategory}
              selectedShape={selectedShape}
              sortBy={sortBy}
              inStockOnly={inStockOnly}
              onSelectMeat={handleSelectMeat}
              onSelectCategory={handleSelectCategory}
              onSelectShape={setSelectedShape}
              onChangeSort={setSortBy}
              onToggleInStock={setInStockOnly}
              onResetFilters={handleResetFilters}
              isMobileOpen={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
            />

            {/* Right Catalog Area */}
            <div className="space-y-4">
              {/* Active Filter Summary & Mobile Grid Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif-brand font-black text-base sm:text-xl text-stone-900 dark:text-stone-100">
                    {t('全系列產品與最新價目表', 'Jin Yuan Full Product Catalog')}
                  </h2>

                  {selectedMeat !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedMeat('all')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-md text-xs font-bold cursor-pointer"
                    >
                      <span>{getMeatLabel(selectedMeat, lang)}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedShape('all');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-md text-xs font-bold cursor-pointer"
                    >
                      <span>
                        {quickCategoryChips.find((c) => c.id === selectedCategory)?.label || selectedCategory}
                      </span>
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {selectedCategory === 'shaped' && selectedShape !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedShape('all')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-md text-xs font-bold cursor-pointer"
                    >
                      <span>
                        {(() => {
                          const s = SHAPED_BAKKWA_OPTIONS.find((opt) => opt.id === selectedShape);
                          return s ? `${s.emoji} ${t(s.labelZh, s.labelEn)}` : selectedShape;
                        })()}
                      </span>
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {(selectedMeat !== 'all' || selectedCategory !== 'all' || selectedShape !== 'all' || searchQuery.trim() || inStockOnly) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-stone-500 hover:text-red-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('清除全部', 'Clear all')}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <div className="text-xs sm:text-sm text-stone-500 font-medium">
                    {lang === 'en' ? (
                      <>Showing <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">{filtered.length}</span> items</>
                    ) : (
                      <>共 <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">{filtered.length}</span> 款美食</>
                    )}
                  </div>

                  {/* Mobile Grid Switcher */}
                  <div className="flex sm:hidden items-center gap-1 p-0.5 bg-stone-200/80 dark:bg-stone-900 rounded-lg border border-stone-300/60 dark:border-stone-700">
                    <button
                      type="button"
                      onClick={() => setMobileGridCols(2)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        mobileGridCols === 2
                          ? 'bg-red-900 text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                      title={t('兩格並排顯示', '2-column grid')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>{t('雙格', 'Grid')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileGridCols(1)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        mobileGridCols === 1
                          ? 'bg-red-900 text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                      title={t('大圖單列顯示', '1-column large view')}
                    >
                      <Rows3 className="w-3.5 h-3.5" />
                      <span>{t('大圖', 'List')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Multi-Shape Selector Panel shown when 造型肉乾 is selected */}
              {selectedCategory === 'shaped' && (
                <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-50 via-amber-50/70 to-red-50 dark:from-red-950/40 dark:via-stone-900 dark:to-red-950/40 border border-amber-300/70 dark:border-amber-800/60 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-red-900 dark:text-amber-300">
                      <span>🏮</span>
                      <span>{t('造型肉乾形狀挑選（點擊選擇您喜愛的吉祥造型）', 'Select Shaped Bak Kwa Style')}</span>
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      {t('皆以 250g / 500g / 1kg 獨立真空密封包裝', 'Individually vacuum-packed in 250g / 500g / 1kg')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {SHAPED_BAKKWA_OPTIONS.map((shape) => {
                      const shapeCount =
                        shape.id === 'all'
                          ? products.filter((p) => isShapedBakKwa(p)).length
                          : products.filter((p) => matchesShapeSubFilter(p, shape.id)).length;
                      const isActive = selectedShape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setSelectedShape(shape.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                            isActive
                              ? 'bg-red-900 text-amber-100 border-red-900 shadow-sm'
                              : 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-red-700'
                          }`}
                        >
                          <span className="text-sm leading-none">{shape.emoji}</span>
                          <span>{t(shape.labelZh, shape.labelEn)}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              isActive
                                ? 'bg-black/25 text-amber-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                            }`}
                          >
                            {shapeCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isLoadingProducts && products.length === 0 ? (
                <div className="py-16 px-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-2">
                  <p className="font-serif-brand font-bold text-lg text-stone-800 dark:text-stone-200">
                    {t('正在從雲端載入錦源商品目錄...', 'Loading catalog from cloud...')}
                  </p>
                  <p className="text-xs text-stone-500">
                    {t('請稍候片刻', 'Please wait a moment')}
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-14 px-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-3">
                  <p className="font-serif-brand font-bold text-lg text-stone-800 dark:text-stone-200">
                    {t('目前篩選條件下沒有符合的商品', 'No products match your selected filters')}
                  </p>
                  <p className="text-xs text-stone-500">
                    {t('您可以切換左側食材／品類，或點擊下方按鈕顯示全部錦源美味', 'Try clearing some filters or browsing the full menu.')}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('顯示全部商品', 'Show All Items')}</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`grid ${
                    mobileGridCols === 2
                      ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  }`}
                >
                  {filtered.map((product) => {
                    const isAdded = addedIds[product.id];
                    const hasSpecs = Boolean(product.specs && product.specs.length > 0);
                    const hasVariants = Boolean(product.variantOptions && product.variantOptions.length > 0);
                    const currentSpec = selectedSpecs[product.id];
                    const currentVariant = selectedVariants[product.id];
                    const currentPrice = currentSpec ? currentSpec.price : product.price;
                    const isMissingSelection = highlightMissingSpecId === product.id;
                    const needsSelection = (hasSpecs && !currentSpec) || (hasVariants && !currentVariant);
                    const isCompact = mobileGridCols === 2;
                    const meatLabel = getMeatLabel(inferProductMeatTag(product), lang);

                    const specColsClass =
                      product.specs && product.specs.length >= 4
                        ? 'grid-cols-2 sm:grid-cols-3'
                        : product.specs && product.specs.length === 3
                        ? isCompact
                          ? 'grid-cols-2 sm:grid-cols-3'
                          : 'grid-cols-3'
                        : 'grid-cols-2';

                    return (
                      <div
                        key={product.id}
                        className={`group bg-white dark:bg-stone-900 border rounded-xl sm:rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${
                          isMissingSelection
                            ? 'border-red-600 ring-2 sm:ring-4 ring-red-500/40'
                            : 'border-stone-200/90 dark:border-stone-800 hover:border-amber-400/60'
                        }`}
                      >
                        <div>
                          {/* Swipable Product Image Carousel */}
                          <ProductImageCarousel
                            product={product}
                            compactMobile={isCompact}
                            onImageClick={() => setQuickViewProduct(product)}
                          />

                          {/* Card Content */}
                          <div className={isCompact ? 'p-2.5 sm:p-5 space-y-1.5 sm:space-y-2.5' : 'p-4 sm:p-5 space-y-2.5'}>
                            <div className="text-[10px] sm:text-xs text-stone-500 flex items-center justify-between gap-1 font-semibold">
                              <span className="text-red-700 dark:text-red-400 truncate">
                                {getCategoryLabel(product.category, product.categoryLabelZh, lang, storeCategories)} · {meatLabel}
                              </span>
                              <span className="text-stone-500 font-mono text-[10px] sm:text-[11px] shrink-0">
                                {currentSpec ? currentSpec.spec : product.unitWeight}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setQuickViewProduct(product)}
                              className="text-left w-full cursor-pointer"
                            >
                              <h3
                                className={`font-serif-brand font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors ${
                                  isCompact ? 'text-sm sm:text-xl line-clamp-2 sm:line-clamp-1' : 'text-lg sm:text-xl line-clamp-1'
                                }`}
                              >
                                {lang === 'en' ? product.nameEn : product.nameZh}
                              </h3>
                            </button>

                            <p className={`text-xs text-stone-400 truncate ${isCompact ? 'hidden sm:block' : 'block'}`}>
                              {lang === 'en' ? product.nameZh : product.nameEn}
                            </p>

                            <p
                              className={`text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed pt-0.5 ${
                                isCompact ? 'hidden sm:block' : 'block'
                              }`}
                            >
                              {lang === 'en' ? product.descriptionEn || product.descriptionZh : product.descriptionZh}
                            </p>

                            {/* Weight Selection Buttons */}
                            {hasSpecs && (
                              <div className={`${isCompact ? 'pt-1.5 sm:pt-2.5 space-y-1 sm:space-y-1.5' : 'pt-2.5 pb-1 space-y-2'} border-t border-stone-100 dark:border-stone-800`}>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className="font-bold text-stone-700 dark:text-stone-300">
                                    {t('規格重量：', 'Size / Weight:')}
                                  </span>
                                  {currentSpec ? (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      {currentSpec.spec}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-red-600">
                                      {t('* 必選', '* Required')}
                                    </span>
                                  )}
                                </div>

                                <div className={`grid ${specColsClass} gap-1 sm:gap-1.5`}>
                                  {product.specs!.map((specItem, specIdx) => {
                                    const isSelected = currentSpec?.spec === specItem.spec;
                                    return (
                                      <button
                                        key={`${product.id}-spec-${specItem.spec}-${specIdx}`}
                                        type="button"
                                        onClick={() => handleSelectWeight(product.id, specItem)}
                                        className={`${
                                          isCompact ? 'py-1 px-1 sm:py-1.5 sm:px-1.5' : 'py-1.5 px-2'
                                        } rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer border text-center active:scale-95 ${
                                          isSelected
                                            ? 'bg-red-900 text-white border-red-900 shadow-xs'
                                            : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-red-600'
                                        }`}
                                      >
                                        <div className="font-black leading-tight truncate">{specItem.spec}</div>
                                        <div className="text-[10px] opacity-90 font-mono tabular-nums">
                                          RM {specItem.price.toLocaleString()}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Shape / Flavor / Style Option Picker */}
                            {hasVariants && (
                              <div className={`${isCompact ? 'pt-1.5 sm:pt-2 space-y-1' : 'pt-2 space-y-1.5'} border-t border-stone-100 dark:border-stone-800`}>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className="font-bold text-stone-700 dark:text-stone-300 truncate">
                                    {lang === 'en'
                                      ? `${product.variantOptionLabelEn || 'Option'}:`
                                      : `${product.variantOptionLabelZh || '選擇款式'}：`}
                                  </span>
                                  {currentVariant ? (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                      {currentVariant}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-red-600 shrink-0">
                                      {t('* 必選', '* Required')}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {product.variantOptions!.map((optionZh, idx) => {
                                    const optionEn = product.variantOptionsEn?.[idx] || optionZh;
                                    const isSelected = currentVariant === optionZh;
                                    return (
                                      <button
                                        key={`${product.id}-var-${optionZh}-${idx}`}
                                        type="button"
                                        onClick={() => handleSelectVariant(product.id, optionZh)}
                                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition cursor-pointer active:scale-95 ${
                                          isSelected
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                            : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-500'
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
                              <p className="text-[10px] sm:text-xs font-bold text-red-600 flex items-center gap-1 pt-0.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {t('請先點選上方規格／款式後再加入', 'Please select required options first')}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Add to Cart Action */}
                        <div className={isCompact ? 'p-2.5 sm:p-5 pt-0' : 'p-4 sm:p-5 pt-0'}>
                          <div
                            className={`pt-2 sm:pt-3 border-t border-stone-100 dark:border-stone-800 flex ${
                              isCompact
                                ? 'flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2'
                                : 'items-center justify-between gap-2'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-baseline justify-between sm:justify-start gap-1.5">
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                  <span
                                    className={`font-mono tabular-nums font-black text-red-800 dark:text-red-400 ${
                                      isCompact ? 'text-base sm:text-2xl' : 'text-xl sm:text-2xl'
                                    }`}
                                  >
                                    RM {currentPrice.toLocaleString()}
                                  </span>
                                  {product.originalPrice && !currentSpec && (
                                    <span className="font-mono text-[10px] sm:text-xs text-stone-400 line-through">
                                      RM {product.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {isCompact && (
                                  <button
                                    type="button"
                                    onClick={() => setQuickViewProduct(product)}
                                    className="sm:hidden text-[10px] text-stone-500 underline cursor-pointer shrink-0 font-sans"
                                  >
                                    {t('看多圖', 'Photos')}
                                  </button>
                                )}
                              </div>

                              <div className="text-[10px] sm:text-xs font-mono tabular-nums flex items-center gap-1.5">
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
                                      : 'text-stone-600 dark:text-stone-300 font-semibold'
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
                              onClick={() => handleAdd(product)}
                              className={`${
                                isCompact ? 'w-full sm:w-auto py-2 px-2.5 sm:py-2.5 sm:px-4 text-xs sm:text-sm' : 'py-2.5 px-4 text-xs sm:text-sm'
                              } font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : needsSelection
                                  ? 'bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-950 dark:text-amber-200 border border-amber-300'
                                  : 'bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white border border-amber-400/40'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                                  <span>{t('已加入', 'Added')}</span>
                                </>
                              ) : needsSelection ? (
                                <span>
                                  {hasSpecs && !currentSpec
                                    ? t('先選規格', 'Pick Weight')
                                    : t('先選款式', 'Pick Style')}
                                </span>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>{t('加入購物車', 'Add to Cart')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 5A. Dedicated Standalone Section: 【歲時節慶典藏 · 節慶限定系列】 (Positioned right above Brand Story) */}
      <section
        id="seasonal-specials"
        className="py-8 sm:py-12 bg-gradient-to-br from-[#4A0E0E] via-[#6B1414] to-[#3B0A0A] text-stone-100 border-y border-amber-500/35 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.14),transparent_55%)]" />
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 space-y-6 sm:space-y-7 relative z-10">
          {/* Editorial Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-400/25 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] uppercase text-amber-300">
                <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{t('歲時節慶典藏 · 端午與中秋古早味手作', 'Seasonal Limited · Dragon Boat & Mid-Autumn')}</span>
              </div>
              <h2 className="font-serif-brand text-2xl sm:text-3xl font-black text-amber-50 tracking-wide text-balance">
                {t('節慶限定系列', 'Seasonal Specials Collection')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl leading-relaxed">
                {t(
                  '每年僅於端午節與中秋節期間限量手工製作，點擊下方圖片或預訂按鈕即可查看實拍細節與快速加入購物車。',
                  'Handcrafted exclusively during Dragon Boat and Mid-Autumn festivals. Click either card to inspect details or add directly to cart.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedCategory === 'seasonal') {
                  handleSelectCategory('all');
                } else {
                  handleSelectCategory('seasonal');
                }
                const el = document.getElementById('store-products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`min-h-[42px] px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer shrink-0 self-start md:self-auto shadow-md border ${
                selectedCategory === 'seasonal'
                  ? 'bg-stone-900/90 hover:bg-stone-800 text-amber-200 border-amber-400/60'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-300'
              }`}
            >
              {selectedCategory === 'seasonal'
                ? t('✓ 目錄已篩選節慶限定（點此看全部）', '✓ Seasonal Filter Active (Show All)')
                : t('在產品目錄只看節慶限定 ➔', 'Filter Seasonal in Catalog ➔')}
            </button>
          </div>

          {/* Two High-Appeal Clickable Showcase Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-stretch">
            {/* Card 1: 端午節限定：五香肉粽 (RM 11) */}
            <article className="group bg-[#FDF8F0] dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/60 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-[transform,box-shadow] duration-200 flex flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setQuickViewProduct(zongziProduct)}
                className="sm:w-5/12 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0 cursor-pointer text-left"
                aria-label={t('查看端午節限定五香肉粽詳情', 'View Five-Spice Zongzi details')}
              >
                {!zongziImgError ? (
                  <img
                    src={zongziProduct.image || IMG_ZONGZI}
                    alt={t('端午節限定：五香肉粽', 'Dragon Boat Special: Five-Spice Zongzi')}
                    onError={() => setZongziImgError(true)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-red-900 via-red-950 to-stone-900 flex flex-col items-center justify-center p-4 text-amber-200">
                    <Flame className="w-10 h-10 mb-2 text-amber-400/80" />
                    <span className="font-serif-brand font-bold text-sm">{t('端午節 · 五香肉粽', 'Five-Spice Zongzi')}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent text-amber-200 text-[11px] font-bold opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  {t('點擊看大圖與詳情 ➔', 'Quick view & photos ➔')}
                </div>
              </button>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-red-800 dark:text-amber-400 tracking-widest uppercase">
                    {t('端午節限定 · 手工古早鹹肉粽', 'Dragon Boat Festival Exclusive')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(zongziProduct)}
                    className="text-left cursor-pointer block w-full"
                  >
                    <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 group-hover:text-red-800 dark:group-hover:text-amber-300 transition-colors">
                      {t('端午節限定：五香肉粽', 'Dragon Boat: Five-Spice Zongzi')}
                    </h3>
                  </button>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {t(
                      '傳統古早味五香鹹肉粽，嚴選五花肉、香菇與五香滷料飽滿包裹，僅限每年端午節期間限定推出。',
                      'Traditional savory five-spice Bak Chang packed with braised pork belly and mushrooms — Dragon Boat Festival exclusive.'
                    )}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-stone-200/90 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono tabular-nums text-2xl sm:text-[26px] font-black text-red-800 dark:text-red-400 leading-none">
                      RM {zongziProduct.price} <span className="text-sm font-bold text-stone-500">/ {t('粒', 'pc')}</span>
                    </div>
                    <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          zongziProduct.stock <= 0 ? 'bg-red-500' : zongziProduct.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={zongziProduct.stock <= 0 ? 'text-red-600 font-bold' : 'text-stone-600 dark:text-stone-300 font-semibold'}>
                        {zongziProduct.stock <= 0
                          ? t('暫時售完', 'Out of stock')
                          : t(`現貨庫存：${zongziProduct.stock} 粒`, `In Stock: ${zongziProduct.stock}`)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(zongziProduct)}
                    className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-transform flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 whitespace-nowrap shrink-0 ${
                      addedIds[zongziProduct.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white border border-amber-400/50'
                    }`}
                  >
                    {addedIds[zongziProduct.id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('已加入購物車', 'Added')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{t('預訂五香肉粽', 'Add Zongzi')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>

            {/* Card 2: 中秋節限定：傳統月餅 (RM 15，含口味選項) */}
            <article className="group bg-[#FDF8F0] dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/60 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-[transform,box-shadow] duration-200 flex flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setQuickViewProduct(mooncakeProduct)}
                className="sm:w-5/12 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0 cursor-pointer text-left"
                aria-label={t('查看中秋節限定傳統月餅詳情', 'View Traditional Mooncake details')}
              >
                {!mooncakeImgError ? (
                  <img
                    src={mooncakeProduct.image || IMG_MOONCAKE}
                    alt={t('中秋節限定：傳統月餅', 'Mid-Autumn Special: Traditional Baked Mooncake')}
                    onError={() => setMooncakeImgError(true)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-amber-900 via-red-950 to-stone-900 flex flex-col items-center justify-center p-4 text-amber-200">
                    <Sparkles className="w-10 h-10 mb-2 text-amber-300" />
                    <span className="font-serif-brand font-bold text-sm">{t('中秋節 · 傳統月餅', 'Traditional Mooncake')}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent text-amber-200 text-[11px] font-bold opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  {t('點擊看大圖與內餡介紹 ➔', 'Quick view & flavors ➔')}
                </div>
              </button>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold text-red-800 dark:text-amber-400 tracking-widest uppercase">
                    {t('中秋節限定 · 傳統手工烘焙', 'Mid-Autumn Festival Exclusive')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(mooncakeProduct)}
                    className="text-left cursor-pointer block w-full"
                  >
                    <h3 className="font-serif-brand text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 group-hover:text-red-800 dark:group-hover:text-amber-300 transition-colors">
                      {t('中秋節限定：傳統月餅', 'Mid-Autumn: Traditional Mooncake')}
                    </h3>
                  </button>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {t(
                      '傳統手工烘焙中秋月餅，金黃薄皮餡足，僅限每年中秋節期間限定推出。',
                      'Hand-baked Mid-Autumn mooncakes with golden thin crust and rich traditional fillings.'
                    )}
                  </p>

                  {/* Interactive Mooncake Flavor Options */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-700 dark:text-stone-300">
                        {t('口味選項：', 'Flavor Option:')}
                      </span>
                      <span className="text-red-800 dark:text-amber-300 font-extrabold">
                        {lang === 'en'
                          ? mooncakeVariantsEn[Math.max(0, mooncakeVariants.indexOf(selectedMooncakeFlavor || '豆沙口味'))]
                          : selectedMooncakeFlavor || '豆沙口味'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('選擇傳統月餅口味', 'Select Mooncake Flavor')}>
                      {mooncakeVariants.map((flavorZh, idx) => {
                        const flavorEn = mooncakeVariantsEn[idx] || flavorZh;
                        const activeFlavor = selectedMooncakeFlavor || '豆沙口味';
                        const isPicked = activeFlavor === flavorZh;
                        return (
                          <button
                            key={flavorZh}
                            type="button"
                            onClick={() => handleSelectVariant(mooncakeProduct.id, flavorZh)}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                              isPicked
                                ? 'bg-red-900 text-amber-100 border-red-900 shadow-sm'
                                : 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-red-700'
                            }`}
                          >
                            {lang === 'en' ? flavorEn : flavorZh}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-stone-200/90 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono tabular-nums text-2xl sm:text-[26px] font-black text-red-800 dark:text-red-400 leading-none">
                      RM {mooncakeProduct.price} <span className="text-sm font-bold text-stone-500">/ {t('粒', 'pc')}</span>
                    </div>
                    <div className="text-[11px] font-mono tabular-nums flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          mooncakeProduct.stock <= 0 ? 'bg-red-500' : mooncakeProduct.stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={mooncakeProduct.stock <= 0 ? 'text-red-600 font-bold' : 'text-stone-600 dark:text-stone-300 font-semibold'}>
                        {mooncakeProduct.stock <= 0
                          ? t('暫時售完', 'Out of stock')
                          : t(`現貨庫存：${mooncakeProduct.stock} 粒`, `In Stock: ${mooncakeProduct.stock}`)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(mooncakeProduct)}
                    className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-transform flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 whitespace-nowrap shrink-0 ${
                      addedIds[mooncakeProduct.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white border border-amber-400/50'
                    }`}
                  >
                    {addedIds[mooncakeProduct.id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('已加入購物車', 'Added')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{t('預訂傳統月餅', 'Add Mooncake')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5B. Brand Story Swipable Banner Section */}
      <section className="py-8 sm:py-12 bg-stone-100 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('40載古法堅持 · 權威媒體專題報導', '40-Year Charcoal Tradition · Featured in Media')}</span>
              </div>
              <h2 className="font-serif-brand text-xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1">
                {t('錦源品牌故事與歷史影像', 'Jin Yuan Brand Story & Heritage')}
              </h2>
            </div>

            <button
              onClick={onOpenStory}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow self-start sm:self-auto shrink-0"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>{t('閱讀完整傳奇故事', 'Read Full Story')}</span>
            </button>
          </div>

          <StoryBannerSlider />
        </div>
      </section>

      {/* 6. Contact & Store Info Section */}
      <section id="store-contact" className="py-8 sm:py-12 pb-24 sm:pb-14 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <span className="text-xs font-bold tracking-wider text-red-700 dark:text-red-400 uppercase">
              STORE LOCATION & CONTACT
            </span>
            <h2 className="font-serif-brand text-xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1">
              {t('錦源門市與自取資訊', 'Store Location & Pickup Info')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t('JIN YUAN TRADITIONAL ENTERPRISE · 檳城北賴柴楞公園老字號', 'JIN YUAN TRADITIONAL ENTERPRISE · Chai Leng Park, Prai, Penang')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2 text-center flex flex-col justify-between">
              <div className="space-y-2">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-700" />
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  {t('負責人與電話', 'Contact & Phone')}
                </h3>
                <p className="text-stone-700 dark:text-stone-300 font-medium">{settings.contactPerson}</p>
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <a
                    href={formatTelHref(settings.whatsappNumber)}
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-800 hover:bg-red-700 active:scale-95 text-white font-mono font-bold text-xs sm:text-sm transition shadow-xs touch-manipulation"
                    aria-label={t(`撥打電話 ${formatDisplayPhone(settings.whatsappNumber)}`, `Call ${formatDisplayPhone(settings.whatsappNumber)}`)}
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{formatDisplayPhone(settings.whatsappNumber)}</span>
                  </a>
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(settings.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition touch-manipulation"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('WhatsApp 聯繫客服', 'WhatsApp Support')}</span>
                  </a>
                </div>
              </div>
              <div className="pt-2.5 mt-2 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onSwitchToAdmin}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-800 dark:hover:text-amber-300 border border-stone-300 dark:border-stone-700 hover:border-red-700/50 rounded-xl transition cursor-pointer shadow-2xs whitespace-nowrap"
                  title={t('店長後台登入（僅限授權店長）', 'Admin Dashboard (Authorized Staff Only)')}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-red-700 dark:text-red-400 shrink-0" />
                  <span>{t('店長後台', 'Admin')}</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-1.5 text-center">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-700" />
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                {t('門市自取地址', 'Pickup Address')}
              </h3>
              <p className="leading-relaxed text-xs sm:text-sm">
                {settings.storeAddress}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-1.5 text-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-700" />
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                {t('自取與出貨時間', 'Hours & Shipping')}
              </h3>
              <p className="text-xs sm:text-sm font-medium">8:00 AM - 10:00 PM</p>
              <p className="text-amber-800 dark:text-amber-400 font-medium text-xs sm:text-sm">
                {t('全馬常溫獨立真空郵寄', 'Nationwide Vacuum Courier')}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-1.5 text-center">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-700" />
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                {t('電子郵件與批發', 'Email & Wholesale')}
              </h3>
              <a
                href={`mailto:${settings.email}`}
                className="inline-block font-mono text-xs sm:text-sm text-red-800 dark:text-amber-300 hover:underline break-all py-1"
              >
                {settings.email}
              </a>
              <p className="text-stone-500 text-xs sm:text-sm">
                {t('公司/商會年節團購歡迎諮詢', 'Corporate & CNY Bulk Orders Welcome')}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 space-y-6">
            <SocialFollowLinks />
            <p className="text-center text-xs text-stone-500">
              © {new Date().getFullYear()} {t('錦源 JIN YUAN TRADITIONAL ENTERPRISE. 保留所有權利。', 'JIN YUAN TRADITIONAL ENTERPRISE. All Rights Reserved.')}
            </p>
          </div>
        </div>
      </section>

      {/* Product Detail Quick-View Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        categories={storeCategories}
        initialSpec={quickViewProduct ? selectedSpecs[quickViewProduct.id] : undefined}
        initialVariant={quickViewProduct ? selectedVariants[quickViewProduct.id] : undefined}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
      />

      {/* 7. Floating Shopping Cart Vehicle Tracker */}
      <FloatingCartWidget
        cartItems={cartItems}
        settings={settings}
        onOpenCart={onOpenCart}
      />

    </div>
  );
};
