# PRJ-019 — Pre-Phase 1 Scaffold コードレビュー報告 v1

最終更新: 2026-05-03 / 起案: Review 部門

位置付け: Dev 部門が 5/3 に納品した 37 ファイル / 2,415 行 scaffold (DEC-019-033 + DEC-020-003 同居方針反映) に対する Review 部門独立コードレビュー。5/8 W0-Week1 検収会議の議決-2 (Phase 1 着手 5/26 Conditional Go) における「scaffold 受入判定」の根拠資料。

連動: `review-r019-15-mitigation-plan-v2.md` §2 (4 層防御) / §5 (P-UI-01〜10 DoD) / §10 (条件付き承認 3 条件)
連動 DEC: DEC-019-033 §② §③ §④ §⑤ / DEC-020-003 (HITL 8 owner_input_review)
連動 ODR: OG-04 (drill #3 承認) / OG-05 (R-019-15 赤格付け)

---

## 目次

| § | 題目 |
|---|---|
| §1 | レビュー範囲 + 方法 |
| §2 | 領域別評価 5 区分 |
| §3 | Findings (P0/P1/P2/P3) |
| §4 | Security findings 専用セクション |
| §5 | Documentation 充足度評価 |
| §6 | Test coverage 評価 |
| §7 | 結論: scaffold 受入判定 |
| §8 | Dev 部門への improvement actions (5/8 検収会議までに対応すべき P0 項目) |

---

## §1 レビュー範囲 + 方法

### §1.1 範囲

| 区分 | 対象 | ファイル数 (概算) |
|---|---|---|
| Next.js scaffold | `app/web/` (package.json / tsconfig / next.config / tailwind / postcss / src 配下) | 8 |
| TypeScript libs | `app/web/src/types/hitl.ts` / `app/web/src/lib/openclaw-wrapper/{index,types}.ts` / `app/web/src/lib/audit/hash-chain.ts` | 4 |
| Supabase migration | `app/supabase/migrations/20260503000001〜000008_*.sql` | 8 |
| Supabase RLS Policy | `app/supabase/policies/01〜08_*.sql` | 8 |
| Casbin policy | `app/policies/casbin/{model.conf,policy.csv}` | 2 |
| ドキュメント | `app/README.md` / `app/docs/architecture-w0.md` / `app/docs/security-w0.md` / `app/.env.example` | 4 |
| その他 (orchestrator / sandbox / audit / notify / claude-bridge / harness の package.json placeholder) | `app/{orchestrator,sandbox,audit,notify,claude-bridge,harness,openclaw-runtime}/package.json` 等 | 残り |
| **合計** | **約 37 ファイル / 2,415 行** | — |

### §1.2 方法

1. **静的レビュー** — TypeScript 構文 / 命名 / import 構造 / 型整合 / null safety
2. **設計整合性** — DEC-019-033 §②③④⑤ / DEC-020-003 / pm-v4-hitl-gates-9-10-11-wbs.md / dev-security-w0-skeleton.md / review-r019-15-mitigation-plan-v2.md の 5 文書との交差検証
3. **セキュリティ観点** — OWASP Top 10 + RLS deny-by-default + Casbin deny envelope + 4 層防御 (L1-L4) + secret 取扱
4. **テスト観点** — 現状 0 (scaffold 段階) → Phase 1 W1〜W4 で 80% 目標への到達可能性評価

### §1.3 評価基準 (重大度ラベル)

| 重大度 | 定義 | 解決期限 |
|---|---|---|
| **P0 (blocker)** | Phase 1 着手前 (5/26) に必須解決。セキュリティ脆弱性、設計仕様との致命的乖離、データ損失リスク | 5/8 検収会議で再修正済の確認、または 5/22 までに修正 |
| **P1 (major)** | Phase 1 W1 (5/26〜6/1) 中に解決。性能 / 保守性 / 重要 UX 上の懸念 | 6/1 EOD |
| **P2 (minor)** | Phase 1 W2-W4 で解決。コード健全性 / refactor 機会 | 6/13 EOD |
| **P3 (nit)** | 改善提案。命名 / コメント / 軽微 refactor | 任意 |

---

## §2 領域別評価 5 区分

### §2.1 Next.js scaffold (`app/web/`)

| 観点 | 評価 | 備考 |
|---|---|---|
| package.json (Next 15.0.3 / React 19 / Supabase ssr / casbin / zod / Tailwind 3.4 / Heroicons / next-themes / Geist / lucide-react) | **白** | 標準技術スタック (`organization/rules/tech-stack.md`) と完全整合。Heroicons は Web 標準アイコン。lucide-react が同梱されているのは Heroicons との二重持ちのため要整理 (P3) |
| next.config.ts (X-Frame-Options DENY / Permissions-Policy で camera/mic/geolocation 全閉鎖 / typedRoutes 有効) | **白** | defence-in-depth の良例。CSP は未定義で P1 として §3 に記載 |
| tsconfig.json (rolloutPhase B / strict 完全適用) | **白** | DEC-019-041 ARCH-01 整合。`noEmit: true` + `bundler` moduleResolution は Next 15 標準 |
| tailwind.config.ts (shadcn/ui 互換 CSS 変数命名 + Geist フォント) | **白** | デザインガイドライン (Web shadcn/ui + Tailwind) と整合 |
| `src/app/` (App Router routes) | **未着手** | placeholder のみ (README §3 で「placeholder」と明示)。Phase 1 W1 で `/dashboard` `/proposals` `/policy` `/audit` 4 ルート実装が必須 (P1) |

**領域評価**: scaffold 受入レベル (構造は健全、Phase 1 W1 で routes / components / API routes 着手可能)

### §2.2 Supabase migration (`app/supabase/migrations/`)

| ファイル | 行数 | 評価 | 主要懸念 |
|---|---|---|---|
| `20260503000001_hitl_requests.sql` | 54 | **白** | 11 種 CHECK constraint 完全網羅、index 4 種で SLA timer / tenant scan / proposal join / gate_kind 全て覆う |
| `20260503000002_audit_log.sql` | 64 | **白〜黄** | hash chain trigger は健全。ただし `audit_no_branch unique (prev_hash)` は **fork 防止としては正しい** が、新規 INSERT の前段で「prev_hash 取得 → INSERT」が並行実行されたとき競合する。SECURITY DEFINER fn 内で `SELECT ... FOR UPDATE` 相当のロック設計が見えない (P0、§4.2 詳細) |
| `20260503000003_policy_versions.sql` | 44 | **白** | category CHECK + tenant×category×version_no UNIQUE + active 単一性 partial unique index で整合性保証 |
| `20260503000004_policy_audit_log.sql` | 32 | **黄** | trigger_kind CHECK は適切。ただし append-only であるべきだが本ファイルでは UPDATE/DELETE 制限が migration では定義されておらず、`policies/04_*` に依存 (P1、設計 doc 上は明示せよ) |
| `20260503000005_proposals.sql` | 55 | **白** | 7 セクション (a-g) 完全反映。dedup partial unique index も Phase 1 W2 の DoD 3 分岐 (whitelist/gray/blocklist) と整合 |
| `20260503000006_cost_ledger.sql` | 34 | **白** | scope/source CHECK 適切、numeric(10,4) 精度十分、append-only |
| `20260503000007_runtime_wrapper_state.sql` | 32 | **黄** | `unique (tenant_id, source, ts)` は ts ミリ秒衝突時に失敗する。6h 周期 polling を想定するなら問題ないが、burst 書込み時の安全弁が必要 (P2) |
| `20260503000008_knowledge_extraction_queue.sql` | 46 | **白** | HITL 11 連動完全。target_subdir CHECK で patterns/decisions/pitfalls 強制 |

**領域評価**: 8 migration の論理スキーマは review-r019-15 §5 §7 §8 と整合。hash chain ロック競合 (P0) のみ blocker。

### §2.3 Supabase RLS Policy (`app/supabase/policies/`)

| ファイル | 評価 | 主要懸念 |
|---|---|---|
| `01_hitl_requests.sql` | **白** | tenant_isolation = restrictive、INSERT は SECURITY DEFINER fn 経由のみ、UPDATE は owner only。設計 §7.3 P-UI-07 と整合 |
| `02_audit_log.sql` | **白** | INSERT/UPDATE/DELETE すべて revoke、INSERT は `append_audit_log` SECURITY DEFINER のみ。append-only 保証完備 |
| `03_policy_versions.sql` | **白〜黄** | INSERT/UPDATE が owner-only RLS で守られている。ただし `open_claw_restricted` ロールに `grant select` を行う際に `set search_path = public, pg_temp` の固定が見えない (P1)。また `insert/update/delete from open_claw_restricted` は revoke 済だが、明示の `revoke truncate` が無い (P2) |
| `04_policy_audit_log.sql` | **黄** | append-only spirit は SELECT のみ許可で守れているが、`revoke insert,update,delete from anon, authenticated` のみで service_role への明示制限が無い。Edge Function 経由の正規 INSERT 関数が migration 側で定義されていない (P1) |
| `05_proposals.sql` | **黄** | INSERT が `revoke ... from anon, authenticated` だが、`with check` 句なしの UPDATE は owner only RLS で守るのみ。Owner が status を `approved` 以外の任意値に直接遷移できる余地あり (P1、§4.4 詳細) |
| `06_cost_ledger.sql` | **白** | append-only、INSERT は SECURITY DEFINER 想定 (関数本体は migration 内未定義、Phase 1 W1 着手) |
| `07_runtime_wrapper_state.sql` | **白** | observer SELECT のみ、append-only |
| `08_knowledge_extraction_queue.sql` | **白** | UPDATE は owner only、INSERT/DELETE 禁止 |

**領域評価**: RLS は健全。policy_audit_log の正規 INSERT 経路 (P1) と proposals UPDATE の status 遷移制約 (P1) が major findings。

### §2.4 Casbin policy (`app/policies/casbin/`)

| 観点 | 評価 | 備考 |
|---|---|---|
| `model.conf` (RBAC + deny-overrides + keyMatch4) | **白** | `e = !some(where (p.eft == deny)) && some(where (p.eft == allow))` は deny envelope の正しい表現 |
| `policy.csv` 構造 (3 ロール / 7 category / 13 prohibited domains 永遠 deny) | **白〜黄** | 13 prohibited domains 全列挙済、policy.csv にハードコード (Owner UI でも解除不可と明記)。ただし `command:curl?(http://*)` は正規表現として keyMatch4 では `?(...)` glob 拡張が**動作しない可能性**がある (Casbin v5 では `keyMatch4` は `*` `:` のみサポート) (P0、§4.5 詳細) |
| open_claw_restricted 初期 allow list (fs read 限定 / hitl propose write / cost read) | **白** | fail-closed 原則完備。Phase 1 W1 で個別 allow を Owner 承認で追加する運用と整合 |
| deny envelope (`fs:.env*` / `fs:**/secrets/**` / `fs:organization/** write` / `command:rm` / `command:sudo` / metadata service IP) | **黄** | metadata service は AWS 169.254.169.254 + GCP のみ。Azure (`169.254.169.254` 同じ) / IBM Cloud / Oracle Cloud / Alibaba Cloud / DigitalOcean が抜けている (P1) |

**領域評価**: deny envelope の網羅性は概ね良好。`?(...)` glob の Casbin matcher 互換性 (P0) のみ blocker。

### §2.5 TypeScript libs (`app/web/src/`)

| ファイル | 評価 | 主要懸念 |
|---|---|---|
| `types/hitl.ts` (HITL 11 種 discriminated union + SLA テーブル) | **白** | 11 種 enum 完全 + payload 型 11 種 + HITL_GATE_DEFAULTS で SLA / defaultAction を single-source。`isTerminalStatus` も明快 |
| `lib/openclaw-wrapper/index.ts` (Adapter / FeatureFlag / VersionPin / CircuitBreaker / RuntimeWrapper) | **白〜黄** | skeleton として健全。CircuitBreaker は 3 状態正しく実装、ただし `getState()` 中で `Date.now()` 直参照 = テスト時に TimeSource 注入できない (P1、harness/ で確立済の time-source pattern と不整合) |
| `lib/openclaw-wrapper/types.ts` | **白** | RuntimeEvent discriminated union / SpawnHandle / FeatureFlags 全項目過不足無し |
| `lib/audit/hash-chain.ts` (canonicalize / sha256Hex / verifyChain / verifyRecord) | **白〜黄** | DB トリガと canonical 一致設計は明示。ただし `JSON.stringify(rec.payload)` は **キー順非決定的** (V8 は挿入順だが仕様外)、DB 側の `payload::text` (Postgres 内部形式) と完全一致を**強制する手段が無い** (P0、§4.3 詳細) |

**領域評価**: 型設計は秀逸。CircuitBreaker の TimeSource 不在 (P1) と canonical JSON の DB-Node 一致非保証 (P0) が major findings。

---

## §3 Findings (P0 / P1 / P2 / P3)

各 finding は **該当ファイル + 行番号 + 推奨修正** を必須記載。

### §3.1 P0 (blocker、Phase 1 着手前 5/26 までに必須解決) — 4 件

| # | 項目 | 該当ファイル / 行 | 詳細 | 推奨修正 |
|---|---|---|---|---|
| **P0-1** | hash chain INSERT のロック競合可能性 | `app/supabase/policies/02_audit_log.sql:42-65` (`append_audit_log` SECURITY DEFINER fn) | 並行 INSERT 2 件が同時に `select coalesce(curr_hash, ...) from audit_log order by id desc limit 1` を読むと、両方が同じ prev_hash を取得し片方が `audit_no_branch unique(prev_hash)` で失敗 → 一見安全だが、失敗側が retry しなければ chain が虫食いになる | `select ... for update` でテナント単位ロック取得、または advisory lock (`pg_advisory_xact_lock(hashtext(p_tenant_id::text))`) で完全直列化。retry policy も append_audit_log fn 内に組込み |
| **P0-2** | canonical JSON の DB-Node 不一致 | `app/web/src/lib/audit/hash-chain.ts:37-48` (`canonicalize`) と `app/supabase/migrations/20260503000002_audit_log.sql:38-53` (`audit_log_compute_hash`) | Node 側は `JSON.stringify(rec.payload)` (V8 挿入順)、DB 側は `new.payload::text` (Postgres 内部形式)。両者は **キー順 / 空白 / 数値表現** が一致しない可能性。verify が常に失敗する潜在バグ | (a) RFC 8785 JCS 互換 canonicalize を Node / DB 双方で実装する (review-r019-15 §8.1)、または (b) Node 側で生成して DB INSERT 前に確定済 canonical 文字列を渡す (推奨)。本 W0 段階では (b) が現実的 |
| **P0-3** | Casbin matcher で `?(...)` glob 非対応 | `app/policies/casbin/policy.csv:73` (`p, restricted_role, command:curl?(http://*), exec, deny`) | Casbin v5 の keyMatch4 は `*` `{}` `:`(named) のみ対応。`?(http://*)` は無効パターンとして扱われ、http URL 経由の curl が **deny されない**。L1 静的 policy 層が崩壊 | `command:curl http://*` (空白区切り) または policy 側で複数行展開: `command:curl, exec, deny` を全面禁止し、許可は Phase 1 W1 で個別 add。`command:curl https://*` はホワイトリストせず HITL 7 (external_api) 経由を強制 |
| **P0-4** | 13 prohibited domains の `restricted_role` 限定問題 | `app/policies/casbin/policy.csv:54-66` | 13 deny は `p, restricted_role, genre:adult, *, deny` の形で **restricted_role にのみ deny**。Owner / operator が Casbin 経由で genre:adult を作業した場合 deny されない。design doc §0 「Owner UI でも解除不可」との不整合 | 全ロール対象に拡張: `p, *, genre:adult, *, deny` のように deny envelope を role-wildcard 化、または別 role `prohibited` を作って `g, owner, prohibited`/`g, operator, prohibited`/`g, open_claw_restricted, prohibited` で集約 |

### §3.2 P1 (major、Phase 1 W1 中に解決) — 7 件

| # | 項目 | 該当ファイル / 行 | 詳細 | 推奨修正 |
|---|---|---|---|---|
| **P1-1** | CSP (Content-Security-Policy) ヘッダ未設定 | `app/web/next.config.ts:15-26` | X-Frame-Options 等は設定済だが CSP が無い。Owner UI への Prompt Injection 経由 (R-019-15 ベクトル e) で外部 script 実行を許す可能性 | `default-src 'self'; script-src 'self' 'unsafe-inline' (next 必要分のみ); connect-src 'self' *.supabase.co; frame-ancestors 'none';` を追加 |
| **P1-2** | CircuitBreaker の TimeSource 注入不可 | `app/web/src/lib/openclaw-wrapper/index.ts:122-126,138-140` | `Date.now()` 直参照のためテスト時に時刻固定不可。harness 配下は time-source pattern (DEC-019-020) で確立済、本ファイルだけ不整合 | constructor で `now: () => number = Date.now` を受取、内部で `this.now()` を使用。型定義は `import type { TimeSource } from "./types"` で明示 |
| **P1-3** | proposals UPDATE の status 遷移制約欠落 | `app/supabase/policies/05_proposals.sql:22-27` + migration `20260503000005_proposals.sql:39-44` | RLS で owner UPDATE は許可されているが、status の有効遷移グラフ (`draft → pending_hitl9 → approved/rejected/timeout → impl_running → impl_completed/impl_failed`) が CHECK で強制されていない。Owner 誤操作で `draft → impl_completed` のような不正遷移が可能 | trigger 関数 `proposals_status_transition_check()` を追加し、`OLD.status` から `NEW.status` への遷移を許可リストでバリデート |
| **P1-4** | policy_audit_log の正規 INSERT 経路未定義 | `app/supabase/migrations/20260503000004_policy_audit_log.sql` 全体 + `app/supabase/policies/04_policy_audit_log.sql` | append-only テーブルだが、policy_versions UPDATE 時に自動 INSERT する trigger / SECURITY DEFINER fn が未実装。HITL 10 trigger source として動作しない | `policy_versions` の AFTER INSERT/UPDATE で `policy_audit_log` に diff_json を計算して INSERT する trigger を追加 |
| **P1-5** | Cloud metadata service の deny 漏れ (Azure 以外) | `app/policies/casbin/policy.csv:78-79` | AWS / GCP の metadata IP のみ deny。Azure / Oracle Cloud / Alibaba Cloud / IBM Cloud の metadata endpoint が抜けている | `network:169.254.169.254/*, *, deny` (CIDR) + `network:metadata.azure.com, *, deny` + `network:100.100.100.200, *, deny` (Alibaba) 等を追加 |
| **P1-6** | open_claw_restricted ロールの search_path 固定欠落 | `app/supabase/policies/03_policy_versions.sql:41-49` | `create role open_claw_restricted nologin` 後の `grant select` 経路で `search_path` が default (`$user, public`)。schema injection 攻撃の余地 | `alter role open_claw_restricted set search_path = pg_catalog, public` を `do$$ ... $$` ブロック直後に追加 |
| **P1-7** | App Router routes 未実装 | `app/web/src/app/` (placeholder) | 透明性ダッシュボード / 提案承認 UI / 権限変更 UI 全てが空。Phase 1 W1 必須 | `/dashboard` `/proposals/[id]` `/policy/[category]` `/audit` 4 ルート + `/api/hitl/[id]/decision` API route を W1 で実装。Server Action ベース推奨 |

### §3.3 P2 (minor、Phase 1 W2-W4 で解決) — 6 件

| # | 項目 | 該当ファイル / 行 | 詳細 | 推奨修正 |
|---|---|---|---|---|
| **P2-1** | runtime_wrapper_state の ts unique 衝突可能性 | `app/supabase/migrations/20260503000007_runtime_wrapper_state.sql:27-28` | `unique (tenant_id, source, ts)` で同一ミリ秒 burst 時の INSERT が失敗する | unique の代わりに `id` PK のみとし、(tenant,source,ts desc) index で latest 取得 |
| **P2-2** | open_claw_restricted への明示的 truncate revoke 欠落 | `app/supabase/policies/03_policy_versions.sql:48-49` | revoke insert/update/delete のみで truncate / references が残る | `revoke all on public.policy_versions from open_claw_restricted; grant select on public.policy_versions to open_claw_restricted;` の順で書く |
| **P2-3** | lucide-react と @heroicons/react の重複 | `app/web/package.json:24,29` | アイコンライブラリが 2 系統。標準スタックは Heroicons | lucide-react を削除、shadcn/ui のデフォルトアイコンも heroicons に置換 |
| **P2-4** | hash-chain.ts の `records[i]!` non-null assertion | `app/web/src/lib/audit/hash-chain.ts:87,97` | `records[i]!` で TypeScript 厳格モード回避。安全だが strict noUncheckedIndexedAccess 違反 | `const r = records[i]; if (!r) continue;` で明示 narrow |
| **P2-5** | hitl_requests テーブルに idempotency_key 欠落 | `app/supabase/migrations/20260503000001_hitl_requests.sql` 全体 | retry 時の二重 INSERT 防止が無い | `idempotency_key text unique` カラム追加、orchestrator 側で UUID 生成 |
| **P2-6** | tailwind config に `safelist` が無い | `app/web/tailwind.config.ts` | dynamic class (e.g. `bg-${color}-500`) が purge される潜在バグ。Phase 1 W1 で動的色生成を始めると顕在化 | safelist に動的に決まる class pattern を追記 (実装と並行) |

### §3.4 P3 (nit、任意改善) — 5 件

| # | 項目 | 該当ファイル / 行 | 推奨改善 |
|---|---|---|---|
| **P3-1** | hitl.ts コメントの「DEC-019-018」表記揺れ | `app/web/src/types/hitl.ts:21` | 他箇所と同様に「DEC-019-018 第 6 種」と統一 |
| **P3-2** | Migration timestamp が秒単位 (000001〜000008) | `app/supabase/migrations/*` | Supabase 標準は YYYYMMDDHHMMSS。次回追加時に衝突しない命名 (例: 20260503160001) を推奨 |
| **P3-3** | RuntimeWrapper.shutdown が空実装 | `app/web/src/lib/openclaw-wrapper/index.ts:208-210` | TODO コメントに JIRA / DEC ID を紐付け (`TODO(DEC-019-033 W2): SIGTERM/SIGKILL grace`) |
| **P3-4** | `audit_log_compute_hash` trigger の `coalesce(new.ts::text, '')` | `app/supabase/migrations/20260503000002_audit_log.sql:43` | `to_char(new.ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` で ISO-8601 厳密化 (Node 側との一致のため) |
| **P3-5** | env.example の `SPEND_CAP_TASK_USD=2` の根拠不在 | `app/.env.example:42` | コメントで「DEC-019-031 §X」を補記 |

---

## §4 Security findings 専用セクション

R-019-15 mitigation v2 (`review-r019-15-mitigation-plan-v2.md` §2 §3) の 4 層防御 (L1 Casbin / L2 RLS / L3 Hash Chain / L4 Fingerprint) と 5 攻撃ベクトル (a-e) に対して本 scaffold が**物理レベルで何を実現しているか / していないか**を独立評価する。

### §4.1 ベクトル (a) Direct Write to Policy Store

| 層 | 本 scaffold の実装 | 評価 |
|---|---|---|
| L1 Casbin | `policy.csv` で restricted_role に `policy:* write` 一切付与なし、initial allow list は read 系のみ | **白** |
| L2 RLS | `policy_versions` INSERT/UPDATE が `with check (role = 'owner')`、open_claw_restricted は `revoke insert/update/delete` 済 | **白** (ただし P1-6 search_path 固定で完成) |

### §4.2 ベクトル (b) Audit Log Tampering

| 層 | 本 scaffold の実装 | 評価 |
|---|---|---|
| L3 Hash Chain | `audit_log_compute_hash` trigger + `audit_no_branch unique(prev_hash)` で fork 防止、`append_audit_log` SECURITY DEFINER fn のみ INSERT 経路 | **黄** (P0-1 ロック競合 + P0-2 canonical 不一致が解決されないと chain verify が常時失敗する) |
| genesis duplicate | review-r019-15 §2.2.L3 の「genesis hash の Supabase 別 schema duplicate」未実装 | **黄** (Phase 1 W1 で実装必要) |

### §4.3 ベクトル (c) Service Role Key Exfiltration

| 層 | 本 scaffold の実装 | 評価 |
|---|---|---|
| L4 + G-V2-11 | `.env.example:8` で「subprocess 環境変数に注入禁止」明記、Web の API route のみ参照する設計 | **白** (実装段階で env allow-list を type level で強制する仕組みは Phase 1 W1) |

### §4.4 ベクトル (d) Policy Fetch Spoofing / Race

| 層 | 本 scaffold の実装 | 評価 |
|---|---|---|
| L4 Fingerprint | **未実装**。canonical JSON fingerprint (HMAC-SHA256) 機構は scaffold 段階では存在しない | **赤** (P-UI-08 未着手、Phase 1 W1 で着手必須) |

### §4.5 ベクトル (e) Owner Manipulation via Prompt Injection

| 層 | 本 scaffold の実装 | 評価 |
|---|---|---|
| HITL 9/10/11 | DB スキーマ + TS 型完成、SLA テーブル completion | **白** (UI 実装は P1-7 残課題) |
| P-UI-02 cool-down | **未実装** | **黄** (Phase 1 W1 必須) |
| P-UI-05 異常検知 | **未実装** | **黄** (Phase 1 W2 必須) |

### §4.6 secret 取り扱い

| 観点 | 評価 |
|---|---|
| `.env.example` がキー名のみ列挙 | **白** |
| `SUPABASE_SERVICE_ROLE_KEY` のスコープ明記 (Web only) | **白** |
| dummy secret の `.test` TLD ルール (security-w0 §6) 適用箇所が migration / policy にあるか | scaffold 段階では test data 未生成、Phase 1 W1 で fixture 作成時に厳守必要 |

### §4.7 4 層防御 vs 本 scaffold の対応サマリ

| 層 | review-r019-15 要求 | 本 scaffold での実装状況 | gap |
|---|---|---|---|
| L1 Casbin RO | 7 category × deny envelope + 13 prohibited domains 永遠 deny | policy.csv で構造完成、ただし P0-3 / P0-4 で正常動作しない | **2 件 P0** |
| L2 RLS DB role 分離 | service_role と restricted_role 物理分離 | 8 RLS policy 完備、open_claw_restricted nologin で論理分離 | **P1-6 search_path** |
| L3 Hash Chain | 10 万行改ざん検出 100% | hash trigger + verify ライブラリ完備 | **P0-1 ロック + P0-2 canonical 不一致 + genesis duplicate 未実装** |
| L4 Fingerprint | canonical JSON HMAC-SHA256 | **未実装** | **Phase 1 W1 着手** |

---

## §5 Documentation 充足度評価

| ドキュメント | 評価 | 備考 |
|---|---|---|
| `app/README.md` (159 行) | **白** | DEC-019-033 + DEC-020-003 同居方針 / 4 層防御物理実装 / W0-Week1 vs W0-Week2 スコープ表 / 各 workspace 進捗 / DoD checklist 全て揃う |
| `app/docs/architecture-w0.md` (233 行) | **白** | Mermaid 4 枚 (全体図 / W0-W4 / dataflow sequence / etc.) で視覚化十分。§5 P-D 改 5 不変条件は監査資料品質 |
| `app/docs/security-w0.md` (185 行) | **白** | 4 層防御 / G-01〜G-V2-11 9 controls evidence / BAN 5 SLA / OAuth 物理分離 / 副作用ゼロ原則 / secret 取扱 全て網羅 |
| `app/.env.example` (51 行) | **白** | キー名のみ + コメントで scope 明示。Phase 1 W1 で実値追加時の guard rail として機能 |
| ADR (`app/docs/adr/`) | **未着手** | CB-D-W0-03 で W0-Week2 中に 4 件起票予定 |
| API spec (`app/docs/api-spec/`) | **未着手** | Phase 1 W1 で OpenAPI 雛形必要 |
| PoC (`app/docs/poc/`) | **未着手** | CB-D-W0-04 で実機 PoC 後に追加 |

**総合評価**: scaffold 段階で必要な 4 ドキュメント (README / architecture-w0 / security-w0 / .env.example) は全て充足、ADR/API spec/PoC は Phase 1 着手前に追加すべき。

---

## §6 Test coverage 評価

### §6.1 現状 (2026-05-03 時点)

| workspace | 既存テスト件数 | scaffold 範囲のテスト |
|---|---|---|
| harness | 9 modules / 55 cases (W0-Week1) → 11 tests / 61 cases (W0-Week2) | scaffold とは独立 |
| claude-bridge | 3 modules / 29 cases | scaffold とは独立 |
| openclaw-runtime | 6 cases (Mock + skeleton) | scaffold とは独立 |
| **app/web/ (本 scaffold)** | **0** | hitl.ts / openclaw-wrapper / hash-chain.ts のテスト全て未着手 |
| **app/supabase/ (本 scaffold)** | **0** | RLS policy 105 ケース (7 テーブル × 5 操作 × 3 role) 未着手 |
| **app/policies/casbin/ (本 scaffold)** | **0** | casbin policy lint / matcher コンプライアンステスト未着手 |

### §6.2 Phase 1 (5/26-6/20) テスト戦略

詳細は別ファイル `review-test-strategy-phase1.md` 参照。サマリ:

| 週 | テスト DoD |
|---|---|
| W1 (5/26-6/1) | hash-chain.ts unit (10 万行 / 改ざん検出 100%) + RLS coverage 105 ケース + hitl.ts zod parse |
| W2 (6/2-6/8) | Casbin policy lint + drill #3 シナリオ 5 件 (本ファイル別冊) + E2E HN→preview happy path |
| W3 (6/9-6/15) | Pen Test #1 36 攻撃 + FN-Black 1 回目 60 件 |
| W4 (6/16-6/20) | Pen Test #2 47 攻撃 + 80% カバレッジ確定 + Phase 1 完了判定 |

### §6.3 80% カバレッジ目標 (Phase 1 完了 6/20)

- Vitest line + branch coverage で `app/web/src/lib/**` 80% 以上
- pgTAP / sqlfluff で `app/supabase/policies/**` の RLS 全 path カバー
- Casbin enforcer の 7 category × 5 action × 3 role = 105 マトリクス全カバー
- E2E (Playwright) は主要フロー (HN→preview / HITL 9 承認 / 権限変更 HITL 10) 3 シナリオ

---

## §7 結論: scaffold 受入判定

### §7.1 Review 部門最終判定

**条件付き承認 (Conditional Approval)**

### §7.2 判定根拠

1. **構造的健全性**: 37 ファイル / 2,415 行は DEC-019-033 + DEC-020-003 + review-r019-15 v2 の 3 文書と整合。8 migration / 8 RLS policy / Casbin model+policy / TS lib 4 種 + ドキュメント 4 種が論理的に閉じている。
2. **4 層防御の物理実装**: L1 (Casbin policy.csv) / L2 (RLS owner-only write) / L3 (hash chain trigger + verify lib) / L4 (env.example で service_role 分離明記) が全て scaffold レベルで存在。Phase 1 W1 着手の前提として十分。
3. **しかし P0 4 件が残る**: hash chain ロック競合 (P0-1) / canonical JSON 不一致 (P0-2) / Casbin glob 非対応 (P0-3) / 13 deny の role-wildcard 化欠落 (P0-4) は **どれも 4 層防御を骨抜きにしうる致命的設計欠陥**。
4. **5/8 検収会議で議決-2 (Conditional Go) を YES とする条件**: P0 4 件を 5/22 までに修正完了 + 修正版が Review 部門で再検証 Pass。

### §7.3 判定マトリクス

| 観点 | scaffold 状態 | 判定 |
|---|---|---|
| Critical 指摘 (P0) | 4 件 | **修正後再レビュー** |
| Major 指摘 (P1) | 7 件 | Phase 1 W1 内解決で OK |
| Minor 指摘 (P2) | 6 件 | Phase 1 W2-W4 解決で OK |
| Nit (P3) | 5 件 | 任意 |
| ドキュメント | 4 件揃う + ADR/API spec/PoC W0-Week2 残課題 | **概ね良好** |
| Test coverage | 現状 0 (scaffold 段階のため許容) → Phase 1 80% 目標 | **戦略書ありき** |
| 4 層防御 | L1〜L3 物理実装、L4 fingerprint Phase 1 W1 着手 | **scaffold としては十分** |

### §7.4 Phase 1 着手 5/26 への影響

- P0 4 件が 5/22 までに修正されれば: **Phase 1 着手 5/26 Conditional Go 議決-2 を YES 推奨**
- P0 のうち 1 件でも 5/22 までに残れば: **Phase 1 着手を 1 週間延期 (DEC-019-023 TR-1 と同じ運用ルール)**

---

## §8 Dev 部門への improvement actions (5/8 検収会議までに対応すべき P0 項目)

### §8.1 5/8 (検収会議当日) までの最低限要求

5/8 当日までは P0 を全件解決する必要は無いが、以下 2 点は **5/8 までに Dev 部門が回答** しなければ議決-2 (Conditional Go) は推奨できない:

| ID | 要求事項 | 5/8 までの納品物 |
|---|---|---|
| **A-1** | P0 4 件への対応プラン提示 | 各 P0 に対する修正方針 + 修正担当者 + 完了予定日 (≤5/22) を含む 1 page memo |
| **A-2** | hash chain canonical JSON 統一案 (P0-1, P0-2 統合) | (a) Node 側 RFC 8785 JCS 実装 / (b) Node 側で確定済 canonical 文字列を DB に渡す のいずれかを採用宣言 |

### §8.2 5/22 までの修正完了要求 (P0 4 件)

| P0 | 修正内容 | 検証方法 |
|---|---|---|
| **P0-1** | `append_audit_log` SECURITY DEFINER fn 内に `pg_advisory_xact_lock(hashtext(p_tenant_id::text))` を追加、retry policy も組込み | pgTAP で並行 INSERT 100 件 → chain 連続性 100% |
| **P0-2** | Node 側 RFC 8785 JCS canonicalize を実装、または「Node 側 canonical 確定 → DB INSERT」の二段構成。DB trigger は `payload::text` ではなく Node が渡す canonical 文字列を直接 hash 計算 | hash-chain.ts unit + pgTAP cross-check (Node が計算した hash と DB が計算した hash が一致) |
| **P0-3** | `command:curl?(http://*)` を削除、`command:curl, exec, deny` に統一。HTTPS curl は Phase 1 W1 で HITL 7 経由に統合 | Casbin enforcer test で `curl http://example.com` / `curl https://api.openai.com` が双方 deny |
| **P0-4** | 13 prohibited domains を全 role 対象に拡張 (`p, *, genre:adult, *, deny` または `prohibited` 集約 role) | Casbin enforcer test で owner / operator / restricted_role 全てで genre:adult/csam/etc が deny |

### §8.3 5/8 検収会議後 〜 Phase 1 着手 5/26 のスケジュール提案

| 日付 | Dev 担当 | Review 担当 |
|---|---|---|
| 5/9〜5/15 (W0-Week2) | P0-1, P0-2 修正、ADR 4 件起票、CB-D-W0-04 PoC | (待機、5/13 BAN drill #1 立会) |
| 5/16〜5/22 (Pre-Phase Week 前半) | P0-3, P0-4 修正、P1-1〜P1-7 着手 | RLS policy review checklist (P-UI-09) 独立検証 |
| 5/23〜5/25 (Pre-Phase Week 後半) | 修正版を Dev 内 review | Review 部門再検証 + 5/29 BAN drill #3 直前準備 |
| 5/26 | Phase 1 W1 着手 (議決-2 YES 前提) | drill #3 (5/29) 環境構築立会 |

---

**v1 完成**: 2026-05-03 (Review 部門起案、scaffold 37 ファイル / 2,415 行レビュー完遂)
**次回更新**: 5/22 P0 4 件修正完了確認後、または 5/8 検収会議で Dev 回答を受けて

**根拠ファイル**: `app/README.md`、`app/docs/architecture-w0.md`、`app/docs/security-w0.md`、`app/web/src/types/hitl.ts`、`app/web/src/lib/openclaw-wrapper/{index,types}.ts`、`app/web/src/lib/audit/hash-chain.ts`、`app/policies/casbin/{model.conf,policy.csv}`、`app/supabase/migrations/2026050300000{1〜8}_*.sql`、`app/supabase/policies/0{1〜8}_*.sql`、`projects/PRJ-019/decisions.md` DEC-019-019 / DEC-019-020 / DEC-019-033、`projects/PRJ-019/reports/review-r019-15-mitigation-plan-v2.md`
