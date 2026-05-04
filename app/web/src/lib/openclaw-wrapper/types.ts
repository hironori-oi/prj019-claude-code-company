/**
 * PRJ-019 Clawbridge - openclaw-runtime Wrapper Types
 * Source of truth: dev-openclaw-runtime-wrapper.md §3
 */

export interface FeatureFlags {
  toolsSearch: boolean;
  webFetch: boolean;
  fileWrite: boolean;
  shellExec: boolean;
}

export interface OpenclawConfig {
  version: string;              // semver pin (e.g., "0.7.x")
  binaryPath: string;
  features: FeatureFlags;
  timeout: { spawn: number; idle: number; total: number };
  circuitBreaker: { threshold: number; cooldownMs: number };
}

export interface BreakingNotice {
  source: "anthropic" | "openai" | "openclaw" | "enderfga";
  severity: "L1" | "L2" | "L3";
  detectedAt: string;
  evidence: { url: string; excerpt: string; heuristic: string };
  recommendedAction: "circuit_open" | "flag_off" | "hitl_7th";
}

export interface CompatibilityResult {
  compatible: boolean;
  upstreamVersion: string;
  pinnedVersion: string;
  drift: "none" | "patch" | "minor" | "major";
  blockers: string[];
}

export interface SpawnRequest {
  prompt: string;
  features: Partial<FeatureFlags>;
  hitlContext: { proposalId: string; category: string };
}

export type RuntimeEvent =
  | { type: "started"; ts: string }
  | { type: "progress"; ts: string; payload: unknown }
  | { type: "tool_call"; ts: string; tool: string; args: unknown }
  | { type: "completed"; ts: string; exitCode: number }
  | { type: "error"; ts: string; message: string; recoverable: boolean };

export interface SpawnHandle {
  pid: number;
  events: AsyncIterable<RuntimeEvent>;
  cancel(reason: string): Promise<void>;
}

export interface OpenclawRuntime {
  init(config: OpenclawConfig): Promise<void>;
  checkCompatibility(): Promise<CompatibilityResult>;
  spawn(req: SpawnRequest): Promise<SpawnHandle>;
  getCircuitState(): "closed" | "open" | "half-open";
  onBreakingNotice(handler: (notice: BreakingNotice) => void): void;
  shutdown(graceMs: number): Promise<void>;
}
