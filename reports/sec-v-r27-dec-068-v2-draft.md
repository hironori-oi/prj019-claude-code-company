# PRJ-019 Round 27 Sec-V — DEC-019-068 v2 起案 (T-5 5 件目 trigger formal 採用)

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R27 Sec-V / DEC-019-025 SOP 23 件目達成 / DEC-019-068 v1 → v2 改定起案
位置付け: Round 26 Sec-U が連続 12 round milestone + T-5 物理化 IMPL 1/3 (monitor script spec 物理化第 1 弾) 完遂、Round 27 Sec-V が連続 13 round milestone + T-5 物理化 IMPL 2/3 (measurement script + baseline JSON 実装) 完遂を承け、本 起案で **DEC-019-068 v2 = T-5 5 件目 trigger formal 採用** を提起。R23/R24/R25/R26 4 layer spec 累計 1271 行 + R27 実装 156 行 = 計 1427 行の base が形成済 = formal 採用条件成立。
版: v1.0 (起案 / R28 議決待ち)
連動 DEC: DEC-019-068 v1 (R23 Sec-R 起票時 trigger 4/4) / DEC-019-025 / 033 / 049 / 053 v15.5 / 054 / 055 / 057 / 062 / 066
連動 spec (絶対無改変): R23 Sec-R `sec-r-r23-trigger-5-candidate-spec.md` (242 行) / R24 Dev-RR `dev-rr-r24-trigger-5-physical-spec-detail.md` (444 行) / R25 Sec-T `sec-t-r25-info-3-physical-and-baseline-11round.md` §6 / R26 Sec-U `sec-trigger5-monitor-spec.md` (約 280 行)
連動 artifact: `projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh` (67 行) / `projects/PRJ-019/runsheets/sec-trigger-5-baseline.json` (89 行)
議決想定: R28 (CEO + Sec-W)

---

## §0 サマリ (CEO 250 字)

DEC-019-068 v1 は trigger 4/4 (T-1 stagger compression 適合率 / T-2 API spike $0 / T-3 tests baseline 不退行 / T-4 Owner 拘束時間 0 分) を formal 採用し、R15-R27 連続 13 round 全 PASS を達成済。本 v2 起案では **T-5 = knowledge entry 平均増加率 ≥ 8 件/round (4 round moving average / fail-soft 4 段階閾値) を 5 件目 trigger として formal 採用** を提起。採用根拠: (1) R23-R26 4 layer spec 累計 1271 行 base 形成済 / (2) R27 実装 (measurement script 67 行 + baseline JSON 89 行) PHYSICAL DONE / (3) R21-R24 4 round MA = 9.75 件/round = WARN level (PASS 閾値 8.0 件 +1.75 件余裕) / (4) 既存 trigger T-1〜T-4 と overlap なし (entries 増加率という新規軸) / (5) 連続 13 round milestone (ULTRA-EXTENDED 8 round 目) で baseline 強度十分 / (6) DEC-019-033 ナレッジ抽出機構連動で自動稼働健全性 metric として機能。代替案 3 件 (T-5b/T-5c/T-5d) 検討済で T-5a (現案) を最有力選定。R28 議決後 sec-hardening-v3.yml 統合で IMPL 3/3 完遂。

---

## §1 DEC-019-068 v1 → v2 改定範囲

### 1.1 v1 (現行 / R23 Sec-R 起案 + R22 Sec-Q 連続 8 round 達成 base)

```
DEC-019-068 v1: stagger compression baseline (trigger 4/4)
- T-1: stagger compression 適合率 >= 95%
- T-2: API spike $0 (round 内 spike 検出 0 件 / 1h 窓 cost cap breach 0)
- T-3: tests baseline 不退行 (regression 0)
- T-4: Owner 拘束時間 0 分 (HITL/escalation 拘束時間 0)
status: ESTABLISHED (R22 / 8 round) → EXTENDED (R23 / 9 round) → ULTRA-EXTENDED (R24 / 10 round)
       → ULTRA-EXTENDED 6 round 目 (R25 / 11 round) → 7 round 目 (R26 / 12 round)
       → 8 round 目 (R27 / 13 round = 本 round)
```

### 1.2 v2 (本起案 / 5 件目 trigger T-5 追加)

```
DEC-019-068 v2: stagger compression baseline (trigger 5/5)
- T-1〜T-4: v1 と同 (改変なし)
- T-5 (新規): knowledge entry 平均増加率 >= 8 件/round
  - measurement: 4 round moving average
  - data source: organization/knowledge/{patterns,decisions,pitfalls,playbooks}/*.md
  - ground truth: organization/knowledge/INDEX-v(N).md total_entries (R26 時点 = INDEX-v14 / 140 entries)
  - thresholds: INFO >= 10 / WARN 8-10 / WARN+ 6-8 / FAIL < 6 (連続 2 round 違反)
  - exit code: INFO/WARN/WARN+ = 0 / FAIL = 1 (merge block)
  - artifact:
    * scripts/sec-trigger-5-knowledge-rate.sh (R27 / 67 行)
    * runsheets/sec-trigger-5-baseline.json (R27 / 89 行)
    * .github/workflows/sec-hardening-v3.yml (R28 想定)
```

### 1.3 改定差分 summary

| 項目 | v1 | v2 |
|---|---|---|
| trigger 数 | 4 | **5** |
| measurement window | round 単位 | round 単位 (T-1〜T-4) + 4 round MA (T-5) |
| fail-soft | continue-on-error の job 単位 | continue-on-error + 4 段階閾値 (T-5 specific) |
| artifact | sec-hardening.yml + sec-hardening-v2.yml + sec-cron-audit.yml + sec-cron-conflict-audit.sh | v1 全 + sec-trigger-5-knowledge-rate.sh + sec-trigger-5-baseline.json + sec-hardening-v3.yml (R28) |
| baseline JSON | sec-stagger-compression-baseline-Nround.json (round 集計) | v1 全 + sec-trigger-5-baseline.json (T-5 専用) |
| pass 条件 | trigger_4_of_4_pass | **trigger_4_of_4_pass AND (T-5 level in {INFO, WARN, WARN+})** = trigger_5_of_5_pass |

---

## §2 採用根拠 (6 軸)

### 2.1 軸 1: 4 layer spec 累計 1271 行 + 実装 156 行 = 計 1427 行の base 形成済

| layer | round | 担当 | 行数 | 役割 |
|---|---|---|---|---|
| layer 1 | R23 | Sec-R | 242 | T-5 候補 4 件比較 + 最有力 1 件 spec 化 |
| layer 2 | R24 | Dev-RR | 444 | 6 軸物理化 spec 詳細化 |
| layer 3 | R25 | Sec-T | 60 (305 行報告書 §6) | R26 物理化 readiness 7/7 軸確認 |
| layer 4 | R26 | Sec-U | 約 280 | monitor script formal trigger 化 spec 物理化 IMPL 1/3 |
| layer 5 (実装) | R27 | Sec-V | 67 + 89 = 156 | measurement script + baseline JSON 実 file 物理化 IMPL 2/3 |
| **計** | - | - | **1271 行 spec + 156 行実装 = 1427 行** | **物理化 base 完成** |

5 round (R23-R27) かけて段階的に詳細化された設計 = formal 採用に必要な精査済 spec base。

### 2.2 軸 2: R27 実装 PHYSICAL DONE + smoke test PASS

R27 Sec-V (本 round) で:
- measurement script 67 行 (R26 spec §4 引数契約 6 種 + stdin/stdout + exit code 4 経路 全準拠)
- baseline JSON 89 行 (R26 spec §5.1 schema + round_history R21-R24 seed + thresholds 4 段階)
- bash syntax PASS / JSON parse PASS / smoke test READ-ONLY 実行 = level=WARN / ma=9.75 / exit 0

= **実装も完遂 = R28 yml 統合 (IMPL 3/3) で formal 稼働可能**。

### 2.3 軸 3: R21-R24 4 round MA = 9.75 件/round = WARN level (PASS 閾値余裕)

| window | entries 系列 | average | level |
|---|---|---|---|
| R18-R21 | 11+11+9+9 | 10.0 | INFO (境界) |
| R19-R22 | 11+9+9+10 | 9.75 | WARN |
| R20-R23 | 9+9+10+10 | 9.5 | WARN |
| **R21-R24** | **9+10+10+10** | **9.75** | **WARN** |

R21-R24 4 round 移動平均 = **9.75 件/round = WARN level** (8.0 ≤ avg < 10.0)。R23 Sec-R PASS 閾値 8.0 件/round を **1.75 件余裕で満たす**。INFO 閾値 10.0 にも近い (0.25 件不足のみ)。実績下限充分満たし、過剰閾値ではない。

### 2.4 軸 4: 既存 trigger T-1〜T-4 と overlap なし

| trigger | 計測対象 | T-5 との overlap |
|---|---|---|
| T-1 stagger compression 適合率 | 9 並列 stagger 完遂率 | なし (適合率 vs entries 数) |
| T-2 API spike $0 | API call cost | なし (cost vs entries 数) |
| T-3 tests baseline 不退行 | test count delta | なし (test vs knowledge) |
| T-4 Owner 拘束時間 | HITL/escalation 拘束分 | なし (時間 vs entries) |
| **T-5 knowledge entry 増加率** | **ナレッジ entries / 4 round MA** | **新規軸 (overlap なし)** |

T-5 は trigger 4/4 が捕捉できない「ナレッジ抽出機構の自動稼働健全性」を計測 = trigger 集合の盲点を埋める。

### 2.5 軸 5: 連続 13 round milestone (ULTRA-EXTENDED 8 round 目) で baseline 強度十分

DEC-019-068 v1 baseline 状態遷移:
- 連続 8 round (R22) = ESTABLISHED 形成
- 連続 9 round (R23) = EXTENDED
- 連続 10 round (R24) = ULTRA-EXTENDED 達成
- 連続 11 round (R25) = ULTRA-EXTENDED 6 round 目
- 連続 12 round (R26) = ULTRA-EXTENDED 7 round 目 + T-5 IMPL 1/3
- **連続 13 round (R27 = 本 round) = ULTRA-EXTENDED 8 round 目 + T-5 IMPL 2/3 + DEC-068 v2 起案**

連続 13 round 全 PASS (T-1 100% / T-2 $0 / T-3 0 / T-4 0 分) = baseline 安定性証明 = T-5 追加に対する強度十分。

### 2.6 軸 6: DEC-019-033 ナレッジ抽出機構連動 = 自動稼働健全性 metric

CLAUDE.md §基本ルール 6 (DEC-019-033 拡張):
- patterns/ / decisions/ / pitfalls/ / playbooks/ 4 ディレクトリ
- 案件完了時に Claude Code 組織が自動的にナレッジを抽出し構造化蓄積
- HITL 第 11 種 `knowledge_pii_review` で人間チェック可

T-5 の WARN/FAIL = ナレッジ抽出機構の自動稼働停滞 signal:
- avg < 8 件/round (WARN+) = 自動抽出 throughput 低下 = mechanism review 必要
- 連続 2 round avg < 6 (FAIL) = ナレッジ抽出機構停止 = merge block + CEO escalation

T-5 はナレッジ抽出機構の signal as a system = DEC-019-033 連動 metric として機能。

---

## §3 代替案 検討 (R23 Sec-R 4 候補比較)

### 3.1 候補 4 件比較

| 候補 | 計測対象 | PASS 閾値 | 軽量性 | overlap | 採用判定 |
|---|---|---|---|---|---|
| **T-5a (本案)** | knowledge entry 増加率 4 round MA | >= 8 件/round | 高 (file count diff) | なし | **最有力 (本起案)** |
| T-5b | INDEX retrieval 100% 連続維持 | retrieval 不達 0 件 | 中 (retrieval 連動) | T-3 と一部 overlap (test 連動可能性) | 次点 |
| T-5c | DEC readiness 軸増加率 | >= 1 件/round | 中 (DEC 起票連動) | T-1 と弱 overlap (round 進行) | 採用見送り |
| T-5d | Owner 拘束圧縮率 | >= 70% baseline (R8-14 平均 30 分) | 低 (baseline 計算複雑) | **T-4 と直接 overlap** | 採用見送り |

### 3.2 T-5a 選定理由

1. **measurement 軽量**: file count diff のみ = node fs.readFileSync で完結 / 副作用 0 / network 0
2. **既存 trigger との overlap なし**: T-4 と直交 (時間 vs 件数)
3. **DEC-019-033 連動**: ナレッジ抽出機構の自動稼働 signal
4. **fail-soft 4 段階閾値**: INFO/WARN/WARN+/FAIL の段階的 escalation で過敏な fail-fast を回避
5. **実績 base**: R21-R24 4 round MA = 9.75 件/round で実績下限 8.0 を 1.75 件余裕で満たす (R23-R26 4 layer spec 検証済)

---

## §4 v2 採用後の運用方針

### 4.1 IMPL 3/3 (R28) スケジュール

| Round | 担当 | 作業 | 成果物 | 行数 想定 |
|---|---|---|---|---|
| R28 | Sec-W + Dev | sec-hardening-v3.yml 別 file 新設 + DEC-019-068 v2 議決 | sec-hardening-v3.yml (約 380 行 = v2 superset + T-5 job) + verification.md (約 150 行) | 約 530 行 |

### 4.2 R28 sec-hardening-v3.yml job structure (R26 §6.2 整合)

```yaml
sec-trigger-5-knowledge-rate:
  name: Sec / T-5 knowledge entry growth rate (fail-soft / 4 段階閾値)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 50
    - name: Prepare audit dir
      run: mkdir -p projects/PRJ-019/reports/_sec-automation/v3
    - name: Run sec-trigger-5-knowledge-rate.sh
      continue-on-error: true
      run: |
        AUDIT="projects/PRJ-019/reports/_sec-automation/v3/trigger-5-${{ github.run_id }}-$(date +%s).log"
        bash projects/PRJ-019/scripts/sec-trigger-5-knowledge-rate.sh \
          --baseline-json=projects/PRJ-019/runsheets/sec-trigger-5-baseline.json \
          --window-size=4 \
          --audit-log-path="${AUDIT}" \
          --output-format=json
    - name: Upload trigger-5 audit log artifact
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: sec-trigger-5-knowledge-rate-${{ github.run_id }}
        path: projects/PRJ-019/reports/_sec-automation/v3/trigger-5-*.log
        retention-days: 90
```

### 4.3 4 段 cascade (R28 着地後)

| yml | cron (UTC) | cron (JST) | 役割 |
|---|---|---|---|
| sec-hardening.yml (v1) | 0 2 * * * | 11:00 JST | historical baseline + sec-api-spike trajectory |
| sec-hardening-v2.yml (v2) | 5 2 * * * | 11:05 JST | v1 superset + Info 1+2 物理化 |
| sec-cron-audit.yml | 10 2 * * * | 11:10 JST | 全 yml cron 衝突 audit |
| **sec-hardening-v3.yml (T-5)** | **15 2 * * *** | **11:15 JST** | **v2 superset + T-5 5 件目 job 統合 (R28)** |

### 4.4 absolute 無改変原則の継承

R28 で v3 別 file 新設しても v1 / v2 / sec-cron-audit.yml / sec-cron-conflict-audit.sh / baseline JSON v1.0-v1.5 / sec-trigger-5-knowledge-rate.sh / sec-trigger-5-baseline.json の md5 は 1 byte 不変厳守 (R24 Sec-S 確立原則の継承)。

---

## §5 議決想定 (R28 CEO + Sec-W)

### 5.1 議決対象 5 件

| # | 議決事項 | 提案 | 議決方針案 |
|---|---|---|---|
| 1 | DEC-019-068 v1 → v2 改定 | T-5 5 件目 trigger formal 採用 | **承認** (採用根拠 6 軸全成立) |
| 2 | T-5 PASS 閾値 (4 段階) | INFO 10 / WARN 8 / WARN+ 6 / FAIL 4 (連続 2 round) | **承認** (R23-R26 spec 累積検討済) |
| 3 | R27 artifact (script + baseline JSON) absolute 無改変原則追加 | 9 file → 11 file 不変対象拡大 | **承認** (R24 Sec-S 確立原則の継承) |
| 4 | sec-hardening-v3.yml 別 file 新設 | 4 段 cascade 11:15 JST | **承認** (R26 §6.2 spec 整合) |
| 5 | trigger_5_of_5_pass = trigger_4_of_4_pass AND (T-5 level in {INFO, WARN, WARN+}) | 採用 | **承認** (R26 §2.3 spec 整合) |

### 5.2 risk 評価 (Sec-V R27 起案時想定)

| risk | 軽重 | 緩和策 |
|---|---|---|
| T-5 FAIL 連続 2 round で merge block 過剰反応 | 低 | fail-soft 4 段階閾値 + WARN/WARN+ で escalation のみ (block しない) |
| INDEX-v(N) 起算の取得失敗 | 中 | baseline JSON round_history append-only 原則 / fallback 静的値 |
| baseline JSON 改変による history corruption | 低 | predecessor absolute 無改変原則 + md5 1 byte 不変厳守 |
| sec-hardening-v3.yml cron 衝突 | 低 | sec-cron-conflict-audit.sh で日次 audit (R25 Sec-T 物理化済 / R26 Sec-U dry-run verified) |

### 5.3 議決後 R28 着地条件

- sec-hardening-v3.yml 別 file 新設 (約 380 行 / v2 完全 superset / T-5 job 統合)
- DEC-019-068 v2 正式承認 + dashboard 反映
- baseline-13round.json (v1.5) → baseline-14round.json (v1.6) 拡張 (R28 entry append)
- sec-trigger-5-baseline.json round_history に R25/R26/R27 entries 追記 (Knowledge 部署起票後)

---

## §6 R27 Sec-V 起案者宣言

R23 Sec-R 起案 (242 行 / 4 候補 + T-5a 最有力選定) → R24 Dev-RR 物理化詳細 (444 行 / 6 軸 spec) → R25 Sec-T readiness (60 行 / 7/7 READY) → R26 Sec-U IMPL 1/3 (約 280 行 / monitor spec 物理化) → R27 Sec-V IMPL 2/3 (67 行 + 89 行 = 156 行 / measurement script + baseline JSON 実装) で形成された **計 1427 行 (1271 行 spec + 156 行実装) の base** をもとに、本 起案で **DEC-019-068 v2 = T-5 5 件目 trigger formal 採用** を提起する。採用根拠 6 軸: (1) 4 layer spec 1271 行 + R27 実装 156 行 base 形成済 / (2) R27 実装 PHYSICAL DONE + smoke test PASS (level=WARN / ma=9.75 / exit 0) / (3) R21-R24 4 round MA = 9.75 件/round = WARN level (PASS 閾値 8.0 +1.75 件余裕) / (4) 既存 trigger T-1〜T-4 と overlap なし / (5) 連続 13 round milestone (ULTRA-EXTENDED 8 round 目) baseline 強度十分 / (6) DEC-019-033 ナレッジ抽出機構連動の自動稼働健全性 metric。代替案 3 件 (T-5b INDEX retrieval / T-5c DEC readiness / T-5d Owner 拘束圧縮) 検討済で T-5a (本案) を最有力選定。R28 議決後 sec-hardening-v3.yml 別 file 新設 (4 段 cascade 11:15 JST) で IMPL 3/3 完遂。R23/R24/R25/R26 spec absolute 無改変保持 + 8 file md5 1 byte 不変厳守 + 9 file (R26 着地 v1.4 + monitor spec) 全不変。副作用 0 / API $0 / 絵文字 0。本 起案は R27 Sec-V (本 round) が起案 / R28 Sec-W + CEO 議決を待つ。

—— Sec-V / 2026-05-05 W0-Week1 / Round 27 第 1 波 / DEC-019-068 v2 起案 (T-5 5 件目 trigger formal 採用 / 採用根拠 6 軸全成立 / 代替案 3 件比較 / R28 議決待ち)
