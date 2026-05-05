# GTC-7 prep card: stage 3 即時実行 trigger 直前 prep (R30 Web-Ops-Q 引継用)

**対象**: Owner（hironori555@gmail.com）+ Web-Ops-Q (R30)
**所有者**: Web-Ops 部門 / Round 29 Web-Ops-P 起票
**バージョン**: v1.0（Round 29 / Owner action card 22 件目候補 / GTC-7 trigger 直前 prep）
**親計画**: `projects/PRJ-019/reports/web-ops-p-r29-stage-3-immediate-spec.md`
**位置付け**: 20 件物理化済 Owner action card に **22 番目** として追加候補（GTC-7 trigger 直前 prep / Owner 拘束 1 min = OWN-W5-PROD-ACK 連動）

---

## 0. 目的

Phase 2 W5 即時実行版 stage 3 (production deploy) 着手 = **GTC-7 trigger 直前** に Web-Ops-Q が確認すべき 5 軸 prep を card 化。GTC-6 GO YES 確定 (R29) 直後即時 trigger を可能にするため、Owner ack (OWN-W5-PROD-ACK / 1 min) + 9 step + soak 2h + 4 PIN 体系完成 + 6 種異常 fallback の 5 軸を T+0 ~ T+11 (ack 取得まで 11 min) で完了させる prep card。

---

## 1. 何を

GTC-7 trigger 直前に Web-Ops-Q が下記 5 軸を確認、Owner は OWN-W5-PROD-ACK 1 min reply のみ:

1. **R29 stage 3 即時実行 spec read** (Web-Ops-Q / 5 min)
2. **OWN-W5-PROD-ACK 取得** (Owner 1 min + Web-Ops 30 sec)
3. **GTC-6 完遂 evidence link 確認** (Web-Ops-Q / 1 min)
4. **rollback 経路 3+4 trigger #8-#11 採否判断 spec read** (Web-Ops-Q / 2 min)
5. **production deploy 9 step + soak 2h + 4 PIN 体系完成 spec confirm** (Web-Ops-Q / 3 min)

---

## 2. なぜ

- GTC-7 = stage 3 production deploy = 6/19 launch day production rollout への最終 path
- 「日付決め打ちなし / 完成次第即時 GO」方針で cron schedule 拘束撤廃 → trigger 即時化必要 = prep card 化で readiness 確保
- Owner 拘束 1 min (OWN-W5-PROD-ACK) は維持 = directive 整合性
- Web-Ops-Q が R30 でこの prep card を読めば即起票可能

---

## 3. 所要時間

- Web-Ops-Q: 11 min (5 軸 prep + ack 取得待機)
- **Owner: 1 min** (OWN-W5-PROD-ACK reply のみ / 20 件目 card と連動)

---

## 4. いつ

GTC-6 GO YES 確定 (R29 stage 1+2 actual record §8 で 25/25 PASS) 直後即時 trigger。日付決め打ちなし。

---

## 5. 詳細手順 (T+0 = GTC-6 完遂直後)

### 5.1 Web-Ops-Q (R30 担当)

```
T+0  -  T+5  : R29 stage 3 immediate spec read (§1-§4 + §6)
T+5  -  T+6  : Slack #prj-019-launch に OWN-W5-PROD-ACK ack 取得依頼 post
              (production URL + GTC-6 PASS evidence link + soak 0 件 link)
T+6  -  T+10 : Owner ack 待機
T+10 -  T+11 : Owner `ACK-W5-PROD` reply 受信 + permalink 取得 + pin 化 + Dev DM
T+11 -  T+98 : stage 3 production deploy 9 step 実機 (R30 Web-Ops-Q 担当)
T+98 -  T+218: production soak 2h 監視
T+218 - T+250: actual record 起票 + Slack post + R31 引継
```

### 5.2 Owner (OWN-W5-PROD-ACK 連動)

- T+5 で Slack ack 依頼 post 通知到達
- T+10 までに `ACK-W5-PROD` thread reply 入力 + send (1 min)
- 詳細: `own-w5-prod-ack.md` (20 件目)

---

## 6. 失敗時の fallback

| symptom | fallback | 想定時間 |
|---|---|---|
| Owner ack 取得 5 min 超過 | T+10 → T+30 まで slip + readiness link 再 post | +20 min |
| Owner NO 判断 | stage 3 中止 + CEO 経由懸念解消 + Round 31+ slip | 1+ round delay |
| Owner unreachable (Slack 未読) | T+30 まで待機 → メール直送 → T+60 まで → 翌 round slip | up to 60 min slip |
| GTC-6 GO YES 不成立 (R29 失敗) | GTC-7 prep 起動せず + R29 異常 fallback 適用 | 状況依存 |
| 4 PIN 体系完成失敗 | rollback trigger #10-#11 (経路 4 / PIN-A) 採否判断 | 状況依存 |

---

## 7. 完了 marker

| 軸 | 完了条件 |
|---|---|
| 1. spec read | Web-Ops-Q が R29 stage 3 immediate spec §1-§4 + §6 read |
| 2. OWN-W5-PROD-ACK | ack 文言 `ACK-W5-PROD` + permalink + Web-Ops :white_check_mark: |
| 3. GTC-6 evidence | `web-ops-p-r29-stage-1-2-actual-record.md` link 動作 |
| 4. rollback prep | trigger #8-#11 採否判断 spec confirm |
| 5. 9 step + soak + 4 PIN | R29 stage 3 immediate spec §4 + §2.2 + 4 PIN 体系 spec confirm |

5 軸全 OK = GTC-7 trigger 即時開始 (T+11 → stage 3 9 step 実機着手)

---

## 8. 関連 card / report

- 親計画: `projects/PRJ-019/reports/web-ops-p-r29-stage-3-immediate-spec.md`
- 連携 card:
  - `own-w5-prod-ack.md` (20 件目 / OWN-W5-PROD-ACK 連動)
  - `gtc-6-completion.md` (21 件目候補 / GTC-6 完遂 marker)
- R30 actual 起票時 evidence: `web-ops-q-r30-stage-3-actual-record.md` (R30 起票予定)
- rollback prep: `web-ops-o-r28-rollback-real-exec-prep.md` (trigger #8-#11)

---

## 9. R30 Web-Ops-Q 起票 template (本 prep card 連動)

```markdown
# Web-Ops-Q Round 30 — stage 3 即時実行 actual record

## §0 Executive Summary
[GTC-7 GO YES/NO + deviation 数値 + 4 PIN 体系完成]

## §1 GTC-7 trigger 即時実行 timeline 5 phase actual
[T+0 ~ T+250 actual]

## §2 OWN-W5-PROD-ACK 取得 actual
[ack 文言 + permalink + 経過時刻]

## §3 stage 3 9 step actual
[T+11 ~ T+98 / 9 step 全]

## §4 production soak 2h 5 軸 actual
[T+98 ~ T+218 / 64 events 0 異常想定]

## §5 rollback trigger #8-#11 採否判断 + 実施記録
[R28 prep §4-§5 / R29 record §1.1 引継]

## §6 異常 fallback 適用 (異常 0 件想定)
[R29 stage 3 spec §5.1 6 種]

## §7 deviation 集約
[R28 prep + R27 simulated との 7 軸計算]

## §8 GTC-7 GO YES 判定
[R29 stage 3 spec §7 5 軸 PASS]

## §9 Round 31 引継
[3 件引継]
```

---

## 10. 備考

- 本 card は Owner 1 min (OWN-W5-PROD-ACK 連動) + Web-Ops-Q 11 min prep で GTC-7 trigger 即時化
- INDEX.md (20 件) 統合化済への 22 件目候補として登録 spec 化検討中 (R30+ 議決)
- GTC-6 → GTC-7 1 round 圧縮実装第 1 弾

---

**最終更新**: 2026-05-06 (Round 29 / Web-Ops-P 起票)
**状態**: TODO (R29 GTC-6 GO YES 確定後、R30 Web-Ops-Q 起動時に本 card 適用開始)

EOF
