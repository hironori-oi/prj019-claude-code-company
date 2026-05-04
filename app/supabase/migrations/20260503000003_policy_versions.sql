-- =============================================================================
-- PRJ-019 Clawbridge - policy_versions
-- DEC-019-033 §⑤ Owner-only write / 7 category granular policy
--
-- 7 categories: fs / command / network / hitl / cost / time / genre
-- Owner UI (別 OAuth context) のみ INSERT 許可、Open Claw subprocess は SELECT 不可。
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.policy_versions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  version_no      bigint not null,
  category        text not null,
  policy_doc      jsonb not null,
  is_active       boolean not null default false,
  created_by      uuid not null,
  created_at      timestamptz not null default now(),
  activated_at    timestamptz,

  constraint policy_category_chk check (category in (
    'fs',
    'command',
    'network',
    'hitl',
    'cost',
    'time',
    'genre'
  )),
  constraint policy_version_unique unique (tenant_id, category, version_no)
);

create unique index if not exists policy_versions_active_uidx
  on public.policy_versions (tenant_id, category)
  where is_active = true;

create index if not exists policy_versions_created_idx
  on public.policy_versions (tenant_id, category, created_at desc);

comment on table public.policy_versions is '7-category Open Claw policy versions (DEC-019-033 §⑤)';
comment on column public.policy_versions.category is 'fs / command / network / hitl / cost / time / genre';
comment on column public.policy_versions.policy_doc is 'JSON document, schema in app/policies/casbin/policy.csv (mirror)';
