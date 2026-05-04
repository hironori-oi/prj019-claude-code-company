# PRJ-019 オーナー残タスク（2026-05-02 時点）

**作成日**: 2026-05-02 ／ **作成**: 秘書部門 ／ **対象**: オーナー本人

---

## 概要

オーナー W0 タスク 4 件（CB-O-01 / CB-O-02 / CB-O-03 / GO-06 主要部分）が 2026-05-02 で完了し、CEO 決裁 DEC-019-009〜013 が発行されました。
ただし、Phase 1 W1 着手（2026-05-19）までにオーナー本人が手を動かすべき残タスクが 3 件あります。本書はそのリマインダーです。

---

## オーナー残タスク一覧

| # | タスク | 期限 | 所要時間 | 重要度 | 関連 DEC | 備考 |
|---|---|---|---|---|---|---|
| 1 | **CB-O-05 Doppler 登録**（secret 管理基盤、Free プラン、4 環境構築 = `Clawbridge-Master / Dev / Notify / Public`） | 2026-05-15 | 30 分 | **CEO 推奨** | DEC-019-013 C-A-05（OAuth トークン隔離の基盤） | 1Password Vault と並行して Doppler を secret 配布の主経路にする方針。Doppler CLI セットアップ後、`doppler run -- claude` で OAuth トークンを直接シェル環境に露出させない構造を実現 |
| 2 | **Anthropic Spend Cap 設定**（API キーフォールバック発動時の安全網、Hard $50/月、Soft $40/月、Per-request $0.50） | 2026-05-18 | 5 分 | **必須**（W1 着手前） | DEC-019-012 | Anthropic Console → Settings → Billing → Spend limits。P-E（API キー従量）フォールバック発動時のみ課金が走るが、誤発動時の被害を $50 で物理的に止める |
| 3 | **OpenAI Spend Cap 設定**（バッファ、Hard $20/月） | 2026-05-18 | 5 分 | **必須**（W1 着手前） | DEC-019-012 | OpenAI Platform → Settings → Limits → Hard limit。ChatGPT Pro $200 サブスクは別建てのため、本 Cap は API バッファ枠（gpt-4 等の周辺呼び出しへの保険）として機能 |

**所要時間合計**: 約 40 分（Doppler 登録の調整次第で前後）

---

## 補足: 各タスクの詳細手順

### 1. CB-O-05 Doppler 登録（5/15 期限、30 分）

1. [Doppler 公式サイト](https://www.doppler.com/) にアクセス、Free プラン（Developer / 5 projects まで）でサインアップ
2. Project 作成: `clawbridge`
3. Environment 作成: `master / dev / notify / public`
4. `Clawbridge-Master` Vault と Doppler の対応マッピング表を作成（`projects/PRJ-019/app/secrets/doppler-mapping.md` に記録予定、Dev 部門が CB-D-W0-07 で着手）
5. オーナーは Doppler workspace token を 1Password に保存して Dev 部門に共有

### 2. Anthropic Spend Cap 設定（5/18 期限、5 分）

1. [Anthropic Console](https://console.anthropic.com/) にログイン
2. Settings → Billing → Spend limits を開く
3. **Hard limit**: $50/month を設定（超過で全 API キー停止）
4. **Soft limit**: $40/month（80%）でメール警告
5. **Per-request limit**: $0.50（1 リクエストあたり）
6. 設定完了スクリーンショットを `projects/PRJ-019/reports/owner-spend-cap-screenshots-2026-05-XX.md` に貼付

### 3. OpenAI Spend Cap 設定（5/18 期限、5 分）

1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. Settings → Limits を開く
3. **Hard limit**: $20/month（超過で全 API キー停止）
4. **Soft limit**: $16/month（80%）でメール警告
5. ChatGPT Pro サブスクとは別経路のため、本 Cap は API 利用にのみ作用
6. 設定完了スクリーンショットを `projects/PRJ-019/reports/owner-spend-cap-screenshots-2026-05-XX.md` に貼付

---

## ブロッカー判定

- **5/15 までに Doppler 登録未完了** → CB-D-W0-07（OAuth トークン隔離）が物理的に着手不可、Phase 1 W1 着手リスクあり
- **5/18 までに Anthropic / OpenAI Spend Cap 未設定** → P-E フォールバックが誤発動した際に課金暴走の物理的歯止めが効かない、W1 ハードガード（G-01）の前提崩壊

---

## エスカレーション

期限超過の見込みが立った時点で、オーナーから CEO に連絡 → CEO が秘書経由で W1 着手延期を発令します。

---

**作成**: 2026-05-02 秘書部門 ／ **次回更新**: オーナー作業完了報告時 / W0 完了レビュー（CB-S-W0-01、5/18）
