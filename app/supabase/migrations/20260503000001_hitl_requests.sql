-- =============================================================================
-- PRJ-019 Clawbridge - hitl_requests
-- DEC-019-033 §② / §⑤ + DEC-020-003 / pm-v4-hitl-gates-9-10-11-wbs.md
--
-- 11 種 HITL Gate (1: network_external / 2: cost_threshold / 3: secret_access /
-- 4: prod_deploy / 5: unsafe_command / 6: tos_gray_review / 7: external_api /
-- 8: emergency_stop / 9: dev_kickoff_approval / 10: permission_change_review /
-- 11: knowledge_pii_review) のキューを単一テーブルで管理。
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.hitl_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  gate_kind       text not null,
  proposal_id     uuid,
  payload         jsonb not null,
  status          text not null default 'pending',
  default_action  text not null,
  sla_deadline    timestamptz not null,
  requested_by    uuid,
  approved_by     uuid,
  decision_at     timestamptz,
  decision_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint hitl_gate_kind_chk check (gate_kind in (
    'network_external',
    'cost_threshold',
    'secret_access',
    'prod_deploy',
    'unsafe_command',
    'tos_gray_review',
    'external_api',
    'emergency_stop',
    'dev_kickoff_approval',
    'permission_change_review',
    'knowledge_pii_review'
  )),
  constraint hitl_status_chk check (status in ('pending', 'approved', 'rejected', 'timeout', 'cancelled')),
  constraint hitl_default_action_chk check (default_action in ('reject', 'pause', 'approve'))
);

create index if not exists hitl_requests_status_idx on public.hitl_requests (status, sla_deadline);
create index if not exists hitl_requests_tenant_idx on public.hitl_requests (tenant_id, created_at desc);
create index if not exists hitl_requests_proposal_idx on public.hitl_requests (proposal_id);
create index if not exists hitl_requests_gate_kind_idx on public.hitl_requests (gate_kind, status);

comment on table public.hitl_requests is 'HITL approval queue, 11 gate kinds (DEC-019-033 + DEC-020-003)';
comment on column public.hitl_requests.gate_kind is 'enum 11: 1=network_external ... 11=knowledge_pii_review';
comment on column public.hitl_requests.payload is 'gate-specific zod-validated payload, see app/web/src/types/hitl.ts';
