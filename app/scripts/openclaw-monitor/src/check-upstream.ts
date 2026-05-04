/**
 * check-upstream.ts — entrypoint
 *
 * 並列 fetch (3 source 以上) → severity 分類 → 通知 → state 永続化。
 *
 * Modes:
 *  - check    (default): fetch + classify + dispatch + state save
 *  - report             : fetch + classify、結果を JSON で stdout へ
 *  - dispatch           : 直近 state を再評価し dispatch のみ
 *
 * Cron: GitHub Actions daily 18:00 UTC = 03:00 JST (.github/workflows/openclaw-monitor.yml)
 */

import { SOURCES } from './sources.ts';
import { fetchSource } from './fetcher.ts';
import { classifySnapshot } from './severity-classifier.ts';
import { notify } from './notify.ts';
import { loadState, saveState, updateState } from './state.ts';
import type { ClassifiedEvent, MonitorState } from './types.ts';

type Mode = 'check' | 'report' | 'dispatch';

function parseMode(argv: string[]): Mode {
  for (const a of argv) {
    if (a.startsWith('--mode=')) {
      const m = a.slice('--mode='.length);
      if (m === 'check' || m === 'report' || m === 'dispatch') return m;
    }
  }
  return 'check';
}

export async function runCheck(): Promise<{
  events: ClassifiedEvent[];
  state: MonitorState;
}> {
  const prevState = await loadState();
  const snapshots = await Promise.all(SOURCES.map((s) => fetchSource(s)));
  const events: ClassifiedEvent[] = snapshots.map((snap) => {
    const prev = prevState.lastSeen[snap.source];
    const previousTag = prev?.tag ?? '';
    const changed = snap.ok && snap.versionOrTag !== previousTag;
    return classifySnapshot(snap, previousTag, changed);
  });
  const newState = updateState(prevState, snapshots);
  return { events, state: newState };
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  const { events, state } = await runCheck();

  if (mode === 'report') {
    process.stdout.write(`${JSON.stringify({ events, state }, null, 2)}\n`);
    return;
  }

  for (const event of events) {
    if (!event.changed && event.severity === 'L1') continue;
    await notify(event);
  }

  if (mode !== 'dispatch') {
    await saveState(state);
  }
}

const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMain) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`openclaw-monitor failed: ${msg}\n`);
    process.exit(1);
  });
}
