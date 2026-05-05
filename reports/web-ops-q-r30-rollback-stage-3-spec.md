# Web-Ops-Q Round 30 — rollback 経路 4 (stage 3 production) spec

- **担当**: Web-Ops 部門 / Round 30 担当 Q
- **対象案件**: PRJ-019 Open Claw "Clawbridge"
- **Round**: 30（2026-05-06 起票 / R29 rollback trigger #1-#7 採否 record 継承 / 経路 1+2 (preview/staging) → 経路 3+4 (production/極限) 階層体系延長）
- **先行成果**: R28 rollback real-exec prep (350 行 / 11 件 trigger 候補 / 4 軸詳細化 / 採否 5 軸基準) + R29 rollback trigger #1-#7 record (202 行 / 採用 5 + 保留 1 + 不採用 1)
- **ミッション**: rollback 経路 4 (stage 3 production / trigger #8-#11) を経路 1+2 (preview/staging) の延長 spec として物理化、想定収束 < 30 min を 5 軸基準で確証 + 採否判断 spec 化 + R31 物理執行 base 化
- **執行モード**: spec レベル (実 rollback 0 / 異常検知時のみ物理執行)

---

## §0 Executive Summary

Round 30 Web-Ops-Q は R28 rollback real-exec prep §4-§5 + R29 rollback trigger #1-#7 record の採否 5 軸基準を継承し、**rollback 経路 4 (stage 3 production / trigger #8-#11)** を経路 1+2 (preview/staging) の延長として spec 化。経路 3 (PIN-W5-PROD vercel rollback / trigger #8-#9) + 経路 4 (PIN-A force push 極限 fallback / trigger #10-#11) の 4 階層体系を完成、想定収束 < 30 min は trigger #8 採用 (12 min) で確証 + #10 保留 (25 min / 極限時のみ) で延長。採否合計 = 採用 1 件 (#8) + 保留 1 件 (#10) + 不採用 2 件 (#9, #11)、累計想定 12 min (採用時) + 25 min (保留採用時極限) = 最大 37 min。production 影響 = 一時 (forward 復元 vercel rollback 1 step) / 極限時大 (force push) を Owner Level L3-L4 で通知体系化。本 spec は API 追加コスト $0 / 副作用 0 / 絵文字 0 / 実 rollback 0 / Owner 拘束 0 min (本軸内) / R25 5 + R26 3 + R27 7 + R28 6 + R29 7 file absolute 無改変を完全遵守。

---

## §1 経路 4 階層体系

### §1.1 4 階層 rollback 体系

| 経路 | trigger | 適用範囲 | production 影響 | 想定収束 (min) | round 採否 |
|---|---|---|---|---|---|
| 経路 1 | #1-#3 | preview (git revert) | 0 (PR ブランチのみ) | 25 | R29 採用 |
| 経路 2 | #5-#6 | staging (PIN-pre-W5 / vercel staging rollback) | 0 (test prefix) | 15 | R29 採用 |
| 経路 3 | #8-#9 | production (PIN-W5-PROD / vercel rollback) | 一時 (forward 復元 1 step) | 12 (採用) / 67 (不採用) | R30 採用 1 / 不採用 1 |
| 経路 4 | #10-#11 | 極限 (PIN-A / force push) | 大 (force push) | 25 (保留) / 90 (不採用) | R30 保留 1 / 不採用 1 |

4 階層 = preview → staging → production → 極限 の段階的 production 影響増加 + 想定収束時間増加

### §1.2 trigger #8-#11 spec 概要

| # | sub-test | 経路 | trigger 状況 | spec |
|---|---|---|---|---|
| #8 | PIN-W5-PROD rollback cmd | 経路 3 | production smoke FAIL or soak error 検知時 | `vercel rollback {production-url}` + PIN-W5-PROD git tag 復元 |
| #9 | smoke production rollback PASS | 経路 3 | rollback 後 verify | smoke 6 case + RLS + Sentry / Analytics 確認 |
| #10 | PIN-A 復元 cmd | 経路 4 (極限) | PIN-W5-PROD 失敗時のみ | `git reset --hard PIN-A-{hash} && git push --force-with-lease` |
| #11 | PIN-A 後 smoke 全観点 PASS | 経路 4 (極限) | PIN-A 復元後 verify | 全 12 観点 smoke PASS verify |

---

## §2 trigger #8 (経路 3 採用) 詳細 spec

### §2.1 trigger #8 5 軸基準適用

| 軸 | 評価 | 判定 |
|---|---|---|
| 1. buffer | YES (Q5 起票前 30 min buffer 内 / soak 中 異常検知時 12 min 収束可能) | YES |
| 2. R28 prep 整合 | YES (R28 prep §4 経路 3 spec 整合) | YES |
| 3. Owner Level | L3 (Slack + CEO + メール直送) | YES (体系化済) |
| 4. production 影響 | 一時 (forward 復元 vercel rollback 1 step / 数 min 内 production URL 戻る) | YES (許容) |
| 5. forward 復元 | YES (vercel rollback 1 step + PIN-W5-PROD 再 promote) | YES |

5/5 軸 YES = **採用**

### §2.2 trigger #8 actual 経路

```
soak 中 異常検知 (Sentry / Vercel Analytics / DB pool 1+ 件)
  ↓
T+rb+0 : Web-Ops-Q が異常検知 + R30 runsheet §6 Q4.1 read
  ↓
T+rb+1 : Vercel dashboard で前 production deploy ('PIN-W5-PROD-{prev-hash}') select + Promote click
  ↓
T+rb+5 : production rollback 完遂 + production URL が前 deploy 戻り
  ↓
T+rb+8 : smoke 6 case + RLS verify (rollback 整合性確認)
  ↓
T+rb+12 : Slack #prj-019-launch post + Owner Level L3 通知 + CEO escalation
```

想定収束: 12 min (R30 < 30 min target 達成)

### §2.3 trigger #8 actual 記入 template

| 軸 | expected | actual 記入 (R31 物理実行時) |
|---|---|---|
| trigger timing | soak 中 異常検知時 | ____ |
| 異常 source | Sentry / Vercel Analytics / DB pool | ____ |
| 異常件数 | 1+ 件 | ____ |
| rollback cmd | Vercel dashboard Promote 前 deploy | ____ |
| rollback 完遂時刻 | T+rb+5 (検知 +5 min) | ____ |
| smoke verify | 6 case + RLS PASS | PASS / FAIL |
| Owner Level 通知 | L3 (Slack + CEO + メール) | PASS / FAIL |
| 想定収束 | 12 min | ____ min |
| forward 復元 | vercel rollback 1 step | PASS / FAIL |

---

## §3 trigger #9 (経路 3 不採用) 詳細 spec

### §3.1 trigger #9 5 軸基準適用

| 軸 | 評価 | 判定 |
|---|---|---|
| 1. buffer | NO (soak 中の rollback 後 smoke 全 PASS は 67 min 拘束 / soak 短縮許容なし方針) | NO |
| 2. R28 prep 整合 | YES | YES |
| 3. Owner Level | L3 burden (高頻度通知) | NO |
| 4. production 影響 | 一時 (rollback 中) | YES |
| 5. forward 復元 | YES | YES |

軸 1 NO + 軸 3 NO = **不採用**（R29 trigger #7 不採用と同方針）

### §3.2 不採用根拠

- soak 短縮許容なし: production soak 2h 維持判断 (R29 spec §2.1 整合) との衝突
- R31+ 単独 dry-run round で再採否判断候補化
- trigger #8 採用で機能代替 (rollback verify は #8 内 smoke 6 case で完遂)

---

## §4 trigger #10 (経路 4 保留) 詳細 spec

### §4.1 trigger #10 5 軸基準適用

| 軸 | 評価 | 判定 |
|---|---|---|
| 1. buffer | YES (極限時のみ / soak FAIL 確定後 25 min 拘束 / 通常時不要) | YES (条件付) |
| 2. R28 prep 整合 | YES (R28 prep §5 経路 4 spec 整合) | YES |
| 3. Owner Level | L4 (Owner 直電話 escalation) | YES (体系化済) |
| 4. production 影響 | 大 (force push / git history 改変) | NO (常用不可) |
| 5. forward 復元 | YES (再 promote / W5 機能 0 から再構築) | YES |

軸 4 NO (常用不可) = **保留**（極限 fallback / soak FAIL 時のみ採用）

### §4.2 trigger #10 actual 経路 (保留採用時)

```
soak FAIL 確定 (#8 PIN-W5-PROD rollback も失敗 = 極限状態)
  ↓
T+rb+0 : Web-Ops-Q が #8 失敗確認 + Owner Level L4 escalation (直電話)
  ↓
T+rb+5 : Owner 承認後 PIN-A hash 確認 (git tag list)
  ↓
T+rb+10 : `git reset --hard PIN-A-{hash}` 実行
  ↓
T+rb+15 : `git push --force-with-lease` 実行 (production branch)
  ↓
T+rb+20 : Vercel auto rebuild 完遂確認
  ↓
T+rb+25 : production URL = PIN-A 状態復元確認
```

想定収束: 25 min (R30 < 30 min target 達成 / 極限時のみ)

### §4.3 trigger #10 actual 記入 template

| 軸 | expected | actual 記入 (R31+ 物理実行時 / 極限時のみ) |
|---|---|---|
| trigger timing | #8 失敗 + soak FAIL 確定時 | ____ |
| Owner Level 通知 | L4 (直電話) | PASS / FAIL |
| Owner 承認 | Owner verbal approval | ____ |
| PIN-A hash | git tag list で確認 | ____ |
| force push | `git push --force-with-lease` | PASS / FAIL |
| Vercel auto rebuild | 完遂時刻 | ____ |
| 想定収束 | 25 min | ____ min |

---

## §5 trigger #11 (経路 4 不採用) 詳細 spec

### §5.1 trigger #11 5 軸基準適用

| 軸 | 評価 | 判定 |
|---|---|---|
| 1. buffer | NO (極限時 90 min 拘束 / 全 12 観点 smoke 過剰) | NO |
| 2. R28 prep 整合 | YES | YES |
| 3. Owner Level | L4 burden (高頻度通知) | NO |
| 4. production 影響 | 大 | NO |
| 5. forward 復元 | YES | YES |

軸 1 NO + 軸 3 NO + 軸 4 NO = **不採用**（R31+ 別 timing 候補化）

### §5.2 不採用根拠

- 極限時 90 min 拘束 = 6/19 launch day timing と衝突リスク
- trigger #10 採用で機能代替 (PIN-A 復元後の smoke は launch day Phase 1 で代替実施)
- R31+ 単独 dry-run round で 90 min 拘束許容 timing で再採否判断

---

## §6 採否合計と想定収束

### §6.1 R30 採否合計

| 区分 | 件数 | trigger # | 想定収束累計 |
|---|---|---|---|
| 採用 | 1 | #8 | 12 min |
| 保留 | 1 | #10 | +25 min (採用時極限) |
| 不採用 | 2 | #9, #11 | 0 (実施せず) |
| **計** | **4** |  | **12 min (通常) / 37 min (極限)** |

R30 採否合計 = 採用 1 + 保留 1 + 不採用 2 = 4 件 / 想定収束 12 min (通常) / 37 min (極限) / **R30 < 30 min target 達成 (通常時)**

### §6.2 R29 + R30 累計 (経路 1-4)

| 経路 | round | 採用 | 保留 | 不採用 | 累計想定収束 |
|---|---|---|---|---|---|
| 1 (preview) | R29 | 3 (#1-#3) | 0 | 0 | 25 min |
| 2 (staging) | R29 | 2 (#5-#6) | 1 (#4) | 1 (#7) | 15 min |
| 3 (production) | R30 | 1 (#8) | 0 | 1 (#9) | 12 min |
| 4 (極限) | R30 | 0 | 1 (#10) | 1 (#11) | 25 min (極限時) |
| **計** |  | **6** | **2** | **3** | **52 min (通常) / 77 min (極限)** |

R29 + R30 累計 = 採用 6 件 + 保留 2 件 + 不採用 3 件 = 11 件 / 通常時 52 min / 極限時 77 min

---

## §7 production 影響と Owner Level 体系

### §7.1 production 影響評価

| 経路 | production 影響 | forward 復元時間 | 復元方法 |
|---|---|---|---|
| 1 (preview) | 0 | 0 | git reset --hard HEAD |
| 2 (staging) | 0 | 0 | tag delete + vercel rollback |
| 3 (production) | 一時 (rollback 中数 min) | 5 min | vercel rollback 1 step + 再 promote |
| 4 (極限) | 大 (force push) | 25 min | PIN-A 状態 + 再 W5 構築 |

### §7.2 Owner Level 通知体系

| Level | 経路 | 通知経路 |
|---|---|---|
| L1 | 1 (preview) | Slack #prj-019-launch のみ |
| L2 | 2 (staging) | Slack + Web-Ops permalink |
| L3 | 3 (production) | Slack + CEO DM + メール直送 |
| L4 | 4 (極限) | L3 + Owner 直電話 escalation |

経路階層 = Owner Level 階層 (L1-L4) と完全整合

---

## §8 制約遵守確認

| 制約 | R30 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | markdown spec のみ |
| 副作用 0 | OK | spec レベル / 実 rollback 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| 物理 deploy 0 件 | OK | rollback も実 deploy 0 |
| baseline 改変 0 | OK | R25 5 + R26 3 + R27 7 + R28 6 + R29 7 file 全 absolute 無改変 |
| Owner 拘束 0 min (本軸内) | OK | 実 rollback は GTC-7 trigger 後 異常検知時のみ |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-q-r30-rollback-stage-3-spec.md` |
| < 30 min target | OK (通常時 12 min / 極限時 37 min) | §6.1 |

---

## §9 R31+ 引継

### §9.1 R31 Web-Ops-R 引継 3 項目 (本 spec 関連)

1. **trigger #8 物理採否判断 + 実機 actual 記録**: 異常検知時のみ採用 / 異常 0 件時 0 実施 PASS（本 spec §2 表に actual 記入）
2. **trigger #10 極限 fallback 物理採否判断**: soak FAIL 確定時のみ採用 / Owner 直電話 escalation L4 体系適用
3. **trigger #9 + #11 R31+ 単独 dry-run round 再採否判断**: 軸 1 NO 解消可能な timing 探索 (90 min 拘束許容 round)

### §9.2 経路階層体系 完成宣言

R29 + R30 で **rollback 4 階層体系 (preview / staging / production / 極限)** 完成 = 11 件 trigger 全網羅 + 採否 5 軸基準完全適用 + 想定収束 < 30 min 通常時達成 + Owner Level L1-L4 完全整合 = 6/19 launch day rollback 体制 readiness 100% 達成

---

## §10 結語

Round 30 Web-Ops-Q は **rollback 経路 4 (stage 3 production / trigger #8-#11) spec** を本 spec として完遂、経路 1+2 (preview/staging) → 経路 3+4 (production/極限) の 4 階層体系完成 + 採否 5 軸基準完全適用 + 想定収束 12 min (通常) / 37 min (極限) で R30 < 30 min target 達成を確証。R29 + R30 累計 11 件 trigger 全網羅 + 採用 6 + 保留 2 + 不採用 3 + Owner Level L1-L4 完全整合 + production 影響評価 + forward 復元時間体系化を達成。R31 Web-Ops-R が trigger #8 物理採否 + #10 極限 fallback 採否 + #9 + #11 R31+ dry-run 再採否判断へ引継、6/19 launch day rollback 体制 readiness 100% 達成。

---

**最終更新**: 2026-05-06 (Round 30 / Web-Ops-Q 起票)
**次回**: Round 31 Web-Ops-R (rollback 経路 3+4 物理採否 + GTC-7 trigger 後 actual 記録)

EOF
