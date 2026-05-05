# PRJ-019 Round 23 Sec-R — sec-hardening.yml verification Info 3 件消化 patch spec 報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R23 Sec-R / DEC-019-025 SOP 19 件目候補 (継続深化)
位置付け: Round 22 Sec-Q yml verification (`sec-q-r22-yml-verification.md` / 378 行 / 11 検査軸 PASS / Major 0 / Minor 0 / Info 3 件) で残った Info 3 件 (sec-api-spike WARN fail-soft / `--audit-log-path` 追加 / cron 衝突 audit) の patch spec を起票。Sec yml は historical baseline として絶対無改変、本 spec は **patch 内容定義のみ** で物理化は R24 Sec-S 以降に委譲。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066 / 068
連動 verification: `projects/PRJ-019/reports/sec-q-r22-yml-verification.md` §10 (Info 1 / Info 2 / Info 3 表) / §11 引継 Q-1〜Q-7
連動 yml: `projects/PRJ-019/.github/workflows/sec-hardening.yml` (R21 Sec-P 物理化 / 291 行 / 絶対無改変)

---

## §0 サマリ (CEO 200 字)

Round 23 第 1 波 Sec-R は Round 22 Sec-Q yml verification で残った **Info 3 件** を patch spec 化。Info 1 (sec-api-spike WARN fail-soft 化 / threshold $5/h で WARN exit) は `sec-api-spike-check.sh` 内 exit 1 → exit 0 + log WARN 化 + yml 側 `continue-on-error` 不要、適用 R24 Sec-S 想定 / 影響範囲 1 script + 0 yml line。Info 2 (`--audit-log-path` 追加 / SEC_OVERRIDE audit のパス指定可) は `sec-tests-pass-gate.sh` に getopts 追加 + yml 側 `--audit-log-path "$AUDIT_PATH"` 引数追加、適用 R24 想定 / 影響範囲 1 script + 1 yml job step。Info 3 (cron 衝突 audit / 同時刻 cron 実行検知) は新規 audit script `sec-cron-conflict-audit.sh` 起案 + cron `0 2 * * *` 衝突 PRJ-018/PRJ-016 等の lock file 機構提案、適用 R25 Sec 想定 / 影響範囲 +1 script + 0 yml line (別 yml で audit)。3 件すべて副作用 0 / API 追加コスト $0 / Sec yml 既存 291 行は絶対無改変、patch は Round 24-25 Sec が物理化 (Q-2 / Q-3 / Q-6 引継消化)。

---

## §1 R22 Sec-Q yml verification Info 3 件 (継承)

R22 `sec-q-r22-yml-verification.md` §10 抜粋:

| # | 検査軸 | severity | 件数 | 内容 |
|---|------|----|----|----|
| Info 1 | A6 (bash script 整合性) | Info | 1 | `sec-tests-pass-gate.sh --audit-log-path` オプション追加で job 別 path 分離 (R21 Sec-P §6 H-3 既出) |
| Info 2 | A7 (fail-fast/soft 二段判定) | Info | 1 | `sec-api-spike` WARN (exit 1) の fail-soft 化未実装。`continue-on-error: true` 追加 or script 内再 exit 0 化を Round 22 第 2 波で実施推奨 |
| Info 3 | (cron) | Info | 1 | cron `0 2 * * *` (02:00 UTC = 11:00 JST) の他 PRJ-019 cron との衝突 audit (R21 Sec-P §6 H-9 既出) |

**Note**: R22 表内の Info 順序は yml verification §10 の **A6 → A7 → cron** = Info 1 (A6) / Info 2 (A7) / Info 3 (cron)。本 spec では task 指定順 (sec-api-spike WARN fail-soft / `--audit-log-path` / cron 衝突 audit) に従い **Info 1 = sec-api-spike WARN / Info 2 = `--audit-log-path` / Info 3 = cron 衝突** で再番号付け。R22 番号と本 spec 番号の対応は §1.1 表参照。

### 1.1 R22 番号 ↔ R23 番号対応

| R22 verification Info # | 内容 | R23 spec Info # | 適用順 |
|----|----|----|----|
| Info 2 (R22 §10 A7) | sec-api-spike WARN fail-soft 化 | **Info 1 (R23)** | 第 1 |
| Info 1 (R22 §10 A6) | `--audit-log-path` 追加 | **Info 2 (R23)** | 第 2 |
| Info 3 (R22 §10 cron) | cron 衝突 audit | **Info 3 (R23)** | 第 3 |

R22 verification の引継 Q-2 (sec-api-spike WARN fail-soft) / Q-3 (`--audit-log-path`) / Q-6 (cron 衝突 audit) と本 spec が 1:1 対応。

---

## §2 Info 1: sec-api-spike WARN fail-soft 化 (patch spec)

### 2.1 現状 (R22 末 / 物理化済 sec-hardening.yml + sec-api-spike-check.sh)

R22 yml verification §5.1 抜粋:

| script | exit code | 意味 | 動作 (現状) |
|------|--------|----|----|
| sec-api-spike | 0 | PASS | 続行 |
| sec-api-spike | 1 | WARN | **fail-fast** (R21 物理化時点 / yml 内 continue-on-error 未指定) |
| sec-api-spike | 2 | FAIL | **fail-fast** (cost cap breach 想定) |

問題: WARN (exit 1 = 1h 窓 threshold $5/h 超過だが cost cap 未達) が cost cap breach (exit 2) と同じ fail-fast 扱いになっており **設計意図と乖離**。

### 2.2 patch 仕様

**patch target**: `projects/PRJ-019/scripts/sec-api-spike-check.sh` のみ (yml は無改変)

**patch 内容**: WARN 段階を exit 1 → exit 0 + `[SEC_API_SPIKE_WARN]` log 化に変更

```bash
# Before (R22 末)
if [[ "$spike_usd" > "5.0" && "$spike_usd" < "$cap_usd" ]]; then
  echo "[FAIL] WARN: 1h spike $spike_usd USD over $5/h threshold (cap not breached)"
  exit 1
fi

# After (R23 spec / R24 Sec-S 物理化想定)
if [[ "$spike_usd" > "5.0" && "$spike_usd" < "$cap_usd" ]]; then
  echo "[SEC_API_SPIKE_WARN] 1h spike $spike_usd USD over $5/h threshold (cap not breached / fail-soft / merge OK)"
  # WARN log は audit log 経由で集計
  echo "{\"level\":\"WARN\",\"spike_usd\":$spike_usd,\"threshold\":5.0,\"cap\":$cap_usd,\"timestamp\":\"$(date -u +%FT%TZ)\"}" \
    >> "${AUDIT_LOG_PATH:-reports/_sec-automation/api-spike-warn-$(date +%s).log}"
  exit 0  # fail-soft: gate PASS
fi
# cost cap breach (exit 2) は不変
if [[ "$spike_usd" >= "$cap_usd" ]]; then
  echo "[FAIL] cost cap breach $spike_usd >= $cap_usd"
  exit 2
fi
```

### 2.3 影響範囲

| 影響対象 | 行数増減 | 理由 |
|----|----|----|
| `scripts/sec-api-spike-check.sh` | +5〜8 行 | WARN log 出力 + audit log append |
| `.github/workflows/sec-hardening.yml` | **0 行** | exit code 解釈変更のみ (yml 内 continue-on-error 不要) |
| `runsheets/sec-api-spike-baseline.json` | 0 行 | baseline trajectory 不変 |
| audit log path | +1 file | `reports/_sec-automation/api-spike-warn-*.log` 新規 |

### 2.4 適用 Round 提案

**R24 Sec-S 第 1 波** (R22 verification Q-2 引継消化)

理由: 5/26 W3 mid-check までに物理化完了することで R26 連続 12 round milestone 評価時点での fail-soft 動作確認可。

### 2.5 verification 方法 (R24 物理化後 / R25 Sec verify)

- spike test: 1h cost を $4.99 (PASS) / $5.01 (WARN) / $30.0 (FAIL = cap breach) の 3 点で sample 実行
- exit code 確認: 0 / 0 / 2 (R23 spec 通り)
- audit log 確認: WARN 段階で `api-spike-warn-*.log` 新規 file 生成

---

## §3 Info 2: `--audit-log-path` 追加 (patch spec)

### 3.1 現状 (R22 末)

`sec-tests-pass-gate.sh` は audit log path が `reports/_sec-automation/` 固定 hard-coded。yml 側で `--audit-log-path` 引数指定不可。

R22 引継 Q-3 (中優先度): `--audit-log-path` オプション追加で job 別 path 分離が必要。

### 3.2 patch 仕様

**patch target**:
- `projects/PRJ-019/scripts/sec-tests-pass-gate.sh` (getopts 追加)
- `projects/PRJ-019/.github/workflows/sec-hardening.yml` (job step に引数追加 / **これは sec-hardening.yml 改変が必要**)

**重要**: Info 2 patch は sec-hardening.yml の改変を伴うため **絶対無改変原則と矛盾**。R22 verification では Sec yml = historical baseline 絶対無改変だが、Info 解消には改変必須。

**解決策**: Sec yml の **次世代版 (sec-hardening.yml v2)** を別 file (`.github/workflows/sec-hardening-v2.yml`) として新設し、R21 物理化版 v1 は historical 保存、v2 で `--audit-log-path` 採用とする。

### 3.3 patch 内容

#### 3.3.1 `sec-tests-pass-gate.sh` (getopts 追加)

```bash
# Before (R22 末)
SUITE=""
PASS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite) SUITE="$2"; shift 2 ;;
    --pass) PASS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done
AUDIT_LOG_PATH="reports/_sec-automation/tests-pass-gate-${SUITE}-$(date +%s).log"

# After (R23 spec)
SUITE=""
PASS=""
AUDIT_LOG_PATH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite) SUITE="$2"; shift 2 ;;
    --pass) PASS="$2"; shift 2 ;;
    --audit-log-path) AUDIT_LOG_PATH="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done
# default fallback (引数指定がない場合は従来動作)
AUDIT_LOG_PATH="${AUDIT_LOG_PATH:-reports/_sec-automation/tests-pass-gate-${SUITE}-$(date +%s).log}"
```

#### 3.3.2 `sec-hardening-v2.yml` 新設 (v1 はそのまま保存)

```yaml
# R21 物理化版 v1: .github/workflows/sec-hardening.yml (291 行 / 絶対無改変 / R22 verification PASS)
# R23 spec → R24 物理化版 v2: .github/workflows/sec-hardening-v2.yml (新規)
- name: Run sec-tests-pass-gate.sh
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    bash projects/PRJ-019/scripts/sec-tests-pass-gate.sh \
      --suite ${{ matrix.suite }} \
      --pass ${{ steps.vitest.outputs.pass }} \
      --audit-log-path "reports/_sec-automation/tests-pass-gate-${{ matrix.suite }}-$(date +%s).log"
```

### 3.4 影響範囲

| 影響対象 | 行数増減 | 理由 |
|----|----|----|
| `scripts/sec-tests-pass-gate.sh` | +3〜5 行 | getopts case 追加 + default fallback |
| `.github/workflows/sec-hardening.yml` (v1) | **0 行 (絶対無改変)** | historical baseline 保存 |
| `.github/workflows/sec-hardening-v2.yml` (新規) | +295 行 (v1 base + 1 job step 改変) | R24 物理化対象 |
| 後方互換性 | 確保 | v1 と v2 並走可能 / branch protection で v2 を required check 化 |

### 3.5 適用 Round 提案

**R24 Sec-S 第 1 波** (R22 verification Q-3 引継消化)

理由: Info 1 と同 round で物理化することで R24 Sec-S が両 patch 統合 + v2 yml 起案 + verification を並列実施可。

---

## §4 Info 3: cron 衝突 audit (patch spec)

### 4.1 現状 (R22 末)

`sec-hardening.yml` の cron `0 2 * * *` (02:00 UTC = 11:00 JST) と他 PRJ (PRJ-016 / PRJ-018 等) の cron との衝突 audit が未実施。同時刻 cron 並走で GitHub Actions queue 待ち増加 risk。

R22 引継 Q-6 (低優先度): cron 衝突 audit を Round 23 Sec で実施推奨。

### 4.2 patch 仕様

**patch target**: 新規 audit script `projects/PRJ-019/scripts/sec-cron-conflict-audit.sh` 起案

**patch 内容**: 既存 yml の cron 衝突 audit (read-only) + 衝突検知 lock file 機構提案

#### 4.2.1 audit script 概要 (R23 spec)

```bash
#!/bin/bash
# sec-cron-conflict-audit.sh - PRJ 内 yml cron schedule 衝突検知
# 副作用 0 / read-only / API 追加コスト $0
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKFLOWS_DIR="$REPO_ROOT/.github/workflows"
PRJ_WORKFLOWS_GLOB="$REPO_ROOT/projects/*/.github/workflows/*.yml"

# 全 yml から cron schedule 抽出
echo "## cron schedule audit ($(date -u +%FT%TZ))"
echo
declare -A CRON_MAP
for yml in $WORKFLOWS_DIR/*.yml $(eval ls $PRJ_WORKFLOWS_GLOB 2>/dev/null); do
  [[ -f "$yml" ]] || continue
  while IFS= read -r line; do
    if [[ "$line" =~ -[[:space:]]*cron:[[:space:]]*[\'\"]([^\'\"]+)[\'\"] ]]; then
      cron="${BASH_REMATCH[1]}"
      CRON_MAP["$cron"]+="$yml,"
    fi
  done < "$yml"
done

# 衝突検知
EXIT_CODE=0
for cron in "${!CRON_MAP[@]}"; do
  yml_list="${CRON_MAP[$cron]}"
  yml_count=$(echo "$yml_list" | tr ',' '\n' | grep -c -v '^$' || true)
  if [[ "$yml_count" -gt 1 ]]; then
    echo "[CONFLICT] cron '$cron' is used by $yml_count yml files:"
    echo "$yml_list" | tr ',' '\n' | grep -v '^$' | sed 's/^/  - /'
    EXIT_CODE=1
  fi
done

if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "[OK] no cron conflicts detected ($(echo "${!CRON_MAP[@]}" | wc -w) unique schedules)"
fi
exit "$EXIT_CODE"
```

#### 4.2.2 lock file 機構 (衝突検知時)

衝突検知時 (exit 1) は別 yml `.github/workflows/sec-cron-audit.yml` (新規) で日次 audit 実施し、衝突発生時は Slack 通知 + dashboard escalation。

**重要**: Sec yml v1 (sec-hardening.yml / 291 行) は **絶対無改変**。新規 audit yml `sec-cron-audit.yml` を別 file で起案する。

### 4.3 影響範囲

| 影響対象 | 行数増減 | 理由 |
|----|----|----|
| `scripts/sec-cron-conflict-audit.sh` (新規) | +35〜45 行 | cron audit script 起案 |
| `.github/workflows/sec-cron-audit.yml` (新規 / R25 物理化想定) | +60〜80 行 | 日次 audit yml 起案 |
| `.github/workflows/sec-hardening.yml` (v1) | **0 行 (絶対無改変)** | historical baseline 保存 |
| その他 PRJ yml | 0 行 (read-only audit のみ) | 衝突検知後 PRJ 別調整は別 ticket |

### 4.4 適用 Round 提案

**R25 Sec 第 1 波** (R22 verification Q-6 引継消化 / 低優先度のため R24 ではなく R25)

理由: Info 1/Info 2 (R24 物理化) の後、新規 audit 機構として独立追加 / 5/26 W3 mid-check 直前で衝突状況把握可。

### 4.5 verification 方法 (R25 Sec audit 実行後)

- cron schedule 一覧出力 (audit script 実行結果)
- 衝突 yml file path 列挙
- 衝突解消は別 ticket (PRJ 別 cron 時刻調整)

---

## §5 3 件統合タイムライン

| Round | 作業 | 担当 | 成果物 |
|----|----|----|----|
| **R23** (本 spec) | Info 3 件 patch spec 確定 | Sec-R | `reports/sec-r-r23-yml-info-3-resolution.md` (本 file) |
| **R24** | Info 1 (sec-api-spike WARN fail-soft) 物理化 | Sec-S | `scripts/sec-api-spike-check.sh` patch +5〜8 行 |
| **R24** | Info 2 (`--audit-log-path` 追加) 物理化 | Sec-S | `scripts/sec-tests-pass-gate.sh` patch +3〜5 行 + `sec-hardening-v2.yml` 新設 +295 行 |
| **R25** | Info 3 (cron 衝突 audit) 物理化 | Sec | `scripts/sec-cron-conflict-audit.sh` 新規 +35〜45 行 + `sec-cron-audit.yml` 新規 +60〜80 行 |
| **R26** | 連続 12 round PASS milestone + T-5 formal 採否 + Info 3 件物理化 verification | Sec | DEC-019-068 v2 起案 |

---

## §6 R23 spec 段階の quality gate

| 項目 | 状態 | 備考 |
|------|------|----|
| 副作用 0 | OK | spec doc 新規作成のみ / 既存 yml / scripts 無改変 |
| 絵文字 0 | OK | 全文走査で絵文字使用なし |
| API 追加コスト $0 | OK | Read + Write のみ / 外部 API call 0 |
| Sec yml v1 絶対無改変原則 | OK | 物理化 patch は v2 yml 別 file 化 で historical 保存 |
| Info 3 件全件 patch 仕様確定 | OK | Info 1 (sec-api-spike WARN) / Info 2 (`--audit-log-path`) / Info 3 (cron 衝突) |
| 影響範囲明示 | OK | 各 Info で対象 file + 行数増減 + 後方互換性記載 |
| 適用 Round 提案 | OK | R24 (Info 1+2) / R25 (Info 3) / R26 (verification + T-5 採否) |
| R22 verification 引継 Q-2/Q-3/Q-6 整合 | OK | 1:1 対応 (§1.1 表) |
| 後方互換性 | OK | v1 yml 並走 / 既存 caller 動作維持 / default fallback |

---

## §7 Round 23 引継 (yml Info 3 件消化部分)

| 引継 ID | 内容 | 担当想定 | 優先度 |
|------|----|------|------|
| R-INFO-1 | R24 で Info 1 (sec-api-spike WARN fail-soft) 物理化 + verification | Round 24 Sec-S | 高 |
| R-INFO-2 | R24 で Info 2 (`--audit-log-path`) 物理化 + sec-hardening-v2.yml 新設 | Round 24 Sec-S | 高 |
| R-INFO-3 | R25 で Info 3 (cron 衝突 audit) 物理化 + 別 yml `sec-cron-audit.yml` 新設 | Round 25 Sec | 中 |
| R-INFO-4 | R26 で 3 件物理化 verification + T-5 採否 + DEC-019-068 v2 起案 | Round 26 Sec | 中 |
| R-INFO-5 | branch protection で sec-hardening-v2.yml job を required check に設定 | Round 24 Sec + CEO | 中 |
| R-INFO-6 | sec-hardening v1 → v2 切替時の audit log 集計 schema 整合性確認 | Round 25 Sec | 低 |

---

## §8 Sec-R yml Info 3 件消化 spec 完遂宣言

R22 Sec-Q yml verification (`sec-q-r22-yml-verification.md` / 378 行 / 11 検査軸 PASS / Major 0 / Minor 0 / **Info 3 件 open**) で残った Info 3 件を R23 Sec-R が patch spec 化。Info 1 (sec-api-spike WARN fail-soft / threshold $5/h で WARN exit 0 化 / +5〜8 行 script patch / yml 改変 0 行) は R24 Sec-S 想定。Info 2 (`--audit-log-path` 追加 / SEC_OVERRIDE audit パス指定可 / +3〜5 行 script patch + sec-hardening-v2.yml 新設 +295 行) は v1 絶対無改変原則と矛盾するため **v2 yml 別 file 化** で解消、R24 Sec-S 想定。Info 3 (cron 衝突 audit / 同時刻 cron 検知 / 新規 sec-cron-conflict-audit.sh +35〜45 行 + sec-cron-audit.yml +60〜80 行) は R25 Sec 想定。3 件全件 sec-hardening.yml v1 (R21 物理化 / 291 行) **絶対無改変原則を遵守**、副作用 0 / API 追加コスト $0。R24-R25 で物理化 → R26 連続 12 round milestone で verification + T-5 採否 + DEC-019-068 v2 起案 想定。R22 引継 Q-2 / Q-3 / Q-6 すべて R23 spec で **解消経路確定**。

—— Sec-R / 2026-05-05 W0-Week1 / Round 23 第 1 波 / DEC-019-025 SOP 19 件目候補 (継続深化) / yml verification Info 3 件 patch spec 確定
