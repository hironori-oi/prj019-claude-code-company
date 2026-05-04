# Sec SOP — API spike 検知自動化（DEC-019-066 §3.1 連動）

**起案**: Sec-M / Round 18 / 2026-05-05 / **対象 script**: `projects/PRJ-019/scripts/sec-api-spike-check.sh` + `sec-api-spike-baseline.json`
**目的**: ローカル audit log から Anthropic spend trajectory を解析し、1h 窓スパイク / 月次 cap への到達速度逸脱 を機械検出。spend cap (Anthropic ≤$30/月 / monthly ≤$430) の早期警報 gate を確立する。

---

## §1 適用範囲
- 入力: `projects/PRJ-019/settings/anthropic-audit.jsonl`（1 行 = 1 API call、`{ts, cost_usd, kind}` 必須）
- cap 定義: `projects/PRJ-019/settings/cost-cap.json` の `anthropic_monthly_cap_usd`（既定 30）
- 全 Round 完遂時 + 日次 cron（dispatch 外時間帯）の double-gate

## §2 実行手順
```bash
bash projects/PRJ-019/scripts/sec-api-spike-check.sh
```
- exit 0 = PASS / exit 1 = WARN / exit 2 = FAIL
- 出力: `reports/_sec-automation/api-spike-<UTCstamp>.log`
- audit log 不在時は PASS（system pre-launch 扱い）

## §3 閾値（baseline.json、Owner tune 可）
| 種別 | warn | fail | 備考 |
|---|---|---|---|
| 1h 窓累積 spend | > $5 | > $10 | placeholder。実 spend 観測後に再調整 |
| 月次 trajectory | spend / (cap × elapsed) > 200% | — | linear projection。月初の少量出費でも発火しやすい点に注意 |
| cooldown | 1800 秒（30 分） | — | 同一 alert 連続発火を抑制 |

## §4 PII 保護（DEC-019-066 §3.1 / HITL 第 11 種連動）
- prompt body / messages 配列は **一切読まない**
- `kind` ラベルのみ使用、SHA-256 先頭 8 桁に hash 化して log 出力（top 5 のみ）
- audit log 自体の生成側で PII を含めない契約を Dev 部門と握る（5/26 review 議題）

## §5 cooldown 仕様
- `_state/api-spike-cooldown.state` に最終 alert 時刻 (epoch) を保存
- 次回起動時 `now - last_alert < cooldown_sec` なら alert 抑制 + RESULT は PASS 扱い（log には COOLDOWN 痕跡を残す）
- cooldown 内も内部判定は実施し、状態は log に追跡可能

## §6 FAIL 時対応
1. CEO 通知 → 直近 1h の dispatch を一時停止（HITL 第 8 種 `cost_cap_breach` 起票）
2. kind hash top 5 から原因 dispatch を Dev 部門に問合せ
3. 必要なら Anthropic API 呼出を rate-limit (`ANTHROPIC_RPM` 環境変数) で絞る
4. recover 後に COOLDOWN reset + 次 round 開始

## §7 CI integration（GitHub Actions 例）
```yaml
- name: Sec / API spike gate
  run: bash projects/PRJ-019/scripts/sec-api-spike-check.sh
```

## §8 5/26 review 連携
- 集計: WARN / FAIL 件数、cooldown 抑制回数、false positive 推定
- 目標: FAIL 0 件、WARN < 3 件 / week、kind hash top 5 安定
- 閾値 tune 履歴を baseline.json `updated_at` で追跡
