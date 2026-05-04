/**
 * PRJ-019 Clawbridge — HITL placeholder PII redactor
 *
 * Source of truth: dev-w0-week2-t2-hitl-template-design.md §5.2 / §10 R-T2-1
 *
 * 設計方針:
 *   - placeholder 値 (actor / context / evidence 等) に email / API key / OAuth token /
 *     Slack DM URL が混入した場合、`[redacted:<kind>]` に置換
 *   - regex 95% カバー + LLM 5% 補完は HITL-11 batch 専用 (本 module は regex のみ)
 *   - HITL-11 PII review 経路とは独立 (本 module は 通知 placeholder の防御層)
 *   - 決定論的 (LLM 不要、副作用なし)
 */

const PATTERNS: Array<{ kind: string; re: RegExp }> = [
  // email (RFC 5321 簡易)
  { kind: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  // Slack DM / channel URL (workspace.slack.com/archives/D... or G... or C...)
  { kind: 'slack_url', re: /https?:\/\/[A-Za-z0-9.-]+\.slack\.com\/archives\/[A-Z0-9]+(?:\/[^\s]*)?/g },
  // OpenAI key (sk-...)
  { kind: 'api_key', re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  // Anthropic key (sk-ant-...)
  { kind: 'api_key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  // GitHub PAT (ghp_..., gho_..., ghs_...)
  { kind: 'github_pat', re: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{20,}\b/g },
  // Bearer token (header value)
  { kind: 'bearer', re: /\bBearer\s+[A-Za-z0-9._\-+/=]{20,}\b/g },
  // 1Password op:// reference (DEC-019-048 違反通知の二次防御)
  { kind: 'op_ref', re: /\bop:\/\/[A-Za-z0-9_/\-]+\b/g },
  // 16-digit number (credit card 風)
  { kind: 'credit_card', re: /\b(?:\d[ -]*?){13,16}\b/g },
];

/**
 * 文字列内の PII を `[redacted:<kind>]` に置換。
 * detection 順は specific → general (api_key 系を email より先に処理)。
 */
export function redactString(input: string): string {
  let out = input;
  for (const { kind, re } of PATTERNS) {
    out = out.replace(re, `[redacted:${kind}]`);
  }
  return out;
}

/**
 * Object 全プロパティを deep redact (string field のみ)。
 * 配列も再帰的に処理。
 */
export function redactPayload<T>(value: T): T {
  if (typeof value === 'string') {
    return redactString(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactPayload(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactPayload(v);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * regex 検出件数 (テスト / metrics 用).
 */
export function countPiiHits(input: string): number {
  let total = 0;
  for (const { re } of PATTERNS) {
    const matches = input.match(re);
    if (matches) total += matches.length;
  }
  return total;
}
