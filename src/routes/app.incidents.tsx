import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/app/incidents")({
  component: () => (
    <ComingSoon
      title="Incidents"
      icon={AlertOctagon}
      blurb="When Veto blocks an irreversible action, an incident opens. Walk the timeline, see the agent's reasoning trace, and ship a postmortem in minutes — not days."
      capabilities={[
        "Auto-generated incident timeline from interception events",
        "Blast radius estimate and downstream system impact",
        "Postmortem template with reasoning trace attached",
        "Severity routing to PagerDuty, Slack, or webhook",
      ]}
    />
  ),
});
