/**
 * PRJ-019 Clawbridge - Landing (HERO + Phase 1 status)
 * placeholder: Pre-Phase 1 scaffold / 実機ビルドは 5/12 W0-Week2 開始時
 */
export default function HomePage() {
  return (
    <main className="container mx-auto py-16">
      <section className="space-y-6">
        <p className="text-sm font-mono text-muted-foreground">PRJ-019 / Pre-Phase 1</p>
        <h1 className="text-4xl font-bold tracking-tight">Clawbridge</h1>
        <p className="text-lg text-muted-foreground">
          Owner-in-the-loop transparent AI org harness.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed">
          オーナー承認下で AI 組織が AI 組織を運営する。Open Claw 提案 → Owner 承認 → Claude Code
          実装の 2 段階モデル (DEC-019-033)。本ページは Pre-Phase 1 scaffold の placeholder。
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PhaseCard label="Pre-Phase 1" status="in-progress" detail="5/3-5/25 / scaffold + W0-Week2" />
        <PhaseCard label="Phase 1 W1" status="planned" detail="5/26 着手 / 提案生成 + HITL 9/10/11" />
        <PhaseCard label="Phase 1 完了" status="planned" detail="6/20 / preview deploy + Slack 通知" />
      </section>
    </main>
  );
}

function PhaseCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: "in-progress" | "planned" | "done";
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs uppercase text-muted-foreground">{status}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
