# Web-Ops-D Round 16 第 1 波 報告書: Runbook 物理化 3 件

**作成日**: 2026-05-05
**作成者**: Web-Ops-D（Round 16 第 1 波担当）
**対象案件**: PRJ-019 Open Claw（公開予定 6/27 朝 09:00 JST、前倒し case 6/20）
**ラウンド**: Round 16 第 1 波 / Runbook 物理化
**API コスト**: $0 / 副作用 0 / tests 影響 0 / 絵文字 0

---

## 1. 概要

Round 15 までに deploy 済みの en v1.1 / portfolio v3.1 を踏まえ、公開（D-Day）と公開後 30→60 日運用拡張の 2 局面で必要となる運用 SOP を、Web-Ops 部門が独立に実行可能な形式で 3 本物理化した。各 Runbook は ① 目的 ② 前提条件 ③ 手順 ④ 確認ポイント ⑤ rollback / 失敗時対応 ⑥ 関連 DEC の 6 セクション固定で 80–120 行に収め、合計 296 行（実 body）で着地。

---

## 2. 物理化した Runbook 3 件

### 2.1 公開前 SOP Runbook
**path**: `projects/COMPANY-WEBSITE/runbooks/public-launch-sop.md`
**役割**: 6/19（前倒し）または 6/26（標準）夕方〜当日 09:00 JST までの最終確認手順を機械化。D-1 17:00 の DNS TTL 短縮、D-Day 08:30 起動、smoke 実行 → Owner 1 言 GO → Vercel `Promote to Production` → 公開後 1 時間監視、までを 1 本道で記述。Rollback 条件は 5xx > 1% / Lighthouse < 80 / Owner stop / Cron 2 連続失火 のいずれかで即時実行と明記。

### 2.2 Cron Fallback 切替 Runbook
**path**: `projects/COMPANY-WEBSITE/runbooks/cron-fallback-switch.md`
**役割**: Vercel Cron 全停止 / 単一 route 30 分連続失火 / region 障害公表 のいずれかを切替トリガとし、`CRON_SECRET` の HMAC 共通検証を前提に GitHub Actions schedule（`.github/workflows/cron-fallback.yml`）へ 5 分以内に切替える手順を確立。重複発火防止のため Vercel 側を `Disable` する step を明示し、復旧後の戻し手順も同一 Runbook に統合。

### 2.3 Slack Alert 経路 Runbook
**path**: `projects/COMPANY-WEBSITE/runbooks/slack-alert-routing.md`
**役割**: `SLACK_WEBHOOK_URL` を単一 egress として 3 channel（#prj-019-alerts / #prj-019-launch / #ops-escalation）に payload `channel` field でルーティング。severity 4 段階（low / medium / high / critical）と escalation 経路（Web-Ops → CEO → Owner、critical のみ Owner 並列 DM）を表で固定化。

---

## 3. Owner 公開前運用設定 4 件への接続

本 3 Runbook は、Owner が公開前に完了させる運用設定 4 件（DEC-019-062 関連）と 1:1 で接続する：

| Owner 設定項目 | 主担当 Runbook | 補助 Runbook |
|---|---|---|
| Vercel Cron 設定（5 本） | cron-fallback-switch.md §2 前提条件 | public-launch-sop.md §2 §4 |
| `SLACK_WEBHOOK_URL` 登録 | slack-alert-routing.md §2 §3 全域 | cron-fallback-switch.md §3.1 |
| `CRON_SECRET` 同期（Vercel + GitHub Secrets） | cron-fallback-switch.md §2 §3.3 §5.1 | public-launch-sop.md §2 |
| Vercel プラン確認（Hobby → Pro 判断） | public-launch-sop.md §2 前提条件 | slack-alert-routing.md §3.2 critical 行 |

公開前 Owner reminder の自動送信は、`organization/templates/owner-prelaunch-confirmation.md`（既存テンプレ）から派生する 4 項目チェックリストで対応する想定とし、本 Runbook では完了済み前提として §2 に明記した。設定未完了が判明した場合は public-launch-sop.md §2 のチェックボックスで止まり、Owner へ即時 escalation する経路が `slack-alert-routing.md` §3.3 の medium / high で機械化されている。

---

## 4. 設計判断のハイライト

1. **6 セクション固定**：CEO / PM / 他部署が Runbook をスキャン読みする際の認知負荷を最小化。Round 15 までの ad-hoc Runbook（dev 部門の 1Password 系）と書式を揃えず、運用専用書式として独立させた。
2. **Owner 1 言 GO の動線**：public-launch-sop.md §3.2 step 4–5 で「smoke green → Owner GO 受領 → Promote」を 3 行で記述し、Owner の判断負荷を 1 言に圧縮。
3. **Cron / Slack の双方向参照**：cron-fallback-switch.md §3.1 と slack-alert-routing.md §3.2 の表が同一 severity 区分を共有。alert ルール変更時の同期ポイントを 1 箇所（severity 表）に集約。
4. **DEC trail**：各 Runbook §6 で DEC-019-054 / 055 / 062 / 033、DEC-018-047、ODR-OG-06 への trace を明示。Round 15 v15 統合報告（ceo-round14-integrated-report-v15.md）の決議群と直接接続可能。
5. **公開後 D+7 / D+14 / D+30 の見直しサイクル**：3 Runbook がそれぞれ異なるタイミングで初回見直しを行うように分散配置し、運用負荷の山を作らない。

---

## 5. 副作用ゼロ確認

- [x] runbooks ディレクトリは新規作成（既存 path への上書きなし）
- [x] 既存ソースコード / tests / dashboard / decisions.md には触れていない
- [x] Vercel / GitHub / Slack / 1Password へ実 API call は 0 件
- [x] 絵文字 0 件（ファイル内検索済み）
- [x] 各 Runbook 80–120 行範囲内（public-launch: 約 100、cron-fallback: 約 100、slack-alert: 約 96）

---

## 6. 次のアクション提案

1. **CEO**：Round 16 第 1 波の他 3 件（W-Ops-A/B/C 想定）と本 3 Runbook を v16 統合報告で 1 行ずつ吸収し、Owner cover letter に「公開前運用設定 4 件のチェック動線が物理化済み」を 1 sentence で含める。
2. **PM**：dashboard/active-projects.md PRJ-019 Phase 表に「Runbook 3 本物理化済み」を反映し、進捗 86% → 87% を提案（2pt: 公開前 SOP / cron fallback / Slack alert の 3 経路機械化分）。
3. **Owner**：`SLACK_WEBHOOK_URL` / `CRON_SECRET` / Vercel Cron / Vercel プラン の 4 件設定を、本 Runbook §2 を画面に出した状態で実施いただき、完了 Slack 1 言で Web-Ops に通知。
4. **Round 16 第 2 波**：本 Runbook を Dev / Review 部門が読み合わせて、Cron endpoint 側の HMAC 検証コード（`/api/cron/*`）と alert payload schema の整合 review を 1 ターンで完結させる。

---

**所要 token**: low（local file write のみ、retrieval なし）
**整合性 self-check**: DEC trail / Owner 4 件接続表 / 6 セクション固定 全て pass
**完了**: 2026-05-05 Round 16 第 1 波 Web-Ops-D 担当分

---

## 7. 補足: 30→60 日運用拡張への接続

公開後 30 日で運用が安定したのち、60 日地点で以下の Runbook 派生・拡張を予定する：
- public-launch-sop.md → 月次再公開 SOP（minor release 用、smoke 軽量版）へ派生
- cron-fallback-switch.md → 障害想定訓練（D+14）の結果を §5 に追記
- slack-alert-routing.md → alert volume 集計（D+30）に基づき severity 表を更新

これら派生 Runbook は本 3 本を base path として `runbooks/` 直下に並列配置し、Round 16 以降のラウンドで Web-Ops 部門が物理化を継続する。
