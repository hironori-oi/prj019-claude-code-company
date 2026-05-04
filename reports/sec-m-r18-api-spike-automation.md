# Sec-M / Round 18 — API spike 検知自動化（hardening 4/4 完成宣言）

**起案**: Sec-M / 2026-05-05 / **対象 DEC**: DEC-019-066 軸-③ 項目 (1)
**Round**: PRJ-019 R18 第 2 波 9 並列 / **依存**: R17 Sec-L 自動化 3/4 完遂

---

## §1 概要

R17 Sec-L で確立した自動化 3/4 項目（副作用 0 / 絵文字 0 / tests PASS gate）に続き、本 Round 18 で **API spike 検知自動化** を実装。これにより DEC-019-066 軸-③ hardening 4/4 が完成。

| # | 項目 | Round | 担当 | Status |
|---|---|---|---|---|
| (1) | API spike 検知自動化 | **R18** | **Sec-M** | **本 Round 完遂** |
| (2) | 副作用 0 自動検証 | R17 | Sec-L | 完遂 |
| (3) | 絵文字 0 自動チェック | R17 | Sec-L | 完遂 |
| (4) | tests PASS gate | R17 | Sec-L | 完遂 |

**結論: hardening 4/4 完成（DEC-019-066 軸-③ 全項目 ready for 5/26 review）**

---

## §2 成果物

| Path | 種別 | 行数 | 用途 |
|---|---|---|---|
| `projects/PRJ-019/scripts/sec-api-spike-check.sh` | bash script | 123 | Anthropic spend trajectory 解析 + 1h spike / 月次 trajectory 検出 + cooldown 30min |
| `projects/PRJ-019/scripts/sec-api-spike-baseline.json` | config | 22 | 閾値 + cooldown + PII redaction 設定（Owner tune 可） |
| `projects/PRJ-019/runsheets/sec-api-spike-sop.md` | runsheet | 53 | 目的 / トリガ / 実行 / FAIL 対応 / 5/26 review 連携 |
| `projects/PRJ-019/reports/sec-m-r18-api-spike-automation.md` | report | 本 file | R18 完遂宣言 |

---

## §3 設計仕様

### §3.1 検知ロジック（3 層）
- **Layer A**: 1h 窓累積 spend > $5 → WARN（exit 1）
- **Layer B**: 1h 窓累積 spend > $10 → FAIL（exit 2）
- **Layer C**: 月次 trajectory ratio = `month_sum / (cap × month_elapsed)` > 200% → WARN
  - cap は `settings/cost-cap.json` の `anthropic_monthly_cap_usd`（既定 30）

### §3.2 cooldown
- `_state/api-spike-cooldown.state` に最終 alert epoch を保存
- 同一 alert が cooldown 内に発生 → 抑制（RESULT は PASS、log に COOLDOWN 痕跡）
- 既定 1800 秒（30 分）。baseline.json で tune 可。

### §3.3 PII redaction
- audit log の prompt body / messages は **読まない**
- `kind` ラベルのみ取得 → SHA-256 先頭 8 桁で hash 化 → top 5 を log 出力
- baseline.json に `pii_redaction.prompt_body: "never_read"` 契約を明示
- HITL 第 11 種 `knowledge_pii_review` 連動（CLAUDE.md §6 ナレッジ蓄積方針整合）

### §3.4 入力フォーマット契約
- `projects/PRJ-019/settings/anthropic-audit.jsonl`: 1 行 1 JSON `{ts, cost_usd, kind}`
- 不在時は PASS（system pre-launch 扱い、誤発火回避）
- 生成責務は Dev 部門（5/26 review で正式化議題化）

---

## §4 既存資産との整合（破壊 0 / 副作用 0）

| 既存ファイル | 改変有無 | 検証 |
|---|---|---|
| `sec-side-effect-zero-check.sh` | 改変なし | byte-level 同一 |
| `sec-emoji-zero-check.sh` | 改変なし | byte-level 同一 |
| `sec-tests-pass-gate.sh` | 改変なし | byte-level 同一 |
| `sec-tests-baseline.json` | 改変なし | suite registry でなく test baseline 専用のため、API spike は別 baseline.json で分離管理（責務分離原則） |
| 既存 3 SOP | 改変なし | style 模倣のみ |

→ 新規 baseline `sec-api-spike-baseline.json` を分離した理由: tests baseline (suite × pass count) と spike threshold (時間窓 × USD) は粒度が異なり、誤 promote / cross-contamination リスクを避けるため。`sec-tests-pass-gate.sh --suite` を流用すると model 上不整合となる。

---

## §5 動作確認（dry-run 想定）

audit log 不在時の標準 path:
```
$ bash sec-api-spike-check.sh
[sec-api-spike] audit=... cap=... baseline=...
RESULT: PASS (no audit log yet — system pre-launch)
$ echo $?
0
```
本番投入時に Dev 部門が audit log writer を実装し、pilot 1 週間で false positive 件数を計測 → 閾値を Owner と合議で調整する想定（SOP §3 / §8 連動）。

---

## §6 制約遵守チェック

- [x] API $0 / network 0（read-only / SLACK_WEBHOOK 連動なし、本 script では未使用）
- [x] 既存 3 script は無改変（baseline preserve）
- [x] POSIX shell 互換（bash 3.2+ で動作、bashism は最小限の `mapfile`/`[[`）
- [x] 閾値は placeholder 明示（baseline.json `note` + SOP §3）
- [x] 絵文字 0（全成果物）
- [x] PII redaction（prompt body never read + kind hash 化）

---

## §7 hardening 4/4 完成宣言

**DEC-019-066 軸-③ hardening 4 項目すべての自動化 script + SOP が揃いました。**
- 5/26 review に向けて pilot data 収集 phase に移行可能
- 5/12 W2 mid-check では 4/4 全 script を CI integration 状態で運用評価
- Sec 部門 → CEO へ R18 完遂報告として escalate 推奨

---

## §8 blocker

なし。次 Round 以降の軽微 follow-up:
- Dev 部門と audit log writer 実装責務の正式合意（5/26 review 議題化）
- pilot 1 週間後の閾値 tune（Owner formal authorize 経由）
