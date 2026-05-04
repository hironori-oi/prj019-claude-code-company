# G-05 サーキットブレーカ — 単体検証エビデンス

## 1. 概要

`CircuitBreaker.fire(fn)` が **closed → open → half-open → closed** の標準パターンで連続失敗時に open し、cooldown 経過後に half-open で復帰試行、成功で closed 復帰、失敗で open に戻す。Claude CLI subprocess 起動失敗・401/403/429 連続検知などの上位ラッパとして claude-bridge で活用される（spawn.ts の `circuitBreaker` 統合）。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/circuit-breaker.ts`
  - `CircuitBreaker` クラス: state machine 実装（L49-139）
  - `recordFailure() / recordSuccess()` (L111-138): 状態遷移ロジック
  - `CircuitOpenError`: open 状態で fire() した場合の例外型
  - **TimeSource 注入**（5/3 追加）: `config.timeSource` で `now: () => number` を抽象化（libfaketime 代替）
- 統合先: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/spawn.ts:120-125` で `failureThreshold: 5, cooldownMs: 30s` で内蔵

## 3. テスト ID とケース数

- テストファイル 1: `harness/src/__tests__/circuit-breaker.test.ts`
- 対象テスト: 8 ケース / 全件 PASS
- テストファイル 2: `harness/src/__tests__/time-source.test.ts` の TimeSource 注入連携テスト 1 ケース（`cooldown completes after FakeTimeSource.advanceBy(cooldownMs)`）

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `starts in closed state` | 初期状態 closed |
| 02 | `passes through successful calls` | success 時 throughput |
| 03 | `opens after failureThreshold consecutive failures` | 連続 N 失敗で open |
| 04 | `rejects fast when open with CircuitOpenError` | open 状態で `CircuitOpenError` 即時 throw |
| 05 | `transitions to half-open after cooldown` | cooldown 経過 → half-open → success → closed |
| 06 | `half-open back to open on failure` | half-open 失敗 → open 復帰 |
| 07 | `resets state` | reset() 動作 |
| 08 | `successThreshold > 1 keeps half-open until enough successes` | 連続 N 成功で closed |
| (ext) | `cooldown completes after FakeTimeSource.advanceBy(cooldownMs)` | TimeSource 注入で cooldown 決定論的検証 |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/harness test -- circuit-breaker --reporter=verbose
```

実機 stdout（04:19:52 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness

 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > starts in closed state
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > passes through successful calls
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > opens after failureThreshold consecutive failures
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > rejects fast when open with CircuitOpenError
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > transitions to half-open after cooldown
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > half-open back to open on failure
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > resets state
 ✓ src/__tests__/circuit-breaker.test.ts > CircuitBreaker > successThreshold > 1 keeps half-open until enough successes

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  549ms
```

TimeSource 注入連携（time-source.test.ts より）:
```
 ✓ src/__tests__/time-source.test.ts > TimeSource integration: CircuitBreaker > cooldown completes after FakeTimeSource.advanceBy(cooldownMs)
```

→ `FakeTimeSource(0)` 起点で failureThreshold=1, cooldownMs=1000、`ts.advanceBy(500)` で `CircuitOpenError`、`ts.advanceBy(600)`（合計 1100ms）で half-open → success → closed を実機検証。

## 5. 設計判断

1. **state machine の遷移は `recordFailure() / recordSuccess()` の純関数的更新** — 並行 fire() でも race condition の影響を最小化（test では順次 fire のみで網羅）。
2. **fire() 内部で open → half-open 遷移を判定** — タイマー/setInterval 不要の lazy 評価。`now() - openedAt >= cooldownMs` の比較のみで遷移を実現。
3. **claude-bridge 統合の default 値** — `failureThreshold: 5, cooldownMs: 30s, successThreshold: 1`（spawn.ts:120-125）。これにより 401/403/429 連続 5 件で open → 30s 待機 → 1 件成功で closed 復帰の SLA 想定。
4. **TimeSource 注入対応**（5/3 追加）— 既存 `now: () => number` callback も後方互換維持しつつ、`timeSource: TimeSource` を新規受領。`timeSource` 指定時は内部で `() => ts.nowMs()` に変換。Review ペネトレ B6 BAN 模倣シナリオで FakeTimeSource を使った決定論的テストが可能になった。
5. **`CircuitOpenError` の独立クラス** — error.name = 'CircuitOpenError' で claude-bridge 側 `instanceof` で判別し `error.type='circuit_open'` に変換。

## 6. 既知の制約 / 持越し

- **G-V2-03 サーキットブレーカ統合シナリオ V203-INT-01〜02**（B6 BAN 模倣 + API キーフォールバック切替）は W0-Week2 持越し。今回は単体検証のみ。
- **pre-commit hook for grep `oauth` / `keychain` / `User-Agent`** — Review 検証チェックリスト v1 §7.2 UT-V203-08〜10 の grep hook は **W0-Week1 末（5/8）に実施推奨** とされている。現状 hook 未配置。Dev W0-Week2 線表で対応予定だが、5/8 検収に間に合わせるなら今週末優先。
- **API キーフォールバック切替（4h 以内完了）** — circuit-breaker は基盤として動く状態だが、フォールバック動作（OAuth → API key）は spawn.ts に未実装。W0-Week2 で claude-bridge 拡張時に対応。

## 7. Review 部門への質問・依頼

1. **Q1**: pre-commit hook の grep 検出（oauth/keychain/User-Agent/credentials/billing-proxy）は 5/8 検収必須か W0-Week2 に倒せるか確認希望。Review §7.4 検収方法 #3 で要求されているが、hook 未配置で他の単体テストは PASS しているため。
2. **Q2**: `successThreshold: 1`（half-open 1 件成功で closed 復帰）の現行 default は適切か。BAN 復旧で false-positive を避けるため `successThreshold: 2` 程度に上げるべきか方針確認。
3. **依頼**: B6 BAN 模倣の統合テスト（mock-claude `silent_revoke` シナリオ → 5 連続失敗 → circuit open → kill-switch 連鎖）を W0-Week1 中に追加すべきか確認。mock-claude スタブは 5/3 で完成しているので工数は ~1 時間。
