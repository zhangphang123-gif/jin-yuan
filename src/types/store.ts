export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export type StorefrontTheme = 'classic' | 'cny_festive' | 'luxury_3d';

export type ProductCategory = string;

export interface CategoryDefinition {
  id: string;
  labelZh: string;
  labelEn: string;
  emoji: string;
  descriptionZh?: string;
  sortOrder?: number;
}

export type MeatType = 'pork' | 'chicken' | 'duck' | 'cookies' | 'seasonal' | 'other';

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  category: 'logo' | 'banner' | 'product' | 'story' | 'general';
  uploadedAt: string;
  size?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  imageUrl: string;
  badge?: string;
  badgeEn?: string;
  ctaText?: string;
  ctaTextEn?: string;
  ctaAction?: 'category' | 'story' | 'whatsapp' | 'products';
  ctaTarget?: string; // e.g. 'cookies', 'roast', 'bakkwa', 'seasonal'
  imageOnly?: boolean;
  hideOverlay?: boolean;
  active: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  titleZh: string;
  titleEn?: string;
  discountType: 'none' | 'fixed' | 'percent';
  discountValue: number; // RM if fixed, % if percent
  freeShipping: boolean;
  freeGiftName?: string;
  freeGiftNameEn?: string;
  minSpend?: number;
  active: boolean;
}

export interface StoreProduct {
  id: string;
  sku: string;
  nameZh: string;
  nameEn: string;
  category: ProductCategory;
  categoryLabelZh: string;
  meatType?: MeatType;
  price: number; // in RM (Malaysian Ringgit)
  originalPrice?: number;
  stock: number;
  unitWeight: string; // e.g. "250g / 500g / 1kg", "1 粒"
  image: string;
  images?: string[]; // 3-5 images per product for swipable carousel
  descriptionZh: string;
  descriptionEn?: string;
  featured?: boolean;
  hotOrder?: number;
  badge?: string;
  badgeEn?: string;
  specs?: { spec: string; price: number }[];
  hasWeightOptions?: boolean;
  weightType?: 'traditional' | 'pattern' | 'none';
  variantOptionLabelZh?: string;
  variantOptionLabelEn?: string;
  variantOptions?: string[];
  variantOptionsEn?: string[];
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  product: StoreProduct;
  quantity: number;
  weightVariant?: string;
  selectedPrice?: number;
}

export interface OrderCustomerInfo {
  name: string;
  phone: string;
  email: string;
  deliveryMethod: 'express_delivery' | 'store_pickup' | 'self_collection';
  address: string;
  postalCode?: string;
  paymentMethod: 'duitnow' | 'tng' | 'bank_transfer';
  notes?: string;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  unitWeight: string;
  image: string;
}

export interface StoreReferral {
  id: string;
  code: string;
  name: string;
  commissionRate?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreOrder {
  id: string; // e.g. "JY-20261112-8821"
  createdAt: string; // ISO string
  status: OrderStatus;
  customer: OrderCustomerInfo;
  items: StoreOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  appliedPromoCode?: string;
  freeShippingGranted?: boolean;
  freeGiftName?: string;
  paymentProofUrl?: string;
  paymentStatus: 'unpaid' | 'paid';
  whatsappSent: boolean;
  trackingNumber?: string;
  internalNotes?: string;
  referralCode?: string;
  referralName?: string;
  syncedToGoogleSheets?: boolean;
  sheetsSyncedAt?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  firstOrderDate: string;
  lastOrderDate: string;
  totalOrders: number;
  totalSpent: number;
  address: string;
}

export interface StoreSettings {
  storefrontTheme?: StorefrontTheme;
  storeName: string;
  storeSubname: string;
  contactPerson: string;
  whatsappNumber: string; // e.g. "60124947842"
  whatsappGreetingZh: string;
  currency: string; // "RM"
  freeShippingThreshold: number; // RM 300
  defaultShippingFee: number; // e.g. RM 10
  duitnowId: string;
  tngEwalletPhone: string;
  bankAccount: string;
  paymentQrCodeUrl?: string;
  email: string;
  storeAddress: string;
  logoUrl?: string;
  heroBannerUrl?: string;
  bannerSlides?: BannerSlide[];
  promoAnnouncements?: string[];
  promoCodes?: PromoCode[];
  referralDirectory?: Record<string, string>;
  announcementText?: string;
  freeFlossPromoActive?: boolean;
  googleSheetId?: string;
  googleSheetUrl?: string;
  autoSyncToSheets?: boolean;
  featuredProductIds?: string[];
  hotSectionTitleZh?: string;
  hotSectionTitleEn?: string;
  hotAutoRotateSeconds?: number;
  bannerAutoRotateSeconds?: number;
  catalogSeedVersion?: number;
  autoSyncedProductIds?: string[];
  categories?: CategoryDefinition[];
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  brandStoryTitleZh?: string;
  brandStorySubtitleZh?: string;
  brandStorySection1TitleZh?: string;
  brandStorySection1BodyZh?: string;
  brandStoryQuoteZh?: string;
  brandStorySection2TitleZh?: string;
  brandStorySection2BodyZh?: string;
  brandStorySection3TitleZh?: string;
  brandStorySection3BodyZh?: string;
  brandStoryClosingZh?: string;
  brandStoryWorkshopImg?: string;
  brandStoryWorkshopTitleZh?: string;
  brandStoryWorkshopCaptionZh?: string;
  brandStoryHeritageImg?: string;
  brandStoryHeritageTitleZh?: string;
  brandStoryHeritageCaptionZh?: string;
}
