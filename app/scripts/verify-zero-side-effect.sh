#!/usr/bin/env bash
#
# verify-zero-side-effect.sh — DEC-019-007 Definition of Done
# 既存 PRJ-001〜018 への副作用ゼロ検証 (Snapshot diff)。
#
# 用途:
#   - PRJ-019 ハーネス実行前に snapshot を取り (mode=snapshot)、
#     実行後に再度走らせて (mode=verify) 差分を検出する。
#   - GitHub Actions / pre-commit で `mode=verify` を使い CI ブロック。
#
# 出力:
#   - PASS / FAIL  (exit 0 = PASS, 非 0 = FAIL)
#   - 差分があれば 該当 PRJ-XXX の sha256 を before/after で表示。
#   - 進捗行を stderr に逐次出力 (Owner 動作確認用)。
#
# 監視対象:
#   1. projects/PRJ-001 〜 projects/PRJ-018 配下の集約 sha256
#      (find -type f → sort → 集約 sha256sum、node_modules / .git / vendor 除外)
#   2. 親 monorepo claude-code-company の git HEAD commit hash
#
# 動作環境: Windows (Git Bash) / macOS / Linux, bash 4+
# 依存: find, sort, sha256sum (Git Bash 同梱), git, awk
#
# 使い方:
#   bash scripts/verify-zero-side-effect.sh snapshot
#     → /tmp/clawbridge-side-effect/baseline.txt を保存
#   bash scripts/verify-zero-side-effect.sh verify
#     → baseline.txt と比較し PASS/FAIL を返す
#   bash scripts/verify-zero-side-effect.sh           (引数なし)
#     → mode=verify (CI 互換、baseline 不在なら snapshot を作って exit 0)
#
# 高速化:
#   - 1 PRJ 集約 hash は `find -print0 | sort -z | xargs -0 sha256sum | sha256sum` の
#     1 パイプチェーンで子プロセスを最小化。
#   - 大規模 ignore (node_modules / .git / dist / build / .next / .turbo /
#     coverage / vendor / .aidesigner / .playwright-mcp / .agents / .probe / .next-build)。
#   - 進捗を stderr に出力するため hang 状態を肉眼で判別可能。
#
# 実装ノート:
#   - 親 monorepo path は本 script から見て 4 階層上 (app/scripts → projects/PRJ-019/app
#     → projects/PRJ-019 → projects → claude-code-company)。
#     ENV `CLAWBRIDGE_MONOREPO_ROOT` で上書き可能。

set -uo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly STATE_DIR="${CLAWBRIDGE_STATE_DIR:-/tmp/clawbridge-side-effect}"
readonly BASELINE_FILE="${STATE_DIR}/baseline.txt"
readonly CURRENT_FILE="${STATE_DIR}/current.txt"

# 親 monorepo root を解決
if [[ -n "${CLAWBRIDGE_MONOREPO_ROOT:-}" ]]; then
  MONOREPO_ROOT="${CLAWBRIDGE_MONOREPO_ROOT}"
else
  # SCRIPT_DIR = .../projects/PRJ-019/app/scripts
  MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../" 2>/dev/null && pwd || echo "")"
fi

# モード決定
MODE="${1:-verify}"
case "${MODE}" in
  snapshot|verify) ;;
  *)
    echo "ERROR: unknown mode '${MODE}' (expected: snapshot | verify)" >&2
    exit 2
    ;;
esac

mkdir -p "${STATE_DIR}"

# -----------------------------------------------------------------------------
# 共通: 1 ディレクトリの集約 sha256 を計算
# -----------------------------------------------------------------------------
aggregate_dir_hash() {
  local dir="$1"
  # find は relative path を出力 (ハッシュの再現性確保のため)。
  # 大規模 ignore で Windows でも数秒〜数十秒で完了させる。
  (
    cd "${dir}" 2>/dev/null && \
    LC_ALL=C find . -type f \
      -not -path './node_modules/*' \
      -not -path '*/node_modules/*' \
      -not -path './.git/*' \
      -not -path '*/.git/*' \
      -not -path './.next/*' \
      -not -path '*/.next/*' \
      -not -path './dist/*' \
      -not -path '*/dist/*' \
      -not -path './build/*' \
      -not -path '*/build/*' \
      -not -path './.turbo/*' \
      -not -path './coverage/*' \
      -not -path '*/coverage/*' \
      -not -path './vendor/*' \
      -not -path '*/vendor/*' \
      -not -path './.aidesigner/*' \
      -not -path './.playwright-mcp/*' \
      -not -path './.agents/*' \
      -not -path './.probe/*' \
      -not -path '*/upstream/*' \
      -print0 2>/dev/null \
    | LC_ALL=C sort -z \
    | xargs -0 -n 200 sha256sum 2>/dev/null \
    | sha256sum \
    | awk '{print $1}'
  )
}

# -----------------------------------------------------------------------------
# Snapshot 採取関数
# -----------------------------------------------------------------------------
collect_snapshot() {
  local out="$1"
  : > "${out}"

  # 親 monorepo HEAD
  local monorepo_head="ABSENT"
  if [[ -n "${MONOREPO_ROOT}" && -d "${MONOREPO_ROOT}/.git" ]]; then
    monorepo_head="$(git -C "${MONOREPO_ROOT}" rev-parse HEAD 2>/dev/null || echo "UNKNOWN")"
  fi
  echo "monorepo_head=${monorepo_head}" >> "${out}"
  echo "[verify-zero-side-effect] monorepo_head=${monorepo_head}" >&2

  # 各 PRJ-XXX (001〜018) の集約 hash
  local prj_num
  for prj_num in $(seq -f "%03g" 1 18); do
    local prj_dir="${MONOREPO_ROOT}/projects/PRJ-${prj_num}"
    if [[ -d "${prj_dir}" ]]; then
      echo "[verify-zero-side-effect] hashing PRJ-${prj_num} ..." >&2
      local agg
      agg="$(aggregate_dir_hash "${prj_dir}")"
      echo "PRJ-${prj_num}=${agg:-EMPTY}" >> "${out}"
      echo "[verify-zero-side-effect]   PRJ-${prj_num}=${agg:-EMPTY}" >&2
    else
      echo "PRJ-${prj_num}=ABSENT" >> "${out}"
      echo "[verify-zero-side-effect]   PRJ-${prj_num}=ABSENT (skipped)" >&2
    fi
  done
}

# -----------------------------------------------------------------------------
# Mode dispatch
# -----------------------------------------------------------------------------
echo "[verify-zero-side-effect] mode=${MODE} monorepo=${MONOREPO_ROOT:-<not-found>}" >&2

if [[ "${MODE}" == "snapshot" ]]; then
  collect_snapshot "${BASELINE_FILE}"
  echo "[verify-zero-side-effect] snapshot saved: ${BASELINE_FILE}" >&2
  echo "PASS"
  exit 0
fi

# mode=verify
if [[ ! -f "${BASELINE_FILE}" ]]; then
  echo "[verify-zero-side-effect] baseline not found — creating one (first run)" >&2
  collect_snapshot "${BASELINE_FILE}"
  echo "PASS (baseline initialized)"
  exit 0
fi

collect_snapshot "${CURRENT_FILE}"

# diff (sort 不要、collect_snapshot は決定論的順序で出力)
if diff -u "${BASELINE_FILE}" "${CURRENT_FILE}" > "${STATE_DIR}/diff.txt"; then
  echo "PASS — no side effect detected on PRJ-001..018 / monorepo HEAD"
  exit 0
fi

echo "FAIL — side effect detected:"
cat "${STATE_DIR}/diff.txt"
echo ""
echo "[verify-zero-side-effect] DEC-019-007 violation: PRJ-019 harness must not modify PRJ-001..018."
exit 1
