import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Board, type BoardCard } from "./board";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: leadsData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, status, priority, number_of_travelers, service_category, destination, preferred_language, travel_start_date, next_follow_up_at, last_contacted_at, created_at, assigned_to_user_id, contact:contacts(full_name, email, country), assignee:profiles!leads_assigned_to_user_id_fkey(id, full_name, email)",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, last_login_at, created_at")
      .eq("is_active", true),
  ]);

  const cards = (leadsData ?? []) as unknown as BoardCard[];
  const profiles = (profilesData ?? []) as unknown as Profile[];

  return (
    <div className="space-y-5">
      <header className="hidden md:block">
        <h1 className="text-2xl font-extrabold">{t("pipeline.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pipeline.subtitle")}</p>
      </header>
      <Board cards={cards} profiles={profiles} />
    </div>
  );
}
