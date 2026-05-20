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
  Bot,
  AlertOctagon,
  Plug,
  ScrollText,
  Settings as SettingsIcon,
  Command,
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
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Veto · 404
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Surface not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That path doesn&rsquo;t exist inside the control plane. Head back to mission control.
        </p>
        <Link
          to="/app"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-signal/45 bg-signal/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] text-signal hover:bg-signal/15 transition-colors"
        >
          Back to overview
        </Link>
      </div>
    </div>
  ),
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

        <div className="rounded-2xl border border-border/60 bg-surface/60 backdrop-blur-xl p-8 shadow-2xl">
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

const NAV: { to: "/app" | "/app/interceptions" | "/app/policies" | "/app/approvals"; label: string; icon: typeof Activity; exact?: boolean }[] = [
  { to: "/app", label: "Overview", icon: Activity, exact: true },
  { to: "/app/interceptions", label: "Live Interceptions", icon: Radar },
  { to: "/app/policies", label: "Policies", icon: Shield },
  { to: "/app/approvals", label: "Approval Queue", icon: CheckSquare },
];

const SOON = [
  { label: "Agents", icon: Bot },
  { label: "Incidents", icon: AlertOctagon },
  { label: "Integrations", icon: Plug },
  { label: "Audit Logs", icon: ScrollText },
  { label: "Settings", icon: SettingsIcon },
];

function Shell() {
  const { user, signOut } = useAuth();
  const { current, workspaces, setCurrent, createWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-[0.18]" />
      <div className="pointer-events-none fixed -top-[20%] left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_10%,transparent),transparent_64%)] blur-[100px]" />

      {/* Sidebar */}
      <aside className="relative z-10 w-64 shrink-0 border-r border-border/40 bg-background/60 backdrop-blur-2xl flex flex-col">
        <div className="px-5 py-5 border-b border-border/40">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <div className="relative h-7 w-7 rounded-lg border border-signal/45 bg-gradient-to-br from-signal/[0.22] via-signal/[0.08] to-transparent flex items-center justify-center shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--signal)_60%,transparent)]">
              <span className="font-mono text-xs font-bold text-signal">V</span>
            </div>
            <span className="font-semibold tracking-tight">Veto</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
              v0.1
            </span>
          </Link>
        </div>

        <div className="px-3 py-3 border-b border-border/40">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface/40 border border-border/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex-1">System nominal</span>
            <span className="text-[10px] font-mono text-signal tabular-nums">38ms</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-2 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
            Mission control
          </div>
          {NAV.map((item) => {
            const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-signal/[0.14] to-signal/[0.02] text-foreground border border-signal/30 shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_10%,transparent)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50 border border-transparent"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-signal shadow-[0_0_12px_color-mix(in_oklab,var(--signal)_80%,transparent)]" />
                )}
                <Icon className={`h-4 w-4 ${isActive ? "text-signal" : ""}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-6">
            <div className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
              Coming soon
            </div>
            <div className="mt-1.5 space-y-0.5">
              {SOON.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground/40 cursor-not-allowed"
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Workspace + user */}
        <div className="p-3 border-t border-border/40 space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-surface/50 hover:bg-surface/80 border border-border/40 text-left transition-colors">
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
                    await createWorkspace(name.trim(), "startup");
                    toast.success("Workspace created");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-2" /> New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface/50 transition-colors">
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

      {/* Main area with top bar */}
      <main className="relative z-10 flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <div className="sticky top-0 z-20 h-12 border-b border-border/40 bg-background/60 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span>{current?.name}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">{active?.label ?? "Overview"}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-surface/40">
              <Command className="h-3 w-3" /> K
            </kbd>
            <span className="hidden sm:inline">commands</span>
          </div>
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
