# Dev-FFF R29 — W6-A health-check API 4 endpoints 物理化 impl 報告

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R29 Dev-FFF (18 件目 dev sprint)
連動 DEC: DEC-019-068 (5 trigger evidence) / DEC-019-074 / 080 (DRAFT)
連動 runsheet: `runsheets/w6a-production-rollout-sop.md` §6 health probe

---

## §1 物理化 file

| file | 行数 | endpoint |
|---|---|---|
| `app/openclaw-runtime/src/health/liveness.ts` | 25 | /health/liveness — process 応答可否のみ |
| `app/openclaw-runtime/src/health/readiness.ts` | 47 | /health/readiness — 4 dep 集約 (sentry/vercel/supabase/cost-tracker) |
| `app/openclaw-runtime/src/health/startup.ts` | 30 | /health/startup — config/migration/warmup |
| `app/openclaw-runtime/src/health/custom.ts` | 38 | /health/custom — DEC-068 5 trigger evidence 検査 |
| `app/openclaw-runtime/src/health/__tests__/health-check.test.ts` | 124 | 12 cases (3 per endpoint) |
| **合計** | **264** | - |

## §2 設計要点

- **probe 4 種分離**: Kubernetes / Vercel が想定する liveness / readiness / startup 3 標準 probe + custom (5 trigger) を独立関数化、role-of-concern を分離。
- **dependency 注入**: readiness は `ReadinessProbe` 型 callback 4 個を注入、実 API call は本 module 外で実装、unit test では mock で置換可能。
- **status 階層**: ready (全 up) / degraded (一部 degraded) / not_ready (1 つでも down) の 3 段階。canary forward は ready のみで許容、SOP §6.2 の gate 条件を型レベルで保証。
- **custom endpoint = DEC-068 5 trigger gate**: t1-t5 evidence boolean 5 個入力、failingTriggers list 出力、canary `triggerEvidenceOk` 入力源として直接連動。
- **liveness は依存 0**: process が応答するだけで ok、外部 service 状態は readiness に委譲、Kubernetes liveness probe 仕様準拠。

## §3 test cases (12 cases)

| endpoint | case | 期待 |
|---|---|---|
| liveness | uptime>0 | status=ok / uptimeMs=4000 |
| liveness | clock skew | uptimeMs=0 (clamp) |
| liveness | ISO timestamp | 1970-01-01T00:00:00.000Z |
| readiness | 全 up | status=ready |
| readiness | 1 down | status=not_ready / vercel=down |
| readiness | degraded のみ | status=degraded |
| startup | 全 pass | status=started / pendingItems=[] |
| startup | 2 件 pending | pendingItems=['migration','warmup'] |
| startup | config 不足 | pendingItems contains 'config' |
| custom | 全 5 pass | status=pass / satisfied=5 |
| custom | t3 fail | status=fail / failingTriggers=['t3'] |
| custom | 全 fail | satisfied=0 / 5 trigger 列挙 |

## §4 制約遵守

| 制約 | 遵守 status |
|---|---|
| 既存 absolute 4 file 無改変 | **達成** (新規 dir `health/` 配置) |
| TS6059 0 件維持 | **達成** (composite topology 継承 / 新規 dir のみ) |
| API call $0 | **達成** (probe callback 注入で実 API 未呼出) |
| 副作用 0 | **達成** (純粋評価関数のみ) |
| 物理 deploy 0 件 | **達成** |
| 絵文字 0 | **達成** |

## §5 R30 引継

- 4 endpoint を Next.js API Route または Vercel Edge Function に wire する route handler 4 件 (各 30-50 行) を R30 で物理化想定。
- 実 sentry / vercel / supabase / cost-tracker probe 実装 4 件 (各 30-80 行) は R30 + GTC-11 D-Day で wire。

---

**SOP 順守**: 副作用 0 / 既存 absolute 4 file 無改変 / API call $0 / 絵文字 0 / TS6059 0 件 / 物理 deploy 0 件 / fix forward-only / 報告 200 行以内厳守。
