import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { SourceDonut, LanguageBar, type Datum } from "@/components/charts";
import { fmtRelative } from "@/lib/format";
import { OPEN_STATUSES, WON_STATUSES } from "@/lib/constants";
import { cn, contentDir } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";
import { Inbox, FolderOpen, Clock, Trophy, User } from "lucide-react";

export const dynamic = "force-dynamic";

type MiniLead = {
  id: string;
  status: LeadStatus;
  preferred_language: string | null;
  source: string | null;
  created_at: string;
  next_follow_up_at: string | null;
  number_of_travelers: number | null;
  contact: { full_name: string | null; email: string | null } | null;
};

export default async function DashboardPage() {
  const { t, locale } = await getT();
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select(
      "id, status, preferred_language, source, created_at, next_follow_up_at, number_of_travelers, contact:contacts(full_name, email)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as unknown as MiniLead[];

  // eslint-disable-next-line react-hooks/purity -- server component: evaluated once per request
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const total = leads.length;
  const newThisWeek = leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length;
  const openLeads = leads.filter((l) => OPEN_STATUSES.includes(l.status)).length;
  const awaitingFollowUp = leads.filter(
    (l) =>
      l.status === "waiting_for_customer" ||
      (l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() <= now),
  ).length;
  const won = leads.filter((l) => WON_STATUSES.includes(l.status)).length;
  const wonRate = total ? Math.round((won / total) * 100) : 0;

  const countBy = (fn: (l: MiniLead) => string | null): Datum[] => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const k = fn(l) || "—";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  };

  const langData = countBy((l) => l.preferred_language);
  const sourceData = countBy((l) => l.source);

  const stats = [
    { label: t("dashboard.newThisWeek"), value: newThisWeek, icon: Inbox, color: "#0d9488", highlight: false },
    { label: t("dashboard.openLeads"), value: openLeads, icon: FolderOpen, color: "#0ea5e9", highlight: true },
    { label: t("dashboard.awaitingFollowUp"), value: awaitingFollowUp, icon: Clock, color: "#f59e0b", highlight: false },
    { label: t("dashboard.wonRate"), value: `${wonRate}%`, icon: Trophy, color: "#22c55e", highlight: false },
  ];

  const recent = leads.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* hero */}
      <div
        className="relative h-32 overflow-hidden rounded-2xl bg-primary shadow-sm sm:h-40"
        style={{ backgroundImage: "url('/og-image.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/45 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-center px-5 text-end">
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-white/80">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl border p-4 transition",
                s.highlight
                  ? "border-transparent bg-foreground text-white shadow-lg"
                  : "border-border bg-surface shadow-sm hover:shadow-md",
              )}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={
                  s.highlight
                    ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                    : { backgroundColor: `${s.color}1a`, color: s.color }
                }
              >
                <Icon size={18} />
              </span>
              <div className="mt-3 text-2xl font-extrabold leading-none">{s.value}</div>
              <div className={cn("mt-1 text-xs", s.highlight ? "text-white/70" : "text-muted")}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* advanced analytics */}
      <section className="space-y-3">
        <SectionHeader title={t("dashboard.advancedAnalysis")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 text-end text-sm font-bold text-muted">{t("dashboard.bySource")}</h3>
            <SourceDonut data={sourceData} />
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 text-end text-sm font-bold text-muted">{t("dashboard.byLanguage")}</h3>
            <LanguageBar data={langData} />
          </Card>
        </div>
      </section>

      {/* recent leads */}
      <section className="space-y-3">
        <SectionHeader
          title={t("dashboard.recentLeads")}
          action={
            <Link href="/leads" className="text-sm font-medium text-primary hover:underline">
              {t("dashboard.viewAll")}
            </Link>
          }
        />
        <Card className="p-2 sm:p-3">
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t("leads.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((l) => {
                const name = l.contact?.full_name || l.contact?.email || "—";
                return (
                  <li key={l.id}>
                    <Link
                      href={`/leads/${l.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-surface-2/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold" dir={contentDir(name)}>
                          {name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted">
                          {fmtRelative(l.created_at, locale)}
                          {l.source ? ` · ${l.source}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={l.status} />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                        <User size={16} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <span className="h-4 w-1 rounded-full bg-warning" />
        {title}
      </h2>
      {action}
    </div>
  );
}
