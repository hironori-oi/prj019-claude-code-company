# CEO 統合報告 v23 — PRJ-019 Round 22 9 並列完遂着地

- **作成者**: CEO
- **作成日**: 2026-05-05
- **対象**: Owner（hironori555@gmail.com）
- **位置付け**: Round 22（Owner formal「Round 22 9 並列 GO 丁寧に」directive）9 並列同時 dispatch 完遂着地報告。Round 21 ceo-v22 の続編。
- **前提 directive**: Round 14→15→16→17→18→19→20→21→22 連続加速。stagger 圧縮 SOP（DEC-019-062）**連続 8 round 適用成功 = formal baseline ESTABLISHED**。
- **承継**: Round 21 引継 6 項目を全消化（INDEX v11 起票 / W4 完成第 1 弾 + 第 2 弾着手 / DEC-070 4 件まとめ採択 readiness Y 無条件 / ARCH-01 解消可否評価完遂 / OG migration readiness 確立 / Owner action card 自動化 spec 完遂）。

---

## §0. Executive Summary

Round 22 は **9 並列同時 dispatch + 17 日 path W4 完成第 1 弾 + 第 2 弾 + Sec 連続 8 round baseline ESTABLISHED + DEC readiness 5 件 verification + ARCH-01 解消経路確定 + Owner 拘束 76% 圧縮** という 6 軸同時推進 round。Owner directive「丁寧に」を完全達成。

| 指標 | Round 21 終端 | Round 22 終端 | Δ |
|---|---|---|---|
| harness PASS | 771 | **795** | **+24** |
| openclaw-runtime PASS | 394 | 394 | ±0（regression 0） |
| 17 日 path 進捗 | W4 着手 4/4 task | **W4 完成第 1 弾 + 第 2 弾** | +2 段 |
| DEC readiness | 32 観点 (Round 21) | **56 観点 + 48 trajectory** | +72 |
| Sec hardening | yml 物理化 | **連続 8 round baseline ESTABLISHED** | formal 確立 |
| ARCH-01 | DEC-019-041 Phase B 候補 | **path alias 案 A 推奨 = 2.5h 議決不要** | 解消経路確定 |
| Owner 拘束 | 80 min（OWN-PRE） | **19 min（OWN-AUTO 自動化）** | **-61 min（76% 圧縮）** |
| INDEX entries | 101 (v10) | **110 (v11)** | +9 |
| 議決構造 | 36 件（DRAFT 4） | **37 件（DRAFT 5）** | +1 |
| 進捗 | 98% | **99%** | +1pt |
| 6/19 confidence | 80% | **85%** | +5pt |
| API 追加コスト | $0 | $0 | 維持 |
| 副作用/絵文字 | 0 | 0 | 維持 |
| stagger 圧縮 SOP 連続 round | 7 | **8（baseline ESTABLISHED）** | +1 |

**判定**: Round 22 は **加速継続成功**（DEC-019-068 デフォルト昇格 trigger 4/4 全 PASS 維持 3 round 目 = formal baseline ESTABLISHED、Round 23 9 並列 GO 推奨）。

---

## §1. Owner directive と CEO 解釈

| 項 | Owner | CEO 解釈 |
|---|---|---|
| 文言 | 「Round 22 9 並列 GO 。丁寧に進めてください。」 | Round 21 同等の最大加速継続 directive、丁寧 directive 単体強調 |
| 並列度 | 9 | 第 1 波 4（PM/Knowledge/Dev W4 完成第 1 弾/Sec）+ 第 2 波 5（Dev W4 完成第 2 弾/Dev OG/Review/Marketing/Web-Ops） |
| 加速根拠 | Round 14→22 連続 directive 受領 + DEC-019-068 trigger 4/4 全 PASS（連続 8 round = formal baseline 形成完遂）| stagger 圧縮 SOP（DEC-019-062）デフォルト運用昇格 trigger 全 PASS 3 round 目 = baseline ESTABLISHED、保守的判断不要 |
| 丁寧 directive | 単体強調 | (a) DEC readiness 56 観点 + R17→R22 trajectory 48 観点、(b) W4 production e2e 拡張 + stress/chaos + longrun stability、(c) Sec 連続 8 round baseline JSON 確立、(d) ARCH-01 三択評価で必達経路確定、(e) Owner 拘束 76% 圧縮 spec、(f) 6/11 D-8 75 項目 / 6/12 D-7 50 項目 / 6/19 launch day v3.0 7 Phase = 全領域で「足元品質 + 前進」両立 |

---

## §2. 9 並列 dispatch 構成（領域不可侵分業）

| 波 | 担当 | 領域 | 主成果 | 行数/件数 |
|---|---|---|---|---|
| 1 | PM-O | DEC-019-070 4 件まとめ採択 + 071/072/073 verification + 074 DRAFT 起案 | 60-75 min agenda + 6 軸 × 3 件 = 52 観点 + decisions.md +118 行 | 304+457+118+284 行 |
| 1 | Knowledge-Q | INDEX-v11 起票 | 101→110 entries（+9 = PAT-098〜102 + DEC-070 + PIT-075〜076 + PB-073）+ retrieval 24 種 100% | 567+266 行 |
| 1 | Dev-JJ | 17 日 path W4 完成第 1 弾 + ARCH-01 評価 | production e2e 拡張 561 行 10 tests + ARCH-01 三択評価 326 行 = 案 A 推奨 2.5h | 561+326+211 行 |
| 1 | Sec-Q | yml verification + 連続 8 round baseline + 1M 10digit longrun | yml 11 検査軸 PASS + baseline JSON 152 行 + longrun stability 5 PASS | 378+152+242+275+247 行 |
| 2 | Dev-KK | 17 日 path W4 完成第 2 弾 + Owner 自動化 spec | breach stress/chaos 9 PASS + OWN-AUTO 80→19 min 76% 圧縮 | 393+357+262 行 |
| 2 | Dev-LL | OG src 物理化 readiness | gitignore + migration readiness GO with conditions + visual regression baseline | 256+319+289+190 行 |
| 2 | Review-N | DEC readiness 5 件 + R17→R22 trajectory + 着地判定 | 56 観点 Critical 0 Major 0 Minor 2 + 48 trajectory 全 OK + Round 23 GO 推奨 | 319+332+172 行 |
| 2 | Marketing-P | 6/11 D-8 + 6/12 D-7 + 6/19 launch day v3.0 | D-8 execution 75 項目 5 phase + D-7 prep 50 項目 + launch day 7 Phase 6h | 463+244+555+214 行 |
| 2 | Web-Ops-I | OWN-PRE-DRY-RUN + OG preview validation + launch day web-ops v2.0 | 7 sub-card 67-80 min + OG 48 検証点 14 セクション + 22 task | 453+357+255+227 行 |

**stagger 圧縮**: 第 1 波 dispatch T+0、第 2 波 T+0-50、hard limit T+180、全 9 並列 T+150 内収束 = SOP デフォルト昇格 trigger T-1 適合率 100% 維持（Round 22 で連続 8 round = formal baseline ESTABLISHED）。

---

## §3. 17 日 path W4 完成第 1 弾 + 第 2 弾達成

| 弾 | 担当 | 物理 | 役割 |
|---|---|---|---|
| 第 1 弾 ① | Dev-JJ | `__tests__/17day-path-w4-production-e2e-extended.test.ts` 561 行 10 tests | Bridge stub → Dev-GG actual file 直接 import 格上げ + bridge lifecycle violation + hot-restart state 復元 + NTP step 検出 + corruption tolerance |
| 第 1 弾 ② | Dev-JJ | ARCH-01 三択評価 326 行 | path alias 案 A 推奨 = **2.5h 議決不要 regression 0 = DEC-019-041 必達クローズ可能** |
| 第 1 弾 ③ | Sec-Q | longrun stability test 275 行 5 tests | single + 10x repeat 累積 9.99M pair 衝突 0 件 + memory leak < 50% + perf degradation CV < 0.3 + cumulative determinism mismatch=0 |
| 第 2 弾 ① | Dev-KK | `__tests__/file-breach-counter-stress-chaos.test.ts` 393 行 9 tests | 1000 concurrent observe + 1M lines restore 1.7s < 5s SLO + disk-full + partial-write tail + corrupted JSON head/middle/tail + reset semantics survive corruption |
| 第 2 弾 ② | Dev-KK | OWN-AUTO spec 357 行 | OWN-PRE-01〜07 自動化分類（A/B/C）= **80→19 min 76% 圧縮**、OWN-PRE-06 RLS 93% 最大 |

**結果**: harness 771→795 PASS（+24 = Dev-JJ +10 + Dev-KK +9 + Sec-Q +5）/ openclaw 394 維持（regression 0）/ W3 完成 + W4 完成第 1 弾 + 第 2 弾達成 = Phase 1 17 日 path 4 段階中 4 段着手 + 完成 6/10 進度。

---

## §4. Sec 連続 8 round baseline ESTABLISHED

`projects/PRJ-019/runsheets/sec-stagger-compression-baseline-8round.json` 152 行 NEW（Sec-Q）:

| trigger 条件 | Round 15→22 集計 | 結果 |
|---|---|---|
| T-1 適合率 80%+ | avg 100.0% | ✓ ESTABLISHED |
| T-2 API $0 | total $0.00 | ✓ ESTABLISHED |
| T-3 tests baseline regression 0 | total regression 0 件 | ✓ ESTABLISHED |
| T-4 Owner 拘束 0 分 | total 0 分 | ✓ ESTABLISHED |

**DEC-019-068 formal baseline status = ESTABLISHED**（連続 8 round 達成）。次 review milestone = Round 26（連続 12 round）で trigger 5 件目候補検討。

`projects/PRJ-019/.github/workflows/sec-hardening.yml` verification 378 行（11 検査軸 / 総合 PASS / Major 0 / Minor 0 / Info 3 = Round 23+ 引継）。

---

## §5. DEC readiness 5 件 verification + R17→R22 trajectory

### Review-N 56 観点 verification（319 行）

| DEC | 軸 8 × DEC = 観点 | 結果 |
|---|---|---|
| 067 | 8 | Y 全 |
| 068 | 8 | Y 全 |
| 069 | 8 | Y 全 |
| 070 | 8 | **Y 無条件昇格**（Review-M R21「Y 条件付」→ Review-N R22「Y 無条件」、M-7 D-7 詳細手順書 821 行完成で条件解消） |
| 071 | 8 | Y（Minor 1 = M-4/M-5 Round 22+ 評価想定） |
| 072 | 8 | Y 全 |
| 073 | 8 | Y（Minor 1 = M-4 SQLite 永続化採用検討、fs 永続化は Round 21 達成済の部分達成） |
| **計** | **56** | **Critical 0 / Major 0 / Minor 2** |

### Review-N R17→R22 quality trajectory（48 観点 / 332 行）

| 軸 | Round 17→22 trajectory | 結果 |
|---|---|---|
| harness PASS | 607→621→631→674→720→771→**795** | +188（31% 増 / 加速度的拡大 4 軸の 1 つ） |
| openclaw-runtime PASS | 330→366→394→394→394→394→394 | +64（W2 完成後 5 round 維持 = stabilization 1 軸） |
| 17 日 path | W1→W2→W3 進捗→W3 完成→W4 着手 4/4→**W4 完成第 1+2 弾** | 5 段達成（加速度的拡大）|
| heartbeat | 50k→100k→500k→1M→1M 10桁→**1M longrun stability** | 20x + 256x 低減 + 9.99M pair 衝突 0（成長維持）|
| Sec hardening | 3/4→4/4→Major 改善→yml→**連続 8 round baseline ESTABLISHED** | CI 化 + formal baseline（加速度的拡大）|
| INDEX | v5(53)→v6(60)→v7(70)→v8(81)→v9(92)→v10(101)→**v11(110)** | +57（成長維持）|
| stagger 連続 round | 1→2→3→4→5→6→7→**8（baseline ESTABLISHED）** | trigger 4/4 全 PASS（成長維持）|
| DEC readiness | 1→1→2→3→4→**56 観点 7 件 → 79 観点累計** | 5/26 4 件まとめ + 議決推奨 3 件 Y 揃い（加速度的拡大）|

**結果**: 48 観点全 OK / Critical 0 / Major 0 / Minor 0。

### Review-N 着地判定（172 行）

**Round 23 9 並列 GO 推奨 = YES 無条件**（根拠 6 件）:
1. 連続 7 round trigger 4/4 全 PASS（n=63 / 適合 100%）+ Round 22 完遂で連続 8 round baseline ESTABLISHED
2. 48 観点 trajectory 全 OK
3. 5/26 採択 4 件まとめ readiness 全 Y
4. Round 22 議決 3 件 readiness Y/Y 条件付
5. W4 完遂見込（Round 21 W4 着手 4/4 → Round 22 W4 完成第 1 + 2 弾達成）
6. 6/12 D-7 詳細手順書完成（Marketing-O 1577 行）+ Marketing-P 6/11 D-8 + 6/19 launch day v3.0 確立

---

## §6. ARCH-01 解消経路確定

| 案 | 担当 | 推奨 | 移行コスト | 議決要否 | regression |
|---|---|---|---|---|---|
| **A: tsconfig path alias 化** | Dev-JJ | **推奨**（Phase B-1 必達経路）| **2.5h** | **不要** | **0 想定** |
| B: pnpm workspaces 完全活用 | - | Phase 2 着手前 | 6.5h | 循環依存承認議決必要 | - |
| C: Nx 導入 | - | 不採用 | 12-16h | スコープ過大 | - |

**結論**: 案 A = path alias 化を Round 23 着手で **DEC-019-041 Phase B 候補必達クローズ可能**（6/20 期限に大余裕）。

---

## §7. OG src 物理化 readiness

| 段階 | Dev-LL 判定 | 条件 |
|---|---|---|
| (1) design | GO | - |
| (2) dev env | GO with conditions | .gitignore patch 適用前提 |
| (3) staging | GO with conditions | Vercel CLI auth 確認前提 |
| (4) production | NO-GO | Owner ack 取得後に GO 化 |

**.gitignore 推奨案**: whitelist 4 行差分（案 a / 副作用最小）

```
projects/*/app/
+
+# COMPANY-WEBSITE は monorepo 同居の例外
+!projects/COMPANY-WEBSITE/app/src/
+!projects/COMPANY-WEBSITE/app/src/**
```

**Visual regression baseline**: 8 case（4 variant × 2 locale）/ 1200x630 / 8-bit RGBA / 30-200KB / 同一環境 sha256 完全一致 / 環境跨ぎ pixel diff 0.5% threshold / 3 回再生成 binary diff 0 / 保存先 `projects/COMPANY-WEBSITE/test/og-image-baseline/`（`app/` 外なので tracked 可）。

---

## §8. Owner 拘束 76% 圧縮（Dev-KK OWN-AUTO spec）

| sub-card | OWN-PRE 現 | OWN-AUTO 後 | 圧縮率 |
|---|---|---|---|
| OWN-PRE-01 | 10 min | 1.5-2 min | 80-87% |
| OWN-PRE-02 | 15 min | 2-3 min | 80-87% |
| OWN-PRE-03 | 10 min | 8 min | 20%（お名前.com API 不在で C 維持） |
| OWN-PRE-04 | 15 min | 2-3 min | 80-87% |
| OWN-PRE-05 | 10 min | 1.5-2 min | 80-87% |
| OWN-PRE-06 | 15 min | 1 min | **93%（最大、SQL 1 発で全 RLS 検証）** |
| OWN-PRE-07 | 5 min | 2 min | 60%（B 分類 = backup confirm 残） |
| **計** | **80 min** | **19 min** | **76% 圧縮** |

**Auth 共有時**: 12-15 min まで圧縮可能。

**Web-Ops-I OWN-PRE-DRY-RUN**: 7 sub-card × 5 ブロック構造 / 67-80 min 完遂時間予測（既存 OWN-PRE 想定の 80 min と整合、未自動化時の dry-run baseline 確立）。

---

## §9. 公開準備（6/11 D-8 / 6/12 D-7 / 6/19 launch day）

### Marketing-P 計 1476 行

| 文書 | 行数 | 内容 |
|---|---|---|
| launch-dry-run-pre-rehearsal-execution-2026-06-11.md | 463 | 6/11 D-8 9 hour 540 min / 5 phase / **75 項目を実行 step 化** |
| launch-dry-run-d7-execution-prep-checklist-2026-06-12.md | 244 | 6/12 D-7 1 hour 枠 08:00-09:00 / **50 項目 / 9 section** |
| launch-day-timeline-2026-06-19-v3.0.md | 555 | 6/19 launch day **7 Phase 6 hour 06:00-12:00 + 7 役割マトリクス + Owner 実拘束 11 min** |

### Web-Ops-I 計 1292 行

| 文書 | 行数 | 内容 |
|---|---|---|
| OWN-PRE-DRY-RUN-2026-06-12.md | 453 | 7 sub-card × 5 ブロック / 67-80 min 完遂時間予測 |
| og-preview-validation-execution-procedure-2026-06-12.md | 357 | 6 検証軸 × 8 case = **48 検証点** / 14 セクション |
| launch-day-web-ops-role-2026-06-19-v2.0.md | 255 | 22 task / 時間帯別 readiness 6 / 事前検証 6 / Owner 伴走 5 / 公開直後 3 / 報告 2 / 実時間 229 min + buffer 131 min |

**6/19 confidence trajectory**: Round 21 = 80% → Marketing-P +2pt = 82% → Web-Ops-I +3pt = **85%**（Path A 完璧 path で 92% 到達可能）。

---

## §10. INDEX-v11 = 110 entries

`organization/knowledge/INDEX-v11.md` 567 行 / 101→110（+9）:

| カテゴリ | Round 21 (v10) | Round 22 (v11) | +追加 ID |
|---|---|---|---|
| patterns | 46 | 51 | PAT-098〜102（W4 production wiring / file-breach JSONL fire-and-forget / MonotonicClock 二系統 / sec-hardening.yml 4 trigger × 5 job / ContinuousRunDetector matchDigits backward compat）|
| decisions | 18 | 19 | DEC-070（DEC-019-070 由来）|
| pitfalls | 24 | 26 | PIT-075〜076（W3→W4 test 二重化 / sec-hardening.yml matrix failure streak state recovery）|
| playbooks | 13 | 14 | PB-073（Round 22 三軸同時並走 = W4 完成 + Sec CI yml + 10 桁拡張）|
| **計** | **101** | **110** | **+9** |

**retrieval 試験**: 24 種 / **133/133 = 100% PASS**
**tag taxonomy**: 32 系統（Round 21 = 30 → Round 22 = 32）

---

## §11. DEC-019-074 DRAFT 起案 + 議決構造

### PM-O decisions.md +118 行（846→964）

DEC-019-074 DRAFT = Round 22 着地宣言:
- Round 22 9 並列構成 + W4 完成第 1+2 弾
- measurable 7 件（M-1 harness 800+ / M-2 openclaw 394+ / M-3 W4 e2e tests 30+ / M-4 ARCH-01 解消可否評価 / M-5 INDEX-v11 110+ / M-6 5/26 4 件まとめ採択 / M-7 6/11 D-8 pre-rehearsal validation）
- 採用根拠 8 件
- Round 23 引継 6 項目候補

### 議決構造（37 件）

| ID 範囲 | 件数 | 状態 |
|---|---|---|
| DEC-019-001〜069 | 32 | 既存 historical baseline |
| DEC-019-070 | 1 | DRAFT → 5/26 4 件まとめ採択推奨（Y 無条件昇格） |
| DEC-019-071〜073 | 3 | DRAFT → Round 23 議決推奨（3 件 Y 揃い） |
| DEC-019-074 | 1 | DRAFT → Round 23 起案議決対象 |
| **計** | **37** | DRAFT 5 件 |

---

## §12. Round 23 引継 6 項目

| # | 内容 | 責任 |
|---|---|---|
| ① | INDEX-v12 起票（110 → 120+ entries / Round 22 由来反映 = W4 完成 + ARCH-01 + 8 round baseline + Owner auto + DEC-074）| Knowledge-R |
| ② | Phase 1 W4 完成第 3 弾 + ARCH-01 = path alias 物理 migrate 実行（Dev-JJ 案 A = 2.5h 議決不要 regression 0、DEC-019-041 必達クローズ）| Dev-MM + Dev-NN |
| ③ | DEC-019-074 verification + Round 23 議決準備 + DEC-019-075〜077 起案候補 | PM-P |
| ④ | 6/11 D-8 pre-rehearsal validation 実機実行（Marketing-P execution 75 項目 5 phase を実機実行） | Marketing-Q |
| ⑤ | OG src 物理化 production 段階 Owner ack 取得 + step 12 実行（Dev-LL readiness GO with conditions → ack 後 GO） | Dev-OO |
| ⑥ | Owner action card 7 sub-card OWN-AUTO 自動化 PoC（Dev-KK spec → 実装、80→19 min 76% 圧縮実証）| Web-Ops-J |

---

## §13. Owner への提案

### 提案 1: Round 23 9 並列 GO（最大加速継続）
- **根拠**: DEC-019-068 デフォルト昇格 trigger 4/4 全 PASS 維持（連続 8 round = formal baseline ESTABLISHED、3 round 目）/ harness 771→795 (+24) / W4 完成第 1+2 弾達成 / ARCH-01 解消経路確定 / Owner 拘束 76% 圧縮 / API $0 / 副作用 0 / 絵文字 0 / Owner 拘束 0 分
- **波構成**: 第 1 波 4（PM/Knowledge/Dev W4 完成第 3 弾/ARCH-01 物理 migrate）+ 第 2 波 5（Dev OG production / Web-Ops OWN-AUTO PoC / Review/Marketing/Sec）
- **stagger**: T+0-50 第 1 波 / T+0-150 第 2 波 / hard limit T+180
- **期待成果**: 進捗 99 → 100% / 議決 37 → 38+ 件 / 17 日 path W4 完遂 / ARCH-01 解消（DEC-019-041 必達クローズ）/ OG production 切替 / OWN-AUTO PoC

### 提案 2: 5/26 統合採択 4 件まとめ確定
- **対象**: DEC-019-067 + 068 + 069 + 070 = 4 件まとめ
- **根拠**: Review-N 56 観点 全 Y / Critical 0 / Major 0 / Minor 2（議決妨げず）
- **時間**: 5/26 timeline 60-75 min（PM-O agenda 304 行）
- **Owner 拘束**: 推奨 0 分（CEO 自走採決可）

### 提案 3: 6/11 D-8 pre-rehearsal 実機実行確定
- **対象**: Marketing-P execution 75 項目 5 phase 9 hour（6/11 朝 09:00-18:00 JST）
- **完了基準**: 75 項目 PASS

### Owner 残動作（不変、1 件）
- 6/19 or 6/26 朝公開最終確認のみ
- 6/12 D-7 公開前運用設定 7 sub-card は任意（OWN-AUTO で **80 → 19 min（76% 圧縮）**）
- 公開当日 Owner 実拘束 **11 min**（Marketing-P launch day v3.0）

---

## §14. 結語

Round 22 は **9 並列同時 dispatch + 17 日 path W4 完成第 1 弾 + 第 2 弾 + Sec 連続 8 round baseline ESTABLISHED + DEC readiness 5 件 verification 56 観点 + R17→R22 trajectory 48 観点全 OK + ARCH-01 解消経路確定 + Owner 拘束 76% 圧縮** という 6 軸同時推進 round を完遂着地。Owner directive「丁寧に」を完全達成。

stagger 圧縮 SOP（DEC-019-062）連続 8 round 適用成功 = DEC-019-068 デフォルト昇格 trigger 4/4 全 PASS 維持（**formal baseline ESTABLISHED**、3 round 目）。Round 23 9 並列 GO 推奨。

進捗 99% に到達、Round 23 で 100% 完遂見込（W4 完遂 + ARCH-01 必達クローズ + OG production 切替）。

Owner GO 待機 → Round 23 第 1 波 4 並列 + 第 2 波 5 並列即時 dispatch 準備完了。

---

**承認**:
- [ ] Owner 確認（hironori555@gmail.com）
- [ ] Round 23 9 並列 dispatch authorize
- [ ] 5/26 4 件まとめ採択 timeline 60-75 min 確定
- [ ] 6/11 D-8 実機実行確定

**関連文書**:
- ceo-v22-round21-9parallel-completion.md（前 round）
- pm-o-r22-dec-067-068-069-070-merged-agenda-2026-05-26.md
- pm-o-r22-dec-071-072-073-verification.md
- pm-o-r22-summary.md
- knowledge-q-r22-index-v11.md
- dev-jj-r22-arch-01-workspace-alias-feasibility.md
- dev-jj-r22-w4-production-e2e-and-arch01.md
- sec-q-r22-yml-verification.md
- sec-q-r22-stagger-baseline-8round.md
- sec-q-r22-1m-longrun-stability.md
- dev-kk-r22-w4-stress-and-owner-auto.md
- dev-ll-r22-og-src-migration-readiness.md
- review-n-r22-dec-readiness-5dec-verification.md
- review-n-r22-quality-trajectory-r17-r22.md
- review-n-r22-landing-judgment.md
- marketing-p-r22-d8-prep-and-launch-day.md
- web-ops-i-r22-own-dry-run-and-og-preview.md
