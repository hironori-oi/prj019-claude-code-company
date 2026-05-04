# PRJ-019 `app/` ディレクトリ

## 全体図

PRJ-019「Clawbridge」は **Owner-in-the-loop 透明 AI 組織ハーネス基盤** (DEC-019-033) です。アプリ実体は組織ルール (`organization/rules/project-setup-checklist.md` 最優先ルール) に従い、本ディレクトリ配下に配置します。**PRJ-020 ClawDialog は DEC-020-003 同居方針** により `clawdialog/` サブルートで併走し、HITL Gate / Spend Cap / 監査ログ系統を共有します。

```
projects/PRJ-019/app/
├── README.md                    # 本ファイル
├── .env.example                 # 環境変数テンプレ (キー名のみ、secret 直書き禁止)
├── docs/                        # ADR / API spec / PoC / W0 アーキ・セキュ図
│   ├── architecture-w0.md       # 4 層防御 + 7 container アーキ
│   ├── security-w0.md           # STRIDE + 50 controls + 4 層防御
│   ├── adr/ api-spec/ poc/
├── web/                         # ★Next.js 15 App Router (透明性 Dashboard + 権限 UI + 提案承認 UI)
│   ├── package.json / tsconfig.json / next.config.ts / tailwind.config.ts / postcss.config.mjs
│   └── src/
│       ├── app/                 # App Router routes (placeholder)
│       ├── types/hitl.ts        # HITL 11 種 TS interface (DEC-019-033 §②③④⑤)
│       └── lib/
│           ├── openclaw-wrapper/  # RuntimeWrapper / FeatureFlag / VersionPin / CircuitBreaker
│           └── audit/hash-chain.ts # SHA-256 hash chain verify
├── supabase/
│   ├── migrations/              # 8 テーブル DDL (hitl_requests / audit_log / policy_versions /
│   │                            #                 policy_audit_log / proposals / cost_ledger /
│   │                            #                 runtime_wrapper_state / knowledge_extraction_queue)
│   └── policies/                # 各テーブル RLS policy SQL (8 ファイル)
├── policies/
│   └── casbin/                  # model.conf + policy.csv (RBAC + 7 category × deny envelope)
├── clawdialog/                  # ★PRJ-020 同居 placeholder (DEC-020-003)
├── harness/                     # ハーネス制御層 (cost / kill / hitl / circuit / usage / time)
├── orchestrator/                # claude-code-company 接続層
├── claude-bridge/               # Claude Code subprocess spawn 層 (P-D 改、本人 OAuth)
├── openclaw-runtime/            # Open Claw OSS 自前ホスト
├── sandbox/                     # Vercel Sandbox 連携
├── audit/                       # 監査ログ・トレース
├── notify/                      # 通知層
├── tests/                       # Vitest 単体 + Playwright 統合
└── scripts/                     # 副作用ゼロ確認スクリプト等
```

## DEC-019-033 + DEC-020-003 同居方針

| 共有資源 | 同居の利点 |
|---|---|
| HITL Gate (11 種) | 同一 `hitl_requests` / 同一 worker、二重実装回避 |
| Spend Cap | 同一 `cost_ledger`、PRJ-020 API コストも同枠で監視 (月次 $300 ハードキャップ) |
| Audit log | 同一 SHA-256 hash chain、双方向 channel の証跡を統合 |
| Supabase / Vercel project | $0 追加 (Hobby + Free Tier 内) |

priviledge escalation 4 層防御 (DEC-019-033 §⑤) を本 scaffold で物理実装:

- **L1 Static Policy**: `policies/casbin/policy.csv` の deny envelope (13 prohibited domains 永遠 deny)
- **L2 Runtime FeatureFlag**: `web/src/lib/openclaw-wrapper/` の `FeatureFlagStore`
- **L3 HITL 10 permission_change_review**: `web/src/types/hitl.ts` + `supabase/migrations/...hitl_requests.sql` CHECK constraint
- **L4 Audit + Anomaly Detection**: `web/src/lib/audit/hash-chain.ts` + Postgres `audit_log_compute_hash` trigger

**service_role key を subprocess に渡さない**: `.env.example` で明文化、`SUPABASE_SERVICE_ROLE_KEY` は Web (Next.js API route) のみ参照、claude-bridge / openclaw-runtime subprocess の env には注入しない。

## Setup (DEC-019-053 / 2-tier 設計)

PRJ-019 の secret 管理は **2-tier 構造** で運用する (DEC-019-053、Owner 即決 2026-05-04)。

- **Tier 1** = 真の secret **9 fields / 4 items**。1Password Vault `prj019` 必須。
- **Tier 2** = 平文 **12 fields**。NEXT_PUBLIC / paths / 定数。`.env.local` で dummy 値を上書き or Vercel 環境変数で別管理。

初回 boot は **`dev:noop` 経由を Owner 推奨手順** とする。Tier 1 の Vault 登録完了後に `dev` (op run --) に切り替える。

### 1. 1Password CLI インストール (Tier 1 必要時のみ)

Tier 1 (Vault) を解決して起動するときのみ必要。Tier 2 のみで boot する場合は不要。

```bash
# macOS / Linux
brew install --cask 1password-cli       # macOS
# Windows
winget install AgileBits.1Password.CLI  # Windows 11 primary
# 動作確認
op --version    # 2.x 系を期待
```

### 2. 1Password Vault 構成 (Tier 1 / 9 fields × 4 items)

DEC-019-053 で **真の secret のみ Vault 登録** に圧縮。Owner Vault 登録は ~30 分目標。

| Vault | Item (entry) | Field | count | 用途 |
|---|---|---|---|---|
| `prj019` | `supabase` | `service_role_key`, `db_url` | 2 | service_role は subprocess 漏洩禁止 (DEC-019-033 §⑤)、DB_URL は CLI migrate |
| `prj019` | `slack` | `webhook_hitl`, `webhook_monitor`, `webhook_drill` | 3 | DEC-019-049 / 3 channel 独立運用 |
| `prj019` | `resend` + `notify` | `api_key`, `owner_email`, `dev_email` | 3 | api_key = credential、emails = PII (Vault 集約) |
| `prj019` | `github` | `pat_read_only` | 1 | upstream monitor |
| **計** | **4 items** | | **9 fields** | |

**Tier 2 (Vault 外、平文)**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `CLAWBRIDGE_TENANT_ID` / `CLAWBRIDGE_OWNER_USER_ID` / `CLAUDE_CODE_CLI_PATH` / `CLAUDE_CODE_PINNED_VERSION` / `OPENCLAW_BINARY_PATH` / `OPENCLAW_PINNED_VERSION` / `SPEND_CAP_*` / `ANTHROPIC_*_THRESHOLD` などは `.env.example` に dummy 値で記載済み、`.env.local` で上書き、もしくは Vercel 環境変数で別管理する。

### 3. ローカル `.env.local` の作成

```bash
cp projects/PRJ-019/app/.env.example projects/PRJ-019/app/.env.local
# .env.local は gitignored
# - Tier 1 (9 fields) は op:// reference のまま
# - Tier 2 (12 fields) は dummy 値が入っているので、必要に応じて実値で上書き
```

## Pre-flight check (DEC-019-053 + v2.2 hotfix)

Tier 1 / 9 fields の op:// 解決状態を **Slack post なしで** 検証する。3 mode 用意。Vault 構築進捗に応じて使い分ける。

| mode | 用途 | コマンド (cwd = `projects/PRJ-019/app/`) | Vault 状態依存 |
|---|---|---|---|
| **env** (推奨初期) | RC-2/3/6 進行中、Vault 未投入 / 部分投入で **常に動作**。op:// reference を literal で表示。op run all-or-nothing 仕様を回避 | `pnpm tsx scripts/preflight-env.ts` | なし |
| **vault** (構築進捗) | `op item list --vault=prj019` で Vault inventory を可視化、次に作るべき item を提示 | `pnpm tsx scripts/preflight-vault.ts` | op signin 済 |
| **resolved** (Vault 完成後) | 全 9 fields が `[resolved]` で返ることを op run 経由で確認 | `op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts` | 全 5 items 投入済 |

各 field が `[resolved]` / `[unresolved]` / `[missing]` のいずれで返るかを確認し、Vault 投入の進捗管理に使う。secret 値の本体は出力されず、length のみ表示される。

**重要 (v2.2 で訂正)**: mode resolved は `op run` の **all-or-nothing** 仕様により、Vault に **1 item でも未作成**だと `could not find item <name> in vault` で abort する。RC 進行途中は **mode env** を使うこと。

## Run (2 path / DEC-019-053)

### Path A: `dev:noop` (Vault 登録前 / 公式 unblock path)

Owner 5/4 検証済 = `op` 未 signin / 1Password CLI 未導入でも localhost:3000 起動可能。

```bash
cd projects/PRJ-019/app
pnpm install
pnpm --filter @clawbridge/web dev:noop
# → http://localhost:3000 表示。Tier 1 を要求する API route は env_missing で fail-fast。
```

### Path B: `dev` (Vault 登録後、op run -- 経由)

Tier 1 を 1Password CLI で解決して起動する正規 path。

```bash
cd projects/PRJ-019/app
op signin

pnpm install      # workspace 解決 + 依存取得 (secret 不要)
pnpm typecheck    # 全 workspace 型チェック (secret 不要)
pnpm test         # Vitest 全件 (secret 不要、live integration は default 除外)
pnpm lint         # eslint flat config (secret 不要)

# `web/package.json` の `dev` / `build` / `start` は内部で op run --env-file=../.env.local -- を前置済み
pnpm --filter @clawbridge/web dev      # = op run --env-file=../.env.local -- next dev
pnpm --filter @clawbridge/web build    # = op run --env-file=../.env.local -- next build
```

CI 相当のローカル実行:

```bash
pnpm typecheck && pnpm test && pnpm lint
# 全部緑なら commit OK
```

**Slack smoke は v2.1 (`../reports/dev-1password-slack-integration-v2-1.md`) §2 を参照** (3 段階 = pre-flight / dry-run / live)。v1/v2 §3.2 Case 2 のコマンド (`node --experimental-vm-modules -e ...`) は撤回済み。

### Path C: drill #2 1-shot real-execution (5/7 朝 06:00-08:00 JST、Review-F 担当)

drill #2 は subprocess 実機検証。Round 14 Dev-C で `--mode real` flag 整備 + Round 15 Dev-L (Task L-2) で audit log SHA-256 hash chain integrity verifier と G-12 dry-run-guard 抑止 helper が wire-up 済。

```bash
cd projects/PRJ-019/app/e2e

# dry-run (mock 経路 / 副作用ゼロ確証)
pnpm tsx src/__tests__/drill-2-1-shot-real-execution.harness.ts --mode dry-run --date 2026-05-07 --verbose

# real-mode (5/7 朝 06:00 operator 起動 / 実 Claude Code CLI を spawn)
pnpm tsx src/__tests__/drill-2-1-shot-real-execution.harness.ts \
  --mode real \
  --date 2026-05-07 \
  --cli-path /usr/local/bin/claude \
  --verbose
```

**audit log + hash chain wire-up** (Round 15 Dev-L Task L-2):

drill 中の audit entry 整合性検証は、harness 経由ではなく `drill-2-real-wireup.ts` helper を使う:

```ts
import {
  createDrillRealWireupContext,
  appendScenarioStandardSequence,
  verifyDrillHashChainIntegrity,
  verifyDrillG12NotFiring,
  disposeDrillRealWireupContext,
} from './src/__tests__/drill-2-real-wireup.js'

const ctx = await createDrillRealWireupContext({ mode: 'audit-real' })
try {
  // 9 scenarios x 2 entries = 18 audit entry を append
  for (const s of DRILL_2_SCENARIOS) {
    await appendScenarioStandardSequence(ctx, s, { pid, exitCode, exitSignal, aborted })
  }
  // SHA-256 hash chain integrity verify
  const integrity = await verifyDrillHashChainIntegrity(ctx, 18)
  // G-12 (DryRunGuard) が drill モード中に発火していないことを assert
  const g12 = await verifyDrillG12NotFiring(ctx)
  console.log(integrity.chainValid, g12.notFiring)
} finally {
  await disposeDrillRealWireupContext(ctx)
}
```

**resource quota** (Round 15 Dev-L Task L-1):

subprocess spawn 時の cgroup v2 / Job Object 強制は `cli/spawn-resource-attach.ts` の `attachResourcePlanCrossPlatform(spec, pid, opts)` 1 関数に統合済。MIN/DEFAULT/MAX 値は `cli/resource-quota-constants.ts` で一元管理 (`DRILL_2_RECOMMENDED_QUOTA = { cpuPercent: 200, memoryBytes: 512 MiB, maxMs: 60s, killGraceMs: 200ms }`)。Linux 以外は noop+warn fallback で副作用ゼロ。

## Secrets Management (DEC-019-048 / DEC-019-049 / DEC-019-053)

### Tier 1 (Vault 必須 / 9 fields)

| # | service | fields | rotation cycle | 影響範囲 |
|---|---|---|---|---|
| 1 | Supabase | `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` | 90 日 / 漏洩疑い時 | Web API route のみ (subprocess 注入禁止) |
| 2 | Slack | `SLACK_WEBHOOK_HITL` / `_MONITOR` / `_DRILL` | 漏洩疑い時 / member 離脱時 | notify 層 + GitHub Actions |
| 3 | Notification | `RESEND_API_KEY` / `OWNER_NOTIFY_EMAIL` / `DEV_NOTIFY_EMAIL` | 90 日 / PII 変更時 | notify 層 |
| 4 | GitHub | `GITHUB_PAT_READ_ONLY` | 90 日 | scripts/openclaw-monitor |

**Tier 1 5 大ルール**:

1. **secret を直書きしない** — `.env.local` / コード / コミット / PR / log / テスト fixture いずれも `op://` reference のみ。実値は 1Password Vault `prj019` に格納。
2. **`op run --env-file=...` 経由で実行** — local / CI 双方で `op run` ラッパーを通して env を解決。`op://` のまま subprocess に渡ったら fail-fast (lib 側で `env_missing` 扱い)。
3. **CI は 1Password Service Account** — GitHub Actions では `1password/load-secrets-action@v2` + `OP_SERVICE_ACCOUNT_TOKEN` (1 個のみ GH Secrets に登録) で読み出し。Doppler は禁止。
4. **3 channel Slack 分離 (DEC-019-049)** — `prj019-claude-code-company` workspace 内 `#hitl` / `#monitor` / `#drill` の独立運用。severity → channel mapping は `app/lib/notify/slack.ts` の `severityToChannel()` 関数で正本管理。
5. **service_role key を subprocess に渡さない** — `SUPABASE_SERVICE_ROLE_KEY` は Web (Next.js API route) のみ参照 (DEC-019-033 §⑤ priviledge escalation 物理防止)。

### Tier 2 (平文 / 12 fields)

| 区分 | fields | 管理方針 |
|---|---|---|
| NEXT_PUBLIC_* | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser 公開前提、RLS で行レベル保護。Vercel 環境変数で別管理推奨 |
| Tenant 識別子 | `CLAWBRIDGE_TENANT_ID` / `CLAWBRIDGE_OWNER_USER_ID` | UUID 定数、漏洩しても権限昇格に直結しない (RLS + Casbin で保護) |
| Path / Version | `CLAUDE_CODE_CLI_PATH` / `CLAUDE_CODE_PINNED_VERSION` / `OPENCLAW_BINARY_PATH` / `OPENCLAW_PINNED_VERSION` | 環境固有、`.env.local` で上書き |
| 定数 (Anthropic) | `ANTHROPIC_MONTHLY_CAP_USD` / `ANTHROPIC_WARN_THRESHOLD` / `ANTHROPIC_STOP_THRESHOLD` | 数値定数、リポジトリ正本で OK |
| 定数 (Spend Cap) | `SPEND_CAP_MONTHLY_USD` / `SPEND_CAP_PROPOSAL_USD` / `SPEND_CAP_TASK_USD` | 数値定数、リポジトリ正本で OK |

**起動順序**: `cp .env.example .env.local` → Tier 2 の dummy 値を実値で上書き → `pnpm dev:noop` で boot 確認 → Tier 1 を Vault 登録 → `pnpm dev` (op run --) に切替。

その他の定数 (`FEATURE_*` / `TZ` / `NODE_ENV` / `CASBIN_*` / `VERCEL_*` / `AUDIT_*` / `SLACK_CHANNEL_*`) は v1 から継続して平文。

### Rotation SOP (Tier 1 のみ対象)

1. **トリガ条件**: secret 漏洩疑い / メンバー離脱 / 90 日経過 / Service Account Token 失効。
2. **Owner 操作**:
   - 1Password Vault で該当 entry の field を更新 (旧値は履歴で 30 日保持)。
   - Slack webhook / Resend / GitHub PAT は発行元コンソールで再発行 → Vault に反映。
3. **CI 操作**: `OP_SERVICE_ACCOUNT_TOKEN` を更新する場合は GitHub Actions Secrets で再登録。次回 workflow run から自動反映 (再 deploy 不要)。
4. **検証**: `pnpm --filter @clawbridge/web dev` を起動し、3 channel 全てに smoke message を送って疎通確認 (`#drill` への投稿は事前 Slack で予告)。
5. **記録**: rotation 実施日時 / 対象 entry / 担当を `audit_log` に手動 INSERT (event_kind=`secret_rotation`)。

副作用ゼロ確認 (W0-Week2 末完成予定):

```bash
pnpm verify:zero-side-effect    # = bash scripts/verify-zero-side-effect.sh
```

## W0-Week1 vs W0-Week2 のスコープ表

| 項目 | W0-Week1 (5/2-5/8) | W0-Week2 (5/9-5/15) |
|---|---|---|
| harness 9 controls | G-01/G-02/G-04/G-05/G-06/G-08/G-V2-03/G-V2-08/G-V2-11 完了 | G-07/G-09/G-10/G-V2-04 着手 |
| HITL ゲート種別 | 5 種 (public_release / paid_api_call / force_push / prod_deploy / external_api) | **6 種に拡張: tos_gray_review 追加** (DEC-019-018) |
| openclaw-runtime | package.json のみ + UPSTREAM-NOTES.md | **Mock + skeleton + interface contract + 6 cases test** |
| claude-bridge | spawn / stream-json-parser / auth-detector 完成 | live integration test (CB-D-W0-06) |
| mock-claude | 5 シナリオ完成 (DEC-019-020) | BAN drill #1 で活用 |
| 監査基盤 (G-09) | 未着手 | Supabase append-only 着手 |
| 通知層 (notify) | 未着手 | Slack 1 channel 雛形 |
| docs | docs/README.md のみ | architecture-w0.md / security-w0.md (Mermaid 3 枚以上) |
| BAN drill #1 | scenario 完成 (DEC-019-019) | **5/13 立会・実施** |
| verify-zero-side-effect | 設計のみ | スクリプト完成 |

## 各 workspace 進捗

| workspace | W0-Week1 | W0-Week2 |
|---|---|---|
| harness | 9 modules / 55 cases (cost / kill / hitl 5種 / circuit / usage / time / paths / fs-store / index) | hitl 6種 (+6 cases) → 11 cases、合計 61 cases |
| claude-bridge | 3 modules / 29 cases (spawn / stream-json-parser / auth-detector) | live integration test (W0-Week2 中盤) |
| openclaw-runtime | package.json のみ | **Mock + RealStub + types + upstream-notes / 6 cases** |
| orchestrator | package.json のみ | (W1 着手) |
| sandbox | package.json のみ | (W1 着手) |
| audit | package.json のみ | G-09 雛形 |
| notify | package.json のみ | Slack 雛形 |
| tests/integration/mock-claude | 5 シナリオ / 5 cases | BAN drill #1 で活用 |

## W0 完了基準 (Phase 1 W1 着手前提)

DoD (CB-D-W0 完了判定):

- [x] 9 ディレクトリ骨格 + 各 README 配置 (CB-D-W0-01)
- [x] Open Claw OSS 上流仕様取得 (CB-D-W0-02 / UPSTREAM-NOTES.md)
- [ ] ADR 4 件起票 (CB-D-W0-03) — W0-Week2
- [ ] Open Claw OSS 実機 PoC (CB-D-W0-04) — W0-Week2 後半
- [x] mock-claude 5 シナリオ (DEC-019-020)
- [ ] `claude -p` 本人 OAuth 動作確認 (CB-D-W0-06) — W0-Week2 中盤
- [ ] Vercel Sandbox env whitelist PoC (CB-D-W0-08) — W0-Week2 後半
- [x] cost_check / emergency_stop プロトタイプ (CB-D-W0-09, 10)
- [x] HITL 第 6 種 `tos_gray_review` (DEC-019-018) — W0-Week2 着手要件、本コミットで完了
- [ ] BAN drill #1 (DEC-019-019) — 2026-05-13 実施
- [ ] 必須コントロール 23 項目 → W1〜W4 タスクマッピング (CB-D-W0-16) — W0-Week2 末
- [ ] verify-zero-side-effect.sh 完成 — W0-Week2 末

## TS 設定統一 (ARCH-01 / DEC-019-041)

W0-Week2 buffer 期で `tsconfig.base.json` を本 monorepo の strict 統一基準に確定。各 workspace の `tsconfig.json` は extends 参照する形に統一済み。

- **新規 workspace** (web/ など): `tsconfig.base.json` を直接 extends する (Phase B / strict 完全適用)
- **既存 workspace** (harness/ / claude-bridge/ / openclaw-runtime/): `tsconfig.legacy-relax.json` 経由で extends (Phase A / warn 段階)
- Phase B 全面移行は Phase 1 W4 末 (~2026-06-20) を目処に Dev 部門 A 担当が主導
- **詳細**: `docs/tsconfig-rollout.md`

## 重要な制約 (**必読**)

1. **既存 PRJ-001〜018 への副作用ゼロ**を W0 期間中も継続検証 (`scripts/verify-zero-side-effect.sh`)
2. **`organization/` は read-only**、Open Claw からの改修許可は Phase 2 以降で別決裁
3. **Anthropic API は絶対に直接叩かない**。Claude 関連は **すべて Claude Code CLI (subprocess) 経由** (claude-bridge/)
4. **Open Claw / claude-bridge / orchestrator は OAuth トークンを env / config から直接読まない**。CLI 自身に委譲
5. **メイン業務用 Anthropic アカウントとは分離**した別アカウントで PoC (review v2 §5、CB-D-W0-05)
6. **secret はコード / テスト / log / commit / PR にも含めない** (dummy 値のみ、`.test` TLD ルール)

## 関連ドキュメント

- 案件概要: `../brief.md`
- 意思決定: `../decisions.md`
- タスク: `../tasks.md`
- リスク: `../risks.md`
- 進捗: `../progress.md`
- レポート: `../reports/`
- W0 実装計画書: `../reports/dev-phase1-w0-implementation-plan.md`
- WBS 正本: `../reports/pm-architecture-v2-and-phase1-plan.md`
- 必須コントロール正本: `../reports/review-v2-subscription-risk-and-fallback.md`
- W0 アーキドラフト: `docs/architecture-w0.md`
- W0 セキュドラフト: `docs/security-w0.md`

---

**v1**: 2026-05-02 起案 (Phase 0 構造)
**v2**: 2026-05-02 W0 着手反映
**v3**: 2026-05-03 W0-Week2 ブートストラップ (HITL 6種 / openclaw-runtime skeleton / docs 整備)
**v4**: 2026-05-03 DEC-019-048 / DEC-019-049 反映 (1Password CLI 採択 + Slack 新規 workspace + 3 channel 独立運用)
**v5**: 2026-05-04 DEC-019-053 反映 (2-tier 設計 / 真の secret 9 fields のみ Vault 登録 + 平文 12 fields 分離 + dev:noop 公式 unblock path 化)
**v6**: 2026-05-04 v2.1 訂正反映 (Pre-flight check 追加 / Slack smoke は v2.1 §2 に分離 / `scripts/preflight-env.ts` + `scripts/slack-smoke.ts` 新規)

## 採択決裁ログ (本 README が直接参照)

- **DEC-019-048** (2026-05-03, Owner 直接決裁): secret 管理ツールに **1Password CLI** を採択。Doppler 関連手順は本 README から削除。`.env.local` は `op://` references で記述、CI は `op run --` で env 注入。
- **DEC-019-049** (2026-05-03, Owner 直接決裁): Slack workspace `prj019-claude-code-company` を新規作成。既存業務 Slack と完全分離、`#hitl` / `#monitor` / `#drill` の 3 channel 独立運用。
- **DEC-019-053** (2026-05-04, Owner 即決): `.env.example` を **2-tier 構造** に再設計。真の secret = **4 item × 9 fields** のみ Vault 登録 (Supabase service_role/db_url、Slack 3 webhook、Resend api_key + 通知 email 2 件、GitHub PAT)。残り **12 fields** (NEXT_PUBLIC_* / paths / version / 定数) は平文 dummy で記載。`dev:noop` を **公式 unblock path** として正規化 (Owner 5/4 検証済 = op 未 signin で localhost:3000 表示)。Owner Vault 登録は 30 分目標。
