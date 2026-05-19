import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ArrowRight, Mail, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — Veto" }],
  }),
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState<null | "google" | "github" | "email">(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(null);
    }
  };

  const google = async () => {
    setLoading("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app`,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(null);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  const github = async () => {
    setLoading("github");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) {
      toast.error(
        error.message.includes("provider")
          ? "GitHub provider not enabled. Add a GitHub OAuth app in your Supabase auth settings."
          : error.message,
      );
      setLoading(null);
    }
  };

  return (
    <main className="relative min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left — cinematic interception stage */}
      <CinematicStage />

      {/* Right — auth panel */}
      <section className="relative flex items-center justify-center px-6 py-12 lg:px-12 bg-background">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-[20%] right-[-10%] h-[60vh] w-[60vw] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_16%,transparent),transparent_60%)] blur-[100px]" />

        <div className="relative w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10 text-muted-foreground hover:text-foreground transition-colors">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <span className="font-mono text-xs uppercase tracking-[0.28em]">Veto</span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === "signin" ? "Enter mission control" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin"
              ? "Resume oversight of every autonomous action."
              : "Stand up a workspace and start intercepting agent actions in minutes."}
          </p>

          <div className="mt-8 space-y-2.5">
            <ProviderButton
              loading={loading === "google"}
              disabled={loading !== null}
              onClick={google}
              label="Continue with Google"
              icon={<GoogleIcon />}
            />
            <ProviderButton
              loading={loading === "github"}
              disabled={loading !== null}
              onClick={github}
              label="Continue with GitHub"
              icon={<GitHubIcon />}
            />
            <ProviderButton
              loading={false}
              disabled={loading !== null}
              onClick={() => setShowEmail((s) => !s)}
              label="Continue with email"
              icon={<Mail className="h-4 w-4" />}
            />
          </div>

          {showEmail && (
            <form onSubmit={submitEmail} className="mt-5 space-y-2.5 animate-action-in">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-background/40 backdrop-blur-sm border-border/60"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="h-11 bg-background/40 backdrop-blur-sm border-border/60"
              />
              <Button type="submit" className="w-full h-11" disabled={loading === "email"}>
                {loading === "email" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign in" : "Create account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block mx-auto mt-7 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signin"
              ? "No account? Create one →"
              : "Already have an account? Sign in →"}
          </button>

          <p className="mt-10 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60 text-center">
            SOC 2-ready · workspace-isolated · audit-grade
          </p>
        </div>
      </section>
    </main>
  );
}

function ProviderButton({
  loading,
  disabled,
  onClick,
  label,
  icon,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-surface/40 backdrop-blur-sm hover:bg-surface/70 hover:border-ice/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-ice/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className="text-foreground/90">{label}</span>
    </button>
  );
}

function CinematicStage() {
  // 6 staggered packets traversing the interception path
  const packets = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        delay: i * 1.1,
        verdict: i % 3 === 0 ? "block" : i % 3 === 1 ? "escalate" : "allow",
      })),
    [],
  );

  return (
    <aside className="relative hidden lg:flex overflow-hidden bg-background border-r border-border/40">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_22%,transparent),transparent_64%)] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[60vh] w-[60vw] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--ice)_18%,transparent),transparent_64%)] blur-[100px]" />

      <div className="relative flex-1 flex flex-col px-12 py-14">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-ice mb-3">
          Live interception
        </div>
        <h2 className="text-3xl font-semibold tracking-tight leading-tight max-w-md">
          Every autonomous action passes through Veto before it reaches reality.
        </h2>

        <div className="relative flex-1 mt-12 flex items-center justify-center">
          <svg viewBox="0 0 600 360" className="w-full h-full max-w-2xl">
            <defs>
              <linearGradient id="cs-line" x1="0" x2="1">
                <stop offset="0%" stopColor="var(--ice)" stopOpacity="0" />
                <stop offset="50%" stopColor="var(--ice)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="cs-core" cx="0.5" cy="0.5">
                <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Source nodes (agents) */}
            {[80, 160, 240, 320].map((y, i) => (
              <g key={y}>
                <circle cx="60" cy={y} r="5" fill="var(--ice)" opacity="0.8" />
                <text x="80" y={y + 4} fontFamily="JetBrains Mono" fontSize="10" fill="currentColor" className="text-muted-foreground">
                  {["DevAgent", "FinanceAgent", "CursorAgent", "OpsAgent"][i]}
                </text>
                <line x1="80" y1={y} x2="280" y2="200" stroke="url(#cs-line)" strokeWidth="1" strokeDasharray="3 4" className="animate-flow" />
              </g>
            ))}

            {/* Veto core */}
            <circle cx="300" cy="200" r="80" fill="url(#cs-core)" />
            <circle cx="300" cy="200" r="42" fill="var(--background)" stroke="var(--signal)" strokeWidth="1.5" />
            <circle cx="300" cy="200" r="42" fill="none" stroke="var(--signal)" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" from="42" to="78" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <text x="300" y="195" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="var(--muted-foreground)" letterSpacing="2">
              VETO
            </text>
            <text x="300" y="212" textAnchor="middle" fontSize="18" fill="var(--signal)" fontWeight="700">
              ⌖
            </text>

            {/* Target nodes */}
            {[
              { y: 80, label: "Production DB" },
              { y: 160, label: "Stripe" },
              { y: 240, label: "Kubernetes" },
              { y: 320, label: "Customer mail" },
            ].map((t, i) => (
              <g key={t.y}>
                <line x1="342" y1="200" x2="520" y2={t.y} stroke="url(#cs-line)" strokeWidth="1" strokeDasharray="3 4" className="animate-flow" />
                <circle cx="540" cy={t.y} r="5" fill={i === 0 ? "var(--block)" : i === 1 ? "var(--warn)" : "var(--signal)"} opacity="0.9" />
                <text x="520" y={t.y + 4} textAnchor="end" fontFamily="JetBrains Mono" fontSize="10" fill="currentColor" className="text-muted-foreground">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Animated packets along left-to-veto path */}
            {packets.map((p) => {
              const color =
                p.verdict === "block" ? "var(--block)" : p.verdict === "escalate" ? "var(--warn)" : "var(--signal)";
              return (
                <circle key={p.id} r="3" fill={color}>
                  <animateMotion
                    dur="3.4s"
                    repeatCount="indefinite"
                    begin={`${p.delay}s`}
                    path={`M 60 ${80 + (p.id % 4) * 80} Q 180 ${130 + (p.id % 3) * 40} 280 200`}
                  />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="3.4s" repeatCount="indefinite" begin={`${p.delay}s`} />
                </circle>
              );
            })}
          </svg>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-6 pt-8 border-t border-border/40">
          {[
            { k: "P50 latency", v: "38ms" },
            { k: "Decisions / day", v: "1.2M" },
            { k: "Irreversible blocked", v: "98.4%" },
          ].map((s) => (
            <div key={s.k}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.k}</div>
              <div className="text-xl font-semibold mt-1 text-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11v3.2h5.3c-.2 1.4-1.7 4.1-5.3 4.1-3.2 0-5.8-2.6-5.8-5.9S8.8 6.5 12 6.5c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 4.2 14.6 3.2 12 3.2 7.1 3.2 3.2 7.1 3.2 12s3.9 8.8 8.8 8.8c5.1 0 8.4-3.6 8.4-8.6 0-.6 0-1-.1-1.2H12z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5z" />
    </svg>
  );
}
