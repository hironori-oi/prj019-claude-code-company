# PRJ-019 オーナー残タスク（2026-05-03 時点）

**作成日**: 2026-05-03 ／ **作成**: 秘書部門 ／ **対象**: オーナー本人 ／ **前版**: `owner-pending-tasks-2026-05-02.md`（保存、上書き不可）

---

## 概要

W0-Week1（2026-05-02〜05-08）連結報告完了に伴い、オーナー残タスクを **5 件** に再整理しました。
2026-05-02 版に対し以下の差分があります：

- 旧 3 件（CB-O-05 Doppler / Anthropic Spend Cap / OpenAI Spend Cap）に **2 件追加**: claude-bridge live integration test 立会（5/9）/ Spend Cap screenshot 提出（5/18）
- W0-Week1 で完了した過去オーナータスク 5 件（CB-O-01〜04 + GO-06）は **完了マーク** で本書末尾に保存

---

## 1. 完了済オーナータスク（W0-Week1 着地）

| ID | タスク | 完了日 | 関連 DEC |
|---|---|---|---|
| **CB-O-01** | OpenAI Service Terms オーナー直接確認（自動化エージェント条項全文確認 → 「条件付き許容」確定）| 2026-05-02 | DEC-019-010 |
| **CB-O-02** | Anthropic Max $200 契約確認（既 Max $200 アップグレード済 + オプション A 採用）| 2026-05-02 | DEC-019-011 |
| **CB-O-03** | ChatGPT Pro $200（Codex 5x、$100 想定撤回）契約確認 | 2026-05-02 | DEC-019-009 |
| **CB-O-04** | Vercel Sandbox 利用設定（Hobby 無料枠で開始、claude-code-company 既存アカウントで sandbox API 有効化）| 2026-05-02 | DEC-019-007 |
| **GO-06** | 月次予算 $300 承認（Phase 1 で追加発生する月額の上限として再定義）| 2026-05-02 | DEC-019-009 / 012 |

**5 件すべて完了** → DEC-019-009〜013 発行済 → W0-Week1 検収（5/8）で再確認は不要。

---

## 2. 残タスク（5 件、合計所要時間 約 90 分）

### 期限順並び

| # | タスク | 期限 | 所要時間 | 重要度 | 関連 DEC | 完了後 Review 提出先 |
|---|---|---|---|---|---|---|
| 1 | **claude-bridge live integration test 立会**（OAuth セッション提供、$0.10 上限） | **2026-05-09（金）** | 30〜60 分 | **最優先**（W0-Week2 開始日） | DEC-019-007 | Dev: `dev-w0-week2-live-test-report.md` |
| 2 | **CB-O-05 Doppler / 1Password Vault 4 系統登録** | **2026-05-15（木）** | 30 分 | **CEO 推奨**（C-A-05 OAuth 隔離の基盤） | DEC-019-013 / C-A-05 | Dev: `reports/owner-cb-o-05-doppler-setup.md`（オーナー記述）|
| 3 | **Anthropic Spend Cap 設定**（Hard $50 / Soft $40 / Per-request $0.50） | **2026-05-18（日）**（前倒し可、5/15 推奨）| 5 分 | **必須**（W1 着手前） | DEC-019-012 | `reports/owner-spend-cap-screenshots-2026-05-XX.md` |
| 4 | **OpenAI Spend Cap 設定**（Hard $20）| **2026-05-18（日）**（前倒し可、5/15 推奨）| 5 分 | **必須**（W1 着手前） | DEC-019-012 | `reports/owner-spend-cap-screenshots-2026-05-XX.md` |
| 5 | **Spend Cap screenshot 2 件提出**（上記 #3 + #4 完了後）| **2026-05-18（日）** | 5 分 | **必須**（W0 完了判定の物理エビデンス）| DEC-019-007 / 012 | `reports/owner-spend-cap-screenshots-2026-05-XX.md` |

---

## 3. 各タスクの詳細手順

### #1. claude-bridge live integration test 立会（5/9 期限、30〜60 分）

**目的**: Open Claw が公式 Claude Code CLI に subprocess spawn する経路（DEC-019-006 P-D 改）を **実機 OAuth で 1 ターンだけ** 完走させ、stream-json schema を実証して test fixture 化する。

**手順**:

1. Dev から事前連絡を受ける（5/8 18:00 検収会議後 〜 5/9 朝にスケジュール調整）
2. **オーナー本人の Claude Max OAuth セッションがログイン状態であることを確認**（`claude --version` および `claude /usage` がエラーなく動作）
3. Dev が用意した test fixture スクリプト（`packages/claude-bridge/test-fixtures/live-test-001.sh`）を立会のもと実行
4. cost-tracker が **$0.10 上限到達前に kill** することを確認（誤って超過した場合は即時 Ctrl+C）
5. stream-json 出力ログを Dev が `dev-w0-week2-live-test-report.md` に記録、オーナーは結果を承認
6. **OAuth セッション情報は Dev に渡さない**（DEC-019-006 NG-1 完全回避、stat() 経由のみ確認）

**参考 URL**: 
- Anthropic Claude Code CLI: https://docs.claude.com/en/docs/claude-code/cli-reference
- Claude Max plan usage: https://claude.com/pricing
- DEC-019-006 全文: `projects/PRJ-019/decisions.md` 行 7

**ブロッカー判定**: 5/9 当日にオーナー不在 → 5/10〜11 への再スケジュール（最遅 5/12 まで）。それ以降にずれると BAN drill #1（5/13）の前提が崩れる。

---

### #2. CB-O-05 Doppler / 1Password Vault 4 系統登録（5/15 期限、30 分）

**目的**: secret 管理基盤を構築し、Open Claw が claude.ai の OAuth トークンに到達できない物理経路を確立する（C-A-05、DEC-019-013）。

**手順（Doppler 経路、推奨）**:

1. [Doppler 公式サイト](https://www.doppler.com/) にアクセス、Free プラン（Developer / 5 projects まで）でサインアップ
2. Project 作成: `clawbridge`
3. Environment 作成: `master / dev / notify / public`（4 系統）
4. オーナー workspace token を 1Password の **マスターアカウント** に保存（PRJ-019 専用 1Password Vault `Clawbridge-Master` を新設）
5. Dev に「Doppler workspace token は 1Password `Clawbridge-Master` 内に格納済」と連絡（トークン本体は Dev に渡さない、Dev は `op run` 経由で間接アクセス）
6. 完了後 `reports/owner-cb-o-05-doppler-setup.md` を 1〜2 行で記述（Doppler / 1Password 設定完了 + token 格納場所のヒント、トークン本体は記載しない）

**手順（1Password 経路のみ、簡易版）**:

1. 1Password で Vault 4 系統を新設: `Clawbridge-Master` / `Clawbridge-Dev` / `Clawbridge-Notify` / `Clawbridge-Public`
2. 既存 claude.ai OAuth トークンを `Clawbridge-Master` に隔離格納
3. Dev には `Clawbridge-Dev` のみ参照権限を付与
4. 完了後 Vault 構成図を `owner-cb-o-05-doppler-setup.md` に貼付（screenshot 1 枚で OK）

**参考 URL**:
- Doppler 公式: https://www.doppler.com/
- 1Password CLI: https://developer.1password.com/docs/cli/

**ブロッカー判定**: 5/15 までに未完了 → C-A-05 物理的に着手不可、5/17 BAN drill #2 の Sumi/Asagi 同居検証に支障、Phase 1 W1 着手延期リスクあり

---

### #3. Anthropic Spend Cap 設定（5/18 期限、5 分。5/15 までの前倒し推奨）

**目的**: P-E（API キー従量）フォールバック発動時の物理歯止め。誤発動時の被害を $50 で停止。

**手順**:

1. [Anthropic Console](https://console.anthropic.com/) にログイン
2. Settings → Billing → Spend limits を開く
3. **Hard limit**: $50/month を設定（超過で全 API キー停止）
4. **Soft limit**: $40/month（80%）でメール警告
5. **Per-request limit**: $0.50（1 リクエストあたり）
6. 設定完了 screenshot を取得（次タスク #5 で提出）

**参考 URL**: https://console.anthropic.com/settings/billing

**ブロッカー判定**: 5/18 18:00 W0 完了判定会議までに未設定 → DEC-019-019（Phase 1 W1 公式キックオフ承認）が NoGo、Phase 1 着手 5/19 が物理スライド

---

### #4. OpenAI Spend Cap 設定（5/18 期限、5 分。5/15 までの前倒し推奨）

**目的**: ChatGPT Pro $200 サブスクとは別経路の API バッファ枠（gpt-4 等の周辺呼び出し）への保険。

**手順**:

1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. Settings → Limits を開く
3. **Hard limit**: $20/month（超過で全 API キー停止）
4. **Soft limit**: $16/month（80%）でメール警告
5. ChatGPT Pro サブスクとは別経路のため、本 Cap は API 利用にのみ作用
6. 設定完了 screenshot を取得（次タスク #5 で提出）

**参考 URL**: https://platform.openai.com/settings/organization/limits

**ブロッカー判定**: 同上（#3 と同一）

---

### #5. Spend Cap screenshot 2 件提出（5/18 期限、5 分）

**目的**: W0 完了判定会議（5/18 18:00）の物理エビデンス。

**手順**:

1. タスク #3 / #4 完了後、screenshot 2 枚（Anthropic + OpenAI）を `projects/PRJ-019/reports/owner-spend-cap-screenshots-2026-05-XX.md` に貼付
2. 各 screenshot に「設定完了日時」と「設定値」を 1 行ずつコメント
3. CEO へ「W0 完了判定会議用エビデンス提出済」とメール 1 通

**ファイル名規約**: `owner-spend-cap-screenshots-2026-05-15.md`（5/15 提出時）または `owner-spend-cap-screenshots-2026-05-18.md`（最終期限提出時）

**ブロッカー判定**: 5/18 18:00 までに未提出 → W0 完了判定が「条件付き Go」止まり、Phase 1 W1 着手は **物理エビデンス揃い次第** にスライド

---

## 4. エスカレーション

期限超過の見込みが立った時点で、オーナーから CEO に連絡 → CEO が秘書経由で W1 着手延期を発令します。
個別タスクの代理完遂は **タスク #1（OAuth 立会）以外は可** ですが、いずれも CEO 経由で秘書部門に依頼してください（直接 Dev / Review に依頼しない）。

---

## 5. 関連参考資料

- W0-Week1 連結報告（前提背景）: `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md`
- W0-Week2 タスク台帳（全 5 主体タスク）: `projects/PRJ-019/reports/secretary-w0-week2-task-ledger.md`
- PRJ-018 並走対照表: `projects/PRJ-019/reports/secretary-prj018-prj019-coordination-2026-05-03.md`
- 前回オーナータスクメモ: `projects/PRJ-019/reports/owner-pending-tasks-2026-05-02.md`（保存、上書きなし）

---

**作成**: 2026-05-03 秘書部門 ／ **次回更新**: 各タスク完了報告時 / 5/18 W0 完了判定会議直前
