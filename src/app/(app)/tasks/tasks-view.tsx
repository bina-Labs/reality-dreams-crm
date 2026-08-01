"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { Card, Button } from "@/components/ui";
import { contentDir, cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import { setTaskStatus } from "../actions";
import type { TaskStatus, Priority } from "@/lib/types";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";

export type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_at: string | null;
  assigned_to: string | null;
  lead: { id: string; contact: { full_name: string | null; email: string | null } | null } | null;
  assignee: { id: string; full_name: string | null; email: string | null } | null;
};

type Filter = "mine" | "all" | "overdue";

export function TasksView({
  tasks,
  currentUserId,
}: {
  tasks: TaskRow[];
  currentUserId: string | null;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [showDone, setShowDone] = useState(false);

  const [now] = useState(() => Date.now());
  const isOverdue = (tk: TaskRow) =>
    tk.status !== "completed" && tk.status !== "cancelled" && tk.due_at
      ? new Date(tk.due_at).getTime() < now
      : false;

  const filtered = useMemo(() => {
    return tasks.filter((tk) => {
      if (!showDone && (tk.status === "completed" || tk.status === "cancelled")) return false;
      if (filter === "mine" && tk.assigned_to !== currentUserId) return false;
      if (filter === "overdue" && !isOverdue(tk)) return false;
      return true;
    });
  }, [tasks, filter, showDone, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  function complete(id: string, leadId?: string | null) {
    startTransition(async () => {
      await setTaskStatus(id, "completed", leadId ?? null);
      router.refresh();
    });
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("tasks.allTasks") },
    { key: "mine", label: t("tasks.mine") },
    { key: "overdue", label: t("tasks.overdue") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-lg bg-surface-2 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                filter === f.key ? "bg-surface shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          {t("tasks.done")}
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">{t("tasks.empty")}</Card>
      ) : (
        <Card className="divide-y divide-border p-0">
          {filtered.map((tk) => {
            const done = tk.status === "completed";
            const overdue = isOverdue(tk);
            const leadName = tk.lead?.contact?.full_name || tk.lead?.contact?.email;
            return (
              <div key={tk.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    disabled={pending || done}
                    onClick={() => complete(tk.id, tk.lead?.id)}
                    className="shrink-0 text-primary disabled:text-muted"
                    aria-label={t("lead.markDone")}
                  >
                    {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="min-w-0">
                    <div
                      className={cn("truncate text-sm font-medium", done && "text-muted line-through")}
                      dir={contentDir(tk.title)}
                    >
                      {tk.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      {tk.due_at && (
                        <span className={cn("inline-flex items-center gap-1", overdue && "text-danger")}>
                          {overdue && <AlertTriangle size={12} />}
                          {fmtDate(tk.due_at, locale)}
                        </span>
                      )}
                      {leadName && tk.lead && (
                        <Link href={`/leads/${tk.lead.id}`} className="text-primary hover:underline" dir={contentDir(leadName)}>
                          {leadName}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {!done && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => complete(tk.id, tk.lead?.id)}
                  >
                    {t("lead.markDone")}
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
