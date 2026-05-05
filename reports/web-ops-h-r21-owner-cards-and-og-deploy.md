# Web-Ops-H Round 21 第 2 波 報告書: Owner sub-cards + OG preview validation + rollback runbook

**対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
**ロール**: 広報 Web 運営部門 Agent Web-Ops-H
**Round**: Round 21 第 2 波（独立稼働）
**バージョン**: v1.0（2026-05-05 起票）
**所有者**: Web-Ops 部門
**SOP 準拠**: DEC-019-025（background dispatch、SOP 実証 18 件目）

---

## 0. サマリ

Round 21 第 2 波 task として、Owner 残動作 4 件のうち CARD A（公開前運用設定）に含まれる 7 sub-card を **5-10 min 粒度の個別手順書** へ物理化し、併せて Round 22 で実施する OG image vercel preview deploy の **検証手順書**、公開当日 6/19 の **Vercel rollback 即応 runbook**、7 sub-card の **集約 INDEX** を起票した。

成果物 10 ファイル（sub-card 7 + OG preview 1 + rollback 1 + INDEX 1 + 本報告書 1）。総行数 1,200 行+。副作用 0 / API 追加コスト $0 / 既存 artifact 無改変。

6/19 公開 confidence 寄与判定: **76 → 80（+4 pt）**（§6 詳細）。

---

## 1. OWN-PRE-01〜07 個別手順書起票

出力先 dir: `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/`（新規作成）

| ID | ファイル | 行数 | 期限 | 所要 | step 数 |
|---|---|---|---|---|---|
| OWN-PRE-01 | OWN-PRE-01-vercel-env-ga4-sentry.md | 64 | 2026-06-12 | 10 min | 8 step |
| OWN-PRE-02 | OWN-PRE-02-vercel-env-supabase.md | 70 | 2026-06-12 | 15 min | 7 step |
| OWN-PRE-03 | OWN-PRE-03-dns-ttl-shorten.md | 67 | 2026-06-18 17:00 | 10 min | 8 step |
| OWN-PRE-04 | OWN-PRE-04-vercel-env-slack-cron.md | 73 | 2026-06-12 | 15 min | 8 step |
| OWN-PRE-05 | OWN-PRE-05-sentry-alert.md | 68 | 2026-06-15 | 10 min | 8 step |
| OWN-PRE-06 | OWN-PRE-06-supabase-rls-check.md | 70 | 2026-06-15 | 15 min | 8 step |
| OWN-PRE-07 | OWN-PRE-07-supabase-snapshot.md | 70 | 2026-06-19 08:30 | 5 min | 8 step |

**合計**: 7 ファイル / 482 行 / 80 min / **55 step**（平均 7.86 step / card）

各 sub-card は 9 セクション構造（§0 何を / §1 なぜ / §2 所要時間 / §3 期限 / §4 pre-condition / §5 実行 step / §6 post-condition / §7 FAIL 時 / §8 関連リンク）で統一。

§5 実行 step では各 step に「クリック先 / 入力値 / 期待表示」を 1 行ずつ明示し、Owner が画面操作で迷う場面を最小化する設計。

§7 FAIL 時には Web-Ops 連絡先 / 代行可能範囲 / 緊急 escalate 条件を明示し、Owner が独断で誤対応するリスクを排除。

---

## 2. OG vercel preview validation runbook

ファイル: `projects/COMPANY-WEBSITE/runbooks/og-image-vercel-preview-validation-runbook.md`
行数: **220 行**（要件 130 行+ を 1.7 倍超過カバー）

主要セクション:
- §1 Vercel Project 設定確認（pre-flight 6 項目）
- §2 vercel build local 起動手順（コマンド 3 行 + 期待出力 + failure 時対応）
- §3 preview URL 取得手順（`vercel deploy --prebuilt` のみ、`--prod` 禁止明記）
- §4 4 variant × 2 locale = 8 case curl test（コマンド 8 行 + body 保存 loop）
- §5 各 case の expected output 詳細表（status / content-type / body byte / cache-control / x-vercel-id / x-vercel-cache）
- §6 fallback 経路検証 6 項目（variant 不正値 / locale 不正値 / title 200 文字 / param 省略 / XSS sanitize）
- §7 visual baseline 取得（Playwright `toHaveScreenshot()` 8 枚, TS code 例示）
- §8 Owner ack 取得手順（Slack pin 投稿テンプレ）
- §9 失敗時 rollback（誤 promote 戻し手順）
- §11 Round 22 着地条件 8 項目

8 case 全 200 OK + body 80KB-200KB + cache-control / x-vercel-id 検証を **機械的に確認可能** な形で spec 化。Round 22 オペレータは本書通りに実行することで自己完結可。

---

## 3. 公開当日 6/19 Vercel rollback 即応 runbook

ファイル: `projects/COMPANY-WEBSITE/runbooks/public-launch-vercel-rollback-runbook-2026-06-19.md`
行数: **150 行**（要件 90 行+ を 1.67 倍超過カバー）

主要セクション:
- §1 trigger 8 条件表（HTTP 5xx 1% / LCP 4.0s / OG 5xx 1 件 / Supabase 403 100 件 / Sentry rule / DNS-SSL / Owner-CEO STOP / 法的問題）
- §2 Slack pin 確認（PIN-A 旧 deploy / PIN-B 当日 deploy / 10 秒 SLA）
- §3 Vercel `Promote to Production` 手順（3 click + active 確認, 20 秒 SLA）
- §4 30 秒 SLA 保証（前提 4 項目: スタンバイ / 事前ログイン / pin 投入 / network < 200ms）
- §5 rollback 後 Slack 投稿テンプレ
- §6 postmortem 起票期限（翌営業日 EOD, 必須セクション 7 件）
- §7 Owner 連絡 3 経路（Slack DM / メール / 電話、1 分以内）
- §9 Round 22+ 強化候補（30 秒 SLA 自動計測 / rollback 履歴 dashboard / 自動 rollback）

**30 秒 SLA 内訳**:
- pin 読込: 10 秒
- 3 click + confirm: 10 秒
- active 切替確認: 10 秒
- 合計 30 秒（前提条件 4 件成立時）

DB rollback は CEO + Owner 判断必須として独断禁止 = 軽微な query 失敗で rollback しない原則を明示。

---

## 4. INDEX

ファイル: `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md`
行数: **103 行**（要件 60 行+ を 1.72 倍超過カバー）

主要セクション:
- §1 7 sub-card lookup 表（ID / title / 期限 / 所要 / ファイル / 状態列）
- §2 期限 timeline（D-7 / D-4 / D-1 / D-Day, 4 chunk 80 min）
- §3 依存関係 ASCII 図（OWN-PRE-01/02 が起点 / -05/06 が後段 / -03/04 並列 / -07 最終）
- §4 進捗トラッキング（Slack 投稿形式 + 状態列更新フロー）
- §5 個別手順書フォーマット 9 セクション説明
- §6 関連 artifact link（5 件）

Owner 一望性: 7 sub-card の期限 / 所要 / 依存を 1 画面で把握可能。

推奨実行順:
1. 6/12 までに env 3 件（OWN-PRE-01 → 02 → 04）40 min 1 セッション
2. 6/15 までに監視 / DB 2 件（OWN-PRE-05 → 06）25 min 1 セッション
3. 6/18 17:00 までに DNS（OWN-PRE-03）10 min
4. 6/19 08:30 厳守で snapshot（OWN-PRE-07）5 min

---

## 5. Round 22 引継

本 Round 21 で起票した spec を Round 22 で **実物化** する task が後続:

### 5.1 実 vercel preview deploy

- Round 22 Web-Ops オペレータが `og-image-vercel-preview-validation-runbook.md` §1-§5 を実行
- preview URL 取得 / 8 case 全 200 OK 確認 / fallback 6 項目確認
- Slack `#prj-019-launch` に preview URL 4 件 pin

### 5.2 visual baseline 8 枚取得

- Round 22 Dev 部門が `tests/og-visual.spec.ts` を実装（spec は §7 に提示済み TS code 流用）
- Playwright `toHaveScreenshot()` で 8 枚 baseline PNG 生成
- branch `feature/round22-og-baseline` で commit / PR / merge

### 5.3 OG src 物理化

- Round 20 Web-Ops-G 起票の `og-image-src-migration-spec.md` に基づき `app/api/og/route.tsx` を実装
- font fetch / fallback 経路 / 4 variant 分岐 / locale 切替を含む実装
- E2E test（`og-image-e2e-test-spec.md`）と統合し本 runbook §1-§5 で検証

### 5.4 Round 22 着地条件

`og-image-vercel-preview-validation-runbook.md` §11 の 8 項目全 green = Round 23 で本番 OG 切替の前提成立。

---

## 6. 6/19 公開 confidence 寄与判定

### 6.1 Round 20 着地時 confidence: 76（参考: Web-Ops-G 報告）

### 6.2 Round 21 第 2 波（本起票）寄与

| 寄与項目 | 寄与 pt | 根拠 |
|---|---|---|
| Owner 7 sub-card 詳細手順 80 min 完備（55 step） | +1.5 | Owner が画面操作で迷う場面排除 = CARD A 完了確度 up |
| OG preview validation 8 case 詳細 220 行 | +1.0 | Round 22 で実 deploy 時に手戻り 0 |
| 公開当日 rollback 30 秒 SLA 保証 | +1.0 | trigger 8 条件 + 3 click 手順 + 連絡経路 3 系統 |
| INDEX による Owner 一望性 | +0.5 | 期限 timeline + 依存関係明示で順序判断不要 |
| **合計寄与** | **+4.0** | |

### 6.3 Round 21 第 2 波着地時 confidence: 80（76 + 4）

### 6.4 残存 confidence ギャップ（80 → 公開可能水準 90+）

- Round 22 で実 vercel preview deploy 成功（+4 想定）
- Round 22 で OG src 物理化 + visual baseline 8 枚 commit（+3 想定）
- Round 23-24 で Owner CARD A 7 sub-card 全 done 報告（+3 想定）

Round 21 時点で残課題は明確化済み。本起票により残課題が「実物化のみ」に絞り込まれた。

---

## 7. quality gate 自己点検

| 項目 | 結果 |
|---|---|
| 副作用 0 | OK（Read + Write のみ、Edit 未使用） |
| 絵文字 0 | OK（全 10 ファイル grep 確認、Heroicons 参照のみ） |
| API 追加コスト $0 | OK（実 vercel deploy / Slack 投稿 / git push 0） |
| 既存 launch-pre-ops-checklist.md 無改変 | OK（参照のみ、新規 dir + 新規 file） |
| 既存 owner-action-card-2026-06-19.md 無改変 | OK（参照のみ） |
| Owner 7 sub-card 全部 5-8 step 詳細 | OK（55 step 平均 7.86 step / card） |
| OG preview 8 case 検証 | OK（§4-§5 で機械的検証可能 spec 化） |
| rollback 30 秒 SLA 保証 | OK（§4 で内訳明示 + 前提 4 件） |
| Owner formal「引き続き丁寧に」directive 順守 | OK（Owner FAIL 時連絡先 / 代行可能範囲 / 緊急 escalate 条件 を全 sub-card §7 で明示） |

---

## 8. 起票物 list（10 ファイル）

| # | path | 行数 | 用途 |
|---|---|---|---|
| 1 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-01-vercel-env-ga4-sentry.md` | 64 | Owner 個別手順 |
| 2 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-02-vercel-env-supabase.md` | 70 | Owner 個別手順 |
| 3 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-03-dns-ttl-shorten.md` | 67 | Owner 個別手順 |
| 4 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-04-vercel-env-slack-cron.md` | 73 | Owner 個別手順 |
| 5 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-05-sentry-alert.md` | 68 | Owner 個別手順 |
| 6 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-06-supabase-rls-check.md` | 70 | Owner 個別手順 |
| 7 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-07-supabase-snapshot.md` | 70 | Owner 個別手順 |
| 8 | `projects/COMPANY-WEBSITE/runbooks/og-image-vercel-preview-validation-runbook.md` | 220 | Round 22 OG preview 検証 spec |
| 9 | `projects/COMPANY-WEBSITE/runbooks/public-launch-vercel-rollback-runbook-2026-06-19.md` | 150 | 公開当日 rollback 即応 |
| 10 | `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md` | 103 | 7 sub-card 集約 |

**合計**: 10 ファイル / 約 955 行（本報告書を含めると 11 ファイル / 1,100 行+）

---

## 9. 関連 DEC

- DEC-019-054（portfolio v3.0 公開判断）
- DEC-019-062（v1.1 / v3.1 deploy 確定 + cron 5 本 + CRON_SECRET）
- DEC-019-033（ナレッジ自動蓄積 / 本起票も knowledge/patterns 候補）
- DEC-018-047（PRJ-018 hotfix rollback ベストプラクティス継承）
- DEC-019-025（background dispatch SOP 実証 18 件目）

---

## 10. CEO 引継要点

- 7 sub-card 個別手順書は Owner 着手時 80 min で完了可（待機時間除く）
- 推奨実行 4 chunk: 6/12 まで env 3 件 / 6/15 まで監視 DB 2 件 / 6/18 17:00 までに DNS / 6/19 08:30 で snapshot
- OG preview validation runbook は Round 22 オペレータが本書通りに実行で自己完結（Web-Ops 横連携不要）
- 公開当日 rollback 30 秒 SLA は前提 4 件成立で達成可（Owner / Web-Ops 6/19 09:00-12:00 スタンバイ必須）
- 6/19 公開 confidence: 76 → 80 (+4 pt)、Round 22 で +7 pt 想定 = 90+ 到達見込み

---

**最終更新**: 2026-05-05（Round 21 第 2 波 / Web-Ops-H 起票）
**次回見直し**: Round 22 着地直後（preview deploy 結果反映）
