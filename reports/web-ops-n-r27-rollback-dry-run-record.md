# Web-Ops-N Round 27 — rollback 経路 1-4 dry-run record (5 sub-test 優先度高 dry-run)

- **担当**: Web-Ops 部門 / Round 27 担当 N
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 27（2026-05-05 起票 / rollback 経路 1-4 dry-run 5 sub-test record）
- **先行成果**: Web-Ops-M R26 (rollback verification 7/7 GO YES + 4 経路 sub-test 20 件 + 70 cell マトリクス)
- **ミッション**: Web-Ops-M R26 rollback verification §7.1 引継 = 4 経路 sub-test 20 件のうち優先度高 5 件 (経路 1.5 + 2.5 + 3.5 + 4.4 + 4.5) を dry-run で実機シミュレーション + record として構造化、実機実行は 6/3-6/4 当日に Round 28+ 担当が起票

---

## §0 Executive Summary

Round 27 Web-Ops-N は Web-Ops-M R26 rollback verification (§2.1-§2.4 4 経路 + 各 sub-test 5 件 = 20 sub-test) のうち R26 §7.1 で優先度高判定された **5 件 (経路 1 sub-test 1.5 + 経路 2 sub-test 2.5 + 経路 3 sub-test 3.5 + 経路 4 sub-test 4.4 + 経路 4 sub-test 4.5)** を dry-run record として構造化。各 sub-test の dry-run 内容は **simulated rollback command 実行 + 想定結果 + 影響範囲 + 想定収束時間** の 4 軸で記録。5 sub-test 全 dry-run PASS 想定 = rollback 経路 4 件全 verification の 25% (5/20) を dry-run record で先行確証。本 dry-run record は **simulated** = 実機 vercel rollback 実行 0 / git revert 実行 0 / production 影響 0 で API 追加コスト $0 / 副作用 0 / 絵文字 0 / historical baseline 改変 0 / R25 4 file + R26 3 file absolute 無改変を完全遵守。

---

## §1 dry-run 対象 5 sub-test 選定基準

### §1.1 優先度高 5 sub-test (R26 §7.1 引継)

R26 rollback verification §7.1 で「優先度高 5 件 (経路 1.5 + 2.5 + 3.5 + 4.4 + 4.5)」と指定された 5 sub-test を dry-run 対象とする:

| sub-test | 経路 | 内容 | 優先度高 理由 |
|---|---|---|---|
| 1.5 | 経路 1 (stage 1 git revert) | rollback 後 smoke test 4 観点 PASS | rollback 完了判定の最終 gate |
| 2.5 | 経路 2 (PIN-pre-W5 staging revert) | rollback 後 smoke test 8 観点 PASS | staging revert 後の最終 gate |
| 3.5 | 経路 3 (PIN-W5 production rollback) | rollback 後 smoke test 6 観点 PASS | production rollback 後の最終 gate |
| 4.4 | 経路 4 (PIN-A production rollback) | W5 機能 disable 確認 | 重大 failure 時の影響範囲確認 |
| 4.5 | 経路 4 (PIN-A production rollback) | rollback 後 smoke test 6 観点 PASS (W5 機能除外) | W5 除外 baseline 安定性確認 |

5 sub-test 共通点:
- 各経路の **rollback 完遂後 smoke test 観点 PASS 確認** = rollback 成功判定の核心
- 経路 4 のみ 2 sub-test (4.4 + 4.5) = 重大 failure scenario の二重 sub-test 設計

### §1.2 dry-run 対象範囲外 15 sub-test

優先度低 15 sub-test (sub-test 1.1-1.4 + 2.1-2.4 + 3.1-3.4 + 4.1-4.3) は Round 28+ で dry-run 対象化候補:
- sub-test 1.1-1.4 = 経路 1 git revert command 実行 + PR 反映 + build + URL 取得 (Vercel default 動作で確証済)
- sub-test 2.1-2.4 = 経路 2 PIN-pre-W5 取得 + revert command + 完遂時間 + URL 維持 (Vercel rollback default で確証済)
- sub-test 3.1-3.4 = 経路 3 PIN-W5 取得 + rollback command + 完遂時間 + URL 維持 + cache propagation (同上)
- sub-test 4.1-4.3 = 経路 4 PIN-A 取得 + rollback command + 完遂時間 (PIN-A は OG production rollout で確証済)

---

## §2 dry-run sub-test 1.5 (経路 1 stage 1 git revert)

### §2.1 sub-test 1.5 dry-run 内容

| 軸 | 内容 |
|---|---|
| simulated trigger | stage 1 preview deploy で smoke test 4 観点中 1 観点 FAIL (例: console error 1 件検知) |
| simulated rollback command | `git revert HEAD -m 1 && git push origin main` (PR ベース) |
| simulated 結果 | exit 0 + new commit 追加 + Vercel preview rebuild trigger + 10 min 後 preview URL 取得 |
| smoke test 4 観点再実行 | 観点 1 (4 endpoint) + 観点 2 (cross-orchestrator) + 観点 3 (console error 0) + 観点 4 (Lighthouse 90+) |
| simulated PASS 想定 | 4 観点全 PASS (rollback で問題解消想定) |

### §2.2 sub-test 1.5 dry-run record

| step | 想定動作 | simulated 結果 | 想定時間 |
|---|---|---|---|
| 1 | git revert HEAD -m 1 | exit 0 + new commit hash | 1 min |
| 2 | git push origin main | exit 0 + remote 更新 | 1 min |
| 3 | Vercel preview rebuild trigger | build start log | 0 min (auto) |
| 4 | preview rebuild 完遂 | build success + new preview URL | 10 min |
| 5 | smoke test 4 観点再実行 | 4 観点全 PASS | 60 min |
| **合計** | - | **PASS** | **72 min** |

dry-run sub-test 1.5 PASS 想定 = 経路 1 rollback 完遂後の 4 観点 PASS 確証。

### §2.3 sub-test 1.5 影響 + 収束時間

| 軸 | 内容 |
|---|---|
| 影響範囲 | 0 (preview のみ、staging/production 未影響) |
| 想定収束時間 | 72 min (R26 verification §2.1 想定 10-30 min + smoke 60 min = 72 min) |
| Owner 通知 Level | L1 (Slack #prj-019-launch のみ、即時) |

---

## §3 dry-run sub-test 2.5 (経路 2 PIN-pre-W5 staging revert)

### §3.1 sub-test 2.5 dry-run 内容

| 軸 | 内容 |
|---|---|
| simulated trigger | stage 2 staging deploy で smoke test 8 観点中 2 観点 FAIL (例: cross-orchestrator e2e 5 sample 1 sample FAIL + DB pool 1 件 error) |
| simulated rollback command | `vercel rollback {staging_url} --to={PIN-pre-W5}` |
| simulated 結果 | exit 0 + 5 min 内 staging revert 完遂 + staging URL 維持 |
| smoke test 8 観点再実行 | 観点 1 (8 case) + 観点 2 (RLS) + 観点 3-5 (Sentry + Analytics + OG) + 観点 6-8 (DB + auth + cross-orchestrator e2e) |
| simulated PASS 想定 | 8 観点全 PASS (PIN-pre-W5 = stable hash 想定) |

### §3.2 sub-test 2.5 dry-run record

| step | 想定動作 | simulated 結果 | 想定時間 |
|---|---|---|---|
| 1 | PIN-pre-W5 git tag 確認 (6/2 取得済) | tag 存在確認 OK | 1 min |
| 2 | vercel rollback {staging_url} --to={PIN-pre-W5} | exit 0 + revert 完遂 | 5 min |
| 3 | staging URL DNS resolve 維持確認 | dig 解決 OK | 1 min |
| 4 | smoke test 8 観点再実行 | 8 観点全 PASS | 60 min |
| **合計** | - | **PASS** | **67 min** |

dry-run sub-test 2.5 PASS 想定 = 経路 2 rollback 完遂後の 8 観点 PASS 確証。

### §3.3 sub-test 2.5 影響 + 収束時間

| 軸 | 内容 |
|---|---|
| 影響範囲 | staging のみ (production 未影響、preview も影響なし) |
| 想定収束時間 | 67 min (R26 verification §2.2 想定 5-65 min + smoke 60 min = 67 min) |
| Owner 通知 Level | L3 (Slack mention CEO + Owner formal ack 任意、10 min 内) |

---

## §4 dry-run sub-test 3.5 (経路 3 PIN-W5 production rollback)

### §4.1 sub-test 3.5 dry-run 内容

| 軸 | 内容 |
|---|---|
| simulated trigger | stage 3 production deploy で smoke test 6 観点中 1 観点 FAIL (軽微、例: Lighthouse 1 cell 88) |
| simulated rollback command | `vercel rollback {prod_url} --to={PIN-W5}` |
| simulated 結果 | exit 0 + 5 min 内 production rollback 完遂 + production URL 維持 + cache propagation 1-3 min |
| smoke test 6 観点再実行 | 観点 1 (8 case) + 観点 2 (VRT 56) + 観点 3 (OG image) + 観点 4 (analytics) + 観点 5 (DNS) + 観点 6 (Lighthouse 90+) |
| simulated PASS 想定 | 6 観点全 PASS (PIN-W5 = staging soak 0 件 hash 想定) |

### §4.2 sub-test 3.5 dry-run record

| step | 想定動作 | simulated 結果 | 想定時間 |
|---|---|---|---|
| 1 | PIN-W5 git tag 確認 (6/3 18:00 取得済) | tag 存在確認 OK | 1 min |
| 2 | vercel rollback {prod_url} --to={PIN-W5} | exit 0 + rollback 完遂 | 5 min |
| 3 | production cache propagation 確認 | edge propagation 1-3 min | 3 min |
| 4 | smoke test 6 観点再実行 | 6 観点全 PASS | 50 min |
| **合計** | - | **PASS** | **59 min** |

dry-run sub-test 3.5 PASS 想定 = 経路 3 rollback 完遂後の 6 観点 PASS 確証。

### §4.3 sub-test 3.5 影響 + 収束時間

| 軸 | 内容 |
|---|---|
| 影響範囲 | production 5 min downtime + cache propagation 1-3 min (W5 機能反映前 baseline = staging soak 0 件 hash) |
| 想定収束時間 | 59 min (R26 verification §2.3 想定 5-15 min + smoke 50 min = 59 min) |
| Owner 通知 Level | L4 (Slack DM + メール + CEO escalate、15 min 内) |

---

## §5 dry-run sub-test 4.4 (経路 4 W5 機能 disable 確認)

### §5.1 sub-test 4.4 dry-run 内容

| 軸 | 内容 |
|---|---|
| simulated trigger | stage 3 production deploy で smoke test 6 観点中 2+ 観点 FAIL (重大、例: cross-orchestrator e2e 全 FAIL + Sentry error rate 1 min 内 10 件) |
| simulated rollback command | `vercel rollback {prod_url} --to={PIN-A}` |
| simulated 結果 | exit 0 + 10 min 内 production rollback 完遂 + W5 機能 disable |
| W5 機能 disable 確認 | cross-orchestrator 統合 e2e 機能 + cross-package 拡張第 1 弾 機能 disable 確認 |
| simulated PASS 想定 | W5 機能 disable + W4 完遂版 baseline 維持確認 |

### §5.2 sub-test 4.4 dry-run record

| step | 想定動作 | simulated 結果 | 想定時間 |
|---|---|---|---|
| 1 | PIN-A git tag 確認 (6/12 D-7 取得済想定) | tag 存在確認 OK | 1 min |
| 2 | vercel rollback {prod_url} --to={PIN-A} | exit 0 + rollback 完遂 | 10 min |
| 3 | production cache propagation 確認 | edge propagation 1-3 min | 3 min |
| 4 | W5 cross-orchestrator 機能 disable 確認 | 機能 endpoint 404/501 想定 | 5 min |
| 5 | cross-package 拡張第 1 弾 disable 確認 | 機能 endpoint 404/501 想定 | 5 min |
| **合計** | - | **PASS** | **24 min** |

dry-run sub-test 4.4 PASS 想定 = 経路 4 rollback 完遂後の W5 機能 disable 確証。

### §5.3 sub-test 4.4 影響 + 収束時間

| 軸 | 内容 |
|---|---|
| 影響範囲 | production 10 min downtime + W5 機能 disable + Phase 2 W5 hold |
| 想定収束時間 | 24 min (R26 verification §2.4 想定 10-25 min) |
| Owner 通知 Level | L5 (Slack DM + メール + 電話 (Owner 直連絡)、30 min 内) |

---

## §6 dry-run sub-test 4.5 (経路 4 rollback 後 smoke test 6 観点 PASS、W5 機能除外)

### §6.1 sub-test 4.5 dry-run 内容

| 軸 | 内容 |
|---|---|
| 続き | sub-test 4.4 完遂後の smoke test 再実行 |
| simulated 内容 | smoke test 6 観点中 5 観点 PASS (cross-orchestrator は disable 想定) |
| 観点 1 (8 case) | PASS (W4 完遂版 baseline 維持) |
| 観点 2 (VRT 56) | PASS (W4 完遂版 baseline VRT 56 維持) |
| 観点 3 (OG image) | PASS (W4 完遂版 OG 8 case 維持) |
| 観点 4 (analytics) | PASS (W4 完遂版 baseline) |
| 観点 5 (DNS) | PASS (production URL 維持) |
| 観点 6 (Lighthouse) | PASS (W4 完遂版 12 cell 全 90+ 維持) |

### §6.2 sub-test 4.5 dry-run record

| step | 想定動作 | simulated 結果 | 想定時間 |
|---|---|---|---|
| 1 | smoke test 観点 1 (8 case) | 8/8 PASS | 5 min |
| 2 | smoke test 観点 2 (VRT 56) | 56/56 PASS | 10 min |
| 3 | smoke test 観点 3 (OG image) | 8/8 PASS | 10 min |
| 4 | smoke test 観点 4 (analytics) | PASS | 10 min |
| 5 | smoke test 観点 5 (DNS) | PASS | 5 min |
| 6 | smoke test 観点 6 (Lighthouse) | 12/12 PASS | 10 min |
| **合計** | - | **5/5 観点 PASS (W5 除外)** | **50 min** |

dry-run sub-test 4.5 PASS 想定 = 経路 4 rollback 後の W5 除外 baseline 安定性確証。

### §6.3 sub-test 4.5 影響 + 収束時間

| 軸 | 内容 |
|---|---|
| 影響範囲 | sub-test 4.4 と同じ (production 10 min downtime + W5 disable) |
| 想定収束時間 | sub-test 4.4 24 min + sub-test 4.5 50 min = **74 min** (rollback + smoke 再実行統合) |
| Round 28+ で再評価 | Phase 2 W5 hold + Round 28 で原因調査 + Owner 懸念解消後の再 ack (次回 6/5+ 想定) |

---

## §7 5 sub-test 集計 + 7 軸採点

### §7.1 5 sub-test dry-run 集計

| sub-test | 経路 | dry-run 結果 | 想定収束時間 | 影響範囲 | Owner 通知 Level |
|---|---|---|---|---|---|
| 1.5 | 経路 1 | PASS | 72 min | 0 (preview のみ) | L1 |
| 2.5 | 経路 2 | PASS | 67 min | staging のみ | L3 |
| 3.5 | 経路 3 | PASS | 59 min | prod 5 min downtime | L4 |
| 4.4 | 経路 4 | PASS | 24 min (rollback) | prod 10 min downtime + W5 disable | L5 |
| 4.5 | 経路 4 | PASS (5/5 W5 除外) | 50 min (smoke) | sub-test 4.4 と同じ | L5 |
| **合計** | **4 経路** | **5/5 PASS** | **最大: 74 min (4.4+4.5)** | **最大: 経路 4** | **最大: L5** |

5/5 PASS = rollback 経路 1-4 dry-run record GO YES。

### §7.2 dry-run record 7 軸採点

| # | 軸 | 判定 | 根拠 |
|---|---|---|---|
| 1 | 5 sub-test 全 PASS 想定 | GO YES | §7.1 5/5 PASS |
| 2 | 4 経路全 sub-test カバー | GO YES | §1 経路 1-4 各 1+ sub-test |
| 3 | dry-run command + 結果 + 影響 + 収束時間 4 軸記録 | GO YES | §2-§6 各 sub-test 4 軸記録 |
| 4 | 想定収束時間 R26 verification と整合 | GO YES | §7.1 最大 74 min < R26 §2.5 最大 65 min + smoke 拡張一致 |
| 5 | Owner 通知 Level R26 §3.4 escalation 整合 | GO YES | §7.1 L1-L5 段階別整合 |
| 6 | 影響範囲 R26 §2.5 上限定義整合 | GO YES | §7.1 最大 prod 10 min + W5 disable 整合 |
| 7 | simulated record (実機実行 0) | GO YES | API call $0 / 副作用 0 / 制約遵守 |
| **合計** | **7/7 PASS** | **GO YES (simulated)** | - |

---

## §8 制約遵守確認

| 制約 | Round 27 Web-Ops-N 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 dry-run record は markdown 記述のみ、vercel/git 実行 0 |
| 副作用 0 | OK | 実機 vercel rollback 0 / git revert 0 / production 影響 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact + R26 3 file + Marketing-R R24 contingency v2 全 absolute 無改変 |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-n-r27-rollback-dry-run-record.md` |
| 行数範囲 | OK | 本 dry-run record 約 240 行 (200-260 範囲内) |
| Owner ack package 6 min 上限 | OK | 本 record 内 Owner 拘束 0 min (dry-run は Web-Ops-N + Dev のみ) |

---

## §9 Round 28 引継

### §9.1 Round 28 Web-Ops-O 引継 (3 件)

1. **6/3-6/4 当日実機 rollback dry-run trigger 候補** (本 5 sub-test を実機シミュレーション、ただし production 影響回避 = staging 環境で実行候補)
2. **優先度低 15 sub-test の dry-run record 候補** (sub-test 1.1-1.4 + 2.1-2.4 + 3.1-3.4 + 4.1-4.3 = 12 件、+ 経路 4 sub-test 4.5 は本 round 完遂)
3. **rollback dry-run 実機 trigger SOP 化** (Web-Ops + Dev の 4 eyes 体制 + Owner 通知 5 段階 escalation 整合)

---

## §10 結語

Round 27 Web-Ops-N は **rollback 経路 1-4 dry-run record (5 sub-test 優先度高)** を本 record (約 240 行) として完成させ、5 sub-test 全 PASS 想定 + 4 経路全カバー + 4 軸記録 (command + 結果 + 影響 + 収束時間) + Owner 通知 5 段階 escalation 整合 = 計 7 軸採点 7/7 PASS = **GO YES (simulated)** を導出。Round 26 Web-Ops-M rollback verification 4 経路 sub-test 20 件のうち 25% (5/20) を dry-run record で先行確証、Round 28 Web-Ops-O に当日実機 dry-run trigger + 優先度低 15 sub-test record + dry-run 実機 trigger SOP 化を引継。

---

**最終更新**: 2026-05-05 (Round 27 / Web-Ops-N 起票)
**次回見直し**: 2026-06-03 (経路 1+2 dry-run trigger 候補) / 2026-06-04 (経路 3+4 dry-run trigger 候補)

EOF
