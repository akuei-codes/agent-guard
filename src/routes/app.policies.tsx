import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { POLICY_TEMPLATES, PolicyTemplateGrid, type PolicyTemplate } from "@/components/app/PolicyTemplates";

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

  const insertPolicy = async (data: {
    title: string;
    description: string;
    severity: string;
    requires_approval: boolean;
  }) => {
    if (!current || !user) return;
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

  const pickTemplate = (t: PolicyTemplate) => {
    insertPolicy({
      title: t.title,
      description: t.description,
      severity: t.severity,
      requires_approval: t.requires_approval,
    });
  };

  const toggle = async (p: Policy) => {
    const { error } = await supabase.from("policies").update({ enabled: !p.enabled }).eq("id", p.id);
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
    <div className="relative px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-ice animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ice">
              Security perimeter
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Rules that decide what gets through, what gets escalated, and what gets blocked. Veto
            evaluates them against every matching action before execution.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New policy
        </Button>
      </div>

      {/* Template gallery */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-[0.22em] text-muted-foreground">
            Perimeter templates
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {POLICY_TEMPLATES.length} curated
          </span>
        </div>
        <PolicyTemplateGrid onPick={pickTemplate} />
      </section>

      {/* Active policies */}
      <section>
        <h2 className="text-sm font-mono uppercase tracking-[0.22em] text-muted-foreground mb-4">
          Active perimeter
        </h2>
        <div className="rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase">
              Loading…
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No active policies. Add one from the templates above or build a custom rule.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {policies.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-start gap-4 hover:bg-surface/30 transition-colors">
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full ${
                      p.enabled ? "bg-signal animate-pulse-dot" : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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
      </section>

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
            <Button onClick={() => insertPolicy(form)}>Create policy</Button>
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
