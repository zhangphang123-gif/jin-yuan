import React, { useState } from 'react';
import { ProductItem } from '../data/products';
import {
  X,
  Printer,
  ShoppingBag,
  ShieldCheck,
  Utensils,
  Clock,
  Sparkles,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToQuote: (productId: string, packType: 'unit' | 'case', quantity: number) => void;
  onPrintSpec: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToQuote,
  onPrintSpec,
}) => {
  const [packType, setPackType] = useState<'case' | 'unit'>('case');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'spec' | 'recipe'>('spec');
  const [addedToast, setAddedToast] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToQuote(product.id, packType, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 no-print">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded">
              {product.sku}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {product.categoryLabelZh} · {product.origin}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintSpec(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md transition-colors cursor-pointer"
              title="列印商品規格書 / 導出 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>導出規格書 (Print/PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          
          {/* Top Two-Column Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left: Product Imagery */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950">
                <img
                  src={product.image}
                  alt={product.nameZh}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Flavor Profile Pills (Interactive tags) */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs">
                <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  風味特徵 Flavor Notes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.flavorProfile.map((note, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 text-[11px]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Essential Title & Purchase Staging */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  {product.nameZh}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  {product.nameEn}
                </p>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {product.descriptionZh}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed italic">
                {product.descriptionEn}
              </p>

              {/* Wholesale Staging Form */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  採購規格與詢價設定 (Wholesale Procurement):
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPackType('case')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      packType === 'case'
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="text-xs font-medium">商用整箱 (Master Carton)</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">
                      {product.casePacking}
                    </div>
                  </button>

                  <button
                    onClick={() => setPackType('unit')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      packType === 'unit'
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="text-xs font-medium">標準零售件 (Retail Unit)</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">
                      {product.unitNetWeight}
                    </div>
                  </button>
                </div>

                {/* Quantity & Add Action */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-stone-900">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-mono font-semibold text-stone-900 dark:text-stone-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAdd}
                    className="flex-1 py-2.5 px-5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    {addedToast ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>已加入詢價清單！</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          加入詢價單 ({quantity} {packType === 'case' ? '箱 Cartons' : '件 Units'})
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
                  <span>批發建議：{product.suggestedWholesaleTier}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Section Tabs: Detailed Spec Sheet vs Chef Recipe */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-6">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-6">
              <button
                onClick={() => setActiveTab('spec')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'spec'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>商業規格與檢驗證明 (Product Specs)</span>
              </button>
              <button
                onClick={() => setActiveTab('recipe')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'recipe'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>主廚料理搭配與秘傳配方 (Chef Recipe & Pairing)</span>
              </button>
            </div>

            {/* TAB 1: PRODUCT SPECIFICATION */}
            {activeTab === 'spec' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-2.5">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 pb-1 border-b border-stone-200 dark:border-stone-800">
                      包裝與物流規格 Packaging & Logistics
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-stone-500">標準單件淨重：</span>
                      <span className="font-mono text-stone-800 dark:text-stone-200">{product.unitNetWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">整箱規格包裝：</span>
                      <span className="font-mono text-stone-800 dark:text-stone-200">{product.casePacking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">外箱尺寸 (L×W×H)：</span>
                      <span className="font-mono text-stone-800 dark:text-stone-200">{product.cartonDimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">產地原產國：</span>
                      <span className="text-stone-800 dark:text-stone-200">{product.origin}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-2.5">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 pb-1 border-b border-stone-200 dark:border-stone-800">
                      品控與儲存要求 Quality & Storage
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-stone-500">保質期 (Shelf Life)：</span>
                      <span className="text-stone-800 dark:text-stone-200 font-mono">{product.shelfLife}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-stone-500 shrink-0">儲存條件：</span>
                      <span className="text-stone-800 dark:text-stone-200 text-right max-w-xs">{product.storageInstructions}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-stone-500 shrink-0">質量認證：</span>
                      <span className="text-stone-800 dark:text-stone-200 text-right">{product.certifications.join(' · ')}</span>
                    </div>
                  </div>

                </div>

                {/* Ingredients & Allergen Matrix */}
                <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">
                      配料表 (Ingredients):
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {product.ingredientsZh}
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-1 italic">
                      {product.ingredientsEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 mr-2">
                        過敏原聲明 (Allergen Matrix):
                      </span>
                      <span className="text-stone-600 dark:text-stone-300">
                        {product.allergens.join('，')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: CHEF RECIPE & PAIRING */}
            {activeTab === 'recipe' && (
              <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-500 font-semibold">
                      Chef Master Pairing
                    </span>
                    <h3 className="font-serif-brand text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {product.recipePairing.dishNameZh}
                    </h3>
                    <p className="text-xs text-stone-500">{product.recipePairing.dishNameEn}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>{product.recipePairing.prepTime}</span>
                    </div>
                    <span>難度：{product.recipePairing.difficulty}</span>
                  </div>
                </div>

                {/* Golden Ratio Box */}
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold mr-1">黃金調味比例：</span>
                    {product.recipePairing.ratioTip}
                  </div>
                </div>

                {/* Ingredients & Steps */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                  <div className="md:col-span-5 space-y-2">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 pb-1 border-b border-stone-200 dark:border-stone-800">
                      備料清單 (Ingredients)
                    </h4>
                    <ul className="space-y-1.5 text-stone-700 dark:text-stone-300">
                      {product.recipePairing.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-7 space-y-2">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 pb-1 border-b border-stone-200 dark:border-stone-800">
                      主廚烹飪步驟 (Preparation Method)
                    </h4>
                    <ol className="space-y-2 text-stone-700 dark:text-stone-300 list-decimal list-inside">
                      {product.recipePairing.instructions.map((step, i) => (
                        <li key={i} className="leading-relaxed pl-1">
                          {step}
                        </li>
                      ))}
                    </ol>

                    <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 italic">
                      <span className="font-semibold text-stone-700 dark:text-stone-300 not-italic mr-1">
                        主廚秘訣：
                      </span>
                      {product.recipePairing.chefSecret}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
