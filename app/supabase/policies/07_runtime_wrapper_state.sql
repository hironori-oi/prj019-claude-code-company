-- =============================================================================
-- RLS: runtime_wrapper_state
-- =============================================================================

alter table public.runtime_wrapper_state enable row level security;
alter table public.runtime_wrapper_state force row level security;

drop policy if exists rw_state_tenant_isolation on public.runtime_wrapper_state;
create policy rw_state_tenant_isolation
  on public.runtime_wrapper_state
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists rw_state_select_observers on public.runtime_wrapper_state;
create policy rw_state_select_observers
  on public.runtime_wrapper_state
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

revoke insert, update, delete on public.runtime_wrapper_state from anon, authenticated;
