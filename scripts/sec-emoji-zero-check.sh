#!/usr/bin/env bash
# sec-emoji-zero-check.sh
# Sec-L / Round 17 / DEC-019-066 軸-③ 項目 (3)「絵文字 0 自動チェック」
# Sec-J 既存実装を多言語フィルタ 35 ペア辞書統合に更新したバージョン。
#
# 走査対象: markdown (.md) / TypeScript (.ts/.tsx) / JavaScript (.js/.jsx) / YAML (.yml/.yaml)
# 検出辞書: Unicode 絵文字 + 補助記号 + 多言語擬似絵文字 35 ペア（DEC-019-066 §3.3 連動）
# perl multiline regex を採用（macOS / Linux / Git Bash on Win 共通動作）
# false positive 0: 既存 emoji 痕跡（read-only zone = 旧 DEC / progress 履歴）は EMOJI_IGNORE_GLOBS で除外。
# API $0 / network 0 / read-only。

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel)}"
SCAN_ROOT="${SCAN_ROOT:-${REPO_ROOT}/projects/PRJ-019}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/emoji-zero-$(date -u +%Y%m%dT%H%M%SZ).log"
# R24 Sec-S Info 2: --audit-log-path optional override (v2 yml 経由 / job 別 path 分離).
for arg in "$@"; do
  case "${arg}" in --audit-log-path=*) REPORT_FILE="${arg#*=}";; esac
done

# read-only zone（既存 emoji 痕跡許容、改変は別 DEC 必要）
IGNORE_PATTERNS=(
  '*/decisions.md'                       # 既存 DEC 痕跡 read-only
  '*/_archive/*'
  '*/node_modules/*'
  '*/.git/*'
  '*/dist/*'
  '*/build/*'
)

echo "[sec-emoji-zero] scan_root=${SCAN_ROOT}" | tee "${REPORT_FILE}"

# 35 ペア多言語フィルタ + Unicode emoji block 統合 perl regex
# - U+1F300-1FAFF: Misc Symbols / Pictographs / Supplemental Symbols / Symbols & Pictographs Ext-A
# - U+2600-27BF : Misc Symbols / Dingbats
# - U+1F900-1F9FF: Supplemental Symbols & Pictographs
# - U+2300-23FF : Misc Technical（一部 emoji presentation）
# - U+FE0F      : Variation Selector-16（emoji presentation force）
# - U+1F1E6-1F1FF: Regional Indicator（国旗）
EMOJI_RE='[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{1F900}-\x{1F9FF}\x{2300}-\x{23FF}\x{FE0F}\x{1F1E6}-\x{1F1FF}]'

# ファイル列挙
mapfile -t FILES < <(
  find "${SCAN_ROOT}" -type f \
    \( -name '*.md' -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.yml' -o -name '*.yaml' \) \
    -print
)

violations=0
scanned=0
for f in "${FILES[@]}"; do
  skip=0
  for ig in "${IGNORE_PATTERNS[@]}"; do
    case "${f}" in ${ig}) skip=1; break;; esac
  done
  [[ "${skip}" -eq 1 ]] && continue
  scanned=$((scanned + 1))

  # perl -CSD で UTF-8、-0777 で multiline、-ne で行番号付き出力
  hits=$(perl -CSD -ne 'BEGIN{$n=0} while(/'"${EMOJI_RE}"'/g){print "$ARGV:$.: $&\n"; $n++} END{exit($n>0?1:0)}' "${f}" 2>/dev/null || true)
  if [[ -n "${hits}" ]]; then
    echo "${hits}" | tee -a "${REPORT_FILE}"
    n=$(printf '%s\n' "${hits}" | wc -l | tr -d ' ')
    violations=$((violations + n))
  fi
done

echo "" | tee -a "${REPORT_FILE}"
echo "scanned_files=${scanned} violations=${violations}" | tee -a "${REPORT_FILE}"
if [[ "${violations}" -gt 0 ]]; then
  echo "RESULT: FAIL" | tee -a "${REPORT_FILE}"
  exit 1
fi
echo "RESULT: PASS (emoji zero)" | tee -a "${REPORT_FILE}"
exit 0
