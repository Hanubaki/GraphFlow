import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Locale, translations } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'graphflow_locale';

export function getNestedTranslation(obj: any, path: string): string | null {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale;
      if (stored === 'en' || stored === 'tr') return stored;
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('tr')) return 'tr';
    }
    return 'en';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const currentDict = translations[locale];
      const translated = getNestedTranslation(currentDict, path);
      if (translated !== null) return translated;

      // Fallback to English dictionary if not found in current locale
      const defaultDict = translations.en;
      const defaultTranslation = getNestedTranslation(defaultDict, path);
      if (defaultTranslation !== null) return defaultTranslation;

      return fallback ?? path;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    // Provide safe fallback if mounted outside provider (e.g. isolated test)
    return {
      locale: 'en',
      setLocale: () => {},
      t: (path: string, fallback?: string) => {
        const trans = getNestedTranslation(translations.en, path);
        return trans ?? fallback ?? path;
      },
    };
  }
  return context;
}
