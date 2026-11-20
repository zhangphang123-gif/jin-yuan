import React, { useState, useEffect, useRef } from 'react';
import { StoreSettings } from '../../types/store';
import { saveThemeToLocalStorage } from '../../utils/themeStorage';
import { Save, Download, RotateCcw, Check, MessageCircle, DollarSign, Building, Image as ImageIcon, Upload, Cloud } from 'lucide-react';

interface StoreSettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onExportData: () => void;
  onResetData: () => void;
}

const PRESET_BANNERS = [
  { label: '炭烤肉乾爐火', url: '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg' },
  { label: '新春年餅酥點', url: '/src/assets/images/product_cookies_tarts_1794479276784.jpg' },
  { label: '金黃酥香肉鬆', url: '/src/assets/images/product_meat_floss_1794479275258.jpg' },
  { label: '傳承古法臘腸', url: '/src/assets/images/product_lapcheong_sausage_1794479276119.jpg' },
];

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const dirtyImageKeysRef = useRef<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const dirty = dirtyImageKeysRef.current;
    setFormData((prev) => ({
      ...prev,
      ...settings,
      ...(dirty.logoUrl ? { logoUrl: prev.logoUrl } : {}),
      ...(dirty.heroBannerUrl ? { heroBannerUrl: prev.heroBannerUrl } : {}),
      ...(dirty.paymentQrCodeUrl ? { paymentQrCodeUrl: prev.paymentQrCodeUrl } : {}),
      ...(dirty.brandStoryWorkshopImg ? { brandStoryWorkshopImg: prev.brandStoryWorkshopImg } : {}),
      ...(dirty.brandStoryHeritageImg ? { brandStoryHeritageImg: prev.brandStoryHeritageImg } : {}),
    }));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveSettings({ ...settings, ...formData });
      if (formData.storefrontTheme) {
        saveThemeToLocalStorage(formData.storefrontTheme);
      }
      dirtyImageKeysRef.current = {};
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '儲存店鋪設定失敗，請重試。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsUploadingAsset('logo');
    setSaveError(null);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'logos', {
        cloudName: formData.cloudinaryCloudName,
        uploadPreset: formData.cloudinaryUploadPreset,
      });
      dirtyImageKeysRef.current.logoUrl = true;
      setFormData((prev) => ({ ...prev, logoUrl: secureUrl }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Logo 上傳至 Cloudinary 失敗，請重試。');
    } finally {
      setIsUploadingAsset(null);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsUploadingAsset('banner');
    setSaveError(null);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'banners', {
        cloudName: formData.cloudinaryCloudName,
        uploadPreset: formData.cloudinaryUploadPreset,
      });
      dirtyImageKeysRef.current.heroBannerUrl = true;
      setFormData((prev) => ({ ...prev, heroBannerUrl: secureUrl }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '橫幅圖片上傳至 Cloudinary 失敗，請重試。');
    } finally {
      setIsUploadingAsset(null);
      e.target.value = '';
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsUploadingAsset('qr');
    setSaveError(null);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'qr', {
        cloudName: formData.cloudinaryCloudName,
        uploadPreset: formData.cloudinaryUploadPreset,
      });
      dirtyImageKeysRef.current.paymentQrCodeUrl = true;
      setFormData((prev) => ({ ...prev, paymentQrCodeUrl: secureUrl }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '收款 QR 上傳至 Cloudinary 失敗，請重試。');
    } finally {
      setIsUploadingAsset(null);
      e.target.value = '';
    }
  };

  const handleStoryPhotoUpload = async (
    targetField: 'brandStoryWorkshopImg' | 'brandStoryHeritageImg',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsUploadingAsset(targetField);
    setSaveError(null);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'story', {
        cloudName: formData.cloudinaryCloudName,
        uploadPreset: formData.cloudinaryUploadPreset,
      });
      dirtyImageKeysRef.current[targetField] = true;
      setFormData((prev) => ({ ...prev, [targetField]: secureUrl }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '品牌故事圖片上傳至 Cloudinary 失敗，請重試。');
    } finally {
      setIsUploadingAsset(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl text-sm">
      <div>
        <h2 className="font-serif-brand text-2xl font-bold text-stone-900 dark:text-stone-100">
          店鋪視覺、品牌照片與通訊金流設定
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          在此可自由更換商城 Logo、主頁橫幅圖片、WhatsApp 接收號碼、DuitNow/TNG 收款帳戶與免運門檻（隨時修改即時生效，上線後亦可直接在此更換！）
        </p>
      </div>

      {saveError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold">
          {saveError}
        </div>
      )}

      {isUploadingAsset && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
          正在直接上傳至 Cloudinary 雲端圖床並取得 HTTPS 網址，完成後請點擊下方「儲存所有店鋪設定與照片」...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Storefront UI Theme Switcher (Classic Traditional vs Luxury Camping Atelier) */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <span>🎨 前台官網設計風格切換 (Storefront UI Design)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                自由在「經典傳統年版」與「尊榮新春賀歲版（大橫幅精奢紅金）」之間切換。切換並儲存後，所有顧客訪問前台官網將立即呈現所選介面，原本商品與購物車功能完全保留。
              </p>
            </div>
              <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                目前使用：
                {formData.storefrontTheme === 'luxury_3d'
                  ? '🖤 Version 3：當代頂奢黑金 3D 版'
                  : formData.storefrontTheme === 'cny_festive'
                  ? '🧧 尊榮新春賀歲版'
                  : '🏮 Version 1：經典傳統暖色版'}
              </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Option 1: Classic Heritage */}
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, storefrontTheme: 'classic' }))}
              className={`text-left p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                (formData.storefrontTheme || 'classic') === 'classic'
                  ? 'border-red-800 bg-red-50/50 dark:bg-red-950/20 shadow-sm'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950 hover:border-stone-400'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100">
                    🏮 Version 1：經典傳統暖色版
                  </span>
                  {(formData.storefrontTheme || 'classic') === 'classic' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 dark:text-red-300 bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-red-300 dark:border-red-800">
                      <Check className="w-3 h-3" /> 已選擇
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  保留原本白底紅金傳統佈局、頂部滾動公告、大橫幅輪播與側邊篩選欄。
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
                <span className="w-5 h-5 rounded-full bg-red-900 border border-amber-400" title="朱紅主色" />
                <span className="w-5 h-5 rounded-full bg-amber-400 border border-stone-300" title="金邊點綴" />
                <span className="w-5 h-5 rounded-full bg-stone-50 border border-stone-300" title="暖白底色" />
                <span className="text-[11px] font-mono text-stone-500 ml-auto">VERSION 1</span>
              </div>
            </button>

            {/* Option 2: Modern Dark Luxury 3D Tech (Version 3) */}
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, storefrontTheme: 'luxury_3d' }))}
              className={`text-left p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                formData.storefrontTheme === 'luxury_3d'
                  ? 'border-[#E5B869] bg-[#140B09] text-[#F6DFA9] shadow-sm'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950 hover:border-[#E5B869]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-serif-brand font-bold text-base ${
                      formData.storefrontTheme === 'luxury_3d'
                        ? 'text-[#F6DFA9]'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    🖤 Version 3：當代頂奢黑金 3D 版
                  </span>
                  {formData.storefrontTheme === 'luxury_3d' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B0807] bg-[#E5B869] px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> 已選擇
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    formData.storefrontTheme === 'luxury_3d'
                      ? 'text-[#D6C7B2]'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  暗夜黑金磨砂玻璃、炭火粒子特效、3D 傾斜視差與聚光燈 Bento 網格旗艦介面。
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-stone-200/20">
                <span className="w-5 h-5 rounded-full bg-[#0B0807] border border-[#E5B869]" title="暗夜炭黑" />
                <span className="w-5 h-5 rounded-full bg-[#E5B869] border border-stone-300" title="香檳金" />
                <span className="w-5 h-5 rounded-full bg-[#7A1215] border border-[#E5B869]" title="宮廷暗紅" />
                <span className="text-[11px] font-mono text-[#E5B869] ml-auto">VERSION 3</span>
              </div>
            </button>

            {/* Option 3: Imperial CNY Festive Luxury */}
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, storefrontTheme: 'cny_festive' }))}
              className={`text-left p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                formData.storefrontTheme === 'cny_festive'
                  ? 'border-[#7A1215] bg-[#FBF7F0] dark:bg-red-950/30 shadow-sm'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950 hover:border-stone-400'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100">
                    🧧 尊榮新春賀歲版 (CNY Luxury)
                  </span>
                  {formData.storefrontTheme === 'cny_festive' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A1215] dark:text-amber-300 bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-[#D4AF37]">
                      <Check className="w-3 h-3" /> 已選擇
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  超大寬幅視覺大橫幅、宮廷御朱紅漸層與暖白宣紙底色的新春節慶設計。
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
                <span className="w-5 h-5 rounded-full bg-[#7A1215] border border-[#D4AF37]" title="御朱紅" />
                <span className="w-5 h-5 rounded-full bg-[#D4AF37] border border-stone-300" title="香檳金" />
                <span className="w-5 h-5 rounded-full bg-[#FBF7F0] border border-stone-300" title="暖白宣紙" />
                <span className="text-[11px] font-mono text-stone-500 ml-auto">FESTIVE UI</span>
              </div>
            </button>
          </div>
        </div>

        {/* Cloudinary Image Hosting Settings */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-amber-300/80 dark:border-amber-800/60 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <span>Cloudinary 雲端圖床設定 (商品圖片與付款截圖專用)</span>
            </h3>
            <span className="text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full font-bold">
              Unsigned Upload API · 零 Base64
            </span>
          </div>
          <p className="text-xs text-stone-500">
            設定完成並按下方「儲存所有店鋪設定與照片」後，商店後台傳商品圖、橫幅與顧客結帳上傳付款截圖皆會自動傳到您的 Cloudinary 帳號並僅將短網址寫入 Firebase。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Cloudinary Cloud Name
              </label>
              <input
                type="text"
                value={formData.cloudinaryCloudName || ''}
                onChange={(e) => setFormData({ ...formData, cloudinaryCloudName: e.target.value })}
                placeholder="例如：dxyz123abc"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md font-mono text-xs text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Unsigned Upload Preset 名稱
              </label>
              <input
                type="text"
                value={formData.cloudinaryUploadPreset || ''}
                onChange={(e) => setFormData({ ...formData, cloudinaryUploadPreset: e.target.value })}
                placeholder="例如：jinyuan"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md font-mono text-xs text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] sm:text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
            <strong>⚠️ 確認無法上傳時請檢查這 1 項設定：</strong>前往 Cloudinary Console → <strong>Settings → Upload → Upload presets</strong>，確認名為 <code className="font-mono font-bold px-1 py-0.5 bg-white/80 dark:bg-stone-900 rounded">{formData.cloudinaryUploadPreset || 'jinyuan'}</code> 的 Preset 其 <strong>Signing mode</strong> 必須設為 <strong>Unsigned</strong>（若顯示 Signed 會出現 <code className="font-mono">whitelisted for unsigned uploads</code> 錯誤）。
          </div>
        </div>
        
        {/* Visual Brand Assets (Logo & Hero Banner) */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-700" />
              <span>品牌 Logo 與首頁大橫幅更換 (Logo & Banners)</span>
            </h3>
            <span className="text-xs bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 px-2.5 py-1 rounded-full font-bold">
              隨時換圖 · 上線後可改
            </span>
          </div>

          {/* Logo Setting */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/70 dark:border-stone-800">
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-center shadow-xs mb-2">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-900 text-amber-300 font-serif-brand font-black text-3xl flex items-center justify-center">
                    錦
                  </div>
                )}
              </div>
              <span className="text-xs text-stone-500 font-medium">前台導航 Logo 預覽</span>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  更換品牌 Logo 圖片
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition">
                    <Upload className="w-4 h-4" />
                    <span>從電腦/手機選取 Logo 檔案</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      恢復經典錦字印章
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">或輸入 Logo 圖片網址 (URL)</label>
                <input
                  type="text"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Hero Banner Setting */}
          <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                首頁主視覺大橫幅 (Hero Banner)
              </label>
              <label className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>上傳新首頁橫幅</span>
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </label>
            </div>

            <div className="relative aspect-[21/9] sm:aspect-[24/8] rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900">
              <img
                src={formData.heroBannerUrl || '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg'}
                alt="Banner Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4 text-white">
                <div>
                  <span className="text-xs text-amber-300 font-mono tracking-wider uppercase font-bold">目前首頁橫幅效果</span>
                  <p className="font-serif-brand font-bold text-base mt-0.5">錦源傳統肉乾肉絲專賣店 · 炭火手工慢烤</p>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs text-stone-500 mb-1.5">快速選用精選錦源美食橫幅：</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_BANNERS.map((b) => (
                  <button
                    key={b.url}
                    type="button"
                    onClick={() => setFormData({ ...formData, heroBannerUrl: b.url })}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-red-700 hover:text-red-700 transition cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">或輸入橫幅圖片網址 (URL)</label>
              <input
                type="text"
                value={formData.heroBannerUrl || ''}
                onChange={(e) => setFormData({ ...formData, heroBannerUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Announcement Bar & Promo Note */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-3">
            <div>
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                頂部跑馬燈公告文字 (Announcement Bar)
              </label>
              <input
                type="text"
                value={formData.announcementText || ''}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                placeholder="例：🔥 新年大回饋：購買任意傳統年餅 / 禮盒即免費贈送 50g 招牌肉鬆！全馬常溫真空郵寄 · 滿 RM 300 免運費"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-md text-stone-900 dark:text-stone-100 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="freeFlossPromo"
                checked={formData.freeFlossPromoActive ?? true}
                onChange={(e) => setFormData({ ...formData, freeFlossPromoActive: e.target.checked })}
                className="w-4 h-4 rounded text-red-800 focus:ring-red-700 cursor-pointer"
              />
              <label htmlFor="freeFlossPromo" className="text-xs font-bold text-amber-950 dark:text-amber-200 cursor-pointer">
                啟用「買餅即送 50g 招牌肉鬆」促銷提醒標籤（購物車與前台將自動提示附贈好康）
              </label>
            </div>
          </div>

        </div>

        {/* Brand Story Photos & Copy Editor */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-700" />
              <span>品牌故事圖片與文案編輯 (Brand Story CMS)</span>
            </h3>
            <span className="text-[11px] bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              自動壓縮上傳 Cloudinary · 永久存入 Firestore
            </span>
          </div>
          <p className="text-xs text-stone-500">
            修改品牌故事圖片與文案後不會即時寫入資料庫，請於編輯完成後按下方「💾 儲存所有店鋪設定與照片」統一寫入雲端（留空欄位將保留經典預設文字）。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">故事圖片 1：炭火工坊實景</span>
                <label className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>上傳圖片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleStoryPhotoUpload('brandStoryWorkshopImg', e)}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="aspect-[16/9] rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900">
                <img
                  src={formData.brandStoryWorkshopImg || '/src/assets/images/story_charcoal_workshop_1794634473097.jpg'}
                  alt="Workshop Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={formData.brandStoryWorkshopImg || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryWorkshopImg: e.target.value })}
                placeholder="https://res.cloudinary.com/... (留空則用預設圖)"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md font-mono"
              />
              <input
                type="text"
                value={formData.brandStoryWorkshopTitleZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryWorkshopTitleZh: e.target.value })}
                placeholder="圖 1 標題（預設：爐火旁的四十年堅守）"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md"
              />
              <input
                type="text"
                value={formData.brandStoryWorkshopCaptionZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryWorkshopCaptionZh: e.target.value })}
                placeholder="圖 1 說明文字"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">故事圖片 2：家族傳承禮盒</span>
                <label className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>上傳圖片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleStoryPhotoUpload('brandStoryHeritageImg', e)}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="aspect-[16/9] rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900">
                <img
                  src={formData.brandStoryHeritageImg || '/src/assets/images/story_family_heritage_1794634472318.jpg'}
                  alt="Heritage Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={formData.brandStoryHeritageImg || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryHeritageImg: e.target.value })}
                placeholder="https://res.cloudinary.com/... (留空則用預設圖)"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md font-mono"
              />
              <input
                type="text"
                value={formData.brandStoryHeritageTitleZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryHeritageTitleZh: e.target.value })}
                placeholder="圖 2 標題（預設：兩代同心 · 守護家的味道）"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md"
              />
              <input
                type="text"
                value={formData.brandStoryHeritageCaptionZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryHeritageCaptionZh: e.target.value })}
                placeholder="圖 2 說明文字"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">故事頁主標題</label>
              <input
                type="text"
                value={formData.brandStoryTitleZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryTitleZh: e.target.value })}
                placeholder="預設：我們的品牌故事"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">故事頁副標題</label>
              <input
                type="text"
                value={formData.brandStorySubtitleZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStorySubtitleZh: e.target.value })}
                placeholder="預設：千里肉香是年味，萬變不離其宗..."
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">創辦人語錄引用</label>
              <textarea
                rows={3}
                value={formData.brandStoryQuoteZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryQuoteZh: e.target.value })}
                placeholder="留空則顯示經典創辦人語錄"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">品牌故事結語文案</label>
              <textarea
                rows={3}
                value={formData.brandStoryClosingZh || ''}
                onChange={(e) => setFormData({ ...formData, brandStoryClosingZh: e.target.value })}
                placeholder="留空則顯示經典家族傳承結語"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp & Communications */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>WhatsApp 訂單接收與聯絡資訊</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                店主 WhatsApp 商業電話號碼 *
                <span className="text-xs text-amber-700 dark:text-amber-400 ml-1 font-normal">
                  (顧客下單後將一鍵跳轉傳送至此號碼，須包含國家區號 60，如 60124947842)
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="60124947842"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 font-mono text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">商城品牌抬頭名稱</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">負責人 / 聯絡姓名</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">官方聯絡電郵 (Email)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">門市自取地址與營業說明</label>
                <input
                  type="text"
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Thresholds */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-stone-600" />
            <span>全馬快遞配送與免運門檻設定</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                全馬快遞免運費門檻 (RM) *
              </label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-500">RM</span>
                <input
                  type="number"
                  value={formData.freeShippingThreshold}
                  onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 font-mono text-base font-bold"
                />
              </div>
              <span className="text-xs text-stone-500 mt-1.5 block">
                顧客購物車滿此金額自動享免運費（預設全馬滿 <strong>RM 300</strong> 免運費）
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                標準快遞運費 (RM) *
              </label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-500">RM</span>
                <input
                  type="number"
                  value={formData.defaultShippingFee}
                  onChange={(e) => setFormData({ ...formData, defaultShippingFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 font-mono text-base font-bold"
                />
              </div>
              <span className="text-xs text-stone-500 mt-1.5 block">
                未達免運門檻時之快遞費用（PosLaju / J&T Express 真空包裝直送）
              </span>
            </div>
          </div>
        </div>

        {/* Payment Account Details */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Building className="w-5 h-5 text-stone-600" />
            <span>馬來西亞本地收款帳戶資訊 (結帳時展示給顧客)</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">DuitNow ID / 電話號碼</label>
              <input
                type="text"
                value={formData.duitnowId}
                onChange={(e) => setFormData({ ...formData, duitnowId: e.target.value })}
                placeholder="012-494-7842 (DuitNow QR / HENG LUAN KEOW)"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Touch 'n Go eWallet 註冊電話</label>
              <input
                type="text"
                value={formData.tngEwalletPhone}
                onChange={(e) => setFormData({ ...formData, tngEwalletPhone: e.target.value })}
                placeholder="012-494-7842 (Touch n Go eWallet)"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">銀行轉賬帳號 (Maybank / Public Bank / CIMB)</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="Public Bank 大眾銀行: 3233860200 (戶名: JIN YUAN TRADITIONAL ENTERPRISE)"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* DuitNow / TNG Payment QR Code Photo */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
                <img
                  src={formData.paymentQrCodeUrl || '/assets/aistudio/PHOTO-2026-11-13-13-09-26_2_1a47a666.jpg'}
                  alt="DuitNow QR Code"
                  className="w-36 h-auto object-contain rounded-lg"
                />
                <span className="text-[11px] text-stone-500 mt-1.5 font-medium">結帳收款 QR 預覽</span>
              </div>

              <div className="sm:col-span-8 space-y-2.5">
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  DuitNow / 收款二維碼圖片 (Payment QR Code Picture)
                </label>
                <p className="text-xs text-stone-500">
                  顧客在前台結帳時會看到此 QR Code 掃碼付款，並需上傳付款截圖至後台與 WhatsApp。
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>上傳新的收款 QR 圖片</span>
                    <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        paymentQrCodeUrl: '/assets/aistudio/PHOTO-2026-11-13-13-09-26_2_1a47a666.jpg',
                      })
                    }
                    className="px-3 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    使用錦源預設 DuitNow QR
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.paymentQrCodeUrl || ''}
                  onChange={(e) => setFormData({ ...formData, paymentQrCodeUrl: e.target.value })}
                  placeholder="QR Code URL"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving || Boolean(isUploadingAsset)}
              className="px-6 py-3 text-sm font-bold text-white bg-red-900 hover:bg-red-800 disabled:opacity-60 dark:bg-red-700 dark:hover:bg-red-600 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-98"
            >
              {savedToast ? <Check className="w-5 h-5 text-emerald-400" /> : <Save className="w-5 h-5" />}
              <span>
                {isSaving
                  ? '儲存同步至雲端中...'
                  : savedToast
                  ? '店鋪設定已儲存！'
                  : '💾 儲存所有店鋪設定與照片'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExportData}
              className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-stone-900 shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>匯出最新設定與商品 (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('確定要將訂單與商品恢復為預設示範資料嗎？')) {
                  onResetData();
                }
              }}
              className="px-4 py-2.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 dark:border-red-900/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置示範資料</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
