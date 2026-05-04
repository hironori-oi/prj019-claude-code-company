/**
 * cli-barrel-export.test — Round 12 Dev-D 着地 (Task B):
 *   cli/index.ts barrel export の健全性確認 + alias 衝突なし確認。
 *
 * カバー範囲:
 *   - cli barrel から spawn-claude-code / session-controller / subscription-router /
 *     cli-version-check の主要 API が引ける
 *   - openclaw-runtime root から `cli` namespace export 経由で引ける
 *   - 既存 import path (cli/spawn-claude-code.js 等) は完全互換
 *   - skill-adapter/subprocess.ts と alias 衝突なし
 */
import { describe, it, expect } from 'vitest'

// barrel 経由
import * as cli from '../index.js'
import * as cliBarrel from '../index.js'
// 個別 module 経由 (既存 import path)
import * as spawnDirect from '../spawn-claude-code.js'
import * as sessionDirect from '../session-controller.js'
import * as routerDirect from '../subscription-router.js'
import * as versionDirect from '../cli-version-check.js'
// runtime root export 経由
import { cli as cliNamespace } from '../../index.js'
// skill-adapter alias 衝突確認用
import * as skillSubprocess from '../../skill-adapter/subprocess.js'

describe('Round 12 Dev-D Task B: cli barrel export 健全性', () => {
  it('1. cli barrel から spawn-claude-code 主要 export が引ける', () => {
    expect(typeof cli.spawnClaudeCode).toBe('function')
    expect(typeof cli.extractJsonEvents).toBe('function')
    expect(typeof cli.adaptRealChildProcess).toBe('function')
    expect(typeof cli.wireSpawnHandleToKillSwitch).toBe('function')
  })

  it('2. cli barrel から session-controller 主要 export が引ける', () => {
    expect(typeof cli.createSessionController).toBe('function')
    expect(typeof cli.isTransitionAllowed).toBe('function')
    expect(typeof cli.awaitSessionFinish).toBe('function')
  })

  it('3. cli barrel から subscription-router 主要 export が引ける', () => {
    expect(typeof cli.selectSpawnMode).toBe('function')
    expect(typeof cli.decisionToMode).toBe('function')
    expect(typeof cli.projectRequiredBudgetUsd).toBe('function')
    expect(typeof cli.isSubscriptionEligible).toBe('function')
    expect(typeof cli.spawnFromDecision).toBe('function')
  })

  it('4. cli barrel から cli-version-check 主要 export が引ける', () => {
    expect(typeof cli.checkClaudeCodeVersion).toBe('function')
    expect(typeof cli.parseClaudeCodeVersion).toBe('function')
    expect(typeof cli.isVersionInRange).toBe('function')
    expect(cli.DEFAULT_ACCEPTED_RANGE).toBeDefined()
    expect(cli.DEFAULT_ACCEPTED_RANGE.minMajor).toBe(1)
  })

  it('5. 既存 import path (個別 module 直接) は完全互換', () => {
    // 同じ関数 reference を指すこと
    expect(cli.spawnClaudeCode).toBe(spawnDirect.spawnClaudeCode)
    expect(cli.createSessionController).toBe(sessionDirect.createSessionController)
    expect(cli.selectSpawnMode).toBe(routerDirect.selectSpawnMode)
    expect(cli.parseClaudeCodeVersion).toBe(versionDirect.parseClaudeCodeVersion)
  })

  it('6. openclaw-runtime root から cli namespace export 経由で引ける', () => {
    expect(typeof cliNamespace.spawnClaudeCode).toBe('function')
    expect(typeof cliNamespace.selectSpawnMode).toBe('function')
    expect(typeof cliNamespace.checkClaudeCodeVersion).toBe('function')
    // 同一 reference
    expect(cliNamespace.spawnClaudeCode).toBe(spawnDirect.spawnClaudeCode)
  })

  it('7. skill-adapter/subprocess.ts と alias 衝突なし (cli barrel に SubprocessHandle 等を re-export しない)', () => {
    // cli barrel に subprocess (skill-adapter 由来) の名前が漏れていないことを確認
    const cliKeys = new Set(Object.keys(cliBarrel))
    // skill-adapter/subprocess.ts の固有 export
    const skillKeys = ['runSubprocessAdapter', 'splitLinesFromChunk', 'detectInteractiveInLines']
    for (const k of skillKeys) {
      expect(cliKeys.has(k)).toBe(false)
    }
    // skill-adapter 側からは引ける
    expect(typeof skillSubprocess.runSubprocessAdapter).toBe('function')
    expect(typeof skillSubprocess.splitLinesFromChunk).toBe('function')
    expect(typeof skillSubprocess.detectInteractiveInLines).toBe('function')
  })

  it('8. cli barrel が overload export を持たない (各シンボルは 1 origin module のみ)', () => {
    // 主要 function 群が全て distinct な origin から来ていることをチェック
    // (= 同名 alias collision で undefined にならないこと)
    expect(cliBarrel.spawnClaudeCode).toBeDefined()
    expect(cliBarrel.createSessionController).toBeDefined()
    expect(cliBarrel.selectSpawnMode).toBeDefined()
    expect(cliBarrel.checkClaudeCodeVersion).toBeDefined()
    expect(cliBarrel.wireSpawnHandleToKillSwitch).toBeDefined()
    expect(cliBarrel.spawnFromDecision).toBeDefined()
  })
})
