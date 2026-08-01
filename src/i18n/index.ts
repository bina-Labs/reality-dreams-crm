import he from "./messages/he.json";
import en from "./messages/en.json";
import type { Locale } from "./config";

export type Dict = typeof he;

export const dictionaries: Record<Locale, Dict> = { he, en };

/** Resolve a dotted key (e.g. "lead.notes") against a dictionary, with {var} interpolation. */
export function translate(
  dict: Dict,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), dict);

  let out = typeof value === "string" ? value : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return out;
}
