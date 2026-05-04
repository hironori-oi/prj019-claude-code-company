# Dev W0-Week2 着手前 Slack 3 channel 通知連携 E2E テスト計画 (5/8 完遂)

- 案件: PRJ-019 Clawbridge
- 部署: Dev (Dev-A + Dev-B 協働)
- 起票日: 2026-05-04
- 親決裁: **DEC-019-049** (Slack 3 channel 独立運用) / **DEC-019-050** ($30 cap) / **DEC-019-051** (subscription 主軸)
- 起点ファイル: `dev-budget-guard-30usd-v1.md` (本日納品 budget-guard 実装) / `app/scripts/openclaw-monitor/src/cost-watcher.ts` / `dev-1password-slack-integration-v1.md`
- 文書 ID: DEV-PRJ-019-W0W2-SLACK-INTEGRATION-E2E-PLAN-2026-05-04
- 期限: **2026-05-08 EOD** (5/9 W0-Week2 着手前)
- 検収: 5/8 EOD Dev 自己検証 → 5/9 朝 着手判定 GO ゲート

---

## §0. エグゼクティブサマリ (350 字)

5/9 W0-Week2 着手前 (5/4-5/8) に Slack 3 channel (`#prj019-monitor` / `#prj019-drill` / `#prj019-hitl`) 通知連携の E2E テストを完遂する計画書。**3 channel × 計 13 シナリオ**: monitor (warn $24 / spike 200% 超 = 2 シナリオ × 各 3 通知パターン = 6) / drill (auto_stop $28.5 / hard_fail $30 = 2 シナリオ × 各 2 通知パターン = 4) / hitl (11 種 gate 発火連携確認 = 3 統合シナリオ)。**テスト方法 2 段階**: (1) Vitest unit (`lib/notify/slack.ts` mock + cost-watcher snapshot 検証、CI 全緑必須) / (2) Playwright E2E (実 Slack channel 投稿確認、staging のみ + drill 時のみ実行)。**mock spend 注入機構**: cost-watcher.ts に test mode 追加 (`COST_WATCHER_TEST_SPEND_USD` ENV) で特定金額を模擬。**失敗時 fallback 3 ケース**: Slack API rate limit (HTTP 429) → exponential backoff retry 3 回 / channel 削除 → Owner DM + メール / token 期限切れ → 1Password Vault 再取得 + Owner notify。期待効果: 5/8 EOD 13 シナリオすべて GREEN → 5/9 budget-guard / cost-watcher 着手 confidence 向上。

---

## §1. テスト対象 3 channel と発火条件

### §1.1 Slack 3 channel 構造 (DEC-019-049)

| Channel | 用途 | severity | webhook ENV | 想定発火頻度 |
|---------|------|----------|-------------|-------------|
| `#prj019-monitor` | Cost warn / Daily spike / Info | L1-L2 | `SLACK_WEBHOOK_MONITOR` | 4-8 / 月 |
| `#prj019-drill` | Cost critical / BAN drill / NG-3 | L3 | `SLACK_WEBHOOK_DRILL` | 2-4 / 月 |
| `#prj019-hitl` | HITL Gate 全 11 種 | L1-L3 | `SLACK_WEBHOOK_HITL` | 30-50 / 月 (Phase 1 期間) |

### §1.2 budget-guard / cost-watcher の発火条件 mapping

| 発火源 | 条件 | tier | 通知 channel | severity |
|--------|------|------|-------------|----------|
| `evaluateBudget()` | spend < $24 | ok | (通知なし) | — |
| `evaluateBudget()` | $24 ≤ spend < $28.5 | warn | monitor | L2 |
| `evaluateBudget()` | $28.5 ≤ spend < $30 | auto_stop | drill | L3 |
| `evaluateBudget()` | spend ≥ $30 | hard_fail | drill (+ throw) | L3 |
| `cost-watcher daily cron` | 80% threshold cross (前日未達 → 当日達) | warn | monitor | L2 |
| `cost-watcher daily cron` | 95% threshold cross | auto_stop | drill | L3 |
| `cost-watcher daily cron` | hard_fail (100%) | hard_fail | drill | L3 |
| `cost-watcher daily cron` | spike (todayUsd / yesterdayUsd > 2.0) | spike | monitor | L2 |

---

## §2. テストシナリオ全体 (13 件)

### §2.1 #prj019-monitor (6 シナリオ)

#### シナリオ M-1: warn ($24 cross) — 3 通知パターン

| # | パターン | mock spend | 期待 channel | 期待 header | 期待 body 含有 |
|---|---------|-----------|-------------|------------|----------------|
| M-1-A | $24.00 (境界ジャスト) | 24.00 | monitor | `Budget WARN 80% reached ($24.00 / $30.00)` | `tier=warn / cap=$30 / warn=$24` |
| M-1-B | $24.10 (境界 +0.10) | 24.10 | monitor | `Budget WARN 80% reached ($24.10 / $30.00)` | 同上 |
| M-1-C | $27.99 (auto_stop 直前) | 27.99 | monitor | `Budget WARN 80% reached ($27.99 / $30.00)` | 同上 |

#### シナリオ M-2: spike (前日比 200% 超) — 3 通知パターン

| # | パターン | yesterday | today | spikeRatio | 期待 channel | 期待 header |
|---|---------|----------|-------|-----------|-------------|------------|
| M-2-A | 2.5x ratio (低消費) | $0.20 | $0.50 | 2.5 | monitor | `Daily spend SPIKE — today=$0.50 yesterday=$0.20 ratio=2.50x` |
| M-2-B | 4.0x ratio (中消費) | $0.30 | $1.20 | 4.0 | monitor | `Daily spend SPIKE — today=$1.20 yesterday=$0.30 ratio=4.00x` |
| M-2-C | 10.0x ratio (異常) | $0.10 | $1.00 | 10.0 | monitor | `Daily spend SPIKE — today=$1.00 yesterday=$0.10 ratio=10.00x` |

### §2.2 #prj019-drill (4 シナリオ)

#### シナリオ D-1: auto_stop ($28.5 cross) — 2 通知パターン

| # | パターン | mock spend | 期待 channel | 期待 header | 期待 body 含有 |
|---|---------|-----------|-------------|------------|----------------|
| D-1-A | $28.50 (境界ジャスト) | 28.50 | drill | `Budget AUTO_STOP 95% reached ($28.50 / $30.00)` | `tier=auto_stop / threshold=$28.5 / cap=$30` + `ANTHROPIC_API_KEY を 1Password Vault prj019/anthropic/api_key で revoke` |
| D-1-B | $29.99 (hard_fail 直前) | 29.99 | drill | `Budget AUTO_STOP 95% reached ($29.99 / $30.00)` | 同上 |

#### シナリオ D-2: hard_fail ($30 cross) — 2 通知パターン

| # | パターン | mock spend | 期待 channel | 期待 header | 期待 body 含有 + throw 確認 |
|---|---------|-----------|-------------|------------|---------------------------|
| D-2-A | $30.00 (境界ジャスト) | 30.00 | drill | `Budget HARD_FAIL 100% — API calls blocked` | `tier=hard_fail / spent=$30.00` + `BudgetCapExceededError` throw |
| D-2-B | $35.00 (オーバーラン) | 35.00 | drill | `Budget HARD_FAIL 100% — API calls blocked` | `tier=hard_fail / spent=$35.00` + `BudgetCapExceededError` throw |

### §2.3 #prj019-hitl (3 統合シナリオ)

本機能 (budget-guard + cost-watcher) では HITL channel 経由の発火は使わないが、既存 `lib/notify/slack.ts` の export 関数 (`notifyHitlGate1` 〜 `notifyHitlGate11`) との連携確認。

| # | シナリオ | 発火経路 | 期待 channel | 確認内容 |
|---|---------|---------|-------------|---------|
| H-1 | HITL-3 cost_breach (warn = $24 到達) | budget-guard → notifyHitlGate3 | hitl + monitor (二重 post) | 同一 spend 値で 2 channel に独立投稿、message 重複なし |
| H-2 | HITL-10 permission_change_review (cap update) | `/api/admin/budget POST` → notifyHitlGate10 | hitl + drill (HIGH urgency) | HITL-10 webhook urgency CRITICAL → drill にも post |
| H-3 | HITL-11 knowledge_pii_review (T2 placeholder PII redaction 確認) | T4 batch 起動時 → notifyHitlGate11 | hitl のみ | placeholder 値が `[redacted:email]` 等に置換 |

---

## §3. テスト方法

### §3.1 段階 1: Vitest unit (CI 全緑必須、5/5-5/7)

#### §3.1.1 既存 budget-guard.test.ts を拡張

```typescript
// app/web/src/lib/cost/budget-guard.test.ts (既存 13 ケース) に +13 ケース追加 = 計 26 ケース

describe('Slack 3 channel integration', () => {
  // M-1-A〜M-1-C
  it('warn $24.00 boundary → monitor channel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    await evaluateBudget({ spendOverride: 24.0, fetchImpl: fetchMock, env: { SLACK_WEBHOOK_MONITOR: 'https://hooks.slack.com/test' } });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Budget WARN 80% reached');
  });

  // M-2-A〜M-2-C (cost-watcher 経由)
  it('spike 2.5x → monitor channel SPIKE notification', async () => {
    // mock cost-watcher gatherSnapshot
  });

  // D-1-A, D-1-B, D-2-A, D-2-B
  it('hard_fail $30 → throw BudgetCapExceededError', async () => {
    await expect(
      evaluateBudget({ spendOverride: 30.0, fetchImpl: vi.fn().mockResolvedValue({ status: 200 }) })
    ).rejects.toThrow('BUDGET_CAP_EXCEEDED');
  });
});
```

#### §3.1.2 cost-watcher.test.ts を新規作成

```typescript
// app/scripts/openclaw-monitor/src/cost-watcher.test.ts (新規、+8 ケース)

describe('cost-watcher snapshot + notification', () => {
  it('warn cross only (spent=$24, yesterday=$0.50, today=$0.50)', async () => {
    // mock supabase.rpc → spent=24, today=0.5, yesterday=0.5
    // expect: snap.warnCrossed=true, snap.spike=false
    // expect: notifications.length === 1 (warn のみ)
    // expect: notifications[0].channel === 'monitor'
  });

  it('warn + spike (spent=$24, yesterday=$0.30, today=$1.20)', async () => {
    // expect: notifications.length === 2 (warn + spike)
    // expect: 両方 channel='monitor'
  });

  it('auto_stop cross (spent=$28.5)', async () => {
    // expect: notifications[0].channel === 'drill'
  });

  it('hard_fail (spent=$30)', async () => {
    // expect: notifications[0].channel === 'drill'
    // expect: header に "HARD_FAIL" 含有
  });

  // 失敗時 fallback テスト 4 件 (§5)
  it('rate limit 429 → 3 retry with backoff', async () => { /* ... */ });
  it('channel deleted (HTTP 404) → no retry, log error', async () => { /* ... */ });
  it('token expired (HTTP 401) → no retry, log error', async () => { /* ... */ });
  it('webhook unset → skip silently with log', async () => { /* ... */ });
});
```

#### §3.1.3 CI 緑判定基準

- 既存 13 + 新規 13 (budget-guard) + 8 (cost-watcher) = **計 34 ケース全緑**
- `pnpm -C app vitest run` で 0 失敗
- coverage: budget-guard / cost-watcher で statements ≥ 85%

### §3.2 段階 2: Playwright E2E (staging のみ、drill 時のみ実行、5/8)

#### §3.2.1 staging 環境前提

- staging Supabase: `prj019-staging` プロジェクト (Phase 1 着手 5/26 までに用意、本テストでは local supabase で代替可)
- staging Slack: 専用 channel 3 つ (Owner が事前作成、5/8 までに webhook 取得)

#### §3.2.2 Playwright test スクリプト

```typescript
// app/playwright/staging/slack-integration.spec.ts (新規、+1 シナリオ)

import { test, expect } from '@playwright/test';

test('Slack 3 channel E2E — warn → auto_stop → hard_fail 順序投稿確認', async ({ request }) => {
  // 1. mock spend を 24 に設定 (DB INSERT 経由)
  await insertCostLedgerRow({ cost_usd: 24.10 });

  // 2. cost-watcher を起動 (--mode=watch)
  const result = await request.post('/api/admin/cost-watcher/run', { data: { mode: 'watch' } });
  expect(result.status()).toBe(200);

  // 3. Slack monitor channel の最新投稿を取得 (Slack API conversations.history)
  const monitorMsgs = await fetchSlackMessages('#prj019-monitor', { limit: 1 });
  expect(monitorMsgs[0].text).toContain('Budget WARN 80% reached');

  // 4. mock spend を 28.5 に上げる
  await insertCostLedgerRow({ cost_usd: 4.40 });
  await request.post('/api/admin/cost-watcher/run', { data: { mode: 'watch' } });
  const drillMsgs = await fetchSlackMessages('#prj019-drill', { limit: 1 });
  expect(drillMsgs[0].text).toContain('Budget AUTO_STOP 95% reached');

  // 5. mock spend を 30 に上げる
  await insertCostLedgerRow({ cost_usd: 1.50 });
  await expect(request.post('/api/admin/cost-watcher/run', { data: { mode: 'watch' } })).rejects.toThrow();
  const drillMsgs2 = await fetchSlackMessages('#prj019-drill', { limit: 1 });
  expect(drillMsgs2[0].text).toContain('Budget HARD_FAIL 100%');

  // 6. cleanup: cost_ledger 削除
  await truncateCostLedger();
});
```

#### §3.2.3 Playwright 実行ガード

- `playwright.staging.config.ts` で `LIVE_INTEGRATION=true` ENV 必須化
- CI default では skip (`test.skip(!process.env.LIVE_INTEGRATION)`)
- 5/8 EOD に Dev-B が手動 1 回実行 + drill 時のみ再実行

---

## §4. mock spend 注入機構 (cost-watcher test mode)

### §4.1 ENV 変数追加

```typescript
// app/scripts/openclaw-monitor/src/cost-watcher.ts に追加
function resolveTestSpend(env: NodeJS.ProcessEnv): { spent?: number; today?: number; yesterday?: number } {
  const overrides: { spent?: number; today?: number; yesterday?: number } = {};
  if (env['COST_WATCHER_TEST_SPENT_USD']) {
    overrides.spent = Number.parseFloat(env['COST_WATCHER_TEST_SPENT_USD']);
  }
  if (env['COST_WATCHER_TEST_TODAY_USD']) {
    overrides.today = Number.parseFloat(env['COST_WATCHER_TEST_TODAY_USD']);
  }
  if (env['COST_WATCHER_TEST_YESTERDAY_USD']) {
    overrides.yesterday = Number.parseFloat(env['COST_WATCHER_TEST_YESTERDAY_USD']);
  }
  return overrides;
}

export async function gatherSnapshot(env, log): Promise<CrossSnapshot> {
  const overrides = resolveTestSpend(env);
  // overrides.spent が存在すれば Supabase RPC をスキップ
  const spent = overrides.spent ?? Number(monthRes.data ?? 0);
  // ... 同様
}
```

### §4.2 注入手順

```bash
# シナリオ M-1-B (warn $24.10) を注入
COST_WATCHER_TEST_SPENT_USD=24.10 \
COST_WATCHER_TEST_TODAY_USD=0.50 \
COST_WATCHER_TEST_YESTERDAY_USD=0.30 \
op run --env-file=.env.local -- pnpm tsx app/scripts/openclaw-monitor/src/cost-watcher.ts --mode=watch

# 期待出力
# [cost-watcher] notifications=1 delivered=1
# Slack #prj019-monitor に投稿確認
```

### §4.3 注入機構の安全性

- 本番環境 ENV では絶対に設定しない (CI/CD で `assert(!env['COST_WATCHER_TEST_*'] || env['NODE_ENV'] === 'test')`)
- staging のみ許可 (Vercel staging deploy 時にのみ ENV を注入)
- 投入後は `cost_ledger` の test row も併せて INSERT (audit log の整合性)

---

## §5. 失敗時 fallback 3 ケース

### §5.1 ケース 1: Slack API rate limit (HTTP 429)

#### 検出

- `cost-watcher.ts` の `postSlack()` 内で `res.statusCode === 429` を検出

#### 対策

- exponential backoff retry **3 回** (200ms / 400ms / 800ms)
- 既存実装 (`cost-watcher.ts` line 153-170) で実装済
- 3 回失敗時は log にエラー記録 + 次回 cron run で再試行

#### Vitest テスト

```typescript
it('rate limit 429 → 3 retry with backoff', async () => {
  let callCount = 0;
  const fetchMock = vi.fn().mockImplementation(() => {
    callCount += 1;
    return Promise.resolve({ statusCode: callCount < 3 ? 429 : 200 });
  });
  // ... post test
  expect(callCount).toBe(3);  // retry 2 回 + success
});
```

### §5.2 ケース 2: channel 削除 (HTTP 404)

#### 検出

- `res.statusCode === 404` を検出

#### 対策

- retry しない (DRY-RUN 含めて即時 fail)
- log に `[err] slack <channel> attempts=1 last=HTTP 404` 出力
- Owner DM (1Password vault `prj019/owner/dm-webhook` 経由) + Email (Resend fallback) に「channel 削除検知」通知
- 5/8 着手前準備 ENV-4〜6 で確認済 → channel 削除時は Owner に再作成依頼

#### Vitest テスト

```typescript
it('channel deleted (HTTP 404) → no retry, log + DM notification', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ statusCode: 404 });
  const dmMock = vi.fn();
  // ... call cost-watcher with mocks
  expect(fetchMock).toHaveBeenCalledTimes(1);  // no retry
  expect(dmMock).toHaveBeenCalledWith(expect.stringContaining('channel deleted'));
});
```

### §5.3 ケース 3: token (webhook URL) 期限切れ (HTTP 401)

#### 検出

- `res.statusCode === 401` を検出 (Slack webhook は token-based authentication)

#### 対策

- retry しない (即時 fail)
- log に `[err] slack <channel> attempts=1 last=HTTP 401` 出力
- 1Password Vault `prj019/slack/{channel}-webhook` の最新値を再取得 (op cli call)
- Vault も期限切れなら Owner に再生成依頼 (Slack channel 再 install)

#### Vitest テスト

```typescript
it('token expired (HTTP 401) → no retry, op vault refresh attempt', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ statusCode: 401 });
  const opVaultMock = vi.fn().mockResolvedValue({ refreshed: true, newWebhook: 'https://hooks.slack.com/new' });
  // ... call cost-watcher with mocks
  expect(opVaultMock).toHaveBeenCalled();
});
```

注: Vault 再取得は本テスト時点では skeleton (実装は Phase 1 W2 以降)、5/8 段階では log + Owner DM で fallback 完結。

---

## §6. 5/4-5/8 タイムライン

| 日付 | アクション | 担当 | 検証物 |
|------|-----------|------|--------|
| 5/4 (月) 本日 | 本書 (E2E plan) 起案 + CEO 共有 | Dev-A (起案) | `dev-w0-week2-slack-integration-e2e-plan.md` |
| 5/5 (火) | Vitest unit 拡張 (budget-guard.test.ts に +13 ケース、CI 緑) | Dev-A | 26 ケース緑 |
| 5/6 (水) | Vitest unit 新規 (cost-watcher.test.ts +8 ケース、CI 緑) | Dev-A | +8 ケース緑、計 34 |
| 5/7 (木) | mock spend 注入機構 (`COST_WATCHER_TEST_SPENT_USD` ENV) 実装 + 動作確認 | Dev-B | local で 3 シナリオ手動再現 |
| 5/8 (金) AM | Playwright staging E2E スクリプト作成 + dry-run | Dev-B | spec ファイル + dry-run pass |
| 5/8 (金) PM | staging Slack 3 channel webhook 設定 + 実 E2E 1 回実行 | Dev-A + Dev-B | 13 シナリオ Slack 投稿確認 |
| **5/8 (金) EOD** | 13 シナリオすべて GREEN 判定 → 5/9 着手判定 GO | Dev-A + Dev-B | 自己検証レポート |
| 5/9 (土) AM | T2 着手 (Dev-B 主、本 E2E plan 完遂を前提とする) | Dev-B | T2 着手 |

---

## §7. 受入条件 (E2E plan AC) 5 件

| AC# | 内容 | 検証方法 | 期限 |
|-----|------|---------|------|
| AC-E2E-1 | Vitest 34 ケースすべて緑 (既存 13 + 新規 budget-guard 13 + cost-watcher 8) | `pnpm -C app vitest run` 0 失敗 | 5/7 EOD |
| AC-E2E-2 | mock spend 注入機構が `COST_WATCHER_TEST_*_USD` ENV で動作 | local 3 シナリオ手動再現 | 5/7 EOD |
| AC-E2E-3 | Playwright staging E2E が 13 シナリオすべて pass | staging Slack 投稿確認 + Slack API conversations.history 検証 | 5/8 EOD |
| AC-E2E-4 | 失敗時 fallback 3 ケース (rate limit / channel 削除 / token 期限) すべて Vitest +ケース緑 | Vitest 失敗 fallback 4 ケース緑 | 5/7 EOD |
| AC-E2E-5 | 5/8 EOD 自己検証レポート起票 (本書末尾 §10 に追記) | レポート markdown 確認 | 5/8 EOD |

---

## §8. 想定リスク

| ID | 内容 | 対策 | trigger |
|----|------|------|---------|
| R-E2E-1 | staging Supabase 環境 5/8 までに用意できない | local supabase + supabase-cli で代替、cost_ledger テーブルを local schema に作成 | 5/6 時点で staging URL 未確定 |
| R-E2E-2 | staging Slack 3 channel が Owner 未作成 | 5/4 にOwner に依頼 + 5/6 EOD までに webhook 取得確認 | 5/6 EOD 時点で webhook 未取得 |
| R-E2E-3 | Slack webhook rate limit (1 channel あたり 1/秒制限) で test 連続発火失敗 | 各シナリオ間に 1.5s sleep 挿入、test 並列度 1 | rate limit 検出時 |
| R-E2E-4 | mock spend 注入が本番 ENV に漏れる (security) | NODE_ENV=test or staging のみ許可、CI/CD assert で本番では throw | code review で `COST_WATCHER_TEST_` grep |
| R-E2E-5 | Playwright Chromium 起動失敗 (Windows 11 + WSL2 環境) | `pnpm exec playwright install chromium` 再実行、failed test 自動 retry 1 回 | 5/8 dry-run 失敗 |

---

## §9. 関連ドキュメント

- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (本日納品 budget-guard 実装、本テスト対象)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v1.md` (1Password / Slack webhook 取得手順)
- `projects/PRJ-019/reports/dev-w0-week2-mandatory-5-tasks-wbs.md` (5/9 W0-Week2 着手 5 必須施策)
- `projects/PRJ-019/reports/dev-w0-week2-kickoff-checklist.md` (5/4-5/8 着手準備チェックリスト 32 項目)
- `projects/PRJ-019/reports/dev-w0-week2-t2-hitl-template-design.md` (HITL 11 種 template、本 E2E に H-1〜H-3 連動)
- `projects/PRJ-019/app/web/src/lib/cost/budget-guard.ts` (テスト対象 287 行)
- `projects/PRJ-019/app/scripts/openclaw-monitor/src/cost-watcher.ts` (テスト対象 336 行)
- `projects/PRJ-019/decisions.md` DEC-019-049 / DEC-019-050 / DEC-019-051

---

## §10. 5/8 EOD 自己検証レポート (テンプレ)

5/8 EOD 時点で本セクションを Dev-A + Dev-B 共同で記入:

```
## 5/8 EOD 自己検証レポート

### 13 シナリオ結果
| シナリオ | 判定 | 投稿確認 | 備考 |
|---------|------|---------|------|
| M-1-A ($24.00) | GREEN/YELLOW/RED | YES/NO | (備考) |
| M-1-B ($24.10) | | | |
| ...全 13 シナリオ | | | |

### 5 AC 達成
- AC-E2E-1: Vitest 34 ケース緑 — GREEN/YELLOW/RED
- AC-E2E-2: mock spend 注入 — GREEN/YELLOW/RED
- AC-E2E-3: Playwright E2E — GREEN/YELLOW/RED
- AC-E2E-4: fallback 3 ケース — GREEN/YELLOW/RED
- AC-E2E-5: 本レポート起票 — GREEN

### 5/9 着手判定
- GO / CONDITIONAL GO / NO-GO
- 理由:
- escalation: (CEO に必要に応じて報告)
```

---

## §11. フッタ

- 文書: `projects/PRJ-019/reports/dev-w0-week2-slack-integration-e2e-plan.md`
- 版: v1.0 (2026-05-04)
- 起案: Dev 部門 (`/dev`)
- 検収予定: 5/8 EOD Dev 自己検証 → 5/9 朝 着手判定 GO ゲート
- 次回更新: 5/8 EOD 自己検証結果反映 (§10 に記入) / 5/9 朝 GO 判定スタンプ
- 200 字サマリ: 5/9 W0-Week2 着手前 (5/4-5/8) Slack 3 channel 通知連携 E2E テスト計画。13 シナリオ = monitor (warn × 3 + spike × 3 = 6) / drill (auto_stop × 2 + hard_fail × 2 = 4) / hitl (3 統合)。Vitest unit 34 ケース (既存 13 + 新規 21) + Playwright E2E staging 1 シナリオ。mock spend 注入は `COST_WATCHER_TEST_*_USD` ENV、本番 ENV では assert で禁止。失敗時 fallback 3 ケース (rate limit / channel 削除 / token 期限) Vitest 完備。5/8 EOD 13 シナリオ GREEN → 5/9 着手 GO 判定。
