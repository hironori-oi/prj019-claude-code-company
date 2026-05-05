# Dev-OO Round 23 OG src 物理化 production 段階 prep 報告

- 起票: PRJ-019 Round 23 Dev-OO
- 起票日: 2026-05-05
- 報告先: CEO（経由でオーナーへサマリー）
- 担当 task: Round 23 Dev-OO 4 task（Owner ack package / step 12 dry-run / VRT baseline dry-run / 本 summary）
- 関連: Dev-LL R22 readiness 11 step 完成 / Dev-II R21 spec 4 件 / 全 8 spec 計 2,527 行

---

## §0 Round 23 Dev-OO ミッション

Round 22 で Dev-LL が起票した readiness（GO with conditions / production NO-GO until Owner ack）を受け、**production 段階への移行 prep** を完遂する。具体的には:

1. Owner ack 取得を 5-7 min で完遂可能な package 整備
2. step 12 (= production deploy) の実機実行前 dry-run procedure 確立
3. VRT baseline 取得 procedure (R22 起票 289 行) の dry-run record 整備

→ Round 24+ で Dev 担当が「Owner ack 取得 → 即実機 deploy → 即検証」を **迷わず** 実行できる状態を担保する。

---

## §1 task ① Owner ack 取得 prep package 完遂

### 1.1 出力物

- path: `projects/COMPANY-WEBSITE/runbooks/og-src-production-owner-ack-package.md`
- 行数: **約 220 行**（target 240-300 行 範囲下限近傍、要点凝縮型）
- 構造: 5 components（概要 / 影響範囲 / 期待効果 / リスク / rollback）+ §6 Slack post テンプレ + §6.1 想定 Q&A 5 件 + §6.2 確認時間 breakdown

### 1.2 Owner 確認時間 breakdown 想定（§6.2 表より）

| 段階 | 想定時間 |
|---|---|
| §1 概要 read | 1 min |
| §2 影響範囲 + §3 期待効果 read | 2 min |
| §4 リスク + §5 rollback read | 1.5 min |
| §6.1 Q&A 確認 or 追加質問 | 1 min |
| Slack `ACK` 返信 | 0.5 min |
| **合計** | **6 min** |

→ **target 5-7 min 範囲内で完遂可能** と判定。

### 1.3 5 components 構造化判定

- §1 概要: path A → path B 物理移動、URL 不変、SNS share 影響なし を明示
- §2 影響範囲: 3 file 操作（追加 1 / 削除 1 / .gitignore 4 行）+ 他 PRJ 影響なし
- §3 期待効果: 「path A は元から build 対象外で機能してなかった」+ git tracked 化 + 6/19 launch 必須前提 を明示
- §4 リスク: 3 種事象 + 想定 downtime 5 min + recovery ETA 10 min を定量化
- §5 rollback: git revert 2 commit + redeploy で元の path A 状態（404）に復帰、HP 全体は無影響

### 1.4 Slack post テンプレ即用可能性

- §6 のテンプレは Round 22 step 11 (Vercel preview PASS) 直後に **そのまま `#prj-019-launch` に post 可能**
- $PREVIEW_URL 変数のみ実機値を埋め込めば完成
- 想定 Q&A 5 件で「path A 元から壊れていたか / 他 PRJ 影響 / 失敗時 / 緊急性 / execute タイミング」を事前カバー

### 1.5 task ① 完遂判定

- 5 components 完備 = **PASS**
- 5-7 min 確認可能 = **PASS**
- post テンプレ即用可能 = **PASS**

---

## §2 task ② step 12 production deploy dry-run procedure 完遂

### 2.1 出力物

- path: `projects/COMPANY-WEBSITE/runbooks/og-step-12-production-deploy-dryrun-procedure.md`
- 行数: **約 280 行**（target 260-330 行範囲内）
- 構造: 3 phase（pre-deploy / deploy / post-deploy verification）+ 各 phase で command + 期待 output + abort gate + rollback

### 2.2 3 phase 構造化判定

| phase | command 数 | 想定時間 | abort gate 項目数 |
|---|---|---|---|
| phase 1 pre-deploy | 6 | 5 min | 4 (gate A) |
| phase 2 deploy | 3 | 1-3 min | 4 (gate B) |
| phase 3 post-deploy verification | 5 + 1 fallback | 5-8 min | 6 (gate C) |
| **合計** | **14** | **11-16 min** | **14 項目** |

### 2.3 dry-run record の網羅性

- §2.3 / §3.3 / §4.3 で **全 phase の期待 output が dry-run record として明示**
- §2.4 / §3.4 / §4.4 で **3 gate（A/B/C）の判定基準が定量化**
- §2.5 / §3.5 / §4.5 で **3 phase 各々の rollback 経路が明示**
- §6 で複合 abort 確率 < 10% + rollback ETA 10 min 以内を集約

### 2.4 step 12 完遂後の next action 連結

- §5.2 で完遂直後の production baseline 取得 + commit + Slack 報告を構造化
- §5.3 で next phase（VRT CI 統合 / locale segment 化 / public/ whitelist）を Round 23+ / 25+ に振分

### 2.5 task ② 完遂判定

- 3 phase 構造 = **PASS**
- 14 command + 期待 output + 3 gate + rollback 完備 = **PASS**
- abort 確率 + ETA 定量化 = **PASS**

---

## §3 task ③ VRT baseline 取得 dry-run record 完遂

### 3.1 出力物

- path: `projects/COMPANY-WEBSITE/runbooks/og-visual-regression-baseline-dryrun-record.md`
- 行数: **約 220 行**（target 200-260 行範囲内）
- 構造: 8 case curl / size / dimension / sha256 想定 output + 3 回連続安定性検証想定 + 環境跨ぎ pixel diff 想定範囲

### 3.2 56 検証 dry-run 想定 PASS 率（§5.1 集約）

| 検証種別 | case 数 | 想定 PASS 数 | 想定 PASS 率 |
|---|---|---|---|
| HTTP 200 | 8 | 8 | 100% |
| dimension 1200×630 | 8 | 8 | 100% |
| size 1KB-500KB | 8 | 8 | 100% |
| 同環境 sha256 一致（3 回）| 24 | 24 | 100% |
| 環境跨ぎ pixel diff < 0.5% | 8 | 8 | 100% |
| **合計** | **56** | **56** | **100%** |

### 3.3 dry-run record の構造化要素

- §2.3 で 8 case 集約 table（filename / HTTP / size / dimension / color / sha256 placeholder）
- §3.1 / §3.2 で 3 attempt の binary diff 0 想定挙動
- §4.1 で 4 種環境跨ぎ pair の pixel diff 想定範囲（dev/preview/prod 横断）
- §6.1 で 5 種想定 FAIL シナリオ + 検出方法 + 対応を事前列挙
- §7 で実機照合 plan を構造化

### 3.4 task ③ 完遂判定

- 8 case x 7 指標の dry-run record = **PASS**
- 3 回連続安定性 + 環境跨ぎ想定 = **PASS**
- 想定 FAIL シナリオ事前列挙 = **PASS**
- 実機照合 plan = **PASS**

---

## §4 Round 23 Dev-OO 総括（4 task 集約）

### 4.1 出力 4 ファイル一覧

| # | path | 行数 | target 範囲 | 範囲内判定 |
|---|---|---|---|---|
| 1 | projects/COMPANY-WEBSITE/runbooks/og-src-production-owner-ack-package.md | 約 220 | 240-300 | やや下限超下回り（要点凝縮優先） |
| 2 | projects/COMPANY-WEBSITE/runbooks/og-step-12-production-deploy-dryrun-procedure.md | 約 280 | 260-330 | 範囲内 |
| 3 | projects/COMPANY-WEBSITE/runbooks/og-visual-regression-baseline-dryrun-record.md | 約 220 | 200-260 | 範囲内 |
| 4 | projects/PRJ-019/reports/dev-oo-r23-og-production-prep.md | 約 190 | 180-240 | 範囲内 |

注: ファイル 1 は Owner 5-7 min 確認の制約から要点凝縮を優先し target 下限近傍。質的には 5 components 全件カバー + Slack post テンプレ即用可能のため、機能要件は完備。

### 4.2 production 段階 Owner ack 取得 readiness 判定

| 判定項目 | Round 22 末 | Round 23 末 |
|---|---|---|
| design (1) | GO | GO（不変）|
| dev env (2) | GO with conditions | GO with conditions（不変）|
| staging (3) | GO with conditions | GO with conditions（不変）|
| **production (4) ack 取得 prep** | **NO-GO（package 未整備）** | **GO（package 整備完了）** |
| step 12 実機実行 readiness | spec のみ | dry-run procedure 完備 |
| VRT baseline 取得 readiness | procedure のみ | dry-run record 完備 |

→ **production 段階 Owner ack 取得 readiness は Round 23 で GO 化**。Round 22 で残されていた「Owner ack 取得 prep」の blocker 解消 + 「step 12 実機実行迷わず」+ 「VRT baseline 実機照合可能」の 3 課題を完遂。

### 4.3 Round 22 readiness §5 NO-GO 解消経路

Round 22 §5 で唯一の blocker だった「Owner formal ack 未取得」に対し、Round 23 では:

1. **ack 取得を 5-7 min で完遂可能な package 整備** → Owner 工数最小化、ack 出しやすさ最大化
2. **ack 取得後 11-16 min で deploy 完遂可能な dry-run procedure 整備** → ack 後 30 min 以内に production 反映可能
3. **deploy 直後 5-8 min で VRT verification 可能な dry-run record 整備** → deviation 即時検出可能

→ ack 取得 → deploy → verification の **end-to-end 30 - 45 min loop** が確立。Round 24 で実行可能。

---

## §5 Round 24+ 引継

### 5.1 Round 24 Dev 担当への引継

| step | 担当 | 工数 | 前提 |
|---|---|---|---|
| Owner ack 取得 | Owner（CEO 経由）| 5-7 min | task ① package を Slack post |
| step 12 phase 1-3 実機実行 | Dev | 11-16 min | ack 取得後即時 |
| VRT baseline 実機 record 起票 | Dev | 5-8 min | step 12 phase 3 と並行 |
| post-deploy 完遂報告 | Dev → CEO → Owner | 数 min | Slack `#prj-019-launch` |

### 5.2 後続 Round 引継

| Round | 引継項目 | 出典 |
|---|---|---|
| R24 | 実機実行 + actual record 起票 | 本報告 §5.1 |
| R25+ | VRT CI 統合（Playwright `toMatchSnapshot`）| task ③ §9 |
| R25+ | locale segment 化 (`/api/og/[locale]/route.tsx`) | R22 readiness §10 |
| R23+ | public/ whitelist 検討 | gitignore spec §5 |

### 5.3 6/19 launch までの critical path 残量

- Round 24: Owner ack + step 12 実機 deploy + VRT 取得 → OG image production 公開
- Round 25-30: VRT CI 統合 / locale segment 化 / public/ whitelist
- 6/12 を OG image production deploy 完遂 deadline と置けば、6/19 までに 1 週間 margin 確保

---

## §6 PASS criteria（本報告完了判定）

- task ① / ② / ③ 各々の出力物 path + 行数 + 完遂判定が §1-§3 で明示済
- §4.2 で Round 22 → Round 23 readiness 判定の遷移が表形式で示済
- §4.3 で Round 22 §5 NO-GO blocker の解消経路が明示済
- §5 で Round 24+ 引継が構造化済

---

## §7 制約遵守確認

- 既存 OG route.tsx (path A) 無改変: **OK**（dry-run record は simulation のみ、物理改変なし）
- Dev-LL R22 spec 4 件 / Dev-II R21 spec 4 件 無改変: **OK**（参照のみ、絶対 path で reference）
- 物理 migration 実行は task に含めない: **OK**（dry-run / package 整備のみ、実 deploy なし）
- API 追加コスト $0: **OK**
- 副作用 0: **OK**
- 絵文字 0: **OK**

---

EOF
