# notify/ — 通知層

## 責務

平常時 / 警告時 / 緊急時 のレベル別通知を **複数チャネル冗長**で配信。Anthropic 警告メールの polling 監視も担う（ToS 違反兆候の早期検知）。

## 入力

- harness/ / claude-bridge/ / orchestrator/ からの通知要求
- cron polling（heartbeat 5 分、Anthropic 警告メール 1 時間）

## 出力

- Slack（平常 + heartbeat、Webhook）
- Telegram（異常、Bot API）
- Resend Email（critical、ai-lab@improver.jp）

## レベル設計

| レベル | チャネル | 用途 |
|---|---|---|
| info | Slack | 平常時の進捗通知、preview deploy URL、ベンチマーク完了 |
| heartbeat | Slack（別 channel） | 5 分間隔生存通知 |
| warn | Slack + Telegram | コスト 80% / レート 70% / 業務時間外起動試行 |
| anomaly | Slack + Telegram | tos_monitor 検知 / 連続稼働 12h 超過 |
| critical | Slack + Telegram + Resend Email | kill switch 発動 / Anthropic 警告メール / sandbox escape |

## 重要な polling

- **Anthropic 警告メール監視**（G-V2-08 必須）: Gmail API で `from:anthropic.com` を 1h polling、検知でハーネス全停止 + critical 通知
- 検索キーワード: "ToS violation" / "account suspension" / "unusual activity" / "exceeded"

## 依存関係

- Slack Webhook（`#prj-019-clawbridge` channel、`#prj-019-emergency` channel）
- Telegram Bot Token + chat_id
- Resend API Key（オーナー手元の既存 key 流用検討）
- Gmail API OAuth（オーナー本人 ai-lab@improver.jp）

## 主要 API

```typescript
interface NotifyAPI {
  info(msg: string, ctx?: object): Promise<void>
  warn(msg: string, ctx?: object): Promise<void>
  anomaly(msg: string, ctx?: object): Promise<void>
  critical(msg: string, ctx?: object): Promise<void>
  heartbeat(): Promise<void>
}
```

## W0 段階の到達目標

- CB-D-W0-13: Slack Webhook ping PoC、I/F 統一抽象（slack.ts / telegram.ts / email.ts のスケルトン）

## 関連必須コントロール

G-10（multi-channel alert）／ G-V2-08（Anthropic 警告メール監視 → 即停止フック）
