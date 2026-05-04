# PRJ-019 W0-Week1 必須コントロール エビデンス + mock-claude / TimeSource 完遂報告

- 案件: PRJ-019 Clawbridge — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 開発 (`/dev`)
- 作成日: 2026-05-03（W0-Week1 5/2〜5/8 期間中、検収 5/8 18:00 に対し前倒し提出）
- 対象期間: W0-Week1 (5/2〜5/8)
- 検証環境: Windows 11 Home (10.0.26200) / Node 24.11.1 / pnpm 9.12.0
- ベースラインテスト: **10 ファイル / 83 ケース / 全緑** (`pnpm test` 04:29:37 実行 / 8.21s)

## 1. タスク 1 成果物 — 必須コントロール 7 項目 単体検証エビデンス（8 ファイル）

すべて `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/control-evidence/` 配下に配置。

| # | ファイル | 対象コントロール | テストファイル | ケース数 |
|---|---------|-----------------|---------------|---------|
| 0 | `index.md` | 索引 / ベースライン記載 | (集計のみ) | — |
| 1 | `G-01-evidence.md` | コスト上限 4 層ハードキャップ | `harness/src/__tests__/cost-tracker.test.ts` | 12/12 |
| 2 | `G-04-evidence.md` | 公開前人間承認ゲート (HITL) | `harness/src/__tests__/hitl-gate.test.ts` | 5/5 |
| 3 | `G-05-evidence.md` | サーキットブレーカ | `harness/src/__tests__/circuit-breaker.test.ts` + time-source 1 | 8/8 + ext1 |
| 4 | `G-06-evidence.md` | レート異常検知 → kill-switch | `harness/src/__tests__/usage-monitor.test.ts` + time-source 2 | 5/5 + ext2 |
| 5 | `G-08-evidence.md` | 連続稼働 12h 上限 / Kill-switch | `harness/src/__tests__/kill-switch.test.ts` + usage-monitor + time-source | 8/8 + ext2 |
| 6 | `G-V2-03-evidence.md` | 起動元偽装 / OAuth 直 spawn 全面禁止 | `claude-bridge/src/__tests__/spawn.test.ts` | 10/10 |
| 7 | `G-V2-11-evidence.md` (**最重要**) | OAuth トークン到達禁止 (FS / env 隔離) | `auth-detector.test.ts` (6) + `spawn.test.ts` G-V2-11 ケース 1 | 7/7 |

各 G-XX エビデンスは 7 セクション統一フォーマット（概要 / 実装ファイル / テスト ID / 検証コマンド + 実機出力 / 設計判断 / 既知の制約 / Review への質問）。

### 1.1 G-XX 実装ファイルの絶対パス

- G-01: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/cost-tracker.ts`
- G-04: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/hitl-gate.ts`
- G-05: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/circuit-breaker.ts`
- G-06: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/usage-monitor.ts`
- G-08: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/kill-switch.ts` + `usage-monitor.ts`
- G-V2-03: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/spawn.ts`
- G-V2-11: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/auth-detector.ts` + `spawn.ts`

## 2. タスク 2 成果物 — mock-claude スタブ + TimeSource (libfaketime 代替)

| # | パス | 内容 |
|---|------|------|
| 1 | `app/tests/integration/mock-claude/bin/mock-claude.mjs` | 公式 `claude` CLI 互換スタブ（230 行）。5 シナリオ: success / auth_failed / rate_limit_429 / silent_revoke / slow を `MOCK_CLAUDE_SCENARIO` env で切替 |
| 2 | `app/tests/integration/mock-claude/README.md` | 使用方法、シナリオ表、claude-bridge 統合例、libfaketime 代替方針 |
| 3 | `app/harness/src/time-source.ts` | `TimeSource` interface + `RealTimeSource` + `FakeTimeSource(initial).advanceBy(ms)` (libfaketime 代替) |
| 4 | `app/harness/src/index.ts` | TimeSource exports 追加 |
| 5 | `app/harness/src/cost-tracker.ts` / `circuit-breaker.ts` / `usage-monitor.ts` | `timeSource?: TimeSource` 注入対応（既存 `now: () => Date` も後方互換維持） |
| 6 | `app/harness/src/__tests__/time-source.test.ts` | TimeSource 単体 6 + CircuitBreaker 連携 1 + FileCostTracker 月境界 1 + FileUsageMonitor (60s 窓 × 2 / 12h ルーフタイム × 1) = **11 ケース** |
| 7 | `app/tests/integration/mock-claude/__tests__/scenario-smoke.test.ts` | ClaudeBridge から `node mock-claude.mjs` を起動して 5 シナリオを inline 実行する **5 ケース** |
| 8 | `app/eslint.config.mjs` | `tests/integration/mock-claude/bin/**` を ignores に追加 |

### 2.1 mock-claude シナリオ表

| MOCK_CLAUDE_SCENARIO | 動作 | 想定検収用途 |
|---------------------|------|-------------|
| `success` | 正常 stream-json (3 行: system / assistant / result) を出力 → exit 0 | 正常系基線 |
| `auth_failed` | stderr に "Error: missing credential. not authenticated.\nPlease log in via `claude login` first." → exit 1 | B6 silent_revoke / G-V2-11 検証 |
| `rate_limit_429` | stderr に "429 too many requests" → exit 1 | G-06 / circuit-breaker open 検証 |
| `silent_revoke` | 一定 stream-json 出力後に途中で auth_failed 風 stderr → exit 1 | B6 OAuth 静かな失効模倣 |
| `slow` | 5 秒スリープ後 success | timeout / 12h ルーフタイム計測の決定論用 |

### 2.2 TimeSource パターン要旨（libfaketime Linux 専用問題の解決）

```typescript
// harness/src/time-source.ts
export interface TimeSource { now(): Date; nowMs(): number }
export class RealTimeSource implements TimeSource { /* 本番 */ }
export class FakeTimeSource implements TimeSource {
  constructor(initial: Date | number = new Date()) { ... }
  advanceBy(ms: number): void { this.current += ms }  // ← libfaketime 代替の中核
  setNow(d: Date | number): void { ... }
}
```

利用層: `cost-tracker` / `circuit-breaker` / `usage-monitor` の各 config に `timeSource?: TimeSource` を追加。`timeSource` 指定時は内部 callback を `() => ts.now()` / `() => ts.nowMs()` に差し替え、未指定時は既存 `now: () => Date` callback の後方互換も維持。

## 3. 実機テスト最終結果

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm test
```

stdout（04:29:37 開始 / 8.21s 完了）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app

 ✓ harness/src/__tests__/circuit-breaker.test.ts (8 tests) 9ms
 ✓ claude-bridge/src/__tests__/stream-json-parser.test.ts (13 tests) 13ms
 ✓ harness/src/__tests__/cost-tracker.test.ts (12 tests) 89ms
 ✓ harness/src/__tests__/usage-monitor.test.ts (5 tests) 94ms
 ✓ harness/src/__tests__/time-source.test.ts (11 tests) 136ms
 ✓ harness/src/__tests__/kill-switch.test.ts (8 tests) 533ms
 ✓ claude-bridge/src/__tests__/auth-detector.test.ts (6 tests) 683ms
 ✓ harness/src/__tests__/hitl-gate.test.ts (5 tests) 1688ms
 ✓ tests/integration/mock-claude/__tests__/scenario-smoke.test.ts (5 tests) 5633ms
 ✓ claude-bridge/src/__tests__/spawn.test.ts (10 tests) 7231ms

 Test Files  10 passed (10)
      Tests  83 passed (83)
   Duration  8.21s
```

```bash
$ pnpm typecheck
# harness, claude-bridge ともに tsc --noEmit Done。stub workspace は echo 通過。
```

### 3.1 ケース数内訳

| 領域 | テストファイル | ケース数 |
|------|---------------|---------|
| harness 既存 (W0-Week1 baseline) | circuit-breaker / cost-tracker / hitl-gate / kill-switch / usage-monitor | 8+12+5+8+5 = 38 |
| harness 追加（5/3 タスク 2） | time-source | 11 |
| claude-bridge | stream-json-parser / auth-detector / spawn | 13+6+10 = 29 |
| integration | mock-claude scenario-smoke | 5 |
| **合計** | **10 ファイル** | **83** |

## 4. 既知の制約 と W0-Week2（5/9〜5/15）残作業

### 4.1 既知の制約（5/8 検収時点）

| 項目 | 制約 / 持越し理由 |
|------|------------------|
| **G-08 定義の食い違い** | Review 検証チェックリスト v1 §6 = secret 隔離、Dev 計画 = 連続稼働 12h で食い違い。本提出は Dev 定義に従い、secret 隔離は G-V2-11 で個別カバー（Q1 として Review 確認希望） |
| **G-01 Console Spend Cap screenshot** | オーナー残タスク GO-06（Anthropic Console $200 / OpenAI Platform $100）は 5/12 / 5/18 まで持越し |
| **G-V2-11 grep CI 自動化** | `grep -rE "credentials\.json"` の CI 自動チェックは未配置（手動確認では実 read 行 0 件） |
| **pre-commit hook (oauth/keychain/User-Agent/credentials/billing-proxy)** | Review §7.2 / §7.4 で要求あり。W0-Week2 で `.husky/pre-commit` 配置予定 |
| **API キーフォールバック切替（4h SLA）** | circuit-breaker は基盤動作 OK。OAuth → API key 自動切替は spawn.ts 拡張が必要（W0-Week2） |
| **Slack webhook (HITL 通知)** | 現状 `~/.clawbridge/pending-approvals/<uuid>.approved` 手動 touch 運用。W1 で notify/ workspace 実装 |
| **C-A-04 Sumi/Asagi/Clawbridge 3 重監視統合** | Clawbridge usage-monitor は完成。Sumi (PRJ-012) / Asagi (PRJ-018) outbound API の集約は W0-Week2 で要設計（5/12 期限） |

### 4.2 W0-Week2 残作業（優先順位付）

1. **B5 / B6 統合シナリオテスト**
   - `tests/integration/auth-revoke-flow.test.ts`: silent_revoke → 5 連続 auth_failed → circuit open → kill-switch 発火
   - `tests/integration/cost-tracker-integration.test.ts`: 4 層 90% 同時 → session 最先 stop / 月境界 / kill-switch 連動
2. **pre-commit hook 配置**（5/9 着手）— `.husky/pre-commit` で oauth/keychain/User-Agent/credentials/billing-proxy/api[_-]?key を grep 検出
3. **kill drill スクリプト**（30s 全停止 SLA 実機計測）— 子プロセス 5 件以上を `~/.clawbridge/STOP` 投入で kill する drill スクリプト
4. **API キーフォールバック切替** — spawn.ts に OAuth → API key 自動切替（circuit open 時）を実装、4h SLA を計測
5. **24h timeout 時刻偽装テスト**（HITL）— `FakeTimeSource` で 24h+1s 経過 → default reject の決定論テスト追加
6. **5 種 HITL action 個別パラメタライズドテスト** — `it.each(['public_release','paid_api_call','force_push','prod_deploy','external_api'])` で網羅
7. **Sumi/Asagi/Clawbridge 3 重監視統合設計**（C-A-04 5/12 期限）— Sumi (PRJ-012) / Asagi (PRJ-018) outbound API → Clawbridge usage-monitor 集約 IF
8. **`tests/integration/cost-tracker-integration.test.ts`** — G-01 INT-01〜03 統合シミュレーション
9. **mock-claude scenario 拡充** — `quota_exceeded` / `network_partition` / `partial_response` 等 W0-Week2 で追加検討
10. **C-A-05 OS ユーザー単位 OAuth 隔離との kill drill 統合手順書**

## 5. Review 部門への 5/8 までの質問・依頼

### 5.1 質問（個別エビデンスから集約）

| # | 出典 | 内容 |
|---|------|------|
| Q1 | G-08 / G-V2-11 | **G-08 の正式定義確認希望**: Review v1 §6 = secret 隔離、Dev 計画 = 連続稼働 12h で食い違い。本提出は「G-08 = 連続稼働 12h、secret 隔離は G-V2-11 でカバー」整理。これで 5/8 検収 OK か |
| Q2 | G-V2-11 | **`bearer` を env regex に追加**すべきか方針確認。現状 `/api[_-]?key|secret|token|password|credential/i`。defense in depth 観点 |
| Q3 | G-V2-11 | **G-V2-11 検収条件**として「`grep -rE "credentials\.json" claude-bridge/src/` 実コード 0 件 + 方針説明コメントは許可」運用で OK か |
| Q4 | G-05 / G-V2-03 | **pre-commit hook (oauth/keychain/User-Agent/credentials/billing-proxy)** は 5/8 検収必須か W0-Week2 でよいか |
| Q5 | G-V2-03 | **API キーフォールバック切替（4h SLA）** は claude-bridge / Sumi/Asagi 統合層のどちらの責務か |
| Q6 | G-08 | **30s SLA 全停止 drill** の子プロセス 5 件以上の実機計測は W0-Week2 でよいか |
| Q7 | G-04 | **5 種 HITL action 個別 it() テスト** は W0-Week1 完了範囲か W0-Week2 か（現状型 enumerate + 代表 1 種のみ） |
| Q8 | G-04 | **HITL Slack 通知実装** は 5/8 までに必要か W1 上旬持越しでよいか |
| Q9 | G-06 | **`authAnomalyThreshold: 5` / `anomalyWindowMs: 60_000` の default** は据え置きでよいか |
| Q10 | G-06 | **UT-G06-03 / 04 webhook receiver** は W0-Week1 達成範囲か W0-Week2 か |
| Q11 | G-01 | **G-01 INT-01〜03 統合シミュレーションの担当** は Review か Dev か |
| Q12 | G-05 | **`successThreshold: 1` の default** は適切か / `2` に上げるべきか |

### 5.2 依頼

1. **B6 受入基準提示**: silent_revoke → 5 連続 auth_failed → circuit open → kill-switch 発火の **kill 発火までの最大経過時間** / dump される env 内容の検査範囲を Review 側から提示（W0-Week2 統合テスト実装に必要）
2. **pre-commit hook 検出キーワード Review 確定版リスト** を 5/8 までに頂けると、W0-Week2 初日に hook 配置可能
3. **5/8 18:00 検収会議**で本エビデンス 8 ファイルをそのまま PASS 判定材料として参照可能か事前確認
4. **mock-claude `silent_revoke` shape 共有**: kill drill 用 `~/.clawbridge/STOP` 直接 touch 手順を W0-Week2 で kill-drill スクリプトとして提供予定。事前に shape を共有してフィードバック頂きたい
5. **B5 連続稼働超過 + B6 BAN 模倣の連結統合テスト** の受入基準提示（W0-Week2 実装）

## 6. 関連ドキュメント

- W0-Week1 実装報告: `projects/PRJ-019/reports/dev-w0-week1-implementation-report.md`
- 必須コントロール エビデンス索引: `projects/PRJ-019/reports/control-evidence/index.md`
- mock-claude README: `projects/PRJ-019/app/tests/integration/mock-claude/README.md`
- TimeSource: `projects/PRJ-019/app/harness/src/time-source.ts`
- Review 検証チェックリスト: `projects/PRJ-019/reports/review-w0-week1-verification-checklist.md`
- Review ペネトレシナリオ: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- CEO 連結報告: `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md`

---

## サマリ（200 字以内）

PRJ-019 W0-Week1 必須コントロール 7 項目（G-01/G-04/G-05/G-06/G-08/G-V2-03/G-V2-11）の単体検証エビデンス 8 ファイルを 5/3 内に前倒し提出。mock-claude 5 シナリオ + TimeSource (libfaketime 代替) も完遂。`pnpm test` 10 ファイル 83 ケース全緑、typecheck 通過。Review 質問 12 件を 5/8 検収前に確定希望。
