# PRJ-019 Round 31 Dev-KKK — mode='live' switch spec

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-KKK (Round 31 9 並列の 5 軸目)
- 起票日: 2026-05-06
- 連動: DEC-019-080 / DEC-019-081 / GTC-7 / runsheets/w6a-production-rollout-sop.md §3.4 / R30 Dev-HHH 着地

---

## 1. 目的

R30 Dev-HHH が物理化した W6 実 wire (canary-vercel-wire / alert-router-real-wire) は
`mode: 'live' | 'dry-run' | 'mock'` を持つが、`live` の発火は Owner の
GTC-7 trigger Owner ACK marker (`OWN-W5-PROD-ACK`) 受領を厳守する必要がある。
本 spec は **append-only env-gate wrapper** を導入し、

- `VERCEL_PROD === 'true'` AND
- `OWN_W5_PROD_ACK === 'received'`

の二重 gate を満たす場合のみ要求 mode='live' を維持し、不通過時は自動で
`dry-run` に downgrade する pure 関数 + factory wrapper を実装する。

---

## 2. 実装 (append-only)

### 2.1 canary-vercel-wire.ts (R30 既存 135 行 → +73 行 append)

新規 export:
- `type ModeLiveEnv = { VERCEL_PROD?, OWN_W5_PROD_ACK? }`
- `type ResolvedMode = { effective: WireMode; downgradeReason?: 'env-not-prod' | 'owner-ack-pending' }`
- `function resolveModeWithEnv(requested, env): ResolvedMode` — pure / 副作用 0
- `function createVercelEdgeConfigWriterWithEnvGate(options, env): { writer, resolved }`

R30 既存 `createVercelEdgeConfigWriter` 本体は absolute 不変
(line 1〜135 完全保存 / append-only にて line 136 以降に追加)。

### 2.2 alert-router-real-wire.ts (R30 既存 191 行 → +51 行 append)

新規 export:
- `type DispatcherEnv`
- `type ResolvedDispatcherMode`
- `function resolveDispatcherModeWithEnv(requested, env)`
- `function createRealChannelDispatcherWithEnvGate(opts, env)`

R30 既存 `createRealChannelDispatcher` 本体は absolute 不変。

---

## 3. 振る舞い行列

| 要求 mode | VERCEL_PROD | OWN_W5_PROD_ACK | 実効 mode | downgradeReason |
|----------|------------|------------------|-----------|------------------|
| mock     | (任意)      | (任意)            | mock      | -                |
| dry-run  | (任意)      | (任意)            | dry-run   | -                |
| live     | undef/false | (任意)            | dry-run   | env-not-prod     |
| live     | 'true'     | undef/その他      | dry-run   | owner-ack-pending |
| live     | 'true'     | 'received'        | live      | -                |

---

## 4. GTC-7 Owner ACK 連動

GTC-7 trigger の Owner ACK marker `OWN-W5-PROD-ACK` 受領時、
runsheet が `OWN_W5_PROD_ACK=received` を環境変数に設定し、初めて `live` が
発火可能になる。それまでは要求 mode='live' でも自動 downgrade で
dry-run path のみ動く (実 API call $0 厳守継承)。

env-gate は pure 関数のため、`OWN_W5_PROD_ACK` 未設定の任意 phase で
`createVercelEdgeConfigWriterWithEnvGate` / `createRealChannelDispatcherWithEnvGate`
を呼び出しても network 0 件 (R30 dry-run path 移譲)。

---

## 5. test 網

- `edge-config-canary-mode-live.test.ts` 8 case
- `alert-router-mode-live.test.ts` 8 case
- `probes-actual-exec.test.ts` 7 case (Task 3 連動)
- 計 +21〜+23 case → harness 924 → 945+ 想定 PASS

---

## 6. 厳守項目

- R30 既存 6 file (canary helper / health 4 / alert-router) mtime 不変継承
- R30 wire 2 file は append-only (既存 line 1〜N 完全保存)
- 実 API call 0 件 (test は全て fetcher / send 注入)
- 物理 deploy 0 件 / TS6059 0 件継承
- DEC 本体 absolute 4 file + sec yml 12 file md5 不変

---

## 7. R32 引継

- W7-A KPI dashboard wire (Dev-LLL 連動) — env-gate を共有 helper 化検討
- post-launch 30day spec の長期観測点に env-gate 解除 audit を組込
