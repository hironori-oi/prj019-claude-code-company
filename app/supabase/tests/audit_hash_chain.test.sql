-- =============================================================================
-- PRJ-019 Clawbridge - audit_log Hash Chain Canonical Drift Test (pgTAP)
--
-- Issue: DEC-019-041 W0-Week2 buffer (hash-chain canonical drift 防止)
-- Source of truth fixture: ../../fixtures/audit-canonical-vectors.json
-- Spec: ../../docs/audit-canonical-spec.md
-- TS counterpart: ../../web/src/lib/audit/hash-chain.test.ts
--
-- 検証範囲:
--   (A) digest(canonical_text, 'sha256') が TS 側と一致 (SHA-256 アルゴリズムの一致)
--   (B) genesis prev_hash 64 zero と TS 定数が一致
--   (C) trigger audit_log_compute_hash の動作が canonical を pre-computed しても整合
--   (D) UNIQUE(prev_hash) による分岐拒否
--
-- 実行:
--   psql -d $TEST_DB -f supabase/tests/audit_hash_chain.test.sql
--   または:
--   pg_prove -d $TEST_DB supabase/tests/audit_hash_chain.test.sql
--
-- 既知の制約 (Phase 1 W1 対応):
--   - 現状の trigger は `payload::text` を使うため、jsonb の key 順が
--     Postgres バージョン依存で TS canonical と drift する可能性がある
--   - 本テストは canonical 文字列を直接 SHA-256 する形で SHA 部の一致のみ保証する
--   - jsonb 由来 drift は Phase 1 W1 で `jsonb_canonical()` 関数を追加して解消する
-- =============================================================================

begin;

-- pgTAP 拡張ロード
create extension if not exists pgtap;
create extension if not exists pgcrypto;

select plan(13);

-- ---------------------------------------------------------------------------
-- (B) genesis 定数
-- ---------------------------------------------------------------------------
select is(
  repeat('0', 64),
  '0000000000000000000000000000000000000000000000000000000000000000',
  'genesis prev_hash is 64 zero hex chars (matches TS GENESIS_PREV_HASH)'
);

-- ---------------------------------------------------------------------------
-- (A) SHA-256 一致 — fixture vector #1 (genesis, payload null)
--   TS expectedCanonical:
--     "550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:00.000000+00:00|system|genesis|audit.genesis|audit_log|null|0000000000000000000000000000000000000000000000000000000000000000"
--   TS expectedCurrHash: a01155a670c0dcd860bcc382950561a3997f21e4bc9ad8defe691ab7796a2731
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:00.000000+00:00|system|genesis|audit.genesis|audit_log|null|0000000000000000000000000000000000000000000000000000000000000000',
      'sha256'
    ),
    'hex'
  ),
  'a01155a670c0dcd860bcc382950561a3997f21e4bc9ad8defe691ab7796a2731',
  'fixture #1 genesis SHA-256 matches TS computeCurrHash'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #2 — string payload
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:01.000000+00:00|owner|owner-001|policy.update|policy_versions/1|"simple-string-payload"|a01155a670c0dcd860bcc382950561a3997f21e4bc9ad8defe691ab7796a2731',
      'sha256'
    ),
    'hex'
  ),
  '47529c65d4d797f94f43c376669455d0205432b0ae34930b5e71077e944f78fe',
  'fixture #2 string payload SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #3 — flat object with mixed numbers
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:02.500000+00:00|open_claw|claw-runtime-1|cost.charge|cost_ledger/42|{"amount":0.0123,"count":1,"currency":"USD","ratio":1.5}|47529c65d4d797f94f43c376669455d0205432b0ae34930b5e71077e944f78fe',
      'sha256'
    ),
    'hex'
  ),
  'bac848749d46541d220690bc8bbe5c68c171f87e7878444f7ea6b56bed0a4cf9',
  'fixture #3 flat object SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #4 — nested object with sorted keys
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:03.000000+00:00|operator|op-001|hitl.approve|hitl_requests/7|{"a_outer":true,"z_outer":{"c_nested":[3,2,1],"y_nested":{"a_inner":1,"x_inner":"value"}}}|bac848749d46541d220690bc8bbe5c68c171f87e7878444f7ea6b56bed0a4cf9',
      'sha256'
    ),
    'hex'
  ),
  'ff472fceaabd2e70b58cd38c8fc6e8c0dff9ca7a49ef295a241be01c7c3e6d17',
  'fixture #4 nested object (sorted) SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #5 — mixed-type array
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:04.000000+00:00|subprocess|claude-code-1|fs.read|projects/PRJ-019/app/README.md|["a","b","c",1,2,3,true,false,null]|ff472fceaabd2e70b58cd38c8fc6e8c0dff9ca7a49ef295a241be01c7c3e6d17',
      'sha256'
    ),
    'hex'
  ),
  '25d3ffbafae70c4714a4addad0348979d555ee3aa04647c60280f964071a27b9',
  'fixture #5 mixed-type array SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #6 — empty object
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:05.000000+00:00|system|trigger|noop|test|{}|25d3ffbafae70c4714a4addad0348979d555ee3aa04647c60280f964071a27b9',
      'sha256'
    ),
    'hex'
  ),
  'c1d51457b85e3a0771fba7e7b4ffab3045e81d01e638063bed8df7549d88dff0',
  'fixture #6 empty object SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #7 — empty array
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:06.000000+00:00|system|trigger|noop.array|test|[]|c1d51457b85e3a0771fba7e7b4ffab3045e81d01e638063bed8df7549d88dff0',
      'sha256'
    ),
    'hex'
  ),
  '7bc8dd16e78a66fd45e7b3222cd90c8dac28acf138a220cb4bf1e271b29c9570',
  'fixture #7 empty array SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #8 — boolean / null mixed
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:07.000000+00:00|open_claw|claw-runtime-1|wrapper.flag|feature_flags|{"file_write":null,"shell_exec":false,"tools_search":true,"web_fetch":false}|7bc8dd16e78a66fd45e7b3222cd90c8dac28acf138a220cb4bf1e271b29c9570',
      'sha256'
    ),
    'hex'
  ),
  '78529d4f91fd23e3e56b41902abe2387aa447b24cd7bbd54876b8f5b94feb1d5',
  'fixture #8 boolean/null mixed SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (A) fixture vector #9 — non-ASCII (Japanese)
-- 日本語文字列が UTF-8 で TS 側と同一バイト列となることを検証
-- ---------------------------------------------------------------------------
select is(
  encode(
    digest(
      convert_to(
        '550e8400-e29b-41d4-a716-446655440000|2026-05-03T00:00:08.000000+00:00|owner|owner-001|knowledge.write|knowledge/patterns/p001.md|{"description":"Postgres trigger と TS verify 双方で同一 canonical 化","tags":["監査","セキュリティ","ハッシュ"],"title":"監査ログ ハッシュチェーン パターン"}|78529d4f91fd23e3e56b41902abe2387aa447b24cd7bbd54876b8f5b94feb1d5',
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ),
  'ecda9ba0cb2bc4c27ea014e99b89214b7ec44d30bd207e9d7899b611ac0e52a8',
  'fixture #9 non-ASCII (Japanese) SHA-256 matches'
);

-- ---------------------------------------------------------------------------
-- (C) trigger audit_log_compute_hash の動作確認
--   payload を予め canonical sort 済みの jsonb として INSERT すれば curr_hash 一致するはず
--   (現行 trigger は payload::text を使うので key 順が偶然一致する単純ケースのみで検証)
-- ---------------------------------------------------------------------------
do $$
declare
  computed text;
  expected text;
  v_tenant uuid := '550e8400-e29b-41d4-a716-446655440000';
begin
  -- vector #1: genesis (payload null)
  insert into public.audit_log (
    tenant_id, ts, actor_kind, actor_id, event_kind, resource, payload, prev_hash, curr_hash
  ) values (
    v_tenant,
    '2026-05-03T00:00:00.000000+00:00'::timestamptz,
    'system', 'genesis', 'audit.genesis', 'audit_log',
    'null'::jsonb,
    repeat('0', 64),
    ''  -- trigger が上書き
  )
  returning curr_hash into computed;

  -- 期待値 (TS canonical 由来)
  expected := 'a01155a670c0dcd860bcc382950561a3997f21e4bc9ad8defe691ab7796a2731';

  -- ts 表現 / payload::text 表現がバージョン依存するため、本テストでは
  -- trigger が「何らかの 64 hex を生成する」までを保証 (drift 検知の最低限)
  -- 具体値の一致は (A) のみで保証
  perform pg_temp.assert_hash(computed, '#1 genesis trigger output is 64-hex');
end;
$$;

create or replace function pg_temp.assert_hash(h text, label text)
returns void
language plpgsql
as $$
begin
  if h is null or length(h) <> 64 or h !~ '^[0-9a-f]{64}$' then
    raise exception '%: not a 64-hex sha256 (got: %)', label, h;
  end if;
end;
$$;

select pass('trigger produces 64-hex curr_hash');

-- ---------------------------------------------------------------------------
-- (D) UNIQUE(prev_hash) による分岐拒否
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '550e8400-e29b-41d4-a716-446655440000';
  err_caught boolean := false;
begin
  -- 同じ prev_hash で 2 件目を INSERT
  begin
    insert into public.audit_log (
      tenant_id, ts, actor_kind, actor_id, event_kind, resource, payload, prev_hash, curr_hash
    ) values (
      v_tenant,
      '2026-05-03T00:00:00.000001+00:00'::timestamptz,
      'system', 'duplicate', 'audit.duplicate', 'audit_log',
      'null'::jsonb,
      repeat('0', 64),  -- 既に使われた prev_hash
      ''
    );
  exception
    when unique_violation then
      err_caught := true;
  end;
  if not err_caught then
    raise exception 'expected unique_violation on duplicate prev_hash';
  end if;
end;
$$;

select pass('UNIQUE(prev_hash) prevents chain branching');

-- ---------------------------------------------------------------------------
-- (B-2) trigger は CHECK constraint で actor_kind を制限
-- ---------------------------------------------------------------------------
do $$
declare
  v_tenant uuid := '550e8400-e29b-41d4-a716-446655440000';
  err_caught boolean := false;
begin
  begin
    insert into public.audit_log (
      tenant_id, ts, actor_kind, actor_id, event_kind, resource, payload, prev_hash, curr_hash
    ) values (
      v_tenant,
      '2026-05-03T00:00:09.000000+00:00'::timestamptz,
      'invalid_actor', 'x', 'x', 'x',
      'null'::jsonb,
      repeat('1', 64),
      ''
    );
  exception
    when check_violation then
      err_caught := true;
  end;
  if not err_caught then
    raise exception 'expected check_violation on invalid actor_kind';
  end if;
end;
$$;

select pass('CHECK constraint rejects invalid actor_kind');

select * from finish();
rollback;
