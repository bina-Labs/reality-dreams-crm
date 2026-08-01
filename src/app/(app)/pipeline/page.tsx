import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Board, type BoardCard } from "./board";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { t } = await getT();
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select(
      "id, status, priority, number_of_travelers, service_category, created_at, contact:contacts(full_name, email)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const cards = (data ?? []) as unknown as BoardCard[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("nav.pipeline")}</h1>
        <p className="mt-1 text-sm text-muted">{t("leads.subtitle")}</p>
      </header>
      <Board cards={cards} />
    </div>
  );
}
