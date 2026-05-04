# PRJ-019 Phase 0 セキュリティ・リスク評価書 v2 — サブスク駆動採用に伴う再評価とフォールバック計画

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: レビュー部門（品質管理）
- 評価日: 2026-05-02
- 評価者: Review Agent (claude-code-company)
- 版: v2（v1 は `review-security-and-risk-assessment.md`）

## 0. 文書の位置づけと前提

### 0.1 v1 からの変更ドライバ
- **OQ-02 オーナー判断**: Claude Code は **サブスクプラン（Pro/Max OAuth）で駆動**、API 従量は採用しない。
- v1 では本構成を **CR-01 致命リスク（スコア 9） / Phase 1 着手 NoGo 条件** と評価していた。
- 本 v2 は「オーナーが OQ-02 を貫く前提で、許容できるサブスク駆動運用を設計する」ことを目的とする。

### 0.2 参照したインプット
- `projects/PRJ-019/reports/review-security-and-risk-assessment.md`（自部署 v1）
- `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`（リサーチ部門徹底調査、§4.2 の Anthropic ToS 原文抜粋）
- `projects/PRJ-019/reports/pm-requirements-and-architecture.md`（PM 部門 v1）
- `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`: **本書執筆時点で未着手 / 未配置**。本書は「補完リサーチ未着」を前提として保守的に評価し、補完レポート完成後に v2.1 で再校正する余地を残す。
- `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`: **本書執筆時点で未着手 / 未配置**。同上。

### 0.3 評価姿勢
- 「サブスク駆動を採用したからには受け入れる」ではなく、「**許容できないリスクは譲らない**」。
- 緩和できないリスクは Phase 1 着手の NoGo 条件として残す。
- 推測と事実は明示的にラベル付けする（「ToS 文面確定」「コミュニティ事例」「本書推測」）。

---

## 1. OQ-02 採用に伴う変更サマリー

### 1.1 v1 評価から変わった点（差分表）

| 項目 | v1 評価 | v2 評価 | 増減 |
|---|---|---|---|
| Anthropic 課金モデル | API キー従量必須 | サブスク（Pro/Max）固定費 | コスト固定化（メリット） |
| Anthropic ToS 適合性 | API キーで合法 | OAuth 第三者駆動 = ToS 違反 | **致命悪化** |
| BAN 確率 | ほぼゼロ | 中〜高（後述） | **致命悪化** |
| 月額コスト変動性 | $50〜$5,000+ で爆発リスク | $20〜$200（プラン固定） | **大幅改善** |
| コスト上限制御の必要度 | 最重要 | 二次的（変動部は Codex/Vercel のみ） | 緩和 |
| 主要致命リスク重心 | コスト爆発 | アカウント BAN・運用継続性 | 重心シフト |

### 1.2 新たに追加された致命リスク（v2 で発生）

| ID | リスク | 確率 | 影響 | スコア | 備考 |
|---|---|---|---|---|---|
| **CR-V2-01** | Anthropic Pro/Max OAuth の第三者駆動による即時 BAN（事前通知なし） | H(3) | H(3) | **9** | v1 CR-01 から確率がさらに上昇 |
| **CR-V2-02** | BAN がオーナー個人 Anthropic アカウントに波及し、Sumi (PRJ-012) / Asagi (PRJ-018) / 他全 PRJ の Claude Code 利用が同時停止 | M(2) | H(3) | **6** | アカウント分離未対応の場合は H(3) |
| **CR-V2-03** | サブスク駆動の自動化を維持するため OAuth トークン / セッションを自動取得する実装が必要となり、その経路が ToS 違反濃度を上げる（自動 OAuth 経路の自前実装） | M(2) | H(3) | **6** | 「completely manual session = grey、auto = black」の境界 |
| **CR-V2-04** | Anthropic 側で「Boris Cherny 発言の delta（$200/月で $1k〜$5k 計算消費）」のレートリミット強化が今後さらに厳格化 → 通常利用範囲の縮小で意図せず違反濃度上昇 | M(2) | M(2) | **4** | 半年単位で再評価必須 |

### 1.3 緩和されたリスク（v2 で改善）

| ID | リスク | v1 | v2 | 備考 |
|---|---|---|---|---|
| CR-02（コスト爆発） | スコア 9 | スコア 4 | サブスク固定費で Anthropic 部分は青天井ではなくなる。ただし Codex / Vercel Sandbox 部分は残存 |
| MR-05（embeddings 別課金） | スコア 3 | スコア 3 | サブスクでも embeddings は別、変化なし |

### 1.4 v2 致命・高リスク総合一覧（再掲）

| ID | リスク | スコア | 出自 |
|---|---|---|---|
| **CR-V2-01** | Anthropic OAuth 第三者駆動 BAN | 9 | v2 新規（v1 CR-01 を v2 文脈で再評価） |
| **CR-V2-02** | BAN 波及によるオーナー全業務停止 | 6 | v2 新規 |
| **CR-V2-03** | 自動 OAuth 取得経路の ToS 違反度上昇 | 6 | v2 新規 |
| CR-03 | 既存 PRJ への書込・破壊 | 6 | v1 継続 |
| CR-04 | 公開アプリの法令違反 | 6 | v1 継続 |
| CR-05 | secret 漏洩 | 6 | v1 継続 |
| HR-01 | OpenAI Codex サブスク濫用 | 6 | v1 継続 |
| HR-02〜HR-08 | v1 継続 | 6 / 6 / 3 / 6 / 6 / 4 / 6 | v1 継続 |
| CR-V2-04 | Anthropic レートリミット今後強化 | 4 | v2 新規（中リスク） |
| CR-02（旧） | コスト爆発 | 4（緩和） | v1 から降格 |

---

## 2. サブスクプラン駆動の BAN リスク評価

### 2.1 BAN 発生確率の段階別シナリオ

#### シナリオ A: 完全合法パターン（オーナー本人手動セッション + 指示生成のみ）

- **構成**: オーナーが自身の手で `claude` を起動し対話、Open Claw / Codex は「次に Claude に投げる prompt の文字列」を生成するだけ。OAuth トークンは Open Claw の手に一切渡らない。Claude Code プロセスはオーナーキーボードからのみ起動。
- **BAN 確率**: **ほぼゼロ**（ToS が想定する「ordinary use」範囲。「他人の指示を踏まえて自分が手動で叩く」は AI コーディング支援の通常運用）
- **根拠**: Anthropic ToS 原文（リサーチ §4.2）は「**route requests through ... credentials on behalf of their users**」を禁止。本シナリオでは credentials が transit せず、オーナー本人セッション内で完結する
- **制約**: 24/7 自律稼働は不可。オーナーが在席している時間のみ。本案件 brief の「人間不在で自律稼働」要件と**根本矛盾**する

#### シナリオ B: グレーパターン（オーナー手動ログイン後、標準入力自動投入 / tmux キーストローク投入）

- **構成**: オーナーが手動で `claude` ログイン済セッションを開いておき、Open Claw / Codex がそのターミナルに stdin / tmux send-keys 経由でプロンプトを流し込む
- **BAN 確率**: **中（推定 30〜60%、12 ヶ月以内）**
  - 当面は**技術的検出が困難**（OAuth flow は人間が完了済、リクエストは正規 Claude Code クライアントから発火）
  - ただし以下の検出シグナルでフラグ立つ可能性: ① 異常な request 間隔（人間の typing speed を超える定常 burst）、② 非業務時間帯の連続稼働、③ レートリミット境界での反復停止再開、④ 公式 Max プランの想定計算量（Boris Cherny 発言の $1k〜$5k 計算が monitoring 対象）
- **根拠**: Anthropic ToS は「third-party developers ... offer Claude.ai login or to route requests through ... credentials **on behalf of their users**」を禁止。本シナリオは「自分の credential を自分のために使う（ただし入力は自動）」という、文字通り読む限りギリギリの灰色。**Anthropic は明文で「on behalf of users」と書いており、self-driven 自動化を明示禁止していない**。ただし 2026-02 強化方針 + 「ordinary use」逸脱という総合判断で BAN される事例が報告されている（コミュニティ: jasoncalacanis LinkedIn 等）
- **本書推測**: Anthropic の検出ロジックは**個別の OAuth トラフィック異常検知**ではなく、**月次トータル消費の異常 + サポート tickets** を起点とする可能性が高い。重運用しなければ低確率、Boris Cherny 言及水準（$1k〜$5k 計算）に迫るとフラグ確実

#### シナリオ C: 違反濃厚パターン（OAuth 直接 spawn / 自動ログイン / トークン抽出）

- **構成**: Open Claw / Codex / 自前スクリプトが Claude Code を `spawn`、OAuth トークン（keychain / `~/.config/claude` / `.credentials.json`）を読み取って request 発行、または OAuth flow を Puppeteer で自動完了
- **BAN 確率**: **高（推定 80〜95%、6 ヶ月以内）**
- **根拠**: Anthropic ToS 原文「**Anthropic does not permit third-party developers to offer Claude.ai login**」に直撃。「事前通知なし enforcement」明記。Trend Micro / Cisco の OpenClaw skill 研究（リサーチ §10.4）は同種の自動化を `data exfiltration` 寄りと評価
- **本書評価**: **絶対に採用してはならない**。本書 §3 でも明示的に禁止項目とする

#### シナリオ別の本案件適合性

| シナリオ | brief.md「人間不在自律稼働」要件 | レビュー部門評価 |
|---|---|---|
| A: 完全合法 | 適合せず | 推奨だが、本案件目的を満たさない |
| B: グレー | 部分適合（人間が在席時に自動進行） | **本案件の現実解。ただし§4 強化コントロールで濃度を A 寄りに引き戻す必要あり** |
| C: 違反濃厚 | 完全適合 | **絶対 NoGo** |

### 2.2 BAN 発生時の影響範囲

#### 直接影響

| 範囲 | 影響内容 | 復旧難易度 |
|---|---|---|
| オーナー個人 Anthropic アカウント | Pro/Max プラン即時停止、API キー含む全機能停止 | 困難（appeal 経由、平均 2〜6 週、復旧率不明） |
| オーナー本人の Claude Code 全用途 | claude-code-company 全 PRJ で Claude が使えない | 困難（同上） |
| Sumi (PRJ-012) / Asagi (PRJ-018) 開発 | Claude Code 直接利用部分が停止 | 困難（同上） |
| 既存運用中プロダクト（PRJ-005/009/015/017）の保守 | Claude を介する保守業務全停止 | 困難 |

#### 間接影響

| 範囲 | 影響内容 |
|---|---|
| email / 連絡先 ban | 同 email の他 Anthropic 関連サービス影響可能性 |
| 別アカウント作成 | ToS 違反 ban の場合、新アカウント作成自体が ToS 違反となる可能性高 |
| 信用情報 | Anthropic 内部 blacklist が他社（OpenAI / Google）と情報共有される事例は未確認だが推測ゼロでない |

#### 損失額試算（24h 完全停止 → 復旧 6 週の最悪ケース）

| 項目 | 金額（円） | 備考 |
|---|---|---|
| Sumi 開発停止（PRJ-012、6 週） | 数十万 | 機会損失、リリーススリップ |
| Asagi 開発停止（PRJ-018、6 週） | 数十万 | 同上 |
| 既存運用中 PRJ × 4 件の保守遅延 | 数十万 | 障害対応の遅れ |
| Anthropic Max サブスク $200/月 × 1.5 ヶ月（保留扱い） | $300 | 直接費用 |
| オーナー個人時間（appeal 対応・代替セットアップ） | 100h+ | 自己時給換算 |
| **合計レンジ** | **¥500,000〜¥2,000,000+** | 機会損失中心 |

### 2.3 BAN 早期検知メカニズム

| 検知シグナル | 実装 | 優先度 |
|---|---|---|
| Anthropic からの警告メール | `anthropic.com` 含む全メール件名 / 本文を 1h 以内に Slack へ転送（Gmail フィルタ + push）| **必須** |
| API レスポンス異常コード（401 / 403 / 429 急増） | ハーネスログを 1 分窓で集計、5 件超で alert | **必須** |
| Claude Code の起動失敗（OAuth refresh 失敗等） | exit code 非 0 を Slack 通知 | **必須** |
| 公式ステータスページ異常 | `status.anthropic.com` を 5 分 polling、自分のリクエストだけ失敗ならアカウント側問題と疑う | 推奨 |
| 月次消費が Boris Cherny 言及帯（$1k〜$5k 計算）に近づく | サブスクでも内部 dashboard で monitoring 可、80% で warn / 100% で停止 | **必須** |
| 同 email 他 Anthropic 製品でも認証エラー | console.anthropic.com / claude.ai に 1h 毎ヘルスチェック | 推奨 |

---

## 3. フォールバック計画（必須）

### 3.1 BAN 発生時の即時対応（5 ステップ）

```
[Step 1] 検知 → 自動停止トリガー発火（< 1 分）
   ・Anthropic の 401/403 を観測した時点で全エージェント SIGKILL
   ・全 cron / scheduler 停止
   ・Open Claw に「Anthropic LANE 完全停止」フラグを書き込み

[Step 2] 通知（< 5 分）
   ・Slack #emergency に critical 通知
   ・LINE / SMS でオーナーに本人プッシュ
   ・email サマリ（影響 PRJ 一覧、最終正常時刻、推定原因 = OAuth 違反 BAN）

[Step 3] 進行中案件の保存・退避（< 30 分）
   ・全 worktree を `git stash` または専用 branch へ commit
   ・進行中 prompt / context を Supabase 監査ログから export
   ・実行中 sandbox は 30 分 grace で artifact 退避後 destroy

[Step 4] secret ローテーション（< 1 時間）
   ・Anthropic API キー（保有していれば）revoke → 新規発行は appeal 後
   ・OpenAI / GitHub / Vercel / Supabase の secret を念のため rotate
   ・Anthropic OAuth refresh token を console から revoke

[Step 5] 代替 LANE 起動（< 4 時間）
   ・Plan B（Codex 単独 / OpenHands / Devin）から状況に応じて選択
   ・Phase 1 PoC 中なら一旦完全停止して appeal 結果を待つ判断も可
```

### 3.2 代替プランへの切替

#### Plan B-1: Anthropic API キー従量への即時切替（BAN 前に検知できた場合のみ）

- 前提: BAN は OAuth 駆動が原因。**Console 発行の API キー（Commercial Terms 配下、別契約扱い）は直撃しない可能性が高い** が、同一 email 紐付けなら巻き添え BAN リスクあり
- 切替手順:
  1. Console で API キー発行（Anthropic 管理画面、Pro/Max とは別 billing）
  2. `ANTHROPIC_API_KEY` 環境変数のみで Claude Code 起動するよう harness 設定変更
  3. Anthropic Console で月次 spend cap（例: $300/月）設定
  4. ハーネス内で `cost_check` skill を有効化、累計 80% で warn / 100% で停止
- **判断基準**: BAN 警告メールを受信したが本 ban 前なら即切替。**完全 ban 後は同 email での新規発行は不可**

#### Plan B-2: Codex のみで動かす（Anthropic 完全離脱）

- 前提: Open Claw + Codex のみで開発・レビュー・公開準備を実施。Claude は使わない
- メリット: Anthropic ToS 問題消滅、Codex 公式 sandbox 統合で別軸の安全性
- デメリット: コーディング品質低下（claude-code-company の knowledge は Claude 想定で蓄積）、CLAUDE.md / skill / agents の Claude 固有最適化が無効化
- 切替コスト: 中（skill プロンプトを Codex 互換に書き換える、Codex CLI のサンドボックス設定）
- 適用判断: **Phase 1 PoC のリカバリには有効**。長期方針は再決裁

#### Plan B-3: 代替フレームワーク

| 候補 | 月額 | 切替コスト | 評価 |
|---|---|---|---|
| **OpenHands**（OSS） | self-host のみ | 高（自前運用） | SWE-bench 上位、ToS 自由度高い |
| **Devin (Cognition)** | $500/月〜 | 低（SaaS） | 商用 SaaS、責任分界クリア |
| **Replit Agent 3** | サブスク | 中 | クラウド IDE 統合 |
| **手動運用回帰** | $0 | 低 | Asagi (PRJ-018) ベース、Phase 1 縮退 |

### 3.3 データ・成果物の保護

| 保護対象 | 手順 | 保持期間 |
|---|---|---|
| 進行中の生成コード | `projects/PRJ-019/app/sandbox/` 配下を `git commit` → backup branch push | 90 日 |
| Open Claw の skill / config | git 管理、外部 backup repo（GitHub private）にも push | 永続 |
| 監査ログ（Supabase） | append-only テーブル、別 region に nightly backup（S3 / R2）| 90 日（最低）/ 1 年（推奨） |
| secret （ローテーション前の状態） | 1Password Secrets Automation に旧キー履歴を残し、rotate 後 30 日で削除 | 30 日 |
| 公開済み Vercel プロジェクト | Vercel project は触らず維持（Anthropic BAN は Vercel 側に影響しない） | 維持 |
| GitHub repo | 同上、Anthropic と独立 | 維持 |

---

## 4. サブスク駆動を許容範囲に収める強化コントロール（v2 追加）

v1 の必須コントロール 12 項目（G-01〜G-12）に加えて、**サブスク駆動採用で追加必須**となるコントロール。

### 4.1 追加コントロール一覧

| ID | コントロール | 実装難易度 | 検証方法 | 優先度 |
|---|---|---|---|---|
| **G-V2-01** | **並列セッション数 = 1 の技術的強制** | 中 | ハーネス起動前に `pgrep claude` で既存プロセス検出、複数なら起動拒否。OS レベル lock file `/tmp/claude-code-company.lock` 排他制御 | **必須** |
| **G-V2-02** | **レート自主上限（Anthropic 公式上限の 70% 以下で自主停止）** | 中 | ハーネス内 `rate_check` skill。直近 5h（公式 rolling window）の request / token 累計を内部カウンタで管理、70% で warn / 80% で完全停止 | **必須** |
| **G-V2-03** | **起動元偽装の禁止（user-agent 改変・OAuth 直 spawn 全面禁止）** | 低 | コードレビューで grep `User-Agent` / `oauth` / `keychain` / `credentials` を pre-commit で検出。OAuth flow は手動オーナーセッションのみ | **必須** |
| **G-V2-04** | **指示入力経路の単一化** | 中 | Open Claw → Codex CLI → Claude Code（オーナーセッション）→ プロンプト引数の経路だけを許容。各 hop で task_id / parent_task_id を引き渡し、監査 log に明示記録 | **必須** |
| **G-V2-05** | **監査用 Anthropic アカウントの分離（メイン業務用と PoC 用）** | 中 | 別 email で別 Anthropic アカウント作成、Pro $200/Max でも別 billing。家族プラン or サブアカウント機能の利用可否は §5 で評価 | **必須** |
| **G-V2-06** | **typing 速度・request 間隔の人間化（rate jittering）** | 低 | ハーネスの prompt 投入間に 30s〜180s の jitter、request burst を平準化。完全な人間挙動模倣ではないが「定常 burst」シグナルを薄める | **推奨** |
| **G-V2-07** | **業務時間帯ウィンドウ制限** | 低 | cron で 09:00〜23:00 (JST) のみ稼働、深夜は完全停止。「24/7 稼働」は明らかに ordinary use 逸脱なので避ける | **推奨** |
| **G-V2-08** | **Anthropic からの警告メール監視 → 即停止フック** | 中 | Gmail API で `from:anthropic.com` を 1h polling、警告検知でハーネス全停止 + Slack 通知 | **必須** |
| **G-V2-09** | **月次消費の Boris Cherny 線（$1,000 計算消費換算）に対する自主上限** | 低 | サブスク内利用でも内部 dashboard で「もし API キー従量だったらいくらか」を試算、月 $800 相当超で warn / $1,200 で停止 | **必須** |
| **G-V2-10** | **Anthropic ToS 半年再評価サイクル** | 低 | 6 ヶ月毎にリサーチ部門が `code.claude.com/docs/en/legal-and-compliance` を再 fetch、変更検知で本書を v2.x に更新 | **必須** |
| **G-V2-11** | **OAuth トークンを Open Claw / Codex プロセス空間に到達させない FS / env 隔離** | 中 | `~/.config/claude` / keychain への read 権限を Open Claw / Codex プロセスから剥奪（Linux: AppArmor / Mac: TCC profile） | **必須** |
| **G-V2-12** | **オーナー手動セッション開始 → 自動 prompt 投入のラッパー stdin/tmux 経路の文書化と監査** | 中 | 投入経路を 1 種類に固定（例: 名前付き pipe）、その経路の全イベントを Supabase 監査ログに記録、replay 可能化 | **必須** |

### 4.2 v1 コントロールへの上書き

- v1 G-03（Anthropic API キー専用、OAuth 排除）は **OQ-02 採用により無効化**。代わりに G-V2-01〜G-V2-12 の組み合わせで Anthropic ToS 違反濃度を最小化する。
- v1 G-01（コスト 4 層 hard cap）は Anthropic 部分が固定費化したため、Codex / Vercel / Supabase の 3 層に縮小。ただし G-V2-09 で「サブスク内消費の自主上限」を新設することで実質 4 層維持。

---

## 5. オーナー個人 Anthropic アカウントの保護策

### 5.1 アカウント分離が必須となる理由

- Sumi (PRJ-012) / Asagi (PRJ-018) / 既存運用中 PRJ-005/009/015/017 はすべてオーナー個人 Anthropic アカウントの Claude Code を利用。
- このアカウントが PRJ-019 のサブスク駆動経由で BAN されると、**全業務同時停止 = 損失額レンジ ¥500k〜¥2M（§2.2 試算）**。
- したがって PRJ-019 PoC は**メイン業務用とは異なる Anthropic アカウント**で実施すべき。

### 5.2 アカウント分離の実装方法（候補比較）

| 方法 | 実装容易性 | コスト | リスク |
|---|---|---|---|
| **A. 別 email で完全別アカウント（Max $200/月）** | 高 | +$200/月 | 別人格 ban の波及リスク低、推奨 |
| **B. 別 email で別 Pro $20/月** | 高 | +$20/月 | レートリミット低く PoC 不向きだが BAN 損失最小 |
| **C. Anthropic Team プラン（チームメンバー追加）** | 中 | $25/user/月〜 | チーム所属者の違反は管理者責任、本件用途では微妙 |
| **D. 家族プラン / サブアカウント機能** | — | — | **Anthropic は 2026-05 時点で家族プランを提供していない**（公式 docs 未確認、本書推測）。確認必須 |
| **E. メインアカウントで PoC 実施（分離せず）** | — | $0 | **NoGo 推奨**。BAN 損失影響甚大 |

### 5.3 推奨案

- **Phase 1 PoC は B（別 email で別 Pro $20/月）から開始**。レートリミットが PoC 規模に十分かは要検証
- 不足判明時に **A（別 email で別 Max $200/月）に昇格**
- メインアカウント（Sumi / Asagi / 業務用）は PRJ-019 ハーネスから**物理的に到達不可**（§4 G-V2-11 FS / env 隔離）

### 5.4 分離した場合の運用負荷

| 項目 | 増加分 |
|---|---|
| 月次コスト | +$20〜$200 |
| 運用負荷 | 別 email アドレス管理、別 password 管理、Anthropic Console 2 系統管理 |
| 切替コスト（Phase 完了後にメインへ統合する場合） | 中（OAuth セッション再ログイン、設定再構成） |

---

## 6. ToS 違反グラデーションの明文化

### 6.1 判定表

| # | 行為 | 判定 | 根拠 |
|---|---|---|---|
| 1 | オーナー本人が手動で `claude` 起動、Open Claw は次の prompt 文字列を生成して画面表示するだけ | **完全セーフ（ordinary use）** | ToS は credentials の transit を禁止。本 case は credentials 移動なし |
| 2 | オーナー本人手動ログイン済みの tmux session に Open Claw が send-keys で prompt を投入 | **グレー（許容範囲、§4 強化前提）** | ToS 文面「on behalf of users」直撃せず。ただし「ordinary individual usage」逸脱と総合判定される可能性中 |
| 3 | オーナー手動ログイン済 + Open Claw が stdin pipe / named pipe 経由で prompt 投入 | **グレー（同上）** | 上と同じ判定。実装次第で透明性は向上 |
| 4 | 24/7 連続稼働 + Boris Cherny 言及水準（$1,000+ 計算 / 月）の消費 | **黒寄りグレー** | 「ordinary individual usage」明らかに逸脱、コミュニティ事例で BAN 報告複数 |
| 5 | OAuth トークン / refresh token を Open Claw に直接渡す | **NG（明文違反）** | ToS「**Anthropic does not permit third-party developers to ... route requests through ... credentials on behalf of their users**」直撃 |
| 6 | OAuth flow を Puppeteer / Selenium で自動完了 | **NG（明文違反）** | 同上、加えて自動化検出シグナル多数 |
| 7 | 同一 email で 2 つ以上の Anthropic アカウント作成 | **NG（一般的ToS）** | Anthropic 一般 ToS で多重アカウント禁止と推測（要確認） |
| 8 | Anthropic Console 発行 API キー（Commercial Terms）で自動化 | **完全セーフ** | 公式 docs で「Developers ... should use API key authentication」と明記 |
| 9 | サブスクで第三者向けサービス提供（再販） | **NG（明文違反）** | ToS「on behalf of their users」直撃 |
| 10 | 自分のサブスクで自分の自動化（self-driven） | **未明示・解釈分かれる** | 文字通り読めばグレー、Boris Cherny 発言含意では黒寄り。**本書では §4 強化前提でグレー許容** |

### 6.2 引用根拠

- 公式: Anthropic Claude Code Legal & Compliance（リサーチ §4.2 引用、`code.claude.com/docs/en/legal-and-compliance`）
  > OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support **ordinary use** of Claude Code and other native Anthropic applications.
  > Anthropic does not permit third-party developers to offer Claude.ai login or to **route requests through Free, Pro, or Max plan credentials on behalf of their users**.
  > Anthropic reserves the right to take measures to enforce these restrictions and **may do so without prior notice**.
- 二次: Boris Cherny 発言（PYMNTS, The Register、2026-02 報道）
- コミュニティ事例: jasoncalacanis LinkedIn、blog.devgenius.io、Facebook 投稿（リサーチ §12.4）

---

## 7. 必須コントロール最終版（v2）

### 7.1 全項目一覧

| 区分 | ID | 名称 | Phase 1 着手前 必須 | Phase 1 進行中で OK |
|---|---|---|---|---|
| v1 | G-01 | コスト上限ハードキャップ（Codex/Vercel/Supabase + サブスク内自主上限） | ◯ | |
| v1 | G-02 | 緊急停止スイッチ | ◯ | |
| v1 | G-03 | （無効化、G-V2 系で代替） | — | — |
| v1 | G-04 | 公開前人間承認ゲート | ◯ | |
| v1 | G-05 | FS 書込 allowlist | ◯ | |
| v1 | G-06 | シェル allowlist | ◯ | |
| v1 | G-07 | secret 隔離 microVM | ◯ | |
| v1 | G-08 | GitHub branch protection | ◯ | |
| v1 | G-09 | 監査ログ全件保存 | ◯ | |
| v1 | G-10 | Multi-channel alert | ◯ | |
| v1 | G-11 | 公開可能アプリ allowlist | ◯ | |
| v1 | G-12 | 既存 PRJ への副作用ゼロ証明 | ◯ | |
| v2 | G-V2-01 | 並列セッション数 = 1 の技術強制 | ◯ | |
| v2 | G-V2-02 | レート自主上限 70% | ◯ | |
| v2 | G-V2-03 | 起動元偽装 / OAuth 直 spawn 禁止 | ◯ | |
| v2 | G-V2-04 | 指示入力経路の単一化 | ◯ | |
| v2 | G-V2-05 | 監査用 Anthropic アカウント分離 | ◯ | |
| v2 | G-V2-06 | rate jittering | | ◯ |
| v2 | G-V2-07 | 業務時間帯ウィンドウ | | ◯ |
| v2 | G-V2-08 | Anthropic 警告メール監視 | ◯ | |
| v2 | G-V2-09 | 月次消費の Boris Cherny 線自主上限 | ◯ | |
| v2 | G-V2-10 | ToS 半年再評価サイクル | | ◯（運用） |
| v2 | G-V2-11 | OAuth トークン到達禁止の FS/env 隔離 | ◯ | |
| v2 | G-V2-12 | 投入経路文書化と監査ログ replay | ◯ | |

合計 23 項目（v1 G-03 を v2 で無効化したため 11 + 12 = 23）。**Phase 1 着手前必須は 21 項目、進行中整備可は 2 項目**。

### 7.2 Phase 1 着手前のクリティカル 7 項目

スコープを絞るなら以下 7 項目だけは絶対に揺るがせない:

1. **G-01 コスト上限**（Codex / Vercel / Supabase 3 層 + G-V2-09 サブスク内自主上限）
2. **G-02 緊急停止スイッチ**
3. **G-V2-05 監査用 Anthropic アカウント分離**（メイン業務との延焼遮断）
4. **G-V2-11 OAuth トークン FS/env 隔離**（自動 spawn 防止）
5. **G-V2-08 警告メール監視 → 即停止**
6. **G-04 + G-11 公開ゲート + 公開可能 allowlist**（公開事故の致命防止）
7. **G-09 + G-10 監査ログ + multi-channel alert**

---

## 8. レビュー部門としての Phase 1 着手 Go/NoGo 推奨

### 8.1 v1 → v2 の判定遷移

- v1: **条件付き Go**（API キー前提、必須コントロール 12 項目クリア時）
- v2: **強い条件付き Go**（サブスク駆動前提、必須コントロール 21 項目クリア時 + アカウント分離 + ToS 半年再評価運用）

### 8.2 Go の絶対譲れない条件

1. **§7 必須コントロール 21 項目を 1 つも欠かさず Phase 1 着手前に実装、検証ログを保存**
2. **§5 アカウント分離を完全実施**（メイン業務用 Anthropic アカウントは PRJ-019 ハーネスから物理的に到達不可、`AppArmor` / Mac TCC / FS 権限で強制）
3. **§4 G-V2-03 / G-V2-11**: OAuth 直 spawn / トークン抽出経路は **コードレビュー + 自動 grep 検出** で物理排除
4. **§3 フォールバック計画 5 ステップを drill 訓練で実証**（Phase 1 着手前に最低 1 回の dry-run 実行と復旧時間計測）
5. **Phase 1 PoC は dogfood / dry-run のみ**（実公開ゼロ、自動 deploy ゼロ、外部課金操作ゼロ）
6. **オーナーが §6 ToS グラデーション表で 行 #2〜#4 が「グレーであり残存リスクを承知」と DEC-019-XXX で明示承認**
7. **Phase 1 期間中の月次レビュー必須**: BAN 兆候・コスト・違反濃度を毎月オーナー + CEO に報告、異常時 Phase 1 中断

### 8.3 NoGo 条件（即時）

- 上記 8.2 のいずれかが Phase 1 着手時に未充足
- アカウント分離不可（Anthropic が単一 email 縛りで分離技術的に不可など）
- §6 行 #5〜#9（明文違反系）の実装が一行でも残存
- オーナーが「メインアカウントで PoC やる」と判断

### 8.4 NoGo 時の代替提案

| 案 | 評価 |
|---|---|
| **代替案 1: API キー従量に戻す** | OQ-02 を撤回することになるが、本書 v1 評価では最も合理的 |
| **代替案 2: Codex 単独運用（Claude 不使用）** | 本書 §3.2 Plan B-2、品質低下と引き換えに ToS 問題消滅 |
| **代替案 3: Devin / OpenHands に切替** | 本書 §3.2 Plan B-3、自前ハーネス構築コスト消滅 |
| **代替案 4: Phase 1 を skill / policy / audit 基盤整備のみに縮退** | brief.md「人間不在自律稼働」は将来課題化、PRJ-018 Asagi 延長線 |

### 8.5 レビュー部門最終推奨

**強い条件付き Go**（§8.2 の 7 条件を**全て**満たす場合に限る）。

ただしオーナーには以下を強く伝達する:

- サブスク駆動は **§6 行 #2〜#4 のグレー領域**で運用する。BAN 確率は 0 ではない（中、12 ヶ月以内 30〜60%）
- BAN 損失レンジ ¥500k〜¥2M（§2.2）はオーナーの明示承認なしには許容してはならない
- 安全な代替は依然として API キー従量。OQ-02 を撤回する選択肢はいつでも残しておく

---

## 9. リスク受容判断の決裁プロセス

### 9.1 オーナー明示承認が必須なリスク（DEC-019-XXX に列挙）

| # | リスク | 承認文言例 |
|---|---|---|
| 1 | Anthropic OAuth 第三者駆動の ToS グレー利用（§6 行 #2〜#4） | 「BAN 確率 12 ヶ月で 30〜60% を承知の上で採用」 |
| 2 | BAN 発生時の損失額レンジ ¥500k〜¥2M | 「同水準の損失を許容」 |
| 3 | サブスク駆動 PoC 用に別 Anthropic アカウント月 $20〜$200 追加コスト | 「追加コスト承認」 |
| 4 | Phase 1 期間中、ToS 強化（2026-02 同等の運用変更）が再発した場合の即停止 | 「再発時の即停止運用に異議なし」 |
| 5 | §6 行 #5〜#9（明文違反系）は絶対に採用しない | 「実装段階で違反濃厚 path が混入したら即 NoGo に降格することに同意」 |

### 9.2 承認なしに着手してよいリスク

- v1 既存リスク（CR-03 / CR-04 / CR-05 / HR-01〜HR-08）の v1 緩和策実装
- §7 v2 必須コントロールの実装作業
- アカウント分離の準備作業（別 email 取得、別アカウント作成）
- フォールバック drill 訓練

### 9.3 判断境界

- **「グレー → グレー」は CEO 経由で進めて良い**
- **「グレー → 黒寄り」を判断する場合は必ずオーナー承認**（例: rate jittering を弱める、業務時間帯ウィンドウを撤廃する、月次消費上限を引き上げる、等）
- **「黒（明文違反）」は絶対に採用してはならない**（CEO・PM・Dev の権限内で却下、オーナー承認があってもレビュー部門は反対する）

---

## 10. 関連ドキュメントとリンク

- v1: `projects/PRJ-019/reports/review-security-and-risk-assessment.md`
- リサーチ: `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`
- PM: `projects/PRJ-019/reports/pm-requirements-and-architecture.md`
- 補完リサーチ（未着）: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- PM v2（未着）: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
- リスク台帳: `projects/PRJ-019/risks.md`（v2 反映予定）
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-XXX で本書を Phase 1 Go/NoGo 判定材料として添付推奨）

---

## 11. 結論（要約）

### 11.1 致命リスク Top 3 と緩和策

1. **CR-V2-01（Anthropic OAuth 第三者駆動 BAN、スコア 9）**
   → §6 行 #2〜#4 のグレー範囲のみ採用、§4 G-V2-01〜12 強化コントロール、§5 アカウント分離

2. **CR-V2-02（BAN 波及によるオーナー全業務停止、スコア 6）**
   → §5 別 email / 別 Anthropic アカウントでの完全分離、§4 G-V2-11 FS/env 隔離

3. **CR-V2-03（自動 OAuth 取得経路の違反濃度上昇、スコア 6）**
   → §6 行 #5〜#9 の絶対禁止、§4 G-V2-03 自動 grep 検出 + コードレビュー二重チェック

### 11.2 BAN フォールバック手順 5 ステップ（§3.1 再掲）

1. **検知（< 1 分）**: 401/403/429 観測で全エージェント SIGKILL + cron 全停止
2. **通知（< 5 分）**: Slack #emergency / LINE / SMS / email でオーナー本人プッシュ
3. **退避（< 30 分）**: worktree commit、prompt/context export、sandbox artifact 退避
4. **secret rotate（< 1 時間）**: Anthropic / OpenAI / GitHub / Vercel / Supabase の全 secret rotate
5. **代替起動（< 4 時間）**: Plan B-1（API キー従量）/ B-2（Codex 単独）/ B-3（OpenHands・Devin）から選択、PoC 中は完全停止判断も可

### 11.3 Phase 1 着手 Go/NoGo 最終推奨

**強い条件付き Go**。§8.2 の 7 条件を**全て**満たす場合に限る。

満たせない場合は §8.4 代替案 1（API キー従量に戻す）を再検討推奨。BAN 損失レンジ ¥500k〜¥2M を**オーナーが明示承認**しない限り着手しない。

---

**v2 確定**: 2026-05-02 ／ **次回更新**: ① 補完リサーチ `research-supplement-tos-and-subscription-paths.md` 完成時、② PM v2 `pm-architecture-v2-and-phase1-plan.md` 完成時、③ Phase 1 着手判定 DEC-019-XXX 発行時、④ Anthropic ToS 半年再評価時（G-V2-10）
