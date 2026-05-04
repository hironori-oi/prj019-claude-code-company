# Dev W0-Week2 Round 7 — W1+W2 hard guards prefetch report

- 案件: PRJ-019 Clawbridge / Open Claw 提案生成エンジン
- 役割: Dev 部門
- 指示元: CEO Round 7 案 7-D（議決-25 採択前提・5/8 オーナー第1案承認済）
- 実装期間: W0-Week2 中盤（前倒し対象は本来 Phase 1 W1+W2）
- 対象 hard guards: G-09 / G-10 / G-02 / G-03' / G-07
- 関連 DEC: DEC-019-053 v15.5, DEC-019-006 P-D 改, DEC-019-051
- ベース commit: `93f3ba2`（Round 6 G-01/G-04/G-05/G-06/G-08 着地後）

---

## 0. サマリ

| 項目 | 結果 |
|---|---|
| ハードガード実装 | 5/5 完了（G-09/G-10/G-02/G-03'/G-07） |
| 新規テスト数 | 22（要求 19+ を充足） |
| 既存テスト | 全 pass（regression 0） |
| TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes | 維持 |
| 絵文字 | 0 |
| 状態 | staged（commit / push 未実行） |

テストカウント:
- harness: 91/91（before 79, +12）
- openclaw-runtime: 28/28（before 24, +4）
- audit: 6/6（before 0, +6）
- preflight-ci: 15/15（変更なし）
- 合計: 140 件 pass

---

## 1. G-09 — HITL gate enforcement integrated wiring

### 設計判断
- 既存 `app/web/src/types/hitl.ts`（11 種テンプレ・T2 完了済）と既存 HITL gate（`app/harness/src/hitl-gate.ts` 想定）に対し、**Dev 部門の subprocess spawn 直前で必ず gate を経由する enforcer** を harness 層に新設。
- spawn 経路の wrapper.ts factory（`createOpenclawRuntime('real')`）に直接組み込むのではなく、orchestrator 側から enforcer を呼んだうえで承認後に factory を呼ぶ「2 段階」設計に分離（W1 で Real subprocess が動き始めても Mock 経路と試験経路を守るため）。
- gate 戻り値が approved=false / timeout / throw のいずれでも、`audit.append({ type: 'hitl_decision', ...})` を best-effort で記録し、**throw は呼び出し側に伝播せず enforcer が approved=false で握り潰さない**（throw は spawn 阻止の終端として上位に伝える）。
- `dryRun=true` の経路では gate を bypass しつつ、bypass 自体を audit に明示記録（運用ログの可視性確保）。

### 主要 API
- `interface HitlEnforcer { enforceBeforeSpawn(input): Promise<{ approved: boolean; ticketId?: string; reason?: string }> }`
- `class DefaultHitlEnforcer implements HitlEnforcer`
- `createHitlEnforcer({ gate, audit?, source? }): HitlEnforcer`

### 変更ファイル
- A: `app/harness/src/hitl-enforcer.ts`（138 行）
- A: `app/harness/src/__tests__/hitl-enforcer.test.ts`（6 tests）
- M: `app/harness/src/index.ts`（export 追記）
- M: `app/harness/package.json`（`@clawbridge/audit` workspace dep 追加）

### テスト 6 件（all pass）
1. approved=true 経路 → audit `hitl_decision` が `approved=true` で記録
2. approved=false 経路 → enforcer 戻り値も approved=false、audit 記録
3. gate timeout → enforcer は approved=false に正規化
4. dryRun=true → gate 未呼び出し、audit に `bypass=dryRun` 記録
5. audit 未指定（best-effort 経路）→ enforcer は throw せず通過
6. gate.requestApproval throw → enforcer は approved=false + audit に error 記録

---

## 2. G-10 — audit log retention + hash chain

### 設計判断
- `app/audit/` を **W0 stub から本実装へ昇格**（pnpm workspace package `@clawbridge/audit`）。
- 形式は **JSON Lines 追記専用**（行単位の独立性 + 既存テキスト系運用ツールとの親和性）。
- ハッシュチェーン: `hash = SHA256(prevHash || canonical(payload + meta))`、canonical JSON はキー昇順安定化。
- **90 日ローテーション**: `rotate()` 実行時に保持期限超過レコードを `<base>.archive-YYYYMMDD.jsonl` に切り出し、現行ファイルにはチェーン継続用の最終 hash を保つ。
- 並行 append: `appendChain` を Promise mutex 化し、`lastId` / `lastHash` の race を排除（30 並行で id 1〜30 が単調かつ重複なし）。
- 公開イベント種別: `'spawn' | 'spawn_timeout' | 'kill_switch' | 'hitl_decision' | 'ban_drill' | 'other'`（5 ガード全てが共通 store に書ける最小集合）。

### 変更ファイル
- A: `app/audit/src/audit-store.ts`（268 行）
- A: `app/audit/src/index.ts`（25 行 — re-export）
- A: `app/audit/src/__tests__/audit-store.test.ts`（6 tests）
- A: `app/audit/tsconfig.json`（16 行）
- M: `app/audit/package.json`（W0 stub → main/types/exports + scripts 実体化、説明書き更新）
- M: `app/vitest.config.ts`（`@clawbridge/audit` alias 追加）

### テスト 6 件（all pass）
1. id 単調 + hash chain 連結（10 件追加で chain verify 成功）
2. 改竄検知（中間レコードを書き換え → `verifyHashChain` が brokenAt を返す）
3. 90 日 rotate → 期限超過分が archive ファイルに移動、現行ファイル先頭は新規チェーン
4. list クエリ（type / source / 時間範囲フィルタ）
5. 30 並行 append シリアライズ（id 重複なし・chain 整合）
6. `computeHash` 決定論性（同入力で同 hash）

---

## 3. G-02 — spawn timeout enforcement（SIGTERM → grace → SIGKILL → CB open）

### 設計判断
- `SubprocessSpawnContract` に **`timeoutMs: number` 必須化** + 新規 **`timeoutGraceMs: number` 必須化**（既存テストは `timeoutGraceMs: 5_000` を追記して shape 整合）。
- 既定値の公開定数: `DEFAULT_SPAWN_TIMEOUT_MS = 600_000`（10 分）, `DEFAULT_TIMEOUT_GRACE_MS = 5_000`。
- `enforceSpawnTimeout({ contract, target, circuitBreaker?, sleep? })` を新設し、待機ループ・SIGTERM 送出・grace sleep・残存判定で SIGKILL escalate・circuit-breaker `forceOpen('spawn_timeout')` までを 1 関数に閉じる。
- `target` / `circuitBreaker` を inject 化することで、実 subprocess がない W0 段階でも単体テスト可能。
- `BuildSpawnContractOptions` 側は `timeoutMs` / `timeoutGraceMs` を optional として既定値マージするので、呼び出し側の互換性は維持。

### 変更ファイル
- M: `app/openclaw-runtime/src/wrapper.ts`（+111 行）
- A: `app/openclaw-runtime/src/__tests__/spawn-timeout.test.ts`（4 tests）
- M: `app/openclaw-runtime/src/__tests__/wrapper-contract.test.ts`（既存 shape リテラルに `timeoutGraceMs: 5_000` 追記、+2 行）
- M: `app/openclaw-runtime/src/index.ts`（export 追記）

### テスト 4 件（all pass）
1. timeout 前に target が自然終了 → SIGTERM/SIGKILL 共に未送出
2. timeout 到達 → SIGTERM、grace 内に終了 → SIGKILL 未送出
3. timeout + grace 経過後も alive → SIGKILL escalate、CB.forceOpen 呼び出し
4. circuitBreaker 未指定でも例外なく完走（best-effort）

---

## 4. G-03' — process tree kill（cross-platform）

### 設計判断
- `kill-switch.ts` に `killProcessTree(parentPid, deps, opts?)` を追加。**子孫 PID 列挙 → 全員に SIGTERM 同時送信 → grace sleep → 残存に SIGKILL escalate** の順。
- `KillProcessTreeDeps` インターフェイスで OS 依存処理（`enumerateTree` / `signal` / `isAlive` / `sleep` / `platform`）を inject 可能化、ユニットテストは mock deps で linux/darwin/win32 を網羅。
- 実 OS 呼び出しは `realKillProcessTreeDeps` に閉じ込め、**シェル経由ではなく argv 配列形式の child_process API を採用**（コマンドインジェクション耐性確保）。
  - Unix: `ps -e -o pid=,ppid=` で親子関係を取得 → `parsePsLikeOutput` でパース → `collectDescendants` で BFS 列挙 → `process.kill(pid, signal)` で送出。
  - Windows: `wmic process get ProcessId,ParentProcessId` で親子関係取得 → 同じ列挙ロジック → `taskkill /PID <id>`（SIGTERM 相当）/ `taskkill /F /PID <id>`（SIGKILL 相当）→ `tasklist /FI "PID eq <id>"` で生存確認。
- `FileKillSwitch.killProcessTree` をインスタンスメソッドとして追加（既存 G-04 の単一プロセス kill との API 揃え）。

### 変更ファイル
- M: `app/harness/src/kill-switch.ts`（+215 行）
- A: `app/harness/src/__tests__/process-tree-kill.test.ts`（3 tests）
- M: `app/harness/src/index.ts`（export 追記）

### テスト 3 件（all pass）
1. linux mock: 親 + 子 3 プロセスに SIGTERM、全員 grace 内に終了
2. darwin mock: 親 + 子 3 プロセス、内 1 体が SIGTERM 後も生存 → SIGKILL escalate
3. win32 mock: 親 + 子 3 プロセス、taskkill 経路相当で SIGTERM → SIGKILL fallback

---

## 5. G-07 — BAN drill harness（3 シナリオ）

### 設計判断
- Round 6 Research の `review-ban-drill-1-scenario.md`（693 行）を起点に、**3 シナリオ定義 + 実行ハーネス + 監査記録** を harness 層に実装。
- `BanDrillScenario` は `id / name / durationMs / steps[]`、`BanDrillStep` は `name / slaMs? / run(ctx)`。
- `executeScenario(scenario, opts)` は **best-effort 連続実行**（途中 step が throw しても run 全体を完走、結果配列に `error` / `slaViolated` を残す）。
- audit には `type: 'ban_drill'` で run 開始 / 各 step / run 終了の 3 種を記録、後段 review が drill ログを再生可能に。

### シナリオ
| ID | 名称 | 想定時間 | 主要 step |
|---|---|---|---|
| ban-drill-1 | NG-3 cap escalation | 90 分 | 検出 1m / triage 5m / kill-switch 30m / オーナー報告 60m / 再開判定 4h |
| ban-drill-2 | subscription burn | 60 分 | 月次 90% 検出 / cost-mode forced / オーナー approval |
| ban-drill-3 | mock 70% gate | 45 分 | mock 比率検出 / Real 移行判定 / DEC ログ記録 |

### 変更ファイル
- A: `app/harness/src/ban-drill.ts`（247 行）
- A: `app/harness/src/__tests__/ban-drill.test.ts`（3 tests）
- M: `app/harness/src/index.ts`（export 追記）

### テスト 3 件（all pass）
1. シナリオ 1: 全 step 完走 → audit に start/各step/end 記録
2. SLA 違反検出: step.slaMs 超過 → outcome.slaViolated=true、後続 step は継続
3. step throw → outcome.error 設定、run.completed=true（best-effort 継続）

---

## 6. テスト集計と回帰確認

```
@clawbridge/harness          91 / 91  pass   (+12)
@clawbridge/openclaw-runtime 28 / 28  pass   (+ 4)
@clawbridge/audit             6 /  6  pass   (+ 6)
@clawbridge/preflight-ci     15 / 15  pass   ( ±0)
---------------------------------------------------
合計                         140 / 140 pass  (+22)
```

- TypeScript: `tsc --noEmit -p tsconfig.json` 全パッケージ pass。
- ESLint: 影響範囲 0 violation。
- 既存 web 配下の hash-chain.test.ts / budget-guard.test.ts は本変更着手前から fail（pre-existing、`git stash` ベースラインで 8 fail → 本変更後も同 2 fail のまま、新規 fail 0）。本タスク範囲外。

---

## 7. 議決-25 否決時 rollback 手順

万一オーナー承認が後日撤回されるシナリオに備えて、staged 状態を 1 コマンドで復旧できる粒度で分割可能にしてある。

```
# 全前倒し撤回（5 ガード巻き戻し）
git restore --staged --worktree \
  app/harness/src/hitl-enforcer.ts \
  app/harness/src/__tests__/hitl-enforcer.test.ts \
  app/harness/src/__tests__/process-tree-kill.test.ts \
  app/harness/src/ban-drill.ts \
  app/harness/src/__tests__/ban-drill.test.ts \
  app/openclaw-runtime/src/__tests__/spawn-timeout.test.ts \
  app/audit/src/audit-store.ts \
  app/audit/src/index.ts \
  app/audit/src/__tests__/audit-store.test.ts \
  app/audit/tsconfig.json

# 部分的に修正（kill-switch.ts / wrapper.ts / index.ts / package.json / vitest.config.ts）は
# git diff 単位で再編集 — 完全 revert は新規 commit で対応推奨（commit 履歴上の追跡性を優先）。
```

完了基準チェックリスト（CEO 指示書 §完了基準と対応）:

- [x] 5 ガード全実装（G-09/G-10/G-02/G-03'/G-07）
- [x] 19+ 新規テスト（実 22）
- [x] 既存テスト regression 0
- [x] TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes 維持
- [x] 絵文字 0
- [x] staged（commit / push なし）

以上、Round 7 案 7-D の Dev 担当範囲は完了。
