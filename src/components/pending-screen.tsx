"use client";

import { Card, Button } from "./ui";
import { LocaleSwitcher } from "./locale-switcher";
import { useT } from "@/i18n/provider";
import { Clock } from "lucide-react";

export function PendingScreen({ email }: { email: string | null }) {
  const t = useT();
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
          <Clock size={28} />
        </div>
        <h1 className="text-xl font-extrabold">{t("pending.title")}</h1>
        <p className="mt-3 text-sm text-muted">{t("pending.body")}</p>
        {email && (
          <p className="mt-4 text-xs text-muted" dir="ltr">
            {t("pending.signedInAs")} {email}
          </p>
        )}
        <form action="/auth/signout" method="post" className="mt-6">
          <Button variant="outline" className="w-full">
            {t("nav.signout")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
