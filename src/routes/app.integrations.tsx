import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/app/integrations")({
  component: () => (
    <ComingSoon
      title="Integrations"
      icon={Plug}
      blurb="Connect the systems Veto guards. Databases, payment processors, infrastructure, mail — every protected surface, with policies scoped per integration."
      capabilities={[
        "Postgres, Stripe, AWS, Kubernetes, SendGrid, Slack",
        "Per-integration policies and rate-limit envelopes",
        "Outbound mTLS / signed-egress for production calls",
        "BYO via signed webhook + SDK middleware",
      ]}
    />
  ),
});
