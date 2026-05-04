/**
 * PRJ-019 Clawbridge - HITL reject endpoint
 *
 *   POST /api/hitl/[request_id]/reject   body: { decisionReason? }
 *
 * Owner ワンクリック棄却用 (HITL-9 D9-08)。棄却時のナレッジ抽出は Phase 1 W3 で worker に委譲。
 * TODO(Phase 1 W2): Owner ロール検証を middleware で前置。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { decideHitlRequest } from "@/lib/hitl/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ request_id: string }>;
}

const bodySchema = z
  .object({
    decisionReason: z.string().min(1).max(2000).optional(),
  })
  .partial();

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { request_id } = await ctx.params;
  let json: unknown = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      json = await req.json().catch(() => ({}));
    }
  } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const result = await decideHitlRequest({
    id: request_id,
    decision: "reject",
    ...(parsed.data.decisionReason ? { decisionReason: parsed.data.decisionReason } : {}),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ request: result.request });
}
