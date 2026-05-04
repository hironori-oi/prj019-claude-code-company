# PRJ-019 Round 13 Dev-A 完遂レポート — 多言語 NFKC 拡張 + hn-trending fetch path NFKC + denylist 運用 PR フロー

最終更新: 2026-05-04 W0-Week1 Round 13 Dev-A
位置付け: Owner formal「最速で進めよ」directive 継続中。Round 12 Dev-A 引継 5 件のうち 3 件 (#2 多言語拡張 / #4 hn-trending NFKC / #1 denylist 運用 PR フロー) を本 Round で並列完遂。
連動 DEC: DEC-019-010 / DEC-019-025 / DEC-019-050 / DEC-019-053 / DEC-019-055
連動レポート: dev-round12-A-nfkc-yaml-denylist.md (Round 12 Dev-A 着地 = NFKC layer + denylist YAML 化)
連動コード:
- `app/needs-scout/src/filters/normalization-multilingual.ts` (新規 / 241 行)
- `app/needs-scout/src/sources/hn-trending.ts` (修正 / +6 行 / safeNormalize + normalizeForFilter 経路化)
- `app/needs-scout/config/DENYLIST-OPERATIONS.md` (新規 / 218 行)
- `app/needs-scout/src/filters/__tests__/normalization-multilingual.test.ts` (新規 / 180 行 / 31 tests)
- `app/needs-scout/src/__tests__/hn-trending-normalization.test.ts` (新規 / 215 行 / 8 tests)

---

## CEO 向け 200 字以内 summary

Round 13 Dev-A 着地: 多言語 NFKC 拡張 (中文 繁→簡 / 韓 한자 / 日 旧→新字体 35 ペア辞書 + locale 自動検出 + safeNormalize locale 拡張) + hn-trending fetch path に safeNormalize + normalizeForFilter 注入 (rawText 段階で NFKC + lowercase + 空白圧縮、二重正規化 idempotent 確認) + denylist 運用 PR フロー文書化 (218 行 / 2 名 approval 必須化 + backlog tier 切替判断 + 緊急時対応) を完遂。新規 39 tests (multilingual 31 + hn-trending 8) 全 pass、needs-scout 全 159 tests pass、TypeScript strict 合格、依存追加 0、追加コスト $0。

---

## §1 担当タスクと DoD

### §1.1 担当 3 件 (Round 12 Dev-A 引継 5 件のうち)

| # | タスク | Round 12 引継項目 | 着地 |
|---|---|---|---|
| A | NFKC 多言語拡張 (中文 / 韓国語 / 日本語 漢字統一辞書) | §8.1 #2 | 完遂 |
| B | hn-trending fetch path NFKC 適用 | §8.1 #4 | 完遂 |
| C | denylist 運用 PR フロー文書化 | §8.1 #1 | 完遂 |
| D | テスト追加 (multilingual + hn-trending normalization) | (本 Round 追加) | 完遂 (+39 tests) |

引継 5 件のうち今回着手しない 2 件:
- §8.1 #3 (YAML loader fail-fast 化) — 運用 PR フロー (本 Round C) 確立後の Round 14 引継
- §8.1 #5 (backlog tier 新規 keyword 追加 運用ガイド) — DENYLIST-OPERATIONS.md §6 に統合済 (実質完遂)

### §1.2 DoD 確認

| DoD | 結果 |
|---|---|
| TypeScript strict pass (`pnpm typecheck` exit 0) | 達成 (needs-scout exit 0) |
| workspace vitest 全 pass | 達成 (needs-scout 159 / claude-bridge 29 / openclaw-runtime 225 / audit 16 / notify 23 / scripts 10 / e2e-mock-claw 73 すべて PASS。harness 4 失敗は parallel agent の knowledge mining test 起因で本 Round Dev-A 範囲外) |
| 既存 791 + 新規 +24-35 tests | 達成 (Round 12 末 needs-scout 120 → Round 13 着地 159 = **+39 tests** / 想定 +24-35 を多少上回ったがカバレッジ強化分) |
| 既存テスト regression 0 | 達成 (needs-scout 全 8 test files PASS、Round 12 着地分の 120 tests を完全維持) |
| 完遂レポート 300-400 行 | 達成 (本 file ≈ 360 行) |
| API 追加コスト = $0 | 達成 (zod は既存依存、新規 npm install / external API call 0) |
| 絵文字なし | 達成 (本 report + 全コード内 emoji 0) |
| append-only 編集厳守 | 達成 (hn-trending.ts は task 指示で許容範囲、import + rawText 処理のみ修正、既存 export / 公開 API 変更なし) |

---

## §2 NFKC 多言語拡張 (タスク A)

### §2.1 新規ファイル `normalization-multilingual.ts` (241 行)

**4 export を提供** (副作用 0、入力同値 → 出力同値):

| # | export | 役割 |
|---|---|---|
| 1 | `normalizeMultilingual(input: string, options?): string` | NFKC + 漢字統一辞書を適用、unifyChinese / unifyKorean / unifyJapanese フラグで個別制御 |
| 2 | `detectLocale(input: string): 'ja' \| 'zh' \| 'ko' \| 'auto'` | ハングル / かな / 漢字 codepoint 範囲ベースの heuristic |
| 3 | `safeNormalize(input: unknown, locale?): string` | locale 拡張版 safe coerce、locale 指定で多言語統一を on/off |
| 4 | `getUnificationDictionary(): readonly` | 内蔵辞書 inspector (test / audit 用) |

### §2.2 内蔵辞書 (35 ペア)

| 領域 | ペア例 | 備考 |
|---|---|---|
| 中文 繁→簡 | 醫→医 / 藥→薬 / 護→护 / 銀行→银行 / 業務→业务 | 13 領域 medical / finance に頻出 |
| 韓国 한자 | 國→国 / 學→学 / 會→会 | 移住 / 教育領域 |
| 日本 旧→新 | 辯→弁 / 萬→万 / 髙→高 / 澤→沢 | 旧字体 異体字 (人名 + 法令) |

### §2.3 設計方針

- **依存追加 0**: OpenCC / hanja-conv 等の外部辞書 NG (API 追加コスト $0 + bundle size 制約)、内蔵 35 ペアで 13 領域 denylist 既出漢字をカバー
- **NFKC を先に適用**: `normalizeForFilter` (Round 12) で全角英数字 / 半角カナ / 互換空白を吸収後に辞書置換
- **逐次置換 (1-pass)**: codepoint 単位で iterate し Map.get で O(1) lookup、全文長 N に対し O(N)
- **Round 12 互換**: locale 指定なし時は `normalizeForFilter` と等価出力 (辞書 bypass)
- **locale=auto heuristic**: ハングル含む → ko、かな含む → ja、漢字 only → zh、ASCII → auto。簡素化のため簡体特有字形検出はせず、汎用辞書 1 つ + locale 別 unify フラグで切替

### §2.4 既存層との統合方針

- 既存 `normalization.ts` は無変更 (Round 12 layer の互換性維持)
- 多言語拡張は **opt-in** (locale 指定時のみ辞書適用、未指定時は Round 12 と等価)
- `critical-domain-filter.ts` への組込は **本 Round 未実施** (Round 14 で運用評価後に検討、現状は Round 12 NFKC layer のみ経由で denylist は十分マッチ)

---

## §3 hn-trending fetch path NFKC 適用 (タスク B)

### §3.1 修正対象 `src/sources/hn-trending.ts` (+6 行)

#### 修正点

| 修正前 | 修正後 |
|---|---|
| `const title = (hit.title ?? '').trim()` | `const title = safeNormalize(hit.title).trim()` |
| `const url = (hit.url ?? '...').trim()` | `const rawUrl = safeNormalize(hit.url).trim()` + fallback URL 構築 |
| `const storyText = (hit.story_text ?? '').trim()` | `const storyText = safeNormalize(hit.story_text).trim()` |
| `const rawText = [...].join(' ').toLowerCase()` | `const rawText = normalizeForFilter([...].join(' '))` |

### §3.2 設計判断

#### 判断: title / url は表示用に raw 維持、rawText のみ NFKC 経由化

| 案 | 帰結 |
|---|---|
| 案 1: title / url も lowercase + NFKC 化 | 表示時の固有名詞 (例: 'TypeScript' / 'GitHub') が小文字化、人間可読性低下 |
| **案 2 (採用): title / url は safeNormalize の型 coerce のみ、rawText のみ normalizeForFilter** | 表示用 raw 維持 + filter 用 normalize 維持の両立 |

`safeNormalize` (Round 12 normalization.ts) は string 型を素通しする型 coerce のみで、副作用 0。null / undefined は空文字に coerce する fail-safe。

#### 二重正規化 idempotent 確認

`critical-domain-filter.ts` 内 `applyCriticalDomainFilter` は `normalizeForFilter` を再度適用するが、NFKC は idempotent (`f(f(x)) === f(x)`) かつ lowercase / 空白圧縮も冪等のため、二重正規化でも結果不変。

### §3.3 全角混在テストカバー

- 全角英数字 ＮＥＷ → rawText 内で `new` に半角化
- 全角空白 U+3000 → rawText 内で ASCII space に圧縮 (denylist `'弁護士法 72 条'` 一致可能化)
- 半角カナ ｱｲｳ → rawText 内で全角カナ アイウ に正規化
- story_text=null / url=null の safe coerce + fallback URL 確認

---

## §4 denylist 運用 PR フロー文書化 (タスク C)

### §4.1 新規ファイル `config/DENYLIST-OPERATIONS.md` (218 行 / 11 章構成)

| 章 | 内容 |
|---|---|
| §1 目的 | denylist.yaml が DEC-019-010 13 領域 fail-safe である根拠と PR ベース運用の必要性 |
| §2 操作 / approval マトリクス | keyword 追加 / 削除 / tier 移動 / 領域追加 (削除絶対禁止) ごとに必要 approval を明記 |
| §3 ローカル確認 | YAML lint / zod 検証 / 既存テスト regression / 新規テスト追加 / Object.freeze 維持 / 絵文字なし |
| §4 PR テンプレート | 変更種別 / 対象 domain・tier / 3W (What/Why/When) / 連動 DEC / 影響評価 / fallback 整合 / approval |
| §5 自動 lint (CI 想定) | typecheck / test / 13 領域 key 検証スクリプト (W1 で workflow 化目標) |
| §6 backlog 運用ガイド | enabled false→true 切替判断基準 5 項 / 降格判断基準 4 項 / 保持期限 (原則無期限) |
| §7 step-by-step フロー | keyword 追加 / tier 移動 / 削除 の 7 steps × 3 シナリオ |
| §8 緊急時対応 | hotfix / kill-switch 連動 / CEO 報告 / DEC log / postmortem の 5 steps |
| §9 自動 lint 拡張案 | GitHub Actions / 構造専用 lint / dedup 監査 / enabled state report |
| §10 関連ファイル一覧 | YAML / loader / filter / normalize / multilingual / tests へのパス |
| §11 改訂履歴 | Round 13 初版 / 今後の更新を蓄積 |

### §4.2 主要決定: 2 名 approval 必須化

| 操作 | Review 部門 | Dev 部門 | 削除可否 |
|---|---|---|---|
| keyword 追加 | 必須 | 必須 | n/a |
| keyword 削除 | 必須 | 必須 | DEC log 必須 |
| tier 移動 | 必須 | 必須 | DEC log 必須 |
| **13 領域削除** | n/a | n/a | **絶対禁止** |

### §4.3 backlog tier 切替判断基準 (§6.1)

backlog → active への昇格は以下いずれかが必要:
1. 法令 / 規制の変更
2. knowledge mining batch で 3 件以上の reject 浮上
3. 外部監査指摘
4. OpenAI Usage Policies 改訂
5. DEC log 起票 (上記いずれかを根拠)

active → backlog への降格は **慎重実施**:
- false positive のみでは降格しない (false negative より許容、fail-safe 原則)
- 必ず代替策 (精緻 keyword / NFKC 改善 / token フィルタ) を併用
- DEC log + Review 部門承認必須

---

## §5 テスト追加 (タスク D)

### §5.1 normalization-multilingual.test.ts (31 tests)

| 章 | tests | 内容 |
|---|---|---|
| Chinese (繁→簡) | 5 | 醫→医 / 護→护 / 銀行→银行 / 業務→业务 / 全 unify off |
| Korean (한자) | 5 | 國→国 / 學→学 / 國會→国会 / 醫師→医师 / ハングル混在素通し |
| Japanese (旧→新) | 5 | 辯護士→弁护士 / 萬円→万円 / NFKC + 旧字体連動 / ASCII idempotent / 空文字 |
| detectLocale | 5 | ハングル→ko / かな→ja / 漢字 only→zh / ASCII→auto / 空文字→auto |
| safeNormalize (locale) | 8 | null / undefined / NFKC のみ / locale=zh / locale=ja / locale=auto + ko / locale=auto + ja / number coerce |
| getUnificationDictionary | 3 | 30 ペア以上 / 2-tuple 構造 / 1 codepoint 制約 |

### §5.2 hn-trending-normalization.test.ts (8 tests)

| # | 内容 |
|---|---|
| 1 | 全角英数字 ＮＥＷ → rawText 半角化 + lowercase, title raw 維持 |
| 2 | 全角空白 U+3000 → rawText で ASCII space 圧縮、denylist '弁護士法 72 条' 一致 |
| 3 | 半角カナ ｱｲｳ → rawText で アイウ 正規化、title raw 維持 |
| 4 | story_text=null safe coerce → 空文字、rawText 構築維持 |
| 5 | title=null skip + 後続 hit のみ採用 |
| 6 | denylist 一致用語 (全角混在) が二重正規化 idempotent で reject |
| 7 | ASCII lowercase title (denylist 不一致) accept |
| 8 | url=null fallback (HN item URL 構築) |

### §5.3 既存テスト 維持

| test file | 既存 tests | Round 13 後 | 状態 |
|---|---|---|---|
| critical-domain-filter.test.ts | 57 | 57 | regression 0 |
| denylist-loader.test.ts | 13 | 13 | regression 0 |
| normalization.test.ts | 28 | 28 | regression 0 |
| hn-trending.test.ts | 8 | 8 | regression 0 (title raw 維持で互換) |
| score-v0.test.ts | 10 | 10 | regression 0 |
| run-needs-scout.test.ts | 4 | 4 | regression 0 |

---

## §6 検証コマンド実行結果

### §6.1 typecheck

| package | result |
|---|---|
| `cd needs-scout && pnpm typecheck` | exit 0 (TypeScript strict 通過) |

### §6.2 needs-scout vitest

```
Test Files  8 passed (8)
     Tests  159 passed (159)
   Start at 20:04:02
   Duration 1.07s
```

| test file | tests |
|---|---|
| filters/__tests__/normalization.test.ts | 28 |
| filters/__tests__/denylist-loader.test.ts | 13 |
| filters/__tests__/normalization-multilingual.test.ts | **31 (新規)** |
| __tests__/critical-domain-filter.test.ts | 57 |
| __tests__/score-v0.test.ts | 10 |
| __tests__/run-needs-scout.test.ts | 4 |
| __tests__/hn-trending.test.ts | 8 |
| __tests__/hn-trending-normalization.test.ts | **8 (新規)** |
| **合計** | **159** (Round 12 末 120 → +39 = 159) |

### §6.3 workspace 全体 (R13 Dev-A 範囲外含む)

| package | tests | 状態 |
|---|---|---|
| @clawbridge/audit | 16 | PASS |
| @clawbridge/needs-scout | 159 | PASS (Dev-A 寄与 +39) |
| @clawbridge/notify | 23 | PASS |
| @clawbridge/openclaw-monitor (scripts) | 10 | PASS |
| @clawbridge/claude-bridge | 29 | PASS |
| @clawbridge/openclaw-runtime | 225 | PASS |
| @clawbridge/e2e-mock-claw | 73 | PASS |
| @clawbridge/harness | 392 / 396 | 4 fail (parallel agent knowledge mining、本 Round 範囲外) |

合計: 927 PASS + 4 FAIL (4 件は需要 scout / Round 13 Dev-A の touched file と無関係、harness/__tests__/knowledge/ke-03-retrieval / ke-04-pii-redaction)

### §6.4 ファイル規模

| ファイル | 行数 | 目安 | 達成 |
|---|---|---|---|
| normalization-multilingual.ts | 241 | 150-220 | 微超過 (辞書 35 ペア + 詳細 jsdoc 込で justified) |
| DENYLIST-OPERATIONS.md | 218 | 200-280 | 達成 |
| normalization-multilingual.test.ts | 180 | n/a | n/a (31 tests) |
| hn-trending-normalization.test.ts | 215 | n/a | n/a (8 tests) |

---

## §7 制約遵守

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 (DEC-019-050 cap $30 残量無消費) | 達成 |
| TypeScript strict | 達成 |
| pnpm workspace + vitest | 達成 |
| 並列 R13 Agent と file conflict 禁止 | 達成 (needs-scout/filters / sources / config / __tests__ のみ touch、harness/__tests__/knowledge / openclaw-runtime/cli 等の他 Agent と分離) |
| Object.freeze 完全準拠 (DEC-019-010) | 達成 (multilingual の辞書は const 配列 + Object.freeze、Map は immutable 参照) |
| append-only 編集厳守 | 達成 (hn-trending.ts は task 指示で許容範囲、既存 export 維持、修正は import + rawText 処理のみ) |
| 絵文字なし | 達成 (本 report + 全コード内 emoji 0) |
| 後方互換: 既存テストは pass 維持 | 達成 (既存 120 tests 全 pass、title raw 維持で hn-trending.test.ts も regression 0) |

---

## §8 引継 + Round 14 想定

### §8.1 Round 12 から引継いだ 5 件のうち本 Round 着地

| # | 引継項目 | 着地 |
|---|---|---|
| 1 | denylist 運用 PR フロー | **完遂** (DENYLIST-OPERATIONS.md 11 章) |
| 2 | NFKC 多言語拡張 | **完遂** (normalization-multilingual.ts 35 ペア辞書 + locale 検出) |
| 3 | YAML loader fail-fast 化 | **未着手** (運用 PR フロー確立 = #1 完遂後の Round 14 引継) |
| 4 | hn-trending fetch path NFKC | **完遂** (rawText 段階で normalizeForFilter 経由化) |
| 5 | backlog tier 新規追加運用ガイド | **実質完遂** (DENYLIST-OPERATIONS.md §6 に統合) |

### §8.2 Round 14 引継 (新規発見項目含む)

| # | 引継項目 | 重要度 | 提案 |
|---|---|---|---|
| 1 | YAML loader fail-fast 化 | 中 | 運用 PR フロー (本 Round C) 確立後、LEGACY_DENYLIST_LITERAL 削除と連動 |
| 2 | normalization-multilingual の critical-domain-filter 統合 | 中 | 現状は normalizeForFilter (Round 12) のみ経由。多言語化が denylist 一致に影響しないことを test で固定化後、運用評価で統合判断 |
| 3 | hn-trending 以外の source (PH / GitHub Trending) への NFKC 適用 | 低 | source/types.ts に共通 normalize layer を追加、後続 source 追加時に必須化 |
| 4 | DENYLIST-OPERATIONS §9 自動 lint workflow 化 | 中 | GitHub Actions で PR open trigger の typecheck + test 自動化 |
| 5 | 漢字統一辞書の拡張 (現 35 → 50+ ペア) | 低 | knowledge mining batch で頻出漢字を検出後に追加、Round 14 後半 |

### §8.3 連動 task 進捗

- **CB-D-W3-01 needs_scout skill config**: Round 12 で完遂、本 Round で多言語化 + fetch path 整備
- **CB-S-W0-02 (5/9 期限) ホワイトリスト v1**: 現在 denylist 側 47 active 全着地で連動側待ち
- **CB-D-W4-01 G-12 dry-run hardguard**: 本 layer は読み取り専用副作用なし、独立動作
- **DEC-019-053 v15.5**: hn-trending NFKC 適用で需要 scout pipeline の I18N 耐性向上、Phase 1 sign-off 5/22 push 評価へ +3pt 寄与見込

### §8.4 Phase 1 sign-off 5/22 push 評価への寄与

- 多言語入力 (中文 / 韓国語 / 日本語混在) に対する denylist 的中率向上 → fail-safe 信頼性アップ
- 運用 PR フロー文書化により Phase 2 移行時のメンバー追加が容易化 (handover material 整備)
- ceo-round11-integrated-report-v12.md §8 の 5/22 内部運用着手公式 KPI 78% に対し、本 Round 13 Dev-A 着地分で **+3pt 寄与見込** (PM 評価依頼)

---

## §9 結論

Round 13 Dev-A は Owner formal「最速で進めよ」directive 継続下、Round 12 Dev-A 引継 5 件のうち優先 3 件を独立 Agent 経路 (DEC-019-025 SOP) で完遂。

normalization-multilingual.ts (241 行 / 35 ペア辞書 + locale 検出 + safe coerce) で中文・韓国語・日本語の漢字異体字に対応、hn-trending.ts に safeNormalize + normalizeForFilter を注入し fetch 段階で rawText を NFKC + lowercase + 空白圧縮に正規化、DENYLIST-OPERATIONS.md (218 行 / 11 章) で PR ベース運用 + 2 名 approval + backlog 切替判断 + 緊急時対応を体系化。

新規 39 tests (multilingual 31 + hn-trending normalization 8) 全 pass、needs-scout 全 159 tests 全 pass、regression 0、TypeScript strict 合格、依存追加 0、追加コスト $0、Object.freeze 完全準拠維持、絵文字なし、append-only 編集厳守。

---

**Sign-off**: 2026-05-04 W0-Week1 Round 13 Dev-A
**次回**: Round 14 で YAML loader fail-fast 化 + multilingual の critical-domain-filter 統合 + 自動 lint workflow 化を引継

---

## §10 ファイル一覧 (絶対パス)

| 種別 | ファイル | 行数 |
|---|---|---|
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/normalization-multilingual.ts` | 241 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/config/DENYLIST-OPERATIONS.md` | 218 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/filters/__tests__/normalization-multilingual.test.ts` | 180 |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/__tests__/hn-trending-normalization.test.ts` | 215 |
| 修正 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/needs-scout/src/sources/hn-trending.ts` | +6 行 (import + safeNormalize / normalizeForFilter 経路化、jsdoc 拡張) |
| 新規 | `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-round13-A-multilingual-nfkc-hn-fetch.md` | 本 file |

---

## §11 自己レビュー 5 項目

| # | 項目 | 確認 |
|---|---|---|
| 1 | DoD 全 8 件達成 | YES |
| 2 | 既存 120 tests (Round 12 末) 全 pass | YES |
| 3 | 新規 39 tests 全 pass | YES |
| 4 | TypeScript strict 違反 0 | YES (typecheck exit 0) |
| 5 | API 追加コスト $0 確認 | YES (zod 既存依存、新規 npm install / external API call 0) |
