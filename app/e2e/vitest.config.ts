import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // workspace package を src 直結で解決する (build 不要で test 実行可)
      '@clawbridge/harness': resolve(__dirname, '../harness/src/index.ts'),
      '@clawbridge/openclaw-runtime': resolve(__dirname, '../openclaw-runtime/src/index.ts'),
      '@clawbridge/audit': resolve(__dirname, '../audit/src/index.ts'),
      '@clawbridge/needs-scout': resolve(__dirname, '../needs-scout/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 15_000,
  },
})
