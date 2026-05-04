/**
 * PRJ-019 Clawbridge - 権限管理 UI (DEC-019-033 §⑤ + DEC-020-003)
 *
 * 7 categories: fs / command / network / hitl / cost / time / genre
 * - 13 prohibited domains は network tab 内で永遠 deny envelope (locked) として表示
 * - kill switch は header 右上、確認 dialog 経由で emergency_stop (HITL-8) を発火
 * - 変更履歴 timeline は policy_audit_log を fetch
 * - 保存時は HITL-10 permission_change_review を起票 (POST /api/hitl)
 * - Owner 専用ガードは middleware 層で先送り (TODO Phase 1 W2)
 */
import { getActivePolicy, getPolicyAuditTimeline } from "@/lib/policy/server";
import { PermissionsTabs } from "./_components/permissions-tabs";
import { KillSwitch } from "./_components/kill-switch";
import { ChangeTimeline } from "./_components/change-timeline";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const [policy, timeline] = await Promise.all([
    getActivePolicy(),
    getPolicyAuditTimeline(),
  ]);

  return (
    <main className="container mx-auto py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">
            DEC-019-033 §⑤ / Owner only
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">権限管理 UI</h1>
          <p className="text-sm text-muted-foreground">
            7 カテゴリ × 細粒度設定 / 変更は HITL-10 / 13 prohibited domains は永遠 deny envelope
          </p>
        </div>
        <KillSwitch />
      </header>

      <section className="mt-8">
        <PermissionsTabs policy={policy} />
      </section>

      <section className="mt-8">
        <ChangeTimeline entries={timeline} />
      </section>

      <p className="mt-10 font-mono text-xs text-muted-foreground">
        Phase 1 W1 prefetch / 7 tab + KillSwitch + HITL-10 起票フック / 編集 UI 詳細は Phase 1 W2
      </p>
    </main>
  );
}
