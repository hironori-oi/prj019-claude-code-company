/**
 * lint-denylist — Round 14 Dev-A:
 *   denylist.yaml を CI / pre-commit で検証する standalone script。
 *
 * 動作:
 *   1. config/denylist.yaml を `loadDenylistFullTable` 経由で load
 *      (内部で parseRestrictedYaml + zod strict + assertDenylistIntegrity)
 *   2. 13 領域 key set を期待値と比較
 *   3. backlog tier の audit lineage 健全性 (dual placement の整合) を report
 *   4. fail 時は exit(1)、成功時は exit(0)
 *
 * 使い方:
 *   - ローカル: `pnpm --filter @clawbridge/needs-scout lint:denylist`
 *   - CI: `.github/workflows/denylist-lint.yml` から invoke
 *
 * 関連:
 *   - DENYLIST-OPERATIONS.md §5 自動 lint
 *   - dev-round14-A-yaml-failfast-multilingual-lint.md
 */

import {
  loadDenylistFullTable,
  loadDomainKeys,
  DenylistLoaderError,
} from '../src/filters/denylist-loader.js'

const EXPECTED_DOMAIN_KEYS = [
  'critical_infrastructure',
  'education',
  'housing',
  'employment',
  'finance',
  'insurance',
  'legal',
  'medical',
  'government',
  'product_safety',
  'national_security',
  'immigration',
  'law_enforcement',
] as const

interface LintReport {
  readonly ok: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly stats: {
    readonly domainCount: number
    readonly tierCount: number
    readonly totalKeywords: number
    readonly activeKeywords: number
    readonly backlogKeywords: number
  }
}

export function runLint(): LintReport {
  const errors: string[] = []
  const warnings: string[] = []
  let domainCount = 0
  let tierCount = 0
  let totalKeywords = 0
  let activeKeywords = 0
  let backlogKeywords = 0

  let table
  try {
    table = loadDenylistFullTable()
  } catch (err) {
    if (err instanceof DenylistLoaderError) {
      errors.push(`fail-fast: ${err.message}`)
    } else {
      errors.push(`unexpected error: ${(err as Error).message}`)
    }
    return {
      ok: false,
      errors,
      warnings,
      stats: {
        domainCount: 0,
        tierCount: 0,
        totalKeywords: 0,
        activeKeywords: 0,
        backlogKeywords: 0,
      },
    }
  }

  // 13 領域 key set 検証
  const actualKeys = loadDomainKeys()
  const missingKeys = EXPECTED_DOMAIN_KEYS.filter((k) => !actualKeys.includes(k))
  const extraKeys = actualKeys.filter(
    (k) => !EXPECTED_DOMAIN_KEYS.includes(k as (typeof EXPECTED_DOMAIN_KEYS)[number]),
  )
  if (missingKeys.length > 0) {
    errors.push(
      `missing required domain keys: ${missingKeys.join(', ')} (expected 13 critical domains per DEC-019-010)`,
    )
  }
  if (extraKeys.length > 0) {
    warnings.push(
      `unknown domain keys present: ${extraKeys.join(', ')} (review-required, not failure)`,
    )
  }

  // 統計収集 + dual placement 整合性
  for (const [domain, tiers] of Object.entries(table)) {
    domainCount += 1
    const activeKeywordSet = new Set<string>()
    for (const tierName of ['baseline', 'critical', 'major', 'minor'] as const) {
      const t = tiers[tierName]
      if (!t) continue
      tierCount += 1
      for (const kw of t.keywords) {
        totalKeywords += 1
        activeKeywords += 1
        activeKeywordSet.add(kw)
      }
    }
    const backlog = tiers.backlog
    if (backlog) {
      tierCount += 1
      if (backlog.enabled) {
        warnings.push(
          `domain='${domain}': backlog tier has enabled=true (audit lineage tier should be disabled by convention)`,
        )
      }
      for (const kw of backlog.keywords) {
        totalKeywords += 1
        backlogKeywords += 1
        // backlog 内に同 keyword 重複は warn (but not fail)
        if (backlog.keywords.indexOf(kw) !== backlog.keywords.lastIndexOf(kw)) {
          warnings.push(
            `domain='${domain}' backlog: duplicate keyword '${kw}' (audit-only tier)`,
          )
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    stats: {
      domainCount,
      tierCount,
      totalKeywords,
      activeKeywords,
      backlogKeywords,
    },
  }
}

function main(): void {
  // eslint-disable-next-line no-console
  console.log('[lint:denylist] Round 14 Dev-A — needs-scout denylist linter')
  const report = runLint()

  if (report.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[lint:denylist] warnings:')
    for (const w of report.warnings) {
      // eslint-disable-next-line no-console
      console.warn(`  - ${w}`)
    }
  }

  if (!report.ok) {
    // eslint-disable-next-line no-console
    console.error('[lint:denylist] FAILED:')
    for (const e of report.errors) {
      // eslint-disable-next-line no-console
      console.error(`  - ${e}`)
    }
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(
    `[lint:denylist] OK — domains=${report.stats.domainCount}, tiers=${report.stats.tierCount}, ` +
      `keywords total=${report.stats.totalKeywords} (active=${report.stats.activeKeywords}, ` +
      `backlog=${report.stats.backlogKeywords}), warnings=${report.warnings.length}`,
  )
}

// CLI entry: `tsx scripts/lint-denylist.ts`
// import 経由 (test) では process.env.LINT_DENYLIST_NO_AUTORUN=1 で抑止可能。
if (process.env.LINT_DENYLIST_NO_AUTORUN !== '1') {
  main()
}
