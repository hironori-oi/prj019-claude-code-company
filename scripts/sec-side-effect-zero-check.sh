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
HEAD_REF="${HEAD_REF:-HEAD}"
REPORT_DIR="${REPORT_DIR:-${REPO_ROOT}/projects/PRJ-019/reports/_sec-automation}"
AUDIT_LOG="${AUDIT_LOG:-${REPO_ROOT}/projects/PRJ-019/scripts/sec-audit.log}"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/side-effect-zero-$(date -u +%Y%m%dT%H%M%SZ).log"

# Round 19 Sec-N R19 改善 §3.2-1: BASE_REF 既定値の明示的 fallback
#   優先順位 1: BASE_REF 環境変数で明示指定（CI で pull_request.base.sha 推奨）
#   優先順位 2: origin/main が存在すれば origin/main
#   優先順位 3: HEAD~1（単一 commit Round 想定の最終フォールバック）
# 採用ソースは REPORT_FILE / AUDIT_LOG に記録し、複数 commit Round の取りこぼし debug 容易化。
BASE_REF_SOURCE="explicit"
if [[ -z "${BASE_REF:-}" ]]; then
  if git -C "${REPO_ROOT}" rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
    BASE_REF="origin/main"
    BASE_REF_SOURCE="fallback:origin/main"
  else
    BASE_REF="HEAD~1"
    BASE_REF_SOURCE="fallback:HEAD~1"
  fi
fi

echo "[sec-side-effect-zero] base=${BASE_REF} head=${HEAD_REF} base_source=${BASE_REF_SOURCE}" | tee "${REPORT_FILE}"

# Round 19 Sec-N R19 改善 §3.2-2: SEC_OVERRIDE audit 記録 (JSONL append)
#   SEC_OVERRIDE=1 で違反検出を WARN 化（exit 0 で復帰）するとき、
#   timestamp / round / base_ref / user-hash / reason / violations 件数を 1 行 JSON として
#   sec-audit.log に追記する。PII 保護のため $USER は SHA-256 先頭 12 桁にハッシュ化。
audit_override() {
  local violations="$1"
  local ts user_raw user_hash reason round
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  user_raw="${USER:-${USERNAME:-unknown}}"
  if command -v sha256sum >/dev/null 2>&1; then
    user_hash="$(printf '%s' "${user_raw}" | sha256sum | cut -c1-12)"
  else
    user_hash="hash-unavail"
  fi
  reason="${SEC_OVERRIDE_REASON:-unspecified}"
  round="${ROUND:-R-unknown}"
  # JSON-safe escape（reason 内 " と \ のみ最小限）
  reason="${reason//\\/\\\\}"
  reason="${reason//\"/\\\"}"
  printf '{"ts":"%s","event":"sec_override","script":"sec-side-effect-zero-check","round":"%s","base_ref":"%s","base_source":"%s","user_hash":"%s","violations":%d,"reason":"%s"}\n' \
    "${ts}" "${round}" "${BASE_REF}" "${BASE_REF_SOURCE}" "${user_hash}" "${violations}" "${reason}" \
    >> "${AUDIT_LOG}"
}

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
  # Round 19 Sec-N R19 改善 §3.2-2: SEC_OVERRIDE 経路を script 上に明示
  if [[ "${SEC_OVERRIDE:-0}" == "1" ]]; then
    audit_override "${violations}"
    echo "RESULT: WARN (SEC_OVERRIDE=1, ${violations} violation(s) — audited to ${AUDIT_LOG})" | tee -a "${REPORT_FILE}"
    exit 0
  fi
  echo "RESULT: FAIL (${violations} violation(s))" | tee -a "${REPORT_FILE}"
  exit 1
fi
echo "RESULT: PASS (side-effect zero)" | tee -a "${REPORT_FILE}"
exit 0
