import React, { useState, useEffect } from 'react';
import { BannerSlide, StoreSettings } from '../../types/store';
import { resolveStoreCategories } from '../../utils/productFilters';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Upload,
  Sliders,
  Bell,
  Clock,
  ArrowUp,
  ArrowDown,
  Loader2,
  Maximize2,
  Sparkles,
  Type
} from 'lucide-react';

interface BannerManagerProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => Promise<void> | void;
}

export const BannerManager: React.FC<BannerManagerProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [slides, setSlides] = useState<BannerSlide[]>(settings.bannerSlides || []);
  const [announcements, setAnnouncements] = useState<string[]>(
    settings.promoAnnouncements || [
      '🔥 新春限時特惠：購買任意傳統手工年餅滿 RM 100，即免費贈送 50g 招牌酥脆肉鬆！',
      '🚚 全馬常溫獨立真空郵寄服務：訂單累計滿 RM 300 即享免運費直送到府！',
      '🍖 清晨炭火現烤脆皮燒肉、祭神祈福【全隻金牌大燒豬 / 乳豬】新春火熱預訂中！',
      '🥩 正宗古法炭火手工慢烤肉乾：提供 100g、300g、500g、1kg 多克數挑選，先選克數再加入購物車！',
    ]
  );

  useEffect(() => {
    if (settings.bannerSlides) {
      setSlides(settings.bannerSlides);
    }
    if (settings.promoAnnouncements) {
      setAnnouncements(settings.promoAnnouncements);
    }
  }, [settings.bannerSlides, settings.promoAnnouncements]);

  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [isUploadingQuickAdd, setIsUploadingQuickAdd] = useState(false);
  const [isUploadingModalImage, setIsUploadingModalImage] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [rotateSeconds, setRotateSeconds] = useState<number>(settings.bannerAutoRotateSeconds || 5);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setRotateSeconds(settings.bannerAutoRotateSeconds || 5);
  }, [settings.bannerAutoRotateSeconds]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveSlides = async (
    updatedSlides: BannerSlide[],
    updatedAnnouncements?: string[],
    nextSeconds?: number,
    successMessage?: string
  ) => {
    const newSettings: StoreSettings = {
      ...settings,
      bannerSlides: updatedSlides,
      promoAnnouncements: updatedAnnouncements || announcements,
      bannerAutoRotateSeconds: nextSeconds ?? rotateSeconds,
    };
    try {
      await onSaveSettings(newSettings);
      setSlides(updatedSlides);
      showToast(successMessage || '橫幅輪播與促銷公告設定已永久保存並同步雲端！', 'success');
    } catch (err) {
      console.error('Failed to save banners:', err);
      showToast(
        err instanceof Error ? err.message : '儲存橫幅失敗：圖片總容量過大或雲端寫入失敗，請縮減圖片後重試。',
        'error'
      );
    }
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    handleSaveSlides(copy);
  };

  const handleChangeRotateSeconds = (val: number) => {
    setRotateSeconds(val);
  };

  const handleSaveRotateSeconds = () => {
    handleSaveSlides(slides, announcements, rotateSeconds);
  };

  const handleToggleActive = (slideId: string) => {
    const updated = slides.map((s) => (s.id === slideId ? { ...s, active: !s.active } : s));
    handleSaveSlides(updated);
  };

  const handleToggleImageOnly = (slideId: string) => {
    const target = slides.find((s) => s.id === slideId);
    const nextImageOnly = !target?.imageOnly;
    const updated = slides.map((s) =>
      s.id === slideId
        ? {
            ...s,
            imageOnly: nextImageOnly,
            hideOverlay: nextImageOnly ? true : s.hideOverlay,
          }
        : s
    );
    handleSaveSlides(
      updated,
      undefined,
      undefined,
      nextImageOnly
        ? '已切換為「純圖片原圖展示」（無標題、無黑色遮罩）！'
        : '已切換為「圖文海報模式」（可自訂標題與按鈕）！'
    );
  };

  const handleDeleteSlide = (slideId: string) => {
    if (confirmDeleteId !== slideId) {
      setConfirmDeleteId(slideId);
      setTimeout(() => {
        setConfirmDeleteId((curr) => (curr === slideId ? null : curr));
      }, 4000);
      return;
    }
    setConfirmDeleteId(null);
    const updated = slides.filter((s) => s.id !== slideId);
    handleSaveSlides(updated);
  };

  const handleSaveEditingSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || isUploadingModalImage) return;

    if (isAddingSlide) {
      const updated = [...slides, editingSlide];
      await handleSaveSlides(updated);
      setIsAddingSlide(false);
    } else {
      const updated = slides.map((s) => (s.id === editingSlide.id ? editingSlide : s));
      await handleSaveSlides(updated);
    }
    setEditingSlide(null);
  };

  const handleDirectSlideImageUpload = async (
    slideId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingSlideId(slideId);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'banners', {
        cloudName: settings.cloudinaryCloudName,
        uploadPreset: settings.cloudinaryUploadPreset,
      });
      const updated = slides.map((s) =>
        s.id === slideId ? { ...s, imageUrl: secureUrl } : s
      );
      await handleSaveSlides(
        updated,
        undefined,
        undefined,
        '橫幅背景圖片已成功上傳至 Cloudinary 並即時儲存！'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '圖片上傳至 Cloudinary 失敗，請稍後重試。',
        'error'
      );
    } finally {
      setUploadingSlideId(null);
      e.target.value = '';
    }
  };

  const handleQuickUploadNewBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploadingQuickAdd(true);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'banners', {
        cloudName: settings.cloudinaryCloudName,
        uploadPreset: settings.cloudinaryUploadPreset,
      });
      setIsAddingSlide(true);
      setEditingSlide({
        id: `banner-${Date.now()}`,
        title: '',
        subtitle: '',
        imageUrl: secureUrl,
        badge: '',
        ctaText: '',
        ctaAction: 'products',
        imageOnly: true,
        hideOverlay: true,
        active: true,
      });
      showToast('新橫幅圖片已上傳至 Cloudinary（預設純圖片原圖模式），請點擊「儲存並即刻生效」！', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '圖片上傳至 Cloudinary 失敗，請稍後重試。',
        'error'
      );
    } finally {
      setIsUploadingQuickAdd(false);
      e.target.value = '';
    }
  };

  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !editingSlide) return;

    setIsUploadingModalImage(true);
    try {
      const { uploadImageToCloudinary } = await import('../../utils/cloudinaryService');
      const secureUrl = await uploadImageToCloudinary(file, 'banners', {
        cloudName: settings.cloudinaryCloudName,
        uploadPreset: settings.cloudinaryUploadPreset,
      });
      setEditingSlide((prev) => (prev ? { ...prev, imageUrl: secureUrl } : prev));
      showToast('橫幅圖片已上傳至 Cloudinary，請點擊「儲存並即刻生效」！', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '圖片上傳至 Cloudinary 失敗，請稍後重試。',
        'error'
      );
    } finally {
      setIsUploadingModalImage(false);
      e.target.value = '';
    }
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const updated = [...announcements, newAnnouncement.trim()];
    setAnnouncements(updated);
    setNewAnnouncement('');
    handleSaveSlides(slides, updated);
  };

  const handleDeleteAnnouncement = (index: number) => {
    const updated = announcements.filter((_, idx) => idx !== index);
    setAnnouncements(updated);
    handleSaveSlides(slides, updated);
  };

  return (
    <div className="space-y-8 max-w-5xl text-sm">

      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-24 right-6 z-50 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade max-w-md ${
            toastMessage.type === 'error' ? 'bg-red-700' : 'bg-emerald-700'
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h2 className="font-serif-brand text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-red-700 shrink-0" />
            <span>首頁輪播橫幅 ＆ 滑動促銷公告管理</span>
          </h2>
          <p className="text-stone-500 mt-1">
            在此自由上傳或更換首頁輪播大橫幅（Banner）圖片、標題文案、促銷徽章與按鈕跳轉；同時可編輯頂部滑動優惠公告。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label
            className={`px-4 py-2.5 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-red-800 dark:text-amber-300 border border-red-200 dark:border-stone-700 font-bold rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              isUploadingQuickAdd ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {isUploadingQuickAdd ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isUploadingQuickAdd ? '圖片上傳中...' : '上傳圖片新增橫幅'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingQuickAdd}
              onChange={handleQuickUploadNewBanner}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setIsAddingSlide(true);
              setEditingSlide({
                id: `banner-${Date.now()}`,
                title: '',
                subtitle: '',
                imageUrl: '/src/assets/images/hero_bakkwa_traditional_1794479275105.jpg',
                badge: '',
                ctaText: '',
                ctaAction: 'products',
                imageOnly: true,
                hideOverlay: true,
                active: true,
              });
            }}
            className="px-4 py-2.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新增輪播橫幅</span>
          </button>
        </div>
      </div>

      {/* Banner Dimension & Design Specification Guide */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-red-700 shrink-0" />
            <span>橫幅 (Banner) 製作尺寸與排版規格指南（提供給設計師 / 客戶參考）</span>
          </h3>
          <span className="text-xs font-mono tabular-nums text-stone-600 dark:text-stone-400">
            支援 JPG / PNG / WebP · 系統自動壓縮最佳化至寬度 1200 px
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="font-bold text-red-800 dark:text-amber-300">
              推薦首頁大圖尺寸（桌機寬屏）
            </div>
            <div className="font-mono tabular-nums text-sm font-black text-stone-900 dark:text-stone-100">
              1600 × 600 px（8:3 比例）
            </div>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              或 <span className="font-mono tabular-nums">1200 × 450 px</span> / <span className="font-mono tabular-nums">1920 × 720 px</span>，最小寬度建議 <span className="font-mono tabular-nums">1200 px</span> 以上最清晰。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="font-bold text-stone-800 dark:text-stone-200">
              通用橫圖尺寸（桌機 + 手機兼顧）
            </div>
            <div className="font-mono tabular-nums text-sm font-black text-stone-900 dark:text-stone-100">
              1600 × 900 px（16:9 比例）
            </div>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              手機版顯示高度約 <span className="font-mono tabular-nums">230 px</span>，電腦版高約 <span className="font-mono tabular-nums">460 px</span>，會自動置中填滿裁切。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="font-bold text-stone-800 dark:text-stone-200">
              純原圖 vs 圖文模式（可自由切換）
            </div>
            <div className="font-bold text-stone-900 dark:text-stone-100">
              支援「純圖片原圖展示（無標題、無黑遮罩）」
            </div>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              若海報已自行設計好文字，請切換為「純原圖」即可完整顯示原圖亮度；若要由網站疊加標題按鈕，建議主圖放在偏右側。
            </p>
          </div>
        </div>
      </div>

      {/* 1. Hero Banner Slides List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-700" />
            <span>當前首頁輪播圖列表 ({slides.length} 張)</span>
          </h3>

          <div className="flex items-center gap-2 text-xs bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800">
            <Clock className="w-4 h-4 text-red-700 shrink-0" />
            <span className="font-bold text-stone-700 dark:text-stone-300">自動輪播速度：</span>
            <select
              value={rotateSeconds}
              onChange={(e) => handleChangeRotateSeconds(Number(e.target.value))}
              className="px-2 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono tabular-nums font-bold cursor-pointer"
            >
              <option value={3}>3 秒 / 張</option>
              <option value={5}>5 秒 / 張（推薦）</option>
              <option value={7}>7 秒 / 張</option>
              <option value={10}>10 秒 / 張</option>
            </select>
            <button
              type="button"
              onClick={handleSaveRotateSeconds}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg cursor-pointer transition whitespace-nowrap"
            >
              儲存速度
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {slides.map((slide, idx) => {
            const isUploadingThis = uploadingSlideId === slide.id;
            const hasAnyText = Boolean(
              slide.title?.trim() || slide.subtitle?.trim() || slide.badge?.trim() || slide.ctaText?.trim()
            );
            const isPureImage = Boolean(slide.imageOnly) || !hasAnyText;
            const showDarkCardOverlay = !isPureImage && !slide.hideOverlay;

            return (
              <div
                key={slide.id}
                className={`rounded-2xl border overflow-hidden bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between transition ${
                  slide.active ? 'border-stone-300 dark:border-stone-700' : 'border-stone-200 dark:border-stone-800 opacity-65'
                }`}
              >
                {/* Preview image */}
                <div className="relative aspect-[16/9] bg-stone-950 overflow-hidden">
                  {isPureImage ? (
                    <>
                      <img
                        src={slide.imageUrl}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40"
                      />
                      <img
                        src={slide.imageUrl}
                        alt={slide.title || `第 ${idx + 1} 屏橫幅`}
                        referrerPolicy="no-referrer"
                        className="relative z-10 w-full h-full object-contain object-center"
                      />
                      <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-stone-900/75 text-amber-200 text-[11px] font-mono tabular-nums backdrop-blur-xs">
                        第 {idx + 1} 屏 · 純原圖無遮罩
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                      <div
                        className={`absolute inset-0 flex flex-col justify-between p-3.5 text-white ${
                          showDarkCardOverlay ? 'bg-gradient-to-t from-black/85 via-black/25 to-transparent' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono tabular-nums text-amber-200/95 drop-shadow">
                            第 {idx + 1} 屏 · 1600×600px
                          </span>
                          {slide.badge && (
                            <span className="font-semibold text-amber-200 truncate drop-shadow">
                              {slide.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white line-clamp-1 drop-shadow">{slide.title}</h4>
                          <p className="text-xs text-stone-200 line-clamp-1 drop-shadow">{slide.subtitle}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {isUploadingThis && (
                    <div className="absolute inset-0 z-30 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                      <span className="text-xs font-bold">正在上傳圖片至 Cloudinary...</span>
                    </div>
                  )}
                </div>

                {/* Slide controls */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-950 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition whitespace-nowrap ${
                        slide.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {slide.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{slide.active ? '展示中' : '已隱藏'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleImageOnly(slide.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition whitespace-nowrap ${
                        isPureImage
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                      title={isPureImage ? '目前為純圖片原圖展示（無標題、無黑遮罩），點擊切換回圖文模式' : '點擊一鍵切換為純圖片原圖展示（去掉標題與黑色遮罩）'}
                    >
                      {isPureImage ? <Sparkles className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                      <span>{isPureImage ? '純原圖' : '圖文模式'}</span>
                    </button>

                    <label
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-800 hover:bg-red-900 text-white flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap ${
                        isUploadingThis ? 'opacity-60 pointer-events-none' : ''
                      }`}
                      title="直接從電腦或手機上傳更換這張橫幅背景圖"
                    >
                      {isUploadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingThis ? '上傳中...' : '上傳換圖'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingThis}
                        onChange={(e) => handleDirectSlideImageUpload(slide.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSlide(idx, -1)}
                      className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-red-700 disabled:opacity-35 transition cursor-pointer"
                      title="往前移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === slides.length - 1}
                      onClick={() => handleMoveSlide(idx, 1)}
                      className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-red-700 disabled:opacity-35 transition cursor-pointer"
                      title="往後移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSlide(false);
                        setEditingSlide({ ...slide });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-red-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                      title="編輯文案與連結"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>編輯</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className={`px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold whitespace-nowrap ${
                        confirmDeleteId === slide.id
                          ? 'bg-red-700 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-red-600'
                      }`}
                      title={confirmDeleteId === slide.id ? '再點一次確認刪除' : '刪除'}
                    >
                      <Trash2 className="w-4 h-4" />
                      {confirmDeleteId === slide.id && <span>確認刪除?</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Top Scrolling Promo Ticker Announcements Manager */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <span>頂部滑動優惠信息公告 (Sliding Ticker Banner)</span>
          </h3>
          <span className="text-xs text-stone-500 font-mono tabular-nums">共 {announcements.length} 則輪播</span>
        </div>

        {/* Existing Announcements */}
        <div className="space-y-2">
          {announcements.map((text, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-xs sm:text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums font-bold text-stone-400">#{idx + 1}</span>
                <span>{text}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAnnouncement(idx)}
                className="text-stone-400 hover:text-red-600 p-1 transition cursor-pointer shrink-0"
                title="刪除此條公告"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Announcement */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="新增滑動優惠信息（例：🔥 新春限定：買滿 RM 100 送 50g 肉鬆！）..."
            className="flex-1 px-4 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-800"
          />
          <button
            type="button"
            onClick={handleAddAnnouncement}
            disabled={!newAnnouncement.trim()}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>新增公告</span>
          </button>
        </div>
      </div>

      {/* Edit / Add Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl animate-fade my-8">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-red-700" />
                <span>{isAddingSlide ? '新增首頁輪播橫幅' : '編輯輪播橫幅'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditingSlide} className="space-y-4">
              {/* Image Preview & Always-Visible Upload */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    橫幅背景圖片
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-amber-700 dark:text-amber-300 font-semibold">
                    推薦尺寸：1600 × 600 px（8:3）或 1600 × 900 px（16:9）· 寬度 ≥ 1200 px
                  </span>
                </div>

                {/* Live Banner Ratio Preview (8:3 storefront preview) */}
                <div className="relative aspect-[8/3] rounded-xl overflow-hidden bg-stone-950 border border-stone-300 dark:border-stone-700 flex items-center justify-center">
                  {editingSlide.imageOnly ? (
                    <>
                      <img
                        src={editingSlide.imageUrl}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40"
                      />
                      <img
                        src={editingSlide.imageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="relative z-10 w-full h-full object-contain object-center"
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src={editingSlide.imageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                      {!editingSlide.hideOverlay && (
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/75 via-stone-950/25 to-transparent pointer-events-none flex items-end p-3">
                          <span className="text-[11px] text-amber-200/90">
                            左側為首頁文字疊加區 · 建議商品主圖放在中央至右側
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {isUploadingModalImage && (
                    <div className="absolute inset-0 z-20 bg-black/75 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-7 h-7 animate-spin text-amber-300" />
                      <span className="text-xs font-bold">正在自動壓縮並上傳至 Cloudinary...</span>
                    </div>
                  )}
                </div>

                {/* Display Mode Toggle: Pure Original Image vs Text & CTA Overlay */}
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2.5">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    顯示樣式選擇（可自由選擇要不要文字與遮罩）：
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSlide({
                          ...editingSlide,
                          imageOnly: true,
                          hideOverlay: true,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        editingSlide.imageOnly
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 ring-1 ring-amber-400 font-bold'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>純圖片原圖展示（推薦海報圖）</span>
                      </div>
                      <p className="text-[11px] font-normal text-stone-500 dark:text-stone-400 mt-0.5">
                        不用放標題，無任何黑色遮罩，完整呈現您的原圖。
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingSlide({
                          ...editingSlide,
                          imageOnly: false,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        !editingSlide.imageOnly
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-600 text-red-950 dark:text-amber-200 ring-1 ring-red-500 font-bold'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-red-700 shrink-0" />
                        <span>圖文疊加模式（可放標題 / 按鈕）</span>
                      </div>
                      <p className="text-[11px] font-normal text-stone-500 dark:text-stone-400 mt-0.5">
                        可在圖片上疊加主標題、副標題與購買按鈕。
                      </p>
                    </button>
                  </div>

                  {!editingSlide.imageOnly && (
                    <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(editingSlide.hideOverlay)}
                        onChange={(e) =>
                          setEditingSlide({ ...editingSlide, hideOverlay: e.target.checked })
                        }
                        className="accent-red-800 rounded"
                      />
                      <span className="font-medium">
                        移除圖片上的黑色漸層遮罩（完全保留原本照片亮度，只顯示文字按鈕）
                      </span>
                    </label>
                  )}
                </div>

                {/* Prominent Primary Upload Dropzone Button */}
                <label
                  className={`w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/70 bg-red-50/70 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-950/40 text-red-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    isUploadingModalImage ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {isUploadingModalImage ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Upload className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {isUploadingModalImage
                      ? '圖片上傳至 Cloudinary 中，請稍候...'
                      : '點擊從電腦 / 手機選擇橫幅圖片上傳（JPG / PNG / WebP · 自動最佳化）'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingModalImage}
                    onChange={handleModalImageUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSlide.imageUrl}
                    onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                    placeholder="或直接貼上現有圖片網址 (HTTPS URL)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {!editingSlide.imageOnly && (
                <>
                  {/* Title (ZH + EN) - Optional */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        主標題 (中文，選填可留空)
                      </label>
                      <input
                        type="text"
                        value={editingSlide.title}
                        onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                        placeholder="留空即可不顯示標題..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        主標題 (English，選填)
                      </label>
                      <input
                        type="text"
                        value={editingSlide.titleEn || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, titleEn: e.target.value })}
                        placeholder="Optional English headline..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Subtitle (ZH + EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        副標題說明 (中文，選填)
                      </label>
                      <textarea
                        rows={2}
                        value={editingSlide.subtitle}
                        onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                        placeholder="留空即可不顯示副標題..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        副標題說明 (English，選填)
                      </label>
                      <textarea
                        rows={2}
                        value={editingSlide.subtitleEn || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, subtitleEn: e.target.value })}
                        placeholder="Optional English subtitle..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Badge & CTA */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        標籤徽章 (Badge，選填)
                      </label>
                      <input
                        type="text"
                        value={editingSlide.badge || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                        placeholder="留空不顯示"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        按鈕文字 (CTA Text，選填)
                      </label>
                      <input
                        type="text"
                        value={editingSlide.ctaText || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                        placeholder="留空不顯示按鈕"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Jump Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    按鈕跳轉動作
                  </label>
                  <select
                    value={editingSlide.ctaAction || 'products'}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        ctaAction: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                  >
                    <option value="category">篩選指定品類</option>
                    <option value="story">打開 40年品牌故事</option>
                    <option value="products">滾動至全部商品清單</option>
                  </select>
                </div>

                {editingSlide.ctaAction === 'category' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      指定品類分類
                    </label>
                    <select
                      value={editingSlide.ctaTarget || 'cookies'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaTarget: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                    >
                      {resolveStoreCategories(settings).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.labelZh} ({cat.labelEn})
                        </option>
                      ))}
                      <option value="shaped">🏮 造型肉乾系列 (Shaped Bak Kwa)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer whitespace-nowrap"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isUploadingModalImage}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white transition cursor-pointer shadow flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isUploadingModalImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isUploadingModalImage ? '圖片上傳中...' : '儲存並即刻生效'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
