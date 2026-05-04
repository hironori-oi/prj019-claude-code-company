最終更新: 2026-05-03 / 起案: 秘書部門 / 配布期限: 5/7 22:00

# PRJ-019 W0-Week1 検収会議 議決事項詳細（議決-1〜15）

- 案件: PRJ-019「Clawbridge」
- 文書種別: 議決事項詳細書（議題 v6 §6 補助資料）
- 上位文書: `secretary-agenda-v6.md` §6 / `ceo-dec-019-033-consolidation.md` §8
- 議決方式: 各議決ごとに CEO 推奨案先行 → 賛否確認 → Owner 最終承認
- 各議決構成: ① 議決名 + 起案部署 + 根拠 / ② 議決内容（要旨 200 字以内）/ ③ CEO 推奨採択 / 修正案 / 棄却 / ④ 採択時影響（Phase 1 / 予算 / リスク）/ ⑤ 反対意見想定 + 対処

---

## 議決-1: DEC-019-033 5 点統合採用

1. **起案**: CEO（Owner 5 設計変更指示 + 「全 OK」承認受領）/ **根拠**: DEC-019-033 / `ceo-dec-019-033-consolidation.md` §0
2. **議決内容**: Phase 1 設計を「Owner-in-the-loop 透明 AI 組織」モデルに正式変更する。① 提案生成 → 承認 2 段階 DoD ② HITL 第 9 種 `dev_kickoff_approval` ③ 透明性 Dashboard（PRJ-020 同居）④ ナレッジ抽出蓄積機構 ⑤ Open Claw 権限管理 UI（7 カテゴリ細粒度、Owner のみ変更可）の 5 点を統合採用する。Heading A 維持、Phase 1 着手 5/26 / 完了 6/20 / 公開 6/27 朝にスライド。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Phase 1 着手 1 週間延期、Dev 工数 +8.2 d（26.4 d 化）、月次予算 +$14（中央値 $57、上限 $163）、必須コントロール 50 項目化、HITL 11 種化、リスク赤 1 件追加（R-019-15）
5. **反対想定 + 対処**: 「5 点同時採用は工数オーバ」→ 5/19 → 5/26 延期で吸収済 + Dev 2 名体制（議決-10 連動）/「Heading A 訴求弱化」→ 補強表記 A1 採用（議決-9 連動）で逆に強化

---

## 議決-2: Phase 1 着手 5/26 Conditional Go（3 条件付き）

1. **起案**: PM / **根拠**: PM v4 §1.1、`ceo-dec-019-033-consolidation.md` §7
2. **議決内容**: Phase 1 着手日を 5/26（月）に確定し、Conditional Go 3 条件を Phase 1 着手の絶対条件化する。条件 (1) P-UI-01〜09 を 5/25 までに完遂、(2) BAN drill #3（5/29）計画完成を 5/8 検収で承認、(3) Review が「強い条件付き Go（確実度向上）」維持判定。1 条件でも欠けた場合は 6/2 に 1 週間追加延期 + 5/8 再判定。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Phase 1 期間 5/26〜6/20（4 週間）、Pre-Phase Week 5/19〜5/25 で P-UI 並列実装、リソース集中投下を 5/8 検収後即開始
5. **反対想定 + 対処**: 「Conditional Go ではなく Unconditional Go」→ R-019-15 priviledge escalation 赤格付けがあるため絶対条件化必須 /「6/2 延期は厳しい」→ Conditional 3 条件達成プランを Dev 2 名体制で完遂、5/29 drill #3 Pass で確定

---

## 議決-3: Phase 1 完了 6/20 + Marketing 公開 6/27 朝

1. **起案**: PM / **根拠**: ODR-019-V41-03/04、PM v4 §1.1
2. **議決内容**: Phase 1 完了日を 6/13 → 6/20、Marketing 公開を 6/20 → 6/27 朝（暫定）にスライドする。理由は議決-1 の 5 点統合採用に伴う 1 週間延期。Web 運営部門の HP 改修（DEC-019-029）は 6/12 完成 → 6/13-19 調整 → 6/27 公開合わせの再スケジュール。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Marketing Launch Runbook 6/20 → 6/27 朝再スケジュール、HP 公開枠 1 週間ずれ、SEO 影響無し（DEC-019-026 既定範囲）
5. **反対想定 + 対処**: 「公開 1 週間遅延でリード機会損失」→ Heading A 訴求と Owner-in-the-loop 整合で Phase 1 公開時の競合差別化が強化、機会損失より品質確保が優先

---

## 議決-4: KPI 提案承認率 ≥ 30% + TR-4 ジャンル切替

1. **起案**: PM / **根拠**: ODR-019-V41-01/05、PM v4
2. **議決内容**: Phase 1 KPI を「提案承認率 ≥ 30%（自然棄却含む）」を単一指標として採用、月次 monitor で < 30% 持続時に TR-4 トリガーで G-Top-1 ジャンルを (a)+(e) ハイブリッドから他 whitelist ジャンルに切替する。承認後実装成功率 ≥ 80% は副次指標として併用。
3. **CEO 推奨**: **YES 採択**
4. **影響**: PM W4-02 タスクで KPI 達成検証、TR-4 発動条件文書化、Phase 2 ジャンル拡張の判断ルート確立
5. **反対想定 + 対処**: 「30% は厳しい / ベンチマーク不在」→ 自然棄却込み数値、Phase 1 中の調整は CEO 即決ルートで対応 /「単一指標化はリスク」→ 副次指標 ≥ 80% 併用で多面評価維持

---

## 議決-5: 必須コントロール 50 項目採用

1. **起案**: PM + Review / **根拠**: `ceo-dec-019-033-consolidation.md` §5、Review §8 推奨
2. **議決内容**: 必須コントロールを既存 34 項目（G-01〜12 / G-V2-01〜11 / C-A-01〜05 / C-OC-01〜05 / H-09/10 / G-Top-1〜4 / HITL 1〜8）+ DEC-019-033 追加 16 項目（P-UI-01〜10 / KE-01〜04 / HITL-9〜11）= 計 50 項目に拡張する。P-UI コントロール数は PM 提案 6 項目ではなく Review 提案 10 項目を採用（priviledge escalation 防止優先）。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Dev 工数 +6 d（P-UI 4 項目追加分）、Review 工数 +2 d（P-UI-09/10）、Phase 1 着手前 25 項目クリア必須
5. **反対想定 + 対処**: 「50 項目は管理過剰」→ R-019-15 赤対応で必須、Phase 1 後に運用統合再評価 /「PM 6 項目で十分」→ Review §8 PE-01〜12 で 4 項目追加が priviledge escalation 物理防止に必須と判定

---

## 議決-6: HITL 第 9・10・11 種正式追加

1. **起案**: Dev + Review / **根拠**: DEC-019-033 §② / §⑤、Review ODR-OG-06、`ceo-dec-019-033-consolidation.md` §5.2
2. **議決内容**: HITL Gate を従来 8 種（1〜7 種 + PRJ-020 第 8 種）から 11 種に拡張する。第 9 種 `dev_kickoff_approval`（提案承認、SLA 72h、デフォルト reject）/ 第 10 種 `permission_change_review`（権限変更承認、3 ケース限定）/ 第 11 種 `knowledge_pii_review`（ナレッジ PII 漏洩防止、Phase 1 W4 着手）。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Dev W1-04 / W2-05 / W2-07 タスクで実装、Owner 操作工数 +0.5 h/件、HITL pending file + Slack DM + SLA timer 統合
5. **反対想定 + 対処**: 「HITL 11 種は運用過剰」→ 第 10 種は 3 ケース限定（通常 UI 操作不要）、第 11 種は Phase 1 W4 のみで限定的 /「SLA 72h は長い」→ Owner 営業日 5 日換算で実運用整合

---

## 議決-7: BAN drill #3（5/29）実施承認

1. **起案**: Review / **根拠**: ODR-OG-04、Review §10、PM v4 §2.1 W2 タスク
2. **議決内容**: BAN drill #3 を 2026-05-29（金）に実施する。攻撃シナリオ 5 種は Review §8 PE 攻撃面評価から PE-01（policy 直接書換）/ PE-03（subprocess escape）/ PE-04（OAuth token 抽出）/ PE-06（kill switch 迂回）/ PE-08（audit log 改竄）を流用、5 シナリオ全 Pass を Phase 1 着手 5/26 Conditional Go 条件 (2) として絶対条件化。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Review 部門 5/29 drill 実施工数 1.0 d、Dev サポート 0.5 d、drill #3 結果は 5/30 W2 終了時会議で報告
5. **反対想定 + 対処**: 「5/29 は Phase 1 着手 5/26 後でタイミング不整合」→ Pre-Phase Week 内 drill のため着手前検証として整合 /「5 シナリオは過剰」→ R-019-15 赤格付けへの直接対応で必須

---

## 議決-8: R-019-15 priviledge escalation 攻撃 赤格付け公式化

1. **起案**: Review / **根拠**: ODR-OG-05、Review §9、`ceo-dec-019-033-consolidation.md` §6
2. **議決内容**: リスク登録簿に R-019-15「priviledge escalation 攻撃（Open Claw が自身の権限を昇格させる経路）」を **赤** 格付けで公式登録する。緩和策は P-UI-01〜10 全実装 + BAN drill #3 Pass を Phase 1 着手の絶対条件化。R-019-13 / R-019-14 / R-019-16（黄）も同時登録。
3. **CEO 推奨**: **YES 採択**
4. **影響**: 既存赤リスク 3 件 + R-019-15 で計 4 件、Phase 1 W3-06 / W4-03 で pentest 第 2 / 3 回実施、Conditional Go 3 条件と直結
5. **反対想定 + 対処**: 「赤格付けは過剰評価」→ priviledge escalation = ToS 違反 + BAN リスク激増、E 案物理不可能化が五者共通結論で赤確定 /「黄で十分」→ Review PE-01〜12 で 4 件残黄、対処後再評価

---

## 議決-9: Heading A 補強表記 A1 採用

1. **起案**: Marketing / **根拠**: Mkt-Update-01、`marketing-owner-gate-messaging-update.md`
2. **議決内容**: Heading A（DEC-019-027「AI 組織が AI 組織を運営する」）を維持し、LP Hero sub-head に補強表記 A1「オーナー承認下で AI 組織が AI 組織を運営する。Owner-in-the-loop transparent AI org.」を追加採用する。プレス見出し補強 P1 も同時採用。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Marketing 部門 LP / プレス文言再調整、競合差別化 28/28 完全制覇維持、外部一次比較で次点 Cursor の 2.5 倍差訴求
5. **反対想定 + 対処**: 「sub-head が長文化」→ A1 は 2 行構成で視認性確保 /「Owner-in-the-loop は専門用語で B2B 中小企業に伝わりにくい」→ 日本語併記「オーナー承認下で」で平易化済

---

## 議決-10: Dev 2 名体制 Phase 1 全期間確保

1. **起案**: PM + Review / **根拠**: ODR-PUI-01、Review §8、PM v4 §2.2
2. **議決内容**: Phase 1（5/26〜6/20）全期間で Dev 2 名体制を確保する。実装方式は「Dev 部門エージェント並列起動 = 1 セッション内で複数 Dev エージェントを並列発注する運用化」または Pre-Phase 5/16-18 前倒し着手。Dev 工数 28.5 d を 4 週間 × 2 名 = 40 営業日内に収束させる。
3. **CEO 推奨**: **YES 採択**
4. **影響**: 1 セッション内 Dev 並列発注 SOP 化（DEC-019-025 順守 general-purpose 系）、書込競合防止のための作業分割ルール策定
5. **反対想定 + 対処**: 「Owner 単独運用で 2 名体制は不可能」→ AI エージェント並列起動で物理的に対応可能 /「並列で書込競合リスク」→ ファイル分割 + 順序明示の発注 SOP で回避

---

## 議決-11: 外部 policy import 機能 Phase 1 完全無効化

1. **起案**: Review / **根拠**: ODR-OG-03、Review §8 PE-01 攻撃面
2. **議決内容**: Open Claw 権限管理 UI の「外部 policy import」機能（YAML / JSON ファイルからの一括設定機能）を Phase 1 期間中は完全無効化する。Phase 2 以降に再評価。Phase 1 では Owner UI 手動設定 + Supabase `policy_versions` バックアップ復元のみを許可。
3. **CEO 推奨**: **YES 採択**
4. **影響**: HITL 第 10 種発動条件のうち「外部 import 時」が Phase 1 では発生しない、3 ケース → 2 ケース運用に簡素化
5. **反対想定 + 対処**: 「policy 大量設定が手間」→ Phase 1 はカテゴリ 7 種で 50 設定程度、UI 手動で十分 /「Phase 2 で必要」→ Phase 1 完了後に PE 攻撃面再評価で慎重採用

---

## 議決-12: 1Password TOTP Owner 二要素認証採用

1. **起案**: Review / **根拠**: ODR-OG-02、P-UI-01、Review §8
2. **議決内容**: Owner の権限管理 UI ログイン認証を 1Password TOTP（既契約 $2.99/月）による二要素認証必須化する。policy 変更時には TOTP 再入力 + 5 秒 cool-down + 確認モーダル（P-UI-02）の三重ガード。kill switch ボタンのみ TOTP 省略許可（緊急停止優先）。
3. **CEO 推奨**: **YES 採択**
4. **影響**: P-UI-01 として Dev 5/25 着手前完遂、Owner 操作工数 +5 秒/policy 変更、追加コスト $0（既契約内）
5. **反対想定 + 対処**: 「TOTP 入力が頻繁すぎる」→ session 30 分内は再入力不要、変更時のみ /「TOTP 紛失時のリスク」→ 1Password recovery code + Owner 物理保管で対応

---

## 議決-13: DEC-019-034 P-D 改 維持 + 微修正 C-OC-06/07/08 採択

1. **起案**: Research / **根拠**: `research-pd-revised-validation.md` §7、DEC-019-034（提案）
2. **議決内容**: 接続方式 P-D 改（Process Decoupling Wrapper）の維持を再確認し、上流 personal AI assistant 化に対する微修正 3 点を追加発令する。C-OC-06（OpenclawRuntime adapter monthly contract test 20 ケース、5/30 実装）/ C-OC-07（C-OC-01 fork weekly mirror 自動化、5/24 実装）/ C-OC-08（Anthropic SDK pin 監視、5/30 実装）。新規リスク R-019-12-C「stream-json schema breaking」を黄格付け優先順位 7 位で起票。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Dev W2-D-Contract / W2-D-Mirror / W2-D-SDKPin タスク追加（合計 +1.5 d、既存 W2-D-Notify-CL に統合）、追加コスト $0、上流変動 8 項目中 6 項目（75%）吸収可能
5. **反対想定 + 対処**: 「P-A 直叩きへ切替の方が安全」→ 比較表で P-D 改が 5 軸中 4 軸優位、相対不利化せず /「微修正 3 点は工数膨張」→ 既存タスク統合で 1.5 d 増のみ

---

## 議決-14: DEC-019-035 Issue/changelog 監視運用 SOP 採択（月 $0）

1. **起案**: Research / **根拠**: `research-issue-changelog-monitor-ops.md` §0、DEC-019-035（提案）
2. **議決内容**: Phase 1 期間中の Issue/changelog 監視運用 SOP を「daily 09:00 JST baseline + on-push GitHub Actions + atom feed 5 分 polling」のハイブリッド方式（案 E）で採択する。3 段階 severity（L1 info / L2 warn / L3 critical）+ breaking change keyword regex 判定、通知ルートは Slack `#clawbridge-changelog` + メール CEO 経由 Owner 要約 + L3 時 24h harness pause。月額コスト **$0/月**（既存 Doppler / Vercel / Resend / GitHub すべて無料枠内）。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Research 監視運用 / Dev 影響評価 + コード修正 / CEO HITL escalation 判断の 3 部署分担確立、追加コスト $0、breaking 検知遅延 5 分以内（atom feed 経由）
5. **反対想定 + 対処**: 「daily ベースラインで 24h 検知遅延」→ atom feed 5 分 polling で速報補完 /「rate limit 抵触リスク」→ daily + on-push のハイブリッドで余裕、案 A hourly は不採用

---

## 議決-15: DEC-019-036 上流 pivot に伴う Phase 2 機能候補 3 件登録

1. **起案**: Research / **根拠**: `research-personal-ai-assistant-pivot-impact.md` §0 / §5、DEC-019-036（提案）
2. **議決内容**: Open Claw 上流 personal AI assistant 化を受けて、Phase 2（7/5-8/1）追加検討候補として 3 機能を Phase 2 計画に正式登録する。① multi-Owner 対応（複数 Owner の権限分離）/ ② org template marketplace（AI 組織テンプレート流通）/ ③ cross-Owner knowledge sharing（ナレッジの組織間共有）。Phase 1 スコープ差し戻し不要、Phase 1 完了後 6/20 に Phase 2 Go/NoGo 判定で精査。Marketing 28/28 完全勝利は維持可能（pivot を訴求コアとして取込み可）。
3. **CEO 推奨**: **YES 採択**
4. **影響**: Phase 2 候補機能リスト確定、PM Phase 2 WBS 起案時に 3 機能を含めて検討、Marketing Heading A 訴求が「組織型 AI ハーネス」軸として上流 pivot の対極軸で強化
5. **反対想定 + 対処**: 「Phase 2 機能候補は時期尚早」→ 候補登録のみで Phase 2 着手判定は 6/20 で別途決裁、現時点コミット無し /「3 機能は多すぎ」→ Phase 2 期間 4 週間内で全 3 機能完遂は不要、優先順位は Phase 2 起案時に再決定

---

## 集計

| 区分 | 件数 |
|---|---|
| CEO 推奨採択 | **15 件**（全件） |
| CEO 推奨修正 | 0 件 |
| CEO 推奨棄却 | 0 件 |

**全 15 議決 CEO 推奨 YES 採択**。Owner 最終承認は 5/8 検収会議で逐次実施、議決-1〜12 は DEC-019-033 既起票内容の正式承認、議決-13〜15 は DEC-019-034/035/036 として新規起票予定。
