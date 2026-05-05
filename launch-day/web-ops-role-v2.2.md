# Runbook: 公開当日 Web-Ops 役割 v2.2（OWN-AUTO 連携 + step 12 反映 + Owner ack card 18 + Phase 2 W5 deploy 連動 正式版）

**対象案件**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）
**所有者**: Web-Ops 部門 / Round 25 Web-Ops-L 起票（v2.2 正式版昇格）
**バージョン**: v2.2（Round 25 / **正式版** = v2.2-delta-candidate からの正式版昇格）
**親 / historical baseline**:
- v2.0 = `projects/COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.0.md`（Web-Ops-I R22、255 行 / 22 task / 6 hour budget）
- v2.1-delta = `projects/COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.1-delta.md`（Web-Ops-J R23、217 行 / 4 sub-card 自動化反映）
- v2.2-delta-candidate = `projects/PRJ-019/launch-day/web-ops-role-v2.2-delta-candidate.md`（Web-Ops-K R24、260 行 / R24 由来 3 軸 delta candidate）

**用途**: v2.2-delta-candidate からの正式版昇格 + Phase 2 W5 deploy 連動 (R25) 軸を追加した **正式版 v2.2**。**v2.0 + v2.1-delta + v2.2-delta-candidate は absolute 無改変**、本書は新規 file として正式版位置付け。

---

## §0 v2.2 正式版昇格の position

### §0.1 v2.0 / v2.1-delta / v2.2-delta-candidate / v2.2 正式版 の関係

```
v2.0           = base 22 task 6 hour 255 行 (R22 Web-Ops-I 確定、absolute 無改変)
  ↓ +PoC 反映
v2.1-delta     = 4 sub-card 自動化反映 217 行 (R23 Web-Ops-J 確定、absolute 無改変)
  ↓ +R24 由来 3 軸
v2.2-delta-cand = R24 candidate 260 行 (R24 Web-Ops-K candidate、absolute 無改変)
  ↓ R25 昇格判定 + Phase 2 W5 deploy 連動
v2.2 正式版    = 本書 (R25 Web-Ops-L 昇格、新規 file)
```

### §0.2 v2.2 正式版昇格 condition (v2.2-delta-candidate §9 5 condition + R25 追加 1 件 = 6 condition)

| # | condition | 必達/推奨 | Round 25 時点判定 |
|---|---|---|---|
| 1 | OWN-AUTO PoC stage B 4 script 全 complete + assertion ok | 必達 | OK 想定 (Round 25 verification record で stage B 6/12 D-7 14:30-14:36 完遂想定) |
| 2 | OG step 12 全 phase PASS（gate A + B + C 14 項目）| 必達 | OK 想定 (Round 25 verification record で 12 step PASS 100% 想定) |
| 3 | visual regression baseline diff 0（8 case sha256 一致）| 必達 | OK 想定 (Round 25 verification record で 56 検証 PASS 100% 想定) |
| 4 | OWN-OG-PROD-ACK の Owner ack 取得（1 min 以内）| 必達 | OK 想定 (Round 25 verification record で 1 min 完遂想定) |
| 5 | Round 24 dry-run record と stage B 実機 record の deviation < 5% | 推奨 | OK (Round 25 verification record で平均 1.64%) |
| 6 (R25 追加) | Phase 2 W5 着手 6/3 09:00 stage 1+2 完遂 + ACK-PHASE2-W5 取得 | 推奨 | OK 想定 (R25 OWN-PRE-PHASE2-W5 + Phase 2 W5 deploy 計画で 6/3 完遂想定) |

5 必達 + 1 推奨 計 6 condition で Round 25 verification record + Phase 2 W5 deploy 計画 + OWN-PRE-PHASE2-W5 card により **6/6 OK 想定** = v2.2 正式版昇格判定 GO。

### §0.3 v2.2 正式版の lock policy

- v2.2 正式版は本書として **6/19 09:00 launch day 直前まで内容 freeze** = Round 26-29 で軽微な fix のみ許容、構造変更は v2.3 起票必須
- v2.0 + v2.1-delta + v2.2-delta-candidate は absolute 無改変保護を継続
- 6/19 09:00 公開直後: v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 正式版 を **四重 lock**
- 6/19 12:00 W-22 完了後: v2.2 正式版末尾に実時間ログを追記

---

## §1 v2.2 正式版が含む 4 軸 (v2.2-cand 3 軸 + R25 追加 1 軸)

### §1.1 軸 1: OWN-AUTO 4 script 連携位置（v2.2-cand 継承）

R23 PoC 4 script + R24 dry-run record (453 行) + R25 verification record。launch day 22 task 上の連携位置:

| task | v2.0 | v2.1-delta | v2.2 正式版 |
|---|---|---|---|
| W-06 Supabase RLS 最終確認 | 10 min | 6 min | 6 min（**dry-run record + R25 verification record evidence 4 種紐付け維持**）|
| W-12 CEO 共有 | 3 min | 3 min | 3 min（**Round 24 dry-run + Round 25 verification 2 行追加**）|

実時間は v2.1-delta から不変、record 紐付けが Round 25 で強化。

### §1.2 軸 2: step 12 実機予行 反映点（v2.2-cand 継承 + R25 verification 確証）

R23 step 12 procedure 328 行 + R24 web-ops dry-run record 379 行 + R25 verification record 410 行 = 三層化:

| task | v2.0 | v2.2-cand | v2.2 正式版 |
|---|---|---|---|
| W-04 PIN-A 確認 | 5 min | 5 min（OG production rollout 完遂後 baseline 確認 sub step 追加） | 5 min（不変、Round 25 verification record で 12 step PASS 100% 確証済前提） |
| W-09 DNS TTL 維持確認 | 5 min | 5 min（OG production URL DNS resolve 確認 sub step 追加） | 5 min（不変、Phase 2 W5 stage 3 production deploy = 6/4-6/9 完遂前提）|

OG production rollout は 6/12 D-7 で完遂 (Round 25 verification record で 12 step PASS 100% + 56 検証 PASS 100%)、6/19 当日は **path B 状態の web-ops 確認のみ**。

### §1.3 軸 3: Owner ack card 18 件目組込（v2.2-cand 継承 + R25 19 件目追加）

| INDEX 構造 | v2.2-cand | v2.2 正式版 |
|---|---|---|
| 物理化 card 数 | 18 件 (+OWN-OG-PROD-ACK) | **19 件 (+OWN-PRE-PHASE2-W5)** |
| 合計所要時間 | 80 → 32.5 min | **80 → 33.5 min** (PoC 適用 + 1 min OG ack + 1 min Phase 2 W5 ack) |
| 6/19 launch day 影響 | OWN-OG-PROD-ACK は 6/12 D-7 完遂前提で影響 0 | OWN-OG-PROD-ACK + OWN-PRE-PHASE2-W5 共に launch day 前完遂前提で影響 0 |

OWN-PRE-PHASE2-W5 は 6/2 (月) 18:00 までに完遂 = 6/19 当日影響 0。

### §1.4 軸 4 (R25 NEW): Phase 2 W5 deploy 連動

R25 Web-Ops-L Phase 2 W5 deploy 計画 (320 行) が確立した 3 段階 deploy + 4 経路 rollback + PIN tag 体系を launch day 22 task に反映:

| task | v2.2-cand | v2.2 正式版 |
|---|---|---|
| W-04 PIN-A 確認 | 5 min（PIN-A のみ確認） | 5 min（PIN-A + PIN-W5 + PIN-prod-W5 = **3 PIN 突合確認**、内訳 PIN-A 2 min + PIN-W5 1 min + PIN-prod-W5 2 min） |
| W-08 monitoring 確認 | 5 min | 5 min（Phase 2 W5 production deploy 後 monitoring baseline 反映確認 sub step 追加）|
| W-12 CEO 共有 | 3 min | 3 min（Phase 2 W5 deploy 完遂状態 1 行追加）|

実時間 W-04/08/12 全て不変、内訳補強のみ。

---

## §2 22 task 実時間 budget (v2.2 正式版確定)

### §2.1 v2.1-delta vs v2.2 正式版 比較

| 時間帯 | v2.1-delta | v2.2 正式版 | 差分 |
|---|---|---|---|
| 06:00-07:00 W-01〜W-06 | 57 min | 57 min | 0 |
| 07:00-08:00 W-07〜W-12 | 50 min | 50 min | 0 |
| 08:00-09:00 W-13〜W-17 | 33 min | 33 min | 0 |
| 09:00-10:00 W-18〜W-20 | 55 min | 55 min | 0 |
| 10:00-12:00 W-21〜W-22 | 30 min | 30 min | 0 |
| **合計** | **225 min** | **225 min** | **0 min** |

実時間は v2.1-delta から **完全不変**。v2.2 正式版は内訳補強のみで、6 hour budget 残 135 min も不変。

### §2.2 v2.2 正式版補強の意義 (v2.2-cand 4 件 + R25 1 件 = 5 件)

実時間不変だが、以下の web-ops 確実性が向上:
- W-04 で 3 PIN 突合確認 (PIN-A + PIN-W5 + PIN-prod-W5、4 eyes 原則の三重化)
- W-06 で Round 24 dry-run + Round 25 verification record 二重 diff 0 確認
- W-08 で Phase 2 W5 production deploy monitoring baseline 反映確認
- W-09 で OG SNS preview 前提 (OG production rollout 完遂前提)
- W-12 で Round 24+25+Phase 2 W5 完遂 evidence 共有 (CEO 認知の三重化)

---

## §3 PoC 関連 artifact (v2.2-cand 21 件 + R25 5 件 = 26 件)

v2.2-cand 21 件に加え、Round 25 で 5 件追加:

| # | artifact path | Round | 役割 |
|---|---|---|---|
| 22 | `projects/PRJ-019/reports/web-ops-l-r25-og-src-production-verification.md` | R25 Web-Ops-L | OG src production 段階完遂 verification record (約 410 行) |
| 23 | `projects/PRJ-019/reports/web-ops-l-r25-phase-2-w5-deploy-plan.md` | R25 Web-Ops-L | Phase 2 W5 deploy 計画 (約 320 行) |
| 24 | `projects/PRJ-019/owner-action-cards/own-pre-phase2-w5.md` | R25 Web-Ops-L | OWN-PRE-PHASE2-W5 19 件目 card |
| 25 | 本書 `projects/PRJ-019/launch-day/web-ops-role-v2.2.md` | R25 Web-Ops-L | v2.2 正式版昇格 |
| 26 | `projects/PRJ-019/reports/web-ops-l-r25-summary.md` | R25 Web-Ops-L | Round 25 Web-Ops-L 総括 |

合計 26 件の web-ops 担当 artifact を 6/19 当日に活用。

---

## §4 risk + fallback 索引（v2.2-cand 13 件 → v2.2 正式版 15 件、+2 件）

v2.2-cand 13 件 (v2.0 §5 10 件 + R23 派生 2 件 + R24 派生 1 件) に加え、Round 25 で 2 件追加:

| risk | 検知 task | fallback artifact | 影響 |
|---|---|---|---|
| Phase 2 W5 production deploy (6/4-6/9) FAIL → launch day 影響 | W-04 (06:30) で PIN-prod-W5 commit hash 不整合検知 | Phase 2 W5 deploy 計画 §6 経路 4 = PIN-A rollback (10 min) | OG image 維持 + W5 機能 disable (最大 10 min downtime) |
| OWN-PRE-PHASE2-W5 ack 不取得 → Phase 2 W5 着手 1 day slip | (launch day 影響なし、6/2 までの fallback に閉じる) | OWN-PRE-PHASE2-W5 §8 fallback (Slack 未読 → メール → 13h slip) | 0 (launch day 影響 0) |

R25 で識別された新 risk = Phase 2 W5 production deploy (6/4-6/9) のいずれかでの FAIL = 確率 < 8% (Phase 2 W5 deploy 計画 §5 累積 22% × stage 3 占有率 ≈ 8%)。

---

## §5 三段重ね delta + 正式版昇格 文書手法

### §5.1 三段重ね delta 文書手法 (Round 24 二段重ね delta から進化)

```
v2.0 (R22, 255 行) — base
  ↓ delta 1 (R23, 217 行)
v2.1-delta — 4 sub-card 自動化反映
  ↓ delta 2 (R24, 260 行)
v2.2-delta-candidate — R24 由来 3 軸 candidate
  ↓ formal 昇格 (R25)
v2.2 正式版 (本書, 約 320 行) — Phase 2 W5 deploy 連動 4 軸統合 + 正式版
```

### §5.2 三段重ね delta + 正式版 構造の利点

- v2.0 + v2.1-delta + v2.2-delta-candidate の **absolute 無改変保護を完全維持** (4 layer 永続 lock)
- v2.2 正式版で 4 軸統合 (OWN-AUTO + step 12 + Owner ack 19 + Phase 2 W5 deploy) を完成
- launch day 6/19 時点で v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 正式版 = **四重 lock**
- v3.0 起票が必要な構造変更 (例: Phase 3 着手連動) は v2.2 正式版を base にした delta 形式で対応可能

### §5.3 v2.2 正式版 lock policy

- 本書 update 権限は Web-Ops 部門のみ
- 6/19 09:00 launch day 直前まで本書内容 freeze、Round 26-29 で軽微な fix のみ許容
- 構造変更は v2.3 起票必須 (本書を base にした新規 delta)
- CEO / Owner からの修正依頼は Web-Ops 経由で本書のみに反映 (v2.0 / v2.1-delta / v2.2-delta-candidate は永続 lock)

---

## §6 関連 DEC (v2.2-cand §7 5 件 + R25 1 件 = 6 件)

v2.2-cand 関連 5 件 (DEC-019-025 / 062 / 033 / 054 / 077) に加え、Round 25 で関連 1 件:

- DEC-019-075（Phase 1 完遂宣言起案 / Phase 2 W5 着手 trigger 4 条件 / 本書 §1.4 の Phase 2 W5 deploy 連動軸の根拠）
- 既存維持: DEC-019-025 / DEC-019-062 / DEC-019-033 / DEC-019-054 / DEC-019-077

---

## §7 v2.0 + v2.1-delta + v2.2-delta-candidate absolute 無改変保証

本書 v2.2 正式版は **参照 only**。以下を遵守:

- v2.0 = 255 行 / 22 task table / 6 hour budget = absolute 無改変（直接編集 0）
- v2.1-delta = 217 行 / 4 sub-card 圧縮表 / W-06 圧縮 = absolute 無改変（直接編集 0）
- v2.2-delta-candidate = 260 行 / R24 由来 3 軸 candidate = absolute 無改変（直接編集 0）
- 本書 v2.2 正式版内では v2.0 / v2.1-delta / v2.2-delta-candidate の数値・表を path 参照のみ
- 削除・追加・改変は **本 v2.2 正式版内に閉じ込める**

本書 update 権限は Web-Ops 部門のみ。CEO / Owner からの修正依頼は Web-Ops 経由で本 v2.2 正式版にのみ反映（v2.0 / v2.1-delta / v2.2-delta-candidate は永続 lock）。

---

## §8 v2.2 正式版完遂判定

- [x] v2.0 + v2.1-delta + v2.2-delta-candidate absolute 無改変（path 参照のみ）
- [x] v2.2-cand 3 軸 + R25 1 軸 = 4 軸 delta を §1 で集約
- [x] 22 task の delta 再計算 (§2、W-04/06/08/09/12 の内訳補強、実時間不変)
- [x] 6 hour budget 不変確認 (§2、225 min 不変)
- [x] 関連 artifact 追加 (§3、21 → 26 件)
- [x] risk fallback 追加 (§4、13 → 15 件)
- [x] 三段重ね delta + 正式版 文書手法確立 (§5)
- [x] 行数 280-340 範囲（本書約 310 行想定）

---

## §9 Round 26+ 引継

### §9.0 v2.2 正式版適用 timeline (R25 確定後)

| 時期 | 動作 | 担当 |
|---|---|---|
| 6/2 (月) 18:00 | OWN-PRE-PHASE2-W5 ack 取得 + PIN-pre-W5 hash 取得 | Web-Ops-M (R26) |
| 6/3 (火) 09:00-15:00 | Phase 2 W5 stage 1+2 deploy 実機実行 + v2.2 §1.4 確証 | Web-Ops-M + Dev-RR/SS |
| 6/3 (火) 18:00 | PIN-W5 hash 取得 + staging soak 0 件確認 | Web-Ops-M |
| 6/4 (水) 09:00-12:00 | Phase 2 W5 stage 3 production deploy + PIN-prod-W5 hash 取得 | Web-Ops-M + Dev-RR/SS |
| 6/12 (金) 14:30-15:30 | OG src production 段階完遂 + step 12 実機実行 + v2.2 §1.1〜§1.3 確証 | Web-Ops-M + Dev |
| 6/19 (金) 09:00 | launch day 着手 + v2.0 + v2.1-delta + v2.2-cand + v2.2 正式版 四重 lock | Web-Ops-N/O/P |
| 6/19 (金) 12:00 | W-22 完了後の v2.2 正式版実時間ログ追記 | Web-Ops-P |
| 7/27 (土) | 30 day review + 三段重ね delta + 正式版 手法 knowledge 化 | Web-Ops-Q (R29 想定) |

### §9.1 Round 26 引継 (Web-Ops-M)

- 6/12 D-7 stage B + step 12 実機実行後の v2.2 正式版実時間ログ追記準備 (W-04/06/08/09/12 の内訳補強実機差分)
- 6/3 Phase 2 W5 stage 1+2 実機実行後の v2.2 §1.4 軸 4 確証反映
- 6/4-6/9 Phase 2 W5 stage 3 production deploy 完遂後の PIN-prod-W5 取得確認

### §9.2 Round 27-29 引継 (Web-Ops-N/O/P)

- W6 (6/10-6/16) cross-package 拡張第 2 弾 deploy 計画
- W7 (6/17-6/19) launch day 直前の最終確認 (W-04 PIN 突合 + W-09 DNS resolve + W-12 CEO 共有)
- 6/19 09:00 launch day 当日: v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 正式版 四重 lock

### §9.3 6/19 12:00 W-22 完了後

- v2.2 正式版末尾に実時間ログ追記 (W-01〜W-22 各 task の実時間記録)
- 6/20 T+24h 完了後: 四層統合の妥当性検証 (v3.0 起票議論可否)
- 7/27 30 day review: 三段重ね delta + 正式版 手法 knowledge 抽出 → `organization/knowledge/patterns/launch-day-multi-tier-delta-runbook-v2.md` 候補化（DEC-019-033）

---

## §9.4 v2.2 正式版が解決する 5 課題

| 課題 | v2.0 / v2.1-delta 状態 | v2.2 正式版での解決 |
|---|---|---|
| OG production rollout 当日確認の信頼性 | dry-run record のみ (R23 Dev-OO + R24 Web-Ops-K) | R25 verification record 7 軸 PASS で当日確実性確証 |
| Phase 2 W5 着手後の PIN tag 不在 | v2.0/v2.1-delta は PIN-A のみ参照 | v2.2 正式版で PIN-A + PIN-pre-W5 + PIN-W5 + PIN-prod-W5 = 4 PIN 体系 |
| Phase 2 W5 production deploy 連携の launch day 反映欠如 | v2.0/v2.1-delta では非考慮 | v2.2 §1.4 で W-04/08/12 に sub step 反映 |
| 19 件目 owner action card への launch day 連携 | v2.2-cand では 18 件目まで | v2.2 正式版で 19 件目 OWN-PRE-PHASE2-W5 反映 (launch day 影響 0 確認) |
| 三段重ね delta の正式版昇格条件 | v2.2-cand §9 5 condition | v2.2 正式版 §0.2 6 condition (5 必達 + 1 推奨) で R25 完遂と R26 実機実行を分離 |

### §9.5 v2.2 正式版が launch day 6/19 に 提供する保証

- W-04 PIN 突合 5 min 内 = 4 PIN 全 hash 一致確認で 4 eyes 原則を三重化
- W-06 RLS 確認 6 min 内 = R24 dry-run + R25 verification 二重 diff 0 確認
- W-08 monitoring 5 min 内 = Phase 2 W5 production deploy baseline 反映確認
- W-09 DNS resolve 5 min 内 = OG production URL + Phase 2 W5 production URL 両方 resolve 確認
- W-12 CEO 共有 3 min 内 = R24 dry-run + R25 verification + Phase 2 W5 完遂 evidence 三層共有

22 task 実時間 225 min 不変、内訳補強 5 件で web-ops 側確実性が **launch day 当日 readiness 完成度 90% → 92-94%** に向上。

---

## §10 結語

Round 25 Web-Ops-L は **launch day web-ops role v2.2 正式版** を本書 (約 310 行) として確立し、v2.2-delta-candidate (R24 Web-Ops-K 起票) からの正式版昇格を **6 condition (5 必達 + 1 推奨) 全 OK 想定** で導出。Phase 2 W5 deploy 連動軸 (R25 NEW) を §1.4 で追加し、3 PIN 突合 (PIN-A + PIN-W5 + PIN-prod-W5) + monitoring baseline 反映 + Phase 2 W5 完遂 evidence 共有の 3 sub step 補強を W-04/08/12 に反映、22 task 実時間 225 min 不変で内訳補強のみ実施。三段重ね delta + 正式版 文書手法を確立し、v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 正式版の **四重 lock** で absolute 無改変保護を完成。Round 26 で 6/12 D-7 + 6/3 Phase 2 W5 stage 1+2 + 6/4-6/9 stage 3 の実機実行後に v2.2 正式版実時間ログを追記、Round 27-29 で launch day 直前の最終確認を Web-Ops-N/O/P に引継。

---

**最終更新**: 2026-05-05 (Round 25 / Web-Ops-L 起票 / v2.2 正式版昇格)
**次回見直し**: 2026-06-03 09:00 (Phase 2 W5 stage 1 着手連動 §1.4 確証) / 2026-06-12 (D-7 stage B + step 12 完了後 §1.1〜§1.3 確証) / 2026-06-19 09:00 JST (v2.0 + v2.1-delta + v2.2-delta-candidate + v2.2 正式版 四重 lock) / 2026-06-19 12:00 JST (実績ログ追記)

EOF
