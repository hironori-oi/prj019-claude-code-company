# 議決-26 採決議事録テンプレ — 5/5（火）09:00-09:45 JST 採決当日記入用 skeleton

> **5/5 朝 06:00 採決 / drill #2 = 5/7 朝分離**
> **発行日**: 2026-05-04 深夜終盤（Round 14 Secretary-I 起票）
> **使用日**: 2026-05-05（火）09:00-09:45 JST 採決当日
> **担当**: Secretary 部門（5/5 朝採決当番）
> **status**: **5/5 朝 06:00 JST 配布 ready 状態**（採決時 Sec が即座記入）
> **連動 DEC**: DEC-019-060 confirmed + DEC-019-061 confirmed
> **行数**: 約 160 行

---

## §0 概要

5/5（火）09:00-09:45 JST 採決当日に Secretary が即座記入可能な議事録 skeleton。採決結果 4 case（Full Pass / Conditional / Partial / Reject）別の即時切替記入欄完備、採決終了後 5 分以内に finalize して dashboard / progress.md / Slack monitor channel へ反映。

---

## §1 議事録ヘッダ（採決当日記入）

| 項目 | 値 |
|---|---|
| 議決 ID | 議決-26 + 議決-27 |
| 採決日時 | 2026-05-05（火）09:00-09:45 JST |
| 議長 | CEO |
| 採決者 | Owner |
| 議事録担当 | Secretary 部門（採決当日当番）|
| 出席者 | Owner / CEO / Secretary（その他部署 = 必要時 background dispatch）|
| 配布資料 | 5-5-FINAL bundle 16 件（INDEX.md 経由）|
| 連動 DEC | DEC-019-060 confirmed / 061 confirmed |
| drill #2 検証日 | **5/7（木）06:00-08:00 JST 分離実機検証**（Review-F R14 担当、5/5 採決と切離）|
| 採決確度（v15）| 88% |
| Owner 残動作 | 2 件（5/5 採決 + 6/26 公開最終確認）|

---

## §2 議事フロー記録（45 分版、即座記入）

| 時刻 | アクション | 記録欄 |
|---|---|---|
| 09:00 | 開始挨拶 + Owner 出席確認 | Owner 出席: ☐ ／ 開始時刻: __:__ |
| 09:03 | 議決-26 採択前提 5 軸 status 確認（5/5 時点値）| 軸-1 ☐ / 軸-2 ☐ / 軸-3 ☐ / 軸-4 ☐ / 軸-5 ☐ |
| 09:13 | drill #2 5/7 朝分離実機検証計画報告 | Owner 受領: ☐ ／ 質疑: __ |
| 09:18 | 議決-26 採決 | 結果: ☐ Full Pass / ☐ Conditional / ☐ Partial / ☐ Reject |
| 09:25 | 議決-27 acknowledge（DEC-019-058〜061 連動）| Owner acknowledge: ☐ |
| 09:32 | Owner 質疑応答 + Round 15 dispatch 方針確認 | 質疑記録: __ |
| 09:42 | 終了 + 議事録 finalize | 終了時刻: __:__ |

---

## §3 採決結果 4 case 別記入欄（4 case 即時切替）

### §3.0 Owner formal Q1-Q5 回答（5/4 深夜終盤事前受領 — 議決-28 起案根拠）

5/4 深夜終盤に Owner より以下 Q1-Q5 回答を受領済。本回答を根拠として CEO は加速プラン v16-prep 起票 + DEC-019-062 起案準備 + 議決-28 として追加採決対象化を実施。5/5 朝採決時は本回答を議事録に正式記録した上で議決-28（加速 4 軸採択 + Round 15 dispatch authorization）を採決対象とする。

| Q | 確認事項 | Owner 回答 | CEO 翻訳 |
|---|---|---|---|
| Q1 | 必須 50 = 80% pre-emption の 5/30 = 95%+ roadmap 維持で良いか | 「早く進められるものは早く進めましょう」 | **roadmap 加速** = 5/30 → 5/22 push（CEO 推奨 case-A、確度 60-70%）|
| Q2 | Round 14 partial 6 件の Round 15 移行で良いか | 「早く進められるものは早く進めましょう」 | **5/5 採決後 09:30 JST 即時 Round 15 dispatch**（rate limit 09:00 解除直後）|
| Q3 | 5/15 MS-2 trial の Owner 拘束時間 0 分（Sec-I 運営代行）で良いか | 「よい」 | **確定** = 不変運用 |
| Q4 | 6/27 朝公開時刻 09:00 JST 維持で良いか | 「早く進められるものは早く進めましょう」 | **公開前倒し** = 6/27 → 6/20（CEO 推奨 case-A、確度 70-80%）|
| Q5 | Phase 2 着手 6/24 → 6/10 14 日前倒し case 採否 | 「もっと早く進められるものは早く進めましょう」 | **14 日 + α 前倒し** = 6/10 → 6/3（CEO 推奨 case-A、確度 50-60%）|

**全体 directive**: Q1/Q2/Q4/Q5 全加速 + Q3 維持 = 「最大限の前倒し挑戦、Q3 のみ確定」

**5/5 朝採決時の Sec 記入欄**:
- Q1-Q5 回答受領確認（Owner 再確認 chk）: ☐
- 議決-28 採決対象化合意: ☐
- DEC-019-062 起案準備書（`reports/ceo-dec-019-062-prep.md`）受領: ☐
- 加速プラン v16-prep（`reports/ceo-acceleration-plan-v16-prep.md`）受領: ☐

---

### §3.1 case Full Pass — 議決-26 全 5 軸 PASS で採択

```
採決結果: Full Pass
採択日時: 2026-05-05 09:__:__ JST
Phase 1 W1 着手: 2026-05-10 確定（3 日前倒し）
Phase 1 W2 trial: 2026-05-12 候補化
Phase 1 内部運用着手公式: 2026-05-19 候補化
Phase 1 sign-off: 2026-05-27 候補化（最速 5/19 push case）
Phase 1 公式完了 buffer 終端: 2026-05-31 候補化
Phase 2 着手: 2026-06-10 候補化（基本）/ 2026-06-03 候補化（push）
6/27 朝公開: 維持
議決-27 acknowledge: 完遂
Round 15 dispatch: CEO 統合 v15 + Owner formal directive 受領後即時起動

確度 trajectory v15 → v16 更新:
- 5/12 production readiness: 98% → __ %
- 5/12 MS-2 trial: 88% → __ %
- 5/19 内部運用着手: 88% → __ %
- 5/27 Phase 1 sign-off: 94% → __ %
- 6/27 朝公開: 92% → __ %

DEC-019-062 起票（Phase 1 W1 着手 5/10 確定 + Round 15 dispatch authorization + 加速 4 軸採択）: ☐
dashboard 進捗: 82% → __ %

議決-28（加速 4 軸採択） 採決結果（議決-26 採択時に併合採決）:
- 軸-A 必須 50 = 5/22 95%+ 加速採択: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 5/30 維持）
- 軸-B 公開 6/20 朝前倒し採択: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 6/27 維持）
- 軸-C Phase 2 6/3 着手前倒し採択: ☐ Full Pass / ☐ Conditional / ☐ Reject（fallback 6/10 / 6/24 維持）
- 軸-D Round 15 11 並列 dispatch authorization: ☐ Full Pass / ☐ Conditional（4-8 並列限定） / ☐ Reject（次 round 持越）
```

### §3.2 case Conditional — 議決-26 採択（drill #2 5/7 朝結果 conditional）

```
採決結果: Conditional（drill #2 5/7 朝実機検証 PASS で本確定、Reject で 5/8 元計画 fallback）
採択日時: 2026-05-05 09:__:__ JST
Phase 1 W1 着手: 2026-05-10 確定（drill #2 5/7 PASS で確定、Reject で 5/13 元計画維持）
drill #2 5/7 朝実機検証結果: 5/7 朝 08:00 で確定（PASS / Reject 即時通知）
fallback path: drill #2 Reject 時 = Phase 1 W1 着手 5/13 元計画維持
議決-27 acknowledge: 完遂
Round 15 dispatch: drill #2 5/7 朝結果待ち、PASS で即時起動 / Reject で再評価

確度 trajectory v15 → v16 更新:
- 5/12 MS-2 trial: 88% → __ %（drill #2 結果次第）
- その他: drill #2 PASS で v15 維持、Reject で 5/8 元計画 v13 値復元

DEC-019-062 起票（Phase 1 W1 conditional 着手 + drill #2 5/7 朝結果次第）: ☐
dashboard 進捗: 82% → __ %（drill #2 結果次第）
```

### §3.3 case Partial — 議決-26 部分採択（軸-3 必須 50 進捗のみ猶予）

```
採決結果: Partial（軸-1/2/4/5 PASS、軸-3 = 5/30 議決-30 で再採決）
採択日時: 2026-05-05 09:__:__ JST
Phase 1 W1 着手: 2026-05-13 元計画維持（軸-3 5/30 確定後 push 評価開始）
軸-3 必須 50 ctrl 5/30 議決-30: 議決対象、Round 15 Review-G が R14 Review-F 引継加速
Phase 1 sign-off: 5/30 → 5/30 議決-30 結果反映（最速 5/22 push case 評価は 5/30 後）
議決-27 acknowledge: 完遂
Round 15 dispatch: 軸-3 加速 dispatch authorization

確度 trajectory v15 → v16 更新:
- 5/30 必須 50 = 95%+: 94% → __ %（議決-30 結果次第）
- 5/30 Phase 1 sign-off: 94% → __ %
- 6/27 朝公開: 92% → __ %（軸-3 影響限定的）

DEC-019-062 起票（議決-26 部分採択 + 軸-3 5/30 議決-30 連動 + Round 15 dispatch）: ☐
dashboard 進捗: 82% → __ %
```

### §3.4 case Reject — 議決-26 否決 = 5/6 case fallback 切替

```
採決結果: Reject
否決日時: 2026-05-05 09:__:__ JST
否決理由: __（Owner 申告内容を記録、Sec 即座記入）
fallback 連鎖: 5/6 case 自動切替（5-6-case-patch/ + base 13 件 配布、5/6 朝 06:00 JST）
5/6 採決確度: 80%（v14、Round 13 Secretary-H 評価値、Round 14 完遂で 80→82-85% 想定）
Phase 1 W1 着手: 5/13 元計画維持（5/6 採決時 = 1 日前倒し → 5/12 候補化）
6/27 朝公開: confidence 92% 維持
議決-27 acknowledge: 5/6 採決時に同時 acknowledge
Round 15 dispatch: 5/6 採決後即時起動

確度 trajectory v15 → v16 更新（5/5 否決 = v14 5/6 case 値復元）:
- 5/6 議決-26 採択: 80%
- 5/12 production readiness: 98% → 98%（不変）
- 6/27 朝公開: 92% → 92%（不変）

DEC-019-062 起票（5/5 議決-26 否決 + 5/6 case 自動切替 + Round 15 dispatch）: ☐
dashboard 進捗: 82% → 82%（不変、5/6 採決確定後 +1pt）
```

---

## §4 議事録 finalize 手順（採決終了 5 分以内）

1. §3 で該当 case の記入欄を確定（4 case のうち 1 case のみ確定、他 3 case は削除）
2. §1 議事録ヘッダ（採決時刻 / Owner 出席 / 出席者 / 採決確度実績）を記入
3. §2 議事フロー記録の各時刻 / チェックボックスを確定
4. dashboard 進捗反映（82% → 採決後 +1pt 想定 = 83% / Reject 時 = 82% 維持）
5. progress.md v15 末尾 append（採決結果 + DEC-019-062 起票 + Round 15 dispatch）
6. Slack monitor channel に「5/5 議決-26 採決完遂、結果 = ____, DEC-019-062 起票完遂」投稿
7. CEO 統合 v15 確定版発行（採決結果反映）
8. 議事録 commit & push（standalone repo + parent dashboard 双方）

---

## §5 採決後 30 分以内の Round 15 dispatch trigger

case 別 trigger（議決-26 + 28 採決結果連動）:
- **Full Pass + 議決-28 Full Pass**: Round 15 11 並列即時起動（Sec-J 起票 + 高優先 4 並列 + 中優先 4 並列 + 低優先 3 並列、stagger 30-45 min、5/5 09:30 → 16:00 着地想定）
- **Full Pass + 議決-28 Conditional**: Round 15 4-8 並列起動（高優先 4 並列のみ、中/低優先は次 round 持越）
- **Conditional**: Round 15 prep 起動 + drill #2 5/7 朝結果次第 confirm + 議決-28 採択分のみ並行
- **Partial**: Round 15 軸-3 加速 dispatch 即時起動 + 議決-28 採択分のみ並行
- **Reject**: Round 15 = 5/6 朝採決準備 dispatch（Round 14 → Round 15 連結加速、議決-28 全 reject 扱い）

---

## §6 Footer

- **発行**: 2026-05-04 深夜終盤（Round 14 Secretary-I 担当 → CEO 2026-05-05 朝 05:30 JST 想定で §3.0 Owner Q1-Q5 + §3.1 議決-28 採決欄 + §5 議決-28 連動 trigger を追記）
- **位置付け**: 5/5-FINAL bundle 採決議事録 skeleton（Secretary 専用、採決当日記入）
- **行数**: 約 200 行（120-220 行 spec 準拠、Owner Q1-Q5 + 議決-28 採決反映）
- **絵文字**: 不使用
- **DoD 完遂**: ① 4 case 別記入欄完備 ② finalize 手順 8 step 完備 ③ Round 15 dispatch trigger 4 case 別 + 議決-28 連動完備 ④ 議事フロー 45 分版反映完備 ⑤ Owner Q1-Q5 事前回答セクション完備 ⑥ 議決-28（加速 4 軸採択）採決欄完備
