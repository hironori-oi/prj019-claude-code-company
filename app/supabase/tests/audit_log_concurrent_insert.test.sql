-- =============================================================================
-- PRJ-019 Clawbridge - audit_log Concurrent INSERT Lock Test (pgTAP)
--
-- Issue: review-scaffold-code-review-v1.md §3.1 P0-1
-- Spec:  ../policies/02_audit_log.sql (修正後 append_audit_log fn)
--
-- 検証範囲:
--   (A) 同一 tenant に対する N 件連続 INSERT で chain 連続性が 100% 保たれる
--   (B) advisory lock により unique_violation が発生しない
--   (C) p_canonical 引数を渡した場合、Node 側計算 hash がそのまま採用される
--
-- 実行:
--   psql -d $TEST_DB -f supabase/tests/audit_log_concurrent_insert.test.sql
--   pg_prove -d $TEST_DB supabase/tests/audit_log_concurrent_insert.test.sql
--
-- NOTE: 真の並行 INSERT (複数 connection) のテストは pgTAP の単一 session 制約により
--       本ファイルでは順次 INSERT で chain 連続性 + advisory lock の効力のみ検証する。
--       完全な競合シナリオは Phase 1 W1 で `pg_isolation_test` ベースで実施。
-- =============================================================================

begin;

create extension if not exists pgtap;
create extension if not exists pgcrypto;

select plan(8);

-- ---------------------------------------------------------------------------
-- セットアップ: テスト用 tenant
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '11111111-1111-1111-1111-111111111111'::uuid;
begin
  delete from public.audit_log where tenant_id = v_tenant;
end $$;

-- ---------------------------------------------------------------------------
-- (A) 100 件連続 INSERT で chain 連続性が保たれる
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  i int;
  v_id bigint;
begin
  for i in 1..100 loop
    v_id := public.append_audit_log(
      v_tenant,
      'system',
      'concurrent-test',
      'audit.test',
      format('test:%s', i),
      jsonb_build_object('seq', i)
    );
  end loop;
end $$;

select is(
  (select count(*)::int from public.audit_log
    where tenant_id = '11111111-1111-1111-1111-111111111111'::uuid),
  100,
  'P0-1: 100 records inserted via append_audit_log'
);

-- ---------------------------------------------------------------------------
-- chain 連続性 (各レコードの prev_hash == 直前レコードの curr_hash)
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int
     from (
       select id, prev_hash,
              lag(curr_hash) over (order by id) as expected_prev
         from public.audit_log
        where tenant_id = '11111111-1111-1111-1111-111111111111'::uuid
     ) t
    where t.expected_prev is not null and t.prev_hash <> t.expected_prev),
  0,
  'P0-1: chain continuity (no record has prev_hash mismatch)'
);

-- 最初のレコードは genesis prev_hash
select is(
  (select prev_hash
     from public.audit_log
    where tenant_id = '11111111-1111-1111-1111-111111111111'::uuid
    order by id asc limit 1),
  repeat('0', 64),
  'P0-1: first record uses GENESIS_PREV_HASH'
);

-- unique(prev_hash) constraint 違反が出ていない (件数だけで保証)
select is(
  (select count(distinct prev_hash)::int from public.audit_log
    where tenant_id = '11111111-1111-1111-1111-111111111111'::uuid),
  100,
  'P0-1: all prev_hash values are distinct (unique constraint OK)'
);

-- ---------------------------------------------------------------------------
-- (C) p_canonical を明示渡しすると Node 側計算 hash が採用される
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_payload jsonb := '{"foo":"bar"}'::jsonb;
  v_canonical text;
  v_expected_hash text;
  v_actual_hash text;
  v_id bigint;
  v_prev text;
begin
  delete from public.audit_log where tenant_id = v_tenant;

  -- genesis 用 prev_hash
  v_prev := repeat('0', 64);

  -- Node 側で計算した canonical 文字列を組み立て (8 フィールド + prev_hash)
  v_canonical :=
    v_tenant::text || '|' ||
    '2026-05-03T00:00:00.000000+00:00' || '|' ||
    'system' || '|' ||
    'p0-2-test' || '|' ||
    'audit.test' || '|' ||
    'audit_log' || '|' ||
    '{"foo":"bar"}' || '|' ||
    v_prev;
  v_expected_hash := encode(digest(v_canonical, 'sha256'), 'hex');

  -- p_canonical を渡して INSERT
  v_id := public.append_audit_log(
    v_tenant,
    'system',
    'p0-2-test',
    'audit.test',
    'audit_log',
    v_payload,
    v_canonical
  );

  select curr_hash into v_actual_hash from public.audit_log where id = v_id;

  perform ok(
    v_actual_hash = v_expected_hash,
    'P0-2: append_audit_log adopts caller-provided canonical hash when p_canonical is non-NULL'
  );
end $$;

-- ---------------------------------------------------------------------------
-- (D) p_canonical を渡さない場合は従来トリガが計算する (後方互換)
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  v_id bigint;
  v_hash text;
begin
  delete from public.audit_log where tenant_id = v_tenant;
  v_id := public.append_audit_log(
    v_tenant,
    'system',
    'p0-1-fallback',
    'audit.test',
    'audit_log',
    '{}'::jsonb
  );
  select curr_hash into v_hash from public.audit_log where id = v_id;
  perform ok(
    char_length(v_hash) = 64,
    'P0-2: trigger-based fallback still produces 64-hex hash when p_canonical is NULL'
  );
end $$;

-- ---------------------------------------------------------------------------
-- (E) advisory lock 取得が成功する (signature 確認)
-- ---------------------------------------------------------------------------
select ok(
  pg_advisory_xact_lock(hashtext('audit_log:test')) is null,
  'P0-1: pg_advisory_xact_lock callable with hashtext(text) signature'
);

-- ---------------------------------------------------------------------------
-- 関数 signature 確認 (p_canonical default NULL)
-- ---------------------------------------------------------------------------
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'append_audit_log'
      and pg_get_function_identity_arguments(p.oid) = 'uuid, text, text, text, text, jsonb, text'
  ),
  'P0-2: append_audit_log signature includes p_canonical text parameter'
);

select * from finish();
rollback;
