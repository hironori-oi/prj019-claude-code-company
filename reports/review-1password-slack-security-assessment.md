# PRJ-019 — 1Password CLI / Slack 新規 workspace セキュリティ評価

最終更新: 2026-05-03 / 起案: Review 部門 / 評価対象: DEC-019-048 + DEC-019-049

位置付け: Owner 直接決裁 2 件（DEC-019-048 = 1Password CLI 採択、DEC-019-049 = Slack workspace 新規作成方針）に対する Review 部門独立セキュリティアセスメント。`review-r019-15-mitigation-plan-v2.md`（4 層防御）+ `review-risk-register-v3.md`（R-019-01〜16 + R-019-12-C）への影響を併せて評価し、5/8 W0-Week1 検収会議への上程議題（議決-16〜19）を起案する。

連動 DEC: DEC-019-048 / DEC-019-049 / DEC-019-033 §⑤ 4 層防御 / DEC-019-022 4 系統監視 / DEC-019-018 HITL 第 6 種 ToS gray review
連動 ODR: OG-04 drill #3 承認 / OG-05 R-019-15 赤格付け
版: v1.0

---

## 目次

| § | 題目 |
|---|---|
| §1 | 1Password CLI 採択 評価 |
| §2 | Slack 新規 workspace 評価 |
| §3 | Risk Register v3 への追加項目 |
| §4 | 5/22 完全承認確度への影響 |
| §5 | Phase 1 着手前 Owner 検証手順への追加 |
| §6 | 5/8 検収会議への上程議題 |
| §7 | 結論 + 根拠 3 点 |

---

## §1 1Password CLI 採択 評価

### §1.1 Doppler との比較表（5 軸評価）

| 軸 | 1Password CLI | Doppler | Review 視点判定 |
|---|---|---|---|
| **認証強度** | E2E 暗号化（Secret Key + Master Password 二要素）+ device authorization 必須 + TOTP 任意 | API token 単一要素（OIDC 連携で MFA 可、Free tier では弱い） | **1Password 優位**（zero-knowledge architecture、master 漏洩でも Secret Key 無しでは復号不可） |
| **audit log** | 全操作 ログ + Watchtower（CVE / 漏洩 監視）+ Pro 以上で SIEM 連携 | Project / Config / Secret 単位 audit log + Webhook 通知 | **同等**（粒度は両者十分、1Password は個人 Plan でも基本 log 保持） |
| **SOC 2** | SOC 2 Type II 認証 + ISO 27001 + GDPR 対応 | SOC 2 Type II + GDPR 対応 | **同等** |
| **価格（Phase 1 想定）** | 個人 Plan 既契約活用 = $0 追加（Owner 既存資産流用） | Developer Free tier 5 user 制限 + Team $7/user/月 | **1Password 優位**（既存資産流用で Phase 1 内 incremental cost ゼロ） |
| **移行容易性** | `op://` reference を `.env.local` に直書き、`op run --` 実行で env 注入、CI/Tauri/Edge Function 全対応 | `doppler run --` で env 注入、新規アカウント作成 + project 設計 + token 発行が必要 | **1Password 優位**（Owner 既存運用熟練度高、追加学習コスト低） |

**比較結論**: 5 軸中 1Password 優位 3 軸 + 同等 2 軸。**1Password CLI 採択は技術的・経済的に妥当**。

### §1.2 1Password CLI のセキュリティ強み

| 強み | 内容 | Review 評価 |
|---|---|---|
| **E2E 暗号化** | Vault 内 secret は client-side で AES-256-GCM 暗号化、サーバ側で復号不可 | **白**（zero-knowledge）|
| **Secret Key + Master Password** | 二要素鍵設計、Master Password 漏洩のみでは復号不可（Secret Key 必須）| **白**（業界 best practice）|
| **device authorization** | 新規デバイス接続時 既存デバイスでの承認必須 + push 通知 | **白**（外部攻撃者の新規デバイス追加を物理的に阻止）|
| **biometric unlock** | macOS Touch ID / Windows Hello 連携で Master Password 入力頻度低減 | **白**（PE-06 派生 keylogger 攻撃を緩和）|
| **CLI op run** | subprocess に env 注入時、token 期限 30 分 default + 失効後再認証必須 | **黄**（後述 T-2 シナリオで詳細評価）|

### §1.3 想定脅威 5 シナリオ + 対策

#### T-1: Master Password 漏洩

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | フィッシング / shoulder surfing / keylogger で Owner の Master Password が漏洩 |
| **影響** | 単独では Secret Key 無しで Vault 復号不可、ただし Secret Key も同時漏洩なら全 secret 漏洩 |
| **既存対策** | Secret Key は別経路保管（紙 + 1Password Emergency Kit）+ device authorization（新規デバイス承認必須） |
| **追加対策（Review 推奨）** | **P-1P-01**: Master Password に対する 1Password TOTP 二要素必須化（P-UI-01 と統合）+ Master Password 文字数 16 文字以上 |
| **残存リスク** | **白**（Secret Key + device authorization + TOTP の三重防御） |

#### T-2: subprocess に op session トークンが漏洩

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | `op run --` で起動した subprocess が `OP_SESSION_*` 環境変数を保持。Open Claw subprocess が `/proc/self/environ` / core dump / debug port 経由で session token を窃取 |
| **影響** | session token 有効期限内（default 30 min）に Vault read 可能、ただし write は biometric 再認証必須 |
| **既存対策** | DEC-019-033 §⑤ 4 層防御 L4 canonical JSON fingerprint + G-V2-11 FS 隔離 |
| **追加対策（Review 推奨）** | **P-1P-02**: 4 層防御に **第 5 攻撃ベクトル T-2（op session 漏洩）を新規登録** + R-019-15 mitigation v2 §1.2 に「(f) Secret Manager Session Exfiltration」として追加 + `op run` 実行時の session 期限を 5 分に短縮（OP_SESSION_TIMEOUT 環境変数）+ subprocess に対する process tree 監視（R-019-15 mitigation v2 §2 統合） |
| **残存リスク** | **黄**（5 分 session + L4 fingerprint + process tree 監視の三重防御後、residual 黄 = 9/25） |

#### T-3: `op run` 経由で env が dump される

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | Open Claw subprocess が起動後すぐに `printenv` / `env > /tmp/leak.txt` を実行、注入された secret 値（DB JWT / Anthropic API key）を窃取 |
| **影響** | 注入 secret の即時窃取、被害は注入 secret 範囲内（1Password 全 Vault は無傷） |
| **既存対策** | restricted_role JWT のみ subprocess に注入（service_role JWT は Edge Function 専用、subprocess 未配布） |
| **追加対策（Review 推奨）** | **P-1P-03**: process tree 監視（R-019-15 mitigation v2 §2 と統合）で `printenv` / `env` / `/proc/self/environ` 読取試行を SIGKILL + audit log + Owner 通知 + secret rotation 即時 |
| **残存リスク** | **白**（process tree 監視 + restricted_role 限定注入で被害局所化） |

#### T-4: Service account への昇格

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | 1Password Service Account（Pro 以上機能、API 経由で Vault アクセス）への移行を Open Claw が Owner Manipulation で誘導、Master Password 不要のフリー access 経路を確保 |
| **影響** | Service Account token は無期限 + 個人デバイス無関係、漏洩時の被害が大きい |
| **既存対策** | Phase 1 = 個人 Plan のみ、Service Account 機能未契約 |
| **追加対策（Review 推奨）** | **P-1P-04**: **Phase 1 = personal account のみ運用、Service Account 移行は Phase 2 で再評価**（HITL 第 10 種 permission_change_review 経由で Owner 明示承認必須） |
| **残存リスク** | **白**（Phase 1 では機能自体未開放） |

#### T-5: Vault 共有設定ミス

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | Owner が Vault に collaborator を誤招待 / 共有 link 公開 / Family Plan の他メンバーに誤共有 |
| **影響** | 全 secret の第三者閲覧、被害甚大 |
| **既存対策** | なし（Owner 操作依存） |
| **追加対策（Review 推奨）** | **P-1P-05**: **Phase 1 中の Vault 単一 Owner only 運用、collaborator 招待禁止 + 共有 link 生成禁止 + Family Plan 利用時は専用 Vault 隔離**（HITL 第 10 種で共有変更時 Owner 二要素再認証必須） |
| **残存リスク** | **白**（運用 policy + HITL-10 で物理化） |

### §1.4 priviledge escalation 4 層防御への影響

#### §1.4.1 第 5 層追加 vs 既存層統合の判定

| 選択肢 | 内容 | 評価 |
|---|---|---|
| **案 A: 第 5 層 1Password を追加** | L1 Casbin / L2 RLS / L3 Hash Chain / L4 Fingerprint に **L5 1Password Vault 隔離** を追加 | **棄却**（4 層防御は「Open Claw が policy を改ざんする経路」を物理化する設計。1Password は secret 配布層であり policy 層と直交、L5 として並列扱いは概念的に不適切） |
| **案 B: 既存 L1〜L4 + G-V2-11 FS 隔離に統合** | T-2 攻撃ベクトルを R-019-15 mitigation v2 §1.2 に「(f) Secret Manager Session Exfiltration」として追加、対策は L4 fingerprint + G-V2-11 + 新規 P-1P-02/03（5 分 session + process tree 監視）で吸収 | **採択**（4 層防御の概念整合性維持 + 新規攻撃ベクトル登録で網羅性担保） |

**判定**: **案 B 採択**。R-019-15 mitigation v2 §1.2 の 5 攻撃ベクトル（a〜e）に **(f) Secret Manager Session Exfiltration** を追加し、6 ベクトル × 4 層 + G-V2-11 マトリクスとして v3 で再起案する（Phase 1 W1 着手前完成）。

#### §1.4.2 (f) ベクトルの 4 層 + G-V2-11 マトリクス（新規）

| 層 / 統制 | (f) Secret Manager Session Exfiltration への寄与 |
|---|---|
| L1 Casbin | 副（subprocess に Vault write API を未公開）|
| L2 RLS | - |
| L3 Hash Chain | 副（session 取得試行の log 化）|
| L4 Fingerprint | 副（policy 改ざん経路には fingerprint mismatch）|
| **G-V2-11 FS 隔離** | **主**（subprocess の `/proc/self/environ` 読取を物理的に阻止）|
| **P-1P-02 5 分 session** | **主**（漏洩時の被害窓を最小化）|
| **P-1P-03 process tree 監視** | **主**（env dump 試行を即 SIGKILL）|

**残存スコア**: 確率 1 × 影響 4 = **4（白）**（4 層防御 + G-V2-11 + P-1P-02/03 の五重防御後）。

### §1.5 §1 結論

**1Password CLI 採択 = 承認**

5 推奨追加コントロール（P-1P-01〜05）を Phase 1 着手前に完遂すること:

| ID | 内容 | 期限 |
|---|---|---|
| P-1P-01 | Master Password に TOTP 二要素必須化（P-UI-01 統合）+ 16 文字以上 | 5/19 |
| P-1P-02 | OP_SESSION_TIMEOUT = 5 分短縮 + R-019-15 v3 で (f) ベクトル登録 | 5/22 |
| P-1P-03 | process tree 監視で env dump 試行 SIGKILL（R-019-15 mitigation v2 §2 統合）| 5/22 |
| P-1P-04 | Phase 1 = personal account のみ、Service Account 移行は Phase 2 HITL-10 経由 | 5/19（運用 policy） |
| P-1P-05 | Vault 単一 Owner only、collaborator 招待禁止 + 共有 link 生成禁止 | 5/19（運用 policy） |

---

## §2 Slack 新規 workspace 評価

### §2.1 既存 workspace 流用 vs 新規作成 のセキュリティ比較

| 観点 | 既存 workspace 流用 | 新規 workspace 作成 |
|---|---|---|
| **誤投稿リスク** | **高**（業務チャンネルとの混在で PII / 顧客情報が PRJ-019 channel に流入する可能性） | **低**（業務 Slack と完全分離、誤投稿可能性物理化） |
| **invitation 制御** | 既存 member 全員が見える可能性、channel level でのみ制御 | workspace level で完全制御、Owner 単独運用 |
| **audit log 範囲** | 業務 audit log と混在、PRJ-019 単独抽出が困難 | workspace 単独 audit log、抽出明確 |
| **権限管理** | Owner / admin が複数存在、policy 適用の一貫性低下リスク | Owner 単独、policy 厳密適用 |
| **BAN リスク影響範囲** | workspace BAN で業務全停止リスク | PRJ-019 単独停止、業務無傷 |
| **学習コスト** | 既存運用そのまま、新規学習なし | 新規 workspace 設定 + 3 channel 構築（25 分想定） |
| **コスト** | $0（既存契約活用） | $0（Slack Free tier）+ 90 日制約あり |

**比較結論**: 5 セキュリティ軸全てで新規作成優位、学習コスト 25 分 + 90 日制約 2 点のみが流用優位。**新規作成方針が妥当**。

### §2.2 新規作成方針の評価

#### §2.2.1 業務 Slack との完全分離

- **強み**: 誤投稿リスク低減（PII 漏洩防止）、業務情報と PRJ-019 情報の物理分離
- **Review 評価**: **白**（R-019-16 ナレッジ PII 漏洩リスクの上流対策として有効）

#### §2.2.2 Workspace 単独管理

- **強み**: invitation 制御明確、Owner 単独で member 管理、policy 一貫性担保
- **Review 評価**: **白**（HITL-10 permission_change_review との整合性高）

#### §2.2.3 Slack Free 制約（90 日保持）

- **弱み**: audit log 90 日後消失、長期 audit が困難
- **対策**: **DB audit_log への二重記録必須**（policy_audit_log SHA-256 hash chain と同期、90 日保持期限内に DB 永続化）
- **Review 評価**: **黄**（DB 二重記録運用化前提で白化）

### §2.3 想定脅威 4 シナリオ

#### T-S-1: webhook URL 漏洩

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | Slack incoming webhook URL が GitHub commit / Tauri バイナリ / log file 経由で漏洩、第三者が任意メッセージ投稿可能 |
| **影響** | Owner 偽装通知 → Owner Manipulation（PE-03 / R-019-15 (e) ベクトル）誘発 |
| **対策（Review 推奨）** | **P-SL-01**: webhook URL を 1Password Vault に格納（plain text 直書き禁止）+ Slack Apps level で IP allowlist 設定（**Slack Free tier 制約により Pro 以上が必要、Phase 1 は IP allowlist 未対応 → workspace owner 単独運用で代替**）+ webhook URL rotation 月次 |
| **残存リスク** | **黄**（Free tier の IP allowlist 未対応により完全防御不可、月次 rotation で被害窓最小化） |

#### T-S-2: 誤 channel 投稿

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | HITL 通知が monitor アラート channel に誤投稿、または drill 通知が HITL channel に誤投稿、Owner の判断遅延 |
| **影響** | HITL SLA 24h timeout 派生（fail-secure 動作だが運用混乱）|
| **対策（Review 推奨）** | **P-SL-02**: channel mapping 厳格化（HITL 通知 = `#hitl-gates`、monitor アラート = `#monitor-alerts`、drill 通知 = `#drill-runs`、3 channel 厳密分離）+ webhook URL 別個発行 + lint（送信前に channel name 検証、不一致で reject） |
| **残存リスク** | **白**（lint で物理化） |

#### T-S-3: 過去 90 日後の audit gap

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | Slack Free tier の 90 日保持上限により、Phase 1 完了 6/20 時点で W0 期間（5/3〜）の audit log が約 50 日後（6/22 以降）に順次消失 |
| **影響** | 監査時の証跡欠落、R-019-15 mitigation v2 §8 hash chain 検証範囲縮小 |
| **対策（Review 推奨）** | **P-SL-03**: **DB `policy_audit_log` への二重記録必須**（Slack 通知発火と同 transaction で DB INSERT、SHA-256 hash chain で改ざん検知、90 日後 Slack 消失でも DB 側で永続化担保）+ 月次 manual audit で DB / Slack 整合確認 |
| **残存リスク** | **白**（DB 二重記録で吸収、R-019-15 mitigation v2 §8 と整合） |

#### T-S-4: workspace owner 喪失

| 観点 | 内容 |
|---|---|
| **攻撃シナリオ** | Owner アカウント BAN / 紛失 / 削除で workspace 全体がアクセス不能、Phase 1 全停止 |
| **影響** | Phase 1 進行不能、HITL Gate 全機能停止 |
| **対策（Review 推奨）** | Phase 1 では **セカンダリ admin 追加禁止**（priviledge minimize 原則）+ Slack workspace 設定の screenshot を月次保管 + Owner アカウント recovery 手順を 1Password Emergency Kit に記載 + Phase 2 で secondary admin 追加検討 |
| **残存リスク** | **黄**（priviledge minimize 優先、Owner 単点障害は受容、Phase 2 で再評価） |

### §2.4 §2 結論

**Slack 新規作成 = 承認**

3 推奨追加コントロール（P-SL-01〜03）を Phase 1 着手前に完遂すること:

| ID | 内容 | 期限 |
|---|---|---|
| P-SL-01 | webhook URL を 1Password Vault 格納 + Free tier IP allowlist 制約受容 + 月次 rotation | 5/22 |
| P-SL-02 | 3 channel 厳密分離 + 別個 webhook URL + 送信前 lint | 5/22 |
| P-SL-03 | DB `policy_audit_log` 二重記録（Slack 通知と同 transaction）+ 月次整合確認 | 5/25（DB schema は P-UI-03 と統合） |

---

## §3 Risk Register v3 への追加項目

### §3.1 新規リスク 2 件起票候補

| ID | 名称 | カテゴリ | 確率 | 影響 | スコア | 色 | 起票理由 |
|---|---|---|---|---|---|---|---|
| **R-019-17** | 1Password Master Password 喪失時の Vault unrecoverable 状態 | 体制 | 2 | 4 | 8 | **黄** | DEC-019-048 採択に伴う新規リスク。Master Password 紛失 + Secret Key 紛失 + Emergency Kit 紛失の三重欠落で全 secret 復旧不能、backup recovery kit 必須 |
| **R-019-18** | Slack Free 90 日制約による audit gap | 法令 | 3 | 2 | 6 | **緑** | DEC-019-049 採択に伴う新規リスク。DB audit_log 二重記録（P-SL-03）で吸収、residual 緑 |

### §3.2 R-019-15 mitigation v2 への追加: 第 6 攻撃ベクトル (f) T-2 統合

R-019-15 mitigation v2 §1.2 の 5 攻撃ベクトル（a〜e）に **(f) Secret Manager Session Exfiltration** を追加。詳細は §1.4.2 マトリクス参照。

| ベクトル | 名称 | 主防御層 | residual |
|---|---|---|---|
| (a) Direct Write | - | L1 + L2 | 白 |
| (b) Log Tampering | - | L3 | 白 |
| (c) Key Exfiltration | - | L4 + G-V2-11 | 白 |
| (d) Fetch Spoofing | - | L4 | 白 |
| (e) Owner Manipulation | - | HITL 9/10 + P-UI-02/05/07 | 黄 |
| **(f) Secret Manager Session Exfiltration** | **新規（DEC-019-048 統合）**| **G-V2-11 + P-1P-02/03** | **白**（4/25） |

R-019-15 全体スコアは v2 = 15（赤、確率 3 × 影響 5）から v3 では (f) 追加で攻撃面 +1 だが、(f) の residual 白により 全体 residual は変動なし（v2 の mitigation 後 黄 10/25 維持）。**赤格付け維持**（OG-05）。

### §3.3 Risk Register v3.1 改訂計画

| 項目 | v3 | v3.1（5/8 検収後改訂） |
|---|---|---|
| 件数 | 17 件 | **19 件**（R-019-17/18 追加）|
| 赤件数 | 2 件（R-019-12-A / R-019-15）| 2 件（変動なし）|
| 黄件数 | 13 件 | 14 件（R-019-17 追加）|
| 緑件数 | 2 件 | 3 件（R-019-18 追加）|
| 平均スコア | 10.1 | 9.8（緑追加で微減）|

---

## §4 5/22 完全承認確度への影響

### §4.1 直前確度 78% の構成要素

| 要素 | 寄与度 |
|---|---|
| P-UI-01〜09 完遂見込み（5/25 期限）| +30% |
| BAN drill #3 計画完成（5/8 検収）| +15% |
| HITL 第 11 種 SLA 48h 採択 | +10% |
| Pen Test #1 計画 | +8% |
| 4 層防御 L1〜L4 概念合意 | +15% |
| 直前 baseline | 0% |
| **計** | **78%** |

### §4.2 DEC-019-048/049 採択による上昇要因

| 要因 | 寄与度 |
|---|---|
| **Doppler 比較工数削減**（5 軸比較完了で意思決定確定、追加調査不要）| **+1%** |
| **既存ツール採択で Owner 操作熟練度上昇**（1Password = 既存資産流用、学習コスト微小）| **+1%** |
| **Slack 新規 workspace で誤投稿リスク低減**（PII 漏洩リスク R-019-16 上流対策）| **+0.5%** |
| **R-019-17/18 新規リスク追加で透明性向上**（不確実性の可視化）| **-0.5%**（リスク件数増による減点）|
| **計** | **+2%** |

### §4.3 5/22 完全承認確度

直前 78% → **80%**（+2%）

**判定**: 80% 達成は 5/8 検収会議の 4 議決（議決-2/5/6/7）+ 5/22 までの P-UI-01〜09 完遂 + drill #3 完成度に依存。1Password / Slack 採択は確度上昇に寄与するが、絶対値は依然として中位水準（80%）であり、Phase 1 着手 5/26 Conditional Go の前提として残 5/14 の P-1P-01〜05 / P-SL-01〜03 完遂が必須。

---

## §5 Phase 1 着手前 Owner 検証手順への追加

### §5.1 既存 4 検証（90 分）

| ID | 内容 | 工数 |
|---|---|---|
| 検証 1 | Owner 二要素認証（1Password TOTP）動作確認 | 20 分 |
| 検証 2 | kill switch 押下 → 1 秒以内に subprocess SIGKILL 確認 | 20 分 |
| 検証 3 | HITL Gate 9/10/11 各 1 試行で SLA timer 動作確認 | 30 分 |
| 検証 4 | policy_audit_log hash chain 整合確認（10 行手動 INSERT + 検証）| 20 分 |
| **計** | - | **90 分** |

### §5.2 新規 2 検証（25 分追加）

| ID | 内容 | 工数 |
|---|---|---|
| **検証 5（新規）** | **1Password CLI で `op run --` 経由で env 注入が成功すること**（subprocess に restricted_role JWT が渡る + 5 分後 session 失効確認）| **10 分** |
| **検証 6（新規）** | **3 Slack channel への webhook 投稿テスト**（HITL 通知 / monitor アラート / drill 通知 各 1 投稿 + DB audit_log 同期確認、各 5 分）| **15 分** |
| **計** | - | **25 分** |

### §5.3 Owner 検証総工数

90 分 → **115 分**（+25 分、約 28% 増）

**判定**: 検証時間 25 分増は許容範囲内。Owner 1 セッション内で完遂可能。Phase 1 着手 5/26 前日（5/25）の Owner 検証窓（午前または夕方 2h ブロック）に統合実施。

---

## §6 5/8 検収会議への上程議題

### §6.1 既存議決（議決-1〜15）への追加 4 議決

| 議決 ID | 議題 | Review 推奨 | 根拠 |
|---|---|---|---|
| **議決-16（新規）** | DEC-019-048（1Password CLI）正式追認 | **YES** | §1 評価で 5 軸 Doppler 優位 + 5 シナリオ脅威対策完備、P-1P-01〜05 完遂前提で承認 |
| **議決-17（新規）** | DEC-019-049（Slack 新規 workspace）正式追認 | **YES** | §2 評価で誤投稿リスク低減 + 業務分離 + audit log 二重記録運用化前提で承認、P-SL-01〜03 完遂条件 |
| **議決-18（新規）** | R-019-17/18 Risk Register 追加 | **YES** | §3.1 起票候補 2 件、Risk Register v3.1 として 5/8 検収後改訂 |
| **議決-19（新規）** | Owner 検証手順 90→115 分 改訂 | **YES** | §5 で検証 5/6 追加、5/25 Owner 検証窓に統合実施 |

### §6.2 議決順序の Review 推奨

5/8 検収会議では既存議決-1〜15 の後、追加議決-16〜19 を以下順序で議決:

1. 議決-16: DEC-019-048 追認（1Password 採択）
2. 議決-17: DEC-019-049 追認（Slack 新規）
3. 議決-18: R-019-17/18 Risk Register 追加（議決-16/17 派生リスク）
4. 議決-19: Owner 検証手順改訂（議決-16/17 派生検証）

依存関係: 議決-18/19 は議決-16/17 採択後に従属議決。議決-16/17 棄却時は議決-18/19 自動撤回。

### §6.3 検収会議所要時間影響

既存 議決-1〜15（推定 90 分）+ 追加議決-16〜19（4 議決 × 5 分 = 20 分）= **110 分**（+20 分、約 22% 増）。Owner 集中力維持の観点で休憩 1 回を会議中盤に挿入することを Review 部門は推奨する。

---

## §7 結論 + 根拠 3 点

### §7.1 結論サマリ

| 評価対象 | 結論 | 残存リスク | 5 推奨/3 推奨 統制 |
|---|---|---|---|
| **DEC-019-048（1Password CLI 採択）** | **承認** | 黄（T-2 op session 漏洩を (f) ベクトルとして R-019-15 v3 に追加、residual 白）| P-1P-01〜05（5 件）|
| **DEC-019-049（Slack 新規 workspace）** | **承認** | 黄（T-S-1 webhook 漏洩 Free tier 制約、residual 黄）| P-SL-01〜03（3 件）|

### §7.2 5/8 検収会議への上程結論

議決-16/17/18/19 の 4 件を **YES 採択** することを Review 部門は強く推奨する。

### §7.3 Phase 1 着手 5/26 への影響

P-1P-01〜05 + P-SL-01〜03 を 5/22 まで完遂することが Phase 1 着手 5/26 Conditional Go の追加条件。完遂未達時は Phase 1 着手 5/26 を 1 週間延期し 6/2 に再評価。

### §7.4 Review 部門根拠 3 点

1. **既存資産流用による Owner 操作熟練度上昇**: 1Password CLI は Owner 既存契約活用で incremental cost ゼロ + 学習コスト最小、Phase 1 W0 期間内完遂が現実的。Doppler 新規導入と比較して工数削減 + ヒューマンエラー低減で運用安全性向上。
2. **業務 Slack との完全分離による PII 漏洩リスク低減**: R-019-16（ナレッジ PII 漏洩）の上流対策として、PRJ-019 専用 workspace 新規作成は業務情報との物理分離を実現、誤投稿経路を物理化。Slack Free 90 日制約は DB audit_log 二重記録（P-SL-03）で吸収可能。
3. **R-019-15 mitigation v2 への (f) ベクトル統合で網羅性向上**: 1Password CLI 採択で新規攻撃ベクトル（Secret Manager Session Exfiltration）が顕在化したが、4 層防御 + G-V2-11 + P-1P-02/03 の五重防御で residual 白化、攻撃面網羅性が v2 の 5 ベクトルから v3 の 6 ベクトルに拡張、Pen Test #1/#2 の攻撃シナリオも (f) 派生 4 攻撃を追加し計 51 攻撃で再設計（Phase 1 W2/W4 で実施）。

---

**v1 完成**: 2026-05-03（Review 部門起案、DEC-019-048/049 セキュリティ評価）
**次回更新**: 2026-05-08 W0-Week1 検収会議後（議決-16/17/18/19 結果反映 + Risk Register v3.1 改訂）
**根拠ファイル**: `decisions.md` DEC-019-048 / DEC-019-049 / `review-r019-15-mitigation-plan-v2.md` §1.2 §2 §3 §10 / `review-risk-register-v3.md` §1〜§3
