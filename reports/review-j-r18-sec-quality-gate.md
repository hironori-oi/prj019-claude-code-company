# Review-J 統合報告 — Round 18 第 1 波 / Sec hardening 4/4 review + Round 18 quality gate prep

**作成**: 2026-05-05（Round 18 第 1 波） / **担当**: Review-J / **対象**: Sec-L Round 17 成果物 8 件 + Round 18 Sec-M 受入基準
**先行**: `sec-l-r17-hardening-automation.md` / DEC-019-066 §3.1〜§3.4 / Round 17 完遂着地（commit 3464445）
**判定軸**: `organization/roles/review.md` 重要度 (Critical / Major / Minor) と判定基準（承認 / 条件付き承認 / 差し戻し）

---

## §1 Sec hardening 4/4 review checklist（Sec-L 既納 3 項目）

### §1.1 副作用 0 自動検証（DEC-019-066 §3.2）— 判定: 条件付き承認

| # | 観点 | 評価 | 重要度 | 摘要 / Remediation |
|---|---|---|---|---|
| 1 | 検出 4 カテゴリ網羅性 | pass | — | (a) test DEL/REN / (b) schema / (c) lock / (d) secret を正規表現で網羅、PRJ-019 想定脅威モデルに合致 |
| 2 | git plumbing のみ採用 / API $0 | pass | — | `git diff --name-status` のみ、外部 API call 0 を確認 |
| 3 | exit code / log 仕様 | pass | — | `set -euo pipefail` + `REPORT_DIR` 上書き対応、CI artifact 連携可 |
| 4 | BASE_REF 既定値 `HEAD~1` | conditional pass | Major | Round 完遂が複数 commit を含む場合は `HEAD~1` では取りこぼし。SOP §2-1 で `BASE_REF` 明示指定を必須化 / CI で `pull_request.base.sha` 利用を default 化 |
| 5 | `SEC_OVERRIDE` の audit | conditional pass | Major | 現状 script 上では override 機構を読み取っていない（SOP §4 に override-log 追記運用のみ）。次 Round で script 内に `[[ -n SEC_OVERRIDE ]]` 明示 branch + override log 必須化を推奨 |
| 6 | (b) schema 検出の glob | pass (minor 改善余地) | Minor | `drizzle\.config\.` の末尾 `.` でファイル種を限定していない（`.ts`/`.js` 想定）。誤検出リスク低だが将来 `\.(ts|js|json)$` 化を 5/26 review で検討 |

**総合**: Critical 0 件 / Major 2 件（修正後再レビュー不要レベル）→ 条件付き承認。

### §1.2 絵文字 0 自動チェック（DEC-019-066 §3.3）— 判定: 承認

| # | 観点 | 評価 | 重要度 | 摘要 |
|---|---|---|---|---|
| 1 | 6 block 統合 perl regex 妥当性 | pass | — | 1F300-1FAFF / 2600-27BF / 1F900-1F9FF / 2300-23FF / FE0F / 1F1E6-1F1FF。CLAUDE.md 既定方針を Unicode block レベルで網羅 |
| 2 | false positive 0 pilot 結果 | pass | — | Sec-L 報告 §2.2 + SOP §4 に Round 16/17 全 artifact pilot で偽陽性 0 を確認 |
| 3 | IGNORE_PATTERNS 設計 | pass | — | `decisions.md` / `_archive/` を read-only zone として除外、既存 DEC 痕跡保護と現行新規 artifact 厳格化を両立 |
| 4 | 多言語擬似絵文字 35 ペア統合 | pass (要確認 1 点) | Minor | 報告書 §2.2 で「block 範囲に統合」と記載、script 内の単一 regex に圧縮済。明示的な 35 ペア辞書配列が見当たらない点は SOP §3 の説明で十分賄えるが、5/26 review で「block 統合で 35 ペア相当をカバーする論証」を formal 化推奨 |
| 5 | クロス OS 動作（Win Git Bash） | pass | — | `perl -CSD -ne` で UTF-8 strict / multiline 対応、Win 環境（本 owner 環境）含め共通動作 |

**総合**: Critical 0 / Major 0 / Minor 1 → 承認。

### §1.3 tests PASS gate（DEC-019-066 §3.4）— 判定: 条件付き承認

| # | 観点 | 評価 | 重要度 | 摘要 / Remediation |
|---|---|---|---|---|
| 1 | baseline.json 集中管理設計 | pass | — | 3 suite (harness 617 / workspace 1,503 / openclaw-runtime 330) が JSON 1 ファイルに集約、updated_at + round + note メタを保持 |
| 2 | `--promote` 安全装置 | pass | — | `pass < baseline` で promote 拒否（exit 5）、誤昇格防止に有効 |
| 3 | jq 依存回避 / node 1 行 | pass | — | 外部依存 0、CI 環境制約に強い。Win Git Bash でも node 既存利用で動作 |
| 4 | Slack alert の冪等性 | conditional pass | Major | `curl -fsS \|\| true` で network 失敗を握りつぶす設計。alert 不達を log に記録する hook が無いため、5/12 CI integration 時に `echo "SLACK: send_failed"` を REPORT_FILE に追記する Remediation を推奨 |
| 5 | 連続 2 round 再現性ガード | conditional pass | Major | SOP §3-2 では「連続 2 round 同値以上」を CEO 判定責任としているが、script は単発 promote を許可。将来 `--promote` を `--require-streak <N>` 等で強制する余地。次 Round 緊急性低、5/26 review で提起 |
| 6 | suite 名 enum 検証 | pass | — | unknown suite で exit 4、type-safe |

**総合**: Critical 0 / Major 2 → 条件付き承認。

### §1.4 横断観点（3 script 共通）— 判定: 承認

- artifact 副作用 0（新規追加 8 件のみ、既存 file 改変 0）を Sec-L §4 + git status 突合で確認
- `set -euo pipefail` 統一、fail-fast 一貫性 OK
- `REPORT_DIR` 共通環境変数化により CI artifact 集約が容易
- 全 script が API $0 / network 0 既定（Slack のみ env で opt-in）の Sec 部門 hardening 方針と整合

---

## §2 API spike 検知自動化 review checklist（Round 18 Sec-M 受入基準）

DEC-019-066 §3.1 + Sec-L §5 引継方針 + Owner subscription 主軸 (DEC-019-051) を踏まえ、Sec-M 完遂時に Review 部門が確認する受入基準を以下に定義する。

| # | 受入観点 | 合格基準 | 想定 evidence | 判定方法 |
|---|---|---|---|---|
| 1 | trigger threshold 算出ロジック | 過去 3 round 移動平均 + 2σ を node script で計算、計算式が SOP に文書化 | `sec-api-spike-baseline.json` + 算出 unit test または計算例 3 round 分 | 報告書 §x で計算手順 trace、proxy metric (call 数 / duration) の根拠記載 |
| 2 | cooldown / 自動停止 flag | spike 検出時に 5 分自動停止 flag set、CEO ack (`SEC_SPIKE_ACK=1`) で解除、解除後は T+0 再計測 | flag file path + ack 環境変数仕様 + 解除ログ | SOP §x に flag lifecycle 図示、誤連発防止のため最低 cooldown が定数化されていること |
| 3 | PII redaction | round-metrics-*.json に部署名 / tool 名 / 集計値のみ含み、prompt 本文 / file path 個人特定子 / API key を含まない | sample metrics JSON 1 件 + redaction テスト | 出力 sample で禁止項目 0 件確認、CLAUDE.md §6「PII 保護」整合 |
| 4 | SOP 文書 presence | `runsheets/sec-api-spike-detect-sop.md` 新規作成、§1 適用範囲 / §2 実行手順 / §3 alert 連携 / §4 解除手順 / §5 5/26 review 連携 を含む | runsheet 1 件 ≥ 30 行 | 既存 3 SOP と構造一致、CI integration 例 (GH Actions yaml) 記載 |
| 5 | 既存 gate との連携 | Slack webhook を `sec-tests-pass-gate.sh` と同じ `SLACK_WEBHOOK_URL` で共有、未設定時 skip | 環境変数仕様一致 | Sec-L §5.2-3 の「同 Slack webhook で alert」要件と整合 |
| 6 | 副作用 0 / API $0 | 新規追加のみ、既存 file 改変 0、外部 API call 0（自走 self-meter のみ） | git status 差分 + script 静的解析 | §1.1 sec-side-effect-zero-check.sh 自走で PASS 確認 |
| 7 | 計測 layer の冪等性 | round-metrics 記録は overwrite ではなく append、round 重複時は最新採用ルールを SOP 明記 | metrics JSON 仕様 §1 | round 識別子 (`R18` 等) の primary key 設計確認 |
| 8 | dashboard/api-budget-v2.md 連携 | round 別 schema を再利用、二重管理回避 | dashboard 既存 schema 参照 link | Sec-K Round 17 第 1 波で確認済 schema を踏襲 |

**Sec-M に対する事前指摘（pre-review feedback）**:
- proxy metric 採用根拠（subscription plan 下で実コスト 0、call 数 / duration が代替）を SOP §1 か報告書 §1 に明記すること
- 2σ 採用の統計的妥当性（過去 3 round の sample size = 3 で 2σ 推定値の信頼区間が広い点）を limitation として記述、5/26 review で sample size 拡張可否を検討項目に含めること
- alert false positive 抑制のため、初期運用は `WARN-only` mode（停止 flag set しない）を 1 round 試走する選択肢を提案

---

## §3 DEC-019-067 議決 readiness 判定

**判定**: **Y（議決可）** — ただし以下 2 条件付き。

**理由**:
1. Sec hardening 4 項目のうち 3 項目（§3.2 / §3.3 / §3.4）は本 Review-J で Critical 0 件を確認済、§3.3 は無条件承認、§3.2 / §3.4 は条件付き承認（修正後再レビュー不要レベル Major のみ）
2. 残 §3.1（API spike 検知）は Round 18 Sec-M で本実装、本 Review §2 の 8 受入基準で評価可能、5/26 formal review までに 4 項目同時集計 path が確立している
3. baseline 数値（harness 617 / workspace 1,503 / openclaw-runtime 330）が JSON 集中管理化され、Round 18 以降の regression 検出 evidence が機械生成可能

**議決可条件**:
- (条件 A) DEC-019-067 本文に「§3.2 BASE_REF 明示指定 / §3.4 Slack 不達 log 化」の 2 件 Major 改善を 5/26 formal review 期限までに反映する旨を明記
- (条件 B) Sec-M Round 18 完遂時に本 Review §2 の 8 基準を Review-K 等が再確認する dispatch を併設

---

## §4 横断 findings（balanced）

**Positive**:
- (P1) Sec-L 8 artifact が「副作用 0 / API $0 / 絵文字 0 / tests 影響 0」自走 PASS を満たす self-consistency を達成
- (P2) DEC-019-066 4 項目接続マトリクス（Sec-L §3）が Sec-J 既存 → Sec-L 拡張 → Sec-M 引継の状態遷移を可視化、5/26 review 集計が機械化可能
- (P3) baseline.json 一元管理により、従来散在していた 3 suite の baseline 突合が CI で 1 step に集約

**Concerns**:
- (C1) sec-side-effect-zero-check.sh の `SEC_OVERRIDE` が SOP のみで定義され script 上の audit がない（§1.1 #5 / Major）
- (C2) Slack alert 失敗の sink が `\|\| true` で無音化（§1.3 #4 / Major）
- (C3) 35 ペア多言語フィルタが block 範囲統合に圧縮された結果、辞書側の formal 化（5/26 review）が必要（§1.2 #4 / Minor）
- (C4) sample size 3 round での 2σ 推定（Sec-M 引継分）の統計的限界に関する事前共有が未着手（§2 提案として記述）

---

## §5 行動推奨（CEO / Sec / Review）

1. **CEO**: Round 18 第 1 波で本書を集計に組込、DEC-019-067 議決を §3 条件 A/B 付きで提案
2. **Sec-M**: Round 18 第 1 波で API spike 検知 script + SOP 着手、§2 受入基準 8 件を最初から満たす設計
3. **Sec（次 Round 任意）**: §1.1 / §1.3 の Major 2 件を 5/12 CI integration 内で同時修正
4. **Review-K（Round 18 第 2 波想定）**: Sec-M 完遂時に §2 基準で受入再確認、本 Review-J 報告との突合 diff を CEO 報告

---

**報告書行数**: 約 155 行（< 200 行制約内） / **API 消費**: $0（Read + Write のみ） / **副作用**: 0 / **絵文字**: 0 / **production file 改変**: 0
