import type { SimAction } from "@/app/simulation";
import { ago } from "./format";

export function ActionStream({
  actions,
  onSelect,
}: {
  actions: SimAction[];
  onSelect: (a: SimAction) => void;
}) {
  return (
    <div className="rounded-2xl border bg-surface/50 overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-2 border-b border-border/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
        <div className="col-span-1">Verdict</div>
        <div className="col-span-2">Agent</div>
        <div className="col-span-2">Tool</div>
        <div className="col-span-4">Detail</div>
        <div className="col-span-2">Target</div>
        <div className="col-span-1 text-right">When</div>
      </div>
      <div className="divide-y divide-border/40">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="w-full grid grid-cols-12 items-center px-4 py-2.5 text-left hover:bg-surface-elevated/40 transition-colors group animate-action-in"
          >
            <div className="col-span-1">
              <VerdictPill verdict={a.verdict} />
            </div>
            <div className="col-span-2 text-sm font-medium truncate">{a.agent}</div>
            <div className="col-span-2 font-mono text-xs text-foreground/90 truncate">
              {a.tool}
            </div>
            <div className="col-span-4 font-mono text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
              {a.detail}
            </div>
            <div className="col-span-2 text-xs text-muted-foreground truncate">{a.target}</div>
            <div className="col-span-1 text-right font-mono text-[10px] text-muted-foreground">
              {ago(a.ts)}
            </div>
          </button>
        ))}
        {actions.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No matching events.</div>
        )}
      </div>
    </div>
  );
}

export function VerdictPill({ verdict }: { verdict: SimAction["verdict"] }) {
  const map = {
    ALLOW: { cls: "text-signal border-signal/40 bg-signal/10", icon: "✓", label: "ALLOW" },
    ESCALATE: { cls: "text-warn border-warn/40 bg-warn/10", icon: "⚠", label: "ESC" },
    BLOCK: { cls: "text-block border-block/40 bg-block/10", icon: "✕", label: "BLOCK" },
    PENDING: { cls: "text-warn border-warn/40 bg-warn/10", icon: "⌛", label: "WAIT" },
  } as const;
  const m = map[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${m.cls}`}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
}
