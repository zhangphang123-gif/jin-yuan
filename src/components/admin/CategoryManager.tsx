import React, { useMemo, useState } from 'react';
import { CategoryDefinition, StoreProduct, StoreSettings } from '../../types/store';
import { resolveStoreCategories } from '../../utils/productFilters';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Package
} from 'lucide-react';

interface CategoryManagerProps {
  products: StoreProduct[];
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => Promise<void> | void;
  onUpdateProduct?: (product: StoreProduct) => Promise<void> | void;
}

const PRESET_EMOJIS = ['🥩', '🐷', '🐔', '🦆', '🥓', '🍖', '🍪', '🎋', '🏮', '🎁', '🌶️', '🥟', '🥮', '✨'];

function buildSlugFromInput(rawId: string, labelEn: string): string {
  const base = (rawId.trim() || labelEn.trim())
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (base.length >= 2) return base;
  return `cat_${Date.now().toString(36).slice(-5)}`;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  products,
  settings,
  onSaveSettings,
  onUpdateProduct,
}) => {
  const categories = useMemo(() => resolveStoreCategories(settings), [settings]);

  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => {
      setNotice((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // New Category form state
  const [newEmoji, setNewEmoji] = useState('🎁');
  const [newLabelZh, setNewLabelZh] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newIdInput, setNewIdInput] = useState('');
  const [newDescZh, setNewDescZh] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editing existing category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryDefinition | null>(null);

  // Delete confirmation modal state (no window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<CategoryDefinition | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const persistCategories = async (nextCategories: CategoryDefinition[], successMessage: string) => {
    setIsSaving(true);
    try {
      const normalized = nextCategories.map((cat, index) => ({
        ...cat,
        sortOrder: index + 1,
      }));
      await onSaveSettings({
        ...settings,
        categories: normalized,
      });
      showNotice(successMessage, 'success');
      return true;
    } catch (err) {
      console.error('Save categories failed:', err);
      showNotice(
        err instanceof Error ? `儲存分類失敗：${err.message}` : '儲存分類失敗，請檢查網路後重試。',
        'error'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const labelZh = newLabelZh.trim();
    if (!labelZh) {
      showNotice('請輸入分類中文名稱。', 'error');
      return;
    }

    const slug = buildSlugFromInput(newIdInput, newLabelEn);
    if (slug === 'all' || slug === 'shaped') {
      showNotice(`「${slug}」為系統保留篩選代號，請更換其他分類代號。`, 'error');
      return;
    }
    if (categories.some((c) => c.id === slug)) {
      showNotice(`分類代號「${slug}」已存在，請更改分類代號或英文名稱。`, 'error');
      return;
    }

    const newCat: CategoryDefinition = {
      id: slug,
      labelZh,
      labelEn: newLabelEn.trim() || labelZh,
      emoji: newEmoji.trim() || '🏷️',
      descriptionZh: newDescZh.trim() || undefined,
      sortOrder: categories.length + 1,
    };

    const ok = await persistCategories(
      [...categories, newCat],
      `已新增商品分類「${newCat.emoji} ${newCat.labelZh}」並同步至雲端與前台目錄！`
    );
    if (ok) {
      setNewLabelZh('');
      setNewLabelEn('');
      setNewIdInput('');
      setNewDescZh('');
      setNewEmoji('🎁');
    }
  };

  const handleStartEdit = (cat: CategoryDefinition) => {
    setEditingCatId(cat.id);
    setEditDraft({ ...cat });
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;
    const trimmedZh = editDraft.labelZh.trim();
    if (!trimmedZh) {
      showNotice('分類中文名稱不能留空。', 'error');
      return;
    }

    const original = categories.find((c) => c.id === editDraft.id);
    const updatedCat: CategoryDefinition = {
      ...editDraft,
      labelZh: trimmedZh,
      labelEn: editDraft.labelEn.trim() || trimmedZh,
      emoji: editDraft.emoji.trim() || '🏷️',
      descriptionZh: editDraft.descriptionZh?.trim() || undefined,
    };

    const nextList = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
    const ok = await persistCategories(
      nextList,
      `已更新分類「${updatedCat.emoji} ${updatedCat.labelZh}」並同步至前台與商品選單！`
    );

    if (ok) {
      // Sync categoryLabelZh on products whose label previously matched the old category label
      if (onUpdateProduct && original && original.labelZh !== updatedCat.labelZh) {
        const affected = products.filter(
          (p) => p.category === updatedCat.id && p.categoryLabelZh === original.labelZh
        );
        for (const prod of affected) {
          try {
            await onUpdateProduct({
              ...prod,
              categoryLabelZh: updatedCat.labelZh,
            });
          } catch (err) {
            console.warn('Could not update product category label:', prod.id, err);
          }
        }
      }
      setEditingCatId(null);
      setEditDraft(null);
    }
  };

  const handleMoveCategory = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    await persistCategories(reordered, `已調整分類「${moved.labelZh}」顯示順序並同步雲端。`);
  };

  const handleRequestDelete = (cat: CategoryDefinition) => {
    if (categories.length <= 1) {
      showNotice('商店至少需保留 1 個商品分類，無法全部刪除。', 'error');
      return;
    }
    const fallbackTarget = categories.find((c) => c.id !== cat.id)?.id || '';
    setReassignTargetId(fallbackTarget);
    setDeleteTarget(cat);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const remaining = categories.filter((c) => c.id !== deleteTarget.id);
    if (remaining.length === 0) return;

    const targetCategory = remaining.find((c) => c.id === reassignTargetId) || remaining[0];
    const affectedProducts = products.filter((p) => p.category === deleteTarget.id);

    setIsSaving(true);
    try {
      if (onUpdateProduct && affectedProducts.length > 0) {
        for (const prod of affectedProducts) {
          await onUpdateProduct({
            ...prod,
            category: targetCategory.id,
            categoryLabelZh: targetCategory.labelZh,
          });
        }
      }

      const normalized = remaining.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
      await onSaveSettings({
        ...settings,
        categories: normalized,
      });

      showNotice(
        affectedProducts.length > 0
          ? `已刪除「${deleteTarget.labelZh}」，並將 ${affectedProducts.length} 項商品移動至「${targetCategory.labelZh}」。`
          : `已刪除商品分類「${deleteTarget.labelZh}」並同步雲端。`
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete category failed:', err);
      showNotice(
        err instanceof Error ? `刪除分類失敗：${err.message}` : '刪除分類失敗，請重試。',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const affectedCount = deleteTarget ? productCountByCategory[deleteTarget.id] || 0 : 0;

  return (
    <div className="space-y-6 text-sm">
      {/* Status Toast */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-red-800 dark:text-amber-400" />
            <span>商品分類目錄管理 (Category Management)</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            自訂、編輯、排序或刪除商店商品分類；儲存後將自動同步至後台商品選單與前台目錄篩選列。
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-stone-100 dark:bg-stone-800 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
          <span className="text-stone-500">目前分類總數：</span>
          <strong className="text-red-800 dark:text-amber-400 text-sm">{categories.length}</strong>
        </div>
      </div>

      {/* Create New Category Card */}
      <form
        onSubmit={handleAddCategory}
        className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 font-bold text-base text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          <Plus className="w-4 h-4 text-red-700" />
          <span>新增商品分類</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              圖示 Emoji *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={4}
                className="w-16 text-center py-2 text-base bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_EMOJIS.slice(0, 8).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewEmoji(em)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border cursor-pointer transition ${
                      newEmoji === em
                        ? 'bg-red-900 border-red-900 text-white'
                        : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-red-700'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              中文分類名稱 *
            </label>
            <input
              type="text"
              required
              value={newLabelZh}
              onChange={(e) => setNewLabelZh(e.target.value)}
              placeholder="例：新春禮盒系列"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              英文分類名稱 (English)
            </label>
            <input
              type="text"
              value={newLabelEn}
              onChange={(e) => setNewLabelEn(e.target.value)}
              placeholder="例：Festive Gift Boxes"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              系統代號 ID (選填，僅限英數)
            </label>
            <input
              type="text"
              value={newIdInput}
              onChange={(e) => setNewIdInput(e.target.value)}
              placeholder="自動產生，例：gift_box"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 text-xs">
          <div className="flex-1">
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              分類特色說明（選填）
            </label>
            <input
              type="text"
              value={newDescZh}
              onChange={(e) => setNewDescZh(e.target.value)}
              placeholder="簡述此分類包含的特色商品，例如：精裝雙拼送禮禮盒..."
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-60 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>新增分類並同步雲端</span>
          </button>
        </div>
      </form>

      {/* Existing Categories Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="font-bold text-stone-800 dark:text-stone-200 text-xs sm:text-sm">
            現有商品分類清單（前台將依此順序展示）
          </span>
          <span className="text-[11px] text-stone-500">
            提示：造型肉乾（全部 8 款）會自動出現在前台目錄供顧客切換挑選形狀
          </span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {categories.map((cat, idx) => {
            const count = productCountByCategory[cat.id] || 0;
            const isEditing = editingCatId === cat.id && editDraft !== null;

            return (
              <div
                key={cat.id}
                className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition"
              >
                {isEditing && editDraft ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editDraft.emoji}
                        onChange={(e) => setEditDraft({ ...editDraft, emoji: e.target.value })}
                        maxLength={4}
                        className="w-14 text-center py-1.5 text-base bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_EMOJIS.slice(0, 6).map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setEditDraft({ ...editDraft, emoji: em })}
                            className="w-6 h-6 rounded border border-stone-200 dark:border-stone-700 text-xs hover:border-red-700 cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={editDraft.labelZh}
                      onChange={(e) => setEditDraft({ ...editDraft, labelZh: e.target.value })}
                      placeholder="中文名稱"
                      className="px-3 py-1.5 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-bold text-stone-900 dark:text-stone-100"
                    />

                    <input
                      type="text"
                      value={editDraft.labelEn}
                      onChange={(e) => setEditDraft({ ...editDraft, labelEn: e.target.value })}
                      placeholder="English Name"
                      className="px-3 py-1.5 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                    />

                    <input
                      type="text"
                      value={editDraft.descriptionZh || ''}
                      onChange={(e) => setEditDraft({ ...editDraft, descriptionZh: e.target.value })}
                      placeholder="分類簡介（選填）"
                      className="px-3 py-1.5 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                    />
                  </div>
                ) : (
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl shrink-0">
                      {cat.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                          {cat.labelZh}
                        </span>
                        <span className="text-xs text-stone-500">({cat.labelEn})</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                          ID: {cat.id}
                        </span>
                      </div>
                      {cat.descriptionZh && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                          {cat.descriptionZh}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono">
                    <Package className="w-3.5 h-3.5" />
                    <span>{count} 款商品</span>
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>儲存</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(null);
                          setEditDraft(null);
                        }}
                        className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, -1)}
                        disabled={idx === 0 || isSaving}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 cursor-pointer"
                        title="向上移動排序"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, 1)}
                        disabled={idx === categories.length - 1 || isSaving}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 cursor-pointer"
                        title="向下移動排序"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-red-700 dark:text-amber-400" />
                        <span>編輯</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(cat)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
                        title="刪除此分類"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Category Confirmation Modal (In-app, avoids blocked iframe confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100">
                  確認刪除商品分類？
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  即將刪除分類「<strong>{deleteTarget.emoji} {deleteTarget.labelZh}</strong>」。
                </p>
              </div>
            </div>

            {affectedCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  此分類目前包含 {affectedCount} 項上架商品，刪除前請選擇將這些商品歸類至哪一個分類：
                </p>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-950 border border-amber-300 dark:border-amber-700 rounded-lg font-bold text-stone-900 dark:text-stone-100"
                >
                  {categories
                    .filter((c) => c.id !== deleteTarget.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.labelZh}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>確認刪除並同步雲端</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
