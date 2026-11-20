import { OrderStatus, StoreOrder } from '../types/store';

const STATUS_LABEL_MAP: Record<OrderStatus, string> = {
  pending: '待處理 (Pending)',
  confirmed: '已確認 (Confirmed)',
  shipped: '已發貨 (Shipped)',
  completed: '已完成 (Completed)',
  cancelled: '已取消 (Cancelled)',
};

const DELIVERY_METHOD_MAP: Record<string, string> = {
  express_delivery: '快遞送貨',
  store_pickup: '門市自取',
  self_collection: '門市自取',
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  duitnow: 'DuitNow QR',
  tng: 'Touch n Go eWallet',
  bank_transfer: '銀行轉賬',
};

const WEEKDAY_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

function formatLocalYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalHm(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getIsoWeekInfo(isoDateStr: string): {
  dateStr: string;
  timeStr: string;
  weekKey: string;
  weekRange: string;
  dayOfWeekLabel: string;
} {
  const parsed = new Date(isoDateStr);
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  const localDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isoDay = localDay.getDay() === 0 ? 7 : localDay.getDay();

  const monday = new Date(localDay);
  monday.setDate(localDay.getDate() - (isoDay - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const isoYear = thursday.getFullYear();

  const jan4 = new Date(isoYear, 0, 4);
  const jan4IsoDay = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const week1Monday = new Date(isoYear, 0, 4 - (jan4IsoDay - 1));

  const diffDays = Math.round((monday.getTime() - week1Monday.getTime()) / 86400000);
  const weekNum = Math.floor(diffDays / 7) + 1;

  return {
    dateStr: formatLocalYmd(d),
    timeStr: formatLocalHm(d),
    weekKey: `${isoYear}-W${String(weekNum).padStart(2, '0')}`,
    weekRange: `${formatLocalYmd(monday)} ~ ${formatLocalYmd(sunday)}`,
    dayOfWeekLabel: WEEKDAY_LABELS[d.getDay()],
  };
}

function escapeCsvCell(value: string | number | undefined | null): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  let str = String(value ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function triggerCsvDownload(filename: string, headers: string[], rows: (string | number)[][]): void {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 100% 離線產生訂單明細 CSV 備份檔（零 Firestore 讀寫額度消耗）
 */
export function exportOrdersToCsv(orders: StoreOrder[], filenameSuffix = '全部'): number {
  const todayStr = formatLocalYmd(new Date());
  const headers = [
    '訂單編號',
    '進單日期',
    '進單時間',
    '所屬週次',
    '週區間 (週一至週日)',
    '星期',
    '訂單狀態',
    '付款狀態',
    '顧客姓名',
    '聯絡電話',
    '電子郵件',
    '配送方式',
    '收件地址',
    '郵遞區號',
    '付款方式',
    '訂購商品明細',
    '商品總件數',
    '小計 (RM)',
    '運費 (RM)',
    '折扣 (RM)',
    '實付總額 (RM)',
    '優惠碼',
    '隨單贈品',
    '推廣員姓名',
    '推廣代號',
    '付款截圖網址',
    '追蹤單號',
    '顧客備註',
    '內部備註',
  ];

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const rows = sorted.map((order) => {
    const timeInfo = getIsoWeekInfo(order.createdAt);
    const itemsSummary = order.items
      .map((item) => `${item.productName}(${item.unitWeight}) ×${item.quantity}`)
      .join('；');
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return [
      `#${order.id}`,
      timeInfo.dateStr,
      timeInfo.timeStr,
      timeInfo.weekKey,
      timeInfo.weekRange,
      timeInfo.dayOfWeekLabel,
      STATUS_LABEL_MAP[order.status] || order.status,
      order.paymentStatus === 'paid' ? '已付款' : '未付款',
      order.customer?.name || '',
      order.customer?.phone || '',
      order.customer?.email || '',
      DELIVERY_METHOD_MAP[order.customer?.deliveryMethod || ''] || order.customer?.deliveryMethod || '',
      order.customer?.address || '',
      order.customer?.postalCode || '',
      PAYMENT_METHOD_MAP[order.customer?.paymentMethod || ''] || order.customer?.paymentMethod || '',
      itemsSummary,
      totalQty,
      order.subtotal ?? 0,
      order.shippingFee ?? 0,
      order.discount ?? 0,
      order.total ?? 0,
      order.appliedPromoCode || '',
      order.freeGiftName || '',
      order.referralName || (order.referralCode ? order.referralCode : '自然流量 / 直客'),
      order.referralCode || '',
      order.paymentProofUrl || '',
      order.trackingNumber || '',
      order.customer?.notes || '',
      order.internalNotes || '',
    ];
  });

  triggerCsvDownload(`錦源訂單備份_${filenameSuffix}_${todayStr}.csv`, headers, rows);
  return rows.length;
}

/**
 * 100% 離線產生「每週銷量分析彙總」CSV（零 Firestore 讀寫額度消耗）
 */
export function exportWeeklySalesSummaryToCsv(orders: StoreOrder[]): number {
  const todayStr = formatLocalYmd(new Date());

  interface WeekAccumulator {
    weekKey: string;
    weekRange: string;
    validOrderCount: number;
    cancelledOrderCount: number;
    totalUnitsSold: number;
    grossSubtotal: number;
    totalDiscount: number;
    netRevenue: number;
    itemCounts: Record<string, number>;
  }

  const weekMap: Record<string, WeekAccumulator> = {};

  for (const order of orders) {
    const { weekKey, weekRange } = getIsoWeekInfo(order.createdAt);
    if (!weekMap[weekKey]) {
      weekMap[weekKey] = {
        weekKey,
        weekRange,
        validOrderCount: 0,
        cancelledOrderCount: 0,
        totalUnitsSold: 0,
        grossSubtotal: 0,
        totalDiscount: 0,
        netRevenue: 0,
        itemCounts: {},
      };
    }

    const bucket = weekMap[weekKey];
    if (order.status === 'cancelled') {
      bucket.cancelledOrderCount += 1;
      continue;
    }

    bucket.validOrderCount += 1;
    bucket.grossSubtotal += order.subtotal || 0;
    bucket.totalDiscount += order.discount || 0;
    bucket.netRevenue += order.total || 0;

    for (const item of order.items) {
      const qty = item.quantity || 0;
      bucket.totalUnitsSold += qty;
      const key = item.productName || item.sku || '未知商品';
      bucket.itemCounts[key] = (bucket.itemCounts[key] || 0) + qty;
    }
  }

  const headers = [
    '所屬週次',
    '週區間 (週一至週日)',
    '有效訂單數',
    '取消訂單數',
    '總售出件數',
    '商品原價小計 (RM)',
    '優惠折扣總額 (RM)',
    '週淨營業額 (RM)',
    '週平均客單價 AOV (RM)',
    '該週熱銷品項排行',
  ];

  const sortedWeeks = Object.values(weekMap).sort((a, b) => b.weekKey.localeCompare(a.weekKey));

  const rows = sortedWeeks.map((w) => {
    const aov = w.validOrderCount > 0 ? Math.round(w.netRevenue / w.validOrderCount) : 0;
    const topItems = Object.entries(w.itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => `${name}×${qty}`)
      .join('；');

    return [
      w.weekKey,
      w.weekRange,
      w.validOrderCount,
      w.cancelledOrderCount,
      w.totalUnitsSold,
      w.grossSubtotal,
      w.totalDiscount,
      w.netRevenue,
      aov,
      topItems || '無',
    ];
  });

  triggerCsvDownload(`錦源每週銷量報表_${todayStr}.csv`, headers, rows);
  return rows.length;
}
