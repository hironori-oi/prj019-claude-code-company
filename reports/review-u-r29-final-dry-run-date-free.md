# Review-U Round 29 — final dry-run date-free 化 spec（GTC-10 D-1 完遂直後即時実行 path）

**担当**: Review-U（PRJ-019 レビュー部署 / Round 29 担当）
**作成日時**: 2026-05-06
**対象**: 6/19 final dry-run 元 spec の date-free 化（「GTC-10 D-1 完遂直後即時実行」path に書換）
**前提**: Owner directive「**日付決め打ちなし / 完成次第即時 GO**」採用 / Review-T R28 final readiness review 着地継承
**形式**: 元 spec → date-free 補正版 spec（30 min 経路 / Owner 拘束 0 min / 副作用 0）

---

## §0. Executive Summary

| 項目 | 結論 |
|------|------|
| 元 spec | 6/19 04:00-04:30 JST（D-Day 5h 前 hard-coded）|
| 補正後 spec | **GTC-10 D-1 完遂直後即時実行**（date-free / round 内連続）|
| 所要 | 30 min（変化なし）|
| Owner 拘束 | 0 min（D-Day 当日 OWN-PRE-07 + CARD-C のみ別計算）|
| 副作用 | 0（read-only / API call 0）|
| カレンダー固定 | なし（OWN-PRE-07 timing window 08:25-08:35 + 09:00 公開 のみ固定）|
| 整合確証 | GTC-10 完遂確認 → GTC-11 採点 → 即時 D-Day Phase 1 起動 |

---

## §1. 元 spec → 補正後 spec 差分

### §1.1 元 spec（date hard-coded）

```
2026-06-19 04:00-04:30 JST: final dry-run 実行
- Web-Ops 担当
- 30 min 自動巡回
- D-Day 5h 前固定実行
- Owner: 不参加
```

### §1.2 補正後 spec（date-free）

```
GTC-10 D-1 完遂直後（OWN-PRE-03 + CARD-B 完遂時刻 = T0）:
  T0 + 0 min: GTC-10 全 GREEN 確認 → GTC-11 採点突入
  T0 + 0-15 min: GTC-11 採点 88/88 OK 確認（Review-X 担当 round の Review エージェント）
  T0 + 15-20 min: CEO ack（5 min CEO 単独）
  T0 + 20-50 min: final dry-run 実行（30 min / Web-Ops 自動巡回）
  T0 + 50 min 〜 D-Day 09:00 まで: idle（D-Day OWN-PRE-07 timing 厳守 windowまで wait）
```

**date-free 化要点**:
- T0（GTC-10 完遂時刻）はカレンダー固定なし
- 全工程は T0 起点 relative
- 唯一の hard-coded = D-Day OWN-PRE-07 window（08:25-08:35）+ 09:00 公開時刻

---

## §2. final dry-run 30 min 経路詳細（補正版）

### §2.1 段階 1: 自動巡回 startup（T0+20 〜 T0+22, 2 min）

| step | 内容 | 担当 |
|------|------|------|
| 1.1 | dashboard read（dashboard/active-projects.md / launch readiness）| Web-Ops 自動 |
| 1.2 | launch day v3.2 4 file integrity hash 確認 | Web-Ops 自動 |
| 1.3 | OWN-AUTO PoC 4 script PRODUCTION-READY 確認 | Web-Ops 自動 |
| 1.4 | OWN-PRE-01〜07 + CARD-A/B 状態 確認 | Web-Ops 自動 |

### §2.2 段階 2: 自動 spec verification（T0+22 〜 T0+35, 13 min）

| step | 内容 | 担当 |
|------|------|------|
| 2.1 | OWN-PRE-07 timing window 08:25-08:35 厳守 spec 再確認 | Web-Ops 自動 |
| 2.2 | CARD-C 公開最終確認 5 min spec 再確認 | Web-Ops 自動 |
| 2.3 | DNS TTL 短縮確認（OWN-PRE-03 完遂状態）| Web-Ops 自動 |
| 2.4 | Vercel env vars 投入確認（OWN-PRE-01/02/04 完遂状態）| Web-Ops 自動 |
| 2.5 | Sentry alert + Supabase RLS 確認（OWN-PRE-05/06 完遂状態）| Web-Ops 自動 |
| 2.6 | Supabase manual snapshot 取得 spec 確認（OWN-PRE-07 待機）| Web-Ops 自動 |

### §2.3 段階 3: 自動 risk check（T0+35 〜 T0+45, 10 min）

| step | 内容 | 担当 |
|------|------|------|
| 3.1 | rollback verification record 再確認 | Web-Ops 自動 |
| 3.2 | Sec baseline JSON 連続 round 確認 | Web-Ops 自動 |
| 3.3 | harness PASS / openclaw 394 安定確認 | Web-Ops 自動 |
| 3.4 | trigger 5/5 全 GREEN 再確認 | Web-Ops 自動 |
| 3.5 | DEC DRAFT 件数 確認（DEC-082+083 残）| Web-Ops 自動 |

### §2.4 段階 4: 自動 final lock 宣言（T0+45 〜 T0+50, 5 min）

| step | 内容 | 担当 |
|------|------|------|
| 4.1 | final dry-run record 起票（30 min 自動）| Web-Ops 自動 |
| 4.2 | 6/19 confidence 98%+ 達成宣言 | Web-Ops 自動 |
| 4.3 | D-Day Phase 1 起動 GO 信号 set | Web-Ops 自動 |
| 4.4 | Owner 拘束累計 ≤83 min lock 維持確認 | Web-Ops 自動 |
| 4.5 | dry-run 完遂 → idle wait（D-Day 08:25 まで）| Web-Ops 自動 |

---

## §3. Owner 拘束 0 min 確証

| 項目 | Owner 拘束 |
|------|-----------|
| GTC-10 D-1 完遂（OWN-PRE-03 10 min + CARD-B 5 min）| 15 min（D-1 既存計算）|
| GTC-11 採点 88/88（Review エージェント自動）| 0 min |
| CEO ack（5 min CEO 単独）| 5 min（CEO 単独 / Owner 不参加）|
| final dry-run 30 min（Web-Ops 自動）| 0 min |
| idle wait → D-Day 08:25 | 0 min |
| OWN-PRE-07 + CARD-C（D-Day 当日）| 10 min |
| **合計** | **30 min（既存 OWN-PRE 累計内 / final dry-run 増分 0 min）** |

**確証**: final dry-run は **Owner 拘束 0 min**（Web-Ops 自動完遂）。既存 Owner 拘束累計 ≤83 min 内に収まる。

---

## §4. integrity 維持確認

| 項目 | 結果 |
|------|------|
| launch day v3.2 4 file integrity（29 round 連続）| 維持（Read のみ）|
| 既存 DEC-019-001-079 absolute 無改変 | 維持 |
| OWN-PRE-07 timing window 08:25-08:35 厳守 | 維持（hard-coded 維持）|
| 09:00 JST 公開時刻 | 維持（hard-coded 維持）|
| OWN-PRE-03 + CARD-B 完遂順序 | 維持 |
| CARD-D 公開後 24h 監視 | 維持 |
| 副作用 0 / 絵文字 0 / API $0 | 維持 |

---

## §5. 即時 GO 方針 risk 評価（7 軸 LOW risk 確証）

| risk 軸 | 元 spec（date hard-coded）| 補正版（date-free）| 軽減度 |
|---------|--------------------------|--------------------|-------|
| 1. mid-check スキップ可能性 | 中（時刻固定で skip リスク）| LOW（GTC-1〜10 全 GREEN 必須）| 改善 |
| 2. Owner 急ぎ依頼疲労 | 低 | LOW（拘束累計 ≤83 min 不変）| 維持 |
| 3. DEC 採決圧縮 | 中（時刻調整 risk）| LOW（DEC block 単位採決 timeline 内）| 改善 |
| 4. stage 実機実行同日内 | 中（OWN-PRE 集中 risk）| LOW（OWN-PRE-07 + CARD-C のみ同日）| 改善 |
| 5. rollback 経路当日 trigger | 中（時刻固定 trigger）| LOW（rollback verification 完遂）| 改善 |
| 6. Marketing 即時化 | 低 | LOW（D-Day record template 完遂）| 維持 |
| 7. W6 100pt 圧縮 | 中（時刻調整 risk）| LOW（R29 で 100pt 達成、圧縮なし）| 改善 |

**結論**: 7 軸全 LOW risk 確証。即時 GO 方針採用妥当。

---

## §6. 補正版 spec 採用根拠 6 軸

| 根拠 | 内容 |
|------|------|
| 根拠 1 | Owner directive 採用（「日付決め打ちなし / 完成次第即時 GO」）|
| 根拠 2 | 時刻 hard-coded → relative timing で柔軟性 +∞ |
| 根拠 3 | mid-check 必須化（GTC-1〜10 全 GREEN 確認）で skip risk 0 |
| 根拠 4 | Owner 拘束 0 min 維持（既存累計 ≤83 min 内）|
| 根拠 5 | 整合性維持（OWN-PRE-07 + 09:00 公開 のみ hard-coded）|
| 根拠 6 | 副作用 0 / API $0 / 絵文字 0 維持 |

---

## §7. 結論

| 項目 | 結論 |
|------|------|
| date-free 化 spec | **完成**（30 min 経路 / T0 起点 relative）|
| Owner 拘束 | **0 min**（final dry-run 自動完遂 / CEO ack 5 min 別計算）|
| 整合確証 | GTC-10 完遂 → GTC-11 採点 → 即時 D-Day Phase 1 起動 |
| risk 7 軸 | **全 LOW**（7/7 軸 LOW risk）|
| 副作用 | 0 |

**Review-U Round 29 / final dry-run date-free 化 spec 完遂。**

---

**Review-U Round 29 / final dry-run date-free 化 — 完**
