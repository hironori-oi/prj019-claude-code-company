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
