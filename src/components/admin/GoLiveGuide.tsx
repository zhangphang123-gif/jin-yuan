import React, { useState } from 'react';
import {
  Globe,
  MessageCircle,
  CreditCard,
  Truck,
  Printer,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const GoLiveGuide: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  });

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = Object.keys(checkedItems).length;

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Shopify-Style Storefront Go-Live Roadmap</span>
        </div>
        <h2 className="font-serif-brand text-2xl font-bold tracking-tight">
          獨立商城上線流程與營運指導
        </h2>
        <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
          按照以下 6 大標準步驟，您可快速將本系統從測試環境正式投入商業營運。包含獨立網域綁定、WhatsApp 商業號聯動、FPS/PayMe 收款配置及出單印表機設定。
        </p>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-stone-300 mb-1.5">
            <span>上線準備進度</span>
            <span className="font-mono font-bold text-amber-400">
              {Math.round((completedCount / totalCount) * 100)}% ({completedCount}/{totalCount} 項完成)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-5">
        
        {/* Step 1: Domain & Hosting */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step1')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step1 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-stone-600" />
                  <span>步驟 1：網域綁定與雲端部署 (Custom Domain & SSL)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  讓顧客透過專屬品牌網址（如 shop.jinyuanbakkwa.com 或 Google Sites 自訂網域）進入商城
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 本系統採用標準 Vite + React + TypeScript 現代化架構，執行 <code>npm run build</code> 即可產出高優化靜態發布包。</p>
            <p>2. 可部署於 Google Cloud Run、Cloudflare Pages、Vercel 或您現有的 Google Sites 主頁進行整合跳轉。</p>
            <p>3. 在您的 DNS 託管商（如 Exabytes、Namecheap、Cloudflare）新增 CNAME 指向您的部署網址，系統將自動簽發免憑證費用之 HTTPS SSL 證書。</p>
          </div>
        </div>

        {/* Step 2: WhatsApp Business Integration */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step2')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step2 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>步驟 2：WhatsApp Business 號碼設定與自動化訂單訊息</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  顧客於結帳頁面點擊送出後，系統自動將格式化訂單傳送至店主 WhatsApp（60124947842）
                </p>
              </div>
            </div>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 前往左側選單的 <strong>「店鋪設定」</strong>，確認官方 WhatsApp 號碼為 <code>60124947842</code>（王銮娇 HENG LUAN KEOW）。</p>
            <p>2. 下載並安裝 <strong>WhatsApp Business App</strong>，啟用「問候訊息」及「快速回覆 (Quick Replies)」，設定關鍵字 <code>/duitnow</code> 快速發送收款二維碼。</p>
            <p>3. 顧客下單後點擊按鈕將一鍵帶入商品名、包裝重量、金額與送貨地址，避免手動漏單與對帳混亂。</p>
          </div>
        </div>

        {/* Step 3: Payment Gateway */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step3')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step3 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-stone-600" />
                  <span>步驟 3：金流配置 (DuitNow QR / Touch 'n Go / 銀行轉賬)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  設定您的 DuitNow 識別碼、TNG 電子錢包與 Maybank / Public Bank 戶口
                </p>
              </div>
            </div>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 於後台「店鋪設定」填入您的企業或個人 DuitNow 號碼（<code>012-4947842</code>），結帳頁面將即時展示給顧客。</p>
            <p>2. 顧客於結帳頁面選擇 DuitNow 或 TNG 付款後，在 WhatsApp 回傳匯款收據截圖 (Bank-in Slip)，店主在後台一鍵將訂單付款狀態改為「已付款」。</p>
          </div>
        </div>

        {/* Step 4: Express Shipping */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step4')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step4 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-stone-600" />
                  <span>步驟 4：快遞物流配置 (PosLaju / J&T Express / 免運門檻)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  配置西馬與東馬快遞費率、真空肉乾包裝與免運費門檻
                </p>
              </div>
            </div>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 本系統結帳頁面預設支援全馬快遞直送到府（PosLaju / J&T Express）與檳城北賴門市親臨自取。</p>
            <p>2. 錦源炭烤肉乾皆以食品級真空獨立袋封裝，常溫快遞不易變質；酥香肉鬆與年餅建議使用抗震氣泡袋包裝。</p>
            <p>3. 於後台「店鋪設定」設定免運費門檻（預設滿 RM 300 免運費），達到時購物車自動扣除 RM 10 快遞運費。</p>
          </div>
        </div>

        {/* Step 5: Thermal Printer Packing Slip */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step5')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step5 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-stone-600" />
                  <span>步驟 5：倉庫出單機與 A4 裝箱單列印設定 (出單功能)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  一鍵出單，支援 80mm 熱敏收據印表機或一般雷射印表機
                </p>
              </div>
            </div>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 倉庫人員可在後台訂單列表中點擊 <strong>「出單」</strong> 按鈕，系統立即渲染官方裝箱單 (Packing Slip)。</p>
            <p>2. 列印時在瀏覽器設定中：取消勾選「頁首和頁尾 (Headers and Footers)」，「邊距 (Margins)」設為「無」或「預設」，以獲得最整潔的專業外觀。</p>
            <p>3. 單據包含單號條碼、收件人電話、商品貨號數量及檢驗簽署欄位，方便隨箱出貨。</p>
          </div>
        </div>

        {/* Step 6: Test Order & Pre-Flight Checklist */}
        <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCheck('step6')}
                className="text-stone-700 dark:text-stone-300 hover:text-amber-700 cursor-pointer"
              >
                {checkedItems.step6 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </button>
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>步驟 6：全流程實測 (End-to-End Test Order)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  以顧客身份下單一次，確認 WhatsApp 訊息接收、後台存檔與出單皆正常
                </p>
              </div>
            </div>
          </div>

          <div className="pl-8 text-xs text-stone-600 dark:text-stone-400 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
            <p>1. 點擊頂部導航切換至「前台商城」，挑選 1-2 件商品加入購物車。</p>
            <p>2. 填寫真實手機號碼送出訂單，確認 WhatsApp 窗口是否正確彈出並預載訂單文字。</p>
            <p>3. 返回後台「訂單管理」檢查新訂單是否已自動收錄，並測試點擊「出單」列印。</p>
          </div>
        </div>

      </div>

    </div>
  );
};
