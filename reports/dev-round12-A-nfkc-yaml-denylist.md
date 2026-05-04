# PRJ-019 Round 12 Dev-A 完了レポート — NFKC 正規化 layer + denylist YAML 直書き化 + backlog tier audit

最終更新: 2026-05-04 W0-Week1 深夜終盤 / 起案: Dev 部門 R12 Dev-A
位置付け: Owner formal 「最速で進めよ」directive 継続中。Round 12 dispatch (案 A 相当 10-11 並列) で需要 scout の denylist 仕組みを Phase 1 W3 (CB-D-W3-01) → W0 (本 Round) に **22 日前倒し完遂**。
連動 DEC: DEC-019-010 / DEC-019-025 / DEC-019-050 / DEC-019-053 v15.5 / DEC-019-055 / DEC-019-056 / DEC-019-057
連動レポート: dev-round11-A-denylist-subprocess.md (Round 11 Dev-A 着地 = minor 16 件 + skill-adapter subprocess 統合) / ceo-round11-integrated-report-v12.md §9 (Dev-A 引継項目)
連動コード:
- `app/needs-scout/src/filters/normalization.ts` (新規 / 190 行)
- `app/needs-scout/src/filters/denylist-loader.ts` (新規 / 310 行)
- `app/needs-scout/config/denylist.yaml` (新規 / 392 行)
- `app/needs-scout/src/filters/__tests__/normalization.test.ts` (新規 / 168 行 / 28 tests)
- `app/needs-scout/src/filters/__tests__/denylist-loader.test.ts` (新規 / 236 行 / 13 tests)
- `app/needs-scout/src/filters/critical-domain-filter.ts` (extend / +37 行 / hard-coded literal を YAML loader に置換、NFKC 正規化導入)

---

## CEO 向け 200 字以内 summary

Round 12 Dev-A 着地: NFKC 正規化 layer (5 純関数) + denylist YAML 直書き化 (loader 自前実装、js-yaml 依存 0) + backlog tier audit lineage を W0 で完遂、CB-D-W3-01 を 22 日前倒し。
critical-domain-filter は YAML loader 出力に切替 + 入力を NFKC + lowercase + 空白圧縮で正規化、全角混在に耐性を獲得。新規 41 tests (normalization 28 + loader 13) 全 pass、workspace 668 tests 全 PASS、regression 0、追加コスト $0、TypeScript strict 合格、Object.freeze 完全準拠。

---

## §1 担当タスクと DoD

### §1.1 担当 4 件 (Round 11 Dev-A 引継 + W3→W0 前倒し)

| # | タスク | 着地 |
|---|---|---|
| A | NFKC 正規化 layer 追加 (normalization.ts 新規 + critical-domain-filter 経由化) | 完遂 |
| B | denylist YAML 直書き化 (CB-D-W3-01 完遂、loader 自前実装) | 完遂 |
| C | backlog minor 16 件 audit 統合 (tier: backlog + enabled: false) | 完遂 |
| D | テスト追加 (normalization 5 関数 + loader YAML/tier/enabled/freeze) | 完遂 (+41 tests) |

### §1.2 DoD 確認

| DoD | 結果 |
|---|---|
| TypeScript strict pass (`pnpm typecheck` exit 0) | 達成 (needs-scout exit 0) |
| workspace vitest 全 pass | 達成 (668 tests / 9 package すべて PASS) |
| 既存 614 tests + 新規 +25-35 tests | 達成 (Round 11 末 614 → Round 12 着地 668 = **+54** / うち Dev-A 寄与 +41) |
| regression 0 | 達成 (全 9 packages PASS、既存 critical-domain-filter 57 tests 維持) |
| 完遂レポート 300-400 行 | 達成 (本 file ≈ 380 行) |
| API 追加コスト = $0 | 達成 (zod は既存依存、js-yaml 等の新規 dependency 0) |
| 絵文字なし | 達成 (本 report + コード内 emoji 0) |
| append-only 編集厳守 (他 file への破壊的編集禁止) | 達成 (critical-domain-filter.ts のみ task 指示で許容、それ以外は新規追加のみ) |

---

## §2 NFKC 正規化 layer 追加 (タスク A)

### §2.1 新規 ファイル `normalization.ts` (190 行)

**5 純関数を export** (副作用 0、入力同値 → 出力同値):

| # | 関数 | 役割 |
|---|---|---|
| 1 | `normalizeForFilter(input: string): string` | NFKC + lowercase + 全角/半角統一 + 連続空白圧縮 + 前後 trim |
| 2 | `extractTokenCandidates(normalized: string): readonly string[]` | 形態素近似 (句読点 / 記号 / 空白で粗分割、語境界保持)、frozen 配列返却 |
| 3 | `containsCriticalPattern(normalized: string, pattern: string): boolean` | pure 検査 (空 pattern は常に false) |
| 4 | `redactPII(input: string): string` | email / 電話 / クレジットカード / IPv4 の 4 種を `[REDACTED:type]` 化 |
| 5 | `safeNormalize(input: unknown): string` | null / undefined / 非 string 型を安全に空文字へ coerce |

### §2.2 設計方針

- **依存追加 0**: kuromoji 等の形態素解析エンジンは bundle size + runtime cost 制約で採用せず、句読点 + 記号 + 空白の粗分割で denylist の部分一致と相性の良い token 列挙を優先。
- **NFKC idempotent**: 全角英数字 ＨＥＬＬＯ１２３ → hello123 / 半角カナ ｱｲｳ → アイウ / IDEOGRAPHIC SPACE U+3000 → ASCII SPACE U+0020 を 1 関数で吸収。
- **PII 4 種 redaction**: HITL 第 11 種 `knowledge_pii_review` (knowledge-round11 batch-2 連動) と整合。検出順序は email → credit_card → phone → ipv4 で、email 内数字列の credit_card 誤検出を回避。
- **既存契約温存**: `safeNormalize` は throw なし (filter 経路の fail-safe 動作維持)。

### §2.3 critical-domain-filter への組込

- `applyCriticalDomainFilter` 内 3 軸 (title / url / rawText) の lowercase 処理を `normalizeForFilter` 経由に置換。
- 既存挙動互換: 半角 ASCII lowercase 入力に対しては従前の `.toLowerCase()` と等価動作 (NFKC は idempotent、空白圧縮は単一 ASCII space の場合無作用)。
- 既存テスト 57 件 (Round 9/10/11 の全件) 全 pass で後方互換確認。

---

## §3 denylist YAML 直書き化 (タスク B / CB-D-W3-01 完遂)

### §3.1 新規ファイル `config/denylist.yaml` (392 行)

13 領域 × 4 tier (baseline / critical / major / minor / backlog) の階層構造で、計 171 件の active keyword + 16 件の audit lineage backlog を保持。

#### tier 設計

| tier | 役割 | enabled |
|---|---|---|
| baseline | Round 9 着地 (DEC-019-010 確定時 13 領域基本セット) | true |
| critical | Round 10 critical 7 件 | true |
| major | Round 10 major 26 件 | true |
| minor | Round 11 minor 14 件 (back-compat 維持で active) | true |
| backlog | 将来候補 + audit lineage (Round 11 minor の 16 件 record) | **false** (runtime 除外) |

### §3.2 新規ファイル `denylist-loader.ts` (310 行)

#### 主要 export

| export | 役割 |
|---|---|
| `parseRestrictedYaml(yamlText: string): unknown` | 自前 YAML parser (block style mapping + sequence + scalar、改行 split + indent 解析、quote 除去) |
| `loadDenylist(customPath?): RuntimeDenylist` | runtime denylist (enabled === true tier の dedup 統合、Object.freeze 済) |
| `loadDenylistFullTable(customPath?): DenylistFullTable` | audit / 検証用 (backlog 含む全 tier 詳細) |
| `loadDomainKeys(): readonly string[]` | 13 領域 key 配列 (YAML 記載順) |
| `_resetDenylistCacheForTesting(): void` | test 用 cache reset |

#### 設計方針

- **依存追加 0**: js-yaml / yaml package 採用 NG (API 追加コスト $0 制約)。本 file が必要とする YAML subset (block style + 2-space indent + scalar + boolean + quoted string) のみを自前 parse。
- **zod schema 検証**: `DenylistFileSchema` で version 必須 + 各 tier の enabled (boolean) + keywords (string[]) を構造検証、不整合時は load 時 throw。
- **起動時 1 回 load**: module top-level の cached function call で eager load、cache 後は同 path への再 load を省略。
- **dedup**: domain 内で複数 tier に同一 keyword が登場しても runtime には 1 度のみ格納 (minor + backlog dual placement の back-compat 維持に活用)。
- **test override**: `customPath` 引数で別 YAML を読める (cache bypass)、`_resetDenylistCacheForTesting()` で cache クリア可能。

### §3.3 critical-domain-filter への組込

- `LEGACY_DENYLIST_LITERAL` を audit trace 用に名前変更で残置 (hard-coded literal 削除はせず、append-only 原則の準拠)。
- runtime export `CRITICAL_DOMAIN_DENYLIST` は `loadDenylistWithFallback()` 経由で YAML loader 出力を採用、YAML 欠落 / parse error 時は LEGACY_DENYLIST_LITERAL に fallback (起動 fail-fast vs 旧動作維持のトレードオフでは fail-safe = 旧動作維持を選択)。
- 13 領域 key set 軽 検証で fallback 判定し、想定外の構造変化に対して頑健。

---

## §4 backlog minor 16 件 audit 統合 (タスク C)

### §4.1 設計判断

`BACKLOG-MINOR-DENYLIST.md` の 16 keyword は Round 11 で全件 critical-domain-filter.ts に append 済 (14 新規 + 2 既存確認)。Round 12 タスク C は「YAML の tier: backlog に取り込み + enabled: false 付与」を要求。

| 設計案 | 帰結 |
|---|---|
| 案 1: minor → backlog に移動 (enabled: false 化) | runtime から 14 件除外 → 既存 R11-min01〜14 tests fail (back-compat 破壊) |
| **案 2 (採用): dual placement** — minor (enabled: true) + backlog (enabled: false) で記録 | back-compat 維持 + audit lineage 確保 + loader dedup で runtime 重複 0 |

### §4.2 採用結果

- 領域: critical_infrastructure / education / housing / employment / finance / insurance / product_safety の 7 領域に backlog tier 追加。
- backlog tier の `enabled: false` フラグで loader が runtime 除外、将来 enable: true 切替で活性化可能な構造を確保。
- legal の `legal advice` / national_security の `cyber warfare` (Round 11 既存確認分) も backlog tier に audit record として記載。

### §4.3 dedup 動作確認

`denylist-loader.test.ts` test #5 で `'廃棄物処理制御'` (minor + backlog 両方に登場) が runtime denylist に **1 度のみ** 出現することを固定化。

---

## §5 テスト追加 (タスク D)

### §5.1 normalization.test.ts (28 tests)

- 5 関数 × 各 3-7 ケース (instruction の 15-25 範囲超過分はカバレッジ強化)
- normalizeForFilter: 7 cases (半角大文字 / 全角英数字 / 全角空白 / tab + 改行 / 半角カナ / trim / 空文字)
- extractTokenCandidates: 5 cases (半角空白 / 句読点 + 記号 / 日本語句読点 / 空文字 / frozen 配列)
- containsCriticalPattern: 4 cases (含む / 含まない / 空 pattern / 部分一致)
- redactPII: 6 cases (email / 複数 email / credit_card / IPv4 / 複数種類混在 / PII なし不変)
- safeNormalize: 6 cases (null / undefined / string / number / boolean / object + array)

### §5.2 denylist-loader.test.ts (13 tests)

- parseRestrictedYaml: 3 cases (mapping + sequence / boolean + number + quoted string / comment + 空行 skip)
- loadDenylist: 5 cases (13 領域全件 / Object.freeze immutable / dedup / minor active / loadDomainKeys)
- loadDenylistFullTable: 1 case (backlog enabled: false 確認)
- enabled filter: 1 case (test override で backlog 限定 keyword が runtime に出ないこと)
- test override: 3 cases (別 YAML / cache reset / version 必須 zod throw)

### §5.3 既存 critical-domain-filter.test.ts (57 tests) 維持

- 正規化前後で全 57 件 pass (Round 9 baseline + Round 10 拡張 + Round 11 minor の全件)
- NFKC 化による誤検出 / 取りこぼし 0 (denylist 値が lowercase ASCII / NFKC-stable Japanese で構成されているため idempotent)

---

## §6 検証コマンド実行結果

実行コマンド: `cd projects/PRJ-019/app && pnpm -r test`

### §6.1 結果サマリ

| package | test files | tests | status |
|---|---|---|---|
| audit | 2 | 16 | PASS |
| needs-scout | **6** (+2) | **120** (+41) | PASS |
| scripts/openclaw-monitor | 1 | 10 | PASS |
| harness | 18 | 230 | PASS |
| claude-bridge | 3 | 29 | PASS |
| openclaw-runtime | 13 | 174 | PASS |
| e2e | 7 | 66 | PASS |
| notify | 1 | 23 | PASS |
| sandbox / orchestrator | - | (W0 stub) | SKIP |
| **合計** | **51** | **668 tests** | **all PASS** |

Round 11 末 614 → Round 12 着地 668 = **+54 件** (Dev-A 独立寄与 41 件 + 他 R12 並列 Agent 寄与 13 件)。

### §6.2 typecheck

| package | result |
|---|---|
| `cd needs-scout && pnpm typecheck` | exit 0 (TypeScript strict 通過、verbatimModuleSyntax 緩和 mode で検証) |

### §6.3 file 規模

| ファイル | 行数 | 目安 | 達成 |
|---|---|---|---|
| normalization.ts | 190 | 180-250 | 達成 |
| denylist-loader.ts | 310 | 150-200 | 超過 (zod schema + cache 2 層 + override path 経路で justified) |
| denylist.yaml | 392 | n/a | n/a |
| normalization.test.ts | 168 | n/a | n/a (28 tests = 15-25 想定超過、カバレッジ強化分) |
| denylist-loader.test.ts | 236 | n/a | n/a (13 tests = 8-12 想定超過、test override + zod 検証分) |

---

## §7 制約遵守

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 (DEC-019-050 cap $30 残量無消費) | 達成 |
| TypeScript strict | 達成 |
| pnpm workspace + vitest | 達成 |
| 並列 R12 Agent と file conflict 禁止 | 達成 (needs-scout/filters / config / __tests__ のみ touch、他 Agent の openclaw-runtime/cli / harness/__tests__ 等と完全分離) |
| Object.freeze 完全準拠 (DEC-019-010) | 達成 (loader 出力 / table / 各領域配列すべて freeze、loader test #4 で固定化) |
| append-only 編集厳守 | 達成 (critical-domain-filter.ts は task 指示で許容範囲、LEGACY_DENYLIST_LITERAL として旧 literal を温存し audit trace 維持) |
| 絵文字なし | 達成 (本 report + 全コード内 emoji 0) |
| denylist 内容無変更 (loader 経由化のみ) | 達成 (171 active keyword 全件 YAML 経由で再現、既存 57 tests 全 pass で固定化) |
| 後方互換: 正規化なしの既存テストは pass 維持 | 達成 (NFKC は ASCII lowercase 入力に対し idempotent、既存 57 tests 全 pass) |

---

## §8 引継 + Round 13 想定

### §8.1 Round 13 引継 5 件

| # | 引継項目 | 重要度 | 提案 |
|---|---|---|---|
| 1 | denylist.yaml の運用変更フロー (PR ベース merge approval 必須化) | 高 | Review 部門 1 名 + Dev 部門 1 名の 2 名 approval、tier 移動は DEC log 必須 |
| 2 | normalization.ts の対多言語拡張 (中文 / 韓国語の漢字統一規則) | 中 | NFKC は CJK 互換漢字 (U+F900-U+FAFF) を統一するが、繁体 ↔ 簡体 の互換は別途辞書必要 |
| 3 | YAML loader fail-fast 化 (現在 fallback)、Round 13 で運用 PR フロー確立後切替 | 中 | LEGACY_DENYLIST_LITERAL 削除タイミングと連動 |
| 4 | NFKC 正規化を hn-trending fetch path にも適用 (現在 critical-domain-filter のみ経由) | 低 | hn-trending source の rawText 構築段階で safeNormalize + redactPII 適用検討 |
| 5 | backlog tier に新規 keyword 追加用の運用ガイド (knowledge mining batch-3 連動) | 低 | knowledge-round11-mining-batch-2.md の HITL gate-11 PII review と統合 |

### §8.2 連動 task の進捗

- **CB-D-W3-01 needs_scout skill config 直接埋込**: **本 Round で完遂** (W3 → W0 = 22 日前倒し)
- **CB-S-W0-02 (5/9 期限) ホワイトリスト v1 化**: denylist 側 critical 7 + major 26 + minor 14 = **47 active 全着地** で連動側待ち状態。loader が allowlist 拡張に対応する設計余地あり (現在 denylist 構造のみ)。
- **CB-D-W4-01 G-12 dry-run hardguard**: 本 layer は読み取り専用で副作用なし、G-12 hardguard と独立に動作。

### §8.3 Phase 1 sign-off 5/22 push 評価への寄与

- W3 中核機能 (denylist YAML 化 / NFKC 正規化) を W0 で完遂 → Phase 1 sign-off 5/22 push の根拠が 1 件追加。
- ceo-round11-integrated-report-v12.md §8 の 5/22 内部運用着手公式 KPI 78% に対し、本 Round 12 Dev-A 着地分で **+5pt 寄与見込** (PM 評価依頼)。

---

## §9 結論

Round 12 Dev-A は Owner formal 「最速で進めよ」directive 継続下、Round 11 Dev-A 引継 5 件のうち上位 2 件 (NFKC 正規化 layer + denylist YAML 直書き化) と Round 12 タスク C (backlog tier audit) を独立 Agent 経路 (DEC-019-025 SOP) で完遂。

normalization.ts (190 行 / 5 純関数) で全角混在 / 大小文字混在 / Unicode 等価変種に耐性を獲得、denylist-loader.ts (310 行 / 自前 YAML parser + zod 検証 + tier 分類 + enabled filter + dedup) で hard-coded 配列を YAML 直書き化 (CB-D-W3-01 完遂、22 日前倒し)、backlog tier dual placement で minor 16 件の audit lineage を確保しつつ back-compat 維持。

新規 41 tests (normalization 28 + loader 13) 全 pass、workspace 全体 614→668 全 PASS、regression 0、追加コスト $0、TypeScript strict 合格、Object.freeze 完全準拠維持、絵文字なし、append-only 編集厳守。

---

**Sign-off**: 2026-05-04 W0-Week1 深夜終盤 / Dev R12 Dev-A
**次回**: Round 13 で denylist 運用 PR フロー確立 + multilingual NFKC 拡張 + YAML loader fail-fast 化を引継

---

## §10 補足 — 設計上の主要トレードオフと採用根拠

### §10.1 形態素解析: kuromoji 採用 vs 句読点 + 記号粗分割

| 観点 | kuromoji | 句読点 + 記号粗分割 (採用) |
|---|---|---|
| 精度 | 高 (語境界正確) | 中 (denylist 部分一致前提なら十分) |
| 依存サイズ | 大 (辞書 dict) | 0 |
| runtime cost | 中-高 (起動時辞書 load) | 極小 (RegExp 1 回) |
| API 追加コスト | 0 (offline) | 0 |
| **採用判断** | 却下 (bundle size + 起動時間) | **採用 (denylist の部分一致と相性良)** |

denylist は単語境界に依存しない部分一致 (`String.prototype.includes`) で動作するため、形態素解析の精度メリットは限定的。粗分割で十分。

### §10.2 YAML parser: js-yaml vs 自前実装

| 観点 | js-yaml | 自前実装 (採用) |
|---|---|---|
| 機能網羅 | フル YAML 1.2 仕様 | 本 file 用 subset のみ (block style + scalar + quoted string) |
| 依存サイズ | 中 (~100KB) | 0 |
| 想定外 YAML への耐性 | 高 | 低 (subset 外で throw) |
| **採用判断** | 却下 (API 追加コスト $0 制約) | **採用 (本 denylist の YAML は常に subset 内で記述する運用ルール明確化)** |

Round 13 で denylist.yaml の運用変更フロー確立時、subset 制約を運用 ガイドラインに明記する必要あり (引継 §8.1 #1)。

### §10.3 fallback vs fail-fast: YAML load 失敗時の挙動

| 観点 | fail-fast (起動時 throw) | fallback (LEGACY_DENYLIST_LITERAL) (採用) |
|---|---|---|
| データ整合性 | 高 (不整合即検出) | 中 (旧動作で進む) |
| 運用安定性 | 低 (起動失敗で全停止) | 高 (旧動作に戻る) |
| W0 段階の妥当性 | 不適 (運用 PR フロー未確立) | **適 (LEGACY 残置中の安全弁)** |
| **採用判断** | Round 13 引継 (運用 PR フロー確立後) | **採用 (W0 段階の安全側選択)** |

LEGACY_DENYLIST_LITERAL 削除は Round 13 で運用フロー確立後に検討 (引継 §8.1 #3)。

---

## §11 ファイル一覧 (絶対パス)

| 種別 | ファイル | 行数 |
|---|---|---|
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/normalization.ts` | 190 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/denylist-loader.ts` | 310 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/config/denylist.yaml` | 392 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/__tests__/normalization.test.ts` | 168 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/__tests__/denylist-loader.test.ts` | 236 |
| 修正 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/critical-domain-filter.ts` | +37 行 (LEGACY_ rename + loader import + fallback wrapper + normalizeForFilter 適用) |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-round12-A-nfkc-yaml-denylist.md` | 本 file |

---

## §12 自己レビュー 5 項目

| # | 項目 | 確認 |
|---|---|---|
| 1 | DoD 全 8 件達成 | YES |
| 2 | 既存 critical-domain-filter 57 tests 全 pass | YES |
| 3 | 新規 41 tests 全 pass | YES |
| 4 | TypeScript strict 違反 0 | YES |
| 5 | API 追加コスト $0 確認 | YES (zod は既存依存、新規 npm install 0) |


