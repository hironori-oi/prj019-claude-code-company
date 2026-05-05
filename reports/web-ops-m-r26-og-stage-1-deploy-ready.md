# Web-Ops-M Round 26 — OG production stage 1 deploy 実機実行 readiness (preview → staging)

- **担当**: Web-Ops 部門 / Round 26 担当 M
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 26（2026-05-05 起票 / 6/3 火連動 stage 1 deploy 実機実行 readiness）
- **先行成果**: Web-Ops-L R25（OG production verification 7 軸 PASS GO YES 無条件 + Phase 2 W5 deploy 計画 3 段階 + OWN-PRE-PHASE2-W5 19 件目 + v2.2 正式版昇格）
- **ミッション**: 6/3 火 09:00-15:00 stage 1 (preview) + stage 2 (staging) deploy 実機実行への移行 readiness を **14 step sequence + smoke test 4 観点 phase 1 + visual regression 8 case 56 検証 PASS 100% 必達** の 3 軸で確立

---

## §0 Executive Summary

Round 26 Web-Ops-M は Web-Ops-L R25 が確立した Phase 2 W5 deploy 計画 (320 行 / 3 段階 deploy + smoke test 4+8+6 観点 + contingency v2 20 cell + rollback 4 経路 + PIN tag 体系) を **stage 1 (preview) + stage 2 (staging) 実機実行 readiness** として 14 step sequence で物理化。stage 1 preview deploy (6/3 09:00-12:00 / 60 min smoke test) + stage 2 staging deploy (6/3 13:00-15:00 / 90 min smoke test + 3h soak) の 14 step を期待値 / 担当 / 想定時間 / 通過判定 / fallback の 5 軸で構造化、visual regression 8 case 56 検証 PASS 100% 必達条件を §3 で明示。preview deploy は cross-orchestrator 統合 e2e PR ベース (Dev-RR/SS R25 引継) で Vercel 自動 build trigger、staging deploy は preview → staging promote (Vercel CLI) で 5 min build + 90 min smoke test phase 2。stage 1 GO 軸 7/7 + stage 2 GO 軸 8/8 = 計 15 軸 PASS 必達条件を §6 で 7 軸採点として導出、6/3 火 単日 stage 1+2 完遂判定を **GO YES (条件付き) = 推奨条件下で実機実行可** に確証。本 readiness は API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 / v2.0+v2.1-delta+v2.2-delta-candidate+v2.2 4 file absolute 無改変を完全遵守。

---

## §1 stage 1 (preview) 実機実行 sequence (7 step / 60 min smoke test)

### §1.1 stage 1 preview deploy 14 step sequence (前半 7 step)

| step | 時刻 | 動作 | 担当 | 想定時間 | 通過判定 |
|---|---|---|---|---|---|
| 1.1 | 6/3 09:00 | Dev-RR/SS が cross-orchestrator 統合 e2e PR 作成 (target: main) | Dev-RR/SS | 0 min (R25 完遂 PR pending) | PR URL 取得 |
| 1.2 | 6/3 09:05 | PR push trigger で Vercel preview build 自動開始 | Vercel (auto) | 0 min (auto trigger) | build start log 取得 |
| 1.3 | 6/3 09:15 | preview deploy 完遂 = `https://prj019-w5-{hash}.vercel.app` 取得 | Vercel (auto) | 10 min (build) | build success + URL 取得 |
| 1.4 | 6/3 09:20 | Web-Ops が preview URL を Slack `#prj-019-launch` に post | Web-Ops-M | 5 min | Slack permalink 取得 |
| 1.5 | 6/3 09:30 | smoke test phase 1 - 観点 1: 4 endpoint 200 OK | Web-Ops-M + Dev | 5 min | curl 4 endpoint 全 200 |
| 1.6 | 6/3 09:35 | smoke test phase 1 - 観点 2: cross-orchestrator basic | Web-Ops-M + Dev | 15 min | 2 orchestrator 連携 1 sample |
| 1.7 | 6/3 09:50 | smoke test phase 1 - 観点 3+4: console error 0 + Lighthouse 90+ | Web-Ops-M + Dev | 40 min | 4 page console.error 0 + 各 3 軸 90+ |

stage 1 累計 = 5+5+5+15+40 = **70 min** (preview build 10 min 含む全実時間)、Slack post + smoke test buffer 含めて 09:00-12:00 の 180 min window に収束、buffer 110 min。

### §1.2 stage 1 preview smoke test phase 1 詳細 (4 観点 60 min)

| # | 観点 | 検証手段 | expected | 想定時間 |
|---|---|---|---|---|
| 1 | 4 endpoint 200 OK | `curl -I {preview_url}/[/, /api/health, /og/home-ja.png, /sitemap.xml]` | 4 endpoint 全 200 + content-type 適合 | 5 min |
| 2 | cross-orchestrator basic | 2 orchestrator (openclaw + harness) 連携 1 sample 実行 (Playwright e2e 1 case) | 1 sample 完遂 + assertion ok | 15 min |
| 3 | console error 0 | 4 page (top + service + case + updates) Playwright で console.error monitor | 4 page × console.error = 0 | 20 min |
| 4 | Lighthouse 90+ | 4 page 各 3 軸 (Performance / SEO / A11y) Lighthouse CI | 4 × 3 = 12 cell 全 90+ | 20 min |

合計 60 min (Round 25 Phase 2 W5 deploy 計画 §2.2 と整合、4 観点不変)。

### §1.3 stage 1 PASS 判定 (Round 25 計画 §2.3 継承)

- **4 観点全 PASS** = stage 2 移行 GO
- **1 観点 FAIL** = Dev-RR/SS で fix → 再 preview build (loop)、+30 min slip 許容
- **2+ 観点 FAIL** = stage 1 中止 + Phase 2 W5 着手 1 day slip 検討 (PM-R Round 26 連絡 + Owner 通知 L2)

### §1.4 stage 1 GO 軸 7/7 (Web-Ops-M 採点)

| # | 軸 | 判定基準 | Round 26 readiness 状態 |
|---|---|---|---|
| 1 | PR 作成 readiness | Dev-RR/SS R25 引継 PR 作成可能 | OK (R25 引継 PR pending) |
| 2 | Vercel preview build trigger | PR push trigger 自動化済 | OK (Vercel default) |
| 3 | preview URL 取得 readiness | hash 命名規則 `prj019-w5-{hash}.vercel.app` 確証 | OK (Vercel preview URL pattern) |
| 4 | Slack post readiness | `#prj-019-launch` channel 存在 + Web-Ops-M post 権限 | OK (R25 確証) |
| 5 | smoke test 観点 1 (4 endpoint) readiness | curl 4 endpoint 確認 spec 整合 | OK (Round 25 計画 §2.2 ① 整合) |
| 6 | smoke test 観点 2 (cross-orchestrator) readiness | 2 orchestrator 連携 1 sample 実行 spec | OK (Dev-RR/SS R25 引継 e2e 整合) |
| 7 | smoke test 観点 3+4 (console + Lighthouse) readiness | 4 page Playwright + Lighthouse CI 実行 spec | OK (Round 25 計画 §2.2 ③④ 整合) |
| **合計** | **7/7 PASS** | **GO YES (条件付き)** | - |

条件 = Dev-RR/SS R25 引継 PR 作成 + cross-orchestrator 統合 e2e の 2 件 readiness。

---

## §2 stage 2 (staging) 実機実行 sequence (7 step / 90 min smoke test + 3h soak)

### §2.1 stage 2 staging deploy 14 step sequence (後半 7 step)

| step | 時刻 | 動作 | 担当 | 想定時間 | 通過判定 |
|---|---|---|---|---|---|
| 2.1 | 6/3 13:00 | preview → staging promote (Vercel CLI: `vercel promote`) | Web-Ops-M + Dev | 5 min | promote success + staging URL 取得 |
| 2.2 | 6/3 13:05 | staging URL `https://staging.prj019.clawbridge.app` 取得 + DNS resolve | Web-Ops-M | 5 min | `dig` 解決 + IP 取得 |
| 2.3 | 6/3 13:10 | staging build 完遂 (Vercel staging environment) | Vercel (auto) | 5 min | build success log |
| 2.4 | 6/3 13:15 | smoke test phase 2 - 観点 1+2: 8 case 200 OK + RLS green | Web-Ops-M + Dev | 20 min | 8 page 全 200 + 3 抜き打ち table green |
| 2.5 | 6/3 13:35 | smoke test phase 2 - 観点 3+4+5: Sentry baseline + Analytics + OG image 8 case | Web-Ops-M + Dev | 25 min | error 0 + event 1 sample + 8 file 200 |
| 2.6 | 6/3 14:00 | smoke test phase 2 - 観点 6+7+8: DB pool + auth flow + cross-orchestrator e2e 5 sample | Web-Ops-M + Dev | 45 min | connection error 0 + 1 sample 完遂 + 5 sample PASS |
| 2.7 | 6/3 14:45 | stage 2 完遂 + staging soak 3h 開始 (15:00-18:00) + PIN-W5 hash 取得 | Web-Ops-M | 15 min | 8 観点全 PASS + PIN-W5 git tag |

stage 2 累計 (smoke test 部分) = 5+5+5+20+25+45+15 = **120 min** (13:00-15:00 の 120 min window 内収束)、staging soak 3h は 15:00-18:00 で intermittent 監視。

### §2.2 stage 2 staging smoke test phase 2 詳細 (8 観点 90 min)

| # | 観点 | 検証手段 | expected | 想定時間 |
|---|---|---|---|---|
| 1 | 8 case 200 OK | `curl -I {staging_url}/{home,service,case,updates}-{ja,en}` | 8 page 全 200 + content-type 適合 | 10 min |
| 2 | Supabase RLS green | own-auto-06 mock 連動 + 3 抜き打ち table SELECT/INSERT 拒否確認 | 3 table 全 RLS green | 10 min |
| 3 | Sentry baseline | error 0 件 (5 min 監視窓) | 5 min × Sentry dashboard 0 件 | 10 min |
| 4 | Vercel Analytics baseline | event tracking 1 sample (page_view) | event 1 sample 取得 | 5 min |
| 5 | OG image 8 case (staging URL) | `curl -I {staging_url}/og/{home,service,case,updates}-{ja,en}.png` | 8 file 全 200 + content-type: image/png | 10 min |
| 6 | DB connection pool | 10 concurrent request | connection error 0 | 10 min |
| 7 | auth flow basic | Supabase Auth signup → signin → signout 1 sample | 1 sample 完遂 | 15 min |
| 8 | cross-orchestrator e2e | 2 orchestrator 連携 5 sample (Dev-RR/SS PR ベース) | 5 sample 全 PASS | 20 min |

合計 90 min (Round 25 Phase 2 W5 deploy 計画 §3.2 と完全整合、8 観点不変)。

### §2.3 stage 2 staging soak 3h (15:00-18:00)

| 軸 | 監視内容 | 検知頻度 | trigger 動作 |
|---|---|---|---|
| Sentry | error rate / 5 min window | 5 min 毎 | error 1 件以上 = stage 2 失敗扱い → 再 stage 2 |
| Vercel Analytics | event tracking 異常 | 10 min 毎 | tracking 失敗 = 観点 4 fail扱い |
| DB connection pool | connection rate / pool 占有率 | 5 min 毎 | error 1 件以上 = 観点 6 fail 扱い |

soak 3h 0 件確定 = stage 3 移行 GO 確定 (R25 Phase 2 W5 deploy 計画 §3.4 継承)。

### §2.4 stage 2 PASS 判定

- **8 観点全 PASS + 3h soak 0 件** = stage 3 (production) 移行 GO 候補
- **1-2 観点 FAIL** = Dev-RR/SS で fix → 再 staging deploy、+60 min slip 許容
- **3+ 観点 FAIL** = stage 2 中止 + Phase 2 W5 着手見直し (PM-R Round 26 連絡 + Owner 通知 L4)

### §2.5 stage 2 GO 軸 8/8 (Web-Ops-M 採点)

| # | 軸 | 判定基準 | Round 26 readiness 状態 |
|---|---|---|---|
| 1 | preview → staging promote readiness | Vercel CLI `vercel promote` 実行可能 | OK (Vercel CLI default) |
| 2 | staging URL DNS resolve | `staging.prj019.clawbridge.app` DNS 設定済 | OK (R25 DNS 設定継承) |
| 3 | smoke test 観点 1+2 (8 case + RLS) readiness | 8 endpoint 確認 + own-auto-06 mock 連動 spec | OK (R25 計画 §3.2 ①② 整合) |
| 4 | smoke test 観点 3+4+5 (Sentry + Analytics + OG) readiness | 3 軸 baseline 監視 spec | OK (R25 計画 §3.2 ③④⑤ 整合) |
| 5 | smoke test 観点 6+7 (DB pool + auth) readiness | DB connection pool + Supabase Auth 確認 spec | OK (R25 計画 §3.2 ⑥⑦ 整合) |
| 6 | smoke test 観点 8 (cross-orchestrator e2e 5 sample) readiness | Dev-RR/SS PR ベース 5 sample spec | OK (R25 引継整合) |
| 7 | staging soak 3h 監視 readiness | 3 軸 (Sentry / Analytics / DB) intermittent 監視 spec | OK (R25 計画 §3.4 整合) |
| 8 | PIN-W5 hash 取得 readiness | git tag 命名規則 `PIN-W5` 確証 + 6/3 18:00 取得 timing | OK (R25 計画 §6.2 整合) |
| **合計** | **8/8 PASS** | **GO YES (条件付き)** | - |

条件 = stage 1 7/7 PASS 完遂 + Vercel promote 実行 + DNS resolve 確認の 3 件 readiness。

---

## §3 visual regression 8 case 56 検証 PASS 100% 必達条件 (stage 1+2 統合)

### §3.1 8 case 56 検証構造 (R25 verification record §6.1 継承)

```
case (8): home-ja, home-en, service-ja, service-en, case-ja, case-en, updates-ja, updates-en
viewport (7): 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024 (tablet), 414×896 (mobile L), 375×667 (mobile M)
合計: 8 × 7 = 56 cell
```

### §3.2 stage 1 preview での VRT 実行位置

stage 1 preview の smoke test phase 1 ではなく、stage 1 完遂後の **buffer 90 min (10:30-12:00)** で VRT 8 case 56 検証 dry-run を実行:

| 軸 | preview VRT (stage 1) | staging VRT (stage 2 完遂後 6/3 18:00 想定) |
|---|---|---|
| 実行 timing | 10:30-12:00 buffer 内 | 18:00 staging soak 0 件確定後 |
| 検証 cell 数 | 56 | 56 |
| baseline 比較 | R23 取得済 baseline checksums.txt | R23 取得済 + stage 1 preview hash |
| PASS 必達 | 100% | 100% |

### §3.3 56 検証 PASS 100% 必達 4 軸

| 軸 | 判定基準 | preview (stage 1) | staging (stage 2) |
|---|---|---|---|
| sha256 一致 | baseline checksums.txt と diff 0 byte | 56 cell 全一致必達 | 56 cell 全一致必達 |
| pixel diff | < 0.5% (Playwright `toHaveScreenshot({ maxDiffPixelRatio: 0.005 })`) | 56 cell 全 < 0.5% 必達 | 56 cell 全 < 0.5% 必達 |
| 描画完了 | DOM ready + lazy load 完了 + font ready | 56 cell 全 OK 必達 | 56 cell 全 OK 必達 |
| anti-aliasing | render 安定 (3 retry 内一致) | 56 cell 全 retry 0 で一致必達 | 56 cell 全 retry 0 で一致必達 |

### §3.4 56 検証 FAIL 時 fallback (R25 verification record §6.4 継承)

| FAIL pattern | 確率 | fallback | 影響 |
|---|---|---|---|
| 1 cell pixel diff > 0.5% (anti-aliasing 揺れ) | 5% | 3 retry → 安定後 PASS | +1 min |
| 8 case 中 1 case sha256 不整合 | 1% | git revert + redeploy + 再 56 検証 | +30 min (stage 1) / +60 min (stage 2) |
| 56 cell 中 5+ FAIL (大幅 regression) | < 0.5% | stage 1+2 中止 + PIN-pre-W5 rollback (5 min) + 翌日再 ack | 1 day delay |

### §3.5 stage 1+2 統合 56 検証 PASS 必達条件 GO 軸 4/4

| # | 軸 | 判定 |
|---|---|---|
| 1 | stage 1 preview 56 検証 PASS 100% | GO YES (R23 baseline 取得済 + R25 verification record §6 継承) |
| 2 | stage 2 staging 56 検証 PASS 100% | GO YES (preview → staging promote で hash 不変) |
| 3 | baseline checksums.txt 物理化済 | GO YES (R23 Dev-OO 取得済) |
| 4 | fallback 経路 4 件全 GO | GO YES (R25 verification record §6.4 継承) |

---

## §4 stage 1+2 統合実行時間 + 拘束時間 集計 (R25 計画 §7 継承 + R26 detail 化)

### §4.1 stage 別実行時間 (R25 計画 §7.1 継承)

| stage | 想定時間 (min) | Owner 拘束 (min) | Web-Ops-M 拘束 (min) | Dev (RR/SS) 拘束 (min) |
|---|---|---|---|---|
| 1 preview | 60 (smoke test) + 10 (build) = 70 | 0 | 35 | 35 |
| 2 staging | 90 (smoke test) + 5 (build) + 5 (promote) = 100 | 0 | 50 | 50 |
| 2 soak | 180 | 0 | 30 (intermittent) | 30 (intermittent) |
| stage 1+2 合計 | **350 min (5.8h)** | **0** | **115** | **115** |

### §4.2 6/3 火 単日 timeline (R25 計画 §1.2 継承 + R26 detail 化)

```
6/3 (火) 09:00  Phase 2 W5 着手 (DEC-019-075 trigger 4 条件 satisfied)
6/3 09:00       stage 1 step 1.1 (PR 作成)
6/3 09:15       stage 1 step 1.3 (preview URL 取得)
6/3 09:30       stage 1 step 1.5 (smoke test phase 1 開始)
6/3 10:30       stage 1 完遂 (4 観点 PASS)
6/3 10:30-12:00 buffer + VRT 56 検証 dry-run (90 min)
6/3 12:00-13:00 lunch break (任意)
6/3 13:00       stage 2 step 2.1 (preview → staging promote)
6/3 13:15       stage 2 step 2.4 (smoke test phase 2 開始)
6/3 14:45       stage 2 完遂 (8 観点 PASS) + PIN-W5 hash 取得
6/3 15:00-18:00 staging soak 3h (intermittent 監視)
6/3 18:00       staging soak 0 件確定 → stage 3 移行 GO 候補確定
```

### §4.3 6/3 火 単日 完遂判定 GO 軸 5/5

| # | 軸 | 判定 |
|---|---|---|
| 1 | 09:00-12:00 stage 1 (3h window) 内収束 | GO YES (10:30 完遂 + buffer 90 min) |
| 2 | 13:00-15:00 stage 2 (2h window) 内収束 | GO YES (14:45 完遂 + buffer 15 min) |
| 3 | 15:00-18:00 staging soak (3h window) 内収束 | GO YES (intermittent 監視で 3h 完遂) |
| 4 | Owner 拘束 0 min (stage 1+2 段階) | GO YES (R25 計画 §1.3 整合 = stage 1+2 拘束 0) |
| 5 | Web-Ops-M + Dev 各 115 min 拘束 (5h window で許容) | GO YES (R25 計画 §7.2 整合 = 各 150 min 想定の 77%) |

---

## §5 制約遵守確認

| 制約 | Round 26 Web-Ops-M 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 readiness は markdown 記述のみ、curl/Vercel/op item 0 |
| 副作用 0 | OK | 実機 deploy 0 / git operation 0 / file 改変 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact 全 absolute 無改変 |
| Heroicons 参照のみ | OK | 本 readiness はアイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-m-r26-og-stage-1-deploy-ready.md` |
| 行数範囲 | OK | 本 readiness 約 240 行 (200-280 範囲内) |

---

## §6 stage 1+2 統合 GO 軸採点 (Web-Ops-M 7 軸採点)

| # | 軸 | 判定 | 根拠 |
|---|---|---|---|
| 1 | stage 1 preview 7/7 軸 PASS | GO YES (条件付き) | §1.4 採点表 7/7 + Dev-RR/SS R25 引継 PR 作成条件 |
| 2 | stage 2 staging 8/8 軸 PASS | GO YES (条件付き) | §2.5 採点表 8/8 + stage 1 完遂 + Vercel promote 条件 |
| 3 | VRT 56 検証 PASS 100% 必達 4/4 | GO YES | §3.5 採点表 4/4 + R23 baseline + R25 verification 継承 |
| 4 | 6/3 火 単日 timeline 5/5 軸 PASS | GO YES | §4.3 採点表 5/5 + 5h window 拘束 0 buffer 充足 |
| 5 | Owner 拘束 0 min (stage 1+2 段階) | GO YES | R25 計画 §1.3 + §7.2 整合 |
| 6 | Web-Ops-M + Dev 拘束 各 115 min | GO YES | R25 計画 §7.2 想定 150 min の 77% |
| 7 | R25 計画 (320 行) との整合 | GO YES | §1-§4 の 4 軸全て R25 計画と整合 |
| **合計** | **7/7 PASS** | **GO YES (条件付き)** | 条件 = Dev-RR/SS R25 PR + Vercel promote + DNS + baseline 4 件 readiness |

---

## §7 Round 27 引継

### §7.1 Round 27 Web-Ops-N 引継 (3 件)

1. **6/3 stage 1+2 実機実行 actual record 起票** = 本 readiness の expected vs 実機 actual の deviation 別 report、行ベース + 所要時間ベース + 通過 step ベース 3 軸計算
2. **PIN-pre-W5 (6/2 取得) + PIN-W5 (6/3 18:00 取得) hash 物理化確認** = git tag 命名 + push 完了 + Slack permalink 紐付け
3. **stage 3 production deploy 6/4-6/9 任意 timing 起票判断** = staging soak 0 件確定後の production GO 候補判断 + OWN-W5-PROD-ACK card 起票 (20 件目候補)

---

## §8 結語

Round 26 Web-Ops-M は **OG production stage 1+2 deploy 実機実行 readiness** を本 readiness (約 240 行) として完成させ、stage 1 preview 7/7 軸 + stage 2 staging 8/8 軸 + VRT 56 検証 4/4 軸 + 6/3 火 単日 timeline 5/5 軸 = 計 24/24 軸 PASS = **GO YES (条件付き)** を導出。Round 25 Web-Ops-L Phase 2 W5 deploy 計画 (320 行) との整合確認済、6/3 火 09:00-18:00 の 9h window で stage 1+2 + soak 全完遂 + Owner 拘束 0 min + Web-Ops-M + Dev 各 115 min 拘束を確証。Round 27 Web-Ops-N に 6/3 stage 1+2 実機実行 actual record + PIN tag 物理化 + stage 3 production deploy 起票判断を引継。

---

**最終更新**: 2026-05-05 (Round 26 / Web-Ops-M 起票)
**次回見直し**: 2026-06-02 18:00 (PIN-pre-W5 取得確認) / 2026-06-03 09:00 (stage 1 着手) / 2026-06-03 13:00 (stage 2 着手) / 2026-06-03 18:00 (staging soak 完遂)

EOF
