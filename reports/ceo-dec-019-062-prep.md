# DEC-019-062 起案準備書 — Round 15 dispatch authorization + 加速 4 軸採択

**作成日時**: 2026-05-04 深夜終盤 → 2026-05-05 朝 05:30 JST 想定
**起票**: CEO（Owner formal Q1-Q5 回答受領後の即時起案準備）
**status**: **5/5 朝 09:00 議決-26 採決時に Owner 受領 + 議決-28 として追加採決対象化、09:30 JST formal 起票予定**
**連動 DEC**: DEC-019-058 / 059 / 060 confirmed / 061 起票 / **062 起案準備（本書）**
**行数**: 約 110 行

---

## §0 概要

Owner formal Q1-Q5 回答（5/4 深夜終盤受領、Q1/Q2/Q4/Q5 全加速 + Q3 確定維持）を受け、Round 15 11 並列 dispatch authorization + 加速 4 軸採択を DEC-019-062 として 5/5 朝採決時に議決-28 として追加採決対象化する起案準備書。5/5 09:30 JST 採決後 formal 起票予定。

---

## §1 起案趣旨

| 項目 | 内容 |
|---|---|
| DEC ID | DEC-019-062 |
| タイトル | Round 15 11 並列 dispatch authorization + 加速 4 軸採択 + 議決-28 連動 |
| 起票区分 | 議決-28（5/5 朝採決時に議決-26 / 27 と並行採決対象） |
| 起案者 | CEO |
| 採決者 | Owner |
| 起票予定日時 | 2026-05-05 09:30 JST（議決-26 採決後 30 分以内、Sec-J 起動と同時） |
| 連動文書 | `reports/ceo-acceleration-plan-v16-prep.md`（軸-A/B/C/D 詳述）+ `reports/ceo-round14-integrated-report-v15.md`（前提状況） |
| 採決確度 | **80-88%**（議決-26 採択前提下、加速 case 個別選択可能） |

---

## §2 採択内容（4 軸 + 1 dispatch authorization）

### §2.1 軸-A: 必須コントロール 50 加速

- **採択値**: 5/22 = 95%+ 達成（CEO 推奨 case-A、確度 60-70%）
- **fallback**: 5/30 = 95%+ 達成（v15 元計画、確度 92-94%）
- **採択フラグ**: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 維持）

### §2.2 軸-B: 6/27 朝公開前倒し

- **採択値**: 6/20（土）朝 09:00 JST 公開（CEO 推奨 case-A、確度 70-80%）
- **fallback**: 6/27（土）朝 09:00 JST 公開（DEC-019-026 元計画、確度 92%）
- **採択フラグ**: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 維持）

### §2.3 軸-C: Phase 2 着手前倒し

- **採択値**: 6/3（水）着手（CEO 推奨 case-A、確度 50-60%）
- **fallback**: 6/10（火）着手（PM-F R13 評価値 case、確度 75-85%）/ 6/24（火）着手（DEC-019-007 元計画、確度 100%）
- **採択フラグ**: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 維持）

### §2.4 軸-D: Round 15 11 並列 dispatch authorization

- **採択値**: 5/5 採決後 09:30 JST 即時 Round 15 11 並列 dispatch 起動
- **dispatch 内訳**: Dev-K/L/M/N（R14 残）+ Dev-P（軸-A 加速、新規）+ Review-G（軸-A 加速 case 評価、新規）+ PM-H（軸-B/C 加速 case 評価、新規）+ Marketing-I（軸-B 加速 narrative、新規）+ Marketing-H + Knowledge-J（R14 残）+ Sec-J（DEC-019-062 起票） = 11 並列 + CEO 統合 v16
- **段階 dispatch**: Sec-J + 高優先 4 並列（Dev-P/Review-G/PM-H/Marketing-I）→ 中優先 4 並列（Dev-K/L/M/N）→ 低優先 3 並列（Marketing-H/Knowledge-J/Web-Ops）= 各 stagger 30-45 min、5/5 09:30 → 16:00 着地想定
- **採択フラグ**: ☐ Full Pass（全 11 並列）/ ☐ Conditional（4-8 並列限定）/ ☐ Reject（Round 14 partial 6 件 next round 持越）

---

## §3 議決-28 採決前提条件

- [x] 議決-26 採択（5 軸 PASS 想定、確度 88%）
- [x] 議決-27 acknowledge（DEC-019-058〜061 連動）
- [x] Owner Q1-Q5 回答受領（5/4 深夜終盤完遂）
- [x] CEO 加速プラン v16-prep 配布（5/5 06:00 JST、本書同時配布）

---

## §4 採用根拠 13 件

DEC-019-061 採用根拠 11 件継承 + Owner Q1-Q5 加速回答 2 件追加 = 13 件:

1. W3 中核 22 日前倒し既達
2. 7 部署 12 経路 cross-validation 収斂維持
3. 議決-26 採択 5 軸全 PASS roadmap 確定
4. Owner 残動作 2 件のみ
5. API 追加コスト累計 $0
6. Owner formal「最速」directive 継続中
7. Owner formal 議決前倒し新 directive 受領
8. Round 12-13 完遂着地で軸-1/2/3 が事実上 PASS 化
9. workspace test 614→791→911 pass の堅牢性確証
10. Owner 採決日 5/5 確定 directive
11. 必須 50 = 70→80% pre-emption（Round 13 Dev-J KE 系 5/5 件完遂）
12. **【新規】Owner formal Q1/Q2/Q4/Q5 加速 directive**（5/4 深夜終盤受領）
13. **【新規】Owner Q3 維持 directive**（MS-2 trial 5/15 Owner 拘束 0 分確定 = 加速プランの帯域確保）

---

## §5 リスク評価

| 区分 | リスク | 緩和策 |
|---|---|---|
| 高 | 必須 50 = 5/22 95%+ 達成 60-70% 確度 | case-A（5/22）採用、case-B 5/15（35-45%）は次選、fallback 5/30（92-94%）保持 |
| 高 | 6/20 公開 = drill #2 結果反映 13 日窓 | case-A（6/20、調整窓 1 週間）採用、case-B 6/13（40-50%）は Owner 追加判断必要、fallback 6/27（92%）保持 |
| 高 | Phase 2 6/3 着手 = 5/22 push sign-off 同時 12 日 buffer | case-A（6/3、buffer 12 日）採用、case-B 5/30（30-40%）は最終評価後判定、fallback 6/10/6/24 保持 |
| 中 | Round 15 11 並列 rate limit 再発 | 段階 dispatch（4+4+3 並列、stagger 30-45 min）採用 |
| 中 | API $0 維持 | 全部署 Read/Edit/Write 中心、Round 14 実績 API $0 継続見込 |
| 低 | Owner 議決-28 全件 reject | 全 4 軸 fallback path 保持、Round 15 dispatch 範囲縮小可能 |

---

## §6 5/5 朝 09:30 JST 起票時の formal 化手順

1. 議決-26 + 27 + 28 採決結果を反映した DEC-019-062 row 確定（採択 case 別 14 block 構造）
2. `projects/PRJ-019/decisions.md` に挿入（DEC-019-061 直後）
3. `progress.md` v16 起票（採決結果 + Round 15 dispatch 開始 + 加速 4 軸 status）
4. `dashboard/active-projects.md` 進捗 82% → 83-85%（採決結果次第）
5. Sec-J が Round 15 dispatch を起動 = 高優先 4 並列 → 中優先 4 並列 → 低優先 3 並列
6. CEO 統合 v16 = Round 15 完遂後 30-45 min 起票
7. Slack monitor channel 投稿（5/5 議決-28 採決完遂 + DEC-019-062 起票完遂 + Round 15 dispatch start）
8. commit & push（standalone repo + parent dashboard 双方）

---

## §7 連動 / 後続

- **連動**: DEC-019-058 / 059 / 060 confirmed / 061 起票 / **062 起案準備（本書）→ 5/5 09:30 JST formal 起票**
- **後続**: 議決-30（5/30 必須 50 = 95%+ 確認 case fallback path）/ 議決-31（6/13 case-B 公開判定、Owner 追加 directive 受領時）

---

## §8 Footer

- **発行**: 2026-05-04 深夜終盤 → 2026-05-05 朝 05:30 JST 想定
- **担当**: CEO（Sec-I rate limit 下 CEO 直接実装代替）
- **位置付け**: 5/5 朝採決時に議決-28 として追加採決対象化、09:30 JST 採決後 formal 起票
- **行数**: 約 110 行
- **絵文字**: 不使用
- **DoD 完遂**: ① 加速 4 軸採択フラグ完備 ② 議決-28 採決前提条件 4 件完備 ③ 採用根拠 13 件完備 ④ リスク評価 高/中/低 完備 ⑤ formal 化手順 8 step 完備

---

**END OF DEC-019-062 起案準備書**
