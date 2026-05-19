import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Verdict = "ALLOW" | "ESCALATE" | "BLOCK" | "PENDING";
export type Severity = "low" | "medium" | "high" | "critical";

export type AgentName =
  | "DevAgent"
  | "FinanceAgent"
  | "SupportAgent"
  | "CursorAgent"
  | "OpsAgent"
  | "InternalGPT"
  | "ClaudeAgent"
  | "Devin";

export type SimAction = {
  id: string;
  ts: number;
  agent: AgentName;
  tool: string;
  intent: string;
  detail: string;
  target: string;
  environment: "production" | "staging" | "dev";
  verdict: Verdict;
  severity: Severity;
  risk: number; // 0–100
  confidence: number; // 0–100
  blastRadius: string;
  policyMatches: { id: string; title: string }[];
  reasoning: string[];
  latencyMs: number;
};

const POOL: Omit<SimAction, "id" | "ts" | "verdict" | "latencyMs">[] = [
  {
    agent: "DevAgent",
    tool: "shell.exec",
    intent: "Production deploy",
    detail: "kubectl rollout restart deployment/api -n prod",
    target: "Kubernetes / prod",
    environment: "production",
    severity: "high",
    risk: 78,
    confidence: 92,
    blastRadius: "All API replicas, ~12k req/s in flight",
    policyMatches: [{ id: "p-deploy", title: "Require approval for production deploys" }],
    reasoning: [
      "Targets cluster labelled `production`",
      "Rolling restart drops 30% of capacity for ~90s",
      "Falls inside business hours (low-risk window: 02:00–05:00 UTC)",
    ],
  },
  {
    agent: "FinanceAgent",
    tool: "stripe.refund",
    intent: "Customer refund",
    detail: "amount=$48,200 customer=cus_9aZk22 reason=billing_dispute",
    target: "Stripe",
    environment: "production",
    severity: "critical",
    risk: 91,
    confidence: 88,
    blastRadius: "Single charge, irreversible after 5 days",
    policyMatches: [{ id: "p-refund", title: "Escalate refunds above $1,000" }],
    reasoning: [
      "Amount exceeds $1,000 escalation threshold",
      "Customer has no prior dispute history",
      "Agent confidence in refund justification: medium",
    ],
  },
  {
    agent: "OpsAgent",
    tool: "db.exec",
    intent: "Drop production table",
    detail: "DROP TABLE production.users CASCADE",
    target: "Postgres / prod-primary",
    environment: "production",
    severity: "critical",
    risk: 99,
    confidence: 99,
    blastRadius: "~2.1M rows, 4 downstream analytics jobs, irreversible",
    policyMatches: [
      { id: "p-drop", title: "Block deletion of production tables" },
      { id: "p-blast", title: "Block irreversible high-blast actions" },
    ],
    reasoning: [
      "DDL targeting `production` schema",
      "No rollback path available",
      "Matches signature of past Replit / Amazon incidents",
    ],
  },
  {
    agent: "SupportAgent",
    tool: "data.export",
    intent: "Customer CSV export",
    detail: "rows=12,408 fields=[email,phone,plan,last_login]",
    target: "customers.csv",
    environment: "production",
    severity: "high",
    risk: 74,
    confidence: 84,
    blastRadius: "12,408 user records leaving controlled environment",
    policyMatches: [{ id: "p-export", title: "Prevent exporting >100 customer records" }],
    reasoning: [
      "Export size exceeds 100-record cap",
      "Includes contact PII (email, phone)",
      "No active support ticket referenced",
    ],
  },
  {
    agent: "CursorAgent",
    tool: "env.update",
    intent: "Modify environment variables",
    detail: "set DATABASE_URL=postgres://… (prod)",
    target: "Vercel / prod env",
    environment: "production",
    severity: "high",
    risk: 81,
    confidence: 76,
    blastRadius: "Next deploy reads new connection string",
    policyMatches: [{ id: "p-env", title: "Require approval for prod env changes" }],
    reasoning: [
      "Changes a connection string in production",
      "No git PR or change ticket linked",
    ],
  },
  {
    agent: "InternalGPT",
    tool: "aws.secretsmanager",
    intent: "Read prod credentials",
    detail: "GetSecretValue arn:aws:secretsmanager:…:prod/db_password",
    target: "AWS / Secrets Manager",
    environment: "production",
    severity: "high",
    risk: 70,
    confidence: 80,
    blastRadius: "Plaintext credential exposed to agent context",
    policyMatches: [{ id: "p-secret", title: "Escalate prod credential reads" }],
    reasoning: ["Targets production secret", "Agent has no recent legitimate read pattern"],
  },
  {
    agent: "ClaudeAgent",
    tool: "github.merge",
    intent: "Force-merge main",
    detail: "force-push origin/main (skip 3 required reviews)",
    target: "GitHub / main",
    environment: "production",
    severity: "critical",
    risk: 88,
    confidence: 94,
    blastRadius: "Bypasses CI + 3 required reviewers",
    policyMatches: [
      { id: "p-merge", title: "Block force-push to protected branches" },
    ],
    reasoning: ["Branch is protected", "Bypasses required reviews"],
  },
  {
    agent: "Devin",
    tool: "email.send",
    intent: "Mass customer email",
    detail: "to=all-customers (12,408) subject=\"Service notice\"",
    target: "SES",
    environment: "production",
    severity: "medium",
    risk: 58,
    confidence: 72,
    blastRadius: "12,408 outbound emails",
    policyMatches: [{ id: "p-mass", title: "Escalate mass outbound mail" }],
    reasoning: ["Recipient count exceeds 1,000", "No template approval recorded"],
  },
  {
    agent: "DevAgent",
    tool: "fs.write",
    intent: "Write build cache",
    detail: "/tmp/cache/build-9a82.json (412 KB)",
    target: "filesystem",
    environment: "dev",
    severity: "low",
    risk: 6,
    confidence: 99,
    blastRadius: "Local cache only",
    policyMatches: [],
    reasoning: ["Scope is /tmp", "No external systems touched"],
  },
  {
    agent: "SupportAgent",
    tool: "db.query",
    intent: "Read recent tickets",
    detail: "SELECT * FROM tickets WHERE status='open' LIMIT 50",
    target: "Postgres / read-replica",
    environment: "production",
    severity: "low",
    risk: 9,
    confidence: 99,
    blastRadius: "Read-only, 50 rows",
    policyMatches: [],
    reasoning: ["Read-only", "Bounded result set"],
  },
  {
    agent: "OpsAgent",
    tool: "k8s.scale",
    intent: "Scale to zero",
    detail: "deployment/api → 0 replicas",
    target: "Kubernetes / prod",
    environment: "production",
    severity: "critical",
    risk: 95,
    confidence: 97,
    blastRadius: "Full API outage",
    policyMatches: [{ id: "p-outage", title: "Block actions causing total outage" }],
    reasoning: ["Scales production API to zero replicas", "Equivalent to full outage"],
  },
];

function pickVerdict(severity: Severity, risk: number): Verdict {
  if (severity === "critical" && risk >= 88) return "BLOCK";
  if (risk >= 70) return Math.random() > 0.4 ? "ESCALATE" : "PENDING";
  if (risk >= 40) return Math.random() > 0.5 ? "ESCALATE" : "ALLOW";
  return "ALLOW";
}

type Ctx = {
  actions: SimAction[];
  paused: boolean;
  setPaused: (b: boolean) => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  counts: { allowed: number; escalated: number; blocked: number; pending: number };
};

const SimCtx = createContext<Ctx | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<SimAction[]>([]);
  const [paused, setPaused] = useState(false);
  const idRef = useRef(0);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Seed
  useEffect(() => {
    const seed: SimAction[] = [];
    for (let i = 0; i < 8; i++) {
      const sample = POOL[Math.floor(Math.random() * POOL.length)];
      const verdict = pickVerdict(sample.severity, sample.risk);
      seed.push({
        ...sample,
        id: `a${++idRef.current}`,
        ts: Date.now() - (8 - i) * 4200 - Math.random() * 1500,
        verdict,
        latencyMs: 22 + Math.floor(Math.random() * 28),
      });
    }
    setActions(seed.reverse());
  }, []);

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return;
      const sample = POOL[Math.floor(Math.random() * POOL.length)];
      const verdict = pickVerdict(sample.severity, sample.risk);
      const next: SimAction = {
        ...sample,
        id: `a${++idRef.current}`,
        ts: Date.now(),
        verdict,
        latencyMs: 22 + Math.floor(Math.random() * 28),
      };
      setActions((prev) => [next, ...prev].slice(0, 80));
    };
    const interval = setInterval(tick, 1500);
    return () => clearInterval(interval);
  }, []);

  const decide = useCallback((id: string, verdict: Verdict) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, verdict } : a)));
  }, []);

  const counts = useMemo(() => {
    const c = { allowed: 1284, escalated: 47, blocked: 12, pending: 0 };
    for (const a of actions) {
      if (a.verdict === "ALLOW") c.allowed++;
      else if (a.verdict === "ESCALATE") c.escalated++;
      else if (a.verdict === "BLOCK") c.blocked++;
      else if (a.verdict === "PENDING") c.pending++;
    }
    return c;
  }, [actions]);

  const value: Ctx = {
    actions,
    paused,
    setPaused,
    approve: (id) => decide(id, "ALLOW"),
    reject: (id) => decide(id, "BLOCK"),
    counts,
  };

  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>;
}

export function useSimulation() {
  const v = useContext(SimCtx);
  if (!v) throw new Error("useSimulation must be used within SimulationProvider");
  return v;
}
