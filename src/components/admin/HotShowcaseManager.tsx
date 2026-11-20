import React, { useState } from 'react';
import { StoreProduct, StoreSettings } from '../../types/store';
import {
  DEFAULT_HOT_PRODUCT_IDS,
  getShowcaseTypeTag,
  inferProductMeatTag,
  isShapedBakKwa
} from '../../utils/productFilters';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  Plus,
  Trash2,
  Flame,
  RotateCcw,
  Search,
  Save,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface HotShowcaseManagerProps {
  products: StoreProduct[];
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export const HotShowcaseManager: React.FC<HotShowcaseManagerProps> = ({
  products,
  settings,
  onSaveSettings,
}) => {
  const [titleZh, setTitleZh] = useState(
    settings.hotSectionTitleZh || '熱門主打招牌 · 炭烤肉乾・豬肉絲・雞肉絲・各式造型肉乾'
  );
  const [titleEn, setTitleEn] = useState(
    settings.hotSectionTitleEn || 'Signature Favorites · Bak Kwa · Pork & Chicken Floss · Festive Shapes'
  );
  const [rotateSeconds, setRotateSeconds] = useState<number>(
    settings.hotAutoRotateSeconds && settings.hotAutoRotateSeconds !== 3.5
      ? settings.hotAutoRotateSeconds
      : 1.8
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'bakkwa' | 'shaped' | 'chicken' | 'pork' | 'roast' | 'other'>('all');
  const [savedNotice, setSavedNotice] = useState(false);

  const byId = new Map(products.map((p) => [p.id, p]));
  const currentHotIds: string[] = Array.isArray(settings.featuredProductIds)
    ? settings.featuredProductIds.filter((id) => byId.has(id))
    : DEFAULT_HOT_PRODUCT_IDS.filter((id) => byId.has(id));

  const activeHotProducts = currentHotIds
    .map((id) => byId.get(id))
    .filter((p): p is StoreProduct => Boolean(p));

  const triggerSavedToast = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const persistIds = (nextIds: string[]) => {
    onSaveSettings({
      ...settings,
      featuredProductIds: nextIds,
    });
    triggerSavedToast();
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...currentHotIds];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    persistIds(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index >= currentHotIds.length - 1) return;
    const copy = [...currentHotIds];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    persistIds(copy);
  };

  const handleMoveToTop = (index: number) => {
    if (index <= 0) return;
    const copy = [...currentHotIds];
    const [picked] = copy.splice(index, 1);
    persistIds([picked, ...copy]);
  };

  const handleRemoveFromHot = (productId: string) => {
    persistIds(currentHotIds.filter((id) => id !== productId));
  };

  const handleAddToHot = (productId: string) => {
    if (currentHotIds.includes(productId)) return;
    persistIds([...currentHotIds, productId]);
  };

  const handleRestoreDefaults = () => {
    const validDefaults = DEFAULT_HOT_PRODUCT_IDS.filter((id) => byId.has(id));
    onSaveSettings({
      ...settings,
      featuredProductIds: validDefaults,
      hotSectionTitleZh: '熱門主打招牌 · 炭烤肉乾・豬肉絲・雞肉絲・各式造型肉乾',
      hotSectionTitleEn: 'Signature Favorites · Bak Kwa · Pork & Chicken Floss · Festive Shapes',
      hotAutoRotateSeconds: 1.8,
    });
    setTitleZh('熱門主打招牌 · 炭烤肉乾・豬肉絲・雞肉絲・各式造型肉乾');
    setTitleEn('Signature Favorites · Bak Kwa · Pork & Chicken Floss · Festive Shapes');
    setRotateSeconds(1.8);
    triggerSavedToast();
  };

  const handleSaveHeaderAndSpeed = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      hotSectionTitleZh: titleZh.trim() || '熱門主打招牌 · 炭烤肉乾・豬肉絲・雞肉絲・各式造型肉乾',
      hotSectionTitleEn: titleEn.trim() || 'Signature Favorites · Bak Kwa · Pork & Chicken Floss · Festive Shapes',
      hotAutoRotateSeconds: Number(rotateSeconds) || 1.8,
    });
    triggerSavedToast();
  };

  // Available items not yet in active lineup
  const availableProducts = products.filter((p) => {
    if (currentHotIds.includes(p.id)) return false;

    if (pickerFilter === 'bakkwa' && p.category !== 'bakkwa') return false;
    if (pickerFilter === 'shaped' && !isShapedBakKwa(p)) return false;
    if (pickerFilter === 'chicken' && inferProductMeatTag(p) !== 'chicken') return false;
    if (pickerFilter === 'pork' && inferProductMeatTag(p) !== 'pork') return false;
    if (pickerFilter === 'roast' && p.category !== 'roast') return false;
    if (pickerFilter === 'other' && (p.category === 'bakkwa' || p.category === 'roast')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.nameZh.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-brand text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-700" />
            <span>前台「熱門自動輪播區」擺放與排序設定</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            設定首頁大橫幅下方自動旋轉展示的商品清單與先後次序（例如先放原味、雞肉，再輪播元寶/兔子/愛心等造型肉乾）
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>已即時同步至雲端前台</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-2 text-xs font-bold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>一鍵恢復預設熱門組合</span>
          </button>
        </div>
      </div>

      {/* Showcase Title & Rotation Speed Settings */}
      <form
        onSubmit={handleSaveHeaderAndSpeed}
        className="p-4 sm:p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              熱門區中文標題
            </label>
            <input
              type="text"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              熱門區英文標題 (EN Version)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-red-700" />
              <span>自動旋轉切換秒數</span>
            </label>
            <div className="flex gap-2">
              <select
                value={rotateSeconds}
                onChange={(e) => setRotateSeconds(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-stone-900 dark:text-stone-100"
              >
                <option value={1.2}>1.2 秒（極速自動輪播）</option>
                <option value={1.8}>1.8 秒（推薦快速節奏）</option>
                <option value={2.5}>2.5 秒（輕快瀏覽）</option>
                <option value={4}>4.0 秒（慢速細看）</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>儲存標題/秒數</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Active Ordered Showcase Lineup */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <h3 className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100">
              目前正在前台旋轉展示的順序（共 {activeHotProducts.length} 項）
            </h3>
            <p className="text-xs text-stone-500">
              編號 #1 會最先出現，按下上移/下移後會立刻儲存並更新前台排序
            </p>
          </div>
        </div>

        {activeHotProducts.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs">
            目前尚未加入任何熱門商品，請從下方商品庫點選「+ 加入熱門展示」。
          </div>
        ) : (
          <div className="space-y-2">
            {activeHotProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-red-900 text-amber-200 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <img
                    src={prod.image}
                    alt={prod.nameZh}
                    className="w-14 h-11 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {prod.nameZh}
                    </div>
                    <div className="text-xs text-stone-500 font-mono flex items-center gap-2">
                      <span>{getShowcaseTypeTag(prod, 'zh')}</span>
                      <span>·</span>
                      <span>{prod.sku}</span>
                      <span>·</span>
                      <span className="text-red-800 dark:text-amber-400 font-bold">RM {prod.price} 起</span>
                    </div>
                  </div>
                </div>

                {/* Reorder Controls */}
                <div className="flex items-center justify-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveToTop(idx)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-red-700 disabled:opacity-35 cursor-pointer flex items-center gap-1"
                    title="放到第一位"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">置頂</span>
                  </button>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-red-700 disabled:opacity-35 cursor-pointer"
                    title="往前移一位"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === activeHotProducts.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-red-700 disabled:opacity-35 cursor-pointer"
                    title="往後移一位"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFromHot(prod.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-900 cursor-pointer flex items-center gap-1"
                    title="從熱門展示區移除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>移除</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add More Products Picker */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100">
              挑選其他商品加入熱門展示區
            </h3>
            <p className="text-xs text-stone-500">
              可挑選黑胡椒肉乾、麻辣肉乾、生肖造型肉乾、脆皮燒肉、餅乾或臘腸加入輪播
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋品名或貨號..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
            />
          </div>
        </div>

        {/* Picker Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(
            [
              { id: 'all', label: '全部未入選' },
              { id: 'bakkwa', label: '炭烤肉乾' },
              { id: 'shaped', label: '造型肉乾' },
              { id: 'chicken', label: '雞肉類' },
              { id: 'pork', label: '豬肉類' },
              { id: 'roast', label: '燒豬燒臘' },
              { id: 'other', label: '年餅/肉鬆/臘腸' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPickerFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                pickerFilter === f.id
                  ? 'bg-red-900 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Remaining Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableProducts.map((prod) => (
            <div
              key={prod.id}
              className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={prod.image}
                  alt={prod.nameZh}
                  className="w-12 h-10 rounded-lg object-cover shrink-0 border border-stone-200"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                    {prod.nameZh}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {getShowcaseTypeTag(prod, 'zh')} · RM {prod.price}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddToHot(prod.id)}
                className="px-2.5 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>加入</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
