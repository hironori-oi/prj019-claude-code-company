-- =============================================================================
-- RLS: knowledge_extraction_queue
-- DEC-019-033 §④ + HITL 11 knowledge_pii_review
-- =============================================================================

alter table public.knowledge_extraction_queue enable row level security;
alter table public.knowledge_extraction_queue force row level security;

drop policy if exists ke_queue_tenant_isolation on public.knowledge_extraction_queue;
create policy ke_queue_tenant_isolation
  on public.knowledge_extraction_queue
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists ke_queue_select_observers on public.knowledge_extraction_queue;
create policy ke_queue_select_observers
  on public.knowledge_extraction_queue
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

drop policy if exists ke_queue_update_owner on public.knowledge_extraction_queue;
create policy ke_queue_update_owner
  on public.knowledge_extraction_queue
  for update
  using (coalesce(auth.jwt() ->> 'role', '') = 'owner')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'owner');

revoke insert, delete on public.knowledge_extraction_queue from anon, authenticated;
