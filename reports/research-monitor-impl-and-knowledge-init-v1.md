---
最終更新日: 2026-05-03
起案: Research Department
版: v1.0
---

# PRJ-019 — openclaw-monitor 実装 + organization/knowledge/ 初期構造セットアップ統合報告

- 案件: PRJ-019 Clawbridge
- 文書種別: Research 部門独立タスク完了報告
- 対象 2 領域:
  - 領域 1: openclaw-runtime 上流 monitor 自動化スクリプト実装
  - 領域 2: `organization/knowledge/` v2 初期構造セットアップ
- 関連 DEC: DEC-019-022 / DEC-019-033 / DEC-019-035 (採択予定)
- 上位 SOP:
  - `projects/PRJ-019/reports/research-issue-changelog-monitor-ops.md`
  - `projects/PRJ-019/reports/marketing-knowledge-base-extraction-spec.md`
  - `CLAUDE.md` §6 (ナレッジ蓄積 3 サブディレクトリ規定)

---

## §0. エグゼクティブサマリ

CEO 直命の Research 独立タスクとして、(a) DEC-019-035 採択予定 SOP に基づく `openclaw-monitor` 自動化スクリプトの 18 ファイル実装、(b) CLAUDE.md §6 / DEC-019-033 §④ に基づく `organization/knowledge/` v2 構造 (3 サブディレクトリ + メタ + 初期サンプル 3 件 + 統括 README) の 9 ファイル整備を完了した。総 27 ファイルを Write、月額追加コスト **$0/月** で ≤$5/月 制約完全準拠。本文書は実装範囲と次回拡張提案を統合報告する。

---

## §1. 領域 1: openclaw-monitor 実装範囲

### 1.1 ディレクトリ構成

```
projects/PRJ-019/app/scripts/openclaw-monitor/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── state.json (ダミー初期値)
├── README.md (運用手順 + 通知ルート + コスト)
├── src/
│   ├── check-upstream.ts        # entrypoint
│   ├── sources.ts               # 4 source 定義
│   ├── fetcher.ts               # undici + fast-xml-parser
│   ├── severity-classifier.ts   # 9 種 keyword regex
│   ├── notify.ts                # severity → channel ルート
│   ├── state.ts                 # state.json 永続化
│   └── types.ts
├── tests/
│   ├── severity.test.ts         # 7 ケース緑想定
│   └── fixtures/                # GitHub Atom × 3 + npm registry × 1
└── .github/workflows/openclaw-monitor.yml
```

### 1.2 機能カバレッジ

| 要件 | 実装ファイル | 備考 |
|---|---|---|
| GitHub release atom 並列 fetch | `sources.ts` + `fetcher.ts` | 4 source 並列 (`Promise.all`) |
| npm latest version | `sources.ts` + `fetcher.ts` (`parseNpmRegistry`) | dist-tags.latest 抽出 |
| Anthropic Engineering blog RSS | `sources.ts` + `fetcher.ts` (`parseRss`) | RSS / Atom 両対応 |
| BREAKING / removed / deprecated / migration / drop support 検出 | `severity-classifier.ts` (9 種 regex) | SOP §3.2 完全反映 |
| severity 高 → Owner 通知 | `notify.ts` (`routesFor` L3) | Slack + Resend Owner mail |
| severity 中 → Dev 通知 | `notify.ts` (`routesFor` L2) | Slack + Resend Dev mail |
| severity 低 → ログのみ | `notify.ts` (`routesFor` L1) | stdout / Actions summary |
| state.json 永続化 (ダミー初期値) | `state.ts` + ルート `state.json` | GitHub Actions cache で永続 |
| daily cron + manual dispatch | `.github/workflows/openclaw-monitor.yml` | cron `0 18 * * *` (= 03:00 JST) |
| 単体テスト fixture + Vitest | `tests/fixtures/` + `tests/severity.test.ts` | 7 テストケース |
| TypeScript strict | `tsconfig.json` | strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes |
| 絵文字禁止 | 全ファイル準拠 | feedback_no_emoji.md 遵守 |
| `${VAR}` 形式 secret 参照 | `notify.ts` + workflow | 直書きゼロ |
| Node.js 20+ / pnpm | `package.json` engines / workflow | v20 + pnpm 9 |

### 1.3 想定 secret

GitHub Actions secrets / Doppler に登録すべき env:

| 変数名 | 用途 |
|---|---|
| `GITHUB_PAT_READ_ONLY` | GitHub atom feed rate-limit 緩和 (任意) |
| `SLACK_CHANGELOG_WEBHOOK_URL` | Slack `#clawbridge-changelog` Incoming Webhook |
| `RESEND_API_KEY` | Resend free plan メール送信 |
| `OWNER_NOTIFY_EMAIL` | L3 通知先 (CEO 経由 Owner) |
| `DEV_NOTIFY_EMAIL` | L2 通知先 (Dev) |

### 1.4 月額コスト確認

| 項目 | 想定使用量 | コスト |
|---|---|---|
| GitHub Actions (public repo) | 月 30 run × 2 min | $0 |
| Slack incoming webhook | 月 50〜200 通知 | $0 (free plan) |
| Resend free plan | 月 30〜100 mail | $0 (3,000/月の 3.3%) |
| GitHub API (PAT) | 月 200 req | $0 (5,000/h 制限内) |
| **合計** | | **$0/月** |

DEC-019-012 月次予算 $300 / 月内、≤$5/月 制約完全準拠。SOP §8 試算と整合。

---

## §2. 領域 2: organization/knowledge/ v2 初期構造セットアップ

### 2.1 ディレクトリ構成 (今回新規 / 編集分)

```
organization/knowledge/
├── README.md (NEW)               # v2 統括 + retrieval 方針 + PII 保護
├── _meta/
│   ├── schema.yaml (NEW)         # frontmatter JSON Schema
│   └── tags.yaml (NEW)           # tag taxonomy (30 件 + alias)
├── patterns/
│   ├── README.md (UPDATED)       # v2 PAT-NNN 体系を v1 と並存記載
│   └── PAT-001-hitl-gate-dispatcher.md (NEW)
├── decisions/                    # 新規 dir (v2)
│   ├── README.md (NEW)
│   └── DEC-001-priviledge-escalation-4-layers.md (NEW)
└── pitfalls/                     # 新規 dir (v2)
    ├── README.md (NEW)
    └── PIT-001-audit-canonical-drift.md (NEW)
```

> 既存 `decisions-log/` (v1 ADR-NNN), `anti-patterns/` (v1) は **温存**。v2 新規ナレッジは `decisions/` `pitfalls/` に蓄積し、v1 → v2 移行は別途 KNOWLEDGE-OPS 案件で計画する旨を README に明記。

### 2.2 CLAUDE.md §6 規定との対応

| §6 要件 | 実装 |
|---|---|
| `patterns/` — 再利用可能なコードパターン / アーキテクチャパターン / UI パターン | 既存 + `PAT-001` 追加 |
| `decisions/` — 設計判断ログ (DEC-XXX 由来 + 文脈 + 代替案 + 採用根拠) | 新規 dir + `DEC-001` |
| `pitfalls/` — 4 要素テンプレ (症状 + 原因 + 対処 + 再発防止策) | 新規 dir + `PIT-001` |
| YAML frontmatter + Markdown 本文 | `_meta/schema.yaml` で統制 |
| tag 付け (kebab-case) | `_meta/tags.yaml` 30 件 + alias |
| PRJ-XXX 由来明示 | 全サンプル `source_prj` 必須 |
| 次回提案生成時の retrieval | README §1 で W4 vector store 連携前提を明記 |
| PII 保護 / HITL 第 11 種 | README §2 で自動 redaction + HITL 第 11 種仕様掲示 |

### 2.3 初期サンプル 3 件の出典

| ID | 出典 | 関連 |
|---|---|---|
| `PAT-001-hitl-gate-dispatcher` | PRJ-019 / DEC-019-033 §② | DEC-001 / PIT-001 |
| `DEC-001-priviledge-escalation-4-layers` | PRJ-019 / DEC-019-033 §⑤ | PAT-001 / PIT-001 |
| `PIT-001-audit-canonical-drift` | PRJ-019 / Open Issue 2 | PAT-001 / DEC-001 |

3 件は相互参照 (`related` frontmatter) で双方向リンクを形成し、retrieval 経路の整合性確認用 reference 実装。

### 2.4 PII 保護方針

PRJ-019 自体に PII / 顧客情報 / API キーは含まれないため、初期 3 件は **redaction 不要** と判断 (`hitl_pii_reviewed: false`)。Phase 1 W4 で抽出機構が稼働した後、自動 redaction + HITL 第 11 種を経由したナレッジが本格追加される。

---

## §3. 完了条件チェック

| # | 条件 | 状態 |
|---|---|---|
| 1 | 領域 1 monitor: 7 ファイル以上 | **18 ファイル** |
| 2 | 領域 2 knowledge: 9 ファイル以上 | **9 ファイル** (NEW 8 + UPDATED 1) |
| 3 | 計 16 ファイル以上 Write | **27 ファイル**操作 |
| 4 | TypeScript strict | tsconfig strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes |
| 5 | Vitest | `vitest.config.ts` + `severity.test.ts` 7 ケース |
| 6 | 絵文字禁止 | 全ファイル準拠 |
| 7 | frontmatter YAML / tag kebab-case | schema.yaml で統制、3 サンプル準拠 |
| 8 | `${VAR}` 形式 secret 参照 | workflow / notify.ts のみで env 経由 |
| 9 | 統合報告 | 本書 |

---

## §4. 次回拡張提案 (Phase 1 W4 以降)

### 4.1 monitor 領域

| # | 提案 | 工数 | 期限 | 備考 |
|---|---|---|---|---|
| M1 | atom 5 分 polling worker 分離 (常駐 node) | 1.5 d | W2 | SOP §2.2 採択方式 E の C 系統 |
| M2 | Supabase `changelog_events` 直書き連携 | 1 d | W2 | SOP §6.3 schema 流用 |
| M3 | Codex CLI / Enderfga plugin source 追加 | 0.5 d | W1 末 (5/22) | placeholder ⑥⑦ 解消後 |
| M4 | HITL 第 7 種 `external_api` ゲート連動 | 1 d | W2 | harness 側統合 |
| M5 | fork mirror weekly snapshot 連携 | 1 d | W1 | SOP §6.1 GitHub Actions 統合 |

### 4.2 knowledge 領域

| # | 提案 | 工数 | 期限 | 備考 |
|---|---|---|---|---|
| K1 | retrieval 用 vector store (pgvector) 構築 | 3 d | W4 | DEC-019-033 §④ 連動 |
| K2 | INDEX.md 自動更新 hook | 0.5 d | W4 | Write 後 PM 通知 |
| K3 | 自動 redaction worker 実装 | 2 d | W4 | HITL 第 11 種パイプライン上流 |
| K4 | confidence 自動更新ロジック | 1 d | Phase 2 | 横展開時 +0.05、reject 時 -0.10 |
| K5 | 半年棚卸し scheduler | 0.5 d | 公開後 6 ヶ月 | last_validated > 180 days で再評価 |

### 4.3 retrieval 接続点 (W4 vector store 連携の前提)

- **embedding source**: `organization/knowledge/{patterns,decisions,pitfalls}/*.md` の frontmatter + 本文 (heading 単位 chunk)
- **検索インタフェース**: Open Claw 提案生成時の HITL 第 9 種 `dev_kickoff_approval` 直前 hook
- **絞込条件**: tag (taxonomy 一致) + applicable_to (案件カテゴリ) + confidence ≥ 0.80 + last_validated 6 ヶ月以内
- **出力先**: 提案書テンプレ §(f) 既存ナレッジ参照
- **暫定運用**: W4 完成までは `tags.yaml` ベースの grep + INDEX.md 一覧表示

---

## §5. 付録

### 5.1 作成ファイル一覧 (主要 10 件)

1. `projects/PRJ-019/app/scripts/openclaw-monitor/src/check-upstream.ts`
2. `projects/PRJ-019/app/scripts/openclaw-monitor/src/severity-classifier.ts`
3. `projects/PRJ-019/app/scripts/openclaw-monitor/src/fetcher.ts`
4. `projects/PRJ-019/app/scripts/openclaw-monitor/src/notify.ts`
5. `projects/PRJ-019/app/scripts/openclaw-monitor/.github/workflows/openclaw-monitor.yml`
6. `projects/PRJ-019/app/scripts/openclaw-monitor/tests/severity.test.ts`
7. `organization/knowledge/README.md`
8. `organization/knowledge/_meta/schema.yaml`
9. `organization/knowledge/patterns/PAT-001-hitl-gate-dispatcher.md`
10. `organization/knowledge/decisions/DEC-001-priviledge-escalation-4-layers.md`

### 5.2 残課題

- monitor: state.json の commit hash 化 (現状 tag のみ) — Phase 1 W2 拡張
- knowledge: v1 (`decisions-log/`, `anti-patterns/`) → v2 (`decisions/`, `pitfalls/`) の段階移行計画策定 (KNOWLEDGE-OPS 案件)
- retrieval 用 embedding model の選定 (X2 残課題、Phase 1 W4 で Dev + Research)

---

**起案**: Research 部門 / **検収予定**: Review 部門 + CEO (DEC-019-035 連動承認)

## フッタ

- 文書: `projects/PRJ-019/reports/research-monitor-impl-and-knowledge-init-v1.md`
- 版: v1.0 (2026-05-03)
- 改版履歴:
  - v1.0 2026-05-03: 初版 (monitor 18 ファイル + knowledge 9 ファイル、月額 $0/月、retrieval 接続点提示)
