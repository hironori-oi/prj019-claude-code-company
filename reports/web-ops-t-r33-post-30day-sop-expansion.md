# Web-Ops-T R33: post-30day operational SOP expansion (30→60→90day 段階 spec)

## 0. メタ情報

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 33 (9 並列 軸 3)
- 担当: Web-Ops-T
- 出力種別: post-30day operational SOP expansion (R32 17 trigger active 化 → 60day / 90day / steady-state 段階拡張)
- 制約: date-free / T0''' 基点 / 副作用 0 / Owner 拘束 0 分 / 絵文字 0 / R32 既存 SOP 無改変保持
- 継承: R32 Web-Ops-S 17 trigger active 化 (24h:7 / 7d:6 / 30d:4) / GTC-11 D-Day record 84/84 PASS

## 1. 拡張スコープ

R32 active 化済み 17 trigger を post-30day 期間に向けて段階的に拡張する spec を策定。R32 既存 SOP は無改変保持、本書は append-only な追加 spec。

### 1.1 段階定義

| 段階 | 期間 (T0''' 基点) | 性質 | 主目的 |
|------|------------------|------|--------|
| Phase α (active) | T0''' ～ +30d | hot monitoring | 17 trigger active / launch 直後安定化 |
| Phase β (本書) | T0'''+30d ～ +60d | warm monitoring | 週次 KPI レビュー / cool-down 段階 |
| Phase γ (本書) | T0'''+60d ～ +90d | stabilization | alert threshold 緩和判定 |
| Phase δ (本書) | T0'''+90d 以降 | steady-state | 月次 retrospective + KPT 反映 |

R32 spec の Phase α は無改変保持、Phase β/γ/δ を本書で append。

## 2. Phase β: day 30-60 monitoring routine (週次 KPI レビュー 4 経路)

### 2.1 経路 1: KPI 5 軸週次サマリ
- 周期: 7d sliding window (day 30→37→44→51→58 計 5 回)
- 入力: R32 24h trigger 7 件 + 7d trigger 6 件の累計値
- 出力: `dashboard/active-projects.md` PRJ-019 行 weekly-trend 列追記
- threshold: 任意 1 軸が baseline -10% 以上低下で warm-alert 起票
- 担当: Web-Ops 部門 sub-rotation
- 対 R32 差分: alert routing severity を warn → info に降格 (false-positive 抑制)

### 2.2 経路 2: cost trend forecast (週次)
- 周期: 7d
- 入力: 7d cumulative cost + 直前 4 週移動平均
- threshold: 4 週 MA が $11/週 ($44/月想定) を超過で月次想定 $50 突破リスク warn
- 出力: CEO 経由 Owner 月次サマリ (週次 update)
- 関連: B1 KPI / R32 T-7d-3 拡張

### 2.3 経路 3: regression detection 緩和段階
- 周期: 7d
- 入力: 7d KPI 5 軸 baseline 比較
- threshold: R32 spec -20% → Phase β -15% (緩和段階前の早期検知)
- 出力: dev 部門 hotfix 検討 epic
- 対 R32 差分: 早期検知重視のため threshold を一時的に厳格化

### 2.4 経路 4: user feedback aggregation 拡張
- 周期: 7d
- 入力: 7d 受信フィードバック + Phase α 累計フィードバック
- threshold: 同一カテゴリ 3 件以上 (R32 spec 5 件から厳格化) で priority issue 起票
- 出力: PM 部門 backlog 起票 + Marketing 部門連携
- 関連: UX 改善 / Phase β 期間中の声を拾いやすく

## 3. Phase γ: day 60-90 stabilization phase (alert threshold 緩和判定 spec)

### 3.1 緩和判定基準

| 観点 | 緩和条件 | 緩和後 threshold | 関連 trigger |
|------|----------|------------------|--------------|
| latency p99 | Phase α+β 60d 累計 breach 0 件 | 800ms → 900ms | T-24h-1 |
| 5xx ratio | Phase α+β 60d 累計 breach ≤ 1 件 | 0.5% → 0.7% | T-24h-2 |
| uptime | Phase α+β 60d 累計 breach 0 件 | 99.9% 維持 (緩和なし) | T-24h-3 |
| cost 24h burst | Phase α+β 60d $10 burst breach 0 件 | $10 → $12 | T-24h-4 |
| DB pool utilization | Phase α+β 60d breach 0 件 | 70% → 75% | T-24h-7 |

### 3.2 緩和判定プロセス
- 判定タイミング: T0'''+60d
- 入力: Phase α+β 60d incident log + KPI 5 軸 PASS 率
- 出力: `organization/knowledge/playbooks/post-launch-threshold-relaxation.md` (R34 以降生成想定)
- 承認: CEO + Web-Ops 部門共同判断 (Owner 起票不要 / 拘束 0 分原則継承)
- 副作用: alert noise 削減、on-call 負担軽減

### 3.3 緩和後 60-90d 期間の monitoring
- 17 trigger は active 維持
- threshold のみ緩和、runbook / escalation matrix は無改変
- 緩和後 30d 期間中に再度 breach 発生時は即時 Phase α threshold へ rollback

## 4. Phase δ: day 90+ steady-state SOP (月次 retrospective + KPT 反映)

### 4.1 月次 retrospective routine
- 周期: 30d (T0'''+90d 以降)
- 入力: 直近 30d 17 trigger 発火 log + KPI 5 軸 trend + cost actual
- 出力: `organization/knowledge/retrospectives/prj-019-month-N.md` (R32 T-30d-1 spec 継承拡張)
- 担当: Web-Ops 部門 + PM 部門 共催
- 関連: ナレッジ蓄積ルール (CLAUDE.md §6 連動)

### 4.2 KPT 反映 routine
- 周期: 30d
- 入力: 月次 retrospective KPT
- 出力: `organization/knowledge/prj-019-lessons-learned.md` (T-30d-3 拡張) に append-only 反映
- 関連: 再利用可能な学びは patterns / decisions / pitfalls 各サブディレクトリへ自動分類 (CLAUDE.md §6)

### 4.3 steady-state alert routing
- Slack info severity: 月次サマリのみ
- PagerDuty warn severity: threshold breach 即時
- SMTP critical severity: 5xx ratio 0.7% 突破時 / uptime 99.9% 割れ時のみ
- on-call rotation: dev-lead 平日 / Web-Ops 週末継承

### 4.4 steady-state DEC closeout
- T0'''+90d 時点で Phase α+β+γ 90d 累計 incident 0 件 + KPI 5 軸 8/8 PASS 維持の場合
- DEC-087 (post-launch retrospective 議決) を「不要」として正式 closeout 提案 (R32 T-30d-4 拡張)
- DEC closeout は CEO + PM-Z 共同議決、Owner 拘束 0 分

## 5. 段階移行チェックリスト

| 移行 | チェック項目 | 担当 |
|------|--------------|------|
| α → β (T0'''+30d) | 17 trigger 30d 累計 breach ≤ 2 件 / KPI 5 軸 8/8 PASS 維持 | Web-Ops-T |
| β → γ (T0'''+60d) | §3.1 5 観点緩和条件成立 / weekly review 4 経路完遂 | Web-Ops 部門 |
| γ → δ (T0'''+90d) | 緩和後 30d breach 0 件 / 月次 retrospective ready | Web-Ops + PM |

## 6. R32 SOP 無改変保持確認

- R32 web-ops-s-r32-monitoring-sop-active.md 191 行: 全行無改変
- R32 17 trigger active 化: 維持
- R32 alert routing 3 severity: 維持
- 本書は Phase β/γ/δ を append-only で追加するのみ

## 7. 副作用 0 確認

- 既存 absolute 4 file 無改変
- R32 SOP file 無改変保持
- 物理 deploy 0 件 (spec 文書のみ)
- API call $0
- date-free 厳守 (T0''' 基点 +30d/+60d/+90d 相対表記)

## 8. R34 引継

- Phase β/γ/δ spec の active 化判断 (T0'''+30d 時点判定)
- §4.2 KPT 反映 routine の自動連鎖機構実装 (W7-D 連動候補)
- §3.2 threshold-relaxation playbook 生成
- §4.4 DEC-087 closeout 動議 (条件成立時)

## 9. 完遂宣言

R33 Web-Ops-T Task 1 (post-30day operational SOP expansion 30→60→90day 段階 spec) 完遂。Phase β/γ/δ spec 確立 / 週次 KPI レビュー 4 経路確立 / alert threshold 緩和判定 spec 確立 / steady-state SOP 確立。R32 SOP 無改変保持。
