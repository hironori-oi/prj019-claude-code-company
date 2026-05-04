# Dev W0-Week2 着手準備チェックリスト (5/4-5/8 5 日間 / 5/9 着手前完遂)

- 案件: PRJ-019 Clawbridge
- 部署: Dev (Dev-A / Dev-B 2 名並列)
- 起票日: 2026-05-04
- 親決裁: **DEC-019-051** (subscription plan 主軸 Phase 1 正式採用) / **DEC-019-050** ($30 cap)
- 起点ファイル: `dev-w0-week2-mandatory-5-tasks-wbs.md` (511 行) / `dev-budget-guard-30usd-v1.md` / `dev-1password-slack-integration-v1.md` / `ceo-owner-consolidated-v7.md` v7
- 文書 ID: DEV-PRJ-019-W0W2-KICKOFF-CHECKLIST-2026-05-04
- 着手日: **2026-05-09** (T2 HITL 通知テンプレ化が最短期限)
- 検収予定: 5/8 EOD Dev 自己検証 → 5/9 朝 着手判定

---

## §0. エグゼクティブサマリ (300 字)

5/9 着手 W0-Week2 5 必須施策 6 タスク (42 SP / 22 人日) の 5 日前 (5/4-5/8) 準備チェックリスト。**5 カテゴリ × 計 32 項目**: 環境 (8) / コード (8) / ナレッジ (5) / 依存 (4) / テスト (4) / ブランチ (3)。最重要は (a) T2 (5/9 期限) 前提の HITL 第 9/10/11 種 dispatcher skeleton 確認 + templates/ 配置場所決定、(b) Dev-A/Dev-B 1.34:1 SP 配分の合意、(c) feature/w0-week2-mandatory-5-tasks ブランチ作成 + 同時作業可能化 (lockfile / migration 競合回避)。各項目に内容 / 担当 / 期限 / 失敗時 fallback / 確認方法を記載。5/8 EOD 時点で「全 32 項目 GREEN または fallback 適用済」を達成 → 5/9 09:00 JST T2 着手判定 GO。失敗時は CEO に即時 escalate。

---

## §1. カテゴリ別チェックリスト一覧

| カテゴリ | 項目数 | 期限分布 |
|---------|-------|---------|
| §2 環境 | 8 | 5/4-5/7 (1Password/Slack 5/5、Vitest/Playwright 5/6、ENV 5/7) |
| §3 コード | 8 | 5/5-5/8 (本日納品 budget-guard 5/5 / migration 5/6 / cost-watcher 5/7) |
| §4 ナレッジ | 5 | 5/5-5/8 (SP 配分合意 5/5、AC 27 件 mapping 5/6) |
| §5 依存 | 4 | 5/6-5/8 (HITL dispatcher 確認 5/6、templates/ 配置 5/7) |
| §6 テスト | 4 | 5/7-5/8 (canned response 計画 5/7、TimeSource 波及 5/8) |
| §7 ブランチ | 3 | 5/4-5/5 (ブランチ作成 5/4、CI 連動 5/5) |
| **計** | **32** | 5/4-5/8 |

---

## §2. 環境カテゴリ (8 項目)

### §2.1 1Password CLI 動作確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| ENV-1 | `op --version` 実行 = 2.x 系確認 | Dev-A | 5/5 EOD | Owner に再 install 依頼 (`dev-1password-slack-integration-v1.md` §2 手順) | `op --version` 出力 stdout |
| ENV-2 | `op signin` 成功 + Vault `prj019` への read アクセス確認 | Dev-A | 5/5 EOD | `op://` references 解決失敗 → Owner に Vault 共有依頼 | `op item list --vault prj019` 出力件数 ≥ 1 |
| ENV-3 | `op run --env-file=.env.local -- env \| grep ANTHROPIC_API_KEY` で実値が解決 | Dev-A | 5/5 EOD | `.env.local.example` の op:// references を 1Password 同期 | grep 出力に sk-ant-* prefix |

### §2.2 Slack 3 channel 通知テスト (DEC-019-049 連動)

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| ENV-4 | `#prj019-monitor` webhook ($24 warn 用) 動作確認 = curl で test post | Dev-B | 5/5 EOD | webhook 期限切れ → Owner に再生成依頼 (`dev-1password-slack-integration-v1.md` §3) | Slack channel に test 投稿が表示される |
| ENV-5 | `#prj019-drill` webhook ($28.5 / $30 用) 動作確認 | Dev-B | 5/5 EOD | 同上 | 同上 |
| ENV-6 | `#prj019-hitl` webhook (HITL 11 種用) 動作確認 | Dev-B | 5/5 EOD | 同上 | 同上 |

### §2.3 Vitest / Playwright 動作確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| ENV-7 | `pnpm -C app vitest run web/src/lib/cost/budget-guard.test.ts` 全 13 ケース緑 | Dev-A | 5/6 EOD | 失敗テスト fix (Dev-A) または ENV `op run` 経由再実行 | Vitest stdout `13 passed` |
| ENV-8 | `pnpm -C app playwright test --list` で test discovery 成功 (Chromium install 確認) | Dev-B | 5/6 EOD | `pnpm -C app exec playwright install chromium` 再実行 | discovery 0 件以上 + browser binary 存在 |

---

## §3. コードカテゴリ (8 項目)

### §3.1 本日納品実装の動作確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| CODE-1 | `app/web/src/lib/cost/budget-guard.ts` 13 テストケース全 pass (mock 経由) | Dev-A | 5/5 EOD | テスト失敗箇所修正 / Supabase mock 注入確認 | Vitest 13/13 緑 |
| CODE-2 | `app/scripts/openclaw-monitor/src/cost-watcher.ts` を `--mode=report` で実行 = JSON 出力成功 | Dev-A | 5/5 EOD | tsx not installed → `pnpm add -D tsx` | stdout に `snapshot`/`notifications` JSON |
| CODE-3 | mock spend $24 注入 (cost_ledger に test row INSERT) → cost-watcher で `warnCrossed: true` 発火 | Dev-A | 5/7 EOD | Supabase staging 未設定 → spend override (deps.spendOverride) で代替 | snapshot.warnCrossed === true |
| CODE-4 | mock spend $28.5 注入 → `stopCrossed: true` + drill channel 通知発火 | Dev-A | 5/7 EOD | 同上 | snapshot.stopCrossed === true / drill channel POST |
| CODE-5 | mock spend $30 注入 → `hardFail: true` + `BudgetCapExceededError` throw 確認 | Dev-A | 5/7 EOD | 同上 | snapshot.hardFail === true / throw 確認 |

### §3.2 Migration apply 確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| CODE-6 | `20260503000009_cost_ledger_v2.sql` を staging Supabase に apply (dry-run) | Dev-B | 5/6 EOD | staging 未設定 → local supabase + `supabase db push --dry-run` で代替 | psql `\d cost_ledger` で 6 column 追加確認 |
| CODE-7 | `get_current_month_spend()` / `get_daily_spend(target_date)` RPC 動作確認 | Dev-B | 5/6 EOD | RPC 実行権限欠如 → SECURITY DEFINER + grant 再付与 | RPC 戻り値が numeric |

### §3.3 Import 整合確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| CODE-8 | `app/web/src/lib/` 配下の他モジュール (`@/lib/supabase/server`, `@/lib/hitl/dispatcher` 等) との import 衝突なし | Dev-B | 5/8 EOD | 衝突箇所 rename + tsconfig alias 修正 | `pnpm -C app/web tsc --noEmit` 全緑 |

---

## §4. ナレッジカテゴリ (5 項目)

### §4.1 SP 配分内訳合意 (Dev-A / Dev-B 1.34:1)

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| KNOW-1 | Dev-A 実工数 11.75 人日 = T1 (5.0) + T4 (4.0) + T5 半分 (2.0) + T6 半分 (0.75) を Dev-A が確認 | Dev-A | 5/5 EOD | 工数オーバー懸念 → CEO に SP 再配分 escalate | Dev-A から確認 ack (Slack DM) |
| KNOW-2 | Dev-B 実工数 8.75 人日 = T1 review (1.0) + T2 (2.5) + T3 (2.5) + T5 半分 (2.0) + T6 半分 (0.75) を Dev-B が確認 | Dev-B | 5/5 EOD | 同上 | Dev-B から確認 ack |
| KNOW-3 | 配分比 1.34:1 の合意 (Dev-A 寄り、ナレッジ batch + mock-claude 主軸) | Dev-A + Dev-B | 5/5 EOD | 不均衡訴え → T6 を Dev-B 主に変更検討 | 両者 Slack DM 合意 |

### §4.2 AC 27 件 mapping 確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| KNOW-4 | T1 (8) + T2 (5) + T3 (4) + T5 (6) + T6 (4) = **27 件 AC** を `dev-w0-week2-mandatory-5-tasks-wbs.md` から抽出 + `acceptance-criteria-tracker.md` に転記 | Dev-A | 5/6 EOD | 抽出漏れ → WBS §9 表との差分確認 | tracker.md に 27 行存在 |
| KNOW-5 | 各 AC に Vitest +ケース番号 / Playwright +ケース番号 / 検証手順 を mapping (Vitest 26 + Playwright 1-2 = 計 28) | Dev-A | 5/6 EOD | mapping 漏れ → WBS §9 表で再構築 | tracker.md に test name / 行番号 記載 |

---

## §5. 依存カテゴリ (4 項目) — T2 (5/9 期限) 前提条件

### §5.1 HITL gate 11 種 dispatcher 現状確認

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| DEP-1 | `app/web/src/lib/hitl/dispatcher.ts` (or `app/harness/src/hitl-gate.ts`) に HITL 第 1〜8 種の dispatch 経路存在確認 | Dev-B | 5/6 EOD | 不在の場合 5/3 prep `dev-hitl-gate-1-8-integrated-sop.md` から restore | grep `'public_release'` `'paid_api_call'` etc 8 種 |
| DEP-2 | HITL 第 9/10/11 種 (dev_kickoff_approval / permission_change_review / knowledge_pii_review) skeleton 存在 (5/3 prep で着手済) | Dev-B | 5/6 EOD | skeleton 未着手 → T2 開始日に同時実装 (T2 SP +2 増額検討) | grep `'dev_kickoff_approval'` 等 |

### §5.2 templates/ 配置場所決定

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| DEP-3 | T2 templates 配置 = `app/web/src/lib/hitl/templates/` (Next.js `src/` 配下) で確定、tsconfig alias `@/lib/hitl/templates/*` 動作 | Dev-B | 5/7 EOD | path 競合 → `app/harness/src/notifications/templates/` (WBS §3.3 記載) で代替 | tsconfig alias resolve 確認 |
| DEP-4 | gate-N.template.ts 形式 11 ファイル の命名規則 + export 関数 signature `renderGateN(ctx: GateNContext): SlackMessage` を Dev-A/Dev-B 合意 | Dev-A + Dev-B | 5/8 EOD | signature 不一致 → 5/9 朝に再合意 (T2 着手 1 時間遅延受容) | 設計 doc 記載 (本書 §5 参照) |

---

## §6. テストカテゴリ (4 項目)

### §6.1 mock-claude E ベクトル canned response 50 種 計画

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| TEST-1 | E ベクトル injection pattern 10 系統 (prompt-leak / role-hijack / system-override / data-exfil / chain-of-thought-poisoning / authority-spoof / instruction-confusion / context-flooding / format-injection / multilingual-bypass) 確定 | Dev-A | 5/7 EOD | 系統不足 → Review 部門 r019-15 mitigation v2 §3 から補完抽出 | 10 系統リスト doc 化 |
| TEST-2 | 各系統 5 variant の payload 例を 5/9 着手前に 2-3 件先行作成 (5/9 以降の T1 立上げ高速化) | Dev-A | 5/8 EOD | 既存 injection log 不足 → GPT-4 (subscription 経由) で補完生成、API 消費なし | 各系統に 2-3 件 example payload |

### §6.2 TimeSource pattern decoupling の他テスト波及

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| TEST-3 | T5 で導入する `LLMSource` interface DI が既存 mock-claude 11 ケーステスト (5/3 prep) を破壊しないか事前確認 | Dev-B | 5/8 EOD | 破壊検出 → T5 §6.5 R5-1 対策 (段階的移行) を WBS に明示反映 | grep `mock-claude.test.ts` の現状 11 ケース緑 |
| TEST-4 | TimeSource pattern (DEC-019-020) と LLMSource pattern を併用する場合の DI 引数順序 (TimeSource → LLMSource) 合意 | Dev-A + Dev-B | 5/8 EOD | 順序不合意 → 5/9 着手日に再合意 (T5 開始 1 日遅延受容) | 設計 doc 記載 |

---

## §7. ブランチカテゴリ (3 項目)

### §7.1 feature/w0-week2-mandatory-5-tasks ブランチ作成

| 項目 | 内容 | 担当 | 期限 | 失敗時 fallback | 確認方法 |
|------|------|------|------|-----------------|---------|
| GIT-1 | `git checkout -b feature/w0-week2-mandatory-5-tasks` を main から作成 + push | Dev-A | 5/4 EOD | conflict 時 `git fetch origin && git rebase origin/main` | `git branch -a` に表示 + remote 同期 |
| GIT-2 | Dev-A / Dev-B 同時作業可能化: pnpm-lock.yaml 競合回避ルール (個別 PR で stage、毎日 EOD rebase) を CONTRIBUTING.md に明記 | Dev-A | 5/5 EOD | CONTRIBUTING.md 不在 → branch 内 NOTES.md で代替 | doc 確認 |
| GIT-3 | CI workflow (`.github/workflows/test.yml`) が feature/* branch で発火することを test commit で確認 | Dev-B | 5/5 EOD | CI 未発火 → workflow trigger に `branches: [main, 'feature/**']` 追加 | GitHub Actions run 表示 |

---

## §8. 5/8 EOD ゲート判定基準

5/8 18:00 JST 時点で:

| 判定 | 条件 | アクション |
|------|------|----------|
| **GO** | 32 項目すべて GREEN (or fallback 適用済) | 5/9 09:00 JST T2 着手 (Dev-B 主) |
| **CONDITIONAL GO** | 環境/コード GREEN + ナレッジ/依存/テスト/ブランチ 中 1-3 項目 YELLOW (リカバリ手順明確) | 5/9 朝 1h 集中対応 → T2 着手 11:00 JST |
| **NO-GO** | 環境 or コード 中 1 項目以上 RED (1Password / Slack / migration 等致命) | CEO に即時 escalate / T2 着手日を 5/12 月曜に再調整 (DEC-019-051 SP 配分緊急再見直し) |

---

## §9. 失敗時 escalation パス

| レベル | 条件 | escalate 先 | 期限 |
|--------|------|-----------|------|
| L1 | 個別項目 RED | Dev リード自己解決 (1h) | 即時 |
| L2 | 同カテゴリ 2 項目以上 RED | Dev-A / Dev-B 相互ヘルプ (4h) | 5/8 EOD |
| L3 | 5/8 EOD 時点 NO-GO 判定 | CEO に escalate | 5/8 18:30 JST |
| L4 | 5/9 朝 着手不可 | CEO + Owner DM (HITL 第 9 種は使わず Slack DM 直接) | 5/9 09:30 JST |

---

## §10. 関連ドキュメント

- `projects/PRJ-019/reports/dev-w0-week2-mandatory-5-tasks-wbs.md` (511 行 / 親 WBS)
- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (本日納品 budget-guard 実装)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v1.md` (1Password CLI / Slack webhook 手順)
- `projects/PRJ-019/reports/dev-w0-week2-bootstrap.md` (W0-Week2 bootstrap 計画書)
- `projects/PRJ-019/reports/dev-hitl-gate-1-8-integrated-sop.md` (HITL 1-8 種統合 SOP)
- `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md` v7 (4 部署成果統合 + DEC-019-051 起票)
- `projects/PRJ-019/decisions.md` DEC-019-050 / DEC-019-051

---

## §11. フッタ

- 文書: `projects/PRJ-019/reports/dev-w0-week2-kickoff-checklist.md`
- 版: v1.0 (2026-05-04)
- 起案: Dev 部門 (`/dev`)
- 検収予定: 5/8 EOD Dev 自己検証 (32 項目チェック) → 5/9 朝 着手判定 (CEO 確認)
- 次回更新: 5/8 EOD 各項目チェック結果 (GREEN/YELLOW/RED) 反映 / 5/9 朝 GO 判定スタンプ
- 200 字サマリ: 5/9 着手 W0-Week2 5 必須施策 6 タスクの 5 日前準備チェックリスト計 32 項目。環境 8 / コード 8 / ナレッジ 5 / 依存 4 / テスト 4 / ブランチ 3。5/8 EOD ゲート判定で GO/CONDITIONAL GO/NO-GO の 3 段階、失敗時 escalation L1-L4 明確化。最重要は T2 (5/9 期限) 前提の HITL 9/10/11 種 dispatcher skeleton + templates/ 配置確定 + 1Password CLI / Slack 3 channel 動作確認。
