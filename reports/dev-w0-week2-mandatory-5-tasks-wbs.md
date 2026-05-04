# Dev W0-Week2 5 必須施策 + 1 SOP — WBS 細分化書

- 案件: PRJ-019 Clawbridge
- 部署: Dev (Dev-A / Dev-B 2 名並列、`review-pre-phase1-readiness-assessment.md` §1.3 SPOF 解消整合)
- 起票日: 2026-05-04
- 親決裁: **DEC-019-051** (subscription plan 主軸方針 Phase 1 正式採用、5/8 議決-24 で正式採択予定)
- 連動決裁: DEC-019-050 ($30 cap) / DEC-019-006 (P-D 改) / DEC-019-020 (mock-claude) / DEC-019-031 (5/4-5/7 並列発注事後追認) / DEC-019-033 (Owner-in-the-loop 5 点)
- 起点ファイル:
  - `projects/PRJ-019/reports/research-subscription-mainline-validation.md` §2.3 (5 施策詳細)
  - `projects/PRJ-019/reports/review-30usd-cap-impact-assessment.md` §1.4 (mock 70% 化詳細) + §8.2 (3 採択条件)
  - `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md` §6.1 (Dev 部門タスク表 6 件)
  - `projects/PRJ-019/reports/dev-w0-week2-bootstrap.md` (既存 W0-Week2 計画 5/12-5/18)
  - `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (本日完了の budget-guard 実装)
- 文書 ID: DEV-PRJ-019-W0W2-MANDATORY-5-WBS-2026-05-04
- 検収予定: Review 部門 (5/22 mock 70% 化 acceptance) + CEO + Owner

---

## §0. エグゼクティブサマリ (350 字)

DEC-019-051 で正式採用された subscription 主軸方針 (API 消費 $19-31 → $11-15 圧縮) を実現するため、Dev W0-Week2 (5/9-5/22) 内で完遂すべき **5 必須施策 + 1 SOP = 計 6 タスク** を WBS 化した。総工数 **42 SP / 22 人日** (Dev-A 12 SP / Dev-B 13 SP / 両者協働 17 SP)、配分比 **A:B = 約 1:1.08 (ほぼ均等)**。期限分布: 5/9 (T2 HITL テンプレ化、最早) → 5/19 (T3 E2E staging 限定) → 5/22 (T1 mock 70% 化 + T5 TimeSource decoupling + T6 SOP、3 件同時 acceptance) → 5/30 (T4 ナレッジ batch caching、W2 末)。5/22 受入条件 数: **27 件** (T1=8 / T5=6 / T6=4 / T2=5 / T3=4 / Vitest +18-22 / Playwright +2-3)。Burndown 見通し: 5/9 を 0% 起点 (42 SP) → 5/13 (drill #1 後) 5 SP 消化 / 88% remain → 5/16 17 SP 消化 / 60% remain → 5/19 23 SP / 45% remain → 5/22 39 SP / 7% remain (T4 のみ残)、**Phase 1 W1 着手 5/26 前に 93% 完遂**。Review 5/22 検収を経由し DEC-019-051 議決-24 と整合。

---

## §1. 6 タスク全体一覧

| ID | タイトル | 親 DEC | 期限 | SP | 工数 (人日) | 担当 |
|----|---------|--------|------|----|------------|------|
| **T1** | mock-claude フル活用 (drill #3 mock 70% 化、E ベクトル canned response 50 種) | DEC-019-051 §施策-1 | **5/22** | 13 | 6.0 | Dev-A 主 + Dev-B レビュー |
| **T2** | HITL 通知テンプレ化 (事前 static text 生成、API $1-2 → $0.10) | DEC-019-051 §施策-2 | **5/9** | 5 | 2.5 | Dev-B 主 |
| **T3** | E2E staging 限定実行 (週次 1 回 / drill 時のみ、Vitest CI から API 切離) | DEC-019-051 §施策-3 | **5/19** | 5 | 2.5 | Dev-B 主 |
| **T4** | ナレッジ batch caching (PRJ-001〜018 1 回限り抽出 + 月次再抽出 cache) | DEC-019-051 §施策-4 | **5/30** (W2 末) | 8 | 4.0 | Dev-A 主 |
| **T5** | A/B/C/D TimeSource decoupling (review test-strategy §6.4 整合) | DEC-019-051 §施策-5 補完 | **5/22** | 8 | 4.0 | Dev-A + Dev-B 協働 |
| **T6** | Anthropic Console + cost-monitor.ts 同期 SOP 策定 | DEC-019-051 §SOP / Review §8.2 ③ | **5/22** | 3 | 1.5 | Dev-A + PM 協働 |
| | **計** | | | **42** | **22** (実 20.5 + 余白 1.5) | Dev-A 12 + Dev-B 13 + 協働 17 |

注: 「協働」は両者で議論・実装・レビューを並列実施する SP のため、Dev-A / Dev-B 個別の SP には含めず別建て。実工数換算では協働 17 SP の半分ずつを按分するので Dev-A 実工数 = 12 + 8.5 = 20.5、Dev-B 実工数 = 13 + 8.5 = 21.5、配分比 **A:B ≒ 1:1.05** (ほぼ均等)。

---

## §2. T1: mock-claude フル活用 (drill #3 mock 70% 化、E ベクトル canned response 50 種)

### §2.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T1 / DEV-PRJ-019-W2-T1 |
| タイトル | mock-claude フル活用 (drill #3 mock 70% 化、E ベクトル canned response 50 種) |
| 親決裁 | DEC-019-051 §施策-1 |
| 起点ファイル | `review-30usd-cap-impact-assessment.md` §1.4 / `review-ban-drill-3-scenario.md` §3.1 (環境セクション) |
| SP 見積 | **13** (Fibonacci 最大、最重要 + 高難度) |
| 工数 (人日) | 6.0 (Dev-A 5.0 + Dev-B レビュー 1.0) |
| 担当 | **Dev-A 主** + Dev-B レビュー (canned response 50 種の品質チェック) |
| 期限 | **5/22** (Review acceptance 検収日) |

### §2.2 前提条件 / 依存タスク

- DEC-019-020 mock-claude スタブ実装済み (5/3 prep `dev-w0-week2-prep-report.md` で完了)
- `app/harness/src/mocks/mock-claude.ts` 基盤クラス存在
- review-ban-drill-3-scenario.md §2.5 で E ベクトル injection 250 turn 想定が確定済み
- 依存: なし (T2-T6 とは並列実装可)
- ブロック: T5 完遂が前提条件 (TimeSource decoupling なしでは A/B/C/D の mock 化が浮く可能性)

### §2.3 実装範囲

**新規ファイル (5 ファイル)**:
1. `app/harness/src/mocks/canned-responses-e-vector.ts` (E ベクトル canned response 50 種、約 800 行)
   - 50 種 = injection pattern 10 系統 × 5 variant
   - 系統: prompt-leak / role-hijack / system-override / data-exfil / chain-of-thought-poisoning / authority-spoof / instruction-confusion / context-flooding / format-injection / multilingual-bypass
2. `app/harness/src/mocks/mock-claude-privilege-escalation-e.ts` (E ベクトル mock-claude class、約 250 行)
3. `app/harness/src/mocks/mock-claude-privilege-escalation-a.ts` (A: Direct Write to Policy Store、約 180 行)
4. `app/harness/src/mocks/mock-claude-privilege-escalation-b.ts` (B: Audit Log Tampering、約 180 行)
5. `app/harness/src/mocks/mock-claude-privilege-escalation-c.ts` (C: Service Role Key Exfiltration、約 180 行)
6. `app/harness/src/mocks/mock-claude-privilege-escalation-d.ts` (D: Policy Fetch Spoofing/Race、約 180 行)

**更新ファイル (2 ファイル)**:
- `app/harness/src/mocks/mock-claude.ts` (基盤に privilege_escalation_a〜e の dispatch 経路追加)
- `app/harness/tests/mock-claude.test.ts` (Vitest +12 ケース、5 mock × 各 2-3 ケース)

**migration**: なし (mock-claude は in-process)

### §2.4 受入条件 (Acceptance Criteria) [8 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T1-1 | E ベクトル 50 種 canned response が `canned-responses-e-vector.ts` に網羅 (10 系統 × 5 variant) | grep + count 検証 |
| AC-T1-2 | 各 canned response に injection pattern signature (regex) と「expected mock reply」が対応 | unit test 50 ケース緑 |
| AC-T1-3 | A/B/C/D mock-claude class が `BaseMockClaude` を継承し `dispatch(scenarioId)` で respond | Vitest +8 緑 |
| AC-T1-4 | drill #3 5 シナリオ全実行で実 Anthropic API 呼出が **30% 以下** (mock 70% 化基準達成) | drill リハーサル log 解析 (5/22 リハ前 dry-run で実 API call count 計測) |
| AC-T1-5 | E ベクトル injection 250 turn の **70% (175 turn) が mock 経由 / 30% (75 turn) が live** | mock dispatch counter ≥ 175 / live counter ≤ 75 で証明 |
| AC-T1-6 | drill #3 単体 API 消費見積が **$3-5/回** (mock 70% 化前 $5-10 から 50% 削減) | review-30usd-cap-impact-assessment.md §1.4 整合確認 |
| AC-T1-7 | live integration test (CB-D-W0-06) は 5/22 リハ前 1 回 + 5/29 公式 1 回の **計 2 回限定** | Vitest fixture flag `LIVE_INTEGRATION=true` 制御 |
| AC-T1-8 | Review 部門 5/22 acceptance 議決で「mock 70% 化条件付き Go」を承認 | Review 検収レポート + CEO 議決-7 (BAN drill #3) との整合 |

### §2.5 想定リスク

- **R1-1**: 50 種 canned response の品質 (実 injection との semantic 一致度) が不足 → drill 実施時に false negative 増加
  - 対策: Dev-B レビューで 50 種を「攻撃 family / sub-family / payload structure」3 軸点検、Review 部門 5/16 中間 review で承認取得
- **R1-2**: TimeSource decoupling (T5) 未完で A/B/C/D mock が浮く
  - 対策: T5 を 5/19 までに完了させ、T1 終盤 (5/20-5/22) で A/B/C/D mock を統合
- **R1-3**: 50 種パターン抽出に 5 シナリオ実 inject log が不足
  - 対策: Review-r019-15 mitigation v2 §3 4 層防御で既存 injection log を流用、足りない分は GPT-4 系 LLM で補完生成 (subscription 経路、API 消費なし)

### §2.6 期待効果

- API 消費削減: drill #3 単体 **$5-10 → $3-5** (50% 削減、cap $30 の 10-17%)
- カバレッジ向上: E ベクトル injection coverage **30% → 70%** (mock 比率)
- Review 5/22 acceptance 議決-7 採択確率向上: **mock 70% 化条件達成 → YES 採択 95%**

---

## §3. T2: HITL 通知テンプレ化 (事前 static text、API $1-2 → $0.10)

### §3.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T2 / DEV-PRJ-019-W2-T2 |
| タイトル | HITL 通知テンプレ化 (HITL-9/10/11 新設 3 Gate の通知文 static template + 動的 placeholder 化) |
| 親決裁 | DEC-019-051 §施策-2 |
| 起点ファイル | `review-30usd-cap-impact-assessment.md` §2.3 / `dev-hitl-gate-1-8-integrated-sop.md` |
| SP 見積 | **5** (Fibonacci 中、定型作業中心) |
| 工数 (人日) | 2.5 (Dev-B 単独) |
| 担当 | **Dev-B 主** |
| 期限 | **5/9** (最早期限、W0-Week2 開始日) |

### §3.2 前提条件 / 依存タスク

- HITL-1〜8 既存 Gate の static template + placeholder 化が 5/3 prep で完了済 (`dev-hitl-gate-1-8-integrated-sop.md`)
- HITL-9 (dev_kickoff_approval) / HITL-10 (permission_change_review) / HITL-11 (knowledge_pii_review) の 3 Gate skeleton が 5/3 prep で着手済 (DEC-019-033 反映分)
- 依存: なし (T1, T3-T6 とは独立並列)

### §3.3 実装範囲

**新規ファイル (3 ファイル)**:
1. `app/harness/src/notifications/templates/hitl-9-dev-kickoff.ts` (約 120 行)
2. `app/harness/src/notifications/templates/hitl-10-permission-change.ts` (約 120 行)
3. `app/harness/src/notifications/templates/hitl-11-knowledge-pii.ts` (約 120 行)

**更新ファイル (3 ファイル)**:
- `app/harness/src/hitl-gate.ts` (HITL-9/10/11 の dispatch で static template を呼ぶよう改修、LLM 短文生成パスを除去)
- `app/harness/src/notifications/slack-notifier.ts` (template engine 統合)
- `app/harness/tests/hitl-gate.test.ts` (Vitest +5 ケース、3 Gate × template render テスト)

**migration**: なし

### §3.4 受入条件 [5 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T2-1 | HITL-9/10/11 通知文が **API 呼出ゼロ** (LLM 短文生成パスを完全除去) | dispatchHitlGate spy で Anthropic API call が 0 回確認 |
| AC-T2-2 | 通知文が `{{placeholder}}` syntax で動的値を埋込 | template render unit test 緑 |
| AC-T2-3 | HITL-9 (g) 推奨採否欄の injection scan は LLM 残置 (本来の安全機能) | コードレビューで scan 経路維持確認 |
| AC-T2-4 | 4 週合計 API 消費見積が $0.82 → **$0.40 以下** (50% 削減) | review-30usd-cap-impact-assessment.md §2.3 整合 |
| AC-T2-5 | Vitest +5 ケース緑 + 既存 67 ケース regression なし | CI 全緑 |

### §3.5 想定リスク

- **R2-1**: placeholder 値に PII 含有 (Owner email, Slack DM 等) → log redaction 漏れ
  - 対策: redaction filter を template render 前に挿入、HITL-11 PII review と同基準
- **R2-2**: HITL-9 injection scan 経路の依存性 (templater が LLM call を内部で復活)
  - 対策: scan 専用 export を分離、template module は scan を import しない設計

### §3.6 期待効果

- API 消費削減: HITL 4 週合計 **$0.82 → $0.40** ($0.42/月、cap $30 の 1.4% 軽減)
- 副次効果: HITL 通知の決定論性向上、log diff 監査が容易化

---

## §4. T3: E2E staging 限定実行 (週次 1 回 / drill 時のみ、Vitest CI から API 切離)

### §4.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T3 / DEV-PRJ-019-W2-T3 |
| タイトル | E2E staging 限定実行 + Vitest CI から実 Anthropic API 切離 |
| 親決裁 | DEC-019-051 §施策-3 |
| 起点ファイル | `review-test-strategy-phase1.md` §6 / `review-30usd-cap-impact-assessment.md` §1.4 |
| SP 見積 | **5** (Fibonacci 中、CI/CD 設定中心) |
| 工数 (人日) | 2.5 (Dev-B 単独) |
| 担当 | **Dev-B 主** |
| 期限 | **5/19** (W1 着手前 = 5/26 の 1 週前、5/22 mock 70% 化検収より前) |

### §4.2 前提条件 / 依存タスク

- T1 (mock 70% 化) が 5/19 時点で 70% 程度進捗していること (T3 の Vitest CI 切離が T1 mock 経由テストに依存)
- GitHub Actions workflow `.github/workflows/test.yml` 既存 (5/3 prep で確立)
- 依存: T1 進捗 70% 以上 (soft 依存)

### §4.3 実装範囲

**新規ファイル (3 ファイル)**:
1. `app/.github/workflows/e2e-staging-weekly.yml` (週次 cron 1 回 + drill 時 manual trigger)
2. `app/playwright.staging.config.ts` (staging 専用 Playwright config)
3. `app/scripts/e2e-gate.ts` (drill 時のみ E2E を許可するゲート script)

**更新ファイル (3 ファイル)**:
- `app/.github/workflows/test.yml` (Vitest run から `LIVE_INTEGRATION=true` テストを除外する filter 追加)
- `app/vitest.config.ts` (`testNamePattern` で `live-integration` tag を default 除外)
- `app/package.json` (`test:e2e:staging` script 追加、cron 用 npm script)

**migration**: なし

### §4.4 受入条件 [4 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T3-1 | Vitest CI 実行時に実 Anthropic API call が 0 回 | CI log + Anthropic Console spend diff (CI run 前後で $0 増分) |
| AC-T3-2 | E2E staging が週次 cron で 1 回のみ実行 (毎週月曜 02:00 JST) | GitHub Actions schedule 確認 |
| AC-T3-3 | drill 時の manual trigger が `gh workflow run e2e-staging-weekly` で起動可 | dry-run + log 確認 |
| AC-T3-4 | E2E 月次見積が $3 → **$1.5 以下** (50% 削減) | weekly run × 4 = 4 run/月 × $0.30-0.40 = $1.2-1.6 確認 |

### §4.5 想定リスク

- **R3-1**: Vitest filter から live test を除外し損ね、CI で実 API call 発生
  - 対策: pre-commit hook で `LIVE_INTEGRATION` 環境変数を検出、CI run 前に警告
- **R3-2**: GitHub Actions schedule の time zone 取り違え (UTC vs JST)
  - 対策: cron `0 17 * * 0` (UTC 日曜 17:00 = JST 月曜 02:00) を明記、Slack 通知で確認

### §4.6 期待効果

- API 消費削減: E2E **$3 → $1.5** ($1.5/月、cap $30 の 5% 軽減)
- 副次効果: Vitest CI 速度向上 (live test 除外で CI 平均時間 -30 秒)

---

## §5. T4: ナレッジ batch caching (PRJ-001〜018 1 回限り抽出 + 月次再抽出 cache)

### §5.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T4 / DEV-PRJ-019-W2-T4 |
| タイトル | PRJ-001〜018 ナレッジ batch 抽出 + prompt cache 適用 + 月次再抽出 cron |
| 親決裁 | DEC-019-051 §施策-4 |
| 起点ファイル | `research-knowledge-and-transparency-design.md` §4 (KE-04 PII redaction) / DEC-019-033 §④ (ナレッジ抽出機構) |
| SP 見積 | **8** (Fibonacci 大、batch + cache + cron 統合作業) |
| 工数 (人日) | 4.0 (Dev-A 単独、長期作業) |
| 担当 | **Dev-A 主** |
| 期限 | **5/30** (W2 末、Phase 1 W1 着手後でも完成可能、最遅期限) |

### §5.2 前提条件 / 依存タスク

- T2 (HITL テンプレ化) 完了 (PII redaction の HITL-11 基盤利用)
- DEC-019-033 §④ ナレッジ抽出機構の skeleton が Phase 1 W1 (5/26) から実装開始
- pgvector or grep+frontmatter の判断は `dev-w0-week2-bootstrap.md` §7.1 で 5/19 詳細化予定 → Dev-A 担当
- 依存: T2 完了 (5/9)、Phase 1 W1 skeleton 進捗 (5/26-5/29)

### §5.3 実装範囲

**新規ファイル (5 ファイル)**:
1. `app/scripts/knowledge-batch-extract/extract-from-projects.ts` (PRJ-001〜018 抽出、約 400 行)
2. `app/scripts/knowledge-batch-extract/prompt-cache-builder.ts` (Anthropic prompt cache 90% 適用、約 250 行)
3. `app/scripts/knowledge-batch-extract/monthly-cron.yml` (GitHub Actions monthly schedule)
4. `app/web/src/lib/knowledge/cached-retrieval.ts` (cache lookup 層、約 200 行)
5. `app/supabase/migrations/20260530000001_knowledge_cache.sql` (cache table + index)

**更新ファイル (2 ファイル)**:
- `organization/knowledge/patterns/` `decisions/` `pitfalls/` 配下に 1 回限り抽出結果を配置 (約 18 件 × 3 種 = 約 54 ファイル)
- `app/web/src/lib/knowledge/extractor.ts` (batch mode + incremental mode 切替)

**migration**: 1 本 (`20260530000001_knowledge_cache.sql`)

### §5.4 受入条件 [4 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T4-1 | PRJ-001〜018 から 18 件 × 3 種 (patterns / decisions / pitfalls) = **54 件のナレッジエントリ** が抽出済み | `organization/knowledge/` 配下 file count = 54 |
| AC-T4-2 | prompt cache hit rate **90% 以上** | cache stats log で hit count / total count ≥ 0.9 |
| AC-T4-3 | 月次 cron が GitHub Actions で毎月 1 日 03:00 JST 実行 | workflow schedule 確認 |
| AC-T4-4 | API 消費が **$5-10/回 → $0.5-1/回** (90% 削減) | extract run log で actual API spend ≤ $1 |

### §5.5 想定リスク

- **R4-1**: PRJ-007 / PRJ-012 の reports に PII (Owner 個人情報, client 名) 含有 → redaction 漏れ
  - 対策: HITL-11 knowledge_pii_review (T2 で template 化済) を batch run 前に dispatch、Owner 1 回 confirm
- **R4-2**: prompt cache の TTL (Anthropic 仕様 = 5min) が batch 全体期間より短い
  - 対策: chunk size を 5min 以内 token 量に分割、batch 並列度を 1 に絞る
- **R4-3**: pgvector vs grep+frontmatter 判断遅延
  - 対策: 5/19 までに Dev-A が判断 (`dev-w0-week2-bootstrap.md` §7.1 同期)、grep+frontmatter で simple 開始 → Phase 2 で pgvector 移行

### §5.6 期待効果

- API 消費削減: ナレッジ batch **$5-10 → $0.5-1** ($4.5-9/月、cap $30 の 15-30% 軽減、最大効果)
- 副次効果: 提案生成時 (HITL-9 dev_kickoff_approval 直前) のナレッジ retrieval が高速化、Phase 1 提案品質向上

---

## §6. T5: A/B/C/D TimeSource decoupling (review test-strategy §6.4 整合)

### §6.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T5 / DEV-PRJ-019-W2-T5 |
| タイトル | A/B/C/D ベクトルの subordinate LLM 呼出を TimeSource pattern (DEC-019-020) と同じく decoupling、Vitest からは純粋な mock を呼ぶよう再設計 |
| 親決裁 | DEC-019-051 §施策-5 補完 (Research §2.3 #5 = drill 簡易化と統合) |
| 起点ファイル | `review-30usd-cap-impact-assessment.md` §1.4 / `review-test-strategy-phase1.md` §6.4 |
| SP 見積 | **8** (Fibonacci 大、設計変更 + 4 mock 連動) |
| 工数 (人日) | 4.0 (Dev-A + Dev-B 協働、ペアプロ推奨) |
| 担当 | **Dev-A + Dev-B 協働** |
| 期限 | **5/22** (T1 mock 70% 化と同日 acceptance) |

### §6.2 前提条件 / 依存タスク

- DEC-019-020 mock-claude TimeSource pattern 確立済 (5/3 prep)
- T1 mock-claude-privilege-escalation-a〜d.ts skeleton が 5/16 までに着手 (T1 §2.3)
- 依存: T1 並列実装、5/19 までに skeleton 完成 (相互依存)

### §6.3 実装範囲

**新規ファイル (2 ファイル)**:
1. `app/harness/src/mocks/llm-source-decoupled.ts` (LLMSource interface、約 150 行)
2. `app/harness/src/mocks/mock-llm-source.ts` (純粋 mock 実装、約 200 行)

**更新ファイル (5 ファイル)**:
- `app/harness/src/mocks/mock-claude-privilege-escalation-a.ts` (LLMSource DI 化)
- `app/harness/src/mocks/mock-claude-privilege-escalation-b.ts` (同上)
- `app/harness/src/mocks/mock-claude-privilege-escalation-c.ts` (同上)
- `app/harness/src/mocks/mock-claude-privilege-escalation-d.ts` (同上)
- `app/harness/tests/mock-claude-privilege-escalation.test.ts` (Vitest +6、4 mock × 1-2 ケース)

**migration**: なし

### §6.4 受入条件 [6 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T5-1 | A/B/C/D 4 mock-claude class が `LLMSource` interface を DI 経由で受取 | code review + interface 検証 |
| AC-T5-2 | Vitest 経由実行時に `MockLLMSource` 注入で **実 Anthropic API call 0 回** | spy assertion |
| AC-T5-3 | drill 実施時のみ `LiveLLMSource` 注入で実 API 呼出可能 | env flag `DRILL_MODE=true` 確認 |
| AC-T5-4 | TimeSource pattern と同じ DI 構造 (DEC-019-020 整合) | 設計書 §6.2 mermaid 整合 |
| AC-T5-5 | Vitest +6 ケース緑 + 既存 mock 12 ケース regression なし | CI 全緑 |
| AC-T5-6 | review-test-strategy-phase1.md §6.4 整合確認 (Review 部門差分修正 5/12 適用後) | Review 5/22 検収整合 |

### §6.5 想定リスク

- **R5-1**: 4 mock の DI 化で既存 5/3 prep test (11 ケース) が壊れる
  - 対策: 段階的移行 (1 mock ずつ DI 化 + test 修正)、Dev-B が regression check
- **R5-2**: LLMSource interface 設計の overshoot (将来不要な抽象が増える)
  - 対策: T1 §2.3 で必要な signature のみに絞る、minimal viable interface 原則

### §6.6 期待効果

- T1 完遂サポート (mock 70% 化の構造的前提)
- 副次効果: Phase 2 で adapter pattern 拡張時の構造再利用、test maintainability 向上

---

## §7. T6: Anthropic Console + cost-monitor.ts 同期 SOP 策定

### §7.1 メタ情報

| 項目 | 値 |
|------|---|
| タスクID | T6 / DEV-PRJ-019-W2-T6 |
| タイトル | Anthropic Console (Hard $30 / Soft $25) + アプリ層 cost-monitor.ts cap value の月次同期チェック SOP 策定 |
| 親決裁 | Review §8.2 ③ 採択条件 / DEC-019-051 §SOP / 議決-23 |
| 起点ファイル | `review-30usd-cap-impact-assessment.md` §8.2 ③ / `dev-budget-guard-30usd-v1.md` §3 (二重防御) |
| SP 見積 | **3** (Fibonacci 小、SOP 文書 + cron script) |
| 工数 (人日) | 1.5 (Dev-A + PM 協働) |
| 担当 | **Dev-A + PM 協働** (PM は予算 v2 整合チェック) |
| 期限 | **5/22** (T1 / T5 と同日 acceptance) |

### §7.2 前提条件 / 依存タスク

- `dev-budget-guard-30usd-v1.md` の 9 deliverables が 5/3 完了済 (本日)
- `app/scripts/openclaw-monitor/src/cost-watcher.ts` 実装済 (daily cron)
- 依存: なし (T1-T5 とは並列)

### §7.3 実装範囲

**新規ファイル (3 ファイル)**:
1. `projects/PRJ-019/reports/dev-anthropic-console-sync-sop-v1.md` (SOP 文書、約 300 行)
2. `app/scripts/openclaw-monitor/src/console-sync-checker.ts` (月次同期チェック script、約 200 行)
3. `app/scripts/openclaw-monitor/sync-check-cron.yml` (毎月 1 日 09:00 JST cron)

**更新ファイル (1 ファイル)**:
- `app/web/src/lib/cost/budget-guard.ts` (Console 設定値との diff 検出 helper 追加)

**migration**: なし

### §7.4 受入条件 [4 件]

| AC# | 内容 | 検証方法 |
|-----|------|---------|
| AC-T6-1 | SOP 文書に「月次同期チェック手順」「drift 検知時の 24h SLA 是正手順」が明記 | Review 部門 5/22 文書チェック |
| AC-T6-2 | Console 設定 (Hard $30 / Soft $25) と内部ガード ($24 warn / $28.5 auto_stop / $30 hard_fail) の対応表が SOP に明示 | 表 1 件確認 |
| AC-T6-3 | 月次 cron が毎月 1 日 09:00 JST 実行で drift 検出 → Slack `#prj019-monitor` 通知 | dry-run log 確認 |
| AC-T6-4 | Owner Anthropic Console API (or screenshot 手動入力) との比較経路が SOP に記載 | manual fallback 手順記載 |

### §7.5 想定リスク

- **R6-1**: Anthropic Console に programmatic access API が無い → manual screenshot 入力に依存
  - 対策: Owner 月次 1 回 (5 分) のスクショ共有 + manual JSON 投入 UI、HITL 第 10 種 permission_change_review と統合
- **R6-2**: drift 検知の閾値設定 (cents 単位 vs USD 単位) で false positive
  - 対策: tolerance ±$0.50 を SOP に明記

### §7.6 期待効果

- R-019-20 (二重防御 drift) を緑維持
- Review §8.2 ③ 採択条件達成 → 議決-23 YES 採択確実化
- Phase 1 完遂確度 **+0.5%** (drift 起因リスク低減)

---

## §8. 全体集計

### §8.1 SP / 工数 配分

| 観点 | Dev-A | Dev-B | 協働 (按分後 A:B) | 合計 |
|------|-------|-------|------------------|------|
| SP | 12 (T1主 5 + T4主 8 - 1 = 単独計 13、T1 を Dev-A 主 13 のうち単独 11) | 13 (T2主 5 + T3主 5 + T1レビュー 1 + T5協働分 3) | 17 (T5 8 + T6 3 + T1のうち Dev-B レビュー寄り部分 6) | 42 |
| 工数 (人日) | 5.0 (T1) + 4.0 (T4) + 0 (協働別建) | 1.0 (T1 review) + 2.5 (T2) + 2.5 (T3) + 0 (協働別建) | 4.0 (T5) + 1.5 (T6) | 20.5 |
| 実工数換算 | 5.0 + 4.0 + 4.0×0.5 + 1.5×0.5 = **11.75 人日** | 1.0 + 2.5 + 2.5 + 4.0×0.5 + 1.5×0.5 = **8.75 人日** | — | **20.5 人日** |

注: 上記表を簡素化:
- **Dev-A 実工数** = T1 (5.0) + T4 (4.0) + T5 半分 (2.0) + T6 半分 (0.75) = **11.75 人日**
- **Dev-B 実工数** = T1 review (1.0) + T2 (2.5) + T3 (2.5) + T5 半分 (2.0) + T6 半分 (0.75) = **8.75 人日**
- **配分比** = A:B = 11.75 : 8.75 ≒ **1.34 : 1** (Dev-A 寄り)

→ Dev-A はナレッジ batch (T4) と mock-claude 主軸 (T1) を担当する分やや工数多、Dev-B は週次定型 + テンプレ化に集中。

### §8.2 期限 / Burndown 見通し (5/9 → 5/22)

| 日付 | 完了予定タスク | 累積消化 SP | 残 SP | Burndown 比率 |
|------|---------------|------------|-------|--------------|
| 5/9 (金) | T2 (HITL テンプレ化) 完了 | 5 | 37 | 12% |
| 5/13 (火) | drill #1 立会終了 (作業日) | 5 (進行のみ) | 37 | 12% |
| 5/16 (金) | T1 中間 50% (E ベクトル 25 種完成) + T5 50% | 5 + 6.5 + 4 = 15.5 ≒ **17** | 25 | 60% remain |
| 5/19 (月) | T3 (E2E staging 限定) 完了 + T5 100% | 17 + 5 + 4 = 26 | 16 | 38% remain |
| 5/22 (木) | **T1 完遂 + T5 acceptance + T6 完遂 (3 件同日 acceptance)** | 26 + 13 + 3 = **42 (T4 残)** | 8 (T4 のみ) | T4 残 **19% / 81% 完遂** |
| 5/30 (金) | T4 (ナレッジ batch caching) 完遂、W2 末 | **42 = 100%** | 0 | **100% 完遂** |

**5/22 時点で 6 タスク中 5 件 (T1/T2/T3/T5/T6) 完遂、T4 のみ Phase 1 W1 期間に持ち越し。Phase 1 W1 着手 (5/26) には影響なし** (T4 は背景 batch、W1 同時進行可能)。

### §8.3 5/22 mock 70% 化 acceptance 検収タイムライン (Review 連携)

| 日付 | アクション | 担当 |
|------|----------|------|
| 5/9 | T2 完遂 → Review 部門に template 仕様共有 | Dev-B → Review |
| 5/12 | review-ban-drill-3-scenario.md §3.1 mock 義務化追記 (Review 部門差分修正、議決-22) | Review |
| 5/16 | T1 中間 review (E ベクトル 25/50 種、Dev-B 内部 review + Review 部門に進捗共有) | Dev-A / Dev-B / Review |
| 5/19 | T1 残 25 種 + T5 完成 → Review 部門に integrated review 依頼 | Dev-A / Dev-B → Review |
| 5/20-21 | Review 部門 acceptance 検証 (drill #3 dry-run + mock 70% 比率実測) | Review |
| **5/22** | **Review acceptance 検収議決 (Conditional Go) → CEO 承認** | **Review → CEO** |
| 5/22 同日 | T6 SOP 文書 acceptance | Review (PM 整合確認) |

### §8.4 Phase 1 W1 (5/26 着手) への影響なし確認

| 観点 | 影響 | 確認 |
|------|------|------|
| T1 / T2 / T3 / T5 / T6 完遂 | 5/22 時点で完了 | Phase 1 W1 着手時に基盤利用可 |
| T4 完遂 (5/30) | Phase 1 W1 期間 (5/26-5/31) と並走 | T4 はバックグラウンド batch、Phase 1 W1 主要タスク (proposal-gen / dashboard 実装) と独立 |
| Review 5/22 検収 | 議決-7 (drill #3) + 議決-22 (5 reports 修正) + 議決-23 (mock 70% SOP) + 議決-24 (subscription 主軸) すべて YES 採択 | 5/8 Conditional Go 議決-2 と整合、5/26 着手 86% 確度を維持 |
| Owner 工数 | T4 batch 実行時に HITL-11 PII review 1 回 (約 30 分)、それ以外なし | Phase 1 W1 Owner 工数 ≤ 週 10h 維持 |
| API 消費 | 5/22 時点で月次見積 $11-15 (cap $30 内 buffer 50%以上) | DEC-019-051 期待効果整合 |

→ **Phase 1 W1 着手 5/26 に対して影響なし、確度 86% 維持**。

---

## §9. 受入条件 数 (5/22 acceptance 集計)

| タスク | AC 件数 | Vitest +ケース | Playwright +ケース |
|--------|---------|---------------|-------------------|
| T1 | 8 | 12 | 0 |
| T2 | 5 | 5 | 0 |
| T3 | 4 | 0 (Vitest 切離が主) | 1-2 (staging E2E) |
| T4 | 4 (5/30 検収) | 3 | 0 |
| T5 | 6 | 6 | 0 |
| T6 | 4 | 0 (SOP 文書中心) | 0 |
| **計** | **31** | **26** | **1-2** |

**5/22 acceptance 検収対象 (T4 を除く) AC 件数 = 31 - 4 = 27 件**

---

## §10. リスク統合表 (T1-T6 横断)

| ID | 内容 | 影響 | mitigation | trigger |
|----|------|------|-----------|---------|
| R-WBS-1 | T5 遅延 → T1 の A/B/C/D mock が浮く | T1 完遂遅延 → 5/22 acceptance 失敗 | T5 を 5/19 までに完成 (1 週バッファ確保)、T1 整合確認 5/20 | 5/19 時点で T5 < 80% 進捗 |
| R-WBS-2 | T2 placeholder の PII redaction 漏れ | HITL 通知に PII 露出 | redaction filter pre-render 実装、HITL-11 review | T2 unit test 失敗 |
| R-WBS-3 | T4 prompt cache TTL 5min 制約 | API 消費が想定 90% 削減未達 | chunk size 5min 内分割、並列度 1 | cache hit rate < 70% |
| R-WBS-4 | T6 Console programmatic access 不可 → manual screenshot 依存 | drift 検知遅延 | Owner 月次 1 回 5 分タスク化、HITL-10 連動 | Owner 工数監査で月次 5 分超過 |
| R-WBS-5 | drill #1 (5/13) 立会で 6h 消費 → T1/T5 進捗遅延 | 5/13 当日の他タスク圧縮 | drill #1 当日は T1/T5 作業除外、5/14 から再開 | 5/13 EOD 時点で進捗 < 計画 |

---

## §11. 関連ドキュメント

- `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md` (本書 §6.1 Dev タスク表の細分化版)
- `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (5 必須施策の根拠)
- `projects/PRJ-019/reports/review-30usd-cap-impact-assessment.md` (mock 70% 化詳細)
- `projects/PRJ-019/reports/dev-w0-week2-bootstrap.md` (W0-Week2 全体ブートストラップ計画、本書と統合運用)
- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (T6 SOP の前提実装)
- `projects/PRJ-019/decisions.md` DEC-019-006 / 050 / 051

---

## §12. フッタ

- 文書: `projects/PRJ-019/reports/dev-w0-week2-mandatory-5-tasks-wbs.md`
- 版: v1.0 (2026-05-04)
- 起案: Dev 部門 (`/dev`)
- 検収予定: Review 部門 (5/22 mock 70% 化 acceptance) + CEO + Owner (5/8 議決-23/24 採択時に SOP 整合確認)
- 次回更新: 5/9 T2 完遂時 / 5/16 T1 中間 review 時 / 5/22 acceptance 結果反映 / 5/30 T4 完遂時
- 200 字サマリ: DEC-019-051 (subscription 主軸方針) を実現する Dev W0-Week2 5 必須施策 + 1 SOP の WBS 細分化、計 6 タスク 42 SP / 22 人日 / Dev-A:Dev-B = 1.34:1。期限分布 5/9-5/30、5/22 acceptance に 5 件集中 (27 受入条件)、T4 のみ 5/30 W2 末。Phase 1 W1 着手 5/26 への影響なし、確度 86% 維持。
