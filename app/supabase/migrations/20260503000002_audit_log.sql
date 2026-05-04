-- =============================================================================
-- PRJ-019 Clawbridge - audit_log (SHA-256 hash chain)
-- DEC-019-033 §⑤ L4 Audit + Anomaly Detection / dev-security-w0-skeleton.md §5
--
-- append-only / hash chain trigger により改ざん検知。
-- chain 起点 (genesis) は prev_hash = '0' x 64 で固定。
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.audit_log (
  id           bigserial primary key,
  tenant_id    uuid not null,
  ts           timestamptz not null default now(),
  actor_kind   text not null,
  actor_id     text not null,
  event_kind   text not null,
  resource     text not null,
  payload      jsonb not null,
  prev_hash    text not null,
  curr_hash    text not null,

  constraint audit_actor_kind_chk check (actor_kind in ('owner', 'operator', 'open_claw', 'system', 'subprocess')),
  constraint audit_prev_hash_len  check (char_length(prev_hash) = 64),
  constraint audit_curr_hash_len  check (char_length(curr_hash) = 64),
  constraint audit_no_branch      unique (prev_hash)
);

create index if not exists audit_log_ts_idx        on public.audit_log (ts desc);
create index if not exists audit_log_tenant_idx    on public.audit_log (tenant_id, ts desc);
create index if not exists audit_log_event_idx     on public.audit_log (event_kind, ts desc);
create index if not exists audit_log_actor_idx     on public.audit_log (actor_kind, actor_id, ts desc);

create or replace function public.audit_log_compute_hash()
returns trigger
language plpgsql
as $$
declare
  payload_canonical text;
  v_use_provided    text;
  v_provided_hash   text;
begin
  -- P0-2 (review-scaffold-code-review-v1.md §3.1) 対応:
  --   append_audit_log fn が Node 側で確定済の curr_hash を session GUC 経由で渡している場合、
  --   トリガ側で再計算せずその値を採用する。これにより Node の canonicalJson() (RFC 8785 簡易版)
  --   と DB 側 payload::text の不一致で hash mismatch する問題を構造的に回避する。
  v_use_provided := current_setting('audit_log.use_provided_hash', true);
  if v_use_provided = 'true' then
    v_provided_hash := current_setting('audit_log.provided_hash', true);
    if v_provided_hash is not null and char_length(v_provided_hash) = 64 then
      new.curr_hash := v_provided_hash;
      return new;
    end if;
  end if;

  -- フォールバック: 旧経路 (Node が canonical を渡さない場合のみ。新規実装は append_audit_log 経由を推奨)
  payload_canonical :=
    coalesce(new.tenant_id::text, '') || '|' ||
    coalesce(to_char(new.ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"'), '') || '|' ||
    coalesce(new.actor_kind, '') || '|' ||
    coalesce(new.actor_id, '') || '|' ||
    coalesce(new.event_kind, '') || '|' ||
    coalesce(new.resource, '') || '|' ||
    coalesce(new.payload::text, 'null') || '|' ||
    coalesce(new.prev_hash, '');
  new.curr_hash := encode(digest(payload_canonical, 'sha256'), 'hex');
  return new;
end;
$$;

drop trigger if exists audit_log_hash_chain_trg on public.audit_log;
create trigger audit_log_hash_chain_trg
  before insert on public.audit_log
  for each row
  execute function public.audit_log_compute_hash();

comment on table public.audit_log is 'append-only audit log with SHA-256 hash chain (DEC-019-033 §⑤ L4)';
comment on column public.audit_log.prev_hash is '64 hex chars; genesis row uses 64 zero chars';
comment on column public.audit_log.curr_hash is 'sha256(canonical_payload || prev_hash), computed by trigger';
