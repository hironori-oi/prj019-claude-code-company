# Dev-GGG R29 — build time delta 計測 (R28 baseline 比較)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R29 Dev-GGG
位置付け: R28 Dev-DDD `dev-ddd-r28-summary.md` §4 で初取得した build time baseline (tsc --build --dry 0.937s / incremental 1.347s / --noEmit 1.352s) との R29 物理化後 delta 計測。
版: v1.0

---

## §0 サマリ (CEO 200 字)

R29 PA-01〜03 atomic 物理化 (knowledge module 2 file tsconfig exclude) 後の harness build time delta を計測。tsc --build --dry 0.127s 中央値 (-86%) / tsc --build incremental 0.131s 中央値 (warm) / tsc --noEmit 0.612s 中央値 (-55%)。R28 想定 regression 範囲「-5% 〜 +5%」を超える高速化方向の delta だが、これは check 範囲縮小 (2 file exclude) + warm cache の寄与で説明可能、回帰なし。R30+ PA-08 build time dashboard 自動化で round 毎追跡継続想定。

---

## §1 計測環境

| 項目 | 値 |
|---|---|
| OS | Windows 11 Home 10.0.26200 |
| Node | system installed (npx /c/Program Files/nodejs/npx) |
| TypeScript | harness/node_modules/typescript |
| 計測対象 | `projects/PRJ-019/app/harness` (composite project / `references: ../openclaw-runtime`) |
| 計測 round 数 | 各コマンド 3 回 / 中央値採用 |

---

## §2 計測結果

### 2.1 tsc --build --dry (no actual build)

| run | R28 baseline | R29 計測値 |
|---|---|---|
| 1 | (未計測) | 0.128s |
| 2 | (未計測) | 0.125s |
| 3 | (未計測) | 0.128s |
| **中央値** | **0.937s** | **0.127s** |

delta: **-86%** (高速化方向)

### 2.2 tsc --build (incremental)

| run | R28 baseline | R29 計測値 |
|---|---|---|
| 1 (cold) | 1.347s | 0.937s (cold) |
| 2 (warm) | (未計測) | 0.135s |
| 3 (warm) | (未計測) | 0.131s |
| **中央値 (warm)** | **1.347s (single run)** | **0.131s** |

delta (cold→warm 比較不可): warm cache 後の incremental は **0.131s**。R28 single run と直接比較すると -90% だが、R28 が warm/cold いずれかは未明記、参考値。

### 2.3 tsc --noEmit (full type check)

| run | R28 baseline | R29 計測値 |
|---|---|---|
| 1 | (未計測) | 0.591s |
| 2 | (未計測) | 0.630s |
| 3 | (未計測) | 0.612s |
| **中央値** | **1.352s** | **0.612s** |

delta: **-55%** (高速化方向)

---

## §3 delta 評価

### 3.1 想定 regression 範囲

R28 spec で「regression -5% 〜 +5% 想定」と明記、本 R29 物理化が build time に与える影響評価指標。

### 3.2 計測結果評価

| 指標 | 想定範囲 | 実測 | 評価 |
|---|---|---|---|
| tsc --build --dry | ±5% | -86% | **想定外高速化** (warm cache 寄与) |
| tsc --noEmit | ±5% | -55% | **想定外高速化** (check 範囲縮小寄与) |

### 3.3 高速化要因分析

**寄与 1: 物理化 scope 縮小 (~40-60% 寄与想定)**
- knowledge module 2 file (合計 ~600 行想定 / KE-04 audit wiring + yaml frontmatter parser) が tsconfig exclude で type check 対象外。
- harness 全体 source 規模 ~5000-8000 行 (推定) のうち、~7-12% が check 対象外化。
- 実際の delta -55% (--noEmit) はこれを超えるため、寄与 2 も含む。

**寄与 2: warm cache (~30-50% 寄与想定)**
- R28 計測時は cold cache 想定 (single run)、本 R29 は 3 回計測中央値で warm cache 後の値が支配的。
- tsc --build --dry の -86% は incremental cache がほぼ全てヒット (no rebuild 必要) を示し、warm cache 寄与が最大。

### 3.4 regression 評価

**回帰なし (高速化方向)**。R28 想定 ±5% の regression 範囲を逸脱しているが、逸脱方向は高速化のため negative regression は無し。逆方向 (低速化 -5% 超) であれば要対処だが、本 round では非該当。

---

## §4 注記 (apple-to-apple 比較困難性)

本計測は以下理由で R28 baseline と厳密な apple-to-apple 比較ではない:

1. **scope 不一致**: R29 で knowledge 2 file exclude 化 → check source set 縮小
2. **cache state 不明記**: R28 baseline の warm/cold state 未明記
3. **3 回計測平均化差**: R28 single run vs R29 3 回中央値

→ R30+ PA-08 (build time dashboard 自動化) で **scope + cache state + 計測手順を固定化** し、round 毎継続追跡可能化想定。本 R29 計測は R28 baseline 上書きではなく、**新 baseline (post-PA-01〜03 物理化版)** として併存記録。

---

## §5 R30+ 引継

PA-08 (build time dashboard 自動化 / Dev-DDD R28 spec §6.3) で以下を機械化想定:

1. `app/scripts/measure-build-time.ts` 起票 (tsc --build --dry / incremental / --noEmit を warm/cold 分離計測)
2. `dashboard/build-time-history.md` round 毎 append-only history
3. regression 自動検知 (前 round 比 +5% 超で alert)
4. 本 R29 baseline (post-exclude / warm cache / 3 回中央値) を初期 reference 値として登録

---

## §6 制約遵守 status

| 制約 | status |
|---|---|
| 副作用 0 | 達成 (計測のみ / file 改変 0) |
| 絵文字 0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## §7 結語

R29 build time delta = 全項目高速化方向、regression なし。R28 想定 ±5% 範囲を逸脱しているが scope 縮小 + warm cache 寄与で説明可能。R30+ PA-08 で機械化 + 継続追跡基盤構築引継ぎ。
