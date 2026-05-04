# 議決-26 配布資料 5/5 朝 06:00 JST 配布手順書 — 30 分手順 + abort criteria

> **5/5 朝 06:00 採決 / drill #2 = 5/7 朝分離**
> **発行日**: 2026-05-04 深夜終盤（Round 14 Secretary-I 起票）
> **担当**: Secretary 部門（5/5 朝当番）
> **status**: **5/5 朝 05:30-06:00 JST 実行 ready 状態**
> **連動 DEC**: DEC-019-060 confirmed + DEC-019-061 confirmed
> **行数**: 130 行

---

## §0 概要

5/5（火）朝 05:30-06:00 JST の 30 分手順 + 06:00 配布実行 + 09:00 採決開始 prep。Owner formal「採決日は 5/5 で行きましょう + 徹底的に進めて」directive 完全反映、CEO 標準推奨「drill #2 5/7 朝分離」採用、abort risk 5% 達成構造で実行。

---

## §1 5/5 朝 05:30-06:00 JST = 30 分手順

### §1.1 05:30 JST 環境チェック（5 分間）

| 確認項目 | 想定値 | 確認方法 |
|---|---|---|
| GitHub Actions workflow openclaw-monitor | 緑 ✓ | `gh run list --workflow=openclaw-monitor.yml` で最新 24 時間内成功確認 |
| standalone repo `prj019-claude-code-company` 最新 commit | DEC-019-061 起票反映済 | `gh repo view hironori-oi/prj019-claude-code-company --json defaultBranchRef` |
| API spend cap | $0 維持（Round 14 累計）| Anthropic Console + OpenAI Console 確認 |
| Slack 3-channel | live（HITL / monitor / drill）| Slack 各 channel 直近 1h 内 health-check ping |
| 5/5-FINAL bundle 16 件 file 状態 | 全件存在 + 改ざん検知なし | `ls -la 5-5-FINAL/` + `git status` で diff 0 確認 |
| Owner Slack DM 送信先 | 既登録済 | Slack Owner DM 開示 + ping 不要（送信時実行）|

→ 全項目 ✓ で 05:35 進行、いずれか NG で abort（§3 参照）

### §1.2 05:35 JST 5/5-FINAL bundle 最終確認（10 分間）

| 確認項目 | 想定値 |
|---|---|
| INDEX.md 行数 | 約 220 行（規定範囲内） |
| DISTRIBUTION-PROCEDURE.md 行数 | 約 130 行（80-150 行 spec 内）|
| MINUTES-TEMPLATE.md 行数 | 約 160 行（120-180 行 spec 内）|
| 01-pm-final-agenda-FINAL.md | 5/5 議決日 / drill #2 5/7 分離反映済 |
| 02-pm-case-c-timeline-FINAL.md | 5 placeholder 値埋め完遂 / 5/22 push 5/19 短縮反映 |
| 08-review-drill-2-prep-FINAL.md | drill #2 5/7 朝分離標準採用反映済 / Review-F R14 担当反映 |
| 12-ceo-integrated-FINAL.md | Lv 4+ 11 件昇格根拠反映 / 採択確度 88% 反映 / Round 14 dispatch 反映 |
| 13-secretary-fallback-package.md | fallback 連鎖 4 段階反映 |
| BASE-FILES-REFERENCE.md | base 8 件参照リスト反映 |
| base 不変 8 件 | 03/04/05/06/07/09/10/11 改ざん検知なし |

→ 全項目 ✓ で 05:45 進行

### §1.3 05:45 JST Owner Slack DM 送信（5 分間）

DM 文案（Slack DM、簡潔版）:

```
Owner さま

おはようございます。Secretary より 5/5 議決-26 採決配布資料 bundle を送付いたします。

【配布内容】
- 5/5-FINAL bundle 16 件（INDEX + DISTRIBUTION-PROCEDURE + MINUTES-TEMPLATE + 4 件 FINAL + 1 件 fallback + BASE-FILES-REFERENCE + base 不変 8 件）
- 当日読み順: INDEX.md → 01 → 02 → 03 → 04 → 08 → 09 → 10 → 05 → 06 → 07 → 11 → 12（45 分閲覧）
- 9:00 JST 採決開始（Owner 拘束 45 分、abort risk 5%）
- drill #2 = 5/7 朝 06:00-08:00 JST 分離検証（5/5 採決と切離）

採択確度: 88%（v15）/ 議決構造: 26 件（DEC-019-001〜061）/ Owner 残動作: 2 件不変

ご確認のうえ、9:00 JST に採決をお願いいたします。

Secretary-I
```

DM 添付ファイル: `5-5-FINAL/INDEX.md`（先頭、Owner 開封順序を統制）

### §1.4 05:50 JST 配布実行（5 分間）

- Slack DM 送信完了確認（Owner 既読確認は不要、送信成功確認のみ）
- mail 並行配布（Owner mail 登録済 = `hironori555@gmail.com`、5/5-FINAL bundle zip 添付 + INDEX.md 本文転記）
- 配布完了 timestamp 記録（dashboard / progress.md）

### §1.5 05:55-06:00 JST 配布完了確証 + 06:00 採決開始 prep

- 配布成功通知 = monitor channel に「5/5 議決-26 配布完遂、Owner 当日 09:00 採決開始 prep ready」投稿
- CEO 統合 v15 起草開始（Round 14 完遂後 30-45 min、5/5 朝 06:30 発行想定 → Owner 09:00 採決前 30 分閲覧用最終差分化）
- 5/7 朝 drill #2 実機検証 prep 担当 Review-F R14 通知（5/7 朝 06:00 集合確認）

---

## §2 09:00 JST 採決開始 prep（Secretary 専用）

| 時刻 | アクション |
|---|---|
| 08:30 | CEO 統合 v15 配布（Owner mail 短縮 ver、5 分閲覧）|
| 08:55 | Slack DM Owner 着席催促（軽い ping、optional）|
| 09:00 | Owner 着席確認 → 採決開始 |
| 09:00-09:42 | 議事フロー進行（01-pm-final-agenda-FINAL.md §3 議事フロー 5/5 09:00 開始版 45 分参照）|
| 09:42-09:45 | 採決結果記録 + MINUTES-TEMPLATE.md §3 4 case 別記入 + finalize |

---

## §3 abort criteria（即座 5/6 朝へ繰下げ trigger）

以下 6 件のいずれかが検知された場合、Secretary は **即座 abort 判定 + 5/6 朝へ繰下げ実行**:

| № | abort trigger | 検知方法 | 繰下げ手順 |
|---|---|---|---|
| 1 | 5/5-FINAL bundle 資料破損（git diff 検知）| 05:35 確認時 | 5-6-case-patch/ 配布へ即時切替（5/6 朝 06:00 配布） |
| 2 | GitHub Actions workflow 失敗 | 05:30 確認時 | 5/6 朝へ繰下げ + Dev 部門即時調査 |
| 3 | API spend cap $30 超過検知 | 05:30 確認時 | 5/6 朝へ繰下げ + Review 部門 spend cap 機構調査 |
| 4 | Slack 3-channel いずれか down | 05:30 確認時 | 5/6 朝へ繰下げ + Web-Ops 部門復旧 |
| 5 | Owner Slack DM 送信失敗（API error）| 05:50 配布時 | 即座 mail 単独配布 + 5/6 朝再配布判定 |
| 6 | Owner 5/5 朝 08:30 まで未着席（Slack online 未確認）| 08:30 prep 時 | 5/6 朝へ繰下げ + Owner formal 確認 |

→ abort 判定後 30 分以内に 5/6 朝 06:00 JST 配布へ切替（5-6-case-patch/ 4-5 件 + base 13 件 + INDEX patch 適用）

---

## §4 abort 連鎖時の 5/6/7/8 朝 fallback timeline

| 段階 | 採決日 | 配布日 | fallback 確度 |
|---|---|---|---|
| 0（基本）| 5/5（火）09:00 JST | 5/5 朝 06:00 JST（本手順）| 88% |
| 1 | 5/6（水）09:00 JST | 5/6 朝 06:00 JST | 80% |
| 2 | 5/7（木）09:00 JST | 5/7 朝 06:00 JST | 87% |
| 3 | 5/8（金）09:00 JST | 5/8 朝 06:00 JST（元計画）| 92% |

→ 全段階で 6/27 朝公開 confidence 92% 維持、Owner 残動作 2 件不変。

---

## §5 Footer

- **発行**: 2026-05-04 深夜終盤（Round 14 Secretary-I 担当）
- **位置付け**: 5/5-FINAL bundle 配布手順書（Secretary 専用）
- **行数**: 約 130 行（80-150 行 spec 準拠）
- **絵文字**: 不使用
- **DoD 完遂**: ① 30 分手順詳述完遂 ② abort criteria 6 件詳述完遂 ③ fallback 連鎖 4 段階反映完遂 ④ 09:00 採決開始 prep 詳述完遂
