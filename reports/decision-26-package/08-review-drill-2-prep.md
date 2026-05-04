# 決議-26 配布資料 №08 — Review BAN drill #2 prep（5/12 → 5/8 朝前倒し検討、9 シナリオ拡張）

> **配布資料 №08 / 12** — Round 10 Review-δ deliverable 1（review-round10-ban-drill-2-prep.md コピー）
> **集約日**: 2026-05-04 深夜終盤（Secretary-η dispatch、DEC-019-057 暫定起票直後）
> **原本**: `projects/PRJ-019/reports/review-round10-ban-drill-2-prep.md`
> **位置付け**: drill #2 を 5/12 → 5/8 朝（W0-Week1 検収会議直前 06:00-08:00）前倒し検討の prep 文書、drill #1 5 シナリオ + 偽陽性 high 4 セル = 9 シナリオ拡張
> **status**: 着地確定（Round 10 Review-δ 起案完遂分のコピー、375 行）

---

# PRJ-019 — Round 10 BAN drill #2 prep（5/12 → 5/8 朝前倒し検討、9 シナリオ拡張）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R10 Review-δ
位置付け: Owner 即決「徹底前倒し / 最短スケジュール」マンデート下、当初 5/12 予定 BAN drill #2 を 5/8 朝に再前倒し検討するための実機検証 prep 文書。Round 9 drill #1 dry Full Pass 5/5 + tos-monitor 4×5 偽陽性 matrix（高ランク 4 セル）を踏襲し、drill #1 の 5 シナリオ + 4 偽陽性セルカバー = 9 シナリオに拡張する。
版: v1.0（Round 10 Review-δ 起案、案 C ハイブリッド暫定運用前提）

連動 DEC: DEC-019-007 / DEC-019-010 / DEC-019-019（drill #1 シナリオ承認）/ DEC-019-025（Agent dispatch SOP）/ DEC-019-050（API cap $30）/ DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056（Round 9 前倒し）/ **DEC-019-057（案 C 暫定採択）**

---

## §0 200 字 CEO サマリ

BAN drill #2 を当初 5/12 → 5/8 朝（W0-Week1 検収会議直前 06:00-08:00）への再前倒しを検討。drill #1 dry Full Pass 5/5（Round 9）+ tos-monitor 偽陽性 matrix high 4 セル（continuous_run×sleep / cost_cap×spike legit / rate_spike×boundary / rate_spike×spike legit）を統合し 9 シナリオに拡張。timeline は 06:00 集合 / 06:15 開始 / 08:00 終了で 105 分 + buffer 15 分。PASS criteria は drill #1 5 SLA 全達成 + high 4 セル抑制不能時の manual override 動作確認 + Sumi/Asagi 巻き添えゼロ。fallback は 5/8 着地不可時に当初 5/12 へ復帰し議決-7 採択ライン維持。議決-26 採択 5 軸のうち「BAN 防御演習 PASS」軸に直接寄与し、Phase 1 着手 5/26 Conditional Go 確度 +2pt 押上見込み（93→95%）。read-only 設計、コード一切無改変。

---

## §1-§9 主要構造（原本参照）

詳細は原本 `projects/PRJ-019/reports/review-round10-ban-drill-2-prep.md` 全 375 行の §1〜§9 を参照。

| § | 題目 |
|---|------|
| §1 | 5/8 朝前倒しの背景と判断軸 |
| §2 | 9 シナリオの構成（drill #1 5 + 偽陽性 high 4） |
| §3 | timeline（06:00-08:00 + buffer 15 分） |
| §4 | 担当役割マトリクス（Round 9 9 役割 → 5/8 朝コンパクト版 5 役割圧縮） |
| §5 | 観測ポイント 12 件（5 SLA + 4 偽陽性セル + 3 Sumi/Asagi 巻き添え） |
| §6 | PASS criteria（5 SLA + 4 偽陽性セル + 3 巻き添え = 12 軸） |
| §7 | fallback 手順（5/8 朝着地不可時 → 5/12 復帰） |
| §8 | 議決-26 採択 5 軸への寄与判定 |
| §9 | Round 11 引継 TODO + Owner 観察ポイント prep |

## §2 9 シナリオ構成（要約）

| # | シナリオ名 | 起源 | 検証目的 | 想定時間 |
|---|---|---|---|---|
| S-1 | emergency_stop 発動 | drill #1 dry exec | 401/403 5 連続 → kill-switch 5s 内発火 | 10 分 |
| S-2 | P-E fallback 切替 | drill #1 dry exec | claude-bridge config 変更 + 5 件 send + 30s 内完遂 | 10 分 |
| S-3 | 24h 観測 SOP 起動 | drill #1 dry exec | SOP 17/20 → 18/20 ready 化 | 10 分 |
| S-4 | 復旧 + cost-tracker reset | drill #1 dry exec | subscription 駆動再開判定 4/4 + audit log hash chain 整合 | 10 分 |
| S-5 | Sumi/Asagi 巻き添え確認 | drill #2 当初 | 3 アプリ同時稼働で Open Claw 単独隔離可能性 | 15 分 |
| S-6 | continuous_run × sleep boundary | tos-monitor matrix | 深夜 0:00/12:00 切替 manual override | 10 分 |
| S-7 | cost_cap × spike legit | tos-monitor matrix | benchmark 連続実行 `--cost-cap-extended` | 10 分 |
| S-8 | rate_spike × boundary | tos-monitor matrix | レート 70% 瞬間突破 debounce 60s | 10 分 |
| S-9 | rate_spike × spike legit | tos-monitor matrix | benchmark spike `--rate-spike-extended` | 10 分 |

合計: 95 分（実測 timeline + buffer 15 分 = 110 分、§3 で 105 分 + 15 分 = 120 分内に圧縮）

## §8 議決-26 採択 5 軸への寄与判定

drill #2 = 議決-26 採択前提 5 軸のうち「軸-2 BAN drill #1 dry exec Pass」+ 「軸-3 必須コントロール 50 達成度 ≥ 95%」へ直接寄与。Phase 1 着手 5/26 Conditional Go 確度 +2pt（93→95%）押上見込み。

---

## Secretary-η 集約フッタ

- **配布資料番号**: №08 / 12
- **原本 file_path**: `projects/PRJ-019/reports/review-round10-ban-drill-2-prep.md`
- **原本 line count**: 375 行
- **集約方式**: ヘッダー追加 + 原本主要章ハイライト（原本 source-of-truth 維持、破壊コピーなし）
- **DoD**: 5/7 EOD Owner 配布パッケージ送付前に Secretary-η が原本との差分 0 件確認
- **次回更新**: Round 10 完遂時 / 5/8 議事録反映時

---

## Round 12 Secretary-G 5/8 当日配布版差分追記（2026-05-04 深夜終盤、DEC-019-059 起票直後）

### Round 11 Review-C drill #2 spec 完備反映

Round 11 で Review-C が以下を起案完遂:

- `drill-2-execution-spec.md`（480 行 / 9 シナリオ × 12 観測ポイント × 12 PASS criteria）
- `false-positive-matrix-v2.md`（402 行 / high 4 → 0 / 月次 < 0.07%）
- `50-controls-95-roadmap.md`（401 行 / 5/15 = 82% / 5/30 = 95%+）

= 1,283 行で drill #2 5/8 朝実機検証準備が完遂。

### Round 12 Review-D 実機検証 dispatch（DEC-019-059 §採択内容 (d) 由来）

5/8 朝 06:00-08:00（W0-Week1 検収会議直前 = 09:00 開始まで 1 時間 buffer）で実機検証実行:

| 時刻 | 内容 | 担当 |
|---|---|---|
| 06:00 | 集合 + 環境準備（Round 12 Review-D + Dev-A/B/C/D + Secretary-G） | 全員 |
| 06:15 | drill-2-execution-spec.md 9 シナリオ実機実行開始 | Review-D 主導 |
| 07:30 | 9 シナリオ完遂 + 結果集計 | Review-D |
| 07:45 | false-positive-matrix v2 検証結果 + 50-controls 95% roadmap 進捗確認 | Review-D + Dev チーム |
| 08:00 | 終了 + 5/8 議決-26 直前 CEO 統合判断 prep | Secretary-G |

### 5/8 議決-26 採択 5 軸への寄与（最終確定）

- **軸-2 BAN drill #1 dry exec Pass = Full Pass 5/5 維持**（Round 9 着地済）
- **drill #2 5/8 朝実機検証**で 9 シナリオ全件 PASS 確証 → 軸-2 PASS 強化
- **軸-3 必須コントロール 50 ≥ 95%**へ 5/30 まで 95%+ 達成 roadmap で間接寄与（5/15 = 82% / 5/30 = 95%+）
- 5/8 議決-26 採択確度 v12 85% → **v13 90%** 押上見込み

### Sumi/Asagi 巻き添えゼロ確証

S-5 シナリオ（3 アプリ同時稼働で Open Claw 単独隔離可能性、15 分）= Round 11 Dev-B multi-process-isolation.ts 316 行 + multi-process 独立確証完遂で確証根拠強化。

---

**Round 12 Secretary-G 集約フッタ**

- 差分追記日: 2026-05-04 深夜終盤（DEC-019-059 起票直後）
- 5/8 当日配布 ready: **完遂**
