/**
 * PRJ-019 Clawbridge - Supabase server-only client
 *
 * - service_role key は本モジュールでのみ参照する。client component には絶対に渡さない。
 * - RLS は 'tenant_id = auth.uid() のテナント' を前提として有効。
 *   service_role を使う API ルートでは tenant_id を必ず明示してクエリする。
 * - Pre-Phase 1 では env が未配備のケースを許容するため、env 未定義時は in-memory mock を返す。
 *   (Phase 1 W2 で env 必須に変更予定 — TODO 参照)
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

/**
 * Supabase service-role client (server only).
 * 用途: RLS bypass が必要な system 操作 (HITL ルーティング / audit log INSERT)。
 * Owner / operator 入力検証は API route 層で先に終わらせること。
 */
export function getServiceClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // TODO(Phase 1 W2): env 必須化。現在は scaffold mock を許容。
    return null;
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * 現在の tenant_id を解決する placeholder。
 * Phase 1 W2 で middleware から渡される auth context に置き換える。
 */
export function resolveTenantId(): string {
  return process.env["DEFAULT_TENANT_ID"] ?? "00000000-0000-0000-0000-000000000001";
}

/**
 * 現在の actor (Owner / operator) を解決する placeholder。
 * Phase 1 W2 で Supabase Auth と統合する。TODO(Phase 1 W2): middleware で session を渡す。
 */
export function resolveActor(): { actorKind: "owner" | "operator" | "system"; actorId: string } {
  return {
    actorKind: "owner",
    actorId: process.env["DEFAULT_OWNER_ID"] ?? "00000000-0000-0000-0000-000000000001",
  };
}
