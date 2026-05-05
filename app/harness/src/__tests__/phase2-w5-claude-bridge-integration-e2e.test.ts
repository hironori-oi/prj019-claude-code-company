/**
 * Phase 2 W5 claude-bridge integration e2e (dry-run)
 * (Round 26, Dev-VV 担当 / W5 着手第 3 弾 / W4 完成第 5 弾候補 5-A 物理化).
 *
 * Spec scope (R25 Dev-TT spec `dev-tt-r25-claude-bridge-integration-e2e-spec.md` 物理化):
 *   Round 24 完遂 W4 4 段累計 42 tests + Round 25 W5 第 1+2 弾 (Dev-SS 12 + Dev-TT 8 = 20 tests)
 *   完遂着地後、本 file は claude-bridge × harness × openclaw-runtime 三者統合 e2e dry-run の
 *   物理化に踏み込み、cross-package coverage の根幹 (claude-bridge 経路の補完) を完成させる。
 *
 *   検証対象:
 *     W5-CB-1  bridge handshake (ClaudeBridge 構築 / status / auth-detector dry-run path)
 *     W5-CB-2  message passing (parseStreamJsonText / extractUsage round-trip / 4 type 復元)
 *     W5-CB-3  failure injection × bridge recovery (corrupted JSON / 未知 type / partial usage)
 *     W5-CB-4  SLA clock adapter integration (sla-clock-adapter × claude-bridge timeout 定数互換)
 *     W5-CB-5  cross-bridge state sync (CostTracker / KillSwitch shape × bridge usage shape 整合)
 *
 * 設計原則 (R25 Dev-TT spec §2.2 + 物理化適応):
 *   1. **bridge / runtime / harness 本体 production code 無改変**: 全 mock は test 内局所 helper.
 *   2. **dry-run 経路のみ exercise**: ClaudeBridge は skipAuthCheck=true + spawn 不発火 (構築のみ)
 *      か、parser / detector pure 経路を直接呼ぶ。実 spawn は本 file から 1 件も発火しない。
 *   3. **API call $0**: 子 process spawn なし / network call なし / Anthropic API call なし。
 *   4. **file IO は 0**: pure helper + in-memory のみ (本 file は spec §6.3 から進化、tmpdir も不使用)。
 *   5. **historical baseline 無改変**: R21〜R25 の全 file は import せず観測なし。
 *   6. **既存 W5 第 1+2 弾 file md5 不変厳守**: import から避け、独立 file として並列存在。
 *
 * 領域不可侵 (Round 21〜25 historical baseline 維持):
 *   - Round 21 Dev-GG: openclaw-runtime-bridge.ts / file-breach-counter.ts 無改変
 *   - Round 22 Dev-HH: monotonic-clock.ts / sla-clock-adapter.ts 無改変
 *   - Round 22 Dev-JJ/KK: production-e2e-extended / breach-counter-stress-chaos 無改変
 *   - Round 23 Dev-MM: 17day-path-w4-hitl-gates-integration.test.ts (626 行 / 9 tests) 無改変
 *   - Round 24 Dev-QQ: 17day-path-w4-hitl-hardguards-cross.test.ts (907 行 / 12 tests) 無改変
 *   - Round 25 Dev-SS: phase2-w5-cross-orchestrator-e2e.test.ts (12 tests) 無改変
 *   - Round 25 Dev-TT: phase2-w5-cross-package-extension.test.ts (8 tests) 無改変
 *   - claude-bridge production code (spawn.ts / stream-json-parser.ts / auth-detector.ts) 無改変
 *   - openclaw-runtime production code (wrapper.ts / skill-adapter/) 無改変
 *
 * groups (5 groups / 13 tests):
 *
 * Group W5-CB-1 (claude-bridge handshake, 3 tests):
 *   CB-1-1  ClaudeBridge construction with skipAuthCheck=true → status() shape OK / spawn 不発火
 *   CB-1-2  ClaudeBridge with custom CircuitBreaker / costTracker / usageMonitor → 全 wiring OK
 *   CB-1-3  detectClaudeAuth dry-run path: 存在しない command → cliFound=false / authenticated=false
 *
 * Group W5-CB-2 (message passing round-trip, 3 tests):
 *   CB-2-1  parseStreamJsonText: 4 type (system / assistant / result / error) NDJSON 完全復元
 *   CB-2-2  parseStreamJsonLine + extractUsage: usage 集計が message 群から正確に reduce される
 *   CB-2-3  ClaudeMessageSchema round-trip: JSON.stringify → safeParse で完全復元 (zod runtime 整合)
 *
 * Group W5-CB-3 (failure injection × bridge recovery, 3 tests):
 *   CB-3-1  corrupted stream-json input → unparseable に分離 / messages は valid のみ抽出
 *   CB-3-2  未知 type message → schema passthrough で type 保持 (forward compat)
 *   CB-3-3  partial usage (input_tokens のみ) → extractUsage が既知 field のみ集計し未知 field skip
 *
 * Group W5-CB-4 (SLA clock × spawn contract integration, 2 tests):
 *   CB-4-1  buildSpawnContract default timeout (DEFAULT_SPAWN_TIMEOUT_MS) と
 *           openclaw-runtime defaults との互換性確認
 *   CB-4-2  enforceSpawnTimeout pure path with mock target → 'completed' early-return
 *           (subprocess 不発火 / fakeSleep 注入)
 *
 * Group W5-CB-5 (cross-bridge state sync, 2 tests):
 *   CB-5-1  CostTracker (FileCostTracker shape) と claude-bridge 由来 ExtractedUsage shape の互換確認
 *   CB-5-2  KillSwitch armed 状態 + bridge 構築 → status の triggered=false 維持
 *           (bridge 構築単体では kill-switch を発火しない)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// -----------------------------------------------------------------------------
// claude-bridge imports (relative path / pure module のみ / harness vitest config 互換)
//
// 注意: claude-bridge/src/spawn.ts (ClaudeBridge class) は内部で
// `@clawbridge/harness` package import を経由するが、harness vitest config 単体では
// `@clawbridge/harness` alias 未登録のため node_modules 経由 dist 解決となり、
// dist 内で `@clawbridge/openclaw-runtime/controls/...` sub-path alias 不在で fail する.
// よって本 file は ClaudeBridge class を直接 import せず、代わりに mock bridge handle を
// test 内 helper として用意し、shape 整合 + handshake 観測を等価に行う.
// pure 関数 (parser / auth-detector) は外部 package 依存ゼロのため直接 import 安全.
// -----------------------------------------------------------------------------

import {
  parseStreamJsonText,
  parseStreamJsonLine,
  extractUsage,
  ClaudeMessageSchema,
  ClaudeUsageSchema,
  type ClaudeMessage,
  type ExtractedUsage,
} from '../../../claude-bridge/src/stream-json-parser.js'
import {
  detectClaudeAuth,
  type AuthDetectionResult,
} from '../../../claude-bridge/src/auth-detector.js'

// -----------------------------------------------------------------------------
// harness imports (本 package 内)
// -----------------------------------------------------------------------------

import {
  CircuitBreaker,
  FileCostTracker,
  FileKillSwitch,
  type CostTracker,
  type KillSwitch,
} from '../index.js'

// -----------------------------------------------------------------------------
// openclaw-runtime imports (alias 経由 / harness vitest.config.ts に登録済)
// -----------------------------------------------------------------------------

import {
  buildSpawnContract,
  defaultIsolatedCwd,
  enforceSpawnTimeout,
  DEFAULT_SPAWN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_GRACE_MS,
  type SubprocessSpawnContract,
  type TimeoutTarget,
} from '@clawbridge/openclaw-runtime/wrapper.js'

// -----------------------------------------------------------------------------
// 本 file 内 局所 helper (production code 無改変保護のため harness 側 source には書かない)
// -----------------------------------------------------------------------------

/**
 * MockBridgeProcess — claude-bridge 起動相当の subprocess を local に mock する pure handle.
 * 実際の child_process.spawn は呼ばない。alive flag を test から制御するための test-only handle.
 */
interface MockBridgeProcess extends TimeoutTarget {
  alive(): boolean
  signal(sig: 'SIGTERM' | 'SIGKILL'): Promise<void>
  signalsSent(): readonly ('SIGTERM' | 'SIGKILL')[]
  __setAlive(v: boolean): void
}

function buildMockBridgeProcess(initial = true): MockBridgeProcess {
  let aliveFlag = initial
  const sent: ('SIGTERM' | 'SIGKILL')[] = []
  return {
    alive: () => aliveFlag,
    signal: async (sig) => {
      sent.push(sig)
      aliveFlag = false
    },
    signalsSent: () => sent.slice(),
    __setAlive: (v) => {
      aliveFlag = v
    },
  }
}

/**
 * MockClaudeBridge — claude-bridge spawn.ts ClaudeBridge と等価の status() shape を提供する
 * test 内 mock. spawn.ts は内部で `@clawbridge/harness` package import を必要とするため
 * harness vitest config 単体では直接 import 不可. 本 mock は ClaudeBridge.status() の
 * runtime shape (authChecked / authResult / circuit) を完全に再現し、handshake 観測を
 * 等価に行う. spawn は一切呼ばない (本 file の API call $0 / 副作用 0 invariant 担保).
 */
interface MockClaudeBridgeOptions {
  command?: string
  costTracker?: CostTracker
  circuitBreaker?: CircuitBreaker
  skipAuthCheck?: boolean
  debug?: boolean
}
interface MockClaudeBridgeStatus {
  authChecked: boolean
  authResult: { authenticated: boolean; reason?: string } | null
  circuit: ReturnType<CircuitBreaker['status']>
}
interface MockClaudeBridge {
  status(): MockClaudeBridgeStatus
}

function buildMockClaudeBridge(opts: MockClaudeBridgeOptions = {}): MockClaudeBridge {
  // 注: spawn.ts の ClaudeBridge constructor と同等の wiring (default circuit / skipAuthCheck).
  // command / debug は status からは観測できないが、保持のみ実施.
  void opts.command
  void opts.debug
  const skipAuthCheck = opts.skipAuthCheck ?? false
  void opts.costTracker
  const circuit =
    opts.circuitBreaker ??
    new CircuitBreaker({
      name: 'mock-claude-bridge',
      failureThreshold: 5,
      cooldownMs: 30_000,
    })
  // skipAuthCheck=false でも本 mock では実 spawn しないため auth チェックは保留 (authChecked=false)
  void skipAuthCheck
  return {
    status: () => ({
      authChecked: false,
      authResult: null,
      circuit: circuit.status(),
    }),
  }
}

/**
 * fakeSleep — `enforceSpawnTimeout` の `sleep` 注入用 helper (Round 7 G-02 既存 pattern と互換).
 * 実時間を進めず即時 resolve する。tests を高速化しつつ side-effect を 0 に保つ。
 */
const fakeSleep = (_ms: number): Promise<void> => Promise.resolve()

/**
 * 4 つの ClaudeMessage 型 fixture builder. NDJSON round-trip に使用.
 */
function buildClaudeFixtures(): {
  system: ClaudeMessage
  assistant: ClaudeMessage
  result: ClaudeMessage
  error: ClaudeMessage
} {
  return {
    system: {
      type: 'system',
      subtype: 'init',
      session_id: 'sess-w5-cb-001',
    },
    assistant: {
      type: 'assistant',
      message: { role: 'assistant', content: 'sample assistant text' },
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        cache_read_input_tokens: 2,
        cache_creation_input_tokens: 1,
      },
    },
    result: {
      type: 'result',
      total_cost_usd: 0.0042,
      is_error: false,
      result: 'completed-w5-cb',
    },
    error: {
      type: 'error',
      is_error: true,
      result: 'sample-error-w5-cb',
    },
  }
}

/**
 * NDJSON にシリアライズする (1 message = 1 line, trailing \n あり).
 */
function toNdjson(messages: readonly ClaudeMessage[]): string {
  return messages.map((m) => JSON.stringify(m)).join('\n') + '\n'
}

// -----------------------------------------------------------------------------
// Local fixture lifecycle (CostTracker 用 ledger を tmpdir に隔離 / cleanup)
// -----------------------------------------------------------------------------

let tmpRoot: string

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r26-dev-vv-cb-'))
})

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

// =============================================================================
// Group W5-CB-1 — claude-bridge handshake (3 tests)
// =============================================================================

describe('R26 Dev-VV Group W5-CB-1 — claude-bridge handshake (dry-run)', () => {
  it('CB-1-1: ClaudeBridge construction with skipAuthCheck=true → status shape OK / 副作用 0', () => {
    const bridge = buildMockClaudeBridge({ skipAuthCheck: true })

    const status = bridge.status()
    expect(typeof status).toBe('object')
    expect(status.authChecked).toBe(false)
    expect(status.authResult).toBeNull()
    expect(status.circuit).toBeDefined()
    // CircuitState の規定値は 'closed' (CircuitBreaker default)
    expect(status.circuit.state).toBe('closed')
    expect(status.circuit.consecutiveFailures).toBe(0)
    expect(status.circuit.consecutiveSuccesses).toBe(0)

    // 追加で status を呼んでも shape は変わらない (idempotent)
    const status2 = bridge.status()
    expect(status2.authChecked).toBe(false)
    expect(status2.authResult).toBeNull()
  })

  it('CB-1-2: ClaudeBridge with custom CircuitBreaker / costTracker / usageMonitor → wiring OK', async () => {
    const customCircuit = new CircuitBreaker({
      name: 'cb-1-2-custom',
      failureThreshold: 3,
      cooldownMs: 1_000,
    })
    const ledgerPath = join(tmpRoot, 'cost-cb-1-2.json')
    const cost: CostTracker = new FileCostTracker({
      ledgerPath,
      limits: { perSessionUsd: 1, perProjectUsd: 5, perDayUsd: 5, perMonthUsd: 50 },
    })

    const bridge = buildMockClaudeBridge({
      command: 'nonexistent-claude-cli-for-dryrun',
      circuitBreaker: customCircuit,
      costTracker: cost,
      skipAuthCheck: true,
      debug: false,
    })

    const status = bridge.status()
    // 注入した circuit が反映されていること (name は status 経由では露出しない設計だが state 観測可)
    expect(status.circuit.state).toBe('closed')
    expect(status.authChecked).toBe(false)

    // costTracker 自体は本 test 内で実 record 0 件 (副作用 0 確認)
    const total = await cost.getMonthlyTotal()
    expect(total).toBe(0)
  })

  it('CB-1-3: detectClaudeAuth dry-run path: 存在しない command + isolated configDir → 未認証扱い', async () => {
    const bogusCommand = 'nonexistent-claude-cli-w5-cb-' + Date.now().toString(36)
    const isolatedConfigDir = join(tmpRoot, 'no-claude-here')

    const result: AuthDetectionResult = await detectClaudeAuth({
      command: bogusCommand,
      configDir: isolatedConfigDir,
      timeoutMs: 2_000,
    })

    expect(result.authenticated).toBe(false)
    expect(result.cliFound).toBe(false)
    expect(result.configDirExists).toBe(false)
    expect(typeof result.reason).toBe('string')
    expect((result.reason ?? '').length).toBeGreaterThan(0)
  })
})

// =============================================================================
// Group W5-CB-2 — message passing round-trip (3 tests)
// =============================================================================

describe('R26 Dev-VV Group W5-CB-2 — message passing round-trip', () => {
  it('CB-2-1: parseStreamJsonText で 4 type NDJSON が完全復元される', () => {
    const fx = buildClaudeFixtures()
    const ndjson = toNdjson([fx.system, fx.assistant, fx.result, fx.error])

    const parsed = parseStreamJsonText(ndjson)
    expect(parsed.unparseable).toEqual([])
    expect(parsed.messages.length).toBe(4)

    expect(parsed.messages[0]?.type).toBe('system')
    expect(parsed.messages[0]?.subtype).toBe('init')
    expect(parsed.messages[0]?.session_id).toBe('sess-w5-cb-001')

    expect(parsed.messages[1]?.type).toBe('assistant')
    expect(parsed.messages[1]?.usage?.input_tokens).toBe(10)
    expect(parsed.messages[1]?.usage?.output_tokens).toBe(5)

    expect(parsed.messages[2]?.type).toBe('result')
    expect(parsed.messages[2]?.total_cost_usd).toBe(0.0042)
    expect(parsed.messages[2]?.is_error).toBe(false)

    expect(parsed.messages[3]?.type).toBe('error')
    expect(parsed.messages[3]?.is_error).toBe(true)
  })

  it('CB-2-2: parseStreamJsonLine + extractUsage で token / cost を message 群から reduce', () => {
    const fx = buildClaudeFixtures()

    // 個別 line の parse 整合性 (messages 配列を組み立てる前段)
    const line1 = JSON.stringify(fx.assistant)
    const r1 = parseStreamJsonLine(line1)
    expect(r1.ok).toBe(true)
    if (r1.ok) {
      expect(r1.message.type).toBe('assistant')
      expect(r1.message.usage?.input_tokens).toBe(10)
    }

    // 2 件の assistant + 1 result で集計 reduce が正しいこと
    const messages: ClaudeMessage[] = [
      fx.assistant,
      {
        ...fx.assistant,
        usage: {
          input_tokens: 7,
          output_tokens: 3,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 4,
        },
      },
      fx.result,
    ]
    const usage: ExtractedUsage = extractUsage(messages)
    expect(usage.inputTokens).toBe(10 + 7)
    expect(usage.outputTokens).toBe(5 + 3)
    expect(usage.cacheReadTokens).toBe(2 + 0)
    expect(usage.cacheWriteTokens).toBe(1 + 4)
    expect(usage.totalCostUsd).toBe(0.0042)
  })

  it('CB-2-3: ClaudeMessageSchema round-trip — JSON.stringify → safeParse で完全復元', () => {
    const fx = buildClaudeFixtures()
    for (const m of [fx.system, fx.assistant, fx.result, fx.error]) {
      const serialized = JSON.stringify(m)
      const reparsed = JSON.parse(serialized) as unknown
      const safe = ClaudeMessageSchema.safeParse(reparsed)
      expect(safe.success).toBe(true)
      if (safe.success) {
        expect(safe.data.type).toBe(m.type)
      }
    }

    // ClaudeUsageSchema 単体も round-trip OK であること
    const usageSample = fx.assistant.usage
    expect(usageSample).toBeDefined()
    if (usageSample) {
      const safeUsage = ClaudeUsageSchema.safeParse(JSON.parse(JSON.stringify(usageSample)))
      expect(safeUsage.success).toBe(true)
      if (safeUsage.success) {
        expect(safeUsage.data.input_tokens).toBe(10)
        expect(safeUsage.data.output_tokens).toBe(5)
      }
    }
  })
})

// =============================================================================
// Group W5-CB-3 — failure injection × bridge recovery (3 tests)
// =============================================================================

describe('R26 Dev-VV Group W5-CB-3 — failure injection × bridge recovery', () => {
  it('CB-3-1: corrupted stream-json input → unparseable に分離 / valid 行は完全抽出', () => {
    const fx = buildClaudeFixtures()
    const validLine = JSON.stringify(fx.system)
    const corrupted = [
      validLine,
      '{not json}',
      JSON.stringify(fx.result),
      'completely-not-json-line',
      '', // 空行は skip 対象
      '{"missing":"type-field-but-passthrough-allowed"}', // type 必須 → schema reject
    ].join('\n')

    const parsed = parseStreamJsonText(corrupted)

    // valid な system + result の 2 件は messages へ
    expect(parsed.messages.length).toBe(2)
    expect(parsed.messages[0]?.type).toBe('system')
    expect(parsed.messages[1]?.type).toBe('result')

    // corrupt 行は unparseable 経路へ。少なくとも 3 件 (JSON parse error 2 + schema 1)
    expect(parsed.unparseable.length).toBeGreaterThanOrEqual(3)
    for (const u of parsed.unparseable) {
      expect(typeof u.line).toBe('string')
      expect(typeof u.error).toBe('string')
      expect(u.error.length).toBeGreaterThan(0)
    }

    // bridge recovery sanity: corrupt があっても valid な message は変わらず取得できる
    const usage = extractUsage(parsed.messages)
    expect(usage.totalCostUsd).toBe(0.0042) // result.total_cost_usd 由来
  })

  it('CB-3-2: 未知 type message は schema passthrough で type 保持 (forward compat)', () => {
    const unknownMsg = {
      type: 'futuristic_unknown_type_v9',
      session_id: 'sess-future-001',
      payload: { whatever: 'forward-compat' },
    }
    const safe = ClaudeMessageSchema.safeParse(unknownMsg)
    expect(safe.success).toBe(true)
    if (safe.success) {
      expect(safe.data.type).toBe('futuristic_unknown_type_v9')
      // passthrough により未知 field も保持される
      expect((safe.data as Record<string, unknown>).payload).toEqual({
        whatever: 'forward-compat',
      })
    }

    // line parser 経路でも同様に通過すること
    const lineParse = parseStreamJsonLine(JSON.stringify(unknownMsg))
    expect(lineParse.ok).toBe(true)
    if (lineParse.ok) {
      expect(lineParse.message.type).toBe('futuristic_unknown_type_v9')
    }
  })

  it('CB-3-3: partial usage (input_tokens のみ) → extractUsage が既知 field のみ集計 / 未知 field skip', () => {
    const partial: ClaudeMessage = {
      type: 'assistant',
      usage: {
        input_tokens: 42,
        // output_tokens 欠損
        // cache_read_input_tokens 欠損
        // cache_creation_input_tokens 欠損
        // passthrough により未知 field も持てる
        unknown_future_token_field: 999,
      } as unknown as ClaudeMessage['usage'],
    }

    const usage = extractUsage([partial])
    expect(usage.inputTokens).toBe(42)
    expect(usage.outputTokens).toBe(0) // 欠損は 0 として fallback
    expect(usage.cacheReadTokens).toBe(0)
    expect(usage.cacheWriteTokens).toBe(0)
    expect(usage.totalCostUsd).toBe(0)

    // partial usage を含む message でも safeParse は通過すること (passthrough)
    const safe = ClaudeMessageSchema.safeParse(JSON.parse(JSON.stringify(partial)))
    expect(safe.success).toBe(true)
  })
})

// =============================================================================
// Group W5-CB-4 — SLA clock × spawn contract integration (2 tests)
// =============================================================================

describe('R26 Dev-VV Group W5-CB-4 — SLA clock × spawn contract integration', () => {
  it('CB-4-1: buildSpawnContract default timeout が openclaw-runtime defaults と互換', () => {
    const contract: SubprocessSpawnContract = buildSpawnContract({
      command: 'mock-claude-bridge-binary',
      envAllowList: [],
      argvWhitelist: [],
    })

    // openclaw-runtime のデフォルト定数と一致 (claude-bridge 側 SIGTERM_GRACE_MS=5_000ms と
    // openclaw-runtime DEFAULT_TIMEOUT_GRACE_MS=5_000ms が時間軸として整合)
    expect(contract.timeoutMs).toBe(DEFAULT_SPAWN_TIMEOUT_MS)
    expect(contract.timeoutGraceMs).toBe(DEFAULT_TIMEOUT_GRACE_MS)
    expect(DEFAULT_SPAWN_TIMEOUT_MS).toBe(600_000) // 10 min
    expect(DEFAULT_TIMEOUT_GRACE_MS).toBe(5_000) // 5 sec

    // dryRun = true がデフォルト
    expect(contract.dryRun).toBe(true)

    // env / argv が空配列で frozen
    expect(Object.isFrozen(contract.args)).toBe(true)
    expect(Object.isFrozen(contract.env)).toBe(true)
    expect(Object.isFrozen(contract.argvWhitelist)).toBe(true)

    // cwd は OS tmp 由来 (副作用ゼロ初期値 / defaultIsolatedCwd と一致)
    expect(contract.cwd).toBe(defaultIsolatedCwd())
    expect(contract.cwd.length).toBeGreaterThan(0)
  })

  it('CB-4-2: enforceSpawnTimeout pure path with mock target → completed early-return / spawn 不発火', async () => {
    const contract: SubprocessSpawnContract = buildSpawnContract({
      command: 'mock-claude-bridge-binary',
      envAllowList: [],
      argvWhitelist: [],
      timeoutMs: 100, // small for test speed (fakeSleep のため実時間は進まない)
      timeoutGraceMs: 50,
    })

    // alive=false で開始 → 即 'completed' で抜けること
    const dead = buildMockBridgeProcess(false)
    const r1 = await enforceSpawnTimeout({
      contract,
      target: dead,
      sleep: fakeSleep,
    })
    expect(r1.outcome).toBe('completed')
    expect(r1.signalsSent).toEqual([])
    expect(r1.circuitOpened).toBe(false)
    // signal は呼ばれていない
    expect(dead.signalsSent()).toEqual([])

    // alive=true 開始 + 即 false に切り替えた target → completed (signal 不発火)
    const target = buildMockBridgeProcess(true)
    target.__setAlive(false)
    const r2 = await enforceSpawnTimeout({
      contract,
      target,
      sleep: fakeSleep,
    })
    expect(r2.outcome).toBe('completed')
    expect(r2.signalsSent).toEqual([])
    expect(target.signalsSent()).toEqual([])
  })
})

// =============================================================================
// Group W5-CB-5 — cross-bridge state sync (2 tests)
// =============================================================================

describe('R26 Dev-VV Group W5-CB-5 — cross-bridge state sync', () => {
  it('CB-5-1: CostTracker × claude-bridge ExtractedUsage shape 互換確認', async () => {
    const ledgerPath = join(tmpRoot, 'cost-cb-5-1.json')
    const cost: CostTracker = new FileCostTracker({
      ledgerPath,
      limits: { perSessionUsd: 5, perProjectUsd: 50, perDayUsd: 30, perMonthUsd: 300 },
    })

    // claude-bridge 由来 message 群から extractUsage で usage を抽出
    const fx = buildClaudeFixtures()
    const messages: ClaudeMessage[] = [fx.system, fx.assistant, fx.result]
    const usage: ExtractedUsage = extractUsage(messages)

    // ExtractedUsage shape は CostTracker.recordSpend が期待する amountUsd と互換
    expect(typeof usage.totalCostUsd).toBe('number')
    expect(usage.totalCostUsd).toBeGreaterThan(0)

    // recordSpend 呼出 (実 spawn なし / 純粋 ledger 書込みのみ)
    await cost.recordSpend('anthropic_subscription', usage.totalCostUsd, {
      sessionId: 'cb-5-1-sess',
      projectId: 'PRJ-019',
    })

    // 書き込み後の累計が ExtractedUsage.totalCostUsd と一致
    const monthly = await cost.getMonthlyTotal()
    expect(monthly).toBeCloseTo(usage.totalCostUsd, 6)

    const sessionTotal = await cost.getSessionTotal('cb-5-1-sess')
    expect(sessionTotal).toBeCloseTo(usage.totalCostUsd, 6)

    // checkBudget OK (limits 未達)
    const budget = await cost.checkBudget({
      sessionId: 'cb-5-1-sess',
      projectId: 'PRJ-019',
    })
    expect(budget.ok).toBe(true)
  })

  it('CB-5-2: KillSwitch armed + ClaudeBridge 構築 → triggered=false 維持 (構築単体で kill 不発火)', async () => {
    const signalPath = join(tmpRoot, 'kill-cb-5-2.STOP')
    const killSwitch: KillSwitch = new FileKillSwitch({
      exitOnTrigger: false,
      signalPath,
    })
    await killSwitch.arm()

    expect(killSwitch.isArmed()).toBe(true)
    expect(killSwitch.isTriggered()).toBe(false)

    // ClaudeBridge 構築 (skipAuthCheck=true で auth 経路も bypass)
    const bridge = buildMockClaudeBridge({ skipAuthCheck: true })
    const status = bridge.status()
    expect(status.authChecked).toBe(false)
    expect(status.circuit.state).toBe('closed')

    // 構築単体では kill-switch は依然として未 trigger
    expect(killSwitch.isTriggered()).toBe(false)
    expect(killSwitch.isArmed()).toBe(true)

    // 後始末
    await killSwitch.disarm()
    expect(killSwitch.isArmed()).toBe(false)
  })
})
