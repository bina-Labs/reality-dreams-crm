"use client";

import { useLocale } from "@/i18n/provider";
import { LOCALES, LOCALE_NAMES } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-surface-2 p-1",
        className,
      )}
    >
      <Languages size={15} className="mx-1 text-muted" />
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition",
            locale === l
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
