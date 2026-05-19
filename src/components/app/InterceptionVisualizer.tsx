import type { SimAction } from "@/app/simulation";
import { VerdictPill } from "./ActionStream";

/**
 * Cinematic agent → veto → target flow. Mounts a rolling stream of in-flight
 * actions whose path color reflects the verdict.
 */
export function InterceptionVisualizer({ actions }: { actions: SimAction[] }) {
  return (
    <div className="relative rounded-2xl border bg-surface/60 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0 hero-grid-mini opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-border/60 bg-surface-elevated/40">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal animate-pulse-dot" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
            Interception plane · live
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          decision envelope &lt; 50ms
        </span>
      </div>

      <div className="relative grid grid-cols-12 min-h-[440px]">
        {/* Agents column */}
        <div className="col-span-3 lg:col-span-2 border-r border-border/60 px-3 py-6 flex flex-col items-stretch justify-center gap-2 bg-surface/40">
          {["DevAgent", "FinanceAgent", "CursorAgent", "OpsAgent"].map((a) => (
            <div
              key={a}
              className="rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-center"
            >
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                Agent
              </div>
              <div className="text-xs font-semibold mt-0.5">{a}</div>
            </div>
          ))}
        </div>

        {/* Center: shield + flow */}
        <div className="col-span-6 lg:col-span-7 relative px-4 py-6">
          {/* Background flow lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="iv-flow" x1="0" x2="1">
                <stop offset="0%" stopColor="var(--signal)" stopOpacity="0" />
                <stop offset="50%" stopColor="var(--signal)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[16, 30, 44, 58, 72, 86].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="url(#iv-flow)"
                strokeWidth="0.25"
                strokeDasharray="2 3"
                className="animate-flow"
              />
            ))}
          </svg>

          {/* Veto core */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-signal/25 blur-3xl animate-pulse-dot" />
              <div className="relative h-28 w-28 rounded-full border-2 border-signal bg-surface-elevated flex items-center justify-center glow-signal">
                <div className="text-center">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                    VETO
                  </div>
                  <div className="text-signal text-2xl font-bold leading-none mt-0.5">⌖</div>
                  <div className="font-mono text-[9px] text-signal mt-1">decision plane</div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border border-signal/40 animate-scan-ring" />
              <div
                className="absolute inset-0 rounded-full border border-signal/30 animate-scan-ring"
                style={{ animationDelay: "0.6s" }}
              />
              <div
                className="absolute inset-0 rounded-full border border-signal/20 animate-scan-ring"
                style={{ animationDelay: "1.2s" }}
              />
            </div>
          </div>

          {/* Streaming action rows */}
          <div className="relative z-20 h-full flex flex-col gap-2 justify-center">
            {actions.map((a, i) => (
              <FlowRow key={a.id} action={a} index={i} />
            ))}
          </div>
        </div>

        {/* Targets column */}
        <div className="col-span-3 lg:col-span-3 border-l border-border/60 px-3 py-6 flex flex-col justify-center gap-2 bg-surface/40">
          {[
            "Production DB",
            "AWS / IAM",
            "Stripe",
            "Kubernetes",
            "GitHub",
            "Customer data",
          ].map((t) => (
            <div
              key={t}
              className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-center"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-5 py-3 border-t border-border/60 bg-surface-elevated/40 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground font-mono">
          Production systems never see what Veto blocks
        </span>
        <span className="font-mono text-signal">P50 38ms · P95 47ms</span>
      </div>
    </div>
  );
}

function FlowRow({ action, index }: { action: SimAction; index: number }) {
  const tone =
    action.verdict === "ALLOW"
      ? "text-signal border-signal/40 bg-signal/5"
      : action.verdict === "ESCALATE" || action.verdict === "PENDING"
        ? "text-warn border-warn/40 bg-warn/5"
        : "text-block border-block/40 bg-block/5";
  const opacity = Math.max(0.4, 1 - index * 0.13);
  return (
    <div className="animate-action-in" style={{ opacity }}>
      <div
        className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm ${tone}`}
      >
        <VerdictPill verdict={action.verdict} />
        <span className="text-foreground/90 shrink-0">{action.tool}</span>
        <span className="text-muted-foreground truncate hidden sm:inline">
          {action.detail}
        </span>
        <span className="ml-auto text-[10px] tabular-nums opacity-70 shrink-0">
          risk {action.risk}
        </span>
      </div>
    </div>
  );
}
