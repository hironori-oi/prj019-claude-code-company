最終更新: 2026-05-04 / 起案: PM 部門

# PRJ-019 Clawbridge — 6 部署横断 Cross-References 更新 Plan（v2.1 → v2.2 反映）

- 案件: PRJ-019「Clawbridge」
- 担当: PM 部門
- 版: v1.0（2026-05-04 起案）
- トリガー: `pm-phase1-plan-v2.2.md`（DEC-019-050 + DEC-019-051 反映、334 行、本日納品）確定 → 6 部署横断レポートへの整合反映が必要
- 関連: `ceo-owner-consolidated-v7.md`、`projects/PRJ-019/decisions.md` line 85-86、5/8 検収会議まで残 4 日

---

## §0 本書の位置付け

本日 2026-05-04 確定の Phase 1 計画 v2.2（subscription $400 主軸 + API ≤$30 + 5 必須施策 + Risk v3.1 + 確度 +2% + 議決-20〜24 追加）を 6 部署が保有する既存レポートに同期させるための **更新箇所一覧 + 優先度 + 所要時間試算 + 依存関係** を提示する。5/8 検収会議の議決-20〜24 採択前に「PM 計画 v2.2 と他部署成果物の不整合」を解消し、議事の混乱を防ぐ。

### §0.1 更新総量サマリ

| 部署 | 対象レポート数 | 更新箇所数 | 所要時間合計 | 5/8 必須 | 5/22 必須 | 5/30 まで | 6/13 まで |
|---|---|---|---|---|---|---|---|
| **PM** | 4 | 18 | 5.0h | 4 | 4 | 6 | 4 |
| **Dev** | 3 | 11 | 4.0h | 3 | 5 | 2 | 1 |
| **Review** | 3 | 14 | 4.5h | 5 | 6 | 2 | 1 |
| **Research** | 2 | 7 | 2.0h | 2 | 3 | 1 | 1 |
| **Marketing** | 2 | 8 | 2.5h | 3 | 2 | 2 | 1 |
| **秘書** | 4 | 12 | 3.0h | 8 | 2 | 1 | 1 |
| **計** | **18** | **70** | **21.0h** | **25** | **22** | **14** | **9** |

→ 5/8 検収会議までに **5/8 必須 25 件 / 9.5h** の更新を完遂、残は段階的に消化。

---

## §1 PM 部門 — 4 レポート / 18 更新箇所 / 5.0h

### §1.1 `pm-conditional-go-tracker.md`（5/8 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 1-1 | §0 全体 | "5/9〜5/25 17 日間" | "5/9〜5/25 17 日間（W0-Week2 と同期、DEC-019-051 5 必須施策 5 件並走）" |
| 1-2 | §1 (C-1) DoD | "P-UI-01〜09 を 5/25 までに完遂（権限 UI 必須 9 項目）" | 維持 + 注記「5/22 までに mock-claude 70% 化（DEC-019-051 施策-1）と同時並行」 |
| 1-3 | §1 後段 | "1 条件でも欠落 → Phase 1 着手 5/26 を 6/2 に 1 週間延期" | 維持 + 「+ DEC-019-051 5 必須施策のうち施策-1（mock-claude 70% 化）未完遂時も同 fallback」追加 |
| 1-4 | §7 Gate 判定 | （月次予算 $300 のみ言及） | 「月次総額 ≤$430（subscription $400 + API ≤$30）」に追記 |

優先度: **5/8 必須**（議決-20 採択前に予算根拠統一）

### §1.2 `pm-phase1-burndown-template.md`（5/22 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 1-5 | §0 全体俯瞰 | "Dev 工数（pm-v4 §2.2）" | 維持 + 「W0-Week2 5 必須施策（5/9-5/22、SP42、DEC-019-051）を別ライン burndown」追加 |
| 1-6 | §1.1 W1 DoD W1-04 | "HITL-9 統合テスト" | 維持 + 「mock-claude 70% 化基盤（W0-Week2 施策-1 完遂前提）」依存注記 |
| 1-7 | §2 mermaid | （W1〜W4 のみ） | W0-Week2（5/9-5/22）section 追加、SP42 burndown 線追加 |
| 1-8 | （新規節） | — | §2.5 「W0-Week2 5 必須施策 burndown（5/9-5/22）」新設、daily SP 消化 expected line |

優先度: **5/22 必須**（W0-Week2 期間中の日次計測対象）

### §1.3 `pm-phase1-day0-readiness-checklist.md`（5/8 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 1-9 | §1.3 PM 部門 P-02 | "月次予算 4 区分配分稼働（API/Infra/Tools/Buffer）" | "月次予算 4 区分配分稼働（subscription $400 / API ≤$30 / インフラ $0 / Buffer $0、DEC-019-051）" |
| 1-10 | §1.1 Dev D-07 | "cost-tracker 稼働（4 層 cap: session/project/day/month）" | "cost-tracker 稼働（4 層 cap + Anthropic API 三段階 guard ok/warn $24/auto_stop $28.5/hard_fail $30、DEC-019-050）" |
| 1-11 | §1.5 Review V-01 | "BAN drill #3（5/29 実施）準備完了" | 維持 + 「mock 70% 化条件付き、DEC-019-051 施策-1/施策-5 連動」 |
| 1-12 | §0 タイムライン | （Day-0 のみ） | "Day-0 (5/26) Go/NoGo は W0-Week2 5/22 mock 70% 化完遂の上で成立" 注記追加 |
| 1-13 | （新規項目） | — | Dev D-09「Anthropic Console + cost-monitor.ts 同期 SOP 策定（5/22 完遂）」追加 |

優先度: **5/8 必須**（5/8 議決-20/-23 採択直後から運用開始）

### §1.4 `pm-cost-and-controls-plan-v4-1.md`（5/8 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 1-14 | §0 必須コントロール 28→34 | （DEC-019-050/-051 反映前） | "34 項目 → 35 項目（HITL 第 11 種 `knowledge_pii_review` + Anthropic Console 同期 SOP 追加）" |
| 1-15 | 月次予算節 | "Phase 1 追加発生 中央値 $33 / 上限 $93" | "月次総額 ≤$430（subscription $400 + 新規 API ≤$30、DEC-019-050/-051 構造再定義、追加発生上限 $300 充当率 10%）" |
| 1-16 | リスク参照 | "Risk Register v3" | "Risk Register v3.1（21 件、R-019-19/20/21/22 新規 + R-019-09 緑化、議決-21 採択待ち）" |
| 1-17 | 確度節 | "5/26 着手 84%" | "5/26 着手 86%（DEC-019-051 反映、+2%）/ 6/20 完了 77% / Day-0 99%" |
| 1-18 | 5 必須施策節（新設） | — | "§Y W0-Week2 5 必須施策（DEC-019-051、Dev/Review、5/9-5/22、API 消費 $19-31→$11-15 圧縮）" 新設 |

優先度: **5/8 必須**（議決-20/-21/-22/-23/-24 すべての根拠）

---

## §2 Dev 部門 — 3 レポート / 11 更新箇所 / 4.0h

### §2.1 `dev-w0-week2-bootstrap.md`（5/22 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 2-1 | 冒頭メタ | （v1） | v2 起こし、DEC-019-050/-051 反映明示 |
| 2-2 | 月次予算節 | "$300 ハードキャップ" | "subscription $400 + API ≤$30 = 月次総額 ≤$430（DEC-019-051）" |
| 2-3 | （新規節） | — | "§N W0-Week2 5 必須施策実装計画（DEC-019-051）" = 施策-1〜5 + SOP の 6 タスク（SP42）詳細 |
| 2-4 | （新規節） | — | "§N+1 Anthropic API budget guard 実装連携（dev-budget-guard-30usd-v1.md 参照、warn $24 / auto_stop $28.5 / hard_fail $30）" |
| 2-5 | テスト件数 | "95 tests" | "95 tests + budget-guard.test.ts 13 ケース = 108 tests（5/22 W0-Week2 完了見込）" |

### §2.2 `dev-architecture-w0-skeleton.md`（5/22 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 2-6 | アーキ図 Mermaid | （subscription 主軸記述なし） | 「subscription 経路 95% / API 経路 5%」を流量比として明示（DEC-019-051） |
| 2-7 | コスト層 | （単一層のみ） | 「アプリ層 cost-monitor + Anthropic Console Hard $30 = 二重防御（DEC-019-050）」追加 |
| 2-8 | （新規節） | — | "subscription 主軸方針（DEC-019-051）と P-D 改（DEC-019-006）の構造的整合" §追加 |

### §2.3 `dev-security-w0-skeleton.md`（5/30 まで、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 2-9 | 緊急停止 SOP | （cost cap のみ） | "Anthropic API spend ≥ $30 → hard_fail throw + Slack `#prj019-drill` HIGH + Owner DM" 追加 |
| 2-10 | （新規節） | — | "API key 経路の補助運用 5%（HITL 通知 / mock-claude / E2E / drill / ナレッジ batch、DEC-019-051）" |
| 2-11 | （新規節） | — | "subscription quota 突破時の API fallback 禁止方針 SOP（R-019-21 mitigation）" |

優先度: 2-1〜2-5 = **5/22 必須**（W0-Week2 完遂条件）/ 2-6〜2-8 = **5/22 必須** / 2-9〜2-11 = **5/30 まで**

---

## §3 Review 部門 — 3 レポート / 14 更新箇所 / 4.5h

### §3.1 `review-pre-phase1-readiness-assessment.md`（5/8 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 3-1 | 冒頭判定 | "強い条件付き Go" | 維持 + 「+ DEC-019-051 採択により 5/26 Conditional Go 達成確率 84→86%（+2%）」 |
| 3-2 | 月次予算 | "$300/月" | "≤$430/月（subscription $400 + API ≤$30）" |
| 3-3 | 3 採択条件節（新規） | — | DEC-019-051 §3 条件転記: ① 議決-21/-22/-23 全採択、② 5/22 mock 70% 化、③ Console 同期 SOP 策定 |
| 3-4 | リスク格付一覧 | (R-019-09 = 12 赤) | "R-019-09 = 6 緑（cap $30 縮小 + 第 6 補助層追加効果）" |
| 3-5 | （新規追加） | — | R-019-19/20/21/22 を v3.1 として新規列挙 |

### §3.2 `review-risk-register-v3.md` → `v3.1` 化（5/8 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 3-6 | ファイル名/版 | v3（17 件） | **新規 `review-risk-register-v3-1.md`** に複製生成（既存 `secretary-risk-register-v3-1.md` 雛形と統合確認） |
| 3-7 | R-019-09 | "12 赤、24/7 監視優先度高" | "6 緑（再評価、DEC-019-050 cap 縮小により 24/7 監視優先度緩和 + Review §3 第 6 補助層効果）" |
| 3-8 | 新規 R-019-19 | — | "API $30 Hard cap 突破時の Phase 1 中断、黄、PM+Review 統合、mitigation: cost-meter 二段警告 / subscription only fallback / drill #3 5/24 まで完了" |
| 3-9 | 新規 R-019-20 | — | "アプリ層 × Console 二重防御 drift、緑、Review、mitigation: 月次同期チェック SOP（議決-23）" |
| 3-10 | 新規 R-019-21 | — | "subscription quota 突破時 API fallback 急速消費、黄、Review+Research 統合、mitigation: API fallback 禁止方針 SOP" |
| 3-11 | 新規 R-019-22 | — | "mock/template 遅延で API 消費膨張、緑、Research、mitigation: mock 70% 化 + 通知テンプレ化 5/22 完遂（議決-22/-23）" |
| 3-12 | サマリ table | "17 件、赤 3 / 黄 9 / 緑 5" | "21 件、赤 2 / 黄 14 / 緑 5（v3.1、DEC-019-051）" |

### §3.3 `review-test-strategy-phase1.md`（5/22 必須、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 3-13 | mock 比率 | （言及なし or 暗黙） | "mock-claude 70% 化を 5/22 までに完遂（DEC-019-051 施策-1、E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling）" §追加 |
| 3-14 | drill #3 シナリオ | "5 シナリオ実 API 消費 $5-10" | "5 シナリオ + mock 100% 化（施策-5）= 実 API 消費 $3-5（DEC-019-051）" |

優先度: **5/8 必須 5 件 + 5/22 必須 6 件 + 5/30 まで 2 件 + 6/13 まで 1 件**

---

## §4 Research 部門 — 2 レポート / 7 更新箇所 / 2.0h

### §4.1 `research-pd-revised-validation.md`（5/8 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 4-1 | 冒頭結論 | "P-D 改 採用妥当性確認" | 維持 + 「DEC-019-050 ($30 cap) 縮小は P-D 改 相対優位を**逆に拡大**（subscription 経路 95% 流量比、`research-subscription-mainline-validation.md` で公式化）」 |
| 4-2 | 流量比節（新規） | — | "subscription 95% / API 5%（DEC-019-051）" 明示 + 5 必須施策の影響評価 |
| 4-3 | （新規節） | — | "DEC-019-051 採択後の P-D 改 維持・強化結論" §追加 |
| 4-4 | リスク参照 | "R-019-12-A/B" | "R-019-12-A/B + R-019-22 mock/template 遅延（緑、5/22 mock 70% 化で解消）" |

### §4.2 `research-knowledge-and-transparency-design.md`（5/22 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 4-5 | コスト試算 | "embeddings 重複消費 $5-10" | "embeddings 重複消費 $5-10 → batch caching で $1（DEC-019-051 施策-4、5/30 完遂）" |
| 4-6 | （新規節） | — | "subscription 主軸下のナレッジ抽出運用（API key 経路 5% に分類、HITL 第 11 種 PII 保護連動）" |
| 4-7 | 月次総額参照 | （言及なし） | "月次総額 ≤$430、ナレッジ batch caching は API ≤$30 内 1 回限り消費" |

優先度: **5/8 必須 2 件 + 5/22 必須 3 件 + 5/30 まで 1 件 + 6/13 まで 1 件**

---

## §5 Marketing 部門 — 2 レポート / 8 更新箇所 / 2.5h

### §5.1 `marketing-portfolio-integration-plan.md`（5/8 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 5-1 | 月次予算訴求 | "月次予算 $300" | "月次総額 ≤$430（既契約 $400 + API ≤$30）= 個人開発レベルの cost discipline 実証" |
| 5-2 | 28x28 narrative | （v2.1 維持） | **不変**（DEC-019-027 Heading A 維持、CEO 推奨） — 確認のみ、変更なし |
| 5-3 | $30 cap 訴求 | （言及なし） | "Owner 直接決裁の Anthropic API spend cap $30/月 = 物理防御 + subscription 主軸方針（DEC-019-050/-051）" 追加 |
| 5-4 | 公開タイミング | "6/20 公開" | "6/27 朝公開（DEC-019-033 + Phase 1 完了 6/20 → 公開リハーサル 6/26 → 6/27 朝、DEC-019-051 採択後も維持）" |

### §5.2 `marketing-knowledge-base-extraction-spec.md`（5/30 まで、所要 1.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 5-5 | コスト見積 | "$5-10/抽出回" | "$1/抽出回（batch caching、DEC-019-051 施策-4、5/30 完遂前提）" |
| 5-6 | 月次予算 | "$300/月" | "≤$430/月（subscription $400 + API ≤$30、DEC-019-051）" |
| 5-7 | 28x28 narrative | （v2.1 維持） | **不変**（変更なし、確認のみ） |
| 5-8 | （新規節） | — | "PII 保護 + subscription 主軸下のコスト構造（API ≤$30 内、batch 1 回限り）" |

優先度: **5/8 必須 3 件 + 5/22 必須 2 件 + 5/30 まで 2 件 + 6/13 まで 1 件**

---

## §6 秘書部門 — 4 レポート / 12 更新箇所 / 3.0h

### §6.1 `secretary-agenda-v7.md`（5/8 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 6-1 | 議決数 | "13 件" | "14 件（議決-7〜18 + 議決-19/20/21/22/23/24、計 18 行表記）" |
| 6-2 | 想定時間 | "60 min" | "90-105 min（議決-20〜24 = 5 件 × 5 min = +25 min + 議論余裕 +20 min）" |
| 6-3 | 議決-20 | — | "PM 月次予算 v2 ($430/月) 正式採用、起票 PM、推奨 YES" |
| 6-4 | 議決-21 | — | "Risk Register v3.1（R-019-19〜22 + R-019-09 緑化）正式採用、起票 Review、推奨 YES" |
| 6-5 | 議決-22 | — | "既存 5 reports 差分修正 正式採用、起票 Review、推奨 YES" |
| 6-6 | 議決-23 | — | "mock-claude 70% 化 SOP + Anthropic Console 同期 SOP 正式採用、起票 Review、推奨 YES" |
| 6-7 | 議決-24 | — | "DEC-019-051 = subscription 主軸方針 Phase 1 正式採用、起票 CEO + Research、推奨 YES" |

### §6.2 `secretary-risk-register-v3-1.md`（5/8 必須、所要 0.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 6-8 | ステータス | （ドラフト） | "確定（5/8 議決-21 採択待ち、内容は CEO §3.3 統合判断と一致確認）" |
| 6-9 | Review v3 → v3.1 移行整合 | （秘書独自記載） | Review 部門 `review-risk-register-v3-1.md`（§3.2 で新規生成）と整合確認後 cross-reference リンク追加 |

### §6.3 `secretary-cover-letter-v3.md`（5/8 必須、所要 0.5h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 6-10 | 議題総数・所要時間 | （v2 のまま） | "議題 14 件、所要 90-105 min、議決-20〜24 5 件全 YES 採択推奨" |

### §6.4 `secretary-w0-week1-meeting-minutes-template-v2.md`（5/8 必須、所要 1.0h）

| # | 行（推定） | 旧文言 | 新文言 |
|---|---|---|---|
| 6-11 | DEC 起票補助 §4 | "DEC-019-021〜030 計 10 件" | "DEC-019-021〜030 + DEC-019-050/-051 計 12 件" |
| 6-12 | 投票集計 §3.2 | "17 議題" | "22 議題（議決-7〜24 + Phase 1 着手判定 / scaffold 等別カウント）" |

優先度: **5/8 必須 8 件 + 5/22 必須 2 件 + 5/30 まで 1 件 + 6/13 まで 1 件**

---

## §7 更新優先度マトリクス（時系列）

### §7.1 5/8 必須（25 件 / 9.5h）— 議決-20〜24 採択前に完遂

| 部署 | レポート | 件数 | 担当者想定 |
|---|---|---|---|
| PM | conditional-go-tracker / day0-readiness-checklist / cost-and-controls-plan-v4-1 | 4+5+5=**14** | PM Agent（本書起票者と同一） |
| Dev | （5/8 不要、5/22 まで） | 0 | — |
| Review | pre-phase1-readiness-assessment / risk-register v3.1 化 | 5 | Review Agent |
| Research | pd-revised-validation | 1 | Research Agent |
| Marketing | portfolio-integration-plan | 1 | Marketing Agent |
| 秘書 | agenda-v7 / risk-register-v3-1 / cover-letter-v3 / minutes-template-v2 | 4 | 秘書 Agent |
| **計** | | **25** | |

### §7.2 5/22 必須（22 件 / 7.5h）— W0-Week2 完了 + Phase 1 着手 Go/NoGo

| 部署 | レポート | 件数 |
|---|---|---|
| PM | phase1-burndown-template / cost-and-controls-plan-v4-1 (継続) | 4 |
| Dev | w0-week2-bootstrap / architecture-w0-skeleton | 5+3=**8** |
| Review | risk-register v3.1 後続 / test-strategy-phase1 | 6 |
| Research | knowledge-and-transparency-design 一部 | 3 |
| Marketing | portfolio-integration-plan 28x28 確認 + knowledge-base-extraction-spec 一部 | 2 |
| 秘書 | agenda-v7 細部 + minutes-template-v2 細部 | 2 |
| **計** | | **22** |

### §7.3 5/30 まで（14 件 / 3.5h）— Phase 1 W2 終了 + NG-3 再評価

| 部署 | レポート | 件数 |
|---|---|---|
| PM | day0-readiness-checklist 後続 + 月次 tracker template 連動 | 6 |
| Dev | security-w0-skeleton | 2 |
| Review | test-strategy-phase1 後続 | 2 |
| Research | knowledge-and-transparency-design 後続 | 1 |
| Marketing | knowledge-base-extraction-spec | 2 |
| 秘書 | task-ledger 整合 | 1 |
| **計** | | **14** |

### §7.4 6/13 まで（9 件 / 0.5h）— Phase 1 完了 + Phase 2 Go/NoGo

| 部署 | レポート | 件数 |
|---|---|---|
| PM | tracker / burndown / day0 readiness 振り返り | 4 |
| Dev | security-w0-skeleton 細部 | 1 |
| Review | risk-register v3.1 完了反映 | 1 |
| Research | pd-revised / knowledge cross-check | 2 |
| Marketing | portfolio Phase 1 完了反映 | 1 |
| **計** | | **9** |

---

## §8 部署別所要時間試算（明細）

| 部署 | レポート | 所要時間 | 種類 |
|---|---|---|---|
| **PM** | conditional-go-tracker | 1.5h | 既存編集 |
| | phase1-burndown-template | 1.0h | 既存編集 + 新規節 |
| | day0-readiness-checklist | 1.0h | 既存編集 |
| | cost-and-controls-plan-v4-1 | 1.5h | 既存編集 + 新規節 |
| | **PM 計** | **5.0h** | |
| **Dev** | w0-week2-bootstrap | 1.5h | 既存編集 + 新規節 |
| | architecture-w0-skeleton | 1.0h | 既存編集 + Mermaid 修正 |
| | security-w0-skeleton | 1.5h | 既存編集 + 新規節 |
| | **Dev 計** | **4.0h** | |
| **Review** | pre-phase1-readiness-assessment | 1.5h | 既存編集 |
| | risk-register v3 → v3.1 化 | 1.5h | 新規ファイル生成（v3.1） |
| | test-strategy-phase1 | 1.5h | 既存編集 + 新規節 |
| | **Review 計** | **4.5h** | |
| **Research** | pd-revised-validation | 1.0h | 既存編集 + 新規節 |
| | knowledge-and-transparency-design | 1.0h | 既存編集 |
| | **Research 計** | **2.0h** | |
| **Marketing** | portfolio-integration-plan | 1.0h | 既存編集（28x28 narrative 不変確認） |
| | knowledge-base-extraction-spec | 1.5h | 既存編集 + 新規節 |
| | **Marketing 計** | **2.5h** | |
| **秘書** | agenda-v7 | 1.0h | 議決追加 |
| | risk-register-v3-1（既存雛形）整合 | 0.5h | Review 部門との整合確認 |
| | cover-letter-v3 | 0.5h | サマリ更新 |
| | minutes-template-v2 | 1.0h | 投票集計欄拡張 |
| | **秘書 計** | **3.0h** | |
| **6 部署合計** | **18 レポート** | **21.0h** | |

---

## §9 依存関係 + 並列実行可能性

### §9.1 直列依存（必ず順序を守る）

1. **Review v3.1 ファイル生成（§3.2）** → 秘書 `risk-register-v3-1.md` 整合確認（§6.2）
2. **PM cost-and-controls-plan-v4-1 月次予算節更新（§1.4）** → Dev `architecture-w0-skeleton` の月次予算 cross-reference（§2.2）
3. **PM agenda 議決-20〜24 起票（議決リスト確定）** → 秘書 agenda-v7 反映（§6.1）

### §9.2 並列実行可能（5/4-5/7 の 4 営業日で並列発注推奨）

- §1 PM 4 レポート ‖ §3 Review 3 レポート ‖ §4 Research 2 レポート ‖ §5 Marketing 2 レポート（5/8 必須分）
- §2 Dev 3 レポート は単独 Dev リードで直列処理（同一執筆者前提）
- §6 秘書は §1.4 §3.2 完了後に追従（5/7 EOD まで）

### §9.3 5/4-5/8 並列発注 4 部署対応スケジュール

| 部署 | 発注 | 締切 | 並列可否 |
|---|---|---|---|
| PM（自部署） | 5/4 即時 | 5/7 EOD | — |
| Review | 5/5 朝 | 5/7 EOD | ◎ |
| Research | 5/5 朝 | 5/7 EOD | ◎ |
| Marketing | 5/5 朝 | 5/7 EOD | ◎ |
| Dev | 5/5 朝（5/22 必須分は後続） | 5/22 EOD | △（5/8 までは不要） |
| 秘書 | 5/7 朝（他部署完了後） | 5/8 09:00 | × |

---

## §10 結論 + 次のアクション

1. **6 部署横断で 18 レポート / 70 更新箇所 / 21.0h を 4 段階優先度（5/8 / 5/22 / 5/30 / 6/13）で消化**
2. **5/8 必須 25 件 / 9.5h は 4 部署並列発注（PM / Review / Research / Marketing）+ 秘書追従で 5/4-5/7 4 営業日内に完遂可能**
3. **PM v2.2 と他部署成果物の不整合を 5/8 検収会議までに解消し、議決-20〜24 採択後の二度手間を防ぐ**
4. **DEC-019-050（$30 cap）+ DEC-019-051（subscription 主軸）+ Risk v3.1（21 件）+ 月次総額 ≤$430 + 確度 +2% を 6 部署すべての主要レポートに反映**
5. **28x28 narrative（DEC-019-027 Heading A）は不変 — Marketing 2 レポートで確認のみ実施し、変更不要を明記**

### §10.1 CEO への提案

- 5/4 中（本日）に CEO が Review / Research / Marketing 3 部署へ発注 → 5/7 EOD 締切
- 秘書部門は 5/7 完了確認 → 5/7 朝〜夜で agenda v7 / minutes template v2 / risk-register-v3-1 整合 → 5/8 09:00 配布
- Dev 部門は別系統で 5/22 W0-Week2 完了に向け 3 レポート更新（W0-Week2 5 必須施策実装と並走）

---

## §11 関連決裁・参照

### §11.1 反映決裁

- DEC-019-050 (Anthropic API spend cap $30/月、Owner 直接決裁 2026-05-03)
- DEC-019-051 (subscription plan 主軸運用方針 Phase 1 正式採用、CEO 起票 2026-05-04)

### §11.2 参照書

- `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md`（4 部署並列発注 連結報告 v7、本書根拠）
- `projects/PRJ-019/reports/pm-phase1-plan-v2.2.md`（本日納品 v2.2、334 行）
- `projects/PRJ-019/decisions.md` line 85-86（DEC-019-050 + DEC-019-051）

---

## フッタ

- 文書: `projects/PRJ-019/reports/pm-cross-references-update-plan.md`
- 版: v1.0（2026-05-04）
- 起案: PM 部門
- 検収: CEO（5/4 中、Review/Research/Marketing 3 部署発注承認） → 秘書 5/8 09:00 完了確認
- 次回更新: 2026-05-08 検収会議後（議決-20〜24 採択結果反映）+ 2026-05-22 W0-Week2 完了後（5/22 必須分 22 件完遂確認）
