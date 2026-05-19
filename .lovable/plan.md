This is a large change. Here's how I'll execute it in this turn, scoped to deliver real impact without sprawling into stubs.

## 1. Homepage auth entry points (header upgrade)

Update the existing landing page header (in `src/routes/index.tsx`) so it exposes real product entry points alongside the marketing flow:

- Sign In → `/login`
- Create Account → `/login?mode=signup`
- Join Waitlist → existing `#early-access` anchor
- Request Demo → `mailto:` founders
- View Product → `/app`

Header treatment: sticky, black/transparent glass (`backdrop-blur-xl` + `bg-background/60`), thin `border-border/50`, subtle inner glow on the primary CTA, refined hover states. The current header already has the glass foundation — I'll restructure the right side into a real nav cluster + primary CTA button (View Product) with a glowing outline.

## 2. Auth page upgrade (`/login`)

Rework `src/routes/login.tsx` into a cinematic split-screen:

- Left: animated interception diagram loop (reused/condensed from `InterceptionVisualizer`) over a dark grid background with ambient packet motion.
- Right: glass auth card with three providers: **Continue with Google**, **Continue with GitHub**, **Continue with Email** (email/password form toggled inline).
- Supports `?mode=signup` to default to Create Account state.
- Calls `lovable.auth.signInWithOAuth("google", …)` for Google and `supabase.auth.signInWithOAuth({ provider: "github" })` for GitHub. I'll also call `configure_social_auth` to enable google + github so first-attempt sign-in doesn't fail.

Note on GitHub: Lovable Cloud's managed broker only supports Google/Apple. GitHub will be wired via `supabase.auth.signInWithOAuth` directly — this requires the user to enable GitHub provider in the Supabase auth dashboard with their own OAuth app. I'll wire the UI + code and surface a clear inline notice if it isn't configured yet.

## 3. Cinematic UI pass on the product (`/app/*`)

Goal: mission-control feel — dark, glass, glowing outlines, restrained motion. Not a full per-page rewrite, but the shared shell + Overview get a real "wow" pass since that's where every session lands.

- **Shell (`/app` layout)**: redesign sidebar as a dark glass rail with sectioned nav, workspace switcher pill, live "system status" indicator (animated pulse), refined typography. Top bar with breadcrumb + global command hint + user menu.
- **Overview (`/app` index)**:
  - Hero "Command Console" panel with the live `InterceptionVisualizer` enlarged and treated as the focal piece, surrounded by glowing edge.
  - Stat strip: Actions evaluated (24h), Blocked, Pending approval, Avg verdict time — with sparklines and subtle pulse on update.
  - **Risk heatmap** (new component): 7×24 grid coloured by interception count, oklch ramp from ice → signal → block.
  - **System pressure gauge** (new): animated arc gauge driven by recent action volume + risk score.
  - **Live agent activity pulse**: list of agents with a pulsing dot whose cadence matches their action rate.
  - **Approval queue preview** + **Incident timeline preview** cards linking to full pages.
- **Live Interceptions (`/app/interceptions`)**: keep existing stream but upgrade card visuals — each action animates in from the right along a "wire" line, critical actions trigger a dramatic pause halo + slow pulse until resolved.
- **Policies (`/app/policies`)**: add the 6 templates listed (Production DB Protection, High-Value Financial Action Review, Customer Data Export Guard, Cloud Infrastructure Change Approval, Credential Access Prevention, Friday Deployment Block) as one-click starter cards above the CRUD list. Visual treatment: perimeter-style cards with severity-coloured edge glow.
- **Approval Queue (`/app/approvals`)**: high-stakes treatment — large action card per pending item with risk explanation, approver avatar stack, countdown timer (auto-escalate at 0), Approve / Block / Escalate buttons.

I will NOT add new routes for Agents / Integrations / Audit / Incidents this turn (those were out of the MVP scope you approved earlier). The Overview will surface preview cards that link to placeholders for future build-out, so the structural story is complete.

## 4. `schema.sql` — standalone, no Cloud migration

Create `schema.sql` at the project root (not under `supabase/migrations/`). It will contain:

- Extensions: `pgcrypto`, `uuid-ossp`
- Enums: `member_role`, `workspace_type`, `agent_status`, `autonomy_level`, `severity`, `action_status`, `verdict`, `approval_decision`, `incident_status`, `integration_provider`
- Tables: `profiles`, `workspaces`, `workspace_members`, `workspace_invites`, `agents`, `integrations`, `policies`, `actions`, `interceptions`, `approvals`, `incidents`, `audit_logs`, `api_keys`, `webhook_endpoints`
- All with UUID PKs, `timestamptz`, `jsonb` metadata, proper FKs
- `updated_at` trigger function + triggers on every mutable table
- Security definer helpers: `is_workspace_member(_workspace, _user)`, `workspace_role(_workspace, _user)`
- RLS enabled on every table, policies scoped to `is_workspace_member`
- Auto-create `profile` row on `auth.users` insert via trigger
- Seed/demo data block (commented `-- DEMO DATA` section the user can run optionally) for one workspace + sample policies + sample interceptions

The existing app code currently reads from the live Supabase project's `workspaces` / `workspace_members` / `policies` tables. I'll leave that working — the `schema.sql` file is a superset, so when you run it on your own Supabase project, everything continues to work. I will NOT call the `supabase--migration` tool for the new tables, per your instruction.

## 5. Environment variables

I'll add a `.env.example` (or update if present) documenting:

```
NEXT_PUBLIC_SUPABASE_URL= (note: this stack uses VITE_SUPABASE_URL)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Important: this project is **TanStack Start + Vite**, not Next.js. The `NEXT_PUBLIC_*` prefix has no effect here — Vite needs `VITE_*`. I'll document both so your schema runner / external tooling sees what it expects, but the app reads `VITE_*`.

## Out of scope for this turn (call out so you can prioritise next)

- New routes/pages for Agents, Integrations, Audit Logs, Incidents (UI shells only via Overview previews).
- Wiring `actions` / `interceptions` / `approvals` / `audit_logs` tables into live reads — the app currently runs on the in-memory `SimulationProvider`. Migrating from simulated → real DB-backed events is a follow-up once you've run `schema.sql`.
- GitHub OAuth provider enablement in Supabase (you'll need to create the OAuth app and paste credentials in the Supabase dashboard; I'll wire the client code and the button).

## Files I will create / edit

- `schema.sql` (new, root)
- `.env.example` (new or updated)
- `src/routes/index.tsx` — header upgrade with new nav entries
- `src/routes/login.tsx` — split-screen cinematic auth with Google/GitHub/Email
- `src/routes/app.tsx` — sidebar + topbar premium pass
- `src/routes/app.index.tsx` — Overview with command console, heatmap, pressure gauge, pulse, previews
- `src/routes/app.policies.tsx` — template cards
- `src/routes/app.approvals.tsx` — high-stakes treatment
- `src/components/app/RiskHeatmap.tsx` (new)
- `src/components/app/SystemPressureGauge.tsx` (new)
- `src/components/app/AgentActivityPulse.tsx` (new)
- `src/components/app/IncidentTimeline.tsx` (new)
- `src/components/app/ApprovalCard.tsx` (new)
- `src/components/app/PolicyTemplates.tsx` (new)
- Small `src/styles.css` additions for new keyframes (pressure-pulse, wire-flow).

Reply **approve** to proceed, or tell me what to cut / re-prioritise.