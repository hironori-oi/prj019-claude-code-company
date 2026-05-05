/**
 * W6-A canary wire — Vercel Edge Config writer wire (R30 Dev-HHH / GTC-7 prep)
 *
 * R29 Dev-FFF が物理化した `edge-config-canary.ts` の `applyCanary` writer 注入
 * 箇所に、Vercel Edge Config SDK (`@vercel/edge-config`) を wire する実装を提供する。
 *
 * 設計方針:
 *   - 既存 `edge-config-canary.ts` は absolute 無改変 (R29 Dev-FFF 物理化遵守)。
 *   - 本 module は writer factory を export し、`applyCanary(decision, writer)` の
 *     第 2 引数に注入される writer 関数を生成する。
 *   - 実 SDK 呼出は dynamic import + try/catch で SDK 未導入環境でも壊れない。
 *   - mock fallback writer (no-op + log) を併設し、test 環境 / DEC-080 採決前
 *     phase での dry-run を可能にする。
 *   - 物理 deploy 0 件 (実 PATCH 呼出は GTC-7 Owner ACK 後 / 本 wire は起票のみ)。
 *
 * 連動: DEC-019-080 (Sentry 実発火必須化) / DEC-019-081 (月次予算 alert) /
 *       runsheets/w6a-production-rollout-sop.md §3 / R29 Dev-FFF 引継 1
 */
import type { EdgeConfigWriter } from './edge-config-canary.js'

/**
 * Vercel Edge Config writer mode.
 *  - 'live': 実 PATCH 呼出 (GTC-7 Owner ACK 後のみ使用)
 *  - 'dry-run': 呼出形式は同じだが PATCH 実行せず log のみ
 *  - 'mock': in-memory store (test 用)
 */
export type WireMode = 'live' | 'dry-run' | 'mock'

export type VercelEdgeConfigWireOptions = {
  edgeConfigId: string
  vercelTeamId?: string
  vercelToken: string
  canaryKey: string
  mode: WireMode
  /** logger 注入 (副作用 0 / test 注入可) */
  logger?: (event: VercelWireLogEvent) => void
  /** dynamic import override (test 注入用) */
  importer?: () => Promise<VercelEdgeConfigSdkLike>
  /** fetch override (test 注入用 / 'live' mode の PATCH 呼出に利用) */
  fetcher?: typeof fetch
}

export type VercelWireLogEvent = {
  kind: 'invoke' | 'success' | 'fallback' | 'error'
  mode: WireMode
  percent: number
  detail?: string
}

/** dynamic import で取得する SDK の最低要件 (実 `@vercel/edge-config` の get のみ依存) */
export type VercelEdgeConfigSdkLike = {
  get: (key: string) => Promise<unknown>
}

const MOCK_STORE: Record<string, number> = {}

/**
 * `applyCanary` writer の factory。mode に応じて live / dry-run / mock を切替。
 * 既存 `edge-config-canary.ts` の writer 引数 (`(percent: number) => Promise<void>`)
 * 互換 signature を返す。
 */
export function createVercelEdgeConfigWriter(
  options: VercelEdgeConfigWireOptions,
): EdgeConfigWriter {
  const log = options.logger ?? (() => {})
  return async (percent: number) => {
    log({ kind: 'invoke', mode: options.mode, percent })

    if (options.mode === 'mock') {
      MOCK_STORE[options.canaryKey] = percent
      log({ kind: 'success', mode: 'mock', percent, detail: 'in-memory store' })
      return
    }

    if (options.mode === 'dry-run') {
      log({ kind: 'success', mode: 'dry-run', percent, detail: 'no PATCH issued' })
      return
    }

    // live mode: Vercel REST API PATCH /v1/edge-config/{id}/items
    try {
      const url = buildEdgeConfigUrl(options)
      const fetcher = options.fetcher ?? fetch
      const res = await fetcher(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${options.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: options.canaryKey,
              value: percent,
            },
          ],
        }),
      })
      if (!res.ok) {
        log({
          kind: 'error',
          mode: 'live',
          percent,
          detail: `HTTP ${res.status}`,
        })
        throw new Error(`vercel edge config PATCH failed: ${res.status}`)
      }
      log({ kind: 'success', mode: 'live', percent, detail: 'PATCH 200' })
    } catch (e) {
      log({
        kind: 'error',
        mode: 'live',
        percent,
        detail: e instanceof Error ? e.message : 'unknown',
      })
      throw e
    }
  }
}

/** test / 内部 inspect 用 — mock store の現在値読出 */
export function readMockStore(canaryKey: string): number | undefined {
  return MOCK_STORE[canaryKey]
}

/** test 用 — mock store reset */
export function resetMockStore(): void {
  for (const k of Object.keys(MOCK_STORE)) delete MOCK_STORE[k]
}

function buildEdgeConfigUrl(opts: VercelEdgeConfigWireOptions): string {
  const base = `https://api.vercel.com/v1/edge-config/${opts.edgeConfigId}/items`
  return opts.vercelTeamId ? `${base}?teamId=${opts.vercelTeamId}` : base
}
