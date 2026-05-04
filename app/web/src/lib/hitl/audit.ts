/**
 * PRJ-019 Clawbridge - HITL audit log writer (placeholder)
 *
 * Dev-A 担当の hash-chain ライブラリ完成までの placeholder。
 * supabase/migrations/20260503000002_audit_log.sql の DB トリガが prev_hash / curr_hash を
 * 自動計算する前提で、本モジュールは canonical payload のみを INSERT する。
 *
 * Phase 1 W1 完了後、Dev-A の lib/audit/hash-chain.ts と統合する (TODO)。
 */
import { getServiceClient, resolveActor } from "@/lib/supabase/server";
import type { HitlGateKind, HitlStatus } from "@/types/hitl";

export interface AppendAuditOptions {
  tenantId: string;
  hitlRequestId: string;
  gateKind: HitlGateKind;
  eventKind:
    | "hitl.create"
    | "hitl.update"
    | "hitl.approve"
    | "hitl.reject"
    | "hitl.cancel"
    | "hitl.timeout";
  newStatus: HitlStatus;
  payload: unknown;
  decisionReason?: string;
}

/**
 * audit_log テーブルへ INSERT。失敗してもアプリは継続するが、warn を残す。
 * (Phase 1 W2 で fail-loud / circuit breaker 化を計画)
 *
 * Note (Dev-A 連携): audit_log は trigger で curr_hash を自動計算するが、prev_hash は
 * INSERT 側が指定する必要がある (constraint audit_no_branch unique(prev_hash))。
 * 本 Phase 1 W1 期は Dev-A の hash-chain ライブラリ未完成のため、直前 row の curr_hash を
 * 取得する placeholder ロジックで代用。Phase 1 W1 後半で Dev-A の transactional helper
 * (advisory lock + atomic prev/curr 計算) と統合する (TODO)。
 */
export async function appendHitlAudit(opts: AppendAuditOptions): Promise<void> {
  const client = getServiceClient();
  if (!client) {
    // scaffold mode: env 未配備。skip。
    return;
  }
  const actor = resolveActor();

  // 直前 row の curr_hash を取得 (placeholder; 本来は Dev-A の transactional helper)
  const { data: prevRow } = await client
    .from("audit_log")
    .select("curr_hash")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevHash =
    prevRow && typeof prevRow["curr_hash"] === "string" && prevRow["curr_hash"].length === 64
      ? (prevRow["curr_hash"] as string)
      : "0".repeat(64);

  const { error } = await client.from("audit_log").insert({
    tenant_id: opts.tenantId,
    actor_kind: actor.actorKind,
    actor_id: actor.actorId,
    event_kind: opts.eventKind,
    resource: `hitl_requests:${opts.hitlRequestId}`,
    payload: {
      gateKind: opts.gateKind,
      newStatus: opts.newStatus,
      decisionReason: opts.decisionReason ?? null,
      hitlPayload: opts.payload,
    },
    prev_hash: prevHash,
    // curr_hash は trigger が計算 (空文字でも constraint 違反しないよう placeholder を入れておく)
    curr_hash: "0".repeat(64),
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[clawbridge] audit_log insert failed", error.message);
  }
}
