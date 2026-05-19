import { useMemo } from "react";
import type { SimAction } from "@/app/simulation";

export function AgentActivityPulse({ actions }: { actions: SimAction[] }) {
  const agents = useMemo(() => {
    const byAgent = new Map<string, { count: number; risk: number; last: number }>();
    for (const a of actions) {
      const prev = byAgent.get(a.agent) ?? { count: 0, risk: 0, last: 0 };
      prev.count += 1;
      prev.risk = Math.max(prev.risk, a.risk);
      prev.last = Math.max(prev.last, a.ts);
      byAgent.set(a.agent, prev);
    }
    return Array.from(byAgent.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [actions]);

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ice">
            Agent pulse
          </div>
          <h3 className="text-sm font-semibold mt-1">Active autonomous workers</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{agents.length} active</span>
      </div>

      <ul className="space-y-2.5">
        {agents.map((a) => {
          const cadence = Math.max(0.4, 2 - a.count * 0.12);
          const tone = a.risk > 80 ? "var(--block)" : a.risk > 50 ? "var(--warn)" : "var(--signal)";
          return (
            <li key={a.name} className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: tone, animation: `pulse-dot ${cadence}s ease-in-out infinite` }}
                />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{a.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {a.count} actions · max risk {a.risk}
                </div>
              </div>
              <div
                className="h-1 w-24 rounded-full overflow-hidden"
                style={{ background: "color-mix(in oklab, var(--foreground) 8%, transparent)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, a.count * 12)}%`, background: tone }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
