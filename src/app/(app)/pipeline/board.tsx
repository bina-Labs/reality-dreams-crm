"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseISO, isValid } from "date-fns";
import { useLocale } from "@/i18n/provider";
import {
  PIPELINE_STAGES,
  SPECIAL_STATUSES,
  ALL_STATUSES,
  OPEN_STATUSES,
  STATUS_COLORS,
  STATUS_EMOJI,
  PRIORITY_COLORS,
} from "@/lib/constants";
import { contentDir, cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import { updateLeadStatus, updateLeadAssignee } from "../actions";
import type { LeadStatus, Priority, Profile } from "@/lib/types";
import {
  Users,
  CheckCircle2,
  CreditCard,
  Plane,
  AlertTriangle,
  MapPin,
  Globe,
  CalendarClock,
  Clock,
  Search,
  X,
  UserCircle2,
} from "lucide-react";

export type BoardCard = {
  id: string;
  status: LeadStatus;
  priority: Priority;
  number_of_travelers: number | null;
  service_category: string | null;
  destination: string | null;
  preferred_language: string | null;
  travel_start_date: string | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  assigned_to_user_id: string | null;
  contact: { full_name: string | null; email: string | null; country: string | null } | null;
  assignee: { id: string; full_name: string | null; email: string | null } | null;
};

/* ---------------- helpers (presentation only) ---------------- */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Free-form country name/code → flag emoji, best-effort. Never throws. */
const COUNTRY_ISO: Record<string, string> = {
  israel: "IL", ישראל: "IL", "ישראל ": "IL",
  "united states": "US", usa: "US", "u.s.a.": "US", america: "US",
  "ארצות הברית": "US", "estados unidos": "US",
  ecuador: "EC", אקוודור: "EC",
  spain: "ES", ספרד: "ES", españa: "ES", espana: "ES",
  "united kingdom": "GB", uk: "GB", england: "GB", בריטניה: "GB",
  germany: "DE", גרמניה: "DE", alemania: "DE",
  france: "FR", צרפת: "FR", francia: "FR",
  italy: "IT", איטליה: "IT", italia: "IT",
  canada: "CA", קנדה: "CA",
  australia: "AU", אוסטרליה: "AU",
  brazil: "BR", ברזיל: "BR", brasil: "BR",
  argentina: "AR", ארגנטינה: "AR",
  mexico: "MX", מקסיקו: "MX", méxico: "MX",
  switzerland: "CH", שווייץ: "CH", suiza: "CH",
  netherlands: "NL", הולנד: "NL",
  colombia: "CO", קולומביה: "CO",
  chile: "CL", "צ'ילה": "CL",
  peru: "PE", פרו: "PE", perú: "PE",
};

function countryFlag(country: string | null | undefined): string | null {
  if (!country) return null;
  const raw = country.trim();
  let iso: string | undefined;
  if (/^[A-Za-z]{2}$/.test(raw)) iso = raw.toUpperCase();
  else iso = COUNTRY_ISO[raw.toLowerCase()];
  if (!iso) return null;
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...iso].map((ch) => base + ch.charCodeAt(0) - 65));
}

function daysUntil(dateStr: string | null, now: number): number | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return Math.ceil((d.getTime() - now) / 86_400_000);
}

type Proximity = "departed" | "today" | "soon" | "upcoming" | null;

type Signals = {
  open: boolean;
  days: number | null;
  proximity: Proximity;
  overdue: boolean;
  urgent: boolean;
};

function analyze(c: BoardCard, now: number): Signals {
  const open = OPEN_STATUSES.includes(c.status);
  const days = daysUntil(c.travel_start_date, now);
  let proximity: Proximity = null;
  if (days !== null && open) {
    if (days < 0) proximity = "departed";
    else if (days === 0) proximity = "today";
    else if (days <= 7) proximity = "soon";
    else if (days <= 30) proximity = "upcoming";
  }
  const followUp = c.next_follow_up_at ? parseISO(c.next_follow_up_at) : null;
  const overdue = !!(open && followUp && isValid(followUp) && followUp.getTime() < now);
  const urgent =
    open && (c.priority === "urgent" || proximity === "soon" || proximity === "today");
  return { open, days, proximity, overdue, urgent };
}

/* ---------------- board ---------------- */

export function Board({ cards, profiles }: { cards: BoardCard[]; profiles: Profile[] }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  // filters (reuse only existing data)
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("all");
  const [destination, setDestination] = useState("all");
  const [priority, setPriority] = useState("all");

  const destinations = useMemo(
    () =>
      [...new Set(cards.map((c) => c.destination).filter(Boolean))].sort() as string[],
    [cards],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (owner === "unassigned" && c.assigned_to_user_id) return false;
      if (owner !== "all" && owner !== "unassigned" && c.assigned_to_user_id !== owner)
        return false;
      if (destination !== "all" && c.destination !== destination) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      if (needle) {
        const hay = [c.contact?.full_name, c.contact?.email, c.destination]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [cards, q, owner, destination, priority]);

  // KPIs computed from the full board (operational overview, not the filtered subset)
  const kpis = useMemo(() => {
    let active = 0,
      confirmed = 0,
      payment = 0,
      operation = 0,
      urgent = 0;
    for (const c of cards) {
      const s = analyze(c, now);
      if (s.open) active++;
      if (c.status === "booking_confirmed") confirmed++;
      if (c.status === "quote_sent" || c.status === "follow_up") payment++;
      if (c.status === "operations" || c.status === "traveling") operation++;
      if (s.open && (s.urgent || s.overdue)) urgent++;
    }
    return [
      { key: "active", label: t("pipeline.kpiActive"), value: active, icon: Users, color: "#0d9488", highlight: true },
      { key: "confirmed", label: t("pipeline.kpiConfirmed"), value: confirmed, icon: CheckCircle2, color: "#22c55e", highlight: false },
      { key: "payment", label: t("pipeline.kpiPayment"), value: payment, icon: CreditCard, color: "#f59e0b", highlight: false },
      { key: "operation", label: t("pipeline.kpiOperation"), value: operation, icon: Plane, color: "#3b82f6", highlight: false },
      { key: "urgent", label: t("pipeline.kpiUrgent"), value: urgent, icon: AlertTriangle, color: "#ef4444", highlight: false },
    ];
  }, [cards, now, t]);

  const anyFilter =
    q.trim() !== "" || owner !== "all" || destination !== "all" || priority !== "all";
  function clearFilters() {
    setQ("");
    setOwner("all");
    setDestination("all");
    setPriority("all");
  }

  function drop(status: LeadStatus) {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    startTransition(async () => {
      await updateLeadStatus(id, status);
      router.refresh();
    });
  }

  function changeStatus(id: string, next: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatus(id, next);
      router.refresh();
    });
  }
  function changeOwner(id: string, userId: string | null) {
    startTransition(async () => {
      await updateLeadAssignee(id, userId);
      router.refresh();
    });
  }

  const ownerName = (a: BoardCard["assignee"]) =>
    a?.full_name || a?.email || t("pipeline.noConsultant");

  const byStatus = (s: LeadStatus) => filtered.filter((c) => c.status === s);

  /* ---------- lead card ---------- */
  const LeadCardMini = ({ c }: { c: BoardCard }) => {
    const name = c.contact?.full_name || c.contact?.email || "—";
    const color = STATUS_COLORS[c.status];
    const flag = countryFlag(c.contact?.country);
    const s = analyze(c, now);
    const travelers = c.number_of_travelers;
    const lang = c.preferred_language;

    const chip =
      s.proximity === "today"
        ? { text: t("pipeline.today"), color: "#ef4444" }
        : s.proximity === "soon" || s.proximity === "upcoming"
          ? {
              text: t("pipeline.daysLeft", { n: s.days as number }),
              color: s.proximity === "soon" ? "#ef4444" : "#f59e0b",
            }
          : s.proximity === "departed"
            ? { text: t("pipeline.departed"), color: "#0ea5e9" }
            : null;

    return (
      <div
        draggable
        onDragStart={(e) => {
          if ((e.target as HTMLElement).closest("select,button")) {
            e.preventDefault();
            return;
          }
          setDragId(c.id);
        }}
        onDragEnd={() => setDragId(null)}
        className={cn(
          "card group relative overflow-hidden transition duration-150",
          "hover:-translate-y-0.5 hover:shadow-md",
          dragId === c.id && "opacity-50",
          pending && "pointer-events-none",
          s.urgent && "ring-1 ring-danger/30",
        )}
        style={{ borderInlineStartWidth: 3, borderInlineStartColor: color }}
      >
        <Link
          href={`/leads/${c.id}`}
          draggable={false}
          className="block cursor-grab space-y-2.5 p-3 active:cursor-grabbing"
        >
          {/* header: avatar + name + priority */}
          <div className="flex items-start gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-2"
              style={{ backgroundColor: `${color}14`, color, boxShadow: "none", borderColor: color }}
            >
              <span style={{ color }}>{initials(name)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {flag && <span aria-hidden className="text-sm leading-none">{flag}</span>}
                <span className="truncate text-sm font-semibold" dir={contentDir(name)}>
                  {name}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                {lang && (
                  <span className="inline-flex items-center gap-1" dir={contentDir(lang)}>
                    <Globe size={11} />
                    {lang}
                  </span>
                )}
                {travelers != null && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} />
                    {travelers}
                  </span>
                )}
              </div>
            </div>
            {(c.priority === "high" || c.priority === "urgent") && (
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[c.priority] }}
                title={t(`priority.${c.priority}`)}
              />
            )}
          </div>

          {/* trip: destination + travel date + days-left chip */}
          {(c.destination || c.travel_start_date) && (
            <div className="space-y-1 text-[11px]">
              {c.destination && (
                <div className="flex items-center gap-1.5 text-muted">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate font-medium text-foreground" dir={contentDir(c.destination)}>
                    {c.destination}
                  </span>
                </div>
              )}
              {c.travel_start_date && (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <CalendarClock size={11} className="shrink-0" />
                    {fmtDate(c.travel_start_date, locale)}
                  </span>
                  {chip && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${chip.color}1a`, color: chip.color }}
                    >
                      {chip.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* footer: consultant + follow-up flag */}
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted">
              <UserCircle2 size={12} className="shrink-0" />
              <span className="truncate" dir={contentDir(ownerName(c.assignee))}>
                {ownerName(c.assignee)}
              </span>
            </span>
            {s.overdue && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "#f59e0b1a", color: "#f59e0b" }}
                title={t("pipeline.followUpDue")}
              >
                <Clock size={10} />
                {t("pipeline.followUpDue")}
              </span>
            )}
          </div>
        </Link>

        {/* quick actions (outside the link — valid, no nested interactives) */}
        <div
          className="flex items-center gap-1.5 px-3 pb-3"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <select
            value={c.status}
            disabled={pending}
            onChange={(e) => changeStatus(c.id, e.target.value as LeadStatus)}
            aria-label={t("lead.changeStatus")}
            style={{ color, backgroundColor: `${color}14`, borderColor: `${color}55` }}
            className="h-7 min-w-0 flex-1 cursor-pointer truncate rounded-full border px-2 text-[11px] font-semibold outline-none transition focus:ring-2 focus:ring-ring"
          >
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st} className="bg-surface font-medium text-foreground">
                {STATUS_EMOJI[st]} {t(`status.${st}`)}
              </option>
            ))}
          </select>
          <select
            value={c.assigned_to_user_id ?? "unassigned"}
            disabled={pending}
            onChange={(e) =>
              changeOwner(c.id, e.target.value === "unassigned" ? null : e.target.value)
            }
            aria-label={t("lead.changeOwner")}
            className="h-7 w-24 shrink-0 cursor-pointer truncate rounded-full border border-border bg-surface-2/60 px-2 text-[11px] font-medium text-muted outline-none transition focus:ring-2 focus:ring-ring"
          >
            <option value="unassigned">{t("common.unassigned")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  /* ---------- column ---------- */
  const Column = ({ status }: { status: LeadStatus }) => {
    const list = byStatus(status);
    const color = STATUS_COLORS[status];
    const active = overCol === status;
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOverCol(status);
        }}
        onDragLeave={() => setOverCol((cur) => (cur === status ? null : cur))}
        onDrop={() => drop(status)}
        className={cn(
          "flex w-72 shrink-0 flex-col rounded-2xl border transition",
          active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-surface-2/40",
        )}
      >
        <div className="rounded-t-2xl" style={{ height: 3, backgroundColor: color }} />
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold">
            <span aria-hidden>{STATUS_EMOJI[status]}</span>
            <span className="truncate">{t(`status.${status}`)}</span>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            {list.length}
          </span>
        </div>
        <div className="flex min-h-16 flex-1 flex-col gap-2 px-2 pb-2">
          {list.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 py-6 text-[11px] text-muted">
              {t("pipeline.noneInStage")}
            </div>
          ) : (
            list.map((c) => <LeadCardMini key={c.id} c={c} />)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* KPI header — premium, matches Dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.key}
              className={cn(
                "rounded-2xl border p-4 transition",
                k.highlight
                  ? "border-transparent bg-foreground text-white shadow-lg"
                  : "border-border bg-surface shadow-sm hover:shadow-md",
              )}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={
                  k.highlight
                    ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                    : { backgroundColor: `${k.color}1a`, color: k.color }
                }
              >
                <Icon size={18} />
              </span>
              <div className="mt-3 text-3xl font-extrabold leading-none tracking-tight">{k.value}</div>
              <div className={cn("mt-1.5 text-xs font-medium", k.highlight ? "text-white/70" : "text-muted")}>
                {k.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* toolbar — reuse existing filters only */}
      <div className="card flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
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
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            aria-label={t("leads.filterOwner")}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring sm:w-40"
          >
            <option value="all">{t("leads.filterOwner")}: {t("common.all")}</option>
            <option value="unassigned">{t("common.unassigned")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
          {destinations.length > 0 && (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              aria-label={t("pipeline.filterDestination")}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring sm:w-44"
            >
              <option value="all">{t("pipeline.filterDestination")}: {t("common.all")}</option>
              {destinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label={t("pipeline.filterPriority")}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring sm:w-36"
          >
            <option value="all">{t("pipeline.filterPriority")}: {t("common.all")}</option>
            {(["urgent", "high", "normal", "low"] as Priority[]).map((p) => (
              <option key={p} value={p}>{t(`priority.${p}`)}</option>
            ))}
          </select>
          {anyFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={15} />
              {t("leads.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">{t("pipeline.empty")}</div>
      ) : (
        <div className="space-y-4">
          {/* active pipeline */}
          <div>
            <div className="mb-2 flex items-center gap-2 px-0.5">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold">{t("pipeline.activeStages")}</h2>
            </div>
            <div className="board-scroll pb-3">
              <div className="flex gap-3">
                {PIPELINE_STAGES.map((st) => (
                  <Column key={st} status={st} />
                ))}
              </div>
            </div>
          </div>

          {/* waiting & closed */}
          <div>
            <div className="mb-2 flex items-center gap-2 px-0.5">
              <span className="h-4 w-1 rounded-full bg-warning" />
              <h2 className="text-sm font-bold">{t("pipeline.otherStages")}</h2>
            </div>
            <div className="board-scroll pb-3">
              <div className="flex gap-3">
                {SPECIAL_STATUSES.map((st) => (
                  <Column key={st} status={st} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
