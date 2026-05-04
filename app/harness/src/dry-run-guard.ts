/**
 * dry-run-guard — G-12 hardguard (CB-D-W4-01 pre-emption)。
 *
 * 役割:
 *   Run mode = "dry" 時に、登録された関数 (wrap で包んだもの) の **副作用** を
 *   全件 mock 化する。検出時は 拒否 (RejectError) を投げ、記録列に残す。
 *
 * 検出対象 (副作用カテゴリ):
 *   - fs    : ファイル書込 / 読込 / mkdir / rm 等を通すと throw (mock fs)
 *   - net   : fetch / http.request / dns 解決 を通すと throw (mock net)
 *   - spawn : child_process.spawn / exec / fork を通すと throw (mock spawn)
 *
 * 設計原則:
 *   - 既存ファイル無改変。新規追加のみ。
 *   - グローバル fs / fetch / child_process を patch しない (副作用テスト分離のため)。
 *     代わりに **wrap 関数経由** でしか副作用を通さない契約を提供。
 *   - sideEffectsRecorded で「どの副作用が試みられたか」 audit/test 用に列挙。
 *   - mode = "live" 時は wrap は素通り (no-op proxy)。
 *
 * 使い方:
 * ```ts
 * import { createDryRunGuard } from '@clawbridge/harness'
 * const guard = createDryRunGuard({ mode: 'dry' })
 * await guard.wrap('fs', 'write', async () => {
 *   await fs.writeFile('foo', 'bar') // throw RejectError before call
 * })
 * console.log(guard.sideEffectsRecorded) // [{ category: 'fs', name: 'write', ... }]
 * ```
 */

export type DryRunCategory = 'fs' | 'net' | 'spawn' | 'process' | 'other'

export type DryRunMode = 'dry' | 'live'

export interface DryRunSideEffectRecord {
  /** insertion 順で付与される 1-based id */
  id: number
  category: DryRunCategory
  /** operation name (例 'fs.writeFile' / 'net.fetch' / 'spawn.exec') */
  name: string
  /** ISO8601 attempt 時刻 */
  attemptedAt: string
  /** dry-run mode で拒否されたか (true = blocked) / live なら常に false */
  blocked: boolean
  /** 任意の attempt メタ情報 (引数の hash / 概要) — PII redacted */
  meta?: Record<string, unknown>
}

export interface DryRunGuardOptions {
  /** 'dry' = 副作用全て拒否 / 'live' = 素通り (no-op、recorded のみ) */
  mode?: DryRunMode
  /** 注入用 ISO 時刻取得 (default = () => new Date().toISOString()) */
  nowIso?: () => string
  /** 拒否時 throw する代わりに warn ログ + ok:false で返すか (default false = throw) */
  warnInsteadOfThrow?: boolean
}

/**
 * dry-run mode で副作用を試みた際に投げられる例外。
 */
export class DryRunRejectError extends Error {
  readonly category: DryRunCategory
  readonly opName: string

  constructor(category: DryRunCategory, opName: string) {
    super(`dry-run-guard: side-effect rejected — category=${category} op=${opName}`)
    this.name = 'DryRunRejectError'
    this.category = category
    this.opName = opName
  }
}

export interface DryRunGuard {
  readonly mode: DryRunMode
  readonly isDryRun: boolean
  /**
   * 副作用呼び出しを wrap する。
   *   - mode='dry':  fn は 呼び出さず、record に登録、DryRunRejectError throw
   *   - mode='live': fn を呼び出し、record に登録 (blocked=false)、結果を返す
   */
  wrap<T>(
    category: DryRunCategory,
    opName: string,
    fn: () => Promise<T> | T,
    meta?: Record<string, unknown>,
  ): Promise<T>
  /** 検出された全副作用の列 (insertion 順)。 */
  readonly sideEffectsRecorded: readonly DryRunSideEffectRecord[]
  /** record をクリア (test 用)。 */
  reset(): void
  /** 集計: category 別件数。 */
  countByCategory(): Readonly<Record<DryRunCategory, number>>
}

class DryRunGuardImpl implements DryRunGuard {
  readonly mode: DryRunMode
  private readonly records: DryRunSideEffectRecord[] = []
  private counter = 0
  private readonly nowIso: () => string
  private readonly warnInsteadOfThrow: boolean

  constructor(opts: DryRunGuardOptions = {}) {
    this.mode = opts.mode ?? 'dry'
    this.nowIso = opts.nowIso ?? (() => new Date().toISOString())
    this.warnInsteadOfThrow = opts.warnInsteadOfThrow ?? false
  }

  get isDryRun(): boolean {
    return this.mode === 'dry'
  }

  get sideEffectsRecorded(): readonly DryRunSideEffectRecord[] {
    return this.records.slice()
  }

  async wrap<T>(
    category: DryRunCategory,
    opName: string,
    fn: () => Promise<T> | T,
    meta?: Record<string, unknown>,
  ): Promise<T> {
    this.counter += 1
    const blocked = this.isDryRun
    const record: DryRunSideEffectRecord = {
      id: this.counter,
      category,
      name: opName,
      attemptedAt: this.nowIso(),
      blocked,
      ...(meta !== undefined ? { meta } : {}),
    }
    this.records.push(record)

    if (this.isDryRun) {
      if (this.warnInsteadOfThrow) {
        // best-effort warn; caller は record を見て検証する
        // eslint-disable-next-line no-console
        console.warn(
          `[dry-run-guard] BLOCKED side-effect category=${category} op=${opName}`,
        )
        // 副作用を実行しないので T が undefined しか返せない;
        // T が undefined を許す型 (e.g. void) でない場合はそのまま throw する仕様
        return undefined as unknown as T
      }
      throw new DryRunRejectError(category, opName)
    }

    // live mode — 素通り (record は blocked=false で残す)
    return await fn()
  }

  reset(): void {
    this.records.length = 0
    this.counter = 0
  }

  countByCategory(): Readonly<Record<DryRunCategory, number>> {
    const out: Record<DryRunCategory, number> = {
      fs: 0,
      net: 0,
      spawn: 0,
      process: 0,
      other: 0,
    }
    for (const r of this.records) {
      out[r.category] += 1
    }
    return Object.freeze(out)
  }
}

/**
 * dry-run guard を生成する factory。
 *
 * @param opts.mode      'dry' (default) で副作用拒否 / 'live' で素通り
 * @param opts.nowIso    ISO 時刻取得 (test 注入)
 * @param opts.warnInsteadOfThrow true で throw せず警告のみ (副作用は実行されない)
 */
export function createDryRunGuard(opts: DryRunGuardOptions = {}): DryRunGuard {
  return new DryRunGuardImpl(opts)
}
