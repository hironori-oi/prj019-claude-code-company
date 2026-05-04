/**
 * severity classifier — 9 種 keyword regex + 3 シグナル昇格ルール
 *
 * 出典:
 *  - SOP §3 alert 条件 (research-issue-changelog-monitor-ops.md)
 *  - DEC-019-022 4 系統 changelog Runbook
 *
 * 判定:
 *  - L3 直行: semver major bump / Conventional Commits "BREAKING CHANGE"
 *  - L2 シグナル: removed / deprecated / rename / license / personal-only / oauth required / archived / EOL
 *  - シグナル数 0 → L1, 1 → L1/L2 境界 (semver major 例外で L3), 2 → L2, 3+ → L3 昇格
 */

import type {
  ClassificationSignal,
  ClassifiedEvent,
  Severity,
  UpstreamSnapshot,
} from './types.ts';

interface Rule {
  pattern: RegExp;
  /** 1 = L2 シグナル, 100 = 即 L3 シグナル */
  weight: number;
  description: string;
}

export const L3_DIRECT_RULES: ReadonlyArray<Rule> = [
  {
    pattern: /BREAKING\s*CHANGE/i,
    weight: 100,
    description: 'Conventional Commits BREAKING CHANGE',
  },
  {
    pattern: /\b(feat|fix|refactor|chore)!:/,
    weight: 100,
    description: 'Conventional Commits ! sign',
  },
];

export const L2_RULES: ReadonlyArray<Rule> = [
  {
    pattern: /\bremoved\b/i,
    weight: 1,
    description: 'feature removed',
  },
  {
    pattern: /\bdeprecat(e|ed|ion)\b/i,
    weight: 1,
    description: 'deprecation notice',
  },
  {
    pattern: /\b(rename|renamed|renaming)\b/i,
    weight: 1,
    description: 'API rename',
  },
  {
    pattern: /\b(license|terms|policy|acceptable\s*use|commercial|non-commercial)\b/i,
    weight: 1,
    description: 'legal / ToS change',
  },
  {
    pattern: /\b(personal|assistant)\b.*\b(only|exclusive|required)\b/i,
    weight: 1,
    description: 'personal-only pivot',
  },
  {
    pattern: /\b(authentication|oauth|api\s*key)\b.*\b(required|mandatory|deprecated)\b/i,
    weight: 1,
    description: 'auth flow forced change',
  },
  {
    pattern: /\b(archived|sunset|end\s*of\s*life|EOL)\b/i,
    weight: 1,
    description: 'archive / EOL signal',
  },
  {
    pattern: /\b(migration|migrate)\b/i,
    weight: 1,
    description: 'migration required',
  },
  {
    pattern: /\bdrop\s+support\b/i,
    weight: 1,
    description: 'drop support',
  },
];

const SEMVER_RE = /v?(\d+)\.(\d+)\.(\d+)/;

/** Previous / next tag comparison; returns true on major bump. */
export function isMajorBump(prevTag: string, nextTag: string): boolean {
  const a = SEMVER_RE.exec(prevTag);
  const b = SEMVER_RE.exec(nextTag);
  if (!a || !b) return false;
  const aMajor = a[1];
  const bMajor = b[1];
  if (aMajor === undefined || bMajor === undefined) return false;
  return Number(bMajor) > Number(aMajor);
}

/**
 * Classify one snapshot.
 *
 * @param snapshot Fetched upstream snapshot.
 * @param previousTag Previous observed tag (from state.json).
 * @param changed Whether snapshot.versionOrTag differs from previousTag.
 */
export function classifySnapshot(
  snapshot: UpstreamSnapshot,
  previousTag: string,
  changed: boolean,
): ClassifiedEvent {
  if (!snapshot.ok) {
    // Fetch failures are reported as L1 info; chronic failure is escalated by ops.
    return {
      source: snapshot.source,
      severity: 'L1',
      signalCount: 0,
      signals: [],
      snapshot,
      changed: false,
    };
  }

  const text = `${snapshot.versionOrTag}\n${snapshot.summary}`;
  const signals: ClassificationSignal[] = [];

  for (const rule of L3_DIRECT_RULES) {
    const m = rule.pattern.exec(text);
    if (m) {
      signals.push({
        pattern: rule.description,
        matched: m[0],
        weight: rule.weight,
      });
    }
  }
  for (const rule of L2_RULES) {
    const m = rule.pattern.exec(text);
    if (m) {
      signals.push({
        pattern: rule.description,
        matched: m[0],
        weight: rule.weight,
      });
    }
  }

  const semverMajor = isMajorBump(previousTag, snapshot.versionOrTag);
  if (semverMajor) {
    signals.push({
      pattern: 'semver major bump',
      matched: `${previousTag} -> ${snapshot.versionOrTag}`,
      weight: 100,
    });
  }

  const severity = decideSeverity(signals, changed);

  return {
    source: snapshot.source,
    severity,
    signalCount: signals.length,
    signals,
    snapshot,
    changed,
  };
}

function decideSeverity(signals: ClassificationSignal[], changed: boolean): Severity {
  // Any L3-direct signal forces L3.
  if (signals.some((s) => s.weight >= 100)) return 'L3';

  const l2Count = signals.filter((s) => s.weight < 100).length;

  if (l2Count >= 3) return 'L3';
  if (l2Count >= 2) return 'L2';
  if (l2Count === 1) return changed ? 'L2' : 'L1';
  return 'L1';
}
