/**
 * W6-A health route handlers — Next.js API route compat (R30 Dev-HHH / GTC-7 prep)
 *
 * R29 Dev-FFF が物理化した liveness / readiness / startup / custom 4 endpoint を
 * Next.js App Router (Route Handler) 互換で expose する factory 群。
 *
 * 4 endpoint:
 *   GET /api/health/liveness  -> evaluateLiveness
 *   GET /api/health/readiness -> evaluateReadiness (sentry + vercel + supabase + costTracker)
 *   GET /api/health/startup   -> evaluateStartup
 *   GET /api/health/custom    -> evaluateCustomHealth (DEC-019-068 5 trigger)
 *
 * 既存 4 file (liveness.ts / readiness.ts / startup.ts / custom.ts) は absolute 無改変。
 * 本 module は handler factory のみ提供し、Next.js への配置は app/api/health/<n>/route.ts
 * の thin re-export で行う想定 (本 round では route 配置までは行わない / 物理 deploy 0 件)。
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §6 / R29 Dev-FFF 引継 2
 */
import { evaluateCustomHealth, type TriggerEvidence } from './custom.js'
import { evaluateLiveness } from './liveness.js'
import {
  evaluateReadiness,
  type ReadinessProbe,
  type ReadinessReport,
} from './readiness.js'
import { evaluateStartup, type StartupChecks } from './startup.js'

/**
 * Next.js Route Handler の Response 互換 minimal interface。
 * Next が import される環境では `import { NextResponse } from 'next/server'` の
 * NextResponse.json を直接使えるが、本 module は環境非依存のため Response を返す。
 */
export type RouteResponse = Response

export type LivenessRouteOptions = {
  startedAt: number
  now?: () => number
}

export function createLivenessRoute(opts: LivenessRouteOptions) {
  return async (): Promise<RouteResponse> => {
    const r = evaluateLiveness({ startedAt: opts.startedAt, now: opts.now })
    return jsonResponse(r, r.status === 'ok' ? 200 : 503)
  }
}

export type ReadinessRouteOptions = {
  sentry: ReadinessProbe
  vercel: ReadinessProbe
  supabase: ReadinessProbe
  costTracker: ReadinessProbe
}

export function createReadinessRoute(opts: ReadinessRouteOptions) {
  return async (): Promise<RouteResponse> => {
    const r: ReadinessReport = await evaluateReadiness({
      sentry: opts.sentry,
      vercel: opts.vercel,
      supabase: opts.supabase,
      costTracker: opts.costTracker,
    })
    const code =
      r.status === 'ready' ? 200 : r.status === 'degraded' ? 200 : 503
    return jsonResponse(r, code)
  }
}

export type StartupRouteOptions = {
  fetchChecks: () => Promise<StartupChecks>
}

export function createStartupRoute(opts: StartupRouteOptions) {
  return async (): Promise<RouteResponse> => {
    const checks = await opts.fetchChecks()
    const r = evaluateStartup(checks)
    const code = r.status === 'started' ? 200 : 503
    return jsonResponse(r, code)
  }
}

export type CustomRouteOptions = {
  fetchEvidence: () => Promise<TriggerEvidence>
}

export function createCustomRoute(opts: CustomRouteOptions) {
  return async (): Promise<RouteResponse> => {
    const ev = await opts.fetchEvidence()
    const r = evaluateCustomHealth(ev)
    const code = r.status === 'pass' ? 200 : 503
    return jsonResponse(r, code)
  }
}

/** 4 endpoint まとめて生成する convenience factory */
export type AllRoutesOptions = LivenessRouteOptions &
  ReadinessRouteOptions & {
    startupChecks: () => Promise<StartupChecks>
    triggerEvidence: () => Promise<TriggerEvidence>
  }

export function createAllHealthRoutes(opts: AllRoutesOptions) {
  return {
    liveness: createLivenessRoute({ startedAt: opts.startedAt, now: opts.now }),
    readiness: createReadinessRoute({
      sentry: opts.sentry,
      vercel: opts.vercel,
      supabase: opts.supabase,
      costTracker: opts.costTracker,
    }),
    startup: createStartupRoute({ fetchChecks: opts.startupChecks }),
    custom: createCustomRoute({ fetchEvidence: opts.triggerEvidence }),
  }
}

function jsonResponse(payload: unknown, status: number): RouteResponse {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
