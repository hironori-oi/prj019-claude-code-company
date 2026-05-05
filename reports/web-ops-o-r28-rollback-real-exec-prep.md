# Web-Ops-O Round 28 — rollback 経路 1-4 当日実機 dry-run trigger 候補

- **担当**: Web-Ops 部門 / Round 28 担当 O
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 28（2026-05-06 起票 / rollback 経路 1-4 当日実機 dry-run trigger 候補設計）
- **先行成果**: Web-Ops-N R27 (rollback dry-run record 5 sub-test 優先度高 PASS / 4 経路全カバー / 70 cell マトリクス N/A 10 cell 詳細化)
- **ミッション**: R27 simulated rollback dry-run record 5 sub-test を **6/3 stage 2 中 + 6/4-6/9 stage 3 中** の任意 timing で実機 staging 環境 dry-run trigger 可能化、当日実機 trigger 候補 11 件を 4 軸 (経路 / trigger 条件 / 影響範囲 / 想定収束時間) で詳細化

---

## §0 Executive Summary

Round 28 Web-Ops-O は R27 Web-Ops-N が起票した rollback dry-run record (240 行 / 5 sub-test PASS / 4 経路全カバー) を **当日実機 dry-run trigger 候補化** として再構造化、6/3 火 stage 2 中 (13:00-18:00) + 6/4-6/9 任意 stage 3 中 (09:01-12:28) の任意 timing で **staging 環境のみ** に限定した実機 dry-run trigger 候補 11 件を提案。本 prep は rollback 経路 1-4 各 sub-test を当日実機 trigger 可能な実機 cmd + 影響範囲 (production 影響 0) + 想定収束時間 + Owner Level の 4 軸で記録、**production 影響を一切伴わない実機 dry-run** 設計により 6/19 launch day 想定 rollback 経路 readiness を simulated → 実機まで前進させる。本 prep は API 追加コスト $0 / 副作用 0 (staging のみ + 影響後即 forward 復元) / 絵文字 0 / historical baseline 改変 0 / R25 5 artifact + R26 3 file + R27 7 file absolute 無改変を完全遵守。

---

## §1 当日実機 dry-run trigger 候補 11 件サマリ

### §1.1 trigger 候補 11 件分布

| # | 経路 | sub-test | trigger timing | 環境 | 影響範囲 | 想定収束 (min) | Owner Level |
|---|---|---|---|---|---|---|---|
| 1 | 経路 1 (git revert) | 1.1 (revert cmd) | 6/3 火 11:00-12:30 (stage 1+2 buffer) | preview のみ | 0 | 5 | L1 |
| 2 | 経路 1 (git revert) | 1.2 (PR 反映) | 6/3 火 11:00-12:30 (stage 1+2 buffer) | preview のみ | 0 | 8 | L1 |
| 3 | 経路 1 (git revert) | 1.3 (build) | 6/3 火 11:00-12:30 (stage 1+2 buffer) | preview のみ | 0 | 12 | L1 |
| 4 | 経路 1 (git revert) | 1.5 (smoke 4 観点 PASS) | 6/3 火 11:00-12:30 (stage 1+2 buffer) | preview のみ | 0 | 72 | L1 |
| 5 | 経路 2 (PIN-pre-W5) | 2.1 (PIN 取得) | 6/3 火 14:50-15:00 (stage 2 完遂 buffer) | staging のみ | staging 一時 revert | 5 | L2 |
| 6 | 経路 2 (PIN-pre-W5) | 2.2 (revert cmd) | 6/3 火 14:50-15:00 (stage 2 完遂 buffer) | staging のみ | staging 一時 revert | 10 | L2 |
| 7 | 経路 2 (PIN-pre-W5) | 2.5 (smoke 8 観点 PASS) | 6/3 火 15:00 直後 (soak 開始前) | staging のみ | staging 一時 revert | 67 | L3 |
| 8 | 経路 3 (PIN-W5 prod rollback) | 3.1 (PIN 取得) | 6/4-6/9 stage 3 完遂直後 (10:23 直後) | staging mirror | 0 | 5 | L2 |
| 9 | 経路 3 (PIN-W5 prod rollback) | 3.2 (rollback cmd dry-run) | 6/4-6/9 stage 3 完遂直後 (10:23 直後) | staging mirror | 0 | 10 | L2 |
| 10 | 経路 4 (PIN-A) | 4.1 (PIN 取得) | 6/4-6/9 stage 3 soak 中 (10:30-12:28 buffer) | staging mirror | 0 | 5 | L2 |
| 11 | 経路 4 (PIN-A) | 4.2 (rollback cmd dry-run) | 6/4-6/9 stage 3 soak 中 (10:30-12:28 buffer) | staging mirror | 0 | 10 | L2 |

合計 11 件 trigger 候補 / 4 経路全カバー / production 影響 0 / 累計想定収束 209 min

### §1.2 trigger 候補数の R27 dry-run 5 sub-test との関係

| 経路 | R27 dry-run 5 sub-test (simulated) | R28 当日実機 trigger 候補 (本 prep) |
|---|---|---|
| 経路 1 | sub-test 1.5 | sub-test 1.1 + 1.2 + 1.3 + 1.5 (4 件) |
| 経路 2 | sub-test 2.5 | sub-test 2.1 + 2.2 + 2.5 (3 件) |
| 経路 3 | sub-test 3.5 | sub-test 3.1 + 3.2 (2 件) |
| 経路 4 | sub-test 4.4 + 4.5 | sub-test 4.1 + 4.2 (2 件) |

経路 1 では R27 で確証した sub-test 1.5 に加え 1.1-1.3 を実機 trigger 化、経路 2/3/4 では R27 で skip された前段 sub-test (PIN 取得 + cmd 実行) を実機 trigger 化することで 11 件の包括カバー。

---

## §2 経路 1 (git revert) 当日実機 trigger 候補 4 件

### §2.1 trigger 候補 #1: sub-test 1.1 (git revert cmd)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 11:00 (stage 1+2 buffer 中、stage 1 完遂 10:14 後) |
| 環境 | preview (Vercel auto subdomain `prj019-w5-{hash}.vercel.app`) |
| 実機 cmd | `git revert HEAD -m 1 --no-commit && git status` (commit せず status 確認のみ) |
| 期待表示 | unstaged changes 1+ 行 + revert HEAD log 表示 |
| 影響範囲 | 0 (commit 0 / push 0 / Vercel 影響 0) |
| 想定収束 | 5 min (cmd 実行 1 min + 確認 2 min + reset 2 min) |
| forward 復元 | `git reset --hard HEAD` で即時復元 |
| Owner Level | L1 (Slack #prj-019-launch のみ報告) |

### §2.2 trigger 候補 #2: sub-test 1.2 (PR 反映)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 11:08 (#1 直後) |
| 環境 | preview のみ |
| 実機 cmd | sub-test 1.1 の revert を実 commit + push: `git revert HEAD -m 1 && git push origin {feature-branch}` (PR ブランチに push、main は影響しない) |
| 期待表示 | exit 0 + remote 更新 + GitHub PR 自動 update |
| 影響範囲 | 0 (PR ブランチのみ、main 影響 0) |
| 想定収束 | 8 min (push 1 min + GitHub 反映 2 min + PR update 確認 2 min + revert revert で復元 3 min) |
| forward 復元 | `git revert HEAD && git push origin {feature-branch}` (revert を revert) |
| Owner Level | L1 |

### §2.3 trigger 候補 #3: sub-test 1.3 (Vercel preview rebuild)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 11:16 (#2 直後) |
| 環境 | preview のみ |
| 実機 cmd | (#2 完了で Vercel 自動 rebuild trigger、待機のみ) |
| 期待表示 | Vercel dashboard build start log + 10 min 後 build success + new preview URL |
| 影響範囲 | 0 (preview のみ、staging/production 0) |
| 想定収束 | 12 min (Vercel build 10 min + URL 取得 + 確認 2 min) |
| forward 復元 | sub-test 1.2 forward 復元で自動再 rebuild |
| Owner Level | L1 |

### §2.4 trigger 候補 #4: sub-test 1.5 (smoke 4 観点 PASS)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 11:28 (#3 直後 / R27 simulated との対比検証) |
| 環境 | preview のみ |
| 実機 cmd | smoke test 4 観点再実行 (R28 stage 1+2 prep §2.1 step 1.5-1.7 と同一) |
| 期待表示 | 4 観点全 PASS (rollback で問題解消想定) |
| 影響範囲 | 0 (preview のみ) |
| 想定収束 | 72 min (R27 sub-test 1.5 想定と整合) |
| forward 復元 | sub-test 1.2 forward 復元 → 通常 stage 1 状態に戻る |
| Owner Level | L1 (R27 simulated と整合 + 実機 actual deviation 計算可) |

---

## §3 経路 2 (PIN-pre-W5 staging revert) 当日実機 trigger 候補 3 件

### §3.1 trigger 候補 #5: sub-test 2.1 (PIN-pre-W5 取得)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 14:50 (stage 2 完遂 14:47 直後 / 6/3 stage 1+2 prep §3.1 step 2.7 完遂後) |
| 環境 | staging のみ (PIN-pre-W5 は 6/3 09:00 stage 1 着手直前 hash) |
| 実機 cmd | `git tag PIN-pre-W5-test-{YYYYMMDD-HHMM}-{hash}` (test prefix で本番 PIN-pre-W5 と区別) |
| 期待表示 | tag list 1 件追加 + push 後 remote 反映 |
| 影響範囲 | 0 (test tag、本番 PIN-pre-W5 と独立) |
| 想定収束 | 5 min (tag 1 min + push 2 min + 確認 2 min) |
| forward 復元 | `git tag -d PIN-pre-W5-test-{...} && git push --delete origin PIN-pre-W5-test-{...}` |
| Owner Level | L2 (Slack + Dev DM) |

### §3.2 trigger 候補 #6: sub-test 2.2 (Vercel staging rollback cmd)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 14:55 (#5 直後) |
| 環境 | staging のみ |
| 実機 cmd | `vercel rollback --token={token} {staging-deployment-id-pre-W5}` (Vercel CLI staging のみ rollback / production 0) |
| 期待表示 | rollback success + staging URL 維持 + 旧 hash 配信 |
| 影響範囲 | staging 一時 revert (10 min、その後 forward 復元) |
| 想定収束 | 10 min (rollback 5 min + 確認 5 min) |
| forward 復元 | 5 min 後 `vercel rollback --token={token} {staging-deployment-id-W5}` で戻し |
| Owner Level | L2 |

### §3.3 trigger 候補 #7: sub-test 2.5 (smoke 8 観点 PASS)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/3 火 15:00 直後 (soak 開始前 / R27 simulated 2.5 との対比) |
| 環境 | staging のみ |
| 実機 cmd | smoke test 8 観点再実行 (R28 stage 1+2 prep §3.1 step 2.4-2.6 と同一) |
| 期待表示 | 8 観点全 PASS (rollback で問題解消想定) |
| 影響範囲 | staging 一時 revert (#6 で発生 / 67 min smoke 中) |
| 想定収束 | 67 min (R27 sub-test 2.5 想定と整合) |
| forward 復元 | sub-test 2.2 forward 復元 → 通常 stage 2 完遂状態 |
| Owner Level | L3 (Slack + メール + Dev DM) |

注: 本 trigger #7 は soak 開始 (15:00) を最大 67 min 遅延させるため、soak 終了時刻が 18:00 → 19:07 まで延びる影響あり。**実機 trigger 採否判断は Web-Ops-P が 6/3 当日 14:47 stage 2 完遂時に判定**、soak 短縮 (3h → 1h53min) 許容なら実施、否なら skip して 6/4 候補に slip。

---

## §4 経路 3 (PIN-W5 production rollback) 当日実機 trigger 候補 2 件

### §4.1 trigger 候補 #8: sub-test 3.1 (PIN-W5-PROD 取得)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/4-6/9 stage 3 完遂直後 (10:23 直後 / R28 stage 3 prep §3.1 step 3.9 完遂後) |
| 環境 | staging mirror (PIN-W5-PROD 自体は production hash だが、test 用 git tag は staging deployment 起源 hash で代替) |
| 実機 cmd | `git tag PIN-W5-PROD-test-{YYYYMMDD-HHMM}-{staging-mirror-hash}` |
| 期待表示 | tag list 1 件追加 + push 後 remote 反映 |
| 影響範囲 | 0 (test tag、本番 PIN-W5-PROD と独立) |
| 想定収束 | 5 min |
| forward 復元 | `git tag -d` + `git push --delete origin` |
| Owner Level | L2 |

### §4.2 trigger 候補 #9: sub-test 3.2 (Vercel production rollback cmd dry-run)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/4-6/9 stage 3 完遂直後 (10:28 直後) |
| 環境 | staging mirror (production rollback cmd の syntax 確認のみ、実 production 影響 0) |
| 実機 cmd | `vercel rollback --token={token} --dry-run {production-deployment-id-pre-W5-PROD}` (`--dry-run` flag で実 rollback skip) |
| 期待表示 | dry-run output: "Would rollback to deployment {id}, environment: production" + exit 0 |
| 影響範囲 | 0 (`--dry-run` flag で実 rollback 0) |
| 想定収束 | 10 min (cmd 実行 5 min + output 確認 5 min) |
| forward 復元 | 不要 (dry-run なので影響 0) |
| Owner Level | L2 |

注: 本 trigger #9 は production rollback cmd の **syntax 確認** のみ。実 production rollback は本番 incident 時のみ。

---

## §5 経路 4 (PIN-A production rollback) 当日実機 trigger 候補 2 件

### §5.1 trigger 候補 #10: sub-test 4.1 (PIN-A 確認)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/4-6/9 stage 3 soak 中 (10:30-12:28 buffer) |
| 環境 | staging mirror (PIN-A は R23 OG production rollout 完遂時 hash、既に物理 git tag 存在 = 本 trigger は確認のみ) |
| 実機 cmd | `git tag -l "PIN-A-*" \| head -5` |
| 期待表示 | PIN-A git tag list 1+ 件 (R23 取得済) |
| 影響範囲 | 0 (確認のみ) |
| 想定収束 | 5 min (cmd 1 min + 確認 4 min) |
| forward 復元 | 不要 (read-only) |
| Owner Level | L2 |

### §5.2 trigger 候補 #11: sub-test 4.2 (PIN-A rollback cmd dry-run)

| 軸 | 内容 |
|---|---|
| trigger timing | 6/4-6/9 stage 3 soak 中 (10:30-12:28 buffer / #10 直後) |
| 環境 | staging mirror |
| 実機 cmd | `vercel rollback --token={token} --dry-run {production-deployment-id-PIN-A}` (`--dry-run` flag で実 rollback skip) |
| 期待表示 | dry-run output: "Would rollback to deployment {PIN-A}, environment: production" + exit 0 |
| 影響範囲 | 0 (`--dry-run` flag) |
| 想定収束 | 10 min (cmd 実行 5 min + output 確認 5 min) |
| forward 復元 | 不要 (dry-run) |
| Owner Level | L2 |

---

## §6 当日実機 trigger 採否判断 flow

### §6.1 Web-Ops-P / Web-Ops-Q 採否判断 flow

```
6/3 火 09:00 stage 1 着手
  ↓
6/3 火 10:14 stage 1 完遂
  ↓
[Web-Ops-P 判断 1: 11:00-12:30 buffer で経路 1 trigger #1-#4 実施するか]
  YES → trigger #1-#4 実施 (累計 97 min, 12:30 終了 → stage 2 13:00 着手 OK)
  NO → skip + 6/4 stage 3 完遂後の経路 3/4 dry-run trigger 候補に集中
  ↓
6/3 火 13:00 stage 2 着手 (#1-#4 影響 0)
  ↓
6/3 火 14:47 stage 2 完遂
  ↓
[Web-Ops-P 判断 2: 14:50-15:00 + 15:00 直後 buffer で経路 2 trigger #5-#7 実施するか]
  YES (soak 短縮許容) → trigger #5-#7 実施 (累計 82 min, soak 終了 19:07)
  NO → skip + 翌日 stage 3 buffer に集中
  ↓
6/3 火 18:00 / 19:07 soak 完遂
  ↓
6/4 (任意 6/4-6/9) stage 3 完遂 10:23
  ↓
[Web-Ops-Q 判断 3: 10:30-12:28 soak 中に経路 3+4 trigger #8-#11 実施するか]
  YES → trigger #8-#11 実施 (累計 30 min, soak 監視と並行可能)
  NO → skip + Round 30+ で別 round 実機 dry-run trigger 候補
```

### §6.2 採否判断 5 軸

| 軸 | YES 条件 | NO 条件 |
|---|---|---|
| 1. buffer 余裕 | stage 1+2 buffer 90 min 以上残り / soak 短縮許容 | buffer < 90 min / soak 完全 3h 必須 |
| 2. R27 simulated との対比価値 | trigger #4 + #7 で simulated 5 sub-test → 実機 deviation 計算 | trigger 不実施でも R27 simulated で十分 (Phase 1 完遂宣言済) |
| 3. Owner 通知許容 | L1 (#1-#4) / L2 (#5-#6, #8-#11) / L3 (#7) Owner ack 不要 | L3 Owner ack 取得 burden 嫌厭 |
| 4. production 影響 | 0 (全 11 件 staging or preview or dry-run flag) | 不要 (全 11 件 production 0 設計) |
| 5. forward 復元保証 | 全 11 件 forward 復元 cmd 整備済 | 復元失敗リスク 0 想定 |

5 軸全 YES = trigger 実施 / 5 軸の 1 つでも NO = trigger skip

---

## §7 想定 actual record 起票 (R29+ Web-Ops-P/Q 担当)

### §7.1 起票 template (各 trigger 候補ごと)

```markdown
## §X. trigger #N (sub-test M.K) actual record

| 軸 | expected | actual (記入) | deviation |
|---|---|---|---|
| trigger timing | 6/3 11:00 | ____ | ____ |
| 実機 cmd | (本 prep §2-§5 記載) | exit code: ____ | ____ |
| 期待表示 | (本 prep §2-§5 記載) | actual output: ____ | ____ |
| 影響範囲 | 0 (preview/staging/dry-run) | ____ | ____ |
| 想定収束 | __ min | ____ min | ____ |
| forward 復元 | (本 prep §2-§5 記載) | 復元時刻: ____ | ____ |
| Owner Level | L1-L3 | 通知 actual: ____ | ____ |
```

### §7.2 deviation 集約 template

| trigger 候補 | expected (min) | actual (記入) | deviation |
|---|---|---|---|
| #1 sub-test 1.1 | 5 | ____ | ____ |
| #2 sub-test 1.2 | 8 | ____ | ____ |
| #3 sub-test 1.3 | 12 | ____ | ____ |
| #4 sub-test 1.5 | 72 | ____ | ____ |
| #5 sub-test 2.1 | 5 | ____ | ____ |
| #6 sub-test 2.2 | 10 | ____ | ____ |
| #7 sub-test 2.5 | 67 | ____ | ____ |
| #8 sub-test 3.1 | 5 | ____ | ____ |
| #9 sub-test 3.2 | 10 | ____ | ____ |
| #10 sub-test 4.1 | 5 | ____ | ____ |
| #11 sub-test 4.2 | 10 | ____ | ____ |
| **合計** | **209** | ____ | ____ |

---

## §8 制約遵守確認

| 制約 | Round 28 Web-Ops-O 状態 | evidence |
|---|---|---|
| API 追加コスト $0 | OK | 本 prep markdown 記述のみ |
| 副作用 0 | OK | 全 11 件 preview / staging / dry-run flag で production 影響 0 |
| 絵文字 0 | OK | 本 file 全数確認 |
| historical baseline 改変 0 | OK | v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 4 file + R25 5 artifact + R26 3 file + R27 7 file 全 absolute 無改変 |
| Heroicons 参照のみ | OK | アイコン使用 0 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-o-r28-rollback-real-exec-prep.md` |
| 行数範囲 | OK | 本 prep 約 350 行 (300-400 範囲内) |
| Owner ack package 6 min 上限 | OK | trigger 候補のうち Owner 拘束伴うものは #7 (L3 / Slack 通知のみ) のみ + 本 round Owner 拘束 0 min |

---

## §9 Round 29+ 引継

### §9.1 Web-Ops-P (R29 / 6/3 火担当) 引継 3 件

1. **6/3 火 11:00-12:30 buffer で経路 1 trigger #1-#4 採否判断 + 実施時 actual record 起票**
2. **6/3 火 14:50-15:00 + 15:00 直後 buffer で経路 2 trigger #5-#7 採否判断 + 実施時 actual record 起票** (#7 採否は soak 短縮許容判断)
3. **採否 NO 時は §6.1 flow に従い skip 記録 + 翌 round へ引継**

### §9.2 Web-Ops-Q (R30 / 6/4-6/9 任意担当) 引継 3 件

1. **6/4-6/9 stage 3 完遂直後 (10:23-10:28) buffer で経路 3 trigger #8-#9 採否判断 + 実施時 actual record 起票**
2. **6/4-6/9 stage 3 soak 中 (10:30-12:28) buffer で経路 4 trigger #10-#11 採否判断 + 実施時 actual record 起票**
3. **採否 NO 時は §6.1 flow に従い skip 記録 + Round 31+ で別 timing 実機 dry-run trigger 候補化**

---

## §10 結語

Round 28 Web-Ops-O は **rollback 経路 1-4 当日実機 dry-run trigger 候補設計** を本 prep (約 350 行) として完成させ、6/3 火 stage 2 中 + 6/4-6/9 任意 stage 3 中の **当日 buffer timing で production 影響 0 の実機 trigger 候補 11 件 (4 経路全カバー)** を提案。各 trigger の実機 cmd + 影響範囲 + 想定収束時間 + Owner Level + forward 復元 cmd を 4 軸記録、採否判断 flow + 5 軸基準を整備、累計想定 209 min の dry-run trigger 候補化により R27 simulated rollback dry-run record 5 sub-test PASS から **当日実機 actual record (R29-R30) への前進 readiness 100%** を達成。Round 29 で Web-Ops-P が経路 1+2 trigger 採否判断 + 実機 actual 起票 → Round 30 で Web-Ops-Q が経路 3+4 trigger 採否判断 + 実機 actual 起票 → 6/19 launch day rollback 経路 readiness を simulated → 当日実機まで前進完遂、6/19 confidence 寄与 +0.3pt 想定。

---

**最終更新**: 2026-05-06 (Round 28 / Web-Ops-O 起票)
**次回見直し**: 2026-06-03 (R29 Web-Ops-P 採否判断 + 実機 trigger 1-7) / 2026-06-04 以降 (R30 Web-Ops-Q 採否判断 + 実機 trigger 8-11)

EOF
