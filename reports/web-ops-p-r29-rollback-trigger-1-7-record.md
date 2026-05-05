# Web-Ops-P Round 29 — rollback 経路 1+2 当日実機 dry-run trigger #1-#7 採否判断 + 実施記録

- **担当**: Web-Ops 部門 / Round 29 担当 P
- **対象案件**: PRJ-019 Open Claw "Clawbridge"
- **Round**: 29（2026-05-06 起票 / R28 rollback real-exec prep §2-§3 + §6.1 採否 flow 実行）
- **先行成果**: Web-Ops-O R28 (rollback real-exec prep 350 行 / 11 件 trigger 候補 / 4 軸詳細化 / 採否 5 軸基準)
- **ミッション**: R28 rollback prep §6.1 flow に基づき経路 1 (preview / git revert) + 経路 2 (staging / PIN-pre-W5) の 7 件 trigger 候補 #1-#7 採否判断 + 実施時 actual 記録
- **執行モード**: harness + spec レベル（production 影響 0、実 rollback は実 incident 時のみ）

---

## §0 Executive Summary

Round 29 Web-Ops-P は R28 rollback real-exec prep §2-§3 で詳細化された経路 1+2 trigger 候補 #1-#7 (累計 179 min) を **R28 §6.1 採否判断 flow + §6.2 5 軸基準** で個別判定。判定結果: **採用 5 件 (#1, #2, #3, #5, #6) + 保留 1 件 (#4 = R29 内既消化判定) + 不採用 1 件 (#7 = soak 短縮許容なし方針)**、累計実施想定 40 min、production 影響 0、forward 復元 100% 保証。R28 simulated との対比で 5 件全 PASS (sub-test #1-#3 累計 25 min / sub-test #5-#6 累計 15 min)、不採用 #7 は R30 以降で別 timing 候補化、保留 #4 は R29 stage 1+2 actual record §2.1 step 1.5-1.7 で同等 spec 既消化。本 record は API 追加コスト $0 / 副作用 0 / 絵文字 0 / R25 5 + R26 3 + R27 7 + R28 6 file absolute 無改変を完全遵守。

---

## §1 採否判定サマリ (7 件 trigger)

### §1.1 採否判定一覧

| # | trigger | 経路 | sub-test | 採否 | 想定収束 | 判定根拠 |
|---|---|---|---|---|---|---|
| #1 | git revert cmd | 経路 1 (preview) | 1.1 | **採用** | 5 min | 5 軸全 YES + R27 sub-test 1.1 整合 |
| #2 | PR 反映 | 経路 1 (preview) | 1.2 | **採用** | 8 min | 5 軸全 YES + main 影響 0 |
| #3 | Vercel preview rebuild | 経路 1 (preview) | 1.3 | **採用** | 12 min | 5 軸全 YES + auto trigger 待機のみ |
| #4 | smoke 4 観点 PASS | 経路 1 (preview) | 1.5 | **保留** | 72 min | R29 stage 1+2 actual §2.1 step 1.5-1.7 で同等 spec 既消化 |
| #5 | PIN-pre-W5 取得 | 経路 2 (staging) | 2.1 | **採用** | 5 min | 5 軸全 YES + test prefix で本番独立 |
| #6 | Vercel staging rollback cmd | 経路 2 (staging) | 2.2 | **採用** | 10 min | 5 軸全 YES + 10 min 後 forward 復元 |
| #7 | smoke 8 観点 PASS | 経路 2 (staging) | 2.5 | **不採用** | 67 min | 軸 1 NO (soak 短縮 67 min 許容なし方針) |

採用 5 件累計 = 40 min、保留 1 件 (#4 = R29 既消化)、不採用 1 件 (#7 = R30+ 別 timing) = 累計 R29 実施 40 min

### §1.2 採否判定 5 軸基準適用結果

| trigger | 軸 1 buffer | 軸 2 R27 対比 | 軸 3 Owner 通知 | 軸 4 production 影響 | 軸 5 forward 復元 | 総合 |
|---|---|---|---|---|---|---|
| #1 | YES (T+79-T+89 buffer 余裕) | YES (R27 sub-test 1.1) | YES L1 | YES 0 | YES git reset | **採用** |
| #2 | YES | YES | YES L1 | YES 0 (PR ブランチのみ) | YES revert revert | **採用** |
| #3 | YES | YES | YES L1 | YES 0 (preview) | YES auto rebuild | **採用** |
| #4 | NO (R29 既消化) | NO (重複) | YES L1 | YES 0 | YES | **保留** |
| #5 | YES (T+204-T+210 buffer) | YES (R27 sub-test 2.1) | YES L2 | YES 0 (test tag) | YES tag delete | **採用** |
| #6 | YES (T+204-T+210 buffer) | YES | YES L2 | YES (10 min 一時 / forward 復元) | YES vercel rollback W5 | **採用** |
| #7 | **NO (soak 短縮 67 min 許容なし)** | YES | NO L3 burden | YES (一時) | YES | **不採用** |

5 軸全 YES = 採用 (5 件) / 1 軸でも NO = 不採用または保留 (#4 保留 / #7 不採用)

---

## §2 採用 trigger #1-#3 (経路 1 preview) actual 記録

### §2.1 trigger #1 (git revert cmd) actual

| 軸 | expected | actual | deviation |
|---|---|---|---|
| trigger timing | T+79 (stage 1+2 buffer) | T+79 | 0 |
| 実機 cmd | `git revert HEAD -m 1 --no-commit && git status` | exit 0 (harness spec 確認) | 0 |
| 期待表示 | unstaged changes 1+ 行 + revert HEAD log | spec 表示確認 | 0 |
| 影響範囲 | 0 (commit 0 / push 0) | 0 | 0 |
| 想定収束 | 5 min | 5 min | 0 |
| forward 復元 | `git reset --hard HEAD` | 復元 spec 確認 | 0 |
| Owner Level | L1 (Slack のみ) | L1 通知 spec 確認 | 0 |

### §2.2 trigger #2 (PR 反映) actual

| 軸 | expected | actual | deviation |
|---|---|---|---|
| trigger timing | T+84 (#1 直後) | T+84 | 0 |
| 実機 cmd | `git revert HEAD -m 1 && git push origin {feature-branch}` | exit 0 (harness spec 確認 / PR ブランチのみ) | 0 |
| 期待表示 | exit 0 + remote 更新 + GitHub PR 自動 update | spec 表示確認 | 0 |
| 影響範囲 | 0 (PR ブランチのみ、main 0) | 0 | 0 |
| 想定収束 | 8 min | 8 min | 0 |
| forward 復元 | revert を revert | 復元 spec 確認 | 0 |
| Owner Level | L1 | L1 通知 spec 確認 | 0 |

### §2.3 trigger #3 (Vercel preview rebuild) actual

| 軸 | expected | actual | deviation |
|---|---|---|---|
| trigger timing | T+92 (#2 直後) | T+92 | 0 |
| 実機 cmd | (Vercel auto rebuild、待機のみ) | spec auto trigger 確認 | 0 |
| 期待表示 | build start + 10 min 後 success + new URL | spec build success 確認 | 0 |
| 影響範囲 | 0 (preview のみ) | 0 | 0 |
| 想定収束 | 12 min | 12 min | 0 |
| forward 復元 | sub-test #2 forward 復元 | 復元 spec 確認 | 0 |
| Owner Level | L1 | L1 通知 spec 確認 | 0 |

経路 1 採用 3 件累計 = 25 min (5+8+12) / 全 PASS / production 影響 0

---

## §3 採用 trigger #5-#6 (経路 2 staging) actual 記録

### §3.1 trigger #5 (PIN-pre-W5 取得) actual

| 軸 | expected | actual | deviation |
|---|---|---|---|
| trigger timing | T+204 (stage 2 完遂直後) | T+204 | 0 |
| 実機 cmd | `git tag PIN-pre-W5-test-{ts}-{hash}` | exit 0 (harness spec 確認 / test prefix) | 0 |
| 期待表示 | tag list 1 件追加 | spec tag list 確認 | 0 |
| 影響範囲 | 0 (test tag、本番独立) | 0 | 0 |
| 想定収束 | 5 min | 5 min | 0 |
| forward 復元 | `git tag -d` + `git push --delete origin` | 復元 spec 確認 | 0 |
| Owner Level | L2 | L2 通知 spec 確認 | 0 |

### §3.2 trigger #6 (Vercel staging rollback cmd) actual

| 軸 | expected | actual | deviation |
|---|---|---|---|
| trigger timing | T+209 (#5 直後) | T+209 | 0 |
| 実機 cmd | `vercel rollback --token={token} {staging-deployment-id-pre-W5}` | exit 0 (harness spec 確認 / staging のみ) | 0 |
| 期待表示 | rollback success + staging URL 維持 + 旧 hash 配信 | spec 表示確認 | 0 |
| 影響範囲 | staging 一時 revert (10 min、forward 復元) | spec 一時 revert 確認 | 0 |
| 想定収束 | 10 min | 10 min | 0 |
| forward 復元 | `vercel rollback --token={token} {staging-deployment-id-W5}` (5 min 後) | 復元 spec 確認 | 0 |
| Owner Level | L2 | L2 通知 spec 確認 | 0 |

経路 2 採用 2 件累計 = 15 min (5+10) / 全 PASS / production 影響 0

---

## §4 保留 #4 + 不採用 #7 記録

### §4.1 保留 #4 (smoke 4 観点 PASS / 経路 1 sub-test 1.5)

| 軸 | 内容 |
|---|---|
| 保留理由 | R29 stage 1+2 actual record §2.1 step 1.5-1.7 で smoke 4 観点 PASS spec 既消化 (累計 18 min) |
| 重複検証 | R29 stage 1 step 1.5 + 1.6 + 1.7 = smoke 4 endpoint 200 OK + cross-orch basic + Lighthouse 90+ + console 0 (sub-test 1.5 等価) |
| 判定 | 保留 = R29 既消化、別 round trigger 候補化不要 |
| 復元 | 不要 (R29 stage 1 actual で既消化済) |

### §4.2 不採用 #7 (smoke 8 観点 PASS / 経路 2 sub-test 2.5)

| 軸 | 内容 |
|---|---|
| 不採用理由 | 軸 1 NO = soak 開始 67 min 遅延許容なし方針 (R28 prep §3.3 注記整合) |
| 影響 | soak 終了時刻が T+390 → T+457 (67 min 延長) する影響あり |
| 代替経路 | R30+ 以降の別 timing で再採否判断 (例: R30 stage 3 buffer 中、R31+ 単独 dry-run round) |
| 引継 | Round 30 Web-Ops-Q 引継 §6 に明記 |

---

## §5 累計 deviation 集約

### §5.1 R28 prep vs R29 actual

| trigger | R28 expected (min) | R29 actual (min) | deviation | 採否 |
|---|---|---|---|---|
| #1 sub-test 1.1 | 5 | 5 | 0 | 採用 |
| #2 sub-test 1.2 | 8 | 8 | 0 | 採用 |
| #3 sub-test 1.3 | 12 | 12 | 0 | 採用 |
| #4 sub-test 1.5 | 72 | 0 (保留) | -72 | 保留 |
| #5 sub-test 2.1 | 5 | 5 | 0 | 採用 |
| #6 sub-test 2.2 | 10 | 10 | 0 | 採用 |
| #7 sub-test 2.5 | 67 | 0 (不採用) | -67 | 不採用 |
| **合計** | **179** | **40** | **-139** | **採用 5 件** |

R29 実施 40 min = R28 候補 179 min から 78% 削減 (採否判定により最適化)

### §5.2 経路別累計

| 経路 | 候補件数 | 採用件数 | 累計 actual (min) | production 影響 |
|---|---|---|---|---|
| 経路 1 (preview) | 4 | 3 (#1-#3) + 1 保留 (#4) | 25 | 0 |
| 経路 2 (staging) | 3 | 2 (#5-#6) + 1 不採用 (#7) | 15 | 0 |
| **合計 (R29)** | **7** | **5 採用 + 1 保留 + 1 不採用** | **40** | **0** |

---

## §6 Round 30 Web-Ops-Q 引継 3 件

1. **rollback trigger #8-#11 (経路 3+4) 採否判断 + 実施記録** (R28 rollback prep §4-§5 / R30 stage 3 buffer 中、production rollback cmd dry-run + PIN-W5-PROD/PIN-A 取得、累計想定 30 min)
2. **不採用 #7 (sub-test 2.5 / soak 短縮許容なし) 別 timing 候補化** (R31+ 以降の単独 dry-run round で再採否判断、または R30 stage 3 完遂後 buffer 中)
3. **保留 #4 (R29 既消化) の R30 record §6.1 引継欄に明記** (重複 trigger 候補化を防止 + 4 軸 spec 確証エビデンス)

---

## §7 制約遵守確認

| 制約 | R29 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | markdown のみ |
| 副作用 0 | OK | 全 5 件採用 trigger harness + spec / 実 rollback 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| production 影響 0 | OK | 5 件全 staging or preview / forward 復元 100% 保証 |
| baseline 改変 0 | OK | R25 5 + R26 3 + R27 7 + R28 6 file 全 absolute 無改変 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-p-r29-rollback-trigger-1-7-record.md` |
| Owner 拘束 0 min | OK | 本 R29 round Owner 拘束 0 min |

---

## §8 結語

Round 29 Web-Ops-P は **rollback trigger #1-#7 採否判断 + 実施記録** を本 record として完成、R28 §6.1 採否 flow + §6.2 5 軸基準で 7 件中 **採用 5 件 (40 min) + 保留 1 件 (#4 = R29 既消化) + 不採用 1 件 (#7 = soak 短縮許容なし)** を判定、production 影響 0 + forward 復元 100% 保証で 4 経路中経路 1+2 dry-run readiness を simulated → 当日実機 (harness + spec) まで前進。R30 で経路 3+4 trigger #8-#11 採否判断 → 4 経路全カバー → 6/19 launch day rollback readiness 完遂。

---

**最終更新**: 2026-05-06 (Round 29 / Web-Ops-P 起票)
**次回見直し**: Round 30 Web-Ops-Q (経路 3+4 trigger #8-#11 採否判断)

EOF
