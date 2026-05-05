# Dev-EEE Round 29 — HG-8 cross-orchestrator chaos test spec (ChaosScenario 7 種 / 真 cross-orchestrator infra 起案)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 / R28 Dev-BBB 引継 2 (真 cross-orchestrator chaos / readiness 96/100) を物理 spec 化。
本書 role: HG-8 = HardGuard 第 8 弾 / cross-orchestrator (orchestrator A × B 実 wiring) 上で 7 種 ChaosScenario を発火し回復経路を検証する spec。

---

## 0. 概要

### 0.1 派生元

- R27 Dev-AAA 5d spec §4 chaos-injector helper (120-150 行 / 7 scenario / readiness 96/100)
- R28 Dev-BBB scope 圧縮: MockClaudeBridge 単独 (Bridge reconnect 6 tests) に圧縮 / 真 cross-orchestrator は R29+ 引継明示
- 関連 absolute: `w4-fifth-hg7-bridge-reconnect.test.ts` (374 行 / 6 tests) は **無改変**

### 0.2 cross-orchestrator infra 定義

**orchestrator A** = OpenClaw runtime (`app/openclaw-runtime/`) / **orchestrator B** = harness 側 mock orchestrator / **bridge** = MockClaudeBridge (5d 内実装) / **A × B** = 双方向 ack-id round-trip 必須

```
[orchestrator A] <-- ack-id round-trip --> [bridge] <-- ack-id round-trip --> [orchestrator B]
       ^                                                                              ^
       |--- chaos injection point 1 (kill / partition)                                |
                                                                                      |--- chaos injection point 2 (clock drift / hijack)
```

### 0.3 既存 absolute file 無改変宣言

| file | 行数 | 状態 |
|---|---:|---|
| 5a / 5b / 5c / 5d | (前 spec 参照) | **全件無改変** |

本 spec は新 file `app/harness/src/__tests__/w4-fifth-hg8-cross-orchestrator-chaos.test.ts` の起案のみ。

---

## 1. ChaosScenario 7 種 enum

### 1.1 enum 定義

```ts
export enum ChaosScenario {
  RANDOM_KILL          = 'random_kill',
  NETWORK_PARTITION    = 'network_partition',
  CLOCK_DRIFT          = 'clock_drift',
  MOCKBRIDGE_UNAVAILABLE = 'mockbridge_unavailable',
  SLA_BREACH_STORM     = 'sla_breach_storm',
  ACK_ID_COLLISION     = 'ack_id_collision',
  CONTROL_HIJACK       = 'control_hijack',
}
```

### 1.2 各 scenario 詳細

#### 1.2.1 RANDOM_KILL

- **trigger**: orchestrator A or B の subprocess を `process.kill('SIGKILL')` で強制終了 (50/50 random)
- **期待回復**: 30s 以内に supervisor が restart / ack-id 連続性維持 / state 損失 0
- **invariant**: kill 直前の最終 ack-id が restart 後 ack-id と +1 連続 (gap 0)

#### 1.2.2 NETWORK_PARTITION

- **trigger**: A ↔ bridge 間の TCP socket を `socket.destroy()` (5s 持続) → 自動 heal
- **期待回復**: bridge reconnection (HG-7 既存実装) で 10s 以内に再同期
- **invariant**: partition 中の event は queue 滞留 / heal 後 FIFO で排出 / 順序 inversion 0

#### 1.2.3 CLOCK_DRIFT

- **trigger**: orchestrator A の `Date.now()` を `+30s drift` で wrap (Sinon fake clock)
- **期待回復**: HG-6 SLA recovery が drift 検出 → drift 補正 + clock resync
- **invariant**: drift 期間中の SLA breach は **false positive 0** (= drift 起因の breach は無視)

#### 1.2.4 MOCKBRIDGE_UNAVAILABLE

- **trigger**: MockClaudeBridge instance を `null` 化 (5s 持続) → restore
- **期待回復**: A / B 双方が `Bridge unavailable` を検知 / `pass_through` mode に切替 / restore 後 `bridged` mode 復帰
- **invariant**: `pass_through` 期間の event は HG-12 `fail_closed` ガードで block されない (= 正常通過)

#### 1.2.5 SLA_BREACH_STORM

- **trigger**: 1s 内に 1000 件 SLA breach event 同時発生
- **期待回復**: HG-6 breach counter が overflow せず / Slack alert は dedup で 1 件のみ post (rate limit)
- **invariant**: breach counter == 1000 / Slack alert post == 1 (dedup window 60s)

#### 1.2.6 ACK_ID_COLLISION

- **trigger**: A / B が同時に同 ack-id (例: `ack-12345`) を発行
- **期待回復**: bridge が collision 検出 / 後発 ack-id を `ack-12345-suffix-{uuid8}` に rename
- **invariant**: collision 後の ack-id は globally unique / state inconsistency 0

#### 1.2.7 CONTROL_HIJACK

- **trigger**: 攻撃者シミュレーション / 正規外 channel から forged control message 注入
- **期待回復**: bridge の HMAC 検証 (R30+ 実装予定) で reject / Sentry 5xx 1 件記録
- **invariant**: forged message は state 変更 0 / Audit log に reject 理由記録

---

## 2. test 構造 (12-15 tests / 約 750 行想定)

### 2.1 file 構造

```
app/harness/src/__tests__/w4-fifth-hg8-cross-orchestrator-chaos.test.ts
├── §1 setup
│   ├── orchestrator A spawn (real subprocess / not mock)
│   ├── orchestrator B spawn (harness mock orchestrator)
│   ├── MockClaudeBridge wire (A ↔ B 双方向)
│   └── chaos-injector helper import
├── §2 group A: RANDOM_KILL (2 tests)
├── §3 group B: NETWORK_PARTITION (2 tests)
├── §4 group C: CLOCK_DRIFT (2 tests)
├── §5 group D: MOCKBRIDGE_UNAVAILABLE (2 tests)
├── §6 group E: SLA_BREACH_STORM (2 tests)
├── §7 group F: ACK_ID_COLLISION (2 tests)
└── §8 group G: CONTROL_HIJACK (1-3 tests / R30+ HMAC 実装後拡張)
```

### 2.2 chaos-injector helper

```ts
// app/harness/src/test-utils/chaos-injector.ts (新規 / 約 180 行)
export class ChaosInjector {
  inject(scenario: ChaosScenario, target: 'A' | 'B' | 'bridge'): Promise<void>;
  heal(scenario: ChaosScenario): Promise<void>;
  observe(): { breachCount: number; ackGap: number; alertCount: number };
}
```

### 2.3 行数見積

| section | 行数 |
|---|---:|
| §1 setup | 110 |
| §2-§7 (group A-F / 各 2 tests) | 360 (60×6) |
| §8 group G | 80 |
| chaos-injector helper | 180 |
| import / type | 30 |
| **本 file 計** | **580** |
| chaos-injector helper file | 180 |
| **合計** | **760** |

---

## 3. infra readiness pre-condition

### 3.1 R30 着手前必須条件

1. orchestrator A (`app/openclaw-runtime/`) が subprocess として spawn 可能 (`bin/openclaw-runtime` entry point 整備)
2. orchestrator B (harness mock) が IPC 経由で A と通信可能 (Node.js `child_process.spawn` + stdio pipe)
3. MockClaudeBridge が双方向 wire 対応 (現状 A → bridge 単方向のみ → R30 で双方向化)
4. HMAC 検証 (CONTROL_HIJACK 対応) は R31+ 拡張 / 本 spec §1.2.7 は HMAC 未実装でも 1 test (forge reject 確認のみ) 可

### 3.2 readiness 評価

| 項目 | pt (100) | 備考 |
|---|---:|---|
| spec 完成度 | 96 | 7 scenario 全件 invariant 明記 |
| infra 依存 | 70 | A 双方向 wire 整備が R30 必須 |
| 失敗時対処 | 85 | inject 失敗時の自動 heal は helper で吸収 |
| 既存 file 互換 | 100 | 5a-5d 無改変担保 |
| **総合** | **88/100** | R28 Dev-BBB 96/100 評価から ↓8pt は infra 依存度精査の結果 |

---

## 4. 制約遵守

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 (spec only) |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## 5. R30 Dev-JJJ 引継

1. orchestrator A 双方向 wire 整備 (約 4-6h hands-on / `app/openclaw-runtime/bin/` 拡張)
2. chaos-injector helper 物理化 (180 行 / 約 3h hands-on)
3. HG-8 test file 物理化 (580 行 / 12 tests / 約 8-10h hands-on / R30+ もしくは R31)

---

(end of file / 約 220 行)
