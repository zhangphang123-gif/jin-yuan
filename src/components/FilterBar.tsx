import React from 'react';
import { CATEGORIES } from '../data/products';
import { SlidersHorizontal, X } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  selectedCert: string;
  onSelectCert: (cert: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  totalFilteredCount: number;
  totalProductsCount: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedCert,
  onSelectCert,
  sortBy,
  onSortByChange,
  totalFilteredCount,
  totalProductsCount,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="py-6 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Category Segmented Control Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 dark:bg-stone-900 rounded-lg overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <span>{cat.labelZh}</span>
                <span className="hidden sm:inline text-[11px] opacity-70 ml-1.5">
                  {cat.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Certification Filter, Sort, Reset */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Certification Filter */}
          <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-medium mr-1">認證檢驗：</span>
            <select
              value={selectedCert}
              onChange={(e) => onSelectCert(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="all">全部認證體系 (All Standards)</option>
              <option value="HACCP">HACCP 國際食品安全</option>
              <option value="ISO 22000">ISO 22000 認證</option>
              <option value="HALAL">清真認證 (HALAL)</option>
              <option value="Allergen Free">無已知過敏原 (Allergen Free)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
            <span className="font-medium">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="featured">推薦商品 (Featured)</option>
              <option value="sku">貨號編碼 (SKU)</option>
              <option value="name">產品名稱 (Name A-Z)</option>
            </select>
          </div>

          {/* Filter Status & Reset */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>重置篩選</span>
            </button>
          )}

          <div className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
            共 {totalFilteredCount} / {totalProductsCount} 項商品
          </div>
        </div>

      </div>
    </div>
  );
};
