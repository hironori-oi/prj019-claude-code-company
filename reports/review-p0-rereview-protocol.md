# PRJ-019 — P0 Finding 4 件 再評価プロトコル

最終更新: 2026-05-03 / 起案: Review 部門 / 対象: Dev + Owner + 5/8 検収会議

位置付け: scaffold code review v1 (`review-scaffold-code-review-v1.md` §3.1) で確定した P0 finding 4 件 (P0-1 hash chain ロック競合 / P0-2 canonical JSON DB-Node 不一致 / P0-3 Casbin glob 非対応 / P0-4 13 prohibited domains role-wildcard 化欠落) を Dev が修正完了した後、Phase 1 着手前 readiness を 95% から 99% へ押し上げるための 4 ステップ再評価プロトコル。DEC-019-042 で確定した 5/22 期限に先立ち、5/4-5/7 の早期再評価で 5/8 検収会議に「P0 全件 closed + scaffold 完全承認」報告を可能にする狙い。

連動: `review-scaffold-code-review-v1.md` §3.1 §7 §8 / `review-r019-15-mitigation-plan-v2.md` §10.2 (3 条件) / `review-test-strategy-phase1.md` §3.1 (W1-T1〜T6) / `review-ban-drill-3-scenario.md` §2 (5 シナリオ)
連動 DEC: DEC-019-033 §⑤ (4 層防御) / DEC-019-042 (5/22 期限) / DEC-020-003 (HITL 8 owner_input_review)
連動 ODR: OG-04 / OG-05

---

## 目次

| § | 題目 |
|---|---|
| §1 | 再評価対象 (P0-1〜P0-4 finding 詳細) |
| §2 | 再評価フロー 4 ステップ |
| §3 | P0 別再評価チェックリスト |
| §4 | 検証ツール (静的 + 動的) |
| §5 | Pass / Fail 判定基準 + 再修正サイクル |
| §6 | SLA (合計 72h 以内) |
| §7 | 全 P0 closed 後の完全承認プロセス |
| §8 | 5/8 検収会議報告スライド構成 |

---

## §1 再評価対象 (P0-1〜P0-4 finding 詳細)

### §1.1 P0-1: hash chain INSERT のロック競合可能性

| 項目 | 内容 |
|---|---|
| 該当ファイル / 行 | `app/supabase/policies/02_audit_log.sql:42-65` (`append_audit_log` SECURITY DEFINER fn) |
| 該当 migration | `app/supabase/migrations/20260503000002_audit_log.sql:38-53` (`audit_log_compute_hash` trigger) |
| 詳細 | 並行 INSERT 2 件が同時に `select coalesce(curr_hash, ...) from audit_log order by id desc limit 1` を読むと、両方が同じ prev_hash を取得し片方が `audit_no_branch unique(prev_hash)` で失敗 → 失敗側が retry しなければ chain が虫食いになる |
| 推奨修正 | `select ... for update` でテナント単位ロック取得、または advisory lock (`pg_advisory_xact_lock(hashtext(p_tenant_id::text))`) で完全直列化、retry policy も append_audit_log fn 内に組込み |
| Critical 度 | Blocker — L3 Hash Chain 防御層が崩壊、ベクトル (b) Audit Log Tampering 防御不可能化 |

### §1.2 P0-2: canonical JSON の DB-Node 不一致

| 項目 | 内容 |
|---|---|
| 該当ファイル / 行 | `app/web/src/lib/audit/hash-chain.ts:37-48` (`canonicalize`) と `app/supabase/migrations/20260503000002_audit_log.sql:38-53` (`audit_log_compute_hash`) |
| 詳細 | Node 側は `JSON.stringify(rec.payload)` (V8 挿入順)、DB 側は `new.payload::text` (Postgres 内部形式)。両者は キー順 / 空白 / 数値表現 が一致しない可能性、`verifyChain()` が常時失敗する潜在バグ |
| 推奨修正 | (a) RFC 8785 JCS 互換 canonicalize を Node / DB 双方で実装 / (b) Node 側で生成して DB INSERT 前に確定済 canonical 文字列を渡す (推奨) |
| Critical 度 | Blocker — L3 Hash Chain verify が常時失敗、改ざん検出機構が機能不全 |

### §1.3 P0-3: Casbin matcher で `?(...)` glob 非対応

| 項目 | 内容 |
|---|---|
| 該当ファイル / 行 | `app/policies/casbin/policy.csv:73` (`p, restricted_role, command:curl?(http://*), exec, deny`) |
| 詳細 | Casbin v5 の keyMatch4 は `*` `{}` `:`(named) のみ対応。`?(http://*)` は無効パターンとして扱われ、http URL 経由の curl が deny されない、L1 静的 policy 層が崩壊 |
| 推奨修正 | `command:curl http://*` (空白区切り) または `command:curl, exec, deny` を全面禁止し HTTPS curl は HITL 7 (external_api) 経由を強制 |
| Critical 度 | Blocker — L1 Casbin 防御層が崩壊、ベクトル (a) Direct Write の入口になりうる |

### §1.4 P0-4: 13 prohibited domains の `restricted_role` 限定問題

| 項目 | 内容 |
|---|---|
| 該当ファイル / 行 | `app/policies/casbin/policy.csv:54-66` |
| 詳細 | 13 deny は `p, restricted_role, genre:adult, *, deny` の形で restricted_role にのみ deny。Owner / operator が Casbin 経由で genre:adult を作業した場合 deny されない、design doc §0「Owner UI でも解除不可」との不整合 |
| 推奨修正 | (a) 全ロール対象に拡張 `p, *, genre:adult, *, deny` / (b) 別 role `prohibited` 集約 + `g, owner, prohibited` / `g, operator, prohibited` / `g, open_claw_restricted, prohibited` |
| Critical 度 | Blocker — 永遠 deny envelope の根本原則が破られる、Owner UI 解除不可保証が崩壊 |

---

## §2 再評価フロー 4 ステップ

### §2.1 全体像

```
Dev PR 提出 (Step 1)
    ↓ 24h 以内
Review 静的レビュー (Step 2)
    ↓ 24h 以内
Owner ローカル動作確認 (Step 3) ← review-owner-verification-procedure.md 連動
    ↓ 24h 以内
Review 最終承認 (Step 4)
    ↓ 全 P0 closed
scaffold 完全承認 (条件付き → 無条件)
```

### §2.2 Step 1: Dev PR 提出 (T+0)

| 項目 | 内容 |
|---|---|
| 担当 | Dev (P0 修正担当者、複数人並列可) |
| 提出物 | (a) GitHub PR (target = main、source = `fix/p0-NNN-<slug>`) / (b) PR description に該当 P0 番号 + 推奨修正方針との対応 + 自己テスト結果 / (c) 修正対象ファイルのみ commit (混入禁止) |
| 命名規則 | PR title = `fix(prj-019): P0-N <短い説明>` (例 `fix(prj-019): P0-1 advisory lock for append_audit_log`) |
| ラベル | `prj-019` `p0-rereview` `phase1-blocker` |
| 自己テスト最低条件 | (a) Vitest 該当ファイル全 pass / (b) tsc --noEmit error 0 / (c) ESLint error 0 / (d) 該当 P0 関連の pgTAP / Casbin matrix が緑 |
| 通知 | Review 部門の Slack `#prj-019-review` channel に PR URL + 自己テスト結果スクショ |

### §2.3 Step 2: Review 静的レビュー (T+24h)

| 項目 | 内容 |
|---|---|
| 担当 | Review 部門 (scaffold review v1 起案者と同一が望ましい、最低でも Dev とは別エージェント) |
| 作業 | (a) PR diff を § 3 該当 P0 チェックリスト全項目で照合 / (b) 副作用 / 隣接モジュールへの不本意な変更を確認 / (c) §4.1 静的ツール 4 種を順に実行 / (d) ESLint + tsc + Casbin lint + RLS lint 全 pass を確認 |
| 成果物 | PR コメント (GitHub review) で項目別 pass / fail マーク + Review 全体所感 |
| 結論 3 択 | (a) **OK** = Step 3 へ進む / (b) **要修正** = PR に Dev 宛て request changes、Step 1 に戻る / (c) **要再設計** = scaffold review v1 を再起案、CEO escalation |

### §2.4 Step 3: Owner ローカル動作確認 (T+48h)

| 項目 | 内容 |
|---|---|
| 担当 | Owner (CEO 経由で本人実機検証) |
| 手順書 | `review-owner-verification-procedure.md` (本日同時起案) |
| 範囲 | 本タスクの P0 4 件に対応する 4 観点: Casbin policy 動作 (P0-3, P0-4) / hash chain 改ざん検知 (P0-1, P0-2) / RLS Policy 効果 (横断) / kill switch 即時遮断 (横断) |
| 成果物 | `review-owner-verification-procedure.md` §7 報告テンプレに沿った Markdown 1 通、CEO 経由で Review 部門へ |
| 結論 3 択 | (a) **動作 OK** = Step 4 へ / (b) **動作 NG** = Step 1 に戻る / (c) **環境差異で再評価不可** = Review が staging で代替検証 |

### §2.5 Step 4: Review 最終承認 (T+72h)

| 項目 | 内容 |
|---|---|
| 担当 | Review 部門 |
| 作業 | (a) Step 2 静的 OK + Step 3 動作 OK の双方を確認 / (b) PR に approve review / (c) `review-scaffold-code-review-v1.md` の §3.1 表に「P0-N: closed (PR #XXX, YYYY-MM-DD)」を追記 / (d) 4 件全 closed の場合は §7 完全承認プロセスへ |
| 成果物 | (a) GitHub PR approve / (b) `review-p0-rereview-result-PN.md` (各 P0 別、本プロトコル §3 チェックリスト埋戻し版) / (c) Slack 通知 (CEO + Owner + Dev) |
| マージ承認 | Dev が main へ squash merge、tag `prj-019/scaffold-p0-fix-N` を打つ |

---

## §3 P0 別再評価チェックリスト

各 P0 につき 5-10 項目の Pass / Fail マーカー方式。Step 2 静的レビューで全項目を埋める。

### §3.1 P0-1: hash chain INSERT ロック競合 (8 項目)

| # | チェック項目 | 検証方法 |
|---|---|---|
| 1 | `append_audit_log` SECURITY DEFINER fn に `pg_advisory_xact_lock(hashtext(p_tenant_id::text))` 呼出が存在 | grep + 行番号特定 |
| 2 | advisory lock の解放は transaction commit/rollback による暗黙解放で確実 (明示 unlock なし) | コード読解 |
| 3 | 同一 fn 内に retry policy (max 3 回 / 50ms 間隔程度) が組込まれている | grep + 設計確認 |
| 4 | retry 上限超過時に `audit_log` への `event_kind = 'hash_chain_lock_timeout'` 記録 | 設計確認 |
| 5 | pgTAP test `tests/pgtap/audit_log_concurrent_insert.sql` で 100 並行 INSERT が全成功 + chain 連続性 100% | pg_prove 実行 |
| 6 | pgTAP test 中で `audit_no_branch unique(prev_hash)` violation が 0 件 | pg_prove 実行 |
| 7 | 既存 RLS Policy (`02_audit_log.sql`) との整合 (revoke insert/update/delete from anon, authenticated 維持) | diff |
| 8 | `app/supabase/migrations/` に新規 migration として追加されている (既存 migration 修正でなく) | ls |

**Pass 条件**: 8/8 項目 OK
**Fail 条件**: 1 項目でも NG

### §3.2 P0-2: canonical JSON DB-Node 不一致 (10 項目)

| # | チェック項目 | 検証方法 |
|---|---|---|
| 1 | 採用方針 (a)JCS 双方実装 / (b)Node 側確定→DB 渡し のいずれかが PR description に明示 | PR 確認 |
| 2 | Node 側 `canonicalize` 関数が RFC 8785 (JCS) 準拠 (キー昇順 + UTF-8 + 数値正規化) | コード読解 |
| 3 | DB 側 trigger が Node が渡した canonical 文字列を hash 計算する (`payload::text` 直参照を停止) | grep |
| 4 | `verifyChain()` が Node / DB 両方で生成した hash を比較し一致確認 | コード読解 |
| 5 | Vitest unit test で 5 種代表 payload (空 obj / 配列 / nested / unicode / 数値境界) が全て round-trip | pnpm test 実行 |
| 6 | pgTAP test で同 5 種 payload が DB-Node 一致 | pg_prove 実行 |
| 7 | TypeScript 型で `CanonicalString = string & { __canonical: true }` のような branded type が導入されている (推奨) | grep |
| 8 | 既存 hash-chain.ts ユニット 30 cases (W1-T1) 全 pass | pnpm test 実行 |
| 9 | 改ざん検出テスト (1 row 改ざん → verify fail) が緑 | pnpm test 実行 |
| 10 | エラーメッセージで「canonical mismatch at id=X」のように原因特定可能 | コード読解 |

**Pass 条件**: 10/10 項目 OK
**Fail 条件**: 1 項目でも NG (特に 5, 6 は致命)

### §3.3 P0-3: Casbin glob 非対応 (7 項目)

| # | チェック項目 | 検証方法 |
|---|---|---|
| 1 | `policy.csv:73` の `?(...)` 構文が削除されている | grep |
| 2 | 代替実装が `command:curl, exec, deny` (全面禁止) または `command:curl http://*` (空白区切り) のいずれか | grep |
| 3 | HTTPS curl が必要な場合の HITL 7 external_api 経由パスが design doc または README に明示 | grep |
| 4 | Casbin enforcer test (W1-T6 105 マトリクス) で `curl http://example.com` / `curl https://api.openai.com` 双方 deny | pnpm test |
| 5 | Casbin policy lint script (新規作成) が `?(...)` 等の非対応 glob を検知し fail | lint 実行 |
| 6 | 13 prohibited domains 内の URL 系 deny が同様の問題を抱えていないか走査済 | lint 実行 |
| 7 | 修正後の policy.csv が `model.conf` の matcher と論理的に整合 (deny envelope 維持) | コード読解 |

**Pass 条件**: 7/7 項目 OK
**Fail 条件**: 1 項目でも NG

### §3.4 P0-4: 13 prohibited domains role 限定 (8 項目)

| # | チェック項目 | 検証方法 |
|---|---|---|
| 1 | 採用方針 (a)wildcard 化 / (b)prohibited 集約 role のいずれかが PR description に明示 | PR 確認 |
| 2 | 13 deny ルールが全ロール対象 (owner / operator / open_claw_restricted) に適用される | grep + matrix test |
| 3 | Casbin enforcer test で owner role が genre:adult / csam / weapon / drug / extremism / piracy / hacking / phishing / scam / hate / harassment / political-manip / fake-news の 13 全てで deny | pnpm test |
| 4 | 同様に operator role でも 13 全 deny | pnpm test |
| 5 | 同様に open_claw_restricted role でも 13 全 deny | pnpm test |
| 6 | Owner UI に「13 deny は解除不可」表示が実装計画に含まれる (Phase 1 W1 着手前提として記載) | grep design doc |
| 7 | policy.csv 行数が変更後も健全 (重複なし、コメント整合) | diff |
| 8 | `app/policies/casbin/README.md` (or 同等) に「永遠 deny envelope」原則が明文化 | grep |

**Pass 条件**: 8/8 項目 OK
**Fail 条件**: 1 項目でも NG (特に 3, 4, 5 は致命)

---

## §4 検証ツール

### §4.1 静的レビューツール (Step 2 で必須)

| ツール | 用途 | 期待結果 |
|---|---|---|
| **ESLint** ^9.17 (eslint-config-next) | TS / React lint | error 0 / warning 0 (修正範囲のみ) |
| **tsc --noEmit** (TypeScript 5.x strict) | 型チェック | error 0 |
| **Casbin policy lint script** (自製、`scripts/lint-casbin-policy.mjs`) | `?(...)` 等の非対応 glob 検知 + 13 prohibited domains 全ロール対象確認 | lint pass + 13 deny coverage 100% |
| **sqlfluff** + 自製 RLS lint | RLS policy で `for all` 検知 / `with check` 漏れ | lint pass |
| **gitleaks** | secret 漏洩検知 | finding 0 |

実行コマンド:
```bash
pnpm -r lint
pnpm -r typecheck
pnpm casbin-policy-lint
pnpm rls-policy-lint
gitleaks detect --source . --no-banner
```

### §4.2 動的検証ツール (Step 2 後半 + Step 3 で使用)

| ツール | 用途 | 期待結果 |
|---|---|---|
| **Vitest** ^2.x (V8 coverage) | hash-chain.ts / openclaw-wrapper / hitl validators unit | line/branch 100% (該当 P0 関連) |
| **pgTAP** ^1.3 (Supabase staging) | append_audit_log 並行 INSERT / RLS 105 ケース | pg_prove 全緑 |
| **Casbin matrix runner** (`tests/casbin-matrix.ts`) | 7 category × 5 action × 3 role = 105 ケース | 全 expected |
| **Playwright** ^1.49 | scaffold smoke E2E (`/dashboard` / `/proposals` 表示) | 5 cases pass |

実行コマンド:
```bash
pnpm test --coverage
pg_prove -d $STAGING_DB_URL tests/pgtap/**/*.sql
pnpm test:casbin-matrix
pnpm test:e2e -- --grep="scaffold smoke"
```

### §4.3 ツール実行時間想定

| ツール | 実行時間 | Step |
|---|---|---|
| ESLint + tsc | 3 分 | 2 |
| Casbin lint + RLS lint + gitleaks | 1 分 | 2 |
| Vitest unit (該当範囲のみ) | 2 分 | 2 |
| pgTAP (該当 P0 関連) | 5 分 | 2 |
| Casbin matrix 105 | 1 分 | 2 |
| Playwright smoke | 4 分 | 2 |
| **Step 2 合計** | **16 分** | — |

---

## §5 Pass / Fail 判定基準 + 再修正サイクル

### §5.1 P0 単位の Pass / Fail

| 判定 | 条件 |
|---|---|
| **Pass** | §3 該当 P0 のチェックリスト全項目 OK + §4.1 静的全 pass + §4.2 動的全緑 + Owner Step 3 動作 OK |
| **Conditional Pass** | §3 チェックリスト 1 項目のみ minor (例 §3.4 #8 README 記載漏れ) で動作影響なし → Step 4 で approve、別 follow-up issue で対応 |
| **Fail** | §3 1 項目以上の Critical NG / 静的 fail / 動的 fail / Owner 動作 NG |

### §5.2 再修正サイクル (最大 2 サイクル)

```
Cycle 1: Dev 初回 PR (T+0) → Review (T+24h) → Owner (T+48h) → Approve (T+72h)
                                ↓ Fail
Cycle 2: Dev 再 PR (T+24h) → Review (T+48h) → Owner (T+72h) → Approve (T+96h)
                                ↓ Fail
Cycle 3 = Escalation: CEO + Owner 緊急協議 (T+96h+)
```

### §5.3 Cycle 別の判定ルール

| Cycle | 判定 | アクション |
|---|---|---|
| **Cycle 1 Pass** | 通常承認 | scaffold review v1 §3.1 表に「closed (cycle 1)」を追記 |
| **Cycle 1 Fail → Cycle 2 Pass** | 通常承認 | 同上「closed (cycle 2)」追記、根本原因を `dev-w0-week2-bootstrap.md` 等の lessons-learned に追記 |
| **Cycle 2 Fail** | **Escalation** | (a) CEO に即時報告 / (b) 該当 P0 を「修正不能 / 設計問題」と判定 / (c) Phase 1 着手延期検討 (DEC-019-023 TR-1 ルール準用 = 1 週間延期) / (d) scaffold review v2 を再起案 |
| **Cycle 3** (Cycle 2 Fail 後の追加試行) | 原則行わない | Cycle 2 で Fail なら escalation 優先、追加試行は Phase 1 着手 1 週間延期確定後のみ |

### §5.4 4 件の P0 同時並行判定

P0-1〜P0-4 は独立に判定する。3 件 closed + 1 件 Cycle 2 Fail → escalation の場合、3 件は先に scaffold review v1 §3.1 に「closed」を反映、残 1 件のみ追加対応とする。完全承認 (§7) は 4 件全 closed が前提。

---

## §6 SLA (合計 72h 以内)

### §6.1 Cycle 1 SLA

| Step | 開始 | 期限 (T+) | 担当 |
|---|---|---|---|
| Step 1 (Dev PR 提出) | Dev 修正完了 | T+0 (基点) | Dev |
| Step 2 (Review 静的) | T+0 | **T+24h** | Review |
| Step 3 (Owner 動作) | T+24h | **T+48h** | Owner |
| Step 4 (Review 最終承認) | T+48h | **T+72h** | Review |
| **合計** | — | **72h 以内** | — |

### §6.2 早期再評価スケジュール (5/4-5/7)

| 日 | 想定 P0 | Step | 担当 |
|---|---|---|---|
| **5/4 (月)** | P0-1 / P0-2 (hash chain 系) Dev PR 提出 | Step 1 | Dev |
| **5/5 (火)** | P0-1 / P0-2 Review 静的 + Owner 動作 | Step 2-3 | Review + Owner |
| **5/5 (火)** | P0-3 / P0-4 (Casbin 系) Dev PR 提出 (並行) | Step 1 | Dev |
| **5/6 (水)** | P0-3 / P0-4 Review 静的 + Owner 動作、P0-1 / P0-2 最終承認 | Step 2-3-4 | 全員 |
| **5/7 (木)** | P0-3 / P0-4 最終承認 + 4 件全 closed 確認 + 完全承認発行 | Step 4 + §7 | Review |
| **5/8 (金)** | 検収会議で「scaffold 完全承認 + Phase 1 readiness 99%」報告 | §8 | Review (CEO 経由) |

### §6.3 SLA 違反時のエスカレーション

| 違反内容 | 対応 |
|---|---|
| Dev が T+24h までに PR 提出できない | CEO 経由で Dev リソース確認、5/8 までに 1 件でも遅延なら 5/22 期限へ自動延長 |
| Review が T+24h までに静的レビュー完了できない | Review 内別エージェントへ分担 / 簡易チェックでまず PR コメント、詳細を 24h 後追加 |
| Owner が T+24h までに動作確認できない | Review が staging 環境で代替検証 (本来非推奨だが SLA 遵守優先) |
| 全体 72h 超過 | DEC-019-042 5/22 期限への通常運用に戻る、5/8 検収では「P0 修正進行中、5/22 までに完遂見込み」報告 |

---

## §7 全 P0 closed 後の scaffold 完全承認プロセス

### §7.1 完全承認発行の前提

`review-scaffold-final-acceptance-criteria.md` (本日同時起案) §2 完全承認 DoD 12 項目のうち **P0 関連 4 項目** が本プロトコルでカバーされる。残 8 項目 (P1 進捗 / Owner 動作確認 / 再評価通過 / etc.) は別途確認。

### §7.2 完全承認発行手順

| 手順 | 担当 | 成果物 |
|---|---|---|
| 1. P0-1〜P0-4 全件「closed」を `review-scaffold-code-review-v1.md` §3.1 表に追記 | Review | code review v1 更新 |
| 2. `review-p0-rereview-result-summary.md` を新規起案 (4 件分の re-review result を 1 ファイルに統合) | Review | 新規ファイル |
| 3. `review-scaffold-final-acceptance-criteria.md` §2 DoD 12 項目を埋戻し (P0 4 件は全 OK 確実、その他 8 項目を確認) | Review | acceptance criteria 更新 |
| 4. 8 項目中 ≥ 10/12 OK の場合: **scaffold 完全承認発行** (条件付き → 無条件) | Review | 公式判定 |
| 5. CEO 経由で Owner / Dev / 全部署へ通知 | CEO | Slack + Email |
| 6. dashboard `active-projects.md` の PRJ-019 状態を更新 (「scaffold 条件付き承認」→「scaffold 完全承認」) | PM | dashboard 更新 |
| 7. 5/8 検収会議スライド (§8) に反映 | Review + PM | スライド資料 |

### §7.3 条件付き承認 → 無条件承認の差分

| 観点 | 条件付き承認 (5/3 時点) | 無条件承認 (P0 全 closed 後) |
|---|---|---|
| Phase 1 着手 5/26 | Conditional Go (3 条件達成見込み) | **GO** (条件達成済) |
| 5/8 検収議決-2 | YES (条件付き) | **YES (無条件)** に格上げ |
| Review 部門 ongoing 関与 | 高密度 (週次以上) | 通常密度 (週次) |
| Phase 1 W1 着手の readiness | 95% | **99%** |
| residual risk score | 黄 (10/25) | **黄 (8/25)** に低下 (P0 起因の 2 点が消える) |

---

## §8 5/8 検収会議で報告する場合のスライド構成

### §8.1 想定スライド (10 枚、所要時間 12 分)

| # | スライド題目 | 内容 |
|---|---|---|
| 1 | タイトル | "P0 4 件 早期再評価結果報告 — scaffold 完全承認発行" |
| 2 | エグゼクティブサマリ | (a) P0 4 件全 closed (5/7 EOD) / (b) scaffold 完全承認発行 / (c) Phase 1 着手 5/26 GO 推奨 |
| 3 | P0 4 件の元レビュー再掲 | scaffold review v1 §3.1 の表をそのまま掲載 |
| 4 | 再評価フロー (本書 §2) | Step 1-4 + 72h SLA + 5/4-5/7 スケジュール |
| 5 | P0-1 / P0-2 (hash chain 系) 結果 | Cycle 数 + チェックリスト pass / Owner 動作確認結果 + 残課題 |
| 6 | P0-3 / P0-4 (Casbin 系) 結果 | 同上 |
| 7 | 完全承認 DoD 12 項目進捗 | `review-scaffold-final-acceptance-criteria.md` §2 表 |
| 8 | Phase 1 readiness 95% → 99% への寄与 | P0 解決 +5% / Owner 動作 +3% / Casbin 実機 +2% |
| 9 | 議決-2 推奨格上げ | Conditional Go → **無条件 GO** に格上げ可能の根拠 |
| 10 | 結論 + 次アクション | scaffold 完全承認、5/22 期限を前倒し達成、Phase 1 W1 着手予定維持 |

### §8.2 スライド作成担当 + タイムライン

| 担当 | 期限 |
|---|---|
| Review 部門 (本書起案者) が骨子作成 | 5/7 EOD |
| PM が dashboard 更新数値を提供 | 5/7 EOD |
| CEO が最終チェック + 検収会議当日プレゼン | 5/8 AM |

### §8.3 P0 closed が 5/7 までに間に合わない場合の代替スライド

P0 4 件の一部が 5/7 までに closed 不成立の場合、以下に切替:

| # | スライド題目 | 内容 |
|---|---|---|
| 1 | タイトル | "P0 4 件 再評価進捗報告 — 5/22 期限内完遂見込み" |
| 2 | サマリ | (a) P0-N closed / 残 M 件 in cycle K / (b) 5/22 までに完遂見込み (信頼度 X%) |
| 3 | 各 P0 進捗 | Cycle 何回目か / 残課題 / 修正期日 |
| 4 | 議決-2 推奨 | **Conditional Go 維持** (無条件格上げは 5/22 P0 全 closed 後) |

---

## 結論 + 次アクション

1. P0 4 件の再評価フローを 4 ステップ (Dev PR → Review 静的 → Owner 動作 → Review 最終承認) で確定、合計 SLA 72h 以内。
2. 各 P0 別チェックリスト (P0-1: 8 項目 / P0-2: 10 項目 / P0-3: 7 項目 / P0-4: 8 項目、計 33 項目) で Pass / Fail を機械的に判定可能化。
3. 早期再評価スケジュール 5/4-5/7 で 5/8 検収会議までに「scaffold 完全承認」発行を狙う、Phase 1 readiness 95% → 99%。
4. 再修正サイクルは最大 2 サイクル、3 サイクル目で CEO escalation + Phase 1 着手 1 週間延期検討。
5. P0 全 closed 後の完全承認発行で Phase 1 着手議決-2 を Conditional Go → 無条件 GO に格上げ推奨。

---

**v1 完成**: 2026-05-03 (Review 部門起案、P0 4 件再評価プロトコル)
**次回更新**: 5/7 P0 4 件 closed 確認後、または 5/8 検収会議の結果反映、または Cycle 2 Fail 発生時

**根拠ファイル**: `review-scaffold-code-review-v1.md` §3.1 §7 §8 / `review-r019-15-mitigation-plan-v2.md` §10.2 / `review-test-strategy-phase1.md` §3.1 / `review-ban-drill-3-scenario.md` §2 / `review-owner-verification-procedure.md` (本日同時起案) / `review-scaffold-final-acceptance-criteria.md` (本日同時起案) / `projects/PRJ-019/decisions.md` DEC-019-033 / DEC-019-042 / DEC-020-003
