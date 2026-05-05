# Dev-AA Round 19 — 17 day path W3 (3 ctrl harness orchestrator 接続)

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-AA (Round 19 第 1 弾, 9 並列の 1)
- 範囲: C-OC-03 / C-OC-04 / P-UI-02 (Dev-X scope 継承, 3 ctrl)
- 目的: W2 で確立した cross-control invariants (Round 18, 28 件) を harness 側で end-to-end 駆動する整合性レイヤを実装。
- 領域不可侵: Dev-BB 担当 (P-UI-04 / P-UI-05 / P-UI-09 / HITL-10) に触れない。

## 1. W3 spec scope (確定版)

| 軸 | 内容 |
|---|---|
| orchestration shape | C-OC-03 → projection → C-OC-04 → (独立) P-UI-02 cooldown gate の 4 段 chain |
| control invocation sequence | contract first → escalation second の deterministic 順序保証 |
| failure handling chain | fixture_corrupted / fetch_timeout throw → CycleAbortedResult、escalation 不発火 |
| 独立軸保証 | phase gate (C-OC-04) と cooldown (P-UI-02) は独立タイムライン |
| 依存方向制約 | harness → openclaw-runtime 禁止 (control-agnostic / port-injection 設計) |

## 2. 設計判断

- **依存方向制約**: openclaw-runtime → harness の依存方向を維持するため、harness 側の orchestrator は **control-agnostic** (port 注入) で実装。3 control の関数 signature を構造的部分型として再宣言し、zod 等の重い再 import を避けた。
- **Public API 不変**: 既存 control 3 ファイル (`c-oc-03-api-contract-test.ts` / `c-oc-04-breaking-change-escalation.ts` / `p-ui-02-cooldown-modal.ts`) には一切手を加えていない。orchestrator は port 経由の adapter として機能。
- **W1 + W2 不変保証**: orchestrator は port 出力に副作用を加えない pure pass-through。同 inputs → 同 outputs の deterministic を test (O-10) で明示検証。

## 3. 実装ファイル

| Path | 種別 | 行数 |
|---|---|---|
| `app/harness/src/openclaw-orchestrator.ts` | NEW (orchestrator 本体) | 約 220 行 |
| `app/harness/src/index.ts` | MODIFY (公開 export 追加) | +20 行 |
| `app/harness/src/__tests__/17day-path-w3-3ctrl-orchestrator.test.ts` | NEW (W3 integration tests) | 約 360 行 |

### 3.1 orchestrator 公開 API

```ts
createOpenClawOrchestrator(ports: OpenClawOrchestratorPorts): OpenClawOrchestrator
projectMajorDiffsToEscalation(...)  // pure helper, W2 I-1/I-2/I-3 整合
isCycleAborted(result)              // type guard
```

`OpenClawOrchestrator` は 2 メソッド:
- `runOpenClawCycle(input)` — contract → projection → escalation の chain 駆動
- `evaluateCooldownGate(input)` — P-UI-02 を独立軸として port 越し評価

## 4. W3 integration tests (12 件追加)

| ID | 検証項目 | W2 invariant 対応 |
|---|---|---|
| O-1 | major diff → escalation 1 回呼出 → phaseGateBlocked=true | I-1 / I-4 |
| O-2 | soft-fail → escalation 0 回 | I-2 |
| O-3 | patch / minor only → escalation 0 回 | I-3 |
| O-4 | fixture_corrupted throw → CycleAbortedResult | I-9 |
| O-5 | fetch_timeout throw → abortReason='fetch_timeout' | (新規, W3 拡張) |
| O-6 | contractRunId が escalation payload に伝搬 | I-10 |
| O-7 | invocation order = contract → escalation の sequence guarantee | (新規, W3 shape) |
| O-8 | phase gate blocked と cooldown active の独立評価 | I-5 |
| O-9 | ackDeadline / nextAllowedAt 独立 timeline (1h 対 30s) | I-8 |
| O-10 | deterministic — 同 port 出力 → 同 orchestrator 出力 | (純関数性) |
| O-11 | 連続 2 cycle で port 各 2 回 / 独立判定 / state leak なし | (新規, W3 拡張) |
| O-12 | isCycleAborted type guard + projection helper 整合 | I-1/I-2/I-3 |

## 5. テスト結果

```
$ pnpm test (harness package, full suite)

baseline (Round 18 末)         : 631 PASS / 0 FAIL / 44 test files
本タスク後 (本 file のみ)       : 643 PASS / 0 FAIL / 45 test files
本タスク後 (Dev-BB の file 含む): 655 PASS / 1 file 読込失敗 / 47 test files
                                  (Dev-BB の 17day-path-w3-4ctrl-orchestrator.test.ts が
                                   @clawbridge/openclaw-runtime を直接 import → 解決失敗)
```

- 本 file 単独実行: `12 PASS / 0 FAIL` (約 7 ms)
- harness 全体: 私の追加分は 12 全て PASS、既存 631 全て regression なし
- openclaw-runtime: `394 PASS / 0 FAIL` (regression check 済)
- typecheck: 私の新規 file `openclaw-orchestrator.ts` は strict mode で型エラー 0
  (既存の knowledge/ 配下の TS errors は pre-existing、私の変更とは無関係)

## 6. blocker (Dev-BB 側、私の責務外だが記録)

- `src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts` (Dev-BB が作成中の隣接 file) が
  `@clawbridge/openclaw-runtime` を直接 import しているが、harness の `package.json` には
  openclaw-runtime が deps に無い (依存方向逆転)。 → **port-injection への設計変更が必要**。
- 私 (Dev-AA) は同じ理由で control-agnostic 設計を選択済み。Dev-BB 側にも本パターン継承を推奨。
- 加えて `src/17day-path-w3-orchestrator.ts` (Dev-BB 側 orchestrator 本体) が
  openclaw-runtime のソースを cross-rootDir で import → tsc rootDir error。

→ Dev-BB 引継ぎ時に共有 (CEO 経由)。

## 7. 領域不可侵 確認

- 触っていない file: `p-ui-04-kill-switch-propagation.ts` / `p-ui-05-anomaly-rollback.ts` /
  `p-ui-09-rls-checklist.ts` / `hitl-10-permission-change.ts` (Dev-BB / Dev-Y scope)
- 触っていない file: c-oc-03 / c-oc-04 / p-ui-02 の control 本体 (Public API 不変)
- 既存 W2 test 2 file (3ctrl / 4ctrl) も触っていない

## 8. 完了判定

- [x] W3 spec scope 確定 (orchestration shape / sequence / failure chain / 独立軸)
- [x] orchestrator 実装 (control-agnostic port-injection)
- [x] 12 integration tests 全 PASS
- [x] W1 + W2 regression 0 件 (harness 631 baseline 全保持 + openclaw-runtime 394 全保持)
- [x] TypeScript strict 0 件 (新規 file)
- [x] Public API of any ctrl 不変
- [x] 領域不可侵 (Dev-BB 4 ctrl に touch せず)
