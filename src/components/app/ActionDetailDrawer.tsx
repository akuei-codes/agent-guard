import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { SimAction } from "@/app/simulation";
import { VerdictPill } from "./ActionStream";
import { ago } from "./format";
import { useSimulation } from "@/app/simulation";

export function ActionDetailDrawer({
  action,
  onClose,
}: {
  action: SimAction | null;
  onClose: () => void;
}) {
  const { approve, reject } = useSimulation();
  return (
    <Sheet open={!!action} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl bg-surface border-l border-border/60 overflow-y-auto">
        {action && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <VerdictPill verdict={action.verdict} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {action.agent} · {ago(action.ts)} · {action.latencyMs}ms
                </span>
              </div>
              <SheetTitle className="text-xl mt-2">{action.intent}</SheetTitle>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {action.tool} → {action.detail}
              </p>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <Section title="Why it was flagged">
                <ul className="space-y-1.5 text-sm">
                  {action.reasoning.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-signal">›</span>
                      <span className="text-foreground/90">{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Target" value={action.target} />
                <Stat label="Environment" value={action.environment} />
                <Stat label="Risk score" value={`${action.risk}/100`} />
                <Stat label="Confidence" value={`${action.confidence}%`} />
              </div>

              <Section title="Blast radius">
                <p className="text-sm text-foreground/90">{action.blastRadius}</p>
              </Section>

              {action.policyMatches.length > 0 && (
                <Section title="Policy matches">
                  <div className="space-y-2">
                    {action.policyMatches.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-sm flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                        {p.title}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Recommendation">
                <p className="text-sm text-foreground/90">
                  {action.verdict === "BLOCK"
                    ? "Block. The action is irreversible and exceeds the workspace risk envelope."
                    : action.verdict === "ESCALATE" || action.verdict === "PENDING"
                      ? "Hold for human review. Risk profile matches at least one active policy."
                      : "Allow. No active policy matches; risk is within the safe envelope."}
                </p>
              </Section>

              {(action.verdict === "PENDING" || action.verdict === "ESCALATE") && (
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      approve(action.id);
                      onClose();
                    }}
                  >
                    Approve execution
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      reject(action.id);
                      onClose();
                    }}
                  >
                    Block
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated/60 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
