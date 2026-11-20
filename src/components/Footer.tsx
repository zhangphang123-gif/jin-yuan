import React from 'react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection }) => {
  return (
    <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-950/80 py-12 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8 border-b border-stone-200 dark:border-stone-800">
          
          <div className="space-y-3 max-w-sm">
            <span className="font-serif-brand text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              錦源 KAM YUEN · 1968
            </span>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              錦源企業（香港）有限公司旗下品牌。傳承中華經典調味工藝，提供現代餐飲供應鏈解決方案。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                產品目錄
              </span>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><button onClick={() => onNavigateSection('catalog')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">香醬系列</button></li>
                <li><button onClick={() => onNavigateSection('catalog')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">調味粉系列</button></li>
                <li><button onClick={() => onNavigateSection('catalog')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">乾貨雜貨</button></li>
                <li><button onClick={() => onNavigateSection('catalog')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">急凍點心</button></li>
              </ul>
            </div>

            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                品質體系
              </span>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><button onClick={() => onNavigateSection('standards')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">HACCP 認證</button></li>
                <li><button onClick={() => onNavigateSection('standards')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">ISO 22000</button></li>
                <li><button onClick={() => onNavigateSection('standards')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">無添加承諾</button></li>
                <li><button onClick={() => onNavigateSection('standards')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">檢驗報告 (COA)</button></li>
              </ul>
            </div>

            <div>
              <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-2">
                商務協作
              </span>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-400">
                <li><button onClick={() => onNavigateSection('craft')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">餐飲樣品索取</button></li>
                <li><button onClick={() => onNavigateSection('craft')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">OEM 貼牌客製</button></li>
                <li><button onClick={() => onNavigateSection('craft')} className="hover:text-stone-900 dark:hover:text-white cursor-pointer">大宗集裝箱出口</button></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © 1968–2026 錦源企業（香港）有限公司 Kam Yuen Enterprise (HK) Co., Ltd. 版權所有
          </div>
          <div className="flex items-center gap-4">
            <span>商業採購熱線: +852 2345 6789</span>
            <span>·</span>
            <span>官方網站: comein.com.hk</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
