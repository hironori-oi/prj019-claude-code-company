// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.d.ts',
      'openclaw-runtime/upstream/**',
      'openclaw-runtime/vendor/**',
      // mock-claude スタブは Node.js runtime script (.mjs)。eslint の no-undef は
      // node globals を別途設定しないと process / setTimeout で false-positive を出すため除外。
      // 内容は手書きで安全性を担保 (テストで実 spawn 検証済み)。
      'tests/integration/mock-claude/bin/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  // Round 13 Dev-B (DEC-019-057): notify package は harness / audit を import 禁止.
  // 依存方向は「harness → notify (一方向)」を正式化、逆方向は ESLint で検出して禁止する.
  {
    files: ['notify/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@clawbridge/harness', '@clawbridge/harness/*'],
              message:
                'notify package must NOT import @clawbridge/harness (循環依存禁止 / Round 13 Dev-B Task C).',
            },
            {
              group: ['@clawbridge/audit', '@clawbridge/audit/*'],
              message:
                'notify package must NOT import @clawbridge/audit (循環依存禁止 / Round 13 Dev-B Task C).',
            },
          ],
        },
      ],
    },
  },
  // Round 13 Dev-B (DEC-019-057): harness は notify を直接 import 禁止.
  // 必ず notify-bridge.ts 経由で transport 注入する (caller 側の wiring が責務).
  {
    files: ['harness/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@clawbridge/notify', '@clawbridge/notify/*'],
              message:
                'harness must NOT import @clawbridge/notify directly. Use notify-bridge.ts transport injection (Round 13 Dev-B Task C).',
            },
          ],
        },
      ],
    },
  },
)
