# Sec SOP — CI 化統合 spec（DEC-019-066 §3 全体連動 / 4 script の GitHub Actions 並列化）

**起案**: Sec-O / Round 20 / 2026-05-05 / **対象**: 既存 Sec hardening 4 script の GitHub Actions matrix 並列実行 spec
**前身**: Round 17 Sec-L (`sec-side-effect-zero-check.sh` / `sec-emoji-zero-check.sh` / `sec-tests-pass-gate.sh`) + Round 18 Sec-M (`sec-api-spike-check.sh`) + Round 19 Sec-N (3-tier BASE_REF fallback / Slack 不達 detection / --require-streak)
**目的**: 4 script を GitHub Actions matrix で並列実行 (PR / push to main / cron daily) して Round 完遂時に手動実行している Sec gate を CI 自動化する。

> 本 spec は **設計のみ**。`.github/workflows/sec-hardening.yml` 物理化は Round 21 Dev 後続が担当。

---

## §0 目的

1. 4 script の手動実行 SOP (各 SOP §2 に記載) を CI 自動化し、Round 完遂時の人的見落としを物理排除
2. PR review 段階で Sec gate を強制し、main merge 前に違反を検出（fail-fast / fail-soft 設計は §7）
3. 日次 cron で API spike trajectory を恒常監視（dispatch 外時間帯の monthly trajectory 逸脱検出）
4. SEC_OVERRIDE audit log を CI artifact として永続化し、5/26 review 時の集計対象を physical 化
5. streak state を artifact 経由で round 跨ぎ持続化し、`--require-streak 2` 強制を CI で実現

## §1 既存 4 script の並列実行設計

| ID | script | matrix 並列度 | 想定実行時間 | exit code 解釈 |
|---|--------|------------|-----------|------------|
| sec-1 | `sec-side-effect-zero-check.sh` | 単独 | < 5s | 0=PASS / 1=FAIL / 0+WARN (override 時) |
| sec-2 | `sec-emoji-zero-check.sh` | 単独 | < 30s (find + perl) | 0=PASS / 1=FAIL |
| sec-3 | `sec-tests-pass-gate.sh` | suite × 3 (harness / workspace / openclaw-runtime) | < 60s/suite | 0=PASS / 1=REGRESSION / 3=Slack failed / 5=promote rejected / 6=streak insufficient |
| sec-4 | `sec-api-spike-check.sh` | 単独 | < 5s | 0=PASS / 1=WARN / 2=FAIL |

`fail-fast: false` を matrix に明記し、1 つの script が FAIL でも他を走り切る設計（FAIL 全体可視化のため）。

## §2 `.github/workflows/sec-hardening.yml` 設計（spec のみ）

```yaml
# 物理化は Round 21 Dev 後続。現時点は spec のみ。
name: sec-hardening

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # daily 02:00 UTC = 11:00 JST (dispatch 外時間帯)
  workflow_dispatch:     # 手動 trigger 用

permissions:
  contents: read         # checkout のみ / 書き込み 0

jobs:
  sec-side-effect-zero:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # BASE_REF 解決に必要 (3-tier fallback Round 19 Sec-N)
      - name: Sec / side-effect zero gate
        env:
          BASE_REF: ${{ github.event.pull_request.base.sha || 'origin/main' }}
          HEAD_REF: ${{ github.event.pull_request.head.sha || github.sha }}
          ROUND: ${{ github.run_id }}
        run: bash projects/PRJ-019/scripts/sec-side-effect-zero-check.sh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sec-side-effect-zero-log
          path: projects/PRJ-019/reports/_sec-automation/side-effect-zero-*.log

  sec-emoji-zero:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash projects/PRJ-019/scripts/sec-emoji-zero-check.sh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sec-emoji-zero-log
          path: projects/PRJ-019/reports/_sec-automation/emoji-zero-*.log

  sec-tests-pass:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        suite: [harness, workspace, openclaw-runtime]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: sec-streak-state
          path: projects/PRJ-019/scripts
        continue-on-error: true   # 初回 run は streak file 不在 OK
      - name: install + run vitest (suite=${{ matrix.suite }})
        run: |
          # suite 別 dir に応じた bun test or npm test を起動
          # 出力 JSON から numPassedTests を抽出 → PASS 環境変数化
      - name: Sec / tests PASS gate
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          ROUND: ${{ github.run_id }}
        run: |
          bash projects/PRJ-019/scripts/sec-tests-pass-gate.sh \
            --suite ${{ matrix.suite }} --pass $PASS
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sec-streak-state-${{ matrix.suite }}
          path: projects/PRJ-019/scripts/sec-streak-state.json

  sec-api-spike:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash projects/PRJ-019/scripts/sec-api-spike-check.sh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sec-api-spike-log
          path: projects/PRJ-019/reports/_sec-automation/api-spike-*.log

  sec-audit-aggregate:
    runs-on: ubuntu-latest
    needs: [sec-side-effect-zero, sec-emoji-zero, sec-tests-pass, sec-api-spike]
    if: always()
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: artifacts
      - name: aggregate sec-audit.log
        run: |
          # 全 job artifact から sec-audit.log を結合し、SEC_OVERRIDE 件数 / reason 分布集計
      - uses: actions/upload-artifact@v4
        with:
          name: sec-audit-aggregated
          path: aggregated-sec-audit.log
```

## §3 trigger 設計

| trigger | 発火条件 | 主目的 |
|--------|--------|------|
| `pull_request` (branches: [main]) | PR 起票 / 更新時 | main merge 前の Sec gate |
| `push` (branches: [main]) | main 直接 push (主に CEO 統合 commit / merge commit) | merge 後の post-mortem gate |
| `schedule` (cron `0 2 * * *`) | 日次 02:00 UTC = 11:00 JST | API spike trajectory の恒常監視 (dispatch 外時間帯) |
| `workflow_dispatch` | 手動起動 | debug / 5/26 review 時の集計用 |

cron 時刻 02:00 UTC 採用根拠:
- JST 11:00 で日中 dispatch 開始前に前日分 trajectory を確定させる
- US-East 22:00 / EU 03:00 で世界各地の朝〜深夜帯を避ける

## §4 BASE_REF 自動推定 (Round 19 Sec-N 3-tier fallback 活用)

Round 19 Sec-N で導入された 3-tier BASE_REF fallback を CI でフル活用:

| 優先度 | CI 環境での解決 | base_source ラベル |
|---|---|---|
| 1 | `pull_request.base.sha` (PR event 時のみ存在) | `explicit` |
| 2 | `origin/main` (push / cron event 時) | `fallback:origin/main` |
| 3 | `HEAD~1` (1 件目 commit / shallow clone 時) | `fallback:HEAD~1` |

`fetch-depth: 0` 必須（shallow clone だと優先度 2 が失敗する）。

base_source ラベルは REPORT_FILE 1 行目に記録され、`sec-audit-aggregate` job で集計対象とする。

## §5 SEC_OVERRIDE audit log artifact upload

Round 19 Sec-N で導入された `scripts/sec-audit.log` (JSONL) は CI 実行時に以下処理:

1. 各 job 実行時に `--audit-log-path` で job 単位 file path を分離 (重複書込み回避)
2. `if: always()` で artifact upload (FAIL 時も保持)
3. `sec-audit-aggregate` job が全 job artifact を結合 → `aggregated-sec-audit.log`
4. retention: 90 日 (GitHub Actions default 90 日と整合)
5. 5/26 review 時の集計: `gh run download` で aggregated log を取得 → `jq` で `event:"sec_override"` 件数 / reason 分布

PII 安全性: `user_hash` (SHA-256 12 桁) のみで生 user 名は含まれない（Round 19 Sec-N で確立 / §8 で再強調）。

## §6 streak state persistence 戦略

`sec-streak-state.json` を CI run 跨ぎで持続化:

| ステップ | 動作 |
|---------|----|
| job 開始時 | `actions/download-artifact@v4` で前回 streak file を restore（初回 run は continue-on-error） |
| script 実行 | `sec-tests-pass-gate.sh` が streak をインクリメント / リセット |
| job 終了時 | `actions/upload-artifact@v4` で新 streak file を upload |
| matrix suite 並列 | suite ごとに別 artifact (`sec-streak-state-harness` / `-workspace` / `-openclaw-runtime`) で並列衝突回避 |

`--require-streak 2` 強制運用は 5/26 review 後の formal 承認下で `--promote` step に追加。

## §7 fail-fast vs fail-soft 判定

| script | gate severity | fail-fast / fail-soft |
|--------|-------------|---------------------|
| sec-1 (side-effect zero) | **fail-fast**: 違反 1 件で FAIL = main merge ブロック | fail-fast |
| sec-2 (emoji zero) | **fail-fast**: 違反 1 件で FAIL = main merge ブロック | fail-fast |
| sec-3 (tests PASS gate) | **fail-fast**: regression で FAIL = main merge ブロック / streak は継続 | fail-fast |
| sec-3 (Slack alert exit 3) | **fail-soft**: gate 自体は PASS なので main merge は許可、別 alert 系統で再通知推奨 | fail-soft |
| sec-3 (promote streak insufficient exit 6) | **fail-fast**: promote 自体を拒否 / regression と同等扱い | fail-fast |
| sec-4 (API spike) WARN (exit 1) | **fail-soft**: main merge は許可、PR コメントで warning 表示 | fail-soft |
| sec-4 (API spike) FAIL (exit 2) | **fail-fast**: cost cap breach 想定 = main merge ブロック | fail-fast |

`continue-on-error: true` を WARN 系 (sec-4 exit 1 / sec-3 exit 3) のみに限定的適用。FAIL 系は workflow level FAIL として `branch protection rule` 連動で main merge を物理ブロック。

## §8 PII redaction integrity 維持 (CI log に sha256 user_hash のみ漏出許容)

CI 実行時の PII 漏出ベクトルと redaction 確認:

| ベクトル | 漏出可能性 | redaction 状態 | 確認手段 |
|--------|---------|------------|------|
| `$USER` / `$USERNAME` | 旧来の audit log には平文記録の risk | Round 19 Sec-N で SHA-256 12 桁 hash 化済 | `sec-audit.log` を grep して平文 user 不在を verify |
| GitHub Actions `${{ github.actor }}` | CI log には自動表示される | actor 名は public PR では既に公開情報のため redaction 不要 | GitHub UI 既定 |
| `kind` ラベル (sec-4 API spike) | prompt 内容を含む可能性 | SHA-256 8 桁 hash 化 + top 5 限定 | `sec-api-spike-baseline.json` で kind 命名規約を Dev と握る (5/26 review) |
| `SEC_OVERRIDE_REASON` | 自由記述で PII 混入可能性 | 現状 escape のみ / PII 検出機構なし | 5/26 review で「DEC-XXX 紐付け強制」を formal 化検討 |
| Slack webhook payload | text に suite 名 / pass 数 のみ | 既存実装で PII なし | `slack_alert()` 関数 review |
| Audit log artifact (90 日 retention) | retention 中の漏出 risk | private repo 前提 / GitHub access control に委譲 | repo 設定確認 |

CI log への許容漏出: **`user_hash` (SHA-256 12 桁) のみ**。生 user 名 / prompt body / API key / file path 詳細は 0 件。

## §9 Round 21 Dev 後続実装タスク (yml 物理化)

| タスク | 想定行数 | 担当想定 |
|------|--------|------|
| `.github/workflows/sec-hardening.yml` 起票 (本 §2 spec を yml 化) | ~150 行 | Dev-DD |
| `sec-tests-pass-gate.sh` の `--audit-log-path` オプション追加 (job 別 path 分離) | ~10 行 patch | Dev-DD |
| `sec-audit-aggregate` job 内の集計 shell 起票 | ~30 行 | Dev-DD |
| harness / workspace / openclaw-runtime suite 別 vitest 実行 step 起票 | ~20 行 × 3 = 60 行 | Dev-DD |
| GitHub repo `branch protection rule` 設定 (Sec gate 連動) | UI 設定 | CEO 承認 + Dev-DD 適用 |
| 動作検証 (PR test / cron test / SEC_OVERRIDE override test) | 検証 round 別 | Dev-DD + Sec-P (R21 第 2 波) |

## §10 5/26 review 連携

| 集計項目 | 計測 source | 目標値 |
|---------|----------|------|
| sec-1 violation 件数 / round | `side-effect-zero-*.log` 集計 | 0 件 |
| sec-1 SEC_OVERRIDE 件数 | `sec-audit-aggregated` JSONL | < 1 件 / round |
| sec-2 emoji violation 件数 | `emoji-zero-*.log` 集計 | 0 件 |
| sec-3 regression 件数 | Slack alert 履歴 + `tests-pass-gate-*.log` | 0 件 |
| sec-3 baseline promote 件数 | `tests-pass-gate-*.log` で `PROMOTED:` grep | < 2 / round |
| sec-3 Slack send_failed 件数 (exit 3) | `tests-pass-gate-*.log` で `SLACK: send_failed` grep | 0 件 |
| sec-4 WARN / FAIL 件数 | `api-spike-*.log` 集計 | FAIL 0 / WARN < 3 / week |
| CI workflow 実行成功率 | GitHub Actions API | > 99% (除く意図的 FAIL) |

## §11 quality gate (Sec-O 自身)

- 副作用 0: yml 物理化は Round 21 引継のため、現時点 spec ファイルのみ作成
- API 追加コスト $0: GitHub Actions free tier 内 (public repo は無制限 / private repo も既存 budget 内)
- 絵文字 0: 本 spec 内で絵文字使用なし
- spec のみ起票: yml / shell patch / branch protection 物理化は Round 21 Dev 後続
- PII redaction 整合性: §8 で漏出ベクトル全網羅 + 既存 redaction 維持確認

—— Sec-O / 2026-05-05 W0-Week1 / Round 20 第 1 波 / DEC-019-025 SOP 実証 17 件目
