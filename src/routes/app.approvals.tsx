import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useSimulation, type SimAction } from "@/app/simulation";
import { ActionDetailDrawer } from "@/components/app/ActionDetailDrawer";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { toast } from "sonner";

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
    <div className="relative px-6 lg:px-10 py-8 max-w-[1300px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-warn">
            Execution paused · awaiting human
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Approval queue</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          These actions are held mid-flight, waiting on a human decision before reaching
          production. Veto auto-escalates if no decision arrives in time.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-signal mx-auto mb-3" />
          <p className="text-base font-medium">All clear.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nothing pending. Veto is letting safe actions through.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((a) => (
            <ApprovalCard
              key={a.id}
              action={a}
              onApprove={() => {
                approve(a.id);
                toast.success(`Approved · ${a.intent}`);
              }}
              onReject={() => {
                reject(a.id);
                toast.success(`Blocked · ${a.intent}`);
              }}
              onEscalate={() => {
                toast.message(`Escalated to on-call · ${a.intent}`);
              }}
              onInspect={() => setSelected(a)}
            />
          ))}
        </div>
      )}

      <ActionDetailDrawer action={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
