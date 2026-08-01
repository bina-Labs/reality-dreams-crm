"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus, Priority } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  return { supabase, user };
}

function revalidateLead(leadId?: string) {
  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/* ---------------- Lead mutations ---------------- */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { supabase } = await requireUser();
  // DB trigger records the status_changed activity automatically.
  const { error } = await supabase
    .from("leads")
    .update({ status, last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidateLead(leadId);
}

export async function updateLeadPriority(leadId: string, priority: Priority) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("leads").update({ priority }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidateLead(leadId);
}

export async function updateLeadAssignee(leadId: string, userId: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ assigned_to_user_id: userId })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "assignment_changed",
    title: "Owner changed",
    metadata: { assigned_to_user_id: userId },
    created_by: user.id,
  });
  revalidateLead(leadId);
}

export async function updateLeadPlanningOwner(leadId: string, userId: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ planning_owner_user_id: userId })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidateLead(leadId);
}

export async function updateLeadFollowUp(leadId: string, nextFollowUpAt: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ next_follow_up_at: nextFollowUpAt })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidateLead(leadId);
}

/* ---------------- Notes ---------------- */
export async function addNote(leadId: string, content: string) {
  const { supabase, user } = await requireUser();
  const trimmed = content.trim();
  if (!trimmed) return;
  const { error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, content: trimmed, created_by: user.id });
  if (error) throw new Error(error.message);
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "note_added",
    title: "Note added",
    created_by: user.id,
  });
  revalidateLead(leadId);
}

/* ---------------- Tasks ---------------- */
export async function addTask(
  leadId: string | null,
  title: string,
  dueAt: string | null,
  assignedTo: string | null,
) {
  const { supabase, user } = await requireUser();
  const trimmed = title.trim();
  if (!trimmed) return;
  const { error } = await supabase.from("tasks").insert({
    lead_id: leadId,
    title: trimmed,
    due_at: dueAt,
    assigned_to: assignedTo,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  if (leadId) {
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "task_created",
      title: "Task created",
      description: trimmed,
      created_by: user.id,
    });
  }
  revalidateLead(leadId ?? undefined);
}

export async function setTaskStatus(
  taskId: string,
  status: "open" | "in_progress" | "completed" | "cancelled",
  leadId?: string | null,
) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  if (status === "completed" && leadId) {
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "task_completed",
      title: "Task completed",
      created_by: user.id,
    });
  }
  revalidateLead(leadId ?? undefined);
}

/* ---------------- Team (admin) ---------------- */
export async function setMemberRole(userId: string, role: "admin" | "agent") {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function setMemberActive(userId: string, isActive: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
