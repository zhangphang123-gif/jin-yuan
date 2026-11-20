import React, { createContext, useContext, useState, useEffect } from 'react';
import { CategoryDefinition, ProductCategory } from '../types/store';

export type Language = 'zh' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (zh: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'zh',
  setLang: () => {},
  toggleLang: () => {},
  t: (zh) => zh,
});

const STORAGE_LANG_KEY = 'ky_store_lang_v1';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'zh') return saved;
    } catch {
      // ignore storage errors
    }
    return 'zh';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = (newLang: Language) => setLangState(newLang);
  const toggleLang = () => setLangState((prev) => (prev === 'zh' ? 'en' : 'zh'));
  const t = (zh: string, en: string) => (lang === 'en' ? en : zh);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}

const CATEGORY_EN_MAP: Record<string, string> = {
  bakkwa: 'Charcoal Bak Kwa',
  roast: 'Roast Meats',
  floss: 'Crispy Meat Floss',
  cookies: 'CNY Cookies & Snacks',
  cured: 'Cured Sausages',
  seasonal: 'Seasonal Specials',
};

export function getCategoryLabel(
  category: ProductCategory,
  zhLabel: string,
  lang: Language,
  categories?: CategoryDefinition[]
): string {
  const matched = categories?.find((c) => c.id === category);
  if (matched) {
    return lang === 'en' ? matched.labelEn || zhLabel : matched.labelZh || zhLabel;
  }
  return lang === 'en' ? CATEGORY_EN_MAP[category] || zhLabel : zhLabel;
}
