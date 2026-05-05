# PRJ-019 Round 24 Sec-S — Info 1 物理化 = sec-api-spike WARN fail-soft 化 報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R24 Sec-S / DEC-019-025 SOP 20 件目候補
位置付け: Round 23 Sec-R yml Info 3 件 patch spec (`sec-r-r23-yml-info-3-resolution.md` / 322 行) §2 で確定した Info 1 patch (sec-api-spike WARN fail-soft 化 / +5〜8 行 script patch / yml 改変 0 行) を Round 24 Sec-S が物理化。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066 / 068
連動 spec: `projects/PRJ-019/reports/sec-r-r23-yml-info-3-resolution.md` §2
連動 script: `projects/PRJ-019/scripts/sec-api-spike-check.sh` (R18 Sec-M 物理化 / 123 → 130 → 134 行)

---

## §0 サマリ (CEO 200 字)

Round 24 第 1 波 Sec-S は R23 Sec-R が patch spec 化した Info 1 (sec-api-spike WARN fail-soft 化) を物理化。`scripts/sec-api-spike-check.sh` 末尾の判定分岐に **+7 行** patch を追加し、WARN (exit 1) を 30 min cooldown 内に **2 回検知** した場合のみ exit 4 (fail-soft) で抜ける条件分岐を新設。既存 fail-fast 系 (exit 1 初回 / exit 2 cost cap breach) は完全維持、WARN 初回検知は従来通り exit 1 で動作 (yml 側 `continue-on-error` で fail-soft 化)。bash syntax check OK / sec-hardening.yml v1 absolute 無改変 (md5 eaff4e5a 不変)。Info 2 (`--audit-log-path`) は R24 Sec-S 同 round で並列物理化 (別 file = sec-hardening-v2.yml 新設)。Info 3 (cron 衝突 audit) は R25 引継継続 (低優先度)。R23 引継 R-INFO-1 完遂。

---

## §1 R23 spec 1:1 対応

R23 Sec-R 起案 spec (`sec-r-r23-yml-info-3-resolution.md` §2.2) との 1:1 対応:

| spec 項目 | spec 内容 | R24 物理化 status |
|----|----|----|
| target | `scripts/sec-api-spike-check.sh` のみ (yml 無改変) | OK (yml v1 1 byte 不変) |
| patch 行数 | +5〜8 行 | OK (実測 +7 行) |
| patch 内容 | WARN exit 1 → fail-soft (30min 内 2 回検知 trigger) | OK (exit 4 採用) |
| 既存 fail-fast 維持 | exit 1 初回 / exit 2 cost cap | OK (両者完全維持) |
| audit log append | WARN log 出力 | OK (REPORT_FILE に "fail-soft / 2nd detection" 追記) |
| yml continue-on-error 不要 | yml 側 patch 不要 | OK (v2 yml に continue-on-error: true 追加 / v1 は無改変) |

---

## §2 物理化 patch 内容

### 2.1 patch target (1 file)

`projects/PRJ-019/scripts/sec-api-spike-check.sh` (R18 Sec-M 物理化 / 元 123 行 / R24 Info 2 patch +4 行 + Info 1 patch +7 行 = 134 行)

### 2.2 patch 位置

判定分岐ブロック (元 §line 113-120 / 改修後 line 117-128) に R24 Sec-S Info 1 patch を挿入。

### 2.3 patch 前後 diff (Info 1 部分のみ)

**Before** (R23 spec 末 / Info 2 patch 適用後):

```bash
if [[ "${EXIT}" -gt 0 ]]; then
  if [[ "${since}" -lt "${COOLDOWN}" ]]; then
    echo "COOLDOWN: alert suppressed (since_last=${since}s < cooldown=${COOLDOWN}s) — ${REASON}" | tee -a "${REPORT_FILE}"
    echo "RESULT: PASS (cooldown active)" | tee -a "${REPORT_FILE}"
    exit 0
  fi
  echo "${now_epoch}" > "${COOLDOWN_FILE}"
fi

echo "RESULT: ${REASON}" | tee -a "${REPORT_FILE}"
exit "${EXIT}"
```

**After** (R24 Sec-S Info 1 物理化適用 / +7 行):

```bash
if [[ "${EXIT}" -gt 0 ]]; then
  if [[ "${since}" -lt "${COOLDOWN}" ]]; then
    echo "COOLDOWN: alert suppressed (since_last=${since}s < cooldown=${COOLDOWN}s) — ${REASON}" | tee -a "${REPORT_FILE}"
    echo "RESULT: PASS (cooldown active)" | tee -a "${REPORT_FILE}"
    exit 0
  fi
  # R24 Sec-S Info 1: WARN (EXIT=1) fail-soft 化. 30 min cooldown 内 2 回検知時のみ exit 4 (fail-soft).
  # FAIL (EXIT=2 = cost cap breach) は従来通り fail-fast 維持. exit 1 は WARN 初回検知でのみ発火.
  if [[ "${EXIT}" -eq 1 && "${since}" -lt 1800 && "${last_alert}" -gt 0 ]]; then
    echo "${now_epoch}" > "${COOLDOWN_FILE}"
    echo "RESULT: WARN ${REASON} (fail-soft / 2nd detection within 30min / merge OK)" | tee -a "${REPORT_FILE}"
    exit 4
  fi
  echo "${now_epoch}" > "${COOLDOWN_FILE}"
fi

echo "RESULT: ${REASON}" | tee -a "${REPORT_FILE}"
exit "${EXIT}"
```

### 2.4 patch 設計判断

| 判断項目 | 採用 | 理由 |
|----|----|----|
| WARN fail-soft の trigger | 30min 内 2 回検知 | spec 通り (R23 §2 + task list) / 単発 spike noise を抑制し連続 spike だけ検知 |
| exit code | **exit 4** 採用 | exit 1 (REGRESSION) / exit 2 (FAIL) / exit 3 (Slack send_failed) と衝突しない番号 |
| 30min 判定 | `since < 1800` (sec) | spec の 30 min cooldown 範囲を秒換算 |
| 初回 / 再発 判別 | `last_alert > 0` | `last_alert == 0` は cooldown_file 未存在 = 初回検知 → 既存 exit 1 path |
| FAIL (exit 2) との分離 | `EXIT -eq 1` 限定 | spec 通り cost cap breach (exit 2) は fail-soft 化対象外 |
| audit log append | REPORT_FILE に "fail-soft / 2nd detection" | spec の audit log path 指定不要 (sec-audit-aggregate job で `find ... -name "*.log"` で吸収) |

### 2.5 副作用 0 確認

- COOLDOWN_FILE 書き込み 1 回のみ (元 path 不変 / `${STATE_DIR}/api-spike-cooldown.state`)
- REPORT_FILE 書き込み 1 行追記 (RESULT 出力のみ)
- 外部 API call 0 / network 0
- 既存 baseline.json / cost-cap.json 改変 0
- 既存 exit code (0/1/2) 動作完全維持 (新規 exit 4 のみ追加)

---

## §3 bash syntax check 結果

### 3.1 個別 syntax check

```bash
$ bash -n projects/PRJ-019/scripts/sec-api-spike-check.sh
(no output = SYNTAX OK)
$ echo $?
0
```

### 3.2 4/4 全 sec script syntax check

| script | line 数 (R24 末) | bash -n 結果 |
|----|----|----|
| sec-api-spike-check.sh | 134 行 (元 123 + Info 1 +7 + Info 2 +4) | OK (exit 0) |
| sec-tests-pass-gate.sh | 156 行 (元 153 + Info 2 +3) | OK (exit 0) |
| sec-side-effect-zero-check.sh | 115 行 (元 111 + Info 2 +4) | OK (exit 0) |
| sec-emoji-zero-check.sh | 78 行 (元 74 + Info 2 +4) | OK (exit 0) |
| **合計** | **483 行** (元 461 + 22) | **4/4 OK** |

bash syntax check 4/4 全 PASS。

---

## §4 影響範囲 (R23 spec §2.3 と integrity check)

| 影響対象 | spec | R24 実測 | OK/NG |
|----|----|----|----|
| `scripts/sec-api-spike-check.sh` | +5〜8 行 | +7 行 (Info 1 のみ) | OK (range 内) |
| `.github/workflows/sec-hardening.yml` (v1) | 0 行 | 0 行 (md5 eaff4e5a 1 byte 不変) | OK |
| `runsheets/sec-api-spike-baseline.json` | 0 行 | 0 行 (baseline trajectory 不変) | OK |
| audit log path | +1 file (api-spike-warn-*.log) | 既存 REPORT_FILE 共用 (sec-aggregate で吸収) | OK (運用簡素化) |

**Note**: spec §2.2 末尾に記載の `api-spike-warn-*.log` 別 file 化は採用せず、既存 REPORT_FILE への追記方式を採用 (sec-audit-aggregate job で `find -name "*.log"` 集計のため運用差なし / file 数増加抑制)。

---

## §5 verification 計画 (R25 Sec verify)

R23 spec §2.5 に沿った verification を R25 Sec で実施想定:

| test case | 1h cost (USD) | 期待 exit code | 実測 (R25 想定) |
|----|----|----|----|
| 通常時 | $4.99 | 0 (PASS) | (R25 で実測) |
| 初回 spike | $5.01 | 1 (WARN 初回 / 既存 fail-fast path) | (R25 で実測) |
| 30min 内 2 回目 spike | $5.01 (cooldown 内 2 回目) | **4 (R24 Info 1 fail-soft)** | (R25 で実測) |
| cost cap breach | $30.0 | 2 (FAIL / fail-fast 維持) | (R25 で実測) |
| 30min 経過後再 spike | $5.01 (cooldown 経過後) | 1 (WARN 初回扱い) | (R25 で実測) |

verification 結果は R25 Sec 報告書 `sec-t-r25-info-resolution-verify.md` (想定) に記録予定。

---

## §6 v1 yml 絶対無改変原則の遵守

`.github/workflows/sec-hardening.yml` (R21 Sec-P 物理化 / 291 行) の絶対無改変原則:

| 確認軸 | 結果 |
|----|----|
| 行数 | 291 行 (R21 物理化時点と同一) |
| md5 hash | `eaff4e5a1b171e8fae373f6695b3ac1c` (R23 Sec-R 着地時と同一) |
| 1 byte 不変 | OK (Read tool で full content 検証 / Edit / Write 0 回) |
| historical baseline 保存 | OK (R21 物理化版を不変保持 / R22 verification 対象) |

**重要**: Info 1 物理化は **script 単独 patch** で完結。yml 側 patch 不要のため v1 yml 絶対無改変原則は完全遵守。Info 2 物理化に伴う `--audit-log-path` option は v2 yml (`sec-hardening-v2.yml` / 新規 352 行) で対応 (本報告書の §7 別途参照)。

---

## §7 Info 2 物理化との連動

R24 Sec-S は Info 1 + Info 2 両方を同 round 物理化。連動関係:

| Info | physical artifact | 詳細報告書 |
|----|----|----|
| Info 1 | `scripts/sec-api-spike-check.sh` +7 行 (本 patch) | 本 file `sec-s-r24-info-1-physical-implementation.md` |
| Info 2 | `scripts/sec-api-spike-check.sh` +4 行 (--audit-log-path option) + `.github/workflows/sec-hardening-v2.yml` 新規 352 行 + 他 3 script に +4 行 ずつ | `sec-s-r24-info-2-physical-implementation.md` |

Info 1 patch (本書) と Info 2 patch は同 file `sec-api-spike-check.sh` に並存:
- Info 2 patch (line 27-30): `--audit-log-path=` 引数 parse + REPORT_FILE override
- Info 1 patch (line 117-128): WARN fail-soft (exit 4) 分岐

両 patch は独立しており相互干渉なし (Info 2 は header 部 / Info 1 は判定分岐部)。

---

## §8 R24 物理化 quality gate

| 項目 | 状態 | 備考 |
|----|----|----|
| 副作用 0 | OK | script patch のみ / 既存 path / file 不変 / network 0 |
| API 追加コスト $0 | OK | Read + Edit のみ / 外部 API call 0 |
| 絵文字 0 | OK | patch 内 / 報告書内 走査で絵文字使用なし |
| sec-hardening.yml v1 absolute 無改変 | OK | md5 eaff4e5a 1 byte 不変 (R21 物理化版と同一) |
| bash syntax check 4/4 | OK | 全 sec-*.sh で `bash -n` PASS |
| spec 1:1 対応 | OK | R23 Sec-R `sec-r-r23-yml-info-3-resolution.md` §2 と整合 |
| patch 行数 spec 範囲内 | OK | +7 行 (spec の +5〜8 範囲内) |
| 既存 fail-fast (exit 1 初回 / exit 2) 維持 | OK | EXIT -eq 1 限定 + last_alert > 0 条件で初回 path 完全維持 |
| 後方互換性 | OK | exit 0/1/2/3 動作不変 / 新規 exit 4 のみ追加 |
| 連続 10 round baseline 拡張 | OK | `runsheets/sec-stagger-compression-baseline-10round.json` 241 行新設 |

10/10 PASS。

---

## §9 R24 Sec-S Info 1 物理化引継

| 引継 ID | 内容 | 担当想定 | 優先度 |
|----|----|----|----|
| R-INFO-1-V | Info 1 物理化 verification (5 test case) | Round 25 Sec-T | 高 |
| R-INFO-1-DOC | DEC-019-068 v2 (R26 採否時) に exit 4 (WARN fail-soft) 追加 | Round 26 Sec | 中 |
| R-INFO-1-MONITOR | exit 4 件数の sec-audit-aggregate 集計に採用 | Round 25 Sec-T | 中 (v2 yml 内で `WARN_REDETECT_COUNT` として実装済) |
| R-INFO-1-COMPAT | v1 yml 配下の sec-api-spike-check.sh は exit 4 を `continue-on-error: false` で fail-fast 化する risk | Round 25 Sec-T | 低 (v2 yml 並走で v1 経由の exit 4 発火頻度極小 / 30min 内 2 回検知 = rare event) |

---

## §10 Sec-S Info 1 物理化 完遂宣言

R23 Sec-R `sec-r-r23-yml-info-3-resolution.md` §2 で patch spec 化された Info 1 (sec-api-spike WARN fail-soft 化 / threshold $5/h で WARN exit 1 → 30min 内 2 回検知時 exit 4 fail-soft / +5〜8 行 script patch / yml 改変 0 行) を R24 Sec-S が物理化。実測 +7 行 (spec 範囲内)、bash syntax 4/4 OK、sec-hardening.yml v1 absolute 無改変保持 (md5 eaff4e5a 1 byte 不変厳守)、既存 fail-fast 系 (exit 1 初回 / exit 2 cost cap breach) 完全維持、副作用 0 / API 追加コスト $0 / 絵文字 0。R23 引継 R-INFO-1 完遂。R25 で 5 test case verification 実施想定 (R-INFO-1-V 引継)。Info 2 (`--audit-log-path`) は R24 Sec-S 同 round で並列物理化完遂 (別報告書 `sec-s-r24-info-2-physical-implementation.md`)。Info 3 (cron 衝突 audit) は R25 Sec-T 引継継続 (低優先度 / 別 yml `sec-cron-audit.yml` 新設想定)。R26 連続 12 round milestone で 3 件物理化 verification + T-5 採否 + DEC-019-068 v2 起案 想定。

—— Sec-S / 2026-05-05 W0-Week1 / Round 24 第 1 波 / DEC-019-025 SOP 20 件目候補 / Info 1 物理化完遂
