import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { he, enUS } from "date-fns/locale";
import type { Locale } from "@/i18n/config";

const dfLocale = (locale: Locale) => (locale === "he" ? he : enUS);

export function fmtDate(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "—";
  return format(d, "d MMM yyyy", { locale: dfLocale(locale) });
}

export function fmtDateTime(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  return format(d, "d MMM yyyy, HH:mm", { locale: dfLocale(locale) });
}

export function fmtRelative(value: string | null | undefined, locale: Locale) {
  if (!value) return "—";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true, locale: dfLocale(locale) });
}
