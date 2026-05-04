/**
 * PRJ-019 Clawbridge - HITL Gate REST endpoint (collection)
 *
 *   GET  /api/hitl              一覧 (?status=&gateKind=&limit=)
 *   POST /api/hitl              起票 (body: { gateKind, payload, proposalId? })
 *
 * Owner / operator 識別は middleware 層で先送り (Phase 1 W2)。本 route は service-role 経由で
 * 全テナントを扱う前提で書かれているため、本番投入前に Owner-only ガードを必ず追加すること (TODO)。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createHitlRequest, listHitlRequests } from "@/lib/hitl/dispatcher";
import type { HitlGateKind, HitlStatus } from "@/types/hitl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HITL_GATE_KINDS = [
  "network_external",
  "cost_threshold",
  "secret_access",
  "prod_deploy",
  "unsafe_command",
  "tos_gray_review",
  "external_api",
  "emergency_stop",
  "dev_kickoff_approval",
  "permission_change_review",
  "knowledge_pii_review",
] as const satisfies readonly HitlGateKind[];

const HITL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "timeout",
  "cancelled",
] as const satisfies readonly HitlStatus[];

const listQuerySchema = z.object({
  status: z.enum(HITL_STATUSES).optional(),
  gateKind: z.enum(HITL_GATE_KINDS).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    gateKind: url.searchParams.get("gateKind") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const items = await listHitlRequests(parsed.data);
    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    return NextResponse.json(
      { error: "list failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

const createBodySchema = z.object({
  gateKind: z.enum(HITL_GATE_KINDS),
  payload: z.unknown(),
  proposalId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const result = await createHitlRequest({
    gateKind: parsed.data.gateKind,
    payload: parsed.data.payload,
    ...(parsed.data.proposalId ? { proposalId: parsed.data.proposalId } : {}),
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.issues ? { issues: result.issues } : {}) },
      { status: 400 },
    );
  }
  return NextResponse.json({ request: result.request }, { status: 201 });
}
