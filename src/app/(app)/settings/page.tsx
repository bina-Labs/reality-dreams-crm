import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui";
import { Team } from "./team";
import type { Profile } from "@/lib/types";
import { Webhook } from "lucide-react";

export const dynamic = "force-dynamic";

const INTAKE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/form-intake`;

export default async function SettingsPage() {
  const { t } = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  if (me?.role !== "admin") {
    return (
      <Card className="p-10 text-center text-sm text-muted">{t("settings.onlyAdmin")}</Card>
    );
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, last_login_at, created_at")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as unknown as Profile[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("settings.title")}</h1>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">{t("settings.team")}</h2>
          <p className="text-sm text-muted">{t("settings.teamSubtitle")}</p>
        </div>
        <Team profiles={profiles} currentUserId={user!.id} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Webhook size={18} className="text-primary" />
          <h2 className="text-lg font-bold">{t("settings.intakeTitle")}</h2>
        </div>
        <Card className="space-y-3 p-5 text-sm">
          <p className="text-muted">{t("settings.intakeBody")}</p>
          <div>
            <div className="mb-1 text-xs text-muted">Webhook URL</div>
            <code className="block overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs" dir="ltr">
              POST {INTAKE_URL}
            </code>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Header</div>
            <code className="block rounded-lg bg-surface-2 p-3 text-xs" dir="ltr">
              x-intake-secret: ••••••••
            </code>
          </div>
        </Card>
      </section>
    </div>
  );
}
