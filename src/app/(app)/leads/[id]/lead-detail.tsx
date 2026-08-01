"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { Card, Button, Select, Textarea, Input } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { ALL_STATUSES, PRIORITIES, STATUS_EMOJI } from "@/lib/constants";
import { contentDir } from "@/lib/utils";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import {
  updateLeadStatus,
  updateLeadPriority,
  updateLeadAssignee,
  updateLeadPlanningOwner,
  updateLeadFollowUp,
  addNote,
  addTask,
  setTaskStatus,
} from "../../actions";
import type { Lead, LeadNote, Task, LeadActivity, Profile, LeadStatus, Priority } from "@/lib/types";
import {
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react";

type Tab = "brief" | "raw" | "notes" | "tasks" | "timeline";

export function LeadDetail({
  lead,
  notes,
  tasks,
  activities,
  profiles,
}: {
  lead: Lead;
  notes: LeadNote[];
  tasks: Task[];
  activities: LeadActivity[];
  profiles: Profile[];
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("brief");

  const contactName = lead.contact?.full_name || lead.contact?.email || "—";
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const ownerLabel = (p?: Profile | null) => p?.full_name || p?.email || "";

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "brief", label: t("lead.tripBrief") },
    { key: "raw", label: t("lead.rawPayload") },
    { key: "notes", label: t("lead.notes"), badge: notes.length },
    { key: "tasks", label: t("lead.tasks"), badge: tasks.length },
    { key: "timeline", label: t("lead.timeline"), badge: activities.length },
  ];

  return (
    <div className="space-y-5">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowRight size={16} className="ltr:rotate-180" />
        {t("nav.leads")}
      </Link>

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" dir={contentDir(contactName)}>
            {contactName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <span className="text-xs text-muted">{fmtDate(lead.created_at, locale)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* main */}
        <div className="space-y-5 lg:col-span-2">
          {/* controls */}
          <Card className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label={t("lead.changeStatus")}>
              <Select
                value={lead.status}
                disabled={pending}
                onChange={(e) => run(() => updateLeadStatus(lead.id, e.target.value as LeadStatus))}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_EMOJI[s]} {t(`status.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("lead.changePriority")}>
              <Select
                value={lead.priority}
                disabled={pending}
                onChange={(e) => run(() => updateLeadPriority(lead.id, e.target.value as Priority))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("lead.changeOwner")}>
              <Select
                value={lead.assigned_to_user_id ?? ""}
                disabled={pending}
                onChange={(e) => run(() => updateLeadAssignee(lead.id, e.target.value || null))}
              >
                <option value="">{t("common.unassigned")}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {ownerLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("lead.planningOwner")}>
              <Select
                value={lead.planning_owner_user_id ?? ""}
                disabled={pending}
                onChange={(e) => run(() => updateLeadPlanningOwner(lead.id, e.target.value || null))}
              >
                <option value="">{t("common.unassigned")}</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {ownerLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("lead.nextFollowUp")}>
              <FollowUpEditor
                value={lead.next_follow_up_at}
                disabled={pending}
                onSave={(v) => run(() => updateLeadFollowUp(lead.id, v))}
              />
            </Field>
          </Card>

          {/* tabs */}
          <Card className="p-0">
            <div className="board-scroll flex gap-1 border-b border-border p-2">
              {tabs.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === tb.key ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2"
                  }`}
                >
                  {tb.label}
                  {tb.badge ? (
                    <span
                      className={`rounded-full px-1.5 text-xs ${
                        tab === tb.key ? "bg-white/20" : "bg-surface-2"
                      }`}
                    >
                      {tb.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "brief" && <BriefTab lead={lead} />}
              {tab === "raw" && <RawTab lead={lead} />}
              {tab === "notes" && (
                <NotesTab
                  notes={notes}
                  pending={pending}
                  onAdd={(c) => run(() => addNote(lead.id, c))}
                />
              )}
              {tab === "tasks" && (
                <TasksTab
                  tasks={tasks}
                  profiles={profiles}
                  pending={pending}
                  onAdd={(title, due, who) => run(() => addTask(lead.id, title, due, who))}
                  onComplete={(taskId) => run(() => setTaskStatus(taskId, "completed", lead.id))}
                />
              )}
              {tab === "timeline" && <TimelineTab activities={activities} />}
            </div>
          </Card>
        </div>

        {/* sidebar: contact */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-muted">{t("lead.contactInfo")}</h2>
            <div className="space-y-3 text-sm">
              <ContactLine icon={<Mail size={15} />} value={lead.contact?.email} href={lead.contact?.email ? `mailto:${lead.contact.email}` : undefined} ltr />
              <ContactLine icon={<Phone size={15} />} value={lead.contact?.phone} href={lead.contact?.phone ? `tel:${lead.contact.phone}` : undefined} ltr />
              <ContactLine icon={<MessageCircle size={15} />} value={lead.contact?.whatsapp_phone} ltr />
              <ContactLine icon={<Globe size={15} />} value={lead.contact?.country} />
              <ContactLine icon={<Globe size={15} />} value={lead.preferred_language} label={t("leads.language")} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */
function BriefTab({ lead }: { lead: Lead }) {
  const { t } = useLocale();
  const rows: [string, React.ReactNode][] = [
    [t("lead.numberOfTravelers"), lead.number_of_travelers ?? "—"],
    [t("lead.partyType"), lead.party_type || "—"],
    [t("lead.ageRange"), lead.age_range || "—"],
    [t("lead.startDate"), lead.travel_start_date || "—"],
    [t("lead.flexibility"), lead.date_flexibility || "—"],
    [t("lead.nights"), lead.program_length_nights ?? "—"],
    [t("lead.serviceCategory"), lead.service_category || "—"],
    [t("lead.boatLevel"), lead.boat_level || "—"],
    [t("lead.accommodationLevel"), lead.accommodation_level || "—"],
    [t("lead.programType"), lead.program_type?.length ? lead.program_type.join(", ") : "—"],
  ];
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-medium" dir={contentDir(String(value))}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {lead.message && (
        <div>
          <div className="mb-1 text-xs text-muted">{t("lead.message")}</div>
          <p className="rounded-lg bg-surface-2 p-3 text-sm" dir={contentDir(lead.message)}>
            {lead.message}
          </p>
        </div>
      )}
    </div>
  );
}

function RawTab({ lead }: { lead: Lead }) {
  const payload = lead.raw_payload ?? lead.inquiry_details ?? {};
  return (
    <pre
      dir="ltr"
      className="max-h-[420px] overflow-auto rounded-lg bg-surface-2 p-4 text-xs leading-relaxed"
    >
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

function NotesTab({
  notes,
  pending,
  onAdd,
}: {
  notes: LeadNote[];
  pending: boolean;
  onAdd: (content: string) => void;
}) {
  const { t, locale } = useLocale();
  const [value, setValue] = useState("");
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("lead.notePlaceholder")}
        />
        <Button
          size="sm"
          disabled={pending || !value.trim()}
          onClick={() => {
            onAdd(value);
            setValue("");
          }}
        >
          {t("lead.addNote")}
        </Button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted">{t("lead.noNotes")}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border p-3">
              <p className="whitespace-pre-wrap text-sm" dir={contentDir(n.content)}>
                {n.content}
              </p>
              <div className="mt-2 text-xs text-muted">
                {(n.author?.full_name || n.author?.email || "—") + " · " + fmtRelative(n.created_at, locale)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TasksTab({
  tasks,
  profiles,
  pending,
  onAdd,
  onComplete,
}: {
  tasks: Task[];
  profiles: Profile[];
  pending: boolean;
  onAdd: (title: string, due: string | null, who: string | null) => void;
  onComplete: (taskId: string) => void;
}) {
  const { t, locale } = useLocale();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [who, setWho] = useState("");
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("lead.taskTitlePlaceholder")}
        />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" />
        <Select value={who} onChange={(e) => setWho(e.target.value)} className="sm:w-40">
          <option value="">{t("common.unassigned")}</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          disabled={pending || !title.trim()}
          onClick={() => {
            onAdd(title, due ? new Date(due).toISOString() : null, who || null);
            setTitle("");
            setDue("");
            setWho("");
          }}
        >
          {t("lead.addTask")}
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">{t("lead.noTasks")}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((tk) => {
            const done = tk.status === "completed";
            return (
              <li
                key={tk.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <button
                    disabled={pending || done}
                    onClick={() => onComplete(tk.id)}
                    className="text-primary disabled:text-muted"
                    aria-label={t("lead.markDone")}
                  >
                    {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <div>
                    <div className={`text-sm font-medium ${done ? "text-muted line-through" : ""}`} dir={contentDir(tk.title)}>
                      {tk.title}
                    </div>
                    {tk.due_at && (
                      <div className="text-xs text-muted">
                        {t("lead.dueDate")}: {fmtDate(tk.due_at, locale)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted">{t(`taskStatus.${tk.status}`)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TimelineTab({ activities }: { activities: LeadActivity[] }) {
  const { t, locale } = useLocale();
  if (activities.length === 0)
    return <p className="text-sm text-muted">{t("lead.noActivity")}</p>;
  return (
    <ul className="space-y-4">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <div className="text-sm font-medium">{t(`activity.${a.activity_type}`)}</div>
            {a.description && (
              <div className="text-xs text-muted" dir={contentDir(a.description)}>
                {a.description}
              </div>
            )}
            <div className="text-xs text-muted">
              {(a.actor?.full_name || a.actor?.email || (a.actor_type === "automation" ? "🤖" : "")) +
                " · " +
                fmtDateTime(a.created_at, locale)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- small helpers ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function FollowUpEditor({
  value,
  disabled,
  onSave,
}: {
  value: string | null;
  disabled: boolean;
  onSave: (v: string | null) => void;
}) {
  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };
  const [v, setV] = useState(toLocalInput(value));
  return (
    <div className="flex gap-2">
      <Input
        type="datetime-local"
        value={v}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onSave(v ? new Date(v).toISOString() : null)}
      >
        <ChevronDown size={14} />
      </Button>
    </div>
  );
}

function ContactLine({
  icon,
  value,
  href,
  label,
  ltr,
}: {
  icon: React.ReactNode;
  value: string | null | undefined;
  href?: string;
  label?: string;
  ltr?: boolean;
}) {
  if (!value) return null;
  const content = (
    <span className="truncate" dir={ltr ? "ltr" : contentDir(value)}>
      {value}
    </span>
  );
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted">{icon}</span>
      {label && <span className="text-xs text-muted">{label}:</span>}
      {href ? (
        <a href={href} className="truncate text-primary hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
