-- =============================================================================
-- RLS: policy_audit_log (append-only)
-- =============================================================================

alter table public.policy_audit_log enable row level security;
alter table public.policy_audit_log force row level security;

drop policy if exists policy_audit_log_tenant_isolation on public.policy_audit_log;
create policy policy_audit_log_tenant_isolation
  on public.policy_audit_log
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists policy_audit_log_select_observers on public.policy_audit_log;
create policy policy_audit_log_select_observers
  on public.policy_audit_log
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

revoke insert, update, delete on public.policy_audit_log from anon, authenticated;
