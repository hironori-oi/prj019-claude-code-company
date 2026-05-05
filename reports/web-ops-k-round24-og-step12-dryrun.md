# Web-Ops-K Round 24 報告: OG src migration step 12 production rollout 実機予行 record

- **担当**: Web-Ops 部門 / Round 24 担当 K
- **対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
- **Round**: 24（2026-05-05）
- **対象 procedure**: `projects/COMPANY-WEBSITE/runbooks/og-step-12-production-deploy-dryrun-procedure.md`（Dev-OO R23 起票、328 行）
- **目的**: OG (Owner Gate) production rollout の step 12 を実機 dry-run した想定 record。Round 25 で Owner ack 取得後の Dev 担当が「迷わず手が動く」状態を web-ops 視点で再確認 + visual regression baseline との突合
- **historical baseline**: Dev-OO R23 procedure 328 行 + visual regression baseline dry-run record 共に absolute 無改変参照

---

## §0 本 record の position

### 0.1 web-ops 視点の補強記録

Dev-OO R23 起票 step 12 dry-run procedure は **dev 実行視点** で 3 phase 14 command を確立済。本 record は **web-ops 公開運用視点** で:

1. step 12 実行直前/中/後の web-ops 担当 task との接続点（Slack post / pin 化 / launch readiness 連動）
2. visual regression baseline との突合実機予行
3. Owner ack 必要箇所の min 単位整理
4. 想定通過時間の web-ops 連動 timeline

を補強記録する。

### 0.2 制約遵守事項

副作用 0 / API call $0 / 絵文字 0 / historical baseline 改変 0（実機 vercel deploy 0 / git revert 0 / curl 0、dev local + dry-run のみ）

### 0.3 step 12 = 何を確認するか

| 軸 | 確認対象 | 本 record §X |
|---|---|---|
| pre-deploy gate A | Vercel auth + tracked file 整合 | §2 |
| deploy gate B | `vercel deploy --prod` exit 0 + commit hash 一致 | §3 |
| post-deploy gate C | 8 case + cache + visual regression PASS | §4 |
| 想定通過時間 | 11-16 min total | §5 |
| Owner ack 必要箇所 | 0 (step 12 開始前で完了) | §6 |
| fallback 経路 | gate B/C FAIL → revert + redeploy | §7 |
| visual regression 突合 | sha256 一致 / pixel diff < 0.5% | §8 |

---

## §1 step 12 実行前 web-ops 連動 sequence

### 1.1 Owner ack → step 12 実行までの flow

```
T+0      Owner が #prj-019-launch に "ACK" 投稿（og-src-production-owner-ack-package.md §6 経由）
T+1 min  Web-Ops が ack permalink を pin 化
T+2 min  Web-Ops が Dev 担当に Slack DM で step 12 着手 GO 通知
T+3 min  Dev 担当が step 12 procedure を画面に展開 + 本 record を side reference として開く
T+5 min  Dev 担当が phase 1 pre-deploy 着手
T+11-16  step 12 完遂（gate A → B → C 全 PASS）
T+18     Web-Ops が完遂 Slack post + launch readiness consolidation §X を緑 check
```

### 1.2 web-ops 担当 task 5 件

| task | 想定 timing | 内容 |
|---|---|---|
| W12-A-1 | step 12 直前 | Vercel preview URL を pin 化（step 11 完遂時の URL） |
| W12-A-2 | step 12 phase 2 中 | Vercel dashboard を別タブで開いて build progress 監視 |
| W12-A-3 | step 12 phase 3 中 | 8 case curl の result を side check（独立検証） |
| W12-A-4 | step 12 完遂直後 | `#prj-019-launch` に完遂 post + Owner notification |
| W12-A-5 | step 12 完遂直後 | `launch-readiness-consolidation-2026-06-19.md` §X を OG 緑 check 化 |

W12-A-2/W12-A-3 は **Dev と Web-Ops の並走監視** = 4 eyes 原則で false PASS 検出。

---

## §2 phase 1 pre-deploy（5 min）web-ops 視点 dry-run

### 2.1 Dev-OO §2 4 command の web-ops 観察 reference

| dev 実行 | 期待 output | web-ops 想定確認 | 想定 ETA |
|---|---|---|---|
| `git status -s` | 空 | repo 内 untracked 0 を Slack screenshot に残す | 0:30 |
| `vercel whoami` | Owner account | Vercel auth 状態を 2 経路（CLI + dashboard）で確認 | 0:30 |
| `git rev-parse HEAD` | step 11 と同 hash | Web-Ops が pin 化した preview deploy commit と diff 0 確認 | 1:00 |
| `ls .next/server/app/api/og/route.js` | 存在 | build artifact 存在を独立検証（dev local 想定） | 1:00 |

### 2.2 想定通過時間

```
phase 1 開始 14:35:00 (例)
T+0:00  git status -s          (10 sec)
T+0:10  vercel whoami           (10 sec)
T+0:20  git rev-parse HEAD      (5 sec)
T+0:25  ls .next/server/...     (5 sec)
T+0:30  4 command 完了 (実 30 sec)
T+0:30  - 4 min  : phase 1 buffer（network slow 時の retry 1 回 + 想定外 stale state 確認）
T+5:00  phase 1 終了 / phase 2 開始
```

実 30 sec で完了する 4 command に対して 5 min budget を確保 = network 不安定時の retry を吸収。

### 2.3 gate A web-ops 判定 4 軸

| 項目 | 期待 | web-ops 観察 |
|---|---|---|
| `git status -s` 空 | 必須 | repo screenshot 取得（Slack pin 用） |
| `vercel whoami` 一致 | 必須 | Vercel dashboard でも同 account 確認 |
| `.vercel/project.json` 存在 | 必須 | path 上で stat 確認 |
| `.next/server/app/api/og/route.js` 存在 | 必須 | size > 0 確認 |

**4 項目全 OK → phase 2 へ。1 件 FAIL → phase 2 中止 + 原因調査（実害 0）**

### 2.4 phase 1 FAIL 時 web-ops 動作

phase 1 では production 未投入なので web-ops 側でも **rollback 不要**。Dev 担当に「phase 1 FAIL のため 5 min 中断します」と Slack post + 原因調査支援。

---

## §3 phase 2 deploy（1-3 min）web-ops 視点 dry-run

### 3.1 Dev-OO §3 3 command の web-ops 観察 reference

| dev 実行 | 期待 output | web-ops 想定確認 | 想定 ETA |
|---|---|---|---|
| `vercel deploy --prod` | `[Ready]` + Production URL | Vercel dashboard で同 deploy が `Promote to Production` 完了を独立確認 | 1-3 min |
| `export PROD_URL=...` | URL 文字列 | URL を Slack post の本文 ref に貼付準備 | 0:10 |
| `vercel inspect $PROD_URL` | target=production / commit 一致 | dashboard でも commit hash 一致を独立確認 | 0:30 |

### 3.2 想定通過時間

```
phase 2 開始 14:40:00 (例)
T+0:00  vercel deploy --prod 投下
T+0:10  Vercel build 開始（dashboard 上で Building 表示）
T+1:30  Vercel build 完了（Ready 表示）→ deploy 反映
T+1:40  vercel inspect $PROD_URL exit 0
T+2:00  phase 2 完了
T+2:00 - 3 min : phase 2 buffer（Vercel 障害時の再 deploy 1 回吸収）
T+3:00  phase 2 終了 / phase 3 開始
```

実 1.5 - 2 min で完了する想定。Vercel build cache hit の場合は 1 min 以内、cold cache で 2-3 min。

### 3.3 gate B web-ops 判定 4 軸

| 項目 | 期待 | web-ops 観察 |
|---|---|---|
| `vercel deploy --prod` exit 0 | 必須 | `/tmp/og-prod-deploy.log` 末尾 5 行を Slack post に転記 |
| `[Ready]` 表示 | 必須 | Vercel dashboard で `Production` badge 確認 |
| Production URL 取得 | 必須 | URL を独立 verify 用に再取得 |
| commit hash 一致 | $HEAD_BEFORE_PROD と一致 | git log 1 行と inspect 出力を diff 0 確認 |

### 3.4 phase 2 FAIL 時 web-ops 動作

```
T+0  Web-Ops が Vercel dashboard で前回 Ready deployment を確認 → URL ピン留め
T+1  Web-Ops が "phase 2 FAIL detected, promoting previous Ready" を Slack post
T+2  Dev 担当が Vercel dashboard で previous deployment を Promote to Production
T+3  promote 完了確認 + 8 case curl で 200 復帰確認
T+5  rollback 完遂 Slack post（最大 5 min downtime）
```

実害: 数十秒 - 数分の downtime（前回 Ready が再 promote されるまで）= Owner 認知済 risk。

---

## §4 phase 3 post-deploy verification（5-8 min）web-ops 視点 dry-run

### 4.1 Dev-OO §4 5 command の web-ops 観察 reference

| dev 実行 | 期待 output | web-ops 想定確認 | 想定 ETA |
|---|---|---|---|
| 8 case curl loop | 全 HTTP 200 + PNG 1200x630 | 同 curl を別端末で発火し独立検証（4 eyes） | 1:30 |
| cache-control header check | image/png + cache-control + x-vercel-cache | header 出力を Slack post の本文に転記 | 0:30 |
| sha256 baseline diff | 空（8 件一致） | sha256 比較を web-ops 端末でも独立実施 | 1:00 |
| pixel diff fallback | < 0.5% (3780 pixel) | sha256 mismatch 時のみ。web-ops 端末で `compare -metric AE` 並走 | 2:00 |
| invalid variant fallback | 200 or 400 | 想定 graceful fallback の動作確認 | 0:30 |

### 4.2 想定通過時間

```
phase 3 開始 14:43:00 (例)
T+0:00  8 case curl loop 開始
T+1:30  8 case curl 完了 (HTTP 200 全件)
T+2:00  cache-control header 確認
T+3:00  sha256 baseline 比較完了
T+3:30  pixel diff fallback skip (sha256 一致のため)
T+4:00  invalid variant fallback 検証
T+5:00  phase 3 主要 5 command 完了
T+5:00 - 8 min : phase 3 buffer（pixel diff 必要時のみ +2-3 min 消費）
T+7:00  phase 3 終了 / step 12 全完遂
```

実 5 min で完了する想定。sha256 一致なら pixel diff skip = 5 min、不一致なら +2 min で計 7 min。

### 4.3 gate C web-ops 判定 6 軸

| 項目 | 期待 | web-ops 観察 |
|---|---|---|
| 8 case HTTP 200 | 全件 | 独立 curl で同結果確認 |
| 8 case PNG 1200x630 | 全件 | `file <png>` 出力を集約 table に転記 |
| 8 case size > 1000 byte | 全件 | `stat` 出力で min size 確認 |
| content-type: image/png | 必須 | header 1 行を Slack post 本文に貼付 |
| sha256 baseline 一致 or pixel diff < 0.5% | 必須 | 比較結果を Slack post に表で転記 |
| fallback 経路（invalid variant） | 200 or 400 | 想定挙動と一致を確認 |

**6 項目全 OK → step 12 完遂。1 件 FAIL → §7 rollback。**

### 4.4 phase 3 FAIL 時 web-ops 動作

```
T+0  Web-Ops が "phase 3 FAIL detected, rollback 開始" を Slack post
T+1  Dev 担当が git revert 2 commit + push
T+3  Dev 担当が vercel deploy --prod (revert 状態)
T+6  /api/og 404 復帰確認 + HP top 200 確認
T+8  Web-Ops が rollback 完遂 Slack post + Owner notification
T+10 全 rollback 完了 (最大 10 min)
```

phase 3 FAIL は **preview PASS 後の発生確率 < 1%**（Dev-OO §6.1 想定）= 環境差由来のみ。

---

## §5 想定通過時間 集約 table

### 5.1 phase 別 ETA breakdown

| phase | 主要 command | 実時間 | budget | gate 項目数 | abort 確率 |
|---|---|---|---|---|---|
| 1 pre-deploy | 4 | 0:30 | 5:00 | 4 | < 5% (auth/build artifact) |
| 2 deploy | 3 | 1:30-2:00 | 1:00-3:00 | 4 | < 5% (Vercel 障害) |
| 3 verification | 5+1 | 4:00-5:00 | 5:00-8:00 | 6 | < 1% (preview PASS 後の環境差) |
| **計** | **14** | **6:00-7:30** | **11-16:00** | **14** | **複合 < 10%** |

### 5.2 全体 timeline 統合（Owner ack → 完遂まで）

```
14:30:00  Owner が ACK 投稿
14:31:00  Web-Ops が ack pin 化 + Dev 担当に Slack DM
14:33:00  Dev 担当が step 12 procedure 展開
14:35:00  phase 1 開始 (pre-deploy)
14:40:00  phase 2 開始 (deploy)
14:43:00  phase 3 開始 (post-deploy verification)
14:50:00  step 12 完遂
14:51:00  Web-Ops が完遂 Slack post + launch readiness 緑 check
14:52:00  全工程完了 (Owner ack から 22 min)
```

phase 1/2/3 実時間 6:00-7:30 + buffer 3:30-8:30 + web-ops 連動 5 min = 全 22 min（Owner ack → 完遂）。

### 5.3 W4 完成第 4 弾 寄与

step 12 完遂で **OG image production 物理化 = 17 日 path W4 構成要素 1 件 closure**。Dev-OO §5 で記載された「VRT CI 統合（Round 23+）」の前提が成立。

---

## §6 Owner ack 必要箇所

### 6.1 step 12 内の Owner ack 必要箇所 = 0

step 12 開始 = Owner ack 取得後なので、step 12 phase 1/2/3 の **どの gate にも Owner ack は不要**。

| 段階 | Owner ack | 理由 |
|---|---|---|
| step 12 開始前 | **必要**（og-src-production-owner-ack-package.md §6 経由） | production 投入の最終承認 |
| phase 1 中 | 不要 | sanity check のみ、副作用 0 |
| phase 2 中 | 不要 | Vercel 自動 build、Dev 担当が監視 |
| phase 3 中 | 不要 | 自動検証、PASS で完遂 |
| 完遂直後 | 不要（事後通知のみ） | Web-Ops が Slack post で報告 |

### 6.2 Owner ack 取得 timing 配置

Owner ack は本 record §1.1 の **T+0 段階の 1 回のみ**。step 12 完遂までの 22 min で Owner 介入は 1 回（ack 投稿の 30 sec のみ）= **Owner 拘束 30 sec 〜 1 min**。

### 6.3 ack 取得 Slack post テンプレ（参照）

Dev-OO `og-src-production-owner-ack-package.md` §6 で確立済 5-7 min 確認 + 30 sec ACK 返信形式を踏襲。本 record §1.1 で「T+0 = ACK 投稿」を起点として timeline を確定。

---

## §7 fallback 経路集約

### 7.1 phase 別 fallback 経路

| phase | FAIL 時 | 復旧経路 | 想定 ETA |
|---|---|---|---|
| 1 | auth 切れ / build artifact 不在 | `vercel login` or `pnpm build` 再実行 → phase 1 から再開 | 5 min |
| 2 | `vercel deploy --prod` exit 1 | Vercel dashboard で previous Ready を Promote to Production | 5 min |
| 3 | 8 case 不一致 / sha256 不一致 / pixel diff > 0.5% | `git revert HEAD HEAD~1` + `vercel deploy --prod` | 10 min |

### 7.2 各 fallback で web-ops 担当の動作 + Owner notification

| phase | web-ops Slack post | Owner notification | Owner 拘束 |
|---|---|---|---|
| 1 fallback | "phase 1 paused for X reason, retry ETA 5 min" | Slack post 1 行のみ | 0 |
| 2 fallback | "phase 2 FAIL, promoting previous Ready" + dashboard 監視 + 5 min downtime 通知 | Slack post + 5 min downtime 説明 | 30 sec |
| 3 fallback | "phase 3 FAIL detected, rollback 開始" + git revert log + redeploy log side check + 復帰後 "/api/og 404 復帰、HP top 200 維持、rollback 完遂" | Slack post + Owner DM（10 min downtime + 翌 round 再挑戦判断） | 2 min |

phase 3 fallback のみ Owner 介入 2 min 必要。phase 1/2 は web-ops + dev で完結。

---

## §8 visual regression baseline との突合実機予行

### 8.1 baseline reference

- baseline file: `projects/COMPANY-WEBSITE/test/og-image-baseline/og-{home,service,case,updates}-{ja,en}.png` (8 file)
- baseline checksum: `projects/COMPANY-WEBSITE/test/og-image-baseline/checksums.txt`
- baseline 取得手順: `og-visual-regression-baseline-procedure-2026-05-26.md`（Dev-LL R22 起票、289 行）
- baseline dry-run record: `og-visual-regression-baseline-dryrun-record.md`（Dev-OO R23 起票）

### 8.2 phase 3 sha256 突合 dry-run

```
$ (cd projects/COMPANY-WEBSITE/test/og-image-baseline && sha256sum *.png | sort) > /tmp/baseline-sha.txt
$ (cd "$PROD_DIR" && sha256sum *.png | sort) > /tmp/prod-sha.txt
$ diff /tmp/baseline-sha.txt /tmp/prod-sha.txt
(空: 8 case 全 sha256 一致)
```

期待: 8 case 全 sha256 一致 = production response が baseline と binary level で完全同一。

### 8.3 突合 result + fallback 集約

dry-run 想定 result table: 8 case (og-{home,service,case,updates}-{ja,en}.png) 全件で baseline sha256 = prod sha256 = YES → phase 3 gate C 5 軸目 PASS。

sha256 不一致時の pixel diff fallback:
```
$ THRESHOLD=$((1200 * 630 * 5 / 1000))  # 3780 pixel = 0.5% threshold
$ for f in baseline/*.png; do
    diff=$(compare -metric AE "$f" "$PROD_DIR/$(basename $f)" /tmp/diff.png 2>&1)
    [ "$diff" -gt "$THRESHOLD" ] && echo "FAIL" || echo "PASS"
  done
# 8 case 全 PASS 想定（pixel diff 0 完全一致）
```

実機 sha256 不一致確率 < 1%（環境差由来 = production timezone / fontconfig / @vercel/og version 差）。発生時は pixel diff fallback で許容判定可能。

---

## §9 Round 24 web-ops-K 視点 step 12 dry-run 完遂判定

### 9.1 完遂 check list

- [x] phase 1/2/3 各 web-ops 観察 reference を 4 軸 / 4 軸 / 6 軸で確立
- [x] 想定通過時間を min 単位で 22 min total に整理
- [x] Owner ack 必要箇所を §6 で 0 件と明示（step 12 開始前の 1 回のみ）
- [x] fallback 経路を §7 で phase 別 + web-ops 動作 + Owner notification policy 3 軸記述
- [x] visual regression baseline 突合 dry-run を §8 で 8 case sha256 + pixel diff fallback 形式で記述
- [x] W4 完成第 4 弾 寄与を §5.3 で明示
- [x] 行数 300-380 範囲（本 record 約 350 行想定）

### 9.2 Round 25 引継 + 関連 DEC

引継 4 件:
- 実機 step 12 実行（Owner ack 取得後）= 本 record + Dev-OO §6 dry-run record と diff 取り、deviation 別 report 起票
- 実機 sha256 = baseline と diff 0 確認 → VRT CI 統合
- public/ whitelist（gitignore §5）検討 / locale segment 化検討（Round 25+）
- 6/12 D-7 timeline: 14:30-14:36 OWN-AUTO stage B → 15:00-15:23 step 12 全完遂（OG production + 4 sub-card 自動化を 1 day で完遂、launch day 6/19 への影響 0）

関連 DEC:
- DEC-019-025（background dispatch SOP / 本 dry-run も SOP 実証物）
- DEC-019-033（knowledge 蓄積 / 本 record も pattern 候補 = step-12-dry-run-method）
- DEC-019-076 DRAFT（ARCH-01 解消経路 / OG src 物理化と並走関係）

---

## §10 制約遵守確認

| 制約 | 状態 | evidence |
|---|---|---|
| API call $0 | OK | dry-run のみ、vercel deploy 0 / curl 0 |
| 副作用 0 | OK | git revert 0 / production deploy 0 / commit 0 |
| 絵文字 0 | OK | 本 record 全て確認 |
| historical baseline 改変 0 | OK | Dev-OO R23 procedure + visual regression baseline absolute 無改変 |
| TypeScript / shell strict | OK | 引用 command は全て set -euo pipefail 前提 |
| PRJ-019 配下 | OK | `projects/PRJ-019/reports/web-ops-k-round24-og-step12-dryrun.md` |

---

**最終更新**: 2026-05-05（Round 24 / Web-Ops-K 起票）
**次回見直し**: 2026-06-12（D-7 stage B + step 12 実機直前）/ 2026-06-13（実機 record 起票後 deviation 別 report）

EOF
