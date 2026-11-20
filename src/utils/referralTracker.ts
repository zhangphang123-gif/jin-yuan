import { StoreReferral, StoreSettings } from '../types/store';

const STORAGE_KEY = 'jy_referral_tracking_v1';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const VALID_REF_REGEX = /^[a-zA-Z0-9]{2,32}$/;

export interface StoredReferralData {
  code: string;
  capturedAt: number;
  expiresAt: number;
}

export function normalizeReferralCode(raw: string | null | undefined): string {
  const clean = (raw || '').trim();
  if (!VALID_REF_REGEX.test(clean)) return '';
  return clean;
}

function parseStoredPayload(raw: string | null): StoredReferralData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredReferralData>;
    const code = normalizeReferralCode(parsed.code);
    const expiresAt = typeof parsed.expiresAt === 'number' ? parsed.expiresAt : 0;
    const capturedAt = typeof parsed.capturedAt === 'number' ? parsed.capturedAt : 0;
    if (!code || expiresAt <= Date.now()) {
      return null;
    }
    return { code, capturedAt, expiresAt };
  } catch {
    return null;
  }
}

function persistReferralLocally(payload: StoredReferralData): void {
  const serialized = JSON.stringify(payload);
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // Ignore localStorage restrictions
  }
}

/**
 * Purely client-side silent tracking:
 * Captures `?ref=xxx` from the current URL on visit/scan and persists it in
 * sessionStorage + 7-day localStorage with ZERO Firestore database reads.
 * Scanning another agent's code later overwrites the active tracking code.
 */
export function captureReferralFromUrl(): StoredReferralData | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const rawRef = params.get('ref');
    if (rawRef !== null) {
      const code = normalizeReferralCode(rawRef);
      if (code) {
        const now = Date.now();
        const payload: StoredReferralData = {
          code,
          capturedAt: now,
          expiresAt: now + SEVEN_DAYS_MS,
        };
        persistReferralLocally(payload);
        return payload;
      }
    }
  } catch {
    // Ignore URL parse issues
  }
  return getActiveReferralTracking();
}

export function getActiveReferralTracking(): StoredReferralData | null {
  if (typeof window === 'undefined') return null;

  try {
    const fromSession = parseStoredPayload(window.sessionStorage.getItem(STORAGE_KEY));
    if (fromSession) return fromSession;
  } catch {
    // Ignore sessionStorage read errors
  }

  try {
    const fromLocal = parseStoredPayload(window.localStorage.getItem(STORAGE_KEY));
    if (fromLocal) {
      // Rehydrate sessionStorage for faster access across navigation
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromLocal));
      } catch {
        // Ignore
      }
      return fromLocal;
    }
    // Remove expired entry if present
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage read errors
  }

  return null;
}

export function clearReferralTracking(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const ORGANIC_TRAFFIC_LABEL = '自然流量 / 直客';

export function resolveReferralForOrder(
  settings: StoreSettings,
  loadedReferrals: StoreReferral[] = []
): { referralCode: string; referralName: string } {
  const active = getActiveReferralTracking();
  if (!active || !active.code) {
    return {
      referralCode: '',
      referralName: ORGANIC_TRAFFIC_LABEL,
    };
  }

  const targetLower = active.code.toLowerCase();

  // 1. Check loaded admin referrals if available
  const matchedAdmin = loadedReferrals.find(
    (r) => r.code.toLowerCase() === targetLower
  );
  if (matchedAdmin) {
    return {
      referralCode: matchedAdmin.code,
      referralName: matchedAdmin.name,
    };
  }

  // 2. Check cached referralDirectory inside StoreSettings (0 extra Firestore reads!)
  const dir = settings.referralDirectory || {};
  if (dir[targetLower]) {
    return {
      referralCode: active.code,
      referralName: dir[targetLower],
    };
  }

  // 3. Fallback to the captured code itself so attribution is preserved
  return {
    referralCode: active.code,
    referralName: active.code,
  };
}
