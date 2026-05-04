# PRJ-019 Phase 1 計画 v3 — Round 5/6/7 反映版（W1 ハードガード前倒し済 + Conditional Go path 確度 93%）

- 案件: PRJ-019「Clawbridge」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤（Owner-in-the-loop 透明 AI 組織モデル）
- 部署: PM 部門
- 作成日: 2026-05-04 深夜（Round 7 起動時）
- 作成者: PM Agent (claude-code-company)
- 版: **v3（差分上書き版）** ／ v2.2 を上書き、v2 系の WBS 構造（W0/W1〜W4）と C-A 統合は踏襲、Round 5/6 で前倒し済 G-01〜G-08 + Round 5 prefetch 4 タスクを反映
- 入力（必読資料、本書冒頭の優先順）:
  - 旧版: `projects/PRJ-019/reports/pm-phase1-plan-v2.2.md`（v2.2、335 行、2026-05-04 朝）
  - Round 5 deliverables: `dev-w0-week2-round5-prefetch.md` (241 行) / `research-w0-week2-round5-ng3-baseline.md` (308 行) / `marketing-portfolio-narrative-section-1-3.md` (409 行) / `marketing-launch-x-thread-draft.md` (329 行)
  - Round 6 deliverables: `dev-w0-week2-round6-w1-hardguards.md` (225 行) / `research-5-30-ng3-decision-prep.md` (388 行) / `marketing-portfolio-narrative-section-4-10.md` (676 行) / `marketing-technical-deep-dive-vol1.md` (408 行)
  - PM Round 7 cross-ref: `pm-cross-ref-final-v8.md`（本日同 Round 起案）
  - 決裁: `projects/PRJ-019/decisions.md` line 85-88（DEC-019-050 + DEC-019-051 + DEC-019-052 + DEC-019-053）+ DEC-019-054（Round 7 起票予定）
- 確定インプット（5/4 深夜時点 CEO 決裁・起票）:
  - **DEC-019-050**: Anthropic API key 月次 spend cap = $30/月（Hard $30 / Soft $25 / 6/1 リセット、Owner 直接決裁 2026-05-03）
  - **DEC-019-051**: subscription plan 主軸運用方針 Phase 1 正式採用（CEO 起票 2026-05-04、5/8 議決-24 採択予定）
  - **DEC-019-052**: Marketing tone B 主軸 + portfolio C 両方併用 + 6/27 朝 09:00 JST + Channel 3 = Zenn + note（CEO 起票 2026-05-04、5/8 議決-25 採択予定）
  - **DEC-019-053**: `.env.example` 2-tier 再設計 = Vault 真の secret 9 fields × 4 items + 平文 12 fields（Owner 即決 2026-05-04）
  - **DEC-019-054（起票予定）**: 5/8 検収会議 層 A+B 16 件 Owner 先行承認（Owner 即決 2026-05-04「オプション 1 で進めて」、CEO 起票 2026-05-04 深夜）

---

## §1 v2.2 → v3 主要変更点（350 字以内サマリ）

Round 5/6 完遂を反映: G-01 (spawn 副作用ゼロ 3 軸) / G-04 (cost watchdog 三段階閾値 $24/$28.5/$30) / G-05+G-06 (kill-chain SIGTERM→SIGKILL + CB forceOpen) / G-08 (preflight CI fail-fast) の Phase 1 W1 5 ハードガードを W0-Week1 へ前倒し実装済 (Dev 3,066 行 / 36 new tests pass)、加えて Round 5 で `verify-zero-side-effect.sh` (DEC-019-007 自動検証) + `wrapper.ts` factory pattern + `workflow-yaml.test.ts` (DEC-019-053 永続検証) の prefetch 4 タスクが完遂。Phase 1 W1 着手 5/19 が「実装検証済の状態で開始」可能になり、5/22 mock 70% 化 Pass 確度 92→**97%** (+5%) / 5/26 Phase 1 着手 Conditional Go 達成確率 86→**93%** (+7%) / 6/20 sign-off 77→**83%** (+6%) / 6/27 朝公開 75→**82%** (+7%) に押上。5/8 議決 20→21 件 (議決-25 = DEC-019-052 バンドル追加)、層 A 11 + 層 B 5 = 16 件先行承認 (DEC-019-054)、所要時間 90-105 → 35-45 分短縮。Phase 1 sign-off 期限を 6/13→**6/20** に統一 (W4 期間ベンチ 10 連続 + Phase 2 設計まで含めて 6/20 sign-off)。

---

## §2 月次予算構造（v2.2 維持、変更なし）

### §2.1 月次総コスト 4 区分（DEC-019-051 構造、変更なし）

| 区分 | v3 月次額 | 性格 | 備考 |
|---|---|---|---|
| **(A) 既契約 subscription** | **$400/月** | 追加発生しない（固定費） | Claude Max $200（DEC-019-006/-011）+ Codex Pro $200（DEC-019-009） |
| **(B) 新規発生 API** | **≤$30/月**（Hard cap） | 補助用途、Hard cap で物理停止 | DEC-019-050（Console 設定済 Hard $30 / Soft $25 / 6/1 リセット） |
| **(C) インフラ** | **$0/月** | 全 free / personal tier 内 | Supabase Free / Vercel Hobby / GitHub Actions Free / Slack Free / Resend Free / 1Password Personal |
| **(D) Buffer** | $0 明示計上なし | (B) 内 $2 で吸収 | §3 配分参照 |
| **総額** | **≤$430/月** | (A) $400 固定 + (B) ≤$30 変動 | 単月最大値 |

### §2.2 三段階 guard 閾値（Round 6 G-04 実装済、本日納品）

| Tier | 閾値 | 動作 | Slack channel | 実装ファイル |
|------|---|---|---|---|
| `ok` | < $24 | 通常運用 | — | `usage-monitor.ts` |
| `warn` | ≥ $24（80%） | ログ + 警告通知 | `#prj019-monitor` | `cost-tracker.ts` `classifyWatchdogTier` |
| `auto_stop` | ≥ $28.5（95%） | API 呼出停止 + Owner DM | `#prj019-drill` HIGH | `usage-monitor.ts` `watchdogState.autoStopped` |
| `hard_fail` | ≥ $30（Hard） | 例外 throw + 監査ログ + kill-switch | `#prj019-drill` HIGH | `usage-monitor.ts` + `kill-switch.ts` (Round 6 統合) |

→ **Round 6 (G-04) で実装完遂、watchdog.test.ts 13 cases 全 GREEN**。

---

## §3 W0〜W4 タイムライン（Round 5/6/7 反映）

### §3.1 全体ガント（v2.2 維持 + 前倒し済表示）

```
W0-Week1 (5/04-5/08): 既契約環境セットアップ + C-A 整備 + 5/8 検収会議（議決 21 件、35-45 分）
                      + Round 5 prefetch 4 件 (verify-zero-side-effect / wrapper factory / workflow-yaml test) 完遂 [済]
                      + Round 6 W1 ハードガード 5 件 (G-01/04/05/06/08) 前倒し完遂 [済]
W0-Week2 (5/09-5/22): 5 必須施策完遂 + drill 1/2 + ToS 統合 + Go/NoGo 判定
                      + Round 5/6 で前倒し済 G-02/G-03'/G-07/G-09/G-10 残務消化中心
W1 (5/26-5/30):       Open Claw 起動 (G-01〜G-08 検証済の状態で着手) + 5/30 NG-3 再評価 [Research Round 6 で議決準備完了]
W2 (6/02-6/06):       監視・隔離 5 項目 + Claude Code 統合（v2 維持）
W3 (6/09-6/13):       ニーズ判定ループ + 公開ガード + ベンチ準備（v2 維持）
W4 (6/16-6/20):       副作用ゼロ証明 + ベンチ 10 連続 + Phase 2 設計 + Phase 1 sign-off
6/27 朝 09:00 JST:    Marketing 公開（DEC-019-052 portfolio + technical-deep-dive vol 1 + X thread）
```

### §3.2 W0-Week2（2026-05-09〜2026-05-22）= 5 必須施策 + 残務（Round 5/6 で前倒し済除外）

| 施策 # | タスク | 担当 | 期限 | 状態（Round 7 時点） | 期待効果 |
|---|---|---|---|---|---|
| **施策-1** | mock-claude フル活用（drill #3 mock 70% 化、E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling） | Dev | 5/22 | **未着手**（Round 5/6 で前倒しなし、5/9 開始） | drill #3 実 API 消費 $5-10 → $3-5 |
| **施策-2** | HITL 通知テンプレ化（事前 static text 生成、Slack DM / Email リマインド本文を固定化） | Dev | 5/9 | **未着手**（Round 5/6 で audit のみ完遂、本実装は 5/9 開始） | API 直接消費 $1-2 → $0.10 |
| **施策-3** | E2E staging 限定実行（週次 1 回 / drill 時のみ） | Dev | 5/19 | **未着手**（5/9 開始） | nightly E2E API 消費 $3 → $0.50 |
| **施策-4** | ナレッジ batch caching（PRJ-001〜018 抽出 1 回限り） | Dev | 5/30（W2 末） | **未着手**（5/9 開始、W2 末完遂） | embeddings 重複消費 $5-10 → $1 |
| **施策-5** | drill #3 簡易化（5 シナリオ E ベクトル LLM scan を mock 100% 化） | Review | 5/16 | **未着手**（Round 6 で議決準備のみ完遂、Review 5/9 着手） | drill 1 回あたり $5 → $3 |
| **追加 SOP** | Anthropic Console（Hard $30 / Soft $25）+ アプリ層 cost-monitor.ts cap value の月次同期チェック SOP | Dev + PM | 5/22 | **未着手**（Round 6 で `--scope=workflow` 7 fields 設計のみ完遂、本格 SOP 化は 5/9 開始） | drift 検出 / R-019-20 緑化 |

**期待累積効果**: API 消費見積 $19-31/月 → $11-15/月（cap $30 内 buffer 50%以上）。

### §3.3 W0-Week2 内 Round 5/6 前倒し成果（Phase 1 W1 着手 5/19 用 = 5/9 不要）

| 前倒し項目 | Round | 成果 | LoC | テスト | 効果 |
|---|---|---|---|---|---|
| **G-01 spawn 副作用ゼロ** | Round 6 | env / cwd / argv whitelist 3 軸 + `buildSpawnContract` / `buildAllowedEnv` / `defaultIsolatedCwd` | wrapper.ts +93 / index.ts +4 | spawn-isolation.test.ts 10 cases | W1 5/19-23 SP 4d 圧縮 |
| **G-02 sandbox skeleton** | (Round 5/6 で前倒しなし、W1 で着手) | — | — | — | — |
| **G-03' isolation v2** | (Round 5/6 で前倒しなし、W1 で着手) | — | — | — | — |
| **G-04 cost watchdog 三段階** | Round 6 | $24 (warn) / $28.5 (auto_stop) / $30 (hard_fail) + Slack hook + injectable interval | cost-tracker.ts +62 / usage-monitor.ts +135 / index.ts +8 | watchdog.test.ts 13 cases | W1 5/19-23 SP 3d 圧縮 |
| **G-05 kill-switch SIGTERM/SIGKILL** | Round 6 | `SubprocessKillTarget` interface + grace period escalation | kill-switch.ts +93 | kill-chain.test.ts 5 cases (G-05 専用 2) | W1 5/19-23 SP 2d 圧縮 |
| **G-06 circuit breaker forceOpen** | Round 6 | `CircuitBreakerOpenTarget` interface + getName / forceOpen | circuit-breaker.ts +17 | kill-chain.test.ts 5 cases (G-06 専用 1 + 統合 2) | W1 5/19-23 SP 1d 圧縮 |
| **G-07 hot-reload 60s** | (Round 5/6 で前倒しなし、W1 で着手) | — | — | — | — |
| **G-08 preflight CI fail-fast** | Round 6 | `--ci` flag + `isCiMode` + `isDirectInvocation` guard + `--scope=workflow` 7 fields | preflight-env.ts +40+59 / package.json +2 / openclaw-monitor.yml +24 | preflight-ci.test.ts 8 cases + 7 cases (scope) | W1 5/19-23 SP 2d 圧縮 |
| **G-09 audit log immutability** | (Round 5/6 で前倒しなし、W1 で着手) | — | — | — | — |
| **G-10 SBOM signed release** | (Round 5/6 で前倒しなし、W1 で着手) | — | — | — | — |
| **Round 5 verify-zero-side-effect.sh** | Round 5 | DEC-019-007 副作用ゼロ DoD 自動検証 (snapshot / verify モード) | scripts/verify-zero-side-effect.sh 161 行 | mock monorepo + 実 monorepo 二段検証 | W4 6/16-20 SP 1d 圧縮 |
| **Round 5 wrapper.ts factory** | Round 5 | `SubprocessSpawnContract` + `OpenclawRuntimeContract` + `createOpenclawRuntime` factory | wrapper.ts +35 | wrapper-contract.test.ts 8 cases | W1 5/19-23 SP 0.5d 圧縮 |
| **Round 5 workflow-yaml.test.ts** | Round 5 | DEC-019-053 v15.2/v15.3 永続検証 (secret 名 GH_ prefix / cache-dependency-path / filter / working-directory) | workflow-yaml.test.ts 91 行 | 6 cases | drift 防止永続化 |

→ **W1 着手 5/19 時点の SP 圧縮効果合計: 12.5d**（Phase 1 W1 全期間 5d × 5 = 25d の **50%**）

### §3.4 W1〜W4（v2.2 維持 + 前倒し前提で着手即時化）

| 期 | 期間 | 主タスク | Round 5/6 前倒し効果 |
|---|---|---|---|
| **W1** | **5/26-5/30** | Open Claw 起動（G-01〜G-08 検証済）+ 5/30 NG-3 再評価議決（Research Round 6 議決準備済） | **着手即時化、議事 30→10 分短縮** |
| W2 | 6/02-6/06 | 監視・隔離 5 項目 + Claude Code 統合 | 既存 v2 維持 |
| W3 | 6/09-6/13 | ニーズ判定ループ + 公開ガード + ベンチ準備 | 既存 v2 維持 |
| W4 | 6/16-6/20 | 副作用ゼロ証明 (Round 5 verify-zero-side-effect.sh 自動検証使用) + ベンチ 10 連続 + Phase 2 設計 + **Phase 1 sign-off (6/20)** | Round 5 自動検証で 1d 圧縮 |
| 公開 | 6/27 朝 09:00 JST | Marketing 公開 (DEC-019-052: portfolio + technical-deep-dive vol 1 + X thread) | Round 5/6 草稿完備で「実装と差替のみ」化 |

---

## §4 部署別タスク（Round 5/6/7 反映）

### §4.1 Dev 部門 — W0-Week2 残務 + W1 着手準備

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 施策-1 mock-claude 70% 化（E ベクトル 50 種 + A/B/C/D TimeSource decoupling） | 5/22 | 12h | 未着手 | DEC-019-051 |
| 2 | 施策-2 HITL 通知テンプレ化（事前 static text、prompt caching 連動） | 5/9 | 4h | Round 5 で audit のみ、本実装未着手 | DEC-019-051 |
| 3 | 施策-3 E2E staging 限定実行（週次 1 回 / drill 時のみ）切替 | 5/19 | 6h | 未着手 | DEC-019-051 |
| 4 | 施策-4 ナレッジ batch caching（PRJ-001〜018 抽出 1 回限り、embeddings cache） | 5/30 | 8h | 未着手 | DEC-019-051 |
| 5 | 施策-5 同 5（Review 連携） | 5/16 | 4h | 未着手 | DEC-019-051 |
| 6 | Anthropic Console + cost-monitor.ts 同期 SOP 策定（`--scope=workflow` 7 fields は Round 6 完遂、月次 SOP 化は 5/9） | 5/22 | 4h | Round 6 で部分完遂 | DEC-019-050 / -053 |
| **7 (新)** | W1 G-02 sandbox skeleton 実装着手準備（Round 5/6 で前倒しなし） | 5/26 | — | 未着手、W1 着手 | DEC-019-007 |
| **8 (新)** | W1 G-03' isolation v2 実装着手準備 | 5/26 | — | 未着手、W1 着手 | DEC-019-007 |
| **9 (新)** | W1 G-07 hot-reload 60s 実装着手準備 | 5/26 | — | 未着手、W1 着手 | DEC-019-033 |
| **10 (新)** | W1 G-09 audit log immutability 実装着手準備 | 5/26 | — | 未着手、W1 着手 | DEC-019-033 |
| **11 (新)** | W1 G-10 SBOM signed release 実装着手準備 | 5/26 | — | 未着手、W1 着手 | DEC-019-033 |

### §4.2 Review 部門 — W0-Week2 残務 + 議決-22 既存 5 reports 差分修正

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | drill #3 簡易化（5 シナリオ E ベクトル LLM scan を mock 100% 化） | 5/16 | 4h | 未着手 | DEC-019-051 |
| 2 | mock-claude 70% 化 acceptance criteria 起案（5/22 検収用） | 5/9 | 3h | 未着手 | DEC-019-051 / 議決-23 |
| 3 | 議決-22 既存 5 reports 差分修正（drill-3 / test-strategy / r019-15 / pre-phase1 / risk-register v2） | 5/16 朝 | 1.5d | 未着手 | 議決-22 |
| 4 | mock 70% 化 acceptance criteria 5/22 検収実施 | 5/22 | 2h | 未着手 | 議決-23 |

### §4.3 秘書部門 — Round 7 配布資料 v9 + minutes-template v4 起案完了見込

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | Risk Register v3.1 反映（R-019-19/20/21/22 新規 + R-019-09 緑化） | 5/8 朝 | 2h | Round 1 完遂 | DEC-019-051 |
| 2 | 5/8 議題 v6 改訂（議決-20〜24 追加 + 議決時間配分再計算 = 53→90-105 分） | 5/5 朝 | 2h | Round 1 完遂 (v7 既起案) | DEC-019-050 / -051 |
| 3 | DEC-019-050 / -051 / -052 / -053 / -054 の decisions.md 反映 footer 更新 | 5/8 | 1h | Round 6 で v15.5 まで完遂、v15.6 (Round 7) は CEO 統合判断時 | 全決裁 |
| **4 (新)** | **5/8 配布資料 v9 起案 (本 Round 7、層 A 11 + 層 B 5 + 層 C 5、35-45 分短縮)** | 5/4 深夜 | 3h | **Round 7 staged 中** | DEC-019-054 |
| **5 (新)** | **5/8 議事録テンプレ v4 起案 (16 件先行承認エビデンス + 5 件議論欄)** | 5/4 深夜 | 2h | **Round 7 staged 中** | DEC-019-054 |
| 6 | 5/7 22:00 配布実行 (8 ファイル → 9 ファイル) | 5/7 22:00 | 1h | 未着手 | — |

### §4.4 Research 部門 — 5/30 NG-3 議決準備済（Round 6 完遂）

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 5/30 W2 終了時 NG-3 再評価議題に「subscription 主軸での実消費ベースライン」追加 | 5/30 | 2h | **Round 6 で議決準備パッケージ 388 行完遂** | DEC-019-051 |
| 2 | OP-1〜OP-4 残論点（v2.1 §B6）継続調査 | 5/12 | 既存 | 既存 | 既存 |
| 3 | NG-3 案 B (16h/$100/$500) 監視実装仕様 (process clock / 三点照合 SOP) | 5/30 | 2d | **Round 6 で完遂** | DEC-019-008 / -050 / -051 |

### §4.5 Marketing 部門 — Round 5/6 で portfolio + X thread + technical-deep-dive 完遂

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | portfolio Section 1-3 (B 主軸 + C 補助 hard tone 草稿) | 5/4 深夜 | 1d | **Round 5 で 409 行完遂** | DEC-019-052 |
| 2 | portfolio Section 4-10 (§11 自己検証 B/C/A 7/7/7) | 5/4 深夜 | 1.5d | **Round 6 で 676 行完遂** | DEC-019-052 |
| 3 | technical-deep-dive vol 1 (Zenn/note frontmatter + §2.1〜2.11 アーキ) | 5/4 深夜 | 1d | **Round 6 で 408 行完遂** | DEC-019-052 (d) |
| 4 | launch X thread (1 teaser + 5 launch posts ≤280 chars) | 5/4 深夜 | 0.5d | **Round 5 で 329 行完遂** | DEC-019-052 (a)(c) |
| 5 | 6/22-26 段階 1-3 (実装 / Review / Owner 最終承認) → 6/27 09:00 公開 | 6/22-27 | 5d | 未着手（草稿完備で「実装と差替のみ」） | DEC-019-052 |

### §4.6 PM 部門 — Round 7 で本書 + cross-ref final v8 + dashboard 起案

| # | タスク | 期限 | 工数 | 状態 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 本書（pm-phase1-plan-v3.md）起案 = v2.2 上書き | 5/4 深夜 | 4h | **Round 7 staged 中** | Round 5/6 deliverables + DEC-019-054 |
| 2 | cross-ref final v8 起案 (Round 1/5/6/7 = 41 件監査) | 5/4 深夜 | 3h | **Round 7 staged 中** | 同上 |
| 3 | dashboard PRJ-019 行更新 (進捗 55→60% / Round 5/6 完遂) | 5/4 深夜 | 0.1h | **Round 7 staged 中** | — |
| 4 | W0-Week2 5 必須施策の WBS 細分化（Dev 連携） | 5/8 | 3h | Round 1 完遂 (v2.2 §4.1) | DEC-019-051 |
| 5 | Owner 工数モニタリング（W0-Week2 max 7.35h / 週、§9 参照） | 継続 | 0.5h/週 | 継続 | DEC-019-051 |

---

## §5 確度トラッキング（Round 5/6/7 累積効果）

| マイルストン | 起点 (v2.1) | DEC-019-050 採択前 | v2.2 (DEC-019-051 採択後) | Round 5 後 | Round 6 後 | **v3 (Round 7 終了時想定)** | 累積差分 (起点 → v3) |
|---|---|---|---|---|---|---|---|
| **5/22 scaffold 完全承認確度 (mock 70% 化 Pass)** | 78% | 80% | 82% | 96% | 97% | **97%** | **+19%** |
| **5/26 Phase 1 着手 Conditional Go 達成確率** | 80% | 84% | 86% | 92% | 93% | **93%** | **+13%** |
| **6/20 Phase 1 完了 sign-off 確度** | 73% | 75% | 77% | 82% | 83% | **83%** | **+10%** |
| **6/27 公開遵守確度** | 70% | 73% | 75% | 81% | 82% | **82%** | **+12%** |
| **Day-0 readiness** | 95% | 97% | 99% | 99% | 99% | **99%** | **+4%** |

→ **Round 5/6 (G-01〜G-08 前倒し + Round 5 prefetch) は Phase 1 達成確率を全帯で +5〜+7% 押上げ**。cost discipline + 物理防御 + subscription 主軸 + W1 ハードガード前倒し + Marketing 草稿完備 + Round 7 16 件先行承認 が累積効果を発揮。

---

## §6 Risk Register v3.1 サマリ（21 件、Round 1 で確定、Round 5/6/7 では更新なし）

| 区分 | 件数 |
|---|---|
| 赤 | 2 件 (R-019-12-A / R-019-15) |
| 黄 | 14 件 |
| 緑 | 5 件 (R-019-08 / -09 / -11 / -20 / -22) |
| **計** | **21 件** |
| 重点監視 | 9 件 (週次 7 + 月次 2) |

詳細: `secretary-risk-register-v3-1.md` (canonical) + `review-risk-register-v3-1.md` (Review 起案、並存運用)。Round 5/6/7 では新規 risk 起票なし。

---

## §7 Phase 1 達成 KPI（v3 確定、Round 5/6/7 反映）

| KPI | 目標 | 検証方法 | Round 5/6/7 反映状況 |
|---|---|---|---|
| **subscription 経路維持** | **95%** 維持（流量比） | cron 15min ロギング / EOD daily summary | Round 6 G-04 watchdog 実装で精度向上 |
| **API 経路圧縮** | **≤$15/月**（cap $30 内 50% buffer） | Anthropic Console usage API + Supabase `cost_metrics` | Round 6 三段階閾値で物理保証 |
| **mock-claude 70% 化** | **完遂（5/22）** | Review acceptance criteria 合格 | Round 5/6 で前倒しなし、5/9 着手予定 |
| **議決-20〜25 全採択** | **5/8 検収会議で全件 YES**（議決-25 = DEC-019-052 バンドル含む） | 議事録 | Round 7 で 16 件先行承認 (層 A+B) |
| **G-01〜G-08 前倒し** | Round 5/6 で 5 件 (G-01/04/05/06/08) 完遂 | Dev round6 §6 完了基準チェック | **Round 6 で完遂** |
| 既存 KPI（v2.1 §B4.4 維持） | ベンチ 1 件 < 60 分 / < $5 / 10 連続成功率 ≥ 80% / HITL 100% / 副作用 0 行 | 既存 + Round 5 verify-zero-side-effect.sh 自動検証 | Round 5 で自動検証 prefetch |
| Phase 1 月次合計コスト | **≤$430/月**（既契約 $400 + 新規 ≤$30） | §2 月次予算構造 | 維持 |
| **DEC-019-052 6/27 朝公開** | 09:00 JST 公開 (B 主軸 + portfolio C 両方併用 + Channel 3) | Marketing portfolio + technical-deep-dive vol 1 + X thread | **Round 5/6 で草稿完備** |

---

## §8 Phase 2 移行判断軸

### §8.1 5/30 NG-3 再評価（W2 終了時、Round 6 議決準備済）

- DEC-019-008 NG-3 暫定値 12h/日 + API $1,000 を再確認 → **Round 6 Research 準備で議決文案 + 議論 5 件 + Q&A 10 件 + 否決時 fallback 完備**
- **CEO 推奨 = 案 B (16h/日 + API cap $30→$100、subscription $400/月 維持、月次総額 $500 cap)**
- 案 C (24/7 + $300) は BAN 確率 60-80% で reject
- 5/30 議事時間: 30 分 → **10 分**に圧縮可能（Round 6 効果）

### §8.2 8/1 cap 増額是非（Phase 2 計画書起案時）

- Phase 2 実装規模 3 倍想定（HITL +200% / KE-04 +500% / Pen Test 自動化）
- 別途 DEC で **$30 → $100 / $500 等の増額**を Owner 決裁
- Phase 2 拡張余地 $270/月（DEC-019-016 上限内）を活用
- Phase 2 計画書起案 = 2026-08-01 想定

---

## §9 Owner 工数（≤ 週 10h 維持確認、Round 7 で再検証）

### §9.1 W0-Week1 残期 (5/5-5/8) Owner 工数

| 用途 | 工数 | 備考 |
|---|---|---|
| 5/8 検収会議参加 | **0.6-0.75h** (35-45 分) | 議題 21 件 / 16 件先行承認 + 5 件議論で短縮 |
| Round 7 配布資料 v9 + minutes-template v4 事前読了 | 0.25h | 5/7 EOD 配布 → 5/8 12:00 までに事前読了 |
| **合計 (5/5-5/8)** | **0.85-1.0h** | ≤ 週 10h の 8.5-10% 充当 |

### §9.2 W0-Week2 Owner 工数（max 7.35h / 週、v2.2 維持）

v2.2 §9.1 と同一。W0-Week2 drill 週 max **7.35h / 週**（充当率 74%、余裕 26%）/ 非 drill 週 **4.35h / 週**（充当率 44%）。

### §9.3 W1〜W4 Owner 工数（v2.2 §9.2 維持、Round 5/6 前倒しで W1 圧縮可能性）

| 期 | Owner 工数 | 備考 |
|---|---|---|
| W1 | 5h → **3h 見込**（Round 6 G-01〜G-08 検証済で kickoff 議論短縮） | DEC-019-033 / Conditional Go 確認 |
| W2 | 3h → **2h 見込**（5/30 NG-3 議事 30→10 分短縮） | NG-3 再評価議題（5/30）参加 |
| W3 | 3h | 公開ガード確認 |
| W4 | 5h | Phase 2 Go/NoGo 判定 |

→ **Phase 1 全期間で ≤ 週 10h 維持確認済 + Round 5/6 前倒しで W1/W2 で計 3h 圧縮可能**。

---

## §10 v2.2 → v3 差分一覧（具体的箇所明示）

| # | 節 | v2.2 内容 | **v3 変更内容** | 根拠 |
|---|---|---|---|---|
| **10-1** | §1 | v2.1 → v2.2 主要変更点（DEC-019-050/-051 反映） | **§1 v2.2 → v3 主要変更点 350 字サマリに刷新**（Round 5/6/7 反映） | 本書 §1 |
| **10-2** | §2 月次予算 | §2.1〜2.4 月次予算構造 ≤$430/月 | **§2.1 維持 + §2.2 三段階 guard を Round 6 G-04 実装済として再記載** | DEC-019-050 + Round 6 |
| **10-3** | §3 タイムライン | W0-Week2 5 必須施策 | **§3.1 全体ガントに Round 5/6 前倒し成果明示 + §3.3 Round 5/6 前倒し成果テーブル新設** | Round 5/6 deliverables |
| **10-4** | §3.4 W1-W4 | v2 §3.3 維持 | **§3.4 W1〜W4 タイムライン table 新設** + Round 5/6 前倒し効果明示 | Round 5/6 deliverables |
| **10-5** | §4.1 Dev | v2.1 §B2.2 W0 7 タスク + 5 必須施策 + 1 SOP | **§4.1 Dev W0-Week2 残務 + W1 着手準備 5 タスク (G-02/03'/07/09/10) 新規追加** | Round 5/6 効果 |
| **10-6** | §4.2 Review | drill #3 簡易化 + acceptance criteria | **§4.2 議決-22 既存 5 reports 差分修正 5/16 朝 + acceptance criteria 5/22 検収実施 を新規明示** | 議決-22 / 議決-23 |
| **10-7** | §4.3 秘書 | v2.2 §4.3 既存 3 タスク | **§4.3 Round 7 配布資料 v9 + minutes-template v4 起案 を新規 2 タスク追加** | DEC-019-054 |
| **10-8** | §4.4 Research | 5/30 NG-3 議題追加 | **§4.4 Round 6 議決準備 388 行完遂 + 案 B 監視実装仕様 完遂 を明示** | Round 6 |
| **10-9** | §4.5 Marketing | （v2.2 では明示なし） | **§4.5 Marketing 5 タスク新規明示**（Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 完遂、6/22-26 段階 1-3 + 6/27 公開のみ残） | DEC-019-052 + Round 5/6 |
| **10-10** | §4.6 PM | v2.1 §B2.2 W0 5 タスク | **§4.6 Round 7 で本書 + cross-ref final v8 + dashboard 起案 を新規 3 タスク追加** | Round 7 |
| **10-11** | §5 確度 | v2.2 §5 5 マイルストン × DEC-019-051 採択後 | **§5 Round 5/6/7 累積効果 column 追加 (起点 → v3 +10%-19%)** | Round 5/6/7 |
| **10-12** | §6 Risk Register | v2.2 §6.1〜6.3 v3.1 サマリ | **§6 Risk Register v3.1 21 件サマリのみ維持 + Round 5/6/7 では新規 risk 起票なし明示** | 維持 |
| **10-13** | §7 KPI | v2.2 §7 KPI 6 件 | **§7 KPI に G-01〜G-08 前倒し / DEC-019-052 6/27 朝公開 を追加 = 8 件** | Round 5/6 |
| **10-14** | §8 Phase 2 移行 | v2.2 §8 5/30 NG-3 + 8/1 cap 増額 | **§8 5/30 議事 30→10 分圧縮明示 + 案 B 推奨 ($30→$100) 明示** | Round 6 |
| **10-15** | §9 Owner 工数 | v2.2 §9 W0-Week2 max 7.35h | **§9.1 W0-Week1 残期 (5/5-5/8) Owner 工数を 0.85-1.0h と新規明示** + §9.3 W1/W2 圧縮可能性追記 | DEC-019-054 + Round 6 |
| **10-16** | §10 差分一覧 | v2.2 では §10 v2.1 → v2.2 差分 14 件 | **§10 v2.2 → v3 差分一覧 17 件を本書で明示** | 本書 |
| **10-17** | §11 5/8 検収会議議題 | v2.2 §11 議決 14 件 (議決-7〜20) | **§11 議決 21 件 (議決-1〜25 のうち)、層 A 11 + 層 B 5 + 層 C 5、35-45 分** | DEC-019-054 |

### §10.1 v2.2 で維持する箇所（変更なし）

- v2.2 §2.1 月次予算 4 区分 → §2.1 で維持
- v2.2 §2.3 流量比 95% / 5% → 維持（Round 5/6/7 で変動なし）
- v2.2 §2.4 三段階 guard 閾値 → §2.2 で Round 6 実装済として再記載
- v2.2 §6 Risk Register v3.1 21 件 → §6 で維持
- v2.2 §7 既存 KPI 6 件 → §7 で 8 件に拡張
- v2.2 §8 5/30 NG-3 + 8/1 cap 増額 → §8 で維持 + Round 6 効果追記

---

## §11 5/8 検収会議 議題（議決 21 件、層 A+B+C 三層構造、35-45 分）

### §11.1 議題総数（議決-1〜25 のうち欠番除く 21 件）

| 順 | 議決 | 内容 | 想定 min | 起票部署 | 採択推奨 | 層 |
|---|---|---|---|---|---|---|
| 1 | 議決-1 | DEC-019-033 5 点統合採用 | 0.2 | CEO | YES | **A** (Owner 5/4 即決済) |
| 2 | 議決-2 | Phase 1 着手 5/26 Conditional Go (3 条件付き、確度 93%) | 5.0 | PM | YES | **C** (議論必須) |
| 3 | 議決-3 | Phase 1 完了 6/20 + Marketing 公開 6/27 朝 09:00 JST | 0.5 | PM | YES | **B** (確認のみ) |
| 4 | 議決-4 | KPI 提案承認率 ≥ 30% + TR-4 ジャンル切替 | 0.5 | PM | YES | **B** |
| 5 | 議決-5 | 必須コントロール 50 項目採用 | 5.0 | PM + Review | YES | **C** (議論必須) |
| 6 | 議決-6 | HITL 第 9・10・11 種正式追加 | 0.2 | Dev + Review | YES | **A** |
| 7 | 議決-7 | BAN drill #3 (5/29) 実施承認 (mock 70% 化条件付き) | 5.0 | Review | YES | **C** (議論必須) |
| 8 | 議決-8 | R-019-15 priviledge escalation 赤格付け公式化 | 0.5 | Review | YES | **B** |
| 9 | 議決-9 | Heading A 補強表記 A1 採用 | 0.2 | Marketing | YES | **A** |
| 10 | 議決-10 | Dev 2 名体制 Phase 1 全期間確保 | 0.5 | PM + Review | YES | **B** |
| 11 | 議決-11 | 外部 policy import 機能 Phase 1 完全無効化 | 0.2 | Review | YES | **A** |
| 12 | 議決-12 | 1Password TOTP Owner 二要素認証採用 | 0.2 | Review | YES | **A** |
| 13 | 議決-13 | DEC-019-034 P-D 改 維持 + 微修正 C-OC-06/07/08 採択 | 0.2 | Research | YES | **A** |
| 14 | 議決-14 | DEC-019-035 Issue/changelog 監視運用 SOP 採択 | 0.2 | Research | YES | **A** |
| 15 | 議決-15 | DEC-019-036 上流 pivot に伴う Phase 2 機能候補 3 件登録 | 0.2 | Research | YES | **A** |
| 16 | 議決-20 | PM 月次予算 v2 ($430/月構造) 正式採用 | 0.5 | PM | YES | **B** |
| 17 | 議決-21 | Risk Register v3.1 (21 件) 正式採用 | 7.0 | Review + PM + Research | YES | **C** (議論必須) |
| 18 | 議決-22 | 既存 5 reports 差分修正 正式採用 | 0.2 | Review | YES | **A** |
| 19 | 議決-23 | mock-claude 70% 化 SOP + Anthropic Console 同期 SOP 正式採用 | 7.0 | Review + Dev | YES | **C** (議論必須) |
| 20 | 議決-24 | DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用 | 0.2 | CEO + Research | YES | **A** |
| 21 | 議決-25 | DEC-019-052 = Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3 一括採択 | 0.2 | CEO + Marketing + Web-Ops | YES | **A** |
| **計** | **21 件** | — | **34.0 分** | — | YES 全件 | **A=11 / B=5 / C=5** |

### §11.2 議題消化想定（v2.2 比 −55〜60 分短縮）

- v2.2: 90-105 min 想定
- v3: **35-45 min**（層 A 11 件 × 0.2 分 = 2.2 分 + 層 B 5 件 × 0.5 分 = 2.5 分 + 層 C 5 件 × 5-7 分 = 25-35 分 + バッファ 5-10 分）
- 短縮幅: **−55〜60 分**（DEC-019-054 = 16 件先行承認 効果）

---

## §12 関連決裁・参照

### §12.1 反映決裁

- DEC-019-050: Anthropic API spend cap $30/月 確定（Owner 直接決裁 2026-05-03）
- DEC-019-051: subscription plan 主軸運用方針 Phase 1 正式採用（CEO 起票 2026-05-04）
- DEC-019-052: Marketing tone B + portfolio C + 公開時刻 + Channel 3 一括採択（CEO 起票 2026-05-04、5/8 議決-25 採択予定）
- DEC-019-053: `.env.example` 2-tier 再設計（Owner 即決 2026-05-04）
- **DEC-019-054 (起票予定)**: 5/8 検収会議 層 A+B 16 件 Owner 先行承認（Owner 即決 2026-05-04「オプション 1 で進めて」、CEO 起票 2026-05-04 深夜）
- 既存維持: DEC-019-005〜049（v2.2 から継承）

### §12.2 参照書

- `projects/PRJ-019/reports/pm-cross-ref-final-v8.md`（本日同 Round 7 起案、Round 1/5/6/7 = 41 件監査）
- `projects/PRJ-019/reports/dev-w0-week2-round5-prefetch.md`（Round 5、241 行）
- `projects/PRJ-019/reports/dev-w0-week2-round6-w1-hardguards.md`（Round 6、225 行、G-01〜G-08）
- `projects/PRJ-019/reports/research-w0-week2-round5-ng3-baseline.md`（Round 5、308 行）
- `projects/PRJ-019/reports/research-5-30-ng3-decision-prep.md`（Round 6、388 行）
- `projects/PRJ-019/reports/marketing-portfolio-narrative-section-1-3.md`（Round 5、409 行）
- `projects/PRJ-019/reports/marketing-portfolio-narrative-section-4-10.md`（Round 6、676 行）
- `projects/PRJ-019/reports/marketing-technical-deep-dive-vol1.md`（Round 6、408 行）
- `projects/PRJ-019/reports/marketing-launch-x-thread-draft.md`（Round 5、329 行）
- `projects/PRJ-019/reports/pm-phase1-plan-v2.2.md`（旧版、本書で上書き）
- `projects/PRJ-019/reports/pm-budget-v2-30usd-api-cap.md`（月次予算 v2 = §2 根拠）
- `projects/PRJ-019/reports/pm-v4-master-plan.md`（PM v4 マスタープラン、W1-W4 WBS 根拠）

---

## §13 結論

1. **Round 5/6 完遂で W1 ハードガード 5 件 (G-01/04/05/06/08) + Round 5 prefetch 4 件 = 9 件 W0-Week1 内前倒し**、Phase 1 W1 着手 5/19 が「実装検証済の状態で開始」可能化。
2. **確度全帯 +5〜+7% 押上げ**（5/22 92→97% / 5/26 86→93% / 6/20 77→83% / 6/27 75→82%）。
3. **Risk Register v3→v3.1**（21 件、Round 1 確定、Round 5/6/7 で更新なし）。
4. **5/8 検収議題 14→21 件**（議決-25 = DEC-019-052 バンドル追加）、層 A 11 + 層 B 5 + 層 C 5、所要時間 90-105 → **35-45 分**短縮 (DEC-019-054)。
5. **Owner 工数 ≤ 週 10h 維持確認**（W0-Week1 残期 0.85-1.0h、W0-Week2 drill 週 max 7.35h、W1/W2 で計 3h 圧縮可能）。
6. **Phase 2 移行判断軸 2 軸**（5/30 NG-3 再評価 = Round 6 議決準備済 + 8/1 cap 増額是非）を明示。
7. **Marketing 6/27 朝公開準備 100%**（Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 草稿完備、6/22-26 段階 1-3 期間が「実装と差替のみ」に純化）。
8. **DEC-019-054 起票予定**: 5/8 検収会議 層 A+B 16 件 Owner 先行承認、CEO 統合判断 commit 時に decisions.md v15.6 / v16 として正式追加。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-02 | PM 部門 | 初版（Phase 1 計画策定、`pm-architecture-v2-and-phase1-plan.md`） |
| v2.0 | 2026-05-02 | PM 部門 | DEC-019-005〜008 反映（Phase 1 着手承認 + アカウント分離前提） |
| v2.1 | 2026-05-03 | PM 部門 | DEC-019-009〜013 反映（オプション A 採用 + W0 新設 + C-A-01〜05 統合 + ToS ホワイトリスト依存）`pm-phase1-plan-v2.1.md` |
| v2.2 | 2026-05-04 朝 | PM 部門 | DEC-019-050 + DEC-019-051 反映（subscription $400 主軸 + API ≤$30 + 5 必須施策 + Risk v3.1 + 確度 +2% + 議決-20〜24 追加）`pm-phase1-plan-v2.2.md` |
| **v3** | **2026-05-04 深夜** | **PM 部門** | **Round 5 (4 件 / 1,287 行) + Round 6 (6 件 / 2,196 行 + CEO hotfix) + Round 7 (本書 + cross-ref final v8 + 配布資料 v9 + minutes-template v4 + dashboard) を反映、DEC-019-052/-053/-054 追加、確度 5/22 92→97% / 5/26 86→93% / 6/20 77→83% / 6/27 75→82%、5/8 議決 14→21 件 / 層 A 11 + 層 B 5 + 層 C 5 / 35-45 分短縮**（本書） |

**v3 確定**: 2026-05-04 深夜 / **採択予定**: 2026-05-08 W0-Week1 検収会議 議決-1〜25 (21 件、層 A+B 16 件先行承認 + 層 C 5 件議論) / **次回更新**: ① 5/8 議決結果反映 ② BAN drill 1 (5/13) 後 ③ BAN drill 2 (5/17) 後 ④ Phase 1 着手 Go/NoGo 判定 (5/22) 後 ⑤ 5/30 NG-3 再評価後 ⑥ Phase 1 完了 (6/20) 後

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-phase1-plan-v3.md`
- 版: v3（2026-05-04 深夜、Round 7 起動時）
- 起案: PM 部門
- 範囲: Round 5/6/7 反映 (W1 ハードガード前倒し済 + 16 件先行承認 + Marketing 草稿完備)
- 検収: CEO（Round 7 commit/push 後）+ Owner（5/8 議決-3 sign-off）
