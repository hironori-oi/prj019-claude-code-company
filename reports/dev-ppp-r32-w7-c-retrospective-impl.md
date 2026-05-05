# Dev-PPP R32 — W7-C post-launch retrospective 物理化レポート

## 概要

PRJ-019 Open Claw "Clawbridge" Round 32 9 並列の 9 軸目 (Dev-PPP) として、
W7-C post-launch retrospective module 3 本を物理化した。R30 Dev-JJJ が策定した
spec を消化し、純粋関数 module として TS6059 0 件継承で実装。副作用 0 / 実 API
call $0 / Owner 拘束 0 分 / fix forward-only を満たす。

## 物理化 module

### 1. kpt-extractor.ts (≤150 行 / 実 142 行)

- 絶対パス: `projects/PRJ-019/app/openclaw-runtime/src/retrospective/kpt-extractor.ts`
- 役割: RetroEvent stream を Keep / Problem / Try の 3 bucket に分類
- 主要 export:
  - `RetroEvent` (round, kind, severity, summary, recurring?)
  - `KptItem` (category, weight, source_event, rationale)
  - `KptBuckets` (keep[], problem[], try[], window meta)
  - `extractKpt(events, options)` — main entry
  - `summarizeKpt(buckets)` — deterministic 1 行サマリ
- 分類ルール:
  - severity=critical → problem (kind 不問)
  - kind=pitfall → problem
  - severity=warn && recurring=true → try
  - kind=dec && severity!=warn → keep
  - kind=harness && severity=info → keep
  - kind=canary && severity=info → keep
  - kind=alert → severity に応じて try/problem
  - その他 → try
- 順序付け: weight desc → round asc (deterministic)
- 重み: info=1 / warn=2 / critical=3

### 2. dec-motion-generator.ts (≤120 行 / 実 116 行)

- 絶対パス: `projects/PRJ-019/app/openclaw-runtime/src/retrospective/dec-motion-generator.ts`
- 役割: KptBuckets → DEC-087 retrospective motion draft
- 主要 export:
  - `DecMotionDraft` (motion_id, title, context, decision, consequences,
    source_kpt_summary, generated_at, approval_gate)
  - `generateDecMotion(buckets, options)` — main entry
  - `renderMotionMarkdown(draft)` — DEC ファイル投入用 Markdown 生成
- 制約: `approval_gate: 'pending_hitl'` を必ず付与し、auto-merge 不可とする
- max_items_per_bucket option (default 5) で爆発防止
- 空 window 時は "No actionable items in window — motion is informational
  only" を consequences に明記

### 3. window-aggregator.ts (≤140 行 / 実 132 行)

- 絶対パス: `projects/PRJ-019/app/openclaw-runtime/src/retrospective/window-aggregator.ts`
- 役割: TimedRetroEvent stream の rolling window aggregation (default 30 日)
- 主要 export:
  - `TimedRetroEvent` (RetroEvent + occurred_at: ISO-8601)
  - `WindowAggregate` (window_start, window_end, severity/kind breakdown,
    unique_rounds, recurring_count, events_in_window)
  - `aggregateWindow(events, options)` — main entry
  - `summarizeAggregate(agg)` — deterministic 1 行サマリ
- 時間計算は `Date.parse` のみ使用 (外部 lib 不採用)
- 不正 ISO / window_days≤0 で例外を投げる (defensive)
- ordering: occurred_at asc → round asc (deterministic)

## DEC-087 retrospective 動議自動生成

- KPT 抽出 → motion 生成 → Markdown render の 3 stage パイプライン
- HITL 承認前は `pending_hitl` ゲート固定 (Owner 拘束 0 分原則維持)
- 既存 ODR-OG ingestion へは Markdown export 経由で接続予定 (R33+)

## 30day window 集計

- Default 30 日窓 / 任意 window_days 指定可 (cross-module integration test
  で 7 日窓も検証)
- severity / kind の crosstab を返却し、dashboard live wire (Task 2) と
  retrospective DEC motion (Task 1) の双方で再利用

## 制約遵守

- 副作用 0 (純関数のみ / fs / network 接続なし)
- TS6059 0 件継承 (strict typing / 外部依存 import なし)
- 既存 W6 helper 6 file + R30/R31 wire 4 file mtime 不変
- DEC 本体 + sec yml 12 file md5 31 round 不変
- 絵文字 0 / Owner 拘束 0 分 / fix forward-only

## 出力

- `app/openclaw-runtime/src/retrospective/kpt-extractor.ts` (新規 142 行)
- `app/openclaw-runtime/src/retrospective/dec-motion-generator.ts` (新規 116 行)
- `app/openclaw-runtime/src/retrospective/window-aggregator.ts` (新規 132 行)
- `app/openclaw-runtime/src/retrospective/__tests__/kpt-extractor.test.ts` (7 case)
- `app/openclaw-runtime/src/retrospective/__tests__/dec-motion-generator.test.ts` (6 case)
- `app/openclaw-runtime/src/retrospective/__tests__/window-aggregator.test.ts` (7 case)

## 次手 (R33 想定)

- DEC motion Markdown を ODR-OG ingestion パイプラインに connect
- 実 round event を W6/W7-A/W7-B stream から adapter で取り込む
- live snapshot の retrospective 連動 (1 hour 周期)
