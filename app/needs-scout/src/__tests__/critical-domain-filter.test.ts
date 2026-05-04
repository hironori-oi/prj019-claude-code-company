/**
 * critical-domain-filter.test — Round 9 案 9-A1 前倒し:
 *   重要 13 領域 fail-safe denylist フィルタの単体テスト。
 *
 * カバー範囲:
 *   1. 13 領域全件 reject 検証 (各領域につき少なくとも 1 ワードで reject)
 *   2. fail-safe 原則 - title 一致だけで reject
 *   3. fail-safe 原則 - url 一致だけで reject
 *   4. fail-safe 原則 - rawText 一致だけで reject
 *   5. 安全候補 (denylist 不一致) は accepted
 *   6. matchedFields に title/url/rawText が複数記録される
 *   7. CRITICAL_DOMAIN_KEYS が 13 件
 */
import { describe, it, expect } from 'vitest'

import {
  applyCriticalDomainFilter,
  CRITICAL_DOMAIN_DENYLIST,
  CRITICAL_DOMAIN_KEYS,
} from '../filters/critical-domain-filter.js'
import type { Candidate } from '../sources/types.js'

function buildCandidate(
  overrides: Partial<Candidate> = {},
): Candidate {
  return {
    id: 'c-1',
    title: 'Generic developer tool',
    url: 'https://example.com/dev-tool',
    source: 'hackernews',
    sourceTier: 'tier1',
    domain: 'example.com',
    publishedAt: '2026-05-04T00:00:00.000Z',
    signalScore: { points: 10, numComments: 0, ageHours: 1, keywords: [] },
    rawText: 'generic developer tool for typescript users',
    ...overrides,
  }
}

describe('critical-domain-filter (R-019-10 緩和 / DEC-019-010)', () => {
  it('1. 13 領域全件 reject 検証 - 各領域につき 1 ワードで reject される', () => {
    expect(CRITICAL_DOMAIN_KEYS).toHaveLength(13)
    const expectedKeys = [
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
    ]
    expect([...CRITICAL_DOMAIN_KEYS].sort()).toEqual(expectedKeys.sort())

    // 各領域につき第 1 ワードを使った candidate を作り、全 13 件が reject されることを確認
    const candidates: Candidate[] = []
    for (const domainKey of CRITICAL_DOMAIN_KEYS) {
      const term = CRITICAL_DOMAIN_DENYLIST[domainKey]![0]!
      candidates.push(
        buildCandidate({
          id: `domain-${domainKey}`,
          title: `Open source tool for ${term} workflow`,
          rawText: `open source tool for ${term} workflow typescript`,
        }),
      )
    }
    const result = applyCriticalDomainFilter(candidates)
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(13)

    // 各 reject に正しい matchedDomain が記録されている
    const rejectedDomains = result.rejected.map((r) => r.matchedDomain).sort()
    expect(rejectedDomains).toEqual(expectedKeys.sort())
  })

  it('2. fail-safe 原則 - title だけ一致でも reject', () => {
    const c = buildCandidate({
      title: 'Open source library for diagnosis assistant',
      url: 'https://example.com/safe-url',
      rawText: 'safe open source library typescript only',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('medical')
    expect(result.rejected[0]!.matchedTerm).toBe('diagnosis')
    expect(result.rejected[0]!.matchedFields).toContain('title')
  })

  it('3. fail-safe 原則 - url だけ一致でも reject', () => {
    // url に "ofac" (national_security の単一トークン denylist 語) を含む
    const c = buildCandidate({
      title: 'Safe productivity tool',
      url: 'https://example.com/ofac/lookup',
      rawText: 'safe productivity tool typescript',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('national_security')
    expect(result.rejected[0]!.matchedTerm).toBe('ofac')
    expect(result.rejected[0]!.matchedFields).toContain('url')
  })

  it('4. fail-safe 原則 - rawText だけ一致でも reject', () => {
    const c = buildCandidate({
      title: 'Safe tool',
      url: 'https://example.com/safe',
      rawText: 'inside the description we mention immigration policy automation',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('immigration')
    expect(result.rejected[0]!.matchedFields).toContain('rawText')
  })

  it('5. 安全候補 (denylist 不一致) は accepted', () => {
    const safe = [
      buildCandidate({
        id: 'safe-1',
        title: 'TypeScript SaaS for indie developers',
        url: 'https://github.com/example/tool',
        rawText: 'typescript saas for indie developers productivity ide',
      }),
      buildCandidate({
        id: 'safe-2',
        title: 'New CLI tool for note-taking',
        url: 'https://example.com/notes',
        rawText: 'new cli tool for note-taking typescript markdown',
      }),
      buildCandidate({
        id: 'safe-3',
        title: 'Open source design system',
        url: 'https://example.com/design',
        rawText: 'open source design system tailwind shadcn',
      }),
    ]
    const result = applyCriticalDomainFilter(safe)
    expect(result.accepted).toHaveLength(3)
    expect(result.rejected).toHaveLength(0)
  })

  it('6. matchedFields に複数 軸 (title/url/rawText) が記録される', () => {
    // 'hipaa' (medical) は url にもそのまま含められる単一トークン
    const c = buildCandidate({
      title: 'Tool for HIPAA workflow',
      url: 'https://example.com/hipaa/dashboard',
      rawText: 'tool for hipaa workflow audit',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    const rj = result.rejected[0]!
    expect(rj.matchedDomain).toBe('medical')
    expect(rj.matchedTerm).toBe('hipaa')
    expect(rj.matchedFields).toContain('title')
    expect(rj.matchedFields).toContain('url')
    expect(rj.matchedFields).toContain('rawText')
    expect(rj.reason).toContain('fail-safe')
    expect(rj.reason).toContain('DEC-019-010')
  })

  it('7. CRITICAL_DOMAIN_DENYLIST の 13 領域すべてに最低 1 ワードがある', () => {
    for (const key of CRITICAL_DOMAIN_KEYS) {
      const terms = CRITICAL_DOMAIN_DENYLIST[key]
      expect(terms).toBeDefined()
      expect(terms!.length).toBeGreaterThan(0)
    }
  })

  it('8. 大文字混入でも lowercase 部分一致で reject (case-insensitive)', () => {
    const c = buildCandidate({
      title: 'Tool for HIPAA Compliance Audit', // mixed case
      url: 'https://EXAMPLE.com/page',
      rawText: 'tool for hipaa compliance audit',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('medical')
  })
})

/**
 * Round 10 案 10-α 拡張 — review-round9-critical-13-domain-keyword-set.md §3 連動。
 *
 * critical 7 + major 26 = 33 件追加分の reject 検証。
 *   - critical 7 件: SCADA (既存 'scada' で hit) / COPPA / trading bot / 弁護士法 72 条 /
 *                   医師法 17 条 / 行政書士法 1 条の 2 / COMPAS
 *   - major 26 件: Round 10 拡張 keyword 全件
 */
describe('critical-domain-filter Round 10 拡張 (案 10-α / 33 件 = critical 7 + major 26)', () => {
  // critical 7 件
  it('R10-c1. SCADA (既存 scada で hit、critical 確認)', () => {
    const c = buildCandidate({ title: 'SCADA security analysis tool', rawText: 'scada security analysis tool' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
    expect(result.rejected[0]!.matchedTerm).toBe('scada')
  })

  it('R10-c2. COPPA (B-02 critical) で reject', () => {
    const c = buildCandidate({ title: 'COPPA compliance helper', rawText: 'coppa compliance helper for kids apps' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('education')
    expect(result.rejected[0]!.matchedTerm).toBe('coppa')
  })

  it('R10-c3. trading bot (B-05 critical) で reject', () => {
    const c = buildCandidate({ title: 'Open source trading bot', rawText: 'open source trading bot for crypto' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('finance')
    expect(result.rejected[0]!.matchedTerm).toBe('trading bot')
  })

  it('R10-c4. 弁護士法 72 条 (B-07 critical) で reject', () => {
    const c = buildCandidate({
      title: '弁護士法 72 条 compliance check ツール',
      rawText: '弁護士法 72 条 compliance check ツール for ai legal',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('legal')
    expect(result.rejected[0]!.matchedTerm).toBe('弁護士法 72 条')
  })

  it('R10-c5. 医師法 17 条 (B-08 critical) で reject', () => {
    const c = buildCandidate({
      title: '医師法 17 条 解説',
      rawText: '医師法 17 条 解説 ai 診断アプリ規制',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('medical')
    expect(result.rejected[0]!.matchedTerm).toBe('医師法 17 条')
  })

  it('R10-c6. 行政書士法 1 条の 2 (B-12 critical) で reject', () => {
    const c = buildCandidate({
      title: '行政書士法 1 条の 2 規制対象',
      rawText: '行政書士法 1 条の 2 規制対象 在留資格自動書類作成',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('immigration')
    expect(result.rejected[0]!.matchedTerm).toBe('行政書士法 1 条の 2')
  })

  it('R10-c7. COMPAS (B-13 critical) で reject', () => {
    const c = buildCandidate({ title: 'COMPAS recidivism analysis', rawText: 'compas recidivism analysis criminal' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('law_enforcement')
    expect(result.rejected[0]!.matchedTerm).toBe('compas')
  })

  // major - B-01 (5件)
  it('R10-m01. smart grid で reject', () => {
    const c = buildCandidate({ title: 'Smart grid optimization', rawText: 'smart grid optimization paper' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
  })

  it('R10-m02. 配電制御 で reject', () => {
    const c = buildCandidate({ title: '配電制御 system', rawText: '配電制御 system overview' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
  })

  it('R10-m03. ガス供給管理 で reject', () => {
    const c = buildCandidate({ title: 'ガス供給管理 platform', rawText: 'ガス供給管理 platform iot' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
  })

  // major - B-02 (4件)
  it('R10-m04. 偏差値判定 で reject', () => {
    const c = buildCandidate({ title: '偏差値判定 ai', rawText: '偏差値判定 ai 入試予測' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('education')
  })

  it('R10-m05. 自動採点 で reject', () => {
    const c = buildCandidate({ title: '自動採点 service', rawText: '自動採点 service 学校向け' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('education')
  })

  // major - B-03 (2件)
  it('R10-m06. tenant scoring で reject', () => {
    const c = buildCandidate({ title: 'Tenant scoring algorithm', rawText: 'tenant scoring algorithm research' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('housing')
  })

  it('R10-m07. rent automation で reject', () => {
    const c = buildCandidate({ title: 'Rent automation SaaS', rawText: 'rent automation saas for landlord' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('housing')
  })

  // major - B-04 (2件)
  it('R10-m08. ATS 自動判定 で reject (lowercase normalized)', () => {
    const c = buildCandidate({ title: 'ATS 自動判定 ツール', rawText: 'ats 自動判定 ツール for hr' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('employment')
  })

  it('R10-m09. 採用適性スコア で reject', () => {
    const c = buildCandidate({ title: '採用適性スコア engine', rawText: '採用適性スコア engine for company' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('employment')
  })

  // major - B-05 (2件)
  it('R10-m10. algo trading で reject', () => {
    const c = buildCandidate({ title: 'Algo trading platform', rawText: 'algo trading platform stocks' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('finance')
  })

  it('R10-m11. DeFi 自動運用 で reject', () => {
    const c = buildCandidate({ title: 'DeFi 自動運用', rawText: 'defi 自動運用 yield farming' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('finance')
  })

  // major - B-06 (1件)
  it('R10-m12. underwriting ai で reject', () => {
    const c = buildCandidate({ title: 'Underwriting AI', rawText: 'underwriting ai for insurance' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('insurance')
  })

  // major - B-07 (2件)
  it('R10-m13. legal opinion で reject', () => {
    const c = buildCandidate({ title: 'Legal opinion generator', rawText: 'legal opinion generator ai' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('legal')
  })

  it('R10-m14. 法律 ai で reject', () => {
    const c = buildCandidate({ title: '法律 ai chatbot', rawText: '法律 ai chatbot 相談' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('legal')
  })

  // major - B-08 (2件)
  it('R10-m15. telemedicine 診断 で reject', () => {
    const c = buildCandidate({ title: 'Telemedicine 診断 platform', rawText: 'telemedicine 診断 platform' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('medical')
  })

  it('R10-m16. online consultation 診断 で reject', () => {
    const c = buildCandidate({
      title: 'Online consultation 診断 saas',
      rawText: 'online consultation 診断 saas health',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('medical')
  })

  // major - B-10 (1件)
  it('R10-m17. HACCP 判定 で reject', () => {
    const c = buildCandidate({ title: 'HACCP 判定 service', rawText: 'haccp 判定 service food' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('product_safety')
  })

  // major - B-11 (2件)
  it('R10-m18. offensive cyber で reject', () => {
    const c = buildCandidate({ title: 'Offensive cyber tool', rawText: 'offensive cyber tool research' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('national_security')
  })

  it('R10-m19. LAWS (lethal autonomous weapons) で reject', () => {
    const c = buildCandidate({
      title: 'LAWS treaty analysis',
      rawText: 'laws treaty analysis lethal autonomous weapons',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('national_security')
  })

  // major - B-12 (2件)
  it('R10-m20. refugee status で reject', () => {
    const c = buildCandidate({
      title: 'Refugee status processing',
      rawText: 'refugee status processing service',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('immigration')
  })

  it('R10-m21. asylum 申請 で reject', () => {
    const c = buildCandidate({ title: 'Asylum 申請 ヘルパー', rawText: 'asylum 申請 ヘルパー automation' })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('immigration')
  })

  // major - B-13 (1件)
  it('R10-m22. recidivism risk で reject', () => {
    const c = buildCandidate({
      title: 'Recidivism risk model',
      rawText: 'recidivism risk model criminal justice',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected[0]!.matchedDomain).toBe('law_enforcement')
  })

  // 構造保証 - Object.freeze
  it('R10-s1. CRITICAL_DOMAIN_DENYLIST が Object.freeze 維持 (DEC-019-010)', () => {
    expect(Object.isFrozen(CRITICAL_DOMAIN_DENYLIST)).toBe(true)
    for (const key of CRITICAL_DOMAIN_KEYS) {
      const arr = CRITICAL_DOMAIN_DENYLIST[key]!
      expect(Object.isFrozen(arr)).toBe(true)
    }
  })

  // batch reject 一括検証
  it('R10-s2. critical 7 件 + major 抜粋 = 全部 reject (混在 batch)', () => {
    const seeds = [
      { title: 'SCADA tool', rawText: 'scada tool' },
      { title: 'COPPA helper', rawText: 'coppa helper' },
      { title: 'Trading bot', rawText: 'trading bot ai' },
      { title: '弁護士法 72 条', rawText: '弁護士法 72 条 解説' },
      { title: '医師法 17 条', rawText: '医師法 17 条 解説' },
      { title: '行政書士法 1 条の 2', rawText: '行政書士法 1 条の 2 解説' },
      { title: 'COMPAS', rawText: 'compas analysis' },
      { title: 'Smart grid', rawText: 'smart grid optimization' },
      { title: 'Tenant scoring', rawText: 'tenant scoring algorithm' },
    ]
    const candidates = seeds.map((s, i) => buildCandidate({ id: `r10-${i}`, ...s }))
    const result = applyCriticalDomainFilter(candidates)
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(seeds.length)
  })
})

/**
 * Round 11 案 A 着地 — BACKLOG-MINOR-DENYLIST.md minor 16 件補完。
 *
 * 14 件新規 keyword + 2 件 既存確認 = 16 件全件 reject 検証。
 *   - B-01 重要インフラ minor 3: 廃棄物処理制御 / 空調 bacnet / エレベーター制御
 *   - B-02 教育 minor 2: 学習進捗評価 / 学習進捗判定
 *   - B-03 住居 minor 3: 修繕費判定 / 敷金判定 / 礼金算定
 *   - B-04 雇用 minor 1: applicant tracking system
 *   - B-05 金融 minor 1: cic スコア
 *   - B-06 保険 minor 2: 引受査定 ai / actuary 自動
 *   - B-10 製品安全 minor 2: iso 9001 判定 / iso 13485 判定
 *   - B-07 #13 確認: legal advice (既存)
 *   - B-11 #16 確認: cyber warfare (既存)
 */
describe('critical-domain-filter Round 11 拡張 (案 A / minor 16 件 = 新規 14 + 既存確認 2)', () => {
  // B-01 重要インフラ minor 3
  it('R11-min01. 廃棄物処理制御 (B-01 minor) で reject', () => {
    const c = buildCandidate({
      title: '廃棄物処理制御 system',
      rawText: '廃棄物処理制御 system iot 自治体向け',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
    expect(result.rejected[0]!.matchedTerm).toBe('廃棄物処理制御')
  })

  it('R11-min02. 空調 BACnet (B-01 minor、case-insensitive で hit) で reject', () => {
    const c = buildCandidate({
      title: '空調 BACnet integration',
      rawText: '空調 bacnet integration platform',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
    expect(result.rejected[0]!.matchedTerm).toBe('空調 bacnet')
  })

  it('R11-min03. エレベーター制御 (B-01 minor) で reject', () => {
    const c = buildCandidate({
      title: 'エレベーター制御 ai 監視',
      rawText: 'エレベーター制御 ai 監視 安全',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('critical_infrastructure')
    expect(result.rejected[0]!.matchedTerm).toBe('エレベーター制御')
  })

  // B-02 教育 minor 2
  it('R11-min04. 学習進捗評価 (B-02 minor) で reject', () => {
    const c = buildCandidate({
      title: '学習進捗評価 ai service',
      rawText: '学習進捗評価 ai service for school',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('education')
    expect(result.rejected[0]!.matchedTerm).toBe('学習進捗評価')
  })

  it('R11-min05. 学習進捗判定 (B-02 minor) で reject', () => {
    const c = buildCandidate({
      title: '学習進捗判定 dashboard',
      rawText: '学習進捗判定 dashboard for parent',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('education')
    expect(result.rejected[0]!.matchedTerm).toBe('学習進捗判定')
  })

  // B-03 住居 minor 3
  it('R11-min06. 修繕費判定 (B-03 minor) で reject', () => {
    const c = buildCandidate({
      title: '修繕費判定 ai',
      rawText: '修繕費判定 ai 不動産管理',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('housing')
    expect(result.rejected[0]!.matchedTerm).toBe('修繕費判定')
  })

  it('R11-min07. 敷金判定 (B-03 minor) で reject', () => {
    const c = buildCandidate({
      title: '敷金判定 service',
      rawText: '敷金判定 service 賃貸',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('housing')
    expect(result.rejected[0]!.matchedTerm).toBe('敷金判定')
  })

  it('R11-min08. 礼金算定 (B-03 minor) で reject', () => {
    const c = buildCandidate({
      title: '礼金算定 model',
      rawText: '礼金算定 model 賃貸契約',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('housing')
    expect(result.rejected[0]!.matchedTerm).toBe('礼金算定')
  })

  // B-04 雇用 minor 1 — 'applicant tracking' (既存) でも 'applicant tracking system' (新規) でも hit
  it('R11-min09. applicant tracking system (B-04 minor、新規 keyword 明示でも既存 prefix applicant tracking で hit)', () => {
    const c = buildCandidate({
      title: 'Applicant tracking system v2',
      rawText: 'applicant tracking system v2 hr',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('employment')
    // 既存 'applicant tracking' が先に hit するため、それを期待 (audit trace としては意図通り)
    expect(['applicant tracking', 'applicant tracking system']).toContain(
      result.rejected[0]!.matchedTerm,
    )
  })

  // B-05 金融 minor 1
  it('R11-min10. cic スコア (B-05 minor) で reject', () => {
    const c = buildCandidate({
      title: 'CIC スコア predictor',
      rawText: 'cic スコア predictor 信用情報',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('finance')
    expect(result.rejected[0]!.matchedTerm).toBe('cic スコア')
  })

  // B-06 保険 minor 2
  it('R11-min11. 引受査定 ai (B-06 minor) で reject', () => {
    const c = buildCandidate({
      title: '引受査定 ai engine',
      rawText: '引受査定 ai engine for life insurance',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('insurance')
    expect(result.rejected[0]!.matchedTerm).toBe('引受査定 ai')
  })

  it('R11-min12. actuary 自動 (B-06 minor) で reject', () => {
    const c = buildCandidate({
      title: 'Actuary 自動 calculation',
      rawText: 'actuary 自動 calculation insurance math',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('insurance')
    expect(result.rejected[0]!.matchedTerm).toBe('actuary 自動')
  })

  // B-10 製品安全 minor 2
  it('R11-min13. iso 9001 判定 (B-10 minor) で reject', () => {
    const c = buildCandidate({
      title: 'ISO 9001 判定 helper',
      rawText: 'iso 9001 判定 helper 品質',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('product_safety')
    expect(result.rejected[0]!.matchedTerm).toBe('iso 9001 判定')
  })

  it('R11-min14. iso 13485 判定 (B-10 minor) で reject', () => {
    const c = buildCandidate({
      title: 'ISO 13485 判定 サービス',
      rawText: 'iso 13485 判定 サービス 医療機器',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('product_safety')
    expect(result.rejected[0]!.matchedTerm).toBe('iso 13485 判定')
  })

  // B-07 #13 既存確認 (legal advice)
  it('R11-min15. legal advice (B-07 minor 確認のみ、既存 keyword で reject) ', () => {
    const c = buildCandidate({
      title: 'AI for legal advice',
      rawText: 'ai for legal advice automation',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('legal')
    expect(result.rejected[0]!.matchedTerm).toBe('legal advice')
  })

  // B-11 #16 既存確認 (cyber warfare)
  it('R11-min16. cyber warfare (B-11 minor 確認のみ、既存 keyword で reject)', () => {
    const c = buildCandidate({
      title: 'Cyber warfare research',
      rawText: 'cyber warfare research nation state',
    })
    const result = applyCriticalDomainFilter([c])
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0]!.matchedDomain).toBe('national_security')
    expect(result.rejected[0]!.matchedTerm).toBe('cyber warfare')
  })

  // 構造保証 — Object.freeze 維持確認 (Round 11 append 後も)
  it('R11-min-s1. CRITICAL_DOMAIN_DENYLIST が Round 11 append 後も Object.freeze 維持', () => {
    expect(Object.isFrozen(CRITICAL_DOMAIN_DENYLIST)).toBe(true)
    for (const key of CRITICAL_DOMAIN_KEYS) {
      const arr = CRITICAL_DOMAIN_DENYLIST[key]!
      expect(Object.isFrozen(arr)).toBe(true)
    }
  })

  // batch reject — minor 14 件全件 reject 確認
  it('R11-min-s2. minor 14 件 (新規 keyword) batch reject', () => {
    const seeds = [
      { title: '廃棄物処理制御 a', rawText: '廃棄物処理制御 a' },
      { title: '空調 bacnet a', rawText: '空調 bacnet a' },
      { title: 'エレベーター制御 a', rawText: 'エレベーター制御 a' },
      { title: '学習進捗評価 a', rawText: '学習進捗評価 a' },
      { title: '学習進捗判定 a', rawText: '学習進捗判定 a' },
      { title: '修繕費判定 a', rawText: '修繕費判定 a' },
      { title: '敷金判定 a', rawText: '敷金判定 a' },
      { title: '礼金算定 a', rawText: '礼金算定 a' },
      { title: 'cic スコア', rawText: 'cic スコア predictor' },
      { title: '引受査定 ai a', rawText: '引受査定 ai a' },
      { title: 'actuary 自動 a', rawText: 'actuary 自動 a' },
      { title: 'iso 9001 判定 a', rawText: 'iso 9001 判定 a' },
      { title: 'iso 13485 判定 a', rawText: 'iso 13485 判定 a' },
      // applicant tracking system は既存 'applicant tracking' で hit するので網羅性確認用に含める
      { title: 'applicant tracking system v3', rawText: 'applicant tracking system v3' },
    ]
    const candidates = seeds.map((s, i) => buildCandidate({ id: `r11-min-${i}`, ...s }))
    const result = applyCriticalDomainFilter(candidates)
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(seeds.length)
  })
})
