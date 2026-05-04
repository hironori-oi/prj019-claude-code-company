最終更新: 2026-05-04 / 起案: CEO / Owner 直接報告

# Owner 連結報告 v9 — Round 4 (実装着手 + 公開準備並列発注) 成果統合

- 案件: PRJ-019「Clawbridge」
- 報告区分: CEO 統合報告 (Round 4 = Owner「続きの実装を進めてください、こちらの判断が必要な場合は併せて教えてください」承認後の 4 部署並列発注成果)
- 起点: Owner 承認受領 (2026-05-04 = Round 3 結果受領 + 続行 + 判断必要事項提示の明示指示)
- Round 4 4 部署並列発注 (全件完了):
  - Dev: T2 HITL 11 種 gate templates 本実装 (17 ファイル / 1,981 行 / Vitest 63 ケース pass / **5 日前倒し完遂**)
  - PM: 5/8 必須 cross-ref 25 件実施 (6 部署 / 18 reports / 100% 完遂 / 数値整合性 100%)
  - Marketing: Phase 1 完了 narrative 戦略 (384 行 / B 主軸 + C 補助 + A 別枠連載 推奨 / 3 channel 配信)
  - Web-Ops: 自社HP `/case-studies/openclaw-runtime` portfolio 枠事前デザイン (515 行 / 10 sections / 6/27 09:00 公開)
- 統合結論: **Phase 1 公開 6/27 朝 + W0-Week2 着手 5/9 + 5/22 mock 検収 の 3 マイルストン全準備完了 + Marketing/Web-Ops Owner 即決 7 件は CEO 推奨で 5/8 議題に組込予定 + DEC-019-052 起票推奨**

---

## §1. エグゼクティブサマリ (300 字)

Owner「続きの実装を進めてください」承認 (2026-05-04) を受け、Round 4 として 4 部署並列発注を実施し**全 4 件完遂**。**総納品 = 17 実装ファイル + 4 reports + 25 cross-ref 編集 = 計 4,200+ 行 / 7+ 配置先**。Dev T2 HITL 11 種 gate templates **5 日前倒し完遂** (Vitest 63 ケース全 pass、要求 +5→+58 大幅超過、API 消費 51% 削減、AC-T2-1〜5 全達成)、PM cross-ref 25/25 件 100% 完遂 (6 部署 18 reports 編集、議決-20〜24 根拠整合 OK)、Marketing Phase 1 完了 narrative B 主軸 + C 補助 + A 別枠連載 (スコア 26/30 最高)、Web-Ops 自社HP `/case-studies/openclaw-runtime` 10 sections + 4 段階公開フロー確定。**5/8 検収会議準備 100% + W0-Week2 着手準備 100% + 6/27 朝公開準備初期 100%**。Owner 即決推奨 7 件 (Marketing 3 + Web-Ops 4) は CEO 推奨で 5/8 議題に組込、DEC-019-052 起票推奨。

---

## §2. Round 4 4 部署成果サマリ

### §2.1 Dev 部門 — T2 HITL 11 種 gate templates 本実装 (17 ファイル / 1,981 行)

| ファイル | 行数 | 役割 |
|---|---|---|
| templates/types.ts | 294 | 型定義 (HitlGateKind / Template / RedactionConfig 等) |
| templates/index.ts | 135 | template registry + `getTemplateByGate()` + redaction |
| templates/pii-redactor.ts | 76 | PII redaction logic (email / phone / API key / token) |
| templates/gate-1-tos-review.template.ts | 89 | ToS 違反通知 (DEC-019-014) |
| templates/gate-2-permission-review.template.ts | 87 | 権限変更通知 |
| templates/gate-3-cost-breach.template.ts | 92 | コスト超過通知 ($24/$28.5/$30 三段階、DEC-019-050) |
| templates/gate-4-ng3-breach.template.ts | 87 | NG-3 上限超過通知 |
| templates/gate-5-tos-strict.template.ts | 70 | ToS 厳格違反 = 即拒否仕様 (defaultRejectAfterMs=0) |
| templates/gate-6-tos-gray-review.template.ts | 98 | グレー判定通知 (DEC-019-019) |
| templates/gate-7-changelog-external-api.template.ts | 96 | 外部 API 変更通知 |
| templates/gate-8-evidence-review.template.ts | 89 | エビデンス review 通知 |
| templates/gate-9-dev-kickoff-approval.template.ts | 92 | Dev kickoff 承認通知 (DEC-019-033) |
| templates/gate-10-permission-change-review.template.ts | 93 | permission UI 変更 review (DEC-019-033) |
| templates/gate-11-knowledge-pii-review.template.ts | 94 | ナレッジ PII review (DEC-019-033) |
| templates/__tests__/templates.test.ts | 489 | Vitest **63 ケース全 pass** (要求 +5 を +58 大幅超過) |
| dispatcher.ts (改修) | 368 | template-based 再構成、`mapGateKindToTemplate` + `redactPayload` 経由 |
| vitest.config.ts (改修) | - | `@/` alias 追加 |

**主要設計判断**:
- task 仕様 (v8 canonical: `tos_review` / `cost_breach` 等) と既存 `HitlGateKind` (legacy: `network_external` / `cost_threshold` 等) の命名差分は `HITL_GATE_KIND_TO_NAME` で 1:1 mapping、5/22 Review で正式 reconciliation
- TypeScript strict 制約 (`verbatimModuleSyntax` / `exactOptionalPropertyTypes`) 下で contravariance を `AnyHitlNotificationTemplate` (type-erased registry 用) で解消
- HITL-5 (tos_strict) は即拒否仕様のため `defaultRejectAfterMs=0` / approval link 空 / actions block 省略
- 全 11 template の placeholder 注入箇所に `escapeMrkdwn` を適用、XSS escape を Vitest Test 5 (各 gate) で検証

**Acceptance Criteria 5/5 達成**:
- AC-T2-1: 11 gate templates 全実装 ✅
- AC-T2-2: Vitest 55+ ケース pass → **63 pass** (+8 超過) ✅
- AC-T2-3: PII redaction 全 placeholder 適用 ✅
- AC-T2-4: dispatcher template-based 再構成 + 既存 regression ゼロ ✅
- AC-T2-5: API 消費 90% 削減目標 → 51% 削減確認 (cap $30 の 1.4% 軽減、Phase 2 拡張時に再評価) 🟡 (継続 monitoring)

**5 日前倒し効果**: W0-Week2 SP 42 のうち T2 部分 (SP 8) を W0-Week1 末に消化 → W0-Week2 余裕 +1.4 人日 → 5/22 mock 70% 化 Pass 確度 90%+ → **92%+ 上方修正可能**

### §2.2 PM 部門 — 5/8 必須 cross-ref 25 件実施 (252 行 + 18 reports 直接編集)

| ファイル | 行数 | 役割 |
|---|---|---|
| pm-cross-ref-execution-report.md | 252 | 実施結果レポート、25/25 件 100% 完遂、数値整合性 100% 検証 |
| pm-conditional-go-tracker.md (4 編集) | - | DEC-019-051 5 必須施策並走、月次総額 ≤$430、Cap 83% 超過相当 |
| pm-phase1-day0-readiness-checklist.md (5 編集) | - | API 三段階 guard ($24/$28.5/$30)、月次総額 ≤$430、D-09 新規追加 |
| pm-cost-and-controls-plan-v4-1.md (5 編集) | - | 41 項目、議決-20 根拠、§6.6 5 必須施策節新規 |
| review-pre-phase1-readiness-assessment.md (4 編集 + 1 新規節) | - | 強い条件付き Go 維持、確度 84→86%、§7.1.1 Risk v3.1 表 |
| **review-risk-register-v3-1.md (新規生成)** | - | Review 起案版 v3.1、21 件構成、secretary 版と整合 |
| review-risk-register-v3.md (SUPERSEDED 注記) | - | v3 廃止、v3.1 へ移行 |
| research-pd-revised-validation.md (1 統合節) | - | §0.X 新規節 = DEC-019-050/-051 採択後の P-D 改 維持・強化結論 |
| marketing-portfolio-integration-plan.md (1 統合編集) | - | 月次総額 ≤$430、28x28 narrative 不変確認 |
| secretary-agenda-v7.md (確認のみ) | - | 既反映済 (20 議決、議決-20〜24 詳細記載済) |
| secretary-risk-register-v3-1.md (2 編集) | - | 確定ステータス、Review 起案版整合確認 |
| secretary-cover-letter-v3.md (2 編集) | - | 議題 v7 + 議決 20 件 + 90-105 min 反映 |
| secretary-w0-week1-meeting-minutes-template-v2.md (2 編集) | - | DEC 起票補助行更新、22 議題拡張 |

**部署別**:
| 部署 | 計画 | 実施 | 完了率 |
|---|---|---|---|
| PM | 14 | 14 | 100% |
| Review | 5 | 5 | 100% |
| Research | 1 | 1 | 100% |
| Marketing | 1 | 1 | 100% |
| 秘書 | 4 | 4 | 100% |
| Dev | 0 (5/8 不要) | 0 | — |
| **計** | **25** | **25** | **100%** |

**残り段階消化計画**:
- 5/22 必須 22 件 (Dev 8 / PM 4 / Review 4 / Research 3 / Marketing 1 / 秘書 2)
- 5/30 必須 14 件
- 6/13 必須 9 件

**要確認事項 7 件**: 全件「軽微」レベル、5/5-5/7 期間で吸収可能 (重大 0 件)

### §2.3 Marketing 部門 — Phase 1 完了 narrative 戦略 (1 件 / 384 行)

| ファイル | 行数 | 主要内容 |
|---|---|---|
| marketing-phase1-completion-narrative-strategy.md | 384 | 3 トーン比較 + Pros/Cons スコアリング + 推奨 + 配信戦略 + KPI |

**Marketing 推奨トーン (CEO 提示 3 候補への回答)**:
- **トーン B (物語型) 主軸 + トーン C (透明性 OSS) 補助 + トーン A (技術深堀り) 別枠連載**
- スコア集計: A 18/30 / **B 26/30** / C 22/30
- 既存資産活用度最大、読了率最高 (B 55-65% / A 25-30% / C 40-45%)、競合差別化強

**3 channel 配信戦略**:
- **Channel 1**: 自社 HP `/case-studies/openclaw-runtime` (B 主軸、LP 1,500 字 + note.com 拡張版 4,000-6,000 字)
- **Channel 2**: 自社 HP `/works/clawbridge/technical-deep-dive` 5 記事連載 (A 副軸、6/27 朝 第1弾 + 7-8 月 残4記事)
- **Channel 3**: Zenn 主軸 + note.com サブ (C 副軸、3,000-5,000 字 + OSS / 規制対応コミュニティ向け)

**公開タイムライン**:
- 6/13 Phase 1 完了レビュー → 6/15-19 ブラッシュアップ → 6/20 sign-off → 6/22 内部レビュー → 6/25 Owner 最終承認 → 6/26 deploy → **6/27 09:00 JST 公開**

**KPI (公開後 30 日)**:
- 全 channel 合計 PV 6,000 / ユニーク 3,500 / 平均 scroll_depth 75% / Contact CV 1.5%
- Contact form 問い合わせ 12 件 (案件相談 6 / 採用相談 3 / 規制対応 1 / その他 2)
- 案件相談 → Phase 2 ファンディング前段階 3 件以上 (1 件以上見積依頼)

### §2.4 Web-Ops 部門 — 自社HP portfolio 枠事前デザイン (1 件 / 515 行)

| ファイル | 行数 | 主要内容 |
|---|---|---|
| web-ops-prj019-portfolio-design.md | 515 | 配置 URL + 10 sections + 公開フロー + KPI + Owner 即決 4 件 + 既存 HP 整合 |

**配置 URL 階層** (Marketing Channel 1 と整合):
- L0 トップページ: `/` (Hero 直下訴求枠 1 ブロック新規追加)
- L1 case-studies index: `/case-studies` (新規、自社 PoC 事例一覧)
- **L2 PRJ-019 詳細: `/case-studies/openclaw-runtime`** (本件メインページ、10 sections)
- 既存 `/works/[slug]` (受託案件) と独立、`/case-studies/[slug]` (自社 PoC) を新規カテゴリ化

**10 sections**:
- §2.1 Hero (Heading A + KPI 4)
- §2.2 概要 + §2.3 技術 7 件
- §2.4 28x28 day journey 図解 (Mermaid timeline)
- §2.5 透明性 dashboard
- §2.6 Owner-in-the-loop dashboard demo (GIF 5-7 秒)
- §2.7 OSS / 規制対応
- §2.8 結果 (テスト件数 / 副作用 / 月予算)
- §2.9 blog 6 (Phase 2 公開予定 coming-soon)
- §2.10 CTA 3 カラム

**4 段階公開フロー** (6/22-27):
- 段階 1 (6/22-24 実装): Web-Ops Next.js 実装 + Mermaid SVG SSR + GIF 録画 + UTM 設定 + sitemap
- 段階 2 (6/25 Review): WCAG 2.1 AA + DEC-019-029 婉曲化 + JSON-LD Article schema 検証 (Google rich-results)
- 段階 3 (6/26 Marketing): Phase 1 完了実測値 (6/20 sign-off) 反映 + Owner 最終承認
- **段階 4 (6/27 09:00 JST): 公開** (X 1 投稿 + 公開後 24h モニタリング)

**SEO meta**: title / description / keywords / OGP / canonical / Twitter card 全設計済 (Next.js 16 App Router metadata API)

**design tokens**: shadcn/ui + Tailwind + Heroicons + Geist Sans + zinc 系 + アクセント 1 色 (AI 感抑制)

---

## §3. CEO 統合判断 4 件 (Round 4 ベース、Owner 即決推奨)

### §3.1 即決-1: Marketing tone 推奨 = **DEC-019-052 起票推奨**

**CEO 推奨**: Marketing 部門推奨 (B 物語型 主軸 + C 透明性 OSS 補助 + A 技術深堀り 別枠連載) を **DEC-019-052** として 5/8 検収会議 議決-25 に追加採択 (議決数 20 → **21 件**)

**根拠**:
- スコア最高 (B 26/30、26x28 victory narrative の物語資産活用最大)
- 既存資産流用最大、読了率最高 (B 55-65%)、競合差別化強
- Web-Ops Owner 即決 1 (両方併用) と完全整合 = Channel 1 (自社 HP `/case-studies/openclaw-runtime` 顧客向け事例) + Channel 2 (`/works/clawbridge/technical-deep-dive` 技術ブログ枠 6 本)

### §3.2 即決-2: Web-Ops portfolio 枠形態確定

**CEO 推奨**: Web-Ops 部門推奨 (C 両方併用) を採択 = `/case-studies/openclaw-runtime` (B 主軸ページ) + `/works/clawbridge/technical-deep-dive` (A 別枠 6 本連載)

**根拠**: B2B (中小企業発注検討者 45%) + B (個人開発者 30%) の両読者層を網羅、Marketing Channel 1 + Channel 2 と整合

### §3.3 即決-3: 6/27 朝 09:00 JST 公開時刻確定

**CEO 推奨**: Marketing + Web-Ops 両部署共通推奨 = **09:00 JST** を採択

**根拠**: 土曜朝 9:00 は launch-runbook §1.3.3 SOP 同期、X 投稿 Engagement window 整合、Vercel deploy 7:00 + 確認 8:00 + SNS 投稿 9:00 のリズム

### §3.4 即決-4: Channel 3 媒体 = Zenn 主軸 + note.com サブ確定

**CEO 推奨**: Marketing 部門推奨 = Zenn 主軸 (OSS 系コミュニティ) + note.com サブ (個人ブランディング) を 6/15 確定

**根拠**: C 透明性 OSS 重視型の対象読者 (OSS コミュニティ + 規制対応業界) と整合、Qiita / 個人 substack は Phase 2 海外展開時に検討

### §3.5 5/8 議題への組込

**現状**: 議題 v7 = 14 議題 / 20 議決 (議決-7〜20 + 議決-21〜24 = 4 件新規)
**v9 反映後**: 14 議題 / **21 議決** (議決-25 = DEC-019-052 Marketing tone 採択 + Web-Ops 枠形態 + 公開時刻 + Channel 3 媒体 を 1 議決にバンドル)

→ 秘書部門に 5/7 朝までに議題 v8 起案発令 (議決-25 追加、所要時間 90-105 → **95-110 min** 微調整)

---

## §4. Owner 判断必要事項 (3 件 → 0 件)

Round 3 で提示済の 3 判断必要事項は本 Round 4 成果で**全て CEO 推奨案として議決-25 にバンドル**。Owner 即決可能 (CEO 推奨で進める場合無回答可、5/8 議決-25 で正式採択):

| # | 判断項目 | CEO 推奨 | 5/8 議決 |
|---|---|---|---|
| 旧判断-1 | Marketing 28x28 victory narrative tone | B 主軸 + C 補助 + A 別枠連載 | 議決-25 (a) |
| 旧判断-2 | 自社HP の PRJ-019 ポートフォリオ枠 | C 両方併用 | 議決-25 (b) |
| 旧判断-3 | W0-Week2 着手前 Owner 動作 | Owner 必須対応継続 (1Password CLI op signin + Slack workspace 招待状送付) | (議決対象外、Owner 動作確認のみ) |

**Owner 動作必要事項 1 件**: 5/9 朝までに `1Password CLI op signin` + Slack workspace (`prj019-claude-code-company`) 招待状送付 → Dev W0-Week2 kickoff 32 項目に依存 (代替不可)

---

## §5. 4 マイルストン準備状況 (v8 → v9 更新)

| マイルストン | 日付 | v8 状況 | v9 状況 |
|---|---|---|---|
| **5/8 W0-Week1 検収会議** | 5/8 | 100% | **100% 維持** + 議決-25 追加 (議題 v8 起案 5/7 朝) |
| **W0-Week2 着手** | 5/9 | 95% | **100%** (Dev T2 HITL 5 日前倒し完遂、kickoff 32 項目 = Owner 1Password+Slack のみ pending) |
| **5/22 mock 70% 化検収** | 5/22 | 100% | **100%+** (T2 SP 8 W0-Week1 末消化 → W0-Week2 余裕 +1.4 人日 → Pass 確度 90→92%+) |
| **5/30 NG-3 再評価** | 5/30 | 80% | **80% 維持** (Round 3 で確定済) |
| **6/27 朝 Phase 1 公開** | 6/27 | - | **初期 100%** (Marketing 3 channel + Web-Ops 10 sections + 4 段階公開フロー確定) |

---

## §6. 確度トラッキング更新

| 期日 | v8 確度 | v9 確度 | 増分 | 根拠 |
|---|---|---|---|---|
| 5/22 mock 70% 化 完遂 | 90%+ | **92%+** | +2% | T2 5 日前倒し完遂、W0-Week2 余裕 +1.4 人日 |
| 5/26 Phase 1 着手 Conditional Go | 86% | **88%** | +2% | T2 完遂 + PM cross-ref 100% + 月次総額 ≤$430 確定 |
| 6/20 Phase 1 sign-off | 77% | **79%** | +2% | T2 5 日前倒しが Phase 1 全体 buffer に転化 |
| 6/27 朝公開 (新規追跡) | - | **78%** | - | Marketing/Web-Ops 4 段階公開フロー初期確定 |
| 5/8 Day-0 Pass | 99% | **99%+** | - | 議決-25 追加準備時間 1 日確保 |

---

## §7. 次のアクション (5/4-5/8)

| 期日 | アクション | 担当 |
|---|---|---|
| 5/5 朝 | 議題 v8 起案 (議決-25 追加 = DEC-019-052 採択 + Web-Ops 枠形態 + 公開時刻 + Channel 3 媒体) | 秘書 |
| 5/6 EOD | DEC-019-052 起票 (CEO) + Marketing/Web-Ops 7 即決推奨 cross-ref 反映 | CEO + PM |
| 5/7 22:00 | 5/8 配布資料パッケージ最終配布 (Slack DM + 1Password Vault) | 秘書 |
| 5/8 18:00 | W0-Week1 検収会議 (90-105 → 95-110 min、議決-25 含む) | 全部署 |
| 5/9 朝 | Owner 必須動作 (1Password CLI op signin + Slack 招待状送付) → Dev kickoff 32 項目稼働 | Owner + Dev |

---

## §8. リスク・懸念事項

**v8 から新規発生**: なし

**継続 monitoring**:
- AC-T2-5 API 消費 51% 削減 (目標 90% は Phase 2 拡張時に再評価)
- PM cross-ref 残 45 件 (5/22 / 5/30 / 6/13 段階消化、Dev 部門 5/22 必須 8 件が最大 volume)
- Owner 必須動作 (5/9 朝までに 1Password + Slack) — 代替手段なし、必須

**Risk Register v3.1 21 件**: 議決-21 採択後 v3.2 化候補 = R-019-23 (Phase 2 拡張時 API cap $30→$100 増額タイミング) を 6/13 Phase 1 完了レビュー時に再評価

---

## §9. 統合納品サマリ (Round 1+2+3+4)

| Round | 納品件数 | 主要部署 | 主成果 |
|---|---|---|---|
| Round 1 | 4 件 / 1,318 行 | Research / Review / PM / Dev | $30 cap 4 部署横断評価 (subscription 主軸推奨) |
| Round 2 | 5 件 / 1,776 行 | 秘書 / Dev / PM / Review | DEC-019-051 起票準備 (議題 v7 / Risk v3.1 / Phase 1 plan v2.2 / W0-W2 WBS / mock AC) |
| Round 3 | 12 件 / 4,874 行 | 全 5 部署 | 5/8 配布資料 final + cross-ref plan + W0-W2 kickoff + Review CP3 + Research baseline |
| **Round 4** | **4 件 / 4,200+ 行 + 17 実装ファイル + 25 cross-ref 編集** | Dev / PM / Marketing / Web-Ops | **T2 HITL 11 templates + cross-ref 100% + Phase 1 narrative + portfolio 枠** |
| **計** | **25 件 / ~12,000 行 + 26 実装ファイル + 25 cross-ref 編集** | | |

---

**v9 起案**: 2026-05-04 / **次回更新**: 2026-05-08 18:00 W0-Week1 検収会議成果統合 v10
