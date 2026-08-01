"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/provider";
import { Card, Button, Select, Badge } from "@/components/ui";
import { contentDir } from "@/lib/utils";
import { setMemberRole, setMemberActive } from "../actions";
import type { Profile, Role } from "@/lib/types";

export function Team({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <Card className="p-0">
      <div className="board-scroll">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 text-start font-medium">{t("settings.name")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("settings.role")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("settings.active")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const name = p.full_name || p.email || "—";
              const isSelf = p.id === currentUserId;
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium" dir={contentDir(name)}>
                      {name}
                    </div>
                    <div className="text-xs text-muted" dir="ltr">
                      {p.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={p.role}
                      disabled={pending || isSelf}
                      className="w-32"
                      onChange={(e) => run(() => setMemberRole(p.id, e.target.value as Role))}
                    >
                      <option value="admin">{t("settings.roleAdmin")}</option>
                      <option value="agent">{t("settings.roleAgent")}</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <Badge color="#16a34a">{t("settings.active")}</Badge>
                    ) : (
                      <Badge color="#f59e0b">{t("settings.pendingApproval")}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {!isSelf && (
                      <Button
                        variant={p.is_active ? "outline" : "primary"}
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => setMemberActive(p.id, !p.is_active))}
                      >
                        {p.is_active ? t("settings.deactivate") : t("settings.activate")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
