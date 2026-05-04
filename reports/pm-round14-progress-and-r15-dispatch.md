# PRJ-019 Round 14 PM-G deliverable 4 — Round 14 progress + Round 15 dispatch 推奨構成（11 並列完遂状況 measure + 9-10 並列構成）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round14-progress-and-r15-dispatch |
| 制定日 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） |
| 起票 | PM 部門（PM-G 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **Round 14 progress + Round 15 dispatch 推奨構成 v1**（Round 14 11 並列完遂状況 measure + 進捗 81% → 83-85% 想定 + Round 15 9-10 並列推奨構成） |
| 上位決裁 | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059（confirmed） |
| 親文書 | `ceo-round13-integrated-report-v14.md`（241 行 / Round 14 dispatch preview）+ `pm-round14-5-5-post-decision-transition.md`（姉妹文書）|
| 範囲 | Round 14 11 並列完遂状況 measure + 進捗 81% → 83-85% 想定根拠 + Round 15 dispatch 9-10 並列推奨構成 + Round 15 deliverable 詳細 |
| ステータス | **draft v1**（5/7 EOD Round 14 完遂時 v1.1 化、5/8 朝 Round 15 dispatch 起動連動） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 Round 14 PM-G deliverable 4。Round 14 11 並列（PM-G/Review-F/Sec-I/Dev-A〜E/Marketing-H/Knowledge-J/Web-Ops-B）完遂状況 measure（5/4 深夜終盤起動 → 5/7 EOD 完遂見込み）+ 進捗 81% → 83-85% 想定根拠（Dev-C drill-2 wire-up + drill #2 5/7 朝 PASS + 必須 50 軸 80% 維持）+ Round 15 dispatch 9-10 並列推奨構成（Dev 5 並列 production-ready 化 + Review-G 必須 50 軸 85% trajectory + PM-H 5/15 trial 当日 spec final + Marketing-I extraction production + Knowledge-K INDEX-v6 + Sec-J DEC-019-062 起票）+ Round 15 deliverable 30 件詳細。Owner formal「採決日 5/5」directive 整合。

---

## §1 Round 14 11 並列完遂状況 measure

### §1.1 Round 14 起動状況（5/4 深夜終盤 → 5/7 EOD）

```
5/4 深夜終盤  Round 14 PM-G 自身を含む 11 並列 dispatch 起動
5/5 04:00-06:45  Round 14 各部署 5/5 朝 case patch task 並行
5/5 06:45 EOD  Round 14 dispatch 全部署起動完遂 + 進捗 81% → 81.5% 想定
5/6 (月)       Round 14 各部署 task 進捗 50% (Dev 5 並列 + Review-F drill #2 prep)
5/7 (火) 06:00-08:00  drill #2 5/7 朝実機検証実施
5/7 (火) EOD   Round 14 完遂 + 進捗 81.5% → 83-85% 想定
```

### §1.2 Round 14 11 部署 deliverable + 完遂状況 measure（5/4 深夜終盤時点予測）

| 部署 | 主要 task | 規模想定 | 完遂時刻 | 完遂確度 |
|---|---|---|---|---|
| **PM-G (本書担当)** | 5/5 transition plan + Phase 1 case 詳細詰め + MS-2 trial 当日支援 + 本書 = 4 deliverable | 約 1,400-1,800 行 | 5/4 深夜終盤完遂 | **100%（本書起票完遂時点）** |
| Review-F | drill #2 5/7 朝実機検証実施 + 結果集計 + 5/15 中間チェック当日 + drill #3 readiness | 約 600-800 行 | 5/7 EOD | 90% |
| Sec-I | DEC-019-061 起票 + 5/7 当日後 follow-up + weekly digest #1 + 完遂レポ | 約 800-1,000 行 / 4 task | 5/7 EOD | 95% |
| Dev-A | YAML loader fail-fast 化 + multilingual filter 統合 + 自動 lint workflow + 漢字辞書 35→50+ | 約 400-600 行 / +20-30 tests | 5/7 EOD | 85% |
| Dev-B | heartbeat-gap detector primitive 化 + detector-functions z-score 統合 + notify-bridge retry policy DI | 約 600-800 行 / +30-40 tests | 5/7 EOD | 85% |
| **Dev-C** | resource-constraints syscall 実装（cgroup/Job Object）+ **drill-2 real-mode wire-up（5-10 行）** + drill #3 readiness | 約 800-1,200 行 / +30-50 tests | **5/6 EOD wire-up + 5/7 EOD task 全体完遂** | **80%（wire-up critical path）** |
| Dev-D | wireSpawnHandleToKillSwitch 完全統合 + cli-version-check actual exec + HITL gate-12 実装着手 | 約 600-800 行 / +30-40 tests | 5/7 EOD | 85% |
| Dev-E | FileHitl11Gate I/O 配線 + yaml-front-matter parser + KE-02 trigger orchestrator wiring + KE-04 ↔ audit-store 配線 | 約 600-900 行 / +30-50 tests | 5/7 EOD | 90%（Round 13 KE 系完遂 momentum）|
| Marketing-H | extraction Vercel build hook + cron scheduling + portfolio v3.1 + 英語版 v1.1 | 約 1,000-1,500 行 + 英語版 30,000+ 字 | 5/7 EOD | 85% |
| Knowledge-J | INDEX-v4 → v5 + HITL gate-11 spec の 1st 適用 + Round 13 由来 ナレッジ抽出（3-5 entries）| 約 5-8 file / retrieval 拡張 | 5/7 EOD | 90% |
| Web-Ops-B | shadcn/ui 物理 install + Vercel Analytics 接続 + Tag Manager scroll_75 | 約 8-12 file / 約 1,200-1,800 行 | 5/7 EOD | 80% |

**Round 14 完遂確度 集計**: PM-G 100% + 他 10 部署平均 86% = **約 87% 完遂確度**（11 部署中 9-10 部署 5/7 EOD 完遂見込み）。

### §1.3 Round 14 中の critical path 3 件

| # | critical path | 影響 |
|---|---|---|
| 1 | **Dev-C 5/6 EOD drill-2 real-mode wire-up（5-10 行）→ 5/7 朝 drill #2 実機実行** | 失敗 → drill #2 5/7 朝 abort → 軸-2 PASS 不確実 → 5/8 朝再実機検証必要 |
| 2 | **Dev-C 5/6 23:30 dry-run 再実行（45 セル全 true 確認）→ 5/7 朝 drill #2 実機実行 prep final** | 失敗 → drill #2 5/7 朝 prep 不充分 → drill #2 abort risk |
| 3 | **Sec-I 5/7 EOD DEC-019-061 起票 → Round 15 dispatch 5/8 朝起動** | 失敗 → Round 15 dispatch 起動 1 日遅延 → MS-1 W1 着手 5/13 タイト |

### §1.4 Round 14 完遂時の進捗想定

| 想定 case | 完遂状況 | 進捗 |
|---|---|---|
| **best case**（11 部署全 100% 完遂 + drill #2 5/7 朝 PASS）| 11/11 | **85%（+4pt）** |
| **likely case**（10/11 部署完遂 + drill #2 5/7 朝 PASS）| 10/11 | **84%（+3pt）** |
| typical case（9/11 部署完遂 + drill #2 5/7 朝 PASS）| 9/11 | **83%（+2pt）** |
| risk case（8/11 部署完遂 + drill #2 5/7 朝 abort）| 8/11 | 81%（維持）|

→ **Round 14 EOD 想定進捗 = 81% → 83-85%（+2-4pt）**、likely case **84%**。

---

## §2 Round 14 完遂状況 measure 軸

### §2.1 Round 14 measure 5 軸

| 軸 | 軸内容 | Round 14 進捗 measure |
|---|---|---|
| 1. **deliverable 件数** | 各部署 deliverable 完遂数 / 想定 deliverable 数 | 11 部署 × 平均 3-4 deliverable = 33-44 件想定、Round 14 EOD で 30-40 件完遂見込み（85% 完遂率）|
| 2. **コード規模** | 累計 code/refactor 行数 + tests | 約 4,000-6,000 行 + 約 200-300 tests 想定 |
| 3. **必須 50 軸 達成度** | Round 13 EOD 80% → Round 14 EOD 維持 | 80% 維持（Round 14 期間中 KE 系新規完遂なし、5/15 W1 着手後 Round 17 で 96%+ trajectory）|
| 4. **drill #2 5/7 朝 PASS 度** | 軸-2 PASS / FAIL / abort | drill #2 5/7 朝 PASS = 軸-2 +1pt 即時 PASS |
| 5. **API 累計コスト** | $0 累計（5 日連続）→ Round 14 EOD $0 維持 | **$0 維持**（Anthropic $30 cap 内、累計 6 日連続 $0 想定）|

### §2.2 Round 14 EOD 想定 vs Round 13 EOD 比較

| 指標 | Round 13 EOD | **Round 14 EOD 想定** | Δ |
|---|---|---|---|
| 進捗 | 81% | **84%** | +3pt |
| 必須 50 軸 | 80% | 80% | 0pt（Round 17 で 96%+） |
| **議決-26 採決（5/7 case）** | 87% | **(D) 採決完遂** | 採決完遂 |
| 5/15 MS-2 trial 確度 | 80% | **82%** | +2pt |
| 5/22 sign-off push case 確度 | 48-65% | **52-68%** | +4pt |
| 5/22 内部運用着手 | 85% | **87%** | +2pt |
| 6/27 公開 | 90% | **91%** | +1pt |
| API 累計コスト | $0 | $0 | 0 |
| workspace test | 約 1,000+ pass | **約 1,200+ pass** | +200+ |
| ナレッジ累計 | 47 entries | **52-55 entries** | +5-8 |

---

## §3 Round 15 dispatch 推奨構成（5/8 朝起動 / 9-10 並列）

### §3.1 Round 15 dispatch 9-10 並列推奨構成

| # | 部署 | 主要 task | 引継元 | 規模想定 |
|---|---|---|---|---|
| 1 | **Dev-A R15** | YAML loader 仕様確定 + multilingual filter production-ready + 自動 lint workflow production + 漢字辞書 50→70+ | Dev-A R14 | 約 400-600 行 |
| 2 | **Dev-B R15** | detector-functions z-score 完遂 + notify-bridge retry production + heartbeat-gap detector production-ready | Dev-B R14 | 約 500-700 行 |
| 3 | **Dev-C R15** | cgroup/Job Object 実装完遂 + drill #3 readiness + resource-constraints production-ready | Dev-C R14 | 約 700-1,000 行 |
| 4 | **Dev-D R15** | HITL gate-12 実装完遂 + cli-version-check production + wireSpawnHandleToKillSwitch production | Dev-D R14 | 約 600-800 行 |
| 5 | **Dev-E R15** | KE-02 trigger orchestrator production + KE-04 ↔ audit-store production + FileHitl11Gate production-ready + **Round 15 GO 判定 prep** | Dev-E R14 | 約 600-900 行 |
| 6 | **Review-G R15** | 必須 50 軸 5/12 EOD 85% trajectory + drill #3 prep + tos-monitor production-ready | Review-F R14 | 約 400-600 行 |
| 7 | **PM-H R15 (next round)** | 5/15 trial 当日 spec final + Owner 中間報告 v1 起案 + Round 16 dispatch preview + 5/22 sign-off case 詳細詰め v2 | PM-G R14 | 約 1,000-1,500 行 |
| 8 | **Marketing-I R15** | extraction production runtime + portfolio v3.1 確定 + 英語版 v1.2 + dynamic disclosure 6 cards production-ready | Marketing-H R14 | 約 800-1,200 行 |
| 9 | **Knowledge-K R15** | INDEX-v5 → v6 + Round 14 由来 ナレッジ抽出（5-8 entries）+ HITL gate-11 spec 2nd 適用 | Knowledge-J R14 | 約 6-10 file |
| 10 | **Sec-J R15** | DEC-019-062 起票 prep + 5/15 trial 当日 prep + weekly digest #2 + Round 15 完遂レポ | Sec-I R14 | 約 800-1,200 行 / 4 task |

→ **Round 15 dispatch 推奨 = 10 並列**（Dev 5 + Review-G + PM-H + Marketing-I + Knowledge-K + Sec-J）。

### §3.2 Round 15 9-10 並列構成 vs 11 並列構成 比較

| 構成 | 並列数 | 利得 | リスク |
|---|---|---|---|
| **10 並列（推奨）** | 10 | Web-Ops 部分 5/8-5/12 期間で skeleton 維持 + Phase 2 W1（5/23-）で本格化、Round 15 期間中の Web-Ops 並列なし | 0（Web-Ops は Phase 2 W1 で十分追いつく）|
| 11 並列（Web-Ops-C 追加） | 11 | Round 15 期間中も Web-Ops 並列継続 | Web-Ops-C task 充実度低（5/8-5/12 期間中の独立 deliverable 起票困難）|

→ **CEO 推奨 = 10 並列**（Web-Ops は Phase 2 W1 で本格化）。

### §3.3 Round 15 期間（5/8-5/12 / 5 日間）

```
5/8 (水) 朝 06:00-09:00  CEO Round 15 dispatch 起動 + 全部署キックオフ
5/8 (水) 09:00-EOD       Round 15 各部署 task 着手
5/9 (木)                 Round 15 進捗 30%
5/10 (金)                Round 15 進捗 50% + Marketing-I extraction production runtime 起動
5/11 (土)                Round 15 進捗 70% + Dev 5 並列 production-ready 化 + 必須 50 軸 5/11 EOD 85% 達成
5/12 (日) EOD            Round 15 完遂 + Dev-E 評価 final prep + Owner 中間報告 v1 起案
```

### §3.4 Round 15 完遂時の進捗想定

| 想定 case | 完遂状況 | 進捗 |
|---|---|---|
| best case（10/10 部署完遂 + 必須 50 軸 85% 達成）| 10/10 | **87%（+3pt）** |
| likely case（9/10 部署完遂 + 必須 50 軸 85% 達成）| 9/10 | **86%（+2pt）** |
| typical case（8/10 部署完遂 + 必須 50 軸 84% 達成）| 8/10 | 85%（+1pt） |

→ **Round 15 EOD 想定進捗 = 84% → 86%（+2pt）**、likely case **86%**。

### §3.5 Round 15 deliverable 30 件詳細

| 部署 | deliverable 件数 | 主要 deliverable |
|---|---|---|
| Dev-A R15 | 4 件 | YAML loader 仕様 / multilingual filter prod / lint workflow prod / 漢字辞書 70+ |
| Dev-B R15 | 3 件 | detector-functions z-score / notify-bridge retry prod / heartbeat-gap detector prod-ready |
| Dev-C R15 | 3 件 | cgroup/Job Object 完遂 / drill #3 readiness / resource-constraints prod-ready |
| Dev-D R15 | 3 件 | HITL gate-12 完遂 / cli-version-check prod / wireSpawnHandleToKillSwitch prod |
| Dev-E R15 | 4 件 | KE-02 trigger prod / KE-04 ↔ audit-store prod / FileHitl11Gate prod-ready / Round 15 GO 判定 |
| Review-G R15 | 3 件 | 必須 50 軸 85% trajectory / drill #3 prep / tos-monitor prod-ready |
| PM-H R15 | 4 件 | trial spec final / Owner 中間報告 v1 / Round 16 dispatch preview / Phase 1 case 詳細詰め v2 |
| Marketing-I R15 | 4 件 | extraction prod runtime / portfolio v3.1 確定 / 英語版 v1.2 / dynamic disclosure 6 cards prod-ready |
| Knowledge-K R15 | 3 件 | INDEX-v6 / Round 14 由来 抽出 / HITL gate-11 spec 2nd 適用 |
| Sec-J R15 | 4 件 | DEC-019-062 起票 prep / 5/15 trial prep / weekly digest #2 / Round 15 完遂レポ |
| **Round 15 合計** | **35 件** | — |

→ Round 15 期間（5 日間）で **35 件 deliverable** 完遂見込み（10 並列 × 平均 3.5 件 / 部署）。

---

## §4 Round 14 → Round 15 → Round 16 → Round 17 連動

### §4.1 Round 連動 timeline

| Round | 期間 | 並列数 | 主要 milestone |
|---|---|---|---|
| Round 14 | 5/4 深夜終盤 - 5/7 EOD | 11 | drill #2 5/7 朝実機検証 PASS |
| Round 15 | 5/8-5/12 | 10 | Dev 5 並列 production-ready 化 / Owner 中間報告 v1 / Dev-E GO 判定 prep |
| Round 16 | 5/13-5/14 | 9 | MS-1 W1 着手 / W1 day 1-2 / 5/15 trial 直前最終確認 / Dev-E Round 15 GO 判定 final |
| Round 17 | 5/16-5/22 | 9-10 | trial 結果反映 / DEC-019-062 起票 / W1 残務 / W2 / 必須 50 軸 100% 達成 / drill #2 5/22 朝再 / Phase 1 sign-off 5/22 |
| **小計** | **5/4 深夜終盤 - 5/22 EOD** | **平均 9.75 並列** | **Phase 1 sign-off 完遂** |

### §4.2 Round 14-17 期間の進捗 trajectory

| Round | 開始進捗 | 終了進捗 | Δ |
|---|---|---|---|
| Round 14 (5/4 深夜終盤 - 5/7 EOD) | 81% | 84% | +3pt |
| Round 15 (5/8-5/12) | 84% | 86% | +2pt |
| Round 16 (5/13-5/14) | 86% | 88% | +2pt（MS-1 W1 着手効果） |
| Round 17 (5/16-5/22) | 88% | **95%（Phase 1 sign-off 完遂）** | +7pt |

→ **5/4 深夜終盤 81% → 5/22 EOD 95%**（17 日間で +14pt 進捗）。

---

## §5 Round 15 dispatch 起動準備

### §5.1 Round 15 起動準備 5/7 EOD - 5/8 朝 06:00 timeline

```
5/7 EOD 18:00  PM-G Round 14 完遂レポ + Round 15 dispatch preview 起案完遂
5/7 EOD 19:00  Sec-I DEC-019-061 confirmed + Round 15 dispatch 起動 trigger 待機
5/7 EOD 20:00  CEO Round 15 dispatch mail 起案
5/8 朝 06:00   CEO Round 15 dispatch 起動 mail 配信（10 並列、全部署キックオフ）
5/8 朝 06:30   全部署 dispatch mail 受領 acknowledge
5/8 朝 09:00   Round 15 各部署 task 着手公式
```

### §5.2 Round 15 起動 prep 4 件

| # | prep | 担当 | 完遂期限 |
|---|---|---|---|
| 1 | Round 14 完遂レポ起案 | PM-G | 5/7 EOD 18:00 |
| 2 | Round 15 dispatch preview 起案（本書 §3）| PM-G | 5/4 深夜終盤完遂（本書）|
| 3 | DEC-019-061 confirmed 切替 + Round 15 dispatch authorization | Sec-I | 5/7 EOD 19:00 |
| 4 | Round 15 dispatch mail 起案 + 配信 | CEO | 5/7 EOD 20:00 - 5/8 朝 06:00 |

---

## §6 結論（DoD 達成判定）

1. **Round 14 11 並列完遂状況 measure 確定** (§1.1-§1.4): 11 部署 deliverable + 完遂確度 + critical path 3 件 + 進捗 81% → 83-85% 想定。
2. **Round 14 measure 5 軸確定** (§2.1-§2.2): deliverable 件数 / コード規模 / 必須 50 軸 / drill #2 PASS / API コスト + Round 13 EOD 比較。
3. **Round 15 dispatch 9-10 並列推奨構成確定** (§3.1-§3.5): 10 並列推奨 + 35 件 deliverable + 5 日間期間 + 進捗 86% 想定。
4. **Round 14-17 連動 timeline 確定** (§4.1-§4.2): 4 Round 平均 9.75 並列 / 進捗 81% → 95%（17 日間 +14pt）。
5. **Round 15 起動準備 4 件確定** (§5.1-§5.2): Round 14 完遂レポ / dispatch preview / DEC-019-061 / dispatch mail。

→ **Round 14 progress + Round 15 dispatch 推奨構成 DoD 達成**。Round 14 EOD 進捗想定 81% → 84%（likely case）+ Round 15 10 並列 35 件 deliverable 推奨構成完備。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）
- DEC-019-060（5/5 採決後 confirmed）
- DEC-019-061（Round 14 Sec-I 起票予定、Round 15 dispatch authorization）

### §7.2 参照書

- `ceo-round13-integrated-report-v14.md`（Round 13 CEO 統合報告 v14、241 行）— Round 14 dispatch preview 整合
- `pm-round14-5-5-post-decision-transition.md`（Round 14 PM-G 姉妹文書）— 17 日 transition 連動
- `pm-round14-phase1-signoff-5-22-detail.md`（Round 14 PM-G 姉妹文書）— 5/22 sign-off 詳細連動
- `pm-round14-ms2-trial-day-support.md`（Round 14 PM-G 姉妹文書）— MS-2 trial 当日支援連動

### §7.3 Risk Register v3.3 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): drill #2 5/7 朝 PASS で残存 15-30%、5/22 朝再 PASS で 5-10%
- R-019-09 (NG-3 24/7 監視): tos-monitor production 5/13 起動、Round 15 期間で production-ready 化
- R-019-10 (重要分野ホワイトリスト未確定): 5/22 EOD 100% 達成見込
- R-RUSH-01〜04: 5/5 採決前倒し +3 日で残作業 +3 日余裕、Round 14-17 期間でリスク 0pt 化

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） | PM 部門（PM-G 独立 Agent） | 初版（Round 14 11 並列 measure + 進捗 81% → 84% likely case + Round 15 10 並列 35 件 deliverable + Round 14-17 連動 timeline + 起動準備 4 件） |

**v1 確定**: 2026-05-04 深夜終盤（Round 14 PM-G 完遂時） / **採用判断**: 5/7 EOD Round 14 完遂時 v1.1 / **次回更新**: 5/7 EOD Round 14 完遂反映 v1.1 / 5/12 EOD Round 15 完遂反映 v1.2

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round14-progress-and-r15-dispatch.md`
- 版: v1（2026-05-04、Round 14 PM-G 担当 deliverable 4）
- 起案: PM 部門（PM-G 独立 Agent）
- 範囲: Round 14 progress + Round 15 dispatch 推奨構成 + 連動 timeline
- 検収: CEO（Round 14 commit 時 + 5/7 EOD Round 14 完遂時）+ Sec-I（DEC-019-061 起票連動）
