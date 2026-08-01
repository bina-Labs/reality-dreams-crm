"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { dictionaries, translate } from "./index";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_DIR,
  normalizeLocale,
  type Locale,
} from "./config";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = React.createContext<Ctx | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  const setLocale = React.useCallback(
    (l: Locale) => {
      const next = normalizeLocale(l);
      setLocaleState(next);
      // persist for future requests (server components read the cookie)
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, next);
      } catch {
        /* ignore */
      }
      // instant: flip direction + language on the document without navigating
      document.documentElement.lang = next;
      document.documentElement.dir = LOCALE_DIR[next];
      // re-render server components with the new locale, preserving client state + URL
      router.refresh();
    },
    [router],
  );

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE], key, vars),
    [locale],
  );

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Convenience hook returning just the translator. */
export function useT() {
  return useLocale().t;
}
