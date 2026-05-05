/**
 * cost-forecast.test.ts (R32 Dev-NNN / +6 case)
 */
import { describe, it, expect } from "vitest";
import {
  classifySeverity,
  forecastCost,
  projectMonthly,
} from "../cost-forecast";

const days = (n: number, daily: number) =>
  Array.from({ length: n }, (_, i) => ({
    dayIso: `2026-06-${String(i + 1).padStart(2, "0")}`,
    amountUsd: daily,
  }));

describe("cost-forecast", () => {
  it("[1] projectMonthly avg projection", () => {
    expect(projectMonthly(150, 10, 30)).toBe(450);
  });
  it("[2] classifySeverity ok < warn", () => {
    expect(classifySeverity(50)).toBe("ok");
  });
  it("[3] classifySeverity warn at 80%", () => {
    expect(classifySeverity(80)).toBe("warn");
  });
  it("[4] classifySeverity critical at 100%", () => {
    expect(classifySeverity(120)).toBe("critical");
  });
  it("[5] forecastCost utilizationPct correct", () => {
    const r = forecastCost(days(10, 5), { daysInMonth: 30, budgetUsd: 200 });
    expect(r.projectedMonthlyUsd).toBe(150);
    expect(r.utilizationPct).toBe(75);
    expect(r.severity).toBe("ok");
  });
  it("[6] forecastCost critical when over budget", () => {
    const r = forecastCost(days(10, 10), { daysInMonth: 30, budgetUsd: 200 });
    expect(r.severity).toBe("critical");
    expect(r.utilizationPct).toBeGreaterThanOrEqual(100);
  });
});
