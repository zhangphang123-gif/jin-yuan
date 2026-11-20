import React, { useState } from 'react';
import { adminLoginWithGoogle } from '../../utils/firebaseService';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNewTabHint, setShowNewTabHint] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setShowNewTabHint(false);
    setLoading(true);
    try {
      await adminLoginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg(
          t(
            '登入視窗已關閉，請點擊上方按鈕重新選擇授權 Gmail 帳號（若瀏覽器阻擋彈窗，請改用新分頁開啟網頁）。',
            'Sign-in window was closed. Please click again to select your authorized Gmail account.'
          )
        );
        setShowNewTabHint(true);
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg(
          t(
            '瀏覽器封鎖了 Google 登入彈出視窗，請允許彈出視窗或點擊下方在新分頁開啟後再登入。',
            'Popup blocked by browser. Please allow popups or open in a new tab to sign in.'
          )
        );
        setShowNewTabHint(true);
      } else if (code === 'auth/unauthorized-domain') {
        console.warn('Unauthorized domain for Firebase Auth:', window.location.hostname);
        setErrorMsg(
          t(
            `目前網域 (${window.location.hostname}) 尚未加入 Firebase 授權網域清單，請在 Firebase Console > Authentication > Settings > Authorized domains 加入此網域。`,
            `Domain (${window.location.hostname}) is not in Firebase Authorized Domains.`
          )
        );
      } else if (err?.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(
          t(
            '登入失敗，請確認使用的是授權的店長 Gmail 帳號。',
            'Sign-in failed. Please use an authorized store manager Gmail account.'
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 relative text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-950 to-red-800 text-amber-300 flex items-center justify-center shadow-lg border border-amber-400/50">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>

          <h3 className="font-serif-brand text-2xl font-black text-red-950 dark:text-red-100">
            {t('錦源店長管理系統', 'Jin Yuan Admin Portal')}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {t(
              '請點擊下方按鈕並選擇已授權的店長 Gmail 帳號（zhangphang123@gmail.com 或 jinyuanheng88@gmail.com）登入後台。',
              'Sign in with an authorized manager Gmail (zhangphang123@gmail.com or jinyuanheng88@gmail.com).'
            )}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl space-y-2 text-xs text-red-800 dark:text-red-300 font-medium animate-fade">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            {showNewTabHint && typeof window !== 'undefined' && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-900 dark:text-amber-300 underline ml-6"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{t('在獨立瀏覽器分頁開啟此網站進行登入', 'Open in new browser tab to sign in')}</span>
              </a>
            )}
          </div>
        )}

        {/* Primary Authorized Gmail Google Sign-In */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full py-3.5 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2.5 cursor-pointer border-2 border-stone-300 dark:border-stone-600 hover:border-red-800 dark:hover:border-amber-400 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-700" />
                <span>{t('正在開啟 Google 帳號選擇...', 'Opening Google Sign-In...')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{t('使用授權 Gmail 帳號一鍵登入', 'Sign in with Authorized Gmail')}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-stone-400">
            {t('僅開放已授權之店長 Google 帳號存取訂單與商品資料', 'Protected by Firebase Auth & Firestore Security Rules')}
          </p>
        </div>

        {/* Back to Storefront Button */}
        <div className="flex items-center justify-center pt-3 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer py-1 px-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('返回前台商店', 'Back to Storefront')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
