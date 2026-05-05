# PRJ-019 Round 25 Dev-TT — claude-bridge integration e2e dry-run spec (W4 第 5 弾候補 5-A)

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R25 Dev-TT (W5 着手第 2 弾の付随 spec / R26 物理化想定)
位置付け: Round 24 W4 完成第 4 弾 (HITL × hardguards cross-matrix 12 tests) 完遂着地後、W4 累計 42 tests を補完する **第 5 弾候補 5-A** の spec を物理化レベルで詳細化する報告書。test file 物理化は Round 26 想定で、R25 では spec 確定のみ。
版: v1.0
連動 DEC: DEC-019-006 (P-D 改 / subprocess spawn) / 033 (HITL 第 9 種 dev_kickoff_approval) / 041 (ARCH-01 paths alias) / 049 (Sec hardening) / 051 (mock-claude スタブ差替) / 062 (stagger 圧縮 SOP) / 068 (T-5 trigger 物理化) / 074-077 (5/19 統合採決 4 件)
連動 spec / file (絶対無改変):
- `app/harness/src/__tests__/17day-path-w4-hitl-hardguards-cross.test.ts` (R24 Dev-QQ / 907 行 / 12 tests)
- `app/harness/src/__tests__/17day-path-w4-hitl-gates-integration.test.ts` (R23 Dev-MM / 626 行 / 9 tests)
- `app/harness/src/__tests__/17day-path-w4-production-e2e-extended.test.ts` (R22 Dev-JJ / 561 行 / 10 tests)
- `app/harness/src/__tests__/17day-path-w4-e2e-fully-wired.test.ts` (R22 Dev-HH / 530 行 / 11 tests)
- `app/claude-bridge/src/spawn.ts` (claude-bridge ClaudeBridge / 既存)
- `app/claude-bridge/src/stream-json-parser.ts` (parseStreamJsonText / 既存)
- `app/claude-bridge/src/auth-detector.ts` (detectClaudeAuth / 既存)
- `app/openclaw-runtime/src/wrapper.ts` (buildSpawnContract / 既存)
- `app/openclaw-runtime/src/skill-adapter/subprocess.ts` (runSubprocessAdapter / 既存)
物理化対象 file (R26 想定):
- `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts` (R26 物理化 / 700-850 行 想定 / 12-15 tests / 4-5 groups)

---

## §0 サマリ (CEO 200 字)

W4 完成第 5 弾候補 5-A = **claude-bridge × harness × openclaw-runtime 三者統合 e2e dry-run** の spec を物理化レベルで詳細化。検証対象: claude-bridge ClaudeBridge.execute() の dryRun=true 経路 + harness CostTracker / KillSwitch / HitlGate 連動 + openclaw-runtime buildSpawnContract / enforceSpawnTimeout 連鎖 の 3 軸統合。**test 物理化は R26 想定 / R25 では spec のみ**。工数 6-8h / 高優先度 / 4-5 groups / 12-15 tests / failure scenario 8 件。Round 24 W4 4 段累計 42 tests + 第 5 弾 12-15 tests = **W4 完成 54-57 tests** 見込み (累計 +29-32%)。stream-json-parser テキスト復元 round-trip / auth-detector dry-run path / spawn timeout escalation の 3 観点を中核に据え、API call $0 / 実 spawn 0 / file IO は OS tmp 経由のみで担保。R23 Dev-MM / R22 Dev-JJ/HH / R24 Dev-QQ historical baseline は absolute 無改変保護。R26 物理化時の base spec として提出可能な水準まで本書で確定。

---

## §1 W4 4 段累計の到達点と第 5 弾候補 5-A の位置付け

### 1.1 W4 4 段の構造 (R24 Round 24 完遂着地 reference)

| 弾 | round | 担当 | 主軸 | tests | 行数 | 物理 file |
|---|---|---|---|---|---|---|
| 第 1 弾 | R22 | Dev-JJ | production e2e 拡張 | +10 | 561 | `17day-path-w4-production-e2e-extended.test.ts` |
| 第 2 弾 | R22 | Dev-KK | breach stress / chaos | +9 | 555 | `file-breach-counter-stress-chaos.test.ts` |
| 第 3 弾 | R23 | Dev-MM | HITL gates 統合 e2e | +9 | 626 | `17day-path-w4-hitl-gates-integration.test.ts` |
| 第 4 弾 | R24 | Dev-QQ | HITL × hardguards cross | +12 | 907 | `17day-path-w4-hitl-hardguards-cross.test.ts` |
| 1M longrun | R22 | Sec-Q | 連続稼働 stability | +5 | - | `heartbeat-1m-10digit-longrun-stability.test.ts` |
| **計** | - | - | - | **42** | - | - |

### 1.2 第 5 弾候補の位置付け

第 5 弾は **「W4 完成」段階の bridge-side 補完**。これまで harness 内 (Dev-JJ/KK/MM/QQ) と openclaw-runtime 内 (Sec-Q heartbeat longrun) は完備されたが、claude-bridge 経路は W4 完成段階で未充填領域として残っている。

第 5 弾候補は 3 案ある:
- **5-A (本書)**: claude-bridge × harness × openclaw-runtime 三者統合 e2e dry-run (本 spec)
- 5-B (別 spec 候補 / R26 別起案想定): stream-json-parser fuzz / chaos
- 5-C (別 spec 候補 / R26 別起案想定): auth-detector subscription-vs-API-key 切替 e2e

5-A は cross-package coverage の根幹に位置するため、第 5 弾の **筆頭** として提出する。

### 1.3 W4 完成 5-A 反映後の累計試算

| 観点 | R24 完遂時 | 5-A 物理化後 (R26 想定) | Δ |
|---|---|---|---|
| W4 累計 tests | 42 | 54-57 (12-15 件追加) | +12-15 |
| harness PASS | 816 | 836-839 (Dev-SS R25 12 + Dev-TT R25 8 + 5-A 12-15) | +20-23 |
| 物理 file 件数 (W4 系列) | 4 | 5 | +1 |
| cross-package coverage | 部分 | 三者統合完備 | qualitative gain |

---

## §2 5-A 物理化 spec — 全体像

### 2.1 物理化 5 軸サマリ

| 軸 | 内容 | 物理化レベル | R26 担当 |
|---|---|---|---|
| 1 | groups + tests 設計 (4-5 groups / 12-15 tests) | spec 確定 | Dev-XX (R26 dispatch) |
| 2 | mock spawn / mock auth-detector 注入経路 | spec 確定 + draft | Dev-XX |
| 3 | failure scenario 列挙 (8 件 / categorized) | spec 確定 | Dev-XX |
| 4 | API call $0 / 実 spawn 0 担保戦略 | spec 確定 | Dev-XX (verify) |
| 5 | 物理 file path 案 + 命名衝突回避 | spec 確定 | Dev-XX (起案) |

### 2.2 設計原則 (R26 物理化時に厳守)

1. **bridge / runtime / harness 本体 production code 無改変**: 全 mock 注入は test 内局所 helper で完結
2. **dryRun=true 経路のみ exercise**: ClaudeBridge.execute({dryRun:true}) の payload 検証 + side-effect 0
3. **API call $0**: 子 process spawn なし / network call なし / Anthropic API call なし
4. **file IO は OS tmp 経由のみ**: afterEach で 完全 cleanup / heartbeat 系の永続化と独立
5. **R24 W4 4 段 historical baseline 無改変**: 既存 4 file は import せず、本 5-A は独立 file として並列存在

---

## §3 groups + tests 設計 (4-5 groups / 12-15 tests)

### 3.1 Group B-1 (claude-bridge dry-run lifecycle, 3 tests)

**目的**: ClaudeBridge.execute() の dryRun=true 経路で payload が build され、副作用 0 で result が返ることを確証。

| test ID | 検証内容 |
|---|---|
| B-1-1 | ClaudeBridge.execute({dryRun:true, prompt:'sample'}) → result.dryRun === true / spawn 不発火 |
| B-1-2 | ClaudeBridge.execute({dryRun:true, permissionMode:'plan'}) → permissionMode 透過 / payload に反映 |
| B-1-3 | ClaudeBridge.execute({dryRun:true}) 連続 5 回 → 全 result 独立 (state leak 0) |

### 3.2 Group B-2 (harness CostTracker / KillSwitch 連動, 3 tests)

**目的**: harness 側 CostTracker が claude-bridge dry-run 完了を 0 cost として記録し、KillSwitch が触発しないこと。

| test ID | 検証内容 |
|---|---|
| B-2-1 | dry-run 5 回連続 → CostTracker.checkBudget() ok=true 維持 (累積 USD = 0) |
| B-2-2 | budget=$0.01 / dry-run 1 回 → 0 cost 計上 / KillSwitch.isTriggered() false |
| B-2-3 | dry-run 中の Harness.guardedRun() 呼出 → 予算 guard PASS / fn 実行 / kill 不発火 |

### 3.3 Group B-3 (openclaw-runtime spawn contract 連鎖, 3 tests)

**目的**: openclaw-runtime buildSpawnContract で構築した contract が claude-bridge spawn 層と互換であり、enforceSpawnTimeout の純関数経路が claude-bridge mock spawn 上で動作すること。

| test ID | 検証内容 |
|---|---|
| B-3-1 | buildSpawnContract({command:'claude'}) → claude-bridge ClaudeBridge.execute() の payload と互換確認 |
| B-3-2 | enforceSpawnTimeout({contract, target:mockBridgeProcess, sleep:fakeSleep}) → 'completed' で抜ける |
| B-3-3 | enforceSpawnTimeout が timeoutMs 経過 → SIGTERM → grace → SIGKILL escalation を mock target で確認 |

### 3.4 Group B-4 (stream-json-parser round-trip + auth-detector dry-run, 3 tests)

**目的**: claude-bridge の補助 layer (stream-json-parser / auth-detector) が dry-run 経路で正しく振る舞うこと。

| test ID | 検証内容 |
|---|---|
| B-4-1 | ClaudeMessageSchema fixture → JSON.stringify → parseStreamJsonText round-trip 完全復元 |
| B-4-2 | extractUsage(messages) → ClaudeUsage shape valid (input/output tokens / cost USD) |
| B-4-3 | detectClaudeAuth({mode:'dry-run', envSource:{}}) → AuthDetectionResult.method 系統的に解決 |

### 3.5 Group B-5 (cross-package failure resilience, 2-3 tests)

**目的**: claude-bridge × harness × openclaw-runtime の 3 者跨ぎで failure scenario が発生した際の fail-fast / fail-soft 振る舞い。

| test ID | 検証内容 |
|---|---|
| B-5-1 | dry-run 中 KillSwitch.trigger() → ClaudeBridge.execute() result.aborted === true |
| B-5-2 | budget 超過 + dry-run 5 件並列 → CostTracker fail-fast / 後続 dry-run reject |
| B-5-3 (optional) | corrupted stream-json input → parseStreamJsonText error 経路 / harness CostTracker 影響なし |

**合計**: 4 groups (B-1〜B-4) 確定 + 5 group 目 (B-5) 2-3 tests = **12-15 tests** 範囲内。

---

## §4 mock spawn / mock auth-detector 注入経路 spec

### 4.1 mock spawn 戦略

ClaudeBridge.execute() の subprocess spawn 経路は、以下 2 layer で mock 化する:

1. **layer A — dryRun=true bypass (本 5-A 中核)**: ClaudeBridge.execute({dryRun:true}) を呼ぶことで、内部 spawn を bypass。実際の child_process.spawn() 呼出 0 件で result が返ること。
2. **layer B — runSubprocessAdapter mock spawner (subprocess timeout 系のみ)**: openclaw-runtime の SubprocessSpawner interface を test 内 mock 実装で差し替え、実際の OS 子プロセスは起動しない。`alive() / signal()` のみ mock 提供。

### 4.2 mock auth-detector 戦略

detectClaudeAuth() は env source / config file path を読む 純関数化済み API。test 内で:

- envSource を空 object (`{}`) に固定 → 実環境 env への依存 0
- config file path を OS tmp 内 dummy file に向ける → 副作用 0
- AuthDetectorOptions.dryRun = true (もしあれば) を有効化 / なければ minimum env で経路実行

### 4.3 mock 注入の TypeScript shape draft

```typescript
// 本 5-A 物理化 file 内 局所 helper (production code 無改変)
interface MockBridgeProcess {
  alive(): boolean
  signal(sig: 'SIGTERM' | 'SIGKILL'): void
  // alive flag を test から制御するための test-only handle
  __setAlive(v: boolean): void
}

function buildMockBridgeProcess(initial: boolean = true): MockBridgeProcess {
  let aliveFlag = initial
  return {
    alive: () => aliveFlag,
    signal: () => { aliveFlag = false },
    __setAlive: (v) => { aliveFlag = v },
  }
}
```

---

## §5 failure scenario 列挙 (8 件 / categorized)

### 5.1 fail-fast 系 (4 件)

| # | scenario | 想定発火点 | reject path |
|---|---|---|---|
| F-1 | dryRun=false 指定 | ClaudeBridge.execute() | test 内で reject (本 5-A は dry-run 専用) |
| F-2 | budget 超過状態で dry-run 起動 | Harness.guardedRun → CostTracker.checkBudget | reject (`budget guard failed`) |
| F-3 | KillSwitch 既 triggered 状態で dry-run | Harness.guardedRun | reject (`kill-switch already triggered`) |
| F-4 | corrupted stream-json input | parseStreamJsonText | error result / 例外 throw → catch |

### 5.2 fail-soft 系 (4 件)

| # | scenario | 想定発火点 | tolerated 振る舞い |
|---|---|---|---|
| S-1 | timeout escalation (SIGTERM → SIGKILL) | enforceSpawnTimeout | outcome='sigkill' / circuit open |
| S-2 | env source 空 / auth-detector 必要キー欠損 | detectClaudeAuth | AuthDetectionResult.method='unknown' fallback |
| S-3 | extractUsage が partial usage を受領 | extractUsage | 既知 field のみ抽出 / 未知 field skip |
| S-4 | dry-run result の sequential ID 重複検知 | test 内 helper | warning log / 試験継続 (regression 0 担保) |

### 5.3 categorization

- **fail-fast = 安全側 reject 必須**: F-1 / F-2 / F-3 / F-4
- **fail-soft = degrade gracefully 許容**: S-1 / S-2 / S-3 / S-4

5-A の各 test は対応する scenario に明示的に紐付け、回帰時の root cause 特定を加速する。

---

## §6 API call $0 / 実 spawn 0 / file IO tmp 担保戦略

### 6.1 API call $0 担保

| layer | 担保手段 |
|---|---|
| ClaudeBridge.execute | dryRun=true 強制 / 全 test 内で execute() の前段で assert dryRun=true |
| detectClaudeAuth | envSource を空 object 固定 / network call 経路は detectClaudeAuth 内に存在せず |
| extractUsage | 入力 messages を test 内 fixture から構築 / 外部 API から取得しない |

### 6.2 実 spawn 0 担保

| layer | 担保手段 |
|---|---|
| child_process.spawn | dryRun=true で bypass / mock SubprocessSpawner で差し替え |
| enforceSpawnTimeout | target=MockBridgeProcess で alive/signal を test 制御 |
| sleep | options.sleep で fakeSleep 注入 (Round 7 既存 pattern と互換) |

### 6.3 file IO は OS tmp のみ

| 用途 | 場所 | cleanup |
|---|---|---|
| auth-detector dummy config | `os.tmpdir()/clawbridge-w5-5a-auth-XXXX` | afterEach で `fs.rm({recursive:true})` |
| stream-json fixture (もし永続化必要なら) | `os.tmpdir()/clawbridge-w5-5a-stream-XXXX` | afterEach で削除 |
| heartbeat / breach counter | **本 5-A では touch しない** (R22 Dev-JJ baseline 不可侵) | - |

---

## §7 物理 file path 案 + 命名衝突回避

### 7.1 物理 file path 案

| file | path | 行数 想定 |
|---|---|---|
| 本 5-A test file | `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts` | 700-850 |
| 本 spec | `projects/PRJ-019/reports/dev-tt-r25-claude-bridge-integration-e2e-spec.md` (本書) | 280-360 |
| (R26 起票時) Dev-XX 完遂報告書 | `projects/PRJ-019/reports/dev-xx-r26-w4-5a-completion.md` | 200-250 |

### 7.2 命名衝突回避

R25 で物理化 / 計画中の file 一覧 (衝突回避対象):
- `phase2-w5-cross-orchestrator-e2e.test.ts` (Dev-SS R25 Task 1)
- `phase2-w5-cross-package-extension.test.ts` (Dev-TT R25 Task 1 / 本 spec の前段)
- `17day-path-w4-*.test.ts` 4 件 (W4 第 1-4 弾 / 不可侵)

R26 物理化対象 5-A の file 名 `phase2-w5-claude-bridge-integration-e2e.test.ts` は 上記いずれとも prefix / suffix が異なり、衝突なし。

---

## §8 工数 + 優先度 + 依存関係 + 想定 test 数

### 8.1 工数見積もり (R26 物理化時 / Dev-XX 担当)

| task | 工数 (h) |
|---|---|
| 5-A test file 雛形構築 (groups skeleton + describe/it ブロック 12-15 件) | 1.5 |
| Group B-1 (3 tests / dryRun lifecycle) 実装 + assertions | 1.0 |
| Group B-2 (3 tests / harness 連動) 実装 | 1.0 |
| Group B-3 (3 tests / spawn contract 連鎖) 実装 | 1.5 |
| Group B-4 (3 tests / stream-json + auth) 実装 | 1.0 |
| Group B-5 (2-3 tests / failure resilience) 実装 | 0.5-1.0 |
| 8 failure scenario の test 内 assertion 紐付け確認 | 0.5 |
| harness 836+ PASS regression 0 verify | 0.5 |
| **合計** | **6.5-8.0** |

工数 spec range: **6-8h** = 命令書要件 satisfy。

### 8.2 優先度

**高**: 理由 4 件:
1. cross-package coverage の根幹 (claude-bridge × harness × openclaw-runtime 三者統合は他 W4 4 段で未充填)
2. R24 W4 完遂判定の補完 = Phase 1 完遂宣言 (DEC-019-075 関連) に直結
3. R26 物理化想定 ≒ R26 connect 12 round milestone (Sec-T trigger 5 物理化) と並列実施可能
4. 本 5-A 完遂で W4 累計 54-57 tests = +29-32% 増加 = ARCH-01 Phase 2 / Phase 1 完遂宣言の最終裏付け

### 8.3 依存関係

**前提**:
- R24 完遂 W4 4 段 historical baseline 確定 (OK R24 完遂時点で satisfied)
- claude-bridge / openclaw-runtime / harness の 3 package barrel exports 安定 (OK Round 24 まで stabilization 維持)
- ARCH-01 Phase 1 alias 経路 active (OK Round 24 完遂時点で satisfied)

**並列可能**:
- Sec-T R26 trigger 5 物理化 (独立)
- Knowledge-T R25 INDEX-v14 起票 (独立)
- PM-R DEC-019-079 起案 (独立)

**直列必要**:
- なし (5-A は self-contained)

### 8.4 想定 test 数

- Group B-1: 3 tests
- Group B-2: 3 tests
- Group B-3: 3 tests
- Group B-4: 3 tests
- Group B-5: 2-3 tests (B-5-3 optional)
- **合計**: **12-15 tests** (4-5 groups)

---

## §9 R26 物理化想定 + Round 25 引継

### 9.1 R26 物理化時の制約 (Dev-XX 担当用 checklist)

- [x] 本 spec を pre-read (本書 280-360 行)
- [ ] R24 W4 4 段 4 file の現行行数 / md5 を pre-flight 確認
- [ ] 本 5-A test file を `phase2-w5-claude-bridge-integration-e2e.test.ts` に物理化
- [ ] groups B-1〜B-5 を §3 通りに実装
- [ ] mock spawn / mock auth-detector を §4 spec で実装 (test 内局所 helper)
- [ ] failure scenario 8 件を §5 categorization に従い assert
- [ ] harness 836+ PASS / openclaw-runtime 394 PASS / regression 0 検証
- [ ] DEC-019-075 関連 ack に Y 1 件追加できる水準で完遂報告書起案

### 9.2 Round 25 引継 (CEO / PM 部門宛)

| 引継 item | 担当想定 (R26) | 工数 |
|---|---|---|
| 本 5-A 物理化 (test file + 完遂報告書) | Dev-XX | 6.5-8h |
| W4 累計 54-57 tests baseline JSON 起票 | Sec-T | 1.5h |
| INDEX-v14 への 5-A 由来 entry 追加 (PAT-XXX 候補) | Knowledge-T | 1.0h |
| DEC-019-XYZ 起案 (5-A 完遂を踏まえた W4 完成宣言議決) | PM-R | 2.0h |

---

## §10 制約遵守 (本 spec 起案時 / R25 Dev-TT)

- [x] R23 Dev-MM / R22 Dev-JJ/HH/KK / R24 Dev-QQ historical baseline absolute 無改変
- [x] claude-bridge / openclaw-runtime / harness production code 無改変 (本書は spec のみ)
- [x] API call $0 / 副作用 0 / 絵文字 0
- [x] 物理化 file は R26 想定 (R25 では起案しない)
- [x] Dev-SS Round 25 Task 1 (`phase2-w5-cross-orchestrator-e2e.test.ts`) と本 5-A file 名衝突なし
- [x] Dev-TT Round 25 Task 1 (`phase2-w5-cross-package-extension.test.ts`) と本 5-A file 名衝突なし
- [x] R24 完遂 W4 4 段累計 42 tests baseline 維持 (本 spec 起案で +0 tests)

---

## §11 結語

W4 完成第 5 弾候補 5-A = claude-bridge × harness × openclaw-runtime 三者統合 e2e dry-run の物理化 spec を 5 軸 + 8 failure scenario + 12-15 tests / 4-5 groups の水準で確定。R26 物理化想定 / R25 では spec 確定のみ。Dev-SS / Dev-TT R25 Task 1 と命名衝突なし。R26 Dev-XX 担当で 6.5-8h 工数で物理化可能な base spec として CEO / PM 部門に提出する。

R24 W4 4 段 historical baseline は absolute 無改変保護、API コスト $0、副作用 0、絵文字 0、harness 836 PASS / openclaw-runtime 394 PASS 維持を担保。
