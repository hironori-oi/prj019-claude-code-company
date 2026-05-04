/**
 * PRJ-019 Clawbridge - Anthropic API Budget Guard (DEC-019-050)
 *
 * 出典:
 *   - DEC-019-050 Anthropic API key 月次 spend cap = $30/月 (二重防御 = アプリ層)
 *   - DEC-019-049 Slack 3 channel 通知 (#prj019-monitor / #prj019-drill)
 *   - DEC-019-006 P-D 改 (subscription plan 主軸、API key 直接消費は補助限定)
 *
 * 三段階ガード:
 *   1. SOFT WARN     ($24 / 80%)   → Slack #monitor 通知 (継続可)
 *   2. AUTO STOP    ($28.5 / 95%)  → Slack #drill 通知 + ANTHROPIC_API_KEY env 削除推奨
 *                                     (process 内では削除不可、log で運用者に削除指示)
 *   3. HARD FAIL    ($30 / 100%)   → 例外 throw、API call 不可
 *
 * Threshold は ENV で override 可能 (テスト容易性):
 *   ANTHROPIC_MONTHLY_CAP_USD     (default 30)
 *   ANTHROPIC_WARN_THRESHOLD      (default 24)
 *   ANTHROPIC_STOP_THRESHOLD      (default 28.5)
 *
 * 月次リセット日: 毎月 1 日 0:00 UTC (Anthropic Console と同期)
 *
 * 依存:
 *   - cost_ledger テーブル (migration v2 で provider/model/cost_usd/month_year 追加済)
 *   - RPC `get_current_month_spend()` (open_claw_restricted role 経由可)
 *   - lib/notify/slack.ts ではなく app/lib/notify/slack.ts を使用
 *     (web 側は HTTP 経由で notification を発火させるため、内側 module は import せず ENV ベース)
 */
import "server-only";

import { getServiceClient } from "@/lib/supabase/server";

// =============================================================================
// Threshold resolution (ENV override 可)
// =============================================================================

export interface BudgetThresholds {
  capUsd: number;
  warnUsd: number;
  stopUsd: number;
}

export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholds = {
  capUsd: 30,
  warnUsd: 24,
  stopUsd: 28.5,
};

/** ENV から閾値を解決 (未設定時は default)、不正値は default にフォールバック。 */
export function resolveThresholds(env: NodeJS.ProcessEnv = process.env): BudgetThresholds {
  const num = (key: string, fallback: number): number => {
    const raw = env[key];
    if (!raw) return fallback;
    const v = Number.parseFloat(raw);
    if (!Number.isFinite(v) || v < 0) return fallback;
    return v;
  };
  const cap = num("ANTHROPIC_MONTHLY_CAP_USD", DEFAULT_BUDGET_THRESHOLDS.capUsd);
  const warn = num("ANTHROPIC_WARN_THRESHOLD", DEFAULT_BUDGET_THRESHOLDS.warnUsd);
  const stop = num("ANTHROPIC_STOP_THRESHOLD", DEFAULT_BUDGET_THRESHOLDS.stopUsd);

  // 順序整合: warn < stop < cap、崩れる場合は default に戻す
  if (!(warn < stop && stop < cap)) {
    return DEFAULT_BUDGET_THRESHOLDS;
  }
  return { capUsd: cap, warnUsd: warn, stopUsd: stop };
}

// =============================================================================
// Status types
// =============================================================================

export type BudgetTier = "ok" | "warn" | "auto_stop" | "hard_fail";

export interface BudgetStatus {
  tier: BudgetTier;
  spentUsd: number;
  capUsd: number;
  warnUsd: number;
  stopUsd: number;
  remainingUsd: number;
  percentUsed: number;
  /** 当月の YYYY-MM (UTC 基準) */
  monthYear: string;
  /** 次回リセット日 (UTC) */
  nextResetAt: string;
  /** リセットまでの残日数 (UTC、切り捨て) */
  daysUntilReset: number;
}

// =============================================================================
// Custom error
// =============================================================================

export class BudgetCapExceededError extends Error {
  public readonly code = "BUDGET_CAP_EXCEEDED";
  public readonly status: BudgetStatus;
  constructor(status: BudgetStatus) {
    super(
      `Anthropic API monthly cap exceeded: spent=$${status.spentUsd.toFixed(2)} cap=$${status.capUsd.toFixed(2)}`,
    );
    this.status = status;
    this.name = "BudgetCapExceededError";
  }
}

// =============================================================================
// Pure tier classification
// =============================================================================

export function classifyTier(spentUsd: number, t: BudgetThresholds): BudgetTier {
  if (spentUsd >= t.capUsd) return "hard_fail";
  if (spentUsd >= t.stopUsd) return "auto_stop";
  if (spentUsd >= t.warnUsd) return "warn";
  return "ok";
}

// =============================================================================
// Month boundary (毎月 1 日 0:00 UTC)
// =============================================================================

export function currentMonthYear(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function nextResetAt(now: Date = new Date()): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  // 翌月 1 日 0:00 UTC
  return new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
}

export function daysUntilReset(now: Date = new Date()): number {
  const reset = nextResetAt(now).getTime();
  const ms = reset - now.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

// =============================================================================
// Slack notification (env webhook 直接 POST、循環依存回避)
// =============================================================================

interface SlackPostParams {
  channel: "monitor" | "drill";
  header: string;
  context: string;
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}

async function postBudgetSlack(p: SlackPostParams): Promise<{ ok: boolean; reason?: string }> {
  const env = p.env ?? process.env;
  const envVar = p.channel === "monitor" ? "SLACK_WEBHOOK_MONITOR" : "SLACK_WEBHOOK_DRILL";
  const url = env[envVar];
  if (!url || url.startsWith("op://")) {
    return { ok: false, reason: `${envVar} not resolved (op:// or unset)` };
  }
  const fetchImpl = p.fetchImpl ?? fetch;
  const payload = {
    text: `[budget-guard] ${p.header}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: p.header.slice(0, 150), emoji: false },
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: p.context.slice(0, 3000) }],
      },
    ],
  };
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    return { ok: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// =============================================================================
// Core API
// =============================================================================

export interface BudgetGuardDeps {
  supabase?: ReturnType<typeof getServiceClient>;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (line: string) => void;
  /** test 用: spend 値を直接注入 (Supabase をスキップ) */
  spendOverride?: number;
}

/**
 * 月次 spend を Supabase RPC `get_current_month_spend()` から取得する。
 * env / supabase 未配備時は 0 (= ok 扱い) を返し fail-open する (DEC-019-031 の方針 = warn は出すが API は止めない)。
 */
export async function fetchCurrentMonthSpend(deps: BudgetGuardDeps = {}): Promise<number> {
  if (typeof deps.spendOverride === "number") return deps.spendOverride;
  const supabase = deps.supabase ?? getServiceClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("get_current_month_spend");
  if (error) {
    deps.log?.(`[budget-guard] rpc error: ${error.message}`);
    return 0;
  }
  return Number(data ?? 0);
}

/**
 * 現在の budget status を取得。閾値超過時に通知を発火 (warn=monitor / auto_stop=drill)。
 * hard_fail 時は throw する (呼び出し元の API call を止めるため)。
 */
export async function evaluateBudget(deps: BudgetGuardDeps = {}): Promise<BudgetStatus> {
  const env = deps.env ?? process.env;
  const now = deps.now ? deps.now() : new Date();
  const t = resolveThresholds(env);
  const spent = await fetchCurrentMonthSpend(deps);
  const tier = classifyTier(spent, t);

  const status: BudgetStatus = {
    tier,
    spentUsd: spent,
    capUsd: t.capUsd,
    warnUsd: t.warnUsd,
    stopUsd: t.stopUsd,
    remainingUsd: Math.max(0, t.capUsd - spent),
    percentUsed: t.capUsd > 0 ? Math.min(100, (spent / t.capUsd) * 100) : 0,
    monthYear: currentMonthYear(now),
    nextResetAt: nextResetAt(now).toISOString(),
    daysUntilReset: daysUntilReset(now),
  };

  if (tier === "warn") {
    await postBudgetSlack({
      channel: "monitor",
      header: `[PRJ-019] Budget WARN 80% reached ($${spent.toFixed(2)} / $${t.capUsd.toFixed(2)})`,
      context: `tier=warn / cap=$${t.capUsd} / warn=$${t.warnUsd} / next_reset=${status.nextResetAt}`,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      env,
    });
  } else if (tier === "auto_stop") {
    await postBudgetSlack({
      channel: "drill",
      header: `[PRJ-019] Budget AUTO_STOP 95% reached ($${spent.toFixed(2)} / $${t.capUsd.toFixed(2)})`,
      context: [
        `tier=auto_stop / threshold=$${t.stopUsd} / cap=$${t.capUsd}`,
        "ACTION REQUIRED: Anthropic API key を環境変数から削除すること (1Password Vault prj019/anthropic/api_key を一時 revoke 推奨)",
        "subscription plan (Claude Max + Codex Pro) のみで運用継続可能 (DEC-019-006 P-D 改)",
        `next_reset=${status.nextResetAt}`,
      ].join("\n"),
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      env,
    });
    deps.log?.(
      `[budget-guard] AUTO_STOP fired: remove ANTHROPIC_API_KEY from environment (DEC-019-050)`,
    );
  } else if (tier === "hard_fail") {
    await postBudgetSlack({
      channel: "drill",
      header: `[PRJ-019] Budget HARD_FAIL 100% — API calls blocked`,
      context: `tier=hard_fail / spent=$${spent.toFixed(2)} / cap=$${t.capUsd.toFixed(2)} / next_reset=${status.nextResetAt}`,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      env,
    });
    throw new BudgetCapExceededError(status);
  }

  return status;
}

/**
 * Anthropic API call の前に呼ぶ guard。hard_fail 時に例外 throw。
 *
 * 使い方:
 *   await assertBudgetAllowsCall();
 *   const res = await anthropic.messages.create(...);
 */
export async function assertBudgetAllowsCall(deps: BudgetGuardDeps = {}): Promise<BudgetStatus> {
  return evaluateBudget(deps);
}
