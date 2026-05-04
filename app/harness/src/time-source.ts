/**
 * time-source — Harness 全体の時刻取得ソース抽象化。
 *
 * 関連必須コントロール:
 *   G-08 (連続稼働 12h 上限) / G-V2-08 (401/403/429 連続検知 60s 窓 5 件超)
 *   G-V2-11 (緊急停止 自動触発: 12h ルーフタイム / レート異常)
 *
 * 背景:
 *   - libfaketime は Linux 中心ツールで Windows 互換性が低く、
 *     PRJ-019 の primary 環境 Windows 11 では使えない
 *   - 既存 circuit-breaker / cost-tracker / usage-monitor は `now: () => Date / number` を
 *     コンストラクタオプションとして受け取る注入パターンを既に採用している
 *   - 本モジュールはそれらを 1 本の TimeSource interface に統合し、
 *     pentest シナリオ B5 (連続稼働超過) や 60s 窓のレート異常検知の決定論的テストを可能にする
 *
 * 設計方針:
 *   - now(): Date を返すのが基本 (一部 number で扱うコンポーネントは getTime() 経由)
 *   - RealTimeSource はラッパに過ぎず、本番では new Date() / Date.now() と等価
 *   - FakeTimeSource は test 用。setNow / advanceBy で時刻を進める
 *   - libfaketime 互換性は不要 (Node.js 内で完結)
 */

export interface TimeSource {
  /** 現在時刻の Date を返す。 */
  now(): Date
  /** 現在時刻のミリ秒タイムスタンプを返す (Date.now() 相当)。 */
  nowMs(): number
}

/**
 * 本番用 TimeSource。new Date() / Date.now() に委譲する。
 */
export class RealTimeSource implements TimeSource {
  now(): Date {
    return new Date()
  }
  nowMs(): number {
    return Date.now()
  }
}

/**
 * テスト用 TimeSource。決定論的に時刻を進められる。
 *
 * 使い方:
 * ```ts
 * const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
 * monitor.recordCall(...) // ts.now() = 10:00
 * ts.advanceBy(60_000)
 * monitor.recordCall(...) // ts.now() = 10:01
 * ```
 */
export class FakeTimeSource implements TimeSource {
  private current: number

  constructor(initial: Date | number = new Date()) {
    this.current = typeof initial === 'number' ? initial : initial.getTime()
  }

  now(): Date {
    return new Date(this.current)
  }
  nowMs(): number {
    return this.current
  }

  /** 絶対時刻を設定する。 */
  setNow(d: Date | number): void {
    this.current = typeof d === 'number' ? d : d.getTime()
  }

  /** ms 単位で時刻を進める (負値で巻き戻しも可能だが推奨しない)。 */
  advanceBy(ms: number): void {
    this.current += ms
  }
}

/**
 * `() => Date` 形式 callback への adapter。
 * 既存 cost-tracker / usage-monitor はこの形式を受け取る。
 */
export function asDateCallback(ts: TimeSource): () => Date {
  return () => ts.now()
}

/**
 * `() => number` 形式 callback への adapter。
 * 既存 circuit-breaker はこの形式を受け取る。
 */
export function asNumberCallback(ts: TimeSource): () => number {
  return () => ts.nowMs()
}
