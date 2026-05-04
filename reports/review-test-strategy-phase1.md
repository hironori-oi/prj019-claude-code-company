# PRJ-019 — Phase 1 (5/26-6/20) テスト戦略書

最終更新: 2026-05-03 / 起案: Review 部門

位置付け: 5/8 W0-Week1 検収会議における議決-2 (Phase 1 着手 Conditional Go) + 議決-5 (必須コントロール 50 項目採用) の根拠資料。Phase 1 期間中に scaffold (37 ファイル / 2,415 行) + Phase 1 W1〜W4 で追加実装される全コードに対し、テストカバレッジ 80% (`organization/rules/testing-policy.md` Level 3 = 大規模・重要案件) を達成するための戦略書。

連動: `review-scaffold-code-review-v1.md` §6 (Test coverage 評価) / `review-ban-drill-3-scenario.md` (drill #3 統合) / `review-r019-15-mitigation-plan-v2.md` §5 §9 (P-UI-01〜10 + Pen Test)
連動 DEC: DEC-019-020 (mock-claude 5 シナリオ基盤) / DEC-019-033 §⑤ (4 層防御) / `organization/rules/testing-policy.md` Level 3
連動 ODR: OG-04 (drill #3 承認) / OG-05 (R-019-15 赤格付け)

---

## 目次

| § | 題目 |
|---|---|
| §1 | テストピラミッド (Unit 70% / Integration 20% / E2E 10%) |
| §2 | ツール選定 (Vitest / Playwright / pgTAP / Casbin policy lint) |
| §3 | W1〜W4 各週のテスト DoD |
| §4 | 80% カバレッジ目標 + 計測方法 |
| §5 | CI 構成 (GitHub Actions、月額無料枠内) |
| §6 | mock-claude 基盤との連携 |
| §7 | BAN drill #1 / #3 のテスト統合 |
| §8 | Phase 1 終了時のテスト検収条件 |

---

## §1 テストピラミッド

### §1.1 比率と件数想定

`organization/rules/testing-policy.md` Level 3 (大規模・重要案件、80% カバレッジ目標) を Phase 1 に適用する。Mike Cohn 古典ピラミッドを基準としつつ、本案件は **セキュリティ層が厚い** ため Integration の RLS / Casbin policy 検証を拡張する。

```
        E2E (Playwright) 10%
       /                      \
      Integration 20%          \
     /  pgTAP / Casbin /        \
    /   mock-claude / Edge fn    \
   /                              \
  Unit (Vitest) 70%                \
  hash-chain / openclaw-wrapper /   \
  hitl validators / harness ext     \
```

| 層 | 比率 | 件数想定 (Phase 1 完了時) |
|---|---|---|
| **Unit** | 70% | 200 件 (本 scaffold + Phase 1 新規実装) |
| **Integration** | 20% | 60 件 (RLS 105 ケースのうち代表 40 + pgTAP hash chain 10 + Casbin 10) |
| **E2E** | 10% | 25 件 (Playwright で主要フロー 25) |

### §1.2 各層の責務

| 層 | 責務 | 例 |
|---|---|---|
| Unit | 純粋関数 / 単一クラス / 副作用無し | `canonicalize()` / `verifyChain()` / `CircuitBreaker` 状態遷移 / `HITL_GATE_DEFAULTS` lookup |
| Integration | 複数モジュール接続 / DB 接続 / subprocess spawn | `append_audit_log` SECURITY DEFINER fn の並行 INSERT / RLS 7 テーブル × 5 操作 × 3 role / Casbin enforcer 105 ケース / mock-claude 5 シナリオ |
| E2E | 実ブラウザ / 実 Vercel / 実 Supabase staging | HN trending → preview deploy 全フロー / HITL 9 dev_kickoff_approval 承認フロー / 権限変更 HITL 10 確認モーダル |

### §1.3 セキュリティテストは Integration 層で厚く

R-019-15 (Privilege Escalation) の 5 攻撃ベクトル (a-e) は **Integration 層で attack を再現するシナリオテスト** として実装する (BAN drill #3 シナリオを Vitest + pgTAP に展開)。BAN drill #3 の 5 シナリオが Integration テストに統合されることで、Phase 1 完了後も CI で常時再現可能。

---

## §2 ツール選定

### §2.1 標準ツール (`organization/rules/testing-policy.md` 整合)

| カテゴリ | ツール | 用途 | 採用根拠 |
|---|---|---|---|
| Unit (TS) | **Vitest** ^2.x | hash-chain / openclaw-wrapper / hitl validators / harness 既存 | 既存 harness で 11 tests / 61 cases 実績、TimeSource pattern (DEC-019-020) と整合 |
| Integration (TS) | **Vitest** + Supabase クライアント | mock-claude 経由の subprocess spawn + DB 書込み検証 | 既存 mock-claude 基盤と直結、Vitest single-runner で test ピラミッド統一 |
| Integration (DB) | **pgTAP** ^1.3 | RLS policy / hash chain trigger / SECURITY DEFINER fn の並行 INSERT | Postgres native、Supabase でサポート済、SQL で書けるため RLS path カバーが容易 |
| Integration (Casbin) | **casbin** ^5.34 公式 + custom matrix runner | 7 category × 5 action × 3 role = 105 マトリクス全カバー | enforcer 公式 API で deny envelope 検証 |
| E2E | **Playwright** ^1.49 | HN trending / HITL 9-10-11 UI / 権限変更モーダル | Web 標準スタック、既存 PRJ で実績 |
| 静的解析 | **ESLint** ^9.17 (eslint-config-next) + TypeScript strict | 全 workspace lint + 型チェック | DEC-019-041 ARCH-01 Phase B (strict 完全適用) 整合 |
| Coverage | **Vitest --coverage** (V8 provider) + **pgTAP coverage** | line/branch/function 計測 | Vitest 標準、追加コスト 0 |
| Mutation (Phase 2 検討) | (Stryker) | Phase 1 では不要 | Phase 2 で hash-chain / Casbin に限定導入検討 |

### §2.2 セキュリティ専用ツール (review-r019-15 §5 P-UI-09 整合)

| ツール | 用途 |
|---|---|
| **sqlfluff** + 自製 RLS lint script | RLS policy で `for all` の検出、`with check` 句の漏れ検知 (P-UI-09 review checklist の自動化) |
| **Casbin policy lint script** | 13 prohibited domains の網羅性確認、glob 構文の Casbin v5 互換性 verification (P0-3 防止) |
| **Snyk / Trivy** (任意、月次) | 依存ライブラリ脆弱性スキャン |
| **gitleaks** | secret 漏洩検知 (`.test` TLD 以外の secret commit を block) |

### §2.3 ツール無料枠

| ツール | 無料枠 | 月次想定 |
|---|---|---|
| Vitest / Playwright / pgTAP / Casbin | OSS | $0 |
| GitHub Actions | 2,000 分/月 (Hobby) | 推定 1,500 分/月 (PR 30 + nightly 30 = 60 run) |
| Vercel preview | Hobby Free | $0 (drill #3 / Pen Test も staging で消費) |
| Supabase staging | Free Tier | $0 (DB 500MB / Realtime 200 同接) |

DEC-019-031 月次 $300 ハードキャップ内で完全に収まる。

---

## §3 W1〜W4 各週のテスト DoD

### §3.1 W1 (5/26 - 6/1) — Critical Foundation

**目標**: scaffold P0 修正版 + L4 Fingerprint 着手 + 4 層防御の Unit / Integration を緑化

| ID | テスト | 期待件数 | 測定 |
|---|---|---|---|
| **W1-T1** | `hash-chain.ts` Unit (canonicalize / sha256Hex / verifyChain / verifyRecord) | 30 cases | line/branch 100% |
| **W1-T2** | `append_audit_log` SECURITY DEFINER fn 並行 INSERT pgTAP | 10 cases (1/10/100/1000 並行 + advisory lock 検証) | chain 連続性 100% |
| **W1-T3** | RLS 7 テーブル × 5 操作 × 3 role = 105 ケース pgTAP | 105 cases | 全 reject/allow 期待通り 100% |
| **W1-T4** | `hitl.ts` zod parse + HITL_GATE_DEFAULTS lookup | 22 cases (11 種 × 2: valid/invalid payload) | 全種 valid 通過、invalid reject |
| **W1-T5** | `openclaw-wrapper` Unit (FeatureFlagStore / VersionPin / CircuitBreaker / RuntimeWrapper) | 25 cases | TimeSource 注入後の deterministic 動作 |
| **W1-T6** | Casbin enforcer 105 マトリクス | 105 cases | 13 prohibited domains 全 role で deny + initial allow list 通過 |
| **W1-T7** | E2E (Playwright) `/dashboard` `/proposals` 表示 | 5 cases | スモークテスト |
| **W1 累計** | — | **302 cases** | line/branch coverage **70% 達成** |

**W1 終了時 DoD**: P0-1〜P0-4 修正済 + W1-T1〜W1-T7 全緑 + coverage 70% + scaffold review v1 §3.2 P1 中の P1-2 (TimeSource) / P1-3 (proposals status 遷移) 解決済

### §3.2 W2 (6/2 - 6/8) — Adversarial + DoD 3 分岐

**目標**: BAN drill #3 公式実施結果を踏まえた追試 + DoD 3 分岐 (whitelist/gray/blocklist) wiring + Pen Test #1 36 攻撃

| ID | テスト | 期待件数 | 測定 |
|---|---|---|---|
| **W2-T1** | drill #3 5 シナリオを Integration test として再構成 (`tests/integration/privilege_escalation/`) | 5 cases | 全 reject 100% 維持 |
| **W2-T2** | ToS classifier prompt の whitelist/gray/blocklist 3 分岐 unit + integration | 30 cases (white 10 + gray 10 + black 10) | F1 ≥ 0.85 (Phase 1 W2 DoD 整合) |
| **W2-T3** | DoD 3 分岐 wiring E2E (HITL 6 tos_gray_review 経由含む) | 6 cases (whitelist auto / gray HITL approve / gray HITL reject / gray HITL timeout / blocklist auto reject / blocklist + audit) | 全 6 pass |
| **W2-T4** | Pen Test #1 36 攻撃 (PE-01〜12 × 3 variation) | 36 cases | 全 reject 100% + Critical 0 |
| **W2-T5** | Casbin policy lint (13 prohibited domains 網羅 + glob 互換) | 5 cases (lint script の self-test) | lint pass |
| **W2-T6** | mock-claude 5 シナリオ統合 (success / auth_failed / rate_limit_429 / silent_revoke / slow) | 既存 5 + privilege_escalation_a/b/c/d/e 追加 5 = 10 cases | 全シナリオ起動成功 |
| **W2 累計** | — | **W1 + 92 = 394 cases** | coverage **76% 達成** |

**W2 終了時 DoD**: drill #3 公式実施 (5/29) Pass 5/5 + Pen Test #1 全 reject + DoD 3 分岐 F1 ≥ 0.85 + coverage 76%

### §3.3 W3 (6/9 - 6/15) — E2E + FN-Black

**目標**: HN trending → Vercel preview deploy 全フロー E2E + FN-Black 1 回目評価

| ID | テスト | 期待件数 | 測定 |
|---|---|---|---|
| **W3-T1** | E2E full flow: HN trending → ToS分類 → 提案生成 → HITL 9 → 承認 → scaffold → sandbox test → preview deploy → Slack notify | 1 case (主要 happy path) | < 2 hours total + 全段階 audit log row 生成 |
| **W3-T2** | E2E HITL 9 / 10 / 11 各 UI フロー | 9 cases (各 gate × 承認/却下/timeout 3 通り) | 全フロー UI 操作 + DB 状態遷移整合 |
| **W3-T3** | E2E 権限変更モーダル (P-UI-02 cool-down 5 秒) | 5 cases (緩和方向 cool-down 発動 / 厳格化方向 即時 / cool-down 連打 reject / モーダル diff 表示 / CSRF token 必須) | 全 pass |
| **W3-T4** | FN-Black 1 回目評価 (60 件 ToS 分類サンプル) | 60 cases | F1 ≥ 0.85 + false negative ≤ 5% |
| **W3-T5** | E2E 異常検知 + 自動 rollback (P-UI-05) | 10 cases (5 異常パターン × 2: 検出 / rollback) | 全 1h 以内 rollback |
| **W3 累計** | — | **W2 + 85 = 479 cases** | coverage **78% 達成** |

**W3 終了時 DoD**: HN→preview E2E 全段階緑 + FN-Black 1 回目 F1 ≥ 0.85 + P-UI-02/05 動作確認 + coverage 78%

### §3.4 W4 (6/16 - 6/20) — Pen Test #2 + 80% 達成

**目標**: Pen Test #2 47 攻撃 + FN-Black 2 回目 + 80% カバレッジ確定 + Phase 1 完了判定

| ID | テスト | 期待件数 | 測定 |
|---|---|---|---|
| **W4-T1** | Pen Test #2 47 攻撃 (PE-01〜12 全 + 7 カテゴリ × 5 境界 + 12 派生) | 47 cases | 全 reject 100% + Critical 0 |
| **W4-T2** | FN-Black 2 回目評価 (60 件、W3 と独立サンプル) | 60 cases | F1 ≥ 0.88 (W3 比 + 0.03 改善) + false negative ≤ 3% |
| **W4-T3** | Knowledge Extraction Pipeline E2E (KE-01〜04) | 8 cases (case 数は patterns/decisions/pitfalls × 各 redact パス) | PII redact false negative < 1% (sample 100) |
| **W4-T4** | Phase 1 完了判定: 10 連続成功率 ≥ 80% (DEC-019-023 TR-3 整合) | 10 case (HN→preview 自動化を 10 連続実行) | 8/10 以上成功 |
| **W4-T5** | verify-zero-side-effect.sh 月次最終確認 | 1 run | PRJ-001〜018 への副作用 0 件 |
| **W4-T6** | regression: W1-W3 全テスト再実行 | (累計 479 cases) | 全緑維持 |
| **W4 累計** | — | **W3 + 126 = 605 cases** | coverage **80% 達成** |

**W4 終了時 DoD (Phase 1 完了)**: Pen Test #2 全 reject + FN-Black F1 ≥ 0.88 + 10 連続成功率 ≥ 80% + 副作用ゼロ + coverage 80%

### §3.5 W1〜W4 累計サマリ

| 週 | 累計件数 | coverage |
|---|---|---|
| W1 | 302 cases | 70% |
| W2 | 394 cases | 76% |
| W3 | 479 cases | 78% |
| W4 | 605 cases | **80% (Phase 1 完了 DoD)** |

---

## §4 80% カバレッジ目標 + 計測方法

### §4.1 何を 80% でカバーするか

| 範囲 | 計測ツール | 目標 | 根拠 |
|---|---|---|---|
| `app/web/src/lib/**` (TS lib) | Vitest --coverage (V8 provider) | line/branch **80%** | testing-policy Level 3 |
| `app/web/src/app/**` (App Router routes + Server Actions) | Vitest + Playwright (instrumented) | line **70%** + 主要フロー E2E | UI のため line ではなく flow で評価 |
| `app/harness/**` (既存 W0-Week1 完成) | Vitest --coverage | 既存 90% 維持 | regression 防止 |
| `app/claude-bridge/**` (既存 W0-Week1 完成) | Vitest --coverage | 既存 85% 維持 | regression 防止 |
| `app/orchestrator/**` (W1 新規) | Vitest --coverage | line **80%** | testing-policy Level 3 |
| `app/sandbox/**` (W1 新規) | Vitest + Vercel Sandbox 実行 | line **70%** | 副作用テストのため line 計測限界 |
| `app/audit/**` (W2 新規) | Vitest + pgTAP | line **80%** + chain 検証 100% | 監査基盤の重要度 |
| `app/notify/**` (W1 新規) | Vitest (mock Slack) | line **70%** | 外部依存のため mock 中心 |
| `app/supabase/policies/**` (RLS) | pgTAP | 105 ケース全カバー | RLS path 100% |
| `app/policies/casbin/**` | casbin matrix runner | 105 ケース全カバー | enforcer path 100% |
| `app/supabase/migrations/**` | pgTAP (trigger / fn) | trigger / fn 各 100% | hash chain trigger / append_audit_log fn 等 |
| **全 workspace 加重平均** | Vitest 集約 + pgTAP 集約 | **80%** | Phase 1 DoD |

### §4.2 計測方法

**Vitest 集約**:
```bash
pnpm -r test --coverage  # 全 workspace で coverage 取得
# istanbul-lib-coverage で merge → coverage/coverage-summary.json
```

CI で `coverage-summary.json` を pull し、`projects/PRJ-019/reports/coverage-weekly.md` に週次更新。

**pgTAP 集約**:
```bash
pg_prove -d clawbridge_staging tests/pgtap/**/*.sql
# tap-junit で JUnit XML 出力 → GitHub Actions で表示
```

**Casbin 集約**:
```typescript
// tests/casbin-matrix.ts
const matrix = generateMatrix(roles, categories, actions);  // 105 cases
matrix.forEach(({sub, obj, act, expected}) => {
  expect(enforcer.enforce(sub, obj, act)).toBe(expected);
});
```

### §4.3 80% を測る上での重要ポイント

1. **行 (line) と分岐 (branch) の両方** で 80%。line だけ高くて branch が低い場合は再修正
2. **Critical path は 100%** — `hash-chain.ts` の `verifyChain` / `append_audit_log` SECURITY DEFINER fn / Casbin deny envelope は 100% カバー必須
3. **Mock の比率**: Unit 70% は mock 多用可 / Integration 20% は実 DB / Casbin 必須 / E2E 10% は実 Supabase staging + 実 Vercel preview
4. **regression**: W1〜W3 で書いたテストは全週で再実行 (W4 で全件緑必須)

### §4.4 80% 未達の場合のエスカレーション

- **78〜79%**: Phase 1 完了延期 1 週間 (DEC-019-023 TR-3 ルール準用)
- **75〜77%**: Phase 1 完了延期 2 週間 + 不足領域の特定 + W5 で集中対応
- **70% 未満**: Phase 1 完了延期 + Phase 2 計画書再起案 + CEO + Owner 緊急協議

---

## §5 CI 構成 (GitHub Actions、月額無料枠内)

### §5.1 ジョブ構成

```yaml
# .github/workflows/ci.yml (Phase 1 W1 で実装)
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 18 * * *'  # 毎日 03:00 JST nightly

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r lint
      - run: pnpm -r typecheck
      - run: pnpm casbin-policy-lint  # 自製 lint script
      - run: pnpm rls-policy-lint     # sqlfluff + 自製 RLS lint

  unit:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - run: pnpm -r test --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  integration-db:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.6.1
        env: { POSTGRES_PASSWORD: postgres }
        ports: ["5432:5432"]
    steps:
      - run: pnpm migrate
      - run: pg_prove -d $DATABASE_URL tests/pgtap/**/*.sql
      - run: pnpm test:integration

  e2e:
    needs: [unit, integration-db]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm playwright install chromium
      - run: pnpm test:e2e

  pen-test:
    if: github.event_name == 'schedule'  # nightly のみ
    needs: e2e
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:pen-test  # drill #3 5 シナリオ + Pen Test #1/#2

  zero-side-effect:
    if: github.event_name == 'schedule'  # nightly のみ
    needs: e2e
    runs-on: ubuntu-latest
    steps:
      - run: bash scripts/verify-zero-side-effect.sh
```

### §5.2 月次想定実行時間 / 料金

| ジョブ | 実行時間 | 月次回数 | 月次計 |
|---|---|---|---|
| lint | 3 分 | 90 (PR 30 + nightly 30 + push 30) | 270 分 |
| unit | 5 分 | 90 | 450 分 |
| integration-db | 8 分 | 60 (PR + push) | 480 分 |
| e2e | 6 分 | 60 (PR + push) | 360 分 |
| pen-test | 15 分 | 30 (nightly のみ) | 450 分 |
| zero-side-effect | 2 分 | 30 (nightly) | 60 分 |
| **合計** | — | — | **2,070 分** |

GitHub Actions Hobby 無料枠 = **2,000 分/月**。**70 分超過**

**対策**:
1. PR ごとに pen-test をスキップ (現案で実装済)
2. integration-db を `paths: app/supabase/**` filter で migration 変更時のみに限定 → 480 分 → 200 分 / 月 (実測想定)
3. nightly を週 5 回に削減 (土日省略) → pen-test 450 分 → 320 分 / 月

修正後想定: 1,800 分 / 月 (200 分 buffer 残し)

### §5.3 secret 取扱 in CI

| Secret | GitHub Secret 名 | スコープ |
|---|---|---|
| `SUPABASE_DB_URL` (staging) | `SUPABASE_STAGING_DB_URL` | integration-db / e2e |
| `SUPABASE_SERVICE_ROLE_KEY` (staging) | `SUPABASE_STAGING_SERVICE_KEY` | e2e のみ |
| `VERCEL_TOKEN` | `VERCEL_TOKEN` | preview deploy のみ (E2E) |

**重要**: production の service_role key は CI に **絶対に置かない**。staging key のみ。security-w0 §6 準拠。

---

## §6 mock-claude 基盤との連携

### §6.1 mock-claude の役割 (DEC-019-020 採択済)

| シナリオ (既存 5) | 用途 |
|---|---|
| `success` | 通常 happy path テスト |
| `auth_failed` | exit 1 + "credential" stderr / OAuth 失敗ハンドリング |
| `rate_limit_429` | exit 0 + 429 stream-json error / リトライ + circuit breaker |
| `silent_revoke` | exit 1 + "401 Unauthorized" / BAN 検知 |
| `slow` | 5 秒スリープ / timeout / TimeSource pattern |

### §6.2 W0-Week2〜Phase 1 W1 で追加するシナリオ (drill #3 連動)

| 追加シナリオ | 用途 | 実装期限 |
|---|---|---|
| `privilege_escalation_a` | Direct Write to policy_versions / hitl_requests を試行 | W0-Week2 末 (5/22 リハーサル前) |
| `privilege_escalation_b` | audit_log DELETE / UPDATE / hash chain 切断を試行 | 同上 |
| `privilege_escalation_c` | env / /proc / inspector / core / parent env から service_role key 窃取試行 | 同上 |
| `privilege_escalation_d` | DNS spoofing / FS write / Realtime broadcast / race / TLS downgrade 試行 | 同上 |
| `privilege_escalation_e` | 提案書 / Slack reply / changelog に prompt injection 埋込み | 同上 |

合計 10 シナリオで Phase 1 全テスト基盤に統合。

### §6.3 mock-claude vs RealStub vs Live test の使い分け

| テスト層 | 使用 backend | 例 |
|---|---|---|
| Unit | mock-claude `success` (固定 response) | hash-chain.ts / hitl validator |
| Integration (大半) | mock-claude 5+5 シナリオ | RLS / Casbin / drill #3 シナリオ |
| Integration (live) | RealStub (実 `claude --version` のみ) | CB-D-W0-06 live integration test |
| E2E | mock-claude `success` + Vercel staging | HN→preview happy path |
| Pen Test | mock-claude `privilege_escalation_*` | Pen Test #1/#2 |

### §6.4 TimeSource pattern による決定論

`harness/src/time-source.ts` の TimeSource を全 workspace に拡張:
- `app/web/src/lib/openclaw-wrapper/` の CircuitBreaker (P1-2 で修正)
- `app/web/src/lib/audit/hash-chain.ts` の test 内 ts injection
- `app/orchestrator/` の SLA timer (Phase 1 W1 新規)

これにより BAN drill / Pen Test の SLA 検証 (1 分 / 5 分 / 30 分等) が決定論的に再現可能、libfaketime 不要。

---

## §7 BAN drill #1 / #3 のテスト統合

### §7.1 drill #1 (DEC-019-019、5/13) の Phase 1 テスト統合

| drill #1 シナリオ | Phase 1 Integration test 化 | 実装期限 |
|---|---|---|
| ハッピーパス | `tests/integration/ban-drill/happy-path.test.ts` | W1 |
| 異常 A: Anthropic 警告メール先着 | `tests/integration/ban-drill/abnormal-a.test.ts` (mock-claude `silent_revoke` + Slack mock) | W1 |
| 異常 B: silent revocation | `tests/integration/ban-drill/abnormal-b.test.ts` | W1 |
| 異常 C: rate limit 429 誤検知 | `tests/integration/ban-drill/abnormal-c.test.ts` (mock-claude `rate_limit_429`) | W1 |
| 異常 D: HITL 通知遅延 | `tests/integration/ban-drill/abnormal-d.test.ts` | W2 |
| 異常 E: P-E フォールバック起動失敗 | `tests/integration/ban-drill/abnormal-e.test.ts` | W2 |

drill #1 当日の実機実施 (5/13) で得た evidence を test fixture に組込み、CI で常時再実行可能化。

### §7.2 drill #3 (本書 / 5/22-5/24 + 5/29) の Phase 1 テスト統合

| drill #3 シナリオ | Phase 1 Integration test 化 | 実装期限 |
|---|---|---|
| A: Direct Write | `tests/integration/privilege-escalation/a-direct-write.test.ts` | W1 (drill #3 直後) |
| B: Log Tampering | `tests/integration/privilege-escalation/b-log-tampering.test.ts` | W1 |
| C: Key Exfiltration | `tests/integration/privilege-escalation/c-key-exfiltration.test.ts` | W1 |
| D: Fetch Spoofing | `tests/integration/privilege-escalation/d-fetch-spoofing.test.ts` | W1 |
| E: Owner Manipulation | `tests/integration/privilege-escalation/e-owner-manipulation.test.ts` (UI 部分は Playwright) | W2 |

drill #3 が CI nightly job に組込まれることで、Phase 1 W2-W4 で実装する新コードが「無意識に 4 層防御を破る」のを早期発見。

### §7.3 Pen Test #1 / #2 のテスト統合

- **Pen Test #1 (5/30-5/31、36 攻撃)**: drill #3 の 5 シナリオを × 3 variation (race / batch / nested) で展開、`tests/pen-test/level-1/*.test.ts` 36 ファイル
- **Pen Test #2 (6/13-6/14、47 攻撃)**: PE-01〜12 全派生 + 7 カテゴリ境界、`tests/pen-test/level-2/*.test.ts` 47 ファイル
- 両者とも CI nightly で常時実行、Phase 1 完了後も Phase 2 開発時の regression 検出に転用

---

## §8 Phase 1 終了時のテスト検収条件

### §8.1 必須条件 (全 Pass で Phase 1 完了承認)

| ID | 条件 | 検証 |
|---|---|---|
| **D-1** | 累計テスト件数 ≥ 600 | Vitest + pgTAP + Casbin + Playwright 集計 |
| **D-2** | line/branch coverage 加重平均 ≥ 80% | coverage-summary.json |
| **D-3** | Critical path (hash chain / append_audit_log / Casbin deny envelope) coverage 100% | coverage 個別レポート |
| **D-4** | drill #3 5 シナリオ全 reject (CI nightly 再現) | nightly 30 連続成功 |
| **D-5** | Pen Test #1 36 攻撃 + #2 47 攻撃 全 reject | weekly 4 連続成功 |
| **D-6** | RLS 105 ケース全 expected | pgTAP green |
| **D-7** | Casbin 105 マトリクス全 expected | matrix runner green |
| **D-8** | FN-Black 2 回目 F1 ≥ 0.88 + false negative ≤ 3% | Phase 1 W4 評価 |
| **D-9** | 10 連続成功率 ≥ 80% (HN→preview) | DEC-019-023 TR-3 整合 |
| **D-10** | verify-zero-side-effect 月次最終 = 0 件 | 副作用 0 確認 |

### §8.2 副次条件 (Phase 2 着手の前提)

| ID | 条件 | 検証 |
|---|---|---|
| S-1 | TypeScript strict full pass (DEC-019-041 ARCH-01 Phase B) | tsc --noEmit error 0 |
| S-2 | ESLint full pass | eslint error 0 |
| S-3 | Casbin policy lint pass (P0-3 防止) | 自製 lint pass |
| S-4 | RLS policy lint pass (`for all` 0 件) | sqlfluff + 自製 lint pass |
| S-5 | gitleaks scan で secret 漏洩 0 件 | gitleaks pass |
| S-6 | Knowledge Extraction PII redact false negative < 1% (sample 100) | KE-04 月次 audit |

### §8.3 D-1〜D-10 全 Pass しない場合のエスカレーション

| 失敗数 | 判定 | アクション |
|---|---|---|
| 0 件 | **Phase 1 完了 (Phase 2 Go)** | DEC-019-023 TR-3 発動 (Phase 2 計画書 = PM v5 起案) |
| 1〜2 件 | **条件付き完了** (Phase 2 着手前に追加修正) | 1〜2 週間延期 |
| 3〜5 件 | **延期** | 1 ヶ月延期、Phase 1 W5 設置 |
| 6 件以上 | **Phase 1 中止検討** | CEO + Owner 緊急協議 |

### §8.4 Phase 1 完了レビュー (6/13 想定) で Review 部門が確認する 5 観点

1. **テスト件数 (605 想定)**: Vitest + pgTAP + Casbin + Playwright 全集計、報告ファイル `review-phase1-test-completion.md` 起案
2. **Coverage (80%)**: 加重平均 + Critical path 100% 確認
3. **drill #3 + Pen Test 全 reject 維持**: nightly 過去 30 日全緑
4. **副作用ゼロ**: PRJ-001〜018 への commit / Vercel deploy / Supabase 行差分 0 件
5. **依存ライブラリ脆弱性**: Snyk / Trivy 月次 scan で Critical / High 0 件

---

## §9 Phase 2 への引継ぎ事項 (Phase 1 完了後)

### §9.1 Phase 1 で達成しなかった追加テスト課題 (Phase 2 で対応)

| ID | 内容 | 想定 Phase 2 着手 |
|---|---|---|
| Mutation testing (Stryker) | hash-chain / Casbin 限定で導入 | Phase 2 W1 |
| Property-based testing (fast-check) | hitl validator / canonical JSON で導入 | Phase 2 W2 |
| Load testing (k6) | HITL queue + audit_log の 1000 行/秒 INSERT | Phase 2 W3 |
| 外部委託 Pen Test | $10,000 予算化、外部 pen-tester で深度 attack | Phase 2 Q4 |

### §9.2 Phase 1 で確立した基盤の Phase 2 での再利用

| 基盤 | Phase 2 での用途 |
|---|---|
| mock-claude 10 シナリオ | Phase 2 で「規模拡大時の attack surface」を試験する基盤 |
| TimeSource pattern | Phase 2 全 workspace で時刻決定論担保 |
| pgTAP RLS 105 ケース | Phase 2 で増える policy 変更時の regression 防止 |
| drill #3 + Pen Test #1/#2 nightly | Phase 2 開発時の continuous security validation |
| 80% coverage 基準 | Phase 2 でも維持 (低下時はリファクタ強制) |

---

**v1 完成**: 2026-05-03 (Review 部門起案、Phase 1 5/26-6/20 全期テスト戦略)
**次回更新**: Phase 1 W1 着手 (5/26) 直前、または 5/8 検収会議で議決-2/5 結果反映

**根拠ファイル**: `organization/rules/testing-policy.md` (Level 3)、`projects/PRJ-019/decisions.md` DEC-019-020 / DEC-019-023 / DEC-019-033 / DEC-019-041、`projects/PRJ-019/reports/review-r019-15-mitigation-plan-v2.md` §5 §9、`projects/PRJ-019/reports/review-scaffold-code-review-v1.md` §6、`projects/PRJ-019/reports/review-ban-drill-3-scenario.md` §2 §3、`projects/PRJ-019/reports/dev-w0-week1-evidence-and-mockclaw.md` (mock-claude 5 シナリオ実装)
