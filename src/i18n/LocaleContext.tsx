import { createContext, createElement, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { localizeLabel } from "./labelMap";
import { readStoredLocale, writeStoredLocale, type Locale } from "./locale";
import { formatMessage, messages, type MessageKey } from "./messages";

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Translate;
  tl: (label: string) => string;
  templateName: (templateId: string, fallbackName?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window === "undefined" ? "zh" : readStoredLocale()
  );

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.locale = locale;
    writeStoredLocale(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const setLocale = (next: Locale) => setLocaleState(next);
    const toggleLocale = () => setLocaleState((prev) => (prev === "zh" ? "en" : "zh"));
    const t: Translate = (key, params) => formatMessage(locale, key, params);
    const tl = (label: string) => localizeLabel(locale, label);
    const templateName = (templateId: string, fallbackName = templateId) => {
      const key = `tpl.${templateId}` as MessageKey;
      if (key in messages.zh) {
        return formatMessage(locale, key);
      }
      return fallbackName;
    };

    return { locale, setLocale, toggleLocale, t, tl, templateName };
  }, [locale]);

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
