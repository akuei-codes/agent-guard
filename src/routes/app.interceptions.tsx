import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useSimulation, type SimAction, type Verdict } from "@/app/simulation";
import { ActionStream } from "@/components/app/ActionStream";
import { ActionDetailDrawer } from "@/components/app/ActionDetailDrawer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/interceptions")({
  component: InterceptionsPage,
});

const FILTERS: { label: string; value: Verdict | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Allowed", value: "ALLOW" },
  { label: "Escalated", value: "ESCALATE" },
  { label: "Blocked", value: "BLOCK" },
  { label: "Pending", value: "PENDING" },
];

function InterceptionsPage() {
  const { actions, paused, setPaused } = useSimulation();
  const [filter, setFilter] = useState<Verdict | "ALL">("ALL");
  const [selected, setSelected] = useState<SimAction | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? actions : actions.filter((a) => a.verdict === filter)),
    [actions, filter],
  );

  return (
    <div className="min-h-screen px-8 py-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-6 gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
              Active defense
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Live interceptions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every agent → execution pair. Filter by verdict, click to inspect.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaused(!paused)}
          className="font-mono text-xs"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" /> Pause stream
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-surface-elevated/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {filtered.length} events
        </span>
      </div>

      <ActionStream actions={filtered} onSelect={setSelected} />
      <ActionDetailDrawer action={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
