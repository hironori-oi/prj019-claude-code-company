---
最終更新日: 2026-05-03
起案: Marketing Department
---

# PRJ-019 Clawbridge — 28/28 完全勝利 訴求コンテンツ素材

- 案件: PRJ-019 Clawbridge
- 起票: Marketing 部門
- 用途: 自社 HP `/case-studies/openclaw-runtime` LP / ブログ記事 / SNS 投稿 / FAQ の素材集
- 関連:
  - `projects/PRJ-019/reports/marketing-owner-gate-messaging-update.md`（28 競合 × 28 評価軸の一次比較表 50 表、本書はそこから訴求素材を抽出）
  - `projects/PRJ-019/reports/marketing-portfolio-integration-plan.md`（マスタープラン §6 視覚化と整合）
- ステータス: 素材確定（Phase 1 W4 で実際の画像 / インフォグラフィック生成へ引き渡し）
- 注意: 28 競合の名称・評価軸の一次根拠は `marketing-owner-gate-messaging-update.md` 既存内容に従う。本書では新規調査を行わず、訴求コンテンツの再構成のみ実施。

---

## §1. 28 競合 × 28 評価軸の整理（既存ポジショニングからの再構成）

### 1.1 28 競合の 5 カテゴリ分類

| カテゴリ | 競合数 | 代表 |
|---|---|---|
| エディタ統合系 | 8 | Cursor, Cline, Windsurf, Continue, Cody, Tabnine, Copilot for IDE, Codeium |
| 自律エージェント系 | 12 | Devin, OpenHands, Aider, AutoGPT, BabyAGI, MetaGPT, AgentGPT, GPT Engineer, Smol Developer, Sweep, Plandex, Cline-autonomous |
| 組織運営系 | 5 | CrewAI, AutoGen, LangGraph, Multi-Agent Orchestrator, Swarm |
| クラウド統合系 | 3 | GitHub Copilot Workspace, Replit Agent, Vercel v0 |
| **当社** | **1** | **Clawbridge（PRJ-019）** |

### 1.2 28 評価軸の 5 グループ整理

| グループ | 軸数 | 代表軸 |
|---|---|---|
| **透明性（Transparency）** | 6 | 意思決定ログ公開 / コスト可視化 / 実行履歴可視化 / 失敗ログ公開 / 内部 prompt 開示 / モデル選択透明性 |
| **Owner control（人間制御）** | 7 | HITL ゲート数 / 緊急停止 SLA / 権限細粒度 / 取り消し可能性 / 承認 audit 完全性 / 物理不可能化境界 / Owner override 範囲 |
| **harness engineering** | 6 | 権限境界明示 / 副作用ゼロ証明 / mock-first 検証 / TimeSource 注入 / kill-switch / 二重防御 |
| **法令適合（Compliance）** | 5 | ToS 準拠 / 監査ログ法令適合 / GDPR / SOC2 適応性 / プライバシー設計 |
| **コスト効率（Cost）** | 4 | 予算ハードキャップ / 月次コスト透明化 / 段階移行設計 / 無料 tier 活用 |
| **計** | **28** | |

### 1.3 28 軸全勝利の根拠（要約）

`marketing-owner-gate-messaging-update.md` の一次比較で、当社 Clawbridge は 28 軸すべてで **「最高水準」または「唯一達成」** を獲得。次点 Cursor は 11 軸でしか同水準に達しておらず、**当社は次点の 2.5 倍のスコア密度**を実現している。

---

## §2. ストーリー軸 5 本

ポートフォリオ §S2〜S6 の各セクション、ブログ記事、SNS 投稿、LP コピーで一貫して使うナラティブ軸。

### §2.1 軸 1: 透明性（Transparency）

> 商用自律エージェントの多くは「黒箱」のまま動作する。当社 Clawbridge は意思決定ログ、コスト、実行履歴、失敗ログをすべて Owner が見られる場所に置いた。透明性は信頼の前提条件である。

中核データ: 透明性 6 軸全勝利、競合平均 2.3/6、当社 6/6。

### §2.2 軸 2: Owner control（人間制御）

> AI 組織が AI 組織を運営する時代でも、最終判断は人間が握る。HITL 9 種・10 種・11 種の三層ゲートと、service_role 物理分離による権限の物理不可能化が当社の差別化点。

中核データ: HITL 種類数 = 当社 11 種、競合最大 4 種（Cursor）。緊急停止 SLA = 当社 < 30 秒、競合中央値 5 分以上。

### §2.3 軸 3: 知見蓄積（Knowledge accumulation）

> 案件が終わったら知見が消える組織は、永遠に同じ落とし穴を踏み続ける。当社は `organization/knowledge/` に patterns / decisions / pitfalls の 3 構造で自動蓄積し、次案件起案時に提案書へ自動引用する仕組みを組み込んだ。

中核データ: ナレッジ自動抽出機構を持つ競合 = 0/28、当社のみ。

### §2.4 軸 4: 法令適合（Compliance）

> AI コーディング基盤の利用規約は流動的で、半年で前提が変わる。当社は ToS 解釈プロセスを文書化し、半年ごとに能動的に再評価する。

中核データ: ToS 準拠 + 半年再評価フロー = 当社のみ採用。

### §2.5 軸 5: コスト効率（Cost efficiency）

> PoC を月 $300 ハードキャップ内で 4 週間完遂した。中小企業の発注検討者にとって、コスト感は最も具体的な信頼指標である。

中核データ: 月次予算ハードキャップ運用 = 当社のみ明示、cap 余裕 41→54%、Vercel 段階移行設計あり。

---

## §3. ブログ記事タイトル候補 10 本以上

### 3.1 透明性 / Owner control 系

1. 「AI 組織が AI 組織を運営する」現場で、人間は何を承認しているか
2. HITL 11 種ゲート設計：自律エージェントに「やらせない」を実装する 11 個の判断点
3. 緊急停止 SLA < 30 秒を実現する harness 設計
4. service_role 物理分離：権限の「物理的に不可能」を実装する

### 3.2 harness engineering 系

5. 9 必須コントロールから 44 必須コントロールへ：4 週間 PoC で増やしたものの全リスト
6. mock-first + TimeSource pattern：自律エージェント向けテスト工学
7. 副作用ゼロを grep で証明する：3 重チェックの実装

### 3.3 知見蓄積 / 組織運営系

8. `organization/knowledge/` の 3 サブディレクトリ設計：patterns / decisions / pitfalls
9. 3 案件並走時のリソース配分マトリクス：個人開発組織で運用しているもの
10. ナレッジ自動引用を提案書に組み込む：HITL 第 9 種ゲート直前の retrieval 設計

### 3.4 コスト / 法令適合系

11. 月 $300 ハードキャップで PoC を 4 週間：コスト構造の全公開
12. AI コーディング基盤の ToS を半年ごとに能動再評価する手順

### 3.5 公開タイミングと炎上対策（メタ視点）

13. ポートフォリオ公開を「土曜朝」に固定する理由：炎上時の即時対応バッファ

**Phase 1 完了後の公開判断**: 採択された Q-Mkt-06「`/blog` 1 本採用しない、誘導導線 Contact form のみ」に従い、**Phase 1 段階ではブログ公開は行わない**。本タイトル候補は Phase 2 以降の素材として保管する。

---

## §4. LP コピー候補

### 4.1 HERO セクション（採択済 A 案 + Mkt-Update-01 サブコピー）

```
[h1]
AI 組織が AI 組織を運営する

[sub-head]
Owner-in-the-loop transparent AI org.
オーナー承認下で AI 組織が AI 組織を運営する。

[lead]
自社プロダクトを 4 週間で安全に検証するために、商用 AI コーディング基盤を組み合わせた自律運用 PoC の harness 設計と運用結果を公開します。

[primary CTA]
Contact: 中小企業の Web アプリ開発をご相談ください
```

### 4.2 機能セクション（5 ブロック構成）

#### F1. 透明性（Transparency）
```
[h2]
意思決定もコストも、すべて Owner が見える場所に
[body]
意思決定ログ、コスト、実行履歴、失敗ログを 6 軸すべて公開設計。
透明性は信頼の前提条件です。
[metric]
透明性 6 軸 すべて達成（競合平均 2.3/6）
```

#### F2. Owner control（Owner gate）
```
[h2]
HITL 11 種ゲートと、物理的に不可能な権限境界
[body]
人間が必ず承認する 11 個の判断点と、service_role 物理分離による
「権限の物理不可能化」を組み込みました。緊急停止 SLA は 30 秒未満。
[metric]
HITL ゲート種類数 11（競合最大 4）／緊急停止 SLA < 30 秒
```

#### F3. harness engineering
```
[h2]
9 必須コントロールから 44 必須コントロールへ
[body]
4 週間 PoC を通じて、必要なコントロールを 9 → 34 → 44 と段階的に増やしました。
副作用ゼロを grep + 自動スクリプト + git history の三重で証明しています。
[metric]
67 → 83 → N テスト全緑／副作用ゼロ証明済
```

#### F4. 知見蓄積
```
[h2]
案件が終わると、知見が次の案件の提案書に自動引用される
[body]
patterns / decisions / pitfalls の 3 構造で organization/knowledge/ に蓄積。
HITL 第 9 種ゲート直前で retrieval し、提案書 §(f) に自動引用します。
[metric]
ナレッジ自動引用機構搭載（競合 0/28）
```

#### F5. コスト効率
```
[h2]
月 $300 ハードキャップ内で 4 週間 PoC を完遂
[body]
予算上限を物理的に超えられない設計、Vercel Hobby → Pro の段階移行判断、
無料 tier の活用設計まで全公開。
[metric]
月次予算 $300 ／ cap 余裕 54%
```

### 4.3 FAQ（HERO 下 / フッタ近接）

詳細は §6 競合反論 FAQ を参照。

---

## §5. SNS 短文（X 280字 / LinkedIn 1300字）各 5 本

Q-Mkt-07 採択（プレス NG / SNS は X 1 投稿のみ）に従い、**実投稿は 1 本のみ**。残り 4 本は Phase 2 以降の素材保管。

### 5.1 X 280字 候補 5 本

#### X-1（公開時 採用候補、誘導テキスト + URL のみ）
```
PRJ-019 Clawbridge の事例ページを公開しました。
Owner-in-the-loop transparent AI org として、4 週間 PoC の harness 設計と運用結果をまとめています。
https://（URL）
#AI組織 #harnessengineering
（170 字）
```

#### X-2（Phase 2 以降保管、透明性軸）
```
透明性 6 軸（意思決定 / コスト / 実行履歴 / 失敗ログ / prompt / モデル選択）すべて公開しました。
競合平均 2.3/6 に対して 6/6。
透明性は信頼の前提条件です。
事例: https://（URL）
（150 字）
```

#### X-3（Phase 2 以降保管、Owner control 軸）
```
HITL 11 種ゲートと service_role 物理分離。
AI 組織に「やらせない」を 11 個の判断点で実装しています。
緊急停止 SLA は 30 秒未満。
事例: https://（URL）
（130 字）
```

#### X-4（Phase 2 以降保管、コスト軸）
```
月 $300 ハードキャップで 4 週間 PoC 完遂。
中小企業の Web アプリ開発でも、この感覚で予算設計しています。
事例: https://（URL）
（110 字）
```

#### X-5（Phase 2 以降保管、知見蓄積軸）
```
ナレッジが次案件の提案書に自動引用される機構を組み込みました。
patterns / decisions / pitfalls の 3 構造です。
事例: https://（URL）
（100 字）
```

### 5.2 LinkedIn 1300字 候補 5 本（Phase 2 以降保管）

#### LI-1（透明性軸、リード文 + 5 段構成）
> AI 組織を運営する上で、私たちが最も重要視したのは「透明性」でした。商用自律エージェントの多くは黒箱で動作しますが、Owner が意思決定ログ・コスト・実行履歴・失敗ログをいつでも参照できる状態を 6 軸すべてで実装しました。
> 競合 28 社との一次比較で、透明性 6 軸全勝利。次点でも 4 軸どまりです。
> なぜ透明性が必要か。それは「信頼」の前提条件だからです。Owner-in-the-loop transparent AI org を実現するためには、AI 組織が何を判断し何にコストを使ったかを、人間が後から追跡可能でなければなりません。
> 当社 Clawbridge では：
> - 全ての DEC（decision）を `decisions.md` に蓄積
> - HITL 9〜11 種ゲートで人間承認を強制
> - 月次予算ハードキャップ $300 を物理的に超えられない設計
> - 失敗ログを `pitfalls/` に自動蓄積し次案件で参照
> 4 週間 PoC の運用結果を事例ページで公開しています。
> URL（後日確定）
> （約 600 字、目標 1300 字到達は本文補完で）

#### LI-2〜LI-5（Owner control / harness / 知見 / コスト軸）も同形式で保管。

### 5.3 SNS 投稿時の禁止事項（Q-Mkt-07 採択順守）

| 禁止 | 理由 |
|---|---|
| 「AI が AI を運営した！」的煽り文 | 上流 Open Claw "personal AI assistant" 再ポジションと齟齬 |
| 競合名指し批判 | LP §2.3 既定 |
| ToS 解釈の具体記載 | DEC-019-029 開示比率違反 |
| BAN リスク数値の具体引用 | 同上 |
| スレッド展開（連投） | Q-Mkt-07 静観方針違反 |

---

## §6. 画像 / インフォグラフィック 5 案（説明のみ、生成は Phase 1 で）

実際の画像生成は Phase 1 W4 で Web Ops 部門と aidesigner ツール経由で発注。本書では仕様のみ確定。

### 6.1 IMG-1: 28/28 ヒートマップ

| 項目 | 仕様 |
|---|---|
| サイズ | 1200x800px（HP 表示用） / 1200x630px（OGP 用） |
| 構造 | 縦軸 28 評価軸 / 横軸 28 競合（当社含む） / セル色 = 緑（達成）/ 黄（部分）/ 赤（未達） |
| 配色 | zinc 系背景 + 緑 #16a34a / 黄 #ca8a04 / 赤 #dc2626（design-guidelines.md 準拠） |
| 凡例 | 右下に達成基準の説明テキスト |

### 6.2 IMG-2: Mermaid quadrant chart（透明性 × Owner control）

| 項目 | 仕様 |
|---|---|
| サイズ | 1200x900px |
| 構造 | x 軸 = transparency 0-1 / y 軸 = Owner control 0-1 / 4 象限 |
| プロット | 当社 + 主要 7 競合（残 20 競合は別アコーディオンで展開） |
| 表現 | 当社のみ強調色（アクセントカラー）、他は zinc-500 |

### 6.3 IMG-3: HITL 11 種ゲート構成図

| 項目 | 仕様 |
|---|---|
| サイズ | 1200x800px |
| 構造 | 縦に 11 ゲートをタイムライン配置 / 各ゲートに「Owner 判断 / 自動承認 / 委譲」の状態色 |
| 強調 | 第 9 種（dev_kickoff_approval）/ 第 10 種（permission_change_approval）/ 第 11 種（knowledge_pii_review）の DEC-019-033 新規追加 3 種を強調 |

### 6.4 IMG-4: コスト構造円グラフ + 段階移行図

| 項目 | 仕様 |
|---|---|
| サイズ | 1200x800px |
| 構造 | 円グラフで月 $300 cap 内訳 / 右側に Vercel Hobby → Pro 段階移行のフロー図 |
| 数値 | DEC-019-028 cost 100% 開示に従い実数値を表示 |

### 6.5 IMG-5: 知見抽出フロー図

| 項目 | 仕様 |
|---|---|
| サイズ | 1200x800px |
| 構造 | `marketing-knowledge-base-extraction-spec.md` §1 の Mermaid フローを SVG 化 |
| 強調 | HITL 第 11 種 `knowledge_pii_review` ノードを強調 |

---

## §7. 競合反論 FAQ（5 件）

### Q1. 「結局 Cursor で良いのでは？」
**A**: Cursor はエディタ統合体験では優れていますが、**HITL ゲートは最大 4 種、緊急停止 SLA は分単位、ナレッジ自動引用機構は無し**です。当社 Clawbridge は「複数 AI 組織の運用」と「Owner gate の物理不可能化」が必要な領域に特化しています。エディタ単体の生産性が目的なら Cursor を、組織として AI を運用する必要があれば当社 Clawbridge をご検討ください。

### Q2. 「Devin / OpenHands のような自律エージェントで十分では？」
**A**: 自律性は素晴らしい技術ですが、**Owner が承認する仕組みが弱いほど、企業利用時のリスクは増大**します。当社は HITL 11 種ゲート + service_role 物理分離で「自律性と Owner control の両立」を設計しました。リスク受容ができる個人開発であれば自律エージェントが効率的ですが、業務利用には Owner gate が必須と判断しています。

### Q3. 「AI 組織って大袈裟では？個人開発の延長で十分」
**A**: 1 案件であれば不要です。当社は **3 案件並走 × 4 週間 × 月 $300** という制約条件で運用するため、組織化が必須でした。同じ規模の運用課題を持つチームには参考になるはずです。1 案件単位の発注であれば、当社が培った harness engineering の知見だけを Web アプリに転用してご提供します。

### Q4. 「AI 感を出さないって、結局 AI を使わないってこと？」
**A**: AI を裏側で全力活用しますが、**お客様にはクリーンで信頼性の高いプロダクトをお届け**します。AI が生成したことを誇示するためのデザインや UX 上の癖は排除し、人間が普通に使える Web アプリに落とし込みます。CLAUDE.md 事業方針「AI 感を出さないクリーンなデザイン」は当社の一貫した姿勢です。

### Q5. 「ToS リスクがあるなら、結局使えないのでは？」
**A**: 当社は **ToS 解釈プロセスを文書化し、半年ごとに能動再評価**します。受託案件では Anthropic / OpenAI の業務利用規約に完全準拠した契約形態のみで提供し、自社 PoC で経験した高リスク領域には踏み込みません。「使える / 使えない」を明確に分けて運用していることが当社の差別化です。

---

## §X 残課題

| # | 項目 | 担当 | 決裁タイミング |
|---|---|---|---|
| X1 | 画像 5 案の実生成（aidesigner 経由 or Web Ops 内製） | Marketing + Web Ops | 6/15 |
| X2 | LP コピー最終版の Owner レビュー | Marketing → CEO → Owner | 6/22 内部レビュー時 |
| X3 | X 投稿時刻（土曜朝公開と同期、9:00 JST 推奨） | Marketing | 6/27 朝 |
| X4 | LinkedIn 投稿の解禁判断（現状 Q-Mkt-07 で X のみ） | CEO | 公開後 30 日 KPI レビュー時 |

---

**起案**: Marketing Department / **最終更新**: 2026-05-03
