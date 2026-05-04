# Knowledge-M Round 18 第 1 波 — INDEX-v7 起票完遂

**担当**: Knowledge-M (Round 18 第 1 波 / 9 並列の 1 つ)
**着手**: 2026-05-05
**完遂対象**: INDEX-v6 (60 entries) → INDEX-v7 (70 entries) への +10 件物理化
**API コスト**: $0 (Read + Write のみ、外部 API call 0)
**副作用**: 0 (INDEX-v6 改変 0、v7 を新規起票)

---

## §1 タスク受領と前提

Round 17 第 1 波で Knowledge-L が確定した INDEX-v6（60 entries / patterns 25 + decisions 19 + pitfalls 16）を baseline に、Round 17 で蓄積された新規ナレッジ候補 5 系統を 10 entries に展開し v7 物理化。
v6 は historical baseline として無改変保持、v7 を別ファイルで起票（DEC-019-033 副作用 0 制約遵守）。

source 報告書（Round 17 由来 5 件）:
- `dev-u-r17-heartbeat-50k-load.md`（mulberry32 PRNG + vitest pickup naming）
- `dev-v-r17-hitl11-zod.md`（Hitl11WebhookKindSchema canonical 拡張 + satisfies guard）
- `dev-t-r17-w1-kickoff.md`（C-OC-03/04 + P-UI-04 DI port 注入）
- `dev-w-r17-w1-4ctrl.md`（P-UI-02/05/09 + HITL-10 完成 + 領域不可侵分業）
- `sec-l-r17-hardening-automation.md`（Sec automation 3-script + 3-SOP）

---

## §2 v7 で追加した 10 件の rationale

### §2.1 patterns/ +5 件

| ID | title | source | rationale |
|---|---|---|---|
| **PAT-061** | Mulberry32 Deterministic PRNG for Load Test | dev-u-r17 | 50k 件 load test で seedrandom 依存追加 0、Math.random() 排除、8 桁再現性担保。PRNG 内製 pattern として再利用可（subprocess load test / fixture 生成 / property-based test）。 |
| **PAT-062** | Vitest Default Include Naming Convention | dev-u-r17 §4 | vitest config 不在 harness で `.spec.ts` → `.test.ts` rename を選択した経緯。harness 全 43 file 命名統一の正の pattern として PIT-067（負の落とし穴）と対で記録。 |
| **PAT-063** | DI Port Injection 17-Day W1 7-Control | dev-t-r17 + dev-w-r17 | 7 control（C-OC-03/04 + P-UI-02/04/05/09 + HITL-10）を fetcher / notifier / killer / signer / approver port 注入で副作用 0 化。W2 統合 e2e で `evaluateAndAct` / `evaluateCooldown` / `requestPermissionApproval` 直列合成可能な構造。 |
| **PAT-064** | Sec Hardening Automation 3-Script Bundle | sec-l-r17 §2 | 副作用 0 / 絵文字 0 / tests PASS gate を bash + git plumbing + perl + node 1 行で外部依存 0 自動化。DEC-019-066 §3.2-3.4 の formal 化を script として再利用可（外部案件への横展開も容易）。 |
| **PAT-065** | satisfies Record Exhaustiveness Guard | dev-v-r17 §1.1 | `satisfies Record<KnowledgeKind, string>` で zod enum 拡張時のコンパイル時漏れ検知を保証。kindToIdPrefix 由来、Round 16 Dev-Q canonical SoT 化と接続。zod canonical SoT pattern (PAT 既存) の補完。 |

### §2.2 decisions/ +1 件

| ID | title | source | rationale |
|---|---|---|---|
| **DEC-066** | Round 17 Territory Inviolability Division | dev-t-r17 + dev-w-r17 | 9 並列波で Dev-T (3 control) と Dev-W (4 control) が領域不可侵分業を採択、共有 test ファイル 2 ケース最小編集ルールで競合 0 化。Round 18+ 並列 dispatch の標準分業ルールとして昇格。 |

### §2.3 pitfalls/ +2 件

| ID | title | severity | source | rationale |
|---|---|---|---|---|
| **PIT-067** | Vitest Spec-Test Extension Pickup Miss | medium | dev-u-r17 §4 | `.spec.ts.todo` の `.todo` 剥がし時に `.spec.ts` 命名で「No test files found」となる落とし穴。skeleton 起案時の命名未検証リスクの典型例として記録。 |
| **PIT-068** | Test Count Race Cross-Wave Dispatch | low | dev-u-r17 §5.2 | baseline 607 + Dev-U 10 = 617 想定が実測 621 に乖離、並走 Dev エージェントが heartbeat-gap-primitive.test.ts に +4 件追加していた baseline drift。9 並列波での test count 測定方法論補強。 |

### §2.4 playbooks/ +2 件（v7 新設サブディレクトリ）

| ID | title | source | rationale |
|---|---|---|---|
| **PB-069** | 17-Day Path W1 Territory Inviolability Playbook | dev-t-r17 + dev-w-r17 | 17 日 path W1 期で 7 control を Dev-T と Dev-W に分担、共有 test 2 ケース最小編集ルールで領域不可侵を達成。9 並列 dispatch wave 設計の運用 playbook として標準化。 |
| **PB-070** | Stagger Compression SOP 連続適用 Playbook | sec-l-r17 + dev-u/v/t/w-r17 | DEC-019-062 で確立した stagger 90s→45s 圧縮 SOP を Round 15 → 16 → 17 で連続 3 round 適用、heartbeat jitter + 9 並列 wave 設計と組合せた累積運用 playbook。SOP 連続適用の成熟度判定指標（draft → piloted → adopted）も提示。 |

---

## §3 INDEX-v7 構造変更点（v6 → v7 差分）

| 項目 | v6 | v7 | 差分 |
|---|---|---|---|
| 全件数 | 60 | 70 | +10 |
| patterns | 25 | 30 | +5 |
| decisions | 19 | 20 | +1 |
| pitfalls | 16 | 18 | +2 |
| **playbooks**（v7 新設） | 0 | 2 | **+2** |
| retrieval 試験 query 数 | 12 | 14 | +2 |
| tag taxonomy 系統数 | 18 | 22 | +4 |
| schema field（sec_l_automation_applied 新設） | 0 | 1 | +1 |
| frontmatter テンプレ種類数 | 3 | 4 | +1（playbooks 新設） |

---

## §4 制約遵守確認

| 制約 | 結果 |
|---|---|
| INDEX-v6 無改変 | OK（読み込みのみ、編集 0） |
| 10 件新規 entry の ID 重複なし（v6 60 件と） | OK（PAT-061〜065 / DEC-066 / PIT-067〜068 / PB-069〜070 の 10 ID は v6 未使用） |
| 各 entry が PRJ-019 RXX report に traceable | OK（全 10 件が Round 17 5 報告書のいずれかに source 明示） |
| 絵文字 0 | OK |
| 報告書 200 行未満 | 本書 約 130 行 |

---

## §5 後続 Round 18+ 引継

1. **PB-069 / PB-070 の物理 dir 起票**: 現状 INDEX-v7 では論理的に playbooks/ サブディレクトリを定義したが、`organization/knowledge/playbooks/` の物理 dir 作成と 2 件 file 物理化は Round 18 第 2 波の Knowledge 部門 backlog（INDEX-v7 §8 TODO 9 に記載）。
2. **70 件 frontmatter migration**: schema v2 + sec_k_hardening_applied + sec_l_automation_applied への一括変換は Round 18-19（TODO 2）。
3. **API spike 検知本実装**: Sec-L が Round 18 第 1 波で着手予定（DEC-019-066 §3.1 残作業）。完納時に PAT-064 と並ぶ pattern 起票を検討。
4. **retrieval 試験 query 14 種の実機検証**: 現状期待 hit 数のみ記載、Round 18 で実機 grep / FTS で 100% hit 率を再検証（INDEX-v6 query 1-12 と同様の手順）。

---

## §6 参照ファイル（絶対パス）

- 新規作成
  - `C:/Users/hiron/Desktop/claude-code-company/organization/knowledge/INDEX-v7.md`（70 entries / 約 460 行）
- 参照のみ（無改変）
  - `C:/Users/hiron/Desktop/claude-code-company/organization/knowledge/INDEX-v6.md`（60 entries baseline）
  - `C:/Users/hiron/Desktop/claude-code-company/organization/roles/secretary.md`（Knowledge ops 同部署扱い）
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-u-r17-heartbeat-50k-load.md`
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-v-r17-hitl11-zod.md`
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-t-r17-w1-kickoff.md`
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-w-r17-w1-4ctrl.md`
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/sec-l-r17-hardening-automation.md`

---

**Knowledge-M 完遂宣言**: Round 18 第 1 波 9 並列 dispatch の 1 として、INDEX-v6 → v7 への +10 entries 物理化を完遂。Round 17 由来 5 系統（heartbeat 50k load test / Hitl11 zod canonical / 17-day W1 7 control DI / Sec automation 3-script / 領域不可侵分業）を patterns 5 + decisions 1 + pitfalls 2 + playbooks 2 に構造化、retrieval 試験 14 種に拡張、tag taxonomy 22 系統 + sec_l_automation_applied schema field 追加。INDEX-v6 改変 0、API $0、副作用 0、絵文字 0。

— Knowledge-M / 2026-05-05 / Round 18 第 1 波
