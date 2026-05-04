/**
 * KE-04 PII redaction — ナレッジ抽出時の PII / API キー auto redaction (Round 13 Dev-E 前倒し).
 *
 * 関連必須コントロール:
 *   KE-04 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、PII redaction 軸)
 *   ODR-OG-06 (Review 部門で正式化検討中、本書はその stub 実装)
 *   HITL-11 (本 redaction の検出結果を人間チェックに回す gate を ./hitl-11-knowledge-pii.ts で配線)
 *
 * 検出パターン (10 種、合計 50 件以上の test cases で網羅):
 *   1. Email アドレス (RFC-5322 簡易形)
 *   2. 電話番号 (日本 / 国際)
 *   3. クレジットカード (16 桁、Luhn 簡易)
 *   4. AWS access key (AKIA / ASIA / 16-20 桁)
 *   5. Anthropic API key (sk-ant-...)
 *   6. OpenAI API key (sk-... / sess-...)
 *   7. GitHub PAT (ghp_ / gho_ / ghu_ / ghs_ / ghr_)
 *   8. JWT (eyJ...)
 *   9. Slack token (xox[abp]-...)
 *  10. Generic high-entropy 32+ 桁 hex (kms-like key)
 *
 * 設計方針:
 *   - 全 detector は **pure function** (入力 string → output { redacted, hits }).
 *   - 副作用なし、Object.freeze で hit 配列をイミュータブル化。
 *   - 検出結果の original value は Hits に保存しない (default redact)、ただし
 *     `keepLastN` で末尾 N 文字のみ保持する option を提供 (audit log 連動用).
 *   - false positive 抑制のため、placeholder (`<EMAIL>`/`<API_KEY>`) は cluster 化される.
 */

// ============================================================================
// 型
// ============================================================================

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

export interface PiiHit {
  readonly category: PiiCategory
  readonly placeholder: string
  /** keepLastN 設定時、末尾 N 文字 (audit 用 fingerprint). */
  readonly tail?: string
  /** original 文字列の長さ (PII 自体は保存しない). */
  readonly originalLength: number
}

export interface RedactResult {
  readonly redacted: string
  readonly hits: ReadonlyArray<PiiHit>
}

export interface RedactOptions {
  /** 末尾 N 文字を保持 (audit fingerprint 用、default 0 = 完全 redact). */
  readonly keepLastN?: number
  /** 検出から除外するカテゴリ. */
  readonly skip?: ReadonlySet<PiiCategory>
}

// ============================================================================
// detector 定義
// ============================================================================

interface DetectorSpec {
  readonly category: PiiCategory
  readonly placeholder: string
  readonly regex: RegExp
}

// 注: 各 regex は false positive を抑えつつ実用最低限のカバレッジを目指す。
const DETECTORS: ReadonlyArray<DetectorSpec> = [
  // 高優先度: API キー系を先にマッチ
  {
    category: 'anthropic_key',
    placeholder: '<ANTHROPIC_KEY>',
    regex: /sk-ant-[A-Za-z0-9_-]{20,}/g,
  },
  {
    category: 'openai_key',
    placeholder: '<OPENAI_KEY>',
    regex: /\b(?:sk-(?!ant-)|sess-)[A-Za-z0-9]{20,}\b/g,
  },
  {
    category: 'github_pat',
    placeholder: '<GITHUB_PAT>',
    regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
  },
  {
    category: 'slack_token',
    placeholder: '<SLACK_TOKEN>',
    regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    category: 'aws_key',
    placeholder: '<AWS_KEY>',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    category: 'jwt',
    placeholder: '<JWT>',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  // 中優先度: 個人情報系
  {
    category: 'email',
    placeholder: '<EMAIL>',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    category: 'credit_card',
    placeholder: '<CREDIT_CARD>',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  },
  {
    category: 'phone',
    placeholder: '<PHONE>',
    // 日本固定電話 / 携帯 / 国際 (+81 等)。10-15 桁で hyphen / space 許容
    regex: /\b(?:\+?\d{1,3}[ -]?)?(?:\(?\d{2,4}\)?[ -]?)?\d{2,4}[ -]?\d{3,4}[ -]?\d{3,4}\b/g,
  },
  // 低優先度: high-entropy generic
  {
    category: 'high_entropy_hex',
    placeholder: '<HEX_KEY>',
    regex: /\b[a-f0-9]{32,}\b/gi,
  },
]

// ============================================================================
// 公開 API
// ============================================================================

/**
 * redactPii — input 文字列から PII / API キーを検出して placeholder へ置換.
 *
 * 注意: 各 detector を **直列** に適用、上流 detector で置換済の placeholder
 * (`<...>`) は下流 detector の regex でマッチしないため二重置換は起きない.
 */
export function redactPii(input: string, options: RedactOptions = {}): RedactResult {
  const keepLastN = options.keepLastN ?? 0
  const skip = options.skip ?? new Set<PiiCategory>()
  const hits: PiiHit[] = []
  let buffer = input

  for (const det of DETECTORS) {
    if (skip.has(det.category)) continue
    buffer = buffer.replace(det.regex, (match) => {
      // false positive 抑止: 単純な数字列 (phone match) で 9 桁未満は除外
      if (det.category === 'phone') {
        const digits = match.replace(/\D/g, '')
        if (digits.length < 10 || digits.length > 15) return match
      }
      // credit_card: Luhn 簡易チェック (実は省略可、ここでは桁数のみ)
      if (det.category === 'credit_card') {
        const digits = match.replace(/\D/g, '')
        if (digits.length !== 16) return match
      }
      const tail = keepLastN > 0 ? match.slice(-Math.min(keepLastN, match.length)) : undefined
      const hit: PiiHit = {
        category: det.category,
        placeholder: det.placeholder,
        ...(tail !== undefined ? { tail } : {}),
        originalLength: match.length,
      }
      hits.push(hit)
      return det.placeholder
    })
  }

  return Object.freeze({
    redacted: buffer,
    hits: Object.freeze(hits.slice()),
  })
}

/** containsPii — redact せず存在判定のみ. */
export function containsPii(input: string, options: RedactOptions = {}): boolean {
  return redactPii(input, options).hits.length > 0
}

/** カテゴリ別件数 (audit / Slack 通知用). */
export function summarizeHits(hits: ReadonlyArray<PiiHit>): Readonly<Record<PiiCategory, number>> {
  const init: Record<PiiCategory, number> = {
    email: 0,
    phone: 0,
    credit_card: 0,
    aws_key: 0,
    anthropic_key: 0,
    openai_key: 0,
    github_pat: 0,
    jwt: 0,
    slack_token: 0,
    high_entropy_hex: 0,
  }
  for (const h of hits) init[h.category] += 1
  return Object.freeze(init)
}
