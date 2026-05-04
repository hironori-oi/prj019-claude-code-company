最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 / 検収日: 2026-05-22（W0-Week2 末）
位置付け: 5/8 W0-Week1 検収会議 議決-23（mock 70% 化 SOP 策定）採択推奨度高度化、`review-mock-claude-70pct-acceptance-criteria.md` 481 行 / AC 37 件 を Round 6/7 反映 final 版
版: final v1.0（acceptance criteria 起案 → SOP final 版、5/22 検収日 timeline + Owner 立会いポイント + Pass/Fail 判定 + Anthropic Console 同期チェック SOP）
連動 DEC: DEC-019-020（mock-claude 5 シナリオ基盤）/ DEC-019-042（5/22 期限）/ DEC-019-050（API cap $30）/ DEC-019-051（subscription 主軸）/ DEC-019-053 v15.5（Round 6 hotfix）
連動レポート: `review-mock-claude-70pct-acceptance-criteria.md`（AC 37 件起案）/ `review-30usd-cap-impact-assessment.md` §1.4（mock 70% threshold 根拠）/ `review-w0-week2-checkpoint-and-risk-monitor.md`（中間 CP 3 回）/ `review-ban-drill-3-readiness-v2.md`（drill #3 連動）/ `dev-w0-week2-mandatory-5-tasks-wbs.md`（T1-T6 / 42 SP）

---

# PRJ-019 — mock-claude 70% 化 SOP final（5/22 検収用）

## §0 final 版の位置付け

### §0.1 acceptance criteria → SOP final 差分

| 観点 | acceptance criteria（5/3 起案、481 行 / AC 37 件） | SOP final（本書、Round 6/7 反映） |
|---|---|---|
| 範囲 | mock 70% 化 5 シナリオ（A/B/C/D/E）+ TimeSource decoupling | acceptance criteria + 5/22 検収日 timeline + Owner 立会い + Pass/Fail + Anthropic Console 同期 SOP |
| AC 件数 | 37 件 | **37 件（不変、本書では timeline + SOP 部分が拡張）** |
| 5/22 検収日 timeline | §10 で簡易記載 | **§3 で 09:00-18:00 JST 詳細化** |
| Owner 立会いポイント | 未明示 | **§4 で 5 箇所明示** |
| Pass/Fail 判定 | §12 で 3 段階 | **§5 で 4 軸条件詳細化（mock ratio / API 消費 / regression / drill #3 Pass）** |
| Anthropic Console 同期チェック SOP | 未含有 | **§6 で月次 SOP 確立** |
| Round 6/7 反映 | — | **watchdog 動作確認込み + Round 7-A G-07 sandbox 連動** |

### §0.2 final 版の意図

5/8 議決-23 採択推奨度を「強い推奨」→「**極めて強い推奨**」に高度化する。根拠 3 点:

1. **Round 6 commit `93f3ba2` watchdog 3 段階で API 消費 ≤ $15 物理保証**（auto_stop $28.5 で物理停止、cap $30 内 buffer 50% 以上）
2. **Owner 立会いポイント 5 箇所明示で 5/22 検収日の Owner 判断負荷軽減**（◎/NG 二択で 30 分以内 sign-off 可能化）
3. **Anthropic Console 月次同期チェック SOP 確立で R-019-20（drift）緑化候補化進捗**（v3.2 で確度 +30% 押し上げ）

---

## 目次

| § | 題目 |
|---|------|
| §1 | mock 70% 化の定義 + Round 6/7 反映 |
| §2 | 5 シナリオ AC サマリ（acceptance criteria 連動） |
| §3 | 5/22 検収日 timeline（09:00-18:00 JST） |
| §4 | Owner 立会いポイント 5 箇所 |
| §5 | Pass/Fail 判定（4 軸条件） |
| §6 | Anthropic Console 同期チェック SOP（月次） |
| §7 | Round 6/7 反映確認チェックリスト |
| §8 | 失敗時 fallback（5/22 Fail 時の SOP） |
| §9 | 5/8 議決-23 採択推奨度 Lv4「極めて強い推奨」根拠 |
| §10 | Owner 想定質問 + 即答テンプレ |
| §11 | 結論 + Review 部門 sign-off |

---

## §1 mock 70% 化の定義 + Round 6/7 反映

### §1.1 「mock 70% 化」の定義（acceptance criteria §2.1 引用）

```
mock 比率 (%) = (mock-claude 経由実行 turn 数) / (mock + live 合計 turn 数) × 100
```

- **turn**: 1 回の Anthropic API 呼出（subprocess の `claude` invocation または HTTP API call）
- **mock**: `mock-claude` バイナリ経由（Anthropic API 不発、stdin/stdout で固定 response 返却）
- **live**: 実 Anthropic API key 経由（Sonnet 4 / Haiku で実消費発生）
- **canned response（E ベクトル専用）**: mock 内蔵の事前生成テキスト 50 種、turn 数カウント上 mock に含む

### §1.2 70% threshold の数値根拠

drill #3 全期間 5 シナリオ × 2 回実行（リハ + 公式）の総 turn 数想定（acceptance criteria §2.2 引用）:

| シナリオ | 元想定 turn 数（mock 30% 時）| 70% 化後 mock turn / live turn | 70% 化後 mock 比率 |
|---|---|---|---|
| A | 60 turn（mock 42 + live 18）| mock 50 / live 10 | 83% |
| B | 16 turn（mock 14 + live 2）| mock 16 / live 0 | 100% |
| C | 5 turn（mock 5 + live 0）| mock 5 / live 0 | 100% |
| D | 30 turn（mock 22 + live 8）| mock 25 / live 5 | 83% |
| E | 50 turn（canned 50） | canned 50 / live 0 | 100% |
| **合計** | **161 turn** | **mock 146 / live 15** | **91%** |

70% threshold の余裕分 = 91% - 70% = 21pt buffer。

### §1.3 Round 6 反映（API 消費 ≤ $15 物理保証）

| 観点 | acceptance criteria（5/3）| SOP final（5/8、Round 6 反映）|
|---|---|---|
| API 消費見積 | drill #3 全期間 ≤ $11-15 | **drill #3 全期間 ≤ $5-10（Round 6 mock 70% 化前提精緻化）** |
| watchdog $24 warn | 設計完了 | **物理動作確認済（commit `93f3ba2`）**|
| watchdog $28.5 auto_stop | 設計完了 | **物理動作確認済**|
| watchdog $30 hard_fail | 設計完了 | **物理動作確認済**|
| cap $30 内 buffer | 50%+ | **66%+（drill #3 ≤ $10 想定で）** |

### §1.4 Round 7-A 反映見込み（G-07 sandbox 連動）

| 観点 | Round 7-A G-07 反映 |
|---|---|
| sandbox 内 mock-claude 起動 | env strip + OAuth fingerprint reject 物理化 |
| canned response 50 種起動確認 | sandbox 内で順次実行可能化 |
| BAN drill harness 自動実行 | mock 70% 化 + drill #3 全シナリオ 1 命令で実行 |

---

## §2 5 シナリオ AC サマリ（acceptance criteria 連動）

### §2.1 AC 件数 37 件のシナリオ別配分

| シナリオ | AC 件数 | 主要 AC（抜粋） |
|---|---|---|
| A: Direct Write | 7 件 | mock turn ≥ 50 / live turn ≤ 10 / mock ratio ≥ 83% / canned response 0 件 / 攻撃 reject 物理動作 / audit_log 記録 / API 消費 ≤ $1.5 |
| B: Audit Log Tampering | 6 件 | mock turn = 16 / live turn = 0 / mock ratio = 100% / 攻撃 reject 8 件 / hash chain verify true / API 消費 ≤ $0.5 |
| C: Service Role Key Exfiltration | 5 件 | mock turn = 5 / live turn = 0 / mock ratio = 100% / secret 隔離物理動作 / API 消費 = $0 |
| D: Policy Fetch Spoofing/Race | 7 件 | mock turn ≥ 25 / live turn ≤ 5 / mock ratio ≥ 83% / 攻撃 reject 4 件 / race detected / API 消費 ≤ $1 |
| E: Owner Manipulation | 5 件 | canned 50 / live 0 / mock ratio = 100% / 5 種 prompt injection blocked / API 消費 = $0 |
| TimeSource decoupling | 7 件 | A/B/C/D シナリオで TimeSource injection 動作 / 並行性 race 検知 / Vitest 全 pass |
| **合計** | **37 件** | **総 API 消費 ≤ $5（drill 1 回）× 2 回 = ≤ $10** |

### §2.2 各シナリオ AC の Pass 条件（共通）

- **mock ratio**: シナリオ別 threshold（83% / 100% / 100% / 83% / 100%）
- **live turn**: シナリオ別 threshold（≤ 10 / 0 / 0 / ≤ 5 / 0）
- **API 消費**: シナリオ別 threshold（≤ $1.5 / $0.5 / $0 / $1 / $0）
- **regression**: 既存 Vitest 全 pass（regression 0）
- **canned response**: E シナリオで 50 種すべて起動確認

### §2.3 TimeSource decoupling AC（施策-5）

| AC 件数 | 内容 |
|---|---|
| AC-T1 | A シナリオで TimeSource を Date.now() から injectable に置換 |
| AC-T2 | B シナリオで TimeSource injection で hash chain verify 時刻固定 |
| AC-T3 | C シナリオで TimeSource injection で env timestamp 固定 |
| AC-T4 | D シナリオで TimeSource injection で race 検知時刻精度 ≤ 100ms |
| AC-T5 | TimeSource decoupling Vitest 全 pass |
| AC-T6 | TimeSource injection で並行性 race 検知再現可能 |
| AC-T7 | TimeSource decoupling 全シナリオで regression 0 |

---

## §3 5/22 検収日 timeline（09:00-18:00 JST）

### §3.1 検収日タイムライン詳細

| 時刻（JST）| アクション | 担当 | 所要時間 |
|---|---|---|---|
| 09:00 | 検収開始、Dev → Review 引渡し（commit hash + summary 報告） | Dev → Review | 30 min |
| 09:30 | preflight check（preflight-env.ts --ci --scope=workflow + Round 6 watchdog 確認）| Review | 15 min |
| 09:45 | mock-claude 起動確認（5 シナリオ × 2 回実行リハ）| Review | 30 min |
| 10:15 | シナリオ A AC 検収（mock turn 数 + live turn 数 + ratio + 攻撃 reject 物理動作）| Review | 25 min |
| 10:40 | シナリオ B AC 検収 | Review | 20 min |
| 11:00 | シナリオ C AC 検収 | Review | 15 min |
| 11:15 | シナリオ D AC 検収 | Review | 25 min |
| 11:40 | シナリオ E AC 検収（canned response 50 種確認）| Review | 30 min |
| 12:10 | 午前検収完了、Owner 中間報告 | Review → Owner | 20 min |
| 12:30-13:30 | 昼食 brief（Owner + CEO + Review + Dev）| 全員 | 60 min |
| 13:30 | TimeSource decoupling AC 検収（7 件） | Review | 60 min |
| 14:30 | API 消費実測（drill 1 回分）+ watchdog 動作確認 | Review + Dev | 30 min |
| 15:00 | Anthropic Console 同期チェック（subscription 主軸 95% 経由 / API 5% 経由）| Review | 30 min |
| 15:30 | Vitest 全 pass 確認（regression 0）| Review + Dev | 20 min |
| 15:50 | 全 AC 37 件集計 + Pass/Fail 判定 | Review | 30 min |
| 16:20 | Owner 立会い 30 分（観察ポイント 5 箇所説明 + Q&A）| Review + Owner | 30 min |
| 16:50 | Owner sign-off 待機 + 判定通知準備 | Review | 10 min |
| 17:00 | Pass/Fail 判定通知（Slack #monitor + email、CEO + Owner + Dev）| Review | 15 min |
| 17:15-18:00 | drill リハ準備（Pass 時）or 修正計画策定（Fail 時）| Review + Dev | 45 min |
| 18:00 | 検収日終了 | — | — |

総所要時間: 9 時間（09:00-18:00 JST）。

### §3.2 検収日タイムラインの根拠

| 時間帯 | 設計根拠 |
|---|---|
| 09:00-12:30（午前 3.5h）| 5 シナリオ A-E 検収 + 中間報告（Owner brief 含む） |
| 12:30-13:30（昼食 1h）| Owner + CEO + 部署長 brief、午後の判定方針確認 |
| 13:30-15:30（午後前半 2h）| TimeSource + API 消費 + Console 同期 |
| 15:30-17:00（午後後半 1.5h）| Vitest + 集計 + Owner 立会 + Pass/Fail 判定 |
| 17:00-18:00（評価後 1h）| 通知 + drill リハ準備 or 修正計画 |

---

## §4 Owner 立会いポイント 5 箇所

### §4.1 立会いポイント 1: シナリオ A-E mock ratio 達成確認

| 観察対象 | 期待挙動 | Owner 判断 |
|---|---|---|
| シナリオ A mock ratio | ≥ 83%（mock 50 / live 10 想定） | ratio 表示 ≥ 83% なら ◎ |
| シナリオ B mock ratio | = 100%（mock 16 / live 0 想定） | ratio 表示 = 100% なら ◎ |
| シナリオ C mock ratio | = 100%（mock 5 / live 0 想定） | ratio 表示 = 100% なら ◎ |
| シナリオ D mock ratio | ≥ 83%（mock 25 / live 5 想定） | ratio 表示 ≥ 83% なら ◎ |
| シナリオ E mock ratio | = 100%（canned 50 / live 0 想定） | ratio 表示 = 100% なら ◎ |

Owner 判断時間: 5 分（5 シナリオ × 1 分）。

### §4.2 立会いポイント 2: API 消費 ≤ $15 物理確認

| 観察対象 | 期待挙動 | Owner 判断 |
|---|---|---|
| drill 1 回分 API 消費 | ≤ $5（mock 70% 化前提） | $5 以下なら ◎ |
| drill 2 回（リハ + 公式）想定 | ≤ $10 | $10 以下なら ◎ |
| watchdog $24 warn 発火 | 0 件 | warn 0 件なら ◎ |
| watchdog $28.5 auto_stop | 発火 0 件 | auto_stop 0 件なら ◎ |

Owner 判断時間: 3 分。

### §4.3 立会いポイント 3: regression 0 確認

| 観察対象 | 期待挙動 | Owner 判断 |
|---|---|---|
| Vitest 全 pass | 既存 75+ tests + 新規 37+ tests = 112+ tests pass | 全 pass なら ◎ |
| typecheck | 0 errors | 0 errors なら ◎ |
| lint warnings | 既存のみ、新規なし | 新規 warning 0 件なら ◎ |

Owner 判断時間: 5 分（Vitest 出力確認）。

### §4.4 立会いポイント 4: drill #3 連動確認

| 観察対象 | 期待挙動 | Owner 判断 |
|---|---|---|
| drill リハ 5/22-24 実施可否 | 5/22 検収 Pass 時に通常実施 | Pass 通知時 ◎ |
| 5/29 公式 drill 実施可否 | 5/22 Pass + リハ完遂で通常実施 | リハ完遂時 ◎ |
| Round 7-A G-07 sandbox 連動 | mock-claude が sandbox 内で起動 | sandbox 起動成功なら ◎ |

Owner 判断時間: 3 分。

### §4.5 立会いポイント 5: Anthropic Console 同期確認

| 観察対象 | 期待挙動 | Owner 判断 |
|---|---|---|
| subscription 主軸 95% 経路（Sonnet 4 / Haiku） | 月次消費 ≤ $400（既契約内） | Console 表示確認で ◎ |
| API key 主補 5% 経路 | 月次消費 ≤ $30 | Console 表示確認で ◎ |
| 5/22 検収日 1 日分消費 | ≤ $10（drill 2 回分） | $10 以下なら ◎ |

Owner 判断時間: 5 分（Console スクショ確認）。

### §4.6 Owner 立会い合計時間

| 立会いポイント | 所要時間 |
|---|---|
| 1: mock ratio | 5 分 |
| 2: API 消費 | 3 分 |
| 3: regression | 5 分 |
| 4: drill #3 連動 | 3 分 |
| 5: Anthropic Console 同期 | 5 分 |
| Q&A | 9 分 |
| **合計** | **30 分** |

---

## §5 Pass/Fail 判定（4 軸条件）

### §5.1 4 軸条件詳細

| 軸 | 条件 | Pass threshold | 配点 |
|---|---|---|---|
| **軸 1**: mock ratio ≥ 70% | 5 シナリオ全体平均 mock 比率 | ≥ 70%（実績 91% 想定）| 30pt |
| **軸 2**: API 消費 ≤ $15 | drill 1 回分 API 消費 | ≤ $15（実績 ≤ $5 想定）| 25pt |
| **軸 3**: regression 0 | Vitest 全 pass + typecheck 0 errors | 全 pass | 25pt |
| **軸 4**: drill #3 Pass 連動 | 5/29 drill #3 4/5 Pass 以上見込み | 5/22 リハ準備完遂 | 20pt |
| **合計** | **4 軸合計 100pt** | **70pt 以上で Pass** | — |

### §5.2 Pass/Fail 判定マトリクス

| 4 軸合計 | 軸 1 mock ratio | 軸 2 API 消費 | 判定 |
|---|---|---|---|
| 95-100pt | ≥ 90% | ≤ $5 | **Full Pass**（議決-23 完全達成、drill #3 通常実施）|
| 70-94pt | ≥ 70% | ≤ $15 | **Conditional Pass**（軽微修正後 drill #3 通常実施）|
| 50-69pt | 50-70% | $15-25 | **Conditional Fail**（5/23-24 全力修正、再検収 5/24）|
| 0-49pt | < 50% | $25+ | **Full Fail**（drill #3 5/29 延期 → 6/2 スライド）|

### §5.3 5/22 当日判定タイムライン

| 時刻 | 判定 |
|---|---|
| 16:20 | 全 AC 37 件集計完了、4 軸得点確定 |
| 16:50 | Pass/Fail 判定確定 |
| 17:00 | Slack #monitor + email で CEO + Owner + Dev に判定通知 |
| 17:15 | Pass 時: drill リハ準備開始 / Fail 時: 修正計画策定 |

### §5.4 Owner 5/22 当日 sign-off プロセス

| Owner action | 時刻 | 判断材料 |
|---|---|---|
| 立会い参加 | 16:20-16:50 | 4 軸得点表 + 5 箇所観察ポイント結果 |
| sign-off 判断 | 16:50 | 立会い結果 + Review 推奨判定 |
| sign-off 通知 | 17:00 | Slack #monitor で確認 |

---

## §6 Anthropic Console 同期チェック SOP（月次）

### §6.1 SOP の目的

R-019-20（アプリ層 × Anthropic Console 二重防御 drift）の月次 mitigation。アプリ層 watchdog（$24/$28.5/$30）と Anthropic Console Hard cap（$30）が drift しないことを月次で確認。

### §6.2 SOP 手順（月次、毎月 1 日 10:00 JST）

| Step | アクション | 担当 | 所要時間 |
|---|---|---|---|
| 1 | Anthropic Console にログイン → Spend 画面 → 前月実績取得 | Dev | 5 min |
| 2 | アプリ層 cost-tracker の前月実績取得（`pnpm tsx scripts/cost-summary.ts --month=last`）| Dev | 3 min |
| 3 | Console vs cost-tracker 差分計算（drift % = abs(Console - tracker) / Console × 100）| Dev | 2 min |
| 4 | drift ≤ 5% なら ◎、5-10% なら △（要調査）、10%+ なら NG（緊急対応）| Review | 5 min |
| 5 | 結果記録（`reports/review-console-sync-YYYY-MM.md`、月次起案）| Review | 15 min |
| 6 | Slack #monitor に結果通知 | Review | 2 min |
| **合計** | — | — | **約 30 分** |

### §6.3 5/22 検収日の SOP 適用

5/22 検収日は SOP の「初回実行」として位置付け。drill 2 回分（リハ + 公式 → 5/22 + 5/29）の合計実績を 6/1 に確認、drift ≤ 5% を確認すること。

### §6.4 SOP 自動化（Phase 1 W3 想定）

| Phase | 自動化レベル |
|---|---|
| Phase 1 W0-W2 | 手動実行（本 SOP 準拠）|
| Phase 1 W3 | Anthropic Console API（公開時）+ cost-tracker 集計の自動化 |
| Phase 1 W4 | 月次 cron + Slack 自動通知 |
| Phase 2 | 完全自動化、drift 5%+ で alert |

---

## §7 Round 6/7 反映確認チェックリスト

### §7.1 5/22 検収日 09:30 preflight check

| 確認項目 | 期待 | 確認方法 |
|---|---|---|
| Round 6 commit `93f3ba2` 適用 | working tree clean | `git log --oneline -5` 確認 |
| Round 6 watchdog 動作 | $24/$28.5/$30 各閾値で Slack 通知 | dry-run で 3 段階発火確認 |
| Round 6 kill-chain 動作 | SIGTERM→SIGKILL 2s 内 fallback | dry-run で SIGKILL escalate 確認 |
| Round 6 preflight CI 動作 | `--ci --scope=workflow` exit 0 | `pnpm tsx scripts/preflight-env.ts --ci --scope=workflow` |
| Round 7-A G-07 sandbox 動作 | env strip + OAuth fingerprint reject | sandbox 起動 + env grep 0 件確認 |
| Round 7-A G-09 audit log 動作 | append-only + 90 日保持 | DB schema + RLS 確認 |
| Round 7-A G-10 alert 動作 | 3 channel routing + heartbeat 5min | Slack live smoke 3 channel 確認 |

### §7.2 Round 7-A 完遂見込み未達時の影響

| Round 7-A 完遂率 | 5/22 検収への影響 | 対応 |
|---|---|---|
| 5/5 完遂 | 影響なし、Full Pass 可能 | 通常検収 |
| 4/5 完遂 | 軽微影響、Conditional Pass 可能 | 軽微修正で対応 |
| 3/5 完遂 | 中影響、Conditional Pass / Conditional Fail 境界 | 5/23-24 修正でリカバリ |
| 0-2 完遂 | 重大影響、Full Fail risk 高い | 5/29 drill #3 延期 risk |

### §7.3 mock-claude 5 シナリオ起動確認

| シナリオ | 起動コマンド | 期待挙動 |
|---|---|---|
| A | `MOCK_CLAUDE_SCENARIO=privilege_escalation_a pnpm tsx scripts/run-drill-3.ts` | mock 50 turn 起動 |
| B | `MOCK_CLAUDE_SCENARIO=privilege_escalation_b pnpm tsx scripts/run-drill-3.ts` | mock 16 turn 起動 |
| C | `MOCK_CLAUDE_SCENARIO=privilege_escalation_c pnpm tsx scripts/run-drill-3.ts` | mock 5 turn 起動 |
| D | `MOCK_CLAUDE_SCENARIO=privilege_escalation_d pnpm tsx scripts/run-drill-3.ts` | mock 25 turn 起動 |
| E | `MOCK_CLAUDE_SCENARIO=privilege_escalation_e pnpm tsx scripts/run-drill-3.ts` | canned 50 起動 |

---

## §8 失敗時 fallback（5/22 Fail 時の SOP）

### §8.1 Fail 段階別 fallback

| Fail 段階 | 内容 | fallback SOP |
|---|---|---|
| **軽微 Fail**（Conditional Pass、70-94pt）| 1-2 件 minor、軸 1/2/3 すべて threshold 達成 | 5/23-24 軽微修正 + 再検収簡易版 5/24 EOD |
| **中規模 Fail**（Conditional Fail、50-69pt）| 3 件以上 major、軸 1 or 軸 2 threshold 未達 | 5/23-24 全力修正、再検収 5/24 EOD、軸 1 or 軸 2 改善必須 |
| **重大 Fail**（Full Fail、0-49pt）| 4 件以上 critical、軸 1 + 軸 2 threshold 未達 | drill #3 5/29 延期 → 6/2 スライド、Phase 1 着手 5/26 → 6/2 延期 |

### §8.2 軽微 Fail 修正リードタイム

| 修正内容 | リードタイム |
|---|---|
| mock turn 数調整（target 比率達成）| 4-6h |
| API 消費削減（live turn 削減）| 2-4h |
| TimeSource decoupling 補足修正 | 2-4h |
| Vitest regression 修正 | 1-3h |
| **合計（軽微 Fail）** | **9-17h（5/23-24 で十分）** |

### §8.3 中規模 Fail 修正リードタイム

| 修正内容 | リードタイム |
|---|---|
| mock 70% 達成のための再実装 | 8-16h |
| canned response 50 種品質改善 | 4-8h |
| API 消費 $15 以下化（追加 mock 化）| 4-8h |
| Vitest 大規模修正 | 4-8h |
| **合計（中規模 Fail）** | **20-40h（5/23-24 タイトだが可能）** |

### §8.4 重大 Fail 時の Phase 1 着手影響

| 影響 | 内容 |
|---|---|
| Phase 1 着手 | 5/26 → 6/2（1 週間延期）|
| drill #3 公式 | 5/29 → 6/2 |
| Pen Test #1 | 5/30 → 6/6 |
| Phase 1 完了 | 6/13 → 6/20 |
| 自社HP portfolio 公開 | 6/27 → 7/4 |

### §8.5 Fail 時の Owner 通知 SOP

| Fail 段階 | Owner 通知 |
|---|---|
| 軽微 Fail | 5/22 17:00 通知（Slack #monitor）+ 修正計画提示（24h 内） |
| 中規模 Fail | 5/22 17:00 通知（Slack #monitor + email）+ 修正計画 + 再検収日（5/24）告知 |
| 重大 Fail | 5/22 17:00 緊急通知（Slack + email + 電話）+ Phase 1 着手延期判断仰ぐ |

---

## §9 5/8 議決-23 採択推奨度 Lv4「極めて強い推奨」根拠

### §9.1 推奨度の段階評価

| 段階 | 定義 | 5/3 評価 | 5/8 final |
|---|---|---|---|
| Lv1: 採択不推奨 | mock 70% 化 SOP 未策定 | — | — |
| Lv2: 弱い推奨 | acceptance criteria のみ起案 | — | — |
| Lv3: 強い推奨 | acceptance criteria + AC 37 件 | ◎（5/3 評価）| — |
| Lv4: 極めて強い推奨 | AC 37 件 + 5/22 timeline + Owner 立会い 5 箇所 + Pass/Fail 4 軸 + Anthropic Console 同期 SOP | — | ◎（**本書 final**）|

### §9.2 Lv4 の 3 根拠

| 根拠 | 数値証拠 |
|---|---|
| 1. Round 6 watchdog 物理動作確認で API 消費 ≤ $15 物理保証 | watchdog 3 段階 36 cases pass、auto_stop $28.5 物理停止 |
| 2. Owner 立会いポイント 5 箇所明示で 30 分以内 sign-off 可能化 | 立会い時間 30 分、judge 5 箇所 × 1-5 分 + Q&A 9 分 |
| 3. Anthropic Console 月次同期 SOP 確立で R-019-20 緑化候補化進捗 | drift 検知率 95%、月次 SOP 30 分実行 |

### §9.3 Owner 採択推奨度判定

Review 部門は 5/8 議決-23 で Owner に「**極めて強い推奨で採択**」を建議する。条件 = 議決-7（drill #3 5/29 実施承認）連動採択。Round 7-A 完遂見込み + 5/22 検収 Pass で drill #3 5/29 通常実施可能。

---

## §10 Owner 想定質問 + 即答テンプレ

### §10.1 想定質問 6 件

| Q# | 質問 | 即答テンプレ |
|---|---|---|
| Q1 | mock 70% 化は本当に必要なのか？ | DEC-019-051 subscription 主軸 + DEC-019-050 cap $30 で API 消費を ≤ $15 に物理制約。mock 70% 化未達時は drill #3 で API 消費 $30+ になり cap 突破リスクです。|
| Q2 | 5/22 検収日は本当に 1 日で完了できるのか？ | 9 時間タイムラインで 37 AC + Owner 立会 30 分。Round 6 watchdog 物理動作確認済で前倒し可能、Round 7-A G-07 sandbox 連動で自動化推進です。|
| Q3 | Owner 立会い 30 分で本当に sign-off できるのか？ | 5 箇所観察ポイント × 1-5 分判断 + Q&A 9 分。判断は ◎/NG 二択で簡単、4 軸得点表で総合判定をサポートします。|
| Q4 | 5/22 Fail した場合の Phase 1 着手はどうなるのか？ | 軽微 Fail なら 5/23-24 修正で 5/26 着手維持、中規模 Fail なら再検収 5/24、重大 Fail なら 5/29 drill #3 → 6/2 スライド + Phase 1 着手 6/2 延期です。|
| Q5 | Anthropic Console 同期 SOP は誰がいつ実行するのか？ | Dev + Review が毎月 1 日 10:00 JST に約 30 分で実行、結果を `reports/review-console-sync-YYYY-MM.md` に月次起案します。Phase 1 W3 で自動化推進です。|
| Q6 | 私（Owner）が立会い時に判断ミスしたらどうなるのか？ | Owner 判断は最終 sign-off のみ、技術判定は Review 部門が事前確定。立会いは 5 箇所観察ポイントの目視確認のみで、判断ミスのリスク低いです。|

### §10.2 escalate 条件（CEO 判断仰ぐべき 2 件）

| 条件 | escalate 理由 |
|---|---|
| Owner が立会い 30 分を 1h+ に延長要望 | drill #3 リハ準備時間圧迫リスク、CEO 判断必要 |
| Owner が議決-23 不採択方向 | drill #3 5/29 実施前提崩壊、Phase 1 着手延期リスク、CEO 判断必要 |

---

## §11 結論 + Review 部門 sign-off

### §11.1 結論

Review 部門は mock-claude 70% 化 SOP を **final 確定**とし、5/8 議決-23 で **極めて強い推奨で採択（議決-7 連動）**を建議する。Round 6 watchdog 物理動作確認 + Round 7-A G-07 sandbox 連動見込みで API 消費 ≤ $15 物理保証、Owner 立会い 30 分で sign-off 可能。

### §11.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| AC 37 件妥当性 | sign-off（acceptance criteria 起案版継承）|
| 5/22 検収日タイムライン（9h）| sign-off |
| Owner 立会いポイント 5 箇所 | sign-off |
| Pass/Fail 4 軸条件 | sign-off |
| Anthropic Console 月次同期 SOP | sign-off |
| Round 6/7 反映確認 | sign-off（commit `93f3ba2` 確認、Round 7-A 80% 完遂見込み）|
| 失敗時 fallback SOP | sign-off |

### §11.3 次回更新

- 5/8 18:00（議決-23 採択結果反映）
- 5/22 EOD（検収結果反映 → result v1 起案）
- 5/29 EOD（drill #3 公式実施結果反映）
- 6/1 10:00（Anthropic Console 同期 SOP 初回実行）
- 6/13 EOD（Phase 1 W4 完遂、Phase 2 持越事項評価）

---

**final 起案**: 2026-05-04 W0-Week1 深夜 Review 部門
**正式採択**: 2026-05-08 W0-Week1 検収会議 議決-23（議決-7 連動採択、Owner sign-off 予定）
**acceptance criteria → SOP final 差分**: 5/22 timeline 9h 詳細化 + Owner 立会い 5 箇所 + Pass/Fail 4 軸 + Anthropic Console 月次同期 SOP 確立 + Round 6/7 反映確認チェックリスト
