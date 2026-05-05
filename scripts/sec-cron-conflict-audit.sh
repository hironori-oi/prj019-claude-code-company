#!/usr/bin/env bash
# sec-cron-conflict-audit.sh — Sec-T R25 / DEC-019-068 Info 3 物理化 (R23 §4 + R24 R-INFO-3).
# 全 yml の cron schedule を抽出し衝突 path を列挙する read-only audit.
# 副作用 0 / API call 0 / network 0 / 既存 yml 改変 0.
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel)}"
SCAN_ROOT="${SCAN_ROOT:-${REPO_ROOT}}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/cron-conflict-audit-$(date -u +%Y%m%dT%H%M%SZ).log"
for arg in "$@"; do case "${arg}" in --audit-log-path=*) REPORT_FILE="${arg#*=}";; esac; done
echo "[sec-cron-conflict-audit] scan_root=${SCAN_ROOT}" | tee "${REPORT_FILE}"
mapfile -t YML_FILES < <(find "${SCAN_ROOT}" -type f \( -name '*.yml' -o -name '*.yaml' \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -print)
TMP_LIST=$(mktemp); trap 'rm -f "${TMP_LIST}"' EXIT
for f in "${YML_FILES[@]}"; do
  schedules=$( { grep -oE "cron:[[:space:]]*['\"]?[^'\"#]+['\"]?" "${f}" 2>/dev/null || true; } \
    | sed -E "s/cron:[[:space:]]*['\"]?//; s/['\"][[:space:]]*$//; s/[[:space:]]+$//")
  [[ -n "${schedules}" ]] && while IFS= read -r sch; do
    [[ -n "${sch}" ]] && printf '%s\t%s\n' "${sch}" "${f}" >> "${TMP_LIST}"
  done <<< "${schedules}"
done
total_yml=${#YML_FILES[@]}; total_schedules=$(wc -l < "${TMP_LIST}" | tr -d ' ')
echo "scanned_yml=${total_yml} cron_schedules=${total_schedules}" | tee -a "${REPORT_FILE}"
conflicts=0
if [[ "${total_schedules}" -gt 0 ]]; then
  echo "[cron listing]" | tee -a "${REPORT_FILE}"; sort "${TMP_LIST}" | tee -a "${REPORT_FILE}"
  while IFS=$'\t' read -r cnt sch; do
    if [[ "${cnt}" -ge 2 ]]; then
      echo "CONFLICT: schedule='${sch}' count=${cnt}" | tee -a "${REPORT_FILE}"
      grep -F "${sch}"$'\t' "${TMP_LIST}" | cut -f2 | sed 's/^/  - /' | tee -a "${REPORT_FILE}"
      conflicts=$((conflicts + 1))
    fi
  done < <(awk -F'\t' '{print $1}' "${TMP_LIST}" | sort | uniq -c | awk '{c=$1;$1="";sub(/^ /,"");print c"\t"$0}')
fi
if [[ "${conflicts}" -eq 0 ]]; then
  echo "RESULT: PASS (no cron conflict / read-only audit)" | tee -a "${REPORT_FILE}"; exit 0
fi
echo "RESULT: WARN (cron conflicts=${conflicts} / read-only / fail-soft)" | tee -a "${REPORT_FILE}"; exit 1
