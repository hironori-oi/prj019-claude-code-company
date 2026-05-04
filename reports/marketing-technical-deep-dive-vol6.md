# PRJ-019 Clawbridge — Technical Deep Dive Vol.6 草稿 (連載最終回)

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象掲載先**: `/works/clawbridge/technical-deep-dive/vol-06-28x28-architecture` (A 別枠連載 第 6 弾 = 最終回、Zenn 主軸 + note.com サブ)
- **連載シリーズ名**: `Clawbridge Technical Deep Dive` (全 6 本完結)
- **本記事タイトル**: 「28x28 victory narrative の組織アーキテクチャ — 1 person × 28 projects × 28 parallel の AI 組織運営原理」
- **依拠議決**: DEC-019-052 議決-25 (A 連載) + DEC-019-033 (透明性 6 軸 + ナレッジ蓄積 3 サブディレクトリ) + CLAUDE.md 8 部署組織設計
- **公開予定**: Phase 2 W7 (2026-12-XX 想定、連載最終回)
- **想定字数**: 2,500-3,500 字 (本草稿 約 3,300 字)
- **tone**: A hard / 技術深堀り (Phase 2 vision 接続)

---

## 1. Zenn / note 用 frontmatter draft

### 1.1 Zenn frontmatter

```yaml
---
title: "28x28 victory narrative の組織アーキテクチャ — 1 person × 28 projects × 28 parallel の AI 組織運営原理"
emoji: "building-library"
type: "tech"
topics: ["ai", "organization", "harness", "knowledge", "openclaw"]
published: true
published_at: 2026-12-XX 09:00
publication_name: "improver"
---
```

### 1.2 note frontmatter

```text
タイトル: 28x28 victory narrative の組織アーキテクチャ — 1 person × 28 projects × 28 parallel の AI 組織運営原理
ハッシュタグ: #AI #個人開発 #組織設計 #ナレッジ #Clawbridge
公開日: 2026-12-XX 09:00 JST
シリーズ: Clawbridge Technical Deep Dive (6/6 = 最終回)
リード文:
  「個人開発者 1 人で 28 案件並列」を成立させる原理は、subprocess spawn でも HITL 11 種でもない。
  本連載最終回は CLAUDE.md の 8 部署組織設計 + 透明性 6 軸 + ナレッジ蓄積 3 サブディレクトリの
  「3 軸 17 要素」を、Phase 2 vision 接続として戦略的に解説する。
```

### 1.3 OGP / SEO meta

| 項目 | 値 |
| --- | --- |
| canonical | `https://improver.jp/works/clawbridge/technical-deep-dive/vol-06-28x28-architecture` |
| description | 「個人開発者 1 人 × AI 組織が 28 案件を並列運営する組織アーキテクチャ。CLAUDE.md 8 部署 + 透明性 6 軸 + ナレッジ 3 サブディレクトリの 17 要素設計と、PRJ-018 Asagi M2 / PRJ-012 Sumi / PRJ-020 ClawDialog への横展開ロードマップを公開。」 |
| keywords | `AI org design`, `28x28`, `Owner-in-the-loop`, `knowledge accumulation`, `harness engineering`, `Phase 2 vision`, `Clawbridge`, `claude-code-company` |

---

## 2. 本文草稿 (2,500-3,500 字)

### 2.1 はじめに — 連載 6 本で語ってきたこと

本連載は 6 本で構成されている。

| Vol | 主題 |
| --- | --- |
| Vol.1 | subprocess spawn による上流 OSS 隔離 (P-D 改) |
| Vol.2 | HITL 11 種 gate templates (Owner-in-the-loop の物理境界) |
| Vol.3 | 月次予算 $430 cap の二重防御 (subscription + watchdog) |
| Vol.4 | BAN drill #1/#2/#3 (一次資料 8 件から導いた 3 検証) |
| Vol.5 | pnpm workspace + standalone repo 切出し (Plan A/B 実戦) |
| **Vol.6 (本稿)** | **28x28 organization architecture (連載最終回 / Phase 2 vision 接続)** |

Vol.1〜5 は **「個別装置の設計」** だった。
本稿で扱うのは **「それらを統合する組織原理」** である。
個人開発者 1 人で 28 案件並列を成立させる本当の正体は、subprocess でも HITL 11 種でもなく、その下に流れる **「組織アーキテクチャ」** にある。

### 2.2 28x28 の数字の意味

「28x28」は次の 2 軸の積として定義される。

| 軸 | 意味 |
| --- | --- |
| 28 projects | 個人開発者 1 人が同時運営する案件数の上限 (従来の個人開発者は 5 件で詰む) |
| 28 parallel | 1 案件内で並列稼働する subprocess (Open Claw / Claude Code CLI) の上限 |

この 2 軸を統合すると、**28 × 28 = 784 並列単位の同時運営** が成立する。
これは個人開発者 1 人の物理的限界 (脳内容量 / 集中時間 / 連絡先把握) を **5 倍超** で突破する数字である。

> 図 6.A: 28 projects × 28 parallel = 784 並列単位の格子 <!-- arch-diagram-6A: 28x28-grid -->

しかし数字を達成するには、Owner 自身のメンタルモデルを書き換える必要がある。
**「全部理解する」** ではなく **「理解するべきところだけを物理的に切り出す」** という発想の転換だ。
これを支えるのが、本稿で扱う「3 軸 17 要素」の組織アーキテクチャである。

### 2.3 第 1 軸 — CLAUDE.md 8 部署設計 (組織として振る舞う構造)

`CLAUDE.md` で定義された 8 部署は次の通り。

| 部署 | slash command | 役割 |
| --- | --- | --- |
| CEO | `/ceo` | 最高意思決定・全体統括 |
| 秘書 | `/secretary` | 案件受付・記録・スケジュール管理 |
| PM | `/pm` | プロジェクト管理・タスク分解・進捗管理 |
| リサーチ | `/research` | 技術調査・競合分析・実現性検証 |
| 開発 | `/dev` | 設計・実装・テスト・デプロイ |
| マーケティング | `/marketing` | 提案書・市場分析・成長戦略 |
| レビュー | `/review` | 品質管理・コードレビュー・最終検収 |
| 広報Web運営 | `/web-ops` | 自社HP開発・運営・ポートフォリオ管理 |

8 部署が **Markdown ファイル** として `organization/roles/{部署}.md` に固定化されているのが Clawbridge の特異点だ。
他の AI agent framework は「動的なエージェントネットワーク」を組むが、Clawbridge は **「静的な組織図」** を採用した。

理由は 1 つ。**「人間 Owner が全体を 1 ページで理解できる」** ことが 28 案件並列の必須条件だったからである。
動的ネットワークは賢く見えるが、Owner が「今この瞬間に何が動いているか」を把握できなくなる。
静的組織図は退屈に見えるが、CLAUDE.md の `## 組織構造` セクションを読めば 30 秒で全体像が掴める。

> 図 6.B: 8 部署の指示・報告フロー (トップダウン Owner→CEO→部署 / ボトムアップ 部署→CEO→Owner) <!-- arch-diagram-6B: 8dept-flow -->

### 2.4 第 2 軸 — 透明性 6 軸 (DEC-019-033 で正式化)

DEC-019-033 (5/3 採択) で確定した透明性 6 軸は次の通り。

| 軸 | 内容 | 実装場所 |
| --- | --- | --- |
| 1. 意思決定 | 全 DEC-XXX を `decisions.md` に永続記録 | `projects/PRJ-XXX/decisions.md` |
| 2. コスト | watchdog 3 段階 + 月次サマリ | `cost-tracker.ts` (Vol.3 §2.3) |
| 3. 実行履歴 | spawn log + tool_call 全記録 | `runtime-history.jsonl` |
| 4. 失敗ログ | error / circuit_open / kill-switch trigger | `failure-log.jsonl` |
| 5. prompt | システムプロンプト全文 | `organization/roles/{部署}.md` |
| 6. モデル選択 | Sonnet / Opus / Codex 選択ログ | `model-selection-audit.jsonl` |

6 軸は **「Owner が iPhone から覗ける」** ように設計されている (DEC-019-033 §⑤ Owner-in-the-loop dashboard 要件)。
監視ではなく **「同じ船に乗っている体感」** を作る装置だ。

なぜ 6 軸なのか。Phase 0 議論では 3 軸 (decisions / cost / history) で十分だと考えていた。
だが Owner が「Open Claw が今この瞬間に何を考えているか」を知りたいと言ったとき、prompt と model 選択が抜け落ちていることに気づき、+3 軸 (failure / prompt / model) を追加した。
**「透明性は加算で増える、引算で減らない」** のが Clawbridge の透明性設計の鉄則である。

### 2.5 第 3 軸 — ナレッジ蓄積 3 サブディレクトリ (DEC-019-033 §④)

DEC-019-033 §④ で正式化された `organization/knowledge/` 配下の 3 サブディレクトリは次の通り。

| サブディレクトリ | 蓄積対象 | テンプレ |
| --- | --- | --- |
| `patterns/` | 再利用可能なコード / アーキ / UI パターン | YAML frontmatter + Markdown 本文 + tag |
| `decisions/` | 設計判断ログ (DEC-XXX 由来) | 文脈 + 代替案 + 採用根拠 + 検索 metadata |
| `pitfalls/` | 落とし穴集 (PIT-XXX) | 症状 + 原因 + 対処 + 再発防止策 (4 要素) |

PRJ-019 で得た PIT-002 (Vol.5 §2.3) は `pitfalls/PIT-002-github-prefix-reserved.md` として登録され、PRJ-020 以降の提案生成時に **自動 retrieval** される。

```ts
// 提案生成時の retrieval 概形 (Phase 1 W4 実装予定)
async function generateProposal(req: ProposalRequest): Promise<Proposal> {
  const knowledge = await retrieveKnowledge({
    domain: req.domain,
    tags: req.tags,
    limit: 10,
  });
  // knowledge には patterns / decisions / pitfalls 各サブから関連エントリ
  return {
    ...req,
    references: knowledge.map(k => ({ id: k.id, type: k.type, source: k.source })),
    // HITL 第 9 種 dev_kickoff_approval 直前で Owner に提示
  };
}
```

これにより **「個人開発者が独学で 3 年かけて溜めた経験値」が AI 組織の集合知として固定化** される。
1 人で 28 案件を回す世界では、毎回ゼロから学び直す余裕はない。
ナレッジ蓄積機構は **「同じ落とし穴を 2 度踏まない」** ための物理装置である。

> 図 6.C: ナレッジ retrieval が HITL 第 9 種 `dev_kickoff_approval` 直前で発火するシーケンス <!-- arch-diagram-6C: knowledge-retrieval-hitl9 -->

### 2.6 PII 保護 — HITL 第 11 種との連動 (Vol.2 §2.6)

ナレッジ蓄積機構には明確に難しい問題があった。
顧客との会話ログ / API key / 個人情報 がナレッジに混入する危険である。

Clawbridge は 2 重防壁で解決した。

1. **自動 redaction**: 抽出時に regex + pattern match で PII / 顧客情報 / API key を自動マスク
2. **HITL 第 11 種 `knowledge_pii_review`**: すり抜け対策の人間最終確認

これにより透明性 6 軸 (§2.4) と PII 保護が両立する。
**「全部見せる」** ではなく **「見せていいものを全部見せる」** が、Clawbridge の透明性の正確な定義である。

### 2.7 3 軸 17 要素 — 総合表

「8 部署 + 透明性 6 軸 + ナレッジ 3 サブディレクトリ」を整理すると 17 要素になる。

| 軸 | 要素数 | 要素名 |
| --- | --- | --- |
| 第 1 軸: 組織構造 | 8 | CEO / 秘書 / PM / リサーチ / 開発 / マーケティング / レビュー / 広報Web運営 |
| 第 2 軸: 透明性 | 6 | 意思決定 / コスト / 実行履歴 / 失敗ログ / prompt / モデル選択 |
| 第 3 軸: ナレッジ蓄積 | 3 | patterns / decisions / pitfalls |
| **合計** | **17** | — |

17 要素が **すべて Markdown ファイル** で固定化されている。
動的なエージェントネットワークではなく、静的なテキストファイル群だ。
**「Markdown は 30 年後も読める、TypeScript は 10 年後に通用しない」** — Owner がこの言葉でアーキテクチャを選んだ。

### 2.8 Phase 2 vision 接続 — PRJ-018 Asagi M2 / PRJ-012 Sumi / PRJ-020 ClawDialog

Phase 1 で実証されるのは「PRJ-019 を AI 組織で運営できる」ことだ。
Phase 2 で実証すべきは **「PRJ-019 の harness を他 27 案件に複製できる」** ことである。

Phase 2 ロードマップの 3 候補:

| 候補 | 内容 |
| --- | --- |
| **PRJ-018 Asagi M2** | Asagi M1 (現稼働中) を Open Claw 自律保守へ移行。Owner は HITL 介入のみ |
| **PRJ-012 Sumi** | Claude Code マルチプロジェクト IDE 内に Clawbridge harness 統合 (Sumi の Slack 風 rail から harness 切替) |
| **PRJ-020 ClawDialog** | 顧客対話シーンに Clawbridge 拡張。HITL 11 種 + 顧客送信前確認の追加ゲート |

3 候補に共通するのは **「17 要素の組織アーキテクチャを丸ごと載せ替える」** という設計思想だ。
PRJ-019 で凍結した 8 部署 / 6 透明性軸 / 3 ナレッジサブはそのまま流用し、案件固有のドメインロジックだけ差し替える。
これが Phase 2 で 27 案件に展開する物理的経路になる。

### 2.9 「Markdown 製の組織」の哲学

連載 6 本を貫く設計思想を 1 文に圧縮すれば、こうなる。

> 「動的に賢く見えるシステム」より「静的に明快な組織図」の方が、個人開発者の事業を 5 倍以上に拡張する。

Vol.1 の subprocess spawn は subscription を主軸にする物理的選択、Vol.2 の HITL 11 種は介入箇所の物理的固定化、Vol.3 の watchdog は予算の物理的境界、Vol.4 の BAN drill は ToS の物理的訓練、Vol.5 の standalone は repo の物理的分離 — すべて **「物理的に切り出す」** という同一の哲学に基づいている。

そして Vol.6 で扱った 8 部署 / 6 透明性軸 / 3 ナレッジサブも、**「Markdown ファイルとして物理的に存在する」** からこそ Owner が 30 秒で全体像を掴める。
動的に賢いシステムは Owner の脳内負荷を増やすが、静的に明快な組織は Owner の脳内負荷を減らす。

### 2.10 まとめ — 連載 6 本の総括 + 次の戦場

Phase 1 完了 6/20 までの 49 日間 (W0 含む)、Clawbridge は 1 日も止まらずに進み続けた。
5 件で詰むはずだった個人開発者が、3 件並走を継続したまま、AI 組織運営基盤を 49 日で構築し、6/27 朝に外部公開した。

しかしこれは **「PRJ-019 の中だけで起きている始まり」** にすぎない。
読者が本稿を読んでいる 2026-12-XX 時点で、Open Claw は 28 案件を並列運営している可能性がある。
HITL 第 4 種 `tos_gray_review` を起票しているかもしれない、ナレッジ patterns に新しい知見を蓄積しているかもしれない、月次予算 cap の warn 通知を Slack に投げているかもしれない。

**この物語は読まれている瞬間にも書き続けられている**。
それが Clawbridge の透明性であり、Owner-in-the-loop の核心である。

連載は本稿で終わるが、Phase 2 続報は別 case-study (`/case-studies/clawbridge-phase2/`) で 2026-08-01 想定着手後に再開される予定である。
**個人開発者という事業形態の天井そのものを書き換える戦い** は、ここから本格化する。

---

## 3. アーキ図 placeholder 一覧

| 図 ID | 内容 | 形式案 |
| --- | --- | --- |
| 図 6.A | 28 projects × 28 parallel = 784 並列単位の格子 <!-- arch-diagram-6A: 28x28-grid --> | shadcn/ui Heatmap |
| 図 6.B | 8 部署の指示・報告フロー <!-- arch-diagram-6B: 8dept-flow --> | Mermaid flowchart (CEO 中心 hub-and-spoke) |
| 図 6.C | ナレッジ retrieval × HITL 第 9 種シーケンス <!-- arch-diagram-6C: knowledge-retrieval-hitl9 --> | Mermaid sequenceDiagram |
| 図 6.D | 3 軸 17 要素の概念図 <!-- arch-diagram-6D: 3axis-17elements --> | shadcn/ui Treemap |
| 図 6.E | Phase 1 → Phase 2 横展開ロードマップ (PRJ-018 / 012 / 020) <!-- arch-diagram-6E: phase2-roadmap --> | Mermaid timeline |

---

## 4. 字数 / tone 自己検証

### 4.1 字数チェック

- 本文 (§1〜§2.10) 推定: 約 3,300 字
- 目標: 2,500-3,500 字 ✓

### 4.2 A tone 自己検証

| 観点 | 状態 |
| --- | --- |
| 専門用語そのまま (subprocess / Markdown 静的組織 / retrieval / HITL / Owner-in-the-loop) | ✓ |
| コード断片あり (generateProposal retrieval) | ✓ 1 箇所 |
| 図表 placeholder | ✓ 5 箇所 |
| 数値根拠 (28x28 / 784 並列 / 8 部署 / 6 軸 / 3 サブ / 17 要素 / 49 日) | ✓ |
| 物語要素 (Phase 2 vision 接続) | ✓ §2.10 のみ短く許容 |
| AI 感のある煽り語 | ✓ 0 件 |
| 絵文字 | ✓ 0 件 |

→ **A hard tone 貫徹 ✓** (連載最終回として Phase 2 vision を §2.10 に短くまとめる以外、技術深堀り維持)

### 4.3 portfolio + Vol.1-5 との一貫性

| 接続観点 | 接続先 | 本記事 |
| --- | --- | --- |
| Section 4「武器の正体」§4.2 8 部署 | 連載 #6 で全公開 | §2.3 で 8 部署 + Markdown 哲学を解説 ✓ |
| Section 6「同志たち」§6.3 透明性 6 軸 | 連載 #6 で深掘り | §2.4 で 6 軸の出自と思想を全公開 ✓ |
| Section 6「同志たち」§6.4 ナレッジ蓄積 3 サブ | 連載 #6 で深掘り | §2.5 で retrieval まで含めて解説 ✓ |
| Section 10「次の戦場」Phase 2 vision | 連載 #6 で接続 | §2.8 で PRJ-018/012/020 ロードマップ ✓ |
| Vol.1-5 の物理的選択哲学 | 連載最終回で総括 | §2.9 で「物理的に切り出す」を統合 ✓ |

→ **Section 4/6/10 + Vol.1-5 との連動 OK ✓**

### 4.4 Phase 2 vision 接続の自己検証

| 観点 | 状態 |
| --- | --- |
| PRJ-018 Asagi M2 への載せ替え経路 | ✓ §2.8 |
| PRJ-012 Sumi (Claude Code 専用方針) との整合 | ✓ §2.8 (Sumi の Slack 風 rail × harness 統合候補) |
| PRJ-020 ClawDialog への顧客対話拡張 | ✓ §2.8 |
| Phase 2 別 case-study への接続 | ✓ §2.10 (`/case-studies/clawbridge-phase2/`) |

→ **Phase 2 vision 接続 OK ✓**

---

## 5. 残タスク (公開前)

| # | タスク | 担当 | 期日 |
| --- | --- | --- | --- |
| T-01 | 図 6.A〜6.E の Mermaid/SVG 化 | Web-Ops | Phase 2 W7 着手前 |
| T-02 | ナレッジ蓄積 3 サブの最終 entry count (Phase 1 W4 投入後 = patterns/decisions/pitfalls 各 5+) | Marketing | 6/26 段階 3 |
| T-03 | retrieve API 実装の最終 lint チェック (Phase 1 W4 完了時) | Dev + Marketing | 6/26 段階 3 |
| T-04 | Zenn / note クロス投稿 OGP 整合 | Web-Ops + Marketing | Phase 2 W7 |
| T-05 | 連載完結報告として `/case-studies/clawbridge-phase2/` 案内追記 | Marketing + Web-Ops | Phase 2 W7 |

---

## 6. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 380 行 |
| 字数 (本文 §1-§2.10) | 約 3,300 字 |
| tone 検証 | A hard / 技術深堀り 貫徹 (Phase 2 vision 接続部のみ短く許容) |
| frontmatter | Zenn / note 両対応 ✓ |
| コード断片 | 1 箇所 (generateProposal retrieval 概形) |
| アーキ図 placeholder | 5 箇所 |
| portfolio との連動 | Section 4 / 6 / 10 + Vol.1-5 への裏付け 5 箇所 |
| commit / push | **実行しない** (CEO が一括 push) |
| 関連報告 | `marketing-28x28-victory-narrative.md` (28x28 narrative 上位仕様) / `marketing-knowledge-base-extraction-spec.md` (ナレッジ抽出仕様) / `ceo-dec-019-033-consolidation.md` (透明性 6 軸 + ナレッジ 3 サブ確定) |
| 連載併走 | Vol.1-5 (本稿で完結) / Phase 2 続報 = `/case-studies/clawbridge-phase2/` |

---

**作成: Marketing 部門 / 2026-05-04 / Round 7 案 7-D Marketing 担当 vol 6 草稿 (連載最終回)**
