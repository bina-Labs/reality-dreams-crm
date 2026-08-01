"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useT } from "@/i18n/provider";
import { Waves, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo(t("auth.confirmEmail"));
          setMode("signin");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.genericError");
      setError(translateError(message, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>
      <Card className="w-full max-w-sm p-7">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-fg">
            <Waves size={24} />
          </div>
          <h1 className="text-xl font-extrabold">Reality Dreams</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin" ? t("auth.signinCta") : t("auth.signupCta")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          {info && (
            <p className="rounded-lg bg-info/10 px-3 py-2 text-sm text-info">{info}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? t("auth.signin") : t("auth.signup")}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="mt-5 w-full text-center text-sm text-muted hover:text-foreground"
        >
          {mode === "signin" ? t("auth.noAccount") : t("auth.hasAccount")}
        </button>
      </Card>
    </div>
  );
}

function translateError(msg: string, t: (k: string) => string) {
  if (/invalid login credentials/i.test(msg)) return t("auth.invalidCredentials");
  if (/already registered/i.test(msg)) return t("auth.alreadyRegistered");
  if (/password should be at least/i.test(msg)) return t("auth.passwordShort");
  return msg;
}
