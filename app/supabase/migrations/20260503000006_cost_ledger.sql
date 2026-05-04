-- =============================================================================
-- PRJ-019 Clawbridge - cost_ledger
-- harness G-01 cost / Spend Cap 連動 / 月次 $300 ハードキャップ (DEC-019-031)
-- =============================================================================

create table if not exists public.cost_ledger (
  id            bigserial primary key,
  tenant_id     uuid not null,
  ts            timestamptz not null default now(),
  scope         text not null,
  scope_ref     text,
  amount_usd    numeric(10,4) not null,
  source_kind   text not null,
  proposal_id   uuid,
  description   text,

  constraint cost_scope_chk check (scope in ('monthly','proposal','task','spawn')),
  constraint cost_source_chk check (source_kind in (
    'anthropic_subscription',
    'codex_subscription',
    'supabase',
    'vercel',
    'sandbox',
    'misc'
  )),
  constraint cost_amount_nonneg check (amount_usd >= 0)
);

create index if not exists cost_ledger_tenant_ts_idx on public.cost_ledger (tenant_id, ts desc);
create index if not exists cost_ledger_scope_idx     on public.cost_ledger (tenant_id, scope, ts desc);
create index if not exists cost_ledger_proposal_idx  on public.cost_ledger (proposal_id);

comment on table public.cost_ledger is 'all monetary spend events, joined to monthly Spend Cap (DEC-019-031)';
