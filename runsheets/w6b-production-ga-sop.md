# W6-B Production GA SOP — 公開後 1 week / 1 month 監視 SOP / KPI dashboard / alert routing

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R28 Dev-CCC（17 件目 dev sprint / Round 28 9 並列の 3 軸目）
位置付け: R27 Dev-AAA `dev-aaa-r27-w6-w6b-spec-draft.md`（W6-B performance regression baseline spec / readiness 87 pt）と対をなす **production GA フェーズ運用 SOP**。W6-A rollout 完遂後の **D+1 week / D+1 month 監視 + KPI dashboard + alert routing** を runbook 化。
版: v1.0 (R28 着地)
連動 DEC: DEC-019-006 / 049 / 062 / 074-079 / 080 (DRAFT) / 081 (DRAFT)
連動 spec: `projects/PRJ-019/reports/dev-aaa-r27-w6-w6b-spec-draft.md`
連動 runsheet (sibling): `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`

---

## §0 サマリ（CEO 200 字）

R27 W6-B performance regression baseline spec（test 物理化対象）と対をなす **production GA 運用 SOP** を物理化。W6-A rollout 完遂（D-Day 6/19）後の **D+1h / D+24h / D+1week / D+1month** 4 段階監視 cadence、KPI dashboard 5 軸（Sentry error rate / Vercel p99 / Supabase health / cost spend rate / user satisfaction）、alert routing 3 severity（warning / critical / emergency）、incident response runbook、post-mortem template を整備。**本 SOP は spec / SOP 物理化のみ、実運用は R30 以降想定**。副作用 0 / API call $0 / 絵文字 0 / 既存 absolute 4 file 無改変。W6-B 物理化行数 約 470 行。

---

## §1 適用範囲 + 前提

### 1.1 適用範囲

| 観点 | 内容 |
|---|---|
| 対象 | PRJ-019 Open Claw post-launch 運用 (D-Day 6/19 〜 D+1month 7/19) |
| Phase | W6 production GA フェーズ（W6-A rollout 完遂後の sustained 運用） |
| 担当 | Dev 部門 + Web-Ops 部門 + Sec 部門 |
| 補佐 | Review 部門（KPI 評価） / Marketing 部門（user feedback 集約） |
| 実行 round | R30 以降想定（DEC-080+081 採決後） |
| 実行 wallclock | D+1h 〜 D+1month sustained |
| escalation | Owner（critical 以上） |

### 1.2 前提条件（GA 運用着手前 GO checklist）

| # | 前提 | 担当 | 確認 method |
|---|---|---|---|
| 1 | W6-A rollout S4 (100%) 完遂 | Web-Ops | rollout 完遂宣言 |
| 2 | 4 monitoring hook 全 GREEN (24h sustained) | Dev | dashboard |
| 3 | rollback 経路 dry-run 完遂 | Web-Ops | runbook 確認 |
| 4 | KPI dashboard 5 軸 表示 OK | Dev | dashboard URL |
| 5 | alert routing 3 severity 配信確認 | Sec | test alert 受信 |
| 6 | post-mortem template 既読 | Dev on-call | sign-off |
| 7 | on-call rotation 確定（minimum 1 person/week） | PM | rotation table |
| 8 | Owner 緊急連絡先確認 | Owner | 連絡先確定 |

→ **8 件全 YES = GA 運用 GO / 1 件でも NO = HOLD（W6-A 段階に戻る）**

---

## §2 監視 cadence 4 段階

### 2.1 段階定義

| stage | 期間 | 担当 cadence | 監視粒度 |
|---|---|---|---|
| GA-1 hyper care | D+0h 〜 D+24h | 24h on-call (15min check) | 5 軸 KPI 全部 |
| GA-2 acute | D+1d 〜 D+7d | 8h on-call (1h check) | 5 軸 KPI 全部 |
| GA-3 sub-acute | D+1w 〜 D+1mo | weekday on-call (4h check) | 5 軸 KPI summary |
| GA-4 sustained | D+1mo 〜 | 通常運用（daily check） | weekly summary |

### 2.2 GA-1 hyper care (D+0h 〜 D+24h)

| 時刻 | task | 担当 |
|---|---|---|
| D+0h | rollout S4 完遂宣言確認 | Web-Ops |
| D+15min | 5 軸 KPI 初回 check | Dev on-call |
| D+30min | Sentry error rate baseline 計測開始 | Dev on-call |
| D+1h | 1h checkpoint（5 軸 GREEN 確認） | Dev on-call |
| D+4h | 4h checkpoint | Dev on-call |
| D+8h | 8h checkpoint + alert routing 受信確認 | Dev on-call |
| D+12h | 12h checkpoint | Dev on-call |
| D+24h | 24h GA-1 完遂 + GA-2 移行判定 | Dev + Review |

### 2.3 GA-2 acute (D+1d 〜 D+7d)

| 日 | task | 担当 |
|---|---|---|
| D+1d | daily KPI report 起票 | Dev on-call |
| D+2d 〜 D+6d | daily KPI report 継続 | Dev on-call (rotation) |
| D+7d | week-1 retrospective + KPI summary | Dev + Review |
| D+7d | GA-3 移行判定（5 軸全 GREEN sustained） | Dev + Review + Owner |

### 2.4 GA-3 sub-acute (D+1w 〜 D+1mo)

| 週 | task | 担当 |
|---|---|---|
| W+2 | weekly KPI summary | Dev on-call |
| W+3 | weekly KPI summary | Dev on-call |
| W+4 | month-1 retrospective + KPI summary | Dev + Review + Marketing |
| D+1mo | GA-4 移行判定 | Dev + Review + Owner |

### 2.5 GA-4 sustained (D+1mo 〜)

| cadence | task | 担当 |
|---|---|---|
| daily | KPI dashboard quick check | Dev on-call |
| weekly | weekly summary report | Dev on-call |
| monthly | monthly retrospective + budget review | Dev + Review + Marketing |
| quarterly | quarterly KPI trend + roadmap review | CEO + Owner |

---

## §3 KPI dashboard 5 軸

### 3.1 KPI 定義

| # | 軸 | metric | source | 目標値 |
|---|---|---|---|---|
| K1 | Sentry error rate | unhandled exception / 1000 req | Sentry | < 0.5% |
| K2 | Vercel p99 latency | API route p99 | Vercel Analytics | < 2.0s |
| K3 | Supabase health | connection + slow query + storage | Supabase | all green |
| K4 | cost spend rate | daily USD | cost-tracker | < monthly_budget / 30 × 1.2 |
| K5 | user satisfaction | NPS / support ticket rate | Marketing | NPS > 30 / ticket < 5%/week |

### 3.2 dashboard 配置

```
┌─────────────────────────────────────────────────────┐
│ Open Claw Production GA Dashboard                    │
├─────────────────────────────────────────────────────┤
│ K1 Sentry error rate    : 0.12%   [GREEN]           │
│ K2 Vercel p99 latency   : 1.4s    [GREEN]           │
│ K3 Supabase health      : all green [GREEN]         │
│ K4 cost spend rate      : $2.10/d [GREEN]           │
│ K5 user NPS / ticket    : 42 / 1.2%/w [GREEN]       │
├─────────────────────────────────────────────────────┤
│ trends (7d)             : stable                     │
│ open incidents          : 0                          │
│ pending post-mortems    : 0                          │
└─────────────────────────────────────────────────────┘
```

### 3.3 dashboard 物理化想定（R30+）

```typescript
// app/dashboard/page.tsx (R30 物理化 / 本 round では SOP)
export default async function GADashboard() {
  const [sentry, vercel, supabase, cost, satisfaction] = await Promise.all([
    fetchSentryErrorRate(),
    fetchVercelP99(),
    fetchSupabaseHealth(),
    fetchCostSpendRate(),
    fetchUserSatisfaction(),
  ]);
  return <DashboardLayout metrics={{ sentry, vercel, supabase, cost, satisfaction }} />;
}
```

### 3.4 KPI threshold + alert 連動

| KPI | warning threshold | critical threshold | emergency threshold |
|---|---|---|---|
| K1 Sentry | > 0.5% | > 1.0% | > 5.0% |
| K2 p99 latency | > 2.0s | > 5.0s | > 10s |
| K3 Supabase | yellow 1 軸 | yellow 2 軸 / red 1 軸 | red 2 軸以上 |
| K4 cost rate | > budget × 1.2 | > budget × 1.5 | > budget × 2.0 |
| K5 NPS / ticket | NPS < 30 / ticket > 5% | NPS < 20 / ticket > 10% | NPS < 10 / ticket > 20% |

---

## §4 alert routing 3 severity

### 4.1 severity 定義

| severity | 影響範囲 | 対応 SLA | escalation |
|---|---|---|---|
| warning | 単一 KPI 軽微逸脱 | 30 min response | Dev on-call |
| critical | 単一 KPI 重大逸脱 / 複数 KPI 軽微 | 5 min response | Dev on-call + Owner |
| emergency | 複数 KPI 重大 / user-facing outage | 1 min response | Dev + Sec + Owner + CEO |

### 4.2 routing channel

| severity | primary | secondary | escalation |
|---|---|---|---|
| warning | Slack #dev-alerts | - | Owner if 30min unresolved |
| critical | Slack #dev-alerts + email | SMS Dev on-call | Owner if 5min unresolved |
| emergency | Slack #emergency + SMS | phone call Owner | CEO + Owner if 1min unresolved |

### 4.3 alert payload 形式

```json
{
  "severity": "critical",
  "kpi": "K1 Sentry error rate",
  "current": "1.2%",
  "threshold": "1.0%",
  "window": "5min",
  "started_at": "2026-06-19T10:30:00Z",
  "runbook": "https://.../w6b-production-ga-sop.md#5",
  "dashboard": "https://.../dashboard"
}
```

### 4.4 silent / mute rule

- 同一 alert 5 min 以内 = mute（spam 防止）
- 30 min 以内に解消 = auto-clear notification
- 30 min 以上継続 = severity escalation（warning → critical）

---

## §5 incident response runbook

### 5.1 incident 5 段階

| stage | task | 担当 | 目標時間 |
|---|---|---|---|
| I1 detect | alert 受信 + acknowledge | Dev on-call | < 5 min |
| I2 triage | severity 判定 + 影響範囲特定 | Dev on-call | < 10 min |
| I3 mitigate | rollback or hotfix | Dev + Owner | < 30 min |
| I4 resolve | 全 KPI GREEN 復帰 | Dev | < 4 hour |
| I5 post-mortem | RCA + retrospective | Dev + Review | < 7 day |

### 5.2 mitigate 経路選択

| 状況 | 経路 |
|---|---|
| W6-A rollout 直後 (D+0h 〜 D+24h) | rollback (W6-A SOP §7 参照) |
| W6-A rollout 後 (D+1d 〜) | hotfix preferred / rollback fallback |
| Supabase outage | rollback + Supabase status page 確認 |
| cost spend × 2.0 超過 | budget freeze + new deploy halt |
| user-facing critical bug | rollback 即時 + post-mortem 24h 以内 |

### 5.3 hotfix 経路

```bash
# Step 1: branch 切替
git checkout -b hotfix/<incident-id>

# Step 2: 最小 fix + test
# (minimal change / 既存 test 緑維持 / 新 test 1 件追加)

# Step 3: CI green 確認
git push origin hotfix/<incident-id>

# Step 4: PR + review (Dev + Review)
gh pr create --title "hotfix: <incident-id>"

# Step 5: merge + canary 5% deploy (S1 から再開)
# 通常 rollout (W6-A SOP §5) を short-cycle 化（各段階 15 min）
```

### 5.4 post-mortem template

```markdown
# Incident <ID> Post-Mortem

## Summary
- 発生日時: YYYY-MM-DD HH:MM JST
- 解消日時: YYYY-MM-DD HH:MM JST
- duration: X hours
- severity: warning / critical / emergency
- impact: <user 影響範囲 / 件数 / financial impact>

## Timeline
- T+0: alert 受信
- T+5: acknowledge
- T+10: triage 完遂
- T+30: mitigate 開始
- T+X: resolve

## Root Cause
- <技術的 root cause>
- <process root cause>

## Resolution
- <実行した fix / rollback>

## Lessons Learned
- Keep: <うまくいったこと>
- Problem: <改善余地>
- Try: <次回試すこと>

## Action Items
- [ ] <preventive action 1> @owner due:YYYY-MM-DD
- [ ] <preventive action 2> @owner due:YYYY-MM-DD
```

---

## §6 KPI report cadence

### 6.1 daily report (GA-1 + GA-2)

```markdown
# D+<N> Daily KPI Report

## 5 軸 status
- K1 Sentry error rate: X.XX% (target < 0.5%) [color]
- K2 Vercel p99: X.Xs (target < 2.0s) [color]
- K3 Supabase: <status> [color]
- K4 cost: $X.XX/d (target < $X.XX) [color]
- K5 NPS / ticket: <NPS> / <ticket%> [color]

## Incidents
- <list 0+ incidents>

## Notes
- <observation / trend>
```

### 6.2 weekly report (GA-3 + GA-4)

- 7 日間 KPI trend graph (5 軸)
- top 3 incidents (severity 順)
- WoW (week-over-week) 変動
- next week focus

### 6.3 monthly report (GA-3 完遂時 + GA-4)

- 30 日間 KPI trend
- monthly budget consumption + forecast
- post-mortem summary
- quarterly roadmap input

---

## §7 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 副作用 0 | **達成**（runsheet 1 file 新規追加のみ / 既存 absolute 4 file 無改変） |
| API call $0 | **達成**（本 round は SOP 物理化のみ / 実 monitoring 0 件） |
| 絵文字 0 | **達成** |
| 既存 W4 file (55 tests) absolute 無改変 | **達成** |
| 既存 W5 file (33 tests) absolute 無改変 | **達成** |
| 既存 control 実装 absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 物理 monitoring R30+ 想定 = 本 round では実運用 0 件 | **達成** |
| fix forward-only | **達成** |
| DEC-080 / 081 採決前提 = SOP のみ起票 | **達成** |

---

## §8 R29 Dev-FFF 引継 3 項目

1. **本 SOP の R30 dry-run rehearsal 準備**: KPI dashboard skeleton 物理化（Vercel preview 環境 / 5 軸 mock data 表示）
2. **alert routing 3 severity の Slack webhook 物理化**: `app/lib/alert-router.ts` skeleton（severity 判定 + channel routing） / 60-100 行想定
3. **post-mortem template の `organization/templates/` 配下追加**: `post-mortem.md` template 整備（本 SOP §5.4 を template 化）

---

## §9 R30 想定 W6 完遂条件

| 条件 | 達成 method | 担当 round |
|---|---|---|
| W6-B test 物理化（6-8 tests / 500-650 行） | R30+ Dev-XXX | R30 |
| 本 SOP の D+1h 〜 D+1month 実運用完遂 | 本 SOP 全段階 GO | R30+ (sustained) |
| W6 readiness 100/100 pt | DEC-080+081 採決 + Dev-CCC dispatch | R28-R29 |
| performance-baseline-v1.json 永続化 | W6-B test 物理化完遂 | R30 |
| KPI dashboard 5 軸 物理化 | R29 Dev-FFF skeleton + R30 完遂 | R29-R30 |

---

## §10 関連 file 参照

- 前提 spec: `projects/PRJ-019/reports/dev-aaa-r27-w6-w6b-spec-draft.md`
- 連動 runsheet: `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`
- 関連 abort gate: `projects/PRJ-019/runsheets/abort-gate-ms2-2026-05-15.md`
- 関連 sec spec: `projects/PRJ-019/runsheets/sec-trigger5-monitor-spec.md`
- 関連 sec SOP: `projects/PRJ-019/runsheets/sec-side-effect-zero-sop.md`
- 議決参照（読み取りのみ）: `projects/PRJ-019/decisions.md`（DEC-019-074-079 + 080 + 081 candidate）

---

## §11 結語

W6-B performance regression baseline の **production GA 運用 SOP** を物理化。D+1h / D+24h / D+1week / D+1month の 4 段階監視 cadence、KPI dashboard 5 軸（Sentry / Vercel / Supabase / cost / user satisfaction）、alert routing 3 severity（warning / critical / emergency）、incident response 5 段階 runbook（detect / triage / mitigate / resolve / post-mortem）、KPI report cadence（daily / weekly / monthly）を整備。

本 SOP は **R30 以降 D-Day 6/19 後の sustained 運用で実行**、本 round R28 では SOP 物理化のみ実 monitoring 0 件 / 副作用 0 / API call $0 厳守。R29 Dev-FFF が本 SOP rehearsal + helper 物理化を継承し、R30 で実運用着手見込。

---

**SOP 順守**: 副作用 0（runsheet 1 file 新規のみ）/ API コスト $0 / 既存 W4 + W5 + control 実装 + Phase 1 移行済 file absolute 無改変 / 物理 monitoring は R30+（DEC-080+081 採決後）/ fix forward-only 厳守 / 絵文字 0。
