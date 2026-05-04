# openclaw-monitor

PRJ-019 Clawbridge — 上流 (anthropics/claude-code GitHub release / npm latest / Anthropic Engineering blog RSS / openclaw-runtime) の breaking change を 1 日 1 回検知し、severity L1/L2/L3 に分類して通知する独立 worker。

- 関連 SOP: `projects/PRJ-019/reports/research-issue-changelog-monitor-ops.md` (DEC-019-035 採択予定)
- 関連 Runbook: `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md` (v1.0)
- 関連 DEC: DEC-019-022 / DEC-019-035

---

## 構成

```
projects/PRJ-019/app/scripts/openclaw-monitor/
├── package.json                # check / report / dispatch / test scripts
├── tsconfig.json               # strict TS, ESM
├── vitest.config.ts
├── state.json                  # 直近観測 tag/hash (GitHub Actions cache で永続化)
├── src/
│   ├── check-upstream.ts       # entrypoint: 並列 fetch → classify → notify → save
│   ├── sources.ts              # 上流 source 定義 (URL / parser / authEnv)
│   ├── fetcher.ts              # undici + fast-xml-parser によるフェッチ層
│   ├── severity-classifier.ts  # 9 種 keyword regex + 3 シグナル昇格判定
│   ├── notify.ts               # severity → channel ルーティング
│   ├── state.ts                # state.json の load/save 純粋関数
│   └── types.ts                # 共有型
├── tests/
│   ├── severity.test.ts        # ユニットテスト
│   └── fixtures/               # GitHub Atom / npm registry の代表例
└── .github/workflows/openclaw-monitor.yml
```

## 通知ルート (DEC-019-035 §4 + DEC-019-049 反映)

| Lv | 検知例 | 通知先 channel | transport |
|---|---|---|---|
| L1 | minor / patch release / docs typo | log のみ (stdout / Actions summary) | log |
| L2 | deprecation 1 件 / archived 警告 | Slack `#monitor` + Resend dev mail | slack + email |
| L3 | BREAKING CHANGE / semver major / 3+ シグナル / personal-only pivot | Slack `#drill` + Resend Owner mail (即時) | slack + email |

DEC-019-049 反映で Slack workspace は `prj019-claude-code-company` 新規作成、既存業務 Slack と分離。3 channel (`#hitl` / `#monitor` / `#drill`) を `SLACK_WEBHOOK_HITL` / `SLACK_WEBHOOK_MONITOR` / `SLACK_WEBHOOK_DRILL` の 3 webhook で独立運用。

severity L3 検知時は SOP §3.2 に従い 24h 自律ループ pause + HITL 第 7 種 `external_api` ゲートを連動させること (本 worker は通知のみ、HITL gate 起動は harness 側 W2 統合タスク)。

**Slack post 失敗時の fallback**: 3 回 retry 後も失敗した場合、`RESEND_API_KEY` 経由で Resend メールに自動切替。fallback も失敗した場合は log + skipped 配列に記録し、main flow は止めない。

## 運用手順

### 初回セットアップ (Owner / Phase 1 W0-Week2、DEC-019-048 / DEC-019-049 反映)

1. Slack workspace `prj019-claude-code-company` を新規作成 (DEC-019-049)、3 channel `#hitl` / `#monitor` / `#drill` を作成し、それぞれに incoming webhook を発行。
2. 1Password Vault `prj019` の `slack` entry に 3 webhook を保存:
   - `webhook_hitl` / `webhook_monitor` / `webhook_drill`
3. Resend free plan で API key を発行し Vault `prj019/resend/api_key` に保存。送信先 allowlist に Owner / Dev mail を登録。
4. GitHub PAT (scope: `read:public_repo`) を Vault `prj019/github/pat_read_only` に保存。
5. 1Password Service Account を発行し token を取得 (DEC-019-048)。
6. GitHub Actions secrets には **`OP_SERVICE_ACCOUNT_TOKEN` のみ** を登録 (旧 `SLACK_CHANGELOG_WEBHOOK_URL` 等の登録は不要、workflow 側で `op://` reference 経由で取得)。

### 通常運用

- daily 18:00 UTC (= 03:00 JST) に GitHub Actions が自動起動。
- 検知結果は GitHub Actions ログ + Slack thread に記録。
- L3 検知時は Owner / CEO に即時メール、harness 側で 24h pause。
- 月次で `pnpm run report` を実行し誤検知レビュー、必要に応じて `severity-classifier.ts` の regex を更新。

### ローカル実行

```bash
pnpm install
pnpm run check        # 通常 check + dispatch + state save
pnpm run report       # 結果を JSON で stdout (state は更新しない)
pnpm run dispatch     # state を更新せずに通知のみ再送
pnpm test             # vitest
pnpm run typecheck    # tsc --noEmit
```

## Secret 参照ルール (DEC-019-048 反映)

- 全て `${VAR}` 形式で env から取得し、ソース直書き禁止。
- 本 worker 直下の `.env` は `.gitignore` 対象 (リポルートで管理済み)。
- 本番環境 (GitHub Actions) では **1Password Service Account integration** で管理 (DEC-019-048 で Doppler から正式変更)。`1password/load-secrets-action@v2` が `op://prj019/...` reference を解決し env に展開する。
- ローカル開発時は `op run --env-file=../../.env.local -- pnpm run check` の形で起動。

## 月額コスト見込

| 項目 | 想定使用量 | コスト |
|---|---|---|
| GitHub Actions (public repo) | 月 30 run × 約 2 min | $0 |
| Slack incoming webhook | 月 50〜200 通知 | $0 |
| Resend free plan | 月 30〜100 mail | $0 |
| GitHub API (PAT) | 月 200 req | $0 (5,000/h 制限内) |
| **合計** | | **$0/月** |

DEC-019-012 月次予算 $300 / 月内、≤$5/月 制約に完全準拠。

## 拡張ポイント (Phase 2 以降)

- Codex CLI / Enderfga plugin 系統の追加 (SOP §1.2 W1 placeholder 解消後)
- Atom feed 5 分 polling worker への分離 (現状は daily polling baseline のみ)
- Supabase `changelog_events` 直書き連携 (現状は通知のみ、ログ DB 化は Dev W2)
- `organization/knowledge/` への自動 retrieval 連携 (PRJ-019 W4 vector store 構築後)

## 注意事項

- `openclaw-runtime` placeholder URL は Phase 1 W1 (5/22 期限) で確定予定。確定後 `src/sources.ts` の URL を更新すること。
- false positive が月 5 件以上連続した場合は `severity-classifier.ts` のヒューリスティクス更新 + Review 部門協議 (SOP §3.4)。
