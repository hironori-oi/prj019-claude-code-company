# PRJ-019 Phase 1 計画 v2.2 — DEC-019-050 + DEC-019-051 反映（subscription plan 主軸 Phase 1 正式採用）

- 案件: PRJ-019「Clawbridge」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤（Owner-in-the-loop 透明 AI 組織モデル）
- 部署: PM 部門
- 作成日: 2026-05-04
- 作成者: PM Agent (claude-code-company)
- 版: **v2.2（差分上書き版）** ／ v2.1 を上書き、v2 系の WBS 構造（W0/W1〜W4）と C-A 統合は踏襲
- 入力（必読資料、本書冒頭の優先順）:
  - CEO 統合報告: `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md`（2026-05-04 発行）
  - 決裁: `projects/PRJ-019/decisions.md` line 85-86（DEC-019-050 + DEC-019-051）
  - 旧版: `projects/PRJ-019/reports/pm-phase1-plan-v2.1.md`（v2.1）
  - PM 月次予算 v2: `pm-budget-v2-30usd-api-cap.md` / `pm-budget-v2-monthly-tracker-template.md` / `pm-budget-v2-related-decisions-impact.md`
  - PM v4 マスタープラン: `pm-v4-master-plan.md`
- 確定インプット（5/4 時点 CEO 決裁・起票）:
  - **DEC-019-050**: Anthropic API key 月次 spend cap = $30/月（Hard $30 / Soft $25 / 6/1 リセット、Owner 直接決裁 2026-05-03）
  - **DEC-019-051**: subscription plan 主軸運用方針 Phase 1 正式採用（CEO 起票 2026-05-04、5/8 議決-24 で正式採択予定）

---

## §1 v2.1 → v2.2 主要変更点（300 字以内サマリ）

DEC-019-050 + DEC-019-051 を全節統合。月次予算構造を**(A) 既契約 subscription $400 + (B) 新規 API ≤$30 + (C) インフラ $0 = 総額 ≤$430/月**に再定義（追加発生上限 $300 に対し充当率 10% / 余裕率 90%）。W0-Week2（5/9-5/22）に **5 必須施策**（mock-claude 70% 化 / HITL 通知テンプレ化 / E2E staging 限定 / ナレッジ batch caching / drill #3 簡易化）を追加し、API 消費見積 $19-31 → $11-15 に圧縮。確度全帯 +2%（5/22 80→82% / 5/26 84→86% / 6/20 75→77%）。Risk Register v3→v3.1（21 件、新規 4 件 + R-019-09 緑化）。5/8 議決 13→14 件（議決-20〜24 追加）。Owner 工数 ≤週10h 維持。

---

## §2 月次予算構造（DEC-019-051 構造再定義）

### §2.1 月次総コスト 4 区分

| 区分 | v2.2 月次額 | 性格 | 備考 |
|---|---|---|---|
| **(A) 既契約 subscription** | **$400/月** | 追加発生しない（固定費） | Claude Max $200（DEC-019-006/-011）+ Codex Pro $200（DEC-019-009） |
| **(B) 新規発生 API** | **≤$30/月**（Hard cap） | 補助用途、Hard cap で物理停止 | DEC-019-050（Console 設定済 Hard $30 / Soft $25 / 6/1 リセット） |
| **(C) インフラ** | **$0/月** | 全 free / personal tier 内 | Supabase Free / Vercel Hobby / GitHub Actions Free / Slack Free / Resend Free / 1Password Personal |
| **(D) Buffer** | $0 明示計上なし | (B) 内 $2 で吸収 | §3 配分参照 |
| **総額** | **≤$430/月** | (A) $400 固定 + (B) ≤$30 変動 | 単月最大値 |

### §2.2 DEC-019-016「$300 = 追加発生上限」整合

| 項目 | 値 | 算出 |
|---|---|---|
| DEC-019-016 ハードキャップ | $300/月 | 既存決裁 |
| **v2.2 新規発生額（API のみ）** | **≤$30/月** | DEC-019-050 |
| 充当率 | **10%** | $30 / $300 |
| **余裕率** | **90%** | ($300 - $30) / $300 |
| Phase 2 拡張余地 | $270/月 | 別 DEC で増額判断時に活用 |

### §2.3 流量比（DEC-019-051）

- subscription 経路 = **95%**（subprocess spawn 経由、ループ・proposal・harness 制御本体）
- API key 経路 = **5%**（HITL 通知 / mock-claude / E2E / drill / ナレッジ batch）

### §2.4 三段階 guard 閾値（Dev 二重防御実装、本日納品済 9 deliverables）

| Tier | 閾値 | 動作 | Slack channel |
|------|---|---|---|
| `ok` | < $24 | 通常運用 | — |
| `warn` | ≥ $24（80%） | ログ + 警告通知 | `#prj019-monitor` |
| `auto_stop` | ≥ $28.5（95%） | API 呼出停止 + Owner DM | `#prj019-drill` HIGH |
| `hard_fail` | ≥ $30（Hard） | 例外 throw + 監査ログ | `#prj019-drill` HIGH |

---

## §3 W0〜W4 タイムライン（v2.1 維持 + W0-Week2 = 5 必須施策追加）

### §3.1 全体ガント（v2.1 維持、6 週間）

```
W0-Week1 (5/04-5/08): 既契約環境セットアップ + C-A 整備 + 5/8 検収会議（議決 14 件）
W0-Week2 (5/09-5/22): 【新規追加】5 必須施策完遂 + drill 1/2 + ToS 統合 + Go/NoGo 判定（5/22 → 5/18 から後ろ倒し）
W1 (5/26-5/30): ハードガード 5 項目 + Open Claw 起動（v2 維持）
W2 (6/02-6/06): 監視・隔離 5 項目 + Claude Code 統合（v2 維持）
W3 (6/09-6/13): ニーズ判定ループ + 公開ガード + ベンチ準備（v2 維持）
W4 (6/16-6/20): 副作用ゼロ証明 + ベンチ 10 連続 + Phase 2 設計（v2 維持）
```

注: DEC-019-033 / -051 の累積で Phase 1 着手日 = **5/26**、完了日 = **6/20**、公開 = **6/27 朝**を v2.2 でも維持。W0-Week2 末（**5/22**）に Phase 1 着手 Go/NoGo 判定を集中。

### §3.2 W0-Week2（2026-05-09〜2026-05-22）= **5 必須施策追加**

| 施策 # | タスク | 担当 | 期限 | 期待効果 |
|---|---|---|---|---|
| **施策-1** | mock-claude フル活用（drill #3 mock 70% 化、E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling） | Dev | **5/22** | drill #3 実 API 消費 $5-10 → $3-5 |
| **施策-2** | HITL 通知テンプレ化（事前 static text 生成、Slack DM / Email リマインド本文を固定化） | Dev | **5/9** | API 直接消費 $1-2 → $0.10 |
| **施策-3** | E2E staging 限定実行（週次 1 回 / drill 時のみ） | Dev | **5/19** | nightly E2E API 消費 $3 → $0.50 |
| **施策-4** | ナレッジ batch caching（PRJ-001〜018 抽出 1 回限り） | Dev | **5/30**（W2 末） | embeddings 重複消費 $5-10 → $1 |
| **施策-5** | drill #3 簡易化（5 シナリオ E ベクトル LLM scan を mock 100% 化） | Review | **5/16** | drill 1 回あたり $5 → $3 |
| **追加 SOP** | Anthropic Console（Hard $30 / Soft $25）+ アプリ層 cost-monitor.ts cap value の月次同期チェック SOP | Dev + PM | **5/22** | drift 検出 / R-019-20 緑化 |

**期待累積効果**: API 消費見積 **$19-31/月 → $11-15/月**（cap $30 内 buffer 50%以上）。

### §3.3 W1〜W4（v2.1 維持、変更なし）

W1-W4 のタスク粒度・配分は v2.1 §B2.5 / PM v4 §2.1 を維持。DEC-019-050 に伴う調整は W0-Week2 内で完結し、W1 開始（5/26）以降は影響なし。

---

## §4 部署別タスク（W0-Week2 改訂）

### §4.1 Dev 部門 — W0-Week2 = **5 必須施策追加 + 1 SOP**

| # | タスク | 期限 | 工数 | 依存 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 施策-1 mock-claude 70% 化（E ベクトル 50 種 + A/B/C/D TimeSource decoupling） | 5/22 | 12h | mock 基盤 | DEC-019-051 |
| 2 | 施策-2 HITL 通知テンプレ化（事前 static text、prompt caching 連動） | 5/9 | 4h | hitl-gate.ts | DEC-019-051 |
| 3 | 施策-3 E2E staging 限定実行（週次 1 回 / drill 時のみ）切替 | 5/19 | 6h | E2E 基盤 | DEC-019-051 |
| 4 | 施策-4 ナレッジ batch caching（PRJ-001〜018 抽出 1 回限り、embeddings cache） | 5/30 | 8h | KE-02 | DEC-019-051 |
| 5 | 施策-5 同 5（Review 連携） | 5/16 | 4h | drill #3 シナリオ | DEC-019-051 |
| 6 | Anthropic Console + cost-monitor.ts 同期 SOP 策定 | 5/22 | 4h | Dev 二重防御 9 deliverables | DEC-019-050 |
| 7 | 既存 W0-Week2 タスク群（v2.1 §B2.5 維持） | 各期限 | 既存 | 既存 | 既存 |

### §4.2 Review 部門 — W0-Week2 = drill #3 簡易化追加

| # | タスク | 期限 | 工数 | 依存 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | drill #3 簡易化（5 シナリオ E ベクトル LLM scan を mock 100% 化） | 5/16 | 4h | mock-claude 70% 化（Dev 施策-1） | DEC-019-051 |
| 2 | mock-claude 70% 化 acceptance criteria 起案（5/22 検収用） | 5/9 | 3h | — | DEC-019-051 / 議決-23 |
| 3 | 既存 W0-Week2 タスク群（v2.1 維持） | 各期限 | 既存 | 既存 | 既存 |

### §4.3 秘書部門 — Risk Register v3.1 反映追加

| # | タスク | 期限 | 工数 | 依存 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | Risk Register v3.1 反映（R-019-19/20/21/22 新規 + R-019-09 緑化） | **5/8 朝** | 2h | CEO §3.3 統合判断 | DEC-019-051 |
| 2 | 5/8 議題 v6 改訂（議決-20〜24 追加 + 議決時間配分再計算 = 53→90-105 分） | **5/5 朝** | 2h | CEO 統合報告 v7 | DEC-019-050 / -051 |
| 3 | DEC-019-050 / -051 の decisions.md 反映 footer 更新（v11→v12 改版） | 5/8 | 1h | — | 両決裁 |

### §4.4 Research 部門 — 5/30 NG-3 議題追加

| # | タスク | 期限 | 工数 | 依存 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 5/30 W2 終了時 NG-3 再評価議題に「subscription 主軸での実消費ベースライン」追加（DEC-019-008 暫定値再確認 議題に統合） | 5/30 | 2h | W2 実消費データ | DEC-019-051 |
| 2 | OP-1〜OP-4 残論点（v2.1 §B6）継続調査 | 5/12 | 既存 | 既存 | 既存 |

### §4.5 PM 部門 — DEC-019-051 反映 plan 起案 + 議題改訂

| # | タスク | 期限 | 工数 | 依存 | 反映決裁 |
|---|---|---|---|---|---|
| 1 | 本書（pm-phase1-plan-v2.2.md）起案 = v2.1 上書き | **5/6 朝** | 4h | CEO §8.1 即時発令 | DEC-019-051 |
| 2 | 5/8 検収会議 議事進行調整（53 min → 90-105 min） | 5/5 | 2h | 秘書 議題 v6 | 議決-20〜24 |
| 3 | W0-Week2 5 必須施策の WBS 細分化（Dev 連携） | 5/8 | 3h | Dev SP 配分 | DEC-019-051 |
| 4 | Owner 工数モニタリング（W0-Week2 max 7.35h / 週、§9 参照） | 継続 | 0.5h/週 | — | DEC-019-051 |

---

## §5 確度トラッキング（累積効果）

| マイルストン | 起点（v2.1 時点） | DEC-019-050 採択前 | **v2.2（DEC-019-051 採択後）** | 累積差分 |
|---|---|---|---|---|
| **5/22 scaffold 完全承認確度** | 78% | 80% | **82%**（+2%） | +4% |
| **5/26 Phase 1 着手 Conditional Go 達成確率** | 80% | 84% | **86%**（+2%） | +6% |
| **6/20 Phase 1 完了 sign-off 確度** | 73% | 75% | **77%**（+2%） | +4% |
| **6/27 公開遵守確度** | 70% | 73% | **75%**（+2%） | +5% |
| **Day-0 readiness** | 95% | 97% | **99%**（Owner setup 完了後） | +4% |

→ **$30 cap + subscription 主軸方針採択は Phase 1 達成確率を全帯で +2% 押上げ**。cost discipline + 物理防御 + subscription 主軸明確化が累積効果を発揮。

---

## §6 Risk Register v3.1 サマリ（21 件、新規 4 件 + R-019-09 緑化）

### §6.1 v3 → v3.1 統合差分

| 元提案 | 元 ID | 統合後 ID | 内容 | 格付 | 起票部署 |
|---|---|---|---|---|---|
| PM §9.1 + Review §5 | R-019-19（両者） | **R-019-19**（統合） | API $30 Hard cap 突破時の Phase 1 中断 | 黄 | PM + Review |
| Review §5 | R-019-20 | **R-019-20** | アプリ層 × Console 二重防御 drift | 緑 | Review |
| Review §5 + Research §6 | R-019-21 + R-019-22 | **R-019-21**（統合） | subscription quota 突破時 API fallback 急速消費 | 黄 | Review + Research |
| Research §6 | R-019-23（繰上） | **R-019-22** | mock/template 遅延で API 消費膨張 | 緑 | Research |
| Review §3 補助層追加 | R-019-09 | **R-019-09**（再評価） | NG-3 24/7 監視優先度 | **12（赤）→ 6（緑）** | Review |

### §6.2 主要新規リスク mitigation

- **R-019-19**: cost-meter 80%/95% 二段警告 / subscription only fallback 移行手順事前文書化（§9.3 参照）/ drill #3 を 5/24 までに完了し 5/29 を予備日化 / prompt caching 必須 / Buffer $5 を Dev 単独に集中させない
- **R-019-20**: Anthropic Console + cost-monitor.ts 月次同期チェック SOP（Dev W0-Week2 内策定、5/22 完遂）= 議決-23 採択前提
- **R-019-21**: subscription quota 突破時の API fallback **禁止**方針を SOP 化（HITL Gate で pause → Owner 判断 → 別途 DEC で増額判断）
- **R-019-22**: mock-claude 70% 化（Dev 施策-1）+ HITL 通知テンプレ化（Dev 施策-2）を 5/22 までに完遂 = 議決-22 / -23 採択前提

### §6.3 R-019-09 緑化根拠

DEC-019-050 cap $30 縮小により API 直接消費機能の絶対量が小さくなり、24/7 監視優先度が緩和。Review §3 第 6 補助層（cap 物理停止）追加でさらに緑化。

---

## §7 Phase 1 達成 KPI（v2.2 確定）

| KPI | 目標 | 検証方法 |
|---|---|---|
| **subscription 経路維持** | **95%** 維持（流量比） | cron 15min ロギング / EOD daily summary |
| **API 経路圧縮** | **≤$15/月**（cap $30 内 50% buffer） | Anthropic Console usage API + Supabase `cost_metrics` |
| **mock-claude 70% 化** | **完遂（5/22）** | Review acceptance criteria 合格 |
| **議決-20〜24 全採択** | **5/8 検収会議で全件 YES** | 議事録 |
| 既存 KPI（v2.1 §B4.4 維持） | ベンチ 1 件 < 60 分 / < $5 / 10 連続成功率 ≥ 80% / HITL 100% / 副作用 0 行 | 既存 |
| Phase 1 月次合計コスト | **≤$430/月**（既契約 $400 + 新規 ≤$30） | §2 月次予算構造 |

---

## §8 Phase 2 移行判断軸

### §8.1 5/30 NG-3 再評価（W2 終了時）

- DEC-019-008 NG-3 暫定値 12h/日 + API $1,000 を再確認
- **Research 部門 5/30 議題追加**: 「subscription 主軸での実消費ベースライン」（W2 実消費データに基づく）
- 判定軸: subscription quota 余裕 / API 実消費 / drill #3 結果 / Conditional Go 3 条件達成度

### §8.2 8/1 cap 増額是非（Phase 2 計画書起案時）

- Phase 2 実装規模 3 倍想定（HITL +200% / KE-04 +500% / Pen Test 自動化）
- 別途 DEC で **$30 → $50 / $100 等の増額**を Owner 決裁
- Phase 2 拡張余地 $270/月（DEC-019-016 上限内）を活用
- Phase 2 計画書起案 = 2026-08-01 想定（DEC-019-051 §関連参照）

---

## §9 Owner 工数（≤ 週 10h 維持確認）

### §9.1 W0-Week2 Owner 工数（max 7.35h / 週）

| 用途 | 工数/週 | 備考 |
|---|---|---|
| 5/8 検収会議参加 | 1.75h | 議題 14 件 / 90-105 分（議決-20〜24 含む） |
| HITL Gate 通知応答（11 種、想定 5 件/週） | 2.5h | HITL-9 / -10 / -11 集中期は +1h |
| BAN drill 1/2 立会い（5/13、5/17） | 3.0h（drill 週のみ） | 14:00-17:00 JST × 2 回 = 各 3h |
| Console / Slack 通知応答（warn/stop） | 0.10h | 通常運用は通知のみ |
| **合計（drill 週）** | **7.35h** | ≤ 週 10h の **74% 充当**（余裕 26%） |
| **合計（非 drill 週）** | **4.35h** | ≤ 週 10h の **44% 充当**（余裕 56%） |

### §9.2 W1〜W4 Owner 工数（v2.1 §B2.6 維持）

| 期 | Owner 工数 | 備考 |
|---|---|---|
| W1 | 5h | DEC-019-033 / Conditional Go 確認 |
| W2 | 3h | NG-3 再評価議題（5/30）参加 |
| W3 | 3h | 公開ガード確認 |
| W4 | 5h | Phase 2 Go/NoGo 判定 |

→ **Phase 1 全期間で ≤ 週 10h 維持確認済**。

---

## §10 v2.1 → v2.2 差分一覧（具体的箇所明示）

| # | 節 | v2.1 内容 | **v2.2 変更内容** | 根拠 |
|---|---|---|---|---|
| **10-1** | §1 | v2 → v2.1 主要変更点（オプション A 反映 + W0 + C-A 統合） | **§1 v2.1 → v2.2 主要変更点 300 字サマリに刷新**（DEC-019-050/-051 反映） | 本書 §1 |
| **10-2** | §2 月次予算 | v2.1 §B4.4 KPI に「月次合計 < $300」のみ | **§2 月次予算構造 = ≤$430/月 に再定義**（subscription $400 + API ≤$30 + インフラ $0） | DEC-019-051 |
| **10-3** | §3 タイムライン | W0-Week2 タスク群（v2.1 §B2.5）= C-A 整備中心 | **§3.2 W0-Week2 = 5 必須施策追加**（Dev 5 件 + Review 1 件 + 同期 SOP 1 件） | DEC-019-051 5 必須施策 |
| **10-4** | §3 W1-W4 | v2 §3.3 維持 | **§3.3 で維持を明示**（W1 開始 5/26 で影響なし） | 本書 §3.3 |
| **10-5** | §4.1 Dev | v2.1 §B2.2 W0 7 タスク | **§4.1 Dev W0-Week2 = 5 必須施策 + 1 SOP 追加** | DEC-019-051 |
| **10-6** | §4.2 Review | v2.1 §B2.6 W0 配分 | **§4.2 drill #3 簡易化 5/16 期限追加 + acceptance criteria 5/9 起案** | DEC-019-051 / 議決-23 |
| **10-7** | §4.3 秘書 | （v2.1 では明示なし） | **§4.3 Risk Register v3.1 反映 5/8 朝 + 議題 v6 改訂 5/5 朝 を新規明示** | CEO §8.1 |
| **10-8** | §4.4 Research | v2.1 §B6 OP-1〜OP-4 のみ | **§4.4 5/30 NG-3 議題追加（subscription 主軸 実消費ベースライン）** | DEC-019-051 / -008 |
| **10-9** | §5 確度 | v2.1 §B5 Go 条件のみ（確度数値なし） | **§5 確度トラッキング 5 マイルストン × 累積差分 table 新設** | CEO §5 |
| **10-10** | §6 Risk Register | v2.1 では Risk Register 直接言及なし | **§6 v3.1 サマリ（21 件、新規 4 件 + R-019-09 緑化）新設** | CEO §3.3 |
| **10-11** | §7 KPI | v2.1 §B4.4 KPI 6 件 | **§7 KPI 6 件に subscription 95% 維持 / API ≤$15 圧縮 / mock 70% / 議決-20〜24 全採択 を統合** | DEC-019-051 |
| **10-12** | §8 Phase 2 移行 | v2.1 §4 Phase 2/3 ロードマップ（v2 維持） | **§8 5/30 NG-3 再評価 + 8/1 cap 増額是非 の 2 軸を明示** | DEC-019-051 |
| **10-13** | §9 Owner 工数 | v2.1 §B2.6 配分のみ | **§9 W0-Week2 max 7.35h / 週確認 + 各期工数を ≤週10h 維持確認** | CEO §7.2 |
| **10-14** | §10 差分一覧 | v2.1 では §B1.1〜B1.3 で v2 → v2.1 差分のみ | **§10 v2.1 → v2.2 差分一覧 14 件を本書で明示** | 本書 |

### §10.1 v2.1 で維持する箇所（変更なし）

- v2.1 §B2.1 全体ガント（W0/W1〜W4）→ §3.1 で維持
- v2.1 §B2.3 C-A-01〜05 と G-V2 系の対応関係 → 維持（DEC-019-050 で影響なし）
- v2.1 §B2.4 ToS ホワイトリスト/ブラックリスト依存 → 維持（5/9 確定待ち）
- v2.1 §B3 PRJ-018 並走リソース配分 → 維持
- v2.1 §B4.1〜B4.3 DoD（ホワイトリスト判定パス）→ 維持
- v2.1 §B5 Phase 1 着手 Go/NoGo 28 項目（実質 26 項目）→ 維持、ただし Conditional Go 3 条件（DEC-019-051）統合
- v2.1 §B6 OP-1〜OP-4 残論点 → 維持

---

## §11 5/8 検収会議 議題（議決 14 件、議決-20〜24 新規）

### §11.1 議題総数（既存 9 + 新規 5 = 14 件）

| 順 | 議決 | 内容 | 想定 min | 起票部署 | 採択推奨 |
|---|---|---|---|---|---|
| 1-12 | 議決-7〜18 | PM v4.1 採択 / 着手日 / 完了日 等 | 43 min | 既存 | YES |
| 13 | 議決-19 | BAN drill #3 計画承認 | 5 min | PM | YES |
| **14** | **議決-20 ★新** | **PM 月次予算 v2 ($430/月) 正式採用** | **5 min** | **PM** | **YES** |
| **15** | **議決-21 ★新** | **Risk Register v3.1（R-019-19〜22 新規 + R-019-09 緑化）正式採用** | **5 min** | **Review** | **YES** |
| **16** | **議決-22 ★新** | **既存 5 reports 差分修正 正式採用** | **5 min** | **Review** | **YES** |
| **17** | **議決-23 ★新** | **mock-claude 70% 化 SOP + Anthropic Console 同期チェック SOP 正式採用** | **5 min** | **Review** | **YES** |
| **18** | **議決-24 ★新** | **DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用** | **5 min** | **CEO + Research** | **YES** |
| **計** | **18 行（議決 14 件 + Phase 1 着手判定 / scaffold 等別カウント）** | - | **約 90-105 min** | - | - |

### §11.2 議題消化想定（v2.1 比 +30〜45 分）

- v2.1: 60 min 想定
- v2.2: **90-105 min**（議決-20〜24 = 5 件 × 5 min = +25 min + 議論余裕 +20 min）

---

## §12 関連決裁・参照

### §12.1 反映決裁

- DEC-019-050: Anthropic API spend cap $30/月 確定（Owner 直接決裁 2026-05-03）
- DEC-019-051: subscription plan 主軸運用方針 Phase 1 正式採用（CEO 起票 2026-05-04）
- 既存維持: DEC-019-005〜049（v2.1 から継承）

### §12.2 参照書

- `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md`（CEO 統合報告 v7、本書の主要根拠）
- `projects/PRJ-019/reports/pm-budget-v2-30usd-api-cap.md`（月次予算 v2 = §2 根拠）
- `projects/PRJ-019/reports/pm-budget-v2-monthly-tracker-template.md`（cron 仕様 = §2.4 根拠）
- `projects/PRJ-019/reports/pm-budget-v2-related-decisions-impact.md`（DEC 整合表 = §12.1 根拠）
- `projects/PRJ-019/reports/pm-v4-master-plan.md`（PM v4 マスタープラン、W1-W4 WBS 根拠）
- `projects/PRJ-019/reports/pm-phase1-plan-v2.1.md`（旧版、本書で上書き）

---

## §13 結論

1. **DEC-019-050 + DEC-019-051 を Phase 1 計画 v2.2 に全面統合**（subscription $400 主軸 + API ≤$30 補助 = 総額 ≤$430/月）。
2. **W0-Week2（5/9-5/22）に 5 必須施策追加**で API 消費 $19-31 → $11-15 圧縮、cap $30 内 buffer 50%以上確保。
3. **確度全帯 +2% 押上げ**（5/22 80→82% / 5/26 84→86% / 6/20 75→77% / 6/27 73→75% / Day-0 95→99%）。
4. **Risk Register v3→v3.1**（21 件、新規 R-019-19/20/21/22 + R-019-09 12→6 緑化）。
5. **5/8 検収議題 13→14 件**（議決-20〜24 = 5 件新規、所要時間 60 → 90-105 min）。
6. **Owner 工数 ≤ 週 10h 維持確認**（W0-Week2 drill 週 max 7.35h / 74% 充当）。
7. **Phase 2 移行判断軸 2 軸**（5/30 NG-3 再評価 + 8/1 cap 増額是非）を明示。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| **v1** | 2026-05-02 | PM 部門 | 初版（Phase 1 計画策定、`pm-architecture-v2-and-phase1-plan.md`） |
| **v2.0** | 2026-05-02 | PM 部門 | DEC-019-005〜008 反映（Phase 1 着手承認 + アカウント分離前提） |
| **v2.1** | 2026-05-03 | PM 部門 | DEC-019-009〜013 反映（オプション A 採用 + W0 新設 + C-A-01〜05 統合 + ToS ホワイトリスト依存）`pm-phase1-plan-v2.1.md` |
| **v2.2** | **2026-05-04** | **PM 部門** | **DEC-019-050 + DEC-019-051 反映**（subscription $400 主軸 + API ≤$30 + 5 必須施策 + Risk v3.1 + 確度 +2% + 議決-20〜24 追加）本書 |

**v2.2 確定**: 2026-05-04 / **採択予定**: 2026-05-08 W0-Week1 検収会議 議決-20〜24（5 件一括 YES 採択推奨） / **次回更新**: ① 5/8 議決結果反映 ② BAN drill 1（5/13）後 ③ BAN drill 2（5/17）後 ④ Phase 1 着手 Go/NoGo 判定（5/22）後 ⑤ 5/30 NG-3 再評価後 ⑥ Phase 1 完了（6/20）後
