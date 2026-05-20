import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/app/settings")({
  component: () => (
    <ComingSoon
      title="Workspace settings"
      icon={SettingsIcon}
      blurb="Members, roles, billing, API keys, and the safety defaults that apply across every agent in this workspace."
      capabilities={[
        "Members & roles (owner, operator, reviewer, viewer)",
        "API keys with scoped permissions and rotation",
        "Default autonomy ceiling for new agents",
        "Billing, seats, and audit retention window",
      ]}
    />
  ),
});
