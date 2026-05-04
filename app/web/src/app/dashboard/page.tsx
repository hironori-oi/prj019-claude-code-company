/**
 * PRJ-019 Clawbridge - 透明性 Dashboard (DEC-019-033 §③)
 *
 * 6 view: (a) 行動ログ (b) 思考過程 (c) 中間出力 (d) コスト消費 (e) HITL 滞留 (f) 提案待ち
 *
 * 設計:
 *  - 本ページは Server Component。初期 fetch は dispatcher 経由で取得。
 *  - リアルタイム更新は Phase 1 W2 で Supabase Realtime 統合 (TODO)
 *  - Owner 専用ガードは middleware 層で先送り (TODO: Phase 1 W2 で auth 統合)
 *  - 6 区画は responsive grid (mobile: 1col / md: 2col / xl: 3col)
 */
import { listHitlRequests } from "@/lib/hitl/dispatcher";
import { ActionLogPanel } from "./_components/action-log";
import { ThoughtTracePanel } from "./_components/thought-trace";
import { IntermediateOutputPanel } from "./_components/intermediate-output";
import { CostMeterPanel } from "./_components/cost-meter";
import { HitlQueuePanel } from "./_components/hitl-queue";
import { ProposalQueuePanel } from "./_components/proposal-queue";
import { RefreshButton } from "./_components/refresh-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Phase 1 W1 期は単一 fetch / Phase 1 W2 で Supabase Realtime に置換する (TODO)
  const hitlItems = await safeListHitl();

  return (
    <main className="container mx-auto py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">DEC-019-033 §③</p>
          <h1 className="text-2xl font-semibold tracking-tight">透明性 Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Open Claw の行動を Owner に開示する 6 view (Phase 1 W2 で Supabase Realtime 統合)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionLogPanel />
        <ThoughtTracePanel />
        <IntermediateOutputPanel />
        <CostMeterPanel />
        <HitlQueuePanel items={hitlItems} />
        <ProposalQueuePanel items={hitlItems} />
      </section>

      <p className="mt-10 font-mono text-xs text-muted-foreground">
        Phase 1 W1 prefetch / 6 view 初期 fetch + manual refresh / Owner ガードは middleware で
        先送り (TODO Phase 1 W2)
      </p>
    </main>
  );
}

async function safeListHitl() {
  try {
    return await listHitlRequests({ limit: 200 });
  } catch (e) {
    // env 未配備や DB 障害でも UI は壊さない (placeholder 表示にフォールバック)
    // eslint-disable-next-line no-console
    console.warn("[clawbridge] dashboard hitl fetch failed", e);
    return [];
  }
}
