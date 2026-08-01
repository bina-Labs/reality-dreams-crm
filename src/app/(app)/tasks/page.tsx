import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { TasksView, type TaskRow } from "./tasks-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { t } = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tasks")
    .select(
      "*, lead:leads(id, contact:contacts(full_name, email)), assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)",
    )
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const tasks = (data ?? []) as unknown as TaskRow[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("tasks.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("tasks.subtitle")}</p>
      </header>
      <TasksView tasks={tasks} currentUserId={user?.id ?? null} />
    </div>
  );
}
