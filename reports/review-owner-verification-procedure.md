# PRJ-019 — Owner ローカル環境 動作検証手順

最終更新: 2026-05-03 / 起案: Review 部門 / 対象: Dev + Owner + 5/8 検収会議

位置付け: Dev が修正した P0 finding 4 件 + scaffold 全体に対する Owner ローカル環境動作検証手順。`review-p0-rereview-protocol.md` Step 3 (Owner 動作確認、T+24h-T+48h) と完全連動。Owner が並行作業の一環として 90 分以内で実施し、Phase 1 着手前 readiness を 95% → 99% へ押し上げる。CLI / SQL / UI 操作レベルで具体的に書き下す。

連動: `review-p0-rereview-protocol.md` §2.4 (Step 3) / `review-scaffold-code-review-v1.md` §3.1 / `review-ban-drill-3-scenario.md` §2 / `review-r019-15-mitigation-plan-v2.md` §2 (4 層防御)
連動 DEC: DEC-019-033 §⑤ (4 層防御) / DEC-019-042 (5/22 期限) / DEC-019-038 (Node 24.11.1)
連動 ODR: OG-04 / OG-05

---

## 目次

| § | 題目 |
|---|---|
| §1 | 検証目標 (4 観点) |
| §2 | 検証 1: Casbin policy keyMatch4 実機 (13 ケース) |
| §3 | 検証 2: audit_log SHA-256 hash chain (5 vector × SQL/TS) |
| §4 | 検証 3: RLS Policy (5 テーブル × 4 操作 = 20 ケース) |
| §5 | 検証 4: kill switch (Dashboard → Permissions → KillSwitch、5 秒以内) |
| §6 | 各検証の入力 / 期待出力 / 失敗時 trace 取得手順 |
| §7 | Owner 検証結果報告テンプレ |
| §8 | 検証総工数見積 + readiness 寄与 |

---

## §1 検証目標

### §1.1 4 観点 + 対応 P0

| 観点 | 検証対象 | 対応 P0 | 4 層防御層 |
|---|---|---|---|
| 検証 1 | Casbin policy keyMatch4 実機動作 (13 prohibited domains 全ロール deny) | P0-3 / P0-4 | L1 Casbin |
| 検証 2 | audit_log SHA-256 hash chain (canonical drift 確認、改ざん検知) | P0-1 / P0-2 | L3 Hash Chain |
| 検証 3 | RLS Policy 効果 (open_claw_restricted role でのアクセス遮断) | 横断 (P0-3 / P0-4 + 既存 RLS) | L2 RLS |
| 検証 4 | kill switch 即時遮断 (5 秒以内に全 API 503) | 横断 (緊急停止) | 全層共通 |

### §1.2 検証環境前提条件

| 項目 | 内容 |
|---|---|
| OS | Owner 利用 PC (Mac / Windows / Linux いずれか、Owner ローカル) |
| Node | 24.11.1 (DEC-019-038) — `node --version` で確認 |
| pnpm | 9.12.0 |
| Postgres CLI | `psql` 15+ (Supabase staging 接続用) |
| ブラウザ | Chrome 132+ または Firefox 134+ |
| Supabase staging URL | Dev から事前共有 (Slack DM 経由) |
| service_role key (staging) | Dev から事前共有、検証完了後 90 分以内に Owner 側で破棄 |
| open_claw_restricted JWT (staging) | Dev が事前生成、Slack DM 経由で共有 |
| 検証実施時刻 | Owner 都合に合わせて 90 分連続枠を 1 回確保 |

### §1.3 検証開始前の準備 (Owner、5 分)

```bash
# 1. リポジトリ最新化
cd ~/Desktop/claude-code-company
git checkout main
git pull origin main

# 2. P0 修正 PR を取得 (Dev から PR 番号を共有される前提)
git fetch origin
git checkout fix/p0-1-advisory-lock  # Dev 指定のブランチ
pnpm install --frozen-lockfile

# 3. 環境変数準備 (Owner ローカル ~/.env.local.staging に staging 接続情報)
export STAGING_DB_URL="postgresql://postgres:<pwd>@db.<project>.supabase.co:5432/postgres"
export STAGING_SUPABASE_URL="https://<project>.supabase.co"
export STAGING_ANON_KEY="<anon key>"
export RESTRICTED_JWT="<open_claw_restricted JWT>"

# 4. psql 接続確認
psql "$STAGING_DB_URL" -c "select now();"
# 期待: 現在時刻が返る
```

---

## §2 検証 1: Casbin policy keyMatch4 実機 (P0-3 / P0-4)

### §2.1 検証目的

Dev-A (Casbin 修正担当) の partial 残課題を解消する。P0-3 (`?(...)` glob 非対応) + P0-4 (13 prohibited domains role 限定) の修正後、Casbin enforcer が 13 ケースで全ロール対象に deny を返すことを実機確認。

### §2.2 検証手順 (15 分)

#### Step 1: Casbin enforcer test 実行

```bash
cd app/web  # scaffold 配置場所
pnpm test:casbin-matrix -- --grep="prohibited-domains"
# 期待: 39 cases (13 deny × 3 role) 全 pass
```

#### Step 2: 13 ケース個別確認 (interactive)

```bash
node -e "
import('casbin').then(async ({ newEnforcer }) => {
  const e = await newEnforcer('app/policies/casbin/model.conf', 'app/policies/casbin/policy.csv');
  const roles = ['owner', 'operator', 'open_claw_restricted'];
  const deny_objects = [
    'genre:adult', 'genre:csam', 'genre:weapon', 'genre:drug',
    'genre:extremism', 'genre:piracy', 'genre:hacking', 'genre:phishing',
    'genre:scam', 'genre:hate', 'genre:harassment', 'genre:political-manip',
    'genre:fake-news'
  ];
  for (const role of roles) {
    for (const obj of deny_objects) {
      const allowed = await e.enforce(role, obj, 'read');
      console.log(\`\${role} / \${obj} / read => \${allowed ? 'ALLOW(NG)' : 'DENY(OK)'}\`);
    }
  }
});
"
# 期待: 39 行全て "DENY(OK)"
```

#### Step 3: P0-3 修正確認 (curl http URL deny)

```bash
node -e "
import('casbin').then(async ({ newEnforcer }) => {
  const e = await newEnforcer('app/policies/casbin/model.conf', 'app/policies/casbin/policy.csv');
  const cases = [
    ['open_claw_restricted', 'command:curl http://example.com', 'exec', false],
    ['open_claw_restricted', 'command:curl https://api.openai.com', 'exec', false],
    ['open_claw_restricted', 'command:rm -rf /', 'exec', false],
  ];
  for (const [s, o, a, expected] of cases) {
    const allowed = await e.enforce(s, o, a);
    console.log(\`\${s} / \${o} / \${a} => \${allowed === expected ? 'OK' : 'NG'} (got=\${allowed}, expected=\${expected})\`);
  }
});
"
# 期待: 3 行全て "OK"
```

### §2.3 入力 / 期待出力

| 入力 | 期待出力 | NG 時の trace |
|---|---|---|
| 13 deny × 3 role = 39 ケース | 全 DENY(OK) | NG ケースの role / obj / 実際の判定値を console.log で記録 |
| curl http://* (restricted_role) | DENY(OK) | 同上 |
| curl https://api.openai.com (restricted_role) | DENY(OK) | 同上 |
| rm -rf / (restricted_role) | DENY(OK) | 同上 |

### §2.4 失敗時 trace 取得

```bash
# 1. policy.csv 内容ダンプ
cat app/policies/casbin/policy.csv

# 2. Casbin enforcer 内部状態 trace
DEBUG=casbin:* node -e "..."  # 上記 Step 2 と同じ

# 3. Slack DM (Owner → CEO → Review) に上記 3 出力を貼付
```

---

## §3 検証 2: audit_log SHA-256 hash chain (P0-1 / P0-2)

### §3.1 検証目的

P0-1 (ロック競合) + P0-2 (canonical drift) の修正後、Node 側 (TS) と DB 側 (Postgres trigger) で生成する hash が完全一致することを 5 vector で確認、改ざん検知が機能することを確認。

### §3.2 検証手順 (25 分)

#### Step 1: 5 vector の round-trip (Node → DB)

```bash
cd app/web
cat > /tmp/hash-chain-verify.ts <<'EOF'
import { canonicalize, sha256Hex } from "./src/lib/audit/hash-chain";
import { Client } from "pg";

const vectors = [
  { name: "empty_obj", payload: {} },
  { name: "array_only", payload: [1, 2, 3, "a"] },
  { name: "nested", payload: { a: { b: { c: [1, 2] } }, x: "y" } },
  { name: "unicode", payload: { msg: "日本語テスト 🎌", emoji: "🔥" } },
  { name: "numeric_edge", payload: { i: 9007199254740991, f: 1.5e-10, neg: -0 } },
];

const client = new Client({ connectionString: process.env.STAGING_DB_URL });
await client.connect();

for (const v of vectors) {
  const canonical = canonicalize(v.payload);
  const nodeHash = sha256Hex(canonical);

  const r = await client.query(
    `select sha256_hex(canonicalize($1::jsonb)) as db_hash`,
    [JSON.stringify(v.payload)]
  );
  const dbHash = r.rows[0].db_hash;

  const ok = nodeHash === dbHash;
  console.log(`${v.name}: node=${nodeHash.slice(0,16)}.. db=${dbHash.slice(0,16)}.. ${ok ? "OK" : "NG"}`);
}
await client.end();
EOF

pnpm tsx /tmp/hash-chain-verify.ts
# 期待: 5 行全て "OK"
```

#### Step 2: append_audit_log 並行 INSERT (P0-1 ロック検証)

```bash
psql "$STAGING_DB_URL" <<'EOF'
-- 並行 INSERT 100 件を 4 セッション で実行 (advisory lock 効果確認)
do $$
begin
  perform append_audit_log(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test_concurrent',
    jsonb_build_object('idx', generate_series, 'session', 'sess_a'),
    'owner'
  ) from generate_series(1, 25);
end $$;
EOF

# 別ターミナルで同時実行 (sess_b / sess_c / sess_d)
# (Owner 環境で 4 ターミナル開く方法が困難な場合は xargs 並列で代替)
seq 1 4 | xargs -P 4 -I{} psql "$STAGING_DB_URL" -c "..." 

# 結果確認
psql "$STAGING_DB_URL" -c "
  select count(*) as total,
         count(distinct curr_hash) as distinct_hashes,
         count(*) - 1 as expected_chain_links
  from audit_log
  where event_kind = 'test_concurrent';
"
# 期待: total = 100, distinct_hashes = 100 (重複なし), chain links = 99
```

#### Step 3: chain 連続性検証

```bash
psql "$STAGING_DB_URL" <<'EOF'
-- chain 切断検出: 各 row の prev_hash が前 row の curr_hash と一致するか
with chain as (
  select id, prev_hash, curr_hash,
         lag(curr_hash) over (partition by tenant_id order by id) as expected_prev
  from audit_log
  where tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    and event_kind = 'test_concurrent'
)
select count(*) filter (where prev_hash != expected_prev and expected_prev is not null) as broken_links,
       count(*) as total
from chain;
-- 期待: broken_links = 0
EOF
```

#### Step 4: 改ざん検知 (verifyChain)

```bash
# 故意に 1 行 改ざん
psql "$STAGING_DB_URL" -c "
  update audit_log set payload = '{\"tampered\": true}'::jsonb
  where id = (select min(id) from audit_log where event_kind = 'test_concurrent');
"

# verifyChain で検出
pnpm tsx -e "
import { verifyChain } from './src/lib/audit/hash-chain';
import { Client } from 'pg';
const c = new Client({ connectionString: process.env.STAGING_DB_URL });
await c.connect();
const { rows } = await c.query(\"select * from audit_log where event_kind = 'test_concurrent' order by id\");
const result = verifyChain(rows);
console.log('verifyChain result:', result);
// 期待: { ok: false, brokenAt: <id>, reason: 'hash_mismatch' }
await c.end();
"
```

#### Step 5: cleanup (検証 row 削除)

```bash
psql "$STAGING_DB_URL" -c "
  -- audit_log は append-only のため SECURITY DEFINER 不要、staging のみ許可される delete を実行
  -- (production では絶対禁止、staging 環境でのみ削除可能な専用 fn を Dev が事前用意)
  select cleanup_test_audit_logs('00000000-0000-0000-0000-000000000001'::uuid, 'test_concurrent');
"
```

### §3.3 入力 / 期待出力

| Step | 入力 | 期待出力 | NG 時の trace |
|---|---|---|---|
| 1 | 5 vector × Node/DB | 5 行 OK | NG vector の Node hash + DB hash + canonical 文字列を全記録 |
| 2 | 100 並行 INSERT | total=100, distinct=100 | duplicate 発生時の prev_hash + curr_hash を記録 |
| 3 | chain 連続性 | broken_links=0 | broken row の id + 前 row の curr_hash を記録 |
| 4 | 改ざん 1 行 | verify ok=false, brokenAt=<id> | reason 詳細 + DB row の payload diff |
| 5 | cleanup | row 削除完了 | — |

### §3.4 失敗時 trace 取得

```bash
# audit_log の関連 row 全ダンプ
psql "$STAGING_DB_URL" -c "
  select id, ts, event_kind, prev_hash, curr_hash, payload
  from audit_log
  where event_kind in ('test_concurrent', 'hash_chain_lock_timeout', 'tampering_attempt')
  order by id
" > /tmp/audit_log_dump.txt

# Slack DM に添付
```

---

## §4 検証 3: RLS Policy (5 テーブル × 4 操作 = 20 ケース)

### §4.1 検証目的

open_claw_restricted role での DB アクセスが意図通りに deny されることを 5 主要テーブル × 4 操作で確認。L2 RLS 防御層の物理動作確認。

### §4.2 5 テーブル × 4 操作マトリクス

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `policy_versions` | allow (read) | **deny** | **deny** | **deny** |
| `policy_audit_log` | allow (read) | **deny** | **deny** | **deny** |
| `audit_log` | allow (read) | **deny** (SECURITY DEFINER fn 経由のみ) | **deny** | **deny** |
| `proposals` | allow (own) | allow (HITL propose) | **deny** (status 遷移は Owner のみ) | **deny** |
| `hitl_requests` | allow (own) | allow (SECURITY DEFINER fn 経由) | **deny** (Owner only) | **deny** |

合計: 20 ケース (5 テーブル × 4 操作)

### §4.3 検証手順 (20 分)

#### Step 1: open_claw_restricted JWT で Supabase REST 接続テスト

```bash
# Supabase REST API 経由で各テーブルへ INSERT/UPDATE/DELETE 試行
# JWT は Dev から事前共有

for table in policy_versions policy_audit_log audit_log proposals hitl_requests; do
  echo "=== $table ==="

  # SELECT (期待: 200 / RLS 内データのみ)
  curl -s -o /dev/null -w "SELECT %{http_code}\n" \
    -H "Authorization: Bearer $RESTRICTED_JWT" \
    -H "apikey: $STAGING_ANON_KEY" \
    "$STAGING_SUPABASE_URL/rest/v1/$table?limit=1"

  # INSERT (期待: 401 / 403)
  curl -s -o /dev/null -w "INSERT %{http_code}\n" \
    -X POST \
    -H "Authorization: Bearer $RESTRICTED_JWT" \
    -H "apikey: $STAGING_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"tenant_id":"00000000-0000-0000-0000-000000000001","dummy":"x"}' \
    "$STAGING_SUPABASE_URL/rest/v1/$table"

  # UPDATE (期待: 401 / 403)
  curl -s -o /dev/null -w "UPDATE %{http_code}\n" \
    -X PATCH \
    -H "Authorization: Bearer $RESTRICTED_JWT" \
    -H "apikey: $STAGING_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"dummy":"y"}' \
    "$STAGING_SUPABASE_URL/rest/v1/$table?id=eq.1"

  # DELETE (期待: 401 / 403)
  curl -s -o /dev/null -w "DELETE %{http_code}\n" \
    -X DELETE \
    -H "Authorization: Bearer $RESTRICTED_JWT" \
    -H "apikey: $STAGING_ANON_KEY" \
    "$STAGING_SUPABASE_URL/rest/v1/$table?id=eq.1"
done
```

#### Step 2: 結果集計表

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| policy_versions | __ | __ | __ | __ |
| policy_audit_log | __ | __ | __ | __ |
| audit_log | __ | __ | __ | __ |
| proposals | __ | __ | __ | __ |
| hitl_requests | __ | __ | __ | __ |

各セルに HTTP status code を記入。

#### Step 3: 期待値との照合

| 操作 | 期待 status | 違反時の意味 |
|---|---|---|
| SELECT (policy_versions / policy_audit_log / audit_log) | 200 | open_claw_restricted の read-only 確認、200 以外なら RLS が過剰 deny |
| INSERT/UPDATE/DELETE (全 5 テーブル) | 401 / 403 / 42501 | 200 や 201 が返ったら **RLS 突破 = Critical**、即時 escalation |
| SELECT (proposals / hitl_requests) | 200 (own のみ) または 200 (空配列) | 他 tenant の row が見えたら RLS 突破 |

#### Step 4: 補助検証 (psql 直接、open_claw_restricted role)

```bash
# Postgres role 切替 (staging 環境のみ可、production では deny)
psql "$STAGING_DB_URL" <<'EOF'
set role open_claw_restricted;
-- 全 deny 確認
insert into policy_versions (tenant_id, version_no, category, policy_doc, is_active, created_by)
values ('00000000-0000-0000-0000-000000000001'::uuid, 999, 'genre',
        '{"deny_list": []}'::jsonb, true, '00000000-0000-0000-0000-000000000099'::uuid);
-- 期待: ERROR: permission denied for table policy_versions (42501)

delete from audit_log where id = 1;
-- 期待: ERROR: permission denied for table audit_log

reset role;
EOF
```

### §4.4 入力 / 期待出力

| 入力 | 期待出力 | NG 時の trace |
|---|---|---|
| REST INSERT × 5 テーブル | 全 401/403 (deny) | 200/201 が返ったテーブル + payload + status を全記録 |
| REST UPDATE × 5 テーブル | 全 401/403 | 同上 |
| REST DELETE × 5 テーブル | 全 401/403 | 同上 |
| psql set role + INSERT/DELETE | 全 ERROR 42501 | NG 操作の SQL + 結果を記録 |

### §4.5 失敗時 trace 取得

```bash
# 1. RLS Policy 全ダンプ
psql "$STAGING_DB_URL" -c "
  select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies
  where tablename in ('policy_versions', 'policy_audit_log', 'audit_log', 'proposals', 'hitl_requests');
" > /tmp/rls_policies_dump.txt

# 2. open_claw_restricted role の grant 状況
psql "$STAGING_DB_URL" -c "
  select grantee, table_name, privilege_type
  from information_schema.role_table_grants
  where grantee = 'open_claw_restricted';
" > /tmp/restricted_grants.txt

# 3. Slack DM (Owner → CEO → Review) に 2 ファイル添付 + 結果集計表
```

---

## §5 検証 4: kill switch (5 秒以内に全 API 503)

### §5.1 検証目的

緊急停止経路として、Owner が UI で kill switch を押下後、5 秒以内に全 Open Claw 関連 API endpoint が 503 を返すことを確認。R-019-15 mitigation の最終防衛線として全層共通の即時遮断機能。

### §5.2 検証手順 (15 分)

#### Step 1: scaffold 起動 (Owner ローカル)

```bash
cd app/web
pnpm dev
# 期待: http://localhost:3000 で起動
```

#### Step 2: ベースライン確認 (kill switch 押下前)

```bash
# 別ターミナルで
curl -s -o /dev/null -w "HITL list: %{http_code}\n" \
  -H "Authorization: Bearer <owner JWT>" \
  "http://localhost:3000/api/hitl"
# 期待: 200

curl -s -o /dev/null -w "Proposals list: %{http_code}\n" \
  -H "Authorization: Bearer <owner JWT>" \
  "http://localhost:3000/api/proposals"
# 期待: 200

curl -s -o /dev/null -w "Spawn: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer <owner JWT>" \
  -H "Content-Type: application/json" \
  -d '{"task":"test"}' \
  "http://localhost:3000/api/openclaw/spawn"
# 期待: 200 (または 202 accepted)
```

#### Step 3: kill switch UI 押下 (Owner 操作)

```
1. ブラウザで http://localhost:3000/dashboard を開く
2. Owner 認証 (1Password TOTP MFA) でログイン
3. ヘッダ右の "Permissions" メニューを開く
4. "Kill Switch" ボタンを押下 (赤色、警告アイコン付き)
5. 確認モーダルで "Confirm Kill" を押下
6. モーダル消失後の表示 = "Kill Switch ARMED" (ヘッダに常時表示)
7. 押下時刻を記録 (ミリ秒精度、例: 14:23:05.123)
```

#### Step 4: 5 秒以内の API 503 確認

```bash
# 押下時刻 t0 から 5 秒以内に複数 API が 503 を返すか
START_TIME=$(date +%s.%N)
for i in {1..10}; do
  curl -s -o /dev/null -w "[$(date +%H:%M:%S.%3N)] HITL: %{http_code} / Proposals: " \
    -H "Authorization: Bearer <owner JWT>" \
    "http://localhost:3000/api/hitl"
  curl -s -o /dev/null -w "%{http_code} / Spawn: " \
    -H "Authorization: Bearer <owner JWT>" \
    "http://localhost:3000/api/proposals"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST \
    -H "Authorization: Bearer <owner JWT>" \
    -H "Content-Type: application/json" \
    -d '{"task":"test"}' \
    "http://localhost:3000/api/openclaw/spawn"
  sleep 0.5
done
```

期待出力:
```
[14:23:05.500] HITL: 503 / Proposals: 503 / Spawn: 503
[14:23:06.000] HITL: 503 / Proposals: 503 / Spawn: 503
... (以下全 503)
```

押下時刻 14:23:05.123 から最初の 503 までの遅延 ≤ 5 秒であることを確認。

#### Step 5: kill switch 解除 + 復旧確認

```
1. UI で "Disarm Kill Switch" 押下 (Owner only、cool-down 30 秒)
2. 30 秒待機後、再度 API 200 が返ることを確認
```

```bash
sleep 30
curl -s -o /dev/null -w "HITL: %{http_code}\n" \
  -H "Authorization: Bearer <owner JWT>" \
  "http://localhost:3000/api/hitl"
# 期待: 200
```

### §5.3 入力 / 期待出力

| 入力 | 期待出力 | NG 時の trace |
|---|---|---|
| kill switch 押下前の API call | 200 | 503 が返るなら kill switch が誤起動中 |
| kill switch 押下後 0-5 秒 | 全 API 503 (HITL / Proposals / Spawn 含む 3 endpoint 以上) | 5 秒経過後も 200 が返るなら kill switch 機能不全 |
| kill switch 押下後 5 秒以降 | 全 API 503 維持 | 200 が混ざるなら propagation 不完全 |
| disarm 後 30 秒経過 | 全 API 200 | 503 残存なら disarm 機能不全 |

### §5.4 失敗時 trace 取得

```bash
# 1. kill switch state を DB から確認
psql "$STAGING_DB_URL" -c "
  select * from runtime_wrapper_state
  where source = 'kill_switch'
  order by ts desc
  limit 5;
"

# 2. Next.js dev server log を全保存
# (pnpm dev のターミナル log を /tmp/nextjs-dev.log に redirect 済の前提)

# 3. ブラウザ DevTools Network タブで kill switch 押下時の API call 記録 (HAR export)
```

---

## §6 各検証の入力 / 期待出力 / 失敗時 trace 取得手順 (まとめ)

### §6.1 入力 / 期待出力 一覧

| 検証 | 主要入力 | 主要期待出力 | 検証時間 |
|---|---|---|---|
| 1: Casbin | 39 ケース (13 deny × 3 role) + curl http/https/rm | 全 DENY(OK) | 15 分 |
| 2: Hash chain | 5 vector + 100 並行 INSERT + 1 改ざん | round-trip OK + chain 連続 + 改ざん検出 | 25 分 |
| 3: RLS | 20 ケース (5 テーブル × 4 操作) | 全 deny (allow は read-only のみ) | 20 分 |
| 4: Kill switch | UI 押下 + 10 API call | 5 秒以内全 503 | 15 分 |

### §6.2 失敗時 trace 取得手順 (共通)

| ステップ | 内容 |
|---|---|
| 1 | NG 発生時の console / curl 出力を即時 `/tmp/owner-verify-NG-<検証番号>.txt` に保存 |
| 2 | DB 関連は psql で該当テーブル / policy / audit_log の dump を取得 (`/tmp/db-trace-<番号>.txt`) |
| 3 | UI 関連はブラウザ DevTools Console + Network タブのスクリーンショット (`/tmp/ui-trace-<番号>.png`) |
| 4 | Slack DM (Owner → CEO → Review、`#prj-019-review` channel) で上記 3 種を添付 + Markdown でサマリ |
| 5 | Review が即時応答 (中央値 30 分以内)、再修正 or 設計再検討の判断 |

### §6.3 検証ログ命名規則

| ファイル | 用途 |
|---|---|
| `/tmp/owner-verify-1-casbin.txt` | 検証 1 の console 出力 |
| `/tmp/owner-verify-2-hashchain.txt` | 検証 2 の console + SQL 結果 |
| `/tmp/owner-verify-3-rls.txt` | 検証 3 の HTTP status マトリクス |
| `/tmp/owner-verify-4-killswitch.txt` | 検証 4 の API call timeline |
| `/tmp/owner-verify-summary.md` | 4 検証統合報告 (§7 テンプレ準拠) |

---

## §7 Owner 検証結果報告テンプレ (CEO 経由で Review 部門へ提出)

### §7.1 提出形式

| 項目 | 内容 |
|---|---|
| ファイル名 | `projects/PRJ-019/reports/owner-verify-result-YYYYMMDD.md` |
| 提出先 | CEO (Slack DM) → Review 部門 (`#prj-019-review`) |
| 提出期限 | 検証完了から 4 時間以内 |
| 添付 | §6.3 の 4 ファイル + 必要に応じて DevTools HAR export |

### §7.2 テンプレ本文

```markdown
# PRJ-019 — Owner ローカル動作検証結果報告

最終更新: YYYY-MM-DD HH:MM / 起案: Owner / 提出先: CEO + Review 部門

連動: review-owner-verification-procedure.md / review-p0-rereview-protocol.md Step 3

## §1 実施サマリ

- 実施日時: YYYY-MM-DD HH:MM〜HH:MM (所要 XX 分)
- 環境: Owner ローカル PC (OS: ___, Node: ___) + Supabase staging
- 対象 PR: #XXXX (P0-N 修正)
- 結果: X/4 検証 PASS

## §2 検証別結果

### §2.1 検証 1: Casbin policy keyMatch4

- 39 deny ケース: <PASS / FAIL X 件>
- curl http/https/rm: <PASS / FAIL X 件>
- 詳細: /tmp/owner-verify-1-casbin.txt 添付
- 判定: PASS / FAIL

### §2.2 検証 2: audit_log SHA-256 hash chain

- 5 vector round-trip: <PASS / FAIL X 件>
- 100 並行 INSERT chain 連続性: <PASS / FAIL>
- 改ざん検知: <PASS / FAIL>
- 詳細: /tmp/owner-verify-2-hashchain.txt 添付
- 判定: PASS / FAIL

### §2.3 検証 3: RLS Policy

- 20 ケース (5 テーブル × 4 操作): <PASS / FAIL X 件>
- マトリクス表: (本書 §4.3 Step 2 表を埋戻し)
- 詳細: /tmp/owner-verify-3-rls.txt 添付
- 判定: PASS / FAIL

### §2.4 検証 4: kill switch

- 押下時刻: HH:MM:SS.mmm
- 最初の 503 観測時刻: HH:MM:SS.mmm
- 遅延: X.XX 秒 (期待 ≤ 5.00 秒)
- disarm 後復旧: <PASS / FAIL>
- 詳細: /tmp/owner-verify-4-killswitch.txt 添付
- 判定: PASS / FAIL

## §3 全体判定

- 4 検証 PASS: PASS (本日中に完全承認発行可能)
- 3 検証 PASS: 条件付き PASS (NG 検証の再修正後に再検証)
- 2 検証以下 PASS: NG (Phase 1 着手再延期検討)

## §4 NG 詳細 (発生時のみ)

| 検証 # | NG 項目 | 入力 | 実際の出力 | 期待出力 | trace ファイル |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## §5 Review 部門への要請

- (a) 即時再修正要請 / (b) 追加検証提案 / (c) 完全承認発行依頼

## §6 添付

- /tmp/owner-verify-*.txt (4 ファイル)
- /tmp/owner-verify-summary.md (本ファイル)
- DevTools HAR (検証 4 関連、必要に応じて)
```

### §7.3 Review 部門の受領後対応

| 結果 | 対応 SLA |
|---|---|
| 4/4 PASS | 4 時間以内に scaffold review v1 §3.1 表更新 + 完全承認発行検討 |
| 3/4 PASS | 8 時間以内に NG 検証の trace 解析 + Dev へ再修正要請 |
| 2/4 以下 | 即時 (1 時間以内) CEO escalation + 設計再検討会議招集 |

---

## §8 検証総工数見積 + readiness 寄与

### §8.1 工数内訳

| 検証 | 工数 |
|---|---|
| 準備 (§1.3) | 5 分 |
| 検証 1: Casbin | 15 分 |
| 検証 2: Hash chain | 25 分 |
| 検証 3: RLS | 20 分 |
| 検証 4: Kill switch | 15 分 |
| 報告書作成 (§7) | 10 分 |
| **合計** | **90 分** |

### §8.2 readiness への寄与

| 検証 完遂時 | readiness 寄与 |
|---|---|
| 検証 1 (Casbin) PASS | +1.5% (P0-3 / P0-4 物理動作確認) |
| 検証 2 (Hash chain) PASS | +1.5% (P0-1 / P0-2 物理動作確認) |
| 検証 3 (RLS) PASS | +0.5% (既存 RLS 補強確認) |
| 検証 4 (Kill switch) PASS | +0.5% (緊急遮断経路確認) |
| **4 検証 全 PASS** | **+4%** (95% → 99%) |

(`review-scaffold-final-acceptance-criteria.md` §3 と整合: P0 解決時 +5% / Owner 動作確認時 +3% / Casbin 実機 OK 時 +2% = 累計 +10% のうち、本検証は Owner 動作確認 +3% + Casbin 実機 +2% にほぼ相当の寄与を担う)

### §8.3 90 分以内に終わらない場合の縮減オプション

| シナリオ | 縮減内容 |
|---|---|
| Owner 多忙で 60 分しか確保不可 | 検証 1 + 検証 4 の 2 検証のみ実施 (合計 35 分) → readiness 寄与 +2%、検証 2 / 3 は Review 代替検証 |
| Owner 環境セットアップ未完 (psql 等) | 検証 4 (kill switch) のみ実施 (15 分) → readiness 寄与 +0.5%、残 3 検証は staging 環境で Review 代替 |

### §8.4 推奨実施タイミング

| タイミング | 想定 P0 修正状況 | 検証範囲 |
|---|---|---|
| **Phase A (5/5 火 EOD)** | P0-1 / P0-2 修正済 | 検証 2 のみ (25 分) |
| **Phase B (5/6 水 EOD)** | P0-3 / P0-4 修正済 | 検証 1 + 検証 3 + 検証 4 (50 分) |
| **Phase A+B 一気通貫 (5/7 木)** | 全 P0 修正済 | 全 4 検証 (90 分) — 推奨 |
| **5/22 期限直前 (5/21 水)** | 上記が間に合わない場合のフォールバック | 全 4 検証 (90 分) |

---

## 結論 + 次アクション

1. Owner ローカル動作検証は 4 観点 (Casbin / hash chain / RLS / kill switch) × 90 分以内で実施。
2. 検証 1 (Casbin) で 39 deny ケース + curl glob 実機確認、検証 2 (Hash chain) で 5 vector round-trip + 100 並行 INSERT + 改ざん検知、検証 3 (RLS) で 20 ケース全 deny、検証 4 (kill switch) で 5 秒以内 全 503。
3. 4 検証 全 PASS で Phase 1 着手 readiness を 95% → 99% へ押し上げ、5/8 検収会議で議決-2 を Conditional Go → 無条件 GO に格上げ可能。
4. 失敗時は §6.2 の trace 取得 + Slack DM 即時報告、Review 部門が SLA 内 (1-8 時間) で対応判断。
5. 5/7 (木) 一気通貫実施を推奨、フォールバックは 5/21 直前。

---

**v1 完成**: 2026-05-03 (Review 部門起案、Owner ローカル動作検証手順)
**次回更新**: 5/7 検証完遂後 (結果反映)、または 5/8 検収会議の結果反映、または検証手順の精度向上要請発生時

**根拠ファイル**: `review-p0-rereview-protocol.md` §2.4 / `review-scaffold-code-review-v1.md` §3.1 §4 / `review-ban-drill-3-scenario.md` §2 / `review-r019-15-mitigation-plan-v2.md` §2 §10 / `app/policies/casbin/{model.conf,policy.csv}` / `app/supabase/migrations/20260503000002_audit_log.sql` / `app/supabase/policies/0{1〜8}_*.sql` / `app/web/src/lib/audit/hash-chain.ts`
