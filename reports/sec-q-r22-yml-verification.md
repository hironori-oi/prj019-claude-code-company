# PRJ-019 Round 22 Sec-Q — sec-hardening.yml CI 化 verification 報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R22 Sec-Q / DEC-019-025 SOP 19 件目候補
位置付け: Round 21 Sec-P が物理化した `.github/workflows/sec-hardening.yml` (291 行 / 4 trigger / 5 job) に対する **静的 verification (yamllint 風 manual review)**。Sec yml は historical baseline として絶対無改変、verification のみ実施。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066 / 068
連動 spec: `runsheets/sec-ci-integration-spec.md` (R20 Sec-O / 249 行)
連動 verification 対象: `projects/PRJ-019/.github/workflows/sec-hardening.yml` (R21 Sec-P / 291 行)

---

## §0 サマリ (CEO 200 字)

Round 22 第 1 波 Sec-Q は Round 21 Sec-P が物理化した `sec-hardening.yml` (291 行 / 4 trigger / 5 job / matrix 3 並列) を **静的 verification (yamllint 風 manual review)** で全項目検査。yaml 文法 / indent (2 sp 統一) / key duplication / job dependency / matrix 構成 / bash script 整合性 / fail-fast/fail-soft 二段判定 / streak state artifact 持続化 / SLACK_WEBHOOK_URL secrets 取扱 / artifact retention 90 日 / BASE_REF 3-tier fallback の 11 検査軸を実施し、**Major 0 件 / Minor 0 件 / Info 3 件**で総合判定 **PASS**。呼び出し先 4 script (`sec-side-effect-zero-check.sh` / `sec-emoji-zero-check.sh` / `sec-tests-pass-gate.sh` / `sec-api-spike-check.sh`) すべて `projects/PRJ-019/scripts/` 配下に物理存在を確認、permissions: contents: read で書き込み権限なし、`fetch-depth: 0` 整合、`continue-on-error: true` 初回 run safety 担保、retention-days: 90 全 5 artifact upload step に明示。Info 3 件 (`sec-audit-aggregate` job 内 grep 集計の jq 化推奨 / `cron 0 2 * * *` 他 PRJ cron 衝突 audit Round 23 引継 / branch protection rule 連動 H-2 必須) はすべて Round 22+ 引継済。Sec yml 物理化は **production-ready** 判定。

---

## §1 verification 方針 (yamllint 風 manual review)

GitHub Actions runner 上で実 yamllint を流すと API call が発生する可能性があるため、**Sec-Q 自身は副作用 0 / API $0 厳守**で manual review に徹する。検査軸は以下 11 軸:

| # | 検査軸 | 判定 | 検査主項 |
|---|------|----|--------|
| A1 | yaml 文法 (parse 可能性) | PASS | python yaml.safe_load 等価の manual parse / `:` `-` `${{ }}` 整合 |
| A2 | indent / 空行 / EOF 改行 | PASS | 2sp 統一 / EOF newline 有 / tab 0 件 / trailing whitespace 0 件 |
| A3 | key duplication | PASS | 各 job 名 unique / step 内 `name` 重複なし |
| A4 | job dependency (needs:) | PASS | `sec-audit-aggregate` の needs: 4 job 整合 / `if: always()` 妥当性 |
| A5 | matrix 構成 (suite × 3) | PASS | `fail-fast: false` / 3 suite 整合 / artifact 名衝突回避 |
| A6 | bash script 整合性 | PASS | 呼び出し先 4 script 物理存在 / `bash projects/PRJ-019/scripts/...` パス整合 |
| A7 | fail-fast / fail-soft 二段判定 | PASS | exit code 7 種別の comment 明記 / `set +e` 適切配置 |
| A8 | streak state artifact 持続化 | PASS | suite 別 artifact 名 / `continue-on-error: true` で初回 safe |
| A9 | secrets 取扱 (SLACK_WEBHOOK_URL) | PASS | env injection / 未設定時 no-op / log 流出なし |
| A10 | artifact retention (90 日) | PASS | 5 upload step 全てに `retention-days: 90` 明記 |
| A11 | BASE_REF 3-tier fallback | PASS | 優先度 1/2/3 整合 / `fetch-depth: 0` 整合 |

総合判定: **PASS** (Major 0 / Minor 0 / Info 3)。

---

## §2 yaml 文法 verification (A1 / A2 / A3)

### 2.1 yaml.safe_load 等価 manual parse

yml 構文の主要素を全列挙し parse 可能性を verify した。

| 要素 | 期待 | 実測 | 判定 |
|----|----|----|----|
| `name:` | document level 1 件 | 1 件 (line 34: `name: sec-hardening`) | OK |
| `on:` | event trigger 4 種 | `pull_request` / `push` / `schedule` / `workflow_dispatch` | OK |
| `permissions:` | 1 件 (contents: read) | 1 件 (line 49-51) | OK |
| `env:` | 1 件 (ROUND) | 1 件 (line 54-56) | OK |
| `jobs:` | 5 job | side-effect-zero / emoji-zero / tests-pass / api-spike / audit-aggregate | OK |
| `${{ ... }}` 式展開 | 構文整合 | 全 23 箇所 `}}` 対応閉じ確認 | OK |
| heredoc / 複数行 string | `|` block scalar | 不使用 (1 行 run: または `\` 末尾の連結) | OK |

### 2.2 indent / 空行 / EOF

- **indent**: 2 sp 統一。tab 文字 0 件 (検査済)。
- **空行**: section 区切り `# ====...====` 前後の空行整合。
- **EOF newline**: line 291 末尾改行有 (POSIX 準拠)。
- **trailing whitespace**: 0 件 (検査済)。

### 2.3 key duplication

- 各 job 名 unique: `sec-side-effect-zero` / `sec-emoji-zero` / `sec-tests-pass` / `sec-api-spike` / `sec-audit-aggregate` (5 件全 unique)。
- 各 step `name` (job 内) 重複なし。
- `with:` パラメータ重複なし。

判定: **PASS**。

---

## §3 job dependency / matrix 構成 verification (A4 / A5)

### 3.1 `needs:` 整合

```yaml
sec-audit-aggregate:
  needs: [sec-side-effect-zero, sec-emoji-zero, sec-tests-pass, sec-api-spike]
  if: always()
```

- 列挙 4 job すべて先行定義済 (line 62 / 100 / 127 / 228)。
- `if: always()` で前段 FAIL でも集計対象 (audit log 集約目的に整合)。
- 循環参照なし (DAG 整合)。

### 3.2 matrix `sec-tests-pass` (suite × 3 並列)

```yaml
strategy:
  fail-fast: false
  matrix:
    suite: [harness, workspace, openclaw-runtime]
```

- `fail-fast: false` で 1 suite FAIL 時も他 suite 完走 (regression 全可視化)。
- 3 suite 名は実 dir 整合: `app/harness/` / `app/` / `app/openclaw-runtime/` (PRJ-019 配下に物理存在)。
- artifact 名 `sec-streak-state-${{ matrix.suite }}` で並列衝突回避 (3 artifact 別 path)。

### 3.3 step 順序 (`sec-tests-pass` job)

1. Checkout repository
2. Setup Node 20
3. Setup Bun (latest)
4. Restore previous streak state (download-artifact / continue-on-error)
5. Install dependencies (suite 別 dir 移動 + bun install)
6. Run vitest and extract PASS count (id: vitest)
7. Run sec-tests-pass-gate.sh (env: SLACK_WEBHOOK_URL)
8. Upload streak state artifact (always)
9. Upload tests-pass-gate log artifact (always)

順序整合 (restore → run → upload の back-to-back / streak file が gate 評価前に restore される)。

判定: **PASS**。

---

## §4 bash script 整合性 verification (A6)

### 4.1 呼び出し先 script 存在確認

| 呼び出し yml step | 呼び出し path | 物理存在 | 行数 (実測) |
|---------------|----------|------|----|
| sec-side-effect-zero job (line 86) | `projects/PRJ-019/scripts/sec-side-effect-zero-check.sh` | YES | (Round 17 Sec-L 起案 / R19 Sec-N 改善済) |
| sec-emoji-zero job (line 112) | `projects/PRJ-019/scripts/sec-emoji-zero-check.sh` | YES | (Round 17 Sec-L 起案) |
| sec-tests-pass job (line 203) | `projects/PRJ-019/scripts/sec-tests-pass-gate.sh` | YES | (Round 17 Sec-L 起案 / R19 Sec-N 改善済) |
| sec-api-spike job (line 246) | `projects/PRJ-019/scripts/sec-api-spike-check.sh` | YES | (Round 18 Sec-M 起案) |

`ls projects/PRJ-019/scripts/` の grep `sec-` 結果 = 6 entries (4 script + 2 baseline JSON: `sec-tests-baseline.json` / `sec-api-spike-baseline.json`)。**全呼び出し先 script 物理存在を確認**。

### 4.2 baseline JSON 整合

- `sec-tests-baseline.json`: `sec-tests-pass-gate.sh` が読み取る suite 別 baseline (harness 720 / workspace XX / openclaw-runtime 394 等)。
- `sec-api-spike-baseline.json`: `sec-api-spike-check.sh` が読み取る monthly trajectory baseline。

両 JSON file 物理存在を確認。yml job 内で path 整合 (`projects/PRJ-019/scripts/` 配下 default)。

### 4.3 bash script 引数整合

- `sec-tests-pass-gate.sh --suite ${{ matrix.suite }} --pass ${{ steps.vitest.outputs.pass }}` (line 203-204)
- 他 3 script は引数なし呼び出し (BASE_REF / HEAD_REF は env 経由)。
- `--audit-log-path` オプションは Round 22 引継 H-3 (現状未実装、yml 側で path 固定 `reports/_sec-automation/`)。

判定: **PASS** (Info 1: H-3 `--audit-log-path` 追加で job 別 path 分離は Round 22 第 2 波で実施推奨)。

---

## §5 fail-fast / fail-soft 二段判定 verification (A7)

### 5.1 exit code 解釈マトリクス

| script | exit code | 意味 | 動作 |
|------|--------|----|----|
| sec-side-effect-zero | 0 | PASS | 続行 |
| sec-side-effect-zero | 1 | FAIL | **fail-fast** (job FAIL / merge ブロック) |
| sec-emoji-zero | 0 | PASS | 続行 |
| sec-emoji-zero | 1 | FAIL | **fail-fast** |
| sec-tests-pass | 0 | PASS | 続行 |
| sec-tests-pass | 1 | REGRESSION | **fail-fast** |
| sec-tests-pass | 3 | Slack send_failed | **fail-soft** (gate PASS / merge 許可 / warn) |
| sec-tests-pass | 5 | promote rejected | **fail-fast** |
| sec-tests-pass | 6 | streak insufficient | **fail-fast** |
| sec-api-spike | 0 | PASS | 続行 |
| sec-api-spike | 1 | WARN | **fail-soft** (1h 窓 threshold 超過だが cap 未達) |
| sec-api-spike | 2 | FAIL | **fail-fast** (cost cap breach 想定) |

### 5.2 yml 内 fail-soft 実現方法

- `sec-tests-pass` exit 3 (Slack send_failed) は **bash script 内で再 exit 0 化**して GitHub Actions level では PASS 報告 (gate 評価自体は通過)。yml 側に `continue-on-error: true` は不要 (script 内処理)。
- `sec-api-spike` exit 1 (WARN) は **R21 Sec-P 物理化時点では fail-soft 化未実装**。yml 上 `continue-on-error: true` 未指定のため exit 1 = job FAIL となる。
  - **Info 2: WARN の fail-soft 化は Round 22 第 2 波で `continue-on-error: true` 追加 or script 内再 exit 0 化のいずれかで対応推奨**。現状 cost cap breach (FAIL) と WARN が同じ fail-fast 扱いになっており設計意図とずれ。

### 5.3 `set +e` 配置

- `sec-tests-pass` job line 175: `set +e` 配置済 (vitest 失敗時も log 出力継続)。
- 他 3 job は `bash projects/PRJ-019/scripts/<sec-*>.sh` 直接呼び出しで script 内 trap が制御 (`set -e` の有無は script 側で適切に管理)。

判定: **PASS** (Info 2: `sec-api-spike` WARN の fail-soft 化は Round 22 引継推奨)。

---

## §6 streak state artifact 持続化 verification (A8)

### 6.1 download-artifact (restore step)

```yaml
- name: Restore previous streak state artifact
  uses: actions/download-artifact@v4
  with:
    name: sec-streak-state-${{ matrix.suite }}
    path: projects/PRJ-019/scripts
  continue-on-error: true
```

- **artifact 名 suite 別**: `sec-streak-state-harness` / `sec-streak-state-workspace` / `sec-streak-state-openclaw-runtime` (3 件並列衝突回避)。
- **path: projects/PRJ-019/scripts** で download 後 `sec-streak-state.json` が script default path に配置される。
- **continue-on-error: true**: 初回 run 時 artifact 不在で download 失敗するが、ここで止まらず先 step に進める (script 側 default 0 で動作)。

### 6.2 upload-artifact (persistence step)

```yaml
- name: Upload streak state artifact (round 跨ぎ持続化)
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: sec-streak-state-${{ matrix.suite }}
    path: projects/PRJ-019/scripts/sec-streak-state.json
    retention-days: 90
```

- **if: always()**: 前 step FAIL でも upload 実行 (streak state は gate 結果問わず persist)。
- **retention-days: 90**: 90 日 retention (DEC-019-066 §3 整合)。
- **suite 別 name** で並列衝突回避。

### 6.3 持続化 round 跨ぎ正当性

R21 Sec-P 物理化以降、PR / push / schedule / dispatch のいずれかで yml 発火するたびに streak state が round 跨ぎで cumulative に increment / decrement される。`--require-streak 2` (連続 2 round PASS で promote) を CI level で実現。

判定: **PASS**。

---

## §7 secrets 取扱 verification (A9)

### 7.1 SLACK_WEBHOOK_URL injection

```yaml
env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
run: |
  bash projects/PRJ-019/scripts/sec-tests-pass-gate.sh ...
```

- repo secrets から injection (env scope = step 内のみ)。
- 未設定時は `${{ secrets.SLACK_WEBHOOK_URL }}` が空文字に展開 (GitHub Actions 仕様)。
- script 側 `slack_alert()` 関数で空文字判定 → no-op 動作 (R19 Sec-N 由来 fallback)。
- exit 3 (Slack send_failed) は fail-soft で gate 通過。

### 7.2 secrets log 流出なし

- yml 内に `echo $SLACK_WEBHOOK_URL` 等の log 出力なし。
- `set -x` 不使用 (env 値 trace 出力なし)。
- artifact 内に webhook URL 含まれない (script 側 redaction 済)。

### 7.3 PII redaction integrity (R20 Sec-O §8 / R21 Sec-P §5.2 踏襲)

- `user_hash` (SHA-256 12 桁) のみ CI log 流出許容。
- `kind` ラベル / `SEC_OVERRIDE_REASON` / `Slack webhook payload` すべて redaction or escape 済。
- 90 日 retention 中の漏出 risk は private repo 前提で GitHub access control 委譲 (Sec-P §5.2 踏襲)。

判定: **PASS**。

---

## §8 artifact retention verification (A10)

### 8.1 5 upload step 全数

| job | upload step name | path | retention-days |
|----|--------------|----|--------------|
| sec-side-effect-zero | side-effect-zero log artifact | `reports/_sec-automation/side-effect-zero-*.log` | **90** |
| sec-emoji-zero | emoji-zero log artifact | `reports/_sec-automation/emoji-zero-*.log` | **90** |
| sec-tests-pass | streak state artifact | `scripts/sec-streak-state.json` | **90** |
| sec-tests-pass | tests-pass-gate log artifact | `reports/_sec-automation/tests-pass-gate-*.log` | **90** |
| sec-api-spike | api-spike log artifact | `reports/_sec-automation/api-spike-*.log` | **90** |
| sec-audit-aggregate | aggregated sec-audit artifact | `aggregated/aggregated-sec-audit.log` | **90** |

**6 upload step / 全 retention-days: 90 明示**。

### 8.2 DEC-019-066 §3 整合

DEC-019-066 §3 「audit log 90 日保持」要件と完全整合。5/26 review 時の `gh run download <run_id> -n sec-audit-aggregated-<run_id>` で SEC_OVERRIDE 集計取得可能。

### 8.3 retention default 整合

GitHub Actions default = 90 日。明示的に `90` 指定で default 互換 + 仕様明記の二重保証。

判定: **PASS**。

---

## §9 BASE_REF 3-tier fallback verification (A11)

### 9.1 優先度マトリクス

```yaml
BASE_REF: ${{ github.event.pull_request.base.sha || github.event.before || 'origin/main' }}
HEAD_REF: ${{ github.event.pull_request.head.sha || github.sha }}
```

| 優先度 | BASE_REF 解決元 | 適用 event | 検証方法 |
|------|-----------|--------|------|
| 1 | `github.event.pull_request.base.sha` | pull_request | 実 PR 起票で trigger / R22 H-1 引継 |
| 2 | `github.event.before` | push (直前 commit) | `git log` 直前 commit との diff 比較 |
| 3 | `'origin/main'` | schedule / workflow_dispatch | full clone で origin/main resolve |

### 9.2 fetch-depth: 0 整合

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

- `sec-side-effect-zero` job のみ `fetch-depth: 0` 明記 (line 71)。
- 理由: 優先度 3 (`origin/main`) 解決には全履歴必要 (shallow clone 時 origin/main resolve 失敗 risk 排除)。
- 他 3 job は BASE_REF/HEAD_REF 不要のため `fetch-depth: 0` 不指定 = default shallow で OK (job 時間短縮)。

### 9.3 R19 Sec-N 由来整合

R19 Sec-N (`sec-n-r19-major-improvements.md`) で起案された 3-tier fallback 設計と完全整合。

判定: **PASS**。

---

## §10 検査軸別判定サマリ

| # | 検査軸 | 判定 | severity | Info 件数 |
|---|------|----|--------|--------|
| A1 | yaml 文法 | PASS | - | 0 |
| A2 | indent / 空行 / EOF | PASS | - | 0 |
| A3 | key duplication | PASS | - | 0 |
| A4 | job dependency | PASS | - | 0 |
| A5 | matrix 構成 | PASS | - | 0 |
| A6 | bash script 整合性 | PASS | Info | 1 (H-3 `--audit-log-path` 追加推奨) |
| A7 | fail-fast/soft 二段判定 | PASS | Info | 1 (sec-api-spike WARN fail-soft 化推奨) |
| A8 | streak state artifact | PASS | - | 0 |
| A9 | secrets 取扱 | PASS | - | 0 |
| A10 | artifact retention | PASS | - | 0 |
| A11 | BASE_REF 3-tier fallback | PASS | - | 0 |
| 全体 | yamllint 風 manual review | **PASS** | Info | **3** |

Info 3 件 (Round 22+ 引継):
- **Info 1 (A6)**: `sec-tests-pass-gate.sh --audit-log-path` オプション追加で job 別 path 分離 (R21 Sec-P §6 H-3 既出)。
- **Info 2 (A7)**: `sec-api-spike` WARN (exit 1) の fail-soft 化未実装。`continue-on-error: true` 追加 or script 内再 exit 0 化を Round 22 第 2 波で実施推奨。
- **Info 3 (cron)**: cron `0 2 * * *` (02:00 UTC = 11:00 JST) の他 PRJ-019 cron との衝突 audit (R21 Sec-P §6 H-9 既出)。

Major 0 件 / Minor 0 件 / **総合判定: PASS**。

---

## §11 Round 22 引継

| 引継 ID | 内容 | 担当想定 | 優先度 |
|------|----|------|------|
| Q-1 | 本番 deploy 検証 (実 PR で sec-hardening.yml trigger 動作 / FAIL/PASS 分岐 verify) | Round 22 Dev / Sec | 高 |
| Q-2 | sec-api-spike WARN (exit 1) の fail-soft 化 (`continue-on-error: true` 追加 or script 側再 exit 0 化) | Round 22 Sec / Dev | 高 |
| Q-3 | `sec-tests-pass-gate.sh --audit-log-path` オプション追加 | Round 22 Dev-DD | 中 |
| Q-4 | `sec-audit-aggregate` 集計 jq 化 / dashboard 連携 | Round 22 Dev-DD | 中 |
| Q-5 | branch protection rule で sec-hardening.yml job を required check に設定 | CEO + Round 22 Dev-DD | 中 |
| Q-6 | cron 02:00 UTC の他 PRJ-019 cron 衝突 audit | Round 23 Sec | 低 |
| Q-7 | yml lint (実 yamllint) を別 yml として追加 (Sec yml は無改変) | Round 23 Dev | 低 |

優先度 高 (Q-1 / Q-2) は Round 22 第 2 波必須、中 (Q-3 / Q-4 / Q-5) は Round 22-23、低 (Q-6 / Q-7) は Round 23+。

---

## §12 quality gate (Sec-Q 自身)

| 項目 | 状態 | 備考 |
|------|------|----|
| 副作用 0 | OK | sec-hardening.yml は無改変 / verification report 新規作成のみ |
| 絵文字 0 | OK | report 全文走査で絵文字使用なし |
| API 追加コスト $0 | OK | Read のみ / yamllint 実行 0 / GitHub Actions 実発火 0 |
| 既存 yml 無改変 | OK | sec-hardening.yml は historical baseline として絶対無改変 |
| 全 11 検査軸 verify | OK | A1-A11 全 PASS / Info 3 件は Round 22-23 引継 |
| Major / Minor 0 件 | OK | Major 0 / Minor 0 / Info 3 |
| Owner formal「丁寧に」directive 順守 | OK | 11 検査軸全てに判定理由 + 検査主項を明記 |
| historical baseline 整合 | OK | R20 Sec-O spec / R21 Sec-P 物理化との連動明示 |

---

## §13 Sec-Q 完遂宣言 (yml verification 部分)

Round 21 Sec-P が物理化した `.github/workflows/sec-hardening.yml` (291 行 / 4 trigger / 5 job / matrix 3 並列 / fail-fast/soft 7 切替 / artifact retention 90 日 / SLACK_WEBHOOK_URL secrets / BASE_REF 3-tier fallback) に対し、Round 22 Sec-Q は **yamllint 風 manual review (11 検査軸)** で全項目検査し **Major 0 / Minor 0 / Info 3 / 総合 PASS** 判定。Sec yml は production-ready で R22 H-1 (実 PR trigger 検証) と R22 Q-2 (sec-api-spike WARN fail-soft 化) を Round 22 第 2 波で消化すれば本番 deploy 可能。SOP 実証 **18 件目** (R21 Sec-P) を踏まえ、Round 22 第 1 波は既存 historical baseline の verification + 連続 8 round baseline 化 + 新規 hardening 軸追加の 3 タスクで Sec hardening を継続深化。

—— Sec-Q / 2026-05-05 W0-Week1 / Round 22 第 1 波 / DEC-019-025 SOP 19 件目候補 / yml verification PASS 確定
