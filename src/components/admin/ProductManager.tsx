import React, { useMemo, useState } from 'react';
import { MeatType, ProductCategory, StoreProduct, StoreSettings } from '../../types/store';
import { getProductImages, PRESET_GALLERY_IMAGES } from '../../utils/productImages';
import {
  DEFAULT_HOT_PRODUCT_IDS,
  getMeatLabel,
  inferProductMeatTag,
  isShapedBakKwa,
  resolveStoreCategories
} from '../../utils/productFilters';
import { INITIAL_PRODUCTS } from '../../data/initialStoreData';
import {
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  Flame,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';

interface ProductManagerProps {
  products: StoreProduct[];
  settings?: StoreSettings;
  onSaveSettings?: (settings: StoreSettings) => Promise<void> | void;
  onUpdateProductStock: (productId: string, newStock: number) => Promise<void> | void;
  onUpdateProductPrice: (productId: string, newPrice: number) => Promise<void> | void;
  onUpdateProductImage: (productId: string, newImage: string) => Promise<void> | void;
  onUpdateProductImages?: (productId: string, images: string[]) => Promise<void> | void;
  onUpdateProduct?: (product: StoreProduct) => Promise<void> | void;
  onAddProduct: (product: StoreProduct) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onInitializeStarterCatalog?: () => Promise<void> | void;
  isInitializingStarterCatalog?: boolean;
}

type AdminSeriesFilter = 'all' | 'bakkwa_classic' | 'bakkwa_shaped' | string;

function matchesAdminSeries(product: StoreProduct, series: AdminSeriesFilter): boolean {
  if (series === 'all') return true;
  if (series === 'bakkwa_classic') return product.category === 'bakkwa' && !isShapedBakKwa(product);
  if (series === 'bakkwa_shaped') return product.category === 'bakkwa' && isShapedBakKwa(product);
  return product.category === series;
}

function getSeriesFriendlyLabel(product: StoreProduct, labelMap: Record<string, string>): string {
  if (product.category === 'bakkwa') {
    return isShapedBakKwa(product) ? '造型肉乾系列' : labelMap.bakkwa || '傳統手工炭烤肉乾';
  }
  return labelMap[product.category] || product.categoryLabelZh;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  settings,
  onSaveSettings,
  onUpdateProductStock,
  onUpdateProductPrice,
  onUpdateProductImage,
  onUpdateProductImages,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onInitializeStarterCatalog,
  isInitializingStarterCatalog = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seriesFilter, setSeriesFilter] = useState<AdminSeriesFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Page-level feedback toast / error banner
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusNotice({ text, type });
    setTimeout(() => {
      setStatusNotice((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // Multi-photo editor state (3 to 5 photos)
  const [photoModalProduct, setPhotoModalProduct] = useState<StoreProduct | null>(null);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photoModalError, setPhotoModalError] = useState<string | null>(null);

  // Full Text / Title / Description / Details Editor Modal state
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [editVariantTextZh, setEditVariantTextZh] = useState('');
  const [editVariantTextEn, setEditVariantTextEn] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsModalError, setDetailsModalError] = useState<string | null>(null);

  // Safe In-App Delete Confirmation Modal state (avoids blocked iframe window.confirm)
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<StoreProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Inline table row editing state (Title, Description, Category, Price, Stock) — buffered until explicit Save click
  const [inlineDrafts, setInlineDrafts] = useState<
    Record<
      string,
      {
        nameZh?: string;
        descriptionZh?: string;
        category?: ProductCategory;
        price?: number;
        stock?: number;
      }
    >
  >({});
  const [inlineSavingIds, setInlineSavingIds] = useState<Record<string, boolean>>({});
  const [inlineSavedIds, setInlineSavedIds] = useState<Record<string, boolean>>({});

  // New product form state (with 3-5 photos support)
  const [newProduct, setNewProduct] = useState<Partial<StoreProduct>>({
    sku: '',
    nameZh: '',
    nameEn: '',
    category: 'bakkwa',
    categoryLabelZh: '手工炭烤肉乾',
    meatType: 'pork',
    price: 65,
    stock: 50,
    unitWeight: '500g / 包',
    badge: '',
    descriptionZh: '',
    descriptionEn: '',
    image: '/src/assets/images/product_bakkwa_original_1794479274306.jpg',
  });
  const [newProductImages, setNewProductImages] = useState<string[]>([
    '/src/assets/images/product_bakkwa_original_1794479274306.jpg',
    '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg',
    '/assets/aistudio/Screenshot_2026-11-12_at_7.10.20_PM_d33fb8c5.png',
  ]);
  const [newProdUrlInput, setNewProdUrlInput] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const activeHotIds = Array.isArray(settings?.featuredProductIds)
    ? settings!.featuredProductIds
    : DEFAULT_HOT_PRODUCT_IDS;

  const storeCategories = useMemo(() => resolveStoreCategories(settings), [settings]);

  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    storeCategories.forEach((cat) => {
      map[cat.id] = cat.labelZh;
    });
    return map;
  }, [storeCategories]);

  const seriesOptions: { id: AdminSeriesFilter; label: string }[] = useMemo(() => {
    const items: { id: AdminSeriesFilter; label: string }[] = [{ id: 'all', label: '全部系列' }];
    storeCategories.forEach((cat) => {
      if (cat.id === 'bakkwa') {
        items.push({ id: 'bakkwa_classic', label: `${cat.emoji} ${cat.labelZh}` });
        items.push({ id: 'bakkwa_shaped', label: '🏮 造型肉乾系列' });
      } else {
        items.push({ id: cat.id, label: `${cat.emoji} ${cat.labelZh}` });
      }
    });
    return items;
  }, [storeCategories]);

  const seriesCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      bakkwa_classic: 0,
      bakkwa_shaped: 0,
    };
    storeCategories.forEach((c) => {
      if (c.id !== 'bakkwa') counts[c.id] = 0;
    });
    products.forEach((p) => {
      if (matchesAdminSeries(p, 'bakkwa_classic')) counts.bakkwa_classic += 1;
      if (matchesAdminSeries(p, 'bakkwa_shaped')) counts.bakkwa_shaped += 1;
      if (p.category !== 'bakkwa') {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products, storeCategories]);

  const handleToggleHotShowcase = async (productId: string) => {
    if (!settings || !onSaveSettings) return;
    const exists = activeHotIds.includes(productId);
    const nextIds = exists
      ? activeHotIds.filter((id) => id !== productId)
      : [...activeHotIds, productId];
    try {
      await onSaveSettings({
        ...settings,
        featuredProductIds: nextIds,
      });
      showNotice(exists ? '已從熱門展示區移除。' : '已加入首頁熱門展示區並同步雲端。');
    } catch (err) {
      showNotice(err instanceof Error ? err.message : '更新熱門設定失敗，請稍後再試。', 'error');
    }
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!matchesAdminSeries(p, seriesFilter)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.nameZh.toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryLabelZh.toLowerCase().includes(q) ||
        (p.descriptionZh || '').toLowerCase().includes(q)
      );
    });
  }, [products, seriesFilter, searchQuery]);

  const uploadSingleFile = async (file: File): Promise<string> => {
    const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
    return await uploadImageToCloudinary(file, 'products', {
      cloudName: settings?.cloudinaryCloudName,
      uploadPreset: settings?.cloudinaryUploadPreset,
    });
  };

  // Multi-file upload for New Product Modal (up to 5 photos)
  const handleUploadNewProductFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const remainingSlots = Math.max(0, 5 - newProductImages.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots || 5);
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadSingleFile(file);
        if (url) uploadedUrls.push(url);
      }
      setNewProductImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
    } catch (err) {
      showNotice(err instanceof Error ? err.message : '圖片讀取或上傳失敗', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nameZh || !newProduct.sku) return;

    setIsCreatingProduct(true);
    try {
      const cat = (newProduct.category as ProductCategory) || 'bakkwa';
      const finalImages =
        newProductImages.length > 0
          ? newProductImages.slice(0, 5)
          : ['/src/assets/images/product_bakkwa_original_1794479274306.jpg'];

      const created: StoreProduct = {
        id: `jy-prod-${Date.now()}`,
        sku: newProduct.sku.trim(),
        nameZh: newProduct.nameZh.trim(),
        nameEn: (newProduct.nameEn || '').trim(),
        category: cat,
        categoryLabelZh: categoryLabelMap[cat] || '手工炭烤肉乾',
        meatType: (newProduct.meatType as MeatType) || 'pork',
        price: Number(newProduct.price) || 65,
        stock: Number(newProduct.stock) || 50,
        unitWeight: newProduct.unitWeight || '500g / 包',
        badge: newProduct.badge?.trim() || undefined,
        image: finalImages[0],
        images: finalImages,
        descriptionZh: newProduct.descriptionZh || '',
        descriptionEn: newProduct.descriptionEn || '',
        featured: false,
      };

      await onAddProduct(created);
      showNotice(`已成功上架「${created.nameZh}」並同步至雲端！`);
      setIsAddModalOpen(false);
      setNewProduct({
        sku: '',
        nameZh: '',
        nameEn: '',
        category: 'bakkwa',
        categoryLabelZh: '手工炭烤肉乾',
        meatType: 'pork',
        price: 65,
        stock: 50,
        unitWeight: '500g / 包',
        badge: '',
        descriptionZh: '',
        descriptionEn: '',
        image: '/src/assets/images/product_bakkwa_original_1794479274306.jpg',
      });
      setNewProductImages([
        '/src/assets/images/product_bakkwa_original_1794479274306.jpg',
        '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg',
        '/assets/aistudio/Screenshot_2026-11-12_at_7.10.20_PM_d33fb8c5.png',
      ]);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : '上架商品失敗，請確認照片大小與網路連線。', 'error');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Multi-Photo Modal handlers (3 to 5 photos)
  const handleOpenPhotoModal = (prod: StoreProduct) => {
    setPhotoModalProduct(prod);
    setEditImages(getProductImages(prod));
    setNewUrlInput('');
    setPhotoModalError(null);
  };

  const handleMultiFileUploadForProduct = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoModalError(null);
    setIsUploading(true);
    try {
      const remainingSlots = Math.max(1, 5 - editImages.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadSingleFile(file);
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length === 0) {
        setPhotoModalError('未讀取到有效的圖片檔案，請選擇 JPG、PNG 或 WebP 圖片。');
        return;
      }

      setEditImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
    } catch (err) {
      setPhotoModalError(err instanceof Error ? err.message : '上傳照片失敗，請重試。');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddPresetToEdit = (url: string) => {
    setPhotoModalError(null);
    setEditImages((prev) => {
      if (prev.includes(url)) return prev;
      if (prev.length >= 5) {
        return [...prev.slice(0, 4), url];
      }
      return [...prev, url];
    });
  };

  const handleAddUrlToEdit = () => {
    const trimmed = newUrlInput.trim();
    if (!trimmed) return;
    setPhotoModalError(null);
    setEditImages((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, trimmed];
    });
    setNewUrlInput('');
  };

  const handleSetCoverPhoto = (index: number) => {
    setEditImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
  };

  const handleRemoveEditPhoto = (index: number) => {
    setEditImages((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProductPhotos = async () => {
    if (!photoModalProduct || editImages.length === 0) return;
    setIsSavingPhotos(true);
    setPhotoModalError(null);
    try {
      const finalImages = editImages.slice(0, 5);
      if (onUpdateProductImages) {
        await onUpdateProductImages(photoModalProduct.id, finalImages);
      } else {
        await onUpdateProductImage(photoModalProduct.id, finalImages[0]);
      }
      showNotice(`「${photoModalProduct.nameZh}」的 ${finalImages.length} 張照片已永久同步至雲端！`);
      setPhotoModalProduct(null);
    } catch (err) {
      console.error('Save product photos error:', err);
      setPhotoModalError(
        err instanceof Error
          ? err.message
          : '儲存失敗：圖片總容量可能超過雲端 1MB 限制或網路逾時，請刪減 1 張或重新上傳較小照片後再按儲存。'
      );
    } finally {
      setIsSavingPhotos(false);
    }
  };

  // Full Product Copy / Details Editor handlers
  const handleOpenEditDetails = (prod: StoreProduct) => {
    setEditingProduct({
      ...prod,
      specs: prod.specs ? prod.specs.map((s) => ({ ...s })) : [],
    });
    setEditVariantTextZh((prod.variantOptions || []).join('、'));
    setEditVariantTextEn((prod.variantOptionsEn || []).join(', '));
    setDetailsModalError(null);
  };

  const handleSpecChange = (idx: number, field: 'spec' | 'price', value: string | number) => {
    setEditingProduct((prev) => {
      if (!prev) return prev;
      const nextSpecs = [...(prev.specs || [])];
      if (!nextSpecs[idx]) return prev;
      nextSpecs[idx] = {
        ...nextSpecs[idx],
        [field]: field === 'price' ? Number(value) || 0 : String(value),
      };
      return { ...prev, specs: nextSpecs };
    });
  };

  const handleAddSpecRow = () => {
    setEditingProduct((prev) => {
      if (!prev) return prev;
      const existingLabels = new Set((prev.specs || []).map((s) => s.spec.trim()));
      const candidates = ['250g', '500g', '1kg', '300g', '100g', '180g', '90g(罐)', '半隻', '一隻'];
      let nextLabel = candidates.find((c) => !existingLabels.has(c)) || '';
      if (!nextLabel) {
        let counter = (prev.specs?.length || 0) + 1;
        while (existingLabels.has(`規格 ${counter}`)) {
          counter += 1;
        }
        nextLabel = `規格 ${counter}`;
      }
      const nextSpecs = [...(prev.specs || []), { spec: nextLabel, price: prev.price || 50 }];
      return { ...prev, specs: nextSpecs };
    });
  };

  const handleRemoveSpecRow = (idx: number) => {
    setEditingProduct((prev) => {
      if (!prev) return prev;
      const nextSpecs = (prev.specs || []).filter((_, i) => i !== idx);
      return { ...prev, specs: nextSpecs };
    });
  };

  const handleSaveProductDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.nameZh.trim()) {
      setDetailsModalError('商品中文標題不能留空。');
      return;
    }

    const rawSpecs = (editingProduct.specs || [])
      .map((s) => ({ spec: s.spec.trim(), price: Math.max(0, Number(s.price) || 0) }))
      .filter((s) => s.spec.length > 0);

    const specLabelSet = new Set<string>();
    for (const item of rawSpecs) {
      if (specLabelSet.has(item.spec)) {
        setDetailsModalError(`重量/份量規格「${item.spec}」重複了，請將每個規格名稱設為不重複。`);
        return;
      }
      specLabelSet.add(item.spec);
    }

    setIsSavingDetails(true);
    setDetailsModalError(null);
    try {
      const cleanedSpecs = rawSpecs;

      const parsedVariantsZh = editVariantTextZh
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedVariantsEn = editVariantTextEn
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const latestProd = products.find((p) => p.id === editingProduct.id) || editingProduct;
      const updated: StoreProduct = {
        ...latestProd,
        ...editingProduct,
        image: latestProd.image || editingProduct.image,
        images: latestProd.images || editingProduct.images,
        sku: editingProduct.sku.trim(),
        nameZh: editingProduct.nameZh.trim(),
        nameEn: (editingProduct.nameEn || '').trim(),
        categoryLabelZh:
          editingProduct.categoryLabelZh.trim() ||
          categoryLabelMap[editingProduct.category] ||
          '精選商品',
        price: Math.max(0, Number(editingProduct.price) || 0),
        originalPrice:
          editingProduct.originalPrice && Number(editingProduct.originalPrice) > 0
            ? Number(editingProduct.originalPrice)
            : undefined,
        stock: Math.max(0, Number(editingProduct.stock) || 0),
        unitWeight: editingProduct.unitWeight.trim() || '1 件',
        badge: editingProduct.badge?.trim() || undefined,
        badgeEn: editingProduct.badgeEn?.trim() || undefined,
        descriptionZh: editingProduct.descriptionZh.trim(),
        descriptionEn: editingProduct.descriptionEn?.trim() || undefined,
        specs: cleanedSpecs.length > 0 ? cleanedSpecs : undefined,
        hasWeightOptions: cleanedSpecs.length > 0,
        variantOptionLabelZh: editingProduct.variantOptionLabelZh?.trim() || undefined,
        variantOptionLabelEn: editingProduct.variantOptionLabelEn?.trim() || undefined,
        variantOptions: parsedVariantsZh.length > 0 ? parsedVariantsZh : undefined,
        variantOptionsEn: parsedVariantsEn.length > 0 ? parsedVariantsEn : undefined,
      };

      if (onUpdateProduct) {
        await onUpdateProduct(updated);
      } else {
        await onAddProduct(updated);
      }
      showNotice(`已成功更新「${updated.nameZh}」標題、字眼與商品詳情並同步至前台！`);
      setEditingProduct(null);
    } catch (err) {
      console.error('Save product details error:', err);
      setDetailsModalError(err instanceof Error ? err.message : '儲存商品內容失敗，請檢查連線後再試。');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Buffer inline edits in local React state (Title, Description, Category, Price, Stock)
  // NEVER auto-writes to Firestore during typing/onChange/onBlur; only writes when admin clicks Save.
  const handleInlineFieldChange = (
    productId: string,
    field: 'nameZh' | 'descriptionZh' | 'category' | 'price' | 'stock',
    value: string | number
  ) => {
    setInlineDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleDiscardInlineDraft = (productId: string) => {
    setInlineDrafts((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleInlineCommitProduct = async (prod: StoreProduct) => {
    const draft = inlineDrafts[prod.id];
    if (!draft) return;

    const nextNameZh = (draft.nameZh !== undefined ? draft.nameZh : prod.nameZh).trim();
    const nextDescZh = (
      draft.descriptionZh !== undefined ? draft.descriptionZh : prod.descriptionZh || ''
    ).trim();
    const nextCategory = draft.category !== undefined ? draft.category : prod.category;
    const nextCategoryLabel =
      draft.category !== undefined
        ? categoryLabelMap[draft.category] || prod.categoryLabelZh
        : prod.categoryLabelZh;
    const nextPrice =
      draft.price !== undefined ? Math.max(0, Number(draft.price) || 0) : prod.price;
    const nextStock =
      draft.stock !== undefined ? Math.max(0, Number(draft.stock) || 0) : prod.stock;

    if (!nextNameZh) {
      handleDiscardInlineDraft(prod.id);
      showNotice('商品標題不能留空，已恢復原本標題。', 'error');
      return;
    }

    const hasChanges =
      nextNameZh !== prod.nameZh ||
      nextDescZh !== (prod.descriptionZh || '') ||
      nextCategory !== prod.category ||
      nextCategoryLabel !== prod.categoryLabelZh ||
      nextPrice !== prod.price ||
      nextStock !== prod.stock;

    if (!hasChanges) {
      handleDiscardInlineDraft(prod.id);
      return;
    }

    const latestProd = products.find((p) => p.id === prod.id) || prod;
    const updatedProduct: StoreProduct = {
      ...latestProd,
      nameZh: nextNameZh,
      descriptionZh: nextDescZh,
      category: nextCategory,
      categoryLabelZh: nextCategoryLabel,
      price: nextPrice,
      stock: nextStock,
    };

    setInlineSavingIds((prev) => ({ ...prev, [prod.id]: true }));
    try {
      if (onUpdateProduct) {
        await onUpdateProduct(updatedProduct);
      } else {
        if (nextPrice !== prod.price) await onUpdateProductPrice(prod.id, nextPrice);
        if (nextStock !== prod.stock) await onUpdateProductStock(prod.id, nextStock);
        await onAddProduct(updatedProduct);
      }
      handleDiscardInlineDraft(prod.id);
      setInlineSavedIds((prev) => ({ ...prev, [prod.id]: true }));
      showNotice(`已儲存「${updatedProduct.nameZh}」的修改並同步雲端！`);
      setTimeout(() => {
        setInlineSavedIds((prev) => {
          const copy = { ...prev };
          delete copy[prod.id];
          return copy;
        });
      }, 2200);
    } catch (err) {
      console.error('Inline update failed:', err);
      showNotice(
        err instanceof Error ? `儲存修改失敗：${err.message}` : '同步至雲端失敗，請稍後重試。',
        'error'
      );
    } finally {
      setInlineSavingIds((prev) => {
        const copy = { ...prev };
        delete copy[prod.id];
        return copy;
      });
    }
  };

  return (
    <div className="space-y-5 text-sm">

      {/* Status Toast Banner */}
      {statusNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-sm ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif-brand text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            商品內容、文案字眼與多圖照片管理
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            現有 <strong className="text-stone-800 dark:text-stone-200">{products.length}</strong> 項上架商品 · 支援按系列篩選、修改商品標題 / 字眼 / 詳情規格，以及設定 <strong className="text-red-800 dark:text-red-400">3 至 5 張</strong> 實拍照片同步至雲端。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋貨號或商品名稱..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-900 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新增美食商品</span>
          </button>
        </div>
      </div>

      {/* Series Filter Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
            <Filter className="w-3.5 h-3.5 text-red-800 dark:text-amber-400" />
            <span>按產品系列篩選：</span>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            目前顯示 <strong className="text-red-800 dark:text-amber-400">{filtered.length}</strong> / {products.length} 項商品
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {seriesOptions.map((opt) => {
            const isSelected = seriesFilter === opt.id;
            const count = seriesCounts[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSeriesFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-red-900 text-amber-100 border-red-900 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-red-700/60'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-amber-400/20 text-amber-200'
                      : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {onInitializeStarterCatalog && (() => {
        const missingItems = INITIAL_PRODUCTS.filter(
          (sp) => !products.some((p) => p.id === sp.id)
        );
        if (missingItems.length === 0 || products.length === 0) return null;
        return (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-800 dark:text-amber-100 space-y-0.5">
              <div className="font-bold text-red-900 dark:text-amber-300">
                有 {missingItems.length} 款新上架預設商品尚未寫入雲端資料庫：
              </div>
              <div className="text-stone-600 dark:text-stone-300">
                {missingItems.map((m) => `${m.nameZh} (RM ${m.price})`).join('、')}
              </div>
            </div>
            <button
              type="button"
              onClick={onInitializeStarterCatalog}
              disabled={isInitializingStarterCatalog}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              {isInitializingStarterCatalog ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>
                {isInitializingStarterCatalog ? '寫入中...' : `一鍵補齊這 ${missingItems.length} 款商品`}
              </span>
            </button>
          </div>
        );
      })()}

      {/* Products Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold">
                <th className="py-3 px-4 min-w-[260px]">商品名稱、詳情與多圖</th>
                <th className="py-3 px-3 min-w-[125px] whitespace-nowrap">所屬系列</th>
                <th className="py-3 px-3 min-w-[100px] whitespace-nowrap">規格</th>
                <th className="py-3 px-3 whitespace-nowrap">售價 (RM)</th>
                <th className="py-3 px-3 whitespace-nowrap">現有庫存</th>
                <th className="py-3 px-3 whitespace-nowrap">狀態</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[265px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-stone-500 space-y-3">
                    <div>
                      {products.length === 0
                        ? `目前雲端商品資料庫為空（切換至新 Firebase 專案 jinyuan-92d37 後尚未錄入商品）。系統已備妥您先前設定好的全部 ${INITIAL_PRODUCTS.length} 款錦源商品（含價格、克數規格與照片），點擊下方按鈕即可立即寫入雲端：`
                        : '此系列或搜尋條件下目前沒有商品。'}
                    </div>
                    {products.length === 0 && onInitializeStarterCatalog && (
                      <div>
                        <button
                          type="button"
                          onClick={onInitializeStarterCatalog}
                          disabled={isInitializingStarterCatalog}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-60 text-amber-100 text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          {isInitializingStarterCatalog ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span>
                            {isInitializingStarterCatalog
                              ? `正在批量錄入 ${INITIAL_PRODUCTS.length} 款商品至 Firebase...`
                              : `📥 一鍵錄入原本全部 ${INITIAL_PRODUCTS.length} 款錦源商品至 Firebase`}
                          </span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLowStock = prod.stock < 35;
                  const prodImages = getProductImages(prod);
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Image + Inline Editable Title & Description */}
                      <td className="py-3.5 px-4 min-w-[290px]">
                        <div className="flex items-start gap-3">
                          <div className="relative group/pic shrink-0">
                            <img
                              src={prod.image}
                              alt={prod.nameZh}
                              className="w-16 h-14 rounded-xl object-cover bg-stone-100 border border-stone-200 dark:border-stone-700"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-stone-900 text-amber-300 rounded shadow">
                              {prodImages.length}張
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoModal(prod)}
                              className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover/pic:opacity-100 flex items-center justify-center rounded-xl transition cursor-pointer"
                              title="編輯 3–5 張商品照片"
                            >
                              換圖
                            </button>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                aria-label={`${prod.nameZh} 商品標題`}
                                value={
                                  inlineDrafts[prod.id]?.nameZh !== undefined
                                    ? inlineDrafts[prod.id]!.nameZh!
                                    : prod.nameZh
                                }
                                onChange={(e) =>
                                  handleInlineFieldChange(prod.id, 'nameZh', e.target.value)
                                }
                                placeholder="輸入商品標題..."
                                className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 hover:border-stone-300 focus:border-red-800 focus:bg-white dark:focus:bg-stone-900 rounded-lg focus:outline-none transition"
                              />
                              {prod.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 whitespace-nowrap shrink-0">
                                  {prod.badge}
                                </span>
                              )}
                            </div>

                            <textarea
                              rows={2}
                              aria-label={`${prod.nameZh} 商品描述`}
                              value={
                                inlineDrafts[prod.id]?.descriptionZh !== undefined
                                  ? inlineDrafts[prod.id]!.descriptionZh!
                                  : prod.descriptionZh || ''
                              }
                              onChange={(e) =>
                                handleInlineFieldChange(prod.id, 'descriptionZh', e.target.value)
                              }
                              placeholder="修改商品特色詳情描述（完成後請按「儲存修改」）..."
                              className="w-full px-2 py-1 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 hover:border-stone-300 focus:border-red-800 focus:bg-white dark:focus:bg-stone-900 rounded-lg focus:outline-none transition resize-none leading-snug"
                            />

                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="font-mono text-stone-400 truncate">
                                {prod.sku} · {prod.nameEn || '無英文標題'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {inlineSavingIds[prod.id] && (
                                  <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    儲存雲端中...
                                  </span>
                                )}
                                {!inlineSavingIds[prod.id] && inlineSavedIds[prod.id] && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                    已同步雲端
                                  </span>
                                )}
                                {!inlineSavingIds[prod.id] && inlineDrafts[prod.id] && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDiscardInlineDraft(prod.id)}
                                      className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-700 dark:text-stone-200 font-bold rounded cursor-pointer"
                                    >
                                      取消
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInlineCommitProduct(prod)}
                                      className="px-2.5 py-0.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded cursor-pointer shadow-2xs"
                                    >
                                      💾 儲存修改
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Series & Inline Category Dropdown + Meat Tag */}
                      <td className="py-3.5 px-3 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            aria-label={`${prod.nameZh} 商品分類`}
                            value={
                              inlineDrafts[prod.id]?.category !== undefined
                                ? inlineDrafts[prod.id]!.category!
                                : prod.category
                            }
                            disabled={Boolean(inlineSavingIds[prod.id])}
                            onChange={(e) => {
                              handleInlineFieldChange(
                                prod.id,
                                'category',
                                e.target.value as ProductCategory
                              );
                            }}
                            className="w-full min-w-[130px] px-2 py-1 text-xs font-bold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-red-800 cursor-pointer"
                          >
                            {storeCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.emoji} {cat.labelZh}
                              </option>
                            ))}
                            {!storeCategories.some((c) => c.id === prod.category) && (
                              <option value={prod.category}>{prod.categoryLabelZh || prod.category}</option>
                            )}
                          </select>
                          <div className="text-[11px] text-stone-400 px-0.5">
                            {getSeriesFriendlyLabel(prod, categoryLabelMap)} · {getMeatLabel(inferProductMeatTag(prod), 'zh')}
                          </div>
                        </div>
                      </td>

                      {/* Unit Weight */}
                      <td className="py-3.5 px-3 text-stone-500 font-mono whitespace-nowrap">
                        <div>{prod.unitWeight}</div>
                        {prod.specs && prod.specs.length > 0 && (
                          <div className="text-[10px] text-stone-400">{prod.specs.length} 種重量價位</div>
                        )}
                      </td>

                      {/* Price (Buffered until explicit Save click) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-stone-500 font-bold">RM</span>
                          <input
                            type="number"
                            value={
                              inlineDrafts[prod.id]?.price !== undefined
                                ? inlineDrafts[prod.id]!.price!
                                : prod.price
                            }
                            onChange={(e) =>
                              handleInlineFieldChange(prod.id, 'price', Number(e.target.value))
                            }
                            className="w-18 px-2 py-1 text-xs font-mono font-bold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                          />
                        </div>
                      </td>

                      {/* Stock (Buffered until explicit Save click) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={
                              inlineDrafts[prod.id]?.stock !== undefined
                                ? inlineDrafts[prod.id]!.stock!
                                : prod.stock
                            }
                            onChange={(e) =>
                              handleInlineFieldChange(prod.id, 'stock', Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 text-xs font-mono font-bold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                          />
                          <span className="text-stone-400">件</span>
                          {isLowStock && (
                            <span title="庫存緊張">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                            prod.stock > 0
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                          }`}
                        >
                          {prod.stock > 0 ? '現貨在售' : '暫時缺貨'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDetails(prod)}
                            className="px-2.5 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="修改商品標題、字眼、詳情簡介與規格價格"
                          >
                            <Pencil className="w-3 h-3 text-red-700 dark:text-amber-400" />
                            <span>編輯內容 / 字眼</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(prod)}
                            className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition cursor-pointer"
                          >
                            📸 照片 ({prodImages.length}/5)
                          </button>

                          {onSaveSettings && (
                            <button
                              type="button"
                              onClick={() => handleToggleHotShowcase(prod.id)}
                              className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                activeHotIds.includes(prod.id)
                                  ? 'bg-red-900 text-amber-200 border-red-900'
                                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-red-700'
                              }`}
                              title="切換是否放入首頁熱門自動展示區"
                            >
                              <Flame className="w-3 h-3" />
                              <span>
                                {activeHotIds.includes(prod.id)
                                  ? `#${activeHotIds.indexOf(prod.id) + 1}`
                                  : '熱門'}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteTargetProduct(prod)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="下架並刪除商品"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PRODUCT WORDING / TITLE / DESCRIPTION / DETAILS MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-red-700" />
                  <span>編輯商品標題、字眼與詳細內容：{editingProduct.nameZh}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  修改後將即時寫入 Firebase 雲端資料庫並同步更新至前台商店卡片與商品詳情頁。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsModalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{detailsModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProductDetails} className="space-y-4 text-xs">
              {/* Titles ZH & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    商品中文標題 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameZh}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameZh: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    商品英文標題 (English Title)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.nameEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Badges & Category / Meat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    角落推薦字眼 / 角標 (Badge)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    placeholder="例：經典招牌 / 送禮推薦"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    英文角標 (Badge EN)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badgeEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badgeEn: e.target.value })}
                    placeholder="Signature / Festive"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    所屬產品系列 *
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      setEditingProduct({
                        ...editingProduct,
                        category: cat,
                        categoryLabelZh: categoryLabelMap[cat] || editingProduct.categoryLabelZh,
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  >
                    {storeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.labelZh}
                      </option>
                    ))}
                    {!storeCategories.some((c) => c.id === editingProduct.category) && (
                      <option value={editingProduct.category}>{editingProduct.categoryLabelZh || editingProduct.category}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    系列標籤字眼 (顯示於卡片)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.categoryLabelZh}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryLabelZh: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* SKU, Price, Original Price, Stock, Unit Weight */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    貨號 (SKU)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    售價 (RM)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono font-bold text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    原價劃線 (選填)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="無"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    庫存數量
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    預設包裝字眼
                  </label>
                  <input
                    type="text"
                    value={editingProduct.unitWeight}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, unitWeight: e.target.value })
                    }
                    placeholder="例：250g 起 / 1 粒"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Descriptions ZH & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    商品中文詳情與介紹 (Description ZH)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.descriptionZh}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descriptionZh: e.target.value })
                    }
                    placeholder="輸入商品口感、炭火工藝、送禮特色或食用建議..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    商品英文詳情 (Description EN)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.descriptionEn || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })
                    }
                    placeholder="Optional English product details..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 leading-relaxed"
                  />
                </div>
              </div>

              {/* Weight Specs Editor */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      多重量 / 份量規格與售價表（例：250g RM 35 | 500g RM 68）
                    </span>
                    <p className="text-[11px] text-stone-500">
                      若商品為單一固定售價，將下方規格清空即可。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增規格</span>
                  </button>
                </div>

                {editingProduct.specs && editingProduct.specs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editingProduct.specs.map((specItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800"
                      >
                        <input
                          type="text"
                          value={specItem.spec}
                          onChange={(e) => handleSpecChange(idx, 'spec', e.target.value)}
                          placeholder="規格字眼（例：500g）"
                          className="flex-1 px-2.5 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-xs"
                        />
                        <span className="text-stone-400 font-mono">RM</span>
                        <input
                          type="number"
                          value={specItem.price}
                          onChange={(e) => handleSpecChange(idx, 'price', e.target.value)}
                          className="w-20 px-2.5 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded font-mono font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(idx)}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                          title="刪除此規格"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variant Options / Flavors */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  款式 / 口味選項字眼（選填，例如月餅口味、造型樣式；多個選項請用逗號分隔）
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-500 mb-1">選項提示標題（中文）</label>
                    <input
                      type="text"
                      value={editingProduct.variantOptionLabelZh || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, variantOptionLabelZh: e.target.value })
                      }
                      placeholder="例：選擇月餅口味"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">選項清單（中文，用「、」或「,」分隔）</label>
                    <input
                      type="text"
                      value={editVariantTextZh}
                      onChange={(e) => setEditVariantTextZh(e.target.value)}
                      placeholder="例：豆沙口味、肉鬆口味、蓮蓉蛋黃口味"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Option Label (EN)</label>
                    <input
                      type="text"
                      value={editingProduct.variantOptionLabelEn || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, variantOptionLabelEn: e.target.value })
                      }
                      placeholder="Select Flavor"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">Options (EN, comma-separated)</label>
                    <input
                      type="text"
                      value={editVariantTextEn}
                      onChange={(e) => setEditVariantTextEn(e.target.value)}
                      placeholder="Red Bean, Meat Floss, Lotus Yolk"
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={isSavingDetails}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-900 hover:bg-red-800 disabled:opacity-60 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSavingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingDetails ? '儲存並同步雲端中...' : '儲存所有內容並同步至前台'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal (Supports 3 to 5 photos) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif-brand text-lg font-bold">
                新增商城商品（支援上傳 3–5 張商品輪播圖）
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-500 mb-1">貨號 (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="JY-BK-09"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">分類系列 *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProductCategory;
                      setNewProduct({
                        ...newProduct,
                        category: nextCat,
                        categoryLabelZh: categoryLabelMap[nextCat] || newProduct.categoryLabelZh,
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  >
                    {storeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.labelZh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">食材類型（用於前台篩選）</label>
                  <select
                    value={newProduct.meatType || 'pork'}
                    onChange={(e) => setNewProduct({ ...newProduct, meatType: e.target.value as MeatType })}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  >
                    <option value="pork">🐷 豬肉類 Pork</option>
                    <option value="chicken">🐔 雞肉類 Chicken</option>
                    <option value="duck">🦆 鴨肉 Duck</option>
                    <option value="cookies">🍪 年餅小吃 Cookies</option>
                    <option value="seasonal">🎋 節慶限定 Seasonal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 mb-1">商品中文名稱 *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.nameZh}
                    onChange={(e) => setNewProduct({ ...newProduct, nameZh: e.target.value })}
                    placeholder="例：古早味炭烤金錢肉乾"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">英文名稱 (選填)</label>
                  <input
                    type="text"
                    value={newProduct.nameEn || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, nameEn: e.target.value })}
                    placeholder="Traditional Coin Bak Kwa"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-500 mb-1">售價 (RM) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">初始庫存 *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">包裝規格</label>
                  <input
                    type="text"
                    value={newProduct.unitWeight}
                    onChange={(e) => setNewProduct({ ...newProduct, unitWeight: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1">推薦角標字眼</label>
                  <input
                    type="text"
                    value={newProduct.badge || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                    placeholder="招牌推介"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-500 mb-1">特色簡述</label>
                <textarea
                  rows={2}
                  value={newProduct.descriptionZh}
                  onChange={(e) => setNewProduct({ ...newProduct, descriptionZh: e.target.value })}
                  placeholder="簡短描述風味與特點..."
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Multi-photo Upload Section (3 to 5 photos) */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    商品照片（已選 {newProductImages.length}/5 張，建議 3–5 張）
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg cursor-pointer transition">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? '壓縮上傳中...' : '上傳多張本地照片'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploading}
                      onChange={handleUploadNewProductFiles}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const url = newProductImages[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className="relative aspect-square rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden flex items-center justify-center"
                      >
                        {url ? (
                          <>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {slotIdx === 0 && (
                              <span className="absolute top-1 left-1 px-1 py-0.2 bg-red-800 text-white text-[9px] font-bold rounded">
                                主圖
                              </span>
                            )}
                            {newProductImages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setNewProductImages((prev) => prev.filter((_, i) => i !== slotIdx))}
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-700 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-stone-400">照片 {slotIdx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProdUrlInput}
                    onChange={(e) => setNewProdUrlInput(e.target.value)}
                    placeholder="或貼上第 4、5 張圖片 URL 網址..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProdUrlInput.trim() || newProductImages.length >= 5) return;
                      setNewProductImages((prev) => [...prev, newProdUrlInput.trim()]);
                      setNewProdUrlInput('');
                    }}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-md font-bold cursor-pointer"
                  >
                    加入網址
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct || isUploading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-red-900 hover:bg-red-800 disabled:opacity-60 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreatingProduct ? '同步雲端中...' : '確認上架並同步至雲端'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Photo Change Modal (3 to 5 photos) */}
      {photoModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-red-700" />
                  <span>管理商品輪播照片（3–5 張）：{photoModalProduct.nameZh}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  上傳本地照片後，系統將直接上傳至 <strong>Cloudinary 雲端圖床</strong> 取得短網址 (https://res.cloudinary.com/...)，按下「儲存」後才寫入 Firebase！
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalProduct(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {photoModalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoModalError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Status bar & Upload button */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    目前已設定 <span className="text-red-800 dark:text-amber-400 font-mono text-sm">{editImages.length} / 5</span> 張照片
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      editImages.length >= 3
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {editImages.length >= 3 ? '✓ 已達 3–5 張推薦標準' : '建議補齊至 3–5 張照片'}
                  </span>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl cursor-pointer transition shadow-xs">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? '圖片壓縮與上傳中...' : '一次上傳多張照片 (最多5張)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading || editImages.length >= 5}
                    onChange={handleMultiFileUploadForProduct}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 5 Photo Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const imgUrl = editImages[idx];
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-xl border-2 overflow-hidden flex flex-col justify-between bg-stone-50 dark:bg-stone-950 ${
                        imgUrl
                          ? idx === 0
                            ? 'border-red-700 shadow-sm'
                            : 'border-stone-200 dark:border-stone-700'
                          : 'border-dashed border-stone-300 dark:border-stone-700 min-h-[120px]'
                      }`}
                    >
                      {imgUrl ? (
                        <>
                          <div className="relative aspect-square bg-stone-100">
                            <img
                              src={imgUrl}
                              alt={`圖 ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {idx === 0 ? (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-800 text-white text-[10px] font-bold rounded shadow">
                                ★ 封面主圖
                              </span>
                            ) : (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                                第 {idx + 1} 張
                              </span>
                            )}
                            <span
                              className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded shadow ${
                                imgUrl.includes('cloudinary.com')
                                  ? 'bg-sky-700/90 text-white'
                                  : 'bg-emerald-700/90 text-white'
                              }`}
                              title={imgUrl}
                            >
                              {imgUrl.includes('cloudinary.com') ? '✓ Cloudinary' : '✓ 圖片URL'}
                            </span>
                          </div>

                          <div className="p-1.5 flex items-center justify-between gap-1 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
                            {idx > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(idx)}
                                className="flex-1 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded cursor-pointer flex items-center justify-center gap-0.5"
                                title="設為首張主圖"
                              >
                                <span>★ 設主圖</span>
                              </button>
                            ) : (
                              <span className="flex-1 text-center text-[10px] text-emerald-700 font-bold">
                                顯示第一張
                              </span>
                            )}
                            {editImages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEditPhoto(idx)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                                title="刪除此照片"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center text-stone-400">
                          <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                          <span className="text-[11px]">空位 {idx + 1}</span>
                          <span className="text-[10px]">可點下方圖庫補充</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gallery Presets */}
              <div>
                <span className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  點擊從錦源實拍圖庫快速加入（最多 5 張）：
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_GALLERY_IMAGES.map((img) => {
                    const alreadyAdded = editImages.includes(img.url);
                    return (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => handleAddPresetToEdit(img.url)}
                        className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                          alreadyAdded
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-8 h-8 rounded object-cover shrink-0" />
                        <span className="text-[11px] truncate flex-1">{img.label}</span>
                        {alreadyAdded && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  placeholder="或貼上額外照片網址 https://..."
                  className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddUrlToEdit}
                  disabled={!newUrlInput.trim() || editImages.length >= 5}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-white rounded-md font-bold cursor-pointer"
                >
                  + 加入網址
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setPhotoModalProduct(null)}
                  disabled={isSavingPhotos}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductPhotos}
                  disabled={isSavingPhotos || isUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-900 hover:bg-red-800 disabled:opacity-60 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSavingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>
                    {isSavingPhotos
                      ? '同步至雲端資料庫中...'
                      : `💾 儲存 ${editImages.length} 張照片並同步雲端`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Product Confirmation Modal */}
      {deleteTargetProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100">
                  確認永久下架並刪除商品？
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  即將從商店與雲端資料庫永久移除以下商品（此操作無法復原）：
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
              <img
                src={deleteTargetProduct.image}
                alt={deleteTargetProduct.nameZh}
                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  {deleteTargetProduct.nameZh}
                </div>
                <div className="text-[11px] font-mono text-stone-500">
                  {deleteTargetProduct.sku} · RM {deleteTargetProduct.price}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => setDeleteTargetProduct(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer transition"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={async () => {
                  const target = deleteTargetProduct;
                  setIsDeletingProduct(true);
                  try {
                    await onDeleteProduct(target.id);
                    setDeleteTargetProduct(null);
                    showNotice(`已成功刪除商品「${target.nameZh}」並同步雲端！`);
                  } catch (err) {
                    console.error('Delete product failed:', err);
                    showNotice(
                      err instanceof Error
                        ? `刪除失敗：${err.message}`
                        : '刪除商品失敗，請確認已使用授權店長 Gmail 登入並檢查網路連線。',
                      'error'
                    );
                    setDeleteTargetProduct(null);
                  } finally {
                    setIsDeletingProduct(false);
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingProduct ? '正在刪除中...' : '確認刪除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
