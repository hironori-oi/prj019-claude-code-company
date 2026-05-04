# PRJ-019 Round 15 第 3 波 Dev-N 完了レポート — FileHitl11Gate I/O 完遂 + KE orchestrator wiring + P-UI-10 着地

最終更新: 2026-05-05 / 起案: Dev 部門 R15 Dev-N（Round 14 partial 残作業 3 件、軸-A 加速 path 残 ctrl 連動）
位置付け: Round 14 Dev-E が前倒し着地した HITL-11 / KE-02 wiring の partial 残（FileHitl11Gate の reject 経路バグ + 隔離 dir 物理 I/O 未実装 + KE orchestrator 上位層未配線 + P-UI-10 ctrl 未着手）を Round 15 第 3 波 Dev-N として完遂。dev.md「実装方針の決定」「テスト計画」「工数見積」役割整合、API $0、TypeScript strict、絵文字不使用。

連動 DEC: DEC-019-033（KE 4 軸 + HITL-11 拡張）/ DEC-019-018（HITL Gate）/ DEC-019-062（議決-28 全 Full Pass、5/5 即時採決完遂）
連動レポート:
- `dev-round13-E-ke-controls-pre-emption.md`（Round 13 Dev-J KE 系 5/5 件完遂、HITL-11 evaluator + KE-01〜04 着地）
- `dev-p-r15-mandatory-50-acceleration-to-5-22-95pct.md`（Round 15 第 2 波 Dev-P、軸-A 加速 path 設計）
- `ceo-acceleration-plan-v16-prep.md`（Dev-N 担当範囲明示: §117 行）
- `ceo-dec-019-033-consolidation.md`（DEC-019-033 ⑪ 4 項目追加: P-UI-07/08/09/10 + HITL-11、§149-152 P-UI-10 spec）

---

## §0 Executive Summary

Round 15 第 3 波 Dev-N は Round 14 partial 残 3 件を **全件 PASS で着地**:

| タスク | 範囲 | 成果物 | tests | 既存への影響 |
|---|---|---|---|---|
| **N-1** FileHitl11Gate I/O 完遂 | 既存 polling loop の reject 経路バグ修正 + 隔離 dir / manifest / approve 移動 / reject 維持 + redaction tag を新設層で物理化 | `file-hitl11-gate.ts` patch +24 行 / `hitl-11-quarantine.ts` 新設 296 行 / Vitest 8 ケース | 18/18 既存 hitl-11 gate tests 全 PASS（previously 16/18）+ 8/8 quarantine 新規 PASS = 計 26 件 | 0（既存 hitl-gate.ts 無改変） |
| **N-2** KE orchestrator wiring | case 完了 hook → KE orchestrator → quarantine → gate-11 → 知識 dir 分配（patterns / decisions / pitfalls）の上位 orchestrator を新設、既存 ke-02-orchestrator-wiring を**再利用**して上位 layer に積む | `ke-orchestrator.ts` 新設 209 行 / Vitest 6 ケース | 6/6 PASS、既存 12/12 ke-02-orchestrator-wiring 全 PASS 維持 | 0（既存 wiring 無改変、上位 layer 追加） |
| **N-3** P-UI-10 着地（Pen Test scheduler） | DEC-019-033 ⑪ §149-152 spec の W2 / W4 window scheduler + missed escalation を純関数 evaluator + YAML control config で着地 | `p-ui-10-pentest-scheduler.ts` 新設 137 行 / `policies/p-ui-10-pentest.yaml` 新設 35 行 / Vitest 8 ケース | 8/8 PASS | 0（独立新設） |

**合計**: 全 22 ケース新規 PASS、harness 全 607 tests 全 PASS（regression 0）、TS 型エラー新規 0（既存 yaml-front-matter-parser.ts / ke-04-audit-wiring.ts の readonly 整合エラーは Round 13 由来で本書範囲外）。

---

## §1 タスク N-1 FileHitl11Gate I/O 結果

### §1.1 partial 残の特定 — Round 14 完遂前の 2 ケース失敗

Round 14 Dev-E が着地した `file-hitl11-gate.ts` の Vitest スイートを Round 15 朝に dispatch 後、即座に走らせた所、以下 2 ケースが期待値と異なる結果（`partial_redact` を返却）を出していた:

```
× 2. resolves via file reject decision   expected 'reject' to be 'partial_redact'
× 16. decideViaFile directly resolves polling   expected 'reject' to be 'partial_redact'
```

両ケースとも「`decideViaFile(id, 'reject', { reject_reason: '...' })` で reject decision file を作る → polling loop が `decision.actions === undefined` を `applyReviewerActions` に渡す → 配列長 mismatch 判定で `autoEvaluate(drafts)` に fallback → PII 軽微 draft 単独で `partial_redact` を生成」という連鎖が原因。

### §1.2 修正 — 決定 file の `kind` を権威化

修正方針: polling loop が読み取る decision file には常に `kind` が付与済み（`decideViaFile` / `receiveWebhookDecision` 両方で書き込み確定）であるため、`actions` 未指定時はこの `kind` から default action 列を導出する.

```ts
// file-hitl11-gate.ts (修正後 polling loop の抜粋)
const effectiveActions = decision.actions
  ?? this.deriveDefaultActionsFromKind(decision.kind, args.drafts)
const result = applyReviewerActions({ drafts: args.drafts, reviewerActions: effectiveActions, ... })
```

新設 private method `deriveDefaultActionsFromKind`:
- `knowledge_pii_review_approve` → 全 entry `accept`
- `knowledge_pii_review_reject`  → 全 entry `discard`
- `knowledge_pii_review_partial` → PII なし `accept` / PII あり `redact_more`

これは `deriveActionsFromWebhook` と同等の logic を共有したいが、後者は `Hitl11WebhookPayload` を input に取るため重複定義としてシンプル化（pure helper）。

### §1.3 新設 — `Hitl11Quarantine` (296 行)

Round 14 Dev-E は decision evaluator まで着地、本 Round 15 で **物理 I/O 層** を新設して spec §3「PII 候補ファイルを Owner レビュー保留状態にする」要件を完遂:

| API | 役割 |
|---|---|
| `quarantineDraft(draft)` | redacted body を `<quarantineRoot>/<entryId>.md` に書き込み、`manifest.json` に `state=pending` で登録。kind = pattern/decision/pitfall に応じた entryId prefix（PAT/DEC/PIT）+ slug + timestamp |
| `approveEntry(entryId)` | quarantine body を `<knowledgeRoot>/{patterns|decisions|pitfalls}/<entryId>.md` に rename（cross-drive fallback で copy + unlink）、manifest state を `moved` に更新 + `knowledgePath` 記録 |
| `rejectEntry(entryId, { reason, redactionTags })` | body を `<quarantineRoot>/rejected/` に rename、`PII_REJECTED` tag を必ず先頭に追加、knowledge dir には絶対に書き込まない、`rejectReason` を manifest に記録 |
| `markPartialRedact(entryId, redactionTags)` | quarantine 維持、`state=partial_redact` + tags 更新（再 review 待機） |
| `listEntries()` / `getEntry(id)` | dashboard / test 用 read-only |

**zod manifest schema**:
```ts
ManifestSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(ManifestEntrySchema),  // entryId / kind / sourcePrj / piiHitCount / state / redactionTags? / rejectReason? / knowledgePath? / createdAt / updatedAt
})
```

破損 manifest はロード時に `safeParse` 失敗 → 空 manifest にフォールバック（audit でも検知可、resilient first-load）、書き込み時は必ず `ManifestSchema.parse()` で write-time guard（spec §5「PII 漏洩防止: 隔離前に出力しない」整合）。

### §1.4 N-1 テスト結果

| 種別 | 件数 | PASS / FAIL |
|---|---|---|
| 既存 `file-hitl11-gate.test.ts` | 18 | **18 / 0**（previously 16 / 2、reject 経路バグ修正で全 PASS 化） |
| 新設 `hitl-11-quarantine.test.ts` | 8 | **8 / 0** |
| 既存 `hitl-11-knowledge-pii.test.ts`（pure decision evaluator） | 11 | 11 / 0（無改変、regression 0） |

quarantine test 内訳:
1. quarantineDraft が redacted body を書き出し manifest 登録
2. 複数 entry 蓄積
3. approveEntry が knowledge subdir へ rename + state=moved
4. 不存在 entry で `not found` error
5. rejectEntry が `PII_REJECTED` tag を含む redaction tags を付与 + rejected/ へ移動 + state=rejected
6. moved 済 entry の reject 不可（`already-moved` error）
7. markPartialRedact で state=partial_redact + tags 更新
8. ManifestSchema が破損データを reject、`listEntries` は resilient（empty fallback）

---

## §2 タスク N-2 KE orchestrator wiring 結果

### §2.1 設計 — 上位 orchestrator として既存 wiring を再利用

Round 14 Dev-E が `ke-02-orchestrator-wiring.ts`（201 行 + 12 tests）として trigger / 分流 / Slack / IndexedKnowledge 変換まで実装済。本 Round では:

- 既存 wiring を **下位層** として再利用（無改変）
- **上位層 = `KeOrchestrator`** で物理 I/O（quarantine + 移動 + rejected 保管）を担当
- gate-11 decision provider は injection 可能（autoEvaluate を default、本格運用時は FileHitl11Gate.requestReview に差替）

### §2.2 連鎖フロー（spec §1「自動抽出経路を稼働可能化」要件）

```
案件完了 hook (ProjectCompletionEvent)
  → KE-02 trigger.planExtraction (KE-04 redact 適用済 drafts 生成)
  → 全 entry を Hitl11Quarantine.quarantineDraft で隔離 dir に書き込み
  → 分流:
      - PII なし draft → 即時 approveEntry → organization/knowledge/{kind}/<id>.md へ rename
      - PII あり draft → decideHitl11(drafts) を呼出 (default = autoEvaluate)
          → approve         → approveEntry → knowledge へ移動
          → reject          → rejectEntry  → rejected/ 維持 + redaction tag
          → partial_redact  → markPartialRedact → 隔離維持
          → escalate        → markPartialRedact (REDACT_MORE tag) で再 review 待機
  → Slack 通知 (best-effort, summary line)
```

**spec §3「実書き込みは gate-11 approve 後」要件** 整合: PII あり entry は decideHitl11 が `'approve'` を返さない限り `<knowledgeRoot>/` 配下には絶対に書かれない（rejectEntry / markPartialRedact / escalate どの分岐でも quarantine 維持）。

**spec §3「PII redaction の自動 1 段目（明示パターンマッチ）」要件** 整合: KE-02 trigger 内で必ず `redactPii` (KE-04, 10 detector pattern) が適用される（`bodyRedacted` のみ quarantine に書き込み、original PII は memory にも file にも残らない）。

### §2.3 N-2 テスト結果

| ケース | 検証 |
|---|---|
| 1 | shouldFire=false で全カウント 0 |
| 2 | clean drafts のみ → 自動 approve → patterns/ に 2 file |
| 3 | PII drafts + decideHitl11=approve → decisions/ に 1 file |
| 4 | PII drafts + decideHitl11=reject → quarantine/rejected/ に 1 file、knowledge は空 |
| 5 | PII drafts + decideHitl11=partial_redact → quarantine 直下維持、knowledge は空 |
| 6 | onSlackNotify 呼出 + decideHitl11 throw 時の onError 経路 |

**6/6 PASS**、既存 `ke-02-orchestrator-wiring.test.ts` 12/12 全 PASS 維持。

---

## §3 タスク N-3 P-UI-10 着地結果

### §3.1 spec 確認 — `dev-p-r15-...md` + `ceo-dec-019-033-consolidation.md` §149-152

Dev-P R15 報告 §1.2 表で P-UI-10 = penetration test 実施タイミング（W2 / W4）と確定、Review owner、Phase 2 持越予定。本 Round 15 第 3 波では「**Pen Test scheduling control の純関数 evaluator + YAML config**」として着地し、後続 Round で Review 部門が runner 部分を実装する前提の下地を提供。

### §3.2 実装 — `p-ui-10-pentest-scheduler.ts` (137 行)

純関数 evaluator 構成:

| API | 役割 |
|---|---|
| `computeSchedule(config, now)` | Phase 1 開始日（DEC-019-033 ⑪ 採択値 = 2026-05-10）から W2（+14d、5/24-5/31）/ W4（+28d、6/7-6/14）の window を算出、`nextWindow` も同時返却（now 以降の最初の window） |
| `evaluateStatus(input)` | `upcoming` / `active` / `missed` / `completed` の 4 状態判定（hasReportedResult flag と window 比較） |
| `formatStatusLine(kind, status, daysUntil)` | Slack / Dashboard 向け 1 行サマリ整形（4 状態それぞれ専用文言） |
| `isEscalationRequired(status)` | `missed` のみ true（Review 部門への 1 営業日内 escalation policy トリガー） |

副作用なし、Object.freeze 済の readonly 構造体を返却（dev.md 「I/O 配線は次 Round で分離」pattern 踏襲、Round 13 KE 系と同方針）。

### §3.3 YAML control config — `policies/p-ui-10-pentest.yaml`

declarative config を policies/ 配下に配置:
- `control_id: P-UI-10` / `owner: Review` / `phase_start_date: '2026-05-10'`
- 2 windows: W2 (+14d, 7d duration) / W4 (+28d, 7d duration)
- escalation policy: missed → 1 営業日内 Review 再計画 + CEO 通知、active 中 status 未報告 → Slack on-call notify + 24h 内必須
- `known_noise`: TLS handshake retry 15s / Supabase RLS cache 60s（false positive 抑制）

実行 evaluator が YAML を読み込む runner は Round 17 以降の Dev-Pentest 担当（本書範囲外、interface のみ提供）。

### §3.4 N-3 テスト結果

8 ケース、4 領域:

| 領域 | ケース | 検証 |
|---|---|---|
| computeSchedule | 1, 2, 3, 4, 5, 6 | +14d/+28d 正確配置 / invalid date error / nextWindow 推移 / W4 終了後 null / default 7d / カスタム 3d |
| evaluateStatus | 7 | upcoming → active → missed/completed の 4 状態網羅 |
| format + escalation | 8 | 4 状態整形 + missed のみ escalation true |

**8/8 PASS**。

---

## §4 既存テストへの影響

### §4.1 harness 全体テスト結果

```
Test Files  42 passed (42)
Tests       607 passed (607)
Duration    3.87s
```

**regression = 0**。修正対象は `file-hitl11-gate.ts` polling loop の 1 箇所（+24 行）のみで、それ以外は新設ファイル（4 件）。全既存テスト無改変で PASS。

### §4.2 修正前後の対比（FileHitl11Gate）

| 状態 | tests passed | tests failed |
|---|---|---|
| Round 15 第 3 波 dispatch 直後 | 16 / 18 | 2 (reject 経路 bug) |
| Round 15 第 3 波 N-1 修正後 | **18 / 18** | 0 |

### §4.3 TypeScript 型整合

新設 4 ファイル + 修正 1 ファイル、TS strict + any 禁止で `npx tsc --noEmit` PASS（grep でフィルタ確認: 該当 4 + 1 file のエラー 0）。

注: `ke-04-audit-wiring.ts` / `yaml-front-matter-parser.ts` に `readonly string[]` 不整合エラーが**既に存在**するが Round 13 Dev-J 由来で本書範囲外、本 Round では触れていない。

---

## §5 PII 保護の運用 note

本書実装は spec §「PII 保護: 隔離前に出力しない、テストフィクスチャは合成データ」要件を以下で satisfy:

### §5.1 隔離前 PII 漏洩防止経路

1. **KE-02 trigger 段階** で必ず `redactPii` (KE-04, 10 detector pattern) を通過 → `bodyRedacted` のみ KnowledgeDraft に保持、original PII は捨てられる
2. **Hitl11Quarantine.quarantineDraft** は `bodyRedacted` のみ書き込む（`formatBody` 内で frontmatter + redacted body を組み立て）
3. **manifest** は `piiHitCount`（数値）と `redactionTags`（categorical labels）のみ保持、PII 自体は保存しない
4. **rejectEntry** の `redactionTags` は必ず先頭に `PII_REJECTED` を付与 → 再 review / audit 時に視覚的識別可能
5. **knowledge dir 書き込みは approve 経由のみ** — rejectEntry / markPartialRedact / escalate 経路では絶対に knowledgeRoot へ書き込まない（テスト 2-4 / 2-5 で検証済）

### §5.2 テストフィクスチャの合成データ確認

- `hitl-11-quarantine.test.ts`: 全 draft の bodyRedacted は `<EMAIL>` placeholder のみ含む合成テキスト、実 email / 電話 / API key 0
- `ke-orchestrator.test.ts`: PII hint snippet は `owner@example.com`（example.com = RFC-2606 reserved domain）のみ
- 既存 `hitl-11-knowledge-pii.test.ts` (Round 13 Dev-J): `<EMAIL>` / `<ANTHROPIC_KEY>` placeholder のみ

→ 本書範囲のテストフィクスチャに**実 PII / 顧客情報 / API キー 0**、CI 実行 / artifact 配布で漏洩リスク 0。

### §5.3 HITL-11 Owner レビュー経路（spec §1）

- **manual review path**: FileHitl11Gate.requestReview → polling / webhook で Owner approve/reject → KeOrchestrator.decideHitl11 に provider として注入
- **auto path (default)**: autoEvaluate（PII hit count 閾値ベース、5 で escalate / 20 で reject）
- 本格運用切替時は `decideHitl11: async (drafts) => (await fileGate.requestReview({ drafts, target_file, prjId })).result.decision` の 1 行差替で済む（interface 整合済み）

---

## §6 リスク / 残課題

### §6.1 短期残課題（Round 16-17 引継）

| # | 項目 | 推奨担当 | 期限目安 |
|---|---|---|---|
| 1 | KeOrchestrator + FileHitl11Gate の **本格 wiring**（autoEvaluate → FileHitl11Gate.requestReview 切替）と Slack quick-action endpoint への結線 | Round 16 Dev-Q | 5/15 W1-day6 |
| 2 | quarantine root と knowledge root の **本番 path 確定**（home dir 配下: `~/.clawbridge/quarantine/hitl11` / repo 内: `organization/knowledge/`）+ env 変数化 | Round 16 Dev-Q | 5/15 |
| 3 | P-UI-10 YAML config の **runner**（cron 形式で `evaluateStatus` を呼出 + missed → Slack escalation を実発火）| Round 17 Dev-Pentest | 5/22 |
| 4 | manifest schema v2 への migration 路（`schemaVersion: 1` → `2` で `redactionAuditChain` 追加検討、ODR-OG-06 確定後）| Round 18+ Review | Phase 1 W4 |

### §6.2 リスク

| リスク ID | 内容 | mitigation |
|---|---|---|
| R-N-01 | quarantine dir のディスク占有率上昇（reject 蓄積）| Round 17 で 90 日 retention + audit log archive 追加 |
| R-N-02 | manifest.json への concurrent write race（複数 KE orchestrator 並行起動）| 現状 atomic write (saveJson tmp+rename) で 1-process は安全、複数 process は本番化前に file lock 必要 |
| R-N-03 | gate-11 default `autoEvaluate` が PII threshold 5/20 で機械判定 → false positive で誤 reject 可能性 | 本格運用切替時は FileHitl11Gate 経由 manual review を default とし、autoEvaluate は SLA timeout 時のみ fallback（本書 §5.3 の差替 1 行で実現） |
| R-N-04 | P-UI-10 W2/W4 window が祝日 / Owner 不在と重なる | escalation policy (1 営業日内再計画) で吸収、windowDurationDays 拡張で確実性向上可能 |

### §6.3 制約遵守確認

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 | 達成（全実装 in-memory + local file I/O のみ、外部 API call 0）|
| 絵文字不使用 | 達成（本書全文 + 新設 4 ファイル + YAML config 全絵文字 0）|
| アプリ実体 = `projects/PRJ-019/app/` 配下 | 達成（4 ファイル全て harness/src/ または policies/ 配下）|
| TS strict / any 禁止 | 達成（`any` キーワード 0、`unknown` を ManifestSchema parse 入力で 1 回のみ使用）|
| PII 漏洩防止 | 達成（§5.1 5 段の防護 + §5.2 合成データのみ）|
| 並列 R15 他 Agent と file conflict 禁止 | 達成（修正は file-hitl11-gate.ts のみ、他 Round 15 Dev-K/L/M との overlap 0、確認済）|
| dev.md 役割整合 | 達成（実装方針 + テスト + 工数見積 + 実装着地、設計 / I/O / docs 全カバー）|

---

## §7 Footer

- **発行**: 2026-05-05 / Round 15 第 3 波 / Dev-N
- **担当**: Dev 部門 R15 Dev-N（Round 14 partial 残作業 3 件、general-purpose Agent dispatch 経由独立稼働、DEC-019-025 SOP 準拠）
- **行数**: 約 320 行
- **絵文字**: 不使用
- **新設ファイル**:
  - `projects/PRJ-019/app/harness/src/knowledge/hitl-11-quarantine.ts` (296 行)
  - `projects/PRJ-019/app/harness/src/knowledge/ke-orchestrator.ts` (209 行)
  - `projects/PRJ-019/app/harness/src/p-ui-10-pentest-scheduler.ts` (137 行)
  - `projects/PRJ-019/app/policies/p-ui-10-pentest.yaml` (35 行)
  - `projects/PRJ-019/app/harness/src/__tests__/knowledge/hitl-11-quarantine.test.ts` (155 行 / 8 ケース)
  - `projects/PRJ-019/app/harness/src/__tests__/knowledge/ke-orchestrator.test.ts` (167 行 / 6 ケース)
  - `projects/PRJ-019/app/harness/src/__tests__/p-ui-10-pentest-scheduler.test.ts` (113 行 / 8 ケース)
- **修正ファイル**:
  - `projects/PRJ-019/app/harness/src/hitl/file-hitl11-gate.ts` (+24 行、polling loop kind 権威化 + private `deriveDefaultActionsFromKind`)
- **テスト合計**: 22 件新規 PASS、harness 全 607 件 PASS、regression 0
- **連動**: DEC-019-033 ⑪ / DEC-019-018 / DEC-019-062 / Round 13 Dev-J KE 系 + Round 14 Dev-E HITL-11 evaluator + Round 15 Dev-P 軸-A 加速 path
- **DoD 完遂**:
  1. FileHitl11Gate I/O — 既存 18 tests 全 PASS 化 + 隔離 / approve / reject / partial の物理 I/O 層を `Hitl11Quarantine` で新設、zod manifest schema 検証、Vitest 8 ケース PASS（§1 + §5.1）
  2. KE orchestrator wiring — case 完了 hook → KE → quarantine → gate-11 → 知識 dir 分配の上位 orchestrator を `ke-orchestrator.ts` で新設、PII 自動 1 段目 redaction = KE-04 redactPii 経由、Vitest 6 ケース PASS（§2）
  3. P-UI-10 着地 — Pen Test scheduling control の純関数 evaluator + YAML config + 8 ケース PASS（§3）
  4. PII 保護運用 note 明文化（§5、5 段防護 + 合成データ）

---

**Sign-off**: 2026-05-05 / Round 15 第 3 波 / Dev R15 Dev-N
**次回**: Round 16 で本書 N-1/N-2 の本格 wiring 切替（autoEvaluate → FileHitl11Gate.requestReview）+ Round 17 で P-UI-10 runner 着地（YAML config → cron evaluator → Slack escalation）
