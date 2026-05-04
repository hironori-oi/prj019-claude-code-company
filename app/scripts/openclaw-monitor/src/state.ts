/**
 * Persistent state — 前回 check 時刻 + 各 source の最終観測 tag/hash を保存。
 *
 * 配置: projects/PRJ-019/app/scripts/openclaw-monitor/state.json
 *
 * NOTE: GitHub Actions では actions/cache または artifact で永続化する。
 * 初回実行時は createInitialState() のダミー値を書き込む。
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MonitorState, SourceId, UpstreamSnapshot } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
export const STATE_PATH = resolve(HERE, '..', 'state.json');

export function createInitialState(): MonitorState {
  return {
    schemaVersion: 1,
    lastCheckedAt: '1970-01-01T00:00:00.000Z',
    lastSeen: {
      'anthropic-claude-code-github': { tag: 'v0.0.0', hash: '' },
      'anthropic-claude-code-npm': { tag: 'v0.0.0', hash: '' },
      'anthropic-engineering-blog': { tag: '', hash: '' },
      'openclaw-runtime-github': { tag: 'v0.0.0', hash: '' },
    },
  };
}

export async function loadState(path: string = STATE_PATH): Promise<MonitorState> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MonitorState>;
    if (parsed.schemaVersion !== 1) return createInitialState();
    return {
      schemaVersion: 1,
      lastCheckedAt: parsed.lastCheckedAt ?? new Date(0).toISOString(),
      lastSeen: { ...createInitialState().lastSeen, ...(parsed.lastSeen ?? {}) },
    };
  } catch {
    return createInitialState();
  }
}

export async function saveState(
  state: MonitorState,
  path: string = STATE_PATH,
): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  await writeFile(path, `${json}\n`, 'utf8');
}

/** 各 snapshot を取り込んで state を更新する純粋関数 */
export function updateState(
  prev: MonitorState,
  snapshots: ReadonlyArray<UpstreamSnapshot>,
  now: string = new Date().toISOString(),
): MonitorState {
  const lastSeen = { ...prev.lastSeen };
  for (const snap of snapshots) {
    if (!snap.ok) continue;
    const id: SourceId = snap.source;
    lastSeen[id] = {
      tag: snap.versionOrTag,
      hash: '', // GitHub Atom では release id を後続改修で hash 化予定
    };
  }
  return {
    schemaVersion: 1,
    lastCheckedAt: now,
    lastSeen,
  };
}
