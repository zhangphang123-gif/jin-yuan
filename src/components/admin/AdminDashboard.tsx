import React, { useState, useMemo } from 'react';
import { StoreOrder, StoreProduct, StoreSettings, OrderStatus, ImageAsset, StorefrontTheme, StoreReferral } from '../../types/store';
import { OrdersTable } from './OrdersTable';
import { ProductManager } from './ProductManager';
import { CustomerList } from './CustomerList';
import { ReferralManager } from './ReferralManager';
import { GoLiveGuide } from './GoLiveGuide';
import { StoreSettingsView } from './StoreSettingsView';
import { GoogleSheetsSync } from './GoogleSheetsSync';
import { AssetManager } from './AssetManager';
import { BannerManager } from './BannerManager';
import { PromoCodeManager } from './PromoCodeManager';
import { HotShowcaseManager } from './HotShowcaseManager';
import { CategoryManager } from './CategoryManager';
import { resolveStoreCategories } from '../../utils/productFilters';
import { INITIAL_PRODUCTS } from '../../data/initialStoreData';
import { exportOrdersToCsv } from '../../utils/orderCsvExport';
import { saveThemeToLocalStorage } from '../../utils/themeStorage';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Compass,
  Settings,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Image as ImageIcon,
  Sliders,
  LogOut,
  RefreshCw,
  AlertCircle,
  Calendar,
  Tag,
  Flame,
  FolderTree,
  Download,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Palette,
  QrCode
} from 'lucide-react';

interface AdminDashboardProps {
  orders: StoreOrder[];
  products: StoreProduct[];
  settings: StoreSettings;
  assets: ImageAsset[];
  adminUser?: { email?: string | null; uid: string } | null;
  isLoadingProducts?: boolean;
  isRefreshingCloud?: boolean;
  isRestoringProducts?: boolean;
  cloudError?: string | null;
  lastSyncedAt?: string | null;
  onRefreshCloudData?: () => void;
  onRestoreStarterProducts?: () => Promise<{ addedCount: number; totalCount: number }>;
  onAdminLogout?: () => void;
  onSwitchToStorefront: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderTracking?: (orderId: string, trackingNumber: string) => Promise<void> | void;
  onPrintInvoice: (order: StoreOrder) => void;
  onUpdateProductStock: (productId: string, newStock: number) => Promise<void> | void;
  onUpdateProductPrice: (productId: string, newPrice: number) => Promise<void> | void;
  onUpdateProductImage: (productId: string, newImage: string) => Promise<void> | void;
  onUpdateProductImages?: (productId: string, images: string[]) => Promise<void> | void;
  onUpdateProduct?: (product: StoreProduct) => Promise<void> | void;
  onAddProduct: (product: StoreProduct) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onAddAsset: (asset: ImageAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onUpdateLogo: (url: string) => Promise<void> | void;
  onUpdateBanner: (url: string) => Promise<void> | void;
  onSaveSettings: (settings: StoreSettings) => Promise<void> | void;
  activeTheme?: StorefrontTheme;
  onSwitchTheme?: (theme: StorefrontTheme) => Promise<void> | void;
  onExportData: () => void;
  onResetData: () => void;
  referrals?: StoreReferral[];
  hasLoadedReferrals?: boolean;
  isLoadingReferrals?: boolean;
  onLoadReferrals?: (force?: boolean) => Promise<void>;
  onSaveReferral?: (referral: StoreReferral) => Promise<void>;
  onDeleteReferral?: (referralId: string) => Promise<void>;
}

function getLocalDateString(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  settings,
  assets,
  adminUser,
  isLoadingProducts = false,
  isRefreshingCloud = false,
  isRestoringProducts = false,
  cloudError = null,
  lastSyncedAt = null,
  onRefreshCloudData,
  onRestoreStarterProducts,
  onAdminLogout,
  onSwitchToStorefront,
  onUpdateOrderStatus,
  onUpdateOrderTracking,
  onPrintInvoice,
  onUpdateProductStock,
  onUpdateProductPrice,
  onUpdateProductImage,
  onUpdateProductImages,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onAddAsset,
  onDeleteAsset,
  onUpdateLogo,
  onUpdateBanner,
  onSaveSettings,
  activeTheme,
  onSwitchTheme,
  onExportData,
  onResetData,
  referrals = [],
  hasLoadedReferrals = false,
  isLoadingReferrals = false,
  onLoadReferrals,
  onSaveReferral,
  onDeleteReferral,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'hot' | 'promos' | 'referrals' | 'banners' | 'assets' | 'customers' | 'sheets' | 'golive' | 'settings'>('orders');
  const categoryCount = resolveStoreCategories(settings).length;

  // Overview Day / Month / Year selector
  const todayStr = getLocalDateString(new Date().toISOString());
  const [overviewPeriod, setOverviewPeriod] = useState<'day' | 'month' | 'year' | 'all'>('day');
  const [overviewDate, setOverviewDate] = useState<string>(todayStr);
  const [overviewMonth, setOverviewMonth] = useState<string>(todayStr.slice(0, 7));
  const [overviewYear, setOverviewYear] = useState<string>(todayStr.slice(0, 4));

  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  const overviewFilteredOrders = useMemo(() => {
    return validOrders.filter((o) => {
      const dateStr = getLocalDateString(o.createdAt);
      if (overviewPeriod === 'day') return dateStr === overviewDate;
      if (overviewPeriod === 'month') return dateStr.slice(0, 7) === overviewMonth;
      if (overviewPeriod === 'year') return dateStr.slice(0, 4) === overviewYear;
      return true;
    });
  }, [validOrders, overviewPeriod, overviewDate, overviewMonth, overviewYear]);

  const totalRevenue = overviewFilteredOrders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const averageOrderValue =
    overviewFilteredOrders.length > 0 ? Math.round(totalRevenue / overviewFilteredOrders.length) : 0;

  const [ordersCsvNotice, setOrdersCsvNotice] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dismissedMissingBanner, setDismissedMissingBanner] = useState(false);
  const [isSwitchingTheme, setIsSwitchingTheme] = useState(false);

  const currentTheme: StorefrontTheme =
    activeTheme === 'luxury_3d' || settings.storefrontTheme === 'luxury_3d'
      ? activeTheme || settings.storefrontTheme || 'classic'
      : activeTheme === 'cny_festive' || settings.storefrontTheme === 'cny_festive'
      ? activeTheme || settings.storefrontTheme || 'classic'
      : 'classic';

  const handleQuickSwitchTheme = async (nextTheme: StorefrontTheme) => {
    if (isSwitchingTheme) return;
    setIsSwitchingTheme(true);
    setRestoreNotice(null);
    saveThemeToLocalStorage(nextTheme);
    try {
      if (onSwitchTheme) {
        await onSwitchTheme(nextTheme);
      } else {
        await onSaveSettings({ ...settings, storefrontTheme: nextTheme });
      }
      setRestoreNotice({
        type: 'success',
        text:
          nextTheme === 'luxury_3d'
            ? '已即時切換為【Version 3：當代頂奢黑金 3D 科技版】並保存至 localStorage 與雲端設定！點擊「返回前台商店」即可體驗 3D 視差與炭火粒子特效。'
            : nextTheme === 'cny_festive'
            ? '已切換為【尊榮新春賀歲版】並保存至 localStorage 與雲端設定！'
            : '已即時切換為【Version 1：經典傳統暖色版】並保存至 localStorage 與雲端設定！',
      });
    } catch (err) {
      setRestoreNotice({
        type: 'error',
        text: err instanceof Error ? `切換前台版本失敗：${err.message}` : '切換前台版本失敗，請重試。',
      });
    } finally {
      setIsSwitchingTheme(false);
    }
  };

  const missingStarterProducts = useMemo(
    () => INITIAL_PRODUCTS.filter((sp) => !products.some((p) => p.id === sp.id)),
    [products]
  );

  const handleTriggerRestoreProducts = async () => {
    if (!onRestoreStarterProducts) return;
    setRestoreNotice(null);
    try {
      const res = await onRestoreStarterProducts();
      setRestoreNotice({
        type: 'success',
        text: `已成功將原本設定好的 ${res.totalCount} 款錦源商品（本次新增 ${res.addedCount} 項）全部錄入並永久保存至雲端資料庫！`,
      });
      setActiveTab('products');
    } catch (err) {
      setRestoreNotice({
        type: 'error',
        text: err instanceof Error ? `錄入商品失敗：${err.message}` : '錄入商品失敗，請確認已使用授權店長 Gmail 登入。',
      });
    }
  };

  const handleExportOrdersCsv = () => {
    if (orders.length === 0) return;
    const exportedCount = exportOrdersToCsv(orders, '全部訂單');
    const msg = `已離線導出 ${exportedCount} 筆訂單至 CSV（零 Firestore 額度消耗）`;
    setOrdersCsvNotice(msg);
    window.setTimeout(() => {
      setOrdersCsvNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-stone-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-stone-800 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand font-bold text-lg text-white">
              {settings.storeName}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700 hidden sm:inline">
              SHOPIFY ADMIN
            </span>
            {onRefreshCloudData && (
              <button
                type="button"
                onClick={onRefreshCloudData}
                disabled={isRefreshingCloud}
                className="inline-flex items-center gap-1.5 text-[11px] bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer disabled:opacity-60"
                title={lastSyncedAt ? `上次同步時間：${lastSyncedAt}` : '手動從雲端重新讀取商品、設定與訂單'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
                <span>{isRefreshingCloud ? '讀取中...' : '🔄 手動刷新雲端'}</span>
                {lastSyncedAt && (
                  <span className="hidden xl:inline text-[10px] font-mono text-stone-400">
                    ({lastSyncedAt})
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick 1-Click Storefront UI Design Switcher */}
          <div
            className="hidden md:flex items-center gap-1 bg-stone-800 p-1 rounded-lg border border-stone-700 text-[11px]"
            role="group"
            aria-label="切換前台官網設計風格"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5 shrink-0" />
            <button
              type="button"
              disabled={isSwitchingTheme}
              onClick={() => handleQuickSwitchTheme('classic')}
              className={`px-2 py-1 rounded font-bold transition cursor-pointer whitespace-nowrap ${
                currentTheme === 'classic'
                  ? 'bg-red-800 text-white shadow-2xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              V1 經典版
            </button>
            <button
              type="button"
              disabled={isSwitchingTheme}
              onClick={() => handleQuickSwitchTheme('luxury_3d')}
              className={`px-2 py-1 rounded font-bold transition cursor-pointer whitespace-nowrap ${
                currentTheme === 'luxury_3d'
                  ? 'bg-[#E5B869] text-[#0B0807] shadow-2xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              V3 黑金3D版
            </button>
          </div>

          {adminUser && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-stone-300 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{adminUser.email || 'Admin'}</span>
            </div>
          )}

          <button
            onClick={onSwitchToStorefront}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">返回前台商店</span>
            <span className="sm:hidden">商店</span>
          </button>

          {onAdminLogout && (
            <button
              onClick={onAdminLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:text-white bg-red-950/80 hover:bg-red-900 border border-red-800 rounded-lg transition-colors cursor-pointer"
              title="退出管理員登入"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">安全登出</span>
            </button>
          )}
        </div>
      </header>

      {/* TOP PROMINENT STOREFRONT THEME VERSION SWITCHER PANEL */}
      <section
        aria-label="网站前台视觉版本切换"
        className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-4"
      >
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-[#1E0E0B] to-stone-900 text-white border border-amber-400/35 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <h2 className="font-serif-brand text-base sm:text-lg font-bold text-amber-200 flex items-center gap-2">
                <span>🎨 网站前台视觉版本切换</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  即時生效 · localStorage 已同步
                </span>
              </h2>
              <p className="text-xs text-stone-300">
                一鍵切換前台視覺版本，所有商品目錄、克重規格、購物袋與 WhatsApp 下單功能完全共用。
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSwitchingTheme}
                onClick={() => handleQuickSwitchTheme('cny_festive')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  currentTheme === 'cny_festive'
                    ? 'bg-[#7A1215] text-[#F9E8C4] border-amber-400'
                    : 'bg-stone-800/70 text-stone-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                🧧 新春賀歲版
              </button>
              <button
                type="button"
                onClick={onSwitchToStorefront}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                立即預覽前台 →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Version 1: Classic Warm Traditional */}
            <button
              type="button"
              disabled={isSwitchingTheme}
              onClick={() => handleQuickSwitchTheme('classic')}
              className={`text-left p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between gap-4 ${
                currentTheme === 'classic'
                  ? 'bg-white text-stone-900 border-red-600 shadow-md ring-2 ring-red-500/30'
                  : 'bg-stone-950/60 text-stone-200 border-stone-700 hover:border-stone-500'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif-brand font-bold text-sm sm:text-base">
                    Version 1：经典传统暖色版
                  </span>
                  {currentTheme === 'classic' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-800 text-white text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 使用中
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${currentTheme === 'classic' ? 'text-stone-600' : 'text-stone-400'}`}>
                  完整保留現有白底紅金傳統佈局、經典輪播與側邊篩選樣式。
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-4 h-4 rounded-full bg-red-800 border border-amber-400" />
                <span className="w-4 h-4 rounded-full bg-stone-50 border border-stone-300" />
              </div>
            </button>

            {/* Version 3: Modern Dark Luxury 3D Tech */}
            <button
              type="button"
              disabled={isSwitchingTheme}
              onClick={() => handleQuickSwitchTheme('luxury_3d')}
              className={`text-left p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between gap-4 ${
                currentTheme === 'luxury_3d'
                  ? 'bg-gradient-to-br from-[#0B0807] to-[#1E0A09] text-[#F6DFA9] border-[#E5B869] shadow-md ring-2 ring-[#E5B869]/35'
                  : 'bg-stone-950/60 text-stone-200 border-stone-700 hover:border-[#E5B869]/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif-brand font-bold text-sm sm:text-base">
                    Version 3：当代顶奢黑金 3D 科技版
                  </span>
                  {currentTheme === 'luxury_3d' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E5B869] text-[#0B0807] text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 使用中
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${currentTheme === 'luxury_3d' ? 'text-[#D6C7B2]' : 'text-stone-400'}`}>
                  暗夜炭金漸層、磨砂玻璃、炭火粒子畫布、3D 傾斜視差與聚光燈 Bento 網格。
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-4 h-4 rounded-full bg-[#0B0807] border border-[#E5B869]" />
                <span className="w-4 h-4 rounded-full bg-[#E5B869] border border-[#7A1215]" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {cloudError && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-4">
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-bold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{cloudError}</span>
            </div>
            {onRefreshCloudData && (
              <button
                type="button"
                onClick={onRefreshCloudData}
                disabled={isRefreshingCloud}
                className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
              >
                重新讀取
              </button>
            )}
          </div>
        </div>
      )}

      {restoreNotice && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-4">
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
              restoreNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {restoreNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{restoreNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setRestoreNotice(null)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!isLoadingProducts && missingStarterProducts.length > 0 && !dismissedMissingBanner && onRestoreStarterProducts && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-amber-50 border border-amber-400/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div className="space-y-1 pr-6 md:pr-0">
              <div className="font-serif-brand font-bold text-sm sm:text-base text-amber-200 flex items-center gap-2">
                <Package className="w-4 h-4 shrink-0" />
                <span>
                  {products.length === 0
                    ? `目前新 Firebase 資料庫 (jinyuan-92d37) 商品列表為空（0 項商品）`
                    : `偵測到 ${missingStarterProducts.length} 款新上架預設商品尚未寫入雲端資料庫`}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {products.length === 0 ? (
                  <>
                    系統已保留您先前設定好的全部 <strong>{INITIAL_PRODUCTS.length} 款錦源商品</strong>（含原味豬/雞/迷你肉乾、黑胡椒/麻辣/切片、8款造型肉乾、肉鬆與 90g 方便裝、臘味、燒臘、年餅及節慶限定）。點擊右側按鈕即可一鍵全部錄入雲端，且不影響現有店鋪設定與訂單：
                  </>
                ) : (
                  <>
                    尚未同步的商品：<strong className="text-amber-200">{missingStarterProducts.map((p) => p.nameZh).join('、')}</strong>。點擊右側按鈕即可一鍵補齊寫入雲端，<strong>絕不覆蓋</strong>現有商品價格、圖片與店鋪設定。
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTriggerRestoreProducts}
                disabled={isRestoringProducts}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-60"
              >
                {isRestoringProducts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在寫入 {missingStarterProducts.length} 款商品至雲端...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {products.length === 0
                        ? `一鍵錄入原本全部 ${INITIAL_PRODUCTS.length} 款商品`
                        : `一鍵補齊寫入這 ${missingStarterProducts.length} 款商品`}
                    </span>
                  </>
                )}
              </button>
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDismissedMissingBanner(true)}
                  className="p-2 text-amber-200/70 hover:text-white cursor-pointer"
                  title="暫時隱藏此提醒"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Layout: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Left Shopify-style Sidebar (Compact 3-col Tile Grid on Phone, Vertical Sidebar on Desktop) */}
        <aside className="w-full md:w-60 bg-white dark:bg-stone-900 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 p-2.5 sm:p-4 shrink-0 space-y-2.5 md:space-y-0">
          {/* Mobile 1-Click UI Design Switcher */}
          <div className="md:hidden flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 text-[11px]">
            <span className="font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1 shrink-0">
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>前台版本</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isSwitchingTheme}
                onClick={() => handleQuickSwitchTheme('classic')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  currentTheme === 'classic'
                    ? 'bg-red-800 text-white'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                }`}
              >
                V1 經典
              </button>
              <button
                type="button"
                disabled={isSwitchingTheme}
                onClick={() => handleQuickSwitchTheme('luxury_3d')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  currentTheme === 'luxury_3d'
                    ? 'bg-[#0B0807] text-[#E5B869] border border-[#E5B869]'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                }`}
              >
                V3 黑金3D
              </button>
            </div>
          </div>

          <div className="hidden md:block text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 py-2">
            管理選單 (Navigation)
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:flex md:flex-col gap-1.5 md:gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'overview'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="md:hidden">總覽概況</span>
              <span className="hidden md:inline">總覽概況 Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`relative flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'orders'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="md:hidden">訂單出單</span>
                <span className="hidden md:inline">訂單管理 Orders</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="md:static absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-700 text-white rounded">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'products'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="md:hidden">商品多圖</span>
              <span className="hidden md:inline">商品與多圖 Products</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'categories'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <FolderTree className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="md:hidden">分類管理</span>
                <span className="hidden md:inline">分類管理 Categories</span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-stone-400 font-bold">
                {categoryCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hot')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'hot'
                  ? 'bg-red-900 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <Flame className="w-4 h-4 text-red-600 dark:text-amber-400 shrink-0" />
                <span className="md:hidden">熱門排序</span>
                <span className="hidden md:inline">熱門展示排序 Hot Picks</span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-amber-500 font-bold">
                {(settings.featuredProductIds || []).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('promos')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'promos'
                  ? 'bg-red-900 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <Tag className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span className="md:hidden">優惠碼</span>
                <span className="hidden md:inline">優惠碼管理 Promos</span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-red-500 font-bold">
                {(settings.promoCodes || []).filter((p) => p.active).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'referrals'
                  ? 'bg-red-900 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="md:hidden">推廣代理</span>
                <span className="hidden md:inline">推廣員 / 代理 Referral</span>
              </div>
              {referrals.length > 0 && (
                <span className="hidden md:inline text-[10px] font-mono text-amber-500 font-bold">
                  {referrals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'banners'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="md:hidden">橫幅輪播</span>
                <span className="hidden md:inline">輪播與公告 Banners</span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-amber-500 font-bold">
                {settings.bannerSlides?.length || 5}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assets')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'assets'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="md:hidden">圖片素材</span>
                <span className="hidden md:inline">圖片素材管理 Assets</span>
              </div>
              <span className="hidden md:inline text-[10px] font-mono text-stone-400 font-bold">
                {assets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'customers'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="md:hidden">顧客名冊</span>
              <span className="hidden md:inline">顧客名冊 Customers</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'sheets'
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="md:hidden">試算表</span>
                <span className="hidden md:inline">Google 試算表連動</span>
              </div>
              {settings.googleSheetId && (
                <span className="hidden md:inline w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('golive')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left md:mt-3 md:pt-3 md:border-t md:border-stone-200 md:dark:border-stone-800 ${
                activeTab === 'golive'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="md:hidden">上線指南</span>
              <span className="hidden md:inline">上線流程指導 Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2.5 px-2 md:px-3 py-2 text-[11px] md:text-xs font-medium rounded-lg transition-colors cursor-pointer text-center md:text-left ${
                activeTab === 'settings'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                  : 'text-stone-600 dark:text-stone-300 bg-stone-50 md:bg-transparent dark:bg-stone-800/40 md:dark:bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="md:hidden">店鋪設定</span>
              <span className="hidden md:inline">店鋪設定 Settings</span>
            </button>
          </div>
        </aside>

        {/* Right Main Admin Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-brand text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                    營運數據總覽 (Store Analytics)
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    可切換「一日 / 一月 / 一年 / 全部」查看各時段進賬營業額與訂單表現
                  </p>
                </div>

                {/* Day / Month / Year Controls */}
                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-stone-900 p-2 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs text-xs">
                  <Calendar className="w-4 h-4 text-red-700 ml-1" />
                  {(
                    [
                      { id: 'day', label: '日結' },
                      { id: 'month', label: '月結' },
                      { id: 'year', label: '年結' },
                      { id: 'all', label: '全部' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOverviewPeriod(p.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                        overviewPeriod === p.id
                          ? 'bg-red-900 text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  {overviewPeriod === 'day' && (
                    <input
                      type="date"
                      value={overviewDate}
                      onChange={(e) => setOverviewDate(e.target.value)}
                      className="px-2 py-1 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 font-mono"
                    />
                  )}
                  {overviewPeriod === 'month' && (
                    <input
                      type="month"
                      value={overviewMonth}
                      onChange={(e) => setOverviewMonth(e.target.value)}
                      className="px-2 py-1 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 font-mono"
                    />
                  )}
                  {overviewPeriod === 'year' && (
                    <select
                      value={overviewYear}
                      onChange={(e) => setOverviewYear(e.target.value)}
                      className="px-2 py-1 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 font-mono"
                    >
                      <option value="2026">2026 年</option>
                      <option value="2025">2025 年</option>
                      <option value="2027">2027 年</option>
                    </select>
                  )}
                </div>
              </div>

              {/* KPI Cards Strip (2 Columns on Phone, 4 Columns on Desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="p-3.5 sm:p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500">
                    <span className="truncate">
                      {overviewPeriod === 'day'
                        ? `${overviewDate} 營業額`
                        : overviewPeriod === 'month'
                        ? `${overviewMonth} 月營業額`
                        : overviewPeriod === 'year'
                        ? `${overviewYear} 年營業額`
                        : '累計總營業額'}
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                    RM {totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>{overviewFilteredOrders.length} 筆有效進賬</span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500">
                    <span>訂單總數</span>
                    <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                    {overviewFilteredOrders.length} 筆
                  </div>
                  <div className="text-[11px] text-stone-500">
                    待處理: <strong className="text-amber-800 dark:text-amber-400">{pendingOrdersCount}</strong> 筆
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500">
                    <span>平均客單價</span>
                    <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                    RM {averageOrderValue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    免運門檻: RM {settings.freeShippingThreshold}
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500">
                    <span>商品總庫存</span>
                    <Package className="w-4 h-4 text-purple-600 shrink-0" />
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                    {products.reduce((a, b) => a + b.stock, 0)} 件
                  </div>
                  <div className="text-[11px] text-stone-500">
                    共 {products.length} 款商品
                  </div>
                </div>
              </div>

              {/* Quick Jump into Pending Orders */}
              <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100">
                    時段進單紀錄 ({overviewFilteredOrders.length} 筆)
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    進入完整訂單與按日明細 →
                  </button>
                </div>

                <OrdersTable
                  orders={overviewFilteredOrders.slice(0, 5)}
                  referrals={referrals}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  onUpdateOrderTracking={onUpdateOrderTracking}
                  onPrintInvoice={onPrintInvoice}
                  settings={settings}
                  showSummaryCards={false}
                />
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-brand text-2xl font-bold text-stone-900 dark:text-stone-100">
                    訂單管理、日/月/年營業額與 PDF 出單
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    支援查看單日/單月/全年營業額並按日篩選訂單 · 可「導出至 CSV」離線備份與分析每週銷量（零 Firestore 額度消耗） · 點擊「PDF出單」即可下載收據 PDF
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportOrdersCsv}
                    disabled={orders.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="將目前載入的所有訂單離線轉換為 CSV 檔下載，不消耗任何 Firestore 讀寫額度"
                  >
                    <Download className="w-4 h-4" />
                    <span>導出至 CSV ({orders.length})</span>
                  </button>
                </div>
              </div>

              {ordersCsvNotice && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ordersCsvNotice}</span>
                </div>
              )}

              <OrdersTable
                orders={orders}
                referrals={referrals}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdateOrderTracking={onUpdateOrderTracking}
                onPrintInvoice={onPrintInvoice}
                settings={settings}
              />
            </div>
          )}

          {/* TAB 3: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && (
            <ProductManager
              products={products}
              settings={settings}
              onSaveSettings={onSaveSettings}
              onUpdateProductStock={onUpdateProductStock}
              onUpdateProductPrice={onUpdateProductPrice}
              onUpdateProductImage={onUpdateProductImage}
              onUpdateProductImages={onUpdateProductImages}
              onUpdateProduct={onUpdateProduct}
              onAddProduct={onAddProduct}
              onDeleteProduct={onDeleteProduct}
              onInitializeStarterCatalog={handleTriggerRestoreProducts}
              isInitializingStarterCatalog={isRestoringProducts}
            />
          )}

          {/* TAB: CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <CategoryManager
              products={products}
              settings={settings}
              onSaveSettings={onSaveSettings}
              onUpdateProduct={onUpdateProduct}
            />
          )}

          {/* TAB: HOT SHOWCASE ORDER MANAGER */}
          {activeTab === 'hot' && (
            <HotShowcaseManager
              products={products}
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          )}

          {/* TAB: PROMO CODES */}
          {activeTab === 'promos' && (
            <PromoCodeManager
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          )}

          {/* TAB: REFERRAL AGENTS & QR CODE TRACKING */}
          {activeTab === 'referrals' && onLoadReferrals && onSaveReferral && onDeleteReferral && (
            <ReferralManager
              referrals={referrals}
              orders={orders}
              settings={settings}
              hasLoadedReferrals={hasLoadedReferrals}
              isLoadingReferrals={isLoadingReferrals}
              onLoadReferrals={onLoadReferrals}
              onSaveReferral={onSaveReferral}
              onDeleteReferral={onDeleteReferral}
            />
          )}

          {/* TAB: BANNERS & SLIDING PROMOTIONS */}
          {activeTab === 'banners' && (
            <BannerManager
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          )}

          {/* TAB: ASSET MANAGEMENT */}
          {activeTab === 'assets' && (
            <AssetManager
              assets={assets}
              products={products}
              settings={settings}
              onAddAsset={onAddAsset}
              onDeleteAsset={onDeleteAsset}
              onUpdateLogo={onUpdateLogo}
              onUpdateBanner={onUpdateBanner}
              onUpdateProductImage={onUpdateProductImage}
            />
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <CustomerList orders={orders} settings={settings} />
          )}

          {/* TAB: GOOGLE SHEETS SYNC */}
          {activeTab === 'sheets' && (
            <GoogleSheetsSync
              orders={orders}
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          )}

          {/* TAB 5: GO-LIVE ROADMAP */}
          {activeTab === 'golive' && <GoLiveGuide />}

          {/* TAB 6: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <StoreSettingsView
              settings={settings}
              onSaveSettings={onSaveSettings}
              onExportData={onExportData}
              onResetData={onResetData}
            />
          )}

        </main>

      </div>

    </div>
  );
};
