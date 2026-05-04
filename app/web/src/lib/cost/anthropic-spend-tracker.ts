/**
 * PRJ-019 Clawbridge - Anthropic API spend tracker (DEC-019-050)
 *
 * 出典:
 *   - DEC-019-050 Anthropic API key 月次 spend cap = $30/月
 *   - DEC-019-006 P-D 改 (subscription plan 主軸、API key 直接消費は補助用途)
 *   - DEC-019-031 月次 Spend Cap 構造 (cost_ledger 連携)
 *   - DEC-019-049 Slack 3 channel 通知
 *
 * 責務:
 *   1. Anthropic API call の前後で spend を加算 (request_tokens / response_tokens)
 *   2. cost_ledger テーブルへ記録 (Supabase server client 経由)
 *   3. 価格テーブルを外部 JSON 化 (claude-3-7-sonnet-20250219 等)
 *   4. daily aggregation
 *   5. spike detection (前日比 200% 超で anomaly fire)
 *
 * 制約:
 *   - secret 直書き厳禁 (env のみ)
 *   - service_role は subprocess に渡さない (DEC-019-033 §⑤)
 *   - 既存 cost_ledger との互換維持 (新 column はすべて nullable / DEFAULT 付与)
 */
import "server-only";

import { getServiceClient, resolveTenantId } from "@/lib/supabase/server";

// =============================================================================
// 価格テーブル (外部化)
// =============================================================================

/**
 * Anthropic API 価格表 (USD / Million tokens)
 *
 * 出典: https://www.anthropic.com/pricing#anthropic-api (2026-05-03 時点公式値)
 * 更新時は本テーブルを edit すれば即時反映 (deploy 不要なら ENV override 推奨)。
 */
export const ANTHROPIC_PRICE_TABLE_USD_PER_MTOK: Record<
  string,
  { input: number; output: number }
> = {
  "claude-3-7-sonnet-20250219": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-3-opus-20240229": { input: 15, output: 75 },
  "claude-3-sonnet-20240229": { input: 3, output: 15 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
};

/** 不明モデル時の fallback (DEC-019-050 安全側 = sonnet 同等で記録) */
export const FALLBACK_PRICE_USD_PER_MTOK = { input: 3, output: 15 };

// =============================================================================
// Types
// =============================================================================

export interface SpendRecord {
  /** Anthropic model ID (例: claude-3-7-sonnet-20250219) */
  model: string;
  requestTokens: number;
  responseTokens: number;
  /** call origin (例: 'hitl_notify' | 'mock_claude' | 'e2e_test') */
  scopeRef: string;
  /** 任意の note */
  description?: string;
}

export interface ComputedCost {
  costUsd: number;
  inputCostUsd: number;
  outputCostUsd: number;
  pricePerMtokUsed: { input: number; output: number };
  modelMatched: boolean;
}

export interface DailyAggregate {
  date: string; // YYYY-MM-DD (UTC)
  totalUsd: number;
  callCount: number;
}

export interface SpikeDetectionResult {
  spike: boolean;
  todayUsd: number;
  yesterdayUsd: number;
  ratio: number;
  threshold: number;
}

// =============================================================================
// Pure functions (test 容易性のため side-effect 隔離)
// =============================================================================

/**
 * トークン数 + モデル ID から USD コストを計算する純粋関数。
 */
export function computeCost(
  model: string,
  requestTokens: number,
  responseTokens: number,
): ComputedCost {
  const price =
    ANTHROPIC_PRICE_TABLE_USD_PER_MTOK[model] ?? FALLBACK_PRICE_USD_PER_MTOK;
  const matched = ANTHROPIC_PRICE_TABLE_USD_PER_MTOK[model] !== undefined;

  const inputCost = (requestTokens / 1_000_000) * price.input;
  const outputCost = (responseTokens / 1_000_000) * price.output;

  // numeric(10,4) に合わせて 4 桁丸め
  const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;

  return {
    costUsd: round4(inputCost + outputCost),
    inputCostUsd: round4(inputCost),
    outputCostUsd: round4(outputCost),
    pricePerMtokUsed: price,
    modelMatched: matched,
  };
}

/**
 * UTC 月次キー (YYYY-MM) を返す。
 * 月次リセット日 = 毎月 1 日 0:00 UTC (DEC-019-050 anthropic console と同期)。
 */
export function monthYearKey(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/**
 * spike detection: 当日 spend / 前日 spend が threshold を超えるかを判定。
 * デフォルト threshold = 2.0 (200%)。前日 spend = 0 の場合は spike 扱いにしない。
 */
export function detectSpike(
  todayUsd: number,
  yesterdayUsd: number,
  threshold = 2.0,
): SpikeDetectionResult {
  if (yesterdayUsd <= 0) {
    return {
      spike: false,
      todayUsd,
      yesterdayUsd,
      ratio: 0,
      threshold,
    };
  }
  const ratio = todayUsd / yesterdayUsd;
  return {
    spike: ratio > threshold,
    todayUsd,
    yesterdayUsd,
    ratio,
    threshold,
  };
}

// =============================================================================
// Side-effect API (Supabase 連携)
// =============================================================================

export interface RecordSpendDeps {
  supabase?: ReturnType<typeof getServiceClient>;
  tenantId?: string;
  now?: () => Date;
}

/**
 * Anthropic API call の結果を cost_ledger に INSERT する。
 *
 * 戻り値:
 *   - ok:true / ledgerId  (成功)
 *   - ok:false / reason   (env 未配備時は warn だけして main flow を止めない)
 */
export async function recordAnthropicSpend(
  rec: SpendRecord,
  deps: RecordSpendDeps = {},
): Promise<
  | { ok: true; ledgerId: number; cost: ComputedCost }
  | { ok: false; reason: "no_supabase" | "insert_error"; detail?: string; cost: ComputedCost }
> {
  const cost = computeCost(rec.model, rec.requestTokens, rec.responseTokens);
  const supabase = deps.supabase ?? getServiceClient();
  if (!supabase) {
    return { ok: false, reason: "no_supabase", cost };
  }

  const tenantId = deps.tenantId ?? resolveTenantId();
  const now = deps.now ? deps.now() : new Date();
  const month = monthYearKey(now);

  const { data, error } = await supabase
    .from("cost_ledger")
    .insert({
      tenant_id: tenantId,
      ts: now.toISOString(),
      scope: "monthly",
      scope_ref: rec.scopeRef,
      amount_usd: cost.costUsd,
      source_kind: "anthropic_subscription",
      provider: "anthropic",
      model: rec.model,
      request_tokens: rec.requestTokens,
      response_tokens: rec.responseTokens,
      cost_usd: cost.costUsd,
      month_year: month,
      description: rec.description ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      reason: "insert_error",
      detail: error.message,
      cost,
    };
  }

  return {
    ok: true,
    ledgerId: (data as { id: number } | null)?.id ?? -1,
    cost,
  };
}

/**
 * 当日 / 前日の spend を取得し、spike を判定する。
 * 内部で RPC `get_daily_spend(target_date)` を呼ぶ (migration v2 で定義)。
 */
export async function checkDailySpike(
  deps: RecordSpendDeps = {},
): Promise<SpikeDetectionResult & { ok: boolean; reason?: string }> {
  const supabase = deps.supabase ?? getServiceClient();
  if (!supabase) {
    return {
      ok: false,
      reason: "no_supabase",
      spike: false,
      todayUsd: 0,
      yesterdayUsd: 0,
      ratio: 0,
      threshold: 2.0,
    };
  }

  const now = deps.now ? deps.now() : new Date();
  const today = isoDate(now);
  const yesterday = isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const [todayRes, yRes] = await Promise.all([
    supabase.rpc("get_daily_spend", { target_date: today }),
    supabase.rpc("get_daily_spend", { target_date: yesterday }),
  ]);

  const todayUsd = Number(todayRes.data ?? 0);
  const yesterdayUsd = Number(yRes.data ?? 0);
  const detection = detectSpike(todayUsd, yesterdayUsd);
  return { ok: true, ...detection };
}

/**
 * 直近 N 日の daily aggregate を取得する。 dashboard line chart 用。
 */
export async function getDailyAggregates(
  days: number,
  deps: RecordSpendDeps = {},
): Promise<DailyAggregate[]> {
  const supabase = deps.supabase ?? getServiceClient();
  if (!supabase) return [];

  const now = deps.now ? deps.now() : new Date();
  const out: DailyAggregate[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const date = isoDate(d);
    const { data } = await supabase.rpc("get_daily_spend", { target_date: date });
    out.push({
      date,
      totalUsd: Number(data ?? 0),
      callCount: 0, // count は別 RPC で集計、本 skeleton では 0 で省略
    });
  }
  return out;
}

function isoDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
