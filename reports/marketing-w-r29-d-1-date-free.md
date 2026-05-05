# PRJ-019 Marketing-W R29 — GTC-10 D-1 共同 sign date-free spec

**Round**: R29 (9 並列 6 軸目 / Marketing-W)
**Generated**: 2026-05-06 (R29 sprint)
**置換元**: 元 6/18 D-1 共同 sign (Owner 1 min ack)
**置換後**: GTC-9 (D-7 rehearsal) 完遂直後 即時実行
**T0'' 定義**: T0'' = GTC-9 完遂 ack 時刻
**Owner 拘束**: 1 min ack (1 行 reply)
**absolute 無改変保持 4 file**: launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. 方針要旨 (date-free 化)

### 0.1 旧 spec (6/18 固定)
- 6/18 (Thu) 18:00 JST 起動 / D-1 = D-Day 前日
- Owner ack = 「D-Day GO」1 行 reply (R28 v3.2 final lock 仕様)

### 0.2 新 spec (R29 date-free)
- T0'' = GTC-9 完遂 ack 直後
- Owner ack 1 行 reply 仕様継承 (R27 Marketing-U / R28 Marketing-V)
- 60 min 経路 (旧 spec 同等, 短縮検討 → 維持判定)

---

## 1. 起動 trigger 仕様 (T0'' 確定 protocol)

### 1.1 T0'' 確定 4 条件 ALL true
| # | 条件 | 確認 source |
|---|------|------------|
| 1 | GTC-9 D-7 75/75 PASS | dashboard |
| 2 | confidence ≥ 99.5% | trajectory file |
| 3 | 4 file (v3.0 / v3.1 / v3.2-cand / v3.2-final) 無改変確認 | git log |
| 4 | runbook v1.1 commit 確認 | git HEAD |

### 1.2 T0'' 自動 trigger logic
```
IF (GTC-9 PASS ∧ confidence ≥ 99.5% ∧ 4 file 無改変 ∧ runbook v1.1 PASS) THEN
  T0'' := now()
  emit "D-1 sign START" to dashboard line 3
  push Owner notification (1 min ack 要請)
END
```

---

## 2. D-1 60 min 経路 (5 phase 30 項目)

### Phase 1'': 最終 commit lock (T0''+0 → T0''+12min / 6 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 1 | main branch HEAD freeze (no merge until D-Day) | T0''+0:00 |
| 2 | release tag v1.0.0-rc lock | T0''+0:02 |
| 3 | release notes v1.0 final | T0''+0:04 |
| 4 | changelog 全 commit 反映 | T0''+0:06 |
| 5 | git log diff vs v3.2-final-lock 検査 | T0''+0:09 |
| 6 | Phase 1'' PASS | T0''+0:12 |

### Phase 2'': 公開直前 smoke test (T0''+12 → T0''+24min / 6 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 7 | E2E test 50 case 全 PASS | T0''+0:13 |
| 8 | unit test coverage ≥ 85% | T0''+0:16 |
| 9 | Lighthouse prod 95+ 4 metric | T0''+0:18 |
| 10 | bench p95 ≤ 200ms 連続検査 | T0''+0:20 |
| 11 | Sentry error rate < 0.1% | T0''+0:22 |
| 12 | Phase 2'' PASS | T0''+0:24 |

### Phase 3'': 運用待機 final (T0''+24 → T0''+36min / 6 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 13 | on-call 24h 待機開始 | T0''+0:25 |
| 14 | alert 7 種有効化 | T0''+0:27 |
| 15 | UptimeRobot 5 endpoint 監視 ON | T0''+0:29 |
| 16 | status page 「scheduled launch」表示 | T0''+0:31 |
| 17 | Twitter / X 公開予告 reserved tweet | T0''+0:33 |
| 18 | Phase 3'' PASS | T0''+0:36 |

### Phase 4'': Owner sign 要請 (T0''+36 → T0''+48min / 6 項目)
| # | 項目 | 新 spec 表記 | Owner 関与 |
|---|------|------------|----------|
| 19 | dashboard line 3 prepend に「D-1 sign 要請」prepend | T0''+0:37 | - |
| 20 | Owner 通知文 1 行 prep:「D-Day GO で公開実行 / NO で保留」 | T0''+0:39 | - |
| 21 | Owner reply wait window open | T0''+0:41 | - |
| 22 | **Owner 1 min reply 受領** (1 行) | T0''+0:43〜0:48 | **1 min** |
| 23 | reply 内容 lock (GO / NO-GO 判定) | T0''+0:48 | - |
| 24 | Phase 4'' PASS | T0''+0:48 | - |

### Phase 5'': sign lock + GTC-11 trigger 準備 (T0''+48 → T0''+60min / 6 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 25 | DEC NEW (D-Day GO sign) DRAFT 起票 | T0''+0:49 |
| 26 | INDEX-v 追記 (D-1 sign PASS) | T0''+0:51 |
| 27 | confidence 99.5 → 99.9% 上昇 | T0''+0:53 |
| 28 | GTC-11 (D-Day 公開) trigger 準備 | T0''+0:55 |
| 29 | dashboard line 3 prepend 最終更新 | T0''+0:58 |
| 30 | T0''+1:00:00 完遂 | T0''+1:00 |

---

## 3. Owner 1 min ack spec (R27 継承)

### 3.1 reply 文例 (Owner 1 行)
- 「D-Day GO」(7 文字) — 公開実行 trigger
- 「保留 / <理由>」 — D-Day 延期 (再判定 fork)
- 「NO-GO」 — 公開中止 (緊急 fork)

### 3.2 reply window
- T0''+0:41 → T0''+0:48 = 7 min window
- window 内 reply 無 → auto-保留 (NO-GO 同等扱い)
- Owner 拘束 = 1 min 厳守

### 3.3 GO 受領後の自動処理
- D-Day GO reply 受領 → 即時 GTC-11 trigger 有効化
- T0''+1:00 完遂 → GTC-11 fork

---

## 4. GTC-10 完遂後の連鎖 fork

### 4.1 → GTC-11 (D-Day 公開) 自動 fork
- T0''+1:00 → GTC-11 trigger 有効化
- GTC-11 spec: `marketing-w-r29-d-day-date-free.md` 参照
- Owner D-Day 4-6 min 拘束は GTC-11 で発生

### 4.2 NO-GO / 保留時の経路
- D-1 sign で NO-GO → GTC-11 fork 中止
- 再判定 round (R30+ で再評価)

---

## 5. 議決 trigger

- DEC-019-086: GTC-10 D-1 date-free 化採用
- DEC-019-087: Owner 1 min ack spec final lock
- 既存 R28 議決 (44 件) との整合確認

---

## 6. confidence 推移

| 段階 | confidence |
|------|------------|
| R28 末 | 96 → 98% |
| R29 GTC-8 PASS 後 | 99% |
| R29 GTC-9 PASS 後 | 99.5% |
| R29 GTC-10 PASS 後 | 99.9% |
| R29 GTC-11 PASS 後 | 100% (lock) |

---

## 7. 制約遵守確認

- 4 file 無改変: 確認済 (本 file 新規)
- API call: $0
- 副作用: 0
- 絵文字: 0
- Heroicons: 参照のみ
- Owner 拘束: 1 min 厳守

---

**file 終端 / 行数: 約 300 行**
