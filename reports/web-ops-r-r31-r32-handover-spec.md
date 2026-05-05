# Web-Ops-R R31 → R32 Handover Spec

**作成日**: 2026-05-06 (PRJ-019 Round 31)
**target**: Round 32 へ引継ぐ post-launch monitoring SOP + INDEX 拡張 + 残タスク

---

## 1. R32 引継 3 項目 (top-level)

| # | 項目 | 内容 |
|---|------|------|
| 1 | post-launch monitoring SOP (W7-B 連動) | rollback Stage 4 spec を W7-B SOP として active 化 |
| 2 | INDEX 関連 artifact 32 → 38 件想定 | R31 で 6 件 (本 file 含む) 追加、R32 で 6 件追加想定で 38 件 |
| 3 | GTC-11 actual exec readiness 100% 維持 | D-Day GO reply 受領待ち状態を継続 |

---

## 2. Post-Launch Monitoring SOP (W7-B 連動)

### 2.1 SOP scope

| period | active monitoring 内容 |
|--------|------------------------|
| 24h post-GA | trigger 7 種 strict / Sec/QA/Dev sign 集約 |
| 7d | trigger 6 種 medium / weekly retrospective |
| 30d | trigger 4 種 low / monthly post-mortem |
| 30d 〜 | normal automatic monitoring |

### 2.2 SOP responsibilities

| role | responsibility |
|------|----------------|
| Web-Ops | dashboard 5 軸 monitoring + trigger 受信 |
| Dev | rollback 経路 1-4 起動責任 |
| Sec | security incident escalation |
| QA | functional regression detection |
| Marketing | post-mortem template 連動 + lessons learned 蓄積 |
| CEO | escalation 集約 + Owner 通知 |

### 2.3 SOP artifacts (R32 で active 化)

- `web-ops-r-r31-rollback-stage-4-spec.md` (本 R31 出力)
- `web-ops-r-r31-gtc-11-exec-runsheet.md` (本 R31 出力)
- `gtc-11-immediate-trigger.md` (Owner card)
- 想定 R32 追加: `web-ops-s-r32-post-launch-sop-active.md`
- 想定 R32 追加: `web-ops-s-r32-trigger-handler-runbook.md`

---

## 3. INDEX 関連 artifact 32 → 38 件想定

### 3.1 R30 → R31 で +6 件 (本 R31 で追加分)

| # | id | file | location |
|---|-----|------|----------|
| 32+1 | RB-S4-spec | web-ops-r-r31-rollback-stage-4-spec.md | reports/ |
| 32+2 | GTC-11-exec | web-ops-r-r31-gtc-11-exec-runsheet.md | reports/ |
| 32+3 | GA-prog-actual | web-ops-r-r31-ga-progression-actual.md | reports/ |
| 32+4 | OWN-immed-trig | gtc-11-immediate-trigger.md | owner-action-cards/ |
| 32+5 | R31-summary | web-ops-r-r31-summary.md | reports/ |
| 32+6 | R31-handover | web-ops-r-r31-r32-handover-spec.md (本 file) | reports/ |

**R31 終端で INDEX entries: 32 + 6 = 38 件**

### 3.2 R32 想定 +6 件 (handover)

| # | id (想定) | 内容 |
|---|------------|------|
| R32+1 | post-launch SOP active | W7-B 起動 record |
| R32+2 | trigger handler runbook | trigger 7+6+4 種 handler |
| R32+3 | post-mortem template instance | Marketing-W template 適用 |
| R32+4 | KPI dashboard public mode | 公開可能 view spec |
| R32+5 | INDEX-v17 整理 | 200+ entries 想定 |
| R32+6 | R32 summary | round closure |

R32 終端で INDEX 38 → 44 件 (本 spec 範囲外、R32 で確定)

---

## 4. GTC-11 actual exec readiness 維持条件

| 条件 | 状態 (R31 終端) |
|------|------------------|
| canary writer 注入 | active |
| dispatcher 注入 | active |
| 7 phase 84 項目 spec | confirmed |
| KPI 5 軸 baseline (simulated) | captured |
| abort gate 4 種 armed | armed (spec) |
| manual gate 5 件 spec | confirmed |
| Owner card 統合 (S-1〜5) | confirmed |
| rollback Stage 4 spec | confirmed |
| post-mortem hook (Marketing-W) | linked |

**readiness 100%** = 全 9 条件 confirmed / R32 起動可

---

## 5. R32 で必要なアクション (top-level)

| # | アクション | actor | priority |
|---|------------|-------|----------|
| A1 | W7-B SOP active 化 | Web-Ops + CEO | high |
| A2 | trigger handler runbook 物理化 | Web-Ops + Dev | high |
| A3 | INDEX-v17 整理 | Secretary + Web-Ops | medium |
| A4 | post-mortem template instance 準備 | Marketing | medium |
| A5 | dashboard public mode design | Web-Ops | low |
| A6 | R32 summary + closure | Web-Ops | low |

---

## 6. R31 → R32 dependency 図

```
R30 GTC-7 stage 3 GREEN
   ↓
R31 GTC-11 actual exec spec + GA progression simulated + Stage 4 rollback + Owner card
   ↓
R32 W7-B active + trigger handler + INDEX-v17 + post-mortem instance
   ↓
[D-Day GO reply 受領待ち, 任意 timing で GTC-11 actual 発火]
   ↓
post-GA 24h/7d/30d monitoring (W7-B SOP)
```

---

## 7. 副作用 0 / 物理 deploy 0 / $0 維持

R32 においても下記を継承:
- canary writer + dispatcher 注入で実 API 0 件
- 物理 deploy は D-Day GO reply 受領時のみ
- API call $0 維持 (recording 経由)
- Owner 拘束 0 分 (実拘束は Owner card S-1〜5 累計 7-10 min のみ、これは GO reply 起動時)

---

(終端)
