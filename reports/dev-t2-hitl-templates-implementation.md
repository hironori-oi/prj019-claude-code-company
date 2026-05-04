# Dev W0-Week2 T2 実装レポート — HITL 11 種 Gate 通知テンプレ実装完了

- 案件: PRJ-019 Clawbridge
- 部署: Dev (Dev-B)
- 起票日: 2026-05-04
- 親決裁: **DEC-019-051 §施策-2** (HITL 通知テンプレ化、API $1-2/月 → $0.10/月、90% 削減)
- 関連設計書: `dev-w0-week2-t2-hitl-template-design.md` (564 行、5/4 納品)
- 文書 ID: DEV-PRJ-019-W0W2-T2-HITL-TEMPLATE-IMPL-2026-05-04
- 期限: 2026-05-09 → **5/4 (5 日前倒し) 完了**
- ステータス: **実装完了 / Vitest 63 ケース全 pass / 既存テスト regression なし**

---

## §0. エグゼクティブサマリ (350 字)

DEC-019-051 §施策-2 の HITL 11 種 Gate 通知テンプレ化を **5 日前倒し** で完遂。`projects/PRJ-019/app/web/src/lib/hitl/templates/` 配下に 11 ファイル (gate-1〜gate-11) + types.ts + index.ts + pii-redactor.ts + Vitest テスト 1 ファイル (計 **15 ファイル / 1,981 行**) を新規作成し、`dispatcher.ts` を template-based 通知経路に再構成。各 template は決定論的 (LLM 不要) で `buildTitle / buildBody / buildSlackBlocks / contextSchema` を提供し、placeholder 値は `redactPayload` で PII redaction 後に注入される。Vitest **63 ケース全 pass** (各 gate × 5 + cross-cutting 8)、既存 templates 関連 regression ゼロ。期待効果は HITL 4 週合計 API 消費 $0.82 → $0.40 (51% 削減、cap $30 の 1.4% 軽減)。Slack 投稿は `app/lib/notify/slack.ts#postSlack` への橋渡し設計済み。本実装で AC-T2-1〜5 全件達成。Review 部門 5/22 統合検収待機。

---

## §1. 作成 / 更新ファイル一覧

| 区分 | パス | 行数 | 備考 |
|------|------|------|------|
| 新規 | `app/web/src/lib/hitl/templates/types.ts` | 294 | `HitlGateContext` 11 種 / `HitlNotificationTemplate` interface / `AnyHitlNotificationTemplate` (registry 用 type-erased) / placeholder 共通 helper (`escapeMrkdwn` `truncate` `nvl` `buildApprovalPath` `buildRejectPath`) / 5 種 timeout 定数 |
| 新規 | `app/web/src/lib/hitl/templates/pii-redactor.ts` | 76 | regex 8 種で email / Slack URL / API key (sk-, sk-ant-) / GitHub PAT / Bearer / op:// / credit card を `[redacted:<kind>]` に置換、`redactString` `redactPayload` (deep) `countPiiHits` を export |
| 新規 | `app/web/src/lib/hitl/templates/gate-1-tos-review.template.ts` | 89 | HITL-1 / MEDIUM / hitl ch / 24h timeout |
| 新規 | `app/web/src/lib/hitl/templates/gate-2-permission-review.template.ts` | 87 | HITL-2 / MEDIUM / hitl ch / 24h |
| 新規 | `app/web/src/lib/hitl/templates/gate-3-cost-breach.template.ts` | 92 | HITL-3 / HIGH / drill ch / 1h pause (cost 専用) |
| 新規 | `app/web/src/lib/hitl/templates/gate-4-ng3-breach.template.ts` | 87 | HITL-4 / CRITICAL / drill ch / 24h |
| 新規 | `app/web/src/lib/hitl/templates/gate-5-tos-strict.template.ts` | 70 | HITL-5 / CRITICAL / drill ch / **0ms (即拒否)** / approval link 空 |
| 新規 | `app/web/src/lib/hitl/templates/gate-6-tos-gray-review.template.ts` | 98 | HITL-6 / MEDIUM / hitl ch / 24h / confidence 0.5-0.85 gray zone |
| 新規 | `app/web/src/lib/hitl/templates/gate-7-changelog-external-api.template.ts` | 96 | HITL-7 / HIGH / drill ch / 24h |
| 新規 | `app/web/src/lib/hitl/templates/gate-8-evidence-review.template.ts` | 89 | HITL-8 / LOW (default、urgencyOverride 可) / hitl ch / 24h |
| 新規 | `app/web/src/lib/hitl/templates/gate-9-dev-kickoff-approval.template.ts` | 92 | HITL-9 / MEDIUM / hitl ch / **72h** (proposal review 余裕) |
| 新規 | `app/web/src/lib/hitl/templates/gate-10-permission-change-review.template.ts` | 93 | HITL-10 / HIGH / drill ch / 24h |
| 新規 | `app/web/src/lib/hitl/templates/gate-11-knowledge-pii-review.template.ts` | 94 | HITL-11 / MEDIUM / hitl ch / **48h** |
| 新規 | `app/web/src/lib/hitl/templates/index.ts` | 135 | 11 template 集約 export / `hitlTemplateByNumber` / `hitlTemplateByName` / legacy `HitlGateKind` ↔ v8 canonical `HitlGateName` mapping (`mapGateKindToTemplate` 等) |
| 新規 | `app/web/src/lib/hitl/templates/__tests__/templates.test.ts` | 489 | Vitest **63 ケース** (11 gate × 5 + cross-cutting 8) |
| 編集 | `app/web/src/lib/hitl/dispatcher.ts` | +27 | `dispatchNotification` を template-based に再構成、`mapGateKindToTemplate` 経由で gate 解決、`redactPayload` で PII redaction、console preview log を template metadata 込みで出力 |
| 編集 | `app/vitest.config.ts` | +3 | resolve.alias に `@: web/src` を追加 (テストが `@/types/hitl` 等を解決できるよう整備) |

合計 **15 新規 + 2 編集 = 17 ファイル / 1,981 行 (templates ディレクトリのみで) + dispatcher / vitest.config 微修正**

---

## §2. AC 達成状況 (5 件)

| AC# | 内容 | 達成 | 検証方法 |
|-----|------|------|---------|
| AC-T2-1 | HITL-9/10/11 通知文が API 呼出ゼロ | ✅ | gate9/10/11 template が `buildTitle/buildBody/buildSlackBlocks` で純粋関数、Anthropic SDK import なし |
| AC-T2-2 | 通知文が `{{placeholder}}` syntax で動的値を埋込 | ✅ | template render unit test 緑 (Test 2 / 5、各 gate ctx 値が body に出現を確認) |
| AC-T2-3 | HITL-9 推奨採否欄の injection scan は LLM 残置 | ✅ | gate-9 template にコメント明記 / scan 経路 (`lib/hitl/scan.ts`) は本 template module から import せず分離維持 |
| AC-T2-4 | 4 週合計 API 消費見積が $0.82 → $0.40 以下 | ✅ | template 経路 = $0 (LLM call ゼロ)、scan/PII LLM 補完のみ残置 ≤ $0.40、削減効果 51% (cap $30 の 1.4% 軽減) |
| AC-T2-5 | Vitest +5 ケース緑 + 既存テスト regression なし | ✅ | 新規 63 ケース全 pass (要求 +5 を **+58 で大幅超過**)、既存 templates 関連 regression ゼロ |

---

## §3. Vitest 結果 (要点)

```
 RUN  v2.1.9  C:/.../PRJ-019/app

 ✓ web/src/lib/hitl/templates/__tests__/templates.test.ts (63 tests) 14ms

 Test Files  1 passed (1)
      Tests  63 passed (63)
   Duration  691ms
```

内訳:
- HITL-1〜11 各 5 ケース = 55 ケース (タイトル prefix + truncation / body placeholder / Slack blocks / timeout+urgency+channel+approval path / contextSchema validation + XSS escape)
- Cross-cutting 8 ケース (`hitlTemplateByNumber` carrier / `hitlTemplateByName` 整合 / `mapGateKindToTemplate` legacy mapping / pii-redactor 4 ケース [string + payload + count + helper] / 11 template 全体の non-empty 確認)

既存テストへの影響:
- 全体実行時 **3 件失敗** が pre-existing (本 task 以前から存在)
  - `hash-chain.test.ts` 1 件 (assertion message mismatch、本 task 範囲外)
  - `budget-guard.test.ts` (`server-only` resolution、Phase 1 W2 別タスク)
  - `openclaw-monitor/severity.test.ts` (`undici` resolution、別領域)
- **本 task 起因の regression ゼロ** (git stash 比較で確認)

TypeScript strict 検証:
- `pnpm exec tsc --noEmit` で templates / 新規ファイル全件 0 エラー
- dispatcher.ts に残る 2 件 (`memoryFallbackEnabled` 未使用 / `row` implicit any) は **本 task 着手前から存在** (git stash 比較で確認、別タスクで修正)

---

## §4. 既存 dispatcher との統合状態

`dispatchNotification(gateKind, event, hitlRequestId)` の改修内容:

```typescript
// 改修後の主要ロジック (dispatcher.ts §340-)
const { mapGateKindToTemplate, redactPayload } = await import('@/lib/hitl/templates');
const template = mapGateKindToTemplate(gateKind);
const minimalCtx = redactPayload({
  requestId: hitlRequestId,
  actor: 'system',
  action: event,
  timestamp: new Date().toISOString(),
});
// ... console preview (本 W1 期) → 本番は postSlack(channel, message) へ橋渡し
```

連携設計:
- 既存 `HitlGateKind` (legacy 命名: `network_external` / `cost_threshold` 等) → v8 canonical `HitlGateName` (`tos_review` / `cost_breach` 等) は `HITL_GATE_KIND_TO_NAME` で 11 種完全 mapping
- 1:1 で対応しない既存 gate (network_external / secret_access / prod_deploy / unsafe_command / external_api / emergency_stop) は近接 template に割当 (詳細は `index.ts` JSDoc)
- Review 部門 5/22 検収で正式 reconciliation 予定 (legacy 命名 11 種 vs v8 canonical 11 種の最終整合)

Slack 統合:
- `app/lib/notify/slack.ts#postSlack(channel, message)` (本日 5/3 納品済) と接続するための template `buildSlackBlocks(ctx)` は header/context/actions の 3 block 構成に固定 (slack.ts の `SlackMessageSchema` 互換)
- 接続自体は T3 (Slack integration e2e) の責務、本 T2 は template 側の出力契約を確定

---

## §5. API 消費削減効果 (試算)

| 区分 | 4 週合計呼出 | 1 回 cost | 削減前 | 削減後 |
|-----|------------|----------|--------|--------|
| HITL 1〜8 通知 | 60 回 | $0.008 → $0 | $0.48 | $0 |
| HITL-9 injection scan (保持) | 5 回 | $0.04 (scan のみ) | — | $0.20 |
| HITL-11 PII LLM 補完 (保持) | 1 回 | $0.20 | — | $0.20 |
| HITL 9-11 通知 | 20 回 | $0.017 → $0 | $0.34 | $0 |
| **計** | — | — | **$0.82** | **$0.40** |

→ **削減効果 51% / $0.42/月 / cap $30 の 1.4% 軽減**

注: §0 サマリの「90% 削減」は短文 LLM 補助合計 (上限値) ベース、本実装で達成した HITL 限定削減は 51%。両値は WBS / 設計書と整合 (設計書 §7.2 注記)。

---

## §6. 想定リスクへの対応 (R-T2-1〜4)

| ID | リスク | 対策 | 実装ステータス |
|----|--------|------|---------------|
| R-T2-1 | placeholder 値に PII 含有 | `pii-redactor.ts` を template render 前段に挿入 (dispatcher で `redactPayload(minimalCtx)`)。regex 8 種で email/api_key/github_pat/Bearer/op://等を `[redacted:<kind>]` に置換 | ✅ 実装 + 4 ケース test 緑 |
| R-T2-2 | scan 経路の依存性復活 | template module は `lib/hitl/scan.ts` を import しない設計、HITL-9 template にコメントで scan 別経路維持を明記 | ✅ grep 検証で `generateMessageWithLLM` も `scan` も import 0 件 |
| R-T2-3 | context interface overshoot | 各 gate context は base + gate 固有最小限のみ、最大 11 field (HITL-10 が最多) に抑制 | ✅ 全 gate field count ≤ 11 |
| R-T2-4 | mrkdwn escape 漏れ | `escapeMrkdwn(value)` を全 placeholder 注入箇所に適用、test で `<script>alert(1)</script>` 入力時の `&lt;script&gt;` 出力を 11 gate × Test 5 で検証 | ✅ 11 gate 全 緑 |

---

## §7. 5 日前倒し完遂の判断根拠

- 設計書 (564 行) 完備により signature 合意ステップ不要
- 既存 `src/types/hitl.ts` の `HitlPayload*` 型を流用せず、template 専用 `HitlGateNContext` を独立定義 (Review 部門 reconciliation を 5/22 に集中)
- Vitest 環境 (`pnpm exec vitest run` 経路) が monorepo root から動作することを確認、test 実行 691ms / 63 ケース緑
- TypeScript strict 制約 (`verbatimModuleSyntax` / `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`) を全て満たす型構造に設計 (`AnyHitlNotificationTemplate` で contravariance を解消)

5/9 までの残り 5 日は: **(a)** Slack T3 統合 (`postSlack` 接続) の橋渡し / **(b)** dispatcher pre-existing 2 エラー (memoryFallbackEnabled / row any) の併合修正提案 / **(c)** Review 5/22 整合資料の Pre-build に充当可能。

---

## §8. 関連ドキュメント

- `projects/PRJ-019/reports/dev-w0-week2-t2-hitl-template-design.md` (詳細設計書、本 task の親仕様)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v1.md` (`app/lib/notify/slack.ts` 出典)
- `projects/PRJ-019/reports/ceo-owner-consolidated-v8.md` §2.3 §3.1 (HITL 11 gate naming canonical)
- `projects/PRJ-019/decisions.md` DEC-019-051 §施策-2 (parent decree)
- `projects/PRJ-019/app/web/src/types/hitl.ts` (legacy `HitlGateKind` 型、本実装で v8 canonical に bridge)

---

## §9. 残課題 (Owner / Review 確認事項)

1. **Legacy ↔ canonical reconciliation**: `HitlGateKind` (network_external 等 11 種) と `HitlGateName` (tos_review 等 11 種) の 1:1 整合性 — Review 部門 5/22 統合検収で確定提案
2. **Slack 接続の T3 統合**: `app/lib/notify/slack.ts#postSlack` への actual call は T3 (Slack integration e2e) で実施予定、本 T2 は template 出力契約のみ確定
3. **Phase 1 W1 期 placeholder ctx**: dispatcher の `minimalCtx` は最小限のみ (requestId/actor/action/timestamp)、各 API route が gate 別 full ctx を組み立てる必要あり (Phase 1 W2 で extension 予定)

---

## §10. フッタ

- 文書: `projects/PRJ-019/reports/dev-t2-hitl-templates-implementation.md`
- 版: v1.0 (2026-05-04)
- 起案: Dev-B (`/dev`)
- 検収: **5/22 Review 部門統合検収 (議決-23 と同日)** で AC-T2-1〜5 全件確認予定
- 200 字サマリ: T2 (5/9 期限) を 5 日前倒し完遂。HITL 11 種 Gate 通知 template (1 ファイル/gate + types/index/pii-redactor/test = 15 ファイル / 1,981 行) を `app/web/src/lib/hitl/templates/` 配下に新規実装。Vitest 63 ケース全 pass。dispatcher を template-based に再構成。$0.82 → $0.40 (51% 削減) 達成見込み。AC 5 件全て満たし、既存 regression ゼロ。Review 5/22 検収待機。
