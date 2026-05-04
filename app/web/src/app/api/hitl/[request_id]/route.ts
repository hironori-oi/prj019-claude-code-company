/**
 * PRJ-019 Clawbridge - HITL Gate REST endpoint (single resource)
 *
 *   GET    /api/hitl/[request_id]   詳細
 *   PATCH  /api/hitl/[request_id]   状態更新 (body: { status: 'approved'|'rejected'|'cancelled', decisionReason? })
 *   DELETE /api/hitl/[request_id]   取消 (cancel)
 *
 * 状態更新は dispatcher を通すため、business rule (pending のみ遷移可 / emergency_stop は他を cancel)
 * は dispatcher 内で一元管理されている。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { decideHitlRequest, getHitlRequest } from "@/lib/hitl/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ request_id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { request_id } = await ctx.params;
  const request = await getHitlRequest(request_id);
  if (!request) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ request });
}

const patchBodySchema = z.object({
  status: z.enum(["approved", "rejected", "cancelled"]),
  decisionReason: z.string().min(1).max(2000).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { request_id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const decision =
    parsed.data.status === "approved"
      ? "approve"
      : parsed.data.status === "rejected"
        ? "reject"
        : "cancel";
  const result = await decideHitlRequest({
    id: request_id,
    decision,
    ...(parsed.data.decisionReason ? { decisionReason: parsed.data.decisionReason } : {}),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ request: result.request });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { request_id } = await ctx.params;
  const result = await decideHitlRequest({
    id: request_id,
    decision: "cancel",
    decisionReason: "cancelled via DELETE /api/hitl/[id]",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ request: result.request });
}
