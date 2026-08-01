import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDetail } from "./lead-detail";
import type { Lead, LeadNote, Task, LeadActivity, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "*, contact:contacts(*), assignee:profiles!leads_assigned_to_user_id_fkey(id, full_name, email)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();

  const [{ data: notes }, { data: tasks }, { data: activities }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("lead_notes")
        .select("*, author:profiles!lead_notes_created_by_fkey(id, full_name, email)")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_activities")
        .select("*, actor:profiles!lead_activities_created_by_fkey(id, full_name, email)")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, last_login_at, created_at")
        .eq("is_active", true),
    ]);

  return (
    <LeadDetail
      lead={lead as unknown as Lead}
      notes={(notes ?? []) as unknown as LeadNote[]}
      tasks={(tasks ?? []) as unknown as Task[]}
      activities={(activities ?? []) as unknown as LeadActivity[]}
      profiles={(profiles ?? []) as unknown as Profile[]}
    />
  );
}
