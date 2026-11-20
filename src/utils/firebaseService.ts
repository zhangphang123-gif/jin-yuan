import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StoreProduct, StoreOrder, StoreSettings, OrderStatus, StoreReferral } from '../types/store';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS } from '../data/initialStoreData';
import { sortCatalogProducts } from './productFilters';

// Initialize primary Firestore/Admin Firebase App safely (specifically [DEFAULT], isolated from 'sheets-oauth')
const app = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
export const auth = getAuth(app);

const configuredDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db =
  configuredDatabaseId && configuredDatabaseId !== '(default)'
    ? getFirestore(app, configuredDatabaseId)
    : getFirestore(app);

// Google Provider configuration (Basic identity scopes only so all authorized Gmails can sign in)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Strictly authorized Store Manager Gmail allowlist
export const ALLOWED_ADMIN_EMAILS = [
  'zhangphang123@gmail.com',
  'jinyuanheng88@gmail.com',
] as const;

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return (ALLOWED_ADMIN_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}

export function isAllowedAdminUser(user?: User | null): boolean {
  return Boolean(user && user.emailVerified && isAllowedAdminEmail(user.email));
}

// Strip undefined properties so Firestore setDoc/updateDoc never fails
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Error Handling per Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('quota exceeded') ||
    lower.includes('quota limit exceeded') ||
    lower.includes('resource-exhausted') ||
    lower.includes('free daily read units')
  );
}

/**
 * Strictly reject Base64 data URIs or temporary blob: URLs before writing to Firestore.
 * All user-uploaded photos must be uploaded to Cloudinary first and saved as short HTTPS URLs.
 */
export function isForbiddenLocalImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('data:') || trimmed.startsWith('blob:');
}

export function assertValidImageUrlForFirestore(url: string | undefined | null, label = '圖片網址'): string {
  const clean = (url || '').trim();
  if (!clean) return '';
  if (isForbiddenLocalImageUrl(clean)) {
    throw new Error(
      `禁止將 Base64 編碼或暫存 blob 連結寫入 Firestore（${label}）。請改用 Cloudinary 上傳取得 https://res.cloudinary.com/... 網址！`
    );
  }
  return clean;
}

// ---------------------------------------------------------------------------
// 1. PRODUCTS (One-time Cloud Firestore Read & Explicit Writes — ZERO onSnapshot)
// ---------------------------------------------------------------------------

let inflightProductsFetch: Promise<StoreProduct[]> | null = null;

export async function fetchProductsFromFirestore(): Promise<StoreProduct[]> {
  if (inflightProductsFetch) {
    return inflightProductsFetch;
  }

  inflightProductsFetch = (async () => {
    const path = 'products';
    try {
      const snapshot = await getDocs(collection(db, path));
      const items: StoreProduct[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as StoreProduct);
      });
      return sortCatalogProducts(items);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      inflightProductsFetch = null;
    }
  })();

  return inflightProductsFetch;
}

export async function saveProductToFirestore(product: StoreProduct): Promise<StoreProduct> {
  const path = `products/${product.id}`;
  try {
    const cleanMain = assertValidImageUrlForFirestore(product.image, '商品主圖');
    const rawImages =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : cleanMain
        ? [cleanMain]
        : [];
    const cleanImages = rawImages
      .map((img, i) => assertValidImageUrlForFirestore(img, `商品圖 #${i + 1}`))
      .filter(Boolean)
      .slice(0, 5);

    const normalizedProduct: StoreProduct = {
      ...product,
      image: cleanMain || cleanImages[0] || '',
      images: cleanImages.length > 0 ? cleanImages : cleanMain ? [cleanMain] : [],
      updatedAt: new Date().toISOString(),
    };

    const payload = sanitizeForFirestore(normalizedProduct);
    await setDoc(doc(db, 'products', product.id), payload);
    return payload;
  } catch (err) {
    if (err instanceof Error && err.message.includes('禁止將 Base64')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function updateProductStockInFirestore(productId: string, newStock: number): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      stock: Math.max(0, newStock),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateProductPriceInFirestore(productId: string, newPrice: number): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      price: Math.max(0, newPrice),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateProductImageInFirestore(
  productId: string,
  imageUrl: string,
  existingImages?: string[]
): Promise<string[]> {
  const path = `products/${productId}`;
  try {
    const cleanUrl = assertValidImageUrlForFirestore(imageUrl, '商品主圖');
    if (!cleanUrl) {
      throw new Error('請提供有效的圖片網址。');
    }

    let prevImages = existingImages;
    if (!prevImages) {
      const snap = await getDoc(doc(db, 'products', productId));
      const existing = snap.exists() ? (snap.data() as StoreProduct) : null;
      prevImages =
        Array.isArray(existing?.images) && existing.images.length > 0
          ? existing.images
          : existing?.image
          ? [existing.image]
          : [];
    }

    const merged = [
      cleanUrl,
      ...prevImages
        .map((u) => (u || '').trim())
        .filter((u) => u && u !== cleanUrl && !isForbiddenLocalImageUrl(u)),
    ].slice(0, 5);

    const updatedAt = new Date().toISOString();
    await setDoc(
      doc(db, 'products', productId),
      {
        image: merged[0],
        images: merged,
        updatedAt,
      },
      { merge: true }
    );
    return merged;
  } catch (err) {
    if (err instanceof Error && (err.message.includes('禁止將 Base64') || err.message.includes('有效的圖片網址'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateProductImagesInFirestore(
  productId: string,
  images: string[]
): Promise<string[]> {
  const path = `products/${productId}`;
  try {
    const cleanImages = images
      .map((u, idx) => assertValidImageUrlForFirestore(u, `商品輪播圖 #${idx + 1}`))
      .filter(Boolean)
      .slice(0, 5);

    if (cleanImages.length === 0) {
      throw new Error('請至少保留 1 張有效的圖片網址。');
    }

    const mainImage = cleanImages[0];
    const updatedAt = new Date().toISOString();

    await setDoc(
      doc(db, 'products', productId),
      {
        image: mainImage,
        images: cleanImages,
        updatedAt,
      },
      { merge: true }
    );
    return cleanImages;
  } catch (err) {
    if (err instanceof Error && (err.message.includes('禁止將 Base64') || err.message.includes('有效的圖片網址'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// 2. ORDERS (One-time Cloud Firestore Read & Explicit Writes — ZERO onSnapshot)
// ---------------------------------------------------------------------------

let inflightOrdersFetch: Promise<StoreOrder[]> | null = null;

export async function fetchOrdersFromFirestore(): Promise<StoreOrder[]> {
  if (inflightOrdersFetch) {
    return inflightOrdersFetch;
  }

  inflightOrdersFetch = (async () => {
    const path = 'orders';
    try {
      const snapshot = await getDocs(collection(db, path));
      const list: StoreOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StoreOrder);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      inflightOrdersFetch = null;
    }
  })();

  return inflightOrdersFetch;
}

export async function createCustomerOrderInFirestore(order: StoreOrder): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    if (order.paymentProofUrl) {
      assertValidImageUrlForFirestore(order.paymentProofUrl, '付款截圖網址');
    }

    const sanitizedOrder = sanitizeForFirestore({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        image: isForbiddenLocalImageUrl(item.image) ? '' : item.image,
      })),
    });

    // Save order to Firestore (allowed for all storefront shoppers)
    await setDoc(doc(db, 'orders', order.id), sanitizedOrder);

    // Decrement product stock only when signed-in admin creates an order
    if (isAllowedAdminUser(auth.currentUser)) {
      for (const item of order.items) {
        try {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as StoreProduct;
            const updatedStock = Math.max(0, prodData.stock - item.quantity);
            await updateDoc(prodRef, { stock: updatedStock });
          }
        } catch (stockErr) {
          console.warn('Could not decrement stock:', stockErr);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('禁止將 Base64')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateOrderTrackingInFirestore(
  orderId: string,
  trackingNumber: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      trackingNumber: trackingNumber.trim(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function markOrderSyncedInFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      syncedToGoogleSheets: true,
      sheetsSyncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not mark order synced:', err);
  }
}

// ---------------------------------------------------------------------------
// 3. STORE SETTINGS (One-time Cloud Firestore Read & Explicit Writes — ZERO onSnapshot)
// ---------------------------------------------------------------------------

const SETTINGS_DOC_ID = 'store_config';
let inflightSettingsFetch: Promise<StoreSettings> | null = null;

export async function fetchStoreSettingsFromFirestore(): Promise<StoreSettings> {
  if (inflightSettingsFetch) {
    return inflightSettingsFetch;
  }

  inflightSettingsFetch = (async () => {
    const path = `settings/${SETTINGS_DOC_ID}`;
    try {
      const snapshot = await getDocFromServer(doc(db, 'settings', SETTINGS_DOC_ID));
      if (!snapshot.exists()) {
        return { ...INITIAL_SETTINGS };
      }

      const raw = snapshot.data() as StoreSettings;
      return {
        ...INITIAL_SETTINGS,
        ...raw,
        promoCodes:
          Array.isArray(raw.promoCodes) && raw.promoCodes.length > 0
            ? raw.promoCodes
            : INITIAL_SETTINGS.promoCodes,
        bannerSlides:
          Array.isArray(raw.bannerSlides) && raw.bannerSlides.length > 0
            ? raw.bannerSlides
            : INITIAL_SETTINGS.bannerSlides,
        categories:
          Array.isArray(raw.categories) && raw.categories.length > 0
            ? raw.categories
            : INITIAL_SETTINGS.categories,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      inflightSettingsFetch = null;
    }
  })();

  return inflightSettingsFetch;
}

export async function saveStoreSettingsToFirestore(
  settings: StoreSettings
): Promise<StoreSettings> {
  const path = `settings/${SETTINGS_DOC_ID}`;
  try {
    assertValidImageUrlForFirestore(settings.logoUrl, '店鋪 Logo');
    assertValidImageUrlForFirestore(settings.heroBannerUrl, '首頁橫幅');
    assertValidImageUrlForFirestore(settings.paymentQrCodeUrl, '收款 QR');
    assertValidImageUrlForFirestore(settings.brandStoryWorkshopImg, '品牌故事工坊圖片');
    assertValidImageUrlForFirestore(settings.brandStoryHeritageImg, '品牌故事傳承圖片');
    if (Array.isArray(settings.bannerSlides)) {
      settings.bannerSlides.forEach((slide, idx) => {
        assertValidImageUrlForFirestore(slide.imageUrl, `輪播橫幅 #${idx + 1}`);
      });
    }

    const safeSettings = sanitizeForFirestore({ ...settings });
    await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), safeSettings);
    return safeSettings;
  } catch (err) {
    if (err instanceof Error && err.message.includes('禁止將 Base64')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export const NEWLY_ADDED_PRODUCT_IDS = ['jy-floss-pork-90g', 'jy-floss-chicken-90g'] as const;

export function mergePendingNewReleaseProducts(
  cloudProducts: StoreProduct[],
  cloudSettings: StoreSettings
): StoreProduct[] {
  if (cloudProducts.length === 0) return cloudProducts;

  const syncedSet = new Set(cloudSettings.autoSyncedProductIds || []);
  const existingIds = new Set(cloudProducts.map((p) => p.id));
  const pendingAdd = INITIAL_PRODUCTS.filter(
    (p) =>
      (NEWLY_ADDED_PRODUCT_IDS as readonly string[]).includes(p.id) &&
      !existingIds.has(p.id) &&
      !syncedSet.has(p.id)
  );

  if (pendingAdd.length === 0) return cloudProducts;
  return sortCatalogProducts([...cloudProducts, ...pendingAdd]);
}

export async function autoSyncNewReleaseProductsIfNeeded(
  currentProducts: StoreProduct[],
  currentSettings: StoreSettings
): Promise<{
  addedCount: number;
  products: StoreProduct[];
  settings: StoreSettings;
} | null> {
  if (!isAllowedAdminUser(auth.currentUser) || currentProducts.length === 0) {
    return null;
  }

  const syncedSet = new Set(currentSettings.autoSyncedProductIds || []);
  const pendingCheckIds = (NEWLY_ADDED_PRODUCT_IDS as readonly string[]).filter(
    (id) => !syncedSet.has(id)
  );

  if (pendingCheckIds.length === 0) {
    return null;
  }

  const existingSnaps = await Promise.all(
    pendingCheckIds.map((id) => getDoc(doc(db, 'products', id)))
  );
  const existingInDb = new Set<string>();
  existingSnaps.forEach((snap) => {
    if (snap.exists()) existingInDb.add(snap.id);
  });

  const existingMap = new Map(currentProducts.map((p) => [p.id, p]));
  const productsToInsert = INITIAL_PRODUCTS.filter(
    (p) => pendingCheckIds.includes(p.id) && !existingInDb.has(p.id)
  );

  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  for (const prod of productsToInsert) {
    const cleanMain = assertValidImageUrlForFirestore(prod.image, '商品主圖');
    const cleanImages = (Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [cleanMain])
      .map((img, i) => assertValidImageUrlForFirestore(img, `商品圖 #${i + 1}`))
      .filter(Boolean)
      .slice(0, 5);
    const normalized = sanitizeForFirestore<StoreProduct>({
      ...prod,
      image: cleanMain || cleanImages[0] || '',
      images: cleanImages,
      updatedAt: nowIso,
    });
    batch.set(doc(db, 'products', prod.id), normalized);
    existingMap.set(prod.id, normalized);
  }

  const nextSyncedIds = Array.from(
    new Set([...(currentSettings.autoSyncedProductIds || []), ...NEWLY_ADDED_PRODUCT_IDS])
  );
  const nextSettings = sanitizeForFirestore<StoreSettings>({
    ...currentSettings,
    autoSyncedProductIds: nextSyncedIds,
  });

  batch.set(doc(db, 'settings', SETTINGS_DOC_ID), { autoSyncedProductIds: nextSyncedIds }, { merge: true });
  await batch.commit();

  return {
    addedCount: productsToInsert.length,
    products: sortCatalogProducts(Array.from(existingMap.values())),
    settings: nextSettings,
  };
}

/**
 * Explicit manual action ONLY (called when admin clicks the restore button).
 * Atomically inserts missing pre-configured Jin Yuan products into Firestore
 * WITHOUT overwriting any existing products, custom settings, or inserting fake orders.
 */
export async function restoreStarterProductsToFirestore(): Promise<{
  addedCount: number;
  products: StoreProduct[];
  initializedSettings?: StoreSettings;
}> {
  if (!isAllowedAdminUser(auth.currentUser)) {
    throw new Error('僅限授權管理員可將預設商品寫入雲端資料庫。');
  }

  try {
    const existingSnap = await getDocs(collection(db, 'products'));
    const existingMap = new Map<string, StoreProduct>();
    existingSnap.forEach((d) => {
      existingMap.set(d.id, d.data() as StoreProduct);
    });

    const settingsSnap = await getDocFromServer(doc(db, 'settings', SETTINGS_DOC_ID));
    const shouldInitSettings = !settingsSnap.exists();

    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();
    let addedCount = 0;

    for (const prod of INITIAL_PRODUCTS) {
      if (!existingMap.has(prod.id)) {
        const cleanMain = assertValidImageUrlForFirestore(prod.image, '商品主圖');
        const cleanImages = (Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [cleanMain])
          .map((img, i) => assertValidImageUrlForFirestore(img, `商品圖 #${i + 1}`))
          .filter(Boolean)
          .slice(0, 5);
        const normalized = sanitizeForFirestore<StoreProduct>({
          ...prod,
          image: cleanMain || cleanImages[0] || '',
          images: cleanImages,
          updatedAt: nowIso,
        });
        batch.set(doc(db, 'products', prod.id), normalized);
        existingMap.set(prod.id, normalized);
        addedCount += 1;
      }
    }

    let initializedSettings: StoreSettings | undefined;
    if (shouldInitSettings) {
      initializedSettings = sanitizeForFirestore({
        ...INITIAL_SETTINGS,
        autoSyncedProductIds: [...NEWLY_ADDED_PRODUCT_IDS],
      });
      batch.set(doc(db, 'settings', SETTINGS_DOC_ID), initializedSettings);
    } else {
      const existingSettings = settingsSnap.data() as StoreSettings;
      const mergedSyncedIds = Array.from(
        new Set([...(existingSettings.autoSyncedProductIds || []), ...NEWLY_ADDED_PRODUCT_IDS])
      );
      batch.set(
        doc(db, 'settings', SETTINGS_DOC_ID),
        { autoSyncedProductIds: mergedSyncedIds },
        { merge: true }
      );
    }

    if (addedCount > 0 || shouldInitSettings) {
      await batch.commit();
    }

    return {
      addedCount,
      products: sortCatalogProducts(Array.from(existingMap.values())),
      initializedSettings,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'products');
  }
}

/**
 * Explicit manual action ONLY (never called automatically on load or auth change).
 * Restores starter products, settings, and demo orders when admin clicks Reset.
 */
export async function resetCatalogToDefaultsInFirestore(): Promise<{
  products: StoreProduct[];
  settings: StoreSettings;
  orders: StoreOrder[];
}> {
  if (!isAllowedAdminUser(auth.currentUser)) {
    throw new Error('僅限授權管理員可執行重置預設資料。');
  }
  const savedProducts: StoreProduct[] = [];
  for (const p of INITIAL_PRODUCTS) {
    savedProducts.push(await saveProductToFirestore(p));
  }
  const savedSettings = await saveStoreSettingsToFirestore(INITIAL_SETTINGS);
  for (const o of INITIAL_ORDERS) {
    await createCustomerOrderInFirestore(o);
  }
  return {
    products: sortCatalogProducts(savedProducts),
    settings: savedSettings,
    orders: INITIAL_ORDERS,
  };
}

// ---------------------------------------------------------------------------
// 3B. REFERRALS & AFFILIATE AGENTS (One-time Admin Read & Explicit Writes — ZERO onSnapshot)
// ---------------------------------------------------------------------------

let inflightReferralsFetch: Promise<StoreReferral[]> | null = null;

export async function fetchReferralsFromFirestore(): Promise<StoreReferral[]> {
  if (inflightReferralsFetch) {
    return inflightReferralsFetch;
  }

  inflightReferralsFetch = (async () => {
    const path = 'referrals';
    try {
      const snapshot = await getDocs(collection(db, path));
      const list: StoreReferral[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StoreReferral);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      inflightReferralsFetch = null;
    }
  })();

  return inflightReferralsFetch;
}

export async function saveReferralToFirestore(referral: StoreReferral): Promise<StoreReferral> {
  const cleanCode = referral.code.trim();
  if (!/^[a-zA-Z0-9]{2,32}$/.test(cleanCode)) {
    throw new Error('專屬推廣代號僅限 2–32 位英文字母或數字，不可包含空格或符號。');
  }
  const cleanName = referral.name.trim().slice(0, 100);
  if (!cleanName) {
    throw new Error('請輸入推廣員姓名或備註。');
  }

  const normalizedId = cleanCode.toLowerCase();
  const path = `referrals/${normalizedId}`;
  try {
    const nowIso = new Date().toISOString();
    const payloadObj: StoreReferral = {
      id: normalizedId,
      code: cleanCode,
      name: cleanName,
      active: referral.active !== false,
      createdAt: referral.createdAt || nowIso,
      updatedAt: nowIso,
    };

    if (
      typeof referral.commissionRate === 'number' &&
      Number.isFinite(referral.commissionRate)
    ) {
      payloadObj.commissionRate = Math.min(100, Math.max(0, Number(referral.commissionRate)));
    }

    const payload = sanitizeForFirestore(payloadObj);
    await setDoc(doc(db, 'referrals', normalizedId), payload);
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteReferralFromFirestore(referralId: string): Promise<void> {
  const path = `referrals/${referralId}`;
  try {
    await deleteDoc(doc(db, 'referrals', referralId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncReferralDirectoryToSettings(
  referrals: StoreReferral[]
): Promise<Record<string, string>> {
  const directory: Record<string, string> = {};
  for (const r of referrals) {
    if (r.active !== false && r.code && r.name) {
      directory[r.code.toLowerCase()] = r.name;
    }
  }
  const path = `settings/${SETTINGS_DOC_ID}`;
  try {
    await setDoc(
      doc(db, 'settings', SETTINGS_DOC_ID),
      { referralDirectory: directory },
      { merge: true }
    );
    return directory;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// 4. ADMIN AUTHENTICATION (Firebase Auth — Strictly 2 Authorized Gmails)
// ---------------------------------------------------------------------------

export async function adminLoginWithEmail(email: string, pass: string): Promise<User> {
  if (!isAllowedAdminEmail(email)) {
    throw new Error('此信箱無管理權限，僅限授權店長 Gmail 帳號進入後台。');
  }
  const res = await signInWithEmailAndPassword(auth, email, pass);
  if (!isAllowedAdminUser(res.user)) {
    await signOut(auth);
    throw new Error('請改用 Google 一鍵登入以驗證授權店長 Gmail 帳號。');
  }
  return res.user;
}

export async function adminRegisterWithEmail(_email: string, _pass: string): Promise<User> {
  throw new Error('後台已關閉自行註冊，僅限授權店長 Gmail 透過 Google 登入。');
}

export async function adminLoginWithGoogle(): Promise<User> {
  const res = await signInWithPopup(auth, googleProvider);
  if (!isAllowedAdminUser(res.user)) {
    const attemptedEmail = res.user.email || '';
    await signOut(auth);
    throw new Error(
      `帳號 ${attemptedEmail || ''} 無權限進入後台，僅限授權店長 Gmail 登入。`
    );
  }
  return res.user;
}

export async function adminLogout(): Promise<void> {
  await signOut(auth);
}

export function onAdminAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && !isAllowedAdminUser(user)) {
      try {
        await signOut(auth);
      } catch {
        // Ignore signOut cleanup errors
      }
      callback(null);
      return;
    }
    callback(user);
  });
}
