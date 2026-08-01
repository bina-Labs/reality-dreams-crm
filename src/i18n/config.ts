export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "he";
export const LOCALE_COOKIE = "rd_locale";

export const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

export const LOCALE_NAMES: Record<Locale, string> = {
  he: "עברית",
  en: "English",
};

export function normalizeLocale(value: string | undefined | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
