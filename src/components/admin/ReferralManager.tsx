import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { StoreOrder, StoreReferral, StoreSettings } from '../../types/store';
import { ORGANIC_TRAFFIC_LABEL } from '../../utils/referralTracker';
import {
  QrCode,
  UserPlus,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Power,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

interface ReferralManagerProps {
  referrals: StoreReferral[];
  orders: StoreOrder[];
  settings: StoreSettings;
  hasLoadedReferrals: boolean;
  isLoadingReferrals: boolean;
  onLoadReferrals: (force?: boolean) => Promise<void>;
  onSaveReferral: (referral: StoreReferral) => Promise<void>;
  onDeleteReferral: (referralId: string) => Promise<void>;
}

function toLocalYmd(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function renderBrandedQrPngDataUrl(
  url: string,
  agentName: string,
  agentCode: string,
  storeName: string
): Promise<string> {
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    width: 480,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1c1917',
      light: '#ffffff',
    },
  });

  const width = 580;
  const height = 700;
  const card = document.createElement('canvas');
  card.width = width;
  card.height = height;
  const ctx = card.getContext('2d');
  if (!ctx) {
    return qrCanvas.toDataURL('image/png');
  }

  // Crisp white card background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer warm gold border
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // Header brand strip
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(14, 14, width - 28, 76);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 26px "Noto Serif TC", "PingFang TC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(storeName || '錦源傳統肉乾肉絲專賣店', width / 2, 54);

  ctx.fillStyle = '#fde68a';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('掃碼選購炭烤肉乾、肉鬆與傳統年餅', width / 2, 78);

  // Draw QR Code centered
  const qrSize = 440;
  const qrX = (width - qrSize) / 2;
  const qrY = 114;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Agent label pill below QR
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(40, 574, width - 80, 92);
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 574, width - 80, 92);

  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 24px "PingFang TC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`推廣員：${agentName} (${agentCode})`, width / 2, 616);

  ctx.fillStyle = '#78716c';
  ctx.font = '15px monospace';
  ctx.fillText(url, width / 2, 648);

  return card.toDataURL('image/png');
}

export const ReferralManager: React.FC<ReferralManagerProps> = ({
  referrals,
  orders,
  settings,
  hasLoadedReferrals,
  isLoadingReferrals,
  onLoadReferrals,
  onSaveReferral,
  onDeleteReferral,
}) => {
  // Load referrals ONCE when this tab is opened
  useEffect(() => {
    if (!hasLoadedReferrals && !isLoadingReferrals) {
      onLoadReferrals(false);
    }
  }, [hasLoadedReferrals, isLoadingReferrals, onLoadReferrals]);

  // Add / Edit form state
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [commissionInput, setCommissionInput] = useState('10');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // QR data URL cache keyed by `${id}:${url}:${name}`
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Date range filter for commission performance report
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'last_month' | 'last_30' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jinyuan.ai.studio';

  const applyDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'last_30') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toLocalYmd(first));
      setEndDate(toLocalYmd(now));
      return;
    }
    if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toLocalYmd(first));
      setEndDate(toLocalYmd(last));
      return;
    }
    if (preset === 'last_30') {
      const ago = new Date(now);
      ago.setDate(now.getDate() - 29);
      setStartDate(toLocalYmd(ago));
      setEndDate(toLocalYmd(now));
    }
  };

  // Generate QR code PNGs for every referral in view
  useEffect(() => {
    let cancelled = false;
    const generateAll = async () => {
      const nextMap: Record<string, string> = {};
      for (const ref of referrals) {
        const shareUrl = `${origin}/?ref=${encodeURIComponent(ref.code)}`;
        try {
          const dataUrl = await renderBrandedQrPngDataUrl(
            shareUrl,
            ref.name,
            ref.code,
            settings.storeName
          );
          if (!cancelled) {
            nextMap[ref.id] = dataUrl;
          }
        } catch (err) {
          console.warn(`QR generation failed for ${ref.code}:`, err);
        }
      }
      if (!cancelled) {
        setQrImages(nextMap);
      }
    };
    if (referrals.length > 0) {
      generateAll();
    } else {
      setQrImages({});
    }
    return () => {
      cancelled = true;
    };
  }, [referrals, origin, settings.storeName]);

  // Compute commission & sales report from already-loaded orders (0 extra Firestore reads)
  const reportData = useMemo(() => {
    const validOrders = orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      const orderDay = toLocalYmd(o.createdAt);
      if (startDate && orderDay < startDate) return false;
      if (endDate && orderDay > endDate) return false;
      return true;
    });

    const statsByCode: Record<
      string,
      { count: number; totalSales: number; latestOrderAt?: string }
    > = {};
    let organicCount = 0;
    let organicTotal = 0;

    for (const order of validOrders) {
      const code = (order.referralCode || '').trim().toLowerCase();
      if (!code) {
        organicCount += 1;
        organicTotal += order.total || 0;
        continue;
      }
      if (!statsByCode[code]) {
        statsByCode[code] = { count: 0, totalSales: 0 };
      }
      statsByCode[code].count += 1;
      statsByCode[code].totalSales += order.total || 0;
      if (!statsByCode[code].latestOrderAt || order.createdAt > statsByCode[code].latestOrderAt!) {
        statsByCode[code].latestOrderAt = order.createdAt;
      }
    }

    const rows = referrals.map((ref) => {
      const s = statsByCode[ref.code.toLowerCase()] || { count: 0, totalSales: 0 };
      const rate = typeof ref.commissionRate === 'number' ? ref.commissionRate : 0;
      const estimatedCommission = Math.round(s.totalSales * (rate / 100) * 100) / 100;
      return {
        referral: ref,
        orderCount: s.count,
        totalSales: s.totalSales,
        commissionRate: rate,
        estimatedCommission,
      };
    });

    const totalAgentOrders = rows.reduce((sum, r) => sum + r.orderCount, 0);
    const totalAgentSales = rows.reduce((sum, r) => sum + r.totalSales, 0);
    const totalCommissionPayable =
      Math.round(rows.reduce((sum, r) => sum + r.estimatedCommission, 0) * 100) / 100;

    return {
      rows,
      validOrdersCount: validOrders.length,
      totalAgentOrders,
      totalAgentSales,
      totalCommissionPayable,
      organicCount,
      organicTotal,
    };
  }, [orders, referrals, startDate, endDate]);

  const resetForm = () => {
    setEditingCode(null);
    setNameInput('');
    setCodeInput('');
    setCommissionInput('10');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanName = nameInput.trim();
    const cleanCode = codeInput.trim();

    if (!cleanName) {
      setFeedback({ type: 'error', text: '請輸入推廣員姓名或備註。' });
      return;
    }
    if (!/^[a-zA-Z0-9]{2,32}$/.test(cleanCode)) {
      setFeedback({
        type: 'error',
        text: '專屬推廣代號僅限 2–32 位英文字母或數字（例如 agentA、chen01），不可包含空格或符號。',
      });
      return;
    }

    const existing = referrals.find(
      (r) => r.code.toLowerCase() === cleanCode.toLowerCase()
    );
    if (existing && editingCode?.toLowerCase() !== cleanCode.toLowerCase()) {
      setFeedback({
        type: 'error',
        text: `推廣代號「${cleanCode}」已被「${existing.name}」使用，請換一個代號。`,
      });
      return;
    }

    const parsedRate = commissionInput.trim() === '' ? undefined : Number(commissionInput);
    if (parsedRate !== undefined && (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100)) {
      setFeedback({ type: 'error', text: '佣金比例需介於 0% 至 100% 之間。' });
      return;
    }

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const targetRef: StoreReferral = {
        id: cleanCode.toLowerCase(),
        code: cleanCode,
        name: cleanName,
        commissionRate: parsedRate,
        active: existing ? existing.active : true,
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      await onSaveReferral(targetRef);
      setFeedback({
        type: 'success',
        text: editingCode
          ? `已更新推廣員「${cleanName} (${cleanCode})」並同步至雲端資料庫！`
          : `已新增推廣員「${cleanName} (${cleanCode})」並自動產生推廣網址與 QR Code！`,
      });
      resetForm();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : '儲存推廣員失敗，請稍後重試。',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2200);
    } catch {
      // Clipboard blocked
    }
  };

  const handleDownloadQrPng = (referral: StoreReferral) => {
    const dataUrl = qrImages[referral.id];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `JinYuan_QR_${referral.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleActive = async (ref: StoreReferral) => {
    setTogglingId(ref.id);
    setFeedback(null);
    try {
      await onSaveReferral({
        ...ref,
        active: !ref.active,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : '切換啟用狀態失敗。',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async (ref: StoreReferral) => {
    setFeedback(null);
    try {
      await onDeleteReferral(ref.id);
      setConfirmDeleteId(null);
      setFeedback({
        type: 'success',
        text: `已刪除推廣員「${ref.name} (${ref.code})」。歷史訂單上的推薦記錄仍會完整保留。`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : '刪除推廣員失敗。',
      });
    }
  };

  const handleExportCommissionCsv = () => {
    const todayStr = toLocalYmd(new Date());
    const periodLabel =
      startDate || endDate ? `${startDate || '起'}~${endDate || '今'}` : '全部期間';
    const headers = [
      '統計期間',
      '推廣員姓名 / 備註',
      '專屬推廣代號',
      '狀態',
      '佣金比例 (%)',
      '累計成交訂單數',
      '累計銷售總金額 (RM)',
      '預估應付佣金 (RM)',
      '專屬推廣網址',
    ];

    const escapeCell = (val: string | number) => {
      const s = String(val ?? '');
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };

    const rows: (string | number)[][] = reportData.rows.map((r) => [
      periodLabel,
      r.referral.name,
      r.referral.code,
      r.referral.active ? '啟用中' : '已停用',
      r.commissionRate,
      r.orderCount,
      r.totalSales,
      r.estimatedCommission.toFixed(2),
      `${origin}/?ref=${r.referral.code}`,
    ]);

    rows.push([
      periodLabel,
      ORGANIC_TRAFFIC_LABEL,
      '-',
      '-',
      0,
      reportData.organicCount,
      reportData.organicTotal,
      '0.00',
      origin,
    ]);

    const csv = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows.map((row) => row.map(escapeCell).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `錦源代理佣金統計報表_${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-brand text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-red-700" />
            <span>推廣員 / 代理管理 ＆ 佣金業績統計</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            為合作銷售員或代理生成專屬「推薦網址」與可下載印刷「QR Code」，顧客掃碼下單自動追蹤歸因，零額外資料庫讀取消耗。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onLoadReferrals(true)}
            disabled={isLoadingReferrals}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl text-stone-800 dark:text-stone-200 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReferrals ? 'animate-spin' : ''}`} />
            <span>{isLoadingReferrals ? '讀取中...' : '重新讀取代理列表'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCommissionCsv}
            disabled={referrals.length === 0 && reportData.validOrdersCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>導出佣金報表 CSV</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Commission Performance Report & Date Range Filter */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>代理佣金業績統計報表（已排除已取消訂單）</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              直接根據已載入的 {orders.length} 筆訂單離線計算統計，切換日期完全不消耗 Firestore 讀取額度
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-red-700 shrink-0" />
            {(
              [
                { id: 'all', label: '全部日期' },
                { id: 'this_month', label: '本月' },
                { id: 'last_month', label: '上個月' },
                { id: 'last_30', label: '近30天' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => applyDatePreset(btn.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  datePreset === btn.id
                    ? 'bg-red-900 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {btn.label}
              </button>
            ))}

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                aria-label="開始日期"
                className="px-2 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
              />
              <span className="text-stone-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                aria-label="結束日期"
                className="px-2 py-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Report KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="text-[11px] text-stone-500 flex items-center justify-between">
              <span>代理帶來成交訂單</span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100">
              {reportData.totalAgentOrders} 單
            </div>
            <div className="text-[11px] text-stone-400">
              直客 / 自然流量：{reportData.organicCount} 單
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="text-[11px] text-stone-500 flex items-center justify-between">
              <span>代理累計銷售總額</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-400">
              RM {reportData.totalAgentSales.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-400">
              直客銷售額：RM {reportData.organicTotal.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-1">
            <div className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold flex items-center justify-between">
              <span>預估應付總佣金</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="text-xl font-mono font-black text-amber-900 dark:text-amber-300">
              RM {reportData.totalCommissionPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
              依各代理佣金比例自動結算
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="text-[11px] text-stone-500 flex items-center justify-between">
              <span>已建檔推廣員人數</span>
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100">
              {referrals.length} 位
            </div>
            <div className="text-[11px] text-stone-400">
              啟用中：{referrals.filter((r) => r.active).length} 位
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-semibold">
                <th className="py-2.5 px-3.5">推廣員姓名 / 備註</th>
                <th className="py-2.5 px-3.5">專屬代號</th>
                <th className="py-2.5 px-3.5">佣金比例</th>
                <th className="py-2.5 px-3.5 text-right">累計成交訂單數</th>
                <th className="py-2.5 px-3.5 text-right">累計銷售總金額 (RM)</th>
                <th className="py-2.5 px-3.5 text-right">預估應付佣金 (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400">
                    尚未建立推廣員資料，請於下方新增第一位推廣員 / 代理。
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row) => (
                  <tr key={row.referral.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                    <td className="py-2.5 px-3.5 font-semibold text-stone-900 dark:text-stone-100">
                      {row.referral.name}
                      {!row.referral.active && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-500">
                          已停用
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-stone-700 dark:text-stone-300">
                      {row.referral.code}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-stone-600 dark:text-stone-400">
                      {row.commissionRate > 0 ? `${row.commissionRate}%` : '未設定 (0%)'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      {row.orderCount} 單
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      RM {row.totalSales.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-amber-800 dark:text-amber-300">
                      RM {row.estimatedCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
              <tr className="bg-stone-50/70 dark:bg-stone-950/50 text-stone-500">
                <td className="py-2.5 px-3.5 font-medium">{ORGANIC_TRAFFIC_LABEL}</td>
                <td className="py-2.5 px-3.5 font-mono">-</td>
                <td className="py-2.5 px-3.5 font-mono">-</td>
                <td className="py-2.5 px-3.5 text-right font-mono">{reportData.organicCount} 單</td>
                <td className="py-2.5 px-3.5 text-right font-mono">RM {reportData.organicTotal.toLocaleString()}</td>
                <td className="py-2.5 px-3.5 text-right font-mono">RM 0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Referral Form */}
      <form
        onSubmit={handleSubmitForm}
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 space-y-4 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif-brand font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red-700" />
            <span>{editingCode ? `編輯推廣員 (${editingCode})` : '新增推廣員 / 銷售代理'}</span>
          </h3>
          {editingCode && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              取消編輯
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              推廣員姓名 / 備註 *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="例如：陳先生 / Agent A"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              專屬推廣代號（僅限英文或數字）*
            </label>
            <input
              type="text"
              required
              maxLength={32}
              disabled={Boolean(editingCode)}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder="例如：agentA 或 chen01"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              佣金比例 (%)（選填）
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              placeholder="例如：10"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-stone-500">
            儲存後將產生專屬網址 <code className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono">{origin}/?ref={codeInput || 'agentA'}</code> 並同步生成高清 QR Code。
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>儲存至雲端中...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{editingCode ? '更新推廣員資料' : '儲存並生成專屬 QR Code'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Referral List with Copy Link + Branded Downloadable QR Code */}
      {isLoadingReferrals && referrals.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-red-700" />
          <span>正在從雲端資料庫載入推廣員列表...</span>
        </div>
      ) : referrals.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-xs text-stone-500 space-y-1">
          <QrCode className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="font-bold text-stone-700 dark:text-stone-300">目前尚未建立任何推廣員 / 代理</p>
          <p>請在上方表單輸入姓名與代號，即可立即產生專屬推廣網址與印刷級 QR Code 圖片。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {referrals.map((ref) => {
            const shareUrl = `${origin}/?ref=${encodeURIComponent(ref.code)}`;
            const qrUrl = qrImages[ref.id];
            const statRow = reportData.rows.find((r) => r.referral.id === ref.id);

            return (
              <div
                key={ref.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between gap-4 shadow-2xs ${
                  ref.active
                    ? 'border-stone-200/90 dark:border-stone-800'
                    : 'border-stone-200/60 dark:border-stone-800/60 opacity-75'
                }`}
              >
                {/* Card Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {ref.name}
                        </h4>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                          {ref.code}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            ref.active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {ref.active ? '啟用中' : '已停用'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        佣金比例：<strong className="font-mono">{ref.commissionRate ?? 0}%</strong>
                        {statRow && (
                          <>
                            {' · '}成交 <strong className="font-mono">{statRow.orderCount}</strong> 單
                            {' · '}RM <strong className="font-mono">{statRow.totalSales.toLocaleString()}</strong>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCode(ref.code);
                          setNameInput(ref.name);
                          setCodeInput(ref.code);
                          setCommissionInput(
                            ref.commissionRate !== undefined ? String(ref.commissionRate) : ''
                          );
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
                        title="編輯姓名或佣金比例"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={togglingId === ref.id}
                        onClick={() => handleToggleActive(ref)}
                        className="p-1.5 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
                        title={ref.active ? '暫停此代理' : '重新啟用'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === ref.id ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(ref)}
                          className="px-2 py-1 text-[10px] font-bold bg-red-700 text-white rounded-md cursor-pointer"
                        >
                          確認刪除
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ref.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                          title="刪除推廣員"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Share URL Box + Copy Button */}
                  <div className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5">
                    <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                      專屬推廣網址 (Referral Link)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        onClick={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-stone-700 dark:text-stone-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(ref.id, shareUrl)}
                        className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
                      >
                        {copiedId === ref.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                            <span>已複製</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>一鍵複製網址</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Branded QR Code Display */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center space-y-2">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`推廣員 ${ref.name} (${ref.code}) 專屬 QR Code`}
                        className="w-48 h-auto rounded-lg border border-stone-200 shadow-xs bg-white"
                      />
                    ) : (
                      <div className="w-48 h-56 flex items-center justify-center bg-white rounded-lg border border-stone-200 text-xs text-stone-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-1.5" />
                        生成 QR Code...
                      </div>
                    )}
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      推廣員：{ref.name} ({ref.code})
                    </div>
                  </div>
                </div>

                {/* Download QR PNG Button */}
                <button
                  type="button"
                  disabled={!qrUrl}
                  onClick={() => handleDownloadQrPng(ref)}
                  className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>下載 QR Code 圖片（PNG）</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
