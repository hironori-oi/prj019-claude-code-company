# PRJ-020 ClawDialog (PRJ-019 同居実装)

最終更新日: 2026-05-03 / 起案: Dev Department

## 位置づけ

本ディレクトリは **PRJ-020「ClawDialog」** の実装を PRJ-019 Clawbridge と **同居**させるためのサブルートである。

- 一次決裁: `projects/PRJ-020/decisions.md` DEC-020-003 (同居実装方針)
- 二次決裁: `projects/PRJ-019/decisions.md` DEC-019-033 §⑤ (透明性ダッシュボード + 権限管理 UI を PRJ-020 統合実装)

## なぜ同居するのか

| 共有資源 | 同居の利点 |
|----------|------------|
| HITL Gate (11 種) | 同一 `hitl_requests` テーブル / 同一 worker、二重実装回避 |
| Spend Cap (DEC-019-031 月次 $300) | 同一 `cost_ledger`、PRJ-020 の API コスト も同枠で監視 |
| 監査ログ (SHA-256 hash chain) | 同一 `audit_log`、Owner ↔ Open Claw 双方向 channel の証跡を統合 |
| Supabase project / Vercel project | $0 追加 (Hobby + Free Tier 内) |

## 完全独立 NG の理由

- 完全独立リポでは HITL 統合 / 監査統合 / インフラ共有 のメリットを放棄するため、運用複雑化が大きい
- 採用判断結果のみは独立し、`projects/PRJ-020/app/decisions/` 配下に保存する (DEC-020-003)

## 本ディレクトリの scope

PRJ-020 ClawDialog 本体実装は **Phase 1 PoC (6/21-7/4)** で本ディレクトリ配下に着手する。Pre-Phase 1 (本コミット) では以下のみを行う:

- 本 README (リンク + scope 明示)
- `app/web/src/app/dashboard/` に PRJ-020 統合先の placeholder を確保 (Web 層 scaffold 内)

PRJ-020 の HITL Gate 8 (`owner_input_review`) / Gate 9 (`dev_kickoff_approval` UI) / Gate 10 (`permission_change_review` UI) / Gate 11 (`knowledge_pii_review` UI) は **すべて本ディレクトリではなく `app/web/` 内の Next.js route で実装**される (UI は単一 Next.js アプリに統合)。本ディレクトリは将来の独自バックエンド (Owner ↔ Open Claw 双方向 channel 専用 API) を切り出す場合に使用する予定。

## 関連ドキュメント

- `../README.md` (PRJ-019 app monorepo 全体)
- `../../decisions.md` (PRJ-019 全 DEC)
- `../../../PRJ-020/decisions.md` (PRJ-020 全 DEC)
- `../../../PRJ-020/state.md` (PRJ-020 現状)
- `../web/src/app/dashboard/` (透明性ダッシュボード実装、DEC-019-033 §③)
- `../web/src/app/dashboard/permissions/` (権限管理 UI 実装、DEC-019-033 §⑤)

## 制約

- **絵文字禁止** (UI / コメント / ドキュメント)
- **secret 直書き禁止** (`.env.example` でキー名のみ列挙)
- **service_role key を subprocess に渡さない** (DEC-019-033 §⑤ priviledge escalation 物理防止)
- **13 prohibited domains** は Casbin policy の deny envelope (Owner UI でも解除不可)

---

v1: 2026-05-03 起案 (Pre-Phase 1 同居 scaffold 配置時に新設)
