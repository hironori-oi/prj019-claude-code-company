# PM-Z R33 DEC-088-092 起案候補比較 + 優先順位 spec

最終更新: 2026-05-06 W0-Week2 R33
起案: PM-Z / Round 33 軸 2 (DEC-088-092 起案候補 5 件 spec)
位置付け: PRJ-019 Open Claw "Clawbridge" R33 9 並列 軸 2 = post-launch operational SOP formalization 5 件 起案候補比較・優先順位策定
版: v1.0
連動 DEC: DEC-019-087 confirmed (R33 atomic ratification 完遂) → ⑤ post-confirm SOP trigger 起動

---

## §0 サマリ (PM-Z 200 字)

R33 軸 2 = **DEC-088-092 起案候補 5 件 spec 確立**。DEC-087 confirmed ⑤ post-confirm SOP trigger 起動を受けた **post-launch operational SOP formalization** 5 件起案候補を比較・優先順位付け。**DEC-088 (post-launch 30day operational SOP) > DEC-089 (incident escalation runbook) > DEC-090 既存 confirmed (継続) > DEC-091 (KPI breach response SOP) > DEC-092 既存 confirmed (継続)** 補完整合確認。R34-R36 起案 trigger 推奨 spec 化完遂。副作用 0 / API call $0。

---

## §1 既存 DEC-090 + DEC-092 状況 (継続継承)

| DEC | 起案 | 採決 | 内容 | R33 着地 |
|---|---|---|---|---|
| DEC-090 | R28 | R29 confirmed | observability dashboard reposition | 継承 (R32 dashboard mode='live' 切替で運用継続) |
| DEC-092 | R30 | R31 confirmed | DEC-019-041 ARCH-01 PA-01-03 atomic 化 | 継承 (R31 GTC-5 formal verify) |

→ DEC-088-091 の番号は新規起案候補 (既存 DEC-090+092 と番号重複なし)

---

## §2 DEC-088-091 起案候補 4 件 spec 比較

### DEC-088 候補: post-launch 30day operational SOP formalization
- **背景**: DEC-087 ② KPT 4 軸統合 + ⑤ post-confirm SOP trigger を受けた 30day 運用 SOP formal 化
- **spec**:
  - 30day 区切で 13 KPI baseline + sec audit log + GTC trajectory + DEC lineage 4 軸を closeout
  - escalation 経路 3 severity (INFO/WARN/CRIT) formal 化 (Dev-OOO W7-B alert-routing.ts 連動)
  - on-call rotation 3 名体制 (CEO + Sec-X + Marketing-X) + Owner 拘束 0-15 min 任意
- **優先順位**: **1 位 (最優先 / R34 atomic 採決推奨)**
- **採決ライン**: CEO + PM + Web-Ops 3 者最低 (緊急採決基準成立)
- **賛成見込**: 3-0-0
- **依存**: DEC-087 confirmed (達成) / DEC-090 dashboard 連動

### DEC-089 候補: incident escalation runbook formalization
- **背景**: post-launch 30day 期間中の incident response 手順 formal 化
- **spec**:
  - 5 severity (P1/P2/P3/P4/P5) escalation matrix
  - response time SLA (P1=15min / P2=1h / P3=4h / P4=24h / P5=best-effort)
  - rollback trigger (T0''' rollback playbook 連動 / Sec ULTRA-EXTENDED baseline 連動)
- **優先順位**: **2 位 (R35 atomic 採決推奨)**
- **採決ライン**: CEO + Sec + Dev 3 者最低
- **賛成見込**: 3-0-0
- **依存**: DEC-088 confirmed 推奨

### DEC-091 候補: KPI breach response SOP formalization
- **背景**: 13 KPI baseline breach 時の response SOP formal 化
- **spec**:
  - threshold 3 段階 (warn 80% / critical 90% / breach 100%)
  - breach response 4 step (detection → triage → mitigation → retrospective)
  - DEC-087 ② KPT 4 軸統合 連動 (breach event を Problem として KPT 反映)
- **優先順位**: **3 位 (R36 atomic 採決推奨)**
- **採決ライン**: CEO + Marketing + Dev 3 者最低
- **賛成見込**: 3-0-0
- **依存**: DEC-088 + DEC-089 confirmed 推奨

### DEC-092 候補 (既存 confirmed と重複しない新規番号体系想定)
※ 既存 DEC-092 (R31 confirmed) と番号重複回避のため、本起案候補は **DEC-094 番号で再採番推奨** (R33 PM-Z spec)

### DEC-094 候補 (DEC-092 候補から再採番): retrospective KPT closeout protocol
- **背景**: DEC-087 confirmed ③ DEC 系列 closeout 動議 連動の retrospective 完遂後 closeout protocol formal 化
- **spec**:
  - 30day retrospective 完遂後の DEC-019-001〜093 系列 closeout 判定 (active/archived/superseded)
  - PRJ-020+ 後続案件への横展開 base 確立
- **優先順位**: **4 位 (R36-R38 atomic 採決推奨 / DEC-088 +089 +091 confirmed 後)**
- **採決ライン**: CEO + PM + Knowledge 3 者最低
- **賛成見込**: 3-0-0
- **依存**: DEC-088 + DEC-089 + DEC-091 全 confirmed 推奨

---

## §3 起案優先順位 spec (R34-R38 推奨 round)

| 優先順位 | DEC 候補 | 推奨 round | 採決ライン | 依存 DEC |
|---|---|---|---|---|
| 1 位 | DEC-088 (30day operational SOP) | R34 atomic | CEO + PM + Web-Ops | DEC-087 (達成) |
| 2 位 | DEC-089 (incident escalation runbook) | R35 atomic | CEO + Sec + Dev | DEC-088 |
| 3 位 | DEC-091 (KPI breach response SOP) | R36 atomic | CEO + Marketing + Dev | DEC-088 + DEC-089 |
| 4 位 | DEC-094 (retrospective KPT closeout) | R36-R38 atomic | CEO + PM + Knowledge | DEC-088 + DEC-089 + DEC-091 |

→ R34-R38 5 round で 4 件起案・採決を推奨 (DEC-090+092+093 既存 confirmed 継承 + DEC-087 R33 confirmed → DEC-088+089+091+094 = 計 53 → 54 → 55 → 56 confirmed 遷移想定)

---

## §4 各候補の連動 GTC + KPI 整合性 verify

| 候補 | GTC 連動 | KPI 連動 | 整合性 |
|---|---|---|---|
| DEC-088 | GTC-7 stage 3 production rollout / GTC-11 D-Day | 13 KPI baseline 全件 | OK |
| DEC-089 | GTC-11 D-Day immediate trigger | KPI-1 availability / KPI-3 latency p95 | OK |
| DEC-091 | GTC-7 stage 3 / GTC-8 mid-check | KPI-2 error rate / KPI-13 cost forecast | OK |
| DEC-094 | GTC-1〜11 全件 lineage | 13 KPI baseline lineage | OK |

→ 4 候補とも GTC + KPI 連動整合性確認完遂

---

## §5 確認事項

| 項目 | status |
|---|---|
| DEC-088-091 起案候補 spec 確立 | **完遂 (4 件)** |
| 既存 DEC-090+092 継続継承確認 | **完遂** |
| DEC-094 (DEC-092 候補から再採番) | **spec 確立 (番号衝突回避)** |
| 優先順位 1-4 位 spec | **完遂** |
| R34-R38 推奨 round 割振 | **完遂** |
| 採決ライン spec | **4 件全件確立** |
| GTC + KPI 整合性 verify | **OK** |
| Owner 拘束 | **0 分継承** |
| API call | **$0** |
| 副作用 | **0** |

---

## §6 結語

R33 軸 2 = **DEC-088-091 + DEC-094 起案候補 4 件 spec 確立 + R34-R38 優先順位策定完遂**。DEC-087 confirmed ⑤ post-confirm SOP trigger 起動を受けた post-launch operational SOP formalization 連鎖の base 確立。R34 atomic 採決対象 = **DEC-088 (30day operational SOP)** 推奨。Round 33 軸 2 完遂着地。
