# Dev-NN Round 23 — DEC-019-041 Phase B クローズ判定 prep

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-NN（Round 23, W4 完成第 2 弾 task ②）
- 範囲: DEC-019-041（ARCH-01 = workspace alias 課題）の Phase B クローズ条件確立 + DEC-019-076 候補（PM-P 起案 = ARCH-01 解消宣言）との整合性確認
- 不可侵: 本書は Round 23 の **クローズ判定 prep のみ**（実 close 議決は Round 24 完遂着地後）。既存 DEC-019-001〜074 はすべて無改変
- 関連: Dev-JJ R22 評価書 / Dev-NN R23 Phase 2 spec（姉妹報告）/ DEC-019-074 ④（ARCH-01 解消可否評価）

## 0. サマリ

| 項目 | 値 |
|---|---|
| Phase B 候補としての DEC-019-041 性格 | workspace alias 不在 issue（cross-rootDir 違反 9 件 / うち本件対象 6 件） |
| Phase A 状態 | tsconfig.legacy-relax.json で warn 化、CI block なし、relative imports fallback pattern で運用中 |
| Phase B 採用案 | 案 A = tsconfig path alias（Dev-JJ R22 推奨、Round 24 で migrate 実行想定） |
| Phase B クローズ条件 | 6 violations 解消 + regression 0（1189 PASS 維持）+ commit merge + Review 合意 + DEC formal close |
| DEC-019-076 整合性 | DEC-019-076 = PM-P 起案候補 = ARCH-01 解消 = DEC-019-041 Phase B 必達クローズ宣言 = 本書のクローズ条件と直結 |
| 想定 close 議決 round | Round 24 完遂着地時 / 5/26 統合採択 or Round 24 独立採決 |

## 1. DEC-019-041 文脈整理

### 1.1 元 DEC-019-041 の主旨（Phase A 確立期）

DEC-019-041 は ARCH-01（workspace alias 不在 issue）を formal 議決事項として記録した DEC で、以下の段階移行 path を確立した:

- **Phase A（warn 期 / Round 17-22 期間）**: tsconfig.legacy-relax.json による cross-rootDir 違反の warn 化、CI block なし、relative imports fallback pattern を許容
- **Phase B（error 期 / Round 23-24 想定）**: 違反完全解消 + tsconfig.base.json strict への昇格、relative imports fallback pattern からの離脱

Phase A 期間中、harness → openclaw-runtime への relative imports は 6 件（5 unique modules）混入し、cross-rootDir 違反として TS6059 系 9 件（うち本件対象 6 件 + knowledge 系 3 件）が警告レベルで観測されていた。

### 1.2 Phase B 候補としての位置づけ

DEC-019-074 ④（Round 22 起案）で「ARCH-01（DEC-019-041 Phase B 候補 = workspace alias 課題）解消可否評価」が PM-O のもとで議題化され、評価軸 (a) workspace alias 適用範囲拡大可否 / (b) relative imports fallback pattern との並存可否 / (c) Phase 2 W5 着手前の解消必要性 の 3 軸で Dev-JJ Round 22 が評価担当となった。

### 1.3 Round 22 評価の結論

Dev-JJ R22 評価書 326 行は三択（案 A = tsconfig path alias / 案 B = pnpm workspaces 完全活用 / 案 C = Nx 導入）を比較し、**案 A を採用**（議決不要、技術施策のみ、移行コスト 2.5h、副作用 0、regression 0 想定）と結論。Round 23 で実装着手を提言した。

### 1.4 Round 23 における Phase B 実体化

本 Round 23 では以下 3 work product で Phase B 実体化が完成する:

1. Dev-NN R23 Phase 2 production rollout spec（12 step 詳細化 + rollback 経路 + risk matrix）= 本書姉妹
2. Dev-NN R23 DEC-041 Phase B クローズ判定 prep（本書）
3. Dev-NN R23 regression test strategy（5 failure scenario + 各 fallback）= 本書姉妹

Round 24 で実物理 migrate 完遂時、上記 3 work product を evidence として DEC-019-041 Phase B クローズが formal 化される。

## 2. Round 24 で migrate 完遂時の Phase B クローズ条件

### 2.1 必達条件 6 件（AND 結合）

| # | 条件 | 検証方法 | evidence 出所 |
|---|---|---|---|
| C-1 | harness/tsconfig.json に paths 追加完了 | git diff で +3 行確認 | Round 24 commit |
| C-2 | harness/vitest.config.ts resolve.alias 追加完了 | git diff で +6 行確認 | Round 24 commit |
| C-3 | harness/src/17day-path-w3-orchestrator.ts の 6 import 文 alias 化完了 | git diff で +6/-6 行確認 | Round 24 commit |
| C-4 | TS6059 / TS2307 系違反 6 件解消（baseline 9 → 残 3 件） | typecheck pre/post log diff | Round 24 typecheck log |
| C-5 | regression 0（harness 795 + openclaw-runtime 394 = 1189 PASS 維持） | vitest pre/post log diff | Round 24 vitest log |
| C-6 | main へ merge 完了（feat branch から fast-forward or squash） | git log main で commit 確認 | main HEAD |

### 2.2 推奨条件 4 件（AND 結合、必須ではないが close 議決の質向上）

| # | 条件 | 検証方法 |
|---|---|---|
| C-7 | Review-N / Review-O 事前合意（DEC-074 V-4 evidence 化） | Review 部門報告 |
| C-8 | knowledge 系 3 件 TS error の別 issue 化完了（ticket 起票） | issue tracker / decisions.md |
| C-9 | Round 25 以降の tsconfig.base.json paths 集約 task 起票 | dashboard/active-projects.md |
| C-10 | 案 B（pnpm workspaces 正規化）への将来 path 文書化 | Dev-NN R23 spec §5.3 で済 |

### 2.3 Phase B クローズ判定 flow

```
Round 24 着手 GO 判定（CEO 承認）
      ↓
Phase 2 spec §1 12 step 実行（2.5h 想定）
      ↓
C-1〜C-3（commit 完成）OK AND C-4〜C-5（regression 0）OK
      ↓ Yes                                        ↓ No
   C-6（merge）                              rollback（Phase 2 spec §3）
      ↓                                            ↓
Phase B クローズ議決提案（Round 24 完遂着地時）   DEC-019-041 status: confirmed 維持
      ↓                                       Phase B 再挑戦は Round 25 以降
DEC-019-041 status: confirmed → resolved
DEC-019-076 で formal close 宣言（PM-P 起案）
```

### 2.4 クローズ後の DEC-019-041 状態遷移

```
status: confirmed (Round 17 制定〜Round 24 完遂前)
      ↓ Round 24 完遂 + 6 必達条件 AND 達成
status: resolved (Phase B クローズ済、relative imports fallback pattern は alias と共存運用)
      ↓ Phase 2 着手前（Round 25-27 想定）
status: superseded by DEC-019-XYZ (Phase 2 で案 B = pnpm workspaces 完全活用へ移行時)
```

## 3. DEC-019-076 候補との整合性

### 3.1 DEC-019-076 の起案文脈

decisions.md L930 によれば、DEC-019-076 は「heartbeat 5M load test 評価 + ContinuousRunDetector 12 桁拡張検討 = Round 23-24 採決想定、Round 21 Sec-P 1M 10 桁達成の自然継続」として記録されており、当初は Sec 系の議決として position された。

ただし Round 22 進行中に **DEC-019-076 候補 = PM-P 起案候補 = ARCH-01 解消 = DEC-019-041 Phase B 必達クローズ宣言** と再 position する案が浮上（task brief に明示記載）。本書では後者の position を採用し、整合性を確認する。

### 3.2 整合性論点

| 論点 | 整合性判定 | 根拠 |
|---|---|---|
| DEC-019-076 が ARCH-01 解消宣言として機能可能か | OK | DEC-019-041 Phase B クローズと同等内容、命名衝突なし |
| 元の Sec 系（5M load test）と命名衝突しないか | NG | 同一番号で異なる主題は append-only DEC 規約違反 |
| 命名衝突回避策 | DEC-019-076 を ARCH-01 用、Sec 5M を DEC-019-077 等に振替 | PM-P / Sec-Q 連携で番号調整必要 |
| Round 24 完遂着地時の close 議決 timing | DEC-074 ④ V-4 evidence と同時に提案可能 | Round 24 完遂報告 + DEC formal 採決 |
| 採決方式 | CEO 自走採決 + Owner 拘束 0 分推奨 | DEC-068 SOP 連続 8 round 適用継続 |

### 3.3 DEC-019-076（ARCH-01 解消宣言）の採決推奨内容

```
DEC-019-076: ARCH-01 解消宣言 + DEC-019-041 Phase B 必達クローズ
- 起案: PM-P (Round 23 想定)
- 議決対象: Round 24 で Phase 2 物理 migrate 完遂時に DEC-019-041 Phase B クローズを formal 化
- 議決軸:
  ① harness の cross-rootDir 違反 6 件解消完遂
  ② regression 0（1189 PASS 維持）
  ③ relative imports fallback pattern と alias の共存運用継続
  ④ knowledge 系 3 件は別 issue 化（DEC-019-041 範囲外として明示分離）
  ⑤ Phase 2（案 B pnpm workspaces 正規化）への将来 path 確立
- 採決推奨: Y 無条件（Round 24 完遂時）/ Y 条件付（部分 PASS 時 = knowledge 系含めた完全解消は Round 25+）/ N（rollback 発生時 = Phase B 維持）
```

### 3.4 元の Sec 系議題（5M load test）の救済策

- DEC-019-076 を ARCH-01 用に再 position する場合、Sec 5M load test 議題は DEC-019-077 以降に再番号付与
- Round 23 PM-P / Sec-Q 連携で番号整合化
- decisions.md は append-only 規約継続、既存 DEC-019-001〜074 は無改変

## 4. Phase B クローズ後の運用ガイド

### 4.1 relative imports fallback pattern の取扱い

- Phase B クローズ後も DEC-019-041 で確立済 fallback pattern は **廃止しない**
- alias 化が困難な edge case（例: 動的 import / dist build 直叩き）では fallback として継続使用可
- 新規 file 作成時の default は alias 経路を推奨、既存 file の追加変更時に alias 化を任意 refactor

### 4.2 monorepo 内の他 workspace への波及

- Round 25-27 想定で `tsconfig.base.json` への paths 集約 task を別途起票
- claude-bridge / orchestrator / sandbox 着手時（Phase 2 W5 想定）に同 alias pattern を踏襲
- 各 workspace の vitest.config.ts も resolve.alias 同期を default 化

### 4.3 案 B（pnpm workspaces 正規化）への移行 path

- Phase B クローズと **独立** に案 B 移行は将来検討可能
- 案 B 移行には CEO + Review 部門経由で「依存方向反転承認」議決必要（Dev-JJ R22 §3.3 参照）
- 移行 timing は Phase 2 着手前（Round 25 想定）or Phase 2 完遂後（Round 30+）

### 4.4 Phase 2 期間中の追加 verification

- 案 A 採用後も Phase 2 W5 で claude-bridge 着手時に alias 解決の cross-workspace 検証必要
- vitest / tsc / Node ESM の全 toolchain で alias 一貫性を sanity check
- 案 B 移行検討時の決定軸として、Phase 2 W5 中盤（Round 27 想定）に再評価

## 5. close 議決 prep 完成度評価

### 5.1 evidence 揃い度

| evidence | 状態 | 補足 |
|---|---|---|
| Dev-JJ R22 評価書 326 行 | 完成 | 案 A 推奨根拠 |
| Dev-NN R23 Phase 2 spec | Round 23 内完成 | 12 step + rollback + risk matrix |
| Dev-NN R23 closure prep（本書） | 進行中 | クローズ条件 6 + 推奨 4 + 整合性 |
| Dev-NN R23 regression strategy | Round 23 内完成 | 5 failure scenario + 各 fallback |
| Round 24 完遂 evidence | Round 24 想定 | commit + log + Review 合意 |
| Review-N / Review-O 事前合意 | Round 24 着手前 | DEC-074 V-4 evidence 化 |

### 5.2 close 議決 GO 判定（Round 23 終端）

**GO with conditions**

- Round 23 work product 3 件（Phase 2 spec / closure prep / regression strategy）完成済
- Dev-JJ R22 評価書の前提継承確証
- 必要条件: Round 24 完遂 + 6 必達条件 AND 達成 + Review 合意
- 条件未達時は Phase B 状態維持、relative imports fallback pattern 継続運用

### 5.3 残 risk

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| Round 24 で baseline 1189 PASS が変動 | 低 | 中 | Phase 2 spec §1 step 1 で再 baseline 取得 |
| knowledge 系 3 件残存で Phase B「未完」と判定される | 中 | 中 | DEC-019-076 議決で「ARCH-01 範囲は本件 6 件で完結、knowledge 系は別 issue」と formal 分離 |
| DEC-019-076 番号衝突（Sec 5M load test 系と） | 中 | 低 | PM-P / Sec-Q で番号整合化、本書 §3.4 提案踏襲 |
| Phase B close 議決が Phase 2 着手と前後逆転 | 低 | 中 | Round 24 完遂後 immediate 提案、Phase 2 W5 着手前に decision 確定 |
| Review 部門事前合意が Round 24 着手 trigger を block | 中 | 中 | Round 23 終端で Review-N に事前合意依頼、Round 24 着手前 96h 確保 |

## 6. 結論 + 次手順

### 6.1 Phase B クローズ条件確立宣言

本書により、DEC-019-041 Phase B クローズ条件は以下のとおり確立した:

- **必達 6 条件 AND**: paths 追加 / resolve.alias 同期 / import 6 書換 / 6 violations 解消 / regression 0 / main merge
- **推奨 4 条件**: Review 合意 / knowledge 系別 issue 化 / paths 集約 task 起票 / 案 B 将来 path 文書化
- **DEC-019-076 整合性**: PM-P 起案候補として再 position 可、Sec 5M 系は DEC-019-077+ に振替

### 6.2 Round 24 着手 trigger（再掲、Phase 2 spec §7.2 と一致）

1. CEO 形式承認（本書 + Phase 2 spec + regression strategy + Round 23 summary 受領後）
2. Round 22-23 baseline 維持確証
3. main 同期済（merge conflict ゼロ）
4. sentinel commit 戦略 + rollback dry-run 経路 ready

### 6.3 Round 24 完遂後の close 議決提案 timeline

```
Round 24 着手（CEO GO）
      ↓ 2.5h 想定
Phase 2 spec §1 12 step 実行
      ↓
C-1〜C-6 必達条件 AND 達成確認
      ↓
Round 24 完遂報告（Dev 担当）
      ↓
DEC-019-076 formal 採決提案（PM-P 起案）
      ↓ CEO 自走採決
DEC-019-041 status: confirmed → resolved
      ↓
W4 完成第 2 弾の ARCH-01 完遂宣言（Phase 1 完遂宣言の構成要素）
```

### 6.4 関連 file 参照

- `projects/PRJ-019/decisions.md` DEC-019-041（Phase A 確立）/ DEC-019-074 ④（評価可否）/ DEC-019-076 候補
- `projects/PRJ-019/reports/dev-jj-r22-arch-01-workspace-alias-feasibility.md`（前提評価書）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-phase2-production-rollout-spec.md`（姉妹: 実行設計）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-regression-test-strategy.md`（姉妹: regression 戦略）
- `projects/PRJ-019/reports/pm-o-r22-dec-071-072-073-verification.md`（PM 採決方式 SOP source）
- `projects/PRJ-019/reports/review-n-r22-dec-readiness-5dec-verification.md`（Review 事前合意 pattern）

---

**SOP 順守**: 本書は Round 23 のクローズ判定 prep のみ（実 close 議決は Round 24 完遂着地後）。既存 DEC-019-001〜074 は absolute 無改変。relative imports fallback pattern は Phase B クローズ後も廃止せず alias と共存運用。
