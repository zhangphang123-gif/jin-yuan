import React, { useState } from 'react';
import { ImageAsset, StoreProduct, StoreSettings } from '../../types/store';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  Trash2,
  Sparkles,
  ExternalLink,
  Tag,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';

interface AssetManagerProps {
  assets: ImageAsset[];
  products: StoreProduct[];
  settings: StoreSettings;
  onAddAsset: (asset: ImageAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onUpdateLogo: (url: string) => Promise<void> | void;
  onUpdateBanner: (url: string) => Promise<void> | void;
  onUpdateProductImage: (productId: string, imageUrl: string) => Promise<void> | void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  products,
  settings,
  onAddAsset,
  onDeleteAsset,
  onUpdateLogo,
  onUpdateBanner,
  onUpdateProductImage,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<ImageAsset | null>(null);
  const [targetProductId, setTargetProductId] = useState<string>('');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlCategory, setUrlCategory] = useState<'logo' | 'banner' | 'product' | 'story' | 'general'>('product');
  const [confirmDeleteAssetId, setConfirmDeleteAssetId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('請上傳 JPG、PNG 或 WebP 格式的圖片文件！', 'error');
      return;
    }

    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const downloadUrl = await uploadImageToCloudinary(file, 'products', {
        cloudName: settings.cloudinaryCloudName,
        uploadPreset: settings.cloudinaryUploadPreset,
      });

      const newAsset: ImageAsset = {
        id: `asset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: downloadUrl,
        category: 'product',
        uploadedAt: new Date().toISOString().slice(0, 10),
        size: `${Math.round(file.size / 1024)} KB`,
      };
      onAddAsset(newAsset);
      showNotification(`成功上傳至 Cloudinary 圖床：${file.name}`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : '圖片上傳至 Cloudinary 失敗，請重試！', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => processFile(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => processFile(file));
      e.target.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newAsset: ImageAsset = {
      id: `asset-url-${Date.now()}`,
      name: urlName.trim() || '自訂網址圖片',
      url: urlInput.trim(),
      category: urlCategory,
      uploadedAt: new Date().toISOString().slice(0, 10),
      size: '外部網址',
    };
    onAddAsset(newAsset);
    setUrlInput('');
    setUrlName('');
    showNotification('成功添加圖片素材！');
  };

  const handleCopy = (asset: ImageAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification('圖片網址已複製到剪貼板！');
  };

  const handleConfirmAssign = async () => {
    if (!assigningAsset || !targetProductId) return;
    try {
      await onUpdateProductImage(targetProductId, assigningAsset.url);
      const prod = products.find((p) => p.id === targetProductId);
      showNotification(`已成功將圖片同步至商品主圖：${prod?.nameZh || targetProductId}`);
      setAssigningAsset(null);
      setTargetProductId('');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : '套用圖片至商品失敗，請重試。', 'error');
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      return a.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-red-700 dark:text-red-400" />
            <span>圖片素材管理 (Asset Management)</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            拖曳上傳肉乾、燒臘、年餅或 Logo 照片，一鍵快速替換全站商品主圖、Logo 與首頁橫幅。
          </p>
        </div>

        <div className="text-xs text-stone-500 font-mono">
          現有素材庫存: <strong className="text-stone-900 dark:text-stone-100">{assets.length}</strong> 張
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-red-600 bg-red-50/60 dark:bg-red-950/20 scale-[1.01]'
            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-red-500'
        }`}
      >
        <input
          type="file"
          id="asset-file-input"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="sr-only"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              將圖片拖曳至此處，或直接點選上傳
            </h3>
            <p className="text-xs sm:text-sm text-stone-500">
              支援 PNG、JPG、JPEG、WebP 格式（手機實拍或單眼高畫質圖均可）
            </p>
          </div>

          <label
            htmlFor="asset-file-input"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer active:scale-98"
          >
            <span>📁 瀏覽電腦 / 手機相冊</span>
          </label>
        </div>
      </div>

      {/* URL Fast Import Bar */}
      <form
        onSubmit={handleAddUrl}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs"
      >
        <span className="font-bold text-stone-700 dark:text-stone-300 shrink-0">
          🌐 網址添加素材：
        </span>
        <input
          type="text"
          value={urlName}
          onChange={(e) => setUrlName(e.target.value)}
          placeholder="素材名稱 (例：炭烤切片肉乾)"
          className="w-full sm:w-44 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
        />
        <input
          type="url"
          required
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="請貼入外部圖片 URL (https://...)"
          className="flex-1 w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-800 dark:text-stone-200"
        />
        <select
          value={urlCategory}
          onChange={(e) => setUrlCategory(e.target.value as any)}
          className="px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-medium"
        >
          <option value="product">商品實拍</option>
          <option value="logo">店鋪 Logo</option>
          <option value="banner">首頁橫幅</option>
          <option value="story">品牌故事</option>
          <option value="general">其他素材</option>
        </select>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white font-bold rounded-xl hover:opacity-90 transition shrink-0 cursor-pointer"
        >
          加入素材庫
        </button>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-2 p-1 bg-stone-200/80 dark:bg-stone-900 rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'all', label: '全部素材 All' },
            { id: 'logo', label: '👑 標誌 Logo' },
            { id: 'banner', label: '🖼️ 首頁橫幅' },
            { id: 'product', label: '🥩 商品照片' },
            { id: 'story', label: '📖 品牌專訪' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-red-900 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋素材名稱..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl"
          />
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map((asset) => {
          const isCurrentLogo = settings.logoUrl === asset.url;
          const isCurrentBanner = settings.heroBannerUrl === asset.url;

          return (
            <div
              key={asset.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-950 overflow-hidden border-b border-stone-100 dark:border-stone-800">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    {isCurrentLogo && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-stone-950 rounded shadow-xs">
                        👑 目前 Logo
                      </span>
                    )}
                    {isCurrentBanner && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-700 text-white rounded shadow-xs">
                        🖼️ 目前首頁橫幅
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate" title={asset.name}>
                    {asset.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>{asset.uploadedAt}</span>
                    <span>{asset.size || '原圖'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={async () => {
                      try {
                        await onUpdateLogo(asset.url);
                        showNotification('已將此圖片同步為全站店鋪 Logo！');
                      } catch (err) {
                        showNotification(err instanceof Error ? err.message : '更新 Logo 失敗，請重試。', 'error');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xl transition cursor-pointer text-center ${
                      isCurrentLogo
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-900'
                    }`}
                  >
                    👑 設為 Logo
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await onUpdateBanner(asset.url);
                        showNotification('已將此圖片同步為首頁大橫幅 Banner！');
                      } catch (err) {
                        showNotification(err instanceof Error ? err.message : '更新首頁橫幅失敗，請重試。', 'error');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xl transition cursor-pointer text-center ${
                      isCurrentBanner
                        ? 'bg-red-100 text-red-900 font-bold border border-red-300'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-red-100 hover:text-red-900'
                    }`}
                  >
                    🖼️ 設為橫幅
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setAssigningAsset(asset)}
                    className="flex-1 py-1.5 px-2 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white rounded-xl text-xs font-bold transition hover:opacity-90 cursor-pointer text-center"
                  >
                    📦 應用到商品
                  </button>

                  <button
                    onClick={() => handleCopy(asset)}
                    className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-xl transition cursor-pointer"
                    title="複製圖片連結"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirmDeleteAssetId !== asset.id) {
                        setConfirmDeleteAssetId(asset.id);
                        setTimeout(() => {
                          setConfirmDeleteAssetId((curr) => (curr === asset.id ? null : curr));
                        }, 4000);
                        return;
                      }
                      setConfirmDeleteAssetId(null);
                      onDeleteAsset(asset.id);
                      showNotification('已刪除該素材。');
                    }}
                    className={`px-2 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      confirmDeleteAssetId === asset.id
                        ? 'bg-red-700 text-white'
                        : 'text-stone-400 hover:text-red-600 bg-stone-100 dark:bg-stone-800'
                    }`}
                    title={confirmDeleteAssetId === asset.id ? '再點一次確認刪除' : '刪除素材'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteAssetId === asset.id && <span>確認?</span>}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Assign to Product Modal */}
      {assigningAsset && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100">
              將圖片應用至特定商品
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
              <img
                src={assigningAsset.url}
                alt={assigningAsset.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="text-xs min-w-0">
                <strong className="block truncate">{assigningAsset.name}</strong>
                <span className="text-stone-500 font-mono">即將套用為商品照片</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-stone-600 dark:text-stone-400 font-medium">
                請選擇要更換照片的商品：
              </label>
              <select
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 font-bold"
              >
                <option value="">-- 請選擇商品 --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.categoryLabelZh}] {p.nameZh} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setAssigningAsset(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 cursor-pointer font-bold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={!targetProductId}
                className="px-5 py-2 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
              >
                確認替換商品照片
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
