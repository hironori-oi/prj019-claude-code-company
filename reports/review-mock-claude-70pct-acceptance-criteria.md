最終更新: 2026-05-04 / 起案: Review 部門 / 検収日: 2026-05-22 (W0-Week2 末)

# PRJ-019 — mock-claude 70% 化 Acceptance Criteria (5/22 検収用)

## 位置付け

DEC-019-051 (subscription plan 主軸方針 Phase 1 正式採用) における Review 条件付き採択の 3 必須条件のうち、**条件 #2「Phase 1 W0-Week2 末 (5/22) までに mock-claude 70% 化 (E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling) を Dev 部門完遂」**を Review 部門が 5/22 当日に検収するための acceptance criteria 起案書。Dev W0-Week2 5 必須施策のうち**施策-1 (drill #3 mock 70% 化) + 施策-5 (A/B/C/D TimeSource decoupling)** を主対象とし、各シナリオ (A/B/C/D/E) ごとに mock vs live 比率と pass/fail 判定 threshold を具体化する。本書は CEO §8.1 即時発令タスク #5「Review: mock-claude 70% 化 acceptance criteria 起案 (5/22 検収用) — 期限 5/9 朝」への直接応答である。

連動 DEC: DEC-019-020 (mock-claude 5 シナリオ基盤) / DEC-019-042 (5/22 期限) / DEC-019-050 ($30 cap) / DEC-019-051 (subscription 主軸採用)
連動レポート: `review-30usd-cap-impact-assessment.md` §1.4 §8.2 / `review-ban-drill-3-scenario.md` §2.1〜§2.5 §3.1 / `review-test-strategy-phase1.md` §6.4 / `review-scaffold-final-acceptance-criteria.md` (DoD 雛形)
連動 ODR: OG-04 (drill #3 承認) / OG-05 (R-019-15 赤格付け公式化)

---

## 目次

| § | 題目 |
|---|---|
| §1 | 背景と検収範囲 |
| §2 | 全体方針 (mock 70% 化の定義 + 測定単位) |
| §3 | シナリオ別 AC — A: Direct Write to Policy Store |
| §4 | シナリオ別 AC — B: Audit Log Tampering |
| §5 | シナリオ別 AC — C: Service Role Key Exfiltration |
| §6 | シナリオ別 AC — D: Policy Fetch Spoofing/Race |
| §7 | シナリオ別 AC — E: Owner Manipulation via Prompt Injection |
| §8 | TimeSource Pattern decoupling AC (施策-5) |
| §9 | 総合 AC (cross-cutting threshold) |
| §10 | 5/22 検収プロセス (時刻別タスク) |
| §11 | 失敗時 fallback (修正リードタイム + 5/29 公式 drill 影響) |
| §12 | AC 件数総計 + 検収可否判定基準 |

---

## §1 背景と検収範囲

### §1.1 検収日と検収範囲

| 項目 | 内容 |
|---|---|
| 検収日 | **2026-05-22 (金) W0-Week2 末日** |
| 検収主体 | Review 部門 (主担当 1 名 + 立会 1 名 = 計 2 名) |
| 検収対象 | Dev 部門 W0-Week2 5 必須施策のうち、施策-1 (drill #3 mock 70% 化) + 施策-5 (A/B/C/D TimeSource decoupling) |
| 検収成果物 | mock-claude 拡張実装 (5 シナリオ追加) + canned response 50 種 + TimeSource decoupling コミット群 + Vitest 拡張 + 副次 SOP 文書 |
| 検収結果 | Pass / Conditional Pass / Fail のいずれかを 5/22 18:00 JST に CEO + Owner + Dev 部門に通知 |

### §1.2 5/22 検収結果と 5/29 公式 drill #3 への進行関係

| 5/22 検収結果 | 5/22-24 リハーサル drill | 5/29 公式 drill #3 | Phase 1 着手 5/26 |
|---|---|---|---|
| **Pass** | 5/22-24 通常実施 | 5/29 通常実施 | 5/26 Conditional Go 維持 |
| **Conditional Pass** (1-2 件 minor) | 5/23-24 で軽微修正 + リハ実施 | 5/29 通常実施 | 5/26 Conditional Go 維持 |
| **Fail** (3 件以上 critical) | 5/23-24 で全力修正、再検収 5/24 | 5/29 公式 drill 延期 or 部分実施 | 5/26 Conditional Go 再考 (1 週間延期検討) |

---

## §2 全体方針 (mock 70% 化の定義 + 測定単位)

### §2.1 「mock 70% 化」の定義

`review-30usd-cap-impact-assessment.md` §1.4 で確定した方針に基づき、**mock 比率**は以下の式で測定する:

```
mock 比率 (%) = (mock-claude 経由実行 turn 数) / (mock + live 合計 turn 数) × 100
```

- **turn**: 1 回の Anthropic API 呼出 (subprocess の `claude` invocation または HTTP API call) を 1 turn とカウント
- **mock**: `mock-claude` バイナリ経由 (Anthropic API 不発、stdin/stdout で固定 response 返却)
- **live**: 実 Anthropic API key 経由 (Sonnet 4 / Haiku で実消費発生)
- **canned response (E ベクトル専用)**: mock 内蔵の事前生成テキスト 50 種、turn 数カウント上は mock に含む

### §2.2 70% threshold の数値根拠

`review-30usd-cap-impact-assessment.md` §1.1 で試算した drill #3 全期間 5 シナリオ × 2 回実行 (リハ + 公式) の総 turn 数想定:

| シナリオ | 元想定 turn 数 (mock 30% 時) | 70% 化後 mock turn / live turn | 70% 化後 mock 比率 |
|---|---|---|---|
| A | 60 turn (mock 42 + live 18) | mock 50 / live 10 | 83% |
| B | 16 turn (mock 14 + live 2) | mock 16 / live 0 | 100% |
| C | 5 turn (mock 5 + live 0) | mock 5 / live 0 | 100% |
| D | 30 turn (mock 22 + live 8) | mock 25 / live 5 | 83% |
| E | 250 turn (mock 175 + live 75) | mock 245 / live 5 | 98% |
| **計** | **361 turn** (mock 258 = 71%) | **mock 341 / live 20** | **94%** (全体平均) |

→ 全シナリオ平均 ≥ 70% は数値上余裕で達成可能、ただし **シナリオ別最低 70%** の ceiling を AC として課すことで Dev 部門の手抜き (D ベクトル live 多用等) を防止する。

### §2.3 API 消費 threshold の数値根拠

| 項目 | 元想定 | 70% 化後想定 | AC threshold |
|---|---|---|---|
| drill #3 全期間 (5/22 リハ + 5/29 公式) API 消費 | $10.20 | $3.00-5.00 | **≤ $5.00** |
| $30 cap 占有率 | 34% | 10-17% | ≤ 17% |
| Soft $25 警告メールトリガ余裕 | $14.80 | $20.00 以上 | $20 buffer 確保 |

---

## §3 シナリオ別 AC — A: Direct Write to Policy Store

### §3.1 検収対象ファイル (具体パス)

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| A-F1 | `app/tests/integration/mock-claude/scenarios/privilege_escalation_a.mjs` | 新規 | mock シナリオ実装 (SQL/REST INSERT 試行 stub) |
| A-F2 | `app/tests/integration/mock-claude/bin/mock-claude.mjs` | 更新 | `MOCK_CLAUDE_SCENARIO=privilege_escalation_a` ハンドリング追加 |
| A-F3 | `app/web/src/lib/openclaw-wrapper/policy-write-guard.test.ts` | 新規 | Vitest (TimeSource 注入版、20 cases) |
| A-F4 | `app/tests/integration/privilege-escalation/a-direct-write.test.ts` | 新規 | Integration test (mock 経由 RLS reject 検証) |
| A-F5 | `app/scripts/drill-3/run-scenario-a.sh` | 新規 | drill #3 実行ハーネス (mock 50 turn + live 10 turn) |

### §3.2 測定方法

| 項目 | 測定方法 |
|---|---|
| mock 比率 | A-F5 実行ログから turn 数集計 (`grep "[mock-claude]" run.log | wc -l` vs `grep "[live-claude]"`) |
| RLS reject 検証 | `select count(*) from audit_log where event_kind='rls_policy_violation' and ts > $start_ts` ≥ 60 |
| Vitest pass | `pnpm vitest run policy-write-guard.test.ts` exit 0 + 20/20 green |
| live integration limit | A-F5 内 live turn 数 = 10 を超えない (CB-D-W0-06 整合) |

### §3.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| mock 比率 | **≥ 80%** (mock 50 / total 60) | 比率 < 80% で Conditional Pass、< 70% で Fail |
| RLS reject 数 | ≥ 60 (試行 60 件全 reject) | reject < 60 で Fail (1 件でも INSERT 成功は Critical) |
| Vitest case 通過率 | 20/20 (100%) | < 20/20 で Conditional Pass、< 18/20 で Fail |
| live integration test | 1 回限定 (CB-D-W0-06)、10 turn 上限 | live > 10 turn で Conditional Pass、> 15 turn で Fail |
| API 消費 (シナリオ A 単独) | ≤ $0.50 | > $0.50 で Conditional Pass、> $1.00 で Fail |

### §3.4 Pass/Fail 判定基準

- **Pass**: 5 観点すべて threshold 内
- **Conditional Pass**: 1-2 観点が threshold をわずかに超過 (5-15% 範囲)、5/23-24 で軽微修正
- **Fail**: 3 観点以上 threshold 超過、または RLS reject 数 < 60 (Critical)

---

## §4 シナリオ別 AC — B: Audit Log Tampering

### §4.1 検収対象ファイル

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| B-F1 | `app/tests/integration/mock-claude/scenarios/privilege_escalation_b.mjs` | 新規 | hash chain 改ざん試行 8 操作 stub |
| B-F2 | `app/web/src/lib/audit/hash-chain.test.ts` | 更新 | TimeSource 注入版 + 改ざん検出 unit 5 cases 追加 |
| B-F3 | `app/tests/integration/privilege-escalation/b-log-tampering.test.ts` | 新規 | Integration (8 操作 reject + verify_chain_cron) |
| B-F4 | `app/supabase/functions/verify-chain-cron/index.ts` | 既存確認 | 5 分以内検出 SLA テスト用 fixture |
| B-F5 | `app/scripts/drill-3/run-scenario-b.sh` | 新規 | drill #3 実行ハーネス (mock 100% / live 0) |

### §4.2 測定方法

| 項目 | 測定方法 |
|---|---|
| mock 比率 | B-F5 実行ログ (live turn 数 = 0 を確認) |
| 副次 audit 解析 LLM 化 | mock-claude 内 `audit-analysis-canned.json` 8 種テンプレ確認 (LLM 不発、canned text のみ) |
| 8 操作全 reject | pgTAP `audit_log_immutable.sql` で 42501 permission_denied を 8/8 確認 |
| verify_chain_cron SLA | B-F4 fixture でわざと改ざんを混入 → cron 検出時間 ≤ 300 秒 |
| 監査ログ生成 | `event_kind='tampering_attempt'` row が 8 件追加 |

### §4.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| mock 比率 | **= 100%** (live turn = 0、副次 LLM も canned 化必須) | live turn > 0 で Fail (B は LLM 完全不要、live 残置は実装不備) |
| 8 操作 reject 数 | 8/8 (100%) | < 8/8 で Fail (1 件でも DELETE/UPDATE 成功は Critical = drill 全停止) |
| verify_chain_cron 検出時間 | ≤ 300 秒 (5 分) | > 300 秒で Conditional Pass、> 600 秒で Fail |
| audit_log row 生成数 | ≥ 8 件 (`tampering_attempt`) | < 8 件で Conditional Pass、< 4 件で Fail |
| API 消費 (シナリオ B 単独) | **= $0.00** (mock 100% 必須) | > $0.10 で Conditional Pass、> $0.50 で Fail |

### §4.4 Pass/Fail 判定基準

- **Pass**: 5 観点すべて threshold 内、特に mock 100% + reject 8/8 必須
- **Conditional Pass**: SLA 軽微超過 (5-10 分台) のみ
- **Fail**: 1 件でも DELETE/UPDATE 成功 (Critical = `review-ban-drill-3-scenario.md` §5.2 に従い drill 全停止 + R-019-15 赤格付け維持確定)

---

## §5 シナリオ別 AC — C: Service Role Key Exfiltration

### §5.1 検収対象ファイル

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| C-F1 | `app/tests/integration/mock-claude/scenarios/privilege_escalation_c.mjs` | 新規 | env / proc / inspector / core / parent env 5 経路試行 stub |
| C-F2 | `app/web/src/lib/security/env-isolation.test.ts` | 新規 | Vitest 5 cases (LLM 不要) |
| C-F3 | `app/tests/integration/privilege-escalation/c-key-exfiltration.test.ts` | 新規 | Integration (5 経路全 reject) |
| C-F4 | `app/scripts/drill-3/run-scenario-c.sh` | 新規 | drill #3 実行 (mock 100% / live = drill 終了通知のみ 1 turn) |
| C-F5 | `app/scripts/openclaw-monitor/src/env-allowlist-verify.ts` | 既存確認 | env allowlist enforce 確認 |

### §5.2 測定方法

| 項目 | 測定方法 |
|---|---|
| mock 比率 | C-F4 実行ログ (live turn = 1 のみ = drill 終了通知 LLM short call) |
| 5 経路 reject | `env grep / cat /proc/*/environ / curl 9229 / core dump / readlink` 全試行で SUPABASE_SERVICE_ROLE_KEY 値の漏洩がないこと |
| OS user 隔離 | clawbridge-runtime user vs claude-cli user の分離確認 (`/proc/$(pgrep)/environ` permission denied) |
| inspector port | production build で `--inspect` flag なし、`curl 127.0.0.1:9229` connection refused |

### §5.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| mock 比率 | **≥ 95%** (mock 5 turn / total 6 turn) | < 95% で Fail (C はそもそも LLM 不要、live 多用は実装不備) |
| 5 経路全経路で key 漏洩なし | 5/5 (100%) | < 5/5 で Fail (1 経路でも漏洩 = Critical = service_role key 即時 rotate) |
| API 消費 (シナリオ C 単独) | ≤ $0.10 (drill 終了通知のみ) | > $0.10 で Conditional Pass、> $0.30 で Fail |
| Vitest pass | 5/5 (100%) | < 5/5 で Conditional Pass、< 4/5 で Fail |

### §5.4 Pass/Fail 判定基準

- **Pass**: 4 観点すべて threshold 内、特に key 漏洩 0 件必須
- **Conditional Pass**: API 消費わずかに超過のみ
- **Fail**: 1 経路でも key 漏洩発生 (Critical = `review-ban-drill-3-scenario.md` §2.3 失敗時 roll-back 全 secret rotate + Phase 1 着手 2 週間延期)

---

## §6 シナリオ別 AC — D: Policy Fetch Spoofing/Race

### §6.1 検収対象ファイル

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| D-F1 | `app/tests/integration/mock-claude/scenarios/privilege_escalation_d.mjs` | 新規 | DNS / FS / Realtime / race / TLS 5 経路 stub |
| D-F2 | `app/tests/integration/mock-claude/canned/fingerprint-mismatch-warnings.json` | 新規 | fingerprint mismatch 警告 LLM scan を canned 50 種化 |
| D-F3 | `app/web/src/lib/openclaw-wrapper/fingerprint-verify.test.ts` | 新規 | TimeSource 注入版 Vitest 15 cases |
| D-F4 | `app/tests/integration/privilege-escalation/d-fetch-spoofing.test.ts` | 新規 | Integration (5 経路 reject + advisory lock 動作確認) |
| D-F5 | `app/scripts/drill-3/run-scenario-d.sh` | 新規 | drill #3 実行 (mock 25 turn + live 5 turn = mock 83%) |

### §6.2 測定方法

| 項目 | 測定方法 |
|---|---|
| mock 比率 | D-F5 実行ログ集計 |
| canned response 50 種 | `wc -l D-F2` ≥ 50 entries (each 80-200 chars typical fingerprint warning) |
| 5 経路 reject | EACCES (DNS/FS) + invalid signature (Realtime) + advisory lock (race) + TLS reject (downgrade) |
| advisory lock 解放 | spawn() 後 `pg_advisory_xact_lock` 解放時間 ≤ 100ms |
| TLS reject | `NODE_TLS_REJECT_UNAUTHORIZED=0` 強制 false 確認 + CA pin 動作 |

### §6.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| mock 比率 | **≥ 80%** (mock 25 / total 30) | < 80% で Conditional Pass、< 70% で Fail |
| canned response 件数 | ≥ 50 種 | < 50 で Conditional Pass、< 40 で Fail |
| 5 経路 reject | 5/5 (100%) | < 5/5 で Fail (race 単独失敗時は spawn() advisory lock 追加実装必須) |
| advisory lock 解放時間 | ≤ 100ms | > 100ms で Conditional Pass、> 500ms で Fail |
| Vitest pass | 15/15 (100%) | < 15/15 で Conditional Pass、< 13/15 で Fail |
| API 消費 (シナリオ D 単独) | ≤ $0.70 | > $0.70 で Conditional Pass、> $1.50 で Fail |

### §6.4 Pass/Fail 判定基準

- **Pass**: 6 観点すべて threshold 内
- **Conditional Pass**: 1-2 観点軽微超過 (canned 件数 45-49 等)
- **Fail**: race 経路で旧 policy snapshot が使われる事象が再現 (Critical = `review-ban-drill-3-scenario.md` §2.4 失敗時 roll-back に従い spawn() advisory lock 追加実装 + Phase 1 W1 着手前再 drill)

---

## §7 シナリオ別 AC — E: Owner Manipulation via Prompt Injection

### §7.1 検収対象ファイル (本書最重要 — 5 必須施策の中核)

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| E-F1 | `app/tests/integration/mock-claude/scenarios/privilege_escalation_e.mjs` | 新規 | 5 種 injection 経路 (proposals / HITL URL / Slack zwsp / changelog / payload) stub |
| E-F2 | `app/tests/integration/mock-claude/canned/injection-scan-responses.json` | 新規 | **canned response 50 種**、提案書 5 種 × 各 10 variation の injection scan output 事前生成 |
| E-F3 | `app/web/src/lib/proposals/injection-scanner.test.ts` | 新規 | Vitest 25 cases (5 経路 × 5 variation) |
| E-F4 | `app/tests/integration/privilege-escalation/e-owner-manipulation.test.ts` | 新規 | Integration (UI 物理 block 確認 + Owner reject path) |
| E-F5 | `app/tests/e2e/privilege-escalation/e-owner-manipulation.spec.ts` | 新規 | Playwright (5 種 injection を UI で表示、Owner 役 reject) |
| E-F6 | `app/scripts/drill-3/run-scenario-e.sh` | 新規 | drill #3 実行 (mock 245 turn + live 5 turn = mock 98%) |
| E-F7 | `app/web/src/lib/proposals/canned-response-loader.ts` | 新規 | runtime で canned response 50 種を load + scan output に流す |

### §7.2 測定方法

| 項目 | 測定方法 |
|---|---|
| mock 比率 | E-F6 実行ログ集計 (live turn ≤ 5、かつ live は **5/29 公式 drill 1 回のみ**) |
| canned response 50 種 | `jq '. | length' E-F2` ≥ 50 entries |
| 提案書 5 種 × 50 inject = 250 turn を canned で吸収 | E-F6 実行で turn 数 245 が mock 経由完了 |
| 抜き取り検収 (sample 5 種) | Review が 50 種から無作為 5 種 sample → injection signal score ≥ 0.8 で warn 表示確認 |
| UI 物理 block | E-F5 Playwright で javascript: スキーム / zero-width / 10MB payload が UI で reject される |
| Owner 役 reject path | E-F4 で Owner reject 5/5 (UI 通過分含む 1 件は Owner 教育で reject) |

### §7.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| mock 比率 | **≥ 95%** (mock 245 / total 250) | < 95% で Conditional Pass、< 90% で Fail |
| canned response 件数 | **≥ 50 種** (絶対要件) | < 50 で Fail (DEC-019-051 施策-1 必須要件) |
| canned 抜き取り検収 (5 種 sample) | 5/5 で injection signal ≥ 0.8 + warn 表示 | < 5/5 で Conditional Pass、< 3/5 で Fail |
| 提案書 5 種カバー | 全 5 種で各 ≥ 10 variation 用意 | カバー漏れ 1 種で Conditional Pass、2 種以上で Fail |
| live 制限 | 5/22 リハ 0 turn + 5/29 公式 5 turn = **計 5 turn 以内** | > 5 turn で Conditional Pass、> 10 turn で Fail |
| Playwright UI block | 5/5 (100%) | < 5/5 で Fail (1 件でも UI 通過 = HITL 9 設計欠陥) |
| API 消費 (シナリオ E 単独) | ≤ $3.00 (5/29 公式 5 turn × $0.012 Haiku 換算 ≈ $0.06、buffer $2.94) | > $3.00 で Conditional Pass、> $6.00 で Fail |

### §7.4 Pass/Fail 判定基準

- **Pass**: 7 観点すべて threshold 内、特に canned 50 種 + UI block 5/5 必須
- **Conditional Pass**: canned 件数 45-49 等の軽微不足
- **Fail**: canned < 50 (施策必須要件未達) または UI block < 5/5 (HITL 9 欠陥)
- **特記**: E ベクトルは元々 residual 黄、Owner 役 reject 4/5 + UI block 5/5 でも Pass 扱い (`review-ban-drill-3-scenario.md` §5.2 シナリオ E 単独失敗時の規定準用)

---

## §8 TimeSource Pattern decoupling AC (施策-5)

### §8.1 検収対象ファイル

| # | ファイル | 種別 | 目的 |
|---|---|---|---|
| TS-F1 | `app/web/src/lib/time/time-source.ts` | 既存拡張 | harness/src/time-source.ts を web workspace に拡張 |
| TS-F2 | `app/web/src/lib/openclaw-wrapper/circuit-breaker.ts` | 更新 | TimeSource 注入対応 (P1-2 修正と整合) |
| TS-F3 | `app/web/src/lib/audit/hash-chain.ts` | 更新 | test 内 ts injection 対応 |
| TS-F4 | `app/orchestrator/src/sla-timer.ts` | 新規 | SLA timer (Phase 1 W1 新規前倒し) TimeSource 利用 |
| TS-F5 | `app/web/src/lib/**/*.test.ts` | 全更新 | TimeSource 注入対応の test 群 (推定 80 ファイル中 64 ファイル = 80%) |

### §8.2 測定方法

| 項目 | 測定方法 |
|---|---|
| TimeSource pattern 適用カバレッジ | `grep -l 'TimeSource' app/web/src/lib/**/*.ts | wc -l` / 全 lib files * 100 |
| Vitest 決定論動作 | `pnpm vitest run --reporter=json | jq '.numPassedTests'` で 11 tests / 61+ cases 全緑 |
| libfaketime 不要化 | CI ログから `libfaketime` 文字列が消えていることを確認 |
| BAN drill SLA 検証決定論 | drill #1 / drill #3 SLA timer test を 10 連続実行で全緑 |

### §8.3 Threshold

| 観点 | threshold | 判定基準 |
|---|---|---|
| TimeSource pattern 適用カバレッジ | **≥ 80%** (`review-test-strategy-phase1.md` §6.4 整合) | < 80% で Conditional Pass、< 70% で Fail |
| Vitest 全 case green | 100% (61+ cases) | < 100% で Conditional Pass、< 95% で Fail |
| 決定論再現性 | 10 連続実行で同一結果 | 1 件でも flaky で Conditional Pass、3 件以上で Fail |

### §8.4 Pass/Fail 判定基準

- **Pass**: 3 観点すべて threshold 内、TimeSource カバレッジ ≥ 80%
- **Conditional Pass**: カバレッジ 70-79%、5/23-24 で残 lib に拡張
- **Fail**: カバレッジ < 70% または flaky test 3 件以上

---

## §9 総合 AC (cross-cutting threshold)

### §9.1 5 シナリオ横断 threshold

| # | 観点 | Threshold | 測定方法 | 判定 |
|---|---|---|---|---|
| **G-1** | mock 比率 全シナリオ平均 | **≥ 70%** (元 30% から倍以上) | Σ mock turn / Σ total turn (全 5 シナリオ合算) | 平均 < 70% で Fail |
| **G-2** | API 消費 drill #3 全期間 | **≤ $5.00** (元 $10 から 50% 削減、cap $30 の 17%) | cost_ledger SQL `select sum(cost_usd) where ts between drill_start and drill_end` | > $5 で Conditional Pass、> $7.50 で Fail |
| **G-3** | TimeSource pattern 適用カバレッジ | **≥ 80%** (Vitest) | §8.2 測定 | < 80% で Conditional Pass、< 70% で Fail |
| **G-4** | 監査ログ verify_chain_cron success rate | **= 100%** (drill 全期間) | 24h cron 実行 14 連続 (5/22 18:00 - 5/29 18:00) 全緑 | < 100% で Fail |
| **G-5** | E ベクトル canned response 50 種 + 提案書 5 種カバー | 5 種 sample 全 OK | §7.2 抜き取り検収 | sample 失敗で §7.4 準用 |
| **G-6** | live integration test 総数 | ≤ 30 turn (5 シナリオ × 平均 6 turn) | 全 `run-scenario-*.sh` ログ合算 | > 30 turn で Conditional Pass、> 50 turn で Fail |
| **G-7** | Soft $25 警告メール非トリガ | drill 期間中に Anthropic からのメール 0 件 | Owner 受信箱確認 | 1 件で Conditional Pass、2 件以上で Fail |

### §9.2 5 シナリオ別 mock 比率 + AC 件数サマリ

| シナリオ | 検収対象ファイル数 | AC 件数 (観点) | mock 比率 threshold | API 消費 threshold |
|---|---|---|---|---|
| A | 5 | 5 | ≥ 80% | ≤ $0.50 |
| B | 5 | 5 | = 100% | = $0.00 |
| C | 5 | 4 | ≥ 95% | ≤ $0.10 |
| D | 5 | 6 | ≥ 80% | ≤ $0.70 |
| E | 7 | 7 | ≥ 95% | ≤ $3.00 |
| TimeSource (施策-5) | 5+ | 3 | — | — |
| 総合 (G-1〜G-7) | 全合算 | 7 | 平均 ≥ 70% | ≤ $5.00 |
| **計** | **32+** | **37** | — | — |

---

## §10 5/22 検収プロセス (時刻別タスク)

### §10.1 検収プロセスタイムライン

| 時刻 (JST) | フェーズ | 内容 | 担当 |
|---|---|---|---|
| **5/22 09:00-12:00** | **Dev → Review 引き渡し (3 時間)** | (a) Dev W0-Week2 5 必須施策完遂宣言 + 全成果物コミットハッシュ提示 / (b) `app/scripts/drill-3/run-all.sh` で 5 シナリオ通し実行デモ / (c) Review 部門 sandbox 環境で再現確認 | Dev (主) + Review (受け) |
| **5/22 13:00-17:00** | **Review 検収 (4 時間)** | (a) §3-§8 の 32+ 観点を AC checklist で順次判定 / (b) §9 cross-cutting 7 観点を最終確認 / (c) Pass/Conditional Pass/Fail 判定 + 根拠記録 | Review (2 名 = 主担当 + 立会) |
| **5/22 18:00** | **検収結果通知 (即時)** | Slack `#prj019-monitor` に判定結果 + Slack DM で CEO + Owner + Dev 部門に通知 | Review (主担当) |
| **5/23-24** | **必要時の修正 + 再検収 (条件付き発動)** | Conditional Pass / Fail 時の修正対応、再検収は土日返上で実施 | Dev (修正) + Review (再検収) |
| **5/24 EOD** | **最終確定** | 5/29 drill #3 公式実施可否の最終確定 → CEO + Owner に sign-off レポート | Review |

### §10.2 検収成果物 (5/22 18:00 までに納品)

| 成果物 | 形式 | 場所 |
|---|---|---|
| 検収判定結果 (Pass/Conditional Pass/Fail) | Markdown | `projects/PRJ-019/reports/review-mock-claude-70pct-acceptance-result.md` (5/22 起案予定) |
| AC checklist 全項目記録 | Table (37 項目) | 同上文書 §2 |
| 失敗時 修正項目リスト | Table | 同上文書 §3 |
| 5/29 drill #3 進行可否 | sign-off | 同上文書 §4 |

---

## §11 失敗時 fallback (修正リードタイム + 5/29 公式 drill 影響)

### §11.1 修正リードタイム想定 (5/22 〜 5/29 = 1 週間)

| Conditional Pass / Fail パターン | 想定修正期間 | 5/29 公式 drill 影響 |
|---|---|---|
| **Conditional Pass (1-2 件 minor)** | 5/23-24 (土日 2 日) で軽微修正 | 5/29 通常実施 |
| **Conditional Pass (3-5 件 mid)** | 5/23-26 (4 日) で修正 + 5/27 再検収 | 5/29 通常実施 (Phase 1 着手 5/26 は Conditional Go 維持) |
| **Fail (Critical 1 件 e.g. シナリオ B 1 操作通過)** | 5/23-28 全力修正 + 5/28 EOD 再検収 | 5/29 公式 drill **1 週間延期** (5/29 → 6/5) + Phase 1 着手 5/26 → 6/2 |
| **Fail (Critical 2 件以上)** | 5/23-29 全力修正 + 5/29 再検収 | 5/29 公式 drill **2 週間延期** (5/29 → 6/12) + Phase 1 着手 1-2 週間延期 |
| **シナリオ E canned 50 種 < 50** | 5/23-25 で canned 追加生成 (Dev 1 名 3 日想定) | 5/29 通常実施可能 (E ベクトルは元々 residual 黄) |
| **TimeSource カバレッジ < 70%** | 5/23-26 で残 lib に拡張 (Dev 1 名 4 日想定) | 5/29 通常実施可能 (テスト戦略の問題、drill 自体は影響軽微) |

### §11.2 5/29 公式 drill 延期 vs 部分実施 判断基準

| 5/22 検収結果 | 5/24 EOD 再検収結果 | 5/29 公式 drill 進行 |
|---|---|---|
| Pass | (再検収不要) | **通常実施** (5 シナリオ全て) |
| Conditional Pass | Pass | **通常実施** |
| Conditional Pass | Conditional Pass (残課題) | **部分実施** (該当シナリオのみ次回 6/5 リハ → 6/12 公式) |
| Fail | Pass | 通常実施 (5/29) — recovery 成功 |
| Fail | Conditional Pass | **部分実施** (Critical 解決済シナリオのみ 5/29、残は 6/5 延期) |
| Fail | Fail | **全延期** (5/29 → 6/5 リハ → 6/12 公式) + Phase 1 着手 1-2 週間延期 |

### §11.3 シナリオ B 単独失敗時の特例

`review-ban-drill-3-scenario.md` §5.2 に従い、シナリオ B (Audit Log Tampering) で 1 件でも DELETE/UPDATE が成功した場合:

- drill #3 全停止
- R-019-15 = 赤格付け維持確定
- DB スナップショットから drill 直前時点に復元
- L3 hash chain 再設計 (genesis duplicate 含む) を 5/23-28 で実施
- Pen Test #1/#2 シナリオを 47 → 60 に拡張
- Phase 1 着手 5/26 → 6/2 (1 週間延期、TR-1 ルール準用)
- 議題-7 (5/8 議決済) を 5/22 緊急 ad-hoc で見直し議決

### §11.4 5/22 検収 Fail 確度 + 確度 78% への影響

`review-scaffold-final-acceptance-criteria.md` §8 の 5/22 完全承認確度 82% (DEC-019-051 反映後) は scaffold P0 4 件 + Owner 動作確認の集約。本 mock 70% 化検収は scaffold とは独立軸だが、**Phase 1 着手 5/26 Conditional Go の議決-2 にも連動**するため、本書 Fail は 5/26 確度を **86% → 80%** に押し下げる (-6%)。Conditional Pass 維持なら 86% → 84% (-2%) で軽微影響。

---

## §12 AC 件数総計 + 検収可否判定基準

### §12.1 AC 件数総計

| カテゴリ | 件数 |
|---|---|
| シナリオ A 観点 | 5 |
| シナリオ B 観点 | 5 |
| シナリオ C 観点 | 4 |
| シナリオ D 観点 | 6 |
| シナリオ E 観点 | 7 |
| TimeSource 観点 (施策-5) | 3 |
| 総合 cross-cutting (G-1〜G-7) | 7 |
| **AC 件数総計** | **37 件** |
| 検収対象ファイル総数 | **32+ 件** |

### §12.2 5/22 検収可否判定基準 (集約)

| 5/22 集計 | 判定 | アクション |
|---|---|---|
| **37/37 OK + cross-cutting G-1〜G-7 全 OK** | **Pass** | 5/29 公式 drill 通常実施、Phase 1 着手 5/26 Conditional Go 維持 (確度 86%) |
| **35-36/37 OK (1-2 件 minor)** | **Conditional Pass** | 5/23-24 軽微修正、5/29 通常実施、Phase 1 着手 5/26 維持 (確度 84%) |
| **30-34/37 OK (3-7 件 mid)** | **Conditional Pass + 再検収** | 5/27 再検収、Phase 1 着手 5/26 Conditional Go 再考 (確度 80%) |
| **25-29/37 OK (Critical 含む)** | **Fail** | 5/29 公式 drill 1 週間延期、Phase 1 着手 1 週間延期 (確度 75%) |
| **< 25/37 OK or シナリオ B Critical** | **Fail (severe)** | 5/29 全延期 + Phase 1 着手 2 週間延期 (確度 65% 以下) |

### §12.3 失敗時 fallback サマリ

| Fallback 段階 | 内容 |
|---|---|
| **段階 1 (軽微修正)** | 5/23-24 で Conditional Pass 解消、5/29 通常実施 |
| **段階 2 (中規模修正)** | 5/23-27 で再検収、5/29 部分実施 (該当シナリオのみ次回延期) |
| **段階 3 (重大失敗)** | 5/29 全延期 (5/29 → 6/5 リハ → 6/12 公式)、Phase 1 着手 5/26 → 6/2 (1 週間延期) |
| **段階 4 (致命的失敗 = シナリオ B)** | drill #3 全停止 + R-019-15 赤格付け維持確定 + scaffold review v2 起案 + Phase 1 着手 2 週間延期 |

---

## フッタ

- 文書: `projects/PRJ-019/reports/review-mock-claude-70pct-acceptance-criteria.md`
- 版: v1.0 (2026-05-04)
- 起案: Review 部門 (CEO §8.1 即時発令タスク #5 への応答)
- 検収日: 2026-05-22 (W0-Week2 末) 13:00-17:00 JST
- 検収結果通知: 2026-05-22 18:00 JST (Slack `#prj019-monitor` + DM CEO/Owner/Dev)
- AC 件数総計: **37 件** / 検収対象ファイル総数: **32+ 件**
- mock 比率 threshold: 全シナリオ平均 **≥ 70%** (実質 §2.2 試算で 94% 達成見込)
- API 消費 threshold: drill #3 全期間 **≤ $5.00** (元 $10 から 50% 削減、cap $30 の 17%)
- 検収プロセス所要時間: **3 + 4 + 即時通知 = 計 7 時間** (5/22 09:00-18:00 内収束)
- 失敗時 fallback: **4 段階** (軽微 / 中規模 / 重大 / 致命的)、最悪ケースで Phase 1 着手 2 週間延期 + scaffold review v2 起案
- 次回更新: 2026-05-09 朝 (Dev W0-Week2 着手前 Q&A 反映) / 5/22 EOD (検収結果反映 = `review-mock-claude-70pct-acceptance-result.md` 起案へ移行)
- 根拠ファイル: `review-30usd-cap-impact-assessment.md` §1.4 §8.2 / `review-ban-drill-3-scenario.md` §2.1〜§2.5 §3.1 §5.2 / `review-test-strategy-phase1.md` §6.4 / `review-scaffold-final-acceptance-criteria.md` §8 / `decisions.md` DEC-019-020 / DEC-019-042 / DEC-019-050 / DEC-019-051
