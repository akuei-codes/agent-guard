
-- Fix search_path on the one function missing it
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Lock down SECURITY DEFINER helpers — only authenticated users / triggers may call
revoke execute on function public.is_workspace_member(uuid, uuid) from public, anon;
revoke execute on function public.workspace_role(uuid, uuid) from public, anon;
revoke execute on function public.handle_new_workspace() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.workspace_role(uuid, uuid) to authenticated;
