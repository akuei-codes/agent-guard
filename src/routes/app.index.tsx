import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSimulation, type SimAction } from "@/app/simulation";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { InterceptionVisualizer } from "@/components/app/InterceptionVisualizer";
import { ActionStream } from "@/components/app/ActionStream";
import { ActionDetailDrawer } from "@/components/app/ActionDetailDrawer";
import { StatCard } from "@/components/app/StatCard";

export const Route = createFileRoute("/app/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { actions, counts } = useSimulation();
  const { current } = useWorkspace();
  const [selected, setSelected] = useState<SimAction | null>(null);

  return (
    <div className="min-h-screen px-8 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
              Live · {current?.name}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Mission control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every agent action passes through Veto. What you see below is happening before execution.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Allowed" value={counts.allowed} tone="signal" sub="last 24h" />
        <StatCard label="Escalated" value={counts.escalated} tone="warn" sub="awaiting review" />
        <StatCard label="Blocked" value={counts.blocked} tone="block" sub="irreversible prevented" />
        <StatCard label="Median envelope" value="38ms" tone="muted" sub="P50 decision latency" />
      </div>

      {/* Interception viz */}
      <InterceptionVisualizer actions={actions.slice(0, 5)} />

      {/* Recent stream */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight uppercase font-mono text-muted-foreground">
            Recent decisions
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">click any row to inspect</span>
        </div>
        <ActionStream actions={actions.slice(0, 14)} onSelect={setSelected} />
      </div>

      <ActionDetailDrawer action={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
