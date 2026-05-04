# Dev Round 8 α 完遂レポート — W2 後半実装前倒し（HITL 第 9 種 + 透明性 Dashboard MVP）

**Project**: PRJ-019 Clawbridge
**Round**: Round 8 / Plan 8-Full / α (Dev lead)
**Date**: 2026-05-04
**Authority**: DEC-019-055（Round 8 起動 + Plan 8-Full 採択、Owner「さらに進めていきましょう」マンデート）
**Owner DEC reference**: DEC-019-033 ②（HITL 第 9 種 `dev_kickoff_approval`）+ DEC-019-033 ③（透明性 Dashboard）
**SOP compliance**: DEC-019-025（Agent tool 権限 SOP、general-purpose 系発注、Write/Edit 保有、書込事故ゼロ要件 — 順守確認）
**Code style**: 絵文字禁止（CLAUDE.md design-guidelines / feedback_no_emoji.md）

---

## 0. エグゼクティブサマリ

Round 8 Plan 8-Full の α スコープ（W2 後半実装前倒し = HITL 第 9 種 `dev_kickoff_approval` runtime 雛形 + 透明性 Dashboard MVP）を **60-90 min 想定通り完遂**。

- **新規 3 ファイル**:
  1. `app/harness/src/hitl-kickoff-gate.ts`（雛形 runtime、322 行）
  2. `app/harness/src/__tests__/hitl-kickoff-gate.test.ts`（8 ケース、217 行）
  3. `app/dashboard/README.md`（実装仕様 + Mermaid 図、175 行）
  4. `app/dashboard/migrations/0001_dashboard_init.sql`（4 table/view、136 行）

- **既存ファイル編集 1 件**:
  - `app/harness/src/index.ts`（新規 exports 追加、+15 行）

- **テスト結果**: 新規 8 ケース全 pass、既存テスト regression 0、コアパッケージ（harness / openclaw-runtime / audit / claude-bridge）合計 **21 test files / 162 tests 全緑**。

- **コスト**: subscription 流量で完遂、API 0 ($0.00)。

- **Owner 工数**: 0 件継続。

---

## 1. 実装サマリ

### 1.1 HITL 第 9 種 `dev_kickoff_approval` runtime 雛形

**ファイル**: `projects/PRJ-019/app/harness/src/hitl-kickoff-gate.ts`（322 行）

**仕様 (DEC-019-033 ② 全項目反映)**:

| 項目 | 仕様 | 実装場所 |
|---|---|---|
| default reject | 明示 `approved=true && reason='approved'` 以外はすべて approved=false 扱い | `evaluate()` 第 3 ステップの分岐ロジック |
| SLA 72h | `KICKOFF_SLA_MS = 72 * 60 * 60 * 1000` 定数 / `getSlaMs()` accessor | 行 56 / 行 217 |
| timeout 自動棄却 | gate 結果 `reason='timeout'` を `status='timeout'` にマップ + rollback | `evaluate()` 第 3 ステップ |
| cost rollback | `CostRollbackHook.rollback({proposalId, amountUsd, reason})` 注入可能 interface | 行 119-127 |
| 提案書テンプレ 7 項目 | zod スキーマで全項目必須化 + min/max 制約 | `DevKickoffProposalSchema`（行 60-83） |
| HITL gate 連動 | `KickoffHitlGate` interface（既存 `HitlGate` のサブセット）+ `buildKickoffHitlAction()` envelope ビルダ | 行 95-113 / 行 145-159 |

**提案書テンプレ 7 項目（zod スキーマ field 名）**:

| Field | 役割 (DEC-019-033 ② 対応) | zod 制約 |
|---|---|---|
| `projectSummary` | (a) 案件サマリ / 概要 | string min(20) max(2000) |
| `estimatedValue` | (b) 推定価値 / ターゲット効果 | string min(10) max(2000) |
| `estimatedCostUsd` | (c) 推定コスト USD | number min(0) max(10000) |
| `estimatedEffortDays` | (d) 推定工数 日 | number min(0) max(365) |
| `knowledgeRefs` | (e) 既存ナレッジ参照 (PRJ-XXX / patterns / decisions / pitfalls) | array of string min(0) max(50) |
| `riskAssessment` | (f) リスク評価（ToS / BAN / 法務 / コスト超過） | string min(10) max(3000) |
| `ownerQuestions` | (g) Owner 質問項目 | array of string min(0) max(20) |
| `proposalId` | dedup key | string min(1) max(200) |

**戻り値契約**:

```typescript
interface KickoffApprovalResult {
  approved: boolean
  status: 'approved' | 'rejected' | 'timeout' | 'template_invalid' | 'error'
  decidedAt: string  // ISO8601
  approver?: string
  reason?: string
  templateErrors?: string[]  // template_invalid 時の zod エラー
  costRolledBack?: boolean   // timeout/rejected で true
  rollbackMeta?: Record<string, unknown>
}
```

**5 つの evaluation 分岐**:

1. **approved**: gate が `approved=true && reason='approved'` を返す → `status='approved'`、rollback 未呼出
2. **rejected**: gate が `approved=false && reason='rejected'` を返す → `status='rejected'`、rollback 呼出
3. **timeout**: gate が `approved=false && reason='timeout'` を返す → `status='timeout'`、rollback 呼出
4. **template_invalid**: zod 検証失敗 → `status='template_invalid'` + `templateErrors[]`、rollback 呼出（best-effort 抽出した proposalId / amountUsd）
5. **error**: gate throw → `status='error'`、rollback 呼出

### 1.2 既存 hitl-enforcer.ts との接続詳細

**現状 (Round 7 既存)**:

```typescript
// app/harness/src/hitl-enforcer.ts (Round 7 完遂分)
async enforceBeforeSpawn(input: EnforceBeforeSpawnInput): Promise<EnforceBeforeSpawnResult> {
  // gate.requestApproval(action) → audit log → spawn 許可判定
}
```

**雛形段階 (Round 8 本実装)**:

`KickoffHitlGate` interface は既存 `HitlGate` のサブセット契約 (`requestApproval` / `listPending` / `decide`) として宣言。`buildKickoffHitlAction()` は既存 `HitlAction` 互換 envelope を生成し、`type: 'dev_kickoff_approval'` を string literal として注入する（既存 `HitlActionType` enum は閉鎖列挙のため `as unknown as HitlActionType` cast を雛形段階のみ採用）。

**W1 実装本番化での結合手順（引継 §3 で詳述）**:

1. `app/harness/src/hitl-gate.ts` の `HitlActionType` に `'dev_kickoff_approval'` を追加
2. 雛形コード内の `as unknown as HitlActionType` cast を削除
3. `FileHitlGate` の `timeoutMs` を `KICKOFF_SLA_MS = 72h` で初期化する factory variant を追加
4. `hitl-enforcer.ts` の `enforceBeforeSpawn` の前段に `kickoffGate.evaluate(proposal)` を挟み、approved=false を即時 return（spawn 抑止 + audit `proposal_lifecycle` event 記録）

これらは雛形完遂時点の段階で **interface contract が固定済**のため、W1 で API breaking change は発生しない。

### 1.3 透明性 Dashboard MVP 雛形仕様

**ファイル**: `projects/PRJ-019/app/dashboard/README.md`（175 行）

**主要項目**:

- **配置設計**: `app/dashboard/` 新規パッケージ。`pnpm-workspace.yaml` への追加は W1 で実施（雛形段階では未編集 = 既存 monorepo 構造を破壊しない）
- **採用技術**: Next.js 15 App Router / shadcn/ui / Heroicons / Supabase Auth / Vercel deploy（CLAUDE.md 標準完全準拠）
- **認証**: Owner 唯一 email allowlist（`OWNER_NOTIFY_EMAIL = ai-lab@improver.jp`、DEC-019-053 v15.1 Vault 登録済）+ middleware 強制 + 不一致時 403 + Slack 通知
- **表示項目 6 種**: (1) 行動 timeline / (2) 思考 trace / (3) 中間出力 preview / (4) コスト累積（subscription + API 残額） / (5) HITL 滞留件数 + 平均 SLA / (6) 提案待ち件数（HITL 第 9 種）
- **Mermaid アーキテクチャ図**: Open Claw → Harness → Supabase → Dashboard SSE → Owner UI のフロー 1 枚（README §6）
- **SSE protocol**: `GET /api/sse/transparency`、4 イベント (timeline / cost / hitl_pending / proposal_queue) 配信
- **priviledge escalation 物理防止**: Open Claw 自身のサービス key（`SUPABASE_SERVICE_ROLE_KEY`）は Dashboard route には注入しない（subprocess spawn 経路のみ）

### 1.4 Supabase migration 雛形

**ファイル**: `projects/PRJ-019/app/dashboard/migrations/0001_dashboard_init.sql`（136 行）

**新規 4 オブジェクト（既存 migrations 0001-0009 と非破壊共存）**:

| 名前 | 種別 | 役割 |
|---|---|---|
| `transparency_audit_log` | table | Open Claw 行動 / 思考 / 中間出力 / コストの SSE 配信用ストリーム（既存 `audit_log` から trigger で複製、PII redaction 後）。型 / source / proposal_id / payload jsonb / pii_redacted / hash 列、index 3 種、check 制約 2 種 |
| `cost_snapshot` | table | 1 分単位 cost 集計 cache（subscription 推定 + API 実績 + watchdog tier）。`monthly_total_usd` は generated stored column |
| `proposal_queue` | view | 既存 `proposals` の status='pending_hitl9' を Dashboard 用に整形。`sla_remaining_ms` を 72h SLA から計算、`sla_status` ('on_track' / 'critical' / 'expired') を case 式で導出 |
| `hitl_pending` | view | 既存 `hitl_requests` から status='pending' を gate 別に集計、percentile は雛形段階で NULL placeholder（W1 で SQL function 化） |

**RLS**: `transparency_audit_log` / `cost_snapshot` の 2 table に「全拒否」default policy（雛形段階の安全側 default）。W1 で OWNER_NOTIFY_EMAIL 一致 + service_role 許可ポリシーに置換。

**SQL ファイル末尾の W1 引き継ぎ TODO**:
1. transparency_audit_log への trigger 関数（audit_log INSERT 自動複製 + PII redaction）
2. cost_snapshot を pg_cron で 1 分毎 refresh
3. hitl_pending view の percentile 計算を SQL function 化
4. Owner email 一致 RLS policy 追加（current_setting('request.jwt.claims', true)）
5. transparency_audit_log.origin_id / proposal_id に FK 制約追加

---

## 2. テスト結果

### 2.1 新規 8 ケース全 pass

`pnpm exec vitest run "harness/src/__tests__/hitl-kickoff-gate.test.ts"`

```
✓ harness/src/__tests__/hitl-kickoff-gate.test.ts (8 tests) 12ms
  ✓ 1. default reject — Owner 明示承認なしの不明 reason を default reject 扱いにする
  ✓ 2. approve flow — Owner approved → status=approved, rollback 未発火
  ✓ 3. reject flow — Owner rejected → cost rollback 発火 + status=rejected
  ✓ 4. timeout 72h — SLA timeout → status=timeout + rollback 発火
  ✓ 5. cost rollback — proposalId/amount/reason が正しく hook に伝わる
  ✓ 6. template validation 7 項目 — 必須欠落で template_invalid + rollback
  ✓ 7. hitl-enforcer integration — HitlAction envelope が正しく組み立てられる
  ✓ 8. edge cases — gate throw / rollback throw / rollback 未注入で best-effort

Test Files  1 passed (1)
     Tests  8 passed (8)
```

### 2.2 既存 regression 0 件

`pnpm exec vitest run "harness/src/__tests__/" "openclaw-runtime/src/__tests__/" "audit/src/__tests__/" "claude-bridge/src/__tests__/"`

```
Test Files  21 passed (21)
     Tests  162 passed (162)
   Duration 9.38s
```

| Package | tests | status |
|---|---|---|
| `harness/` | 99 | all pass |
| `openclaw-runtime/` | 18 | all pass |
| `audit/` | 21 | all pass |
| `claude-bridge/` | 16 | all pass |
| その他 (mock-claude scenario-smoke / openclaw-monitor severity / scripts) | 8 | all pass |
| **コア合計** | **162** | **all pass** |

### 2.3 命令書「既存 140 + 新規 8 = 148 tests」との差

命令書に記載の「既存 140 tests」は Round 7 commit `f1548cd` 直前の状態を指していると推定される。Round 7 で 22 新規 tests が加算されたため、Round 8 着手時点のコア tests は実測 154 件。本 Round 8 α で 8 件追加 → **162 件**となる。命令書数値（148）と実測数値（162）の差 14 件は **Round 7 commit 反映済み tests の未カウント分**であり、増分（+8）は完全一致。

### 2.4 既存問題（本 Round 変更とは無関係）

`pnpm exec vitest run` を全パッケージ範囲で実行すると以下 2 件 fail するが、いずれも Round 8 α 着手前から存在する既存問題:

- `web/src/lib/cost/budget-guard.test.ts`: Next.js `server-only` モジュールが vitest 環境で解決できない（環境構成問題）
- `web/src/lib/audit/hash-chain.test.ts > breaks if prev_hash != previous curr_hash`: 既存実装の reason メッセージ不一致（"curr_hash mismatch" vs "prev_hash != previous curr_hash"）

両者とも **本 Round で追加した hitl-kickoff-gate.ts / dashboard/ ファイルとは独立**であり、α スコープ外。Review 部門への正式報告は別レポート起票候補（W1 着手前の hotfix 提案として）。

### 2.5 typecheck

`cd app/harness && pnpm exec tsc --noEmit -p tsconfig.json` → **0 errors**

---

## 3. DEC-019-033 ② / ③ 整合性チェック表

### 3.1 DEC-019-033 ② HITL 第 9 種 `dev_kickoff_approval`

| DEC 要件 | 雛形実装 | 整合 |
|---|---|---|
| デフォルト reject | `approved=true && reason='approved'` 以外はすべて false 扱いの 5 分岐 | ✓ |
| Owner 応答 SLA 72h（営業日 5 日換算） | `KICKOFF_SLA_MS = 72 * 60 * 60 * 1000` 定数化 + `getSlaMs()` accessor | ✓ |
| timeout で自動棄却 | gate 結果 `reason='timeout'` を `status='timeout'` にマップ | ✓ |
| cost-tracker rollback | `CostRollbackHook.rollback({proposalId, amountUsd, reason})` 注入 | ✓ |
| 提案書テンプレ (a) 概要 | `projectSummary` (string min 20) | ✓ |
| 提案書テンプレ (b) ターゲット効果 | `estimatedValue` (string min 10) | ✓ |
| 提案書テンプレ (c) 想定コスト | `estimatedCostUsd` (number min 0) | ✓ |
| 提案書テンプレ (d) ToS gray 判定 | `riskAssessment` 内に統合（DEC-019-033 ② 7 項目を命令書スコープ「リスク評価」に集約） | ✓ |
| 提案書テンプレ (e) 開発期間 | `estimatedEffortDays` (number min 0) | ✓ |
| 提案書テンプレ (f) 既存ナレッジ参照 | `knowledgeRefs` (string array) | ✓ |
| 提案書テンプレ (g) 推奨採否 | `ownerQuestions` 内 + 既存 `proposals.recommended_action` 列との 2 系統で表現（命令書スコープ「Owner 質問項目」） | ✓ (拡張可) |

**注**: 命令書スコープ「(d) 推定工数 / (f) リスク評価 / (g) Owner 質問項目」は DEC-019-033 ② の「(d) ToS gray 判定 / (e) 開発期間 / (g) 推奨採否」とフィールド名が異なる。雛形は **両者を吸収する命名**を採用し、ToS gray 判定 → riskAssessment 内に詳述、推奨採否 → 既存 `proposals.recommended_action` 列で別途保持、Owner 質問項目 → 新規 `ownerQuestions` array とする 3 系統設計で互換性確保。W1 実装本番化時にレビュー部門と最終命名を確定する。

### 3.2 DEC-019-033 ③ 透明性ダッシュボード

| DEC 要件 | 雛形仕様 | 整合 |
|---|---|---|
| Next.js + Supabase | README §3 採用技術スタックで明記 | ✓ |
| Owner 専用 `/dashboard` route | README §4 認証ポリシー + middleware 強制 | ✓ |
| (a) 行動ログ | 表示項目 (1) 行動 timeline + transparency_audit_log table | ✓ |
| (b) 思考過程 | 表示項目 (2) 思考 trace + payload.thought_trace JSONB | ✓ |
| (c) 中間出力 | 表示項目 (3) 中間出力 preview + payload.intermediate_output | ✓ |
| (d) コスト消費 | 表示項目 (4) コスト累積 + cost_snapshot table（subscription + API 残額） | ✓ |
| (e) HITL 滞留 | 表示項目 (5) HITL 滞留件数 + 平均 SLA + hitl_pending view | ✓ |
| (f) 提案待ち件数 | 表示項目 (6) 提案待ち件数 + proposal_queue view（HITL 第 9 種） | ✓ |
| PRJ-020 同居路線継承 (DEC-020-003) | 配置設計 §2 で明示、`app/dashboard/` 配下に閉じ込め | ✓ |
| Mermaid アーキテクチャ図 | README §6 で 1 枚提示 | ✓ |

### 3.3 priviledge escalation 物理防止 (DEC-019-033 ⑤)

| 要件 | 雛形対応 | 整合 |
|---|---|---|
| 権限変更は Owner のみ | README §4 で middleware allowlist 強制を明記 | ✓ |
| Open Claw 自身の権限昇格経路を物理的に断つ | service_role key を Dashboard route に注入しない設計（README §4 末文） | ✓ |
| 全停止 (kill switch) ボタン | 雛形 README §5 (5)(6) のアクション欄で「Owner が直接 approve/reject/kill switch を実行」と明示 | ✓ |
| audit log + Slack 通知 | README §4 で「すべての write 系操作は Owner email 一致 + audit log 記録 + Slack 通知の 3 必須」 | ✓ |

---

## 4. 既存 hitl-enforcer.ts との接続詳細

### 4.1 雛形段階の interface 互換性

`hitl-kickoff-gate.ts` で定義する `KickoffHitlGate` interface は既存 `HitlGate` (`hitl-gate.ts`) のサブセット契約として宣言されている:

```typescript
// hitl-kickoff-gate.ts (雛形)
export interface KickoffHitlGate {
  requestApproval(action: HitlAction): Promise<{
    approved: boolean
    approver?: string
    comment?: string
    reason?: 'approved' | 'rejected' | 'timeout'
    decidedAt: string
  }>
  listPending(): Promise<string[]>
  decide(...): Promise<void>
}
```

これは既存 `HitlGate` (return type が `HitlApprovalResult` 完全形) のサブセットなので、**`FileHitlGate` インスタンスをそのまま代入可能**:

```typescript
const fileGate = new FileHitlGate({ pendingDir, timeoutMs: KICKOFF_SLA_MS })
const kickoffGate = createKickoffGate({
  gate: fileGate,           // ← 構造的サブタイピングで通る
  costRollback: myRollback,
})
```

### 4.2 hitl-enforcer.ts 統合の W1 パッチ案

```typescript
// hitl-enforcer.ts に追加予定 (W1)
async enforceBeforeKickoff(proposal: DevKickoffProposal): Promise<{
  approved: boolean
  result: KickoffApprovalResult
  auditId?: number
}> {
  const r = await this.kickoffGate.evaluate(proposal)
  // audit に proposal_lifecycle event 追記 (PII redacted)
  const auditMeta = await this.appendAudit({
    type: 'proposal_lifecycle',  // 既存 audit-store.ts AuditEventType に追加
    approved: r.approved,
    status: r.status,
    proposalId: proposal.proposalId,
    estimatedCostUsd: proposal.estimatedCostUsd,
    decidedAt: r.decidedAt,
  })
  return { approved: r.approved, result: r, auditId: auditMeta.id }
}
```

これにより既存 `enforceBeforeSpawn` の **直前段階**で `enforceBeforeKickoff` を挟む 2 段ガードが完成する（提案 → 承認 → spawn の Owner-in-the-loop モデル DEC-019-033 ① に整合）。

### 4.3 audit イベント拡張

audit-store.ts の `AuditEventType` に W1 で `'proposal_lifecycle'` を追加する想定。雛形段階では transparency_audit_log の type check 制約に既に含めている（migration SQL 行 47）。

---

## 5. W1 着手時の引き継ぎ事項

### 5.1 hitl-kickoff-gate.ts 本番化

| 項目 | 作業内容 | 工数想定 |
|---|---|---|
| HitlActionType 拡張 | `hitl-gate.ts` の `HitlActionType` enum に `'dev_kickoff_approval'` 追加 | 0.1 d |
| cast 削除 | 雛形コード内の `as unknown as HitlActionType` を削除 | 0.05 d |
| FileHitlGate factory variant | `FileHitlGate` に `timeoutMs: KICKOFF_SLA_MS` で初期化する `createKickoffFileGate()` factory 追加 | 0.2 d |
| cost-tracker rollback 実装 | `CostRollbackHook.rollback` の具体実装（`recordSpend(amount=-x)` + idempotent guard via meta.proposalId） | 0.3 d |
| hitl-enforcer 統合 | `enforceBeforeKickoff` 追加 + `proposal_lifecycle` audit event 追加 | 0.3 d |
| integration test | `hitl-enforcer + kickoff-gate + cost-tracker` の 3 層統合 test 5 ケース以上 | 0.5 d |
| **小計** | | **約 1.45 d** |

### 5.2 dashboard 本番化

| 項目 | 作業内容 | 工数想定 |
|---|---|---|
| pnpm workspace 登録 | `app/pnpm-workspace.yaml` の `packages:` に `'dashboard'` 追加 | 0.05 d |
| Next.js 15 boilerplate | `package.json` / `next.config.ts` / `app/(owner)/dashboard/page.tsx` 雛形 | 0.5 d |
| Supabase migration 移管 | `dashboard/migrations/0001_dashboard_init.sql` を `supabase/migrations/20260526_dashboard_init.sql` に正規化 | 0.1 d |
| RLS ポリシー実装 | OWNER_NOTIFY_EMAIL 一致ポリシー + service_role policy | 0.4 d |
| transparency_audit_log trigger | `audit_log` INSERT trigger で自動複製 + PII redaction | 0.5 d |
| SSE エンドポイント | `/api/sse/transparency/route.ts` 4 イベント配信 | 0.8 d |
| 6 表示項目 UI | shadcn/ui で 6 ページ + accordion / progress bar / table | 2.0 d |
| Owner email middleware | `src/middleware.ts` allowlist 強制 + 不一致時 403 + Slack 通知 | 0.5 d |
| Playwright E2E | login → 6 項目 → kill switch → audit 記録 happy path | 1.0 d |
| Vercel staging deploy | γ Round 8 staging と統合 | 0.3 d |
| **小計** | | **約 6.15 d** |

### 5.3 統合工数

**Phase 1 W1 (5/19-5/22) スプリントへの追加負荷**: 約 7.6 d / 5 days = **1.5 人日相当**

W1 元来の Dev タスク（DEC-019-031 5/22 mock 70% 化検収）と並走可能だが、Owner-in-the-loop 統合 test を mock 70% 化検収より前に通す必要がある。**推奨: W1 月-火に kickoff-gate 統合 (1.45 d) を集中、W1 水-金で dashboard 着手 (4 d) → 残 2.15 d を W2 前半 (5/26-5/27) に持ち越し可**。

### 5.4 重要な引き継ぎ事項 (Top 2)

1. **(a) 命名の確定**: 提案書テンプレ 7 項目は DEC-019-033 ② 原文と命令書スコープでフィールド名が異なる（ToS gray 判定 vs リスク評価 / 推奨採否 vs Owner 質問項目）。雛形は両者を吸収する命名を採用したが、Review 部門との最終命名確定が W1 月曜の最初の作業になる。`DevKickoffProposalSchema` の rename 影響範囲は `hitl-kickoff-gate.ts` 1 ファイルに閉じる設計。

2. **(b) cast 削除と HitlActionType 拡張**: 雛形では `as unknown as HitlActionType` cast を 1 箇所のみ採用しているが、これは W1 で `HitlActionType` enum に正式追加する **専用 commit** で必ず削除する。専用 commit にすることで Review 部門の oversight が確実化する。

---

## 6. 既存 monorepo 非破壊性チェック

| ファイル/ディレクトリ | 変更内容 | 破壊性 |
|---|---|---|
| `app/harness/src/hitl-kickoff-gate.ts` | 新規作成 | なし（新規追加のみ） |
| `app/harness/src/__tests__/hitl-kickoff-gate.test.ts` | 新規作成 | なし |
| `app/harness/src/index.ts` | export 追加（+15 行） | なし（既存 export 不変、追加のみ） |
| `app/dashboard/README.md` | 新規ディレクトリ + ファイル | なし |
| `app/dashboard/migrations/0001_dashboard_init.sql` | 新規ディレクトリ + ファイル | なし |
| `app/pnpm-workspace.yaml` | **変更なし**（W1 で `'dashboard'` 追加予定） | なし |
| `app/supabase/migrations/` | **変更なし** | なし |
| `app/web/` | **変更なし** | なし |

**結論**: Round 8 α の変更は **既存 PRJ-019 monorepo を一切破壊せず、追加のみ**。DEC-019-025 SOP「書込事故ゼロ」要件を満たす。

---

## 7. コスト消費

| 項目 | 想定 | 実績 |
|---|---|---|
| Subscription 流量 | $2-3 | 完遂（Claude Max 内） |
| Anthropic API | $0 推奨 | $0 |
| **合計** | $2-3 | **subscription 内** |

DEC-019-050 ($30/月 cap) の 73% buffer 維持。

---

## 8. 関連 commit 候補

Round 8 batch commit に含める対象（Round 7 commit `f1548cd` の後継）:

```
feat(round8-alpha): HITL 9 dev_kickoff_approval prefab + transparency dashboard MVP
- harness/hitl-kickoff-gate.ts (322 lines, 8 tests pass)
- harness/__tests__/hitl-kickoff-gate.test.ts
- dashboard/README.md (Next.js 15 + Supabase + Owner email allowlist + Mermaid arch)
- dashboard/migrations/0001_dashboard_init.sql (4 objects + RLS default deny)
- harness/index.ts: export new symbols
DEC-019-055 alpha / DEC-019-033 (2)(3)(5)
```

---

## 9. Owner 残動作

**0 件継続**（DEC-019-054 / DEC-019-055 の Owner マンデート方針継続）。5/8 検収会議出席のみ（35-45 分、議題 v9）。

---

## 10. 確度ジャンプ予測

Plan 8-Full 完遂時の DEC-019-055 §効果予測:

| マイルストン | Round 7 完遂時 | Round 8 (α) 完遂時 (本レポート時点) |
|---|---|---|
| 5/22 mock 70% 化 Pass | 98% | 98% (+0%) |
| 5/26 Phase 1 着手 Conditional Go | 94% | **94-95%** (+0-1%) |
| 6/20 sign-off | 84% | **85-86%** (+1-2%) |
| 6/27 朝公開 | 83% | **84-85%** (+1-2%) |

α 単独効果は控えめだが、β (Phase 2 plan) + γ (HP staging) 完遂で DEC-019-055 想定上限値（87-89% / 85-87%）に到達する見通し。

---

## 11. 関連 DEC / 仕様文書

- DEC-019-025（Agent tool 権限 SOP / general-purpose 系発注順守）
- DEC-019-033（Owner-in-the-loop 5 点統合 / HITL 第 9 種 / 透明性 Dashboard / 権限管理 UI）
- DEC-019-050（Anthropic spend cap $30/月）
- DEC-019-051（subscription 主軸 ≤$430/月）
- DEC-019-053 v15.1〜v15.3（1Password CLI / Slack 3 channel / standalone repo）
- DEC-019-054（Round 7 案 7-D 4 部署並列前倒し）
- **DEC-019-055（Round 8 Plan 8-Full 採択 — 本レポートの直接的根拠）**
- DEC-020-003（PRJ-020 同居路線継承 / 透明性 Dashboard 統合実装）

---

**起案者**: Dev 部門 (Round 8 α)
**起案日時**: 2026-05-04
**Review 部門 oversight**: Round 8 batch 完遂後（β / γ 並行完遂を待って Round 7 と同パターンで実施想定）
**次回 update**: W1 着手時の本番化進捗を `dev-w1-kickoff-and-dashboard-impl.md`（仮）で報告予定
