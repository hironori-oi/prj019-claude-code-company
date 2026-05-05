# Web-Ops-P Round 29 — stage 3 即時実行版 spec (date-free / GTC-7 trigger)

- **担当**: Web-Ops 部門 / Round 29 担当 P
- **対象案件**: PRJ-019 Open Claw "Clawbridge"
- **Round**: 29（2026-05-06 起票 / Owner directive「日付決め打ちなし / 完成次第即時 GO」採用 / R28 stage 3 actual prep の 6/4-6/9 cron schedule を date-free 化）
- **先行成果**: Web-Ops-O R28 stage 3 actual prep (305 行 / 9 step / OWN-W5-PROD-ACK 取得経路 / cron 3 候補) + R29 stage 1+2 actual record (GTC-6 GO YES)
- **ミッション**: stage 3 (production deploy) を **GTC-6 完遂直後即時 trigger 可能経路** として再設計、6 hour soak 圧縮 vs 維持判断 + OWN-W5-PROD-ACK 取得経路 (1 min) の即時化 spec 化、Round 30 Web-Ops-Q が即起票できる base を提供
- **執行モード**: spec レベル（実 deploy は GTC-11 D-Day Phase）

---

## §0 Executive Summary

Round 29 Web-Ops-P は R28 stage 3 actual prep の 6/4-6/9 cron schedule 拘束 (3 候補) を **「日付決め打ちなし / 完成次第即時 GO」方針** に基づき撤廃、stage 3 production deploy 9 step を **GTC-6 GO YES 確定直後即時 trigger 可能** な経路として再設計。soak 期間判断: 元 R28 prep 2h 維持 (圧縮なし)、ただし時刻 cron 撤廃で trigger 即時化、累計想定 250 min (production deploy 87 min + soak 120 min + ack 1 min + 起票 32 min + 待機 10 min) に圧縮 (R28 prep 5h 0 min から -50 min = -16.7%)。OWN-W5-PROD-ACK 取得経路は Owner 1 min / DM 1 行 reply 仕様維持、ack post → ack reply → Web-Ops 即応 → Dev DM の 4 phase を GTC-7 trigger 直前に時系列圧縮 (合計 1 min 30 sec)。本 spec は API 追加コスト $0 / 副作用 0 / 絵文字 0 / R25 5 + R26 3 + R27 7 + R28 6 file absolute 無改変を完全遵守。

---

## §1 GTC-7 trigger 即時実行 timeline (date-free)

### §1.1 GTC-7 trigger 即時実行 5 phase

| phase | 経過 (T = GTC-6 GO YES 直後) | 動作 | 担当 | 所要 (min) |
|---|---|---|---|---|
| Q0 | T+0 → T+5 | Web-Ops-Q R28 stage 3 prep + R29 stage 1+2 actual + OWN-W5-PROD-ACK card read | Web-Ops-Q | 5 |
| Q1 | T+5 → T+10 | Slack #prj-019-launch に Web-Ops post (ack 取得依頼) + Owner ack 待機 | Web-Ops-Q | 5 |
| Q2 | T+10 → T+11 | Owner `ACK-W5-PROD` thread reply + Web-Ops permalink pin 化 + Dev DM | Web-Ops-Q + Owner (1 min) | 1 |
| Q3 | T+11 → T+98 | stage 3 production deploy 9 step 実機 + actual 記録 (9 step) | Web-Ops-Q + Dev-RR/SS | 87 |
| Q4 | T+98 → T+218 | production soak 2h 監視 + Sentry / Vercel Analytics / DB pool / 4 PIN 4 軸記録 | Web-Ops-Q | 120 |
| Q5 | T+218 → T+250 | actual record 完成稿 起票 + Slack post + Web-Ops-R 引継 | Web-Ops-Q | 32 |

合計 GTC-7 即時実行 Web-Ops-Q 拘束 = 5+5+1+87+120+32 = **250 min (4h 10 min)** (R28 cron 拘束 5h 0 min から -50 min = -16.7%)

### §1.2 R28 cron schedule との比較

| 軸 | R28 prep (cron 拘束 6/4-6/9) | R29 spec (即時実行 GTC-7) | deviation |
|---|---|---|---|
| 拘束時間 | 300 min (5h 0 min) | 250 min (4h 10 min) | -50 min / -16.7% |
| 実作業 | 250 min | 245 min | -5 min / -2.0% |
| 待機 | 50 min | 5 min | -45 min / -90.0% |
| trigger 開始時刻 | 6/4 09:00 (cron 候補 A) | T+0 (GTC-6 GO YES 直後即時) | cron 撤廃 |
| ack 取得 | Owner 1 min + Web-Ops 30 sec | Owner 1 min + Web-Ops 30 sec | 0 (維持) |

cron 拘束撤廃により 50 min 短縮 + ack 取得仕様維持 = 「完成次第即時 GO」方針の実効性確証。

---

## §2 6 hour soak 圧縮 vs 維持判断

### §2.1 判断結果: **2h 維持** (R28 prep 整合)

| 軸 | 判断 | 根拠 |
|---|---|---|
| 6 hour soak 圧縮検討 | 不採用 (2h 維持) | R26 stage 2 readiness §3.4 + R28 stage 3 prep §3.3 で 2h soak が production 安定検証の最低必要時間と確定 |
| 圧縮案 (例: 1h or 30min) | 不採用 | Sentry / Vercel Analytics / DB pool 3 軸の異常検知 window が < 1h では false negative リスク高 |
| 拡張案 (例: 6h or 24h) | 不採用 | Phase 2 W5 段階では 2h で十分 / 24h soak は 6/19 launch day 後の Phase 3 で実施 (R31+ 仕様化) |

判断: **soak 2h 維持** (R28 prep §3.3 整合) + cron 拘束のみ撤廃 = 即時 trigger + 確実な monitoring の両立

### §2.2 soak 監視 5 軸 spec (R28 stage 3 prep §3.3 整合)

| 軸 | expected (events) | 監視周期 | window 数 |
|---|---|---|---|
| Sentry error rate | 0 件 | 5 min | 24 |
| Vercel Analytics 異常 | 0 件 | 30 min | 4 |
| DB pool error | 0 件 | 1 h | 2 |
| Slack Owner post | 0 件 (仕様外連絡) | continuous | - |
| 累計 events | 64 件 0 異常 | - | - |

5 軸 0 異常 = stage 3 PASS 確証

---

## §3 OWN-W5-PROD-ACK 取得経路 (即時実行版)

### §3.1 ack 取得 4 phase 並 (T+5 → T+11)

| phase | 経過 | 動作 | 担当 | 期待 |
|---|---|---|---|---|
| 1 | T+5 (= GTC-6 完遂後 5 min) | Web-Ops-Q が Slack #prj-019-launch に post: "@owner Phase 2 W5 stage 3 production deploy ack お願いします (production URL: {url} / GTC-6 PASS evidence link / soak 0 件 link)" | Web-Ops-Q | Slack post + permalink |
| 2 | T+8 → T+10 | Owner Slack 通知到達 + content 確認 (R26 stage 2 readiness §0+§1 + GTC-6 evidence) | Owner | Owner 既読 + 内容確認 |
| 3 | T+10 → T+11 | Owner thread reply に `ACK-W5-PROD` 入力 + send | Owner (1 min) | thread reply 表示 |
| 4 | T+11 (即時) | Web-Ops-Q permalink 取得 + pin 化 + Dev-RR/SS DM `stage 3 promote 着手 GO` | Web-Ops-Q | permalink + pin + Dev DM 既読 |

ack 取得所要: Owner 1 min + Web-Ops 30 sec = 1 min 30 sec (R28 prep §2.1 整合)

### §3.2 ack 取得失敗時 fallback (R28 prep §2.2 から即時化)

| symptom | 即時 fallback | 想定時間 |
|---|---|---|
| Owner R26 stage 2 readiness 未読 | 取得 5 min slip + readiness link 再 post | +5 min |
| Owner `ACK-PROD` 入力 (`ACK-W5-PROD` ではない) | Web-Ops thread reply で marker 確認 + 両 marker 受容で stage 3 着手継続 | 0 |
| Owner NO 判断 | stage 3 中止 + CEO 経由懸念解消 + Round 30+ slip | 1+ round delay |
| Owner unreachable (Slack 未読) | T+30 まで待機 → メール直送 (hironori555@gmail.com) → T+60 まで → 翌日 slip | up to 22h delay |
| 6/3 staging soak 1 件以上検知 | stage 3 着手 hold + Round 31+ で原因調査 + 再 ack 待機 | 1+ round delay |
| PIN-W5 hash 取得不完全 | rollback 経路 2 (PIN-pre-W5) + Round 30+ で再 PIN-W5 取得 + 翌 round 再 ack | 1+ round delay |

### §3.3 ack 取得記入 template (R30 actual 起票時)

| 軸 | 期待 | actual 記入 |
|---|---|---|
| ack 文言 | `ACK-W5-PROD` | ____ |
| ack 取得経過時刻 | T+11 (GTC-7 trigger +11 min) | ____ |
| permalink | Slack thread reply URL | ____ |
| Web-Ops reaction | :white_check_mark: 即時付与 | PASS / FAIL |
| Dev DM 送信経過時刻 | T+11 (ack +0 min 即時) | ____ |
| Owner 拘束所要 | 1 min 以内 | ____ min |

---

## §4 stage 3 production deploy 9 step spec (Q3 T+11 → T+98)

### §4.1 9 step 並 + cmd + 期待表示 (R28 stage 3 prep §3.1 整合 / 経過時刻のみ date-free 化)

| step | 経過 | 動作 | cmd / 操作 | 期待表示 |
|---|---|---|---|---|
| 3.1 | T+11 | staging → production promote | Vercel dashboard で Promote to Production click | promote success + production URL: `https://openclaw.app` |
| 3.2 | T+16 | production build 完遂 | Vercel dashboard /deployments で監視 | build success log |
| 3.3 | T+21 | production URL DNS resolve | `dig openclaw.app +short` | A record + < 100ms |
| 3.4 | T+26 | smoke 6 case + RLS production | curl 6 URL + 3 table RLS | 6 行 200 + RLS green |
| 3.5 | T+41 | smoke Sentry + Analytics production | dashboard 確認 | error 0 + event 1+ |
| 3.6 | T+56 | smoke cross-orch e2e + DB pool production | 5 sample + Supabase metrics | 5 PASS + DB error 0 |
| 3.7 | T+71 | OG image production 8 file | curl HEAD 8 file | 8 file 200 + image/png |
| 3.8 | T+83 | PIN-W5-PROD git tag 取得 | `git tag PIN-W5-PROD-{ts}-{hash} && git push --tags` | tag list 表示 |
| 3.9 | T+93 | stage 3 完遂 + 4 PIN 体系完成 + Slack post | git tag list + Slack post | 4 PIN (PIN-A / PIN-pre-W5 / PIN-W5 / PIN-W5-PROD) 全表示 + permalink |

stage 3 expected 累計 87 min (R27 simulated 87 min + R28 expected 90 min から -3 min = -3.3% / R29 stage 1+2 actual 整合)

### §4.2 9 step 記入欄 (R30 actual 起票時)

各 step に actual 経過時刻 + actual 結果 (PASS/FAIL) + deviation の 3 列を R28 prep §3.1 整合形式で R30 が記入。

---

## §5 異常 fallback spec (R28 prep §6 整合 / 即時化)

### §5.1 異常 6 種 fallback 経路

| # | 異常 symptom | trigger | fallback 経路 | rollback record |
|---|---|---|---|---|
| 1 | step 3.4-3.7 production smoke FAIL | T+26-T+71 | 経路 3 (PIN-W5-PROD rollback) | rollback trigger #8-#9 (R30 採否) |
| 2 | DNS resolve 失敗 (step 3.3) | T+21 | 30 min 再 resolve 待ち + Vercel support | DNS revert 不要 |
| 3 | PIN-W5-PROD hash 取得失敗 (step 3.8) | T+83 | git tag 再実行 + 失敗時は経路 4 (PIN-A) | rollback trigger #10-#11 |
| 4 | production soak error 検知 (T+98-T+218) | T+98-T+218 | 経路 3 (PIN-W5-PROD rollback) + Round 31+ で原因調査 | rollback trigger #8-#9 |
| 5 | Owner Slack post 仕様外連絡 (soak 中) | T+98-T+218 | Web-Ops 即応 + CEO 経由 Owner 確認 | 状況依存 |
| 6 | 4 PIN 体系完成失敗 (step 3.9) | T+93 | git tag list 再確認 + 不足 PIN 個別取得 + Round 30 引継 | 状況依存 |

### §5.2 fallback 適用 flow (R28 §6.2 整合)

```
異常検知
  ↓
Web-Ops-Q が R28 stage 3 prep §6 + R29 rollback trigger #1-#7 record 確認
  ↓
R28 rollback prep §4-§5 で対応 trigger #8-#11 採否判断
  ↓
Owner Level (L1-L5) 判定 + 通知経路選択
  ↓
fallback 実行 + actual record §6 に異常記録
  ↓
T+250 Slack post で異常 + 対処を Owner に報告
```

---

## §6 R30 Web-Ops-Q 起票 template

### §6.1 起票構造 (R30 actual record / 約 250 行想定)

```markdown
# Web-Ops-Q Round 30 — stage 3 即時実行 actual record

## §0 Executive Summary
[GTC-7 trigger T+0 → T+250 結果サマリ + GO YES/NO + deviation 数値]

## §1 GTC-7 trigger 即時実行 timeline 5 phase actual
[本 spec §1.1 表に actual 記入]

## §2 OWN-W5-PROD-ACK 取得 actual
[本 spec §3.3 ack 取得記入 template に値記入]

## §3 stage 3 9 step actual
[本 spec §4.1 表に actual 記入 / 9 step 全]

## §4 production soak 2h 5 軸 actual
[本 spec §2.2 表に actual 記入]

## §5 異常 fallback 適用 (異常 0 件想定)
[本 spec §5.1 表 6 種]

## §6 deviation 集約 (R29 spec vs R30 actual)
[各 step deviation 計算]

## §7 Round 31 引継
[3 件引継]
```

### §6.2 R30 起票所要 (Web-Ops-Q 32 min 内訳)

| 段階 | 想定時間 |
|---|---|
| §0 Executive Summary | 5 min |
| §1-§3 表記入 | 12 min |
| §4 soak 5 軸 | 3 min |
| §5 異常 fallback (0 件想定) | 3 min |
| §6 deviation 集約 | 5 min |
| §7 Round 31 引継 | 4 min |
| **合計** | **32 min** |

---

## §7 GTC-7 GO YES 判定基準

| 軸 | PASS 条件 | 判定 |
|---|---|---|
| 1 | OWN-W5-PROD-ACK 取得 (T+11 内) | ack 文言 `ACK-W5-PROD` + permalink |
| 2 | 9 step PASS (9/9) | 全 step PASS + step 3.4-3.7 smoke 全 PASS |
| 3 | production soak 2h 5/5 軸 PASS | 64 events 0 異常 |
| 4 | 4 PIN 体系完成 (step 3.9) | git tag list で 4 PIN 全表示 |
| 5 | actual record 起票完了 (T+250) | record 1 件 |

5/5 軸 PASS = GTC-7 GO YES 確定

---

## §8 制約遵守確認

| 制約 | R29 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | markdown spec のみ |
| 副作用 0 | OK | spec レベル / 実 deploy 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| baseline 改変 0 | OK | R25 5 + R26 3 + R27 7 + R28 6 file 全 absolute 無改変 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-p-r29-stage-3-immediate-spec.md` |
| Owner 拘束 0 min (本 round) | OK | OWN-W5-PROD-ACK 発火は GTC-7 = R30 |
| 6 hour soak 判断 | OK | 2h 維持 (R28 整合) + cron 撤廃 |

---

## §9 結語

Round 29 Web-Ops-P は **stage 3 即時実行版 spec (date-free / GTC-7 trigger)** を本 spec として完成、cron schedule 拘束撤廃で 50 min 短縮 (5h 0 min → 4h 10 min) + soak 2h 維持判断 + OWN-W5-PROD-ACK 取得経路 1 min 仕様維持 + 9 step + 6 種異常 fallback の即時化を達成。R30 Web-Ops-Q が GTC-6 GO YES 直後即時 trigger で stage 3 actual record 起票 + GTC-7 GO YES 達成準備完遂。

---

**最終更新**: 2026-05-06 (Round 29 / Web-Ops-P 起票)
**次回見直し**: Round 30 Web-Ops-Q (GTC-7 trigger 即時実行 actual)

EOF
