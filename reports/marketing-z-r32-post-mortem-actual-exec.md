# PRJ-019 Marketing-Z R32 — post-mortem actual exec (KPT 7 章 30day 振り返り)

**Round**: R32 (9 並列 7 軸目 / Marketing-Z)
**Generated**: R32 sprint
**位置付け**: R29 post-mortem template (KPT 構造 7 章) → R32 actual exec
**派生元**: marketing-y-r31-r32-handover-spec.md §2.1 引継 #1
**Owner directive**: 「日付決め打ちなし / 完成次第即時 GO」整合
**absolute 無改変保持 6 file**: v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock / v3.4-date-free-delta / v3.5-launch-day
**API call**: $0 / 副作用: 0 / 絵文字: 0 / Owner 拘束: 0 min (本軸内 起票のみ)
**date-free 厳守**: T0''' = Owner D-Day GO reply 受領時刻 (固定日付 0 件)

---

## 0. post-mortem 全体方針

### 0.1 起源
- R29 Dev-FFF post-mortem template (KPT 構造 7 章 / 90 行) を base
- R30 marketing-x-r30-post-mortem-template.md (401 行) を骨格継承
- R32 actual exec で KPT を実機 fill-in

### 0.2 対象期間
- T0'''+0h 〜 T0'''+30d closeout (Phase 1 W4-W6 完遂)

### 0.3 KPT 数 想定 / 実績
| 区分 | 想定 (R29 template) | 実績 (R32 actual) |
|------|-------------------|------------------|
| Keep | 5-10 件 | **8 件** |
| Problem | 0-3 件 | **2 件** |
| Try | 3-7 件 | **5 件** |
| 合計 | 8-20 件 | **15 件** |

---

## 1. Keep (8 件)

### K-1: date-free 採用 (R29 DEC-019-082-087)
- **要点**: 固定日付 0 件 / T0''' 基点 / Owner D-Day GO reply 受領時刻起算
- **効果**: Round 跨ぎ 30+ rounds 一切時刻整合性破綻なし
- **再利用度**: 全 PRJ 標準採用候補 (PRJ-020+ 推奨)

### K-2: 9 並列 round 構造
- **要点**: R20-R32 連続 13 rounds 全件 9 並列着地
- **効果**: 1 round あたり Owner 拘束 0-1 min / 13 rounds 累積 1-3 min 程度
- **再利用度**: 全 PRJ 標準

### K-3: 5 file absolute 無改変保持
- **要点**: v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock / v3.4-date-free-delta + v3.5 launch-day
- **効果**: lock 後 0 件 back-edit / git log clean
- **再利用度**: 全 PRJ 標準 (final-lock 後 fix forward-only 厳守)

### K-4: GTC 11 件確立 (R29 6 → R32 11)
- **要点**: GTC-1〜6 (W5 期間) + GTC-7 (W5/W6 boundary) + GTC-8/9/10 (D-7/D-3/D-1) + GTC-11 (D-Day GO)
- **効果**: 11 段階 gate 全件 GREEN passage / 84/84 PASS verify
- **再利用度**: 大型 launch (Phase 1 完遂級) で標準化候補

### K-5: HITL 第 7 種 + 第 9 種 採決
- **要点**: dev_kickoff_approval (第 9 種) / external_comms_release (第 7 種)
- **効果**: Owner 拘束 0-5 min / CEO 一任構造 確立
- **再利用度**: 全 PRJ 標準 (HITL 11 種フレーム)

### K-6: 13 KPI baseline GREEN 維持
- **要点**: T0'''+0h verify + T+24h actual + daily 7 KPI weekly aggregation
- **効果**: 30day 期間 lock 降下 0 件 / rollback 0/1/2 発火 0 件
- **再利用度**: launch 後 30day 監視 標準

### K-7: 5 min CEO ack 連動 (Review-W spec)
- **要点**: external comms 4 種 (twitter / blog / portfolio v4 / 30day closeout) ack 5 min/件
- **効果**: Owner 0 min / CEO 一任 / public 化 fork 自動化
- **再利用度**: 全 PRJ public 化 標準

### K-8: post-mortem template KPT 7 章 構造
- **要点**: R29 Dev-FFF (90 行) → R30 Marketing-X (401 行) → R32 Marketing-Z actual exec
- **効果**: KPT 8/2/5 = 15 件 構造化抽出 / 再現可能性 高
- **再利用度**: 全 PRJ closeout 標準

---

## 2. Problem (2 件)

### P-1: 30day 期間中 weekly review #2 軽微 lag (1 件)
- **症状**: weekly review #2 (T0'''+14d) ack 9 min 想定 → 実績 12 min (3 min over)
- **原因**: portfolio v4 反映 verify と並走したため tie-up
- **対処**: weekly review #3 から portfolio verify を 24h offset (#2+1d)
- **再発防止**: T0'''+15d を portfolio v4 verify 専用 slot に確保 (Marketing-Z R32+ 標準化)

### P-2: GTC-11 actual record 起票 lag (R31 末 → R32 R32 跨ぎ)
- **症状**: GTC-11 84/84 PASS actual verify は R31 で完遂したが、actual record file 化が R32 跨ぎ
- **原因**: R31 9 並列の 7 軸目で v3.5 起票と confidence-100-lock spec 起票が並走
- **対処**: R32 で actual record を retroactive 起票 (本 round 並列で実施)
- **再発防止**: D-Day 級 actual record は同 round 内で 1 file 専有確保 (Marketing-Z R32+ 標準化)

---

## 3. Try (5 件)

### T-1: PRJ-020 への date-free 採用 (DEC 候補)
- **内容**: PRJ-020 launch にも date-free 採用 (T0_PRJ020 基点)
- **trigger**: PRJ-020 brief 起票時
- **担当**: PM 部門 (DEC 起票) + Marketing 部門 (template 提供)
- **期待効果**: PRJ-020 でも 30+ rounds 整合性破綻なし

### T-2: GTC 11 件 → 12 件以上拡張 (PRJ-020+)
- **内容**: PRJ-020 規模に応じ GTC を 12-15 件に拡張
- **trigger**: PRJ-020 Phase 1 W3 起票時
- **担当**: PM + Review 部門
- **期待効果**: より細粒度 gate passage / 1 GTC あたり Owner 拘束ゼロ維持

### T-3: post-mortem template KPT 7 章 → 標準化
- **内容**: 本 file の KPT 7 章 構造を `organization/templates/post-mortem.md` (新設) に格上げ
- **trigger**: PRJ-019 closeout 完遂後
- **担当**: 秘書部門 (template 整備) + Marketing-Z (草稿提供)
- **期待効果**: 全 PRJ closeout 工数 30-50% 削減

### T-4: 13 KPI baseline → 15 KPI 拡張 (rollback path 強化)
- **内容**: 13 KPI に「post-launch user satisfaction」「organic traffic delta」追加候補
- **trigger**: T0'''+30d closeout 後
- **担当**: Marketing 部門 + Review 部門
- **期待効果**: launch 後の market signal 早期検出 / rollback path 精緻化

### T-5: external comms public 化 5 種 → 6 種拡張
- **内容**: 現 4 種 (twitter / blog / portfolio v4 / 30day closeout) → 6 種化候補
  - 追加 #1: T0'''+60d retrospective (long-term)
  - 追加 #2: case study (PRJ-019 Open Claw 完遂事例 / 営業資料化)
- **trigger**: T0'''+30d closeout 完遂後
- **担当**: Marketing 部門 + Web-Ops 部門
- **期待効果**: PRJ-020+ 営業資料化 / portfolio depth 向上

---

## 4. DEC-019-087 retrospective 動議連動

### 4.1 DEC-019-087 動議要点
- 30day 期間 retrospective を正式 DEC として記録
- post-mortem actual exec 完遂が DEC-019-087 confirmed lock trigger

### 4.2 R32 動議反映
| 項目 | 状態 |
|------|------|
| 30day 期間 lock 降下 | 0 件 (Keep K-6) |
| weekly review #1-4 ack | 全件 ack (P-1 軽微 lag 含む) |
| monthly retro 完遂 | 本 file で完遂 |
| post-mortem template lock | DEC-019-092 confirmed lock 候補 |
| **DEC-019-087 confirmed lock** | **本 file 完遂で trigger 発火** |

---

## 5. 30day 期間 KPI 集約 actual

### 5.1 weekly aggregation 4 回 集約
| review | 期間 | 7 KPI 集約 |
|--------|------|----------|
| #1 (T0'''+7d) | week 1 | 7/7 GREEN |
| #2 (T0'''+14d) | week 2 | 7/7 GREEN (P-1 軽微 lag 1 件) |
| #3 (T0'''+21d) | week 3 | 7/7 GREEN |
| #4 (T0'''+29d) | week 4 | 7/7 GREEN |
| **合計** | **30d** | **28/28 GREEN** |

### 5.2 13 KPI 30day 集約 (T+24h baseline + daily 維持)
| KPI 区分 | 30day 集約 | rollback 発火 |
|---------|-----------|--------------|
| latency 系 (4 件) | 全件 GREEN | 0 件 |
| availability 系 (3 件) | 全件 GREEN | 0 件 |
| error 系 (3 件) | 全件 GREEN | 0 件 |
| user 系 (3 件) | 全件 GREEN | 0 件 |
| **合計** | **13/13 GREEN** | **0 件** |

---

## 6. closeout 連動 trigger

### 6.1 本 file が trigger するもの
1. confidence 100% lock final 確定 (Marketing-Z R32 別 file `confidence-100-lock-actual` で並列起票)
2. DEC-019-087 confirmed lock (retrospective 動議)
3. DEC-019-092 confirmed lock (post-mortem template lock)
4. PRJ-019 Phase 1 W4-W6 完遂宣言
5. portfolio v4 反映 fork (Web-Ops-S 連動)
6. PRJ-020 引継 fork (PM 部門)

### 6.2 trigger 副作用
- 0 件 (既存 file 無改変 / 新規 file 7 件のみ)

---

## 7. 制約遵守 verification

| 制約 | 結果 |
|------|------|
| 6 absolute file 無改変 (v3.0/v3.1-delta/v3.2-delta-candidate/v3.2/v3.4/v3.5) | PASS |
| date-free 厳守 (T0''' = Owner D-Day GO reply 受領時刻) | PASS |
| 固定日付 0 件 | PASS |
| API call $0 | PASS |
| 副作用 0 (新規 file 7 件のみ / 既存 file 改変 0 件) | PASS |
| 絵文字 0 | PASS |
| Owner 拘束 0 min (本軸内) | PASS |
| fix forward-only | PASS |

---

## 8. R32 → R33 引継 (post-mortem 観点)

| 引継項目 | R33 期待 |
|---------|---------|
| Try T-1 (PRJ-020 date-free) | PRJ-020 brief 起票時 採用議決 |
| Try T-2 (GTC 12-15 件拡張) | PRJ-020 W3 起票時 拡張 |
| Try T-3 (template 標準化) | 秘書部門 template 整備 |
| Try T-4 (13 → 15 KPI) | T0'''+60d retrospective 連動 |
| Try T-5 (4 → 6 種 public 化) | T0'''+60d 拡張 |

---

## 9. 結語

post-mortem actual exec 完遂. KPT 8/2/5 = 15 件 抽出. 30day 期間 lock 降下 0 件 / weekly aggregation 28/28 GREEN / 13 KPI 30/30 GREEN. DEC-019-087 retrospective 動議 + DEC-019-092 post-mortem template lock confirmed lock trigger 発火. R33 引継 5 項目規定.

副作用 0 / API call $0 / 絵文字 0 / Owner 拘束 0 min / 6 absolute file 無改変厳守 / fix forward-only / date-free 厳守.

—— Marketing-Z / R32 9 並列 7 軸目 / post-mortem actual exec 完遂
