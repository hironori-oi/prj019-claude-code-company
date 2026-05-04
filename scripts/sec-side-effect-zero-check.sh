#!/usr/bin/env bash
# sec-side-effect-zero-check.sh
# Sec-L / Round 17 / DEC-019-066 軸-③ 項目 (2)「副作用 0 自動検証」
#
# 目的: Round 完遂直後の git diff から「副作用候補」を自動検出して PASS/FAIL を決定する。
# 検出対象:
#   (a) 既存テストファイル (*.test.ts / *.spec.ts) の DELETE / RENAME
#   (b) 既存 schema (*.sql / prisma / drizzle / supabase migrations) の改変
#   (c) lock ファイル (package-lock.json / pnpm-lock.yaml / bun.lockb) の改変
#   (d) `.env*` / credentials.json / *.pem / *.key の追加・改変
#
# 想定 artifact だけが diff に出ている状態 = PASS。それ以外を 1 件でも検出すれば FAIL。
# CI integration: GitHub Actions / pre-push hook から呼び出し、exit code で gate。
# API $0 / network 0 / 既存ファイル改変 0（read-only な git plumbing のみ）。

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel)}"
BASE_REF="${BASE_REF:-HEAD~1}"   # Round 完遂前 commit を上書き可
HEAD_REF="${HEAD_REF:-HEAD}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/side-effect-zero-$(date -u +%Y%m%dT%H%M%SZ).log"

echo "[sec-side-effect-zero] base=${BASE_REF} head=${HEAD_REF}" | tee "${REPORT_FILE}"

# 全変更ファイルを status 付きで取得（A=add, M=modify, D=delete, R=rename）
mapfile -t CHANGES < <(git -C "${REPO_ROOT}" diff --name-status "${BASE_REF}..${HEAD_REF}")

violations=0
record() { echo "VIOLATION: $1" | tee -a "${REPORT_FILE}"; violations=$((violations + 1)); }

for line in "${CHANGES[@]}"; do
  status="${line%%$'\t'*}"
  rest="${line#*$'\t'}"
  path="${rest%%$'\t'*}"

  # (a) 既存テスト破壊 (DELETE / RENAME)
  if [[ "${status:0:1}" =~ ^[DR]$ ]] && [[ "${path}" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    record "(a) test removed/renamed: ${status} ${path}"
  fi

  # (b) schema 改変
  if [[ "${path}" =~ (\.sql$|/migrations/|prisma/schema\.prisma$|drizzle\.config\.|supabase/migrations/) ]]; then
    record "(b) schema changed: ${status} ${path}"
  fi

  # (c) lock ファイル改変
  if [[ "${path}" =~ (package-lock\.json|pnpm-lock\.yaml|bun\.lockb|yarn\.lock)$ ]]; then
    record "(c) lockfile changed: ${status} ${path}"
  fi

  # (d) secret / credential 追加
  if [[ "${path}" =~ (^|/)\.env($|\.) ]] || [[ "${path}" =~ (credentials\.json|\.pem$|\.key$) ]]; then
    record "(d) secret/credential touched: ${status} ${path}"
  fi
done

echo "" | tee -a "${REPORT_FILE}"
if [[ "${violations}" -gt 0 ]]; then
  echo "RESULT: FAIL (${violations} violation(s))" | tee -a "${REPORT_FILE}"
  exit 1
fi
echo "RESULT: PASS (side-effect zero)" | tee -a "${REPORT_FILE}"
exit 0
