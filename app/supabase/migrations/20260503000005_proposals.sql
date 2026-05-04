-- =============================================================================
-- PRJ-019 Clawbridge - proposals (Open Claw 提案テーブル)
-- DEC-019-033 §② proposal-gen → HITL 9 dev_kickoff_approval flow
-- 提案書テンプレ {(a) 概要 (b) ターゲット効果 (c) 想定コスト (d) ToS gray 判定
--                  (e) 開発期間 (f) 既存ナレッジ参照 (g) 推奨採否}
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.proposals (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null,
  need_id              text not null,
  status               text not null default 'draft',

  -- 提案書 7 セクション (DEC-019-033 §②)
  summary              text not null,
  target_effect        text not null,
  estimated_cost_usd   numeric(10,2) not null,
  tos_gray_judgment    jsonb not null,
  dev_period_days      integer not null,
  knowledge_refs       jsonb not null default '[]'::jsonb,
  recommended_action   text not null,

  -- HITL 9 ライフサイクル
  hitl_9_request_id    uuid,
  decision             text,
  decision_at          timestamptz,
  decision_reason      text,

  -- 実装連動 (承認後)
  impl_started_at      timestamptz,
  impl_completed_at    timestamptz,
  preview_url          text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint proposals_status_chk check (status in (
    'draft', 'pending_hitl9', 'approved', 'rejected', 'timeout',
    'impl_running', 'impl_completed', 'impl_failed', 'cancelled'
  )),
  constraint proposals_recommended_chk check (recommended_action in ('adopt', 'reject', 'defer')),
  constraint proposals_decision_chk check (decision is null or decision in ('approved','rejected','timeout'))
);

create unique index if not exists proposals_need_dedup_uidx
  on public.proposals (tenant_id, need_id)
  where status not in ('rejected', 'timeout', 'cancelled');

create index if not exists proposals_status_idx on public.proposals (tenant_id, status, created_at desc);

comment on table public.proposals is 'Open Claw generated proposals, fed into HITL 9 (DEC-019-033 §②)';
comment on column public.proposals.tos_gray_judgment is '{"verdict":"white|gray|black","evidence":[...]}';
