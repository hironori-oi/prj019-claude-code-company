-- =============================================================================
-- PRJ-019 Clawbridge - cost_ledger v2
-- 出典: DEC-019-050 Anthropic API spend cap = $30/月 (二重防御 = アプリ層実装ガード)
--       DEC-019-031 月次 Spend Cap 構造 (cost_ledger 連携)
--       DEC-019-006 P-D 改 (subscription plan 主軸 + API key 補助用途)
--
-- 変更点:
--   1. 既存 cost_ledger に以下 column を追加 (すべて nullable / DEFAULT 付与で互換維持):
--        provider          text NOT NULL DEFAULT 'anthropic'
--        model             text
--        request_tokens    int
--        response_tokens   int
--        cost_usd          numeric(10,4)
--        month_year        text  -- YYYY-MM (UTC)
--   2. 月次集計 view  monthly_spend_summary
--   3. RPC function   get_current_month_spend()       (open_claw_restricted 可)
--   4. RPC function   get_daily_spend(target_date)    (spike detection 用)
--
-- 注意:
--   - 既存 source_kind 列挙値 ('anthropic_subscription' 等) はそのまま維持
--   - amount_usd は legacy column として保持、新規 cost_usd と二重管理 (移行期)
--   - tenant_id は RLS で隔離 (既存 policy を維持)
--   - service_role 以外の role 用 grant は最後にまとめて行う
-- =============================================================================

-- --- 1. column 追加 -----------------------------------------------------------

alter table public.cost_ledger
  add column if not exists provider        text not null default 'anthropic',
  add column if not exists model           text,
  add column if not exists request_tokens  int,
  add column if not exists response_tokens int,
  add column if not exists cost_usd        numeric(10,4),
  add column if not exists month_year      text;

-- check constraints (既存 source_kind chk と整合)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cost_provider_chk'
  ) then
    alter table public.cost_ledger
      add constraint cost_provider_chk check (provider in (
        'anthropic',
        'openai',
        'codex',
        'supabase',
        'vercel',
        'sandbox',
        'misc'
      ));
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cost_tokens_nonneg_chk'
  ) then
    alter table public.cost_ledger
      add constraint cost_tokens_nonneg_chk check (
        (request_tokens  is null or request_tokens  >= 0) and
        (response_tokens is null or response_tokens >= 0) and
        (cost_usd        is null or cost_usd        >= 0)
      );
  end if;
end$$;

-- 月次集計を高速化するための index
create index if not exists cost_ledger_month_year_idx
  on public.cost_ledger (tenant_id, month_year);

create index if not exists cost_ledger_provider_idx
  on public.cost_ledger (tenant_id, provider, ts desc);

-- 既存行に month_year を埋める (NULL のままだと get_current_month_spend が拾えない)
update public.cost_ledger
   set month_year = to_char(ts at time zone 'UTC', 'YYYY-MM')
 where month_year is null;

comment on column public.cost_ledger.provider        is 'API provider (anthropic | openai | codex | ...)';
comment on column public.cost_ledger.model           is 'model id (e.g. claude-3-7-sonnet-20250219)';
comment on column public.cost_ledger.request_tokens  is 'Anthropic request (input) tokens';
comment on column public.cost_ledger.response_tokens is 'Anthropic response (output) tokens';
comment on column public.cost_ledger.cost_usd        is 'computed cost (USD) for this single call (numeric(10,4))';
comment on column public.cost_ledger.month_year      is 'UTC month bucket (YYYY-MM), monthly cap key (DEC-019-050)';

-- --- 2. monthly_spend_summary view -------------------------------------------

create or replace view public.monthly_spend_summary as
select
  tenant_id,
  month_year,
  provider,
  count(*)                                      as call_count,
  coalesce(sum(cost_usd), 0)::numeric(12,4)     as total_cost_usd,
  coalesce(sum(request_tokens), 0)::bigint      as total_request_tokens,
  coalesce(sum(response_tokens), 0)::bigint     as total_response_tokens,
  min(ts)                                       as first_call_at,
  max(ts)                                       as last_call_at
from public.cost_ledger
where month_year is not null
group by tenant_id, month_year, provider;

comment on view public.monthly_spend_summary is
  'monthly spend aggregation by tenant + provider (DEC-019-050 Anthropic cap monitoring)';

-- --- 3. RPC: get_current_month_spend() ---------------------------------------

create or replace function public.get_current_month_spend()
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(cost_usd), 0)::numeric(12,4)
    from public.cost_ledger
   where provider   = 'anthropic'
     and month_year = to_char(now() at time zone 'UTC', 'YYYY-MM');
$$;

comment on function public.get_current_month_spend() is
  'current month Anthropic spend (USD) — used by budget-guard.ts (DEC-019-050)';

-- --- 4. RPC: get_daily_spend(target_date) -----------------------------------

create or replace function public.get_daily_spend(target_date date)
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(cost_usd), 0)::numeric(12,4)
    from public.cost_ledger
   where provider = 'anthropic'
     and ts >= (target_date::timestamptz)
     and ts <  ((target_date + interval '1 day')::timestamptz);
$$;

comment on function public.get_daily_spend(date) is
  'daily Anthropic spend (UTC) — used for spike detection (DEC-019-050)';

-- --- 5. grants (open_claw_restricted role が SELECT 可能に) -------------------
-- role 未作成環境 (Pre-Phase 1) でも fail しないように DO ブロックで guard
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'open_claw_restricted') then
    execute 'grant select on public.monthly_spend_summary to open_claw_restricted';
    execute 'grant execute on function public.get_current_month_spend() to open_claw_restricted';
    execute 'grant execute on function public.get_daily_spend(date) to open_claw_restricted';
  end if;
end$$;

-- service_role 用 grant (本番でも明示)
grant select on public.monthly_spend_summary       to service_role;
grant execute on function public.get_current_month_spend() to service_role;
grant execute on function public.get_daily_spend(date)     to service_role;
