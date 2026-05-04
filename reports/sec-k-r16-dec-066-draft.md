# Sec-K 報告書 — DEC-019-066 起案 draft（Round 16 SOP formal 化 + stagger 圧縮 SOP 拡張 + Sec hardening）

**作成**: 2026-05-05（Round 16 第 2 波） / **担当**: Sec-K / **連動 DEC**: DEC-019-058 / 062 / 064 / 065 (PM-I) / **066 起案中（本書）**
**status**: 起案 draft 完了 → CEO レビュー待ち → 5/26 formal レビュー期限

---

## §1 起案概要

DEC-019-066 は Round 15 で実証した stagger 圧縮（T+150-180 → T+50、約 1/3 短縮）を Round 16 以降で SOP として再現可能化し、Sec hardening 4 項目（API spike 検知 / 副作用 0 自動検証 / 絵文字 0 自動チェック / tests PASS gate）を組織横断 formal 化する起案。本報告書は Sec-K による起案 draft の概要 + 連携 + レビュー期限明示を目的とする。

---

## §2 採択内容 3 軸

### §2.1 軸-① Round 16 SOP formal 化
- dispatch 順序: 第 1 波（T+0〜T+50、最大 5 並列）+ 第 2 波（T+0〜T+150、最大 4 並列）
- authorize 範囲: Owner formal directive 不要（CEO authorize で完結、DEC-019-058 SOP 例外時のみ Owner 介入）
- 集計手順: CEO 統合報告 v17 にて 4 項目チェック PASS 確認

### §2.2 軸-② stagger 圧縮 SOP の数値化
- 第 1 波: T+0 〜 T+50（Round 15 実績準拠）
- 第 2 波: T+0 〜 T+150（旧 T+150-180 帯の上限維持下の圧縮）
- 例外: (a) Owner directive 緊急 / (b) drill #2 連動 / (c) API spike 検知時 5 分停止

### §2.3 軸-③ Sec hardening 追加 4 項目
- API spike 検知（過去 3 round 平均 + 2σ）
- 副作用 0 自動検証（Read/Edit/Write 限定、`git status` 差分確認）
- 絵文字 0 自動チェック（NFKC + 35 ペア多言語フィルタ、Sec-J 既存）
- tests PASS gate（baseline 791 PASS 維持）

---

## §3 連動 DEC との関係

| DEC | 役割 | DEC-019-066 との関係 |
|---|---|---|
| DEC-019-058 | Owner formal authorize SOP | dispatch 例外条件 (b) で AND 連動 |
| DEC-019-062 | stagger 圧縮 SOP（CEO 起案） | 軸-② で数値化 + formal 化 |
| DEC-019-064 | Phase 1 W1 SOP | tests PASS gate baseline 791 を W1 着手時点で確定 |
| DEC-019-065 | Round 16 9 並列構成（PM-I 起案中） | 第 1 波 / 第 2 波部署配分は PM-I 案を Sec hardening 視点で承認 |

**特に DEC-019-065 (PM-I) との連携**:
- PM-I が「9 並列構成 + 部署配分」を起案、Sec-K が「dispatch 順序 + Sec hardening」を起案 → 5/26 formal レビュー時に DEC-065 と DEC-066 を統合採択する想定
- PM-I 案の部署配分（PM/Research/Dev = 第 1 波、Marketing/Review/Knowledge/Secretary/Web-Ops/Sec = 第 2 波）を §2.1 で踏襲
- 統合採択時に重複条項があれば DEC-066 が Sec hardening 範囲のみ優先、PM-I 案が部署配分 + 構成範囲で優先

---

## §4 代替案 + 採用根拠 + リスク

### §4.1 代替案
- **代替案 A**: stagger 圧縮を T+0〜T+30（更に圧縮）
  - 却下根拠: Round 15 で T+50 達成も再現性 80% 留まり、T+30 は API spike risk 高
- **代替案 B**: Sec hardening を 4 項目から 6 項目（rate-limit / token rotation を追加）
  - 却下根拠: subscription plan 主軸（DEC-019-051）下で rate-limit は API spike 検知で代替、token rotation は Phase 2 範囲
- **代替案 C**: SOP 形式ではなく round 別 ad-hoc 運用継続
  - 却下根拠: Round 17 以降の再現性が CEO 個人スキルに依存、組織化志向と矛盾

### §4.2 採用根拠
- (a) Round 15 実績で T+50 / T+150 達成 → 数値化 SOP 化が可能 fact
- (b) Sec-J で絵文字 0 + NFKC + 35 ペア辞書を formal 化済 → §2.3 の絵文字 0 自動チェックは即適用可能
- (c) tests baseline 791 PASS（R12 達成）→ regress 検知 gate を即運用可能
- (d) API $0 維持と 100% 整合（subscription plan 主軸）
- (e) Owner formal「最速で進めよ」directive 継続中、SOP 化で round 単位の judgement コスト削減

### §4.3 リスク
- **R1（中）**: T+50 圧縮の Round 16 再現性が 60% 程度に留まる可能性 → fallback で T+150 帯保持、5/26 レビューで実績検証
- **R2（低）**: API spike 検知で誤検知 → 過去 3 round 平均 + 2σ 閾値で false positive 低減、CEO ack で即解除
- **R3（低）**: 絵文字 0 自動チェックで既存 artifact の emoji 痕跡誤検出 → §3.3 で「read-only は記録のみ」明記済
- **R4（低）**: tests PASS gate で外部 dependency 起因の regress を Sec のせいに帰責される → Review 部門連携で帰責切分

---

## §5 5/26 レビュー期限と次工程

- **レビュー期限**: 2026-05-26（Round 16 〜 Round 18 想定 3 round 分の運用実績集計後）
- **レビュー担当**: Review 部門 + Sec / **報告先**: CEO 経由 Owner
- **レビュー対象**: §2 採択内容 3 軸の運用実績 / 圧縮達成率 / 例外発動回数 / regress 件数
- **次工程**:
  1. 5/5 〜 5/26 の Round 16 / 17 / 18 で SOP 暫定運用
  2. 各 round の Sec runsheet 連動チェック項目を CEO 統合報告に集計
  3. 5/26 formal レビュー時に DEC-019-065 (PM-I) と DEC-019-066 (本起案) を統合採択
  4. 統合採択後は Round 19 以降で formal SOP として固定運用、Phase 1 W4 完遂（6/20）まで継続

---

## §6 制約遵守確認

- API 消費: **$0**（Read + Write のみ） / 副作用: **0**（decisions.md 追記 / runsheets/ + reports/ 新規作成のみ）
- 絵文字: **0**（本書 + runsheet + DEC 起案セクション 全 0 検証済）
- tests 影響: **0**（文書のみ、code 改変なし、baseline 791 維持）
- 既存 DEC 改変: **0**（DEC-019-066 セクション追記のみ、DEC-019-001〜065 は未改変）

---

## §7 提出 artifact

- 起案: `projects/PRJ-019/decisions.md` 末尾に DEC-019-066 セクション追記（約 100 行）
- runsheet: `projects/PRJ-019/runsheets/sec-round16-sop.md`（約 110 行、新規作成）
- 報告書（本書）: `projects/PRJ-019/reports/sec-k-r16-dec-066-draft.md`（約 110 行、新規作成）

**報告書行数**: 約 110 行（80-120 行制約内）
