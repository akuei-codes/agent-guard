import { Database, DollarSign, FileLock2, Cloud, KeyRound, CalendarX, Plus } from "lucide-react";

export type PolicyTemplate = {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  requires_approval: boolean;
  icon: typeof Database;
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    title: "Production Database Protection",
    description: "Block DROP / TRUNCATE / DELETE against any schema labelled `production`.",
    severity: "critical",
    requires_approval: false,
    icon: Database,
  },
  {
    title: "High-Value Financial Action Review",
    description: "Refunds, payouts, or transfers above $1,000 require finance reviewer.",
    severity: "high",
    requires_approval: true,
    icon: DollarSign,
  },
  {
    title: "Customer Data Export Guard",
    description: "Bulk PII exports (>100 records) held pending review.",
    severity: "high",
    requires_approval: true,
    icon: FileLock2,
  },
  {
    title: "Cloud Infrastructure Change Approval",
    description: "IAM, networking, and prod cluster mutations require approval.",
    severity: "high",
    requires_approval: true,
    icon: Cloud,
  },
  {
    title: "Credential Access Prevention",
    description: "Block reads of production secrets unless on allowlisted agents.",
    severity: "critical",
    requires_approval: false,
    icon: KeyRound,
  },
  {
    title: "Friday Deployment Block",
    description: "Deployments to production after 14:00 UTC Friday are blocked.",
    severity: "medium",
    requires_approval: false,
    icon: CalendarX,
  },
];

export function PolicyTemplateGrid({
  onPick,
}: {
  onPick: (t: PolicyTemplate) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {POLICY_TEMPLATES.map((t) => {
        const tone = toneFor(t.severity);
        const Icon = t.icon;
        return (
          <button
            key={t.title}
            onClick={() => onPick(t)}
            className="group relative text-left rounded-xl border border-border/60 bg-surface/40 backdrop-blur-sm p-4 transition-all hover:border-signal/40 hover:-translate-y-0.5"
            style={{ boxShadow: "0 30px 60px -50px rgba(0,0,0,0.6)" }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
            />
            <div className="flex items-start gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `color-mix(in oklab, ${tone} 12%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${tone} 30%, transparent)`,
                  color: tone,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
                    style={{
                      color: tone,
                      borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
                      background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                    }}
                  >
                    {t.severity}
                  </span>
                  {t.requires_approval && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                      approval
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold mt-1.5 leading-snug">{t.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end font-mono text-[10px] text-muted-foreground group-hover:text-signal transition-colors">
              <Plus className="h-3 w-3 mr-1" /> add to perimeter
            </div>
          </button>
        );
      })}
    </div>
  );
}

function toneFor(s: PolicyTemplate["severity"]) {
  return s === "critical"
    ? "var(--block)"
    : s === "high"
      ? "var(--warn)"
      : s === "medium"
        ? "var(--ice)"
        : "var(--signal)";
}
