"use client";

import { Badge } from "./ui";
import { useT } from "@/i18n/provider";
import { STATUS_COLORS, STATUS_EMOJI, PRIORITY_COLORS } from "@/lib/constants";
import type { LeadStatus, Priority } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const t = useT();
  return (
    <Badge color={STATUS_COLORS[status]}>
      <span aria-hidden>{STATUS_EMOJI[status]}</span>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useT();
  if (priority === "normal") return null;
  return <Badge color={PRIORITY_COLORS[priority]}>{t(`priority.${priority}`)}</Badge>;
}
