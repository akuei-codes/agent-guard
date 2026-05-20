import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/app/audit")({
  component: () => (
    <ComingSoon
      title="Audit logs"
      icon={ScrollText}
      blurb="Every decision Veto makes is signed, immutable, and exportable. Built for SOC 2, ISO 27001, and the auditors who ask what your agents actually did at 03:14 UTC."
      capabilities={[
        "Tamper-evident append-only log with hash chaining",
        "Filter by agent, verdict, policy, target, severity",
        "Streaming export to S3, BigQuery, Snowflake",
        "SAML SSO + role-scoped log visibility",
      ]}
    />
  ),
});
