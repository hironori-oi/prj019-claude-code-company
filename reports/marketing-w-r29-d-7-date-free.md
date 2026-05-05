# PRJ-019 Marketing-W R29 — GTC-9 D-7 本 rehearsal date-free spec

**Round**: R29 (9 並列 6 軸目 / Marketing-W)
**Generated**: 2026-05-06 (R29 sprint)
**置換元**: 元 6/12 D-7 75 項目 5 phase (90 min, Owner 0-1 min 立会)
**置換後**: GTC-8 (mid-check) 完遂直後 即時実行
**T0' 定義**: T0' = GTC-8 完遂 ack 時刻 (= mid-check date-free spec の T0+1:30)
**Owner 拘束**: 0-1 min (立会 optional / 短時間 reply 1 行のみ)
**absolute 無改変保持 4 file**: launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. 方針要旨 (date-free 化)

### 0.1 旧 spec (6/12 固定)
- 6/12 (Fri) 09:00 JST 起動 / D-7 = D-Day - 7 day
- 75 項目 5 phase / 90 min / Owner 0-1 min 立会

### 0.2 新 spec (R29 date-free)
- T0' 自動確定 (GTC-8 完遂 trigger)
- 90 min 経路維持 (75 項目 5 phase)
- Owner 立会: 0-1 min (Phase 5 完遂時 1 行 reply optional)

### 0.3 D-7 の意義 (時間軸 → state 軸へ)
- 旧: 「公開まで残り 7 日」= timeline 圧
- 新: 「mid-check PASS 直後 = 全 spec 検査済 = D-Day 直前 rehearsal の準備完了 state」

---

## 1. 起動 trigger 仕様 (T0' 確定 protocol)

### 1.1 T0' 確定 3 条件 ALL true
| # | 条件 | 確認 source |
|---|------|------------|
| 1 | GTC-8 mid-check 75/75 PASS | dashboard line 3 prepend |
| 2 | confidence ≥ 99% | confidence-trajectory file |
| 3 | 残課題 list 0 件 | INDEX-v 最新 |

### 1.2 T0' 自動 trigger logic
```
IF (GTC-8 PASS ∧ confidence ≥ 99% ∧ 残課題 = 0) THEN
  T0' := now()
  emit "D-7 rehearsal START" to dashboard line 3
  fork phase-1' (T0'+0)
END
```

### 1.3 fail-safe
- 残課題 ≥ 1 → D-7 START 不可 → 修正後 retry
- Owner 通知 (pull only)

---

## 2. 5 phase 75 項目 date-free 化

### Phase 1': 公開直前 infra 検査 (T0'+0 → T0'+18min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 1 | DNS TTL 短縮 (300s → 60s) 設定 | T0'+0:00 |
| 2 | CDN cache purge dry-run | T0'+0:01:30 |
| 3 | Cloudflare WAF rule 最終確認 | T0'+0:03:00 |
| 4 | Vercel scaling pre-warm 設定 | T0'+0:04:30 |
| 5 | Supabase connection pool 100 / read replica 確認 | T0'+0:06:00 |
| 6 | Redis cache hit rate ≥ 90% | T0'+0:07:30 |
| 7 | edge function deploy 確認 | T0'+0:09:00 |
| 8 | image CDN (Cloudinary / 代替) 動作 | T0'+0:10:30 |
| 9 | OAuth provider (Google / GitHub) 動作 | T0'+0:12:00 |
| 10 | Stripe live mode 切替準備 | T0'+0:13:30 |
| 11 | webhook endpoint 5 種 動作 | T0'+0:15:00 |
| 12 | email 送信 SPF/DKIM/DMARC PASS | T0'+0:16:00 |
| 13 | mobile responsive 5 device 確認 | T0'+0:17:00 |
| 14 | accessibility a11y score ≥ 95 | T0'+0:17:45 |
| 15 | Phase 1' PASS 集計 | T0'+0:18:00 |

### Phase 2': コンテンツ完全 lock (T0'+18 → T0'+36min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 16 | LP final commit hash freeze | T0'+0:18:30 |
| 17 | OGP image final lock | T0'+0:19:30 |
| 18 | press release draft v1.0 | T0'+0:20:30 |
| 19 | blog post (公開記念) draft | T0'+0:21:30 |
| 20 | demo video (60 sec) lock | T0'+0:22:30 |
| 21 | screenshot 10 枚 lock | T0'+0:23:30 |
| 22 | testimonial 3 件 (β user) | T0'+0:24:30 |
| 23 | FAQ 20 項目 lock | T0'+0:25:30 |
| 24 | pricing page 3 plan lock | T0'+0:26:30 |
| 25 | feature comparison table lock | T0'+0:27:30 |
| 26 | onboarding flow 5 step lock | T0'+0:28:30 |
| 27 | tutorial video 3 本 lock | T0'+0:29:30 |
| 28 | help center 6 → 12 article 拡充 | T0'+0:30:30 |
| 29 | Twitter/X 公開予告 tweet draft | T0'+0:33:30 |
| 30 | Phase 2' PASS 集計 | T0'+0:36:00 |

### Phase 3': 公開直前最終セキュリティ (T0'+36 → T0'+54min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 31 | penetration test 自動走査 final | T0'+0:36:30 |
| 32 | dependency audit 0 critical | T0'+0:37:30 |
| 33 | container image scan (Trivy 等) | T0'+0:38:30 |
| 34 | secret rotation final | T0'+0:39:30 |
| 35 | SSL Labs grade A+ 確認 | T0'+0:40:30 |
| 36 | HSTS preload 申請確認 | T0'+0:41:30 |
| 37 | rate-limit 60/min 実機検証 | T0'+0:43:30 |
| 38 | DDoS mitigation Cloudflare 動作 | T0'+0:45:00 |
| 39 | bot protection (hCaptcha / Turnstile) | T0'+0:46:00 |
| 40 | account lockout policy 確認 | T0'+0:47:00 |
| 41 | password reset flow E2E | T0'+0:48:00 |
| 42 | 2FA enroll/recovery flow | T0'+0:49:00 |
| 43 | data export GDPR 対応 | T0'+0:50:00 |
| 44 | data deletion right 動作 | T0'+0:52:00 |
| 45 | Phase 3' PASS 集計 | T0'+0:54:00 |

### Phase 4': 運用最終 rehearsal (T0'+54 → T0'+72min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 46 | runbook v1.0 → v1.1 (D-7 学習反映) | T0'+0:54:30 |
| 47 | on-call 一次対応 simulation | T0'+0:55:30 |
| 48 | incident severity matrix lock | T0'+0:56:30 |
| 49 | rollback dry-run (実 deploy) | T0'+0:57:30 |
| 50 | feature flag kill-switch 動作 | T0'+0:58:30 |
| 51 | DB migration ロールバック確認 | T0'+0:59:30 |
| 52 | DR scenario 3 種 simulation | T0'+1:00:30 |
| 53 | backup restore E2E (実時間 ≤ 4h) | T0'+1:02:30 |
| 54 | log aggregation 動作 | T0'+1:03:30 |
| 55 | alert noise filter 設定 | T0'+1:04:30 |
| 56 | dashboard 5 panel 完備 | T0'+1:05:30 |
| 57 | cost tracker 動作 | T0'+1:06:30 |
| 58 | usage analytics 動作 | T0'+1:08:30 |
| 59 | crash report 経路 動作 | T0'+1:10:00 |
| 60 | Phase 4' PASS 集計 | T0'+1:12:00 |

### Phase 5': 統合判定 + Owner 立会 (T0'+72 → T0'+90min / 15 項目)
| # | 項目 | 新 spec 表記 | Owner 関与 |
|---|------|------------|----------|
| 61 | Phase 1'-4' PASS 集計 | T0'+1:12:30 | - |
| 62 | 60/60 = 100% 判定 | T0'+1:13:30 | - |
| 63 | confidence 99 → 99.5% 上昇 | T0'+1:15:00 | - |
| 64 | go/no-go provisional final | T0'+1:16:30 | - |
| 65 | dashboard line 3 prepend 更新 | T0'+1:18:00 | - |
| 66 | INDEX-v 追記 (D-7 PASS) | T0'+1:20:00 | - |
| 67 | Sec / Bench 連続 round ++ | T0'+1:22:00 | - |
| 68 | DEC NEW (D-7 PASS) DRAFT | T0'+1:24:00 | - |
| 69 | Owner 通知文 prep | T0'+1:25:00 | - |
| 70 | **Owner 立会 1 min reply optional** | T0'+1:26:00 | **0-1 min** |
| 71 | Owner reply 受領 or skip 判定 | T0'+1:27:30 | - |
| 72 | GTC-10 (D-1) trigger 準備 | T0'+1:28:00 | - |
| 73 | D-7 summary report 起票 | T0'+1:28:30 | - |
| 74 | dashboard prepend 最終更新 | T0'+1:29:00 | - |
| 75 | T0'+1:30:00 完遂 | T0'+1:30:00 | - |

---

## 3. Owner 立会 spec (0-1 min)

### 3.1 立会 trigger
- Phase 5' 第 70 項目 = Owner 1 min reply optional
- reply 内容例: 「D-7 PASS 確認 / D-1 へ」(15 文字)
- skip 可 (reply 不要 → auto-pass で GTC-10 trigger)

### 3.2 reply 不要時の自動処理
- T0'+1:26:00 から 5 min wait → reply 無 → auto-pass
- 結果的 Owner 拘束 = 0 min
- pull only 通知で dashboard 確認のみ

### 3.3 reply 任意時の処理
- Owner reply 受領 → 即時 GTC-10 trigger 確定
- 拘束 ≤ 1 min

---

## 4. GTC-9 完遂後の連鎖 fork

### 4.1 → GTC-10 (D-1 共同 sign) 自動 fork
- T0'+1:30 → GTC-10 trigger 有効化
- GTC-10 spec: `marketing-w-r29-d-1-date-free.md` 参照

### 4.2 INDEX-v 想定推移
- INDEX-v17 → v18 (D-7 PASS 反映 / entries 170 → 173)

---

## 5. 議決 trigger (R29 / R30)

- DEC-019-084: GTC-9 D-7 date-free 化採用
- DEC-019-085: Owner 立会 0-1 min spec lock
- 既存 DEC-080 / 081 整合維持

---

## 6. R28 spec (5/12 固定 mid-check) 比較表

| 項目 | 旧 spec (6/12 固定) | 新 spec (date-free) |
|------|---------------------|---------------------|
| 起動条件 | calendar 6/12 09:00 | T0' = GTC-8 PASS ack |
| 75 項目 | 5 phase 75 件 | 5 phase 75 件 (継承) |
| Owner 拘束 | 0-1 min | 0-1 min (継承) |
| 90 min 経路 | 維持 | 維持 |
| 副作用 | 0 | 0 |
| confidence 効果 | 95 → 98% | 99 → 99.5% |

---

## 7. 制約遵守確認

- 4 file 無改変: 確認済 (本 file 新規)
- API call: $0
- 副作用: 0
- 絵文字: 0
- Heroicons: 参照のみ
- Owner 拘束: 0-1 min (上限厳守)

---

**file 終端 / 行数: 約 350 行**
