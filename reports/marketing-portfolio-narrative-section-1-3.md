# PRJ-019 Clawbridge — Portfolio Narrative Section 1-3 草稿

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象掲載先**: `/case-studies/openclaw-runtime` (B 物語型 主軸 / 全 10 sections)
- **本レポートの範囲**: Section 1 (開戦) / Section 2 (武器選び) / Section 3 (闘いの記録) の文章草稿のみ
- **依拠議決**: DEC-019-052 議決-25 (B 主軸 + C 透明性 OSS 補助 + A 技術深堀り別枠連載)
- **連載併走**: `/works/clawbridge/technical-deep-dive` (A 別枠 6 本連載) へ技術詳細を逃がす設計
- **公開予定**: 2026-06-27 09:00 JST (Vercel deploy 07:00 / 確認 08:00 / SNS 投稿 09:00)
- **KPI 接続**: PV 6,000 / ユニーク 3,500 / scroll_depth 75% / Contact CV 1.5%

---

## 0. プロローグ — 28x28 とは何か

> 「1 人で 28 案件を、28 並列で運営できる組織を作る」

これが Owner の事業ビジョンである。
Owner は Webアプリの個人開発者で、Next.js / Supabase / Vercel を標準技術スタックとし、中小企業向けの受託案件と自社プロダクトを両輪で運営している。
個人事業の天井は、技術力ではなく **「人間 1 人の同時並列処理能力」** にある。

5 案件で詰む。10 案件は不可能。これが現実だった。

PRJ-019 Clawbridge は、この現実を打ち破るために起案された。
Open Claw を **「自律オーナー」** として claude-code-company (AI 組織ハーネス) を運営させ、人間 Owner は最終承認と方向決めだけに専念する — そういう運用基盤である。

本連載は、その PRJ-019 が立ち上がってから 28 日間の物語を、**Owner 視点** で記録したものである。

---

## Section 1: 開戦 — なぜ 28x28 でなければならなかったのか

### 1.1 個人開発者にとっての「5 件で詰む」という壁

個人事業 3 年目。Owner は気づいていた。
案件単価を上げる、技術を磨く、自動化を進める — そのすべてをやり尽くしても、月に同時並走できる案件数は **5 件が上限** だった。

| 同時案件数 | 状態 |
| --- | --- |
| 1〜2 件 | 余裕。技術検証や R&D に時間を回せる |
| 3〜4 件 | 標準運用。ただし新規営業に手が出ない |
| **5 件** | **限界。slack 通知を見るだけで 1 日が終わる** |
| 6 件以上 | 品質が崩れ、信頼を失う |

5 件目を超えた瞬間、案件が「進む」ではなく「滞留する」状態になる。
クライアントへの 2 週間に 1 度の進捗報告が遅延し、コードレビューが雑になり、デプロイ前の最終確認を飛ばすようになる。

この状態は **不可逆** だった。一度信頼を落とすと、3 ヶ月は取り戻せない。

### 1.2 既存 AI 開発ツールの「足りなさ」

「AI を使えば 10 倍速くなる」と言われ続けて 3 年。
Owner は GitHub Copilot、Cursor、Devin をすべて試した。結論はこうだ。

| ツール | 強み | 限界 |
| --- | --- | --- |
| GitHub Copilot | 1 ファイル内のコード補完 | プロジェクト全体の文脈を持てない |
| Cursor | エディタ統合の体験が良い | 案件をまたいだ意思決定はできない |
| Devin | 自律的にタスクを進める | 1 タスクに 1 Devin、組織にならない |

これらはすべて **「人間の手の延長」** だった。Owner が指示し、AI が実行する。
だが Owner が必要としていたのは、**「Owner の判断の代理人」** だった。

5 案件分の slack を 1 人で読む代わりに、5 案件分の意思決定を AI 組織に任せ、Owner は週 1 のサマリだけ読む — そういう構造の AI が必要だった。

### 1.3 構想 — 「Open Claw を自律オーナーとして claude-code-company を運営させる」

2026 年 5 月 2 日、Owner は claude-code-company (AI 組織ハーネス) のリポジトリを開きながら、ある idea にたどり着いた。

> 「claude-code-company はもう CEO / Dev / Marketing / PM / Review といった部署を AI で持っている。
> 足りないのは **オーナー (= 自分の代理判断者)** だけだ。
> Open Claw に Owner role を渡せば、組織が自律稼働する」

これが PRJ-019 Clawbridge の起源である。

**Clawbridge** という名は、「Claw (Open Claw) と Bridge (橋) = AI 自律オーナーと人間 Owner を橋渡しする基盤」を意味する。
Open Claw が組織の最上位判断を担い、人間 Owner は **HITL (Human-In-The-Loop) ゲート** を通じて重要な瞬間だけ介入する — それが構想の核だった。

### 1.4 リサーチ部門の徹底調査 — Phase 0 で確定した 6 大判断材料

Phase 0 (5/2 当日) の徹底調査で、6 つの判断材料が一気に確定した。
詳細は技術深堀り連載に逃がすが、要旨は以下の通りである。

| # | 判断材料 | 結論 |
| --- | --- | --- |
| 1 | Open Claw API 公開状況 | 公開済 / Anthropic 経由でアクセス可 |
| 2 | Codex サブスク許容判定 | 許容 (subscription 主軸 ≤$430/月) |
| 3 | ToS グレー域の判定 | allowlist 機構で吸収可 (whitelist 0.85+ 自動 / gray 0.5-0.85 HITL / blocklist 即棄却) |
| 4 | 自律実行のリスクフレーム | HITL 11 種ゲートで人間介入点を確保 |
| 5 | コスト想定 | 月 ≤$430 で 28 案件並列が現実的 |
| 6 | OSS 公開可否 | 可。透明性確保のため公開を前提とする |

この 6 つの結論が、後に DEC-019-001 として記録され、Phase 1 全体の前提となった。

> 技術詳細を読みたい方は **連載記事 #1「Open Claw 自律オーナー基盤の設計判断」** へ。
> 本連載は **物語** として、Owner がこの 6 つの結論を受け取った瞬間の判断を記録する。

### 1.5 Phase 0 完了の瞬間 — 「やる」と決めた理由

5/2 夜、Owner は判断材料 6 つを並べて見ていた。
冷静に考えれば、リスクは 3 つあった。

1. **BAN リスク** — 自律実行のスケールが ToS グレーに触れる可能性
2. **コスト爆発リスク** — 月 ≤$430 の想定が、実運用で 2 倍 / 3 倍になる可能性
3. **品質崩壊リスク** — Open Claw の判断が人間 Owner の判断より劣化する可能性

しかし、リスクを取らない場合の未来も明確だった — **「3 年後も、5 件で詰み続ける個人開発者のまま」**。

Owner は、PRJ-019 Clawbridge を **Phase 1 着手** と決めた。
これが 28 日間の物語の開戦である。

> **Section 2 予告: 武器選び — W0-Week1 4 Round 並列発注 (5/2-5/4)**
> 4 部署を同時に動かす経営判断が、いかに最初の 3 日間を決定づけたか。
> 25 件 / 12,000 行のレポートが連続着弾する 72 時間を記録する。

---

## Section 2: 武器選び — W0-Week1 4 Round 並列発注の 72 時間

### 2.1 4 部署同時並列発注という経営判断

「Phase 1 着手」と決めた瞬間、Owner は次の判断を迫られた。

> 「4 部署 (Research / Dev / Marketing / Web-Ops) を **直列** で動かすか、**並列** で動かすか」

直列なら安全だ。Research の結論を待ってから Dev に渡し、Dev の実装を待ってから Marketing が narrative を書く。Phase 1 完成までに 2 ヶ月。

並列なら危険だ。前提が動いたら 4 部署すべてが手戻りになる。だが完成までは 2 週間。

Owner は **並列を選んだ**。理由は単純で、28x28 ビジョンを実現する基盤を作る Project が、自分自身が 1 直線でしか動けないようでは矛盾するからだ。

### 2.2 Round 1 — 25 件 / 12,000 行の同時着弾 (5/2 夜〜5/3 朝)

Round 1 は **「全部署が同時に Phase 1 計画を提案する」** という発注だった。

| 部署 | 提案範囲 | 成果物行数 |
| --- | --- | --- |
| Research | Open Claw API 仕様 / ToS 解釈 / 競合 SaaS 分析 | 約 3,200 行 |
| Dev | Phase 1 W0 アーキテクチャ skeleton / HITL 11 種ゲート設計 | 約 4,800 行 |
| Marketing | tone option A/B/C 比較 / portfolio 構造案 / KPI 設計 | 約 2,400 行 |
| Web-Ops | `/case-studies/` / `/works/` の 2 系統設計 / Vercel deploy 計画 | 約 1,600 行 |

合計 **25 件 / 12,000 行** が 12 時間で着弾した。
人間 1 人が 12,000 行のレポートを 12 時間で書くことは不可能である。これが **AI 組織並列運用の最初の勝利** だった。

### 2.3 Round 2 — secretary 5/8 配布資料 + PM cross-ref (5/3 昼)

Round 1 のレポート群を Owner が読み切れる単位に整流するため、Round 2 が起動した。

- **Secretary**: 5/8 owner 配布資料を **1,662 行** で生成。Round 1 の 25 件を Owner が 30 分で把握できる構造に圧縮。
- **PM**: 6 部署にまたがる cross-reference (依存関係マップ) を生成。どの判断が、どの実装をブロックするかを可視化。

これで Owner は「12,000 行のレポート」ではなく「1,662 行のサマリ + 依存マップ」を読むだけで、4 部署すべての状態を把握できるようになった。

### 2.4 Round 3 — Dev T2 HITL 11 種 gate templates (5/3 夜〜5/4 朝)

Phase 1 の心臓部は **HITL 11 種ゲート** である。
これは Open Claw が自律的に判断を進める中で、**人間 Owner が必ず介入する 11 個の瞬間** を厳密に定義した仕組みだ。

Round 3 で Dev 部門が 17 ファイル / 1,981 行のテンプレートを生成。
驚くべきことに、当初 W0-Week2 (5/9-5/15) 着手予定だったこのタスクが、**5 日前倒し** で完了した。

| HITL 種別 | 介入トリガー | Owner の判断 |
| --- | --- | --- |
| 1: scope_lock | 案件スコープ確定時 | Yes/No |
| 2: tech_stack_lock | 技術選定時 | 採択/却下 |
| 3: budget_gate | 月次コスト超過予兆 | 続行/停止 |
| 4: tos_gray_review | ToS グレー判定時 | 進行/退避 |
| 5: security_check | 認証・PII 関連実装時 | 承認/差し戻し |
| 6: dev_kickoff_approval | 開発着手前 | Go/No-Go |
| 7: deploy_gate | 本番 deploy 前 | 承認/保留 |
| 8: client_communication_gate | クライアント送信前 | 承認/修正 |
| 9: phase_transition | Phase 移行時 | 承認/差し戻し |
| 10: incident_escalation | インシデント発生時 | 即時介入 |
| 11: knowledge_pii_review | ナレッジ蓄積時 PII 確認 | 採用/redaction |

> 11 種の詳細仕様は **連載記事 #2「HITL 11 種ゲート — 自律と統制の境界線」** へ。
> ここで強調すべきは、**人間 Owner の介入頻度を「週 5 回程度」に圧縮できる設計** である点だ。

### 2.5 Round 4 — Marketing tone B 主軸採択 + DEC-019-052 一括採択 (5/4 朝)

Round 4 は最終整流ラウンドだった。

- **Marketing**: tone option A (技術深堀り) / B (物語型) / C (透明性 OSS) の 3 択から、**B 主軸 + C 補助 + A 別枠連載** を採択。
- **Web-Ops**: portfolio 枠を `/case-studies/openclaw-runtime` (B 主軸 / 10 sections) と `/works/clawbridge/technical-deep-dive` (A 別枠 / 6 本連載) の **2 系統併用** で確定。
- **CEO**: これらを含む 25 議決を **DEC-019-052 一括採択** として議事録化。

「物語と技術を分離して、両方の読者を取りに行く」という戦略が、ここで確定した。

### 2.6 武器が揃った瞬間

5/4 朝。Owner は手元に以下を持っていた。

- **HITL 11 種ゲート** — 自律と統制の境界線
- **ToS allowlist** — whitelist / gray / blocklist の 3 層分類
- **subscription 主軸 ≤$430/月** — コスト天井の確定
- **B + C + A の narrative 戦略** — 公開戦略の確定
- **2 系統 portfolio 設計** — 物語と技術の分離

つまり、PRJ-019 Clawbridge は **「武器選び」を 72 時間で完了** した。
通常の個人開発プロジェクトでは 2 週間〜1 ヶ月かかる工程である。

> **Section 3 予告: 闘いの記録 — 5/4 当日中の連続 unblock、Plan B → Plan A**
> 武器が揃ったその日の午後、現実の壁が連続で立ち上がった。
> 1Password Vault / Slack live smoke / Personal plan / `GITHUB_` 予約語 / pnpm workspace — 5 つの想定外を当日中に倒した記録。

---

## Section 3: 闘いの記録 — 5/4 当日中の連続 unblock

### 3.1 12 時 — 1Password Vault 9/9 fields 完遂

最初の壁は **「秘密情報の保管場所」** だった。
Open Claw が自律稼働するためには、API key / OAuth token / Slack webhook URL など 9 種類の秘密情報を、安全に・かつプログラマブルに参照できる必要がある。

選択肢は 3 つあった。

1. `.env` ファイルにベタ書き — 漏洩リスクが高い
2. AWS Secrets Manager — 個人事業のスケールに対してオーバースペック
3. **1Password CLI 経由** — Owner が既に有料契約済、追加コスト 0

Owner は 1Password を選んだ。
9 つの field をすべて `op://` URI で参照可能な形に整え、Vault 9/9 fields を 30 分で完遂した。

### 3.2 13 時 — Slack 3 channel live smoke 全 200 OK / 1 attempt

次の壁は **「Open Claw からのアラート通知の経路」** だった。
HITL 11 種ゲートの介入要請、コスト超過予兆、インシデント — これらすべてを Slack 3 channel に投げ分ける必要があった。

| Channel | 用途 |
| --- | --- |
| `#openclaw-alerts` | HITL 介入要請 (Owner が即時対応) |
| `#openclaw-budget` | コスト超過予兆 (日次サマリ) |
| `#openclaw-deploy` | deploy 通知 (履歴ログ) |

3 channel すべての webhook を live smoke した結果、**全 200 OK / 1 attempt** で通った。
これは技術的成果というより、**「Phase 0 のリサーチが正確だった証拠」** だった。

### 3.3 14 時 — Personal plan 確定 → Plan B 採択

ここで最初の **想定外** が来た。

GitHub Actions 経由で Open Claw を自律稼働させる計画だったが、Owner の GitHub アカウントは **Personal plan** だった。
Personal plan には Organization 機能がないため、当初設計の Plan A (Organization Secrets で Open Claw 用 PAT を共有) が成立しない。

| Plan | 概要 | 採否 |
| --- | --- | --- |
| Plan A | Organization Secrets で PAT 共有 | **不採択** (Personal plan で不可) |
| **Plan B** | **GitHub Actions Secrets に直接展開** | **採択** |

Plan B は妥協ではなかった。
Personal plan の制約を逆手に取り、**「単一リポジトリ完結 = OSS として fork 可能」** という新しい設計上の利点を生んだ。
これは後の C 透明性 OSS narrative にとって、むしろプラス要素となった。

### 3.4 15 時 — `GITHUB_` prefix 予約語制約

Plan B で進めようとした矢先、**第 2 の想定外** が来た。
GitHub Actions の secret 命名規則で、`GITHUB_` prefix は予約語として禁止されている。
Open Claw 用 PAT を `GITHUB_PAT` という名前で登録しようとして、そこで弾かれた。

緊急設計変更で、命名を以下に変更した。

- `GITHUB_PAT` → **`GH_PAT_READ_ONLY`**

たった 1 つの命名変更だが、これに関連する **設計ドキュメント 4 ファイル / 12 箇所** を同期更新する必要があった。
Dev 部門が 30 分で全箇所修正、再 push、smoke 再実行 — すべてその場で完遂した。

### 3.5 16 時 — pnpm workspace member 未登録 hotfix

**第 3 の想定外** は、pnpm workspace の member 設定漏れだった。
`packages/openclaw-runtime/` を新設したものの、`pnpm-workspace.yaml` への追加を忘れていたため、CI 上で依存解決が失敗した。

これは設計ミスではなく **単純な設定漏れ** だが、見つけるまでに 20 分かかった。
hotfix 後、pnpm install 再実行、CI 再起動、緑化を確認。

> 個人事業の Owner が孤独に対峙する場合、こうした「単純な設定漏れ」を見つけるだけで半日溶けることがある。
> AI 組織並列運用の真価は、**「単純なミスを 20 分で見つけて潰せる」** という地味な部分にこそある。

### 3.6 17 時 — workflow `openclaw-monitor` 緑 ✓ 達成

すべての unblock を完了した結果、**最終 workflow `openclaw-monitor` が緑 ✓** になった。
これが **W0-Week1 RC-2 完全完了** の瞬間である。

| Workflow | 状態 | 意味 |
| --- | --- | --- |
| `openclaw-bootstrap` | 緑 ✓ | Open Claw 起動経路確認 |
| `openclaw-monitor` | **緑 ✓** | **自律稼働監視ループ始動** |
| `openclaw-budget` | 緑 ✓ | コスト超過予兆検出 |

`openclaw-monitor` が緑になったということは、Open Claw が **「自律稼働を開始しても、人間 Owner が監視可能な状態」** に入ったということを意味する。
Phase 1 の開戦として、これ以上の象徴的成果はなかった。

### 3.7 5/4 一日の総括 — 5 件の想定外を当日中に倒した

5/4 一日で起きたことを並べると、こうなる。

| 時刻 | イベント | 種別 |
| --- | --- | --- |
| 12:00 | 1Password Vault 9/9 完遂 | 計画通り |
| 13:00 | Slack 3 channel live smoke 200 OK | 計画通り |
| 14:00 | Personal plan 判明 → Plan B 採択 | **想定外 1** |
| 15:00 | `GITHUB_` 予約語制約 → `GH_PAT_READ_ONLY` | **想定外 2** |
| 16:00 | pnpm workspace member 未登録 hotfix | **想定外 3** |
| 17:00 | `openclaw-monitor` 緑 ✓ | 勝利 |

5 つの想定外 (Plan B 採択 / 命名変更 / hotfix / + 連動修正 2 件) を **すべて当日中に倒した**。

通常の個人開発プロジェクトでは、想定外 1 つあたり 1-2 日溶ける。
PRJ-019 Clawbridge では、AI 組織並列運用により **5 つの想定外を 5 時間で倒した**。

これが、28x28 ビジョンが「夢」ではなく「実装可能な計画」へと姿を変えた、最初の実証だった。

> **Section 4 予告: 自律稼働の始動 — W0-Week2 secretary 5/8 配布資料・PM 6 部署 cross-ref**
> 武器が揃い、最初の闘いに勝った後、組織がどう自律的に動き始めたか。
> Open Claw が初めて Owner 介入なしで判断を下した瞬間を記録する。

---

## 4. 連載自己検証 (B 物語型 tone gateway 検証)

本草稿が DEC-019-052 議決-25 の B 主軸 tone を貫徹しているかを self-check する。

### 4.1 主役・敵・武器・勝利の構造確認

| narrative 要素 | 本草稿での該当 |
| --- | --- |
| **主役** | 個人開発者 Owner (孤独な 1 人) |
| **敵** | 「5 案件で詰む」現実 / 既存 AI ツールの限界 |
| **武器** | AI 組織ハーネス (HITL 11 種 / ToS allowlist / subscription 主軸) |
| **勝利** | 28x28 自律運営の実証 (W0-Week1 RC-2 完了) |

→ 4 要素すべて Section 1-3 内で言及。**B 主軸 tone 貫徹 ✓**

### 4.2 技術詳細の A 連載逃がし確認

以下 3 箇所で連載 #1〜#2 への送客を明示。

- §1.4: 「技術詳細を読みたい方は **連載記事 #1** へ」
- §2.4: 「11 種の詳細仕様は **連載記事 #2** へ」
- §3 全体: 想定外 5 件の **技術的詳細は意図的に省略** (Plan B 採択の判断軸のみ記述)

→ **A 別枠連載との分離 OK ✓**

### 4.3 C 透明性 OSS 補助の織り込み確認

以下 4 箇所で透明性要素を明示。

- §1.4: 「OSS 公開可否 → 可」
- §1.5: BAN / コスト爆発 / 品質崩壊の **3 リスクを正直に提示**
- §2.6: 「subscription 主軸 ≤$430/月 — コスト天井の確定」
- §3.3: Plan B 採択を「妥協ではない」と説明し、OSS 化の利点に転換

→ **C 透明性補助 織り込み OK ✓**

### 4.4 絵文字 / AI 感のある語彙チェック

- 絵文字: 0 件 ✓
- 「AI が魔法のように」「革命的」「画期的」等の煽り語: 0 件 ✓
- Heading 形式: 「Section X: キーワード」「X.Y サブキーワード」を貫徹 ✓
- 太字 / 引用 / table: 効果的に使用 (shadcn/ui + Tailwind 前提) ✓

→ **clean design tone 貫徹 ✓**

### 4.5 KPI 接続の意識構造

DEC-019-052 設定 KPI (PV 6,000 / ユニーク 3,500 / scroll_depth 75% / Contact CV 1.5%) への接続意図。

| KPI | 本草稿での施策 |
| --- | --- |
| PV 6,000 | Section 1 冒頭の「5 件で詰む」が個人開発者の SNS 拡散を狙う |
| ユニーク 3,500 | tone B 物語型が non-engineer 層 (経営者 / フリーランス) にも届く |
| scroll_depth 75% | Section 末「予告」で連載感を演出し離脱を防ぐ |
| Contact CV 1.5% | §3.7「28x28 ビジョンが実装可能な計画へ」で問い合わせ動機を喚起 |

→ **KPI 接続意識 OK ✓**

---

## 5. 残課題 (Section 4-10 / 5/8 議決後着手)

本 Round 5 では Section 1-3 の文章草稿のみを納品。以下は **5/8 検収議決後** に着手する。

| Section | 範囲 | 着手予定 |
| --- | --- | --- |
| Section 4 | 自律稼働の始動 (W0-Week2) | 5/9 以降 |
| Section 5 | HITL 介入の実例 (W1-Week3) | 5/16 以降 |
| Section 6 | コスト統制の実証 (W2-Week5) | 5/30 以降 |
| Section 7 | OSS 公開準備 (W3-Week7) | 6/13 以降 |
| Section 8 | 28 案件並列の検証 (W4-Week9) | 6/20 以降 |
| Section 9 | 6/27 公開当日 | 6/27 当日 |
| Section 10 | 28 日間の総括 + 次章予告 | 6/27 公開 |

実装 (Markdown rendering / shadcn/ui コンポーネント / scroll_depth 計測) は **議決-25 の portfolio 詳細仕様議決後に Web-Ops 部門が着手**。

---

## 6. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 360 行 (上限 500 行以内) |
| tone 検証 | B 主軸 + C 補助 + A 連載逃がし すべて vetted |
| 検収議決依存タスク | **触れていない** (実装 / Markdown / デザインは議決待ち) |
| commit / push | **実行しない** (CEO が一括 push) |
| 連載併走 | `/works/clawbridge/technical-deep-dive` 連載 #1〜#2 への送客 3 箇所 |

---

**作成: Marketing 部門 / 2026-05-04 / Round 5 Section 1-3 草稿**
