# CEO 5/8 W0-Week1 検収会議 発言原稿 + 想定 Q&A

- 文書 ID: ceo-w0-week1-meeting-speech-and-qa-2026-05-08
- 制定: 2026-05-03
- 対象会議: 2026-05-08 (金) 18:00-20:00 (120 分)
- 議題: `secretary-w0-week1-meeting-agenda-v4.md` (v4 = Q-Mkt 事後承認モード)
- 議事録 template: `secretary-w0-week1-meeting-minutes-template-v2.md`

---

## §0. 200 字 サマリ

5/8 18:00 W0-Week1 検収会議 (120 分) で CEO が議長として発言する原稿 + 想定 Q&A 30 件 + 反対意見対応シナリオ 5 件を整備。議題 v4 の §1〜§5 全体構造に沿って各セクション 1〜2 段落ずつ草稿、Owner 想定質問はカテゴリ別 6 群で網羅。Owner が 5/4-5/7 で W0 セットアップを完了している前提、Q-Mkt 既決 (DEC-019-026〜029) + G-Top-1 採用 (DEC-019-030) + PRJ-020 起案 (DEC-020-001〜003) の 8 件が事後承認対象。

---

## §1. 議題 v4 全体構造と発言時間配分

| 議題 | 時間 | CEO 発言 | 主要決議 |
|---|---|---|---|
| §1 開会 + W0-Week1 進捗承認 | 10 分 | 開会挨拶 (3 分) + 進捗総括 (5 分) + 承認 (2 分) | DEC-019-014 既決報告 |
| §2 必須コントロール 28→34 項目状況 | 25 分 | Dev 報告聴取 (15 分) + CEO 評価 (5 分) + Q&A (5 分) | 必須コントロール 32/34 着手前クリア確認 |
| §3 Phase 1 W1 着手 Go/NoGo (5/19) | 20 分 | Owner W0 セットアップ確認 (10 分) + Go/NoGo 議決 (8 分) + 議決確認 (2 分) | Phase 1 W1 公式着手承認 |
| §4 BAN drill #1/#2 + monitoring | 25 分 | drill #1 シナリオ確認 (10 分) + drill #2 (Sumi/Asagi 同居) 確認 (10 分) + 5 SLA 確認 (5 分) | drill 実施日 5/13 + 5/17 確定 |
| §5 PM 追加議題 | 30 分 | (a) Vercel Pro 昇格 6/3 判断 (5 分) + (b) Codex 2x ボーナス終了 5/31 影響 (5 分) + (c) G-Top-1 採用案 (10 分、拡大) + (d) PRJ-020 Phase 0 報告 (5 分、新設) + (e) Q-Mkt 事後承認 (5 分、圧縮) | DEC-019-030 G-Top-1 + PRJ-020 議題予告 + Q-Mkt 8 件事後承認 |
| 閉会 | 10 分 | 議事録確認 (5 分) + DEC 起票確認 (3 分) + 5/9 着手キックオフ (2 分) | DEC-019-026〜030 + DEC-020-001〜003 議事録記録確定 |
| **計** | **120 分** | — | — |

---

## §2. §1 開会挨拶 (3 分原稿)

> 「W0-Week1 検収会議を開会します。本日は 18 時から 20 時まで 120 分、議題 v4 (本日朝 5/8 09:00 改訂版) で進めます。
>
> Owner におかれましては、5/4 から 5/7 までの 4 営業日で 1Password Vault 4 系統 + Spend Cap 設定 + OAuth 隔離検証 + W0 セルフチェック 7 項目を完遂いただきありがとうございます。本日はその進捗確認と、Phase 1 W1 着手 5/19 の Go/NoGo を議決します。
>
> なお本日は 5/3 オーナー直接指示で公式採択した 8 件 (DEC-019-026〜030 + DEC-020-001〜003) が事後承認対象として §5(e) で記録のみ行います。Q&A 時間を §2 と §4 で確保していますので、必須コントロール 28→34 項目と BAN drill 設計について遠慮なくご質問ください。
>
> 進行は議題 v4 順、議事録は秘書が template v2 で記録、DEC 起票候補は §3 Go/NoGo + §4 drill 確定で本日 2 件追加見込みです。それでは議題 §1 W0-Week1 進捗承認に移ります。」

---

## §3. §2 必須コントロール状況発言 (5 分 CEO 評価)

### §3.1 主要評価ポイント

> 「Dev 部門報告ありがとうございます。CEO 評価を申し上げます。
>
> **必須コントロール 32/34 着手前クリア** は予定通りで、残 2 項目 (G-V2-06 rate jittering / G-V2-10 ToS 半年再評価) は W1 進行中整備で問題ありません。HITL 第 6 種 tos_gray_review が 11 ケース緑、第 7 種 changelog external_api は 5/26 着手予定、第 8 種 owner_input_review (PRJ-020) は 6/14 PoC で初稼働です。
>
> 特に評価が高いのは:
> - mock-claude バイナリ + TimeSource pattern による libfaketime 代替確立
> - openclaw-runtime ラッパ skeleton で driver/engine 分離達成
> - architecture-w0.md / security-w0.md (Mermaid 6 枚) 完成度
>
> 課題は:
> - Vercel Hobby Sandbox 5h CPU の月後半枯渇可能性 (R-019-11、6/3 Pro 昇格判断 CB-CEO-W3-01 で対応)
> - Claude Max weekly cap 月後半枯渇可能性 (R-019-10、H-09 80% 警告 / 95% pause で対応)
>
> 以上、必須コントロール 28→34 項目状況は **承認** します。」

---

## §4. §3 Phase 1 W1 着手 Go/NoGo (5/19) 議決原稿

### §4.1 Owner W0 セットアップ確認 10 分

> 「Owner、5/4-5/7 の W0 セットアップ実施結果を確認します。本日朝の進捗追跡シート (`secretary-owner-daily-progress-tracker-2026-05-04-07.md`) に従ってチェックリストを進めます。
>
> - 5/4 1Password Master + Dev Vault 構築 (T1.1〜T1.8): 完遂 / 一部未完 / 未着手
> - 5/5 Notify + Public Vault + Spend Cap (T2.1〜T2.10): 完遂 / 一部未完 / 未着手
> - 5/6 OAuth 隔離検証 3 件 (T3.1〜T3.9): 完遂 / 一部未完 / 未着手
> - 5/7 W0 セルフチェック 7 項目 + 議事準備 (T4.1〜T4.10): 完遂 / 一部未完 / 未着手
>
> 全項目完遂の場合 Go、3 件以下未完で Conditional Go (該当作業を 5/9-5/10 で完了)、4 件以上未完で NoGo (5/19 W1 着手延期 1 週間 = 5/26 へ)。」

### §4.2 Go/NoGo 議決 8 分

> 「以上の W0 セットアップ + 必須コントロール状況を踏まえて、Phase 1 W1 着手 5/19 の Go/NoGo を議決します。
>
> CEO 推奨: **Go** (W0 セットアップ全完遂 + 必須コントロール 32/34 + 残 2 項目 W1 中整備で進行可能)
>
> Owner、Go/NoGo を御判断ください。」

### §4.3 想定 Owner 反応別シナリオ

- **Go の場合**: DEC-019-031 起票 (Phase 1 W1 着手承認、5/19 公式キックオフ)
- **Conditional Go**: DEC-019-031 起票 (条件付き、未完項目 5/9-5/10 で完遂後着手) + 秘書がフォロータスク追加
- **NoGo**: DEC-019-031 起票 (NoGo + 延期理由 + 5/26 再判定議題)

---

## §5. §4 BAN drill #1/#2 確認原稿

### §5.1 drill #1 (5/13) 確認 10 分

> 「BAN drill #1 5/13 (火) 14:00 シナリオを確認します。手順書は `review-ban-drill-1-detailed-procedure.md` (332 行) に従い、5 SLA + 異常 5 シナリオ A-E + 立会者 7 役割で実施します。
>
> 実施前提:
> - 5/12 までに使用量モニタリング C-A-04 運用開始
> - 5/13 当日 13:00 までに Sumi (PRJ-012) / Asagi (PRJ-018) を一時停止
> - drill 開始 14:00 / 終了 17:00 / 評価会 17:00-18:00
>
> 5 SLA: CEO 召集 1h / 部署 pause 30min / P-E fallback 15min / 監査ログ完保 / Owner 連絡 1h
>
> Pass で Phase 1 W1 着手継続、Fail で 3 日以内再 drill、再失敗で W1 着手 1 週間延期。」

### §5.2 drill #2 (5/17 Sumi/Asagi 同居) 確認 10 分

> 「BAN drill #2 5/17 (土) は drill #1 と異なり Sumi/Asagi 完全同居運用シナリオで実施します。手順書は `review-ban-drill-2-sumi-asagi-coexistence-procedure.md` (377 行) で本日朝完成しました。
>
> drill #1 との差分:
> - 異常 7 シナリオ (drill #1 5 件 + F: Sumi 経路波及 / G: Asagi Codex sidecar 競合)
> - 立会者 9 役割 (drill #1 7 役割 + Sumi 担当 + Asagi 担当)
> - 5 SLA に巻き添え許容範囲 (P95 / quota / 顧客漏洩) 明記
> - 5/15 OAuth 隔離 + 5/16 Sumi/Asagi 完全バックアップ前提
> - Phase 1 W1 (5/19) 着手 Go/NoGo 判定基準 4 段階整備
>
> Pass で Phase 1 W1 着手最終確定、Fail で再 drill 5/18 朝 (Phase 1 W1 着手 5/19 維持の最終チャンス)、再失敗で 5/26 へ。」

---

## §6. §5(c) G-Top-1 採用案議決 10 分原稿 (拡大)

### §6.1 (a)+(e) ハイブリッド採用提案

> 「G-Top-1 デモジャンル選定について、CEO 推奨は **(a)+(e) ハイブリッド** = W1〜W3 HN trending TS / W4 自社 PRJ-001〜018 リファクタです。
>
> 比較資料は `ceo-g-top-1-genre-comparison.md` (482 行 / Mermaid 2 / 比較表 23 / 7 軸評価) で 5 案を網羅、(a)+(e) ハイブリッド採用根拠を §7.1 / §7.3 に明記しています。
>
> ハイブリッド優位理由:
> - W1〜W3 HN trending: 外部 trending 把握 + 公開後 marketing 訴求力 (Heading A 整合)
> - W4 自社 PRJ リファクタ: 既存 18 PRJ 知見活用 + 副作用ゼロ実証で BAN リスク最小化
> - 単一 (a) のみ採用時の課題 (副作用ゼロ実証困難) を W4 で補完
>
> Owner、本採用案を **DEC-019-030** として議決ください。」

### §6.2 想定議論 + 反対意見対応

- **反対意見 R1**: 「(a) のみで W4 も HN trending にすべき (副作用ゼロは別系統で実証)」
  - **CEO 対応**: 「副作用ゼロ実証は Phase 1 DoD 必須。W4 で外部 trending を扱うと既存 PRJ への副作用検証ができず、Phase 2 Go/NoGo に影響します」
- **反対意見 R2**: 「(c) チームマネジメント PRJ で diversity 増やすべき」
  - **CEO 対応**: 「チームマネジメント PRJ は技術的整合性低 (Web app harness 専用)、W3 までに 6 件達成が困難です。Phase 2 で再評価可」

---

## §7. §5(d) PRJ-020 Phase 0 報告 5 分原稿

`ceo-prj020-phase0-integrated-verdict.md` §5.2 の発言原稿草案をそのまま使用 (本書 §X 統合)。

---

## §8. §5(e) Q-Mkt 事後承認 5 分原稿 (圧縮版)

### §8.1 圧縮報告

> 「§5 後半 5 分は 5/3 オーナー直接指示で既決の Q-Mkt 8 件 + G-Top-1 + PRJ-020 起案の 9 件 (DEC-019-026〜030 + DEC-020-001〜003 = 計 8 DEC) について、本日議事録 §5 への記録のみ行います。判定は 5/3 既決のため議決不要です。
>
> 確定値の再確認:
> - DEC-019-026: 公開 2026-06-20 (土) 朝
> - DEC-019-027: Heading A「AI 組織が AI 組織を運営する」
> - DEC-019-028: 部分開示 (harness 80% / org 50% / cost 100% / ToS 概要)
> - DEC-019-029: HP トップ + 事例ページ + Contact form のみ
> - DEC-019-030: G-Top-1 (a)+(e) ハイブリッド (本日 §5(c) で公式議決済)
> - DEC-020-001〜003: PRJ-020 ClawDialog 起案 + Phase 0 + 同居実装
>
> 議事録扱い 4 件 (Q-Mkt-01 PATTERN 番号 / 03 比重 / 07 静観 / 08 部分匿名化) は秘書が議事録 §5 で 1 行ずつ記録します。
>
> Owner、ご質問あれば受け付けます。」

---

## §9. 想定 Q&A 30 件 (Owner 質問想定)

### §9.1 W0 セットアップ関連 (5 件)

1. **Q**: 「1Password Vault 4 系統で Master Vault が他 3 系統の master か」
   - **A**: その通り。Master が emergency kit 保管、Dev/Notify/Public は用途別の独立 Vault で Master 配下では無く並列構造です。
2. **Q**: 「Spend Cap 設定後の警告は誰に届くか」
   - **A**: 80% 警告は Notify Vault 経由で Owner + CEO の 2 経路、95% pause は自動実行 + 同 2 経路通知。
3. **Q**: 「OAuth 隔離検証で WSL2 + AppArmor が機能しない場合の代替策」
   - **A**: Plan B-1 P-E (API キー従量) フォールバック発動、`secretary-owner-w0-setup-guide.md` §4.4 に詳細。
4. **Q**: 「W0 セルフチェック 7 項目で 1 項目失敗した場合の処置」
   - **A**: 失敗内容により Conditional Go か NoGo 判定。本日 §3 で議論。
5. **Q**: 「5/4 朝の Q-Mkt 既決で Owner 工数解放 30〜45 分は何に使うか」
   - **A**: 1Password 構築 1 日目を本来 60 分予定が 90 分まで余裕、または日常業務に振替。

### §9.2 必須コントロール関連 (5 件)

6. **Q**: 「34 項目中 2 項目 (G-V2-06 / G-V2-10) が W1 中整備で本当に間に合うか」
   - **A**: G-V2-06 rate jittering は W1 W1.5 (5/22) 着手予定、G-V2-10 ToS 半年再評価は 11/19 期限なので Phase 1 W4 (6/13) までに整備で十分。
7. **Q**: 「HITL 第 6 種 11 ケース緑だが false positive 率はどうか」
   - **A**: tos_gray_review §2 評価ルール FN-Black ≤ 10% 採用、現在 8.3% で目標達成。
8. **Q**: 「HITL 第 8 種は PRJ-020 PoC 6/14 着手だが、Phase 1 W1 (5/19) には間に合わないのか」
   - **A**: 第 8 種は PRJ-020 専用、PRJ-019 Phase 1 では第 1〜7 種のみ稼働。第 8 種は PRJ-020 PoC で初稼働。
9. **Q**: 「G-Top-1 採用後 PRJ-019 Phase 1 で必須コントロールが追加されるか」
   - **A**: 追加なし。G-Top-1〜4 は既に必須コントロール 34 項目に組み込み済。
10. **Q**: 「BAN リスク 30〜60% を承認したが Phase 1 中にどう monitoring するか」
    - **A**: H-09 weekly cap 80% 警告 + Anthropic 警告メール 1h 監視 + drill #1/#2 で異常検出能力検証。

### §9.3 BAN drill #1/#2 関連 (5 件)

11. **Q**: 「drill #1 で 5 SLA 全達成しても再 drill 必要なケースは」
    - **A**: 異常 5 シナリオで 1 件でも非期待行動 → 個別シナリオ再 drill。
12. **Q**: 「drill #2 で Sumi/Asagi 経路波及検出時の判定基準」
    - **A**: 異常 F (Sumi 経路波及) は P95 latency 50ms 増加 / quota 5% 増加までは許容、超過で Fail。
13. **Q**: 「drill #1 失敗で再 drill 3 日以内、5/16 までに完了が間に合わない場合」
    - **A**: Phase 1 W1 着手 5/19 は維持困難 → 5/26 延期。
14. **Q**: 「drill #2 失敗で 5/18 再 drill も失敗した場合」
    - **A**: Phase 1 W1 着手 5/26 延期 + drill #3 5/24 必須、再失敗で Phase 1 中止 (Phase 2 で再起案)。
15. **Q**: 「drill 中の Open Claw subprocess に Owner 介入する場合の手順」
    - **A**: Review Lead 経由で CEO 召集 → P-E fallback 即実行 → 監査ログ完全記録。

### §9.4 G-Top-1 + Phase 1 着手関連 (5 件)

16. **Q**: 「(a)+(e) ハイブリッドで W4 自社 PRJ リファクタ対象は誰が選定するか」
    - **A**: PM 部門が W3 終盤 (6/10 頃) に PRJ-001〜018 から 5 件候補抽出、CEO 即決。
17. **Q**: 「(a) HN trending W1〜W3 で 6 件達成困難な場合」
    - **A**: 暫定で達成数を W3 終盤 monitoring、4 件以下で W4 (e) を 2 件→4 件に増加して合計 8 件達成。
18. **Q**: 「Heading A 採用後に B 案 / C 案を SNS 投稿で言及するか」
    - **A**: 言及なし。SNS X 1 投稿は Heading A のみ、B/C 案は議事録扱い。
19. **Q**: 「Phase 1 W1 着手後に Q-Mkt 採択値を変更する場合」
    - **A**: 軽微変更 (字句のみ) は CEO 即決、構造変更 (Heading 案差替等) は Owner 承認 + DEC 起票。
20. **Q**: 「Phase 1 W1 着手 5/19 から 6/13 完了までの 4 週間で進捗遅延した場合」
    - **A**: 6/3 Vercel Pro 昇格判断 (CB-CEO-W3-01) と 6/13 PRJ-020 PoC 判定の 2 マイルストーンで早期検知、最大 1 週間延期 (6/20 公開を 6/27 に押し出す) を許容。

### §9.5 PRJ-020 ClawDialog 関連 (5 件)

21. **Q**: 「PRJ-020 PoC 着手 6/14 までに HITL 第 8 種仕様確定 (C-020-01) は本当に間に合うか」
    - **A**: Dev は本日 5/3 統合 SOP 1,094 行で第 8 種仕様を既に書面確定、6/13 までに Review 検収 + Owner 確認のみ。
22. **Q**: 「Owner UI ワイヤーフレーム検収は誰が行うか」
    - **A**: Designer 部門が起案、Owner 確認、CEO 承認の 3 段階。Designer は Web 運営兼任で 6/3 着手前提。
23. **Q**: 「採否判断 LLM プロンプトの 5 軸評価で重み付けは均等か」
    - **A**: 均等 0.2 ずつから開始、Phase 1 PoC で 10 件以上の Owner 投入実績後にチューニング。
24. **Q**: 「Spend Cap PRJ-020 月次 $30 を超過した場合の処置」
    - **A**: 自動 pause + Owner 通知、超過理由分析後 Phase 2 で予算調整 ($30 → $50 候補)。
25. **Q**: 「PRJ-020 Phase 1 PoC 中に PRJ-019 と Spend Cap 競合した場合」
    - **A**: PRJ-019 優先 (Phase 1 完了直後の安定運用最優先)、PRJ-020 は一時 pause で対応。

### §9.6 W2-W4 + 5/30 NG-3 再確認関連 (5 件)

26. **Q**: 「5/30 DEC-019-008 NG-3 再確認で 12h/日上限を 18h/日に上方修正可能か」
    - **A**: 可能。BAN drill #1/#2 全 Pass + 必須コントロール 34/34 + Owner 承認の 3 条件で。
27. **Q**: 「5/31 Codex 2x ボーナス終了で W3〜W4 実質枠半減リスク (R-019-07) の処置」
    - **A**: 6/3 CB-CEO-W3-01 で 5x 枠での残予算試算、不足時 ChatGPT Pro $200 → $300 (Plus 比 7.5x) 上方契約検討。
28. **Q**: 「6/3 Vercel Pro 昇格判断で消費率 70% 超過か未満かの基準値」
    - **A**: Sandbox $26 + Hosting Pro $20 = 月予算 $46 のうち 5/3〜6/3 累計消費 $32 ($46 × 70%) 超過で昇格、未満維持。
29. **Q**: 「6/13 Phase 1 完了後の Phase 2 Go/NoGo 判定基準は」
    - **A**: DoD 6 項目 (HN trending → /new-project 起票 → 雛形 → Sandbox テスト → Review 合格 → preview deploy → Slack 通知 全自動 / <60min/件 / <$5/件 / 10 連続成功率 ≥80% / 副作用 0 行 / 必須コントロール 34/34) 全達成で Go。
30. **Q**: 「Phase 2 着手時に PRJ-020 PoC 結果を反映するか」
    - **A**: 反映する。PRJ-020 PoC が Strong Conditional Go なら PRJ-019 Phase 2 + PRJ-020 Phase 2 を並走、それ以外は PRJ-019 Phase 2 単独。

---

## §10. 反対意見対応シナリオ 5 件

### §10.1 Owner 反対意見想定

| # | シナリオ | 想定対応 |
|---|---|---|
| 1 | Phase 1 W1 着手延期希望 (Owner W0 セットアップ未完) | Conditional Go 提案 → 5/9-5/10 で残作業完了 → 5/19 着手維持 |
| 2 | Q-Mkt 既決の修正希望 (Heading C に変更) | DEC-019-027 修正 DEC 起票 + Marketing v3 緊急発注 + 6/12 締切再評価 |
| 3 | PRJ-020 起案撤回希望 | DEC-020-001 撤回 DEC 起票 + Phase 0 4 件成果は Phase 2 持ち越し |
| 4 | BAN drill #1/#2 中止希望 | 推奨せず (Phase 1 W1 着手不可)、修正案 = drill 縮小版 (5 SLA のみ) |
| 5 | NG-3 12h/日上限を 24h に上方修正希望 (5/30 前) | 5/30 再確認まで延期、暫定 18h/日まで段階的緩和 |

### §10.2 議事録対応

- 反対意見出た場合、5/9 朝持ち越し対応雛形 (`secretary-w0-week1-meeting-minutes-template-v2.md` §6) で再協議
- 最大 4 議題 × 5 分 = 20 分超過時、5/10 朝に再延長

---

## §11. 議事終了後タスク

| 時間 | CEO タスク |
|---|---|
| 20:00-20:30 | 議事録 v2 完成確認 + DEC-019-031 (Phase 1 W1 Go/NoGo) 起票 + 議事録扱い 4 件記録 |
| 20:30-21:00 | Owner 5/9 着手前最終確認 + 各部署キックオフ通知 (PM/Dev/Research/Review/Marketing/秘書 6 部署) |
| 21:00-21:30 | dashboard 更新 (PRJ-019 50% → W1 着手後 55% 予約 / PRJ-020 5% 維持) |
| 5/9 09:00 | Phase 1 W1 公式キックオフ (Dev + Research 並列着手) |

---

## §12. 関連ファイル

- 議題 v4: `secretary-w0-week1-meeting-agenda-v4.md` (440 行)
- 議事録 v2: `secretary-w0-week1-meeting-minutes-template-v2.md` (632 行)
- BAN drill #1: `review-ban-drill-1-detailed-procedure.md` (332 行)
- BAN drill #2: `review-ban-drill-2-sumi-asagi-coexistence-procedure.md` (377 行)
- HITL 8 種 SOP: `dev-hitl-gate-1-8-integrated-sop.md` (1,094 行)
- PRJ-020 統合判定: `projects/PRJ-020/reports/ceo-prj020-phase0-integrated-verdict.md`
- Owner 進捗追跡: `secretary-owner-daily-progress-tracker-2026-05-04-07.md` (345 行)
- HP 改修要件: `projects/COMPANY-WEBSITE/reports/web-ops-prj019-clawbridge-hp-renovation-requirements.md` (500 行)
- Marketing v2: `marketing-portfolio-reflection-design-v2.md` / `marketing-knowledge-reflection-design-v2.md`

---

**起案者**: CEO ／ **次回マイルストーン**: 5/8 18:00 検収会議実施 ／ **想定議事終了**: 20:00 ／ **DEC 起票見込**: DEC-019-031 (Phase 1 W1 Go/NoGo) 1 件
