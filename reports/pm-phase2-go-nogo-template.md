最終更新: 2026-05-04 深夜 / 起案: PM 部門 / 実施責任: PM Agent / 版: v1（Round 8 Plan 8-Full β、Phase 2 Go/NoGo 判定テンプレ起案前倒し）

# PRJ-019 Phase 2 Go/NoGo 判定テンプレ v1 — 6/13 Phase 1 完了レビュー時運用版

- 案件: PRJ-019「Clawbridge」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門
- 作成日: 2026-05-04 深夜（Round 8 起動時、DEC-019-055 採択直後）
- 作成者: PM Agent (claude-code-company)
- 版: **v1 テンプレ**（6/13 当日運用版、当日 Owner + CEO + Review 部門 3 者で判定実施）
- 入力（必読資料、本書冒頭の優先順）:
  - 直接親: `projects/PRJ-019/reports/pm-phase2-plan-v1.md`（本書同 Round 8 β、Phase 2 plan 素案）
  - Phase 1 plan: `projects/PRJ-019/reports/pm-phase1-plan-v3.md`（Round 7 確定）
  - 決裁: `projects/PRJ-019/decisions.md` の DEC-019-007（Phase 1 強い条件付き Go = 5 条件規定）+ DEC-019-033（Owner-in-the-loop モデル）+ DEC-019-055（Round 8 + Plan 8-Full 採択）
  - W2 NG-3 再確認パターン参照: `research-5-30-ng3-decision-prep.md`（Round 6、案 B/C 議決準備パッケージ 388 行）

---

## §0 判定実施日想定

### §0.1 判定タイミング

| 項目 | 値 | 備考 |
|---|---|---|
| **判定実施日** | **2026-06-13（金）** | DEC-019-007 規定通り「Phase 1 完了レビュー時に Phase 2 Go/NoGo を判定」 |
| 判定時刻（推奨） | 18:00-19:00 JST（60 分） | Phase 1 全 W4 期間完了直後、6/20 sign-off 1 週間前 |
| 出席者 | Owner（最終決裁）+ CEO（推奨）+ Review 部門（独立評価） | §5 参照 |
| 事前資料配布期限 | 6/12 EOD（24 時間前） | §6 参照 |
| 事後アクション期限 | 6/14 朝（Go の場合 = Phase 2 W1 着手 6/24 / NoGo の場合 = 6/14 オーナー sync 緊急設定） | §7 参照 |

### §0.2 判定実施日の運用フロー（60 分）

| 時刻 | 内容 | 担当 |
|---|---|---|
| 18:00-18:05 | 開会 + 議題確認 | PM |
| 18:05-18:20 | §1 5 軸の判定資料読了（事前読了済前提、確認のみ） | 全員 |
| 18:20-18:35 | §1 5 軸ごとに数値照合 + 質疑 | Review + 全部署 |
| 18:35-18:45 | Go / Conditional / NoGo 判定討議 | Owner + CEO |
| 18:45-18:55 | 判定結果 + 即実行アクション確認 | Owner |
| 18:55-19:00 | 議事録 + decisions.md 起票指示 | 秘書 |

---

## §1 判定軸 5 つ

### §1.1 判定軸一覧

| 軸 | 名称 | 担当検証部署 | 主資料 |
|---|---|---|---|
| **(a)** | Phase 1 DoD 完遂率 | Review | DEC-019-007 5 条件チェックリスト |
| **(b)** | 月次コスト実績 | PM + Review | Anthropic Console + Supabase `cost_metrics` + §3 月次予算実績 |
| **(c)** | BAN リスク現況 | Review + Research | drill #1/#2/#3 結果 + R-019-12-A / R-019-15 状態 + ToS allowlist 整合性 |
| **(d)** | Owner 工数実績 | PM | W0-Week1〜W4 全期間 Owner 工数集計（≤ 週 10h 維持確認） |
| **(e)** | 副作用件数 | Review + Dev | verify-zero-side-effect.sh 全期間結果 + ベンチ 10 連続 + audit log SHA-256 chain |

### §1.2 5 軸の優先度

- **絶対条件（1 件でも fail → NoGo 直行）**: (a) Phase 1 DoD 完遂率 / (e) 副作用件数
- **重要条件（fail で Conditional 検討）**: (b) 月次コスト / (c) BAN リスク
- **参考条件（fail でも Owner 判断で Go 可能）**: (d) Owner 工数実績

---

## §2 各軸の Go 閾値 / Conditional 閾値 / NoGo 閾値

### §2.1 軸 (a) Phase 1 DoD 完遂率

| 区分 | 閾値 | 判定 |
|---|---|---|
| Go | DEC-019-007 5 条件全 PASS（mock 70% / 副作用ゼロ / HITL 100% / 月次 ≤$430 / ベンチ 10 連続 ≥ 80%） | Go |
| Conditional | 5 条件中 4 件 PASS + 1 件 Partial（数値未達 < 5%） | Conditional |
| NoGo | 5 条件中 1 件以上 Fail（数値未達 ≥ 5%） | NoGo |

#### 検証方法

- mock 70% 化: 議決-23 採択 mock-claude SOP の 5/22 検収結果（Pass / Conditional / Fail）+ Phase 1 W4 期間中の mock 比率実績
- 副作用ゼロ: `verify-zero-side-effect.sh` 全 W1-W4 期間 exit 0 連続率（100% 必須）
- HITL 100%: hitl-enforcer.ts log 全 11 gate 通過率（100% 必須）
- 月次 ≤$430: 5 月分（5/01-31）+ 6 月分 partial（6/01-13）の Anthropic Console + Supabase 集計
- ベンチ 10 連続 ≥ 80%: W4 期間中ベンチ run の成功率

### §2.2 軸 (b) 月次コスト実績

| 区分 | 閾値 | 判定 |
|---|---|---|
| Go | 直近 30 日コスト ≤$430 + Phase 2 cap $100 上方修正承認可能性 ≥ 80% | Go |
| Conditional | $430-$450（5% buffer 内）or Phase 2 cap 上方修正に追加議論必要 | Conditional |
| NoGo | $450 超 or Phase 2 cap 上方修正不可 | NoGo |

#### 検証方法

- 5/01-6/13（44 日間）の月次平均換算コスト
- Anthropic API 直近 30 日 spend = Hard $30 cap 内維持率
- subscription $400 据置確認（Claude Max + Codex Pro 解約なし）
- Phase 2 cap $100 上方修正 Owner 内諾確認（5/30 NG-3 議決-26 で先行承認済前提）

### §2.3 軸 (c) BAN リスク現況

| 区分 | 閾値 | 判定 |
|---|---|---|
| Go | drill #1/#2/#3 全 Pass + R-019-12-A / R-019-15 緑化 + ToS allowlist 整合性 100% | Go |
| Conditional | drill 1 件 Conditional Pass or 赤リスク 1 件残存 | Conditional |
| NoGo | drill 1 件以上 Fail or 赤リスク 2 件以上残存 | NoGo |

#### 検証方法

- drill #1 (5/13): cost cap 突破 → auto_stop → recovery 結果
- drill #2 (5/17): subscription 急速消費 → API fallback → manual halt 結果
- drill #3 (5/29): mock 70% E ベクトル LLM scan 結果
- R-019-12-A (Open Claw subprocess 副作用): G-01 spawn 副作用ゼロ実装後の状態
- R-019-15 (priviledge escalation): G-09 audit log immutability + 議決-8 赤格付け公式化後の状態
- ToS allowlist: GitHub / Hacker News / Anthropic / OpenAI / Vercel / Supabase の ToS 最新版照合

### §2.4 軸 (d) Owner 工数実績

| 区分 | 閾値 | 判定 |
|---|---|---|
| Go | Phase 1 全期間 Owner 工数 ≤ 週 10h 維持率 100% | Go |
| Conditional | 1-2 週で 10-12h 超過（drill 週など想定範囲内） | Conditional |
| NoGo | 3 週以上で 10h 超過 or 1 週で 15h 超過 | NoGo |

#### 検証方法

- W0-Week1 / W0-Week2 / W1 / W2 / W3 / W4 各週の Owner 工数実績ログ
- 5/8 検収会議（35-45 分）+ 5/22 mock 検収（2h）+ 5/30 NG-3 議決（10 分）+ 6/13 本判定（60 分）+ Phase 1 sign-off 6/20（推定 1-2h）の累積
- ≤ 週 10h × 6 週 = 60h を上限とし、累積 ≤ 60h で Go

### §2.5 軸 (e) 副作用件数

| 区分 | 閾値 | 判定 |
|---|---|---|
| Go | Phase 1 全期間（W1-W4）副作用 0 件 | Go |
| Conditional | 1 件発生 + 即時 detect + 24 時間以内 recovery | Conditional |
| NoGo | 2 件以上発生 or 1 件で 24 時間超 recovery | NoGo |

#### 検証方法

- `verify-zero-side-effect.sh` 全 run 結果（snapshot/verify モード両方）
- audit log SHA-256 chain 全期間検証（hash chain 整合性 100%）
- W4 ベンチ 10 連続 + 全期間累計 30+ 連続のうち副作用 0 件継続率

---

## §3 NoGo 判定時のリカバリ計画 — 3 シナリオ

### §3.1 シナリオ A: Phase 1 延長 1 週間（6/27 sign-off）

#### 適用条件

- 軸 (a) Phase 1 DoD 完遂率 = Conditional（4/5 PASS）
- 軸 (b) 月次コスト = Conditional（$430-$450）
- 軸 (c) BAN リスク = Conditional（drill 1 件 Conditional）
- 残り 1 週間で fail 軸を緑化可能と判断

#### 実行プラン

| 期間 | アクション | 担当 |
|---|---|---|
| 6/14 | オーナー sync で Phase 1 延長承認 | Owner + CEO |
| 6/16-20 | fail 軸の補完作業 | Dev / Review / Research |
| 6/23-27 | 補完版 W4 ベンチ + 副作用ゼロ証明 | Dev + Review |
| 6/27 | Phase 1 延長 sign-off + Phase 2 着手 7/01 にスライド | Owner + CEO + Review |
| 7/01 | Phase 2 W1 着手（1 週間遅延） | 全部署 |

#### 影響

- Phase 2 Phase 期間 5 週間 → 5 週間維持（W1-W5 全体スライド）
- Phase 3 着手 9/01 → 9/08 にスライド
- Marketing 6/27 朝公開 → 7/04 朝公開にスライド（DEC-019-052 関連調整必要）
- Owner 工数 +2-3h

### §3.2 シナリオ B: Phase 1 完了でクローズ（Phase 2 移行なし、運用継続）

#### 適用条件

- 軸 (a) Phase 1 DoD 完遂率 = Go（5/5 PASS）
- 軸 (b) 月次コスト = NoGo（$450 超 or cap 上方修正不可）
- 軸 (c) BAN リスク = NoGo（drill Fail or 赤リスク 2 件以上残存）
- Phase 2 着手リスクが Phase 1 運用維持リスクを上回る

#### 実行プラン

| 期間 | アクション | 担当 |
|---|---|---|
| 6/13 | Phase 2 着手見送り決定 + Phase 1 運用継続合意 | Owner + CEO |
| 6/14-20 | Phase 1 sign-off + 運用 SOP 確定 | PM + Review |
| 6/20 sign-off | Phase 1 完了 + 運用フェーズ移行 | Owner |
| 6/21〜 | Phase 1 単一ジャンル運用 + 月次レビュー継続 | 全部署 |
| 8/01 | Phase 2 再判定（運用 1.5 ヶ月後の再評価議決） | Owner + CEO |

#### 影響

- Phase 2 着手 7-8 週間後ろ倒し or 完全見送り
- Phase 3 着手 = 未定（Phase 2 再判定結果による）
- Marketing 6/27 朝公開は予定通り（Phase 1 完了 narrative で実施）
- 月次予算 ≤$430/月 維持 = Owner 工数 ≤ 週 10h 確実継続

### §3.3 シナリオ C: Phase 1 撤退（運用終了 + 案件クローズ）

#### 適用条件

- 軸 (a) Phase 1 DoD 完遂率 = NoGo（2 件以上 Fail）
- 軸 (e) 副作用件数 = NoGo（2 件以上発生 or recovery 失敗）
- Phase 1 完遂自体が困難 + 運用継続のリスク > 撤退コスト

#### 実行プラン

| 期間 | アクション | 担当 |
|---|---|---|
| 6/13 | Phase 1 撤退決定 + 案件クローズ準備合意 | Owner + CEO |
| 6/14 | 緊急 sync + 撤退影響評価 | 全部署 |
| 6/14-20 | Open Claw 全停止 + データ permanent delete + audit log アーカイブ | Dev + Review |
| 6/20 | Phase 1 撤退 sign-off + KPT 振り返り + ナレッジ抽出 | 全部署 |
| 6/27 | Marketing「失敗からの学び」narrative で公開判断 | Marketing + CEO |
| 6/30 | 案件 PRJ-019 公式クローズ + dashboard 移行 | PM + 秘書 |

#### 影響

- Phase 2 / Phase 3 全件キャンセル
- 月次予算 = 撤退月のみ実績計上、以降 $0
- Owner 工数 = 6/14-20 で +5-8h（撤退作業）
- ナレッジ抽出: `organization/knowledge/pitfalls/` に PRJ-019 撤退 root cause 分析を必須蓄積（DEC-019-033 ⑥ 連動）
- Marketing 影響: 6/27 朝公開予定だった portfolio + technical-deep-dive vol 1 を「実装したが運用不可と判定した実例」として再構成 or 完全 reject 判断

---

## §4 Conditional 判定時の追加条件（W2 NG-3 再確認パターン参照）

### §4.1 Conditional 判定の運用方法

軸 (b) / (c) / (d) のいずれか 1 件が Conditional 判定だった場合、5/30 W2 終了時 NG-3 再確認パターン（Research Round 6 議決準備済）と同様に、**6/13 当日に「追加条件付き Go」として正式承認** する。

### §4.2 Conditional 追加条件テンプレ

| Fail 軸 | 追加条件 | 検証期限 |
|---|---|---|
| 軸 (b) 月次コスト Conditional | Phase 2 W1-W2 期間中 weekly cost 計測 + ≤$110/週 ($430/月 換算) 維持確認 | 7/05 EOD |
| 軸 (c) BAN リスク Conditional | drill #1/#2/#3 のうち Conditional だったものの Phase 2 W1 で再実施 + Pass 必須 | 6/27 EOD |
| 軸 (d) Owner 工数 Conditional | Phase 2 W1-W2 期間中 weekly Owner 工数 ≤ 週 10h 維持確認 + 超過時即座 Phase 2 縮小 | 7/05 EOD |

### §4.3 Conditional 解除フロー

| ステップ | 内容 | 担当 |
|---|---|---|
| 1 | Conditional 判定 = 6/13 当日 Phase 2 W1 着手承認（条件付き Go） | Owner + CEO |
| 2 | 追加条件検証期限まで毎週 weekly review 実施 | PM |
| 3 | 検証期限時点で全条件 PASS → Conditional 解除 + 通常 Phase 2 運用へ | Owner + CEO |
| 4 | 検証期限時点で 1 件以上 Fail → Phase 2 W1-W2 終了時点で Phase 2 縮小 or NoGo 切替 | Owner + CEO |

### §4.4 W2 NG-3 再確認パターンとの差異

- W2 NG-3 = 5/30 案 B/C 選択議決
- 6/13 Phase 2 = Go/Conditional/NoGo 3 段階判定（より複雑）
- 共通点: 暫定値 → 実績照合 → 追加条件付き承認の運用パターンを踏襲

---

## §5 判定者

### §5.1 判定者役割

| 役割 | 責任 | 主担当 |
|---|---|---|
| **Owner（最終決裁）** | Phase 2 着手 Go/NoGo の最終 Sign-off | Owner |
| **CEO（推奨）** | 5 軸 + リカバリシナリオ提示 + 全部署統合判断 | CEO |
| **Review 部門（独立評価）** | (a) DoD 完遂率 + (c) BAN リスク + (e) 副作用件数の独立検証 | Review |

### §5.2 補助役（議事運営）

| 役割 | 責任 | 主担当 |
|---|---|---|
| 議事進行 | 60 分タイムライン管理 | PM |
| 議事録 | 判定結果 + 即実行アクション議事録化 | 秘書 |
| 数値照合 | (b) 月次コスト + (d) Owner 工数の数値検証 | PM + 秘書 |

### §5.3 判定方式

- **全 5 軸独立評価**: 各軸ごとに Go / Conditional / NoGo を独立判定
- **総合判定優先順**:
  1. 軸 (a) または (e) が NoGo → 強制 NoGo（シナリオ C 候補）
  2. 軸 (a) (e) が Go + 他軸の 1 件以上が NoGo → シナリオ A or B 候補（NoGo 軸の重さで判断）
  3. 軸 (a) (e) が Go + 他軸が Conditional 以上 → §4 Conditional 解除フロー適用 or 通常 Go
  4. 全軸 Go → 即時 Phase 2 着手承認（理想ケース）

### §5.4 Owner 不在時の代理運用

Owner 6/13 出席不可の場合は判定を **6/14 09:00 JST or 6/16 09:00 JST に再設定**（Phase 2 着手 6/24 影響なし範囲）。CEO + Review のみで仮判定 → Owner 事後承認 pattern は禁止（Phase 2 規模の判定は Owner 直接判定必須）。

---

## §6 判定資料テンプレ

### §6.1 配布物リスト（6/12 EOD 配布）

| # | 資料 | 担当 | 想定行数 | 主要内容 |
|---|---|---|---|---|
| 1 | **Dev Phase 1 完遂報告書** | Dev | 300-400 | mock 70% 化結果 / G-01〜G-12 完遂状態 / W4 ベンチ 10 連続結果 / 副作用検証結果 |
| 2 | **Research Phase 2 着手リスク評価書** | Research | 200-300 | ジャンル拡張 ToS 精査 + BAN drill 分析 + Phase 2 月次予算妥当性検証 |
| 3 | **Marketing Phase 1 公開準備状況 + Phase 2 第 2 弾草稿** | Marketing | 200-300 | 6/27 朝公開準備 100% 確認 + 7/25 朝公開向け technical-deep-dive vol 7-9 草稿 |
| 4 | **Review Phase 1 独立検証レポート** | Review | 400-500 | (a) DoD 完遂率 + (c) BAN リスク + (e) 副作用件数の独立検証結果 + Risk Register v3.X 最新版 |
| 5 | **PM 月次コスト実績 + Owner 工数実績** | PM | 100-150 | (b) + (d) の数値照合資料、本書 §1 5 軸テーブル |
| 6 | **本書 = `pm-phase2-go-nogo-template.md`** | PM | 400 行 | 判定軸 + 閾値 + シナリオ + 即実行アクション |
| 7 | **`pm-phase2-plan-v1.md` 素案** | PM | 500 行 | Phase 2 plan 素案（Go の場合の着手プラン） |
| **計** | **7 件** | — | **2,100-2,650 行** | — |

### §6.2 当日提示資料

| 順 | 資料 | 用途 |
|---|---|---|
| 1 | 5 軸 ダッシュボード（数値マトリクス、A4 1 枚） | 開会時 18:05 |
| 2 | 各軸の検証結果 detail（部署別） | 18:20-18:35 |
| 3 | 3 シナリオリカバリ計画書（NoGo 時 only） | 18:35-18:45 |
| 4 | Conditional 追加条件テンプレ（Conditional 時 only） | 同上 |
| 5 | 即実行アクションチェックリスト | 18:55 |

### §6.3 判定結果記録テンプレ

```
# Phase 2 Go/NoGo 判定結果（2026-06-13）

## 5 軸判定結果

| 軸 | 結果 | 数値根拠 | 担当検証 |
|---|---|---|---|
| (a) DoD 完遂率 | [Go/Conditional/NoGo] | [N/5 PASS] | Review |
| (b) 月次コスト | [Go/Conditional/NoGo] | [$XXX/月] | PM + Review |
| (c) BAN リスク | [Go/Conditional/NoGo] | [drill X/3 Pass] | Review + Research |
| (d) Owner 工数 | [Go/Conditional/NoGo] | [X.X h/週 max] | PM |
| (e) 副作用件数 | [Go/Conditional/NoGo] | [X 件] | Review + Dev |

## 総合判定

**[Go / Conditional / NoGo]**

## Conditional の場合の追加条件

[該当なし or §4.2 テンプレ参照]

## NoGo の場合のシナリオ

[該当なし or シナリオ A/B/C 選択]

## 即実行アクション

[§7 参照、選択シナリオごとのチェックリスト記入]

## 判定者署名

- Owner: [Sign]
- CEO: [Sign]
- Review 部門: [Sign]
- PM 部門（議事進行）: [Sign]
- 秘書部門（議事録）: [Sign]

## 関連 DEC

- DEC-019-XXX（本判定起票）
```

---

## §7 判定後の即実行アクション

### §7.1 Go の場合（Phase 2 W1 着手 6/24）

| 期限 | アクション | 担当 |
|---|---|---|
| 6/13 19:00 | 判定結果議事録 + decisions.md 起票（DEC-019-XXX = Phase 2 着手 Go） | 秘書 + CEO |
| 6/14 朝 | 全部署に Phase 2 着手通達 + W1 タスク再確認 | PM |
| 6/14-20 | Phase 1 sign-off 準備（6/20 完了レビュー資料作成） | 全部署 |
| 6/20 | Phase 1 sign-off + Phase 2 着手準備 | Owner + 全部署 |
| 6/23 | Phase 2 W1 着手前最終確認（API cap $30 → $100 切替 + 必須コントロール 50→58 議決準備） | Dev + Review + PM |
| 6/24 | **Phase 2 W1 着手** + 検収議決-P2-01〜03 開催 | 全部署 |
| 6/24-28 | Phase 2 W1 タスク実行（pm-phase2-plan-v1.md §7.1 参照） | 全部署 |

### §7.2 Conditional の場合（Phase 2 W1 着手 6/24、追加条件付き）

| 期限 | アクション | 担当 |
|---|---|---|
| 6/13 19:00 | 判定結果議事録 + decisions.md 起票（DEC-019-XXX = Phase 2 着手 Conditional Go + 追加条件 N 件） | 秘書 + CEO |
| 6/14 朝 | 追加条件検証 SOP 配布 + 担当部署アサイン | PM |
| 6/14-23 | 通常 Go と同フロー + 追加条件検証準備 | 全部署 |
| 6/24 | Phase 2 W1 着手 + 追加条件検証 weekly review 開始 | 全部署 |
| 7/05 EOD（or 各追加条件検証期限） | 追加条件検証結果評価 + Conditional 解除 or Phase 2 縮小判定 | Owner + CEO |

### §7.3 NoGo の場合（6/14 オーナー sync 緊急設定）

| 期限 | アクション | 担当 |
|---|---|---|
| 6/13 19:00 | 判定結果議事録 + 即時 Owner 緊急 sync 設定（6/14 09:00 JST） | 秘書 + CEO |
| 6/14 09:00 | 緊急 sync で 3 シナリオ（A/B/C）選択 | Owner + CEO |
| 6/14 EOD | 選択シナリオの即実行プラン公示 + 全部署アサイン | PM |
| 6/15 以降 | 選択シナリオに応じた実行プラン進行（§3.1 / §3.2 / §3.3 参照） | 全部署 |
| 6/20 sign-off | Phase 1 sign-off（シナリオ A: 延長 / B: 完了でクローズ / C: 撤退）| Owner + 全部署 |

### §7.4 即実行アクション標準チェックリスト

```
## Go の場合
- [ ] 判定結果議事録作成（6/13 19:00）
- [ ] decisions.md DEC-019-XXX 起票（6/13 EOD）
- [ ] dashboard PRJ-019 行 Phase 1 → Phase 2 移行更新（6/14 朝）
- [ ] Phase 2 W1 task assignments 配布（6/14 朝）
- [ ] API cap $30 → $100 Owner Console 変更（6/23 までに）
- [ ] 必須コントロール 50→58 議決準備（6/23 までに）
- [ ] Phase 2 W1 着手 6/24 確認（6/24 朝）
- [ ] 検収議決-P2-01〜03 開催（6/24）

## Conditional の場合
- [ ] 上記 Go の全項目
- [ ] 追加条件検証 SOP 配布（6/14 朝）
- [ ] weekly review 設定（6/24 以降毎週）
- [ ] 追加条件検証期限到来時の判定（7/05 EOD or 個別期限）

## NoGo の場合
- [ ] Owner 緊急 sync 設定（6/13 EOD までに 6/14 09:00 JST）
- [ ] 3 シナリオ（A/B/C）選択討議準備（6/13 EOD）
- [ ] 選択シナリオ即実行プラン作成（6/14 EOD）
- [ ] Phase 1 sign-off 6/20 シナリオ別運用切替（6/15 以降）
```

---

## §8 補足: 判定軸の補完情報

### §8.1 判定軸の数値根拠データソース

| 軸 | データソース | 取得タイミング | 取得手段 |
|---|---|---|---|
| (a) | mock-claude SOP 検収結果 + verify-zero-side-effect.sh + hitl-enforcer.ts log + Anthropic Console + W4 ベンチ log | 6/12 EOD | Dev + Review 共同抽出 |
| (b) | Anthropic Console usage API + Supabase `cost_metrics` | 6/12 EOD | PM + Dev 共同抽出 |
| (c) | drill #1/#2/#3 結果 + R-019 status + ToS 最新版 | 6/12 EOD | Review + Research 共同抽出 |
| (d) | Owner 工数記録（Slack 反応 timestamp + 会議出席 log） | 6/12 EOD | PM + 秘書 共同抽出 |
| (e) | verify-zero-side-effect.sh 全 run + audit log SHA-256 chain | 6/12 EOD | Review + Dev 共同抽出 |

### §8.2 判定の透明性確保

- 判定結果は decisions.md DEC-019-XXX として永続記録
- 判定根拠の数値ログは `projects/PRJ-019/reports/control-evidence/` 配下に保管
- Phase 2 plan v2 起案時に本判定結果を参照前提化
- ナレッジ抽出: 判定結果 + 根拠は `organization/knowledge/decisions/` に PRJ-019 由来として正規化蓄積（DEC-019-033 ⑥ 連動）

### §8.3 想定外パターンへの対処

| パターン | 対処 |
|---|---|
| 6/13 当日 Owner 体調不良で出席不可 | 6/14 朝 09:00 JST or 6/16 朝 09:00 JST に再設定（§5.4 参照） |
| 6/12 EOD 配布資料未着手 | 6/13 朝までに配布 + 当日 Owner 事前読了時間 1h 短縮余地あり |
| 判定軸 5 軸全て Go だが Owner マンデート不在 | Phase 2 着手見送り + 別 sync で Phase 2 着手意思確認 |
| 判定軸 5 軸全て NoGo（極端ケース） | シナリオ C 撤退 + 緊急 sync 即時実施 |

---

## §9 関連決裁・参照

### §9.1 反映決裁

- **DEC-019-007**: Phase 1 強い条件付き Go（5 条件規定 = 軸 (a) の閾値根拠）
- **DEC-019-008**: NG-3 暫定値（W2 終了時再確認パターン = §4 Conditional 解除フロー根拠）
- **DEC-019-033**: Owner-in-the-loop 透明 AI 組織モデル（§8.2 判定の透明性確保根拠）
- **DEC-019-050**: Anthropic API spend cap $30/月（軸 (b) 月次コスト閾値根拠）
- **DEC-019-051**: subscription plan 主軸方針（軸 (b) コスト構造前提）
- **DEC-019-055**: Round 8 + Plan 8-Full 採択（本書 = β 担当）

### §9.2 参照書

- 姉妹: `projects/PRJ-019/reports/pm-phase2-plan-v1.md`（本書同 Round 8 β、Phase 2 plan 素案）
- 親: `projects/PRJ-019/reports/pm-phase1-plan-v3.md`（Phase 1 v3 確定版）
- W2 NG-3 パターン参照: `projects/PRJ-019/reports/research-5-30-ng3-decision-prep.md`
- Risk Register: `secretary-risk-register-v3-1.md`（v3.X 最新版を 6/12 までに反映）
- mock-claude SOP: `review-mock-claude-70pct-sop-final.md`（Round 7 着地、5/22 検収用）

---

## §10 結論

1. **判定実施日 = 2026-06-13（金）18:00-19:00 JST（60 分）**、出席者 = Owner（最終決裁）+ CEO（推奨）+ Review 部門（独立評価）。
2. **5 軸独立評価**: (a) DoD 完遂率 / (b) 月次コスト / (c) BAN リスク / (d) Owner 工数 / (e) 副作用件数。絶対条件 = (a) (e) / 重要条件 = (b) (c) / 参考条件 = (d)。
3. **Go/Conditional/NoGo 3 段階判定**、Conditional 時は §4 追加条件付き Go フロー適用、NoGo 時は §3 シナリオ A/B/C から選択。
4. **3 シナリオリカバリ計画**: A = Phase 1 延長 1 週間（6/27 sign-off + Phase 2 7/01 着手）/ B = Phase 1 完了でクローズ（運用継続 + 8/01 再判定）/ C = Phase 1 撤退（案件 PRJ-019 公式クローズ + ナレッジ抽出）。
5. **判定資料 7 件 / 2,100-2,650 行 配布期限 6/12 EOD**、当日 5 軸ダッシュボード A4 1 枚 + detail + リカバリ計画書で運営。
6. **判定後即実行アクション**: Go = 6/24 Phase 2 W1 着手 / Conditional = 6/24 着手 + 追加条件 weekly review / NoGo = 6/14 09:00 JST 緊急 sync。
7. **判定の永続記録**: decisions.md DEC-019-XXX 起票 + 数値ログ `control-evidence/` 保管 + ナレッジ `organization/knowledge/decisions/` 蓄積。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| **v1** | **2026-05-04 深夜** | **PM 部門** | **初版（Round 8 Plan 8-Full β = Phase 2 Go/NoGo 判定テンプレ起案前倒し、§0 判定実施日 + §1 5 軸 + §2 閾値 + §3 3 シナリオ + §4 Conditional + §5 判定者 + §6 資料テンプレ + §7 即実行アクション + §8 補足 + §9 参照 + §10 結論 = 11 章構成）**（本書） |

**v1 確定**: 2026-05-04 深夜（Round 8 着地時、DEC-019-055 採択直後）/ **次回更新**: ① 6/12 EOD 各部署判定資料配布後 v1.1（資料リスト確定）② 6/13 判定実施前 v1.2（最終チェックリスト追記）③ 6/13 判定後 v2（判定結果記録 + ナレッジ抽出反映）/ **採択**: 6/13 当日運用版として 6/12 EOD までに Owner + CEO + Review に共有

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-phase2-go-nogo-template.md`
- 版: v1（2026-05-04 深夜、Round 8 起動時 / Plan 8-Full β 担当着地、姉妹資料）
- 起案: PM 部門
- 範囲: 6/13 Phase 1 完了レビュー時運用版テンプレ
- 検収: CEO（Round 8 commit 後）+ Owner（6/13 当日運用）
