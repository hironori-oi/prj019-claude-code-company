import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // workspace package を src 直結で解決する (build 不要で test 実行可)
      '@clawbridge/harness': resolve(__dirname, 'harness/src/index.ts'),
      '@clawbridge/claude-bridge': resolve(__dirname, 'claude-bridge/src/index.ts'),
      '@clawbridge/openclaw-runtime': resolve(__dirname, 'openclaw-runtime/src/index.ts'),
      '@clawbridge/audit': resolve(__dirname, 'audit/src/index.ts'),
      // Next.js web package の "@/*" エイリアス (tsconfig.json の paths と整合)
      // T2 (HITL templates) の vitest テストが @/types/hitl 等を解決できるようにする
      '@': resolve(__dirname, 'web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/openclaw-runtime/upstream/**',
      '**/openclaw-runtime/vendor/**',
      // Live integration tests (実機 Claude Code を呼ぶもの) はデフォルト除外
      '**/integration/**/*-live.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/__tests__/**',
        'eslint.config.mjs',
        'vitest.config.ts',
      ],
    },
    testTimeout: 10_000,
  },
})
