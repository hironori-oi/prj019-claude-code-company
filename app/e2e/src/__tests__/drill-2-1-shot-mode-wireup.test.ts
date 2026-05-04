/**
 * drill-2-1-shot-mode-wireup.test — Round 14 Dev-C 着地 (Task B, テスト):
 *   Round 13 Dev-C drill-2 harness の real-mode wire-up を検証する unit test (8-12 tests 目標)。
 *
 *   検証範囲:
 *     - parseHarnessArgs: --mode dry-run / --mode real / --dry-run / 不正値 / 未指定
 *     - shouldUseRealSpawn: HarnessCliArgs → boolean 判定
 *     - DRILL_2_SCENARIOS との整合性 (--scenario 指定 + mode 切替)
 *     - real-mode 設定時の overall 動作 (実 spawn は呼ばない、loader 検証のみ)
 *
 *   real spawn 自体は OS 副作用を伴うため本 test では呼ばない (5/7 朝 06:00 operator が実行)。
 */
import { describe, it, expect } from 'vitest'

import {
  parseHarnessArgs,
  shouldUseRealSpawn,
  DRILL_2_SCENARIOS,
  type HarnessCliArgs,
} from './drill-2-1-shot-real-execution.harness.js'

describe('drill-2-1-shot harness / parseHarnessArgs --mode (R14 Dev-C)', () => {
  it('1. default: mode=dry-run, dryRun=false (--dry-run 未指定)', () => {
    const a = parseHarnessArgs([])
    expect(a.mode).toBe('dry-run')
    expect(a.dryRun).toBe(false)
  })

  it('2. --mode real: mode=real, dryRun=false', () => {
    const a = parseHarnessArgs(['--mode', 'real'])
    expect(a.mode).toBe('real')
    expect(a.dryRun).toBe(false)
  })

  it('3. --mode dry-run: mode=dry-run, dryRun=true', () => {
    const a = parseHarnessArgs(['--mode', 'dry-run'])
    expect(a.mode).toBe('dry-run')
    expect(a.dryRun).toBe(true)
  })

  it('4. --dry-run flag (legacy): mode=dry-run, dryRun=true (互換)', () => {
    const a = parseHarnessArgs(['--dry-run'])
    expect(a.mode).toBe('dry-run')
    expect(a.dryRun).toBe(true)
  })

  it('5. --mode 不正値 (例 --mode foo): default dry-run を維持', () => {
    const a = parseHarnessArgs(['--mode', 'foo'])
    expect(a.mode).toBe('dry-run')
    expect(a.dryRun).toBe(false)
  })

  it('6. --mode real --dry-run 同時指定: 後者 (--dry-run) が勝つと旧来動作', () => {
    // 引数解析は順次評価のため、後出しが上書き
    const a = parseHarnessArgs(['--mode', 'real', '--dry-run'])
    expect(a.dryRun).toBe(true)
    expect(a.mode).toBe('dry-run')
  })

  it('7. --dry-run --mode real 同時指定: --mode real が後勝ち', () => {
    const a = parseHarnessArgs(['--dry-run', '--mode', 'real'])
    expect(a.mode).toBe('real')
    expect(a.dryRun).toBe(false)
  })

  it('8. --mode real --date 2026-05-07 --cli-path /usr/local/bin/claude: 5/7 operator 想定 args', () => {
    const a = parseHarnessArgs([
      '--mode',
      'real',
      '--date',
      '2026-05-07',
      '--cli-path',
      '/usr/local/bin/claude',
    ])
    expect(a.mode).toBe('real')
    expect(a.dryRun).toBe(false)
    expect(a.date).toBe('2026-05-07')
    expect(a.cliPath).toBe('/usr/local/bin/claude')
  })
})

describe('drill-2-1-shot harness / shouldUseRealSpawn (R14 Dev-C)', () => {
  it('9. mode=real, dryRun=false → true', () => {
    const args: HarnessCliArgs = {
      date: '2026-05-07',
      mode: 'real',
      dryRun: false,
      verbose: false,
    }
    expect(shouldUseRealSpawn(args)).toBe(true)
  })

  it('10. mode=dry-run → false (legacy dryRun フラグも false で一致)', () => {
    const args: HarnessCliArgs = {
      date: '2026-05-07',
      mode: 'dry-run',
      dryRun: true,
      verbose: false,
    }
    expect(shouldUseRealSpawn(args)).toBe(false)
  })

  it('11. mode=real だが dryRun=true (legacy 強制): false', () => {
    // 競合時は dryRun=true が強制 false を返す
    const args: HarnessCliArgs = {
      date: '2026-05-07',
      mode: 'real',
      dryRun: true,
      verbose: false,
    }
    expect(shouldUseRealSpawn(args)).toBe(false)
  })

  it('12. parseHarnessArgs 経由 + shouldUseRealSpawn: real / dry-run 切替動作確認', () => {
    expect(shouldUseRealSpawn(parseHarnessArgs(['--mode', 'real']))).toBe(true)
    expect(shouldUseRealSpawn(parseHarnessArgs(['--mode', 'dry-run']))).toBe(
      false,
    )
    expect(shouldUseRealSpawn(parseHarnessArgs([]))).toBe(false)
    expect(shouldUseRealSpawn(parseHarnessArgs(['--dry-run']))).toBe(false)
  })

  it('13. DRILL_2_SCENARIOS 9 件を mode=real --scenario 指定で 1 件絞れる', () => {
    const a = parseHarnessArgs([
      '--mode',
      'real',
      '--scenario',
      'kill_switch_trigger',
    ])
    expect(a.scenario).toBe('kill_switch_trigger')
    expect(DRILL_2_SCENARIOS).toContain(a.scenario as 'kill_switch_trigger')
    expect(shouldUseRealSpawn(a)).toBe(true)
  })

  it('14. 5/7 朝 06:00 operator 完全 args: --mode real --date 2026-05-07 --cli-path /usr/local/bin/claude --verbose', () => {
    const a = parseHarnessArgs([
      '--mode',
      'real',
      '--date',
      '2026-05-07',
      '--cli-path',
      '/usr/local/bin/claude',
      '--verbose',
    ])
    expect(shouldUseRealSpawn(a)).toBe(true)
    expect(a.date).toBe('2026-05-07')
    expect(a.verbose).toBe(true)
    expect(a.cliPath).toBe('/usr/local/bin/claude')
  })
})
