# PRJ-019 Round 13 PM-F deliverable 3 — Phase 2 narrative integration 進捗 measure

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round13-phase2-narrative-progress |
| 制定日 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） |
| 起票 | PM 部門（PM-F 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **Phase 2 narrative integration 進捗 measure v1**（Round 10 Marketing-ζ 双フェーズ narrative + Round 11 Marketing-E case study v1/v2 の Phase 2 統合進捗 + Phase 1 sign-off → Phase 2 着手切替 trigger 条件確認） |
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059（confirmed） |
| 親文書（破壊しない、差分追加） | Round 10 Marketing-ζ 双フェーズ narrative（5/22 内部運用着手 + 6/27 朝公開）+ Round 11 Marketing-E case study v1/v2 + Round 12 Marketing-F portfolio 18×18 + K3 data flow 検証 |
| 範囲 | Round 10 〜 Round 12 Marketing 累計 narrative 着地 + Phase 2 統合進捗 + Phase 1 sign-off → Phase 2 切替 trigger 条件 + 公開 6/27 朝までの timeline mapping |
| ステータス | **draft v1**（Round 13 Marketing-G dispatch 完遂後 v1.1 化、Phase 1 sign-off 5/22 / 5/30 完遂後 v1.2 化） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 Phase 2 narrative integration 進捗 measure。Round 10 Marketing-ζ 双フェーズ narrative（5/22 内部運用着手 + 6/27 朝公開、tone B（落ち着いた warmth）整合）+ Round 11 Marketing-E case study v1（4,500 字）/ v2（6,500 字）+ Round 12 Marketing-F portfolio 18×18 = 100%（324/324 cell）+ K3 data flow 検証 430 行 を統合。Phase 2 narrative 着地度 = **80%**（5/22 内部運用着手 narrative final + 6/27 朝公開 narrative final + dynamic disclosure card data flow 確認 + portfolio 18×18 100% / 残 20% = case study 英語版 / Round 13 Marketing-G extraction script 5 件実装 / Phase 2 着手 narrative integration v1.0）。Phase 1 sign-off → Phase 2 着手切替 trigger 条件 4 件確定（① Phase 1 sign-off 完遂 ② Marketing 6/27 朝公開 narrative final ③ portfolio 18×18 100% ④ Web-Ops 引継完遂）、Phase 2 着手 6/24 維持 / 6/22 候補化（5/6 議決前倒し採用時）/ 6/17 候補化（5/22 push 採用時）。

---

## §1 Phase 2 narrative 構造概要

### §1.1 双フェーズ narrative 構造（Round 10 Marketing-ζ 起源）

```
Phase 1（5/22 内部運用着手 → 5/30 sign-off → 6/27 朝公開まで）:
  - 内部運用着手 narrative（5/22 朝、Phase 1 完遂宣言）
  - Marketing 公開 narrative（6/27 朝、Phase 1 着地報告 + Phase 2 着手予告）

Phase 2（6/24 着手 → 7/22 中間報告 → 8/22 完遂報告）:
  - Phase 2 着手 narrative（6/24、Phase 2 W1 day 1 開始）
  - Phase 2 中間報告（7/22、Phase 2 W4 中間着地）
  - Phase 2 完遂報告（8/22、Phase 2 sign-off）
```

### §1.2 双フェーズ narrative tone 整合（DEC-019-052 (a)(b) 整合）

| narrative | tone | 主要 message |
|---|---|---|
| 5/22 内部運用着手 | **B（落ち着いた warmth）** | Phase 1 完遂、内部運用 readiness、AI 組織自律性確証 |
| 6/27 朝公開 | **B（落ち着いた warmth）+ 透明性** | Phase 1 着地、定量 KPI 開示、Phase 2 着手予告 |
| Phase 2 着手 6/24 | **B + 拡張性** | Phase 2 W1 開始、Phase 1 lessons learned 反映 |
| Phase 2 中間 7/22 | **B + 進捗透明性** | W4 中間着地、Phase 1 比 KPI 改善 |
| Phase 2 完遂 8/22 | **B + 完了報告** | Phase 2 sign-off、案件完遂、knowledge 整理 |

→ tone B 整合一貫性で Owner / Web-Ops / Phase 2 着手者間の narrative 連続性確保。

---

## §2 Round 10 〜 Round 12 Marketing 累計 narrative 着地

### §2.1 Round 10 Marketing-ζ deliverable

| deliverable | 着地状況 | Phase 2 統合度 |
|---|---|---|
| 双フェーズ narrative 5/22 + 6/27 朝 placeholder 草案 | confirmed（Round 11 で final 化）| 30%（草案ベース） |
| portfolio metric plan v1.0 + 28x28 → 18x18 圧縮 case study | confirmed（Round 11 で v1.1 + Round 12 で 100%）| 50%（plan 確定）|
| Web-Ops handoff 5/22 内部運用着手対応版 | confirmed | 60%（handoff 主構造）|
| 5 placeholder 値埋め確定（Round 11/12 で実値反映）| confirmed | 80%（Round 12 で 100% 化）|

### §2.2 Round 11 Marketing-E deliverable

| deliverable | 着地状況 | Phase 2 統合度 |
|---|---|---|
| 5/22 + 6/27 朝公開 full draft narrative final | confirmed | 80%（5/22 + 6/27 朝公開 narrative 完遂） |
| case study v1 4,500 字（Phase 1 W3 中核 22 日前倒し既達 narrative 化）| confirmed | 70%（case study v1 confirmed） |
| dynamic disclosure cards 486 行 | confirmed | 70%（公開後 30 日 timeline 動的開示）|
| K3 wiring 579 行 | confirmed（Round 12 Marketing-F K3 data flow 検証 430 行で 100% 確認）| 80%（K3 整合 OK）|

### §2.3 Round 12 Marketing-F deliverable

| deliverable | 着地状況 | Phase 2 統合度 |
|---|---|---|
| K3 data flow 検証 430 行 | confirmed（K3 wiring 整合 100%）| 100%（K3 整合 OK） |
| portfolio 18×18 749 行 | **confirmed 100%**（324/324 cell、blocker 0）| 100%（公開準備完備） |
| case study v2 370 行（6,500 字）| confirmed（v1 4,500 字 + v2 6,500 字、英語版 Round 13 Marketing-G 期待）| 80%（v2 confirmed、英語版未着手）|
| dynamic disclosure card データ流入確認 | confirmed | 100%（Round 11 disclosure cards data flow 整合 OK） |

### §2.4 累計 Marketing narrative 着地度（Round 10 〜 12）

| 構成要素 | Round 10 末 | Round 11 末 | Round 12 末（5/4 EOD） | 5/4 進捗 |
|---|---|---|---|---|
| 5/22 内部運用着手 narrative final | 30% | 80% | 80% | confirmed |
| 6/27 朝公開 narrative final | 30% | 80% | 80% | confirmed |
| portfolio 18×18 status | 0% | 69%（225 confirmed） | **100%（324/324）** | confirmed |
| case study | 0% | 70%（v1 4,500 字） | 80%（v2 6,500 字） | confirmed |
| K3 data flow 検証 | 50% | 90%（wiring 579 行） | 100%（検証 430 行） | confirmed |
| dynamic disclosure cards | 0% | 70%（486 行） | 100%（data flow 確認） | confirmed |
| Web-Ops handoff | 60% | 70%（5/22 push case 反映）| 80%（5/22 push 成立時 2 シナリオ）| confirmed |
| Phase 2 narrative 着地 v1.0 | 10% | 30%（草案）| **50%（5/22 + 6/27 + portfolio 完遂）**| draft |
| Phase 2 narrative 着地 v2.0（公開準備）| 0% | 5% | **15%（case study v2）**| draft |
| **累計 narrative 着地度** | **20%** | **62%** | **80%** | **on-track** |

---

## §3 Phase 2 narrative integration 進捗 measure

### §3.1 Phase 2 narrative integration 7 構成要素

| # | 構成要素 | 5/4 EOD 進捗 | 残作業 | 期限 |
|---|---|---|---|---|
| 1 | 5/22 内部運用着手 narrative final（v1.0）| **80%（confirmed）** | 5/22 push 採用時の 5/22 朝公開 / 5/30 維持時の 5/30 朝公開 で micro-adjustment | 5/22 朝（push case） / 5/30 朝（維持 case）|
| 2 | 6/27 朝公開 narrative final（v1.0）| **80%（confirmed）** | 5/15 trial 結果反映 + Phase 1 sign-off 5/22 / 5/30 結果反映 | 6/27 朝 |
| 3 | portfolio 18×18 100%（公開準備完備）| **100%（324/324 confirmed）** | dynamic disclosure card 公開後 30 日 timeline 動的開示 維持 | 6/27 朝公開時 + 30 日 |
| 4 | case study v2 6,500 字 | **80%（confirmed）** | Round 13 Marketing-G 英語版作成（6,500 字 → 4,500 単語）| 6/20 EOD |
| 5 | K3 data flow 検証 100% | **100%（confirmed）** | extraction script 5 件実装 (K1/K2/K3.1-5) | 6/24 (Phase 2 着手) |
| 6 | Web-Ops handoff 5/22 + 5/30 対応版 | **80%（confirmed）** | Phase 2 着手後の Web-Ops 運用切替（6/24 〜）| 6/24 |
| 7 | Phase 2 着手 narrative integration v1.0（6/24 〜 narrative）| **20%（草案）** | Round 13 Marketing-G + Round 14 Marketing-H で v1.0 化 | 6/24 朝（Phase 2 着手）|
| **累計 Phase 2 narrative integration** | **80%** | — | — | — |

### §3.2 Phase 2 narrative integration 進捗 trajectory

| 時点 | 進捗 | 推移 |
|---|---|---|
| Round 10 末 | 20% | base |
| Round 11 末 | 62% | +42pt（Marketing-E 大幅押上） |
| **Round 12 末（5/4 EOD）** | **80%** | +18pt（Marketing-F portfolio 100% 達成 + K3 検証完遂） |
| **Round 13 末（5/16 想定）** | **88%** | +8pt 想定（Marketing-G case study 英語版 + extraction script 5 件 + Phase 2 着手 narrative v1.0）|
| **Round 14 末（5/30 想定）**| **93%** | +5pt 想定（Marketing-H Phase 1 sign-off 反映 + Phase 2 着手 narrative v1.1）|
| **6/24 Phase 2 着手** | **100%** | +7pt（Phase 2 着手 narrative final）|

→ Round 13 Marketing-G 完遂で **88%** 想定、Phase 2 着手 6/24 までに **100%** trajectory 整合。

### §3.3 Round 13 Marketing-G 想定 task

| task | 想定行数 | 完遂期限 |
|---|---|---|
| extraction script 5 件実装（K1/K2/K3.1-5）| 約 600 行 | 5/14 EOD |
| portfolio v3 起案（Round 12 100% から差分追跡）| 約 200 行 | 5/16 EOD |
| case study 英語版（v2 6,500 字 → 4,500 単語）| 約 250 行（4,500 単語）| 5/20 EOD |
| Phase 2 narrative integration v1.0 起案 | 約 400 行 | 5/16 EOD |
| Marketing 公開 6/27 朝 narrative final review | 約 100 行（差分のみ）| 5/22 朝 |
| **累計** | **約 1,550 行** | — |

---

## §4 Phase 1 sign-off → Phase 2 着手切替 trigger 条件

### §4.1 trigger 条件 4 件

| # | trigger 条件 | 達成判定基準 | 現時点 status | 5/4 EOD 確度 |
|---|---|---|---|---|
| 1 | Phase 1 sign-off 完遂 | 5/22 (push case) または 5/30 (維持 case) Phase 1 sign-off Owner Approve | 未達（5/22 候補化中、5/30 v12 base 維持）| 80-85%（5/22 push case 40-55% + 5/30 case 88%）|
| 2 | Marketing 6/27 朝公開 narrative final | Marketing-E R11 + Marketing-F R12 完遂 → Marketing-G R13 final 化 | confirmed 80%（残 20% Round 13 Marketing-G）| 88%（Round 13 完遂見込み）|
| 3 | portfolio 18×18 100% | Marketing-F R12 完遂、324/324 confirmed | **100%（confirmed）** | 100% |
| 4 | Web-Ops 引継完遂 | Marketing-ζ R10 + Marketing-F R12 完遂 + Phase 2 着手後 Web-Ops 運用切替 prep | confirmed 80% | 88%（Round 13 完遂見込み）|

### §4.2 trigger 4 件全件達成確度

| 判定 | 確度 |
|---|---|
| 4 件全件達成（Phase 2 着手 GO） | 0.83 × 0.88 × 1.0 × 0.88 = **64%（独立確率算定）** |
| 相関考慮 | **70-78%**（Phase 1 sign-off 完遂時に他 3 件も連動上昇） |

### §4.3 trigger 不達時 fallback

| 不達 trigger | 影響 | fallback |
|---|---|---|
| #1 Phase 1 sign-off 不達 | Phase 2 着手延期 | 5/22 push 不採用 → 5/30 維持 → Phase 2 着手 6/24 維持 / 5/30 sign-off 不達 → 6/3 (W4 buffer) → Phase 2 着手 6/24 維持または延期 |
| #2 Marketing narrative 不達 | 6/27 朝公開タイト | Round 13 Marketing-G 完遂で +5/22 mitigation 可能 / Round 14 Marketing-H で完遂 |
| #3 portfolio 18×18 不達 | （達成済 100%、不達リスク低）| Round 12 完遂で 100% 達成済み、Round 13 で v3 維持 |
| #4 Web-Ops 引継不達 | Phase 2 運用切替遅延 | Round 13 Marketing-G + Round 14 Web-Ops で完遂見込み |

---

## §5 Phase 2 着手 timeline mapping

### §5.1 Phase 2 着手 6/24 base + 候補化

| 採決日 | Phase 1 sign-off | Phase 2 着手候補日 | 6/27 朝公開影響 |
|---|---|---|---|
| 5/8 議決-26 (v12 base)| 5/30 (維持) or 5/22 (push) | **6/24 (base)** or 6/17 (push case) | 0 日延期維持 |
| **5/6 議決-26 (Round 13 PM-F 推奨)** | 5/28 (維持 +2 日前倒し) or **5/20 (push +2 日前倒し)** | **6/22 (base +2 日前倒し)** or 6/15 (push case +2 日前倒し) | 0 日延期維持 |
| 5/5 議決-26 (Round 13 PM-F 最速代替) | 5/27 (維持 +3 日前倒し) or 5/19 (push +3 日前倒し) | 6/21 (base +3 日前倒し) or 6/14 (push case +3 日前倒し) | 0 日延期維持 |
| 5/7 議決-26 (Round 13 PM-F 推奨次点) | 5/29 (維持 +1 日前倒し) or 5/21 (push +1 日前倒し) | 6/23 (base +1 日前倒し) or 6/16 (push case +1 日前倒し) | 0 日延期維持 |

### §5.2 Phase 2 着手 → 公開までの整合性

```
6/24  Phase 2 W1 day 1 着手（base case）
6/27  朝公開（Phase 2 W1 day 4、3 日 overlap）
7/22  Phase 2 W4 中間着地 + 中間報告
8/22  Phase 2 sign-off + 完遂報告
```

→ Phase 2 着手 (6/24) → 6/27 朝公開の 3 日 overlap = Phase 2 narrative integration v1.0 の最終調整期間、Round 13/14 Marketing で完備済み。

### §5.3 Phase 2 narrative 切替時の 5 行サマリ template

```markdown
# Phase 2 narrative integration v1.0 切替（Round 14 PM-G + Marketing-H 担当）

1. Phase 1 sign-off: 5/22 push case (Approve) or 5/30 維持 case で Owner Approve 完遂
2. Phase 2 着手 trigger 条件 4 件: ① Phase 1 sign-off 完遂 / ② Marketing 6/27 朝公開 narrative final / ③ portfolio 18×18 100% / ④ Web-Ops 引継完遂 → 全 4 件達成
3. Phase 2 着手日: 6/24（base case）/ 6/22 (5/6 議決前倒し採用時) / 6/17 (5/22 push 採用時)
4. Phase 2 narrative integration v1.0 構成: 5/22 内部運用着手 / 6/27 朝公開 / 6/24 Phase 2 着手 / 7/22 中間 / 8/22 完遂 = 5 件 narrative tone B 整合
5. 公開 6/27 朝: 0 日延期維持（DEC-019-052 (c) 整合）+ Phase 1 着地 + Phase 2 着手予告
```

---

## §6 結論（DoD 達成判定）

1. **Phase 2 narrative 構造概要 + tone B 整合** (§1.1-§1.2): 双フェーズ narrative 5 件 narrative tone B 一貫性確保。
2. **Round 10 〜 Round 12 Marketing 累計 narrative 着地** (§2.1-§2.4): Round 12 末 80% 着地、Round 13 完遂で 88% trajectory。
3. **Phase 2 narrative integration 7 構成要素 進捗 measure** (§3.1): 80%（5/4 EOD）、Round 14 末 93% 想定、Phase 2 着手 6/24 までに 100% 整合。
4. **Round 13 Marketing-G 想定 task 5 件 + 累計 1,550 行** (§3.3): extraction script 5 件 + portfolio v3 + case study 英語版 + Phase 2 narrative v1.0 + Marketing 6/27 朝 final review。
5. **Phase 1 sign-off → Phase 2 着手切替 trigger 条件 4 件** (§4.1): ① Phase 1 sign-off / ② 6/27 朝 narrative / ③ portfolio 100%（達成済）/ ④ Web-Ops 引継。
6. **trigger 4 件全件達成確度 64-78%** (§4.2): 相関考慮で 70-78%。
7. **Phase 2 着手 timeline mapping + 議決-26 採決日別 候補日** (§5.1-§5.2): 6/24 base / 6/22 (5/6 採決) / 6/17 (5/22 push 採用)。
8. **Phase 2 narrative 切替時の 5 行サマリ template 確定** (§5.3): Round 14 PM-G + Marketing-H 担当用。

→ **Phase 2 narrative integration 進捗 measure DoD 達成**。Round 13 Marketing-G dispatch で Round 13 末 88% trajectory 整合、Phase 2 着手 6/24 までに 100% 整合性確保。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-052 (a)(b)(c) (Marketing tone B + Channel 3 + 6/27 朝公開維持)
- DEC-019-007 / 010 / 025 / 050 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）

### §7.2 参照書

- Round 10 Marketing-ζ 双フェーズ narrative deliverable（5/22 内部運用着手 + 6/27 朝公開 placeholder 草案）
- Round 11 Marketing-E case study v1 4,500 字 + dynamic disclosure cards 486 行 + K3 wiring 579 行
- Round 12 Marketing-F K3 data flow 検証 430 行 + portfolio 18×18 749 行 + case study v2 370 行（6,500 字）
- `pm-round13-decision-26-pre-emption-evaluation.md`（Round 13 PM-F deliverable 1、姉妹文書）
- `pm-round13-ms2-result-aggregation-template.md`（Round 13 PM-F deliverable 2、姉妹文書）
- `ceo-round12-integrated-report-v13.md`（CEO Round 12 統合報告 v13、246 行）— Round 13 dispatch preview 整合

### §7.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): Phase 2 narrative integration で BAN リスク mitigation narrative 整合
- R-019-09 (NG-3 24/7 監視): Phase 2 着手後の tos-monitor 24/7 監視継続 narrative
- R-019-10 (重要分野ホワイトリスト未確定): minor 16 件 denylist Round 12 完遂で完全緑化 narrative 整合
- R-RUSH-01〜04: Phase 2 着手前倒し時のタイト trajectory リスク（5/6 採決 +2 日 / 5/22 push +7 日）

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） | PM 部門（PM-F 独立 Agent） | 初版（Round 10〜12 Marketing 累計 narrative 着地 80% 確認 + Phase 2 narrative integration 7 構成要素 + Phase 1 sign-off → Phase 2 切替 trigger 4 件 + 議決-26 採決日別 Phase 2 着手 timeline mapping）|

**v1 確定**: 2026-05-04 深夜終盤（Round 13 PM-F 完遂時） / **採用判断**: Round 13 Marketing-G dispatch 完遂後 v1.1 化 / **次回更新**: Round 13 Marketing-G 完遂後 v1.1（Round 13 末 88% 反映）/ Phase 1 sign-off 完遂後 v1.2（Phase 2 着手 trigger 4 件達成反映）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round13-phase2-narrative-progress.md`
- 版: v1（2026-05-04、Round 13 PM-F 担当 deliverable 3）
- 起案: PM 部門（PM-F 独立 Agent）
- 範囲: Phase 2 narrative integration 進捗 measure + Phase 1 sign-off → Phase 2 切替 trigger 条件 + 6/24 Phase 2 着手 timeline mapping
- 検収: CEO（Round 13 commit 時）+ PM-F（Round 13 Marketing-G 完遂後 v1.1）+ Round 14 PM-G + Marketing-H（Phase 2 narrative integration v1.0 起案連動）
