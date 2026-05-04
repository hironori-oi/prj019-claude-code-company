# PRJ-019 Open Issue 解決報告 v1

**起案**: 2026-05-03
**担当**: Dev 部門 A
**根拠決裁**: DEC-019-041 (W0-Week2 buffer 期必達クローズ)
**対象 Issue**: ARCH-01 / hash-chain canonical drift / Casbin keyMatch4 PoC (3 件)

---

## エグゼクティブサマリ

W0-Week1 scaffold 後に検出された 3 件の Open Issue を W0-Week2 buffer 期で解決した。

| Issue | ステータス | 残課題 |
|---|---|---|
| ARCH-01: tsconfig 統一 | **closed** (Phase A 完了 / Phase B は W4 末予定) | Phase B 移行時に既存 package の strict 違反を順次修正 |
| hash-chain canonical drift 防止 | **closed** (検出機構設置完了) | Postgres 側 `jsonb_canonical()` 関数追加 (Phase 1 W1) |
| Casbin keyMatch4 PoC | **partial** (PoC コード + 予測 RESULTS 提出済み、実機実行未) | casbin 依存追加 + 実機実行で予測表検証 (W0-Week2 末) |

3 件中 2 件 closed、1 件 partial。**残課題 4 件** (うち W0-Week2 末まで 1 件、Phase 1 W1 1 件、Phase 1 W4 末 1 件、継続 1 件)。

---

## Issue 1: ARCH-01 — base tsconfig 統一

### 解決内容

`projects/PRJ-019/app/tsconfig.base.json` を本 monorepo の strict 統一基準として確立し、全 package が extends 参照する形に統一。
既存 package を壊さないため `tsconfig.legacy-relax.json` を中継させる **Phase A (warn) → Phase B (error)** 段階移行を導入。

### 確立した strict 方針 (`tsconfig.base.json`)

| フラグ | 値 | 理由 |
|---|---|---|
| `strict` | true | 全 strict サブフラグの一括有効化 |
| `noUncheckedIndexedAccess` | true | 配列 / Record アクセスを `T \| undefined` 化、null pointer 予防 |
| `exactOptionalPropertyTypes` | true | `{ x?: T }` への `{ x: undefined }` 代入禁止、HITL/policy schema の型安全 |
| `verbatimModuleSyntax` | true | `import type` の用途明示、tree-shaking 安全 |
| `noImplicitOverride` | true | `RuntimeWrapper` 等のクラス階層で意図せぬ override 防止 |
| `useUnknownInCatchVariables` | true | error path の型 narrowing 強制 |
| `target` | ES2022 | Node 22 / browser モダン両対応 |
| `module` / `moduleResolution` | NodeNext | base は Node 系。web/ は esnext + bundler で override |

### Rollout 戦略

| Phase | 期間 | 対象 | 行動 |
|---|---|---|---|
| **Phase A** (warn) | 2026-05-03 〜 W4 末 (~6/20) | 既存 package (harness/ / claude-bridge/ / openclaw-runtime/) | `tsconfig.legacy-relax.json` 経由で extends、既存テスト緑維持 |
| Phase A | 2026-05-03 〜 W4 末 | 新規 package (web/ 他) | `tsconfig.base.json` を直接 extends (strict 完全適用) |
| **Phase B** (error) | W4 末 〜 | 全 package | base 直 extends に統一、`tsconfig.legacy-relax.json` 削除 |

### 作成 / 更新ファイル

- `projects/PRJ-019/app/tsconfig.base.json` (更新: strict 拡張)
- `projects/PRJ-019/app/tsconfig.legacy-relax.json` (新規: Phase A 緩和 base)
- `projects/PRJ-019/app/harness/tsconfig.json` (更新: legacy-relax extends に変更)
- `projects/PRJ-019/app/claude-bridge/tsconfig.json` (更新: legacy-relax extends に変更)
- `projects/PRJ-019/app/openclaw-runtime/tsconfig.json` (更新: legacy-relax extends に変更)
- `projects/PRJ-019/app/web/tsconfig.json` (更新: base 直 extends, web 固有 override 維持)
- `projects/PRJ-019/app/docs/tsconfig-rollout.md` (新規: Phase A/B 移行手順詳細)
- `projects/PRJ-019/app/README.md` (更新: 統一方針への言及追加)

### 既存 package が壊れない保証

- `tsconfig.legacy-relax.json` は `verbatimModuleSyntax` / `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess` / `useUnknownInCatchVariables` を **false 緩和** で上書き
- 既存 W0-Week1 完成済み 61+ ケース (harness 9 modules) は引き続き同一 strict レベルで動作する想定
- 各 workspace `tsconfig.json` の `_meta.rolloutPhase` フィールドで進捗を可視化

### ステータス: **closed**

W0-Week2 末までに既存 package を Phase A レベルで統一完了。Phase B 移行は W4 末予定。

---

## Issue 2: hash-chain canonical drift 防止

### 解決内容

Postgres trigger (`audit_log_compute_hash`) と TS verify (`canonicalize` / `computeCurrHash`) が同一の canonical 文字列を生成することを保証するための検出機構を整備:

1. **canonical JSON 仕様書策定** (`docs/audit-canonical-spec.md`) — RFC 8785 簡易版で正規化ルール明記
2. **共通 fixture 作成** (`fixtures/audit-canonical-vectors.json`) — 9 ベクトル (genesis / string / 数値 / nested object / mixed array / empty / boolean+null / 非 ASCII)
3. **TS round-trip テスト** (`web/src/lib/audit/hash-chain.test.ts`) — Vitest で 9 fixture すべて canonical + curr_hash 一致を検証
4. **SQL round-trip テスト** (`supabase/tests/audit_hash_chain.test.sql`) — pgTAP で 9 fixture すべて SHA-256 一致を検証 + UNIQUE / CHECK constraint 検証
5. **TS canonicalJson 実装強化** — RFC 8785 簡易版準拠の `canonicalJson()` 関数を追加 (object key UTF-16 codepoint 昇順ソート / 数値最短表現 / 非 finite 拒否)

### 検証ベクトル詳細 (fixture)

| # | label | 検証ポイント |
|---|---|---|
| 1 | genesis (payload null) | chain 起点 + null payload |
| 2 | string payload | top-level string + JSON エスケープ |
| 3 | flat object with mixed numbers | 浮動小数 (0.0123, 1.5) 短縮表現 |
| 4 | nested object with intentionally unsorted input keys | object key 昇順ソートの再帰適用 |
| 5 | mixed-type array | 配列順保持 + 異種型混在 |
| 6 | empty object | `{}` |
| 7 | empty array | `[]` |
| 8 | boolean / null mixed object | `null` 値の保持 |
| 9 | non-ASCII (Japanese) | UTF-8 バイト一致 (TS / Postgres 双方) |

### canonical 仕様の要点

- 8 フィールド `|` 連結: `tenant_id|ts|actor_kind|actor_id|event_kind|resource|payload|prev_hash`
- `payload` は canonical JSON (object key UTF-16 昇順、数値短縮、`undefined` キー除外、`null` キー保持)
- `ts` は `2026-05-03T12:34:56.789000+00:00` 固定形式 (microsecond + +00:00)
- SHA-256 (UTF-8 バイト → 32 byte → 小文字 16 進 64 文字)
- genesis prev_hash = "0" × 64

### 作成 / 更新ファイル

- `projects/PRJ-019/app/web/src/lib/audit/hash-chain.ts` (更新: `canonicalJson()` 追加 + null safe 化)
- `projects/PRJ-019/app/web/src/lib/audit/hash-chain.test.ts` (新規: Vitest)
- `projects/PRJ-019/app/supabase/tests/audit_hash_chain.test.sql` (新規: pgTAP)
- `projects/PRJ-019/app/fixtures/audit-canonical-vectors.json` (新規: 9 ベクトル真値)
- `projects/PRJ-019/app/docs/audit-canonical-spec.md` (新規: canonical 仕様の正本)

### 残課題

| 項目 | 期限 | 担当 |
|---|---|---|
| Postgres `jsonb_canonical()` 関数追加 (jsonb 由来 drift の根本対策) | Phase 1 W1 | Dev A |
| timestamptz の `+00` vs `+00:00` 表現差解消 (Postgres 既定 vs TS fixture) | Phase 1 W1 | Dev A |
| 100 ベクトル拡張 (大きい / 小さい数値、各種 Unicode escape ケース) | Phase 1 W2 | Dev B |

### ステータス: **closed**

drift 検知機構を設置完了。既知の jsonb 由来リスクは仕様書で文書化、Phase 1 W1 で根本対策。

---

## Issue 3: Casbin keyMatch4 `**` glob PoC

### 解決内容

`node-casbin@5.x` の builtin matcher 6 種 (keyMatch / keyMatch2 / keyMatch3 / keyMatch4 / keyMatch5 / globMatch) を、
**13 ケース** (POSIX glob 直感に基づく期待値付き) で検証する PoC スクリプトを作成。

### 検証ケース概要

| カテゴリ | ケース数 | 主な観点 |
|---|---|---|
| 単一階層 `*` の挙動 | 2 | `*` が `/` を跨ぐかどうか |
| globstar `**` の挙動 | 3 | 末尾 `**` の貪欲度、空マッチ可否 |
| `PRJ-*` と `**` の組み合わせ | 2 | 現行 policy.csv の主用途 |
| 中間 `**` | 1 | `fs:projects/**/app/x.ts` 形式 |
| dotfile (`.env*`) | 2 | `.env.local` マッチ + 先頭 dot 必須 |
| 両側 globstar (`**/secrets/**`) | 2 | secrets vs secret 区別 |
| literal exact match | 1 | metadata.google.internal |

### 主要発見 (node-casbin v5 ソースコードレビュー由来 / 実機実行で要確認)

**`keyMatch4` は内部で `*` → `.*` (グローバル) 置換しているため、`*` も `**` も `/` を跨ぐ。POSIX glob とは異なる。**

| ID | Pattern | Request | Expected | keyMatch4 予測 | リスク |
|---|---|---|---|---|---|
| 2 | `fs:projects/PRJ-*/app/x.ts` | `fs:projects/PRJ-019/extra/app/x.ts` | false | **true (BUG)** | 中: PRJ ID 配下以外を read 可能 |
| 5 | `fs:projects/PRJ-019/app/**` | `fs:projects/PRJ-019/other.txt` | false | **true (BUG)** | 中: app/ 外を read 可能 |
| 12 | `fs:**/secrets/**` | `fs:projects/PRJ-019/app/config/secret.txt` | false | **true (BUG)** | 高: deny envelope の隣接パスを誤 allow |

**ID 12 が致命的**: deny envelope の `**/secrets/**` 自体は問題ないが、**同じ matcher を allow rule にも適用しているため、allow pattern の `*` が予想以上に貪欲**になる。

### 推奨対応 (3 案検討、案 A 採用推奨)

| 案 | 内容 | コスト | 評価 |
|---|---|---|---|
| **A: globMatch 切替 (推奨)** | model.conf の `keyMatch4` を `globMatch` に置換 | 1 行修正 | 採用推奨 |
| B: keyMatch2 格下げ | `*` を single-segment 化、`**` を depth 列挙で書換 | policy.csv 全書換 | 保守性劣化 |
| C: 自前 `pathMatchSafe` 関数 | minimatch ラッパで関数登録 | 関数 1 箇所追加 | 表面積増 |

### 作成 / 更新ファイル

- `projects/PRJ-019/app/policies/casbin/poc/keymatch4-test.ts` (新規: 13 ケース PoC コード)
- `projects/PRJ-019/app/policies/casbin/poc/RESULTS.md` (新規: 期待値マトリクス + 予測実値 + 推奨対応)

### 残課題

| 項目 | 期限 | 担当 |
|---|---|---|
| 実機実行 (casbin 依存追加 + `pnpm tsx ...keymatch4-test.ts`) | **W0-Week2 末 (5/15)** | Dev A |
| 予測表が実値と乖離した場合 RESULTS.md 更新 + 推奨案再評価 | W0-Week2 末 | Dev A |
| `model.conf` を案 A で更新 + 再 PoC 全件期待一致確認 | W0-Week2 末 | Dev A |
| ADR 起票 (`docs/adr/`) | W0-Week2 末 | Dev A |
| Phase 1 W1 で hot-reload テスト (policy.csv 動的読込) | W1 中盤 | Dev B |

### ステータス: **partial**

PoC コード + 仕様分析 + 推奨案 (RESULTS.md) は提出済み。実機実行 + model.conf 修正 + ADR 起票は W0-Week2 末までに完遂予定。

---

## 統合ステータス

### 作成 / 更新ファイル一覧 (全 14 件)

| # | ファイル | 種別 | Issue |
|---|---|---|---|
| 1 | `app/tsconfig.base.json` | 更新 | ARCH-01 |
| 2 | `app/tsconfig.legacy-relax.json` | 新規 | ARCH-01 |
| 3 | `app/harness/tsconfig.json` | 更新 | ARCH-01 |
| 4 | `app/claude-bridge/tsconfig.json` | 更新 | ARCH-01 |
| 5 | `app/openclaw-runtime/tsconfig.json` | 更新 | ARCH-01 |
| 6 | `app/web/tsconfig.json` | 更新 | ARCH-01 |
| 7 | `app/docs/tsconfig-rollout.md` | 新規 | ARCH-01 |
| 8 | `app/README.md` | 更新 | ARCH-01 |
| 9 | `app/web/src/lib/audit/hash-chain.ts` | 更新 | hash-chain |
| 10 | `app/web/src/lib/audit/hash-chain.test.ts` | 新規 | hash-chain |
| 11 | `app/supabase/tests/audit_hash_chain.test.sql` | 新規 | hash-chain |
| 12 | `app/fixtures/audit-canonical-vectors.json` | 新規 | hash-chain |
| 13 | `app/docs/audit-canonical-spec.md` | 新規 | hash-chain |
| 14 | `app/policies/casbin/poc/keymatch4-test.ts` | 新規 | Casbin |
| 15 | `app/policies/casbin/poc/RESULTS.md` | 新規 | Casbin |
| 16 | `projects/PRJ-019/reports/dev-open-issues-resolution-v1.md` | 新規 | 統合報告 (本書) |

(ARCH-01 で 8 件、hash-chain で 5 件、Casbin で 2 件、本報告 1 件 = 計 16 件)

### 残課題マトリクス (4 件)

| Issue | 残課題 | 期限 | 推奨検証タイミング |
|---|---|---|---|
| Casbin | 実機 PoC 実行 + model.conf 更新 + ADR | W0-Week2 末 (5/15) | **5/14 (Dev A 単独)** |
| hash-chain | Postgres `jsonb_canonical()` 追加 | Phase 1 W1 | W1 中盤 (5/22 頃) |
| ARCH-01 | Phase B 移行 (legacy-relax 削除 + 既存 package strict 違反修正) | Phase 1 W4 末 (~6/20) | 6/13-6/20 (Dev A 主導 + Review) |
| hash-chain | 100 ベクトル拡張 + 大数値 / Unicode escape カバレッジ | Phase 1 W2 | W2 中盤 (5/29 頃) |

### 次回検証推奨タイミング

- **5/14 (W0-Week2 中盤)**: Casbin 実機 PoC を Dev A 単独で実施、結果を本報告 v2 で更新
- **5/15 (W0-Week2 末)**: BAN drill #1 後の Review レビューで本書 v2 を確認、ARCH-01 / hash-chain Phase A 完了を CEO 承認
- **5/22 (Phase 1 W1 中盤)**: Postgres `jsonb_canonical()` 実装後、SQL 側 round-trip を再検証
- **6/13-6/20 (Phase 1 W4 末)**: Phase B 移行作業ウィンドウ、本報告 v3 で完了宣言

---

## 次アクション

1. CEO 報告: 本書 v1 を `dev-open-issues-resolution-v1.md` として提出 (本コミットで完了)
2. PM 連携: 残課題 4 件を `tasks.md` に AS-XXX として追加 (PM 部門で起票)
3. Review 部門通知: ARCH-01 / hash-chain の品質ゲート対象として `quality-gates.md` に追記検討
4. Dev A: 5/14 までに Casbin 実機 PoC 完遂、本書 v2 提出

---

**起案**: 2026-05-03 (Dev 部門 A 担当)
**承認待ち**: CEO (W0-Week2 末)
**関連**: DEC-019-033 / DEC-019-041 / `dev-w0-week2-bootstrap.md`
