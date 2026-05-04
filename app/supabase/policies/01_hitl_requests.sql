-- =============================================================================
-- RLS: hitl_requests
-- DEC-019-033 §⑤ / dev-security-w0-skeleton.md §6
--   - tenant isolation via auth.jwt() ->> 'tenant_id'
--   - INSERT: orchestrator (service role) only via SECURITY DEFINER fn (not direct)
--   - SELECT: pending = operator+, approved/rejected = owner + requester
--   - UPDATE: owner only (decision_at / decision_reason / status / approved_by)
--   - DELETE: prohibited (append-only spirit; cancel = status update)
-- =============================================================================

alter table public.hitl_requests enable row level security;
alter table public.hitl_requests force row level security;

drop policy if exists hitl_requests_tenant_isolation on public.hitl_requests;
create policy hitl_requests_tenant_isolation
  on public.hitl_requests
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists hitl_requests_select_pending_operator on public.hitl_requests;
create policy hitl_requests_select_pending_operator
  on public.hitl_requests
  for select
  using (
    status = 'pending'
    and coalesce(auth.jwt() ->> 'role', '') in ('owner','operator')
  );

drop policy if exists hitl_requests_select_decided_owner on public.hitl_requests;
create policy hitl_requests_select_decided_owner
  on public.hitl_requests
  for select
  using (
    status <> 'pending'
    and (
      coalesce(auth.jwt() ->> 'role', '') = 'owner'
      or auth.uid() = requested_by
      or auth.uid() = approved_by
    )
  );

drop policy if exists hitl_requests_update_owner on public.hitl_requests;
create policy hitl_requests_update_owner
  on public.hitl_requests
  for update
  using (coalesce(auth.jwt() ->> 'role', '') = 'owner')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'owner');

revoke insert, delete on public.hitl_requests from anon, authenticated;
