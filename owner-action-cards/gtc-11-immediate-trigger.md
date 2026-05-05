# Owner Action Card: GTC-11 Immediate Trigger (D-Day)

**作成日**: 2026-05-06 (PRJ-019 Round 31, Web-Ops-R)
**target trigger**: GTC-11 (Open Claw Clawbridge GA full production rollout)
**Owner action 累計**: 7-10 min (本 card で詳細 step 化)
**前提**: OWN-W5-PROD-ACK 完了済 / D-Day GO reply 受領で発火

---

## 0. Owner action 累計内訳 (7-10 min)

| step | action | 必須/任意 | duration |
|------|--------|-----------|----------|
| S-1 | OWN-W5-PROD-ACK | 必須 (済) | 1 min |
| S-2 | D-7 readiness 確認 (任意) | 任意 | 0-1 min |
| S-3 | D-1 共同 sign | 必須 | 1 min |
| S-4 | D-Day GO reply | 必須 | 1 min |
| S-5 | 立会 manual gate × 5 | 必須 | 5 min (連続でない) |
| buffer | 余裕 | - | 0-1 min |

**累計**: 7 min (最小) 〜 10 min (上限)

---

## 1. Step 1: OWN-W5-PROD-ACK (1 min, 済想定)

**実施内容**: 既存 own-w5-prod-ack.md / own-w5-prod-ack-execution.md card で完遂済
**確認**: dashboard 【最新】marker で OWN-W5-PROD-ACK GREEN 確認
**Owner action**: 完了済 → スキップ可

---

## 2. Step 2: D-7 readiness 確認 (任意, 0-1 min)

**timing**: D-Day の 7 日前 (T0-7d)
**実施内容**:
- gtc-11-pre-ack-readiness.md card 内容を Owner が目視
- canary writer + dispatcher 注入確認
- KPI dashboard 5 軸 baseline 値 (simulated) 確認
- abort gate 4 種 / manual gate 5 件 spec 確認

**Owner action**:
1. card open (10 sec)
2. readiness 5 項目 visual scan (30 sec)
3. (任意) Web-Ops-R に質問 / clarification reply (20 sec)

**所要**: 0 min (skip 可) 〜 1 min (full review)

---

## 3. Step 3: D-1 共同 sign (1 min)

**timing**: D-Day 前日 (T0-1d)
**実施内容**:
- gtc-11-completion-flow.md (既存 card) と本 card を共同 sign
- 立会 manual gate 5 件の slot (T0, T0+15m, T0+45m, T0+105m, T0+285m) 確認
- D-Day GO reply の文言 template 確認

**Owner action**:
1. card open (10 sec)
2. 5 slot 確認 (20 sec)
3. GO reply template 確認 (20 sec)
4. sign reply 送付 (10 sec)

**所要**: 1 min

---

## 4. Step 4: D-Day GO reply (1 min)

**timing**: D-Day T0 - 数分前
**実施内容**:
- D-1 sign 後の D-Day 時刻に Owner が "GO" reply を送付
- これが trigger となり Phase 1 pre-flight 起動
- reply 受領後、dispatcher が 7 phase 84 項目を 285 min かけて progressive 実行

**Owner action**:
1. reply send (text: "GO" or template 文言) (30 sec)
2. dispatcher 起動 acknowledge 受領 (30 sec)

**所要**: 1 min

**reply template**:
```
GTC-11 GA progression: GO.
T0 = <YYYY-MM-DD HH:MM JST>
立会 slot: T0, T0+15m, T0+45m, T0+105m, T0+285m (各 1 min)
```

---

## 5. Step 5: 立会 manual gate × 5 (累計 5 min)

各 1 min / 連続でない / dispatcher が PASS 集計済の sign のみ。

| MG | timing | sign 内容 | 確認 cell |
|----|--------|-----------|-----------|
| MG-1 | T0 (GO reply 直後 〜 5min) | "Phase 2 canary 5% START OK" | Phase 1 pre-flight 12/12 |
| MG-2 | T0+15m | "Phase 3 canary 25% START OK" | Phase 2 12/12 + abort 4/4 green |
| MG-3 | T0+45m | "Phase 4 canary 50% START OK" | Phase 3 12/12 |
| MG-4 | T0+105m | "Phase 5 GA 100% START OK" | Phase 4 12/12 |
| MG-5 | T0+285m | "GTC-11 GA 100% 完遂着地 OK" | Phase 5 12/12 + KPI 5 軸 final |

---

## 6. 7 hour 6 phase mapping (Owner 視点)

| 時間 | Phase | Owner action | 累計時間 |
|------|-------|--------------|----------|
| T0-7d | (D-7 任意) | S-2 (0-1 min) | 0-1 min |
| T0-1d | (D-1 sign) | S-3 (1 min) | 1-2 min |
| T0-5min | (D-Day GO reply) | S-4 (1 min) | 2-3 min |
| T0 | Phase 1→2 | MG-1 (1 min) | 3-4 min |
| T0+15m | Phase 2→3 | MG-2 (1 min) | 4-5 min |
| T0+45m | Phase 3→4 | MG-3 (1 min) | 5-6 min |
| T0+105m | Phase 4→5 | MG-4 (1 min) | 6-7 min |
| T0+285m | Phase 5→6 | MG-5 (1 min) | 7-8 min |
| T0+330m | (任意 Phase 6 立会) | (任意 0-1 min) | 7-9 min |
| Phase 7 closure | (sign のみ) | (任意 0-1 min) | 7-10 min |

**Owner 拘束 累計**: 7 min (最小, S-2/Phase 6/7 立会 skip) 〜 10 min (上限, 全項目 full)

---

## 7. abort 発火時の Owner action (例外時のみ)

abort gate 4 種が発火した場合:

| trigger | 自動 action | Owner action |
|---------|-------------|--------------|
| AG-1 (latency急増) | 経路 1 即時 rollback | 通知受領のみ (0 min, escalation 任意) |
| AG-2 (error spike) | 経路 1 即時 rollback | 通知受領 + post-mortem sign 任意 (0-1 min) |
| AG-3 (availability dip) | 経路 1 即時 rollback | 通知受領 (0 min) |
| AG-4 (cost burn) | 経路 3 + alert | 通知受領 + budget review 任意 (0-1 min) |

abort 発火 0 件想定下では Owner 追加拘束なし。

---

## 8. 副作用 0 / 物理 deploy 0 / $0 確認 (Owner 視点)

| 項目 | 確認方法 |
|------|----------|
| 副作用 0 | 本 card 単体で physical deploy 起動なし。GO reply 受領が trigger |
| 物理 deploy 0 (R31 時点) | R31 完遂時点では simulated record のみ。実 deploy は GO reply 受領後 |
| API call $0 (R31 時点) | canary writer + dispatcher 注入で recording 経由 |

---

## 9. 関連 card / file

- 既存: `own-w5-prod-ack.md`, `own-w5-prod-ack-execution.md` (S-1)
- 既存: `gtc-11-pre-ack-readiness.md` (S-2)
- 既存: `gtc-11-completion-flow.md` (S-3 / S-4 共同 sign)
- 本 card: `gtc-11-immediate-trigger.md` (S-1〜5 統合)
- 関連 spec: `web-ops-r-r31-gtc-11-exec-runsheet.md` (7 phase 84 項目)

---

(終端)
