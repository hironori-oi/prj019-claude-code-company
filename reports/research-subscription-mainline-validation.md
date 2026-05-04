最終更新: 2026-05-03 / 起案: Research 部門 / 評価対象: DEC-019-050 + DEC-019-006 整合性

# PRJ-019 補追検証: subscription plan 主軸運用と DEC-019-006 P-D 改 整合性再評価

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 文書種別: 補追検証レポート（接続方式 × spend cap 整合性再評価）
- 関連 DEC: DEC-019-006（P-D 改採用）/ DEC-019-008（NG-3 暫定値 12h/$1,000）/ DEC-019-009（Pro $200 既契約）/ DEC-019-011（Anthropic アカウント A 採用）/ DEC-019-012（Spend Cap 設定）/ DEC-019-050（API spend cap $30/月確定）
- 上位レポート:
  - `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`（ToS / subscription 経路 1 次調査、586 行）
  - `projects/PRJ-019/reports/research-pd-revised-validation.md`（P-D 改 維持結論、290 行）
  - `projects/PRJ-019/reports/research-knowledge-and-transparency-design.md`（既存設計 1,049 行、$300 cap 前提の試算群）
- 結論: **DEC-019-006 P-D 改 維持**（変更不要、更に強化）
- 凡例: 公式 / 半公式 / 二次 / コミュニティ / 推測（DEC-019-021 と同義）

---

## 0. エグゼクティブサマリー（350 字）

DEC-019-050 で API spend cap が当初想定 $300 から $30/月 に 97% 下方修正された後の subscription plan 主軸運用について、DEC-019-006 P-D 改 採択方針との構造整合性を再評価した。結論は **「P-D 改 維持 + 更に強化、変更不要」**。理由: P-D 改の核は subscription OAuth 経路（Claude Max $200 既契約）を主流量とし API key を補助退避用に位置付ける構造であり、$30 cap は API key 経路の補助予算を引き締めただけで主流量側 ($200 + Codex Pro $200 = $400/月既契約) には影響しない。Phase 1 完遂は API key 経由月次 $19-31 着地見積で **$30 cap の境界値、5 施策必須実施で完遂可能**。代替 P-A (API 直叩き案) は $30 cap では機能不能であり、P-D 改の相対優位は cap 縮小によって **更に拡大**。新規 R-019-22 (黄) / R-019-23 (緑) を起票推奨。

---

## §1 subscription plan 主軸運用の構造再確認

### §1.1 P-D 改の動作モデル（DEC-019-006 + DEC-019-011 + DEC-019-050 統合）

```
[Owner PC: Windows 11 + WSL2]
  ├─ 公式 Claude Code CLI (@anthropic-ai/claude-code)
  │    └─ Owner OAuth 常駐 (claude.ai Max $200 既契約、DEC-019-011 オプション A)
  │         └─ API 消費: subscription quota から控除（API key 直接消費なし）
  │
  ├─ Open Claw subprocess
  │    └─ `claude -p "<prompt>" --output-format stream-json --allowedTools "..."`
  │         └─ 上記 OAuth 常駐セッションを subprocess spawn 経由で再利用
  │
  └─ API key 経路（補助、DEC-019-050 cap $30/月）
       ├─ HITL 通知メッセージ生成 (短文)
       ├─ mock-claude 基盤 (テスト)
       ├─ E2E test (Playwright + Vitest)
       ├─ ナレッジ抽出 batch (W4)
       └─ cost meter 自身の試算
```

**核ポイント**:
- 主流量 = subscription 経路（OAuth 駆動、Claude Max $200 内で消費）
- 補助流量 = API key 経路（$30/月 hard cap、突発・テスト・補助用途）
- DEC-019-050 cap 縮小は補助流量側のみに影響、主流量側 ($400/月既契約) は無傷

### §1.2 API key 直接消費が発生する箇所（Phase 1 期間 5/19〜6/13、4 週間）

| # | 箇所 | 性格 | API 消費トリガー |
|---|---|---|---|
| 1 | HITL 通知メッセージ生成 | 短文、低頻度 | gate 発火時のみ、24h timeout default reject |
| 2 | mock-claude 基盤 (テスト) | テスト時のみ実 API 呼出は最小化 | 5 シナリオ × E2E 経路、scenario-smoke のみ実 API |
| 3 | E2E test (Playwright + Vitest) | staging で限定実行 | 週次 1 回 / drill 時のみ |
| 4 | ナレッジ抽出 batch (W4) | 案件完了時 batch | PRJ-001〜018 ナレッジ抽出 (1 回限り) + 月次再抽出 |
| 5 | cost meter 自身の試算 | 軽量計算、Anthropic API 呼出なしで済む設計可 | cost-tracker.ts が H-09 / NG-3 内部試算で実 API 呼ばない |
| 6 | drill #1 / #3 単発 | drill 実施時のみ (5/13 / 5/22-24) | mock-claude 主体、実 API は補完的 |

### §1.3 API key 経路と subscription 経路の流量比 試算

- **subscription 経路 (Claude Max $200 OAuth)**: ループ実行・提案生成・harness 制御本体
  - Phase 1 W1〜W4 で 30〜90 ループ × 平均 1〜3 USD 換算/ループ = $30〜$270/月相当（Anthropic 内部試算ベース、cap なし）
- **API key 経路 ($30 cap 内)**: HITL 通知 / テスト / ナレッジ batch / cost meter
  - Phase 1 期間で $19〜$31/月 着地見積（§2.1）

| 経路 | 月次消費見積 | 全体比 | 主用途 |
|---|---|---|---|
| subscription (Max $200) | $200〜$400 換算（cap なし、weekly cap 制約あり）| **約 95%** | ループ・proposal・harness 制御本体 |
| API key ($30 cap) | $19〜$31 | **約 5%** | HITL 通知・mock-claude・E2E・ナレッジ batch・cost meter |

**結論**: P-D 改は本来から「subscription 主軸 / API key 補助」の構造設計であり、DEC-019-050 はこの構造を**追認・強化**した形。

---

## §2 $30/月 cap で Phase 1 完遂可能か

### §2.1 各箇所の月次消費見積（具体的 USD、2026-05 pricing ベース）

| # | 用途 | 単価想定 | 頻度 | 月次見積 | 信頼度 |
|---|---|---|---|---|---|
| 1 | HITL 通知メッセージ生成 | $0.001〜$0.005 / 通知 | 200〜400 通知/月 | **$1〜$2** | 推測 |
| 2 | mock-claude 基盤 (実 API smoke 部分) | $0.05〜$0.15 / smoke | 30〜50 smoke/月 | **$5** | 推測 |
| 3 | E2E test (staging 限定) | $0.30〜$0.80 / E2E run | 5〜10 run/月 | **$3** | 推測 |
| 4 | W4 ナレッジ抽出 batch | $0.20〜$0.50 / 案件 + 月次再抽出 | 18 件 + 4 週次 batch | **$5〜$10** | 推測 |
| 5 | cost meter 自身の試算 | $0.001 / poll | 1,440 poll/月 (毎時) | **<$1** | 推測 |
| 6 | drill #3 (5/22-24 単発) | drill 1 回 | 1 回 / 月 | **$5〜$10** | 推測 |
| | **合計** | | | **$19〜$31/月** | |

### §2.2 $30 cap でちょうど境界値、安全側 buffer は薄い

- 中央値ケース ($25/月) で cap $30 内に 17% buffer
- 上限ケース ($31/月) で cap 越え 3%、Hard $30 で自動停止 → subscription 経路のみで継続運用
- DEC-019-050「Phase 1 進行中に $30 突破 → API 自動停止 → subscription plan のみで継続運用」方針と整合

### §2.3 安全側に倒すための施策 5 件（必須）

| # | 施策 | 期待効果 | 担当 | 期限 |
|---|---|---|---|---|
| 1 | **mock-claude をフル活用** (実 API 消費を 30% 削減) | $5 → $3.5 | Dev | W0-Week2 (5/9) |
| 2 | **HITL 通知をテンプレ化** (LLM API 不要、static template + 値埋込) | $1〜$2 → <$0.1 | Dev | W0-Week2 (5/9) |
| 3 | **E2E test を staging で限定実行** (週 1 回 + drill 時のみ) | $3 → $1.5 | Dev | W1 着手前 (5/19) |
| 4 | **W4 ナレッジ抽出を batch 化 + caching 必須** (prompt cache 90% 適用) | $5〜$10 → $0.5〜$1 | Dev | W2 末 (5/30) |
| 5 | **drill #3 シナリオ簡易化** ($5 以内に収める) | $5〜$10 → $5 上限 | Review | drill #3 設計時 (5/14〜16) |

**5 施策適用後の修正見積**:
- $19〜$31 → $11〜$15/月（cap $30 内に 50%以上 buffer 確保）

### §2.4 完遂可否判定

- 5 施策必須実施 → **Phase 1 完遂可能**（cap $30 内に十分 buffer）
- 5 施策のいずれか未達成 → **境界値リスク高**、subscription 経路への完全切替が runtime で発生する可能性
- DEC-019-050 既定の「自動停止 → subscription plan のみで継続運用」フェイルセーフが機能する前提なら完遂可

---

## §3 NG-3 (24/7 連続自律稼働) との整合

### §3.1 DEC-019-008 暫定値の再確認

- ① 1 日連続稼働時間上限: **12 h/日**（深夜 0:00〜12:00 JST 帯は完全停止）
- ② API 換算費用上限: **$1,000/月相当を超えた時点で自動停止**（cost_check skill が試算、$800 で warn / $1,000 で全停止、レビュー G-V2-09 と整合）
- ③ Phase 1 W2 終了時（2026-05-30）にオーナー再確認（DEC-019-031 上方修正候補は別判断）
- ④ 業務時間帯ウィンドウ G-V2-07（9:00〜23:00 JST）と組み合わせて二重ガード

### §3.2 $30 cap は subscription 経路には影響しない

- DEC-019-050 cap = API key spend cap（Anthropic Console Settings の Spend Cap 機能）
- subscription quota = $200 Claude Max のまま不変
- → NG-3 制約（API 換算 $1,000/月相当の試算ベース）は subscription 経路でも維持必要（cap $30 とは別軸）

### §3.3 NG-3 違反リスクの変化

| リスク要素 | $300 cap 時 | $30 cap 時 | 変化 |
|---|---|---|---|
| 12 h/日 上限違反 | 高（autonomous 24/7 想定）| 高（autonomous 24/7 想定）| **不変** |
| API 換算 $1,000/月相当超過 | 中（cap $300 で物理停止）| 中（subscription 内消費が $1,000 換算超える可能性は残る）| **不変** |
| weekly cap 早期消費 | 高（Sumi/Asagi 同居）| 高（Sumi/Asagi 同居、§3.4 参照）| **不変** |

→ subscription 主軸でも 12 h/日制約は維持必要、cost_check skill の試算ロジックは API key 経路と subscription 経路の **両方を集計** する設計（既存）。

### §3.4 5/30 W2 終了時 NG-3 再評価議題は維持

- DEC-019-008 ③ で既定の「W2 終了時オーナー再確認」は本決裁影響なく維持
- 再評価時の議題に **「subscription 主軸運用での実消費ベースライン」** を追加推奨
  - W1〜W2 で subscription 経路の実 API 換算消費 (内部試算) を Dev が weekly 集計
  - 12 h/日内に収まるか、$1,000 換算超えるかを実データで判定
- DEC-019-031（NG-3 上方修正候補）は本決裁と独立判断

---

## §4 P-D 改アーキの優位性再確認

### §4.1 当初 P-D 改採択根拠（DEC-019-006 / `research-supplement-tos-and-subscription-paths.md` §6.2）

| 軸 | 評価 | 根拠 |
|---|---|---|
| ToS 解釈 | グレー寄り許容 | 公式 Claude Code CLI 経由 + 本人 OAuth + 「ordinary, individual usage」範囲 |
| 自動化レベル | 高（subprocess spawn で Open Claw 駆動可）| `claude -p` stream-json + allowedTools 制御 |
| コスト | $300 cap 想定で十分余裕 | Max $200 + Codex Pro $200 既契約、追加発生 buffer $100 |

### §4.2 $30 cap 制約下での 3 軸再評価

| 軸 | $300 cap 時 | $30 cap 時 | 変化 |
|---|---|---|---|
| **ToS 解釈** | グレー寄り許容 | グレー寄り許容 | **変化なし**（cap は ToS と独立軸）|
| **自動化レベル** | 高（subprocess spawn）| 高（subprocess spawn、構造不変）| **変化なし** |
| **コスト** | $300 cap × subscription $400 で余裕 | $30 cap × subscription $400 で **大幅優位**（API 直叩き案 P-A は cap で着地不可）| **更に強化** |

### §4.3 P-D 改維持結論: **更に強化、変更不要**

- subscription 主軸構造はそのまま機能、API key 補助流量を $30 cap で物理的に絞っただけ
- $30 cap は P-D 改の構造的優位を **逆に強化** する（subscription 経路の必要性が更に高まる）
- DEC-019-006 の構造変更は **不要**

### §4.4 代替 P-A (API 直叩き) は cap $30 では機能しないことを明示

| 経路 | $30 cap 下での Phase 1 実行可否 | 理由 |
|---|---|---|
| **P-D 改 (subscription 主軸)** | **可能** | subscription quota $200 で主流量を賄う、API key は補助 $30 cap 内 |
| P-A (API 直叩き、orchestrator なし) | **不可能** | ループ駆動で月次 $200〜$400 換算消費発生、$30 cap で 1〜3 日で枯渇 |
| P-B (Anthropic Subprocess API 直接) | **不可能** | API キー必須、$30 cap で同上 |
| P-C (langchain 経由) | **不可能** | API キー必須 + langchain SaaS 連動コスト発生、cap 即超過 |
| P-E (API キー従量フォールバック) | **緊急退避時のみ可** | 通常運用には使えない、BAN 時の 1〜2 日業務継続用途 |

→ P-D 改は **唯一 $30 cap 下で Phase 1 完遂可能な接続方式**。代替案は全て cap で機能不能。

---

## §5 上流 personal AI assistant 化との連動

### §5.1 OpenClaw OSS 上流 pivot は subscription 経路にメリット

- 2026-04 Anthropic Engineering blog "Reframing Claude Code: from autonomy to assistance"（推察、`research-pd-revised-validation.md` §1.1）で personal AI assistant 化が示唆
- consumer 向け重視 = OAuth + subscription quota 維持優先 = 主軸経路の安定性向上
- API key 経路の縮小と歩調が合っており、本案件にとって **追い風**

### §5.2 Phase 1 W2 で上流 changelog 監視 (DEC-019-035) で API 消費仕様変更を即時検出

- 4 系統 changelog 監視 (Anthropic CLI / Codex CLI / OpenClaw / Enderfga plugin) 既定
- API 消費仕様変更の検知シグナル: pricing page 変更 / API key required 化 / OAuth 縮退アナウンス
- L3 (critical) 検知時は HITL `external_api` 経由で 24h timeout default reject、自動 24h pause
- → cap $30 を突破するような仕様変更は事前検知可能

### §5.3 monitor 自動化スクリプトは API 消費しない

- 公開 GitHub feed (RSS / Atom) + npm registry HEAD request のみ
- LLM API 呼出ゼロ → cap $30 を圧迫しない
- DEC-019-022 既定の「PAT は Doppler 管理（→ DEC-019-048 で 1Password CLI 採用に上書き）、`secrets:read public_repo` 最小権限」と整合

---

## §6 Risk Register への追加候補

### §6.1 R-019-22 (黄): subscription plan 突破 → API key 自動 fallback で cap 急速消費

- **発生条件**: subscription weekly cap (Sumi/Asagi 同居プール) を突破した瞬間に harness が自動的に API key fallback (P-E) へ切替、$30 cap を 1〜2 日で消費し切る
- **検出手段**: Anthropic Console spend 急上昇（毎日 09:00 / 21:00 JST monitor、H-09 拡張）
- **影響度**: 中（Phase 1 期間中の API key 経路消費が想定上回り、補助用途すら止まる）
- **mitigation**:
  - **自動 fallback を OFF**（DEC-019-006 §H-04 と整合、既定で OFF）
  - 手動切替必須化（HITL 第 X 種 `subscription_to_api_fallback` 新設提案）
  - Owner OAuth 常駐セッション watch dog で weekly cap 80% 到達時に **自律ループ pause**（P-E 切替前に停止）
- **格付け**: 黄、優先順位 11 位（R-019-12-C の次）

### §6.2 R-019-23 (緑): mock-claude / template 化遅延で実 API 消費が想定上回る

- **発生条件**: §2.3 施策 1〜2 の W0-Week2 (5/9) 期限が滑り、実 API smoke + LLM 通知が縮小されない
- **検出手段**: 毎週末 Dev cost report で API key 経路実消費 vs 見積を比較、$25 超過で warn
- **影響度**: 低〜中（Phase 1 期間内に施策追完すれば回復）
- **mitigation**:
  - **W1 中盤までに mock 完成 + テンプレ確定**（5/22 期限）
  - 5/19 W1 着手時点で施策 1〜2 完了を着手前提条件に追加（DEC-019-019 BAN drill #1 と並列）
- **格付け**: 緑、優先順位 12 位

### §6.3 既存 Risk Register への統合

| ID | 格付け | 優先順位 |
|---|---|---|
| R-019-06 (連鎖 BAN) | 赤 | 1 |
| R-019-12-A (上流 API breaking) | 赤 | 2 |
| R-019-09 (NG-3 24/7) | 赤 | 3 |
| R-019-10 (Claude Max weekly) | 黄 | 4 |
| R-019-12 (上流戦略後退) | 黄 | 5 |
| R-019-12-B (timeout/hang) | 黄 | 6 |
| R-019-12-C (Anthropic stream-json breaking) | 黄 | 7 |
| R-019-08 (PRJ-018 衝突) | 黄 | 8 |
| R-019-11 (Vercel Sandbox) | 黄 | 9 |
| R-019-07 (Codex 2x) | 緑 | 10 |
| **R-019-22 (subscription cap 突破 → API fallback 急速消費)** | **黄** | **11（新規）** |
| **R-019-23 (mock/template 遅延で API 消費膨張)** | **緑** | **12（新規）** |

---

## §7 結論

### §7.1 結論（3 行）

1. **subscription plan 主軸運用 = Phase 1 完遂可能**、ただし §2.3 5 施策必須実施が前提条件。
2. **DEC-019-006 P-D 改は再採択（変更不要、更に強化）**。$30 cap は P-D 改の構造的優位を逆に拡大し、代替 P-A〜P-C は cap 下で機能不能。
3. **Phase 2 で API spend 増額判定**（別 DEC、Phase 1 実消費ベースラインを根拠化）、5/30 W2 終了時 NG-3 再評価議題に「subscription 主軸での実消費ベースライン」を追加。

### §7.2 採択根拠（5 点）

1. **構造整合性**: P-D 改は元から「subscription 主軸 / API key 補助」設計、DEC-019-050 は既存構造を追認。
2. **流量比 95:5**: subscription 経路が主流量 95%、API key 経路は補助 5%、cap $30 は補助流量に十分。
3. **5 施策で完遂可能**: mock-claude / HITL テンプレ / E2E 限定実行 / ナレッジ batch caching / drill 簡易化で見積 $19〜$31 → $11〜$15 に圧縮、cap $30 内 buffer 50%以上。
4. **代替案不可能**: P-A〜P-C は API key 必須、$30 cap で 1〜3 日枯渇、Phase 1 機能不能。
5. **上流 pivot 追い風**: OpenClaw / Anthropic 双方が consumer / personal 重視へ移行、subscription 経路の安定性向上。

### §7.3 CEO 決裁推奨

- **議決-24（提案、5/8 検収会議で正式採用）**:
  > subscription plan 主軸運用方針を Phase 1 正式採用、DEC-019-006 P-D 改 維持（変更なし）、§2.3 5 施策を Dev W0-Week2 必須タスクとして発令、新規リスク R-019-22 / R-019-23 を Risk Register に追加、Phase 2 着手判定時に API spend 増額是非を別 DEC で判断する。

- **連動 DEC**: DEC-019-006（P-D 改）+ DEC-019-008（NG-3）+ DEC-019-009（Pro $200）+ DEC-019-011（オプション A）+ DEC-019-012（Spend Cap）+ DEC-019-050（cap $30）

### §7.4 次アクション

| # | 種別 | 内容 | 期限 | 担当 |
|---|---|---|---|---|
| 1 | CEO 即決 | 議決-24（subscription 主軸方針正式採用） | 5/8 検収会議 | CEO（オーナー判断） |
| 2 | Dev タスク | §2.3 施策 1 (mock-claude フル活用) | 5/9 | Dev |
| 3 | Dev タスク | §2.3 施策 2 (HITL 通知テンプレ化) | 5/9 | Dev |
| 4 | Dev タスク | §2.3 施策 3 (E2E staging 限定) | 5/19 | Dev |
| 5 | Dev タスク | §2.3 施策 4 (ナレッジ batch caching) | 5/30 | Dev |
| 6 | Review タスク | §2.3 施策 5 (drill #3 簡易化) | 5/16 | Review |
| 7 | 秘書タスク | Risk Register R-019-22 / R-019-23 追加 | 5/8 | 秘書 |
| 8 | Research フォロー | 5/30 W2 終了時 NG-3 再評価議題に「subscription 主軸実消費ベースライン」追加 | 5/30 | Research |

---

## §8 既存 research-pd-revised-validation.md との関係（補強関係）

本書は `research-pd-revised-validation.md`（P-D 改 維持結論、290 行）の補強であり、矛盾しない。

| 観点 | research-pd-revised-validation.md | 本書 |
|---|---|---|
| 評価軸 | 上流 OpenClaw personal AI assistant 化への耐性 | DEC-019-050 spend cap $30 制約への耐性 |
| 結論 | P-D 改 維持 + 微修正 3 点 (C-OC-06〜08) + R-019-12-C 起票 | P-D 改 維持 + 5 施策必須 + R-019-22 / R-019-23 起票 |
| 共通 | P-D 改 採択方針は不変、subprocess boundary + interface 抽象化が core | 同左、cap 縮小でも構造優位は不変 |

両書の結論は整合的: **「P-D 改 採択、変更不要、ただし運用層で複数の補強策を追加」**。

---

## §9 関連レポート相互参照

- `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`（ToS / subscription 経路 1 次調査）
- `projects/PRJ-019/reports/research-pd-revised-validation.md`（P-D 改 維持結論、本書の隣接書）
- `projects/PRJ-019/reports/research-knowledge-and-transparency-design.md`（既存設計、$300 cap 前提の試算群、本書で $30 cap 用途別影響を補正）
- `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md`（4 系統監視 Runbook、§5.2 連動）
- `projects/PRJ-019/reports/research-w0-supplement-op1-op5.md`（OP-1〜5 一次裏取り、§3.4 weekly cap 連動）
- `projects/PRJ-019/decisions.md`（DEC-019-006 / 008 / 009 / 011 / 012 / 050 + 本書で議決-24 提案）

---

## フッタ

- 文書: `projects/PRJ-019/reports/research-subscription-mainline-validation.md`
- 版: v1.0（2026-05-03）
- 次回レビュー: Phase 1 W2 末（2026-05-30）NG-3 再評価時 + Phase 2 着手判定時 (6/13 後)
- 作成: Research 部門 / 検収予定: Review 部門 + CEO（議決-24 即決判定）
- 改版履歴:
  - v1.0 2026-05-03: 初版（subscription 主軸運用 + DEC-019-006 整合性再評価、P-D 改 維持結論、5 施策発令、R-019-22 / R-019-23 起票案）
