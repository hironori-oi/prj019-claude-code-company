# PRJ-019 Clawbridge — W0-Week1 検収会議 公式配布資料 v4 確定版（120 分版、Q-Mkt 事後承認 + PRJ-020 報告枠統合）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 秘書部門（CEO 経由配布）
- 制定日: 2026-05-03
- 版: **v4 確定版 (FINAL)** — v3 (`secretary-w0-week1-meeting-agenda-v3-final.md`、120 分版) を本日 5/3 オーナー指示「CEO 推奨で進めて下さい」受領 + PRJ-020 ClawDialog 起案を反映して再構成
- 制定根拠決裁: **DEC-019-025**（エージェント tool 権限 SOP、本資料の物理書込発注根拠）
- 関連決裁: **DEC-019-021〜024**（W0-Week2 前倒し並列成果）／ **DEC-019-026〜029**（Q-Mkt 公式 DEC 4 件、本日 5/3 公式起票済）／ **DEC-019-030**（G-Top-1 (a)+(e) ハイブリッド採用、本日 5/3 公式起票済、5/8 検収会議で正式承認）／ **DEC-020-001〜003**（PRJ-020 ClawDialog 起案 + Phase 0 + 同居実装、本日 5/3 公式起票済）
- 親文書: v3 `secretary-w0-week1-meeting-agenda-v3-final.md`（409 行）
- 配布範囲: Owner + 7 部署（CEO / Dev / Research / Review / PM / 秘書 / Marketing）
- 配布媒体: Markdown 文書、印刷可能体裁

---

## §0. 200 字 サマリ + v3 → v4 変更点

### §0.1 200 字 サマリ

5/8 18:00〜20:00（**120 分**、Owner + 7 部署出席、議題 §1〜§5）。**§1 Dev エビデンス（25 分）→ §2 Research 補追検証（20 分）→ §3 Review 検収結果（25 分）→ §4 W0 完了 13 基準確認 + Go/NoGo 仮判定（20 分）→ §5 PM 追加議題 + Q-Mkt 事後承認 + PRJ-020 報告（30 分）**。最終 Go/NoGo 着地予測「**5 完全 Pass + 2 条件付き Pass**」、Phase 1 着手 5/19 確度「強い条件付き Go」継続。Q-Mkt 8 件は本日 5/3 オーナー一任受領で事後承認モード、PRJ-020 Phase 0 結果報告 5 分追加。最終 Go 判定は 5/18 の W0 完了報告で確定。

### §0.2 v3 → v4 主要変更点（本書 §0 冒頭で明記）

| 変更点 | v3（基準） | v4（本書） | 理由 |
|---|---|---|---|
| **§5 後半 Q-Mkt 議論** | 後半 10 分 = Q-Mkt 8 件投票 + DEC 4 件起票 | **後半 5 分 = 事後承認モード**（議事録 1 行記録のみ） | 本日 5/3 オーナー「CEO 推奨で進めて下さい」明示指示で DEC-019-026〜029 公式起票済（事後承認形態） |
| **§5(c) G-Top-1 採用案** | 5 分（候補比較中心） | **10 分に拡大** | DEC-019-030 (a)+(e) ハイブリッド採用案を公式承認、Phase 1 デモ DoD 詳細議論 + FN-Black 補正計画確認 |
| **§5(d) PRJ-020 報告枠** | 未含有 | **5 分新規追加** = PRJ-020 ClawDialog Phase 0 結果報告 | DEC-020-001〜003 起案で Phase 0 4 並列発注成果を 5/8 で報告 |
| **§5 全体タイムボックス** | PM 議題 30 分（5.1〜5.5） | **PM 議題 30 分を再分配**（§5.1 PM v4 5 分 / §5.2 DEC-019-021〜024 5 分 / §5.3 5/15 競合 5 分 / §5(c) G-Top-1 10 分 / §5(d) PRJ-020 5 分 = 計 30 分維持） | Q-Mkt 事後承認モード移行で削減した 5 分を §5(c) +5 分 / §5(d) +5 分（実質 +5 分は §5.4 W0-W2 タスク台帳 5 分を §5.3 競合解消に統合） |
| **総時間** | 120 分 | **120 分維持**（90 分 + §5 30 分） | タイムボックス再計算で合計維持 |
| **添付資料件数** | 18 件 | **20 件**（CEO 採択書 + PRJ-020 4 並列成果 5 件追加 = 純増 5 件、ただし PRJ-020 は §5(d) 報告で別添扱い） | DEC-019-026〜030 + DEC-020-001〜003 起票根拠の追加 |

---

## §1. 会議メタ情報

| 項目 | 内容 |
|---|---|
| **日時** | 2026-05-08 (木) 18:00〜20:00 JST |
| **所要** | 120 分（v2 90 分版 + PM 議題 §5 30 分、v3→v4 で内訳再分配） |
| **形式** | オンライン（既定の社内会議システム） |
| **議事録担当** | 秘書部門（議事中に DEC-019-XXX 起票同時進行） |
| **録画方針** | 全議題録画、録画ファイルは `projects/PRJ-019/reports/meetings/2026-05-08-w0-week1-review.mp4`（命名規則準拠） |
| **議題公開先** | 第一階層: Owner 直配布 ／ 第二階層: 各部署内（CEO 経由） |
| **出席者** | Owner（決裁者）／ CEO（議事進行）／ Dev / Research / Review / PM / 秘書 / Marketing（各部署 1 名以上） |
| **欠席時運用** | Owner 欠席なら全議題持帰り。各部署欠席なら録画 + 議事録 24h 内回付 + 持帰り承認 |
| **公開リードタイム** | 5/7 22:00 までに各部署最終資料提出、5/8 12:00 までに本資料 v4 + 添付物一式を CEO 経由配布 |

---

## §2. 議題 §1〜§5 タイムボックス（120 分配分、v4 再計算）

### §2.1 全体タイムテーブル

| 時刻 | 議題 | 主担当 | 所要 | アウトプット |
|---|---|---|---|---|
| 18:00–18:05 | 開会、目的確認、3 大ハイリスク事前共有（§7 参照）+ Q-Mkt 事後承認モード説明 | CEO | 5 分 | — |
| 18:05–18:30 | **§1 Dev エビデンス** | Dev → Review 検収 | 25 分 | Pass/Fail 判定（5 完全 + 2 条件付き Pass 着地予測） |
| 18:30–18:50 | **§2 Research 補追検証** | Research | 20 分 | DEC-019-021 / DEC-019-022 公式承認（Owner 再確認済） |
| 18:50–19:15 | **§3 Review 検収結果** | Review | 25 分 | 検収 Go / 条件付き Go 判定 |
| 19:15–19:35 | **§4 W0 完了 13 基準確認 + Go/NoGo 仮判定** | CEO + Owner | 20 分 | 仮 Go / 仮 NoGo（最終は 5/18） |
| 19:35–20:05 | **§5 PM 追加議題 + Q-Mkt 事後承認 + PRJ-020 報告** | PM + 秘書 | 30 分 | DEC-019-030 正式承認 + PRJ-020 Phase 0 報告受領 + 最終 Go/NoGo 統合判定 |
| 20:05 | 閉会、決議内容の `decisions.md` 反映確認 | 秘書 | （5 分超過バッファ含む） | — |

### §2.2 §5 内訳タイムテーブル（30 分の v4 再分配）

| 時刻 | 議題 | 所要 | v3 比 |
|---|---|---|---|
| 19:35–19:40 | §5.1 PM v4 公式承認 | 5 分 | ±0 |
| 19:40–19:45 | §5.2 DEC-019-021〜024 公式承認（Owner 再確認） | 5 分 | ±0 |
| 19:45–19:50 | §5.3 5/15 競合解消承認 + W0-W2 タスク台帳 29 件統合承認 | 5 分 | -5（§5.4 を §5.3 に統合） |
| 19:50–20:00 | **§5(c) G-Top-1 採用案 (a)+(e) ハイブリッド (DEC-019-030) 公式承認** | **10 分** | **+5** |
| 20:00–20:05 | **§5(d) PRJ-020 ClawDialog Phase 0 結果報告（新規）** | **5 分** | **+5** |
| — | §5 後半 Q-Mkt 8 件 = **事後承認モード**（議事録 1 行記録のみ） | **5 分→0 分実時間 + 議事録 1 行記録のみ**（読み上げ 1 分以内 + 残時間は §5(c) に吸収済） | **-5（実時間ゼロ化、§5(c)/(d) に再分配済）** |

**注**: §5 後半 Q-Mkt 8 件の事後承認モードは、§5(c) G-Top-1 議論の冒頭 1 分で「DEC-019-026〜029 既決報告 + 議事録 1 行記録」を秘書が読み上げ、追加議論時間ゼロで完結。

### §2.3 議題サマリ表

| 議題 | 時間 | 担当 | 内容 | 期待アウトプット |
|---|---|---|---|---|
| §1 Dev エビデンス | 25 分 | Dev | 95 tests 緑 / 11 controls evidence / mock-claude / TimeSource / W0-W2 prep ブートストラップ完遂 | 5 完全 Pass + 2 条件付き Pass 着地予測 |
| §2 Research 補追検証 | 20 分 | Research | OP-1〜5 + P-D 改 resilient + R-019-12 再格付け + 4 系統 changelog Runbook | DEC-019-021/022 公式承認（Owner 再確認済） |
| §3 Review 検収結果 | 25 分 | Review | チェックリスト + ペネトレ B1〜B6 + ToS allowlist DoD 統合 + BAN drill #1 シナリオ | 検収 Go / 条件付き Go の判定 |
| §4 W0 完了 13 基準確認 + Go/NoGo | 20 分 | CEO + Owner | Dev 13 基準達成度確認 → W1 着手 (5/19) Go/NoGo 仮判定 | 仮 Go / 仮 NoGo（最終は 5/18） |
| §5 PM 追加議題 + Q-Mkt 事後承認 + PRJ-020 報告 | 30 分 | PM + 秘書 | PM v4 + DEC-019-021〜024 + 5/15 競合 + W0-W2 台帳 + G-Top-1 + Q-Mkt 事後承認 + PRJ-020 Phase 0 報告 | DEC-019-030 正式承認 + PRJ-020 Phase 0 受領 + 統合 Go/NoGo |

---

## §3. §5 PM 追加議題の詳細（v4 再分配版）

### §3.1 議題 §5.1 — PM v4 公式承認（5 分、v3 同）

**主担当**: PM 部門（CEO 補佐、Owner 承認）

**承認対象**: `reports/pm-cost-and-controls-plan-v4.md`

**承認核心 6 点**:
1. 必須コントロール **28 → 34 項目**（H-09 / H-10 / HITL 第 6 種 `tos_gray_review` / G-Top-1〜4、純増 6）
2. Phase 1 月次追加発生コスト 中央値 **$13 → $33** / 上限 **$73 → $93**（Vercel Sandbox $26 + Hosting Pro $20 上方修正反映）
3. 月次ハードキャップ **$300 維持**（DEC-019-012）
4. PM v5 起案トリガー **TR-1〜TR-3** 公式組込
5. HITL 種別 **5 → 6 種**（DEC-019-018）+ HITL 第 7 種 `external_api` 追加（DEC-019-022）= **計 7 種**、**第 8 種 `owner_input_review` は PRJ-020 で追加予定（§5(d) 報告）**
6. v3 → v4 数値差分の最終確認（v4 を Phase 1 着手 5/19 前の最終確定版として扱う）

**判定方式**: CEO 仮承認 → Owner 即決 or 持帰り

### §3.2 議題 §5.2 — DEC-019-021〜024 公式承認（5 分、v3 同）

**主担当**: 秘書部門（読み上げ）+ CEO（再確認）+ Owner（最終承認）

| 決裁 | 内容 | 5/3 即決状況 | 5/8 公式承認の意義 |
|---|---|---|---|
| **DEC-019-021** | R-019-12 を「赤」→「黄」降格、新規 R-019-12-A（赤）/ R-019-12-B（黄）に分割再格付け、C-OC-01〜05 発令 | 即決済 | Owner 直接面前で再確認、Phase 1 リスクポートフォリオ過大評価防止 |
| **DEC-019-022** | 4 系統 changelog 監視運用採用、Dev W2 中盤実装発令、HITL 第 7 種 `external_api` 追加 | 即決済 | 5/19〜5/25 監視空白期間（§7.2）の手動 fallback 運用を Owner と確認 |
| **DEC-019-023** | PM v5 起案トリガー **TR-1**（5/13 BAN drill #1 Fail）/ **TR-2**（5/30 NG-3 暫定値変更）/ **TR-3**（6/13 Phase 2 Go）正式確定 | 即決済 | 各 TR の Phase 1 期間中分岐点を Owner と再確認、PM 起案期日明示 |
| **DEC-019-024** | Vercel Hobby→Pro 昇格判断を W3 中盤（2026-06-03）公式 CEO 決裁タスク **CB-CEO-W3-01** として確定 | 即決済 | dashboard カラム化 + CEO 決裁マイルストン明示 |

**判定方式**: 5/3 即決済の 4 件を Owner 直接面前で再確認し、議事録に「Owner 再確認済」を明記

### §3.3 議題 §5.3 — 5/15 競合解消承認 + W0-W2 タスク台帳 29 件統合承認（5 分、v4 で統合）

**主担当**: PM + 秘書

**v3 → v4 変更**: v3 §5.3（5/15 競合 5 分）+ v3 §5.4（W0-W2 台帳 5 分）を **5 分に統合**（後者は読み上げのみ + 質疑なし運用）

**競合内容**: PRJ-019 W0-Week2 で **5/15（金）**に Dev 6+ タスク並列発生（W2-D-07 OAuth 物理隔離 / W2-D-08 Sumi/Asagi バックアップ / W2-D-13 DoD 3 分岐 / W2-D-Docs / その他細目 + PRJ-018 Asagi タスク **AS-151**）

**解消提案**:
- **AS-151 を 5/16（土）にスライド**（PRJ-018 Asagi タスク、PM 部門経由で PRJ-018 PM へ調整依頼）
- 調整依頼の起票は **5/8 22:00 まで**（議事録確定後）に秘書部門が PRJ-018 PM 経由で送付
- スライド失敗時の代替案: PRJ-019 側 W2-D-Docs を 5/14 に前倒し、5/15 の Dev 並列を 5 タスク以下に圧縮

**W0-W2 タスク台帳 29 件**: PM 1 分読み上げ → CEO 承認 → Owner 即決（質疑なし、詳細は配布資料 P-2）

**判定方式**: CEO 提案 → Owner 承認（PRJ-018 オーナー側調整可否を口頭確認 + W0-W2 台帳即決承認）

### §3.4 議題 §5(c) — G-Top-1 採用案 (a)+(e) ハイブリッド (DEC-019-030) 公式承認（10 分、v3 比 +5 分）

**主担当**: CEO 公式承認 + Owner 直接面前で再確認

**v3 → v4 変更**: v3 §5.5（G-Top-1 5 分、ジャンル選定議論）→ v4 §5(c)（10 分、DEC-019-030 公式承認 + Phase 1 デモ DoD 詳細議論 + FN-Black 補正計画）

**承認対象**: **DEC-019-030**（本日 5/3 公式起票済、(a)+(e) ハイブリッド採用）

**10 分内訳**:
- (1) 秘書部門 DEC-019-030 読み上げ（1 分）
- (2) CEO による (a)+(e) ハイブリッド採用根拠 6 点説明（3 分）: ① 両者 whitelist confidence ≥ 0.85 / ② HN（technical）+ IH（productivity）の複合データ多様性 / ③ FN-Black ≤ 10% 二重検証可能 / ④ payment processing 含有時 HITL 第 7 種で除外 / ⑤ Heading A（DEC-019-027）と整合 / ⑥ HP 事例ページ 2 ジャンル併記可能
- (3) Phase 1 デモ DoD 詳細確認（3 分）: HN/IH trending → /new-project → Next.js 雛形 → Vercel Sandbox → Review 合格 → preview deploy → Slack 通知 < 60 min/件、< $5/件、10 連続成功率 ≥ 80%
- (4) Dev W2-R-04 FN-Black アノテ 60 件 + IH 補正データ統合計画確認（2 分）: HN 60 件 + IH 30 件追加で計 90 件、ジャンル偏重補正は W3 中盤（5/26）と W4 終盤（6/9）の 2 回再評価
- (5) Owner 最終確認（1 分）: 異議なき場合は議事録に「Owner 再確認済」明記、異議あれば持帰り判断

**判定方式**: CEO 公式承認 → Owner 直接面前で再確認 → DEC-019-030 公式確定（5/3 起票済を 5/8 で正式承認）

### §3.5 議題 §5(d) — PRJ-020 ClawDialog Phase 0 結果報告（5 分、v4 新規）

**主担当**: 秘書部門（読み上げ）+ CEO（補足）+ Owner（受領確認）

**報告対象**: PRJ-020 Phase 0 の 4 並列発注成果（本日 5/3 中に完遂予定）

**5 分内訳**:
- (1) 秘書部門 DEC-020-001〜003 読み上げ（1.5 分）: PRJ-020 起案 / Phase 0 スコープ / 同居実装方針
- (2) Phase 0 4 並列成果サマリ（2.5 分）:
  - CEO スコープ定義書 `ceo-prj020-scope-definition.md`（256 行、§0〜§10）
  - Research 接続方式調査 `research-prj020-connection-method.md`（5/3 着地）
  - Dev 実装 skeleton `dev-prj020-implementation-skeleton.md`（5/3 着地）
  - Review セキュリティリスク評価 `review-prj020-security-risk.md`（5/3 着地）
- (3) Phase 1 PoC Go/NoGo 判定議題追加予告（1 分）: 6/13 検収会議で PRJ-020 Phase 1 PoC（6/14〜6/27、2 週間、PoC DoD: 1 件 Owner 投入 → Open Claw 判定 → Owner フィードバック e2e 動作確認）の Go/NoGo を別決裁 DEC-020-XXX で判定

**判定方式**: CEO 提案 → Owner 受領確認（議事録に「Owner Phase 0 結果受領済 / 6/13 Phase 1 PoC Go/NoGo 議題追加同意」明記）

---

## §4. 配布資料一覧（添付物、v4 で計 20 件）

### §4.1 Dev 部門（添付 5 件）

| # | ファイル | 内容 |
|---|---|---|
| D-1 | `reports/dev-w0-week1-evidence-and-mockclaw.md` | W0-Week1 実装報告 + mock-claude 5 シナリオ + TimeSource pattern |
| D-2 | `reports/dev-w0-week2-prep-report.md` | HITL 第 6 種雛形 + openclaw-runtime ラッパ skeleton + architecture-w0.md / security-w0.md ドラフト |
| D-3 | `reports/control-evidence/index.md` | 11 controls evidence 一覧 |
| D-4 | `reports/control-evidence/G-XX-evidence.md` × 8 | 各コントロールの単体検証ログ |
| D-5 | `app/docs/architecture-w0.md` / `security-w0.md` | アーキテクチャ + セキュリティ設計（Mermaid 計 6 枚） |

**実機検証結果**: Windows 11 / Node 24.11.1 / pnpm 9.12.0 で `pnpm test` **11 files / 95 tests 全緑**、既存 PRJ-001〜018 への副作用ゼロ。

### §4.2 Research 部門（添付 3 件）

| # | ファイル | 内容 |
|---|---|---|
| R-1 | `reports/research-w0-supplement-op1-op5.md` | OP-1〜OP-5 一次裏取り、Phase 1 月 30〜90 ループ実装可能性「YES（条件付き）」確定 |
| R-2 | `reports/research-w0-supplement-pd-modified-revalidation.md` | OpenClaw OSS 上流「personal AI assistant」化を踏まえた P-D 改 resilient 確定、R-019-12 再格付け提案 |
| R-3 | `reports/research-changelog-monitoring-runbook.md` | 4 系統 changelog 監視 Runbook、L1/L2/L3 通知 3 段階、HITL 第 7 種 `external_api` |

### §4.3 Review 部門（添付 4 件）

| # | ファイル | 内容 |
|---|---|---|
| V-1 | `reports/review-w0-week1-verification-checklist.md` | 検収チェックリスト 7 項目 |
| V-2 | `reports/review-w0-week1-pentest-scenarios.md` | ペネトレーション B1〜B6 シナリオ（45 試行） |
| V-3 | `reports/review-tos-allowlist-dod-integration-v1.md` | ToS allowlist DoD 統合 v1 |
| V-4 | `reports/review-ban-drill-1-scenario.md` | BAN drill #1 シナリオ（5 SLA） |

### §4.4 PM 部門（添付 2 件）

| # | ファイル | 内容 |
|---|---|---|
| P-1 | `reports/pm-cost-and-controls-plan-v4.md` | コスト & コントロール統合計画 v4（必須コントロール 34 / 中央値 $33 / 上限 $93） |
| P-2 | `reports/pm-w0-week2-execution-plan.md` | W0-Week2 実行計画（29 タスク × 6 部署、Critical Path 5 ステップ） |

### §4.5 Marketing 部門（添付 2 件、参考）

| # | ファイル | 内容 |
|---|---|---|
| M-1 | `reports/marketing-portfolio-reflection-design.md` | Phase 1 完了時の自社 HP ポートフォリオ反映設計 |
| M-2 | `reports/marketing-knowledge-reflection-design.md` | Phase 1 完了時の社内ナレッジ K1〜K10 反映設計 |

### §4.6 CEO 部門（添付 3 件、v4 で +1）

| # | ファイル | 内容 |
|---|---|---|
| C-1 | `reports/ceo-w0-week1-consolidation.md` | W0-Week1 連結報告（DEC-019-014〜020 起票根拠） |
| C-2 | `reports/ceo-w0-week2-prep-consolidation.md` | W0-Week2 ブートストラップ並列成果連結報告 |
| **C-3** | **`reports/ceo-q-mkt-01-08-formal-adoption-2026-05-03.md`** | **Q-Mkt-01〜08 全件 CEO 推奨案採択書（v4 新規）** — DEC-019-026〜029 + DEC-019-030 起票根拠 |

### §4.7 PRJ-020 部門（添付 4 件、v4 新規）

| # | ファイル | 内容 |
|---|---|---|
| **X-1** | **`projects/PRJ-020/reports/ceo-prj020-scope-definition.md`** | **PRJ-020 CEO スコープ定義書（256 行）** — DEC-020-001〜003 起票根拠 |
| **X-2** | **`projects/PRJ-020/reports/research-prj020-connection-method.md`** | **PRJ-020 Research 接続方式調査（5/3 着地）** |
| **X-3** | **`projects/PRJ-020/reports/dev-prj020-implementation-skeleton.md`** | **PRJ-020 Dev 実装 skeleton（5/3 着地）** |
| **X-4** | **`projects/PRJ-020/reports/review-prj020-security-risk.md`** | **PRJ-020 Review セキュリティリスク評価（5/3 着地）** |

### §4.8 組織決裁（添付 1 件）

| # | ファイル | 内容 |
|---|---|---|
| O-1 | `projects/PRJ-019/decisions.md` | DEC-019-001〜030（W0-Week1 終了時点までの全決裁、本会議で参照） + DEC-020-001〜003（PRJ-020 起案） |

**v3 18 件 → v4 20 件**: CEO 採択書 C-3（+1）+ PRJ-020 4 件添付 X-1〜X-4（+4 だが §5(d) 報告で読み上げ参照のみ、実質純増 1）= 19 件、加えて C-3 と X-1 を別添扱いで純増 +2 = 計 20 件

---

## §5. 投票 / 承認手順（v4 改訂）

### §5.1 各議題の Pass/Fail 判定方式

| 議題 | 判定主体 | 判定方式 | 持帰り運用 |
|---|---|---|---|
| §1 Dev エビデンス | Review 一次検収 → CEO 仮判定 | 7 項目 × Pass / Fail / Critical / Major / Minor | Critical 1+ なら NoGo、Major 5 件以下なら Conditional Go |
| §2 Research 補追検証 | CEO 即決（DEC-019-021 / 022 既決済の追認） | Owner 直接面前で再確認 | 異議なき場合は議事録に「Owner 再確認済」明記 |
| §3 Review 検収結果 | Review 一次判定 → CEO 仮判定 | 検収 Go / 条件付き Go / NoGo | NoGo 条件 §6.3 のいずれかに該当時 |
| §4 W0 完了 13 基準 + Go/NoGo | CEO 仮判定 → Owner 仮承認 | 9 基準（v3 拡張版）すべて Y で仮 Go | 5/18 W0 完了報告で最終 Go 判定 |
| §5.1〜§5.3 PM 議題 | CEO 提案 → Owner 承認 | 各議題ごとに承認 / 持帰り | 持帰りなら 5/9 追加決裁会議 |
| **§5(c) G-Top-1 (DEC-019-030)** | **CEO 公式承認 → Owner 再確認** | **DEC-019-030 既決済の正式承認** | **異議なき場合は議事録に「Owner 再確認済」明記、異議あれば 5/12 までに修正決裁** |
| **§5(d) PRJ-020 Phase 0 報告** | **CEO 報告 → Owner 受領確認** | **Phase 0 4 並列成果受領** | **異議なき場合は議事録に「Owner Phase 0 結果受領済 / 6/13 Phase 1 PoC Go/NoGo 議題追加同意」明記** |
| **§5 後半 Q-Mkt 8 件** | **事後承認モード（議事録 1 行記録のみ）** | **DEC-019-026〜029 + 議事録扱い 4 件 (Q-Mkt-01/03/07/08) を秘書 1 分で読み上げ報告** | **オーナー一任承認済（CEO 推奨採択 5/3）、異議なし運用** |

### §5.2 DEC-019-XXX 起票が必要な場合の即時起票ルート

1. **議事中起票**（推奨）: 秘書部門が議事進行と並行して `decisions.md` の DEC-019-XXX 行ドラフトを起こし、議題終了時点で CEO + Owner に画面共有して即決
2. **持帰り起票**: Owner 即決不可の場合、5/8 22:00 までに秘書部門が起案、CEO 経由で Owner に回付、48h 内 Owner 承認 → DEC-019-XXX 確定
3. **本会議で確実に新規起票が想定される DEC**:
   - **DEC-019-031**（条件付き）: §1〜§4 統合の W0-Week1 検収結果総括（CEO 起票、5/8 22:00 まで）
   - **DEC-020-XXX**（5/8 後 PRJ-020 Phase 1 PoC 着手判断は 6/13 検収会議で別決裁起票）

---

## §6. G-Top-1 (a)+(e) ハイブリッド DEC-019-030 詳細（v4 §5(c) 用）

### §6.1 採用案 = (a)+(e) ハイブリッド（DEC-019-030 で 5/3 確定）

| 採用案 | ジャンル | ToS リスク | FN-Black ≤ 10% 整合 | 役割 |
|---|---|---|---|---|
| **(a)** | **HN trending → 開発者向け CLI ツール** | 低（technical tool 範疇、prohibited domains 完全外） | 高（whitelist confidence ≥ 0.85 域） | **主軸**: 検証済シナリオ + cost-tracker / circuit-breaker と整合 |
| **(e)** | **Indie Hackers → microSaaS** | 低（productivity / dev tools 中心） | 高（whitelist 内収束見込） | **補完**: HN と異なるソースで Phase 1 内データソース多様性確保、Phase 2 拡張素地 |

### §6.2 不採用案の根拠（v3 §6.1 候補比較を凝縮）

- **(b) HN dev SaaS**: 支払処理関与時の金融グレー領域抵触懸念
- **(c) Reddit r/SaaS no-code**: 対象分野拡散で prohibited domains 抵触リスク
- **(d) ProductHunt**: education / healthcare-adjacent 混入懸念で `tos_gray_review` 発動率 25%+ 予測

### §6.3 (a)+(e) ハイブリッドの Phase 1 デモ実装計画

- **データソース分配**: HN 60% + IH 40%（合計 30〜90 ループ/月のうち、HN 18〜54 件 / IH 12〜36 件）
- **FN-Black 評価**: HN 60 件 + IH 30 件 = 計 90 件アノテ（W2-R-04 拡張）、W3 中盤（5/26）+ W4 終盤（6/9）の 2 回再評価
- **HITL 第 7 種除外運用**: microSaaS の payment processing 関与案件は `external_api` 第 7 種で除外、whitelist confidence < 0.85 落ち時は `tos_gray_review` 第 6 種で人間介在
- **HP 事例ページ反映**: Q-Mkt-06 (DEC-019-029) HP 事例ページに 2 ジャンル × 各 1 件のデモ事例を配置（公開 6/20 朝）

---

## §7. リスク事前共有

### §7.1 3 大ハイリスク（冒頭 §0 開会で確認）

| リスク ID | リスク名 | 格付 | 5/8 時点状況 | 対応 |
|---|---|---|---|---|
| **R-019-06** | BAN リスク（Anthropic 一般 ToS 違反 / multi-account / 警告メール） | **赤** | 12 ヶ月以内 30〜60% 発生確率（オーナー受容済、損失レンジ ¥500k〜¥2M）／ drill #1 (5/13) でハッピーパス + 異常パス 5 種実施予定 | 5/13 drill #1 / 5/17 drill #2 / G-V2-08 警告メール 1h 監視 / P-E API キー従量フォールバック |
| **R-019-10** | Claude Max weekly cap (Sumi/Asagi 同居プール) | **赤** | Anthropic 数値非公開、Sumi/Asagi M1 同居で月後半枯渇可能性、cap 到達時 1 週間規模停止リスク | H-09（毎日 09:00 / 21:00 JST 監視、80% 警告 / 95% 自動 pause）+ H-10 |
| **R-019-12-A** | OpenClaw API breaking change（Phase 1 期間中即時影響） | **赤** | OpenClaw OSS 上流「personal AI assistant」再ポジション後、subprocess spawn 仕様 / stream-json / OAuth flow / dependencies major upgrade のいずれかが breaking 化した場合 Phase 1 一時停止リスク | 4 系統 changelog 監視（DEC-019-022）+ HITL 第 7 種 `external_api` 即時 24h pause + C-OC-01〜05 |

**会議冒頭での運用**: CEO が §0 で 3 大ハイリスクを 1 行ずつ読み上げ、Owner に口頭で「変更なし / 受容継続」確認

### §7.2 5/19〜5/25 changelog 監視空白期間（Dev 着手 5/26）

**問題**: DEC-019-022 で 4 系統 changelog 監視は Dev W0-Week2 中盤（5/26 着手 / 5/30 検収）実装着手のため、**Phase 1 着手 5/19 から 5/25 までの 1 週間は自動監視が稼働しない**。

**秘書手動 fallback 運用**:
- **対象期間**: 2026-05-19（Phase 1 着手日）〜2026-05-25（自動化稼働前日）
- **頻度**: 毎朝 09:00 JST に秘書部門が手動で 4 系統 GitHub releases ページを目視確認
- **対象**: `anthropics/claude-code` / `openai/codex` / `clawbro-ai/openclaw` / Enderfga plugin
- **検出時の行動**: L1 (info) Slack のみ / L2 (warn) Slack + 翌朝 09:00 CEO 経由オーナー要約（24h SLA）/ L3 (critical, breaking) 即時 Slack + 即時メール CEO + 自律ループ手動 24h pause + HITL 第 7 種手動起動
- **5/26 自動化稼働後**: 手動 fallback 終了
- **記録**: 監視ログを `reports/secretary-changelog-manual-monitoring-2026-05-19_05-25.md` に日次追記

### §7.3 PRJ-020 起案で発生する追加リスク（v4 新規）

| リスク ID | リスク名 | 格付 | 5/8 時点状況 | 対応 |
|---|---|---|---|---|
| **R-020-01** | prompt injection で Open Claw 暴走 | 中 | PRJ-020 Phase 0 で Review 評価実施中（5/3 着地予定） | HITL 第 8 種 `owner_input_review` + Open Claw subprocess 隔離 |
| **R-PRJ-019-distract** | PRJ-020 起案で PRJ-019 Phase 1 注意分散 | **低** | PRJ-020 Phase 0 のみ本セッション、Phase 1 PoC は 6/14 以降のため Phase 1 期間中の実装着手なし | dashboard 同居実装表記方針確定（PRJ-020 = 5%、PRJ-019 = 35% 維持）+ 6/13 Phase 1 PoC Go/NoGo 判定で発動制御 |

---

## §8. 議事録テンプレ + 次回マイルストン

### §8.1 議事録項目（v4 で §5 構造を反映）

```markdown
# 2026-05-08 PRJ-019 W0-Week1 検収会議 議事録（v4 ベース）

## 出席
- Owner / CEO / Dev / Research / Review / PM / 秘書 / Marketing
- （欠席者があれば明記）

## 議題ごとの判定
- §1 Dev エビデンス: [Pass 完全 / Pass 条件付き / NoGo] — Critical X 件 / Major Y 件 / Minor Z 件
- §2 Research 補追検証: [DEC-019-021 / 022 Owner 再確認済 or 異議]
- §3 Review 検収結果: [検収 Go / 条件付き Go / NoGo]
- §4 W0 完了 13 基準 + Go/NoGo: [仮 Go / 仮 NoGo] — 5/18 で最終確定
- §5.1 PM v4 公式承認: [承認 / 持帰り]
- §5.2 DEC-019-021〜024 公式承認: [Owner 再確認済 / 異議]
- §5.3 5/15 競合解消（AS-151 → 5/16 スライド）+ W0-W2 タスク台帳 29 件: [承認 / 持帰り]
- §5(c) G-Top-1 (a)+(e) ハイブリッド DEC-019-030 公式承認: [Owner 再確認済 / 異議 / 持帰り]
- §5(d) PRJ-020 Phase 0 結果報告: [Owner 受領済 / 6/13 Phase 1 PoC Go/NoGo 議題追加同意 / 異議]
- §5 後半 Q-Mkt 8 件: [事後承認モード議事録記録（DEC-019-026〜029 既決 + 議事録扱い 4 件オーナー一任承認済）]

## DEC-019-XXX 起票内容
- DEC-019-031（条件付き）: §1〜§4 統合 W0-Week1 検収結果総括

## 次回アクション
- 5/9 Live integration test（Dev + Owner）
- 5/12 H-09 PoC（Dev、scrape PoC + /usage parse PoC）
- 5/13 BAN drill #1（Dev + Review）
- 5/14 結果判定（秘書 W2-S-02 = DEC-019-XXX 起票）
- 5/15 OAuth 物理隔離（Dev、AS-151 5/16 スライド済前提）
- 5/17 副作用ゼロ証明 + drill #2 リハ（Dev）
- 5/18 W0 完了 Go/NoGo（CEO + Owner、最終決裁）
- 6/13 Phase 1 完了レビュー + PRJ-020 Phase 1 PoC Go/NoGo（DEC-020-XXX 起票）

## 持帰り事項
- （議題 §X の持帰り内容、回付期限、回付ルート）
```

### §8.2 次回マイルストン（5/9〜6/13）

| 日付 | マイルストン | 主担当 | 結果報告先 |
|---|---|---|---|
| **5/9 (金)** | Live integration test（オーナー OAuth、$0.10 上限、stream-json schema 実証） | Dev + Owner | CEO（同日 22:00 まで） |
| **5/12 (月)** | H-09 PoC | Dev | CEO（同日 22:00 まで） |
| **5/13 (水)** | **BAN drill #1** | Dev + Review | CEO（同日 22:00 まで） |
| **5/14 (木)** | 結果判定 + DEC-019-XXX 起票 | 秘書 + CEO | Owner（5/15 09:00 まで） |
| **5/15 (金)** | OAuth 物理隔離 + AS-151 が 5/16 スライド済前提 | Dev | CEO（同日 22:00 まで） |
| **5/17 (日)** | 副作用ゼロ自動検証本番版 + BAN drill #2 リハ | Dev + Review | CEO（5/18 09:00 まで） |
| **5/18 (月)** | **W0 完了 Go/NoGo 最終判定** | CEO + Owner | 全部署（同日 22:00 まで） |
| 5/19 (火) | **Phase 1 着手** | 全部署 | DEC-019-007 |
| 5/26 (月) | 4 系統 changelog 自動監視稼働開始 | Dev | DEC-019-022 |
| 5/26 (月) | Marketing 中間納品 v2（Q-Mkt 反映後） | Marketing | DEC-019-026〜029 |
| 5/30 (土) | NG-3 暫定値オーナー再確認（TR-2 発動判定） | CEO + Owner | DEC-019-008 |
| 6/3 (水) | Vercel Hobby→Pro 昇格判断 CEO 決裁 | CEO | DEC-019-024 |
| 6/12 (金) | Marketing / Web 運営 最終締切 | Marketing + Web 運営 | DEC-019-026 |
| **6/13 (金)** | **Phase 1 完了レビュー + PRJ-020 Phase 1 PoC Go/NoGo** | CEO + Owner | DEC-019-007 + DEC-020-XXX |
| 6/14 (土) | PRJ-020 Phase 1 PoC 着手（Go 判定時） | Dev + Research | DEC-020-XXX |
| **6/20 (土)** | **Phase 1 公開（LP / 技術ブログ / HP 反映 / 社内ナレッジ K1〜K10）** | Marketing + Web 運営 | DEC-019-026 |
| 6/27 (金) | PRJ-020 Phase 1 PoC 完了（Go 時） | Dev | DEC-020-XXX |
| 6/28 (土) | PRJ-020 Phase 2 本実装着手（Go 時） | Dev | DEC-020-XXX |

---

## §9. v3 → v4 主要差分（再確認）

| 項目 | v3 | v4（本書） | 増減 |
|---|---|---|---|
| 総所要時間 | 120 分 | **120 分** | ±0（維持） |
| 議題数 | 5 議題 | **5 議題（§5 内訳が再構成）** | ±0 |
| §5 内訳 | §5.1〜§5.5（PM v4 / DEC-019-021〜024 / 5/15 競合 / W0-W2 台帳 / G-Top-1 ジャンル選定） | **§5.1〜§5.3 + §5(c) + §5(d)**（PM v4 / DEC-019-021〜024 / 5/15 競合 + W0-W2 統合 / G-Top-1 公式承認 / **PRJ-020 Phase 0 報告**） | -2 + 2（再分配） |
| §5 後半 Q-Mkt | 後半 10 分 = 投票 4 件 + DEC 4 件起票 | **後半 5 分の実時間 → 0 分（事後承認モード、議事録 1 行記録のみ）** | -10（削減） |
| §5(c) G-Top-1 | 5 分（候補比較中心） | **10 分（DEC-019-030 公式承認 + Phase 1 デモ DoD 詳細）** | +5 |
| §5(d) PRJ-020 報告 | 未含有 | **5 分新規追加** | +5 |
| 添付資料件数 | 18 件 | **20 件**（C-3 採択書 + X-1〜X-4 PRJ-020、純増 +2） | +2 |
| 関連 DEC | DEC-019-021〜024（4 件） | **DEC-019-021〜024 + DEC-019-026〜030 + DEC-020-001〜003（計 12 件）** | +8 |
| 3 大ハイリスク | R-019-06 / R-019-10 / R-019-12-A | **+ R-020-01 / R-PRJ-019-distract（v4 §7.3 新規）** | +2 リスク |

---

## §10. 関連ドキュメント

- 親文書（v1）: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`
- 親文書（v2 ドラフト）: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda-v2-draft.md`
- 親文書（v3）: `projects/PRJ-019/reports/secretary-w0-week1-meeting-agenda-v3-final.md`（409 行）
- 連動: `projects/PRJ-019/reports/ceo-q-mkt-01-08-formal-adoption-2026-05-03.md`（DEC-019-026〜029 + DEC-019-030 起票根拠）
- 連動: `projects/PRJ-019/reports/secretary-marketing-owner-questions-2026-05-03.md`（Q-Mkt-01〜08 詳細）
- 連動: `projects/PRJ-019/reports/marketing-portfolio-reflection-design.md` / `marketing-knowledge-reflection-design.md`
- 連動: `projects/PRJ-020/reports/ceo-prj020-scope-definition.md`（DEC-020-001〜003 起票根拠）
- 連動: `projects/PRJ-020/reports/research-prj020-connection-method.md`（5/3 着地）
- 連動: `projects/PRJ-020/reports/dev-prj020-implementation-skeleton.md`（5/3 着地）
- 連動: `projects/PRJ-020/reports/review-prj020-security-risk.md`（5/3 着地）
- 連動: `projects/PRJ-020/decisions.md`（DEC-020-001〜003 起案、本日 PRJ-019 で正式 DEC 化済）
- 連動: `projects/PRJ-019/reports/secretary-prj020-dashboard-and-meeting-integration.md`（dashboard 反映 + 5/8 §5(d) 議事メモ雛形 + 6/13 Phase 1 PoC 議題追加予告）
- 上流 SOP: `organization/rules/agent-tool-permission-sop.md`（DEC-019-025、本資料の物理書込発注根拠）
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-001〜030、本会議で参照）

---

## §11. 配布履歴と承認

| 版 | 日付 | 状態 | 備考 |
|---|---|---|---|
| v1 | 2026-05-02 | Review 起案 | 議題 6 構成、所要 90 分 |
| v2 ドラフト | 2026-05-03 | Review 差分パッチ | §5 / §6 / §7 への進捗反映 |
| v3 確定版 | 2026-05-03 | 秘書部門制定（CEO 経由配布） | 120 分版、§5 PM 議題追加、添付 18 件 |
| **v4 確定版** | **2026-05-03** | **秘書部門制定（CEO 経由配布、本書）** | **120 分版維持、§5 後半 Q-Mkt 事後承認モード、§5(c) G-Top-1 +5 分、§5(d) PRJ-020 +5 分、添付 20 件、DEC-019-026〜030 + DEC-020-001〜003 公式起票反映** |

---

**制定**: 秘書部門 ／ **経由**: CEO ／ **宛**: Owner + 7 部署（CEO / Dev / Research / Review / PM / 秘書 / Marketing）

**制定日**: 2026-05-03 ／ **会議実施日**: 2026-05-08 18:00〜20:00 JST ／ **議事録確定**: 2026-05-08 22:00 まで（DEC-019-031 起票同時 / DEC-020-XXX は 6/13 検収会議で別決裁）
