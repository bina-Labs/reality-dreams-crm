"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/i18n/provider";
import { LOCALES } from "@/i18n/config";
import { Eye, EyeOff, ArrowLeft, Loader2, BadgeCheck } from "lucide-react";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

export default function LoginPage() {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- authentication logic (unchanged) ---
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

  // Additive: standard Supabase password-reset (does not touch the sign-in flow).
  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError(t("auth.enterEmailFirst"));
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setInfo(t("auth.resetSent"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.genericError");
      setError(translateError(message, t));
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setInfo(null);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0b10] text-white">
      {/* ambient luxury glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 55% at 50% -5%, rgba(216,189,106,0.12), transparent 60%), radial-gradient(90% 50% at 50% 105%, rgba(41,179,170,0.07), transparent 60%)",
        }}
      />

      {/* language toggle */}
      <div className="absolute top-4 start-4 z-20 flex items-center gap-2 text-xs font-medium">
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`transition ${
              locale === l ? "text-[#d8bd6a]" : "text-white/35 hover:text-white/70"
            }`}
            aria-label={l === "he" ? "עברית" : "English"}
          >
            {l === "he" ? "עב" : "EN"}
          </button>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[400px] flex-col justify-center px-6 py-12">
        {/* logo */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8bd6a]/40 bg-gradient-to-br from-[#2bb6ad] to-[#1c837c] shadow-[0_10px_34px_-8px_rgba(43,182,173,0.55)]">
          <span className="text-2xl leading-none text-[#f2e2a6]" style={serif}>
            RD
          </span>
        </div>

        {/* brand */}
        <h1
          className="bg-gradient-to-b from-[#f6e7ad] to-[#c49a3a] bg-clip-text text-center text-[34px] font-semibold leading-tight tracking-wide text-transparent"
          style={serif}
        >
          Reality Dreams
        </h1>
        <p className="mt-1 text-center text-sm text-white/45">{t("auth.tagline")}</p>

        {/* CRM banner */}
        <div
          dir="ltr"
          className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-[#d8bd6a]/25 bg-white/[0.035] px-4 py-3"
        >
          <div>
            <div className="text-[11px] font-semibold tracking-[0.16em] text-[#d8bd6a]">
              {t("auth.bannerTitle")}
            </div>
            <div className="mt-0.5 text-sm text-white/85">{t("auth.bannerSub")}</div>
          </div>
          <BadgeCheck size={26} className="shrink-0 text-[#d8bd6a]" />
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-end text-sm font-medium text-[#d8bd6a]">
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#d8bd6a]/60 focus:ring-2 focus:ring-[#d8bd6a]/20"
            />
          </div>

          {/* password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-end text-sm font-medium text-[#d8bd6a]">
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pe-4 ps-12 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#d8bd6a]/60 focus:ring-2 focus:ring-[#d8bd6a]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "hide password" : "show password"}
                className="absolute inset-y-0 start-3 flex items-center text-white/40 transition hover:text-[#d8bd6a]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* remember / forgot */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#d8bd6a] transition hover:text-[#f2e2a6] hover:underline"
            >
              {t("auth.forgotPassword")}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-white/65">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#d8bd6a]"
              />
              {t("auth.rememberMe")}
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-[#d8bd6a]/10 px-3 py-2 text-center text-sm text-[#f2e2a6]">
              {info}
            </p>
          )}

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#f5df97] via-[#e3c268] to-[#c49a3a] font-semibold text-[#1a1400] shadow-[0_14px_34px_-12px_rgba(212,175,55,0.6)] transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowLeft size={18} />
            )}
            {mode === "signin" ? t("auth.signin") : t("auth.signup")}
          </button>
        </form>

        {/* switch mode */}
        <div className="mt-7 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/55">
            {mode === "signin" ? t("auth.noAccountQ") : t("auth.hasAccountQ")}
          </p>
          <button
            onClick={toggleMode}
            className="mt-3 inline-flex items-center justify-center rounded-full border border-[#d8bd6a]/50 px-7 py-2 text-sm font-medium text-[#f2e2a6] transition hover:border-[#d8bd6a] hover:bg-[#d8bd6a]/10"
          >
            {mode === "signin" ? t("auth.signupNow") : t("auth.signinNow")}
          </button>
        </div>

        {/* footer */}
        <p className="mt-10 text-center text-[10px] uppercase tracking-[0.14em] text-white/25">
          {t("auth.footer")}
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string, t: (k: string) => string) {
  if (/invalid login credentials/i.test(msg)) return t("auth.invalidCredentials");
  if (/already registered/i.test(msg)) return t("auth.alreadyRegistered");
  if (/password should be at least/i.test(msg)) return t("auth.passwordShort");
  return msg;
}
