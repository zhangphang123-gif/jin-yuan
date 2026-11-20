import { StoreProduct, ProductCategory } from '../types/store';

export const OFFICIAL_LOGO_URL = '/assets/aistudio/Gemini_Generated_Image_xl7ghnxl7ghnxl7g_4c5dd2fc.jpg';
export const LEGACY_LOGO_URL = '/assets/aistudio/Gemini_Generated_Image_kgw7xikgw7xikgw7_5c0430e2.jpg';
export const OFFICIAL_QR_URL = '/assets/aistudio/PHOTO-2026-11-13-13-09-26_2_1a47a666.jpg';

export const IMG_BAKKWA_SLICES = '/src/assets/images/product_bakkwa_original_1794479274306.jpg';
export const IMG_BAKKWA_CHARCOAL = '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg';
export const IMG_WORKSHOP_CHARCOAL = '/src/assets/images/story_charcoal_workshop_1794634473097.jpg';
export const IMG_HERITAGE_TRAYS = '/src/assets/images/story_family_heritage_1794634472318.jpg';
export const IMG_FLOSS = '/src/assets/images/product_meat_floss_1794479275258.jpg';
export const IMG_FLOSS_PORTABLE = '/assets/aistudio/Gemini_Generated_Image_mqgtk0mqgtk0mqgt_32e1644e.jpg';
export const IMG_COOKIES_TARTS = '/src/assets/images/product_cookies_tarts_1794479276784.jpg';
export const IMG_CNY_BISCUITS = '/src/assets/images/product_cny_biscuits_1794635493699.jpg';
export const IMG_LAPCHEONG = '/src/assets/images/product_lapcheong_sausage_1794479276119.jpg';
export const IMG_ROAST_MEATS = '/src/assets/images/product_roast_meats_1794635490696.jpg';
export const IMG_ROAST_POULTRY = '/src/assets/images/product_roast_poultry_1794635491792.jpg';
export const IMG_ZONGZI = '/src/assets/images/product_festive_zongzi_1794635492375.jpg';
export const IMG_MOONCAKE = '/src/assets/images/product_festive_mooncake_1794635492649.jpg';

export const PRESET_GALLERY_IMAGES = [
  { label: '炭烤切片肉乾', url: IMG_BAKKWA_SLICES },
  { label: '炭烤爐火現烤', url: IMG_BAKKWA_CHARCOAL },
  { label: '金牌酥脆肉鬆', url: IMG_FLOSS },
  { label: '90g 輕量方便裝肉鬆（附湯匙）', url: IMG_FLOSS_PORTABLE },
  { label: '脆皮燒肉＆蜜汁叉燒', url: IMG_ROAST_MEATS },
  { label: '金牌燒雞＆脆皮燒鴨', url: IMG_ROAST_POULTRY },
  { label: '手工黃梨酥年餅', url: IMG_COOKIES_TARTS },
  { label: '杏仁餅／花生餅／雞絲卷', url: IMG_CNY_BISCUITS },
  { label: '正宗玫瑰露臘腸', url: IMG_LAPCHEONG },
  { label: '端午節五香肉粽', url: IMG_ZONGZI },
  { label: '中秋節傳統月餅', url: IMG_MOONCAKE },
  { label: '錦源官方黑金徽章 Logo', url: OFFICIAL_LOGO_URL },
];

const CATEGORY_DEFAULT_IMAGES: Record<ProductCategory, string[]> = {
  bakkwa: [
    IMG_BAKKWA_SLICES,
    IMG_BAKKWA_CHARCOAL,
    IMG_HERITAGE_TRAYS,
    IMG_WORKSHOP_CHARCOAL,
    OFFICIAL_LOGO_URL,
  ],
  floss: [
    IMG_FLOSS_PORTABLE,
    IMG_FLOSS,
    IMG_HERITAGE_TRAYS,
    IMG_BAKKWA_CHARCOAL,
    OFFICIAL_LOGO_URL,
  ],
  cured: [
    IMG_LAPCHEONG,
    IMG_ROAST_MEATS,
    IMG_WORKSHOP_CHARCOAL,
    OFFICIAL_LOGO_URL,
  ],
  roast: [
    IMG_ROAST_MEATS,
    IMG_ROAST_POULTRY,
    IMG_WORKSHOP_CHARCOAL,
    OFFICIAL_LOGO_URL,
  ],
  cookies: [
    IMG_CNY_BISCUITS,
    IMG_COOKIES_TARTS,
    IMG_HERITAGE_TRAYS,
    OFFICIAL_LOGO_URL,
  ],
  seasonal: [
    IMG_ZONGZI,
    IMG_MOONCAKE,
    IMG_HERITAGE_TRAYS,
    OFFICIAL_LOGO_URL,
  ],
};

/**
 * Returns an array of 3 to 5 images for a product so the user can swipe / slide through multiple angles.
 */
export function getProductImages(product: StoreProduct): string[] {
  if (product.images && product.images.length > 0) {
    return product.images.slice(0, 5);
  }
  const defaultList = CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES.bakkwa;
  const set = new Set<string>();
  if (product.image) set.add(product.image);
  defaultList.forEach((img) => set.add(img));
  return Array.from(set).slice(0, 5);
}
