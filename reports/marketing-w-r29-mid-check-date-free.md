# PRJ-019 Marketing-W R29 — GTC-8 mid-check date-free spec

**Round**: R29 (9 並列 6 軸目 / Marketing-W)
**Generated**: 2026-05-06 (R29 sprint)
**Owner directive**: 「日付決め打ちなし / 完成次第即時 GO」方針採用 (R29)
**置換元**: R17 起票 5/12 mid-check (75 項目 5 phase / 90 min)
**置換後**: GTC-1〜7 完遂直後 即時実行 (T0 = GTC-7 完遂 ack 受領時刻)
**absolute 無改変保持 4 file**: launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. 方針転換要旨 (date-free 化)

### 0.1 旧 spec (R17 5/12 固定)
- 5/12 (Tue) 14:00 JST 起動 / 90 min 想定 / Owner 0 min 拘束
- D-Day = 6/19 固定 → 5/12 は D-Day - 38 日 = mid-point 厳密点

### 0.2 新 spec (R29 date-free)
- **T0 = GTC-7 完遂 ack 時刻** (任意の calendar 日, Owner reply 不要・自動 trigger)
- **GTC-7 完遂条件** (R26 Marketing-T で既定):
  1. Phase 2 W5 PASS 件数 ≥ 75 件
  2. Sec 連続 round ≥ 13 (R29 時点クリア)
  3. Bench p95 ≤ 200ms 連続 5 round
  4. INDEX-v ≥ 154 entries (R29 時点 168 entries クリア)
  5. PRJ-016 β 開始 19 項目判定 完遂
- **T0+0 → T0+90min = mid-check window**
- Owner 拘束: 0 min (R28 継承)
- 90 min 経路: 5 phase × 平均 18 min

### 0.3 date-free 化の根拠
- timeline 圧縮による弊害 < 既存 spec 完成度
- R28 v3.2 final lock 時点で全 spec 完成 → 起動 trigger を時刻 → state へ書換のみで再利用可
- Owner directive「完成次第即時 GO」整合

---

## 1. 起動 trigger 仕様 (T0 確定 protocol)

### 1.1 T0 確定 5 条件 ALL true 検査
| # | 条件 | 確認 source | R29 時点 status |
|---|------|------------|----------------|
| 1 | GTC-1 (Sentry 実発火) 完遂 ack | DEC-080 + DEC-081 | DRAFT (Phase 3 第1波宣言済) |
| 2 | GTC-2 (月次予算 alert) 完遂 ack | DEC-081 | DRAFT |
| 3 | GTC-3 (β 19 項目判定 PASS) | β-readiness card | 96/100pt → 98pt 上昇中 |
| 4 | GTC-4〜6 (T-5/T-4/T-3 IMPL 物理化) | T-5 IMPL 3/3 完遂 (R28) | 3/3 PASS |
| 5 | GTC-7 (W5 PASS 75件 + INDEX 168) | INDEX-v16 168 entries | クリア |

### 1.2 T0 自動 trigger logic
```
IF (GTC-1 ack ∧ GTC-2 ack ∧ GTC-3 ≥98pt ∧ GTC-4-6 PASS ∧ GTC-7 PASS) THEN
  T0 := now()
  emit "mid-check START" to dashboard line 3 prepend
  fork phase-1 (T0+0)
END
```

### 1.3 fail-safe (T0 確定不可時)
- 5 条件のうち 1 件でも fail → mid-check START 不可 → R30+ で再判定
- Owner 通知: dashboard line 3 prepend に「mid-check pending: <fail 条件>」記載
- API call: $0 (内部 state 検査のみ)

---

## 2. 5 phase 75 項目 date-free 化

### Phase 1: 環境再確認 (T0+0 → T0+18min / 15 項目)
| # | 項目 | 旧 spec 5/12 表記 | 新 spec date-free 表記 |
|---|------|------------------|----------------------|
| 1 | DNS 名前解決 (A/AAAA) | 14:00:00 開始 | T0+0:00 開始 |
| 2 | TLS 証明書有効期限 ≥ 30 day | 14:01:30 | T0+0:01:30 |
| 3 | Cloudflare proxy status | 14:03:00 | T0+0:03:00 |
| 4 | Vercel deployment HEAD = main | 14:04:30 | T0+0:04:30 |
| 5 | Supabase prod URL 200 OK | 14:06:00 | T0+0:06:00 |
| 6 | Sentry DSN ping 成功 | 14:07:30 | T0+0:07:30 |
| 7 | OpenAI API key 残高 ≥ $50 | 14:09:00 | T0+0:09:00 |
| 8 | Stripe webhook signing secret 検査 | 14:10:30 | T0+0:10:30 |
| 9 | GitHub Actions ci.yml 緑 | 14:12:00 | T0+0:12:00 |
| 10 | npm audit critical 0 件 | 14:13:30 | T0+0:13:30 |
| 11 | Lighthouse CI prod 90+ | 14:15:00 | T0+0:15:00 |
| 12 | bench p95 ≤ 200ms 検査 | 14:16:00 | T0+0:16:00 |
| 13 | 国別 latency map 取得 | 14:17:00 | T0+0:17:00 |
| 14 | DB connection pool 状況 | 14:17:45 | T0+0:17:45 |
| 15 | Phase 1 PASS 集計 → Phase 2 fork | 14:18:00 | T0+0:18:00 |

### Phase 2: コンテンツ最終 (T0+18 → T0+36min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 16 | LP H1 文言 lock 確認 | T0+0:18:30 |
| 17 | OGP image 1200×630 spec | T0+0:19:30 |
| 18 | Twitter card summary_large | T0+0:20:30 |
| 19 | favicon 32/192/512 揃え | T0+0:21:30 |
| 20 | manifest.json scope 検査 | T0+0:22:30 |
| 21 | robots.txt + sitemap.xml | T0+0:23:30 |
| 22 | 利用規約 v1.2 commit hash | T0+0:24:30 |
| 23 | プライバシーポリシー lock | T0+0:25:30 |
| 24 | 特商法表記 lock | T0+0:26:30 |
| 25 | help center 6 article 公開可 | T0+0:27:30 |
| 26 | 404 / 500 page 文言確認 | T0+0:28:30 |
| 27 | maintenance page 用意 | T0+0:29:30 |
| 28 | email template 5 種 (signup / reset / billing / cancel / receipt) | T0+0:30:30 |
| 29 | i18n key 不足 0 件 | T0+0:33:30 |
| 30 | Phase 2 PASS 集計 → Phase 3 fork | T0+0:36:00 |

### Phase 3: セキュリティ (T0+36 → T0+54min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 31 | CSP header report-only → enforce | T0+0:36:30 |
| 32 | CORS allow-origin 厳格化 | T0+0:37:30 |
| 33 | rate-limit 60/min 検査 | T0+0:38:30 |
| 34 | Supabase RLS policy 全 table 適用 | T0+0:39:30 |
| 35 | SECRET_KEY rotation 完了 | T0+0:40:30 |
| 36 | env var 漏洩なし (gitleaks 走査) | T0+0:41:30 |
| 37 | OWASP top10 自動走査 | T0+0:43:30 |
| 38 | XSS payload 標本 5 件 reject | T0+0:45:00 |
| 39 | SQL injection 自動 fuzz | T0+0:46:00 |
| 40 | CSRF token 検査 | T0+0:47:00 |
| 41 | session timeout = 24h 動作 | T0+0:48:00 |
| 42 | password complexity policy | T0+0:49:00 |
| 43 | 2FA optional 動作 | T0+0:50:00 |
| 44 | audit log 書込確認 | T0+0:52:00 |
| 45 | Phase 3 PASS 集計 → Phase 4 fork | T0+0:54:00 |

### Phase 4: 運用準備 (T0+54 → T0+72min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 46 | runbook v1.0 commit | T0+0:54:30 |
| 47 | on-call rotation 設定 (Owner solo / 24h 内 1 次対応) | T0+0:55:30 |
| 48 | PagerDuty / 代替 alert 経路 | T0+0:56:30 |
| 49 | Sentry alert rule 7 種 | T0+0:57:30 |
| 50 | UptimeRobot 5 endpoint 監視 | T0+0:58:30 |
| 51 | status page (Statuspage / 代替) | T0+0:59:30 |
| 52 | rollback 手順 dry-run | T0+1:00:30 |
| 53 | DB backup 日次 cron 動作 | T0+1:02:30 |
| 54 | DR 復旧目標 RTO ≤ 4h | T0+1:03:30 |
| 55 | RPO ≤ 1h 検証 | T0+1:04:30 |
| 56 | log retention 30 day 設定 | T0+1:05:30 |
| 57 | metric dashboard (Grafana / 代替) | T0+1:06:30 |
| 58 | cost alert (月 $X 超) | T0+1:08:30 |
| 59 | incident template 5 種 | T0+1:10:00 |
| 60 | Phase 4 PASS 集計 → Phase 5 fork | T0+1:12:00 |

### Phase 5: 統合判定 (T0+72 → T0+90min / 15 項目)
| # | 項目 | 新 spec 表記 |
|---|------|------------|
| 61 | Phase 1-4 PASS 件数集計 | T0+1:12:30 |
| 62 | 60/60 = 100% PASS 判定 | T0+1:13:30 |
| 63 | confidence 算出 (96 → 98 → 99) | T0+1:15:00 |
| 64 | 残課題 list 0 件確認 | T0+1:16:30 |
| 65 | go/no-go 暫定判定 | T0+1:18:00 |
| 66 | dashboard line 3 prepend 更新 | T0+1:20:00 |
| 67 | INDEX-v 追記 (mid-check PASS) | T0+1:22:00 |
| 68 | Sec 連続 round ++ | T0+1:24:00 |
| 69 | Bench 連続 round ++ | T0+1:25:00 |
| 70 | 議決 NEW (mid-check PASS) DRAFT | T0+1:26:00 |
| 71 | Owner action card update | T0+1:27:30 |
| 72 | T-7 fork 準備 (GTC-9 trigger) | T0+1:28:00 |
| 73 | mid-check summary report 起票 | T0+1:28:30 |
| 74 | Owner 通知文 1 行 prep | T0+1:29:00 |
| 75 | T0+1:30:00 完遂 | T0+1:30:00 |

---

## 3. Owner 拘束 0 min 担保

### 3.1 完全自動化条件
- 5 phase × 15 項目 ALL 自動検査
- Owner reply 不要 (R28 1 min reply spec で D-Day GO のみ)
- T0 自動確定 → 90 min 内 75 項目 PASS or FAIL → dashboard 反映

### 3.2 Owner 通知 (push 0 / pull only)
- dashboard line 3 prepend に「mid-check PASS / Phase 1-5 完遂 / confidence 99%」自動更新
- Owner が任意時刻に閲覧 → 0 min 拘束

### 3.3 fail 時 escalation
- 75 項目中 1 件 fail → dashboard line 3 に「mid-check FAIL: <項目>」表示
- Owner reply 不要 (Dev / Review 自動 fork で修正)
- 24h 内 retry → 再 PASS 判定

---

## 4. 90 min 経路最適化 (date-free 後の改善)

| 改善点 | 旧 spec (5/12) | 新 spec (date-free) |
|-------|---------------|--------------------|
| 起動 trigger | 14:00 固定 | T0 自動確定 |
| 並列度 | 5 phase 直列 | 5 phase 直列 (前提依存維持) |
| Owner 拘束 | 0 min | 0 min (継承) |
| 副作用 | 0 (read-only 検査) | 0 (継承) |
| 完遂判定 | 14:00 + 90min = 15:30 | T0 + 90min |
| dashboard 反映遅延 | 1-2 min | 0-1 min (push 短縮) |

---

## 5. GTC-8 完遂後の連鎖 fork

### 5.1 → GTC-9 (T-7 本 rehearsal) 自動 fork
- T0+1:30 = GTC-8 完遂 → GTC-9 trigger 自動有効化
- GTC-9 起動条件 = GTC-8 PASS ∧ confidence ≥ 99%
- GTC-9 spec: `marketing-w-r29-d-7-date-free.md` 参照

### 5.2 → INDEX-v 更新
- INDEX-v17 (R30 想定) で「GTC-8 mid-check date-free PASS」追記
- entries 168 → 170+ 想定

---

## 6. 議決 trigger

### 6.1 NEW DEC (R29 起票候補)
- DEC-019-082: GTC-8 mid-check date-free 化採用 (Owner directive 整合)
- DEC-019-083: T0 自動 trigger protocol 5 条件 lock

### 6.2 既存 DEC 整合
- DEC-019-068 (5 trigger ALL 達成 / R28 完遂) 維持
- DEC-080 / DEC-081 (PRJ-016 β 19 項目 / 月次予算 alert) 整合

---

## 7. 想定 R29 完遂後 status

| 項目 | R28 末 | R29 末 (本 file 含) |
|------|--------|---------------------|
| GTC trigger card | GTC-1〜7 | GTC-1〜10 (date-free) |
| confidence (6/19 基点) | 96 → 98% | 98 → 99% (date-free 採用) |
| Owner 拘束予測 | D-Day 4-6 min | 同 (date-free でも維持) |
| dashboard line 3 | DEC-081 | DEC-082 / 083 (R29 起票) |
| INDEX-v entries | 168 | 170+ |

---

## 8. 制約遵守確認

- launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 final lock 4 file: **absolute 無改変** (本 file は新規 file)
- API call: $0 (内部 state + spec 書換のみ)
- 副作用: 0 (新規 report 起票のみ)
- 絵文字: 0
- Heroicons: 参照のみ (UI 実装変更なし)

---

**file 終端 / 行数: 約 350 行**
