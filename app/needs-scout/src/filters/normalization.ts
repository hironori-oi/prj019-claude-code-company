/**
 * needs-scout filters/normalization — Round 12 Dev-A:
 *   全角/半角混在 + 大小文字混在 + Unicode 等価変種に耐性のある
 *   入力正規化レイヤ (CB-D-W3-01 強化、Round 10/11 NFKC 引継完遂)。
 *
 * 設計方針:
 *   - **完全純関数 (pure function)**: 副作用 0、I/O 0、入力同値 → 出力同値。
 *   - String.prototype.normalize('NFKC') を中核に置き、
 *     全角英数字 → 半角英数字 / 半角カナ → 全角カナ / 互換漢字統一を吸収。
 *   - lowercase 化は NFKC 後に適用 (NFKC が大文字 fullwidth を半角化した後の方が一貫)。
 *   - 連続空白 (半角 SPACE / 全角 SPACE / TAB / CR / LF / NBSP / IDEOGRAPHIC SPACE)
 *     を 1 つの ASCII space に圧縮。
 *   - 形態素解析エンジン (kuromoji 等) は **依存追加禁止** (API 追加コスト $0 / runtime cost 制約)、
 *     代わりに句読点 + 記号 + 空白で粗分割した token 候補を返す近似形態素を採用。
 *   - PII redaction は 4 種 (メール / 電話 / クレジットカード番号 / IPv4) の
 *     pattern マッチで `[REDACTED:type]` 化、HITL 第 11 種 knowledge_pii_review と整合。
 *   - 後方互換: 既存 critical-domain-filter は本 layer を **判定前に通すだけ** で動作変更なし
 *     (denylist 配列は元から lowercase + ASCII 半角で記述済 → NFKC 通しても等価)。
 *
 * 関連:
 *   - DEC-019-010 (重要 13 領域 fail-safe denylist)
 *   - CB-D-W3-01 (needs_scout skill config 直接埋込)
 *   - knowledge-round11-mining-batch-2.md (PII protection HITL ゲート)
 *   - dev-round10-alpha-denylist-skill-adapter.md §7.2 (NFKC 引継)
 *   - dev-round11-A-denylist-subprocess.md §7.2 (Round 12 NFKC 引継)
 */

/**
 * 連続空白圧縮対象 (半角 SPACE / TAB / 全角 SPACE / NBSP / IDEOGRAPHIC SPACE / CR / LF / FF / VT)。
 * NFKC 後に評価するため、一部の Unicode 互換空白は半角 SPACE に変換済の状態を想定するが、
 * NFKC で吸収されない非互換空白 (NBSP U+00A0 / IDEOGRAPHIC SPACE U+3000 等) のために保険として網羅。
 */
const WHITESPACE_PATTERN = /[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]+/g

/**
 * Token 分割に用いる区切り文字。
 * 句読点 / 括弧 / 引用符 / 記号 / 演算子記号類を網羅。
 * NFKC 後の半角化前提で半角記号を主軸に、日本語句読点 (、。「」『』) も保険として並列化。
 */
const TOKEN_SPLIT_PATTERN =
  /[\s\u00A0\u3000`~!@#$%^&*()_\-=+[\]{}\\|;:'",.<>/?、。「」『』《》【】〈〉…‥・〜～]+/g

/**
 * PII redaction pattern table (順序固定: 長い match から先に redact し被りを防ぐ)。
 *
 * - email: RFC 5322 簡易版 (大半の現実 email を捕捉、完全準拠は避けて偽陰性 vs 偽陽性のバランス)
 * - credit_card: 13-19 桁の連続数字 (区切りは ASCII space / hyphen / NBSP)、Luhn 検証は性能上スキップ
 * - phone_jp: 日本国内の典型 (0X0-XXXX-XXXX / 0X-XXXX-XXXX / XXX-XXXX-XXXX)
 * - phone_intl: + プレフィックス国際電話 (E.164)
 * - ipv4: IPv4 アドレス (0-255 範囲チェックは省略、4 オクテット形式に限定)
 */
const PII_PATTERNS: ReadonlyArray<{
  readonly type: 'email' | 'credit_card' | 'phone' | 'ipv4'
  readonly regex: RegExp
}> = Object.freeze([
  // email — NFKC 後の半角 ASCII 形を想定。
  {
    type: 'email',
    regex:
      /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi,
  },
  // credit card — 13-19 桁、4 桁グループ + 任意 separator (- or space) も許容。
  {
    type: 'credit_card',
    regex: /\b(?:\d[ \-]?){12,18}\d\b/g,
  },
  // phone (international + JP) — `+` から始まる E.164 / 0 から始まる JP local。
  {
    type: 'phone',
    regex:
      /(?:\+\d{1,3}[\- ]?)?(?:\d{2,4}[\- ]?)?\d{2,4}[\- ]\d{3,4}[\- ]\d{3,4}/g,
  },
  // IPv4 — 4 オクテット (loose、範囲チェックなし)。
  {
    type: 'ipv4',
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  },
])

/**
 * filter 判定用の正規化済み文字列を生成する。
 *
 * 処理順:
 *   1. NFKC 正規化 (全角英数字 → 半角 / 互換漢字統一 / 互換空白吸収)
 *   2. lowercase 化 (NFKC 後の半角 ASCII 範囲を一律 lower 化)
 *   3. 連続空白を 1 つの ASCII space に圧縮
 *   4. 前後空白 trim
 *
 * 純関数性: 入力同値 → 出力同値。例外 throw なし (`safeNormalize` で型ガード済前提だが、
 * 直接 string を渡されても副作用 0 で動作する)。
 *
 * @param input 任意の文字列 (string 型)
 * @returns NFKC + lowercase + 空白圧縮済の文字列
 */
export function normalizeForFilter(input: string): string {
  const nfkc = input.normalize('NFKC')
  const lower = nfkc.toLowerCase()
  const collapsed = lower.replace(WHITESPACE_PATTERN, ' ')
  return collapsed.trim()
}

/**
 * 正規化済 string から token 候補配列を抽出する (形態素近似)。
 *
 * 句読点 / 記号 / 空白で粗分割し、語境界で分かれた候補を返す。
 * 例: '弁護士法 72 条 と attorney advice' → ['弁護士法', '72', '条', 'と', 'attorney', 'advice']
 *
 * 本格的な形態素解析 (kuromoji 等) は依存追加コスト + runtime cost のため採用せず、
 * 連結辞書ベースの denylist (部分一致) と相性の良い token 列挙を優先。
 *
 * 純関数性: 副作用 0、入力同値 → 出力同値。空文字 / 空白のみ → 空配列。
 *
 * @param normalized normalizeForFilter() の出力 (lowercase + NFKC 済)
 * @returns 連続記号で区切られた非空 token の readonly 配列
 */
export function extractTokenCandidates(
  normalized: string,
): readonly string[] {
  if (normalized.length === 0) return Object.freeze([])
  const parts = normalized.split(TOKEN_SPLIT_PATTERN)
  const filtered: string[] = []
  for (const p of parts) {
    if (p.length > 0) filtered.push(p)
  }
  return Object.freeze(filtered)
}

/**
 * 正規化済 string が指定 pattern を含むか判定する pure 検査。
 *
 * `String.prototype.includes` を直接使う薄い wrapper だが、
 * 呼び出し側が **常に正規化済 input** を渡す契約を型で表現する目的を持つ。
 * pattern も呼び出し側で正規化済 (lowercase + NFKC) を渡すこと。
 *
 * @param normalized normalizeForFilter() の出力
 * @param pattern lowercase + NFKC 済の検索 pattern
 * @returns pattern を含むなら true
 */
export function containsCriticalPattern(
  normalized: string,
  pattern: string,
): boolean {
  if (pattern.length === 0) return false
  return normalized.includes(pattern)
}

/**
 * PII (個人情報 / 機密情報) を `[REDACTED:type]` で置換する。
 *
 * 検出順序: email → credit_card → phone → ipv4。
 * email を先に redact することで 'foo@bar.com' に内包される数字列が
 * credit_card / phone と誤検出されるリスクを低減。
 *
 * 純関数性: 副作用 0、入力同値 → 出力同値 (RegExp の lastIndex 影響を回避するため
 * 各 pattern は spread 経由で新規 RegExp 化はせず、stateless flag g + replace で動作)。
 *
 * @param input 任意の文字列
 * @returns PII 4 種を `[REDACTED:type]` 化した文字列
 */
export function redactPII(input: string): string {
  let result = input
  for (const { type, regex } of PII_PATTERNS) {
    result = result.replace(regex, `[REDACTED:${type}]`)
  }
  return result
}

/**
 * 任意型の入力を string に safe coerce する。
 *
 * - null / undefined → 空文字
 * - string → そのまま
 * - number / boolean → String() 経由
 * - object / array / その他 → 空文字 (JSON.stringify は循環参照で throw するため避ける)
 *
 * 例外 throw なし (filter 経路で fail-safe 動作を維持)。
 *
 * @param input 任意型の値 (unknown)
 * @returns 必ず string (空文字を含む)
 */
export function safeNormalize(input: unknown): string {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input)
  }
  // object / array / function / symbol / bigint は filter 経路で扱う想定なし。
  // 安全側で空文字を返す (fail-safe denylist が誤動作するより accept されない方向に倒す)。
  return ''
}
