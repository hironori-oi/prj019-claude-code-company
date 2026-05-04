#!/usr/bin/env bash
# sec-api-spike-check.sh
# Sec-M / Round 18 / DEC-019-066 軸-③ 項目 (1)「API spike 検知自動化」
#
# 目的: ローカル audit log (JSONL) または settings/cost-cap.json から Anthropic spend
#       trajectory を解析し、(a) 1h 窓スパイク / (b) 月次 cap への到達速度逸脱 を検出。
# 入力:
#   AUDIT_LOG  ... JSONL 1 行 = 1 API call. 最低限 {"ts":<unix_ms>,"cost_usd":<float>,"kind":"<str>"}
#   COST_CAP   ... settings/cost-cap.json 形式 {"anthropic_monthly_cap_usd": 30, ...}
# 出力: reports/_sec-automation/api-spike-<UTCstamp>.log
# Exit code: 0=pass / 1=warn / 2=fail
# Cooldown: 同一 alert 連続発火 30 min 抑制（state file に最終発火 ts を保存）
# PII 保護: prompt body は読まず、kind ラベルのみ使用。kind は SHA-256 先頭 8 桁に hash 化して表示。
# API $0 / network 0 / read-only。POSIX shell 互換（bash 3.2+）。

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel)}"
AUDIT_LOG="${AUDIT_LOG:-${REPO_ROOT}/projects/PRJ-019/settings/anthropic-audit.jsonl}"
COST_CAP="${COST_CAP:-${REPO_ROOT}/projects/PRJ-019/settings/cost-cap.json}"
BASELINE="${BASELINE:-${REPO_ROOT}/projects/PRJ-019/scripts/sec-api-spike-baseline.json}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
STATE_DIR="${STATE_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation/_state}"
mkdir -p "${REPORT_DIR}" "${STATE_DIR}"
REPORT_FILE="${REPORT_DIR}/api-spike-$(date -u +%Y%m%dT%H%M%SZ).log"
COOLDOWN_FILE="${STATE_DIR}/api-spike-cooldown.state"

echo "[sec-api-spike] audit=${AUDIT_LOG} cap=${COST_CAP} baseline=${BASELINE}" | tee "${REPORT_FILE}"

# baseline 読込（threshold + cooldown_sec）
if [[ ! -f "${BASELINE}" ]]; then
  echo "ERROR: baseline.json not found: ${BASELINE}" | tee -a "${REPORT_FILE}"; exit 2
fi
read_json() { node -e "const j=require('${BASELINE}');process.stdout.write(String(j${1}))"; }
WARN_1H=$(read_json "['hour_window']['warn_usd']")
FAIL_1H=$(read_json "['hour_window']['fail_usd']")
WARN_TRAJ=$(read_json "['monthly_trajectory']['warn_ratio']")
COOLDOWN=$(read_json "['cooldown_sec']")

# audit log が無ければ pass（system 未稼働扱い）
if [[ ! -f "${AUDIT_LOG}" ]]; then
  echo "RESULT: PASS (no audit log yet — system pre-launch)" | tee -a "${REPORT_FILE}"; exit 0
fi

NOW_MS=$(node -e "process.stdout.write(String(Date.now()))")
HOUR_AGO_MS=$((NOW_MS - 3600000))

# 1h 窓 sum + 当月 sum + 当月日数進行率（30 日想定 linear）を node で算出
read SPIKE_1H MONTH_SUM PROJECTION_RATIO HASH_SUMMARY <<EOF_NODE
$(node <<'EOF'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const auditPath = process.env.AUDIT_LOG;
const capPath = process.env.COST_CAP;
const nowMs = Date.now();
const hourAgo = nowMs - 3600000;
const d = new Date(nowMs);
const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
const monthEnd = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
const monthElapsed = (nowMs - monthStart) / (monthEnd - monthStart);
let spike1h = 0, monthSum = 0;
const kindCounts = {};
const lines = fs.readFileSync(auditPath, 'utf8').split('\n').filter(Boolean);
for (const ln of lines) {
  try {
    const e = JSON.parse(ln);
    const ts = Number(e.ts);
    const cost = Number(e.cost_usd) || 0;
    if (ts >= monthStart) monthSum += cost;
    if (ts >= hourAgo) spike1h += cost;
    const kindRaw = String(e.kind || 'unknown');
    const kindHash = crypto.createHash('sha256').update(kindRaw).digest('hex').slice(0, 8);
    kindCounts[kindHash] = (kindCounts[kindHash] || 0) + 1;
  } catch (_) { /* skip malformed line */ }
}
let cap = 30;
try { cap = Number(JSON.parse(fs.readFileSync(capPath, 'utf8')).anthropic_monthly_cap_usd) || 30; }
catch (_) { /* default 30 */ }
const expected = cap * monthElapsed;
const ratio = expected > 0 ? (monthSum / expected) : 0;
const summary = Object.entries(kindCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([h, n]) => `${h}:${n}`)
  .join(',') || 'none';
process.stdout.write([spike1h.toFixed(4), monthSum.toFixed(4), ratio.toFixed(4), summary].join(' '));
EOF
)
EOF_NODE

echo "1h_window_usd=${SPIKE_1H} month_sum_usd=${MONTH_SUM} projection_ratio=${PROJECTION_RATIO}" | tee -a "${REPORT_FILE}"
echo "kind_top5_hash=${HASH_SUMMARY}" | tee -a "${REPORT_FILE}"

# cooldown 判定
now_epoch=$(date -u +%s)
last_alert=0
[[ -f "${COOLDOWN_FILE}" ]] && last_alert=$(cat "${COOLDOWN_FILE}" 2>/dev/null || echo 0)
since=$((now_epoch - last_alert))

# 判定
EXIT=0
REASON="PASS"
# fail: 1h > FAIL_1H
if node -e "process.exit((${SPIKE_1H} > ${FAIL_1H}) ? 0 : 1)"; then
  EXIT=2; REASON="FAIL 1h spike ${SPIKE_1H} > ${FAIL_1H}"
elif node -e "process.exit((${SPIKE_1H} > ${WARN_1H}) ? 0 : 1)"; then
  EXIT=1; REASON="WARN 1h spike ${SPIKE_1H} > ${WARN_1H}"
elif node -e "process.exit((${PROJECTION_RATIO} > ${WARN_TRAJ}) ? 0 : 1)"; then
  EXIT=1; REASON="WARN monthly trajectory ${PROJECTION_RATIO} > ${WARN_TRAJ}"
fi

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
