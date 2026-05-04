# PRJ-019 Clawbridge — W0-Week1 検収会議 公式配布資料 v3 確定版（120 分版）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 秘書部門（CEO 経由配布）
- 制定日: 2026-05-03
- 版: **v3 確定版 (FINAL)** — v2 ドラフト (`review-w0-week1-meeting-agenda-v2-draft.md`、90 分版) を 120 分版へ拡張
- 制定根拠決裁: **DEC-019-025**（エージェント tool 権限 SOP、本資料の物理書込発注根拠）
- 関連決裁: **DEC-019-021**（R-019-12 リスク再格付け）/ **DEC-019-022**（4 系統 changelog 監視 + HITL 第 7 種）/ **DEC-019-023**（PM v5 起案トリガー TR-1〜TR-3）/ **DEC-019-024**（Vercel 昇格判断 W3 中盤公式タスク化）
- 親文書: `reports/review-w0-week1-meeting-agenda.md` v1 / `reports/review-w0-week1-meeting-agenda-v2-draft.md` v2
- 配布範囲: Owner + 7 部署（CEO / Dev / Research / Review / PM / 秘書 / Marketing）
- 配布媒体: Markdown 文書、印刷可能体裁

---

## §0. 200 字 サマリ

5/8 18:00〜20:00（**120 分**、Owner + 7 部署出席、議題 §1〜§5）。**§1 Dev エビデンス（25 分）→ §2 Research 補追検証（20 分）→ §3 Review 検収結果（25 分）→ §4 W0 完了 13 基準確認 + Go/NoGo 仮判定（20 分）→ §5 PM 追加議題（30 分、PM v4 公式承認 + DEC-019-021〜024 公式承認 + 5/15 競合解消 + G-Top-1 デモジャンル選定別決裁起票 + W0-W2 タスク台帳 29 件承認）**。最終 Go/NoGo 着地予測「**5 完全 Pass + 2 条件付き Pass**」、Phase 1 着手 5/19 確度「強い条件付き Go」継続。最終 Go 判定は 5/18 の W0 完了報告で確定。

---

## §1. 会議メタ情報

| 項目 | 内容 |
|---|---|
| **日時** | 2026-05-08 (木) 18:00〜20:00 JST |
| **所要** | 120 分（v2 90 分版 + PM 議題 §5 30 分） |
| **形式** | オンライン（既定の社内会議システム） |
| **議事録担当** | 秘書部門（議事中に DEC-019-XXX 起票同時進行） |
| **録画方針** | 全議題録画、録画ファイルは `projects/PRJ-019/reports/meetings/2026-05-08-w0-week1-review.mp4`（命名規則準拠） |
| **議題公開先** | 第一階層: Owner 直配布 ／ 第二階層: 各部署内（CEO 経由） |
| **出席者** | Owner（決裁者）／ CEO（議事進行）／ Dev / Research / Review / PM / 秘書 / Marketing（各部署 1 名以上） |
| **欠席時運用** | Owner 欠席なら全議題持帰り。各部署欠席なら録画 + 議事録 24h 内回付 + 持帰り承認 |
| **公開リードタイム** | 5/7 22:00 までに各部署最終資料提出、5/8 12:00 までに本資料 v3 + 添付物一式を CEO 経由配布 |

---

## §2. 議題 §1〜§5 タイムボックス（120 分配分）

### §2.1 全体タイムテーブル

| 時刻 | 議題 | 主担当 | 所要 | アウトプット |
|---|---|---|---|---|
| 18:00–18:05 | 開会、目的確認、3 大ハイリスク事前共有（§7 参照） | CEO | 5 分 | — |
| 18:05–18:30 | **§1 Dev エビデンス** | Dev → Review 検収 | 25 分 | Pass/Fail 判定（5 完全 + 2 条件付き Pass 着地予測） |
| 18:30–18:50 | **§2 Research 補追検証** | Research | 20 分 | DEC-019-021 / DEC-019-022 公式承認 |
| 18:50–19:15 | **§3 Review 検収結果** | Review | 25 分 | 検収 Go / 条件付き Go 判定 |
| 19:15–19:35 | **§4 W0 完了 13 基準確認 + Go/NoGo 仮判定** | CEO + Owner | 20 分 | 仮 Go / 仮 NoGo（最終は 5/18） |
| 19:35–20:05 | **§5 PM 追加議題（PM v4 + DEC-019-021〜024 + 5/15 競合 + G-Top-1 ジャンル + W0-W2 台帳）** | PM + 秘書 | 30 分 | DEC-019-XXX（G-Top-1 ジャンル）起票 + 最終 Go/NoGo 統合判定 |
| 20:05 | 閉会、決議内容の `decisions.md` 反映確認 | 秘書 | （5 分超過バッファ含む） | — |

### §2.2 議題サマリ表

| 議題 | 時間 | 担当 | 内容 | 期待アウトプット |
|---|---|---|---|---|
| §1 Dev エビデンス | 25 分 | Dev | 95 tests 緑 / 11 controls evidence / mock-claude / TimeSource / W0-W2 prep ブートストラップ完遂 | 5 完全 Pass + 2 条件付き Pass 着地予測 |
| §2 Research 補追検証 | 20 分 | Research | OP-1〜5 + P-D 改 resilient + R-019-12 再格付け + 4 系統 changelog Runbook | DEC-019-021/022 公式承認 |
| §3 Review 検収結果 | 25 分 | Review | チェックリスト + ペネトレ B1〜B6 + ToS allowlist DoD 統合 + BAN drill #1 シナリオ | 検収 Go / 条件付き Go の判定 |
| §4 W0 完了 13 基準確認 + Go/NoGo | 20 分 | CEO + Owner | Dev 13 基準達成度確認 → W1 着手 (5/19) Go/NoGo 仮判定 | 仮 Go / 仮 NoGo（最終は 5/18） |
| §5 PM 追加議題 | 30 分 | PM + 秘書 | PM v4 公式承認 + DEC-019-021〜024 公式承認 + 5/15 競合解消 + G-Top-1 デモジャンル選定別決裁 + W0-W2 タスク台帳 29 件 | DEC-019-XXX 起票（G-Top-1 ジャンル）+ §1〜§4 と統合した最終 Go/NoGo |

---

## §3. §5 PM 追加議題の詳細（議題 §5.1〜§5.5、各 5〜8 分）

### §3.1 議題 §5.1 — PM v4 公式承認（5 分）

**主担当**: PM 部門（CEO 補佐、Owner 承認）

**承認対象**: `reports/pm-cost-and-controls-plan-v4.md`

**承認核心 6 点**:
1. 必須コントロール **28 → 34 項目**（H-09 / H-10 / HITL 第 6 種 `tos_gray_review` / G-Top-1〜4、純増 6）
2. Phase 1 月次追加発生コスト 中央値 **$13 → $33** / 上限 **$73 → $93**（Vercel Sandbox $26 + Hosting Pro $20 上方修正反映）
3. 月次ハードキャップ **$300 維持**（DEC-019-012）
4. PM v5 起案トリガー **TR-1〜TR-3** 公式組込（§3.3 で再確認）
5. HITL 種別 **5 → 6 種**（DEC-019-018）+ HITL 第 7 種 `external_api` 追加（DEC-019-022）= **計 7 種**
6. v3 → v4 数値差分の最終確認（v4 を Phase 1 着手 5/19 前の最終確定版として扱う）

**判定方式**: CEO 仮承認 → Owner 即決 or 持帰り

### §3.2 議題 §5.2 — DEC-019-021〜024 公式承認（5 分）

**主担当**: 秘書部門（読み上げ）+ CEO（再確認）+ Owner（最終承認）

| 決裁 | 内容 | 5/3 即決状況 | 5/8 公式承認の意義 |
|---|---|---|---|
| **DEC-019-021** | R-019-12 を「赤」→「黄」降格、新規 R-019-12-A（赤）/ R-019-12-B（黄）に分割再格付け、C-OC-01〜05 発令 | 即決済 | Owner 直接面前で再確認、Phase 1 リスクポートフォリオ過大評価防止 |
| **DEC-019-022** | 4 系統 changelog 監視運用採用、Dev W2 中盤実装発令、HITL 第 7 種 `external_api` 追加 | 即決済 | 5/19〜5/25 監視空白期間（§7.2）の手動 fallback 運用を Owner と確認 |
| **DEC-019-023** | PM v5 起案トリガー **TR-1**（5/13 BAN drill #1 Fail）/ **TR-2**（5/30 NG-3 暫定値変更）/ **TR-3**（6/13 Phase 2 Go）正式確定 | 即決済 | 各 TR の Phase 1 期間中分岐点を Owner と再確認、PM 起案期日明示 |
| **DEC-019-024** | Vercel Hobby→Pro 昇格判断を W3 中盤（2026-06-03）公式 CEO 決裁タスク **CB-CEO-W3-01** として確定 | 即決済 | dashboard カラム化 + CEO 決裁マイルストン明示 |

**判定方式**: 5/3 即決済の 4 件を Owner 直接面前で再確認し、議事録に「Owner 再確認済」を明記

### §3.3 議題 §5.3 — 5/15 競合解消承認（5 分）

**主担当**: PM + 秘書

**競合内容**: PRJ-019 W0-Week2 で **5/15（金）**に Dev 6+ タスク並列発生（W2-D-07 OAuth 物理隔離 / W2-D-08 Sumi/Asagi バックアップ / W2-D-13 DoD 3 分岐 / W2-D-Docs / その他細目 + PRJ-018 Asagi タスク **AS-151**）

**解消提案**:
- **AS-151 を 5/16（土）にスライド**（PRJ-018 Asagi タスク、PM 部門経由で PRJ-018 PM へ調整依頼）
- 調整依頼の起票は **5/8 22:00 まで**（議事録確定後）に秘書部門が PRJ-018 PM 経由で送付
- スライド失敗時の代替案: PRJ-019 側 W2-D-Docs を 5/14 に前倒し、5/15 の Dev 並列を 5 タスク以下に圧縮

**判定方式**: CEO 提案 → Owner 承認（PRJ-018 オーナー側調整可否を口頭確認）

### §3.4 議題 §5.4 — W0-W2 タスク台帳 29 件承認（5 分）

**主担当**: PM + 秘書

**承認対象**: `reports/pm-w0-week2-execution-plan.md` + `reports/secretary-w0-week2-task-ledger.md`（同期済）

**承認核心**:
- **29 タスク × 6 部署横断**（Dev 21 / Research 5 / 秘書 3 / Owner 4 …※マルチカウント、純 29）
- **Critical Path 5 ステップ**:
  1. 5/9 Live integration test（W2-D-Live）
  2. 5/12 H-09 PoC（W2-D-10 / W2-D-11）
  3. 5/13 BAN drill #1（W2-D-Drill）
  4. 5/14 結果判定（W2-S-02 = DEC-019-XXX 起票）
  5. 5/15 OAuth 物理隔離（W2-D-07）
- **5/17 副作用ゼロ証明 + drill #2 リハ**
- **5/18 W0 完了 Go/NoGo**（W1 着手 5/19 の最終決裁）
- BAN drill #1 Fail 時 **Phase 1 を 1 週間延期 (5/19→5/26)**、再失敗で Phase 2 計画再策定（DEC-019-019 + TR-1）

**判定方式**: PM 説明 → CEO 承認 → Owner 承認

### §3.5 議題 §5.5 — G-Top-1 Phase 1 デモ 1 件 ジャンル選定（8 分、別決裁起票）

**主担当**: CEO 推奨提案 + Owner 最終判断

**背景**: DEC-019-018 で G-Top-1（Phase 1 デモ枠 1 件 CEO 個別承認）の運用ルール確定、DEC-019-022 §6 で「ジャンル選定は 5/8 18:00 検収会議 §5 議題に追加、最終決定は別決裁 DEC-019-XXX で 5/8 後に確定」と整理済。

**判定方式**: CEO 推奨（既定）提示 → Owner 最終決定（or 5/8 後に持帰り）→ 別決裁 DEC-019-XXX 起票（議事中起票 or 5/8 22:00 までに秘書部門起票）

**詳細候補・評価軸は §6 を参照**

---

## §4. 配布資料一覧（添付物、計 18 件）

### §4.1 Dev 部門（添付 5 件）

| # | ファイル | 内容 |
|---|---|---|
| D-1 | `reports/dev-w0-week1-evidence-and-mockclaw.md` | W0-Week1 実装報告 + mock-claude 5 シナリオ + TimeSource pattern |
| D-2 | `reports/dev-w0-week2-prep-report.md` | HITL 第 6 種雛形 + openclaw-runtime ラッパ skeleton + architecture-w0.md / security-w0.md ドラフト |
| D-3 | `reports/control-evidence/index.md` | 11 controls evidence 一覧（G-01/02/04/05/06/08/V2-03/V2-08/V2-11 + H-09 PoC 関連 + tos_gray_review） |
| D-4 | `reports/control-evidence/G-XX-evidence.md` × 8（個別） | 各コントロールの単体検証ログ |
| D-5 | `app/docs/architecture-w0.md` / `security-w0.md` | アーキテクチャ + セキュリティ設計（Mermaid 計 6 枚） |

**実機検証結果**: Windows 11 / Node 24.11.1 / pnpm 9.12.0 で `pnpm test` **11 files / 95 tests 全緑**（83→95、+12）、既存 PRJ-001〜018 への副作用ゼロ。

### §4.2 Research 部門（添付 3 件）

| # | ファイル | 内容 |
|---|---|---|
| R-1 | `reports/research-w0-supplement-op1-op5.md` | OP-1〜OP-5 一次裏取り（Codex Pro $200 = 300〜1,600 msgs/5h、Claude Max 20x = 約 900 msgs/5h、Vercel Hobby = 5h CPU/月）、Phase 1 月 30〜90 ループ実装可能性「YES（条件付き）」確定、§7 PM v5 起案トリガー TR-1〜TR-3 |
| R-2 | `reports/research-w0-supplement-pd-modified-revalidation.md` | OpenClaw OSS 上流「personal AI assistant」化を踏まえた P-D 改 resilient 確定、R-019-12 再格付け提案、C-OC-01〜05 提案 |
| R-3 | `reports/research-changelog-monitoring-runbook.md` | 4 系統 changelog 監視 Runbook（Anthropic / OpenAI / OpenClaw / Enderfga）、L1/L2/L3 通知 3 段階、HITL 第 7 種 `external_api` |

### §4.3 Review 部門（添付 4 件）

| # | ファイル | 内容 |
|---|---|---|
| V-1 | `reports/review-w0-week1-verification-checklist.md` | 検収チェックリスト 7 項目 |
| V-2 | `reports/review-w0-week1-pentest-scenarios.md` | ペネトレーション B1〜B6 シナリオ（45 試行） |
| V-3 | `reports/review-tos-allowlist-dod-integration-v1.md` | ToS allowlist DoD 統合 v1（5/3 完成、5 項目すべて） |
| V-4 | `reports/review-ban-drill-1-scenario.md` | BAN drill #1 シナリオ（ハッピーパス + 異常パス 5 種、5 SLA） |

### §4.4 PM 部門（添付 2 件）

| # | ファイル | 内容 |
|---|---|---|
| P-1 | `reports/pm-cost-and-controls-plan-v4.md` | コスト & コントロール統合計画 v4（必須コントロール 34 / 中央値 $33 / 上限 $93） |
| P-2 | `reports/pm-w0-week2-execution-plan.md` | W0-Week2 実行計画（29 タスク × 6 部署、Critical Path 5 ステップ、5/15 競合解消提案） |

### §4.5 Marketing 部門（添付 2 件、参考）

| # | ファイル | 内容 |
|---|---|---|
| M-1 | `reports/marketing-portfolio-reflection-design.md` | Phase 1 完了時の自社 HP ポートフォリオ反映設計 |
| M-2 | `reports/marketing-knowledge-reflection-design.md` | Phase 1 完了時の社内ナレッジ K1〜K10 反映設計 |

### §4.6 CEO 部門（添付 2 件）

| # | ファイル | 内容 |
|---|---|---|
| C-1 | `reports/ceo-w0-week1-consolidation.md` | W0-Week1 連結報告（DEC-019-014〜020 起票根拠） |
| C-2 | `reports/ceo-w0-week2-prep-consolidation.md` | W0-Week2 ブートストラップ並列成果連結報告（DEC-019-021〜024 起票根拠） |

### §4.7 組織決裁（添付 1 件）

| # | ファイル | 内容 |
|---|---|---|
| O-1 | `projects/PRJ-019/decisions.md` | DEC-019-001〜025（W0-Week1 終了時点までの全決裁、本会議で参照） |

---

## §5. 投票 / 承認手順

### §5.1 各議題の Pass/Fail 判定方式

| 議題 | 判定主体 | 判定方式 | 持帰り運用 |
|---|---|---|---|
| §1 Dev エビデンス | Review 一次検収 → CEO 仮判定 | 7 項目 × Pass / Fail / Critical / Major / Minor | Critical 1+ なら NoGo、Major 5 件以下なら Conditional Go |
| §2 Research 補追検証 | CEO 即決（DEC-019-021 / 022 既決済の追認） | Owner 直接面前で再確認 | 異議なき場合は議事録に「Owner 再確認済」明記 |
| §3 Review 検収結果 | Review 一次判定 → CEO 仮判定 | 検収 Go / 条件付き Go / NoGo | NoGo 条件 §6.3 のいずれかに該当時 |
| §4 W0 完了 13 基準 + Go/NoGo | CEO 仮判定 → Owner 仮承認 | 9 基準（v3 拡張版）すべて Y で仮 Go | 5/18 W0 完了報告で最終 Go 判定 |
| §5.1〜§5.4 PM 議題 | CEO 提案 → Owner 承認 | 各議題ごとに承認 / 持帰り | 持帰りなら 5/9 追加決裁会議 |
| §5.5 G-Top-1 ジャンル選定 | CEO 推奨 → Owner 最終決定 | 候補 3〜5 案から 1 案選択 or 5/8 後持帰り | 5/8 後持帰りなら 5/12 までに別決裁起票 |

### §5.2 DEC-019-XXX 起票が必要な場合の即時起票ルート

1. **議事中起票**（推奨）: 秘書部門が議事進行と並行して `decisions.md` の DEC-019-XXX 行ドラフトを起こし、議題終了時点で CEO + Owner に画面共有して即決
2. **持帰り起票**: Owner 即決不可の場合、5/8 22:00 までに秘書部門が起案、CEO 経由で Owner に回付、48h 内 Owner 承認 → DEC-019-XXX 確定
3. **本会議で確実に新規起票が想定される DEC**:
   - **DEC-019-026**: G-Top-1 Phase 1 デモジャンル決定（議題 §5.5 結果）
   - **DEC-019-027**（条件付き）: §1〜§4 統合の W0-Week1 検収結果総括（CEO 起票、5/8 22:00 まで）

---

## §6. G-Top-1 デモジャンル選定 議題 §5.5 の事前準備事項

### §6.1 候補ジャンル 5 案（CEO 事前提案）

すべての候補は **ToS 13 prohibited domains 完全回避済**（重要インフラ / 教育 / 住居 / 雇用 / 金融 / 保険 / 法律 / 医療 / 行政 / 製品安全 / 国家安全保障 / 移住 / 法執行）が必須条件。

| 案 | ジャンル | ToS リスク評価 | FN-Black ≤ 10% との整合 | BAN リスクへの追加影響 |
|---|---|---|---|---|
| **(a)** | **HN trending → 開発者向け CLI ツール** | 低（technical tool 範疇、prohibited domains 完全外） | 高（whitelist 既存 confidence ≥ 0.85 域、明確に technical） | 中立（HN 由来は cost-tracker / circuit-breaker の検証済シナリオと整合） |
| **(b)** | HN trending → SaaS 個人向け開発者ツール | 低〜中（dev SaaS は B2B 寄りで安全側、ただし支払処理関与時は金融グレー） | 中（ジャンル分類器 confidence 0.7〜0.85 の gray ゾーン入り懸念、HITL `tos_gray_review` 増加） | 中立 |
| **(c)** | Reddit r/SaaS → no-code パターン | 中（no-code は対象分野が拡散、prohibited 抵触リスクあり） | 中〜低（FN-Black 増加懸念、whitelist 内収束しない可能性） | 中立 |
| **(d)** | ProductHunt → 個人開発者ニッチ | 中（PH は対象分野が広く、education / healthcare-adjacent の混入懸念） | 中（whitelist confidence 揺らぎ、`tos_gray_review` 発動率 25%+ 予測） | 中立 |
| **(e)** | **Indie Hackers → microSaaS（domains の安全側）** | **低**（IH コミュニティは productivity / dev tools 中心、prohibited 抵触低） | 高（whitelist 内収束しやすい、FN-Black ≤ 10% 達成見込み） | 中立 |

### §6.2 CEO 推奨（既定）

**第一推奨: (a) HN trending → 開発者向け CLI ツール**

- 推奨根拠:
  - whitelist confidence ≥ 0.85 域に明確に該当、ジャンル分類器 prompt few-shot 6 件のうち #1〜#3 と整合
  - Phase 1 デモ DoD（HN trending → /new-project → Next.js 雛形 → Vercel Sandbox → Review 合格 → preview deploy → Slack 通知 < 60 min/件、< $5/件、10 連続成功率 ≥ 80%）を満たす最短経路
  - 既存 Dev 検証（mock-claude 5 シナリオ + 95 tests）と整合性高、FN-Black 評価の HN 60 件アノテーション（W2-R-04）と同一データソース

**第二推奨: (e) Indie Hackers → microSaaS（domains の安全側）**

- 推奨根拠:
  - (a) と同等の whitelist 安全性
  - HN trending と異なるソースを使うことで Phase 1 内データソース多様性を確保（Phase 2 で他ソース追加の素地）
  - microSaaS は支払処理を含む可能性があるため `payment processing` は HITL `external_api` 第 7 種で除外運用

### §6.3 Owner 判断項目

1. (a) / (e) のいずれを採用するか、または別案 (b)(c)(d) のいずれかを採用するか
2. 候補外案を採用したい場合の根拠ヒアリング（CEO に再評価指示）
3. **5/8 後持帰り判断**を選択する場合は **5/12 までに別決裁 DEC-019-026 として確定**（5/13 BAN drill #1 結果 + 5/14 判定の前に決定）
4. デモジャンル決定後の Phase 1 実装範囲固定: W2-R-04 FN-Black アノテ 60 件のジャンル偏重補正（必要時）

### §6.4 候補数まとめ

- **候補ジャンル 5 案**: (a) / (b) / (c) / (d) / (e)
- **CEO 推奨 2 案**: (a) 第一推奨、(e) 第二推奨
- **Owner 判断**: 5/8 当日決定 or 5/12 までに持帰り決定

---

## §7. リスク事前共有

### §7.1 3 大ハイリスク（冒頭 §0 開会で確認）

| リスク ID | リスク名 | 格付 | 5/8 時点状況 | 対応 |
|---|---|---|---|---|
| **R-019-06** | BAN リスク（Anthropic 一般 ToS 違反 / multi-account / 警告メール） | **赤** | 12 ヶ月以内 30〜60% 発生確率（オーナー受容済、損失レンジ ¥500k〜¥2M）／ drill #1 (5/13) でハッピーパス + 異常パス 5 種実施予定 | 5/13 drill #1 / 5/17 drill #2 / G-V2-08 警告メール 1h 監視 / P-E API キー従量フォールバック |
| **R-019-10** | Claude Max weekly cap (Sumi/Asagi 同居プール) | **赤** | Anthropic 数値非公開、Sumi/Asagi M1 同居で月後半枯渇可能性、cap 到達時 1 週間規模停止リスク | H-09（毎日 09:00 / 21:00 JST 監視、80% 警告 / 95% 自動 pause）+ H-10（extra usage 課金 Phase 1 原則 OFF、突発時のみ CEO 決裁で ON） |
| **R-019-12-A** | OpenClaw API breaking change（Phase 1 期間中即時影響） | **赤** | OpenClaw OSS 上流「personal AI assistant」再ポジション後、subprocess spawn 仕様 / stream-json / OAuth flow / dependencies major upgrade のいずれかが breaking 化した場合 Phase 1 一時停止リスク | 4 系統 changelog 監視（DEC-019-022）+ HITL 第 7 種 `external_api` 即時 24h pause + C-OC-01〜05（OpenClaw fork 物理クローン W2 終了時 / cron 監視 W2 中盤 / Phase 2 exit plan / weekly health check） |

**会議冒頭での運用**: CEO が §0 で 3 大ハイリスクを 1 行ずつ読み上げ、Owner に口頭で「変更なし / 受容継続」確認

### §7.2 5/19〜5/25 changelog 監視空白期間（Dev 着手 5/26）

**問題**: DEC-019-022 で 4 系統 changelog 監視は Dev W0-Week2 中盤（5/26 着手 / 5/30 検収）実装着手のため、**Phase 1 着手 5/19 から 5/25 までの 1 週間は自動監視が稼働しない**。

**秘書手動 fallback 運用**:
- **対象期間**: 2026-05-19（Phase 1 着手日）〜2026-05-25（自動化稼働前日）
- **頻度**: 毎朝 09:00 JST に秘書部門が手動で 4 系統 GitHub releases ページを目視確認
- **対象**:
  1. `anthropics/claude-code`（Anthropic Claude Code CLI）
  2. `openai/codex` または該当公式 Codex CLI repo（OpenAI Codex CLI）
  3. `clawbro-ai/openclaw`（OpenClaw OSS）
  4. Enderfga plugin（既知の Claude Code 用 OpenClaw ブリッジ repo）
- **検出時の行動**:
  - **L1 (info)**: minor patch / docs のみ → Slack #prj-019-ops に投稿のみ
  - **L2 (warn)**: minor breaking 候補 → Slack + 翌朝 CEO 経由オーナー要約（24h SLA）
  - **L3 (critical, breaking)**: major release / "BREAKING" / "feat!:" / peer dep major → 即時 Slack + 即時メール CEO + **PRJ-019 自律ループ手動 24h pause**（Dev に発動依頼）+ HITL 第 7 種 `external_api` 手動起動
- **5/26 自動化稼働後**: 手動 fallback 終了、5/26 以降は自動監視（DEC-019-022）に切替
- **記録**: 監視ログを `reports/secretary-changelog-manual-monitoring-2026-05-19_05-25.md` に日次追記、5/26 自動化引継ぎ時に Dev へハンドオフ

---

## §8. 議事録テンプレ + 次回マイルストン

### §8.1 議事録項目

```markdown
# 2026-05-08 PRJ-019 W0-Week1 検収会議 議事録

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
- §5.3 5/15 競合解消（AS-151 → 5/16 スライド）: [承認 / 持帰り]
- §5.4 W0-W2 タスク台帳 29 件: [承認 / 持帰り]
- §5.5 G-Top-1 ジャンル選定: [DEC-019-026 起票内容: (a) / (e) / 持帰り]

## DEC-019-XXX 起票内容
- DEC-019-026: G-Top-1 Phase 1 デモジャンル決定（採用案 + 根拠 + 候補外案の不採用理由）
- DEC-019-027（条件付き）: §1〜§4 統合 W0-Week1 検収結果総括

## 次回アクション
- 5/9 Live integration test（Dev + Owner）
- 5/12 H-09 PoC（Dev、scrape PoC + /usage parse PoC）
- 5/13 BAN drill #1（Dev + Review）
- 5/14 結果判定（秘書 W2-S-02 = DEC-019-XXX 起票）
- 5/15 OAuth 物理隔離（Dev、AS-151 5/16 スライド済前提）
- 5/17 副作用ゼロ証明 + drill #2 リハ（Dev）
- 5/18 W0 完了 Go/NoGo（CEO + Owner、最終決裁）

## 持帰り事項
- （議題 §X の持帰り内容、回付期限、回付ルート）
```

### §8.2 次回マイルストン（5/9〜5/18）

| 日付 | マイルストン | 主担当 | 結果報告先 |
|---|---|---|---|
| **5/9 (金)** | Live integration test（オーナー OAuth、$0.10 上限、stream-json schema 実証） | Dev + Owner | CEO（同日 22:00 まで） |
| **5/12 (月)** | H-09 PoC（Anthropic Console scrape + Claude Code `/usage` parse 両系統） | Dev | CEO（同日 22:00 まで） |
| **5/13 (水)** | **BAN drill #1**（PRJ-019 単独、Sumi/Asagi アイドル、5 SLA + ハッピーパス + 異常パス 5 種） | Dev + Review | CEO（同日 22:00 まで） |
| **5/14 (木)** | 結果判定 + DEC-019-XXX 起票（Pass / Fail）+ Fail 時 TR-1 発動判定 | 秘書 + CEO | Owner（5/15 09:00 まで） |
| **5/15 (金)** | OAuth 物理隔離（OS user / 環境変数 / Doppler 3 層、stat 到達不可テスト）+ AS-151 が 5/16 スライド済前提 | Dev | CEO（同日 22:00 まで） |
| **5/17 (日)** | 副作用ゼロ自動検証本番版 + BAN drill #2 リハ（Sumi/Asagi 同居前提シナリオ起案） | Dev + Review | CEO（5/18 09:00 まで） |
| **5/18 (月)** | **W0 完了 Go/NoGo 最終判定**（5/19 Phase 1 着手の最終決裁） | CEO + Owner | 全部署（同日 22:00 まで） |

### §8.3 W0-W2 ブロック以外の重要マイルストン

| 日付 | マイルストン | 関連 DEC |
|---|---|---|
| 2026-05-19 | **Phase 1 着手** | DEC-019-007 |
| 2026-05-26 | 4 系統 changelog 自動監視稼働開始（Dev 実装完遂） | DEC-019-022 |
| 2026-05-30 | NG-3 暫定値オーナー再確認（TR-2 発動判定） | DEC-019-008 / DEC-019-023 |
| 2026-06-03 | Vercel Hobby→Pro 昇格判断 CEO 決裁（CB-CEO-W3-01） | DEC-019-024 |
| 2026-06-13 | **Phase 1 完了レビュー**（Phase 2 Go / NoGo、TR-3 発動判定） | DEC-019-007 / DEC-019-023 |

---

## §9. v2 → v3 主要差分

| 項目 | v2 (90 分版) | v3 (120 分版、本書) | 増分 |
|---|---|---|---|
| 総所要時間 | 90 分 | **120 分** | +30 分 |
| 議題数 | 4 議題（§1〜§4 旧構成 + Go/NoGo） | **5 議題（§1〜§5）** | +1 議題 |
| §5 PM 追加議題 | 未含有 | **PM v4 + DEC-019-021〜024 + 5/15 競合 + G-Top-1 + W0-W2 台帳（30 分）** | 新規 30 分 |
| 添付資料件数 | 8 件（v2 §0.1 入力資料） | **18 件**（§4 配布資料一覧） | +10 件 |
| G-Top-1 候補 | 未提示 | **5 案（CEO 推奨 (a)(e)）** | 新規 |
| Go/NoGo 基準 | 7 基準 | **9 基準（v3 拡張）** | +2 |
| Conditional Go 条件 | 2 件 | **4 件**（mock-claude / DEC-019-018〜021 未決追加） | +2 |
| NoGo 条件 | 4 件 | **6 件**（DEC-019-020 未決 / drill #1 Sumi/Asagi アイドル不同意追加） | +2 |
| 3 大ハイリスク事前共有 | 未明示 | **§7.1 で R-019-06 / R-019-10 / R-019-12-A 確認** | 新規 |
| changelog 監視空白期間 fallback | 未明示 | **§7.2 で 5/19〜5/25 秘書手動 fallback 運用明記** | 新規 |

---

## §10. 関連ドキュメント

- 親文書（v1）: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`
- 親文書（v2 ドラフト）: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda-v2-draft.md`
- 連動: `projects/PRJ-019/reports/review-tos-allowlist-dod-integration-v1.md`（5/3 完成）
- 連動: `projects/PRJ-019/reports/review-ban-drill-1-scenario.md`（5/3 完成）
- 連動: `projects/PRJ-019/reports/pm-cost-and-controls-plan-v4.md`（PM v4、§5.1 で公式承認）
- 連動: `projects/PRJ-019/reports/pm-w0-week2-execution-plan.md`（W0-W2 実行計画、§5.4 で公式承認）
- 連動: `projects/PRJ-019/reports/research-w0-supplement-pd-modified-revalidation.md`（DEC-019-021 根拠）
- 連動: `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md`（DEC-019-022 根拠）
- 連動: `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md`（DEC-019-014〜020 根拠）
- 連動: `projects/PRJ-019/reports/ceo-w0-week2-prep-consolidation.md`（DEC-019-021〜024 根拠）
- 上流 SOP: `organization/rules/agent-tool-permission-sop.md`（DEC-019-025、本資料の物理書込発注根拠）
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-001〜025、本会議で参照、DEC-019-026 等を新規起票）

---

## §11. 配布履歴と承認

| 版 | 日付 | 状態 | 備考 |
|---|---|---|---|
| v1 | 2026-05-02 | Review 起案 | 議題 6 構成、所要 90 分 |
| v2 ドラフト | 2026-05-03 | Review 差分パッチ | §5 / §6 / §7 への進捗反映 |
| **v3 確定版** | **2026-05-03** | **秘書部門制定（CEO 経由配布）** | **120 分版、§5 PM 議題追加、添付 18 件、本書** |

---

**制定**: 秘書部門 ／ **経由**: CEO ／ **宛**: Owner + 7 部署（CEO / Dev / Research / Review / PM / 秘書 / Marketing）

**制定日**: 2026-05-03 ／ **会議実施日**: 2026-05-08 18:00〜20:00 JST ／ **議事録確定**: 2026-05-08 22:00 まで（DEC-019-026 起票同時）
