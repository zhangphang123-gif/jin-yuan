import React, { useState, useEffect, useRef } from 'react';
import { CategoryDefinition, StoreProduct } from '../../types/store';
import { getProductImages } from '../../utils/productImages';
import { useLanguage, getCategoryLabel } from '../../context/LanguageContext';
import { X, ChevronLeft, ChevronRight, Plus, Check, AlertCircle, Truck, Flame } from 'lucide-react';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  categories?: CategoryDefinition[];
  initialSpec?: { spec: string; price: number };
  initialVariant?: string;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, selectedWeight?: string, selectedPrice?: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  initialSpec,
  initialVariant,
  onClose,
  onAddToCart,
}) => {
  const { lang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState<{ spec: string; price: number } | undefined>(initialSpec);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(initialVariant);
  const [missingWarning, setMissingWarning] = useState(false);
  const [added, setAdded] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (warningTimerRef.current !== null) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setCurrentIndex(0);
    setSelectedSpec(initialSpec);
    setSelectedVariant(initialVariant);
    setMissingWarning(false);
    setAdded(false);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (warningTimerRef.current !== null) {
        window.clearTimeout(warningTimerRef.current);
      }
    };
  }, [product, initialSpec, initialVariant]);

  if (!product) return null;

  const images = getProductImages(product);
  const hasSpecs = Boolean(product.specs && product.specs.length > 0);
  const hasVariants = Boolean(product.variantOptions && product.variantOptions.length > 0);
  const displayPrice = selectedSpec ? selectedSpec.price : product.price;
  const primaryTitle = lang === 'en' ? product.nameEn : product.nameZh;
  const secondaryTitle = lang === 'en' ? product.nameZh : product.nameEn;

  const needsSpecSelection = hasSpecs && !selectedSpec;
  const needsVariantSelection = hasVariants && !selectedVariant;
  const isMissingRequired = needsSpecSelection || needsVariantSelection;

  const handleAddClick = () => {
    if (added) return;

    if (isMissingRequired) {
      setMissingWarning(true);
      if (warningTimerRef.current !== null) {
        window.clearTimeout(warningTimerRef.current);
      }
      warningTimerRef.current = window.setTimeout(() => setMissingWarning(false), 2600);
      return;
    }

    const baseUnit = selectedSpec ? selectedSpec.spec : product.unitWeight;
    const finalWeightLabel = selectedVariant ? `${baseUnit} · ${selectedVariant}` : baseUnit;

    onAddToCart(
      product,
      finalWeightLabel,
      selectedSpec ? selectedSpec.price : product.price
    );
    setAdded(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center pt-12 sm:p-4 animate-fade"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[86dvh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>

        {/* Close header bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 sticky top-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md z-20">
          <div className="text-xs text-stone-500 flex items-center gap-2 font-medium truncate">
            <span className="text-red-800 dark:text-red-400 font-bold">
              {getCategoryLabel(product.category, product.categoryLabelZh, lang, categories)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-full bg-stone-200/90 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition cursor-pointer touch-manipulation"
            aria-label={t('關閉視窗', 'Close modal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Gallery + Thumbnails */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-stone-100 dark:bg-stone-950 overflow-hidden">
          <img
            src={images[currentIndex] || images[0]}
            alt={primaryTitle}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer shadow"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer shadow"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 text-white font-mono text-xs">
                {currentIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Multi-Photo Thumbnails Strip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 overflow-x-auto scrollbar-none">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                  idx === currentIndex
                    ? 'border-red-800 dark:border-amber-400 scale-105 shadow-xs'
                    : 'border-transparent opacity-65 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}

        {/* Product Details, Weight & Shape/Flavor Picker */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif-brand text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                {primaryTitle}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{secondaryTitle}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono tabular-nums text-2xl font-black text-red-800 dark:text-red-400">
                RM {displayPrice.toLocaleString()}
              </div>
              <span className="text-[11px] font-mono text-stone-500">
                {t(`庫存 ${product.stock} 件`, `${product.stock} in stock`)}
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {lang === 'en' && product.descriptionEn ? product.descriptionEn : product.descriptionZh}
          </p>

          {/* Weight Spec Selector */}
          {hasSpecs && (
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {t('選擇重量／規格：', 'Select Weight / Size:')}
                </span>
                {selectedSpec ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {t(`已選 ${selectedSpec.spec} · RM ${selectedSpec.price}`, `Selected ${selectedSpec.spec} · RM ${selectedSpec.price}`)}
                  </span>
                ) : (
                  <span className="font-bold text-red-600">
                    {t('* 請先選規格', '* Required')}
                  </span>
                )}
              </div>

              <div className={`grid gap-2 ${product.specs!.length > 4 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {product.specs!.map((specItem, specIdx) => {
                  const isSelected = selectedSpec?.spec === specItem.spec;
                  return (
                    <button
                      key={`${product.id}-modal-spec-${specItem.spec}-${specIdx}`}
                      type="button"
                      onClick={() => {
                        setSelectedSpec(specItem);
                        setMissingWarning(false);
                      }}
                      className={`py-2.5 px-2.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-red-900 text-white border-red-900 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-red-700'
                      }`}
                    >
                      <div className="leading-tight">{specItem.spec}</div>
                      <div className="font-mono text-[11px] opacity-90 mt-0.5">RM {specItem.price.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Shape / Flavor / Style Selector */}
          {hasVariants && (
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {lang === 'en'
                    ? `${product.variantOptionLabelEn || 'Select Option'}:`
                    : `${product.variantOptionLabelZh || '選擇款式口味'}：`}
                </span>
                {selectedVariant ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedVariant}
                  </span>
                ) : (
                  <span className="font-bold text-red-600">
                    {t('* 必選款式／口味', '* Required')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.variantOptions!.map((optionZh, idx) => {
                  const optionEn = product.variantOptionsEn?.[idx] || optionZh;
                  const displayLabel = lang === 'en' ? optionEn : optionZh;
                  const isSelected = selectedVariant === optionZh;
                  return (
                    <button
                      key={`${product.id}-modal-var-${optionZh}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(optionZh);
                        setMissingWarning(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-600'
                      }`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {missingWarning && (
            <p className="text-xs font-bold text-red-600 flex items-center gap-1 pt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {t('請先點選上方必選規格與款式／口味後再加入購物車', 'Please select required weight and style/flavor options first')}
              </span>
            </p>
          )}

          {/* Guarantees Strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-700" />
              {t('古法炭火手工現烤', 'Authentic Charcoal-Grilled')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              {t('全馬真空郵寄 滿 RM 300 免運', 'Free MY Delivery RM 300+')}
            </span>
          </div>

          {/* Sticky Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={added}
              onClick={handleAddClick}
              className={`w-full py-3.5 px-5 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98 disabled:cursor-default ${
                added
                  ? 'bg-emerald-600 text-white'
                  : isMissingRequired
                  ? 'bg-amber-100 text-amber-950 border-2 border-amber-300'
                  : 'bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t('已加入購物車', 'Added to Cart')}</span>
                </>
              ) : isMissingRequired ? (
                <span>
                  {needsSpecSelection && needsVariantSelection
                    ? t('請先選擇重量規格與款式口味', 'Select Weight & Option Above')
                    : needsSpecSelection
                    ? t('請先選擇上方重量規格', 'Select Weight Option Above')
                    : t('請先選擇上方款式／口味', 'Select Style / Flavor Above')}
                </span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>{t('加入購物車', 'Add to Cart')} · RM {displayPrice.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
