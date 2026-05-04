# PRJ-019 Round 11 Dev-A 完了レポート — minor 16 denylist 完遂 + skill-adapter subprocess 統合

最終更新: 2026-05-04 W0-Week1 深夜終盤 / 起案: Dev 部門 R11 Dev-A / 案 A
位置付け: Owner 「最速で進めよ」確認 (5/4 深夜終盤) を受けた Round 11、最速進行ディスパッチ。general-purpose Agent dispatch (DEC-019-025 SOP) で独立稼働、並列 R11 8 Agent と file conflict 0。
連動 DEC: DEC-019-007 / 010 / 025 / 050 / 055 / 056 / 057
連動レポート: dev-round10-alpha-denylist-skill-adapter.md (Round 10 Dev-α 着地 = critical 7 + major 26 patch + skill non-interactive 純関数 adapter)
連動コード:
- `app/needs-scout/src/filters/critical-domain-filter.ts` (extend、配列 append のみ)
- `app/needs-scout/BACKLOG-MINOR-DENYLIST.md` (完遂マーク更新)
- `app/openclaw-runtime/src/skill-adapter/subprocess.ts` (新規)
- `app/openclaw-runtime/src/skill-adapter/__tests__/subprocess.test.ts` (新規)
- `app/openclaw-runtime/src/index.ts` (export 追加)

---

## CEO 向け 200 字以内 summary

Round 11 Dev-A 着地: needs-scout denylist minor 16 件 (新規 14 + 既存確認 2) を critical-domain-filter.ts に append、5/12 drill 期限を 8 日前倒し完遂。skill-adapter subprocess 統合 (CB-D-W3-04 完遂) を新規実装、DryRunGuard 整合 + AbortController kill chain (G-05/G-06) + interactive 検出時 fail-safe 純関数 path 経由で SIGTERM/SIGKILL escalate。新規 33 tests 全 pass、workspace 360→507 全 PASS、regression 0、追加コスト $0、TypeScript strict 合格。

---

## §1 担当タスクと DoD

### §1.1 担当 2 件 (Round 10 Dev-α 引継 + W3 完遂)

| # | タスク | 着地 |
|---|---|---|
| 1 | needs-scout 13-domain denylist minor 16 件補完 (BACKLOG-MINOR-DENYLIST.md) | 完遂 |
| 2 | skill-adapter subprocess 統合 (CB-D-W3-04 完遂) | 完遂 |

### §1.2 DoD 確認

| DoD | 結果 |
|---|---|
| minor 16 件 denylist 全件 patch | 完遂 (新規 14 + 既存確認 2) |
| BACKLOG ファイル完了マーク | 完遂 (各 minor 行に [x] チェック + Round 11 完遂サマリ追記) |
| skill-adapter subprocess wrap 1 fixture 通過 | 完遂 (15 tests のうち test #5 が DoD fixture: exit 0 + stdout JSON OK → parsed_from_stdout) |
| workspace test 483 → 507+ pass | **達成** (Round 10 末 360 → Round 11 着地 507、+147 件、内 Dev-A は +33 件) |
| regression 0 | 達成 (全 9 packages PASS) |
| 既存ファイル無改変原則 | 達成 (critical-domain-filter.ts は配列 append のみ; non-interactive.ts / tos-monitor / kill-switch / hash-chain / dry-run-guard.ts 完全無改変) |
| 追加コスト $0 | 達成 |
| TypeScript strict | 達成 (needs-scout / openclaw-runtime ともに pnpm typecheck exit 0) |

注: Round 10 Dev-α 報告の「workspace 483 tests pass」は DEC-019-057 起票時の見積に基づく予想値。実機計測上 Round 10 末は 360 件 (新規 cli テスト 30 + harness 拡張 +55 等は他 R11 並列 Agent 着地分。本 Dev-A 独立 +33 件はそれらと干渉せず加算)。

---

## §2 needs-scout denylist minor 16 件補完

### §2.1 対象ファイル

`projects/PRJ-019/app/needs-scout/src/filters/critical-domain-filter.ts`

- Round 10 着地配列に対し、各領域末尾に Round 11 minor 追加分を append (audit trace 維持)
- Object.freeze 完全準拠維持 (DEC-019-010)
- 関数 `applyCriticalDomainFilter` の signature / 動作不変
- 既存 export / 型定義 / Round 9 / Round 10 配列要素いずれも無改変

### §2.2 追加 keyword 内訳 (新規 14 + 既存確認 2 = 16 件)

| 領域 | 新規追加 | 既存確認 | 追加 keyword (lowercase 部分一致用) |
|---|---|---|---|
| B-01 重要インフラ | 3 | 0 | 廃棄物処理制御 / 空調 bacnet / エレベーター制御 |
| B-02 教育 | 2 | 0 | 学習進捗評価 / 学習進捗判定 |
| B-03 住居 | 3 | 0 | 修繕費判定 / 敷金判定 / 礼金算定 |
| B-04 雇用 | 1 | 0 | applicant tracking system (既存 'applicant tracking' で hit するが audit 用に明示) |
| B-05 金融 | 1 | 0 | cic スコア (CIC 株式会社 — 日本国内信用情報機関) |
| B-06 保険 | 2 | 0 | 引受査定 ai / actuary 自動 |
| B-07 法律 | 0 | 1 | legal advice (既存 line 138、追加不要) |
| B-10 製品安全 | 2 | 0 | iso 9001 判定 / iso 13485 判定 |
| B-11 国家安全保障 | 0 | 1 | cyber warfare (既存 line 207、追加不要) |
| **合計** | **14** | **2** | **= 16 件** |

### §2.3 法令条文番号 typography 方針

- Round 10 で 弁護士法 72 条 / 医師法 17 条 / 行政書士法 1 条の 2 の空白有無 2 variant 併記済 (NFKC 正規化なしの `.includes` 部分一致前提)
- Round 11 minor 16 件には法令条文番号系は含まれず、新規 typography 拡張は不要 (BACKLOG 該当なし)
- 'cic スコア' は半角空白 1 つで安定 (固有名詞 + 業界用語複合語、典型出現形を採用)

### §2.4 BACKLOG ファイル更新

`projects/PRJ-019/app/needs-scout/BACKLOG-MINOR-DENYLIST.md`

- ヘッダに **完遂** ステータス追記、5/12 drill 期日 8 日前倒し達成を明記
- minor 16 件各行に `[x]` 完了マーク追記、状態 (新規追加 / 既存確認のみ) を補足
- Round 11 着地サマリ section を新設 (新規 14 / 既存確認 2 / Object.freeze 維持 / regression test 件数記載)
- sign-off 欄に Round 11 Dev-A 行追加

### §2.5 既存 Round 10 着地ファイルへの影響

- `tos-monitor.ts` / `hash-chain` / `kill-switch.ts` / `cost-tracker.ts` / `usage-monitor.ts` / `dry-run-guard.ts` / `non-interactive.ts` 全て無改変 (file conflict 0)
- `critical-domain-filter.ts` の `applyCriticalDomainFilter` 関数本体無改変 — 配列 append のみ
- `__tests__/critical-domain-filter.test.ts` は既存 39 tests を保持し、Round 11 拡張用 18 tests を末尾追加

---

## §3 skill-adapter subprocess 統合 (CB-D-W3-04 完遂)

### §3.1 新規ファイル

| ファイル | 役割 | 行数 |
|---|---|---|
| `app/openclaw-runtime/src/skill-adapter/subprocess.ts` | subprocess wrap 本体 | 約 410 行 |
| `app/openclaw-runtime/src/skill-adapter/__tests__/subprocess.test.ts` | 単体 test (15 件) | 約 410 行 |
| `app/openclaw-runtime/src/index.ts` (extend) | export 追加 | +13 行 |

### §3.2 設計方針

- **opt-in subprocess spawn**: caller が `SubprocessSpawner` を渡した時のみ起動 (default では純関数 path 維持)
- **DryRunGuard 整合**: caller が DryRunGuardLike interface 実装を渡せば、`isDryRun=true` 時は実 spawn 呼ばず recording のみ (Round 10 Dev-γ G-12 hardguard と契約整合、harness/dry-run-guard.ts は import 0 で interface 同型依存により循環依存回避)
- **AbortController 必須**: caller の AbortSignal を観測、abort 時に SIGTERM → grace → SIGKILL fallback を adapter 内で発火 (Round 6 G-05/G-06 と整合)
- **interactive prompt 検出**: subprocess の stdout/stderr を line 単位で `isInteractivePrompt` に通し、検出時は `resolveNonInteractive` 純関数経由で fail-safe default を採用、subprocess を kill (graceful)
- **完全純関数 helper**: `splitLinesFromChunk` / `detectInteractiveInLines` は副作用 0 の純関数として export、wrap 自体は薄く保つ (テスト容易性最大化)
- **既存ファイル無改変**: non-interactive.ts は import のみ、harness/kill-switch.ts は AbortSignal 経由間接連携のみ

### §3.3 主要 export

| export | 役割 |
|---|---|
| `runSubprocessAdapter<T>(options)` | wrap 本体 (Promise<SubprocessAdapterResult<T>>) |
| `splitLinesFromChunk(acc, chunk)` | 純関数: 行分割 + remainder |
| `detectInteractiveInLines(lines, patterns?)` | 純関数: lines 中 1 件でも interactive で detected=true |
| `SubprocessHandle` / `SubprocessSpawner` / `SubprocessSpawnInput` | 依存注入 interface |
| `DryRunGuardLike` | harness/dry-run-guard.ts と同型 (import 依存回避) |
| `SubprocessAdapterResult<T>` / `RunSubprocessAdapterOptions<T>` | I/O 型 |

### §3.4 動作 5 分岐

| reason | 条件 |
|---|---|
| `dry_run_blocked` | dryRunGuard.isDryRun=true → 実 spawn 呼ばず recording のみ |
| `aborted` | spawnInput.signal が起動前 or 完了後に aborted |
| `fail_safe_interactive_detected` | stdout/stderr 行に interactive prompt 検出 → kill + 純関数 fail-safe default 返却 |
| `parsed_from_stdout` | exit 0 + stdout 全体 JSON parse + schema parse OK |
| `subprocess_failed` | exit code !== 0 |
| `unresolvable` | exit 0 だが JSON / schema parse 失敗 (caller-side fail-safe 委譲) |

### §3.5 kill chain 整合 (G-05/G-06)

- caller は AbortController.signal を spawnInput.signal に渡す
- harness/kill-switch.ts の `registerSubprocessKill` 経由で kill-switch trigger 時 → AbortController.abort
- adapter 内 abort listener が SIGTERM → killGraceMs 待機 → 残存なら SIGKILL に escalate
- 検証: test #11 (AbortController.abort 後の kill 連鎖) で SIGTERM 送信を固定化

### §3.6 DryRunGuard 整合

- `DryRunGuardLike` interface (isDryRun: boolean / wrap<T>(category, op, fn, meta)) は harness/dry-run-guard.ts の `DryRunGuard` と完全互換シグネチャ
- 同型依存により openclaw-runtime → harness の package import を回避 (W0 段階の循環依存リスク削減)
- 検証: test #3 (dry-run mode で実 spawn 呼ばず recording のみ) で動作確認

---

## §4 新規テスト一覧

### §4.1 needs-scout `__tests__/critical-domain-filter.test.ts` (+18 tests)

- 既存 Round 9 + Round 10 計 39 tests 保持
- Round 11 拡張 18 tests:
  - minor 14 件新規 keyword reject 検証 (R11-min01 〜 R11-min14)
  - minor 2 件既存確認 (R11-min15: legal advice / R11-min16: cyber warfare)
  - 構造保証 2 件 (R11-min-s1: Object.freeze / R11-min-s2: minor 14 件 batch reject)

needs-scout 全体: 61 → **79 tests** (+18)

### §4.2 openclaw-runtime `skill-adapter/__tests__/subprocess.test.ts` (15 tests)

| # | カバー内容 |
|---|---|
| 1 | splitLinesFromChunk 純関数 — 行分割 + remainder 累積 + \r\n 対応 |
| 2 | detectInteractiveInLines — lines 中 1 件でも detected=true |
| 3 | dry-run mode — 実 spawn 呼ばず recording のみ (DoD) |
| 4 | signal 既 aborted で reason='aborted' |
| **5** | **DoD fixture: exit 0 + stdout JSON OK → parsed_from_stdout** |
| 6 | exit code != 0 → subprocess_failed |
| 7 | JSON parse 失敗 → unresolvable |
| 8 | interactive 検出 → fail_safe + SIGTERM (kill chain G-05) |
| 9 | interactive 検出後 SIGTERM で die → SIGKILL 不要 |
| 10 | interactive 検出後 SIGTERM 無視 → SIGKILL escalate |
| 11 | AbortController.abort 後の kill 連鎖 (G-05/G-06) |
| 12 | stderr 経路でも interactive 検出 |
| 13 | maxBufferBytes 上限で stdout truncated |
| 14 | 純関数性 (splitLinesFromChunk + detectInteractiveInLines) |
| 15 | live mode (DryRunGuardLike isDryRun=false) は spawn を呼ぶ |

openclaw-runtime 全体 (cli テスト含む): 73 → **118 tests** (+45。本 Dev-A 寄与は subprocess 15 件、残り 30 件は他 R11 並列 Agent の cli/ 着地分)

### §4.3 合計 — Dev-A 独立寄与

- needs-scout: +18 tests
- openclaw-runtime/skill-adapter: +15 tests
- **本 Dev-A 寄与 = +33 tests**、regression 0

---

## §5 検証コマンド実行結果

実行コマンド: `cd projects/PRJ-019/app && pnpm -r test`

### §5.1 結果サマリ

| package | test files | tests | status |
|---|---|---|---|
| audit | 1 | 6 | PASS |
| needs-scout | 4 | **79** (+18) | PASS |
| scripts/openclaw-monitor | 1 | 10 | PASS |
| harness | 17 | 215 | PASS |
| claude-bridge | 3 | 29 | PASS |
| openclaw-runtime | 9 | **118** (+45 / Dev-A 寄与 +15) | PASS |
| e2e | 6 | 50 | PASS |
| notify / sandbox / orchestrator | - | (W0 stub) | SKIP |
| **合計** | **41** | **507 tests** | **all PASS** |

Round 10 末 360 → Round 11 着地 507 = **+147 件** (Dev-A 独立寄与 33 件 + 他 R11 並列 Agent 寄与 114 件)。

### §5.2 typecheck

| package | result |
|---|---|
| `cd needs-scout && pnpm typecheck` | exit 0 (TypeScript strict 通過) |
| `cd openclaw-runtime && pnpm typecheck` | exit 0 (TypeScript strict 通過) |

verbatimModuleSyntax / exactOptionalPropertyTypes 違反 0。type narrowing 課題 (signal.aborted の mutable 性) は明示的 `const abortedAfterExit = ...` で回避。

---

## §6 制約遵守

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 (DEC-019-050 cap $30 残量無消費) | 達成 |
| TypeScript strict | 達成 |
| pnpm workspace + vitest | 達成 |
| 並列 R11 8 Agent と file conflict 禁止 | 達成 (needs-scout/filters + openclaw-runtime/skill-adapter のみ touch、他 Agent の cli/ / harness/__tests__/ 等と完全分離) |
| Object.freeze 完全準拠 (DEC-019-010) | 達成 (denylist 全配列 + 新規追加分も Object.freeze 維持を test R11-min-s1 で固定化) |
| 既存ファイル無改変原則 | 達成 (critical-domain-filter.ts は配列 append のみ; non-interactive.ts / tos-monitor.ts / hash-chain / kill-switch.ts / dry-run-guard.ts 完全無改変) |
| AbortController 対応必須 | 達成 (subprocess.ts で signal listener + kill chain 整合、test #11 で固定化) |
| kill-switch G-05/G-06 整合 | 達成 (signal 経由で SIGTERM → SIGKILL fallback、circuit-breaker open は caller 側で kill-switch.registerCircuitBreakerOpen で連動可能な契約を維持) |

---

## §7 引継 + Round 12 提案

### §7.1 5/12 drill #1 期限への前倒し

- minor 16 件着地 → 5/12 drill 本番前期限を **8 日前倒し** 達成
- skill-adapter subprocess 統合着地 → CB-D-W3-04 (Phase 1 W3、5/26 内部運用着手前) を **22 日前倒し** 達成

### §7.2 Round 12 提案

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | NFKC 正規化 layer 追加 (全角半角混在対策、 dev-round10-α §7.2 引継) | Dev / Round 12 | Phase 1 W3 中 |
| 2 | denylist YAML config 直接埋込 (CB-D-W3-01) | Dev-A1 / Round 12 | Phase 1 W3 |
| 3 | subprocess adapter を実 child_process.spawn と統合 (本 wrap 層は spawner DI 想定、Real spawner 実装は Round 12) | Dev / Round 12 | Phase 1 W3 (5/26 前) |
| 4 | NDJSON 対応 (現 wrap は exit 後 stdout 全体 JSON parse 想定、進捗報告 stream 対応は Round 12) | Dev / Round 12 | Phase 1 W3 |
| 5 | kill-switch.registerSubprocessKill 経由の AbortController 連携 wiring (本 wrap は AbortSignal を観測する契約のみ提供、wiring は orchestrator 側) | Dev / Round 12 | Phase 1 W4 |

### §7.3 連動 task の進捗

- **CB-S-W0-02 (5/9 期限) ホワイトリスト v1 化**: denylist 側 critical 7 + major 26 + minor 16 = **49 件全着地** で連動側待ち状態。Review-A による fail-safe 検証は drill 前に完了見込
- **CB-D-W3-01 needs_scout skill config 直接埋込**: denylist 確定 → YAML 直書き化準備完了 (Round 12 引継)
- **CB-D-W3-04 skill non-interactive mode adapter**: **本 Round で完遂** (Round 10 純関数 + Round 11 subprocess wrap)
- **CB-D-W4-01 G-12 dry-run hardguard**: 本 wrap は DryRunGuardLike interface 経由で連動済 (Round 10 Dev-γ 着地と契約整合)

---

## §8 結論

Round 11 Dev-A は Owner 「最速で進めよ」確認 (5/4 深夜終盤) を受けた最速進行ディスパッチを独立 Agent 経路 (DEC-019-025) で完遂。

needs-scout denylist minor 16 件 (新規 14 + 既存確認 2) 補完で 5/12 drill 期限を 8 日前倒し、skill-adapter subprocess 統合で CB-D-W3-04 を 22 日前倒し完遂。

DryRunGuard 整合 + AbortController kill chain (G-05/G-06) + interactive 検出 fail-safe を opt-in 設計で実装、既存 non-interactive.ts / dry-run-guard.ts / kill-switch.ts いずれも無改変。

新規 33 tests (denylist 18 + subprocess 15) 全 pass、workspace 全体 360→507 全 PASS、regression 0、追加コスト $0、TypeScript strict 合格、Object.freeze 完全準拠維持。

---

**Sign-off**: 2026-05-04 W0-Week1 深夜終盤 / Dev R11 Dev-A
**次回**: Round 12 で NFKC 正規化 layer + 実 child_process.spawn 統合 + NDJSON 対応 + denylist YAML 直書き化 (CB-D-W3-01) を引継
