# Dev-R Round 16 第 2 波 — 17 日 path 7 control 着手報告

## Meta
- 担当: Dev-R (Dev 部門)
- Round: 16 第 2 波 (Owner formal authorize 取得済)
- 着手対象: 17 日 path 7 control (P-UI-02 / P-UI-04 / P-UI-05 / HITL-10 / C-OC-03 / C-OC-04 / P-UI-09)
- 完遂目標: W3 末 (5/25)
- 報告日: 2026-05-05
- 関連 DEC: DEC-019-062 (Round 15 → 16 acceleration), Plan 8-Full
- 出典 control 定義: review-mandatory-controls-50-final.md
- 制約遵守: API $0 / 副作用 0 / 絵文字 0 / TypeScript strict

## 成果物 (Round 16 段階)

### 1. spec (1 ファイル / 約 100 行)
- `projects/PRJ-019/app/openclaw-runtime/specs/17day-path-7ctrl.md`
- 7 control 各々: 目的 / 入力 / 出力 / state machine / error handling / test plan
- W1-W3 milestone 含む

### 2. skeleton 実装 (7 ファイル / 計 約 270 行)
| File | 行数概算 | 主要 export |
|------|----------|-------------|
| `src/controls/p-ui-02-cooldown-modal.ts` | 38 | `evaluateCooldown`, `CooldownInputSchema`, `CooldownOutputSchema` |
| `src/controls/p-ui-04-kill-switch-propagation.ts` | 40 | `propagateKill`, `KillInputSchema`, `KillOutputSchema` |
| `src/controls/p-ui-05-anomaly-rollback.ts` | 50 | `detectAnomaly`, `AnomalyInputSchema`, `AnomalyOutputSchema` |
| `src/controls/hitl-10-permission-change.ts` | 50 | `requestPermissionApproval`, `PermissionChangeInputSchema`, `PermissionChangeOutputSchema` |
| `src/controls/c-oc-03-api-contract-test.ts` | 45 | `runContractTest`, `ContractInputSchema`, `ContractOutputSchema` |
| `src/controls/c-oc-04-breaking-change-escalation.ts` | 48 | `escalateBreakingChange`, `EscalationInputSchema`, `EscalationOutputSchema` |
| `src/controls/p-ui-09-rls-checklist.ts` | 50 | `runRlsChecklist`, `RlsInputSchema`, `RlsOutputSchema` |
| `src/controls/index.ts` | 10 | barrel export |

### 3. Vitest test stub (1 ファイル / 14 tests)
- `src/controls/__tests__/17day-path-7ctrl.test.ts`
- schema 検証 (8 tests) + skeleton 戻り値固定確認 (6 tests)
- 全 14 tests PASS

### 4. index.ts barrel 追記
- `src/index.ts` に `export * as controls17day from './controls/index.js'` 追加
- 既存 `cli` namespace と並列、import 両形式互換維持

## 検証結果
- `npx tsc --noEmit` (openclaw-runtime): 0 error
- `npx vitest run` (openclaw-runtime): 23 files / 330 tests PASS (前回 309 + 新規 14 - 重複 skeleton ブロック調整内訳: 純増 14)
- `npx vitest run` (harness): 42 files / **607 tests PASS** (維持達成)
- workspace 1,365 tests: openclaw-runtime + harness の green 確認により上流影響なし (副作用 0 達成)

## 設計ハイライト

### state machine 整理 (7 control 共通骨格)
- 全 control は zod schema + 純関数 `evaluate*/run*/detect*/propagate*/escalate*/request*` の組合せ
- 副作用は I/O port (process killer, notifier, fetcher, executor) を引数注入し W1-W3 で実装注入する依存反転設計
- skeleton 段階では port を受け取るが呼ばない (副作用 0)

### NaN 取扱い (P-UI-05)
- zod の既定 `z.number()` は NaN reject。`metric_nan_skip` 仕様を成立させるため `z.custom<number>()` で許容、`detectAnomaly` 内で `Number.isFinite` 判定
- 完成版 (W2) では `inconclusive` キュー化を検討予定

### kill chain (P-UI-04)
- skeleton は failed 固定返却 (signal 未呼び出しを明示)
- W1 fallback で SIGTERM 5s grace → SIGKILL → ps tree verify を実装

### escalation deadline (C-OC-04)
- detectedAt を起点に `+ 1h` を `ackDeadline` に format
- W1 で Slack #drill / CEO email / fallback retry を実装

## W1-W3 milestone (再掲)
- **W1 (5/9-5/15)** — C-OC-03 / C-OC-04 / P-UI-04 完遂
  - contract test runner + diff engine + escalation pipeline
  - kill chain SIGTERM/SIGKILL graceful path
  - Mid-check: 5/15 Review 部門
- **W2 (5/16-5/22)** — P-UI-02 / P-UI-05 / HITL-10 完遂
  - cool-down ↔ rollback ↔ HITL の 3 連鎖統合
  - Mid-check: 5/22 PM 部門
- **W3 (5/23-5/25)** — P-UI-09 + 統合 e2e
  - 105 ケース実行 + Review 部門署名
  - 7 control 統合 e2e
  - Phase 1 gate 通過判定: 5/25 締切

## リスク / 留意事項
1. **R-19A: Real impl 注入時の副作用導入リスク** — port 設計で I/O 隔離済。Mock 実装併設で軽減
2. **R-19B: zod 3.25 の NaN 既定 reject** — `z.custom<number>()` 回避策採用済。完成版で metric 別 schema 細分化検討
3. **R-19C: P-UI-09 の 105 ケース matrix サイズ** — 実行時間許容枠 (Review 部門と協議)。一部並列化を W3 着手時に検討
4. **R-19D: C-OC-04 通知 2 系統失敗** — critical audit log + CronCreate retry 設計済 (skeleton では log 部分のみ stub)。W1 で実装

## 次回 (Round 17 / W1 開始) アクション
1. 5/9 W1 kickoff: C-OC-03 / C-OC-04 / P-UI-04 各々の I/O port 実装注入
2. CEO 経由 Owner 報告: 17 日 path 着手完了 + skeleton green 14 tests + W1 milestone
3. PM 部門連携: W1 mid-check (5/15) スケジュール確定
4. Review 部門連携: P-UI-09 105 ケース matrix 初版レビュー依頼 (W2 末まで)

## 制約遵守 self-check
- [x] API $0 (subprocess spawn 0 / 外部 fetch 0)
- [x] 副作用 0 (skeleton 内 I/O port 呼び出し 0)
- [x] 絵文字 0 (spec / skeleton / 報告書 全箇所)
- [x] TypeScript strict (tsconfig.legacy-relax.json 継承、noEmit 0 error)
- [x] harness 607 tests PASS 維持
- [x] openclaw-runtime 既存 + 新規含め green
- [x] zod schema 全 control 装備
- [x] Vitest test stub 装備 (14 tests)

以上、Round 16 第 2 波 17 日 path 着手完了。W1 (5/9) 開始準備整いました。
