
-- Enums
do $$ begin
  create type public.workspace_type as enum ('startup','enterprise','personal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_role as enum ('owner','admin','member','reviewer');
exception when duplicate_object then null; end $$;

-- Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.workspace_type not null default 'startup',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium',
  scope text not null default 'all',
  conditions jsonb not null default '{}'::jsonb,
  requires_approval boolean not null default false,
  approvers_required int not null default 1,
  enabled boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper to avoid RLS recursion on workspace_members
create or replace function public.is_workspace_member(_workspace uuid, _user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace and user_id = _user
  )
$$;

create or replace function public.workspace_role(_workspace uuid, _user uuid)
returns public.member_role
language sql stable security definer set search_path = public
as $$
  select role from public.workspace_members
  where workspace_id = _workspace and user_id = _user
  limit 1
$$;

-- Auto-add creator as owner
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
after insert on public.workspaces
for each row execute function public.handle_new_workspace();

-- updated_at trigger for policies
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists policies_touch on public.policies;
create trigger policies_touch
before update on public.policies
for each row execute function public.touch_updated_at();

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.policies enable row level security;

-- workspaces
create policy "members can view workspaces" on public.workspaces
for select to authenticated
using (public.is_workspace_member(id, auth.uid()));

create policy "authenticated can create workspaces" on public.workspaces
for insert to authenticated
with check (created_by = auth.uid());

create policy "owners can update workspace" on public.workspaces
for update to authenticated
using (public.workspace_role(id, auth.uid()) = 'owner');

create policy "owners can delete workspace" on public.workspaces
for delete to authenticated
using (public.workspace_role(id, auth.uid()) = 'owner');

-- workspace_members
create policy "members can view members" on public.workspace_members
for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "self insert own membership" on public.workspace_members
for insert to authenticated
with check (user_id = auth.uid());

create policy "owners manage members" on public.workspace_members
for all to authenticated
using (public.workspace_role(workspace_id, auth.uid()) = 'owner')
with check (public.workspace_role(workspace_id, auth.uid()) = 'owner');

create policy "self can leave" on public.workspace_members
for delete to authenticated
using (user_id = auth.uid());

-- policies
create policy "members view policies" on public.policies
for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "members create policies" on public.policies
for insert to authenticated
with check (
  public.is_workspace_member(workspace_id, auth.uid())
  and created_by = auth.uid()
);

create policy "members update policies" on public.policies
for update to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "members delete policies" on public.policies
for delete to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));
