# PRJ-019 オプション A 採用に伴う追加コントロール仕様 (C-A-01〜05)

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: レビュー部門（品質管理）
- 作成日: 2026-05-03
- 作成者: Review Agent (claude-code-company)
- 版: v1
- 関連決裁: DEC-019-011（オプション A 採用）/ DEC-019-013（C-A-01〜05 発令）

## 0. 文書の位置づけ

### 0.1 目的
DEC-019-013 で CEO が発令した緩和策 C-A-01〜05 を、**実装可能な仕様 + 担当 + 期限 + Review 検収基準**まで具体化する。

### 0.2 オプション A 採用の前提（DEC-019-011 再確認）
- 既存 claude.ai アカウントを Phase 1 でも継続使用
- BAN 時に Sumi (PRJ-012) / Asagi (PRJ-018) 開発巻き添えリスクを**受容**
- 緩和策として C-A-01〜05 を**着手前必須**として実装

### 0.3 既存必須コントロール v2 との関係
- v2 23 項目（実装計画書 §1.2）に C-A-01〜05 を**新規 5 項目追加 → 計 28 項目**
- Phase 1 着手前必須は v2 21 項目から **24 項目** に増加
- W1 進行中整備は 2 項目で変わらず（G-V2-06 / G-V2-07）

---

## 1. C-A-01: Sumi/Asagi 作業データ完全バックアップ

### 1.1 仕様

| 項目 | 内容 |
|---|---|
| **何を** | (a) PRJ-012 Sumi の全 git 管理対象 (`projects/PRJ-012/**`)、(b) PRJ-018 Asagi の全 git 管理対象 (`projects/PRJ-018/**`)、(c) 両 PRJ で使用中の Anthropic セッション履歴 export、(d) Supabase 等の DB スナップショット、(e) Vercel 等の deploy artifact metadata、(f) ローカル `.env` 系の secret 一覧（値は別 vault に保管、ファイル名のみ記録） |
| **いつまでに** | **2026-05-15 (W0-2 週末) まで**に初回完全バックアップ完了 |
| **どこに** | (1) GitHub private repo `claude-code-company-backup` (force push 不可、tag immutable)、(2) 別リージョンのオブジェクトストレージ (S3 or R2) に nightly 暗号化 dump、(3) ローカル外付け SSD (オフライン保管) を最低 1 回／週 |
| **どうやって** | ① `git push --tags origin main` で tag `pre-prj019-w0` を打つ、② `claude` CLI のセッション export 機能 (`.claude/projects/*/.../*.jsonl`) を `tar.zst` で圧縮 + GPG 暗号化、③ Supabase `pg_dump` を nightly cron、④ Vercel project metadata を `vercel inspect` で snapshot |
| **頻度** | 初回フル + W0 中 daily incremental + Phase 1 中も daily |

### 1.2 検証方法（リストア drill）
- W0 中 (5/13 想定) に**バックアップから別ディレクトリにリストア**し、PRJ-012 / PRJ-018 の最新コミットを git show で確認
- リストア所要時間 SLA: **30 分以内** (オフライン SSD なら 60 分以内)
- リストア後の git log / hash が source と完全一致することを Review が独立確認

### 1.3 担当・タスク ID・期限
- **担当**: 開発部門
- **タスク ID**: CB-D-W0-23（新規）
- **期限**: 2026-05-15 (初回完全バックアップ + リストア drill 完了)

### 1.4 Review 検収基準
| # | 基準 | 合否 |
|---|---|---|
| 1 | バックアップ対象 6 種類 (a〜f) すべての保存場所が文書化済 | Pass / Fail |
| 2 | 3 系統 (GitHub backup repo / 別リージョン obj storage / オフライン SSD) すべてに最新版が存在 | Pass / Fail |
| 3 | リストア drill が 30 分以内に完了 | Pass / Fail |
| 4 | リストア後の git hash が source と完全一致 | Pass / Fail |
| 5 | secret 値が誤って backup repo に commit されていない (gitleaks 通過) | Pass / Fail |
| 6 | 暗号化バックアップの復号鍵が**オーナーのみ保持** (1Password / オフライン媒体) | Pass / Fail |

**総合**: 6 項目すべて Pass で C-A-01 検収完了。1 つでも Fail なら差し戻し。

---

## 2. C-A-02: BAN 検知時 Sumi/Asagi 退避手順書

### 2.1 仕様

#### 退避ステップ（Sumi/Asagi 観点で再構成）

| Step | 内容 | SLA | 自動化レベル |
|---|---|---|---|
| **S1: 検知** | Anthropic 401/403/429 / 警告メール / silent revoke のいずれかを検知 (G-V2-08 + heartbeat) | < 1 分 | 完全自動 |
| **S2: PRJ-012 / PRJ-018 の安全停止** | 両 PRJ で進行中の `claude` セッションを SIGKILL、未保存 prompt は監査ログに緊急 dump | < 5 分 | 完全自動 |
| **S3: API キーフォールバック切替** | `ANTHROPIC_API_KEY` 環境変数を Sumi/Asagi 起動 wrapper に注入し、両 PRJ で `claude --bare -p` モードに切替 | < 15 分 | 半自動 (env 切替スクリプト + 動作確認 1 タスク完走で本切替) |
| **S4: バックアップ確認** | C-A-01 のバックアップから両 PRJ の最新状態をリストア可能であることを再確認 (差し戻しのため) | < 30 分 | 半自動 |
| **S5: ユーザー通知** | PRJ-012 利用ユーザー (オーナー本人 + 関係者) に「機能継続中、フォールバック発動」通知。PRJ-018 同様 | < 60 分 | 手動 (テンプレあり) |

**切替時間 SLA: < 15 分** (S3 完了まで)

#### 手順書フォーマット

```
projects/PRJ-019/reports/runbooks/sumi-asagi-evacuation-runbook.md
```

| セクション | 内容 |
|---|---|
| 1. 前提 | BAN 検知シナリオ (silent revoke / 警告メール / 一斉 ban の 3 系統) |
| 2. 検知トリガー | 自動 alert ID とその閾値 |
| 3. 即時対応 5 ステップ | S1〜S5 を 1 ステップ 1 ページ、コマンド逐語、Slack 通知文テンプレ込み |
| 4. ロールバック条件 | フォールバック失敗時の完全停止判断 (CEO 経由) |
| 5. 関係者連絡先 | オーナー / CEO / Review / Dev の連絡手段 (Slack / Telegram / SMS) |
| 6. 復旧手順 | Anthropic 復旧後の OAuth 再切替手順 (逆順) |
| 7. 過去事例 | drill 結果 + 実 BAN 事例があれば追記 |

### 2.2 担当・タスク ID・期限
- **担当**: レビュー部門 (起案) + 開発部門 (S3/S4 自動化スクリプト)
- **タスク ID**: CB-S-W0-06（新規）+ CB-D-W0-24（新規, S3/S4 自動化）
- **期限**: 2026-05-15 (手順書 v1 完成 + drill 1 回成功)

### 2.3 Review 検収基準
| # | 基準 |
|---|---|
| 1 | 手順書が 5 ステップすべてを逐語コマンド付きでカバー |
| 2 | S3 切替時間が**実測 15 分以内**（drill 結果） |
| 3 | フォールバック中の Sumi/Asagi 機能が**実用品質を維持**（ベンチマーク：単純コード生成 1 タスク完走） |
| 4 | API キーの billing cap が事前設定済 ($300/月 hard cap) |
| 5 | drill 中に Sumi/Asagi の作業データ損失ゼロ |
| 6 | 復旧手順 (逆順 OAuth 再切替) が文書化済 |

---

## 3. C-A-03: BAN drill 2 回実施

### 3.1 仕様

#### Drill 1 回目: Phase 1 単独 drill（W0 中盤）
| 項目 | 内容 |
|---|---|
| **実施日** | 2026-05-13 (火) (W0-2 週中盤) |
| **対象** | PRJ-019 単独。Sumi/Asagi は drill 対象外 (アイドル状態) |
| **シナリオ** | BAN 検知 → 5 ステップ (検知 < 1 分 / 通知 < 5 分 / 退避 < 30 分 / rotate < 60 分 / 代替起動 < 4 時間) |
| **合格基準** | 必須コントロール実装計画 §4.3 のとおり全 5 項目 SLA 内達成 |

#### Drill 2 回目: Sumi/Asagi 同居前提 drill（W0 後半）
| 項目 | 内容 |
|---|---|
| **実施日** | 2026-05-17 (土) (W0-3 週中盤) |
| **対象** | PRJ-019 + PRJ-012 Sumi + PRJ-018 Asagi の同居環境 |
| **シナリオ** | (a) BAN 検知 → PRJ-019 即停止、(b) C-A-02 退避手順発動 (Sumi/Asagi の API キーフォールバック切替)、(c) PRJ-019 代替起動 (P-A) |
| **合格基準** | (1) PRJ-019 5 ステップ SLA 達成 + (2) Sumi/Asagi 切替 15 分以内 + (3) Sumi/Asagi 機能継続 (ベンチマーク 1 タスク完走) + (4) 作業データ損失ゼロ |

### 3.2 各 drill の合格基準サマリ
| # | 基準 | Drill 1 | Drill 2 |
|---|---|---|---|
| 検知 < 1 分 | ◯ | ◯ |
| 通知 < 5 分 (Slack/TG/SMS 全 3 channel) | ◯ | ◯ |
| 退避 < 30 分 | ◯ | ◯ |
| Secret rotate < 60 分 | ◯ | ◯ |
| 代替起動 < 4 時間 (P-A で 1 タスク完走) | ◯ | ◯ |
| Sumi/Asagi 切替 < 15 分 | — | ◯ |
| Sumi/Asagi 機能継続 (1 タスク完走) | — | ◯ |
| 作業データ損失ゼロ | ◯ | ◯ |

### 3.3 担当・タスク ID・期限
- **担当**: レビュー部門 (シナリオ設計・合否判定) + 開発部門 (環境準備・スクリプト実行)
- **タスク ID**: CB-S-W0-07 (Drill 1) / CB-S-W0-08 (Drill 2) / CB-D-W0-25 (環境準備)
- **期限**: Drill 1 = 2026-05-13、Drill 2 = 2026-05-17

### 3.4 不合格時の処置
| Drill | 不合格時 |
|---|---|
| Drill 1 不合格 | 3 日以内に再 drill。再 drill も不合格なら**Phase 1 着手 1 週間延期** |
| Drill 2 不合格 | **Phase 1 着手 NoGo (オプション A 撤回検討)**。オーナー再決裁要求 |

---

## 4. C-A-04: 使用量モニタリング

### 4.1 仕様

#### 取得対象
| 取得元 | 取得項目 | 頻度 |
|---|---|---|
| **Anthropic Console usage** | (a) request 数（5h ウィンドウ）、(b) token 数 (input/output)、(c) API 換算消費額 ($)、(d) plan 制限到達率 (%) | **毎日 1 回 export (08:00 JST)** |
| **ChatGPT Settings usage** | (a) Local Messages 消費 (5h ウィンドウ)、(b) Cloud Tasks 消費、(c) 週次累積消費 | **毎日 1 回 export (08:00 JST)** |
| **claude-code-company 内部 dashboard** | (a) PRJ-012 / PRJ-018 / PRJ-019 別の `claude` 起動回数、(b) prompt token 試算、(c) コスト按分 | リアルタイム + daily snapshot |

#### 取得方法
- **Anthropic**: Console UI に API 公開なし → **手動 CSV export → Supabase へ ingest** (W0 中は手動、W1 で半自動化)
- **ChatGPT**: 同上、Settings 画面の usage を手動 screenshot + 数値記録 (Codex CLI 内 `/status` 併用可)
- **内部 dashboard**: ハーネス監査ログ (G-09) を Supabase で集計、Metabase / Grafana で可視化

#### 異常検知ルール
| ルール | 閾値 | アクション |
|---|---|---|
| **R-01: 前日比急増** | 前日比 +50% 超 | Slack warn、Review が 2 時間以内に原因調査 |
| **R-02: 月次予算到達率** | 月次予算の 80% 到達 | Slack warn + CEO 通知、停止検討会議 24h 以内 |
| **R-03: 月次予算到達率** | 月次予算の 100% 到達 | **G-V2-09 で自動停止** (cost_check skill) |
| **R-04: Boris Cherny 線到達** | API 換算 $1,000/月相当 | 自動停止 (G-V2-09) |
| **R-05: 5h ウィンドウ枯渇** | 5h ウィンドウ 90% 連続 3 回到達 | Phase 1 縮退判断会議 |
| **R-06: silent revoke 兆候** | 401 突発発生 + Anthropic Console 正常 | C-A-02 退避手順発動 |

### 4.2 担当・タスク ID・期限
- **担当**: 開発部門
- **タスク ID**: CB-D-W0-26（新規）
- **期限**: 2026-05-12 (月) — W0 着手早期。CEO 指示の「5/12 期限」遵守

### 4.3 Review 検収基準
| # | 基準 |
|---|---|
| 1 | Anthropic / ChatGPT / 内部 dashboard の 3 系統すべてで daily export 動作確認 |
| 2 | R-01〜R-06 の異常検知ルールが all green (テストデータ流し込みで動作確認) |
| 3 | export データが Supabase append-only テーブルに正しく ingest |
| 4 | dashboard が CEO + オーナーから閲覧可能 (権限制御済) |
| 5 | R-03 / R-04 到達時の自動停止が**実機で動作** (シミュレーション) |
| 6 | export 失敗 (Anthropic API down 等) を fallback として手動入力可能な UI 整備 |

---

## 5. C-A-05: OAuth トークン保管隔離

### 5.1 仕様

#### 既存 OAuth 保管経路の調査と隔離設計
| OS | 既存保管場所 (推定) | Phase 1 ハーネス層からの隔離設計 |
|---|---|---|
| **Windows 11** | (1) `%APPDATA%\Claude\` 配下、(2) Windows Credential Manager (Credman)、(3) DPAPI 暗号化 BLOB | (a) ハーネス実行ユーザーを別 Windows ユーザーアカウント (`clawbridge_runner`) として作成、(b) `clawbridge_runner` から既存ユーザー `%APPDATA%` への ACL を deny、(c) Credman / DPAPI は OS ユーザー単位で分離されるため別ユーザーから読めない |
| **macOS** | (1) `~/.config/claude/credentials.json` (推定)、(2) Keychain `com.anthropic.claude.code` | (a) 別ユーザー `clawbridge_runner` を作成、(b) Keychain ACL で当該ユーザーから既存 entry へのアクセスを deny、(c) TCC profile で `~/.config` への read を deny |
| **WSL2 (Linux)** | (1) `~/.config/claude/`、(2) `~/.claude/credentials.json` | (a) 別 Linux ユーザー作成、(b) `chmod 700` で既存ユーザーホームから別ユーザーアクセス遮断、(c) AppArmor profile で読み取り deny |

#### Phase 1 ハーネスからの到達不可性検証
ハーネスプロセス (Open Claw / Codex / Vercel Sandbox) が **以下のいずれの方法でも OAuth トークンに到達できない**ことを Review がペネトレーション風シミュレーションで確認:
1. `cat ~/.config/claude/credentials.json` → permission denied
2. `cat /Users/<existing_user>/.config/claude/...` → permission denied
3. Windows: `reg query HKCU\...\Credentials` → access denied
4. macOS: `security find-generic-password -s "com.anthropic.claude.code"` → access denied
5. WSL2: `getent passwd | xargs -I {} ls /home/{}/.config/claude/` → permission denied (該当ファイル不可視)
6. ファイル検索 `find / -name "credentials*" 2>/dev/null` → ハーネスユーザー視点で OAuth credentials がヒットしない

#### Doppler への secret 移行範囲
| Secret 種別 | Doppler 投入 | 理由 |
|---|---|---|
| Anthropic OAuth トークン (Pro/Max) | **❌ 投入しない** | OAuth トークンは Doppler に入れた瞬間にハーネスから読めるリスクがあるため、**OS ユーザー単位の隔離 (Credman/Keychain) のみで管理** |
| Anthropic API キー (フォールバック用) | ✅ 投入 | フォールバック発動時のみハーネスが env 経由で読む |
| OpenAI ChatGPT Pro OAuth | ❌ 投入しない | 同上 |
| OpenAI API キー (フォールバック用) | ✅ 投入 | 同上 |
| GitHub PAT / Vercel Token / Supabase service_role | ✅ 投入 | ハーネスが直接消費するため Doppler 一元管理 |

### 5.2 担当・タスク ID・期限
- **担当**: 開発部門
- **タスク ID**: CB-D-W0-27（新規）
- **期限**: 2026-05-15 (W0-2 週末)

### 5.3 Review 検収基準（ペネトレーション風シミュレーション）
| # | 基準 |
|---|---|
| 1 | 別ユーザー / 別 ACL / TCC / AppArmor の隔離設計が文書化済 |
| 2 | 上記 6 項目のペネトレーション試行が**すべて access denied** で Review が独立検証 |
| 3 | Doppler に OAuth トークンが**入っていない**ことを Review が dump で確認 |
| 4 | API キーフォールバック発動時のみ env 経由で API キーが読み込まれることを実機確認 |
| 5 | 隔離設計が**Sumi/Asagi 開発の既存ユーザー OAuth セッションを破壊しない**ことを 5/14 までに確認 (重要、C-A-01 のリストア drill と並走) |
| 6 | ハーネスプロセスの実行 user / group / capability が least privilege 原則に従う |

---

## 6. 必須コントロール v3 (v2 → v3 差分)

### 6.1 v2 から v3 への増分
- **v2 合計**: 23 項目（Phase 1 着手前必須 21、W1 進行中整備 2、不採用 G-V2-05 を除く）
- **v3 合計**: **28 項目**（v2 23 項目 + C-A-01〜05 の 5 項目追加）
- **Phase 1 着手前必須**: v2 21 項目 → **v3 24 項目** (+3、C-A-01/02/05 が必須)
- **W0 中盤までに整備**: **+1**（C-A-04、5/12 期限）
- **W0 後半 drill**: **+2**（C-A-03 の Drill 1 が 5/13、Drill 2 が 5/17）
- **W1 進行中整備**: 2 項目（変わらず、G-V2-06 / G-V2-07）

### 6.2 v3 一覧表（v2 + 新規 5 項目）

| ID | 名称 | 区分 | 担当 | 期限 |
|---|---|---|---|---|
| (v2 G-01〜G-12 + G-V2-01〜04, 06〜12) | 既存 23 項目 | v2 既存 | Dev/Review | 2026-05-15 / W1 |
| **C-A-01** | Sumi/Asagi 完全バックアップ + リストア drill | **W0 着手前必須 (新規)** | Dev | 2026-05-15 |
| **C-A-02** | BAN 検知時 Sumi/Asagi 退避手順書 + 自動化スクリプト | **W0 着手前必須 (新規)** | Review (起案) + Dev (自動化) | 2026-05-15 |
| **C-A-03** | BAN drill 2 回 (5/13 単独 + 5/17 同居) | W0 中実施 (新規) | Review + Dev | 2026-05-13 / 2026-05-17 |
| **C-A-04** | 使用量モニタリング (Anthropic + ChatGPT + 内部 dashboard 3 系統) | W0 早期必須 (新規) | Dev | **2026-05-12** |
| **C-A-05** | OAuth トークン保管隔離 (OS ユーザー / ACL / Credman / Keychain / Doppler) | **W0 着手前必須 (新規)** | Dev | 2026-05-15 |

### 6.3 5/18 W0 Go/NoGo 会議の検収項目（v3 反映）
| # | 議題 | 判定基準 |
|---|---|---|
| 1 | v2 必須 21 項目の検収 | 全項目 Critical/Major ゼロ |
| 2 | C-A-01 完全バックアップ + リストア drill 検収 | §1.4 6 項目 all Pass |
| 3 | C-A-02 退避手順書 + 自動化検収 | §2.3 6 項目 all Pass |
| 4 | C-A-03 BAN drill 2 回結果 | Drill 1 + Drill 2 とも合格基準 (§3.2) 全項目 Pass |
| 5 | C-A-04 使用量モニタリング検収 | §4.3 6 項目 all Pass |
| 6 | C-A-05 OAuth 隔離ペネトレーション検収 | §5.3 6 項目 all Pass |
| 7 | 統合検証 (W0-3 週ベンチマークシナリオ 3 回連続成功) | コスト < $5/回、HITL 以外人間介入ゼロ |
| 8 | 副作用ゼロ証明 | PRJ-001〜018 git diff 全件 0 行、Vercel deployment 不変、Supabase row count 不変 |
| 9 | W1 進行中整備 2 項目の暫定運用承認 | Review 承認 + オーナー手動チェック運用確認 |
| 10 | **Go/NoGo 最終判定** | 1〜9 全項目で異議なし → Go、1 つでも条件未達 → NoGo |

### 6.4 v3 における不採用判定の変更なし
- v2 G-V2-05 (別アカウント分離) は**オプション A 採用に伴い引き続き不採用**
- 代替防御は v2 設計のまま (G-V2-11 + G-V2-09 + G-V2-02 + G-V2-07) + 新規 C-A-01〜05

---

## 7. 残存リスク（v3 でも消えない）

| ID | 残存リスク | スコア | 監視 |
|---|---|---|---|
| RR-A-01 | C-A-05 OAuth 隔離の zero-day escalation | Medium | OS パッチ適用週次、CVE 監視 |
| RR-A-02 | C-A-03 drill 合格でも実 BAN 時の人間判断ミス | Medium | 月次レビューで手順書見直し |
| RR-A-03 | C-A-04 使用量手動 export の漏れ | Low | daily 確認の Slack reminder |
| RR-A-04 | C-A-01 バックアップ復号鍵の物理紛失 | Low | 1Password + オフライン媒体二重化 |
| RR-A-05 | Sumi/Asagi 切替時の機能劣化 (API キーモードでの動作差異) | Medium | 月次ベンチマーク継続 |

---

## 8. 関連ドキュメント

- 必須コントロール v2: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`
- 必須コントロール実装計画: `projects/PRJ-019/reports/review-control-implementation-plan.md`
- ToS ドメイン分類: `projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md`
- 補完リサーチ: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- 意思決定: `projects/PRJ-019/decisions.md` (DEC-019-009〜013)
- 退避手順書 (作成予定): `projects/PRJ-019/reports/runbooks/sumi-asagi-evacuation-runbook.md`

---

**v1 確定**: 2026-05-03 / **次回更新**: ① C-A-01〜05 検収完了後の v1.1、② Drill 1/2 結果反映の v1.2、③ 5/18 W0 Go/NoGo 判定後の v1.3
