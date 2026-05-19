import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSimulation, type SimAction } from "@/app/simulation";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { InterceptionVisualizer } from "@/components/app/InterceptionVisualizer";
import { ActionStream } from "@/components/app/ActionStream";
import { ActionDetailDrawer } from "@/components/app/ActionDetailDrawer";
import { StatCard } from "@/components/app/StatCard";
import { RiskHeatmap } from "@/components/app/RiskHeatmap";
import { SystemPressureGauge } from "@/components/app/SystemPressureGauge";
import { AgentActivityPulse } from "@/components/app/AgentActivityPulse";
import { IncidentTimeline } from "@/components/app/IncidentTimeline";
import { ArrowRight, CheckSquare } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { actions, counts } = useSimulation();
  const { current } = useWorkspace();
  const [selected, setSelected] = useState<SimAction | null>(null);

  const pressure = useMemo(() => {
    const recent = actions.slice(0, 12);
    if (!recent.length) return 0;
    const avg = recent.reduce((s, a) => s + a.risk, 0) / recent.length;
    return Math.min(100, avg + Math.min(recent.length * 2, 20));
  }, [actions]);

  const pending = useMemo(
    () => actions.filter((a) => a.verdict === "PENDING" || a.verdict === "ESCALATE"),
    [actions],
  );

  return (
    <div className="relative px-6 lg:px-10 py-8 max-w-[1600px] mx-auto space-y-6">
      {/* Hero header */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-signal">
              Live · {current?.name}
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mt-2 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Mission control
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Every agent action passes through Veto before it touches reality. What you see below
            is happening pre-execution, in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/approvals"
            className="group inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] text-warn hover:bg-warn/15 transition-colors"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {pending.length} pending review
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Allowed" value={counts.allowed} tone="signal" sub="last 24h" />
        <StatCard label="Escalated" value={counts.escalated} tone="warn" sub="awaiting review" />
        <StatCard label="Blocked" value={counts.blocked} tone="block" sub="irreversible prevented" />
        <StatCard label="Median envelope" value="38ms" tone="muted" sub="P50 decision latency" />
      </div>

      {/* Command console — interception viz, gauge, pulse */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-b from-signal/[0.10] via-transparent to-ice/[0.08] blur-2xl" />
          <div className="relative">
            <InterceptionVisualizer actions={actions.slice(0, 5)} />
          </div>
        </div>
        <div className="grid gap-4 content-start">
          <SystemPressureGauge target={pressure} />
          <AgentActivityPulse actions={actions} />
        </div>
      </div>

      {/* Heatmap + incidents */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <RiskHeatmap />
        <IncidentTimeline actions={actions} />
      </div>

      {/* Recent stream */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight uppercase font-mono text-muted-foreground">
            Recent decisions
          </h2>
          <Link
            to="/app/interceptions"
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Live stream <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ActionStream actions={actions.slice(0, 14)} onSelect={setSelected} />
      </div>

      <ActionDetailDrawer action={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
