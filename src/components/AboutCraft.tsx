import React from 'react';
import { Award, ShieldCheck, Factory, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const AboutCraft: React.FC = () => {
  return (
    <div className="space-y-16 py-12">
      
      {/* Standards Section */}
      <section id="standards" className="scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold tracking-wider text-amber-800 dark:text-amber-500 uppercase">
            Quality Assurance & Standards
          </span>
          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            國際級嚴苛品控，食安始終如一
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2">
            每一批出廠香料與醬汁均經過多重實驗室指標監測，確保符合各國食品法規與星級廚房標準。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-amber-800 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif-brand text-base font-bold text-stone-900 dark:text-stone-100">
              HACCP 危害分析關鍵控制點
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              自原物料進廠、恆溫倉儲、研磨殺菌至灌裝封蓋，全流程實施 14 項 CCP 點即時溫度與微生物監控。
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-amber-800 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif-brand text-base font-bold text-stone-900 dark:text-stone-100">
              ISO 22000 國際食品安全管理
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              具備完整的可溯源鏈條體系（Traceability），每一罐商品均可倒查原材料批號、採摘時間與加工記錄。
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-amber-800 dark:text-amber-400">
              <Factory className="w-5 h-5" />
            </div>
            <h3 className="font-serif-brand text-base font-bold text-stone-900 dark:text-stone-100">
              無防腐劑與無添加承諾
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              核心純粉系列堅持 100% 天然原磨，不含人工香精、人工色素或防腐劑；香醬利用低溫熟成油封自然保鮮。
            </p>
          </div>
        </div>
      </section>

      {/* Brand Heritage Craft Section */}
      <section id="craft" className="scroll-mt-24 p-8 sm:p-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-800 dark:text-amber-500 uppercase">
              <span>Our Heritage Since 1968</span>
              <span aria-hidden="true">·</span>
              <span>半世紀鼎中堅持</span>
            </div>

            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              錦源好味：以真材實料，成就人間煙火
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              錦源起源於香港傳統香料雜貨批發，數十年來陪伴成千上萬間粵式酒樓、冰室茶餐廳與大排檔成長。我們深知大廚對「鑊氣」與「底味」的嚴苛要求——沙薑必須有其獨特的高山泥土甘芳，XO醬必須絲絲見干貝，黑椒汁必須在鐵板上爆發濃厚不焦的掛汁力。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
                <span>支持餐飲客製化研發與貼牌 (OEM)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
                <span>香港、大灣區及海外貨櫃直運 (FCL/LCL)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
                <span>提供雙語官方出廠規格書與 COA 證書</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
                <span>資深主廚團隊提供菜式調味配比諮詢</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-stone-100 dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-4">
            <h4 className="font-serif-brand text-sm font-bold text-stone-900 dark:text-stone-100">
              商業採購與樣品索取指南
            </h4>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              歡迎五星級酒店、連鎖餐飲集團、航空公司配餐及海外進口商洽談試樣。我們可依您的出餐成本與用量，寄送商業測試試用包。
            </p>
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-1 text-stone-600 dark:text-stone-400">
              <div>企業業務諮詢：+852 2345 6789</div>
              <div>專屬採購電郵：wholesale@comein.com.hk</div>
              <div>總部地址：香港九龍觀塘榮業街錦源物流中心</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
