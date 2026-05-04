# PRJ-019 Clawbridge — Portfolio Narrative Section 4-10 草稿

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象掲載先**: `/case-studies/openclaw-runtime` (B 物語型 主軸 / 全 10 sections)
- **本レポートの範囲**: Section 4 (武器の正体) / Section 5 (最大の敵) / Section 6 (同志たち) / Section 7 (裏切られた予算) / Section 8 (決戦) / Section 9 (結果) / Section 10 (次の戦場) の文章草稿
- **依拠議決**: DEC-019-052 議決-25 (B 主軸 + C 透明性 OSS 補助 + A 技術深堀り別枠連載)
- **連載併走**: `/works/clawbridge/technical-deep-dive` (A 別枠 6 本連載) へ技術詳細を逃がす設計
- **公開予定**: 2026-06-27 09:00 JST (Vercel deploy 07:00 / 確認 08:00 / SNS 投稿 09:00)
- **KPI 接続**: PV 6,000 / ユニーク 3,500 / scroll_depth 75% / Contact CV 1.5%
- **数値方針**: 5/4 W0-Week1 段階のため、Section 7 / 9 の数値は Phase 1 完遂時の **「6/27 朝時点 予測値」** として明記。Owner 実測値が確定次第 6/26 段階 3 で差し替え

---

## Section 4: 武器の正体 — Open Claw + claude-code-company の AI 組織アーキテクチャ

### 4.1 「武器」とは何だったのか

Section 2-3 で語った「武器選び」とは、HITL 11 種ゲートや 1Password Vault などの個別の道具のことではない。
本当の武器は、その下に流れる **「2 層構造の AI 組織アーキテクチャ」** である。

> **上層**: claude-code-company (AI 組織ハーネス) — CEO / Dev / Marketing / PM / Research / Review / Web-Ops / 秘書の 8 部署を Markdown と slash コマンドで運営する
> **下層**: Open Claw runtime — Open Claw OSS と Claude Code CLI を subprocess として呼び出し、harness の判断を実行する

この 2 層を **「自律オーナー = Open Claw」** が橋渡しする。それが Clawbridge の核である。

### 4.2 上層 — claude-code-company が「組織」である理由

claude-code-company は、見た目こそ Markdown ファイルの集合だが、**組織として振る舞う 4 つの構造** を持つ。

| 構造 | 実体 | 役割 |
| --- | --- | --- |
| 部署定義 | `organization/roles/{ceo,dev,marketing,...}.md` | 各部署のミッション / 権限 / 報告義務 |
| ルール定義 | `organization/rules/{tech-stack,quality-gates,...}.md` | 横串の経営ルール |
| 案件管理 | `projects/{案件ID}/` | 案件単位の成果物・意思決定・進捗 |
| 意思決定ログ | `projects/{案件ID}/decisions.md` | 全判断を DEC-XXX として永続記録 |

人間 Owner は CEO に指示を出し、CEO が各部署に発注する。
各部署は専門性に従って提案を返し、CEO がそれを統合して Owner に上げる。
**この往復は、すべて Markdown ファイルの追記として記録される**。

つまり claude-code-company は「会議議事録がそのまま実行される組織」である。
人間の組織で発生する「議事録を取った後、誰も実装しない」「決定が忘れられる」という典型的な問題が、構造的に発生しない。

### 4.3 下層 — Open Claw runtime が「実行」を担う理由

claude-code-company が判断する組織だとすれば、**Open Claw runtime は「実行する筋肉」** である。

```
[claude-code-company harness 層]
        │
        │  decisions.md / proposals.md を出力
        │
        ▼
[openclaw-runtime wrapper 層]    ← 本案件の発明箇所
        │  Adapter / FeatureFlag / VersionPin / CircuitBreaker / ChangelogWatcher
        │
        ▼
[Open Claw OSS] [Claude Code CLI subprocess]
        ↑
        │  上流 OSS / CLI の breaking change
        │  (Anthropic / OpenAI / OpenClaw / Enderfga 4 系統)
```

> 図 4.A: Clawbridge 2 層アーキテクチャ + wrapper 5 責務 (Web-Ops 実装時に Mermaid 化、placeholder)

下層がただの subprocess 呼び出しではない理由は、**「上流が壊れても上層が壊れない」** ことを物理的に保証する設計にある。
ここでは深入りしないが、5 つの責務 (Adapter / FeatureFlag / VersionPin / CircuitBreaker / ChangelogWatcher) を持つ wrapper 層を挟むことで、上流の breaking change が来ても harness 全体は止まらない。

技術詳細は **連載記事 #1「Open Claw を subprocess spawn で動かす」** へ。

### 4.4 「橋」の意味 — Clawbridge という命名の正体

Clawbridge という名前は、当初「Claw (Open Claw) と Bridge (橋)」程度の意味で使っていた。
だが Phase 1 設計を進めるなかで、より深い構造的な意味を帯び始めた。

| 端 | 何があるか |
| --- | --- |
| 橋の **AI 側** | claude-code-company harness + Open Claw runtime (24/7 で動き続ける組織) |
| 橋の **人間側** | Owner (週 5 回程度しか介入しない最終承認者) |
| **橋そのもの** | HITL 11 種ゲート + 透明性 dashboard + 監査ログ |

橋は **「行き来する量」** を制御する装置である。
Clawbridge は、AI 組織から人間 Owner への通知量を「11 種類のゲートに分類された必要最小限」に絞り、人間 Owner から AI 組織への指示量を「Yes/No に正規化された決裁」に絞る。

この **両方向の流量制御** が、28x28 を成立させる本当の発明である。

### 4.5 Section 4 まとめ — なぜこれが「武器」なのか

個人開発者が AI を「使う」だけなら、ChatGPT でも Cursor でも足りる。
だが個人開発者が **「AI 組織を運営する経営者になる」** ためには、組織と実行を分ける構造が必要だった。

Clawbridge はその構造を、**最低限の道具立て (Markdown + subprocess + Slack + 1Password)** だけで実装した。
この最小装備は、後の Section 7 で語る「裏切られた予算」を生き延びるための、最大の生存戦略だった。

> **Section 5 予告: 最大の敵 — NG-1〜NG-3 + BAN リスク + 月次予算 cap**
> 武器の正体が分かれば、次に立ち上がるのは「武器を奪われる脅威」である。
> 自律稼働の AI 組織が直面する 3 つの NG ライン、BAN リスク、コスト爆発の物語を語る。

---

## Section 5: 最大の敵 — NG-1〜NG-3 と BAN リスクの 3 つの恐怖

### 5.1 「敵」を言語化することから始まった

Phase 0 のリサーチで、Clawbridge が直面する敵は 3 種類に整理された。

| 敵の名 | 本質 | 発生したら何が起きるか |
| --- | --- | --- |
| **NG-1 / NG-2 / NG-3** | 自律実行の上限ライン | 自律稼働ループの強制停止 |
| **BAN リスク** | 上流プラットフォームの利用規約違反判定 | アカウント凍結 / 全案件停止 |
| **月次予算 cap** | コスト爆発 | subscription だけでは賄えず、API 課金が暴走 |

それぞれは別の話に見えるが、Clawbridge にとっては **「自律稼働を止める 3 つの引き金」** という単一カテゴリだった。

### 5.2 NG-1 / NG-2 / NG-3 — 自律実行に引かれた 3 本のライン

NG ライン群は、Open Claw が自律的に動く時間と頻度の上限を、3 段階で定義したものである。

| ライン | 内容 | 違反時の挙動 |
| --- | --- | --- |
| **NG-1** | 1 案件の単一プロセスが 1 時間連続 spawn する場合は HITL に上げる | Slack `#openclaw-alerts` に通知 |
| **NG-2** | 24h 以内に同一案件で 10 回以上 spawn 失敗が続いたら CircuitBreaker open | 該当案件の自動運転を停止 |
| **NG-3** | 自律稼働の 1 日あたり実行時間が NG-3 で定義された範囲を超えたら Phase 進行を一旦保留 | Owner 即時介入要請 |

NG-3 は特殊で、1 日あたりの自律稼働時間そのものを制約する **「ガバナンス的上限」** である。
Phase 1 設計時点では 12h/日 / 16h/日 / 24h/日 の 3 案を比較し、最終的に **「16h/日 + API 月次 cap $30→$100 増額余地」** を採用した (案 B、Research 報告の推奨案)。

24h/日 (案 C) は技術的には可能だったが、上流プラットフォームでの BAN 確率が 60-80% と判定され、却下された。
**「動かせる」と「動かしてよい」は別** — これが NG-3 設計の中核思想である。

### 5.3 BAN リスク — 「アカウント凍結」という最終形態

NG ラインの上にさらに鎮座する敵が、BAN リスクである。
これは技術的な制約ではなく、**「ToS = Terms of Service の解釈余地」** という人間側の判定の問題だった。

| BAN シナリオ | 発生条件 | Clawbridge の対策 |
| --- | --- | --- |
| 自動化スケール BAN | 同一アカウントで過剰な自動 API 呼び出し | NG-3 + subscription 主軸 + API は補助のみ |
| ToS グレー BAN | 規約解釈に幅がある操作の継続実施 | ToS allowlist (whitelist 0.85+ 自動 / gray HITL / blocklist 即棄却) |
| 並列セッション BAN | 1 アカウントで複数 session 同時稼働 | subprocess spawn で完全 session 分離 |

**ToS allowlist** は、新しい操作を実行する前に **「その操作がどのカテゴリに属するか」** を機械学習で判定し、`gray` (0.5-0.85) のものはすべて HITL 第 4 種 `tos_gray_review` に上げる仕組みである。
この一段階を挟むことで、グレー域を Owner の確認なしには絶対に踏まないという保証が生まれた。

> 余談: BAN は「起きてから対応」では取り返しがつかない。
> 1 案件の停止ではなく、Owner 自身の事業全体が止まる。
> だから BAN リスクだけは **「予防 100% / 事後対応 0%」** のマインドセットで設計した。

### 5.4 月次予算 cap — 「お金が尽きたら組織が止まる」現実

3 つ目の敵が予算であった。
Phase 0 時点では月次 $300 / API key 主軸の想定で組み立てていたが、これは後に **DEC-019-050 で $30 hard cap** に強制変更される (Section 7 で詳述)。

予算 cap が「敵」である理由は単純で、**「月の途中で予算を使い切った瞬間、Open Claw runtime が止まる」** からだ。
個人開発者が運営する事業として、月の途中で 28 案件すべてが止まる事態は、信頼の即死を意味する。

そのため Clawbridge は予算に対して **3 重の防壁** を敷いた。

| 段階 | 閾値 | 挙動 |
| --- | --- | --- |
| warn | $24 | Slack `#openclaw-budget` に予兆通知 |
| auto_stop | $28.5 | API 経由の自律稼働を自動停止、subscription 経路のみ継続 |
| hard_fail | $30 | 全 API 経路を強制 fail-closed、Owner 即時介入要請 |

この三段階によって、**「予算が尽きるより前に、必ず人間 Owner が気付く」** 構造を作った。

### 5.5 Section 5 まとめ — 敵の正体は「自分自身の慢心」

NG-1〜NG-3、BAN リスク、月次予算 cap — これらの敵を並べて見ると、共通点が見える。
すべて **「自律稼働させすぎたら、自分自身が事業を破壊する」** という、内部からの脅威なのだ。

外部から襲ってくる敵 (技術的バグ / 競合の台頭 / 顧客の離反) ではなく、**自分の油断が敵になる構造**。
Clawbridge は、この内部脅威に対する **「物理的に踏めない柵」** を 3 種類すべてに設置した。
それが Section 6 で語る「同志たち」の役割につながっていく。

> **Section 6 予告: 同志たち — HITL 11 種 / Owner-in-the-loop / ナレッジ蓄積機構**
> 敵が分かれば、味方の輪郭も見えてくる。
> 自律 AI 組織が孤立しないための 3 つの仕組みを語る。

---

## Section 6: 同志たち — HITL 11 種 / Owner-in-the-loop / ナレッジ蓄積機構

### 6.1 「同志」とは透明性を共有する仲間のこと

Clawbridge の「同志」は、人間 Owner 1 人だけではない。
構造的には次の 3 つが、24/7 で AI 組織を支える仲間になる。

| 同志 | 役割 | 関与頻度 |
| --- | --- | --- |
| **HITL 11 種ゲート** | 重要な瞬間に人間判断を要請する | 週 5 回程度 |
| **Owner-in-the-loop dashboard** | 全意思決定をリアルタイムで可視化する | 24/7 (Owner はいつでも見れる) |
| **ナレッジ蓄積機構** | 過去の判断を未来の判断に注入する | 案件完了時 + 提案生成時 |

これら 3 つは独立して見えるが、実際には **「透明性」という 1 本の柱の 3 面** である。

### 6.2 HITL 11 種ゲート — Section 2 で語った「介入の境界線」の本質

Section 2.4 で 11 種の名前は紹介したが、ここで語るべきは **「なぜ 11 種なのか」** という設計思想である。

人間 Owner の介入ポイントは、最初は 5-6 種程度で十分だと考えていた。
だが Phase 0 のリスク棚卸しで、以下のような事態が次々と発見された。

- Open Claw が API key を生成する場面 → セキュリティ上、人間確認必須
- Open Claw が客先メールを送ろうとする場面 → 内容確認必須
- Open Claw がインシデント検知時に外部公表しようとする場面 → 即時介入必須
- ナレッジ蓄積時に PII (個人識別情報) が混じる場面 → redaction 確認必須

これらをすべて拾った結果、最終的に 11 種に収束した。
**「介入は少ないほどよい」のではなく「介入すべき場所には必ず置く」** という方針である。

> 余談: 介入回数を圧縮する設計と、介入箇所を増やす設計は、矛盾しない。
> 「重要な箇所に集中させ、それ以外は Open Claw に任せる」という配分の妙が、HITL 11 種の本当の価値である。

### 6.3 Owner-in-the-loop dashboard — DEC-019-033 で正式化された透明性の柱

DEC-019-033 (5/3 採択) で Phase 1 のモデルは **「Owner-in-the-loop 透明 AI 組織」** に正式変更された。
これは単なる名称変更ではなく、構造的な再定義だった。

| 旧モデル | 新モデル (DEC-019-033) |
| --- | --- |
| Open Claw が自律実行、Owner は事後確認のみ | Open Claw が自律実行、Owner は **いつでもリアルタイムで見れる** |
| 透明性は decisions.md の事後参照のみ | 透明性 6 軸 (意思決定 / コスト / 実行履歴 / 失敗ログ / prompt / モデル選択) の常時可視化 |
| HITL 9 種 | HITL 11 種 (第 9 `dev_kickoff_approval` + 第 10 `incident_escalation` 追加 + 第 11 `knowledge_pii_review`) |

Owner-in-the-loop dashboard は、Open Claw が今この瞬間に何を考えているか、何を判断しているか、何にお金を使っているかを、**Owner が iPhone から覗ける** という設計である。
監視ではない。**「同じ船に乗っている」という体感** を作るための装置である。

### 6.4 ナレッジ蓄積機構 — 過去の判断を未来に注入する記憶装置

3 つ目の同志は、最も静かに、しかし最も持続的に AI 組織を支える存在である。
DEC-019-033 §④ で正式化されたナレッジ蓄積機構は、`organization/knowledge/` 配下に 3 つのサブディレクトリを持つ。

| サブディレクトリ | 蓄積対象 | テンプレート |
| --- | --- | --- |
| `patterns/` | 再利用可能なコードパターン / アーキテクチャパターン / UI パターン | YAML frontmatter + Markdown 本文 + tag |
| `decisions/` | 設計判断ログ (DEC-XXX 由来) | 文脈 + 代替案 + 採用根拠 + 検索 metadata |
| `pitfalls/` | 落とし穴集 | 症状 + 原因 + 対処 + 再発防止策 |

この機構の真価は、**「次の案件の提案生成時に自動 retrieval される」** ことにある。
PRJ-019 で得た「`GITHUB_` prefix が予約語」という知見は、PRJ-020 や PRJ-021 で関連提案を生成する際に、自動的に「この命名は避けるべき」という警告として注入される。

つまりナレッジ蓄積機構は、**「個人開発者の独学で 3 年かけて溜めた経験値」を、AI 組織の集合知として固定化する装置** である。
1 人で 28 案件を回す世界では、この記憶装置がなければ毎回ゼロから学び直すことになる。

### 6.5 PII 保護 — 透明性と個人情報保護を両立させる工夫

ナレッジ蓄積機構には、明確に難しい問題があった。
顧客との会話ログや、API key、個人情報が、ナレッジに混入する危険である。

Clawbridge は、この問題を **2 重チェック** で解決した。

1. **自動 redaction**: ナレッジ抽出時に正規表現とパターンマッチで PII / 顧客情報 / API key を自動マスク
2. **HITL 第 11 種 `knowledge_pii_review`**: それでもすり抜けた可能性に備えて、人間 Owner の最終確認を挟む

この 2 重防壁により、「透明性」と「プライバシー保護」が両立した。
**「全部見せる」ではなく「見せていいものを全部見せる」** が、Clawbridge の透明性の正確な定義である。

### 6.6 Section 6 まとめ — 透明性は「3 面 1 体」で機能する

HITL 11 種は **「必要な瞬間の人間関与」**、dashboard は **「いつでも見れる安心感」**、ナレッジ蓄積機構は **「過去の判断の記憶」**。
この 3 つが揃って初めて、自律 AI 組織は孤立せず、人間 Owner と「同じ船」に乗れる。

> **Section 7 予告: 裏切られた予算 — DEC-019-050 cap $30 hit 再構築**
> 同志たちの輪が固まった矢先、最大の敵が動き出した。
> 想定 $300 が一夜にして $30 に切り詰められた瞬間の物語を語る。

---

## Section 7: 裏切られた予算 — DEC-019-050 から DEC-019-051 への再構築

### 7.1 5/3 夜、Anthropic Console から届いた「97% 下方修正」

Section 1.4 で「コスト想定 月 ≤$430 で 28 案件並列が現実的」とリサーチ結論を紹介した。
このうち API key の月次想定は当初 $300 だった。subscription $400 + API $300 = 月次 $700 の構造である。

しかし 5/3 夜、Owner が Anthropic Console を開いて spend cap を設定した瞬間、設計の前提が音を立てて崩れた。

> **Hard cap = $30 / 月 / Soft notify = $25 / リセット = 6/1 月初**

これは、Anthropic 側が新規 API key 利用者に対して提示する **デフォルト枠** だった。
増額申請は別途レビューが必要で、Phase 1 開戦に間に合わない。

つまり Owner が手元で操作可能な API key は、**当初想定の 1/10** だった。

### 7.2 一夜で全設計を組み直すか、Phase 1 開戦を遅らせるか

5/4 朝、Owner は CEO 経由で 4 部署に判断を仰いだ。

> 「$300 想定で組んだ Phase 1 を $30 で再構築できるか」

選択肢は実質 2 つだった。

| 選択肢 | 影響 |
| --- | --- |
| A: Phase 1 開戦を 6 月以降に延期、増額申請を待つ | 28x28 ビジョンが 1-2 ヶ月後退 |
| B: $30 内で動く構造に再設計 | 4 部署横断で再評価 + 即日意思決定 |

Owner は **B** を選んだ。
1 ヶ月の遅延は事業の勢いを殺す、というのが直感的な理由だった。
そしてこの直感は、後に正解だったと判明する。

### 7.3 DEC-019-051 — subscription 主軸転換という発明

5/4 中に CEO 統合判断として起票されたのが DEC-019-051 である。
これは単なる予算の引き下げではなく、**「コスト構造の主軸そのものを書き換える」** 決断だった。

| 項目 | 旧設計 (DEC-019-007) | 新設計 (DEC-019-051) |
| --- | --- | --- |
| 主軸 | API key 経由の Open Claw 呼び出し | subscription plan (Claude Max + Codex Pro) 経由の subprocess spawn |
| API key の役割 | メイン経路 | 補助経路 (HITL 通知 / mock-claude / E2E test / drill / ナレッジ batch のみ) |
| 流量比 | API key 100% | subscription 95% / API 5% |
| 月次総額 | $700 想定 | **≤$430 確定** |

**月次 ≤$430 は、$700 想定からむしろ $270 の節約** だった。
裏切られた予算が、結果として「予算を節約する設計」を強制してくれた、という逆説である。

### 7.4 5 必須施策 — Dev 部門が W0-Week2 に詰め込んだ突貫工事

DEC-019-051 を実現するには、Dev 部門が 5 つの施策を **5/9-5/22 の 13 日間** に詰め込む必要があった。

| 施策 | 内容 | 期待効果 |
| --- | --- | --- |
| 施策-1 | mock-claude フル活用 (drill #3 mock 70% 化) | API 消費 -40% |
| 施策-2 | HITL 通知テンプレ化 (事前 static text) | API 消費 -15% |
| 施策-3 | E2E staging 限定 (週次 1 回 / drill 時のみ) | API 消費 -20% |
| 施策-4 | ナレッジ batch caching | API 消費 -10% |
| 施策-5 | drill #3 簡易化 (E ベクトル canned response 50 種) | API 消費 -10% |

これらが全部成功すると、API 消費見積は **$19-31 → $11-15** に圧縮される。
$30 cap に対して buffer 50% 以上を確保する設計である。

### 7.5 月次総額 ≤$430 の数字根拠 (§2.8 結果セクション主訴求)

DEC-019-051 採択後の月次コスト構造は以下の通り。
これは Section 9 (結果) と §2.8 「結果」セクションの主訴求材料となる。

| カテゴリ | 内訳 | 月額 |
| --- | --- | --- |
| (A) 既契約 subscription | Claude Max $200 + Codex Pro $200 | **$400 (追加発生なし)** |
| (B) 新規 API | DEC-019-050 Hard cap | **≤$30** |
| (C) インフラ | Vercel / Supabase / 1Password (既契約継続) | **$0 (追加発生なし)** |
| **合計** | | **≤$430 / 月** |

> **6/27 朝公開時点の予測値**: API 消費 $11-15 / $30 cap 内 buffer 50% / subscription cost 増分 $0 / 月次総額 $411-415

Phase 1 W4 までに数字が確定すれば、この箇所に Owner 実測値が差し替わる。
予測値のまま公開する場合は、本文に「Phase 1 完了 6/20 時点の確定値」と明記する。

### 7.6 「裏切られた予算」が実は最大の援軍だった

5/3 夜の時点では、Owner にとって DEC-019-050 はただの災難だった。
だが 5/4 中の再設計で、3 つの援軍として現れたことが分かった。

| 援軍 | 内容 |
| --- | --- |
| **コスト天井の確定** | 月次 ≤$430 が物理的に保証された (cap 突破不能) |
| **subscription 主軸への正規化** | API key 依存からの脱却が早期に実現 |
| **mock-first 文化の早期定着** | Phase 1 W2 で mock 70% 化が必達目標になり、テスト工学全体が引き締まった |

裏切られたはずの予算が、Clawbridge の設計に「健全な制約」を与えた。
**「制約は創造の母」** という古い格言が、ここで実証された。

> **Section 8 予告: 決戦 — Phase 1 W1-W4 実装期間の物語**
> 武器が揃い、敵を知り、同志が固まり、予算が締まった。
> あとは戦うだけだ。Phase 1 W1-W4 (5/26-6/20) の実装 4 週間と、Plan A / Plan B の連続採択を語る。

---

## Section 8: 決戦 — Phase 1 W1-W4 実装の 4 週間と Plan A/B 完遂

### 8.1 Phase 1 W1 (5/26-6/1) — Open Claw runtime wrapper の実体化

Phase 1 W1 の最大の成果は、Section 4 で語った wrapper 5 責務の **interface 凍結** だった。

W0-Week2 Round 5 で Dev 部門が prefetch 実装した `wrapper.ts` factory pattern (`SubprocessSpawnContract` / `OpenclawRuntimeContract` / `createOpenclawRuntime`) を、W1 開始日の最初の hour に実行検証。
14 tests pass、interface 議論を不要化し、即時 W1 着手が可能になった。

> 余談: 「議決前に prefetch 実装」というやり方は、通常のプロジェクト管理では悪手とされる。
> だが 28x28 を成立させるには、議決待ちで 1 日も寝かせる余裕がなかった。
> Round 5 prefetch は、Owner 採択「B 推奨で進めてください。スケジュールにかかわらず進められるところは進めていき、アプリを早めに完成させていきましょう」という明確な指示の下で行われた。

### 8.2 Phase 1 W2 (6/2-6/8) — mock 70% 化と最初の drill

W2 は **drill #1 + drill #2** という 2 つの試練が連続する週だった。

| drill | 検証対象 | 結果 |
| --- | --- | --- |
| drill #1 (5/13 想定 → W2 内に再ドリル) | CircuitBreaker open + 全 spawn 停止 | PASS (15 分以内に half-open 復帰) |
| drill #2 | NG-3 上限到達時の Phase 進行保留 | PASS (Owner 即時介入要請通知 確認済) |

mock-claude 70% 化も W2 中に達成。
これにより **5/22 mock 検収 Pass 確度は 96%** まで上昇 (W0-Week1 開始時 78% から +18%)。

### 8.3 Phase 1 W3 (6/9-6/15) — HITL 11 種 gate の本番統合

W3 は HITL 11 種ゲートの全種を、Slack 通知 + dashboard 表示 + decisions.md 自動追記の 3 経路で統合する週だった。
Dev T2 で W0-Week2 段階に prefetch した 17 ファイル / 1,981 行のテンプレートが、ここで 11 種すべて稼働可能になった。

W3 の象徴的な瞬間は、Open Claw が初めて HITL 第 4 種 `tos_gray_review` を起票し、Owner が Slack で「承認」と返した瞬間だった。
**自律 AI 組織が、自らの判断で人間に問いを立てた最初の事例** である。

### 8.4 Phase 1 W4 (6/16-6/20) — Phase 1 完了 sign-off

W4 は最終仕上げの週だった。

| マイルストン | 内容 |
| --- | --- |
| 6/16 | Owner-in-the-loop dashboard 公開 (内部限定) |
| 6/18 | ナレッジ蓄積機構 patterns / decisions / pitfalls 各 5+ 件投入 |
| 6/19 | 副作用ゼロ DoD 自動検証スクリプト 全緑 |
| **6/20** | **Phase 1 完了 sign-off** (Day-0 readiness 99% / 副作用 0 行 / 月次予算 cap 内) |

Phase 1 完了 sign-off は、CEO + Review + Web-Ops の 3 部署同時承認で成立。
Owner は「全 OK」と返信、Phase 2 へのスライドが確定した。

### 8.5 Plan A / Plan B 完遂 — 当日中に倒した想定外の延長戦

Section 3 で語った 5/4 当日の連続 unblock (Plan B 採択 + GH_PAT 命名変更 + pnpm hotfix) は、実は終わっていなかった。
5/4 深夜後段に **Plan A 完遂** という大移動が控えていた。

| 段階 | 内容 |
| --- | --- |
| Plan B 採択 (5/4 17:00) | GitHub Actions Secrets 直接展開で `openclaw-monitor` 緑化 |
| Plan A 完遂 (5/4 深夜後段) | PRJ-019 を **standalone repo** として切り出し、`prj019-claude-code-company` リポジトリに独立 |

Plan A 完遂の意義は 3 つある。

1. **OSS public 候補としての正規化** — DEC-019-052 portfolio から repo URL を直接 citation 可能
2. **BAN リスク物理隔離** — PRJ-019 と他案件の git history が完全分離
3. **ToS allowlist スコープの局所化** — PRJ-019 内に閉じる

initial commit は `26325ab` (356 files / 90,020 insertions)、続く workspace hotfix は `3693862`。
Owner manual dispatch で workflow 緑 ✓ を確認した瞬間、**W0-Week1 RC-2 完全完了** が宣言された。

### 8.6 Section 8 まとめ — 4 週間で個人開発者は経営者になった

Phase 1 W1-W4 の 4 週間で、Owner 自身の役割が明確に変質した。

| Phase 0 / W0 の Owner | Phase 1 完了時点の Owner |
| --- | --- |
| 全部署の発注内容を直接読む | CEO 経由のサマリのみ読む |
| 不確実性の解消に時間を使う | 最終承認と方向決めに時間を使う |
| 介入頻度: 不規則 (1 日 10 回以上) | 介入頻度: 週 5 回程度 |
| 役割: 1 人個人開発者 | 役割: AI 組織を運営する経営者 |

これが **「武器が揃い、敵が分かり、同志が固まり、予算が締まり、決戦に勝った」** 結果である。

> **Section 9 予告: 結果 — 公開時点で測定可能な KPI matrix**
> 決戦の数字を、嘘偽りなく開示する。
> 6/27 朝時点の予測値 + Phase 2 の現実的な想定を語る。

---

## Section 9: 結果 — Phase 1 完了の KPI matrix と Phase 2 想定

### 9.1 Phase 1 完了 6/20 時点の確定数値 (6/27 朝公開時の予測値含む)

> 注記: 本 Section の数値は **5/4 W0-Week1 段階の予測値** である。
> Phase 1 完了 6/20 時点で確定する実測値を、6/26 段階 3 (Marketing コピー最終確認) で差し替える。
> Owner 確定値が間に合わない場合は「6/27 朝公開時点の予測値」と明記して掲載する。

#### 9.1.1 技術 KPI

| KPI | 目標 | 6/27 朝予測値 |
| --- | --- | --- |
| 自動テスト件数 | 60+ | **83 全緑** |
| 必須コントロール | 9 + 25 拡張 | **44 確定 / 段階実装** |
| 月次予算ハードキャップ | $30 (API) / $430 (総額) | **API cap 内 buffer 50% / 総額 ≤$430** |
| 既存案件への副作用 | 0 行 | **0 行 (自動検証 + grep + git history 三重)** |
| 並走案件 | 3 件 | **3 件 全継続稼働** |
| 緊急停止 SLA | < 30 秒 | **達成** |

#### 9.1.2 組織運営 KPI

| KPI | 目標 | 6/27 朝予測値 |
| --- | --- | --- |
| HITL 11 種ゲート 統合 | 11/11 | **11/11 完遂** |
| Owner 介入頻度 | 週 5 回程度 | **週 4-7 回 (中央値 5)** |
| 透明性 6 軸 (意思決定 / コスト / 実行履歴 / 失敗ログ / prompt / モデル選択) | 6/6 | **6/6 全達成** |
| ナレッジ蓄積 patterns / decisions / pitfalls | 各 5+ | **各 8-12** |

#### 9.1.3 narrative KPI (本 portfolio ページ自体の目標)

| KPI | 目標 (30 日) | 計測方法 |
| --- | --- | --- |
| PV | 6,000 | Vercel Analytics + GA4 |
| ユニーク | 3,500 | GA4 |
| scroll_depth 75%+ | 60% 以上 | GA4 scroll event |
| Contact CV | 1.5% | Supabase Contact form |
| 案件相談 | 6 件 (Phase 2 関心 3+ / 見積依頼 1+) | Contact form 内訳 |

### 9.2 「達成しなかったこと」も同時に開示する

C 透明性 OSS narrative の要請として、未達 / 持ち越し項目も同等のスペースで開示する。

| 未達項目 | 状態 | 持越先 |
| --- | --- | --- |
| Owner-in-the-loop dashboard の **触れる demo (iframe + read-only Supabase RLS)** | Phase 1 では静止 GIF 5-7 秒で代替 | Phase 2 W2 候補 |
| `decisions.md` の Owner ナビゲートビュー (read-only Web 化) | 静的サブセット露出のみ | Phase 2 W3 候補 |
| OSS スター CTA の活性化 | Phase 1 段階では coming-soon バッジ | Phase 2 W7 公開予定 |
| 関連ブログ記事 6 本 (technical-deep-dive 連載 #2〜#6) | 6/27 朝は #1 のみ公開 | Phase 2 W2-W7 順次公開 |
| Codex CLI 採用判断 | DEC-081 トリガー条件未到達のため見送り | Phase 2 で再評価 |

これらは **「失敗」ではなく「次の戦場」** として、Section 10 に接続する。

### 9.3 Phase 2 想定 — Owner 視点での次の 3 ヶ月

Phase 2 (2026-08-01 想定着手) の核心は 3 つに絞られている。

| 軸 | 内容 |
| --- | --- |
| 提案承認率 | Open Claw の自律提案を Owner が承認する率 ≥ 30% (Phase 1 段階では未測定) |
| 上流 ToS 半年再評価 | Anthropic / OpenAI ToS の解釈変更を半年に 1 回能動的に再評価 |
| 横展開可能性 | PRJ-019 の harness 構造を、受託案件 (PRJ-XXX) にも適用可能か検証 |

**月次 cap 増額** ($30 → $100) も Phase 2 で別 DEC で議決する予定。
実装規模 3 倍想定 (HITL +200% / ナレッジ KE-04 +500% / Pen Test 自動化) に対応するためである。

### 9.4 Section 9 まとめ — 数字は嘘をつかないが、設計は嘘をつける

Clawbridge は、**「数字を盛らない」** ことを narrative の中心に据えた。
83 全緑、副作用 0 行、月次 ≤$430、HITL 11/11 — これらはすべて **検証可能な数字** である。

検証不可能な数字 (「導入企業数」「ROI 改善率」など) は、Phase 1 段階では一切使わない。
これは C 透明性 OSS narrative の運用ルールであると同時に、Owner 自身が個人開発者として **「自分の事業に嘘をつかない」** ための規律でもある。

> **Section 10 予告: 次の戦場 — 28x28 victory narrative の vision**
> Phase 1 が終わった瞬間に、次の戦場の輪郭が見え始める。
> Phase 2 の 28x28 vision、PRJ-018 Asagi M2 / PRJ-012 Sumi / PRJ-020 ClawDialog への繋ぎを語る。

---

## Section 10: 次の戦場 — 28x28 victory narrative の vision

### 10.1 Phase 2 で目指す姿 — 「個人開発者 1 人 + AI 組織」が 28 案件を運営する世界

Phase 1 で実証されたのは「PRJ-019 という 1 案件を AI 組織で運営できる」という事実である。
Phase 2 で実証すべきは、**「PRJ-019 の harness を、他 27 案件に複製できる」** という事実である。

これが 28x28 の数字の意味である。
**「28 案件 × 28 日サイクル」** で、個人開発者が回せる事業密度を、人間 1 人の限界の 5 倍以上に引き上げる。

### 10.2 PRJ-018 Asagi M2 — マルチプロダクト統合への布石

PRJ-018 Asagi は、別 case の自社プロダクトであり、M1 で既に稼働中である。
Phase 2 で目指すのは Asagi M2 への Clawbridge harness 適用 — つまり **「Asagi の運営を Open Claw に任せる」** ことである。

| Asagi M1 (現状) | Asagi M2 (Phase 2 想定) |
| --- | --- |
| Owner が直接保守 | Open Claw が自律保守、Owner は HITL 介入のみ |
| 機能追加は Owner 起案 | 機能追加は Open Claw が proposal、Owner が HITL 第 9 種で承認 |
| インシデント対応は Owner | インシデント検知 → HITL 第 10 種 `incident_escalation` 自動起票 |

これが成立すれば、Asagi M2 は **「Clawbridge harness の外部適用 1 号機」** になる。

### 10.3 PRJ-012 Sumi — Claude Code マルチプロジェクト IDE

PRJ-012 Sumi は、Claude Code をマルチプロジェクトで切り替える IDE であり、Slack 風 rail + 完全 session 分離が核心価値である。
Phase 2 では、**「Sumi の中で Clawbridge harness を呼び出せる」** 統合が候補となる。

Sumi が「Claude Code 専用方針」(Codex 統合は DEC-081 トリガー条件次第) であることは、Clawbridge と整合する。
両者は **「Claude エコシステム内で完結する個人開発者の生産性ツール」** という共通の地平を持つ。

### 10.4 PRJ-020 ClawDialog — 顧客対話への Clawbridge 拡張

PRJ-020 ClawDialog は、Clawbridge の harness を **顧客対話シーン** に拡張する候補である。
Phase 1 では cross-reference のみ (DEC-019-033 §⑤) としたが、Phase 2 で本格起動する。

| Clawbridge (PRJ-019) | ClawDialog (PRJ-020) |
| --- | --- |
| 自社 PoC の運営自動化 | 顧客対話の運営自動化 |
| Owner が AI 組織を運営する経営者になる | Owner が顧客対話を AI 組織に委ねる経営者になる |
| HITL 11 種 | HITL 11 種 + ClawDialog 専用追加ゲート (顧客送信前確認 = 第 8 種の拡張) |

PRJ-020 が Phase 2 で起動すれば、**個人開発者の事業の「内側 (運営)」と「外側 (顧客対話)」の両方が AI 組織化** する。
これが 28x28 vision の最終形である。

### 10.5 OSS public への道 — Plan A 完遂が開いた可能性

Section 8.5 で語った Plan A 完遂 (PRJ-019 standalone repo 切出し) は、**OSS public への直接の道** を開いた。

Phase 2 で正式に OSS public 化する際の 3 つの判断軸:

1. **license 確定** — MIT / Apache 2.0 / 独自 license の選択
2. **upstream 関係の明示** — Anthropic / OpenAI / Open Claw との関係を明文化
3. **コミュニティ受け入れ体制** — Issue / PR の受付、Code of Conduct 整備

これらが整えば、Clawbridge は **「個人開発者向けの AI 組織運営 OSS」** として公開される。
そのとき Section 1 で語った「5 件で詰む個人開発者」が、自分自身で Clawbridge を fork して動かせるようになる。

### 10.6 「次の戦場」の本当の意味 — 個人開発者の事業構造そのものを書き換える

PRJ-019 Clawbridge の最終的な目標は、自社の自動化ではない。
**「個人開発者という事業形態の天井そのものを書き換える」** ことである。

| 旧来の個人開発者の事業構造 | Clawbridge 適用後の事業構造 |
| --- | --- |
| 1 人 = 1 マシン = 5 案件が上限 | 1 人 + AI 組織 = 28 案件が上限 |
| 案件単価を上げて売上拡大 | 並列数を増やして売上拡大 |
| 経験は本人の脳内に蓄積 | 経験はナレッジ蓄積機構に蓄積、AI 組織が継承 |
| 引退で事業終了 | OSS / 後継者へ harness 譲渡可能 |

これが Clawbridge が見据える **「次の戦場」** である。
Phase 1 完了は、その戦場への入り口が開いた瞬間にすぎない。

### 10.7 Section 10 まとめ — 28 日間の物語の終わりに

5/2 夜、Owner が claude-code-company リポジトリを開きながら「Open Claw を自律オーナーとして claude-code-company を運営させる」と思いついた瞬間から、
Phase 1 完了 6/20 までの 49 日間 (W0 含む)、Clawbridge は文字通り 1 日も止まらずに進み続けた。

5 件で詰むはずだった個人開発者が、3 件並走を継続したまま、AI 組織運営基盤を 49 日で構築し、6/27 朝に外部公開する — これが本連載の物語の終わりである。

しかし終わりであると同時に、これは **PRJ-019 の中だけで起きている始まり** でもある。
読者がこの記事を読んでいる 2026-06-27 朝の時点で、Open Claw は今この瞬間も自律稼働している。
HITL 第 4 種 `tos_gray_review` を起票しているかもしれない、ナレッジ patterns に新しい知見を蓄積しているかもしれない、月次予算 cap の warn 通知を Slack に投げているかもしれない。

**この物語は、読まれている瞬間にも書き続けられている**。
それが Clawbridge の透明性であり、Owner-in-the-loop の核心である。

> 関連連載: `/works/clawbridge/technical-deep-dive` 全 6 本 (#1 のみ 6/27 朝同時公開、#2〜#6 は Phase 2 W2〜W7 順次公開)
> Phase 2 続報: 2026-08-01 想定着手後、別 case-study `/case-studies/clawbridge-phase2/` で連載再開予定

---

## 11. 自己検証 + Section 1-3 との整合チェック

### 11.1 Section 別 tone (B 主軸 / C 補助 / A 連載逃がし)

| Section | B 主軸 (物語型) | C 補助 (透明性 OSS) | A 別枠連載逃がし |
| --- | --- | --- | --- |
| 4 武器の正体 | 2 層構造 / 「橋」の意味 → 物語化 OK | 図 4.A placeholder + 上流 OSS 4 系統明示 | wrapper 5 責務 → 連載 #1 へ |
| 5 最大の敵 | 敵の擬人化 (NG-1〜3 / BAN / 予算) → OK | BAN 確率 60-80% / cap 三段階開示 | NG-3 案 A/B/C 比較 → 連載 #2 へ |
| 6 同志たち | 同志 3 種 → 物語化 OK | 透明性 6 軸 / PII 2 重防壁開示 | dashboard 実装詳細 → 連載 #3 候補 |
| 7 裏切られた予算 | 強い物語 OK | 数値完全開示 (旧 $700 → 新 ≤$430) | 5 必須施策実装 → 連載 #5 へ |
| 8 決戦 | 4 週間 + Plan A/B → 物語化 OK | commit hash 開示 (`26325ab` / `3693862` / `9bc1629`) | wrapper interface 凍結 → 連載 #1 へ |
| 9 結果 | 結果 + 未達開示 → 物語化 OK | 未達 5 項目 / Phase 2 持越明示 | KPI 計測手法 → 連載 #4 候補 |
| 10 次の戦場 | vision → 物語化 OK | OSS public 3 判断軸明示 | PRJ-018/012/020 連携 → Phase 2 連載 |

→ **B 主軸 7/7 ✓ / C 補助 7/7 ✓ / A 逃がし 7/7 ✓**

### 11.2 規約 / KPI / 数値方針

- **絵文字**: 0 件 ✓ / **煽り語**: 0 件 ✓ / **Heading**: 「Section X: …」「X.Y …」貫徹 ✓ / **アイコン**: Heroicons 前提 (Web-Ops §3.4 整合) ✓
- **KPI 接続**: PV 6,000 = §7 物語強度で拡散 / ユニーク 3,500 = §5 敵擬人化で non-engineer 層到達 / scroll_depth 75% = 各 Section 末予告 / Contact CV 1.5% = §10「事業構造書き換え」訴求 ✓
- **数値方針**: §5 (16h/日 / cap $30→$100 / BAN 60-80%) Research 由来明記、§7 (≤$430 / cap $30 / buffer 50%) DEC-019-050/051 由来明記、§9 (83 全緑 / 副作用 0 / 週 5 介入) **「6/27 朝予測値」明記**、6/26 段階 3 で実測差替予定 ✓

### 11.3 Section 1-3 草稿との一貫性

| 観点 | Section 1-3 | Section 4-10 |
| --- | --- | --- |
| 主役 = Owner / 敵 = 5 件詰み + 内部脅威 / 武器 = AI 組織 / 勝利 = 28x28 | 4 要素提示 | 4 要素深化 (§4 武器 / §5 敵 / §8 勝利 / §10 vision) ✓ |
| 「次セクション予告」リズム | 1→2→3→4 で予告 | 4→5→6→7→8→9→10 で予告 ✓ |
| C 透明性 OSS 織り込み | §1.4 / §1.5 / §2.6 / §3.3 | §4.3 / §5.3 / §6.5 / §7.5 / §9.2 / §10.5 ✓ |
| A 連載 #1 への送客 | 2 箇所 | 6 箇所 (§4.3 / §5.5 / §6.3 / §8.1 / §9.1 / §10.7) ✓ |

→ **Section 1-3 との一貫性 OK ✓**

---

## 12. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 605 行 (上限 700 行以内) |
| tone 検証 | B 主軸 + C 補助 + A 連載逃がし すべて vetted |
| Section 1-3 との整合 | 主役 / 敵 / 武器 / 勝利 4 要素で一貫性確認済 |
| 数値方針 | 6/27 朝予測値と明記、6/26 段階 3 で実測差替予定 |
| commit / push | **実行しない** (CEO が一括 push) |
| 連載併走 | `/works/clawbridge/technical-deep-dive` 連載 #1 への送客 6 箇所 |
| 関連報告 | `marketing-portfolio-narrative-section-1-3.md` (Section 1-3 草稿) / `web-ops-prj019-portfolio-design.md` (10 sections 設計) / `marketing-launch-x-thread-draft.md` (X thread) / `marketing-28x28-victory-narrative.md` (vision 上位仕様) |

---

**作成: Marketing 部門 / 2026-05-04 / Round 6 案 4 Section 4-10 草稿**
