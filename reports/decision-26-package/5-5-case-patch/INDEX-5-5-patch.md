# INDEX 5/5 case 差分パッチ

> **対象元**: `decision-26-package/INDEX.md`
> **連動 DEC**: DEC-019-060（status 暫定）
> **適用 trigger**: CEO 判断 confirmed = 議決-26 前倒し 5/5 case 採択

---

## §1 INDEX 配布対象 / status 上書き

| 項目 | 元値（5/8 case） | 5/5 case 上書き値 |
|---|---|---|
| 配布対象 | Owner（5/8 09:00 JST 議決-26 採決時、当日 45-50 分閲覧 + 採決） | **Owner（5/5 09:00 JST 議決-26 前倒し case 採決時、当日 45-50 分閲覧 + 採決）** |
| status | 5/8 朝 06:00 JST 配布 ready 状態 | **5/5 朝 06:00 JST 配布 ready 状態**（patch 適用後） |
| 起票担当 | Secretary-G R12 | **Secretary-H R13**（5/5 case patch 起票担当）|
| 連動 DEC | DEC-019-052 / 054 / 055 / 056 / 057 confirmed / 058 / 059 | **+ DEC-019-060（5/5 case 暫定→confirmed 切替後）** |

---

## §2 §2 当日読み順 推奨（5/5 09:00 JST 開始版、所要時間不変）

| 順 | ファイル | 所要 | 重点確認事項（5/5 case 差分） |
|---|---|---|---|
| 0 | INDEX.md + INDEX-5-5-patch.md | 3 分 | 5/5 case 差分把握 + KPI チェックリスト |
| 1 | 01-pm-final-agenda.md + 01-pm-final-agenda-5-5-patch.md | 7 分 | 5/5 議決日 + 5 軸 status 5/5 時点値 |
| 2 | 02-pm-case-c-timeline.md + 02-pm-case-c-timeline-5-5-patch.md | 5 分 | 5/5 case timeline + Phase 2 6/10 候補 |
| 3 | 03-pm-phase2-integration.md（差分なし、5/5 case でも維持） | 3 分 | Phase 2 着手 6/10 候補確認 |
| 4 | 04-marketing-narrative-final.md（差分なし）| 4 分 | 6/27 朝公開維持 narrative |
| 5 | 08-review-drill-2-prep.md + 08-review-drill-2-prep-5-5-patch.md | 4 分 | drill #2 5/5 朝 06:00-08:00 実機検証 + 9 シナリオ |
| 6 | 09-review-false-positive-re-eval.md（差分なし）| 3 分 | 4 cell PASS 確証 |
| 7 | 10-review-50-controls-re-audit.md（差分なし）| 3 分 | 必須 50 ctrl 95% roadmap |
| 8-10 | 05/06/07 marketing 系（差分なし）| 各 2 分 | 6/27 公開維持系 |
| 11 | 11-dev-round10-summary.md（差分なし、5/5 case でも維持） | 6 分 | Dev R10/R11/R12 着地累計 |
| 12 | 12-ceo-round10-integrated-v11.md + 12-ceo-integrated-5-5-patch.md | 6 分 | CEO 統合判断 5/5 case + Phase 1/2 timeline |
| **計** | — | **約 50 分** | **5/5 case 採決判定 + 議決-27 acknowledge** |

---

## §3 KPI 確認チェックリスト（5/5 case 当日確認用）

- [ ] 議決構造 = **25 件**（DEC-019-001〜060）確認
- [ ] dashboard 進捗 = **81%**（PRJ-019 行）確認
- [ ] API 累計コスト = **$0**（Round 5-13 累計）確認
- [ ] Owner 残動作 = **2 件のみ**（5/5 議決 + 6/26 公開確認）確認
- [ ] cross-validation = **5 部署 7 経路独立収斂**維持確認
- [ ] W3 中核 architecture = **22 日前倒し既達**（CB-D-W3-04 R11 + CB-D-W3-01 R12）確認
- [ ] drill #2 5/5 朝実機検証 = **06:00-08:00 Review-E R13 担当**確認
- [ ] 5/22 push 評価 = **5/19 候補化**（PM-F + Dev-J R13 評価結果次第）確認
- [ ] Phase 2 着手 = **6/10 候補化**（14 日前倒し）確認
- [ ] CEO 推奨度 = **Lv 4+「極めて強く推奨」維持**（5/5 case 前倒し追加根拠 3 件で Lv 4++ 相当）確認

---

## §4 §5 議決-27 acknowledge（5/5 case）

| 議決 | 元値（5/8 case） | 5/5 case |
|---|---|---|
| 議決-27 内容 | DEC-019-058/059 acknowledge | **+ DEC-019-060（5/5 case 暫定→confirmed 切替）acknowledge** |

---

## §5 5/8 元値との差分要約

本 patch は INDEX.md の **配布対象日 / status / 当日読み順 patch 添付指示 / KPI チェックリスト 5/5 case 値 / 議決-27 acknowledge 対象** を 5/5 case 用に上書きする。本体 INDEX 構造（§0 概要 / §1 12 件 + INDEX 概要 / §6 否決時 fallback / §7 Footer）は 5/8 case と完全同一。
