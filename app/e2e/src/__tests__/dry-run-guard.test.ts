/**
 * dry-run-guard.test — Round 10 R10 Dev-γ 前倒し (CB-D-W4-01):
 *   harness/src/dry-run-guard.ts (G-12 hardguard) のテスト。
 *
 * カバー範囲 (8 tests):
 *   1. dry mode - fs writeFile 試行 → DryRunRejectError throw / fn 呼ばれない
 *   2. dry mode - net fetch 試行 → throw / sideEffectsRecorded[0].category='net'
 *   3. dry mode - spawn 試行 → throw / blocked=true
 *   4. live mode - fs writeFile 試行 → 素通り / blocked=false / 戻り値返却
 *   5. countByCategory - 複数副作用試行で集計値が正しい
 *   6. warnInsteadOfThrow - throw せず undefined 返却 / record は残る
 *   7. reset - records / counter がクリアされる
 *   8. isDryRun - mode='dry' で true / mode='live' で false
 */
import { describe, it, expect, vi } from 'vitest'

// 既存 harness/src/index.ts は無改変なので、dry-run-guard は直接 path import する
import { createDryRunGuard, DryRunRejectError } from '../../../harness/src/dry-run-guard.js'

describe('dry-run-guard (G-12 hardguard / CB-D-W4-01 pre-emption)', () => {
  it('1. dry mode - fs writeFile 試行 → throw / fn 呼ばれない', async () => {
    const guard = createDryRunGuard({ mode: 'dry' })
    const fnSpy = vi.fn(async () => 'should_not_run')
    await expect(
      guard.wrap('fs', 'fs.writeFile', fnSpy),
    ).rejects.toBeInstanceOf(DryRunRejectError)
    expect(fnSpy).not.toHaveBeenCalled()
    expect(guard.sideEffectsRecorded).toHaveLength(1)
    expect(guard.sideEffectsRecorded[0]!.category).toBe('fs')
    expect(guard.sideEffectsRecorded[0]!.blocked).toBe(true)
  })

  it('2. dry mode - net fetch 試行 → throw / category=net', async () => {
    const guard = createDryRunGuard({ mode: 'dry' })
    await expect(
      guard.wrap('net', 'fetch', async () => globalThis.fetch('https://example.com')),
    ).rejects.toBeInstanceOf(DryRunRejectError)
    expect(guard.sideEffectsRecorded[0]!.category).toBe('net')
    expect(guard.sideEffectsRecorded[0]!.name).toBe('fetch')
  })

  it('3. dry mode - spawn 試行 → throw / blocked=true', async () => {
    const guard = createDryRunGuard({ mode: 'dry' })
    await expect(
      guard.wrap('spawn', 'child_process.spawn', () => undefined, { cmd: 'echo' }),
    ).rejects.toBeInstanceOf(DryRunRejectError)
    expect(guard.sideEffectsRecorded[0]!.blocked).toBe(true)
    expect(guard.sideEffectsRecorded[0]!.meta).toEqual({ cmd: 'echo' })
  })

  it('4. live mode - fs writeFile 試行 → 素通り / blocked=false / 戻り値返却', async () => {
    const guard = createDryRunGuard({ mode: 'live' })
    const result = await guard.wrap('fs', 'fs.writeFile', async () => 'wrote')
    expect(result).toBe('wrote')
    expect(guard.sideEffectsRecorded[0]!.blocked).toBe(false)
  })

  it('5. countByCategory - 複数副作用試行で集計値が正しい', async () => {
    const guard = createDryRunGuard({ mode: 'live' })
    await guard.wrap('fs', 'fs.read', () => 1)
    await guard.wrap('fs', 'fs.write', () => 2)
    await guard.wrap('net', 'fetch', () => 3)
    await guard.wrap('spawn', 'spawn', () => 4)
    const counts = guard.countByCategory()
    expect(counts.fs).toBe(2)
    expect(counts.net).toBe(1)
    expect(counts.spawn).toBe(1)
    expect(counts.process).toBe(0)
    expect(counts.other).toBe(0)
  })

  it('6. warnInsteadOfThrow - throw せず undefined 返却 / record は残る', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const guard = createDryRunGuard({ mode: 'dry', warnInsteadOfThrow: true })
    const r = await guard.wrap('fs', 'fs.writeFile', async () => 'should_not_run')
    expect(r).toBeUndefined()
    expect(guard.sideEffectsRecorded).toHaveLength(1)
    expect(guard.sideEffectsRecorded[0]!.blocked).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('7. reset - records / counter がクリアされる', async () => {
    const guard = createDryRunGuard({ mode: 'live' })
    await guard.wrap('fs', 'fs.write', () => 1)
    await guard.wrap('net', 'fetch', () => 2)
    expect(guard.sideEffectsRecorded).toHaveLength(2)
    guard.reset()
    expect(guard.sideEffectsRecorded).toHaveLength(0)
    await guard.wrap('fs', 'fs.read', () => 3)
    // id は 1 から再開
    expect(guard.sideEffectsRecorded[0]!.id).toBe(1)
  })

  it('8. isDryRun - mode により true/false', () => {
    const dry = createDryRunGuard({ mode: 'dry' })
    const live = createDryRunGuard({ mode: 'live' })
    expect(dry.isDryRun).toBe(true)
    expect(live.isDryRun).toBe(false)
    expect(dry.mode).toBe('dry')
    expect(live.mode).toBe('live')
  })
})
