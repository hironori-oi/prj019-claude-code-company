# PRJ-019 進捗管理（progress.md）

## 案件情報

- **案件 ID**: PRJ-019
- **案件名（仮）**: Clawbridge（仮称） — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- **現在 Phase**: **Phase 1 着手準備（W0、2026-05-02〜2026-05-18）**
- **全体進捗**: **67%**（Phase 0 完了 + Phase 1 Go 決裁 + W0-Week1 4 Round 並列発注完遂 + DEC-019-009〜055 連続発行 + Owner Vault 9/9 fields 完遂 + Slack 3 channel live smoke 全 200 OK / 1 attempt 達成 + Plan A 完遂 + workflow openclaw-monitor 緑 ✓ + Round 5 完遂 + Round 6 完遂 + DEC-019-054 起票 + Round 7 案 7-D 4 部署並列前倒し全完遂着地 (35 files / 6,500+ 行 / commit `f1548cd`) + parent dashboard reconcile (60→65% / commit `8e6564c`) + **DEC-019-055 起票 + Round 8 Plan 8-Full 採択起動 = α (W2 後半実装前倒し: HITL 第 9 種 `dev_kickoff_approval` 雛形 + 透明性 Dashboard MVP) + β (Phase 2 plan v1 起案 + Go/NoGo 判断テンプレ) + γ (HP `/works/clawbridge` staging ページ実装仕様 + Web-Ops handoff package) を 4 並列 background agent で即時起動** = Dev α / PM β / Research β concurrent / Marketing γ、Phase 1 W1/W2 想定スコープの prefetch >50% → 60%+ 達成見込み、Owner 残動作 0 件継続、5/8 検収会議所要 35-45 分維持）
- **起案日**: 2026-05-02
- **Phase 1 着手承認日**: 2026-05-02（DEC-019-007）
- **Phase 1 W1 着手予定日**: 2026-05-19
- **Phase 1 W4 完了予定日**: 2026-06-13
- **担当**: オーナー本人 ／ CEO 統括 ／ 秘書（登録完了 + Phase 1 タスク管理） ／ リサーチ（主担当 + 補追完了） ／ PM（要件整理 + v2 完成 + WBS 確定） ／ レビュー（セキュリティ評価 v1 + v2 完成、強い条件付き Go 推奨） ／ Dev（W1 着手待機）

---

## マイルストーン

| # | マイルストン | 予定日 | 実績日 | ステータス |
|---|---|---|---|---|
| 0 | 起案 + 案件登録（brief / decisions / progress / tasks / risks + app/README.md） | 2026-05-02 | 2026-05-02 | **完了** |
| 1 | リサーチ部門の徹底調査完了 + 補追（ToS とサブスク駆動経路） | 2026-05-09 目標 | 2026-05-02 | **完了**（前倒し）|
| 2 | PM 要件整理 v1 完成 + v2 アーキテクチャ + Phase 1 ディテール計画完成 | 2026-05-12 目標 | 2026-05-02 | **完了**（前倒し）|
| 3 | レビュー部門のセキュリティリスク評価レポート v1 + v2（サブスク駆動採用版）完成 | 2026-05-14 目標 | 2026-05-02 | **完了**（前倒し）|
| 4 | **Phase 0 完了 + DEC-019-005〜008 で Phase 1 Go 決裁** | 2026-05-16 目標 | 2026-05-02 | **完了**（強い条件付き Go） |
| 5 | **Phase 1 W0 準備期間**（環境準備 / 契約 / オーナー直接確認） | 2026-05-02〜2026-05-18 | — | **進行中** |
| 6 | Phase 1 W1 着手（ハードガード前倒し: G-01/G-04/G-05/G-06/G-08） | 2026-05-19 着手、2026-05-23 完了 | — | 未着手 |
| 7 | Phase 1 W2（監視・隔離: G-02/G-03'/G-07/G-09/G-10、tos_monitor 実装） | 2026-05-26〜2026-05-30 | — | 未着手 |
| 8 | Phase 1 W2 終了時 — DEC-019-008 NG-3 暫定値の再確認（オーナー） | 2026-05-30 | — | 未着手 |
| 9 | Phase 1 W3（ニーズ判定 + 公開ガード: G-11） | 2026-06-02〜2026-06-06 | — | 未着手 |
| 10 | Phase 1 W4（副作用ゼロ証明 + ベンチマーク 10 連続実行） | 2026-06-09〜2026-06-13 | — | 未着手 |
| 11 | **Phase 1 完了レポート + Phase 2 Go/NoGo 決裁（DEC-019-XXX）** | 2026-06-13 | — | 未着手 |

---

## Phase 0 完了 + Phase 1 着手承認（2026-05-02）

### Phase 0 成果物（7 ファイル）

1. `reports/secretary-registration-summary.md` — 秘書登録完了報告
2. `reports/research-openclaw-harness-investigation.md` — リサーチ部門徹底調査
3. `reports/research-supplement-tos-and-subscription-paths.md` — リサーチ補追（ToS / 7 サブスク経路評価）
4. `reports/pm-requirements-and-architecture.md` — PM 要件定義 v1
5. `reports/pm-architecture-v2-and-phase1-plan.md` — PM v2（OQ-01〜05 反映 / Phase 1 WBS）
6. `reports/review-security-and-risk-assessment.md` — レビュー v1（API キー前提）
7. `reports/review-v2-subscription-risk-and-fallback.md` — レビュー v2（サブスク駆動採用 / 強い条件付き Go）

### CEO 決裁（2026-05-02）

- **DEC-019-005**: OQ-01〜05 オーナー判断を全面受容、Phase 1 着手前提として正式採用
- **DEC-019-006**: サブスク駆動接続方式 = **P-D 改**（公式 Claude Code CLI 常駐 + Open Claw subprocess spawn）／ アカウント分離は不採用（NG-2 連鎖 BAN リスク優先）
- **DEC-019-007**: Phase 1 を **強い条件付き Go** で正式承認（4 週間、月次予算 $300、必須コントロール 21/23 を着手前クリア、BAN リスク承認）
- **DEC-019-008**: NG-3 24/7 連続自律稼働回避方針 CEO 暫定値（12 h/日 上限、API 換算 $1,000/月相当で停止、W2 終了時再確認）

### 次マイルストーン（W0 準備期間: 2026-05-02〜2026-05-18）

- リポジトリ作成（clawbridge 専用）／ Vercel Sandbox アカウント整備 ／ Anthropic Max $200 契約 ／ Codex Pro $100 確認 ／ OpenAI ToS オーナー直接確認 ／ 1Password Vault 構築 ／ GitHub branch protection 一括適用準備
- **W0 全タスク完遂を W1 着手の前提条件**とする

---

## オーナー W0 タスク完了 + DEC-019-009〜013 発行（2026-05-02）

### マイルストーン

- **CB-O-01 完了**: OpenAI ToS 全文取得 + CEO 一次解釈「条件付き許容」確定（DEC-019-010）
- **CB-O-02 完了**: 既 Claude Max $200 アップグレード済 + オーナー判断「オプション A 採用」確定（DEC-019-011、Sumi/Asagi 巻き添えリスク受容）
- **CB-O-03 完了**: ChatGPT Pro **$200/月**（$100 想定撤回）既契約確定、Codex 5h 制限 100% 残（DEC-019-009）
- **GO-06 部分完了**: 月次予算 $300 承認受領、Spend Cap 設定はオーナー残タスク（DEC-019-012）
- **DEC-019-009〜013 発行**（5 件）:
  - DEC-019-009: Codex プラン仕様確定（Pro $200、月次予算 $300 を「追加発生分の上限」として再定義）
  - DEC-019-010: OpenAI ToS 解釈確定（条件付き許容、対象分野ホワイト/ブラック + multi-account 禁止 + OSS ライセンス検証）
  - DEC-019-011: DEC-019-006 部分撤回 → オプション A 採用（既存 claude.ai 継続使用）
  - DEC-019-012: 月次予算 $300 + Spend Cap（Anthropic Hard $50 / OpenAI Hard $20）
  - DEC-019-013: オプション A 採用に伴う追加コントロール群 C-A-01〜05 発令
- **W0 タスク追加発令**（7 件）:
  - CB-S-W0-02 対象分野ホワイト/ブラックリスト原案（5/9 / レビュー）
  - CB-PM-W0-02 コスト計画 v3（5/9 / PM）
  - CB-D-W0-06 使用量モニタリング（5/12 / Dev）
  - CB-S-W0-04 BAN drill 2 回（5/12 + 5/17 / レビュー + Dev）
  - CB-D-W0-05 Sumi/Asagi バックアップ（5/15 / Dev）
  - CB-S-W0-03 BAN 退避手順書（5/15 / レビュー）
  - CB-D-W0-07 OAuth トークン隔離（5/15 / Dev）

### 次マイルストーン

- **2026-05-09**: 対象分野ホワイト/ブラックリスト原案策定（CB-S-W0-02）+ コスト計画 v3（CB-PM-W0-02）
- **2026-05-12**: 使用量モニタリング組み込み完遂（CB-D-W0-06）+ BAN drill 1 回目（CB-S-W0-04）
- **2026-05-15**: Sumi/Asagi 完全バックアップ（CB-D-W0-05）+ BAN 退避手順書（CB-S-W0-03）+ OAuth トークン隔離（CB-D-W0-07）
- **2026-05-17**: BAN drill 2 回目（CB-S-W0-04）
- **2026-05-18**: W0 完了レビュー（CB-S-W0-01）+ オーナー Spend Cap 設定（Anthropic / OpenAI）
- **2026-05-19**: Phase 1 W1 着手

### オーナー残タスク

- リマインダー: `reports/owner-pending-tasks-2026-05-02.md` を参照
  - CB-O-05 Doppler 登録（5/15 期限、30 分、CEO 推奨）
  - Anthropic Spend Cap 設定（Hard $50/月、5/18 期限、5 分）
  - OpenAI Spend Cap 設定（Hard $20/月、5/18 期限、5 分）

---

## v1 起案（2026-05-02）

### 起案の経緯

1. **オーナー指示** — Open Claw（clawbro.ai/ja）を ChatGPT Codex x5 サブスクで動作させ、claude-code-company 組織を Open Claw が「オーナー」として運営する完全自動化基盤を構築したい。Phase 0 は徹底調査と要件整理が主目的、実装は調査完了後に別決裁
2. **秘書登録**（本セッション、2026-05-02） — `dashboard/active-projects.md` に PRJ-019 行追加 + `projects/PRJ-019/` 配下に 5 点ドキュメント（brief / decisions / progress / tasks / risks）+ `app/README.md` を整備
3. **次アクション** — リサーチ部門への Phase 0 調査依頼（CEO 経由）

### 進捗ログ

#### 2026-05-02 PM アーキテクチャ v2 + Phase 1 ディテール計画書完成

- PM 部門が `reports/pm-architecture-v2-and-phase1-plan.md` を作成。オーナー判断 OQ-01〜OQ-05（Codex Pro $200 5x / Anthropic サブスク駆動 / OpenAI ToS 確認済 / 自前ハーネス確定 / PRJ-018 並走）を全面反映。サブスク駆動 3 案併記（P-C/P-D/P-E）、必須コントロール 12 項目を W1〜W4 WBS に配置、Phase 1 月次予算 $300、副作用ゼロ証明手順を確定。**Phase 1 着手 Go 推奨**（条件付き）。

#### 2026-05-02 PM 要件定義書 v1 完成

- PM 部門が `reports/pm-requirements-and-architecture.md` を作成（CB-P-01〜CB-P-06 を実質完遂）。リサーチ確定制約（API キー必須／HITL 前提／推奨スタック）を全面採用、ハーネス権限マトリクス・5 ゲート HITL・コスト/wall-clock キャップ・Phase 計画・Go/NoGo 基準・オープン論点 OQ-01〜OQ-10 を整理。次はレビュー部門 CB-S-01〜CB-S-05 入力へ。

#### 2026-05-02 起案 + 案件登録

- 秘書部門が PRJ-019 として案件登録
- 仮称「Clawbridge」を秘書側で提案（Claw + bridge、Open Claw と claude-code-company の架橋）
- 5 点ドキュメント整備:
  - `brief.md`（v1 起案）— 3 大キーワード（人間不在の完全自動化 / Codex サブスクで動く Open Claw / ハーネスエンジニアリング）強調
  - `decisions.md`（DEC-019-001）— Phase 0 起案、実装は別決裁
  - `progress.md`（本ファイル）— Phase 0 着手記録
  - `tasks.md` — リサーチ・PM・レビュー部門の Phase 0 タスク登録
  - `risks.md` — 当初リスク R-019-01〜R-019-05 起票
- `app/README.md` でハーネス基盤としての性質明記（アプリ実体は当面なし）
- `dashboard/active-projects.md` を PRJ-019 行追加 + 「次に採番する案件 ID: PRJ-020」に更新
- レポート: `projects/PRJ-019/reports/secretary-registration-summary.md`

---

## 次回更新タイミング

- リサーチ部門の Phase 0 調査着手・中間報告・完了時
- PM の要件整理完了時
- レビュー部門のセキュリティ評価完了時
- DEC-019-XXX（Phase 1 Go/NoGo）発行時

---

**v1 起案**: 2026-05-02 ／ **v2 更新**: 2026-05-02（Phase 0 完了 + Phase 1 Go） ／ **v3 更新**: 2026-05-02（オーナー W0 タスク 4 件完了 + DEC-019-009〜013 発行 + W0 タスク 7 件追加 + 進捗 15%→20%）／ **v4 更新**: 2026-05-04（DEC-019-014〜053 連続発行による W0-Week1 マルチ Round 並列発注成果着地、Round 1+2+3+4 = 25 件 / ~12,000 行 / 26 実装ファイル / 25 cross-ref 編集、Round 4 = Dev T2 HITL 11 種 gate templates 5 日前倒し完遂 + PM cross-ref 100% + Marketing tone 戦略 + Web-Ops portfolio 設計、DEC-019-052 一括採択 + DEC-019-053 `.env.example` 2-tier 再設計、Owner 5/4 当日中に **Vault 5 items × 9 fields 完全投入完遂** + Slack 3 channel **live smoke 全 200 OK / 1 attempt** = W0-Week2 着手前最大不確実性 (1Password CLI + Slack 3-channel + op run resolution 統合) **完全解消**、Owner 残動作 4→**1 件**に圧縮 (OP_SERVICE_ACCOUNT_TOKEN のみ)、確度: 5/22 mock 70% 化 92→**94%** / 5/26 Phase 1 着手 88→**90%** / 6/20 sign-off 79→**80%** / 6/27 朝公開 78→**79%**、進捗 20%→**45%**） ／ **v5 更新**: 2026-05-04 深夜（DEC-019-053 v15.2 補追 = Owner Personal plan 確定で Plan B + Plan A 連続適用、Plan B = GitHub Actions Secrets 7 fields 直接登録 (Owner 5/4 完遂、`GITHUB_` 予約語制約で 7 件目を `GH_PAT_READ_ONLY` に変更 + workflow YAML で env 名を橋渡し)、Plan A = PRJ-019 standalone repo `hironori-oi/prj019-claude-code-company` 切出し (commit `26325ab` 初期 push 356 files / 90,020 lines + commit `3693862` hotfix = pnpm workspace member 登録 + cache-dependency-path 修正)、**workflow openclaw-monitor 緑 ✓ 達成 = W0-Week1 RC-2 完全完了**、Owner 残動作 1→**0 件**消滅、確度ジャンプ: 5/22 mock 70% 化 94→**95%** (+1%) / 5/26 Phase 1 着手 90→**91%** (+1%) / 6/20 sign-off 80→**81%** (+1%) / 6/27 朝公開 79→**80%** (+1%)、進捗 45%→**50%**） ／ **v6 更新**: 2026-05-04 深夜終盤（Owner 採択「B 推奨で進めてください、スケジュールにかかわらず進められるところは進めていき、アプリを早めに完成させていきましょう」受領 → Round 5 3 部署並列発注 (Dev / Research / Marketing) 議決非依存範囲の前倒し実装、全部署完遂 = Dev 4 tasks 432 行 / 222 tests pass +14 new = `verify-zero-side-effect.sh` 173 行 + `wrapper.ts` factory pattern +55 行 + `wrapper-contract.test.ts` 95 行 8 cases + `workflow-yaml.test.ts` 106 行 6 cases ／ Research 308 行 / CEO 推奨 = 案 B (16h/日 + API cap $30→$100 + subscription $400 維持 = 月次総額 $500 cap、案 C 24/7+$300 は BAN 確率 60-80% で reject) ／ Marketing 738 行 = portfolio Section 1-3 narrative 409 行 + launch X thread 329 行 (B + C tone hard 貫徹、0 emojis、6/27 朝 09:00 JST 公開向け)、Round 5 commit `9bc1629` push to standalone repo main、確度ジャンプ: 5/22 mock 70% 化 95→**96%** (+1%) / 5/26 Phase 1 着手 91→**92%** (+1%) / 6/20 sign-off 81→**82%** (+1%) / 6/27 朝公開 80→**81%** (+1%)、進捗 50%→**55%**） ／ **v7 更新**: 2026-05-04 深夜終盤後段（Owner 採択「推奨通り案 4 で行きましょう」+ 5/8 議決 21 件 3 層分類提案受領 → Round 6 3 部署並列前倒し (Dev G-01/04/05/06/08 5 ハードガード Phase 1 W1 prefetch / Research 5/30 NG-3 議決準備 / Marketing portfolio Section 4-10 + tech vol 1) + CEO hotfix (DEC-019-053 v15.2 整合 = preflight `--scope=workflow` 追加で workflow 7 fields のみ検証、Supabase 2 fields W3 まで保留設計と整合) 完遂、全部署成果合算 = Dev 3,066 行 / 36 new tests pass (harness 79 + openclaw-runtime 24 + preflight-ci 15) + Research 388 行 + Marketing 1,084 行 = 計 4,538 行 / 19 files / 3 reports + 1 hotfix、Round 6 commit `93f3ba2` push to standalone repo main、確度ジャンプ: 5/22 mock 70% 化 96→**97%** (+1%) / 5/26 Phase 1 着手 92→**93%** (+1%) / 6/20 sign-off 82→**83%** (+1%) / 6/27 朝公開 81→**82%** (+1%)、進捗 55%→**60%**） ／ **v8 更新**: 2026-05-04 深夜終盤後段（Owner 採択「オプション 1 と案 7-D で行きましょう。どんどん進めていきましょう。5/8 の議決について、現時点で決定できるものはさらに進めていきたいです。アプリ完成に向けてどんどん進めていきましょう」受領 → **DEC-019-054 起票** = 5/8 検収議決 21 件中 16 件 (層 A 11 + 層 B 5) Owner 事前承認 (Option 1)、層 C 5 件 (議決-2/5/7/21/23) のみ live 議論残置、5/8 議事時間 90-110 分 → **35-45 分** に圧縮 (Owner 物理拘束 約 50% 削減) + **Round 7 案 7-D = 4 部署並列前倒し** 起動: ① Dev (案 7-A) = G-09/G-10/G-02/G-03'/G-07 prefetch (目標 19+ tests / ~3,000 行) ② Marketing (案 7-B) = technical-deep-dive vol 2-6 連載 5 記事 + portfolio metrics 差替計画書 ③ PM + 秘書 (案 7-C 1/2) = `pm-cross-ref-final-v8.md` + `pm-phase1-plan-v3.md` + `secretary-5-8-meeting-package-v9.md` (Option 1 圧縮版) + `secretary-w0-week1-meeting-minutes-template-v4.md` + dashboard update ④ Review (案 7-C 2/2) = `review-mandatory-controls-50-final.md` + `review-risk-register-v3-2.md` (議決-21 当日提示) + `review-ban-drill-3-readiness-v2.md` (議決-23 当日提示) + `review-mock-claude-70pct-sop-final.md` + `review-5-8-q-and-a-anticipation.md`、4 background agents 実行中 (Round 7 完遂時に v9 で正式数値更新)、確度ジャンプ予測: 5/22 mock 70% 化 97→**97-98%** / 5/26 Phase 1 着手 93→**94-95%** / 6/20 sign-off 83→**84-85%** / 6/27 朝公開 82→**83-84%**、進捗 60%→**62%**） ／ **v9 更新**: 2026-05-04 深夜 (Round 7 全 4 部署完遂着地)（Round 7 案 7-D = 4 background agents 全完遂、計 **35 ファイル / 6,500+ 行 staged in PRJ-019 standalone repo**: ① **Dev (案 7-A)** = G-09 HITL gate enforcer + 6 tests / G-10 audit log retention SHA-256 hash chain + 6 tests / G-02 spawn timeout SIGTERM→grace→SIGKILL→CB.forceOpen + 4 tests / G-03' process tree kill cross-platform + 3 tests / G-07 BAN drill harness 3 シナリオ + 3 tests = **22 新規 tests / 140/140 pass / regression 0** + 19 ファイル staged + `dev-w0-week2-round7-w1w2-prefetch.md` ② **Marketing (案 7-B)** = `marketing-technical-deep-dive-vol2.md` 356 行 (HITL 11 種) / `vol3.md` 345 行 ($430 cap math + G-04) / `vol4.md` 304 行 (BAN drill #1/#2/#3 一次資料 8 件) / `vol5.md` 375 行 (pnpm workspace + standalone repo 実戦記録) / `vol6.md` 330 行 (28x28 連載最終回) = 計 5 記事 / 1,710 行 + `marketing-portfolio-metrics-substitution-plan.md` 295 行 (27 placeholder 差替 SOP) ③ **PM + 秘書 (案 7-C 1/2)** = `pm-cross-ref-final-v8.md` 360 行 (41 件 cross-ref 0 抜け / 6 部署整合性 100%) / `pm-phase1-plan-v3.md` 400 行 (W1 SP 圧縮 12.5d) / `secretary-5-8-meeting-package-v9.md` 500 行 (議決 21 件 3 層分類 + DEC-019-054 起票根拠) / `secretary-w0-week1-meeting-minutes-template-v4.md` 470 行 + `dashboard/active-projects.md` 1 行更新 (parent repo) ④ **Review (案 7-C 2/2)** = `review-mandatory-controls-50-final.md` 501 行 / `review-risk-register-v3-2.md` 453 行 (議決-21 当日 v3.2 提示用) / `review-ban-drill-3-readiness-v2.md` 533 行 (議決-23 当日 SOP 提示用) / `review-mock-claude-70pct-sop-final.md` 482 行 / `review-5-8-q-and-a-anticipation.md` 492 行 = 計 **2,461 行** (要求 2,100 行 +17%)、Tier C 5 件 (議決-2/5/7/21/23) 採択推奨度 Lv4「極めて強く推奨」／ **副次効果**: (a) Round 5 + 6 + 7 連続前倒しで Phase 1 W1 W2 想定スコープの **>50% prefetch 達成**、(b) HITL gate enforcer + audit log SHA-256 + spawn timeout + process tree kill + BAN drill harness の 5 機構が「実装検証済」状態で W1 着手 5/19 を迎えられる、(c) Marketing technical-deep-dive 全 6 記事 dock 完了で 6/27 朝公開後 Phase 2 SEO momentum 維持基盤確立、(d) Review 5 reports で 5/8 検収議事の確実性更に高位化、(e) PM + 秘書 4 reports + dashboard で 5/8 当日進行 35-45 分の運営が完全準備完了 ／ 確度ジャンプ実績: 5/22 mock 70% 化 Pass 97→**98%** (+1%) / 5/26 Phase 1 着手 Conditional Go 93→**94%** (+1%) / 6/20 sign-off 83→**84%** (+1%) / 6/27 朝公開 82→**83%** (+1%) ／ Owner 残動作: **0 件継続** = 5/8 検収会議出席のみ (35-45 分) ／ 進捗 62%→**65%**）
