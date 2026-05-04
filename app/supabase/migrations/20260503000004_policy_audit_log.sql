-- =============================================================================
-- PRJ-019 Clawbridge - policy_audit_log
-- DEC-019-033 §⑤ priviledge escalation prevention / HITL 10 trigger source
-- =============================================================================

create table if not exists public.policy_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  ts              timestamptz not null default now(),
  category        text not null,
  pre_version_id  uuid,
  post_version_id uuid,
  diff_json       jsonb not null,
  trigger_kind    text not null,
  changed_by      uuid not null,
  hitl_request_id uuid,

  constraint policy_audit_category_chk check (category in ('fs','command','network','hitl','cost','time','genre')),
  constraint policy_audit_trigger_chk check (trigger_kind in (
    'owner_manual',
    'backup_restore',
    'external_import',
    'auto_warning_rollback'
  ))
);

create index if not exists policy_audit_log_ts_idx       on public.policy_audit_log (tenant_id, ts desc);
create index if not exists policy_audit_log_category_idx on public.policy_audit_log (category, ts desc);
create index if not exists policy_audit_log_trigger_idx  on public.policy_audit_log (trigger_kind, ts desc);

comment on table public.policy_audit_log is 'every policy change is recorded here, fed into HITL 10 if non-owner_manual';
