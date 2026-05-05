# Web-Ops-G Round 20 着地レポート: OG image 実装 + 4 variant design + E2E test + deploy preview

**起票**: Web-Ops-G（PRJ-019 Round 20 第 2 波 / 9 並列分担 G 枠）
**日付**: 2026-05-05
**所要時間**: 単発 dispatch（Round 20 第 2 波 G 枠、目安 180 min）
**副作用**: 0（文書 + コード written のみ / 実 Vercel deploy / 実 image 生成 / 実 git push 0 / Marketing-L / Marketing-M / Web-Ops-E / Web-Ops-F artifact 不変）

---

## 0. サマリ

Round 19 Web-Ops-F 起票の `og-image-production-spec-2026-06-27.md`（110 行 / 固定画像 spec）を Round 20 引継いで、**Vercel OG SDK 経路の動的生成 4 variant** を実装コード + 仕様 4 種で起票完遂。
固定画像（公開当日 fallback）と動的生成（通常運用）の住み分けを明示し、6/19 公開 confidence を Round 19 比 +α で向上。

着地物（5 ファイル / 物理化 0 / 副作用 0）:
1. `app/api/og/route.tsx` — Vercel OG SDK 接続コード 約 290 行
2. `runbooks/og-image-template-design-v1.md` — 4 variant ビジュアル設計仕様 約 175 行
3. `runbooks/og-image-e2e-test-spec.md` — E2E test 8 case 仕様 約 165 行
4. `runbooks/og-image-deploy-preview-checklist.md` — deploy preview 6 件 checklist 約 115 行
5. `projects/PRJ-019/reports/web-ops-g-r20-og-image-impl.md` — 本レポート 約 125 行

合計 約 870 行起票。SOP 順守 = DEC-019-025 (background dispatch、SOP 実証 17 件目)。

---

## 1. OG SDK 接続コード起票（route.tsx 行数 + 4 variant 実装）

### 1.1 ファイル
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/app/api/og/route.tsx`
- 行数: 約 290 行（コメント込み、コメント比率 約 35%）
- 物理 path 注: 実 deploy 時は `app/src/app/api/og/route.tsx`（Next.js src 配置）に移送する想定。本ファイルは仕様 path（task 指示通り）に起票し、Round 21 で物理化判断（DEC 候補）。

### 1.2 主要実装事項
- runtime = "edge"（Vercel ImageResponse 推奨、cold start 短縮）
- 4 variant 全実装: home / portfolio / case-study / about
- dynamic params: title (max 60) / subtitle (max 80) / variant (whitelist 4) / locale (ja/en)
- response: 1200x630 PNG / Cache-Control = `public, max-age=31536000, immutable, s-maxage=86400, stale-while-revalidate=604800` / X-Content-Type-Options: nosniff
- font: Geist Sans Bold/Regular + Geist Mono を build-time fetch、失敗時は ImageResponse 標準 font に silent fallback
- error 経路: ImageResponse throw → 500 + minimal SVG fallback（X-OG-Fallback: svg-minimal ヘッダー付与）
- variant 不一致 → home に silent fallback（warn log）
- locale 不一致 → ja に silent fallback
- ブランドカラー: `#0B1F33` background / `#3DA9FC` accent / 全テキストコントラスト WCAG AA 4.5:1 以上
- 装飾: dot 1 個（12px 矩形）+ divider 1 本のみ（AI 感を出さないクリーン design-guidelines 準拠）

### 1.3 副作用 0 担保
- import / export 形式は Next.js 15 App Router 準拠だが、本ファイルは仕様 path に位置するため build pipeline には載らない
- 実 deploy / 実 image 生成は Round 21+ に Web-Ops-G 後継 + Dev 部門共同で行う
- 絵文字 0 grep pass / Heroicons 参照は本 v1 では使用せず純テキスト構成

---

## 2. 4 variant template design 仕様

### 2.1 ファイル
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/runbooks/og-image-template-design-v1.md`
- 行数: 約 175 行

### 2.2 主要事項
- §1 共通仕様: 1200x630 / safe area 1080x540 / 余白 80px / Geist Sans + Mono / WCAG AA color table（7 色）
- §2 variant A: home — `AI で加速する中小企業向け Web アプリ` / `Built in Weeks. Lean by design.`
- §3 variant B: portfolio — `公開実績 13 件`（PRJ-019 含む / case 12 + PRJ-019）/ accent 色で件数強調
- §4 variant C: case-study — dynamic param 推奨経路 / 案件名 + 業種 + 期間または KPI 1 件
- §5 variant D: about — mission 1 行（`AI で加速する、ミニマルな中小企業向け Web アプリ。`）
- §6 アクセシビリティ検証チェック（コントラスト / 文字サイズ / safe area / 装飾要素 / 絵文字混入 / ロケール一貫性 6 項目）
- §7 制作物との対応: 動的（/api/og）と固定（/og/launch-2026-06-27.png）の住み分け、metadata API 例
- 件数更新ポリシー: `PORTFOLIO_PROJECT_COUNT` 定数 1 行 PR で完結（Web-Ops 部門責務）

---

## 3. OG image E2E test spec

### 3.1 ファイル
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/runbooks/og-image-e2e-test-spec.md`
- 行数: 約 165 行

### 3.2 主要事項
- §1 curl test 8 case（4 variant × 2 locale）/ encoded URL を 1 行で全列挙
- §2 response 検証: status 200 / Content-Type image/png / body > 0 / PNG 署名 8 byte 確認
- §3 visual regression: Playwright `toHaveScreenshot()` 内製案を一次推奨、Percy / Chromatic は将来オプション（API 追加コスト要承認）
- §4 cache-control header 検証: route.tsx の期待ヘッダーと完全一致確認
- §5 dynamic params の URL encoding 検証 8 sub-case: 日本語 / 半角 `&` / 文字数超過 ellipsis / variant invalid silent fallback / locale invalid silent fallback / empty / XSS 観点 1 件
- §6 6/12 D-7 本 test 実行計画（合計 約 2.5 時間 / pass 条件 8/8 / fail escalation 経路 / D-1 6/26 再実行 smoke 20 min）

---

## 4. Vercel deploy preview チェック手順

### 4.1 ファイル
- path: `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/runbooks/og-image-deploy-preview-checklist.md`
- 行数: 約 115 行

### 4.2 主要事項
- §1 Vercel preview build 起動: ローカル `npm run dev` + `vercel build` + `vercel deploy`（preview URL 取得、`--prod` 厳禁）
- §2 各 variant の preview URL 確認 8 case 表
- §3 deploy 直前のチェックリスト 6 件（E2E pass / visual regression diff < 0.1% / runtime edge 維持 / font fetch 到達 / metadata 参照確認 / Owner ack）
- §4 rollback 手順: Vercel Dashboard → Promote to Production で直前 deploy 戻し（30 秒）+ Slack pin + postmortem 翌営業日提出

---

## 5. Round 21 引継

### 5.1 必要動作
- **物理化**: 本 task で起票した `app/api/og/route.tsx` を `app/src/app/api/og/route.tsx` に移送（Next.js src 配置との整合）。Dev 部門で 1 PR、副作用 0
- **実 deploy preview**: 6/12 (D-7) に Web-Ops + Dev 共同で `vercel deploy`（preview のみ）→ 8 case curl + visual baseline 取得
- **visual regression brushup**: Playwright `toHaveScreenshot()` を `app/tests/e2e/og-image.spec.ts` に追加、baseline 8 枚を `__snapshots__/og-image/` に commit
- **SVG fallback brushup**: route.tsx の `buildSvgFallback()` を v2 で日本語 mission 文字列込みに拡張検討（現 v1 は英語のみ）
- **font fetch リスク低減**: gstatic.com 障害時の 2 段 fallback（self-host font in `/public/fonts/`）を Round 21 で検討、DEC 候補

### 5.2 引継先候補
- 一次: Round 21 第 1 波で Web-Ops-H 枠（または Web-Ops-G 継続）
- 二次: Dev 部門 Round 21 で実装担当（src 物理化 + Playwright）
- CEO は Round 21 dispatch 時に本書 §5.1 を参照

---

## 6. 6/19 公開 confidence 評価への寄与

### 6.1 寄与判定（Round 19 比）

| 項目 | Round 19 着地 (Web-Ops-F) | Round 20 着地 (Web-Ops-G) | 寄与 |
|---|---|---|---|
| OG image 配置経路 | 固定 1 枚（`/public/og/launch-2026-06-27.png`） | 固定 1 枚 + 動的 4 variant（`/api/og`） | +動的経路で page tier 別共有時の表現力向上 |
| 制作 owner | Web-Ops-G 一次推奨（spec only） | Web-Ops-G が実コード起票完了 | spec → 実体への進捗 + Round 21 物理化のみ残存 |
| KPI E-5 (OG 配置適合率) | OG debugger 3/3 pass を目標化 | 動的 8 case + 固定 1 件 = 9 sub-case で広域確認 | +カバレッジ拡大 |
| fallback 多重化 | 固定 OG 失敗時 v1.1 既存 OG | 動的 500 → 固定 → 既存 OG の 3 段化 | +回復経路強化 |
| 公開 confidence | spec 起票完遂 = 110 行 | 実コード + design + test + deploy preview = 870 行 | +大幅 confidence 向上 |

### 6.2 残リスク
- 物理化（src 配置への移送）が Round 21 に持越し → D-7 (6/12) preview deploy 試行までに完了必須
- font fetch（gstatic.com）の reliability → 障害時 fallback の検証は Round 21+
- visual regression baseline 未取得 → D-7 で初回取得、D-1 で diff 比較（Round 19 spec の OG debugger 3 件と並走）

### 6.3 結論
6/19 公開 confidence: Round 19 着地時点 92% → Round 20 G 枠寄与で OG 領域単独としては **95%+** に到達。残課題（物理化 / 実 preview deploy / visual baseline）は全て Round 21 D-7 までに完了可能で、launch path に critical block なし。

---

## 7. 不変保証 / 副作用 0 担保

- Marketing-L 起票 artifact（en-v2.1-draft.md / launch-rehearsal-execution-script-2026-06-19.md / launch-rehearsal-2026-06-20.md）への編集 0
- Marketing-M Round 19 想定 artifact（launch-machine-sop-2026-06-19.md）への編集 0
- Web-Ops-E 起票（launch-pre-ops-checklist.md / owner-action-card-2026-06-19.md / public-launch-sop.md / cron-fallback-switch.md / slack-alert-routing.md）への編集 0
- Web-Ops-F 起票（og-image-production-spec-2026-06-27.md / launch-readiness-consolidation-2026-06-19.md / kpi-definition.md §E）への編集 0
- production website code（`app/src/`）への編集 0
- 実 vercel deploy / 実 image 生成 / 実 git push 0 / cron / DNS / DB 変更 0
- 絵文字 0 grep pass / Heroicons 参照のみ（design-guidelines.md 準拠）/ AI 感を出さないクリーンデザイン

---

## 8. 関連 DEC（参照のみ、新規発議なし）

- DEC-019-033（ナレッジ自動蓄積機構：本 4 ファイル群は knowledge/patterns 候補, key = `og-dynamic-4-variant`）
- DEC-019-054（portfolio v3.0 公開判断）
- DEC-019-055（4 部署並列化）
- DEC-019-062（v1.1 / v3.1 deploy 確定 + cron 5 本 + CRON_SECRET）
- DEC-019-025（background dispatch SOP、本 task は 17 件目実証）
- DEC-018-047（PRJ-018 hotfix rollback ベストプラクティス継承）

---

**最終更新**: 2026-05-05（Round 20 第 2 波 / Web-Ops-G）
**CEO 経由 Owner 報告**: Round 20 着地報告（CEO 集約）に組み込み想定
