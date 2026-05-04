# harness/ — ハーネス制御層

## 責務

Open Claw / Claude Code / 生成コードに対する **横断的な安全装置**。コスト追跡、稼働時間監視、HITL ゲート、kill switch、ToS 遵守監視、FS / Bash allowlist、secret 隔離を一元的に提供する。

review v2（`projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`）の必須コントロール 23 項目のうち、ハーネス層実装が必要な分の実体置き場。

## 入力

- Open Claw / Claude Code / Sandbox からの実行イベント（spawn / tool_call / 生成コード起動）
- オーナー Slack コマンド（`/clawbridge stop` 等）
- cron スケジュール（heartbeat / 監視 polling）

## 出力

- 各実行に対する allow / block / warn 判定
- Slack / Telegram / Resend への通知（notify/ 経由）
- audit/ への監査イベント書込

## 依存関係

- `notify/` — 異常検知時のアラート発火
- `audit/` — 全判定の append-only 書込
- `claude-bridge/` — Claude Code 実行前後フック
- `openclaw-runtime/` — Open Claw skill 実行前後フック
- `sandbox/` — sandbox 起動時の env whitelist 強制

## 主要コンポーネント

| ファイル | 責務 | W0 状態 |
|---|---|---|
| `src/cost_check.ts` | 4 層ハードキャップ + 自主上限 70% 監視 | CB-D-W0-09 でプロトタイプ |
| `src/emergency_stop.ts` | < 30 秒で全 child process kill + cron 停止 | CB-D-W0-10 でプロトタイプ |
| `src/hitl_gate.ts` | 公開 / 課金 / force push / prod deploy / 外部 API の 5 ゲート | W2 着手 |
| `src/tos_monitor.ts` | 24h 連続稼働 / 異常 token 消費検知 | W2 着手 |
| `src/rate_jitter.ts` | request 間 30s〜180s ランダム jitter | W2 着手 |
| `src/business_hour_guard.ts` | 09:00-23:00 JST 以外を block | W2 着手 |
| `src/fs_allowlist.ts` | FS write 範囲制御 | CB-D-W0-11 で型と JSON |
| `src/secret_isolation.ts` | Tier-S0〜S4 secret 注入制御 | CB-D-W0-12 で I/F |
| `config/fs_allowlist.json` | 書込許可パス | CB-D-W0-11 |
| `config/bash_allowlist.json` | コマンドホワイトリスト | W1 着手 |
| `config/hitl_gates.json` | 5 ゲート定義 | CB-D-W0-15 |
| `config/business_hour_window.json` | 業務時間帯定義 | CB-D-W0-15 |
| `config/tos_monitor_thresholds.json` | tos_monitor 閾値 | CB-D-W0-15 |

## 関連必須コントロール

G-01 / G-02 / G-04 / G-05 / G-06 / G-07 / G-09（一部） / G-V2-01 / G-V2-02 / G-V2-06 / G-V2-07 / G-V2-09 / G-V2-11
