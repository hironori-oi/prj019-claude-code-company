-- =============================================================================
-- @clawbridge/dashboard — 0001_dashboard_init.sql
-- 透明性ダッシュボード MVP 雛形 (DEC-019-033 ③ / DEC-019-055 α / Round 8)
--
-- 配置:
--   - 雛形段階 (Round 8): projects/PRJ-019/app/dashboard/migrations/
--   - W1 実装本番化:      projects/PRJ-019/app/supabase/migrations/ に正規移動
--                          (ファイル名は 20260526_dashboard_init.sql 等にリネーム)
--
-- 既存 migrations との関係:
--   - 0001_hitl_requests / 0002_audit_log / 0005_proposals / 0009_cost_ledger_v2
--     をすべて参照する。本 SQL は read-side の view + 集計 cache のみ追加し、
--     既存 table の構造は破壊しない。
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. transparency_audit_log
--   既存 audit_log から PII redaction + Open Claw thought_trace + intermediate_output
--   を正規化したストリーム。Dashboard SSE が読み取る単一 source。
--   既存 audit_log への trigger で複製 (W1 で trigger 関数本体実装)。
-- -----------------------------------------------------------------------------
create table if not exists public.transparency_audit_log (
  id              bigserial primary key,
  origin_id       bigint not null,                 -- 既存 audit_log.id への参照 (FK は W1 で追加)
  ts              timestamptz not null default now(),
  type            text not null,                   -- spawn / hitl_decision / spend / proposal_lifecycle / kill_switch / ban_drill / other
  source          text not null,                   -- harness / openclaw-runtime / claude-bridge / orchestrator / sandbox / other
  proposal_id     uuid,                            -- proposals.id への soft ref (FK は W1 で追加)
  payload         jsonb not null default '{}'::jsonb,
                                                    -- payload schema (PII redaction 済):
                                                    --   thought_trace?     : string  (Open Claw 推論ログ)
                                                    --   intermediate_output?: string | jsonb
                                                    --   subprocess_name?   : text
                                                    --   approved?          : boolean
                                                    --   action_type?       : text
                                                    --   risk?              : text
                                                    --   spend_amount_usd?  : numeric
                                                    --   ...其他
  pii_redacted    boolean not null default false,  -- HITL 第 11 種 knowledge_pii_review 適用済か
  hash            text,                            -- 既存 audit_log.hash を複製 (改ざん検知用)

  constraint transparency_audit_log_type_chk check (type in (
    'spawn', 'spawn_timeout', 'kill_switch', 'hitl_decision',
    'ban_drill', 'spend', 'proposal_lifecycle', 'other'
  )),
  constraint transparency_audit_log_source_chk check (source in (
    'harness', 'openclaw-runtime', 'claude-bridge', 'orchestrator', 'sandbox', 'other'
  ))
);

create index if not exists transparency_audit_log_ts_idx
  on public.transparency_audit_log (ts desc);

create index if not exists transparency_audit_log_proposal_idx
  on public.transparency_audit_log (proposal_id, ts desc)
  where proposal_id is not null;

create index if not exists transparency_audit_log_type_source_idx
  on public.transparency_audit_log (type, source, ts desc);

comment on table public.transparency_audit_log is
  'Open Claw 行動 / 思考 / 中間出力 / コストの SSE 配信用ストリーム (DEC-019-033 ③ / dashboard MVP)';

-- -----------------------------------------------------------------------------
-- 2. cost_snapshot
--   1 分単位の cost 集計 cache (subscription 推定 + API 実績 + watchdog tier)
--   - 既存 cost_ledger_v2 を素直に集計するだけだと毎リクエスト重いため cache 化
--   - W1 で pg_cron で 1 分毎 refresh する想定 (本 Round では table 雛形のみ)
-- -----------------------------------------------------------------------------
create table if not exists public.cost_snapshot (
  id                       bigserial primary key,
  snapshot_ts              timestamptz not null default now(),

  -- API 実績 (Anthropic spend cap $30/月、DEC-019-050)
  api_daily_usd            numeric(10,4) not null default 0,
  api_monthly_usd          numeric(10,4) not null default 0,

  -- Subscription 推定 (Claude Max $200 + Codex Pro $200 = $400/月、DEC-019-051)
  subscription_monthly_usd numeric(10,4) not null default 0,

  -- 4 層ハードキャップ最大値 (cost-tracker.ts BudgetLimits 由来)
  per_session_max_usd      numeric(10,4),
  per_project_max_usd      numeric(10,4),

  -- G-04 watchdog 3 段階 tier (cost-tracker.ts WatchdogTier)
  watchdog_tier            text,                -- warn / auto_stop / hard_fail / null

  -- 月次総額 (api_monthly_usd + subscription_monthly_usd)
  monthly_total_usd        numeric(10,4) generated always as
    (api_monthly_usd + subscription_monthly_usd) stored,

  constraint cost_snapshot_watchdog_chk check (
    watchdog_tier is null or watchdog_tier in ('warn', 'auto_stop', 'hard_fail')
  )
);

create index if not exists cost_snapshot_ts_idx on public.cost_snapshot (snapshot_ts desc);

comment on table public.cost_snapshot is
  '1 分単位 cost 集計 cache (Dashboard 表示項目 (4) コスト累積、DEC-019-033 ③)';

-- -----------------------------------------------------------------------------
-- 3. proposal_queue (view)
--   既存 proposals の status='pending_hitl9' のみ Dashboard 用に整形
--   SLA 残時間 (KICKOFF_SLA_MS = 72h, hitl-kickoff-gate.ts) を SQL 側で計算
-- -----------------------------------------------------------------------------
create or replace view public.proposal_queue as
select
  p.id                                                        as proposal_id,
  p.tenant_id,
  p.need_id,
  p.status,
  p.summary,
  p.target_effect,
  p.estimated_cost_usd,
  p.dev_period_days,
  p.knowledge_refs,
  p.recommended_action,
  p.hitl_9_request_id,
  p.created_at,
  -- 72h SLA (KICKOFF_SLA_MS) からの残時間 (ms)
  greatest(0, extract(epoch from
    (p.created_at + interval '72 hours') - now()
  ) * 1000)::bigint                                           as sla_remaining_ms,
  case
    when p.created_at + interval '72 hours' <= now() then 'expired'
    when p.created_at + interval '66 hours' <= now() then 'critical'  -- 残 6h 以下 = 警告色
    else 'on_track'
  end                                                         as sla_status
from public.proposals p
where p.status = 'pending_hitl9';

comment on view public.proposal_queue is
  'HITL 第 9 種 dev_kickoff_approval 待ち提案一覧 (Dashboard 表示項目 (6))';

-- -----------------------------------------------------------------------------
-- 4. hitl_pending (view)
--   既存 hitl_requests から status='pending' を gate 種別別に集計
--   滞留 percentile (p50/p90/p99) は本 Round では view 内 NULL (W1 で実装)
-- -----------------------------------------------------------------------------
create or replace view public.hitl_pending as
select
  h.gate_type                                                 as gate,
  count(*)                                                    as pending_count,
  min(h.created_at)                                           as oldest_created_at,
  max(now() - h.created_at)                                   as oldest_pending_age,
  -- 雛形段階では SLA 残時間の算出を gate ごとの timeout_ms に依存させる必要があるため
  -- W1 で関数化する。雛形では NULL placeholder を返す。
  null::bigint                                                as oldest_sla_remaining_ms,
  null::numeric                                               as p50_pending_age_ms,
  null::numeric                                               as p90_pending_age_ms,
  null::numeric                                               as p99_pending_age_ms
from public.hitl_requests h
where h.status = 'pending'
group by h.gate_type;

comment on view public.hitl_pending is
  'HITL 滞留件数 + 平均 SLA (Dashboard 表示項目 (5)、雛形段階 percentile は W1 で実装)';

-- -----------------------------------------------------------------------------
-- RLS ポリシー (Owner 唯一 email 制限) — 雛形宣言のみ、実 enforcement は W1 で
-- -----------------------------------------------------------------------------
alter table public.transparency_audit_log enable row level security;
alter table public.cost_snapshot enable row level security;

-- 雛形段階では「全拒否」の安全側 default を入れておく。
-- W1 で OWNER_NOTIFY_EMAIL 一致 + service_role のみ許可するポリシーを追加する。
drop policy if exists transparency_audit_log_default_deny on public.transparency_audit_log;
create policy transparency_audit_log_default_deny
  on public.transparency_audit_log
  for all
  using (false);

drop policy if exists cost_snapshot_default_deny on public.cost_snapshot;
create policy cost_snapshot_default_deny
  on public.cost_snapshot
  for all
  using (false);

-- -----------------------------------------------------------------------------
-- W1 引き継ぎ TODO (本 SQL 内に明示):
--   1. transparency_audit_log への trigger 関数追加 (audit_log INSERT で自動複製 + PII redaction)
--   2. cost_snapshot を pg_cron で 1 分毎 refresh
--   3. hitl_pending view の percentile 計算を SQL function 化
--   4. Owner email 一致 RLS policy 追加 (current_setting('request.jwt.claims', true) 経由)
--   5. transparency_audit_log.origin_id / proposal_id に FK 制約追加
-- -----------------------------------------------------------------------------
