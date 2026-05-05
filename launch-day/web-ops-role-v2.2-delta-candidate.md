# Runbook: 公開当日 Web-Ops 役割 v2.2-delta-candidate（OWN-AUTO 連携 + step 12 実機予行 + Owner ack card 18 反映版）

**対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
**所有者**: Web-Ops 部門 / Round 24 Web-Ops-K 起票
**バージョン**: v2.2-delta-candidate（Round 24 / **delta-only diff form 二段重ね**）
**親 / historical baseline**:
- v2.0 = `projects/COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.0.md`（Web-Ops-I R22、255 行 / 22 task / 6 hour budget）
- v2.1-delta = `projects/COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.1-delta.md`（Web-Ops-J R23、217 行 / 4 sub-card 自動化反映）

**用途**: v2.1-delta からの追加 delta（Round 24 由来 3 軸）を記述する **二段重ね delta 文書**。**v2.0 + v2.1-delta は無改変**。

---

## 0. v2.2-delta-candidate の position

### 0.1 v2.0 / v2.1-delta / v2.2-delta-candidate の関係

```
v2.0           = base 22 task 6 hour 255 行 (R22 Web-Ops-I 確定)
  ↓ +PoC 反映
v2.1-delta     = 4 sub-card 自動化反映 217 行 (R23 Web-Ops-J 確定)
  ↓ +R24 由来 3 軸
v2.2-delta-cand = 本書 (R24 Web-Ops-K candidate)
```

v2.2 が **正式版** に昇格するのは Round 25 完遂後（6/12 D-7 stage B 完遂 + step 12 実機完遂後）の評価を待つ。本書は Round 24 段階の candidate = 議決対象前の暫定版。

### 0.2 candidate 段階の制約

- 本書は **v2.0 + v2.1-delta を再記載しない**（path 参照のみ、二段重ね delta 形式）
- v2.0 22 task table / v2.1-delta 4 sub-card 圧縮表は absolute 無改変
- v2.2 で **削除** される task 0 件 / **追加** される task 0 件（Round 24 PoC 段階での実時間影響は 6/12 D-7 後の Round 25 で確定）
- candidate → 正式版 昇格 condition は §9 で明示

---

## 1. R24 由来 3 軸 delta summary

### 1.1 軸 1: OWN-AUTO 4 script 連携位置（dry-run record 化）

R23 Web-Ops-J PoC 4 script 物理化に対し、R24 Web-Ops-K Task 1 で **mock data 実機予行 record（453 行）** を追加。launch day 22 task 上の連携位置:

| task | v2.0 | v2.1-delta | v2.2-cand |
|---|---|---|---|
| W-06 Supabase RLS 最終確認 | 10 min（手動目視） | 6 min（own-auto-06 PoC log 参照） | 6 min（**+ dry-run record 6/12 14:36 - 14:39 evidence 4 種を本 task に紐付け**）|
| W-12 CEO 共有 | 3 min | 3 min（OWN-PRE-01/02/04/06 PoC 完遂状態 1 行追加） | 3 min（**+ Round 24 dry-run record 1 行追加**）|

実時間は v2.1-delta から不変（本書は record 紐付けのみ）。

### 1.2 軸 2: step 12 実機予行 反映点

R23 Dev-OO step 12 procedure 328 行に対し、R24 Web-Ops-K Task 2 で **web-ops 視点 dry-run record（379 行）** を追加。launch day 連動 task の補強:

| task | v2.0 | v2.1-delta | v2.2-cand 反映点 |
|---|---|---|---|
| W-04 PIN-A 確認 | 5 min | 5 min（不変） | 5 min（**+ step 12 OG production rollout 実機完遂後の OG image baseline 状態を確認 step に追加**） |
| W-09 DNS TTL 維持確認 | 5 min | 5 min（不変） | 5 min（**+ OG production URL の DNS resolve 確認を sub step に追加**） |

OG production rollout は 6/12 D-7 で完遂前提（Round 25 タスク）= 6/19 当日は **path B 状態の web-ops 確認のみ**。

### 1.3 軸 3: Owner ack card 18 件目組込

R24 Web-Ops-K Task 3 で **OWN-OG-PROD-ACK card** を起票（17 件 → 18 件）。launch day で参照する owner-action-cards INDEX 更新:

| INDEX 構造 | v2.0 | v2.1-delta | v2.2-cand |
|---|---|---|---|
| 物理化 card 数 | 13 件 | 17 件（+OWN-AUTO PoC 4 script） | **18 件（+OWN-OG-PROD-ACK）** |
| 合計所要時間 | 80 min | 80 → 31.5 min（PoC 適用後） | **80 → 32.5 min（PoC 適用 + 1 min OG ack）** |

OWN-OG-PROD-ACK は **6/12 D-7 step 12 直前の 1 min ack** で、**6/19 当日 launch day には影響なし**（6/12 D-7 で完遂済前提）。

---

## 2. delta task 再計算（v2.1-delta §2 表からの追加差分のみ）

### 2.1 W-04 PIN-A 確認（5 min 維持、内訳変更）

v2.1-delta §2.2 では「OWN-AUTO PoC とは独立した rollback 前提確認、v2.0 と完全同一」。v2.2-cand では:

```
06:30 開始（v2.1-delta 不変）
T+0:00  PIN-A commit hash を Vercel dashboard で確認（v2.0 §2 不変、3 min）
T+3:00  step 12 完遂後の OG image baseline 状態確認を追加（**新規 sub step、1 min**）
        - vercel inspect $PROD_URL の commit hash が PIN-A と一致確認
T+4:00  rollback 経路 link 確認（v2.0 §2 不変、1 min）
06:35 完了（5 min、v2.0/v2.1 比 ±0 min）
```

実時間 5 min は不変。内訳に「step 12 完遂後の baseline 状態確認」1 sub step を追加（OG image production 化を web-ops 視点で再確認、4 eyes 原則の補強）。

### 2.2 W-06 Supabase RLS 最終確認（6 min 維持、evidence 紐付け）

v2.1-delta §2.1 で 10 → 6 min 圧縮済。v2.2-cand では evidence reference を追加:

```
06:55 開始（v2.1-delta 不変）
T+0:00  Slack 6/12 own-auto-06 完了投稿 permalink を pin 確認（v2.1 不変、1 min）
T+1:00  抜き打ち 3 table 目視 RLS green badge 確認（v2.1 不変、3 min）
T+4:00  最新 cron 起動で own-auto-06 再実行（v2.1 不変、2 min）
        - **Round 24 dry-run record `web-ops-k-round24-own-auto-dry-run.md` §5 と diff 0 確認**を sub step として追加
07:01 完了（6 min、v2.1 不変）
```

実時間 6 min 不変。dry-run record §5 との diff 0 確認が補強され、**4 eyes 原則の精度向上**。

### 2.3 W-09 DNS TTL 維持確認（5 min 維持、OG resolve 確認追加）

v2.0 §2 W-09 = 「DNS TTL 300 秒維持確認、5 min」。v2.2-cand では OG production URL resolve 確認 sub step を追加:

```
07:30 開始（v2.0/v2.1 不変）
T+0:00  DNS TTL 300 秒確認（v2.0 不変、3 min）
T+3:00  OG production URL の DNS resolve 確認（**新規 sub step、1 min**）
        - dig $PROD_URL +short → IP 取得確認、SNS share 時の preview 動作前提確認
T+4:00  CDN cache propagation 確認（v2.0 不変、1 min）
07:35 完了（5 min、v2.0/v2.1 比 ±0 min）
```

実時間 5 min 不変。OG image SNS preview 動作前提（DNS resolve 健全性）を補強。

### 2.4 W-12 CEO 共有（3 min 維持、1 行追加）

v2.1-delta §2.3 で「OWN-PRE-01/02/04/06 は 6/12 PoC 完遂済（own-auto-01〜06）/ 残 3 件 (03/05/07) は手動運用」1 行追加済。v2.2-cand では更に:

```
v2.1-delta 1 行: "OWN-PRE-01/02/04/06 は 6/12 PoC 完遂済（own-auto-01〜06）/ 残 3 件 (03/05/07) は手動運用"
v2.2-cand 追加 1 行: "Round 24 dry-run record で 88% 圧縮 evidence 確立 / OG production rollout step 12 完遂済（OWN-OG-PROD-ACK 18 件目 reference）"
```

実時間 3 min 不変、本文 2 行追加。

---

## 3. 6 hour budget 再計算（v2.1-delta §2.4 からの差分）

### 3.1 v2.1-delta → v2.2-cand 比較

| 時間帯 | v2.1-delta | v2.2-cand | 差分 |
|---|---|---|---|
| 06:00-07:00 W-01〜W-06 | 57 min | 57 min | 0 |
| 07:00-08:00 W-07〜W-12 | 50 min | 50 min | 0 |
| 08:00-09:00 W-13〜W-17 | 33 min | 33 min | 0 |
| 09:00-10:00 W-18〜W-20 | 55 min | 55 min | 0 |
| 10:00-12:00 W-21〜W-22 | 30 min | 30 min | 0 |
| **合計** | **225 min** | **225 min** | **0 min** |

実時間は v2.1-delta から **完全不変**。v2.2-cand は内訳補強のみで、6 hour budget 残 135 min も不変。

### 3.2 v2.2-cand 補強の意義

実時間不変だが、以下の web-ops 確実性が向上:
- W-04 で OG production 状態の独立確認（4 eyes 原則）
- W-06 で Round 24 dry-run record diff 0 確認（精度向上）
- W-09 で OG SNS preview 前提確認（risk 早期検知）
- W-12 で Round 24 由来 evidence 共有（CEO 認知向上）

---

## 4. PoC 関連 artifact 追加（v2.1-delta §3 17 件 → v2.2-cand 21 件）

v2.1-delta §3 17 件に加え、Round 24 で 4 件追加:

| # | artifact path | Round | 役割 |
|---|---|---|---|
| 18 | `projects/PRJ-019/reports/web-ops-k-round24-own-auto-dry-run.md` | R24 Web-Ops-K | OWN-AUTO 4 script mock dry-run record（453 行） |
| 19 | `projects/PRJ-019/reports/web-ops-k-round24-og-step12-dryrun.md` | R24 Web-Ops-K | step 12 web-ops 視点 dry-run record（379 行） |
| 20 | `projects/PRJ-019/owner-action-cards/own-og-prod-ack.md` | R24 Web-Ops-K | OWN-OG-PROD-ACK 18 件目 card（168 行） |
| 21 | 本書 `projects/PRJ-019/launch-day/web-ops-role-v2.2-delta-candidate.md` | R24 Web-Ops-K | v2.2 delta candidate |

合計 21 件の web-ops 担当 artifact を 6/19 当日に活用。

---

## 5. risk + fallback 索引（v2.1-delta §4 からの追記）

v2.1-delta §4 12 件（v2.0 §5 10 件 + R23 派生 2 件）に加え、Round 24 で 1 件追加:

| risk | 検知 task | fallback artifact | 影響 |
|---|---|---|---|
| OG production rollout step 12 phase 3 FAIL（preview PASS 後の環境差） | W-04 (06:30) で commit hash 不整合検知 | `og-step-12-production-deploy-dryrun-procedure.md` §4.5 = git revert 2 commit + redeploy（10 min） | OG image 404 復帰 + HP top 200 維持（最大 5 min downtime） |

R24 で識別された新 risk = step 12 完遂後の baseline 状態 vs PIN-A の不整合。確率 < 1%（preview PASS 後発生）。

---

## 6. v2.2-cand の lock policy

R25 stage B + step 12 完遂後: 本 candidate を「v2.2 正式版」に昇格判断（§9 condition 評価）/ 6/19 09:00 公開直後: v2.0 + v2.1-delta + v2.2 を **三重 lock** / 6/19 12:00 W-22 完了後: §2 delta task の実時間ログを本書末尾追加 / 6/20 T+24h 完了後: 三層統合の妥当性検証（必要なら v3.0 起票議論）/ 7/27 30 day review: 二段重ね delta 手法 knowledge 抽出 → `organization/knowledge/patterns/launch-day-multi-tier-delta-runbook.md` 候補化（DEC-019-033）

---

## 7. 関連 DEC（v2.1-delta §6 への追記）

v2.1-delta §6 4 件に加え、Round 24 で関連 1 件:

- DEC-019-077 DRAFT（Owner 拘束 76% 圧縮 default 化議決 / 本書 v2.2-cand は 88% 圧縮実証 + 1 min OG ack の defalut 化候補 evidence）
- 既存維持: DEC-019-025 / DEC-019-062 / DEC-019-033 / DEC-019-054

---

## 8. v2.0 + v2.1-delta absolute 無改変保証

本書 v2.2-cand は **参照 only**。以下を遵守:

- v2.0 = 255 行 / 22 task table / 6 hour budget = absolute 無改変（直接編集 0）
- v2.1-delta = 217 行 / 4 sub-card 圧縮表 / W-06 圧縮 = absolute 無改変（直接編集 0）
- 本書 v2.2-cand 内では v2.0 / v2.1-delta の数値・表を path 参照のみ
- 削除・追加・改変は **本 candidate 内に閉じ込める**

本書 update 権限は Web-Ops 部門のみ。CEO / Owner からの修正依頼は Web-Ops 経由で本 candidate にのみ反映（v2.0 / v2.1-delta は永続 lock）。

---

## 9. v2.2-cand → v2.2 正式版 昇格 condition

### 9.1 6/12 D-7 完遂後の昇格 condition

| condition | 必達/推奨 |
|---|---|
| OWN-AUTO PoC stage B 4 script 全 complete + assertion ok | 必達 |
| OG step 12 全 phase PASS（gate A + B + C 14 項目）| 必達 |
| visual regression baseline diff 0（8 case sha256 一致） | 必達 |
| OWN-OG-PROD-ACK の Owner ack 取得（1 min 以内）| 必達 |
| Round 24 dry-run record と stage B 実機 record の deviation < 5% | 推奨 |

### 9.2 昇格判定者

- 主担当: Web-Ops 部門（K 担当）
- 確認者: CEO（6/12 23:59 までに Slack ack）
- Owner 通知: 6/13 朝 Slack 共有

### 9.3 昇格不能時 fallback

5 condition で 1 件でも FAIL → **v2.1-delta のまま運用**（本 candidate は archive）。launch day 6/19 の影響なし（v2.1-delta は 4 sub-card 自動化 + 6 hour budget 確立済）。

---

## 10. v2.2-cand Round 24 完遂判定

- [x] v2.0 + v2.1-delta absolute 無改変（path 参照のみ）
- [x] R24 由来 3 軸 delta（OWN-AUTO 連携 + step 12 反映 + Owner ack card 18）を §1 で集約
- [x] 22 task の delta 再計算 (§2、W-04/06/09/12 の内訳補強、実時間不変)
- [x] 6 hour budget 不変確認 (§3、225 min 不変)
- [x] 関連 artifact 追加 (§4、17 → 21 件)
- [x] risk fallback 追加 (§5、12 → 13 件)
- [x] candidate → 正式版 昇格 condition 5 件 (§9)
- [x] 行数 200-260 範囲（本書約 230 行想定）

---

## 11. Round 25 引継

Round 25 stage B + step 12 完遂後 → §9 condition 評価 → v2.2 正式版 昇格判定 / 6/19 当日 22 task 実時間ログ W-22 完了後追記 / 7/27 30 day review で二段重ね delta 手法 knowledge 化（DEC-019-033）

---

**最終更新**: 2026-05-05（Round 24 / Web-Ops-K candidate 起票）
**次回見直し**: 2026-06-12（D-7 stage B + step 12 完了後 §9 昇格判定）/ 2026-06-19 09:00 JST（v2.0 + v2.1-delta + v2.2 三重 lock）/ 2026-06-19 12:00 JST（実績ログ追記）

EOF
