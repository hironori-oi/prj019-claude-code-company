# needs-scout denylist 運用 PR フロー / DENYLIST-OPERATIONS.md

最終更新: 2026-05-04 W0-Week1 Round 13 Dev-A
位置付け: Round 12 Dev-A 引継 §8.1 #1 完遂 — `denylist.yaml` の追加 / 削除 / tier 変更 PR の標準フロー文書化。
連動 DEC: DEC-019-010 / DEC-019-025 / DEC-019-050 / DEC-019-053
連動コード: `config/denylist.yaml` / `src/filters/denylist-loader.ts` / `src/filters/critical-domain-filter.ts`

---

## §1 目的

本ドキュメントは needs-scout の `config/denylist.yaml` を変更する際の **標準 PR フロー** を定める。

`denylist.yaml` は **OpenAI Usage Policies が定める「人間確認なし完全自動化禁止 13 領域」** (DEC-019-010) を Open Claw が需要 scout フェーズで自動 reject するための fail-safe セーフティネットである。誤った変更 (誤って削除 / 誤って backlog 化 / tier の取り違え) は **法令遵守違反のリスクに直結する** ため、変更は必ず PR ベースで実施し、**Review 部門 + Dev 部門 の 2 名 approval を必須化する**。

---

## §2 対象操作と必要 approval マトリクス

| 操作 | 影響範囲 | Review 部門 approval | Dev 部門 approval | DEC log 必須 | テスト追加 |
|---|---|---|---|---|---|
| keyword 追加 (既存 tier 内) | runtime denylist 拡大 → 追加 reject | 必須 | 必須 | 任意 (記録推奨) | 必須 (1 tier × 1 case 以上) |
| keyword 削除 (既存 tier 内) | runtime denylist 縮小 → reject 漏れリスク | **必須** | **必須** | **必須** (削除根拠を残す) | 必須 (削除前テスト削除 + 必要に応じ後継 keyword 追加) |
| tier 移動 (例: backlog → minor) | enabled 切替で runtime 加入 / 除外 | **必須** | **必須** | **必須** (切替根拠 + 監査ログ) | 必須 (移動前後の挙動差分を test 化) |
| 新規 domain 追加 (13 領域以外) | denylist の領域追加 | **必須** | **必須** | **必須** | 必須 (新領域 1 件 reject 確認) |
| 新規 domain 削除 (13 領域内) | **絶対禁止** | n/a | n/a | n/a | n/a |
| version bump (構造変更) | loader schema 影響 | **必須** | **必須** | **必須** | 必須 (loader test 拡張) |

**13 領域の削除は絶対禁止**: DEC-019-010 の解釈上、13 領域は OpenAI Usage Policies の高リスク領域に対応し、削除は法令違反リスクに直結する。

---

## §3 PR 提出前のローカル確認チェックリスト

PR を起こす前に以下を確認すること:

1. **YAML lint**: `parseRestrictedYaml` の subset 制約 (block style + 2-space indent + scalar string + boolean) を満たしているか
   - 確認コマンド: `pnpm --filter @clawbridge/needs-scout typecheck && pnpm --filter @clawbridge/needs-scout test`
2. **zod schema 検証 pass**: `denylist-loader.ts` の `DenylistFileSchema.parse` が throw しないこと
3. **既存テスト regression 0**: 全 needs-scout vitest pass (現在 159 tests)
4. **新規テスト追加**: 変更 keyword / tier に対し必ず 1 件以上のテストを追加
5. **Object.freeze 維持**: loader 出力は immutable のまま (削除後に mutable な fallback コードを書かない)
6. **fallback 経路の整合**: `LEGACY_DENYLIST_LITERAL` を更新する必要があるか (audit trace 維持目的、Round 13 では削除せず)
7. **絵文字なし**: PR description / コミットメッセージ / コード内の絵文字使用 0 を確認

---

## §4 PR テンプレート

PR description には以下のセクションを含めること (markdown):

```markdown
## 変更種別
- [ ] keyword 追加 (tier 内)
- [ ] keyword 削除 (tier 内)
- [ ] tier 移動 (backlog → minor 等)
- [ ] 新規 domain 追加
- [ ] version bump
- [ ] その他 (理由を明記)

## 対象 domain / tier
- domain: <13 領域のいずれか>
- tier (変更前 / 変更後): <baseline / critical / major / minor / backlog>

## 変更理由 (3 W = What / Why / When)
- What: 何を追加 / 削除 / 移動するか
- Why: 根拠となる外部資料 / 法令 / 内部 audit (例: BACKLOG-MINOR-DENYLIST.md 第何項)
- When: いつまでに必要か (5/22 sign-off / Phase 2 等)

## 連動 DEC
- DEC-XXX-YYY (作成済 or 作成予定)

## 影響評価
- 影響を受ける既存テスト: <件数 + ファイル名>
- 新規テスト: <件数 + ファイル名>
- runtime denylist のサイズ変化: 変更前 N 件 → 変更後 M 件 (差分 ±X 件)

## fallback 整合
- LEGACY_DENYLIST_LITERAL 更新: 必要 / 不要 (理由)

## approval
- [ ] Review 部門 approval (氏名 / 日時)
- [ ] Dev 部門 approval (氏名 / 日時)
```

---

## §5 自動 lint (CI 想定)

CI で以下を必ず実行する (Round 13 W0 段階では未自動化、Round 13 後半 / W1 で確立目標):

```bash
# 1. YAML 構造検証 (zod schema 経由)
cd projects/PRJ-019/app/needs-scout
pnpm typecheck

# 2. テスト全 pass
pnpm test

# 3. denylist-loader が 13 領域を全て認識すること
node -e "import('./dist/filters/denylist-loader.js').then(m => { const keys = m.loadDomainKeys(); if (keys.length !== 13) { console.error('Domain count != 13: ' + keys.length); process.exit(1); } })"
```

---

## §6 backlog tier 運用ガイド

`backlog` tier は Round 11 minor 16 件の audit lineage 保存 + 将来候補の暫定置き場として導入された (Round 12 Dev-A)。`enabled: false` で runtime には登場せず、`loadDenylistFullTable()` 経由で audit 経路のみ可視化される。

### §6.1 enabled: false → enabled: true への切替判断基準

backlog の keyword を活性化 (= minor / major / critical 等の tier に昇格) する判断基準:

1. **法令 / 規制の変更**: 該当 keyword を含む業務領域が新たに法規制対象になった場合 (例: 新法施行で「自動○○判定」が業法違反となる場合)
2. **過去 reject 事例の蓄積**: knowledge mining batch でその keyword を含む需要が複数回 (= 3 件以上) reject 候補として浮上した場合
3. **外部監査指摘**: Review 部門 / 外部監査人が backlog → active 化を必須事項として勧告した場合
4. **OpenAI Usage Policies の改訂**: OpenAI が 13 領域を改訂し、該当 keyword が新たに該当する判断ができた場合
5. **DEC log 起票**: 上記いずれかを根拠に DEC-XXX-YYY を起票してから tier 移動 PR を出すこと

### §6.2 enabled: true → enabled: false への降格判断基準

active tier から backlog tier への降格 (= runtime 除外) は **慎重に実施すること**:

1. **誤検出が運用上の重大な障害になる場合のみ** 検討する
2. 単に false positive が増えただけでは降格しない (false negative より false positive を許容するのが fail-safe 原則 / DEC-019-010)
3. 降格時は必ず **代替策** (より精緻な keyword への置換 / NFKC 正規化前段の改善 / token 単位フィルタ追加等) を併用する
4. DEC log + Review 部門承認必須

### §6.3 backlog 保持期限

- 原則として backlog tier は **無期限保持** (audit lineage 維持目的)
- **削除候補**: 12 ヶ月経過 + 一度も active 化されず + 関連する knowledge mining hit 0 件の場合のみ Review 部門承認で削除を検討
- 削除時は必ず DEC log + 削除前 snapshot (git tag / git annotate) を残すこと

---

## §7 変更フロー詳細 (step-by-step)

### §7.1 keyword 追加 PR フロー (例: minor tier に新規 keyword 1 件追加)

1. **branch 切る**: `git checkout -b denylist/add-<domain>-<keyword-slug>`
2. **YAML 編集**: `config/denylist.yaml` の対象 domain → minor → keywords 配下に 1 行追加 (アルファベット順 or 既存順を踏襲)
3. **fallback 経路更新**: `critical-domain-filter.ts` の `LEGACY_DENYLIST_LITERAL` に同じ keyword を追加 (audit trace 維持)
4. **テスト追加**: `__tests__/critical-domain-filter.test.ts` に 1 件以上の reject case を追加
5. **typecheck + test 実行**: `pnpm typecheck && pnpm test` で全 pass 確認
6. **PR 起票**: §4 テンプレートに従い 2 名 approval 待ち
7. **merge 後**: dashboard / progress.md に追加件数を 1 行 record

### §7.2 tier 移動 PR フロー (例: backlog → minor 昇格)

1. **DEC log 起票** (前提): 昇格根拠を decisions.md に DEC-XXX-YYY として記録
2. **branch 切る**: `git checkout -b denylist/promote-<domain>-<keyword-slug>-backlog-to-minor`
3. **YAML 編集**: 該当 keyword を minor tier に移動 (元の backlog tier に audit lineage として残置するか削除するかは PR 内で判断)
4. **dual placement 注意**: Round 12 Dev-A の dual placement 設計に倣い、minor + backlog 両方に同 keyword 残置することで loader dedup により runtime 重複は出ない
5. **テスト追加**: 昇格後 runtime denylist に当該 keyword が含まれることを test で固定化
6. **PR 起票 + 2 名 approval**
7. **merge 後**: progress.md に tier 変更 1 行 record + DEC log 完結 record

### §7.3 keyword 削除 PR フロー (慎重実施)

1. **DEC log 起票** (必須): 削除根拠を decisions.md に DEC-XXX-YYY として記録
2. **branch 切る**: `git checkout -b denylist/remove-<domain>-<keyword-slug>`
3. **YAML 編集**: 該当 keyword を keywords 配列から削除
4. **fallback 経路更新**: `LEGACY_DENYLIST_LITERAL` からも削除 (audit lineage は git history で確認可能)
5. **代替策併記** (推奨): より精緻な keyword に置換する場合は同 PR 内で追加 keyword も含める
6. **テスト調整**: 削除前テストを削除 (または skip 化、理由は test description に明記)
7. **PR 起票 + 2 名 approval**

---

## §8 緊急時対応 (incident response)

denylist 起因で重大インシデント (= 重要 13 領域案件が Open Claw により自動 accept された場合) が発生した場合:

1. **即時 hotfix PR**: 該当 keyword を該当 domain の critical tier に追加 (PR ベースだが緊急時は 30 分以内 merge を許容、approval は事後追認可)
2. **kill-switch 連動**: harness/kill-switch.ts の運用判定で needs-scout 経路を一時 disable
3. **CEO 報告**: ceo-round-incident-report.md として 200 字 + 経緯 + 改修内容 + 再発防止策をオーナーへ
4. **DEC log 起票**: incident 経緯と恒久対策を DEC-XXX-YYY として記録
5. **postmortem**: knowledge mining batch に incident 事例を pitfalls/ として蓄積

---

## §9 自動 lint 拡張案 (Round 13 Dev-A 引継 / W1 検討)

現状の lint は手動実行依存。W1 以降で以下を CI 化検討:

1. **GitHub Actions workflow**: PR 開閉 trigger で `pnpm typecheck && pnpm test` 自動実行
2. **denylist 構造専用 lint**: `parseRestrictedYaml` を script 化し、PR diff の denylist.yaml に対して syntax error / schema violation を comment 化
3. **dedup 監査**: tier 内 keyword 重複 / domain 内 dedup の冗長を warning 化
4. **enabled state report**: PR 内で全 tier の enabled 状態を表 形式で表示し、誤った enabled: false を見落とさない

---

## §10 関連ファイル

| 種別 | path | 用途 |
|---|---|---|
| YAML データ | `config/denylist.yaml` | 13 領域 × 4 tier の keyword 列 |
| ドキュメント | `config/DENYLIST-OPERATIONS.md` (本 file) | 運用 PR フロー |
| loader | `src/filters/denylist-loader.ts` | YAML → runtime denylist 変換 |
| filter | `src/filters/critical-domain-filter.ts` | runtime denylist + LEGACY fallback |
| normalize | `src/filters/normalization.ts` | NFKC + lowercase + 空白圧縮 (Round 12 Dev-A) |
| multilingual | `src/filters/normalization-multilingual.ts` | 漢字統一辞書 (Round 13 Dev-A) |
| tests | `src/filters/__tests__/denylist-loader.test.ts` | YAML parse + runtime build + tier filter |
| tests | `src/__tests__/critical-domain-filter.test.ts` | 13 領域 × 各 tier の reject 確認 |

---

## §11 改訂履歴

| 日付 | Round | 変更 |
|---|---|---|
| 2026-05-04 | Round 13 Dev-A | 初版作成 (Round 12 §8.1 #1 引継完遂) |

---

**Sign-off**: 2026-05-04 / Dev R13 Dev-A
**Next**: Round 13 後半 / W1 で CI 自動 lint workflow 確立 (§9 拡張案)
