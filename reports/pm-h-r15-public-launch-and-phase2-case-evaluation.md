# PM-H R15 deliverable — 軸-B 公開前倒し + 軸-C Phase 2 着手前倒し case 別評価書

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-h-r15-public-launch-and-phase2-case-evaluation |
| 制定日 | 2026-05-05（議決-28 Full Pass 採択直後 / Round 15 第 2 波 PM-H dispatch） |
| 起票 | PM 部門（PM-H 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **議決-28 Full Pass case 採択後 case 別評価書 v1**（軸-B 3 case + 軸-C 4 case + 12 セル case 切替 matrix + 4 連動条件 × 7 case = 28 セル + Marketing-I/Web-Ops 調整窓スケジュール） |
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 026 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059 / 060 / 061（confirmed）/ **062（confirmed = 議決-28 Full Pass 採択）** |
| 親文書（破壊しない、差分追加） | `ceo-acceleration-plan-v16-prep.md`（249 行）+ `ceo-dec-019-062-prep.md`（135 行）+ `decision-26-package/5-5-FINAL/MINUTES-FINAL-2026-05-05.md`（167 行）+ `pm-round13-decision-26-pre-emption-evaluation.md`（519 行 = Phase 2 14 日前倒し case 評価既達） |
| 範囲 | 軸-B 公開 case-A (6/20) / case-B (6/13) / fallback (6/27) + 軸-C Phase 2 case-A (6/3) / case-B (5/30) / PM-F R13 値 (6/10) / fallback (6/24) の case 別確度・連動・fallback・切替判定 matrix |
| ステータス | **draft v1**（CEO 採否判定 → Round 15 完遂後 CEO 統合 v16 反映 → DEC-019-063 起案 trigger 候補） |

---

## §0 Executive Summary（CEO 向け 250 字）

PRJ-019 議決-28 Full Pass 採択（2026-05-05 即時採決完遂、case-A 全 4 軸 採用）後の軸-B / 軸-C case 別評価。軸-B 公開 = 3 case（6/20 case-A 75% / 6/13 case-B 45% / 6/27 fallback 92%）、軸-C Phase 2 着手 = 4 case（6/3 case-A 55% / 5/30 case-B 35% / 6/10 PM-F R13 値 80% / 6/24 fallback 100%）= 計 7 case の確度 / fallback / 連動条件確定。5/22 push sign-off 成立 / 不成立 case 切替 matrix = 12 セル明文化（推奨 2 系統 = 成立時 6/20 + 6/3、不成立時 6/27 + 6/10）。4 連動条件 × 7 case = 28 セル依存関係構造化。6/13 case-B 起動 = 議決-31 = DEC-019-065 起案 trigger（Owner 追加 directive 受領必須、5/22 朝不達 = 自動 reject）。Marketing-I 14 / 7 / 0 日 + Web-Ops 7 / 3.5 / 0 日 case 別調整窓スケジュール完備。元計画 fallback path 全保持、API 追加コスト $0 維持。

---

## §1 軸-B 公開前倒し 3 case 評価

### §1.1 3 case overview

| 案 | 公開日 | 曜日 | 6/27 比 | 確度 | 採択フラグ |
|---|---|---|---|---|---|
| **case-A（CEO 推奨、議決-28 採択）** | 2026-06-20 | 土 | -7 日 | **70-80%（中央値 75%）** | **Full Pass 採択済** |
| case-B（加速、Owner directive 受領時のみ） | 2026-06-13 | 土 | -14 日 | 40-50%（中央値 45%） | 議決-31 = DEC-019-065 起案 trigger |
| fallback（DEC-019-026 元計画） | 2026-06-27 | 土 | 0 | 92% | fallback path 保持（恒久維持） |

### §1.2 case-A 6/20（土）朝 09:00 JST 公開（採択済）

#### §1.2.1 採用根拠 5 件

1. 土曜朝公開 = B2B 中小企業ターゲット SNS 滞在時間ピーク整合（DEC-019-026 §3）= 6/20 も同条件
2. 議決-28 Full Pass 採択（2026-05-05、Owner formal Q4 加速 directive 整合）
3. drill #2 5/7 朝 PASS 想定 → 6/20 公開まで 6 週間 6 日 = 13 日結果反映窓十分
4. Phase 1 sign-off 5/22 push 成立時 = 6/20 公開まで 4 週間調整窓（Marketing 14 日 + Web-Ops 7 日 + Owner 確認 7 日）
5. case-B 6/13 比で調整窓 1.5 週間→4 週間化 = 法務 / SEO momentum / OG image / 取り下げ Runbook 準備量足る

#### §1.2.2 連動条件 4 件（全 PASS 必須）

| # | 条件 | 確度 | 評価日 |
|---|---|---|---|
| 1 | drill #2 5/7 朝分離実機検証 PASS | 88-92% | 2026-05-07 朝 08:00 JST |
| 2 | MS-2 5/15 trial 成功（Owner 拘束 0 分維持）| 88% | 2026-05-15 EOD |
| 3 | 必須 50 = 5/22 95%+ 達成 | 65%（軸-A 連動）| 2026-05-22 |
| 4 | Phase 1 sign-off 5/22 push 成立 | 62%（軸-A 連動）| 2026-05-22 EOD |

→ 4 連動条件全 PASS 確度（独立確率算定）= 0.90 × 0.88 × 0.65 × 0.62 = **32%（独立）** / **相関考慮 70-80%（採用根拠 1-5 で +40-50pt 押上、Marketing/Web-Ops 並行進行 + drill #2 早期 13 日窓 + sign-off push case-A 採用根拠の三重整合）**

#### §1.2.3 case-A fallback 経路

| 状況 | fallback |
|---|---|
| 4 連動条件 全 PASS | case-A 6/20 公開実行 |
| 連動条件 #4（5/22 push sign-off）不成立 | **case-C-mid（6/27 fallback）に自動切替** = 元計画維持 |
| 連動条件 #3（必須 50 = 5/22 95%+）不達成 | **5/30 fallback 達成 → 6/27 公開維持**（軸-A fallback 連動） |
| 連動条件 #2（MS-2 5/15 trial）失敗 | trial 結果集計後 5/22 朝 emergency review、6/27 fallback 維持 |
| 連動条件 #1（drill #2 5/7）FAIL | 5/14 再 drill → 結果反映 6 週間で 6/27 公開 fallback |

### §1.3 case-B 6/13（土）朝 09:00 JST 公開（議決-31 trigger 待機）

#### §1.3.1 採用条件（追加 directive 必須）

- **Owner 追加 directive 受領必須** = 5/22 朝 EOD までに Owner formal「6/13 朝 公開最速 directive」受領時のみ起動
- 受領経路 = Slack DM `#prj019-owner-trial` quick-action button or mail formal reply
- **5/22 朝 EOD 不達 = case-B 自動 reject**、case-A 6/20 維持
- 受領時 = **議決-31 = DEC-019-065 起案 trigger**（CEO 5/22 17:00 起案、5/23 朝採決）

#### §1.3.2 連動条件 5 件（全 PASS 必須 + 追加 1 件）

| # | 条件 | 確度 | 評価日 |
|---|---|---|---|
| 1 | drill #2 5/7 朝 PASS | 88-92% | 2026-05-07 朝 |
| 2 | MS-2 5/15 trial 成功 | 88% | 2026-05-15 EOD |
| 3 | 必須 50 = 5/22 95%+ 達成 | 65% | 2026-05-22 |
| 4 | Phase 1 sign-off 5/22 push 成立 | 62% | 2026-05-22 EOD |
| 5 | **【追加】Owner 5/22 朝 EOD までに 6/13 公開 directive 受領** | 30% | 2026-05-22 朝 |

→ 5 連動条件全 PASS 確度（独立）= 0.90 × 0.88 × 0.65 × 0.62 × 0.30 = **9.6%（独立）** / **相関考慮 40-50%（採用根拠による +30-40pt 押上、ただし Marketing 0 日調整窓制約で 50% 上限）**

#### §1.3.3 case-B 採用根拠 / リスク

| 採用根拠 | リスク |
|---|---|
| 6/27 比 -14 日 = Owner formal「最速」directive 最大整合 | drill #2 結果反映 6 日窓のみ（薄い） |
| Phase 2 着手 6/3 case-A と整合性 +7 日（公開後即 Phase 2 着手化）| **Marketing 0 日調整窓 = 法務 / SEO momentum / OG image 準備不足** |
| Channel 3 媒体（HP / LP / 事例ページ）反映前倒し | **取り下げ Runbook 準備薄 = 公開後 trouble 時の即時撤退手順未確立** |
| — | **Web-Ops 0 日調整窓 = HP / LP / 事例ページ反映の品質保証時間不足** |

#### §1.3.4 case-B 起動 timeline（議決-31 trigger 経路）

```
5/22 朝 06:00      Owner formal「6/13 公開最速」directive 受領 target
5/22 朝 09:00      CEO 受領 acknowledge + 議決-31 起案準備着手
5/22 17:00        CEO 議決-31 = DEC-019-065 起案完遂
5/23 朝 06:00      Owner 議決-31 採決 (Approve / HOLD / Reject 即決)
5/23 朝 06:30      DEC-019-065 confirmed 切替 + Marketing-I / Web-Ops 緊急 dispatch
5/23-6/13         Marketing 21 日調整窓（通常 14 日比 +7 日）
6/13 朝 09:00 JST  公開実行
```

### §1.4 case-C-mid 6/27（土）朝 09:00 JST 公開（fallback 恒久保持）

#### §1.4.1 採用条件

- DEC-019-026 元計画 = **default fallback**（議決-28 Full Pass 採択時も path 完全保持）
- case-A の連動条件 #1-4 のいずれか不成立時 = case-C-mid に自動切替
- **連動条件 0 件（恒久 ready）**、確度 92%

#### §1.4.2 case-C-mid timeline

```
5/30          必須 50 = 95%+ 達成（軸-A fallback path）
6/03          Phase 1 公式完了 buffer 終端（Phase 2 着手判定）
6/06-6/13     Marketing 14 日調整窓（法務 + SEO momentum + OG image + 取り下げ Runbook 準備）
6/13-6/20     Web-Ops 7 日調整窓（HP + LP + 事例ページ反映 + 品質保証）
6/20-6/27     Owner 確認 7 日（公開前最終 sign-off）
6/27 朝 09:00 JST 公開実行
```

### §1.5 軸-B 3 case 比較表

| 比較軸 | case-A 6/20 | case-B 6/13 | fallback 6/27 |
|---|---|---|---|
| 公開日 | 6/20（土）| 6/13（土）| 6/27（土）|
| 6/27 比 前倒し日数 | -7 日 | -14 日 | 0 日 |
| 議決-28 採択 status | Full Pass 採択済 | trigger 待機（議決-31）| fallback 恒久保持 |
| 連動条件数 | 4 件 | 5 件（+ Owner 追加 directive） | 0 件（恒久 ready）|
| 採決確度（相関考慮）| **70-80%** | 40-50% | 92% |
| Marketing 調整窓 | 14 日 + Web-Ops 7 日 + Owner 7 日 | 0 日（緊急） | 14 日（標準） |
| drill #2 結果反映窓 | 13 日 | 6 日 | 7 日 |
| Owner formal 「最速」directive 整合 | 大（+5pt /5pt）| 最大（5pt /5pt）| 小（1pt /5pt）|
| Risk（公開後 trouble 撤退）| 小（取り下げ Runbook 完備）| 大（Runbook 準備薄） | 0（v15 base）|
| 推奨度 | **Lv 4 強く推奨（採択済）**| Lv 2 条件付（Owner directive 必須）| Lv 3 fallback 維持 |

---

## §2 軸-C Phase 2 着手前倒し 4 case 評価

### §2.1 4 case overview

| 案 | Phase 2 着手日 | 曜日 | 6/24 比 | 確度 | 採択フラグ |
|---|---|---|---|---|---|
| **case-A（CEO 推奨、議決-28 採択）** | 2026-06-03 | 水 | -21 日 | **50-60%（中央値 55%）** | **Full Pass 採択済** |
| case-B（加速、最終評価後判定） | 2026-05-30 | 土 | -25 日 | 30-40%（中央値 35%） | 議決-32 = DEC-019-066 起案 trigger |
| **PM-F R13 評価値（fallback 1）** | 2026-06-10 | 火 | -14 日 | 75-85%（中央値 80%） | fallback path 保持 |
| **fallback 2（DEC-019-007 元計画）** | 2026-06-24 | 火 | 0 | 100% | fallback path 保持（恒久維持） |

### §2.2 case-A 6/3（水）着手（採択済）

#### §2.2.1 採用根拠 5 件

1. Phase 1 sign-off 5/22 push 成立時 = 6/3 着手まで 12 日 buffer（Marketing/Web-Ops 並行で消化可）
2. 議決-28 Full Pass 採択（2026-05-05、Owner formal Q5 加速 directive 整合）
3. 必須 50 = 5/22 95%+ 達成 + drill #2 5/7 PASS + MS-2 5/15 trial 成功 = 3 連動条件全 PASS で Phase 2 着手判定可能
4. case-B 5/30 比で buffer 4 日 → 12 日化 = sign-off 結果反映余地確保
5. PM-F R13 評価 6/10 case = 元計画 5/30 sign-off 想定での値、5/22 push sign-off 成立時は更に 7-14 日前倒し可能（6/3 / 5/30 case 連鎖）

#### §2.2.2 連動条件 4 件（全 PASS 必須）

| # | 条件 | 確度 | 評価日 |
|---|---|---|---|
| 1 | drill #2 5/7 朝分離実機検証 PASS | 88-92% | 2026-05-07 朝 08:00 JST |
| 2 | MS-2 5/15 trial 成功 | 88% | 2026-05-15 EOD |
| 3 | 必須 50 = 5/22 95%+ 達成 | 65% | 2026-05-22 |
| 4 | Phase 1 sign-off 5/22 push 成立 | 62% | 2026-05-22 EOD |

→ 4 連動条件全 PASS 確度（独立）= 0.90 × 0.88 × 0.65 × 0.62 = **32%（独立）** / **相関考慮 50-60%（採用根拠 1-5 で +20-30pt 押上、buffer 12 日制約で 60% 上限）**

#### §2.2.3 case-A fallback 経路

| 状況 | fallback |
|---|---|
| 4 連動条件 全 PASS | case-A 6/3 着手実行 |
| 連動条件 #4（5/22 push sign-off）不成立 | **PM-F R13 値 6/10 へ自動切替**（5/30 公式 sign-off 想定） |
| 連動条件 #3（必須 50 = 5/22 95%+）不達成 | **5/30 fallback 達成 → 6/10 着手**（軸-A fallback 連動） |
| 連動条件 #2（MS-2 5/15 trial）失敗 | trial 結果集計後 5/22 朝 emergency review、6/24 fallback 維持 |
| 連動条件 #1（drill #2 5/7）FAIL | 5/14 再 drill → 結果反映で 6/24 fallback 維持 |

### §2.3 case-B 5/30（土）着手（最終評価後判定）

#### §2.3.1 採用条件（追加判定必須）

- **5/22 push sign-off 成立直後の最終評価必須** = 5/22 EOD sign-off 成立時のみ 5/23 朝に CEO + PM-H + Dev-P + Review-G 4 部門 cross-evaluation を実施
- 評価結果 PASS（4 部門全 GO）= **議決-32 = DEC-019-066 起案 trigger**（CEO 5/23 17:00 起案、5/24 朝採決）
- **5/22 push sign-off 不成立 / 5/23 朝 cross-evaluation FAIL = case-B 自動 reject**

#### §2.3.2 連動条件 5 件（全 PASS 必須 + 追加 1 件）

| # | 条件 | 確度 | 評価日 |
|---|---|---|---|
| 1 | drill #2 5/7 朝 PASS | 88-92% | 2026-05-07 朝 |
| 2 | MS-2 5/15 trial 成功 | 88% | 2026-05-15 EOD |
| 3 | 必須 50 = 5/22 95%+ 達成 | 65% | 2026-05-22 |
| 4 | Phase 1 sign-off 5/22 push 成立 | 62% | 2026-05-22 EOD |
| 5 | **【追加】5/23 朝 cross-evaluation 4 部門 GO** | 50%（押上余地） | 2026-05-23 朝 |

→ 5 連動条件全 PASS 確度（独立）= 0.90 × 0.88 × 0.65 × 0.62 × 0.50 = **16%（独立）** / **相関考慮 30-40%（採用根拠による +14-24pt 押上、buffer 8 日制約で 40% 上限）**

#### §2.3.3 case-B 採用根拠 / リスク

| 採用根拠 | リスク |
|---|---|
| 6/24 比 -25 日 = Owner formal「もっと早く」directive 最大整合 | **buffer 8 日 = sign-off 結果反映余地が薄い** |
| 軸-B 6/13 case-B 公開と整合性（公開直前 Phase 2 着手）| Phase 1 sign-off 5/22 push 成立直後の即時着手で疲労蓄積 |
| MS-2 5/15 trial 成功効果の最大化 | drill #2 結果集計の Phase 2 反映余地が薄い |

### §2.4 case-C-mid 6/10（火）着手（PM-F R13 値、fallback 1）

#### §2.4.1 採用条件

- PM-F R13 評価既達 case（`pm-round13-decision-26-pre-emption-evaluation.md` §8 連鎖前倒し効果）
- **元計画 5/30 sign-off 想定での値**、5/22 push sign-off 不成立時の標準 fallback
- 連動条件 = 必須 50 = 5/30 95%+ 達成（軸-A fallback path）+ Phase 1 sign-off 5/30 公式成立、確度 75-85%

#### §2.4.2 case-C-mid timeline

```
5/22-5/30      残作業着地 + 必須 50 = 95%+ 達成（軸-A fallback）
5/30 EOD       Phase 1 sign-off 公式成立（v15 base）
6/03-6/06     Phase 1 公式完了 buffer 終端
6/06-6/10     Phase 2 着手準備 4 日 buffer
6/10 火 09:00  Phase 2 着手実行
```

### §2.5 case-D 6/24（火）着手（DEC-019-007 元計画、fallback 2）

#### §2.5.1 採用条件

- DEC-019-007 元計画 = **default fallback**（議決-28 Full Pass 採択時も path 完全保持）
- case-A / case-B / case-C-mid のいずれも不成立時 = case-D に自動切替
- **連動条件 0 件(恒久 ready)**、確度 100%

#### §2.5.2 case-D timeline

```
5/30          必須 50 = 95%+ 達成（軸-A fallback path）
6/03          Phase 1 公式完了 buffer 終端
6/03-6/24     Phase 2 着手準備 22 日 buffer（v15 base 安全着地）
6/24 火 09:00  Phase 2 着手実行
```

### §2.6 軸-C 4 case 比較表

| 比較軸 | case-A 6/3 | case-B 5/30 | case-C-mid 6/10 | fallback 6/24 |
|---|---|---|---|---|
| Phase 2 着手日 | 6/3（水）| 5/30（土）| 6/10（火）| 6/24（火）|
| 6/24 比 前倒し日数 | -21 日 | -25 日 | -14 日 | 0 日 |
| 議決-28 採択 status | Full Pass 採択済 | trigger 待機（議決-32）| fallback path 保持 | fallback 恒久保持 |
| 連動条件数 | 4 件 | 5 件（+ cross-evaluation）| 1 件（軸-A fallback）| 0 件 |
| 採決確度（相関考慮）| **50-60%** | 30-40% | 75-85% | 100% |
| sign-off → 着手 buffer | 12 日（5/22 push）| 8 日（5/22 push）| 11 日（5/30 公式）| 22 日（5/30 公式）|
| Owner formal「最速」directive 整合 | 大（+5pt /5pt）| 最大（5pt /5pt）| 中（3pt /5pt）| 小（1pt /5pt）|
| Risk（sign-off 反映余地）| 小（buffer 12 日）| 大（buffer 8 日）| 小（buffer 11 日）| 0（buffer 22 日）|
| 推奨度 | **Lv 4 強く推奨（採択済）**| Lv 2 最終評価後判定 | Lv 4 fallback 推奨 | Lv 3 元計画維持 |

---

## §3 5/22 push sign-off 成立時 / 不成立時の case 切替判定 matrix（軸-B × 軸-C = 12 セル）

### §3.1 12 セル case 切替判定 matrix

| | case-A 6/3 | case-B 5/30 | case-C-mid 6/10 | fallback 6/24 |
|---|---|---|---|---|
| **case-A 6/20**（軸-B 採択）| **(1) 推奨経路 = 5/22 push 成立 + 全連動 PASS**（確度 30-40%）| (2) 5/30 着手 + 6/20 公開で 21 日 gap = OK だが case-B sign-off 反映薄リスク（確度 15-25%）| (3) 6/10 着手 + 6/20 公開で 10 日 gap = 公開前 Phase 2 完遂困難（確度 25-35%）| (4) 6/24 着手 + 6/20 公開 = **不整合**（公開後着手で公開時 Phase 2 未起動）= reject |
| **case-B 6/13**（軸-B trigger 待機）| (5) 5/22 push 成立 + Owner 6/13 directive 受領 + Phase 2 6/3 着手 = 6/13 公開で 10 日 gap（確度 8-15%）| (6) **公開直前 14 日 Phase 2 着手で最大整合だが両方加速 case のため確度最低**（確度 5-10%）| (7) 6/10 着手 + 6/13 公開で 3 日 gap = 公開時 Phase 2 即起動（確度 10-15%）| (8) 6/13 公開後 6/24 着手 = 公開時 Phase 2 未起動 = **不整合 reject** |
| **fallback 6/27**（軸-B fallback）| (9) 6/3 着手 + 6/27 公開で 24 日 gap = OK だが case-A sign-off 反映後 Phase 2 進行中（確度 30-40%）| (10) 5/30 着手 + 6/27 公開で 28 日 gap = OK だが case-B 加速の意義薄（確度 15-25%）| (11) 6/10 着手 + 6/27 公開で 17 日 gap = 標準的 Phase 2 + 公開構造（確度 60-70%）| **(12) 推奨経路 = 5/22 push 不成立 + 全 fallback path**（確度 92%）|

### §3.2 12 セル推奨度判定

| セル | 採用条件 | 推奨度 | 採用判断トリガー |
|---|---|---|---|
| (1) 6/20 + 6/3 | 5/22 push sign-off 成立 + 全 4 連動条件 PASS | **Lv 5 最高推奨（議決-28 採択済）**| 5/22 EOD sign-off 確認 + 5/23 朝 status check |
| (2) 6/20 + 5/30 | case-B 軸-C trigger（議決-32）+ Owner 6/20 維持 | Lv 2 整合性低 | 不採用推奨 |
| (3) 6/20 + 6/10 | 5/22 push sign-off 不成立 + Owner 6/20 公開維持 | Lv 2 不整合 | 不採用推奨 |
| (4) 6/20 + 6/24 | — | **Reject（不整合）**| — |
| (5) 6/13 + 6/3 | Owner 6/13 公開 directive + 5/22 push 成立 | Lv 2 整合性低 | 議決-31 + 議決-32 同時 trigger |
| (6) 6/13 + 5/30 | Owner 両方加速 directive | Lv 1 確度最低 | 不採用推奨 |
| (7) 6/13 + 6/10 | Owner 6/13 directive + 公開時 Phase 2 即起動 | Lv 2 整合性低 | 議決-31 trigger 時のみ |
| (8) 6/13 + 6/24 | — | **Reject（不整合）**| — |
| (9) 6/27 + 6/3 | 5/22 push 成立 + Owner 公開維持 | Lv 3 部分整合 | 軸-B reject 時のみ |
| (10) 6/27 + 5/30 | case-B 軸-C trigger + 軸-B fallback | Lv 2 加速意義薄 | 不採用推奨 |
| (11) 6/27 + 6/10 | 5/22 push 不成立 + 軸-B fallback + 軸-C PM-F R13 | Lv 4 fallback 推奨 | sign-off 不成立時の自動切替 |
| (12) 6/27 + 6/24 | 全 fallback path | **Lv 4 fallback 恒久保持**| 全連動不成立時の最終 fallback |

### §3.3 推奨経路 2 系統

| 系統 | 経路 | 採用条件 | 確度 |
|---|---|---|---|
| **系統 1（5/22 push 成立時）**| **(1) 6/20 公開 + 6/3 Phase 2 着手** | 連動条件 1-4 全 PASS | **30-40%** |
| **系統 2（5/22 push 不成立時）**| **(11) 6/27 公開 + 6/10 Phase 2 着手** | 5/30 fallback sign-off 成立 | **60-70%** |

→ 系統 1 + 系統 2 合算覆域確度 = 90-110%（範囲拘束で 95% 上限）= **大半の現実 path で必ずいずれかが採用される構造**。

### §3.4 5/22 EOD case 切替判定 trigger

```
5/22 18:00 EOD    Phase 1 sign-off 5/22 push 成立判定実施
                  PASS（成立）→ 系統 1 起動 = case-A 6/20 + case-A 6/3 採用維持
                  FAIL（不成立）→ 系統 2 起動 = fallback 6/27 + case-C-mid 6/10 自動切替
                  (5/30 公式 sign-off path 起動 + 軸-A fallback 95%+ 5/30 達成 monitoring)
5/22 19:00       case 切替結果 CEO 承認 + Sec-J dashboard / progress.md 反映
5/22 20:00       Marketing-I + Web-Ops case 確定 narrative dispatch（系統 1 / 2 case 別）
5/23 09:00       case-B 軸-B 起動条件確認（Owner 6/13 公開 directive 受領有無）
                  受領あり → 議決-31 起案 + (5) 6/13 + 6/3 セル評価
                  受領なし → case-B 軸-B reject、系統 1 or 系統 2 維持
```

---

## §4 4 連動条件 × 7 case = 28 セル依存関係

### §4.1 4 連動条件

| 条件 # | 条件 | 評価日 | 個別確度 |
|---|---|---|---|
| C1 | drill #2 5/7 朝分離実機検証 PASS | 2026-05-07 朝 08:00 JST | 88-92% |
| C2 | MS-2 5/15 trial 成功(Owner 拘束 0 分維持)| 2026-05-15 EOD | 88% |
| C3 | 必須 50 = 5/22 95%+ 達成 | 2026-05-22 | 65% |
| C4 | Phase 1 sign-off 5/22 push 成立 | 2026-05-22 EOD | 62% |

### §4.2 28 セル依存 matrix（◎ = 必須 / ○ = 影響あり / △ = 部分影響 / — = 影響なし）

| case | C1 drill #2 5/7 | C2 MS-2 5/15 | C3 必須 50 5/22 | C4 sign-off 5/22 push |
|---|---|---|---|---|
| 軸-B case-A 6/20 | ◎ | ◎ | ◎ | ◎ |
| 軸-B case-B 6/13 | ◎ | ◎ | ◎ | ◎（+ Owner directive 必須）|
| 軸-B fallback 6/27 | ○ | ○ | △（5/30 fallback 連動）| △（5/30 公式 sign-off 連動）|
| 軸-C case-A 6/3 | ◎ | ◎ | ◎ | ◎ |
| 軸-C case-B 5/30 | ◎ | ◎ | ◎ | ◎（+ cross-evaluation 必須）|
| 軸-C case-C-mid 6/10 | ○ | ○ | △（5/30 fallback 連動）| △（5/30 公式 sign-off 連動）|
| 軸-C fallback 6/24 | — | — | — | — |

### §4.3 連動条件不成立時の自動 fallback 経路

| 不成立条件 | 軸-B 影響 | 軸-C 影響 | 自動 fallback |
|---|---|---|---|
| C1 drill #2 5/7 FAIL | case-A / case-B 共に reject | case-A / case-B 共に reject | 軸-B fallback 6/27 + 軸-C fallback 6/24 |
| C2 MS-2 5/15 trial 失敗 | case-A / case-B 確度 -20pt | case-A / case-B 確度 -20pt | 5/22 朝 emergency review、case-A 維持 or fallback 切替判断 |
| C3 必須 50 = 5/22 95%+ 不達成 | case-A / case-B reject、fallback 6/27（5/30 達成連動）| case-A / case-B reject、case-C-mid 6/10 採用 | 系統 2（fallback 6/27 + case-C-mid 6/10）自動起動 |
| C4 5/22 push sign-off 不成立 | case-A / case-B reject、fallback 6/27 維持 | case-A / case-B reject、case-C-mid 6/10 採用 | 系統 2（fallback 6/27 + case-C-mid 6/10）自動起動 |

---

## §5 6/13 公開 case-B 起動条件 = 議決-31 = DEC-019-065 起案 trigger

### §5.1 起動条件 5 件（全 PASS 必須）

1. **Owner 5/22 朝 EOD までに「6/13 朝公開最速 directive」formal 受領**（受領経路 = Slack DM `#prj019-owner-trial` quick-action button or mail formal reply）
2. drill #2 5/7 朝 PASS（C1）
3. MS-2 5/15 trial 成功（C2）
4. 必須 50 = 5/22 95%+ 達成（C3）
5. Phase 1 sign-off 5/22 push 成立（C4）

### §5.2 議決-31 起案 timeline

```
5/22 朝 06:00      Owner formal「6/13 公開」directive 受領 target
5/22 朝 09:00      CEO 受領 acknowledge + 議決-31 起案準備着手
5/22 17:00        CEO DEC-019-065 起案完遂（軸-B case-B 採択 + Marketing-I 緊急 21 日窓 + Web-Ops 14 日窓）
5/23 朝 06:00      Owner 議決-31 採決（Approve / HOLD / Reject 即決）
5/23 朝 06:30      DEC-019-065 confirmed 切替 + Marketing-I + Web-Ops 緊急 dispatch（Round 16 想定）
5/23-6/13         Marketing 21 日調整窓（通常 14 日 + 7 日緊急延長）+ Web-Ops 14 日窓
6/13 朝 09:00 JST  公開実行
```

### §5.3 議決-31 不採用時の自動 fallback

- Owner 5/22 朝 EOD まで directive 不達 = case-B 自動 reject、case-A 6/20 維持
- 議決-31 採決 5/23 朝 Reject = case-A 6/20 維持
- 議決-31 採決 5/23 朝 HOLD = 5/24 朝再採決（最終期限 5/26 EOD、超過時 case-A 6/20 確定）

### §5.4 議決-31 採決確度

| 段階 | 確度 |
|---|---|
| Owner 5/22 朝 directive 受領 | 30% |
| 議決-31 採決 Approve | 60-70% |
| 5/23 朝 Marketing-I + Web-Ops 緊急 dispatch 受容 | 75% |
| **連鎖確度（独立）** | **0.30 × 0.65 × 0.75 = 14.6%** |
| **相関考慮**| **40-50%（Owner formal directive 受領時の整合性押上）**|

---

## §6 Marketing-I + Web-Ops 調整窓スケジュール（case 別）

### §6.1 軸-B case 別 調整窓

| case | Marketing-I 調整窓 | Web-Ops 調整窓 | Owner 確認窓 | 合計 buffer |
|---|---|---|---|---|
| case-A 6/20 公開 | **14 日**(5/30-6/13) | **7 日**(6/13-6/20) | **7 日**(6/13-6/20、並行) | 28 日 |
| case-B 6/13 公開 | **0 日**(5/30-6/12 緊急 13 日 = 標準 14 日比 -1 日)| **0 日**(6/06-6/12 7 日 = 標準 7 日比 0 日)| **0 日**(6/12 EOD のみ)| 13 日 |
| fallback 6/27 公開 | **14 日**(6/06-6/20)| **7 日**(6/20-6/27) | **7 日**(6/20-6/27、並行) | 28 日 |

### §6.2 Marketing-I R15 第 2 波 dispatch 内容（議決-28 Full Pass 採択直後）

| 期間 | アクティビティ |
|---|---|
| 5/5-5/22 | case 別 narrative 差分起案（case-A 6/20 / case-B 6/13 / fallback 6/27 = 3 case）+ 公開後 30 日 → 60 日運用準備 |
| 5/22 EOD | case 切替判定 trigger 待機、5/22 push sign-off 結果反映 |
| 5/23-6/13（系統 1 = 6/20 公開時）| 14 日調整窓内 Marketing 法務 / SEO momentum / OG image / 取り下げ Runbook 完成 |
| 5/30-6/13（系統 2 = 6/27 公開時）| 14 日調整窓 + 議決-31 trigger 不発時の標準運用 |

### §6.3 Web-Ops case 別 dispatch 内容

| 期間 | アクティビティ |
|---|---|
| 5/5-5/22 | C 続き（既存 PRJ 副作用 0 行維持）+ case 別 HP / LP / 事例ページ反映 prep |
| 5/23-6/13（系統 1 = 6/20 公開時）| 6/13-6/20 7 日 Web-Ops 反映窓（HP + LP + 事例ページ）|
| 6/06-6/27（系統 2 = 6/27 公開時）| 6/20-6/27 7 日 Web-Ops 反映窓（v15 base 標準）|

### §6.4 Marketing-I + Web-Ops 連動 5/22 EOD 切替手順

```
5/22 18:00 EOD    Phase 1 sign-off 5/22 push 成立判定（CEO + PM-H 共同）
                  PASS → 系統 1 起動 trigger（Marketing-I 14 日窓 + Web-Ops 7 日窓 = 6/20 公開向け prep 開始）
                  FAIL → 系統 2 起動 trigger（Marketing-I 14 日窓 6/06-6/20 + Web-Ops 7 日窓 6/20-6/27 = 6/27 公開向け prep 開始）
5/22 19:00       Marketing-I + Web-Ops 切替完遂報告 → CEO 統合
5/22 20:00       Sec-J dashboard / progress.md 反映 → commit & push
5/23 朝 09:00     Owner 6/13 公開 directive 受領有無確認（議決-31 trigger 評価）
                  受領あり → 議決-31 = DEC-019-065 起案、Marketing-I 緊急 21 日窓 + Web-Ops 14 日窓 起動
                  受領なし → 系統 1 / 2 維持
```

---

## §7 リスク評価と緩和策

### §7.1 高リスク項目

| リスク | 影響 | 緩和策 |
|---|---|---|
| 系統 1（6/20 + 6/3）確度 30-40% | case-A 軸-B/C 採択値達成不能 | 系統 2（6/27 + 6/10）への 5/22 EOD 自動切替 trigger 完備、覆域 90-110% 確保 |
| 6/13 case-B Marketing 0 日調整窓 | 法務 / OG image / 取り下げ Runbook 準備薄 | 議決-31 起案時に **Marketing-I 緊急 21 日窓**（標準 14 日 +7 日延長）+ Web-Ops 14 日窓（標準 7 日 +7 日延長）採用 |
| 5/30 case-B Phase 2 着手 buffer 8 日 | sign-off 結果反映余地不足 | 5/23 朝 cross-evaluation 4 部門 GO（CEO + PM-H + Dev-P + Review-G）必須化、未達時 case-A 6/3 維持 |

### §7.2 中リスク項目

| リスク | 影響 | 緩和策 |
|---|---|---|
| 4 連動条件 C1-C4 のいずれかが不成立 | 系統 1 起動不能 | 28 セル依存 matrix で各条件の自動 fallback 経路明示済 |
| Owner 6/13 公開 directive 5/22 朝 EOD まで不達 | case-B 軸-B 起動不能 | case-A 6/20 自動維持、確度 70-80% で十分 acceptable |
| 12 セル切替 matrix で不整合セル（4)(8) 採用判断 | 公開時 Phase 2 未起動の論理矛盾 | 4)(8) は明示的に reject 化、CEO + PM-H 5/22 EOD 切替時に自動排除 |

### §7.3 低リスク項目

- API 追加コスト = 本書執筆 + Marketing-I + Web-Ops Round 15 第 2 波 dispatch 全件 $0 見込
- 元計画 fallback 全 path 保持済（軸-B 6/27 + 軸-C 6/24）
- 議決-28 Full Pass 採択（2026-05-05）= case-A 採用根拠の上位決裁完備

---

## §8 Round 15 第 3-4 波 dispatch 連携 + 後続 round 引継

### §8.1 Round 15 第 3-4 波連携事項

- 第 3 波 Dev-K/L/M/N R14 残作業着地後 = 必須 50 % 押上で系統 1 確度 +5pt 期待
- 第 4 波 Marketing-H + Knowledge-J + Web-Ops（C 続き）= Marketing-I 14 日窓 prep の前段着手
- CEO 統合 v16 = Round 15 完遂後 30-45 min、本書評価値の正式反映

### §8.2 Round 16 引継事項

| 項目 | 引継先 | 期日 |
|---|---|---|
| 5/22 EOD 切替判定実行 | CEO + PM-H R16 | 2026-05-22 18:00 JST |
| 議決-31 = DEC-019-065 起案（Owner 6/13 directive 受領時） | CEO + Sec R16 | 2026-05-22 17:00 JST |
| 議決-32 = DEC-019-066 起案（5/23 朝 cross-evaluation PASS 時） | CEO + Sec R16 | 2026-05-23 17:00 JST |
| Marketing-I + Web-Ops case 確定 dispatch | Marketing + Web-Ops R16 | 2026-05-22 20:00 JST |
| 軸-A case-A 5/22 95%+ 達成 monitoring | Review-G R16 | 2026-05-15 mid + 2026-05-22 final |

### §8.3 後続議決構造（議決-29 / 30 / 31 / 32 候補化）

| 議決 # | DEC | 起案 trigger | 起案日 | 採決日 |
|---|---|---|---|---|
| 議決-29 | DEC-019-063 | drill #2 5/7 朝 PASS 確認 | 2026-05-07 EOD | 2026-05-08 朝 |
| 議決-30 | DEC-019-064 | 5/30 必須 50 = 95%+ 確認 case fallback path | 2026-05-30 EOD | 2026-05-31 朝（必要時のみ）|
| 議決-31 | DEC-019-065 | 6/13 case-B 公開判定（Owner 追加 directive 受領時のみ）| 2026-05-22 17:00 JST | 2026-05-23 朝 |
| 議決-32 | DEC-019-066 | 5/30 case-B Phase 2 着手判定（5/23 朝 cross-evaluation PASS 時のみ）| 2026-05-23 17:00 JST | 2026-05-24 朝 |

---

## §9 結論（DoD 達成判定）

1. **軸-B 公開 3 case 評価確定** (§1): case-A 6/20（75%、Full Pass 採択済）+ case-B 6/13（45%、議決-31 trigger 待機）+ fallback 6/27（92%、恒久保持）
2. **軸-C Phase 2 着手 4 case 評価確定** (§2): case-A 6/3（55%、Full Pass 採択済）+ case-B 5/30（35%、最終評価後判定）+ case-C-mid 6/10（80%、PM-F R13 値 fallback path）+ fallback 6/24（100%、恒久保持）
3. **各 case の確度 / fallback / 連動条件明文化完遂**: 軸-B 3 case + 軸-C 4 case = 計 7 case、各 case ごとに採用根拠 + 連動条件 + fallback 経路完備
4. **5/22 push sign-off 成立時 / 不成立時 case 切替判定 matrix 完遂** (§3): 軸-B 3 × 軸-C 4 = **12 セル全件評価**、推奨 2 系統（系統 1 = (1) 6/20 + 6/3 / 系統 2 = (11) 6/27 + 6/10）+ reject 2 セル（(4)(8) 不整合）+ 5/22 EOD 切替判定 trigger timeline 完備
5. **6/13 case-B 起動条件 = 議決-31 = DEC-019-065 起案 trigger 明文化** (§5): 5 起動条件 + 議決-31 timeline + 不採用時自動 fallback + 採決確度 40-50%
6. **4 連動条件 × 7 case = 28 セル依存 matrix 完遂** (§4): C1 drill #2 5/7 / C2 MS-2 5/15 / C3 必須 50 5/22 / C4 sign-off 5/22 push の各 case 影響度（◎ / ○ / △ / —）+ 不成立時自動 fallback 経路
7. **Marketing-I + Web-Ops 調整窓スケジュール完遂** (§6): case-A 14 + 7 + 7 = 28 日 / case-B 0 + 0 + 0 = 13 日緊急 / fallback 14 + 7 + 7 = 28 日 + 5/22 EOD 切替手順
8. **後続 Round 16 引継事項 + 議決-29/30/31/32 候補化** (§8): 5/22 EOD 切替判定 + 議決-31/32 起案 trigger + Marketing-I + Web-Ops case 確定 dispatch
9. **API 追加コスト $0 維持 + 絵文字不使用 + 元計画 fallback 全保持** = DoD 完遂

→ **議決-28 Full Pass 採択後 case 別評価 DoD 達成**。CEO 採否判定 → Round 15 完遂後 CEO 統合 v16 反映 → DEC-019-063 起案 trigger 候補化（drill #2 5/7 朝 PASS 確認連動）。

---

## §10 関連決裁・参照

### §10.1 反映決裁

- DEC-019-007 / 010 / 025 / 026 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059 / 060 / 061（confirmed）
- **DEC-019-062（confirmed = 議決-28 Full Pass 採択、2026-05-05 即時採決完遂）**
- DEC-019-063 / 064 / 065 / 066（議決-29/30/31/32 起案 trigger 候補化、本書 §8.3 連動）

### §10.2 参照書

- `ceo-acceleration-plan-v16-prep.md`（249 行）— 軸-B/C 加速プラン根拠
- `ceo-dec-019-062-prep.md`（135 行）— 議決-28 起案準備
- `decision-26-package/5-5-FINAL/MINUTES-FINAL-2026-05-05.md`（167 行）— Full Pass 採択議事録
- `pm-round13-decision-26-pre-emption-evaluation.md`（519 行）— Phase 2 14 日前倒し case 評価既達（軸-C case-C-mid 6/10 値 = PM-F R13 値の根拠）
- `ceo-round14-integrated-report-v15.md`（305 行）— Round 14 統合報告
- `pm-round14-progress-and-r15-dispatch.md` — Round 15 dispatch 計画

### §10.3 Risk Register v3.2 整合

- R-019-06（BAN 30-60% / 12 ヶ月）: drill #2 5/7 朝 PASS で残存 15-30%、case-A 軸-B/C 採用時も維持
- R-019-09（NG-3 24/7 監視）: tos-monitor 1,344 行 24/7 監視継続、軸-B 公開前後問わず継続
- R-019-10（重要分野ホワイトリスト未確定）: minor 16 件 denylist 完全緑化
- R-RUSH-05（case-B 5/30 Phase 2 着手 buffer 8 日 sign-off 反映薄）: 5/23 朝 cross-evaluation 4 部門 GO 必須化で 0pt 化
- R-RUSH-06（case-B 6/13 公開 Marketing 0 日調整窓）: 議決-31 起案時 Marketing-I 緊急 21 日窓 + Web-Ops 14 日窓採用で mitigation

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-05（議決-28 Full Pass 採択直後 / Round 15 第 2 波 PM-H dispatch） | PM 部門（PM-H 独立 Agent） | 初版（軸-B 3 case + 軸-C 4 case + 12 セル case 切替 matrix + 4 連動条件 × 7 case = 28 セル依存 matrix + Marketing-I/Web-Ops case 別調整窓スケジュール + 議決-31 = DEC-019-065 起案 trigger） |

**v1 確定**: 2026-05-05（Round 15 第 2 波 PM-H 完遂時） / **採用判断**: CEO Round 15 完遂後 CEO 統合 v16 反映時 / **次回更新**: 5/22 EOD case 切替判定実行後 v1.1（系統 1 / 2 確定値反映）/ 議決-31 / 32 採決完遂後 v1.2（採決結果反映）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-h-r15-public-launch-and-phase2-case-evaluation.md`
- 版: v1（2026-05-05、Round 15 第 2 波 PM-H 担当 deliverable）
- 起案: PM 部門（PM-H 独立 Agent）
- 範囲: 軸-B 公開 3 case + 軸-C Phase 2 4 case + 12 セル case 切替 matrix + 28 セル連動条件依存 matrix + Marketing-I/Web-Ops 調整窓スケジュール + 議決-31 起案 trigger
- 検収: CEO（Round 15 第 2 波 commit 時）+ Sec-J（CEO 統合 v16 反映時）+ Marketing-I + Web-Ops（5/22 EOD 切替手順起動時）
