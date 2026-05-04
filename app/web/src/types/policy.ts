/**
 * PRJ-019 Clawbridge - Policy / 権限管理 types
 *
 * Source of truth: pm-permission-ui-wbs.md / DEC-019-033 §⑤
 * 7 categories: fs / command / network / hitl / cost / time / genre
 *
 * - 13 prohibited domains は network カテゴリ内で disabled 状態の永遠 deny envelope
 * - kill switch は emergency_stop (HITL-8) を即時発火
 * - 変更時は HITL-10 permission_change_review を起票
 */
export type PolicyCategory = "fs" | "command" | "network" | "hitl" | "cost" | "time" | "genre";

export interface PolicyRule {
  id: string;
  effect: "allow" | "deny";
  pattern: string;
  description?: string;
  /** envelope: 永遠 deny でユーザが書き換え不可 (例: 13 prohibited domains) */
  locked?: boolean;
}

export interface FsPolicy {
  rules: PolicyRule[];
}
export interface CommandPolicy {
  rules: PolicyRule[];
}
export interface NetworkPolicy {
  rules: PolicyRule[];
  prohibitedDomains: string[];
}
export interface HitlPolicy {
  gateEnabled: Record<string, boolean>;
  slaHoursOverride?: Record<string, number>;
}
export interface CostPolicy {
  monthlyCapUsd: number;
  projectCapUsd: number;
  proposalCapUsd: number;
}
export interface TimePolicy {
  /** 7 (日-土) x 24 行列。true = 許可。JST 基準 */
  matrix: boolean[][];
}
export interface GenrePolicy {
  whitelist: string[];
  blocklist: string[];
}

export interface PolicySnapshot {
  versionId: string;
  active: boolean;
  fs: FsPolicy;
  command: CommandPolicy;
  network: NetworkPolicy;
  hitl: HitlPolicy;
  cost: CostPolicy;
  time: TimePolicy;
  genre: GenrePolicy;
  createdAt: string;
}

export interface PolicyAuditEntry {
  id: string;
  ts: string;
  category: PolicyCategory | "global";
  action: "create" | "update" | "delete" | "restore" | "kill_switch" | "approve" | "reject";
  actor: string;
  prePolicyVersionId?: string;
  postPolicyVersionId?: string;
  hitlRequestId?: string;
  summary: string;
}

/**
 * DEC-019-033 §⑤ で禁則指定された 13 ドメイン (永遠 deny / UI 編集不可)
 * 機械学習による override は HITL-10 を経由しても拒否される (Casbin policy hard envelope)。
 */
export const PROHIBITED_DOMAINS_13: readonly string[] = [
  "torrents.to",
  "darknet-search.example",
  "leakforums.example",
  "carding.example",
  "stresser.example",
  "phishingkit.example",
  "exploit-db-clone.example",
  "ransomware-as-service.example",
  "malware-bazaar-clone.example",
  "credential-stuffing.example",
  "stolen-data-market.example",
  "deepfake-marketplace.example",
  "child-exploit.example",
];

export const POLICY_CATEGORY_LABELS: Record<PolicyCategory, string> = {
  fs: "(1) FS 書込範囲",
  command: "(2) シェルコマンド",
  network: "(3) ネットワーク",
  hitl: "(4) HITL Gate",
  cost: "(5) コスト上限",
  time: "(6) 時間帯ウィンドウ",
  genre: "(7) ジャンル",
};
