import React from 'react';
import { Search, Sparkles, ArrowRight, ShieldCheck, Award } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCategory: (catId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSelectCategory
}) => {
  return (
    <section id="hero" className="relative pt-8 pb-14 border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Brand Story & Search */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-800 dark:text-amber-500 uppercase mb-4">
                <span>Hong Kong Culinary Heritage</span>
                <span aria-hidden="true">·</span>
                <span>Est. 1968</span>
                <span aria-hidden="true">·</span>
                <span>F&B Foodservice Master Supply</span>
              </div>

              <h1 className="font-serif-brand text-4xl sm:text-5xl lg:text-[44px] font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.18] mb-6 text-balance">
                傳承半世紀粵味調味哲學，<br />
                為米芝蓮與餐飲名店定製靈魂香氣。
              </h1>

              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed mb-8 max-w-xl">
                錦源 (Kam Yuen) 專注研製頂級香醬、純正高山辛香料研磨粉與港味茶餐原料。嚴格遵循 HACCP 及 ISO 22000 食品安全體系，提供零售精品包裝與餐飲大宗規格，支持規格書下載與快速批發詢價。
              </p>
            </div>

            {/* Live Search Box */}
            <div className="space-y-4">
              <div className="relative max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="搜尋產品名稱、規格或料理用途（例：XO醬、沙薑粉、牛扒汁）..."
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all shadow-xs"
                />
              </div>

              {/* Quick Jump Anchors */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium text-stone-700 dark:text-stone-300">熱門系列：</span>
                <button
                  onClick={() => onSelectCategory('sauces')}
                  className="hover:text-amber-800 dark:hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  蝦米瑤柱XO醬
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => onSelectCategory('powders')}
                  className="hover:text-amber-800 dark:hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  純沙薑粉
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => onSelectCategory('provisions')}
                  className="hover:text-amber-800 dark:hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  香酥紅蔥蒜酥
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => onSelectCategory('breakfast')}
                  className="hover:text-amber-800 dark:hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  茶餐廳西多士糖漿
                </button>
              </div>
            </div>

            {/* Quality Cert Trust Markers */}
            <div className="pt-8 border-t border-stone-200/60 dark:border-stone-800/80 mt-8 flex flex-wrap items-center gap-6 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                <span>HACCP 國際食品安全認證</span>
              </div>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">|</span>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                <span>ISO 22000 質量體系監控</span>
              </div>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">|</span>
              <div>
                <span>全品項規格書與檢驗證明齊備</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero High-Res Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative h-full min-h-[380px] rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-sm bg-stone-100 dark:bg-stone-900">
              <img
                src="/src/assets/images/hero_culinary_pantry_1794477287879.jpg"
                alt="Kam Yuen Artisanal Seasonings and Cantonese Pantry Collection"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-medium mb-1">
                  Master Pantry Collection 2026
                </span>
                <h3 className="font-serif-brand text-xl sm:text-2xl font-bold tracking-tight">
                  精研古法 · 鼎中之味
                </h3>
                <p className="text-xs text-stone-200 mt-1 max-w-md">
                  選料必真，製配必精。每一滴醇香皆經十數道工序陳釀淬鍊。
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
