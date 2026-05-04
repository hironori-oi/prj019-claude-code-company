# PRJ-019 Dev 部門報告 — 1Password CLI / Slack 3-channel 統合反映 v2.1 (Case 2 訂正)

**作成**: 2026-05-04
**起案部門**: Dev
**対象決裁**: DEC-019-048 / DEC-019-049 / DEC-019-053
**Phase**: Phase 1 W0-Week2 着手前 (5/9 朝期限)
**前版**: `dev-1password-slack-integration-v2.md` (5/4 起案、§3.2 Case 2 が動作不能)
**ステータス**: Case 2 を 3 段階 (pre-flight / dry-run / live) に再構成、tsx loader + cwd 整合 + RC-3 待ち分離で動作可能化

---

## §1. v2 → v2.1 差分要約 (Issue 1/2/3 解消)

5/4 08:42 Owner Case 2 実行で下記 fail を観測:

```
PS C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\app> op run --env-file=web/.env.local -- node --experimental-vm-modules -e "..."
[ERROR] open web/.env.local: The system cannot find the file specified.
```

**3 層の不整合** が同時に絡んでいたため v2.1 で個別に解消:

| Issue | 症状 | v2 までの記述 | v2.1 修正 |
|---|---|---|---|
| **Issue 1: env-file path 不整合** | Owner cwd = `app/`、`--env-file=web/.env.local` が `app/web/.env.local` を参照 → 存在せず即 fail | v1/v2 §3.2 で `--env-file=.env.local` と `web/.env.local` の混在記述 (v2 §3.2 は `.env.local` 表記、v1 §3.2 は `--env-file=.env.local` だが本コマンドの直前文書で `web/.env.local` と読み違える経路を残置) | 正規 path = `app/.env.local` (5/4 07:48 Owner 作成済 / 6636 byte)。コマンドは **cwd=`app/` + `--env-file=.env.local`** に統一 |
| **Issue 2: RC-3 未完了で webhook 実値なし** | Vault `prj019/slack/webhook_*` 未投入 → `op run` で reference 解決失敗 (もしくは literal `op://` のまま env に渡る) | v2 §3.2 は「RC-3 完了前提」を暗黙としていたが Owner が pre-flight 手段なしに live smoke を踏もうとして詰まる構造 | **3 段階分離**: §2.1 pre-flight (RC-3 未完了でも安全) → §2.2 dry-run (RC-3 完了直後の payload 検証) → §2.3 live (実投稿) |
| **Issue 3: TS loader 不在** | `node --experimental-vm-modules -e "import('./lib/notify/slack.ts')"` は VM SourceTextModule 用 flag であり TS loader ではない → `.ts` 直接 import 不可 | v1/v2 §3.2 のコマンドは構造的に動作不能 (loader が無い) | `pnpm tsx` 経由 (tsx は root `package.json` devDependencies に既登録 `^4.19.0`)。実態は `app/scripts/slack-smoke.ts` を `tsx` で起動 |

**新規追加ファイル**:

- `projects/PRJ-019/app/scripts/preflight-env.ts` — Tier 1 / 9 fields の op:// 解決状態検証 (post なし)
- `projects/PRJ-019/app/scripts/slack-smoke.ts` — `slack.ts` を ESM import して 3 channel に smoke 投稿 (`--dry-run` 対応)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v2-1.md` — 本報告書

**編集ファイル**:

- `projects/PRJ-019/app/package.json` — `preflight` / `slack-smoke` / `slack-smoke:dry` script 追記 (+5 行 / 0 行 -)
- `projects/PRJ-019/app/README.md` — §Run 直前に Pre-flight check を追加 (+10 行 / 0 行 -)、§Run 末尾に v2.1 参照注記 (+2 行)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v2.md` — 末尾に Errata 1 行追記 (+3 行)

---

## §2. Case 2 訂正版 (3 段階)

### §2.1 Pre-flight resolution check (RC-2/3/6 未完了でも実行可)

**目的**: `.env.local` が `op run --env-file=.env.local --` で正しく env に展開され、Tier 1 / 9 fields のうちどれが解決済み / 未解決 / 未定義かを **Slack post を一切行わずに** 確認する。Vault 未投入 (RC-3 未完了) の段階でも安全。

**実行コマンド** (Windows PowerShell + cwd = `app/`):

```
op signin
op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts
```

**期待出力 (RC-3 / RC-6 / RC-2 未完了想定)**:

```
Tier 1 resolution check (cwd=...\projects\PRJ-019\app)
  SUPABASE_SERVICE_ROLE_KEY      [resolved]    length=51
  SUPABASE_DB_URL                [resolved]    length=128
  SLACK_WEBHOOK_HITL             [unresolved]  op://prj019/slack/webhook_hitl
  SLACK_WEBHOOK_MONITOR          [unresolved]  op://prj019/slack/webhook_monitor
  SLACK_WEBHOOK_DRILL            [unresolved]  op://prj019/slack/webhook_drill
  RESEND_API_KEY                 [missing]
  OWNER_NOTIFY_EMAIL             [unresolved]  op://prj019/notify/owner_email
  DEV_NOTIFY_EMAIL               [unresolved]  op://prj019/notify/dev_email
  GITHUB_PAT_READ_ONLY           [unresolved]  op://prj019/github/pat_read_only

Summary: 2 resolved, 6 unresolved, 1 missing.
Next action: Vault に下記を投入してください: op://prj019/slack/webhook_hitl, op://prj019/slack/webhook_monitor, op://prj019/slack/webhook_drill, RESEND_API_KEY (env 未定義), op://prj019/notify/owner_email, op://prj019/notify/dev_email, op://prj019/github/pat_read_only
Pending RCs: RC-2, RC-3, RC-6, RC-Vault-Resend
```

**判定基準**:

- `[resolved]` のみが期待状態。`length` のみ表示し本体は出さない (secret 保護)。
- `[unresolved]` = op:// のまま env に届いている = `op run` を経由していない、もしくは Vault に該当 entry が存在しない。op:// path 自体は secret ではないので表示してよい。
- `[missing]` = `.env.local` に該当 key が記載されていない。

**exit code**: 全件 resolved なら 0、unresolved/missing が 1 件でもあれば 1。

### §2.2 Dry-run smoke (RC-3 完了直後、payload 構築のみ)

**目的**: RC-3 (Vault に 3 webhook 投入) 完了後、実際に Slack に投稿せずに `slack.ts` の payload 組み立て + env 解決を検証する。

**実行コマンド**:

```
op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts --dry-run
```

**期待出力 (RC-3 完了後)**:

```
Slack dry-run smoke (cwd=...\projects\PRJ-019\app, channels=[hitl,monitor,drill])
  [hitl] payload.blocks=header+context+actions text="[hitl] PRJ-019 smoke test" env=SLACK_WEBHOOK_HITL:resolved
  [monitor] payload.blocks=header+context+actions text="[monitor] PRJ-019 smoke test" env=SLACK_WEBHOOK_MONITOR:resolved
  [drill] payload.blocks=header+context+actions text="[drill] PRJ-019 smoke test" env=SLACK_WEBHOOK_DRILL:resolved
Dry-run complete. No HTTP request was made.
```

**判定基準**: 3 channel すべて `env=...:resolved` であれば §2.3 live smoke に進める。`unresolved` が残っていれば Vault 投入を継続。

### §2.3 Live smoke (Slack に実投稿)

**目的**: 3 channel 全てに smoke message を実投稿し、`postSlack` の retry / Zod validation / payload 構造を一気通貫で確認する。

**事前告知必須**: `#drill` への投稿は事前に Slack で予告 (DEC-019-049 運用ルール、誤発火を drill 当事者に誤認させない)。

**実行コマンド**:

```
op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts
```

**期待出力**:

```
Slack live smoke (cwd=...\projects\PRJ-019\app, channels=[hitl,monitor,drill])
  [hitl] ok=true attempts=1 status=200
  [monitor] ok=true attempts=1 status=200
  [drill] ok=true attempts=1 status=200
All channels posted successfully.
```

**個別 channel のみ実行**:

```
op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts --channels=hitl,monitor
```

**失敗時の挙動**: `postSlack` は throw せず `failure: { reason, detail }` を返す。本 script は per-row 形式で失敗内容を表示し、1 件でも失敗で exit 1 を返す (CI 検知用)。

---

## §3. Owner 環境前提

| 項目 | 値 | 備考 |
|---|---|---|
| OS | Windows 11 Home | `gitStatus` より確認 |
| Shell | Windows PowerShell 5.1 系 | `$PROFILE` ベース、`op` `pnpm` `node` がすべて PATH 通っていること |
| Node | 22.14+ | `app/package.json` engines、`tsx` 動作要件 |
| pnpm | 9.12+ | `app/package.json` packageManager |
| 1Password CLI | 2.x | `op --version`、`op signin` 済み |
| tsx | 4.19+ | root `app/package.json` devDependencies に既登録、`pnpm install` で解決済み |
| cwd | `projects/PRJ-019/app/` | すべての §2 コマンドはこの cwd で実行 |

**path 注意**: PowerShell 上でも `--env-file=.env.local` の `/` `\` 区切りは混在で動く。`scripts/preflight-env.ts` 等は cwd 相対の forward slash で記述しており、Windows / macOS / Linux すべてで同じコマンドが通る。

---

## §4. RC-3 完了状況の確認手順

§2.1 pre-flight が `Summary: 9 resolved, 0 unresolved, 0 missing.` を返したら RC-2/3/6 すべて完了の signal。**`SLACK_WEBHOOK_*` 3 件のみ resolved** に変わっていれば RC-3 単独完了 (他 RC は別途)。

直接 op で確認したい場合 (Vault entry の存在チェック):

```
op read op://prj019/slack/webhook_hitl
op read op://prj019/slack/webhook_monitor
op read op://prj019/slack/webhook_drill
```

3 件すべて `https://hooks.slack.com/services/...` を echo すれば RC-3 完了。echo 失敗 (item not found) なら未完了。

---

## §5. v1/v2 で誤って提示していたコマンドの撤回宣言

下記コマンドは **v2.1 をもって撤回**。今後の手順書 / Owner 通知では使用しない:

```
# 撤回 (v1 §3.2 / v2 §3.2)
op run --env-file=web/.env.local -- node --experimental-vm-modules -e "
  import('./lib/notify/slack.ts').then(async (m) => { ... });
"
```

撤回理由:

1. `--env-file=web/.env.local` は cwd=`app/` から見ると `app/web/.env.local` を指すが、正規配置は `app/.env.local`。
2. `node --experimental-vm-modules -e` は TS loader を起動しないため `.ts` を直接 import できない (構造的に動作不能)。
3. RC-3 未完了でも実行できる pre-flight 経路が存在しなかったため、Vault 投入前に Owner が live smoke を踏むしか選択肢が無かった。

代替は §2 の 3 段階を厳守。

---

## §6. 互換性確認 (静的検証)

- `app/scripts/preflight-env.ts` / `app/scripts/slack-smoke.ts` は `app/tsconfig.base.json` の strict + verbatimModuleSyntax + exactOptionalPropertyTypes 互換で記述。
- `slack-smoke.ts` は `import { ... } from '../lib/notify/slack.ts'` で `.ts` 拡張子を明記 (NodeNext + tsx loader 互換、verbatimModuleSyntax 違反なし)。
- 既存 `app/lib/notify/slack.ts` 本体には変更なし (= RC-4 / RC-5 vitest 既存緑のまま、副作用ゼロ)。
- 既存 v2 報告書本体は変更なし (末尾 Errata 1 行追記のみ)。
- v2 §3.1 (Case 1: dev:noop) と §3.3 (Case 3: GitHub Actions) は v2.1 でも継続有効。撤回対象は **§3.2 Case 2 のコマンド本体のみ**。

---

## §7. 残課題引継ぎ (v2 §7 から差分のみ)

| # | 課題 | 対応期限 | 担当 |
|---|---|---|---|
| RC-3 (継続) | Slack workspace 作成 + 3 webhook 発行 + Vault 投入 | W0-Week2 末 | Owner |
| RC-Vault-Resend (新規分離) | Resend API key 発行 + `op://prj019/resend/api_key` 投入 (env_missing 解消) | Phase 1 W1 | Owner |
| RC-4 (継続) | `slack.ts` Vitest ユニットテスト追加 | Phase 1 W1 | Dev |
| **RC-8 (新規)** | `slack-smoke.ts` / `preflight-env.ts` への Vitest ユニットテスト (パース系 helper 関数の単体テスト) | Phase 1 W2 | Dev |

---

**v2.1**: 2026-05-04 起案 (v2 §3.2 Case 2 撤回 + 3 段階再設計 + tsx loader 採用 + pre-flight 新設)

---

## Errata (2026-05-04 09:00)

**op run all-or-nothing 仕様への対応は v2.2 で追加** — Owner 5/4 08:54 実行で `op run --env-file=.env.local --` が Vault 内 item 未作成 (`could not find item notify in vault ...`) で abort し、preflight が起動できない構造的問題が判明。v2.2 (`dev-1password-slack-integration-v2-2.md`) で dotenv fallback + `preflight:vault` script 新設 + 3 mode 分離 (env / vault / resolved) を追加し、Vault 構築途中でも preflight を実行できるように修正済み。本 v2.1 §2.1 の `op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts` コマンドは **Vault 完成後専用 (mode resolved)** として継続有効、Vault 構築途中は v2.2 §2 の mode env / mode vault を使用する。
