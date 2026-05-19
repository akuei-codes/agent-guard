import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { DecisionMomentDemo } from "@/components/veto/DecisionMomentDemo";
import { LiveInterceptor } from "@/components/veto/LiveInterceptor";
import { IncidentsSection } from "@/components/veto/Incidents";
import { RiskGraphViz } from "@/components/veto/RiskGraphViz";
import {
  ActionIntelligenceStrip,
  DefiningLineStrip,
  DifferentiationMatrix,
  GhostExecutionPreview,
  MemoryMoatPanel,
} from "@/components/veto/VetoPillars";
import { FOUNDERS_EMAIL, foundersMailto } from "@/constants/contact";
import { VetoHeroStage } from "@/components/veto/VetoHeroStage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none mask-[linear-gradient(to_bottom,black_58%,transparent_100%)]" />

      <AmbientPacketField />

      {/* Layered ambience */}
      <div className="pointer-events-none absolute -top-[34%] left-1/2 h-[min(88vh,800px)] w-[min(128vw,1280px)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--ice)_22%,transparent),transparent_64%)] opacity-90 blur-[100px]" />
      <div className="pointer-events-none absolute top-[22%] -right-[20%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--signal)_28%,transparent),transparent_70%)] blur-3xl opacity-75" />
      <div className="pointer-events-none absolute bottom-[-12%] left-[-14%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--signal)_12%,transparent),transparent_68%)] blur-3xl opacity-55" />

      <div className="relative">
        <Header />
        <VetoHeroStage />
        <section className="relative mx-auto max-w-6xl px-6 pb-10 sm:pb-12">
          <DefiningLineStrip />
        </section>
        <MentalModelSection />
        <RealityGapSection />
        <section className="relative mx-auto max-w-6xl px-6 pb-6 sm:pb-10" id="moment">
          <DecisionMomentDemo />
        </section>
        <IncidentsSection />
        <SimulationAndIntelligenceSection />
        <RiskGraphSection />
        <DifferentiationSection />
        <MemoryMoatSection />
        <AmbientInterceptorSection />
        <EnginesSection />
        <TrustLine />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}

/** Subtle vertical “packet” motion — always-on infrastructure feel. */
function AmbientPacketField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.55]" aria-hidden>
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 h-4 w-px animate-packet-rise rounded-full bg-gradient-to-t from-transparent via-signal/40 to-transparent"
          style={{
            left: `${4 + (i * 4.3) % 92}%`,
            animationDelay: `${i * 0.62}s`,
            animationDuration: `${12 + (i % 5) * 2.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-3 z-50 mx-auto max-w-6xl px-3">
      <div className="flex h-14 items-center justify-between rounded-full border border-white/[0.07] bg-background/55 px-3 backdrop-blur-2xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.05)] supports-[backdrop-filter]:backdrop-saturate-150">
        <Link to="/" className="group flex items-center gap-2.5 pl-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight transition-colors group-hover:text-foreground/95">
            Veto
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/80 md:inline">
            · decision layer
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[13px]">
          <a href="#moment" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </a>
          <Link to="/login" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            to="/login"
            search={{ mode: "signup" } as never}
            className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            Create account
          </Link>
          <a
            href={foundersMailto}
            className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            Request demo
          </a>
          <a href="#early-access" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors">
            Waitlist
          </a>
        </nav>

        <div className="flex items-center gap-2 pr-1">
          <Link
            to="/login"
            className="md:hidden inline-flex rounded-full border border-border/70 bg-surface/40 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-ice hover:border-ice/35 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/app"
            className="group relative inline-flex items-center gap-1.5 rounded-full border border-signal/45 bg-gradient-to-b from-signal/[0.18] to-signal/[0.04] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-signal shadow-[inset_0_1px_0_0_color-mix(in_oklab,white_18%,transparent),0_0_24px_-8px_color-mix(in_oklab,var(--signal)_70%,transparent)] transition-all hover:shadow-[0_0_28px_-6px_color-mix(in_oklab,var(--signal)_85%,transparent)] hover:-translate-y-px"
          >
            View product
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-signal/45 bg-gradient-to-br from-signal/[0.22] via-signal/[0.08] to-transparent shadow-[0_0_24px_-4px_color-mix(in_oklab,var(--signal)_55%,transparent)]">
      <span className="font-mono text-sm font-bold text-signal">V</span>
      <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ice opacity-45" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ice ring-2 ring-background shadow-[0_0_12px_color-mix(in_oklab,var(--ice)_85%,transparent)]" />
      </span>
    </div>
  );
}

function MentalModelSection() {
  return (
    <section className="relative border-y border-white/[0.05] bg-surface/[0.18]">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-ice mb-5">
            Mental model
          </div>
          <p className="text-2xl font-bold tracking-tight leading-snug text-foreground sm:text-3xl lg:text-[2.25rem]">
            Firewalls sit between the open internet and your servers.
            <span className="mt-3 block text-muted-foreground font-semibold sm:mt-4">
              Veto sits between your agents and reality.
            </span>
          </p>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The same way every packet crossed a policy boundary before it hit a NIC, every AI-issued
            execution must cross a semantic boundary before it mutates data, moves money, or sends mail.
          </p>
        </div>
      </div>
    </section>
  );
}

function RealityGapSection() {
  const today = [
    "Agents execute tool calls the instant the model emits them",
    "Logs and traces explain the outage after rows are gone",
    "Static roles cannot see intent drift inside a ‘safe’ API",
  ];
  const veto = [
    "Every query, HTTP call, shell line, and outbound message is intercepted first",
    "Every envelope is evaluated with live context and simulated consequence",
    "Nothing commits without an explicit allow / escalate / block verdict",
  ];
  return (
    <section className="border-b border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-block mb-4">
            Execution reality
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
            The gap between how agents ship and how infrastructure must behave.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-[#080a0f]/90 p-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-muted-foreground">
              What exists today
            </h3>
            <ul className="mt-8 space-y-5 text-[0.95rem] leading-relaxed text-muted-foreground">
              {today.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-block/80" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-signal/40 bg-gradient-to-b from-signal/[0.09] via-surface/50 to-transparent p-8 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--signal)_25%,transparent)]">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-signal">
              What Veto changes
            </h3>
            <ul className="mt-8 space-y-5 text-[0.95rem] leading-relaxed text-foreground font-medium">
              {veto.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-t border-border/50 pt-6 text-sm text-muted-foreground leading-relaxed">
              Even small error rates compound across chained tool calls. Veto prevents the bad envelope
              from becoming an irreversible diff. It does not file a ticket about the damage afterward.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SimulationAndIntelligenceSection() {
  return (
    <section className="border-t border-border/55 bg-surface/[0.12]">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.35em] text-ice mb-6">
            Consequence simulation
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-[3.125rem]">
            Show what would have happened — then stop it.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Every section below names a concrete outcome: rows deleted, mail sent to your entire customer
            base, API calls that flip billing state. Veto surfaces that copy before the database driver
            sends the packet.{" "}
            <span className="text-foreground font-medium">
              Every AI action must pass through a decision layer before it becomes reality.
            </span>
          </p>
        </div>

        <div className="mt-14 space-y-12">
          <ActionIntelligenceStrip />
          <GhostExecutionPreview />
        </div>
      </div>
    </section>
  );
}

function RiskGraphSection() {
  return (
    <section className="border-t border-border/55">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <p className="mb-10 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
          One mistaken email.send would have blasted every customer. One bad payments API call would have
          reversed settled funds. The graph is how Veto keeps that story visible{" "}
          <span className="text-foreground">before</span> the SDK fires.
        </p>
        <RiskGraphViz />
      </div>
    </section>
  );
}

function DifferentiationSection() {
  return (
    <section className="border-t border-border/55 bg-surface/[0.08]">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.85rem]">
            If it only watches, it is not Veto.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Budget products answer “how much?” Guardrails answer “what words?” Observability answers “what
            blew up?” Veto answers whether the wire should have fired.{" "}
            <span className="text-foreground font-semibold">
              Every AI action must pass through a decision layer before it becomes reality.
            </span>
          </p>
        </div>
        <DifferentiationMatrix />
      </div>
    </section>
  );
}

function MemoryMoatSection() {
  return (
    <section className="border-t border-border/55">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <MemoryMoatPanel />
      </div>
    </section>
  );
}

function AmbientInterceptorSection() {
  return (
    <section className="border-t border-border/55">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="max-w-3xl mb-14">
          <div className="font-mono text-xs uppercase tracking-[0.34em] text-signal mb-5">
            Always-on plane
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Continuous evaluation · zero silent bypass.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Agent traffic never skirts the layer: every tool invocation is evaluated in real time, in
            production, with the same rigor you would demand of a kernel syscall gate. When something is
            blocked, it never reaches your database pool, mail relay, or cloud control plane.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-3 rounded-[1.85rem] bg-gradient-to-b from-signal/[0.14] via-transparent to-ice/[0.08] blur-2xl opacity-85" />
          <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.14] via-transparent to-ice/[0.22] p-px">
            <LiveInterceptor />
          </div>
        </div>
      </div>
    </section>
  );
}

function EnginesSection() {
  const axes = [
    {
      title: "Concrete blast",
      body: "Row counts deleted, dollars moved, inboxes touched, stated as operations people recognize.",
    },
    {
      title: "Historical twins",
      body: "Compares to destructive envelopes this org already blocked or approved under override.",
    },
    {
      title: "Intent vs execution",
      body: "Flags when “clean up users” becomes “delete active billable accounts.”",
    },
    {
      title: "Irreversibility",
      body: "Surfaces whether rollback is a SQL transaction or a multi-day incident program.",
    },
    {
      title: "Propagation graph",
      body: "Traces DB → billing → mail → IAM so one call cannot hide its knock-on effects.",
    },
  ];

  return (
    <section className="border-t border-border/55 bg-surface/[0.1]">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="font-mono text-xs uppercase tracking-[0.34em] text-ice mb-6">Engines</div>
        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-[3.125rem]">
          Verdict is the gate · commit is privileged.
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Each engine feeds the same invariant:{" "}
          <span className="text-foreground font-medium">
            every AI action must pass through a decision layer before it becomes reality.
          </span>{" "}
          Tiny miss rates amplify across sequential tool hops. These checks run on every hop, every time.
        </p>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {axes.map((a, i) => (
            <li
              key={a.title}
              className="group relative rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-background/80 p-6 shadow-[0_42px_100px_-58px_color-mix(in_oklab,var(--signal)_38%,transparent)] transition-colors hover:border-ice/30"
            >
              <span className="font-mono text-[10px] text-ice/85 tabular-nums">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <div className="mt-4 text-lg font-semibold tracking-tight">{a.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TrustLine() {
  const frameworks = ["LangChain", "AutoGen", "CrewAI", "OpenAI Assistants"];
  return (
    <section className="relative border-y border-border/55 bg-surface/25">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--ice)_14%,transparent),transparent,color-mix(in_oklab,var(--signal)_13%,transparent))] opacity-[0.13]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <div className="font-mono text-xs uppercase tracking-[0.34em] text-muted-foreground">
          Drops into any orchestration substrate
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {frameworks.map((f) => (
            <span
              key={f}
              className="bg-gradient-to-b from-foreground/95 to-muted-foreground bg-clip-text text-xl font-semibold text-transparent hover:from-white hover:to-foreground/82 sm:text-2xl"
            >
              {f}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-9 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Wire the execution plane once. Every runtime inherits the same rule: no agent output becomes a
          production side effect without passing Veto first.
        </p>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border/45">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--signal)_22%,transparent),transparent_62%)]" />
      <div className="pointer-events-none absolute -bottom-[36%] left-1/2 h-[460px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ice)_34%,transparent),transparent_74%)] opacity-80 blur-[120px]" />
      <div className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36">
        <h2 className="text-4xl font-bold tracking-tight sm:text-[3.5rem] sm:leading-[1.06]">
          If agents touch production,{` `}
          <span className="text-block drop-shadow-[0_0_40px_color-mix(in_oklab,var(--block)_35%,transparent)]">
            omitting Veto is negligence.
          </span>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Shipping autonomous execution without an intercept that understands consequence is consciously
          accepting undeletable failures. Teams that treat agents like infrastructure demand the same veto
          path they insist on for human operators.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-relaxed text-foreground">
          If you&apos;re running agents in production, you should not run them without this layer.
        </p>
        <div className="mt-14">
          <a
            href="#early-access"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-transparent bg-gradient-to-r from-signal via-emerald-300 to-ice px-11 py-4 text-[0.9375rem] font-semibold uppercase tracking-[0.14em] text-signal-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--foreground)_24%,transparent),0_0_48px_-10px_color-mix(in_oklab,var(--signal)_58%,transparent)] transition-[transform,box-shadow] hover:scale-[1.03] hover:shadow-[0_0_60px_-6px_color-mix(in_oklab,var(--signal)_68%,transparent)] active:scale-[0.985]"
          >
            <span className="relative z-[1]">Request early access →</span>
            <span className="absolute inset-x-[-40%] h-full skew-x-12 bg-gradient-to-r from-transparent via-white/22 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </a>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/90">
            Production slots limited · prioritized response
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            Reach founders directly:{" "}
            <a
              href={foundersMailto}
              className="font-mono text-ice underline-offset-4 transition-colors hover:text-ice/90 hover:underline"
            >
              {FOUNDERS_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-11 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <Link to="/" className="group flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            <Logo />
            <span className="font-semibold text-foreground transition-colors group-hover:text-foreground/90">
              Veto
            </span>
            <span className="font-mono text-xs text-center sm:text-start">
              Every AI action passes through here before reality does
            </span>
          </Link>
          <span className="font-mono text-[11px] tracking-wide">© {new Date().getFullYear()} veto.ink</span>
        </div>
        <div className="flex justify-center border-t border-border/40 pt-8 sm:justify-end">
          <a
            href={foundersMailto}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/50 px-4 py-2 font-mono text-xs text-ice transition-colors hover:border-ice/40 hover:bg-surface hover:text-ice/95"
          >
            <span className="text-muted-foreground">Founders</span>
            <span className="text-foreground/95">{FOUNDERS_EMAIL}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
