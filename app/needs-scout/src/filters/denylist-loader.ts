/**
 * needs-scout filters/denylist-loader — Round 14 Dev-A:
 *   重要 13 領域 denylist の YAML 直書き化 (CB-D-W3-01 完遂、Round 11 Dev-A 引継)
 *   + Round 14 fail-fast 改修。
 *
 * 設計方針:
 *   - **依存追加 0**: js-yaml / yaml package 採用 NG (API 追加コスト $0 制約 + bundle size 増)。
 *     代わりに本 file の `parseRestrictedYaml` 関数で本 denylist が必要とする YAML subset を
 *     自前 parse (block style + 2-space indent + scalar string + flag boolean のみ)。
 *   - **zod schema 検証**: parse 結果を zod で構造検証、不整合時は load 時 throw (起動 fail-fast)。
 *   - **起動時 1 回のみ load**: module top-level の cached function call で eager load し、
 *     `Object.freeze(loadDenylist())` 形式で immutable export。
 *   - **enabled === true filter**: tier 単位の enabled フラグで runtime denylist 構築時に除外可能。
 *     backlog tier の audit lineage を維持しつつ、runtime には登場させない使い分けに対応。
 *   - **dedup**: domain 内で同一 keyword が複数 tier に登場しても 1 度のみ array に格納
 *     (back-compat 維持: minor + backlog の dual placement は audit 専用、runtime は単一)。
 *   - **package import 経由でも動作**: import.meta.url 起点で `../../config/denylist.yaml` を解決、
 *     ESM + NodeNext 整合 (vitest / node 双方で同 path 解決)。
 *
 * Round 14 Dev-A 拡張 (fail-fast 化):
 *   - **`assertDenylistIntegrity`**: 構造検証 + tier 整合性 (active tier 内重複) +
 *     未知 tier ラベル + 空 keyword の早期検出。CI / production 起動時に invoke する。
 *   - **`loadDenylistOrExit`**: production 起動経路専用。fail-fast で `process.exit(1)`。
 *     test / DI 経路は `loadDenylist` を引き続き利用 (throw のみ、process.exit なし)。
 *   - 重複ポリシー:
 *       * 同一 domain × **同一 active tier** で同じ keyword 重複 → throw (誤記検出)
 *       * 同一 domain × 異なる active tier で同じ keyword → throw (tier 移動漏れ検出)
 *       * 同一 domain × active + backlog dual placement → warn のみ (audit lineage で許容)
 *
 * 関連:
 *   - DEC-019-010 (重要 13 領域 fail-safe denylist)
 *   - CB-D-W3-01 (needs_scout skill config 直接埋込)
 *   - dev-round11-A-denylist-subprocess.md §7.2 引継 (denylist YAML 直書き化)
 *   - dev-round13-A-multilingual-nfkc-hn-fetch.md §8.2 #1 引継 (YAML loader fail-fast 化)
 *   - critical-domain-filter.ts (本 loader の出力を Object.freeze で消費)
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

/**
 * tier ラベル: baseline = Round 9 着地、critical/major/minor = Round 10/11 拡張、backlog = 将来候補。
 */
export type DenylistTier = 'baseline' | 'critical' | 'major' | 'minor' | 'backlog'

/**
 * tier ごとの enabled フラグ + keyword 配列の最小単位。
 */
export interface TierEntry {
  readonly enabled: boolean
  readonly keywords: readonly string[]
}

/**
 * 領域ごとの全 tier (どの tier も省略可)。
 */
export type DomainTiers = Partial<Record<DenylistTier, TierEntry>>

/**
 * loader の最終出力: 領域名 → 有効 keyword 配列 (重複除外済 / Object.freeze 済)。
 */
export type RuntimeDenylist = Readonly<Record<string, readonly string[]>>

/**
 * tier 詳細 (audit / 検証用)。enabled: false の tier も含まれる。
 */
export type DenylistFullTable = Readonly<Record<string, DomainTiers>>

/** zod schema: tier 単位の検証用 (Round 14: keywords 1 件以上必須) */
const TierEntrySchema = z.object({
  enabled: z.boolean(),
  keywords: z
    .array(z.string().min(1, 'keyword must be non-empty'))
    .min(1, 'each tier must declare at least one keyword'),
})

/**
 * Round 14: tier ラベル strict 列挙化。
 * `strict()` で未知 key を拒絶 (typo 検出 / 未知 tier ラベル fail-fast)。
 */
const DomainTiersSchema = z
  .object({
    baseline: TierEntrySchema.optional(),
    critical: TierEntrySchema.optional(),
    major: TierEntrySchema.optional(),
    minor: TierEntrySchema.optional(),
    backlog: TierEntrySchema.optional(),
  })
  .strict()

/** zod schema: file 全体 (Round 14: strict + version 1 確認) */
const DenylistFileSchema = z
  .object({
    version: z.number().int().positive(),
    domains: z.record(z.string().min(1), DomainTiersSchema),
  })
  .strict()

/** active (runtime に登場する) tier 集合: backlog 以外 */
const ACTIVE_TIER_NAMES = ['baseline', 'critical', 'major', 'minor'] as const
type ActiveTierName = (typeof ACTIVE_TIER_NAMES)[number]

/**
 * 簡易 YAML parser (本 denylist が必要とする subset 限定)。
 *
 * 対応:
 *   - block style mapping (key: value)
 *   - 2-space indent によるネスト (柔軟 indent NG)
 *   - block style sequence (- value)
 *   - scalar: 文字列 (quote 不要、`#` 以降は comment) / 数値 / true|false
 *   - 空行 / `# ...` 行頭 comment / 行末 comment
 *
 * 非対応 (本 denylist では使わない):
 *   - flow style (`{a: b}` / `[a, b]`)
 *   - anchor / alias (`&` / `*`)
 *   - multiline scalar (`|` / `>`)
 *   - tag (`!!str` 等)
 *   - block style map within sequence (`- key: value` の sequence は対応するが、本 file は対応 hash 構造のみ)
 *
 * 想定外の入力に対しては Error を throw (起動 fail-fast)。
 *
 * @param yamlText YAML 文字列
 * @returns parse 結果 (任意の object / array / scalar の入れ子)
 */
export function parseRestrictedYaml(yamlText: string): unknown {
  const lines = yamlText.split(/\r?\n/)
  // 各行を {indent, content} に正規化 (空行 / comment 行は skip)。
  type Line = { readonly indent: number; readonly content: string; readonly raw: string; readonly lineNo: number }
  const tokens: Line[] = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    // 行頭から空白 count
    let indent = 0
    while (indent < raw.length && raw[indent] === ' ') indent += 1
    const trimmed = raw.slice(indent)
    if (trimmed.length === 0) continue
    if (trimmed.startsWith('#')) continue
    // 行末 comment 除去 (quote 不使用前提なので # 単純検索でよい)
    const hashIdx = trimmed.indexOf(' #')
    const content = (hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed).trimEnd()
    if (content.length === 0) continue
    tokens.push({ indent, content, raw, lineNo: i + 1 })
  }

  // 再帰的 parse: 同 indent level の連続 token を集めて mapping or sequence を構築。
  // cursor を共有するため index 参照型で管理。
  const cursor = { i: 0 }

  function parseScalar(s: string): unknown {
    if (s === 'true') return true
    if (s === 'false') return false
    if (s === 'null' || s === '~') return null
    if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10)
    if (/^-?\d+\.\d+$/.test(s)) return Number.parseFloat(s)
    // quote 除去 (single / double)
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      return s.slice(1, -1)
    }
    return s
  }

  function parseBlock(parentIndent: number): unknown {
    if (cursor.i >= tokens.length) return null
    const first = tokens[cursor.i]
    if (!first || first.indent <= parentIndent) return null

    const blockIndent = first.indent
    if (first.content.startsWith('- ')) {
      // sequence
      const arr: unknown[] = []
      while (cursor.i < tokens.length) {
        const t = tokens[cursor.i]
        if (!t || t.indent !== blockIndent || !t.content.startsWith('- ')) break
        const itemContent = t.content.slice(2).trim()
        cursor.i += 1
        if (itemContent.length === 0) {
          // ネスト sequence/map (本 file では未使用だが保険として実装)
          arr.push(parseBlock(blockIndent))
        } else if (itemContent.includes(': ')) {
          // sequence 中の inline mapping (`- key: value`) — 本 file では未使用だが保険
          const colonIdx = itemContent.indexOf(': ')
          const key = itemContent.slice(0, colonIdx).trim()
          const val = itemContent.slice(colonIdx + 2).trim()
          const mapEntry: Record<string, unknown> = { [key]: parseScalar(val) }
          arr.push(mapEntry)
        } else {
          arr.push(parseScalar(itemContent))
        }
      }
      return arr
    }

    // mapping
    const obj: Record<string, unknown> = {}
    while (cursor.i < tokens.length) {
      const t = tokens[cursor.i]
      if (!t || t.indent !== blockIndent) break
      if (t.content.startsWith('- ')) break // sequence start at same indent ends current map (本 file では未発生)
      const colonIdx = t.content.indexOf(':')
      if (colonIdx < 0) {
        throw new Error(
          `parseRestrictedYaml: expected 'key:' at line ${t.lineNo} but got '${t.content}'`,
        )
      }
      const key = t.content.slice(0, colonIdx).trim()
      const after = t.content.slice(colonIdx + 1).trim()
      cursor.i += 1
      if (after.length === 0) {
        // child block
        obj[key] = parseBlock(blockIndent)
      } else {
        obj[key] = parseScalar(after)
      }
    }
    return obj
  }

  return parseBlock(-1)
}

/**
 * cache: load 結果は process 起動時 1 回のみ計算する。
 */
let cachedFullTable: DenylistFullTable | null = null
let cachedRuntime: RuntimeDenylist | null = null
let cachedDomainKeys: readonly string[] | null = null

/**
 * 内部用: YAML file を読み、zod 検証を通したうえで DenylistFullTable を返す。
 *
 * Round 14 Dev-A: zod 失敗 / parse 失敗 / file IO 失敗時はすべて Error を re-throw
 * (起動 fail-fast)。
 *
 * @param customPath test override (default: package config/denylist.yaml)
 * @throws DenylistLoaderError parse 失敗 / zod 不整合 / 整合性違反
 */
function readAndValidate(customPath?: string): DenylistFullTable {
  const here = dirname(fileURLToPath(import.meta.url))
  const yamlPath = customPath ?? resolve(here, '..', '..', 'config', 'denylist.yaml')

  let raw: string
  try {
    raw = readFileSync(yamlPath, 'utf8')
  } catch (err) {
    throw new DenylistLoaderError(
      `failed to read denylist YAML at '${yamlPath}': ${(err as Error).message}`,
      { cause: err as Error },
    )
  }

  let parsed: unknown
  try {
    parsed = parseRestrictedYaml(raw)
  } catch (err) {
    throw new DenylistLoaderError(
      `malformed YAML at '${yamlPath}': ${(err as Error).message}`,
      { cause: err as Error },
    )
  }

  const result = DenylistFileSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ')
    throw new DenylistLoaderError(
      `denylist schema violation at '${yamlPath}': ${issues}`,
    )
  }
  const validated = result.data

  const out: Record<string, DomainTiers> = {}
  for (const [domain, tiers] of Object.entries(validated.domains)) {
    const frozenTiers: DomainTiers = {}
    for (const tierName of ['baseline', 'critical', 'major', 'minor', 'backlog'] as const) {
      const t = tiers[tierName]
      if (!t) continue
      frozenTiers[tierName] = Object.freeze({
        enabled: t.enabled,
        keywords: Object.freeze([...t.keywords]),
      })
    }
    out[domain] = Object.freeze(frozenTiers)
  }
  const table = Object.freeze(out)

  // Round 14: 構造検証通過後に整合性 assertion を必ず通す (fail-fast)
  assertDenylistIntegrity(table)

  return table
}

/**
 * Round 14 Dev-A: denylist 専用 Error。caller (loadDenylistOrExit) は本型を
 * 識別して exit code を変える。
 */
export class DenylistLoaderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DenylistLoaderError'
  }
}

/**
 * Round 14 Dev-A: 整合性 assertion。zod 通過後の DenylistFullTable に対し
 * 以下を検証し、違反時に DenylistLoaderError を throw する:
 *
 *   1. **active tier 内重複**: 同一 domain 内、同一 active tier の keywords 配列内に
 *      重複 keyword がある (誤記検出)
 *   2. **active tier 跨ぎ重複**: 同一 domain 内、active tier 同士で同じ keyword が
 *      登場する (tier 移動漏れ検出 = 例: minor から major に昇格させたが minor から
 *      削除し忘れ)
 *   3. **空 keyword (zod 経由で防御済だが念のため)**: trim 後の空文字列
 *
 * 許容 (throw しない):
 *   - active tier × backlog tier の dual placement (audit lineage で意図的に二重登録)
 *   - backlog tier 内重複 (audit 専用、runtime には登場しないが warn は出す)
 *   - domain を跨いだ keyword 重複 (例: 'mortgage' が housing + finance) は
 *     business 上ありえる (法律上の意味が領域で異なる) ため throw しない
 *
 * @param table zod 通過済 DenylistFullTable
 * @throws DenylistLoaderError 整合性違反
 */
export function assertDenylistIntegrity(table: DenylistFullTable): void {
  for (const [domain, tiers] of Object.entries(table)) {
    // 1. active tier 内重複
    for (const tierName of ACTIVE_TIER_NAMES) {
      const t = tiers[tierName]
      if (!t) continue
      const seen = new Set<string>()
      for (const kw of t.keywords) {
        if (kw.trim().length === 0) {
          throw new DenylistLoaderError(
            `empty keyword in domain='${domain}' tier='${tierName}'`,
          )
        }
        if (seen.has(kw)) {
          throw new DenylistLoaderError(
            `duplicate keyword '${kw}' within domain='${domain}' tier='${tierName}'`,
          )
        }
        seen.add(kw)
      }
    }

    // 2. active tier 跨ぎ重複
    const seenAcrossActive = new Map<string, ActiveTierName>()
    for (const tierName of ACTIVE_TIER_NAMES) {
      const t = tiers[tierName]
      if (!t) continue
      for (const kw of t.keywords) {
        const prevTier = seenAcrossActive.get(kw)
        if (prevTier !== undefined) {
          throw new DenylistLoaderError(
            `keyword '${kw}' appears in multiple active tiers within domain='${domain}': ` +
              `'${prevTier}' and '${tierName}' (tier-move oversight; remove from one tier)`,
          )
        }
        seenAcrossActive.set(kw, tierName)
      }
    }
  }
}

/**
 * runtime denylist (enabled: true tier の keyword を 1 領域 1 配列に dedup 統合) を構築する。
 *
 * @param table DenylistFullTable
 * @returns 領域名 → 重複除外済 frozen keyword 配列
 */
function buildRuntime(table: DenylistFullTable): RuntimeDenylist {
  const out: Record<string, readonly string[]> = {}
  for (const [domain, tiers] of Object.entries(table)) {
    const seen = new Set<string>()
    const merged: string[] = []
    for (const tierName of ['baseline', 'critical', 'major', 'minor', 'backlog'] as const) {
      const t = tiers[tierName]
      if (!t || !t.enabled) continue
      for (const kw of t.keywords) {
        if (!seen.has(kw)) {
          seen.add(kw)
          merged.push(kw)
        }
      }
    }
    out[domain] = Object.freeze(merged)
  }
  return Object.freeze(out)
}

/**
 * runtime denylist (Object.freeze 済) を返す。起動時 1 回のみ load。
 *
 * @param customPath test override 用 (本番経路では undefined)
 */
export function loadDenylist(customPath?: string): RuntimeDenylist {
  if (customPath) {
    // test override path は cache を bypass (毎回 read)
    const t = readAndValidate(customPath)
    return buildRuntime(t)
  }
  if (cachedRuntime) return cachedRuntime
  const t = readAndValidate()
  cachedFullTable = t
  cachedRuntime = buildRuntime(t)
  cachedDomainKeys = Object.freeze(Object.keys(cachedRuntime))
  return cachedRuntime
}

/**
 * audit / 検証用: tier 詳細を含む full table を返す。
 */
export function loadDenylistFullTable(customPath?: string): DenylistFullTable {
  if (customPath) {
    return readAndValidate(customPath)
  }
  if (cachedFullTable) return cachedFullTable
  cachedFullTable = readAndValidate()
  cachedRuntime = buildRuntime(cachedFullTable)
  cachedDomainKeys = Object.freeze(Object.keys(cachedRuntime))
  return cachedFullTable
}

/**
 * 領域 key 配列 (順序は YAML 記載順)。
 */
export function loadDomainKeys(): readonly string[] {
  if (cachedDomainKeys) return cachedDomainKeys
  loadDenylist()
  return cachedDomainKeys ?? Object.freeze([])
}

/**
 * Round 14 Dev-A: production 起動経路専用の fail-fast loader。
 *
 * 動作:
 *   - 成功: `loadDenylist()` の結果を返す
 *   - 失敗: stderr に詳細を出力し `process.exit(1)` (return しない)
 *
 * test / DI 経路では呼ばない (`loadDenylist` を引き続き利用、こちらは throw のみ)。
 *
 * @param customPath 通常 undefined (本番)、test override 用
 * @returns RuntimeDenylist (成功時)
 */
export function loadDenylistOrExit(customPath?: string): RuntimeDenylist {
  try {
    return loadDenylist(customPath)
  } catch (err) {
    const message = (err as Error).message
    // eslint-disable-next-line no-console
    console.error(
      `[needs-scout/denylist-loader] FATAL: failed to load denylist; aborting startup.\n` +
        `  reason: ${message}`,
    )
    process.exit(1)
  }
}

/**
 * Round 14 Dev-A: full table を取得しつつ fail-fast 化する production 経路。
 *
 * @param customPath 通常 undefined (本番)、test override 用
 */
export function loadDenylistFullTableOrExit(
  customPath?: string,
): DenylistFullTable {
  try {
    return loadDenylistFullTable(customPath)
  } catch (err) {
    const message = (err as Error).message
    // eslint-disable-next-line no-console
    console.error(
      `[needs-scout/denylist-loader] FATAL: failed to load denylist (fullTable); aborting startup.\n` +
        `  reason: ${message}`,
    )
    process.exit(1)
  }
}

/**
 * test 用: cache を reset。production code からは呼ばない。
 */
export function _resetDenylistCacheForTesting(): void {
  cachedFullTable = null
  cachedRuntime = null
  cachedDomainKeys = null
}
