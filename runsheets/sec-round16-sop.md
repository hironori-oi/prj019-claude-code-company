# Sec Runsheet — Round 16 SOP（DEC-019-066 連動）

**作成**: 2026-05-05（Round 16 第 2 波 / Sec-K 担当） / **対象**: Round 16 9 並列 dispatch SOP / **連動 DEC**: DEC-019-058 / 062 / 064 / 065 / **066 起案中**
**目的**: Round 15 stagger 圧縮実績（T+150-180 → T+50、約 1/3 短縮）を Round 16 以降で再現し、Sec hardening を formal 化するための部署横断 runsheet。

---

## §1 適用範囲

- 対象: Round 16 以降の全 9 並列 dispatch（PM / Research / Dev / Marketing / Review / Knowledge / Secretary / Web-Ops / Sec）
- 期間: 2026-05-05 ～ Phase 1 W4 完遂時点（6/20 想定）
- 除外: drill #2 実機検証 / Owner formal authorize 採決時 dispatch（DEC-019-058 SOP 優先）

---

## §2 dispatch 順序 SOP（圧縮 T+50 標準化）

| 波 | T+ 範囲 | 対象部署（最大） | 制約 |
|---|---|---|---|
| 第 1 波 | T+0 〜 T+50 | PM / Research / Dev（最大 5 並列） | API spike risk 低 / 計算資源優先確保 |
| 第 2 波 | T+0 〜 T+150 | Marketing / Review / Knowledge / Secretary / Web-Ops / Sec（最大 4 並列） | 第 1 波と完全独立 ／ artifact 衝突 0 必須 |
| 例外 | T+0 〜 T+30 | drill 連動 / Owner directive 即応 | CEO 明示承認下のみ |

**圧縮根拠**: Round 15 で第 1 波 5 並列 + 第 2 波 6 並列を T+50 / T+150 で完遂 → Round 16 でも同構成継続（DEC-019-062 加速 4 軸採択前提）。

---

## §3 Sec hardening 4 項目（DEC-019-066 §2.3）

### §3.1 API spike 検知
- **trigger**: 1 部署単位で API call 数 > 過去 3 round 平均 + 2σ
- **action**: 即時 CEO 通知 + 当該部署 dispatch 一時停止（最大 5 分）
- **計測**: `dashboard/api-budget-v2.md` の round 別累計と突合（Sec-J 既存仕組を再利用）
- **閾値**: $0 維持（subscription plan 主軸、DEC-019-051）／ API spend cap $30/月 不変（DEC-019-050）

### §3.2 副作用 0 自動検証
- **対象**: Read / Edit / Write / Glob / Grep のみ許容
- **禁止**: Bash で外部 service 起動 / git push / package install / network call
- **検証手順**: 各部署 dispatch 完了直後に `git status` 差分が **想定 artifact のみ** であることを確認、逸脱時は即時 revert
- **gate**: tests PASS gate（§3.4）と AND 条件で連動

### §3.3 絵文字 0 自動チェック
- **対象**: 全 artifact（decisions.md / runsheets/ / reports/ / progress.md / brief.md）
- **辞書**: NFKC 正規化 + 35 ペア多言語フィルタ（Sec-J で formal 化済）
- **手順**:
  1. 各部署 dispatch 完了時に `Grep -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{1F900}-\x{1F9FF}]'` 相当で artifact をスキャン
  2. 検出時は当該部署に即時 redaction 指示
  3. CLAUDE.md「assistant MUST avoid using emojis」既定方針と整合
- **例外**: 既存 DEC / report の emoji 痕跡（read-only）は記録のみ、改変は別 DEC 必要

### §3.4 tests PASS gate
- **対象**: workspace test 791 PASS（Round 12 R12 達成値）を baseline
- **trigger**: Dev 部門 dispatch を含む round では完了時に test 数増減を report に明記
- **gate 条件**:
  - 既存 791 ケースが **regress なし**（PASS 数 < 791 で fail）
  - 新規追加分は report に件数 + 主旨を記載
- **fallback**: regress 検知時は即時 commit revert + Review 部門エスカレーション

---

## §4 stagger 圧縮 SOP（数値化）

```
T+0    第 1 波 dispatch 全 5 部署同時送信開始（Round 16 PM/Research/Dev など）
T+50   第 1 波完遂目標（Round 15 実績準拠、stretch goal）
T+0    第 2 波 dispatch 全 4 部署同時送信開始（第 1 波と並走可）
T+150  第 2 波完遂目標（旧 T+150-180 帯から圧縮、上限保持）
T+180  全波完遂 hard limit（超過時は CEO 強制 ack）
```

**例外条件**:
- (a) Owner directive 緊急受領時: 該当部署のみ T+0 即時送信、他は通常 SOP 維持
- (b) drill #2 実機検証連動時: drill 担当 1 部署のみ T+0 〜 T+30 で完遂、ほか stagger 維持
- (c) API spike 検知時 (§3.1): 当該部署 5 分停止、再開後は新規 T+0 として計測

---

## §5 集計手順（CEO 統合報告連動）

1. 全 9 並列完遂後 30 分以内に CEO が統合報告 v17（Round 16）起票
2. Sec runsheet 連動チェック項目:
   - [ ] §3.1 API spike 検知結果（spike 件数 / 停止発動回数）
   - [ ] §3.2 副作用 0 自動検証結果（逸脱件数 / revert 件数）
   - [ ] §3.3 絵文字 0 自動チェック結果（検出件数 / redaction 件数）
   - [ ] §3.4 tests PASS gate（baseline 791 維持確認）
3. 4 項目すべて PASS 時のみ Round 16 を「formal 完遂」と記録
4. 1 項目でも fail 時は CEO 判断で次 round へ条件付持越 or 即時 retry

---

## §6 連携先 SOP

| SOP | 起案 / DEC | Sec runsheet との連携点 |
|---|---|---|
| Owner formal authorize SOP | DEC-019-058 | §2 dispatch 順序 SOP の例外条件 (b) と AND 連動 |
| stagger 圧縮 SOP（CEO 起案） | DEC-019-062 | §2 / §4 の数値化を本 runsheet で正規化 |
| Phase 1 W1 SOP | DEC-019-064 | §3.4 tests PASS gate baseline = W1 着手時点で 791 確定 |
| Round 16 9 並列構成（PM-I 起案中） | DEC-019-065 | §2 第 1 波 / 第 2 波の部署配分は PM-I 案を Sec が hardening 視点で承認 |
| Round 16 SOP formal 化（本起案） | **DEC-019-066** | 本 runsheet が SOP 本体 |

---

## §7 5/26 レビュー対象項目

- §3.1〜§3.4 の運用実績（Round 16 〜 Round 18 想定 3 round 分の集計）
- 圧縮 T+50 / T+150 の達成率（目標 80%+ / 95%+）
- 例外発動回数（目標: 全 round 平均 < 1 件 / round）
- regress 件数（目標 0 件、tests baseline 791 維持）

**レビュー期限**: 2026-05-26 / **レビュー担当**: Review 部門 + Sec / **報告先**: CEO 経由 Owner

---

**runsheet 行数**: 約 110 行（80-120 行制約内） / **API 消費**: $0（Read + Write のみ） / **tests 影響**: 0（runsheet 文書追加のみ） / **絵文字**: 0
