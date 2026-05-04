# PRJ-019 BAN drill #1 シナリオ最終化（2026-05-13 実施想定）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: レビュー部門（品質管理）
- 作成日: 2026-05-03
- 作成者: Review Agent (claude-code-company)
- 版: v1
- 実施日: **2026-05-13 (水) 10:00〜14:00 JST**（4 時間枠、Step 5 SLA = 4 時間に対応）
- 関連:
  - 上流: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md` §6（B6 BAN 模倣シナリオ）
  - 上流: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md` §3.1（BAN 5 ステップ）
  - 上流: `projects/PRJ-019/reports/review-control-implementation-plan.md`（C-A-03 BAN drill 1 回目）
  - 上流: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md` §6.2（5/13 マイルストーン）
  - 連動: `projects/PRJ-019/reports/review-tos-allowlist-dod-integration-v1.md` §4.1 G-Top-4
  - 関連決裁: DEC-019-014（BAN drill 訓練計画、推定）

## 0. 文書の位置づけ

### 0.1 目的
- W0-Week2 中盤（5/13）に、開発部門が **PRJ-019 単独**で BAN 検知 → 退避 → secret rotate → 代替起動 までの 5 SLA を実機で検証する
- BAN drill #2（5/17 Sumi/Asagi 同居）の前段として、**PRJ-019 単独動作での 5 SLA 全達成**を確証する
- BAN フォールバック計画（review-v2 §3.1）を「文書」から「実機検証済み手順」に昇格させる

### 0.2 対象 SLA（review-v2 §3.1 / 本書のオーナー指示）
| Step | 名称 | SLA | 内容 |
|---|---|---|---|
| Step 1 | 検知 | < **1 分** | 401/403 連続 5 回 in 60s window で kill-switch 自動発火 |
| Step 2 | 通知 | < **5 分** | Slack / メール multi-channel、HITL gate 経由 or 直接 webhook |
| Step 3 | 退避 | < **30 分** | Sumi/Asagi 作業データ git push + Anthropic セッション履歴 export 確認 |
| Step 4 | secret rotate | < **60 分** | Anthropic API key 即時生成、Doppler/1Password 反映 |
| Step 5 | 代替起動 | < **4 時間** | P-E フォールバック = `claude` CLI を `--api-key $ANTHROPIC_API_KEY` 起動に env 1 行切替 |

### 0.3 drill #1 と #2 の役割分担

| 項目 | drill #1（5/13 本書） | drill #2（5/17、別書） |
|---|---|---|
| 同居 PRJ | なし（Sumi/Asagi はアイドル） | あり（Sumi/Asagi 同時稼働中に BAN） |
| 主目的 | PRJ-019 単独で 5 SLA 検証 | 既存 PRJ への副作用ゼロ + 5 SLA 検証 |
| 副作用検証 | PRJ-001〜018 git diff 0 行 | + Sumi/Asagi 作業中タスクの保護 |
| 想定所要 | 4 時間 | 6 時間 |
| 失敗時影響 | drill 再実施 + 3 日延期 | Phase 1 着手 1 週間延期 |

### 0.4 安全運用（Trust but verify 原則）
- **隔離環境**: WSL2 別ユーザー or 別 worktree、本番アカウントへ到達不可
- **mock 化**: Anthropic API は `mock-claude` スタブ（Dev タスク 2 で整備中）で代替、本物の Anthropic アカウントへリクエスト到達ゼロ
- **dummy secret**: secret rotate は dummy `sk-ant-fake-drill-XXXX` に対して実施、本物の API key は触らない
- **副作用ゼロ baseline**: drill 開始前に PRJ-001〜018 の `git status` snapshot を取得、終了後に diff 比較

### 0.5 全体図

```mermaid
flowchart TD
    Start([drill 開始 T0]) --> A[mock-claude<br/>MOCK_CLAUDE_SCENARIO=silent_revoke]
    A --> A1[401 連続 5 回<br/>60s window 内]
    A1 --> B{Step 1: 検知<br/>< 1 分?}
    B -->|Pass| C[kill-switch 自動発火<br/>全 child SIGKILL]
    B -->|Fail| FAIL1[FAIL: 検知 SLA 違反]

    C --> D{Step 2: 通知<br/>< 5 分?}
    D -->|Pass| E[Slack #emergency<br/>+ Owner email 着信]
    D -->|Fail| FAIL2[FAIL: 通知 SLA 違反]

    E --> F{Step 3: 退避<br/>< 30 分?}
    F -->|Pass| G[git push 完了<br/>+ session export 完了]
    F -->|Fail| FAIL3[FAIL: 退避 SLA 違反]

    G --> H{Step 4: rotate<br/>< 60 分?}
    H -->|Pass| I[Doppler に新 key 反映<br/>dummy key で確認]
    H -->|Fail| FAIL4[FAIL: rotate SLA 違反]

    I --> J{Step 5: 代替起動<br/>< 4 時間?}
    J -->|Pass| K[P-E env 切替<br/>--api-key モード起動]
    J -->|Fail| FAIL5[FAIL: 代替起動 SLA 違反]

    K --> L[drill #1 タスク完走<br/>1 件の test job]
    L --> M{副作用<br/>PRJ-001〜018<br/>git diff 0?}
    M -->|Yes| PASS([drill #1 PASS])
    M -->|No| FAIL6[FAIL: 副作用検出]

    style PASS fill:#ccffcc
    style FAIL1 fill:#ffcccc
    style FAIL2 fill:#ffcccc
    style FAIL3 fill:#ffcccc
    style FAIL4 fill:#ffcccc
    style FAIL5 fill:#ffcccc
    style FAIL6 fill:#ffcccc
```

---

## 1. drill 目的とスコープ

### 1.1 主目的
1. **5 SLA 全達成の実機検証**: 検知 1 分 / 通知 5 分 / 退避 30 分 / rotate 60 分 / 代替起動 4 時間
2. **P-E フォールバック手順の動作確認**: `claude` CLI を `--api-key $ANTHROPIC_API_KEY` 起動への env 1 行切替が成功すること
3. **副作用ゼロ確認**: PRJ-001〜018 / claude-code-company 本体に書込・git diff・Vercel deploy・Supabase 行への変更が **0 件**

### 1.2 スコープ内
- PRJ-019 単独の harness 層と claude-bridge 層
- mock-claude スタブによる BAN 模倣（401 / 403 / 429 連続返却）
- Doppler / 1Password 代替: drill 用 `.envrc.drill` に dummy secret 配置
- Slack 通知（テスト channel `#clawbridge-drill`）
- HITL gate（テスト webhook、CEO に承認 mock を送信）
- audit log 書込（`projects/PRJ-019/app/audit/logs/drill-1-{TIMESTAMP}/`）

### 1.3 スコープ外
- **Sumi (PRJ-012) / Asagi (PRJ-018) の同時稼働**: drill #1 中はアイドル必須
- **本物の Anthropic アカウントへの到達**: 一切しない（mock-claude のみ）
- **本番 Vercel deploy / 本番 Supabase 書込**: 一切しない
- **本物の secret rotate**: drill #1 では dummy のみ。本物 rotate の演習は drill #2（5/17）または BAN 実発生時のみ

### 1.4 drill 中の Sumi/Asagi アイドル運用
- drill 開始 1 時間前 (5/13 09:00) までに Sumi/Asagi の全エージェント停止確認（Owner / CEO 共同確認）
- Sumi (PRJ-012) の dev server も停止（PRJ-012 の port 開放を含む）
- Asagi (PRJ-018) の cron / scheduler 全停止
- drill 終了 30 分後 (5/13 14:30) まで Sumi/Asagi 起動禁止

### 1.5 参加者と役割

| 役割 | 担当者 | drill 中タスク |
|---|---|---|
| **drill master** | Dev | mock-claude 起動、SLA タイマー計測、結果記録 |
| **observer** | Review | SLA 違反検出、合否判定、副作用ゼロ確認 |
| **CEO mock** | CEO（リアル） | HITL 承認 mock の応答（drill 用）、kill-switch 確認 |
| **Owner** | Owner（リアル） | drill 開始時の Sumi/Asagi 停止承認、終了報告受領 |
| **PM** | PM | drill 進行サポート、依存影響 watch |

### 1.6 drill 失敗時の影響
- 1 SLA 違反: **drill #1 Fail**、3 日以内に再 drill 必須（5/16 まで）
- 再 drill も Fail: **Phase 1 着手 1 週間延期**（W0 終了 5/18 → 5/25）
- 副作用検出（PRJ-001〜018 への書込）: **即時 Critical 起票**、Phase 1 着手 NoGo 判定材料

---

## 2. drill ハッピーパス（45 分目安、ステップ別所要時間表）

### 2.1 タイムライン（T0 = drill 開始）

| 経過時間 | フェーズ | アクション | 担当 | 検証 |
|---|---|---|---|---|
| T0 | 準備 | drill 開始宣言、Slack #clawbridge-drill 通知 | drill master | — |
| T0 + 0:30 | 準備 | mock-claude 起動 (`MOCK_CLAUDE_SCENARIO=silent_revoke`) | drill master | mock 起動成功 |
| T0 + 1:00 | Step 1 検知 | mock-claude が 401 連続 5 回返却（60s window 内、間隔 10s） | mock | 401 5 件返却完了 |
| T0 + 1:30 | Step 1 検知 | auth-detector / circuit-breaker / kill-switch 連動 | harness | **kill-switch 自動発火** |
| T0 + 2:00 | Step 1 終了 | 全 child SIGKILL 完了、cron 全停止 | harness | child PID 一覧で確認、SLA < 1 分 達成 |
| T0 + 2:30 | Step 2 通知 | Slack #clawbridge-drill に「BAN 検知」 webhook 着信 | notify | Slack 投稿 timestamp 確認 |
| T0 + 3:00 | Step 2 通知 | Owner email へ「BAN 検知 + drill 通知」着信 | notify | mailbox 確認 |
| T0 + 6:00 | Step 2 終了 | multi-channel 通知すべて完了 | notify | SLA < 5 分 達成 |
| T0 + 7:00 | Step 3 退避 | git push 自動実行（PRJ-019 内 worktree のみ、dummy commit） | harness | remote に new commit |
| T0 + 12:00 | Step 3 退避 | session export 完了（`audit/sessions/drill-1-export-{TS}.tar.gz`） | harness | tarball 存在確認 |
| T0 + 30:00 | Step 3 終了 | 退避完了 | — | SLA < 30 分 達成 |
| T0 + 32:00 | Step 4 rotate | 新 dummy `ANTHROPIC_API_KEY=sk-ant-fake-rotated-XXXX` を Doppler 投入 | drill master | Doppler get で新 key 取得 |
| T0 + 40:00 | Step 4 rotate | secrets-loader が Doppler から新 key 読み出し | harness | env 値確認 |
| T0 + 50:00 | Step 4 終了 | rotate 完了、新 key 反映確認 | — | SLA < 60 分 達成 |
| T0 + 55:00 | Step 5 代替 | `.envrc.drill` を P-E モードに書換（`USE_API_KEY=1`） | drill master | env 切替確認 |
| T0 + 1:00:00 | Step 5 代替 | `claude --api-key $ANTHROPIC_API_KEY` モードで mock 起動 | harness | プロセス起動成功 |
| T0 + 1:30:00 | Step 5 検証 | 1 タスク完走（`echo "drill-1 P-E test"`） | harness | exit code 0 |
| T0 + 2:00:00 | Step 5 終了 | 代替起動完了 | — | SLA < 4 時間 達成 |
| T0 + 2:30:00 | 後片付 | 副作用検証 (`git status` PRJ-001〜018) | observer | diff 0 行 |
| T0 + 3:00:00 | 後片付 | drill レポート起票 (`reports/ban-drill-1-result.md`) | drill master | レポート完成 |
| T0 + 3:30:00 | 後片付 | Sumi/Asagi 再開許可 | Owner | — |
| T0 + 4:00:00 | 終了 | drill 完了宣言 | drill master | — |

### 2.2 ハッピーパス所要時間まとめ

| 項目 | 想定実時間 | SLA |
|---|---|---|
| Step 1 検知 | 〜2 分 | 1 分 |
| Step 2 通知 | 〜6 分（Step 1 終了から 4 分） | 5 分（Step 1 終了から） |
| Step 3 退避 | 〜30 分 | 30 分 |
| Step 4 rotate | 〜50 分 | 60 分 |
| Step 5 代替起動 | 〜2 時間 | 4 時間 |
| 合計 drill | 〜4 時間 | — |

**注**: 各 SLA は「BAN 発生 T0 から」の累積時間ではなく、「前ステップ終了から」の差分時間で計測する（review-v2 §3.1 と整合）。

---

## 3. drill 異常パス × 5

5 つの異常パスを準備。各パターンは **drill #1 当日にハッピーパス完了後、追加時間（〜30 分 / パターン）** で実施。drill #1 全体所要を 4 時間枠 + 異常パス枠 2.5 時間に分割（合計 6.5 時間目安）、または異常パスのみ 5/14 へ持ち越し可（CEO 判断）。

### 3.1 パターン A: Anthropic 警告メール先着（kill-switch 発火前に到着）

#### 3.1.1 想定シナリオ
- mock-claude が 401 を返す**前**に、Anthropic から警告メール（"unusual activity detected"）が Owner mailbox に到着
- Open Claw / harness 層は警告メールを G-V2-08 で検知（IMAP polling）
- 401 が来る前に G-Top-4 P-E フォールバック起動が走るべき

#### 3.1.2 セットアップ
- Owner test mailbox (`drill-test@example.com`) に dummy 警告メールを T0 + 5 秒に投入
- mock-claude は 401 をまだ返さない（通常応答中）
- G-V2-08 IMAP polling 間隔 = 30 秒

#### 3.1.3 期待動作
| 経過時間 | アクション | 期待 |
|---|---|---|
| T0 + 5s | 警告メール着信 | mailbox に dummy 警告メール |
| T0 + 35s | G-V2-08 検知 | IMAP polling で警告メール検出 |
| T0 + 1m | CEO Slack mention | G-Top-4 即時通知トリガ |
| T0 + 5m | CEO 即時承認（drill mock） | webhook 経由で承認 mock 受信 |
| T0 + 10m | P-E フォールバック起動 | `claude --api-key` モード開始、kill-switch 発火不要 |

#### 3.1.4 合否
- **Pass**: 警告メール検知 < 1 分、CEO 通知 < 5 分、P-E 起動 < 4 時間（実際は 10 分目標）
- **Fail**: 警告メール検知失敗 / kill-switch が誤発火（401 到達前なので発火すべきでない）

### 3.2 パターン B: silent revocation（メールなしで 401 のみ）

#### 3.2.1 想定シナリオ
- Anthropic から事前通知なし、ある瞬間から全 request が 401 で返る
- mock-claude `MOCK_CLAUDE_SCENARIO=silent_revoke` を使用

#### 3.2.2 セットアップ
- mailbox に警告メール **投入しない**
- mock-claude は T0 + 1m から 401 連続返却（60s 窓内 5 回）

#### 3.2.3 期待動作（=ハッピーパスと同一）
- §2.1 タイムライン通り、kill-switch → 通知 → 退避 → rotate → 代替起動

#### 3.2.4 合否
- **Pass**: §2.2 SLA 全達成
- **Fail**: silent revocation を kill-switch が拾わない

### 3.3 パターン C: rate limit 429 連続だが BAN ではない（誤検知）

#### 3.3.1 想定シナリオ
- mock-claude `MOCK_CLAUDE_SCENARIO=rate_limit_429` で 429 を返す
- 429 は Anthropic の正常なレートリミット応答であり、BAN ではない
- harness は **kill-switch を発火させず**、circuit-breaker open で待機すべき

#### 3.3.2 セットアップ
- mock-claude は T0 + 1m から 429 連続返却

#### 3.3.3 期待動作
| 経過時間 | アクション | 期待 |
|---|---|---|
| T0 + 1m | 429 連続 5 回 | circuit-breaker open に遷移 |
| T0 + 2m | exponential backoff | 30s / 60s / 120s で再試行（mock は 429 継続） |
| T0 + 5m | 警告 Slack 通知 | "rate limit detected, not BAN" の info-level 通知 |
| T0 + 10m | mock を 200 OK 応答に切替 | circuit-breaker half-open → closed |
| T0 + 11m | 通常運用復帰 | kill-switch **発火しない** |

#### 3.3.4 合否
- **Pass**: kill-switch 不発、circuit-breaker のみ動作、誤検知ゼロ
- **Fail**: kill-switch 誤発火（429 を BAN と誤認）

### 3.4 パターン D: 検知 1 分 SLA 違反（HITL 通知遅延）

#### 3.4.1 想定シナリオ
- 401 検知は 1 分以内に成功
- しかし HITL gate（Slack webhook）が応答 5 秒遅延 × 5 = 累計 25 秒遅延 → 通知 SLA 5 分の境界に迫る
- 通知が 5 分超過する場合の自動エスカレーション動作確認

#### 3.4.2 セットアップ
- Slack webhook を **意図的に 5 秒遅延 mock**（`mock-slack-delayed-5s`）
- email も同様遅延

#### 3.4.3 期待動作
| 経過時間 | アクション | 期待 |
|---|---|---|
| T0 + 1m | kill-switch 発火 | OK |
| T0 + 4m | Slack 投稿待ち | timeout 警告 log 出力 |
| T0 + 5m | 通知 SLA 違反検知 | 自動エスカレーション: SMS / 電話 fallback 発動 |
| T0 + 5m 30s | SMS 着信（drill 用 dummy SMS） | Owner SMS 受信 |
| T0 + 6m | drill master が手動エスカレーションログ確認 | エスカレーションが記録 |

#### 3.4.4 合否
- **Pass**: SLA 違反を自動検知 + 自動エスカレーション動作
- **Fail**: SLA 違反が無検知のまま放置

### 3.5 パターン E: P-E フォールバック起動失敗（ANTHROPIC_API_KEY 未配備）

#### 3.5.1 想定シナリオ
- Step 1〜4 までハッピーパスと同じ
- Step 5 で `ANTHROPIC_API_KEY` が Doppler に未配備（drill 開始前に意図的に削除）
- フォールバック起動が失敗、CEO に手動対応要求

#### 3.5.2 セットアップ
- drill 開始前に Doppler から `ANTHROPIC_API_KEY` を一時削除（drill 用 namespace のみ）

#### 3.5.3 期待動作
| 経過時間 | アクション | 期待 |
|---|---|---|
| T0 + 1m〜50m | Step 1〜4 完了 | OK |
| T0 + 55m | P-E env 切替試行 | Doppler から `ANTHROPIC_API_KEY` 取得失敗 |
| T0 + 56m | エラーハンドリング | CEO Slack mention「P-E 起動失敗、手動対応要求」 |
| T0 + 1h | drill master 手動対応 | 手動で dummy key を Doppler 再投入 |
| T0 + 1h 10m | P-E 再起動成功 | プロセス起動 |
| T0 + 4h | SLA ギリギリで達成 | Pass（SLA 4h 以内に収まれば OK） |

#### 3.5.4 合否
- **Pass**: 自動失敗検知 + CEO 通知 + 手動対応で SLA 4h 以内に達成
- **Fail**: 失敗検知なし / SLA 超過 / 手動対応経路が未整備

---

## 4. drill 用テストデータ（mock-claude スタブ）

### 4.1 mock-claude シナリオ仕様（Dev タスク 2 で整備中）

#### 4.1.1 環境変数による切替
```bash
# シナリオ切替（drill master が drill 開始前に設定）
export MOCK_CLAUDE_SCENARIO=silent_revoke   # または auth_failed / rate_limit_429 / normal
export MOCK_CLAUDE_DELAY_MS=0               # 応答遅延（パターン D 用、5000ms 等）
export MOCK_CLAUDE_BAN_AT_REQUEST=5         # 何 req 目から BAN を返すか
export MOCK_CLAUDE_BAN_DURATION_S=300       # BAN 継続時間（秒）
```

#### 4.1.2 シナリオ別動作

| `MOCK_CLAUDE_SCENARIO` | 動作 | 用途 |
|---|---|---|
| `normal` | 200 OK + dummy completion 返却 | 平常時 baseline |
| `silent_revoke` | `MOCK_CLAUDE_BAN_AT_REQUEST` 到達後、401 を連続返却 | パターン B（drill #1 ハッピーパス） |
| `auth_failed` | 全 request で 401 返却（即時 BAN） | 即時 BAN シミュレーション |
| `rate_limit_429` | 429 を 5 回連続後、200 OK に復帰 | パターン C（誤検知防止） |
| `forbidden_403` | 403 連続返却（OAuth 経路の即時拒否） | 補助シナリオ |

#### 4.1.3 mock 起動コマンド例
```bash
# パターン B: silent_revoke (ハッピーパス)
MOCK_CLAUDE_SCENARIO=silent_revoke \
MOCK_CLAUDE_BAN_AT_REQUEST=5 \
./scripts/mock-claude-server.sh --port 9080

# パターン C: rate_limit_429 (誤検知)
MOCK_CLAUDE_SCENARIO=rate_limit_429 \
MOCK_CLAUDE_BAN_DURATION_S=600 \
./scripts/mock-claude-server.sh --port 9080
```

### 4.2 drill 用 secret セット（dummy）

| 変数 | 値（dummy） | Doppler scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-fake-drill-001` | `drill-1` namespace |
| `ANTHROPIC_API_KEY_ROTATED` | `sk-ant-fake-drill-rotated-002` | drill master 手元のみ、Step 4 で投入 |
| `SLACK_WEBHOOK_URL_DRILL` | `https://hooks.slack.com/services/T.../drill-test` | `drill-1` namespace |
| `OWNER_EMAIL_DRILL` | `drill-test@example.com` | `drill-1` namespace |

### 4.3 drill 用 audit データ初期化

```bash
# drill 開始前に audit 用 sub-directory を作成（既存 audit と分離）
mkdir -p projects/PRJ-019/app/audit/logs/drill-1-$(date +%Y%m%d-%H%M%S)
mkdir -p projects/PRJ-019/app/audit/sessions/drill-1-$(date +%Y%m%d-%H%M%S)

# drill 終了後に通常 audit との混入を防ぐため一括 archive
tar czf projects/PRJ-019/reports/control-evidence/drill-1-evidence-$(date +%Y%m%d).tar.gz \
  projects/PRJ-019/app/audit/logs/drill-1-* \
  projects/PRJ-019/app/audit/sessions/drill-1-*
```

---

## 5. 合否判定基準

### 5.1 ハッピーパス合否

**Pass = 5 SLA 全達成 + 副作用ゼロ**

| 項目 | 判定 |
|---|---|
| Step 1 検知 < 1 分 | ✓ / ✗ |
| Step 2 通知 < 5 分 | ✓ / ✗ |
| Step 3 退避 < 30 分 | ✓ / ✗ |
| Step 4 rotate < 60 分 | ✓ / ✗ |
| Step 5 代替起動 < 4 時間 | ✓ / ✗ |
| 副作用 PRJ-001〜018 git diff = 0 行 | ✓ / ✗ |
| 副作用 organization/ git diff = 0 行 | ✓ / ✗ |
| 副作用 本番 Vercel deploy 0 件 | ✓ / ✗ |
| 副作用 本番 Supabase 行変更 0 件 | ✓ / ✗ |

**1 つでも ✗ → drill #1 Fail**

### 5.2 異常パス合否

**異常パス全 5 つで合否、3 つ以上 Pass で「異常パス Pass」、5 つ全 Pass が満点**

| パターン | 必須? | Pass 条件 |
|---|---|---|
| A: 警告メール先着 | 必須 | 警告検知 < 1 分、kill-switch 不発、P-E < 4 時間 |
| B: silent revocation | 必須 | ハッピーパスと同一 SLA 全達成 |
| C: rate limit 429 誤検知 | 必須 | kill-switch 不発、circuit-breaker のみ動作 |
| D: 通知 SLA 違反 | 推奨 | 自動エスカレーション動作 |
| E: P-E 起動失敗 | 推奨 | 手動対応で SLA 4h 以内回復 |

**A / B / C のいずれかが Fail → drill #1 Fail**

### 5.3 全体合否

| 状態 | 判定 |
|---|---|
| ハッピーパス Pass + 異常パス A/B/C すべて Pass | **drill #1 PASS** |
| ハッピーパス Pass + A/B/C のうち 1 つ Fail | **Conditional Pass**（3 日以内に該当パターンのみ再試行） |
| ハッピーパス Fail | **drill #1 FAIL** |
| 副作用検出（git diff 1 行以上） | **drill #1 FAIL + Critical 起票** |

### 5.4 Fail 時の対応

| Fail 種別 | 対応 |
|---|---|
| ハッピーパス SLA 違反 1 つ | 該当 Step の修正 → 3 日以内に再 drill |
| ハッピーパス SLA 違反 2 つ以上 | 設計レビュー → 1 週間以内に再 drill、Phase 1 着手 1 週間延期 |
| 副作用検出 | **即時 Critical 起票** + claude-code-company 復旧 + Phase 1 着手 NoGo |
| 異常パス A/B/C Fail | 該当パターン修正 → 3 日以内に再試行 |

---

## 6. drill 後のレポートテンプレ（`reports/ban-drill-1-result.md`）

drill 終了後、Dev が以下のフォーマットで起票:

```markdown
# PRJ-019 BAN drill #1 実施結果

- 実施日: 2026-05-13 (水)
- 実施時刻: HH:MM〜HH:MM JST
- 実施者: Dev (drill master) / Review (observer)
- 立会: CEO / Owner / PM
- 版: v1
- 関連: review-ban-drill-1-scenario.md v1

## 1. 実施サマリー
- 全体合否: PASS / Conditional Pass / FAIL
- ハッピーパス所要: __ 時間 __ 分
- 異常パス実施数: __ / 5

## 2. SLA 計測結果（ハッピーパス）

| Step | SLA | 実測 | 合否 |
|---|---|---|---|
| Step 1 検知 | < 1 分 | __ 秒 | P/F |
| Step 2 通知 | < 5 分 | __ 分 __ 秒 | P/F |
| Step 3 退避 | < 30 分 | __ 分 | P/F |
| Step 4 rotate | < 60 分 | __ 分 | P/F |
| Step 5 代替起動 | < 4 時間 | __ 時間 __ 分 | P/F |

## 3. 異常パス結果

| パターン | 実施 | 合否 | 備考 |
|---|---|---|---|
| A: 警告メール先着 | Y/N | P/F | __ |
| B: silent revocation | Y/N | P/F | __ |
| C: rate limit 429 | Y/N | P/F | __ |
| D: 通知 SLA 違反 | Y/N | P/F | __ |
| E: P-E 起動失敗 | Y/N | P/F | __ |

## 4. 副作用ゼロ確認

| 確認項目 | 結果 |
|---|---|
| PRJ-001〜018 git diff | __ 行（0 が Pass） |
| organization/ git diff | __ 行 |
| 本番 Vercel deploy 件数 | __ 件（0 が Pass） |
| 本番 Supabase 行変更 | __ 件 |

## 5. 検出された問題（Critical / Major / Minor）
- Critical: __ 件
- Major: __ 件
- Minor: __ 件

## 6. drill 後アクション
- [ ] 修正必須項目（Critical / Major）
- [ ] 再 drill 必要性
- [ ] drill #2 (5/17) への持ち越し事項

## 7. 添付エビデンス
- audit log: `projects/PRJ-019/app/audit/logs/drill-1-{TIMESTAMP}/`
- session export: `projects/PRJ-019/app/audit/sessions/drill-1-{TIMESTAMP}/`
- 副作用 baseline diff: `reports/control-evidence/drill-1-baseline-diff-{TIMESTAMP}.txt`
- Slack 通知 archive: `reports/control-evidence/drill-1-slack-archive-{TIMESTAMP}.json`
- mock-claude log: `reports/control-evidence/drill-1-mock-claude-{TIMESTAMP}.log`

## 8. 関連
- 上流: `review-ban-drill-1-scenario.md` v1
- 連動: `review-w0-week1-pentest-scenarios.md` §6 (B6)
- DEC-019-014（BAN drill 訓練計画）
```

---

## 7. 既存 PRJ への副作用ゼロ確認手順

### 7.1 drill 開始前 baseline 取得

```bash
# T0 - 30 分 に実施
cd ~/Desktop/claude-code-company

# 1. PRJ-001〜018 の git status snapshot
for prj in PRJ-001 PRJ-002 PRJ-003 PRJ-004 PRJ-005 PRJ-006 PRJ-007 PRJ-008 \
           PRJ-009 PRJ-010 PRJ-011 PRJ-012 PRJ-013 PRJ-014 PRJ-015 PRJ-016 \
           PRJ-017 PRJ-018; do
  if [ -d "projects/$prj" ]; then
    (cd "projects/$prj" && git status --porcelain) > "/tmp/drill-1-baseline-$prj.txt" 2>&1 || true
    (cd "projects/$prj" && git rev-parse HEAD) > "/tmp/drill-1-baseline-$prj-head.txt" 2>&1 || true
  fi
done

# 2. organization/ の baseline
git status --porcelain organization/ > /tmp/drill-1-baseline-org.txt
md5sum organization/**/*.md > /tmp/drill-1-baseline-org-md5.txt

# 3. claude-code-company 全体の tar archive（破壊検知用 fallback）
tar czf /tmp/drill-1-baseline-snapshot.tar.gz \
  --exclude='node_modules' --exclude='.next' --exclude='dist' \
  ~/Desktop/claude-code-company/

echo "baseline OK: $(date)"
```

### 7.2 drill 終了後 verification

```bash
# T0 + 4h（drill 終了時）に実施
cd ~/Desktop/claude-code-company

# 1. PRJ-001〜018 への変更検知
fail_count=0
for prj in PRJ-001 PRJ-002 PRJ-003 PRJ-004 PRJ-005 PRJ-006 PRJ-007 PRJ-008 \
           PRJ-009 PRJ-010 PRJ-011 PRJ-012 PRJ-013 PRJ-014 PRJ-015 PRJ-016 \
           PRJ-017 PRJ-018; do
  if [ -d "projects/$prj" ]; then
    current=$(cd "projects/$prj" && git status --porcelain)
    baseline=$(cat "/tmp/drill-1-baseline-$prj.txt")
    if [ "$current" != "$baseline" ]; then
      echo "FAIL $prj: git status changed"
      diff <(echo "$baseline") <(echo "$current")
      fail_count=$((fail_count + 1))
    fi

    current_head=$(cd "projects/$prj" && git rev-parse HEAD)
    baseline_head=$(cat "/tmp/drill-1-baseline-$prj-head.txt")
    if [ "$current_head" != "$baseline_head" ]; then
      echo "FAIL $prj: HEAD moved from $baseline_head to $current_head"
      fail_count=$((fail_count + 1))
    fi
  fi
done

# 2. organization/ への変更検知
md5sum organization/**/*.md > /tmp/drill-1-after-org-md5.txt
if ! diff -q /tmp/drill-1-baseline-org-md5.txt /tmp/drill-1-after-org-md5.txt > /dev/null; then
  echo "FAIL organization/ files changed"
  diff /tmp/drill-1-baseline-org-md5.txt /tmp/drill-1-after-org-md5.txt
  fail_count=$((fail_count + 1))
fi

# 3. 本番 Vercel / Supabase 副作用確認（手動 + API）
# Vercel: vercel ls --token=$VERCEL_TOKEN_READONLY で本日の deploy 一覧
# Supabase: dashboard で本日の row 変更を確認

if [ "$fail_count" -gt 0 ]; then
  echo "DRILL FAILED: $fail_count side-effect detected"
  exit 1
fi
echo "副作用ゼロ確認 PASS"
```

### 7.3 drill 中の継続監視（observer タスク）

| 監視項目 | ツール | 頻度 |
|---|---|---|
| PRJ-001〜018 inotify | `inotifywait -mr projects/PRJ-001 ... projects/PRJ-018 -e modify -e create -e delete` | 連続 |
| organization/ inotify | `inotifywait -mr organization/ -e modify -e create -e delete` | 連続 |
| Vercel deploy webhook | Vercel webhook を `#clawbridge-drill-watch` channel に流す | リアルタイム |
| Supabase realtime | drill master の dashboard tab で監視 | 5 分ごと目視 |

**1 件でも検出 → drill 中断、Critical 起票**

### 7.4 復旧手順（万一の副作用検出時）

```bash
# 副作用検出が確認された場合、即座に baseline tar から復旧
cd /tmp
tar xzf drill-1-baseline-snapshot.tar.gz -C /tmp/drill-1-restore/

# 影響範囲の確認後、影響 PRJ ディレクトリのみ rsync で復元
# （全 restore ではなく、影響範囲のみ手動判定）

# 復旧後は CEO 経由で Owner に Critical 報告 + 副作用詳細レポート作成
```

---

## 8. drill #2（5/17 Sumi/Asagi 同居）との差分プレビュー

### 8.1 差分概要

| 項目 | drill #1（5/13、本書） | drill #2（5/17、別書） |
|---|---|---|
| 同居 PRJ | なし | Sumi (PRJ-012) + Asagi (PRJ-018) 同時稼働 |
| 主目的 | PRJ-019 単独 5 SLA 検証 | **既存 PRJ への副作用ゼロ + Sumi/Asagi 作業の保護** |
| 副作用検証範囲 | PRJ-001〜018 git diff | + Sumi 開発中ファイル / Asagi cron job 作業中状態 |
| BAN 影響範囲シミュレーション | PRJ-019 のみ停止 | **オーナー個人 Anthropic アカウント全停止 = Sumi/Asagi も同時停止** |
| Step 3 退避内容 | PRJ-019 worktree dummy commit のみ | + Sumi/Asagi 作業中ファイル git push（既存 PRJ の通常運用復帰経路） |
| 想定所要 | 4 時間 + 異常パス 2.5 時間 | 6 時間（Sumi/Asagi 作業継続性確認の追加検証含む） |
| 失敗時影響 | drill 再実施 + 3 日延期 | **Phase 1 着手 1 週間延期** |

### 8.2 drill #2 で新規追加される検証項目（プレビュー）

drill #2 の本格設計は別書で実施するが、本書では設計範囲外として以下のプレビューのみ提示:

#### 検証項目 P-1: BAN 連鎖停止の影響範囲確認
- Sumi (PRJ-012) の dev session が PRJ-019 BAN により強制停止された際、Sumi 側の作業データ（編集中の `.tsx`、未 commit 変更）が保護されるか
- 退避手順 Step 3 の中に「Sumi/Asagi 作業データ git push 自動化」を組み込む必要性

#### 検証項目 P-2: Sumi/Asagi 共有 Anthropic アカウントの分離可能性
- review-v2 §5「アカウント分離」が Phase 1 着手前に実装されているか
- 別 email / 別 Anthropic アカウントでの Sumi 用 token と PRJ-019 用 token が物理分離されているか
- 分離未完なら drill #2 で「BAN により全停止」が観測される（想定通り、しかし損失レンジ ¥500k〜¥2M の評価対象）

#### 検証項目 P-3: 業務継続性（BCP）の P-E 切替効果
- P-E フォールバックを Sumi/Asagi にも適用できるか
- API key 課金モードでの Sumi/Asagi 稼働コスト（drill #1 では PRJ-019 単独のため未検証）

### 8.3 drill #1 から drill #2 への持越し情報

drill #1 完了時に、以下を drill #2 設計者に申し送り:

| 項目 | 申し送り先 |
|---|---|
| drill #1 で発見した SLA ボトルネック | drill #2 設計で重点監視 |
| mock-claude スタブの使い勝手フィードバック | Dev タスク 2 改善要望 |
| 副作用ゼロ確認スクリプトの精度 | drill #2 でも同スクリプト活用、補強点があれば追加 |
| Slack / email 通知遅延の実測値 | drill #2 で通知 SLA 5 分の現実性再評価 |
| 異常パス D / E の自動エスカレーション動作 | drill #2 でも同パターン再演 |

### 8.4 drill #2 の準備タスク（drill #1 完了後すぐ）

| # | タスク | 担当 | 期限 |
|---|---|---|---|
| 1 | drill #2 シナリオ書 起案 (`review-ban-drill-2-scenario.md`) | Review | 5/14 |
| 2 | Sumi/Asagi の drill 中作業状態 baseline 取得手順 | Review + PM | 5/14 |
| 3 | アカウント分離状況の事前確認（review-v2 §5 進捗） | Review | 5/15 |
| 4 | Sumi 開発者（オーナー）の drill 立会調整 | PM | 5/15 |
| 5 | Asagi cron 一時停止手順の確認 | Dev | 5/16 |

---

## 9. CEO への提案（DEC-019-XXX 起票候補）

### 9.1 drill #1 用 dummy secret セットの恒久化
- 本書 §4.2 の dummy secret セットを Doppler `drill-1` namespace に **恒久配置**
- 以降の drill 反復実施で setup 工数を削減
- 起票案: **DEC-019-022（仮）** Review 起案、CEO 専決

### 9.2 mock-claude スタブの仕様追加（Dev タスク 2 への要請）
- 本書 §4.1 で定義した 5 シナリオ（normal / silent_revoke / auth_failed / rate_limit_429 / forbidden_403）を Dev が実装
- Dev タスク 2 の DoD に組み込む
- 起票案: **DEC-019-023（仮）** PM 起案、Dev 着手

### 9.3 drill #1 異常パス D / E の任意性
- 本書 §3.4 / §3.5 はオーナー指示で必須化されているが、4 時間枠での全パス実施はタイト
- 提案: D / E は drill #1 当日にハッピーパス完了後の残時間で実施、時間切れなら 5/14 持ち越し可
- 起票案: **DEC-019-024（仮）** Review 起案、CEO 専決

### 9.4 副作用検出時の自動 Critical 起票経路
- §7.2 で副作用検出時に「Critical 起票」とあるが、自動化された起票経路（GitHub issue 作成 + Slack mention）が未整備
- 提案: drill #1 までに最小限の自動起票を整備（不要なら手動でも可）
- 起票案: **DEC-019-025（仮）** Review 起案、Dev 工数判断

---

## 10. 既存 review-* との整合性チェック（自検）

| 既存ファイル | 整合性 |
|---|---|
| `review-w0-week1-pentest-scenarios.md` §6 (B6) | drill #1 ハッピーパスは pentest B6-04〜09 と重複、drill #1 で B6 完遂相当 |
| `review-v2-subscription-risk-and-fallback.md` §3.1 BAN 5 ステップ | 5 SLA 値（1 分 / 5 分 / 30 分 / 60 分 / 4 時間）と完全整合 |
| `review-control-implementation-plan.md` C-A-03 BAN drill 1 回目 | 5/13 期日と整合、本書がその実装書 |
| `review-w0-week1-meeting-agenda.md` §6.2 | 5/13 マイルストーン記述（5 ステップ SLA）と整合 |
| `review-tos-allowlist-dod-integration-v1.md` §4.1 G-Top-4 | P-E フォールバック起動仕様（CEO 即時承認）と整合、drill 内で動作確認 |

---

## 11. 関連ドキュメント

- 上流: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md` §6 (B6)
- 上流: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md` §3.1
- 上流: `projects/PRJ-019/reports/review-control-implementation-plan.md` C-A-03
- 上流: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md` §6.2
- 連動: `projects/PRJ-019/reports/review-tos-allowlist-dod-integration-v1.md` §4.1 G-Top-4
- 後続: `projects/PRJ-019/reports/ban-drill-1-result.md`（drill 終了後 Dev 起票）
- 後続: `projects/PRJ-019/reports/review-ban-drill-2-scenario.md`（drill #2 5/17 用、5/14 着手）
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-022〜025 起票候補）

---

**v1 確定**: 2026-05-03 / **次回更新**: ① mock-claude スタブ実装完了時、② drill #1 実施結果反映時 (5/13 18:00)、③ drill #2 シナリオ起案時 (5/14)
