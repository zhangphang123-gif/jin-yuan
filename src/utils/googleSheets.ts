import { StoreOrder } from '../types/store';

export interface SheetCreateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const ORDER_HEADERS = [
  '訂單編號',
  '下單時間 (MYT)',
  '顧客姓名',
  '聯絡電話',
  '電子郵箱',
  '配送方式',
  '送貨地址',
  '訂購商品明細 (含克數規格)',
  '小計 (RM)',
  '運費 (RM)',
  '折扣 (RM)',
  '實付總額 (RM)',
  '付款方式',
  '訂單狀態',
  '客戶備註 (含優惠/贈品/截圖)',
  'WhatsApp 通知'
];

export const formatOrderForSheet = (order: StoreOrder): (string | number)[] => {
  const itemsText = order.items
    .map((item) => `${item.productName} [${item.unitWeight}] x${item.quantity} (RM ${item.price * item.quantity})`)
    .join(' ; ');

  const deliveryMethodZh =
    order.customer.deliveryMethod === 'express_delivery'
      ? '全馬快遞配送'
      : order.customer.deliveryMethod === 'store_pickup'
      ? '門市自取 (柴楞公園)'
      : '專人送達';

  const paymentMethodZh =
    order.customer.paymentMethod === 'duitnow'
      ? 'DuitNow QR 轉賬'
      : order.customer.paymentMethod === 'tng'
      ? 'Touch n Go 電子錢包'
      : 'Public Bank 銀行轉賬';

  const statusZh =
    order.status === 'pending'
      ? '待確認'
      : order.status === 'confirmed'
      ? '已接單製作'
      : order.status === 'shipped'
      ? '已出貨配送'
      : order.status === 'completed'
      ? '已完成'
      : '已取消';

  const extraNotes = [
    order.customer.notes || '',
    order.appliedPromoCode ? `優惠碼: ${order.appliedPromoCode}` : '',
    order.freeGiftName ? `贈品: ${order.freeGiftName}` : '',
    order.paymentProofUrl && order.paymentProofUrl.startsWith('http')
      ? `付款截圖: ${order.paymentProofUrl}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return [
    order.id,
    new Date(order.createdAt).toLocaleString('zh-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
    order.customer.name,
    order.customer.phone,
    order.customer.email || '未填寫',
    deliveryMethodZh,
    order.customer.address || '門市自取',
    itemsText,
    order.subtotal,
    order.shippingFee,
    order.discount,
    order.total,
    paymentMethodZh,
    statusZh,
    extraNotes || '無',
    order.whatsappSent ? '已傳送 WhatsApp' : '未發送'
  ];
};

export class GoogleSheetsApiError extends Error {
  status: number;
  reason?: string;
  activationUrl?: string;
  needsReauth: boolean;

  constructor(
    message: string,
    options: {
      status: number;
      reason?: string;
      activationUrl?: string;
      needsReauth?: boolean;
    }
  ) {
    super(message);
    this.name = 'GoogleSheetsApiError';
    this.status = options.status;
    this.reason = options.reason;
    this.activationUrl = options.activationUrl;
    this.needsReauth = Boolean(options.needsReauth);
  }
}

const DEFAULT_SHEETS_ACTIVATION_URL =
  'https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=project-5d6c5131-5ea2-4a54-83b';

async function parseGoogleSheetsError(
  response: Response,
  fallbackMessage: string
): Promise<GoogleSheetsApiError> {
  const status = response.status;
  let rawMessage = '';
  let apiStatus = '';
  let reason = '';
  let activationUrl = '';

  try {
    const rawText = await response.text();
    if (rawText) {
      const parsed = JSON.parse(rawText) as {
        error?: {
          message?: string;
          status?: string;
          details?: Array<{
            reason?: string;
            metadata?: { activationUrl?: string };
            links?: Array<{ url?: string }>;
          }>;
        };
      };
      rawMessage = parsed?.error?.message || '';
      apiStatus = parsed?.error?.status || '';
      const details = parsed?.error?.details || [];
      for (const detail of details) {
        if (!reason && detail.reason) reason = detail.reason;
        if (!activationUrl && detail.metadata?.activationUrl) {
          activationUrl = detail.metadata.activationUrl;
        }
        if (!activationUrl && detail.links?.[0]?.url) {
          activationUrl = detail.links[0].url;
        }
      }
    }
  } catch {
    // Non-JSON error response body
  }

  const lowerMsg = rawMessage.toLowerCase();

  if (status === 401 || apiStatus === 'UNAUTHENTICATED') {
    return new GoogleSheetsApiError(
      'Google 授權憑證已過期或失效，請重新點擊「登入 Google 帳號授權」後再試。',
      { status, reason: reason || 'UNAUTHENTICATED', needsReauth: true }
    );
  }

  if (
    reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' ||
    lowerMsg.includes('insufficient authentication scopes') ||
    lowerMsg.includes('insufficient permission')
  ) {
    return new GoogleSheetsApiError(
      '授權時未勾選 Google 試算表存取權限！請重新點擊「登入 Google 帳號授權」，並在同意視窗中務必勾選「查看、編輯、建立及刪除您的 Google 試算表」。',
      { status, reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT', needsReauth: true }
    );
  }

  if (
    reason === 'SERVICE_DISABLED' ||
    lowerMsg.includes('has not been used in project') ||
    lowerMsg.includes('api has not been used') ||
    lowerMsg.includes('it is disabled')
  ) {
    return new GoogleSheetsApiError(
      'Google Cloud 專案尚未啟用 Google Sheets API，請點擊下方按鈕前往啟用後再試一次。',
      {
        status,
        reason: 'SERVICE_DISABLED',
        activationUrl: activationUrl || DEFAULT_SHEETS_ACTIVATION_URL,
        needsReauth: false,
      }
    );
  }

  if (status === 403 || apiStatus === 'PERMISSION_DENIED') {
    return new GoogleSheetsApiError(
      `Google 試算表存取被拒 (${rawMessage || '權限不足'})。請確認該 Google 帳號已加入測試人員名單且具此表格編輯權限。`,
      { status, reason: reason || 'PERMISSION_DENIED', needsReauth: false }
    );
  }

  return new GoogleSheetsApiError(rawMessage || `${fallbackMessage} (HTTP ${status})`, {
    status,
    reason: reason || apiStatus || undefined,
    activationUrl: activationUrl || undefined,
    needsReauth: false,
  });
}

/**
 * Automatically creates a brand new formatted Google Sheet for Jin Yuan Orders
 */
export const createOrdersSpreadsheet = async (
  accessToken: string,
  storeName: string = '錦源傳統肉乾肉絲專賣店'
): Promise<SheetCreateResult> => {
  if (!accessToken) {
    throw new GoogleSheetsApiError('尚未取得有效的 Google 授權憑證，請先登入 Google 帳號。', {
      status: 401,
      reason: 'UNAUTHENTICATED',
      needsReauth: true,
    });
  }

  const safeStoreName = (storeName || '').trim() || '錦源傳統肉乾肉絲專賣店';
  const title = `${safeStoreName} · 顧客訂單總表 (自動同步)`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        timeZone: 'Asia/Kuala_Lumpur',
      },
      sheets: [
        {
          properties: {
            title: '顧客訂單名冊',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: ORDER_HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.65, green: 0.08, blue: 0.12 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                        fontSize: 11,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw await parseGoogleSheetsError(response, '建立 Google 試算表失敗');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
};

/**
 * Fetch actual sheet tab names so we never assume 'Sheet1' blindly
 */
export const verifySheetAccess = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> => {
  if (!accessToken) {
    throw new GoogleSheetsApiError('尚未取得有效的 Google 授權憑證，請先登入 Google 帳號。', {
      status: 401,
      reason: 'UNAUTHENTICATED',
      needsReauth: true,
    });
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw await parseGoogleSheetsError(
      response,
      '無法讀取該 Google 試算表，請確認權限或表格 ID 是否正確'
    );
  }

  const data = await response.json();
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
  return {
    title: data.properties?.title || '未命名表格',
    sheets,
  };
};

async function resolveTargetSheetTab(
  accessToken: string,
  spreadsheetId: string,
  preferredTabName: string
): Promise<string> {
  const info = await verifySheetAccess(accessToken, spreadsheetId);
  if (info.sheets.includes(preferredTabName)) {
    return preferredTabName;
  }
  return info.sheets[0] || preferredTabName;
}

/**
 * Appends a single order row to the specified Google Sheet
 */
export const appendOrderToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  order: StoreOrder,
  sheetTabName: string = '顧客訂單名冊'
): Promise<boolean> => {
  const targetTab = await resolveTargetSheetTab(accessToken, spreadsheetId, sheetTabName);
  const rowValues = formatOrderForSheet(order);
  const range = encodeURIComponent(`'${targetTab.replace(/'/g, "''")}'!A1`);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    throw await parseGoogleSheetsError(response, '寫入 Google 試算表失敗');
  }

  return true;
};

/**
 * Syncs multiple orders to the spreadsheet in batch
 */
export const syncAllOrdersToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  orders: StoreOrder[],
  sheetTabName: string = '顧客訂單名冊'
): Promise<number> => {
  if (orders.length === 0) return 0;

  const targetTab = await resolveTargetSheetTab(accessToken, spreadsheetId, sheetTabName);
  const rows = orders.map((o) => formatOrderForSheet(o));
  const range = encodeURIComponent(`'${targetTab.replace(/'/g, "''")}'!A1`);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    throw await parseGoogleSheetsError(response, '批量同步至 Google 試算表失敗');
  }

  return orders.length;
};
