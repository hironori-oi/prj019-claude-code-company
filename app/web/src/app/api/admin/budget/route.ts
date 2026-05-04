/**
 * PRJ-019 Clawbridge - Admin Budget endpoint (DEC-019-050)
 *
 *   GET  /api/admin/budget         現在の月次 spend / cap / 残量 / threshold status
 *   POST /api/admin/budget         cap 強制 update (Owner UI から、HITL 第10種 permission_change_review 連動)
 *
 * 設計方針:
 *   - service_role key は使わず、open_claw_restricted role の RPC 経由
 *     (= getServiceClient で生成した client から RPC を叩くが、grants は restricted role に付与済み)
 *   - cap 変更は HITL gate `permission_change_review` を起票して即時反映はしない
 *     (Owner 承認フローを噛ませる)
 *   - 全てのリクエストは audit_log に記録される (本 route では呼び出し元 dispatcher 経由を期待)
 *
 * Owner-only ガード:
 *   middleware 側で実装予定 (Phase 1 W2)。本 route は scaffold 段階のため明示的な Owner 判定は省略し、
 *   TODO コメントを残す。本番投入前に必ず middleware ガードを追加すること。
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  evaluateBudget,
  resolveThresholds,
  DEFAULT_BUDGET_THRESHOLDS,
  type BudgetStatus,
  BudgetCapExceededError,
} from "@/lib/cost/budget-guard";
import { createHitlRequest } from "@/lib/hitl/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =============================================================================
// GET — current status
// =============================================================================

export async function GET(_req: NextRequest): Promise<Response> {
  // TODO(Phase 1 W2): middleware で Owner / operator role を要求、未認証は 401
  try {
    const status: BudgetStatus = await evaluateBudget({
      log: (line: string) => console.log(`[admin/budget GET] ${line}`),
    });
    return NextResponse.json({
      ok: true,
      decisionRef: "DEC-019-050",
      status,
      thresholds: resolveThresholds(),
      defaults: DEFAULT_BUDGET_THRESHOLDS,
    });
  } catch (e) {
    if (e instanceof BudgetCapExceededError) {
      return NextResponse.json(
        {
          ok: false,
          error: e.code,
          status: e.status,
        },
        { status: 402 }, // 402 Payment Required = 月次 cap 超過
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "evaluate_failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

// =============================================================================
// POST — cap update (Owner 承認待ちの HITL 起票)
// =============================================================================

const updateBodySchema = z.object({
  /** 新しい月次 cap (USD) */
  newCapUsd: z.number().positive().max(10_000),
  /** 新しい warn 閾値 (省略時は cap × 0.8) */
  newWarnUsd: z.number().positive().optional(),
  /** 新しい auto_stop 閾値 (省略時は cap × 0.95) */
  newStopUsd: z.number().positive().optional(),
  /** 変更理由 (audit / HITL UI で表示) */
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest): Promise<Response> {
  // TODO(Phase 1 W2): middleware で Owner role を要求 (operator は 403)
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { newCapUsd, newWarnUsd, newStopUsd, reason } = parsed.data;
  const warn = newWarnUsd ?? Math.round(newCapUsd * 0.8 * 100) / 100;
  const stop = newStopUsd ?? Math.round(newCapUsd * 0.95 * 100) / 100;

  // 順序整合チェック (warn < stop < cap)
  if (!(warn < stop && stop < newCapUsd)) {
    return NextResponse.json(
      {
        error: "invalid_threshold_order",
        detail: `expected warn(${warn}) < stop(${stop}) < cap(${newCapUsd})`,
      },
      { status: 400 },
    );
  }

  // HITL 第10種 permission_change_review を起票
  // payload schema (DEC-019-033 §⑤): { changeId, triggerKind, category, diffJson, prePolicyVersionId, postPolicyVersionId }
  const previous = resolveThresholds();
  const result = await createHitlRequest({
    gateKind: "permission_change_review",
    payload: {
      changeId: `dec-019-050-cap-${Date.now()}`,
      triggerKind: "external_import", // Owner UI 起源 = 外部要因に分類 (内部 auto_warning_rollback ではない)
      category: "cost",
      diffJson: {
        decisionRef: "DEC-019-050",
        scope: "anthropic_monthly_cap",
        previous,
        proposed: { capUsd: newCapUsd, warnUsd: warn, stopUsd: stop },
        reason,
        requestedAt: new Date().toISOString(),
      },
      prePolicyVersionId: `budget-v1-cap${previous.capUsd}`,
      postPolicyVersionId: `budget-v2-cap${newCapUsd}`,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.issues ? { issues: result.issues } : {}) },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      decisionRef: "DEC-019-050",
      hitlRequest: result.request,
      note: "cap update は Owner 承認後に反映されます (HITL gate permission_change_review)",
    },
    { status: 202 }, // 202 Accepted = 受付済み、未反映
  );
}
