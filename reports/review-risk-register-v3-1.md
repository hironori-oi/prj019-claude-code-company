最終更新: 2026-05-04 / 起案: Review 部門（v3 = 17 件 → v3.1 = 21 件、DEC-019-050/-051 反映）
位置付け: 5/8 W0-Week1 検収会議 議決-21 採択用 Risk Register v3.1（Review 部門起案、秘書部門統合版 `secretary-risk-register-v3-1.md` と整合）
版: v3.1（v3 = `review-risk-register-v3.md` を改訂、R-019-19/20/21/22 新規 + R-019-09 緑化）
連動 DEC: DEC-019-033 / DEC-019-031 / DEC-019-022 / DEC-019-021 / DEC-019-018 / **DEC-019-050（$30/月 API Hard cap）** / **DEC-019-051（subscription 主軸方針）**
正式版（採択用配布）: `secretary-risk-register-v3-1.md`（21 件詳細登録簿、秘書部門統合版）

---

# PRJ-019 — Risk Register v3.1（Review 起案、21 件統合版）

## §0 v3 → v3.1 主要差分（Review 起案要旨）

| 区分 | v3 | v3.1 | 根拠 |
|---|---|---|---|
| 件数 | 17 件 | **21 件**（+4） | DEC-019-050/-051 採択 + 4 部署並列発注成果統合 |
| 赤件数 | 2 件 | **2 件（不変）** | R-019-12-A / R-019-15 |
| 黄件数 | 13 件 | **14 件** | R-019-19/21 黄追加 + R-019-09 黄→緑化 |
| 緑件数 | 2 件 | **5 件**（+3） | R-019-20/22 緑追加 + R-019-09 緑化 |
| スコア再評価 | — | **R-019-09 = 12（黄）→ 6（緑）** | $30 cap + アプリ層三段階 guard + 第 6 補助層 |
| 重点監視 | 7 件 | **9 件** | R-019-19/21 週次追加 |

---

## §1 新規追加 4 件（Review 起案）

### §1.1 R-019-19: API $30 Hard cap 突破時の Phase 1 中断（黄）
- **格付**: 黄（確率 2 × 影響 5 = 10）
- **担当**: PM + Review（統合）
- **mitigation**: cost-meter 二段警告 / subscription only fallback / drill #3 5/24 まで完了
- **重点監視**: YES（週次、Phase 1 W1〜W4）

### §1.2 R-019-20: アプリ層 × Anthropic Console 二重防御 drift（緑）
- **格付**: 緑（確率 2 × 影響 3 = 6）
- **担当**: Review
- **mitigation**: 月次同期チェック SOP（議決-23）
- **重点監視**: NO（月次同期 SOP で十分）

### §1.3 R-019-21: subscription quota 突破時 API fallback 急速消費（黄）
- **格付**: 黄（確率 2 × 影響 4 = 8）
- **担当**: Review + Research（統合）
- **mitigation**: subscription only fallback 手順事前文書化 + API fallback 自動切替 disabled 設定（Owner 手動切替必須化）
- **重点監視**: YES（週次、Phase 1 W1〜W4）

### §1.4 R-019-22: mock/template 遅延で API 消費膨張（緑、元 R-019-23 繰上）
- **格付**: 緑（確率 2 × 影響 3 = 6）
- **担当**: Research
- **mitigation**: mock 70% 化 + 通知テンプレ化 5/22 完遂（議決-22/-23）
- **重点監視**: NO（Dev W0-Week2 完遂で自然解消）

---

## §2 R-019-09 緑化詳細（12→6 緑、Review §3 評価）

| 項目 | v3 | v3.1 | 変更理由 |
|---|---|---|---|
| 名称 | コスト爆発（Claude/OpenAI 月次）| コスト爆発（NG-3 24/7 監視）| 監視運用観点に絞り込み |
| 確率 | 3 | **1** | Anthropic Console Hard $30 物理停止 + アプリ層三段階 guard |
| 影響 | 4 | **6** | $30 cap 突破時の影響として再評価 |
| スコア | 12（黄）| **6（緑）** | 24/7 監視優先度緩和 |
| 緩和策 | DEC-019-012 $300/月 + G-V2-09 | **DEC-019-050 Hard $30 + アプリ層三段階 guard + subscription 主軸 95:5 + Review §3 第 6 補助層** | 二重防御 + 第 6 補助層効果 |
| 重点監視 | YES（日次）| **NO** | R-019-19 に移譲 |

### §2.1 緑化判定根拠（4 点）
1. **物理停止確立**: Anthropic Console Hard $30 = provider 側で物理停止、Owner setup 済（5/3）
2. **アプリ層二重防御**: Dev 9 deliverables 実装済（warn $24 / auto_stop $28.5 / hard_fail $30）
3. **流量主軸変更**: DEC-019-051 で subscription 95% / API 5%、cap $30 内 buffer 50% 以上
4. **第 6 補助層追加効果**: Review §3 で透明性 Dashboard + Slack 通知 + 自動 escalation 補助層追加

---

## §3 21 件サマリ

| 色 | 件数 | ID |
|---|---|---|
| **赤** | 2 | R-019-12-A（16）/ R-019-15（15）|
| **黄** | 14 | R-019-01〜07, 10, 12, 12-B, 12-C, 13, 14, 16, **19, 21** |
| **緑** | 5 | R-019-08 / R-019-11 / **R-019-09（再評価）/ R-019-20 / R-019-22** |
| **計** | **21** | — |

---

## §4 結論 + 5/8 議決-21 採択推奨

Review 部門は v3.1（21 件）採択を推奨。根拠 3 点:

1. **DEC-019-050/-051 採択に伴う新規 Risk 4 件（R-019-19/20/21/22）は cap 縮小と subscription 主軸の構造変更を網羅しており、Phase 1 期間の Risk 漏れを防止する**
2. **R-019-09 の 12→6 緑化は二重防御 + 第 6 補助層効果の確立を反映し、24/7 監視運用工数を削減する（PM Owner tracker 工数 −2.0h/週）**
3. **重点監視 7 → 9 件（+2、R-019-19/21 週次追加）で Phase 1 期間の早期警戒を強化、5/22 mock 70% 化 + 議決-21/22/23 全採択を採択条件とする（DEC-019-051 §3 整合）**

---

## §5 関連参照

- **正式版（採択用配布）**: `secretary-risk-register-v3-1.md`（21 件詳細登録簿、本書と整合確認済）
- **v3 原本**: `review-risk-register-v3.md`（17 件、本書 v3.1 で置換）
- **DEC-019-050**: `decisions.md` line 85（$30/月 API Hard cap）
- **DEC-019-051**: `decisions.md` line 86（subscription 主軸方針）
- **CEO 統合判定**: `ceo-owner-consolidated-v8.md` §3.3
- **PM 月次予算 v2**: `pm-budget-v2-30usd-api-cap.md`（R-019-19 起票根拠）
- **Review 影響評価**: `review-30usd-cap-impact-assessment.md`（R-019-19/20/21 起票根拠）
- **Research subscription 主軸**: `research-subscription-mainline-validation.md`（R-019-21/22 起票根拠）

---

**v3.1 起案**: 2026-05-04 Review 部門（DEC-019-051 反映）
**正式採択**: 2026-05-08 W0-Week1 検収会議 議決-21（Owner sign-off 予定）
**次回更新**: 5/8 議決後（採択結果反映）/ 5/22 mock 70% 化完遂後（R-019-22 closure 評価）/ 6/20 Phase 1 完了後（Phase 2 持越 Risk 評価）
