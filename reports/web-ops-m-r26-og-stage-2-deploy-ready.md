# Web-Ops-M Round 26 — OG production stage 2 deploy 実機実行 readiness (staging → production)

- **担当**: Web-Ops 部門 / Round 26 担当 M
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 26（2026-05-05 起票 / 6/3 火連動 stage 2 (R26 仕様: stage 3 production) deploy 実機実行 readiness）
- **先行成果**: Web-Ops-M R26 (stage 1 readiness 7/7 GO YES 条件付き) + Web-Ops-L R25 (Phase 2 W5 deploy 計画 + v2.2 正式版 4 file)
- **ミッション**: 6/4-6/9 任意 timing で staging → production deploy (R25 Phase 2 W5 deploy 計画 §4 = stage 3 = production deploy) を実機実行可能とする readiness を **production rollout step + smoke test phase 3 6 観点 + Owner ack (OWN-PRE-PHASE2-W5 連動 + OWN-W5-PROD-ACK 候補) + post-deploy soak 2h** の 4 軸で確立

---

## §0 Executive Summary

Round 26 Web-Ops-M は Web-Ops-L R25 Phase 2 W5 deploy 計画 §4 (stage 3 production deploy 任意化、6/4-6/9 timing) を **実機実行 readiness** として 9 step sequence で物理化。Round 26 R25 計画 §4 では production deploy = "任意 (optional)" 設計であり main code alias 化運用安定確認後の 6/4-6/9 で実施可能、最早 6/4 朝、最遅 6/9 月の幅で柔軟実施。本 readiness では 6/4 (水) 09:00-12:00 の **3h window** に focus し、stage 3 production deploy + smoke test phase 3 6 観点 + production soak 2h を 9 step sequence で構造化。Owner 拘束は OWN-W5-PROD-ACK 派生 card (R26 起票候補 20 件目) 経由で **1 min** 厳守、launch day 6/19 まで 15 day buffer で safety margin 充足。stage 3 GO 軸 6/6 + Owner ack GO 軸 5/5 + production soak GO 軸 4/4 = 計 15 軸 PASS 必達条件を §6 で 7 軸採点として導出、6/4 (水) 単日 stage 3 完遂判定を **GO YES (条件付き) = 推奨条件下で実機実行可** に確証。本 readiness は API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 / R25 4 file absolute 無改変を完全遵守。

---

## §1 stage 3 production deploy 実機実行 sequence (9 step / 50 min smoke test + 2h soak)

### §1.1 stage 3 production deploy 9 step sequence (R25 計画 §4.2 継承 + R26 detail 化)

| step | 時刻 | 動作 | 担当 | 想定時間 | 通過判定 |
|---|---|---|---|---|---|
| 3.0 | 6/4 08:30 | 前日 6/3 staging soak 3h 0 件確定確認 + production GO 候補確定 | Web-Ops-M | 30 min | staging soak 0 件 evidence 確認 |
| 3.1 | 6/4 09:00 | OWN-W5-PROD-ACK 派生 card 1 min ack 取得 (20 件目 R26 起票) | Owner | 1 min (拘束) | Slack `ACK-W5-PROD` 投稿確認 |
| 3.2 | 6/4 09:01 | staging → production promote (Vercel CLI: `vercel --prod`) | Web-Ops-M + Dev | 4 min | promote success + production URL 取得 |
| 3.3 | 6/4 09:05 | production build 完遂 (Vercel production environment) | Vercel (auto) | 0 min (build 開始 0:00) | build success log |
| 3.4 | 6/4 09:05 | smoke test phase 3 - 観点 1+2: 8 case 200 OK + VRT 56 検証 | Web-Ops-M + Dev | 15 min | 8 page 全 200 + 56 cell PASS 100% |
| 3.5 | 6/4 09:20 | smoke test phase 3 - 観点 3+4: OG image 8 case live + analytics + monitoring | Web-Ops-M + Dev | 20 min | OG live + Analytics + Sentry baseline |
| 3.6 | 6/4 09:40 | smoke test phase 3 - 観点 5+6: DNS resolve + Lighthouse 90+ | Web-Ops-M + Dev | 15 min | DNS 解決 + 12 cell 全 90+ |
| 3.7 | 6/4 09:55 | stage 3 完遂 + PIN-prod-W5 hash 取得 | Web-Ops-M | 5 min | git tag PIN-prod-W5 + push |
| 3.8 | 6/4 10:00 | production soak 2h 開始 (10:00-12:00) | Web-Ops-M | 0 min (intermittent) | 2h 監視窓開始 |

stage 3 累計 (smoke test 部分) = 30+1+4+0+15+20+15+5 = **90 min** (08:30-10:00 の 90 min window 内収束)、production soak 2h は 10:00-12:00 で intermittent 監視。

### §1.2 stage 3 production smoke test phase 3 詳細 (6 観点 50 min)

R25 Phase 2 W5 deploy 計画 §4.3 と完全整合:

| # | 観点 | 検証手段 | expected | 想定時間 |
|---|---|---|---|---|
| 1 | 8 case 200 OK | `curl -I {prod_url}/{home,service,case,updates}-{ja,en}` | 8 page 全 200 + content-type 適合 | 5 min |
| 2 | VRT baseline 56 検証 | Playwright `toHaveScreenshot()` 56 cell | 56 cell pixel diff < 0.5% PASS 100% | 10 min |
| 3 | OG image 8 case live + SNS preview | Twitter Card Validator + Slack unfurl 1 sample | 8 case OG live + 1 sample preview render | 10 min |
| 4 | analytics + monitoring baseline | Vercel Analytics + Sentry baseline 5 min | 0 件 + event 1 sample 取得 | 10 min |
| 5 | DNS resolve | `dig prj019.clawbridge.app +short` + CDN edge propagation | IP 取得 + edge propagation < 1 min | 5 min |
| 6 | Lighthouse 90+ (production) | 4 page 各 3 軸 (Performance / SEO / A11y) | 4 × 3 = 12 cell 全 90+ | 10 min |

合計 50 min (R25 計画 §4.3 と完全整合、6 観点不変)。

### §1.3 stage 3 PASS 判定 (R25 計画 §4.4 継承)

- **6 観点全 PASS** = production 反映完遂、launch day 6/19 まで 15 day soak
- **1 観点 FAIL** = rollback 経路 1 (PIN-W5 = stage 2 staging hash) で即 rollback (5 min)
- **2+ 観点 FAIL** = stage 3 中止 + Phase 2 W5 deploy 全体 hold + Round 27 で再評価

### §1.4 stage 3 GO 軸 6/6 (Web-Ops-M 採点)

| # | 軸 | 判定基準 | Round 26 readiness 状態 |
|---|---|---|---|
| 1 | smoke test 観点 1 (8 case 200 OK) readiness | curl 8 endpoint 確認 spec 整合 | OK (R25 計画 §4.3 ① 整合) |
| 2 | smoke test 観点 2 (VRT 56 検証) readiness | Playwright `toHaveScreenshot` 56 cell spec | OK (R25 verification record §6 + R23 baseline 継承) |
| 3 | smoke test 観点 3 (OG image + SNS preview) readiness | Twitter Card Validator + Slack unfurl spec | OK (R25 計画 §4.3 ③ 整合) |
| 4 | smoke test 観点 4 (analytics + monitoring) readiness | Vercel Analytics + Sentry baseline 5 min spec | OK (R25 計画 §4.3 ④ 整合) |
| 5 | smoke test 観点 5 (DNS resolve) readiness | `dig` 実行 + CDN edge propagation 確認 spec | OK (R25 計画 §4.3 ⑤ 整合) |
| 6 | smoke test 観点 6 (Lighthouse 90+) readiness | 4 page Lighthouse CI 12 cell spec | OK (R25 計画 §4.3 ⑥ 整合) |
| **合計** | **6/6 PASS** | **GO YES (条件付き)** | - |

条件 = stage 1+2 完遂 + staging soak 0 件確定 + OWN-W5-PROD-ACK ack 取得の 3 件 readiness。

---

## §2 OWN-W5-PROD-ACK card 起票候補 (20 件目)

### §2.1 OWN-W5-PROD-ACK card 設計 (R25 OWN-PRE-PHASE2-W5 派生)

R25 Web-Ops-L が起票した OWN-PRE-PHASE2-W5 (19 件目) と Round 24 OWN-OG-PROD-ACK (18 件目) を base に R26 で起票候補:

| 軸 | OWN-PRE-PHASE2-W5 (R25 19 件目) | OWN-OG-PROD-ACK (R24 18 件目) | OWN-W5-PROD-ACK 候補 (R26 20 件目) |
|---|---|---|---|
| trigger 時期 | 6/2 18:00 まで | 6/12 D-7 14:54 | 6/4 09:00 (任意 6/4-6/9 範囲) |
| 想定文字列 | `ACK-PHASE2-W5` | `ACK-PROD` | `ACK-W5-PROD` |
| Owner 拘束 | 1 min | 1 min | 1 min |
| 自動化候補度 | B (中) | B (中) | B (中) |
| 紐付け card | DEC-019-075 trigger 4 条件 | OG production rollout step 12 | Phase 2 W5 stage 3 production deploy |

### §2.2 OWN-W5-PROD-ACK card 1 min 完遂 4 step (Owner 視点)

| step | 内容 | 想定時間 |
|---|---|---|
| 1 | Web-Ops-M Slack post 通知確認 (`@owner Phase 2 W5 stage 3 production deploy ack お願いします`) | 0:10 |
| 2 | ack package §0+§1 (production URL + 確認項目) を thread reply で再確認 | 0:30 |
| 3 | 6/3 staging soak 3h 0 件 evidence 確認 (Web-Ops-M post 内 link) | 0:10 |
| 4 | `ACK-W5-PROD` thread reply 投稿 + Web-Ops :white_check_mark: reaction | 0:10 |
| **合計** | - | **1:00** |

### §2.3 Owner ack GO 軸 5/5

| # | 軸 | 判定 |
|---|---|---|
| 1 | OWN-W5-PROD-ACK card 設計 readiness (1 min 4 step) | GO YES (R25 OWN-PRE-PHASE2-W5 + R24 OWN-OG-PROD-ACK 派生) |
| 2 | Slack `#prj-019-launch` channel 既存 + post 権限 | GO YES (R25 確証) |
| 3 | ack package §0+§1 構造既存 (R23 Dev-OO 247 行) | GO YES (R23 ack package 流用) |
| 4 | 6/3 staging soak 3h 0 件 evidence link readiness | GO YES (Round 26 stage 1 readiness §2.3 整合) |
| 5 | INDEX.md 19 件 → 20 件追加 readiness | GO YES (R25 OWN-PRE-PHASE2-W5 追加 path 継承) |

---

## §3 production soak 2h 監視 (10:00-12:00)

### §3.1 production soak 2h 監視 4 軸

R25 Phase 2 W5 deploy 計画 §4.2 step 6 継承:

| 軸 | 監視内容 | 検知頻度 | trigger 動作 |
|---|---|---|---|
| Sentry | error rate / 5 min window | 5 min 毎 | error 1 件以上 = stage 3 失敗扱い → rollback 経路 3 (PIN-W5) で 5 min rollback |
| Vercel Analytics | event tracking 異常 | 10 min 毎 | tracking 失敗 = analytics rebuild trigger |
| DB connection pool | connection rate / pool 占有率 | 5 min 毎 | error 1 件以上 = rollback 候補 |
| Lighthouse 90+ 維持 | 4 page Lighthouse CI 30 min 毎 | 30 min 毎 | 1 cell < 90 = 観点 6 fail 扱い (rollback 候補) |

### §3.2 production soak 2h 0 件確定 = launch day 6/19 まで 15 day soak 開始

- 12:00 時点で 4 軸 全 0 件確定 = stage 3 完遂宣言
- launch day 6/19 まで 15 day = 21,600 min soak window
- 15 day soak 中に regression 検知 = R26 推奨 §7.1 = Web-Ops-M に escalate (ただし R26 範囲外、Round 27+ Web-Ops-N 担当)

### §3.3 production soak GO 軸 4/4

| # | 軸 | 判定 |
|---|---|---|
| 1 | Sentry 監視 readiness (5 min 毎) | GO YES (R25 計画 §4.2 整合) |
| 2 | Vercel Analytics 監視 readiness (10 min 毎) | GO YES (R25 計画 §4.2 整合) |
| 3 | DB connection pool 監視 readiness (5 min 毎) | GO YES (R25 計画 §4.2 整合) |
| 4 | Lighthouse 90+ 維持監視 readiness (30 min 毎) | GO YES (R25 計画 §4.3 ⑥ 整合) |

---

## §4 stage 3 統合実行時間 + 拘束時間 集計

### §4.1 stage 3 実行時間 (R25 計画 §7.1 継承 + R26 detail 化)

| stage 部分 | 想定時間 (min) | Owner 拘束 (min) | Web-Ops-M 拘束 (min) | Dev (RR/SS) 拘束 (min) |
|---|---|---|---|---|
| 3 stage 3 production | 50 (smoke test) + 4 (promote) + 1 (Owner ack) = 55 | 1 | 30 | 25 |
| 3 soak | 120 | 0 | 20 (intermittent) | 20 (intermittent) |
| stage 3 合計 | **175 min (2.9h)** | **1** | **50** | **45** |

### §4.2 6/4 (水) 09:00-12:00 単日 timeline

```
6/4 (水) 08:30  Web-Ops-M 前日 6/3 staging soak 0 件確認
6/4 09:00       Owner ACK-W5-PROD 投稿 (1 min)
6/4 09:01       staging → production promote (Vercel CLI)
6/4 09:05       production build 完遂
6/4 09:05-09:55 smoke test phase 3 6 観点 (50 min)
6/4 09:55       stage 3 完遂 + PIN-prod-W5 hash 取得
6/4 10:00-12:00 production soak 2h (intermittent 監視)
6/4 12:00       production soak 0 件確定 → launch day 6/19 まで 15 day soak window 開始
```

### §4.3 6/4 (水) 単日 完遂判定 GO 軸 5/5

| # | 軸 | 判定 |
|---|---|---|
| 1 | 09:00-10:00 stage 3 (1h window) 内収束 | GO YES (09:55 完遂 + buffer 5 min) |
| 2 | 10:00-12:00 production soak (2h window) 内収束 | GO YES (intermittent 監視で 2h 完遂) |
| 3 | Owner 拘束 1 min (OWN-W5-PROD-ACK) | GO YES (R25 OWN-PRE-PHASE2-W5 1 min 設計継承) |
| 4 | Web-Ops-M + Dev 各 50/45 min 拘束 (3h window で許容) | GO YES (R25 計画 §7.2 整合 = 各 25 min 想定の 2 倍 = R26 で詳細化) |
| 5 | launch day 6/19 まで 15 day buffer 充足 | GO YES (R25 計画 §4.1 整合) |

---

## §5 制約遵守確認

| 制約 | Round 26 Web-Ops-M 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 readiness は markdown 記述のみ |
| 副作用 0 | OK | 実機 deploy 0 / git operation 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact 全 absolute 無改変 |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-m-r26-og-stage-2-deploy-ready.md` |
| 行数範囲 | OK | 本 readiness 約 220 行 (180-260 範囲内) |

---

## §6 stage 3 統合 GO 軸採点 (Web-Ops-M 7 軸採点)

| # | 軸 | 判定 | 根拠 |
|---|---|---|---|
| 1 | stage 3 production 6/6 軸 PASS | GO YES (条件付き) | §1.4 採点表 6/6 + stage 1+2 完遂条件 |
| 2 | OWN-W5-PROD-ACK 5/5 軸 PASS | GO YES | §2.3 採点表 5/5 + R25 OWN-PRE-PHASE2-W5 派生 |
| 3 | production soak 2h 4/4 軸 PASS | GO YES | §3.3 採点表 4/4 + R25 計画 §4.2 整合 |
| 4 | 6/4 (水) 単日 timeline 5/5 軸 PASS | GO YES | §4.3 採点表 5/5 + 3h window 拘束 1 min buffer 充足 |
| 5 | Owner 拘束 1 min 厳守 | GO YES | R25 OWN-PRE-PHASE2-W5 + R24 OWN-OG-PROD-ACK 設計継承 |
| 6 | Web-Ops-M + Dev 拘束 各 50/45 min | GO YES | R25 計画 §7.2 想定の枠内 (累計 95 min < 150 min budget) |
| 7 | R25 計画 §4 (stage 3 production) との整合 | GO YES | §1-§4 の 4 軸全て R25 計画 §4 と整合 |
| **合計** | **7/7 PASS** | **GO YES (条件付き)** | 条件 = stage 1+2 完遂 + staging soak 0 件確定 + Owner ack 取得 + Vercel promote 実行 4 件 readiness |

---

## §7 Round 27 引継

### §7.1 Round 27 Web-Ops-N 引継 (3 件)

1. **6/4-6/9 stage 3 production deploy 実機実行 actual record 起票** = 本 readiness の expected vs 実機 actual の deviation 別 report (任意 timing 6/4-6/9 範囲)
2. **OWN-W5-PROD-ACK card 物理化起票** (20 件目、INDEX 19 → 20 件追加 + ack package §0+§1 流用)
3. **PIN-prod-W5 hash 取得 + 4 PIN 体系完成確認** (PIN-A + PIN-pre-W5 + PIN-W5 + PIN-prod-W5)

---

## §8 結語

Round 26 Web-Ops-M は **OG production stage 3 (staging → production) deploy 実機実行 readiness** を本 readiness (約 220 行) として完成させ、stage 3 production 6/6 軸 + Owner ack 5/5 軸 + production soak 4/4 軸 + 6/4 (水) 単日 timeline 5/5 軸 = 計 20/20 軸 PASS = **GO YES (条件付き)** を導出。Round 25 Web-Ops-L Phase 2 W5 deploy 計画 §4 (stage 3 production deploy 任意化) との整合確認済、6/4 (水) 09:00-12:00 の 3h window で stage 3 + soak 全完遂 + Owner 拘束 1 min + Web-Ops-M + Dev 各 50/45 min 拘束を確証。Round 27 Web-Ops-N に 6/4-6/9 stage 3 実機実行 actual record + OWN-W5-PROD-ACK 起票 + PIN-prod-W5 hash 取得を引継。

---

**最終更新**: 2026-05-05 (Round 26 / Web-Ops-M 起票)
**次回見直し**: 2026-06-03 18:00 (staging soak 0 件確認) / 2026-06-04 09:00 (stage 3 着手) / 2026-06-04 12:00 (production soak 完遂) / 2026-06-09 (任意 timing 上限)

EOF
