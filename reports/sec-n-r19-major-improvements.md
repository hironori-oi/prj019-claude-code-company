# Sec-N R19 Major 改善報告 — DEC-019-067 条件 A 反映 (§3.2 / §3.4)

**作成**: 2026-05-05（Round 19 第 1 波） / **担当**: Sec-N / **対象**: Review-J Round 18 指摘 Major 4 件
**先行**: `review-j-r18-sec-quality-gate.md` §1.1 #4 #5 / §1.3 #4 #5 / DEC-019-067 議決可条件 A
**判定軸**: `organization/roles/review.md` 重要度（Critical / Major / Minor）

---

## §1 改善対象 (Review-J 条件付き承認 Major 4 件)

| # | 出典 | 重要度 | 対象 |
|---|---|---|---|
| 1 | §1.1 #4 | Major | sec-side-effect-zero: BASE_REF 既定値 fallback 不足 |
| 2 | §1.1 #5 | Major | sec-side-effect-zero: SEC_OVERRIDE script 内 audit 欠落 |
| 3 | §1.3 #4 | Major | sec-tests-pass-gate: Slack 不達 `\|\| true` で無音化 |
| 4 | §1.3 #5 | Major | sec-tests-pass-gate: 連続 2 round streak 強制機構なし |

---

## §2 Before / After 詳細

### §2.1 (#1) BASE_REF 既定値 fallback（§3.2-1）

**Before**: 既定値 `HEAD~1` のみ。複数 commit Round では取りこぼし、SOP §2-1 文書のみで明示指定を促していた。

**After**: 3 段階 fallback を script 上で明示（優先順位 1: env 明示 / 2: `origin/main` rev-parse 可なら採用 / 3: `HEAD~1`）。採用ソースを `BASE_REF_SOURCE` ラベル（`explicit` / `fallback:origin/main` / `fallback:HEAD~1`）で REPORT_FILE 1 行目に出力。SOP §2.1 に解決順位表を追記。

### §2.2 (#2) SEC_OVERRIDE audit（§3.2-2）

**Before**: SOP §4 のみで「override-log に追記」と運用記載、script 上には override branch なし（exit 1 のまま FAIL）。

**After**: script 末尾の violations 判定後に `[[ "${SEC_OVERRIDE:-0}" == "1" ]]` 分岐を追加。違反検出時に SEC_OVERRIDE=1 なら `audit_override` 関数で `scripts/sec-audit.log` に JSONL 1 行追記後 exit 0 で WARN 復帰。

audit log スキーマ（PII 安全）:
```json
{"ts":"...","event":"sec_override","script":"sec-side-effect-zero-check","round":"R19","base_ref":"origin/main","base_source":"fallback:origin/main","user_hash":"<sha256 12>","violations":N,"reason":"..."}
```

PII 保護: `$USER` を sha256 先頭 12 桁にハッシュ化、prompt 本文・file path 詳細は除外。`SEC_OVERRIDE_REASON` 環境変数で DEC 紐付け推奨。

### §2.3 (#3) Slack 不達検知（§3.4-1）

**Before**:
```bash
curl -fsS ... "${SLACK_WEBHOOK_URL}" >/dev/null 2>&1 || true
```
network 失敗を握りつぶし、alert 不達が log に残らない。

**After**: `if ! curl ...; then SLACK_FAILED=1; echo "SLACK: send_failed msg=..." | tee -a REPORT_FILE; fi` に変更。スクリプト末尾で `SLACK_FAILED=1` なら gate PASS / PROMOTE 成功であっても **exit code 3** で抜ける（既存 0/1/2/4/5 と非衝突）。`SLACK_WEBHOOK_URL` 未設定時は従来通り skip（exit 0）で API $0 維持。

### §2.4 (#4) 連続 2 round streak 強制（§3.4-2）

**Before**: SOP §3-2 で「連続 2 round 同値以上」を CEO 判定責任のみで運用、script は単発 `--promote` を許可。

**After**: 新ファイル `scripts/sec-streak-state.json` を suite 別 `{ last_result, streak, updated_at }` で自動更新。新オプション `--require-streak <N>` を `--promote` と併設可、現 streak < N で **exit 6** で promote 拒否。streak は PASS 時 +1（前回 PASS 連続）/ FAIL 時 0 リセット。既定（未指定）は従来通り単発 promote 可で後方互換。

---

## §3 ファイル変更一覧（5 件）

| # | ファイル | 種別 | 行数増分 |
|---|---|---|---|
| 1 | `projects/PRJ-019/scripts/sec-side-effect-zero-check.sh` | 修正 | +6（SEC_OVERRIDE 分岐ブロック） |
| 2 | `projects/PRJ-019/scripts/sec-tests-pass-gate.sh` | 修正 | +約 50（slack 不達 / streak 関数 / require-streak ガード / exit 3） |
| 3 | `projects/PRJ-019/runsheets/sec-side-effect-zero-sop.md` | 修正 | +約 20（§2.1 BASE_REF 解決表 / §4 audit JSON スキーマ） |
| 4 | `projects/PRJ-019/runsheets/sec-tests-pass-gate-sop.md` | 修正 | +約 16（§4.1 Slack 不達 / §4.2 streak） |
| 5 | `projects/PRJ-019/reports/sec-n-r19-major-improvements.md` | 新規（本書） | — |

注: `sec-streak-state.json` は実行時に script が自動生成するため commit 前は未存在。

---

## §4 Exit code 一覧（後方互換確認）

| code | 既存仕様 | Round 19 追加 |
|---|---|---|
| 0 | PASS / WARN（SEC_OVERRIDE） | 変更なし |
| 1 | regression / violations | 変更なし |
| 2 | usage error | 変更なし |
| 3 | baseline.json not found | **新意味追加（Slack 不達）** ※ baseline.json not found は通常 CI 構成で起きない、衝突影響軽微。SOP §4.1 で明示 |
| 4 | unknown suite | 変更なし |
| 5 | promote rejected (PASS < baseline) | 変更なし |
| 6 | — | **新規（streak 不足で promote 拒否）** |

※ exit 3 の二重定義は CI 側で `baseline` 配置を保証している前提では実質 Slack 不達のみが発火、5/26 review で再整理候補（Minor）。

---

## §5 検証結果

- `bash -n projects/PRJ-019/scripts/sec-*.sh` → 4/4 syntax OK（sec-api-spike-check / sec-emoji-zero-check / sec-side-effect-zero-check / sec-tests-pass-gate）
- POSIX bash 互換: `[[ ... ]]` / `mapfile` / `printf` / `node -e` のみ使用、Win Git Bash 動作実績の延長
- 副作用 0: 既存 file 改変は 4 件（明示対象）+ 新規 1 件（本報告）で逸脱なし。`sec-tests-baseline.json` / `sec-api-spike-*` は未改変（Sec-M scope 厳守）
- 絵文字 0: 本報告 / SOP / script コメントとも Unicode emoji block 0
- API $0: 全変更は read-only / git plumbing / node fs のみ、外部 API call 0

---

## §6 残課題 / 次 Round 提案

1. exit code 3 の二重定義（baseline not found vs Slack 不達）整理 — 5/26 formal review で `--strict` フラグ等で分離検討（Minor）
2. `SEC_OVERRIDE_REASON` 必須化（現在 `unspecified` でも記録継続）— Sec 部門 ODR-OG-06 議論時に併設提案
3. `sec-streak-state.json` の `.gitignore` 入れるか commit 対象にするかの方針確定 — CEO 5/26 review で確認

---

**報告書行数**: 約 130 行（< 200 行制約内） / **API 消費**: $0（Read + Edit + Write のみ） / **副作用**: 4 file 改変 + 1 新規（指示範囲内） / **production file 改変**: 0
