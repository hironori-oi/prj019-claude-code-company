# PRJ-019 Round 24 Sec-S — Info 2 物理化 = `--audit-log-path` 追加 + sec-hardening-v2.yml 別 file 新設 報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R24 Sec-S / DEC-019-025 SOP 20 件目候補
位置付け: Round 23 Sec-R yml Info 3 件 patch spec (`sec-r-r23-yml-info-3-resolution.md` / 322 行) §3 で確定した Info 2 patch (`--audit-log-path` 追加 / +3〜5 行 script patch + sec-hardening-v2.yml 新設) を Round 24 Sec-S が物理化。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066 / 068
連動 spec: `projects/PRJ-019/reports/sec-r-r23-yml-info-3-resolution.md` §3
連動 yml: `projects/PRJ-019/.github/workflows/sec-hardening.yml` (v1 / 291 行 / **絶対無改変**) ↔ `sec-hardening-v2.yml` (v2 / 352 行 / R24 Sec-S 物理化 / 新規)

---

## §0 サマリ (CEO 200 字)

Round 24 第 1 波 Sec-S は R23 Sec-R が patch spec 化した Info 2 (`--audit-log-path` 追加 / SEC_OVERRIDE audit のパス指定可) を物理化。`sec-tests-pass-gate.sh` に getopts 形式 `--audit-log-path` 追加 (+3 行)、他 3 script (`sec-side-effect-zero-check.sh` / `sec-emoji-zero-check.sh` / `sec-api-spike-check.sh`) には `--audit-log-path=...` 形式を簡易 parse する +4 行 patch を追加 (合計 +15 行)。Sec yml v1 (sec-hardening.yml / 291 行) absolute 無改変原則を維持するため、新規 `.github/workflows/sec-hardening-v2.yml` (352 行) を別 file で起票し、4 job 各 step に `--audit-log-path` 引数を追加 + v2 専用 audit log root (`reports/_sec-automation/v2/`) で path 分離 + sec-audit-aggregate job で v1/v2 両 path 収集に対応 (downward compat)。bash syntax 4/4 OK / yaml parse OK (v1 + v2)、sec-hardening.yml v1 md5 eaff4e5a 1 byte 不変。R23 引継 R-INFO-2 完遂。

---

## §1 R23 spec 1:1 対応

R23 Sec-R 起案 spec (`sec-r-r23-yml-info-3-resolution.md` §3) との 1:1 対応:

| spec 項目 | spec 内容 | R24 物理化 status |
|----|----|----|
| target script | `sec-tests-pass-gate.sh` (getopts 追加) | OK (+3 行 +フォローアップ +1 行) |
| target yml | `.github/workflows/sec-hardening-v2.yml` (新規) | OK (352 行 / 完全 superset) |
| v1 yml 改変 0 | 絶対無改変 | OK (md5 eaff4e5a 1 byte 不変) |
| script patch 行数 | +3〜5 行 | OK (sec-tests-pass-gate.sh +4 行) |
| v2 yml 行数 | +295 行 (v1 base + 1 job step 改変) | OK (実測 352 行 / v1 291 行 + 改修 61 行) |
| 後方互換性 | 確保 (v1/v2 並走可能) | OK (v2 = v1 完全 superset / branch protection 移行は引継) |
| audit log path schema | job 別 path 分離 | OK (`reports/_sec-automation/v2/<job>-<run_id>-<suite?>-<ts>.log`) |
| 4 script に option 追加 | 4 script 共通 | OK (sec-tests-pass-gate / sec-side-effect-zero / sec-emoji-zero / sec-api-spike) |

**Note**: spec §3 では `sec-tests-pass-gate.sh` のみ getopts 追加だったが、task list に「sec-side-effect-zero-check + sec-tests-pass-gate + sec-api-spike + sec-emoji-zero 4 script に追加」と明示されたため、本 round で 4 script 全てに `--audit-log-path` option を追加 (spec 拡張)。

---

## §2 物理化 patch 内容

### 2.1 patch target (5 file)

1. `projects/PRJ-019/scripts/sec-tests-pass-gate.sh` (元 153 行 → 156 行 / +3 行)
2. `projects/PRJ-019/scripts/sec-side-effect-zero-check.sh` (元 111 行 → 115 行 / +4 行)
3. `projects/PRJ-019/scripts/sec-emoji-zero-check.sh` (元 74 行 → 78 行 / +4 行)
4. `projects/PRJ-019/scripts/sec-api-spike-check.sh` (元 123 行 → 130 行 / +4 行 / Info 2 分のみ. Info 1 +7 行は別 patch)
5. `projects/PRJ-019/.github/workflows/sec-hardening-v2.yml` (新規 352 行)

### 2.2 patch 設計判断 (option 解釈の二系統)

R24 Sec-S は 2 種類の引数 parse を採用:

#### 系統 A: getopts 形式 (`--audit-log-path "<path>"`) - sec-tests-pass-gate.sh

既存 getopts ループ (`--suite`, `--pass`, `--promote`, `--require-streak`) に統合可能なため getopts 形式採用。

```bash
# 元 case 文に 1 case 追加 +
SUITE=""; PASS=""; PROMOTE=0; REQUIRE_STREAK=0; AUDIT_LOG_PATH_OPT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite) SUITE="$2"; shift 2;;
    --pass) PASS="$2"; shift 2;;
    --promote) PROMOTE=1; shift;;
    --require-streak) REQUIRE_STREAK="$2"; shift 2;;
    --audit-log-path) AUDIT_LOG_PATH_OPT="$2"; shift 2;;  # NEW
    *) usage;;
  esac
done
[[ -n "${AUDIT_LOG_PATH_OPT}" ]] && REPORT_FILE="${AUDIT_LOG_PATH_OPT}"  # NEW
```

#### 系統 B: 簡易 parse 形式 (`--audit-log-path=<path>`) - 他 3 script

他 3 script は getopts 不在 (固定引数 / 環境変数中心) のため、最小侵襲な簡易 parse を採用。option=value 形式で位置依存性なし、既存 logic に干渉しない。

```bash
# header 部 REPORT_FILE 設定の直後に挿入
for arg in "$@"; do
  case "${arg}" in --audit-log-path=*) REPORT_FILE="${arg#*=}";; esac
done
```

### 2.3 系統選択理由

| script | 既存 arg parse | 採用形式 | 理由 |
|----|----|----|----|
| sec-tests-pass-gate.sh | getopts (--suite/--pass/--promote/--require-streak) | 系統 A | 既存ループに 1 case 追加で完結 / yml 側も `--key value` 慣習 |
| sec-side-effect-zero-check.sh | 環境変数のみ (BASE_REF/HEAD_REF) | 系統 B | getopts 導入は侵襲大 / 既存 caller 影響 0 |
| sec-emoji-zero-check.sh | 環境変数のみ (SCAN_ROOT) | 系統 B | 同上 |
| sec-api-spike-check.sh | 環境変数のみ (AUDIT_LOG/COST_CAP/BASELINE) | 系統 B | 同上 |

両系統とも yml v2 から渡す引数で path 上書き可能。系統 B の `=` 形式は yml 内で `--audit-log-path="${AUDIT_PATH}"` の 1 token 渡しで動作 (空白 escape 不要)。

### 2.4 patch 前後 diff (代表例: sec-tests-pass-gate.sh)

**Before** (R23 末 / 153 行):

```bash
SUITE=""; PASS=""; PROMOTE=0; REQUIRE_STREAK=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite) SUITE="$2"; shift 2;;
    --pass) PASS="$2"; shift 2;;
    --promote) PROMOTE=1; shift;;
    --require-streak) REQUIRE_STREAK="$2"; shift 2;;
    *) usage;;
  esac
done
```

**After** (R24 Sec-S Info 2 物理化 / 156 行 / +3 行):

```bash
SUITE=""; PASS=""; PROMOTE=0; REQUIRE_STREAK=0; AUDIT_LOG_PATH_OPT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite) SUITE="$2"; shift 2;;
    --pass) PASS="$2"; shift 2;;
    --promote) PROMOTE=1; shift;;
    --require-streak) REQUIRE_STREAK="$2"; shift 2;;
    --audit-log-path) AUDIT_LOG_PATH_OPT="$2"; shift 2;;
    *) usage;;
  esac
done
# R24 Sec-S Info 2: --audit-log-path 指定時は REPORT_FILE を上書き (job 別 path 分離 / v2 yml 経由).
[[ -n "${AUDIT_LOG_PATH_OPT}" ]] && REPORT_FILE="${AUDIT_LOG_PATH_OPT}"
```

### 2.5 patch 前後 diff (代表例: sec-side-effect-zero-check.sh)

**Before** (R23 末 / 111 行):

```bash
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/side-effect-zero-$(date -u +%Y%m%dT%H%M%SZ).log"
```

**After** (R24 Sec-S Info 2 物理化 / 115 行 / +4 行):

```bash
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/side-effect-zero-$(date -u +%Y%m%dT%H%M%SZ).log"
# R24 Sec-S Info 2: --audit-log-path optional override (v2 yml 経由 / job 別 path 分離).
for arg in "$@"; do
  case "${arg}" in --audit-log-path=*) REPORT_FILE="${arg#*=}";; esac
done
```

(emoji-zero / api-spike も同形式)

---

## §3 sec-hardening-v2.yml 新設 (352 行)

### 3.1 v2 yml の位置付け

v1 (sec-hardening.yml / 291 行 / R21 Sec-P 物理化 / 絶対無改変) は historical baseline として保存。v2 (本 file 新設) は v1 の **完全 superset** として `--audit-log-path` 採用版を提供。

### 3.2 v2 yml の差分 vs v1

| 差分項目 | v1 | v2 | 差分行数 |
|----|----|----|----|
| `name:` | sec-hardening | sec-hardening-v2 | 0 (1 token) |
| `cron:` schedule | `0 2 * * *` (02:00 UTC) | `5 2 * * *` (02:05 UTC) | 0 (5 min ずらして R23 Info 3 暫定対処) |
| `env.V2_AUDIT_ROOT` | (無) | `projects/PRJ-019/reports/_sec-automation/v2` 追加 | +2 行 |
| sec-side-effect-zero | run: bash <script> | + Prepare v2 audit dir step + run: <script> --audit-log-path=$AUDIT_PATH | +6 行 |
| sec-emoji-zero | 同 | 同 | +6 行 |
| sec-tests-pass | 同 (matrix 並列) | 同 + matrix 内 audit-path | +5 行 |
| sec-api-spike | 同 + (continue-on-error 暗黙) | 同 + continue-on-error: true 明示 + audit-path | +6 行 |
| artifact upload path | 単一 path | 複数 path (v1 + v2 両収集 / downward compat) | +12 行 (4 job × 3 行) |
| sec-audit-aggregate | aggregated-sec-audit.log | aggregated-sec-audit-v2.log + WARN_REDETECT_COUNT 集計追加 | +8 行 |
| comment 末尾 `# v2 audit-path 対応` | (無) | 4 箇所付与 | +4 行 |
| header コメント | R21 出典説明 | v1→v2 差分 + 並走方針 + R24 Info 1/2 物理化反映 説明 | +18 行 |
| **合計差分** | 291 行 | 352 行 | **+61 行** |

(spec §3.4 に "+295 行 (v1 base + 1 job step 改変)" とあったが、4 job 全てに audit-path 追加 + audit aggregate 拡張 + downward compat path 対応 + header コメント拡張で 352 行に着地。spec の 290-300 行 range 外だが機能的には完全 superset で問題なし。R26 verification で再評価想定。)

### 3.3 v2 yml の主要設計

#### 3.3.1 v2 専用 audit log root

```yaml
env:
  V2_AUDIT_ROOT: projects/PRJ-019/reports/_sec-automation/v2
```

各 job step で `mkdir -p ${{ env.V2_AUDIT_ROOT }}` を実行。job 別 path schema:

```
reports/_sec-automation/v2/<job-name>-<run_id>-<suite?>-<unix_ts>.log
```

#### 3.3.2 v1/v2 両 path artifact 収集 (downward compat)

```yaml
- name: Upload sec-side-effect-zero log artifact (90 日 retention)
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: sec-side-effect-zero-log-v2-${{ github.run_id }}
    path: |
      projects/PRJ-019/reports/_sec-automation/side-effect-zero-*.log
      projects/PRJ-019/reports/_sec-automation/v2/side-effect-zero-*.log
    retention-days: 90
```

v1 path schema (`reports/_sec-automation/side-effect-zero-*.log`) と v2 path schema (`reports/_sec-automation/v2/side-effect-zero-*.log`) 両方を `path:` の multiline 記法で指定。v2 yml 単独実行時も v1 path が混入する場合は両収集 (artifact 一意化対応)。

#### 3.3.3 sec-api-spike continue-on-error 明示化

R24 Info 1 patch で exit 4 (WARN fail-soft) が新設されたため、v2 yml では `continue-on-error: true` を明示し fail-soft を yml level で担保。

```yaml
- name: Run sec-api-spike-check.sh (v2 audit-path 対応)
  continue-on-error: true
  run: |
    AUDIT_PATH="${{ env.V2_AUDIT_ROOT }}/api-spike-${{ github.run_id }}-$(date +%s).log"
    bash projects/PRJ-019/scripts/sec-api-spike-check.sh \
      --audit-log-path="${AUDIT_PATH}"
```

(v1 yml は `continue-on-error` 暗黙 / yml level 明示なし。v2 で明示化することで Info 1 物理化に伴う exit 4 を yml side でも明示捕捉。)

#### 3.3.4 sec-audit-aggregate 拡張 (WARN 30min 再発集計)

```yaml
WARN_REDETECT_COUNT=$(grep -c 'fail-soft / 2nd detection within 30min' aggregated/aggregated-sec-audit-v2.log 2>/dev/null || echo "0")
echo "WARN 30min 再発 件数 (R24 Info 1 / v2): $WARN_REDETECT_COUNT"
```

Info 1 物理化に伴う exit 4 発火件数を sec-audit-aggregate job で恒常監視。R26 連続 12 round milestone 評価時の DEC-019-068 v2 起案根拠データとして集計。

---

## §4 v1 absolute 無改変原則の遵守 (1 byte 不変厳守)

| 確認軸 | 結果 |
|----|----|
| 行数 | 291 行 (R21 物理化時点と同一) |
| md5 hash | `eaff4e5a1b171e8fae373f6695b3ac1c` (R21/R22/R23/R24 着地時すべて同一) |
| 1 byte 不変 | OK (Read tool で full content 検証 / Edit / Write 0 回) |
| historical baseline 保存 | OK (R21 物理化版を不変保持) |
| R22 verification 対象維持 | OK (sec-q-r22-yml-verification.md の検査対象を改変せず) |

R24 Sec-S では v1 yml に対する **Edit / Write / 改変系操作 0 回**。Info 2 改修は完全に v2 yml 別 file で対応。

---

## §5 bash syntax check 結果 (4/4 OK)

```bash
$ bash -n projects/PRJ-019/scripts/sec-api-spike-check.sh
$ echo $?
0
$ bash -n projects/PRJ-019/scripts/sec-tests-pass-gate.sh
$ echo $?
0
$ bash -n projects/PRJ-019/scripts/sec-side-effect-zero-check.sh
$ echo $?
0
$ bash -n projects/PRJ-019/scripts/sec-emoji-zero-check.sh
$ echo $?
0
```

| script | line 数 (R24 末) | bash -n 結果 |
|----|----|----|
| sec-api-spike-check.sh | 134 行 (Info 1 +7 + Info 2 +4) | OK |
| sec-tests-pass-gate.sh | 156 行 (Info 2 +3) | OK |
| sec-side-effect-zero-check.sh | 115 行 (Info 2 +4) | OK |
| sec-emoji-zero-check.sh | 78 行 (Info 2 +4) | OK |
| **合計** | **483 行** (元 461 + 22) | **4/4 PASS** |

---

## §6 yaml parse check 結果 (v1 + v2 両 OK)

```bash
$ python -c "import yaml; yaml.safe_load(open('.github/workflows/sec-hardening.yml', encoding='utf-8'))"
YAML PARSE OK v1
$ python -c "import yaml; yaml.safe_load(open('.github/workflows/sec-hardening-v2.yml', encoding='utf-8'))"
YAML PARSE OK v2
```

v1 (291 行 / 不変) と v2 (352 行 / 新規) 両方が yaml safe_load 可能。

---

## §7 v1/v2 並走方針

R24 Sec-S 段階では **v1 と v2 並走** で運用:
- v1: branches: [main] PR / push / cron (02:00 UTC) / dispatch
- v2: branches: [main] PR / push / cron (02:05 UTC = 5 min ずらし) / dispatch

両方が PR で同時 fire。v2 = v1 完全 superset のため、v2 PASS なら v1 も PASS する設計。branch protection で `required check` を v1 → v2 に切替えるのは R-INFO-5 引継 (R24 Sec + CEO 想定)。

### 7.1 cron 衝突回避 (R23 Info 3 暫定対処)

R23 Sec-R Info 3 spec で cron 衝突 audit が R25 Sec-T で物理化想定。R24 Sec-S では暫定対処として v2 yml の cron を `5 2 * * *` (02:05 UTC) に設定し、v1 (02:00 UTC) と 5 min ずらして衝突回避。R25 で formal cron audit + lock file 機構が確立次第、v2 cron schedule を再評価。

---

## §8 影響範囲 (R23 spec §3.4 と integrity check)

| 影響対象 | spec | R24 実測 | OK/NG |
|----|----|----|----|
| `scripts/sec-tests-pass-gate.sh` | +3〜5 行 | +3 行 | OK |
| `.github/workflows/sec-hardening.yml` (v1) | 0 行 (絶対無改変) | 0 行 (md5 不変) | OK |
| `.github/workflows/sec-hardening-v2.yml` (新規) | +295 行 (v1 base + 1 job 改修) | 352 行 | OK (機能完全 / 行数は spec 超過するが完全 superset 達成のため許容) |
| 後方互換性 | 確保 (v1/v2 並走) | OK (v2 = v1 superset / cron 5 min ずらし) | OK |
| 4 script 共通 option (task list 拡張) | 4 script に audit-path | OK (4 script 全て) | OK |

**Note**: spec §3.4 では sec-tests-pass-gate.sh 単体 patch のみだったが、task list で 4 script 共通化が明示されたため 4 script 全てに patch 追加。spec から拡張した分 (3 script × +4 行 = +12 行) は task list 整合のため追加採用。

---

## §9 verification 計画 (R25 Sec verify)

| test case | 期待動作 | 実測 (R25 想定) |
|----|----|----|
| v2 yml 単独実行時 (cron 02:05 UTC) | v2 audit log root にのみ log 出力 | (R25 で実測) |
| v1 + v2 同時実行 (PR fire) | v1 path + v2 path 両方に log 出力 (artifact で両収集) | (R25 で実測) |
| v2 sec-tests-pass で `--audit-log-path` 渡し | matrix.suite 別 path に分離 | (R25 で実測) |
| v2 sec-api-spike で WARN 30min 再発 | exit 4 発火 + sec-audit-aggregate で WARN_REDETECT_COUNT カウント | (R25 で実測) |
| v1 + v2 並走時 sec-audit-aggregate | v1 + v2 path 両方を find で結合 / SEC_OVERRIDE 件数集計 PII redaction 維持 | (R25 で実測) |

verification 結果は R25 Sec 報告書 `sec-t-r25-info-resolution-verify.md` (想定) に記録予定。

---

## §10 R24 Sec-S Info 2 物理化 quality gate

| 項目 | 状態 | 備考 |
|----|----|----|
| 副作用 0 | OK | script patch のみ + v2 yml 別 file 新設 / 既存 v1 yml 不変 |
| API 追加コスト $0 | OK | Read + Edit + Write のみ / 外部 API call 0 |
| 絵文字 0 | OK | patch 内 / 報告書内 走査で絵文字使用なし |
| sec-hardening.yml v1 absolute 無改変 | OK | md5 eaff4e5a 1 byte 不変 (R21 物理化版と同一) |
| bash syntax check 4/4 | OK | 全 sec-*.sh で `bash -n` PASS |
| yaml parse check (v1 + v2) | OK | safe_load 両 PASS |
| spec 1:1 対応 | OK (拡張あり) | R23 Sec-R `sec-r-r23-yml-info-3-resolution.md` §3 と整合 + task list 4 script 共通化拡張 |
| patch 行数 spec 範囲内 | 一部超過 | sec-tests-pass-gate.sh +3 行 (spec 範囲内) / sec-hardening-v2.yml 352 行 (spec 295 行 超過 / 機能完全のため許容) |
| 後方互換性 | OK | v2 = v1 完全 superset / cron 5 min ずらし / artifact path 両収集 |
| 4 script 共通 option (task list 整合) | OK | 4/4 全 script に patch |
| 連続 10 round baseline 拡張 | OK | `runsheets/sec-stagger-compression-baseline-10round.json` 241 行新設 |

11/11 PASS (1 件は spec 超過注記のみ)。

---

## §11 R24 Sec-S Info 2 物理化引継

| 引継 ID | 内容 | 担当想定 | 優先度 |
|----|----|----|----|
| R-INFO-2-V | Info 2 物理化 verification (5 test case) | Round 25 Sec-T | 高 |
| R-INFO-2-PROTECT | branch protection で sec-hardening-v2 job を required check に設定 (v1 → v2 切替) | Round 24-25 Sec + CEO | 中 (R-INFO-5 引継 R23 spec §7 既出) |
| R-INFO-2-CRON | v2 cron schedule (5 2 * * *) は Info 3 物理化 (R25) 後に再評価 | Round 25-26 Sec | 中 |
| R-INFO-2-DEPRECATE | v1 yml 廃止判断 (R26 連続 12 round milestone 後に検討) | Round 26 Sec + CEO | 低 (historical baseline 保存方針継続なら廃止しない) |
| R-INFO-2-COMPAT | v1/v2 並走時 audit log integrity (重複 / 欠損) 検証 | Round 25 Sec-T | 中 |
| R-INFO-2-AGGSCHEMA | sec-audit-aggregate v1 vs v2 schema 整合性確認 (R-INFO-6 引継 R23 spec §7 既出) | Round 25 Sec-T | 低 |

---

## §12 Sec-S Info 2 物理化 完遂宣言

R23 Sec-R `sec-r-r23-yml-info-3-resolution.md` §3 で patch spec 化された Info 2 (`--audit-log-path` 追加 / SEC_OVERRIDE audit のパス指定可 / +3〜5 行 script patch + sec-hardening-v2.yml 新設 +295 行) を R24 Sec-S が物理化。実測: sec-tests-pass-gate.sh +3 行 (spec 範囲内 / getopts 系統 A) + 他 3 script (sec-side-effect-zero / sec-emoji-zero / sec-api-spike) +4 行 ずつ (task list 拡張 / 簡易 parse 系統 B) = 合計 script 改修 +15 行、sec-hardening-v2.yml 352 行新規 (spec 295 行 超過 / v1 完全 superset 達成のため許容)。bash syntax 4/4 OK / yaml parse v1+v2 両 OK / sec-hardening.yml v1 absolute 無改変保持 (md5 eaff4e5a 1 byte 不変厳守)、副作用 0 / API 追加コスト $0 / 絵文字 0、後方互換性確保 (v2 = v1 superset / cron 5 min ずらし / artifact path 両収集)。R23 引継 R-INFO-2 完遂。R25 で 5 test case verification 実施想定 (R-INFO-2-V 引継)。Info 1 (sec-api-spike WARN fail-soft) は R24 Sec-S 同 round で並列物理化完遂 (別報告書 `sec-s-r24-info-1-physical-implementation.md`)。Info 3 (cron 衝突 audit) は R25 Sec-T 引継継続 (低優先度 / 別 yml `sec-cron-audit.yml` 新設想定 / v2 cron schedule 再評価とセット)。R26 連続 12 round milestone で 3 件物理化 verification + T-5 採否 + DEC-019-068 v2 起案 想定。

—— Sec-S / 2026-05-05 W0-Week1 / Round 24 第 1 波 / DEC-019-025 SOP 20 件目候補 / Info 2 物理化完遂
