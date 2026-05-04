/**
 * skill-adapter/non-interactive — Round 10 案 10-α 前倒し (CB-D-W3-04 pre-emption):
 *   skill 起動時の対話プロンプト発生に対し、自動補完 / fail-safe デフォルト返却の
 *   純関数 wrapper。
 *
 * 設計方針:
 *   - skill (claude -p / open claw subprocess) 実行中に「対話 prompt」が発生した場合、
 *     subprocess 経由なので人間入力 stdin が無く、無限待機 → spawn timeout に陥る。
 *   - 本 adapter は **入力 prompt 文字列 + zod schema** を受け取り、以下を判定:
 *       (a) prompt が "対話 prompt" pattern にマッチするか (interactive 検出)
 *       (b) マッチした場合 → schema の fail-safe default 値を返却 (人間介入なし継続)
 *       (c) マッチしない場合 → undefined を返却 (caller 側で normal flow 継続)
 *   - **完全純関数**: 副作用 0、I/O 0、time 依存 0、テスト容易性最大化
 *   - **fail-safe**: 不明 prompt は安全側 (deny / abort) を選択 (false positive 容認、
 *     false negative 拒絶)。
 *   - **JSON IF 整合**: openclaw-to-ceo.schema.ts の DevKickoffProposalSchema /
 *     EscalationRequestMessageSchema と契約整合 (Round 9 Dev-A1 着地と互換)。
 *
 * 関連:
 *   - CB-D-W3-04 (skill non-interactive mode adapter)
 *   - DEC-019-007 第 9 種 dev_kickoff_approval (HITL gate)
 *   - DEC-019-025 Agent tool permissions SOP
 *   - app/openclaw-runtime/src/protocol/openclaw-to-ceo.schema.ts (Round 9 Dev-A1)
 */
import { z } from 'zod'

/**
 * 対話 prompt 検出パターン。
 *
 * skill が以下のような対話を要求する pattern を network/stdout から検出した場合、
 * fail-safe default を返却する。**lowercase 部分一致 fail-safe** (false positive 容認)。
 */
export const INTERACTIVE_PROMPT_PATTERNS: readonly string[] = Object.freeze([
  // 英語典型
  'do you want to',
  'are you sure',
  'continue? (y/n)',
  'continue? [y/n]',
  'please confirm',
  'press enter to continue',
  'enter to continue',
  'yes/no?',
  'y/n?',
  '[y/n]',
  '(y/n)',
  'type yes to confirm',
  'type "yes"',
  'enter your',
  'please enter',
  'enter password',
  'enter your password',
  'enter token',
  'enter api key',
  // 日本語典型
  '続行しますか',
  '実行しますか',
  '本当に',
  'よろしいですか',
  'キーを押して',
  'パスワードを入力',
  'トークンを入力',
])

/** 対話 prompt 検出方針 */
export interface InteractiveDetectorOptions {
  /** prompt パターン上書き (test 用、default = INTERACTIVE_PROMPT_PATTERNS) */
  readonly patterns?: readonly string[]
  /** 大文字小文字無視 (default true) */
  readonly caseInsensitive?: boolean
}

/**
 * 与えられた prompt 文字列が対話 prompt と判定されるかを返す。
 *
 * **完全純関数**: 入力 → bool 判定のみ。副作用 0。
 *
 * @param prompt skill subprocess の stdout / stderr から拾った prompt 文字列
 * @param options 検出方針 (default = INTERACTIVE_PROMPT_PATTERNS / caseInsensitive)
 * @returns true = 対話 prompt と判定 / false = 通常出力
 */
export function isInteractivePrompt(
  prompt: string,
  options: InteractiveDetectorOptions = {},
): boolean {
  const patterns = options.patterns ?? INTERACTIVE_PROMPT_PATTERNS
  const caseInsensitive = options.caseInsensitive ?? true
  const target = caseInsensitive ? prompt.toLowerCase() : prompt
  for (const p of patterns) {
    const pat = caseInsensitive ? p.toLowerCase() : p
    if (target.includes(pat)) return true
  }
  return false
}

/**
 * fail-safe default 適用結果。
 */
export interface NonInteractiveResolution<T> {
  /** prompt が interactive と判定されたか */
  readonly interactiveDetected: boolean
  /** 判定された場合に返す fail-safe default 値 (Schema が parse できる形) */
  readonly failSafeValue: T | undefined
  /** 検出に使った matched pattern (audit / debug 用) */
  readonly matchedPattern: string | undefined
  /** prompt が schema に parse 可能なら parsed 値 (interactive=false 時のみ意味あり) */
  readonly parsedValue: T | undefined
  /** 全体としての解決結果 (caller が使う最終値) */
  readonly resolved: T | undefined
  /** caller が "対応すべき action" の human-readable label */
  readonly action: 'fail_safe_default' | 'parsed' | 'unresolvable'
}

/**
 * resolve 方針。
 */
export interface ResolveNonInteractiveOptions<T> {
  /** schema parse target */
  readonly schema: z.ZodType<T>
  /** interactive 検出時に返す fail-safe default 値 */
  readonly failSafeDefault: T
  /** 検出 pattern 上書き (test 用) */
  readonly detectorPatterns?: readonly string[]
  /** lowercase 部分一致 (default true) */
  readonly caseInsensitive?: boolean
}

/**
 * skill subprocess 経由の出力 prompt を非対話モードに resolve する純関数。
 *
 * 動作:
 *   1. prompt が interactive 判定 → failSafeDefault を返す (action='fail_safe_default')
 *   2. interactive ではない、かつ schema parse 成功 → parsed 値を返す (action='parsed')
 *   3. 上記いずれでもなく、かつ caller が `failSafeDefault` を指定 → 不明扱いで undefined
 *      (action='unresolvable'; caller が caller-side の fail-safe を選択する)
 *
 * **完全純関数**: 副作用 0、I/O 0、time 依存 0。
 * **JSON IF 整合**: schema 引数で zod schema を受け、Round 9 Dev-A1 着地の
 * `openclaw-to-ceo.schema.ts` の任意 message schema と互換。
 *
 * @param promptOrJson skill subprocess からの stdout 出力 (JSON 文字列 or 対話 prompt)
 * @param options 検出方針 + schema + fail-safe default
 * @returns NonInteractiveResolution<T>
 */
export function resolveNonInteractive<T>(
  promptOrJson: string,
  options: ResolveNonInteractiveOptions<T>,
): NonInteractiveResolution<T> {
  const interactive = isInteractivePrompt(promptOrJson, {
    patterns: options.detectorPatterns,
    caseInsensitive: options.caseInsensitive ?? true,
  })

  // interactive 判定なら fail-safe default を採用
  if (interactive) {
    const matched = findMatchedPattern(
      promptOrJson,
      options.detectorPatterns ?? INTERACTIVE_PROMPT_PATTERNS,
      options.caseInsensitive ?? true,
    )
    return {
      interactiveDetected: true,
      failSafeValue: options.failSafeDefault,
      matchedPattern: matched,
      parsedValue: undefined,
      resolved: options.failSafeDefault,
      action: 'fail_safe_default',
    }
  }

  // 通常出力 → JSON parse → schema validate
  let raw: unknown
  try {
    raw = JSON.parse(promptOrJson)
  } catch {
    return {
      interactiveDetected: false,
      failSafeValue: undefined,
      matchedPattern: undefined,
      parsedValue: undefined,
      resolved: undefined,
      action: 'unresolvable',
    }
  }

  const safeParsed = options.schema.safeParse(raw)
  if (!safeParsed.success) {
    return {
      interactiveDetected: false,
      failSafeValue: undefined,
      matchedPattern: undefined,
      parsedValue: undefined,
      resolved: undefined,
      action: 'unresolvable',
    }
  }

  return {
    interactiveDetected: false,
    failSafeValue: undefined,
    matchedPattern: undefined,
    parsedValue: safeParsed.data,
    resolved: safeParsed.data,
    action: 'parsed',
  }
}

/**
 * 内部 helper: prompt から最初に hit した pattern を返す。
 */
function findMatchedPattern(
  prompt: string,
  patterns: readonly string[],
  caseInsensitive: boolean,
): string | undefined {
  const target = caseInsensitive ? prompt.toLowerCase() : prompt
  for (const p of patterns) {
    const pat = caseInsensitive ? p.toLowerCase() : p
    if (target.includes(pat)) return p
  }
  return undefined
}

/**
 * fail-safe default のお決まりセット。
 *
 * skill subprocess が「対話 confirmation を要求」した時、安全側に倒す default を返す。
 *   - confirm 系 → false (deny)
 *   - 文字入力系 → "" (空)
 *   - HITL escalation 必須なら caller 側で別途 EscalationRequestMessage 発出
 */
export const FAIL_SAFE_DEFAULTS = Object.freeze({
  /** y/n confirm → 安全側 = no */
  confirmDeny: false,
  /** y/n confirm → 危険側 = 使用禁止、test 用 */
  confirmAccept: true,
  /** free text → 空文字列 */
  emptyString: '',
  /** numeric → 0 */
  zeroNumber: 0,
})
