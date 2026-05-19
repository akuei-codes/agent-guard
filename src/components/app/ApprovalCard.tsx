import { useEffect, useState } from "react";
import { Check, X, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import type { SimAction } from "@/app/simulation";
import { Button } from "@/components/ui/button";
import { ago } from "./format";

const APPROVERS = [
  { initials: "MK", name: "Maya K." },
  { initials: "RD", name: "Rafael D." },
  { initials: "JT", name: "Jin T." },
];

export function ApprovalCard({
  action,
  onApprove,
  onReject,
  onEscalate,
  onInspect,
  ttlMs = 90_000,
}: {
  action: SimAction;
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
  onInspect: () => void;
  ttlMs?: number;
}) {
  const [remaining, setRemaining] = useState(ttlMs);

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const pct = (remaining / ttlMs) * 100;
  const tone =
    action.severity === "critical"
      ? "var(--block)"
      : action.severity === "high"
        ? "var(--warn)"
        : "var(--signal)";

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface/80 via-surface/60 to-background/80 backdrop-blur-sm"
      style={{
        boxShadow: `0 0 0 1px color-mix(in oklab, ${tone} 35%, transparent), 0 40px 80px -40px color-mix(in oklab, ${tone} 50%, transparent)`,
      }}
    >
      {/* Severity edge glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-40"
        style={{
          background: `radial-gradient(ellipse at top right, color-mix(in oklab, ${tone} 25%, transparent), transparent 50%)`,
        }}
      />

      <div className="relative p-6 grid lg:grid-cols-[1fr_auto] gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1.5"
              style={{
                color: tone,
                borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
                background: `color-mix(in oklab, ${tone} 10%, transparent)`,
                border: "1px solid",
              }}
            >
              <AlertTriangle className="h-3 w-3" />
              {action.severity}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {action.agent} · {ago(action.ts)}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/80 ml-auto inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {Math.ceil(remaining / 1000)}s
            </span>
          </div>

          <h3 className="text-xl font-semibold tracking-tight mt-3">{action.intent}</h3>
          <div className="font-mono text-xs text-muted-foreground mt-1.5 truncate">
            <span className="text-foreground/80">{action.tool}</span> · {action.detail}
          </div>

          <div className="mt-5 grid sm:grid-cols-3 gap-2 text-xs">
            <Field label="Target" value={action.target} />
            <Field label="Risk" value={`${action.risk}/100`} tone={tone} />
            <Field label="Blast radius" value={action.blastRadius} />
          </div>

          <div className="mt-4 rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Why Veto paused this
            </div>
            <ul className="space-y-1 text-xs text-foreground/90">
              {action.reasoning.slice(0, 3).map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: tone }} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {APPROVERS.map((a) => (
                <div
                  key={a.initials}
                  title={a.name}
                  className="h-7 w-7 rounded-full border-2 border-background bg-surface-elevated flex items-center justify-center text-[10px] font-semibold text-foreground/80"
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">3 approvers on call</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 lg:min-w-[180px]">
          <Button onClick={onApprove} className="w-full bg-signal hover:bg-signal/90 text-signal-foreground">
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button onClick={onReject} variant="destructive" className="w-full">
            <X className="h-4 w-4" /> Block
          </Button>
          <Button onClick={onEscalate} variant="outline" className="w-full">
            <ArrowUpRight className="h-4 w-4" /> Escalate
          </Button>
          <button onClick={onInspect} className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
            Inspect forensics →
          </button>
        </div>
      </div>

      {/* TTL bar */}
      <div className="h-1 bg-background/60">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: tone, boxShadow: `0 0 8px ${tone}` }}
        />
      </div>
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-background/40 border border-border/50 px-3 py-2">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs truncate" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}
