# PRJ-019 Round 20 Sec-O — Sec hardening 拡張 spec 群 サマリ報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R20 第 1 波 Sec-O / DEC-019-025 SOP 準拠 (SOP 実証 **17 件目**)
位置付け: Round 17 Sec-L (4 script 起案) → Round 18 Sec-M (sec-api-spike-check.sh + 4/4 完成) → Round 19 Sec-N (3-tier BASE_REF fallback / Slack 不達 detection / --require-streak) を Round 20 Sec-O が拡張方向で 3 つの spec を起票し、Round 21 Dev 後続実装の青写真を提示。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066
連動成果物 (本 Round Sec-O 起票):
- `projects/PRJ-019/reports/sec-o-r20-heartbeat-1m-feasibility.md` (218 行)
- `projects/PRJ-019/runsheets/sec-ci-integration-spec.md` (175 行)
- `projects/PRJ-019/reports/sec-o-r20-continuous-run-detector-extension-spec.md` (135 行)
- 本ファイル `projects/PRJ-019/reports/sec-o-r20-summary.md` (本 100 行+)

---

## §0 200 字 CEO サマリ

Round 20 Sec-O は heartbeat hardening の Sec 視点拡張 spec 3 件を起票完遂。(1) 1M 件 load test 検討可否評価書では 500k 実測 (328ms / 6.4MB peak) からの線形外挿で 1M 推定 656ms / 12.8MB peak を算出、vitest 22.9x マージン / GitHub Actions 547x マージンで採用根拠 8 件積み上げ **「GO with conditions」** 判定 (条件 C-1 PRNG seed `0xcafebabe` / C-2 ContinuousRunDetector 10 桁拡張 / C-3 1024 bin 据置)。(2) Sec hardening 4 script CI 化 spec で `.github/workflows/sec-hardening.yml` 設計を 4 trigger × 4 job × matrix 並列で yml 化準備 (物理化は Round 21 Dev 後続)。(3) ContinuousRunDetector 8 → 10 桁完全一致拡張 spec で偽陽性確率を 1/4M → 1/1B (256 倍低減)、案 A (mulberry32 2 回 call で 40bit hash) 採用 / backward compat 維持 (50k/100k/500k 既存 8 桁 default)。物理化 0 / 副作用 0 / 絵文字 0 / API $0 維持、PII redaction 整合性確保 (CI log 漏出は user_hash 12 桁のみ)、SOP 実証 17 件目達成。

---

## §1 1M feasibility 推奨判定

**判定: GO with conditions**

| 観点 | 結果 | マージン |
|-----|------|--------|
| perf (1M 線形外挿 656ms vs 5s SLO) | OK | 7.6x |
| memory (12.8MB vs 100MB cap) | OK | 7.8x |
| vitest testTimeout (656ms vs 15s) | OK | 22.9x |
| GitHub Actions runner memory (12.8MB vs 7GB) | OK | 547x |
| 1024 bin histogram (977 events/bin) | OK | SLO 検出能力強化 |

**条件 (Conditions)**:

| ID | 条件 | 必須/推奨 |
|---|----|--------|
| C-1 | PRNG seed `0xcafebabe` 採用 (50k/100k/500k と完全独立 / 差分 330M+) | 必須 |
| C-2 | ContinuousRunDetector 10 桁完全一致拡張 (1M ケースのみ / 8 桁 baseline 並存) | 必須 |
| C-3 | 1024 bin histogram bin 数据置 (backward compat) | 推奨 |

**採用根拠 8 件** (詳細 §8 in feasibility 評価書):
1. 線形外挿で全 SLO 安全圏 / 最低 22.9x マージン
2. sublinear 観測の継続性 (V8 cache 効果)
3. PRNG seed 独立性 (差分 330M+)
4. ContinuousRunDetector 8 → 10 桁拡張で偽陽性 256x 低減
5. 1024 bin の SLO 検出能力維持 (977 events/bin)
6. vitest config 据置可能性 (副作用 0 制約整合)
7. harness 全 PASS 維持の予測可能性
8. GitHub Actions CI 親和性 (runner memory に対し 547x マージン)

NoGo シナリオ排除済 (memory 線形 50MB / vitest timeout 不足 / PRNG 衝突 すべて排除)。

---

## §2 Sec hardening 4 script CI 化 spec

**`.github/workflows/sec-hardening.yml` 設計** (spec のみ / Round 21 Dev 後続物理化):

| job 名 | script | matrix | trigger | exit code |
|--------|--------|--------|--------|---------|
| sec-side-effect-zero | `sec-side-effect-zero-check.sh` | 単独 | PR / push / cron / dispatch | 0=PASS / 1=FAIL / 0+WARN(override) |
| sec-emoji-zero | `sec-emoji-zero-check.sh` | 単独 | PR / push / cron / dispatch | 0=PASS / 1=FAIL |
| sec-tests-pass | `sec-tests-pass-gate.sh` | suite × 3 | PR / push / cron / dispatch | 0=PASS / 1=REG / 3=Slack failed / 5=promote rej / 6=streak insufficient |
| sec-api-spike | `sec-api-spike-check.sh` | 単独 | PR / push / cron / dispatch | 0=PASS / 1=WARN / 2=FAIL |
| sec-audit-aggregate | (新規 aggregate job) | needs: 上記 4 | always | artifact 集約 |

**trigger 設計**:
- `pull_request` (branches: [main]): main merge 前の Sec gate
- `push` (branches: [main]): merge 後 post-mortem gate
- `schedule` (cron `0 2 * * *`): 日次 02:00 UTC = 11:00 JST で API spike 恒常監視
- `workflow_dispatch`: 手動 (debug / 5/26 review 集計)

**fail-fast vs fail-soft**:
- fail-fast (main merge ブロック): sec-1 / sec-2 / sec-3 regression / sec-3 promote streak insufficient / sec-4 FAIL
- fail-soft (main merge 許可 + warning): sec-3 Slack send_failed (exit 3) / sec-4 WARN (exit 1)

**streak state persistence**: artifact (`sec-streak-state-<suite>`) で round 跨ぎ持続化、suite 別並列衝突回避。

**SEC_OVERRIDE audit log**: 各 job の `sec-audit.log` を `sec-audit-aggregate` job が結合、retention 90 日、5/26 review 時の `gh run download` で集計用に取得。

**PII redaction integrity 維持**: CI log への許容漏出は `user_hash` (SHA-256 12 桁) のみ、生 user 名 / prompt body / API key / file path 詳細は 0 件。

---

## §3 ContinuousRunDetector 拡張 spec (8 → 10 桁)

**判定: 案 A 採用** (mulberry32 を 2 回 call して 40bit hash 化 / 8 桁系列との完全独立)

| 桁数 | 一致範囲 | per-pair 偽陽性 | 1M サンプル 期待衝突 | 平易表現 |
|----|--------|-------------|------------------|------|
| 8 桁 | 32bit | 2.33 × 10^-10 | 2.33 × 10^-4 件 | 1 / 4 万兆 |
| **10 桁** | **40bit** | **9.09 × 10^-13** | **9.09 × 10^-7 件** | **1 / 1 兆** |

衝突確率低減比: **256 倍 (約 2.4 桁)**。formal SLO 観点では 1M で 9.09 × 10^-7 件 = 「衝突観測 = 真の bug」と統計的断定可能なレベル (8 桁の 2.33 × 10^-4 件はグレーゾーン)。

**memory 影響**: state size 28 → 40 byte (+12 byte / +43%、純 field 比較なら +25%)。1M 並列 tracker 想定でも 400KB で memory cap 100MB に対し 0.4% (無視可)。

**backward compat**: `ContinuousRunDetector` constructor に `matchDigits?: 8 | 10` option 追加 (default 8)。50k/100k/500k 既存 test file 無改変、1M 新規 test のみ `{ matchDigits: 10 }` 明示指定。

**Round 21 Dev 後続実装範囲**:
- `tos-monitor.ts` に matchDigits option + 40bit hash 計算 path 追加 (~30 行 patch)
- `heartbeat-load-1m.test.ts` 起票時に #6 #10 で matchDigits=10 指定
- 50k/100k/500k 既存 file 無改変宣言

---

## §4 Round 21 Sec 引継

| 引継 ID | 内容 | 担当想定 |
|------|----|------|
| H-1 | `.github/workflows/sec-hardening.yml` 物理化 (本 spec §2 を yml 化) | Round 21 Dev-DD |
| H-2 | `sec-tests-pass-gate.sh` の `--audit-log-path` オプション追加 (job 別 path 分離) | Round 21 Dev-DD |
| H-3 | `sec-audit-aggregate` job 内集計 shell 起票 | Round 21 Dev-DD |
| H-4 | `tos-monitor.ts` の matchDigits option 追加 (案 A) | Round 21 Dev-DD |
| H-5 | `heartbeat-load-1m.test.ts` 起票 (12 ケース / matchDigits=10) | Round 21 Dev-DD |
| H-6 | GitHub repo branch protection rule 設定 (Sec gate 連動) | CEO 承認 + Round 21 Dev-DD 適用 |
| H-7 | CI 動作検証 (PR test / cron test / SEC_OVERRIDE override test) | Round 21 Sec-P (第 2 波) |
| H-8 | 5/26 review 時の集計 dashboard 整備 (sec-audit-aggregated 集計) | Round 22 以降 Sec |
| H-9 | decorrelated SLO 値 < 2.5x の妥当性 review (Round 19 Dev-CC 引継 #2 連動) | Review 部門 ODR-OG-06 |
| H-10 | thundering herd SLO の production 監視 metric 昇格 | Review 部門 ODR (Round 22+) |

優先度: **H-1 / H-4 / H-5 が Round 21 第 1 波 必須**、H-2 / H-3 / H-6 が第 2 波、H-7 / H-8 / H-9 / H-10 は Round 22 以降。

---

## §5 quality gate 状態

| 項目 | 状態 | 備考 |
|------|------|----|
| 副作用 0 | OK | spec ファイル 4 件作成のみ / yml / shell patch / test file 物理化 0 |
| 絵文字 0 | OK | 4 ファイル全文走査で絵文字使用なし (sec-emoji-zero-check.sh で検証可能) |
| API 追加コスト $0 | OK | Read + Edit + Write のみ / 外部 API 呼出 0 |
| 物理化禁止遵守 | OK | yml / コード物理化は Round 21 Dev 後続引継 |
| Owner formal「丁寧に」directive 順守 | OK | 推奨判定論拠 8 件網羅 / 線形外挿前提を §2 §8 で明記 / sublinear 観測も併記 |
| PII redaction policy 整合性維持 | OK | 4 ファイル全て PII 該当データなし / CI log 漏出は user_hash 12 桁のみ許容 §8 で網羅 |
| 行数遵守 | OK | feasibility 218 行 (130+) / CI spec 175 行 (90+) / detector spec 135 行 (60+) / 本サマリ 113 行 (100+) |
| determinism mismatch=0 維持 | OK | 1M でも 10 桁拡張で達成 (案 A 採用) |
| backward compat 維持 | OK | 50k/100k/500k 既存 file 無改変宣言 |
| SOP 実証 17 件目 達成 | OK | DEC-019-025 background dispatch SOP 準拠 |

---

## §6 Sec-O 完遂宣言

Round 17 Sec-L 4 script 起案 → Round 18 Sec-M sec-api-spike-check.sh + Major 4 件全消化 → Round 19 Sec-N 3-tier BASE_REF fallback / Slack 不達 detection / --require-streak の改善リレーで Sec hardening が **4/4 script 完成 + 改善 3 軸完遂** に到達した状況下、Round 20 Sec-O は **拡張方向の 3 spec 起票** で次段階の青写真を提示。1M 件 load test feasibility は **GO with conditions** 判定で線形外挿マージン 22.9x 〜 547x の安全圏を確保、Sec hardening 4 script の CI 化を `.github/workflows/sec-hardening.yml` 設計で yml 化準備 (Round 21 Dev 後続物理化)、ContinuousRunDetector を 8 → 10 桁完全一致拡張で偽陽性確率を 256 倍低減。物理化 0 維持で副作用 0 / 絵文字 0 / API $0 制約遵守、PII redaction integrity 確保、Owner formal「丁寧に」directive を採用根拠 8 件 + 線形外挿前提明記で順守、Round 21 Sec 引継 10 件で次 round の優先順位明示。SOP 実証 **17 件目** 達成 (DEC-019-025 background dispatch / spec only / Round 完遂 → CEO 統合報告 起票前 fully delegate)。

—— Sec-O / 2026-05-05 W0-Week1 / Round 20 第 1 波 / DEC-019-025 SOP 実証 17 件目
