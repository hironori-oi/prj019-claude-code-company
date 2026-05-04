# Audit Log Canonical Form Specification

**Issue**: hash-chain canonical drift 防止 (DEC-019-041 W0-Week2 buffer)
**起案**: 2026-05-03 (Dev 部門 A 担当)
**最終更新**: 2026-05-03

## 目的

`audit_log` テーブルの SHA-256 hash chain は **SQL trigger (Postgres)** と **TypeScript verify 関数 (Web 層)** の双方が
完全に同一の canonical 文字列を計算しない限り、全 chain が偽陽性で「改ざん検知」と誤報する。
本仕様書は両実装が drift しないための **正本** (single source of truth) である。

## scope

| レイヤ | ファイル | 役割 |
|---|---|---|
| Postgres | `supabase/migrations/20260503000002_audit_log.sql` (trigger `audit_log_compute_hash`) | INSERT 時に curr_hash を計算 |
| TypeScript | `web/src/lib/audit/hash-chain.ts` (`canonicalize`, `computeCurrHash`) | verify (Dashboard 表示) で curr_hash を再計算 |
| Test fixture | `fixtures/audit-canonical-vectors.json` | 双方の round-trip 一致性を検証する真値ベクトル集 |
| Test (SQL) | `supabase/tests/audit_hash_chain.test.sql` (pgTAP) | fixture から SQL trigger が期待 hash を出すことを検証 |
| Test (TS)  | `web/src/lib/audit/hash-chain.test.ts` (Vitest) | fixture から TS canonicalize が期待 hash を出すことを検証 |

## canonical 形式

### 1. レコード canonical (8 フィールド連結)

```
canonical = tenant_id | ts | actor_kind | actor_id | event_kind | resource | payload_canonical | prev_hash
```

- 区切り文字: ASCII pipe `|` (U+007C)
- 末尾 newline なし
- 各フィールドの内部に `|` が含まれていてはならない (uuid / iso-8601 / actor_kind enum / event_kind / resource path 等は事前 validation で拒否)

### 2. 各フィールドの正規化

| フィールド | 型 | 正規化 |
|---|---|---|
| `tenant_id` | uuid | 小文字 hyphen 区切り (Postgres uuid::text 既定形式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |
| `ts` | timestamptz | ISO-8601, microsecond 精度, UTC オフセット `+00:00`, 例: `2026-05-03T12:34:56.789000+00:00` |
| `actor_kind` | enum text | `owner` / `operator` / `open_claw` / `system` / `subprocess` のいずれか (CHECK constraint で保証) |
| `actor_id` | text | そのまま (caller 側で trim 済み前提) |
| `event_kind` | text | そのまま |
| `resource` | text | そのまま (path / URI / casbin obj 等) |
| `payload` | jsonb | **canonicalJson** で正規化した文字列 (詳細は §3) |
| `prev_hash` | text 64 hex | 小文字 16 進 |

### 3. payload (jsonb) の canonical JSON 仕様

RFC 8785 (JSON Canonicalization Scheme) の簡易版を採用。

#### 3.1 object key

- key は文字列 UTF-16 codepoint 昇順 (= JS `Array.prototype.sort()` 既定 / Postgres `jsonb` 内部表現)
- 重複 key は禁止 (Postgres jsonb は最後の値で上書きするが、PRJ-019 では caller 側で reject)
- 値が `undefined` (TS only) のキーは canonical から除外
- 値が `null` のキーは含める (`"key":null`)

#### 3.2 value

| 型 | canonical 表現 |
|---|---|
| `null` | `null` |
| `boolean` | `true` / `false` |
| `number` | ECMAScript ToString(Number) 短縮形 (= IEEE 754 round-trippable) / Postgres `numeric` の最短表現と一致 |
| `string` | RFC 8259 標準 JSON エスケープ (`"\""`, `"\\"`, `"\n"` 等)。非 ASCII は UTF-16 unescape 形式 |
| `array` | 要素順を維持して再帰 canonical 化、要素間 `,`、外側 `[]` |
| `object` | key 昇順ソート後、各エントリ `"key":value`、エントリ間 `,`、外側 `{}` |

#### 3.3 数値の特殊扱い

- `NaN`, `+Infinity`, `-Infinity` は **禁止** (canonical 化時に throw)
- `-0` は `0` と同一視 (TS では `String(-0) === "0"`)
- 小数: `0.1` → `"0.1"` (ECMAScript 既定)
- 大きい整数: `2 ** 53 - 1 = 9007199254740991` まで安全。`bigint` は禁止

#### 3.4 例

```json
{ "b": 1, "a": [ {"y": null, "x": 2} ] }
```

→ canonical:

```
{"a":[{"x":2,"y":null}],"b":1}
```

### 4. payload が NULL / 空の場合

| 入力 | canonical |
|---|---|
| TS `payload: null` | `null` (4 文字、リテラル) |
| TS `payload: undefined` | `null` (top-level は欠落扱い) |
| TS `payload: {}` | `{}` |
| TS `payload: []` | `[]` |
| Postgres `payload jsonb := 'null'::jsonb` | `null` |
| Postgres `payload jsonb := '{}'::jsonb` | `{}` |

Postgres trigger は `coalesce(new.payload::text, 'null')` で対応するが、本 buffer 期では更に
`jsonb_canonical(new.payload)` 相当 (`payload::text` を canonical sort) に置換する必要がある。
未対応のままだと **同一データでも payload key 順が trigger 側で不安定**になり drift する。

> TODO (Phase 1 W1): Postgres 拡張 `pg_jsonschema` or pl/pgsql 自前実装で `jsonb_canonical(jsonb) returns text` を作成。
> 本 buffer 期は fixture round-trip テストで「現状は drift してない」ことだけ確認する。

### 5. SHA-256

- 入力: §1 の canonical 文字列を **UTF-8 エンコード** したバイト列
- 出力: 32 バイト → 小文字 16 進 64 文字
- TS: `crypto.createHash("sha256").update(s, "utf8").digest("hex")`
- Postgres: `encode(digest(s, 'sha256'), 'hex')` (extension `pgcrypto` 必須)

### 6. genesis

- chain の最初のレコードは `prev_hash = "0".repeat(64)` (零 64 文字)
- TS 定数: `GENESIS_PREV_HASH`
- SQL: `'0000000000000000000000000000000000000000000000000000000000000000'` (32 byte 全 0)

### 7. unique constraint

- `audit_log` の `(prev_hash)` UNIQUE 制約により、同一 prev_hash で 2 件 INSERT できない (= 分岐禁止 / append-only)
- これにより chain の linearity (一本鎖) が DB レイヤで保証される

## drift 検知方法

### 7.1 round-trip test

`fixtures/audit-canonical-vectors.json` は **9 ベクトル** (genesis + 8 多様 payload) を含む:

1. genesis (payload: `null`)
2. 単純文字列 payload
3. 整数 + 浮動小数 payload
4. ネスト object (key 順を意図的にバラバラ)
5. 配列 payload
6. 空 object payload
7. 空配列 payload
8. boolean / null 混在
9. 非 ASCII (日本語) payload

各ベクトルは `expectedCanonical` と `expectedCurrHash` を含む。
- TS テスト: `canonicalize(input) === expectedCanonical` && `computeCurrHash(input) === expectedCurrHash` を assert
- SQL テスト: 同じ input を `audit_log` に INSERT し、trigger が `expectedCurrHash` と一致する curr_hash を生成することを assert

両側が同じ fixture で同じ hash を出力すれば drift していないと判定。
将来 Postgres バージョンアップ等で挙動変わった場合、CI でこのテストが落ちて即検知される。

### 7.2 CI 統合

```yaml
- name: TS canonical round-trip
  run: pnpm --filter @clawbridge/web test web/src/lib/audit/hash-chain.test.ts

- name: SQL canonical round-trip (pgTAP)
  run: pg_prove -d $TEST_DB supabase/tests/audit_hash_chain.test.sql
```

両方緑でなければ merge block。

## 既知の drift リスク (今後の対応必要)

| リスク | 現状 | 対応 |
|---|---|---|
| Postgres `payload::text` 出力時の key 順不安定 | 未対応 (fixture が単純なため現状は偶然一致してる可能性) | Phase 1 W1 で `jsonb_canonical()` 関数追加 |
| timestamptz の microsecond 表現 (Postgres バージョン差) | TS 側で `+00:00` 固定の前提だが Postgres 既定は `+00` (短縮) | TS 側で正規化関数を追加 (Phase 1 W1) or Postgres 側 `to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"')` |
| number の浮動小数表現 (`1e100` vs `1.0e+100`) | ECMAScript と Postgres の最短表現が一致するかは未検証 | fixture に大きい/小さい数値を追加して検証 (Phase 1 W1) |
| string Unicode escape (Postgres jsonb の非 ASCII 表現) | Postgres は raw UTF-8 で出力、JS `JSON.stringify` も標準エスケープのみで一致見込み | fixture 9 (日本語) で検証 |

これらは **Phase 1 W1 で `jsonb_canonical()` 自前実装** または **golden file テスト 100 ベクトル拡張**で潰す。
本 buffer 期は「drift 検知の仕組みを設置 + 既知の単純ケースで現状一致を確認」までがゴール。

## 参考

- RFC 8785: JSON Canonicalization Scheme (JCS)
- RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format
- Postgres 16 jsonb 内部表現
- DEC-019-033 §⑤ L4 (Audit + Anomaly Detection)
- DEC-019-041 (W0-Week2 buffer)
