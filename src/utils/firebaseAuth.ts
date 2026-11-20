import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

/**
 * Dedicated OAuth Firebase App config for Google Sheets & Drive Workspace APIs
 * Provisioned via AI Studio OAuth (`project-5d6c5131-5ea2-4a54-83b`),
 * intentionally isolated from primary store Firestore (`jinyuan-92d37`) so
 * Workspace scopes & sign-in/sign-out never affect Admin Dashboard authentication.
 */
const SHEETS_OAUTH_CONFIG = {
  projectId: 'project-5d6c5131-5ea2-4a54-83b',
  appId: '1:405129963025:web:274e7f7dc58dec3385f3b0',
  apiKey: 'AIzaSyAsxNTQWKcymiZk-CIug2Si4S2ocRBZdQw',
  authDomain: 'project-5d6c5131-5ea2-4a54-83b.firebaseapp.com',
  storageBucket: 'project-5d6c5131-5ea2-4a54-83b.firebasestorage.app',
  messagingSenderId: '405129963025',
};

const sheetsApp =
  getApps().find((a) => a.name === 'sheets-oauth') ||
  initializeApp(SHEETS_OAUTH_CONFIG, 'sheets-oauth');

export const sheetsAuth = getAuth(sheetsApp);
export const auth = sheetsAuth;

// Configure Google Provider with requested Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account consent',
});

// In-memory token cache (Do NOT store in localStorage/sessionStorage per security guidelines)
const TOKEN_SAFE_TTL_MS = 50 * 60 * 1000;
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;
let isSigningIn = false;

export const invalidateAccessToken = () => {
  cachedAccessToken = null;
  cachedTokenExpiresAt = 0;
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(sheetsAuth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken && Date.now() < cachedTokenExpiresAt) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Memory token clears on reload or expires; require fresh sign-in before Workspace API calls
        invalidateAccessToken();
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      invalidateAccessToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(sheetsAuth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('未能從 Google 驗證取得試算表存取權杖 (Access Token)');
    }

    cachedAccessToken = credential.accessToken;
    cachedTokenExpiresAt = Date.now() + TOKEN_SAFE_TTL_MS;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code !== 'auth/popup-closed-by-user' &&
      error?.code !== 'auth/cancelled-popup-request'
    ) {
      console.warn('Google Sheets OAuth issue:', error?.code || error?.message);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken || Date.now() >= cachedTokenExpiresAt) {
    invalidateAccessToken();
    return null;
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(sheetsAuth);
  invalidateAccessToken();
};
