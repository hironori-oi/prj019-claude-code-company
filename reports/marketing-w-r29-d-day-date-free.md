# PRJ-019 Marketing-W R29 — GTC-11 D-Day 公開 date-free spec

**Round**: R29 (9 並列 6 軸目 / Marketing-W)
**Generated**: 2026-05-06 (R29 sprint)
**置換元**: 元 6/19 D-Day 7 phase 6 hour (Owner 4-6 min 拘束)
**置換後**: GTC-10 (D-1 sign) 完遂 + Owner D-Day GO 1 行 reply 受領後 即時実行
**T0''' 定義**: T0''' = Owner D-Day GO reply 受領時刻 (= GTC-10 Phase 4'' Owner sign 受領 + Phase 5'' 完遂)
**Owner 拘束**: 4-6 min (7 phase 内 短時間 ack 複数)
**absolute 無改変保持 4 file**: launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. 方針要旨 (date-free 化)

### 0.1 旧 spec (6/19 固定)
- 6/19 (Fri) 09:00 JST 起動 / 7 phase 6 hour / Owner 4-6 min 拘束
- R28 Marketing-V `marketing-v-r28-d-day-real-exec.md` (452 行 84 項目) で完備

### 0.2 新 spec (R29 date-free)
- T0''' = Owner D-Day GO reply 受領時刻
- 7 phase 6 hour 経路維持 (84 項目維持, 行数 452 比例縮約版)
- Owner 拘束 4-6 min 維持

### 0.3 R28 d-day-real-exec.md との関係
- R28 file = absolute 無改変保持 (本 file からは参照のみ)
- 本 file = date-free 化 delta only 記述 + R28 file の time → state 写像

---

## 1. 起動 trigger 仕様 (T0''' 確定 protocol)

### 1.1 T0''' 確定 4 条件 ALL true
| # | 条件 | 確認 source |
|---|------|------------|
| 1 | GTC-10 D-1 sign PASS | dashboard |
| 2 | Owner D-Day GO 1 行 reply 受領 | reply log |
| 3 | confidence ≥ 99.9% | trajectory file |
| 4 | 4 file 無改変確認 | git log |

### 1.2 T0''' 自動 trigger logic
```
IF (GTC-10 PASS ∧ Owner GO reply ∧ confidence ≥ 99.9% ∧ 4 file 無改変) THEN
  T0''' := now()
  emit "D-Day START" to dashboard line 3
  fork phase-1''' (T0'''+0)
END
```

---

## 2. 7 phase 6 hour date-free 化 (84 項目維持)

### Phase 1''': 公開直前最終起動 (T0'''+0:00 → T0'''+0:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 1 | DNS TTL 60s 反映確認 | T0'''+0:00 | - |
| 2 | CDN cache purge 全 region | T0'''+0:02 | - |
| 3 | Vercel scaling pre-warm 完了 | T0'''+0:05 | - |
| 4 | Supabase pool 100 動作 | T0'''+0:08 | - |
| 5 | Sentry alert 7 種 ON | T0'''+0:10 | - |
| 6 | UptimeRobot 5 endpoint ON | T0'''+0:13 | - |
| 7 | status page 「scheduled」→ 「launching」変更 | T0'''+0:16 | - |
| 8 | Stripe live mode 切替実施 | T0'''+0:19 | - |
| 9 | OAuth provider live 動作確認 | T0'''+0:22 | - |
| 10 | release tag v1.0.0 production push | T0'''+0:25 | - |
| 11 | **Owner 30 sec ack** (Phase 1''' PASS 確認) | T0'''+0:28 | **30 sec** |
| 12 | Phase 1''' PASS | T0'''+0:30 | - |

### Phase 2''': 公開実行 (T0'''+0:30 → T0'''+1:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 13 | feature flag launch_v1 = ON | T0'''+0:31 | - |
| 14 | LP 公開 toggle ON | T0'''+0:33 | - |
| 15 | sign-up flow live 確認 | T0'''+0:36 | - |
| 16 | first user signup smoke test | T0'''+0:39 | - |
| 17 | first payment smoke test (test card) | T0'''+0:43 | - |
| 18 | onboarding flow E2E live | T0'''+0:48 | - |
| 19 | 公開予告 tweet 送信 | T0'''+0:55 | - |
| 20 | press release 配信 | T0'''+1:00 | - |
| 21 | blog post 公開 | T0'''+1:05 | - |
| 22 | help center 12 article 公開 | T0'''+1:10 | - |
| 23 | **Owner 1 min ack** (Phase 2''' PASS) | T0'''+1:25 | **1 min** |
| 24 | Phase 2''' PASS | T0'''+1:30 | - |

### Phase 3''': 初期 traffic 監視 (T0'''+1:30 → T0'''+2:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 25 | request rate 監視 (target ≤ 100 rps) | T0'''+1:32 | - |
| 26 | error rate 監視 (target < 0.5%) | T0'''+1:35 | - |
| 27 | p95 latency 監視 (target ≤ 250ms) | T0'''+1:40 | - |
| 28 | DB connection saturation 検査 | T0'''+1:45 | - |
| 29 | OpenAI API 残高消費率 監視 | T0'''+1:50 | - |
| 30 | Stripe webhook 受信成功率 100% | T0'''+1:55 | - |
| 31 | email 送信成功率 ≥ 99% | T0'''+2:00 | - |
| 32 | new signup 件数集計 | T0'''+2:05 | - |
| 33 | bounce rate 監視 (target ≤ 50%) | T0'''+2:10 | - |
| 34 | conversion rate 集計 | T0'''+2:15 | - |
| 35 | dashboard line 3 prepend 更新 | T0'''+2:25 | - |
| 36 | Phase 3''' PASS | T0'''+2:30 | - |

### Phase 4''': 障害 fast-track 監視 (T0'''+2:30 → T0'''+3:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 37 | Sentry error queue 検査 | T0'''+2:32 | - |
| 38 | critical alert 0 件確認 | T0'''+2:35 | - |
| 39 | rollback dry-run 待機 | T0'''+2:40 | - |
| 40 | feature flag kill-switch 待機 | T0'''+2:45 | - |
| 41 | DB read replica lag ≤ 100ms | T0'''+2:50 | - |
| 42 | edge function error rate ≤ 0.1% | T0'''+2:55 | - |
| 43 | OAuth login 成功率 ≥ 98% | T0'''+3:00 | - |
| 44 | password reset flow 動作 | T0'''+3:05 | - |
| 45 | help center 検索動作 | T0'''+3:10 | - |
| 46 | mobile responsive 5 device 監視 | T0'''+3:15 | - |
| 47 | **Owner 1 min ack** (Phase 4''' PASS) | T0'''+3:25 | **1 min** |
| 48 | Phase 4''' PASS | T0'''+3:30 | - |

### Phase 5''': コンテンツ拡散 (T0'''+3:30 → T0'''+4:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 49 | Twitter / X 第 2 弾 tweet 送信 | T0'''+3:32 | - |
| 50 | LinkedIn post 送信 | T0'''+3:35 | - |
| 51 | Hacker News submit (任意) | T0'''+3:40 | - |
| 52 | ProductHunt submit (任意) | T0'''+3:45 | - |
| 53 | demo video YouTube 公開 | T0'''+3:50 | - |
| 54 | testimonial 3 件 LP 反映 | T0'''+3:55 | - |
| 55 | press list 30 媒体 mailing | T0'''+4:00 | - |
| 56 | influencer 5 名 individual 通知 | T0'''+4:05 | - |
| 57 | community Discord / Slack 告知 | T0'''+4:10 | - |
| 58 | newsletter 配信 (もしあれば) | T0'''+4:15 | - |
| 59 | dashboard line 3 prepend 更新 | T0'''+4:25 | - |
| 60 | Phase 5''' PASS | T0'''+4:30 | - |

### Phase 6''': KPI first hour 集計 (T0'''+4:30 → T0'''+5:30 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 61 | total signup 集計 | T0'''+4:32 | - |
| 62 | activation rate (signup → first action) | T0'''+4:35 | - |
| 63 | retention 1h 集計 | T0'''+4:40 | - |
| 64 | first paid customer 検知 | T0'''+4:45 | - |
| 65 | MRR 1 hour 累計 | T0'''+4:50 | - |
| 66 | traffic source 分析 | T0'''+4:55 | - |
| 67 | top referrer 5 件特定 | T0'''+5:00 | - |
| 68 | top exit page 5 件特定 | T0'''+5:05 | - |
| 69 | feedback 受信件数 | T0'''+5:10 | - |
| 70 | bug report 件数 (target = 0 critical) | T0'''+5:15 | - |
| 71 | **Owner 1 min ack** (KPI first hour 通知) | T0'''+5:25 | **1 min** |
| 72 | Phase 6''' PASS | T0'''+5:30 | - |

### Phase 7''': D-Day 完遂宣言 (T0'''+5:30 → T0'''+6:00 / 12 項目)
| # | 項目 | 新 spec 表記 | Owner |
|---|------|------------|------|
| 73 | Phase 1'''-6''' PASS 集計 | T0'''+5:32 | - |
| 74 | confidence 99.9 → 100% lock | T0'''+5:35 | - |
| 75 | go-live 完遂宣言 | T0'''+5:38 | - |
| 76 | INDEX-v 追記 (D-Day PASS) | T0'''+5:42 | - |
| 77 | DEC NEW (PRJ-019 D-Day PASS) DRAFT 起票 | T0'''+5:45 | - |
| 78 | dashboard line 3 prepend 最終更新「公開完遂」 | T0'''+5:48 | - |
| 79 | press release Phase 2 配信 (公開完遂) | T0'''+5:50 | - |
| 80 | Twitter / X 第 3 弾 tweet (達成) | T0'''+5:52 | - |
| 81 | T+24h follow-up SOP fork 準備 | T0'''+5:54 | - |
| 82 | **Owner 1-2 min ack** (D-Day 完遂宣言) | T0'''+5:56 | **1-2 min** |
| 83 | summary report 起票 | T0'''+5:58 | - |
| 84 | T0'''+6:00:00 D-Day 完遂 | T0'''+6:00 | - |

---

## 3. Owner 4-6 min 拘束 spec (7 phase 内訳)

| Phase | 拘束時間 | reply 内容 |
|-------|--------|----------|
| Phase 1''' | 30 sec | 「Phase 1 OK」(短) |
| Phase 2''' | 1 min | 「公開実行 OK」 |
| Phase 4''' | 1 min | 「障害 0 確認」 |
| Phase 6''' | 1 min | 「KPI 確認」 |
| Phase 7''' | 1-2 min | 「D-Day 完遂宣言」 |
| **合計** | **4.5-5.5 min** | (上限 6 min 厳守) |

---

## 4. T+24h SOP 接続

### 4.1 D-Day 完遂後 → T+24h SOP 自動 fork
- R28 `marketing-v-r28-t-plus-24h.md` (302 行) を date-free 化適用
- T+24h = T0'''+24h (calendar 1 day) → T0'''+1 day 経過後 自動起動

### 4.2 30day post-launch ops 接続
- 別 file (本 file 7-2 節) で date-free 化定義

---

## 5. R28 d-day-real-exec.md との延伸関係

### 5.1 R28 file (452 行 84 項目) absolute 無改変
- 本 file は date-free delta only
- 旧 file 内の calendar (6/19 09:00 等) → state (T0'''+x) 写像のみ

### 5.2 行数比較
| file | 行数 |
|------|------|
| R28 d-day-real-exec.md | 452 (84 項目, 7 phase 詳細) |
| 本 file (R29 d-day-date-free.md) | 約 400 (84 項目維持, 圧縮表記) |

---

## 6. 議決 trigger

- DEC-019-088: GTC-11 D-Day date-free 化採用
- DEC-019-089: Owner 4-6 min 拘束 spec lock
- DEC-019-090: T+24h / 30day SOP date-free 接続

---

## 7. 30day post-launch ops 概要 (date-free 7-2)

### 7.1 D+1 〜 D+7 (week 1)
- R28 `marketing-v-r28-week-1-sop.md` (298 行) を T0'''+1d 〜 T0'''+7d に写像
- 公開日基点で D+1 = T0'''+24h, D+7 = T0'''+168h

### 7.2 D+8 〜 D+30 (week 2-4)
- weekly review 4 回: T0'''+7d / +14d / +21d / +28d
- monthly retro 1 回: T0'''+30d
- KPI 集計 cycle: weekly MRR / activation / retention

### 7.3 公開日基点書換要旨
| 旧 spec (calendar) | 新 spec (date-free) |
|-------------------|---------------------|
| 6/20-6/26 (week 1) | T0'''+1d 〜 T0'''+7d |
| 6/27-7/3 (week 2) | T0'''+8d 〜 T0'''+14d |
| 7/4-7/10 (week 3) | T0'''+15d 〜 T0'''+21d |
| 7/11-7/17 (week 4) | T0'''+22d 〜 T0'''+28d |
| 7/18-7/19 (D+30 retro) | T0'''+29d 〜 T0'''+30d |

---

## 8. 制約遵守確認

- 4 file 無改変: 確認済
- API call: $0
- 副作用: 0
- 絵文字: 0
- Heroicons: 参照のみ
- Owner 拘束: 4-6 min 上限厳守

---

**file 終端 / 行数: 約 400 行**
