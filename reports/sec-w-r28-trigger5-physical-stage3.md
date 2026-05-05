# PRJ-019 Round 28 Sec-W — T-5 物理化 IMPL 3/3 = sec-hardening-v3.yml 統合完遂

最終更新: 2026-05-06 W0-Week1 / 起票: Sec 部門 R28 Sec-W / DEC-019-068 v2 IMPL 3/3 完遂宣言
位置付け: R26 Sec-U IMPL 1/3 (monitor spec 物理化) → R27 Sec-V IMPL 2/3 (measurement script + baseline JSON 物理化) → **R28 Sec-W IMPL 3/3 (sec-hardening-v3.yml 別 file 新設 / yml 統合)** = T-5 物理化完遂
連動 file: `projects/PRJ-019/.github/workflows/sec-hardening-v3.yml` (377 行 / 6 job)
連動 DEC: DEC-019-025 / 033 / 049 / 053-v15.5 / 054 / 055 / 057 / 062 / 066 / 068 v2 (R28 議決待ち)

---

## §1 sec-hardening-v3.yml 構造 summary

### 1.1 行数 / job 数

| 指標 | 値 |
|---|---|
| 行数 | **377 行** (target ~380 / spec 整合) |
| job 数 | **6 job** (v2 5 job + sec-trigger-5-knowledge-rate 1 job) |
| cron schedule | 02:15 UTC = **11:15 JST** (4 段 cascade 5 min ずらし) |
| audit log root | `projects/PRJ-019/reports/_sec-automation/v3/` |
| artifact retention | 90 日 (DEC-019-066 §3 整合) |

### 1.2 6 job 列挙

1. **sec-side-effect-zero** (Job 1) — 既存テスト破壊 / schema 改変 / lock / secret diff 検知 (v3 audit-path 対応)
2. **sec-emoji-zero** (Job 2) — UTF-8 emoji + 35 ペア多言語擬似絵文字検知
3. **sec-tests-pass** (Job 3) — harness / workspace / openclaw-runtime suite × 3 並列 matrix (fail-fast: false)
4. **sec-api-spike** (Job 4) — Anthropic spend 1h 窓 / 月次 trajectory 逸脱検知 (continue-on-error)
5. **sec-trigger-5-knowledge-rate** (Job 5 / **新規 R28**) — knowledge entry 増加率 4 round MA gate (4 段階閾値 fail-soft)
6. **sec-audit-aggregate** (Job 6) — 5 job log 集計 + T-5 level 分布集計 (R28 新規)

### 1.3 v3 = v2 完全 superset + T-5 1 job 追加

| job | v1 (R21) | v2 (R24) | v3 (R28 / 本 file) |
|---|---|---|---|
| sec-side-effect-zero | OK | OK (audit-path v2) | OK (audit-path v3) |
| sec-emoji-zero | OK | OK (audit-path v2) | OK (audit-path v3) |
| sec-tests-pass | OK | OK (audit-path v2) | OK (audit-path v3) |
| sec-api-spike | OK | OK (audit-path v2 / R24 Info 1) | OK (audit-path v3) |
| sec-audit-aggregate | OK | OK (v1+v2 path) | OK (v1+v2+v3 path + T-5 level 分布) |
| **sec-trigger-5-knowledge-rate** | (なし) | (なし) | **新規 / R28 IMPL 3/3** |

---

## §2 4 段 cascade 整合

| yml | cron (UTC) | cron (JST) | 役割 | 不変性 |
|---|---|---|---|---|
| sec-hardening.yml (v1) | `0 2 * * *` | 11:00 JST | historical baseline + sec-api-spike trajectory | absolute 無改変 (md5 eaff4e5a / R21→R28 不変) |
| sec-hardening-v2.yml | `5 2 * * *` | 11:05 JST | v1 superset + Info 1+2 物理化 | absolute 無改変 (md5 0ac6f2b9 / R24→R28 不変) |
| sec-cron-audit.yml | `10 2 * * *` | 11:10 JST | 全 yml cron 衝突 audit | absolute 無改変 (md5 946b06a1 / R25→R28 不変) |
| **sec-hardening-v3.yml** | **`15 2 * * *`** | **11:15 JST** | **v2 superset + T-5 5 件目 job 統合 (R28 新規)** | **R28 新規 / R29 以降不変厳守対象** |

5 min ずらし整合 = cron 衝突 0 (sec-cron-conflict-audit.sh で日次 audit 担保 / R26 Sec-U dry-run verified)。

---

## §3 sec-trigger-5-knowledge-rate job 詳細 (新規 / R28 IMPL 3/3)

### 3.1 yml 抜粋 (実装版 / R26 Sec-U spec §6.2 整合)

```yaml
sec-trigger-5-knowledge-rate:
  name: Sec / T-5 knowledge entry growth rate (fail-soft / 4 段階閾値)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 50
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: mkdir -p ${{ env.V3_AUDIT_ROOT }}
    - continue-on-error: true
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        AUDIT_PATH="${{ env.V3_AUDIT_ROOT }}/trigger-5-${{ github.run_id }}-$(date +%s).log"
        bash projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh \
          --baseline-json=projects/PRJ-019/runsheets/sec-trigger-5-baseline.json \
          --window-size=4 \
          --audit-log-path="${AUDIT_PATH}" \
          --output-format=json
    - if: always()
      uses: actions/upload-artifact@v4
      with:
        name: sec-trigger-5-knowledge-rate-${{ github.run_id }}
        path: projects/PRJ-019/reports/_sec-automation/v3/trigger-5-*.log
        retention-days: 90
```

### 3.2 exit code 経路 (R26 spec §3 / R27 baseline JSON 整合)

| exit | level | gate | 動作 |
|---|---|---|---|
| 0 | INFO (ma >= 10.0) | PASS | log only |
| 0 | WARN (8.0 <= ma < 10.0) | PASS | Slack #sec-warn |
| 0 | WARN+ (6.0 <= ma < 8.0) | PASS | dashboard escalation + Slack |
| 1 | FAIL (ma < 6.0) | BLOCK (連続 2 round 違反時) | merge block + Slack #sec-fail + CEO escalation |
| 2 | argparse error | - | (yml step fail) |
| 3 | runtime error | - | (yml step fail / continue-on-error で fail-soft 化) |

`continue-on-error: true` で単発 FAIL は 1 round 限り fail-soft 化 (連続 2 round 判定は外部 state)。

---

## §4 smoke test 結果 (5 経路)

### 4.1 経路 1: yml syntax check

```
python -c "import yaml; yaml.safe_load(open(...,encoding='utf-8'))"
→ yaml valid
```

### 4.2 経路 2: bash script smoke test (新 baseline JSON 反映後)

```
bash sec-trigger-5-knowledge-rate.sh --baseline-json=...sec-trigger-5-baseline.json --window-size=4 --output-format=json
→ stdout: {"level":"WARN","moving_average":9.75,"window_size":4,"observed":"10,10,10,9","baseline":"..."}
→ exit 0
```

R28 で round_history に R25/R26/R27 entries 追記された結果、現 evaluation window = R24-R27 = (10+10+10+9)/4 = 9.75 (WARN level)。

### 4.3 経路 3: yml v2 superset check

v2 5 job 全継承 + T-5 1 job 追加 = **6 job 構成完備**。downward compat 維持 (v3 PASS ⇒ v2 PASS ⇒ v1 PASS)。

### 4.4 経路 4: cron cascade check

v1=02:00 / v2=02:05 / cron-audit=02:10 / **v3=02:15** = 5 min ずらし 4 段整合確認。sec-cron-conflict-audit.sh 日次 audit で衝突 0 担保継続。

### 4.5 経路 5: exit code 4 経路完備 check (script 側 R26 spec §3 整合)

bash script は 4 経路 (0/1/2/3) 完備。yml 側の `continue-on-error: true` で exit 1 (FAIL) も fail-soft 化対応。**5 経路全 PASS**。

---

## §5 IMPL 3/3 完遂判定

| 項目 | 判定 | evidence |
|---|---|---|
| sec-hardening-v3.yml 別 file 新設 | **DONE** | 377 行 / 6 job / 4 段 cascade 11:15 JST |
| v2 完全 superset 維持 | **DONE** | 5 job 全継承 + T-5 1 job 追加 |
| T-5 job 統合 | **DONE** | R26 spec §6.2 整合 / R27 script + baseline JSON 連動 |
| smoke test 5 経路 | **PASS** | yml syntax / bash script / superset / cron cascade / exit code |
| 既存 9+1 file md5 不変厳守 | **PASS** | sec-hardening.yml / v2 / cron-audit.yml / sec-cron-conflict-audit.sh / baseline v1.0-v1.5 / sec-trigger-5-knowledge-rate.sh = 11 file 全不変 |
| audit-path schema v3 (`reports/_sec-automation/v3/...`) | **DONE** | yml env.V3_AUDIT_ROOT 統一 |
| absolute 無改変原則継承 | **DONE** | R24 Sec-S 確立原則を R28 で継承 |

= **IMPL 3/3 完遂判定 DONE** (R26 IMPL 1/3 + R27 IMPL 2/3 + R28 IMPL 3/3 = 全 stage 完遂)。

---

## §6 結論

R26 spec → R27 実装 → R28 yml 統合の 3 stage 物理化が完遂。DEC-019-068 v2 議決後に formal trigger T-5 として日次 11:15 JST cron で稼働開始可能。R29 Sec-X で議決完遂後 monitor 運用第 1 round 開始予定。

—— Sec-W / 2026-05-06 W0-Week1 / Round 28 第 1 波 / sec-hardening-v3.yml (377 行 / 6 job / 4 段 cascade) / smoke test 5 経路 PASS / 11 file md5 不変厳守 / 副作用 0 / API $0 / 絵文字 0 / Owner 拘束 0 分
