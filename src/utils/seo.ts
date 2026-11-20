import { StoreProduct, StoreSettings } from '../types/store';
import { OFFICIAL_LOGO_URL } from './productImages';

function upsertMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined' || !href) return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function toAbsoluteUrl(urlOrPath: string | undefined, origin: string): string {
  if (!urlOrPath) return '';
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  try {
    return new URL(urlOrPath, origin).href;
  } catch {
    return urlOrPath;
  }
}

export interface PageSeoMeta {
  title: string;
  description: string;
  robots: string;
}

/**
 * 根據目前的產品目錄 (products) 與店鋪設定 (settings)，
 * 自動為不同頁面與瀏覽狀態產生唯一的 meta title 與 meta description。
 */
export function generatePageMeta(
  settings: StoreSettings,
  products: StoreProduct[],
  currentView: 'storefront' | 'story' | 'admin',
  selectedCategory?: string
): PageSeoMeta {
  const storeName = (settings.storeName || '錦源傳統肉乾肉絲專賣店').trim();
  const brandTitle =
    storeName === '锦源'
      ? '錦源傳統肉乾肉絲專賣店（锦源 Jin Yuan）'
      : `${storeName}（锦源 · 錦源 Jin Yuan）`;

  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.stock > 0);
  const prices = inStockProducts
    .map((p) => p.price)
    .filter((p) => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 12;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 188;
  const currency = settings.currency || 'RM';
  const freeShippingThreshold = settings.freeShippingThreshold ?? 300;

  if (currentView === 'story') {
    const storyTitle = settings.brandStoryTitleZh || '1985年柴楞公園老字號傳承';
    const featuredNames = products
      .filter((p) => p.featured)
      .slice(0, 3)
      .map((p) => p.nameZh)
      .join('、');

    return {
      title: `${brandTitle}｜${storyTitle} · 品牌故事與媒體專訪`,
      description: `探索${storeName}自1985年於檳城北海柴楞公園發跡的古法炭烤工藝故事。全店現有 ${totalProducts} 款匠心手作${
        featuredNames ? `（如${featuredNames}）` : ''
      }，堅持每日現烤直送，滿 ${currency} ${freeShippingThreshold} 全馬免運。`,
      robots: 'index, follow',
    };
  }

  if (currentView === 'admin') {
    return {
      title: `${brandTitle}｜商家營運管理後台（${totalProducts} 款商品）`,
      description: `${storeName}管理後台：即時統籌 ${totalProducts} 款上架商品、訂單追蹤、代理推廣 QR Code 分銷與店鋪設定。`,
      robots: 'noindex, nofollow',
    };
  }

  // Storefront view — check if a specific category is active for category-level unique metadata
  if (selectedCategory && selectedCategory !== 'all') {
    const categoryDef = settings.categories?.find((c) => c.id === selectedCategory);
    const catLabel = categoryDef?.labelZh || selectedCategory;
    const catProducts = products.filter((p) => p.category === selectedCategory);
    const catSampleNames = catProducts
      .slice(0, 3)
      .map((p) => p.nameZh)
      .join('、');
    const catPrices = catProducts
      .map((p) => p.price)
      .filter((p) => typeof p === 'number' && p > 0);
    const catMin = catPrices.length > 0 ? Math.min(...catPrices) : minPrice;

    return {
      title: `${catLabel}系列｜${brandTitle}官方線上商城`,
      description: `選購${storeName}精選「${catLabel}」共 ${catProducts.length} 款美味${
        catSampleNames ? `：${catSampleNames}` : ''
      }，${currency} ${catMin} 起，滿 ${currency} ${freeShippingThreshold} 全馬宅配免運費。`,
      robots: 'index, follow',
    };
  }

  // Default Storefront Home
  const featuredHighlights = (
    products.filter((p) => p.featured).length > 0
      ? products.filter((p) => p.featured)
      : products
  )
    .slice(0, 4)
    .map((p) => p.nameZh)
    .join('、');

  const categorySummary = (settings.categories || [])
    .slice(0, 4)
    .map((c) => c.labelZh)
    .join('、');

  const catalogSnippet =
    totalProducts > 0
      ? `精選 ${totalProducts} 款美味（${featuredHighlights}），售價 ${currency} ${minPrice}–${maxPrice}`
      : '古法炭烤豬肉乾、雞肉乾、香酥肉鬆與傳統年餅';

  return {
    title: `${brandTitle}｜${
      settings.storefrontTheme === 'cny_festive' ? '新春賀歲獻禮 · ' : ''
    }炭烤肉乾、${categorySummary || '肉鬆與傳統年餅'}線上商城`,
    description: `${storeName}（${
      settings.storeSubname || '1985年檳城北海柴楞公園老字號'
    }）官方商城。${catalogSnippet}，滿 ${currency} ${freeShippingThreshold} 全馬免運，支援 WhatsApp 快速訂購。`,
    robots: 'index, follow',
  };
}

export function syncDynamicSeoMetadata(
  settings: StoreSettings,
  products: StoreProduct[],
  currentView: 'storefront' | 'story' | 'admin',
  selectedCategory?: string
): PageSeoMeta | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

  const origin = window.location.origin;
  const canonicalUrl = `${origin}${window.location.pathname}`;
  const pageMeta = generatePageMeta(settings, products, currentView, selectedCategory);

  document.title = pageMeta.title;

  const hasCustomLogo =
    Boolean(settings.logoUrl) && settings.logoUrl !== OFFICIAL_LOGO_URL;
  const shareImageUrl = toAbsoluteUrl(
    hasCustomLogo ? settings.logoUrl : '/jinyuan-og-logo.jpg',
    origin
  );
  const logoImageUrl = toAbsoluteUrl(
    settings.logoUrl || OFFICIAL_LOGO_URL,
    origin
  );

  upsertCanonicalLink(canonicalUrl);
  upsertMetaTag('name', 'description', pageMeta.description);
  upsertMetaTag('name', 'robots', pageMeta.robots);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:title', pageMeta.title);
  upsertMetaTag('property', 'og:description', pageMeta.description);
  if (shareImageUrl) {
    upsertMetaTag('property', 'og:image', shareImageUrl);
    upsertMetaTag('property', 'og:image:secure_url', shareImageUrl);
    upsertMetaTag('name', 'twitter:image', shareImageUrl);
  }
  upsertMetaTag('name', 'twitter:title', pageMeta.title);
  upsertMetaTag('name', 'twitter:description', pageMeta.description);

  // Keep Schema.org JSON-LD up to date with live URL, store info, and featured products
  const featuredCatalog = products.slice(0, 12).map((product) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Product',
      name: `${product.nameZh}${product.nameEn ? ` (${product.nameEn})` : ''}`,
      sku: product.sku,
      description: product.descriptionZh,
      image: toAbsoluteUrl(product.image, origin),
    },
    price: product.price,
    priceCurrency: 'MYR',
    availability:
      product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: '錦源傳統肉乾肉絲專賣店',
    alternateName: [
      '锦源',
      '錦源',
      '锦源肉干',
      '錦源肉乾',
      'Jin Yuan',
      'Jin Yuan Traditional Enterprise',
      settings.storeName,
    ].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i),
    url: origin,
    logo: logoImageUrl,
    image: shareImageUrl,
    description: pageMeta.description,
    foundingDate: '1985',
    telephone: settings.whatsappNumber
      ? `+${settings.whatsappNumber.replace(/[^0-9]/g, '')}`
      : '+60124947842',
    email: settings.email || 'workinfo.jinyuan@gmail.com',
    priceRange: 'RM',
    currenciesAccepted: 'MYR',
    openingHours: 'Mo-Su 08:00-22:00',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '29, Medan Kurau 1, Chai Leng Park',
      addressLocality: 'Perai',
      addressRegion: 'Pulau Pinang',
      postalCode: '13700',
      addressCountry: 'MY',
    },
    hasOfferCatalog:
      featuredCatalog.length > 0
        ? {
            '@type': 'OfferCatalog',
            name: '錦源招牌炭烤肉乾、肉鬆、燒臘與傳統年餅',
            itemListElement: featuredCatalog,
          }
        : undefined,
  };

  let ldScript = document.getElementById('jinyuan-seo-jsonld');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'jinyuan-seo-jsonld';
    ldScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(structuredData);

  return pageMeta;
}
