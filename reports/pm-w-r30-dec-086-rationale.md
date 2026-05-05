# PM-W R30 DEC-019-086 rationale 起票

- 起票: PM-W (Round 30 / 9 並列 1 軸目 / DEC-086 候補正式起案 軸)
- 起票日時: 2026-05-06 (Round 30)
- 議決 ID 候補: DEC-019-086
- タイトル候補: ARCH-01 fully-resolved formal 遷移宣言 = DEC-019-041 close 動議
- status (R30 着地): DRAFT (R31 atomic 採決想定)
- 議決準備完遂 base: R29 Dev-GGG GTC-5 GREEN（PA-01-03 atomic 物理化完遂 / TS errors 4→0 / build time -55%〜-90% / DEC-019-041 fully-resolved 技術達成）

## 1. 起案背景（context）

DEC-019-041（ARCH-01: harness/tsconfig 系 TS6059 解消 + Phase B-3 fully-resolved 達成）は R26 Dev-WW Phase B-2 着地（TS6059 5→0 / 工数 53% 短縮 / partial-resolved → resolved-evidence-ready）→ R27 Dev-AAA + R28 Dev-DDD spec 詳細化 → R29 Dev-GGG 物理化完遂（harness/tsconfig.json `exclude` array 2 entry 追加 + tsconfig.legacy-relax.json `_meta.knowledgeRelaxScope` 1 field 追加 = 計 3-4 行 / 2 file 物理化 / TS errors 4→0 / DEC-019-041 fully-resolved 技術達成）。本議決は ARCH-01 fully-resolved formal 遷移を formal 化し、DEC-019-041 status 行を `resolved-evidence-ready` → `fully-resolved` に正式書換する close 動議。R30 Dev-III が forward-only fix（exclude 解除 / src 改変 OK 条件下で 0.5-1.0h）を着地させた前提で R31 採決成立見込。

## 2. 決定事項候補（draft）

- ① DEC-019-041 status 遷移: `resolved-evidence-ready (R26 Dev-WW)` → `fully-resolved (R31 confirmed / Dev-III forward-only fix 完遂base / R29 Dev-GGG 技術達成 base)`
- ② close 動議: DEC-019-041 の Phase B-3 PA-01-03 atomic spec を formal 完遂宣言（status close 化）
- ③ R30 Dev-III forward-only fix 完遂条件: (a) harness/tsconfig.json exclude 解除（R29 Dev-GGG 追加 2 entry）(b) tsconfig.legacy-relax.json _meta.knowledgeRelaxScope 1 field 整理 (c) src 改変条件下で TS errors 0 件継続 (d) build time delta 維持（tsc --build dry -86% / incremental -90% / --noEmit -55%）
- ④ harness 902 PASS + openclaw-runtime 394 PASS 継承条件: forward-only fix 後も regression 0 件
- ⑤ TS6059 0 件継承: R29 着地値（0 件）を R31 採決完遂時点でも維持

## 3. 採用根拠（rationale）

- (R-1) R29 Dev-GGG GTC-5 GREEN 達成（PA-01-03 atomic 物理化 / TS errors 4→0 / DEC-019-041 fully-resolved 技術到達）
- (R-2) build time delta 全項目高速化（tsc --build dry -86% / incremental -90% / --noEmit -55%）= measurable success criteria 全成立
- (R-3) R30 Dev-III forward-only fix path 整合（exclude 解除 + src 改変 OK 条件 / 工数 0.5-1.0h）
- (R-4) DEC-019-041 起案以降の lineage 完遂（R26 Dev-WW Phase B-2 → R27 Dev-AAA + R28 Dev-DDD spec → R29 Dev-GGG 物理化）
- (R-5) ARCH-01 fully-resolved 達成は Phase 2 完遂宣言（DEC-082）+ Phase 3 production GA 入口条件（DEC-083）の上流条件成立 = 全体 readiness 完成

## 4. 投票方針（採決方式）

- 採決方式: CEO 主催 R31 atomic 1 round session（DEC-084+085+086 統合採決 pattern）
- 採決ライン: CEO + PM-X + Sec-Y 3 者最低（緊急採決基準成立）
- 賛成見込: 3-0-0（R30 Dev-III forward-only fix 完遂 + harness 902 PASS 継承 + TS6059 0 件継承達成済前提）
- 採決時刻見込: R31 session 内 15-20 min（DEC-086 単体）
- 投票結果記入欄: confirmed 時に decisions.md DEC-019-041 status 行 + 本議決 status 行を atomic 物理書換

## 5. 連動議決 + フォローアップ

- 連動議決: DEC-084（GTC-7 完遂宣言）+ DEC-085（GTC-11 D-Day immediate trigger formal 化）
- 上流継承: DEC-019-041（ARCH-01 起案 / R26 Dev-WW Phase B-2 着地）+ DEC-068 v2（trigger 5/5 baseline）
- 下流: ARCH-01 fully-resolved 後の Phase 3 production GA 移行（DEC-083 GA 入口条件成立 + GTC-7 完遂宣言 連動）
- フォローアップ: DEC-019-041 status 行 close 後の knowledge INDEX への pattern 化（patterns/ tsconfig-exclude-forward-only-fix-pattern.md 候補 / R30+ Knowledge-Y 引継）

## 6. 制約遵守 evidence

- API 消費: $0 / 副作用: 0（decisions.md 末尾 append-only + reports/ 新規のみ）
- 絵文字: 0 / harness 影響: 0（baseline 902 + openclaw-runtime 394 維持）
- 既存 DEC 改変: 0（R30 段階 / R31 採決成立時のみ DEC-019-041 status 行 atomic 書換）
- Owner 拘束: 0 分（R30 起案 / R31 採決 = CEO + PM-X + Sec-Y 3 者自走）
- 12 file md5 1 byte 不変厳守継承

---

**完遂判定**: DEC-019-086 起案 DRAFT append-only 完遂 / R31 PM-X 採決軸引継 / Owner 拘束 0 分維持
