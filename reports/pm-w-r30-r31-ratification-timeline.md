# PM-W R30 → R31 採決 timeline 設計（DEC-084+085+086 atomic ratification）

- 起票: PM-W (Round 30 / 9 並列 1 軸目 / DEC-084-086 起案完遂後)
- 起票日時: 2026-05-06 (Round 30)
- 対象: R31 atomic 1 round session で DEC-084+085+086 を 3 件 atomic ratification 完遂する設計
- 設計 base: R29 PM-V 80 min session 9 段階 lock pattern 継承 + DEC-080+081 統合採決 pattern 拡張

## 1. 設計目標

- (G-1) DEC-084+085+086 を R31 1 round atomic 完遂（DRAFT 0 件 4th 達成 path）
- (G-2) Owner 拘束 0 分必達（CEO + PM-X + Sec-Y 3 者最低 / 緊急採決基準成立）
- (G-3) session 60-80 min（R29 PM-V 80 min を上限とする圧縮）
- (G-4) 7 段階 lock 整備（開会 + 各議決採決 3 段 + 統合 + marker + 引継 + 閉会）
- (G-5) 副作用 0 / API call $0 / 絵文字 0 / harness 902 PASS + openclaw 394 PASS 継承

## 2. 7 段階 timeline 設計（60-80 min）

| 段階 | 時刻 (R31 想定) | 所要 (min) | 主担当 | 内容 |
|---|---|---|---|---|
| ① 開会 | 09:00-09:05 | 5 | CEO | 議題確認 / DEC-084+085+086 統合採決方針宣言 / DRAFT 0 件 4th 達成宣言 |
| ② DEC-084 採決 | 09:05-09:25 | 20 | PM-X | GTC-7 完遂宣言 / 5 件全承認 / 投票 3-0-0 / status 行物理書換 |
| ③ DEC-085 採決 | 09:25-09:45 | 20 | PM-X | GTC-11 D-Day immediate trigger formal 化 / 5 件全承認 / 投票 3-0-0 / status 行物理書換 |
| ④ DEC-086 採決 | 09:45-10:05 | 20 | PM-X | ARCH-01 fully-resolved formal 遷移 + DEC-019-041 close 動議 / 5 件全承認 / 投票 3-0-0 / DEC-019-041 status 行 + DEC-086 status 行 atomic 書換 |
| ⑤ 統合 | 10:05-10:10 | 5 | CEO | 3 件 confirmed 統合確認 / DRAFT 0 件 4th 達成宣言 / 議決数 47 → 50 |
| ⑥ 採決 marker | 10:10-10:13 | 3 | Sec-Y | dashboard line 3 marker DEC-083 → DEC-086 prepend update |
| ⑦ R32 引継 + 閉会 | 10:13-10:20 | 7 | CEO + PM-X | R32 PM-Y 引継 3 項目宣言 / Owner 通知 0 件 / 閉会 |

**合計: 80 min（R29 PM-V と同一上限 / R31 PM-X 圧縮余地あり = 60 min path も可能）**

## 3. 採決ライン（緊急採決基準成立）

- **必須 3 者**: CEO（議長）+ PM-X（起案部門代表 = R31 PM 軸）+ Sec-Y（監査 = R31 Sec 軸）
- 投票見込: 各議決 3-0-0 賛成 0 反対 0 棄権 全会一致
- Owner directive: 「日付決め打ちなし / 完成次第即時 GO」継承 = R30 起案 → R31 採決 atomic pattern
- Owner 拘束: 0 分必達（OWN-W5-PROD-ACK 1 min は GTC-7 trigger 時の R30 内独立タスク / R31 採決 session 内には Owner 関与 0 件）

## 4. lock 設計（7 層継承）

| 層 | 内容 | 継承元 |
|---|---|---|
| L1 | DEC-019-001-079 line 1592 まで absolute 無改変 | R29 確立 |
| L2 | 既存 absolute 4 file 無改変（W4 5a-5d / control / Phase 1 / launch day v3.0-v3.2）| R28 確立 |
| L3 | DEC-080-083 confirmed section absolute 無改変（status 行を含む）| R29 着地 |
| L4 | DEC-068 v2 confirmed section absolute 無改変 | R29 着地 |
| L5 | sec yml 12 file md5 1 byte 不変厳守 | R28 確立 / 28 round 連続 |
| L6 | decisions.md 末尾 append-only のみ（既存議決 0 改変 / R31 採決時のみ DEC-084+085+086 + DEC-019-041 status 行 atomic 書換 = 計 4 行）| R29 確立 |
| L7 | harness 902 PASS / openclaw-runtime 394 PASS / TS6059 0 件継承 | R29 着地 |

## 5. R31 採決完遂後の着地値見込

- decisions.md 行数: R30 着地 2177 → R31 着地 2177 + 90-100 行（confirmed section append-only）= **2267-2277 行**
- 議決 confirmed 数: 47 → **50**（+3 / DEC-084+085+086 atomic 採決完遂）
- DRAFT 件数: 3 → **0**（4th 達成）
- DEC-019-041 status: `resolved-evidence-ready` → **`fully-resolved`**（DEC-086 連動 atomic 書換）
- harness PASS: 902 維持（R30 軸 5 Dev-III forward-only fix 完遂前提 / regression 0）
- 連続 round: R26+R27+R28+R29+R30+R31 = 連続 6 round 9/9 完遂維持見込

## 6. risk 分析（4 軸 / 全 LOW）

| risk | level | 緩和策 |
|---|---|---|
| (a) GTC-7 GREEN 未達 | LOW | R30 Web-Ops-Q 完遂前提 / OWN-W5-PROD-ACK 1 min push のみで起動 |
| (b) ARCH-01 forward-only fix 未達 | LOW | R30 Dev-III 工数 0.5-1.0h / R29 Dev-GGG 技術 fully-resolved 達成済 |
| (c) DEC-085 88 観点採点 readiness 未達 | LOW | R29 Review-U 56/56 観点 OK / GTC-11 flow 完成済 / R30 Review-V 引継のみ |
| (d) 採決 session 圧縮失敗（>80 min）| LOW | R29 PM-V 80 min lock 達成済 / DEC-080+081 統合採決 pattern で同等粒度議決 5 min/件達成済 |

## 7. R32 PM-Y 引継ぎ事項（R31 完遂後）

1. DRAFT 0 件 4th 達成状態の継続（atomic 起案 → 1 round 採決 pattern を default policy 化）
2. ARCH-01 fully-resolved formal 遷移後の knowledge INDEX patterns/ 化（Knowledge-Y 連動）
3. GTC-7+11 trigger 起動後の Phase 3 完遂宣言議決候補起案（DEC-019-087 想定 / R32+ 起案）

---

**完遂判定**: R31 atomic ratification timeline 設計完遂 / 7 段階 lock 整備完遂 / Owner 拘束 0 分必達 path 確定
