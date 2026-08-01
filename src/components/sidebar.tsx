"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/provider";
import { LocaleSwitcher } from "./locale-switcher";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckSquare,
  Settings,
  LogOut,
  Waves,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard, exact: true },
  { href: "/leads", key: "nav.leads", icon: Users },
  { href: "/pipeline", key: "nav.pipeline", icon: KanbanSquare },
  { href: "/tasks", key: "nav.tasks", icon: CheckSquare },
];

export function Sidebar({
  role,
  email,
}: {
  role: "admin" | "agent";
  email: string | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [...NAV];
  if (role === "admin")
    items.push({ href: "/settings", key: "nav.settings", icon: Settings });

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 font-extrabold">
          <Waves size={20} className="text-primary" />
          Reality Dreams
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-label="menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-e border-border bg-surface md:h-screen md:w-64 md:sticky md:top-0",
          open ? "block" : "hidden md:flex",
        )}
      >
        <div className="hidden items-center gap-2 px-5 py-5 text-lg font-extrabold md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg">
            <Waves size={18} />
          </span>
          Reality Dreams
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-fg shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={18} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-border p-3">
          <LocaleSwitcher className="w-full justify-center" />
          <div className="truncate px-2 text-xs text-muted" dir="ltr" title={email ?? ""}>
            {email}
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
            >
              <LogOut size={18} />
              {t("nav.signout")}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
