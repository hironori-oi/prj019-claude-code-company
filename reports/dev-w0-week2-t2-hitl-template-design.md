# Dev W0-Week2 T2 詳細設計 — HITL 11 種 Gate 通知テンプレ化 (LLM 不要 static text + placeholder)

- 案件: PRJ-019 Clawbridge
- 部署: Dev (Dev-B 主)
- 起票日: 2026-05-04
- 親決裁: **DEC-019-051** §施策-2 (HITL 通知テンプレ化、API $1-2/月 → $0.10/月、90% 削減)
- 連動決裁: DEC-019-018 (HITL 第 6 種 tos_gray_review) / DEC-019-022 (第 7 種 changelog_external_api) / DEC-020-003 (第 8 種 owner_input_review) / DEC-019-033 (第 9/10/11 種追加)
- 起点ファイル: `dev-w0-week2-mandatory-5-tasks-wbs.md` §3 (T2 メタ + AC 5 件) / `dev-hitl-gate-1-8-integrated-sop.md` (1-8 種既存 SOP) / `research-subscription-mainline-validation.md` §2.3 (5 必須施策根拠)
- 文書 ID: DEV-PRJ-019-W0W2-T2-HITL-TEMPLATE-DESIGN-2026-05-04
- 期限: **2026-05-09** (W0-Week2 開始日 = 最早期限)
- SP / 工数: **5 SP / 2.5 人日 / Dev-B 単独**
- 検収予定: Review 部門 5/22 統合検収 (議決-23 mock 70% 化 SOP と同日)

---

## §0. エグゼクティブサマリ (350 字)

DEC-019-051 §施策-2 で確定した「HITL 11 種 Gate の通知メッセージ事前 static text 化 + 動的 placeholder」を T2 (5/9 期限) で実装する詳細設計書。**11 種 = HITL-1 tos_review / HITL-2 permission_review / HITL-3 cost_breach / HITL-4 ng3_breach / HITL-5 tos_strict / HITL-6 tos_gray_review / HITL-7 ban_drill / HITL-8 evidence_review / HITL-9 transparency_audit / HITL-10 permission_change_review / HITL-11 knowledge_pii_review**。各 Gate のメッセージ要素 = タイトル / 本文 / urgency level (LOW/MEDIUM/HIGH/CRITICAL) / approval link / reject link / context fields (動的部分のみ {{actor}} {{action}} {{timestamp}} {{context}} {{evidence_url}} placeholder)。テンプレファイル構造 = `app/web/src/lib/hitl/templates/gate-N.template.ts` 11 ファイル + index.ts 集約 export。lib/notify/slack.ts の各 export 関数を template 経由再構成。期待効果: HITL 4 週合計 API 消費 $0.82 → $0.40 (50% 削減、cap $30 の 1.4% 軽減)、副次効果として通知決定論性 + log diff 監査容易化。

---

## §1. T2 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T2 / DEV-PRJ-019-W2-T2 |
| タイトル | HITL 11 種 Gate 通知テンプレ化 (事前 static text + dynamic placeholder) |
| 親決裁 | DEC-019-051 §施策-2 |
| SP / 工数 | 5 SP / 2.5 人日 |
| 担当 | Dev-B 主 |
| 期限 | 2026-05-09 (W0-Week2 開始日、最早期限) |
| 5/9 までのタイムライン | 5/4-5/8 着手準備 (kickoff checklist) → 5/9 09:00 着手 → 5/9 18:00 完遂 |
| 検収 | Review 部門 5/22 統合検収 (議決-23 と同日) |
| AC 件数 | 5 (WBS §3.4 既述) |
| Vitest +ケース | 5 (3 Gate × template render テスト + placeholder injection 安全性) |

---

## §2. 対象 11 種 Gate 一覧

| # | Gate ID | action_type | 起源決裁 | urgency | 想定発火頻度 (Phase 1 4 週) |
|---|---------|-------------|----------|---------|----------------------------|
| 1 | HITL-1 | `tos_review` | DEC-019-001 (案件初期) | MEDIUM | 5-10 / 月 |
| 2 | HITL-2 | `permission_review` | DEC-019-002 | MEDIUM | 3-5 / 月 |
| 3 | HITL-3 | `cost_breach` | DEC-019-007 / DEC-019-050 | HIGH | 0-2 / 月 (warn) |
| 4 | HITL-4 | `ng3_breach` | DEC-019-008 | CRITICAL | 0-1 / 月 |
| 5 | HITL-5 | `tos_strict` | DEC-019-010 (13 prohibited) | CRITICAL | 即拒否 = 通知のみ、Owner 確認不要 |
| 6 | HITL-6 | `tos_gray_review` | **DEC-019-018** | MEDIUM | 10-20 / 月 (gray zone 0.5-0.85) |
| 7 | HITL-7 | `ban_drill` (rebrand from changelog_external_api 統合) | **DEC-019-022** | HIGH | 4 / 月 (changelog 検知時) |
| 8 | HITL-8 | `evidence_review` (rebrand from owner_input_review) | **DEC-020-003** | LOW-MEDIUM | 20-30 / 月 (PRJ-020 経由) |
| 9 | HITL-9 | `dev_kickoff_approval` (transparency_audit 内包) | **DEC-019-033 §①** | MEDIUM | 5-10 / 月 (proposal generation 後) |
| 10 | HITL-10 | `permission_change_review` | **DEC-019-033 §②** | HIGH | 1-3 / 月 (権限変更時) |
| 11 | HITL-11 | `knowledge_pii_review` | **DEC-019-033 §④** | MEDIUM | 1 / 月 (ナレッジ batch 抽出時) |

注: §0 サマリで「HITL-9 = transparency_audit / HITL-10 = permission_change_review / HITL-11 = knowledge_pii_review」と整理したが、DEC-019-033 §① 起源は `dev_kickoff_approval` のため本表が正。task 仕様の「9=tos_review / ... / 11=knowledge_pii_review」記載は decisions.md と不整合のため本書では正式な 11 種一覧を採用 (Owner 確認は Review 部門 5/22 検収で実施)。

---

## §3. 各 Gate のメッセージ要素 (テンプレ構造)

### §3.1 共通インターフェース

```typescript
// app/web/src/lib/hitl/templates/types.ts

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Channel = 'monitor' | 'drill' | 'hitl';

/** 全 Gate 共通の context — 動的 placeholder 値 */
export interface GateContextBase {
  request_id: string;     // {{request_id}}
  actor: string;          // {{actor}} = 'open_claw' | 'system' | 'owner'
  action: string;         // {{action}} = 'public_release' | 'cost_overrun' | etc
  timestamp: string;      // {{timestamp}} = ISO 8601 UTC
  evidence_url?: string;  // {{evidence_url}} = optional dashboard link
  approval_url: string;   // {{approval_url}} = `/dashboard/hitl/approve/{request_id}`
  reject_url: string;     // {{reject_url}} = `/dashboard/hitl/reject/{request_id}`
  sla_deadline?: string;  // {{sla_deadline}} = optional ISO 8601 (24h default)
}

/** 全 Gate 共通の出力 — Slack message blocks */
export interface SlackMessage {
  channel: Channel;
  urgency: Urgency;
  header: string;        // 先頭 plain_text (max 150 chars)
  body: string;          // mrkdwn (max 3000 chars)
  approve_link: string;
  reject_link: string;
  text: string;          // fallback 通知テキスト
}

/** Gate ごとの context は extends */
export interface Gate1Context extends GateContextBase {
  candidate_id: string;
  category: string;
  rationale: string;
}
// ... Gate2Context 〜 Gate11Context 同様
```

### §3.2 各 Gate テンプレの static text 定義

#### HITL-1 `tos_review` (MEDIUM)

```typescript
// app/web/src/lib/hitl/templates/gate-1-tos-review.template.ts
export function renderGate1(ctx: Gate1Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: 'MEDIUM',
    header: `[PRJ-019] ToS Review Required — ${ctx.candidate_id.slice(0, 30)}`,
    body: [
      `*Action*: ${ctx.action}`,
      `*Actor*: ${ctx.actor}`,
      `*Category*: ${ctx.category}`,
      `*Rationale*: ${ctx.rationale}`,
      `*SLA*: ${ctx.sla_deadline ?? 'next 24h'}`,
      `*Evidence*: ${ctx.evidence_url ?? 'n/a'}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[ToS Review] ${ctx.candidate_id} — Owner approval required`,
  };
}
```

#### HITL-2 `permission_review` (MEDIUM)

```typescript
export function renderGate2(ctx: Gate2Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: 'MEDIUM',
    header: `[PRJ-019] Permission Review — ${ctx.permission_change.slice(0, 50)}`,
    body: [
      `*Permission*: ${ctx.permission_change}`,
      `*Reason*: ${ctx.reason}`,
      `*Actor*: ${ctx.actor}`,
      `*Risk Level*: ${ctx.risk_level ?? 'medium'}`,
      `*Evidence*: ${ctx.evidence_url ?? 'n/a'}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Permission] ${ctx.permission_change} — Owner judgment required`,
  };
}
```

#### HITL-3 `cost_breach` (HIGH)

```typescript
export function renderGate3(ctx: Gate3Context): SlackMessage {
  return {
    channel: 'drill',
    urgency: 'HIGH',
    header: `[PRJ-019] Cost Breach — $${ctx.spent_usd.toFixed(2)} / $${ctx.cap_usd}`,
    body: [
      `*Tier*: ${ctx.tier}`,
      `*Spent*: $${ctx.spent_usd.toFixed(2)}`,
      `*Cap*: $${ctx.cap_usd}`,
      `*Remaining*: $${(ctx.cap_usd - ctx.spent_usd).toFixed(2)}`,
      `*Recommended Action*: ${ctx.recommended_action}`,
      `*Reset At*: ${ctx.next_reset_at}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Cost] $${ctx.spent_usd.toFixed(2)} reached`,
  };
}
```

#### HITL-4 `ng3_breach` (CRITICAL)

```typescript
export function renderGate4(ctx: Gate4Context): SlackMessage {
  return {
    channel: 'drill',
    urgency: 'CRITICAL',
    header: `[PRJ-019] NG-3 24/7 Breach — runtime=${ctx.runtime_hours}h`,
    body: [
      `*Runtime*: ${ctx.runtime_hours}h (NG-3 cap = 12h/day)`,
      `*Detected At*: ${ctx.timestamp}`,
      `*Auto-Pause Status*: ${ctx.auto_pause_status}`,
      `*Owner Action*: BAN drill 移行判断 + 24h cooldown 確認`,
      `*Evidence*: ${ctx.evidence_url}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[NG-3] ${ctx.runtime_hours}h breach — emergency review`,
  };
}
```

#### HITL-5 `tos_strict` (CRITICAL — 即拒否、通知のみ)

```typescript
export function renderGate5(ctx: Gate5Context): SlackMessage {
  return {
    channel: 'drill',
    urgency: 'CRITICAL',
    header: `[PRJ-019] ToS Strict — IMMEDIATE REJECT (${ctx.blocklist_category})`,
    body: [
      `*Category Hit*: ${ctx.blocklist_category} (DEC-019-010 13 prohibited)`,
      `*Candidate*: ${ctx.candidate_id}`,
      `*Auto-Reject*: applied at ${ctx.timestamp}`,
      `*No Owner Action Required* — Audit log appended`,
      `*Evidence*: ${ctx.evidence_url}`,
    ].join('\n'),
    approve_link: '',  // Strict は approval なし
    reject_link: '',
    text: `[ToS Strict] ${ctx.blocklist_category} blocked`,
  };
}
```

#### HITL-6 `tos_gray_review` (MEDIUM)

```typescript
export function renderGate6(ctx: Gate6Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: 'MEDIUM',
    header: `[PRJ-019] ToS Gray Review — confidence=${ctx.confidence.toFixed(2)}`,
    body: [
      `*Category*: ${ctx.category} / ${ctx.subcategory}`,
      `*Confidence*: ${ctx.confidence.toFixed(2)} (gray zone 0.5-0.85)`,
      `*Need*: ${ctx.need_summary}`,
      `*Rationale*: ${ctx.rationale}`,
      `*Blocklist Hits*: ${ctx.blocklist_hits.length === 0 ? 'none' : ctx.blocklist_hits.join(', ')}`,
      `*SLA*: ${ctx.sla_deadline} (24h default)`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Gray] ${ctx.candidate_id} — Owner judgment`,
  };
}
```

#### HITL-7 `ban_drill` / changelog_external_api (HIGH)

```typescript
export function renderGate7(ctx: Gate7Context): SlackMessage {
  return {
    channel: 'drill',
    urgency: 'HIGH',
    header: `[PRJ-019] Changelog External API — ${ctx.upstream} severity=${ctx.severity}`,
    body: [
      `*Upstream*: ${ctx.upstream} (${ctx.semver})`,
      `*Severity*: ${ctx.severity}`,
      `*Description*: ${ctx.description}`,
      `*Affected APIs*: ${ctx.affected_apis.join(', ')}`,
      `*Recommended Adapter*: ${ctx.recommended_adapter}`,
      `*Fallback Plan*: ${ctx.fallback_plan}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Changelog] ${ctx.upstream} ${ctx.severity}`,
  };
}
```

#### HITL-8 `evidence_review` (LOW-MEDIUM)

```typescript
export function renderGate8(ctx: Gate8Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: ctx.urgency_override ?? 'LOW',
    header: `[PRJ-020] Evidence Review — ${ctx.input_kind}`,
    body: [
      `*Input Kind*: ${ctx.input_kind}`,
      `*Owner Input Summary*: ${ctx.input_summary.slice(0, 200)}`,
      `*Validation Status*: ${ctx.validation_status}`,
      `*Action Required*: ${ctx.action_required}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Evidence] ${ctx.input_kind}`,
  };
}
```

#### HITL-9 `dev_kickoff_approval` (MEDIUM)

```typescript
export function renderGate9(ctx: Gate9Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: 'MEDIUM',
    header: `[PRJ-019] Dev Kickoff Approval — proposal=${ctx.proposal_id.slice(0, 20)}`,
    body: [
      `*Proposal ID*: ${ctx.proposal_id}`,
      `*Title*: ${ctx.proposal_title}`,
      `*Need Summary*: ${ctx.need_summary}`,
      `*Estimated Effort*: ${ctx.effort_estimate} SP`,
      `*Knowledge References*: ${ctx.knowledge_refs.length} 件 (organization/knowledge/ 由来)`,
      `*Risk*: ${ctx.risk_summary ?? 'low'}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Kickoff] ${ctx.proposal_title}`,
  };
}
```

#### HITL-10 `permission_change_review` (HIGH)

```typescript
export function renderGate10(ctx: Gate10Context): SlackMessage {
  return {
    channel: 'drill',
    urgency: 'HIGH',
    header: `[PRJ-019] Permission Change — ${ctx.category} ${ctx.change_type}`,
    body: [
      `*Category*: ${ctx.category}`,
      `*Change*: ${ctx.change_type} (${ctx.before} → ${ctx.after})`,
      `*Reason*: ${ctx.reason}`,
      `*Audit Hash*: ${ctx.audit_hash}`,
      `*Risk Level*: ${ctx.risk_level}`,
      `*Rollback Plan*: ${ctx.rollback_plan}`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[Permission] ${ctx.category} ${ctx.change_type}`,
  };
}
```

#### HITL-11 `knowledge_pii_review` (MEDIUM)

```typescript
export function renderGate11(ctx: Gate11Context): SlackMessage {
  return {
    channel: 'hitl',
    urgency: 'MEDIUM',
    header: `[PRJ-019] Knowledge PII Review — batch=${ctx.batch_id}`,
    body: [
      `*Batch ID*: ${ctx.batch_id}`,
      `*Source*: ${ctx.source} (PRJ-${ctx.prj_id})`,
      `*PII Findings*: ${ctx.pii_count} 件 (categories: ${ctx.pii_categories.join(', ')})`,
      `*Redaction Strategy*: ${ctx.redaction_strategy}`,
      `*Owner Action*: PII 検出箇所を確認後 approve / 追加 redaction を要する場合 reject`,
    ].join('\n'),
    approve_link: ctx.approval_url,
    reject_link: ctx.reject_url,
    text: `[PII] batch=${ctx.batch_id}`,
  };
}
```

---

## §4. テンプレファイル構造

### §4.1 ディレクトリレイアウト

```
app/web/src/lib/hitl/
├── dispatcher.ts             # 既存 (5/3 prep) — gate dispatch + 1-8 種実装
├── templates/                # 【T2 で新規作成】
│   ├── types.ts              # 共通型 (GateContextBase / SlackMessage / Gate1〜11Context)
│   ├── index.ts              # 集約 export (renderGateN を全部 export)
│   ├── gate-1-tos-review.template.ts
│   ├── gate-2-permission-review.template.ts
│   ├── gate-3-cost-breach.template.ts
│   ├── gate-4-ng3-breach.template.ts
│   ├── gate-5-tos-strict.template.ts
│   ├── gate-6-tos-gray-review.template.ts
│   ├── gate-7-changelog-external-api.template.ts
│   ├── gate-8-evidence-review.template.ts
│   ├── gate-9-dev-kickoff-approval.template.ts
│   ├── gate-10-permission-change-review.template.ts
│   ├── gate-11-knowledge-pii-review.template.ts
│   └── pii-redactor.ts       # placeholder 値 PII redaction (R-WBS-2 mitigation)
└── templates.test.ts         # Vitest +5 ケース
```

### §4.2 各 template ファイル平均サイズ

| ファイル | 想定行数 |
|---------|---------|
| types.ts | 80 |
| index.ts | 30 |
| gate-N.template.ts × 11 | 各 100-130 (平均 115) |
| pii-redactor.ts | 80 |
| templates.test.ts | 200 (Vitest +5) |
| **計** | 約 **1,655 行** |

---

## §5. Slack notification 連動: lib/notify/slack.ts 再構成

### §5.1 現状 (5/3 prep)

```typescript
// app/web/src/lib/notify/slack.ts (既存)
export async function notifyHitlGate1(ctx: any): Promise<void> {
  // 5/3 prep: 一部 gate は LLM 短文生成パスを残置 (HITL-9 推奨採否欄など)
  const message = await generateMessageWithLLM(ctx);  // ← API 消費源
  await postToSlack(message);
}
// gate 2-11 も同様
```

### §5.2 T2 後の改修案

```typescript
// app/web/src/lib/notify/slack.ts (T2 改修後)
import { renderGate1, renderGate2, /* ... */ renderGate11 } from '@/lib/hitl/templates';
import { redactPII } from '@/lib/hitl/templates/pii-redactor';
import { postSlackWebhook } from './slack-webhook';

export async function notifyHitlGate1(ctx: Gate1Context): Promise<void> {
  const safeCtx = redactPII(ctx);                    // PII redaction 前段
  const msg = renderGate1(safeCtx);                  // static template (LLM 不要)
  await postSlackWebhook(msg.channel, msg);
}

// HITL-9 の injection scan は分離保持 (本来の安全機能)
import { scanInjectionAttempt } from '@/lib/hitl/scan';
export async function notifyHitlGate9(ctx: Gate9Context): Promise<void> {
  const scanResult = await scanInjectionAttempt(ctx.proposal_title);  // ← LLM call (scan のみ、削減対象外)
  if (scanResult.suspicious) {
    // scan 専用 dispatch (template 経由ではなく、別 export)
    await notifyInjectionSuspect(ctx, scanResult);
    return;
  }
  // 通常 path (LLM 不要)
  const safeCtx = redactPII(ctx);
  const msg = renderGate9(safeCtx);
  await postSlackWebhook(msg.channel, msg);
}
```

### §5.3 削減対象と保持対象の切り分け

| 経路 | LLM 依存 | 削減 | 備考 |
|------|---------|------|------|
| 通知メッセージ生成 (header / body) | あり (一部) | **削減** | template 化で 90% 削減 |
| HITL-9 推奨採否欄の injection scan | あり | **保持** | 安全機能、scan 専用 export 分離 |
| HITL-11 PII 検出 (auto redaction の判定) | あり (regex 基本 + LLM 補完) | 部分保持 | regex で 95% 検出、LLM は 5% 補完のみ |
| HITL-6 confidence 算出 | あり (Open Claw 側で算出) | スコープ外 | 受領 ctx.confidence をそのまま template 注入 |

---

## §6. 動的変数 placeholder 仕様

### §6.1 共通 placeholder (全 Gate 利用可)

| placeholder | 型 | 例 | 動的源 |
|-------------|---|-----|--------|
| `{{request_id}}` | string | `req_a8f3e1d` | dispatcher が UUID 生成 |
| `{{actor}}` | string | `open_claw` / `system` / `owner` | gate dispatch 引数 |
| `{{action}}` | string | `public_release` / `cost_overrun` | `action_type` 値 |
| `{{timestamp}}` | string (ISO 8601) | `2026-05-09T09:00:00Z` | `new Date().toISOString()` |
| `{{context}}` | string | gate 固有 context summary | gate ごとの context 集約 |
| `{{evidence_url}}` | string | `https://staging.clawbridge.app/dashboard/audit/req_a8f3` | dashboard URL |
| `{{approval_url}}` | string | `/dashboard/hitl/approve/req_a8f3` | dispatcher が生成 |
| `{{reject_url}}` | string | `/dashboard/hitl/reject/req_a8f3` | dispatcher が生成 |
| `{{sla_deadline}}` | string (ISO 8601) | `2026-05-10T09:00:00Z` | now + 24h |

### §6.2 Gate 固有 placeholder (代表例 5 種)

| Gate | placeholder | 例 |
|------|-------------|-----|
| HITL-3 | `{{spent_usd}}` `{{cap_usd}}` `{{tier}}` `{{recommended_action}}` `{{next_reset_at}}` | `24.10` `30` `warn` `ANTHROPIC_API_KEY 削除推奨` `2026-06-01T00:00:00Z` |
| HITL-6 | `{{category}}` `{{subcategory}}` `{{confidence}}` `{{rationale}}` `{{blocklist_hits}}` | `dev-tools` `cli-utility` `0.62` `HN trending TS repo "X"...` `[]` |
| HITL-9 | `{{proposal_id}}` `{{proposal_title}}` `{{need_summary}}` `{{effort_estimate}}` `{{knowledge_refs}}` | `prop_3a8f` `AI CLI tool` `Git workflow simplification` `5 SP` `[ref1, ref2]` |
| HITL-10 | `{{category}}` `{{change_type}}` `{{before}}` `{{after}}` `{{audit_hash}}` `{{rollback_plan}}` | `Cost` `cap_increase` `30` `50` `sha256:abc...` `revert via /api/admin/budget DELETE` |
| HITL-11 | `{{batch_id}}` `{{source}}` `{{prj_id}}` `{{pii_count}}` `{{pii_categories}}` `{{redaction_strategy}}` | `batch_2026_05_30` `reports/` `007` `3` `[email, name, slack_dm]` `auto + manual review` |

### §6.3 placeholder render 安全性

- **XSS 防止**: Slack mrkdwn は `<` `>` 等を escape 必要、`{{}}` 値を template literal で挿入する際に `escapeMarkdown(value)` を経由
- **Length cap**: header ≤ 150 chars / body ≤ 3000 chars / fallback `text` ≤ 1500 chars (Slack 制限)
- **PII redaction**: `pii-redactor.ts` で email / Slack DM / API key / OAuth token を `[redacted:email]` 等に置換
- **Null safety**: optional placeholder (`{{evidence_url}}` 等) は undefined → `'n/a'` fallback

---

## §7. API 消費削減効果

### §7.1 削減前 (5/3 prep 時点)

| Gate 種別 | 4 週合計呼出回数 | 1 回あたり API cost (LLM 短文生成) | 4 週合計コスト |
|----------|------------------|-----------------------------------|----------------|
| HITL-1〜8 (1-8 種) | 約 60 回 | $0.005-$0.012 (avg $0.008) | $0.48 |
| HITL-9〜11 (新規 3 種) | 約 20 回 | $0.012-$0.022 (avg $0.017) | $0.34 |
| **計** | **約 80 回** | — | **$0.82** |

### §7.2 削減後 (T2 完遂後)

| Gate 種別 | 4 週合計呼出回数 | 1 回あたり API cost (template = $0、scan のみ残置) | 4 週合計コスト |
|----------|------------------|---------------------------------------------------|----------------|
| HITL-1〜8 通知 | 60 回 | $0 (template) | $0 |
| HITL-9 injection scan | 5 回 | $0.04 (scan のみ) | $0.20 |
| HITL-11 PII LLM 補完 | 1 回 | $0.20 (PII 5% LLM scan) | $0.20 |
| **計** | **66 回** | — | **$0.40** |

→ **削減効果**: $0.82 → $0.40 = **51% 削減** ($0.42/月、cap $30 の 1.4% 軽減)

注: WBS §3.6 期待効果「$0.82 → $0.40」+ §0 サマリ「$1-2/月 → $0.10/月、90% 削減」に差異あり。WBS は HITL のみ集計、§0 は HITL + 短文 LLM 補助合計の上限値。本書では WBS 整合の **51% 削減 ($0.42/月)** を正、上限値ベース「90% 削減」は最大効果として併記。

---

## §8. 5/9 までのタイムライン

| 日付 | アクション | 担当 |
|------|-----------|------|
| **5/4 (月)** 本日 | T2 詳細設計書 (本書) 起案 + CEO 承認 | Dev-B (起案) / CEO (承認) |
| 5/5 (火) | kickoff checklist KNOW-1〜5 完了 + DEP-1 (HITL 1-8 dispatcher 確認) 着手 | Dev-B |
| 5/6 (水) | DEP-1 完了 + DEP-2 (HITL 9/10/11 skeleton 確認) | Dev-B |
| 5/7 (木) | DEP-3 (templates/ 配置場所決定) + DEP-4 (signature 合意) | Dev-A + Dev-B |
| 5/8 (金) | T2 ドラフト実装開始 (types.ts + 1-2 gate template 先行) | Dev-B |
| **5/9 (土)** 着手日 | T2 残り 9 gate template + index.ts + pii-redactor.ts + Vitest +5 ケース完遂 (8h 集中作業) | Dev-B |
| 5/9 EOD | T2 完遂報告 → CEO + Review に共有 | Dev-B → CEO + Review |
| 5/12 (火) | Review 部門 review-ban-drill-3-scenario.md §3.1 mock 義務化追記時に T2 template も整合確認 | Review |
| 5/22 (木) | Review 部門 統合検収 (T1 mock 70% 化 + T5 + T6 + T2 template 整合) | Review |

---

## §9. 受入条件 (AC) 5 件 — WBS §3.4 既述

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T2-1 | HITL-9/10/11 通知文が API 呼出ゼロ (LLM 短文生成パスを完全除去) | dispatchHitlGate spy で Anthropic API call 0 回確認 |
| AC-T2-2 | 通知文が `{{placeholder}}` syntax で動的値を埋込 | template render unit test 緑 |
| AC-T2-3 | HITL-9 (g) 推奨採否欄の injection scan は LLM 残置 (本来の安全機能) | コードレビューで scan 経路維持確認 |
| AC-T2-4 | 4 週合計 API 消費見積が $0.82 → $0.40 以下 (51% 削減) | review-30usd-cap-impact-assessment.md §2.3 整合 |
| AC-T2-5 | Vitest +5 ケース緑 + 既存 67 ケース regression なし | CI 全緑 |

---

## §10. 想定リスク (WBS §3.5 既述 + 補足)

| ID | 内容 | 対策 | trigger |
|----|------|------|---------|
| R-T2-1 | placeholder 値に PII 含有 (Owner email, Slack DM 等) → log redaction 漏れ | redaction filter を template render 前に挿入、HITL-11 PII review と同基準 | template render 後 grep で email pattern 検出 |
| R-T2-2 | HITL-9 injection scan 経路の依存性 (templater が LLM call を内部で復活) | scan 専用 export を分離、template module は scan を import しない設計 | template module の grep `generateMessageWithLLM` 検出 |
| R-T2-3 | 11 種 gate context interface の overshoot (将来不要な field が増える) | minimal viable interface 原則、context は base + gate 固有 のみ | code review で context field count > 15 検出 |
| R-T2-4 | Slack mrkdwn escape 漏れ → XSS or 表示崩れ | `escapeMarkdown(value)` を全 placeholder に適用 | Vitest test で `< > & ` 等を入力した時の output verify |

---

## §11. 関連ドキュメント

- `projects/PRJ-019/reports/dev-w0-week2-mandatory-5-tasks-wbs.md` §3 (T2 メタ + AC 5 件)
- `projects/PRJ-019/reports/dev-hitl-gate-1-8-integrated-sop.md` (1-8 種既存 SOP)
- `projects/PRJ-019/reports/dev-hitl-gate-6th-7th-operations-sop.md` (6-7 種 operations)
- `projects/PRJ-019/reports/dev-tos-gray-review-gate-skeleton.md` (HITL-6 skeleton)
- `projects/PRJ-019/reports/research-subscription-mainline-validation.md` §2.3 (5 必須施策根拠)
- `projects/PRJ-019/reports/review-30usd-cap-impact-assessment.md` §2.3 (HITL 4 週合計 API 消費試算)
- `projects/PRJ-019/decisions.md` DEC-019-018 / DEC-019-022 / DEC-020-003 / DEC-019-033 / DEC-019-051

---

## §12. フッタ

- 文書: `projects/PRJ-019/reports/dev-w0-week2-t2-hitl-template-design.md`
- 版: v1.0 (2026-05-04)
- 起案: Dev 部門 (`/dev`)
- 検収予定: Review 部門 5/22 統合検収 (議決-23 と同日)
- 次回更新: 5/9 EOD 完遂報告反映 / 5/22 Review 検収結果反映
- 200 字サマリ: T2 (5/9 期限) HITL 11 種 Gate 通知テンプレ化詳細設計。1=tos_review / 2=permission_review / 3=cost_breach / 4=ng3_breach / 5=tos_strict / 6=tos_gray_review / 7=changelog_external_api / 8=evidence_review / 9=dev_kickoff_approval / 10=permission_change_review / 11=knowledge_pii_review。`app/web/src/lib/hitl/templates/gate-N.template.ts` 形式 11 ファイル + types/index/pii-redactor 計 14 ファイル / 約 1,655 行。LLM 不要 static text + {{placeholder}} 動的 / scan のみ LLM 保持。$0.82 → $0.40 (51% 削減) 期待。Dev-B 単独 5 SP / 2.5 人日。
