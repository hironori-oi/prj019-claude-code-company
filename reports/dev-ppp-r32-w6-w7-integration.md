# Dev-PPP R32 — W6+W7-A+W7-B+W7-C cross-module integration レポート

## 概要

R32 Round で物理化された 4 つの phase 成果物を横断する integration test を
12 case 追加した。全 case 純関数 + mock injection で構成し、実 API call $0
/ 副作用 0 / 既存 W6 helper 6 file mtime 不変を維持。

## 対象モジュール

- W6 wire (R30/R31 frozen): canary GO/NO_GO 信号 (W6WireSignal shape)
- W7-A dashboard skeleton (R31 Dev-LLL): KPI snapshot
- W7-B monitoring (R32 Dev-OOO): 実測 metrics shape (W7BMetrics)
- W7-C retrospective (R32 Dev-PPP): KPT extractor + DEC motion + window
  aggregator

## 統合戦略

W6 / W7-B の出力 shape を `TimedRetroEvent` adapter で正規化し、W7-C の
`aggregateWindow` → `extractKpt` → `generateDecMotion` →
`renderMotionMarkdown` パイプラインに流し込むことで、4 phase が end-to-end
で連動することを検証。

## 12 case 内訳

1. W6+W7-B 5 events を 30day window で集計
2. GO canary 3 件が KPT keep に分類されること
3. round window R31-R32 フィルタリング
4. DEC motion が pending_hitl gate を持つこと
5. motion Markdown が renderable
6. W6 stream 空でも graceful (kind.canary=0)
7. W7-B stream 空でも graceful (kind.harness=0)
8. critical W7-B errors (err>1%) → KPT problem に分類
9. custom window_days=3 で event 数が減少
10. window_start と window_end が window_days と一致
11. 同一 input で deterministic ordering を保証
12. motion title に bucket window 範囲がエンコード

## 制約遵守

- mock injection only (実 API call $0)
- W6 helper 6 file + R30/R31 wire 4 file mtime 不変 (import 経由参照のみ)
- 既存 dashboard/page.tsx line 1-113 absolute 不変
- TS6059 0 件継承 (strict typing 維持)
- 絵文字 0 / Owner 拘束 0 分

## 出力

- `app/openclaw-runtime/src/__tests__/w6-w7-integration.test.ts` (新規 12 case)

## harness 寄与 (重複なし)

- Dev-PPP R32 寄与: W7-C 3 module (kpt 7 + motion 6 + window 7 = 20 case) +
  cross-module integration 12 case = 32 case
- Dev-NNN R32 +39 / Dev-OOO R32 +33 / Dev-PPP R32 +32 = 累計 +104
- R31 想定 1017 + R32 寄与 +104 = R32 累計 1121 想定

## 次手 (R33 想定)

- 実 W6 wire export (R30/R31 frozen) を adapter 化して直接接続
- 実 W7-B kpi-collector を adapter 化して直接接続
- end-to-end smoke test (mock 5 round 連続 simulation)
- DEC-087 motion を ODR-OG ingestion パイプラインに connect
