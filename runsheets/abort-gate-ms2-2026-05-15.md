# PRJ-019 — 5/15 MS-2 trial abort gate runsheet（Sec-I 運営代行 / Owner 拘束 0 分）

最終更新: 2026-05-05 / 起案: Review 部門 R16 Review-H
位置付け: 5/15 MS-2 trial（Sec-I 運営代行、Owner 拘束 0 分）の **abort 条件・手順・rollback・notification** を物理化した operator 即時実行用 runsheet。5/12 W2 trial mid-check（Review-G 担当）で FAIL 判定または当日 5/15 進行中の異常検出時に起動。
版: v1.0 read-only（runsheet 自体は static、実行時に check-off のみ）
連動: DEC-019-055 / DEC-019-062 / `review-h-r16-w2-mid-check-plan.md` / `web-ops-r15-c-series-continuation.md`（取り下げ Runbook）

---

## §0 起動条件

下記いずれか 1 件で本 runsheet 起動:

1. 5/12 W2 trial mid-check で 8/10 以下 PASS（review-h-r16-w2-mid-check-plan.md §2.1）
2. 5/12 W2 trial mid-check で critical FAIL 1 件以上（S-1 / S-2 / R-2 5+ 件）
3. 5/15 MS-2 trial 当日（09:00-17:00 JST）に下記 §1 abort 条件 5 種いずれか発動

---

## §1 abort 条件 5 件（数値化）

| ID | 条件名 | 検出閾値 | 検出方法 | 自動 / 手動 |
|---|---|---|---|---|
| AB-1 | API spike | 1 分間で req/s が trial baseline の 5× 超過 | staging-ms2 metrics dashboard 1m window | 自動（Slack alert） |
| AB-2 | error rate | 5xx error rate が連続 5 分間 ≥ 2.0% | staging-ms2 error log 5m window | 自動（Slack alert） |
| AB-3 | latency | API p95 latency が連続 10 分間 ≥ 1500ms | staging-ms2 APM dashboard 10m window | 自動（Slack alert） |
| AB-4 | cost | 1h 累計 API cost が ≥ $3.00（trial 1 日 $5 budget の 60%） | budget guard cron 1h aggregate | 自動（cron alert） |
| AB-5 | manual | Sec-I 判断で異常検出（PII leak 疑い等） | Sec-I 観測 + CEO 1m 内合意 | 手動（Slack post） |

---

## §2 abort 手順（番号付き、所要時間付き）

5/15 当日、AB-1〜AB-5 いずれか発動時、Sec-I が以下 SOP を **5 分以内完遂**:

| 手順 | 所要 | アクション | コマンド / 操作 |
|---|---|---|---|
| 1 | 30s | abort 検出 + Slack `#clawbridge-alerts` post | `ABORT_GATE_TRIGGERED reason=AB-N detected_at=<UTC>` |
| 2 | 30s | trial 停止フラグ立て（環境変数） | `staging-ms2` 環境で `MS2_TRIAL_ENABLED=false` set + redeploy trigger |
| 3 | 60s | 進行中 request の graceful drain | API gateway で `503 ServiceUnavailable + Retry-After: 3600` |
| 4 | 60s | budget guard 強制停止 | `pnpm budget-guard --force-stop --reason=ms2-abort-AB-N` |
| 5 | 60s | rollback 起動（§3 連動） | `pnpm ms2:rollback --target=pre-trial-snapshot` |
| 6 | 30s | abort 状態の確認（health check） | `curl https://staging-ms2.local/healthz \| jq .status` 期待 `"draining"` |
| 7 | 30s | Slack `#clawbridge-alerts` 完遂 post | `ABORT_GATE_COMPLETED status=rolled-back duration=<ms>` |

合計所要: 4 分 30 秒（< 5 分制約 OK）

---

## §3 rollback procedure

### §3.1 rollback 対象

| 対象 | 内容 | 復旧先 |
|---|---|---|
| application | staging-ms2 deployment | 5/14 EOD pre-trial snapshot tag (`ms2-pre-trial-2026-05-14`) |
| database | trial 期間中の write 反映分 | snapshot 時点に restore（read-only data のみなら no-op） |
| feature flag | MS2 trial 関連 4 flags | 全て `false` に reset |
| secrets | trial 専用 token | 失効 + 再発行（DEC-019-024 1Password 連動） |

### §3.2 rollback コマンド sequence

```bash
git tag -l "ms2-pre-trial-*" | tail -1                                  # ① snapshot tag 確認 (期待: ms2-pre-trial-2026-05-14)
pnpm vercel rollback --target ms2-pre-trial-2026-05-14 --env staging-ms2 # ② deployment rollback
pnpm flags:reset --env staging-ms2 --pattern "ms2_*"                    # ③ feature flag reset
pnpm secrets:revoke --env staging-ms2 --tag ms2-trial                   # ④ secrets 失効
curl -fsS https://staging-ms2.local/healthz | jq .status                # ⑤ health verify (期待: "ok" or "draining")
```

### §3.3 rollback 完遂判定

| check | PASS 基準 |
|---|---|
| application バージョン | `ms2-pre-trial-2026-05-14` tag に一致 |
| feature flag | `ms2_*` 全 4 flag が `false` |
| API healthz | HTTP 200 + status `ok` |
| budget guard | `--force-stop` 状態維持 |

4/4 PASS で rollback 完遂、Sec-I → CEO 引継 OK。

---

## §4 notification flow（SLACK_WEBHOOK_URL 経由）

### §4.1 通知チャンネル

| チャンネル | 用途 | post 主体 |
|---|---|---|
| `#clawbridge-alerts` | abort 検出 + 完遂状態 | Sec-I（自動 + 手動） |
| `#clawbridge-incidents` | rollback 進捗 + 残課題 | Sec-I（手動） |
| Owner Slack DM | abort 確定後の最終サマリ（拘束 0 分維持） | CEO（abort 完遂後 5 分以内） |

### §4.2 SLACK_WEBHOOK_URL routing

`SLACK_WEBHOOK_URL` は 1Password `op://prj-019/slack/webhook-url` から DEC-019-024 連動で取得。送信形式:

```bash
curl -X POST "$SLACK_WEBHOOK_URL" -H 'Content-Type: application/json' -d \
  '{"channel":"#clawbridge-alerts","text":"ABORT_GATE_TRIGGERED","attachments":[{"color":"danger","fields":[{"title":"reason","value":"AB-N","short":true},{"title":"detected_at","value":"<UTC>","short":true},{"title":"trial","value":"MS-2","short":true},{"title":"operator","value":"Sec-I","short":true}]}]}'
```

### §4.3 通知タイムライン（abort 起動から完遂まで）

| T+ | 通知 | チャンネル | 内容 |
|---|---|---|---|
| T+0s | 自動 alert | `#clawbridge-alerts` | `ABORT_GATE_TRIGGERED reason=AB-N` |
| T+30s | Sec-I 手動 | `#clawbridge-alerts` | `ROLLBACK_STARTED` |
| T+5m | Sec-I 手動 | `#clawbridge-alerts` | `ABORT_GATE_COMPLETED status=rolled-back` |
| T+5m | Sec-I 手動 | `#clawbridge-incidents` | rollback verify 4/4 PASS report |
| T+10m | CEO 手動 | Owner Slack DM | 最終サマリ 100 字（Owner 拘束 0 分維持） |

---

## §5 引継・備考

本 runsheet は static、5/12 W2 trial mid-check FAIL 時 または 5/15 当日 §1 abort 条件発動時のみ起動。起動 0 件 case では unused archive。Owner 拘束 0 分制約: DM 100 字のみ、判断 escalation は CEO 一任。Web-Ops-D 作の取り下げ Runbook（`web-ops-r15-c-series-continuation.md` C-19 系列）と orthogonal: 取り下げ Runbook は公開後 portfolio 取り下げ用、本書は trial 期間中 internal abort 用。連動 DEC: DEC-019-024 / DEC-019-055 / DEC-019-062。
