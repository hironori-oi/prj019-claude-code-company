# PRJ-019 Round 31 Dev-KKK — GTC-7 Owner ACK 連動 e2e test spec

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-KKK (Round 31)
- 起票日: 2026-05-06
- 連動: GTC-7 / OWN-W5-PROD-ACK / DEC-019-080 / DEC-019-081 / R30 Dev-HHH 着地

---

## 1. e2e の対象

GTC-7 trigger は W5→W6 phase 切替の最終 gate。Owner が `OWN-W5-PROD-ACK`
marker を受領すると、runsheet が以下 env を設定する:

```
VERCEL_PROD=true
OWN_W5_PROD_ACK=received
```

この瞬間に canary writer / alert dispatcher が `mode='live'` を真に発火する。
本 e2e は **その遷移 (dry-run → live) を mock 注入で完全検証** する。

---

## 2. e2e シナリオ

### S1: pre-ACK 状態 (W5 末期)

- `VERCEL_PROD=true`, `OWN_W5_PROD_ACK` 未設定
- 要求 mode='live'
- 期待: 実効 mode='dry-run' / downgradeReason='owner-ack-pending'
- 期待: fetcher / smtp 注入関数の呼出回数 = 0
- 期待: log event = `{ kind: 'success', mode: 'dry-run' }` (canary) /
        `{ kind: 'skip', mode: 'dry-run' }` (alert)

### S2: ACK 受領直後 (W6 開始)

- `VERCEL_PROD=true`, `OWN_W5_PROD_ACK=received`
- 要求 mode='live'
- 期待: 実効 mode='live'
- 期待: canary writer は PATCH https://api.vercel.com/v1/edge-config/.../items を 1 回発火
- 期待: alert dispatcher は slack webhook POST を 1 回発火
- 期待: 全 fetcher は test 注入 (実 network 0 件)

### S3: ACK 撤回 / fail-safe

- `OWN_W5_PROD_ACK` を空文字 / 'revoked' / その他に変更
- 要求 mode='live'
- 期待: 実効 mode='dry-run' に再 downgrade (fail-safe)

### S4: env-not-prod 単独失敗

- `VERCEL_PROD='false'`, `OWN_W5_PROD_ACK='received'`
- 要求 mode='live'
- 期待: 実効 mode='dry-run' / downgradeReason='env-not-prod'

---

## 3. mock injection 設計

### 3.1 Owner ACK signal injection

env を `{ VERCEL_PROD, OWN_W5_PROD_ACK }` で渡すのみ。
process.env 汚染なし (pure 関数 `resolveModeWithEnv` / `resolveDispatcherModeWithEnv`)。

### 3.2 fetcher / smtp send injection

- canary: `options.fetcher = vi.fn(async () => new Response(null, { status: 200 }))`
- alert slack: 同上を `slack.fetcher` に
- alert pagerduty: `pagerduty.fetcher` に
- alert email: `smtp.send = vi.fn(async () => {})`

→ network 0 件 / 実 API 発火 0 件 / `$0` 厳守

---

## 4. test ファイル分担

| 観点 | ファイル | case 数 |
|------|---------|---------|
| canary mode='live' env-gate + factory | `canary/__tests__/edge-config-canary-mode-live.test.ts` | 8 |
| alert dispatcher mode='live' env-gate + factory | `alerting/__tests__/alert-router-mode-live.test.ts` | 8 |
| 4 probe 実 exec path (timeout/fallback/parallel) | `health/__tests__/probes-actual-exec.test.ts` | 7 |
| 計 | | 23 |

R30 harness 924 + 23 = **947 PASS 想定** (+21 case e2e の超過分は probe 並列 case 1 を含む / 仕様上限 945+ 達成)

---

## 5. 厳守項目

- 実 API call 0 件 (全 fetcher / send は vi.fn 注入)
- 物理 deploy 0 件
- 環境変数の物理書込 0 件 (env は引数渡し pure 関数)
- log event は logger 注入で観測 (副作用 0)
- TS6059 0 件継承
- mtime 不変: R30 既存 6 file + R30 wire 2 file の line 1〜N 完全保存

---

## 6. 失敗 case の取扱

- env-gate downgrade は **fail-safe** (例外 throw せず dry-run へ静かに移行)
- log event に `downgradeReason` を含める想定 (R32 で logger 拡張余地)
- Owner 通知は alert-router 経路で発火可能 (本 e2e の alert dispatcher S2 経路)

---

## 7. 観測点 / metric emit

post-launch 24h longrun (別 spec) と連動:

- mode resolution count by `requested × downgradeReason`
- live activation timestamp (OWN-W5-PROD-ACK 受領 epoch)
- fetcher 呼出回数 / 成功率 / latency

---

## 8. R32 引継

- W7-A KPI dashboard で `downgradeReason` 分布の可視化
- 30day spec で env-gate 解除 audit (Owner ACK 撤回検出)
