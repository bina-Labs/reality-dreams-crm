import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detect the writing direction of user-generated content (never translated),
 * so a Hebrew name renders RTL even when the UI is in English and vice-versa.
 */
export function contentDir(text: string | null | undefined): "rtl" | "ltr" {
  if (!text) return "ltr";
  return /[֐-׿؀-ۿ]/.test(text) ? "rtl" : "ltr";
}
