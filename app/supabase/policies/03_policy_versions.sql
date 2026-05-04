-- =============================================================================
-- RLS: policy_versions
-- DEC-019-033 §⑤ Owner-only write (priviledge escalation prevention 核心)
--   - INSERT/UPDATE: owner role のみ (UI 経由の別 OAuth context)
--   - SELECT: owner + open_claw_restricted DB role (Casbin loader が読み取り専用)
--   - DELETE: 完全禁止
-- =============================================================================

alter table public.policy_versions enable row level security;
alter table public.policy_versions force row level security;

drop policy if exists policy_versions_tenant_isolation on public.policy_versions;
create policy policy_versions_tenant_isolation
  on public.policy_versions
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists policy_versions_select_observers on public.policy_versions;
create policy policy_versions_select_observers
  on public.policy_versions
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator','open_claw_restricted'));

drop policy if exists policy_versions_insert_owner on public.policy_versions;
create policy policy_versions_insert_owner
  on public.policy_versions
  for insert
  with check (coalesce(auth.jwt() ->> 'role', '') = 'owner');

drop policy if exists policy_versions_update_owner on public.policy_versions;
create policy policy_versions_update_owner
  on public.policy_versions
  for update
  using (coalesce(auth.jwt() ->> 'role', '') = 'owner')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'owner');

revoke delete on public.policy_versions from anon, authenticated;

-- open_claw_restricted role は SELECT only
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'open_claw_restricted') then
    create role open_claw_restricted nologin;
  end if;
end$$;

grant select on public.policy_versions to open_claw_restricted;
revoke insert, update, delete on public.policy_versions from open_claw_restricted;
