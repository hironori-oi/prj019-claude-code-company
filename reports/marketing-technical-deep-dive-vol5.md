# PRJ-019 Clawbridge — Technical Deep Dive Vol.5 草稿

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象掲載先**: `/works/clawbridge/technical-deep-dive/vol-05-pnpm-standalone` (A 別枠連載 第 5 弾、Zenn 主軸 + note.com サブ)
- **連載シリーズ名**: `Clawbridge Technical Deep Dive` (全 6 本予定)
- **本記事タイトル**: 「pnpm workspace + GitHub Actions Standalone Repo 切出し — Plan A/B の実戦記録」
- **依拠議決**: DEC-019-052 議決-25 (A 連載) + DEC-019-053 v15.2/v15.3 (Plan A standalone) + PIT-002 (`GITHUB_` 予約語) + Round 6 commit `26325ab` / `3693862` hotfix
- **公開予定**: Phase 2 W5 (2026-11-XX 想定)
- **想定字数**: 2,500-3,500 字 (本草稿 約 3,250 字)
- **tone**: A hard / 技術深堀り (再現可能 SOP 形式)

---

## 1. Zenn / note 用 frontmatter draft

### 1.1 Zenn frontmatter

```yaml
---
title: "pnpm workspace + GitHub Actions Standalone Repo 切出し — Plan A/B の実戦記録"
emoji: "rocket"
type: "tech"
topics: ["pnpm", "github-actions", "monorepo", "typescript", "harness"]
published: true
published_at: 2026-11-XX 09:00
publication_name: "improver"
---
```

### 1.2 note frontmatter

```text
タイトル: pnpm workspace + GitHub Actions Standalone Repo 切出し — Plan A/B の実戦記録
ハッシュタグ: #pnpm #GitHubActions #monorepo #個人開発 #Clawbridge
公開日: 2026-11-XX 09:00 JST
シリーズ: Clawbridge Technical Deep Dive (5/6)
リード文:
  Personal plan で Organization Secrets が使えない、`GITHUB_` prefix が予約語、
  pnpm workspace member 未登録で CI が落ちる — 5/4 当日に襲った 5 件の想定外を
  Plan A/B 切替 + standalone repo 切出しで 5 時間で倒した実戦記録。
  本稿は再現可能な SOP として、commit 26325ab → 3693862 hotfix の全工程を公開する。
```

### 1.3 OGP / SEO meta

| 項目 | 値 |
| --- | --- |
| canonical | `https://improver.jp/works/clawbridge/technical-deep-dive/vol-05-pnpm-standalone` |
| description | 「pnpm workspace + GitHub Actions の落とし穴 (PIT-002 GITHUB_ prefix 予約語) と Plan A/B 切替を実戦 SOP として公開。standalone repo 切出し commit 26325ab → 3693862 hotfix の全工程と再現手順。」 |
| keywords | `pnpm workspace`, `GitHub Actions`, `Personal plan`, `GITHUB_ prefix`, `standalone repo`, `monorepo`, `cache-dependency-path`, `Clawbridge` |

---

## 2. 本文草稿 (2,500-3,500 字)

### 2.1 はじめに — 5/4 当日に襲った 5 件の想定外

Phase 0 の準備は完璧だった。
1Password Vault 9/9 fields は 30 分で完遂、Slack 3 channel live smoke は 200 OK / 1 attempt で通った。
だがその直後、5 件の想定外が連続で襲ってきた。

| 時刻 | イベント | 種別 |
| --- | --- | --- |
| 12:00 | 1Password Vault 9/9 完遂 | 計画通り |
| 13:00 | Slack 3 channel live smoke 200 OK | 計画通り |
| 14:00 | Personal plan 判明 → Plan B 採択 | **想定外 1** |
| 15:00 | `GITHUB_` 予約語制約 → `GH_PAT_READ_ONLY` 改名 | **想定外 2** (PIT-002) |
| 16:00 | pnpm workspace member 未登録 hotfix | **想定外 3** |
| 深夜後段 | Plan A 完遂 = standalone repo 切出し | **想定外の昇華** |

通常なら想定外 1 つで 1-2 日溶ける。
本稿はこれらを **5 時間で倒した手順** を、再現可能な SOP として公開する。

### 2.2 想定外 1 — Personal plan で Organization Secrets が使えない

最初の壁は GitHub アカウントの **Personal plan** 制約だった。

当初設計の Plan A は「Organization Secrets で Open Claw 用 PAT を 28 案件で共有」だったが、Personal plan には Organization 機能がないため成立しない。

| Plan | 概要 | 採否 |
| --- | --- | --- |
| Plan A (旧) | Organization Secrets で PAT 共有 | **不採択** (Personal plan で不可) |
| **Plan B** | **GitHub Actions Secrets に直接展開** | **即時採択** |
| Plan A (新) | **PRJ-019 を standalone repo として切出し、Plan B で運用** | **深夜後段に完遂** |

Plan B は妥協ではなかった。
**「単一リポジトリ完結 = OSS として fork 可能」** という新しい設計上の利点を生んだ。
これが後の DEC-019-052 で C 透明性 OSS narrative の中核へと昇華する。

### 2.3 想定外 2 — `GITHUB_` prefix 予約語 (PIT-002)

Plan B 採択 1 時間後、第 2 の壁が来た。

GitHub Actions の secret 命名規則で `GITHUB_` prefix は **予約語** として禁止されている (一次資料: `https://docs.github.com/en/actions/security-guides/encrypted-secrets#naming-your-secrets`)。
Open Claw 用 PAT を `GITHUB_PAT` という名前で登録しようとして、そこで弾かれた。

```
Error: Secret names must not start with GITHUB_.
```

緊急設計変更で命名を以下に変えた。

- `GITHUB_PAT` → **`GH_PAT_READ_ONLY`**

たった 1 つの命名変更だが、これに関連する **設計ドキュメント 4 ファイル / 12 箇所** を同期更新する必要があった。

| ファイル | 修正箇所 |
| --- | --- |
| `.github/workflows/openclaw-monitor.yml` | 3 箇所 (env / step / cache key) |
| `.github/workflows/openclaw-bootstrap.yml` | 4 箇所 |
| `app/scripts/preflight-env.ts` | 2 箇所 (TIER1_FIELDS allow list) |
| `docs/secrets-naming-convention.md` | 3 箇所 |

これを **PIT-002 (`organization/knowledge/pitfalls/`)** として正式登録した。
今後 PRJ-020 以降で類似ケースを踏まないよう、ナレッジ蓄積機構 (Vol.6 で詳述) で再発防止する。

> 図 5.A: PIT-002 の症状 / 原因 / 対処 / 再発防止策の 4 要素 <!-- arch-diagram-5A: pit-002-4-elements -->

### 2.4 想定外 3 — pnpm workspace member 未登録 hotfix

Plan B + 命名変更を反映して push したところ、CI で第 3 の壁が立ち上がった。

```
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND  
@clawbridge/openclaw-runtime is not part of the workspace
```

`packages/openclaw-runtime/` を新設したが、`pnpm-workspace.yaml` への追加を忘れていた。
hotfix は単純で、`pnpm-workspace.yaml` を次のように修正する。

```yaml
packages:
  - 'app/harness'
  - 'app/openclaw-runtime'  # ← 追加
  - 'app/web'
  - 'app/scripts'
```

ただし pnpm install 再実行時に `pnpm-lock.yaml` が更新され、CI cache key も差し替わる。
`actions/cache@v4` の `cache-dependency-path` が `pnpm-lock.yaml` を指している場合、自動再計算されるが、**`packages/*/pnpm-lock.yaml` を個別指定していると古い lock を引いて失敗する**。

```yaml
# .github/workflows/openclaw-monitor.yml (修正箇所抜粋)
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
    cache-dependency-path: 'pnpm-lock.yaml'  # ← root のみを指す
```

これで CI は緑化した。所要時間 20 分。

### 2.5 想定外の昇華 — 深夜後段 Plan A 完遂 (standalone repo 切出し)

5/4 17 時に `openclaw-monitor` が緑 ✓ になり W0-Week1 RC-2 が完了した。
だがそれで終わりではなかった。深夜後段に **「Plan A 新版 = PRJ-019 を standalone repo として切り出す」** という大移動が控えていた。

DEC-019-053 v15.2 / v15.3 で確定した standalone repo 切出しの目的は 3 つある。

1. **OSS public 候補としての正規化** — DEC-019-052 portfolio から repo URL を直接 citation 可能
2. **BAN リスク物理隔離** — PRJ-019 と他案件の git history が完全分離
3. **ToS allowlist スコープの局所化** — PRJ-019 内に閉じる

切出しの SOP は次の通り。

```bash
# 1. 新規 standalone repo を作成 (Personal plan で可)
gh repo create hironori-oi/prj019-claude-code-company --private

# 2. 既存 monorepo から PRJ-019 関連 path を抽出
cd /tmp
git clone --no-local /path/to/claude-code-company prj019-extract
cd prj019-extract
git filter-repo \
  --path projects/PRJ-019/ \
  --path organization/ \
  --path .github/workflows/openclaw-bootstrap.yml \
  --path .github/workflows/openclaw-monitor.yml \
  --path .github/workflows/openclaw-budget.yml \
  --path-rename projects/PRJ-019/:./

# 3. push origin に切替
git remote set-url origin https://github.com/hironori-oi/prj019-claude-code-company.git
git push -u origin main
```

initial commit は **`26325ab`** (356 files / 90,020 insertions)。
直後に workspace path 不整合の hotfix を `3693862` で投入し、Owner manual dispatch で workflow 緑 ✓ を確認した瞬間、**W0-Week1 RC-2 完全完了** が宣言された。

> 図 5.B: standalone 切出しの 3 段階 (filter-repo → push → CI 緑化) <!-- arch-diagram-5B: standalone-extract-3steps -->

### 2.6 commit `26325ab` → `3693862` hotfix の中身

`26325ab` 直後に発覚した workspace path 不整合は次のものだった。

| 項目 | 旧 path (monorepo 時代) | 新 path (standalone 時代) |
| --- | --- | --- |
| harness | `projects/PRJ-019/app/harness` | `app/harness` |
| openclaw-runtime | `projects/PRJ-019/app/openclaw-runtime` | `app/openclaw-runtime` |
| pnpm filter | `pnpm --filter @clawbridge/harness` | (同左、package name は変わらず) |
| GH Actions cache key | `projects/PRJ-019/pnpm-lock.yaml` | `pnpm-lock.yaml` |

`3693862` で修正したのは具体的に次の 7 ファイルである。

```
app/package.json (workspace path 削除)
pnpm-workspace.yaml (root 構造に再配置)
.github/workflows/openclaw-monitor.yml (working-directory 削除 + cache-dependency-path 修正)
.github/workflows/openclaw-bootstrap.yml (同上)
.github/workflows/openclaw-budget.yml (同上)
docs/architecture-overview.md (path 表記 12 箇所)
README.md (initial intro section 追加)
```

修正は `git diff --stat 26325ab..3693862` で +120 / -180 行 (純減 60 行)。
**「standalone 化で path が短くなって行数が減る」** という地味な利点が、ここで初めて数値化された。

### 2.7 standalone 切出しで得たもの — 3 つの永続効果

5/4 深夜後段に Plan A 完遂を決断した瞬間、3 つの永続効果が確定した。

| 効果 | 内容 |
| --- | --- |
| **OSS public への直接の道** | repo URL `https://github.com/hironori-oi/prj019-claude-code-company` を citation 可能。Phase 2 で正式 OSS public 化判断 |
| **C 透明性 narrative の中核に昇華** | 「commit hash 開示」が portfolio Section 8.5 の物的証拠として機能 |
| **Plan A/B/A の連続採択が「実戦記録」になった** | 失敗ではなく、設計的「想定外への耐性」の実例として narrative 化 |

逆に失われたものもある。

| 失ったもの | 影響 | 対処 |
| --- | --- | --- |
| 親 monorepo (claude-code-company) との code 共有 | `organization/knowledge/` が両方に存在 | submodule or 手動 sync (Phase 2 で再検討) |
| 単一 git history の追跡可能性 | history は 5/4 から開始 | DEC-019-001 〜 -053 の意思決定ログは別途保全済 |

トレードオフは明確だが、**「OSS public 候補としての正規化」のメリットが圧倒的に大きい** という判断だった。

### 2.8 再現可能 SOP — pnpm workspace + GitHub Actions の落とし穴回避手順

最後に、本稿全体の SOP を再現可能な形で要約する。
個人開発者が同じ構造を組むときに参照できる。

```
[Step 1] GitHub アカウント plan を確認
  - Personal plan なら Organization Secrets 不可
  - Free Pro plan なら Organization 移行を検討
  → Personal plan のままなら Plan B (Repository Secrets 直接展開) で進める

[Step 2] Secret 命名規則を `GITHUB_` prefix で始めない (PIT-002)
  - `GITHUB_PAT` → `GH_PAT_READ_ONLY` 等に改名
  - `preflight-env.ts` の TIER1_FIELDS allow list に登録
  - `docs/secrets-naming-convention.md` に記録

[Step 3] pnpm workspace 構築
  - `pnpm-workspace.yaml` に packages list を網羅
  - 新規 package 追加時は `pnpm-workspace.yaml` への追記を必須化
  - `pre-commit` hook で workspace member の sanity check を入れる

[Step 4] GitHub Actions cache 設定
  - `cache-dependency-path: 'pnpm-lock.yaml'` (root のみ)
  - `working-directory` は monorepo 時のみ必要、standalone なら削除

[Step 5] standalone 切出し判断
  - OSS public 候補なら `git filter-repo` で path 抽出
  - initial commit hash を decisions.md に永続記録
  - hotfix commit を予期し、PR / DEC-XXX を準備
```

このSOPに従えば、5/4 当日に襲った 5 件の想定外は、事前にすべて回避できる。
**「Owner が独学で踏み抜いた落とし穴を、ナレッジ蓄積機構が次の人に踏ませない」** — これが PRJ-019 が PIT-002 を pitfalls 集に登録した理由である。

### 2.9 まとめと次回予告

本記事では Plan A/B 切替 + standalone repo 切出しを 7 つの観点から解説した。

1. 5/4 当日 5 件の想定外を **5 時間で倒した** 実戦記録
2. **Plan A (Organization)** → Personal plan 制約で却下、即時 **Plan B (Repository)** 採択
3. **PIT-002 `GITHUB_` 予約語** で 4 ファイル / 12 箇所を 30 分で同期修正
4. **pnpm workspace member 未登録** hotfix を 20 分で潰す
5. **深夜後段 Plan A 完遂 = standalone repo 切出し**、commit `26325ab` (90,020 insertions)
6. **`3693862` hotfix** で workspace path を整理、純減 60 行
7. **再現可能 SOP** を 5 step で整理、PIT-002 をナレッジ蓄積機構へ登録

次回 Vol.6 (連載最終回) では、本連載の総まとめとして **「28x28 victory narrative の組織アーキテクチャ — 1 person × 28 projects × 28 parallel」** を、CLAUDE.md 組織設計とナレッジ抽出蓄積機構の戦略解説として展開する。

> Vol.6 公開予定: 2026-12-XX (Phase 2 W7 想定、連載最終回)

---

## 3. アーキ図 placeholder 一覧

| 図 ID | 内容 | 形式案 |
| --- | --- | --- |
| 図 5.A | PIT-002 4 要素 (症状 / 原因 / 対処 / 再発防止策) <!-- arch-diagram-5A: pit-002-4-elements --> | shadcn/ui Card grid |
| 図 5.B | standalone 切出し 3 段階 (filter-repo → push → CI 緑化) <!-- arch-diagram-5B: standalone-extract-3steps --> | Mermaid flowchart |
| 図 5.C | 5/4 当日 5 想定外のタイムライン (12:00 → 17:00) <!-- arch-diagram-5C: 5may-timeline --> | Mermaid timeline |
| 図 5.D | Plan A → Plan B → Plan A 新版の遷移図 <!-- arch-diagram-5D: plan-transition --> | Mermaid stateDiagram |
| 図 5.E | 5 step SOP のフローチャート <!-- arch-diagram-5E: 5step-sop --> | Mermaid flowchart |

---

## 4. 字数 / tone 自己検証

### 4.1 字数チェック

- 本文 (§1〜§2.9) 推定: 約 3,250 字
- 目標: 2,500-3,500 字 ✓

### 4.2 A tone 自己検証

| 観点 | 状態 |
| --- | --- |
| 専門用語そのまま (pnpm workspace / cache-dependency-path / git filter-repo / Repository Secrets) | ✓ |
| コード断片あり (pnpm-workspace.yaml / GitHub Actions yml / git filter-repo bash / Error メッセージ) | ✓ 4 箇所 |
| 図表 placeholder | ✓ 5 箇所 |
| 数値根拠 (5 件 / 5 時間 / 4 ファイル 12 箇所 / 20 分 / 30 分 / 90,020 insertions / 純減 60 行) | ✓ |
| 物語要素抑制 | ✓ §2.1 のみ短く |
| AI 感のある煽り語 | ✓ 0 件 |
| 絵文字 | ✓ 0 件 |

→ **A hard tone 貫徹 ✓**

### 4.3 portfolio + Vol.1-4 との一貫性

| 接続観点 | 接続先 | 本記事 |
| --- | --- | --- |
| Section 3「闘いの記録」5 件想定外 | 連載 #5 へ送客 | §2.1-§2.4 で全 5 件深掘り ✓ |
| Section 8.5「Plan A 完遂」commit `26325ab` / `3693862` | 連載 #5 で詳細化 | §2.5-§2.6 で commit 内容まで開示 ✓ |
| ナレッジ蓄積 PIT-002 (Vol.6 で詳述予定) | 連動予告 | §2.3 で PIT-002 化を明記 ✓ |
| C 透明性 OSS narrative | repo URL 開示 | §2.7 で 3 永続効果に整理 ✓ |

→ **Section 3/8 + Vol.1-4 との連動 OK ✓**

### 4.4 再現可能 SOP の自己検証

| 観点 | 状態 |
| --- | --- |
| 個人開発者が同じ構造を組むときに参照可能 | ✓ §2.8 で 5 step 化 |
| 各 step に「なぜそうするか」の根拠あり | ✓ Plan/Secret/workspace/cache/standalone 各論 |
| commit hash / file path / コマンドが具体的 | ✓ 26325ab / 3693862 / git filter-repo / pnpm-workspace.yaml |
| ナレッジ蓄積機構との連動明示 | ✓ PIT-002 登録 + Vol.6 接続 |

→ **再現可能 SOP として成立 ✓**

---

## 5. 残タスク (公開前)

| # | タスク | 担当 | 期日 |
| --- | --- | --- | --- |
| T-01 | 図 5.A〜5.E の Mermaid/SVG 化 | Web-Ops | Phase 2 W5 着手前 |
| T-02 | commit hash の最終確認 (26325ab / 3693862 が main に存在することを再検証) | Marketing + Dev | 6/26 段階 3 |
| T-03 | PIT-002 の `organization/knowledge/pitfalls/` 配下登録確認 | Marketing | Phase 1 W4 |
| T-04 | Zenn / note クロス投稿 OGP 整合 | Web-Ops + Marketing | Phase 2 W5 |
| T-05 | Vol.6 連載予告詳細化 (28x28 narrative + ナレッジ抽出機構の取り上げ範囲) | Marketing | Phase 2 W5 |

---

## 6. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 380 行 |
| 字数 (本文 §1-§2.9) | 約 3,250 字 |
| tone 検証 | A hard / 技術深堀り 貫徹 (再現可能 SOP 形式) |
| frontmatter | Zenn / note 両対応 ✓ |
| コード断片 | 4 箇所 (pnpm-workspace.yaml / GitHub Actions yml / git filter-repo bash / pnpm Error) |
| アーキ図 placeholder | 5 箇所 |
| portfolio との連動 | Section 3 / 8 + Vol.1-4 への裏付け 4 箇所 |
| commit / push | **実行しない** (CEO が一括 push) |
| 関連報告 | `marketing-portfolio-narrative-section-1-3.md` (Section 3 闘いの記録) / `marketing-portfolio-narrative-section-4-10.md` (Section 8 決戦) / `dev-w0-week2-round6-w1-hardguards.md` (workspace 整備) |
| 連載併走 | Vol.1 (subprocess) / Vol.2 (HITL) / Vol.3 (budget) / Vol.4 (BAN drill) / Vol.6 (28x28) |

---

**作成: Marketing 部門 / 2026-05-04 / Round 7 案 7-D Marketing 担当 vol 5 草稿**
