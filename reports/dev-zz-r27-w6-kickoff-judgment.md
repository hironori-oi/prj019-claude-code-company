# Dev-ZZ Round 27 — Phase 2 W6 第 1 弾 W6-A 物理実装着手判断

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-ZZ
位置付け: W6-A spec 95+ pt 到達後の物理実装着手判断。R27 着手 / R28 着手 / R30 着手 / その他の 4 path 比較 + 推奨判定。
版: v1.0
連動 DEC: DEC-019-006 / 041 / 049 / 062 / 074-079 / 080（DRAFT）

---

## §0 サマリ（CEO 100 字）

W6-A 物理実装着手判断 = **R28 着手 GO 条件付推奨**（DEC-080 採決完遂を前提）。R27 着手は DEC-080 採決前制約により不可（spec 段階厳守 only）/ R30 着手は fallback / R28 path 採用で 6/19 buffer 17-24 日確保。本 round では物理実装着手せず spec 草案 + dry-run 段階で完結。

---

## §1 4 path 比較

### 1.1 R27 着手（本 round 着手）

| 観点 | 詳細 |
|---|---|
| 前提 | 本 round 内で W6-A 物理化開始 |
| 制約 | DEC-080 採決前 = 物理実装 0 件厳守 |
| 判定 | **不可**（Owner directive「物理実装は spec 草案 + dry-run 段階まで」厳守） |
| 推奨度 | **不可** |

→ Owner directive 「DEC-080 採決前なので物理実装は spec 草案 + dry-run 段階まで（test 実装は次 round 以降）」に明示違反。R27 着手は **絶対不可**。

### 1.2 R28 着手（前倒し / 推奨）

| 観点 | 詳細 |
|---|---|
| 前提 | DEC-080 採決完遂見込（5/26 統合採決） |
| 着手日 | 5/26-6/2（R28 dispatch 内） |
| 担当 | Dev-CCC R28 想定 |
| 完遂見込 | R28 完遂時 / harness 858-863 PASS |
| 6/19 buffer | 17-24 日 |
| readiness pt 必要値 | 95+ pt（本 round 着地で 96/100 達成 = 充足） |
| risk | 低（DEC-080 採決連動 only） |
| 推奨度 | **高（採用推奨）** |

### 1.3 R30 着手（標準 / fallback）

| 観点 | 詳細 |
|---|---|
| 前提 | DEC-080 採決遅延 / R29 で W5 stabilization 集中 |
| 着手日 | 6/9-6/16（R30 dispatch 内） |
| 担当 | Dev-DDD R30 想定 |
| 完遂見込 | R30 完遂時 / harness 858-863 PASS |
| 6/19 buffer | 3-10 日 |
| readiness pt 必要値 | 100/100（R29 完遂時 必達） |
| risk | 中（buffer 縮小 / 6/19 当日 W6 完遂しない可能性） |
| 推奨度 | **中（fallback）** |

### 1.4 その他（W6 着手スキップ / 6/19 後着手）

| 観点 | 詳細 |
|---|---|
| 前提 | 6/19 公開後の stabilization 期間で着手 |
| 着手日 | 6/20+ |
| 完遂見込 | 公開後 R31+ |
| risk | 高（公開当日 anomaly 対応物理 test 化なしで突入） |
| 推奨度 | **低（非推奨）** |

→ Operational hardening は public launch 前の **必須担保** であり、6/19 後着手は **採用しない**。

---

## §2 着手判断 = **R28 着手 GO 条件付推奨**

### 2.1 推奨根拠 7 件

1. **W6-A spec readiness 96/100**（本 round 着地で 95+ pt 到達 / R26 87 → R27 96）
2. **R28 dispatch 想定 担当 Dev-CCC** 確定（spec 詳細化 + Mock 6 種詳細で物理化レベル準備完備）
3. **DEC-080 採決連動**（5/26 統合採決完遂見込 / 採決後 R28 dispatch 内で物理化開始可能）
4. **6/19 buffer 17-24 日確保**（R28 path / R30 path 比較で R28 path 大幅優位）
5. **W6 第 2 弾余地確保**（R28 で W6-A 完遂 → R29-R30 で W6-B（performance baseline）着手可能）
6. **harness 858-863 PASS 寄与見込**（W6-A 必須 8 tests + optional +4 / 累計 870-880 達成見込）
7. **risk 低**（Mock 6 種で API call $0 / 子 process 0 / 副作用 0 全担保 + Dev-VV R26 pattern 継承）

### 2.2 R28 着手 条件

| # | 条件 | 充足想定 |
|---|---|---|
| 1 | DEC-080 採決完遂（5/26 統合採決） | Y 想定 |
| 2 | W6-A spec readiness 95+ pt | Y 達成（本 round 96/100） |
| 3 | R28 Dev-CCC dispatch 完遂 | Y 想定（CEO 9 並列 dispatch 内） |
| 4 | harness 849 PASS 維持 | Y 想定（read-only 厳守） |
| 5 | openclaw-runtime 394 PASS 維持 | Y 想定（read-only 厳守） |
| 6 | DEC-079 採決完遂（5/26 統合採決） | Y 想定 |
| 7 | Phase B-2 物理実装完遂（R26 Dev-WW 達成） | Y 達成 |

→ 7 条件中 2 条件達成 / 5 条件想定 = **R28 着手 GO 条件付**

### 2.3 R28 着手 fallback path

DEC-080 採決遅延 / R28 dispatch 遅延の場合 = **R30 着手 fallback path 採用**。

R30 path は buffer 3-10 日に縮小するが、6/19 公開前完遂は確保可能。

---

## §3 本 round（R27）の着手判断

### 3.1 R27 物理実装着手判断 = **NO**（spec 草案 + dry-run 段階で完結）

理由 5 件:
1. Owner directive「DEC-080 採決前なので物理実装は spec 草案 + dry-run 段階まで」明示遵守
2. DEC-080（W5 完成宣言採決）が 5/26 統合採決前 = 採決前の物理化は採決根拠を毀損する risk
3. 既存 W4 W5 file md5 不変厳守（本 round 期間中の改変は spec / 評価書面のみ）
4. R28 着手 path で十分な buffer 確保（17-24 日 / risk 低）
5. 本 round で readiness 95+ pt 到達済 = R28 着手 readiness 完備

### 3.2 本 round 完遂事項

| # | 事項 | 完遂状態 |
|---|---|---|
| 1 | W6-A spec 詳細化 v2.0（500-700 行 / 3 groups / 8-12 tests） | Y |
| 2 | readiness 95+ pt 到達評価（96/100） | Y |
| 3 | 着手判断（本書面） | Y |
| 4 | Mock 6 種 type 詳細化（spec §4） | Y |
| 5 | R28 dispatch 引継 spec | Y |
| 6 | 既存 W4 W5 file md5 不変 | Y |
| 7 | API call $0 / 副作用 0 / 絵文字 0 | Y |

---

## §4 R28 着手 dispatch 想定

### 4.1 R28 Dev-CCC dispatch task

| # | 内容 | 工数 | 前提 |
|---|---|---|---|
| 1 | W6-A 物理化（必須 8 tests / 3 groups / 510 行） | 5-6h | DEC-080 採決後 |
| 2 | optional tests +4 件追加判定 + 物理化 | 1-2h | 1 完遂後 |
| 3 | spec → 物理化の適応事項 record | 0.5h | 1 完遂後 |
| 4 | R28 Dev-CCC 総括 | 1h | 1-3 完遂後 |
| **合計** | - | **7.5-9.5h** | - |

### 4.2 R28 完遂時想定

| 観点 | R28 完遂時 |
|---|---|
| harness PASS | **858-863**（必須 8 tests +9 / optional +4 で +13） |
| W6 累計 tests | 8-12 |
| W6-A 物理化 | 完遂 |
| 物理 file 件数 | 7（W5 3 + 既存 3 + W6-A 1） |
| readiness pt（W6 第 2 弾以降） | 95+ pt 維持 |

---

## §5 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 既存 W4 W5 file md5 不変厳守 | **達成** |
| API call $0 / 副作用 0 / 絵文字 0 | **達成** |
| DEC-080 採決前 = 物理実装 spec 草案 + dry-run 段階まで | **達成**（物理化 0 件） |
| Owner directive 遵守 | **達成** |
| fix forward-only | **達成** |

---

## §6 結語

W6-A 物理実装着手判断 = **R28 着手 GO 条件付推奨**（推奨度: 高 / risk: 低 / 6/19 buffer 17-24 日）。R27 着手は Owner directive 違反のため不可、R30 着手は fallback、6/19 後着手は非採用。本 round で readiness 96/100 pt 到達 + spec 物理化レベル詳細化完遂 = R28 dispatch 内での Dev-CCC 物理化着手 readiness 完備。

DEC-080 採決連動の 7 条件のうち 2 条件達成 / 5 条件想定 = R28 着手 GO 条件付。採決遅延の場合 R30 fallback path で対応可能（buffer 3-10 日 / 6/19 公開前完遂可能）。

本 round では Owner directive「物理実装は spec 草案 + dry-run 段階まで」厳守、物理化 0 件 / spec / 評価 / 判断書面の 4 件で完結。

---

**SOP 順守**: 本書面は判断のみ / 物理化なし / API call $0 / 副作用 0 / 絵文字 0 / fix forward-only / 既存 file md5 1 byte 不変厳守。
