export type CloudinaryFolder =
  | 'products'
  | 'banners'
  | 'logos'
  | 'qr'
  | 'story'
  | 'receipts'
  | 'general';

interface CloudinaryRuntimeConfig {
  cloudName?: string;
  uploadPreset?: string;
}

// 備用預設參數（優先讀取環境變數 VITE_CLOUDINARY_*，若未設定則依序使用後台店鋪設定或此處預設值）
const FALLBACK_CLOUDINARY_CLOUD_NAME = 'wsq8hjsz';
const FALLBACK_CLOUDINARY_UPLOAD_PRESET = 'jinyuan';

let runtimeConfig: CloudinaryRuntimeConfig = {};

export function setCloudinaryRuntimeConfig(config: CloudinaryRuntimeConfig) {
  runtimeConfig = {
    cloudName: config.cloudName?.trim() || undefined,
    uploadPreset: config.uploadPreset?.trim() || undefined,
  };
}

function isValidConfiguredValue(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('[') || trimmed.includes(']') || trimmed.includes('填入')) {
    return false;
  }
  return true;
}

/**
 * 優先順序：
 * 1. 環境變數 VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET
 * 2. 後台「店鋪設定 → Cloudinary 雲端圖床設定」（儲存於 Firestore）
 * 3. 預設備用參數 FALLBACK_CLOUDINARY_*
 */
export function getCloudinaryConfig(overrides?: CloudinaryRuntimeConfig): {
  cloudName: string;
  uploadPreset: string;
  source: 'env' | 'settings' | 'fallback' | 'none';
} {
  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const envPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

  const hasEnv = isValidConfiguredValue(envCloudName) && isValidConfiguredValue(envPreset);
  const hasOverride =
    isValidConfiguredValue(overrides?.cloudName) && isValidConfiguredValue(overrides?.uploadPreset);
  const hasRuntime =
    isValidConfiguredValue(runtimeConfig.cloudName) && isValidConfiguredValue(runtimeConfig.uploadPreset);
  const hasFallback =
    isValidConfiguredValue(FALLBACK_CLOUDINARY_CLOUD_NAME) &&
    isValidConfiguredValue(FALLBACK_CLOUDINARY_UPLOAD_PRESET);

  const cloudName =
    (isValidConfiguredValue(envCloudName) && envCloudName?.trim()) ||
    (isValidConfiguredValue(overrides?.cloudName) && overrides?.cloudName?.trim()) ||
    (isValidConfiguredValue(runtimeConfig.cloudName) && runtimeConfig.cloudName?.trim()) ||
    (isValidConfiguredValue(FALLBACK_CLOUDINARY_CLOUD_NAME) && FALLBACK_CLOUDINARY_CLOUD_NAME.trim()) ||
    '';

  const uploadPreset =
    (isValidConfiguredValue(envPreset) && envPreset?.trim()) ||
    (isValidConfiguredValue(overrides?.uploadPreset) && overrides?.uploadPreset?.trim()) ||
    (isValidConfiguredValue(runtimeConfig.uploadPreset) && runtimeConfig.uploadPreset?.trim()) ||
    (isValidConfiguredValue(FALLBACK_CLOUDINARY_UPLOAD_PRESET) &&
      FALLBACK_CLOUDINARY_UPLOAD_PRESET.trim()) ||
    '';

  const source: 'env' | 'settings' | 'fallback' | 'none' =
    cloudName && uploadPreset
      ? hasEnv
        ? 'env'
        : hasOverride || hasRuntime
        ? 'settings'
        : hasFallback
        ? 'fallback'
        : 'settings'
      : 'none';

  return { cloudName, uploadPreset, source };
}

export function isCloudinaryConfigured(overrides?: CloudinaryRuntimeConfig): boolean {
  const { cloudName, uploadPreset } = getCloudinaryConfig(overrides);
  return Boolean(cloudName && uploadPreset);
}

/**
 * 前端 Canvas 自動壓縮圖片：
 * - 商品圖 / Banner / 品牌故事 / Logo：最大寬度 1200px，品質 0.8，轉為 JPEG
 * - 顧客結帳付款截圖（receipts）：最大寬度 800px，品質 0.7，轉為 JPEG
 */
export async function compressImageFileForUpload(
  file: File,
  folder: CloudinaryFolder
): Promise<File> {
  const isReceipt = folder === 'receipts';
  const maxWidth = isReceipt ? 800 : 1200;
  const quality = isReceipt ? 0.7 : 0.8;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('圖片解碼失敗，請換一張清晰的 JPG 或 PNG 圖片。'));
      el.src = objectUrl;
    });

    const srcWidth = img.naturalWidth || img.width;
    const srcHeight = img.naturalHeight || img.height;
    if (!srcWidth || !srcHeight) {
      return file;
    }

    let targetWidth = srcWidth;
    let targetHeight = srcHeight;
    if (srcWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.max(1, Math.round((srcHeight * maxWidth) / srcWidth));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    // 填白底避免透明 PNG 轉 JPEG 變黑底
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const compressedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );

    if (!compressedBlob) {
      return file;
    }

    // 若原圖已是極小 JPEG 且未超過寬度限制，選擇體積較小者
    if (
      srcWidth <= maxWidth &&
      file.type === 'image/jpeg' &&
      compressedBlob.size >= file.size
    ) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([compressedBlob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    // 僅對瀏覽器無法直接 Canvas 解碼的少數格式（如部分 HEIC）於 <= 4MB 時放行交由 Cloudinary 轉檔
    if (/\.(heic|heif)$/i.test(file.name) && file.size <= 4 * 1024 * 1024) {
      return file;
    }
    throw err instanceof Error ? err : new Error('圖片壓縮失敗，請重新選擇圖片。');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * 前端自動壓縮後直傳 Cloudinary Unsigned Upload API，僅回傳短 HTTPS secure_url。
 * 嚴禁產生或回傳 Base64 / blob: 暫存網址。
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'general',
  overrides?: CloudinaryRuntimeConfig
): Promise<string> {
  const isImageFile =
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name);

  if (!isImageFile) {
    throw new Error('請選擇有效的圖片檔案（JPG / PNG / WebP / GIF）。');
  }

  const { cloudName, uploadPreset } = getCloudinaryConfig(overrides);
  if (!cloudName || !uploadPreset) {
    throw new Error(
      '尚未設定 Cloudinary Cloud Name 與 Unsigned Upload Preset，請先在後台「店鋪設定 → Cloudinary 雲端圖床設定」填入並儲存，或在環境變數 VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET 設定。'
    );
  }

  // 上傳前一律先經瀏覽器 Canvas 自動壓縮減小體積
  const compressedFile = await compressImageFileForUpload(file, folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `jinyuan/${folder}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore non-json body
    }

    const lowerDetail = errorDetail.toLowerCase();
    if (lowerDetail.includes('whitelisted for unsigned uploads')) {
      throw new Error(
        `Cloudinary 圖床上傳設定尚未開啟免簽名：請登入 Cloudinary (Cloud Name: ${cloudName}) → 右下角 Settings (齒輪) → Upload → Upload presets → 找到並編輯「${uploadPreset}」→ 將 Signing mode 從 Signed 改為【Unsigned】並按右上角 Save，即可馬上恢復上傳！`
      );
    }
    if (lowerDetail.includes('upload preset not found')) {
      throw new Error(
        `找不到 Cloudinary Upload Preset「${uploadPreset}」（Cloud Name: ${cloudName}）。請登入 Cloudinary → Settings → Upload → Upload presets 新增名為「${uploadPreset}」且 Signing mode 設為【Unsigned】的 Preset。`
      );
    }

    throw new Error(`Cloudinary 圖片上傳失敗：${errorDetail}`);
  }

  const result = (await response.json()) as { secure_url?: string; url?: string };
  const secureUrl = result.secure_url || result.url || '';

  if (!secureUrl.startsWith('https://')) {
    throw new Error('Cloudinary 未回傳有效的 HTTPS secure_url 圖片網址。');
  }

  return secureUrl;
}
