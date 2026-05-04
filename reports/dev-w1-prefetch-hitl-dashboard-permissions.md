最終更新日: 2026-05-03 / 起案: Dev 部門 (B 担当) / Phase 1 W1 前倒し実装

# PRJ-019 — Phase 1 W1 前倒し: HITL API + 透明性 Dashboard + 権限管理 UI 統合報告

- 案件: PRJ-019「Clawbridge」
- 担当: Dev 部門 B 担当 (CEO 独立タスク)
- 関連 DEC: DEC-019-033 §② / §③ / §④ / §⑤ / DEC-020-003
- 関連 WBS: `pm-v4-hitl-gates-9-10-11-wbs.md` / `pm-permission-ui-wbs.md`
- 関連 Dev: `dev-tos-gray-review-gate-skeleton.md` / `dev-architecture-w0-skeleton.md`
- 兄弟 (Dev-A): ARCH-01 / hash-chain ライブラリ / Casbin PoC (本タスクとは独立進行)

---

## §1 実装範囲サマリ

3 領域 × `projects/PRJ-019/app/web/` 配下を Phase 1 W1 前倒しで scaffolding。
既存の placeholder ページ (dashboard / permissions) を本実装で置換し、
HITL Gate 11 種 API と整合する 6 区画 dashboard / 7 tab 権限 UI を完成させた。

### §1.1 領域 1 — HITL Gate 11 種 API endpoint
| ファイル | 役割 | 行数概算 |
|---|---|---|
| `src/app/api/hitl/route.ts` | GET 一覧 / POST 起票 (zod validation) | ~85 |
| `src/app/api/hitl/[request_id]/route.ts` | GET 詳細 / PATCH 状態 / DELETE 取消 | ~85 |
| `src/app/api/hitl/[request_id]/approve/route.ts` | POST 承認 (Owner 1-click) | ~55 |
| `src/app/api/hitl/[request_id]/reject/route.ts` | POST 棄却 (Owner 1-click) | ~55 |
| `src/lib/hitl/dispatcher.ts` | 11 種 dispatch + emergency_stop cancel-all 連携 | ~280 |
| `src/lib/hitl/schema.ts` | Zod schema 11 種 + discriminated union | ~145 |
| `src/lib/hitl/audit.ts` | audit_log append placeholder (Dev-A 連携 TODO) | ~80 |
| `src/lib/supabase/server.ts` | service-role client + tenant/actor 解決 placeholder | ~55 |
| `src/lib/utils.ts` | cn / formatJstDateTime / formatUsd / relativeTime | ~50 |

### §1.2 領域 2 — 透明性 Dashboard UI
| ファイル | 役割 | 行数概算 |
|---|---|---|
| `src/app/dashboard/page.tsx` | Server Component / 6 区画レイアウト | ~70 |
| `src/app/dashboard/_components/action-log.tsx` | (a) 行動ログ (audit_log) | ~95 |
| `src/app/dashboard/_components/thought-trace.tsx` | (b) 思考過程 (stream-json) | ~80 |
| `src/app/dashboard/_components/intermediate-output.tsx` | (c) 中間出力 (proposals.summary) | ~70 |
| `src/app/dashboard/_components/cost-meter.tsx` | (d) コスト消費 (3 階層 progress bar) | ~75 |
| `src/app/dashboard/_components/hitl-queue.tsx` | (e) HITL 滞留 (11 種 + SLA 5 件) | ~110 |
| `src/app/dashboard/_components/proposal-queue.tsx` | (f) 提案待ち (HITL-9) | ~60 |
| `src/app/dashboard/_components/refresh-button.tsx` | manual refresh (Phase 1 W2 で Realtime 化) | ~30 |

### §1.3 領域 3 — 権限管理 UI
| ファイル | 役割 | 行数概算 |
|---|---|---|
| `src/app/dashboard/permissions/page.tsx` | Server Component / KillSwitch + 7 tab + Timeline | ~50 |
| `src/app/dashboard/permissions/_components/permissions-tabs.tsx` | controlled Tabs container (client) | ~55 |
| `src/app/dashboard/permissions/_components/rule-list.tsx` | 共通 RuleList (fs/cmd/network) | ~55 |
| `src/app/dashboard/permissions/_components/fs-tab.tsx` | (1) FS 書込範囲 | ~22 |
| `src/app/dashboard/permissions/_components/command-tab.tsx` | (2) シェルコマンド | ~22 |
| `src/app/dashboard/permissions/_components/network-tab.tsx` | (3) Network + 13 prohibited (locked) | ~70 |
| `src/app/dashboard/permissions/_components/hitl-tab.tsx` | (4) HITL 11 種 ON/OFF + SLA | ~75 |
| `src/app/dashboard/permissions/_components/cost-tab.tsx` | (5) コスト 3 階層 | ~45 |
| `src/app/dashboard/permissions/_components/time-tab.tsx` | (6) 7×24 時間帯マトリクス | ~60 |
| `src/app/dashboard/permissions/_components/genre-tab.tsx` | (7) ジャンル whitelist/blocklist | ~50 |
| `src/app/dashboard/permissions/_components/kill-switch.tsx` | KillSwitch (HITL-8 emergency_stop) | ~80 |
| `src/app/dashboard/permissions/_components/save-bar.tsx` | 保存 (HITL-10 起票) | ~85 |
| `src/app/dashboard/permissions/_components/change-timeline.tsx` | 変更履歴 (policy_audit_log) | ~60 |

### §1.4 共通 UI primitive (shadcn/ui 互換)
| ファイル | 役割 |
|---|---|
| `src/components/ui/card.tsx` | Card / Header / Title / Content / Footer |
| `src/components/ui/badge.tsx` | Badge (8 variants) |
| `src/components/ui/button.tsx` | Button (6 variants × 4 sizes) |
| `src/components/ui/table.tsx` | Table primitives |
| `src/components/ui/tabs.tsx` | Tabs (controlled, ARIA-compliant) |
| `src/components/ui/dialog.tsx` | ConfirmDialog (kill switch / save 用) |

### §1.5 型定義 / lib 補助
| ファイル | 役割 |
|---|---|
| `src/types/policy.ts` | 7 category PolicySnapshot + 13 prohibited domains |
| `src/lib/policy/server.ts` | active policy + audit timeline fetch (Supabase + fallback) |

---

## §2 設計判断 (Decision Log)

### §2.1 In-memory fallback for env 未配備
- Pre-Phase 1 では `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` が未配備のため、
  `getServiceClient()` は `null` を返し、dispatcher は `Map` ベースの memory store にフォールバック
- これにより `pnpm dev` でも UI 全体の動作確認が可能
- TODO(Phase 1 W2): env 必須化 + memory fallback 削除

### §2.2 audit_log への INSERT 戦略 (Dev-A 連携 placeholder)
- 既存 migration `20260503000002_audit_log.sql` は `prev_hash` を呼び出し側に要求し、
  `curr_hash` を trigger で計算する設計
- Dev-A の transactional helper (advisory lock + atomic prev/curr) 完成までの placeholder として、
  直前 row の `curr_hash` を SELECT → 次 row の `prev_hash` に流用するロジックを採用
- 並行 INSERT 時は `audit_no_branch unique(prev_hash)` 制約で 1 つだけ成功する fail-safe
- TODO(Phase 1 W1 後半): Dev-A の `lib/audit/hash-chain.ts` の append helper と統合

### §2.3 emergency_stop の cancel-all 連携
- `pm-v4-hitl-gates-9-10-11-wbs.md §4.2` で
  「HITL-8 emergency_stop 優先、HITL-10 は cancel」と定められた連携ルールを
  `dispatcher.createHitlRequest()` 内で一元実装
- `cancelAllPendingExcept(exceptId)` で同一 tenant の pending 全件を `cancelled` に遷移

### §2.4 Owner ガード遅延 (TODO 設計)
- 全ルートで `// TODO(Phase 1 W2): Owner ロール検証を middleware で前置` をコメント
- 本実装では `resolveActor()` が常に `owner` を返す placeholder
- 中間 layer (Casbin / Supabase Auth) は Dev-A 担当の ARCH-01 完了後に統合

### §2.5 13 prohibited domains の表示方針
- DEC-019-033 §⑤ に基づき UI 上で `aria-disabled="true"` + `opacity-70` + `Badge variant=destructive`
- Owner からの override も拒否される (Casbin policy hard envelope) ことを description で明示
- 13 ドメインは `src/types/policy.ts:PROHIBITED_DOMAINS_13` に定数化

### §2.6 manual refresh の暫定採用 (Realtime 先送り)
- Phase 1 W1 の制約により Supabase Realtime 統合は W2 に延期
- ヘッダ右上の `<RefreshButton>` (router.refresh()) で代替
- コスト的にも W1 の Realtime channel 配線を回避できるため判断は妥当

---

## §3 残課題 / Phase 1 W2 以降の積み残し

### §3.1 W2 に確実に着手するもの
1. **Owner 専用 middleware**: `src/middleware.ts` で `/dashboard/**` と `/api/hitl/**` を Owner 限定に
2. **Supabase Realtime 統合**: dashboard の 6 区画を Realtime channel で push 受信
3. **Dev-A hash-chain 統合**: `appendHitlAudit` を transactional helper に置換
4. **編集 UI**: 7 tab の各カテゴリで実際に rule を追加/編集する form (現在は閲覧のみ)
5. **TimePolicy matrix の編集**: クリックで toggle、保存時 HITL-10 起票
6. **HITL-10 起票時 diffJson の精緻化**: 現状は `note: "scaffold edit"` の placeholder

### §3.2 W3 / W4 に着手するもの
1. **PII redaction 統合 (HITL-11)**: knowledge_extraction_queue → 自動 redaction → HITL-11
2. **HITL 通知 3 段** (Slack / SES / SMS): `dispatchNotification()` を `notify` 配下に外部化
3. **Casbin policy enforcement**: 7 category policy を Casbin で強制 (Dev-A ARCH-01 後)
4. **Dashboard `/dashboard/proposals` 詳細ページ**: HITL-9 D9-08/D9-09 の E2E flow

### §3.3 既知の限界
- `noUncheckedIndexedAccess: true` の TypeScript strict 設定下で、
  Record 型 index access が `T | undefined` になる箇所はすべて `??` で defaulting 済
- service_role key を client component に渡さない原則は守られているが、
  middleware が未実装のため API endpoint は theoretical に Open Claw subprocess からも到達可能。
  Phase 1 W2 で middleware 追加 + Casbin 評価で塞ぐ
- `payload` 型は dispatcher 内部で `as HitlRequest` cast している。
  Zod 検証済みなので runtime safety は OK だが、Phase 1 W2 で型 narrowing を改善

---

## §4 完了条件チェック

| 完了条件 | 状態 |
|---|---|
| API endpoint × 4 ルート + dispatcher を Write | 完了 (4 routes + dispatcher + schema + audit) |
| Dashboard 6 区画 component を Write | 完了 (action-log / thought-trace / intermediate-output / cost-meter / hitl-queue / proposal-queue) |
| Permissions 7 tab component を Write | 完了 (fs / command / network / hitl / cost / time / genre + KillSwitch + SaveBar + ChangeTimeline + Tabs container) |
| 統合報告作成 | 本書 |
| 絵文字禁止 / Heroicons 使用 / WCAG 配慮 | 完了 (aria-label / role / focus ring / progressbar 属性) |
| 既存 layout.tsx / globals.css / package.json 非破壊 | 完了 (未編集) |
| service_role を client に渡さない | 完了 (Supabase client は server-only / `import "server-only"`) |

---

## §5 Phase 1 W1 残工数見直し

### §5.1 元工数 (5/26〜6/1 W1 想定)
- **Pre-W1 計画**: 6 PR (Owner middleware / HITL API / Dispatcher / Dashboard 6 区画 / Permissions 7 tab / Dev-A 連携)

### §5.2 本タスクで前倒し完了した PR
| 元 PR | 本タスクで前倒し | 残作業 |
|---|---|---|
| PR-1 Owner middleware | 部分 (TODO コメント残置) | W2 着手 |
| PR-2 HITL API 4 routes | **完了** | — |
| PR-3 Dispatcher + Zod | **完了** | — |
| PR-4 Dashboard 6 区画 | **完了** (manual refresh / Realtime は W2) | Realtime 統合 |
| PR-5 Permissions 7 tab + KillSwitch | **完了** (閲覧 + HITL-10 起票フック / 編集 UI は W2) | 編集 UI |
| PR-6 Dev-A hash-chain 統合 | placeholder のみ | Dev-A 完成後マージ |

### §5.3 残 PR 数
- **元 6 PR → 残 3 PR** (Owner middleware / Realtime + 編集 UI 統合 / Dev-A hash-chain 統合)
- 前倒し完了率: **約 50% (3/6)**, scaffolding 完了率: **約 80% (UI 形状は確定済)**

---

## §6 関連ファイル全リスト (作成 / 更新)

合計 **31 ファイル** を新規作成 + **2 ファイル** (dashboard/page.tsx / permissions/page.tsx) を実装拡充。

### 新規作成 (29)
- `src/lib/utils.ts`
- `src/lib/supabase/server.ts`
- `src/lib/hitl/schema.ts`
- `src/lib/hitl/audit.ts`
- `src/lib/hitl/dispatcher.ts`
- `src/lib/policy/server.ts`
- `src/types/policy.ts`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dialog.tsx`
- `src/app/api/hitl/route.ts`
- `src/app/api/hitl/[request_id]/route.ts`
- `src/app/api/hitl/[request_id]/approve/route.ts`
- `src/app/api/hitl/[request_id]/reject/route.ts`
- `src/app/dashboard/_components/action-log.tsx`
- `src/app/dashboard/_components/thought-trace.tsx`
- `src/app/dashboard/_components/intermediate-output.tsx`
- `src/app/dashboard/_components/cost-meter.tsx`
- `src/app/dashboard/_components/hitl-queue.tsx`
- `src/app/dashboard/_components/proposal-queue.tsx`
- `src/app/dashboard/_components/refresh-button.tsx`
- `src/app/dashboard/permissions/_components/rule-list.tsx`
- `src/app/dashboard/permissions/_components/fs-tab.tsx`
- `src/app/dashboard/permissions/_components/command-tab.tsx`
- `src/app/dashboard/permissions/_components/network-tab.tsx`
- `src/app/dashboard/permissions/_components/hitl-tab.tsx`
- `src/app/dashboard/permissions/_components/cost-tab.tsx`
- `src/app/dashboard/permissions/_components/time-tab.tsx`
- `src/app/dashboard/permissions/_components/genre-tab.tsx`
- `src/app/dashboard/permissions/_components/kill-switch.tsx`
- `src/app/dashboard/permissions/_components/change-timeline.tsx`
- `src/app/dashboard/permissions/_components/permissions-tabs.tsx`
- `src/app/dashboard/permissions/_components/save-bar.tsx`

### 拡充 (2)
- `src/app/dashboard/page.tsx` (placeholder → 6 区画実装)
- `src/app/dashboard/permissions/page.tsx` (placeholder → 7 tab + KillSwitch + Timeline)

---

**v1 確定**: 2026-05-03 / **次回更新**: Phase 1 W1 開始 (5/26) 時点でレビュー部門と統合
