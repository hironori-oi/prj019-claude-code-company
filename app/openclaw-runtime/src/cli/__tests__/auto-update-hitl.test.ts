/**
 * auto-update-hitl.test — Round 13 Dev-D 着地 (Task B):
 *   HITL gate 第 12 種 cli_version_update_approval の payload builder 検証。
 *
 * カバー範囲:
 *   - shouldRequestApproval 判定
 *   - suggestApproveActionFor / classifyRisk の outcome 分岐
 *   - buildTitleAndMessage の文言固定化 (ja UI / 既存 hitl-gate と整合)
 *   - buildCliVersionUpdateHitlRequest の zod 構造化検証 (4 outcome 全て)
 *   - 'ok' 時は null 返却
 *   - payload schema 違反時 throw
 */
import { describe, it, expect } from 'vitest'
import {
  CLI_VERSION_UPDATE_APPROVAL_TYPE,
  CliVersionApproveActionSchema,
  CliVersionRejectActionSchema,
  CliVersionUpdateApprovalPayloadSchema,
  shouldRequestApproval,
  suggestApproveActionFor,
  classifyRisk,
  buildTitleAndMessage,
  buildCliVersionUpdateHitlRequest,
} from '../auto-update-hitl.js'
import type {
  CliVersionCheckResult,
  AcceptedRange,
} from '../cli-version-check.js'

const FIXED_NOW = '2026-05-04T12:34:56.789Z'
const ACCEPTED: AcceptedRange = Object.freeze({
  minMajor: 1,
  minMinor: 0,
  maxMajorExclusive: 2,
})

describe('Round 13 Dev-D Task B: cli auto-update HITL gate (第 12 種)', () => {
  describe('純関数 helper', () => {
    it('1. CLI_VERSION_UPDATE_APPROVAL_TYPE 定数が固定化されている', () => {
      expect(CLI_VERSION_UPDATE_APPROVAL_TYPE).toBe('cli_version_update_approval')
    })

    it('2. shouldRequestApproval: ok は false、その他 4 つは true', () => {
      const okResult: CliVersionCheckResult = {
        outcome: 'ok',
        version: { major: 1, minor: 5, patch: 0 },
        rawStdout: 'claude-code 1.5.0',
        rawStderr: '',
        warning: null,
        fallbackToDryRun: false,
      }
      expect(shouldRequestApproval(okResult)).toBe(false)

      const out: CliVersionCheckResult = {
        outcome: 'out_of_range',
        version: { major: 2, minor: 0, patch: 0 },
        rawStdout: 'claude-code 2.0.0',
        rawStderr: '',
        warning: 'outside accepted range',
        fallbackToDryRun: true,
      }
      expect(shouldRequestApproval(out)).toBe(true)
    })

    it('3. suggestApproveActionFor outcome 分岐', () => {
      expect(suggestApproveActionFor('out_of_range')).toBe('halt_for_manual_update')
      expect(suggestApproveActionFor('unparseable')).toBe('continue_with_warning')
      expect(suggestApproveActionFor('spawn_failed')).toBe('switch_to_dry_run')
      expect(suggestApproveActionFor('timeout')).toBe('switch_to_dry_run')
      expect(suggestApproveActionFor('ok')).toBe('continue_with_warning')
    })

    it('4. classifyRisk outcome 分岐', () => {
      expect(classifyRisk('out_of_range')).toBe('high')
      expect(classifyRisk('spawn_failed')).toBe('medium')
      expect(classifyRisk('timeout')).toBe('medium')
      expect(classifyRisk('unparseable')).toBe('low')
      expect(classifyRisk('ok')).toBe('low')
    })

    it('5. buildTitleAndMessage が outcome ごとに固定文言を返す', () => {
      const r1 = buildTitleAndMessage(
        {
          outcome: 'out_of_range',
          version: { major: 2, minor: 0, patch: 0 },
          rawStdout: '',
          rawStderr: '',
          warning: null,
          fallbackToDryRun: true,
        },
        ACCEPTED,
      )
      expect(r1.title).toContain('範囲外')
      expect(r1.message).toContain('2.0.0')
      expect(r1.message).toContain('1.0')

      const r2 = buildTitleAndMessage(
        {
          outcome: 'unparseable',
          version: null,
          rawStdout: '',
          rawStderr: '',
          warning: null,
          fallbackToDryRun: true,
        },
        ACCEPTED,
      )
      expect(r2.title).toContain('parse')

      const r3 = buildTitleAndMessage(
        {
          outcome: 'timeout',
          version: null,
          rawStdout: '',
          rawStderr: '',
          warning: 'timed out after 5000ms',
          fallbackToDryRun: true,
        },
        ACCEPTED,
      )
      expect(r3.title).toContain('timeout')
      expect(r3.message).toContain('5000')
    })
  })

  describe('buildCliVersionUpdateHitlRequest (build payload)', () => {
    it('6. ok 結果は null を返す (gate 発火対象外)', () => {
      const ok: CliVersionCheckResult = {
        outcome: 'ok',
        version: { major: 1, minor: 5, patch: 0 },
        rawStdout: 'claude-code 1.5.0',
        rawStderr: '',
        warning: null,
        fallbackToDryRun: false,
      }
      const req = buildCliVersionUpdateHitlRequest(ok, {
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      expect(req).toBeNull()
    })

    it('7. out_of_range payload: type / risk / approveAction / version が固定', () => {
      const oor: CliVersionCheckResult = {
        outcome: 'out_of_range',
        version: { major: 2, minor: 0, patch: 0 },
        rawStdout: 'claude-code 2.0.0',
        rawStderr: '',
        warning: 'claude-code version 2.0.0 is outside accepted range [1.0, 2.0)',
        fallbackToDryRun: true,
      }
      const req = buildCliVersionUpdateHitlRequest(oor, {
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      expect(req).not.toBeNull()
      expect(req!.type).toBe('cli_version_update_approval')
      expect(req!.risk).toBe('high')
      expect(req!.approveAction).toBe('halt_for_manual_update')
      expect(req!.rejectAction).toBe('switch_to_dry_run')
      // discriminated union: out_of_range 型のみ version が semver
      const p = req!.payload as Extract<typeof req extends { payload: infer P } ? P : never, { outcome: 'out_of_range' }>
      expect(p.outcome).toBe('out_of_range')
      // out_of_range の場合 version は SemverParts
      if (p.outcome === 'out_of_range') {
        expect(p.version.major).toBe(2)
      }
      expect(p.meta.detectedAt).toBe(FIXED_NOW)
      expect(p.meta.fallbackToDryRun).toBe(true)
    })

    it('8. unparseable payload: version が null + low risk', () => {
      const upp: CliVersionCheckResult = {
        outcome: 'unparseable',
        version: null,
        rawStdout: 'binary garbage \x01\x02',
        rawStderr: '',
        warning: 'stdout could not be parsed as semver',
        fallbackToDryRun: true,
      }
      const req = buildCliVersionUpdateHitlRequest(upp, {
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      expect(req).not.toBeNull()
      expect(req!.risk).toBe('low')
      expect(req!.approveAction).toBe('continue_with_warning')
      expect(req!.payload.outcome).toBe('unparseable')
      // unparseable は version=null
      if (req!.payload.outcome === 'unparseable') {
        expect(req!.payload.version).toBeNull()
      }
    })

    it('9. spawn_failed payload: medium risk + switch_to_dry_run', () => {
      const sf: CliVersionCheckResult = {
        outcome: 'spawn_failed',
        version: null,
        rawStdout: '',
        rawStderr: 'no such file',
        warning: 'spawner threw: ENOENT',
        fallbackToDryRun: true,
      }
      const req = buildCliVersionUpdateHitlRequest(sf, {
        cliPath: '/missing',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      expect(req!.risk).toBe('medium')
      expect(req!.approveAction).toBe('switch_to_dry_run')
      expect(req!.rejectAction).toBe('switch_to_dry_run')
      expect(req!.payload.meta.stderrPreview).toContain('no such file')
    })

    it('10. timeout payload: timeoutMs が必須化されている', () => {
      const to: CliVersionCheckResult = {
        outcome: 'timeout',
        version: null,
        rawStdout: '',
        rawStderr: '',
        warning: 'timed out after 5000ms',
        fallbackToDryRun: true,
      }
      const req = buildCliVersionUpdateHitlRequest(to, {
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
        timeoutMs: 5000,
      })
      expect(req!.risk).toBe('medium')
      expect(req!.payload.outcome).toBe('timeout')
      if (req!.payload.outcome === 'timeout') {
        expect(req!.payload.timeoutMs).toBe(5000)
      }
    })

    it('11. payload schema は zod schema として強制 parse される (action enum 違反は reject)', () => {
      expect(() => CliVersionApproveActionSchema.parse('continue_with_warning')).not.toThrow()
      expect(() => CliVersionApproveActionSchema.parse('foo')).toThrow()
      expect(() => CliVersionRejectActionSchema.parse('switch_to_dry_run')).not.toThrow()
      expect(() => CliVersionRejectActionSchema.parse('foo')).toThrow()
    })

    it('12. discriminated union: out_of_range の場合 version が必須 (null だと reject)', () => {
      // 直接 schema を試して discriminated union の挙動を固定化
      expect(() =>
        CliVersionUpdateApprovalPayloadSchema.parse({
          cliPath: '/x',
          acceptedRange: ACCEPTED,
          warning: 'w',
          suggestedApproveAction: 'halt_for_manual_update',
          rejectAction: 'switch_to_dry_run',
          meta: {
            detectedAt: FIXED_NOW,
            fallbackToDryRun: true,
          },
          outcome: 'out_of_range',
          version: { major: 2, minor: 0, patch: 0 },
        }),
      ).not.toThrow()

      // version=null では reject
      expect(() =>
        CliVersionUpdateApprovalPayloadSchema.parse({
          cliPath: '/x',
          acceptedRange: ACCEPTED,
          warning: 'w',
          suggestedApproveAction: 'halt_for_manual_update',
          rejectAction: 'switch_to_dry_run',
          meta: {
            detectedAt: FIXED_NOW,
            fallbackToDryRun: true,
          },
          outcome: 'out_of_range',
          version: null,
        }),
      ).toThrow()
    })
  })

  describe('Edge cases', () => {
    it('13. fallbackToDryRun=false → rejectAction=halt', () => {
      const oor: CliVersionCheckResult = {
        outcome: 'out_of_range',
        version: { major: 0, minor: 9, patch: 0 },
        rawStdout: 'claude-code 0.9.0',
        rawStderr: '',
        warning: 'experimental',
        fallbackToDryRun: false, // dry-run 候補にしない
      }
      const req = buildCliVersionUpdateHitlRequest(oor, {
        cliPath: '/x',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      expect(req!.rejectAction).toBe('halt')
    })

    it('14. stdout/stderr が 1KB 超の場合 truncated される', () => {
      const huge = 'x'.repeat(2000)
      const sf: CliVersionCheckResult = {
        outcome: 'spawn_failed',
        version: null,
        rawStdout: huge,
        rawStderr: huge,
        warning: 'huge',
        fallbackToDryRun: true,
      }
      const req = buildCliVersionUpdateHitlRequest(sf, {
        cliPath: '/x',
        acceptedRange: ACCEPTED,
        nowIso: () => FIXED_NOW,
      })
      const stdoutPreview = req!.payload.meta.stdoutPreview ?? ''
      const stderrPreview = req!.payload.meta.stderrPreview ?? ''
      expect(stdoutPreview.length).toBeLessThanOrEqual(1024 + '...[truncated]'.length)
      expect(stderrPreview).toContain('[truncated]')
    })
  })
})
