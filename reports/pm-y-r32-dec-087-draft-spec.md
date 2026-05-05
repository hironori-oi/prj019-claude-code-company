# PM-Y R32 DEC-087 DRAFT 起案 spec レポート

**作成者**: PM-Y (Round 32 / 9 並列 1 軸目)
**作成日時**: 2026-05-06 R32 atomic session
**対象議決**: DEC-019-087 (PRJ-019 post-launch 30day retrospective KPT 統合 + DEC 系列 closeout 動議 spec)

---

## 1. 議決概要

| 項目 | 内容 |
|---|---|
| 議決 ID | DEC-019-087 |
| タイトル | PRJ-019 post-launch 30day retrospective KPT 統合 + DEC 系列 closeout 動議 spec |
| 起案者 | PM-Y (R32) |
| 起案日 | 2026-05-06 R32 |
| status | DRAFT |
| レビュー期限 | R33 採決想定 (2026-05-07 R33 atomic ratification 連続継承想定) |

---

## 2. 背景

DEC-093 confirmed (R32) により confidence 100% lock 確定 protocol formal 化完遂。後続 SOP として post-launch 30day retrospective KPT 統合 + DEC 系列 closeout 動議 spec を起案する。DEC-019-085 GTC-11 D-Day immediate trigger 起動 + Marketing-X post-mortem template (R29 Dev-FFF 90 行) を base に、30day retrospective を formal 化することで、Phase 3 production GA 後の運用知見を knowledge/patterns/ に統合する。

---

## 3. spec 候補 (5 件)

### 3.1 ① post-launch 30day retrospective 起動 trigger
- 起動 trigger: GTC-11 GREEN 達成後 T+30day で Marketing-X が retrospective session 起動
- 形式: KPT framework (Keep/Problem/Try)
- Owner 拘束: 0-15 min 任意 (CEO 自走 retrospective session)
- 出力先: organization/knowledge/retrospectives/prj-019-30day-kpt.md (新規)

### 3.2 ② KPT 統合フレーム
- **Keep (継続事項)**: 13 KPI baseline GREEN 維持 / Phase 2 W5+W6 monitoring SOP / Owner 拘束 0 分継承 / sec yml 12 file md5 不変 / decisions.md absolute 不変領域保持
- **Problem (課題事項)**: GTC-11 actual 88/88 採点 PASS verify における trigger 起動遅延有無 / D-Day immediate trigger CEO 単独 ack 5 min path 実運用検証 / post-launch monitoring 1week → 30day 拡張時の閾値見直し / rollback trigger 5/7 採用 vs 7/7 全採用比較
- **Try (改善事項)**: knowledge/patterns/ への自動 PII redaction 機構実装 / DEC 系列 active/archived/superseded 3 区分整理自動化 / 13 KPI baseline → 20 KPI 拡張検討 / PRJ-020+ 横展開時の SOP template 化

### 3.3 ③ DEC 系列 closeout 動議
- 対象: DEC-019-001〜093 系列 (R32 着地時点 51 confirmed + 1 DRAFT)
- 区分:
  - **active**: 継続運用議決 (DEC-019-080+081+082+083+084+085+086+093 等)
  - **archived**: Phase 完遂後の歴史的記録議決 (DEC-019-001〜040 等の Phase 1 系列)
  - **superseded**: v2 等で上書き済議決 (DEC-019-068 → DEC-019-068 v2 等)
- 判定主体: PM-Z (R33+) + Knowledge-Y + Sec-BB の 3 者 AND 判定

### 3.4 ④ knowledge/patterns/ 統合
- 出力形式: YAML frontmatter + Markdown 本文
- frontmatter フィールド: `prj_id`, `phase`, `tags`, `created_at`, `pii_redacted`, `lineage`
- PII redaction 適用: HITL 第 11 種 `knowledge_pii_review` で人間チェック (Review 部門 ODR-OG-06 連動検討中)
- 蓄積対象: KPT 結果 / GTC-1〜11 trajectory / DEC-082-093 lineage / 13 KPI baseline 推移

### 3.5 ⑤ post-confirm SOP 起動 trigger
- 30day retrospective 完遂後に post-launch operational SOP formalization (DEC-088-092 候補) の起案 trigger 起動
- 起案担当: PM-Z (R33+) + Sec-BB + Web-Ops-R + Marketing-Z + Dev-JJJ の 5 軸並列起案
- 起案 round 想定: R33-R37 (5 round で DEC-088-092 順次起案)

---

## 4. 根拠 (R-1〜R-5)

- (R-1) DEC-093 confirmed (R32 atomic ratification) により 100% lock 確定 protocol formal 化完遂 = post-launch SOP 起案 trigger 成立
- (R-2) DEC-019-085 GTC-11 D-Day immediate trigger 起動 + Marketing-X post-mortem template (R29 Dev-FFF 90 行) base 整備済
- (R-3) DEC-019-033 拡張 (knowledge/patterns/decisions/pitfalls/ 構造化蓄積機構) 準拠
- (R-4) DEC-019-083 1week monitoring SOP の 30day 拡張版として整合
- (R-5) Phase 3 production GA 後の運用知見蓄積 = PRJ-020+ 後続案件への横展開 base

---

## 5. 投票方針 (R33 採決見込)

| 項目 | 内容 |
|---|---|
| 採決方式 | CEO 主催 R33 atomic 1 round session (DEC-093 R32 atomic 採決 pattern 継承) |
| 採決ライン | CEO + PM-Z + Sec-BB 3 者最低 (緊急採決基準成立) |
| 賛成見込 | 3-0-0 (DEC-093 confirmed + GTC-11 actual 88/88 PASS verify 完遂前提) |
| 採決時刻見込 | R33 session 内 15-20 min (DEC-087 単体) |
| 投票結果記入欄 | confirmed 時に本 status 行物理書換 |

---

## 6. 連動議決

### 6.1 上流継承
- DEC-082 (Phase 2 W5 完遂宣言 / R29 confirmed)
- DEC-083 (Phase 2 W6 production GA 入口条件 / R29 confirmed)
- DEC-084 (GTC-7 完遂宣言 / R31 confirmed)
- DEC-085 (GTC-11 D-Day immediate trigger formal 化 / R31 confirmed)
- DEC-086 (ARCH-01 fully-resolved formal 遷移 / R31 confirmed)
- DEC-093 (100% lock 確定 protocol / R32 confirmed)

### 6.2 同 round 連動 (R33 想定)
- DEC-088-092 起案 (post-launch operational SOP formalization 5 件)
  - DEC-088: W7-B monitoring SOP (1week → 30day 拡張)
  - DEC-089: W7-C retrospective SOP (KPT framework formal 化)
  - DEC-090: 100% lock 維持 SOP (5 file 無改変 lock 50 round target)
  - DEC-091: sec yml md5 不変 50 round target SOP
  - DEC-092: INDEX-v25 milestone SOP

### 6.3 下流
- 30day retrospective 完遂後の knowledge/patterns/ 統合
- PRJ-020+ 横展開 base 整備
- DEC 系列 active/archived/superseded 3 区分整理 (PM-Z 担当)

---

## 7. 副作用評価

- decisions.md への append: DEC-087 DRAFT 起案 section (約 30-40 行)
- line 1-2270 absolute 不変領域: 完全保持
- 既存 absolute 4 file: 無改変
- sec yml 12 file md5: 不変
- API call: $0
- Owner 拘束: 0 分

---

## 8. 議決構造遷移

| 段階 | confirmed | DRAFT | 合計 |
|---|---|---|---|
| R32 atomic ratification 直後 (中間) | 51 | 0 | 51 |
| **R32 DEC-087 起案後 (R32 着地)** | **51** | **1** | **52** |
| R33 DEC-087 採決想定 | 52 | 0 | 52 |

---

## 9. 結論

- DEC-087 DRAFT 起案完遂 (R32 / PM-Y)
- post-launch 30day retrospective KPT 統合 + DEC 系列 closeout 動議 spec 整備
- R33 採決想定 (CEO + PM-Z + Sec-BB 3-0-0 賛成見込)
- DEC-088-092 候補 5 件起案 trigger 起動 base 成立
- Owner 拘束 0 分維持 / API call $0 / 副作用 0
