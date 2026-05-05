# PRJ-019 Round 23 Sec-R — DEC-019-068 trigger 5 件目 (T-5) 候補検討 + spec 化報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R23 Sec-R / DEC-019-025 SOP 19 件目候補 (継続深化)
位置付け: Round 22 Sec-Q が「Round 26 連続 12 round PASS milestone で trigger 5 件目追加検討」と明記した formal review item を、Round 23 Sec-R が **3 round 前倒しで spec 化** する。4 候補比較 → 最有力 1 件採用 → spec 化 → R26 formal 採否準備。
版: v1.0
連動 DEC: DEC-019-025 / 033 / 049 / 066 / 068
連動 baseline: `runsheets/sec-stagger-compression-baseline-9round.json` (R23 Sec-R / v1.1 / 170-180 行) §trigger_5_candidate_preview block

---

## §0 サマリ (CEO 200 字)

Round 23 第 1 波 Sec-R は Round 22 Sec-Q が R26 milestone に予定していた DEC-019-068 trigger 5 件目候補検討を **3 round 前倒し** で実施。4 候補 (T-5 / T-5b / T-5c / T-5d) を 7 評価軸 (測定軽量度 / 副作用 / API コスト / 自己強化サイクル整合 / DEC link / 既存 baseline 流用度 / R23 時点実績有無) で比較し、最有力 **T-5 = 「knowledge entry 平均増加率 >= 8 件/round」** を採用 spec 化。採用根拠は (1) DEC-019-033 ナレッジ抽出機構と直接連動 / (2) Round 21-22 実績 8.5 件/round で実 baseline 値が下限を満たす / (3) 測定が file count diff のみで API call $0 / 副作用 0 / (4) 既存 T-1〜T-4 と独立軸で trigger overlap なし。落選 3 件 (T-5b INDEX retrieval 100% / T-5c DEC readiness / T-5d Owner 拘束圧縮率) は R26 formal 採否時の **代替 / 補完候補** として保留。spec は PASS 条件 / 測定 method / 違反時 action / fail-soft/fast 区分 / 既存 trigger 連動の 5 軸で確定。R26 で formal 採否 → R27 で物理化 (sec-knowledge-entry-rate-check.sh 起案) → R28 で yml 統合 想定。R23 spec 段階で API 追加コスト $0 / 副作用 0 / 既存 baseline 無改変。

---

## §1 R22 Sec-Q が残した formal review item (継承)

R22 `sec-q-r22-stagger-baseline-8round.md` §6.3 抜粋:

> **Round 26** (連続 12 round PASS 達成) で trigger 5 件目追加検討:
> - 候補 T-5: 「Sec gate runtime <= 5 分」(CI runtime budget cap)
> - 候補 T-6: 「ナレッジ抽出件数 >= 3 件 / round」(DEC-019-033 拡張連動)
> - **Review due date**: 2026-05-26 (W3 mid-check 強行採決 milestone)

R23 Sec-R はこの T-5/T-6 の 2 件に **2 候補追加 (計 4 候補)** で検討範囲を拡張、最有力 1 件を formal spec 化する。

### 1.1 R22 → R23 候補拡張表

| R22 提示 | R23 採用候補 ID | 補強事項 |
|----|----|----|
| 候補 T-5 「Sec gate runtime <= 5 分」 | (採用見送り) | CI runtime は GitHub Actions 側で既に観測可、独立 trigger 化 redundancy |
| 候補 T-6 「ナレッジ抽出件数 >= 3 件 / round」 | **T-5 (lead) に進化**: >= 8 件/round (実測 8.5 件で下限上方修正) | DEC-019-033 拡張本格連動 |
| (R23 新規) | T-5b 「INDEX retrieval 100% 連続維持」 | INDEX v11 = 110 entries milestone 実績連動 |
| (R23 新規) | T-5c 「DEC readiness 軸増加率 >= 1 件/round」 | R22 議決 36 件 → R23 37 件 実績連動 |
| (R23 新規) | T-5d 「Owner 拘束圧縮率 >= 70% baseline」 | T-4 既存 metrics 拡張 |

---

## §2 4 候補詳細 (T-5 / T-5b / T-5c / T-5d)

### 2.1 T-5: knowledge entry 平均増加率 >= 8 件/round (lead)

| 項目 | 内容 |
|----|----|
| 名称 | knowledge entry 平均増加率 |
| 単位 | entries_per_round (>= 8.0) |
| PASS 条件 | round 内 `organization/knowledge/{patterns,decisions,pitfalls}/` への新規追加 entries 平均が >= 8 件 |
| 測定 method | `git diff --name-only --diff-filter=A <BASE_REF>...<HEAD_REF> -- 'organization/knowledge/**/*.md' \| wc -l` |
| 違反時 action | WARN (fail-soft / 1 round 単独違反では gate FAIL せず / 連続 2 round 違反で WARN 昇格) |
| fail-soft/fast 区分 | **fail-soft** (knowledge 蓄積は中長期 metric / 単 round の偏差許容) |
| DEC link | DEC-019-033 (拡張 / CLAUDE.md §6 ナレッジ蓄積) |
| 既存 trigger 連動 | T-1-4 と独立軸 (overlap なし) |
| R23 時点 baseline 実績 | R21-R22 平均 8.5 件/round (Sec-P yml + 12 tests / Sec-Q baseline + spec) |

### 2.2 T-5b: INDEX retrieval 100% 連続維持

| 項目 | 内容 |
|----|----|
| 名称 | INDEX retrieval 100% 連続維持 |
| 単位 | retrieval_fail_count (= 0) |
| PASS 条件 | round 内 INDEX retrieval 不達 0 件 (INDEX v10 = 101 entries / v11 = 110 entries) |
| 測定 method | INDEX 参照 log audit (現状未自動化 / 手動 sample 検証) |
| 違反時 action | FAIL (1 件不達で gate FAIL / 既存 T-3 と類似厳格度) |
| fail-soft/fast 区分 | **fail-fast** (retrieval 不達は即座に knowledge access 機能不全) |
| DEC link | DEC-019-033 (INDEX 構造化) |
| 既存 trigger 連動 | T-3 (tests baseline) と類似機構 |
| R23 時点 baseline 実績 | R22 → R23 で v10 (101 entries) → v11 (110 entries) 拡張済 / retrieval 不達 0 件 |

### 2.3 T-5c: DEC readiness 軸増加率 >= 1 件/round

| 項目 | 内容 |
|----|----|
| 名称 | DEC readiness 軸増加率 |
| 単位 | dec_per_round (>= 1.0) |
| PASS 条件 | round 内 DEC 起票 → 議決 平均 lag <= 1 round / round 内 DEC 純増 >= 1 件 |
| 測定 method | `decisions.md` 内 DEC-NNN counter diff |
| 違反時 action | WARN (fail-soft) |
| fail-soft/fast 区分 | **fail-soft** |
| DEC link | (DEC ID 番号体系本体) |
| 既存 trigger 連動 | T-1-4 と独立軸 |
| R23 時点 baseline 実績 | R22 36 件 → R23 37 件 (+1 件) |

### 2.4 T-5d: Owner 拘束圧縮率 >= 70% baseline

| 項目 | 内容 |
|----|----|
| 名称 | Owner 拘束圧縮率 |
| 単位 | percent (>= 70%) |
| PASS 条件 | R8-14 平均 30 分基準で 70% 圧縮 = round 内 Owner 拘束 9 分以下 |
| 測定 method | T-4 既存 metrics 流用 + R8-14 historical baseline 算出 |
| 違反時 action | WARN |
| fail-soft/fast 区分 | **fail-soft** (T-4 既存と二重判定) |
| DEC link | DEC-019-068 (T-4 既存) |
| 既存 trigger 連動 | T-4 と **重複 risk** (overlap risk) |
| R23 時点 baseline 実績 | R15-23 連続 9 round 全 0 分 = 100% 圧縮 (上限値で trigger 自体が trivial になる risk) |

---

## §3 7 評価軸での 4 候補比較

| 評価軸 | T-5 (lead) | T-5b | T-5c | T-5d |
|----|----|----|----|----|
| 1. 測定軽量度 (file count / log / API) | **高** (file count diff) | 中 (log audit 必要) | 中 (DEC log 集計) | 高 (T-4 流用) |
| 2. 副作用 0 | **OK** (read-only) | OK (read-only) | OK (read-only) | OK (T-4 流用) |
| 3. API コスト $0 | **OK** | OK | OK | OK |
| 4. 自己強化サイクル整合 | **高** (knowledge 蓄積機構と直接連動) | 中 (既存 INDEX 機構連動) | 中 (DEC ライフサイクル連動) | 低 (T-4 重複) |
| 5. DEC link 強度 | **DEC-019-033 直接** | DEC-019-033 INDEX | (本体番号) | DEC-019-068 既存 |
| 6. 既存 baseline 流用度 | 低 (新規) | 中 (INDEX 既存) | 中 (DEC log 既存) | **高 (T-4 完全流用)** |
| 7. R23 時点実績有無 | **8.5 件/round 実績** | 100% 実績 | +1 件/round 実績 | 100% 圧縮実績 (trivial risk) |

### 3.1 評価結果

- **T-5 採用** (7 軸中 6 軸で「高」or「OK」/ 唯一弱点は軸 6 の新規性だが軸 4 自己強化サイクル整合の高さで相殺)
- **T-5b 保留** (R26 formal 採否時の補完候補 / 自動化 log audit 機構が前提条件)
- **T-5c 保留** (DEC ライフサイクル健全性 metric として将来 T-6 候補化)
- **T-5d 不採用** (T-4 重複 / 100% 圧縮実績で trivial / 軸 4 自己強化サイクル整合 低)

---

## §4 T-5 formal spec (採用候補)

### 4.1 trigger 定義

```yaml
T-5:
  name: "knowledge entry 平均増加率"
  unit: "entries_per_round"
  pass_threshold: 8.0       # 平均 >= 8 件/round
  measurement_method: "file_count_diff"
  measurement_target_paths:
    - "organization/knowledge/patterns/**/*.md"
    - "organization/knowledge/decisions/**/*.md"
    - "organization/knowledge/pitfalls/**/*.md"
  measurement_command: |
    git diff --name-only --diff-filter=A "$BASE_REF"..."$HEAD_REF" \
      -- 'organization/knowledge/**/*.md' | wc -l
  fail_mode: "fail-soft"
  warn_threshold_consecutive: 2   # 連続 2 round 違反で WARN 昇格
  fail_threshold_consecutive: 4   # 連続 4 round 違反で FAIL 昇格
  dec_link:
    - "DEC-019-033"
    - "DEC-019-068"
  trigger_overlap_with: []        # T-1-4 と overlap なし
```

### 4.2 PASS 条件詳細

- **基本**: round 内 `organization/knowledge/{patterns,decisions,pitfalls}/*.md` への新規追加 (`--diff-filter=A`) ファイル数 >= 8
- **計算単位**: 単 round (round-by-round 評価)
- **平均化窓**: 直近 3 round 移動平均で 8 件以上を維持 (1 round の偏差を許容)
- **違反判定**: 単 round で >= 8 件不達 + 直近 3 round 移動平均 < 8 件 = 1 件 violation

### 4.3 fail-soft 段階

| violation 連続数 | gate level | 動作 |
|----|----|----|
| 1 round | INFO | log のみ / gate PASS |
| 2 round (連続) | WARN | Slack 通知 / gate PASS |
| 3 round (連続) | WARN+ | dashboard escalation / gate PASS |
| 4 round (連続) | FAIL | gate FAIL / merge ブロック |

### 4.4 既存 trigger 連動

- T-1 (stagger compression 適合率): 直接連動なし
- T-2 (API spike $0): file count 測定は git only / API call 0 / T-2 整合
- T-3 (tests baseline): 別軸 / overlap なし
- T-4 (Owner 拘束 0 分): 別軸 / 知識蓄積は automatic generation 想定 (Owner 拘束増加 risk なし)

### 4.5 物理化想定 (R26-R28)

| Round | 担当 | 成果物 |
|----|----|----|
| R26 (連続 12 round PASS milestone) | Sec | T-5 formal 採否決定 + DEC-019-068 v2 起案 |
| R27 | Sec | `scripts/sec-knowledge-entry-rate-check.sh` 起案 (R23 spec を実装) |
| R28 | Sec | `.github/workflows/sec-hardening.yml` 内 5 件目 job 統合 (yml 物理化) |

R23 段階では spec 確定のみ / 物理化は R26 採否後。

---

## §5 R26 formal 採否準備項目

### 5.1 採否時に検証すべき項目

- 連続 12 round 実績 (R15-R26) で T-5 を retroactive 適用した場合の PASS/FAIL シミュレーション
- knowledge entry の round 別実数集計 (現状 R21-R22 8.5 件 実績 → R23-R25 で実測継続)
- 落選 3 候補 (T-5b/c/d) の R26 時点再評価

### 5.2 採否文書 template

```
DEC-019-068 v2 (R26 milestone):
  baseline_status: "ESTABLISHED + EXTENDED (12 round consecutive at R26)"
  trigger_v2_definition:
    T-1: <既存>
    T-2: <既存>
    T-3: <既存>
    T-4: <既存>
    T-5: "knowledge entry 平均増加率 >= 8 件/round (R23 Sec-R spec 採用)"
  candidates_held:
    - T-5b: "INDEX retrieval 100% 連続維持 (R27+ 自動化 audit 機構整備後再検討)"
    - T-5c: "DEC readiness 軸増加率 (R28+ T-6 候補化)"
  candidates_rejected:
    - T-5d: "Owner 拘束圧縮率 (T-4 重複 / 100% 圧縮実績で trivial)"
```

---

## §6 R23 spec 段階の quality gate

| 項目 | 状態 | 備考 |
|------|------|----|
| 副作用 0 | OK | spec doc 新規作成のみ / 既存 file 無改変 |
| 絵文字 0 | OK | 全文走査で絵文字使用なし |
| API 追加コスト $0 | OK | Read + Write のみ / 外部 API call 0 |
| 4 候補比較完遂 | OK | T-5 / T-5b / T-5c / T-5d の 4 候補すべて 7 軸評価 |
| 最有力 1 件 spec 確定 | OK | T-5 (knowledge entry 平均増加率) を採用 + spec 5 軸確定 |
| R22 formal review item 継承 | OK | R22 候補 T-5/T-6 を含めて 4 候補に拡張統合 |
| Round 26 採否準備 | OK | §5 採否時検証項目 + 文書 template 提示 |
| historical baseline 整合 | OK | R22 BS-1〜BS-4 / R23 v1.1 baseline 引用整合 |

---

## §7 Round 23 引継 (trigger 5 候補 spec 部分)

| 引継 ID | 内容 | 担当想定 | 優先度 |
|------|----|------|------|
| R-T5-1 | R24-R25 で knowledge entry 件数 round 別実測継続 | Round 24-25 Sec | 高 |
| R-T5-2 | R26 で T-5 formal 採否 + DEC-019-068 v2 起案 | Round 26 Sec | 高 |
| R-T5-3 | R27 で `sec-knowledge-entry-rate-check.sh` 起案 | Round 27 Sec | 中 |
| R-T5-4 | R28 で sec-hardening.yml 5 件目 job 統合 | Round 28 Sec | 中 |
| R-T5-5 | T-5b INDEX retrieval audit 機構の自動化検討 | Round 27+ Sec | 低 |
| R-T5-6 | T-5c DEC readiness 軸の T-6 候補化検討 | Round 28+ Sec | 低 |

---

## §8 Sec-R T-5 候補 spec 完遂宣言

R22 Sec-Q が R26 milestone に予定していた DEC-019-068 trigger 5 件目候補検討を **3 round 前倒し** で R23 Sec-R が実施。R22 提示 2 候補 (T-5 Sec gate runtime / T-6 ナレッジ抽出件数) に R23 新規 2 候補 (T-5b INDEX retrieval / T-5d Owner 拘束圧縮率) を追加した計 4 候補 (T-5 / T-5b / T-5c / T-5d) を 7 評価軸 (測定軽量度 / 副作用 / API コスト / 自己強化サイクル整合 / DEC link / 既存 baseline 流用度 / R23 時点実績有無) で比較。最有力 **T-5 = 「knowledge entry 平均増加率 >= 8 件/round」** を採用し formal spec 化 (PASS 条件 / 測定 method `git diff --diff-filter=A` / fail-soft 4 段階 / 既存 trigger 連動 / 物理化想定 R26-R28 の 5 軸)。落選 3 件は R26 formal 採否時の代替 / 補完候補として保留。R23 spec 段階で API 追加コスト $0 / 副作用 0 / 既存 baseline 無改変。R26 連続 12 round milestone を 3 round 前倒しで spec 完成、Round 24 Sec-S は実測継続、Round 26 Sec で formal 採否決定。

—— Sec-R / 2026-05-05 W0-Week1 / Round 23 第 1 波 / DEC-019-025 SOP 19 件目候補 (継続深化) / trigger 5 件目 T-5 spec 確定
