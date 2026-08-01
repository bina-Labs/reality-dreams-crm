import { cookies } from "next/headers";
import { dictionaries, translate } from "./index";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

/** Read the active locale from the cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Server-side translator bound to the current locale. */
export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(dict, key, vars),
  };
}
