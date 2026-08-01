"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { Card, Input, Select } from "@/components/ui";
import { PriorityBadge } from "@/components/badges";
import { ALL_STATUSES } from "@/lib/constants";
import { contentDir } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import { updateLeadStatus } from "../actions";
import type { LeadStatus, Priority, Profile } from "@/lib/types";
import { Search, ChevronLeft } from "lucide-react";

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

  function changeStatus(id: string, next: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatus(id, next);
      router.refresh();
    });
  }

  const ownerName = (p: LeadRow["assignee"]) =>
    p?.full_name || p?.email || t("common.unassigned");

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-muted"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("common.search")}
            className="ps-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-48">
          <option value="all">{t("leads.filterStatus")}: {t("common.all")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="md:w-44">
          <option value="all">{t("leads.filterOwner")}: {t("common.all")}</option>
          <option value="unassigned">{t("common.unassigned")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </Select>
        {sources.length > 1 && (
          <Select value={source} onChange={(e) => setSource(e.target.value)} className="md:w-40">
            <option value="all">{t("leads.filterSource")}: {t("common.all")}</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
      </Card>

      <p className="text-xs text-muted">{t("leads.count", { n: filtered.length })}</p>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">{t("leads.empty")}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="board-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted">
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
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                      <Td>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={l.priority} />
                          <div className="min-w-0">
                            <div className="truncate font-medium" dir={contentDir(name)}>
                              {name}
                            </div>
                            {l.contact?.email && (
                              <div className="truncate text-xs text-muted" dir="ltr">
                                {l.contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="text-xs text-muted">
                          {l.number_of_travelers ? `${l.number_of_travelers} · ` : ""}
                          {l.service_category || "—"}
                        </div>
                        {l.travel_start_date && (
                          <div className="text-xs text-muted">{fmtDate(l.travel_start_date, locale)}</div>
                        )}
                      </Td>
                      <Td>
                        <span dir={contentDir(l.preferred_language)}>{l.preferred_language || "—"}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-muted">{ownerName(l.assignee)}</span>
                      </Td>
                      <Td>
                        <select
                          value={l.status}
                          disabled={pending}
                          onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className="max-w-[170px] rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t(`status.${s}`)}
                            </option>
                          ))}
                        </select>
                      </Td>
                      <Td>
                        <span className="whitespace-nowrap text-xs text-muted">
                          {fmtDate(l.created_at, locale)}
                        </span>
                      </Td>
                      <Td>
                        <Link
                          href={`/leads/${l.id}`}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"
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
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
