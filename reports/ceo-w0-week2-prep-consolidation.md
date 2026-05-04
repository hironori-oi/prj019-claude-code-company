# PRJ-019 Clawbridge W0-Week2 ブートストラップ並列成果 連結報告（CEO）

- 案件: PRJ-019 Clawbridge — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 報告主体: CEO（オーナー宛）
- 報告日: 2026-05-03
- 対象期間: 2026-05-03（W0-Week1 連結報告 `ceo-w0-week1-consolidation.md` 着地直後の同日発令分）
- 関連決裁: DEC-019-021 / DEC-019-022 / DEC-019-023 / DEC-019-024（本連結報告で正式起票）
- 上位レポート: `reports/ceo-w0-week1-consolidation.md`、`reports/dev-w0-week2-prep-report.md`、`reports/research-w0-supplement-pd-modified-revalidation.md`、`reports/research-changelog-monitoring-runbook.md`、`reports/pm-cost-and-controls-plan-v4.md`、`reports/pm-w0-week2-execution-plan.md`、`reports/marketing-portfolio-reflection-design.md`、`reports/marketing-knowledge-reflection-design.md`

---

## 0. 200 字サマリ

W0-Week1 連結報告 + DEC-019-014〜020 着地直後に **4 部署並列発注（Dev / Research / PM / Marketing）を実施 → 同日全完遂**。Dev は HITL 第 6 種 `tos_gray_review` 雛形 + openclaw-runtime ラッパ skeleton + architecture-w0.md / security-w0.md ドラフトで `pnpm test` **11 files / 95 tests 全緑**（83→95）。Research は OpenClaw OSS 上流「personal AI assistant」再ポジションを踏まえた **P-D 改 resilient 確定 + R-019-12 リスク再格付け（赤→黄、新規 A 赤 / B 黄 分割）** + **4 系統 changelog 監視 Runbook（HITL 第 7 種 `external_api` 発令）**。PM v4 は **必須コントロール 28→34 / 中央値 $33 / 上限 $93**、月次 $300 維持。W0-Week2 実行計画は 29 タスク × 6 部署、Critical Path 5 ステップ、5/15 競合解消で AS-151 を 5/16 スライド。Marketing は Phase 1 完了時の HP / ナレッジ K1〜K10 反映設計を完成。**DEC-019-021〜024 を即決**、Phase 1 着手 5/19 確度「強い条件付き Go」継続。

---

## 1. 連結背景

### 1.1 W0-Week1 着地状況（前回報告）

W0-Week1 連結報告（`reports/ceo-w0-week1-consolidation.md`）にて、3 部署並列発注（Dev / Research / Review）成果が全着地し、DEC-019-014〜017（W0-Week1 進捗承認 / H-09 H-10 発令 / Vercel 上方修正 / Hobby→Pro W3 中盤判断）が起票済。同日、5 タスク並列発注で DEC-019-018〜020（ToS allowlist DoD 統合 / BAN drill #1 シナリオ / mock-claude 基盤）が即決され、67→83 tests / 8 controls evidence + mock-claude スタブ + TimeSource pattern が確立。

### 1.2 W0-Week2 ブートストラップの必要性

W0-Week2（5/9〜5/18）公式着手前に、以下 4 件を前倒し並列発注することが Phase 1 着手 5/19 確度維持に必要と CEO 判定:

1. **Dev W0-Week2 着手の事前ブートストラップ**: HITL 第 6 種 `tos_gray_review` 雛形（DEC-019-018 で必須化済）/ openclaw-runtime ラッパ skeleton 調査 / `app/docs/architecture-w0.md` + `security-w0.md` ドラフト
2. **Research 部門への P-D 改補追検証**: OpenClaw OSS 上流「personal AI assistant」化を踏まえた接続方式 P-D 改の再評価 + Phase 1 用 Issue/changelog 監視運用設計
3. **PM 部門への PM v4 起案発令**: H-09 / H-10 / Vercel 上方修正 / HITL 第 6 種 / G-Top-1〜4 を反映した最終仕様
4. **Marketing 部門への Phase 1 完了時ポートフォリオ反映設計の事前準備**: 自社 HP / 社内ナレッジ反映設計

---

## 2. 4 部署並列発注 成果着地サマリ

### 2.1 Dev 部門 — W0-Week2 ブートストラップ（成果報告: `dev-w0-week2-prep-report.md`）

| 成果物 | 内容 | 検証 |
|---|---|---|
| HITL 第 6 種 `tos_gray_review` 雛形 | `app/harness/src/hitl-gate.ts` に zod payload schema (`category`/`subcategory`/`confidence`/`rationale`/`need_summary`)、dedup map、blocklist 即拒否、audit log append、`HitlRejectionReason` 6 値拡張 (`tos_gray_timeout` / `tos_gray_human_reject` / `tos_gray_blocklist_hit` + 既存 3) | hitl-gate.test.ts **5 → 11 ケース**（+6 ケース） |
| openclaw-runtime ラッパ skeleton | `app/openclaw-runtime/src/{index,types,wrapper,upstream-notes.md}.ts`、`OpenclawRuntime` interface + `MockOpenclawRuntime` 実装 + `RealOpenclawRuntime` not-implemented スタブ + tsconfig + package.json scripts 切替 | wrapper.test.ts **6 ケース** 全緑 |
| `app/docs/architecture-w0.md` ドラフト | §1 全体図 / §2 W0-W4 スコープ / §3 7 workspace 責務 / §4 DoD 自動化 sequence / §5 P-D 改 5 不変条件 / §6 9 ハードガード対照表 / §7 W0-Week2 持越し（**Mermaid 3 枚**） | docs として固定化済 |
| `app/docs/security-w0.md` ドラフト | §1 4 層防御 / §2 9 controls エビデンス / §3 BAN 5 SLA / §4 OAuth 物理分離 / §5 副作用ゼロ / §6 secret 取扱 / §7 監査ログ / §8 W0-Week2 追加コントロール（**Mermaid 3 枚**） | docs として固定化済 |
| `app/README.md` v3 | monorepo セットアップ + W0-W1 vs W0-W2 スコープ表 + 13 完了基準 | docs |

**実機 `pnpm test` 結果** (Windows 11 / Node 24.11.1 / pnpm 9.12.0):

```
Test Files  11 passed (11)
     Tests  95 passed (95)
```

ベースライン 83（W0-Week1 終了時）から **+12 テスト（+1 ファイル）** 追加。要求 89/94 を上回って 95 達成。既存 PRJ-001〜018 への副作用ゼロ確認済。

**Dev 自己発見の課題**:
- `kill-switch.test.ts:123` に既存 lint 違反（W0-Week1 origin、W0-Week2 スコープ外、polish task で吸収可）
- `tos_gray_blocklist_hit` rejection_reason は 11 ケース内で明示テストされていない（W0-Week2 中盤に Dev が追加テスト予定、W2-D-01 細目）

### 2.2 Research 部門 — P-D 改補追検証 + Changelog 監視 Runbook（成果: 2 報告）

#### 2.2.1 `research-w0-supplement-pd-modified-revalidation.md`（342 行 / Mermaid 2 / §1〜§8）

- **核論点**: OpenClaw OSS 上流（github.com/clawbro-ai/openclaw）が README で「OpenClaw is a personal AI assistant…」へ再ポジションされた可能性を踏まえ、P-D 改採用（DEC-019-006）への影響を一次解釈
- **結論**: **P-D 改は resilient（影響限定的）** — Open Claw は driver / orchestrator wrapper、Claude Code CLI が実エンジン。OpenClaw 機能後退は driver 層の自由度を下げない（self-host fork 化への切替も容易）
- **影響あるレイヤ vs ないレイヤ**: subprocess spawn 仕様 / stream-json プロトコル / OAuth 経路 / FS 隔離 / cost-tracker は影響なし。Open Claw 提供の内蔵スキル拡張点 / プラグイン仕様 / multi-task orchestrator UI は影響あり（personal アシスタント化で API 縮退の懸念）
- **R-019-12 リスク再格付け提案（CEO 即決推奨 → DEC-019-021 起票）**:
  - **R-019-12（黄、降格）**: 上流再ポジション自体が Phase 1 接続契約に与える戦略的影響（軽度、ラッパ抽象化で吸収可）
  - **R-019-12-A（赤、新規）**: Phase 1 期間中の API breaking change 即時影響（Phase 1 一時停止リスク）
  - **R-019-12-B（黄、新規）**: timeout / hang / silent failure 系の挙動変化（Mock との contract 乖離で E2E 緑のまま実運用赤になる中期リスク）
- **追加コントロール提案 C-OC-01〜05**: OpenClaw fork 物理クローン W2 終了時 / changelog 監視 cron W2 中盤 / breaking change 即時検知 HITL ルート / Phase 2 exit plan / weekly health check
- **PM v5 起案トリガー TR-1〜TR-3 提案**（PM v4 §7 / 本書 §7 と完全整合）

#### 2.2.2 `research-changelog-monitoring-runbook.md`（324 行 / Mermaid 1 / §1〜§7）

- **監視対象 4 系統**: Anthropic Claude Code CLI / OpenAI Codex CLI / OpenClaw OSS / Enderfga plugin
- **監視手段**: GitHub releases atom feed (RSS) + GraphQL API 併用、PAT は Doppler 管理（`secrets:read public_repo` 最小権限）
- **通知 3 段階**:
  - **L1 (info)**: minor release / patch / docs 更新 → Slack のみ
  - **L2 (warn)**: minor breaking 候補 → Slack + 翌朝 09:00 JST CEO 経由オーナー要約（24h SLA）
  - **L3 (critical, major breaking)**: 即時 Slack + 即時メール CEO + **自律ループ自動 24h pause（H-09 と同じ機構流用）** + HITL 第 7 種 `external_api`（24h timeout default reject）
- **breaking 判定 5 ヒューリスティクス**: semver major / "BREAKING" 単語 / "feat!:" or "BREAKING CHANGE:" / README ToS/license 変更 / peer dep major（**シグナル 3+ 一致で L3、FN-Black 抑制**）
- **配置**: `app/harness/src/changelog-monitor.ts` + 4 関連ファイル + 6 ケース テスト
- **Dev 着手期**: **W2 中盤（5/26 着手 / 5/30 検収）**

### 2.3 PM 部門 — PM v4 起案 + W0-Week2 実行計画（成果: 2 報告）

#### 2.3.1 `pm-cost-and-controls-plan-v4.md`（476 行 / Mermaid 3 / §0〜§9）

| 項目 | v3 | v4 | 増分 | 根拠 DEC |
|---|---|---|---|---|
| 必須コントロール総数 | 28 | **34** | +6 | DEC-019-015 / 018 |
| H-09 (Claude Max weekly cap 監視) | 未記載 | 新規 | +1 | DEC-019-015 |
| H-10 (extra usage 課金 OFF) | 未記載 | 新規 | +1 | DEC-019-015 |
| HITL 第 6 種 `tos_gray_review` | 5 種 | 6 種 | +1 | DEC-019-018 |
| G-Top-1〜4 | 未記載 | 新規 4 件 | +4 | DEC-019-018 |
| Vercel Sandbox 中央値 | $5 | $20 | +$15 | DEC-019-016 |
| Vercel 上限ケース | $20 | $46 | +$26 | DEC-019-016 |
| Phase 1 追加発生 中央値 | $13 | **$33** | +$20 | DEC-019-016 |
| Phase 1 追加発生 上限 | $73 | **$93** | +$20 | DEC-019-016 |
| 月次ハードキャップ | $300 | $300 | 0 | DEC-019-012 維持 |

PM v4 §3 で 4 層コストキャップ（session $5 / project $50 / day $30 / month $300）維持を確認、§5 で G-Top-1〜4 CEO 個別承認運用ルール明文化、§6 で Critical Path 分析 + ガントチャート（Mermaid）、§7 で PM v5 起案トリガー TR-1〜TR-3、§8 で R-019-06〜R-019-12 リスク再評価表（R-019-12-A/B 含む）、§9 で CEO 即決推奨 4 件（DEC-019-021〜024 候補）。

#### 2.3.2 `pm-w0-week2-execution-plan.md`（389 行 / Mermaid 2 / §0〜§8）

- **29 タスク × 6 部署マスタ表**: W2-D-01〜15 / W2-D-Live / W2-D-Wrapper / W2-D-Docs / W2-D-Notify / W2-D-Verify / W2-D-Drill / W2-R-01〜05 / W2-S-01〜03 / W2-O-01〜04 / W2-CEO-01〜02
- **Critical Path 5 ステップ**: 5/9 Live integration → 5/13 BAN drill #1 → 5/14 CEO 結果判定 → 5/15 OAuth 物理隔離 → 5/18 W0 完了 Go/NoGo
- **5/15 競合解消推奨（解消案 A）**: AS-151 (PRJ-018 並走、非クリティカル) を **5/16 にスライド** で 5/15 負荷 3.6d → 3.1d、PRJ-018 PM へ秘書経由調整依頼
- **W0 完了 13 基準**: tos_gray_review 全分岐 / mock-claude scenario chain / 副作用ゼロ自動検証 / Live integration $0.10 内 / BAN drill #1 5 SLA / C-A-04 運用開始 / OAuth 物理隔離 / Sumi/Asagi バックアップ / tos_classifier zod schema / FN-Black 60 件 / 4 系統監視 設計 / OpenClaw fork クローン / NG-3 ベースライン

### 2.4 Marketing 部門 — Phase 1 完了時 ポートフォリオ反映設計（成果: 2 報告）

#### 2.4.1 `marketing-portfolio-reflection-design.md`（24,510 字 / §1〜§7）

- 公開タイミング: **6/20**（Phase 1 完了 6/13 + 1 週間バッファ）
- 開示方針: **部分開示**（プロセス公開 + 一部の内部数値 / BAN リスク評価値などはスコープ外）
- 表現比重: harness engineering 40% / org 25% / cost 20% / ToS 15%
- Heading 案 A 採用推奨（Heading B / C との比較表）
- 自社 HP（COMPANY-WEBSITE）への配置設計、ポートフォリオページの構造、リード獲得導線

#### 2.4.2 `marketing-knowledge-reflection-design.md`（23,177 字 / §1〜§7）

- 社内ナレッジ K1〜K10 候補（再利用可能パターン）
- `organization/knowledge/` への配置設計
- KPT 振り返り連動

**Marketing からの確認事項 8 件**（PATTERN-006/007 番号衝突回避を含む）は CEO 経由でオーナーに後日回付、即決対象外。

---

## 3. CEO 即決事項（DEC-019-021〜024）

| DEC ID | 内容 | 即決根拠 |
|---|---|---|
| **DEC-019-021** | R-019-12 リスク再格付け 赤→黄 + 新規 A 赤 / B 黄 分割、C-OC-01〜05 追加コントロール発令 | Research §3〜§5 で「P-D 改は resilient」一次解釈確定、リスクポートフォリオ過大評価是正必要 |
| **DEC-019-022** | 4 系統 changelog 監視運用採用 + HITL 第 7 種 `external_api` 発令、Dev W2 中盤（5/26 着手 / 5/30 検収）実装、L3 で 24h 自動 pause 機構 | Research Runbook §1〜§7 + PM v4 §6 / §7、R-019-12-A（赤）の主要 mitigation 確立に必要 |
| **DEC-019-023** | PM v5 起案トリガー TR-1（5/13 drill #1 Fail）/ TR-2（5/30 NG-3 再確認結果）/ TR-3（6/13 Phase 2 Go）正式確定 | PM v4 §7 / Research §7 で同一仕様提案、PM v4 → v5 移行の予測可能化が秘書部門 dashboard 反映に必要 |
| **DEC-019-024** | Vercel Hobby→Pro 昇格判断を W3 中盤（6/3）の正式 CEO 決裁タスク CB-CEO-W3-01 として公式化、消費率 70% 超過で昇格 | DEC-019-017 既定の判断材料を引継ぎ、PM v4 §3.4 で公式タスク化要請、dashboard カラム化必要 |

各 DEC の詳細根拠と理由は `decisions.md` 参照。

---

## 4. 5/8 18:00 検収会議への影響

PM v4 §1（差分マトリクス）+ DEC-019-021〜024 即決 + W0-Week2 実行計画を踏まえ、5/8 18:00 検収会議の **議題に §5 PM 追加（30 分）を上乗せ**:

- §5.1: PM v4 公式承認（必須コントロール 34 / コスト v4 / G-Top-1〜4）
- §5.2: DEC-019-021〜024 公式承認（即決済だが会議で再確認）
- §5.3: W0-Week2 タスク台帳 29 タスク承認
- §5.4: 5/15 競合解消承認（AS-151 5/16 スライド）
- §5.5: G-Top-1 Phase 1 デモ 1 件 ジャンル選定（別決裁 DEC-019-XXX 起票、5/8 後）

想定所要 90 分 + 30 分（PM 議題）= **120 分**。

---

## 5. リスク再評価（R-019-XX 全体ビュー）

| リスク ID | 区分 | スコア | 状態 | 主要 mitigation |
|---|---|---|---|---|
| R-019-06 | 赤 | 9 | 継続 | DEC-019-006 P-D 改 + 必須コントロール 34 + P-E 即時 fallback + Anthropic 警告メール 1h 監視 |
| R-019-07 | 黄 | 6 | 継続 | Codex 2x ボーナス 5/31 終了、W2 終了時 5x 枠で再見積 |
| R-019-08 | 黄 | 5 | 継続 | PM v2 §3.4.1 配分マトリクス + AS-151 5/16 スライド（PM v4 §3） |
| R-019-09 | 黄 | 5 | 継続 | DEC-019-008 NG-3 W2 終了時オーナー再確認 = TR-2 |
| R-019-10 | 黄 | 8 | 軽減進行 | DEC-019-015 H-09 Claude Max weekly cap 監視 + H-10 extra usage OFF（Phase 1 真のボトルネック） |
| R-019-11 | 黄 | 4 | 軽減 | DEC-019-016（コスト上方修正）+ DEC-019-024（CB-CEO-W3-01 6/3 昇格判断） |
| **R-019-12** | **黄（降格）** | 5 | 軽減 | OpenClaw OSS 上流再ポジション、ラッパ抽象化で吸収（Research §3） |
| **R-019-12-A** | **赤（新規）** | 8 | 警戒 | DEC-019-022 4 系統 changelog 監視 + L3 24h pause + HITL 第 7 種 |
| **R-019-12-B** | **黄（新規）** | 5 | 警戒 | Mock との contract 監視 + weekly health check（C-OC-05） |

**警戒継続**: R-019-06（BAN 確率 30〜60%）+ R-019-10（Claude Max weekly cap）+ R-019-12-A（OpenClaw API breaking）が現状の 3 大ハイリスク。Phase 1 期間中の能動監視が必要。

---

## 6. 直近マイルストーン（更新）

| 日付 | イベント | 担当 |
|---|---|---|
| 5/4 | DEC-019-021〜024 公式起票完了（本日） | CEO ✓ |
| 5/8 12:00 | Dev エビデンス提出締切 | Dev |
| 5/8 18:00 | W0-Week1 検収会議（120 分、議題 §1〜§5、Go/NoGo + DEC-019-021〜024 公式承認 + G-Top-1 デモジャンル選定別決裁） | 全部署 + Owner |
| 5/9 | Live integration test 実行（オーナー OAuth $0.10 上限） | Dev + Owner |
| 5/12 | C-A-04 使用量モニタリング運用開始 + H-09 PoC（Console scrape vs `/usage` parse） | Dev |
| 5/13 | BAN drill #1 実施（PRJ-019 単独、Sumi/Asagi アイドル） | Review + Dev |
| 5/14 | BAN drill #1 結果判定 → DEC-019-XXX 起票（Pass/Fail） | CEO |
| 5/15 | Sumi/Asagi 完全バックアップ + OAuth 物理隔離（AS-151 5/16 スライド） | Dev |
| 5/17 | BAN drill #2（Sumi/Asagi 同居） | Review + Dev |
| 5/18 18:00 | W0 完了 Go/NoGo + オーナー Spend Cap 設定 | CEO + Owner |
| 5/19 | **Phase 1 W1 公式キックオフ** | 全部署 |
| 5/26 | 4 系統 changelog 監視 Dev 着手（W2 中盤） | Dev |
| 5/30 | DEC-019-008 NG-3 オーナー再確認 = TR-2 発動可否判定 | Owner + CEO |
| 5/31 | Codex 2x ボーナス終了 | — |
| 6/3 | CB-CEO-W3-01 Vercel Pro 昇格判断（消費率 70% 超過時） | CEO |
| 6/13 | Phase 1 完了 + Phase 2 Go/NoGo + TR-3 発動可否 | CEO + Owner |
| 6/20 | Phase 1 完了時 自社 HP 公開（Marketing 提案） | Web 運営 |

---

## 7. 結論

1. **W0-Week2 ブートストラップ並列成果は 4 部署とも完遂、Phase 1 着手 5/19 の確度を「強い条件付き Go」のまま維持**
2. **DEC-019-021〜024 の 4 件即決により、リスクポートフォリオ正常化（R-019-12 過大評価是正 + 新規 A/B 分割）+ 4 系統 changelog 監視運用 + PM v5 起案トリガー予測可能化 + Vercel 昇格判断公式化** が完了
3. **5/8 18:00 検収会議の議題が §1〜§5（120 分）に拡張**、PM v4 公式承認 + G-Top-1 デモジャンル選定別決裁 + W0-Week2 タスク台帳承認を含む
4. Dev `pnpm test` は **11 files / 95 tests 全緑**、既存 PRJ-001〜018 副作用ゼロ確認継続
5. 月次予算 $300 ハードキャップは v4 でも維持、Phase 1 追加発生 中央値 $33 / 上限 $93（v3 比 +$20 / +$20）

---

## 8. 次のアクション

| アクション | 担当 | 期日 |
|---|---|---|
| DEC-019-021〜024 を `decisions.md` に追記（本連結報告と同時） | CEO（秘書代行） | 5/3 ✓ |
| dashboard PRJ-019 進捗 25%→35% 更新 | 秘書 | 5/3 ✓ |
| 5/8 検収会議 議題 §5 公式回付（PM v4 公式承認 + DEC 公式承認 + 5/15 競合解消承認 + G-Top-1 ジャンル選定） | PM + 秘書 | 5/4〜5/7 |
| Marketing 確認事項 8 件をオーナーに回付（PATTERN-006/007 番号衝突回避含む） | CEO | 5/4〜5/8 |
| W0-Week2 公式着手（5/9〜）に向けた最終チェックリスト整備 | 秘書 | 5/8 |
| BAN drill #1（5/13）実施準備（mock-claude 5 シナリオ × Review シナリオ A〜E × Dev 立会） | Dev + Review | 5/12 |

---

## 関連レポート

- **W0-Week1 連結**: `reports/ceo-w0-week1-consolidation.md`
- **Dev W0-Week2 prep**: `reports/dev-w0-week2-prep-report.md`
- **Research P-D 改補追**: `reports/research-w0-supplement-pd-modified-revalidation.md`
- **Research Changelog Runbook**: `reports/research-changelog-monitoring-runbook.md`
- **PM v4**: `reports/pm-cost-and-controls-plan-v4.md`
- **PM W0-Week2 実行計画**: `reports/pm-w0-week2-execution-plan.md`
- **Marketing ポートフォリオ反映**: `reports/marketing-portfolio-reflection-design.md`
- **Marketing ナレッジ反映**: `reports/marketing-knowledge-reflection-design.md`
- **意思決定**: `decisions.md`（DEC-019-001〜024）

---

**報告**: CEO ／ **宛**: オーナー ／ **報告日**: 2026-05-03
