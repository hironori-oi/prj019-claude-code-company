-- =============================================================================
-- PRJ-019 Clawbridge - runtime_wrapper_state
-- dev-openclaw-runtime-wrapper.md §3-4 / CircuitBreaker / FeatureFlag / VersionPin
-- =============================================================================

create table if not exists public.runtime_wrapper_state (
  id                bigserial primary key,
  tenant_id         uuid not null,
  ts                timestamptz not null default now(),
  source            text not null,
  circuit_state     text not null default 'closed',
  feature_flags     jsonb not null default '{}'::jsonb,
  pinned_version    text,
  upstream_version  text,
  drift             text,
  last_breaking     jsonb,
  cooldown_until    timestamptz,

  constraint rw_source_chk check (source in ('anthropic','openai','openclaw','enderfga')),
  constraint rw_circuit_chk check (circuit_state in ('closed','open','half-open')),
  constraint rw_drift_chk   check (drift is null or drift in ('none','patch','minor','major'))
);

create index if not exists runtime_wrapper_state_source_ts_idx
  on public.runtime_wrapper_state (tenant_id, source, ts desc);

create unique index if not exists runtime_wrapper_state_current_uidx
  on public.runtime_wrapper_state (tenant_id, source, ts);

comment on table public.runtime_wrapper_state is 'CircuitBreaker / FeatureFlag / VersionPin snapshots, polled every 6h';
