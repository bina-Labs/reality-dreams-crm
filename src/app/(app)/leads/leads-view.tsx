"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { Card, Input, Select } from "@/components/ui";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { ALL_STATUSES, OPEN_STATUSES, STATUS_COLORS, STATUS_EMOJI } from "@/lib/constants";
import { contentDir, cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import { updateLeadStatus } from "../actions";
import type { LeadStatus, Priority, Profile } from "@/lib/types";
import { Search, ChevronLeft, Users, Globe, Tag, User, Plus, Inbox, FolderOpen, X, XCircle } from "lucide-react";

export type LeadRow = {
  id: string;
  status: LeadStatus;
  priority: Priority;
  number_of_travelers: number | null;
  preferred_language: string | null;
  source: string | null;
  service_category: string | null;
  created_at: string;
  travel_start_date: string | null;
  assigned_to_user_id: string | null;
  contact: { full_name: string | null; email: string | null; phone: string | null; country: string | null } | null;
  assignee: { id: string; full_name: string | null; email: string | null } | null;
};

export function LeadsView({ leads, profiles }: { leads: LeadRow[]; profiles: Profile[] }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  const sources = useMemo(
    () => [...new Set(leads.map((l) => l.source).filter(Boolean))] as string[],
    [leads],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (source !== "all" && l.source !== source) return false;
      if (owner === "unassigned" && l.assigned_to_user_id) return false;
      if (owner !== "all" && owner !== "unassigned" && l.assigned_to_user_id !== owner)
        return false;
      if (needle) {
        const hay = [l.contact?.full_name, l.contact?.email, l.contact?.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [leads, q, status, owner, source]);

  const newCount = useMemo(() => leads.filter((l) => l.status === "new_inquiry").length, [leads]);
  const openCount = useMemo(() => leads.filter((l) => OPEN_STATUSES.includes(l.status)).length, [leads]);
  const lostCount = useMemo(() => leads.filter((l) => l.status === "lost").length, [leads]);

  const kpis = useMemo(
    () => [
      { key: "total", label: t("leads.kpiTotal"), value: leads.length, icon: Inbox },
      { key: "new", label: t("leads.kpiNew"), value: newCount, icon: Users },
      { key: "open", label: t("leads.kpiOpen"), value: openCount, icon: FolderOpen },
    ],
    [leads.length, newCount, openCount, t],
  );

  function changeStatus(id: string, next: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatus(id, next);
      router.refresh();
    });
  }

  const ownerName = (p: LeadRow["assignee"]) =>
    p?.full_name || p?.email || t("common.unassigned");

  const anyFilter =
    q.trim() !== "" || status !== "all" || owner !== "all" || source !== "all";
  function clearFilters() {
    setQ("");
    setStatus("all");
    setOwner("all");
    setSource("all");
  }

  const statusChips: string[] = ["all", ...ALL_STATUSES];

  return (
    <div className="space-y-4">
      {/* KPI cards — mobile */}
      <div className="space-y-3 md:hidden">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.key}
              className="flex items-center justify-between rounded-2xl border border-border border-s-4 border-s-primary bg-surface p-4 shadow-sm"
            >
              <div>
                <div className="text-xs text-muted">{k.label}</div>
                <div className="mt-0.5 text-2xl font-extrabold leading-none">{k.value}</div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
            </div>
          );
        })}
      </div>

      {/* KPI summary — desktop (premium, matches Dashboard) */}
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        {[
          { label: t("leads.kpiTotal"), value: leads.length, icon: Inbox, color: "#0d9488", highlight: false },
          { label: t("leads.kpiNew"), value: newCount, icon: Users, color: "#0ea5e9", highlight: false },
          { label: t("leads.kpiOpen"), value: openCount, icon: FolderOpen, color: "#0d9488", highlight: true },
          { label: t("leads.kpiLost"), value: lostCount, icon: XCircle, color: "#ef4444", highlight: false },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className={cn(
                "rounded-2xl border p-5 transition",
                k.highlight
                  ? "border-transparent bg-foreground text-white shadow-lg"
                  : "border-border bg-surface shadow-sm hover:shadow-md",
              )}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={
                  k.highlight
                    ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                    : { backgroundColor: `${k.color}1a`, color: k.color }
                }
              >
                <Icon size={20} />
              </span>
              <div className="mt-4 text-3xl font-extrabold leading-none tracking-tight">{k.value}</div>
              <div className={cn("mt-1.5 text-xs font-medium", k.highlight ? "text-white/70" : "text-muted")}>
                {k.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* search — mobile only */}
      <div className="relative md:hidden">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-muted"
        />
        <Input
          ref={searchRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.search")}
          className="ps-9"
        />
      </div>

      {/* desktop toolbar — compact search + filters */}
      <Card className="hidden items-center gap-2 p-2 md:flex">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="h-10 w-full rounded-lg border border-transparent bg-surface-2/60 pe-3 ps-9 text-sm outline-none transition placeholder:text-muted focus:border-border focus:bg-surface focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="all">{t("leads.filterStatus")}: {t("common.all")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-40">
          <option value="all">{t("leads.filterOwner")}: {t("common.all")}</option>
          <option value="unassigned">{t("common.unassigned")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
          ))}
        </Select>
        {sources.length > 1 && (
          <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-36">
            <option value="all">{t("leads.filterSource")}: {t("common.all")}</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        )}
        {anyFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={15} />
            {t("leads.clearFilters")}
          </button>
        )}
      </Card>

      {/* mobile filters: status chips + owner/source selects */}
      <div className="space-y-2 md:hidden">
        <div className="board-scroll -mx-1 flex gap-2 px-1 pb-1">
          {statusChips.map((s) => {
            const active = status === s;
            const label = s === "all" ? t("common.all") : t(`status.${s}`);
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-primary text-primary-fg shadow-sm"
                    : "bg-surface-2 text-muted hover:text-foreground",
                )}
                style={active && s !== "all" ? { backgroundColor: STATUS_COLORS[s as LeadStatus] } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="flex-1 text-xs">
            <option value="all">{t("leads.filterOwner")}: {t("common.all")}</option>
            <option value="unassigned">{t("common.unassigned")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </Select>
          {sources.length > 1 && (
            <Select value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 text-xs">
              <option value="all">{t("leads.filterSource")}: {t("common.all")}</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">{t("leads.count", { n: filtered.length })}</p>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">{t("leads.empty")}</Card>
      ) : (
        <>
          {/* MOBILE: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                t={t}
                pending={pending}
                onStatusChange={changeStatus}
              />
            ))}
          </div>

          {/* DESKTOP: table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="board-scroll">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-start text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <Th>{t("leads.traveler")}</Th>
                    <Th>{t("leads.trip")}</Th>
                    <Th>{t("leads.language")}</Th>
                    <Th>{t("common.assignee")}</Th>
                    <Th>{t("common.status")}</Th>
                    <Th>{t("leads.date")}</Th>
                    <Th> </Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const name = l.contact?.full_name || l.contact?.email || "—";
                    return (
                      <tr key={l.id} className="border-b border-border transition-colors last:border-0 hover:bg-primary/[0.04]">
                        <Td>
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                              <User size={16} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <PriorityBadge priority={l.priority} />
                                <span className="truncate font-semibold" dir={contentDir(name)}>{name}</span>
                              </div>
                              {l.contact?.email && (
                                <div className="truncate text-xs text-muted" dir="ltr">{l.contact.email}</div>
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="font-medium">{l.service_category || "—"}</div>
                          <div className="mt-0.5 text-xs text-muted">
                            {l.number_of_travelers ? `${l.number_of_travelers} · ` : ""}
                            {l.travel_start_date ? fmtDate(l.travel_start_date, locale) : ""}
                          </div>
                        </Td>
                        <Td>
                          <span dir={contentDir(l.preferred_language)}>{l.preferred_language || "—"}</span>
                        </Td>
                        <Td><span className="text-xs text-muted">{ownerName(l.assignee)}</span></Td>
                        <Td>
                          <select
                            value={l.status}
                            disabled={pending}
                            onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t("common.status")}
                            style={{
                              color: STATUS_COLORS[l.status],
                              backgroundColor: `${STATUS_COLORS[l.status]}14`,
                              borderColor: `${STATUS_COLORS[l.status]}55`,
                            }}
                            className="max-w-[190px] cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-ring"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-surface font-medium text-foreground">
                                {STATUS_EMOJI[s]} {t(`status.${s}`)}
                              </option>
                            ))}
                          </select>
                        </Td>
                        <Td>
                          <span className="whitespace-nowrap text-xs text-muted">{fmtDate(l.created_at, locale)}</span>
                        </Td>
                        <Td>
                          <Link
                            href={`/leads/${l.id}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {t("common.open")}
                            <ChevronLeft size={14} className="rtl:rotate-0 ltr:rotate-180" />
                          </Link>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* FAB — mobile quick action (focus search). No manual create-lead flow exists. */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          searchRef.current?.focus();
        }}
        aria-label={t("common.search")}
        className="fixed bottom-20 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition hover:brightness-105 active:scale-95 md:hidden"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function LeadCard({
  lead: l,
  t,
  pending,
  onStatusChange,
}: {
  lead: LeadRow;
  t: (k: string, v?: Record<string, string | number>) => string;
  pending: boolean;
  onStatusChange: (id: string, next: LeadStatus) => void;
}) {
  const name = l.contact?.full_name || l.contact?.email || "—";
  const details: [React.ComponentType<{ size?: number; className?: string }>, string, string | number][] = [
    [Users, t("leads.travelers"), l.number_of_travelers ?? "—"],
    [Globe, t("leads.language"), l.preferred_language || "—"],
    [Tag, t("leads.source"), l.source || "—"],
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
            <User size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={l.priority} />
              <span className="truncate font-semibold" dir={contentDir(name)}>{name}</span>
            </div>
            {l.contact?.email && (
              <div className="truncate text-xs text-muted" dir="ltr">{l.contact.email}</div>
            )}
          </div>
        </div>
        <StatusBadge status={l.status} />
      </div>

      <dl className="mt-3 space-y-1.5">
        {details.map(([Icon, label, value], i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <dt className="flex items-center gap-1.5 text-muted">
              <Icon size={14} />
              {label}
            </dt>
            <dd className="truncate font-medium" dir={contentDir(String(value))}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <select
          value={l.status}
          disabled={pending}
          onChange={(e) => onStatusChange(l.id, e.target.value as LeadStatus)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          aria-label={t("common.status")}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <Link
          href={`/leads/${l.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-fg transition hover:opacity-90 active:scale-95"
        >
          {t("common.open")}
          <ChevronLeft size={14} className="rtl:rotate-0 ltr:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3.5 text-start">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-4 align-middle">{children}</td>;
}
