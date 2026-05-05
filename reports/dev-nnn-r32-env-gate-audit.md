# Dev-NNN R32 / Task 3: env-gate audit (Owner ACK 撤回検出)

- Round: PRJ-019 Round 32 / 9 並列 5 軸目
- Owner 拘束: 0 分 / 副作用: 0 / 実 API call $0

## 1. 目的
`env.OWN_W5_PROD_ACK` の状態変化を監査し、撤回 (granted → revoked/absent) を検出した瞬間に runtime mode を `live` から `dry-run` へ自動 downgrade、かつ injection 経由で通知を発火する。

## 2. 状態と遷移
- AckState: `granted | revoked | absent`
- transition kind: `first-observe | granted | revoked | no-change`
  - first-observe: 初回観測（mode 維持 / 通知なし）
  - granted: 非 granted → granted（mode → live / 通知）
  - revoked: granted → 非 granted（mode → dry-run / 通知）
  - no-change: 同一遷移（mode 維持 / 通知なし）

## 3. 公開 API
- `auditOnce(prev, prevMode, inj): AuditEvent`
- `runAuditSeries(states, inj): AuditTrail`
- `classifyTransition`, `deriveModeAfter` は純粋関数

## 4. 通知配信
`inj.notify(event)` を経由し、配信先 (Slack / PagerDuty / email) は wire 層が担当。本 module は副作用 0、abstract 化のみ。

## 5. test 設計（+8 case）
1. first observe granted → first-observe / mode=live
2. granted→revoked → revoked / dry-run / notify
3. revoked→granted → granted / live / notify
4. no-change → 通知なし
5. classifyTransition: absent→revoked = no-change（granted 経由でない）
6. deriveModeAfter: revoked → dry-run
7. series granted-revoked-granted → finalMode=live
8. series granted-revoked-revoked → finalMode=dry-run

## 6. 出力 file
- 実装: `projects/PRJ-019/app/openclaw-runtime/src/audit/env-gate-audit.ts` (≤140 行)
- test: `.../audit/__tests__/env-gate-audit.test.ts` (8 case)

## 7. DEC-019-068 連動
Owner ACK 撤回時の auto-downgrade は DEC-019-068 5 trigger 体系のうち env-gate trigger を実装する成果物。実 API call $0、mock injection 厳守。

## 8. fix forward-only
回帰時は patch 重ね適用。既存 module に手は入れない。
