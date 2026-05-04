# PRJ-018 Asagi × PRJ-019 Clawbridge 並走対照表（2026-05-03 版）

**宛先**: CEO ／ **作成**: 秘書部門 ／ **作成日**: 2026-05-03 ／ **対象期間**: 2026-05-03〜2026-05-19（17 日間、PRJ-019 W0-Week1 終盤〜W0-Week3 終了 + Phase 1 W1 着手日）

---

## 0. エグゼクティブサマリ（200 字）

PRJ-019 W0-Week1 連結報告（DEC-019-014〜017）完了に伴い、PRJ-018 Asagi M1（70%、AS-140 着手 Ready、Real impl 約 5〜7 営業日見込）との並走リソース競合を 17 日間 × 5 主体で再点検。**競合週は W0-Week2 の 5/9 / 5/13 / 5/15 + W0-Week3 の 5/17 / 5/18** に集中、Dev / Review / オーナーで重複手番が発生する見込み。優先順位は PM v2 §3.4.2 に従い、**PRJ-019 ハードガード関連（金銭・ToS・副作用）を即時優先**、それ以外は PRJ-018 M1 完遂を優先する。共通リソースは GitHub / Vercel / Anthropic アカウントのみ、コードベースは完全分離済。

---

## 1. 並走前提（再確認）

### 1.1 各案件の現在地（2026-05-03 時点）

| 項目 | PRJ-018 Asagi | PRJ-019 Clawbridge |
|---|---|---|
| 進捗 | M1 70% | Phase 1 着手準備 25%（W0-Week1 終盤） |
| 直近マイルストーン | AS-140 Real impl 着手 → Critical Path 10.5h（5〜7 営業日） | 5/8 18:00 W0-Week1 検収会議（Go/NoGo）→ 5/19 Phase 1 W1 公式キックオフ |
| Phase | M1 Real impl 着手承認済（DEC-018-032、2026-05-02） | Phase 1 強い条件付き Go（DEC-019-007、2026-05-02） |
| 次の決裁 | M1 完成時 self-acceptance（AS-151） | DEC-019-018 想定（5/13 BAN drill #1 結果） |
| 既存テスト緑数 | mock 系 testCommand 一連 + Playwright @codex-mock-ux 5/5 pass | 67 ケース全緑（harness 38 + claude-bridge 29、Win11 / Node 24.11.1） |
| 月次予算上限 | 既契約のみ（Codex Pro $200 既契約、追加発生ゼロ） | $300/月 ハードキャップ（DEC-019-012） |

### 1.2 PM v2 §3.4 配分マトリクス（再掲）

PM v2 §3.4.1 が Phase 1 W1〜W4 期間の Dev / Review 配分を確定しているが、本対照表は **PRJ-019 W0 期間（5/3〜5/18）** の運用週 = PM v2 表で言う「Phase 1 W1 着手前」を扱う。Phase 1 W1〜W4 の配分マトリクスはそのまま 5/19 以降に適用。

| 週 | Dev 配分（PRJ-019 / PRJ-018 / その他） | Review 配分（PRJ-019 / PRJ-018 / その他） |
|---|---|---|
| W0-Week1 残（5/3〜5/8） | 70% / 25% / 5%（W0-Week1 検収集中） | 60% / 35% / 5%（5/8 検収会議準備） |
| W0-Week2（5/9〜5/15） | 60% / 35% / 5%（残コントロール 14 + Live test + BAN drill #1） | 50% / 45% / 5%（BAN drill 立会 + ToS allowlist 統合） |
| W0-Week3（5/16〜5/18） | 55% / 40% / 5%（W0 完了判定 + BAN drill #2） | 50% / 45% / 5%（W0 完了レビュー） |
| W1（5/19〜5/23） | 50% / 40% / 10% ※PM v2 既定 | 30% / 60% / 10% ※PM v2 既定 |

**根拠**: PM v2 §3.4.1 既定 + W0 期間は PRJ-019 着手前提整備に Dev 比重を上げる必要がある（CEO 連結報告 §1.4 持越し 8 件 + W0-Week2 残コントロール 14 件）。一方 PRJ-018 M1 は AS-140 Critical Path 10.5h で 5〜7 営業日、Dev 25〜40% でも 5/19 〜 5/23 の Phase 1 W1 キックオフまでに M1 Real impl 完遂可能。

---

## 2. 5/3〜5/19 の 17 日間競合表（5 主体別）

### 2.1 Dev 部門（最重競合）

| 日付 | PRJ-018 想定タスク | PRJ-019 想定タスク | 競合度 | 優先順位（PM v2 §3.4.2） |
|---|---|---|---|---|
| 5/3 (土) | AS-140.0 contract.rs 物理実装（0.5h） | W0-Week1 持越し整理（CEO 連結報告 §1.4） | 低 | 並行可 |
| 5/4 (日) | AS-140 Real impl Day 1（spawn + stdio） | （休） | 無 | PRJ-018 専念 |
| 5/5 (月・祝) | AS-140 Real impl Day 2 / AS-141 auth.rs | （休） | 無 | PRJ-018 専念 |
| 5/6 (火) | AS-140 続行 / AS-142 image_paste.rs | mock-claude スタブ + libfaketime 整備（B5 シナリオ用） | 中 | PRJ-019 ハードガード優先（B5 = 連続稼働超過検証） |
| 5/7 (水) | AS-140 続行 / AS-143 WinJobObject 接続 | W0-Week1 検収準備（control evidence × 7 起票） | 中 | PRJ-019 検収会議優先（5/8 18:00 締切） |
| 5/8 (木) | AS-144 ChatPane real 切替（2h） | **検収会議準備 + 7 項目エビデンス提出（12:00 締切）** + 検収会議 18:00 出席 | **高** | **PRJ-019 全面優先**（DEC-019-014 起票分の検収会議） |
| 5/9 (金) | AS-140 リファクタ + AS-145 E2E real 追加 | **claude-bridge live integration test（オーナー OAuth、$0.10 上限）** + W0-Week2 残コントロール着手 | **高** | **PRJ-019 即時優先**（Live test はオーナー立会必須） |
| 5/10 (土) | AS-140 / AS-145 整地 | ToS allowlist DoD 統合作業（Review 主導、Dev 補助） | 低 | 並行可 |
| 5/11 (日) | （休 or AS-140 軽作業） | （休 or W0-Week2 残コントロール軽作業） | 無 | 任意 |
| 5/12 (月) | AS-140 完成判定 / AS-151 自己検収準備 | C-A-04 使用量モニタリング運用開始 + サンプルニーズ 3〜5 候補抽出 | 中 | C-A-04 はオーナー再確認 5/30 の前提、優先 |
| 5/13 (火) | AS-151 M1 自己検収（4 ステップ AC） | **BAN drill #1 実施（PRJ-019 単独、Sumi/Asagi アイドル）** | **高** | **PRJ-019 BAN drill 全面優先**（オーナー立会推奨） |
| 5/14 (水) | M1 Done 報告 + M2 ロードマップ反映 | BAN drill #1 結果検収 + DEC-019-018 起票準備 | 中 | PRJ-019 検収優先 |
| 5/15 (木) | M1 後始末 / M2 W2-T1 着手準備 | **C-A-01 Sumi/Asagi 完全バックアップ + OAuth 隔離 + CB-O-05 Doppler 登録（オーナー）** | **高** | **PRJ-019 全面優先**（Doppler 登録期限） |
| 5/16 (金) | M2 W2-T1 着手 | W0 完了判定準備（残コントロール 14 全完成チェック） | 中 | 並行可 |
| 5/17 (土) | M2 軽作業 | **BAN drill #2（Sumi/Asagi 同居前提）** | **最高** | **PRJ-019 全面優先**（Sumi/Asagi バックアップ済前提） |
| 5/18 (日) | （休） | **W0 完了 Go/NoGo 最終判定会議 + オーナー Spend Cap 設定** | **高** | **PRJ-019 全面優先** |
| 5/19 (月) | M2 通常進捗 | **Phase 1 W1 公式キックオフ**（PM v2 §3.4 W1 配分開始：50% / 40% / 10%） | 高 | PM v2 マトリクス開始 |

**Dev 競合ピーク**: 5/8 / 5/9 / 5/13 / 5/15 / 5/17 / 5/18（PRJ-019 全面優先 6 日間）。ただし PRJ-018 AS-140 Real impl は 5/3〜5/13 の間で 5〜7 営業日 = 32〜45h を確保可能、本対照表の Dev 配分（W0-Week1 残 25% + W0-Week2 35%）でも M1 完遂タイミングは 5/13〜5/14 で着地予測。**M1 完遂が PRJ-019 Phase 1 W1 着手（5/19）に間に合う前提を維持**。

### 2.2 Review 部門

| 日付 | PRJ-018 想定タスク | PRJ-019 想定タスク | 競合度 |
|---|---|---|---|
| 5/3〜5/7 | AS-145 E2E review / AS-151 self-acceptance 検証準備 | W0-Week1 検収チェックリスト最終調整 | 低 |
| 5/8 18:00 | （アイドル）| **W0-Week1 検収会議 議事進行支援（CEO 議長補佐）** | 高 |
| 5/9 | AS-145 E2E real シナリオレビュー | ToS allowlist v1 確定（CB-S-W0-02 期限）| 中 |
| 5/10 | （アイドル）| **ToS allowlist DoD 統合（5/10 完成、並列発注）** | 高 |
| 5/12〜5/13 | AS-151 立会 / M1 完成検証 | **BAN drill #1 立会 + シナリオ最終化（並列発注で進行中）** | 中 |
| 5/14〜5/15 | M1 self-acceptance review | C-A-01〜05 検証 + 退避手順書整備 | 中 |
| 5/17 | M1 完成判定支援 | **BAN drill #2 立会 + 結果検収** | 最高 |
| 5/18 | （アイドル）| **W0 完了レビュー（CB-S-W0-01）** | 高 |

**Review 競合ピーク**: 5/8 / 5/10 / 5/13 / 5/17 / 5/18。Review はもともと PM v2 §3.4 で W1〜W4 の PRJ-019 配分が Dev より低い（30〜60%）が、W0 期間は **検収会議 + BAN drill 2 回 + ToS allowlist 統合** が連続するため 50% 前後で運用。

### 2.3 オーナー手番

| 日付 | PRJ-018 想定タスク | PRJ-019 想定タスク | 所要時間 |
|---|---|---|---|
| 5/3〜5/8 | （AS-140 進捗確認のみ） | （CEO 連結報告レビュー） | 各 30 分 |
| 5/9 | （アイドル） | **claude-bridge live integration test 立会**（OAuth セッション提供、$0.10 上限） | 30〜60 分 |
| 5/13 | （アイドル） | （BAN drill #1 観察、必須ではない） | 任意 |
| 5/15 | （アイドル）| **CB-O-05 Doppler / 1Password Vault 登録**（期限） | 30 分 |
| 5/17 | （アイドル）| （BAN drill #2 観察、必須ではない） | 任意 |
| 5/18 | （アイドル）| **Anthropic Spend Cap 設定 + OpenAI Spend Cap 設定 + screenshot 提出 + W0 完了判定会議参加**（期限） | 計 60〜90 分 |

**オーナー競合ピーク**: 5/9 / 5/15 / 5/18。3 日合計で約 2〜3.5 時間、PRJ-018 側は AS-140 進捗確認のみで競合なし。詳細は別紙 `owner-pending-tasks-2026-05-03.md` 参照。

### 2.4 CEO 手番

| 日付 | PRJ-018 関連 | PRJ-019 関連 |
|---|---|---|
| 5/8 18:00 | （アイドル）| **W0-Week1 検収会議議長進行（90 分）** |
| 5/8 22:00 | （アイドル）| `ceo-w0-week1-consolidation-v2.md` 再発行（実検収結果反映）|
| 5/13 〜 14 | M1 完遂報告受領（DEC-018-032 の自己検収結果）| **DEC-019-018 起票（BAN drill #1 結果決裁）** |
| 5/12 | （アイドル）| C-A-04 使用量モニタリング検収（Review 経由）|
| 5/18 18:00 | （アイドル）| **W0 完了 Go/NoGo 最終判定議長進行** |
| 5/19 | （アイドル）| **Phase 1 W1 公式キックオフ議長進行** |

**CEO 競合**: なし。PRJ-018 は M1 完遂報告のみ、PRJ-019 は W0 期間の決裁ピーク。

### 2.5 秘書部門（自身）

| 日付 | PRJ-018 関連 | PRJ-019 関連 |
|---|---|---|
| 5/3 | （アイドル）| **本対照表作成 + W0-Week2 タスク台帳整備 + オーナー残タスクメモ更新（本セッション）** |
| 5/9〜5/15 | M1-STATUS 更新（M1 完成時） | **dashboard 日次反映 + W0-Week2 進捗反映 + PM v3 → v4 週次更新** |
| 5/17 | （アイドル）| BAN drill #2 議事録作成支援 |
| 5/18 | （アイドル）| **W0 完了レビュー dashboard 反映 + secretary-w0-completion-summary.md 作成（予定）** |

**秘書競合**: なし。PRJ-018 M1 完成と PRJ-019 W0 完了は 4 日ずれており（5/13〜14 vs 5/18）、dashboard 更新は段階的に処理可能。

---

## 3. 共通リソース競合チェック（再確認）

PM v2 §3.4.3 の整理に W0-Week1 連結報告の最新状態を反映：

| 共通基盤 | PRJ-018 利用 | PRJ-019 利用 | 競合状況（5/3〜5/19） | 衝突回避策 |
|---|---|---|---|---|
| **GitHub アカウント** | hironori-oi/Asagi（private）| clawbridge 専用リポ（CB-D-01、5/16 期限）| 衝突なし（リポ完全分離）| 完全分離リポ |
| **Vercel アカウント** | Asagi は Tauri アプリで Vercel 不要 | clawbridge 用 project（CB-D-02、5/17 期限）| 衝突なし | 完全分離 |
| **Anthropic Claude Max $200 アカウント** | Asagi 開発時 IDE で使用 | claude-bridge live integration test (5/9) + W0-Week2 残コントロール検証 | **5/9 のみ軽競合**（Live test 中は他作業を一時停止）| H-09 weekly cap 監視（DEC-019-015、80%/95%）+ Live test は $0.10 上限固定 |
| **OpenAI ChatGPT Pro $200 アカウント** | Asagi 開発時 Codex sidecar で使用 | （PRJ-019 W0 期間は OAuth トークン到達禁止検証のみ、本格利用は W1 以降）| **競合なし**（W0 期間は Codex 利用ほぼゼロ）| W1 以降 PM v2 §3.4.4 5x usage 共有監視へ移行 |
| **claude-code-company 組織本体** | 開発作業対象 | **read-only mount のみ**（CEO 連結報告 §1.5 で副作用ゼロ確認）| 衝突なし | PRJ-019 は zero modification 原則継続 |
| **Supabase 監査基盤** | Asagi は自前 SQLite で不要 | clawbridge 監査専用プロジェクト（CB-D-03、5/17 期限）| 衝突なし | 完全分離 |
| **Doppler / 1Password** | （未使用）| CB-O-05（5/15 オーナー期限）| 衝突なし | PRJ-019 専用 Vault |
| **コードベース全体** | `app/asagi-app/` 配下 | `projects/PRJ-019/app/` 配下 | 衝突なし | 物理ディレクトリ分離 |

**結論**: 共通リソース競合は実質ゼロ。Anthropic アカウントの 5/9 Live integration test 中の他作業一時停止のみ留意。

---

## 4. 競合発生時の優先順位提案（CEO 注意喚起ポイント）

PM v2 §3.4.2 の優先順位ルールに本対照表の特殊事情を加味した提案：

| 状況 | CEO 判断推奨 | 理由 |
|---|---|---|
| **5/8 18:00 W0-Week1 検収会議** | PRJ-019 全面優先（出席必須）| Phase 1 W1 着手 (5/19) の Go/NoGo 直結 |
| **5/9 claude-bridge live integration test** | PRJ-019 全面優先（オーナー立会必須）| OAuth セッション提供はオーナー本人のみ可能 |
| **5/13 BAN drill #1** | PRJ-019 優先 + AS-151 自己検収を 5/14 にスライド可 | BAN drill は B-1 / B-2 / B-3 シナリオの実機検証で 1 日所要、AS-151 は 2h で柔軟 |
| **5/15 CB-O-05 Doppler 登録（オーナー）+ Sumi/Asagi バックアップ** | **PRJ-019 全面優先** | Doppler 期限当日 + Sumi/Asagi バックアップは BAN drill #2（5/17）の前提 |
| **5/17 BAN drill #2（Sumi/Asagi 同居前提）** | PRJ-019 全面優先 | 同居前提のため Sumi/Asagi に対する物理作業を含む、PRJ-018 M2 軽作業のみ並行可 |
| **5/18 W0 完了判定 + Spend Cap 設定（オーナー）** | PRJ-019 全面優先 | Phase 1 W1 着手（5/19）の最終ゲート |
| **PRJ-018 AS-140 が 5/14 を超えて遅延** | **PRJ-018 優先に切替**（PRJ-019 W0-Week3 タスクを 1 〜 2 日スライド可） | M1 完遂が Phase 1 W1 着手の前提のため、PRJ-018 の 5/13〜14 完了は死守、超過時は CEO 即決裁で W0 タスクを軽い先送り |

**CEO への注意喚起 Top 3**:

1. **5/15 が最重競合日** — CB-O-05 Doppler（オーナー期限）+ C-A-01 Sumi/Asagi バックアップ + OAuth 隔離（Dev）+ AS-151 M1 完成判定（PRJ-018）が同日。秘書部門としては 5/15 朝に「本日の手番」リマインドメールをオーナーに送信予定。
2. **5/9 Live integration test の OAuth セッション提供はオーナー本人のみ可能** — このタスクは絶対に他者代理不可、オーナー不在の場合は同日中に再スケジュール必須。
3. **PRJ-018 AS-140 が遅延した場合の Phase 1 W1 着手スライドを事前準備** — 現状 5/13〜14 完了予測だが、AS-140 / AS-141 / AS-142 の依存連鎖で 1 日遅延の可能性あり。CEO は「5/19 Phase 1 W1 着手の確度」を 5/14 朝に再確認することを推奨。

---

## 5. 並走依存関係グラフ（Mermaid）

```mermaid
gantt
    title PRJ-018 × PRJ-019 並走 17 日間ガント（2026-05-03〜05-19）
    dateFormat  YYYY-MM-DD
    axisFormat  %m/%d

    section PRJ-018 Asagi M1
    AS-140 Real impl Critical Path :as140, 2026-05-04, 10d
    AS-141 auth.rs                  :after as140, 2d
    AS-142 image_paste              :2026-05-08, 2d
    AS-143 WinJobObject             :2026-05-09, 1d
    AS-144 ChatPane real切替        :2026-05-08, 1d
    AS-145 E2E real                 :2026-05-09, 3d
    AS-151 M1 self-acceptance       :crit, 2026-05-13, 1d
    M2 W2-T1 着手                   :2026-05-15, 5d

    section PRJ-019 W0-Week1 残
    検収会議準備                     :2026-05-03, 5d
    7項目エビデンス提出 12:00       :crit, milestone, 2026-05-08, 0d
    W0-Week1 検収会議 18:00         :crit, milestone, 2026-05-08, 0d

    section PRJ-019 W0-Week2
    Live integration test           :crit, livetest, 2026-05-09, 1d
    ToS allowlist DoD 統合          :2026-05-09, 2d
    残コントロール 14 件             :w2dev, 2026-05-09, 7d
    C-A-04 使用量モニタ運用開始     :2026-05-12, 1d
    BAN drill #1                    :crit, drill1, 2026-05-13, 1d
    Sumi/Asagi バックアップ + OAuth :crit, backup, 2026-05-15, 1d
    Doppler 登録 オーナー期限        :crit, milestone, 2026-05-15, 0d

    section PRJ-019 W0-Week3
    BAN drill #2                    :crit, drill2, 2026-05-17, 1d
    W0 完了 Go/NoGo + Spend Cap     :crit, milestone, 2026-05-18, 0d
    Phase 1 W1 公式キックオフ        :crit, milestone, 2026-05-19, 0d
```

---

## 6. 次回更新トリガー

| トリガー | 反映先 |
|---|---|
| 5/8 18:00 W0-Week1 検収会議結果 | 本対照表 §1.1 + §2 / dashboard PRJ-019 行 |
| 5/13〜14 PRJ-018 M1 完遂 | 本対照表 §1.1 PRJ-018 行 / dashboard PRJ-018 行（CEO が起票） |
| 5/13 BAN drill #1 結果（DEC-019-018） | 本対照表 §4 注意喚起 / dashboard PRJ-019 行 |
| 5/18 W0 完了判定 | 本対照表全更新 + 5/19〜6/13 Phase 1 期間版を新規作成 |

---

**作成**: 2026-05-03 秘書部門 ／ **次回更新**: 5/8 18:00 W0-Week1 検収会議結果反映時 ／ **対象**: CEO（オーナー報告は CEO 経由）
