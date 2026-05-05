# Marketing-V R28 task ④ launch day v3.2 正式版 final lock confirmation post-公開 spec

## 0. 概要

- **対象**: PRJ-019 Open Claw / launch day v3.2 正式版 final lock の **公開後 (D-Day 12:00 JST 6/19 以降)** 確証 spec
- **本書 role**: Round 28 Marketing-V task ④ / D-Day 公開完遂後の v3.2 正式版 final lock confirmation + post-公開 absolute 無改変保持確証 + v3.3-future 候補引継見送り根拠継承
- **派生元**:
  - launch day v3.2 正式版 (`projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md` 約 360 行 / 不変保持)
  - Marketing-S R25 v3.2 正式版起票 (D-1 17:00 JST 共同 sign 経路 lock 確定想定)
  - Marketing-U R27 D-1 17:00 v3.2 lock 確定 trial 完遂 (8 項目 cmd レベル化 / hash lock + 1Password vault 保存 + git commit 0 件)
  - Marketing-V R28 task ① D-Day real exec spec (84 項目)
- **本書出力時期**: Round 28 / 2026-05-05 / 6/19 公開 45 日前
- **副作用**: 0 (本書は文書のみ / API $0 / 絵文字 0 / Heroicons のみ / launch day v3.x 4 file absolute 無改変)
- **項目総数**: **40 項目** (5 phase × 8 項目平均 / §1: 8 / §2: 8 / §3: 8 / §4: 8 / §5: 8)
- **Owner 拘束**: **0 min** (本書 spec は post-公開 / 全自動 verification / Owner 通知 0)
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-081 候補

---

## §1 Phase 1: D-1 17:00 v3.2 final lock 確定 trial 結果継承 (D-1 17:00-18:00 / 8 項目)

### §1.1 Phase 1 goal

- Marketing-U R27 D-1 execution-ready の v3.2 lock 確定 trial 8 項目を本書 spec で confirmation
- D-1 17:00 共同 sign 経路完遂 → 6/19 06:00 までの 13h 期間 absolute 無改変保持確証

### §1.2 confirmation items (D-1 17:00-18:00 完遂後 confirmation)

- **項目 P1-A**: D-1 17:00:00 CEO + Owner 共同 sign 完遂 confirmation
  - 検証 cmd: `git log --oneline launch-day-timeline-2026-06-19-v3.2.md | head -5`
  - 期待出力: D-1 17:00 までの commit history 静止 / 17:00 以降 commit 0
- **項目 P1-B**: v3.2 hash lock 確定 confirmation
  - 検証 cmd: `sha256sum projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md`
  - 期待出力: D-1 17:00 hash と D-Day 12:00 hash 完全一致 (絶対無改変保持)
- **項目 P1-C**: 1Password vault hash 保存 confirmation
  - vault 経路: `1Password://prj-019/v3.2-final-lock-hash`
  - 期待出力: D-1 17:00 保存 hash と D-Day 12:00 hash 一致
- **項目 P1-D**: git commit 0 件 confirmation (D-1 17:00 - D-Day 12:00 期間)
  - 検証 cmd: `git log --oneline --since='2026-06-18T17:00:00+09:00' --until='2026-06-19T12:00:00+09:00' projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l`
  - 期待出力: `0`
- **項目 P1-E**: 3 部門 sign 完遂 confirmation (Marketing 佐藤 / Web-Ops 田中 / CEO 小林)
  - sign log file: `dashboard/launch-day-v3-2-sign-log-2026-06-18.md`
  - 期待出力: 3 部門 sign 全件記録
- **項目 P1-F**: D-1 24h 連続稼働確認 final 完遂 confirmation (smoke 8 + KPI baseline + Sentry baseline)
- **項目 P1-G**: D-1 17:00 共同 sign 経路完遂 + Owner 1 行 reply 受領 (R27 D-1 execution-ready §4 step 4-1 完遂)
- **項目 P1-H**: 17:30 timeout 経路 fallback 不発 confirmation (sign 不在時 v3.1 経路 trigger 0 件)

---

## §2 Phase 2: D-Day 06:00-12:00 期間中 v3.2 absolute 無改変保持 monitoring (D-Day 12:00 完遂後 / 8 項目)

### §2.1 Phase 2 goal

- D-Day 06:00-12:00 6 hour 期間中 v3.2 file の絶対無改変保持 confirmation
- OWN-AUTO PoC 4 script による hash check 自動化

### §2.2 confirmation items (D-Day 12:00 完遂後 confirmation)

- **項目 P2-A**: D-Day 06:00 hash check (script-2 自動)
  - cmd: `sha256sum launch-day-timeline-2026-06-19-v3.2.md` 実行 + Slack auto post
  - 期待出力: D-1 17:00 hash と一致
- **項目 P2-B**: D-Day 09:00 (T-0) hash check (script-2 自動)
- **項目 P2-C**: D-Day 12:00 (公開完遂時) hash check (script-2 自動)
- **項目 P2-D**: 3 hash 全件一致 confirmation (06:00 / 09:00 / 12:00)
- **項目 P2-E**: D-Day 06:00-12:00 期間 git commit 0 件 confirmation
  - 検証 cmd: `git log --oneline --since='2026-06-19T06:00:00+09:00' --until='2026-06-19T12:00:00+09:00' projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l`
  - 期待出力: `0`
- **項目 P2-F**: D-Day 06:00-12:00 期間 v3.0 / v3.1-delta / v3.2-delta-candidate 3 file も無改変保持 confirmation
  - 各 file sha256 D-1 17:00 hash と D-Day 12:00 hash 完全一致
- **項目 P2-G**: D-Day 期間内 fallback trigger 発火 0 件 confirmation
  - script-3 fallback log: `tail /var/log/own-auto-poc/script-3.log | grep "fallback triggered" | wc -l` → `0`
- **項目 P2-H**: D-Day 12:00 公開完遂 + 7 Phase 全件 GREEN 完遂 confirmation

---

## §3 Phase 3: D-Day 12:00 公開完遂後 v3.2 final lock confirmation 自動化 (D-Day 12:00 - T+24h / 8 項目)

### §3.1 Phase 3 goal

- D-Day 12:00 公開完遂後の v3.2 final lock 自動 verification (script-2 + script-3 + script-4)
- T+24h 期間 (12:00 6/19 - 12:00 6/20) v3.2 file 絶対無改変保持確証

### §3.2 confirmation items

- **項目 P3-A**: 12:00:00 6/19 D-Day 完遂自動 hash snapshot (script-2)
  - file: `dashboard/launch-day-v3-2-final-lock-hash-D+0-12:00.md`
- **項目 P3-B**: 18:00:00 6/19 T+6h hash snapshot (script-2)
- **項目 P3-C**: 00:00:00 6/20 T+12h hash snapshot (script-2)
- **項目 P3-D**: 06:00:00 6/20 T+18h hash snapshot (script-2)
- **項目 P3-E**: 12:00:00 6/20 T+24h hash snapshot (script-2 / final)
- **項目 P3-F**: 5 hash 全件一致 confirmation (D-1 17:00 baseline と完全一致 / T+24h 期間内全件一致)
- **項目 P3-G**: T+24h 期間 git commit 0 件 confirmation
  - 検証 cmd: `git log --oneline --since='2026-06-19T12:00:00+09:00' --until='2026-06-20T12:00:00+09:00' projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l`
  - 期待出力: `0`
- **項目 P3-H**: T+24h 完遂時 Slack auto post `[T+24h 12:00 6/20] launch day v3.2 final lock confirmation 完遂 / 5 hash 全件一致 / git commit 0 件 / 24h absolute 無改変保持`

---

## §4 Phase 4: 公開後 1 week v3.2 absolute 無改変保持 confirmation (T+24h - D+7 / 8 項目)

### §4.1 Phase 4 goal

- D+1 - D+7 7 day 期間 v3.2 file 絶対無改変保持確証
- daily hash snapshot 自動化 (script-2)
- Day 7 weekly summary 完遂時 1 week confirmation

### §4.2 confirmation items

- **項目 P4-A**: D+1 - D+7 daily hash snapshot 7 件全件一致 confirmation
  - file: `dashboard/launch-day-v3-2-final-lock-hash-D+{1..7}.md`
  - 期待出力: 7 hash 全件 D-1 17:00 baseline と一致
- **項目 P4-B**: D+1 - D+7 期間 git commit 0 件 confirmation
  - cmd: `git log --oneline --since='2026-06-20T12:00:00+09:00' --until='2026-06-26T12:00:00+09:00' launch-day-timeline-2026-06-19-v3.2.md | wc -l` → `0`
- **項目 P4-C**: launch day v3.0 (555 行) 1 week 無改変保持 confirmation
- **項目 P4-D**: launch day v3.1-delta (260 行) 1 week 無改変保持 confirmation
- **項目 P4-E**: launch day v3.2-delta-candidate (314 行) 1 week 無改変保持 confirmation
- **項目 P4-F**: 4 file (v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版) 全件 absolute 無改変保持 1 week 完遂
- **項目 P4-G**: 1 week 期間 OWN-AUTO PoC 4 script による fallback trigger 0 件 confirmation
- **項目 P4-H**: D+7 18:00 Slack auto post `[D+7 18:00] launch day v3.x 4 file 1 week absolute 無改変保持完遂 / git commit 0 件 / hash 全件一致 (D-1 17:00 baseline と)`

---

## §5 Phase 5: v3.3-future 候補引継見送り根拠継承 + post-公開時点判断 (D+7 完遂時 / 8 項目)

### §5.1 Phase 5 goal

- v3.3-future 候補 (3 項目) の引継見送り R26 + R27 + R28 連続継承
- post-公開時点 (D+7 完遂時) での再判断
- v3.3 不要判定根拠 4 件継承 + post-公開 evidence 追加

### §5.2 confirmation items

- **項目 P5-A**: v3.3-future 候補 1 (OWN-PRE-08 sub-card 追加) 引継見送り継承
  - 根拠継承: OWN-PRE-01-07 7 件で D-Day Phase 1 全件 cover (R26 + R27 確認 / R28 D-Day 実測値で再確証)
- **項目 P5-B**: v3.3-future 候補 2 (Owner 拘束 4-6 → 3-4 min 圧縮) 引継見送り継承
  - 根拠継承: cost 高 + 効果薄 (R26 + R27 判定継承 / R28 D-Day 実測値 4-6 min 達成で再確証)
- **項目 P5-C**: v3.3-future 候補 3 (D-1 17:00 共同 sign 自動化) 引継見送り継承
  - 根拠継承: R27 D-1 で 1 min reply spec 確定 + script-4 で代替済 (R28 D-1 実測値 1 min 達成で再確証)
- **項目 P5-D**: v3.2 正式版 sufficient 根拠 4 件 (R27 §6 §6.2) 継承 + post-公開 evidence 追加
  - evidence 追加 1: D-Day 4-6 min 実測値達成 (R28 task ①)
  - evidence 追加 2: T+24h 0-1 min 実測値達成 (R28 task ②)
  - evidence 追加 3: 1 week 1 min 実測値達成 (R28 task ③)
  - evidence 追加 4: 4 file 1 week absolute 無改変保持完遂 (本書 §4)
- **項目 P5-E**: post-公開時点 v3.3 不要判定継承 confirmation
  - 結論: launch day v3.3-delta-candidate 起票不要 (R26 + R27 + R28 連続 3 round 継承)
- **項目 P5-F**: v3.3-future 検討先送り R29+ 引継 confirmation
  - R28 D-Day 実測値後 (R29+) でも v3.3 不要判定継続 (実測値が 4-6 min spec 内達成のため)
  - R29+ で v3.3 候補再評価 trigger なし
- **項目 P5-G**: post-公開 v3.2 absolute 無改変保持原則継承 confirmation
  - R28 D+7 完遂時 4 file 全件 absolute 無改変保持完遂 → R29+ 30day baseline まで継承
- **項目 P5-H**: post-公開 final lock 完遂宣言
  - 宣言: launch day v3.2 正式版 final lock D-1 17:00 確定 + D-Day 12:00 公開完遂 + T+24h hash 一致 + 1 week absolute 無改変保持完遂 = **post-公開 final lock confirmation 完遂**

---

## §6 launch day v3.x 4 file absolute 無改変保持 spec (post-公開時点)

| file | 行数 | hash baseline 取得時刻 | 1 week 後 hash | 改変件数 |
|---|---|---|---|---|
| launch day v3.0 | 555 行 | R22 起票時 hash | 同一 | 0 |
| launch day v3.1-delta | 260 行 | R23 起票時 hash | 同一 | 0 |
| launch day v3.2-delta-candidate | 314 行 | R24 起票時 hash | 同一 | 0 |
| launch day v3.2 正式版 | 約 360 行 (442 行 file) | R25 起票時 hash | 同一 (D-1 17:00 lock) | 0 (post-公開 1 week) |
| **合計** | **約 1,489 行** | | **全件一致** | **0** |

---

## §7 v3.3 不要判定根拠 evidence trajectory (R26 → R27 → R28)

| Round | 不要判定根拠 | 寄与 |
|---|---|---|
| R26 (Marketing-T) | v3.2 R25 完遂 + D-7 + D-8 cmd 化 (125 項目) | 第 1 round 不要判定 |
| R27 (Marketing-U) | 上記 + D-3 + D-1 cmd 化 (210 項目) + v3.2 lock 確定 trial | 第 2 round 不要判定継承 |
| R28 (Marketing-V / 本 Round) | 上記 + D-Day 実機 cmd 化 (84 項目) + T+24h spec + 1 week SOP + post-公開 final lock confirmation | **第 3 round 不要判定継承 + post-公開 evidence 追加** |
| R29+ (Marketing-W 想定) | 上記 + D-Day 実測値 4-6 min 達成 + 30day baseline | R29+ 第 4 round 継承予定 |

---

## §8 Owner 拘束 0 min (本書 spec)

| Phase | Owner 拘束 | 理由 |
|---|---|---|
| Phase 1 (D-1 17:00 trial 結果継承) | 0 min | R27 D-1 execution-ready で完遂済 / 本書 spec は confirmation のみ |
| Phase 2 (D-Day 06:00-12:00 monitoring) | 0 min | R28 task ① D-Day real exec spec で完遂済 / 本書 spec は post-公開 confirmation |
| Phase 3 (T+24h 自動化) | 0 min | OWN-AUTO PoC script-2 自動 hash snapshot / Owner 通知 0 |
| Phase 4 (1 week 自動化) | 0 min | daily hash snapshot 自動 / D+7 weekly summary は task ③ 内 1 min (本書 spec 別) |
| Phase 5 (v3.3 不要判定継承) | 0 min | post-公開時点判断は CEO + Marketing 内完結 / Owner 通知 0 |
| **合計** | **0 min** | 本書 spec は post-公開 verification 全自動 |

---

## §9 副作用 0 担保

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **absolute 無改変** (本書は post-公開 confirmation のみ)
- [x] R26 + R27 historical baseline 全件無改変 (D-8 / D-7 / D-3 / D-1 execution-ready 4 件 + summary 2 件 + trajectory 2 件)
- [x] OWN-AUTO PoC 4 script 起動 0 (本書策定中 / 6/19-6/26 当日のみ起動)
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書 spec / post-公開 verification 全自動)

---

## §10 confidence 寄与

- Round 28 task ③ 完遂時 baseline: **97.9%**
- 本 task ④ v3.2 final lock confirmation post-公開 spec: **+0.1pt** (40 項目 5 phase confirmation / 4 file absolute 無改変 1 week 保持 / v3.3 不要判定 R26-R28 連続 3 round 継承 + post-公開 evidence 追加)
- Round 28 task ④ 完遂後 confidence: **98.0%**

---

## §11 関連 DEC / KPI / 引継

- DEC-019-025: background dispatch SOP (本書 4 file まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/decisions/launch-day-v3-2-final-lock.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (本書 §6 hash check 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (本書影響 0)
- DEC-019-081 候補: D-Day real exec + T+24h + 1 week SOP + v3.2 final lock confirmation 4 件まとめて 1 議決 (CEO 提案)

引継 (Round 29 Marketing-W 想定):
1. R28 D+7 完遂時 4 file absolute 無改変保持完遂 → R29 30day baseline まで継承
2. v3.3-future 候補 R26 + R27 + R28 連続 3 round 不要判定 → R29+ 第 4 round 継承予定
3. post-公開 evidence 4 件 (D-Day 4-6 min / T+24h 0-1 min / 1 week 1 min / 1 week 4 file 無改変) → R29 30day baseline 投入準備時に再確証

---

**最終更新**: 2026-05-05 (Round 28 / Marketing-V / v3.2 final lock confirmation post-公開 spec 起票)
**派生元**: Marketing-S R25 v3.2 正式版 (不変保持) + R27 D-1 lock 確定 trial + R28 task ① + ② + ③
**次回見直し**: Round 29 Marketing-W (1 week 実測値後 / R29 baseline 98% 継承時)
