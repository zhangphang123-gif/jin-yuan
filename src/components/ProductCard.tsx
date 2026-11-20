import React, { useState } from 'react';
import { ProductItem } from '../data/products';
import { FileText, Plus, Check, UtensilsCrossed } from 'lucide-react';

interface ProductCardProps {
  product: ProductItem;
  onOpenDetail: (product: ProductItem) => void;
  onAddToQuote: (productId: string, packType: 'unit' | 'case') => void;
  isStagedInQuote: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onAddToQuote,
  isStagedInQuote,
}) => {
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQuote(product.id, 'case');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className="group relative flex flex-col bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      {/* Product Image Slot (65% visual weight) */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-stone-950 overflow-hidden">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.nameZh}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-stone-400 dark:text-stone-600 bg-stone-100 dark:bg-stone-900">
            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-serif-brand text-stone-500">{product.nameZh}</span>
          </div>
        )}

        {/* Quiet Kicker Top Banner (Unboxed, single element) */}
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-mono tracking-wider text-stone-600 dark:text-stone-300 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs px-2 py-0.5 rounded text-xs">
            {product.sku}
          </span>
        </div>

        {/* Quick Recipe Badge if pairing exists */}
        <div className="absolute bottom-3 left-3 text-[11px] text-stone-200 bg-stone-950/75 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <UtensilsCrossed className="w-3 h-3 text-amber-400" />
          <span>附主廚秘製食譜</span>
        </div>
      </div>

      {/* Content & Metadata Area */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          {/* Unboxed Metadata Line */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2">
            <span>{product.categoryLabelZh}</span>
            <span aria-hidden="true">·</span>
            <span>{product.origin}</span>
            <span aria-hidden="true">·</span>
            <span>保質期 {product.shelfLife.split(' ')[0]}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif-brand text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
            {product.nameZh}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
            {product.nameEn}
          </p>

          {/* Short Description */}
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-3 line-clamp-2 leading-relaxed">
            {product.descriptionZh}
          </p>

          {/* Specifications Snapshot */}
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">標準規格：</span>
              <span className="font-mono text-stone-800 dark:text-stone-200 font-medium">
                {product.unitNetWeight}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">整箱包裝：</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {product.casePacking}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(product)}
            className="flex-1 py-2 px-3 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>詳細規格書</span>
          </button>

          <button
            onClick={handleQuickAdd}
            className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              justAdded
                ? 'bg-emerald-700 text-white'
                : isStagedInQuote
                ? 'bg-stone-800 text-amber-300 dark:bg-stone-700'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
            }`}
            title="加入採購詢價清單"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已加入</span>
              </>
            ) : isStagedInQuote ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已在清單</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>加詢價</span>
              </>
            )}
          </button>
        </div>

      </div>
    </article>
  );
};
