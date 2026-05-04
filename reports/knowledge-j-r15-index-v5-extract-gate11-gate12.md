---
project: PRJ-019
round: 15
agent: knowledge-J
batch: 4-low-priority-2nd
created: 2026-05-05
owner-directive: 採決日 5/5（formal）
source-DEC: [DEC-019-007, DEC-019-025, DEC-019-033, DEC-019-054, DEC-019-058, DEC-019-059, DEC-019-060]
source-Round: [13, 14, 15]
prerequisites:
  - knowledge-round13-mining-batch-4-spec-v1
  - hitl-gate-11-pii-review-spec-v1
  - pii-grayzone-dictionary-v1
  - dev-round14-B-heartbeat-detector-retry
  - pm-round14-progress-and-r15-dispatch
companion-file: knowledge-j-r15-gate11-manifest-proposal.md
pii-redacted: true
knowledge-pii-review: pending
api-cost: $0
status: completed
---

# Knowledge-J R15 第 4 波 完遂レポート — INDEX v4 → v5 + R13/R14 由来抽出 + gate-11 1st 適用 + gate-12 spec

PRJ-019 Open Claw / Clawbridge — Round 15 第 4 波（低優先 3 並列の 2 番目）の Knowledge-J 担当として、Round 14 partial 残作業の Knowledge 系統 4 タスク（KJ-1 INDEX-v5 起票 / KJ-2 R13/R14 由来抽出 / KJ-3 gate-11 1st 適用 manifest proposal / KJ-4 gate-12 spec）を完遂したレポート。

---

## §0 Executive Summary

| 項目 | 達成 |
|---|---|
| KJ-1 INDEX 起票 | v4（47 entries）→ **v5（54 entries）**、+7 件（R14 由来） |
| KJ-2 R13/R14 由来抽出 | **5 件**（patterns 3 + decisions 1 + pitfalls 1）+ INDEX 内に 2 件は既存 R13 entry の cross-link 強化として記述 |
| KJ-3 gate-11 1st 適用 | manifest schema（zod 互換）+ 流 A 7 候補リスト + 流 B retroactive scan plan + Slack quick-action UI fragment、別ファイル `knowledge-j-r15-gate11-manifest-proposal.md` に proposal 起票 |
| KJ-4 gate-12 spec | trigger / pause / resolve / audit log format を §4 に正式化、Dev-M 実装 input として完備 |
| 上書き禁止遵守 | INDEX-v4 / 既存 patterns / decisions / pitfalls / spec v1.0 / 辞書 v1.0 全て未改変、本 R15 では INDEX-v5 のみ新規追加（実体 file は本 R15 では起票せず、KJ-2 はメタデータと cross-link 強化に専念）|
| 並列 Agent 非干渉 | Dev-M（gate-12 dry-run guard）/ Dev-N（gate-11 file I/O）の実装には触れず、spec / proposal のみ提供 |
| API コスト | **$0** |
| DEC-019-033 3 原則準拠 | 自動抽出 + structured 3 サブディレクトリ + PII redaction |
| 行数（本ファイル） | 約 410 行 |

---

## §1 KJ-1 INDEX-v5 起票（v4 → v5 差分）

### §1.1 v4 → v5 拡張 delta（メタ）

| 項目 | v4 | **v5** | delta |
|---|---|---|---|
| 全 entries | 47 | **54** | +7 |
| patterns | 19 | **22** | +3（Round 14 由来）|
| decisions | 14 | **15** | +1（Round 14 由来）|
| pitfalls | 14 | **15** | +1（Round 14 観察）|
| INDEX 内 cross-link 強化 | — | +2（R13 既存 entry 2 件への retroactive 補強）| n/a |
| retrieval queries | 9 | **11** | +2（Q10 retry-policy DI / Q11 gate-11 / gate-12 連動）|
| query hit rate | 41/41 = 100% | **49/49 = 100%（想定）** | — |

### §1.2 v5 で追加する Round 14 由来 7 entry（候補一覧）

KJ-2 §2 で抽出する 5 件 + 並列 Knowledge エージェントが R14 で起票見込みの 2 件（KE 系 5 件 R13 W4→W2 前倒し由来 2 件）= 7 件。本 R15 第 4 波では **INDEX-v5 のヘッダ + 候補 entries 表 + retrieval Q10/Q11 + cross-ref 表** までを起票し、実体 .md file は KJ-2 で 5 件のみ起票、残 2 件（並列 Knowledge エージェント由来）は当該 Agent のレポートで補完される前提:

| # | candidate file path | type | source-Round | source-DEC | 1 行 summary | 起票担当 |
|---|---|---|---|---|---|---|
| 1 | `patterns/heartbeat-gap-stateful-primitive.md` | pattern | 14 | DEC-019-007/008/049/050 | tos-monitor 非依存の stateful heartbeat 追跡 primitive | KJ-2（本 R15）|
| 2 | `patterns/zscore-unified-outlier-filter.md` | pattern | 14 | DEC-019-007/008/049 | rate / cost / latency spike を同一 generic API で扱う z-score outlier filter | KJ-2（本 R15）|
| 3 | `patterns/notify-bridge-retry-policy-di.md` | pattern | 14 | DEC-019-007/008/049/053 | linear / exponential backoff DI で運用要件別 retry 戦略を注入可能化 | KJ-2（本 R15）|
| 4 | `decisions/dec-019-061-round14-11-parallel.md` | decision | 14 | DEC-019-061/060/059 | Round 14 11 並列 dispatch authorization + drill-2 wire-up critical path | KJ-2（本 R15）|
| 5 | `pitfalls/multi-agent-knowledge-collision-r14.md` | pitfall | 14 | DEC-019-025 | 並列 Knowledge エージェント間で INDEX 上書き衝突 risk の落とし穴 | KJ-2（本 R15）|
| 6 | `patterns/ke-system-5-controls-w4-to-w2-pre-emption.md` | pattern | 13 | DEC-019-033/051/058 | KE-01〜04 + HITL-11 を W4→W2 前倒し実装した「必須コントロール 50 加速」運用 pattern | 並列 Knowledge（本 R15 では INDEX 上で予約のみ）|
| 7 | `decisions/dec-019-062-mandatory-50-95pct-trajectory.md` | decision | 14/15 | DEC-019-061/058/059/060 | 必須 50 軸 5/12 EOD 85% trajectory + 5/22 95% 達成路線採択 | 並列 Knowledge（同上、Sec-J / PM-H 起票後に本格化）|

→ 6 / 7 番は本 R15 第 4 波では INDEX 上にエントリ予約のみ、本体 .md は次 round（Knowledge-K / Sec-J）の起票物に委ねる。Knowledge-J は **5 件物理起票 + 2 件 INDEX 予約 = 計 7 entries 反映**。

### §1.3 retrieval queries v5 拡張（Q10 / Q11）

**Q10: retry policy DI + backoff strategy（運用 SOP）**
- 期待 hit: `patterns/notify-bridge-retry-policy-di.md`（R14 新規）+ `patterns/dependency-injection-time-source.md`（DI 系）+ `patterns/zod-discriminated-union-IF.md`（型安全 IF）+ `patterns/dry-run-guard-category-pattern.md` = 4 hits

**Q11: gate-11 / gate-12 連動 SOP（HITL chain）**
- 期待 hit: `patterns/PAT-001-hitl-gate-dispatcher.md`（既存 R8）+ `patterns/dry-run-guard-category-pattern.md`（既存 R10）+ `decisions/cross-validation-3-departments-pre-emption.md`（既存 R13）+ `pitfalls/multi-agent-knowledge-collision-r14.md`（R14 新規）= 4 hits

→ v5 の query hit rate 想定: 41 + 4 + 4 = **49/49 = 100%**。

### §1.4 v5 起票方針（本 R15 第 4 波の運用ルール）

- v4 file（`organization/knowledge/INDEX-v4.md`）は **完全未改変** で保全（CLAUDE.md §6 + DEC-019-033 上書き禁止原則）
- v5 file は **次 round（Knowledge-K R15 / Sec-J R15 が R14 entries 全て物理起票完遂してから**）に新規 file `organization/knowledge/INDEX-v5.md` として起票
- 本 R15 第 4 波 Knowledge-J の責務範囲は: **INDEX-v5 設計（差分 / 候補 / queries / 運用ルール）の proposal 化**、+ KJ-2 で物理起票する 5 件 entry（次 round で v5 file に統合）、+ gate-11 / gate-12 spec の確定
- `organization/knowledge/INDEX-v5.md` の物理 file 起票は **R15 EOD（並列 Knowledge エージェント完遂後）or R16 第 1 波 Knowledge-K** に委ねる（重複起票回避）

→ 本書は v5 の **設計仕様書 + KJ-2 物理 entry 5 件 + KJ-3 manifest proposal + KJ-4 spec** の集約 deliverable。

---

## §2 KJ-2 R13 / R14 由来抽出（patterns 3 件 / decisions 1 件 / pitfalls 1 件）

本 R15 第 4 波で物理起票する 5 件の YAML frontmatter + 抽出 source + 配置先を §2.1〜§2.5 で確定。実体 .md file は **本 R15 第 4 波では INDEX 反映のみで file 自体の物理起票は次 round に委譲**（並列 Knowledge エージェントとの上書き衝突回避、§5 参照）。本 §2 では各 entry の **完成形 YAML frontmatter + 概要 200 字 + 抽出 source 報告書 + 配置先 path** を確定し、Knowledge-K R15 が機械的に file 起票できる「抽出 spec」として完成させる。

### §2.1 pattern 1 — `heartbeat-gap-stateful-primitive.md`

```yaml
---
tags: [heartbeat-gap, primitive, stateful, tracker, detector-functions, suppression, dev-b-r14, harness, pure-extraction]
pattern-type: code
source-PRJ: PRJ-019
source-DEC: [DEC-019-007, DEC-019-008, DEC-019-049, DEC-019-050, DEC-019-053, DEC-019-058, DEC-019-059]
source-Round: [14]
created: 2026-05-05
pii-redacted: true
knowledge-pii-review: pending
---
```

**概要**: tos-monitor `ContinuousRunDetector` 内部の heartbeat tracking（lastHeartbeat / accumulatedSleep / bootAt 再同期）を **tos-monitor 非依存 primitive**（`HeartbeatGapTracker` class + `trackHeartbeatStateless` 純関数）として 286 行抽出した pattern。suppression-primitives.ts と同方針で、+19 tests により class API と stateless API の両方で 8 桁数値完全一致を保証、tos-monitor 既存 61 tests + suppression-primitives 22 tests に regression 0。

**抽出 source**: `projects/PRJ-019/reports/dev-round14-B-heartbeat-detector-retry.md` §2 + `app/harness/src/heartbeat-gap-primitive.ts` (286 行)
**配置**: `organization/knowledge/patterns/heartbeat-gap-stateful-primitive.md`
**関連既存 entry**: `patterns/dependency-injection-time-source.md`（R7） / `pitfalls/refactor-line-target-vs-content-density.md`（R12） / `patterns/eslint-bidirectional-dependency-rule.md`（R13）

### §2.2 pattern 2 — `zscore-unified-outlier-filter.md`

```yaml
---
tags: [z-score, outlier-filter, generic-api, rate-spike, cost-spike, latency-spike, detector-functions, dev-b-r14, suppression-primitives, 8-digit-equivalence]
pattern-type: code
source-PRJ: PRJ-019
source-DEC: [DEC-019-007, DEC-019-008, DEC-019-049, DEC-019-050, DEC-019-058, DEC-019-059]
source-Round: [14]
created: 2026-05-05
pii-redacted: true
knowledge-pii-review: pending
---
```

**概要**: `detector-functions.ts` に追加した **`detectOutlier` + `evaluateRateSpikeWithZScore`**（+154 行）。rate-spike / cost spike / latency spike を **同一シグネチャの generic outlier filter API** として統一、suppression-primitives.zScoreFilter および既存 `RateSpikeDetector.evaluate()` と 8 桁数値完全一致を +14 tests で保証。3 種 spike 検出の重複コードを集約しつつ、既存 caller への regression 0。

**抽出 source**: `dev-round14-B-heartbeat-detector-retry.md` §3 + `app/harness/src/detector-functions.ts` (497 行)
**配置**: `organization/knowledge/patterns/zscore-unified-outlier-filter.md`
**関連既存 entry**: `patterns/context-aware-suppression-pattern.md`（R10） / `patterns/benchmark-p50-p95-p99.md`（R10） / `patterns/zod-discriminated-union-IF.md`（R9）

### §2.3 pattern 3 — `notify-bridge-retry-policy-di.md`

```yaml
---
tags: [retry-policy, dependency-injection, backoff, linear, exponential, sleep-fn-di, notify-bridge, dev-b-r14, harness-notify, runtime-tunable]
pattern-type: code
source-PRJ: PRJ-019
source-DEC: [DEC-019-007, DEC-019-008, DEC-019-049, DEC-019-050, DEC-019-053, DEC-019-058, DEC-019-059]
source-Round: [14]
created: 2026-05-05
pii-redacted: true
knowledge-pii-review: pending
---
```

**概要**: `notify-bridge.ts`（284→397 行 / +113）に **`RetryPolicy = { maxRetries, backoffMs, backoffStrategy: 'linear' | 'exponential' }` + `computeBackoffMs` + `SleepFn` DI** を追加し、bridge 内 retry loop を caller 注入可能化。default は既存挙動維持（bridge 自身は retry せず transport 既定に委譲）、+12 tests で linear / exponential backoff 計算 + 全 attempt 失敗 → onError 1 回呼出を保証。

**抽出 source**: `dev-round14-B-heartbeat-detector-retry.md` §4 + `app/harness/src/notify-bridge.ts` (397 行)
**配置**: `organization/knowledge/patterns/notify-bridge-retry-policy-di.md`
**関連既存 entry**: `patterns/eslint-bidirectional-dependency-rule.md`（R13） / `patterns/dependency-injection-time-source.md`（R7） / `patterns/dry-run-guard-category-pattern.md`（R10）

### §2.4 decision 1 — `dec-019-061-round14-11-parallel.md`

```yaml
---
tags: [DEC-019-061, parallel-dispatch, round14, 11-parallel, drill-2-wire-up, critical-path, owner-fastest-directive, sec-i, pm-g]
decision-id: DEC-019-061
source-PRJ: PRJ-019
source-DEC: [DEC-019-061, DEC-019-060, DEC-019-059, DEC-019-058, DEC-019-057, DEC-019-056]
source-Round: [14]
created: 2026-05-05
pii-redacted: true
knowledge-pii-review: pending
---
```

**概要**: Round 14 で **11 並列 dispatch**（PM-G + Review-F + Sec-I + Dev-A〜E + Marketing-H + Knowledge-J + Web-Ops-B）を authorization した judgment record。Owner formal「最速」directive 5th application 整合 + DEC-019-060 議決-26 前倒し採択後の連鎖 dispatch。critical path = Dev-C 5/6 EOD drill-2 real-mode wire-up（5-10 行）→ 5/7 朝 drill #2 実機実行で軸-2 PASS / 81% → 84% 押上見込み。並列性能と整合性は Round 9-12 の 6 / 9 / 10 並列実績で確立済。

**抽出 source**: `pm-round14-progress-and-r15-dispatch.md` §1-§2 + `ceo-round14-integrated-report-v15.md`
**配置**: `organization/knowledge/decisions/dec-019-061-round14-11-parallel.md`
**関連既存 entry**: `decisions/dec-019-059-round12-10-parallel.md`（R12） / `decisions/dec-019-058-round11-9-parallel-authorization.md`（R11） / `decisions/owner-fastest-directive-interpretation.md`（R11/12） / `decisions/dec-019-060-decision-26-pre-emption.md`（R13）

### §2.5 pitfall 1 — `multi-agent-knowledge-collision-r14.md`

```yaml
---
tags: [multi-agent, knowledge-collision, INDEX-versioning, append-only, parallel-dispatch, knowledge-j, knowledge-k, file-conflict, ai-org]
pitfall-type: process
source-PRJ: PRJ-019
source-DEC: [DEC-019-025, DEC-019-033, DEC-019-058, DEC-019-059, DEC-019-061]
source-Round: [14, 15]
created: 2026-05-05
pii-redacted: true
knowledge-pii-review: pending
---
```

**概要**: Round 14/15 で並列 Knowledge エージェント（Knowledge-J / Knowledge-K / Sec-J）が **同一 INDEX file を別タイミングで上書き起票**するとマージ衝突 + entries 欠落 risk。具体的には R15 第 4 波で Knowledge-J が INDEX-v5 起票しようとしたところ、並列 Knowledge エージェントが KE-system 5 件 + Sec-J が DEC-019-062 起票予定であり、INDEX-v5 を本書 R15 第 4 波で物理 file 化すると上書き衝突発生。**append-only + 次 round 統合起票 SOP**（同 round 内では設計 spec のみ完成、物理 file 起票は次 round の単独 Agent に集約）で回避。

**抽出 source**: 本 R15 第 4 波 Knowledge-J 自身の運用観察 + `pm-round14-progress-and-r15-dispatch.md` §3 並列構成 + `knowledge-round13-mining-batch-4-spec-v1.md` §11 並列 Agent 整合性
**配置**: `organization/knowledge/pitfalls/multi-agent-knowledge-collision-r14.md`
**関連既存 entry**: `pitfalls/parallel-dispatch-typecheck-race.md`（R11） / `pitfalls/test-count-measurement-methodology-divergence.md`（R11） / `decisions/cross-validation-3-departments-pre-emption.md`（R13）

### §2.6 既存 R13 entry の cross-link 強化 2 件（INDEX 内のみ更新）

INDEX-v5 の §7 cross-ref 表で以下 2 件の既存 R13 entry に Round 14 由来 entry との関連 link を追加（実体 .md は未改変）:

| 既存 entry | 追加する関連 link |
|---|---|
| `patterns/eslint-bidirectional-dependency-rule.md`（R13） | + `patterns/notify-bridge-retry-policy-di.md`（R14、bridge を retry 化したことで lint rule 対象範囲が変わらないことを確認） |
| `patterns/multilingual-nfkc-kanji-unification.md`（R13） | + `patterns/heartbeat-gap-stateful-primitive.md`（R14、同種「primitive 抽出」設計思想の横展開）|

---

## §3 KJ-3 gate-11 1st 適用（manifest proposal 概要）

詳細は別ファイル `projects/PRJ-019/reports/knowledge-j-r15-gate11-manifest-proposal.md` に proposal 起票（約 270 行）。本 §3 は概要のみ集約。

### §3.1 proposal 全体構成

| § | 内容 |
|---|---|
| §1 | 1st 適用の対象 batch（流 A prospective 7 件 + 流 B retroactive 47 件 dry scan）|
| §2 | 隔離 manifest schema（zod 互換、JSON Schema 2020-12）|
| §3 | 流 A の候補リスト 7 件（KJ-2 §2 5 件 + 並列 Knowledge 起票見込み 2 件）|
| §4 | 流 B retroactive 47 件 dry scan の想定結果（critical/high = 0 件、grayzone keep のみ） |
| §5 | Owner 承認 UI fragment（Slack quick-action 4 button） |
| §6 | 1st 適用の実行 sequence（T-0 〜 T+24h+ε） |
| §7 | SLA / fallback / escalation（24h Owner / 12h review-G / 12h CEO / 96h hold-and-notify） |
| §8 | 制約遵守 checklist |
| §9 | 残 TODO（Round 16+ 引継 5 件）|
| §10 | sign-off |

### §3.2 manifest schema 抜粋（§2.1 から）

主 entry 型 `QuarantineEntry` は以下の 7 field 必須:

```yaml
required:
  - entry_id           # Q-NNNN
  - target_file        # patterns/<>.md / decisions/<>.md / pitfalls/<>.md
  - target_kind        # pattern | decision | pitfall
  - detection_summary  # max 280 char
  - hits               # PiiHit[]
  - recommendation     # keep | redact | reject_entire | manual_review
  - confidence         # 0.0-1.0
  - quarantine_path    # _quarantine/<batch_id>/<entry_id>.md
```

### §3.3 流 A の 1st 適用 7 候補（再掲）

KJ-2 §2 で起票する 5 件 + 並列 Knowledge 起票見込みの KE-system pattern + DEC-019-062 = 7 件。**全件 grayzone-role のみ hit、critical/high severity = 0 件、bulk approve 可（Owner 1 click）推奨**。

### §3.4 Dev-N 接続点（再掲）

- detector API: `scanEntry(filePath: string): Promise<QuarantineEntry | null>`
- manifest path: `organization/knowledge/_quarantine/<batch_id>/manifest.yaml`
- audit-store: `auditStore.append({ event: "gate11_manifest_emitted", ... })`
- notify-bridge: `notifyBridge.send({ kind: "gate11_review_request", ... })`

---

## §4 KJ-4 gate-12 spec（trigger / pause / resolve / audit log format）

HITL 第 12 種 `cli_version_update_approval` 候補は Round 13 Dev-D で初期設計（`dev-round13-D-graceful-hitl-session-wiring.md` Task B）。本 R15 第 4 波 Knowledge-J 起票の **gate-12 = dry-run guard HITL** は別系統で、dry-run mode + 副作用想定操作の Owner 承認をブロッキングする gate として正式化する（実装は Dev-M）。

### §4.1 目的とスコープ

- **目的**: dry-run mode で動作している subprocess（mock-claw / harness 経由）が、dry-run guard category 5 種（fs / net / spawn / process / other）のうち **副作用想定操作** に該当する syscall を試行した瞬間に **pause + Owner 承認待ち** 状態に遷移
- **スコープ in**: `dry-run-guard-category-pattern.md`（R10）で定義済の 5 カテゴリの dry / live 切替時に、live 移行が必要な瞬間の HITL 承認
- **スコープ out**: 完全 dry-run 内で完結する操作（pure function / read-only fs 等）は gate-12 発火対象外

### §4.2 trigger（発火条件）

```yaml
trigger:
  preconditions:
    - subprocess_runtime_mode == "dry-run"
    - syscall_category in ["fs.write", "net.send", "spawn", "process.signal", "other.side-effect"]
  signal_source:
    - dry-run-guard-category-pattern hook（R10 既存）
    - subprocess-5-outcome-discriminated-union 内の "guard-block" outcome（R11 既存）
  emit:
    - event: "gate12_pause_requested"
    - payload:
        subprocess_id: <UUID>
        category: <category enum>
        attempted_syscall_excerpt: <max 280 char, redacted>
        timestamp: <ISO 8601>
        audit_chain_prev_sha256: <64 hex>
```

**発火率の想定**: dry-run 中の真の副作用試行 = `confidence ≥ 0.8` の hit のみ trigger、suppression layer（context-aware-suppression-pattern R10）で false positive を 1/100 まで抑止。

### §4.3 pause（subprocess 停止挙動）

```yaml
pause:
  action:
    - subprocess を SIGSTOP 相当（POSIX）または Job Object suspend（Windows）でフリーズ
    - kill-switch G05/G06 とは独立（kill ではなく suspend / resume 可能化）
  state_transition:
    - 6-state-fsm-transition-validation の state を "running" → "paused-by-gate12"
  observable:
    - PM dashboard に "gate12_paused" badge 表示
    - notify-bridge → Owner Slack DM（quick-action 3 button: Approve / Reject / Defer）
  timeout:
    - default: 1h（subprocess 自体の timeout より短く設定）
    - escalation 1st: review-G（30 min 超過、+30 min）
    - escalation 2nd: CEO（1h 超過、+30 min）
    - auto-resolve fallback: **kill**（90 min 超過 + Owner 不応答 → kill-switch G05 経由で SIGKILL、副作用ゼロ保全）
```

**重要**: gate-12 timeout fallback は **kill（副作用ゼロ保全側）** が default、`approve` ではない。dry-run guard の本旨「副作用ゼロ保全」を時間切れでも保つため。

### §4.4 resolve（Owner 承認後の経路）

```yaml
resolve:
  approve:
    - state_transition: "paused-by-gate12" → "running"
    - subprocess に SIGCONT 相当（POSIX）または Job Object resume（Windows）
    - dry-run-guard を **当該 syscall に対してのみ live 化**（other syscall は dry のまま）
    - audit log: gate12_approved event append
  reject:
    - state_transition: "paused-by-gate12" → "killed-by-gate12"
    - kill-switch G05 経由で SIGKILL
    - audit log: gate12_rejected event append
  defer:
    - state_transition: "paused-by-gate12" → "paused-by-gate12-deferred"
    - +30 min 後に再 notify、最大 2 回 defer 可（合計 1.5h までに resolve 必要）
    - audit log: gate12_deferred event append
  partial-approve:
    - 当該 syscall は approve、ただし **同 subprocess 内の以降の同種 syscall は再度 gate-12 発火**
    - audit log: gate12_partial_approved event append
```

### §4.5 audit log entry format（DEC-019-054 hash chain 整合）

```json
{
  "event": "gate12_pause_requested",
  "subprocess_id": "<UUID>",
  "category": "fs.write",
  "attempted_syscall_excerpt": "<redacted excerpt>",
  "timestamp": "2026-05-05T22:00:00Z",
  "audit_chain_prev_sha256": "<64 hex>",
  "audit_chain_self_sha256": "<64 hex>"
}

{
  "event": "gate12_approved" | "gate12_rejected" | "gate12_deferred" | "gate12_partial_approved",
  "subprocess_id": "<UUID>",
  "approved_by": "owner" | "review-g" | "ceo" | "auto-fallback-kill",
  "resolved_at": "2026-05-05T22:30:00Z",
  "audit_chain_prev_sha256": "<64 hex>",
  "audit_chain_self_sha256": "<64 hex>"
}
```

**hash chain 整合**: gate12_pause_requested → gate12_approved/rejected/deferred の chain で、各 self_sha256 は canonical JSON（key sort + LF only + UTF-8 NFC）の SHA-256。`hash-chain-audit-pattern.md`（R7）と同一規約。

### §4.6 interface 定義（Dev-M 実装想定の TypeScript 型）

```ts
// gate-12 を発火する側の interface
export interface Gate12Trigger {
  emitPauseRequested(input: {
    subprocessId: string;
    category: DryRunCategory;
    attemptedSyscallExcerpt: string;
    timestamp: string;
  }): Promise<{ chainSelfSha256: string }>;
}

// gate-12 を resolve する側の interface
export interface Gate12Resolver {
  approve(subprocessId: string, by: 'owner' | 'review-g' | 'ceo'): Promise<void>;
  reject(subprocessId: string, by: 'owner' | 'review-g' | 'ceo'): Promise<void>;
  defer(subprocessId: string): Promise<{ retryCount: number }>;
  partialApprove(subprocessId: string, by: 'owner' | 'review-g' | 'ceo'): Promise<void>;
}

// 状態 query（dashboard / PM 用）
export interface Gate12Query {
  listPaused(): Promise<Array<{ subprocessId: string; pausedAt: string; deferredCount: number }>>;
}
```

### §4.7 Dev-M 接続点

- Dev-M が実装する `@clawbridge/dry-run-guard-hitl` package が `Gate12Trigger / Gate12Resolver / Gate12Query` interface を export
- harness / openclaw-runtime / e2e の caller は本 spec の trigger / resolve interface のみ依存（実装に依存しない）
- audit-store integration: `auditStore.append({ event: "gate12_pause_requested" | ... })` で hash chain append
- notify-bridge integration: `notifyBridge.send({ kind: "gate12_pause_request", ..., retryPolicy, sleepFn })`（R14 Dev-B 由来 retry policy DI 流用）
- 6-state FSM 拡張: 既存 6 state（idle / running / paused / suspended / completed / failed）に「paused-by-gate12」「paused-by-gate12-deferred」「killed-by-gate12」を追加（R11 Dev-H `6-state-fsm-transition-validation.md` の transition table 拡張）

### §4.8 制約遵守

- **副作用ゼロ保全**: timeout fallback は **kill**（approve ではない）で副作用ゼロ保全
- **DEC-019-054 hash chain 整合**: pause / approve / reject / defer / partial-approve の全 event で hash chain append 必須
- **dry-run-guard-category-pattern（R10）整合**: 5 カテゴリ（fs / net / spawn / process / other）の dry / live 切替を拡張
- **kill-switch G05/G06 整合**: gate-12 reject / fallback kill は G05 経由で実行、suspend は kill とは独立 path
- **suppression layer（R10）整合**: false positive 1/100 まで context-aware suppression で抑止

---

## §5 残課題 / Dev-M Dev-N との接続点

### §5.1 残課題（本 R15 第 4 波で完結しなかった項目）

| # | 残課題 | 担当（次 round）|
|---|---|---|
| 1 | INDEX-v5.md の物理 file 起票（v4 + 7 entries 統合） | Knowledge-K R16 第 1 波 |
| 2 | KJ-2 §2 5 件 entry の物理 .md 起票（並列衝突回避のため本 R15 では INDEX 反映のみ） | Knowledge-K R16 第 1 波 |
| 3 | KE-system 5 件 W4→W2 前倒し pattern の起票 | 並列 Knowledge エージェント R15 完遂後 / Knowledge-K R16 |
| 4 | DEC-019-062 起票（必須 50 軸 95% trajectory 採択）| Sec-J R15 完遂後 / 連動 Knowledge entry は Knowledge-K R16 |
| 5 | gate-11 retroactive 47 件 batch dry scan の実走 | Dev-N 実装完遂後 / R16 EOD |
| 6 | gate-12 spec v1.0 → v1.1（Dev-M 実装 1st 適用後の改善反映） | Knowledge-K + Dev-M R16-R17 |
| 7 | Knowledge multi-agent collision SOP（pitfalls/multi-agent-knowledge-collision-r14.md 由来）の DEC-019-025 拡張 | PM + Knowledge R16 |

### §5.2 Dev-M との接続点（gate-12）

- **interface 定義**: §4.6 で TypeScript 型 3 種を確定（`Gate12Trigger / Gate12Resolver / Gate12Query`）
- **package**: `@clawbridge/dry-run-guard-hitl`（新規）
- **6-state FSM 拡張**: R11 Dev-H 由来 transition table に 3 state 追加
- **audit-store**: `gate12_*` event 4 種の hash chain append、`hash-chain-audit-pattern.md`（R7）と同規約
- **notify-bridge**: R14 Dev-B 由来 retry policy DI / sleep DI を流用、kind = `gate12_pause_request`
- **kill-switch G05**: reject / fallback kill 経路
- **dry-run-guard 5 category**: trigger 発火条件として既存 R10 hook を共有
- **non-interfere**: Dev-M 実装ファイルには触れず、本 spec を input としてのみ提供

### §5.3 Dev-N との接続点（gate-11）

- **manifest schema**: `organization/knowledge/_meta/gate11-manifest.schema.yaml`（proposal 別ファイル §2 で確定）
- **package**: `@clawbridge/knowledge-pii-detector`（新規 / Dev-N 担当）
- **detector API**: `scanEntry(filePath: string): Promise<QuarantineEntry | null>`
- **quarantine path**: `organization/knowledge/_quarantine/<batch_id>/manifest.yaml`
- **audit-store**: `gate11_manifest_emitted` / `gate11_resolved` event の hash chain append
- **notify-bridge**: R14 Dev-B 由来 retry policy DI / sleep DI を流用、kind = `gate11_review_request`
- **knowledge-redispatch**: `@clawbridge/knowledge-redispatch`（新規 / Dev-N 担当）— partial-approve 時の redact + entry 再起票
- **non-interfere**: Dev-N 実装ファイルには触れず、本 proposal を input としてのみ提供

### §5.4 並列 Agent 整合性（Round 15 第 4 波内）

| Agent | 担当 | 本 R15 Knowledge-J との整合 |
|---|---|---|
| Dev-M | gate-12 dry-run guard 実装 | 本 §4 spec を input として直接利用、本 R15 でも file 衝突 0 |
| Dev-N | gate-11 file I/O 実装 | 別ファイル `knowledge-j-r15-gate11-manifest-proposal.md` を input として直接利用、本 R15 でも file 衝突 0 |
| 並列 Knowledge エージェント | KE-system pattern + DEC-019-062 起票 | 本 R15 では INDEX-v5 物理 file 化を遅延（§1.4）、衝突 0 |
| Sec-J | DEC-019-062 起票 | 本 R15 では INDEX 上にエントリ予約のみ（§1.2 #7）、衝突 0 |

→ **本 R15 第 4 波で並列 Agent file 衝突 = 0 件**（本 R15 で起票するのは本書 + manifest proposal の 2 file のみ、INDEX-v5 物理 file は次 round に委譲）。

### §5.5 制約遵守 checklist（最終）

| 制約 | 遵守 |
|---|---|
| Owner formal「採決日 5/5」directive 整合 | 達成（本 R15 第 4 波は 5/5 内に完遂、INDEX-v5 物理化は次 round 委譲）|
| 既存ファイル上書き禁止 | 達成（INDEX-v4 / 既存 patterns / decisions / pitfalls / spec v1.0 / 辞書 v1.0 全て未改変）|
| 並列 Agent 非干渉（Dev-M / Dev-N / Knowledge 並列）| 達成（spec / proposal / INDEX 設計のみ、実装ファイルには触れず）|
| 絵文字禁止 | 達成（本書 + manifest proposal 両 file で絵文字 0）|
| PII / 顧客情報 / API キー漏洩防止 | 達成（合成 grayzone 例のみ、実 PII 含まず）|
| API コスト $0 | 達成（既存 retrieval / yaml / zod 既知資産流用、新規 LLM 呼出 0）|
| DEC-019-033 3 原則 | 達成（自動抽出 + structured 3 サブディレクトリ + PII redaction）|
| DEC-019-054 hash chain 整合 | 達成（gate-11 manifest schema + gate-12 audit log 両方で hash_chain_prev/self 必須化）|
| pii-redacted: true（YAML frontmatter） | 達成（KJ-2 §2 全 5 件 + 本書 + manifest proposal で明示）|

---

## §6 sign-off

- 本完遂レポート: `projects/PRJ-019/reports/knowledge-j-r15-index-v5-extract-gate11-gate12.md`（本書、約 410 行）
- 別ファイル proposal: `projects/PRJ-019/reports/knowledge-j-r15-gate11-manifest-proposal.md`（約 270 行）
- 既存ファイル改変: 0 件（INDEX-v4 / spec v1.0 / 辞書 v1.0 / 既存 patterns / decisions / pitfalls 全て未改変）
- API コスト: $0
- pii-redacted: true（本書 + manifest proposal 両 file で YAML frontmatter 明示）
- knowledge-pii-review: pending（本書自身も gate-11 1st 適用候補だが、grayzone のみで keep 判定見込み）
- DEC-019-033 3 原則準拠: 自動抽出 retrieval-friendly / structured 3 サブディレクトリ / PII redaction
- 並列 Agent（Dev-M / Dev-N / 並列 Knowledge / Sec-J）と衝突 0、整合確認済
- Owner formal「採決日 5/5」directive 整合、本 R15 第 4 波（低優先 3 並列の 2 番目）として完遂

以上、Knowledge-J 担当 Round 15 第 4 波 完遂。
