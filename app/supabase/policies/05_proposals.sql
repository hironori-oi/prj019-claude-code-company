-- =============================================================================
-- RLS: proposals
-- DEC-019-033 §② proposal-gen → HITL 9 / Owner can approve/reject
-- =============================================================================

alter table public.proposals enable row level security;
alter table public.proposals force row level security;

drop policy if exists proposals_tenant_isolation on public.proposals;
create policy proposals_tenant_isolation
  on public.proposals
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists proposals_select_observers on public.proposals;
create policy proposals_select_observers
  on public.proposals
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

drop policy if exists proposals_update_owner on public.proposals;
create policy proposals_update_owner
  on public.proposals
  for update
  using (coalesce(auth.jwt() ->> 'role', '') = 'owner')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'owner');

revoke insert, delete on public.proposals from anon, authenticated;
