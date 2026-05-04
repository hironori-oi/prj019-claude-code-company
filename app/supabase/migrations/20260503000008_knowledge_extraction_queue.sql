-- =============================================================================
-- PRJ-019 Clawbridge - knowledge_extraction_queue
-- DEC-019-033 §④ + ODR-OG-06 / HITL 11 knowledge_pii_review 連動
-- 抽出 → 自動 PII redaction → HITL 11 二重チェック → organization/knowledge/ への反映
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.knowledge_extraction_queue (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null,
  source_project_id        text not null,
  source_path              text not null,
  extracted_content        text not null,
  pii_redacted_content     text not null,
  pii_categories           jsonb not null default '[]'::jsonb,
  target_subdir            text not null,
  status                   text not null default 'pending_pii_review',
  hitl_11_request_id       uuid,
  reviewed_by              uuid,
  reviewed_at              timestamptz,
  review_outcome           text,
  finalized_path           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint ke_target_subdir_chk check (target_subdir in ('patterns','decisions','pitfalls')),
  constraint ke_status_chk check (status in (
    'pending_pii_review',
    'approved',
    'rejected',
    'timeout',
    'finalized',
    'cancelled'
  )),
  constraint ke_review_outcome_chk check (review_outcome is null or review_outcome in (
    'approved', 'rejected', 'timeout'
  ))
);

create index if not exists ke_queue_status_idx on public.knowledge_extraction_queue (status, created_at);
create index if not exists ke_queue_tenant_idx on public.knowledge_extraction_queue (tenant_id, created_at desc);

comment on table public.knowledge_extraction_queue is 'knowledge extraction with PII review (HITL 11), DEC-019-033 §④';
comment on column public.knowledge_extraction_queue.target_subdir is 'organization/knowledge/{patterns|decisions|pitfalls}/';
