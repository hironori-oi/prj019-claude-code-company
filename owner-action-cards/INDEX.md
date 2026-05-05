# INDEX: Owner Action Cards (PRJ-019 配下統合一覧 20 件)

**対象**: Owner（hironori555@gmail.com）
**用途**: PRJ-019 Open Claw "Clawbridge"（公開 2026-06-19 09:00 JST）に向けた **20 件 owner action card 一望** lookup
**所有者**: Web-Ops 部門
**バージョン**: v2.0（Round 28 / Web-Ops-O 起票 / 19 件 → **20 件物理改変**）
**親**: `../../COMPANY-WEBSITE/runbooks/launch-pre-ops-checklist.md` §7 / `../../COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md` (CARD A 7 sub-card 派生先)

---

## 0. 利用方法

本 INDEX は Owner が「次に何をやるか」を 30 秒で判別する PRJ-019 配下統合 entry。各 card の **要約 + 期限 + 所要 + 状態** を 1 表で表示。詳細手順は各 card ファイル参照。

R27 (Web-Ops-N) で OWN-W5-PROD-ACK card を物理化 (19 件 → 20 件)、R28 (Web-Ops-O) で本 INDEX を物理改変して 20 件統合化。

---

## 1. 20 件 owner action card lookup 表

| # | ID | title | 期限 | 所要 | card ファイル | 状態 |
|---|---|---|---|---|---|---|
| 1 | OWN-PRE-01 | Vercel Env GA4 + Sentry DSN 投入 | 2026-06-12 | 10 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-01-vercel-env-ga4-sentry.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-01-vercel-env-ga4-sentry.md) | TODO |
| 2 | OWN-PRE-02 | Vercel Env Supabase 3 key 投入 | 2026-06-12 | 15 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-02-vercel-env-supabase.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-02-vercel-env-supabase.md) | TODO |
| 3 | OWN-PRE-03 | DNS TTL 短縮 300 秒 | 2026-06-18 17:00 | 10 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-03-dns-ttl-shorten.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-03-dns-ttl-shorten.md) | TODO |
| 4 | OWN-PRE-04 | SLACK_WEBHOOK_URL + CRON_SECRET 投入 | 2026-06-12 | 15 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-04-vercel-env-slack-cron.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-04-vercel-env-slack-cron.md) | TODO |
| 5 | OWN-PRE-05 | Sentry alert ルール有効化 | 2026-06-15 | 10 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-05-sentry-alert.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-05-sentry-alert.md) | TODO |
| 6 | OWN-PRE-06 | Supabase RLS 全 table 確認 | 2026-06-15 | 15 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-06-supabase-rls-check.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-06-supabase-rls-check.md) | TODO |
| 7 | OWN-PRE-07 | Supabase manual snapshot 取得 | 2026-06-19 08:30 | 5 min | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-07-supabase-snapshot.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-07-supabase-snapshot.md) | TODO |
| 8 | CARD-A | 公開前運用設定 (OWN-PRE-01-07 親) | 2026-06-19 08:30 | (合計 80 min) | (CARD A 親) | TODO |
| 9 | CARD-B | DNS 切替 announce | 2026-06-18 17:00 | 5 min | (CARD B 親) | TODO |
| 10 | CARD-C | 6/19 公開最終確認 | 2026-06-19 08:55 | 5 min | (CARD C 親) | TODO |
| 11 | CARD-D | 6/19 公開後 24h 監視 | 2026-06-20 09:00 | (24h) | (CARD D 親) | TODO |
| 12 | OWN-AUTO | 自動投入 spec 全体 | 2026-06-12 | (前提 prep) | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-AUTO-spec-2026-06-12.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-AUTO-spec-2026-06-12.md) | TODO |
| 13 | OWN-AUTO-01 | 4 script env vars 自動投入 | 2026-06-12 | 5 min | (PoC 4 script #1) | TODO |
| 14 | OWN-AUTO-02 | 4 script DNS TTL 確認 | 2026-06-12 | 5 min | (PoC 4 script #2) | TODO |
| 15 | OWN-AUTO-04 | 4 script Slack webhook + cron | 2026-06-12 | 5 min | (PoC 4 script #3) | TODO |
| 16 | OWN-AUTO-06 | 4 script Supabase RLS | 2026-06-12 | 5 min | (PoC 4 script #4) | TODO |
| 17 | OWN-PRE-DRY-RUN | OWN-PRE-01-07 dry-run 一括 | 2026-06-12 | (実 OWN-PRE 等価) | [../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-DRY-RUN-2026-06-12.md](../../COMPANY-WEBSITE/runbooks/owner-action-cards/OWN-PRE-DRY-RUN-2026-06-12.md) | TODO |
| 18 | OWN-OG-PROD-ACK | OG step 12 production rollout ack | 2026-06-12 14:55 | 1 min | [own-og-prod-ack.md](own-og-prod-ack.md) | TODO |
| 19 | OWN-PRE-PHASE2-W5 | Phase 2 W5 stage 1 着手直前 ack | 2026-06-03 08:55 | 1 min | [own-pre-phase2-w5.md](own-pre-phase2-w5.md) | TODO |
| **20** | **OWN-W5-PROD-ACK** | **Phase 2 W5 stage 3 production deploy ack** | **2026-06-04 09:00 (任意 6/4-6/9)** | **1 min** | **[own-w5-prod-ack.md](own-w5-prod-ack.md)** | **TODO (R28 物理化)** |

**合計所要**: 83 min (R27 82 min + OWN-W5-PROD-ACK 1 min)

**完了 marker**: 20 件全て `状態` 列が DONE になれば 6/19 launch day readiness 完成。

---

## 2. 期限 timeline (Owner 一望 / R28 補正版)

```
2026-06-03 (D-16, 火 stage 1+2) 08:55 JST まで:
  - OWN-PRE-PHASE2-W5 (1 min)  [19 件目 / R25]
  ── 合計 1 min ──

2026-06-04 (D-15, 水 stage 3 / 任意 6/4-6/9) 09:00 JST まで:
  - OWN-W5-PROD-ACK (1 min)  [20 件目 / R28 物理化]
  ── 合計 1 min ──

2026-06-12 (D-7, 金) 14:55 JST まで:
  - OWN-PRE-01 (10 min)
  - OWN-PRE-02 (15 min)
  - OWN-PRE-04 (15 min)
  - OWN-AUTO-01/02/04/06 (4 script 20 min, 88% 圧縮 = 手動相当 60 min → 20 min)
  - OWN-OG-PROD-ACK (1 min)  [18 件目 / R24]
  ── 合計 41-61 min (手動 / OWN-AUTO 自動 lever) ──

2026-06-15 (D-4, 月) 23:59 JST まで:
  - OWN-PRE-05 (10 min)
  - OWN-PRE-06 (15 min)
  ── 合計 25 min ──

2026-06-18 (D-1, 木) 17:00 JST まで:
  - OWN-PRE-03 (10 min)
  - CARD-B DNS 切替 announce (5 min)
  ── 合計 15 min ──

2026-06-19 (D-Day, 金) 08:30-08:55 JST:
  - OWN-PRE-07 (5 min, 厳守 window 08:25-08:35)
  - CARD-C 公開最終確認 (5 min, 08:55)
  ── 合計 10 min ──

2026-06-19 (D-Day, 金) 09:00 JST 以降:
  - CARD-D 公開後 24h 監視 (24h)
  ── 合計 24h ──
```

推奨実行順:
1. **6/3 朝**: OWN-PRE-PHASE2-W5 (1 min, Phase 2 W5 stage 1 着手直前)
2. **6/4 朝**: OWN-W5-PROD-ACK (1 min, stage 3 production deploy 直前) ← R28 追加
3. **6/12 D-7 14:30-17:30 (3h)**: OWN-PRE-01-04 + OWN-AUTO 4 script + OWN-OG-PROD-ACK + step 12 + smoke
4. **6/15 D-4**: OWN-PRE-05 + OWN-PRE-06 (25 min)
5. **6/18 D-1 17:00 まで**: OWN-PRE-03 + CARD-B (15 min)
6. **6/19 D-Day 08:30-08:55**: OWN-PRE-07 + CARD-C (10 min)
7. **6/19 D-Day 09:00**: 公開 → CARD-D 24h 監視

---

## 3. 関連 artifact (R26 + R27 + R28 反映 / 26 件 → 32 件追加 / 計 32 件)

R25 v2.2 正式版 §3 関連 artifact 26 件 (R23 baseline 7 + R24 4 + R25 5 + 旧 10 = 26 件) に **R26 + R27 + R28 起票分 6 件** を追加して 32 件統合:

### 3.1 R23 baseline 7 件

1. `../../COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.0.md` (R22)
2. `../../COMPANY-WEBSITE/runbooks/launch-day-web-ops-role-2026-06-19-v2.1-delta.md` (R23)
3. `../../COMPANY-WEBSITE/runbooks/og-step-12-production-deploy-dryrun-procedure.md` (R23)
4. `../../COMPANY-WEBSITE/runbooks/og-src-production-owner-ack-package.md` (R23)
5. `../../COMPANY-WEBSITE/runbooks/og-visual-regression-baseline-dryrun-record.md` (R23)
6. OWN-AUTO PoC 4 script (own-auto-{01,02,04,06}.sh + procedure) (R23)
7. OWN-PRE-01〜07 + OWN-PRE-DRY-RUN 8 sub-card (R21+R22)

### 3.2 R24 4 件

8. R24 OWN-AUTO 4 script dry-run record (453 行)
9. R24 step 12 web-ops 視点 dry-run record (379 行)
10. R24 OWN-OG-PROD-ACK card (168 行)
11. R24 launch day v2.2-delta-candidate (260 行)

### 3.3 R25 5 件

12. R25 OG src production verification record (410 行)
13. R25 Phase 2 W5 deploy 計画 (320 行)
14. R25 OWN-PRE-PHASE2-W5 card (175 行)
15. R25 launch day v2.2 正式版 (310 行)
16. R25 summary (240 行)

### 3.4 R26 3 件 (R28 追加)

17. R26 stage 1 deploy ready (240 行)
18. R26 stage 2 deploy ready (220 行)
19. R26 rollback verification (220 行)

### 3.5 R27 7 件 (R28 追加)

20. R27 stage 1+2 simulated actual record (220 行)
21. R27 stage 3 simulated actual record (220 行)
22. R27 deviation analysis (200 行)
23. R27 rollback dry-run record (240 行)
24. R27 N/A 10 cell 詳細化 (195 行)
25. R27 OWN-W5-PROD-ACK card (175 行) ← 20 件目 owner action card
26. R27 summary (260 行)

### 3.6 R28 6 件 (R28 自身)

27. R28 stage 1+2 actual prep (約 320 行)
28. R28 stage 3 actual prep (約 330 行)
29. R28 rollback real-exec prep (約 350 行)
30. R28 G12-G13 N/A clarification (約 320 行)
31. R28 D-7 real-exec prep (約 360 行)
32. R28 INDEX 物理改変 (本 INDEX, 20 件統合)

**合計 32 件 (R23 7 + R24 4 + R25 5 + R26 3 + R27 7 + R28 6 = 32 件)**

---

## 4. 進捗トラッキング

各 card 完了時に Owner は Slack `#prj-019-launch` に以下形式で投稿:

```
{ID} done HH:MM
```

例: `OWN-PRE-01 done 14:30` / `OWN-W5-PROD-ACK done 09:00`

Web-Ops は本 INDEX の `状態` 列を `TODO → DONE` に更新 (PR で 1 行修正)。

20 件全 DONE = 6/19 launch day readiness 完成。

---

## 5. 関連 INDEX (派生関係)

- 親 INDEX (CARD A 7 sub-card): `../../COMPANY-WEBSITE/runbooks/owner-action-cards/INDEX.md` (R21 第 2 波 / Web-Ops-H 起票 / 7 sub-card 一望)
- 本 INDEX (PRJ-019 配下統合 20 件): `INDEX.md` (R28 第 2 波 / Web-Ops-O 起票)
- launch readiness: `../../COMPANY-WEBSITE/runbooks/launch-readiness-consolidation-2026-06-19.md`

---

## 6. 関連 DEC

- DEC-019-054 (production deploy gate)
- DEC-019-062 (環境変数投入運用)
- DEC-019-033 (background dispatch SOP)
- DEC-019-075 (Phase 1 完遂宣言起案)
- DEC-019-077 DRAFT (Owner 拘束 76% 圧縮 default 化)
- DEC-019-079 候補 (Phase 2 完遂議決起案)

---

## 7. R28 物理改変差分

### 7.1 改変前 (R27 末 / 19 件 / INDEX 物理 0 件 = 親 INDEX 7 件のみ)

- 親 INDEX (R21): 7 sub-card (OWN-PRE-01〜07) のみ
- PRJ-019 配下 INDEX: 未起票

### 7.2 改変後 (R28 / 20 件 / 本 INDEX 物理化)

- 親 INDEX (R21): 7 sub-card (OWN-PRE-01〜07) ← 維持
- PRJ-019 配下 INDEX (R28): 20 件統合 (OWN-PRE-01〜07 + CARD-A〜D + OWN-AUTO + OWN-AUTO 4 script + OWN-PRE-DRY-RUN + OWN-OG-PROD-ACK + OWN-PRE-PHASE2-W5 + **OWN-W5-PROD-ACK 20 件目**)

### 7.3 改変差分

| 軸 | 改変前 | 改変後 |
|---|---|---|
| INDEX 物理化 | 1 件 (親 INDEX のみ) | **2 件 (親 INDEX + PRJ-019 INDEX)** |
| owner action card 一望数 | 7 件 (親 INDEX) | **20 件 (PRJ-019 INDEX)** |
| 関連 artifact §3 | 26 件 (R25 v2.2 正式版) | **32 件 (R26 3 + R27 7 + R28 6 追加)** |
| 改変方法 | (R27 まで未改変) | **新規物理化 (R28)** |

---

**最終更新**: 2026-05-06 (Round 28 / Web-Ops-O 起票 / 19 件 → 20 件物理改変 + 関連 artifact 26 → 32 件追加)
**次回見直し**: 2026-06-03 (OWN-PRE-PHASE2-W5 完了確認時) / 2026-06-04 (OWN-W5-PROD-ACK 完了確認時) / 2026-06-12 (D-7 OWN-PRE-01/02/04 + OWN-OG-PROD-ACK 完了確認時) / 2026-06-15 (D-4 OWN-PRE-05/06 完了確認時) / 2026-06-19 (D-Day OWN-PRE-07 完了で本 INDEX を「保存版」化)

EOF
