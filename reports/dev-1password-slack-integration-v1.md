# PRJ-019 Dev 部門報告 — 1Password CLI / Slack 3-channel 統合反映 v1

**作成**: 2026-05-03
**起案部門**: Dev
**対象決裁**: DEC-019-048 (1Password CLI 採択) / DEC-019-049 (Slack 新規 workspace)
**Phase**: Phase 1 W0-Week2 ブートストラップ拡張
**ステータス**: Owner 検証済 (5/4) → **DEC-019-053 で再設計 → v2 へ移行**

> **Update (2026-05-04)**: Owner が v1 検証で「8 service × 21 fields の Vault 登録は過剰」と判断、即決 DEC-019-053 を発令。本 v1 は **Owner 検証済 (dev:noop で localhost:3000 表示確認)** のうえで凍結し、`.env.example` の 2-tier 再設計 (真の secret 9 fields のみ Vault 登録 + 平文 12 fields 分離) は **v2 (`dev-1password-slack-integration-v2.md`)** に引き継ぐ。RC-1〜RC-6 は v2 §7 に継承、新規 RC-7 (Vercel 環境変数 9 fields 同期) は v2 で起票。

---

## §1. 反映決裁

### DEC-019-048 (Owner 直接決裁 2026-05-03)

> secret 管理ツールに 1Password CLI を採択。Doppler との比較で Owner が判断、既存 1Password 利用想定 + チーム拡張時のシームレス連携優位。
>
> **影響**: `.env.local` は `op://` references で記述、CI は `op run --` で env 注入、Doppler 関連手順は手順書から削除。

### DEC-019-049 (Owner 直接決裁 2026-05-03)

> Slack workspace を新規作成方針で確定。既存 workspace 流用ではなく PRJ-019 専用 workspace「prj019-claude-code-company」相当を新規作成。
>
> **影響**: 既存業務 Slack と完全分離、HITL 通知 / monitor アラート / drill 通知の 3 channel 構成を独立運用、メンバー追加時の権限管理が明確化。

---

## §2. 変更ファイル一覧

| 区分 | ファイル | 変更内容 |
|---|---|---|
| 編集 | `projects/PRJ-019/app/.env.example` | 全 secret を `op://prj019/<service>/<field>` references に変換、Slack 3 webhook entry 追加、ヘッダコメントで `op run --` 想定を明示 |
| 編集 | `projects/PRJ-019/app/web/package.json` | `dev` / `build` / `start` を `op run --env-file=../.env.local --` 前置に変更、`dev:noop` トラブルシューティング script 新規追加 |
| 編集 | `projects/PRJ-019/app/scripts/openclaw-monitor/.github/workflows/openclaw-monitor.yml` | Doppler 依存を撤去し `1password/load-secrets-action@v2` + `OP_SERVICE_ACCOUNT_TOKEN` 経由で 3 webhook + Resend + PAT を注入する steps を追加 |
| 新規 | `projects/PRJ-019/app/lib/notify/slack.ts` | 3 channel 別 Slack webhook 投稿ライブラリ。channel 引数 + Zod validation + retry 3 回 + 構造化 failure 返却 + severityToChannel mapper |
| 編集 | `projects/PRJ-019/app/scripts/openclaw-monitor/src/notify.ts` | severity → channel mapping を 3 channel 体制に拡張、Slack 失敗時の Resend fallback、`op://` 未解決時の fail-fast |
| 編集 | `projects/PRJ-019/app/README.md` | `Setup` セクション (1Password CLI インストール + Vault 構成)、`Run` セクション (`op run --` 前提)、`Secrets Management` セクション (5 大ルール + rotation SOP)、採択履歴 |
| 編集 | `projects/PRJ-019/app/scripts/openclaw-monitor/README.md` | 通知ルート表を `#monitor` / `#drill` に更新、Slack fallback 仕様、初回セットアップ手順を 1Password Vault 経由に変更 |
| 新規 | `projects/PRJ-019/reports/dev-1password-slack-integration-v1.md` | 本報告書 |

合計 **8 ファイル** (新規 2 / 編集 6)。

---

## §3. 動作確認手順 (Owner 検証用、3 ケース)

### Case 1: ローカル開発で `op run` ラッパー疎通確認

**目的**: `.env.local` の `op://` reference が `op run` で実値に展開され、`pnpm dev` が secret を読めること。

```bash
cd projects/PRJ-019/app
op signin                                      # 1Password にサインイン
cp .env.example .env.local                     # 配置 (app/.env.local が正規 path)
# app/.env.local の op://prj019/... を確認
pnpm install
pnpm --filter @clawbridge/web dev               # 内部で op run --env-file=../.env.local -- next dev が起動
```

**期待**: Next.js dev server が起動し、ブラウザで http://localhost:3000 が開けること。Console に `op://...` が残っていないこと (= 実値が解決済み)。

**重要 (2026-05-04 訂正)**: `.env.local` の正規配置場所は `app/.env.local`。`app/web/package.json` の `dev` script は `op run --env-file=../.env.local --` (cwd = `app/web/` から相対) で **`app/.env.local` を参照** する。`app/web/.env.local` に置くと `[ERROR] open ../.env.local: The system cannot find the file specified.` で fail する。

### Case 2: Slack 3 channel post smoke

**目的**: `app/lib/notify/slack.ts` から 3 channel 全てに smoke message が届くこと。

```bash
cd projects/PRJ-019/app
op signin
op run --env-file=.env.local -- node --experimental-vm-modules -e "
  import('./lib/notify/slack.ts').then(async (m) => {
    for (const ch of ['hitl', 'monitor', 'drill']) {
      const r = await m.postSlack(ch, {
        header: 'PRJ-019 smoke test',
        context: 'channel=' + ch + ' / DEC-019-048+049 verification',
        actions: [{ type: 'button', text: 'OK', value: 'ack_' + ch }]
      });
      console.log(ch, r);
    }
  });
"
```

**期待**: `#hitl` / `#monitor` / `#drill` 各 channel に header + context + button が投稿される。`ok: true` が 3 回返る。`#drill` への smoke は事前に Slack で予告すること。

### Case 3: GitHub Actions workflow dry run

**目的**: `OP_SERVICE_ACCOUNT_TOKEN` のみ登録した状態で workflow が走り、3 webhook が解決されること。

```
1. Owner が GitHub Actions Secrets に `OP_SERVICE_ACCOUNT_TOKEN` を登録
2. Actions タブで `openclaw-monitor` workflow を `workflow_dispatch` 起動 (mode: report)
3. Run log の `Load secrets from 1Password` step が success
4. `Run check` step で `severity` 検知時に Slack post が走る (デモ用 fixture を設定済みなら)
```

**期待**: `Load secrets from 1Password` step が green、`SLACK_WEBHOOK_HITL` / `SLACK_WEBHOOK_MONITOR` / `SLACK_WEBHOOK_DRILL` が masked で env に展開される。

---

## §4. 1Password Service Account 移行ロードマップ (Phase 2 検討)

| 段階 | 期間 | 内容 |
|---|---|---|
| **現状 (Phase 1 W0-Week2)** | 2026-05-09〜2026-05-15 | Owner 個人 1Password 利用、Service Account は Phase 1 W1 着手前に発行 |
| **Phase 1 W1** | 2026-05-26〜2026-05-30 | Service Account Token 発行 + GitHub Actions Secrets 登録 + Vercel 環境変数の 1Password integration 検討開始 |
| **Phase 1 W4** | 2026-06-13〜2026-06-20 | Owner / Dev / Review / Marketing メンバー追加時の Vault `prj019` 権限分離 (read-only / read-write) を運用化 |
| **Phase 2 (PoC 後)** | 2026-06-27〜 | 多 tenant 化を見据えた Vault 命名規則 (`prj019-prod` / `prj019-staging`) と Service Account 分離、SCIM 連携検討 |

---

## §5. 残課題

| # | 課題 | 対応期限 | 担当 |
|---|---|---|---|
| RC-1 | **Vercel 環境変数の 1Password integration 連動** — 現状 Vercel ダッシュボードで手動入力。1Password Vercel marketplace integration もしくは `vercel env pull` を `op run` でラップする方式を選定 | Phase 1 W1 (5/26〜5/30) | Dev |
| RC-2 | `OP_SERVICE_ACCOUNT_TOKEN` の発行と GitHub Actions Secrets 登録 (Owner 操作) | W0-Week2 末 | Owner |
| RC-3 | Slack workspace `prj019-claude-code-company` の作成と 3 channel + webhook 発行 (Owner 操作) | W0-Week2 末 | Owner |
| RC-4 | `app/lib/notify/slack.ts` に対する Vitest ユニットテスト追加 (retry / channel mapping / Zod validation 各 case) | Phase 1 W1 | Dev |
| RC-5 | `openclaw-monitor/src/notify.ts` の既存 vitest が新 mapping (drill / monitor) でも green 維持か再確認 | Phase 1 W1 | Dev |
| RC-6 | Vault `prj019/notify/owner_email` / `dev_email` の登録 — Phase 1 W1 で Owner 確定 | Phase 1 W1 | Owner |
| **RC-7** | **DEC-019-053 で再設計** — `.env.example` を 2-tier (真 secret 9 fields + 平文 12 fields) に圧縮、`dev:noop` を公式 unblock path 化、Vercel 環境変数 9 fields 同期。v2 (`dev-1password-slack-integration-v2.md`) で対応 | W0-Week2 着手前 (5/9) | Dev |

---

**v1**: 2026-05-03 起案 (DEC-019-048 / DEC-019-049 反映、A〜G 全項目完了、Owner 検証待ち)
**v1.1**: 2026-05-04 cross-ref 追記 — Owner 検証済 (dev:noop で localhost:3000 確認) + DEC-019-053 で再設計 → v2 へ移行
