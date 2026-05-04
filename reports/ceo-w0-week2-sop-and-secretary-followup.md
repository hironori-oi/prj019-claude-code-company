# CEO 連結報告（W0-Week2 prep フォローアップ — SOP 制定 + 秘書 3 件配布資料整備）

- 文書 ID: ceo-w0-week2-sop-and-secretary-followup
- 制定: 2026-05-03（W0-Week2 ブートストラップ並列成果着地後の連結報告 第 2 弾）
- 経由: CEO → オーナー
- 関連: `reports/ceo-w0-week2-prep-consolidation.md`（第 1 弾、4 部署並列成果 + DEC-019-021〜024）
- 関連 DEC: DEC-019-025（Agent tool 権限 SOP）

---

## 0. 200 字 サマリ

オーナー承認「CEO 提案通り」3 件（5/8 議題 §5 / Marketing 8 件回付 / SOP 改訂）を受領後、即時に SOP 起票（DEC-019-025、`organization/rules/agent-tool-permission-sop.md` 制定）+ 秘書部門 3 並列発注（議題 v3 配布 / Marketing 8 件回付資料 / W0-Week2 kickoff チェックリスト）を実行。3 件全て物理書込完遂（計 788 行 / 約 49,758 字）。dashboard PRJ-019 進捗 35%→40%。次は 5/4〜5/8 のオーナー回付 + 5/8 18:00 検収会議実行へ移行。

---

## 1. 経緯

第 1 弾連結報告（`ceo-w0-week2-prep-consolidation.md`）でオーナーに 3 件 CEO 提案を上申:
1. 5/8 検収会議の PM 追加議題 §5（120 分版に拡張、25/20/25/20/30 分配分）
2. Marketing 部門 8 件のオーナー判断事項を 5/4〜5/8 回付
3. PM/Research の Read-only 系 type 発注事故を踏まえた SOP 改訂

オーナー判断「良いです。CEO 提案通りで進めてください」を受領し、CEO 自前起票 + 秘書 3 並列発注を実行。

---

## 2. 成果物 4 件（物理書込完遂）

| # | 成果物 | パス | 規模 | 起票者 | 主旨 |
|---|---|---|---|---|---|
| 1 | **Agent tool 権限 SOP** | `organization/rules/agent-tool-permission-sop.md` | 144 行 / 約 5,800 字 | CEO 自前 | 長文レポート発注時に Write/Edit 保有 type 必須化、§3 チェックリスト A/B/C、§4 type-tool 対照表、Phase 1 強制適用 |
| 2 | **5/8 検収会議 議題 v3 配布資料** | `reports/secretary-w0-week1-meeting-agenda-v3-final.md` | 409 行 / 約 28,972 字 | 秘書 A | §1〜§5 タイムボックス 25/20/25/20/30 分 + 添付 18 件一覧 + 投票手順 + G-Top-1 候補 5 案 (CEO 推奨 (a)(e)) + 議事録テンプレ |
| 3 | **Marketing 8 件 オーナー回付資料** | `reports/secretary-marketing-owner-questions-2026-05-03.md` | 174 行 / 約 18,001 字 | 秘書 B | Q-Mkt-01〜08（PATTERN 番号衝突 / 公開 6/20 / 表現比重 / Heading A/B/C / 部分 vs 全面開示 / HP 配置 / プレス・SNS / K8/K9 anti-pattern）、想定 DEC 起票 4〜6 件、想定所要 30〜45 分 |
| 4 | **W0-Week2 kickoff チェックリスト** | `reports/secretary-w0-week2-kickoff-checklist.md` | 205 行 / 約 14,785 字 | 秘書 C | §1〜§10 = 5/8→5/9 着手前 14 項目 + Phase 1 必達 13 完了基準 + 5/9 部署別着手 6 項目 + リスク予兆 5 項目 + Owner 追加 W0 7 項目 + 5/18 W0 完了直前 + Mermaid 1 枚 |

合計: **932 行 / 約 67,558 字 / Mermaid 1 枚**。

第 1 弾連結報告（4 部署並列、合計 1,531 行）と合わせ、本セッションの W0-Week2 prep 着地物理書込量は **2,463 行 / 約 87,000 字 + Mermaid 8 枚**（PM 起案 v4 + W0-Week2 実行計画 + Research 補追検証 + changelog Runbook + Marketing 2 件 + Dev 4 件 + 秘書 3 件 + SOP 1 件 + CEO 連結 2 件）。

---

## 3. SOP 制定の核（DEC-019-025）

### 3.1 背景
2026-05-03 W0-Week2 ブートストラップ並列発注で、PM 部門（planner type）と Research 部門（Explore type）に長文レポート 4 本（合計 1,531 行）を発注したところ、両エージェントは内容完成も Write/Edit ツール不在のため message 本文返答に留まり、CEO 経由で general-purpose 系 4 並列を再発注して書込解消（追加実工数 約 0.5 セッション）。

### 3.2 核ルール
| 想定字数 | 推奨 type | 必須ツール |
|---|---|---|
| 〜1,000 字（短文） | Plan / Explore / planner | Read / Grep / Glob |
| 1,000〜10,000 字 | **general-purpose** | **Read + Write** |
| 10,000 字超 | **general-purpose** | **Read + Write + Edit + Bash** |

判定軸（いずれか 1 つ該当で Write/Edit 保有 type）:
- 章立て 5 章以上 / Mermaid 1 枚以上 / 比較表 3 表以上 / 字数 1,000 字超

### 3.3 発注前チェックリスト A/B/C
- A: 想定字数 + Mermaid/比較表/多章立て該当性
- B: 必要ツール（Read のみ / Write 必要 / Edit 必要 / Bash 必要）
- C: 選択 type が必要ツール全保有 + 役割定義整合 + Tools リスト再確認

3 項目とも Pass で発注、1 項目でも Fail なら type 再選定 or 任務分割。

### 3.4 適用範囲
- Phase 1 期間（5/19〜6/13）: PRJ-019 関連発注に強制適用
- Phase 2 以降: 組織全体（PRJ-001〜018 含む）に拡張
- 再評価: 6/13 以降の Phase 2 着手時

---

## 4. 秘書 3 件配布資料の核

### 4.1 5/8 検収会議 議題 v3 (秘書 A)

| 項目 | 値 |
|---|---|
| 開催 | 2026-05-08 18:00〜20:00（120 分） |
| 議題 | §1 Dev エビデンス (25 min) / §2 Research 検証 (20 min) / §3 Review 検収 (25 min) / §4 Go/NoGo + DEC-019-021〜025 公式承認 (20 min) / §5 PM 追加議題 (30 min) |
| §5 内容 | (a) PM v4 起案承認 / (b) W0-Week2 実行計画承認 / (c) G-Top-1 候補 5 案レビュー / (d) PM v5 起案トリガー TR-1/2/3 確認 / (e) 5/15 競合解消（AS-151 を 5/16 スライド） |
| G-Top-1 候補 | (a) HN trending TS / (b) Vercel template / (c) shadcn 公式 / (d) AI SDK example / (e) 自社 PRJ-001〜018 リファクタ → CEO 推奨 (a)(e) |
| 添付 | 18 件（Dev 5 / Research 3 / Review 4 / PM 2 / Marketing 2 / CEO 2 / 組織 1） |
| 投票手順 | §5 末尾に絵文字なし投票プロトコル明記（Approve/Conditional/Reject + 理由 1 行） |

### 4.2 Marketing 8 件 オーナー回付資料 (秘書 B)

| ID | 議題 | 想定判断 | DEC 起票候補 |
|---|---|---|---|
| Q-Mkt-01 | PATTERN-006/007 番号衝突解消 | 番号再採番 or 並存 | 議事録扱い |
| Q-Mkt-02 | 公開 6/20 確定承認 | 確定 / 6/27 後ろ倒し / Phase 2 | **DEC 起票候補** |
| Q-Mkt-03 | 表現比重 40-25-20-15 承認 | 承認 / 修正 | 議事録扱い |
| Q-Mkt-04 | Heading A/B/C 選定 | A 採用（CEO 推奨）/ B / C | **DEC 起票候補** |
| Q-Mkt-05 | 部分開示 vs 全面開示 | 部分（CEO 推奨）/ 全面 / 非公開 | **DEC 起票候補** |
| Q-Mkt-06 | HP 配置 + リード導線 | トップ訴求 / 事例ページ / 両方 | **DEC 起票候補** |
| Q-Mkt-07 | プレス・SNS 有無 | 実施 / 静観 | 議事録扱い |
| Q-Mkt-08 | K8/K9 anti-pattern 公開範囲 | 全面 / 部分匿名化 / 非公開 | 議事録扱い |

想定 DEC 起票: 4〜6 件（02/04/05/06 確実 + α）。Owner 想定所要 30〜45 分。CEO 単独完結 5 件は §補足に分離（CEO 既決事項として記録）。

### 4.3 W0-Week2 kickoff チェックリスト (秘書 C)

| カテゴリ | 項目数 | 主要内容 |
|---|---|---|
| §1 5/8 検収後即時 | 5 | 議事録確定 / DEC-019-021〜025 反映 / 各部署 5/9 起票通知 |
| §2 夜間バッチ | 5 | dashboard 5/8 22:00 / decisions.md 整合 / cron seed |
| §3 Phase 1 必達 13 完了基準 | 13 | DoD 全項目 / 95→目標 110+ tests / G-01〜12 完備 / etc. |
| §4 5/9 部署別着手 | 6 | Dev / Research / Review / PM / Marketing / 秘書 |
| §5 リスク予兆 | 5 | OpenClaw upstream / Codex 5x / Vercel / Supabase / cost |
| §6 Owner 追加 W0 | 7 | Spend Cap 設定 / 1Password Vault / OAuth 隔離 / etc. |
| §7 5/18 W0 完了直前 | 3 | Go/NoGo 判定材料 / Phase 1 公式キックオフ準備 |

着手前完遂タスク: **14 項目**（5/8 18:00〜5/9 09:00 の 15 時間で完遂）。

---

## 5. 直近マイルストーン更新

| 日付 | イベント | 関連成果物 |
|---|---|---|
| 5/4 朝 | Owner: Marketing 8 件レビュー開始 | secretary B 資料 |
| 5/4〜5/7 | Owner: 8 件回付処理（30〜45 分） | DEC 起票候補 4〜6 件 |
| 5/8 12:00 | Dev エビデンス提出締切 | architecture/security-w0.md / 95 tests |
| 5/8 18:00〜20:00 | **W0-Week1 検収会議 v3（120 分）** | 議題 §1〜§5、G-Top-1 選定 |
| 5/8 20:00〜22:00 | 議事録確定 + DEC-019-021〜025 公式承認 + Marketing 8 件 DEC 起票 | secretary C kickoff §1 |
| 5/9 09:00 | **W0-Week2 公式着手** | secretary C §4 |
| 5/9 | Live integration test (オーナー OAuth $0.10 上限) | Dev W0-W2-01 |
| 5/12 | C-A-04 + H-09 PoC | Dev W0-W2-04 |
| 5/13 | BAN drill #1 実行 | DEC-019-019 シナリオ |
| 5/14 | drill #1 結果判定 + DEC-019-XXX | TR-1 発動可否 |
| 5/15 | Sumi/Asagi 完全バックアップ + OAuth 隔離（AS-151 を 5/16 にスライド） | PM W0-Week2 §3.2 |
| 5/17 | BAN drill #2（Sumi/Asagi 同居） | Review |
| 5/18 18:00 | **W0 完了 Go/NoGo + オーナー Spend Cap 確認** | secretary C §7 |
| 5/19 | **Phase 1 W1 公式キックオフ** | PM v4 |
| 5/26 | 4 系統 changelog 監視 Dev 着手 | DEC-019-022 |
| 5/30 | DEC-019-008 NG-3 オーナー再確認 = TR-2 発動可否 | Research |
| 5/31 | Codex 2x ボーナス終了 | R-019-07 |
| 6/3 | CB-CEO-W3-01 Vercel Pro 昇格判断 | DEC-019-024 |
| 6/13 | **Phase 1 完了 + Phase 2 Go/NoGo + TR-3 発動可否** | 全部署 |
| 6/20 | Phase 1 完了時公開（Marketing 提案） | Q-Mkt-02 確定なら |

---

## 6. リスク再評価（変更なし）

第 1 弾連結報告 §5 のリスクポートフォリオに変更なし:
- R-019-06 (BAN 30〜60%): 緑（DEC-019-007 オーナー受容）
- R-019-07 (Codex 2x 終了): 黄（W2 終了時再見積）
- R-019-08 (PRJ-018 並走): 黄（PM v4 §3.4.1 配分マトリクス）
- R-019-09 (NG-3): 黄（5/30 再確認）
- R-019-10 (Claude Max weekly): 黄（H-09 で軽減）
- R-019-11 (Vercel Hobby): 黄（DEC-019-016+017 で対応）
- R-019-12 (OpenClaw 上流): 黄（DEC-019-021 で再格付け）
- R-019-12-A (API breaking): 赤（C-OC-03 HITL）
- R-019-12-B (silent failure): 黄（C-OC-05 weekly health check）

新規リスクなし。

---

## 7. 結論

1. オーナー承認 3 件全て即時実行完遂
2. SOP 制定により Read-only 系 type 発注事故の再発を構造的に防止
3. 秘書 3 件配布資料により 5/8 18:00 検収会議の運用準備完了
4. 5/8 までの空白期間（5/4〜5/8）は Owner 8 件回付処理に充当
5. Phase 1 W1 着手 (5/19) 確度: **強い条件付き Go のまま維持**

---

## 8. 次のアクション

### 即時（CEO 自身）
- [x] dashboard PRJ-019 35%→40% 更新
- [x] decisions.md DEC-019-025 footer 整合
- [ ] Marketing 8 件回付資料を 5/4 朝 Owner にお届け（メール or ChatGPT セッション内）

### 5/4〜5/8（オーナー）
- [ ] Marketing 8 件レビュー（30〜45 分）+ 判断 8 件返送
- [ ] Spend Cap 設定確認（Anthropic $200 + ChatGPT Pro $200）
- [ ] 1Password Vault 4 系統 (Clawbridge-Master/Dev/Notify/Public) 作成（CB-O-05）
- [ ] OAuth 隔離方針 W0 段階レビュー（CB-O-04）

### 5/8 18:00（CEO + 全部署 + オーナー）
- [ ] W0-Week1 検収会議 v3 実施（120 分、議題 §1〜§5）
- [ ] DEC-019-021〜025 公式承認
- [ ] Marketing 8 件 DEC 起票（4〜6 件想定）
- [ ] G-Top-1 候補ジャンル選定（CEO 推奨 (a)(e) → 別決裁）
- [ ] Phase 1 W1 着手 Go/NoGo

### 5/9〜5/18（全部署）
- [ ] secretary C kickoff チェックリスト 44 項目完遂
- [ ] BAN drill #1 (5/13) → 結果判定 (5/14) → TR-1 発動可否
- [ ] Sumi/Asagi 完全バックアップ + OAuth 隔離 (5/15) + AS-151 を 5/16 にスライド
- [ ] BAN drill #2 (5/17)
- [ ] W0 完了 Go/NoGo (5/18 18:00)

---

**制定者**: CEO ／ **発効**: 2026-05-03 即日 ／ **次回更新**: 5/8 18:00 検収会議後（議事録確定 + DEC-019-021〜025 公式承認反映）
