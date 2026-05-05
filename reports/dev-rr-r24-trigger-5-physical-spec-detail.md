# PRJ-019 Round 24 Dev-RR — DEC-019-068 trigger 5 件目 (T-5) 物理化 spec 詳細化報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Dev 部門 R24 Dev-RR (research との cross 領域) / DEC-019-025 SOP 19 件目候補 (継続深化 / R23 Sec-R 候補 spec → R24 Dev-RR 物理化 spec)
位置付け: Round 23 Sec-R が確定した DEC-019-068 trigger 5 件目候補 spec (T-5 = knowledge entry 平均増加率 >= 8 件/round / spec 行数 242) を、Round 24 Dev-RR が **物理化レベル詳細化** に格上げ。R26 formal 採否 → R27 script 物理化 → R28 yml 統合 の 3 round 物理化ロードマップに直結する measurement script 設計案 / 閾値数値 / rolling window 仕様 / DEC-019-033 連動 path / bash + jq syntax draft を 6 軸で確定する。
版: v1.0
連動 DEC: DEC-019-025 / 033 / 049 / 066 / 068
連動 spec (絶対無改変): `projects/PRJ-019/reports/sec-r-r23-trigger-5-candidate-spec.md` (R23 Sec-R / 242 行 / 4 候補 + T-5 spec)
連動 baseline (絶対無改変): `projects/PRJ-019/runsheets/sec-stagger-compression-baseline-9round.json` (R23 / 170-180 行 / 9 round)
連動 INDEX (絶対無改変): `organization/knowledge/INDEX-v12.md` (R22 → R23 / 633 行 / 120 entries)
物理化対象 file (R26-R28 想定 / R24 では実装しない):
- `projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh` (R27 物理化 / 60-80 行 bash)
- `projects/PRJ-019/scripts/sec-trigger-5-baseline.json` (R27 物理化 / 30-50 行 baseline JSON)
- `.github/workflows/sec-hardening.yml` (R28 / 5 件目 job 統合)

---

## §0 サマリ (CEO 200 字)

Round 24 第 2 波第 2 列 Dev-RR は research との cross 領域として R23 Sec-R 候補 spec (242 行) を物理化レベルに詳細化。T-5 = 「knowledge entry 平均増加率 >= 8 件/round」を 6 軸で物理化 spec 化: (1) measurement script 設計案 = bash + jq で `INDEX-v(X).md → INDEX-v(X+1).md` 差分 entries 数 + canonical alias 数 + tag 増加 を計測 / (2) fail-soft 4 段階閾値の数値化 = INFO >= 10 / WARN < 8 / WARN+ < 6 / FAIL < 4 / (3) baseline 期間 = 直近 4 round の moving average で smoothing / (4) DEC-019-033 ナレッジ抽出機構連動 path = `organization/knowledge/{patterns,decisions,pitfalls,playbooks}/*.md` 4 ディレクトリ参照 / (5) bash 60-80 行 + jq 30-40 行の syntax draft (実装は R27) / (6) 物理 file path 案 = `projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh` + `sec-trigger-5-baseline.json`。R23 spec 242 行は absolute 無改変 / 9 round baseline JSON absolute 無改変 / INDEX-v12 absolute 無改変 / API 追加コスト $0 / 副作用 0 / 絵文字 0 / bash + jq draft only (R27 で物理化、R24 では実装しない)。R26 formal 採否時の base spec として提出可能な水準まで詳細化完遂。

---

## §1 R23 Sec-R 候補 spec の継承と物理化拡張

### 1.1 R23 spec 4 軸 → R24 物理化 spec 6 軸の対応

| R23 Sec-R spec 軸 (242 行) | R24 Dev-RR 物理化拡張 | 詳細化 delta |
|---|---|---|
| §4.1 trigger 定義 (yaml block 21 行) | §3 measurement script 設計 + §4 fail-soft 数値閾値 | yaml → bash + jq への変換 |
| §4.2 PASS 条件 (基本/計算単位/平均化窓/違反判定) | §5 rolling window 4 round moving average 仕様 | 移動平均窓 3 → 4 round 拡張 (smoothing 強化) |
| §4.3 fail-soft 4 段階 (INFO/WARN/WARN+/FAIL) | §4 数値境界閾値の確定 (10 / 8 / 6 / 4) | 数値化 |
| §4.4 既存 trigger 連動 (T-1-4 overlap なし) | §7 既存 yml 5 件目 job 統合経路 | yml 統合 path |
| §4.5 物理化想定 (R26-R28 表) | §8 R26-R28 物理化詳細 (本報告書 + 別 roadmap 報告書) | 詳細化 |
| (R23 にはなし) | §6 DEC-019-033 ナレッジ抽出機構連動 path | 4 ディレクトリ参照体系明記 |

### 1.2 absolute 無改変対象の確認

| file | 状態 | 確認 |
|---|---|---|
| `reports/sec-r-r23-trigger-5-candidate-spec.md` | 242 行 (R23 Sec-R / 絶対無改変) | OK / R24 で参照のみ |
| `runsheets/sec-stagger-compression-baseline-9round.json` | 170-180 行 (R23 Sec-R / 絶対無改変) | OK / R24 で参照のみ |
| `organization/knowledge/INDEX-v12.md` | 633 行 / 120 entries (R22 → R23 / 絶対無改変) | OK / R24 で参照のみ |
| `.github/workflows/sec-hardening.yml` | 291 行 (R21 物理化 / R22 verification PASS / 絶対無改変) | OK / R24 で参照のみ |
| `projects/PRJ-019/scripts/sec-*.sh` (4 script) | 既存 (R18-19 物理化 / 絶対無改変) | OK / R24 で参照のみ |

---

## §2 T-5 物理化 spec — 全体像

### 2.1 物理化 6 軸サマリ

| 軸 | 内容 | 物理化レベル | R26-R28 担当 |
|---|---|---|---|
| 1 | measurement script 設計案 (bash + jq) | draft (60-80 + 30-40 行) | R27 Sec |
| 2 | fail-soft 4 段階数値閾値 (INFO/WARN/WARN+/FAIL) | spec 確定 | R26 Sec (formal 採否) |
| 3 | rolling window 4 round moving average | spec 確定 | R26 Sec |
| 4 | DEC-019-033 ナレッジ抽出機構連動 path | spec 確定 | R26 Sec (path 連動 verify) |
| 5 | bash + jq syntax draft | draft (実装なし) | R27 Sec (実装) |
| 6 | 物理 file path 案 | spec 確定 | R27 Sec (file 起案) |

### 2.2 既存 sec script 4 件との整合

R23 Sec-R 確認済の既存 4 script (`sec-api-spike-check.sh` / `sec-emoji-zero-check.sh` / `sec-side-effect-zero-check.sh` / `sec-tests-pass-gate.sh`) の構造 (bash + 副作用 0 + 絵文字 0 + tests PASS gate) を 5 件目 `sec-trigger-5-knowledge-rate.sh` でも踏襲する。PAT-064 (Sec Hardening Automation 3-Script Bundle / INDEX-v12 §0.1) 準拠で外部依存追加 0 を維持。

---

## §3 measurement script 設計案 (軸 1)

### 3.1 計測対象 3 系統

| 系統 | 対象 | 計測方法 |
|---|---|---|
| **a. entries 数差分** | `organization/knowledge/{patterns,decisions,pitfalls,playbooks}/*.md` | `git diff --name-only --diff-filter=A <BASE_REF>...<HEAD_REF>` |
| **b. canonical alias 数** | INDEX-v(X).md → INDEX-v(X+1).md の `0.X` セクション entries 行 count | `grep -c '^| \*\*' INDEX-v*.md` (太字 alias 行) |
| **c. tag 増加** | INDEX YAML frontmatter `tags: [...]` 配列長 + `_meta/tags.yaml` taxonomy entries | `yq '.tags \| length' INDEX-vX.md` (or jq 互換手法) |

### 3.2 計測 flow

```
[step 1] BASE_REF (前 round 着地 commit) を git log で特定
[step 2] HEAD_REF (現 round 着地 commit) を HEAD で取得
[step 3] git diff --diff-filter=A で 4 ディレクトリ新規 .md file 数を取得 (=系統 a)
[step 4] INDEX 最新版 (INDEX-v(X+1).md) と前版 (INDEX-v(X).md) の diff を取得 (=系統 b)
[step 5] tags array 長 diff を jq で算出 (=系統 c)
[step 6] 系統 a の値を primary metric として採用 (b/c は補助 audit)
[step 7] 直近 4 round moving average を baseline JSON から読込 + 計算
[step 8] §4 4 段階閾値で判定 (INFO/WARN/WARN+/FAIL)
[step 9] 結果を JSON 出力 + exit code (INFO/WARN=0, WARN+/FAIL=1)
```

### 3.3 副作用 0 / API call 0 の保証

- すべての操作は **read-only** (`git diff`, `git log`, `cat`, `jq`, `wc -l`)
- 外部 API call なし (Anthropic / Vercel / Supabase いずれも touch なし)
- 出力は stdout の JSON のみ (file write はオプションで `--output` 指定時のみ)

---

## §4 fail-soft 4 段階数値閾値 (軸 2)

### 4.1 閾値テーブル

| level | 条件 (4 round moving average) | gate 動作 | exit code | 通知先 |
|---|---|---|---|---|
| **INFO** | avg >= 10 件/round | log のみ / gate PASS | 0 | (なし) |
| **WARN** | 8 <= avg < 10 件/round | Slack 通知 / gate PASS | 0 | Slack #sec-warn |
| **WARN+** | 6 <= avg < 8 件/round | dashboard escalation / gate PASS | 0 | dashboard + Slack #sec-warn |
| **FAIL** | avg < 6 件/round / 連続 2 round 違反 | gate FAIL / merge ブロック | 1 | dashboard + Slack #sec-fail + CEO escalation |

### 4.2 R23 spec との対応

R23 Sec-R spec §4.3 fail-soft 4 段階:
- 1 round 違反 → INFO (log のみ / gate PASS)
- 2 round 違反 (連続) → WARN (Slack 通知 / gate PASS)
- 3 round 違反 (連続) → WARN+ (dashboard escalation / gate PASS)
- 4 round 違反 (連続) → FAIL (gate FAIL / merge ブロック)

R24 物理化 spec ではこの「連続 violation 数」軸を **moving average 値** に変換することで 1 round 単位の偏差を smoothing し、誤検知率を下げる。具体的には:

- 移動平均窓 = 4 round (最新 round + 直近 3 round)
- 単 round の偏差 (例: R24 で 5 件 / R25 で 12 件) は moving average で吸収
- 連続 4 round 違反 (4 round 全てで 6 件未満) で FAIL に到達

### 4.3 R23 spec の `pass_threshold: 8.0` との整合

R23 spec の単一閾値 `8.0` 件/round は本 spec で **WARN/INFO 境界** として保持。WARN+ (< 8) / FAIL (< 6) は R23 spec §4.3 の fail-soft 段階を数値化したものであり、R23 spec を **変更せず詳細化** する関係。

### 4.4 INFO 閾値 10 件の根拠

R21-R22 実績 8.5 件/round / R22-R23 実績 +10 件/round (INDEX-v11 110 → INDEX-v12 120) を base に、INFO 閾値を **実績中央値 + 10% 余裕** として 10 件に設定。R24 で実測値が 10 を下回り 8 以上であれば WARN level で運用継続、8 を下回れば WARN+ 以上で escalation。

---

## §5 rolling window 4 round moving average (軸 3)

### 5.1 移動平均窓の選定

R23 spec §4.2 では移動平均窓 = 直近 3 round。R24 物理化 spec では **直近 4 round** に拡張:

| 窓サイズ | smoothing 強度 | 偽陽性率 | 反応速度 |
|---|---|---|---|
| 1 round (単 round) | 弱 | 高 | 速 |
| 3 round (R23 spec) | 中 | 中 | 中 |
| **4 round (R24 物理化 spec)** | **強** | **低** | **中** |
| 8 round (long window) | 過剰 smoothing | 極低 | 遅 |

選定根拠:
- 4 round = R26 連続 12 round milestone の 1/3 単位 / R27-R28 物理化期間との整合
- 9 round baseline (R15-R23) で 4 round windows を 6 つ取得可能 → 統計的安定性確保
- 連続 4 round 違反で FAIL と整合 (window size = FAIL 連続違反数)

### 5.2 baseline JSON との連動

```json
{
  "$schema": "sec-trigger-5-baseline.v1",
  "version": "1.0",
  "rolling_window_size": 4,
  "round_history": [
    { "round": 21, "knowledge_entries_added": 9 },
    { "round": 22, "knowledge_entries_added": 10 },
    { "round": 23, "knowledge_entries_added": 10 },
    { "round": 24, "knowledge_entries_added": "<R24 完遂後追記>" }
  ],
  "moving_averages": {
    "R21_R24": "<R24 完遂後算出>",
    "current_level": "<INFO/WARN/WARN+/FAIL>"
  },
  "pass_threshold_info": 10.0,
  "pass_threshold_warn": 8.0,
  "pass_threshold_warn_plus": 6.0,
  "pass_threshold_fail": 4.0,
  "metadata": {
    "predecessor": "(none / R27 新規)",
    "next_update_round": 28,
    "update_owner": "Sec-T (Round 27 想定)"
  }
}
```

### 5.3 baseline 起算 round

- R27 baseline JSON 物理化時点で R21-R26 の 6 round 履歴を seed
- R28 yml 統合時点で R21-R27 の 7 round 履歴
- 以降 1 round ごとに append-only で追加

---

## §6 DEC-019-033 ナレッジ抽出機構連動 path (軸 4)

### 6.1 4 ディレクトリ構造 (CLAUDE.md §6)

| ディレクトリ | 役割 | T-5 計測対象 |
|---|---|---|
| `organization/knowledge/patterns/` | 再利用可能パターン | YES (count A) |
| `organization/knowledge/decisions/` | 設計判断ログ | YES (count B) |
| `organization/knowledge/pitfalls/` | 落とし穴集 | YES (count C) |
| `organization/knowledge/playbooks/` | 手順書 (R22 で物理 dir 化) | YES (count D) |

合算: A + B + C + D = T-5 primary metric (entries_per_round)

### 6.2 R23 Sec-R spec との差分 (playbooks 追加)

R23 spec §4.1 の `measurement_target_paths` は 3 ディレクトリ (patterns / decisions / pitfalls)。R24 物理化 spec では INDEX-v12 §0 が宣言する **4 ディレクトリ構造 (patterns 56 + decisions 25 + pitfalls 28 + playbooks 11 = 120 件)** に整合させ、playbooks を計測対象に追加。

### 6.3 PII redaction 維持

- DEC-019-033 で確立した PII redaction は entries 追加時の preprocessing に組込済
- T-5 script は **read-only file count** のみ (内容を読まない / 出力しない)
- HITL 第 11 種 `knowledge_pii_review` の人間チェック経路は無改変

### 6.4 entries 増加の自動化想定

- DEC-019-033 拡張 (CLAUDE.md §6) で「案件完了時に Claude Code 組織が自動的にナレッジを抽出」と規定
- T-5 はその自動抽出が機能しているかの **健全性 metric** として位置づけ
- entries 増加率低下 = ナレッジ抽出機構の停滞 signal として WARN/FAIL escalation

---

## §7 bash + jq syntax draft (軸 5 / R24 では実装しない)

### 7.1 bash script draft (60-80 行 target / 実装は R27)

```bash
#!/usr/bin/env bash
# sec-trigger-5-knowledge-rate.sh
# DEC-019-068 trigger 5 件目 (T-5) measurement script
# 副作用 0 / API call 0 / read-only / R27 物理化想定

set -euo pipefail

# --- 引数 parse ---
BASE_REF="${1:-HEAD~10}"     # 前 round 着地 commit (default: HEAD~10)
HEAD_REF="${2:-HEAD}"        # 現 round 着地 commit
BASELINE_JSON="${3:-projects/PRJ-019/scripts/sec-trigger-5-baseline.json}"
WINDOW_SIZE="${4:-4}"        # rolling window size (default: 4 round)

# --- 系統 a: entries 数差分 ---
ENTRIES_ADDED=$(git diff --name-only --diff-filter=A "$BASE_REF"..."$HEAD_REF" \
  -- 'organization/knowledge/patterns/**/*.md' \
     'organization/knowledge/decisions/**/*.md' \
     'organization/knowledge/pitfalls/**/*.md' \
     'organization/knowledge/playbooks/**/*.md' \
  | wc -l | tr -d ' ')

# --- 系統 b: canonical alias 数 (補助 audit / INDEX-vX.md → INDEX-v(X+1).md) ---
LATEST_INDEX=$(ls -t organization/knowledge/INDEX-v*.md | head -1)
PREV_INDEX=$(ls -t organization/knowledge/INDEX-v*.md | head -2 | tail -1)
ALIAS_DIFF=0
if [[ -f "$PREV_INDEX" && "$LATEST_INDEX" != "$PREV_INDEX" ]]; then
  CURR_ALIAS=$(grep -c '^| \*\*' "$LATEST_INDEX" || echo 0)
  PREV_ALIAS=$(grep -c '^| \*\*' "$PREV_INDEX" || echo 0)
  ALIAS_DIFF=$((CURR_ALIAS - PREV_ALIAS))
fi

# --- moving average 計算 (jq 経由) ---
MOVING_AVG=$(jq --arg curr "$ENTRIES_ADDED" --argjson w "$WINDOW_SIZE" '
  .round_history += [{round: (.round_history | length + 21), knowledge_entries_added: ($curr | tonumber)}]
  | .round_history[-$w:]
  | map(.knowledge_entries_added) | add / length
' "$BASELINE_JSON")

# --- 4 段階判定 ---
LEVEL=$(jq -n --argjson avg "$MOVING_AVG" '
  if   $avg >= 10 then "INFO"
  elif $avg >=  8 then "WARN"
  elif $avg >=  6 then "WARN+"
  else                 "FAIL"
  end
')

# --- exit code 判定 ---
case "$LEVEL" in
  INFO|WARN|WARN+) EXIT_CODE=0 ;;
  FAIL)            EXIT_CODE=1 ;;
esac

# --- JSON 出力 (stdout) ---
jq -n \
  --arg level "$LEVEL" \
  --argjson avg "$MOVING_AVG" \
  --argjson entries "$ENTRIES_ADDED" \
  --argjson alias_diff "$ALIAS_DIFF" \
  '{ level: $level, moving_average: $avg, entries_added: $entries, alias_diff: $alias_diff }'

exit "$EXIT_CODE"
```

行数想定: header コメント 5 行 + 引数 parse 5 行 + 系統 a 8 行 + 系統 b 9 行 + moving avg 6 行 + 判定 7 行 + exit code 5 行 + JSON 出力 7 行 + 空行 8 行 = **60 行前後** (target 60-80 行内に収まる)。

### 7.2 jq filter draft (30-40 行 target / 実装は R27)

```jq
# sec-trigger-5-knowledge-rate.jq
# T-5 baseline JSON 操作 + 4 段階判定 filter

# --- (a) round_history へ最新 round 追記 ---
def append_round(curr_entries; curr_round):
  .round_history += [
    { round: curr_round, knowledge_entries_added: curr_entries }
  ];

# --- (b) rolling window moving average 計算 ---
def moving_avg(window_size):
  .round_history[-window_size:]
  | map(.knowledge_entries_added)
  | add / length;

# --- (c) 4 段階 level 判定 ---
def classify_level(avg):
  if   avg >= 10 then "INFO"
  elif avg >=  8 then "WARN"
  elif avg >=  6 then "WARN+"
  else                "FAIL"
  end;

# --- (d) baseline JSON 全体更新 ---
def update_baseline(curr_entries; curr_round; window_size):
  append_round(curr_entries; curr_round)
  | .moving_averages["R\(curr_round - window_size + 1)_R\(curr_round)"] = moving_avg(window_size)
  | .moving_averages.current_level = classify_level(moving_avg(window_size));
```

行数想定: header コメント 3 行 + def append_round 5 行 + def moving_avg 5 行 + def classify_level 6 行 + def update_baseline 5 行 + 空行 7 行 = **31 行** (target 30-40 行内)。

### 7.3 syntax draft の制約遵守

- bash/jq とも **draft only** (R24 では実装しない / R27 で物理化)
- 既存 4 sec script (PAT-064 準拠) と同 style
- 副作用 0 / API call 0 / 絵文字 0 / 外部依存 0
- exit code は既存 `sec-tests-pass-gate.sh` と互換 (0 = PASS, 1 = FAIL)

---

## §8 物理 file path 案 (軸 6) と物理化想定

### 8.1 R26-R28 物理化 file 一覧

| Round | 物理化 file path | 行数 想定 | 役割 |
|---|---|---|---|
| **R26** | (file 起案なし / DEC-019-068 v2 起案のみ) | — | T-5 formal 採否 + DEC v2 起案 |
| **R27** | `projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh` | 60-80 行 | T-5 measurement script 物理化 |
| **R27** | `projects/PRJ-019/scripts/sec-trigger-5-baseline.json` | 30-50 行 | T-5 baseline JSON 物理化 (R21-R26 seed) |
| **R28** | `.github/workflows/sec-hardening.yml` (改修) | 291 + 約 30 行 | 5 件目 job 統合 (yml integration) |
| **R28** | `projects/PRJ-019/runsheets/sec-trigger-5-verification.md` | 100-150 行 | yml 統合 verification 報告書 |

### 8.2 sec-hardening.yml 5 件目 job 統合 spec (R28 担当)

```yaml
# (R28 で sec-hardening.yml に追加想定 / R24 では実装しない)
trigger-5-knowledge-rate:
  name: T-5 knowledge entry rate check
  needs: side-effect-zero
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - name: Run sec-trigger-5-knowledge-rate.sh
      run: |
        bash projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh \
          "${{ github.event.before }}" \
          "${{ github.sha }}" \
          projects/PRJ-019/scripts/sec-trigger-5-baseline.json \
          4
```

### 8.3 既存 sec script との配置整合

既存 4 script (`sec-api-spike-check.sh` 等) は `projects/PRJ-019/scripts/` 配下。5 件目 `sec-trigger-5-knowledge-rate.sh` も同位置で **prefix 命名規則 (sec-*) + 機能命名 (trigger-5-knowledge-rate)** を維持。

---

## §9 quality gate (R24 spec 段階)

| 項目 | 状態 | 備考 |
|---|---|---|
| 副作用 0 | OK | spec doc 新規作成のみ / 既存 file 無改変 |
| 絵文字 0 | OK | bash/jq draft + 全文走査で絵文字使用なし |
| API 追加コスト $0 | OK | Read + Write のみ / 外部 API call 0 |
| R23 spec 242 行 absolute 無改変 | OK | 参照のみ / 改変 0 件 |
| 9 round baseline JSON absolute 無改変 | OK | 参照のみ / 改変 0 件 |
| INDEX-v12 absolute 無改変 | OK | 参照のみ / 改変 0 件 |
| sec-hardening.yml absolute 無改変 | OK | 参照のみ / 改変 0 件 |
| bash + jq script draft only | OK | 60-80 行 + 30-40 行 / R24 では実装しない |
| DEC-019-033 ナレッジ抽出機構整合 | OK | 4 ディレクトリ参照 + PII redaction 維持 |
| 物理化 6 軸完遂 | OK | script 設計 / 閾値 / window / DEC link / syntax / file path |
| R26-R28 ロードマップ整合 | OK | 別報告書 (`dev-rr-r24-r26-r28-roadmap.md`) と相互参照 |
| Owner formal「丁寧に」directive 順守 | OK | 各軸に R23 → R24 詳細化 delta 明記 |

---

## §10 R26 formal 採否準備項目 (R23 §5 拡張)

### 10.1 採否時に検証すべき項目 (R23 §5.1 + R24 追記)

R23 §5.1 既存項目:
- 連続 12 round 実績 (R15-R26) で T-5 を retroactive 適用した場合の PASS/FAIL シミュレーション
- knowledge entry の round 別実数集計 (R21-R22 8.5 件 実績 → R23-R25 で実測継続)
- 落選 3 候補 (T-5b/c/d) の R26 時点再評価

R24 追記項目:
- moving average 4 round window が 9 round baseline (R15-R23) で 6 windows 全てで >= 8 件を満たすか
- INFO/WARN/WARN+/FAIL 4 段階閾値が R21-R25 5 round で誤検知率 < 5% を満たすか
- DEC-019-033 ナレッジ抽出機構の健全性 metric として T-5 が機能するか
- §7 bash/jq draft の R27 物理化で追加 risk なし (副作用 0 / 外部依存 0) を再 verify

### 10.2 採否文書 template (R23 §5.2 + R24 拡張)

```yaml
DEC-019-068 v2 (R26 milestone):
  baseline_status: "ESTABLISHED + EXTENDED (12 round consecutive at R26)"
  trigger_v2_definition:
    T-1: <既存>
    T-2: <既存>
    T-3: <既存>
    T-4: <既存>
    T-5:
      name: "knowledge entry 平均増加率"
      pass_threshold_info: 10.0       # R24 Dev-RR 詳細化
      pass_threshold_warn: 8.0        # R23 Sec-R spec 採用
      pass_threshold_warn_plus: 6.0   # R24 Dev-RR 詳細化
      pass_threshold_fail: 4.0        # R24 Dev-RR 詳細化
      rolling_window_size: 4          # R24 Dev-RR 詳細化 (R23 spec 3 → R24 4 拡張)
      measurement_dirs:
        - patterns
        - decisions
        - pitfalls
        - playbooks                   # R24 Dev-RR で追加 (R23 spec 3 → R24 4)
      script_path: "projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh"
      baseline_json: "projects/PRJ-019/scripts/sec-trigger-5-baseline.json"
  candidates_held:
    - T-5b: "INDEX retrieval 100% 連続維持 (R27+ 自動化 audit 機構整備後再検討)"
    - T-5c: "DEC readiness 軸増加率 (R28+ T-6 候補化)"
  candidates_rejected:
    - T-5d: "Owner 拘束圧縮率 (T-4 重複 / 100% 圧縮実績で trivial)"
```

---

## §11 Dev-RR T-5 物理化 spec 詳細化完遂宣言

R23 Sec-R が確定した DEC-019-068 trigger 5 件目候補 spec (242 行 / T-5 採用) を Round 24 Dev-RR (research との cross 領域) が **物理化レベル詳細化** に格上げ完遂。6 軸 (measurement script 設計 / fail-soft 4 段階数値閾値 / rolling window 4 round moving average / DEC-019-033 連動 path / bash + jq syntax draft / 物理 file path 案) 全てで R26-R28 物理化に直結する spec を確定。R23 spec 242 行 absolute 無改変 / 9 round baseline JSON absolute 無改変 / INDEX-v12 absolute 無改変 / sec-hardening.yml absolute 無改変 / API 追加コスト $0 / 副作用 0 / 絵文字 0 / bash + jq draft only (R27 で物理化、R24 では実装しない)。R26 formal 採否時の base spec として提出可能な水準まで詳細化、R26 採否 → R27 script 物理化 (`sec-trigger-5-knowledge-rate.sh` 60-80 行 + `sec-trigger-5-baseline.json` 30-50 行) → R28 yml 統合 (sec-hardening.yml 5 件目 job) の 3 round ロードマップを別報告書 `dev-rr-r24-r26-r28-roadmap.md` と相互参照で確立。

—— Dev-RR / 2026-05-05 W0-Week1 / Round 24 第 2 波第 2 列 / DEC-019-025 SOP 19 件目候補 (継続深化) / T-5 物理化 spec 詳細化完遂 (script 設計 + 閾値 + rolling window + DEC link + syntax draft + file path 6 軸全完遂)
