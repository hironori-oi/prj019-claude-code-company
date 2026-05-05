/**
 * vitest.config — Round 19 Dev-CC 整備 + Round 23 Dev-MM ARCH-01 Phase 1 alias 統合.
 *
 * 目的:
 *   - heartbeat 500k load test 等の大規模 load test に対し testTimeout を 15_000ms に拡張.
 *   - 既存 default include パターン (`**\/*.test.ts`) を明示化し、将来の `.spec.ts` 命名に対する
 *     pickup risk を回避 (Round 17 Dev-U が引継事項として記録した懸念への対応).
 *   - pool は 'threads' 既定を維持 (vitest 2.x default).
 *   - **Round 23 Dev-MM 追加**: tsconfig path alias `@clawbridge/openclaw-runtime/*` の
 *     vitest resolve.alias 同期 (ARCH-01 Phase 1 dev/staging migrate / DEC-019-041 / Dev-JJ R22 案 A).
 *
 * 設計判断 (Round 19 Dev-CC):
 *   1. testTimeout=15_000ms — 50k (132ms) / 100k (81ms) / 500k (~500ms 想定) のすべてに余裕で対応.
 *      vitest default 5_000ms では 500k が将来環境で blow する余地があるため formal 拡張.
 *   2. include パターンを `__tests__/**\/*.test.ts` + ルート直下の `*.test.ts` を明示.
 *      vitest default と同等動作だが、明示化により将来の `.spec.ts` 命名 risk を文書化.
 *   3. pool: 既定 (threads) を維持. load test は単一 process 内で完結し pool 切替は不要.
 *
 * 設計判断 (Round 23 Dev-MM, ARCH-01 Phase 1):
 *   4. resolve.alias で `@clawbridge/openclaw-runtime` を `../openclaw-runtime/src` に解決.
 *      これにより test file が tsconfig paths と vitest 双方で同 alias を解決可能.
 *      既存 relative imports (`../../../openclaw-runtime/src/...`) も並走可能 (移行期混在許容).
 *   5. 副作用 0 / regression 0 想定: alias 経路は新規 import が出現するまで実質 dead code,
 *      従来の relative imports は完全に維持される.
 *
 * 参照:
 *   - Round 17 Dev-U 報告 §6 引継事項 (vitest config 整備の検討)
 *   - Round 18 Dev-Z 報告 §5 引継事項 2 (vitest config 整備継続議論)
 *   - Dev-JJ R22 ARCH-01 評価書 (`dev-jj-r22-arch-01-workspace-alias-feasibility.md`) 案 A 推奨
 *   - Dev-MM R23 ARCH-01 Phase 1 dev/staging migrate 報告
 */
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // load test の安全な timeout. 50k=132ms / 100k=81ms / 500k≈500ms の余裕係数 30x.
    testTimeout: 15_000,
    // hook timeout も load test の beforeEach / afterEach で安全側に拡張.
    hookTimeout: 15_000,
    // 既定 include を明示化 (`.test.ts` 統一規約 / `.spec.ts` は対象外 = Dev-U 引継事項対応).
    include: ['src/**/*.test.ts'],
    // 既定の reporter を維持 (CI で verbose が必要な場合は --reporter=verbose で都度切替).
  },
  resolve: {
    alias: {
      // Round 23 Dev-MM: ARCH-01 Phase 1 dev/staging migrate (DEC-019-041 / Dev-JJ R22 案 A).
      // tsconfig.json paths と同期: `@clawbridge/openclaw-runtime/*` → `../../openclaw-runtime/src/*`.
      '@clawbridge/openclaw-runtime': resolve(__dirname, '../openclaw-runtime/src'),
    },
  },
})
