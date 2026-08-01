"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { PIPELINE_STAGES, SPECIAL_STATUSES, STATUS_COLORS, STATUS_EMOJI, PRIORITY_COLORS } from "@/lib/constants";
import { contentDir } from "@/lib/utils";
import { updateLeadStatus } from "../actions";
import type { LeadStatus, Priority } from "@/lib/types";

export type BoardCard = {
  id: string;
  status: LeadStatus;
  priority: Priority;
  number_of_travelers: number | null;
  service_category: string | null;
  created_at: string;
  contact: { full_name: string | null; email: string | null } | null;
};

export function Board({ cards }: { cards: BoardCard[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  const byStatus = (s: LeadStatus) => cards.filter((c) => c.status === s);

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

  const Column = ({ status }: { status: LeadStatus }) => {
    const list = byStatus(status);
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOverCol(status);
        }}
        onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
        onDrop={() => drop(status)}
        className={`flex w-72 shrink-0 flex-col rounded-xl border p-2 transition ${
          overCol === status ? "border-primary bg-primary/5" : "border-border bg-surface-2/40"
        }`}
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <span aria-hidden>{STATUS_EMOJI[status]}</span>
            <span>{t(`status.${status}`)}</span>
          </div>
          <span
            className="rounded-full px-2 text-xs font-medium"
            style={{ backgroundColor: `${STATUS_COLORS[status]}1a`, color: STATUS_COLORS[status] }}
          >
            {list.length}
          </span>
        </div>
        <div className="flex min-h-2 flex-1 flex-col gap-2">
          {list.map((c) => {
            const name = c.contact?.full_name || c.contact?.email || "—";
            return (
              <a
                key={c.id}
                href={`/leads/${c.id}`}
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                className={`card block cursor-grab p-3 active:cursor-grabbing ${
                  dragId === c.id ? "opacity-50" : ""
                } ${pending ? "pointer-events-none" : ""}`}
                style={{ borderInlineStartWidth: 3, borderInlineStartColor: STATUS_COLORS[status] }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium" dir={contentDir(name)}>
                    {name}
                  </span>
                  {c.priority !== "normal" && (
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS[c.priority] }}
                      title={t(`priority.${c.priority}`)}
                    />
                  )}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {c.number_of_travelers ? `${c.number_of_travelers} · ` : ""}
                  {c.service_category || ""}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="board-scroll pb-3">
        <div className="flex gap-3">
          {PIPELINE_STAGES.map((s) => (
            <Column key={s} status={s} />
          ))}
        </div>
      </div>
      <div className="board-scroll pb-3">
        <div className="flex gap-3">
          {SPECIAL_STATUSES.map((s) => (
            <Column key={s} status={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
