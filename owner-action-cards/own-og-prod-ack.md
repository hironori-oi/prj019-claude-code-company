# OWN-OG-PROD-ACK: OG src migration production rollout 直前最終 ack 取得カード

**対象**: Owner（hironori555@gmail.com）
**所有者**: Web-Ops 部門 / Round 24 Web-Ops-K 起票
**バージョン**: v1.0（Round 24 / 18 番目 Owner action card）
**親**: `projects/COMPANY-WEBSITE/runbooks/og-src-production-owner-ack-package.md`（Dev-OO R23 起票、5-7 min 確認 + ACK 返信形式）
**位置付け**: 17 件物理化済 Owner action card（CARD A〜D + OWN-PRE-01〜07 + OWN-AUTO + OWN-AUTO PoC 4 script + OWN-PRE-DRY-RUN）に **18 番目** として追加

---

## 0. 目的

OG image src 物理化 production deploy（`vercel deploy --prod` step 12）実行直前に、Owner から **1 分以内**で最終 formal ack を取得する。Dev-OO R23 起票 ack package 5-7 min 詳細確認は **6/12 D-7 までに事前完了済** の前提で、production rollout 直前の最終確認 ack を min 単位で圧縮する設計。

OWN-PRE-XX 系 7 card との違い:
- OWN-PRE-XX = 6/12 D-7 までに完了する **環境設定 ack**（10-15 min/件）
- OWN-OG-PROD-ACK = 6/12 D-7 step 12 開始直前の **production rollout ack**（1 min 以内）

---

## 1. 何を

production rollout 実行直前に、Owner が事前確認済 ack package を再確認した上で `#prj-019-launch` channel に **`ACK-PROD`** と返信する。Web-Ops は ACK-PROD permalink を確認した上で Dev 担当に step 12 着手 GO を Slack DM で通知する。

ack 文言: `ACK-PROD`（OWN-PRE-XX `done` とは区別。production rollout 専用 marker）

---

## 2. なぜ

- step 12 = `vercel deploy --prod` は **Owner ack 取得後にしか実行できない**（DEC-019-054 production deploy gate 経由）
- ack package §6 (Dev-OO R23) で 5-7 min 事前確認は完了済 = 直前確認は 1 min で十分
- Web-Ops + Dev の二重承認体制（4 eyes 原則）を担保
- ACK-PROD permalink は launch readiness consolidation §X に pin 化、6/19 公開時の audit trail 化

---

## 3. 所要時間

**1 min 以内**（事前確認は 6/12 までに完了済前提、本 card は最終確認のみ）

内訳:
- Slack notification 確認: 10 sec
- ack package §6 last paragraph 再確認: 30 sec
- `ACK-PROD` 返信入力 + 送信: 20 sec

---

## 4. 期限

2026-06-12（D-7）15:00 JST 想定（OWN-AUTO PoC stage B 完了 14:36 + step 12 着手 15:00 の 24 min 間に Owner ack 取得）

事前確認期限: 2026-06-12 14:00 JST まで（ack package §6.2 6 min breakdown を Owner が事前 read 済）

---

## 5. pre-condition

- [ ] Owner が `og-src-production-owner-ack-package.md` §1〜§5（5 components）を 6/12 14:00 までに事前 read 済
- [ ] OWN-AUTO PoC stage B（4 script）が 6/12 14:36 までに完遂、Slack に 4 件 done post 済
- [ ] step 11 = Vercel preview 8 case 全 PASS が R22 で完了済（preview URL は ack package §6 に埋込）
- [ ] visual regression baseline 8 case 取得済（baseline checksums.txt commit 済）
- [ ] Dev 担当 + Web-Ops が `#prj-019-launch` で待機状態（DM 即応可能）

---

## 6. 実行 step（3 step）

1. **Slack 通知確認**: クリック先 `Slack #prj-019-launch channel` / 入力値 -（受動受信） / 期待表示 `Web-Ops からの "@owner OG image src 物理化 production deploy ack お願いします" post（ack package §6 全文 + preview URL 埋込済）`
2. **ack package §6 last paragraph 再確認**: クリック先 -（事前 read 済前提で thread 内 Web-Ops 投稿の冒頭 5 行のみ目視） / 入力値 - / 期待表示 `【判断頂きたい点】 production deploy（vercel deploy --prod）実行可否 / YES なら ACK と返信ください / 確認所要 5-7 min を想定しています が表示`
3. **ACK-PROD 返信投稿**: クリック先 `thread reply text box` / 入力値 `ACK-PROD` / 期待表示 `自分の thread reply が channel に表示、Web-Ops の :white_check_mark: reaction 即時付与`

---

## 7. 想定所要時間 breakdown

| 段階 | 想定時間 | 内容 |
|---|---|---|
| step 1 Slack 確認 | 0:10 | mention 通知から channel 移動 |
| step 2 §6 再確認 | 0:30 | 5 行 / 5 components の概要を再確認 |
| step 3 返信入力 | 0:15 | `ACK-PROD` 7 文字入力 + send |
| step 3 reaction 確認 | 0:05 | Web-Ops :white_check_mark: 確認 |
| **合計** | **1:00** | **1 min 以内達成** |

---

## 8. fallback（事前確認不足等）

| symptom | fallback | 想定時間 |
|---|---|---|
| Owner が ack package §1-§5 事前 read 未完 | 6/12 15:00 ack 取得を 15:30 に slip、Owner が ack package 5-7 min full read | +30 min |
| Owner が ACK-PROD ではなく ACK と投稿 | Web-Ops が thread reply で marker 確認返信 + Dev 着手継続（formal ack として両 marker 受容） | 0 |
| Owner が NO 判断 | step 12 中止、翌 round で原因調査 + Owner 懸念解消後の再 ack（次回 D-7 想定）| 1 day delay |
| Owner unreachable（Slack 未読等） | 6/12 16:00 まで待機 → メール直送（hironori555@gmail.com） + 17:00 まで待機 → 翌日 6/13 へ slip | up to 1 day |
| ack package §6 preview URL 切れ | step 11 を Web-Ops が再実行（10 min）→ ack package §6 を URL 更新後に再 post | 10 min |

---

## 9. 自動化候補度

### 9.1 自動化可否評価

**自動化候補度: C (低)**

| 軸 | 評価 | 理由 |
|---|---|---|
| 機械実行可否 | NO | Owner formal judgement 必須（production rollout 法的責任） |
| Owner 判断介在 | YES | YES/NO の最終承認は人間判断 |
| 副作用 | YES | production deploy = 公開系 |
| 4 eyes 原則 | NO | Owner + Web-Ops + Dev の 3 eyes 体制必須 |

### 9.2 自動化可能な周辺領域

本 card 自体は自動化不可だが、以下の周辺領域は OWN-AUTO 横展開で自動化可能:
- Slack notification 自動 post（Web-Ops が ack package §6 文面を webhook 経由で post = R25 候補）
- ACK-PROD 受信検知 → Dev 担当への DM 自動送信（slack-alert-routing.md §X 派生 = R26 候補）
- ack permalink の launch readiness §X 自動 pin 化（R27 候補）

### 9.3 18 番目 card としての位置付け

OWN-AUTO PoC 4 script (R23 Web-Ops-J 物理化) で **A 分類 4 件 = 88% 圧縮** を達成済。本 card は C 分類 = **人間判断必須** の代表例として、自動化境界線を明示する役割を持つ。R26+ の OWN-AUTO 横展開でも本 card は手動継続。

---

## 10. post-condition

- Owner が `#prj-019-launch` channel に `ACK-PROD` thread reply 完了
- Web-Ops が ack permalink を取得し pin 化
- Web-Ops が Dev 担当に step 12 着手 GO の Slack DM 送信
- Dev 担当が step 12 phase 1 pre-deploy 着手準備完了
- launch readiness consolidation §X に ACK-PROD permalink 追記

---

## 11. 関連 DEC

- DEC-019-054（production deploy gate / 本 card は gate 通過 marker）
- DEC-019-025（background dispatch SOP / 本 card 自体も SOP 実証物）
- DEC-019-077 DRAFT（Owner 拘束 76% 圧縮 default 化議決 / 本 card は 1 min 圧縮の代表例）

---

## 12. 関連リンク

- 親 ack package: `projects/COMPANY-WEBSITE/runbooks/og-src-production-owner-ack-package.md`（Dev-OO R23、5-7 min 詳細確認版）
- step 12 procedure: `projects/COMPANY-WEBSITE/runbooks/og-step-12-production-deploy-dryrun-procedure.md`（Dev-OO R23、328 行）
- web-ops 連動 dry-run: `projects/PRJ-019/reports/web-ops-k-round24-og-step12-dryrun.md`（本 round Web-Ops-K 起票）
- launch readiness: `projects/COMPANY-WEBSITE/runbooks/launch-readiness-consolidation-2026-06-19.md`
- INDEX: `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md`（17 件 → 18 件に更新候補）

---

## 13. 17 件 → 18 件 INDEX 更新案

INDEX.md §1 lookup 表に下記行を追加（実 INDEX 改変は Round 25 で実施、本 card 起票時は提案のみ）:

```
| OWN-OG-PROD-ACK | OG production rollout 最終 ack | 2026-06-12 15:00 | 1 min | [own-og-prod-ack.md](own-og-prod-ack.md) | TODO |
```

合計所要 80 min → 81 min（+1 min、本 card は production rollout 直前のみ）。

---

**最終更新**: 2026-05-05（Round 24 / Web-Ops-K 起票）
**次回見直し**: 2026-06-12（D-7 ack 取得直前）/ 2026-06-13（ack permalink pin 化確認）

EOF
