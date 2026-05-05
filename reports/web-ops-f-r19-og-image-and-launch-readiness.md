# Web-Ops-F Round 19 着地レポート: OG image spec + KPI 追補 + launch readiness 集約

**起票**: Web-Ops-F（PRJ-019 Round 19 第 2 波 / 9 並列分担 ⑥）
**日付**: 2026-05-05
**所要時間**: 単発 dispatch（並列 9 のうち F 枠）
**副作用**: 0（文書のみ / production code 触れず / Marketing-L / Marketing-M / Web-Ops-E artifact 不変）

---

## 1. ミッション

Round 18 Marketing-L 申し送り（en v2.1 SEO meta が `/og/launch-2026-06-27.png` を参照、Web-Ops 制作 owner 確認 needed）への応答 + Round 19 KPI 整備 + 公開当日 artifact の集約 SoT 整備。

具体 task 3 件:
1. OG image 制作 spec / owner / 承認フロー確定
2. dashboard KPI 定義に Round 19 専用 KPI 追加
3. launch readiness consolidation（公開当日に必要な全 artifact 単一索引）

---

## 2. 着地 artifact

### 2.1 OG image production spec（新規）
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/runbooks/og-image-production-spec-2026-06-27.md`
- 行数: 約 110 行
- 主要事項:
  - 解像度 1200x630 PNG / 300KB 以下 / sRGB / safe area 1080x540
  - レイアウト 4 領域（logo top-left / headline center / tagline subline / URL bottom-right）
  - 文言確定: headline = "AI-Augmented Web Apps for SMBs — Built in Weeks"（en v2.1 `<title>` と一字一句一致）/ tagline = "19 SMB engagements · Next.js + Supabase · Lean by design"
  - 制作 owner: **Web-Ops-G を一次推奨**、不可なら外部デザイナー fallback / Owner 制作は不採用
  - 承認フロー: Web-Ops draft (D-5 6/22) → CEO sign-off (D-3 6/24) → Owner ack (D-2 6/25) → 配置 (D-1 6/26 18:00)
  - 失敗 fallback: 6/26 18:00 までに配置不能 → v1.1 既存汎用 OG で公開、v2.1 SEO meta は 7/27 30 day review で再投入

### 2.2 KPI definition update（既存ファイルに §E 追加）
- path: `C:/Users/hiron/Desktop/claude-code-company/dashboard/kpi-definition.md`
- 変更: 末尾の「関連ドキュメント」直前に **§E PRJ-019 Round 19 専用 KPI** 5 項目を追加
- 追加 KPI:
  - E-1: 17 日 path W3 完成度（目標 95%+ at 6/19 / 現在 92%）
  - E-2: heartbeat 500k SLO 適合率（目標 100% / 警告 95% 未満）
  - E-3: DEC 採択 trajectory（目標 +2〜+5 件/Round / 現在 R16-R17-R18 = 23-27-31）
  - E-4: 11-HITL gate 通過率（目標 100%）
  - E-5: OG image 配置適合率（OG debugger 3/3 pass）
- 既存 §A〜§D / 優先度サマリー / 関連ドキュメントは破壊なし（差分のみ追加）

### 2.3 launch readiness consolidation（新規）
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/runbooks/launch-readiness-consolidation-2026-06-19.md`
- 行数: 約 130 行
- 主要事項:
  - 5 大領域に artifact を分類: §1.1 リハーサル / §1.2 機械 SOP / §1.3 運用 SOP / §1.4 KPI / §1.5 公開コンテンツ
  - 全 artifact の path / 役割 / 期限を 1 ID = 1 行で索引化（MKT-L / MKT-M / OPS-E / OPS-F / KPI / CNT 6 種 prefix）
  - §2 当日タイムライン: T-15h 〜 T+24h で開く artifact を時刻別マッピング
  - §3 Owner CARD A/B/C/D vs artifact 対応表
  - §4 リスク 6 種 × fallback artifact 対応表
  - §5 既存 artifact 不変保証（Marketing-L / Marketing-M / Web-Ops-E への編集 0 を本書で明文化）
  - §7 ライフサイクル: 公開後の lock / 実績ログ化 / 30 day lessons-learned 経路（DEC-019-033）

---

## 3. 主要決定事項（本書内に閉じる）

| 決定 | 内容 | 根拠 |
|---|---|---|
| OG 制作 owner 一次案 | Web-Ops-G | spec 単純で内製完結、Round 19 想定枠 |
| OG fallback owner | 外部デザイナー（既存契約枠） | Web-Ops-G capacity 不足時の 0.5 day 想定 |
| OG headline 文言 | en v2.1 `<title>` と一字一句一致 | SEO meta 整合（Marketing-L draft 不変） |
| KPI E-2 SLO 100% | heartbeat 500k 超過 0 day | DEC-019-062 cron 5 本運用方針 |
| consolidation 編集権限 | Web-Ops 部門のみ | 既存 artifact 破壊禁止の物理的担保 |

---

## 4. CEO への申し送り

### 4.1 Round 19 第 3 波で必要な動作
- Marketing-M Round 19 で `marketing/launch-machine-sop-2026-06-19.md` 起票後、本書 §1.2 を Web-Ops が update（path 予約済み）
- 6/15 朝 Web-Ops 部門スタンドアップで Web-Ops-G capacity 確認 → OG 制作 owner 確定（spec §3 ルールに従う）

### 4.2 Owner への共有（CEO 経由でサマリー）
- OG image は Web-Ops 内で制作 owner を確定する見込み、Owner 直接制作は不採用 → Owner 残動作は CARD A/B/C/D の 4 件から増えない
- 6/25 D-2 に Owner ack 1 件（5 min, Slack「OG ack」1 言）が追加されるが既存 CARD A の枠内で吸収可能

### 4.3 未解決リスク
- Marketing-M Round 19 着地が遅延した場合、本書 §1.2 と §2 当日タイムラインの T-2h / T-0 列で空白が残る → 6/15 Web-Ops 部門で risk re-assess
- Web-Ops-G の Round 19 着任タイミングが未確定 → Round 19 第 3 波 dispatch で確認

---

## 5. 不変保証 / 副作用 0 担保

- Marketing-L 起票（en-v2.1-draft.md / launch-rehearsal-execution-script-2026-06-19.md / launch-rehearsal-2026-06-20.md）への編集 0
- Marketing-M Round 19 想定 artifact への先回り編集 0（path 予約のみ）
- Web-Ops-E 起票（launch-pre-ops-checklist.md / owner-action-card-2026-06-19.md / public-launch-sop.md / cron-fallback-switch.md / slack-alert-routing.md）への編集 0
- production website code への編集 0
- dashboard/kpi-definition.md は §E 追加 + header 1 行更新のみ（§A〜§D / 優先度サマリーは完全保存）
- 絵文字 0 / Heroicons 参照のみ（design-guidelines.md 準拠）/ API call 0 / DB 変更 0 / cron 変更 0 / DNS 変更 0

---

## 6. 関連 DEC（参照のみ、新規発議なし）

- DEC-019-033（ナレッジ自動蓄積機構）
- DEC-019-054（portfolio v3.0 公開判断）
- DEC-019-055（4 部署並列化）
- DEC-019-062（v1.1 / v3.1 deploy 確定 + cron 5 本 + CRON_SECRET）
- DEC-018-047（PRJ-018 hotfix rollback ベストプラクティス継承）

---

**最終更新**: 2026-05-05（Round 19 第 2 波 / Web-Ops-F）
**CEO 経由 Owner 報告**: Round 19 着地報告（CEO 集約）に組み込み想定
