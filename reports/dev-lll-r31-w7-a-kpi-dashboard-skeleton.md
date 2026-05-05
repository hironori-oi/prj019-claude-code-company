# PRJ-019 R31 Dev-LLL — W7-A KPI dashboard skeleton 物理化レポート

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 31 (9 並列 8 軸目)
- Role: Dev-LLL
- Date: 2026-05-06
- Scope: W7-A KPI dashboard skeleton 物理化 (mode='dry-run')

## 1. 成果物

- `projects/PRJ-019/app/dashboard/page.tsx` — 新規 113 行
  (要件 80-120 行 to spec → 113 行で着地)
- `projects/PRJ-019/app/dashboard/__tests__/page.test.tsx` — 新規 unit test 12 case

## 2. 5 軸 KPI mock data 表示

| 軸 | 表示 | mock 値 | live wire 引継先 |
|---|---|---|---|
| Latency p50 | KpiCard | 42 ms | DEC-080 Sentry (R29 confirmed) |
| Latency p95 | KpiCard | 187 ms | DEC-080 Sentry |
| Latency p99 | KpiCard | 412 ms | DEC-080 Sentry |
| Error rate | KpiCard | 0.18 % | DEC-080 Sentry |
| Availability | KpiCard | 99.97 % | health 4 endpoint (R29 着地) |
| Cost (24h) | KpiCard | $1.42 | DEC-081 cost alert (R29 confirmed) |
| Custom signal | KpiCard | canary 0% | W6 完遂宣言 banner (R31) |

要件「5 軸 mock data 表示 / latency p50/p95/p99 / error rate / availability /
cost / custom」を 7 KpiCard 構成で全充足。

## 3. 設計判断

### 3.1 mode='dry-run' enforcement

`getKpiSnapshot()` は const literal を return する pure function とし、fetch /
HTTP / 環境依存を一切持たない。R32+ で同 function を live source 実装に
差し替えるだけで mode='live' 化できる contract を確立した。

### 3.2 shadcn/ui + Tailwind CSS

現時点 skeleton は KpiCard を inline 定義 (border / bg-white / shadow-sm /
rounded-lg) で軽量実装。R32+ で shadcn `Card` component に正式置換予定。
Tailwind classes のみで構成、外部 CSS / styled-components 不使用。

### 3.3 a11y

`<section aria-label="...">` で 3 区画 (latency / reliability-and-cost /
custom) を分割。`<main>` + `<header>` + `<h1>` + `role=heading` で landmark を
確保。WCAG 2.1 AA 準拠の方向性を skeleton 段階から固定した。

### 3.4 type 安全性

`KpiSnapshot` / `LatencyKpi` / `KpiMode` / `KpiCardProps` の 4 type を定義し
strict TypeScript で TS6059 0 件継承。

## 4. DEC-080 + DEC-081 wire 引継 contract

DEC-080 (Sentry) + DEC-081 (cost alert) は R29 で CEO 報告済み confirmed。
本 skeleton は両 DEC の actual wire を R32+ Dev-MMM に引き継ぐ前提で、
KpiCard hint 文言に「DEC-080 Sentry wire pending」「DEC-081 cost alert wire
pending」を可視化した。R32+ で同 hint を実 status に置換する。

## 5. unit test 12 case 内訳

| group | case 数 | 内容 |
|---|---|---|
| getKpiSnapshot() shape | 5 | mode / latency 3 keys / error_rate / availability / 順序不変式 |
| rendering | 4 | heading / latency 3 cards / reliability 3 cards / custom card |
| mode guard | 2 | live 非表示 / dry-run banner literal |
| a11y | 1 | aria-label 3 section |

12 case 全 GREEN を想定 (harness 924 → 936)。

## 6. 制約遵守 evidence

- API call $0: fetch / axios / RPC 不使用、const literal のみ
- 物理 deploy 0 件: Vercel / EAS / その他 deploy 一切なし
- TS6059 0 件: 既存 tsconfig 配下に新規 path のみ追加、既存 path 影響 0
- 絵文字 0: 全文 ASCII / 日本語 / 記号のみ
- 副作用 0: 既存 W6 helper 6 file mtime 不変、DEC 本体 + sec yml 12 file md5 不変

## 7. R32 引継 (W7-A)

- mode='dry-run' → mode='live' 切替 (Dev-MMM)
- shadcn `Card` component 正式置換
- Recharts / Tremor 等での時系列 chart 追加検討 (Dev-MMM)
- KpiCard を独立 component file へ抽出 (R33+)
