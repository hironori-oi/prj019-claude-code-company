最終更新: 2026-05-03 (v2、DEC-019-048/049 反映) / 起案: 秘書部門 / 対象: Owner

# PRJ-019 / PRJ-020 — Owner setup 手順書 v2 反映サマリ + diff 一覧

本書は 2026-05-03 に Owner 直接決裁された **DEC-019-048 / DEC-019-049** および保留中の **DEC-019-050** を、Owner setup 手順書 4 ファイルにどのように反映したかを Owner 確認用にまとめた diff サマリです。実値は記載せず、構造変更点のみ記述します。

参照: `decisions.md` DEC-019-048 / DEC-019-049 / DEC-019-050 / `00-owner-setup-master-checklist.md` v2 / `01-saas-accounts-and-secrets.md` v2 / `02-local-env-and-supabase-setup.md` v2 / `03-day0-and-demo-readiness.md` v2

---

## §1 反映決裁サマリ

| 決裁 ID | 種別 | 内容 | 反映状況 |
|---|---|---|---|
| **DEC-019-048** | Owner 直接決裁 | secret 管理ツールを **1Password CLI** に採択（Doppler 撤回） | 4 ファイル全反映済み |
| **DEC-019-049** | Owner 直接決裁 | Slack workspace を **新規作成必須**（`prj019-claude-code-company` 推奨、既存業務 Slack 流用禁止） | 4 ファイル全反映済み |
| **DEC-019-050** | 保留 | Anthropic API spend cap $300/月設定 → Owner が `/ceo` 経由でスクリーンショット共有 → 共有受領後に正式起票 | スクリーンショット共有手順のみ追記 |

---

## §2 DEC-019-048 反映内容（1Password CLI 採択）

### 2.1 撤回された Doppler 関連記述

| 旧記述 | 変更後 |
|---|---|
| 「Doppler または 1Password CLI を選択」 | 「**1Password CLI 採択**」（固定） |
| `curl -Ls https://cli.doppler.com/install.sh \| sh` | OS 別インストール手順（macOS / Windows / WSL2 別） |
| `doppler login` / `doppler setup` | `op signin` |
| `doppler secrets set ...` | `op item create` / `op item edit` |
| `doppler secrets download --no-file --format env` | `op run --env-file=.env.local --` （実行時に解決） |

### 2.2 新規導入された 1Password CLI 関連手順

#### 2.2.1 OS 別インストール（01 §2.7.1）

- macOS: `brew install --cask 1password-cli`
- Windows: `winget install AgileBits.1Password.CLI`
- WSL2: GPG key + apt repo 経由（4 行コマンド）

#### 2.2.2 Vault `prj019` 構成（01 §2.7.4）

5 item:
1. `supabase`（5 field: url / anon_key / service_role_key / db_url / project_ref）
2. `anthropic`（1 field: api_key、placeholder）
3. `slack`（3 field: webhook_hitl / webhook_monitor / webhook_drill）
4. `resend`（1 field: api_key）
5. `github`（1 field: pat_read_only）

#### 2.2.3 `.env.local` op:// reference 記法（01 §3）

```bash
SUPABASE_URL=op://prj019/supabase/url
SUPABASE_ANON_KEY=op://prj019/supabase/anon_key
SUPABASE_SERVICE_ROLE_KEY=op://prj019/supabase/service_role_key
ANTHROPIC_API_KEY=op://prj019/anthropic/api_key
SLACK_WEBHOOK_URL=op://prj019/slack/webhook_hitl
RESEND_API_KEY=op://prj019/resend/api_key
```

#### 2.2.4 `op run` 起動方針（02 §2.3 / 03 §2.1）

```bash
op run --env-file=.env.local -- pnpm --filter web dev
op run --env-file=.env.local -- pnpm test
op run --env-file=.env.local -- supabase db push
```

#### 2.2.5 Service Account vs personal account（01 §2.7.2）

- Phase 1 (5/26〜6/20) = personal account（`op signin`）
- Phase 2 W2 で Service Account 移行検討（`OP_SERVICE_ACCOUNT_TOKEN` を CI に注入）

#### 2.2.6 Secret rotation SOP（01 §2.7.7）

| Secret | 周期 | 手順 |
|---|---|---|
| Supabase service_role | 90 日 | `op item edit supabase service_role_key="<new>"`（.env.local 修正不要） |
| Resend API key | 180 日 | `op item edit resend api_key="<new>"` |
| Slack webhook | 365 日 | `op item edit slack webhook_hitl="<new>"` |
| GitHub PAT | 90 日 | `op item edit github pat_read_only="<new>"` |

採択理由: `.env.local` の reference は不変、`op item edit` のみで全消費者（dev / test / CI）に新 secret が反映される。

#### 2.2.7 GitHub Actions secrets 戦略（02 §9.5）

- 選択肢 A（Phase 1 default）: 個別 secret 5 件投入
- 選択肢 B（Phase 2 placeholder）: 1Password Service Account integration（`1password/load-secrets-action@v2` + `OP_SERVICE_ACCOUNT_TOKEN` 1 本）

---

## §3 DEC-019-049 反映内容（Slack 新規 workspace）

### 3.1 撤回された既存 workspace 流用記述

| 旧記述 | 変更後 |
|---|---|
| 「Slack 既保有」「Slack workspace 用意」 | 「**新規 workspace 作成必須**」 |
| `#clawbridge-hitl` / `#clawbridge-audit` / `#clawbridge-changelog` | `#prj019-hitl` / `#prj019-monitor` / `#prj019-drill` |

### 3.2 新規 workspace 作成手順（01 §2.5.1）

1. https://slack.com/create で新規 workspace 作成
2. Workspace 名: `prj019-claude-code-company` または `<owner-handle>-prj019` 推奨
3. 既存業務 Slack と完全分離（Owner 誤投稿防止設計）
4. Free tier 制約: メッセージ保持 90 日（Phase 1 期間内では問題なし）
5. Slack Connect は Phase 2 で外部連携時に検討

### 3.3 3 channel 構成（01 §2.5.2）

| Channel | 用途 | 1Password reference |
|---|---|---|
| `#prj019-hitl` | HITL 11 種承認依頼通知（第1〜11 種 Gate） | `op://prj019/slack/webhook_hitl` |
| `#prj019-monitor` | OpenClaw 上流変更通知 / GitHub Actions / cost meter | `op://prj019/slack/webhook_monitor` |
| `#prj019-drill` | BAN drill #1 / #3 通知 + Phase 1 中断時 emergency | `op://prj019/slack/webhook_drill` |

### 3.4 Incoming Webhook URL 取得手順（01 §2.5.3）

- 新規 workspace で `Apps` → `Incoming Webhooks` インストール
- Channel 単位で `Add to Slack` → Webhook URL コピー
- `op item edit slack webhook_hitl="<url>"` で 1Password 保存
- 3 channel 分繰り返し

---

## §4 DEC-019-050（保留）反映内容

### 4.1 保留決裁の追記内容

- 「設定後スクリーンショットを CEO へ共有」記述を維持
- ただし `/ceo` コマンド経由で共有する旨を明記（Owner setup master §2 A-5 + Phase A 完了チェックリスト）
- DEC-019-050 として正式起票するのは Owner からのスクリーンショット共有受領後

### 4.2 Owner 操作

```text
1. https://console.anthropic.com/settings/billing で spend cap $300/月設定
2. 設定画面のスクリーンショット撮影
3. /ceo "Anthropic API spend cap $300/月設定済み、スクリーンショット添付" で共有
4. CEO が DEC-019-050 として正式起票
```

---

## §5 4 ファイル別 diff 件数サマリ

| ファイル | 主要 diff 件数 | 主要変更点 |
|---|---|---|
| `00-owner-setup-master-checklist.md` | 約 12 件 | Phase A タスクリスト書き換え（A-2/A-6/A-8/A-9）、Phase D（D-1/D-2/D-3）書き換え、Phase E（E-1）`op run` 化、v2 サマリ追記、関連ファイル更新 |
| `01-saas-accounts-and-secrets.md` | 約 18 件 | §1 一覧（Slack 新規・1Password 採択）、§2.1（reference 列追加）、§2.5（新 workspace 詳細手順 3 sub-section 新設）、§2.7（Doppler 全削除→1Password 全 7 sub-section 新設）、§3（op:// reference 雛形）、Rule 4 / Rule 5、トラブルシューティング |
| `02-local-env-and-supabase-setup.md` | 約 8 件 | §2.3 typecheck/test/lint を `op run` 化、§4.2 / §5.1 / §5.2 を `op run` 化、§9.5 GitHub Actions secrets 設定（選択肢 A/B）新設、§10 完了確認チェックリスト更新 |
| `03-day0-and-demo-readiness.md` | 約 9 件 | §1.1 暖機 `op run` 化、§1.2 Slack 3 channel 名更新、§2.1 起動 `op run` 化、§4.1 Day-0 タスク（1Password Vault 投入）、§4.2 Day-0 readiness `op run` + 新 channel 名、トラブルシューティング 2 行追加 |
| **合計** | **約 47 件** | |

---

## §6 Owner 工数増減

| 項目 | v1 想定 | v2 想定 | 増減 |
|---|---|---|---|
| Phase A: SaaS アカウント整備 | 60 分 | 約 50 分 | **-10 分**（Doppler 学習コスト削減、1Password は既保有想定） |
| Phase B: ローカル環境構築 | 60 分 | 60 分 | 同等（`op run --` は 1 行追加程度） |
| Phase C: Supabase 設定 | 45 分 | 45 分 | 同等 |
| Phase D: secret 設定 | 30 分 | 30 分 | 同等 |
| Phase E: 動作確認 | 30 分 | 30 分 | 同等 |
| **合計** | **4〜6 時間** | **約 3 時間 50 分〜5 時間 50 分** | **-10 分** |

総合的には Owner 工数試算は **4-6h** 維持（DEC-019-049 で Slack 新規作成 +2 分、DEC-019-048 で secret 投入簡素化 -12 分、ネット -10 分）。

---

## §7 1Password Vault item 数サマリ

| Vault | Item 数 | Field 合計 |
|---|---|---|
| `prj019` | **5 item** | 11 field（supabase 5 + anthropic 1 + slack 3 + resend 1 + github 1） |

将来 Phase 2 で OpenClaw binary path / Casbin policy 等の secret が増えた場合は `prj019` Vault に item 追記（`openclaw` / `casbin` 等）。

---

## §8 Owner 確認用チェックリスト

Owner が v2 手順書を確認する際、以下 6 点を check してください。

- [ ] **DEC-019-048 の理解**: `op run --env-file=.env.local --` が新しい標準起動コマンドであること
- [ ] **DEC-019-048 の理解**: `.env.local` には実値を書かず、`op://prj019/...` reference のみ記述すること
- [ ] **DEC-019-049 の理解**: Slack は新規 workspace `prj019-claude-code-company` を作成し、既存業務 Slack には PRJ-019 関連通知を絶対に流さないこと
- [ ] **DEC-019-049 の理解**: 3 channel 名は `#prj019-hitl` / `#prj019-monitor` / `#prj019-drill` であること
- [ ] **DEC-019-050 保留の理解**: Anthropic API spend cap $300/月設定後、`/ceo` 経由でスクリーンショット共有すること
- [ ] **rotation SOP の理解**: secret 更新は `op item edit ...` のみで `.env.local` 修正不要、これが 1Password CLI 採択の最大利点であること

確認完了したら `/secretary v2 手順書確認完了` で報告してください。

---

## §9 escalation

v2 手順書の不明点は **`/secretary {問い合わせ内容}`** で escalation してください。

- DEC-019-048 / 1Password CLI 関連: 秘書 → Dev に routing
- DEC-019-049 / Slack 設定関連: 秘書部門で対応
- DEC-019-050 / Anthropic spend cap 関連: `/ceo` 直接でも可

---

**v2**: 2026-05-03 起案 (秘書部門、DEC-019-048/049 反映 + DEC-019-050 保留追記)
