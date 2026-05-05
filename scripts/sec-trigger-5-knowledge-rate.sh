#!/usr/bin/env bash
# sec-trigger-5-knowledge-rate.sh
# Sec-V / Round 27 / DEC-019-068 T-5 物理化 IMPL 2/3 (R26 Sec-U spec §4 引数契約準拠).
# 目的: organization/knowledge/{patterns,decisions,pitfalls,playbooks}/*.md 4 ディレクトリの
#       round 内追加 entries 数 4 round moving average を計算し fail-soft 4 段階閾値で判定する.
# 入力: --baseline-json (round_history append-only) / --window-size (default 4) / --output-format json|text.
# 出力: stdout JSON (level / moving_average / window_size / observed) + REPORT_FILE tee log.
# Exit code: INFO/WARN/WARN+ = 0 (gate PASS) / FAIL = 1 (gate block) / argparse error = 2 / runtime error = 3.
# 副作用 0 / API call 0 / network 0 / 既存 path 改変 0 / read-only file count のみ (PII non-touch).
# PAT-064 Sec Hardening Automation 6 script 目 (sec-tests-pass-gate / sec-emoji-zero / sec-side-effect-zero
# / sec-api-spike-check / sec-cron-conflict-audit に続く 6 件目 / 5 sec script style 踏襲).
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
BASELINE_JSON="${BASELINE_JSON:-${REPO_ROOT}/projects/PRJ-019/runsheets/sec-trigger-5-baseline.json}"
WINDOW_SIZE="${WINDOW_SIZE:-4}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-json}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/trigger-5-$(date -u +%Y%m%dT%H%M%SZ).log"
for arg in "$@"; do
  case "${arg}" in
    --baseline-json=*) BASELINE_JSON="${arg#*=}";;
    --window-size=*) WINDOW_SIZE="${arg#*=}";;
    --audit-log-path=*) REPORT_FILE="${arg#*=}";;
    --output-format=*) OUTPUT_FORMAT="${arg#*=}";;
    --base-ref=*|--head-ref=*) ;;
    *) echo "ERROR: unknown arg '${arg}'" >&2; exit 2;;
  esac
done
if [[ ! -f "${BASELINE_JSON}" ]]; then
  echo "ERROR: baseline JSON not found: ${BASELINE_JSON}" | tee "${REPORT_FILE}" >&2; exit 3
fi
case "${WINDOW_SIZE}" in ''|*[!0-9]*) echo "ERROR: --window-size must be int" >&2; exit 2;; esac
echo "[sec-trigger-5-knowledge-rate] baseline=${BASELINE_JSON} window=${WINDOW_SIZE}" | tee "${REPORT_FILE}"
export BASELINE_JSON WINDOW_SIZE
read MA OBSERVED LEVEL EXIT_CODE <<EOF_NODE
$(node <<'EOF'
const fs = require('fs');
const baselinePath = process.env.BASELINE_JSON;
const window = Number(process.env.WINDOW_SIZE) || 4;
let baseline;
try { baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); }
catch (e) { console.error('runtime: baseline parse fail'); process.exit(3); }
const history = Array.isArray(baseline.round_history) ? baseline.round_history : [];
const slice = history.slice(-window);
const entries = slice.map(r => Number(r.knowledge_entries_added) || 0);
const sum = entries.reduce((a, b) => a + b, 0);
const ma = slice.length > 0 ? sum / slice.length : 0;
const t = baseline.thresholds || { info: 10.0, warn: 8.0, warn_plus: 6.0, fail: 4.0 };
let level, exitCode;
if (ma >= t.info) { level = 'INFO'; exitCode = 0; }
else if (ma >= t.warn) { level = 'WARN'; exitCode = 0; }
else if (ma >= t.warn_plus) { level = 'WARN_PLUS'; exitCode = 0; }
else { level = 'FAIL'; exitCode = 1; }
const observed = entries.join(',') || 'none';
process.stdout.write([ma.toFixed(2), observed, level, String(exitCode)].join(' '));
EOF
)
EOF_NODE
echo "moving_average=${MA} window_size=${WINDOW_SIZE} observed=${OBSERVED} level=${LEVEL}" | tee -a "${REPORT_FILE}"
if [[ "${OUTPUT_FORMAT}" == "json" ]]; then
  printf '{"level":"%s","moving_average":%s,"window_size":%s,"observed":"%s","baseline":"%s"}\n' \
    "${LEVEL}" "${MA}" "${WINDOW_SIZE}" "${OBSERVED}" "${BASELINE_JSON}" | tee -a "${REPORT_FILE}"
else
  echo "RESULT: ${LEVEL} (ma=${MA} / window=${WINDOW_SIZE} / observed=${OBSERVED})" | tee -a "${REPORT_FILE}"
fi
exit "${EXIT_CODE}"
