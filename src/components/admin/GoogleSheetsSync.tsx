import React, { useState, useEffect } from 'react';
import { StoreOrder, StoreSettings } from '../../types/store';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  invalidateAccessToken,
  logout,
} from '../../utils/firebaseAuth';
import {
  createOrdersSpreadsheet,
  syncAllOrdersToSheet,
  verifySheetAccess,
  formatOrderForSheet,
  GoogleSheetsApiError,
} from '../../utils/googleSheets';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  LogOut,
  Database,
  Info,
  Download,
  ShieldAlert
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncProps {
  orders: StoreOrder[];
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => Promise<void> | void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  orders,
  settings,
  onSaveSettings,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);
  const [inputSheetId, setInputSheetId] = useState(settings.googleSheetId || '');
  const [autoSyncDraft, setAutoSyncDraft] = useState<boolean>(settings.autoSyncToSheets !== false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSheetTitle, setVerifiedSheetTitle] = useState<string | null>(null);

  // Initialize Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDownloadCsvForSheets = () => {
    const headers = [
      '訂單編號',
      '下單時間 (MYT)',
      '顧客姓名',
      '聯絡電話',
      '電子郵箱',
      '配送方式',
      '送貨地址',
      '訂購商品明細',
      '小計 (RM)',
      '運費 (RM)',
      '折扣 (RM)',
      '實付總額 (RM)',
      '付款方式',
      '訂單狀態',
      '備註',
      'WhatsApp 通知',
    ];
    const escapeCell = (v: string | number) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows = orders.map((o) => formatOrderForSheet(o).map(escapeCell).join(','));
    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JinYuan_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: `已匯出 ${orders.length} 筆訂單 CSV 報表，可直接用 Google 試算表或 Excel 開啟！`,
    });
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setStatusMessage({
          type: 'success',
          text: `成功連接 Google 帳號：${res.user.email}！已具備 Google 試算表存取權限。`,
        });
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setStatusMessage({
          type: 'info',
          text: 'Google 授權視窗已關閉。若看到「403: access_denied / 未完成 Google 驗證程序」，請由專案擁有者依下方連結前往 Google Cloud (project-5d6c5131-5ea2-4a54-83b) 將 zhangphang123@gmail.com 與 jinyuanheng88@gmail.com 加入「測試人員 (Test users)」名單即可！',
        });
      } else {
        console.warn('Google Sheets OAuth error:', err);
        setStatusMessage({
          type: 'error',
          text: `Google 授權未完成: ${err.message || '請確認該 Gmail 已加入 Google Cloud 測試人員名單'}`,
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setStatusMessage({
        type: 'info',
        text: '已退出 Google 帳號。',
      });
    } catch (err: any) {
      console.warn('Google logout issue:', err?.message || err);
    }
  };

  const ensureFreshAccessToken = async (): Promise<string | null> => {
    const existing = await getAccessToken();
    if (existing) return existing;

    const loginRes = await googleSignIn();
    if (loginRes) {
      setCurrentUser(loginRes.user);
      return loginRes.accessToken;
    }
    return null;
  };

  const handleSheetsFailure = (prefix: string, err: unknown) => {
    if (err instanceof GoogleSheetsApiError) {
      if (err.needsReauth) {
        invalidateAccessToken();
        setCurrentUser(null);
      }
      setStatusMessage({
        type: 'error',
        text: `${prefix}: ${err.message}`,
        actionUrl: err.activationUrl,
        actionLabel: err.activationUrl ? '前往 Google Cloud 啟用 Google Sheets API' : undefined,
      });
      console.warn(`${prefix}:`, err.status, err.reason || err.message);
      return;
    }

    const msg = err instanceof Error ? err.message : String(err || '未知錯誤');
    console.warn(`${prefix}:`, msg);
    setStatusMessage({
      type: 'error',
      text: `${prefix}: ${msg}`,
    });
  };

  const handleCreateNewSheet = async () => {
    setStatusMessage(null);
    let token: string | null = null;
    try {
      token = await ensureFreshAccessToken();
    } catch {
      setStatusMessage({ type: 'error', text: '請先登入 Google 帳號並允許試算表權限以建立表格。' });
      return;
    }

    if (!token) return;

    setIsCreatingSheet(true);
    try {
      let result;
      try {
        result = await createOrdersSpreadsheet(token, settings.storeName);
      } catch (firstErr) {
        if (firstErr instanceof GoogleSheetsApiError && firstErr.needsReauth && firstErr.status === 401) {
          invalidateAccessToken();
          const refreshed = await googleSignIn();
          if (!refreshed) throw firstErr;
          token = refreshed.accessToken;
          setCurrentUser(refreshed.user);
          result = await createOrdersSpreadsheet(token, settings.storeName);
        } else {
          throw firstErr;
        }
      }

      const updatedSettings: StoreSettings = {
        ...settings,
        googleSheetId: result.spreadsheetId,
        googleSheetUrl: result.spreadsheetUrl,
        autoSyncToSheets: true,
      };
      await onSaveSettings(updatedSettings);
      setInputSheetId(result.spreadsheetId);
      setVerifiedSheetTitle(result.title);

      if (orders.length > 0) {
        await syncAllOrdersToSheet(token, result.spreadsheetId, orders);
      }

      setStatusMessage({
        type: 'success',
        text: `成功在您的 Google 雲端硬碟建立《${result.title}》！已自動將 ${orders.length} 筆現有訂單同步寫入。`,
      });
    } catch (err) {
      handleSheetsFailure('建立 Google 試算表失敗', err);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncAllOrders = async () => {
    const sheetId = settings.googleSheetId || inputSheetId.trim();
    if (!sheetId) {
      setStatusMessage({ type: 'error', text: '請先建立或輸入 Google 試算表 ID！' });
      return;
    }

    let token: string | null = null;
    try {
      token = await ensureFreshAccessToken();
    } catch {
      setStatusMessage({ type: 'error', text: '請先登入 Google 帳號以進行同步。' });
      return;
    }

    if (!token) return;

    setIsSyncing(true);
    setStatusMessage(null);
    try {
      let count: number;
      try {
        count = await syncAllOrdersToSheet(token, sheetId, orders);
      } catch (firstErr) {
        if (firstErr instanceof GoogleSheetsApiError && firstErr.needsReauth && firstErr.status === 401) {
          invalidateAccessToken();
          const refreshed = await googleSignIn();
          if (!refreshed) throw firstErr;
          token = refreshed.accessToken;
          setCurrentUser(refreshed.user);
          count = await syncAllOrdersToSheet(token, sheetId, orders);
        } else {
          throw firstErr;
        }
      }

      setStatusMessage({
        type: 'success',
        text: `同步成功！已將 ${count} 筆顧客訂單完整寫入 Google 試算表。`,
      });
    } catch (err) {
      handleSheetsFailure('同步失敗', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCustomSheetId = async () => {
    const cleanId = inputSheetId.trim();
    if (!cleanId) return;

    const token = await getAccessToken();
    setIsVerifying(true);
    setStatusMessage(null);
    try {
      if (token) {
        const info = await verifySheetAccess(token, cleanId);
        setVerifiedSheetTitle(info.title);
      }

      const updatedSettings: StoreSettings = {
        ...settings,
        googleSheetId: cleanId,
        googleSheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      };
      await onSaveSettings(updatedSettings);

      setStatusMessage({
        type: 'success',
        text: `已綁定試算表 ID: ${cleanId}`,
      });
    } catch (err) {
      handleSheetsFailure('驗證失敗', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const activeSheetUrl =
    settings.googleSheetUrl ||
    (settings.googleSheetId ? `https://docs.google.com/spreadsheets/d/${settings.googleSheetId}/edit` : null);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-brand text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                Google 試算表 (Google Sheets) 顧客資料連動
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                顧客在商城下單後，資料即時同步存入您的 Google 試算表，手機隨時查閱、複製地址發送快遞。
              </p>
            </div>
          </div>
        </div>

        {/* Google Account Authentication Status */}
        <div className="shrink-0 flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-950 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  G
                </div>
              )}
              <div className="text-left text-xs">
                <span className="font-bold block text-stone-900 dark:text-stone-100 truncate max-w-[150px]">
                  {currentUser.displayName || 'Google 用戶'}
                </span>
                <span className="text-stone-500 truncate max-w-[150px] block">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                title="登出 Google 帳號"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-600 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? '正在連接 Google...' : '登入 Google 帳號授權'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3 flex-1">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {statusMessage.actionUrl && (
              <a
                href={statusMessage.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
              >
                <span>{statusMessage.actionLabel || '前往處理'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Connection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Setup & Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Current Linked Sheet */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <h3 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
              <span>🔗 已連動的 Google 試算表</span>
              {settings.googleSheetId && (
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已連接成功
                </span>
              )}
            </h3>

            {activeSheetUrl ? (
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">試算表名稱：</span>
                    <strong className="text-sm block text-stone-900 dark:text-stone-100">
                      {verifiedSheetTitle || `${settings.storeName} · 顧客訂單總表`}
                    </strong>
                  </div>
                  <a
                    href={activeSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    <span>在 Google 試算表開啟</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-xs font-mono text-stone-500 break-all">
                  表格 ID: {settings.googleSheetId}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-stone-50 dark:bg-stone-950 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  尚未連接 Google 試算表
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  您可以一鍵讓系統在您的 Google 雲端硬碟建立專屬訂單表，或是直接貼入您現有的 Google 試算表 ID。
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingSheet ? '正在建立表格...' : '⚡ 一鍵建立全新 Google 訂單總表'}</span>
              </button>

              <button
                onClick={handleSyncAllOrders}
                disabled={isSyncing || !settings.googleSheetId}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '同步中...' : `🔄 同步現有訂單 (${orders.length} 筆)`}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsvForSheets}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-stone-600 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>匯出 CSV（直接匯入 Google Sheets）</span>
              </button>
            </div>

            {/* Troubleshooting Box for 403 access_denied / Both Admin Gmails */}
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60 space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>帳號權限與 Google Sheets「403: access_denied」排解說明</span>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[11px] sm:text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong>✅ 店長後台與 Firebase 雲端資料庫 (jinyuan-92d37)：</strong>已完整開通給{' '}
                <span className="font-mono font-bold">zhangphang123@gmail.com</span> 及{' '}
                <span className="font-mono font-bold">jinyuanheng88@gmail.com</span>，兩位店長皆可自由登入後台並讀寫商品與訂單！
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs leading-relaxed">
                <li>
                  Google 試算表連動使用獨立授權服務（<span className="font-mono font-bold">project-5d6c5131-5ea2-4a54-83b</span>），不會與後台登入互相衝突或登出。
                </li>
                <li>
                  若任一帳號授權試算表時出現「<strong>403: access_denied / 未完成驗證程序</strong>」，是因為 Google 測試模式的同意畫面要求將授權 Gmail 列入名單；請專案建立人開啟下方連結，在 <strong>目標對象 (Audience) → 測試人員 (Test users)</strong> 按 <strong>+ Add users</strong> 加入{' '}
                  <span className="font-mono font-bold text-red-800 dark:text-amber-300">zhangphang123@gmail.com</span> 與{' '}
                  <span className="font-mono font-bold text-red-800 dark:text-amber-300">jinyuanheng88@gmail.com</span> 並儲存即可立即授權。
                </li>
                <li>
                  也可先用其中一個已授權帳號建立試算表，再於 Google Sheets 右上角「共用」給另一位店長共同檢視編輯；或隨時點擊上方「匯出 CSV」離線開啟。
                </li>
              </ol>
              <div className="pt-1">
                <a
                  href="https://console.cloud.google.com/auth/audience?project=project-5d6c5131-5ea2-4a54-83b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-900 border border-amber-400/70 rounded-lg text-xs font-bold text-amber-950 dark:text-amber-200 hover:bg-amber-100 transition"
                >
                  <span>前往 Google Cloud 加入測試人員 (兩位店長帳號)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Auto-sync setting switch (writes ONLY on explicit Save button click) */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  新訂單自動即時寫入 Google 試算表
                </span>
                <p className="text-xs text-stone-500">
                  只要顧客在官網提交訂單，系統自動將客戶姓名、電話、地址與所選克數即時新增為試算表新列。
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="checkbox"
                  checked={autoSyncDraft}
                  onChange={(e) => setAutoSyncDraft(e.target.checked)}
                  className="w-5 h-5 accent-emerald-700 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    onSaveSettings({ ...settings, autoSyncToSheets: autoSyncDraft });
                    setStatusMessage({ type: 'success', text: '已儲存 Google 試算表自動同步開關設定。' });
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  儲存開關
                </button>
              </div>
            </div>
          </div>

          {/* Card: Manual Sheet ID Binding */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h4 className="font-serif-brand text-base font-bold text-stone-900 dark:text-stone-100">
              手動綁定現有 Google 試算表 ID
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSheetId}
                onChange={(e) => setInputSheetId(e.target.value)}
                placeholder="例：1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl font-mono"
              />
              <button
                onClick={handleSaveCustomSheetId}
                disabled={isVerifying || !inputSheetId.trim()}
                className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
              >
                {isVerifying ? '驗證中...' : '儲存綁定'}
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              * 表格 ID 是 Google 試算表網址中 <code>/d/</code> 和 <code>/edit</code> 之間的一長串英數字。
            </p>
          </div>

        </div>

        {/* Right: Why Google Sheets vs Supabase Guide (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-950 rounded-2xl p-6 border border-amber-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
              <Database className="w-5 h-5 text-amber-700" />
              <span>Google 試算表 vs Supabase 該選哪一個？</span>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              您在提問中問到：<strong>「顧客填的東西也是可以 link 去那個 Google Sheet 拿來儲存，還是直接用 Supabase？」</strong>
            </p>

            <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
              <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">
                  ✅ 為什麼對於錦源來說，Google 試算表更好？
                </strong>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>店長手機隨手查</strong>：只要打開手機上的 Google Sheets App，就能隨時查看今天有哪些客人下單、買了多少克肉乾。</li>
                  <li><strong>發快遞最方便</strong>：可以直接在手機上複製客人的姓名、電話、住址，貼給快遞（J&T / Poslaju / Lalamove）。</li>
                  <li><strong>免代碼免維護</strong>：不用學習複雜的 SQL 資料庫或 Supabase 後台，隨時一鍵下載 Excel 或分享給家人對賬。</li>
                </ul>
              </div>

              <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                <strong className="text-stone-700 dark:text-stone-300 block font-bold">
                  🛡️ 雙重資料保險
                </strong>
                <p>
                  我們為錦源做了<strong>「雲端 Firestore (jinyuan-92d37) + 離線 CSV 匯出備份 + Google 試算表同步」</strong>三重保險，顧客訂單永久保存於雲端且絕不重複覆寫！
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
