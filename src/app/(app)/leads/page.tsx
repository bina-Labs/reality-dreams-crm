import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { LeadsView, type LeadRow } from "./leads-view";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: leadsData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, status, priority, number_of_travelers, preferred_language, source, service_category, created_at, travel_start_date, assigned_to_user_id, contact:contacts(full_name, email, phone, country), assignee:profiles!leads_assigned_to_user_id_fkey(id, full_name, email)",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, role, is_active, last_login_at, created_at").eq("is_active", true),
  ]);

  const leads = (leadsData ?? []) as unknown as LeadRow[];
  const profiles = (profilesData ?? []) as unknown as Profile[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("leads.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("leads.subtitle")}</p>
      </header>
      <LeadsView leads={leads} profiles={profiles} />
    </div>
  );
}
