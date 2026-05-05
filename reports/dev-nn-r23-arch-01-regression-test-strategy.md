# Dev-NN Round 23 — ARCH-01 Phase 2 regression test suite 戦略

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-NN（Round 23, W4 完成第 2 弾 task ③）
- 範囲: ARCH-01 Phase 2 物理 migrate（Round 24 想定）実行時の regression 安全網設計
- 不可侵: 本書は Round 23 の **regression 戦略設計のみ**。実物理 migrate は Round 24。既存 vitest.config.ts / 全 test ファイルは absolute 無改変
- 関連: Dev-NN R23 Phase 2 spec / Dev-NN R23 DEC-041 closure prep（姉妹 2 報告）

## 0. サマリ

| 項目 | 値 |
|---|---|
| baseline tests | harness 795 PASS + openclaw-runtime 394 PASS = 1189 PASS / 0 FAIL |
| 維持目標 | regression 0（Round 24 完遂後も 1189 PASS / 0 FAIL 完全維持） |
| 検証 layer | typecheck / vitest run（unit + integration）/ smoke test（W3 orchestrator）/ lint / sanity check |
| Phase 2 実行戦略 | migration → immediate test run → diff 0 確認 → commit の 4 ゲート設計 |
| failure scenario 数 | 5 件（identifier mismatch / vitest resolve.alias 不整合 / NodeNext 拡張子 / TS6059 残存 / 二重定義 drift） |
| 各 fallback | rollback 経路（Phase 2 spec §3）+ 部分修正再試行 + Phase B 維持の 3 段階 |

## 1. baseline 1189 PASS 維持戦略

### 1.1 baseline 構成

- harness vitest: 795 PASS（Round 22 着地時点 = 17日 path W3 完成 + W4 production e2e + DI container tests 増分含む）
- openclaw-runtime vitest: 394 PASS（Round 22 維持基準）
- 合計: 1189 PASS / 0 FAIL / 0 skip / 0 todo（厳格維持）

### 1.2 Phase 2 実行による影響想定

- 案 A = tsconfig path alias は **import path の文字列置換のみ** = test の振る舞いは bit-identical
- vitest は resolve.alias で alias を実 path に解決 = test 実行時の module graph は変更前後で同一
- typecheck 上の TS6059 警告は 9 → 3（knowledge 系のみ残）= **エラー削減方向のみ**、増加は許容しない

### 1.3 維持戦略 4 軸

| 軸 | 目標 | 検証 |
|---|---|---|
| **件数完全一致** | 795 + 394 = 1189 維持 | pre/post log の PASS 行 diff |
| **PASS / FAIL 内訳一致** | 0 FAIL / 0 skip / 0 todo 維持 | reporter=verbose で内訳確認 |
| **個別 test name 一致** | 全 test name の集合が pre = post | log diff で個別 test 出現確認 |
| **実行時間 sanity** | post / pre 比 0.85〜1.15 範囲（±15%） | log の duration 行抽出 |

## 2. Phase 2 実行 → migration 後 immediate test run → diff 0 確認 → commit の 4 ゲート

### 2.1 ゲート構造

```
[ゲート 0: pre-flight baseline]
  pnpm install --frozen-lockfile
  pnpm --filter @clawbridge/harness exec vitest run --reporter=verbose > pre-harness.log
  pnpm --filter @clawbridge/openclaw-runtime exec vitest run --reporter=verbose > pre-openclaw.log
  期待: 1189 PASS / 0 FAIL
  失敗時: Round 22 着地と乖離 → Phase 2 abort、原因調査
      ↓ PASS
[ゲート 1: migration]
  Phase 2 spec §1 step 3-5 実行（tsconfig paths + vitest resolve.alias + 6 import 文書換）
  git diff で +15 / -6 行範囲確認
      ↓
[ゲート 2: immediate test run]
  pnpm --filter @clawbridge/harness exec tsc --noEmit > post-typecheck.log
  pnpm --filter @clawbridge/harness exec vitest run --reporter=verbose > post-harness.log
  pnpm --filter @clawbridge/openclaw-runtime exec vitest run --reporter=verbose > post-openclaw.log
  期待: 1189 PASS / 0 FAIL / TS6059 系 3 件以下
      ↓ PASS
[ゲート 3: diff 0 確認]
  diff pre-harness.log post-harness.log
  diff pre-openclaw.log post-openclaw.log
  期待: PASS 件数行 / 個別 test name 完全一致（duration 行のみ差分許容）
      ↓ PASS
[ゲート 4: commit]
  Phase 2 spec §1 step 12 commit + push
  commit message に baseline + post-migrate 値埋込
```

### 2.2 各ゲートの abort 条件

| ゲート | abort 条件 | 対応 |
|---|---|---|
| 0 | baseline が 1189 でない / 1 件でも FAIL | Phase 2 着手停止、Round 22 着地値再検証 |
| 1 | git diff が想定範囲（+15/-6）を超過 | typo / 識別子誤差を疑い、step 3-5 再実行 |
| 2 | typecheck で TS error 増加 / vitest で 1 件でも FAIL | rollback（Phase 2 spec §3）即時実行 |
| 3 | PASS 件数 / 個別 test name の集合不一致 | rollback 即時実行、cause analysis 別途 |
| 4 | commit 時に lint failure | step 9 lint check の見落とし、再 lint + 修正 |

### 2.3 ゲート間の所要時間想定

| ゲート | 想定時間 |
|---|---|
| 0 pre-flight | 10 分（pnpm install 含む） |
| 1 migration | 30 分（step 3-5） |
| 2 test run | 15 分（typecheck + 2 vitest run） |
| 3 diff 確認 | 10 分（log 比較 + sanity） |
| 4 commit | 5 分（commit + push） |
| **合計** | **70 分（Phase 2 spec §0 想定 2.5h の core 部分）** |

残 80 分は Phase 2 spec §1 step 1-2（branch 作成）+ step 6-11（typecheck / vitest / lint / smoke / rollback dry-run / sanity check）+ buffer に充当

## 3. 5 failure scenario + 各 fallback

### 3.1 Scenario 1: identifier mismatch（import 識別子 typo）

**症状**: ゲート 2 で TS2305 / TS2304（識別子名 typo / alias prefix の path segment 順序ミス）
**検出**: ゲート 2 typecheck 即時 / **fallback**: spec §1 step 5 の 6 行を git diff で 1 件ずつ inspect → pre-baseline 文字列比較 → 修正後ゲート 2 再実行 → 3 回連続失敗で rollback escalate
**preventive**: spec §1 step 5 で 6 行を 1 件ずつコピペ書換 + IDE auto-complete 経由

### 3.2 Scenario 2: vitest resolve.alias と tsconfig paths の不整合

**症状**: vitest が ERR_MODULE_NOT_FOUND を throw（resolve.alias 記述漏れ / 末尾 slash 差 / prefix match 誤解で末尾 `*`）
**検出**: ゲート 2 vitest 最初の test 即時 fail / **fallback**: vitest.config.ts を spec §1 step 4 例と diff → `node -e "path.resolve(...)"` で絶対 path 確認 → `--reporter=verbose` 再実行 → 3 回連続で rollback
**preventive**: spec §1 step 11 二重定義 sanity check + vitest 公式 docs 確認

### 3.3 Scenario 3: NodeNext + verbatimModuleSyntax の `.js` 拡張子付け忘れ

**症状**: ゲート 2 で TS2307（`.js` 拡張子抜き / IDE auto-import が `.js` 削除）
**検出**: ゲート 2 typecheck 即時 / **fallback**: `grep -nE "from '@clawbridge/openclaw-runtime/.*\\.js'" ... | wc -l` で 6 件確認 → 6 件未満なら抜けを補完 → ゲート 2 再実行
**preventive**: spec §1 step 5 `.js` 拡張子明示 + Round 24 note に「vitest は `.js` 不要だが TS NodeNext は必須」明記

### 3.4 Scenario 4: TS6059 残存（knowledge 系 3 件以外で残る）

**症状**: TS6059 系 violations が baseline 9 件 → 4 件以上残存（期待 3 件 = knowledge 系のみ。原因: harness 内別 file で cross-rootDir 違反が後発で混入）
**検出**: ゲート 2 typecheck log diff（pre/post `grep -E "TS6059" | sort | diff`）期待差分は -6 行 only
**fallback**: 期待外残存を inspect → 追加 file 発見時は **拡張 or 別 issue 化を CEO 判断**（拡張: 同 alias で書換 → ゲート 2 再実行 / 別 issue 化: closure prep C-4 を「baseline 9 → 3 + 後発混入分」に書換）
**preventive**: ゲート 0 で TS6059 件数 9 件確認、不一致時は Round 22-23 期間の追加 commit を inspect

### 3.5 Scenario 5: 二重定義 drift（tsconfig paths と vitest resolve.alias の path 解決先 不一致）

**症状**: ゲート 2/3 で typecheck PASS だが vitest module not found / 逆もあり（tsconfig paths と vitest resolve.alias の解決先絶対 path 不一致）
**検出**: ゲート 2 vitest / ゲート 3 diff の non-symmetric 状態
**fallback**: 両者の解決先絶対 path を `node -e "path.resolve(...)"` で出力比較 → 同一でない場合片方を修正 → ゲート 2 再実行（vite-tsconfig-paths plugin 採用は Round 25+ 再検討）
**preventive**: spec §1 step 11 二重定義 sanity check を Round 24 で必ず実施 + script 化で pre-hook 候補（Round 25）

## 4. failure scenario 優先度マトリクス

| scenario | likelihood | impact | detection layer | fallback effort | 総合優先度 |
|---|---|---|---|---|---|
| 1: identifier mismatch | 中 | 中 | ゲート 2 typecheck | 低（5 分） | 中 |
| 2: vitest resolve.alias 不整合 | 中 | 高 | ゲート 2 vitest | 中（10 分） | 高 |
| 3: `.js` 拡張子付け忘れ | 中 | 中 | ゲート 2 typecheck | 低（5 分） | 中 |
| 4: TS6059 残存 | 低 | 高 | ゲート 2 log diff | 高（CEO 判断必要） | 高 |
| 5: 二重定義 drift | 低 | 高 | ゲート 2 / 3 | 中（10 分） | 高 |

## 5. rollback escalation flow

```
ゲート 2 / 3 で失敗
      ↓
scenario 1-5 のどれに該当するか分類（5 分以内）
      ↓
fallback 戦略適用（10-30 分）
      ↓ 解消
ゲート 2 から再実行 → ゲート 3 → 4
      ↓ 解消せず（同一 scenario 3 回連続失敗）
rollback 発動（Phase 2 spec §3）
      ↓ 5 分以内
sentinel commit 経由で baseline 1189 PASS 復元
      ↓
DEC-019-041 status: confirmed 維持
Round 25 で root cause 再分析後に Phase B-1 再挑戦
```

## 6. Round 24 実行時の sanity check checklist

### 6.1 着手前 checklist（5 項目）

- [ ] ゲート 0 baseline で 1189 PASS / 0 FAIL 確認
- [ ] git status clean（uncommitted changes 0）
- [ ] sentinel commit SHA 記録
- [ ] Phase 2 spec / closure prep / 本書 3 報告参照可能状態
- [ ] CEO 形式承認受領済

### 6.2 着手中 checklist（ゲート 1-4 各時点）

- [ ] ゲート 1 後: git diff +15/-6 行範囲内
- [ ] ゲート 2 後: typecheck で TS error 増加 0 / vitest 1189 PASS
- [ ] ゲート 3 後: pre/post log の PASS 件数行 diff = 0
- [ ] ゲート 4 後: commit message に baseline + post 値埋込

### 6.3 着手後 checklist（commit + push 後）

- [ ] CI（GitHub Actions / Vercel）で 1189 PASS 再現
- [ ] Review-N / Review-O が事前合意通り PR review 着手
- [ ] DEC-019-076 採決提案を PM-P が起案準備

## 7. 結論 + Round 24 引継

### 7.1 regression test suite 戦略確立宣言

本書により、ARCH-01 Phase 2 物理 migrate 実行時の regression 安全網は以下のとおり確立した:

- **4 ゲート構造**: pre-flight baseline / migration / immediate test run / diff 0 確認 / commit
- **5 failure scenario + 各 fallback**: identifier / vitest alias / `.js` 拡張子 / TS6059 残存 / 二重定義 drift
- **rollback escalation**: 同一 scenario 3 回連続失敗 → rollback、5 分以内に baseline 復元
- **sanity check checklist**: 着手前 5 + 着手中各時点 + 着手後 = 完備

### 7.2 Round 24 引継事項

1. ゲート 0 で baseline 再取得、Round 22-23 値（1189 PASS）と一致確認
2. Phase 2 spec §1 12 step を本書 4 ゲート構造で wrap して実行
3. 5 failure scenario のいずれが発生しても fallback 戦略で 10-30 分以内に解消 or rollback escalate
4. ゲート 4 commit 後に Round 24 完遂報告 + DEC-019-076 採決提案

### 7.3 本書の Phase 2 spec / closure prep との連携

| Round 23 報告 | 提供する内容 | 本書との関係 |
|---|---|---|
| Phase 2 spec | 12 step 詳細 + rollback 経路 + risk matrix | 本書ゲート構造で 12 step を wrap |
| closure prep | クローズ条件 6 + 推奨 4 + DEC-076 整合性 | 本書ゲート達成時に close 議決 trigger |
| 本書 regression strategy | 4 ゲート + 5 scenario + checklist | Phase 2 spec / closure prep の安全網 |

3 報告は Round 24 着手前の **必読 set** として CEO 承認 + Review 部門事前合意の前提となる。

### 7.4 関連 file 参照

- `projects/PRJ-019/reports/dev-jj-r22-arch-01-workspace-alias-feasibility.md`（前提評価 326 行）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-phase2-production-rollout-spec.md`（姉妹: 実行設計 12 step）
- `projects/PRJ-019/reports/dev-nn-r23-dec-041-phase-b-closure-prep.md`（姉妹: クローズ条件）
- `projects/PRJ-019/app/harness/vitest.config.ts`（Round 24 で resolve.alias 追加対象）
- `projects/PRJ-019/app/harness/tsconfig.json`（Round 24 で paths 追加対象）
- `projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts`（Round 24 で 6 import 文書換対象）

---

**SOP 順守**: 本書は Round 23 の regression 戦略設計のみ（実 test 実行は Round 24）。既存 vitest.config.ts / 全 test ファイルは absolute 無改変。baseline 1189 PASS は Round 24 完遂後も完全維持目標。
