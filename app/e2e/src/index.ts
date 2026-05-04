/**
 * @clawbridge/e2e-mock-claw — PRJ-019 Phase 1 W4 → W0 前倒し (R10 Dev-γ):
 *   mock-claw e2e full flow scaffold。
 *
 * 統合 flow (1 round-trip):
 *   needs_scout (runNeedsScout / fixture HN response)
 *     -> Open Claw → CEO 構造化 JSON IF dispatch (dispatcher.ts)
 *     -> CEO mock receive (sink: in-memory CEO inbox)
 *     -> tos-monitor evaluation (連続稼働 / cost cap / rate spike / fallback)
 *     -> kill-switch (mock、exitOnTrigger=false)
 *     -> audit log (FileAuditLogStore SHA-256 hash chain)
 *     -> recovery (kill-switch disarm + 状態リセット で次サイクル可能)
 *
 * 設計原則:
 *   - 既存 module 内部に手を入れない (read-only import / DI のみ)
 *   - fixture ベース (HTTP / fs / network / process spawn 一切叩かない)
 *   - 決定論的 (FakeTimeSource + 注入 fetcher + tmpdir audit ファイル)
 *
 * 関連:
 *   - DEC-019-006 P-D 改 (subprocess spawn / 副作用ゼロ)
 *   - DEC-019-008 NG-3 (12h/$30 暫定)
 *   - DEC-019-033 ② (HITL 第 9 種 dev_kickoff_approval / SLA 72h)
 *   - DEC-019-050/051 (cost cap $30 Hard / subscription 主軸)
 *   - DEC-019-055/056 (Round 8/9 完遂着地)
 *   - CB-D-W4-01 (dry-run G-12 hardguard / 別ファイル app/harness/src/dry-run-guard.ts)
 *   - CB-D-W4-02 (benchmarks / 別ファイル app/harness/src/benchmarks/baseline.ts)
 */

export {
  runMockClawE2eFlow,
  type MockClawE2eFlowOptions,
  type MockClawE2eFlowResult,
  type FlowStageOutcome,
  type FlowRecoveryReport,
  type FlowStageName,
} from './flow/run-mock-claw-flow.js'

export { CeoMockInbox, type CeoInboxEntry } from './ceo/ceo-mock-inbox.js'
export { createCeoInboxSink } from './ceo/ceo-inbox-sink.js'
export { createAuditDispatchSink } from './ceo/audit-dispatch-sink.js'

export {
  buildHnFixtureResponse,
  HN_FIXTURE_HITS,
  type HnFixtureHit,
} from './fixtures/hn-fixture.js'

export {
  buildProposalFromCandidate,
  type BuildProposalInput,
} from './fixtures/proposal-builder.js'
