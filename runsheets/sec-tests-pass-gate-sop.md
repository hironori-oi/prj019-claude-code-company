# Sec SOP — tests PASS gate（DEC-019-066 §3.4 連動）

**起案**: Sec-L / Round 17 / 2026-05-05 / **対象 script**: `projects/PRJ-019/scripts/sec-tests-pass-gate.sh` + `sec-tests-baseline.json`
**目的**: harness / workspace / openclaw-runtime の tests PASS baseline を JSON で集中管理し、regression を機械検出する。Slack alert 付き。

---

## §1 baseline.json 管理
| suite | baseline | 由来 |
|---|---|---|
| harness | 617 | R15=607 → R16/R17 で +10 (DEC-019-066 §3.4) |
| workspace | 1,503 | PRJ-019 app workspace 全体 |
| openclaw-runtime | 330 | R16 達成値 |

baseline は `projects/PRJ-019/scripts/sec-tests-baseline.json` で一元管理。改変は CEO 承認下の `--promote` 実行のみ可。

## §2 実行手順（regression 検出）
```bash
bash projects/PRJ-019/scripts/sec-tests-pass-gate.sh \
  --suite harness --pass 617
```
- `--pass` < baseline → exit 1 + Slack alert
- `--pass` >= baseline → exit 0（差分は記録のみ、baseline は据え置き）

## §3 自動 baseline 更新 SOP（Round 完遂時）
1. Round 完遂で 4 項目すべて PASS（CEO 統合報告 v* 確認）
2. 増加分が再現性ありと判定（連続 2 round 同値以上）
3. CEO 承認 → `ROUND=R18 bash sec-tests-pass-gate.sh --suite harness --pass <new> --promote`
4. baseline.json 自動更新 + Slack 通知 + commit に SOP 履歴 trailer 記録

## §4 Slack alert 設定
- `SLACK_WEBHOOK_URL` 環境変数で通知先指定
- 未設定時は alert skip（API $0 / network 0 維持、外部依存 0）
- 送信内容: `[Sec gate] REGRESSION <suite>: pass=X < baseline=Y`

## §5 CI integration
```yaml
- name: harness vitest
  run: cd harness && bun test --reporter=json > harness.json
- name: Sec / tests PASS gate (harness)
  env: { SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }} }
  run: |
    PASS=$(node -e "console.log(require('./harness/harness.json').numPassedTests)")
    bash projects/PRJ-019/scripts/sec-tests-pass-gate.sh --suite harness --pass $PASS
```

## §6 5/26 review 連携
- 集計: regression 検出回数 / baseline promote 回数 / Slack alert 発火回数
- 目標: regression 0 / promote は計画的（< 2 / round） / alert false positive 0
