# 17 day path — 7 control spec (Round 16 第 2 波着手)

## Meta
- 作成: 2026-05-05 (Round 16 第 2 波 Dev-R 担当)
- Owner formal authorize: 取得済 (R16-W2 kickoff)
- 完遂目標: 17 日 path (W1-W3, 5/9 - 5/25)
- Round 16 段階成果: spec + skeleton + zod schema + Vitest test stub
- 制約: API $0、副作用 0、harness 607 + workspace 1,365 tests PASS 維持
- 出典: review-mandatory-controls-50-final.md / DEC-019-062 / Plan 8-Full

## 7 control 一覧

| ID | 名称 | 連動 | week |
|----|------|------|------|
| P-UI-02 | cool-down モーダル | UX 異常検知統合 | W2 (5/16-22) |
| P-UI-04 | kill switch propagation | G-02 連動 | W1 fallback (5/9-15) |
| P-UI-05 | 異常検知 + rollback | KE-04 連動 | W2 (5/16-22) |
| HITL-10 | 権限変更 Owner 承認 | P-UI-07 連動 | W2 (5/16-22) |
| C-OC-03 | API contract test | R-019-12-A mitigation | W1 (5/9-15) |
| C-OC-04 | breaking change 検知 → 1h escalation | C-OC-03 連動 | W1 (5/9-15) |
| P-UI-09 | RLS checklist | Review 主担当 | W3 (5/23-25) |

---

## P-UI-02 — cool-down モーダル
- **目的**: Open Claw の連続誤動作を 30s cool-down で防ぐ。loop 強制 abort 後 next loop 起動を 30s 抑止し、Owner に UI モーダルで警告を可視化。
- **入力**: `{ triggerEvent: 'loop_abort'|'manual_stop'|'kill_switch'; abortedAt: ISO8601; loopId: string }`
- **出力**: `{ cooldownState: 'active'|'expired'|'overridden'; remainingMs: number; nextAllowedAt: ISO8601 }`
- **state machine**: `idle → triggered (event 受領) → active (30s 計時) → expired (自動解除) | overridden (Owner force release HITL)`
- **error handling**: clock skew (System time 後退) → fail-closed (cooldown 継続)。多重 trigger は最後勝ち + 既存残り時間にリセット。
- **test plan**: ① trigger → 30s 後 expired ② override → HITL 第 12 種承認後解除 ③ clock skew detect → 例外 throw

## P-UI-04 — kill switch propagation
- **目的**: kill switch トリガから 30s 以内に全子プロセス (claude-bridge / OpenClaw subprocess / skill subprocess) へ SIGTERM → SIGKILL 連鎖を到達させる。
- **入力**: `{ killReason: string; initiatedAt: ISO8601; pidTree: number[] }`
- **出力**: `{ totalKilled: number; survivors: number[]; latencyMs: number; status: 'all_terminated'|'partial'|'failed' }`
- **state machine**: `armed → fired (kill 信号) → graceful (SIGTERM × 全 PID, 5s 待機) → forceful (SIGKILL × 残存) → verified (ps tree 再走査) → done`
- **error handling**: pid 解決失敗 → 例外捕捉 + survivors リスト追加。30s 超過 → fail-loud + harness #drill にエスカレ。
- **test plan**: ① pidTree 5 個に対し全終了 ② 1 個が SIGTERM 無視 → SIGKILL で終了 ③ latency p95 < 30000ms

## P-UI-05 — 異常検知 + rollback
- **目的**: Open Claw loop の異常パターン (cost burst / loop time 異常 / output 異常) を検知し、直近健全 commit へ自動 rollback する。
- **入力**: `{ metric: 'cost_per_loop'|'loop_duration'|'output_anomaly'; observedValue: number; threshold: number; loopId: string }`
- **出力**: `{ anomalyDetected: boolean; rollbackTriggered: boolean; rollbackToCommit?: string; reason: string }`
- **state machine**: `monitoring → anomaly_suspected (1 metric 越え) → confirmed (連続 2 loop 越え) → rollback_initiated → rollback_completed | rollback_failed`
- **error handling**: rollback 失敗 → kill switch 自動発火 (P-UI-04 連動)。検知 metric が NaN → ログ + 検知 skip (fail-open は許容しない代わりに Review escalate)。
- **test plan**: ① threshold 超過 → confirmed → rollback ② 単発超過は無視 ③ rollback 失敗 → kill switch 連動

## HITL-10 — 権限変更 Owner 承認
- **目的**: 権限境界 (env allow-list / sandbox policy / sub-agent 委任 scope) の変更時に必ず Owner 承認 (HITL 第 10 種) を要求する。
- **入力**: `{ changeType: 'env'|'sandbox'|'delegation'; before: string; after: string; requesterRole: string; rationale: string }`
- **出力**: `{ approvalState: 'pending'|'approved'|'rejected'|'timeout'; approvedAt?: ISO8601; expiresAt: ISO8601; ticketId: string }`
- **state machine**: `requested → notified (Owner Slack/Email) → owner_decision (24h SLA) → approved | rejected | timeout (auto reject)`
- **error handling**: 通知失敗 → 60s リトライ × 3、それでも失敗 → CEO 部署にフォールバック通知 (但し最終承認は Owner 必須)。
- **test plan**: ① 権限変更 → HITL 通知 → approve → 適用 ② reject → 変更破棄 ③ 24h timeout → 自動 reject ④ Owner 通知失敗 → CEO fallback

## C-OC-03 — API contract test
- **目的**: OpenClaw upstream OSS の CLI / config schema が破壊的変更されていないか月次で contract test を実行。
- **入力**: `{ runId: string; upstreamRef: string; localFixturePath: string }`
- **出力**: `{ matched: boolean; diffs: Array<{ field: string; before: string; after: string; severity: 'major'|'minor'|'patch' }>; reportPath: string }`
- **state machine**: `scheduled → fetching_upstream → comparing → matched | mismatched (→ C-OC-04 trigger)`
- **error handling**: upstream 取得失敗 → soft fail (前回結果保持 + Slack 通知のみ)。fixture 破損 → fail-loud。
- **test plan**: ① fixture 一致 → matched ② breaking change 検出 → C-OC-04 invoke ③ upstream 取得失敗 → soft fail

## C-OC-04 — breaking change 検知 → 1h escalation
- **目的**: C-OC-03 で major severity diff 検出時 1 時間以内に Slack #drill + CEO へエスカレーション、Phase 移行止め。
- **入力**: `{ contractRunId: string; majorDiffs: Array<{ field: string; before: string; after: string }>; detectedAt: ISO8601 }`
- **出力**: `{ escalationId: string; notifiedChannels: string[]; phaseGateBlocked: boolean; ackDeadline: ISO8601 }`
- **state machine**: `detected → notifying (Slack #drill + CEO email) → ack_pending (1h SLA) → acknowledged | escalated_to_owner (1h timeout)`
- **error handling**: Slack 送信失敗 → email fallback。両方失敗 → audit log に critical 記録 + CronCreate で 5 分後再試行。
- **test plan**: ① major diff → 1h 以内 Slack + CEO 通知 ② ack 取得 → resolved ③ 1h timeout → Owner エスカレ ④ 通知 2 系統失敗 → critical log

## P-UI-09 — RLS checklist
- **目的**: Supabase RLS policy が `ROLE × Operation × Tenant = 105` ケース全て期待挙動であることを Review 部門主担当で検証。
- **入力**: `{ matrix: Array<{ role: string; operation: 'select'|'insert'|'update'|'delete'; tenant: string; expected: 'allow'|'deny' }> }`
- **出力**: `{ totalCases: number; passed: number; failed: number; failures: Array<{ role: string; operation: string; tenant: string; actual: string; expected: string }> }`
- **state machine**: `prepared → executing (105 ケース順次) → completed → reviewed (Review 部門署名) | rejected (失敗 1 件以上で Phase 1 gate block)`
- **error handling**: RLS query timeout → 該当 case を `inconclusive` 扱い (失敗ではない)、5 件以上 inconclusive で全体 abort。
- **test plan**: ① 105 ケース × 全 allow/deny 期待 → 100% pass ② 1 件 fail → failures 配列出力 + Review escalate ③ timeout 6 件 → abort

---

## W1-W3 milestone

### W1 (5/9 - 5/15) — contract & kill 基盤
- C-OC-03 / C-OC-04 完成 (contract test runner + escalation pipeline)
- P-UI-04 完成 (kill switch fallback path)
- harness/workspace tests 維持
- Mid-check: 5/15 Review 部門

### W2 (5/16 - 5/22) — UX & HITL
- P-UI-02 / P-UI-05 / HITL-10 完成
- 異常検知 → cool-down → rollback → HITL の連鎖統合 e2e
- Mid-check: 5/22 PM 部門

### W3 (5/23 - 5/25) — RLS 検証 + 統合
- P-UI-09 105 ケース実行 + Review 署名
- 7 control 統合 e2e (kill propagation → cooldown → rollback → HITL → contract)
- Phase 1 gate 通過: 5/25 までに全 7 control green
