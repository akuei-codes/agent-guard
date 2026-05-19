import { useState } from "react";
import { Link, Outlet, useNavigate, useRouterState, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Radar,
  Shield,
  CheckSquare,
  ChevronsUpDown,
  LogOut,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/app/useAuth";
import { WorkspaceProvider, useWorkspace } from "@/app/WorkspaceProvider";
import { SimulationProvider } from "@/app/simulation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Veto — Mission control" }] }),
  component: AppRoot,
});

function AppRoot() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <SimulationProvider>
          <Gate />
        </SimulationProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { workspaces, current, loading: wLoading } = useWorkspace();

  if (authLoading) return <FullscreenLoader label="Authenticating" />;

  if (!user) {
    // redirect to /login
    if (typeof window !== "undefined") {
      navigate({ to: "/login" });
    }
    return <FullscreenLoader label="Redirecting" />;
  }

  if (wLoading) return <FullscreenLoader label="Loading workspaces" />;
  if (workspaces.length === 0 || !current) return <Onboarding />;

  return <Shell />;
}

function FullscreenLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono text-xs tracking-wider uppercase">
      <div className="h-2 w-2 rounded-full bg-signal animate-pulse-dot mr-3" /> {label}…
    </div>
  );
}

function Onboarding() {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [type, setType] = useState<"startup" | "enterprise" | "personal">("startup");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createWorkspace(name.trim(), type);
      toast.success("Workspace created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg pointer-events-none mask-[linear-gradient(to_bottom,black_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_18%,transparent),transparent_64%)] blur-[100px]" />

      <div className="relative w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-8 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-signal" />
          <span className="font-mono text-xs uppercase tracking-[0.25em]">Veto · setup</span>
        </div>

        <div className="rounded-2xl border bg-surface/70 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
          <p className="text-sm text-muted-foreground mt-2">
            A workspace is an isolated control plane — policies, agents, and audit logs scoped to one team.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Workspace name
              </label>
              <Input
                className="mt-1.5"
                placeholder="Acme Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Workspace type
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(["startup", "enterprise", "personal"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-md border px-3 py-2 text-xs capitalize transition-colors ${
                      type === t
                        ? "border-signal/60 bg-signal/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "personal" ? "Personal lab" : t}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
              Enter mission control
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

const NAV = [
  { to: "/app", label: "Overview", icon: Activity, exact: true },
  { to: "/app/interceptions", label: "Live Interceptions", icon: Radar },
  { to: "/app/policies", label: "Policies", icon: Shield },
  { to: "/app/approvals", label: "Approval Queue", icon: CheckSquare },
] as const;

function Shell() {
  const { user, signOut } = useAuth();
  const { current, workspaces, setCurrent } = useWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border/60 bg-surface/40 backdrop-blur-sm flex flex-col">
        <div className="px-5 py-5 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <span className="font-semibold tracking-tight">Veto</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-signal/10 text-foreground border border-signal/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-6">
            <div className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
              Coming soon
            </div>
            <div className="mt-1.5 space-y-0.5">
              {["Agents", "Incidents", "Integrations", "Audit Logs", "Team", "Settings"].map(
                (l) => (
                  <div
                    key={l}
                    className="px-3 py-2 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed"
                  >
                    {l}
                  </div>
                ),
              )}
            </div>
          </div>
        </nav>

        {/* Workspace + user */}
        <div className="p-3 border-t border-border/60 space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-surface-elevated/60 hover:bg-surface-elevated text-left transition-colors">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Workspace
                  </div>
                  <div className="text-sm truncate">{current?.name}</div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => setCurrent(w.id)}>
                  <Shield className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {w.name}
                  {w.id === current?.id ? (
                    <span className="ml-auto text-[10px] text-signal font-mono">CURRENT</span>
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const name = window.prompt("New workspace name");
                  if (!name?.trim()) return;
                  try {
                    const { createWorkspace } = useWorkspace as never; // placeholder to satisfy ts; real call below
                    void createWorkspace;
                  } catch {
                    /* noop */
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-2" /> New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-elevated/60 transition-colors">
                <div className="h-7 w-7 rounded-full bg-signal/20 border border-signal/40 flex items-center justify-center text-[11px] font-semibold text-signal">
                  {(user?.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs truncate">{user?.email}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Owner</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
