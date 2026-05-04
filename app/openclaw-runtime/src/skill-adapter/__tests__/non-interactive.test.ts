/**
 * skill-adapter/non-interactive.test — Round 10 案 10-α 前倒し (CB-D-W3-04):
 *   skill 起動時の非対話モード adapter の単体 test。
 *
 * カバー範囲 (12+ tests):
 *   1. interactive prompt detection - 英語 6 件 + 日本語 4 件
 *   2. case-insensitive 検出
 *   3. resolveNonInteractive - interactive 判定で fail-safe default 返却
 *   4. resolveNonInteractive - JSON 出力 + schema OK で parsed 値返却
 *   5. resolveNonInteractive - JSON 不正で unresolvable
 *   6. resolveNonInteractive - JSON OK だが schema 不一致で unresolvable
 *   7. matchedPattern が記録される
 *   8. caller-side の detectorPatterns 上書き OK
 *   9. caseInsensitive=false 切替 OK
 *   10. FAIL_SAFE_DEFAULTS が freeze されている
 *   11. INTERACTIVE_PROMPT_PATTERNS が freeze されている
 *   12. fixture: dev_kickoff_approval JSON IF 整合性
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

import {
  FAIL_SAFE_DEFAULTS,
  INTERACTIVE_PROMPT_PATTERNS,
  isInteractivePrompt,
  resolveNonInteractive,
} from '../non-interactive.js'

describe('skill-adapter/non-interactive — Round 10 案 10-α 前倒し (CB-D-W3-04)', () => {
  it('1a. 英語 interactive prompt 6 件を detection', () => {
    const prompts = [
      'Do you want to continue?',
      'Are you sure you want to delete?',
      'continue? (y/n)',
      'Press enter to continue',
      'Enter your password:',
      'Type yes to confirm',
    ]
    for (const p of prompts) expect(isInteractivePrompt(p)).toBe(true)
  })

  it('1b. 日本語 interactive prompt 4 件を detection', () => {
    const prompts = [
      '続行しますか? y/n',
      '実行しますか',
      'よろしいですか',
      'パスワードを入力してください',
    ]
    for (const p of prompts) expect(isInteractivePrompt(p)).toBe(true)
  })

  it('2. case-insensitive 検出 (default true)', () => {
    expect(isInteractivePrompt('DO YOU WANT TO CONTINUE')).toBe(true)
    expect(isInteractivePrompt('Continue? (Y/N)')).toBe(true)
  })

  it('3. resolveNonInteractive - interactive 判定で fail-safe default 返却', () => {
    const schema = z.object({ ok: z.boolean() })
    const result = resolveNonInteractive('Do you want to continue?', {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.interactiveDetected).toBe(true)
    expect(result.action).toBe('fail_safe_default')
    expect(result.resolved).toEqual({ ok: false })
    expect(result.failSafeValue).toEqual({ ok: false })
    expect(result.parsedValue).toBeUndefined()
  })

  it('4. resolveNonInteractive - JSON 出力 + schema OK で parsed 値返却', () => {
    const schema = z.object({ proposalId: z.string(), score: z.number() })
    const json = JSON.stringify({ proposalId: 'kickoff-001', score: 87 })
    const result = resolveNonInteractive(json, {
      schema,
      failSafeDefault: { proposalId: 'fallback', score: 0 },
    })
    expect(result.interactiveDetected).toBe(false)
    expect(result.action).toBe('parsed')
    expect(result.resolved).toEqual({ proposalId: 'kickoff-001', score: 87 })
    expect(result.parsedValue).toEqual({ proposalId: 'kickoff-001', score: 87 })
    expect(result.failSafeValue).toBeUndefined()
  })

  it('5. resolveNonInteractive - JSON 不正で unresolvable', () => {
    const schema = z.object({ ok: z.boolean() })
    const result = resolveNonInteractive('not a json string', {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.interactiveDetected).toBe(false)
    expect(result.action).toBe('unresolvable')
    expect(result.resolved).toBeUndefined()
  })

  it('6. resolveNonInteractive - JSON OK だが schema 不一致で unresolvable', () => {
    const schema = z.object({ ok: z.boolean() })
    const json = JSON.stringify({ different: 'shape' })
    const result = resolveNonInteractive(json, {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.interactiveDetected).toBe(false)
    expect(result.action).toBe('unresolvable')
    expect(result.resolved).toBeUndefined()
  })

  it('7. matchedPattern が記録される', () => {
    const schema = z.object({ ok: z.boolean() })
    const result = resolveNonInteractive('continue? (y/n)', {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.matchedPattern).toBeDefined()
    expect(result.matchedPattern!.toLowerCase()).toContain('y/n')
  })

  it('8. caller-side detectorPatterns 上書き OK', () => {
    expect(
      isInteractivePrompt('FOOBAR_CUSTOM_PROMPT', {
        patterns: ['foobar_custom_prompt'],
      }),
    ).toBe(true)
    expect(
      isInteractivePrompt('Do you want to continue?', {
        patterns: ['foobar_custom_prompt'],
      }),
    ).toBe(false)
  })

  it('9. caseInsensitive=false 切替 OK', () => {
    expect(
      isInteractivePrompt('DO YOU WANT TO CONTINUE', {
        caseInsensitive: false,
      }),
    ).toBe(false)
    expect(
      isInteractivePrompt('do you want to continue', {
        caseInsensitive: false,
      }),
    ).toBe(true)
  })

  it('10. FAIL_SAFE_DEFAULTS が freeze されている', () => {
    expect(Object.isFrozen(FAIL_SAFE_DEFAULTS)).toBe(true)
    expect(FAIL_SAFE_DEFAULTS.confirmDeny).toBe(false)
    expect(FAIL_SAFE_DEFAULTS.emptyString).toBe('')
    expect(FAIL_SAFE_DEFAULTS.zeroNumber).toBe(0)
  })

  it('11. INTERACTIVE_PROMPT_PATTERNS が freeze されている', () => {
    expect(Object.isFrozen(INTERACTIVE_PROMPT_PATTERNS)).toBe(true)
    expect(INTERACTIVE_PROMPT_PATTERNS.length).toBeGreaterThan(10)
  })

  it('12. dev_kickoff_approval JSON IF 整合性 - openclaw-to-ceo schema と互換 fixture', () => {
    // 9 種 HITL の dev_kickoff_approval 入力を模擬
    // openclaw-to-ceo.schema.ts の ProposalContent と互換 shape
    const proposalSchema = z.object({
      proposalId: z.string().min(1),
      projectSummary: z.string().min(20),
      estimatedCostUsd: z.number().min(0),
      estimatedEffortDays: z.number().min(0),
    })
    const fixture = {
      proposalId: 'kickoff-2026-05-04-r10',
      projectSummary:
        'Round 10 dev-α 前倒し statics 検証用 fixture (>20 文字を満たす)。',
      estimatedCostUsd: 0,
      estimatedEffortDays: 0.5,
    }
    const json = JSON.stringify(fixture)
    const result = resolveNonInteractive(json, {
      schema: proposalSchema,
      failSafeDefault: {
        proposalId: 'fallback',
        projectSummary: 'failsafe fallback summary >20 文字確保用 padding を付与',
        estimatedCostUsd: 0,
        estimatedEffortDays: 0,
      },
    })
    expect(result.action).toBe('parsed')
    expect(result.parsedValue).toEqual(fixture)
  })

  it('13. interactive prompt の中に JSON が混じっていても安全側に倒す', () => {
    const schema = z.object({ ok: z.boolean() })
    // skill 出力に prompt 文字列と JSON が混じっているような ambiguous case
    const mixed = 'Do you want to continue? {"ok":true}'
    const result = resolveNonInteractive(mixed, {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.interactiveDetected).toBe(true)
    expect(result.action).toBe('fail_safe_default')
    expect(result.resolved).toEqual({ ok: false })
  })

  it('14. 純関数性 - 同一入力で同一出力 (副作用 0)', () => {
    const schema = z.object({ ok: z.boolean() })
    const a = resolveNonInteractive('Do you want to continue?', {
      schema,
      failSafeDefault: { ok: false },
    })
    const b = resolveNonInteractive('Do you want to continue?', {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(a).toEqual(b)
  })

  it('15. interactive ではない通常文 + 非 JSON は unresolvable (caller fail-safe 委譲)', () => {
    const schema = z.object({ ok: z.boolean() })
    const result = resolveNonInteractive('Hello, this is a normal log line', {
      schema,
      failSafeDefault: { ok: false },
    })
    expect(result.interactiveDetected).toBe(false)
    expect(result.action).toBe('unresolvable')
    expect(result.resolved).toBeUndefined()
  })
})
