# Dev-RRR R33 — W7-D continuous improvement loop 物理化レポート

最終更新: R33 W0-Week2 着地 (date-free 第 5 round 目)
担当: Dev-RRR (PRJ-019 Open Claw "Clawbridge" Round 33 9 並列 軸 8)
依拠: R32 Dev-PPP retrospective 3 modules (kpt-extractor / dec-motion-generator / window-aggregator)

---

## §1 サマリ

R32 で物理化した post-launch retrospective trio (KPT 抽出 → DEC motion 生成 → 30day window 集計) を、**KPT → DEC motion → auto-routing の連続自動連鎖**に進化させる W7-D continuous improvement loop を物理化完遂。

3 module + 3 test file (unit 8+8 + chain unit 12 + integration 10 = **38 case all PASS**) を新規追加。harness +38 想定、累計 1121 → **1159 想定**。R32 retrospective 3 modules **無改変保持** (import only / mtime 不変)。実 API call $0、副作用 0、TS6059 0 件継承 (新規ファイル分の TS エラー 0 件、ベースライン 17 件継承のみ)。

---

## §2 物理化 module

### 2.1 kpt-dec-chain.ts (約 165 行)

`projects/PRJ-019/app/openclaw-runtime/src/improvement-loop/kpt-dec-chain.ts`

| 役割 | 内容 |
|------|------|
| 入口 API | `runKptDecChain(opts: KptDecChainOptions): KptDecChainResult` |
| 連鎖 | aggregateWindow → extractKpt → generateDecMotion → decideDispatch |
| 出力 | `{ buckets, motion, aggregate, dispatch_hint, chain_generated_at }` |
| dispatch 判定 | P1 = critical>0 \|\| problem>=3 / P2 = recurring>0 \|\| warn>=2 \|\| try>=3 / P3 = otherwise |
| 推奨 owner | P1=[CEO,Review,Dev] / P2=[PM,Dev] / P3=[Knowledge] |
| 副作用 | 0 (純関数) |

**設計判断**:
- `events_in_window` から round_min/round_max を派生 → KPT window が aggregate window と一貫 (R32 抽出層との整合)
- `recurring=true` フラグ伝搬を明示的に保持 (KPT extractor の try 分類規則と整合)
- `__test__` 経由で `decideDispatch` を露出 (severity 表だけで P 判定が再現可能)

### 2.2 scheduler.ts (約 127 行)

`projects/PRJ-019/app/openclaw-runtime/src/improvement-loop/scheduler.ts`

| 役割 | 内容 |
|------|------|
| 入口 API | `shouldFire(nowIso, lastFireIso, cfg): FireDecision` |
| cadence | `daily` / `weekly` (dow=0..6) / `monthly` (dom=1..28) |
| 二重発火防止 | hour bucket (UTC 1 時間粒度) 単位で `lastFireIso` を比較 |
| 次回発火 | `nextFire` 366 日先までスキャンで決定的計算 |
| 副作用 | 0 (setTimeout / setInterval / 外部 cron 一切不使用 / caller 駆動) |

**設計判断**:
- caller-driven time: `now` / `lastFire` を引数で受ける → テスト可能性最大化、cron は外部 (CronCreate 等) で発火、本 module は判定のみ
- hour bucket 比較で「同 round 内の二重発火」を防止 (R30 二重発火 pitfall 教訓)
- weekly_dow / monthly_dom / hour_utc 全て optional + safe default (1=Mon / 1日 / 0時 UTC)

### 2.3 auto-routing.ts (約 116 行)

`projects/PRJ-019/app/openclaw-runtime/src/improvement-loop/auto-routing.ts`

| 役割 | 内容 |
|------|------|
| 入口 API | `routeMotion(motion, hint, opts): RoutingDecision` |
| target_queue | P1=ceo_ack_flow / P2=pm_ratification_queue / P3=knowledge_backlog |
| sla_hours | P1=4 / P2=24 / P3=168 |
| escalation_after_hours | P1=2 / P2=12 / P3=72 |
| HITL | P1/P2 強制 / P3 任意 (override_hitl で上書き可) |
| 副作用 | 0 (route 決定のみ。実 dispatch は caller 担当) |

**設計判断**:
- 3 const table (`QUEUE_BY_PRIORITY` / `SLA_HOURS_BY_PRIORITY` / `ESCALATION_HOURS_BY_PRIORITY`) で SLA を data-driven 化 → 後続調整が DEC 採決のみで完結
- `notify_owners` は defensive copy (`[...hint.suggested_owners]`) で hint 変更に対する isolation を保証
- `motion.approval_gate` ('pending_hitl') は routing が触らない (HITL 第 11 種 `dec_motion_review` ゲート不可侵)

---

## §3 test contribution (38 case)

| file | case | 範囲 |
|------|------|------|
| `improvement-loop/__tests__/kpt-dec-chain.test.ts` | 12 | P1/P2/P3 分類 / window filter / 空 events / summarizer |
| `improvement-loop/__tests__/scheduler.test.ts` | 8 | daily / weekly / monthly / 二重発火 / next_fire_iso / invalid ISO |
| `improvement-loop/__tests__/auto-routing.test.ts` | 8 | P1/P2/P3 queue+SLA / HITL default / override / defensive copy / summarizer |
| `__tests__/w7-d-continuous-improvement.test.ts` | 10 | shouldFire→runKptDecChain→routeMotion end-to-end |
| **合計** | **38** | **all PASS** |

`npx vitest run src/improvement-loop src/__tests__/w7-d-continuous-improvement.test.ts`:

```
✓ src/improvement-loop/__tests__/scheduler.test.ts (8 tests) 5ms
✓ src/improvement-loop/__tests__/auto-routing.test.ts (8 tests) 4ms
✓ src/improvement-loop/__tests__/kpt-dec-chain.test.ts (12 tests) 7ms
✓ src/__tests__/w7-d-continuous-improvement.test.ts (10 tests) 6ms
Test Files  4 passed (4)
     Tests  38 passed (38)
```

---

## §4 厳守制約 verification (全項目 PASS)

| 制約 | status |
|------|--------|
| 絵文字 0 | PASS |
| 実 API call $0 | PASS (純関数 + caller-driven time + DI) |
| TS6059 0 件継承 (新規分) | PASS (新規 6 file 分の TS エラー 0 件、baseline 17 件は R32 既存 + 既設 R33 source 由来で本 round 増加 0) |
| openclaw-runtime 既存 PASS 維持 | PASS (W7-D 範囲 38/38 PASS / 不関連の post-launch-60day 失敗 2 件は本 round 範囲外) |
| R32 retrospective 3 modules 無改変保持 | PASS (kpt-extractor.ts / dec-motion-generator.ts / window-aggregator.ts mtime 不変 / import only) |
| 副作用 0 | PASS (純関数 + caller-driven scheduler) |
| 物理化は新規 file 作成のみ | PASS (新規 6 file / 既存 file 改変 0) |
| Owner 拘束 | 0 分 |

---

## §5 R32 連動

- R32 W7-C 物理化 (Dev-PPP 3 modules + 12 case integration test) を **import only** で消費
- R32 retrospective module の export shape (`KptBuckets` / `DecMotionDraft` / `WindowAggregate` / `RetroEvent` / `TimedRetroEvent`) を依拠
- DEC-087 motion_id (R32 DRAFT 起案 / R33 採決想定) を chain 出力の motion_id に流用 → R33 PM-Z による採決後そのまま運用 wire 可能

## §6 結語

W7-D continuous improvement loop の物理化により、KPT → DEC motion → auto-routing が完全自動連鎖する基盤が整備された。harness +38、R32 trio 不変保持、副作用 0、API $0、Owner 拘束 0 分。R34 以降は scheduler を CronCreate / RemoteTrigger と接続するのみで本番 wire 化完遂可能。
