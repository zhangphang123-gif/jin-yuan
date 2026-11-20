import React, { useMemo } from 'react';
import { StoreProduct, StoreSettings } from '../../types/store';
import {
  CategoryFilterOption,
  MeatFilterOption,
  ProductSortOption,
  SHAPED_BAKKWA_OPTIONS,
  ShapeSubFilter,
  inferProductMeatTag,
  isShapedBakKwa,
  matchesShapeSubFilter,
  resolveStoreCategories
} from '../../utils/productFilters';
import { useLanguage } from '../../context/LanguageContext';
import { SlidersHorizontal, RotateCcw, ArrowUpDown, X, ChevronDown } from 'lucide-react';

interface ProductFilterSidebarProps {
  products: StoreProduct[];
  settings?: StoreSettings;
  selectedMeat: MeatFilterOption;
  selectedCategory: CategoryFilterOption;
  selectedShape: ShapeSubFilter;
  sortBy: ProductSortOption;
  inStockOnly: boolean;
  onSelectMeat: (meat: MeatFilterOption) => void;
  onSelectCategory: (cat: CategoryFilterOption) => void;
  onSelectShape: (shape: ShapeSubFilter) => void;
  onChangeSort: (sort: ProductSortOption) => void;
  onToggleInStock: (checked: boolean) => void;
  onResetFilters: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  products,
  settings,
  selectedMeat,
  selectedCategory,
  selectedShape,
  sortBy,
  inStockOnly,
  onSelectMeat,
  onSelectCategory,
  onSelectShape,
  onChangeSort,
  onToggleInStock,
  onResetFilters,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { t } = useLanguage();

  const meatOptions: { id: MeatFilterOption; labelZh: string; labelEn: string; subZh: string; subEn: string; emoji: string }[] = [
    { id: 'all', labelZh: '全部食材', labelEn: 'All Ingredients', subZh: '顯示全館商品', subEn: 'All varieties', emoji: '🏮' },
    { id: 'pork', labelZh: '豬肉嚴選', labelEn: 'Pork', subZh: '肉乾・豬肉鬆・燒肉・臘味', subEn: 'Bak Kwa, Pork Floss, Roast', emoji: '🐷' },
    { id: 'chicken', labelZh: '雞肉嚴選', labelEn: 'Chicken', subZh: '雞肉乾・雞肉鬆・燒雞', subEn: 'Chicken Bak Kwa, Floss', emoji: '🐔' },
    { id: 'duck', labelZh: '鴨肉／燒鴨', labelEn: 'Duck', subZh: '傳統脆皮燒鴨', subEn: 'Roast Duck', emoji: '🦆' },
    { id: 'cookies', labelZh: '年餅小吃', labelEn: 'Cookies', subZh: '杏仁・花生・鳳梨酥・雞絲卷', subEn: 'CNY Cookies & Rolls', emoji: '🍪' },
    { id: 'seasonal', labelZh: '節慶限定', labelEn: 'Seasonal', subZh: '端午五香肉粽・中秋月餅', subEn: 'Zongzi & Mooncakes', emoji: '🎋' },
  ];

  const categoryOptions = useMemo(() => {
    const storeCategories = resolveStoreCategories(settings);
    const list: { id: CategoryFilterOption; labelZh: string; labelEn: string; emoji: string }[] = [
      { id: 'all', labelZh: '全部品類（含三大主打）', labelEn: 'All Categories', emoji: '✨' },
    ];

    let insertedShaped = false;
    storeCategories.forEach((cat) => {
      list.push({
        id: cat.id,
        labelZh: cat.labelZh,
        labelEn: cat.labelEn,
        emoji: cat.emoji,
      });
      if (cat.id === 'bakkwa') {
        list.push({
          id: 'shaped',
          labelZh: '造型肉乾',
          labelEn: 'Shaped Bak Kwa',
          emoji: '🏮',
        });
        insertedShaped = true;
      }
    });

    if (!insertedShaped) {
      list.splice(1, 0, {
        id: 'shaped',
        labelZh: '造型肉乾',
        labelEn: 'Shaped Bak Kwa',
        emoji: '🏮',
      });
    }

    return list;
  }, [settings]);

  const getMeatCount = (meatId: MeatFilterOption) => {
    if (meatId === 'all') return products.length;
    return products.filter((p) => inferProductMeatTag(p) === meatId).length;
  };

  const getCategoryCount = (catId: CategoryFilterOption) => {
    if (catId === 'all') return products.length;
    if (catId === 'shaped') return products.filter((p) => isShapedBakKwa(p)).length;
    return products.filter((p) => p.category === catId).length;
  };

  const hasActiveFilters =
    selectedMeat !== 'all' ||
    selectedCategory !== 'all' ||
    selectedShape !== 'all' ||
    sortBy !== 'featured' ||
    inStockOnly;

  const filterPanelContent = (
    <div className="space-y-5 text-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 font-serif-brand font-black text-base text-stone-900 dark:text-stone-100">
          <SlidersHorizontal className="w-4 h-4 text-red-700" />
          <span>{t('點餐快速篩選', 'Order Filter')}</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('重設', 'Reset')}</span>
          </button>
        )}
      </div>

      {/* Group 1: By Meat / Ingredient */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {t('依食材種類 (豬 / 雞 / 鴨 / 餅)', 'By Ingredient (Pork / Chicken / Cookies)')}
        </h3>
        <div className="space-y-1">
          {meatOptions.map((opt) => {
            const count = getMeatCount(opt.id);
            const active = selectedMeat === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectMeat(opt.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full px-3 py-2 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-red-900 text-white border-red-900 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-950/70 text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-800 hover:border-red-700/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0">{opt.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {t(opt.labelZh, opt.labelEn)}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        active ? 'text-amber-200/90' : 'text-stone-400'
                      }`}
                    >
                      {t(opt.subZh, opt.subEn)}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    active
                      ? 'bg-black/25 text-amber-300'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group 2: By Product Category (Consolidated Shaped Bak Kwa with Multi-Shape Picker) */}
      <div className="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {t('依商品系列 (目錄分類)', 'By Category')}
        </h3>
        <div className="space-y-1">
          {categoryOptions.map((cat) => {
            const count = getCategoryCount(cat.id);
            const active = selectedCategory === cat.id;
            const isShapedRow = cat.id === 'shaped';
            return (
              <div key={cat.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    if (!isShapedRow && onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer text-xs ${
                    active
                      ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 font-bold shadow-xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="shrink-0">{cat.emoji}</span>
                    <span className="truncate">{t(cat.labelZh, cat.labelEn)}</span>
                    {isShapedRow && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          active ? 'rotate-180 opacity-90' : 'opacity-50'
                        }`}
                      />
                    )}
                  </span>
                  <span
                    className={`font-mono tabular-nums text-[11px] shrink-0 ${
                      active ? 'opacity-90' : 'text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Expandable Multi-Shape Picker inside Directory when 造型肉乾 is selected */}
                {isShapedRow && active && (
                  <div className="ml-2 pl-2.5 border-l-2 border-red-800/40 dark:border-amber-400/50 py-1.5 space-y-1.5">
                    <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400 px-1">
                      {t('選擇造型形狀：', 'Pick a Shape:')}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SHAPED_BAKKWA_OPTIONS.map((shape) => {
                        const shapeCount =
                          shape.id === 'all'
                            ? products.filter((p) => isShapedBakKwa(p)).length
                            : products.filter((p) => matchesShapeSubFilter(p, shape.id)).length;
                        const isShapePicked = selectedShape === shape.id;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => {
                              onSelectShape(shape.id);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isShapePicked
                                ? 'bg-red-900 text-amber-100 border-red-900 shadow-2xs'
                                : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-red-700'
                            }`}
                          >
                            <span>{shape.emoji}</span>
                            <span>{t(shape.labelZh, shape.labelEn)}</span>
                            <span className="text-[10px] opacity-70 font-mono">{shapeCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Group 3: Sort & In-stock */}
      <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{t('排序方式', 'Sort By')}</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value as ProductSortOption)}
            className="w-full px-3 py-2 text-xs font-bold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-red-800 cursor-pointer"
          >
            <option value="featured">{t('店家推薦順序', 'Featured First')}</option>
            <option value="price_asc">{t('價格：由低到高', 'Price: Low to High')}</option>
            <option value="price_desc">{t('價格：由高到低', 'Price: High to Low')}</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 accent-red-800 rounded cursor-pointer"
          />
          <span>{t('僅顯示有現貨美食', 'Show in-stock items only')}</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Left Filter Sidebar */}
      <aside className="hidden lg:block bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-4 shadow-xs lg:sticky lg:top-24">
        {filterPanelContent}
      </aside>

      {/* Mobile Slide-Over Filter Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-80 max-w-[85vw] bg-white dark:bg-stone-900 h-full overflow-y-auto p-5 shadow-2xl border-r border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
                JIN YUAN FILTER
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer"
                aria-label="Close filter drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {filterPanelContent}
          </div>
        </div>
      )}
    </>
  );
};
