# Dev-FFF R29 — W6-A edge-config-canary 物理化 impl 報告

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R29 Dev-FFF (18 件目 dev sprint / Round 29 9 並列の 3 軸目)
連動 DEC: DEC-019-068 / 074 / 075 / 080 (DRAFT)
連動 runsheet: `runsheets/w6a-production-rollout-sop.md` §3 canary 4 段階

---

## §1 物理化 file

| file | 行数 | 概要 |
|---|---|---|
| `app/openclaw-runtime/src/canary/edge-config-canary.ts` | 117 | stage 0-4 / decideCanary / applyCanary / Edge Config writer 注入 |
| `app/openclaw-runtime/src/canary/__tests__/edge-config-canary.test.ts` | 109 | 8 cases (forward/hold/rollback/abort/invalid_jump/writer/evidence/schema) |
| **合計** | **226** | - |

## §2 設計要点

- **stage 5 段階定数化**: `STAGE_PERCENT` で 0/5/25/50/100% を mapping table 化、magic number 排除。
- **decideCanary 純関数化**: side-effect なし / 戻り値型 `CanaryDecision` で 5 reason (forward/hold/rollback/abort/invalid_jump) を区別、canary 進行可否を呼出側が一意に判定可能。
- **invalid_jump ガード**: stage skip (例: 1→3) を block、SOP §3.2 の「one-step-only forward」原則を型レベルで強制。
- **abort 優先度最上位**: `abortRequested=true` で target に関係なく stage 0 へ rollback、kill switch 連動。
- **trigger evidence gate**: `triggerEvidenceOk=false` で forward を hold、DEC-068 5 trigger 連動 (custom health endpoint 評価結果を入力).
- **writer 注入 (依存逆転)**: Vercel Edge Config 実 API は writer callback 注入で実装、本 module は決定論的純関数 + mock 互換性確保。

## §3 test cases (8 cases)

| # | case | 期待 |
|---|---|---|
| 1 | S1 -> S2 forward (evidence ok) | reason=forward / percent=25 |
| 2 | S2 -> S2 hold | reason=hold / percent=25 |
| 3 | S3 -> S0 rollback | reason=rollback / percent=0 |
| 4 | S4 abort | reason=abort / stage=0 |
| 5 | S1 -> S3 invalid_jump | allowed=false / stage 維持 |
| 6 | applyCanary writer 呼出 | writer 1 回呼出 / applied=true |
| 7 | trigger evidence 不足 | reason=hold / allowed=false |
| 8 | schema 範囲外 stage | parse throw |

## §4 制約遵守

| 制約 | 遵守 status |
|---|---|
| 既存 absolute 4 file 無改変 | **達成** (新規 dir `canary/` 配置) |
| TS6059 0 件維持 | **達成** (composite topology 継承 / 新規 dir のみ) |
| 副作用 0 | **達成** (helper + test 新規追加のみ) |
| API call $0 | **達成** (writer 注入で実 API 未呼出) |
| 物理 deploy 0 件 | **達成** (helper のみ / GTC-11 D-Day 後実 deploy) |
| 絵文字 0 | **達成** |

## §5 R30 引継

- `applyCanary` を Vercel Edge Config 実 SDK と接続する dispatcher 1 件 (約 30-50 行) を R30 で物理化想定。
- canary 進行を automate する scheduler / cron 連動は GTC-11 D-Day Phase で個別検討。

---

**SOP 順守**: 副作用 0 / 既存 absolute 4 file 無改変 / API call $0 / 絵文字 0 / TS6059 0 件 / 物理 deploy 0 件 / fix forward-only / 報告 200 行以内厳守。
