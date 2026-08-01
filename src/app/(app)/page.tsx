import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { StageBars, MiniDonut, type Datum } from "@/components/charts";
import { fmtDate } from "@/lib/format";
import { ALL_STATUSES, STATUS_COLORS, OPEN_STATUSES, WON_STATUSES } from "@/lib/constants";
import { contentDir } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";
import { Inbox, FolderOpen, Clock, Trophy } from "lucide-react";

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

  const stageData: Datum[] = ALL_STATUSES.map((s) => ({
    name: t(`status.${s}`),
    value: leads.filter((l) => l.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((d) => d.value > 0);

  const langData = countBy((l) => l.preferred_language);
  const sourceData = countBy((l) => l.source);

  const stats = [
    { label: t("dashboard.newThisWeek"), value: newThisWeek, icon: Inbox, color: "#0d9488" },
    { label: t("dashboard.openLeads"), value: openLeads, icon: FolderOpen, color: "#0ea5e9" },
    { label: t("dashboard.awaitingFollowUp"), value: awaitingFollowUp, icon: Clock, color: "#f59e0b" },
    { label: t("dashboard.wonRate"), value: `${wonRate}%`, icon: Trophy, color: "#22c55e" },
  ];

  const recent = leads.slice(0, 8);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("dashboard.subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-4 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${s.color}1a`, color: s.color }}
              >
                <Icon size={20} />
              </span>
              <div>
                <div className="text-2xl font-extrabold leading-none">{s.value}</div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-muted">{t("dashboard.byStage")}</h2>
          <StageBars data={stageData} />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-bold text-muted">{t("dashboard.byLanguage")}</h2>
            <MiniDonut data={langData} />
          </Card>
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-bold text-muted">{t("dashboard.bySource")}</h2>
            <MiniDonut data={sourceData} />
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted">{t("dashboard.recentLeads")}</h2>
          <Link href="/leads" className="text-sm font-medium text-primary hover:underline">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t("leads.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((l) => {
              const name = l.contact?.full_name || l.contact?.email || "—";
              return (
                <li key={l.id}>
                  <Link
                    href={`/leads/${l.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium" dir={contentDir(name)}>
                        {name}
                      </div>
                      <div className="text-xs text-muted">
                        {fmtDate(l.created_at, locale)}
                        {l.number_of_travelers ? ` · ${l.number_of_travelers} ${t("leads.travelers")}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
