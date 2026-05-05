/**
 * 17 day path W4 — File-based BreachCounter persistence (Round 21 Dev-GG)
 *
 * 担当: Dev-EE BreachCounter (in-memory pure factory) の file-based persistence layer 検証 (W4 task ②)。
 *
 * 不可侵:
 *   - Dev-EE `createBreachCounter()` 関数本体無改変
 *   - Round 19 Dev-AA / Dev-BB / Round 20 Dev-DD ファイル無改変
 *   - control 本体ファイル無改変
 *
 * test groups:
 *   Group A (append + restore, 3 tests):
 *     A-1  observe → file に JSON Lines 追記
 *     A-2  init() で file から最新 state 復元
 *     A-3  異なる loopId 連続 → count 増加 / restore で同 state
 *   Group B (atomic write / corruption recovery, 3 tests):
 *     B-1  破損 line を skip し最新 valid state を採用
 *     B-2  reset record の後に observe で count=1 から再開
 *     B-3  initialState 注入で file restore を skip
 *   Group C (lifecycle integration, 2 tests):
 *     C-1  Dev-EE BreachCounter shape 互換性 (semantics 一致)
 *     C-2  adaptFileBreachCounterAsPort で port 取得後に observe 可能
 */
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createBreachCounter } from '../17day-path-w3-rollback-permission-orchestrator.js'
import {
  adaptFileBreachCounterAsPort,
  createFileBreachCounter,
  flushPendingBreachAppends,
} from '../file-breach-counter.js'

// ---------------------------------------------------------------------------
// tmp dir helpers
// ---------------------------------------------------------------------------

let tmpRoot: string
const trackedCounters: { flush(): Promise<void> }[] = []

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'breach-counter-test-'))
  trackedCounters.length = 0
})

afterEach(async () => {
  // 全 tracked counter の pending append が file に到達するまで待ってから削除
  await Promise.all(trackedCounters.map((c) => c.flush().catch(() => undefined)))
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

function track<T extends { flush(): Promise<void> }>(c: T): T {
  trackedCounters.push(c)
  return c
}

function tmpPath(name = 'breach.jsonl'): string {
  return join(tmpRoot, name)
}

/** 直近 enqueue された全 append が file に到達するまで cooperative wait (試行 5 回) */
async function waitForFile(path: string, expectedLines: number): Promise<void> {
  for (let i = 0; i < 50; i++) {
    try {
      const content = await fs.readFile(path, 'utf-8')
      const lines = content.split('\n').filter((l) => l.length > 0)
      if (lines.length >= expectedLines) return
    } catch {
      // file not yet created
    }
    await new Promise((r) => setTimeout(r, 5))
  }
}

// ---------------------------------------------------------------------------
// Group A — append + restore
// ---------------------------------------------------------------------------

describe('W4 dev-gg group A — append + restore', () => {
  it('A-1: observe writes JSON Lines record to file', async () => {
    const path = tmpPath()
    const counter = track(createFileBreachCounter({ path }))
    await counter.init()
    counter.observe('L-1')
    await waitForFile(path, 1)
    await flushPendingBreachAppends(counter)
    const content = await fs.readFile(path, 'utf-8')
    const lines = content.split('\n').filter((l) => l.length > 0)
    expect(lines.length).toBe(1)
    const rec = JSON.parse(lines[0]!)
    expect(rec).toMatchObject({
      loopId: 'L-1',
      count: 1,
      kind: 'observe',
    })
    expect(typeof rec.recordedAt).toBe('string')
  })

  it('A-2: init() restores latest state from existing file', async () => {
    const path = tmpPath()
    const counterA = track(createFileBreachCounter({ path }))
    await counterA.init()
    counterA.observe('L-1')
    counterA.observe('L-2')
    counterA.observe('L-3')
    await waitForFile(path, 3)

    // fresh instance with same path → restore
    const counterB = track(createFileBreachCounter({ path }))
    await counterB.init()
    expect(counterB.current()).toBe(3)
    expect(counterB.lastLoopId()).toBe('L-3')
  })

  it('A-3: distinct loopId increments / same restored state across instances', async () => {
    const path = tmpPath()
    const counterA = track(createFileBreachCounter({ path }))
    await counterA.init()
    expect(counterA.observe('L-1')).toBe(1)
    expect(counterA.observe('L-2')).toBe(2)
    await waitForFile(path, 2)

    const counterB = track(createFileBreachCounter({ path }))
    await counterB.init()
    expect(counterB.current()).toBe(2)
    expect(counterB.lastLoopId()).toBe('L-2')
    // continue from restored state
    expect(counterB.observe('L-3')).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Group B — atomic write / corruption recovery
// ---------------------------------------------------------------------------

describe('W4 dev-gg group B — atomic write / corruption recovery', () => {
  it('B-1: corrupted line is skipped while latest valid state is used', async () => {
    const path = tmpPath()
    // simulate corrupted file:
    //   line1: valid observe count=1
    //   line2: garbage
    //   line3: valid observe count=2
    const lines = [
      JSON.stringify({
        loopId: 'L-1',
        count: 1,
        recordedAt: '2026-05-05T12:00:00.000Z',
        kind: 'observe',
      }),
      '{this is not json',
      JSON.stringify({
        loopId: 'L-2',
        count: 2,
        recordedAt: '2026-05-05T12:00:01.000Z',
        kind: 'observe',
      }),
    ]
    await fs.mkdir(tmpRoot, { recursive: true })
    await fs.writeFile(path, lines.join('\n') + '\n', 'utf-8')

    const counter = track(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(2)
    expect(counter.lastLoopId()).toBe('L-2')
  })

  it('B-2: reset record resets count → next observe starts at 1', async () => {
    const path = tmpPath()
    const lines = [
      JSON.stringify({
        loopId: 'L-1',
        count: 1,
        recordedAt: '2026-05-05T12:00:00.000Z',
        kind: 'observe',
      }),
      JSON.stringify({
        loopId: 'L-2',
        count: 2,
        recordedAt: '2026-05-05T12:00:01.000Z',
        kind: 'observe',
      }),
      JSON.stringify({
        loopId: null,
        count: 0,
        recordedAt: '2026-05-05T12:00:02.000Z',
        kind: 'reset',
      }),
    ]
    await fs.writeFile(path, lines.join('\n') + '\n', 'utf-8')
    const counter = track(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBe(null)
    // continue
    expect(counter.observe('L-3')).toBe(1)
  })

  it('B-3: initialState injection skips file restore', async () => {
    const path = tmpPath()
    // pre-write some records to the file
    await fs.writeFile(
      path,
      JSON.stringify({
        loopId: 'L-X',
        count: 99,
        recordedAt: '2026-05-05T12:00:00.000Z',
        kind: 'observe',
      }) + '\n',
      'utf-8',
    )
    const counter = createFileBreachCounter({
      path,
      initialState: { count: 0, lastLoopId: null },
    })
    await counter.init()
    // initialState wins over file content
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBe(null)
  })
})

// ---------------------------------------------------------------------------
// Group C — lifecycle integration
// ---------------------------------------------------------------------------

describe('W4 dev-gg group C — lifecycle integration', () => {
  it('C-1: semantics match Dev-EE in-memory createBreachCounter', async () => {
    const path = tmpPath()
    const fileC = track(createFileBreachCounter({ path }))
    await fileC.init()
    const memC = createBreachCounter()

    // identical operation sequence
    expect(fileC.observe('L-1')).toBe(memC.observe('L-1'))
    expect(fileC.observe('L-1')).toBe(memC.observe('L-1')) // same loopId clamp
    expect(fileC.observe('L-2')).toBe(memC.observe('L-2'))
    expect(fileC.current()).toBe(memC.current())
    expect(fileC.lastLoopId()).toBe(memC.lastLoopId())
    fileC.reset()
    memC.reset()
    expect(fileC.current()).toBe(memC.current())
    expect(fileC.lastLoopId()).toBe(memC.lastLoopId())
  })

  it('C-2: adaptFileBreachCounterAsPort returns init-completed counter port', async () => {
    const path = tmpPath()
    const fileC = track(createFileBreachCounter({ path }))
    const port = await adaptFileBreachCounterAsPort(fileC)
    // observe should work immediately (init was awaited inside adapter)
    expect(port.observe('L-1')).toBe(1)
    expect(port.current()).toBe(1)
  })

  it('C-3: multiple init() calls are idempotent', async () => {
    const path = tmpPath()
    const counter = track(createFileBreachCounter({ path }))
    await counter.init()
    counter.observe('L-1')
    await waitForFile(path, 1)
    await counter.init() // re-call should be no-op (no double restore)
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('L-1')
  })
})
