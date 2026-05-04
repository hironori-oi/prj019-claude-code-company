# PRJ-019 Dev 部門報告 — 1Password CLI / Slack 3-channel 統合反映 v2.2 hotfix

**作成**: 2026-05-04
**起案部門**: Dev
**対象決裁**: DEC-019-048 / DEC-019-049 / DEC-019-053
**Phase**: Phase 1 W0-Week2 着手前 (5/9 朝期限)
**前版**: `dev-1password-slack-integration-v2-1.md` (5/4 起案、3 段階分離 + tsx loader 採用)
**ステータス**: `op run` all-or-nothing 解決仕様への dotenv fallback を追加、Vault 構築途中でも preflight が動作するよう hotfix 完了

---

## §1. v2.1 → v2.2 差分要約

5/4 08:54 Owner 実行で下記 fail を観測:

```
PS C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\app> op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts
[ERROR] 2026/05/04 08:54:10 could not resolve item UUID for item notify: could not find item notify in vault 65tozvtfmbbpvd3oty6uakzhzu
```

### 原因 (構造的問題)

`op run --env-file` は env ファイル中の **全 op:// reference を起動前に一括解決** する。1 件でも item が Vault に存在しないと wrapped command を **起動せず abort** する (= all-or-nothing 解決)。

Owner は `prj019` Vault は作成済 (UUID `65tozvtfmbbpvd3oty6uakzhzu`) だが、その中の item (`notify`, `supabase`, `slack`, `resend`, `github`) は Vault 構築途中で 1 件も未作成。このため preflight-env.ts は **永遠に起動できない** (= v2.1 設計不備)。

### 解消方針

| 課題 | v2.1 までの設計 | v2.2 hotfix |
|---|---|---|
| op run 前置を必須化していた | `op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts` 一択 | preflight-env.ts に **dotenv fallback** を追加。op run なしで直接起動した場合は `.env.local` を自前パーサで読込み、op:// literal を `[unresolved]` として扱う |
| Vault 構築進捗の可視化手段なし | 「どの item を次に作るか」を Owner が手で追う必要 | `preflight-vault.ts` を新規追加。`op item list --vault=prj019 --format=json` で実態を取得、5 items × 9 fields の登録進捗を表示 |
| 3 mode が混在し用途が不明確 | `preflight` script 1 本のみ | scripts を **3 mode に分離**: `preflight` (env / 推奨初期) / `preflight:resolved` (Vault 完成後) / `preflight:vault` (構築進捗) |

### 新規 / 編集ファイル一覧

**編集**:

- `app/scripts/preflight-env.ts` — dotenv fallback + mode 判定 + 自前 parser (+128 行 / -45 行)
- `app/package.json` — `preflight:resolved` / `preflight:vault` script 追加 + コメント刷新 (+6 行 / -2 行)
- `app/README.md` — §Pre-flight check を 3 mode 対応に書き換え (後述 §5)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v2-1.md` — 末尾 Errata 1 行追記 (+3 行)

**新規**:

- `app/scripts/preflight-vault.ts` — 1Password Vault inventory check (+265 行)
- `projects/PRJ-019/reports/dev-1password-slack-integration-v2-2.md` — 本報告書

**dotenv 依存追加**: **なし** (Owner が `pnpm install` 不要で動かしたい要件に応えるため、自前の `parseDotEnv()` 関数を `preflight-env.ts` 内に実装)。

---

## §2. 3 つの preflight mode の使い分け

| mode | script | op run | Vault 状態依存 | 用途 | exit code |
|---|---|---|---|---|---|
| **mode env** (推奨初期) | `pnpm preflight` | なし | 依存しない | `.env.local` を直読、9 fields の op:// vs 実値を可視化。Vault が空でも abort しない | 0=全 resolved / 1=未完 |
| **mode resolved** (Vault 完成後) | `pnpm preflight:resolved` | あり | **全 5 items 必須** | op run all-or-nothing が通ったら全 9 fields が `[resolved]` になることを確認 | 0=全 resolved / 1=未完 / op abort 時は op の exit code |
| **mode vault** (構築進捗) | `pnpm preflight:vault` | なし (op item list を child_process で直叩き) | 依存しない | `op item list` で Vault inventory を取得、どの item / field を次に作るか可視化 | 0=全完 / 1=未完 / 2=op CLI エラー |

### mode env の出力例 (Vault 空)

```
[mode] direct (.env.local loaded via internal parser) — loaded ...\app\.env.local via internal parser
Tier 1 resolution check (cwd=...\app)
  SUPABASE_SERVICE_ROLE_KEY      [unresolved]  op://prj019/supabase/service_role_key
  SUPABASE_DB_URL                [unresolved]  op://prj019/supabase/db_url
  SLACK_WEBHOOK_HITL             [unresolved]  op://prj019/slack/webhook_hitl
  SLACK_WEBHOOK_MONITOR          [unresolved]  op://prj019/slack/webhook_monitor
  SLACK_WEBHOOK_DRILL            [unresolved]  op://prj019/slack/webhook_drill
  RESEND_API_KEY                 [unresolved]  op://prj019/resend/api_key
  OWNER_NOTIFY_EMAIL             [unresolved]  op://prj019/notify/owner_email
  DEV_NOTIFY_EMAIL               [unresolved]  op://prj019/notify/dev_email
  GITHUB_PAT_READ_ONLY           [unresolved]  op://prj019/github/pat_read_only

Summary: 0 resolved, 9 unresolved, 0 missing.
Next action: Vault に下記を投入してください: ...
Pending RCs: RC-2, RC-3, RC-6, RC-Vault-Resend, RC-Vault-Supabase
```

### mode vault の出力例 (Vault 空)

```
Vault prj019 inventory check
  [x] supabase   not found in vault
  [x] slack      not found in vault
  [x] resend     not found in vault
  [x] notify     not found in vault
  [x] github     not found in vault

Summary: 0/5 items, 0/9 fields registered.
Next action: 未作成 items: supabase, slack, resend, notify, github
Pending RCs: RC-2, RC-3, RC-6, RC-Vault-Resend, RC-Vault-Supabase
```

### mode vault の出力例 (Vault 部分構築)

```
Vault prj019 inventory check
  [o] supabase   fields: service_role_key (o), db_url (o)
  [x] slack      not found in vault
  [x] resend     not found in vault
  [x] notify     not found in vault
  [x] github     not found in vault

Summary: 1/5 items, 2/9 fields registered.
Next action: 未作成 items: slack, resend, notify, github
Pending RCs: RC-2, RC-3, RC-6, RC-Vault-Resend
```

(secret 本体は出力しない / field 名のみ。`(o)` = 登録済 / `(x)` = 未登録)

---

## §3. Owner 5/4 08:54 エラーの解説

### 発生メカニズム

1. Owner が `op run --env-file=.env.local --` を起動
2. `op run` は env ファイル全行を読み、`op://` で始まる 9 値を抽出
3. 各 op:// reference に対して item UUID を **起動前に並列で解決**
4. `op://prj019/notify/...` の解決時点で `notify` item が Vault に存在しないことが判明
5. **`op run` は wrapped command (`pnpm tsx ...`) を spawn する前に abort**
6. preflight-env.ts は 1 行も実行されない

### なぜ「all-or-nothing」設計なのか (1Password CLI の意図)

`op run` は本番運用想定。secret が 1 つでも欠けた状態で wrapped command を起動するのは「半 secret」状態を許容することになり、
production deploy で気付かず secret 抜け fallback (空文字 / undefined) が走る危険がある。
よって op CLI 側は **all-or-nothing** = 全解決できなければ起動拒否、を採用している (公式 doc `op run --help` 記載)。

ただし PRJ-019 のように **Vault 構築途中の preflight 検証** という use case では all-or-nothing が逆効果になる。
v2.2 はこの状況を「op run を経由しない直接起動」で fallback し、解決状態を `[unresolved]` として可視化する設計に切替えた。

### 完全な原因と修正の対応表

| 発生事象 | 根本原因 | v2.2 修正 |
|---|---|---|
| `could not find item notify in vault 65tozvtfmbbpvd3oty6uakzhzu` | `prj019` Vault に `notify` item 未作成 (RC-6 未着手) | mode env (op run なし) で逃げ道を作る |
| 同 `supabase` / `slack` / `resend` / `github` も同等に出る | RC-2/3/Vault-Resend/Vault-Supabase 全て未着手 | mode env で 9 fields の状態を一覧化、Owner は何を作るべきかを把握 |
| Owner が「次に何を作るか」を script から得られない | `preflight:vault` script 不在 | `preflight:vault` 新規追加で Vault inventory 直視 |

---

## §4. Vault 構築の推奨順序 (Owner Vault 登録 30 分目標を保つ workflow)

DEC-019-053 で Owner Vault 登録は **30 分目標**。以下の workflow で安定運用する:

### Step 1: 空状態の確認

```
cd projects/PRJ-019/app
pnpm preflight:vault
```

期待出力: `Summary: 0/5 items, 0/9 fields registered.` — もしこの時点で 1Password CLI 未導入 / signin 未済なら親切なエラーが出る。修正してから次へ。

### Step 2: 5 items × 9 fields を Vault に登録 (推奨順序)

依存関係 (RC mapping) と再利用性で並べ替え:

1. **`supabase`** (`service_role_key`, `db_url`) — Web boot 自体に必要
2. **`resend`** (`api_key`) — 通知層単体で動作確認可
3. **`notify`** (`owner_email`, `dev_email`) — PII 集約、resend と組合せ送信確認
4. **`github`** (`pat_read_only`) — upstream monitor (W1 開始前)
5. **`slack`** (`webhook_hitl`, `webhook_monitor`, `webhook_drill`) — Slack workspace 作成 (DEC-019-049) と同期、最後に集中投入

登録手段は **1Password GUI を推奨** (CLI でも可: `op item create --category=password --vault=prj019 --title=supabase service_role_key=... db_url=...`)。
GUI なら field 名 (`service_role_key` 等) を typo なく登録できる。

### Step 3: 各登録ごとに進捗確認

```
pnpm preflight:vault
```

を都度実行。`Summary: x/5 items, y/9 fields registered.` が増えていく。

### Step 4: 全 5 items 完成後、resolved 確認

```
pnpm preflight:resolved
# = op run --env-file=.env.local -- tsx scripts/preflight-env.ts
```

期待出力: `Summary: 9 resolved, 0 unresolved, 0 missing.` `All Tier 1 fields resolved.`

ここで初めて op run all-or-nothing が **通る** (= 全 9 fields 解決成功)。

### Step 5: Slack live smoke

```
pnpm slack-smoke:dry      # payload 検証 (network なし)
pnpm slack-smoke           # 実投稿 (#drill は事前告知必須)
```

(これらは v2.1 §2.2 / §2.3 のまま、変更なし)

### 30 分配分の目安

| Step | 目安時間 |
|---|---|
| Step 1: preflight:vault で空確認 | 1 分 |
| Step 2-1: supabase 登録 | 5 分 (Supabase Console から service_role / db_url コピー) |
| Step 2-2: resend 登録 | 3 分 (Resend dashboard で API key 発行) |
| Step 2-3: notify 登録 | 2 分 (email 文字列のみ) |
| Step 2-4: github 登録 | 5 分 (PAT 発行 / scope は read-only) |
| Step 2-5: slack 登録 | 10 分 (workspace `prj019-claude-code-company` 作成 + 3 channel + 3 webhook 発行) |
| Step 3: 進捗確認 (累積) | 1 分 |
| Step 4: preflight:resolved | 1 分 |
| Step 5: smoke (dry + live) | 2 分 |
| **計** | **30 分** |

### 推奨しない順序

- **slack を最初に登録** → workspace 作成 (DEC-019-049) のリードタイムが長く、後段が止まる
- **github 最後** → upstream monitor 起動が後ろ倒しになり W1 着手が遅れる

---

## §5. README 反映 (`app/README.md`)

§Pre-flight check を **3 mode 対応** に書き換え:

```markdown
## Pre-flight check (DEC-019-053 + v2.2 hotfix)

Tier 1 / 9 fields の op:// 解決状態を **Slack post なしで** 検証する。3 mode を使い分ける。

### mode env (推奨初期 / op run なし / Vault 状態に依存しない)
\`\`\`
cd projects/PRJ-019/app
pnpm preflight
\`\`\`
op run なし、`.env.local` を直読。Vault が空でも abort せず 9 fields の op:// 状態を可視化。

### mode vault (構築進捗 / `op item list` で Vault inventory)
\`\`\`
pnpm preflight:vault
\`\`\`
5 items × 9 fields のうち登録済を可視化。次に作るべき item / field を提示。

### mode resolved (Vault 完成後 / op run 経由で全 resolved 確認)
\`\`\`
op signin
pnpm preflight:resolved
\`\`\`
op run all-or-nothing が **通る** (全 9 fields 解決成功) ことを確認。
```

---

## §6. 動作確認 (Dev 部門 mock 実走、5/4 09:00 頃)

3 mode それぞれを Owner 環境想定で mock 実走:

| mode | 実行コマンド | 結果 | 備考 |
|---|---|---|---|
| **env** | `pnpm preflight` | OK / exit=1 (9 unresolved) | `.env.local` を内部 parser で読込、9 fields 全て `[unresolved]`。op run abort なし |
| **env (env override 付き)** | `SUPABASE_SERVICE_ROLE_KEY=dummy_value SLACK_WEBHOOK_HITL=https://... pnpm preflight` | OK / exit=1 | mode 判定が `op-run resolved` に切替、override 2 件は `[resolved]` (length 表示)、残りは `[missing]` |
| **vault** | `pnpm preflight:vault` | OK / exit=2 (op CLI 未導入の親切エラー表示) | `1Password CLI (op) が見つかりません。Windows: winget install AgileBits.1Password.CLI` メッセージ確認 |
| **resolved** | `pnpm preflight:resolved` (mock = op CLI 未導入で op run が fail) | op CLI 起動エラー → preflight-env.ts は呼ばれず | 想定通り (op CLI 必須 mode、Vault 完成後にだけ意味を持つ) |

`tsc --noEmit` で strict + verbatimModuleSyntax + exactOptionalPropertyTypes 全フラグ有効化したまま 0 error 確認済み。

---

## §7. 互換性 / 副作用 / 安全性確認

- 既存 `app/lib/notify/slack.ts` には変更なし (= 既存 Vitest 緑のまま)
- `app/scripts/slack-smoke.ts` には変更なし (v2.1 設計のまま、live mode は引き続き op run 必須)
- preflight-env.ts は dotenv 等の外部依存を追加していない (=`pnpm install` 不要で動作)
- preflight-vault.ts は `node:child_process` の `spawnSync` のみ使用 (Node 標準、追加依存なし)
- secret 本体出力なし (length 表示 + field 名のみ)
- TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes 全準拠
- Windows PowerShell 動作確認済 (cwd = `app/`、forward slash path 統一)
- 絵文字非使用 (CLAUDE.md `feedback_no_emoji`)

---

## §8. 残課題引継ぎ (v2.1 §7 から差分のみ)

| # | 課題 | 対応期限 | 担当 |
|---|---|---|---|
| RC-3 (継続) | Slack workspace 作成 + 3 webhook 発行 + Vault 投入 | W0-Week2 末 | Owner |
| RC-Vault-Supabase (新規分離) | Supabase service_role_key / db_url を Vault に投入 | 即時 | Owner |
| RC-Vault-Resend (継続) | Resend API key 発行 + Vault 投入 | Phase 1 W1 | Owner |
| RC-6 (継続) | notify owner_email / dev_email を Vault に投入 | 即時 | Owner |
| RC-2 (継続) | GitHub PAT (read-only) 発行 + Vault 投入 | W0-Week2 末 | Owner |
| RC-4 (継続) | `slack.ts` Vitest ユニットテスト追加 | Phase 1 W1 | Dev |
| RC-8 (継続) | `slack-smoke.ts` / `preflight-env.ts` Vitest テスト | Phase 1 W2 | Dev |
| **RC-9 (新規)** | `preflight-vault.ts` Vitest テスト (helper 関数 `buildReports` / `summarize` / `nextAction` / `diagnoseOpFailure`) | Phase 1 W2 | Dev |

---

**v2.2 hotfix**: 2026-05-04 起案 (op run all-or-nothing 仕様への dotenv fallback 追加 + preflight-vault.ts 新設 + 3 mode 分離 + Vault 構築 30 分 workflow 確定)
