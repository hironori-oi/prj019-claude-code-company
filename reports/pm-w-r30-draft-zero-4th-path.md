# PM-W R30 DRAFT 0 件 4th path 設計（atomic 起案 → 1 round 採決 default policy 化 spec）

- 起票: PM-W (Round 30 / 9 並列 1 軸目 / DEC-084-086 起案完遂連動)
- 起票日時: 2026-05-06 (Round 30)
- 対象: R23 1st / R26 2nd / R29 3rd に続く DRAFT 0 件 4th 達成 path = R30 起案 → R31 採決 1 round atomic pattern を default policy 化する spec
- 直近 trajectory: R23 1st (PRJ-019 W2 完遂宣言 atomic) / R26 2nd (W4 完遂連動) / R29 3rd (DEC-080+081+082+083 atomic) / **R30+R31 4th （本 path 設計対象）**

## 1. 設計目標

- (G-1) R23/R26/R29 で実証された DRAFT 0 件達成パターンを再現可能 default policy 化
- (G-2) R30 起案 → R31 採決 1 round atomic を formal SOP 化（DEC-019-025 background dispatch 実証 28 件目 候補）
- (G-3) atomic 起案 → 1 round 採決 pattern の repeatability 検証 = 4 度目連続成立で pattern maturity 認定
- (G-4) Owner 拘束 0 分必達 / 副作用 0 / API call $0 / 絵文字 0
- (G-5) 議決 maturity 段階 (DRAFT → 議決準備完遂 → confirmed) の中間 state 削減 = decision lifecycle 圧縮

## 2. DRAFT 0 件達成 history（4 path 比較）

| path | round | atomic 議決数 | 起案 round | 採決 round | session 時間 | 採決ライン | Owner 拘束 |
|---|---|---|---|---|---|---|---|
| 1st | R23 | 1 件 (W2 完遂宣言) | R22 | R23 | 約 60 min | 3 者 | 0 分 |
| 2nd | R26 | 0 件直接（既存 0 維持）| - | - | - | - | 0 分 |
| 3rd | R29 | 5 件 (DEC-080+081+082+083 + DEC-068 v2) | R28 | R29 | 80 min | 3 者 (CEO+PM-V+Sec-X) | 0 分 |
| **4th 候補** | **R31** | **3 件 (DEC-084+085+086)** | **R30** | **R31** | **60-80 min** | **3 者 (CEO+PM-X+Sec-Y)** | **0 分** |

**特徴**: R23 単発 → R29 5 件統合 → R31 3 件統合 = atomic 採決数の収束（議決粒度 stabilize）+ 採決時間の収束（80 min 上限 lock）

## 3. atomic 起案 → 1 round 採決 default policy spec

### 3.1 適用条件（4 軸 AND）

- (C-1) 起案 round で議決準備完遂版 base が成立済（spec/rationale 50 行以上 + 5 必須 section）
- (C-2) 上流継承議決が confirmed 済（依存議決の同 round 採決必要なし）
- (C-3) 採決ライン 3 者最低成立（議長 CEO + 起案部門代表 + 監査 = 緊急採決基準）
- (C-4) Owner 拘束 0 分（自走 session / Owner directive の date-free 方針整合）

### 3.2 採決方式 SOP

- (S-1) 1 round atomic session = 60-80 min（R29 80 min を上限とする）
- (S-2) 7 段階 lock（開会 + 各議決採決 N 段 + 統合 + marker + 引継 + 閉会）
- (S-3) 各議決採決時間 = 5-25 min（R29 DEC-080 5 min / DEC-082 25 min 範囲）
- (S-4) 投票方式: 3 者賛成 0 反対 0 棄権 全会一致（緊急採決基準）
- (S-5) status 行物理書換: confirmed 時のみ atomic 書換、本文 absolute 無改変

### 3.3 lock 設計（7 層継承）

R29 PM-V 確立 7 層 lock を本 default policy で標準化:
1. 既存 DEC absolute 無改変（line 1592 まで）
2. 既存 absolute 4 file 無改変
3. 直前 round confirmed section 無改変
4. v2/v3 supersede 関係明文化（status 行のみ書換）
5. sec yml 12 file md5 不変
6. decisions.md 末尾 append-only
7. harness PASS / openclaw PASS / TS6059 0 件継承

## 4. policy 化 → 議決候補（DEC-019-087 想定）

R31 atomic 採決完遂後（4th 達成）、R32+ で本 default policy を formal 化する議決候補:
- 議決 ID 候補: DEC-019-087
- タイトル候補: atomic 起案 → 1 round 採決 default policy 化（DRAFT 0 件継続維持 SOP）
- 起案者: PM-Y (R32 想定)
- 採決時期: R32+ session
- 採決方式: 本 policy 自体を本 policy で採決（self-bootstrapping = 4 度の実証 base に formal 化）

## 5. R30+ 以降の expected trajectory

| round | 起案議決 | 採決議決 | DRAFT 着地 | DRAFT 0 件 |
|---|---|---|---|---|
| R30 (本 round) | DEC-084+085+086 | - | 3 件 | 未達（R30 末） |
| R31 (見込) | - | DEC-084+085+086 | 0 件 | **4th 達成** |
| R32 (見込) | DEC-019-087 + 候補 | - | 1+ 件 | 未達（R32 末） |
| R33 (見込) | - | DEC-019-087 | 0 件 | **5th 達成** |

**4th → 5th 連続達成 = pattern maturity 認定 = repeatability 確証**

## 6. risk 分析（3 軸 / 全 LOW）

| risk | level | 緩和策 |
|---|---|---|
| (a) atomic 議決数増加（>5 件）による session 圧迫 | LOW | R29 5 件 80 min 実証 / 圧縮 SOP 整備済 / 必要時 1.5 round 分割可 |
| (b) 緊急採決基準（3 者）成立失敗 | LOW | 9 並列 dispatch 構造で CEO+PM+Sec 必ず確保 / R29-R30 連続成立済 |
| (c) Owner directive 変更（calendar lock 復活）| LOW | DEC-068 v2 confirmed で date-free 方針 formal 化済 / Owner 直接 directive で再確認済 |

## 7. measurable success criteria

- (M-1) R31 atomic 採決完遂 = DRAFT 4th 達成（DEC-084+085+086 confirmed）
- (M-2) session 時間 ≤ 80 min（R29 上限 lock）
- (M-3) Owner 拘束 0 分維持
- (M-4) 副作用 0 / API call $0 / 絵文字 0
- (M-5) sec yml 12 file md5 1 byte 不変厳守継承（R31 完遂時 = 31 round 連続継承）
- (M-6) harness 902 PASS + openclaw-runtime 394 PASS 継承
- (M-7) DEC-019-087 起案 path 整備（R32+ default policy formal 化）

## 8. R32 PM-Y 引継ぎ事項

1. DRAFT 0 件 4th 達成後の継続維持（atomic 起案 → 1 round 採決 pattern 5th 達成 path 起案）
2. DEC-019-087 起案（atomic default policy formal 化議決）
3. pattern maturity 認定（4 度連続成立後 → knowledge INDEX patterns/ 化候補）

---

**完遂判定**: DRAFT 0 件 4th path 設計完遂 / atomic 起案 → 1 round 採決 default policy spec 起票 / R31 採決完遂時 4th 達成見込
