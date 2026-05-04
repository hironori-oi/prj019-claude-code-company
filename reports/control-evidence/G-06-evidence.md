# G-06 レート異常検知 → kill-switch 自動触発 — 単体検証エビデンス

## 1. 概要

`FileUsageMonitor.recordCall()` が 401/403/429 を 60s 窓内で 5 件超検知すると、`killSwitch.trigger(reason, { source: 'rate_anomaly' })` を自動発火する（G-V2-08 / G-06 統合）。日次集計・5h ローリング集計と併用。連続稼働 12h 検知（G-08）も同モジュール内。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/usage-monitor.ts`
  - `recordCall()` (L120-142): 401/403/429 検出時に `checkAuthAnomaly()` 自動呼び出し
  - `checkAuthAnomaly()` (L144-165): 60s 窓内の 401/403/429 件数を集計、threshold 超で kill-switch trigger
  - `getRollingAggregate(windowMs)`: 5h ローリング集計の参照 API
  - `startRuntimeWatch()` (L187-194): 連続稼働 watch 開始（12h 上限の触発元、G-08 と重複）
  - **TimeSource 注入対応**（5/3 追加）: `timeSource: TimeSource` で 60s 窓と 12h ルーフタイムの決定論的検証可能化

## 3. テスト ID とケース数

- テストファイル 1: `harness/src/__tests__/usage-monitor.test.ts`
- 対象テスト: 5 ケース / 全件 PASS
- テストファイル 2: `harness/src/__tests__/time-source.test.ts` の TimeSource 注入連携テスト 2 ケース

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `records call and returns daily aggregate` | 200 系記録 → 日次集計 |
| 02 | `aggregates errors into 4xx/5xx/auth/rate buckets` | 401/403/429/500 の振り分け（authErrors/rateErrors/4xx/5xx） |
| 03 | `triggers kill-switch on consecutive 401/403/429` | **threshold=3 で 401→403→429 で kill-switch 発火確認、`triggeredReason` に 'anomaly' を含む** |
| 04 | `rolling aggregate respects window` | rolling window が古い記録を排除 |
| 05 | `startRuntimeWatch records boot time` | bootAt が `~/.clawbridge/harness-boot.json` 相当に永続化 |
| (ext1) | `60s anomaly window: 5 errors spread over 120s do NOT trigger (window expires)` | TimeSource で 5 errors @ 30s 間隔 → 窓スパン > 60s で発火しないこと |
| (ext2) | `60s anomaly window: 5 errors within 30s DO trigger` | TimeSource で 5 errors @ 5s 間隔 → 25s スパン → 発火 |
| (ext3) | `12h continuous runtime detection respects FakeTimeSource` | TimeSource で `advanceBy(12h+1s)` → bootAt から経過時間で kill-switch trigger（G-08 連動） |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/harness test -- usage-monitor --reporter=verbose
$ pnpm --filter @clawbridge/harness test -- time-source --reporter=verbose
```

実機 stdout（04:19:54 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness

 ✓ src/__tests__/usage-monitor.test.ts > FileUsageMonitor > records call and returns daily aggregate
 ✓ src/__tests__/usage-monitor.test.ts > FileUsageMonitor > aggregates errors into 4xx/5xx/auth/rate buckets
 ✓ src/__tests__/usage-monitor.test.ts > FileUsageMonitor > triggers kill-switch on consecutive 401/403/429
 ✓ src/__tests__/usage-monitor.test.ts > FileUsageMonitor > rolling aggregate respects window
 ✓ src/__tests__/usage-monitor.test.ts > FileUsageMonitor > startRuntimeWatch records boot time

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  617ms
```

TimeSource 連携（time-source.test.ts より該当 2 ケース）:
```
 ✓ TimeSource integration: FileUsageMonitor > 60s anomaly window: 5 errors spread over 120s do NOT trigger (window expires)
 ✓ TimeSource integration: FileUsageMonitor > 60s anomaly window: 5 errors within 30s DO trigger
```

→ FakeTimeSource で 60s 窓を境界条件で走査、tryger / non-trigger 両方が決定論的に検証されている。

該当テストコード抜粋（usage-monitor.test.ts L59-89）:
```ts
it('triggers kill-switch on consecutive 401/403/429', async () => {
  const ks = new FileKillSwitch({ ...exitOnTrigger: false })
  let triggered = false
  let triggeredReason = ''
  ks.onTrigger((reason) => { triggered = true; triggeredReason = reason })
  await ks.arm()

  const m = new FileUsageMonitor({
    ledgerPath, bootPath, killSwitch: ks,
    authAnomalyThreshold: 3, anomalyWindowMs: 60_000,
  })
  await m.recordCall('anthropic_oauth', { status: 401 })
  await m.recordCall('anthropic_oauth', { status: 403 })
  expect(triggered).toBe(false)
  await m.recordCall('anthropic_oauth', { status: 429 })
  expect(triggered).toBe(true)
  expect(triggeredReason).toContain('anomaly')
})
```

## 5. 設計判断

1. **threshold default = 5 / window = 60s** — Review §7.1 G-V2-03 仕様の「1 分窓 5 件超」と一致。テストでは threshold=3 に短縮して 3 件で発火する境界を確認。
2. **kill-switch trigger source = 'rate_anomaly'** — kill-history.json でソース別に集計可能。budget / rate_anomaly / continuous_runtime / file_signal / manual の 5 種ソースと並列。
3. **TimeSource 経由で window 操作** — 5/3 で `timeSource: TimeSource` 注入対応。後方互換のため既存 `now: () => Date` も並存（time-source > now の優先順位）。
4. **5h ローリング集計**（`getRollingAggregate(windowMs)`）— C-A-04 「Sumi/Asagi/Clawbridge 3 重監視 + 5h ローリング」要件を満たす API。usage-monitor.test.ts の `rolling aggregate respects window` で動作確認。
5. **`anthropic_oauth` / `anthropic_api` / `openai_oauth` / `openai_api` / `vercel` / `supabase` の provider 区別** — provider フィルタ済み集計が可能。サブスク経由 / API key 経由を分離して可視化。

## 6. 既知の制約 / 持越し

- **C-A-04 統合**（5/12 期限） — Sumi/Asagi/Clawbridge 3 重監視のうち、Clawbridge 側 usage-monitor は完成。Sumi (PRJ-012) と Asagi (PRJ-018) の outbound API 呼び出しが Clawbridge usage-monitor に集約される統合は W0-Week2 で要設計。
- **Console Spend Cap 通知の取り込み**（G-06 統合, Review §5.1） — Anthropic Console / OpenAI Platform から webhook で spend cap 達成イベントを受け取る仕組みは未実装。W1 で webhook receiver を notify/ workspace に実装予定。
- **5h ローリング集計のグラフ化** — 集計 API は完成、可視化 UI は W1 で Sumi Settings ペインに追加予定。

## 7. Review 部門への質問・依頼

1. **Q1**: Review §5.2 UT-G06-03 / 04（Anthropic / OpenAI Console から spend cap 達成イベント受信 → usage-monitor が検知）は W0-Week1 達成範囲か W0-Week2 か。webhook receiver が必要なため工数は中規模。
2. **Q2**: `authAnomalyThreshold: 5` と `anomalyWindowMs: 60_000` の default は据え置きでよいか。本番運用で false-positive が出る場合の調整方針（threshold を上げるか window を短くするか）を確認希望。
3. **依頼**: B5 連続稼働超過 + B6 BAN 模倣を mock-claude `silent_revoke` シナリオで連結する統合テストを W0-Week2 で実装する予定。事前に Review 側で受入基準を提示してほしい。
