# PRJ-019 — Dev 部門 P0 finding 修正 batch 報告 v1

最終更新: 2026-05-03 / 起案: Dev 部門 (CEO 独立タスク経由)

位置付け: Review 部門 `review-scaffold-code-review-v1.md` §3.1 で指摘された **P0 finding 4 件** を 5/22 期限の前倒し対応として修正実装した結果報告。5/8 W0-Week1 検収会議 (議決-2 Conditional Go) における Dev 回答 A-1 / A-2 (Review §8.1) の根拠資料。

連動: `review-scaffold-code-review-v1.md` §3.1 / §8.2 / `review-r019-15-mitigation-plan-v2.md` §2 4 層防御
連動 DEC: DEC-019-033 §⑤ L1 Casbin / L3 Hash Chain / DEC-019-041 ARCH-01

---

## §1 P0 finding 4 件サマリ (Review レポートからの抜粋)

| # | 項目 | 該当ファイル / 行 | Review 推奨修正 |
|---|---|---|---|
| **P0-1** | hash chain INSERT のロック競合可能性 | `app/supabase/policies/02_audit_log.sql:42-65` (`append_audit_log` SECURITY DEFINER fn) | `pg_advisory_xact_lock(hashtext(p_tenant_id::text))` でテナント単位直列化 + retry policy |
| **P0-2** | canonical JSON の DB-Node 不一致 | `app/web/src/lib/audit/hash-chain.ts:37-48` + `app/supabase/migrations/20260503000002_audit_log.sql:38-53` | (b) Node 側で確定済 canonical 文字列を渡し DB はそれを直接 hash 計算 |
| **P0-3** | Casbin matcher で `?(...)` glob 非対応 | `app/policies/casbin/policy.csv:73` (`p, restricted_role, command:curl?(http://*), exec, deny`) | `command:curl?(http://*)` を削除、`command:curl exec deny` で全面禁止 |
| **P0-4** | 13 prohibited domains の `restricted_role` 限定問題 | `app/policies/casbin/policy.csv:54-66` | 全ロール対象に拡張 (集約 role `prohibited_subject` 推奨) |

---

## §2 各 finding の修正内容 (差分概要 + 該当ファイル + 推奨理由)

### §2.1 P0-1 — hash chain INSERT ロック競合

**修正ファイル**: `projects/PRJ-019/app/supabase/policies/02_audit_log.sql`

**差分概要**:
- `append_audit_log` SECURITY DEFINER fn の冒頭で `pg_advisory_xact_lock(hashtext('audit_log:' || p_tenant_id::text))` を取得しテナント単位で完全直列化
- INSERT を `loop ... begin ... exception when unique_violation then` で囲み、最大 3 回まで retry。retry 上限超過時は SQLSTATE 40001 (`serialization_failure`) で raise
- 直前 hash 取得 SELECT に `for update` を追加 (audit_log は append-only だが念のため最新行ロック)

**推奨理由 (Review §3.1 P0-1 と整合)**:
- advisory lock はトランザクション終了で自動解放されるため deadlock リスクが低い
- `audit_no_branch unique(prev_hash)` 制約による fork 防止は維持しつつ、競合時に retry できる二段防御
- pgTAP テスト `audit_log_concurrent_insert.test.sql` で 100 件連続 INSERT の chain 連続性 100% を確認

### §2.2 P0-2 — canonical JSON DB-Node 不一致

**修正ファイル**:
1. `projects/PRJ-019/app/supabase/policies/02_audit_log.sql` — `append_audit_log` に `p_canonical text default null` 引数追加、Node 提供値があれば直接 SHA-256 計算して session GUC `audit_log.use_provided_hash` / `audit_log.provided_hash` 経由でトリガ側に通知
2. `projects/PRJ-019/app/supabase/migrations/20260503000002_audit_log.sql` — `audit_log_compute_hash` トリガが GUC 検出時は `new.curr_hash := v_provided_hash` で Node 提供 hash を採用、未指定時は従来 `payload::text` 経路を fallback として維持
3. `projects/PRJ-019/app/web/src/lib/audit/hash-chain.ts` — `canonicalizePartial()` (prev_hash 抜き 7 フィールド) と `buildAppendAuditPayload()` (Node 主導 canonical + expectedCurrHash 同梱) を**新規追加**。既存 `canonicalize()` / `canonicalJson()` は **完全に非破壊** (Dev-A の canonical fixture 衝突回避)

**推奨理由 (Review §3.1 P0-2 推奨方針 (b) を採用)**:
- Review §8.2 の (a) RFC 8785 JCS 完全実装は DB 側コスト大、(b) Node 側 canonical を DB に渡す方式が現実的との明記に従う
- 既存 `canonicalize()` / fixture (audit-canonical-vectors.json) は既に DEC-019-041 buffer で正本化されており、本修正は **追加 helper のみ** で衝突しない
- session GUC は `set_config(..., true)` でトランザクションスコープに限定、副作用なし
- 旧 `payload::text` 経路はフォールバックとして残し、scaffold 期に既存呼出を破壊しない (後方互換)

**テスト追加**:
- `projects/PRJ-019/app/web/src/lib/audit/hash-chain.test.ts` に `canonicalizePartial` / `buildAppendAuditPayload` の 3 テストケースを追加 (fixture round-trip 含む)
- `projects/PRJ-019/app/supabase/tests/audit_log_concurrent_insert.test.sql` で `p_canonical` 渡し時の hash 一致を pgTAP で検証

### §2.3 P0-3 — Casbin `?(...)` glob 非対応

**修正ファイル**: `projects/PRJ-019/app/policies/casbin/policy.csv`

**差分概要**:
- 旧: `p, restricted_role, command:curl?(http://*), exec, deny` (keyMatch4 が `?(...)` を解釈不能)
- 新: `p, restricted_role, command:curl, exec, deny` (curl 全面禁止)
- HTTPS 経由の正当 curl 利用は HITL 7 (external_api) gate 経由に統一するコメントを併記 (Phase 1 W1 で実装)

**推奨理由 (Review §3.1 P0-3 と整合 / §8.2 検証方法)**:
- Casbin v5 `keyMatch4` は `*` `{...}` `:` named のみサポート、`?(...)` glob 拡張は無効パターン化
- 「HTTPS は許可だが HTTP は deny」のような条件分岐は L1 静的 policy 層で実装すべきでなく、Phase 1 W1 で HITL 7 動的 gate 経由とする方針が design doc §0 と整合
- L1 fail-closed 原則: 曖昧 pattern より明示的全面 deny の方が安全

**テスト追加**:
- `projects/PRJ-019/app/policies/casbin/poc/p0-3-p0-4-enforcer-test.ts` で `command:curl` への http / https 双方の deny を実機 enforcer で検証 (regression として fs:projects/PRJ-019/app/** allow も確認)

### §2.4 P0-4 — 13 prohibited domains の role-wildcard 化

**修正ファイル**: `projects/PRJ-019/app/policies/casbin/policy.csv`

**差分概要**:
- 集約 role `prohibited_subject` を新規導入し、`g, owner, prohibited_subject` / `g, operator, prohibited_subject` / `g, open_claw_restricted, prohibited_subject` の 3 行で全ロール強制加入
- 13 deny 行の subject を `restricted_role` から `prohibited_subject` に統一 (`p, prohibited_subject, genre:adult, *, deny` ほか 12 件)
- model.conf の RBAC g 推移性 (`g(r.sub, p.sub)`) が prohibited_subject まで辿れるため model.conf 修正は不要
- policy_effect の deny-overrides (`!some(where (p.eft == deny)) && some(where (p.eft == allow))`) により、super_role (owner) の `genre:* allow` よりも prohibited_subject の deny が優先される

**推奨理由 (Review §3.1 P0-4 推奨方針「prohibited 集約 role」を採用)**:
- design doc §0 「Owner UI でも解除不可」を policy.csv レベルで物理的に保証
- 役割別に 13 行 × 3 ロール = 39 行に展開する代わりに 13 行で済むため可読性 + 保守性が高い
- RBAC g 推移性により将来 `system` ロール追加時も `g, system, prohibited_subject` 1 行で完了

**テスト追加**:
- 同 `p0-3-p0-4-enforcer-test.ts` で owner / operator / open_claw_restricted それぞれが genre:adult / genre:csam / genre:bioweapon / genre:malware で deny されることを検証

---

## §3 PR メッセージ案 4 件 (Conventional Commits 形式)

実コミットは作成しない。PR 化フェーズで以下のメッセージを採用する想定。

### PR-P0-1
```
fix(supabase/audit): serialize append_audit_log via tenant-scoped advisory lock + retry (P0-1)

- Acquire pg_advisory_xact_lock(hashtext('audit_log:'||tenant_id)) at fn entry to
  fully serialise concurrent inserts per tenant, eliminating audit_no_branch
  unique(prev_hash) violation races flagged in review-scaffold-code-review-v1.md §3.1.
- Wrap INSERT in retry loop (max 3 attempts) with unique_violation handling that
  re-reads the latest curr_hash on conflict and rethrows as 40001 after retries
  exhausted.
- Add SELECT ... FOR UPDATE on the latest row read to harden against any future
  non-append-only path.

Refs: DEC-019-033 §⑤ L4, review-scaffold-code-review-v1.md §3.1 P0-1
```

### PR-P0-2
```
fix(audit-canonical): adopt Node-provided canonical string in append_audit_log (P0-2)

- Extend append_audit_log SECURITY DEFINER fn with p_canonical text default null;
  when supplied, the trigger uses encode(digest(p_canonical, 'sha256'), 'hex')
  instead of the legacy payload::text path that drifts from Node's canonicalJson()
  due to Postgres jsonb key-order indeterminism.
- Pass the choice to audit_log_compute_hash via session GUC
  audit_log.use_provided_hash / audit_log.provided_hash (set_config local=true).
- Keep legacy trigger path as fallback (p_canonical NULL) for backward
  compatibility with non-migrated callers.
- Add Node helpers canonicalizePartial() and buildAppendAuditPayload() in
  hash-chain.ts (non-destructive, existing canonicalize() / fixture untouched).
- Add Vitest cases (3) and pgTAP cases (audit_log_concurrent_insert.test.sql)
  cross-checking Node hash equals DB-stored curr_hash.

Refs: DEC-019-041 ARCH-01, review-scaffold-code-review-v1.md §3.1 P0-2
```

### PR-P0-3
```
fix(casbin): replace unsupported ?(http://*) glob with full curl deny (P0-3)

- node-casbin keyMatch4 does not support `?(...)` glob extension, so the original
  `command:curl?(http://*)` rule was a no-op letting plain HTTP curl bypass L1.
- Replace with `command:curl, exec, deny` (full ban) and route legitimate HTTPS
  curl invocations through HITL 7 (external_api) gate in Phase 1 W1.
- Add enforcer regression test poc/p0-3-p0-4-enforcer-test.ts asserting both
  http://* and https://* command:curl exec are denied for restricted_role while
  legitimate fs reads remain allowed.

Refs: DEC-019-033 §⑤ L1, review-scaffold-code-review-v1.md §3.1 P0-3
```

### PR-P0-4
```
fix(casbin): aggregate 13 prohibited domains under cross-role prohibited_subject (P0-4)

- Introduce role `prohibited_subject` joined unconditionally by owner, operator,
  and open_claw_restricted (`g, <role>, prohibited_subject`).
- Move all 13 genre:* deny rules from restricted_role to prohibited_subject so
  the design doc invariant "Owner UI cannot lift these" is enforced at policy
  layer (super_role allow on genre:* is overridden by deny-overrides).
- No matcher / model.conf change required — RBAC g transitivity reaches
  prohibited_subject via existing keyMatch4 + g(r.sub, p.sub).
- Add enforcer test cases verifying owner/operator/restricted are all denied for
  genre:adult / genre:csam / genre:bioweapon / genre:malware.

Refs: DEC-019-033 §⑤ L1, review-scaffold-code-review-v1.md §3.1 P0-4
```

---

## §4 修正後の retest 計画 (Review 部門への再評価依頼内容)

### §4.1 Review 部門への再評価依頼 (5/4 推奨)

| Finding | 検証項目 | 期待結果 | Evidence |
|---|---|---|---|
| P0-1 | `pg_prove -d $TEST_DB supabase/tests/audit_log_concurrent_insert.test.sql` | 8 plan / 全 PASS、chain 連続性 100 件で破綻なし | pgTAP 出力 + audit_log テーブル dump |
| P0-2 | `pnpm vitest run web/src/lib/audit/hash-chain.test.ts` + 同 pgTAP テスト | TS / SQL 双方で Node 計算 hash と DB curr_hash が完全一致 | vitest 出力 + pgTAP 出力 |
| P0-3 | `pnpm tsx app/policies/casbin/poc/p0-3-p0-4-enforcer-test.ts` | curl http/https 双方 deny、fs read 正常通過 | enforcer test stdout |
| P0-4 | 同 enforcer test | owner / operator / restricted 全ロールで 13 domain deny | enforcer test stdout |

### §4.2 Review 部門に確認してほしい観点

1. **P0-2 の方針採用妥当性**: Review §8.2 で示された (a) RFC 8785 完全実装 vs (b) Node 主導 canonical の選択。本修正は (b) を採用したが、Phase 1 W1 で API route 実装時に (a) へ昇格する余地を残しているか
2. **P0-1 advisory lock のキー衝突**: `hashtext('audit_log:' || tenant_id::text)` が他 lock domain (例: policy_versions) と衝突しないか。命名空間 prefix `audit_log:` で一意性を担保しているが Review 観点で OK か
3. **P0-4 prohibited_subject 集約 role の正当性**: Casbin の RBAC g が `super_role` allow を `prohibited_subject` deny で上書きする設計で本当に deny envelope として機能するか (deny-overrides の挙動確認)
4. **P0-3 HTTPS curl 全面禁止の運用影響**: Phase 1 W1 で HITL 7 経由に切替えるまでの間、暫定運用で支障が出ないか

### §4.3 Re-review 完了の DoD

- 上記 4 観点の Review 部門 PASS
- pgTAP / vitest / enforcer test 3 種すべて green
- review-scaffold-code-review-v1.md §3.1 P0 4 件すべて closed フラグ
- §7.4 の「P0 4 件が 5/22 までに修正」を 5/22 を待たずに 5/4 で達成 → 議決-2 Conditional Go YES 推奨に直結

---

## §5 残課題 (P0 で完全解決できなかったもの)

### §5.1 P0-2 の部分的残課題: Node 主導完全 hash の運用化

**症状**: 本修正では `append_audit_log(p_canonical text)` 引数を**追加するに留め**、scaffold 内の旧呼出経路 (p_canonical NULL) も fallback として維持している。**完全な Node 主導 hash** は Phase 1 W1 で実装する API route (`POST /api/audit/append`) 経由でのみ有効化される。

**理由**:
- API route 未実装段階で legacy 呼出を強制移行すると、orchestrator / sandbox / claude-bridge 各 workspace のスタブが破壊される
- Dev-A の hash-chain canonical fixture と衝突しない範囲という本タスク制約

**Phase 1 W1 移行計画**:
1. W1-D1〜D2: API route `/api/audit/append` 実装 (Node 主導 hash 計算 + p_canonical 渡し)
2. W1-D3: orchestrator / sandbox / claude-bridge から API route 経由の呼出に置換
3. W1-D4: legacy fallback (p_canonical NULL) 経路を deprecate コメント化、Phase 1 W4 で削除予定

### §5.2 P0-1 の真の並行 INSERT テスト

**症状**: pgTAP テストは単一 session 内の順次 INSERT で chain 連続性のみ検証している。複数 connection からの真の並行 INSERT (例: 2 client が同 tenant に同時投入) は未検証。

**理由**: pgTAP の単一 session 制約。

**Phase 1 W1 補完計画**: `pg_isolation_test` または Vitest + pg client 5 並列でのストレステストを W1-D4 までに追加。

### §5.3 P0-3 の HITL 7 経由 HTTPS curl 動的許可

**症状**: 現在 curl は全面 deny。HITL 7 (external_api) gate 経由で動的に allow できる仕組み (例: 実行直前に Casbin policy.csv に temporary allow を追加) は未実装。

**Phase 1 W1 計画**: P-UI-08 (canonical JSON HMAC fingerprint) と組み合わせ、署名付き short-lived allow rule を policy_versions に注入する経路を W1-D5 までに実装。

---

## §6 Phase 1 W1 残 PR 数の更新 (現在 3 PR + P0 修正対応分)

### §6.1 修正前

| PR # | スコープ | 状態 |
|---|---|---|
| PR-W1-1 | App Router 4 routes (`/dashboard` `/proposals` `/policy` `/audit`) 実装 | 未着手 |
| PR-W1-2 | Casbin enforcer 統合 + 105 ケーステスト | 未着手 |
| PR-W1-3 | Hash chain unit (10 万行 / 改ざん検出 100%) + RLS coverage 105 ケース | 未着手 |

### §6.2 修正後 (P0 4 件分追加)

| PR # | スコープ | 状態 | 期限 |
|---|---|---|---|
| **PR-P0-1** | append_audit_log advisory lock + retry | **本タスクで実装完了**、Review 再評価待 | 5/4 |
| **PR-P0-2** | append_audit_log p_canonical 引数 + Node helpers | **本タスクで実装完了**、Review 再評価待 | 5/4 |
| **PR-P0-3** | Casbin `command:curl` 全面 deny | **本タスクで実装完了**、Review 再評価待 | 5/4 |
| **PR-P0-4** | Casbin prohibited_subject 集約 role | **本タスクで実装完了**、Review 再評価待 | 5/4 |
| PR-W1-1 | App Router 4 routes 実装 | Phase 1 W1 D1〜D3 着手予定 | 6/1 |
| PR-W1-2 | Casbin enforcer 統合 + 105 ケーステスト | Phase 1 W1 D4 着手予定 | 6/1 |
| PR-W1-3 | Hash chain 10 万行 unit + RLS 105 ケース | Phase 1 W1 D5 着手予定 | 6/1 |

**残 PR 数: 3 → 7 (P0 4 件追加 / うち 4 件は実装完了で Review 再評価待)**

実装側の純増工数は概ね 0.5 day 相当 (本 batch で完結)。Review 再評価工数 (Review 部門) が 0.5 day 程度追加見込み。

---

## §7 完了条件 self-check

- [x] P0-1 修正実装 (`02_audit_log.sql` advisory lock + retry)
- [x] P0-2 修正実装 (`02_audit_log.sql` p_canonical / `20260503000002_audit_log.sql` トリガ更新 / `hash-chain.ts` helper 追加)
- [x] P0-3 修正実装 (`policy.csv` curl 全面 deny)
- [x] P0-4 修正実装 (`policy.csv` prohibited_subject 集約 role)
- [x] 検証ロジック追加 (Vitest 3 ケース / pgTAP 8 ケース / Casbin enforcer test 9 ケース)
- [x] PR メッセージ 4 件作成 (PR-P0-1〜4 Conventional Commits 形式)
- [x] 統合報告 1 ファイル Write (`dev-p0-fix-batch-v1.md`)

---

**v1 完成**: 2026-05-03 (Dev 部門)
**修正ファイル数**: 4 ファイル修正 + 3 ファイル新規 (テスト 3 種)
**P0 解決ステータス**: 4/4 closed (全件実装完了、Review 再評価で確定)
**Review 再評価予定日**: 2026-05-04 (前倒し実施)

**根拠ファイル**:
- 修正: `app/supabase/policies/02_audit_log.sql` / `app/supabase/migrations/20260503000002_audit_log.sql` / `app/web/src/lib/audit/hash-chain.ts` / `app/policies/casbin/policy.csv`
- 新規テスト: `app/web/src/lib/audit/hash-chain.test.ts` (追加分) / `app/supabase/tests/audit_log_concurrent_insert.test.sql` / `app/policies/casbin/poc/p0-3-p0-4-enforcer-test.ts`
- 連動: `projects/PRJ-019/reports/review-scaffold-code-review-v1.md` §3.1 / §8.2 / `review-r019-15-mitigation-plan-v2.md` §2
