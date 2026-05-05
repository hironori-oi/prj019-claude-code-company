# Web-Ops-S R32: portfolio v4 起票 (GTC-11 actual PASS 反映)

## 0. メタ情報

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 32 (9 並列 軸 3)
- 担当: Web-Ops-S
- 出力種別: portfolio v4 起票 spec (5 file 構成)
- 制約: date-free / T0''' 基点 / 副作用 0 / Owner 拘束 0 分 / 絵文字 0
- 継承: GTC-11 actual PASS (R32 別 file 2) / KPI 8/8 PASS / Stage 4 spec

## 1. portfolio v4 概要

PRJ-019 Open Claw "Clawbridge" を自社 HP の事業実績 (case study) として公開するための portfolio 第 4 版を起票。R32 時点では起票のみ (Stage 4c で hold release & 公開)。

## 2. portfolio v4 構成 5 file

### 2.1 file 1: case study (本文)
- 出力先 (R33 以降): `projects/COMPANY-WEBSITE/portfolio/prj-019-open-claw.md`
- 構成:
  - Hero: Open Claw "Clawbridge" タイトル + tagline
  - Challenge: 中小企業向け AI 連携基盤の DevOps 自動化課題
  - Approach: 9 並列 32 round 反復承認方式 (HITL 11 種) + KPT + ナレッジ蓄積
  - Solution: Clawbridge アーキテクチャ概要 (詳細は client confidential)
  - Result: KPI 5 軸 8/8 PASS / Owner 拘束 8 min / cost $42/月 (plan $50)
  - Tech stack: Next.js / Supabase / Vercel / AI SDK / Playwright
  - Timeline: T0 ～ T0''' + 30d (date-free 表記)
- ボリューム想定: 1500-2000 字 + 画像 5-7 枚

### 2.2 file 2: KPI evidence (定量実績)
- 出力先 (R33 以降): `projects/COMPANY-WEBSITE/portfolio/prj-019-kpi-evidence.md`
- 構成:
  - KPI 5 軸 8 metric の actual simulated values
  - Stage 4a/4b/4c progression chart (graph image)
  - cost actual vs plan ($42 vs $50, +16% 余裕)
  - incident 30d 累計 (critical 0 / warn 2 / info 18)
- ボリューム想定: 800-1200 字 + chart 4-5 枚
- 公開判断: client 許可後 (公開許可確認は CEO 経由 Owner 起票)

### 2.3 file 3: retrospective (KPT 公開版)
- 出力先 (R33 以降): `projects/COMPANY-WEBSITE/portfolio/prj-019-retrospective.md`
- 構成:
  - Keep 8 件抜粋 (公開可項目のみ)
  - Problem 3 件抜粋 (技術的課題、client 機密除外)
  - Try 5 件抜粋 (改善提案)
  - 学び: 9 並列 round 反復方式の有効性 / HITL 11 種のバランス / ナレッジ蓄積機構
- ボリューム想定: 1000-1500 字
- 公開判断: PII / 顧客情報 redaction 後 (ODR-OG-06 連動)

### 2.4 file 4: Owner testimonial slot (placeholder)
- 出力先 (R33 以降): `projects/COMPANY-WEBSITE/portfolio/prj-019-testimonial.md`
- 構成:
  - Owner からのコメント slot (R32 時点では placeholder)
  - 取得方法: Stage 4c 完遂後、CEO 経由で 10 分 interview 依頼 (Owner 拘束最小化)
  - 想定 quote: 「Owner action 累計 8 min で GA 達成、安心して任せられる体制」(仮)
- ボリューム想定: 200-400 字 + 顔写真 (任意 / opt-in)
- 公開判断: Owner 明示同意必須

### 2.5 file 5: public timeline
- 出力先 (R33 以降): `projects/COMPANY-WEBSITE/portfolio/prj-019-timeline.md`
- 構成:
  - Phase 0 (kickoff) → Phase 1 (W1〜W6) → Phase 2 → GA cutover → Stage 4 各 milestone
  - 32 round 反復承認の可視化 (簡略 graph)
  - DEC ID 引用 (DEC-019-001〜DEC-019-068 抜粋、公開可項目のみ)
- ボリューム想定: 600-900 字 + timeline graph 1 枚
- 公開判断: 機密 DEC redaction 後

## 3. 起票タスク (R32 完遂分)

| task | 状態 | 備考 |
|------|------|------|
| 5 file spec 確立 | 完遂 | 本書 §2 |
| 出力先 path 確定 | 完遂 | `projects/COMPANY-WEBSITE/portfolio/` |
| ボリューム想定 | 完遂 | 各 file 字数想定 |
| 公開判断条件 | 完遂 | 各 file 別 |
| hold release trigger | 設定済 | Stage 4c 完遂後 |
| 5 file 実体生成 | hold | R33 以降 (Stage 4c 完遂後) |
| client 許可確認 | hold | CEO 経由 Owner 起票必要 |
| Owner testimonial 取得 | hold | Stage 4c 完遂後 |

## 4. portfolio v3 → v4 差分

| 項目 | v3 (既存) | v4 (本書起票) |
|------|----------|---------------|
| 案件カバレッジ | PRJ-001〜PRJ-018 | PRJ-001〜PRJ-019 (Open Claw 追加) |
| KPI evidence | 数値あり | actual simulated 値追加 |
| retrospective | 簡略 | KPT 公開版追加 |
| testimonial | あり (PRJ-007 / 012) | PRJ-019 slot 追加 |
| timeline | 簡易 | 32 round 反復承認の可視化追加 |

## 5. SEO / アクセス改善要素 (v4 設計時組込)

- 構造化データ: schema.org/CreativeWork + schema.org/Project
- meta description: 「PRJ-019 Open Claw / 9 並列 32 round 反復承認 / KPI 8/8 PASS / Owner 拘束 8 min」
- 内部リンク: PRJ-007 / PRJ-012 / PRJ-016 既存 case study と相互リンク
- 画像 alt: 全画像 alt 必須、Heroicons は装飾 alt=""
- Core Web Vitals: LCP ≤ 2.5s / CLS ≤ 0.1 / INP ≤ 200ms 維持

## 6. ブランド管理 (デザイン指針遵守)

- AI 感を出さないクリーンなデザイン (CLAUDE.md 事業方針遵守)
- 絵文字 0 件
- アイコンは Heroicons のみ
- フォント: Geist Sans / Geist Mono
- カラー: 既存自社 HP トーン継承
- mobile-first responsive 必須

## 7. R33 引継 spec

| task | 担当 | 期 |
|------|------|-----|
| client 許可確認起票 | CEO 経由 Owner | R33 |
| 5 file 実体生成 | Web-Ops 部門 | Stage 4c 完遂後 |
| Owner testimonial interview | CEO + Web-Ops | Stage 4c 完遂後 |
| 公開判断 | Owner | Stage 4c 完遂後 |
| portfolio v4 デプロイ | Web-Ops 部門 | 公開判断後 |
| SEO 検証 | Web-Ops 部門 | デプロイ後 7d |

## 8. 副作用 0 確認

- 既存 absolute 4 file 無改変
- 物理 deploy 0 件 (起票 spec のみ、5 file 実体は R33 以降)
- API call $0
- date-free 厳守
- client 機密 / PII / 顧客情報の事前 redaction 計画組込済

## 9. 完遂宣言

R32 Web-Ops-S Task 4 (portfolio v4 起票) 完遂。5 file 構成 spec 確立 / 出力先 path 確定 / 公開判断条件確立 / R33 引継 spec 確立。
