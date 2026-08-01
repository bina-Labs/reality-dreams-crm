import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { PendingScreen } from "@/components/pending-screen";
import type { Role } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return <PendingScreen email={user.email ?? null} />;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar role={profile.role as Role} email={user.email ?? null} />
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
