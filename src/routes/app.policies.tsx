import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Shield, ShieldOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/app/WorkspaceProvider";
import { useAuth } from "@/app/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/policies")({
  component: PoliciesPage,
});

type Policy = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  severity: string;
  scope: string;
  requires_approval: boolean;
  approvers_required: number;
  enabled: boolean;
  created_at: string;
};

const TEMPLATES = [
  {
    title: "Require approval for production deploys",
    description: "Any rollout/restart against a cluster labelled `production` requires human sign-off.",
    severity: "high",
    requires_approval: true,
  },
  {
    title: "Block deletion of production databases",
    description: "DROP/TRUNCATE/DELETE against production schemas are blocked outright.",
    severity: "critical",
    requires_approval: false,
  },
  {
    title: "Escalate refunds above $1,000",
    description: "Stripe / billing refunds beyond threshold require finance reviewer.",
    severity: "high",
    requires_approval: true,
  },
  {
    title: "Prevent exporting >100 customer records",
    description: "Bulk PII exports get held pending review.",
    severity: "high",
    requires_approval: true,
  },
];

function PoliciesPage() {
  const { current } = useWorkspace();
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high",
    requires_approval: true,
  });

  const load = async () => {
    if (!current) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq("workspace_id", current.id)
      .order("created_at", { ascending: false });
    if (!error && data) setPolicies(data as Policy[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const create = async (preset?: typeof form) => {
    if (!current || !user) return;
    const data = preset ?? form;
    if (!data.title.trim()) return;
    const { error } = await supabase.from("policies").insert({
      workspace_id: current.id,
      created_by: user.id,
      title: data.title,
      description: data.description || null,
      severity: data.severity,
      requires_approval: data.requires_approval,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Policy created");
    setOpen(false);
    setForm({ title: "", description: "", severity: "high", requires_approval: true });
    load();
  };

  const toggle = async (p: Policy) => {
    const { error } = await supabase
      .from("policies")
      .update({ enabled: !p.enabled })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (p: Policy) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("policies").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Policy deleted");
      load();
    }
  };

  return (
    <div className="min-h-screen px-8 py-8 max-w-[1200px] mx-auto">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rules that decide what gets through, what gets escalated, and what gets blocked.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New policy
        </Button>
      </div>

      {policies.length === 0 && !loading && (
        <div className="rounded-2xl border bg-surface/50 p-8 mb-6">
          <h3 className="font-semibold">Start from a template</h3>
          <p className="text-sm text-muted-foreground mt-1">
            These map directly to the most common production-incident patterns.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() =>
                  create({
                    title: t.title,
                    description: t.description,
                    severity: t.severity,
                    requires_approval: t.requires_approval,
                  })
                }
                className="text-left p-4 rounded-xl border border-border hover:border-signal/40 hover:bg-signal/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SeverityChip severity={t.severity} />
                  <span className="font-medium text-sm">{t.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-surface/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
            Loading…
          </div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No custom policies yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {policies.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-start gap-4">
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    p.enabled ? "bg-signal animate-pulse-dot" : "bg-muted-foreground/40"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityChip severity={p.severity} />
                    <h3 className="font-medium">{p.title}</h3>
                    {p.requires_approval && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-warn border border-warn/30 bg-warn/10 px-1.5 py-0.5 rounded">
                        approval required
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.enabled} onCheckedChange={() => toggle(p)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New policy</DialogTitle>
            <DialogDescription>
              Veto evaluates this against every matching agent action before execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Title
              </label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Require approval for prod deploys"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <Textarea
                className="mt-1"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Severity
                </label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  {["low", "medium", "high", "critical"].map((s) => (
                    <option key={s} value={s} className="bg-background">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Requires approval
                </label>
                <div className="mt-2.5 flex items-center gap-2">
                  <Switch
                    checked={form.requires_approval}
                    onCheckedChange={(v) => setForm({ ...form, requires_approval: v })}
                  />
                  <span className="text-sm">{form.requires_approval ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create()}>Create policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeverityChip({ severity }: { severity: string }) {
  const tone =
    severity === "critical"
      ? "text-block border-block/40 bg-block/10"
      : severity === "high"
        ? "text-warn border-warn/40 bg-warn/10"
        : severity === "medium"
          ? "text-foreground/80 border-border bg-surface-elevated"
          : "text-muted-foreground border-border bg-surface-elevated";
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${tone}`}
    >
      {severity}
    </span>
  );
}

// satisfy linter
void Shield;
void ShieldOff;
