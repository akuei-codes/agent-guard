import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  blurb,
  icon: Icon,
  eta = "In active development",
  capabilities,
}: {
  title: string;
  blurb: string;
  icon: LucideIcon;
  eta?: string;
  capabilities: string[];
}) {
  return (
    <div className="relative px-6 lg:px-10 py-10 max-w-[1200px] mx-auto">
      <div className="mb-8 flex items-center gap-2 text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-ice animate-pulse-dot" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ice">{eta}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-xl p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_22%,transparent),transparent_70%)] blur-2xl" />
        <div className="relative flex items-start gap-5">
          <div className="h-12 w-12 shrink-0 rounded-xl border border-signal/40 bg-gradient-to-br from-signal/[0.20] via-signal/[0.08] to-transparent flex items-center justify-center shadow-[0_0_24px_-6px_color-mix(in_oklab,var(--signal)_60%,transparent)]">
            <Icon className="h-5 w-5 text-signal" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">{blurb}</p>
          </div>
        </div>

        <div className="relative mt-8 grid sm:grid-cols-2 gap-2">
          {capabilities.map((c) => (
            <div
              key={c}
              className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5 text-sm text-muted-foreground"
            >
              <span className="mt-1.5 h-1 w-1 rounded-full bg-signal/80 shrink-0" />
              <span>{c}</span>
            </div>
          ))}
        </div>

        <div className="relative mt-8 flex items-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to mission control
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Shipping next · join the waitlist for early access
          </span>
        </div>
      </div>
    </div>
  );
}
