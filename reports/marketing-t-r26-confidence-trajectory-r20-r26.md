# Marketing-T R26 / 6/19 confidence trajectory R20-R26 + 92→94% 寄与計画

## 0. 概要

- **対象**: PRJ-019 / 6/19 公開当日 confidence trajectory 設計 (Round 20 → Round 26 全 7 round 統合視覚化 + Round 26 92→94% 寄与計画)
- **本書 role**: Marketing-S R25 `marketing-s-r25-confidence-trajectory.md` (R18-R28 trajectory 設計 / 不変保持) を **R20-R26 7 round 詳細視覚化 + R26 4 task 寄与計画** に拡張
- **派生元**:
  - Round 25 Marketing-S `marketing-s-r25-confidence-trajectory.md` (R18→R31+ trajectory 設計 / 不変保持)
  - Round 24 Marketing-R `marketing-r-r24-summary.md` (88→90% 寄与計画 / 不変保持)
  - Round 23 Marketing-Q 88% baseline 設計 / 不変保持
  - Round 26 Marketing-T 4 task (D-8 execution-ready / D-7 execution-ready / 本書 / R26 summary)
- **本書出力時期**: Round 26 / 2026-05-05 / 6/19 公開 45 日前
- **副作用**: 0 (本書は文書のみ / API $0 / 絵文字 0 / Heroicons のみ)
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-068

## 0.1 confidence baseline 履歴 (R18 → R26)

| Round | confidence | Δ | 主要寄与 |
|---|---|---|---|
| R18 | 75% | baseline | Marketing-L polish + 4 path 暗記 |
| R19 | 78% | +3pt | rehearsal 1st execution |
| R20 | 80% | +2pt | SOP machine executable v1 |
| R21 | 82% | +2pt | SOP v2 + Owner action card 7 sub-card |
| R22 | 85% | +3pt | 6/19 timeline v3.0 + D-8/D-7 prep |
| R23 | 88% | +3pt | OWN-AUTO PoC 4 script + v3.1-delta + Owner 拘束 11→5-7 min |
| R24 | 90% | +2pt | v3.2-delta-candidate + D-7 real + contingency v2 + Owner 拘束 5-7→4-6 min |
| R25 | 92% | +2pt | D-8 real execution + v3.2 正式版 + R25 confidence trajectory + R25 summary |
| R26 | **94% (target)** | **+2pt** | D-8 execution-ready + D-7 execution-ready (Owner 1 min 内 spec) + 本書 + R26 summary |

---

## §1 Round 26 task 別寄与計画 (合計 +2pt / 92 → 94%)

### task ① D-8 実機実行 readiness 完成版 (+1pt 寄与)

| 寄与要素 | pt 重み | 根拠 |
|---|---|---|
| 75 項目 5 phase → 実機実行 sequence cmd レベル化 | 0.4 | R25 simulated → R26 実機 ready 昇格 / 9 hour timeline 全段階で cmd run sequence 1:1 紐付 |
| 2 意図 FAIL 復旧経路 cmd レベル化 (SOP-7 5 min / 4.11 8 min) | 0.3 | R25 文書記述 → R26 cmd レベル復旧手順 + SLA 確定 |
| 想定 anomaly 3 pattern 観測 cmd + threshold + escalation cmd レベル化 | 0.15 | R25 観測経路 → R26 cmd レベル化 |
| escalation matrix 14 行 cmd レベル化 (連絡 cmd + 電話 1 次連絡先) | 0.1 | R25 matrix → R26 cmd 紐付 |
| 9 hour timeline panic-free 完遂 spec 化 + buffer 109 min 担保 | 0.05 | Phase 累積 buffer 明示 |
| **合計** | **+1.0pt** | 92 → 93% |

### task ② D-7 実機実行 readiness 完成版 + Owner 1 min 内 spec (+0.5pt 寄与)

| 寄与要素 | pt 重み | 根拠 |
|---|---|---|
| 50 項目 9 section → 実機実行 sequence cmd レベル化 | 0.2 | R24 simulated → R26 実機 ready 昇格 / 60 min timeline cmd run sequence 1:1 紐付 |
| **Owner 拘束 0-1 min 内 spec 化** (通常 0 / 有事最大 1 min) | 0.15 | D-Day 4-6 min とは別軸 / D-7 当日の Owner 拘束 上限 1 min 確定 |
| 1 意図 FAIL 復旧経路 (§3.3 GA_TOKEN refresh 5 min) cmd レベル化 | 0.05 | R24 復旧経路 → R26 cmd レベル化 |
| 想定 anomaly 3 pattern + escalation matrix 9 行 cmd レベル化 | 0.05 | R24 matrix → R26 cmd レベル化 |
| 60 min timeline panic-free 完遂 spec + 5 部門全員出席確認 | 0.05 | §10.3 panic-free 完遂条件 5 件確立 |
| **合計** | **+0.5pt** | 93 → 93.5% |

### task ③ 本書 confidence trajectory R20-R26 (+0.4pt 寄与)

| 寄与要素 | pt 重み | 根拠 |
|---|---|---|
| R20-R26 7 round 詳細視覚化 (R25 trajectory R18→R31+ から拡大) | 0.15 | 7 round の Δ 軸別比較 + 寄与 4 軸構造 適用検証 |
| Round 26 4 task 寄与計画 documented (本 §1) | 0.05 | 4 task × pt 重み 1:1 mapping |
| Marketing-T R26 9 hour timeline panic-free spec 寄与経路明示 | 0.1 | task ①② 寄与 pt の根拠 |
| Owner 拘束 spec 進化 trajectory (R22 11 min → R23 5-7 → R24 4-6 → R26 D-7 0-1 min spec) | 0.05 | Owner 拘束 5 round 圧縮 trajectory 視覚化 |
| R27-R28+ trajectory 維持 + asymptotic curve 維持 | 0.05 | R25 baseline 維持 / 改変 0 |
| **合計** | **+0.4pt** | 93.5 → 93.9% |

### task ④ Round 26 Marketing 総括 + R27 引継 (+0.1pt 寄与)

| 寄与要素 | pt 重み | 根拠 |
|---|---|---|
| Round 26 Marketing-T 4 task 完遂報告 | 0.05 | 4 task 完遂 documented |
| Round 25 → 26 Δ 軸別比較 | 0.03 | 9 軸 Δ 比較表 |
| Round 27 Marketing-U 引継 3 項目 | 0.02 | D-3 / D-1 real execution + v3.2 lock final review |
| **合計** | **+0.1pt** | 93.9 → 94% |

### Round 26 完遂時 confidence: **94%** (92 + 1 + 0.5 + 0.4 + 0.1)

注: Round 26 4 task 合計 +2pt / R25 baseline 92% から +2pt → 94%

---

## §2 R20-R26 confidence trajectory 詳細視覚化 (7 round)

### §2.1 R20-R26 寄与 4 軸構造 適用検証表

| Round | 軸 A 計画文書化 | 軸 B real execution simulation | 軸 C contingency / risk | 軸 D trajectory / summary | 合計 |
|---|---|---|---|---|---|
| R20 | SOP machine executable v1 (+1pt) | rehearsal 1st execution (+1pt) | (R20 では C 軸未適用) | R20 summary (0pt 統合) | +2pt |
| R21 | SOP v2 + Owner action card 7 sub-card (+1.5pt) | detailed-procedure 44 step (+0.5pt) | (R21 では C 軸未適用) | R21 summary (0pt 統合) | +2pt |
| R22 | 6/19 timeline v3.0 (+1.5pt) | D-8 execution + D-7 prep (+1.5pt) | §9 Case A-E baseline | R22 summary (0pt 統合) | +3pt |
| R23 | v3.1-delta + Owner 拘束 5-7 min (+1pt) | D-8 simulation 75 項目 (+0.7pt) | T+24h timeline (+0.5pt) | R23 summary (+0.8pt) | +3pt |
| R24 | v3.2-delta-candidate + Owner 拘束 4-6 min (+0.5pt) | D-7 real execution 50 項目 (+1pt) | contingency v2 4x5=20 cell (+0.5pt) | R24 summary (0pt 統合) | +2pt |
| R25 | v3.2 正式版 統合完全版 (+0.5pt) | D-8 real execution 75 項目 (+1pt) | (R25 では C 軸未適用) | R25 confidence trajectory (+0.5pt) + R25 summary (0pt 統合) | +2pt |
| R26 (本 Round) | D-7 execution-ready + Owner 1 min 内 spec (+0.5pt) | D-8 execution-ready 9 hour cmd レベル (+1pt) | (R26 では C 軸未適用 / R28 contingency v4 想定) | 本書 R20-R26 trajectory (+0.4pt) + R26 summary (+0.1pt) | +2pt |

### §2.2 軸 A 計画文書化 trajectory (R20 → R26)

| Round | 計画文書 | Δ |
|---|---|---|
| R20 | SOP machine executable v1 | baseline (machine executable 化) |
| R21 | SOP v2 + Owner action card 7 sub-card | +sub-card 7 件展開 |
| R22 | 6/19 timeline v3.0 (555 行 baseline) | +6h timeline 7 phase |
| R23 | v3.1-delta (260 行 / Owner 拘束 11→5-7 min) | +OWN-AUTO PoC 4 script 想定反映 |
| R24 | v3.2-delta-candidate (314 行 / Owner 拘束 5-7→4-6 min) | +OWN-AUTO PoC 4 script PRODUCTION-READY 反映 |
| R25 | v3.2 正式版 (約 360 行 統合完全版 / Owner 拘束 4-6 min 確定) | +3 文書統合完全版 |
| R26 | D-7 execution-ready + Owner 1 min 内 spec | +D-7 当日 Owner 拘束 spec 確定 |

### §2.3 軸 B real execution simulation trajectory (R20 → R26)

| Round | real execution simulation 文書 | 規模 |
|---|---|---|
| R20 | rehearsal 1st execution | (D-X 形式以前) |
| R21 | detailed-procedure 44 step | 44 step (D-7 当日 Phase 1-6 想定) |
| R22 | D-8 execution + D-7 prep | D-8 (R22 baseline) + D-7 prep (50 項目 9 section) |
| R23 | D-8 simulation 75 項目 5 phase | 75 項目 5 phase (R22 → R23 拡張 / Marketing-Q simulation) |
| R24 | D-7 real execution 50 項目 9 section (60 min) | 50 項目 (R22 prep → R24 real execution / Marketing-R) |
| R25 | D-8 real execution 75 項目 5 phase (9 hour) | 75 項目 (R23 simulation → R25 real execution / Marketing-S) |
| R26 (本 Round) | D-8 execution-ready (9 hour cmd) + D-7 execution-ready (60 min cmd) | 75 + 50 項目 cmd レベル / 実機実行 ready |

### §2.4 軸 C contingency / risk trajectory (R22 → R26+)

| Round | contingency 文書 | 規模 |
|---|---|---|
| R22 | §9 Case A-E baseline | 5 case |
| R24 | contingency v2 (Phase × Case 4x5 = 20 cell) | 20 cell |
| R26 (R28 で v3 想定) | (R26 適用なし / R28 v4 公開後 risk 拡張想定) | (未適用) |
| R28 想定 | contingency v4 (公開後 1 week T+1w 拡張) | 25 cell+ |

### §2.5 軸 D trajectory / summary trajectory (R20 → R26)

| Round | trajectory / summary 文書 | 役割 |
|---|---|---|
| R20-R22 | summary 単体 (寄与は task 別に分散統合) | summary 役割のみ |
| R23 | summary + 88% baseline 設計 (寄与 +0.8pt) | trajectory 萌芽 |
| R24 | summary 単体 (寄与統合) | summary 役割のみ |
| R25 | confidence trajectory (R18→R31+ 漸近曲線設計 / 専用文書 / +0.5pt) | trajectory 専用化 |
| R26 (本書) | R20-R26 詳細視覚化 + R26 4 task 寄与計画 (+0.4pt) | trajectory 拡張 |

---

## §3 Owner 拘束 spec 進化 trajectory (R22 → R26)

### §3.1 D-Day Owner 拘束 trajectory

| Round | D-Day Owner 拘束 | 内訳 | Δ |
|---|---|---|---|
| R22 v3.0 | 11 min | step 1-1 1 min + step 1-4 5 min + step 2.5-1 5 min + step 7-1 0 min | baseline |
| R23 v3.1-delta | 5-7 min | step 1-4 5 min → 5 min (script-1/2 反映) + step 2.5-1 30 sec | -4 〜 -6 min |
| R24 v3.2-delta-candidate | 4-6 min | step 1-4 5 → 0.5 min + step 2.5-1 30 sec → 15 sec + step 3-1 0 sec | -1 min |
| R25 v3.2 正式版 | 4-6 min 確定 | (R24 圧縮を 統合完全版で確定) | 0 (確定) |
| R26 D-Day spec 維持 | 4-6 min 維持 | (R26 では D-Day 改変 0 / D-7 spec 確定が R26 寄与) | 0 (維持) |

### §3.2 D-7 Owner 拘束 trajectory (R26 で初めて spec 化)

| Round | D-7 Owner 拘束 | spec 化状態 |
|---|---|---|
| R22 D-7 prep checklist | spec なし (Owner 拘束 0 想定) | 規定なし |
| R24 D-7 real execution simulated | spec なし | 規定なし |
| R26 D-7 execution-ready (本 Round) | **0-1 min 内 spec 確定** (通常 0 / 有事最大 1 min) | **R26 で初 spec 化** |

### §3.3 D-8 Owner 拘束 trajectory

| Round | D-8 Owner 拘束 | spec 化状態 |
|---|---|---|
| R22 D-8 execution | spec なし (Owner 拘束 0 想定) | 規定なし |
| R23 D-8 simulation 75 項目 | spec なし | 規定なし |
| R25 D-8 real execution simulated | spec なし | 規定なし |
| R26 D-8 execution-ready (本 Round) | 0 min (D-8 では Owner 拘束 0 / D-Day と D-7 のみ Owner 拘束 spec) | 0 spec |

---

## §4 R20-R26 confidence trajectory 視覚化 (詳細展開)

```
confidence (%)
 95 ┤
 94 ┤                                  ──── R26 94% (本 Round 完遂時)
 93 ┤                             ─────
 92 ┤                        ──── R25 92%
 91 ┤                   ─────
 90 ┤              ──── R24 90%
 89 ┤         ─────
 88 ┤    ──── R23 88%
 87 ┤
 86 ┤
 85 ┤──── R22 85%
 84 ┤
 83 ┤
 82 ┤──── R21 82%
 81 ┤
 80 ┤──── R20 80%
    └────┬────┬────┬────┬────┬────┬────┬────
       R20  R21  R22  R23  R24  R25  R26
```

### 寄与傾向分析 (R20-R26)

- **R20-R22 (linear growth +2-3pt/round)**: foundation phase / baseline 構築 (SOP / Owner action card / 6/19 timeline v3.0)
- **R23-R26 (linear growth +2pt/round)**: optimization phase / OWN-AUTO PoC + v3.x 統合 + Owner 拘束圧縮 + D-X execution-ready 化
- R20 80% → R26 94% = **+14pt / 7 round / 平均 +2pt/round**

---

## §5 R27-R31+ trajectory 維持 (R25 baseline 不変)

R25 Marketing-S `marketing-s-r25-confidence-trajectory.md` で設計された R27-R31+ trajectory を **不変維持** (本書では改変 0):

| Round | confidence | 主要寄与想定 |
|---|---|---|
| R27 (Marketing-U) | 96% | D-3 + D-1 real execution + v3.2 lock final review |
| R28 (Marketing-V) | 98% | D-Day real execution + T+24h + 公開後 1 week + 公開完遂報告 |
| R29 | 99% | KPI 2 week 全件 baseline 上回り + Sentry 5xx < 100/2 week |
| R30 | 99.5% | KPI 1 month 全件 baseline 上回り + 6/27 fallback 不発 |
| R31+ | 100% (asymptotic) | KPI 3 month 全件 baseline 上回り + 公開後 monthly KPI report 自動化 |

注: 100% は理論的上限 / 99.5% が pragmatic ceiling (R25 baseline と一致 / 不変)

---

## §6 R26 → R27 引継 trajectory baseline

### Round 27 Marketing-U 想定 task 構成 (96% target / +2pt) (R25 baseline 維持)

| task | 想定内容 | 寄与 pt |
|---|---|---|
| ① D-3 real execution record (6/16 当日想定) | OWN-AUTO PoC 4 script trial + push notif dry-run + Slack thread auto-confirm dry-run + CEO online presence auto-reply dry-run | +0.8pt |
| ② D-1 real execution record (6/18 当日想定) | 17:00 JST CEO + Owner 共同 sign 経路 + v3.2 lock 確定 trial + 24h 連続稼働確認 final | +0.8pt |
| ③ launch day 正式版 v3.2 lock final review | D-1 sign 後の v3.2 正式版 final lock 確認 + sign 不在時の v3.1 経路 fallback 確認 | +0.3pt |
| ④ Round 27 Marketing 総括 + R28 引継 | confidence 94→96% + R28 経路引継 | +0.1pt |
| **合計** | | **+2pt → 96%** |

### Round 27 Marketing-U 引継 3 項目 (本 Round 26 で確定)

1. **R26 D-8 execution-ready (75 項目 cmd) + D-7 execution-ready (50 項目 cmd) 2 文書 baseline 継承**
   - R27 Marketing-U は R26 の cmd レベル化を維持しつつ D-3 + D-1 を新規追加
2. **Owner 拘束 spec 軸維持 (D-Day 4-6 min / D-7 0-1 min / D-8 0 min / D-3 + D-1 spec 化候補)**
   - R27 Marketing-U で D-3 + D-1 Owner 拘束 spec 化 (D-1 17:00 JST CEO + Owner 共同 sign 経路の Owner 1 行 reply 1 min 想定)
3. **launch day v3.2 正式版 final lock 確認 + v3.3-future 候補検討先送り**
   - R27 で v3.2 final lock / v3.3-future は R28 以降検討 (R26 での v3.3 candidate は本 Round で評価済 = 不要判定)

---

## §7 confidence 寄与 4 軸構造 R26 適用検証

### §7.1 軸 A 計画文書化 (R26 / +0.5pt)

- D-7 execution-ready + Owner 1 min 内 spec 化 (本 Round task ②)
- v3.2 正式版は R25 で完遂 / R26 では追加計画文書 0 (D-7 spec 化のみ)

### §7.2 軸 B real execution simulation (R26 / +1pt)

- D-8 execution-ready 9 hour cmd レベル (本 Round task ①)
- 75 項目を実機実行 sequence cmd run by cmd レベル化

### §7.3 軸 C contingency / risk (R26 / 適用なし)

- R26 では C 軸 未適用 (R28 contingency v4 想定 / 公開後 1 week T+1w 拡張)
- R26 寄与 0pt

### §7.4 軸 D trajectory / summary (R26 / +0.5pt)

- 本書 R20-R26 trajectory (+0.4pt)
- R26 summary (+0.1pt)

### §7.5 R26 4 軸構造 合計 +2pt 検証

- 軸 A +0.5pt + 軸 B +1pt + 軸 C 0pt + 軸 D +0.5pt = +2pt → 94% target 整合

---

## §8 confidence 圧縮限界 + 残 risk (R25 baseline 維持)

R25 Marketing-S `marketing-s-r25-confidence-trajectory.md` §5 で設計された残 risk pattern 4 件 を **不変維持**:

| 残 risk pattern | 確率 | 影響 | 圧縮可能性 |
|---|---|---|---|
| ① 第三者 DDoS | 0.3% / launch | -2pt | Cloudflare DDoS protection (R29+) |
| ② Vercel infra outage | 0.2% / month | -1pt | multi-region failover (R30+) |
| ③ Supabase outage | 0.15% / month | -0.5pt | DB cache + readonly fallback (R30+) |
| ④ DNS resolver 全 3 解決系同時 outage | 0.05% / launch | -0.3pt | DNS provider redundancy (R31+) |

100% pragmatic ceiling = 99.5% (R30+ 達成想定 / R25 baseline と一致)

---

## §9 launch day v3.3 candidate 評価 (R26 で不要判定)

### §9.1 v3.3 candidate 検討対象 (R25 で R26 引継候補)

R25 §10 引継 3 で示された `v3.3-future` 候補:
- OWN-PRE-08 追加 sub-card 検討 (現状 7 → 8 sub-card)
- Owner 拘束 4-6 → 3-4 min 圧縮候補 (買い上げ機構等)

### §9.2 R26 評価結果: 不要判定

| 評価軸 | 判定 | 根拠 |
|---|---|---|
| OWN-PRE-08 追加必要性 | **不要** | OWN-PRE-01-07 7 sub-card で D-Day Phase 1 全件 cover / OWN-PRE-08 で対応する未対応領域なし |
| Owner 拘束 4-6 → 3-4 min 圧縮 | **不要 (R26 では)** | v3.2 正式版 4-6 min は安全策 (限界圧縮 2.75 min) / 圧縮効果 +0.1pt 程度 / cost 高 (買い上げ機構実装等) / R28 D-Day 実測値で再検討 |
| D-1 17:00 JST CEO + Owner 共同 sign 経路の追加自動化 | **不要 (R26 では)** | OWN-AUTO PoC script-3/4 で代替可 / D-1 当日 Owner 拘束 1 min 想定 → 既に十分圧縮済 |

### §9.3 R26 結論

- **launch day v3.3-delta-candidate 起票不要** (R26 では効果薄 + cost 高)
- v3.2 正式版を R26 baseline 維持 / R28 D-Day 実測値で v3.3+ 再検討 (R28+ 想定)
- R26 4 task 構成は task ① D-8 execution-ready + task ② D-7 execution-ready + task ③ trajectory + task ④ summary で完結

---

## §10 副作用 0 担保 (本書策定後チェック)

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] Marketing-S R25 confidence trajectory (R18→R31+) **完全無改変保持** (本書は R20-R26 詳細視覚化 + R26 寄与計画追加のみ)
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **完全無改変保持**
- [x] Marketing-Q R23 / Marketing-R R24 / Marketing-S R25 historical baseline absolute 無改変
- [x] R26 task ① D-8 execution-ready / task ② D-7 execution-ready 2 file absolute 無改変 (本書とは別 file)
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中)
- [x] launch day v3.3 candidate 起票なし (R26 で不要判定 / 影響 0)

---

## §11 関連 DEC / KPI

- DEC-019-025: background dispatch SOP 22 件目 (R26 4 件まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/marketing-confidence-trajectory-r20-r26.md` 候補化)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 12 round 適用 / 本書影響 0)
- **DEC-019-080 候補**: D-8 execution-ready + D-7 execution-ready + R26 confidence trajectory + R26 summary 4 件まとめて 1 議決

KPI 連動:
- 17 日 path 完成度: 本書で R20-R26 trajectory 物理化 → +1 path
- DEC trajectory: DEC-019-080 候補

---

## §12 Round 27 引継 (Marketing-U 想定)

1. Round 26 完遂時 confidence 94% baseline 継承
2. R27 task 構成 (D-3 real / D-1 real / v3.2 lock final review / R27 summary) 起票
3. 軸 A-D 4 軸構造維持 (各 Round +2pt 寄与)
4. R28 公開当日 confidence 98% target 維持
5. Owner 拘束 spec 軸 (D-Day 4-6 min / D-7 0-1 min / D-3 + D-1 spec 化候補) 維持
6. launch day v3.3-future は R28+ 検討 (R26 で R27 引継見送り / D-Day 実測値後)

---

**最終更新**: 2026-05-05 (Round 26 / Marketing-T / R20-R26 confidence trajectory 起票)
**派生元**: Round 25 Marketing-S `marketing-s-r25-confidence-trajectory.md` (R18→R31+ trajectory / 不変保持)
**次回見直し**: Round 27 Marketing-U 起票時 (R26 完遂後 / 94% baseline 継承)
