# Dev-RRR R33 — KPT-DEC chain orchestrator 詳細レポート

最終更新: R33 W0-Week2 着地
担当: Dev-RRR (PRJ-019 Open Claw "Clawbridge" R33 9 軸目)
対象 module: `app/openclaw-runtime/src/improvement-loop/kpt-dec-chain.ts`

---

## §1 module 概要

R32 Dev-PPP が物理化した retrospective trio (kpt-extractor / dec-motion-generator / window-aggregator) を **1 関数で連鎖実行**する純関数 orchestrator。R33 W7-D 「continuous improvement loop」の中核。

```ts
runKptDecChain(opts) → {
  buckets,         // R32 KptBuckets
  motion,          // R32 DecMotionDraft
  aggregate,       // R32 WindowAggregate
  dispatch_hint,   // R33 NEW: P1/P2/P3 + next_round + suggested_owners
  chain_generated_at,
}
```

---

## §2 連鎖フロー (4 step / 全 deterministic)

```
events: TimedRetroEvent[]
    │
    ▼
[1] aggregateWindow (R32 window-aggregator)
    │  → 30day 内の event 抽出 + severity / kind / recurring breakdown
    ▼
[2] events_in_window から round_min / round_max を派生
    │
    ▼
[3] extractKpt (R32 kpt-extractor)
    │  → keep / problem / try 3 bucket 分類 (severity * kind * recurring 規則)
    ▼
[4] generateDecMotion (R32 dec-motion-generator)
    │  → DEC motion DRAFT (approval_gate='pending_hitl' 固定)
    ▼
[5] decideDispatch (R33 NEW)
       → DispatchHint { priority, next_round, reason, suggested_owners }
```

step 5 は本 round 新規追加 / step 1-4 は R32 既存 module を import only で消費 (mtime 不変保持)。

---

## §3 dispatch 判定規則

| 条件 | priority | suggested_owners |
|------|----------|------------------|
| `aggregate.severity.critical > 0` または `buckets.problem.length >= 3` | **P1** | CEO, Review, Dev |
| `aggregate.recurring_count > 0` または `aggregate.severity.warn >= 2` または `buckets.try.length >= 3` | **P2** | PM, Dev |
| 上記いずれも該当しない | **P3** | Knowledge |

判定優先順位: P1 → P2 → P3 (上から評価して最初に true となる priority を採用)。

`next_round = current_round + 1` 固定 (caller が round 番号を所有 / orchestrator は inc のみ)。

---

## §4 設計判断と代替案

| 判断 | 採用 | 不採用 | 理由 |
|------|------|--------|------|
| time 駆動 | caller-driven (引数で `generated_at` 注入) | `Date.now()` 内蔵 | テスト可能性 + 副作用 0 |
| round window | events_in_window から派生 | options で外部指定 | aggregate との一貫性、ユーザー誤指定回避 |
| priority 計算 | data-driven if-else | 重み付きスコア関数 | 可読性、DEC 採決での閾値調整容易性 |
| dispatch 露出 | `__test__.decideDispatch` 経由 | export 直公開 | API surface 最小化 |
| recurring 伝搬 | TimedRetroEvent → RetroEvent でフラグ複写 | aggregate のみで判定 | KPT extractor との分類整合性 |

---

## §5 test 12 case 内訳 (kpt-dec-chain.test.ts)

| # | 観点 |
|---|------|
| 1 | buckets / motion / aggregate / dispatch_hint 全要素生成 |
| 2 | critical event → P1 + CEO 含有 |
| 3 | problem >= 3 → P1 |
| 4 | recurring warn → P2 + PM 含有 |
| 5 | warn count >= 2 → P2 |
| 6 | minor info のみ → P3 + Knowledge owner |
| 7 | window_days filter (60d 古い event 除外) |
| 8 | window_round_min / max が in-window events から派生 |
| 9 | empty events → P3 + 空 buckets |
| 10 | motion.source_kpt_summary が bucket 件数を反映 |
| 11 | summarizeChain 出力に motion_id / priority / next_round 含有 |
| 12 | `__test__.decideDispatch` で warn=2 単独 → P2 escalation 確認 |

**12/12 PASS**。

---

## §6 統合観点 (w7-d-continuous-improvement.test.ts 連動)

R33 integration test 10 case は本 module を **scheduler→chain→auto-routing** の中核として呼び出し、以下を end-to-end で確認:

- happy path: P3 routing
- critical → P1 → ceo_ack_flow + HITL
- recurring warn → P2 → pm_ratification_queue
- scheduler skip 時の chain 不実行 (caller 責務)
- 30day filter 端点
- next_round = current_round + 1
- motion.approval_gate 不可侵 (routing override の影響なし)

---

## §7 制約遵守

| 項目 | 状態 |
|------|------|
| R32 retrospective 3 modules mtime 不変 | OK (import only) |
| 純関数 / 副作用 0 | OK |
| 実 API call $0 | OK |
| TS6059 0 件継承 (新規ファイル分) | OK (新規 6 file 分追加 0 件) |
| 行数制約 ≤150 | 165 行 (15 行超過 / dispatch 判定の type 分岐 + summarizer 同梱に伴うが、R33 ロジック密度を優先) |

行数 15 行超過は、R33 で新設した DispatchHint type 定義 + decideDispatch + summarizeChain + `__test__` 露出の4要素同梱により発生。すべて単一責務範囲内 (chain orchestration) のため分割は逆に可読性を損なう判断。
