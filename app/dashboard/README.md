# @clawbridge/dashboard — 透明性ダッシュボード MVP 雛形仕様

**Status**: 雛形 (Round 8 W2 後半実装前倒し / DEC-019-055 α)
**Owner**: Dev 部門 (Phase 1 W1 で実装本番化)
**Related DEC**: DEC-019-033 ③ / DEC-019-055 α / DEC-020-003 (PRJ-020 同居路線継承)

## 1. ミッション

Open Claw 自律エージェントの行動・思考・コスト・HITL 滞留を **Owner 一人が一画面で把握できる**透明性ダッシュボードを Phase 1 内で構築する。Owner-in-the-loop モデル (DEC-019-033) の中核 UI として、提案承認・権限管理・全停止操作の起点となる。

## 2. 配置設計 (DEC-020-003 同居路線継承)

```
projects/PRJ-019/app/
├── dashboard/                       # ← 本パッケージ (新規追加)
│   ├── README.md                    # 本ファイル
│   ├── package.json                 # @clawbridge/dashboard (Phase 1 W1 起票)
│   ├── next.config.ts               # Next.js 15 App Router 設定 (Phase 1 W1)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (owner)/dashboard/page.tsx         # /dashboard ルート (Owner 専用)
│   │   │   ├── (owner)/dashboard/timeline/page.tsx
│   │   │   ├── (owner)/dashboard/proposals/page.tsx
│   │   │   ├── (owner)/dashboard/cost/page.tsx
│   │   │   ├── (owner)/dashboard/hitl-pending/page.tsx
│   │   │   └── api/sse/transparency/route.ts      # SSE エンドポイント
│   │   ├── components/                            # shadcn/ui ベース
│   │   ├── lib/
│   │   │   ├── auth.ts                            # Owner 唯一 email 制限
│   │   │   ├── supabase.ts                        # SSR + RLS クライアント
│   │   │   └── sse.ts                             # SSE ストリーム
│   │   └── types/
│   └── migrations/                                # Supabase 雛形 (本 Round で初版投入)
│       └── 0001_dashboard_init.sql
```

- **既存 `app/` monorepo を破壊せず追加のみ**。`pnpm-workspace.yaml` に Phase 1 W1 で `'dashboard'` 行を追加する（雛形段階では非追加 / 本ファイル仕様のみ提示）。
- **既存 `app/web/` (Next.js Marketing) との並列**: Marketing 用 LP は `web/`, Owner 専用 Dashboard は `dashboard/` で別パッケージ化。Vercel 上は別 project として deploy 可能。

## 3. 採用技術スタック

| 層 | 採用 | 理由 |
|---|---|---|
| Framework | Next.js 15 (App Router) | CLAUDE.md 標準 / SSR + Server Actions |
| UI | shadcn/ui + Tailwind CSS | CLAUDE.md 標準 |
| Icons | Heroicons | feedback_no_emoji.md 準拠（絵文字禁止） |
| DB | Supabase (PostgreSQL) | 既存 PRJ-019 monorepo 共有 |
| Auth | Supabase Auth | Magic Link + Owner 唯一 email allowlist |
| Real-time | SSE (EventSource) | Supabase Realtime も検討 / W1 で確定 |
| Deploy | Vercel | CLAUDE.md 標準 |
| Test | Vitest + Playwright | CLAUDE.md 標準 |

## 4. 認証ポリシー (DEC-019-033 ⑤ priviledge escalation 物理防止)

- Supabase Auth Magic Link 経由でログイン
- middleware (`src/middleware.ts`) で **Owner 唯一の email allowlist** を強制
  - 環境変数 `OWNER_NOTIFY_EMAIL` (DEC-019-053 v15.1 Vault 登録済 = `ai-lab@improver.jp`) を allowlist の単一エントリとして使用
  - 不一致時は 403 + Slack 通知 + audit log 記録
- すべての write 系操作（権限変更 / kill switch / 提案承認）は Owner email 一致 + audit log 記録 + Slack 通知の 3 必須
- Open Claw 自身のサービス key (`SUPABASE_SERVICE_ROLE_KEY`) は **Dashboard route には注入しない**（subprocess spawn 経路のみ） — DEC-019-033 ⑤ priviledge escalation 物理防止

## 5. 表示項目 6 種 (DEC-019-033 ③)

### (1) Open Claw 行動 timeline
- 出典: `transparency_audit_log` (本 Round 雛形 SQL で新規) + 既存 `audit_log` JOIN
- 形式: 時系列リスト、subprocess spawn / kill / HITL decision / spend / proposal lifecycle 全イベントを 1 ストリーム化
- フィルタ: type / source / 日時範囲 / proposalId

### (2) 思考 trace
- 出典: `transparency_audit_log` の `payload.thought_trace` JSONB
- 形式: 提案ごとに展開可能な accordion、Open Claw が proposal 生成時に推論した「なぜ採用 / なぜ却下」を可視化
- 制約: PII / API キー検出時は自動 redaction（DEC-019-033 §⑤）。HITL 第 11 種 `knowledge_pii_review` で人間チェック可

### (3) 中間出力 preview
- 出典: `transparency_audit_log` の `payload.intermediate_output` (テキスト / JSON / 画像 URL)
- 形式: 安全な iframe / pre タグ、preview deploy URL は target='_blank' rel='noopener noreferrer'
- セキュリティ: HTML サニタイズ (DOMPurify)、外部画像は signed URL のみ

### (4) コスト累積
- 出典: 既存 `cost_ledger_v2` (migrations 0009) + 本 Round `cost_snapshot` 新規
- 表示: subscription 流量 (Claude Max / Codex Pro 推定 $400/月) + API 残額 (Anthropic spend cap $30/月、DEC-019-050)
- watchdog 状態: warn ($24) / auto_stop ($28.5) / hard_fail ($30) を視覚的にバー表示
- 注: `cost_snapshot` は Dashboard 専用の per-minute 集計 cache table

### (5) HITL 滞留件数 + 平均 SLA
- 出典: 既存 `hitl_requests` (migrations 0001) + 本 Round `hitl_pending` view 化
- 表示: 11 種 gate 別件数 + 滞留時間 percentile (p50/p90/p99)
- アラート: SLA 超過予兆 (残 6h 以下) を赤色強調

### (6) 提案待ち件数 (HITL 第 9 種)
- 出典: 既存 `proposals` (migrations 0005) + 本 Round `proposal_queue` view 化
- 表示: status='pending_hitl9' 件数 + 残 SLA + recommended_action ('adopt' / 'reject' / 'defer')
- アクション: Owner が直接 approve / reject ボタンを押せる（write 系は Server Action + audit log）

## 6. アーキテクチャ図

```mermaid
flowchart LR
    subgraph OpenClaw["Open Claw subprocess"]
        OC[openclaw-runtime\nwrapper.ts]
        HC[hitl-kickoff-gate.ts\n(本 Round 新規)]
        CT[cost-tracker.ts]
    end

    subgraph Harness["@clawbridge/harness"]
        HE[hitl-enforcer.ts\n(Round 7 既存)]
        AU[@clawbridge/audit\nSHA-256 hash chain]
    end

    subgraph Supabase["Supabase Postgres + Realtime"]
        TAL[(transparency_audit_log\n本 Round 新規)]
        PQ[(proposal_queue view)]
        CS[(cost_snapshot)]
        HP[(hitl_pending view)]
        EX[(既存 audit_log /\nproposals / hitl_requests /\ncost_ledger_v2)]
    end

    subgraph Dashboard["@clawbridge/dashboard\n(Next.js 15 App Router)"]
        SSE["/api/sse/transparency"]
        OWN["/dashboard\n(Owner 専用 route)"]
    end

    OC -- spawn / output --> AU
    HC -- proposal lifecycle --> AU
    CT -- spend record --> AU
    AU -- append SHA-256 chain --> EX
    EX -- trigger / view --> TAL
    EX -- view --> PQ
    EX -- aggregate --> CS
    EX -- view --> HP
    HE -- HITL decision --> AU
    TAL -- Realtime / poll --> SSE
    PQ -- read --> SSE
    CS -- read --> SSE
    HP -- read --> SSE
    SSE -- EventSource --> OWN
    OWN -- write (approve/reject/kill switch) --> EX
```

## 7. SSE protocol (簡易仕様)

```
GET /api/sse/transparency
Authorization: Bearer <Supabase JWT> (Owner email 検証済)

event: timeline
data: {"id":12345,"ts":"2026-05-04T...","type":"hitl_decision","payload":{...}}

event: cost
data: {"daily":18.42,"monthly":124.5,"watchdogTier":"warn"}

event: hitl_pending
data: [{"gate":"dev_kickoff_approval","count":3,"oldestSlaRemainingMs":21600000}]

event: proposal_queue
data: [{"proposalId":"...","summary":"...","slaRemainingMs":...,"recommended":"adopt"}]
```

- Server: Next.js Route Handler (`route.ts`) で ReadableStream 返却
- Client: `EventSource` (Phase 1 W1 では Server Component + Suspense + Edge Runtime も検討)
- 切断時: client は exponential backoff で再接続、server 側は `transparency_audit_log.id > lastId` で resume

## 8. 雛形 SQL の役割

`migrations/0001_dashboard_init.sql` で以下 4 テーブル / view を新規追加:

| 名前 | 種別 | 役割 |
|---|---|---|
| `transparency_audit_log` | table | Open Claw の行動 / 思考 / 中間出力を SSE 配信用に正規化したストリーム (既存 `audit_log` から trigger で複製、PII redaction 後) |
| `proposal_queue` | view | `proposals` の `status='pending_hitl9'` を Dashboard 用に整形 (SLA 残時間計算済) |
| `cost_snapshot` | table | 1 分単位の cost 集計 cache (subscription 推定 + API 実績) |
| `hitl_pending` | view | `hitl_requests` から status='pending' を gate 別に集計 (滞留 percentile 計算は SQL ファンクション) |

詳細は `migrations/0001_dashboard_init.sql` ヘッダコメント参照。

## 9. Phase 1 W1 引き継ぎ事項

雛形 (本 Round) → 実装本番化 (W1) で必要な作業:

1. **package.json + next.config.ts 作成**: `@clawbridge/dashboard` を pnpm workspace に追加（`app/pnpm-workspace.yaml` の `packages:` に `'dashboard'` 追加 — 本 Round では未追加で、雛形仕様レビュー後 W1 で正式登録）
2. **Supabase migration 適用**: `0001_dashboard_init.sql` を `supabase/migrations/` に複製 (本 Round では `dashboard/migrations/` に独立配置、W1 で正規 path に移動)。RLS ポリシー追加で Owner email 一致を強制
3. **SSE エンドポイント実装**: `/api/sse/transparency/route.ts` で 4 イベント (timeline / cost / hitl_pending / proposal_queue) のストリーム配信
4. **/dashboard ルート実装**: 6 表示項目を shadcn/ui で組む。emoji 禁止 / Heroicons のみ
5. **HITL 第 11 種 `knowledge_pii_review` 接続**: `transparency_audit_log` insertion trigger で PII 検出 → 検出時は HITL 11 へ自動 enqueue (DEC-019-033 §④)
6. **Playwright E2E**: `/dashboard` の login → 6 項目表示 → kill switch click → audit log 記録 までの happy path
7. **Vercel staging deploy**: γ Round 8 で Marketing + Web-Ops が並走中の `/case-studies/openclaw-runtime` staging と統合
8. **HITL 第 9 種実装本番化**: 雛形 `harness/src/hitl-kickoff-gate.ts` を hitl-enforcer.ts 統合点に組込み。`HitlActionType` に `dev_kickoff_approval` を追加し `FileHitlGate.timeoutMs` に `KICKOFF_SLA_MS = 72h` を反映

## 10. 既存 monorepo を破壊しない契約

- `app/web/` / `app/harness/` / `app/audit/` などは一切編集しない（本 Round では `harness/src/index.ts` への export 追加のみ）
- `app/pnpm-workspace.yaml` も雛形段階では未編集（W1 で `'dashboard'` 追加）
- 既存 `app/supabase/migrations/` には触らず、Dashboard 専用 migration を `dashboard/migrations/0001_dashboard_init.sql` に隔離配置（W1 で正規 path に移動）

## 11. 関連 DEC / 仕様文書

- DEC-019-033 (Owner-in-the-loop 5 点統合 / HITL 第 9-11 種 / 透明性 Dashboard / 権限管理 UI)
- DEC-019-050 (Anthropic spend cap $30/月)
- DEC-019-051 (subscription 主軸方針 ≤$430/月)
- DEC-019-053 v15.1〜v15.3 (1Password CLI / Slack 3 channel / standalone repo)
- DEC-019-054 (Round 7 案 7-D 4 部署並列前倒し)
- DEC-019-055 (Round 8 Plan 8-Full / 本 Round 採択根拠)
- DEC-020-003 (PRJ-020 同居路線継承)

---

**雛形完成 commit**: 後続 Round 8 batch commit で記録（`hitl-kickoff-gate.ts` + tests + dashboard/README + dashboard/migrations 同梱）
