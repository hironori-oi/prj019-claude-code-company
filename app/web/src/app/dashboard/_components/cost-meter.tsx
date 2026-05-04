/**
 * PRJ-019 Dashboard (d) コスト消費
 *
 * v1: 月次 / 件次 / 提案次の 3 階層 cap (DEC-019-031, $300 cap)
 * v2: + Anthropic API spend cap = $30/月 visualization (DEC-019-050)
 *      - progress bar (80% / 95% threshold line)
 *      - daily spend trend (簡易 line chart)
 *      - リセット日カウントダウン (毎月 1 日 0:00 UTC)
 *
 * 既存 CostMeterPanel / CostScope / SAMPLE_SCOPES API は破壊変更しない。
 * 追加コンポーネント: AnthropicBudgetMeter / DailySpendTrend
 *
 * Server Component として描画し、props 経由で server action / fetch 結果を受け取る。
 * 値が未配備 (Pre-Phase 1 env 未投入) の場合は SAMPLE_* で fallback する。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatUsd } from "@/lib/utils";

// =============================================================================
// 既存 3 階層 cap (DEC-019-031)
// =============================================================================

export interface CostScope {
  scope: "monthly" | "project" | "proposal";
  label: string;
  spentUsd: number;
  capUsd: number;
}

const SAMPLE_SCOPES: CostScope[] = [
  { scope: "monthly", label: "月次（5月）", spentUsd: 18.4, capUsd: 300 },
  { scope: "project", label: "PRJ-019", spentUsd: 6.2, capUsd: 50 },
  { scope: "proposal", label: "提案 #042", spentUsd: 0.31, capUsd: 5 },
];

export function CostMeterPanel({ scopes }: { scopes?: CostScope[] }) {
  const data = scopes ?? SAMPLE_SCOPES;
  return (
    <Card>
      <CardHeader>
        <CardTitle>(d) コスト消費</CardTitle>
        <CardDescription>月次 / 件次 / 提案次の 3 階層 cap 監視</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((c) => (
          <CostBar key={c.scope + c.label} scope={c} />
        ))}
      </CardContent>
    </Card>
  );
}

function CostBar({ scope }: { scope: CostScope }) {
  const ratio = scope.capUsd > 0 ? Math.min(1, scope.spentUsd / scope.capUsd) : 0;
  const pct = Math.round(ratio * 100);
  const danger = ratio >= 0.9;
  const warn = ratio >= 0.7 && !danger;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{scope.label}</span>
        <Badge variant={danger ? "destructive" : warn ? "warning" : "muted"}>
          {pct}%
        </Badge>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${scope.label} cost usage`}
      >
        <div
          className={cn(
            "h-full transition-all",
            danger
              ? "bg-destructive"
              : warn
                ? "bg-amber-500"
                : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {formatUsd(scope.spentUsd)} / {formatUsd(scope.capUsd)}
      </p>
    </div>
  );
}

// =============================================================================
// Anthropic API Budget Meter (DEC-019-050)
// =============================================================================

export type AnthropicBudgetTier = "ok" | "warn" | "auto_stop" | "hard_fail";

export interface AnthropicBudgetView {
  tier: AnthropicBudgetTier;
  spentUsd: number;
  capUsd: number;
  warnUsd: number;
  stopUsd: number;
  remainingUsd: number;
  percentUsed: number;
  monthYear: string;
  nextResetAt: string;
  daysUntilReset: number;
}

export interface DailySpendPoint {
  date: string;       // YYYY-MM-DD
  totalUsd: number;
}

const SAMPLE_BUDGET: AnthropicBudgetView = {
  tier: "ok",
  spentUsd: 4.12,
  capUsd: 30,
  warnUsd: 24,
  stopUsd: 28.5,
  remainingUsd: 25.88,
  percentUsed: 13.7,
  monthYear: "2026-05",
  nextResetAt: "2026-06-01T00:00:00.000Z",
  daysUntilReset: 28,
};

const SAMPLE_TREND: DailySpendPoint[] = [
  { date: "2026-04-27", totalUsd: 0.12 },
  { date: "2026-04-28", totalUsd: 0.31 },
  { date: "2026-04-29", totalUsd: 0.18 },
  { date: "2026-04-30", totalUsd: 0.42 },
  { date: "2026-05-01", totalUsd: 0.55 },
  { date: "2026-05-02", totalUsd: 0.68 },
  { date: "2026-05-03", totalUsd: 1.86 },
];

export function AnthropicBudgetMeter({
  budget,
  trend,
}: {
  budget?: AnthropicBudgetView;
  trend?: DailySpendPoint[];
}) {
  const b = budget ?? SAMPLE_BUDGET;
  const t = trend ?? SAMPLE_TREND;

  return (
    <Card>
      <CardHeader>
        <CardTitle>(d-2) Anthropic API spend cap</CardTitle>
        <CardDescription>
          DEC-019-050 / 月次 cap = {formatUsd(b.capUsd)} / 80% warn / 95% auto-stop
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <BudgetBar budget={b} />
        <ResetCountdown budget={b} />
        <DailySpendTrend trend={t} cap={b.capUsd} />
      </CardContent>
    </Card>
  );
}

function tierBadge(tier: AnthropicBudgetTier): {
  variant: "muted" | "warning" | "destructive";
  label: string;
} {
  switch (tier) {
    case "warn":
      return { variant: "warning", label: "WARN 80%" };
    case "auto_stop":
      return { variant: "destructive", label: "AUTO_STOP 95%" };
    case "hard_fail":
      return { variant: "destructive", label: "HARD_FAIL 100%" };
    default:
      return { variant: "muted", label: "OK" };
  }
}

function BudgetBar({ budget }: { budget: AnthropicBudgetView }) {
  const t = tierBadge(budget.tier);
  const pct = Math.max(0, Math.min(100, budget.percentUsed));
  const warnPct = (budget.warnUsd / budget.capUsd) * 100;
  const stopPct = (budget.stopUsd / budget.capUsd) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">月次消費 ({budget.monthYear})</span>
        <Badge variant={t.variant}>{t.label}</Badge>
      </div>
      <div
        className="relative mt-1 h-3 w-full overflow-hidden rounded bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Anthropic monthly spend"
      >
        <div
          className={cn(
            "h-full transition-all",
            budget.tier === "hard_fail" || budget.tier === "auto_stop"
              ? "bg-destructive"
              : budget.tier === "warn"
                ? "bg-amber-500"
                : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
        {/* threshold lines */}
        <span
          className="absolute inset-y-0 w-px bg-amber-600/70"
          style={{ left: `${warnPct}%` }}
          aria-hidden
        />
        <span
          className="absolute inset-y-0 w-px bg-red-600/80"
          style={{ left: `${stopPct}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {formatUsd(budget.spentUsd)} / {formatUsd(budget.capUsd)} ・ 残量 {formatUsd(budget.remainingUsd)} ・ {pct.toFixed(1)}%
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        threshold: warn {formatUsd(budget.warnUsd)} / auto-stop {formatUsd(budget.stopUsd)}
      </p>
    </div>
  );
}

function ResetCountdown({ budget }: { budget: AnthropicBudgetView }) {
  return (
    <div className="rounded border border-border/60 bg-muted/40 px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">次回リセット</span>
        <span className="font-mono">
          残 {budget.daysUntilReset} 日
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">
        {budget.nextResetAt} (UTC) / 毎月 1 日 0:00 UTC = JST 09:00
      </p>
    </div>
  );
}

function DailySpendTrend({
  trend,
  cap,
}: {
  trend: DailySpendPoint[];
  cap: number;
}) {
  if (trend.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">日次トレンドデータなし</p>
    );
  }
  // Y 軸の上限は cap の 1/30 (= 1 日あたり目安) を最低保証、実値最大が超える場合はそちらを採用
  const dailyTarget = cap / 30;
  const maxObserved = Math.max(...trend.map((p) => p.totalUsd));
  const yMax = Math.max(dailyTarget * 1.5, maxObserved * 1.1, 0.001);

  // 簡易 SVG line chart (依存追加なし)
  const W = 280;
  const H = 60;
  const PAD_X = 4;
  const PAD_Y = 4;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const stepX = trend.length > 1 ? innerW / (trend.length - 1) : 0;

  const points = trend
    .map((p, i) => {
      const x = PAD_X + stepX * i;
      const y = PAD_Y + innerH - (p.totalUsd / yMax) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const targetY = PAD_Y + innerH - (dailyTarget / yMax) * innerH;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium">日次 spend trend (直近 {trend.length} 日)</span>
        <span className="font-mono text-muted-foreground">
          目安 {formatUsd(dailyTarget)}/日
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-16 w-full text-foreground/70"
        role="img"
        aria-label="daily spend trend line chart"
      >
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={targetY}
          y2={targetY}
          className="stroke-amber-500/60"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          points={points}
        />
        {trend.map((p, i) => {
          const x = PAD_X + stepX * i;
          const y = PAD_Y + innerH - (p.totalUsd / yMax) * innerH;
          return (
            <circle
              key={p.date}
              cx={x}
              cy={y}
              r={1.8}
              className="fill-current"
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{trend[0]?.date}</span>
        <span>{trend[trend.length - 1]?.date}</span>
      </div>
    </div>
  );
}
