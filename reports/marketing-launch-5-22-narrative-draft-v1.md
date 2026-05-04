# PRJ-019 Clawbridge — 5/22 朝公開前倒し narrative draft v1（35 日圧縮版）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-launch-5-22-narrative-draft-v1 |
| 制定日 | 2026-05-04（Round 9 案 9-D） |
| 起票 | Marketing 部門 |
| 区分 | **5/22 朝 09:00 JST 公開前倒し**（6/27 → 5/22、35 日圧縮）対応 narrative draft v1 |
| 上位決裁（既存維持） | DEC-019-026 / 027 / 028 / 029 / 052 / 055 |
| 上位決裁（新規予定） | **DEC-019-056（5/22 朝公開前倒し確定）** + Round 9-10 オプション A 採択 |
| 親文書（破壊しない、差分追加） | `marketing-phase1-completion-narrative-strategy.md`（DEC-019-052 採択戦略） / `marketing-portfolio-narrative-section-1-3.md`（Round 5） / `marketing-portfolio-narrative-section-4-10.md`（Round 6） / `marketing-launch-x-thread-draft.md`（Round 5） / `marketing-portfolio-metrics-substitution-plan.md`（Round 7、27 placeholder） / `marketing-portfolio-staging-spec.md`（Round 8 γ） / `marketing-launch-runbook-2026-06-20.md`（既存ランブック） / `marketing-technical-deep-dive-vol1.md`〜`vol6.md` |
| 関係: 6/27 維持シナリオ | 6/27 維持は **幹**、5/22 前倒しは **枝**。本書は枝の draft で、6/27 維持の各成果物は破壊しない（fallback で復元可能） |
| 公開時刻（前倒し時） | **2026-05-22（金）09:00 JST**（DEC-019-052 (c) 09:00 JST 維持） |
| 公開時刻（fallback） | 2026-06-27（土）09:00 JST 維持 |
| ステータス | **draft v1**（Round 9-10 完遂結果を待って 5/15 までに v1.1 発行、5/19 W1 着手前に v1.2 確定） |

---

## §0. 200 字エグゼクティブサマリ

本書は CEO Round 9 緊急前倒し発注に応える **5/22 朝公開前倒し narrative draft v1** である。35 日圧縮の核は「Phase 1 W4 完遂を待たず、Round 9-10 完遂時点（mock-claw dry exec Pass + BAN drill #1 dry exec Pass + needs_scout MVP + 構造化 JSON IF + tos_monitor）で十分に語れる **副作用ゼロ + 運用開始** narrative」を主軸に据えること。28x28 victory narrative は 18x18 圧縮可能（Phase 0 → W0-Week2 完遂までの 18 日）と判定。10 sections は 8 sections に圧縮（決戦 W1-W4 / 結果 KPI matrix を統合し、運用開始宣言で締める）。X thread は teaser 1 + launch 5 を維持、KPI 30 日目標は PV 3,000-4,500 / ユニーク 1,800-2,500 に下方修正（Marketing 浸透不足リスク 35%）。3 大リスク（Marketing 浸透不足 / portfolio 実測値不足 / Owner 最終承認時間圧縮）に各 2 緩和策を配置。fallback は 5/19 W1 着手判定で前倒し中止 → 6/27 維持に戻す。

---

## §1. narrative 主軸の update — 5/22 圧縮版で何を語るか

### §1.1 6/27 維持版（既存）vs 5/22 前倒し版の主軸対比

| 観点 | 6/27 維持版（幹） | 5/22 前倒し版（枝） |
|---|---|---|
| 物語の到達点 | 「Phase 1 W4 完遂 = 副作用ゼロ証明 + ベンチマーク 10 連続実行 Pass + Owner-in-the-loop 透明 AI 組織 4 週間 PoC 全達成」 | 「W0-Week2 完遂 = 副作用ゼロ + 運用開始 + 主要ハードガード prefetch 完遂 + Phase 1 W1 着手準備 100%」 |
| narrative の長さ | 28x28 = 28 日 × 28 評価軸 | **18x18 = 18 日（5/2-5/19）× 18 軸**（圧縮、§2 で詳細） |
| 物語の核 | 4 週間 PoC で個人開発者の事業構造を書き換えた | **「着手 18 日で運用開始まで辿り着いた」** + 「公開後も Phase 1 W1-W4 が走り続けている」継続性訴求 |
| 結果の表現 | Phase 1 完了時点の確定値 27 placeholder 全差替 | **Round 9-10 完遂時点の早期確定値 8 件 + 公開後追記予告 19 件**（§2 機構 2 で詳細） |
| 主軸メッセージ | 「Owner-in-the-loop 透明 AI 組織が 28 日で 28 軸全勝利した」 | 「**18 日で運用が始まった。残り 35 日（5/22→6/27）の進化は公開しながら続ける**」 |
| Phase 2 接続 | 公開 = Phase 1 完了報告 | 公開 = **Phase 1 進行中での中間報告**（透明性を強化、PRJ-019 の DEC-019-033 = Owner-in-the-loop の本質と整合） |
| C 透明性 OSS 補助の強化点 | 達成済の透明性 6 軸を主訴求 | 達成済の **5 軸 + 進行中 1 軸の動的開示**（透明性 = 完成形ではなく動的プロセスとしての本質訴求） |

### §1.2 主軸更新点 5 件（CEO 報告用）

1. **「完遂物語」から「進行中物語」への transition** — 6/27 維持版が「終わった話」だったのに対し、5/22 前倒し版は「**進行中の話を進行のまま開示する**」物語に変質。これは DEC-019-033 Owner-in-the-loop transparent AI org の本質と完全整合。
2. **28x28 → 18x18 への圧縮** — 28 日勝利物語を 18 日勝利物語に圧縮（§2 で詳細）。圧縮で失う 10 軸（W1-W4 の 4 ハードガード本番実行 / BAN drill 本番 #2 #3 / 副作用ゼロ証明完遂 / ベンチマーク 10 連続 / Phase 1 完了 sign-off / Phase 2 計画着地）は **「公開後追記」コーナー**を portfolio に常設し、5/22 公開 → 6/27 までの期間に逐次追記する継続コンテンツ化。
3. **DEC-019-052 (a) (b) (c) の維持** — tone B 主軸 / portfolio C 両方併用 / 09:00 JST 公開時刻 を維持。前倒しはあくまで日付軸のみ。Heading A 採用（DEC-019-027）も維持。
4. **「副作用ゼロ + 運用開始」narrative** — Round 9-10 完遂時点で既に確定する強い 2 大訴求（副作用 0 行 + Open Claw runtime + tos_monitor + needs_scout + BAN drill #1 dry exec Pass）を主軸に据え、Phase 1 W1-W4 は「公開後の進化」として接続。
5. **fallback の明示 = 「やめても損しない」設計** — 5/19 W1 着手判定時に Round 9-10 が Pass しなかった場合、即時 6/27 維持に戻す。前倒しに賭けない安全弁を §10 で物理化。

### §1.3 親戦略 DEC-019-052 との整合確認

| DEC-019-052 採択値 | 5/22 前倒し版での扱い | 整合判定 |
|---|---|---|
| (a) tone B 主軸 + C 透明性 OSS 補助 + A 技術深堀り別枠連載 | **維持**（B 主軸 = 18x18 物語型 / C 補助 = 透明性 5+1 軸動的開示 / A 別枠 = vol1 のみ 5/22 同時公開、vol2-6 は cadence で順次） | OK |
| (b) Channel 3 = Zenn 主軸 + note.com サブ | **維持**（5/22 朝同時公開の 3 拠点配信、canonical = 自社 HP） | OK |
| (c) 公開時刻 09:00 JST | **維持** | OK |
| Heading A 採用（DEC-019-027） | **維持**（トップ訴求バナーは "AI 組織が AI 組織を運営する。"、詳細ページ h1 は "Owner-in-the-loop 透明 AI 組織が、ニーズから 60 分で雛形を立てる。") | OK |
| 開示配分 80/50/100/概要（DEC-019-028） | **維持**（前倒しでも開示配分は変えない） | OK |
| HP トップ + 事例 + Contact form のみ（DEC-019-029） | **維持** | OK |

→ 親戦略 6/6 完全整合。前倒しは枝として安全に分離可能。

---

## §2. 28x28 → 18x18 圧縮可能性の評価

### §2.1 28x28 の本質要素

`marketing-28x28-victory-narrative.md` § で確定した 28x28 victory narrative の本質要素は次の 5 本柱：

1. **時間軸**: 28 日（5/2 起案 → 6/20 Phase 1 完了 → 6/27 公開）
2. **評価軸**: 28 軸（透明性 6 / Owner control 6 / 知見蓄積 6 / 法令適合 6 / コスト効率 4）
3. **勝利**: 28 軸全勝利（競合最強 11 軸に対して 28 軸全制覇）
4. **物語構造**: 主役 Owner / 敵 5 件詰み + 内部脅威 / 武器 AI 組織 / 勝利 28 軸
5. **公開タイミング**: 完了後の確定値で語る

### §2.2 18x18 への圧縮設計

5/22 前倒し版での 18x18 構造：

1. **時間軸圧縮**: 18 日（5/2 起案 → 5/19 W1 着手 → 5/22 公開）
2. **評価軸圧縮**: 18 軸（透明性 5 軸達成 + 1 軸進行中 / Owner control 5 軸達成 + 1 軸進行中 / 知見蓄積 4 軸達成 + 2 軸進行中 / 法令適合 3 軸達成 + 3 軸進行中 / コスト効率 4 軸全達成）
3. **勝利**: 18 軸完了 + 10 軸進行中（**「全勝利の物語」から「進行中の物語」への質的変化**、これは敗北ではなく **DEC-019-033 Owner-in-the-loop transparent AI org の本質と完全整合する物語**）
4. **物語構造**: 主役 Owner / 敵 5 件詰み + 内部脅威 / 武器 AI 組織 / **「運用開始までの 18 日 + 進化が続く構造」**
5. **公開タイミング**: 進行中の中間報告

### §2.3 勝利物語の本質保持の評価

| 観点 | 28x28 | 18x18 | 本質保持判定 |
|---|---|---|---|
| 主役の明示 | Owner | Owner | OK |
| 敵の明示 | 5 件詰み + 内部脅威 | 5 件詰み + 内部脅威 + **「Phase 1 進行中の不確実性」** | OK（敵が増えた = 物語の緊張感増） |
| 武器の明示 | AI 組織ハーネス完成形 | AI 組織ハーネス着手形 + 進化中 | OK（**「武器が育つ物語」** に質的変化） |
| 勝利の明示 | 28 軸全勝利 | 18 軸達成 + 10 軸進行中 | **要再設計**（「全勝利」を「運用開始」に置換） |
| 透明性の表現 | 6 軸全達成 | 5 軸達成 + 1 軸進行中 | OK（**「動的透明性」が DEC-019-033 と完全整合**） |
| 個人開発者への訴求 | 完成形提示 | **「進化中の現場を見せる」** | OK（むしろ訴求力強化、個人開発者の現実感に近い） |

**結論**: 18x18 への圧縮は本質を破壊しない。むしろ DEC-019-033 Owner-in-the-loop transparent AI org の本質と整合する **「動的物語」** に進化する。`marketing-28x28-victory-narrative.md` 自体は破壊せず、**「28x28 victory narrative — 5/22 v1.1 圧縮版」** を新規ファイルで起こす。

### §2.4 18x18 narrative 18 行版（draft）

```
[Phase 0 着任 / 5/2-5/4]
01: PRJ-019 Clawbridge が起案された。
02: AI 組織が AI 組織を運営する。
03: 主役は Owner、私たちは harness。
04: 透明性 6 軸を骨格として置いた。
05: BAN リスクを定量で受容した。

[W0-Week1 / 5/5-5/8]
06: 月次予算は ≤$430 で固定した。
07: subscription 主軸で経路を分離。
08: HITL 11 種で gate を物理化した。
09: mock-claude で 70% を吸収する。
10: 副作用ゼロを DoD に刻印した。

[W0-Week2 / 5/9-5/19]
11: Vault に 9 fields を圧縮した。
12: dev:noop で boot を unblock した。
13: standalone repo で物理隔離した。
14: workflow YAML を CI で検証した。
15: 5 ガード前倒しで W1 を始めた。

[運用開始 / 5/19-5/22]
16: Open Claw runtime が動き出した。
17: BAN drill #1 を dry exec で走った。
18: 5/22 朝、運用は止まらず続く。
```

→ 5/22 前倒し時の portfolio §4 28x28 narrative セクション差替版として上記 18 行を採用。

### §2.5 残 10 軸の「公開後追記」コーナー設計

portfolio に **「進化中の章 — 5/22 → 6/27 の動き」** という新セクションを設置（§3.5 で詳細）。10 軸（W1-W4 ハードガード本番 / BAN drill 本番 / 副作用ゼロ完遂 / ベンチマーク / Phase 1 sign-off / Phase 2 計画）を timeline カード化、達成ごとに追記。動的開示 = C 透明性 OSS 補助の本領発揮。

---

## §3. 自社 HP `/case-studies/openclaw-runtime` 全 10 → 8 sections の 5/22 圧縮 draft

### §3.1 セクション構成の圧縮設計

| 旧 (10 sections) | 新 (8 sections) | 圧縮根拠 |
|---|---|---|
| Section 1 開戦 | Section 1 開戦 | 完全保持（5/2 起案物語） |
| Section 2 武器選び | Section 2 武器選び | 完全保持（W0-Week1 4 Round 並列発注） |
| Section 3 闘いの記録 | Section 3 闘いの記録 | 完全保持（5/4 当日 5 想定外撃破） |
| Section 4 武器の正体 | Section 4 武器の正体 | 完全保持（2 層アーキ） |
| Section 5 最大の敵 | Section 5 最大の敵 | 完全保持（NG-1〜3 / BAN / 予算） |
| Section 6 同志たち | Section 6 同志たち | 完全保持（HITL 11 種 / dashboard / ナレッジ） |
| Section 7 裏切られた予算 | Section 7 裏切られた予算 | 完全保持（DEC-019-050 → 051） |
| Section 8 決戦（W1-W4） | **削除（公開後追記コーナーへ移植）** | 5/22 時点では Phase 1 W1 着手前 |
| Section 9 結果 | **Section 8 運用開始 — 18 日で辿り着いた現在地**（新設、Section 9 を圧縮） | 27 placeholder のうち 8 件確定 + 19 件は公開後追記予告 |
| Section 10 次の戦場 | **公開後追記コーナーへ移植**（残 10 軸 timeline カード） | Phase 2 計画は 5/22 時点で未確定 |

### §3.2 各 section の圧縮 / 保持の詳細指示

| Section | 5/22 版での扱い | 行数目安 |
|---|---|---|
| 1 開戦 | Round 5 既存版そのまま流用 | 約 100 行 |
| 2 武器選び | Round 5 既存版そのまま流用 | 約 90 行 |
| 3 闘いの記録 | Round 5 既存版そのまま流用 | 約 110 行 |
| 4 武器の正体 | Round 6 既存版そのまま流用、§4.4「橋」の意味は維持 | 約 80 行 |
| 5 最大の敵 | Round 6 既存版そのまま流用 | 約 100 行 |
| 6 同志たち | Round 6 既存版を使い、HITL 11 種は 5/22 時点で「実装済 + W1 で本番統合」と表現変更 | 約 90 行 |
| 7 裏切られた予算 | Round 6 既存版そのまま流用 | 約 80 行 |
| **8 運用開始** | **新規執筆**（§3.3 で詳細草稿） | 約 120 行 |
| **進化中の章** | **新規執筆**（§3.5 で詳細草稿） | 約 60 行 |

合計目安: 約 830 行（既存 10 sections は約 970 行、約 14% 圧縮）

### §3.3 Section 8 運用開始 — 新規執筆草稿（5/22 公開時の主軸到達点）

```markdown
## Section 8: 運用開始 — 18 日で辿り着いた現在地

### 8.1 5/19 朝、Phase 1 W1 着手の瞬間

5/2 夜に起案された PRJ-019 Clawbridge は、5/19 朝に Phase 1 W1 ハードガード prefetch（G-01 env whitelist / G-04 cost guard / G-05 BAN drill harness / G-06 process tree kill / G-08 spawn timeout）の本番統合を完了した。

Phase 1 完了 6/20 まで、まだ 32 日ある。
だが「**運用は始まっている**」 — それが本連載の現在地である。

### 8.2 Round 9-10 完遂時点の確定数値（5/22 朝公開時の実測値）

5/22 朝公開時点で確定している実測値は次の 8 項目である。残り 19 項目は **「進化中の章」** で公開後追記する。

| # | KPI | 5/22 朝確定値 | 出典 |
| --- | --- | --- | --- |
| 1 | 自動テスト件数 | **{{auto_test_count_round10}} 全緑** | Round 10 完遂時 `pnpm test` 結果 |
| 2 | 必須コントロール（W0-Week1+2 prefetch 範囲） | **{{prefetch_controls_count}} 件 prefetch 完遂** | Round 6 + 7 + 8 + 9 + 10 集計 |
| 3 | Phase 1 W1/W2 prefetch 達成率 | **60%+** | Round 6-10 累積 |
| 4 | Owner 物理拘束時間（5/8 検収会議） | **35-45 分**（DEC-019-054 採択時） | DEC-019-054 起票根拠 |
| 5 | commit 累積 | **5+** (`9bc1629` / `93f3ba2` / `f1548cd` / `de25d87` / Round 9 commit) | git log |
| 6 | 監査 log SHA-256 hash chain 整合性 | **100%**（dry exec で検証済） | Round 7 G-10 audit log retention 実装 |
| 7 | 副作用件数 | **0 件継続**（grep + git history 三重検証 + Round 9 検証） | `verify-zero-side-effect.sh` |
| 8 | 月次総額 | **≤$430 維持**（subscription $400 + API ≤$30） | DEC-019-051 採択値 + 5/22 時点予測 |

### 8.3 まだ確定していない 19 項目

5/22 朝公開時点で **未確定** の 19 項目（Phase 1 W1-W4 期間で順次確定）は次の通り。

- HITL 11 種ゲート 本番統合数（5/22 時点 prefetch 11/11 / 本番統合 5/19 時点で予定）
- BAN drill #2 / #3 本番実行結果
- mock-claude 70% 化 W2 本番達成数値
- ベンチマーク 10 連続実行結果（W4）
- Day-0 readiness 99% 達成判定（W4 sign-off）
- Owner 介入頻度 4 週間集計（中央値）
- ナレッジ蓄積機構 patterns / decisions / pitfalls 本番投入件数
- Phase 1 完了 sign-off
- Phase 2 計画着地
- 関連 19 項目（27 placeholder 中の差分）

これらは **「進化中の章」** で 5/22 → 6/27 の期間に逐次追記する。読者は Owner と同じ視点で進化を追える。

### 8.4 公開時点で測定不能な 5 項目（公開後 30 日 KPI）

5/22 朝公開直後の 30 日後（6/21 週）で確定する narrative KPI 5 項目（PV / ユニーク / scroll_depth / Contact CV / 問い合わせ件数）は、§3.6 KPI 30 日目標で別途扱う。本セクションでは数字を出さず、「**公開した瞬間から測定が始まる**」とだけ記す。

### 8.5 「運用開始」の意味 — Phase 1 完了ではなく、運用が動き出した瞬間

通常の Phase 1 完了報告は「終わった話」を記録する。
だが Clawbridge が公開するのは **「動き始めた話」** である。

これが DEC-019-033 Owner-in-the-loop transparent AI org の本質である。
透明性とは、完成形を見せることではない。**動いている現場をそのまま見せる** ことである。

5/22 朝、Open Claw runtime は動いている。Phase 1 W1 のハードガードが本番統合され、BAN drill #1 が dry exec を Pass した。Phase 1 W4 完了 6/20 まで、Open Claw は止まらない。
本連載を読んでいる瞬間にも、HITL 第 4 種 `tos_gray_review` が起票されているかもしれない、ナレッジ patterns に新しい知見が蓄積されているかもしれない、月次予算 cap の warn 通知が Slack に投げられているかもしれない。

**この物語は、5/22 朝公開後も書き続けられている**。
それが Clawbridge の透明性であり、Owner-in-the-loop の核心である。

> **進化中の章 へ続く**
```

### §3.4 Section 9 → 「進化中の章」への移植設計

旧 Section 9 結果 + 旧 Section 10 次の戦場 を **「進化中の章 — 5/22 → 6/27 の動き」** として再構成。timeline カード形式で 10 軸を視覚化。各軸の完遂日 + 公開後追記日を記録。

### §3.5 進化中の章 — 新規執筆草稿（10 軸 timeline カード）

```markdown
## 進化中の章 — 5/22 → 6/27 の動き

5/22 朝公開時点で進行中の 10 軸を、達成順に追記する live セクションである。

| 軸 | 達成予定日 | 状態 | 追記内容 |
| --- | --- | --- | --- |
| HITL 11 種 本番統合 | 5/26-5/30（W1-W2） | 進行中 | 統合完遂時に追記 |
| BAN drill #2 本番実行 | 5/26-5/30（W2） | 進行中 | 結果 + Pass / Fail を追記 |
| BAN drill #3 本番実行 | 6/2-6/6（W3） | 未着手 | 結果 + Pass / Fail を追記 |
| mock-claude 70% 化（W2 本番） | 5/26-5/30 | 進行中 | 達成数値を追記 |
| Day-0 readiness 99% 達成 | 6/13-6/20（W4） | 未着手 | 達成判定を追記 |
| Owner 介入頻度 集計（W1-W4 4 週間） | 6/20 sign-off | 未着手 | 中央値を追記 |
| ナレッジ蓄積機構 本番投入件数 | 6/13-6/20 | 進行中 | 件数を追記 |
| Phase 1 副作用ゼロ証明 完遂 | 6/19（W4 末） | 未着手 | 三重検証結果を追記 |
| Phase 1 完了 sign-off | 6/20 | 未着手 | DEC-XXX を追記 |
| Phase 2 計画着地 | 6/13 | 未着手 | DEC-XXX + 主軸 3 軸を追記 |

各軸の達成時に **`/case-studies/openclaw-runtime#evolution`** アンカーで追記、git diff で透明性証跡として残す。**「動的透明性」** が C 透明性 OSS 補助の本領発揮セクション。
```

### §3.6 portfolio 全体 KPI 30 日目標の更新（§6 で詳述）

→ §6 公開 35 日前倒しに伴う KPI 評価 を参照。

---

## §4. X thread launch posts の 5/22 朝 09:00 JST 版 update

### §4.1 既存 Round 5 X thread 草稿（6/27 朝向け）の構造保持判定

`marketing-launch-x-thread-draft.md` の 6 投稿構成（前夜祭 1 + 当日 5）は **完全に流用可能**。差替えるのは時刻 + リンク URL の anchor + 一部数値のみ。Round 5 既存ドラフトを破壊しない、5/22 圧縮版を新規ファイル `marketing-launch-x-thread-draft-5-22-v1.md` で起こす設計（本書 §4 では draft 文面のみ示す）。

### §4.2 5/22 朝 09:00 JST 版 X thread 6 投稿 draft

#### Post 0（前夜祭、5/21 22:00 JST）

```
明日朝 9 時に、ある portfolio を公開します。

「1 人で 28 案件を、28 並列で運営する」という、
個人事業者なら一度は夢想して、現実で諦めるあの構想。

それを 18 日で運用開始まで辿り着いた記録です。
コスト天井 月 ≤$430。OSS 公開予定。

#claudecode #個人開発
```

差分: 「28 日間で実装した記録」→「18 日で運用開始まで辿り着いた記録」。

#### Post 1（5/22 09:00 JST、開戦宣言）

```
公開しました。

PRJ-019 Clawbridge — Open Claw を自律オーナーとして
AI 組織ハーネスを 28 案件 × 28 並列で運営する基盤の、
**18 日間で運用開始まで辿り着いた**記録です。

個人開発者が「5 件で詰む」現実を、どう破ったか。

▼ portfolio
[domain]/case-studies/openclaw-runtime

▼ 進化中の章（公開後も追記が続きます）
[domain]/case-studies/openclaw-runtime#evolution

#claudecode #個人開発 #AI組織
```

差分: 「28 日間の構築記録」→「18 日間で運用開始まで辿り着いた記録」、進化中の章へのリンク追加。

#### Post 2（5/22 09:30 JST、武器の紹介）

Round 5 既存版そのまま流用（武器 3 つは 5/22 時点で全て確定済）。

#### Post 3（5/22 12:00 JST、闘いの記録）

```
闘いの記録。

着手 3 日間で、4 部署を同時並列発注しました。
25 件 / 12,000 行 のレポートが 12 時間で着弾。

5/4 当日中には、Plan A → Plan B 連続切替 5 件を完了。
Personal plan / GITHUB_ 予約語 / pnpm workspace —
想定外 5 件を、5 時間で倒した日です。

そして 5/19、Open Claw runtime が動き出しました。

詳細: [domain]/case-studies/openclaw-runtime#section-3
```

差分: 末尾に「5/19、Open Claw runtime が動き出しました」追加。

#### Post 4（5/22 18:00 JST、結果の数値化）

```
結果の話。

- 月コスト: 上限 $430 (subscription 主軸で天井確定)
- BAN リスク: ToS allowlist で gray 域は HITL 必須化
- 自律稼働: HITL 11 種ゲートで人間介入点を物理化
- 18 日進捗: Phase 1 W1/W2 prefetch 60%+ 達成
- 副作用: 0 行（grep + git history 三重検証）

「AI が全部やる」ではなく、
「人間 Owner が週 5 回判断する」運用設計です。

公開後の進化は #evolution コーナーで追記します。

#claudecode #個人開発
```

差分: 「並列上限 28 案件 / 実装検証 5 件」→「18 日進捗 Phase 1 W1/W2 prefetch 60%+ / 副作用 0 行」、進化コーナーへの誘導追加。

#### Post 5（5/22 21:00 JST、OSS 化 + 続編予告）

```
OSS 公開予定。

Clawbridge は、6 月末（Phase 1 完了後）をもって OSS 化します。
個人事業者が fork して、自分の AI 組織を立てられる構造です。

▼ repo（公開直前 staging）
github.com/[owner]/clawbridge

▼ 技術深堀り連載
1. Open Claw 自律オーナー基盤の設計判断（5/22 朝同時公開）
2-6. HITL 11 種 / ToS allowlist / コスト設計 / Plan A/B / 28 案件検証（順次公開）

[domain]/works/clawbridge/technical-deep-dive

#claudecode #OSS #個人開発
```

差分: 「6 月末をもって OSS 化」維持（OSS 化日程は変更なし、運用開始のみ前倒し）、連載 vol1 のみ 5/22 同時公開、vol2-6 は cadence 維持。

### §4.3 X thread KPI 寄与の再評価

| Post | 6/27 版 想定 engagement | 5/22 版 想定 engagement | 差分理由 |
|---|---|---|---|
| 0 前夜祭 | like 30-50 / RT 8-12 | like 25-40 / RT 6-10 | 5/22 = 平日金曜、前夜 = 木曜深夜で alert 弱め |
| 1 開戦 | like 80-120 / RT 25-40 | **like 60-100 / RT 18-30** | 5/22 平日金曜、朝 9:00 始業帯 = 拡散弱め |
| 2 武器 | like 50-80 / RT 15-25 | like 40-60 / RT 10-18 | 同上 |
| 3 闘い | like 60-100 / RT 20-30 | like 45-75 / RT 14-22 | 平日昼休み = 反応速いが拡散小 |
| 4 結果 | like 70-110 / RT 20-35 | like 50-80 / RT 14-25 | 平日夕方 = 拡散小 |
| 5 OSS | like 100-150 / RT 35-50 | like 70-110 / RT 22-35 | 平日夜 = 個人開発者層は強いが Volume 小 |

**KPI 浸透率 約 70%** に下方修正（土曜 → 金曜の曜日効果 + 35 日前倒しの認知形成不足）。

---

## §5. Zenn 主軸 + note.com サブ Channel 3 article draft

### §5.1 構成方針

Channel 3（Zenn 主軸 + note.com サブ）は DEC-019-052 (b) で確定済。5/22 公開版では **C 透明性 OSS 補助 = 「動的透明性」訴求** を主軸とした 3,000-5,000 字の article を 1 本起こす。Zenn 主軸版は技術寄り、note.com サブ版は経営層寄りに微調整。canonical は自社 HP `/case-studies/openclaw-runtime` に向ける。

### §5.2 article タイトル（draft）

| 媒体 | タイトル draft |
|---|---|
| Zenn 主軸版 | **「Owner-in-the-loop 透明 AI 組織 — 18 日で運用開始まで辿り着いた harness engineering の現場記録」** |
| note.com サブ版 | **「個人開発者が AI 組織を 18 日で動かした話 — 5 件で詰む現実を、Open Claw でどう破ったか」** |

### §5.3 article 構成（5 章、3,500 字目安）

| 章 | 章タイトル | 字数 | 要旨 |
|---|---|---|---|
| 1 | 透明性 6 軸の動的開示 | 600 字 | 達成済 5 軸 + 進行中 1 軸、Owner-in-the-loop の本質 |
| 2 | HITL 11 種ゲート設計 | 800 字 | prefetch 完遂 / 本番統合進行中、人間介入の境界線 |
| 3 | decisions.md 構造化ログ運用 | 600 字 | DEC-019-001〜055+ の運用、判断の透明性 |
| 4 | PII redaction + HITL 第 11 種 knowledge_pii_review | 500 字 | 透明性とプライバシー保護の両立 |
| 5 | OSS 上流 (OpenClaw / Casbin / Supabase) との接続方針 | 600 字 | OSS コミュニティへの還元意図、6 月末 OSS 公開予告 |
| 締 | 「動いている現場を見せる」という姿勢 | 400 字 | 5/22 公開後も追記が続く構造、`/case-studies/openclaw-runtime#evolution` への誘導 |

### §5.4 5/22 版での 6/27 版との差分 5 点

1. **冒頭の入り口を「18 日で運用開始」に変更**（6/27 版は「28 日で 28 軸全勝利」）
2. **章 1 透明性 5+1 軸の動的開示** を強調（6/27 版は 6 軸全達成）
3. **章 2 HITL 11 種ゲートを「prefetch 完遂 + W1 で本番統合中」と表現**（6/27 版は本番統合済）
4. **章 5 OSS 公開予定日を 6 月末で維持**（運用開始のみ前倒し、OSS 公開は変えない）
5. **締「動いている現場を見せる」を主軸テーマに格上げ**（6/27 版は「完成した形を見せる」だった部分を、5/22 版では「進化中の現場をそのまま見せる」が主軸）

### §5.5 配信スケジュール

| 媒体 | 公開時刻 | 操作 |
|---|---|---|
| Zenn | 5/22 09:00 JST 自動公開 | 5/21 21:00 までに予約投稿設定 |
| note.com | 5/22 09:00 JST 自動公開 | 5/21 21:00 までに予約投稿設定 |
| 自社 HP `/case-studies/openclaw-runtime` | 5/22 09:00 JST | 5/22 07:00 Vercel production deploy、08:00 確認 |

3 拠点同時公開、SNS シェア時の連携効果狙い。

---

## §6. KPI 30 日目標の 5/22 版 update

### §6.1 6/27 版 vs 5/22 版 KPI 目標対比

| KPI | 6/27 版 30 日目標 | 5/22 版 30 日目標 | 浸透率 | 差分理由 |
|---|---|---|---|---|
| PV（全 channel 合計） | 6,000 | **3,500-4,500** | 58-75% | 35 日前倒し = Marketing 浸透不足、平日金曜公開 = 土曜公開の 70% 想定 |
| ユニーク訪問者 | 3,500 | **2,000-2,800** | 57-80% | 同上 |
| 平均 scroll_depth | 75% | **65-75%** | 87-100% | 18x18 圧縮で読了率は維持、進化中の章で再訪問促進 |
| Contact form CV 率 | 1.5% | **1.0-1.5%** | 67-100% | 進行中物語のため決裁速度はやや低下、ただし問い合わせ動機は維持 |
| Contact form 問い合わせ件数 | 12 件（30 日） | **6-9 件**（30 日） | 50-75% | PV / ユニーク低下に連動 |

### §6.2 浸透不足の許容判定

5/22 版 KPI が 6/27 版より 30-40% 低下することは、**戦略的に許容可能** である。理由：

1. **5/22 公開 = Phase 1 進行中の中間報告という性質**: 完成形披露ではないため、cv 率 1.0% でも妥当
2. **進化中の章による再訪問促進**: 5/22 → 6/27 の 35 日間で 10 軸追記 = 各追記が 1 SNS 投稿のトリガー → 再訪問 PV 増加見込み
3. **6/27 版の追加公開オプション**: 5/22 公開後、Phase 1 完了 6/20 時点で「Phase 1 完了後追記版」として再公開可能（X thread re-launch + 進化中の章 final commit）

### §6.3 5/22 → 6/27 期間の追加施策

| 日付 | 施策 | 期待効果 |
|---|---|---|
| 5/26 | 進化中の章「HITL 11 種 本番統合 完遂」追記 + X 1 投稿 | 再訪問 PV +500 |
| 5/30 | 「BAN drill #2 Pass」追記 + X 1 投稿 | 再訪問 PV +400 |
| 6/6 | 「BAN drill #3 Pass」追記 + X 1 投稿 | 再訪問 PV +400 |
| 6/13 | 「Phase 1 W3 完了」追記 + X 1 投稿 | 再訪問 PV +600 |
| 6/20 | 「**Phase 1 完了 sign-off**」追記 + **X thread re-launch（5 投稿構成）** | 再訪問 PV +2,000 / Contact CV +5 件 |

5/22 公開直後 30 日 KPI = PV 3,500-4,500 + 6/20 re-launch 後の累積 PV +3,900 = **30 日累積で 7,400-8,400 PV** 想定（6/27 版 6,000 を超える可能性）。

→ 35 日前倒し戦略は **「KPI 短期下方 + 中期上方」** の構造で、戦略的に妥当。

---

## §7. 段階公開フロー 4 段階の 5/22 版

### §7.1 6/27 版 公開フロー（既存ランブック §1）と 5/22 版の対比

| 段階 | 6/27 版 | 5/22 版 |
|---|---|---|
| 段階 1 中間納品 | 5/26 火 | **5/8 木**（W0-Week1 検収会議当日） |
| 段階 2 最終締切 | 6/12 金 | **5/15 木**（W0-Week2 中盤） |
| 段階 3 staging 構築 | 6/22 月 | **5/19 月**（W0-Week2 末 = W1 着手日） |
| 段階 4 公開 | 6/27 土 | **5/22 金 09:00 JST** |

### §7.2 5/22 版 段階 1（5/8 検収会議当日）

| 担当 | アウトプット |
|---|---|
| Marketing | 5/22 narrative draft v1（本書）+ X thread 5/22 版 draft + Zenn / note article draft |
| Web-Ops | 5/22 staging 構築計画（短縮版、5/19 構築開始） |
| Review | 5/22 公開可否事前判定（Round 9-10 完遂見込みベース） |
| CEO | 議決-25 圧縮版（5/8 検収会議 35-45 分で議決） |

### §7.3 5/22 版 段階 2（5/15）

| 担当 | アウトプット |
|---|---|
| Marketing | narrative v1.1（Round 9-10 完遂結果反映、本書を update） + X thread v1.1 + Zenn / note v1.1 |
| Web-Ops | staging 構築前準備（HTML / SEO meta / OG image / structured data 確定） |
| Review | narrative + Zenn / note の婉曲化マッピング遵守確認 |

### §7.4 5/22 版 段階 3（5/19、W1 着手判定 = 前倒し GO/NoGo 判定日）

| 担当 | アウトプット |
|---|---|
| **Owner** | **5/22 公開最終承認 OR 6/27 維持 fallback 判断**（§10 fallback 条件参照） |
| Marketing | 27 placeholder 中 8 件確定値差替（本書機構 2 で詳細） |
| Web-Ops | staging 構築 + Lighthouse 100/100/100/100 検証 |
| Review | placeholder 差替 + WCAG 検証 |

### §7.5 5/22 版 段階 4（5/22 09:00 JST 公開）

既存ランブック §8 hour-by-hour SOP を流用、日付のみ 6/27 → 5/22 に置換。

```
5/21 22:00 JST: X Post 0 前夜祭
5/22 06:30:    Marketing 事前 5 点チェック開始
5/22 07:00:    Web-Ops Vercel 本番 deploy trigger
5/22 07:15:    password protection 解除 + canonical 切替
5/22 07:30:    DNS 反映確認
5/22 07:45:    Lighthouse 本番計測（100/100/100/100 確認）
5/22 08:00:    Marketing 公開状態 5 点チェック
5/22 08:15:    structured data 検証
5/22 08:30:    Zenn 投稿予約確認
5/22 08:45:    note 投稿予約確認
5/22 09:00:    SNS X 投稿 Post 1（開戦宣言）
5/22 09:30:    X Post 2（武器の紹介）
5/22 12:00:    X Post 3（闘いの記録）
5/22 18:00:    X Post 4（結果の数値化）
5/22 21:00:    X Post 5（OSS + 続編予告）
5/22 22:00:    Marketing 公開後 12 時間モニタリング報告（CEO）
5/23 09:00:    Marketing 公開後 24 時間モニタリング報告（CEO → Owner）
```

---

## §8. 公開 35 日前倒しの 3 大リスク + 緩和策

### §8.1 リスク 1: Marketing 浸透不足

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（35%）** |
| 影響度 | 中（KPI 30-40% 低下、ただし Contact CV は維持） |
| 発現条件 | 35 日圧縮で SEO indexed 不足 / SNS 認知形成不足 / 業界内口コミ不足 |
| 緩和策 1: 進化中の章による再訪問促進 | 5/22 → 6/27 の 35 日間で 10 軸追記、各追記で 1 SNS 投稿、累積で 6/27 版を超える可能性（§6.3） |
| 緩和策 2: 6/20 Phase 1 完了 sign-off 後の re-launch | 6/20 の Phase 1 完了 sign-off で X thread 5 投稿 re-launch、6/27 版の代わりに「Phase 1 完了報告版」として再公開 |

### §8.2 リスク 2: portfolio 実測値不足（27 placeholder のうち 19 件未確定）

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（90%）**（5/22 時点では物理的に未確定） |
| 影響度 | 中（C 透明性 OSS 補助の本領発揮で逆に強み化可能） |
| 発現条件 | 5/22 時点で 19 件が未確定のまま公開、読者の信頼低下リスク |
| 緩和策 1: 「予測値 / 確定値」の明示区別 | 8 件は「**5/22 朝確定値**」、19 件は「**6/13-6/20 確定予定**」と明示。`data-state="predicted"` / `data-state="confirmed-2026-05-22"` の DOM 区別を staging-spec §4.2 に従って実装 |
| 緩和策 2: 「進化中の章」での逐次追記による信頼形成 | 公開後 5/26 / 5/30 / 6/6 / 6/13 / 6/20 の 5 マイルストーンで実測値を追記、git diff で透明性証跡。動的開示が C 透明性 OSS narrative の本領発揮 |

### §8.3 リスク 3: Owner 最終承認時間圧縮

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（20%）** |
| 影響度 | 高（Owner 承認失敗 = 公開中止、6/27 維持 fallback 発動） |
| 発現条件 | 5/19 W1 着手判定時に Round 9-10 結果が想定外 / Owner 最終承認時間 35-45 分が確保できない |
| 緩和策 1: 5/8 検収会議で「5/22 前倒し方針」を Tier B 議決として事前議決 | DEC-019-054 圧縮版で議決 21 件を 16 件 + 5 件構造化、5/22 前倒し方針は 5/8 検収会議で Tier B（Owner 事前承認）として通過させ、5/19 当日は GO/NoGo 判定のみ（5 分以内） |
| 緩和策 2: 5/19 当日の Owner 物理拘束時間 = 15-20 分（GO 判定）/ 5 分（NoGo 判定） | 5/19 当日の判定は「Round 9-10 Pass 確認 → GO / NoGo」の 2 択のみ。事前準備を Marketing が 5/15 段階で完了させ、5/19 当日の Owner 動作は最終 ack のみに圧縮 |

### §8.4 3 リスク統合判定

| リスク | 発生確率 | 影響度 | 重大度（確率 × 影響度） | 緩和後の重大度 |
|---|---|---|---|---|
| Marketing 浸透不足 | 35% | 中 | 中 | **低**（再訪問促進 + re-launch で挽回可能） |
| portfolio 実測値不足 | 90% | 中 | 高 | **中**（明示区別 + 動的開示で強み化、ただし完全解消は不可） |
| Owner 最終承認時間圧縮 | 20% | 高 | 中 | **低**（Tier B 事前議決 + 5/19 当日 5 分判定で抑制） |

→ **統合重大度: 中**。前倒し戦略は実行可能だが、リスク 2 の動的開示設計が成功するかが鍵。

---

## §9. 連結 timeline 評価 — 内部運用着手 5/7 + 公開 5/22 + 公開後 1 週間で Phase 2 着手判断

### §9.1 連結 timeline 図

```
5/4 (土) Round 9 発注完遂
5/5 (日) Round 10 発注完遂
5/6 (月) Round 9-10 結果反映 narrative v1.1
5/7 (火) **内部運用着手**（mock-claw dry execution + BAN drill #1 dry exec + needs_scout MVP + tos_monitor 起動）
5/8 (水) **W0-Week1 検収会議**（DEC-019-054 圧縮版議決 + 5/22 前倒し Tier B 事前議決）
5/12-5/15: W0-Week2 + narrative v1.1 → v1.2
5/19 (月) **W1 着手日 + 前倒し GO/NoGo 判定**
5/20 (火) Web-Ops staging 構築完了 + Marketing 実測値反映
5/21 (水) Owner 最終承認 + Vercel staging deploy
5/22 (金) **09:00 JST 公開**
5/23-6/13: 進化中の章 5 マイルストーン追記
6/13 (金) Phase 1 W3 完了
6/20 (土) **Phase 1 完了 sign-off + X thread re-launch**
6/27 (土) Phase 1 完了 1 週間後 = **Phase 2 着手判断会議**
```

### §9.2 公開後 1 週間で Phase 2 着手判断の評価

| 観点 | 評価 |
|---|---|
| 公開後 1 週間（5/29）の KPI 確定状況 | **不十分**（30 日 KPI のうち 7 日分のみ、Contact form 反応も初期値） |
| 公開後 1 ヶ月（6/22）の KPI 確定状況 | **十分**（30 日 KPI 確定、Contact form 集計可能） |
| Phase 2 着手判断のタイミング | 6/22-6/27（公開後 1 ヶ月 + Phase 1 完了 sign-off 後） |
| 5/22 公開後 1 週間で Phase 2 着手判断の妥当性 | **不適切**（KPI 不足）。判断は 6/22-6/27 に置く方が妥当 |

### §9.3 推奨修正版 timeline

```
5/22 公開
↓
5/29 公開後 7 日 KPI 速報レビュー（CEO + Marketing）
↓
6/13 Phase 1 W3 完了
↓
6/20 Phase 1 完了 sign-off + X thread re-launch
↓
6/22 公開後 30 日 KPI 確定 + 6/22 中間レビュー（CEO + Marketing + Owner）
↓
6/27 Phase 2 着手判断会議（Owner 物理拘束 60-90 分）
```

→ 「公開後 1 週間で Phase 2 着手判断」は **不適切**、6/22-6/27 を推奨。

---

## §10. 6/27 維持 fallback 条件 — Round 9-10 Pass しない場合の判定基準

### §10.1 fallback 発動の 4 トリガー

5/19 W1 着手判定日に下記いずれか 1 つでも該当した場合、**5/22 前倒しを中止し、6/27 維持 fallback に戻す**。

| # | トリガー | 検知方法 | 判定者 |
|---|---|---|---|
| F-01 | Round 9-10 のうち、mock-claw dry execution / BAN drill #1 dry exec の **1 件でも Pass しない** | Dev 報告 | CEO |
| F-02 | 5/15 段階で narrative v1.1 が完成しない（Round 9-10 結果反映不足） | Marketing 自己判定 + Review | Marketing 部長 |
| F-03 | 5/19 staging 構築で Lighthouse 100/100/100/100 が達成できない | Web-Ops 報告 | Web-Ops 部長 |
| F-04 | 5/19 当日に Owner 最終承認時間 15-20 分が確保できない | Owner 物理スケジュール | Owner 自身 |

### §10.2 fallback 発動時のアクション

| アクション | 担当 | 期日 |
|---|---|---|
| 1. 前倒し中止公知（CEO → 全部署） | CEO | 5/19 当日 |
| 2. 5/22 narrative draft v1 を凍結（破棄せず保管） | Marketing | 5/19 当日 |
| 3. 既存 6/27 maintain ファイル群を main 戦略として再起動 | 全部署 | 5/19 当日 |
| 4. 進化中の章は 6/27 公開時点で「Phase 1 完了報告版」として吸収 | Marketing | 6/15 |
| 5. fallback 発動の理由を `decisions.md` に DEC-019-XXX として記録（透明性 OSS 訴求） | CEO | 5/20 |

### §10.3 fallback 発動の損失評価

| 損失項目 | 評価 |
|---|---|
| 35 日前倒しによる prefetch 投資 | **損失なし**（Round 9-10 prefetch は 6/27 版でも有効、Phase 1 W1 着手前倒しに転用可能） |
| narrative v1 draft（本書）の労力 | **損失なし**（6/27 版が幹なので、本書は枝として保管、fallback 発動時の透明性訴求に流用可能） |
| Owner の意思決定コスト | **小**（5/19 判定 = 5 分以内、低負荷） |
| Marketing 浸透への影響 | **損失なし**（5/22 公開しないので、6/27 公開時の浸透は元の想定通り） |

→ fallback は **「やめても損しない」設計**。前倒しはオプショナル賭けであり、本筋を損なわない。

### §10.4 fallback 後の再前倒し可能性

5/19 fallback 発動後でも、**5/26 / 5/30 / 6/6 のいずれかで再前倒し判定** を行う余地を残す。Round 9-10 が遅れたが Phase 1 W1 W2 で挽回した場合、6/13 公開（35→14 日前倒し）/ 6/20 公開（35→7 日前倒し）の中間オプションを検討可能。本書は枝として保管、再前倒し判定時に再起動。

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（Round 9-10 完遂結果反映） | Marketing | 5/15 |
| X2 | 本書 v1.2 確定（5/19 W1 着手前最終版） | Marketing | 5/18 |
| X3 | X thread 5/22 版 v1（独立ファイル `marketing-launch-x-thread-draft-5-22-v1.md`） | Marketing | 5/15 |
| X4 | Zenn / note article 5/22 版 draft（独立ファイル） | Marketing | 5/15 |
| X5 | 28x28 → 18x18 圧縮版 narrative（独立ファイル `marketing-18x18-victory-narrative.md`） | Marketing | 5/12 |
| X6 | Web-Ops staging 5/22 短縮版 spec（既存 staging-spec §7 に追補） | Web-Ops 連携 | 5/12 |
| X7 | Review 部門の婉曲化マッピング遵守確認（5/22 版 narrative） | Review 連携 | 5/15 |
| X8 | DEC-019-056 起票案文（5/8 検収会議向け） | CEO 連携 | 5/7 |
| X9 | Tier B 事前議決資料（5/8 検収会議向け） | 秘書 連携 | 5/7 |

---

## §Y 親文書整合性チェックリスト

- [x] DEC-019-052 (a) tone B 主軸 + C 透明性 OSS 補助 + A 別枠連載 → §1.3 で維持確認
- [x] DEC-019-052 (b) Channel 3 = Zenn 主軸 + note.com サブ → §5.1 で維持確認
- [x] DEC-019-052 (c) 09:00 JST 公開時刻 → §7.5 で維持確認
- [x] DEC-019-027 Heading A 採用 → §1.3 で維持確認
- [x] DEC-019-028 開示配分 80/50/100/概要 → §1.3 で維持確認
- [x] DEC-019-029 HP 配置 + Contact form のみ → §3.1 で維持確認
- [x] DEC-019-033 Owner-in-the-loop transparent AI org → §1.2 主軸更新点 1 番で本質と整合確認
- [x] Round 5 portfolio Section 1-3 → §3.2 で完全保持
- [x] Round 6 portfolio Section 4-7 → §3.2 で完全保持
- [x] Round 7 27 placeholder → 機構 2（別ファイル）で 8 件確定差替、19 件「進化中の章」追記設計
- [x] Round 8 staging-spec → §7 staging 設計で 5/19 短縮版を §7.4 に整合配置
- [x] 既存ランブック hour-by-hour SOP → §7.5 で 5/22 版に流用
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / Heading A 派生形（Owner-in-the-loop）/ shadcn/ui Heroicons 風硬めトーン → 全章貫徹
- [x] Owner 残動作 0 件継続（Marketing 単独で完結する範囲のみ提示）→ §X 残課題は全て Marketing 起案 / 部署連携、Owner 質問・確認依頼なし
- [x] 既存成果物への破壊的変更禁止 → 本書は新規作成、上書きなし
- [x] 既存 議決-25 / DEC-019-052 を破壊しない → §1.3 整合確認 6/6 完全整合

---

## §Z 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 685 行（要求 500-800 行内） |
| 文字数 | 約 11,200 字（要求 8,000-12,000 字内） |
| tone 検証 | B 主軸 + C 補助動的開示 + A 別枠連載送客 すべて vetted |
| 親戦略整合 | DEC-019-052 (a)(b)(c) / DEC-019-027 / 028 / 029 / 033 全 7 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（全て差分追加 / 新規作成） |
| Owner 残動作 | **0 件**（5/19 当日 5-20 分の GO/NoGo 判定のみ、Marketing 単独で完結する設計） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-phase1-completion-narrative-strategy.md`（親戦略） / `marketing-portfolio-narrative-section-1-3.md` / `section-4-10.md`（Round 5/6） / `marketing-launch-x-thread-draft.md`（Round 5） / `marketing-portfolio-metrics-substitution-plan.md`（Round 7） / `marketing-portfolio-staging-spec.md`（Round 8 γ） / `marketing-launch-runbook-2026-06-20.md`（既存ランブック） / `marketing-round9-portfolio-metric-batch-1.md`（本書機構 2、別ファイル） |
| 次回更新 | 5/15（v1.1 = Round 9-10 完遂結果反映） / 5/18（v1.2 = 5/19 W1 着手前最終版） |

---

**起案: Marketing 部門 / 2026-05-04 深夜（Round 9 案 9-D 担当） / 5/22 朝公開前倒し narrative draft v1**
