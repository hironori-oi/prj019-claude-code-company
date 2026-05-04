/**
 * 並列 fetch 対象の上流ソース定義。
 *
 * 出典: SOP §1 監視対象 / DEC-019-022 4 系統 changelog Runbook
 *  - GitHub release atom (anthropics/claude-code)
 *  - npm dist-tags (@anthropic-ai/claude-code)
 *  - Anthropic Engineering blog RSS
 *  - openclaw-runtime upstream (placeholder URL を Phase 1 W1 で確定)
 *
 * Authentication:
 *  - 公開 atom / npm registry / RSS は anonymous で OK
 *  - GitHub PAT (read:public_repo) を ${GITHUB_PAT_READ_ONLY} で渡すと
 *    rate-limit を 60 → 5,000 req/h に拡張可能 (任意)
 */

import type { SourceId } from './types.ts';

export interface SourceDefinition {
  id: SourceId;
  url: string;
  /** 解析タイプ */
  parser: 'github-atom' | 'npm-registry' | 'rss';
  /** 任意で送る Authorization ヘッダ用の env 変数名 */
  authEnv?: string;
}

export const SOURCES: ReadonlyArray<SourceDefinition> = [
  {
    id: 'anthropic-claude-code-github',
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    parser: 'github-atom',
    authEnv: 'GITHUB_PAT_READ_ONLY',
  },
  {
    id: 'anthropic-claude-code-npm',
    url: 'https://registry.npmjs.org/@anthropic-ai/claude-code',
    parser: 'npm-registry',
  },
  {
    id: 'anthropic-engineering-blog',
    url: 'https://www.anthropic.com/engineering/rss.xml',
    parser: 'rss',
  },
  {
    id: 'openclaw-runtime-github',
    url: 'https://github.com/clawbro-ai/openclaw/releases.atom',
    parser: 'github-atom',
    authEnv: 'GITHUB_PAT_READ_ONLY',
  },
];
