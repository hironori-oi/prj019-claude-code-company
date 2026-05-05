/**
 * pii-patterns.ts — PII redaction stage-1 actual (R32 物理化).
 *
 * 関連: KE-04 / HITL-11 / PIT-096 (R32 retrospective KPT 抽出時 PII 落とし穴).
 * 副作用: 0 / API call cost: $0 (regex 定義のみ).
 */

export type PiiCategory =
  | 'email'
  | 'phone'
  | 'credit_card'
  | 'aws_key'
  | 'anthropic_key'
  | 'openai_key'
  | 'github_pat'
  | 'jwt'
  | 'slack_token'
  | 'high_entropy_hex'

export interface PiiPattern {
  readonly category: PiiCategory
  readonly placeholder: string
  readonly regex: RegExp
  /** stage-1 priority (lower = higher priority / API キー系を先にマッチ). */
  readonly priority: number
}

/**
 * PII_PATTERNS — stage-1 regex detector 定義 (10 種 / priority 昇順).
 * 上流 detector で置換済の placeholder (`<...>`) は下流でマッチしないため
 * 二重置換は起きない設計。
 */
export const PII_PATTERNS: ReadonlyArray<PiiPattern> = Object.freeze([
  {
    category: 'anthropic_key',
    placeholder: '<ANTHROPIC_KEY>',
    regex: /sk-ant-[A-Za-z0-9_-]{20,}/g,
    priority: 1,
  },
  {
    category: 'openai_key',
    placeholder: '<OPENAI_KEY>',
    regex: /\b(?:sk-(?!ant-)|sess-)[A-Za-z0-9]{20,}\b/g,
    priority: 2,
  },
  {
    category: 'github_pat',
    placeholder: '<GITHUB_PAT>',
    regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
    priority: 3,
  },
  {
    category: 'slack_token',
    placeholder: '<SLACK_TOKEN>',
    regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
    priority: 4,
  },
  {
    category: 'aws_key',
    placeholder: '<AWS_KEY>',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    priority: 5,
  },
  {
    category: 'jwt',
    placeholder: '<JWT>',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    priority: 6,
  },
  {
    category: 'email',
    placeholder: '<EMAIL>',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    priority: 7,
  },
  {
    category: 'credit_card',
    placeholder: '<CREDIT_CARD>',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    priority: 8,
  },
  {
    category: 'phone',
    placeholder: '<PHONE>',
    regex: /\b(?:\+?\d{1,3}[ -]?)?(?:\(?\d{2,4}\)?[ -]?)?\d{2,4}[ -]?\d{3,4}[ -]?\d{3,4}\b/g,
    priority: 9,
  },
  {
    category: 'high_entropy_hex',
    placeholder: '<HEX_KEY>',
    regex: /\b[a-f0-9]{32,}\b/gi,
    priority: 10,
  },
])

/** 全カテゴリ列挙 (test 用). */
export const ALL_CATEGORIES: ReadonlyArray<PiiCategory> = Object.freeze(
  PII_PATTERNS.map((p) => p.category)
)
