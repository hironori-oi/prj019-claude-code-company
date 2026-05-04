# CEO 連結報告 — DEC-019-033 5 部署並列発注成果統合

**起票日**: 2026-05-03
**起票者**: CEO（claude-code-company AI 組織）
**根拠**: オーナー 5 設計変更指示（2026-05-03）+ 「全 OK」明示承認 + 追加指示「Open Claw 権限の UI 設定可能化、詳細・柔軟運用」
**正式 DEC**: `projects/PRJ-019/decisions.md` DEC-019-033（5 点統合版）
**位置付け**: 5/8 W0-Week1 検収会議 議題 v6 の追加配布資料

---

## §0 サマリー

オーナー 5 設計変更指示を受けて DEC-019-033 を起票、5 部署並列発注（PM / Dev / Research / Marketing / Review、DEC-019-025 SOP 順守 general-purpose 系発注）を即時実行し、**6 ファイル / 6,336 行 / Mermaid 32 枚 / 比較表 165 個 / [ODR] 52 件** の成果を着地させた。

DEC-019-031（5,038 行 / 39 ODR）を **大幅超過** する成果密度で、Phase 1 を「Owner-in-the-loop 透明 AI 組織」モデルに正式変更する判断材料が揃った。

**Phase 1 着手 5/19 → 5/26 に 1 週間延期、Phase 1 完了 6/13 → 6/20、Marketing 公開 6/20 → 6/27 朝（暫定）にスライド**、5/8 W0-Week1 検収会議で正式決裁する。

**残存赤リスク 1 件**: R-019-15 priviledge escalation 攻撃（Review §9 確定）→ 必須コントロール P-UI-01〜10（Dev 工数 26 days）+ BAN drill #3（5/29）Pass を Phase 1 着手の **絶対条件化**。

---

## §1 5 部署成果一覧

| # | 部署 | 成果物（ファイルパス） | 行数 | Mermaid | 比較表 | [ODR] |
|---|---|---|---|---|---|---|
| 1 | PM | `pm-cost-and-controls-plan-v4-1.md` | 689 | 5 | 18 | 12 |
| 1 | PM | `pm-permission-ui-wbs.md` | 743 | 2 | 12 | 8 |
| 2 | Dev | `dev-w0-week2-prop-gen-and-dashboard.md` | 1,910 | 8 | 30 | 11 |
| 3 | Research | `research-knowledge-and-transparency-design.md` | 1,049 | 4 | 22 | 8 |
| 4 | Marketing | `marketing-owner-gate-messaging-update.md` | 864 | 8 | 50 | 7 |
| 5 | Review | `review-owner-gate-and-permission-ui-security.md` | 1,081 | 5 | 33 | 6 |
| **計** | **5 部署** | **6 ファイル** | **6,336** | **32** | **165** | **52** |

---

## §2 5 部署クロスチェック結果（CEO 一次解釈）

### §2.1 整合性確認

| 観点 | Research | Dev | PM | Marketing | Review | 整合性 |
|---|---|---|---|---|---|---|
| **権限 UI アーキ** | Casbin + AWS IAM Permission Boundary + 1Password Tree UI + HCL + AppArmor | Supabase RLS + DB role 分離 + hash chain audit + canonical JSON fingerprint | RLS / middleware / API auth / env 分離 4 防衛線 | 100% 開示で訴求材料化（HITL 9・10 種）| RLS + DB role + hash chain で priviledge escalation 物理防止 | **完全整合**（Casbin = アプリ層 / Supabase RLS = DB 層、二重防御として併用が最強） |
| **priviledge escalation 防止** | 永遠 deny envelope（13 prohibited domains 等）| service_role 物理分離、強制 deny 12 コマンド | service_role 物理分離 + 13 domains UI 解除不可 | 100% 開示で「安全性」訴求 | PE-01〜12 攻撃面評価で赤 0 件 / 黄 4 件 | **完全整合**（E 案物理不可能化が五者共通結論） |
| **HITL 第 9・10 種開示** | - | 強制 ON、UI 編集不可ロック | 通常 UI 操作時不要、3 ケース限定 | 100% 開示最適 | drill #3 で動作検証 | **整合**（仕様 100% 開示 = 内部実装 80% 開示の二段階整理） |
| **Phase 1 5/26-6/20 + 公開 6/27 朝** | コスト面で問題無し | 4 週内実装可能（Dev 1 名なら 5/16-18 前倒し）| ODR-019-V41-02〜04 P1 議決必須 | 5/8 検収正式決裁必須、SEO 影響無し | Conditional Go（3 条件、Dev 2 名並列推奨）| **整合**（5/8 検収で確定、Dev 2 名体制が共通推奨）|
| **KPI 提案承認率 ≥ 30%** | - | - | 単一指標、TR-4 ジャンル切替トリガー | - | - | **PM 単独提案、CEO 一次採択（5/8 検収で正式決裁）** |
| **競合差別化** | - | - | - | 28/28 完全制覇、次点 Cursor の 2.5 倍 | - | **Marketing 単独提案、外部一次比較で証明済** |
| **コスト試算** | $0.46〜0.93/月（cap の 0.31%）| - | $0 追加（Hobby + free tier 吸収）| - | - | **整合**（予算リスク無し、$300 ハードキャップ余裕 41%→54%） |
| **必須コントロール数** | - | - | 34 → 40 + KE 4 = 44 項目 | - | P-UI 6→**10 項目** に拡張要請 | **要 PM 部門再整合**（PM 6 項目 vs Review 10 項目、CEO 採択 = Review 10 項目を採用） |

### §2.2 整合性差分（CEO 採択判断要）

| 差分 | PM | Review | CEO 採択 |
|---|---|---|---|
| P-UI コントロール数 | 6 項目（P-UI-01〜06）| 10 項目（P-UI-01〜10）| **Review 10 項目を採用**（priviledge escalation 防止が最重要赤リスク、4 項目追加 = P-UI-07 HITL 第 10 種 SLA / P-UI-08 fingerprint / P-UI-09 RLS review / P-UI-10 pentest 実施タイミング、Dev 工数 +6 日 = 26 日想定で 5/26 着手間に合うかを Dev 部門に再確認要） |
| HITL 第 11 種 `knowledge_pii_review` | 未提案 | ODR-OG-06 で提案 | **CEO 推奨採用**（ナレッジ抽出時の PII 漏洩防止用、R-019-16 への決定的対策、5/8 検収会議で正式決裁） |

---

## §3 [ODR] 統合一覧（52 件）

### §3.1 P1（5/8 検収会議で必須議決）= 18 件

| 部署 | ODR ID | 内容 | CEO 推奨 |
|---|---|---|---|
| PM v4.1 | V41-01 | 提案承認率 KPI 単一指標化 | ≥ 30% で採用 |
| PM v4.1 | V41-02 | Phase 1 着手 5/19 → 5/26 | YES 採用 |
| PM v4.1 | V41-03 | Phase 1 完了 6/13 → 6/20 | YES 採用 |
| PM v4.1 | V41-04 | Marketing 公開 6/20 → 6/27 朝 | YES 採用 |
| PM v4.1 | V41-05 | TR-4「提案承認率 < 30% 持続時のジャンル切替」 | YES 採用 |
| PM UI WBS | PUI-01 | Dev 2 名体制（Pre-Phase 工数 14 d）| YES 採用、または 5/16-18 前倒し（Dev 単独運用時）|
| PM UI WBS | PUI-02 | 7 カテゴリの細粒度パラメータ確定 | Dev §3 設計通り採用 |
| PM UI WBS | PUI-03 | hot-reload 60s 周期確定 | Dev 3 経路冗長化（spawn 直前 + Realtime + 60s）採用 |
| Dev | ODR-DEV-01 | 提案書 zod schema 7 項目確定 | Research §2 (Amazon 6-pager 簡略版) 整合採用 |
| Dev | ODR-DEV-02 | 透明性 Dashboard SSE vs Realtime | Supabase Realtime 採用 |
| Research | DEC033-01 | Casbin (node-casbin) RBAC 採用 | YES 採用（Supabase RLS と二層防御）|
| Research | DEC033-05 | Permission Boundary 設計 | Research §6 推奨採用 |
| Research | DEC033-07 | Compliance Statement 公開 | YES 採用（Marketing §8 と整合）|
| Marketing | Mkt-Update-01 | Heading A 補強 LP Hero sub-head 文言確定 | A1 採用「オーナー承認下で AI 組織が AI 組織を運営する。Owner-in-the-loop transparent AI org.」 |
| Marketing | Mkt-Update-02 | プレス見出し補強 | P1 採用 |
| Review | OG-01 | 5/8「強い条件付き Go」承認 | YES 採用 |
| Review | OG-04 | BAN drill #3（5/29）実施承認 | YES 採用 |
| Review | OG-05 | R-019-15 を「赤」リスク公式格付け | YES 採用 |

### §3.2 P2（5/26 着手前に決着）= 22 件

（PM V41-06〜09、PM PUI-04〜06、Dev ODR-DEV-03〜09、Research DEC033-02〜04, 06, 08、Marketing Mkt-Update-03〜06、Review OG-02・03・06）

### §3.3 P3（Phase 1 進行中決着可）= 12 件

（PM V41-10〜12、Dev ODR-DEV-10〜11、Research（該当なし）、Marketing Mkt-Update-07、Review（該当なし、全 P1/P2 で決着））

---

## §4 月次コスト統合試算（5 部署クロスチェック確定）

### §4.1 既契約ベース（不変、Phase 1 追加発生せず）

| サービス | 料金 | 備考 |
|---|---|---|
| Anthropic Claude Max 20x | $200/月 | 既契約、Sumi/Asagi 同居 |
| OpenAI ChatGPT Pro | $200/月 | 既契約、Codex 5x usage tier |
| 1Password Individual | $2.99/月 | 既契約見込 |
| **小計** | **$402.99/月** | - |

### §4.2 Phase 1 追加発生（DEC-019-012 ハードキャップ $300/月対象）

| 項目 | 控えめ | 中央値 | 上限 | 備考 |
|---|---|---|---|---|
| 提案生成 +α（Claude Sonnet 4.5）| $0.46 | $0.70 | $0.93 | Research §5、prompt cache 90% 適用後 |
| 透明性 Dashboard | $0 | $0 | $0 | Vercel Hobby + Supabase Free Tier 内（PM §6.2）|
| 権限管理 UI | $0 | $0 | $0 | 同上 |
| ナレッジ抽出蓄積 | $0 | $0 | $0 | 同上、Phase 1 W4 着手 |
| 透明性 + 権限 UI 開発期 Vercel | $0 | $20 | $46 | DEC-019-016 既設定範囲、変更なし |
| **小計** | **$0.46** | **$20.70** | **$46.93** | $300 ハードキャップ余裕 99.7% / 93.1% / 84.4% |

### §4.3 結論

- **DEC-019-033 採用は予算面のリスク無し**（5 部署クロスチェック確認）
- DEC-019-031 NG-3 $1,000 → $1,200 上方修正候補とは **独立判断可能**（Research §5 確定）
- Vercel Hobby → Pro 昇格判断（CB-CEO-W3-01）は別枠（DEC-019-024 既定）

---

## §5 必須コントロール統合表（44 → 50 項目に拡張）

### §5.1 既存（DEC-019-007 / 015 / 018 / 022 等で確定済）

- G-01〜G-12（基本コントロール 12 項目）
- G-V2-01〜V2-11（V2 追加 11 項目）
- C-A-01〜05（オプション A 採用追加 5 項目）
- C-OC-01〜05（OpenClaw 上流監視 5 項目）
- H-09 / H-10（Claude Max weekly cap 2 項目）
- HITL Gate 第 1〜8 種（PRJ-019: 7 種 + PRJ-020: 1 種）
- G-Top-1〜4（公開ガード 4 項目）
- **小計: 34 項目（PM v4 §3 確定）**

### §5.2 DEC-019-033 で追加（16 項目）

| カテゴリ | コントロール ID | 内容 | 担当 | 期限 |
|---|---|---|---|---|
| **権限 UI** | P-UI-01 | Owner 二要素認証（1Password TOTP）| Dev | 5/25 着手前 |
| **権限 UI** | P-UI-02 | policy 変更時 5 秒 cool-down + 確認モーダル | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-03 | policy_audit_log SHA-256 hash chain | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-04 | kill switch 即時 propagation < 1 秒 | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-05 | policy 異常検知パターン定義 | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-06 | 自動 rollback 通知 SLA | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-07 | HITL 第 10 種 SLA / default action | Dev | 5/25 着手前 |
| **権限 UI** | P-UI-08 | policy fingerprint 検証（subprocess 起動時）| Dev | 5/25 着手前 |
| **権限 UI** | P-UI-09 | Supabase RLS policy review checklist | Review | 5/25 着手前 |
| **権限 UI** | P-UI-10 | penetration test 実施タイミング（W2 / W4）| Review | W2 / W4 |
| **ナレッジ運用** | KE-01 | patterns/decisions/pitfalls 構造化スキーマ | Dev | Phase 1 W4 |
| **ナレッジ運用** | KE-02 | 自動抽出 trigger（案件完了時）| Dev | Phase 1 W4 |
| **ナレッジ運用** | KE-03 | 次回提案生成時の retrieval 機構 | Dev | Phase 1 W4 |
| **ナレッジ運用** | KE-04 | 抽出時 PII redaction 自動化 | Dev | Phase 1 W4 |
| **HITL Gate** | HITL-9 | `dev_kickoff_approval`（提案承認）| Dev | 5/25 着手前 |
| **HITL Gate** | HITL-10 | `permission_change_review`（権限変更承認）| Dev | 5/25 着手前 |
| **HITL Gate** | HITL-11 | `knowledge_pii_review`（ナレッジ PII 承認、CEO 推奨採用）| Dev | Phase 1 W4 |

**小計: 16 項目（DEC-019-033 追加）**
**累計: 34 + 16 = 50 項目**

---

## §6 リスク登録簿への追加（R-019-13〜16）

| ID | 内容 | 格付 | 緩和策 | 担当 |
|---|---|---|---|---|
| R-019-13 | 提案承認率 < 30% | 黄 | 月次 monitor、TR-4 ジャンル切替 | PM |
| R-019-14 | 権限 UI 設定ミス | 黄 | P-UI-02 cool-down + P-UI-05 異常検知 + P-UI-06 自動 rollback | Dev / Review |
| **R-019-15** | **priviledge escalation 攻撃** | **赤** | **P-UI-01〜10 全実装 + drill #3 Pass を Phase 1 着手の絶対条件化** | **Review / Dev** |
| R-019-16 | ナレッジ PII 漏洩 | 黄 | KE-04 PII redaction + HITL 第 11 種 `knowledge_pii_review` | Dev / Review |

---

## §7 Phase 1 着手 5/26 Go/NoGo 判定（Review §10 統合）

### §7.1 Conditional Go の 3 条件

1. **P-UI-01〜09 を 5/25 までに完遂**（W0 Week2 で P-UI-01/04/08/09 並列、Pre-Phase Week 5/19〜5/25 で P-UI-02/03/05/07 並列、**Dev 2 名並列で完遂可能**）
2. **BAN drill #3（5/29）計画完成を 5/8 検収会議で承認**（攻撃シナリオ 5 種 = PE-01/03/04/06/08 流用）
3. **5/8 検収で Review 「強い条件付き Go (確実度向上)」を維持判定**（議題 7 件中 完全 Pass 4 + 強い条件付き Pass 3 の予測）

### §7.2 1 条件でも欠けた場合

- Phase 1 着手 5/26 → **6/2 にさらに 1 週間延期**（合計 2 週間延期、Phase 1 完了 6/13 → 6/27、Marketing 公開 6/20 → 7/4 朝）
- 5/8 検収会議で再判定

### §7.3 CEO 推奨

- **Conditional Go 採用**、3 条件達成のためのリソース集中投下を 5/8 検収会議で正式決裁
- **Dev 2 名体制**（PM ODR-PUI-01 + Review §8 推奨）を Phase 1 全期間で確保
- BAN drill #3（5/29）を秘書部門 W2 タスク台帳に追加

---

## §8 5/8 W0-Week1 検収会議 議題 v6 改訂提案（秘書部門発令）

### §8.1 議題構成（120 分維持、§4 BAN drill 短縮で吸収）

| § | 議題 | 時間 | v5 → v6 差分 |
|---|---|---|---|
| §1 | 開会・出席確認 | 5 分 | 不変 |
| §2 | W0-Week1 進捗報告（Dev 95 tests / Research / Review） | 25 分 | 不変 |
| §3 | **Owner-in-the-loop Phase 1 Go/NoGo 議決** | **25 分（10 分拡大）** | **議題の意味自体を再定義**（DEC-019-033 5 点統合採用 + Phase 1 着手 5/26 Conditional Go の 3 条件）|
| §4 | BAN drill #1/#2 + **#3 計画承認** | **18 分（2 分短縮）** | drill #3（5/29）追加 |
| §5 | PM 追加議題 | **42 分（2 分拡大）** | §5.1〜§5.4 不変、§5(d') を §5(d'+ε) に拡大（5→12 分、透明性 Dashboard + 権限管理 UI 統合方針） |
| §6 | Q&A・閉会 | 5 分 | 不変 |
| **計** | - | **120 分** | **維持** |

### §8.2 議決事項（CEO 推奨採択先行）

| ID | 議題 | CEO 推奨 |
|---|---|---|
| 議決-1 | DEC-019-033 5 点統合採用 | YES |
| 議決-2 | Phase 1 着手 5/26 Conditional Go（3 条件付き）| YES |
| 議決-3 | Phase 1 完了 6/20 + Marketing 公開 6/27 朝 | YES |
| 議決-4 | KPI 提案承認率 ≥ 30% 採用 + TR-4 ジャンル切替 | YES |
| 議決-5 | 必須コントロール 50 項目（既存 34 + DEC-019-033 追加 16）採用 | YES |
| 議決-6 | HITL 第 9・10・11 種正式追加 | YES |
| 議決-7 | BAN drill #3（5/29）実施承認 | YES |
| 議決-8 | R-019-15 priviledge escalation 攻撃 = 赤格付け公式化 | YES |
| 議決-9 | Heading A 補強表記 A1 採用 | YES |
| 議決-10 | Dev 2 名体制 Phase 1 全期間確保 | YES |
| 議決-11 | 外部 policy import 機能 Phase 1 完全無効化（Review ODR-OG-03）| YES |
| 議決-12 | 1Password TOTP Owner 二要素認証採用（Review ODR-OG-02）| YES |

---

## §9 既存ドキュメント連動修正（CEO 即時実行済）

| ファイル | 修正内容 | 状態 |
|---|---|---|
| `projects/PRJ-019/decisions.md` | DEC-019-033 起票 + v9 footer | 完了 |
| `dashboard/active-projects.md` | PRJ-019 行 DEC-019-033 反映 | 完了 |
| `projects/PRJ-019/brief.md` | §3「3 大キーワード」§1 書換（人間不在 → Owner-in-the-loop）| 完了 |
| `CLAUDE.md` | §6 ナレッジ蓄積機構拡張（patterns/decisions/pitfalls 3 サブディレクトリ）| 完了 |
| `projects/PRJ-020/decisions.md` | DEC-020-003 annotate（透明性 Dashboard + 権限 UI + Phase 1 PoC 6/21-7/4 連動修正）| 完了 |
| **`projects/PRJ-019/reports/ceo-dec-019-033-consolidation.md`** | **本書（連結報告）作成** | **完了** |

---

## §10 次のアクション

### §10.1 即時実行（本セッション中）

1. **秘書部門に 5/8 議題 v6 改訂発令**（独立タスク発注、§8 仕様準拠、5/8 22:00 配布）
2. オーナーへの本連結報告 + 議決-1〜12 推奨採択の承認確認

### §10.2 5/4-5/7（Owner 確認窓 + Dev 前倒し）

1. Owner: [ODR] 52 件のうち P1 18 件確認（5/8 検収会議までに）
2. Dev: P-UI-01〜10 のうち W0 Week2 並列分（P-UI-01/04/08/09）着手前倒し検討
3. 秘書: 5/8 議題 v6 配布 + Owner 直送カバーレター v2 起案

### §10.3 5/8 W0-Week1 検収会議

- 議決-1〜12 を全件承認 → DEC-019-033 を「正式決裁・実行段階」に移行
- BAN drill #3（5/29）正式起動
- Phase 1 着手 5/26 Conditional Go 確定

### §10.4 5/26 Phase 1 W1 公式キックオフ

- DEC-019-033 反映済の Owner-in-the-loop モデルで開始
- Pre-Phase Week 5/19〜5/25 完遂後

---

## §11 主要発見・革新点（CEO 視点）

1. **E 案物理不可能化が五者共通結論**: Open Claw 自身による権限変更経路は Research（永遠 deny envelope）/ Dev（service_role 物理分離）/ PM（4 防衛線）/ Review（PE 12 試行で赤 0 件）の 4 部署が独立に「物理的に不可能」と確定
2. **競合差別化 28/28 完全制覇**: Marketing §7 で 7 軸 × 7 競合の独立比較で次点 Cursor の 2.5 倍差、外部一次比較で証明済
3. **法令整合性 4 種完全整合**: EU AI Act Article 14 / 日本 AI 事業者ガイドライン / NIST AI RMF / ISO/IEC 42001 → B2B 中小企業ターゲットへの「安心訴求」材料化
4. **コスト追加 0.31% で実装可能**: Research § 5 の精緻試算（$0.46〜0.93/月）で $300 ハードキャップの 99.7%〜99.69% 余裕を残して全機能実装可能
5. **R-019-15 のみ赤、PE-01〜12 で 8/12 が白**: priviledge escalation 攻撃は赤格付け維持だが、12 攻撃面のうち 2/3 が既設計で白に押下げ、残 4 件（黄）も P-UI-01〜10 で対処可能
6. **Phase 1 5/26-6/20 内実装可能**: Dev 4 週分割 + 2 名体制で 95 tests → 136 tests の量的拡張、品質維持
7. **HITL 第 11 種 `knowledge_pii_review` 提案**: Review §6 から ODR-OG-06 として提案、CEO 推奨採用 → ナレッジ PII 漏洩への決定的対策

---

## §12 リスク・懸念事項（CEO として明示）

| # | リスク | 緩和策 |
|---|---|---|
| **タイムライン圧迫** | 5/4-5/7 の Owner 確認窓で [ODR] 52 件処理（うち P1 18 件は 5/8 までに必須）| ODR-002 + ODR-OG-01 から P1 議題を 5/8 議事内 25 分で集中議決 |
| **Dev 2 名体制確保** | Owner 単独運用前提の組織で 2 名体制は単純不可能 | 「Dev 部門エージェント並列起動」= 1 セッション内で複数 Dev エージェントを並列発注する運用化、または 5/16-18 前倒し着手 |
| **Phase 1 着手 5/26 → 6/2 さらに 1 週間延期可能性** | 3 条件のいずれか 1 つでも欠けたら自動延期 | 5/8 検収会議で 3 条件達成プランを正式決裁、リソース集中投下 |
| **DEC-019-031 既成果との整合** | $1,000 → $1,200 NG-3 上方修正候補との整合判定 | Research §5 で「独立判断可能」と確定済、5/30 W2 終了時オーナー再確認議題で別途決裁 |

---

**v1 完成**: 2026-05-03（CEO 連結報告、5 部署成果統合）
**次回更新**: 2026-05-08 W0-Week1 検収会議後（議決結果反映）
**根拠ファイル**: §1 表参照（6 ファイル / 6,336 行 / Mermaid 32 / 比較表 165 / [ODR] 52）
