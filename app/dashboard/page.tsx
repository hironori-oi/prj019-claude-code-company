/**
 * PRJ-019 Open Claw "Clawbridge" — W7-A KPI Dashboard skeleton
 *
 * R31 Dev-LLL initial implementation (mode='dry-run' / mock data only).
 * 5-axis KPI: latency (p50/p95/p99) / error rate / availability / cost / custom.
 * Wire to live source pending DEC-080 (Sentry) + DEC-081 (cost alert) — both
 * already confirmed in R29. Live wire engagement deferred to R32+ Dev-MMM.
 *
 * Constraints (R31 Dev-LLL):
 *   - mode='dry-run' enforced. No fetch, no external API call ($0).
 *   - shadcn/ui + Tailwind CSS conventions only.
 *   - Strict typing. TS6059 0 件継承.
 */

type KpiMode = 'dry-run' | 'live';

interface LatencyKpi {
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

interface KpiSnapshot {
  mode: KpiMode;
  generated_at: string;
  latency: LatencyKpi;
  error_rate_pct: number;
  availability_pct: number;
  cost_usd_24h: number;
  custom_signal: string;
}

const MOCK_SNAPSHOT: KpiSnapshot = {
  mode: 'dry-run',
  generated_at: '2026-05-06T00:00:00Z',
  latency: { p50_ms: 42, p95_ms: 187, p99_ms: 412 },
  error_rate_pct: 0.18,
  availability_pct: 99.97,
  cost_usd_24h: 1.42,
  custom_signal: 'canary 0% (W6 完遂宣言 5 軸 AND 全 GO 待ち)',
};

export function getKpiSnapshot(): KpiSnapshot {
  return MOCK_SNAPSHOT;
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const snap = getKpiSnapshot();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Clawbridge KPI Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          mode=<span className="font-mono">{snap.mode}</span> /
          generated_at=<span className="font-mono">{snap.generated_at}</span>
        </p>
      </header>

      <section
        aria-label="latency"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <KpiCard label="Latency p50" value={`${snap.latency.p50_ms} ms`} />
        <KpiCard label="Latency p95" value={`${snap.latency.p95_ms} ms`} />
        <KpiCard label="Latency p99" value={`${snap.latency.p99_ms} ms`} />
      </section>

      <section
        aria-label="reliability-and-cost"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <KpiCard
          label="Error rate"
          value={`${snap.error_rate_pct.toFixed(2)} %`}
          hint="DEC-080 Sentry wire pending (R29 confirmed)"
        />
        <KpiCard
          label="Availability"
          value={`${snap.availability_pct.toFixed(2)} %`}
          hint="health 4 endpoint OK (R29)"
        />
        <KpiCard
          label="Cost (24h)"
          value={`$${snap.cost_usd_24h.toFixed(2)}`}
          hint="DEC-081 cost alert wire pending (R29 confirmed)"
        />
      </section>

      <section aria-label="custom" className="mb-2">
        <KpiCard label="Custom signal" value={snap.custom_signal} />
      </section>
    </main>
  );
}

/**
 * R32 Dev-PPP append-only mode='live' switch (line 1-113 absolute 不変).
 *
 * Wires getKpiSnapshot() to the live monitoring pipeline (Dev-OOO R32
 * monitoring/kpi-collector.ts) when the env-gate is satisfied. Default
 * remains 'dry-run' for any non-PROD env, ensuring R31 behaviour is
 * preserved by default.
 *
 * Constraints (R32 Dev-PPP):
 *   - env-gate: only OPENCLAW_ENV='prod' && OPENCLAW_KPI_LIVE='1' enables live.
 *   - mock injection only — no fetch / no real API call ($0).
 *   - shadcn/ui Card 正式置換は live snapshot を受け取る LiveKpiCard で実現
 *     (mock div の line 53-63 KpiCard は dry-run 時の互換シムとして残置).
 */

interface KpiCollectorLike {
  collectSnapshot: () => KpiSnapshot;
}

let liveCollector: KpiCollectorLike | null = null;

export function __setLiveCollectorForTest(c: KpiCollectorLike | null): void {
  liveCollector = c;
}

function isLiveModeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.OPENCLAW_ENV === 'prod' && env.OPENCLAW_KPI_LIVE === '1';
}

export function getKpiSnapshotLive(
  env: NodeJS.ProcessEnv = process.env
): KpiSnapshot {
  if (!isLiveModeEnabled(env)) {
    return MOCK_SNAPSHOT;
  }
  if (!liveCollector) {
    // env-gate satisfied but no collector injected — fall back safely
    return { ...MOCK_SNAPSHOT, custom_signal: 'live env-gate ON / collector pending' };
  }
  const live = liveCollector.collectSnapshot();
  return { ...live, mode: 'live' };
}

interface ShadcnCardProps {
  label: string;
  value: string;
  hint?: string;
}

// shadcn/ui Card 正式置換 (R32: 同等 Tailwind class set + Card semantics)
export function LiveKpiCard({ label, value, hint }: ShadcnCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="rounded-xl border border-slate-200 bg-card p-4 text-card-foreground shadow"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const __r32_internal__ = {
  isLiveModeEnabled,
  getKpiSnapshotLive,
};

/**
 * R33 Dev-QQQ append-only dashboard expansion (line 1-186 absolute 不変).
 *
 * Adds 7 additional KPI axes for 60day rolling window observation, plus
 * alert escalation routing visualisation. Wires to long-term-metrics
 * (Dev-SSS R33 sla-tracker / cost-trend / quarter-window) and
 * improvement-loop auto-routing (Dev-RRR R33). All data still mock-
 * injected — fitForRelease driven by post-launch-60day fitForRelease v2.
 *
 * Constraints (R33 Dev-QQQ):
 *   - line 1-186 frozen (R31 + R32 absolute 不変保持).
 *   - mock injection only — no fetch / no real API call ($0).
 *   - shadcn/ui + Tailwind CSS conventions only.
 *   - Strict typing. TS6059 0 件継承. 副作用 0.
 */

export type RoutingPriority = 'P1' | 'P2' | 'P3';

interface RollingWindow60dKpi {
  rolling_p95_latency_ms: number;
  drift_pct: number;
  sustained_breach_streak_days: number;
  recovery_latency_days: number;
  sla_breach_rate_90d_pct: number;
  cost_slope_jpy_per_day: number;
  routing_p1_open_count: number;
}

const MOCK_60D_KPI: RollingWindow60dKpi = {
  rolling_p95_latency_ms: 192,
  drift_pct: 2.4,
  sustained_breach_streak_days: 0,
  recovery_latency_days: 0,
  sla_breach_rate_90d_pct: 0.6,
  cost_slope_jpy_per_day: 1.2,
  routing_p1_open_count: 0,
};

export function get60dKpiSnapshot(): RollingWindow60dKpi {
  return MOCK_60D_KPI;
}

export interface AlertEscalationLane {
  priority: RoutingPriority;
  queue: string;
  open_count: number;
  sla_hours: number;
  hitl_required: boolean;
}

const MOCK_ESCALATION_LANES: ReadonlyArray<AlertEscalationLane> = [
  { priority: 'P1', queue: 'ceo_ack_flow', open_count: 0, sla_hours: 4, hitl_required: true },
  { priority: 'P2', queue: 'pm_ratification_queue', open_count: 1, sla_hours: 24, hitl_required: true },
  { priority: 'P3', queue: 'knowledge_backlog', open_count: 3, sla_hours: 168, hitl_required: false },
];

export function getEscalationLanes(): ReadonlyArray<AlertEscalationLane> {
  return MOCK_ESCALATION_LANES;
}

interface RollingKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  severity?: 'ok' | 'warn' | 'critical';
}

export function RollingKpiCard({ label, value, hint, severity = 'ok' }: RollingKpiCardProps) {
  const ringClass =
    severity === 'critical'
      ? 'border-red-300 bg-red-50'
      : severity === 'warn'
        ? 'border-amber-300 bg-amber-50'
        : 'border-slate-200 bg-card';
  return (
    <div
      role="group"
      aria-label={label}
      className={`rounded-xl border p-4 text-card-foreground shadow ${ringClass}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface EscalationRowProps {
  lane: AlertEscalationLane;
}

export function EscalationRow({ lane }: EscalationRowProps) {
  return (
    <div
      role="listitem"
      aria-label={`escalation-${lane.priority}`}
      className="flex items-center justify-between rounded-md border border-slate-200 bg-card px-4 py-2 text-sm"
    >
      <span className="font-mono">
        {lane.priority} → {lane.queue}
      </span>
      <span className="text-muted-foreground">
        open={lane.open_count} / sla={lane.sla_hours}h / hitl={String(lane.hitl_required)}
      </span>
    </div>
  );
}

export function deriveSeverityForDrift(driftPct: number): 'ok' | 'warn' | 'critical' {
  if (driftPct >= 25) return 'critical';
  if (driftPct >= 10) return 'warn';
  return 'ok';
}

export function deriveSeverityForBreachStreak(days: number): 'ok' | 'warn' | 'critical' {
  if (days > 3) return 'critical';
  if (days >= 2) return 'warn';
  return 'ok';
}

export const __r33_internal__ = {
  MOCK_60D_KPI,
  MOCK_ESCALATION_LANES,
  deriveSeverityForDrift,
  deriveSeverityForBreachStreak,
};
