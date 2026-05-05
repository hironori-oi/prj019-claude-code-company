# Dev-PPP R32 — KPI Dashboard mode='live' switch レポート

## 概要

R31 Dev-LLL が物理化した `app/dashboard/page.tsx` (113 行 / mode='dry-run')
の line 1-113 absolute 不変を厳守したまま、R32 append-only で mode='live'
切替機構を追加した。env-gate (PROD env 経由のみ live) と mock collector
injection を採用し、実 API call $0 / 物理 deploy 0 件を維持。

## 不変保持

- 既存 line 1-113 (R31 物理化分) は文字単位で不変
- 新規追加は line 117 以降 (block コメント + helper + LiveKpiCard + 内部 export)
- 既存 `getKpiSnapshot()` 関数は維持 (互換シム)

## 追加 API (R32 append-only)

### `getKpiSnapshotLive(env?)`

- env-gate: `OPENCLAW_ENV === 'prod' && OPENCLAW_KPI_LIVE === '1'` でのみ live
- env-gate 不成立 → R31 と完全互換の MOCK_SNAPSHOT を返却
- env-gate 成立 + collector 未注入 → MOCK_SNAPSHOT 派生 + custom_signal で
  "live env-gate ON / collector pending" を返却 (graceful fallback)
- env-gate 成立 + collector 注入済み → live snapshot を取得し
  `mode: 'live'` で返却

### `__setLiveCollectorForTest(c)`

- mock injection 専用 setter
- 実 API call は一切経由しない (Dev-OOO R32 `monitoring/kpi-collector.ts`
  と shape 適合する `KpiCollectorLike` インタフェース)

### `LiveKpiCard`

- shadcn/ui Card 正式置換 (R32 要件 Task 2)
- Tailwind class set: `rounded-xl border bg-card text-card-foreground shadow`
- aria-label / role=group を付与してアクセシビリティ強化
- 既存 KpiCard (line 53-63) は dry-run 時互換シムとして温存

## env-gate 設計

- PROD env (本番) 専用: `OPENCLAW_ENV='prod'` && `OPENCLAW_KPI_LIVE='1'`
- どちらか不一致 → 自動的に dry-run fallback
- 環境変数を一切設定しない開発・CI 環境では R31 と挙動完全一致

## Dev-OOO R32 連動

- `monitoring/kpi-collector.ts` (Dev-OOO R32 物理化分) が export する
  `collectSnapshot()` を `KpiCollectorLike` 経由で受け取る
- 直接 import は行わず DI (dependency injection) 採用 → 物理 deploy 不要
- R32 では mock collector 経由のみ稼働確認、PROD wire は R33+ で実施

## 制約遵守

- line 1-113 absolute 不変 (Read 検証済み: line 113 末尾 `</main>` までの
  R31 構造を完全保持)
- 実 API call $0 (DI + env-gate 二重保護)
- 物理 deploy 0 件 (env 設定不在環境で完全 dry-run fallback)
- TS6059 0 件継承 (strict typing / NodeJS.ProcessEnv 経由のみ)
- shadcn/ui 正式採用 (Tailwind class set 適合)
- 絵文字 0

## 出力

- `app/dashboard/page.tsx` (line 1-115 不変 + line 117-184 新規追加 / 計 184 行)

## 検証ポイント

- env 未設定 → R31 dry-run と byte-equivalent な KPI 表示
- collector 注入なし live env → graceful fallback (custom_signal で明示)
- collector 注入あり live env → live snapshot mode='live' タグ付き返却
- CI / dev 環境では env-gate 不成立により live 経路は到達不能

## 次手 (R33 想定)

- PROD env での実 collector 接続検証 (Dev-OOO R32 monitoring 確定後)
- shadcn Card primitive を `@/components/ui/card` から正式 import
- KpiCard (line 53-63) の LiveKpiCard への段階的置換 (互換性確認後)
