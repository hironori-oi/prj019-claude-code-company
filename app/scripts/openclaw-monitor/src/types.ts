/**
 * openclaw-monitor — shared types
 *
 * 関連: DEC-019-022 / DEC-019-035 (採択予定)
 * 出典 SOP: projects/PRJ-019/reports/research-issue-changelog-monitor-ops.md
 */

export type Severity = 'L1' | 'L2' | 'L3';

export type SourceId =
  | 'anthropic-claude-code-github'
  | 'anthropic-claude-code-npm'
  | 'anthropic-engineering-blog'
  | 'openclaw-runtime-github';

export interface UpstreamSnapshot {
  /** 識別子 */
  source: SourceId;
  /** 最新 release / commit / version の human readable 表記 */
  versionOrTag: string;
  /** 最新コンテンツ要約（CHANGELOG 抜粋 / blog タイトル等、最大 4 KB） */
  summary: string;
  /** 取得 URL */
  url: string;
  /** 取得時刻 (ISO8601) */
  fetchedAt: string;
  /** 取得成功フラグ */
  ok: boolean;
  /** 失敗理由 */
  error?: string;
}

export interface ClassificationSignal {
  pattern: string;
  matched: string;
  weight: number;
}

export interface ClassifiedEvent {
  source: SourceId;
  severity: Severity;
  signalCount: number;
  signals: ClassificationSignal[];
  snapshot: UpstreamSnapshot;
  /** 前回スナップショットからの差分があれば true */
  changed: boolean;
}

export interface MonitorState {
  /** schema version */
  schemaVersion: 1;
  /** 直近 check 時刻 (ISO8601, UTC) */
  lastCheckedAt: string;
  /** source ごとの直近 version / commit hash 等 */
  lastSeen: Record<SourceId, { tag: string; hash: string }>;
}

export interface NotifyTarget {
  /** 通知先カテゴリ */
  channel: 'owner' | 'dev' | 'log';
  /** Slack webhook / メール / log のいずれか */
  transport: 'slack' | 'email' | 'log';
  /** 識別子 (env 変数名) */
  envVar?: string;
}
