/**
 * severity-classifier ユニットテスト
 *
 * 検証項目:
 *  - L1: 平和な patch release (signal なし、changed なし)
 *  - L1: changed あり, signal なし
 *  - L2: deprecation 1 シグナル + changed
 *  - L3: BREAKING CHANGE 直行
 *  - L3: semver major bump
 *  - L3: シグナル 3 件以上
 *  - 失敗 snapshot は L1 扱い
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifySnapshot,
  isMajorBump,
} from '../src/severity-classifier.ts';
import { parseSource } from '../src/fetcher.ts';
import type { SourceDefinition } from '../src/sources.ts';
import type { UpstreamSnapshot } from '../src/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = (name: string): string => resolve(HERE, 'fixtures', name);

const SRC_GITHUB: SourceDefinition = {
  id: 'anthropic-claude-code-github',
  url: 'https://github.com/anthropics/claude-code/releases.atom',
  parser: 'github-atom',
};

const SRC_NPM: SourceDefinition = {
  id: 'anthropic-claude-code-npm',
  url: 'https://registry.npmjs.org/@anthropic-ai/claude-code',
  parser: 'npm-registry',
};

async function load(name: string): Promise<string> {
  return readFile(FIX(name), 'utf8');
}

describe('isMajorBump', () => {
  it('detects v1.x → v2.x as major', () => {
    expect(isMajorBump('v1.45.0', 'v2.0.0')).toBe(true);
  });
  it('does not flag patch bumps', () => {
    expect(isMajorBump('v1.45.0', 'v1.46.0')).toBe(false);
  });
  it('handles plain numeric tags', () => {
    expect(isMajorBump('1.45.0', '2.0.0')).toBe(true);
  });
  it('returns false on unparseable tags', () => {
    expect(isMajorBump('foo', 'bar')).toBe(false);
  });
});

describe('classifySnapshot', () => {
  it('returns L1 for unchanged patch release', async () => {
    const text = await load('github-atom-l1.xml');
    const snap = parseSource(SRC_GITHUB, text, '2026-05-03T00:00:00Z');
    const event = classifySnapshot(snap, 'v1.45.0', false);
    expect(event.severity).toBe('L1');
    expect(event.signalCount).toBe(0);
  });

  it('returns L2 when 1 deprecation signal + changed', async () => {
    const text = await load('github-atom-l2-deprecation.xml');
    const snap = parseSource(SRC_GITHUB, text, '2026-05-08T00:00:00Z');
    const event = classifySnapshot(snap, 'v1.45.0', true);
    expect(event.severity).toBe('L2');
    expect(event.signalCount).toBeGreaterThanOrEqual(1);
  });

  it('returns L3 when BREAKING CHANGE keyword present', async () => {
    const text = await load('github-atom-l3-breaking.xml');
    const snap = parseSource(SRC_GITHUB, text, '2026-05-15T00:00:00Z');
    const event = classifySnapshot(snap, 'v1.46.0', true);
    expect(event.severity).toBe('L3');
    expect(event.signals.some((s) => s.weight >= 100)).toBe(true);
  });

  it('returns L3 when 3+ L2 signals accumulate', () => {
    const snap: UpstreamSnapshot = {
      source: 'anthropic-engineering-blog',
      versionOrTag: 'New post',
      summary:
        'The legacy assistant is deprecated and removed; users must migrate ' +
        'to a personal-only assistant required for all flows. Drop support ' +
        'for the prior license.',
      url: 'https://www.anthropic.com/engineering/post',
      fetchedAt: '2026-05-03T00:00:00Z',
      ok: true,
    };
    const event = classifySnapshot(snap, '', true);
    expect(event.severity).toBe('L3');
    expect(event.signalCount).toBeGreaterThanOrEqual(3);
  });

  it('returns L3 on semver major bump even without keywords', async () => {
    const text = await load('npm-registry-major.json');
    const snap = parseSource(SRC_NPM, text, '2026-05-15T00:00:00Z');
    const event = classifySnapshot(snap, '1.46.0', true);
    expect(event.severity).toBe('L3');
    expect(event.signals.some((s) => s.pattern === 'semver major bump')).toBe(true);
  });

  it('treats fetch failure as L1 info', () => {
    const snap: UpstreamSnapshot = {
      source: 'openclaw-runtime-github',
      versionOrTag: '',
      summary: '',
      url: 'https://example.invalid',
      fetchedAt: '2026-05-03T00:00:00Z',
      ok: false,
      error: 'HTTP 503',
    };
    const event = classifySnapshot(snap, 'v0.0.0', false);
    expect(event.severity).toBe('L1');
    expect(event.signalCount).toBe(0);
  });
});
