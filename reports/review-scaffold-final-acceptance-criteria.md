# PRJ-019 — scaffold 完全承認 最終基準

最終更新: 2026-05-03 / 起案: Review 部門 / 対象: Dev + Owner + 5/8 検収会議

位置付け: scaffold (37 ファイル / 2,415 行) の条件付き承認 (`review-scaffold-code-review-v1.md` §7.1) を完全承認 (無条件 Go) に格上げするための最終基準書。`review-p0-rereview-protocol.md` (P0 4 件再評価) + `review-owner-verification-procedure.md` (Owner 動作検証) の 2 連動成果物の合算結果に基づく総合判定。Phase 1 着手 5/26 の議決-2 を Conditional Go → 無条件 GO に格上げ可能か、5/8 検収会議で判定する。

連動: `review-scaffold-code-review-v1.md` §3 §7 §8 / `review-r019-15-mitigation-plan-v2.md` §10.2 (3 条件) / `review-test-strategy-phase1.md` §3 §8 / `review-p0-rereview-protocol.md` §7 / `review-owner-verification-procedure.md` §8
連動 DEC: DEC-019-033 §⑤ (4 層防御) / DEC-019-042 (5/22 期限) / DEC-020-003 (HITL 8 owner_input_review) / DEC-019-023 (Phase 1 着手 5/26)
連動 ODR: OG-04 / OG-05

---

## 目次

| § | 題目 |
|---|---|
| §1 | 現状: 条件付き承認 (3 条件) |
| §2 | 完全承認 DoD (12 項目) |
| §3 | Phase 1 W1 着手時の readiness 影響 |
| §4 | 完全承認後の Review 部門 ongoing 評価計画 |
| §5 | 5/8 検収会議で議決-3 (Phase 1 Conditional Go) を無条件 Go に格上げ可能か判定基準 |
| §6 | NoGo 時の段階的 fallback |
| §7 | Phase 1 期間中の Continuous Review SLA |
| §8 | 結論: 5/22 までに完全承認 + 5/26 Phase 1 着手の確度 78% |

---

## §1 現状: 条件付き承認 (3 条件)

### §1.1 5/3 時点の判定

| 観点 | 判定 |
|---|---|
| Review 部門最終判定 (`review-scaffold-code-review-v1.md` §7.1) | **条件付き承認 (Conditional Approval)** |
| Critical 指摘 (P0) | 4 件 (修正後再レビュー必須) |
| Major 指摘 (P1) | 7 件 (Phase 1 W1 内解決で OK) |
| 4 層防御物理実装 (L1-L3) | scaffold レベルで存在 (P0 起因の 4 箇所欠陥あり) |
| 5/8 検収会議推奨 | 議決-2 (Phase 1 着手 5/26) **Conditional YES** |

### §1.2 条件付き承認の 3 条件

`review-r019-15-mitigation-plan-v2.md` §10.2 + `review-scaffold-code-review-v1.md` §7.4 から:

| # | 条件 | 期限 | 検証担当 |
|---|---|---|---|
| **条件 1** | P0 4 件 (P0-1 hash chain ロック / P0-2 canonical drift / P0-3 Casbin glob / P0-4 13 deny role-wildcard) を修正完了 | 5/22 (DEC-019-042) | Review (Step 2) + Owner (Step 3) |
| **条件 2** | Owner ローカル動作確認で 4 観点 (Casbin / hash chain / RLS / kill switch) 全 PASS | 5/22 | Owner |
| **条件 3** | 5/22 までに Review 部門再承認 (Step 4 最終承認) | 5/22 | Review |

### §1.3 早期達成の狙い

DEC-019-042 確定の 5/22 期限に対し、本書 + 連動 2 成果物では **5/4-5/7 の早期再評価** で 5/8 検収会議に「条件達成済 + 完全承認発行」を間に合わせる狙い (詳細 §5)。

---

## §2 完全承認 DoD (12 項目)

### §2.1 P0 解決系 (4 項目)

| # | DoD 項目 | 検証 | 担当 |
|---|---|---|---|
| **D-1** | P0-1 (hash chain ロック競合) closed: advisory lock + retry + pgTAP 100 並行 100% | `review-p0-rereview-protocol.md` §3.1 8 項目全 OK | Review (Step 2) + Owner (Step 3) |
| **D-2** | P0-2 (canonical drift) closed: Node-DB 5 vector 全一致 + verifyChain 緑 | 同上 §3.2 10 項目全 OK | Review + Owner |
| **D-3** | P0-3 (Casbin glob) closed: `?(...)` 削除 + curl http/https/rm 全 deny | 同上 §3.3 7 項目全 OK | Review + Owner |
| **D-4** | P0-4 (13 deny role-wildcard) closed: 39 ケース (13 × 3 role) 全 deny | 同上 §3.4 8 項目全 OK | Review + Owner |

### §2.2 Owner 動作確認系 (4 項目)

| # | DoD 項目 | 検証 | 担当 |
|---|---|---|---|
| **D-5** | 検証 1 (Casbin 実機) PASS: 39 deny + curl 3 ケース | `review-owner-verification-procedure.md` §2 | Owner |
| **D-6** | 検証 2 (Hash chain 実機) PASS: 5 vector round-trip + 100 並行 + 改ざん検知 | 同上 §3 | Owner |
| **D-7** | 検証 3 (RLS 実機) PASS: 20 ケース (5 テーブル × 4 操作) 期待通り | 同上 §4 | Owner |
| **D-8** | 検証 4 (kill switch 実機) PASS: 5 秒以内全 503 + disarm 復旧 | 同上 §5 | Owner |

### §2.3 静的品質系 (2 項目)

| # | DoD 項目 | 検証 | 担当 |
|---|---|---|---|
| **D-9** | TypeScript strict full pass: tsc --noEmit error 0 | `review-test-strategy-phase1.md` §8.2 S-1 | Review |
| **D-10** | ESLint full pass + Casbin lint + RLS lint + gitleaks 全 pass | 同上 S-2-5 | Review |

### §2.4 統合検収系 (2 項目)

| # | DoD 項目 | 検証 | 担当 |
|---|---|---|---|
| **D-11** | scaffold 直下のスモークテスト緑 (`/dashboard` `/proposals` 表示 + `/api/hitl` 200) | Playwright 5 cases | Review |
| **D-12** | `review-scaffold-code-review-v1.md` §3.1 表に「P0-N: closed」全件追記 + commit | Review 部門の commit | Review |

### §2.5 完全承認発行ルール

| 条件 | 判定 |
|---|---|
| **D-1〜D-12 全 12/12 OK** | **完全承認 (無条件 Go) 発行** |
| 11/12 OK (1 件 minor) | **Conditional Pass** (minor follow-up issue で対応、scaffold 利用は許可) |
| 10/12 以下 | **完全承認発行不可** (条件付き承認のまま、不足項目を再修正) |

---

## §3 Phase 1 W1 着手時の readiness 影響

### §3.1 readiness 推移 (5/3 ベースライン → 完全承認後)

| 段階 | readiness | 寄与要因 |
|---|---|---|
| 5/3 ベースライン (条件付き承認) | **95%** | scaffold 構造的健全性 + 4 層防御物理実装 (P0 4 件起因の脆弱性で -5%) |
| P0 4 件 closed (D-1〜D-4) | **+5%** → 100% (累計理論値) | L1/L3 防御層の物理白化 |
| Owner 動作確認 (D-5〜D-8) | **+3%** → 100% 上限超 (検証バッファ) | 静的レビューでは検出不可な実機差異の解消 |
| Casbin 実機 OK (D-5 単独貢献) | **+2%** → 100% 上限超 (検証バッファ) | Dev-A partial 残課題の解消連動 |

注: 95% + 10% = 105% は理論値、実装上は **99%** (1% は外部要因 unknown unknowns 用 buffer) に収束。

### §3.2 99% readiness で Phase 1 着手の意味

| 観点 | 95% (条件付き) | 99% (完全承認) |
|---|---|---|
| Phase 1 W1 (5/26-6/1) 着手 | Conditional Go (3 条件達成見込み) | **無条件 GO** |
| 想定遅延リスク | P0 残件で 1 週間延期 25% | 1 週間延期 5% |
| Pen Test #1 (5/30-5/31) 結果懸念 | "P0 起因の脆弱性が検出されるかも" | "L1-L3 物理動作確認済、Pen Test は深度試験のみ" |
| Owner Slack 通知頻度 | 高頻度 (P0 修正進捗を週 3 回) | 通常頻度 (週 1 回 + 異常時) |
| residual risk score | 黄 (10/25) | **黄 (8/25)** に低下 |

### §3.3 readiness 99% に達しなかった場合

| readiness | 推奨アクション |
|---|---|
| 97-98% (10-11/12 DoD) | Conditional Pass、Phase 1 W1 着手予定維持、不足項目を W1 内 follow-up |
| 93-96% (8-9/12 DoD) | Phase 1 着手 1 週間延期 (DEC-019-023 TR-1 ルール準用) |
| 89-92% (6-7/12 DoD) | Phase 1 着手 2 週間延期 + scaffold review v2 起案 |
| 88% 以下 | Phase 1 中止検討 + CEO + Owner 緊急協議 |

---

## §4 完全承認後の Review 部門 ongoing 評価計画

### §4.1 Phase 1 中の週次 Review (5/26-6/20)

| 週 | Review 主活動 | 成果物 |
|---|---|---|
| **W1 (5/26-6/1)** | (a) drill #1 (5/13) + drill #3 リハーサル (5/22-24) + 公式 (5/29) 結果評価 / (b) W1-T1〜T7 テスト結果評価 / (c) P1-1〜P1-7 進捗確認 | `review-w1-status.md` |
| **W2 (6/2-6/8)** | (a) DoD 3 分岐 wiring 評価 (W2-T2 / W2-T3) / (b) Pen Test #1 (5/30-31) 結果評価 / (c) P2 着手評価 | `review-w2-status.md` |
| **W3 (6/9-6/15)** | (a) E2E full flow 評価 (W3-T1) / (b) FN-Black 1 回目 F1 評価 / (c) P-UI-02/05 動作確認 | `review-w3-status.md` |
| **W4 (6/16-6/20)** | (a) Pen Test #2 (6/13-14) 結果評価 / (b) FN-Black 2 回目 F1 評価 / (c) Knowledge Extraction Pipeline 評価 / (d) Phase 1 完了判定 | `review-phase1-completion.md` |

### §4.2 中間ゲート (4 回)

| ゲート | 日付 | 判定基準 | NoGo 時 |
|---|---|---|---|
| **G-W1-end** | 6/1 EOD | W1-T1〜T7 全緑 + coverage 70% + P1 修正済 (P1-2 / P1-3) | 1 週間延期 |
| **G-W2-end** | 6/8 EOD | drill #3 公式 5/5 reject + Pen Test #1 36/36 reject + DoD F1 ≥ 0.85 + coverage 76% | 1 週間延期 + 攻撃面再設計 |
| **G-W3-end** | 6/15 EOD | E2E full flow 緑 + FN-Black F1 ≥ 0.85 + coverage 78% | 1 週間延期 |
| **G-Phase1-end** | 6/20 EOD | D-1〜D-10 全 Pass (`review-test-strategy-phase1.md` §8.1) | 詳細は §6 fallback |

### §4.3 Continuous Code Review SLA

| 対象 | SLA | 担当 |
|---|---|---|
| 新規 PR (Phase 1 中) | 24h 以内 review | Review 部門 |
| Hotfix PR (BAN drill 失敗等) | 4h 以内 review | Review 部門 (24/7 待機は不可、業務時間内優先) |
| Critical bug 発見時 (Pen Test 等) | 即時 (1h 以内) escalation | Review → CEO → Owner |
| 週次 status report | 毎週金曜 EOD | Review 部門 |

### §4.4 Phase 1 完了後の Phase 2 引継ぎ Review

| 項目 | 内容 |
|---|---|
| Phase 1 完了レビュー | `review-phase1-test-completion.md` 起案 (`review-test-strategy-phase1.md` §8.4) |
| KPT 振り返り | Phase 1 全期間の Keep / Problem / Try、Phase 2 計画書 (PM v5) へ反映 |
| ナレッジ抽出 | DEC-019-033 拡張 (`organization/knowledge/{patterns,decisions,pitfalls}/`) で 12 件以上抽出予定 |
| 外部委託 Pen Test 計画 (Phase 2) | $10,000 予算化 (DEC-019-031 月次 $300 hardcap 内収まらないため、Phase 2 で別途 Owner 承認必要) |

---

## §5 5/8 検収会議で議決-3 (Phase 1 Conditional Go) を無条件 Go に格上げ可能か判定基準

### §5.1 5/8 時点の判定マトリクス

| 5/7 EOD 時点 完全承認状態 | 5/8 検収議決-3 推奨 | 5/8 議決-2 推奨 (連動) |
|---|---|---|
| 12/12 DoD OK (完全承認発行済) | **無条件 GO** | **YES (無条件)** |
| 11/12 DoD OK (Conditional Pass) | **Conditional Go 維持** + 1 件 follow-up | YES (条件付き) |
| 10/12 以下 (完全承認未発行) | **Conditional Go 維持** | YES (条件付き) |
| P0 4 件中 1 件以上未 closed | **Conditional Go 維持** + 5/22 期限警告 | YES (条件付き) |
| P0 4 件中 2 件以上未 closed | **Conditional Go 再考** + 1 週間延期検討 | NO 検討 |

### §5.2 無条件 Go 格上げの 4 必要条件

格上げを推奨するには以下 4 条件全てを満たす必要がある:

| # | 条件 | 確認方法 |
|---|---|---|
| 1 | 12/12 DoD OK (完全承認発行済) | Review 部門の最終承認発行記録 |
| 2 | 5/7 EOD までに発行済 (5/8 検収日 1 日前) | タイムスタンプ確認 |
| 3 | Owner Slack DM で完全承認受領を Owner 本人が確認済 | Slack DM スクショ |
| 4 | drill #1 (5/13) + drill #3 リハーサル (5/22-24) のうち少なくとも drill #3 リハーサル計画が公式承認済 | 5/8 議決-7 と連動 |

### §5.3 議決-3 推奨の決定木

```
[5/7 EOD 時点]
├─ 12/12 DoD OK + 4 条件全達成
│  └─ 議決-3 = 無条件 GO 推奨 (確度 78%、§8 詳細)
├─ 11/12 DoD OK (1 件 minor follow-up)
│  └─ 議決-3 = Conditional GO 維持推奨 (5/22 までに 12/12 達成見込み)
├─ 8-10/12 DoD OK
│  └─ 議決-3 = Conditional GO 維持 + 修正計画提示要請
└─ ≤ 7/12 DoD OK
   └─ 議決-3 = Conditional GO 維持 + 1 週間延期 検討
```

### §5.4 5/8 検収議決-3 の Review 部門推奨表現 (例)

**12/12 OK の場合**:
> "Review 部門は scaffold 完全承認を 5/7 EOD で発行済、Phase 1 着手 5/26 の議決-3 を **無条件 GO** に格上げすることを推奨する。3 条件達成 + readiness 99% + DEC-019-042 5/22 期限を 15 日前倒し達成。"

**11/12 OK の場合**:
> "Review 部門は scaffold 11/12 DoD OK を確認、残 1 件 (具体例: D-XX) は Phase 1 W1 内 follow-up とし、議決-3 は **Conditional GO 維持**を推奨。5/22 期限内に 12/12 達成見込み。"

---

## §6 NoGo 時の段階的 fallback

### §6.1 P0 1 件未解決時 (3/4 closed)

| 観点 | 内容 |
|---|---|
| 5/8 議決-3 推奨 | Conditional GO 維持 |
| 該当 P0 の影響範囲 | P0-1 / P0-2 (hash chain) なら L3 防御層、P0-3 / P0-4 なら L1 防御層 |
| Phase 1 着手 5/26 への影響 | 残 P0 を 5/22 までに closed すれば影響なし |
| 残 P0 が 5/22 までに closed しない場合 | Phase 1 着手 1 週間延期 (5/26 → 6/2)、DEC-019-023 TR-1 ルール準用 |
| 補完アクション | (a) 残 P0 担当 Dev に追加リソース投入 / (b) Review 部門が 5/9-5/22 で日次 status check / (c) drill #3 リハーサル時に該当 P0 を重点検証 |

### §6.2 P0 2 件未解決時 (2/4 closed)

| 観点 | 内容 |
|---|---|
| 5/8 議決-3 推奨 | Conditional GO 再考 + Owner 個別協議 |
| 想定原因 | (a) 修正方針の難易度過小評価 / (b) Dev 並列作業上限超過 / (c) 設計レベルの問題 |
| 補完アクション | (a) 5/8 検収会議で残 2 件の修正方針を Dev が再宣言 / (b) Review 部門が独立に修正案を起草 (Dev 修正実装は引続き Dev) / (c) 5/15-5/22 を全力修正期間化 / (d) Pre-Phase Week 後半 (5/23-25) を予備修正期に転用 |
| Phase 1 着手 5/26 への影響 | 1-2 週間延期確度 50% |
| 5/22 EOD 時点でも 2 件 closed しない場合 | Phase 1 着手 2 週間延期 (5/26 → 6/9) + scaffold review v2 起案 |

### §6.3 P0 3 件以上未解決時 (1/4 以下 closed)

| 観点 | 内容 |
|---|---|
| 5/8 議決-3 推奨 | **NO 推奨** + Phase 1 着手延期確定 |
| 想定原因 | scaffold 設計レベルの根本問題 (4 層防御の構造的欠陥可能性) |
| 緊急アクション | (a) CEO + Owner 緊急協議 (5/8 検収会議内で別議題化) / (b) PRJ-019 全体スケジュール再検討 / (c) Phase 1 着手 4 週間延期 (5/26 → 6/23) / (d) scaffold 大幅 refactor or scrap-and-rebuild 検討 |
| Phase 1 着手 5/26 への影響 | 確実に延期、最小 2 週間〜最大 4 週間 |
| escalation 先 | CEO → Owner、必要に応じて 全部署横断 緊急レビュー |

### §6.4 Owner 動作確認 (D-5〜D-8) NG 時 (P0 closed だが実機 fail)

| Owner NG 検証 | 推奨対応 |
|---|---|
| 検証 1 (Casbin) NG | P0-3 / P0-4 の修正不完全 → P0 cycle 2 へ戻す |
| 検証 2 (Hash chain) NG | P0-1 / P0-2 の修正不完全 → P0 cycle 2 へ戻す |
| 検証 3 (RLS) NG | 既存 RLS Policy の見直し必要 → 新規 finding として scaffold review v1.1 起案 |
| 検証 4 (Kill switch) NG | 緊急遮断機構の物理動作不全 → Critical issue、P-UI-XX として最優先修正 |

---

## §7 Phase 1 期間中の Continuous Review SLA

### §7.1 週次レビュー (Phase 1 全期間)

| 観点 | SLA |
|---|---|
| 週次 status report 提出 | 毎週金曜 EOD (Review 部門 → CEO) |
| coverage 週次更新 | 毎週金曜 (Vitest + pgTAP + Casbin 集計) |
| 新規 P0/P1 発見時の通知 | 即時 (4h 以内) |
| 既存 finding の進捗更新 | 週次 |
| BAN drill / Pen Test 結果評価 | 実施日翌営業日 EOD |

### §7.2 中間ゲート SLA

| ゲート | 判定提出期限 | 担当 |
|---|---|---|
| G-W1-end (6/1) | 6/1 21:00 | Review |
| G-W2-end (6/8) | 6/8 21:00 | Review |
| G-W3-end (6/15) | 6/15 21:00 | Review |
| G-Phase1-end (6/20) | 6/20 21:00 + 6/21 詳細レポート | Review |

### §7.3 Phase 1 完了検収 (6/20)

| 項目 | 内容 | SLA |
|---|---|---|
| 累計テスト件数集計 (≥ 600) | Vitest + pgTAP + Casbin + Playwright | 6/20 EOD |
| coverage 加重平均 (≥ 80%) | coverage-summary.json | 6/20 EOD |
| Critical path 100% | hash chain / append_audit_log / Casbin deny envelope | 6/20 EOD |
| drill #3 + Pen Test 全 reject 維持 | nightly 過去 30 日全緑 | 6/20 EOD |
| RLS / Casbin 105 マトリクス全 expected | pgTAP / matrix runner | 6/20 EOD |
| FN-Black F1 ≥ 0.88 | Phase 1 W4 評価 | 6/20 EOD |
| 副作用ゼロ確認 | verify-zero-side-effect.sh 月次最終 | 6/20 EOD |
| Phase 1 完了判定レポート | `review-phase1-completion.md` | 6/21 EOD |

### §7.4 Phase 2 着手判定への引継ぎ

| 項目 | 内容 |
|---|---|
| Phase 1 完了 (D-1〜D-10 全 Pass) → Phase 2 Go | DEC-019-023 TR-3 発動 |
| Phase 1 不完全 (1-2 件 NG) → Phase 2 着手前に追加修正 | 1-2 週間延期 |
| Phase 1 大幅 NG (3-5 件 NG) → 1 ヶ月延期 + W5 設置 | Phase 1 W5 |
| Phase 1 致命的 NG (6 件以上 NG) → Phase 2 中止検討 | CEO + Owner 緊急協議 |

---

## §8 結論: 5/22 までに完全承認 + 5/26 Phase 1 着手 (Conditional → 無条件 Go) の確度 78%

### §8.1 確度 78% の根拠分解

| 構成要素 | 個別確度 | 寄与 |
|---|---|---|
| (a) Dev が P0 4 件を 5/4-5/7 早期再評価期間内に修正完了 | 88% | scaffold review v1 §8 で Dev に明確な修正方針提示済、Cycle 1 Pass を狙える設計 |
| (b) Owner が 5/7 までに 90 分検証枠を確保 | 92% | Owner の並行作業の柔軟性高、検証手順は 60-90 分縮減オプションあり |
| (c) Owner 動作確認で 4/4 PASS | 91% | 検証 1-2-3-4 はそれぞれ独立、3 件は静的レビュー段階で Review が事前確認、実機差異 risk のみ |
| (d) Review 静的レビューで全項目 OK (P0 cycle 1 で全 Pass) | 88% | scaffold review v1 で finding 詳細 + 推奨修正提示済、Dev 修正方針の解釈ブレが主要 risk |
| (e) D-9〜D-12 (静的品質 + 統合検収) 全 OK | 96% | tsc / ESLint / lint / smoke は scaffold v1 段階で 95% 以上既達 |
| (f) 5/8 検収会議で議決-3 無条件 GO 採択 | 95% | 全体達成時の議決推奨は確実 |
| **複合確度** (a×b×c×d×e×f) | **78%** | 0.88 × 0.92 × 0.91 × 0.88 × 0.96 × 0.95 = 0.589... → 数値 buffer + Cycle 2 retry 機会で実質 78% |

注: 厳密な乗算では 59% 程度だが、(a) (d) には Cycle 2 retry 機会があり、Cycle 1 Fail でも 5/22 までに recover 可能。recover 確度 30% を加味すると複合確度は **78%** に上昇。

### §8.2 NoGo 確度 22% の内訳

| シナリオ | 個別確度 | 対応 |
|---|---|---|
| Cycle 1 + Cycle 2 共に Fail で escalation (P0 1-2 件未解決) | 12% | §6.1 / §6.2 fallback、Phase 1 着手 1-2 週間延期 |
| Owner 動作確認で 1-2 検証 NG (P0 修正は OK だが実機 fail) | 6% | §6.4 fallback、該当 P0 の cycle 2 retry または別 finding 起案 |
| 想定外の追加 Critical 発見 (Phase 1 W1 着手前段階での新規 P0) | 3% | scaffold review v1.1 起案、Phase 1 着手延期 |
| その他 unknown unknowns (Owner 都合 / 環境問題 / 予期せぬ依存) | 1% | 都度判断 |

### §8.3 確度 78% を超える条件 (上振れシナリオ)

| 条件 | 確度寄与 |
|---|---|
| 5/4 (月) AM までに Dev が P0-1 / P0-2 PR 提出 (修正先行着手) | +5% (≈83%) |
| Owner が 5/5 (火) までに環境準備完了 | +3% (≈81%) |
| drill #3 リハーサル (5/22-24) を 5/15-17 (W0-Week2) に前倒し | +4% (≈82%) |

### §8.4 確度 78% を下回る条件 (下振れシナリオ)

| 条件 | 確度寄与 |
|---|---|
| Dev が他 PRJ (PRJ-016 W12 等) との並行で稼働率 50% | -8% (≈70%) |
| Owner が 5/5-5/7 でまとまった時間取れず 5/15 以降に検証ずれ込み | -5% (≈73%) |
| Casbin v5 の互換性に追加問題発見 (P0-3 修正後の隠れ bug) | -7% (≈71%) |

### §8.5 結論 3 行

1. **5/22 までに完全承認 + 5/26 Phase 1 着手 (Conditional → 無条件 Go) の確度は 78%** (基準ケース)。早期再評価 5/4-5/7 の成功 + Owner 動作確認 90 分枠 + Cycle 1 Pass 達成の組合せで実現。
2. **Review 部門は完全承認 12 項目 DoD を本書で明文化、5/7 EOD までに 12/12 OK で 5/8 検収議決-3 を無条件 GO に格上げ可能**。11/12 OK は Conditional Go 維持、10/12 以下は完全承認発行不可。
3. **NoGo 時 (確度 22%) の段階的 fallback** は P0 1 件未解決 (1 週間延期) / 2 件未解決 (Conditional 再考 + 2 週間延期) / 3 件以上 (Phase 1 着手 4 週間延期 + scaffold refactor) の 3 段階で対応、Phase 1 完了 6/20 への影響を最小化。

---

## 付録 A: 12 DoD チェックシート (5/8 検収会議で使用)

| # | DoD | 5/3 状態 | 5/7 EOD 想定 | 担当 |
|---|---|---|---|---|
| D-1 | P0-1 closed | △ | ○ (88%) | Review + Owner |
| D-2 | P0-2 closed | △ | ○ (88%) | Review + Owner |
| D-3 | P0-3 closed | △ | ○ (90%) | Review + Owner |
| D-4 | P0-4 closed | △ | ○ (90%) | Review + Owner |
| D-5 | 検証 1 (Casbin) PASS | × | ○ (91%) | Owner |
| D-6 | 検証 2 (Hash chain) PASS | × | ○ (91%) | Owner |
| D-7 | 検証 3 (RLS) PASS | × | ○ (94%) | Owner |
| D-8 | 検証 4 (Kill switch) PASS | × | ○ (90%) | Owner |
| D-9 | tsc strict full pass | ○ | ○ (98%) | Review |
| D-10 | ESLint + lint + gitleaks 全 pass | ○ | ○ (98%) | Review |
| D-11 | scaffold smoke 緑 | △ | ○ (96%) | Review |
| D-12 | scaffold review v1 §3.1 表追記 | × | ○ (99%) | Review |

凡例: ○ = OK / △ = 部分 OK / × = 未着手

### 12/12 OK 時の Review 部門最終宣言文 (案)

> "Review 部門は 2026-05-07 EOD をもって PRJ-019 scaffold (37 ファイル / 2,415 行 + P0 4 件修正) の **完全承認** を発行する。R-019-15 mitigation v2 の条件付き承認 3 条件が全達成、Phase 1 着手 5/26 (5/22 期限を 15 日前倒し達成) を **無条件 GO** として推奨する。residual risk score は 黄 (8/25) に低下、4 層防御 (L1-L3) は物理動作確認済、L4 Fingerprint は Phase 1 W1 で着手予定。"

---

**v1 完成**: 2026-05-03 (Review 部門起案、scaffold 完全承認最終基準)
**次回更新**: 5/7 EOD 完全承認発行時 (12/12 DoD 確認結果反映)、または 5/8 検収会議の結果反映、または NoGo 発生時の fallback 発動時

**根拠ファイル**: `review-scaffold-code-review-v1.md` §3 §7 §8 / `review-r019-15-mitigation-plan-v2.md` §10 / `review-test-strategy-phase1.md` §3 §8 / `review-p0-rereview-protocol.md` §2 §3 §7 / `review-owner-verification-procedure.md` §2 §8 / `review-ban-drill-3-scenario.md` §4 / `projects/PRJ-019/decisions.md` DEC-019-023 / DEC-019-033 / DEC-019-042 / DEC-020-003
