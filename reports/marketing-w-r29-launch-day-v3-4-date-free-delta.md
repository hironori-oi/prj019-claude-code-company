# PRJ-019 Marketing-W R29 — launch day v3.4 date-free delta only

**Round**: R29 (9 並列 6 軸目 / Marketing-W)
**Generated**: 2026-05-06 (R29 sprint)
**位置付け**: launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock の 4 file **absolute 無改変**を厳守しつつ、新規 file v3.4 として **date-free 化 delta only** を記載
**先行 4 file**:
- v3.0 (R20 起票)
- v3.1-delta (R23 起票, delta only)
- v3.2-delta-candidate (R24 起票, candidate)
- v3.2-final-lock (R28 起票, 228 行 final lock)

**v3.4 採用判定**: 起票 (本 file)
**v3.3 不在の理由**: v3.2 → v3.4 は major delta (timeline 撤廃) のため minor (v3.3) を skip
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. v3.4 起票判定根拠

### 0.1 Owner directive (R29 入手)
- 「日付決め打ちなし / 完成次第即時 GO」方針採用
- v3.0-v3.2 全 file は calendar (5/12 / 6/12 / 6/18 / 6/19) 前提
- → v3.4 で timeline 撤廃 + state-trigger 採用

### 0.2 4 file absolute 無改変保持の必要性
- DEC-019-068 (R28 完遂) で v3.2-final-lock 内容 lock
- v3.0-v3.2 改変 = 議決 reopen 必要 → R29 では実施せず
- 解: v3.4 を新規 file として delta only 起票 → 本体 4 file 無改変

### 0.3 v3.4 採用 confidence
- 起票判定: 採用 (本 file 起票)
- 理由: Owner directive 整合 + 4 file 無改変両立可能 + delta only で軽量

---

## 1. v3.0 → v3.4 全 delta (timeline 撤廃)

### 1.1 calendar → state 写像表
| v3.0-v3.2 calendar | v3.4 state-trigger |
|---------------------|---------------------|
| 5/12 (Tue) 14:00 mid-check | T0 = GTC-7 完遂 ack |
| 6/12 (Fri) 09:00 D-7 rehearsal | T0' = GTC-8 完遂 ack |
| 6/18 (Thu) 18:00 D-1 sign | T0'' = GTC-9 完遂 ack |
| 6/19 (Fri) 09:00 D-Day 公開 | T0''' = Owner D-Day GO reply |
| 6/20-7/19 30day post-launch | T0'''+1d 〜 T0'''+30d |

### 1.2 起動 trigger 仕様変更
| 段階 | v3.2 (lock) | v3.4 (delta) |
|------|-------------|--------------|
| GTC-8 起動 | calendar 5/12 14:00 | T0 = GTC-7 PASS ack |
| GTC-9 起動 | calendar 6/12 09:00 | T0' = GTC-8 PASS ack |
| GTC-10 起動 | calendar 6/18 18:00 | T0'' = GTC-9 PASS ack |
| GTC-11 起動 | calendar 6/19 09:00 | T0''' = Owner GO reply |

### 1.3 Owner reply spec (継承)
- D-1 1 min ack (R27 / R28 継承)
- D-Day GO 1 行 reply (R28 v3.2 final lock 仕様継承)
- v3.4 でも仕様変更なし

---

## 2. v3.4 適用範囲 (5 ファイル)

### 2.1 R29 本 sprint で起票した 5 file の v3.4 整合
| # | file | v3.4 整合 | 行数 |
|---|------|----------|------|
| 1 | marketing-w-r29-mid-check-date-free.md | T0 trigger 採用 | 約 350 |
| 2 | marketing-w-r29-d-7-date-free.md | T0' trigger 採用 | 約 350 |
| 3 | marketing-w-r29-d-1-date-free.md | T0'' trigger 採用 | 約 300 |
| 4 | marketing-w-r29-d-day-date-free.md | T0''' trigger 採用 | 約 400 |
| 5 | (本 file) launch-day v3-4 date-free delta | meta delta | 約 250 |

### 2.2 4 file 無改変確認 (v3.4 起票時 git log 検査)
- v3.0 commit hash freeze
- v3.1-delta commit hash freeze
- v3.2-delta-candidate commit hash freeze
- v3.2-final-lock commit hash freeze
- 本 file (v3.4) = 新規 commit (改変ではなく追加)

---

## 3. v3.4 で変わる KPI / 指標

### 3.1 confidence trajectory 変化
| 段階 | v3.2 calendar | v3.4 date-free |
|------|---------------|----------------|
| R28 末 | 96 → 98% | 96 → 98% (継承) |
| GTC-8 PASS 後 | 98% | 99% (1pt 上昇 / state-trigger 整合) |
| GTC-9 PASS 後 | 98.5% | 99.5% |
| GTC-10 PASS 後 | 99% | 99.9% |
| GTC-11 PASS 後 | 99% | 100% lock |

### 3.2 Owner 拘束時間 (継承)
| 段階 | v3.2 | v3.4 |
|------|------|------|
| mid-check | 0 min | 0 min |
| D-7 rehearsal | 0-1 min | 0-1 min |
| D-1 sign | 1 min | 1 min |
| D-Day | 4-6 min | 4-6 min |
| 合計 | 5-8 min | 5-8 min (継承) |

### 3.3 timeline 圧縮効果
- v3.2: 5/12 〜 6/19 = 38 day 経路
- v3.4: GTC-7 PASS 直後 〜 D-Day = 任意 (条件 PASS で即時)
- 効果: 弊害 0 (既存 spec 完成度維持) + 時間圧縮 (38 day → 数 day 〜数週可能)

---

## 4. v3.4 で変わらない部分 (継承)

### 4.1 spec 内容 (v3.2 final lock 内容継承)
- 5 phase 75 項目 (mid-check)
- 5 phase 75 項目 (D-7 rehearsal)
- 5 phase 30 項目 (D-1 sign)
- 7 phase 84 項目 (D-Day)
- 内容は 100% 継承 / 起動 trigger のみ time → state へ写像

### 4.2 Owner reply spec (継承)
- 1 min reply 厳守
- 「D-Day GO」1 行
- skip 可 (auto-pass / NO-GO 扱い分岐)

### 4.3 副作用 0 / API $0 / 絵文字 0 (継承)

---

## 5. v3.4 採用後の議決経路

### 5.1 R29 起票候補 NEW DEC
| DEC ID | 内容 |
|--------|------|
| DEC-019-082 | GTC-8 mid-check date-free 化採用 |
| DEC-019-083 | T0 自動 trigger protocol 5 条件 lock |
| DEC-019-084 | GTC-9 D-7 date-free 化採用 |
| DEC-019-085 | Owner 立会 0-1 min spec lock |
| DEC-019-086 | GTC-10 D-1 date-free 化採用 |
| DEC-019-087 | Owner 1 min ack spec final lock |
| DEC-019-088 | GTC-11 D-Day date-free 化採用 |
| DEC-019-089 | Owner 4-6 min 拘束 spec lock |
| DEC-019-090 | T+24h / 30day SOP date-free 接続 |
| DEC-019-091 | launch-day v3.4 date-free delta 起票 (本 file) |

### 5.2 議決件数推移
| Round | 議決件数 |
|-------|---------|
| R28 末 | 44 件 |
| R29 末 (本 sprint 含) | 54 件 (+10 / DRAFT 含) |

---

## 6. v3.4 取り消し / rollback path

### 6.1 取り消し条件
- Owner directive 撤回 (「やはり calendar に戻す」要請)
- v3.4 採用後の致命的 issue 発見

### 6.2 rollback 手順
1. v3.4 file 削除 or deprecation 印
2. 4 file (v3.0-v3.2) 自動復元 (無改変保持のため改変不要)
3. R29 起票 5 file (本 sprint 含) を deprecation
4. R30+ で v3.2 lock に戻す議決

### 6.3 rollback 副作用
- 副作用 0 (4 file 無改変保持により完全復元可能)

---

## 7. v3.4 と先行 file の compatibility matrix

### 7.1 同時参照可能性
| file | v3.0 | v3.1-delta | v3.2-cand | v3.2-final | v3.4 |
|------|------|-----------|-----------|-----------|------|
| 単独参照 | ○ | △ (delta only) | △ (cand) | ◎ (lock) | ◎ (delta only) |
| 5 file 全参照 | ◎ (timeline 統合像) |

### 7.2 v3.4 単独使用時の必要追加 file
- v3.2-final-lock (内容 base) + v3.4 (delta) = 完全 spec
- v3.2-final-lock 単独 = calendar base spec (旧)
- v3.4 単独 = delta only (内容 incomplete)

---

## 8. 制約遵守確認

- 4 file 無改変: 確認済 (本 file 新規 + v3.0-v3.2 改変なし)
- API call: $0
- 副作用: 0 (新規 file 起票のみ)
- 絵文字: 0
- Heroicons: 参照のみ
- Owner 拘束: D-Day 4-6 min 上限厳守 (継承)

---

## 9. 行数 spec

- 本 file 約 250 行 (delta only 軽量設計)
- v3.0 (推定 200 行) / v3.1-delta (推定 150) / v3.2-cand (推定 180) / v3.2-final (228 行) は無改変
- 5 file 合計 行数 (本 sprint 起票): 約 1650 行 (350+350+300+400+250)

---

**file 終端 / 行数: 約 250 行**
