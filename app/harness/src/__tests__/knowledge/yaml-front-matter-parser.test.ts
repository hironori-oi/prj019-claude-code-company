/**
 * yaml-front-matter-parser test (Round 14 Dev-E).
 *
 * 検証項目 (15 tests):
 *  1. parseFrontmatter: 正常な frontmatter + body
 *  2. parseFrontmatter: no_frontmatter (先頭 --- なし)
 *  3. parseFrontmatter: malformed_delimiter (closing --- なし)
 *  4. parseFrontmatter: empty_body
 *  5. parseFrontmatter: list 値 [a, b, c]
 *  6. parseFrontmatter: number 値 (integer + float)
 *  7. parseFrontmatter: boolean 値
 *  8. parseFrontmatter: quoted string 値
 *  9. parseFrontmatter: コメント行スキップ
 * 10. toKnowledgeEntry: pattern 変換 (type: pattern)
 * 11. toKnowledgeEntry: decision 変換
 * 12. toKnowledgeEntry: pitfall 変換
 * 13. toKnowledgeEntry: 不正 kind で null
 * 14. loadKnowledgeIndexFromDir: tmp dir 配下複数 file load
 * 15. loadKnowledgeIndexFromDir: README/INDEX skip
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  parseFrontmatter,
  toKnowledgeEntry,
  loadKnowledgeIndexFromDir,
} from '../../knowledge/yaml-front-matter-parser.js'

function tmpDir(): string {
  return join(
    tmpdir(),
    `clawbridge-yaml-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
}

const validBodyMin = 'Body content that is sufficiently long for schema (>= 50 chars).'

describe('parseFrontmatter', () => {
  it('1. parses normal frontmatter + body', () => {
    const md = `---
id: PAT-001
type: pattern
tags: [foo, bar]
quality_score: 4
---
# Title

${validBodyMin}
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['id']).toBe('PAT-001')
      expect(r.parsed.frontmatter.fields['type']).toBe('pattern')
      expect(r.parsed.frontmatter.fields['tags']).toEqual(['foo', 'bar'])
      expect(r.parsed.frontmatter.fields['quality_score']).toBe(4)
    }
  })

  it('2. returns no_frontmatter when no leading ---', () => {
    const r = parseFrontmatter('# heading\nbody')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('no_frontmatter')
  })

  it('3. returns malformed_delimiter when closing --- missing', () => {
    const r = parseFrontmatter('---\nid: x\nbody without closing')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('malformed_delimiter')
  })

  it('4. returns empty_body when body is empty', () => {
    const r = parseFrontmatter('---\nid: x\n---\n')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('empty_body')
  })

  it('5. parses list values', () => {
    const md = `---
tags: [a, b, c]
empty: []
---
body content here for testing parser min length requirement.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['tags']).toEqual(['a', 'b', 'c'])
      expect(r.parsed.frontmatter.fields['empty']).toEqual([])
    }
  })

  it('6. parses integer and float numbers', () => {
    const md = `---
count: 5
ratio: 0.85
---
body content here for testing parser min length requirement.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['count']).toBe(5)
      expect(r.parsed.frontmatter.fields['ratio']).toBeCloseTo(0.85)
    }
  })

  it('7. parses boolean values', () => {
    const md = `---
flag: true
other: false
---
body content here for testing parser min length requirement.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['flag']).toBe(true)
      expect(r.parsed.frontmatter.fields['other']).toBe(false)
    }
  })

  it('8. strips quotes from string values', () => {
    const md = `---
title: "quoted title"
single: 'single quote'
---
body content here for testing parser min length requirement.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['title']).toBe('quoted title')
      expect(r.parsed.frontmatter.fields['single']).toBe('single quote')
    }
  })

  it('9. skips comment lines', () => {
    const md = `---
# this is a comment
id: PAT-002
# another comment
type: pattern
---
body content here for testing parser min length requirement.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.parsed.frontmatter.fields['id']).toBe('PAT-002')
      expect(r.parsed.frontmatter.fields['type']).toBe('pattern')
    }
  })
})

describe('toKnowledgeEntry', () => {
  it('10. converts pattern frontmatter', () => {
    const md = `---
id: PAT-001-test
type: pattern
source_prj: PRJ-019
tags: [hitl, dispatcher]
category: architecture
quality_score: 4
applies_when: when in self-poc
---
${validBodyMin} 50chars padding 50chars padding 50chars padding
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const entry = toKnowledgeEntry(r.parsed)
      expect(entry).not.toBeNull()
      expect(entry?.frontmatter.kind).toBe('pattern')
      expect(entry?.frontmatter.id).toBe('PAT-001-test')
    }
  })

  it('11. converts decision frontmatter', () => {
    const md = `---
id: DEC-019-033-x
type: decision
source_prj: PRJ-019
tags: [governance]
category: org
quality_score: 5
context: ctx
alternatives: [a, b]
rationale: chose a
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const entry = toKnowledgeEntry(r.parsed)
      expect(entry).not.toBeNull()
      expect(entry?.frontmatter.kind).toBe('decision')
    }
  })

  it('12. converts pitfall frontmatter', () => {
    const md = `---
id: PIT-001-x
type: pitfall
source_prj: PRJ-019
tags: [security]
category: security
quality_score: 3
symptom: bad
root_cause: foo
remediation: fix
prevention: dont
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const entry = toKnowledgeEntry(r.parsed)
      expect(entry).not.toBeNull()
      expect(entry?.frontmatter.kind).toBe('pitfall')
    }
  })

  it('13. returns null for invalid kind', () => {
    const md = `---
id: X-001
type: unknown_kind
source_prj: PRJ-019
tags: [foo]
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    const r = parseFrontmatter(md)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const entry = toKnowledgeEntry(r.parsed)
      expect(entry).toBeNull()
    }
  })
})

describe('loadKnowledgeIndexFromDir', () => {
  let dir: string
  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(join(dir, 'patterns'), { recursive: true })
    await fs.mkdir(join(dir, 'decisions'), { recursive: true })
    await fs.mkdir(join(dir, 'pitfalls'), { recursive: true })
  })
  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('14. loads multiple files and returns IndexedKnowledge[]', async () => {
    const patternMd = `---
id: PAT-100-a
type: pattern
source_prj: PRJ-019
tags: [test]
category: testing
quality_score: 3
applies_when: when testing
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    const decisionMd = `---
id: DEC-100-a
type: decision
source_prj: PRJ-019
tags: [test]
category: testing
quality_score: 4
context: ctx
alternatives: [a, b]
rationale: rat
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    const pitfallMd = `---
id: PIT-100-a
type: pitfall
source_prj: PRJ-019
tags: [test]
category: testing
quality_score: 2
symptom: s
root_cause: rc
remediation: r
prevention: p
---
${validBodyMin} more body content here to satisfy 50 chars.
`
    await fs.writeFile(join(dir, 'patterns', 'PAT-100-a.md'), patternMd, 'utf-8')
    await fs.writeFile(join(dir, 'decisions', 'DEC-100-a.md'), decisionMd, 'utf-8')
    await fs.writeFile(join(dir, 'pitfalls', 'PIT-100-a.md'), pitfallMd, 'utf-8')
    const result = await loadKnowledgeIndexFromDir(dir)
    expect(result.entries.length).toBe(3)
    const kinds = result.entries.map((e) => e.frontmatter.kind).sort()
    expect(kinds).toEqual(['decision', 'pattern', 'pitfall'])
  })

  it('15. skips README and INDEX files', async () => {
    const readme = `---
id: skip
---
should be skipped.
`
    await fs.writeFile(join(dir, 'patterns', 'README.md'), readme, 'utf-8')
    await fs.writeFile(join(dir, 'patterns', 'INDEX-v4.md'), readme, 'utf-8')
    const result = await loadKnowledgeIndexFromDir(dir)
    expect(result.entries.length).toBe(0)
    expect(result.skipped.length).toBe(0) // README/INDEX silently skipped before parse
  })
})
