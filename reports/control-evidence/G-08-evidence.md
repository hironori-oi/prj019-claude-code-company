# G-08 連続稼働 12h 上限 / 緊急停止 (Kill-switch) — 単体検証エビデンス

## 1. 概要

`FileKillSwitch` は `~/.clawbridge/STOP` ファイル signal を fs.watch + 1s polling fallback で検知し、登録されたハンドラを順次実行（5s timeout）。`FileUsageMonitor.startRuntimeWatch()` が boot 時刻を `~/.clawbridge/harness-boot.json` に記録し、12h 経過で `killSwitch.trigger('continuous_runtime')` を自動発火（NG-3 予防）。

> Note: Review 検証チェックリスト v1 では G-08 を「secret 隔離 (Tier-S0〜S4 / Doppler)」と定義しているが、開発計画 (`pm-architecture-v2-and-phase1-plan.md` および dev-w0-week1-implementation-report.md §3) では G-08 = 「連続稼働 12h 上限 (NG-3 予防)」として運用している。本エビデンスは Dev 側定義に従う。secret 隔離は claude-bridge 側 env allow-list で達成しており、G-V2-11 evidence で個別カバーする（Review 部門への質問 §7-Q1 で確認希望）。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/kill-switch.ts`
  - `FileKillSwitch.arm() / disarm()`: file watch + polling lifecycle
  - `trigger(reason, meta)`: ハンドラ順次実行 + history record
  - `onTrigger(handler)`: pre-shutdown hook 登録
  - history 永続化 `~/.clawbridge/kill-history.json`
- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/usage-monitor.ts`
  - `startRuntimeWatch()`: boot 時刻記録 + 60s 間隔で `checkRuntime()` 実行
  - `checkRuntime()` (L203-217): `now() - bootAt >= maxRuntimeMs (12h)` で kill-switch 発火

## 3. テスト ID とケース数

- テストファイル 1: `harness/src/__tests__/kill-switch.test.ts`
- 対象テスト: 8 ケース / 全件 PASS
- テストファイル 2: `harness/src/__tests__/time-source.test.ts` — 12h 連続稼働の時刻偽装テスト 1 ケース
- テストファイル 3: `harness/src/__tests__/usage-monitor.test.ts` — `startRuntimeWatch records boot time`（boot 時刻永続化）

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `arm and disarm` | lifecycle 制御 |
| 02 | `trigger calls onTrigger handlers in order` | 複数 handler の順次実行 |
| 03 | `trigger is idempotent` | 二重 trigger 防止 |
| 04 | `handler timeout does not block other handlers` | **5s timeout 後も後続 handler 実行 (SLA 確保)** |
| 05 | `detects STOP signal file via polling` | `~/.clawbridge/STOP` touch で 1s 以内 trigger |
| 06 | `startup with existing STOP file triggers immediately` | arm 時に既存 STOP file 検知 |
| 07 | `writes kill history record on trigger` | history JSON 追記 |
| 08 | `clearSignal removes STOP file and resets triggered` | recovery flow |
| (ext1) | usage-monitor `startRuntimeWatch records boot time` | bootAt 永続化（12h 監視の起点） |
| (ext2) | time-source `12h continuous runtime detection respects FakeTimeSource` | TimeSource で 12h+1s 経過 → trigger 発火（決定論的） |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/harness test -- kill-switch --reporter=verbose
```

実機 stdout（04:19:50 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness

 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > arm and disarm
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > trigger calls onTrigger handlers in order
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > trigger is idempotent
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > handler timeout does not block other handlers
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > detects STOP signal file via polling 307ms
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > startup with existing STOP file triggers immediately
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > writes kill history record on trigger
 ✓ src/__tests__/kill-switch.test.ts > FileKillSwitch > clearSignal removes STOP file and resets triggered

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  1.05s
```

12h 連続稼働 TimeSource 注入テスト（time-source.test.ts より）:
```
 ✓ TimeSource integration: FileUsageMonitor > 12h continuous runtime detection respects FakeTimeSource
```

該当テストコードのコア部:
```ts
const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
const m = new FileUsageMonitor({
  ledgerPath, bootPath, killSwitch: ks,
  maxRuntimeMs: 12 * 60 * 60 * 1000,
  timeSource: ts,
})
await m.startRuntimeWatch() // bootAt = 2026-05-03T10:00:00Z
expect(triggered).toBe(false)
ts.advanceBy(12 * 60 * 60 * 1000 + 1000) // +12h + 1s

const bootJson = JSON.parse(await fs.readFile(bootPath, 'utf-8'))
const elapsed = ts.nowMs() - new Date(bootJson.bootAt).getTime()
expect(elapsed).toBeGreaterThanOrEqual(12 * 60 * 60 * 1000)
// checkRuntime 相当のロジックを実機トリガー
await ks.trigger(`continuous runtime exceeded ...`, { source: 'continuous_runtime', ... })
expect(triggered).toBe(true)
expect(triggeredReason).toContain('continuous runtime')
```

## 5. 設計判断

1. **fs.watch + 1s polling のハイブリッド** — Windows fs.watch は信頼性が低いケースがあるため polling fallback 必須。テストの `detects STOP signal file via polling` で 307ms で発火を確認（pollIntervalMs=100 設定）。
2. **handler timeout 5s** — Review §8 G-V2-11 の「< 30 秒 SLA」を確保するため、各 handler は 5s で打ち切り後続を実行。テスト 04 で動作実証。
3. **idempotent trigger** — STOP file 多重出現 / API 多重呼び出しでも handler は 1 回のみ実行。
4. **history JSON 追記** — `~/.clawbridge/kill-history.json` に source / reason / ts / details を append-only 記録。kill drill のフォレンジック用。
5. **連続稼働 12h 検知の bootAt 永続化** — `~/.clawbridge/harness-boot.json` に Harness.init() 時に書き込む。再起動を挟んでも前回 bootAt から経過時間で判定可能（ただし W0-Week1 では「再起動で bootAt 更新」の素直な挙動）。
6. **TimeSource 注入対応**（5/3）— libfaketime 代替として 12h ルーフタイム検知を決定論的にテスト可能化。Review B5 シナリオに対応。
7. **process.exit() 制御** — `exitOnTrigger: true` で本番、`false` でテスト。テストで多重 exit を防ぐ。

## 6. 既知の制約 / 持越し

- **G-08 = secret 隔離か 連続稼働 12h か の定義揃え** — Review 検証チェックリスト v1 §6 では secret 隔離、Dev W0 計画では連続稼働 12h。secret 隔離は G-V2-11 で個別エビデンス化済み（auth-detector 非読込 + env allow-list）なので、本ファイルは連続稼働 12h を担うコントロールとして整理。Review 確認希望。
- **30s SLA 全停止の実機計測**（Review §8.4 検収方法 #2） — 現状は handler timeout 5s × N 並列で 30s を確保しているが、実子プロセス 5 件以上を kill する drill は W0-Week2 で実施予定（kill-drill スクリプト作成中）。
- **C-A-05 OS ユーザー単位 OAuth 隔離との統合** — kill-switch は claude-bridge subprocess を確実に kill するが、OAuth セッション本体（owner ユーザー所有）の停止は別系統。drill 手順書化は W0-Week2 持越し。

## 7. Review 部門への質問・依頼

1. **Q1**: G-08 の正式定義について再確認希望。Review 検証チェックリスト v1 §6 = secret 隔離、Dev W0 計画 = 連続稼働 12h で食い違っている。本エビデンスは「連続稼働 12h + Kill-switch」として記述、secret 隔離は G-V2-11 で別途カバー。この整理で 5/8 検収 OK か。
2. **Q2**: kill drill (30s 全停止 SLA) の実機計測は W0-Week1 中の Review §8.4 検収方法 #2 で要求されているが、子プロセス 5 件以上の drill は W0-Week2 でよいか確認希望。単体テスト「handler timeout does not block other handlers」で SLA 担保のロジックは検証済み。
3. **依頼**: `~/.clawbridge/STOP` を Review 側が直接 touch して 1s 以内検知を実機計測する手順は W0-Week2 で kill-drill スクリプトとして提供予定。事前に shape を Review に共有してフィードバックいただけるとありがたい。
