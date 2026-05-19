import { useMemo } from "react";
import type { SimAction } from "@/app/simulation";
import { ago } from "./format";

/**
 * Lightweight incident preview — derives "incidents" from blocked/critical actions.
 */
export function IncidentTimeline({ actions }: { actions: SimAction[] }) {
  const incidents = useMemo(
    () =>
      actions
        .filter((a) => a.verdict === "BLOCK" || a.severity === "critical")
        .slice(0, 5),
    [actions],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-block">
            Incident timeline
          </div>
          <h3 className="text-sm font-semibold mt-1">Recent prevented events</h3>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">last 1h</span>
      </div>

      {incidents.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">
          No incidents prevented in this window.
        </div>
      ) : (
        <ol className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border/60">
          {incidents.map((a) => (
            <li key={a.id} className="relative">
              <span
                className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background"
                style={{
                  background: a.verdict === "BLOCK" ? "var(--block)" : "var(--warn)",
                  boxShadow: `0 0 12px color-mix(in oklab, ${a.verdict === "BLOCK" ? "var(--block)" : "var(--warn)"} 70%, transparent)`,
                }}
              />
              <div className="text-sm font-medium truncate">{a.intent}</div>
              <div className="font-mono text-[10px] text-muted-foreground truncate">
                {a.agent} · {a.target} · {ago(a.ts)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
