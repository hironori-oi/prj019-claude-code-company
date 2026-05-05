# PM-Y R32 DEC-088-092 candidate 候補 spec レポート

**作成者**: PM-Y (Round 32 / 9 並列 1 軸目)
**作成日時**: 2026-05-06 R32 atomic session
**対象**: post-launch operational SOP formalization 候補 5 件 (DEC-019-088〜092)

**注意事項**: 起案候補 spec のみ R32 / 物理起案は R33+ 引継 (PM-Z + Sec-BB + Web-Ops-R + Marketing-Z + Dev-JJJ の 5 軸並列起案想定)

---

## 1. 全体概要

DEC-093 confirmed (R32) により confidence 100% lock 確定 protocol formal 化完遂。post-confirm SOP 起動 trigger として、5 件の post-launch operational SOP formalization 候補を spec 整備する。R33+ で順次起案 → R34-R38 で順次採決の連続継承 pattern 採用。

| 議決 ID | タイトル | 起案担当 | 起案 round 想定 | 採決 round 想定 |
|---|---|---|---|---|
| DEC-019-088 | W7-B monitoring SOP (1week → 30day 拡張) | Sec-BB | R33 | R34 |
| DEC-019-089 | W7-C retrospective SOP (KPT framework formal 化) | Marketing-Z | R34 | R35 |
| DEC-019-090 | 100% lock 維持 SOP (5 file 無改変 lock 50 round target) | PM-Z | R35 | R36 |
| DEC-019-091 | sec yml md5 不変 50 round target SOP | Sec-BB (2 軸目) | R36 | R37 |
| DEC-019-092 | INDEX-v25 milestone SOP | Web-Ops-R | R37 | R38 |

---

## 2. DEC-019-088 候補 spec: W7-B monitoring SOP (1week → 30day 拡張)

### 2.1 タイトル
PRJ-019 Phase 3 W7-B monitoring SOP 1week → 30day 拡張 formal 化

### 2.2 背景
DEC-019-083 1week monitoring SOP confirmed (R29) を base に、production GA 後の monitoring 期間を 30day まで拡張。13 KPI baseline GREEN を継続維持するための運用 SOP を formal 化。

### 2.3 spec 候補 (5 件)
- ① 30day monitoring 13 KPI baseline 継続検証 (1week 着地値 base / 7day → 14day → 21day → 30day の 4 段階確認 trigger)
- ② alert threshold 段階引き締め: 1week (緩和) → 30day (本番閾値) への段階遷移
- ③ rollback trigger 5/7 採用継承 + 30day 期間中の追加 trigger (latency p99 / error rate / 13th KPI sec audit log retention)
- ④ Sentry 実発火 + 月次 budget alert atomic (DEC-081 base) の 30day 期間 retention 検証
- ⑤ post-30day → continuous monitoring SOP 切替 trigger (DEC-091 連動)

### 2.4 起案担当
Sec-BB (R33 起案 / R34 採決)

---

## 3. DEC-019-089 候補 spec: W7-C retrospective SOP (KPT framework formal 化)

### 3.1 タイトル
PRJ-019 Phase 3 W7-C post-launch retrospective SOP KPT framework formal 化

### 3.2 背景
DEC-019-087 (R32 起案 / R33 採決想定) の post-launch 30day retrospective KPT 統合を base に、retrospective SOP を formal 化。KPT framework の運用詳細 + knowledge/patterns/ 統合 SOP を spec 化。

### 3.3 spec 候補 (5 件)
- ① KPT framework 起動 trigger formal 化: GTC-11 GREEN T+30day で Marketing-Z 主導 retrospective session 起動
- ② KPT 統合 4 軸 (13 KPI + sec audit log + GTC trajectory + DEC lineage) の評価 metric formal 採用
- ③ Try (改善事項) → 次案件 (PRJ-020+) 横展開 SOP 整備
- ④ knowledge/patterns/ 統合 PII redaction 自動化 (HITL 第 11 種 knowledge_pii_review 連動)
- ⑤ DEC 系列 closeout 動議の retrospective session 内採決 pattern 採用

### 3.4 起案担当
Marketing-Z (R34 起案 / R35 採決)

---

## 4. DEC-019-090 候補 spec: 100% lock 維持 SOP (5 file 無改変 lock 50 round target)

### 4.1 タイトル
PRJ-019 100% lock 維持 SOP (5 file 無改変 lock 50 round target / R32+ R82 まで)

### 4.2 背景
DEC-093 confirmed (R32) で confidence 100% lock 確定 protocol formal 化完遂。100% lock 維持のための 5 file 無改変 lock を 50 round target で運用する SOP を formal 化。

### 4.3 spec 候補 (5 件)
- ① 5 file 無改変 lock 対象明示: (a) decisions.md line 1-2270 (b) sec yml 12 file (md5 不変) (c) 既存 absolute 4 file (d) R27 5b test (e) R28 5c+5d test
- ② 50 round target 期間: R32 → R82 (50 round) で lock 維持 + R83+ で再評価議決起案
- ③ 違反検知 SOP: round 毎の md5 hash 検証 + line count 検証 + diff 検証の 3 段 trigger
- ④ forward-only 厳守: 修正は append-only / 既存 absolute 領域は一切無改変
- ⑤ 50 round milestone 達成時の confidence 数値遷移 formal 記録 (100% → 100% lock-stable)

### 4.4 起案担当
PM-Z (R35 起案 / R36 採決)

---

## 5. DEC-019-091 候補 spec: sec yml md5 不変 50 round target SOP

### 5.1 タイトル
PRJ-019 sec yml 12 file md5 不変 50 round target SOP formal 化

### 5.2 背景
sec automation 12 file の md5 hash を R32+ R82 まで 50 round target で不変維持する SOP を formal 化。DEC-019-025 (background dispatch SOP) + DEC-093 100% lock 確定 protocol との連動。

### 5.3 spec 候補 (5 件)
- ① sec yml 12 file 明示: (a) workflow yml 6 file + (b) action yml 4 file + (c) config yml 2 file (具体名は R36 起案時に明示)
- ② md5 hash 検証 trigger: round 毎の自動 md5 計算 + R31 着地値との diff 検証
- ③ 違反検知時 SOP: 即時 rollback + Sec 部門 escalate + decisions.md 末尾 incident report append-only
- ④ 50 round milestone 達成時の sec 系列 archive 化判定 (active → archived 遷移議決起案)
- ⑤ T-5 monitor 連続 round PASS milestone 連動 (現状 R32 で連続 18 round PASS 達成見込)

### 5.4 起案担当
Sec-BB (R36 起案 / R37 採決) ※2 軸目

---

## 6. DEC-019-092 候補 spec: INDEX-v25 milestone SOP

### 6.1 タイトル
PRJ-019 knowledge INDEX-v25 milestone SOP formal 化

### 6.2 背景
INDEX-v16 (168 entries / R28 着地) → INDEX-v17-v24 (R29-R32 漸進拡張想定) → INDEX-v25 milestone を formal 化。knowledge/patterns/ + decisions/ + pitfalls/ の構造化蓄積機構 (DEC-019-033 拡張) の安定運用 SOP。

### 6.3 spec 候補 (5 件)
- ① INDEX-v25 milestone 達成条件: (a) entries 250+ (b) patterns/ 50+ (c) decisions/ 50+ (d) pitfalls/ 50+ (e) PII redaction 0 件未処理
- ② 達成 round 想定: R37-R38 (本 SOP 採決 round と同期)
- ③ entries 1 件あたりの YAML frontmatter 必須フィールド明示 (prj_id / phase / tags / created_at / pii_redacted / lineage)
- ④ knowledge retrieval 機構の自動引用 SOP (PRJ-019 Open Claw 提案生成時の §(f) 既存ナレッジ参照 自動化)
- ⑤ INDEX-v25 達成後の v26+ 拡張議決起案 trigger 起動 (R38+ 連続継承)

### 6.4 起案担当
Web-Ops-R (R37 起案 / R38 採決)

---

## 7. 起案 round + 採決 round timeline

```
R32 (本 round) : DEC-093 confirmed + DEC-087 DRAFT 起案 + DEC-088-092 candidate spec 整備
R33           : DEC-087 採決 + DEC-088 起案 (Sec-BB)
R34           : DEC-088 採決 + DEC-089 起案 (Marketing-Z)
R35           : DEC-089 採決 + DEC-090 起案 (PM-Z)
R36           : DEC-090 採決 + DEC-091 起案 (Sec-BB 2 軸目)
R37           : DEC-091 採決 + DEC-092 起案 (Web-Ops-R)
R38           : DEC-092 採決 + INDEX-v25 milestone 達成
```

---

## 8. 議決構造遷移想定

| Round | confirmed | DRAFT | 合計 | 備考 |
|---|---|---|---|---|
| R32 着地 | 51 | 1 (DEC-087) | 52 | DEC-093 confirmed + DEC-087 DRAFT |
| R33 着地 | 52 | 1 (DEC-088) | 53 | DEC-087 confirmed + DEC-088 DRAFT |
| R34 着地 | 53 | 1 (DEC-089) | 54 | DEC-088 confirmed + DEC-089 DRAFT |
| R35 着地 | 54 | 1 (DEC-090) | 55 | DEC-089 confirmed + DEC-090 DRAFT |
| R36 着地 | 55 | 1 (DEC-091) | 56 | DEC-090 confirmed + DEC-091 DRAFT |
| R37 着地 | 56 | 1 (DEC-092) | 57 | DEC-091 confirmed + DEC-092 DRAFT |
| R38 着地 | 57 | 0 | 57 | DEC-092 confirmed + INDEX-v25 達成 |

---

## 9. 副作用評価

- 本 R32 round では物理起案なし (spec のみ整備)
- decisions.md への影響: 0 行 (本 spec は report のみ)
- 既存 absolute 4 file: 無改変
- sec yml 12 file md5: 不変
- API call: $0
- Owner 拘束: 0 分

---

## 10. 結論

- DEC-088-092 candidate 5 件 spec 整備完遂 (R32)
- 物理起案は R33+ で順次引継 (5 軸並列起案 pattern)
- 起案 + 採決 timeline 明示 (R33-R38 6 round 想定)
- INDEX-v25 milestone 達成想定 (R38)
- Owner 拘束 0 分維持 / API call $0 / 副作用 0
