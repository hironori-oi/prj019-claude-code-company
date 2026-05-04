/**
 * PRJ-019 Clawbridge - HITL Gate Dispatcher (11 種)
 *
 * Source of truth: src/types/hitl.ts (HITL_GATE_DEFAULTS) + pm-v4-hitl-gates-9-10-11-wbs.md
 *
 * 責務:
 *  - Gate 起票 (create) / 状態遷移 (approve / reject / cancel) / 取消 (delete) の DB 操作を集約
 *  - 各 Gate の通知 hook を 1 箇所で扱う (Slack / SES / SMS は Phase 1 W2 で外部化)
 *  - audit_log への append (placeholder; Dev-A の hash-chain と Phase 1 W1 後半で統合)
 *  - 11 種 Gate の連携ルール (e.g. emergency_stop は permission_change_review を cancel) は本モジュールで一元化
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  HITL_GATE_DEFAULTS,
  type HitlGateKind,
  type HitlRequest,
  type HitlStatus,
} from "@/types/hitl";
import { getServiceClient, resolveActor, resolveTenantId } from "@/lib/supabase/server";
import { appendHitlAudit } from "@/lib/hitl/audit";
import { hitlCreateRequestSchema, hitlDecisionSchema } from "@/lib/hitl/schema";

// ---- DB row shape (snake_case from supabase) ----

interface HitlRow {
  id: string;
  tenant_id: string;
  gate_kind: string;
  proposal_id: string | null;
  payload: unknown;
  status: HitlStatus;
  default_action: "reject" | "pause" | "approve";
  sla_deadline: string;
  requested_by: string | null;
  approved_by: string | null;
  decision_at: string | null;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRequest(row: HitlRow): HitlRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    gateKind: row.gate_kind as HitlGateKind,
    ...(row.proposal_id ? { proposalId: row.proposal_id } : {}),
    status: row.status,
    defaultAction: row.default_action,
    slaDeadline: row.sla_deadline,
    ...(row.requested_by ? { requestedBy: row.requested_by } : {}),
    ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
    ...(row.decision_at ? { decisionAt: row.decision_at } : {}),
    ...(row.decision_reason ? { decisionReason: row.decision_reason } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    payload: row.payload,
  } as HitlRequest;
}

// ---- In-memory fallback (env 未配備の Pre-Phase 1 用) ----

const memoryStore = new Map<string, HitlRow>();

function memoryFallbackEnabled(): boolean {
  return getServiceClient() === null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deadlineFromSlaHours(slaHours: number): string {
  return new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
}

// ---- public API ----

export interface ListHitlOptions {
  status?: HitlStatus;
  gateKind?: HitlGateKind;
  limit?: number;
}

export async function listHitlRequests(opts: ListHitlOptions = {}): Promise<HitlRequest[]> {
  const tenantId = resolveTenantId();
  const limit = Math.min(opts.limit ?? 100, 500);
  const client = getServiceClient();
  if (!client) {
    let rows = Array.from(memoryStore.values()).filter((r) => r.tenant_id === tenantId);
    if (opts.status) rows = rows.filter((r) => r.status === opts.status);
    if (opts.gateKind) rows = rows.filter((r) => r.gate_kind === opts.gateKind);
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows.slice(0, limit).map(rowToRequest);
  }

  let q = client
    .from("hitl_requests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.gateKind) q = q.eq("gate_kind", opts.gateKind);
  const { data, error } = await q;
  if (error) throw new Error(`hitl list failed: ${error.message}`);
  return (data ?? []).map((row) => rowToRequest(row as HitlRow));
}

export async function getHitlRequest(id: string): Promise<HitlRequest | null> {
  const tenantId = resolveTenantId();
  const client = getServiceClient();
  if (!client) {
    const row = memoryStore.get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return rowToRequest(row);
  }
  const { data, error } = await client
    .from("hitl_requests")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(`hitl get failed: ${error.message}`);
  return data ? rowToRequest(data as HitlRow) : null;
}

export interface CreateHitlInput {
  gateKind: HitlGateKind;
  payload: unknown;
  proposalId?: string;
}

/**
 * 11 種 Gate 起票。
 * - SLA / default action は HITL_GATE_DEFAULTS から決定 (single source)
 * - payload は zod で検証 (型 narrowing)
 * - emergency_stop 起票時は他の pending を cancel (Owner 緊急停止優先 / pm-v4 §4.2)
 */
export async function createHitlRequest(
  input: CreateHitlInput,
): Promise<{ ok: true; request: HitlRequest } | { ok: false; error: string; issues?: z.ZodIssue[] }> {
  const parsed = hitlCreateRequestSchema.safeParse({
    gateKind: input.gateKind,
    payload: input.payload,
  });
  if (!parsed.success) {
    return { ok: false, error: "payload validation failed", issues: parsed.error.issues };
  }

  const tenantId = resolveTenantId();
  const actor = resolveActor();
  const defaults = HITL_GATE_DEFAULTS[input.gateKind];
  const id = randomUUID();
  const slaDeadline = deadlineFromSlaHours(defaults.slaHours);

  const row: HitlRow = {
    id,
    tenant_id: tenantId,
    gate_kind: input.gateKind,
    proposal_id: input.proposalId ?? null,
    payload: parsed.data.payload,
    status: "pending",
    default_action: defaults.defaultAction,
    sla_deadline: slaDeadline,
    requested_by: actor.actorId,
    approved_by: null,
    decision_at: null,
    decision_reason: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const client = getServiceClient();
  if (!client) {
    memoryStore.set(id, row);
  } else {
    const { error } = await client.from("hitl_requests").insert({
      id: row.id,
      tenant_id: row.tenant_id,
      gate_kind: row.gate_kind,
      proposal_id: row.proposal_id,
      payload: row.payload,
      status: row.status,
      default_action: row.default_action,
      sla_deadline: row.sla_deadline,
      requested_by: row.requested_by,
    });
    if (error) {
      return { ok: false, error: `db insert failed: ${error.message}` };
    }
  }

  // emergency_stop: 全 pending を cancel
  if (input.gateKind === "emergency_stop") {
    await cancelAllPendingExcept(id);
  }

  await appendHitlAudit({
    tenantId,
    hitlRequestId: id,
    gateKind: input.gateKind,
    eventKind: "hitl.create",
    newStatus: "pending",
    payload: parsed.data.payload,
  });

  // Phase 1 W2 で Slack / SES / SMS に分岐 (TODO)
  await dispatchNotification(input.gateKind, "create", id);

  return { ok: true, request: rowToRequest(row) };
}

async function cancelAllPendingExcept(exceptId: string): Promise<void> {
  const tenantId = resolveTenantId();
  const client = getServiceClient();
  if (!client) {
    for (const [id, row] of memoryStore.entries()) {
      if (id === exceptId) continue;
      if (row.tenant_id !== tenantId) continue;
      if (row.status !== "pending") continue;
      memoryStore.set(id, {
        ...row,
        status: "cancelled",
        decision_at: nowIso(),
        decision_reason: "cancelled by emergency_stop",
        updated_at: nowIso(),
      });
    }
    return;
  }
  await client
    .from("hitl_requests")
    .update({
      status: "cancelled",
      decision_at: nowIso(),
      decision_reason: "cancelled by emergency_stop",
      updated_at: nowIso(),
    })
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .neq("id", exceptId);
}

export interface DecideInput {
  id: string;
  decision: "approve" | "reject" | "cancel";
  decisionReason?: string;
}

export async function decideHitlRequest(
  input: DecideInput,
): Promise<{ ok: true; request: HitlRequest } | { ok: false; error: string }> {
  const parsedReason = hitlDecisionSchema.safeParse({
    decisionReason: input.decisionReason,
  });
  if (!parsedReason.success) {
    return { ok: false, error: "decisionReason validation failed" };
  }

  const current = await getHitlRequest(input.id);
  if (!current) return { ok: false, error: "not found" };
  if (current.status !== "pending") {
    return { ok: false, error: `not pending (current=${current.status})` };
  }

  const newStatus: HitlStatus =
    input.decision === "approve"
      ? "approved"
      : input.decision === "reject"
        ? "rejected"
        : "cancelled";
  const tenantId = resolveTenantId();
  const actor = resolveActor();
  const now = nowIso();

  const client = getServiceClient();
  if (!client) {
    const row = memoryStore.get(input.id);
    if (!row) return { ok: false, error: "not found" };
    const next: HitlRow = {
      ...row,
      status: newStatus,
      approved_by: input.decision === "approve" ? actor.actorId : row.approved_by,
      decision_at: now,
      decision_reason: input.decisionReason ?? null,
      updated_at: now,
    };
    memoryStore.set(input.id, next);
  } else {
    const { error } = await client
      .from("hitl_requests")
      .update({
        status: newStatus,
        approved_by: input.decision === "approve" ? actor.actorId : null,
        decision_at: now,
        decision_reason: input.decisionReason ?? null,
        updated_at: now,
      })
      .eq("id", input.id)
      .eq("tenant_id", tenantId)
      .eq("status", "pending");
    if (error) return { ok: false, error: `db update failed: ${error.message}` };
  }

  const eventKind =
    input.decision === "approve"
      ? "hitl.approve"
      : input.decision === "reject"
        ? "hitl.reject"
        : "hitl.cancel";

  await appendHitlAudit({
    tenantId,
    hitlRequestId: input.id,
    gateKind: current.gateKind,
    eventKind,
    newStatus,
    payload: current.payload,
    ...(input.decisionReason ? { decisionReason: input.decisionReason } : {}),
  });

  await dispatchNotification(current.gateKind, eventKind, input.id);

  const updated = await getHitlRequest(input.id);
  if (!updated) return { ok: false, error: "post-update fetch failed" };
  return { ok: true, request: updated };
}

/**
 * 通知 dispatch — DEC-019-051 §施策-2 (T2) で template-based に再構成。
 *
 *   - 通知メッセージは src/lib/hitl/templates/ の 11 種 static template から生成 (LLM 不要)
 *   - placeholder 値は redactPayload で PII redaction 後に注入
 *   - LLM 残置経路 (HITL-9 injection scan) は本 dispatcher を経由せず scan 専用 export を使う
 *
 * 本関数は副作用を持たない pure adapter 化を目指し、Slack 投稿は呼び出し元責任で
 * `app/lib/notify/slack.ts#postSlack(channel, message)` に橋渡しする。
 *
 * Phase 1 W1 期は console.log fallback (env 未配備時)、本番 build では Slack Webhook が
 * 解決されている前提。詳細仕様は dev-w0-week2-t2-hitl-template-design.md §5 参照。
 */
async function dispatchNotification(
  gateKind: HitlGateKind,
  event: "create" | "hitl.approve" | "hitl.reject" | "hitl.cancel",
  hitlRequestId: string,
): Promise<void> {
  // template lookup は import コスト ゼロ (静的) のため毎回 build しても OK
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mapGateKindToTemplate, redactPayload } = await import("@/lib/hitl/templates");
  const template = mapGateKindToTemplate(gateKind);

  // dispatcher が持つ最低限の context (詳細 placeholder は呼出元が補完想定)
  const minimalCtx = redactPayload({
    requestId: hitlRequestId,
    actor: "system",
    action: event,
    timestamp: new Date().toISOString(),
  });

  // 本 W1 期は console preview のみ (Slack 接続は呼出元の T3 統合で実施)
  if (process.env["NODE_ENV"] === "production") return;
  // eslint-disable-next-line no-console
  console.log(
    `[clawbridge] notify gate=${gateKind} (HITL-${template.gateNumber} ${template.gateName}) event=${event} id=${hitlRequestId} channel=${template.channel} urgency=${template.urgency} ctx=${JSON.stringify(minimalCtx)}`,
  );
}
