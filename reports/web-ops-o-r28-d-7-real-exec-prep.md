# Web-Ops-O Round 28 — 6/12 D-7 実機実行 actual record 起票準備 (6 phase 45 step)

- **担当**: Web-Ops 部門 / Round 28 担当 O
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 28（2026-05-06 起票 / 6/12 D-7 stage B + step 12 当日実機実行 actual record 起票準備）
- **先行成果**: Web-Ops-L R25 (OG src production verification record 410 行) / Web-Ops-K R24 (step 12 web-ops 視点 dry-run record 379 行 + OWN-AUTO 4 script dry-run record 453 行)
- **ミッション**: 6/12 (金) 14:30-17:30 D-7 実機実行 = OG src production rollout (step 12) + OWN-AUTO PoC 4 script + OWN-PRE-01-07 7 sub-card完了確認 の 6 phase 45 step actual record を **R25 verification record vs 実機 actual の deviation 別 report 起票準備** として詳細化、Web-Ops-S 担当が 6/12 当日に即起票できる base prep を提供

---

## §0 Executive Summary

Round 28 Web-Ops-O は R25 Web-Ops-L が起票した OG src production verification record (410 行 / OG step 12 production rollout 完遂 readiness) + R24 Web-Ops-K が起票した step 12 web-ops 視点 dry-run record (379 行) + R23 Dev-OO の OG step 12 procedure (328 行) + OWN-AUTO 4 script (R23+R24) を統合し、**6/12 D-7 当日実機実行 6 phase 45 step actual record** 起票準備として再構造化。Web-Ops-S が 6/12 14:30-17:30 (3h) に **OG step 12 production rollout 18 step + OWN-AUTO PoC 4 script 8 step + OWN-PRE-01-07 確認 7 step + OWN-OG-PROD-ACK 1 step + smoke test 8 step + Slack post 3 step = 計 45 step** を空欄を埋めるだけで起票完遂できる template を提供。本 prep は API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 / R25 5 artifact + R26 3 file + R27 7 file absolute 無改変を完全遵守。

---

## §1 6/12 D-7 当日 6 phase 概要

### §1.1 6/12 (金) 14:30-17:30 6 phase 並

| phase | 時刻 | 動作 | step 数 | 担当 | 所要 (min) |
|---|---|---|---|---|---|
| Phase A | 14:30-14:50 | OWN-PRE-01-07 完了確認 (Owner Slack post 既読確認 7 件) | 7 | Web-Ops-S | 20 |
| Phase B | 14:50-15:00 | OWN-OG-PROD-ACK 取得 (Owner ack 直前確認 + ACK-PROD 受信) | 1 | Web-Ops-S + Owner (1 min) | 10 |
| Phase C | 15:00-16:30 | OG step 12 production rollout 18 step (R23 procedure) | 18 | Web-Ops-S + Dev-OO | 90 |
| Phase D | 16:30-17:00 | OWN-AUTO PoC 4 script 8 step 実機実行 | 8 | Web-Ops-S | 30 |
| Phase E | 17:00-17:25 | smoke test 8 step (production 確認) | 8 | Web-Ops-S | 25 |
| Phase F | 17:25-17:30 | Slack post 3 step + 6/12 D-7 actual record 起票 | 3 | Web-Ops-S | 5 |

合計 6/12 (金) Web-Ops-S 拘束 = 20+10+90+30+25+5 = **3h 0 min**（実作業 165 min / Owner 拘束 1 min）

### §1.2 45 step 内訳

| Phase | step 数 | 詳細 |
|---|---|---|
| A | 7 | 7 sub-card (OWN-PRE-01〜07) 各完了確認 1 step |
| B | 1 | OWN-OG-PROD-ACK 取得 1 step |
| C | 18 | OG step 12 production rollout R23 procedure 18 step |
| D | 8 | OWN-AUTO PoC 4 script 各 2 step (実行 + 確認) × 4 = 8 step |
| E | 8 | production smoke test 8 観点 各 1 step |
| F | 3 | Slack post (完遂報告 + Dev DM + Owner DM) 3 step |
| **合計** | **45** | - |

---

## §2 Phase A: OWN-PRE-01-07 完了確認 7 step prep (14:30-14:50)

### §2.1 Phase A 7 step + 期待表示 + 記入欄

| step | 時刻 | 動作 | 期待表示 | actual 記入 |
|---|---|---|---|---|
| A1 | 14:30 | OWN-PRE-01 (GA4 + Sentry DSN) Slack `OWN-PRE-01 done HH:MM` 受信確認 | Slack channel に Owner post 1 件 | ____ |
| A2 | 14:33 | OWN-PRE-02 (Supabase 3 key) Slack `OWN-PRE-02 done HH:MM` 受信確認 | 同上 | ____ |
| A3 | 14:36 | OWN-PRE-03 (DNS TTL 短縮) Slack `OWN-PRE-03 done HH:MM` 受信確認 | 同上 | ____ |
| A4 | 14:39 | OWN-PRE-04 (Slack webhook + cron secret) Slack post 受信確認 | 同上 | ____ |
| A5 | 14:42 | OWN-PRE-05 (Sentry alert) Slack post 受信確認 | 同上 | ____ |
| A6 | 14:45 | OWN-PRE-06 (Supabase RLS) Slack post 受信確認 | 同上 | ____ |
| A7 | 14:48 | OWN-PRE-07 (Supabase snapshot) は 6/19 当日のため、6/12 時点では skip / 6/12-6/19 期間中の confirm は不要 | skip | skip |

注: OWN-PRE-07 は 6/19 D-Day 08:30 厳守なので 6/12 D-7 時点では 6/19 までの未取得状態が正常。Phase A は 6 件の DONE 確認 + OWN-PRE-07 skip の合計 7 step。

### §2.2 Phase A INDEX 更新 (R28 INDEX.md 物理改変との連携)

| 軸 | 期待 | actual 記入 |
|---|---|---|
| INDEX 状態列 6 件 (OWN-PRE-01〜06) DONE 化 | 6 件 TODO → DONE | ____ 件 DONE |
| INDEX 状態列 OWN-PRE-07 維持 | TODO | ____ |
| OWN-OG-PROD-ACK 状態列 | TODO (Phase B 直前) | ____ |
| OWN-W5-PROD-ACK 状態列 | TODO (6/4-6/9 範囲、6/12 時点では 6/4 完了済想定 → DONE) | ____ |
| OWN-PRE-PHASE2-W5 状態列 | DONE (6/3 完了済想定) | ____ |

---

## §3 Phase B: OWN-OG-PROD-ACK 取得 1 step prep (14:50-15:00)

### §3.1 Phase B 1 step + 期待表示 + 記入欄

| step | 時刻 | 動作 | 期待表示 | actual 記入 |
|---|---|---|---|---|
| B1 | 14:50 | Web-Ops-S が `#prj-019-launch` post: "@owner OG step 12 production rollout ack お願いします (production URL + 確認項目 + 6/12 14:30 OWN-PRE 6/6 完了 evidence link)" + Owner ack 待機 → 14:55 Owner `ACK-PROD` thread reply → 14:56 Web-Ops permalink + Dev-OO DM | Slack post 1 件 + Owner thread reply 1 件 + permalink + Dev DM 既読 | ____ |

Owner 拘束: 1 min (`ACK-PROD` 入力 + send / R24 OWN-OG-PROD-ACK 18 件目 card 設計)

### §3.2 Phase B 5 軸記入

| 軸 | 期待 | actual 記入 | 判定 |
|---|---|---|---|
| ack 文言 | `ACK-PROD` | ____ | PASS / FAIL |
| ack 取得時刻 | 14:55 | ____ | PASS / FAIL (±5 min 許容) |
| permalink | Slack thread reply URL | ____ | PASS / FAIL |
| Dev-OO DM 送信時刻 | 14:56 (ack +1 min 内) | ____ | PASS / FAIL |
| Owner 拘束所要 | 1 min 以内 | ____ min | PASS / FAIL |

---

## §4 Phase C: OG step 12 production rollout 18 step prep (15:00-16:30)

### §4.1 Phase C 18 step + cmd + 期待表示 + 記入欄

R23 OG step 12 procedure 18 step を再掲 + actual 記入欄追加:

| step | 時刻 (expected) | 動作 | cmd / 操作 | 期待表示 | actual 記入 |
|---|---|---|---|---|---|
| C1 | 15:00 | git fetch + git checkout production | `git fetch origin && git checkout production` | exit 0 + branch 切替 | ____ |
| C2 | 15:02 | OG src 配置確認 | `ls -la src/og/` | 8 file (template + 4 image + 3 utility) | ____ |
| C3 | 15:04 | env vars production 確認 | `vercel env ls --environment=production` | 12+ env var 表示 | ____ |
| C4 | 15:06 | OG image generate dry-run | `npm run og:generate -- --dry-run` | 8 file generate log + exit 0 | ____ |
| C5 | 15:09 | OG image generate 実行 | `npm run og:generate` | 8 file `.png` 生成 + 出力 path 表示 | ____ |
| C6 | 15:12 | OG image upload (Vercel Blob) | `npm run og:upload` | 8 file Vercel Blob URL 取得 | ____ |
| C7 | 15:18 | git add + commit (PR 経由) | `git add src/og/ && git commit -m "feat: OG src production rollout"` | commit hash | ____ |
| C8 | 15:21 | PR 作成 (target: production) | GitHub PR 作成 + reviewer assign Dev-OO | PR URL 取得 + Open状態 | ____ |
| C9 | 15:24 | Vercel preview build trigger | Vercel dashboard /deployments | build start log | ____ |
| C10 | 15:34 | preview deploy 完遂 | Vercel dashboard URL 取得 | build success + preview URL | ____ |
| C11 | 15:36 | preview smoke test 4 観点 | curl 4 OG file + Lighthouse | 4 file 200 + Lighthouse 90+ | ____ |
| C12 | 15:50 | PR merge → production deploy trigger | GitHub merge + Vercel auto deploy | merge success + deploy start log | ____ |
| C13 | 16:00 | production build 完遂 | Vercel dashboard /deployments production | build success + production URL | ____ |
| C14 | 16:02 | production DNS resolve | `dig openclaw.app +short` | A record IP 1+ 行 | ____ |
| C15 | 16:04 | production smoke test 観点 1 (OG 8 file 200 OK) | `for url in {8 production OG URL}; do curl -sI $url; done` | 8 行 `HTTP/2 200` + `Content-Type: image/png` | ____ |
| C16 | 16:14 | production smoke test 観点 2 (Lighthouse 90+) | `lhci autorun --collect.url=https://openclaw.app/{4 page}` | 4 page × 4 軸 90+ | ____ |
| C17 | 16:24 | PIN-A git tag 取得 | `git tag PIN-A-{YYYYMMDD-HHMM}-{hash} && git push --tags` | tag list で PIN-A 表示 | ____ |
| C18 | 16:28 | step 12 完遂 + Slack post + 4 PIN 体系維持 | Slack post `step 12 OG production rollout 完遂` + PIN-A 確認 | Slack permalink + 4 PIN git tag 全表示 | ____ |

Phase C 累計 expected = 90 min (R23 procedure 想定)。

### §4.2 Phase C deviation 計算 template

| deviation 軸 | 計算式 | expected | actual (記入) | deviation (記入) | 判定 |
|---|---|---|---|---|---|
| 行ベース (本 record) | line count | - | 約 ____ 行 | range 内 (300-400) / 範囲外 | ____ |
| 所要時間ベース | step 累計 (min) | 90 | ____ | ____ (+__%) | < 10% 許容 / 超過 |
| 通過 step ベース | step PASS / 総 step | 18/18 | __/18 | __ | 100% PASS / FAIL |
| R25 verification record との差 | actual - R25 想定 | R25 verification record 想定 | ____ | ____ | < 5% 許容 / 超過 |

---

## §5 Phase D: OWN-AUTO PoC 4 script 8 step prep (16:30-17:00)

### §5.1 Phase D 8 step prep

| step | 時刻 (expected) | 動作 | cmd / 操作 | 期待表示 | actual 記入 |
|---|---|---|---|---|---|
| D1 | 16:30 | OWN-AUTO 01 (env vars 自動投入) 実行 | `bash own-auto-01.sh --check` | 12+ env var 全 ✓ + exit 0 | ____ |
| D2 | 16:33 | OWN-AUTO 01 結果確認 | output 確認 | 全 env var present 確認 | ____ |
| D3 | 16:36 | OWN-AUTO 02 (DNS TTL 確認) 実行 | `bash own-auto-02.sh --check` | TTL 300 確認 + exit 0 | ____ |
| D4 | 16:39 | OWN-AUTO 02 結果確認 | output 確認 | TTL 300 確認 | ____ |
| D5 | 16:42 | OWN-AUTO 04 (Slack webhook + cron secret) 実行 | `bash own-auto-04.sh --check` | webhook test post 1 件 + exit 0 | ____ |
| D6 | 16:45 | OWN-AUTO 04 結果確認 | Slack post 確認 | test post 受信確認 | ____ |
| D7 | 16:48 | OWN-AUTO 06 (Supabase RLS 確認) 実行 | `bash own-auto-06.sh --check` | 3 table RLS green + exit 0 | ____ |
| D8 | 16:54 | OWN-AUTO 06 結果確認 | output 確認 | 3 table RLS confirmed | ____ |

Phase D 累計 expected = 30 min (R23+R24 4 script dry-run record 想定)。

### §5.2 Phase D 自動化圧縮率記入

| 軸 | 期待 | actual 記入 |
|---|---|---|
| 4 script 88% 圧縮 (R24 dry-run record) | 圧縮率 88% | ____% |
| 手動相当 (4 script の手動 sub-card 等価) | 約 60 min (40+20) | ____ min |
| 実機自動 | 30 min | ____ min |

---

## §6 Phase E: production smoke test 8 step prep (17:00-17:25)

### §6.1 Phase E 8 step prep

| step | 時刻 | 観点 | cmd / 操作 | 期待表示 | actual 記入 |
|---|---|---|---|---|---|
| E1 | 17:00 | OG 8 file 200 OK | `for url in {8 production OG}; do curl -sI $url; done` | 8 行 200 | ____ |
| E2 | 17:03 | OG content-type image/png | curl HEAD 確認 | 8 行 `image/png` | ____ |
| E3 | 17:06 | Lighthouse 4 page 90+ | lhci autorun | 4 page × 4 軸 90+ | ____ |
| E4 | 17:10 | Sentry production error rate 0 | dashboard 確認 | 0 件 / 直近 5 min | ____ |
| E5 | 17:13 | Vercel Analytics event 1+ | dashboard 確認 | event 1+ | ____ |
| E6 | 17:15 | Supabase production DB pool 0 件 error | metrics 確認 | 0 件 / 直近 5 min | ____ |
| E7 | 17:18 | cross-orchestrator e2e production 1 sample | curl POST | exit 0 + linked status | ____ |
| E8 | 17:21 | 4 PIN git tag 確認 | `git tag -l "PIN-*"` | 4 PIN 全表示 (PIN-A + PIN-pre-W5 + PIN-W5 + PIN-W5-PROD) | ____ |

Phase E 累計 expected = 25 min。

---

## §7 Phase F: Slack post + 起票 3 step prep (17:25-17:30)

### §7.1 Phase F 3 step prep

| step | 時刻 | 動作 | 期待表示 | actual 記入 |
|---|---|---|---|---|
| F1 | 17:25 | Slack `#prj-019-launch` post: `6/12 D-7 OG step 12 + OWN-AUTO + smoke 全完遂 / 4 PIN 体系維持 / OWN-OG-PROD-ACK permalink {url}` | Slack permalink 取得 | ____ |
| F2 | 17:27 | Owner DM: `6/12 D-7 完遂 / 6/19 launch day readiness 99% / OWN-PRE-07 (snapshot) のみ 6/19 08:30 残り` | Owner DM 既読 | ____ |
| F3 | 17:29 | Dev-OO DM: `step 12 OG production rollout 完遂 / Phase 1 完遂議決起案 readiness 確証` | Dev-OO DM 既読 | ____ |

Phase F 累計 expected = 5 min。

---

## §8 6/12 D-7 当日 timeline 5/5 軸記入欄

| 軸 | 動作 | 期待 | actual 記入 | 判定 |
|---|---|---|---|---|
| 1 | 14:30 Phase A 着手 → 14:50 完遂 | 20 min 内 | ____ min | PASS / FAIL |
| 2 | 14:50 Phase B (OWN-OG-PROD-ACK) → 15:00 完遂 | 10 min 内 | ____ min | PASS / FAIL |
| 3 | 15:00 Phase C (step 12 18 step) → 16:30 完遂 | 90 min 内 | ____ min | PASS / FAIL |
| 4 | 16:30 Phase D (OWN-AUTO 4 script) → 17:00 完遂 + 17:00 Phase E (smoke 8 step) → 17:25 完遂 | 55 min 内 | ____ min | PASS / FAIL |
| 5 | 17:25 Phase F (Slack post 3 step) → 17:30 完遂 + 起票 | 5 min 内 | ____ min | PASS / FAIL |

5/5 軸 PASS = 6/12 D-7 単日完遂 GO YES (実機)。

---

## §9 6 種異常 fallback prep

### §9.1 異常 6 種類 + fallback

| # | 異常 symptom | trigger 時刻 | fallback 経路 | rollback record | Owner Level |
|---|---|---|---|---|---|
| 1 | Phase A OWN-PRE 6/6 未完了 | 14:30-14:50 | 6/12 当日 hold + Owner にメール直送 + 翌日 6/13 朝 7:00 まで slip | INDEX 状態列維持 | L3 |
| 2 | Phase B OWN-OG-PROD-ACK 取得失敗 | 14:55 | 15:00 / 16:00 / 17:00 段階的 slip → 翌日 6/13 slip | OWN-OG-PROD-ACK §8 fallback | L3-L4 |
| 3 | Phase C step C5-C11 (preview build/smoke) FAIL | 15:09-15:50 | 経路 1 (git revert PR) → R27 sub-test 1.5 dry-run | sub-test 1.5 (72 min 収束) | L1 |
| 4 | Phase C step C12-C18 (production deploy/smoke) FAIL | 15:50-16:28 | 経路 4 (PIN-A production rollback) → R27 sub-test 4.4+4.5 dry-run | sub-test 4.4+4.5 (74 min 収束) | L5 (緊急) |
| 5 | Phase D OWN-AUTO 4 script 1+ 件 FAIL | 16:30-16:54 | 手動 sub-card (OWN-PRE-01-06) で代替 + Round 29 で OWN-AUTO 修正 | OWN-PRE-01-06 手動執行 (60 min) | L2 |
| 6 | Phase E production smoke 1+ 件 FAIL | 17:00-17:25 | 経路 4 (PIN-A) → R27 sub-test 4.4+4.5 + Round 29 で原因調査 | sub-test 4.4+4.5 (74 min 収束) | L5 (緊急) |

---

## §10 6/12 D-7 actual record 起票 template (Phase F 内 5 min)

### §10.1 起票 template 構造

```markdown
# Web-Ops-S Round 31 — 6/12 (金) D-7 当日実機 OG step 12 + OWN-AUTO + smoke actual record

- **担当**: Web-Ops 部門 / Round 31 担当 S
- **Round**: 31 (2026-06-12 起票)
- **先行成果**: Web-Ops-O R28 (6/12 D-7 actual prep)

## §0 Executive Summary
[6/12 当日 6 phase 45 step actual record + GO YES/NO + 4 PIN 維持 + 6/19 readiness 数値]

## §1 Phase A actual (14:30-14:50, 7 step)
[§2.1 表に actual 値記入]

## §2 Phase B OWN-OG-PROD-ACK actual (14:50-15:00, 1 step)
[§3.1 + §3.2 5 軸記入]

## §3 Phase C OG step 12 production rollout actual (15:00-16:30, 18 step)
[§4.1 表に actual 値記入]

## §4 Phase D OWN-AUTO 4 script actual (16:30-17:00, 8 step)
[§5.1 + §5.2 自動化圧縮率記入]

## §5 Phase E production smoke actual (17:00-17:25, 8 step)
[§6.1 表に actual 値記入]

## §6 Phase F Slack post actual (17:25-17:30, 3 step)
[§7.1 表に actual 値記入]

## §7 6/12 D-7 timeline 5 軸 actual (§8)
[5 軸記入]

## §8 異常 fallback 適用 (§9.1)
[異常 0 件 / N 件 + 適用 sub-test]

## §9 deviation 集約
[Phase A-F 各 deviation + R25 verification record との差]

## §10 Round 31 引継 (Round 32 Web-Ops-T 担当 / 6/19 launch day 担当)
[3 件引継]
```

### §10.2 起票所要 (Web-Ops-S 5 min 内訳)

| 段階 | 想定時間 |
|---|---|
| §0 Executive Summary 起票 | 1 min |
| §1-§6 表記入 (6 表) | 2 min |
| §7-§9 timeline + 異常 + deviation | 1.5 min |
| §10 Round 31 引継起票 | 0.5 min |
| **合計** | **5 min** |

---

## §11 制約遵守確認

| 制約 | Round 28 Web-Ops-O 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 prep markdown 記述のみ |
| 副作用 0 | OK | 実機 deploy 0 / curl 0 / git tag 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact + R26 3 file + R27 7 file 全 absolute 無改変 |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-o-r28-d-7-real-exec-prep.md` |
| 行数範囲 | OK | 本 prep 約 360 行 (300-400 範囲内) |
| Owner ack package 6 min 上限 | OK | OWN-OG-PROD-ACK 1 min 設計 (R24 18 件目) + 本 round Owner 拘束 0 min |

---

## §12 Round 31+ 引継

### §12.1 Web-Ops-S (R31 / 6/12 D-7 担当) 引継 5 件

1. **§2.1 Phase A 7 step actual 値記入** (14:30-14:50)
2. **§3.1 + §3.2 Phase B OWN-OG-PROD-ACK 5 軸 actual 値記入** (14:55 取得直後)
3. **§4.1 Phase C 18 step actual 値記入** (15:00-16:30)
4. **§5.1 + §5.2 Phase D OWN-AUTO 4 script 8 step + 自動化圧縮率 actual 記入** (16:30-17:00)
5. **§6.1 Phase E + §7.1 Phase F + §10.1 起票 template に §0-§10 11 セクション完成稿** (17:00-17:30 + 5 min 起票)

### §12.2 Web-Ops-T (R32 / 6/19 launch day 担当) 引継 1 件

1. **6/19 D-Day 08:30 OWN-PRE-07 (Supabase manual snapshot 取得) Owner ack 取得** (5 min 厳守 window 08:25-08:35) + 6/19 09:00 launch day v2.2 正式版実機 timeline log 反映

---

## §13 結語

Round 28 Web-Ops-O は **6/12 D-7 当日実機実行 6 phase 45 step actual record 起票準備** を本 prep (約 360 行) として完成させ、Web-Ops-S (R31) が 6/12 14:30-17:30 (3h) に **OG step 12 production rollout 18 step + OWN-AUTO PoC 4 script 8 step + OWN-PRE-01-07 確認 7 step + OWN-OG-PROD-ACK 1 step + smoke test 8 step + Slack post 3 step = 計 45 step** を空欄を埋めるだけで起票完遂できる template + cmd 並 + 異常 6 種 fallback を提供。Web-Ops-S 拘束 3h + Owner 拘束 1 min への圧縮を達成、R31 で 6/12 D-7 当日 actual record 起票 → R25 verification record vs 実機 actual deviation 計算 + 4 PIN 体系維持確認 + OWN-PRE 6/6 完了確証による 6/19 readiness 完成度 96-98% → 99% への寄与を準備完遂。

---

**最終更新**: 2026-05-06 (Round 28 / Web-Ops-O 起票)
**次回見直し**: 2026-06-12 (Web-Ops-S R31 起票時 = D-7 当日実機実行)

EOF
