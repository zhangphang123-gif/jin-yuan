import React, { useState, useMemo, useEffect } from 'react';
import { StoreOrder, OrderStatus, StoreSettings, StoreReferral } from '../../types/store';
import { ORGANIC_TRAFFIC_LABEL } from '../../utils/referralTracker';
import {
  Search,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  X,
  Image as ImageIcon,
  ExternalLink,
  Gift,
  ZoomIn,
  FileSpreadsheet,
  Copy,
  Check,
  RotateCcw,
  Save,
  Send,
  Users
} from 'lucide-react';
import { exportOrdersToCsv, exportWeeklySalesSummaryToCsv } from '../../utils/orderCsvExport';
import {
  formatWhatsAppPhone,
  formatOrderFollowUpMessage,
  generateShippedFollowUpWhatsAppLink,
} from '../../utils/whatsapp';

interface OrdersTableProps {
  orders: StoreOrder[];
  referrals?: StoreReferral[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderTracking?: (orderId: string, trackingNumber: string) => Promise<void> | void;
  onPrintInvoice: (order: StoreOrder) => void;
  settings: StoreSettings;
  showSummaryCards?: boolean;
}

type RevenuePeriod = 'day' | 'month' | 'year' | 'all';

function toLocalDateStr(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  referrals = [],
  onUpdateOrderStatus,
  onUpdateOrderTracking,
  onPrintInvoice,
  settings,
  showSummaryCards = true,
}) => {
  const todayStr = toLocalDateStr(new Date().toISOString());
  const thisMonthStr = todayStr.slice(0, 7);
  const thisYearStr = todayStr.slice(0, 4);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('all');
  const [referralFilter, setReferralFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<StoreOrder | null>(null);
  const [trackingDraft, setTrackingDraft] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [trackingSavedNotice, setTrackingSavedNotice] = useState(false);
  const [followUpMessageDraft, setFollowUpMessageDraft] = useState('');
  const [isFollowUpMessageEdited, setIsFollowUpMessageEdited] = useState(false);
  const [copiedFollowUp, setCopiedFollowUp] = useState(false);
  const [isDetailPreviewOpen, setIsDetailPreviewOpen] = useState(true);

  const [previewingOrder, setPreviewingOrder] = useState<StoreOrder | null>(null);
  const [previewTrackingDraft, setPreviewTrackingDraft] = useState('');
  const [isSavingPreviewTracking, setIsSavingPreviewTracking] = useState(false);
  const [previewTrackingSaved, setPreviewTrackingSaved] = useState(false);
  const [previewMessageDraft, setPreviewMessageDraft] = useState('');
  const [isPreviewMessageEdited, setIsPreviewMessageEdited] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const [zoomedReceipt, setZoomedReceipt] = useState<{ url: string; orderId: string; total: number; customerName: string } | null>(null);
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  const activeViewingOrder = useMemo(() => {
    if (!viewingOrder) return null;
    return orders.find((o) => o.id === viewingOrder.id) ?? viewingOrder;
  }, [orders, viewingOrder]);

  const activePreviewOrder = useMemo(() => {
    if (!previewingOrder) return null;
    return orders.find((o) => o.id === previewingOrder.id) ?? previewingOrder;
  }, [orders, previewingOrder]);

  useEffect(() => {
    if (!activeViewingOrder) return;
    if (!isFollowUpMessageEdited) {
      setFollowUpMessageDraft(
        formatOrderFollowUpMessage(activeViewingOrder, settings, trackingDraft)
      );
    }
  }, [activeViewingOrder, settings, trackingDraft, isFollowUpMessageEdited]);

  useEffect(() => {
    if (!activePreviewOrder) return;
    if (!isPreviewMessageEdited) {
      setPreviewMessageDraft(
        formatOrderFollowUpMessage(activePreviewOrder, settings, previewTrackingDraft)
      );
    }
  }, [activePreviewOrder, settings, previewTrackingDraft, isPreviewMessageEdited]);

  // Day / Month / Year revenue switcher + date filter
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('day');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(thisMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(thisYearStr);
  const [filterByPeriodInTable, setFilterByPeriodInTable] = useState<boolean>(false);

  const statusConfigs: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: '待處理 (Pending)', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', icon: Clock },
    confirmed: { label: '已確認 (Confirmed)', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', icon: CheckCircle },
    shipped: { label: '已發貨 (Shipped)', color: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', icon: Truck },
    completed: { label: '已完成 (Completed)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle },
    cancelled: { label: '已取消 (Cancelled)', color: 'text-stone-500 bg-stone-100 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700', icon: AlertCircle },
  };

  // All available years from orders + current year
  const availableYears = useMemo(() => {
    const years = new Set<string>([thisYearStr]);
    orders.forEach((o) => years.add(toLocalDateStr(o.createdAt).slice(0, 4)));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [orders, thisYearStr]);

  // Valid (non-cancelled) orders
  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  // Filter valid orders by active period (day / month / year / all)
  const periodValidOrders = useMemo(() => {
    return validOrders.filter((o) => {
      const dateStr = toLocalDateStr(o.createdAt);
      if (revenuePeriod === 'day') return dateStr === selectedDay;
      if (revenuePeriod === 'month') return dateStr.slice(0, 7) === selectedMonth;
      if (revenuePeriod === 'year') return dateStr.slice(0, 4) === selectedYear;
      return true;
    });
  }, [validOrders, revenuePeriod, selectedDay, selectedMonth, selectedYear]);

  const periodRevenue = periodValidOrders.reduce((acc, o) => acc + o.total, 0);
  const periodAOV = periodValidOrders.length > 0 ? Math.round(periodRevenue / periodValidOrders.length) : 0;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  // Daily breakdown ("哪一天進來的") across the selected month / year / all
  const dailyBreakdown = useMemo(() => {
    const map: Record<string, { date: string; count: number; total: number }> = {};
    validOrders.forEach((o) => {
      const dateStr = toLocalDateStr(o.createdAt);
      // Scope breakdown to the selected month/year when in month/year view, otherwise show all recent days
      if (revenuePeriod === 'month' && dateStr.slice(0, 7) !== selectedMonth) return;
      if (revenuePeriod === 'year' && dateStr.slice(0, 4) !== selectedYear) return;

      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, count: 0, total: 0 };
      }
      map[dateStr].count += 1;
      map[dateStr].total += o.total;
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [validOrders, revenuePeriod, selectedMonth, selectedYear]);

  // Build combined list of referrers from loaded referrals + settings.referralDirectory + orders
  const referralFilterOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    referrals.forEach((r) => {
      if (r.code) map.set(r.code.toLowerCase(), { code: r.code, name: r.name });
    });
    Object.entries(settings.referralDirectory || {}).forEach(([codeLower, name]) => {
      if (!map.has(codeLower)) {
        map.set(codeLower, { code: codeLower, name });
      }
    });
    orders.forEach((o) => {
      const code = (o.referralCode || '').trim();
      if (code && !map.has(code.toLowerCase())) {
        map.set(code.toLowerCase(), {
          code,
          name: o.referralName && o.referralName !== ORGANIC_TRAFFIC_LABEL ? o.referralName : code,
        });
      }
    });
    return Array.from(map.values());
  }, [referrals, settings.referralDirectory, orders]);

  // Filter orders for the table
  const filteredOrders = orders.filter((order) => {
    if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;

    if (referralFilter !== 'all') {
      const orderCode = (order.referralCode || '').trim().toLowerCase();
      if (referralFilter === 'organic') {
        if (orderCode) return false;
      } else if (orderCode !== referralFilter.toLowerCase()) {
        return false;
      }
    }

    if (itemCategoryFilter !== 'all') {
      const hasMatchingItem = order.items.some((item) => {
        const text = `${item.productName} ${item.sku}`.toLowerCase();
        if (itemCategoryFilter === 'chicken') return text.includes('雞') || text.includes('chicken');
        if (itemCategoryFilter === 'pork') return text.includes('豬') || text.includes('pork') || text.includes('燒肉') || text.includes('叉燒') || text.includes('元寶') || text.includes('金錢');
        if (itemCategoryFilter === 'bakkwa') return text.includes('肉乾') || item.sku.startsWith('JY-DM') || item.sku.startsWith('JY-SP');
        if (itemCategoryFilter === 'cookies') return text.includes('餅') || text.includes('酥') || text.includes('蛋卷') || item.sku.startsWith('JY-CK');
        if (itemCategoryFilter === 'cured') return text.includes('臘腸') || text.includes('潤腸') || item.sku.startsWith('JY-CR');
        if (itemCategoryFilter === 'roast') return text.includes('燒') || text.includes('叉燒') || item.sku.startsWith('JY-RT');
        return true;
      });
      if (!hasMatchingItem) return false;
    }

    if (filterByPeriodInTable) {
      const dateStr = toLocalDateStr(order.createdAt);
      if (revenuePeriod === 'day' && dateStr !== selectedDay) return false;
      if (revenuePeriod === 'month' && dateStr.slice(0, 7) !== selectedMonth) return false;
      if (revenuePeriod === 'year' && dateStr.slice(0, 4) !== selectedYear) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.toLowerCase().includes(q);
      const matchAddress = order.customer.address.toLowerCase().includes(q);
      const matchRef = `${order.referralName || ''} ${order.referralCode || ''}`.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchAddress && !matchRef) return false;
    }
    return true;
  });

  const buildCustomerWhatsAppHref = (order: StoreOrder) => {
    const cleanPhone = formatWhatsAppPhone(order.customer.phone);
    if (order.status === 'shipped') {
      return generateShippedFollowUpWhatsAppLink(order, settings);
    }
    const msg = encodeURIComponent(
      `您好 ${order.customer.name}！我們是【${settings.storeName}】。關於您的訂單 #${order.id}（金額 RM ${order.total}），我們正在跟進安排中。如有任何問題歡迎隨時回覆！`
    );
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  };

  const openOrderDetails = (order: StoreOrder) => {
    const initialTracking = order.trackingNumber || '';
    setViewingOrder(order);
    setTrackingDraft(initialTracking);
    setTrackingSavedNotice(false);
    setIsFollowUpMessageEdited(false);
    setCopiedFollowUp(false);
    setIsDetailPreviewOpen(order.status === 'shipped');
    setFollowUpMessageDraft(
      formatOrderFollowUpMessage(order, settings, initialTracking)
    );
  };

  const openMessagePreviewModal = (order: StoreOrder) => {
    const initialTracking = order.trackingNumber || '';
    setPreviewingOrder(order);
    setPreviewTrackingDraft(initialTracking);
    setPreviewTrackingSaved(false);
    setIsPreviewMessageEdited(false);
    setCopiedPreview(false);
    setPreviewMessageDraft(
      formatOrderFollowUpMessage(order, settings, initialTracking)
    );
  };

  const handleSaveTrackingNumber = async () => {
    if (!activeViewingOrder || !onUpdateOrderTracking) return;
    setIsSavingTracking(true);
    try {
      await onUpdateOrderTracking(activeViewingOrder.id, trackingDraft);
      setTrackingSavedNotice(true);
      window.setTimeout(() => setTrackingSavedNotice(false), 2500);
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleSavePreviewTracking = async () => {
    if (!activePreviewOrder || !onUpdateOrderTracking) return;
    setIsSavingPreviewTracking(true);
    try {
      await onUpdateOrderTracking(activePreviewOrder.id, previewTrackingDraft);
      setPreviewTrackingSaved(true);
      window.setTimeout(() => setPreviewTrackingSaved(false), 2500);
    } finally {
      setIsSavingPreviewTracking(false);
    }
  };

  const handleCopyFollowUpMessage = async () => {
    if (!followUpMessageDraft.trim()) return;
    try {
      await navigator.clipboard.writeText(followUpMessageDraft);
      setCopiedFollowUp(true);
      window.setTimeout(() => setCopiedFollowUp(false), 2500);
    } catch {
      // Clipboard API may be blocked in some contexts
    }
  };

  const handleCopyPreviewMessage = async () => {
    if (!previewMessageDraft.trim()) return;
    try {
      await navigator.clipboard.writeText(previewMessageDraft);
      setCopiedPreview(true);
      window.setTimeout(() => setCopiedPreview(false), 2500);
    } catch {
      // Clipboard API may be blocked in some contexts
    }
  };

  const showCsvNotice = (msg: string) => {
    setCsvFeedback(msg);
    window.setTimeout(() => {
      setCsvFeedback((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleExportFilteredOrdersCsv = () => {
    if (filteredOrders.length === 0) return;
    const isFiltered = filteredOrders.length !== orders.length;
    const count = exportOrdersToCsv(filteredOrders, isFiltered ? '目前篩選' : '全部');
    showCsvNotice(`已離線導出 ${count} 筆訂單至 CSV（含所屬週次，零 Firestore 額度消耗）`);
  };

  const handleExportAllOrdersCsv = () => {
    if (orders.length === 0) return;
    const count = exportOrdersToCsv(orders, '完整備份');
    showCsvNotice(`已完成全部 ${count} 筆訂單 CSV 完整備份（零 Firestore 額度消耗）`);
  };

  const handleExportWeeklySummaryCsv = () => {
    const source = filteredOrders.length > 0 && filteredOrders.length !== orders.length ? filteredOrders : orders;
    if (source.length === 0) return;
    const weekCount = exportWeeklySalesSummaryToCsv(source);
    showCsvNotice(`已離線導出 ${weekCount} 週之每週銷量彙總 CSV 報表（零 Firestore 額度消耗）`);
  };

  const periodTitleMap: Record<RevenuePeriod, string> = {
    day: `${selectedDay === todayStr ? '今日' : selectedDay} 營業額 (日結)`,
    month: `${selectedMonth === thisMonthStr ? '本月' : selectedMonth} 營業額 (月結)`,
    year: `${selectedYear} 全年營業額 (年結)`,
    all: '累計總營業額 (All Time)',
  };

  return (
    <div className="space-y-6">
      
      {showSummaryCards && (
        <div className="space-y-4">
          {/* Period Filter Controls (Day / Month / Year / All) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1 mr-1">
                <Calendar className="w-4 h-4 text-red-700" />
                <span>營業額週期：</span>
              </span>

              {(
                [
                  { id: 'day', label: '一天 (按日)' },
                  { id: 'month', label: '一個月 (按月)' },
                  { id: 'year', label: '一年 (按年)' },
                  { id: 'all', label: '全部累計' },
                ] as { id: RevenuePeriod; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRevenuePeriod(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    revenuePeriod === tab.id
                      ? 'bg-red-900 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Specific Date / Month / Year Picker */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {revenuePeriod === 'day' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => {
                      setSelectedDay(e.target.value);
                      setFilterByPeriodInTable(true);
                    }}
                    className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
                  />
                  {selectedDay !== todayStr && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(todayStr)}
                      className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-bold cursor-pointer"
                    >
                      回今天
                    </button>
                  )}
                </div>
              )}

              {revenuePeriod === 'month' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setFilterByPeriodInTable(true);
                  }}
                  className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
                />
              )}

              {revenuePeriod === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setFilterByPeriodInTable(true);
                  }}
                  className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y} 年
                    </option>
                  ))}
                </select>
              )}

              {revenuePeriod !== 'all' && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={filterByPeriodInTable}
                    onChange={(e) => setFilterByPeriodInTable(e.target.checked)}
                    className="accent-red-800"
                  />
                  <span className="font-medium text-stone-700 dark:text-stone-300">同時篩選下方訂單列表</span>
                </label>
              )}
            </div>
          </div>

          {/* Interactive Summary Cards Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {/* Card 1: Total Revenue for Selected Period */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('all');
                if (revenuePeriod !== 'all') {
                  setFilterByPeriodInTable((prev) => !prev);
                } else {
                  setFilterByPeriodInTable(false);
                }
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs ${
                selectedStatus === 'all'
                  ? 'bg-white dark:bg-stone-900 border-stone-800 dark:border-stone-200 ring-2 ring-stone-900/10 dark:ring-stone-100/20 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span className="font-semibold tracking-wider text-emerald-800 dark:text-emerald-400">
                  {periodTitleMap[revenuePeriod]}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                RM {periodRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>來自 {periodValidOrders.length} 筆有效訂單</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {filterByPeriodInTable ? '已篩選該時段' : '點擊查看該時段訂單'}
                </span>
              </div>
            </button>

            {/* Card 2: Pending Orders */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('pending');
                setFilterByPeriodInTable(false);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs ${
                selectedStatus === 'pending'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  待處理訂單 (Pending Orders)
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-800 dark:text-amber-400">
                {pendingOrdersCount} <span className="text-sm font-sans font-normal text-stone-500">筆待出貨</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>點擊篩選待處理清單</span>
                <span className="text-amber-800 dark:text-amber-400 font-medium">立即處理</span>
              </div>
            </button>

            {/* Card 3: Average Order Value */}
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800"
            >
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span className="font-semibold uppercase tracking-wider">時段平均客單價 (AOV)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                RM {periodAOV.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
                <span>免運門檻 RM {settings.freeShippingThreshold}</span>
                <span className="text-blue-700 dark:text-blue-400 font-medium">客單健康度良好</span>
              </div>
            </button>
          </div>

          {/* Daily Inflow Breakdown ("哪一天進來的" quick visual chips) */}
          {dailyBreakdown.length > 0 && (
            <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-red-700" />
                  <span>每日進賬紀錄（點擊日期可立即查看當天進來的訂單）：</span>
                </span>
                {filterByPeriodInTable && (
                  <button
                    type="button"
                    onClick={() => setFilterByPeriodInTable(false)}
                    className="text-[11px] text-red-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <X className="w-3 h-3" />
                    <span>清除日期篩選</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {dailyBreakdown.map((dayItem) => {
                  const isSelected =
                    filterByPeriodInTable && revenuePeriod === 'day' && selectedDay === dayItem.date;
                  return (
                    <button
                      key={dayItem.date}
                      type="button"
                      onClick={() => {
                        setRevenuePeriod('day');
                        setSelectedDay(dayItem.date);
                        setFilterByPeriodInTable(true);
                      }}
                      className={`px-3 py-2 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-red-900 text-white border-red-900 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-red-700'
                      }`}
                    >
                      <div className={`text-[11px] font-mono font-bold ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                        {dayItem.date} {dayItem.date === todayStr ? '(今天)' : ''}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`font-mono font-black text-xs ${isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          RM {dayItem.total.toLocaleString()}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-stone-400'}`}>
                          ({dayItem.count} 單)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Controls: Search and Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 dark:bg-stone-900 rounded-lg overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            全部訂單 ({orders.length})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'pending'
                ? 'bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-300 font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            待處理 ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setSelectedStatus('confirmed')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'confirmed'
                ? 'bg-white dark:bg-stone-800 text-blue-800 dark:text-blue-300 font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            已確認 ({orders.filter((o) => o.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setSelectedStatus('shipped')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'shipped'
                ? 'bg-white dark:bg-stone-800 text-purple-800 dark:text-purple-300 font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            已發貨 ({orders.filter((o) => o.status === 'shipped').length})
          </button>
          <button
            onClick={() => setSelectedStatus('completed')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'completed'
                ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            已完成 ({orders.filter((o) => o.status === 'completed').length})
          </button>
        </div>

        {/* Item Category Filter + Referral Filter + Search + Offline CSV Export */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={referralFilter}
            onChange={(e) => setReferralFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer"
            title="依推廣員 / 代理篩選訂單"
          >
            <option value="all">全部推廣來源</option>
            <option value="organic">🌿 {ORGANIC_TRAFFIC_LABEL}</option>
            {referralFilterOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                🤝 {opt.name} ({opt.code})
              </option>
            ))}
          </select>

          <select
            value={itemCategoryFilter}
            onChange={(e) => setItemCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer"
            title="依訂購品項篩選訂單"
          >
            <option value="all">全部訂單品項</option>
            <option value="chicken">🐔 含雞肉品項</option>
            <option value="pork">🐷 含豬肉品項</option>
            <option value="bakkwa">🥩 含炭烤/造型肉乾</option>
            <option value="cookies">🍪 含傳統餅乾年餅</option>
            <option value="cured">🥓 含臘腸 / 潤腸</option>
            <option value="roast">🍖 含燒豬 / 燒臘</option>
          </select>

          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋單號、顧客姓名或電話..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
            />
          </div>

          {showSummaryCards && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportFilteredOrdersCsv}
                disabled={filteredOrders.length === 0}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-2xs"
                title="離線產生訂單明細 CSV（含所屬週次與付款截圖網址），完全不消耗 Firestore 讀寫額度"
              >
                <Download className="w-3.5 h-3.5" />
                <span>導出至 CSV ({filteredOrders.length})</span>
              </button>

              {filteredOrders.length !== orders.length && orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportAllOrdersCsv}
                  className="px-2.5 py-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="忽略目前篩選條件，完整備份雲端已載入的全部訂單至 CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>備份全部 ({orders.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportWeeklySummaryCsv}
                disabled={orders.length === 0}
                className="px-2.5 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                title="直接按週彙總訂單數、售出件數、週營業額與熱銷品項排行（零雲端額度消耗）"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>每週銷量報表</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {csvFeedback && (
        <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{csvFeedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setCsvFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            aria-label="關閉提示"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold">
                <th className="py-3 px-4">訂單編號</th>
                <th className="py-3 px-4">進單日期與時間</th>
                <th className="py-3 px-4">顧客姓名 / 聯絡方式</th>
                <th className="py-3 px-4">商品品項</th>
                <th className="py-3 px-4">總金額</th>
                <th className="py-3 px-4">狀態管理</th>
                <th className="py-3 px-4">出貨資訊</th>
                <th className="py-3 px-4 text-right">操作與 PDF 出單</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    暫無符合條件的訂單記錄
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = statusConfigs[order.status];
                  const datePart = toLocalDateStr(order.createdAt);
                  const timePart = new Date(order.createdAt).toLocaleTimeString('zh-MY', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                        #{order.id}
                      </td>

                      {/* Created Date with clear Year-Month-Day */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 whitespace-nowrap font-mono">
                        <div className="font-bold text-stone-800 dark:text-stone-200">{datePart}</div>
                        <div className="text-[11px] text-stone-400">{timePart}</div>
                      </td>

                      {/* Customer Info + Referral Source Badge */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">
                          {order.customer.name}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {order.customer.phone}
                        </div>
                        <div className="mt-1">
                          {order.referralCode ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                              <Users className="w-2.5 h-2.5 shrink-0" />
                              <span>
                                {order.referralName && order.referralName !== ORGANIC_TRAFFIC_LABEL
                                  ? `${order.referralName} (${order.referralCode})`
                                  : order.referralCode}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded">
                              {ORGANIC_TRAFFIC_LABEL}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Brief */}
                      <td className="py-3.5 px-4">
                        <div className="text-stone-800 dark:text-stone-200 truncate max-w-xs">
                          {order.items.map((i) => `${i.productName} ×${i.quantity}`).join('，')}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          共 {order.items.reduce((a, b) => a + b.quantity, 0)} 件商品
                        </div>
                      </td>

                      {/* Total Amount & Receipt Thumbnail / Promo Indicator */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800 dark:text-amber-400 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {order.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setZoomedReceipt({
                                  url: order.paymentProofUrl!,
                                  orderId: order.id,
                                  total: order.total,
                                  customerName: order.customer.name,
                                })
                              }
                              className="group/thumb relative w-11 h-11 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-900 shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-emerald-500 transition"
                              title="點擊放大查看付款截圖原圖"
                            >
                              <img
                                src={order.paymentProofUrl}
                                alt={`訂單 #${order.id} 付款截圖`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute inset-0 bg-black/55 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                                <ZoomIn className="w-4 h-4" />
                              </span>
                            </button>
                          )}
                          <div>
                            <div>RM {order.total}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {order.paymentProofUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedReceipt({
                                      url: order.paymentProofUrl!,
                                      orderId: order.id,
                                      total: order.total,
                                      customerName: order.customer.name,
                                    })
                                  }
                                  className="inline-flex items-center gap-0.5 text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100"
                                >
                                  <ZoomIn className="w-2.5 h-2.5" />
                                  <span>查看截圖</span>
                                </button>
                              )}
                              {order.appliedPromoCode && (
                                <span className="text-[10px] font-mono bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                                  {order.appliedPromoCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${statusInfo.color}`}
                        >
                          <option value="pending">待處理 (Pending)</option>
                          <option value="confirmed">已確認 (Confirmed)</option>
                          <option value="shipped">已發貨 (Shipped)</option>
                          <option value="completed">已完成 (Completed)</option>
                          <option value="cancelled">已取消 (Cancelled)</option>
                        </select>
                      </td>

                      {/* Shipping Info + Preview Message Button */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>
                                {order.customer.deliveryMethod === 'store_pickup'
                                  ? '門市自取'
                                  : order.customer.deliveryMethod === 'self_collection'
                                  ? '自提點取貨'
                                  : '快遞宅配'}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate max-w-[130px]">
                              {order.trackingNumber ? order.trackingNumber : '未填寫運單號'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openMessagePreviewModal(order)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                            title="發送 WhatsApp 前先預覽並微調訊息內容"
                          >
                            <Eye className="w-3 h-3" />
                            <span>預覽訊息</span>
                          </button>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print / Download PDF Invoice */}
                          <button
                            onClick={() => onPrintInvoice(order)}
                            className="px-2.5 py-1 text-xs font-bold text-red-900 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-amber-300 dark:border-stone-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="出單 / 下載 PDF 裝箱單"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF出單</span>
                          </button>

                          {/* WhatsApp Customer */}
                          <a
                            href={buildCustomerWhatsAppHref(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title={order.status === 'shipped' ? '透過 WhatsApp 發送出貨追蹤訊息' : '以 WhatsApp 聯絡顧客'}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* View details */}
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                            title="查看詳細"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Order Detail Modal */}
      {activeViewingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-serif-brand text-lg font-bold">
                  訂單明細 #{activeViewingOrder.id}
                </h3>
                <select
                  value={activeViewingOrder.status}
                  onChange={(e) =>
                    onUpdateOrderStatus(activeViewingOrder.id, e.target.value as OrderStatus)
                  }
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
                    statusConfigs[activeViewingOrder.status].color
                  }`}
                >
                  <option value="pending">待處理 (Pending)</option>
                  <option value="confirmed">已確認 (Confirmed)</option>
                  <option value="shipped">已發貨 (Shipped)</option>
                  <option value="completed">已完成 (Completed)</option>
                  <option value="cancelled">已取消 (Cancelled)</option>
                </select>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="關閉訂單明細"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg space-y-1">
                <div><strong>收件人：</strong>{activeViewingOrder.customer.name}</div>
                <div><strong>聯絡電話：</strong>{activeViewingOrder.customer.phone}</div>
                <div><strong>收件地址：</strong>{activeViewingOrder.customer.address}</div>
                <div><strong>付款方式：</strong>{activeViewingOrder.customer.paymentMethod.toUpperCase()}</div>
                <div>
                  <strong>推廣來源：</strong>
                  {activeViewingOrder.referralCode ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded">
                      {activeViewingOrder.referralName && activeViewingOrder.referralName !== ORGANIC_TRAFFIC_LABEL
                        ? `${activeViewingOrder.referralName} (${activeViewingOrder.referralCode})`
                        : activeViewingOrder.referralCode}
                    </span>
                  ) : (
                    <span className="text-stone-500">{ORGANIC_TRAFFIC_LABEL}</span>
                  )}
                </div>
                {activeViewingOrder.appliedPromoCode && (
                  <div className="text-red-700 dark:text-red-400">
                    <strong>使用優惠碼：</strong>
                    <span className="font-mono font-bold">{activeViewingOrder.appliedPromoCode}</span>
                  </div>
                )}
                {activeViewingOrder.freeGiftName && (
                  <div className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>隨單贈品：</strong>{activeViewingOrder.freeGiftName}</span>
                  </div>
                )}
                {activeViewingOrder.customer.notes && (
                  <div><strong>備註：</strong>{activeViewingOrder.customer.notes}</div>
                )}
              </div>

              {/* Courier Tracking Number Section (出貨資訊) */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    <span>出貨資訊 · 快遞運單號 (Tracking Number)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {trackingSavedNotice && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        已儲存運單號
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDetailPreviewOpen((prev) => !prev)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1 cursor-pointer transition-colors ${
                        isDetailPreviewOpen
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isDetailPreviewOpen ? '收起預覽訊息' : '預覽訊息'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={trackingDraft}
                    onChange={(e) => setTrackingDraft(e.target.value)}
                    placeholder="輸入快遞追蹤單號，例如：JNT-MY-881920391"
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  {onUpdateOrderTracking && (
                    <button
                      type="button"
                      onClick={handleSaveTrackingNumber}
                      disabled={
                        isSavingTracking ||
                        trackingDraft.trim() === (activeViewingOrder.trackingNumber || '').trim()
                      }
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingTracking ? '儲存中...' : '儲存單號'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Follow-up Message Preview & Fine-tuning */}
              {(activeViewingOrder.status === 'shipped' || isDetailPreviewOpen) && (
                <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/25 rounded-xl border border-purple-200 dark:border-purple-800/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {activeViewingOrder.status === 'shipped'
                          ? '出貨追蹤 WhatsApp 訊息預覽 ＆ 微調'
                          : 'WhatsApp 通知訊息預覽 ＆ 微調'}
                      </span>
                    </div>
                    {isFollowUpMessageEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsFollowUpMessageEdited(false);
                          setFollowUpMessageDraft(
                            formatOrderFollowUpMessage(activeViewingOrder, settings, trackingDraft)
                          );
                        }}
                        className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>重設預設內容</span>
                      </button>
                    )}
                  </div>

                  {activeViewingOrder.status === 'shipped' && !trackingDraft.trim() && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5">
                      尚未輸入快遞運單號；在上方輸入單號後，下方預填訊息會自動更新。
                    </div>
                  )}

                  <textarea
                    rows={6}
                    value={followUpMessageDraft}
                    onChange={(e) => {
                      setIsFollowUpMessageEdited(true);
                      setFollowUpMessageDraft(e.target.value);
                    }}
                    className="w-full p-2.5 bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] leading-relaxed text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    aria-label="預填 WhatsApp 跟進訊息"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFollowUpMessage}
                      className="px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedFollowUp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>已複製訊息</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>複製訊息</span>
                        </>
                      )}
                    </button>

                    <a
                      href={generateShippedFollowUpWhatsAppLink(
                        activeViewingOrder,
                        settings,
                        followUpMessageDraft,
                        trackingDraft
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Follow-up Message（發送 WhatsApp）</span>
                    </a>
                  </div>
                </div>
              )}

              {activeViewingOrder.paymentProofUrl && (
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>顧客付款截圖憑證</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedReceipt({
                            url: activeViewingOrder.paymentProofUrl!,
                            orderId: activeViewingOrder.id,
                            total: activeViewingOrder.total,
                            customerName: activeViewingOrder.customer.name,
                          })
                        }
                        className="text-emerald-700 dark:text-emerald-300 underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>點擊放大</span>
                      </button>
                      <a
                        href={activeViewingOrder.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1 font-bold"
                      >
                        <span>開新視窗原圖</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setZoomedReceipt({
                        url: activeViewingOrder.paymentProofUrl!,
                        orderId: activeViewingOrder.id,
                        total: activeViewingOrder.total,
                        customerName: activeViewingOrder.customer.name,
                      })
                    }
                    className="block w-full cursor-pointer"
                    title="點擊放大檢視"
                  >
                    <img
                      src={activeViewingOrder.paymentProofUrl}
                      alt="Payment Proof"
                      className="max-h-56 w-full object-contain rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-stone-900"
                    />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <span className="font-semibold block">訂購商品列表：</span>
                {activeViewingOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                    <span>{i.productName} ({i.unitWeight}) × {i.quantity}</span>
                    <span className="font-mono">RM {i.price * i.quantity}</span>
                  </div>
                ))}
                {activeViewingOrder.discount > 0 && (
                  <div className="flex justify-between text-red-700 dark:text-red-400">
                    <span>優惠折扣 ({activeViewingOrder.appliedPromoCode || 'Promo'})：</span>
                    <span className="font-mono">-RM {activeViewingOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1">
                  <span>總計金額：</span>
                  <span className="font-mono text-amber-800 dark:text-amber-400">RM {activeViewingOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => {
                  onPrintInvoice(activeViewingOrder);
                  setViewingOrder(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-900 hover:bg-red-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>開啟出單 / 下載 PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview & Fine-tune WhatsApp Message Modal */}
      {activePreviewOrder && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPreviewingOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 flex-wrap">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-serif-brand text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  預覽 ＆ 微調 WhatsApp 訊息 · #{activePreviewOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                aria-label="關閉預覽訊息視窗"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              {/* Recipient & Status Quick Summary */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">
                    收件顧客：{activePreviewOrder.customer.name}
                  </div>
                  <div className="font-mono text-stone-500 mt-0.5">
                    WhatsApp：{activePreviewOrder.customer.phone}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${statusConfigs[activePreviewOrder.status].color}`}>
                  {statusConfigs[activePreviewOrder.status].label}
                </span>
              </div>

              {/* Quick Tracking Number Input */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    <span>快遞運單號 (可先填寫再發送)</span>
                  </label>
                  {previewTrackingSaved && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      已儲存
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={previewTrackingDraft}
                    onChange={(e) => setPreviewTrackingDraft(e.target.value)}
                    placeholder="輸入快遞運單號，例如：JNT-MY-881920391"
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg font-mono text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  {onUpdateOrderTracking && (
                    <button
                      type="button"
                      onClick={handleSavePreviewTracking}
                      disabled={
                        isSavingPreviewTracking ||
                        previewTrackingDraft.trim() === (activePreviewOrder.trackingNumber || '').trim()
                      }
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPreviewTracking ? '儲存中...' : '儲存單號'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Editable Preview Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200">
                    即將發送給顧客的文字內容（可直接微調）：
                  </label>
                  {isPreviewMessageEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMessageEdited(false);
                        setPreviewMessageDraft(
                          formatOrderFollowUpMessage(activePreviewOrder, settings, previewTrackingDraft)
                        );
                      }}
                      className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>還原預設文字</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={previewMessageDraft}
                  onChange={(e) => {
                    setIsPreviewMessageEdited(true);
                    setPreviewMessageDraft(e.target.value);
                  }}
                  className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-xs leading-relaxed text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  aria-label="微調 WhatsApp 通知訊息"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={handleCopyPreviewMessage}
                className="px-3.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedPreview ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>已複製內容</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製訊息</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingOrder(null)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <a
                  href={generateShippedFollowUpWhatsAppLink(
                    activePreviewOrder,
                    settings,
                    previewMessageDraft,
                    previewTrackingDraft
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>確認並發送 WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Size Receipt Image Lightbox Modal */}
      {zoomedReceipt && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedReceipt(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 text-white text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="font-bold text-amber-300">#{zoomedReceipt.orderId}</span>
                <span className="text-stone-400">·</span>
                <span className="font-sans font-bold">{zoomedReceipt.customerName}</span>
                <span className="text-stone-400">·</span>
                <span className="text-emerald-400 font-bold">RM {zoomedReceipt.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={zoomedReceipt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>原圖網址</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedReceipt(null)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 cursor-pointer"
                  aria-label="關閉圖片"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-5 bg-stone-950 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={zoomedReceipt.url}
                alt={`訂單 #${zoomedReceipt.orderId} 付款截圖原圖`}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
