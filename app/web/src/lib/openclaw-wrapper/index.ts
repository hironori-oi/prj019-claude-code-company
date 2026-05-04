/**
 * PRJ-019 Clawbridge - openclaw-runtime Wrapper (skeleton)
 *
 * Source of truth: dev-openclaw-runtime-wrapper.md §3-4
 *
 * 5 責務:
 *   1. Adapter         - 上流 API 形状差吸収
 *   2. FeatureFlag     - 機能単位 ON/OFF (L2 自動 OFF)
 *   3. VersionPin      - semver lock + drift 検知
 *   4. CircuitBreaker  - 連続失敗で自動 OFF
 *   5. ChangelogWatcher - 4 系統 cron polling (L1/L2/L3 分岐)
 *
 * 注意:
 *   - 本層は subprocess を spawn する責務までは持たない
 *     (`packages/openclaw-runtime` 配下の RealStub / Mock が spawn 担当)
 *   - 本ファイルは Web 層から「現在の circuit / flag / version 状態」を取得して
 *     ダッシュボード表示するための薄い orchestration 層
 */

import type {
  OpenclawConfig,
  FeatureFlags,
  BreakingNotice,
  CompatibilityResult,
  OpenclawRuntime,
  SpawnRequest,
  SpawnHandle,
} from "./types";

export type {
  OpenclawConfig,
  FeatureFlags,
  BreakingNotice,
  CompatibilityResult,
  OpenclawRuntime,
  SpawnRequest,
  SpawnHandle,
};

/**
 * Adapter: 上流 API → 内部安定 IF への正規化を司る抽象。
 * 上流 breaking 時は本クラスのみ修正で済む構造を維持する。
 */
export interface OpenclawAdapter {
  readonly upstreamSource: "anthropic" | "openai" | "openclaw" | "enderfga";
  detectVersion(): Promise<string>;
  normalizeEvent(raw: unknown): unknown;
}

/**
 * FeatureFlag: 機能単位の動的 ON/OFF (L2 検知時に該当 flag を OFF)。
 */
export class FeatureFlagStore {
  private state: FeatureFlags;

  constructor(initial: FeatureFlags) {
    this.state = { ...initial };
  }

  get(): Readonly<FeatureFlags> {
    return this.state;
  }

  set(partial: Partial<FeatureFlags>): void {
    this.state = { ...this.state, ...partial };
  }

  disableAll(): void {
    this.state = {
      toolsSearch: false,
      webFetch: false,
      fileWrite: false,
      shellExec: false,
    };
  }
}

/**
 * VersionPin: 起動時に upstream `--version` と pinned semver を照合。
 * drift major 検知で fail-closed 起動拒否。
 */
export class VersionPin {
  constructor(private readonly pinnedSemver: string) {}

  evaluate(upstreamVersion: string): CompatibilityResult {
    const drift = this.computeDrift(this.pinnedSemver, upstreamVersion);
    return {
      compatible: drift !== "major",
      upstreamVersion,
      pinnedVersion: this.pinnedSemver,
      drift,
      blockers: drift === "major" ? [`major drift: pinned=${this.pinnedSemver}, upstream=${upstreamVersion}`] : [],
    };
  }

  private computeDrift(pinned: string, upstream: string): "none" | "patch" | "minor" | "major" {
    const p = pinned.replace(/^[~^]/, "").split(".").map((n) => parseInt(n, 10) || 0);
    const u = upstream.replace(/^[~^]/, "").split(".").map((n) => parseInt(n, 10) || 0);
    if (p[0] !== u[0]) return "major";
    if (p[1] !== u[1]) return "minor";
    if (p[2] !== u[2]) return "patch";
    return "none";
  }
}

/**
 * CircuitBreaker: closed → open → half-open 3 状態。
 */
export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private cooldownUntil: number | null = null;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
  ) {}

  getState(): CircuitState {
    if (this.state === "open" && this.cooldownUntil !== null && Date.now() >= this.cooldownUntil) {
      this.state = "half-open";
    }
    return this.state;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
    this.cooldownUntil = null;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.threshold) {
      this.state = "open";
      this.cooldownUntil = Date.now() + this.cooldownMs;
    }
  }

  forceOpen(): void {
    this.state = "open";
    this.cooldownUntil = Date.now() + this.cooldownMs;
  }
}

/**
 * RuntimeWrapper: Adapter / FeatureFlag / VersionPin / CircuitBreaker を束ねる。
 * spawn() / shutdown() は実装時に subprocess 接続が必要なため skeleton では throw する。
 */
export class RuntimeWrapper implements OpenclawRuntime {
  private flags: FeatureFlagStore;
  private breaker: CircuitBreaker;
  private pin: VersionPin;
  private listeners: Array<(notice: BreakingNotice) => void> = [];

  constructor(
    private readonly adapter: OpenclawAdapter,
    config: OpenclawConfig,
  ) {
    this.flags = new FeatureFlagStore(config.features);
    this.breaker = new CircuitBreaker(
      config.circuitBreaker.threshold,
      config.circuitBreaker.cooldownMs,
    );
    this.pin = new VersionPin(config.version);
  }

  async init(_config: OpenclawConfig): Promise<void> {
    const result = await this.checkCompatibility();
    if (!result.compatible) {
      throw new Error(`OpenclawRuntime init failed: ${result.blockers.join("; ")}`);
    }
  }

  async checkCompatibility(): Promise<CompatibilityResult> {
    const upstream = await this.adapter.detectVersion();
    return this.pin.evaluate(upstream);
  }

  async spawn(_req: SpawnRequest): Promise<SpawnHandle> {
    if (this.breaker.getState() === "open") {
      throw new Error("CIRCUIT_OPEN");
    }
    throw new Error("RuntimeWrapper.spawn: not implemented in W0 skeleton (Phase 1 W1)");
  }

  getCircuitState(): CircuitState {
    return this.breaker.getState();
  }

  onBreakingNotice(handler: (notice: BreakingNotice) => void): void {
    this.listeners.push(handler);
  }

  emitBreakingNotice(notice: BreakingNotice): void {
    for (const fn of this.listeners) fn(notice);
    if (notice.severity === "L3") {
      this.breaker.forceOpen();
      this.flags.disableAll();
    } else if (notice.severity === "L2") {
      // 該当 flag を OFF (本 skeleton では all OFF で代用)
      this.flags.disableAll();
    }
  }

  async shutdown(_graceMs: number): Promise<void> {
    // Phase 1 W2 で SIGTERM → SIGKILL の grace period 実装
  }
}
