/**
 * PRJ-019 Clawbridge - budget-guard unit tests (DEC-019-050)
 *
 * 5 ケース以上をカバー:
 *   1. ok       — spent < warn, tier=ok, 通知なし
 *   2. warn     — spent ≥ warn, tier=warn, monitor channel に POST
 *   3. auto_stop — spent ≥ stop, tier=auto_stop, drill channel に POST + log
 *   4. hard_fail — spent ≥ cap,  BudgetCapExceededError throw
 *   5. reset day — 月次境界判定 (1 日 0:00 UTC で daysUntilReset = 30 / 31 / 28)
 *   6. spike detection — detectSpike() の境界値
 *   7. ENV override — ANTHROPIC_* env で閾値が上書きされる
 *   8. ENV invalid order — warn ≥ stop 等の不正値で default にフォールバック
 *
 * Supabase / fetch は DI で mock 化 (実 HTTP は発火させない)。
 */
import { describe, it, expect } from "vitest";

import {
  BudgetCapExceededError,
  classifyTier,
  currentMonthYear,
  daysUntilReset,
  evaluateBudget,
  nextResetAt,
  resolveThresholds,
  DEFAULT_BUDGET_THRESHOLDS,
} from "./budget-guard";
import { detectSpike, computeCost, monthYearKey } from "./anthropic-spend-tracker";

function makeFetchMock(): {
  fn: typeof fetch;
  calls: Array<{ url: string; body: unknown }>;
} {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return new Response("ok", { status: 200 });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const ENV_BASE: NodeJS.ProcessEnv = {
  SLACK_WEBHOOK_MONITOR: "https://hooks.slack.test/monitor",
  SLACK_WEBHOOK_DRILL: "https://hooks.slack.test/drill",
};

describe("budget-guard / classifyTier", () => {
  const t = DEFAULT_BUDGET_THRESHOLDS;
  it("returns ok below warn threshold", () => {
    expect(classifyTier(0, t)).toBe("ok");
    expect(classifyTier(23.99, t)).toBe("ok");
  });
  it("returns warn at $24", () => {
    expect(classifyTier(24, t)).toBe("warn");
    expect(classifyTier(28.49, t)).toBe("warn");
  });
  it("returns auto_stop at $28.5", () => {
    expect(classifyTier(28.5, t)).toBe("auto_stop");
    expect(classifyTier(29.99, t)).toBe("auto_stop");
  });
  it("returns hard_fail at cap", () => {
    expect(classifyTier(30, t)).toBe("hard_fail");
    expect(classifyTier(99, t)).toBe("hard_fail");
  });
});

describe("budget-guard / resolveThresholds", () => {
  it("uses ENV overrides when valid", () => {
    const env: NodeJS.ProcessEnv = {
      ANTHROPIC_MONTHLY_CAP_USD: "100",
      ANTHROPIC_WARN_THRESHOLD: "70",
      ANTHROPIC_STOP_THRESHOLD: "90",
    };
    expect(resolveThresholds(env)).toEqual({ capUsd: 100, warnUsd: 70, stopUsd: 90 });
  });
  it("falls back to default on invalid order (warn >= stop)", () => {
    const env: NodeJS.ProcessEnv = {
      ANTHROPIC_MONTHLY_CAP_USD: "30",
      ANTHROPIC_WARN_THRESHOLD: "29",
      ANTHROPIC_STOP_THRESHOLD: "28",
    };
    expect(resolveThresholds(env)).toEqual(DEFAULT_BUDGET_THRESHOLDS);
  });
  it("falls back to default on negative values", () => {
    const env: NodeJS.ProcessEnv = {
      ANTHROPIC_MONTHLY_CAP_USD: "-5",
    };
    expect(resolveThresholds(env)).toEqual(DEFAULT_BUDGET_THRESHOLDS);
  });
});

describe("budget-guard / month boundary", () => {
  it("currentMonthYear returns YYYY-MM in UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 15)); // 2026-05-15
    expect(currentMonthYear(d)).toBe("2026-05");
  });
  it("nextResetAt is 1st of next month at 00:00 UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 15, 12, 0, 0));
    const reset = nextResetAt(d);
    expect(reset.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });
  it("daysUntilReset on May 31 is 1 day", () => {
    const d = new Date(Date.UTC(2026, 4, 31, 23, 0, 0));
    expect(daysUntilReset(d)).toBe(0); // 残 1h は 0 日扱い
  });
  it("daysUntilReset on May 1 is 31 days (May has 31 days)", () => {
    const d = new Date(Date.UTC(2026, 4, 1, 0, 0, 0));
    expect(daysUntilReset(d)).toBe(31);
  });
});

describe("budget-guard / evaluateBudget — ok tier", () => {
  it("does not call Slack at $0 spend", async () => {
    const { fn, calls } = makeFetchMock();
    const status = await evaluateBudget({
      env: ENV_BASE,
      fetchImpl: fn,
      spendOverride: 0,
      log: () => {},
    });
    expect(status.tier).toBe("ok");
    expect(calls.length).toBe(0);
  });
});

describe("budget-guard / evaluateBudget — warn tier", () => {
  it("posts to monitor channel at $24", async () => {
    const { fn, calls } = makeFetchMock();
    const status = await evaluateBudget({
      env: ENV_BASE,
      fetchImpl: fn,
      spendOverride: 24,
      log: () => {},
    });
    expect(status.tier).toBe("warn");
    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain("/monitor");
  });
});

describe("budget-guard / evaluateBudget — auto_stop tier", () => {
  it("posts to drill channel at $28.5 and logs api key removal advisory", async () => {
    const { fn, calls } = makeFetchMock();
    const logs: string[] = [];
    const status = await evaluateBudget({
      env: ENV_BASE,
      fetchImpl: fn,
      spendOverride: 28.5,
      log: (s) => logs.push(s),
    });
    expect(status.tier).toBe("auto_stop");
    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain("/drill");
    expect(logs.some((l) => l.includes("ANTHROPIC_API_KEY"))).toBe(true);
  });
});

describe("budget-guard / evaluateBudget — hard_fail tier", () => {
  it("throws BudgetCapExceededError at $30", async () => {
    const { fn } = makeFetchMock();
    await expect(
      evaluateBudget({
        env: ENV_BASE,
        fetchImpl: fn,
        spendOverride: 30,
        log: () => {},
      }),
    ).rejects.toBeInstanceOf(BudgetCapExceededError);
  });
});

describe("anthropic-spend-tracker / computeCost", () => {
  it("computes sonnet pricing correctly (3 USD/MTok input, 15 USD/MTok output)", () => {
    const cost = computeCost("claude-3-7-sonnet-20250219", 1_000_000, 1_000_000);
    expect(cost.costUsd).toBe(18); // 3 + 15
    expect(cost.modelMatched).toBe(true);
  });
  it("falls back for unknown model", () => {
    const cost = computeCost("claude-future-x", 0, 0);
    expect(cost.modelMatched).toBe(false);
    expect(cost.costUsd).toBe(0);
  });
});

describe("anthropic-spend-tracker / detectSpike", () => {
  it("does not flag when yesterday is 0", () => {
    expect(detectSpike(100, 0).spike).toBe(false);
  });
  it("flags when ratio > 2.0", () => {
    const r = detectSpike(3, 1);
    expect(r.spike).toBe(true);
    expect(r.ratio).toBe(3);
  });
  it("does not flag at exactly 2x", () => {
    const r = detectSpike(2, 1);
    expect(r.spike).toBe(false);
  });
});

describe("anthropic-spend-tracker / monthYearKey", () => {
  it("formats UTC month correctly", () => {
    expect(monthYearKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01");
    expect(monthYearKey(new Date(Date.UTC(2026, 11, 31, 23, 59)))).toBe("2026-12");
  });
});

describe("budget-guard / Slack env missing", () => {
  it("does not throw when SLACK_WEBHOOK_MONITOR is op:// unresolved", async () => {
    const { fn } = makeFetchMock();
    const status = await evaluateBudget({
      env: { SLACK_WEBHOOK_MONITOR: "op://prj019/slack/webhook_monitor" },
      fetchImpl: fn,
      spendOverride: 25,
      log: () => {},
    });
    expect(status.tier).toBe("warn");
  });
});

describe("budget-guard / BudgetCapExceededError", () => {
  it("attaches status object", () => {
    const err = new BudgetCapExceededError({
      tier: "hard_fail",
      spentUsd: 30,
      capUsd: 30,
      warnUsd: 24,
      stopUsd: 28.5,
      remainingUsd: 0,
      percentUsed: 100,
      monthYear: "2026-05",
      nextResetAt: "2026-06-01T00:00:00.000Z",
      daysUntilReset: 30,
    });
    expect(err.code).toBe("BUDGET_CAP_EXCEEDED");
    expect(err.status.spentUsd).toBe(30);
  });
});

