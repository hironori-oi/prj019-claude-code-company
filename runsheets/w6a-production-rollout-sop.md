# W6-A Production Rollout SOP — canary deploy / rollout trigger / monitoring hook

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R28 Dev-CCC（17 件目 dev sprint / Round 28 9 並列の 3 軸目）
位置付け: R27 Dev-ZZ `dev-zz-r27-w6-w6a-spec-detail.md`（W6-A operational hardening e2e spec / readiness 96 pt）の **production rollout 側 SOP 物理化**。本 SOP は **D-Day 6/19 公開時点の本番運用フェーズ（W6 production GA）で実行する** canary → progressive rollout → full deploy 経路を runbook 化する。
版: v1.0 (R28 着地)
連動 DEC: DEC-019-006 / 049 / 062 / 074-079 / 080 (DRAFT) / 081 (DRAFT)
連動 spec: `projects/PRJ-019/reports/dev-zz-r27-w6-w6a-spec-detail.md`
連動 runsheet (sibling): `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`

---

## §0 サマリ（CEO 200 字）

R27 W6-A operational hardening e2e spec（test 物理化対象）と対をなす **production rollout SOP** を物理化。canary 5% → 25% → 50% → 100% の 4 段階 progressive rollout、各段階の rollout trigger（automated / manual gate）、monitoring hook 統合（Sentry 実発火 + Vercel Analytics + Supabase realtime + cost-tracker spend rate）、rollback 経路を runbook 化。**本 SOP は spec / SOP 物理化のみ、実 deploy は R30 想定で本 round は実行しない**。副作用 0 / API call $0 / 絵文字 0 / 既存 absolute 4 file 無改変。W6-A 物理化行数 約 480 行。

---

## §1 適用範囲 + 前提

### 1.1 適用範囲

| 観点 | 内容 |
|---|---|
| 対象 | PRJ-019 Open Claw production rollout (D-Day 6/19 公開時) |
| Phase | W6 production GA フェーズ（production stabilization layer） |
| 担当 | Dev 部門 + Web-Ops 部門（rollout operator） |
| 補佐 | Sec 部門（monitoring hook 検証） / Review 部門（rollout gate 判定） |
| 実行 round | R30 想定（DEC-080 採決後） |
| 実行 wallclock | D-Day 6/19 09:00 JST 〜 6/19 18:00 JST（9 時間 window） |
| fallback | rollback 経路（§7） |

### 1.2 前提条件（rollout 着手前 GO checklist）

| # | 前提 | 担当 | 確認 method |
|---|---|---|---|
| 1 | DEC-080 採決完遂（Sentry 実発火必須化） | PM | decisions.md confirmed marker |
| 2 | DEC-081 採決完遂（月次予算 alert） | PM | decisions.md confirmed marker |
| 3 | harness 858-863 PASS（W6-A 物理化完遂） | Dev | CI 緑 |
| 4 | openclaw-runtime 394 PASS 維持 | Dev | CI 緑 |
| 5 | Sentry DSN 登録 + 実発火 1 回確認済 | Sec | dashboard 受信確認 |
| 6 | Vercel deployment URL 取得済 | Web-Ops | URL 共有 |
| 7 | Supabase migration 完遂（v1 schema） | Dev | psql 確認 |
| 8 | cost-tracker budget alert threshold 設定 | Sec | config 確認 |
| 9 | rollback runbook 既読（本 SOP §7） | rollout operator | sign-off |
| 10 | Owner 在席（HITL 緊急 escalation 経路） | Owner | calendar 確認 |

→ **10 件全 YES = rollout GO / 1 件でも NO = rollout HOLD**

---

## §2 rollout 4 段階 progressive deploy

### 2.1 段階定義

| stage | traffic % | duration | gate type | 担当 |
|---|---|---|---|---|
| S1 canary | 5% | 60 min | automated → manual | Web-Ops |
| S2 partial | 25% | 60 min | manual gate | Dev + Web-Ops |
| S3 majority | 50% | 60 min | manual gate | Dev + Review |
| S4 full | 100% | (sustained) | manual gate | Dev + Review + Owner |

### 2.2 Vercel rollout 経路（標準）

```bash
# S1 canary 5% — Vercel rolling deployment
vercel deploy --prod --target production --regions hnd1 \
  --env CANARY_PERCENT=5 --build-env CANARY_PERCENT=5

# S2 partial 25%
vercel alias set <deployment-url> openclaw.example.com --scope <team>
# CANARY_PERCENT を 25 に再 deploy

# S3 majority 50%
# CANARY_PERCENT を 50 に再 deploy

# S4 full 100%
# CANARY_PERCENT を 100 に再 deploy（または削除）
```

### 2.3 Edge Config 経由の動的 rollout（推奨）

```typescript
// app/middleware.ts (rollout-aware middleware / 本 round では SOP のみ)
import { get } from '@vercel/edge-config';

export async function middleware(req: NextRequest) {
  const canaryPercent = (await get<number>('canary_percent')) ?? 0;
  const userBucket = hashUserId(req) % 100; // 0-99

  if (userBucket < canaryPercent) {
    // canary 経路（new release）
    return NextResponse.rewrite(new URL('/canary' + req.nextUrl.pathname, req.url));
  }
  // baseline 経路（previous stable）
  return NextResponse.next();
}
```

→ Edge Config 1 値書換で即時 rollout 段階切替可能（rollback も即時）

---

## §3 rollout trigger（automated + manual gate）

### 3.1 automated trigger（S1 canary 開始時）

| trigger | condition | action |
|---|---|---|
| T1 | CI green + harness 858+ PASS | S1 canary 5% deploy 開始 |
| T2 | Sentry error rate < baseline + 0.5% (60min) | S2 partial gate eligible |
| T3 | p99 latency < baseline × 1.2 (60min) | S2 partial gate eligible |
| T4 | cost-tracker spend rate < budget × 1.1 | S2 partial gate eligible |

→ T2 + T3 + T4 全 OK = S2 manual gate 着手 GO

### 3.2 manual gate（S2 / S3 / S4 開始時）

各 gate で以下 5 件確認、全 OK = 次段階 GO:

| # | gate item | 確認者 | method |
|---|---|---|---|
| 1 | Sentry critical error 0 件 | Dev | dashboard |
| 2 | p99 latency < baseline × 1.3 | Dev | Vercel Analytics |
| 3 | cost-tracker spend < budget × 1.2 | Sec | cost-tracker dashboard |
| 4 | Supabase query slow log 0 件 | Dev | Supabase dashboard |
| 5 | user-facing error report 0 件 | Web-Ops | support inbox |

### 3.3 gate fail 時の処理

- 1 件でも fail = 次段階 HOLD、原因調査着手
- 30 分以内に解消 = 同段階継続
- 30 分以内に解消不可 = §7 rollback 発動

---

## §4 monitoring hook 統合

### 4.1 Sentry 実発火経路（DEC-080 義務化）

```typescript
// app/lib/sentry-init.ts (本 round では SOP のみ / R30 物理化)
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,  // 10% 取得
  beforeSend(event) {
    // PII redaction (HITL 第 11 種 knowledge_pii_review 連動)
    if (event.user) delete event.user.email;
    return event;
  },
});
```

| hook | 発火条件 | severity |
|---|---|---|
| H1 | unhandled exception | critical |
| H2 | API 4xx > 5% (5min) | warning |
| H3 | API 5xx > 1% (5min) | critical |
| H4 | p99 latency > 5s (5min) | warning |

### 4.2 Vercel Analytics

| metric | threshold | action |
|---|---|---|
| Web Vitals LCP | > 2.5s (p75) | warning |
| Web Vitals INP | > 200ms (p75) | warning |
| Web Vitals CLS | > 0.1 (p75) | warning |
| function execution duration p99 | > 10s | critical |
| function invocation rate | > baseline × 3 | warning |

### 4.3 Supabase realtime monitoring

| metric | threshold | action |
|---|---|---|
| connection count | > 1000 | warning |
| query slow log | > 5 件/min | critical |
| storage usage | > 80% quota | warning |
| auth failure rate | > 5% (5min) | critical |

### 4.4 cost-tracker spend rate（DEC-081 義務化）

| metric | threshold | action |
|---|---|---|
| daily spend rate | > monthly_budget / 30 × 1.5 | warning |
| daily spend rate | > monthly_budget / 30 × 2.0 | critical → rollback |
| API cost / request | > baseline × 1.5 | warning |
| budget consumed | > 80% of monthly | critical → freeze new deploy |

### 4.5 monitoring hook 統合 SOP

```bash
# rollout operator が S1 開始時に実行する確認 sequence
1. curl https://sentry.io/api/0/projects/<org>/<proj>/events/   # Sentry 受信確認
2. curl https://vercel.com/<team>/<proj>/analytics              # Vercel Analytics 確認
3. psql <SUPABASE_URL> -c "SELECT now()"                        # Supabase 接続確認
4. cat dashboard/cost-tracker-spend.json                        # spend rate 確認
5. 4 hook 全 GREEN = S1 canary 開始 GO
```

---

## §5 段階別実行 runbook

### 5.1 S1 canary 5% (60 min)

| 時刻 | task | 担当 |
|---|---|---|
| T+0 | Edge Config canary_percent = 5 set | Web-Ops |
| T+0 | Vercel deployment 開始 | Web-Ops |
| T+5 | Sentry / Vercel Analytics 受信開始確認 | Dev |
| T+10 | T2/T3/T4 automated trigger 計測開始 | Dev |
| T+30 | mid-checkpoint（5 hook 全 GREEN 確認） | rollout operator |
| T+60 | S1 完遂判定 + S2 manual gate 着手 | Dev + Review |

### 5.2 S2 partial 25% (60 min)

| 時刻 | task | 担当 |
|---|---|---|
| T+60 | manual gate 5 件確認 | Dev + Review |
| T+60 | gate 全 PASS = canary_percent = 25 set | Web-Ops |
| T+65 | Sentry / Analytics rate 再確認 | Dev |
| T+90 | mid-checkpoint | rollout operator |
| T+120 | S2 完遂判定 + S3 manual gate 着手 | Dev + Review |

### 5.3 S3 majority 50% (60 min)

| 時刻 | task | 担当 |
|---|---|---|
| T+120 | manual gate 5 件確認 | Dev + Review |
| T+120 | gate 全 PASS = canary_percent = 50 set | Web-Ops |
| T+125 | 全 hook rate 再確認 | Dev |
| T+150 | mid-checkpoint | rollout operator |
| T+180 | S3 完遂判定 + S4 manual gate 着手 | Dev + Review + Owner |

### 5.4 S4 full 100% (sustained)

| 時刻 | task | 担当 |
|---|---|---|
| T+180 | manual gate 5 件確認 + Owner sign-off | Dev + Review + Owner |
| T+180 | gate 全 PASS = canary_percent = 100 set | Web-Ops |
| T+185 | full rollout 完遂宣言 | rollout operator |
| T+240 | sustained monitoring 開始（W6-B GA SOP に引継） | Dev → W6-B |

---

## §6 cost-tracker spend rate 連動 alert

### 6.1 spend rate 計算

```typescript
// app/lib/cost-tracker.ts (R30 物理化 / 本 round では SOP)
const dailySpend = sumLast24hCosts();
const monthlyBudget = parseFloat(process.env.MONTHLY_BUDGET_USD ?? '100');
const expectedDailyMax = monthlyBudget / 30;

if (dailySpend > expectedDailyMax * 1.5) emitWarning('spend_rate_warning');
if (dailySpend > expectedDailyMax * 2.0) emitCritical('spend_rate_critical');
```

### 6.2 alert routing

| severity | channel | recipient | response time |
|---|---|---|---|
| warning | Slack #dev-alerts | Dev on-call | 30 min |
| critical | Slack #dev-alerts + email | Dev on-call + Owner | 5 min |
| critical | + Sentry alert | Dev on-call + Owner | 5 min |

### 6.3 budget freeze trigger

- 月予算 80% 消費 = new deploy freeze（既存 rollout は継続）
- 月予算 100% 消費 = full freeze（rollout halt + previous stable rollback）

---

## §7 rollback 経路

### 7.1 rollback 発動条件

| trigger | 自動 / 手動 | 経路 |
|---|---|---|
| Sentry critical 5 件以上 (5min) | 自動 | Edge Config canary_percent 即 0 |
| API 5xx > 5% (5min) | 自動 | 同上 |
| cost-tracker daily spend × 2.0 超過 | 自動 | 同上 |
| user-facing critical bug 報告 | 手動 | Dev + Owner sign-off → 同上 |
| Supabase outage | 自動 | 同上 |

### 7.2 rollback 手順（< 5min 完遂目標）

```bash
# Step 1: Edge Config canary_percent = 0 (即時 rollback)
vercel env pull
# Edge Config dashboard で canary_percent = 0 set

# Step 2: previous stable deployment への alias 切替
vercel alias set <previous-stable-deployment-url> openclaw.example.com

# Step 3: Sentry / Slack 通知（rollback 完遂）
curl -X POST <slack-webhook> -d '{"text":"rollback executed"}'

# Step 4: Owner / CEO 報告
# Step 5: post-mortem schedule（24h 以内）
```

### 7.3 rollback 後の retry 経路

- root cause 特定完遂 → fix → CI green → re-deploy（S1 canary 5% から再開）
- root cause 不明 = 24h 観察 + post-mortem 完遂後に再着手判定

---

## §8 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 副作用 0 | **達成**（runsheet 1 file 新規追加のみ / 既存 absolute 4 file 無改変） |
| API call $0 | **達成**（本 round は SOP 物理化のみ） |
| 絵文字 0 | **達成** |
| 既存 W4 file (55 tests) absolute 無改変 | **達成** |
| 既存 W5 file (33 tests) absolute 無改変 | **達成** |
| 既存 control 実装 absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 物理 deploy R30 想定 = 本 round では実 deploy 0 件 | **達成** |
| fix forward-only | **達成** |
| DEC-080 / 081 採決前提 = SOP のみ起票 | **達成** |

---

## §9 R29 Dev-FFF 引継 3 項目

1. **本 SOP の R30 実 deploy リハーサル準備**: Vercel preview 環境で S1 canary deploy dry-run（実 deploy 0 件 / preview 確認のみ）
2. **Edge Config canary_percent helper 物理化**: `app/lib/edge-config-canary.ts` skeleton（type 定義 + factory）/ 50-80 行想定
3. **monitoring hook 4 種の health-check API 物理化**: `/api/health/{sentry,vercel,supabase,cost-tracker}` 4 endpoints / 各 30-50 行想定

---

## §10 R30 想定 W6 完遂条件

| 条件 | 達成 method | 担当 round |
|---|---|---|
| W6-A test 物理化（8-12 tests / 600-750 行） | R28 Dev-CCC + R29 Dev-FFF | R28-R29 |
| W6-B test 物理化（6-8 tests / 500-650 行） | R30+ Dev-XXX | R30 |
| 本 SOP の D-Day 6/19 実行完遂 | 本 SOP 全 stage GO | R30 (D-Day) |
| W6 readiness 100/100 pt | DEC-080+081 採決 + Dev-CCC dispatch | R28-R29 |
| harness 870-880 PASS（W6 完成） | W6-A + W6-B 物理化完遂 | R30 |

---

## §11 関連 file 参照

- 前提 spec: `projects/PRJ-019/reports/dev-zz-r27-w6-w6a-spec-detail.md`
- 連動 runsheet: `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`
- 関連 abort gate: `projects/PRJ-019/runsheets/abort-gate-ms2-2026-05-15.md`
- 関連 sec spec: `projects/PRJ-019/runsheets/sec-trigger5-monitor-spec.md`
- 関連 sec SOP: `projects/PRJ-019/runsheets/sec-side-effect-zero-sop.md`
- 関連 sec CI 統合: `projects/PRJ-019/runsheets/sec-ci-integration-spec.md`
- 議決参照（読み取りのみ）: `projects/PRJ-019/decisions.md`（DEC-019-074-079 + 080 + 081 candidate）

---

## §12 結語

W6-A operational hardening の **production rollout 側 SOP** を物理化。canary 5% → 25% → 50% → 100% の 4 段階 progressive rollout、automated trigger 4 種 + manual gate 5 件、monitoring hook 4 系統（Sentry / Vercel Analytics / Supabase / cost-tracker）、rollback 経路（< 5min 完遂目標）を runbook 化。

本 SOP は **R30 D-Day 6/19 で実行**、本 round R28 では SOP 物理化のみ実 deploy 0 件 / 副作用 0 / API call $0 厳守。R29 Dev-FFF が本 SOP rehearsal + helper 物理化を継承し、R30 で実 deploy 完遂見込。

---

**SOP 順守**: 副作用 0（runsheet 1 file 新規のみ）/ API コスト $0 / 既存 W4 + W5 + control 実装 + Phase 1 移行済 file absolute 無改変 / 物理 deploy は R30+（DEC-080+081 採決後）/ fix forward-only 厳守 / 絵文字 0。
