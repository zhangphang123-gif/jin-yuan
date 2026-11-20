import React from 'react';
import { ShoppingBag, FileSpreadsheet } from 'lucide-react';
import { QuoteItem } from '../types/quote';

interface NavbarProps {
  quoteItems: QuoteItem[];
  onOpenQuoteDrawer: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  quoteItems,
  onOpenQuoteDrawer,
  onNavigateSection
}) => {
  const totalItemCount = quoteItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigateSection('hero')}
          className="text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 rounded py-1 shrink-0"
        >
          <span className="font-serif-brand text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
            錦源 KAM YUEN · 1968
          </span>
        </button>

        {/* Zone 2: 4–5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => onNavigateSection('catalog')}
            className="hover:text-stone-900 dark:hover:text-white transition-colors underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            產品目錄 Catalog
          </button>
          <button
            onClick={() => onNavigateSection('recipes')}
            className="hover:text-stone-900 dark:hover:text-white transition-colors underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            主廚食譜 Recipes
          </button>
          <button
            onClick={() => onNavigateSection('standards')}
            className="hover:text-stone-900 dark:hover:text-white transition-colors underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            品質認證 Standards
          </button>
          <button
            onClick={() => onNavigateSection('craft')}
            className="hover:text-stone-900 dark:hover:text-white transition-colors underline-offset-8 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            品牌源流 Heritage
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenQuoteDrawer}
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold tracking-wide text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-lg transition-all shadow-sm active:scale-98 whitespace-nowrap cursor-pointer"
            aria-label="View Wholesale Inquiry Basket"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>採購詢價單 Inquiry</span>
            {totalItemCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[11px] font-mono font-bold bg-amber-700 text-white rounded">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
