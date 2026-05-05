#!/usr/bin/env bash
# sec-tests-pass-gate.sh
# Sec-L / Round 17 / DEC-019-066 軸-③ 項目 (4)「tests PASS gate」
#
# baseline.json で harness / workspace / openclaw-runtime 各 baseline を一元管理し、
# Round 完遂時の vitest 実行結果と突合 → regression 検出時は exit 1 + Slack alert。
#
# baseline.json 形式 (sec-tests-baseline.json):
#   {
#     "harness":          { "baseline": 617, "updated_at": "2026-05-05", "round": "R17" },
#     "workspace":        { "baseline": 1503, ... },
#     "openclaw-runtime": { "baseline": 330,  ... }
#   }
#
# 自動 baseline 更新: --promote <suite> オプションで現行 PASS 値を baseline に昇格。
# Round 完遂 SOP に組込み（Sec runsheet §5）。
# API $0 / network: SLACK_WEBHOOK_URL 未設定なら skip（外部依存 0 で動作）。

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel)}"
BASELINE="${BASELINE:-${REPO_ROOT}/projects/PRJ-019/scripts/sec-tests-baseline.json}"
STREAK_FILE="${STREAK_FILE:-${REPO_ROOT}/projects/PRJ-019/scripts/sec-streak-state.json}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/tests-pass-gate-$(date -u +%Y%m%dT%H%M%SZ).log"

usage() { echo "Usage: $0 --suite <harness|workspace|openclaw-runtime> --pass <int> [--promote] [--require-streak <N>]"; exit 2; }

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
[[ -z "${SUITE}" || -z "${PASS}" ]] && usage

if [[ ! -f "${BASELINE}" ]]; then
  echo "baseline.json not found: ${BASELINE}" >&2; exit 3
fi

# node 1 行で JSON read（外部 jq 依存回避）
BASE=$(node -e "const j=require('${BASELINE}');process.stdout.write(String(j['${SUITE}']?.baseline??-1))")
if [[ "${BASE}" == "-1" ]]; then
  echo "unknown suite: ${SUITE}" >&2; exit 4
fi

echo "[sec-tests-pass-gate] suite=${SUITE} pass=${PASS} baseline=${BASE} promote=${PROMOTE}" | tee "${REPORT_FILE}"

# Round 19 Sec-N R19 改善 §3.4-1: Slack 不達検知（無音化を解消）
#   従来: `curl ... || true` で network 失敗を握りつぶし、alert 不達が log に残らなかった。
#   改善: curl exit code を捕捉、失敗時は REPORT_FILE に "SLACK: send_failed" を追記し、
#         グローバル変数 SLACK_FAILED=1 を立てる。最終的に gate 自体が PASS であっても
#         SLACK_FAILED=1 の場合は exit code 3 で抜ける（§3.4-1 不達無音化解消）。
SLACK_FAILED=0
slack_alert() {
  local msg="$1"
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    if ! curl -fsS -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"[Sec gate] ${msg}\"}" "${SLACK_WEBHOOK_URL}" >/dev/null 2>&1; then
      SLACK_FAILED=1
      echo "SLACK: send_failed msg=\"${msg}\"" | tee -a "${REPORT_FILE}"
    fi
  fi
}

# Round 19 Sec-N R19 改善 §3.4-2: 連続 N round streak 強制（--require-streak）
#   STREAK_FILE は { "<suite>": { "last_result": "PASS|FAIL", "streak": N, "updated_at": "..." } }
#   PASS の度に streak をインクリメント、FAIL でリセット。
#   --promote 実行時に --require-streak <N> 付きなら streak >= N を満たさないと exit 6。
update_streak() {
  local result="$1"
  local now today
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  today="$(date -u +%Y-%m-%d)"
  if [[ ! -f "${STREAK_FILE}" ]]; then
    echo '{}' > "${STREAK_FILE}"
  fi
  node -e "
    const fs=require('fs');const p='${STREAK_FILE}';
    const j=JSON.parse(fs.readFileSync(p,'utf8'));
    const s=j['${SUITE}']||{last_result:'',streak:0,updated_at:''};
    if('${result}'==='PASS'){s.streak=(s.last_result==='PASS'?s.streak:0)+1;}
    else{s.streak=0;}
    s.last_result='${result}';s.updated_at='${now}';
    j['${SUITE}']=s;
    fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
  "
}

read_streak() {
  if [[ ! -f "${STREAK_FILE}" ]]; then echo 0; return; fi
  node -e "
    const fs=require('fs');const p='${STREAK_FILE}';
    const j=JSON.parse(fs.readFileSync(p,'utf8'));
    process.stdout.write(String(j['${SUITE}']?.streak??0));
  "
}

if [[ "${PROMOTE}" -eq 1 ]]; then
  # 自動 baseline 更新 SOP: Round 完遂で全 4 項目 PASS 確認後に CEO 承認下で実行
  if [[ "${PASS}" -lt "${BASE}" ]]; then
    echo "ERROR: cannot promote — pass(${PASS}) < baseline(${BASE})" | tee -a "${REPORT_FILE}"; exit 5
  fi
  # §3.4-2: --require-streak が指定されていれば streak 数を満たすことを強制
  if [[ "${REQUIRE_STREAK}" -gt 0 ]]; then
    cur_streak="$(read_streak)"
    if [[ "${cur_streak}" -lt "${REQUIRE_STREAK}" ]]; then
      echo "ERROR: streak guard — current=${cur_streak} required=${REQUIRE_STREAK}" | tee -a "${REPORT_FILE}"
      exit 6
    fi
    echo "STREAK OK: ${SUITE} streak=${cur_streak} >= ${REQUIRE_STREAK}" | tee -a "${REPORT_FILE}"
  fi
  TODAY=$(date -u +%Y-%m-%d)
  ROUND="${ROUND:-R-unknown}"
  node -e "
    const fs=require('fs');const p='${BASELINE}';const j=JSON.parse(fs.readFileSync(p,'utf8'));
    j['${SUITE}']={baseline:${PASS},updated_at:'${TODAY}',round:'${ROUND}'};
    fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
  "
  echo "PROMOTED: ${SUITE} ${BASE} -> ${PASS} (round=${ROUND})" | tee -a "${REPORT_FILE}"
  slack_alert "baseline promoted ${SUITE} ${BASE} -> ${PASS}"
  if [[ "${SLACK_FAILED}" -eq 1 ]]; then
    echo "RESULT: PROMOTE OK but SLACK send_failed (exit 3)" | tee -a "${REPORT_FILE}"
    exit 3
  fi
  exit 0
fi

# regression gate: PASS 数 < baseline で FAIL
if [[ "${PASS}" -lt "${BASE}" ]]; then
  msg="REGRESSION ${SUITE}: pass=${PASS} < baseline=${BASE}"
  echo "${msg}" | tee -a "${REPORT_FILE}"
  slack_alert "${msg}"
  update_streak "FAIL"
  exit 1
fi

# 増加分は記録のみ（promote しない限り baseline 据え置き）
delta=$((PASS - BASE))
echo "RESULT: PASS ${SUITE} pass=${PASS} baseline=${BASE} delta=+${delta}" | tee -a "${REPORT_FILE}"
update_streak "PASS"
new_streak="$(read_streak)"
echo "STREAK: ${SUITE} streak=${new_streak}" | tee -a "${REPORT_FILE}"
if [[ "${SLACK_FAILED}" -eq 1 ]]; then
  echo "RESULT: gate PASS but SLACK send_failed (exit 3)" | tee -a "${REPORT_FILE}"
  exit 3
fi
exit 0
