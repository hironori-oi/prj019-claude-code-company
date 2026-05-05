# OWN-PRE-PHASE2-W5: Phase 2 W5 着手 6/3 直前 Owner ack 取得カード

**対象**: Owner（hironori555@gmail.com）
**所有者**: Web-Ops 部門 / Round 25 Web-Ops-L 起票
**バージョン**: v1.0（Round 25 / **19 番目** Owner action card）
**親計画**: `projects/PRJ-019/reports/web-ops-l-r25-phase-2-w5-deploy-plan.md`（Round 25 Web-Ops-L 起票、Phase 2 W5 着手 6/3 連動 deploy 計画）
**位置付け**: 18 件物理化済 Owner action card（CARD A〜D + OWN-PRE-01〜07 + OWN-AUTO + OWN-AUTO PoC 4 script + OWN-PRE-DRY-RUN + OWN-OG-PROD-ACK）に **19 番目** として追加

---

## 0. 目的

Phase 2 W5 着手 = 2026-06-03 (火) 09:00 JST の **直前** = 6/2 (月) 18:00 JST までに、Owner から Phase 2 W5 着手 GO の formal ack を **1 min 以内** で取得する。Phase 2 W5 着手は DEC-019-075 ⑥ trigger 4 条件 satisfied に基づき自動 GO 想定だが、production rollout への path を Phase 2 W5 で開始する以上、Owner の formal directive を 1 行で取得する SOP 化を本 card で確立。

OWN-PRE-XX 系 7 card / OWN-OG-PROD-ACK との違い:
- OWN-PRE-01〜07 = 6/12 D-7 までに完了する **環境設定 ack**（10-15 min/件）
- OWN-OG-PROD-ACK = 6/12 D-7 step 12 開始直前の **production rollout ack**（1 min 以内）
- OWN-PRE-PHASE2-W5 = 6/3 Phase 2 W5 着手直前の **Phase 2 着手 GO ack**（1 min 以内）

---

## 1. 何を

Phase 2 W5 着手 6/3 09:00 JST の **前日 18:00 JST まで** に、Owner が Round 25 Phase 1 完遂状態 + Phase 2 W5 deploy 計画概要を確認した上で `#prj-019-launch` channel に **`ACK-PHASE2-W5`** と返信する。Web-Ops は permalink を pin 化、Dev-RR/SS に 6/3 09:00 stage 1 着手 GO を Slack DM で通知する。

ack 文言: `ACK-PHASE2-W5`（OWN-PRE-XX `done` / OWN-OG-PROD-ACK `ACK-PROD` とは区別）

---

## 2. なぜ

- Phase 2 W5 着手 = main code alias 化完遂 (Dev-PP R24) + cross-orchestrator 統合 e2e (Dev-RR/SS R25) + cross-package 拡張第 1 弾 = **production rollout への path 開始**
- DEC-019-075 ⑥ trigger 4 条件 satisfied の自動 GO 想定だが、Owner 知覚 + formal directive を 1 行で取得する SOP 化が必要
- Phase 2 W5 deploy 計画 (Web-Ops-L R25) は production deploy 任意化済 (stage 3 = 6/4 以降)、stage 1+2 着手の Owner ack のみ取得
- ACK-PHASE2-W5 permalink は Phase 2 完遂 audit trail (DEC-019-079 候補) に pin 化、Phase 2 完遂議決 evidence 化

---

## 3. 所要時間

**1 min 以内**（Phase 2 W5 deploy 計画の事前 read 想定、本 card は最終確認のみ）

内訳:
- Slack notification 確認: 10 sec
- Phase 2 W5 deploy 計画 §0 + §1 概要再確認: 30 sec
- `ACK-PHASE2-W5` 返信入力 + 送信: 20 sec

---

## 4. 期限

2026-06-02 (月) 18:00 JST（Phase 2 W5 着手 6/3 09:00 の前日 18:00、3 min 圧縮設計の上限）

事前確認期限: 2026-06-02 17:30 JST まで（Web-Ops が Phase 2 W5 deploy 計画 §0+§1 概要を Slack post）

---

## 5. pre-condition

- [ ] Phase 1 完遂判定 Y 無条件 (PM-Q R24 7 軸 47/49 OK)
- [ ] Round 24 統合採決 4 件まとめ採択 (DEC-019-074 + 075 + 076 + 077、5/19 採決完遂)
- [ ] Phase 2 W5 着手 trigger 4 条件 satisfied (DEC-019-075 ⑥)
- [ ] Phase 2 W5 deploy 計画 (Web-Ops-L R25 起票) Slack post 済 (6/2 17:30 まで)
- [ ] Dev-RR/SS が cross-orchestrator 統合 e2e PR 準備済 (6/2 18:00 までに draft PR 作成)
- [ ] PIN-pre-W5 staging hash 取得済 (6/2 18:00 staging build 完遂時点)

---

## 6. 実行 step（3 step）

1. **Slack 通知確認**: クリック先 `Slack #prj-019-launch channel` / 入力値 -（受動受信） / 期待表示 `Web-Ops からの "@owner Phase 2 W5 着手 6/3 09:00 GO ack お願いします" post（Phase 2 W5 deploy 計画 §0+§1 概要 + Round 25 完遂状態 + DEC-074-077 採択結果埋込済）`
2. **Phase 2 W5 概要再確認**: クリック先 -（事前 read 済前提で thread 内 Web-Ops 投稿の §0+§1 のみ目視） / 入力値 - / 期待表示 `【判断頂きたい点】 Phase 2 W5 着手 6/3 09:00 stage 1 preview deploy 開始可否 / YES なら ACK-PHASE2-W5 と返信ください / 確認所要 1 min を想定しています が表示`
3. **ACK-PHASE2-W5 返信投稿**: クリック先 `thread reply text box` / 入力値 `ACK-PHASE2-W5` / 期待表示 `自分の thread reply が channel に表示、Web-Ops の :white_check_mark: reaction 即時付与`

---

## 7. 想定所要時間 breakdown

| 段階 | 想定時間 | 内容 |
|---|---|---|
| step 1 Slack 確認 | 0:10 | mention 通知から channel 移動 |
| step 2 §0+§1 再確認 | 0:30 | Phase 1 完遂状態 + Phase 2 W5 着手 trigger + deploy 計画 3 段階の概要 |
| step 3 返信入力 | 0:15 | `ACK-PHASE2-W5` 14 文字入力 + send |
| step 3 reaction 確認 | 0:05 | Web-Ops :white_check_mark: 確認 |
| **合計** | **1:00** | **1 min 以内達成** |

---

## 8. fallback

| symptom | fallback | 想定時間 |
|---|---|---|
| Owner が Phase 2 W5 deploy 計画事前 read 未完 | 6/2 18:00 ack 取得を 6/3 08:00 に slip、Owner が deploy 計画 §0+§1 full read | +14h delay (許容、stage 1 着手 09:00 影響 0) |
| Owner が ACK-PHASE2-W5 ではなく ACK-W5 と投稿 | Web-Ops が thread reply で marker 確認返信 + stage 1 着手継続 (formal ack として両 marker 受容) | 0 |
| Owner が NO 判断 | stage 1 着手中止、CEO 経由で Owner 懸念解消 + 翌日 6/3 18:00 まで再 ack 待機 → 6/4 着手検討 | 1 day delay |
| Owner unreachable (Slack 未読等) | 6/2 19:00 まで待機 → メール直送 (hironori555@gmail.com) + 21:00 まで待機 → 6/3 朝 7:00 まで slip | up to 13h delay |
| trigger 4 条件 1 件 unsatisfied 検知 | stage 1 着手 hold + Round 26 で trigger 再評価 + Phase 2 W5 着手 1 week slip 検討 | 1 week delay (worst case) |

---

## 9. 自動化候補度

### 9.1 自動化可否評価

**自動化候補度: B (中)**

| 軸 | 評価 | 理由 |
|---|---|---|
| 機械実行可否 | NO | Owner formal judgement 任意 (DEC-019-075 trigger 自動 GO は法的に有効、本 card は Owner 知覚補強) |
| Owner 判断介在 | YES | YES/NO は Owner 判断 (trigger 自動でも Owner override 権あり) |
| 副作用 | NO | Phase 2 W5 stage 1 = preview deploy のみ、production 影響 0 |
| 4 eyes 原則 | YES | Owner + Web-Ops + Dev (RR/SS) の 3 eyes 体制 |

### 9.2 自動化可能な周辺領域

本 card 自体は中度に自動化可能 (B = trigger 自動 GO 経路の併存):
- Slack notification 自動 post (Web-Ops が deploy 計画 §0+§1 を webhook 経由で post = R26 候補)
- ACK-PHASE2-W5 受信検知 → Dev-RR/SS への DM 自動送信 (R26 候補)
- trigger 4 条件 自動評価 (DEC-019-075 ⑥ の機械判定 PoC = R27 候補、満足時 ACK-PHASE2-W5 自動投稿候補化)

### 9.3 19 番目 card としての位置付け

| 分類 | card 数 | 自動化候補度 | 例 |
|---|---|---|---|
| A (高) | 11 件 | 自動化済 / 候補 | OWN-AUTO PoC 4 script (88% 圧縮) |
| B (中) | 1 件 (本 card) | trigger 連携で半自動化候補 | OWN-PRE-PHASE2-W5 |
| C (低) | 7 件 | 手動継続 | OWN-OG-PROD-ACK / CARD A-D / OWN-PRE-XX 一部 |

本 card は B 分類の代表例、Phase 2 W5 着手 trigger 自動 GO + Owner formal ack の **半自動化境界線** を明示する役割を持つ。

---

## 10. post-condition

- Owner が `#prj-019-launch` channel に `ACK-PHASE2-W5` thread reply 完了
- Web-Ops が ack permalink を取得し pin 化 (Phase 2 完遂議決 evidence 候補)
- Web-Ops が Dev-RR/SS に 6/3 09:00 stage 1 着手 GO の Slack DM 送信
- Dev-RR/SS が 6/3 09:00 stage 1 preview deploy 着手準備完了
- Phase 2 完遂議決 (DEC-019-079 候補) の audit trail に ACK-PHASE2-W5 permalink 追記

---

## 11. 関連 DEC

- DEC-019-075（Phase 1 完遂宣言起案 / Phase 2 W5 着手 trigger 4 条件 / 本 card は trigger satisfied 時の Owner ack 取得 SOP）
- DEC-019-077 DRAFT（Owner 拘束 76% 圧縮 default 化 / 本 card は 1 min 圧縮の代表例 = OWN-OG-PROD-ACK と並ぶ第 2 弾）
- DEC-019-079 候補（Phase 2 完遂議決起案 / 本 card permalink を audit trail に pin 化）

---

## 12. 関連リンク

- 親計画: `projects/PRJ-019/reports/web-ops-l-r25-phase-2-w5-deploy-plan.md`（Round 25 Web-Ops-L、Phase 2 W5 deploy 計画）
- 連動 owner action: `projects/PRJ-019/owner-action-cards/own-og-prod-ack.md`（Round 24 Web-Ops-K、18 番目）
- launch readiness: `projects/COMPANY-WEBSITE/runbooks/launch-readiness-consolidation-2026-06-19.md`
- INDEX: `projects/COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md`（18 件 → 19 件に更新候補）

---

## 13. 18 件 → 19 件 INDEX 更新案

INDEX.md §1 lookup 表に下記行を追加（実 INDEX 改変は Round 26 で実施、本 card 起票時は提案のみ）:

```
| OWN-PRE-PHASE2-W5 | Phase 2 W5 着手 6/3 直前 GO ack | 2026-06-02 18:00 | 1 min | [own-pre-phase2-w5.md](own-pre-phase2-w5.md) | TODO |
```

合計所要 81 min → 82 min（+1 min、本 card は Phase 2 W5 着手前のみ）。

---

**最終更新**: 2026-05-05 (Round 25 / Web-Ops-L 起票)
**次回見直し**: 2026-06-02 (Phase 2 W5 着手前日 18:00 ack 取得直前) / 2026-06-03 09:00 (stage 1 着手連動確認)

EOF
