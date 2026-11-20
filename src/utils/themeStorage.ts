import { StorefrontTheme } from '../types/store';

const THEME_STORAGE_KEY = 'jinyuan_storefront_theme_version';

const VALID_THEMES: StorefrontTheme[] = ['classic', 'cny_festive', 'luxury_3d'];

export function isValidStorefrontTheme(value: unknown): value is StorefrontTheme {
  return typeof value === 'string' && (VALID_THEMES as string[]).includes(value);
}

export function getSavedThemeFromLocalStorage(): StorefrontTheme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidStorefrontTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveThemeToLocalStorage(theme: StorefrontTheme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}
