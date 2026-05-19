-- =============================================================================
-- Veto — standalone Supabase schema
-- Run this in Supabase SQL Editor against your own project.
-- Idempotent where practical (uses IF NOT EXISTS / CREATE OR REPLACE).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Enums (guarded so re-running is safe)
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workspace_type as enum ('startup', 'enterprise', 'personal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agent_status as enum ('active', 'paused', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.autonomy_level as enum ('observe', 'assist', 'execute', 'autonomous');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.severity as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.action_status as enum ('intercepted', 'allowed', 'blocked', 'escalated', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verdict as enum ('ALLOW', 'BLOCK', 'ESCALATE', 'PENDING');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_decision as enum ('approved', 'rejected', 'escalated', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.incident_status as enum ('open', 'investigating', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.integration_provider as enum (
    'openai', 'anthropic', 'github', 'aws', 'stripe', 'slack', 'supabase', 'vercel', 'custom'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Updated-at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles  (1-to-1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles self insert" on public.profiles;

create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- workspaces
-- ----------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.workspace_type not null default 'startup',
  created_by uuid not null references auth.users(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_created_by_idx on public.workspaces(created_by);

drop trigger if exists workspaces_touch on public.workspaces;
create trigger workspaces_touch
  before update on public.workspaces
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- workspace_members
-- ----------------------------------------------------------------------------
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);

-- Security-definer helpers (avoid RLS recursion)
create or replace function public.is_workspace_member(_workspace uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace and user_id = _user
  )
$$;

create or replace function public.workspace_role(_workspace uuid, _user uuid)
returns public.member_role language sql stable security definer set search_path = public as $$
  select role from public.workspace_members
  where workspace_id = _workspace and user_id = _user
  limit 1
$$;

-- Auto-add creator as owner
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- workspaces RLS
alter table public.workspaces enable row level security;
drop policy if exists "authenticated can create workspaces" on public.workspaces;
drop policy if exists "members can view workspaces"         on public.workspaces;
drop policy if exists "owners can update workspace"         on public.workspaces;
drop policy if exists "owners can delete workspace"         on public.workspaces;

create policy "authenticated can create workspaces" on public.workspaces
  for insert to authenticated with check (created_by = auth.uid());
create policy "members can view workspaces" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id, auth.uid()));
create policy "owners can update workspace" on public.workspaces
  for update to authenticated using (public.workspace_role(id, auth.uid()) = 'owner');
create policy "owners can delete workspace" on public.workspaces
  for delete to authenticated using (public.workspace_role(id, auth.uid()) = 'owner');

-- workspace_members RLS
alter table public.workspace_members enable row level security;
drop policy if exists "members can view members"  on public.workspace_members;
drop policy if exists "owners manage members"     on public.workspace_members;
drop policy if exists "self insert own membership" on public.workspace_members;
drop policy if exists "self can leave"            on public.workspace_members;

create policy "members can view members" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "owners manage members" on public.workspace_members
  for all to authenticated
  using (public.workspace_role(workspace_id, auth.uid()) = 'owner')
  with check (public.workspace_role(workspace_id, auth.uid()) = 'owner');
create policy "self insert own membership" on public.workspace_members
  for insert to authenticated with check (user_id = auth.uid());
create policy "self can leave" on public.workspace_members
  for delete to authenticated using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- workspace_invites
-- ----------------------------------------------------------------------------
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'member',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists invites_workspace_idx on public.workspace_invites(workspace_id);
create index if not exists invites_email_idx on public.workspace_invites(lower(email));

alter table public.workspace_invites enable row level security;
drop policy if exists "members view invites"   on public.workspace_invites;
drop policy if exists "admins manage invites"  on public.workspace_invites;

create policy "members view invites" on public.workspace_invites
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "admins manage invites" on public.workspace_invites
  for all to authenticated
  using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'))
  with check (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));

-- ----------------------------------------------------------------------------
-- agents
-- ----------------------------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  autonomy public.autonomy_level not null default 'assist',
  status public.agent_status not null default 'active',
  permissions jsonb not null default '[]'::jsonb,
  connected_systems text[] not null default '{}',
  last_action_at timestamptz,
  risk_score int not null default 0 check (risk_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_workspace_idx on public.agents(workspace_id);
create index if not exists agents_status_idx on public.agents(workspace_id, status);

drop trigger if exists agents_touch on public.agents;
create trigger agents_touch before update on public.agents
  for each row execute function public.touch_updated_at();

alter table public.agents enable row level security;
drop policy if exists "members view agents"   on public.agents;
drop policy if exists "members manage agents" on public.agents;

create policy "members view agents" on public.agents
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members manage agents" on public.agents
  for all to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- integrations
-- ----------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider public.integration_provider not null,
  display_name text not null,
  scopes text[] not null default '{}',
  config jsonb not null default '{}'::jsonb,
  -- store ENCRYPTED credentials only; never plaintext
  credentials_encrypted text,
  enabled boolean not null default true,
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integrations_workspace_idx on public.integrations(workspace_id);

drop trigger if exists integrations_touch on public.integrations;
create trigger integrations_touch before update on public.integrations
  for each row execute function public.touch_updated_at();

alter table public.integrations enable row level security;
drop policy if exists "members view integrations"   on public.integrations;
drop policy if exists "admins manage integrations"  on public.integrations;

create policy "members view integrations" on public.integrations
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "admins manage integrations" on public.integrations
  for all to authenticated
  using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'))
  with check (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));

-- ----------------------------------------------------------------------------
-- policies
-- ----------------------------------------------------------------------------
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium',
  scope text not null default 'all',
  conditions jsonb not null default '{}'::jsonb,
  requires_approval boolean not null default false,
  approvers_required int not null default 1 check (approvers_required >= 1),
  enabled boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists policies_workspace_idx on public.policies(workspace_id);
create index if not exists policies_enabled_idx on public.policies(workspace_id, enabled);

drop trigger if exists policies_touch on public.policies;
create trigger policies_touch before update on public.policies
  for each row execute function public.touch_updated_at();

alter table public.policies enable row level security;
drop policy if exists "members view policies"   on public.policies;
drop policy if exists "members create policies" on public.policies;
drop policy if exists "members update policies" on public.policies;
drop policy if exists "members delete policies" on public.policies;

create policy "members view policies" on public.policies
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members create policies" on public.policies
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id, auth.uid()) and created_by = auth.uid());
create policy "members update policies" on public.policies
  for update to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members delete policies" on public.policies
  for delete to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- actions   (every intercepted action — the raw event)
-- ----------------------------------------------------------------------------
create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  tool text not null,
  intent text not null,
  detail text,
  target text,
  environment text,
  payload jsonb not null default '{}'::jsonb,
  risk_score int not null default 0 check (risk_score between 0 and 100),
  severity public.severity not null default 'medium',
  status public.action_status not null default 'intercepted',
  verdict public.verdict not null default 'PENDING',
  latency_ms int,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists actions_workspace_idx on public.actions(workspace_id, created_at desc);
create index if not exists actions_agent_idx on public.actions(agent_id);
create index if not exists actions_verdict_idx on public.actions(workspace_id, verdict);

alter table public.actions enable row level security;
drop policy if exists "members view actions"   on public.actions;
drop policy if exists "members write actions"  on public.actions;
drop policy if exists "members update actions" on public.actions;

create policy "members view actions" on public.actions
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members write actions" on public.actions
  for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members update actions" on public.actions
  for update to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- interceptions   (policy evaluation result per action)
-- ----------------------------------------------------------------------------
create table if not exists public.interceptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action_id uuid not null references public.actions(id) on delete cascade,
  policy_id uuid references public.policies(id) on delete set null,
  matched boolean not null default false,
  reasoning text,
  blast_radius text,
  evaluated_at timestamptz not null default now()
);

create index if not exists interceptions_action_idx on public.interceptions(action_id);
create index if not exists interceptions_workspace_idx on public.interceptions(workspace_id, evaluated_at desc);

alter table public.interceptions enable row level security;
drop policy if exists "members view interceptions"  on public.interceptions;
drop policy if exists "members write interceptions" on public.interceptions;

create policy "members view interceptions" on public.interceptions
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members write interceptions" on public.interceptions
  for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- approvals
-- ----------------------------------------------------------------------------
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action_id uuid not null references public.actions(id) on delete cascade,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  decided_by uuid references auth.users(id) on delete set null,
  decision public.approval_decision,
  decided_at timestamptz,
  reason text
);

create index if not exists approvals_workspace_idx on public.approvals(workspace_id, requested_at desc);
create index if not exists approvals_pending_idx on public.approvals(workspace_id) where decision is null;

alter table public.approvals enable row level security;
drop policy if exists "members view approvals"   on public.approvals;
drop policy if exists "members write approvals"  on public.approvals;
drop policy if exists "members update approvals" on public.approvals;

create policy "members view approvals" on public.approvals
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members write approvals" on public.approvals
  for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members update approvals" on public.approvals
  for update to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- incidents
-- ----------------------------------------------------------------------------
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  summary text,
  severity public.severity not null default 'high',
  status public.incident_status not null default 'open',
  triggered_by_action_id uuid references public.actions(id) on delete set null,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists incidents_workspace_idx on public.incidents(workspace_id, opened_at desc);
create index if not exists incidents_open_idx on public.incidents(workspace_id) where status = 'open';

drop trigger if exists incidents_touch on public.incidents;
create trigger incidents_touch before update on public.incidents
  for each row execute function public.touch_updated_at();

alter table public.incidents enable row level security;
drop policy if exists "members view incidents"   on public.incidents;
drop policy if exists "members manage incidents" on public.incidents;

create policy "members view incidents" on public.incidents
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members manage incidents" on public.incidents
  for all to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  event text not null,
  resource_type text,
  resource_id uuid,
  payload jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_workspace_idx on public.audit_logs(workspace_id, created_at desc);
create index if not exists audit_event_idx on public.audit_logs(workspace_id, event);
create index if not exists audit_actor_idx on public.audit_logs(actor_id);

alter table public.audit_logs enable row level security;
drop policy if exists "members view audit"  on public.audit_logs;
drop policy if exists "members write audit" on public.audit_logs;

create policy "members view audit" on public.audit_logs
  for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "members write audit" on public.audit_logs
  for insert to authenticated with check (public.is_workspace_member(workspace_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- api_keys   (programmatic agent registration)
-- ----------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  prefix text not null,                       -- non-secret identifier shown in UI
  hashed_secret text not null,                -- store hash (e.g. sha256) of the full token
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists api_keys_prefix_unique on public.api_keys(prefix);
create index if not exists api_keys_workspace_idx on public.api_keys(workspace_id);

alter table public.api_keys enable row level security;
drop policy if exists "admins view api_keys"   on public.api_keys;
drop policy if exists "admins manage api_keys" on public.api_keys;

create policy "admins view api_keys" on public.api_keys
  for select to authenticated using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));
create policy "admins manage api_keys" on public.api_keys
  for all to authenticated
  using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'))
  with check (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));

-- ----------------------------------------------------------------------------
-- webhook_endpoints
-- ----------------------------------------------------------------------------
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  url text not null,
  description text,
  secret text not null default encode(gen_random_bytes(32), 'hex'),
  events text[] not null default '{}',
  enabled boolean not null default true,
  last_delivery_at timestamptz,
  failure_count int not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webhooks_workspace_idx on public.webhook_endpoints(workspace_id);

drop trigger if exists webhooks_touch on public.webhook_endpoints;
create trigger webhooks_touch before update on public.webhook_endpoints
  for each row execute function public.touch_updated_at();

alter table public.webhook_endpoints enable row level security;
drop policy if exists "admins view webhooks"   on public.webhook_endpoints;
drop policy if exists "admins manage webhooks" on public.webhook_endpoints;

create policy "admins view webhooks" on public.webhook_endpoints
  for select to authenticated using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));
create policy "admins manage webhooks" on public.webhook_endpoints
  for all to authenticated
  using (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'))
  with check (public.workspace_role(workspace_id, auth.uid()) in ('owner', 'admin'));

-- =============================================================================
-- DEMO DATA  (optional — uncomment to seed a workspace for a known auth user)
-- =============================================================================
-- Replace '00000000-0000-0000-0000-000000000000' with a real auth.users.id.
--
-- do $$
-- declare
--   v_user uuid := '00000000-0000-0000-0000-000000000000';
--   v_ws uuid;
-- begin
--   insert into public.workspaces (name, type, created_by) values ('Acme Engineering', 'startup', v_user) returning id into v_ws;
--   insert into public.policies (workspace_id, title, description, severity, requires_approval, created_by) values
--     (v_ws, 'Block deletion of production databases', 'DROP / TRUNCATE on prod schemas blocked outright.', 'critical', false, v_user),
--     (v_ws, 'Require approval for production deploys', 'Rollouts against prod clusters require sign-off.', 'high', true, v_user),
--     (v_ws, 'Escalate refunds above $1,000', 'High-value financial actions go to finance reviewer.', 'high', true, v_user);
-- end $$;
