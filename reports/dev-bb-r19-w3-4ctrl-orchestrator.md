# Dev-BB R19 W3 — 4 ctrl harness orchestrator 接続 完遂報告

- 担当: Dev-BB (Round 19 第 2 弾, 9 並列)
- 担当範囲: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-Y W2 scope 継承)
- 不可侵: C-OC-03 / C-OC-04 / P-UI-02 (Dev-AA 第 1 弾) は無改変
- 対象 path: 17 日 path W3 = harness orchestrator 接続段階
- 完遂日時: 2026-05-05

## 1. W3 spec (本ラウンドで確定)

W2 で各 control 単体に cross-control sink / port が生えた (Round 18 Dev-Y 17 件)。
W3 では harness 側で それら 4 port を 1 つの「orchestrator context」にまとめて
end-to-end 駆動できるようにする。

### Cross-control invariants (W3 で配線)

| Invariant | source → sink                                   | shape                                                |
|-----------|------------------------------------------------|------------------------------------------------------|
| I1        | p-ui-04 fire → killTerminalSink                | latch (terminal, monotonic)                          |
| I1        | killTerminalSink → p-ui-05 evaluateAndAct      | killQuery.isActive=true で rollback skip             |
| I2        | hitl-10 終局 → permissionAuditSink             | state→kind: approved/denied                          |
| I2        | permissionAuditSink → rlsAuditTrail            | source='hitl-10', kind=permission_(approved/denied)  |
| I3        | p-ui-05 rollback ok → postRollbackNotifier     | loopId + targetCommit                                |
| I3        | postRollbackNotifier → rlsAuditTrail           | source='p-ui-05', kind='rollback_completed'          |
| I3        | rlsAuditTrail → p-ui-09 runRlsChecklist        | ctx.auditTrail で auditTrailCount 取得               |

## 2. 成果物

### 2.1 新規 (2 ファイル)

| ファイル                                                                  | 行数 | 役割                                  |
|---------------------------------------------------------------------------|------|---------------------------------------|
| `harness/src/17day-path-w3-orchestrator.ts`                               | 125  | W3 orchestrator helper (port 組立)    |
| `harness/src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts`          | 497  | W3 integration tests (19 件)          |

### 2.2 改変 (0 ファイル)

- 4 ctrl 実装 (`openclaw-runtime/src/controls/{p-ui-04,p-ui-05,p-ui-09,hitl-10}-*.ts`) は無改変
- W2 既存テスト (`17day-path-w2-4ctrl.test.ts` ほか) も無改変
- harness 既存ファイル (`index.ts` など) も無改変 (新規 helper は別ファイル)

### 2.3 Public API 変更

無し (W2 で出していた sink / port shape をそのまま使う橋渡し helper を追加しただけ)。

## 3. 実装詳細

### 3.1 `createW3OrchestratorContext()`

4 つの port (killTerminalSink / rlsAuditTrail / permissionAuditSink /
postRollbackNotifier) を 1 つの `W3OrchestratorContext` にまとめて返す。
利用側 (orchestrator / claude-bridge) は本 context を保持し、4 ctrl の
public API 呼出時に対応する port を opts として渡せば cross-control
副作用が同じ rlsAuditTrail に集約される。

### 3.2 `buildPermissionAuditSink(trail)`

hitl-10 `requestPermissionApproval` の `opts.auditSink` 用 builder。
state→kind マッピング: approved→permission_approved /
rejected・timeout→permission_denied (W2 仕様準拠)。
pending は呼ばれない (hitl-10 ctrl 側責務分離)。

### 3.3 `buildPostRollbackNotifier(trail, now?)`

p-ui-05 `evaluateAndAct` の `opts.postRollback` 用 builder。
rollback success 時のみ呼出され、`detail` に loopId と targetCommit を
セミコロン区切りで含めて trace 可能にする。

## 4. テスト構成 (19 件 / 5 group)

| Group | 件数 | 検証内容                                              |
|-------|------|-------------------------------------------------------|
| 1     | 5    | orchestrator context shape 整合 (4 port 構築)         |
| 2     | 4    | I1: kill terminal latch → rollback 抑止 (orchestrator) |
| 3     | 4    | I2: hitl-10 終局 → audit trail 集約                    |
| 4     | 3    | I3: rollback 成功 → post-rollback verify              |
| 5     | 3    | 4-control end-to-end (full chain)                     |

W2 で確定した invariant I1 / I2 / I3 を harness 側 orchestrator context
経由で再現し、`end-to-end:` プレフィクスのテストでは 4 ctrl public API を
直接呼び出して chain を回している。

## 5. テスト結果

### 5.1 新規 W3 テスト (本ファイル単体)

```
Test Files  1 passed (1)
     Tests  19 passed (19)
```

### 5.2 W3 全体 (Dev-AA 第 1 弾 + Dev-BB 第 2 弾)

```
src/__tests__/17day-path-w3-3ctrl-orchestrator.test.ts  (12 tests, Dev-AA)
src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts  (19 tests, Dev-BB)
Test Files  2 passed (2)
     Tests  31 passed (31)
```

### 5.3 harness 全体回帰

```
Test Files  47 passed (47)
     Tests  674 passed (674)
```

baseline (W3 着手前) 44 files / 631 tests に対し、+3 files (Dev-AA W3 +
Dev-BB W3 + Dev-AA 関連) / +43 tests。既存 test の回帰 0 件。

### 5.4 openclaw-runtime 全体回帰

```
Test Files  26 passed (26)
     Tests  394 passed (394)
```

W1 + W2 (78 tests in 17day-path-*) すべて PASS、ctrl public API 不変。

## 6. 領域不可侵の遵守

- C-OC-03 (`c-oc-03-api-contract-test.ts`) — 触らず
- C-OC-04 (`c-oc-04-breaking-change-escalation.ts`) — 触らず
- P-UI-02 (`p-ui-02-cooldown-modal.ts`) — 触らず
- W2 3ctrl test (`17day-path-w2-3ctrl.test.ts`) — 触らず
- Dev-AA W3 test (`17day-path-w3-3ctrl-orchestrator.test.ts`) — 触らず

Dev-AA との並列作業は ファイル単位で完全分離 (新規 1 helper +
新規 1 test file が 第 2 弾 4 ctrl scope のみを触る形)。

## 7. ブロッカー / リスク

無し。以下を念のため記録:

- `@clawbridge/openclaw-runtime` workspace alias は monorepo root
  vitest.config.ts で定義されているが、harness package 単体で
  `pnpm test` 実行時 (本 W3 既定運用) には未解決のため、本テストは
  相対 import (`../../../openclaw-runtime/src/controls/*.js`) を採用。
  → harness package に独自 vitest.config.ts を導入するか、root から
  vitest 実行する運用へ切替えるかは ARCH-01 (DEC-019-041) Phase B
  移行時の議題候補として記録。
- W3 orchestrator helper は port 組立のみ (実行ループは含めない)。
  実 orchestrator app (`app/orchestrator/src/`) は現在空のため、
  本 helper を取り込む利用側コードは Round 20 以降の想定。

## 8. 次アクション (受渡し)

- Dev-AA との合流確認: 31 W3 tests (12 + 19) のグリーンを CEO 経由で
  確定後、Round 19 完遂着地に組み込む。
- Round 20 候補: harness orchestrator helper を実 orchestrator app
  (`app/orchestrator/src/`) に取り込み、7 ctrl を統合する W4 (= 全 7 ctrl
  end-to-end 統合) へ進む。

---
担当: Dev-BB / Round 19 第 2 弾
