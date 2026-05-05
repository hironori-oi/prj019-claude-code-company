# OWN-W5-PROD-ACK: Phase 2 W5 stage 3 production deploy 直前 Owner ack 取得カード

**対象**: Owner（hironori555@gmail.com）
**所有者**: Web-Ops 部門 / Round 27 Web-Ops-N 起票
**バージョン**: v1.0（Round 27 / **20 番目** Owner action card）
**親計画**: `projects/PRJ-019/reports/web-ops-m-r26-og-stage-2-deploy-ready.md`（Round 26 Web-Ops-M 起票、stage 3 production deploy 実機実行 readiness）
**位置付け**: 19 件物理化済 Owner action card（CARD A〜D + OWN-PRE-01〜07 + OWN-AUTO + OWN-AUTO PoC 4 script + OWN-PRE-DRY-RUN + OWN-OG-PROD-ACK + OWN-PRE-PHASE2-W5）に **20 番目** として追加

---

## 0. 目的

Phase 2 W5 stage 3 production deploy = 2026-06-04 (水) 09:00 JST (任意 6/4-6/9 範囲) の **直前** に、Owner から stage 3 production rollout GO の formal ack を **1 min 以内** で取得する。Phase 2 W5 stage 3 production deploy は R25 計画 §4 で任意化済だが、production rollout への path を実行する以上、Owner の formal directive を 1 行で取得する SOP 化を本 card で確立。

OWN-PRE-PHASE2-W5 (R25 19 件目) / OWN-OG-PROD-ACK (R24 18 件目) との違い:
- OWN-PRE-PHASE2-W5 = 6/3 Phase 2 W5 着手直前の **Phase 2 着手 GO ack**（1 min 以内、stage 1+2 着手用）
- OWN-OG-PROD-ACK = 6/12 D-7 OG production rollout 直前の **OG production rollout ack**（1 min 以内）
- OWN-W5-PROD-ACK = 6/4-6/9 stage 3 production deploy 直前の **W5 production deploy ack**（1 min 以内）

---

## 1. 何を

stage 3 production deploy 6/4 (水) 09:00 JST (任意 6/4-6/9 範囲) の **当日** に、Owner が 6/3 staging soak 3h 0 件確定 evidence + Phase 2 W5 stage 3 production deploy ready 概要を確認した上で `#prj-019-launch` channel に **`ACK-W5-PROD`** と返信する。Web-Ops は permalink を pin 化、Dev-RR/SS に 6/4 09:01 stage 3 promote 着手 GO を Slack DM で通知する。

ack 文言: `ACK-W5-PROD`（OWN-PRE-PHASE2-W5 `ACK-PHASE2-W5` / OWN-OG-PROD-ACK `ACK-PROD` / OWN-PRE-XX `done` とは区別、stage 3 W5 production 専用 marker）

---

## 2. なぜ

- stage 3 production deploy = `vercel --prod` 実行 = **W5 cross-orchestrator 統合 e2e 機能を production に反映** = production rollout の最終段階
- Owner ack 取得後にしか実行できない（DEC-019-054 production deploy gate 経由 + R25 計画 §4 任意化設計）
- 6/3 staging soak 3h 0 件確定済が前提 = 直前確認は 1 min で十分
- Web-Ops + Dev の二重承認体制（4 eyes 原則）を担保
- ACK-W5-PROD permalink は Phase 2 完遂 audit trail (DEC-019-079 候補) に pin 化、6/19 launch day 実機 evidence として再利用

---

## 3. 所要時間

**1 min 以内**（6/3 staging soak 0 件確定済 + R26 stage 2 readiness 事前 read 想定、本 card は最終確認のみ）

内訳:
- Slack notification 確認: 10 sec
- ack package §0+§1 (production URL + 確認項目) thread reply 再確認: 30 sec
- 6/3 staging soak 3h 0 件 evidence link 確認: 10 sec
- `ACK-W5-PROD` 返信入力 + 送信: 10 sec

---

## 4. 期限

2026-06-04 (水) 09:00 JST 想定（最早）/ 2026-06-09 (月) 18:00 JST 想定（最遅、R25 計画 §4 任意化設計上限）

事前確認期限: 2026-06-03 18:00 JST まで（Web-Ops が 6/3 staging soak 0 件 evidence + production deploy ready 概要を Slack post）

---

## 5. pre-condition

- [ ] Phase 2 W5 stage 1+2 完遂 (6/3 火 18:00 staging soak 3h 0 件確定)
- [ ] PIN-W5 staging hash 取得済 (6/3 14:47 stage 2 完遂時 git tag + 18:00 確認)
- [ ] R26 stage 2 readiness 20/20 軸 GO YES 条件付き状態確認済
- [ ] R26 stage 2 readiness §2.2 OWN-W5-PROD-ACK 4 step 設計確認済
- [ ] Dev-RR/SS が 6/4 09:01 staging → production promote 待機状態 (DM 即応可能)
- [ ] PIN-pre-W5 + PIN-W5 staging hash physical tag 取得済 (rollback 経路 2+3 readiness)

---

## 6. 実行 step（4 step）

1. **Slack 通知確認**: クリック先 `Slack #prj-019-launch channel` / 入力値 -（受動受信） / 期待表示 `Web-Ops からの "@owner Phase 2 W5 stage 3 production deploy ack お願いします" post（production URL + 確認項目 + 6/3 staging soak 0 件 evidence link 埋込済）`
2. **ack package §0+§1 再確認**: クリック先 -（事前 read 済前提で thread 内 Web-Ops 投稿の §0+§1 のみ目視） / 入力値 - / 期待表示 `【判断頂きたい点】 Phase 2 W5 stage 3 production deploy（vercel --prod）実行可否 / YES なら ACK-W5-PROD と返信ください / 確認所要 1 min を想定しています が表示`
3. **6/3 staging soak 0 件 evidence 確認**: クリック先 `Web-Ops post 内 staging soak link` / 入力値 - / 期待表示 `Sentry 0 件 + Vercel Analytics 0 異常 + DB pool 0 件 (90 events 全 PASS) の dashboard`
4. **ACK-W5-PROD 返信投稿**: クリック先 `thread reply text box` / 入力値 `ACK-W5-PROD` / 期待表示 `自分の thread reply が channel に表示、Web-Ops の :white_check_mark: reaction 即時付与`

---

## 7. 想定所要時間 breakdown

| 段階 | 想定時間 | 内容 |
|---|---|---|
| step 1 Slack 確認 | 0:10 | mention 通知から channel 移動 |
| step 2 §0+§1 再確認 | 0:30 | production URL + 確認項目の概要再確認 |
| step 3 staging soak 0 件確認 | 0:10 | dashboard link で 90 events 0 件確認 |
| step 4 返信入力 | 0:10 | `ACK-W5-PROD` 11 文字入力 + send + reaction 確認 |
| **合計** | **1:00** | **1 min 以内達成** |

---

## 8. fallback

| symptom | fallback | 想定時間 |
|---|---|---|
| Owner が R26 stage 2 readiness 事前 read 未完 | 6/4 09:00 ack 取得を 09:30 に slip、Owner が readiness §0+§1 full read | +30 min (許容、stage 3 着手 09:30 影響軽微) |
| Owner が ACK-W5-PROD ではなく ACK-PROD と投稿 | Web-Ops が thread reply で marker 確認返信 + stage 3 着手継続 (formal ack として両 marker 受容) | 0 |
| Owner が NO 判断 | stage 3 production deploy 中止、CEO 経由で Owner 懸念解消 + 翌日 6/5 まで再 ack 待機 → 6/5-6/9 範囲で再着手検討 | 1 day delay (R25 計画 §4 任意化により許容) |
| Owner unreachable (Slack 未読等) | 6/4 10:00 まで待機 → メール直送 (hironori555@gmail.com) + 12:00 まで待機 → 6/5 朝 7:00 まで slip | up to 22h delay |
| 6/3 staging soak 1 件以上検知 | stage 3 着手 hold + Round 28 で原因調査 + Owner 懸念解消後の再 ack (次回 6/5+ 想定) | 1-5 day delay (worst case 6/9 上限まで) |
| PIN-W5 staging hash 取得不完全 | rollback 経路 2 (PIN-pre-W5 staging revert) + Round 28 で再 PIN-W5 取得 + 翌日 stage 3 再 ack | 1 day delay |

---

## 9. 自動化候補度

### 9.1 自動化可否評価

**自動化候補度: B (中)**

| 軸 | 評価 | 理由 |
|---|---|---|
| 機械実行可否 | NO | Owner formal judgement 任意 (DEC-019-054 production deploy gate 経由) |
| Owner 判断介在 | YES | YES/NO は Owner 判断 (production rollout 法的責任) |
| 副作用 | YES | production deploy = 公開系 (W5 機能反映) |
| 4 eyes 原則 | YES | Owner + Web-Ops + Dev (RR/SS) の 3 eyes 体制 |

### 9.2 自動化可能な周辺領域

本 card 自体は中度に自動化可能 (B = 周辺自動化候補):
- Slack notification 自動 post (Web-Ops が R26 stage 2 readiness §0+§1 を webhook 経由で post = R28 候補)
- 6/3 staging soak 0 件 evidence dashboard 自動生成 (R28 候補、Sentry + Vercel Analytics + DB pool 集約)
- ACK-W5-PROD 受信検知 → Dev-RR/SS への DM 自動送信 (R29 候補)
- staging soak 1 件以上検知時の自動 hold trigger (R29 候補)

### 9.3 20 番目 card としての位置付け

| 分類 | card 数 | 自動化候補度 | 例 |
|---|---|---|---|
| A (高) | 11 件 | 自動化済 / 候補 | OWN-AUTO PoC 4 script (88% 圧縮) |
| B (中) | 2 件 (OWN-PRE-PHASE2-W5 + 本 card) | trigger 連携で半自動化候補 | OWN-W5-PROD-ACK |
| C (低) | 7 件 | 手動継続 | OWN-OG-PROD-ACK / CARD A-D / OWN-PRE-XX 一部 |

本 card は B 分類の第 2 弾、Phase 2 W5 stage 3 production deploy + Owner formal ack の **半自動化境界線** を明示する役割を持つ。OWN-PRE-PHASE2-W5 と並ぶ 1 min 圧縮代表例。

---

## 10. post-condition

- Owner が `#prj-019-launch` channel に `ACK-W5-PROD` thread reply 完了
- Web-Ops が ack permalink を取得し pin 化 (Phase 2 完遂議決 evidence 候補)
- Web-Ops が Dev-RR/SS に 6/4 09:01 stage 3 promote 着手 GO の Slack DM 送信
- Dev-RR/SS が 6/4 09:01 staging → production promote 着手準備完了
- Phase 2 完遂議決 (DEC-019-079 候補) の audit trail に ACK-W5-PROD permalink 追記
- launch day 6/19 まで 15 day production soak window 開始

---

## 11. 関連 DEC

- DEC-019-054（production deploy gate / 本 card は W5 stage 3 production deploy 時の gate 通過 marker）
- DEC-019-075（Phase 1 完遂宣言起案 / Phase 2 W5 着手 trigger 4 条件 / 本 card は W5 stage 3 段階の最終 ack）
- DEC-019-077 DRAFT（Owner 拘束 76% 圧縮 default 化 / 本 card は 1 min 圧縮の代表例 = OWN-OG-PROD-ACK + OWN-PRE-PHASE2-W5 と並ぶ第 3 弾）
- DEC-019-079 候補（Phase 2 完遂議決起案 / 本 card permalink を audit trail に pin 化）

---

## 12. 関連リンク

- 親計画 (R26 stage 2 readiness): `projects/PRJ-019/reports/web-ops-m-r26-og-stage-2-deploy-ready.md`
- 関連計画 (R25 Phase 2 W5 deploy 計画): `projects/PRJ-019/reports/web-ops-l-r25-phase-2-w5-deploy-plan.md`
- 連動 owner action: `projects/PRJ-019/owner-action-cards/own-pre-phase2-w5.md`（Round 25 Web-Ops-L、19 番目）
- 連動 owner action: `projects/PRJ-019/owner-action-cards/own-og-prod-ack.md`（Round 24 Web-Ops-K、18 番目）
- launch readiness: `projects/COMPANY-WEBSITE/runbooks/launch-readiness-consolidation-2026-06-19.md`
- INDEX: `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md`（19 件 → 20 件に更新候補）

---

## 13. 19 件 → 20 件 INDEX 更新案

INDEX.md §1 lookup 表に下記行を追加（実 INDEX 改変は Round 28 で実施、本 card 起票時は提案のみ）:

```
| OWN-W5-PROD-ACK | Phase 2 W5 stage 3 production deploy ack | 2026-06-04 09:00 (任意 6/4-6/9) | 1 min | [own-w5-prod-ack.md](own-w5-prod-ack.md) | TODO |
```

合計所要 82 min → 83 min（+1 min、本 card は Phase 2 W5 stage 3 production deploy 直前のみ）。

---

**最終更新**: 2026-05-05 (Round 27 / Web-Ops-N 起票)
**次回見直し**: 2026-06-04 09:00 (Phase 2 W5 stage 3 production deploy ack 取得直前) / 2026-06-09 (任意 timing 上限)

EOF
