# Web-Ops-L Round 25 — Phase 2 W5 着手連動 deploy 計画

- **担当**: Web-Ops 部門 / Round 25 担当 L
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 25（2026-05-05 起票）
- **連動 milestone**: Phase 2 W5 着手 = **2026-06-03 (火) 09:00 JST**（17 日 path Phase 1 完遂期限 6/20 の 17 日前）
- **ミッション**: Phase 2 W5 着手連動の deploy strategy を Vercel preview → staging → production 段階 + smoke test 連携 + contingency v2 連携 + rollback 経路の 4 軸で確立

---

## §0 Executive Summary

Round 25 Web-Ops-L は **Phase 2 W5 着手 6/3 (火) 連動の deploy strategy** を、Round 24 までに確立済の (Vercel preview 8 case PASS / OG production rollout step 12 / VRT baseline 56 検証 / OWN-OG-PROD-ACK 1 min ack / contingency v2 = 20 cell マトリクス) を再利用する形で 3 段階 deploy + smoke test 4 観点 + rollback 4 経路で構造化。Phase 2 W5 cross-orchestrator 統合 e2e + cross-package 拡張第 1 弾 (Dev-RR/SS R25 引継) と並行する deploy windows を **6/3 09:00-12:00 (preview) / 6/3 13:00-15:00 (staging) / 6/4 09:00-10:00 (production = 任意)** の 3 phase で計画。production deploy は Phase 2 W5 着手段階では **任意 = optional** とし、main code alias 化完遂 (Dev-PP R24) の運用安定確認後に 6/4 以降で実施可とする保守的設計。contingency v2 の 20 cell マトリクス (T-24h / T-0 / T+1h / T+24h × 5 case) を Phase 2 W5 deploy に直接 mapping。本計画は API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 を完全遵守。

---

## §1 Phase 2 W5 着手 deploy 全体像

### §1.1 Phase 2 W5 着手 = 6/3 (火) 09:00 JST 確定

- DEC-019-075 ⑥ trigger 4 条件 satisfied (Round 24 完遂時点で確証)
- Phase 1 完遂前倒し達成見込 = 5/5 → 6/3 期間に Phase 2 着手 readiness を 100% 維持
- Dev-RR/SS R25 引継 = cross-orchestrator 統合 e2e + cross-package 拡張第 1 弾
- W5 期間 = 6/3 (火) - 6/9 (月) の 7 day window

### §1.2 deploy 3 段階 全体図

```
6/3 (火) 09:00  Phase 2 W5 着手
   ↓
6/3 09:00-12:00  [stage 1] Vercel preview deploy (cross-orchestrator 統合 e2e PR ベース)
   ↓ smoke test phase 1 (preview 4 endpoint)
6/3 13:00-15:00  [stage 2] staging deploy (preview → staging promote)
   ↓ smoke test phase 2 (staging 8 case + RLS + monitoring)
6/3 15:00-18:00  staging soak (3 hour 観察、regression 検知)
   ↓ Owner 通知 (任意、ack 不要 = staging 段階)
6/4 (水) 09:00-10:00  [stage 3 / 任意] production deploy (staging → prod promote)
   ↓ smoke test phase 3 (production 8 case + VRT 56 + analytics)
6/4 10:00-12:00  production soak (2 hour 観察)
```

### §1.3 stage ごとの目的 + Owner 拘束

| stage | 目的 | Owner 拘束 | 環境 |
|---|---|---|---|
| 1 | preview deploy で cross-orchestrator 統合 e2e PR の動作確認 | 0 min (Web-Ops + Dev 4 eyes) | `https://prj019-w5-{hash}.vercel.app` |
| 2 | staging deploy で full-stack 連携確認 (DB + 認証 + monitoring) | 0 min (CEO + Web-Ops review) | `https://staging.prj019.clawbridge.app` |
| 3 (任意) | production deploy = main code alias 化完遂 + W5 機能反映 | **1 min** (OWN-PROD-ACK 派生 card / R26 起票候補) | `https://prj019.clawbridge.app` |

stage 3 production deploy は **Phase 2 W5 着手段階では optional** = main code alias 化 (Dev-PP R24) の運用安定確認後に実施。最早 6/4 朝、最遅 6/9 月までに実施可能の幅を持たせる。

---

## §2 stage 1: Vercel preview deploy (6/3 09:00-12:00)

### §2.1 preview deploy 流れ

```
[step 1] Dev-RR/SS が cross-orchestrator 統合 e2e PR 作成 (6/3 09:00)
[step 2] PR push trigger で Vercel preview build 自動開始 (6/3 09:05)
[step 3] preview deploy 完遂 = `https://prj019-w5-{hash}.vercel.app` 取得 (6/3 09:15)
[step 4] Web-Ops が preview URL を Slack #prj-019-launch に post (6/3 09:20)
[step 5] smoke test phase 1 実行 (6/3 09:30-10:30)
[step 6] smoke test PASS で stage 1 完遂 (6/3 10:30)
[step 7] stage 1 完遂後の 90 min buffer で stage 2 移行準備 (6/3 10:30-12:00)
```

### §2.2 smoke test phase 1 (preview 4 endpoint + cross-orchestrator basic)

| # | 観点 | 検証内容 | 想定時間 |
|---|---|---|---|
| 1 | 4 endpoint 200 OK | `/`, `/api/health`, `/og/home-ja.png`, `/sitemap.xml` 全 200 | 5 min |
| 2 | cross-orchestrator basic | 2 orchestrator (openclaw + harness) の基本連携 1 sample 実行 | 15 min |
| 3 | console error 0 | 4 page (top + service + case + updates) Playwright で console.error 0 件 | 20 min |
| 4 | Lighthouse 90+ (Performance / SEO / A11y) | 4 page 各 3 軸 90+ 維持 | 20 min |
| **合計** | - | - | **60 min** |

### §2.3 stage 1 PASS 判定

- 4 観点全 PASS = stage 2 移行 GO
- 1 観点 FAIL = Dev-RR/SS で fix → 再 preview build (loop)
- 2+ 観点 FAIL = stage 1 中止 + Phase 2 W5 着手 1 day slip 検討 (Round 25 PM-R 連絡)

---

## §3 stage 2: staging deploy (6/3 13:00-15:00)

### §3.1 staging deploy 流れ

```
[step 1] preview → staging promote (Vercel CLI or dashboard) (6/3 13:00)
[step 2] staging URL `https://staging.prj019.clawbridge.app` 取得 (6/3 13:05)
[step 3] staging build 完遂 (6/3 13:10)
[step 4] smoke test phase 2 実行 (6/3 13:15-14:45)
[step 5] smoke test PASS で stage 2 完遂 (6/3 14:45)
[step 6] staging soak 3 hour 観察 (6/3 15:00-18:00)
```

### §3.2 smoke test phase 2 (staging 8 case + RLS + monitoring)

| # | 観点 | 検証内容 | 想定時間 |
|---|---|---|---|
| 1 | 8 case 200 OK | top + service + case + updates の ja/en 8 page 全 200 | 10 min |
| 2 | Supabase RLS green | 3 抜き打ち table (own-auto-06 mock 連動) | 10 min |
| 3 | Sentry baseline | error 0 件 (5 min 監視窓) | 10 min |
| 4 | Vercel Analytics baseline | event tracking 1 sample (page_view) 動作 | 5 min |
| 5 | OG image 8 case (staging URL) | `/og/{home,service,case,updates}-{ja,en}.png` 8 file 200 + content-type | 10 min |
| 6 | DB connection pool | 10 concurrent request で connection error 0 | 10 min |
| 7 | auth flow basic | Supabase Auth signup → signin → signout 1 sample 完遂 | 15 min |
| 8 | cross-orchestrator e2e | 2 orchestrator 連携 5 sample (Dev-RR/SS PR ベース) | 20 min |
| **合計** | - | - | **90 min** |

### §3.3 stage 2 PASS 判定

- 8 観点全 PASS = stage 3 (production) 移行 GO 候補
- 1-2 観点 FAIL = Dev-RR/SS で fix → 再 staging deploy
- 3+ 観点 FAIL = stage 2 中止 + Phase 2 W5 着手見直し
- Owner 通知: stage 2 完遂時点で CEO 経由 Slack 共有 (任意 ack 不要)

### §3.4 staging soak (3 hour, 6/3 15:00-18:00)

- regression 検知 = Sentry / Vercel Analytics / DB connection pool 3 軸監視
- 1 件以上の error 検知 = 即 stage 2 失敗扱い → fix → 再 stage 2
- 0 件 = stage 3 移行 GO 確定

---

## §4 stage 3 (任意): production deploy (6/4 09:00-10:00 想定)

### §4.1 production deploy 任意化の根拠

- Phase 2 W5 着手 = main code alias 化完遂 + cross-orchestrator 統合 e2e
- production deploy は **W5 期間中の任意 timing で実施可能** = Phase 2 W5 着手の必須 path ではない
- 6/19 launch day までに production 反映完遂すれば OK = 16 day buffer
- 最早 6/4 朝、最遅 6/9 月までの幅で実施判断 (Web-Ops + Dev + CEO 3 eyes)

### §4.2 production deploy 流れ (6/4 09:00-10:00 想定)

```
[step 0] 前日 6/3 staging soak 3 hour 0 件 = production GO 候補確定
[step 1] 6/4 09:00 OWN-PROD-ACK 派生 card 1 min ack 取得 (R26 起票 OWN-W5-PROD-ACK 候補)
[step 2] 6/4 09:01 staging → production promote (Vercel CLI)
[step 3] 6/4 09:05 production build 完遂
[step 4] 6/4 09:05-09:55 smoke test phase 3 実行
[step 5] 6/4 09:55 stage 3 完遂
[step 6] 6/4 10:00-12:00 production soak 2 hour 観察
```

### §4.3 smoke test phase 3 (production 8 case + VRT 56 + analytics)

| # | 観点 | 検証内容 | 想定時間 |
|---|---|---|---|
| 1 | 8 case 200 OK | production URL で 8 page 全 200 | 5 min |
| 2 | VRT baseline 56 検証 | 8 case × 7 viewport = 56 cell pixel diff < 0.5% | 10 min |
| 3 | OG image 8 case live + SNS preview | Twitter Card Validator + Slack unfurl 1 sample | 10 min |
| 4 | analytics + monitoring baseline | Vercel Analytics + Sentry baseline 5 min 0 件 | 10 min |
| 5 | DNS resolve | `dig prj019.clawbridge.app +short` IP 取得 + CDN edge propagation | 5 min |
| 6 | Lighthouse 90+ (production) | 4 page 各 3 軸 90+ | 10 min |
| **合計** | - | - | **50 min** |

### §4.4 stage 3 PASS 判定

- 6 観点全 PASS = production 反映完遂、launch day 6/19 まで 15 day soak
- 1 観点 FAIL = rollback 経路 1 (PIN-W5 = stage 2 staging hash) で即 rollback (5 min)
- 2+ 観点 FAIL = stage 3 中止 + Phase 2 W5 deploy 全体 hold + Round 26 で再評価

---

## §5 contingency v2 連携 (Marketing-R R24 起票 20 cell マトリクス)

### §5.1 Phase × Case mapping

contingency v2 の 4 phase × 5 case = 20 cell を Phase 2 W5 deploy に mapping:

| Phase / Case | Case A: rollback | Case B: cache purge | Case C: DNS revert | Case D: feature flag off | Case E: full abort |
|---|---|---|---|---|---|
| **T-24h (= 6/2)** | preview hash の保全 | preview cache 確認 | DNS 設定保全 | flag default 確認 | Phase 2 W5 着手 hold |
| **T-0 (= 6/3 stage 1-2)** | preview/staging revert | staging cache purge | staging DNS revert | flag off (preview) | stage 1-2 中止 |
| **T+1h (= 6/3 staging soak)** | staging revert (PIN-pre-W5) | staging cache purge | staging DNS revert | flag off (staging) | stage 2 完遂取り消し |
| **T+24h (= 6/4 stage 3)** | PIN-W5 production rollback | production cache purge | production DNS revert | flag off (production) | stage 3 中止 |

### §5.2 各 Case 確率

| Case | 確率 (Phase 2 W5 段階) | 累積確率 |
|---|---|---|
| Case A: rollback | 8% | 8% |
| Case B: cache purge | 5% | 13% |
| Case C: DNS revert | 2% | 15% |
| Case D: flag off | 4% | 19% |
| Case E: full abort | 3% | 22% |

累積 22% = Marketing-R R24 contingency v2 累積 24% より低い (Phase 2 W5 着手は launch day より低 risk)。

### §5.3 Owner 通知 5 段階 escalation (contingency v2 流用)

| Level | trigger | 通知 channel | 想定時間 |
|---|---|---|---|
| L1 | stage 1 FAIL (1 観点) | Slack #prj-019-launch | 即時 |
| L2 | stage 1 FAIL (2+ 観点) | Slack mention CEO + Owner notice | 5 min 内 |
| L3 | stage 2 FAIL (1-2 観点) | Slack mention CEO + Owner formal ack 任意 | 10 min 内 |
| L4 | stage 2 FAIL (3+ 観点) | Slack DM + メール (Owner) + CEO escalate | 15 min 内 |
| L5 | stage 3 FAIL (2+ 観点) | Slack DM + メール + 電話 (Owner 直連絡) | 30 min 内 |

Phase 2 W5 段階は L3 まで = Owner 拘束 0 min が想定 default。

---

## §6 rollback 経路 (4 経路)

### §6.1 rollback 経路一覧

| 経路 | trigger | rollback 手順 | 想定時間 | impact |
|---|---|---|---|---|
| 1 | stage 1 preview FAIL | git revert (PR 上で) → 再 preview build | 10 min | 0 (preview のみ) |
| 2 | stage 2 staging FAIL | PIN-pre-W5 staging hash に staging revert | 5 min | staging のみ (production 影響 0) |
| 3 | stage 3 production FAIL (軽微) | PIN-W5 production rollback (Vercel rollback) | 5 min | production 5 min downtime + cache propagation 1-3 min |
| 4 | stage 3 production FAIL (重大) | PIN-A (= W4 完遂 OG production rollout 完遂版) に production rollback | 10 min | production 10 min downtime + W5 機能 disable |

### §6.2 PIN tag 体系

| PIN tag | commit | 取得 timing |
|---|---|---|
| PIN-A | OG production rollout 完遂 (6/12 D-7) | Round 26 6/12 D-7 stage 3 完遂時点 |
| PIN-pre-W5 | Phase 2 W5 着手前 staging hash | 6/2 (月) staging build 完遂時点 |
| PIN-W5 | stage 2 staging soak 完遂後 hash | 6/3 (火) 18:00 staging soak 0 件確定時点 |
| PIN-prod-W5 | stage 3 production deploy 完遂後 hash | 6/4 (水) 12:00 production soak 0 件確定時点 |

### §6.3 rollback 経路選択 decision tree

```
stage 3 production FAIL 検知
   ↓
Q1: regression 重大度 = 軽微 (機能 1-2 件 / data 影響 0) ?
   YES → 経路 3 (PIN-W5 staging rollback、5 min)
   NO  → Q2 へ
Q2: regression = data 整合性影響 or 5+ 機能 FAIL ?
   YES → 経路 4 (PIN-A rollback、10 min) + Owner 通知 L5
   NO  → 経路 3
```

### §6.4 rollback 経路 PASS 判定 (rollback 後の確認)

- rollback 完遂後の smoke test phase 3 (6 観点) 全 PASS = rollback OK
- 1 観点 FAIL = 経路 4 へ escalate
- rollback 後 6 観点 PASS で Phase 2 W5 着手 hold + Round 26 で原因調査

---

## §7 deploy 実時間 + 拘束時間 集計

### §7.1 stage 別実時間

| stage | 想定時間 (min) | Owner 拘束 (min) | Web-Ops 拘束 (min) | Dev 拘束 (min) |
|---|---|---|---|---|
| 1 preview | 60 | 0 | 30 | 30 |
| 2 staging | 90 | 0 | 45 | 45 |
| 2 soak | 180 | 0 | 30 (intermittent) | 30 (intermittent) |
| 3 production (任意) | 50 | 1 | 25 | 25 |
| 3 soak | 120 | 0 | 20 (intermittent) | 20 (intermittent) |
| **合計** | **500 (8.3h)** | **1** | **150** | **150** |

### §7.2 Phase 2 W5 全体 deploy 拘束

- Owner: 1 min (stage 3 OWN-W5-PROD-ACK 任意、stage 1-2 拘束 0)
- Web-Ops: 150 min = 2.5h (6/3 09:00-15:00 stage 1+2 で 2h、6/4 stage 3 で 0.5h)
- Dev (RR/SS): 150 min = 2.5h (同上)
- 経過時間: 6/3 09:00 - 6/4 12:00 = 27 hour window (実拘束は 8.3h、buffer 18.7h で fallback 余裕)

---

## §8 制約遵守確認

| 制約 | Round 25 Web-Ops-L 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本計画は markdown 記述、deploy 実機 0 |
| 副作用 0 | OK | 実機 deploy 0 / git operation 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | 既存 12 artifact 全 absolute 無改変、本 file は新規追加のみ |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-l-r25-phase-2-w5-deploy-plan.md` |
| 行数範囲 | OK | 約 320 行 (280-360 範囲内) |

---

## §9 Round 26 引継

### §9.1 Round 26 Web-Ops-M 引継 task

1. **6/3 stage 1+2 実機実行 record** = 本計画 vs 実機 actual の deviation 別 report
2. **OWN-W5-PROD-ACK card 起票** (R25 OWN-OG-PROD-ACK 派生、1 min 設計、19 件目 owner action card 候補)
3. **6/4 stage 3 production deploy 実機実行** (任意 timing、main code alias 化運用安定確認後)
4. **PIN-pre-W5 + PIN-W5 + PIN-prod-W5 tag 取得** + rollback 経路 4 維持確認
5. **launch day v2.2-cand → v2.2 正式版昇格判定** (R24 §9 5 condition 評価) + W5 deploy 完遂を condition に追加候補

### §9.2 Phase 2 W5 完遂後の Phase 2 W6+ 引継

- W6 (6/10-6/16): cross-package 拡張第 2 弾 + production hardening
- W7 (6/17-6/19): launch day 直前の最終確認 (W-04 PIN 突合 + W-09 DNS resolve + W-12 CEO 共有)
- Round 27-28 で W6 deploy 計画 + Round 29 で launch day 直前 deploy freeze 計画

---

## §10 結語

Round 25 Web-Ops-L は **Phase 2 W5 着手 6/3 (火) 09:00 連動の deploy strategy** を本 file (約 320 行) として完成させ、(a) Vercel preview → staging → production 3 段階 deploy + (b) smoke test 4+8+6 観点 phase 1+2+3 + (c) contingency v2 20 cell マトリクス mapping + (d) rollback 4 経路 + PIN tag 体系 + (e) Owner 拘束 1 min + Web-Ops/Dev 各 150 min + (f) 累積 abort 確率 22% (launch day 24% より低 risk) の **6 軸構造化** を確立。Phase 2 W5 着手段階での production deploy は任意化し、main code alias 化運用安定確認後の 6/4-6/9 timing で柔軟に実施可能とする保守的設計により、Phase 2 W5 着手 readiness と launch day 6/19 影響 0 を両立。Round 26 で 6/3 stage 1+2 実機実行 + OWN-W5-PROD-ACK card 起票 + 6/4 stage 3 production deploy 実機実行を Web-Ops-M に引継。

---

**最終更新**: 2026-05-05 (Round 25 / Web-Ops-L 起票)
**次回見直し**: 2026-06-02 (Phase 2 W5 着手前日、staging build 完遂後 PIN-pre-W5 取得確認) / 2026-06-03 09:00 (stage 1 着手) / 2026-06-04 (stage 3 production deploy 任意 timing)

EOF
