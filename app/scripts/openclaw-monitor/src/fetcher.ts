/**
 * 上流 source の HTTP fetch + パース。
 * fast-xml-parser は import を遅延させ、テストで mock 差し替え可能にする。
 */

import { request } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import type { SourceDefinition } from './sources.ts';
import type { UpstreamSnapshot } from './types.ts';

const USER_AGENT =
  'openclaw-monitor/0.1 (+https://github.com/clawbro-ai/openclaw)';

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export async function fetchSource(
  src: SourceDefinition,
  env: NodeJS.ProcessEnv = process.env,
): Promise<UpstreamSnapshot> {
  const fetchedAt = new Date().toISOString();
  const headers: Record<string, string> = { 'user-agent': USER_AGENT };
  if (src.authEnv && env[src.authEnv]) {
    headers['authorization'] = `Bearer ${env[src.authEnv]}`;
  }

  try {
    const { statusCode, body } = await request(src.url, {
      method: 'GET',
      headers,
      // GitHub / npm / RSS いずれも 5s 以内に応答する想定
      bodyTimeout: 8000,
      headersTimeout: 4000,
    });
    if (statusCode >= 400) {
      return errorSnapshot(src, fetchedAt, `HTTP ${statusCode}`);
    }
    const text = await body.text();
    return parseSource(src, text, fetchedAt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorSnapshot(src, fetchedAt, msg);
  }
}

export function parseSource(
  src: SourceDefinition,
  text: string,
  fetchedAt: string,
): UpstreamSnapshot {
  switch (src.parser) {
    case 'github-atom':
      return parseGithubAtom(src, text, fetchedAt);
    case 'npm-registry':
      return parseNpmRegistry(src, text, fetchedAt);
    case 'rss':
      return parseRss(src, text, fetchedAt);
  }
}

function parseGithubAtom(
  src: SourceDefinition,
  text: string,
  fetchedAt: string,
): UpstreamSnapshot {
  const doc = xml.parse(text) as {
    feed?: { entry?: Array<Record<string, unknown>> | Record<string, unknown> };
  };
  const entries = toArray(doc.feed?.entry);
  const first = entries[0];
  if (!first) {
    return errorSnapshot(src, fetchedAt, 'no entries');
  }
  const tag = pickString(first['title']) ?? 'unknown';
  const summary =
    pickString(first['content']) ?? pickString(first['summary']) ?? '';
  return {
    source: src.id,
    versionOrTag: tag,
    summary: summary.slice(0, 4096),
    url: src.url,
    fetchedAt,
    ok: true,
  };
}

function parseNpmRegistry(
  src: SourceDefinition,
  text: string,
  fetchedAt: string,
): UpstreamSnapshot {
  let json: { 'dist-tags'?: { latest?: string }; versions?: Record<string, unknown> };
  try {
    json = JSON.parse(text) as typeof json;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorSnapshot(src, fetchedAt, `npm parse fail: ${msg}`);
  }
  const latest = json['dist-tags']?.latest ?? 'unknown';
  // NOTE: 各 version object 内の readme / changelog は volatile なので、
  // version リストのみ要約に含める。
  const versionsList = json.versions ? Object.keys(json.versions).slice(-20).join(', ') : '';
  return {
    source: src.id,
    versionOrTag: latest,
    summary: `latest=${latest}; recent=${versionsList}`,
    url: src.url,
    fetchedAt,
    ok: true,
  };
}

function parseRss(
  src: SourceDefinition,
  text: string,
  fetchedAt: string,
): UpstreamSnapshot {
  const doc = xml.parse(text) as {
    rss?: { channel?: { item?: Array<Record<string, unknown>> | Record<string, unknown> } };
    feed?: { entry?: Array<Record<string, unknown>> | Record<string, unknown> };
  };
  const items = toArray(doc.rss?.channel?.item ?? doc.feed?.entry);
  const first = items[0];
  if (!first) {
    return errorSnapshot(src, fetchedAt, 'no items');
  }
  const title = pickString(first['title']) ?? 'unknown';
  const description =
    pickString(first['description']) ??
    pickString(first['summary']) ??
    pickString(first['content']) ??
    '';
  return {
    source: src.id,
    versionOrTag: title,
    summary: description.slice(0, 4096),
    url: src.url,
    fetchedAt,
    ok: true,
  };
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function pickString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && '#text' in v) {
    const t = (v as { '#text': unknown })['#text'];
    if (typeof t === 'string') return t;
  }
  return undefined;
}

function errorSnapshot(
  src: SourceDefinition,
  fetchedAt: string,
  reason: string,
): UpstreamSnapshot {
  return {
    source: src.id,
    versionOrTag: '',
    summary: '',
    url: src.url,
    fetchedAt,
    ok: false,
    error: reason,
  };
}
