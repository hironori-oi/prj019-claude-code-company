# OWN-W5-PROD-ACK execution: stage 3 trigger 当日実機実行手順 (R30 物理化版)

**対象**: Owner（hironori555@gmail.com）+ Web-Ops-Q (R30) / Web-Ops-R (R31+)
**所有者**: Web-Ops 部門 / Round 30 Web-Ops-Q 起票
**バージョン**: v1.0（Round 30 / Owner action card 22 件目候補 / OWN-W5-PROD-ACK 当日実機実行手順 物理化版）
**親計画**: `projects/PRJ-019/reports/web-ops-q-r30-stage-3-execution-runsheet.md` + `projects/PRJ-019/owner-action-cards/own-w5-prod-ack.md`（20 件目 / spec 版）
**位置付け**: 20 件物理化済 + GTC-6 完遂 marker (21 件目候補) に **22 番目** として追加候補（OWN-W5-PROD-ACK 当日実機実行手順 物理化 / Owner 拘束 1 min）

---

## 0. 目的

R29 Web-Ops-P spec (own-w5-prod-ack.md / 20 件目 / 184 行) を継承し、**当日実機実行手順** を物理化。GTC-7 trigger 直後即時 (T+5 → T+11 = 6 min window) に Owner が 1 min 4 step ACK-W5-PROD marker を Slack thread reply として投下できる状態を物理化、Web-Ops-Q (R30) / Web-Ops-R (R31+) が runsheet 1 file を読みながら ack 取得経路を即時起動できる base file として位置付ける。

OWN-W5-PROD-ACK card (20 件目) との違い:
- 20 件目 (own-w5-prod-ack.md) = **spec 版**（calendar-based / 6/4-6/9 任意 / 1 min spec 化）
- **本 card (22 件目候補) = 当日実機実行版**（date-free / GTC-7 trigger 直後即時 / R30 runsheet integration / 4 step physical 実行手順）

---

## 1. 何を

GTC-7 trigger 直後即時 (T+5) に Web-Ops-Q が Slack #prj-019-launch に ack 依頼 post 投下 → Owner が T+10 までに `ACK-W5-PROD` thread reply 入力 + send (1 min) → Web-Ops-Q が permalink + pin + Dev DM (T+11 即時) の 4 phase で完遂。

ack 文言: `ACK-W5-PROD`（11 文字 / 20 件目 spec 整合）

---

## 2. なぜ

- GTC-7 trigger = stage 3 production deploy 起動 = production rollout の最終段階 = Owner formal ack 必須 (DEC-019-054 production deploy gate)
- 「日付決め打ちなし / 完成次第即時 GO」方針で cron schedule 拘束撤廃 → **当日実機実行手順** が必要
- 20 件目 spec (calendar-based) → 22 件目 当日実機実行版 (date-free) で実装の物理化
- Owner 拘束 1 min 維持 (directive 整合性)
- Web-Ops-Q が runsheet §3 Q1 を読みながら本 card で ack 取得経路を物理実行

---

## 3. 所要時間

- Web-Ops-Q: 6 min (T+5 → T+11 / Slack post + 待機 + permalink + pin + Dev DM)
- **Owner: 1 min** (T+10 → T+11 / `ACK-W5-PROD` thread reply input + send)

---

## 4. いつ

GTC-7 trigger 直後即時 (= R29 stage 1+2 actual 25/25 PASS = GTC-6 GO YES 確定後 + Owner directive 受領後)。日付決め打ちなし。R30 runsheet §3 Q1 で発火 timing 物理化済。

---

## 5. 詳細手順 (4 phase × 物理実行手順)

### 5.1 phase 1: Slack ack 依頼 post 投下 (Web-Ops-Q / T+5 → T+6)

**Web-Ops-Q 物理実行手順**:

```
1. R30 runsheet §3.1 Q1.1 read
2. Slack #prj-019-launch open
3. post 入力:
   "@owner Phase 2 W5 stage 3 production deploy ack お願いします
    - production URL: https://openclaw.app
    - GTC-6 PASS evidence: projects/PRJ-019/reports/web-ops-p-r29-stage-1-2-actual-record.md
    - staging soak 0 件 link: (Sentry / Vercel Analytics / DB pool dashboard URL)
    - ack 文言: ACK-W5-PROD
    - 想定所要: 1 min / 4 step
    Phase 2 W5 stage 3 production rollout の最終段階となります。"
4. send + permalink 取得 + Web-Ops 内 pin 化（一次）
```

**期待表示**: post 表示 + permalink 取得 + Owner mention 通知到達

**fallback**:
- post 失敗 → 5 min 内 retry / メール直送 (hironori555@gmail.com)

---

### 5.2 phase 2: Owner Slack 通知到達 + 内容確認 (Owner / T+6 → T+10)

**Owner 物理動作**:

```
1. Slack 通知到達（mobile or desktop）
2. #prj-019-launch open + Web-Ops post read
3. evidence link 4 件 (production URL + GTC-6 PASS + soak 0 件 + ack 文言) 確認
4. judgement: YES (ACK) or NO (中止)
```

**Owner 想定所要**: 30 sec (内容確認のみ / 詳細 read は事前完了済前提)

**fallback**:
- Slack 未読 → T+30 まで待機 → メール直送 / T+60 まで → 翌日 slip

---

### 5.3 phase 3: Owner ACK-W5-PROD reply (Owner / T+10 → T+11)

**Owner 物理動作 (1 min 想定)**:

```
1. Slack #prj-019-launch thread reply text box click
2. `ACK-W5-PROD` 11 文字入力 (10 sec)
3. send button click (即時)
4. 自分の reply が thread に表示確認 (5 sec)
```

**期待表示**: `ACK-W5-PROD` thread reply 表示 + Owner sender + 11 文字

**fallback**:
- Owner が `ACK-PROD` 入力 (`ACK-W5-PROD` ではない) → Web-Ops thread reply で marker 確認 + 両 marker 受容で stage 3 着手継続
- Owner NO 判断 → stage 3 中止 + CEO 経由懸念解消 + Round 31+ slip
- Owner 1 min 超過 → T+30 まで slip + readiness link 再 post

---

### 5.4 phase 4: Web-Ops-Q permalink + pin + Dev DM (Web-Ops-Q / T+11)

**Web-Ops-Q 物理実行手順**:

```
1. Owner thread reply に :white_check_mark: reaction 即時付与
2. thread reply permalink 取得 + Web-Ops 内 pin 化（最終）
3. Dev-RR/SS DM:
   "stage 3 promote 着手 GO / OWN-W5-PROD-ACK permalink: {url}"
4. R30 runsheet §3.4 Q1.4 actual 記入 (permalink ____)
5. R30 runsheet §4 Q2 (stage 3 deploy 9 step) 着手準備完了
```

**期待表示**: reaction 付与 + permalink + pin + Dev DM 既読

**fallback**:
- Dev DM 未読 5 min 超 → CEO 経由 Dev 即応依頼 / Dev unreachable → stage 3 promote 待機

---

## 6. ack 取得記入 template (R30/R31 runsheet §3 Q1 連動)

| 軸 | 期待値 | 当日実機 actual 記入 |
|---|---|---|
| Web-Ops-Q post 経過時刻 | T+5 → T+6 | ____ |
| Owner Slack 通知到達 | T+6 → T+8 | ____ |
| Owner 内容確認 | T+8 → T+10 | ____ |
| Owner thread reply 入力 | T+10 → T+11 | ____ |
| ack 文言 | `ACK-W5-PROD` | ____ |
| permalink | Slack thread reply URL | ____ |
| Web-Ops :white_check_mark: 付与 | T+11 即時 | PASS / FAIL |
| Dev DM 送信 | T+11 即時 | PASS / FAIL |
| Dev DM 既読 | T+11+ | PASS / FAIL |
| Owner 拘束所要 | 1 min 以内 | ____ min |

---

## 7. 完了 marker (R30/R31 GTC-7 readiness 連動)

| 軸 | 完了条件 |
|---|---|
| 1. Web-Ops post 完了 | Slack permalink 取得 |
| 2. Owner ack 文言 | `ACK-W5-PROD` 11 文字 |
| 3. Web-Ops reaction | :white_check_mark: 即時付与 |
| 4. permalink + pin | Web-Ops 内 pin 化 |
| 5. Dev DM 既読 | Dev-RR/SS 即応 |
| 6. R30 runsheet 連携 | §3 Q1.1-Q1.4 全 PASS 記入 |

6 軸全 OK = OWN-W5-PROD-ACK execution DONE → GTC-7 即時 trigger 開始 (T+11 → stage 3 9 step 物理実行着手)

---

## 8. 関連 card / report

- 親計画: `projects/PRJ-019/reports/web-ops-q-r30-stage-3-execution-runsheet.md`（R30 runsheet §3 Q1）
- 連携 card:
  - `own-w5-prod-ack.md` (20 件目 / spec 版)
  - `gtc-6-completion.md` (21 件目候補 / GTC-6 完遂 marker)
  - `gtc-7-prep.md` (22 件目候補先行 / R29 起票 / 当 card と並列構造)
  - `gtc-7-completion.md` (23 件目候補 / R30 起票)
- 連携 report:
  - `web-ops-q-r30-stage-3-actual-record-simulated.md`（R30 simulated record）
  - `web-ops-q-r30-rollback-stage-3-spec.md`（R30 rollback 経路 4 spec）
- 関連 DEC: DEC-019-054 / DEC-019-068 v2 / DEC-019-077 / DEC-019-079

---

## 9. 制約遵守確認

| 制約 | 状態 |
|---|---|
| API 追加コスト $0 | OK (markdown のみ) |
| 副作用 0 | OK (spec + 物理化 / 実 ack 0) |
| 絵文字 0 | OK |
| Owner 拘束 0 min (本軸内) | OK (実 ack は GTC-7 trigger 後) |
| 20 件目 spec 整合 | OK (1 min / ACK-W5-PROD 文言維持) |
| R30 runsheet 連携 | OK (§3 Q1.1-Q1.4 連動) |

---

## 10. 備考

- 本 card は 20 件目 spec の **当日実機実行版** 物理化、22 番目候補として登録
- INDEX.md 更新は R31+ 議決後（21 + 22 + 23 件候補一括 atomic 採決想定）
- GTC-7 trigger 直後即時 (T+5 → T+11) の 6 min window で完遂可能 = 「完成次第即時 GO」方針実装第 2 弾

---

**最終更新**: 2026-05-06 (Round 30 / Web-Ops-Q 起票)
**状態**: TODO (R30 runsheet 起票後、GTC-7 trigger 起動時に本 card 適用開始)

EOF
