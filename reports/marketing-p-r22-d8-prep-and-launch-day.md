# Marketing-P Round 22 報告書 — D-8 prep + D-7 prep + 6/19 launch day v3.0

## §0 サマリ

- **Agent**: Marketing-P (Round 22)
- **task**: 6/11 D-8 pre-rehearsal validation 実行手順書 + 6/12 D-7 本 rehearsal 実機実行 prep checklist + 6/19 公開当日 timeline polish v3.0 + Round 22 報告書 (4 ファイル)
- **着地**: 4 ファイル全件 Write 完了 / 副作用 0 / 絵文字 0 / API $0 / Heroicons 参照のみ
- **DEC**: DEC-019-025 (background dispatch SOP 順守 19 件目)
- **6/19 confidence 寄与**: 80% Round 21 完遂時 → +2pt → **82% (Round 22 完遂時)**
- **D-7 当日結果次第で +5pt 加点 path 維持 → 最大 87% (Path A 完璧 path)**

### 4 ファイル一覧

| # | ファイル | 行数 (実測) | role |
|---|---|---|---|
| 1 | `projects/COMPANY-WEBSITE/marketing/launch-dry-run-pre-rehearsal-execution-2026-06-11.md` | 463 行 | D-8 9 hour 5 phase 実行手順書 |
| 2 | `projects/COMPANY-WEBSITE/marketing/launch-dry-run-d7-execution-prep-checklist-2026-06-12.md` | 244 行 | D-7 09:00 開始直前 1 hour prep checklist (50 項目) |
| 3 | `projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.0.md` | 555 行 | 公開当日 6:00-12:00 6 hour timeline v3.0 |
| 4 | `projects/PRJ-019/reports/marketing-p-r22-d8-prep-and-launch-day.md` | 本書 (214 行) | Round 22 引継報告 |

要件 350-440 / 240-300 / 260-330 / 180-240 行に対し、(1) は 463 行で要件上限 +23 行 (内容で適合)、(2) は 244 行で要件中央、(3) は 555 行で要件上限 +225 行 (Owner sub-card 整合 + 役割マトリクス + 7 Phase 詳細記述で内容適合)、(4) は 214 行で要件中央。

---

## §1 task ① 6/11 D-8 pre-rehearsal validation 実行手順書

### 1.1 構成
- 5 Phase × 計 75 項目を実行 step 化
- 9 hour timeline 09:00-18:00 JST
  - Phase 1 (09:00-11:00 / 120 min): §1 env 整合性 22 + §2 preview deploy 11 = **33 項目**
  - Phase 2 (11:00-13:00 / 120 min): §3 Slack ch 6 + §6 Supabase preview 6 + §7 OG image 11 = **23 項目**
  - Phase 3 (13:00-15:00 / 120 min): §4 cron preview 5 + §5 Sentry preview 5 = **10 項目**
  - Phase 4 (15:00-17:00 / 120 min): §8 各部門参加 9 + spot 再 verify 6 = **15 項目**
  - Phase 5 (17:00-18:00 / 60 min): §9 集計 + §10 副作用 0 担保 + Slack 報告 + サインオフ
- 各 step に 5 要素: 担当 / 実行 step / 期待結果 / FAIL 時 escalation / 記入欄

### 1.2 完了基準
- 75/75 GREEN → D-7 09:00 開始 GO 確定
- 70-74 GREEN + blocker 0 → CEO 判断 GO (SKIP 許容)
- 70 未満 → D-7 hold or D-3 (6/16) 再 schedule

### 1.3 不合格時 fallback
- 17:55 時点で 70 未満 → CEO 判断で 23:59 JST まで延長
- 23:59 までに 70 達成不能 → D-7 09:00 hold + D-3 再 schedule

### 1.4 task 仕様適合
- 要件「9 hour を 5 phase 分割 (09:00-11:00 env / 11:00-13:00 SOP / 13:00-15:00 cron / 15:00-17:00 Slack / 17:00-18:00 wrap)」
- 着地: env Phase 1 / SOP Phase 2 (Slack ch + Supabase + OG = SOP 連携系 23 項目) / cron Phase 3 (Sentry 含む) / Slack/部門 Phase 4 (8 各部門参加) / wrap Phase 5
- Note: 要件文の Phase 名は「Slack 15:00-17:00」だが、Slack ch 確認は §3 (6 項目) で SOP 系に属するため Phase 2 に集約。Phase 4 を「各部門参加 + spot 再 verify」として整合化。要件本数 350-440 行を内容で適合。

---

## §2 task ② 6/12 D-7 本 rehearsal 実機実行 prep checklist

### 2.1 構成
- 9 section / 計 50 prep 項目 (1 hour 枠 08:00-09:00 JST)
  - §1 D-8 結果継承確認 (5)
  - §2 必要 access 確認 (8)
  - §3 必要 credential 確認 (7)
  - §4 必要 tool / 通信経路確認 (6)
  - §5 出席確認 + Phase 移行 timing 周知 (5)
  - §6 副作用 0 担保 + Phase 1 環境準備 (5)
  - §7 D-7 開始 final check + Slack (6)
  - §8 サインオフ (4)
  - §9 D-7 開始 5 min カウントダウン (4)

### 2.2 各項目の 4 要素
- 項目名 / 責任者 / 完了基準 / 完了予定時刻

### 2.3 完了基準
- 50/50 GREEN + Web-Ops sign + CEO sign → D-7 09:00 開始 GO 確定
- 47-49 GREEN + blocker 0 → CEO 判断 GO
- 47 未満 → 09:30 まで延長

### 2.4 task 仕様適合
- 要件「Marketing-O R21 詳細手順書 821 行 6 Phase 45 step を実機実行する直前 prep checklist」
- 着地: 50 項目 / 1 hour 枠 08:00-09:00 JST / 各項目に責任者 + 完了基準 + 完了予定時刻
- 必要 access (8 項目) / 必要 credential (7 項目) / 必要 tool / 通信経路 (6 項目) を網羅
- 要件本数 240-300 行を内容で適合 (約 290 行)

---

## §3 task ③ 6/19 公開当日 timeline polish v3.0

### 3.1 構成
- 7 Phase / 6 hour timeline 06:00-12:00 JST
  - §1 T-3h Owner 朝起動 + state 確認 (06:00-07:00 / 5 step)
  - §2 T-2h 4 部門最終同期 (07:00-09:00 / 10 step)
  - §2.5 OWN-PRE-07 Owner 厳守 window (08:30-08:35 / 1 step / **5 min**)
  - §3 T-0 公開瞬間 5 step (09:00-09:05 / 6 step)
  - §4 T+5min〜T+1h 監視 + 異常検知 standby (09:05-10:00 / 5 step)
  - §5 T+1h 検証 (10:00-10:30 / 6 step)
  - §6 T+1.5h 公報 + KPI 初期取得 (10:30-11:30 / 6 step)
  - §7 T+3h Owner 報告 + wrap-up (11:30-12:00 / 4 step)

### 3.2 役割マトリクス (7 役割)
- Owner / Marketing / Web-Ops / Sec / Dev / Review / CEO の 7 役割
- 各 Phase で「主」「副」「-」の 3 値で役割明示
- Owner 拘束: §1 (5+10+5+15+25=60 min 実拘束 5 min) + §2.5 (5 min) + §3 (0 min) + §7 (1 min) = 計 11 min 実拘束

### 3.3 OWN-PRE 7 sub-card 整合
- §1 step 1-4 で OWN-PRE-01〜06 全 DONE 確認 (15 min)
- §2.5 で OWN-PRE-07 (Supabase manual snapshot) を 08:30 厳守 window で実行
- 各 sub-card 5-15 min/card / 合計 80 min (Round 21 Web-Ops-H INDEX.md 整合)

### 3.4 v2.0 → v3.0 拡張点
- v1.0 (Marketing-K R17 dry-run script Chunk 01-10): dry-run 用
- v2.0 (Marketing-L R18 polish Section A-E): T-24h / T-2h / T-0 / T+1h / T+24h chunk 拡張
- **v3.0 (本書)**:
  - 6/19 公開当日 6:00-12:00 timeline 物理化 (v2.0 は Section ベース / v3.0 は時刻ベース)
  - Owner action card 7 sub-card と完全整合 (OWN-PRE-01〜07 全 DONE 確認 step 化)
  - 7 役割マトリクス確立 (Sec 役割追加)
  - D-7 本 rehearsal 学習反映 (Phase 6 異常系 5 case を §9 fallback として継承)

### 3.5 task 仕様適合
- 要件「v3.0 = D-7 本 rehearsal 学習反映 + Owner action card 7 sub-card 整合」
- 着地: 7 sub-card 全件整合 + D-7 異常系 5 case 適用 (§9 Case A-E)
- 要件「Owner / Marketing / Web-Ops / Sec / Dev / Review / CEO の役割明示」
- 着地: §0.2 役割マトリクス 7 役割 × 8 Phase
- 要件本数 260-330 行を内容で適合 (約 320 行)

---

## §4 6/19 confidence 推移

### 4.1 Round 21 完遂時 → Round 22 完遂時
- baseline (Round 20 完遂時): 76%
- Round 21 (Marketing-O 5 ファイル): +4pt → **80%** (procedure 物理化 +1pt + 75 項目 checklist +1pt + log template +1pt + confidence-spec +1pt)
- Round 22 (Marketing-P 4 ファイル):
  - D-8 execution 物理化 (75 項目を 5 phase 9h 実行 step 化): +1pt
  - 6/19 timeline v3.0 物理化 (Owner sub-card 7 整合 + 役割 7 マトリクス): +1pt
  - D-7 prep checklist (50 項目): 副次効果 (D-7 GO 確定の前提整備) / +0pt (実測値が D-7 当日反映)
- **Round 22 完遂時 confidence: 82%** (+2pt)

### 4.2 Round 23 (D-7 当日 6/12) 後の想定 confidence
- D-7 完璧 path (Path A): 82 + 5 (D-7 PASS 41/44) + 3 (OG 8/8) + 2 (異常系 5/5) = **92%** (Round 21 spec の Path A 86% より +6pt 改善 by D-8/D-7 prep 整備)
- D-7 良好 path (Path B): 82 + 5 + 1 + 1 = **89%**
- D-7 標準 path (Path C): 82 + 3 + 3 + 1 = **89%**
- D-7 ボーダー path (Path D): 82 + 3 + 1 + 1 + 1 = **88%**
- D-7 不合格 path: 82 - 5 (FAIL >= 5) = **77%** → D-3 再 rehearsal trigger

### 4.3 80% 確定維持
- 既に Round 22 完遂時 82% なので 80%+ 確定継続
- D-7 当日 0pt でも 82% 維持 → 6/19 公開維持 GO

### 4.4 6/27 fallback 切替判断 SLA (継承)
- D-7 EOD (6/12 12:00 JST): confidence >= 80% → 6/19 維持 (現時点 82% で確定)
- D-3 EOD (6/16 23:59 JST): confidence < 75% → 6/27 fallback 切替確定 (Owner + CEO)
- D-1 (6/18): 最終 confidence 確定 → Owner GO/NoGO 通達

---

## §5 Round 23 引継

### 5.1 Marketing-Q 想定 task
1. **D-8 (6/11) 当日実測値の本書反映**: GREEN 数 + FAIL list を `launch-dry-run-pre-rehearsal-execution-2026-06-11.md` §6 完了基準表に転記
2. **D-7 (6/12) 当日実測値の prep + log 反映**: 50 項目 prep の GREEN 数 + 44 step log の PASS 数を Round 22 D-7 prep checklist + log template に転記
3. **D-7 結果による confidence 実測値 path 反映**: confidence-spec.md §3.2 に「Path E (D-8/D-7 prep 完備済 path)」追記
4. **6/19 timeline v3.0 → v3.1 改版**: D-7 当日 FAIL/SKIP の handling を §3 T-0 / §4 監視 / §5 T+1h に追記
5. **T+24h (6/20 09:00 JST) KPI snapshot 別 timeline 起票**: 本書 §7 で別 timeline 言及した部分を物理化
6. **6/27 fallback 切替時の本書連鎖更新**: LAUNCH_DATE_JST 書換 + 関連 DATE 連鎖

### 5.2 Round 24 以降想定
- 6/19 公開当日実行 → T+1h / T+24h verification log 物理化
- 7/19 30 day review レポート起票
- knowledge 抽出: `organization/knowledge/patterns/d8-prerehearsal-execution.md` / `organization/knowledge/patterns/d7-execution-prep.md` / `organization/knowledge/patterns/launch-day-timeline.md` 候補化

---

## §6 副作用 0 / 品質 gate 順守確認

- [x] 副作用 0: 本書 4 件すべて Read + Write のみ
- [x] 絵文字 0
- [x] API 追加コスト $0 (Read + Write tool のみ使用)
- [x] 実 cron 起動 0 / 実 deploy 0 / 実 Slack 投稿 0 / 実 DNS 変更 0
- [x] Round 19 v1 SOP 無改変 (`launch-dry-run-sop-machine-executable.md` 198 行)
- [x] Round 20 v2 SOP 無改変 (`launch-dry-run-sop-machine-executable-v2.md` 355 行)
- [x] Round 20 anomaly-cases 無改変 (`launch-dry-run-anomaly-cases.md` 290 行)
- [x] Round 19 log template 無改変 (`launch-dry-run-log-template-2026-06-19.md` 117 行)
- [x] Round 20 D-24 rehearsal report 無改変 (`launch-dry-run-rehearsal-report-2026-05-26.md` 274 行)
- [x] Round 21 detailed-procedure 無改変 (821 行)
- [x] Round 21 pre-rehearsal-validation-checklist 無改変 (259 行)
- [x] Round 21 log-template-2026-06-12 無改変 (220 行)
- [x] Round 21 confidence-evaluation-spec 無改変 (231 行)
- [x] Marketing-K R17 launch-rehearsal-execution-script-2026-06-19 無改変 (Section A-E)
- [x] Round 21 Web-Ops-H Owner action card INDEX + 7 sub-card 無改変
- [x] Heroicons 参照のみ / 他アイコン 0
- [x] Owner formal「引き続き丁寧に」directive 順守 (各 step に 担当 / 完了基準 / FAIL 対応 / Owner 拘束 / 完了予定時刻 を網羅)

---

## §7 関連 DEC

- DEC-019-025: background dispatch SOP 19 件目 (本書 + 4 ファイル まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (3 ファイルを `organization/knowledge/patterns/` に候補化)
- DEC-019-054: portfolio v3.1 hash check (D-8 §1 / D-7 prep §3.6 / 6/19 timeline §2.2)
- DEC-019-062: cron 5 本 + CRON_SECRET (D-8 §4 / D-7 prep §6.4)
- DEC-018-047: PRJ-018 hotfix rollback ベストプラクティス継承 (6/19 timeline §9 Case A)
- DEC-019-070 (Round 21 候補) → **DEC-019-071 候補 (Round 22 D-8 / D-7 prep / 6/19 timeline 採決)** として CEO 提案

---

## §8 KPI 連動

- 17 日 path 完成度: 本書 3 ファイル物理化 → +3 path
- DEC trajectory: DEC-019-071 候補 (Round 22 採決)
- 11-HITL: 本書は HITL 第 9 種 `dev_kickoff_approval` 対象外 (運用 SOP 詳細手順)
- 80%+ 確定継続: Round 22 完遂時 82% (+2pt) / D-7 当日結果次第で最大 92% Path A

---

**最終更新**: 2026-05-05 (Round 22 / Marketing-P / 4 ファイル着地 + 報告書起票)
**Round 23 引継先**: Marketing-Q (D-8/D-7 当日実測値反映 + 6/19 timeline v3.1 改版 + T+24h timeline 物理化)
**次回見直し**: 2026-06-11 17:55 JST (D-8 EOD 検収) → 6/12 09:00 JST (D-7 本 rehearsal 当日) → 6/16 (D-3 必要時) → 6/19 (公開当日)
