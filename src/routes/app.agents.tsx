import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/app/agents")({
  component: () => (
    <ComingSoon
      title="Agents"
      icon={Bot}
      blurb="Register every autonomous agent that ships actions through Veto. Define their identity, autonomy level, allowed perimeters, and human accountability — one row per agent, one source of truth."
      capabilities={[
        "Per-agent identity, owner, and on-call escalation chain",
        "Autonomy level: read-only · advisory · supervised · autonomous",
        "Token + signing key rotation with full audit history",
        "Live risk score and weekly behavioural drift report",
      ]}
    />
  ),
});
