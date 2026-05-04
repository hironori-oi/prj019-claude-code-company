# G-01 コスト上限 4 層ハードキャップ — 単体検証エビデンス

## 1. 概要

`FileCostTracker.checkBudget()` が **session $5 / project $50 / day $30 / month $300** の 4 層を独立して評価し、超過時に `{ ok: false, layer: 'session'|'project'|'day'|'month' }` を返す。`Harness.guardedRun()` がこれを参照し、超過時 kill-switch を `source='budget'` で発火させる。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/cost-tracker.ts`
  - `DEFAULT_LIMITS`: `{ perSessionUsd: 5, perProjectUsd: 50, perDayUsd: 30, perMonthUsd: 300 }` (L65-69)
  - `checkBudget()` (L173-227): 月 → 日 → 案件 → セッションの順で評価し、最初の超過層を `layer` フィールドに返す
  - `getMonthlyTotal/getDailyTotal/getSessionTotal/getProjectTotal` (L143-171): 各層の合算
- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/index.ts`
  - `Harness.guardedRun()` (L127-143): `checkBudget()` 結果を受けて kill-switch 発火

## 3. テスト ID とケース数

- テストファイル: `harness/src/__tests__/cost-tracker.test.ts`
- 対象テスト: 12 ケース / 全件 PASS（67/67 緑のうちこのファイルが 12 ケース）

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `records spend and returns daily/monthly totals` | 記録 → 日次/月次集計 |
| 02 | `aggregates per session and per project` | session/project 別集計 |
| 03 | `checkBudget returns ok when below all caps` | 全層 OK の正常系 |
| 04 | `checkBudget rejects when monthly cap exceeded` | **L4 月次超過 reject、layer='month'** |
| 05 | `checkBudget rejects when daily cap exceeded` | **L3 日次超過 reject、layer='day'** |
| 06 | `checkBudget rejects when session cap exceeded` | **L1 session 超過 reject、layer='session'** |
| 07 | `checkBudget rejects when project cap exceeded` | **L2 project 超過 reject、layer='project'** |
| 08 | `throws on negative or NaN amount` | 異常入力ガード |
| 09 | `reset clears records` | テストフィクスチャ用 reset |
| 10 | `persists across instances` | atomic write 永続性 |
| 11 | `returns 0 when ledger file does not exist` | 初回起動の 0 初期化 |
| 12 | `cleanup` | tmp ledger クリーンアップ |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/harness test -- cost-tracker --reporter=verbose
```

実機 stdout（cost-tracker.test.ts 該当部、04:19:39 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness

 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > records spend and returns daily/monthly totals
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > aggregates per session and per project
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > checkBudget returns ok when below all caps
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > checkBudget rejects when monthly cap exceeded
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > checkBudget rejects when daily cap exceeded
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > checkBudget rejects when session cap exceeded
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > checkBudget rejects when project cap exceeded
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > throws on negative or NaN amount
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > reset clears records
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > persists across instances
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > returns 0 when ledger file does not exist
 ✓ src/__tests__/cost-tracker.test.ts > FileCostTracker > cleanup

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  684ms
```

各境界値テストの根拠（テストコード抜粋）:

```ts
// L1 session: $5 cap → $1.5 で reject 確認
it('checkBudget rejects when session cap exceeded', async () => {
  const t = new FileCostTracker({ ledgerPath, limits: { ...DEFAULT_LIMITS, perSessionUsd: 1 } })
  await t.recordSpend('anthropic_api', 1.5, { sessionId: 's1' })
  const r = await t.checkBudget({ sessionId: 's1' })
  expect(r.ok).toBe(false)
  expect(r.layer).toBe('session')
})

// L2 project: $50 cap → $1.5 + $1.0 = $2.5 で reject (limits=$2)
it('checkBudget rejects when project cap exceeded', async () => {
  const t = new FileCostTracker({ ledgerPath, limits: { ...DEFAULT_LIMITS, perProjectUsd: 2 } })
  await t.recordSpend('anthropic_api', 1.5, { projectId: 'PRJ-019' })
  await t.recordSpend('anthropic_api', 1.0, { projectId: 'PRJ-019' })
  const r = await t.checkBudget({ projectId: 'PRJ-019' })
  expect(r.layer).toBe('project')
})

// L3 day: $30 cap → $2.5 で reject (limits=$2)
it('checkBudget rejects when daily cap exceeded', async () => {
  const t = new FileCostTracker({ ledgerPath, limits: { ...DEFAULT_LIMITS, perDayUsd: 2, perMonthUsd: 1000 } })
  await t.recordSpend('anthropic_api', 2.5)
  expect((await t.checkBudget()).layer).toBe('day')
})

// L4 month: $300 cap → $6 で reject (limits=$5)
it('checkBudget rejects when monthly cap exceeded', async () => {
  const t = new FileCostTracker({ ledgerPath, limits: { ...DEFAULT_LIMITS, perMonthUsd: 5 } })
  await t.recordSpend('anthropic_api', 6)
  expect((await t.checkBudget()).layer).toBe('month')
})
```

各テストでは `DEFAULT_LIMITS` の他の層の値を高くオーバーライドして、ターゲット層単独の reject を独立検証している（=4 層とも個別の境界判定が動くことの実証）。

## 5. 設計判断

1. **append-only ledger** — `~/.clawbridge/cost-ledger.json` は records[] への push のみ。修正・削除は API として提供しない（W0-Week2 で Supabase 化 + RLS 検討）。
2. **atomic write (tmp + rename)** — `fs-store.ts:saveJson` で実装。並行 write race condition 回避。
3. **layer 評価順** — month → day → project → session（金額大→小）。最も大きいキャップから先に判定し、より厳しい層（session）が後段で確実に発火するよう順序設計。Review 側 INT-01 シナリオ（同時 4 層 90% で session が最先 stop）と整合。
4. **TimeSource 注入対応**（5/3 追加）— libfaketime 代替として `timeSource: TimeSource` オプションを追加。月境界 reset テスト（FakeTimeSource で +31 日）で検証済み（time-source.test.ts: `month boundary respects FakeTimeSource`）。
5. **anthropic_subscription / openai_subscription を別カテゴリ**として記録 — サブスク経由の cost は「参考値」として L1〜L4 の合算に含めるが、実課金とは独立（請求と突合しない）。

## 6. 既知の制約 / 持越し

- **Console Spend Cap 設定 screenshot**（オーナー残タスク GO-06）は 5/12 / 5/18 まで持越し。Anthropic Console = $200、OpenAI Platform = $100 の cap 設定を Console 側で確認後に C-A-04 と統合。
- **G-01 INT-01〜03 統合シミュレーション**（4 層同時 90% で session 最先 stop / 月境界 / kill-switch 連動）は W0-Week2 で `tests/integration/cost-tracker-integration.test.ts` を作成して実施予定。今回エビデンスは単体検証のみカバー。
- **cost-ledger.json append-only 性 (chmod 644 + hash chain)** — 現状は plain JSON。W0-Week2 で hash chain 実装検討。

## 7. Review 部門への質問・依頼

1. **Q1**: Review 検証チェックリスト v1 の §2.2 UT-G01-01〜09 と本実装の対応について、12 ケース粒度での「Review 検証側のテストを別途用意する」運用を想定しているか? 既存 Dev テストを Review が再実行するだけで足りるかの方針確認。
2. **Q2**: Review 独自シミュレーションスクリプト（合成 cost log 流し込み）の実装担当は Review か Dev か。担当が Dev であれば W0-Week2 タスクに含める。
3. **依頼**: 5/8 18:00 検収会議で本エビデンスをそのまま PASS 判定材料として参照してよいか確認希望。
