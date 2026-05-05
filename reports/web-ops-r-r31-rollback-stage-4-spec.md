# Web-Ops-R R31 Rollback Stage 4 (Post-GA) Spec

**作成日**: 2026-05-06 (PRJ-019 Round 31)
**target**: GA 100% 完遂後の post-launch monitoring 期間における rollback 経路定義
**継承元**: web-ops-q-r30-rollback-stage-3-spec.md (271 行) の 4 階層 (経路 1-4 dry-run 24-72 min 収束)
**post-mortem hook**: Marketing-W post-mortem template と連動

---

## 0. Stage 4 概要

GA 100% 達成後、**24h / 7d / 30d** の 3 段階監視期間における rollback trigger と経路を定義する。Stage 1〜3 (canary 5/25/50%) は事前段階での rollback、Stage 4 は GA 完遂後の "post-launch" rollback。

| 監視期間 | trigger 厳しさ | rollback 経路選択 |
|----------|----------------|--------------------|
| 24h (immediate post-GA) | 最も厳しい | 経路 1-4 全て選択可 |
| 7d (短期 stabilization) | 中程度 | 経路 2-4 推奨 |
| 30d (中期 monitoring) | 緩やか | 経路 3-4 推奨 + post-mortem 必須 |

---

## 1. Post-GA Rollback Trigger (3 期間別)

### 1.1 24h trigger (T0+285min 〜 T0+24h)

| # | trigger | threshold | severity | action |
|---|---------|-----------|----------|--------|
| 24h-T1 | latency p95 急増 | > 200ms × 5 連続 sample | high | 経路 2 自動 |
| 24h-T2 | error rate spike | > 0.5% × 1 sample | critical | 経路 1 即時 |
| 24h-T3 | availability dip | < 99.5% × 1 sample | critical | 経路 1 即時 |
| 24h-T4 | cost burn 急増 | > 2× projected × 30 min | medium | 経路 3 + alert |
| 24h-T5 | DB integrity error | any uncategorized | critical | 経路 1 + DBA escalate |
| 24h-T6 | external API outage | partner 5xx > 10% × 5 min | high | 経路 2 graceful |
| 24h-T7 | security incident | any CVE / leak | critical | 経路 1 + Sec escalate |

### 1.2 7d trigger (T0+24h 〜 T0+7d)

| # | trigger | threshold | severity | action |
|---|---------|-----------|----------|--------|
| 7d-T1 | latency drift | p95 baseline +30% × 1h sustained | medium | 経路 3 |
| 7d-T2 | error rate drift | > 0.2% × 1h sustained | medium | 経路 3 |
| 7d-T3 | availability drift | < 99.85% × 1h | medium | 経路 3 |
| 7d-T4 | cost trend | > budget × 7d projection | low | 経路 4 (config) |
| 7d-T5 | user complaint surge | > 10× baseline | medium | 経路 3 + investigate |
| 7d-T6 | partial degradation | feature subset > 1% error | medium | 経路 4 (feature flag) |

### 1.3 30d trigger (T0+7d 〜 T0+30d)

| # | trigger | threshold | severity | action |
|---|---------|-----------|----------|--------|
| 30d-T1 | gradual latency creep | baseline +50% × 24h | low | 経路 4 + post-mortem |
| 30d-T2 | gradual error rate creep | > 0.15% × 24h | low | 経路 4 + post-mortem |
| 30d-T3 | cost overrun | actual > 1.5× budget | low | 経路 4 + budget review |
| 30d-T4 | user retention drop | -10% baseline × 7d | low | post-mortem only |

---

## 2. Rollback 経路 4 階層 (継承 R30)

| 経路 | 内容 | 収束時間 | 副作用 |
|------|------|----------|--------|
| 経路 1 | 即時全面 rollback (traffic 100% → 0%) | 24 min | DNS TTL 60s 利用、最速 |
| 経路 2 | graceful drain (canary 100% → 50% → 25% → 0%) | 48 min | 段階的、進行中 session 保護 |
| 経路 3 | partial traffic shift (100% → 25%, hold) | 36 min | 部分維持、stabilize 観測継続 |
| 経路 4 | config-only rollback (feature flag / edge config) | 12 min | traffic 維持、機能制限のみ |

---

## 3. Post-Mortem Hook 連動 (Marketing-W template)

### 3.1 hook trigger 条件

| condition | post-mortem 必須 |
|-----------|-------------------|
| 経路 1 / 2 発火 (24h 期間) | 必須 (高 severity) |
| 経路 3 / 4 発火 (24h 期間) | 必須 (med severity) |
| 7d 期間 trigger 任意発火 | 必須 |
| 30d 期間 任意 trigger | 必須 |
| GA 100% 完遂 (rollback 0 件) | 完遂 retrospective として実施 |

### 3.2 post-mortem template 構造 (Marketing-W 連動)

| section | 内容 |
|---------|------|
| Summary | trigger / severity / 経路選択 |
| Timeline | T0+? 〜 T0+? の events |
| Impact | user-facing / metric impact |
| Root Cause | 5 Whys 分析 |
| Resolution | 経路 N 選択理由 + 収束時間 |
| Action Items | 再発防止 / 改善 task 列挙 |
| Lessons Learned | knowledge 蓄積 (organization/knowledge/pitfalls/) |

---

## 4. Stage 4 抑止 / 起動制御

| 制御 | 条件 |
|------|------|
| 抑止 | GA 100% 完遂後 6h 内は trigger sensitivity を一時 strict→strict_plus 切替 |
| 起動 | 24h 経過後、normal sensitivity に戻る |
| 終端 | 30d 経過後、Stage 4 monitoring は automatic 監視に移行 |
| escalation | 経路 1 発火時は CEO 経由 Owner 即時通知 |

---

## 5. dry-run 簡易シミュレーション (簡略表記)

| 経路 | trigger 例 | dry-run 収束時間 | 副作用 |
|------|------------|---------------------|--------|
| 経路 1 | 24h-T2 (error spike) | 22 min (dry-run) | session interrupt 高 |
| 経路 2 | 24h-T1 (latency急増) | 46 min (dry-run) | session 保護 |
| 経路 3 | 7d-T1 (latency drift) | 35 min (dry-run) | 部分維持 |
| 経路 4 | 30d-T2 (creep) | 11 min (dry-run) | feature flag のみ |

---

## 6. INDEX 関連 artifact 列挙 (Stage 4 連動)

| artifact id | 種別 | location |
|-------------|------|----------|
| RB-S4-01 | 24h trigger spec | 本 file §1.1 |
| RB-S4-02 | 7d trigger spec | 本 file §1.2 |
| RB-S4-03 | 30d trigger spec | 本 file §1.3 |
| RB-S4-04 | post-mortem template hook | Marketing-W reference |
| RB-S4-05 | escalation matrix | 本 file §4 |
| RB-S4-06 | dry-run record | 本 file §5 |

---

## 7. Owner action map (Stage 4 期間)

| period | Owner action | 拘束 |
|--------|--------------|------|
| 24h (immediate post-GA) | escalation 受領のみ (trigger 発火時) | 0 分 (trigger 発火 0 件想定) |
| 7d | weekly summary review (任意) | 0 分 (trigger 発火 0 件想定) |
| 30d | monthly retrospective sign | 0 分 (post-mortem 自動集約) |

trigger 発火 0 件想定下では Owner 拘束 0 分。

---

## 8. W7-B SOP 連動 + R32 引継

- Stage 4 spec は W7-B (post-launch monitoring SOP) と連動
- R32 では W7-B を起動状態とし、Stage 4 を active monitoring として継続
- INDEX-v17 へ artifact RB-S4-01〜06 を登録予定

---

## 9. 副作用 0 / 物理 deploy 0 / $0 確認

- 本 spec は文書 / 物理 deploy 0
- canary writer + dispatcher 注入により実 API 0
- post-mortem template 連動は文書 reference のみ

---

## 10. 継承マトリクス

| 項目 | R30 (stage 3 spec) | R31 (stage 4 spec) |
|------|---------------------|---------------------|
| 経路 階層 | 4 | 4 (継承) |
| 監視期間 | canary stage 3 範囲 | post-GA 24h/7d/30d |
| trigger 数 | 3 (latency/error/availability) | 17 (24h-7 + 7d-6 + 30d-4) |
| post-mortem hook | (なし) | Marketing-W template 連動 |

---

(終端)
