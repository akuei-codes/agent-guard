import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { useSimulation, type SimAction } from "@/app/simulation";
import { Button } from "@/components/ui/button";
import { ActionDetailDrawer } from "@/components/app/ActionDetailDrawer";
import { ago } from "@/components/app/format";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { actions, approve, reject } = useSimulation();
  const pending = useMemo(
    () => actions.filter((a) => a.verdict === "PENDING" || a.verdict === "ESCALATE"),
    [actions],
  );
  const [selected, setSelected] = useState<SimAction | null>(null);

  return (
    <div className="min-h-screen px-8 py-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-warn">
            Execution paused
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Approval queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          These actions are held mid-flight, waiting on a human decision before reaching production.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border bg-surface/50 p-12 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Nothing pending. Veto is letting safe actions through.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <PendingCard
              key={a.id}
              action={a}
              onApprove={() => approve(a.id)}
              onReject={() => reject(a.id)}
              onInspect={() => setSelected(a)}
            />
          ))}
        </div>
      )}

      <ActionDetailDrawer action={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PendingCard({
  action,
  onApprove,
  onReject,
  onInspect,
}: {
  action: SimAction;
  onApprove: () => void;
  onReject: () => void;
  onInspect: () => void;
}) {
  const tone =
    action.severity === "critical"
      ? "border-block/40 bg-block/5"
      : action.severity === "high"
        ? "border-warn/40 bg-warn/5"
        : "border-border bg-surface/50";
  return (
    <div className={`rounded-2xl border ${tone} p-5`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-warn border border-warn/30 bg-warn/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {action.verdict === "PENDING" ? "Awaiting approval" : "Escalated"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {action.agent} · {ago(action.ts)}
            </span>
          </div>
          <h3 className="text-base font-semibold mt-2">{action.intent}</h3>
          <div className="font-mono text-xs text-muted-foreground mt-1 truncate">
            {action.tool} · {action.detail}
          </div>
          <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
            <Field label="Target" value={action.target} />
            <Field label="Risk" value={`${action.risk}/100`} />
            <Field label="Blast radius" value={action.blastRadius} />
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" onClick={onApprove}>
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject}>
            <X className="h-4 w-4" /> Block
          </Button>
          <Button size="sm" variant="ghost" onClick={onInspect}>
            Inspect
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-elevated/60 border border-border/50 px-2.5 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xs truncate">{value}</div>
    </div>
  );
}
