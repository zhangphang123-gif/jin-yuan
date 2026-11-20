import React, { useState, useEffect } from 'react';
import { PromoCode, StoreSettings } from '../../types/store';
import { DEFAULT_PROMO_CODES } from '../../data/initialStoreData';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  Edit2,
  Gift,
  Truck,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  RotateCcw
} from 'lucide-react';

interface PromoCodeManagerProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(
    settings.promoCodes && settings.promoCodes.length > 0
      ? settings.promoCodes
      : DEFAULT_PROMO_CODES
  );

  useEffect(() => {
    if (settings.promoCodes && settings.promoCodes.length > 0) {
      setPromoCodes(settings.promoCodes);
    }
  }, [settings.promoCodes]);

  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const persistCodes = (nextCodes: PromoCode[], msg = '優惠碼設定已同步儲存至雲端！') => {
    setPromoCodes(nextCodes);
    onSaveSettings({
      ...settings,
      promoCodes: nextCodes,
    });
    showToast(msg);
  };

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingCode({
      id: `promo-${Date.now()}`,
      code: '',
      titleZh: '',
      titleEn: '',
      discountType: 'fixed',
      discountValue: 10,
      freeShipping: false,
      freeGiftName: '',
      freeGiftNameEn: '',
      minSpend: 0,
      active: true,
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;

    const cleanCode = editingCode.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return;

    const normalized: PromoCode = {
      ...editingCode,
      code: cleanCode,
      titleZh: editingCode.titleZh.trim() || `優惠碼 ${cleanCode}`,
      titleEn: editingCode.titleEn?.trim() || '',
      discountValue:
        editingCode.discountType === 'none' ? 0 : Math.max(0, Number(editingCode.discountValue) || 0),
      minSpend: Math.max(0, Number(editingCode.minSpend) || 0),
      freeGiftName: editingCode.freeGiftName?.trim() || '',
      freeGiftNameEn: editingCode.freeGiftNameEn?.trim() || '',
    };

    if (isAdding) {
      const next = [normalized, ...promoCodes.filter((p) => p.code !== normalized.code)];
      persistCodes(next, `已新增優惠碼 ${normalized.code}！`);
    } else {
      const next = promoCodes.map((p) => (p.id === normalized.id ? normalized : p));
      persistCodes(next, `已更新優惠碼 ${normalized.code}！`);
    }

    setIsAdding(false);
    setEditingCode(null);
  };

  const handleToggleActive = (id: string) => {
    const next = promoCodes.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    persistCodes(next, '優惠碼啟用狀態已更新！');
  };

  const handleDelete = (promo: PromoCode) => {
    if (confirm(`確定要刪除優惠碼「${promo.code}」嗎？`)) {
      const next = promoCodes.filter((p) => p.id !== promo.id);
      persistCodes(next, `已刪除優惠碼 ${promo.code}`);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('確定要恢復預設優惠碼組合（JINYUAN10、BAKKWA5、FREESHIP、FREEFLOSS）嗎？')) {
      persistCodes(DEFAULT_PROMO_CODES, '已恢復預設優惠碼組合！');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-700" />
            <span>購物車優惠碼設定 (Promo Codes Manager)</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            自訂顧客在購物車輸入的優惠碼內容：可設定<strong>扣款 (RM / %)</strong>、<strong>全馬免運費</strong>、或<strong>自動贈送指定禮品 (如肉鬆/餅乾)</strong>，並可搭配最低消費門檻。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢復預設</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>新增優惠碼</span>
          </button>
        </div>
      </div>

      {/* Saved Toast */}
      {toast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Promo Codes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promoCodes.map((promo) => (
          <div
            key={promo.id}
            className={`p-5 rounded-2xl border bg-white dark:bg-stone-900 shadow-2xs transition flex flex-col justify-between space-y-4 ${
              promo.active
                ? 'border-stone-200 dark:border-stone-800'
                : 'border-stone-200/60 dark:border-stone-800/40 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-red-900 text-amber-300 font-mono font-black text-sm tracking-wider shadow-2xs">
                      {promo.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        promo.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {promo.active ? '啟用中 Active' : '已停用 Inactive'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mt-2">
                    {promo.titleZh}
                  </h3>
                  {promo.titleEn && (
                    <p className="text-xs text-stone-500">{promo.titleEn}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(promo.id)}
                  className="text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  title="切換啟用/停用"
                >
                  {promo.active ? (
                    <ToggleRight className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-stone-400" />
                  )}
                </button>
              </div>

              {/* Perks Summary Badges */}
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {promo.discountType === 'fixed' && promo.discountValue > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <DollarSign className="w-3.5 h-3.5" />
                    現扣 RM {promo.discountValue}
                  </span>
                )}
                {promo.discountType === 'percent' && promo.discountValue > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Percent className="w-3.5 h-3.5" />
                    折扣 {promo.discountValue}% OFF
                  </span>
                )}
                {promo.freeShipping && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Truck className="w-3.5 h-3.5" />
                    免運費 Free Shipping
                  </span>
                )}
                {promo.freeGiftName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Gift className="w-3.5 h-3.5" />
                    贈送：{promo.freeGiftName}
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                  {promo.minSpend && promo.minSpend > 0 ? `滿 RM ${promo.minSpend} 可用` : '無最低消費門檻'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingCode(promo);
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>編輯內容</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(promo)}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Promo Code Modal */}
      {editingCode && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] overflow-y-auto">
            <h3 className="font-serif-brand text-lg font-black text-stone-900 dark:text-stone-100 mb-4">
              {isAdding ? '新增購物車優惠碼' : `編輯優惠碼：${editingCode.code}`}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    優惠碼代號 (自動大寫) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCode.code}
                    onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })}
                    placeholder="例：VIP20 / FREESHIP"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    最低消費門檻 (RM，0 表示不限)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCode.minSpend || 0}
                    onChange={(e) => setEditingCode({ ...editingCode, minSpend: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    中文優惠說明 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCode.titleZh}
                    onChange={(e) => setEditingCode({ ...editingCode, titleZh: e.target.value })}
                    placeholder="例：熟客專屬折 RM 15 + 送肉鬆"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    英文說明 (English Subtitle)
                  </label>
                  <input
                    type="text"
                    value={editingCode.titleEn || ''}
                    onChange={(e) => setEditingCode({ ...editingCode, titleEn: e.target.value })}
                    placeholder="e.g. RM 15 Off + Free Floss"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Discount Value Config */}
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-3">
                <span className="font-bold text-amber-950 dark:text-amber-200 block">
                  1. 折扣金額設定 (Discount / Deduction)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 mb-1">扣款類型</label>
                    <select
                      value={editingCode.discountType}
                      onChange={(e) =>
                        setEditingCode({
                          ...editingCode,
                          discountType: e.target.value as PromoCode['discountType'],
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-bold"
                    >
                      <option value="none">不扣款（僅免運或送贈品）</option>
                      <option value="fixed">固定扣款金額 (減 RM)</option>
                      <option value="percent">百分比折扣 (減 %)</option>
                    </select>
                  </div>

                  {editingCode.discountType !== 'none' && (
                    <div>
                      <label className="block text-stone-600 dark:text-stone-400 mb-1">
                        {editingCode.discountType === 'fixed' ? '扣款金額 (RM)' : '折扣百分比 (%)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={editingCode.discountType === 'percent' ? 99 : 9999}
                        value={editingCode.discountValue}
                        onChange={(e) =>
                          setEditingCode({ ...editingCode, discountValue: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Free Shipping & Free Gift */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                  2. 免運費與贈品設定 (Free Shipping & Free Gift)
                </span>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={editingCode.freeShipping}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, freeShipping: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-700 cursor-pointer"
                  />
                  <span>🚚 套用此優惠碼後「全馬免運費 (Free Shipping)」</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 mb-1">
                      🎁 隨單自動贈送物品（留空代表不送物品）
                    </label>
                    <input
                      type="text"
                      value={editingCode.freeGiftName || ''}
                      onChange={(e) =>
                        setEditingCode({ ...editingCode, freeGiftName: e.target.value })
                      }
                      placeholder="例：50g 招牌酥脆肉鬆 / 1罐手工花生酥"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 mb-1">
                      🎁 贈品英文名稱 (Optional EN)
                    </label>
                    <input
                      type="text"
                      value={editingCode.freeGiftNameEn || ''}
                      onChange={(e) =>
                        setEditingCode({ ...editingCode, freeGiftNameEn: e.target.value })
                      }
                      placeholder="e.g. 50g Crispy Pork Floss"
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCode(null);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  儲存優惠碼設定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
