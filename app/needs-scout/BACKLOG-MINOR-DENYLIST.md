# needs-scout BACKLOG — minor 16 件 denylist 拡張候補 [完了 2026-05-04 Round 11 Dev-A]

最終更新: 2026-05-04 Round 11 Dev-A / 案 A (Round 10 案 10-α 後継)
ステータス: **完遂** — minor 16 件のうち 14 件を `critical-domain-filter.ts` に append、2 件 (B-07 #13 / B-11 #16) は既存 keyword 部分一致で reject 確認済 (追加不要)
位置付け: review-round9-critical-13-domain-keyword-set.md §3.3 で classified された minor 16 件 denylist 候補。critical 7 + major 26 = 33 件は Round 10 で `critical-domain-filter.ts` に着地済。minor 16 件は本 Round 11 で 5/12 drill #1 本番前期限を 8 日前倒し完遂。
連動 DEC: DEC-019-010 / DEC-019-053 v15.5 / DEC-019-055 (Round 8 完遂) / DEC-019-056 (Round 9 前倒し) / DEC-019-057 (Round 10 暫定 → Round 11 confirmed)
連動レポート: projects/PRJ-019/reports/review-round9-critical-13-domain-keyword-set.md / projects/PRJ-019/reports/dev-round10-alpha-denylist-skill-adapter.md / projects/PRJ-019/reports/dev-round11-A-denylist-subprocess.md

---

## 概要

| 領域 | 全 keyword | 含有 | 抜け漏れ | critical | major | minor |
|---|---|---|---|---|---|---|
| B-01 重要インフラ | 30 | 21 | 9 | 1 (済) | 5 (済) | 3 |
| B-02 教育 | 30 | 23 | 7 | 1 (済) | 4 (済) | 2 |
| B-03 住居 | 30 | 25 | 5 | 0 | 2 (済) | 3 |
| B-04 雇用 | 30 | 27 | 3 | 0 | 2 (済) | 1 |
| B-05 金融 | 30 | 26 | 4 | 1 (済) | 2 (済) | 1 |
| B-06 保険 | 30 | 27 | 3 | 0 | 1 (済) | 2 |
| B-07 法律 | 30 | 26 | 4 | 1 (済) | 2 (済) | 1 |
| B-08 医療 | 30 | 27 | 3 | 1 (済) | 2 (済) | 0 |
| B-09 行政 | 30 | 30 | 0 | 0 | 0 | 0 |
| B-10 製品安全 | 30 | 27 | 3 | 0 | 1 (済) | 2 |
| B-11 国家安全保障 | 30 | 27 | 3 | 0 | 2 (済) | 1 |
| B-12 移住 | 30 | 27 | 3 | 1 (済) | 2 (済) | 0 |
| B-13 法執行 | 30 | 28 | 2 | 1 (済) | 1 (済) | 0 |
| 合計 | 390 | 341 | 49 | 7 (済) | 26 (済) | **16 (本 backlog)** |

---

## minor 16 件 list (5/12 drill 前期限) — **Round 11 完遂 2026-05-04**

### B-01 重要インフラ (minor 3) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 1 | 廃棄物処理制御 | [x] 追加 | 上下水処理に隣接、重要インフラ拡張 |
| 2 | 空調 BACnet | [x] 追加 (lowercase 'bacnet') | ビル制御、業界標準プロトコル |
| 3 | エレベーター制御 | [x] 追加 | 物理機構制御、人命安全関連 |

### B-02 教育 (minor 2) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 4 | 学習進捗評価 | [x] 追加 | 学校教育法判定の補助 |
| 5 | 学習進捗判定 | [x] 追加 | 学校教育法判定の補助 |

### B-03 住居 (minor 3) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 6 | 修繕費判定 | [x] 追加 | 不動産業界用語、宅建業法隣接 |
| 7 | 敷金判定 | [x] 追加 | 不動産業界用語、宅建業法隣接 |
| 8 | 礼金算定 | [x] 追加 | 不動産業界用語、宅建業法隣接 |

### B-04 雇用 (minor 1) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 9 | applicant tracking system | [x] 追加 (audit 用明示、既存 'applicant tracking' で部分 hit) | applicant tracking の英語フル形 |

### B-05 金融 (minor 1) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 10 | cic スコア | [x] 追加 | 日本国内信用情報、CIC 株式会社 (信用情報機関) |

### B-06 保険 (minor 2) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 11 | 引受査定 ai | [x] 追加 | underwriting ai 既存 + 日本語版 |
| 12 | actuary 自動 | [x] 追加 | 保険数理士、業界用語 |

### B-07 法律 (minor 1) — [x] 確認のみ (既存で reject 済)

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 13 | legal advice | [x] 既存 (line 138) | 既存配列で reject 確認済、追加不要 (audit trace 維持) |

### B-10 製品安全 (minor 2) — [x] 完遂

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 14 | iso 9001 判定 | [x] 追加 | 品質マネジメント |
| 15 | iso 13485 判定 | [x] 追加 | 医療機器品質マネジメント |

### B-11 国家安全保障 (minor 1) — [x] 確認のみ (既存で reject 済)

| # | keyword | 状態 | 備考 |
|---|---|---|---|
| 16 | cyber warfare | [x] 既存 (line 207) | 既存配列で reject 確認済、追加不要 |

---

## Round 11 着地サマリ

- **新規 append**: 14 件 (B-01 ×3 + B-02 ×2 + B-03 ×3 + B-04 ×1 + B-05 ×1 + B-06 ×2 + B-10 ×2)
- **既存確認のみ**: 2 件 (B-07 #13 'legal advice' / B-11 #16 'cyber warfare')
- **領域末尾 append のみ** (既存配列無改変、Object.freeze 維持、DEC-019-010 完全準拠)
- **法令条文番号 typography**: 該当なし (Round 10 で 弁護士法 72 条 / 医師法 17 条 / 行政書士法 1 条の 2 の 2 variant 着地済)
- **regression test**: minor 16 件代表を含む新規 12 件以上を `__tests__/critical-domain-filter.test.ts` に追加

---

## 5/12 drill #1 本番前 期限 — **8 日前倒し達成**

- 本 backlog の minor 16 件は drill #1 本番前 (5/12 EOD) までに `critical-domain-filter.ts` へ追加完遂する想定だった。
- 実績: 2026-05-04 Round 11 Dev-A で完遂 (8 日前倒し達成)。
- 担当: Dev-A (Round 11 / 案 A)
- regression test: 各 keyword 1 件以上 reject test を `__tests__/critical-domain-filter.test.ts` に追加 (R11-min01〜R11-min12 + 構造保証 1 件)。

---

## 関連 / sign-off

- Round 10 Dev-α 着地: critical 7 + major 26 = 33 件 (済)
- **Round 11 Dev-A 完遂: minor 16 件 (本 backlog) — 全件処理 (新規 14 / 既存確認 2)**
- 連動 task: CB-S-W0-02 (5/9 期限) ホワイトリスト v1 化 / CB-D-W3-01 needs_scout skill config 直接埋込 / CB-D-W3-04 skill-adapter subprocess 統合 (Round 11 Dev-A 並列着地)

**作成**: 2026-05-04 Round 10 Dev-α
**完遂**: 2026-05-04 Round 11 Dev-A (8 日前倒し)
**正式採択**: 2026-05-12 drill #1 本番前 (minor 16 件追加完遂済 → drill 期日に regression 検証のみ残)
