import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  StoreProduct,
  CartItem,
  StoreOrder,
  StoreSettings,
  OrderStatus,
  ImageAsset,
  StoreReferral,
  StorefrontTheme
} from './types/store';
import {
  INITIAL_SETTINGS,
  INITIAL_ASSETS
} from './data/initialStoreData';
import { StorefrontView } from './components/storefront/StorefrontView';
import { FestiveCnyStorefront } from './components/storefront/FestiveCnyStorefront';
import { Luxury3dStorefront } from './components/storefront/Luxury3dStorefront';
import { BrandStoryView } from './components/storefront/BrandStoryView';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutModal } from './components/storefront/CheckoutModal';
import { OrderSuccessModal } from './components/storefront/OrderSuccessModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { InvoicePrintView } from './components/admin/InvoicePrintView';
import { getAccessToken } from './utils/firebaseAuth';
import { appendOrderToSheet } from './utils/googleSheets';
import { setCloudinaryRuntimeConfig } from './utils/cloudinaryService';
import { sortCatalogProducts } from './utils/productFilters';
import { generatePageMeta, syncDynamicSeoMetadata } from './utils/seo';
import { captureReferralFromUrl, clearReferralTracking } from './utils/referralTracker';
import { getSavedThemeFromLocalStorage, saveThemeToLocalStorage } from './utils/themeStorage';
import { useLanguage } from './context/LanguageContext';
import { CheckCircle2 } from 'lucide-react';
import {
  fetchProductsFromFirestore,
  fetchOrdersFromFirestore,
  fetchStoreSettingsFromFirestore,
  fetchReferralsFromFirestore,
  saveReferralToFirestore,
  deleteReferralFromFirestore,
  syncReferralDirectoryToSettings,
  saveProductToFirestore,
  deleteProductFromFirestore,
  updateProductStockInFirestore,
  updateProductPriceInFirestore,
  updateProductImageInFirestore,
  updateProductImagesInFirestore,
  createCustomerOrderInFirestore,
  updateOrderStatusInFirestore,
  updateOrderTrackingInFirestore,
  markOrderSyncedInFirestore,
  saveStoreSettingsToFirestore,
  restoreStarterProductsToFirestore,
  mergePendingNewReleaseProducts,
  autoSyncNewReleaseProductsIfNeeded,
  resetCatalogToDefaultsInFirestore,
  onAdminAuthStateChanged,
  adminLogout,
  isAllowedAdminUser,
  isQuotaExceededError
} from './utils/firebaseService';

export default function App() {
  const isAdminRoute = () =>
    typeof window !== 'undefined' &&
    (window.location.pathname === '/admin' || window.location.hash === '#admin');

  // Current view mode: 'storefront' | 'story' | 'admin'
  const [currentView, setCurrentView] = useState<'storefront' | 'story' | 'admin'>('storefront');

  // Firebase Admin Auth state
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(() => isAdminRoute());

  // 100% Cloud Firestore state (no localStorage fallback, no hardcoded default-product overwrite)
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [localThemeOverride, setLocalThemeOverride] = useState<StorefrontTheme | null>(() =>
    getSavedThemeFromLocalStorage()
  );
  const [isLoadingCloudData, setIsLoadingCloudData] = useState<boolean>(true);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState<boolean>(false);
  const [isRestoringProducts, setIsRestoringProducts] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Shopping cart, referrals (lazy-loaded on admin tab only), & gallery assets
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [assets, setAssets] = useState<ImageAsset[]>(INITIAL_ASSETS);
  const [referrals, setReferrals] = useState<StoreReferral[]>([]);
  const [hasLoadedReferrals, setHasLoadedReferrals] = useState<boolean>(false);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(false);

  // Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState('');
  const [appliedFreeShipping, setAppliedFreeShipping] = useState(false);
  const [appliedFreeGift, setAppliedFreeGift] = useState('');
  const [completedOrderForSuccess, setCompletedOrderForSuccess] = useState<StoreOrder | null>(null);
  const [orderForInvoicePrint, setOrderForInvoicePrint] = useState<StoreOrder | null>(null);
  const [cartToast, setCartToast] = useState<{ nameZh: string; nameEn: string; weight: string } | null>(null);
  const { t } = useLanguage();

  // Guards to ensure one-time load on mount / per signed-in admin without any StrictMode/focus loop
  const hasLoadedPublicRef = useRef(false);
  const hasAutoSyncedNewReleaseRef = useRef(false);
  const loadedOrdersForUidRef = useRef<string | null>(null);
  const adminUserRef = useRef<User | null>(null);
  adminUserRef.current = adminUser;
  const referralsRef = useRef<StoreReferral[]>([]);
  referralsRef.current = referrals;
  const cartToastTimerRef = useRef<number | null>(null);

  // Keep Cloudinary runtime credentials in sync with loaded store settings
  useEffect(() => {
    setCloudinaryRuntimeConfig({
      cloudName: settings.cloudinaryCloudName,
      uploadPreset: settings.cloudinaryUploadPreset,
    });
  }, [settings.cloudinaryCloudName, settings.cloudinaryUploadPreset]);

  const loadPublicCatalogAndSettings = useCallback(async () => {
    setCloudError(null);
    const [cloudProducts, cloudSettings] = await Promise.all([
      fetchProductsFromFirestore(),
      fetchStoreSettingsFromFirestore(),
    ]);
    setProducts(mergePendingNewReleaseProducts(cloudProducts, cloudSettings));
    setSettings(cloudSettings);
    setLastSyncedAt(new Date().toLocaleTimeString('zh-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const loadProtectedOrders = useCallback(async () => {
    const cloudOrders = await fetchOrdersFromFirestore();
    setOrders(cloudOrders);
    setLastSyncedAt(new Date().toLocaleTimeString('zh-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const handleLoadReferrals = useCallback(async (force = false) => {
    if (!adminUserRef.current || !isAllowedAdminUser(adminUserRef.current)) return;
    if (!force && hasLoadedReferrals) return;
    setIsLoadingReferrals(true);
    try {
      const list = await fetchReferralsFromFirestore();
      setReferrals(list);
      setHasLoadedReferrals(true);
    } catch (err) {
      console.error('Referrals fetch failed:', err);
      setCloudError(
        isQuotaExceededError(err)
          ? 'Firebase 額度已達上限，推廣員列表暫無法讀取。'
          : err instanceof Error
          ? `讀取推廣員列表失敗：${err.message}`
          : '讀取推廣員列表失敗，請稍後重試。'
      );
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [hasLoadedReferrals]);

  // Manual Refresh Button Handler (used by Admin top bar or error retry banner)
  const handleRefreshAllCloudData = useCallback(async () => {
    setIsRefreshingCloud(true);
    setCloudError(null);
    try {
      await loadPublicCatalogAndSettings();
      if (adminUserRef.current && isAllowedAdminUser(adminUserRef.current)) {
        await loadProtectedOrders();
        if (hasLoadedReferrals) {
          await handleLoadReferrals(true);
        }
      }
    } catch (err) {
      console.error('Manual cloud refresh failed:', err);
      setCloudError(
        isQuotaExceededError(err)
          ? 'Firebase 免費額度已達今日上限，暫時無法讀取雲端資料，請稍後或明日重置後再按「重新整理」。'
          : err instanceof Error
          ? `讀取雲端資料失敗：${err.message}`
          : '讀取雲端資料失敗，請檢查網路連線後重試。'
      );
    } finally {
      setIsRefreshingCloud(false);
    }
  }, [loadPublicCatalogAndSettings, loadProtectedOrders, hasLoadedReferrals, handleLoadReferrals]);

  // 1. Subscribe ONLY to Firebase Auth state (no Firestore listeners!)
  useEffect(() => {
    const unsubAuth = onAdminAuthStateChanged((user) => {
      const authorized = isAllowedAdminUser(user) ? user : null;
      setAdminUser(authorized);
      setIsAuthReady(true);
      if (authorized && isAdminRoute()) {
        setCurrentView('admin');
        setIsAdminLoginOpen(false);
      } else if (!authorized) {
        setCurrentView((prev) => (prev === 'admin' ? 'storefront' : prev));
      }
    });

    const handlePopState = () => {
      if (isAdminRoute()) {
        if (adminUserRef.current && isAllowedAdminUser(adminUserRef.current)) {
          setCurrentView('admin');
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubAuth();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 2. ONE-TIME initial read of Products + Store Settings on page mount (getDocs / getDoc)
  useEffect(() => {
    if (hasLoadedPublicRef.current) return;
    hasLoadedPublicRef.current = true;

    let cancelled = false;
    setIsLoadingCloudData(true);

    loadPublicCatalogAndSettings()
      .catch((err) => {
        if (cancelled) return;
        console.error('Initial cloud catalog fetch failed:', err);
        setCloudError(
          isQuotaExceededError(err)
            ? 'Firebase Firestore 今日免費讀取額度已達上限，請稍後重試或檢查專案額度。'
            : '無法連線至雲端資料庫，請點擊「重新讀取」重試。'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCloudData(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadPublicCatalogAndSettings]);

  // 3. ONE-TIME read of protected Orders ONLY when authorized Admin signs in (no onSnapshot, no auto-seeding)
  useEffect(() => {
    if (!isAuthReady) return;

    if (!adminUser) {
      loadedOrdersForUidRef.current = null;
      setOrders([]);
      return;
    }

    if (loadedOrdersForUidRef.current === adminUser.uid) {
      return;
    }
    loadedOrdersForUidRef.current = adminUser.uid;

    let cancelled = false;
    loadProtectedOrders().catch((err) => {
      if (cancelled) return;
      console.error('Initial orders fetch failed:', err);
      setCloudError(
        isQuotaExceededError(err)
          ? 'Firebase 額度已達上限，訂單清單暫無法讀取。'
          : '訂單讀取失敗，請點擊上方「手動刷新雲端資料」重試。'
      );
    });

    return () => {
      cancelled = true;
    };
  }, [adminUser, isAuthReady, loadProtectedOrders]);

  // 4. One-time background batch write for newly added store SKUs (e.g. 90g RM 12 Pork/Chicken Floss) once admin is signed in
  useEffect(() => {
    if (
      !isAuthReady ||
      !adminUser ||
      isLoadingCloudData ||
      products.length === 0 ||
      hasAutoSyncedNewReleaseRef.current
    ) {
      return;
    }

    hasAutoSyncedNewReleaseRef.current = true;
    autoSyncNewReleaseProductsIfNeeded(products, settings)
      .then((res) => {
        if (!res) return;
        setProducts(res.products);
        setSettings(res.settings);
      })
      .catch((err) => {
        console.warn('Auto-sync of new starter products skipped:', err);
      });
  }, [isAuthReady, adminUser, isLoadingCloudData, products, settings]);

  // 0. Purely local silent capture of ?ref=xxx (ZERO Firebase reads!)
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  const effectiveTheme: StorefrontTheme = localThemeOverride ?? settings.storefrontTheme ?? 'classic';

  // 5. Generate unique meta title & description from current catalog/settings and keep SEO tags synced
  useEffect(() => {
    const themedSettings = { ...settings, storefrontTheme: effectiveTheme };
    const pageMeta = generatePageMeta(themedSettings, products, currentView);
    document.title = pageMeta.title;
    syncDynamicSeoMetadata(themedSettings, products, currentView);
  }, [settings, products, currentView, effectiveTheme]);

  // Admin Guarded Entry Handler
  const handleRequestAdminView = () => {
    if (adminUser && isAllowedAdminUser(adminUser)) {
      setCurrentView('admin');
      setIsAdminLoginOpen(false);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoginOpen(false);
    setCurrentView('admin');
  };

  const handleAdminLogout = async () => {
    try {
      await adminLogout();
      loadedOrdersForUidRef.current = null;
      setOrders([]);
      setReferrals([]);
      setHasLoadedReferrals(false);
      setCurrentView('storefront');
      if (typeof window !== 'undefined' && isAdminRoute()) {
        window.history.replaceState(null, '', '/');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Asset operations
  const handleAddAsset = (newAsset: ImageAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleUpdateLogo = async (url: string) => {
    const saved = await saveStoreSettingsToFirestore({ ...settings, logoUrl: url });
    setSettings(saved);
  };

  const handleUpdateBanner = async (url: string) => {
    const saved = await saveStoreSettingsToFirestore({ ...settings, heroBannerUrl: url });
    setSettings(saved);
  };

  // Cart operations with weight specs support
  const handleAddToCart = (product: StoreProduct, selectedWeight?: string, selectedPrice?: number) => {
    const weight = selectedWeight || product.unitWeight;
    const price = selectedPrice !== undefined ? selectedPrice : product.price;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && (item.weightVariant || item.product.unitWeight) === weight
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && (item.weightVariant || item.product.unitWeight) === weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity: 1,
          weightVariant: weight,
          selectedPrice: price,
        },
      ];
    });

    setCartToast({
      nameZh: product.nameZh,
      nameEn: product.nameEn,
      weight,
    });
    if (cartToastTimerRef.current !== null) {
      window.clearTimeout(cartToastTimerRef.current);
    }
    cartToastTimerRef.current = window.setTimeout(() => {
      setCartToast(null);
      cartToastTimerRef.current = null;
    }, 2400);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number, weightVariant?: string) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, weightVariant);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        const isMatch =
          item.productId === productId &&
          (!weightVariant || (item.weightVariant || item.product.unitWeight) === weightVariant);
        return isMatch ? { ...item, quantity } : item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string, weightVariant?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        const isMatch =
          item.productId === productId &&
          (!weightVariant || (item.weightVariant || item.product.unitWeight) === weightVariant);
        return !isMatch;
      })
    );
  };

  const handleProceedToCheckout = (checkoutPromo: {
    discount: number;
    promoCode: string;
    freeShipping: boolean;
    freeGiftName?: string;
  }) => {
    setAppliedDiscount(checkoutPromo.discount);
    setAppliedPromo(checkoutPromo.promoCode);
    setAppliedFreeShipping(checkoutPromo.freeShipping);
    setAppliedFreeGift(checkoutPromo.freeGiftName || '');
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Explicit Order submission ("確認下單" button click -> single Firestore write)
  const handleOrderCreated = async (newOrder: StoreOrder) => {
    await createCustomerOrderInFirestore(newOrder);
    clearReferralTracking();

    // Update local state immediately so UI reflects the new order without extra reads
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    setProducts((prev) =>
      prev.map((p) => {
        const orderedItem = newOrder.items.find((item) => item.productId === p.id);
        if (orderedItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - orderedItem.quantity),
          };
        }
        return p;
      })
    );

    setCartItems([]);
    setIsCheckoutOpen(false);
    setCompletedOrderForSuccess(newOrder);

    if (settings.autoSyncToSheets !== false && settings.googleSheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendOrderToSheet(token, settings.googleSheetId, newOrder);
          await markOrderSyncedInFirestore(newOrder.id);
        }
      } catch (err) {
        console.warn('Auto-sync to Google Sheets deferred/failed:', err);
      }
    }
  };

  // Explicit Admin Mutations (Persisted to Cloud Firestore + direct local state sync)
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatusInFirestore(orderId, status);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const handleUpdateOrderTracking = async (orderId: string, trackingNumber: string) => {
    const cleanTracking = trackingNumber.trim();
    await updateOrderTrackingInFirestore(orderId, cleanTracking);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, trackingNumber: cleanTracking } : o))
    );
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    await updateProductStockInFirestore(productId, safeStock);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: safeStock } : p))
    );
  };

  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    const safePrice = Math.max(0, newPrice);
    await updateProductPriceInFirestore(productId, safePrice);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: safePrice } : p))
    );
  };

  const handleUpdateProductImage = async (productId: string, newImage: string) => {
    const target = products.find((p) => p.id === productId);
    const existingImages = target
      ? Array.isArray(target.images) && target.images.length > 0
        ? target.images
        : target.image
        ? [target.image]
        : []
      : undefined;
    const savedImages = await updateProductImageInFirestore(productId, newImage, existingImages);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, image: savedImages[0] || newImage, images: savedImages }
          : p
      )
    );
  };

  const handleUpdateProductImages = async (productId: string, images: string[]) => {
    const savedImages = await updateProductImagesInFirestore(productId, images);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              image: savedImages[0] || p.image,
              images: savedImages,
            }
          : p
      )
    );
  };

  const handleAddProduct = async (newProduct: StoreProduct) => {
    const saved = await saveProductToFirestore(newProduct);
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
      return sortCatalogProducts(next);
    });
  };

  const handleUpdateProduct = async (updatedProduct: StoreProduct) => {
    const saved = await saveProductToFirestore(updatedProduct);
    setProducts((prev) =>
      sortCatalogProducts(prev.map((p) => (p.id === saved.id ? saved : p)))
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductFromFirestore(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    if (settings.featuredProductIds?.includes(productId)) {
      const cleanedSettings: StoreSettings = {
        ...settings,
        featuredProductIds: settings.featuredProductIds.filter((id) => id !== productId),
      };
      try {
        const savedSettings = await saveStoreSettingsToFirestore(cleanedSettings);
        setSettings(savedSettings);
      } catch (err) {
        console.warn('Could not clean deleted product ID from featuredProductIds:', err);
      }
    }
  };

  const handleSaveSettings = async (newSettings: StoreSettings) => {
    const saved = await saveStoreSettingsToFirestore(newSettings);
    if (saved.storefrontTheme) {
      saveThemeToLocalStorage(saved.storefrontTheme);
      setLocalThemeOverride(saved.storefrontTheme);
    }
    setSettings(saved);
  };

  const handleSwitchTheme = async (nextTheme: StorefrontTheme) => {
    saveThemeToLocalStorage(nextTheme);
    setLocalThemeOverride(nextTheme);
    setSettings((prev) => ({ ...prev, storefrontTheme: nextTheme }));
    try {
      const saved = await saveStoreSettingsToFirestore({ ...settings, storefrontTheme: nextTheme });
      setSettings(saved);
    } catch (err) {
      console.warn('Theme saved in localStorage; cloud sync skipped or failed:', err);
    }
  };

  const handleSaveReferral = async (referral: StoreReferral) => {
    const saved = await saveReferralToFirestore(referral);
    const prevList = referralsRef.current;
    const exists = prevList.some((r) => r.id === saved.id);
    const nextReferrals = exists
      ? prevList.map((r) => (r.id === saved.id ? saved : r))
      : [saved, ...prevList];
    referralsRef.current = nextReferrals;
    setReferrals(nextReferrals);
    const directory = await syncReferralDirectoryToSettings(nextReferrals);
    setSettings((prev) => ({ ...prev, referralDirectory: directory }));
  };

  const handleDeleteReferral = async (referralId: string) => {
    await deleteReferralFromFirestore(referralId);
    const nextReferrals = referralsRef.current.filter((r) => r.id !== referralId);
    referralsRef.current = nextReferrals;
    setReferrals(nextReferrals);
    const directory = await syncReferralDirectoryToSettings(nextReferrals);
    setSettings((prev) => ({ ...prev, referralDirectory: directory }));
  };

  // Backup & Explicit Manual Reset
  const handleExportData = () => {
    const data = {
      store: settings.storeName,
      exportedAt: new Date().toISOString(),
      orders,
      products,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jinyuan_shopify_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreStarterProducts = async () => {
    setIsRestoringProducts(true);
    setCloudError(null);
    try {
      const result = await restoreStarterProductsToFirestore();
      setProducts(result.products);
      if (result.initializedSettings) {
        setSettings(result.initializedSettings);
      }
      setLastSyncedAt(
        new Date().toLocaleTimeString('zh-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      return { addedCount: result.addedCount, totalCount: result.products.length };
    } finally {
      setIsRestoringProducts(false);
    }
  };

  const handleResetData = async () => {
    const resetResult = await resetCatalogToDefaultsInFirestore();
    setProducts(resetResult.products);
    setSettings(resetResult.settings);
    setOrders(resetResult.orders);
    setCartItems([]);
  };

  return (
    <>
      {cartToast && currentView === 'storefront' && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xl border border-emerald-400/50 flex items-center gap-2 max-w-[calc(100vw-2rem)] animate-fade pointer-events-none"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="truncate">
            {t(
              `已加入購物車：${cartToast.nameZh}（${cartToast.weight}）`,
              `Added to cart: ${cartToast.nameEn} (${cartToast.weight})`
            )}
          </span>
        </div>
      )}

      {cloudError && currentView !== 'admin' && (
        <div className="bg-red-900 text-amber-100 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-center gap-3 z-50 relative">
          <span>{cloudError}</span>
          <button
            type="button"
            onClick={handleRefreshAllCloudData}
            disabled={isRefreshingCloud}
            className="px-3 py-1 bg-amber-300 text-stone-950 rounded-lg font-bold hover:bg-amber-200 cursor-pointer disabled:opacity-60"
          >
            {isRefreshingCloud ? '重新讀取中...' : '🔄 重新讀取雲端資料'}
          </button>
        </div>
      )}

      {currentView === 'storefront' ? (
        effectiveTheme === 'luxury_3d' ? (
          <Luxury3dStorefront
            products={products}
            cartItems={cartItems}
            settings={settings}
            isLoadingProducts={isLoadingCloudData}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onSwitchToAdmin={handleRequestAdminView}
            onOpenStory={() => setCurrentView('story')}
          />
        ) : effectiveTheme === 'cny_festive' ? (
          <FestiveCnyStorefront
            products={products}
            cartItems={cartItems}
            settings={settings}
            isLoadingProducts={isLoadingCloudData}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onSwitchToAdmin={handleRequestAdminView}
            onOpenStory={() => setCurrentView('story')}
          />
        ) : (
          <StorefrontView
            products={products}
            cartItems={cartItems}
            settings={settings}
            isLoadingProducts={isLoadingCloudData}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onSwitchToAdmin={handleRequestAdminView}
            onOpenStory={() => setCurrentView('story')}
          />
        )
      ) : currentView === 'story' ? (
        <BrandStoryView
          settings={settings}
          onBackToStore={() => setCurrentView('storefront')}
        />
      ) : adminUser ? (
        <AdminDashboard
          orders={orders}
          products={products}
          settings={settings}
          assets={assets}
          adminUser={adminUser}
          isLoadingProducts={isLoadingCloudData}
          isRefreshingCloud={isRefreshingCloud}
          isRestoringProducts={isRestoringProducts}
          cloudError={cloudError}
          lastSyncedAt={lastSyncedAt}
          onRefreshCloudData={handleRefreshAllCloudData}
          onRestoreStarterProducts={handleRestoreStarterProducts}
          onAdminLogout={handleAdminLogout}
          onSwitchToStorefront={() => setCurrentView('storefront')}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateOrderTracking={handleUpdateOrderTracking}
          onPrintInvoice={(order) => setOrderForInvoicePrint(order)}
          onUpdateProductStock={handleUpdateProductStock}
          onUpdateProductPrice={handleUpdateProductPrice}
          onUpdateProductImage={handleUpdateProductImage}
          onUpdateProductImages={handleUpdateProductImages}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddAsset={handleAddAsset}
          onDeleteAsset={handleDeleteAsset}
          onUpdateLogo={handleUpdateLogo}
          onUpdateBanner={handleUpdateBanner}
          onSaveSettings={handleSaveSettings}
          activeTheme={effectiveTheme}
          onSwitchTheme={handleSwitchTheme}
          onExportData={handleExportData}
          onResetData={handleResetData}
          referrals={referrals}
          hasLoadedReferrals={hasLoadedReferrals}
          isLoadingReferrals={isLoadingReferrals}
          onLoadReferrals={handleLoadReferrals}
          onSaveReferral={handleSaveReferral}
          onDeleteReferral={handleDeleteReferral}
        />
      ) : effectiveTheme === 'luxury_3d' ? (
        <Luxury3dStorefront
          products={products}
          cartItems={cartItems}
          settings={settings}
          isLoadingProducts={isLoadingCloudData}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
          onSwitchToAdmin={handleRequestAdminView}
          onOpenStory={() => setCurrentView('story')}
        />
      ) : effectiveTheme === 'cny_festive' ? (
        <FestiveCnyStorefront
          products={products}
          cartItems={cartItems}
          settings={settings}
          isLoadingProducts={isLoadingCloudData}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
          onSwitchToAdmin={handleRequestAdminView}
          onOpenStory={() => setCurrentView('story')}
        />
      ) : (
        <StorefrontView
          products={products}
          cartItems={cartItems}
          settings={settings}
          isLoadingProducts={isLoadingCloudData}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
          onSwitchToAdmin={handleRequestAdminView}
          onOpenStory={() => setCurrentView('story')}
        />
      )}

      {/* Admin Firebase Authentication Guard Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          if (typeof window !== 'undefined' && isAdminRoute()) {
            window.history.replaceState(null, '', '/');
          }
        }}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={handleProceedToCheckout}
        settings={settings}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        discountAmount={appliedDiscount}
        promoCode={appliedPromo}
        freeShippingGranted={appliedFreeShipping}
        freeGiftName={appliedFreeGift}
        settings={settings}
        onOrderCreated={handleOrderCreated}
      />

      {/* Order Success & WhatsApp Direct Trigger Modal */}
      <OrderSuccessModal
        order={completedOrderForSuccess}
        onClose={() => setCompletedOrderForSuccess(null)}
        settings={settings}
        onPrintInvoice={(order) => {
          setCompletedOrderForSuccess(null);
          setOrderForInvoicePrint(order);
        }}
      />

      {/* Invoice & Packing Slip Print View & PDF Download (出單與下載 PDF) */}
      <InvoicePrintView
        order={orderForInvoicePrint}
        settings={settings}
        onClose={() => setOrderForInvoicePrint(null)}
      />
    </>
  );
}
