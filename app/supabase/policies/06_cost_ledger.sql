-- =============================================================================
-- RLS: cost_ledger (append-only)
-- DEC-019-031 月次 $300 ハードキャップ連動
-- =============================================================================

alter table public.cost_ledger enable row level security;
alter table public.cost_ledger force row level security;

drop policy if exists cost_ledger_tenant_isolation on public.cost_ledger;
create policy cost_ledger_tenant_isolation
  on public.cost_ledger
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists cost_ledger_select_observers on public.cost_ledger;
create policy cost_ledger_select_observers
  on public.cost_ledger
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

revoke insert, update, delete on public.cost_ledger from anon, authenticated;
