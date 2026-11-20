import { CategoryDefinition, MeatType, StoreProduct, StoreSettings } from '../types/store';

export type MeatFilterOption = 'all' | 'pork' | 'chicken' | 'duck' | 'cookies' | 'seasonal';
export type CategoryFilterOption = 'all' | 'shaped' | string;
export type ShapeSubFilter =
  | 'all'
  | 'rabbit'
  | 'cow'
  | 'coin'
  | 'tiger'
  | 'ingot'
  | 'star'
  | 'round'
  | 'mickey';
export type ProductSortOption = 'featured' | 'price_asc' | 'price_desc';

export const DEFAULT_STORE_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'bakkwa',
    labelZh: '手工炭烤肉乾',
    labelEn: 'Charcoal Bak Kwa',
    emoji: '🥩',
    descriptionZh: '豬肉乾、雞肉乾、迷你、黑胡椒、麻辣、切片肉乾',
    sortOrder: 1,
  },
  {
    id: 'floss',
    labelZh: '特脆香酥肉鬆／肉絲 (豬/雞)',
    labelEn: 'Crispy Meat Floss / Shreds (Pork/Chicken)',
    emoji: '🐷',
    descriptionZh: '老師傅慢火焙炒傳統豬肉鬆／豬肉絲與香酥雞肉鬆／雞肉絲',
    sortOrder: 2,
  },
  {
    id: 'cured',
    labelZh: '傳統手工臘味',
    labelEn: 'Cured Sausages & Meat',
    emoji: '🥓',
    descriptionZh: '傳統臘腸、特級玫瑰露臘腸、潤腸、鮮肉臘肉',
    sortOrder: 3,
  },
  {
    id: 'roast',
    labelZh: '傳統燒臘熟食',
    labelEn: 'Roast Meats & Pig',
    emoji: '🍖',
    descriptionZh: '炭火脆皮燒肉、蜜汁叉燒、燒雞、燒鴨、燒豬預訂',
    sortOrder: 4,
  },
  {
    id: 'cookies',
    labelZh: '年餅小吃系列',
    labelEn: 'CNY Cookies & Snacks',
    emoji: '🍪',
    descriptionZh: '手工杏仁餅、花生餅、鳳梨酥、肉鬆雞絲卷',
    sortOrder: 5,
  },
  {
    id: 'seasonal',
    labelZh: '節慶限定系列',
    labelEn: 'Seasonal Specials',
    emoji: '🎋',
    descriptionZh: '端午節五香肉粽、中秋節傳統月餅',
    sortOrder: 6,
  },
];

export const SHAPED_BAKKWA_OPTIONS: {
  id: ShapeSubFilter;
  labelZh: string;
  labelEn: string;
  emoji: string;
}[] = [
  { id: 'all', labelZh: '全部造型', labelEn: 'All Shapes', emoji: '🏮' },
  { id: 'rabbit', labelZh: '兔子形', labelEn: 'Rabbit', emoji: '🐰' },
  { id: 'cow', labelZh: '牛形', labelEn: 'Cow', emoji: '🐮' },
  { id: 'coin', labelZh: '金錢形', labelEn: 'Coin', emoji: '🪙' },
  { id: 'tiger', labelZh: '老虎形', labelEn: 'Tiger', emoji: '🐯' },
  { id: 'ingot', labelZh: '金元寶形', labelEn: 'Gold Ingot', emoji: '🥟' },
  { id: 'star', labelZh: '星形', labelEn: 'Star', emoji: '⭐' },
  { id: 'round', labelZh: '圓形', labelEn: 'Round', emoji: '⚪' },
  { id: 'mickey', labelZh: '米老鼠形', labelEn: 'Mickey', emoji: '🐭' },
];

export function resolveStoreCategories(settings?: StoreSettings | null): CategoryDefinition[] {
  const source =
    Array.isArray(settings?.categories) && settings!.categories.length > 0
      ? settings!.categories
      : DEFAULT_STORE_CATEGORIES;

  return [...source]
    .map((cat, idx) => ({
      ...cat,
      // Replace legacy rice/wheat icon on floss with pork/meat icon
      emoji: cat.id === 'floss' && (!cat.emoji || cat.emoji === '🌾') ? '🐷' : cat.emoji || '🏷️',
      sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : idx + 1,
    }))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export const DEFAULT_HOT_PRODUCT_IDS: string[] = [
  'jy-bakkwa-original-pork',    // 1. 原味豬肉乾（主打）
  'jy-bakkwa-original-chicken', // 2. 原味雞肉乾（主打）
  'jy-bakkwa-mini',             // 3. 迷你肉乾（主打）
  'jy-bakkwa-black-pepper',     // 4. 黑胡椒豬肉乾
  'jy-bakkwa-spicy-mala',       // 5. 麻辣豬肉乾
  'jy-bakkwa-sliced-pork',      // 6. 切片豬肉乾
  'jy-floss-pork',              // 7. 傳統豬肉鬆／豬肉絲（主打）
  'jy-floss-chicken',           // 8. 傳統雞肉鬆／雞肉絲（主打）
  'jy-shape-rabbit',            // 9. 兔子形肉乾
  'jy-shape-cow',               // 10. 牛形肉乾
  'jy-shape-coin',              // 11. 金錢形肉乾
  'jy-shape-tiger',             // 12. 老虎形肉乾
];

export const CATALOG_ID_ORDER: string[] = [
  'jy-bakkwa-original-pork',
  'jy-bakkwa-original-chicken',
  'jy-bakkwa-mini',
  'jy-bakkwa-black-pepper',
  'jy-bakkwa-spicy-mala',
  'jy-bakkwa-sliced-pork',
  'jy-floss-pork',
  'jy-floss-chicken',
  'jy-floss-pork-90g',
  'jy-floss-chicken-90g',
  'jy-shape-rabbit',
  'jy-shape-cow',
  'jy-shape-coin',
  'jy-shape-tiger',
  'jy-shape-ingot',
  'jy-shape-star',
  'jy-shape-round',
  'jy-shape-mickey',
  'jy-cured-regular',
  'jy-cured-special',
  'jy-cured-rose',
  'jy-cured-liver',
  'jy-cured-belly',
  'jy-roast-pork',
  'jy-roast-charsiu',
  'jy-roast-chicken',
  'jy-roast-duck',
  'jy-roast-pig',
  'jy-cookie-almond',
  'jy-cookie-peanut',
  'jy-cookie-pineapple',
  'jy-cookie-chicken-roll',
  'jy-seasonal-zongzi',
  'jy-seasonal-mooncake',
];

const CATALOG_ORDER_INDEX = new Map(CATALOG_ID_ORDER.map((id, index) => [id, index]));

export function sortCatalogProducts(products: StoreProduct[]): StoreProduct[] {
  return [...products].sort((a, b) => {
    const orderA =
      typeof a.hotOrder === 'number'
        ? a.hotOrder
        : CATALOG_ORDER_INDEX.has(a.id)
        ? (CATALOG_ORDER_INDEX.get(a.id) as number) + 1
        : 999;
    const orderB =
      typeof b.hotOrder === 'number'
        ? b.hotOrder
        : CATALOG_ORDER_INDEX.has(b.id)
        ? (CATALOG_ORDER_INDEX.get(b.id) as number) + 1
        : 999;

    if (orderA !== orderB) return orderA - orderB;
    return a.sku.localeCompare(b.sku);
  });
}

export function inferProductMeatTag(product: StoreProduct): MeatType {
  if (product.meatType) return product.meatType;

  const text = `${product.id} ${product.sku} ${product.nameZh} ${product.nameEn} ${product.categoryLabelZh}`.toLowerCase();

  if (product.category === 'seasonal') {
    return 'seasonal';
  }
  if (text.includes('chicken') || text.includes('雞') || text.includes('鸡')) {
    return 'chicken';
  }
  if (text.includes('duck') || text.includes('鴨') || text.includes('鸭')) {
    return 'duck';
  }
  if (product.category === 'cookies') {
    return 'cookies';
  }
  if (
    product.category === 'bakkwa' ||
    product.category === 'roast' ||
    product.category === 'floss' ||
    product.category === 'cured'
  ) {
    return 'pork';
  }
  return 'other';
}

export function isShapedBakKwa(product: StoreProduct): boolean {
  return (
    product.weightType === 'pattern' ||
    product.id.startsWith('jy-shape-') ||
    product.nameZh.includes('造型') ||
    product.categoryLabelZh.includes('造型') ||
    product.categoryLabelZh.includes('形肉乾')
  );
}

export function matchesShapeSubFilter(product: StoreProduct, shapeFilter: ShapeSubFilter): boolean {
  if (!isShapedBakKwa(product)) return false;
  if (shapeFilter === 'all') return true;
  if (product.id === `jy-shape-${shapeFilter}`) return true;

  const text = `${product.nameZh} ${product.nameEn} ${product.badge || ''} ${product.categoryLabelZh}`.toLowerCase();
  const keywordMap: Record<Exclude<ShapeSubFilter, 'all'>, string[]> = {
    rabbit: ['兔子', '兔', 'rabbit'],
    cow: ['牛形', '牛', 'cow'],
    coin: ['金錢', '金钱', 'coin'],
    tiger: ['老虎', '虎', 'tiger'],
    ingot: ['元寶', '元宝', 'ingot'],
    star: ['星形', '星', 'star'],
    round: ['圓形', '圆形', 'round'],
    mickey: ['米老鼠', '米奇', 'mickey'],
  };
  return keywordMap[shapeFilter].some((kw) => text.includes(kw));
}

export function getMeatLabel(meat: MeatType, lang: 'zh' | 'en'): string {
  const map: Record<MeatType, { zh: string; en: string }> = {
    pork: { zh: '豬肉嚴選', en: 'Pork' },
    chicken: { zh: '雞肉嚴選', en: 'Chicken' },
    duck: { zh: '燒鴨風味', en: 'Duck' },
    cookies: { zh: '年餅小吃', en: 'Cookies & Snacks' },
    seasonal: { zh: '節慶限定', en: 'Seasonal' },
    other: { zh: '傳統精選', en: 'Classic' },
  };
  return map[meat]?.[lang] || map.other[lang];
}

export function getShowcaseTypeTag(product: StoreProduct, lang: 'zh' | 'en'): string {
  const meat = inferProductMeatTag(product);
  if (product.id === 'jy-shape-rabbit') return lang === 'en' ? 'Rabbit Shape' : '兔子形肉乾';
  if (product.id === 'jy-shape-cow') return lang === 'en' ? 'Cow Shape' : '牛形肉乾';
  if (product.id === 'jy-shape-coin') return lang === 'en' ? 'Coin Shape' : '金錢形肉乾';
  if (product.id === 'jy-shape-tiger') return lang === 'en' ? 'Tiger Shape' : '老虎形肉乾';
  if (isShapedBakKwa(product)) {
    return lang === 'en' ? 'Shaped Bak Kwa' : product.categoryLabelZh || '造型肉乾';
  }
  if (product.id === 'jy-bakkwa-mini') {
    return lang === 'en' ? 'Mini Bak Kwa' : '主打迷你肉乾';
  }
  if (meat === 'chicken' && product.category === 'bakkwa') {
    return lang === 'en' ? 'Chicken Bak Kwa' : '主打雞肉乾';
  }
  if (product.id === 'jy-bakkwa-original-pork') {
    return lang === 'en' ? 'Signature Pork' : '主打豬肉乾';
  }
  if (product.id.includes('sliced')) {
    return lang === 'en' ? 'Sliced Pork' : '切片豬肉乾';
  }
  if (product.category === 'bakkwa' && meat === 'pork') {
    return lang === 'en' ? 'Charcoal Bak Kwa' : '手工炭烤肉乾';
  }
  return lang === 'en' ? getMeatLabel(meat, 'en') : product.categoryLabelZh;
}

export function matchesProductFilters(
  product: StoreProduct,
  meatFilter: MeatFilterOption,
  categoryFilter: CategoryFilterOption,
  searchQuery: string,
  inStockOnly: boolean,
  shapeSubFilter: ShapeSubFilter = 'all'
): boolean {
  if (inStockOnly && product.stock <= 0) return false;

  if (meatFilter !== 'all') {
    const inferred = inferProductMeatTag(product);
    if (inferred !== meatFilter) return false;
  }

  if (categoryFilter !== 'all') {
    if (categoryFilter === 'shaped') {
      if (!matchesShapeSubFilter(product, shapeSubFilter)) return false;
    } else if (product.category !== categoryFilter) {
      return false;
    }
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    const match =
      product.nameZh.toLowerCase().includes(q) ||
      product.nameEn.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.categoryLabelZh.toLowerCase().includes(q) ||
      product.descriptionZh.toLowerCase().includes(q) ||
      (product.descriptionEn || '').toLowerCase().includes(q) ||
      (product.variantOptions || []).some((v) => v.toLowerCase().includes(q));
    if (!match) return false;
  }

  return true;
}

export function resolveHotShowcaseProducts(
  products: StoreProduct[],
  settings: StoreSettings
): StoreProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]));

  if (Array.isArray(settings.featuredProductIds)) {
    const ordered = settings.featuredProductIds
      .map((id) => byId.get(id))
      .filter((p): p is StoreProduct => Boolean(p));
    if (ordered.length > 0) {
      return ordered;
    }
  }

  const flagged = products
    .filter((p) => p.featured)
    .sort((a, b) => (a.hotOrder ?? 999) - (b.hotOrder ?? 999));

  if (flagged.length > 0) return flagged;

  const defaultResolved = DEFAULT_HOT_PRODUCT_IDS
    .map((id) => byId.get(id))
    .filter((p): p is StoreProduct => Boolean(p));

  return defaultResolved.length > 0 ? defaultResolved : sortCatalogProducts(products).slice(0, 6);
}
