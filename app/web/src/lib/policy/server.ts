/**
 * PRJ-019 Clawbridge - Policy snapshot fetch (placeholder)
 *
 * Phase 1 W1 では DB スキーマ完成前の placeholder を返す。
 * Phase 1 W2 で `policy_versions` (migrations/20260503000003) を読むよう統合する (TODO)。
 */
import "server-only";
import { getServiceClient, resolveTenantId } from "@/lib/supabase/server";
import {
  PROHIBITED_DOMAINS_13,
  type PolicyAuditEntry,
  type PolicySnapshot,
} from "@/types/policy";

export async function getActivePolicy(): Promise<PolicySnapshot> {
  const tenantId = resolveTenantId();
  const client = getServiceClient();
  if (client) {
    // policy_versions は (tenant_id, category) 単位で 1 active row。
    // 7 行を集約して PolicySnapshot を再構築する。Phase 1 W2 で migration / RPC へ置換 (TODO)。
    const { data, error } = await client
      .from("policy_versions")
      .select("id, category, policy_doc, created_at")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    if (!error && data && data.length > 0) {
      const base = defaultPolicy();
      const merged: PolicySnapshot = { ...base };
      let latestId = base.versionId;
      let latestCreated = base.createdAt;
      for (const row of data as Record<string, unknown>[]) {
        const cat = String(row["category"]);
        const doc = row["policy_doc"] as Record<string, unknown> | null;
        if (!doc) continue;
        switch (cat) {
          case "fs":
            merged.fs = doc as unknown as PolicySnapshot["fs"];
            break;
          case "command":
            merged.command = doc as unknown as PolicySnapshot["command"];
            break;
          case "network":
            merged.network = doc as unknown as PolicySnapshot["network"];
            break;
          case "hitl":
            merged.hitl = doc as unknown as PolicySnapshot["hitl"];
            break;
          case "cost":
            merged.cost = doc as unknown as PolicySnapshot["cost"];
            break;
          case "time":
            merged.time = doc as unknown as PolicySnapshot["time"];
            break;
          case "genre":
            merged.genre = doc as unknown as PolicySnapshot["genre"];
            break;
          default:
            break;
        }
        const created = String(row["created_at"] ?? "");
        if (created > latestCreated) {
          latestCreated = created;
          latestId = String(row["id"]);
        }
      }
      merged.versionId = latestId;
      merged.createdAt = latestCreated;
      merged.active = true;
      return merged;
    }
  }
  return defaultPolicy();
}

export async function getPolicyAuditTimeline(): Promise<PolicyAuditEntry[]> {
  const client = getServiceClient();
  if (client) {
    const tenantId = resolveTenantId();
    // TODO(Phase 1 W2): policy_audit_log から timeline を取得
    const { data, error } = await client
      .from("policy_audit_log")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("ts", { ascending: false })
      .limit(50);
    if (!error && data) {
      return (data as Record<string, unknown>[]).map((r) => {
        const trigger = String(r["trigger_kind"] ?? "owner_manual");
        const action: PolicyAuditEntry["action"] =
          trigger === "backup_restore"
            ? "restore"
            : trigger === "auto_warning_rollback"
              ? "update"
              : "update";
        return {
          id: String(r["id"]),
          ts: String(r["ts"]),
          category: (r["category"] as PolicyAuditEntry["category"]) ?? "global",
          action,
          actor: String(r["changed_by"] ?? "system"),
          ...(r["pre_version_id"]
            ? { prePolicyVersionId: String(r["pre_version_id"]) }
            : {}),
          ...(r["post_version_id"]
            ? { postPolicyVersionId: String(r["post_version_id"]) }
            : {}),
          ...(r["hitl_request_id"] ? { hitlRequestId: String(r["hitl_request_id"]) } : {}),
          summary: `${trigger} → ${String(r["category"])}`,
        };
      });
    }
  }
  return SAMPLE_TIMELINE;
}

function defaultPolicy(): PolicySnapshot {
  const matrix = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => hour >= 9 && hour < 22 && day >= 1 && day <= 5),
  );
  return {
    versionId: "v0-scaffold",
    active: true,
    fs: {
      rules: [
        { id: "fs-1", effect: "allow", pattern: "projects/PRJ-019/**", description: "本案件配下" },
        { id: "fs-2", effect: "deny", pattern: "**/.env*", description: "secrets", locked: true },
      ],
    },
    command: {
      rules: [
        { id: "cmd-1", effect: "allow", pattern: "git status", description: "read only" },
        { id: "cmd-2", effect: "allow", pattern: "pnpm test" },
        { id: "cmd-3", effect: "deny", pattern: "rm -rf *", locked: true },
      ],
    },
    network: {
      rules: [
        { id: "net-1", effect: "allow", pattern: "github.com" },
        { id: "net-2", effect: "allow", pattern: "supabase.co" },
        { id: "net-3", effect: "allow", pattern: "openai.com" },
      ],
      prohibitedDomains: [...PROHIBITED_DOMAINS_13],
    },
    hitl: {
      gateEnabled: {
        network_external: true,
        cost_threshold: true,
        secret_access: true,
        prod_deploy: true,
        unsafe_command: true,
        tos_gray_review: true,
        external_api: true,
        emergency_stop: true,
        dev_kickoff_approval: true,
        permission_change_review: true,
        knowledge_pii_review: true,
      },
    },
    cost: { monthlyCapUsd: 300, projectCapUsd: 50, proposalCapUsd: 5 },
    time: { matrix },
    genre: {
      whitelist: ["development", "research", "documentation"],
      blocklist: ["adult", "weapons", "drugs"],
    },
    createdAt: new Date().toISOString(),
  };
}

const SAMPLE_TIMELINE: PolicyAuditEntry[] = [
  {
    id: "pa-1",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    category: "network",
    action: "update",
    actor: "owner",
    prePolicyVersionId: "v0-scaffold",
    postPolicyVersionId: "v0-scaffold",
    hitlRequestId: "scaffold-hitl-10-1",
    summary: "openai.com を allow に追加",
  },
  {
    id: "pa-2",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: "global",
    action: "create",
    actor: "system",
    summary: "初期 policy 生成 (scaffold)",
  },
];
