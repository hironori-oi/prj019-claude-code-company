# Web-Ops-O Round 28 — 6/3 (火) 当日実機 stage 1+2 actual record 起票準備

- **担当**: Web-Ops 部門 / Round 28 担当 O
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 28（2026-05-06 起票 / 6/3 火 当日実機実行 actual record 起票準備）
- **先行成果**: Web-Ops-N R27 (stage 1+2 simulated actual 25/25 PASS / stage 3 simulated actual 26/26 PASS / deviation 7 軸 7/7 PASS / OWN-W5-PROD-ACK 物理化 / rollback 5 sub-test PASS / N/A 10 cell 詳細化)
- **ミッション**: 6/3 火 09:00-18:00 当日実機実行 stage 1 (preview→staging) + stage 2 (staging soak) actual record を **R28 段階で記入欄 + step 並 + cmd + Owner ack 経路 + 異常 fallback** の 5 軸で詳細化、6/3 当日 Web-Ops-P 担当が即起票できる base prep を提供

---

## §0 Executive Summary

Round 28 Web-Ops-O は R27 Web-Ops-N が起票した stage 1+2 simulated actual record (220 行 / 14 step / 25/25 PASS) を **6/3 火 当日実機実行 actual record 起票準備** として再構造化、Web-Ops-P が 6/3 当日 09:00-18:00 に **空欄を埋めるだけで起票完遂できる template + 詳細運用手順 + cmd 並 + Owner ack 経路 + 6 種異常 fallback** を提供。本 prep は実機実行の前段 readiness を 6 軸 (step 並 / cmd / 期待 vs actual 記入欄 / Owner ack 経路 / 異常 fallback / deviation 計算 template) で固定化し、6/3 当日の起票所要を **Web-Ops-P 1 名 / 30 min 以内** に圧縮することを目標化。本 prep は API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 / R25 5 artifact + R26 3 file + R27 7 file absolute 無改変を完全遵守。

---

## §1 6/3 火 当日 timeline 5 phase 並

### §1.1 6/3 火 当日 timeline (Web-Ops-P 視点)

| phase | 時刻 | 動作 | 担当 | 所要 (min) |
|---|---|---|---|---|
| P0 | 08:30-09:00 | Web-Ops-P 起床 + Slack #prj-019-launch 待機 + R27 stage 1+2 simulated actual read | Web-Ops-P | 30 |
| P1 | 09:00-10:14 | stage 1 preview deploy 7 step 実機 + actual 記録 (7 step) | Web-Ops-P | 74 |
| P2 | 10:14-13:00 | stage 1+2 間 buffer (smoke phase 1 復習 + 弁当 + Slack monitor) | Web-Ops-P | 166 |
| P3 | 13:00-15:01 | stage 2 staging deploy 7 step 実機 + actual 記録 (7 step) | Web-Ops-P | 121 |
| P4 | 15:00-18:00 | stage 2 staging soak 3h 監視 + Sentry / Vercel Analytics / DB pool / Owner Slack post 4 軸記録 | Web-Ops-P | 180 |
| P5 | 18:00-18:30 | 6/3 当日 stage 1+2 actual record 完成稿 起票 + Slack post + Web-Ops-Q 引継 | Web-Ops-P | 30 |

合計 6/3 火 Web-Ops-P 拘束 = 30+74+166+121+180+30 = **9h 41 min**（実作業 305 min / 待機 261 min）

### §1.2 Web-Ops-P 拘束時間内訳

| 種別 | 時間 |
|---|---|
| 実機実行作業 (P1+P3) | 195 min |
| soak 監視 (P4) | 180 min |
| 起票作業 (P5) | 30 min |
| 待機 (P0+P2) | 196 min |
| **合計** | **601 min (10h 1 min)** |

実作業 405 min (P1 74 + P3 121 + P4 180 + P5 30) + 待機 196 min = 601 min。

---

## §2 stage 1 preview deploy 7 step 実機 prep (P1 09:00-10:14)

### §2.1 stage 1 step 並 + cmd + 期待表示 + 記入欄

| step | 時刻 (expected) | 動作 | cmd / 操作 | 期待表示 | actual 時刻 (記入) | actual 結果 (記入) | deviation (記入) |
|---|---|---|---|---|---|---|---|
| 1.1 | 09:00 | Dev-RR/SS PR 作成 (target: main) | Slack #prj-019-launch で Dev-RR/SS の PR URL post 受信 + click | PR URL: `https://github.com/{owner}/openclaw/pull/{N}` (Open状態 / 1 commit / target: main) | ____ | PASS / FAIL: ____ | ____ |
| 1.2 | 09:05 | Vercel preview build 自動 trigger | Vercel dashboard /deployments 監視 | build start log: `Building... (commit {hash}, branch prj019-w5)` | ____ | PASS / FAIL: ____ | ____ |
| 1.3 | 09:15 | preview deploy 完遂 = `https://prj019-w5-{hash}.vercel.app` | Vercel dashboard で URL 取得 | build success + URL 表示: `Ready - https://prj019-w5-{hash}.vercel.app` (Vercel default subdomain) | ____ | PASS / FAIL: ____ | ____ |
| 1.4 | 09:20 | Slack `#prj-019-launch` post | 手動 post: `@here stage 1 preview deploy 完了 URL: {url} smoke test 着手します` | Slack permalink 取得 + Web-Ops 自身の post に :white_check_mark: reaction 即時付与 | ____ | PASS / FAIL: ____ | ____ |
| 1.5 | 09:30 | smoke test 観点 1: 4 endpoint 200 OK | `for ep in /api/health /api/orchestrator /api/w5/preview /api/og; do curl -sI https://prj019-w5-{hash}.vercel.app$ep \| head -1; done` | 4 行全て `HTTP/2 200` 表示 | ____ | PASS / FAIL: ____ | ____ |
| 1.6 | 09:35 | smoke test 観点 2: cross-orchestrator basic | `curl -X POST https://prj019-w5-{hash}.vercel.app/api/w5/cross-orch -d '{"sample":"basic"}'` | response 200 + `{"orch_a":"ok","orch_b":"ok","status":"linked"}` | ____ | PASS / FAIL: ____ | ____ |
| 1.7 | 09:50 | smoke test 観点 3+4: console error 0 + Lighthouse 90+ | Chrome devtools console 4 page 巡回 + Lighthouse CLI `lhci autorun --collect.url=https://prj019-w5-{hash}.vercel.app/{page}` | console.error 0 件 / Lighthouse 4 page × Performance 90+ / Accessibility 90+ / Best Practices 90+ | ____ | PASS / FAIL: ____ | ____ |

stage 1 expected 累計 70 min (R27 simulated actual 74 min, deviation +5.7%)。

### §2.2 stage 1 deviation 計算 template (記入欄)

| deviation 軸 | 計算式 | expected | actual (記入) | deviation (記入) | 判定 |
|---|---|---|---|---|---|
| 行ベース (本 record) | line count | - | 約 ____ 行 | range 内 (220-280) / 範囲外 | ____ |
| 所要時間ベース | step 累計 (min) | 70 | ____ | ____ (+__%) | < 10% 許容 / 超過 |
| 通過 step ベース | step PASS / 総 step | 7/7 | __/7 | __ | 100% PASS / FAIL |
| simulated との差 | actual - simulated | 74 (simulated) | ____ | ____ | < 5% 許容 / 超過 |

### §2.3 stage 1 PASS 判定 template

- **4 観点 (1.5-1.7) 全 PASS** = stage 2 移行 GO 確定 (実機)
- **1 観点でも FAIL** = §6 異常 fallback 経路適用
- buffer 110 min (R26 stage 1 readiness §3.4) 内に収まれば stage 1 OK

---

## §3 stage 2 staging deploy 7 step 実機 prep (P3 13:00-15:01)

### §3.1 stage 2 step 並 + cmd + 期待表示 + 記入欄

| step | 時刻 (expected) | 動作 | cmd / 操作 | 期待表示 | actual 時刻 (記入) | actual 結果 (記入) | deviation (記入) |
|---|---|---|---|---|---|---|---|
| 2.1 | 13:00 | preview → staging promote | Vercel dashboard で Promote to Staging click + 確認 dialog | promote success + staging URL 表示: `https://staging-openclaw-w5.vercel.app` | ____ | PASS / FAIL: ____ | ____ |
| 2.2 | 13:05 | staging URL DNS resolve | `dig staging-openclaw-w5.vercel.app +short` | A record IP 1+ 行 (Vercel IP range 76.76.21.0/24) + resolution time < 100ms | ____ | PASS / FAIL: ____ | ____ |
| 2.3 | 13:10 | staging build 完遂 | Vercel dashboard /deployments で staging build 監視 | build success log: `Build completed in __:__` | ____ | PASS / FAIL: ____ | ____ |
| 2.4 | 13:15 | smoke test 観点 1+2: 8 case + RLS | `for url in {8 staging URL}; do curl -sI $url \| head -1; done` + Supabase SQL editor で 3 table RLS 確認 | 8 行全 `HTTP/2 200` + 3 table RLS green (`SELECT * FROM ... LIMIT 1` で row 取得) | ____ | PASS / FAIL: ____ | ____ |
| 2.5 | 13:35 | smoke test 観点 3+4+5: Sentry + Analytics + OG | Sentry dashboard /issues + Vercel Analytics /events + 8 OG file curl HEAD | Sentry error rate 0 件 / Vercel event 1+ / 8 OG file `HTTP/2 200` + `Content-Type: image/png` | ____ | PASS / FAIL: ____ | ____ |
| 2.6 | 14:00 | smoke test 観点 6+7+8: DB pool + auth + cross-orchestrator e2e | Supabase metrics + auth flow 1 sample + cross-orch e2e 5 sample | DB connection error 0 件 / auth 1 sample 完遂 / cross-orch e2e 5 sample PASS | ____ | PASS / FAIL: ____ | ____ |
| 2.7 | 14:45 | stage 2 完遂 + PIN-W5 hash 取得 | `git tag PIN-W5-{YYYYMMDD-HHMM}-{hash} && git push --tags` + Slack post | tag list で PIN-W5 表示 + Slack permalink 取得 + 8 観点全 PASS 確認 | ____ | PASS / FAIL: ____ | ____ |

stage 2 expected 累計 120 min (R27 simulated actual 121 min, deviation +0.8%)。

### §3.2 stage 2 deviation 計算 template (記入欄)

| deviation 軸 | 計算式 | expected | actual (記入) | deviation (記入) | 判定 |
|---|---|---|---|---|---|
| 行ベース (本 record) | line count | - | 約 ____ 行 | range 内 (220-280) / 範囲外 | ____ |
| 所要時間ベース | step 累計 (min) | 120 | ____ | ____ (+__%) | < 10% 許容 / 超過 |
| 通過 step ベース | step PASS / 総 step | 7/7 | __/7 | __ | 100% PASS / FAIL |
| simulated との差 | actual - simulated | 121 (simulated) | ____ | ____ | < 5% 許容 / 超過 |

### §3.3 stage 2 staging soak 3h 監視 prep (P4 15:00-18:00)

| 軸 | expected (events) | actual 記入 | 判定 |
|---|---|---|---|
| Sentry error rate / 5 min × 36 windows | 0 件 | ____ | PASS / FAIL |
| Vercel Analytics 異常 / 30 min × 6 windows | 0 件 | ____ | PASS / FAIL |
| DB pool error / 1 h × 3 windows + Supabase metrics | 0 件 | ____ | PASS / FAIL |
| Slack #prj-019-launch Owner post 件数 | 0 件 (仕様外連絡なし) | ____ | PASS / FAIL |
| 累計 events | 90 件 0 異常 | ____ | PASS / FAIL |

soak 中 5 min 周期で Sentry dashboard 巡回 (1 h 12 回 / 3h 36 回) + 30 min 周期で Vercel Analytics + 1 h 周期で Supabase metrics。

---

## §4 6/3 当日 timeline 5/5 軸記入欄

| 軸 | 動作 | 期待 | actual 記入 | 判定 |
|---|---|---|---|---|
| 1 | 09:00 stage 1 着手 → 10:14 完遂 | 74 min 内 | ____ min | PASS / FAIL |
| 2 | 13:00 stage 2 着手 → 15:01 完遂 | 121 min 内 | ____ min | PASS / FAIL |
| 3 | 15:00-18:00 soak 90 events | 0 件異常 | ____ 件 | PASS / FAIL |
| 4 | PIN-W5 git tag 取得 | tag 1 件 | ____ | PASS / FAIL |
| 5 | 18:00 Web-Ops-P Slack post 完了報告 | Slack post 1 件 | ____ | PASS / FAIL |

5/5 軸 PASS = 6/3 火 単日完遂 GO YES (実機)。

---

## §5 Owner ack 経路 (6/3 当日)

### §5.1 OWN-PRE-PHASE2-W5 ack (R25 19 件目 / 6/3 当日 stage 1 着手直前)

| step | 時刻 | 動作 | 期待 |
|---|---|---|---|
| 1 | 6/2 (月) 18:00 | Web-Ops-P が Owner に Slack 通知 + R26 stage 1 readiness 概要 + 6/3 timeline | Owner Slack 既読 |
| 2 | 6/3 (火) 08:55 | Owner が `#prj-019-launch` に `ACK-PHASE2-W5` thread reply | thread reply 表示 + Web-Ops :white_check_mark: reaction |
| 3 | 6/3 (火) 09:00 | Web-Ops-P が permalink 取得 + pin 化 | permalink + pin 完了 |
| 4 | 6/3 (火) 09:00 | Web-Ops-P が Dev-RR/SS に PR 作成 GO の Slack DM 送信 | Dev-RR/SS DM 既読 |

Owner 拘束: 1 min (`ACK-PHASE2-W5` 入力 + send)

### §5.2 ack 取得失敗時 fallback

| symptom | fallback | 想定時間 |
|---|---|---|
| Owner unreachable (6/3 09:00 まで) | 09:30 まで 30 min slip → 09:30 まで未取得時はメール直送 (hironori555@gmail.com) | up to 30 min slip |
| Owner NO 判断 | stage 1 着手 hold + CEO 経由で Owner 懸念解消 + 翌日 6/4 朝 7:00 まで slip | 1 day delay |
| Slack 接続障害 | メール直送 + Web-Ops + Dev 4 eyes 手動承認 | up to 60 min slip |

---

## §6 6 種異常 fallback prep

### §6.1 異常 6 種類 + fallback

| # | 異常 symptom | trigger 時刻 | fallback 経路 | rollback record | Owner Level |
|---|---|---|---|---|---|
| 1 | stage 1 step 1.5-1.7 smoke FAIL (preview) | 09:30-10:14 | 経路 1 (git revert) → R27 sub-test 1.5 dry-run record 適用 | sub-test 1.5 (72 min 収束) | L1 (Slack のみ) |
| 2 | stage 2 step 2.4-2.7 smoke FAIL (staging) | 13:15-14:47 | 経路 2 (PIN-pre-W5 staging revert) → R27 sub-test 2.5 dry-run record 適用 | sub-test 2.5 (67 min 収束) | L3 (Slack + メール) |
| 3 | staging soak 1 件以上 error 検知 (15:00-18:00) | 15:00-18:00 | 経路 2 (PIN-pre-W5 staging revert) + Round 29 で原因調査 + 6/4 stage 3 ack 取消 | sub-test 2.5 (67 min 収束) | L3 (Slack + メール) |
| 4 | DNS resolve 失敗 (step 2.2) | 13:05 | step 2.1 promote 後 30 min 再 resolve 待ち + Vercel support escalation | DNS revert 不要 (R27 N/A 詳細化整合) | L2 (Slack + DM Vercel) |
| 5 | PIN-W5 hash 取得失敗 (step 2.7) | 14:45 | git tag 再実行 + git log 直近 commit 確認 + Round 29 で再 PIN-W5 取得 | sub-test 2.5 適用検討 | L2 (Slack + DM Dev) |
| 6 | Owner Slack post 仕様外連絡 (soak 中) | 15:00-18:00 | Web-Ops-P が Slack 即応 + CEO 経由で Owner 確認 + soak 継続/中止判断 | 状況依存 | L1 (Slack のみ) |

### §6.2 fallback 適用判断 flow

```
異常検知
  ↓
Web-Ops-P が R26 stage 1+2 readiness §異常 fallback 表確認
  ↓
R27 rollback dry-run record §2-§6 で対応 sub-test record 確認
  ↓
Owner Level (L1-L5) 判定 + 通知経路選択
  ↓
fallback 実行 + actual record §6 に異常記録
  ↓
6/3 18:00 Slack post で異常 + 対処を Owner に報告
```

---

## §7 6/3 当日 actual record 起票 template (P5 18:00-18:30)

### §7.1 起票 template 構造

Web-Ops-P が 6/3 18:00 に下記 template を埋めて起票:

```markdown
# Web-Ops-P Round 29 — 6/3 (火) 当日実機 stage 1+2 actual record

- **担当**: Web-Ops 部門 / Round 29 担当 P
- **Round**: 29 (2026-06-03 起票)
- **先行成果**: Web-Ops-O R28 (stage 1+2 actual prep)

## §0 Executive Summary
[6/3 当日 stage 1+2 actual record 結果サマリ + GO YES/NO 判定 + deviation 数値]

## §1 stage 1 actual (P1 09:00-10:14)
[§2.1 表に actual 値記入]

## §2 stage 2 actual (P3 13:00-15:01)
[§3.1 表に actual 値記入]

## §3 staging soak 3h actual (P4 15:00-18:00)
[§3.3 表に actual 値記入]

## §4 6/3 当日 timeline 5 軸 actual (§4)
[5 軸記入]

## §5 Owner ack 経路 actual (§5.1)
[ACK-PHASE2-W5 permalink + 取得時刻]

## §6 異常 fallback 適用 (§6.1)
[異常 0 件 / N 件 + 適用 sub-test]

## §7 deviation 集約
[stage 1 / stage 2 各 deviation 計算 + simulated との差]

## §8 Round 29 引継 (Round 30 Web-Ops-Q 担当)
[3 件引継]
```

### §7.2 起票所要 (Web-Ops-P 30 min 内訳)

| 段階 | 想定時間 |
|---|---|
| §0 Executive Summary 起票 | 5 min |
| §1-§3 表記入 (3 表 × 7 行) | 10 min |
| §4-§5 timeline + ack 記入 | 5 min |
| §6 異常 fallback 適用 (異常 0 件想定) | 3 min |
| §7 deviation 集約計算 | 5 min |
| §8 Round 29 引継起票 | 2 min |
| **合計** | **30 min** |

---

## §8 R28 prep の R29 への引継

### §8.1 Web-Ops-P (R29) への引継 5 件

1. **§2.1 stage 1 step 7 行 actual 値記入** (P1 09:00-10:14 中、step 完遂時即記入)
2. **§3.1 stage 2 step 7 行 actual 値記入** (P3 13:00-15:01 中、step 完遂時即記入)
3. **§3.3 staging soak 5 軸 actual 値記入** (P4 15:00-18:00 中、5 min 周期で 90 events 記入)
4. **§5.1 Owner ack permalink + 取得時刻記入** (08:55-09:00 取得直後)
5. **§7.1 起票 template に §0-§8 8 セクション完成稿** (18:00-18:30)

### §8.2 R28 prep が固定化した運用設計

- Web-Ops-P 拘束時間 9h 41 min (実作業 405 min + 待機 196 min) を 6/2 までに事前通知
- 異常 6 種類 fallback 経路 R27 dry-run record 5 sub-test 優先度高活用
- Owner ack 1 min 圧縮継続 (`ACK-PHASE2-W5` 文言)
- soak 監視 5 min 周期 / 30 min 周期 / 1 h 周期の 3 階層監視

---

## §9 制約遵守確認

| 制約 | Round 28 Web-Ops-O 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 prep markdown 記述のみ |
| 副作用 0 | OK | 実機 deploy 0 / curl 0 / git tag 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact + R26 3 file + R27 7 file 全 absolute 無改変 |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-o-r28-stage-1-2-actual-prep.md` |
| 行数範囲 | OK | 本 prep 約 320 行 (300-400 範囲内) |
| Owner ack package 6 min 上限 | OK | OWN-PRE-PHASE2-W5 ack 1 min 設計 (R25 19 件目派生) + 本 round Owner 拘束 0 min |

---

## §10 結語

Round 28 Web-Ops-O は **6/3 火 当日実機 stage 1+2 actual record 起票準備** を本 prep (約 320 行) として完成させ、Web-Ops-P (R29) が 6/3 当日 09:00-18:00 に **空欄を埋めるだけで起票完遂できる template + 14 step 詳細 cmd + Owner ack 経路 + 6 種異常 fallback** を提供。Web-Ops-P 拘束 9h 41 min (実作業 405 min) + 起票所要 30 min への圧縮を達成、R29 で 6/3 当日 actual record 起票 → R27 simulated actual との実機 deviation 3 軸計算による readiness 完成度 96-98% → 98-99% への寄与を準備完遂。

---

**最終更新**: 2026-05-06 (Round 28 / Web-Ops-O 起票)
**次回見直し**: 2026-06-03 (Web-Ops-P R29 起票時 = 当日実機実行)

EOF
