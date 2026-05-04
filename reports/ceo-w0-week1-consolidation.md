# PRJ-019 Clawbridge — W0-Week1 CEO 連結報告（オーナー宛）

- 案件: PRJ-019 Clawbridge（Open Claw を自律オーナーとする AI 組織ハーネス基盤）
- 起票: CEO（`/ceo`）
- 報告日: 2026-05-03
- 対象期間: W0-Week1（2026-05-02〜2026-05-08）
- 報告先: オーナー
- 関連決裁: DEC-019-005〜013（W0 着手承認）、本書で DEC-019-014〜017 起票

---

## 0. エグゼクティブサマリ（300字）

W0-Week1 の3部署並列発注（Dev / Research / Review）が想定通り着地。**Dev はハーネス基盤 9 コントロールを TypeScript pnpm monorepo で完成**（67 テスト全緑、Windows 11 / Node 24.11.1 実機検証済）。**Research は OP-1〜OP-5 裏取り完了**、Phase 1 月 30〜90 ループは Codex/Claude/Sandbox 全 cap で実装可能と確定、ただし真のボトルネックは **Claude Max 20x weekly cap（Sumi/Asagi 同居込み）** と特定、H-09 監視追加を要請。**Review は 5/8 18:00 W0-Week1 検収会議の準備一式（チェックリスト + ペネトレシナリオ B1〜B6 + 議題）が完了**、5 完全 Pass + 2 条件付き Pass を着地予測。本書で **DEC-019-014（W0-Week1 進捗承認）/ 015（H-09 weekly cap 監視追加）/ 016（Vercel コスト上限 $20→$46 上方修正）/ 017（Hobby→Pro 昇格判断を W3 中盤に格上げ）** を起票。Phase 1 着手 (5/19) の確度は **強い条件付き Go のまま維持**、進捗 15%→**25%** に更新。

---

## 1. Dev 部署成果（実装側、進捗 0%→100% / W0-Week1 範囲）

### 1.1 着地サマリ
| 区分 | 状況 |
|---|---|
| Monorepo セットアップ（TypeScript + pnpm workspaces 7 packages） | 完了 |
| Harness 制御層（cost-tracker / kill-switch / hitl-gate / circuit-breaker / usage-monitor） | 完了・38 ユニットテスト全緑 |
| claude-bridge（spawn / stream-json-parser / auth-detector） | 完了・29 ユニットテスト全緑 |
| `pnpm install` / `pnpm typecheck` / `pnpm test` | 全通過（8 ファイル / 67 ケース緑、Windows 11 / Node 24.11.1 / pnpm 9.12.0） |
| openclaw-runtime ラッパ実装 | W0-Week2 持越し（vendor/ 雛形のみ） |
| docs / app/README / Live integration test | W0-Week2 持越し |

### 1.2 達成した必須コントロール 9 項目（v3 28 項目より）
G-01（4 層コスト上限）/ G-02（緊急停止）/ G-04（HITL 5 ゲート）/ G-05（サーキットブレーカ）/ G-06（レート異常 → kill）/ G-08（連続稼働 12h 上限）/ G-V2-03（OAuth 直 spawn 全面禁止）/ G-V2-08（401/403/429 連続検知 → kill、G-06 と同源）/ **G-V2-11（OAuth トークン到達禁止: auth-detector が credentials.json を読まず stat() のみ、env から ANTHROPIC_API_KEY / OPENAI_API_KEY / `*secret*` をブロック、テストで実証）**

### 1.3 主要設計判断（参考）
1. **Windows プロセスツリー kill** = `shell:true` で起動した cmd.exe SIGTERM では grandchild の node が残る → `taskkill /T /F` を組み込み、timeout テストが Windows 上で 6 秒以内完了。
2. **vitest workspace alias** でビルド不要のテスト実行、CI 高速化。
3. **env allow-list 方式** = secret 系 block-list ではなく、PATH / USERPROFILE 等の必要 env のみ allow list。defense-in-depth で extraEnv にも secret 名チェック重ね掛け。
4. **cost-tracker のカテゴリ分離** = `anthropic_api` / `anthropic_subscription` / `openai_api` / `openai_subscription` を区別、サブスク経由は `total_cost_usd` を「参考値」として記録（実課金とは独立）。
5. **auth-detector の non-zero exit ロジック修正** = 実装時に発見したロジック穴を即修正、`cliFound=false` 扱いで `authenticated=false` 確定。

### 1.4 W0-Week2 持越（優先順）
1. `claude-bridge` live integration test 1 回実行（オーナー OAuth で実機 `claude -p`、stream-json schema 実証、$0.10 上限）
2. openclaw-runtime ラッパ skeleton + mock（`src/wrapper.ts` + tests）
3. `app/docs/architecture-w0.md`（Mermaid アーキ図 + W0 vs W1+ scope）
4. `app/docs/security-w0.md`（9 コントロール実装エビデンス + BAN フォールバック手順）
5. `app/README.md` 更新（monorepo セットアップ + ワークスペース進捗 + W0 完了基準）
6. Review チェックリストとの突合
7. HITL gate Slack/メール通知（`notify/` ワークスペース）
8. `scripts/verify-zero-side-effect.sh`

### 1.5 既存 PRJ への影響
- **PRJ-001〜PRJ-018 のコード・ドキュメント・成果物に一切の変更なし**（zero modification 原則遵守、grep ベースで確認済）。

---

## 2. Research 部署成果（OP-1〜OP-5 裏取り、Phase 1 実装可能性最終評価）

### 2.1 cap 確定数値（一次情報・公式）
| Cap | 確定値 | 備考 |
|---|---|---|
| **Codex Pro $200 5h Local Messages** | 通常 300〜1,600 / 5h、5/31 まで 600〜3,200 / 5h（2x ボーナス） | developers.openai.com/codex/pricing 公式、Plus 比 20x（promo 中 25x） |
| **Codex Pro $200 weekly cap** | 数値非公開、過去 30 日 4.1 turns/日 軽使用で **94% 残** | OpenAI 公式が discretion 留保 |
| **Claude Max 20x 5h** | 約 900 messages / 5h | 独立検証実測（intuitionlabs / tokenmix） |
| **Claude Max 20x weekly cap（all-models）** | あり、数値非公開、planning band 240〜480 Sonnet-hours/週 | claude.com/pricing 公式 |
| **Claude Max 20x weekly cap（Sonnet-only）** | 別系統で存在、数値非公開 | 同上 |
| **Vercel Sandbox Hobby** | 5h CPU/月、420 GB-h/月、5,000 creates/月、20 GB transfer/月、同時 10 個、最大 45 分ランタイム | vercel.com/docs/vercel-sandbox/pricing 公式 |
| **Vercel Sandbox Pro 単価** | CPU $0.128/h、Memory $0.0212/GB-h、$20 クレジット込み | 同上 |

### 2.2 Phase 1 月 30〜90 ループの実装可能性: **YES（条件付き）**
| Cap | Phase 1 消費 | 残量 | 判定 |
|---|---|---|---|
| Codex Pro $200 5h | 30〜150 msgs/日 | 下限 300/5h でも 50% 以下 | **十分余裕** |
| Codex weekly | 推測ベース | 軽使用ベースで月後半まで余裕 | **十分余裕** |
| Claude Max 20x 5h | 9〜18 件/ウィンドウ | Sumi/Asagi 同居で実効 70% = 630 msgs/5h | **OK**（H-09 監視追加） |
| Claude Max 20x weekly（all-models） | 月 200〜300 hours 想定 | planning band 内だが Sumi/Asagi 活動量次第で月後半枯渇可能性 | **要監視** |
| Vercel Sandbox Hobby 5h CPU | 月 5〜90 hr | 控えめ案で内、中央値以上で超過 | **Pro 昇格を W3 中盤で予定** |
| Vercel Sandbox 同時 10 個 | 1〜3 案件並列 | 30% 利用 | **十分余裕** |

### 2.3 真のボトルネック: **Claude Max 20x weekly cap（all-models）**
- Anthropic が意図的に数値非公開、運用設計が他より難しい
- Sumi/Asagi と PRJ-019 Phase 1 が同プール → 月後半に Sumi/Asagi スパイクで PRJ-019 が突如停止する構造リスク
- 5h cap は事前分散で対処可能、weekly cap は 7 日間規模の停止
- cap 到達時 extra usage 課金で続行可能（公式機能、support.claude.com/articles/12429409）だが PM v3 §A6.5 で月 +$30〜50 想定 → CEO 決裁要

### 2.4 PM v3 への要請事項
- **H-09（新規）**: Claude Max weekly cap 使用率を毎日 09:00 / 21:00 JST 記録、80% で警告、95% で PRJ-019 自律ループ自動 pause（Sumi/Asagi 優先）。実装 = `cost_check` skill が Anthropic Console scrape or Claude Code `/usage` コマンド出力をパース。
- **H-10（新規）**: extra usage 課金を Phase 1 では原則 OFF、突発時のみ CEO 決裁で ON。

### 2.5 OP-3 Vercel コスト上限の上方修正提案
| ケース | PM v3 既存 | 本書修正提案 |
|---|---|---|
| Hobby 内収束（控えめ） | $0 | $0（変更なし） |
| Pro 昇格 + 中央値 | $5 | $20（$20/月クレジット込みで実質 $0、超過時のみ） |
| Pro 昇格 + 上限 | $20 | **$46**（Sandbox $26 + Hosting Pro $20） |

### 2.6 OP-5 Open Claw OSS 上流の最新状態
- 上流 `openclaw/openclaw`: **README が「a personal AI assistant you run on your own devices」に再ポジション**（third-party harness の明示推奨ではない）。40,153 commits、3.3k open issues。本件のような自律ハーネス用途は第一級ユースケースとして示されていない。
- 連携プラグイン `Enderfga/openclaw-claude-code`: **v2.14.1 (2026-04-29) 最新リリース、Open Issues 0 / Open PRs 0**、対応 Claude Code CLI 2.1.121+。本件 Phase 1 着手前提として活発・安定。
- BAN 関連: 2026-04-10 Steinberger 一時 BAN 以降、新規報告なし（GitHub Issues / HN / Reddit 網羅）。OAuth silent revocation パターンは継続観測。

---

## 3. Review 部署成果（5/8 W0-Week1 検収会議準備）

### 3.1 提出物 3 件
- `review-w0-week1-verification-checklist.md`（7 項目検証チェックリスト）
- `review-w0-week1-pentest-scenarios.md`（B1〜B6 ペネトレシナリオ、計 45 試行）
- `review-w0-week1-meeting-agenda.md`（5/8 18:00 議題、90 分構成）

### 3.2 検収判定の事前予想（5/8 18:00 会議で実測更新）
| 区分 | 件数 | 該当 ID |
|---|---|---|
| **完全 Pass 想定** | 5 項目 | G-04 / G-05 / G-08 / G-V2-03 / G-V2-11 |
| **条件付き Pass 想定**（オーナー Console Spend Cap 設定 5/18 期限待ち） | 2 項目 | G-01 / G-06 |

### 3.3 最難関の検証: G-V2-11 緊急停止
- 4 トリガー経路（CLI / API / 物理 STOP ファイル / 自動発火）すべて 30 秒 SIGKILL SLA を満たすことを検証
- OS-cross 動作確認（Windows 11 / WSL2 / 将来的に Linux サーバ）
- cleanup hook の発動順序（cost-tracker → usage-monitor → claude-bridge subprocess kill → 監査ログ flush）が決定論的であること

### 3.4 Dev への 5/8 までの依頼 Top 3
1. **5/8 12:00 までに 7 項目の単体検証エビデンス提出**（`reports/control-evidence/G-XX-evidence.md`）
2. **5/6 までに mock-claude スタブ + libfaketime（時刻操作） を整備**（B5 連続稼働超過シナリオ検証用）
3. **kill-switch.ts cleanup hook の発動順序仕様を明文化**（5/8 までに `app/docs/security-w0.md` ドラフト）

### 3.5 NoGo 条件（重要）
- **B2 ファイルシステム破壊で 1 件でも書込が成功 → 即時 W0-2 週進行 NoGo**（既存 PRJ への副作用検出時は claude-code-company 復旧手順を即発動）
- **B3 secret 漏洩で 1 件でも本物 secret 漏洩 → 即時 Critical 起票 + 関連 secret rotate**

---

## 4. CEO 決裁（本書で起票）

### 4.1 DEC-019-014: W0-Week1 進捗承認
**決定**: W0-Week1（2026-05-02〜05-08）の 3 部署並列発注成果（Dev / Research / Review）を**承認する**。

**根拠**:
- Dev: 67 テスト全緑、9 コントロール（G-01/02/04/05/06/08/V2-03/V2-08/V2-11）が実装レベル達成、既存 PRJ-001〜018 への副作用ゼロ確認済
- Research: OP-1〜OP-5 全裏取り完了、Phase 1 月 30〜90 ループ実装可能性「YES（条件付き）」確定
- Review: 5/8 18:00 検収会議準備完了、5 完全 Pass + 2 条件付き Pass 着地予測

**含意**:
- W0-Week2（5/9〜5/15）残 14 項目（G-02 CLI 統合 / G-07 secret 隔離 / G-09 監査ログ / G-10 multi-channel alert / G-11 公開可能アプリ allowlist / G-12 副作用ゼロ証明 / G-V2-01/02/04/08/09/12 / C-A-01/02/05）を予定通り着手
- Dev 持越し 8 件は W0-Week2 中に完遂、Live integration test は 5/9 に最優先実行

### 4.2 DEC-019-015: H-09 Claude Max weekly cap 監視追加（PM v3 修正）
**決定**: PM v3 にコントロール **H-09**（Claude Max weekly cap 80% 警告 / 95% 自動 pause）を追加発令する。

**仕様**:
- 監視頻度: 毎日 09:00 / 21:00 JST（自動、または手動でも可）
- データソース: ① Anthropic Console usage page scrape、② Claude Code `/usage` コマンド出力パース、いずれか入手可能な側
- 80% 到達 = Slack / メール警告（Sumi/Asagi 開発オーナーにも通知）
- 95% 到達 = PRJ-019 自律ループ自動 pause（Sumi/Asagi 優先確保）
- 実装期限: W2 終了 (2026-05-30)、cost_check skill 拡張で実装

**根拠**: Research §3.3 / §7.2 で Claude Max 20x weekly cap（all-models）を Phase 1 真のボトルネックと特定。Sumi/Asagi 同居（DEC-019-011 オプション A 採用）の構造的リスクを物理レベルで監視・抑制する必要がある。

### 4.3 DEC-019-016: Vercel Sandbox コスト上限の上方修正
**決定**: PM v3 §A1.3 / §A2.1 の Vercel Sandbox 想定コストを以下に**上方修正**する。

| ケース | 旧（PM v3） | 新（本決裁） |
|---|---|---|
| 控えめ（Hobby 内） | $0 | $0 |
| 中央値（Pro 昇格） | $5 | $20（$20 クレジット込みで実質 $0） |
| 上限ケース | $20 | **$46**（Sandbox 課金 $26 + Hosting Pro $20） |

**根拠**: Research §4.4 / §4.5 で公式 pricing（vercel.com/docs/vercel-sandbox/pricing 2026-03-14 更新）を再検証。月次予算 $300 ハードキャップ（DEC-019-012）には収まる範囲だが、コスト計画の現実性を確保。

### 4.4 DEC-019-017: Vercel Hobby→Pro 昇格判断タイミングを W3 中盤に格上げ
**決定**: Vercel Sandbox の **Hobby→Pro 昇格判断は Phase 1 W3 中盤（2026-06-03 頃）に CEO 決裁**で行う。

**判断材料**:
- W1〜W2 の Sandbox CPU 実消費（毎週末に Dev が集計報告）
- Hobby 5h CPU 月次に対する消費率（70% 超過で昇格、未満なら継続）
- 同時実行 10 個 / 最大 45 分ランタイムへの抵触履歴

**根拠**: Research §4.4 で「中央値ケース（月 60 ループ× 10 分× 2vCPU = 20 hr）で Hobby 4 倍超過」が判明。控えめケースは Hobby 内で完結するため、実消費に応じた段階移行が予算最適化に資する。

---

## 5. 進捗とマイルストーン

### 5.1 進捗更新
- PRJ-019 全体: **15% → 20% → 25%**（W0-Week1 ハードガード基盤完成 + Research OP-1〜5 完遂分）
- W0 完了率: **約 50%**（W0-Week1 ハードガード基盤 9 / 残コントロール 14 + 副作用ゼロ証明 + BAN drill 2 回）

### 5.2 直近マイルストーン
| 日付 | イベント | 主担当 |
|---|---|---|
| 2026-05-06 | mock-claude スタブ + libfaketime 整備 | Dev |
| 2026-05-08 12:00 | 7 項目検証エビデンス提出締切 | Dev |
| 2026-05-08 18:00 | **W0-Week1 検収会議**（90 分、Go/NoGo 判定） | CEO 議長 |
| 2026-05-09 | Live integration test 実行（オーナー OAuth $0.10 上限）/ ToS allowlist v1 確定 | Dev / Review |
| 2026-05-10 | ToS allowlist DoD 統合完了 | Review + Dev |
| 2026-05-12 | C-A-04 使用量モニタリング運用開始 / サンプルニーズ 3〜5 候補抽出（whitelist 内） | Dev / Research |
| 2026-05-13 | **BAN drill #1**（PRJ-019 単独、Sumi/Asagi アイドル）| Dev + Review |
| 2026-05-15 | C-A-01 Sumi/Asagi 完全バックアップ + 退避手順書 / OAuth 隔離 / CB-O-05 Doppler 登録 | Dev + オーナー |
| 2026-05-17 | **BAN drill #2**（Sumi/Asagi 同居前提）| Dev + Review |
| 2026-05-18 18:00 | **W0 完了 Go/NoGo 最終判定会議** + オーナー Spend Cap 設定（Anthropic Hard $50 / OpenAI Hard $20）| CEO + オーナー |
| 2026-05-19 | **Phase 1 W1 公式キックオフ** | 全部署 |
| 2026-05-30 | DEC-019-008（NG-3 12h/日 + $1,000/月 自動停止）オーナー再確認 | CEO + オーナー |
| 2026-05-31 | Codex Pro $200 2x ボーナス終了 → 通常 20x 復帰確認 | Research |
| 2026-06-13 | Phase 1 完了 + Phase 2 Go/NoGo 別決裁 | CEO + オーナー |

---

## 6. オーナー残タスク（再掲）

| ID | 内容 | 期限 | 状態 |
|---|---|---|---|
| CB-O-05 | 1Password Vault 4 系統（`Clawbridge-Master/Dev/Notify/Public`）または Doppler 登録 | 5/15 | 未着手 |
| GO-Anthropic | Anthropic Console Spend Cap（Hard $50 / Soft $40 / Per-request $0.50）設定 | 5/18 | 未着手 |
| GO-OpenAI | OpenAI Platform Spend Cap（Hard $20）設定 | 5/18 | 未着手 |
| Live test 立会 | claude-bridge live integration test 実行時の OAuth セッション提供（$0.10 上限） | 5/9 | 未着手 |
| Spend Cap screenshot | 上記 2 件設定後、screenshot を `reports/control-evidence/` に提出 | 5/18 | 未着手 |

---

## 7. リスクの状態

| ID | 内容 | 状態（5/3 時点）| 備考 |
|---|---|---|---|
| R-019-06 | BAN 確率 30〜60%/12 ヶ月 | **継続監視**（軽減策稼働中、新規報告なし） | OAuth silent revocation 継続観測 |
| R-019-07 | Codex 2x プロモボーナス 5/31 終了で枠半減 | **影響軽減確定**（Pro $200 通常 20x で十分余裕） | Research §2.4 / §5.3 |
| R-019-08 | PRJ-018 並走リソース食合い | **継続監視**（dashboard 反映済） | PM v2 §3.4.1 配分マトリクスで管理 |
| R-019-09 | NG-3 12h/日 とオーナー要望「人間不在の完全自動化」一部不整合 | **継続監視**（5/30 オーナー再確認） | DEC-019-008 暫定値で運用中 |
| R-019-10（新規）| Claude Max 20x weekly cap で月後半 PRJ-019 自動停止可能性 | **DEC-019-015 H-09 で軽減着手** | 80% 警告 / 95% pause |
| R-019-11（新規）| Vercel Hobby Sandbox 5h CPU 月次超過 | **DEC-019-016 + 017 で対応** | W3 中盤に Pro 昇格判断 |

---

## 8. 結論と次アクション

### 8.1 結論
- W0-Week1 は **計画通り着地**、Phase 1 着手 (5/19) の確度を **強い条件付き Go のまま維持**。
- 真のボトルネックは Claude Max 20x weekly cap（Sumi/Asagi 同居）と確定 → DEC-019-015 H-09 監視で軽減。
- Vercel コスト上限を $20→$46 に上方修正（DEC-019-016）、Hobby→Pro 昇格判断は W3 中盤格上げ（DEC-019-017）。

### 8.2 オーナーへの判断要請
1. **DEC-019-014（W0-Week1 承認）/ 015 / 016 / 017** の起票で良いか確認
2. オーナー残タスク 5 件（特に Spend Cap 5/18 期限）の着手見込み
3. 5/8 18:00 W0-Week1 検収会議へのオブザーバー出席可否
4. 5/30 NG-3 オーナー再確認の前準備として、Phase 1 W2 までの実消費データ確認方針

### 8.3 次の CEO アクション
- 5/8 18:00 W0-Week1 検収会議の議長進行（Review が議事進行支援）
- 5/8 22:00 までに本書を更新版 `ceo-w0-week1-consolidation-v2.md` として再発行（実検収結果反映）
- 5/13 BAN drill #1 結果確認 → DEC-019-018 想定（drill 合否判定）

---

## 9. 添付参照

- Dev 実装報告: `projects/PRJ-019/reports/dev-w0-week1-implementation-report.md`
- Research OP-1〜5: `projects/PRJ-019/reports/research-w0-supplement-op1-op5.md`
- Review 検証チェックリスト: `projects/PRJ-019/reports/review-w0-week1-verification-checklist.md`
- Review ペネトレシナリオ: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- Review 5/8 議題: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`
- 既存決裁: `projects/PRJ-019/decisions.md`（DEC-019-001〜013、本書で 014〜017 起票）

以上、CEO 連結報告（W0-Week1）。
