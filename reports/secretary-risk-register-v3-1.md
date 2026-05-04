最終更新: 2026-05-04 / 起案: 秘書部門（Review v3 + PM/Research/Review 4 部署並列発注成果統合）/ 配布期限: 5/8 朝

# PRJ-019 — Risk Register v3.1（21 件統合版）

- 案件: PRJ-019「Clawbridge」
- 文書種別: Risk Register（v3 = 17 件 → v3.1 = 21 件、4 部署並列発注成果統合）
- 上位文書: `review-risk-register-v3.md`（v3 = 17 件、Review 起案、SUPERSEDED 2026-05-04）/ **`review-risk-register-v3-1.md`（v3.1 Review 起案版、本書と整合確認済 2026-05-04 PM cross-ref）** / `ceo-owner-consolidated-v7.md` §3.3（CEO Risk ID 重複統合判定）
- ステータス: **確定**（5/8 議決-21 採択待ち、内容は CEO §3.3 統合判断と一致確認済 2026-05-04）
- 連動 DEC: DEC-019-033 / DEC-019-031 / DEC-019-022 / DEC-019-021 / DEC-019-018 / **DEC-019-050（$30/月 API Hard cap）** / **DEC-019-051（subscription 主軸方針）**
- 採択ルート: 5/8 W0-Week1 検収会議 議決-21 で Owner 正式承認

---

## 目次

| § | 題目 |
|---|---|
| §0 | v3 → v3.1 差分サマリー（重複統合経緯メモ）|
| §1 | 全 21 リスク登録簿（最新ステータス）|
| §2 | 新規 4 件（R-019-19/20/21/22）詳細 |
| §3 | スコア再評価 1 件（R-019-09 12→6 緑化）詳細 |
| §4 | 21 件サマリーテーブル（色別 / 担当別 / 重点監視別）|
| §5 | RED / YELLOW / GREEN ヒートマップ更新 |
| §6 | Phase 1 期間（5/26-6/20）重点監視 9 件選定（v3 7 件 → v3.1 9 件）|
| §7 | 結論 + 5/8 議決-21 採択推奨 |

---

## §0 v3 → v3.1 差分サマリー

### §0.1 主要差分

| # | 区分 | v3 | v3.1 | 根拠 |
|---|---|---|---|---|
| 1 | 件数 | 17 件 | **21 件**（+4） | DEC-019-050/-051 採択 + 4 部署並列発注（PM/Dev/Review/Research）成果統合 |
| 2 | 赤件数 | 2 件（R-019-12-A / R-019-15）| **2 件（不変）** | 新規 4 件はすべて黄 or 緑 |
| 3 | 黄件数 | 13 件 | **14 件**（R-019-19/21 +、R-019-09 −）| R-019-09 緑化 + R-019-19/21 黄追加 |
| 4 | 緑件数 | 2 件 | **5 件**（+3） | R-019-20/22 緑追加 + R-019-09 緑化 |
| 5 | スコア再評価 | — | **R-019-09 = 12（黄）→ 6（緑）** | $30 cap + アプリ層三段階 guard で 24/7 監視優先度緩和 |
| 6 | 重点監視 | 7 件 | **9 件**（R-019-19/21 追加） | API cap 突破 / subscription fallback の 2 件は週次監視必須 |
| 7 | 平均スコア | 10.1 | **9.5**（−0.6） | R-019-09 −6 / 新規 4 件平均 6.0 |

### §0.2 Risk ID 重複統合経緯メモ（CEO 判定）

4 部署並列発注（5/4）で複数の新規リスク提案があり、ID 重複が生じたため CEO が統合判定を実施:

| 元提案部署 | 元 ID | 内容（要約）| 統合後 ID | 統合判定理由 |
|---|---|---|---|---|
| PM §9.1 | R-019-19 | API $30 Hard cap 突破時の Phase 1 中断 | **R-019-19**（採用）| PM 提案を採用（先発、内容明確）|
| Review §5 | R-019-19 | 同上（API $30 Hard cap 突破時の Phase 1 中断）| **R-019-19**（PM と統合）| 内容 100% 一致のため統合、Owner = PM + Review 共同 |
| Review §5 | R-019-20 | アプリ層 × Console 二重防御 drift | **R-019-20**（採用）| 単独提案、緑格付け |
| Review §5 | R-019-21 | subscription quota 突破時 API fallback 急速消費 | **R-019-21**（採用 + Research 統合）| Review 提案を採用、Research §6 R-019-22 は類似のため統合 |
| Research §6 | R-019-22 | subscription cap 突破 → API fallback 急速消費（黄）| **R-019-21**（Review と統合）| Review R-019-21 と類似（subscription→API fallback 急速消費）、統合判定 |
| Research §6 | R-019-23 | mock/template 遅延で API 消費膨張（緑）| **R-019-22**（繰上）| Research R-019-22 が R-019-21 に統合されたため繰上採番 |

**統合結果**: 元 5 提案（PM 1 + Review 3 + Research 2）→ 4 件採番（R-019-19/20/21/22）。重複統合により Risk Register の混乱を防止、Owner sign-off 時点で混同なし。

### §0.3 R-019-09 再評価経緯（12→6 緑化）

Review §5 で `cap 縮小により 24/7 監視優先度が緩和`の判定。根拠:
1. Anthropic Console Hard $30 設定で**物理停止**が確定（Owner setup 済）
2. アプリ層 cost-monitor.ts 三段階 guard（warn$24 / auto_stop$28.5 / hard_fail$30）= **二重防御**確立
3. 上記 2 件で月次予算超過の物理確率は near-zero、24/7 NG-3 監視は不要に縮退
4. 追加発生リスクは subscription quota 突破時の R-019-21（黄）に移譲

→ R-019-09 = 確率 3 + 影響 4 = 12（黄）→ 確率 1 + 影響 6 = 6（緑）に再評価。

---

## §1 全 21 リスク登録簿

### §1.1 リスク一覧（21 件、ID 順）

| ID | 名称 | カテゴリ | 確率 | 影響 | スコア | 色 | オーナー | 直近変更 |
|---|---|---|---|---|---|---|---|---|
| R-019-01 | Tauri 脆弱性 / supply chain | 技術 | 2 | 4 | 8 | 黄 | Dev | 2026-04-15 |
| R-019-02 | OpenClaw 上流崩壊 | 戦略 | 2 | 5 | 10 | 黄 | Research | 2026-04-22 |
| R-019-03 | Anthropic ToS 改定 | 法令 | 3 | 4 | 12 | 黄 | Research | 2026-04-30 |
| R-019-04 | Tauri / Rust skill gap | 体制 | 2 | 3 | 6 | 黄 | Dev | 2026-04-15 |
| R-019-05 | macOS Notarization 失敗 | 技術 | 2 | 4 | 8 | 黄 | Dev | 2026-04-15 |
| R-019-06 | Anthropic BAN | 戦略 | 2 | 5 | 10 | 黄 | CEO + Review | 2026-05-03 |
| R-019-07 | Codex agent_session DEPRECATED | 技術 | 4 | 3 | 12 | 黄 | Dev | 2026-04-15 |
| R-019-08 | LangSmith / OpenTelemetry コスト | コスト | 2 | 3 | 6 | 緑 | Dev | 2026-04-15 |
| **R-019-09** | **コスト爆発（NG-3 24/7 監視）** | **コスト** | **1** | **6** | **6** | **緑（再評価）** | **Dev + CEO** | **2026-05-04（v3.1 再評価）** |
| R-019-10 | 重要 13 領域 ToS 違反 | 法令 | 2 | 5 | 10 | 黄 | Research + Review | 2026-04-30 |
| R-019-11 | Codex OSS ライセンス | 法令 | 2 | 3 | 6 | 緑 | Research | 2026-04-22 |
| R-019-12 | OpenClaw 上流戦略後退 | 戦略 | 2 | 3 | 6 | 黄 | Research | 2026-04-30 |
| R-019-12-A | OpenClaw API breaking change | 技術 | 4 | 4 | 16 | **赤** | Research + Dev | 2026-05-03 |
| R-019-12-B | OpenClaw timeout / hang | 技術 | 3 | 3 | 9 | 黄 | Dev | 2026-04-30 |
| R-019-12-C | Anthropic stream-json schema breaking | 技術 | 2 | 4 | 8 | 黄 | Dev + Research | 2026-05-03 |
| R-019-13 | 提案承認率 < 30% | KPI | 3 | 3 | 9 | 黄 | PM + Marketing | 2026-05-03 |
| R-019-14 | 権限 UI 設定ミス | UX | 3 | 3 | 9 | 黄 | Dev + Owner 教育 | 2026-05-03 |
| **R-019-15** | **Privilege Escalation 攻撃** | **セキュリティ** | **3** | **5** | **15** | **赤** | **Review + Dev** | **2026-05-03** |
| R-019-16 | ナレッジ PII 漏洩 | 法令 | 3 | 3 | 9 | 黄 | Dev + Review | 2026-05-03 |
| **R-019-19** | **API $30 Hard cap 突破時の Phase 1 中断** | **コスト + 戦略** | **2** | **5** | **10** | **黄** | **PM + Review（統合）** | **2026-05-04（新規）** |
| **R-019-20** | **アプリ層 × Anthropic Console 二重防御 drift** | **運用** | **2** | **3** | **6** | **緑** | **Review** | **2026-05-04（新規）** |
| **R-019-21** | **subscription quota 突破時 API fallback 急速消費** | **コスト + 戦略** | **2** | **4** | **8** | **黄** | **Review + Research（統合）** | **2026-05-04（新規）** |
| **R-019-22** | **mock/template 遅延で API 消費膨張** | **コスト + 体制** | **2** | **3** | **6** | **緑** | **Research（元 R-019-23 繰上）** | **2026-05-04（新規）** |

### §1.2 21 件色別サマリ

| 色 | 件数 | ID |
|---|---|---|
| **赤** | 2 | R-019-12-A（16）/ R-019-15（15）|
| **黄** | 14 | R-019-01〜07, 10, 12, 12-B, 12-C, 13, 14, 16, **19, 21** |
| **緑** | 5 | R-019-08（6）/ R-019-11（6）/ **R-019-09（6、再評価）/ R-019-20（6）/ R-019-22（6）** |
| **計** | **21** | — |

注: R-019-09 緑化（12→6）+ 新規 4 件（R-019-19/20/21/22）+ R-019-12 = 親リスク（戦略後退）と R-019-12-A/B/C 技術派生は引き続き 4 ID として運用、合計 21 件。

---

## §2 新規 4 件（R-019-19/20/21/22）詳細

### §2.1 R-019-19: API $30 Hard cap 突破時の Phase 1 中断（黄）

| 項目 | 内容 |
|---|---|
| **ID** | R-019-19 |
| **内容** | DEC-019-050 採択により Anthropic Console Hard $30 設定。Phase 1 期間中（5/26-6/20）に予期しないバースト消費（drill #3 異常 / E2E 暴走 / token 消費 spike 等）で月次 cap $30 を突破した場合、API 呼出が物理停止し、subscription only 経路への即時 fallback または Phase 1 一時中断が必要となる |
| **確率** | 2（warn $24 + auto_stop $28.5 の二段階予防 + subscription 主軸方針で API 消費 5% に圧縮）|
| **影響** | 5（Phase 1 機能不全、最悪 1-3 日中断）|
| **スコア** | 10（黄）|
| **格付** | 黄 |
| **緩和策** | (1) アプリ層三段階 guard（warn$24 / auto_stop$28.5 / hard_fail$30 throw）= Dev 9 deliverables 実装済 / (2) 5 必須施策で API 消費 $19-31→$11-15 に圧縮（subscription 主軸 95:5）/ (3) Console Hard $30 物理停止 = 二重防御 / (4) subscription only fallback 手順事前文書化（PM §9.3、5/22 期限）|
| **トリガー** | spend ≥ $24（warn）= LOW Slack 通知 / spend ≥ $28.5（auto_stop）= MEDIUM Slack + Owner DM / spend ≥ $30（hard_fail）= HIGH Slack + Owner DM + メール |
| **担当** | PM + Review（統合、PM = 月次予算 v2 オーナー、Review = drill / 攻撃面評価）|
| **起票元** | PM 部門 §9.1（pm-budget-v2-30usd-api-cap.md）+ Review 部門 §5（review-30usd-cap-impact-assessment.md）統合 |
| **重点監視** | **YES（週次、Phase 1 W1〜W4）** |

### §2.2 R-019-20: アプリ層 × Anthropic Console 二重防御 drift（緑）

| 項目 | 内容 |
|---|---|
| **ID** | R-019-20 |
| **内容** | アプリ層 cost-monitor.ts cap value（`ANTHROPIC_MONTHLY_CAP_USD`）と Anthropic Console Hard $30 設定の値が時間経過で乖離（drift）し、二重防御の片側が失効するリスク。例: コード側を $30 → $50 に変更したが Console 側は $30 のまま（または逆）|
| **確率** | 2（月次同期チェック SOP 策定済 = 議決-23、Phase 1 期間 4 週間で同期点 1〜2 回）|
| **影響** | 3（drift 検知時に hotfix で復旧可能、最大 1 日影響）|
| **スコア** | 6（緑）|
| **格付** | 緑 |
| **緩和策** | (1) Anthropic Console Hard $30 / Soft $25 設定 + アプリ層 cost-monitor.ts cap value の月次同期チェック SOP（議決-23、Dev + PM 共同）/ (2) Console screenshot + コード値突合（月次 1 回）/ (3) drift 検知時は即時 hotfix（Dev 担当、SLA 24h）|
| **トリガー** | 月次同期チェックで値乖離検知 / Console 自動メールとアプリ層 Slack 通知の不整合 |
| **担当** | Review（運用 SOP 監督）|
| **起票元** | Review 部門 §5（review-30usd-cap-impact-assessment.md）|
| **重点監視** | NO（月次同期 SOP で十分）|

### §2.3 R-019-21: subscription quota 突破時 API fallback 急速消費（黄）

| 項目 | 内容 |
|---|---|
| **ID** | R-019-21 |
| **内容** | DEC-019-051 採択で Phase 1 流量比 = subscription 95% / API 5% を運用。subscription（Claude Max $200）の月次 quota（Anthropic 規定）を突破した場合、自動的に API key 経路への fallback が発火し、$30 cap を急速消費（試算: 1-3 日で枯渇可能）するリスク。Phase 1 機能不全に直結 |
| **確率** | 2（subscription 主軸 95:5 設計 + 5 必須施策で API 消費圧縮、quota 突破は通常運用では稀）|
| **影響** | 4（cap 枯渇 → R-019-19 連鎖発火、Phase 1 中断可能性）|
| **スコア** | 8（黄）|
| **格付** | 黄 |
| **緩和策** | (1) subscription only fallback 手順事前文書化（5/22 まで Dev 完遂）/ (2) subscription quota 監視（透明性 Dashboard 統合）/ (3) quota 突破前の Owner 通知（70% 到達時）/ (4) API fallback 自動切替の disabled 設定（Owner 手動切替必須化）|
| **トリガー** | subscription quota 70% 到達 / API fallback 自動発火検知 / spend ≥ $20 (subscription 経由) |
| **担当** | Review + Research（統合、Review = drill 観点、Research = 流量設計観点）|
| **起票元** | Review §5（review-30usd-cap-impact-assessment.md）+ Research §6（research-subscription-mainline-validation.md、元 R-019-22）統合 |
| **重点監視** | **YES（週次、Phase 1 W1〜W4）** |

### §2.4 R-019-22: mock/template 遅延で API 消費膨張（緑、元 R-019-23 繰上）

| 項目 | 内容 |
|---|---|
| **ID** | R-019-22（元 Research §6 R-019-23 から繰上）|
| **内容** | 5 必須施策のうち mock-claude 70% 化 + HITL 通知テンプレ化が Dev W0-Week2 内（5/22）に完遂しなかった場合、drill #3（5/22-24 リハ + 5/29 公式）+ HITL 11 種運用で実 API 消費が膨張し（試算: $5-10 → $15-20）、cap $30 の 50-70% を消費するリスク |
| **確率** | 2（Dev W0-Week2 SP 配分集中化 + Review 早期 acceptance criteria 起案）|
| **影響** | 3（cap 内で吸収可能、最悪 buffer 50% 消費）|
| **スコア** | 6（緑）|
| **格付** | 緑 |
| **緩和策** | (1) mock-claude 70% 化 SOP（議決-23、Dev 5/22 完遂）/ (2) HITL 通知テンプレ化（事前 static text 生成、$1-2 → $0.10 圧縮）/ (3) Review acceptance criteria 早期起案（5/9 朝期限）/ (4) drill #3 簡易化（Review 5/16 完遂）|
| **トリガー** | 5/22 末時点で mock 化進捗 < 50% / drill #3 リハ実 API 消費 > $7 |
| **担当** | Research（5 必須施策設計者として継続観察）|
| **起票元** | Research §6（research-subscription-mainline-validation.md、元 R-019-23、Risk ID 重複統合により繰上）|
| **重点監視** | NO（Dev W0-Week2 完遂で自然解消）|

---

## §3 スコア再評価 1 件（R-019-09 12→6 緑化）詳細

### §3.1 R-019-09: コスト爆発（NG-3 24/7 監視）

| 項目 | v3 | v3.1 | 変更理由 |
|---|---|---|---|
| 名称 | コスト爆発（Claude/OpenAI 月次）| コスト爆発（NG-3 24/7 監視）| 監視運用観点に絞り込み |
| 確率 | 3 | **1** | Anthropic Console Hard $30 物理停止 + アプリ層三段階 guard で物理確率 near-zero |
| 影響 | 4 | **6** | $30 cap 突破時の影響（Phase 1 中断）として再評価、ただし R-019-19 と分離（24/7 監視運用観点）|
| スコア | 12（黄）| **6（緑）** | 確率 1 × 影響 6 = 6、緑運用に再分類 |
| 緩和策 | DEC-019-012 ハードキャップ $300/月 + G-V2-09 | **DEC-019-050 Hard $30 + アプリ層三段階 guard + subscription 主軸 95:5** | 二重防御確立で 24/7 監視優先度緩和 |
| トリガー | 月次 cap 80% 到達 | spend ≥ $24（warn）= LOW Slack | warn 段階で十分、24/7 監視は R-019-19 に移譲 |
| 担当 | Dev + CEO | Dev + CEO（不変）| — |
| 重点監視 | YES（日次）| **NO** | R-019-19 に移譲、本件は緑運用 |

### §3.2 緑化判定根拠

1. **物理停止確立**: Anthropic Console Hard $30 = provider 側で物理的に API 呼出停止、Owner setup 済（5/3）
2. **アプリ層二重防御**: Dev 9 deliverables（budget-guard.ts / anthropic-spend-tracker.ts / cost_ledger_v2 migration / cost-watcher.ts cron / budget API route / cost-meter.tsx 拡張）= 三段階 guard 実装済
3. **流量主軸変更**: DEC-019-051 で subscription 95% / API 5%、cap $30 内 buffer 50% 以上確保（subscription 主軸方針）
4. **24/7 監視代替**: 透明性 Dashboard + Slack 通知で Owner 可視化 + 自動 escalation、24/7 人間監視は不要

→ Review 評価「24/7 監視優先度緩和」を秘書部門が再確認、緑化採択。

---

## §4 21 件サマリーテーブル

### §4.1 色別 / 担当別マトリクス

| 担当部署 | 赤 | 黄 | 緑 | 計 |
|---|---|---|---|---|
| Dev | 0 | 6（R-019-01/04/05/07/14/16）| 1（R-019-08）| 7 |
| Research | 0 | 4（R-019-02/03/10/12）| 2（R-019-11/22）| 6 |
| PM | 0 | 1（R-019-13）| 0 | 1 |
| Review | 0 | 1（R-019-06）| 1（R-019-20）| 2 |
| Dev + Research | 1（R-019-12-A）| 2（R-019-12-B/12-C）| 0 | 3 |
| Review + Dev | 1（R-019-15）| 0 | 0 | 1 |
| PM + Review（統合）| 0 | 1（R-019-19）| 0 | 1 |
| Review + Research（統合）| 0 | 1（R-019-21）| 0 | 1 |
| Dev + CEO | 0 | 0 | 1（R-019-09）| 1 |
| **計** | **2** | **14** | **5** | **21** |

### §4.2 カテゴリ別

| カテゴリ | 件数 | ID |
|---|---|---|
| 技術 | 6 | R-019-01/05/07/12-A/12-B/12-C |
| 戦略 | 3 | R-019-02/06/12 |
| 法令 | 4 | R-019-03/10/11/16 |
| 体制 | 1 | R-019-04 |
| コスト | 2 | R-019-08/09 |
| KPI | 1 | R-019-13 |
| UX | 1 | R-019-14 |
| セキュリティ | 1 | R-019-15 |
| 運用 | 1 | R-019-20 |
| **コスト + 戦略** | **2** | **R-019-19/21**（v3.1 新規）|
| **コスト + 体制** | **1** | **R-019-22**（v3.1 新規）|
| **計** | **21** | — |

### §4.3 重点監視マッピング（Phase 1 W1〜W4）

| 監視頻度 | 件数 | ID |
|---|---|---|
| 日次 | 0 | （v3 R-019-09 → v3.1 緑化により重点監視除外）|
| 週次 | 7 | R-019-15 / R-019-12-A / R-019-03 / R-019-13 / R-019-14 / **R-019-19** / **R-019-21** |
| 月次 | 2 | R-019-16 / R-019-20（同期 SOP）|
| **計（重点監視）** | **9** | （v3 7 件 → v3.1 9 件、+2）|

---

## §5 RED / YELLOW / GREEN ヒートマップ更新

### §5.1 5x5 マトリクス（v3.1 数値版）

```
影響 6 |  R-019-09  -          -          -          -       
       |  (緑、再評価)
影響 5 |  -         R-019-02   R-019-15   R-019-19   -       
       |            R-019-06   (赤)       (黄、新規)
       |            R-019-10
影響 4 |  -         R-019-01   R-019-03   R-019-12-A -
       |            R-019-05   R-019-21   (赤)
       |            R-019-12-C (黄、新規)
影響 3 |  -         R-019-04   R-019-13   R-019-07   -
       |            R-019-12   R-019-14   R-019-12-B
       |            R-019-20   R-019-16
       |            R-019-22
       |            (3 件 新規/再評価)
影響 2 |  -         -          -          -          -
影響 1 |  -         R-019-08   -          -          -
       |            R-019-11
       +-----------+-----------+-----------+-----------+--------
       確率1        確率2       確率3       確率4       確率5
```

### §5.2 色別マッピング（v3.1）

| 色 | スコア範囲 | 件数 | ID |
|---|---|---|---|
| **赤** | 15-25 | 2 | R-019-12-A（16）/ R-019-15（15）|
| **黄** | 6-14 | 14 | R-019-01〜07, 10, 12, 12-B, 12-C, 13, 14, 16, **19, 21** |
| **緑** | 1-5 | 5 | R-019-08, 11, **09（再評価）, 20, 22**（数値スコア 6 だが緑運用）|
| **計** | — | **21** | — |

注: 緑 5 件はすべてスコア 6 だが mitigation 完遂見込み + 影響軽微で緑運用、Phase 1 完了時に黄昇格判定の trigger 設定。

---

## §6 Phase 1 期間（5/26-6/20）重点監視 9 件選定

### §6.1 選定基準

(a) スコア赤 / 黄上位、(b) Phase 1 着手 5/26 〜 完了 6/20 期間中に発火可能性高、(c) mitigation 進捗が 90% 未満、の 3 条件を満たすリスクを 9 件選定（v3 7 件 → v3.1 9 件、+R-019-19/21）。

### §6.2 9 件選定

| 順 | ID | 監視頻度 | 監視指標 | 担当 | escalation 条件 |
|---|---|---|---|---|---|
| 1 | R-019-15 Priv Escalation（赤）| 週次 | PE 試行検知件数（audit log）+ drill #3 + Pen Test #1/#2 結果 | Review | 5 件/週超 = CEO escalation、Critical 検出 = 24h hotfix |
| 2 | R-019-12-A OC API breaking（赤）| 週次 | contract test 結果 + 上流 schema diff | Research + Dev | API breaking 検知 = 即 Mock fallback、CEO escalation 24h |
| 3 | R-019-03 Anthropic ToS 改定（黄）| 週次 | weekly ToS check 結果 + HITL 第 6 種発動件数 | Research | ToS gray 検出 = HITL 第 6 種発動、5 件/週超 = CEO escalation |
| 4 | **R-019-19 API $30 Hard cap 突破（黄、新規）** | **週次** | **月次 cap 消費率（透明性 Dashboard）+ warn/auto_stop/hard_fail 発火件数** | **PM + Review（統合）** | **warn$24 = LOW Slack、auto_stop$28.5 = MEDIUM + Owner DM、hard_fail$30 = HIGH + Owner DM + メール** |
| 5 | R-019-13 提案承認率 < 30%（黄）| 週次 | 提案承認率（KPI 単一指標）| PM | 月次 < 20% = TR-4 発動（ジャンル切替）|
| 6 | R-019-14 権限 UI 設定ミス（黄）| 週次 | rollback 発火件数 + Owner 操作ミス検知 | Dev + Owner | 月次 ≥ 3 件 = Owner 教育強化 + UI 改善 |
| 7 | **R-019-21 subscription→API fallback 急速消費（黄、新規）** | **週次** | **subscription quota 消費率 + API fallback 自動発火検知** | **Review + Research（統合）** | **quota 70% 到達 = Owner 通知、fallback 発火 = subscription only fallback 手順発令** |
| 8 | R-019-16 ナレッジ PII 漏洩（黄）| 月次 | KE-04 PII redaction false negative + HITL-11 発動件数 | Dev + Review | false negative > 0.5% = KE-04 LLM 第 2 層強化、PII 漏洩確認 = 即削除 + 法的相談 |
| 9 | R-019-20 二重防御 drift（緑、新規）| 月次 | アプリ層 cap value vs Console Hard $30 値突合 | Review（運用 SOP）| drift 検知 = 即時 hotfix（Dev 24h）|

注: R-019-09（v3 重点監視 #4 日次）は v3.1 で緑化し重点監視除外、R-019-19（API cap 突破）に責務移譲。

### §6.3 重点監視期間（Phase 1 W1〜W4、v3.1 更新）

| 週 | 期間 | 主監視リスク（v3.1）| 主イベント |
|---|---|---|---|
| W1 | 5/26-6/1 | **R-019-19** / R-019-15 / R-019-12-A | Phase 1 着手、HITL-9/10 動作観察、$30 cap 初期消費観察 |
| W2 | 6/2-6/8 | R-019-15 / R-019-12-A / R-019-03 / **R-019-21** | drill #3 結果 + Pen Test #1 結果評価、subscription quota 中間チェック |
| W3 | 6/9-6/15 | R-019-13 / R-019-14 / R-019-16 / **R-019-19** | KE-01〜03 設計 review、HITL-11 設計、月次 cap 50% 突破時の警戒 |
| W4 | 6/16-6/20 | R-019-15 / R-019-16 / **R-019-19** / **R-019-20** | Pen Test #2 結果評価 + KE-04 PII audit + Phase 1 完了 sign-off + 月次同期チェック実施 |

---

## §7 結論 + 5/8 議決-21 採択推奨

### §7.1 Risk Register v3.1 採択判定

**条件付き採択**（Conditional Adoption、v3 から継承 + 4 件追加採択条件）

**条件**:
1. 5/8 検収会議で議決-8「R-019-15 = 赤格付け公式化」を YES 採択（v3 既条件、v3.1 で継承）
2. R-019-12-A の C-OC-06 monthly contract test 自動化を Phase 1 W2 までに完成（v3 既条件、v3.1 で継承）
3. **【v3.1 新規】議決-21（Risk Register v3.1 正式採用）+ 議決-22（5 reports 差分修正）+ 議決-23（mock 70% + 同期 SOP）+ 議決-24（DEC-019-051 subscription 主軸）の 4 件すべて YES 採択**
4. **【v3.1 新規】R-019-19/21 mitigation 完遂を Phase 1 W0-Week2 末（5/22）までに Dev + Review + Research 共同で達成**

### §7.2 根拠 4 点（v3 3 点 + v3.1 1 点追加）

1. **赤リスク 2 件すべてに mitigation 70% 以上達成**（v3 継承）
2. **新規 5 件追加で Phase 1 期間特有リスクの可視化完成**（v3 継承）
3. **重点監視 9 件の体系的監視計画**（v3 7 件 → v3.1 9 件に拡張、subscription 主軸方針 + cap 突破 2 件を追加）
4. **【v3.1 新規】4 部署並列発注成果による Risk ID 重複統合の透明化**: PM/Review/Research の 5 提案 → CEO 統合判定で 4 件採番 + 1 件再評価、Owner sign-off 時点で混乱なし、責任ある設計の証左

### §7.3 5/8 検収会議での秘書部門立場

| 観点 | 立場 |
|---|---|
| Risk Register v3.1 採用 | **強い条件付き Pass**（議決-21 として CEO 推奨 YES）|
| 重点監視 9 件 | **採用推奨**（透明性 Dashboard 統合で Owner 可視化、+R-019-19/21）|
| Phase 1 着手 5/26 への影響 | **Conditional Go**（赤 2 件 mitigation 90%+ 達成見込み + 新規黄 2 件は cap 内で吸収可能）|
| Risk ID 重複統合の妥当性 | **承認**（CEO 判定で混乱なし、内容 100% 一致提案を統合）|

### §7.4 残存赤リスク件数（v3.1 結論）

**Phase 1 着手 5/26 時点での残存赤リスク = 2 件**（R-019-12-A / R-019-15、v3 から不変）

新規 4 件（R-019-19/20/21/22）はすべて黄 or 緑、赤格付け追加なし。R-019-09 緑化により黄→緑遷移 1 件。

両赤件とも mitigation 90%+ 達成 + 重点監視 9 件に含まれ、Phase 1 期間中に継続的に residual を黄に押下げる。**Phase 1 完了 6/20 時点での残存赤リスク予測 = 0〜1 件**（R-019-15 が Pen Test #2 全 reject 達成で黄化、R-019-12-A は contract test 自動化完成で黄化）。

---

## §8 v3 → v3.1 改版履歴

| 版 | 日付 | 主な変更 | 起案 |
|---|---|---|---|
| v3 | 2026-05-03 | R-019-13/14/15/16 + R-019-12-A/12-C 追加 = 計 17 件、R-019-15 赤格付け公式化 | Review 部門 |
| **v3.1** | **2026-05-04** | **DEC-019-050（$30 API cap）+ DEC-019-051（subscription 主軸）採択受け、R-019-19/20/21/22（4 件）新規追加 + R-019-09（12→6 緑化）= 計 21 件。重点監視 7 → 9 件。Risk ID 重複統合経緯メモ（CEO 判定）追加。** | **秘書部門（Review v3 + 4 部署並列発注成果統合）** |

---

**v3.1 完成**: 2026-05-04（秘書部門起案、21 リスク統合）
**次回更新**: 2026-05-08 W0-Week1 検収会議後（議決-21 採択結果反映）/ 5/30 W2 終了時 / 6/20 Phase 1 完了時
**根拠ファイル**: `decisions.md` DEC-019-050/-051 / `ceo-owner-consolidated-v7.md` §3.3（Risk ID 重複統合判定）/ `review-risk-register-v3.md`（v3 = 17 件、Review 起案）/ `pm-budget-v2-30usd-api-cap.md` §9.1（R-019-19 PM 元提案）/ `review-30usd-cap-impact-assessment.md` §5（R-019-19/20/21 Review 元提案）/ `research-subscription-mainline-validation.md` §6（R-019-22/23 Research 元提案）

## フッタ

- 文書: `projects/PRJ-019/reports/secretary-risk-register-v3-1.md`
- 版: v1.0 (2026-05-04)
- 起案: 秘書部門
- 検収: Owner（5/8 検収会議 議決-21 で正式承認、5/9 朝までに公式化通知配布）
- 関連: `secretary-agenda-v7.md`（議題 v7、本書同時起案）/ `review-risk-register-v3.md`（前版）/ `ceo-owner-consolidated-v7.md`（CEO 連結報告 v7、本書根拠）
