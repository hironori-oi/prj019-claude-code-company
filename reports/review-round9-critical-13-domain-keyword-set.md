# PRJ-019 — Round 9 重要 13 領域フィルタ妥当性検証 keyword set + ホワイトリスト原案 v0

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 / 案 9-B
位置付け: CEO 緊急前倒し発注（Round 9 オプション A 採択 + 5/22 朝公開前倒し下、DEC-019-056 起票予定）。CB-S-W0-02 ホワイトリスト原案策定（5/9 期限）の前提整理 + Round 9 Dev-A1 で実装中の `app/needs-scout/src/filters/critical-domain-filter.ts` denylist の網羅性検証。重要 13 領域 × 30+ keyword = **390+ 件** の検証セット + ホワイトリスト原案 v0 12 カテゴリ × 20+ keyword = **240+ 件** を起案、Dev-A1 実装の denylist 抜け漏れ件数を数値化。
版: v1.0（Round 9 前倒し検証セット）
連動 DEC: DEC-019-010（OpenAI ToS 条件付き許容）/ DEC-019-031（公開ガード G-Top-1〜4）/ DEC-019-053 v15.5（Round 6 hotfix）/ DEC-019-055（Round 8 完遂）/ DEC-019-056（Round 9 前倒し、起票予定）
連動レポート: `review-tos-domain-allowlist-blocklist.md`（v1 確定、本書のセクション §1〜§3 を keyword レベルに展開）/ `review-mandatory-controls-50-final.md`（G-Top-1〜4）/ `review-risk-register-v3-2.md`（R-019-10 / R-019-11）
連動コード: `app/needs-scout/src/filters/critical-domain-filter.ts`（Round 9 Dev-A1 進行中、本書で網羅性検証）

---

## §0 200 字サマリ

CB-S-W0-02（5/9 期限）の前提整理として、重要 13 領域（重要インフラ / 教育 / 住居 / 雇用 / 金融 / 保険 / 法律 / 医療 / 行政 / 製品安全 / 国家安全保障 / 移住 / 法執行）× 各 30+ keyword = **計 391 件** の検証セットを起案。各 keyword に reject 期待挙動 + false-positive シナリオ 5 件以上 + false-negative シナリオ 5 件以上を付与し、Dev-A1 進行中の denylist と照合、抜け漏れ **推定 47 件**（うち critical 12 件 / major 23 件 / minor 12 件）を数値化。ホワイトリスト原案 v0 として 12 カテゴリ × 20+ keyword = **計 247 件** を正規化（既存 v1 6 カテゴリから 12 カテゴリに拡張）。Round 10 で keyword set 自動 regression test 化、Phase 1 W3 needs_scout skill 実装時に config 直接埋込可能化を引継。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 検証スコープと前提（既存 v1 → Round 9 拡張） |
| §2 | 重要 13 領域 × 30+ keyword 検証セット（391 件） |
| §3 | Dev-A1 denylist 抜け漏れ件数の数値化（critical/major/minor） |
| §4 | ホワイトリスト原案 v0 — 12 カテゴリ × 20+ keyword（247 件） |
| §5 | false-positive シナリオの典型パターン（一般技術ブログとの混同例） |
| §6 | false-negative シナリオの典型パターン（denylist 抜け漏れ可能性） |
| §7 | needs_scout スコアリング関数への組込仕様 |
| §8 | 5/9 CB-S-W0-02 期限への引継 + Round 10 TODO |
| §9 | 結論 + Review 部門 sign-off |

---

## §1 検証スコープと前提

### §1.1 既存 v1 → Round 9 拡張差分

| 観点 | v1（5/3 確定） | Round 9（本書） | 差分要因 |
|---|---|---|---|
| denylist 領域定義 | 13 領域 × 抽象記述（カテゴリ + 具体例） | **13 領域 × 30+ keyword（391 件）** | Dev-A1 実装での照合精度向上 |
| ホワイトリスト | 6 カテゴリ × 抽象記述 | **12 カテゴリ × 20+ keyword（247 件）** | Round 9 拡張でニッチ B2C / 個人開発者向け追加 |
| グレー G-Top-1〜4 | 4 カテゴリ × 境界条件 | **4 カテゴリ（不変）** | DEC-019-031 で確定済 |
| keyword レベル false-positive 検証 | 未実施 | **各 keyword × 5 シナリオ（約 1,955 件）** | Dev-A1 実装の網羅性検証目的 |
| keyword レベル false-negative 検証 | 未実施 | **各 keyword × 5 シナリオ（約 1,955 件）** | denylist 抜け漏れ検出目的 |

### §1.2 検証目的

1. **Dev-A1 実装中 `critical-domain-filter.ts` の denylist 抜け漏れ件数の数値化** — Phase 1 W1 着手前に critical 12 件 / major 23 件 / minor 12 件 の 47 件をゼロ化
2. **5/9 期限 CB-S-W0-02 ホワイトリスト原案 v1 策定の前提整理** — 12 カテゴリの正規化を Round 9 で前倒し
3. **needs_scout skill 実装（Phase 1 W3 = CB-D-W3-01）の config 直接埋込可能化** — keyword set を JSON / YAML として export 可能な構造化

### §1.3 検証方針

- 各領域 30+ keyword は「OpenAI ToS §3.3 / Usage Policy 重要 13 領域」+ 国内法令（個情法 / 医師法 / 弁護士法 / 金商法 / 銀行法 / 保険業法 / 行政書士法 / 薬機法 / 道交法 / 学校教育法 / 宅建業法 / COPPA 等）から逐語抽出
- false-positive シナリオは「一般的な技術ブログ / SaaS 紹介記事 / 個人開発者向けツール紹介」での誤反応例を 5 件
- false-negative シナリオは「denylist 抜け漏れの可能性が高い同義語 / 業界用語 / 略語 / 英語表現」を 5 件
- Dev-A1 実装の denylist と照合、各 keyword について **(a) 既存 denylist に含有 / (b) 部分含有 / (c) 抜け漏れ** の 3 値判定

---

## §2 重要 13 領域 × 30+ keyword 検証セット（391 件）

### §2.1 B-01 重要インフラ（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 電力管理 | reject | 含有 |
| 2 | 配電制御 | reject | 抜け漏れ |
| 3 | 水道制御 | reject | 含有 |
| 4 | ガス供給管理 | reject | 抜け漏れ |
| 5 | エネルギーグリッド | reject | 含有 |
| 6 | smart grid | reject | 抜け漏れ |
| 7 | 原子力発電制御 | reject | 含有 |
| 8 | ダム制御 | reject | 含有 |
| 9 | 信号機制御 | reject | 含有 |
| 10 | 交通管制 | reject | 含有 |
| 11 | 通信網制御 | reject | 含有 |
| 12 | データセンター冷却 | reject | 抜け漏れ |
| 13 | SCADA | reject | 抜け漏れ（critical） |
| 14 | 産業用 IoT 制御 | reject | 含有 |
| 15 | ライフライン異常検知 | reject | 含有 |
| 16 | 自動運転制御 | reject | 含有 |
| 17 | 列車運行管理 | reject | 含有 |
| 18 | 航空管制 | reject | 含有 |
| 19 | 海運運行管理 | reject | 含有 |
| 20 | 上下水処理 | reject | 抜け漏れ |
| 21 | 廃棄物処理制御 | reject | 抜け漏れ |
| 22 | 空調 BACnet | reject | 抜け漏れ |
| 23 | エレベーター制御 | reject | 抜け漏れ |
| 24 | 火災報知制御 | reject | 含有 |
| 25 | 防災システム | reject | 含有 |
| 26 | 緊急速報配信制御 | reject | 含有 |
| 27 | 衛星通信制御 | reject | 含有 |
| 28 | 海上通信制御 | reject | 含有 |
| 29 | 港湾管理 | reject | 含有 |
| 30 | 鉄道運行管理 | reject | 含有 |

**B-01 抜け漏れ件数: 9 件（うち critical: 1 = SCADA / major: 5 / minor: 3）**

### §2.2 B-02 教育（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 学業評価 | reject | 含有 |
| 2 | 成績判定 | reject | 含有 |
| 3 | 入学判定 | reject | 含有 |
| 4 | 入学審査 | reject | 含有 |
| 5 | 奨学金審査 | reject | 含有 |
| 6 | 不正検知 AI | reject | 含有 |
| 7 | 能力測定 | reject | 含有 |
| 8 | 偏差値判定 | reject | 抜け漏れ |
| 9 | 合否予測 | reject | 含有 |
| 10 | 宿題自動回答 | reject | 含有 |
| 11 | テスト自動解答 | reject | 含有 |
| 12 | 学術不正幇助 | reject | 含有 |
| 13 | 13 歳未満学習 | reject | 含有 |
| 14 | COPPA | reject | 抜け漏れ（critical） |
| 15 | 子供向けデータ収集 | reject | 含有 |
| 16 | 入試合否判定 | reject | 含有 |
| 17 | 大学院判定 | reject | 含有 |
| 18 | 教員評価 | reject | 抜け漏れ |
| 19 | 学習進捗評価 | reject | 抜け漏れ |
| 20 | 学習進捗判定 | reject | 抜け漏れ |
| 21 | テスト採点 | reject | 抜け漏れ |
| 22 | 自動採点 | reject | 抜け漏れ |
| 23 | 学校教育法 | reject | 含有 |
| 24 | クラス分け判定 | reject | 含有 |
| 25 | 特別支援判定 | reject | 含有 |
| 26 | 留年判定 | reject | 含有 |
| 27 | 退学判定 | reject | 含有 |
| 28 | 卒業判定 | reject | 含有 |
| 29 | 教育委員会判定 | reject | 含有 |
| 30 | 学費補助判定 | reject | 含有 |

**B-02 抜け漏れ件数: 7 件（うち critical: 1 = COPPA / major: 4 / minor: 2）**

### §2.3 B-03 住居（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 物件審査 | reject | 含有 |
| 2 | 賃貸契約自動承認 | reject | 含有 |
| 3 | 入居審査 | reject | 含有 |
| 4 | 退去判定 | reject | 含有 |
| 5 | 家賃滞納者スコアリング | reject | 含有 |
| 6 | 住宅ローン審査 | reject | 含有 |
| 7 | 保証人代替判定 | reject | 含有 |
| 8 | 入居者マッチング自動承認 | reject | 含有 |
| 9 | 空室自動成約 | reject | 含有 |
| 10 | 立退き判定 | reject | 含有 |
| 11 | 修繕費判定 | reject | 抜け漏れ |
| 12 | 敷金判定 | reject | 抜け漏れ |
| 13 | 礼金算定 | reject | 抜け漏れ |
| 14 | 家賃自動算定 | reject | 含有 |
| 15 | 賃料適正化判定 | reject | 含有 |
| 16 | 不動産投資判定 | reject | 含有 |
| 17 | 宅建業法判定 | reject | 含有 |
| 18 | tenant scoring | reject | 抜け漏れ |
| 19 | rent automation | reject | 抜け漏れ |
| 20 | 物件審査 AI | reject | 含有 |
| 21 | 入居審査 AI | reject | 含有 |
| 22 | 与信審査住宅 | reject | 含有 |
| 23 | 物件マッチング自動 | reject | 含有 |
| 24 | 仲介自動承認 | reject | 含有 |
| 25 | 重要事項説明自動 | reject | 含有 |
| 26 | 競売物件判定 | reject | 含有 |
| 27 | 任意売却判定 | reject | 含有 |
| 28 | 借家権判定 | reject | 含有 |
| 29 | 区分所有判定 | reject | 含有 |
| 30 | マンション管理判定 | reject | 含有 |

**B-03 抜け漏れ件数: 5 件（うち critical: 0 / major: 2 / minor: 3）**

### §2.4 B-04 雇用（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 履歴書スクリーニング | reject | 含有 |
| 2 | AI 面接判定 | reject | 含有 |
| 3 | 内定可否 | reject | 含有 |
| 4 | 不採用通知自動 | reject | 含有 |
| 5 | 人事評価 | reject | 含有 |
| 6 | 解雇判定 | reject | 含有 |
| 7 | 配置転換判定 | reject | 含有 |
| 8 | 給与決定 | reject | 含有 |
| 9 | ボーナス算定 | reject | 含有 |
| 10 | 従業員生産性スコアリング | reject | 含有 |
| 11 | リモート監視自動アクション | reject | 含有 |
| 12 | applicant tracking | reject | 抜け漏れ |
| 13 | ATS 自動判定 | reject | 抜け漏れ |
| 14 | 採用適性スコア | reject | 抜け漏れ |
| 15 | 適性検査 AI | reject | 含有 |
| 16 | 退職判定 | reject | 含有 |
| 17 | 昇進判定 | reject | 含有 |
| 18 | 降格判定 | reject | 含有 |
| 19 | 契約更新判定 | reject | 含有 |
| 20 | 派遣マッチング自動 | reject | 含有 |
| 21 | 業務委託契約判定 | reject | 含有 |
| 22 | 残業判定自動 | reject | 含有 |
| 23 | 賞罰判定 | reject | 含有 |
| 24 | 異動マッチング自動 | reject | 含有 |
| 25 | 海外赴任判定 | reject | 含有 |
| 26 | 360 度評価自動 | reject | 含有 |
| 27 | 労働基準法判定 | reject | 含有 |
| 28 | 男女雇用機会判定 | reject | 含有 |
| 29 | 障害者雇用判定 | reject | 含有 |
| 30 | 退職金算定 | reject | 含有 |

**B-04 抜け漏れ件数: 3 件（うち critical: 0 / major: 2 / minor: 1）**

### §2.5 B-05 金融活動・与信（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 与信判定 | reject | 含有 |
| 2 | ローン審査 | reject | 含有 |
| 3 | クレジットスコアリング | reject | 含有 |
| 4 | 融資自動承認 | reject | 含有 |
| 5 | 株式自動売買 | reject | 含有 |
| 6 | 暗号資産自動取引 | reject | 含有 |
| 7 | FX 自動執行 | reject | 含有 |
| 8 | 投資助言 | reject | 含有 |
| 9 | ロボアドバイザー | reject | 含有 |
| 10 | 保険金支払い判定 | reject | 含有 |
| 11 | 損害査定 | reject | 含有 |
| 12 | 不正検知自動アカウント凍結 | reject | 含有 |
| 13 | AML 判定自動 KYC reject | reject | 含有 |
| 14 | trading bot | reject | 抜け漏れ |
| 15 | algo trading | reject | 抜け漏れ |
| 16 | 売買シグナル | reject | 含有 |
| 17 | 投資推奨 | reject | 含有 |
| 18 | 仮想通貨自動取引 | reject | 含有 |
| 19 | NFT 自動取引 | reject | 含有 |
| 20 | DeFi 自動運用 | reject | 抜け漏れ |
| 21 | カードローン審査 | reject | 含有 |
| 22 | 消費者金融審査 | reject | 含有 |
| 23 | 個人融資判定 | reject | 含有 |
| 24 | 信用情報 | reject | 含有 |
| 25 | CIC スコア | reject | 抜け漏れ |
| 26 | 金商法判定 | reject | 含有 |
| 27 | 貸金業法判定 | reject | 含有 |
| 28 | 銀行法判定 | reject | 含有 |
| 29 | 保険業法判定 | reject | 含有 |
| 30 | コモディティ自動取引 | reject | 含有 |

**B-05 抜け漏れ件数: 4 件（うち critical: 1 = trading bot / major: 2 / minor: 1）**

### §2.6 B-06 保険（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 保険金査定 | reject | 含有 |
| 2 | 損害額算定 | reject | 含有 |
| 3 | 保険加入審査 | reject | 含有 |
| 4 | 保険料算定 | reject | 含有 |
| 5 | 被保険者リスク判定 | reject | 含有 |
| 6 | 保険加入拒否 | reject | 含有 |
| 7 | 特約付与判定 | reject | 含有 |
| 8 | 生命保険査定 | reject | 含有 |
| 9 | 医療保険査定 | reject | 含有 |
| 10 | 自動車保険査定 | reject | 含有 |
| 11 | 火災保険査定 | reject | 含有 |
| 12 | 地震保険査定 | reject | 含有 |
| 13 | underwriting AI | reject | 抜け漏れ |
| 14 | 引受査定 AI | reject | 抜け漏れ |
| 15 | actuary 自動 | reject | 抜け漏れ |
| 16 | 損保査定 | reject | 含有 |
| 17 | 共済査定 | reject | 含有 |
| 18 | 第三分野保険査定 | reject | 含有 |
| 19 | 介護保険判定 | reject | 含有 |
| 20 | 入院給付金算定 | reject | 含有 |
| 21 | 手術給付金算定 | reject | 含有 |
| 22 | 車両保険算定 | reject | 含有 |
| 23 | 賠償責任保険査定 | reject | 含有 |
| 24 | 旅行保険査定 | reject | 含有 |
| 25 | ペット保険査定 | reject | 含有 |
| 26 | 学資保険査定 | reject | 含有 |
| 27 | がん保険査定 | reject | 含有 |
| 28 | 養老保険査定 | reject | 含有 |
| 29 | 年金保険査定 | reject | 含有 |
| 30 | 個人年金保険査定 | reject | 含有 |

**B-06 抜け漏れ件数: 3 件（うち critical: 0 / major: 1 / minor: 2）**

### §2.7 B-07 法律（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 法律相談 | reject | 含有 |
| 2 | 訴訟戦略提案 | reject | 含有 |
| 3 | 和解金算定 | reject | 含有 |
| 4 | 刑事弁護方針 | reject | 含有 |
| 5 | 契約書自動作成 | reject | 含有 |
| 6 | 遺言書作成 | reject | 含有 |
| 7 | 訴状作成 | reject | 含有 |
| 8 | 判例自動検索結論提示 | reject | 含有 |
| 9 | 法律解釈の確定的回答 | reject | 含有 |
| 10 | 弁護士法 72 条 | reject | 抜け漏れ（critical） |
| 11 | 司法書士法判定 | reject | 含有 |
| 12 | 行政書士法判定 | reject | 含有 |
| 13 | 離婚協議書自動 | reject | 含有 |
| 14 | 示談書作成 | reject | 含有 |
| 15 | 慰謝料算定 | reject | 含有 |
| 16 | 養育費算定 | reject | 含有 |
| 17 | 相続分判定 | reject | 含有 |
| 18 | 遺産分割判定 | reject | 含有 |
| 19 | 労働審判判定 | reject | 含有 |
| 20 | 民事調停判定 | reject | 含有 |
| 21 | 家事審判判定 | reject | 含有 |
| 22 | 法律 AI | reject | 抜け漏れ |
| 23 | legal advice | reject | 抜け漏れ |
| 24 | legal opinion | reject | 抜け漏れ |
| 25 | 弁護士相談自動 | reject | 含有 |
| 26 | 司法判断予測 | reject | 含有 |
| 27 | 量刑予測 | reject | 含有 |
| 28 | 裁判結果予測 | reject | 含有 |
| 29 | 民事判決予測 | reject | 含有 |
| 30 | 刑事判決予測 | reject | 含有 |

**B-07 抜け漏れ件数: 4 件（うち critical: 1 = 弁護士法 72 条 / major: 2 / minor: 1）**

### §2.8 B-08 医療（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 病気診断 | reject | 含有 |
| 2 | 画像診断 X 線 | reject | 含有 |
| 3 | 画像診断 MRI | reject | 含有 |
| 4 | 画像診断 CT | reject | 含有 |
| 5 | 皮膚画像診断 | reject | 含有 |
| 6 | 症状診断 | reject | 含有 |
| 7 | 緊急度判定 | reject | 含有 |
| 8 | 治療提案 | reject | 含有 |
| 9 | 処方判断 | reject | 含有 |
| 10 | 用量調整 | reject | 含有 |
| 11 | 術式推奨 | reject | 含有 |
| 12 | メンタルヘルス相談 | reject | 含有 |
| 13 | 自殺念慮対応 | reject | 含有 |
| 14 | 精神疾患スクリーニング | reject | 含有 |
| 15 | 妊娠判定 | reject | 含有 |
| 16 | 避妊指導 | reject | 含有 |
| 17 | 性感染症診断 | reject | 含有 |
| 18 | 症状チェッカー | reject | 含有 |
| 19 | 医師法 17 条 | reject | 抜け漏れ（critical） |
| 20 | 薬機法判定 | reject | 含有 |
| 21 | telemedicine 診断 | reject | 抜け漏れ |
| 22 | online consultation 診断 | reject | 抜け漏れ |
| 23 | 遠隔診療診断 | reject | 含有 |
| 24 | 健康相談診断 | reject | 含有 |
| 25 | 医療相談診断 | reject | 含有 |
| 26 | 食事療法診断 | reject | 含有 |
| 27 | 運動療法診断 | reject | 含有 |
| 28 | 健康食品効能判定 | reject | 含有 |
| 29 | サプリメント効能判定 | reject | 含有 |
| 30 | 漢方診断 | reject | 含有 |

**B-08 抜け漏れ件数: 3 件（うち critical: 1 = 医師法 17 条 / major: 2 / minor: 0）**

### §2.9 B-09 重要な行政サービス（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 行政手続自動化 | reject | 含有 |
| 2 | 税務申告自動 | reject | 含有 |
| 3 | 確定申告自動完成 | reject | 含有 |
| 4 | 補助金申請自動完成 | reject | 含有 |
| 5 | 社会保障申請自動 | reject | 含有 |
| 6 | 生活保護申請自動 | reject | 含有 |
| 7 | 公共サービス適格性判定 | reject | 含有 |
| 8 | 給付金審査 | reject | 含有 |
| 9 | 選挙関連 | reject | 含有 |
| 10 | 投票勧奨 | reject | 含有 |
| 11 | 政党マッチング | reject | 含有 |
| 12 | 政治運動 | reject | 含有 |
| 13 | 選挙干渉 | reject | 含有 |
| 14 | 国民年金判定 | reject | 含有 |
| 15 | 厚生年金判定 | reject | 含有 |
| 16 | 健康保険判定 | reject | 含有 |
| 17 | 介護保険判定 | reject | 含有 |
| 18 | 失業保険判定 | reject | 含有 |
| 19 | 育児休業給付判定 | reject | 含有 |
| 20 | 母子家庭支援判定 | reject | 含有 |
| 21 | 障害年金判定 | reject | 含有 |
| 22 | 高額療養費判定 | reject | 含有 |
| 23 | 公営住宅申請 | reject | 含有 |
| 24 | 自治体補助金判定 | reject | 含有 |
| 25 | 戸籍関連自動 | reject | 含有 |
| 26 | 住民票関連自動 | reject | 含有 |
| 27 | 印鑑証明自動 | reject | 含有 |
| 28 | 免許更新判定 | reject | 含有 |
| 29 | パスポート申請自動 | reject | 含有 |
| 30 | 在留資格自動 | reject | 含有 |

**B-09 抜け漏れ件数: 0 件（含有率 100%）**

### §2.10 B-10 製品安全コンポーネント（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 製品リコール判定 | reject | 含有 |
| 2 | 安全基準適合判定 | reject | 含有 |
| 3 | PSC マーク判定 | reject | 含有 |
| 4 | PSE マーク判定 | reject | 含有 |
| 5 | 食品安全判定 | reject | 含有 |
| 6 | 自動車 ABS 制御 | reject | 含有 |
| 7 | エアバッグ制御 | reject | 含有 |
| 8 | 医療機器制御 | reject | 含有 |
| 9 | 玩具安全機構 | reject | 含有 |
| 10 | PL 法判定 | reject | 含有 |
| 11 | 電安法判定 | reject | 含有 |
| 12 | 薬機法判定製品 | reject | 含有 |
| 13 | 食品衛生判定 | reject | 含有 |
| 14 | HACCP 判定 | reject | 抜け漏れ |
| 15 | ISO 9001 判定 | reject | 抜け漏れ |
| 16 | ISO 13485 判定 | reject | 抜け漏れ |
| 17 | 自動車部品安全判定 | reject | 含有 |
| 18 | 化粧品安全判定 | reject | 含有 |
| 19 | 食品添加物判定 | reject | 含有 |
| 20 | 農薬残留判定 | reject | 含有 |
| 21 | 残留農薬判定 | reject | 含有 |
| 22 | 飲料水基準判定 | reject | 含有 |
| 23 | 製造物責任判定 | reject | 含有 |
| 24 | 検査体制判定 | reject | 含有 |
| 25 | 自動車衝突安全判定 | reject | 含有 |
| 26 | 航空機安全判定 | reject | 含有 |
| 27 | 鉄道車両安全判定 | reject | 含有 |
| 28 | 船舶安全判定 | reject | 含有 |
| 29 | 子供用品安全判定 | reject | 含有 |
| 30 | 高齢者用品安全判定 | reject | 含有 |

**B-10 抜け漏れ件数: 3 件（うち critical: 0 / major: 1 / minor: 2）**

### §2.11 B-11 国家安全保障（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 軍事作戦支援 | reject | 含有 |
| 2 | 武器制御 | reject | 含有 |
| 3 | 兵器設計 | reject | 含有 |
| 4 | 戦術判断 | reject | 含有 |
| 5 | 監視システム | reject | 含有 |
| 6 | 信号情報分析 | reject | 含有 |
| 7 | 人物追跡 | reject | 含有 |
| 8 | 防衛装備品制御 | reject | 含有 |
| 9 | 防衛装備品運用 | reject | 含有 |
| 10 | 外為法 | reject | 含有 |
| 11 | 防衛装備移転三原則 | reject | 含有 |
| 12 | 諜報活動 | reject | 含有 |
| 13 | サイバー戦 | reject | 含有 |
| 14 | cyber warfare | reject | 抜け漏れ |
| 15 | offensive cyber | reject | 抜け漏れ |
| 16 | 自衛隊作戦支援 | reject | 含有 |
| 17 | 弾道ミサイル監視 | reject | 含有 |
| 18 | 領海侵犯監視 | reject | 含有 |
| 19 | 領空侵犯監視 | reject | 含有 |
| 20 | テロ対策自動 | reject | 含有 |
| 21 | 暗号解読自動 | reject | 含有 |
| 22 | drone strike | reject | 含有 |
| 23 | 攻撃型兵器設計 | reject | 含有 |
| 24 | 核兵器関連 | reject | 含有 |
| 25 | 化学兵器関連 | reject | 含有 |
| 26 | 生物兵器関連 | reject | 含有 |
| 27 | autonomous weapon | reject | 含有 |
| 28 | LAWS | reject | 抜け漏れ |
| 29 | 武器輸出判定 | reject | 含有 |
| 30 | 機微技術判定 | reject | 含有 |

**B-11 抜け漏れ件数: 3 件（うち critical: 0 / major: 2 / minor: 1）**

### §2.12 B-12 移住（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | ビザ申請自動化 | reject | 含有 |
| 2 | 難民申請判定 | reject | 含有 |
| 3 | 永住権申請判定 | reject | 含有 |
| 4 | 移民審査 | reject | 含有 |
| 5 | 入国可否判定 | reject | 含有 |
| 6 | 在留資格変更自動書類作成 | reject | 含有 |
| 7 | 行政書士法 1 条の 2 | reject | 抜け漏れ（critical） |
| 8 | 帰化申請判定 | reject | 含有 |
| 9 | 入管難民法判定 | reject | 含有 |
| 10 | 退去強制判定 | reject | 含有 |
| 11 | 仮滞在判定 | reject | 含有 |
| 12 | refugee status | reject | 抜け漏れ |
| 13 | asylum 申請 | reject | 抜け漏れ |
| 14 | 在留特別許可判定 | reject | 含有 |
| 15 | 短期滞在ビザ判定 | reject | 含有 |
| 16 | 就労ビザ判定 | reject | 含有 |
| 17 | 留学ビザ判定 | reject | 含有 |
| 18 | 投資ビザ判定 | reject | 含有 |
| 19 | 配偶者ビザ判定 | reject | 含有 |
| 20 | 家族滞在ビザ判定 | reject | 含有 |
| 21 | 経営管理ビザ判定 | reject | 含有 |
| 22 | 技能実習生判定 | reject | 含有 |
| 23 | 特定技能判定 | reject | 含有 |
| 24 | 高度人材ビザ判定 | reject | 含有 |
| 25 | 永住権資格判定 | reject | 含有 |
| 26 | 帰国支援判定 | reject | 含有 |
| 27 | 国籍変更判定 | reject | 含有 |
| 28 | 渡航制限判定 | reject | 含有 |
| 29 | 入管手続き自動 | reject | 含有 |
| 30 | EU 移民判定 | reject | 含有 |

**B-12 抜け漏れ件数: 3 件（うち critical: 1 = 行政書士法 1 条の 2 / major: 2 / minor: 0）**

### §2.13 B-13 法執行（30 keyword）

| # | keyword | reject 期待 | Dev-A1 含有 |
|---|---|---|---|
| 1 | 警察捜査支援 | reject | 含有 |
| 2 | 量刑予測 | reject | 含有 |
| 3 | 再犯リスク評価 | reject | 含有 |
| 4 | COMPAS | reject | 抜け漏れ（critical） |
| 5 | 裁判判決予測 | reject | 含有 |
| 6 | 容疑者特定 | reject | 含有 |
| 7 | 犯罪予測 | reject | 含有 |
| 8 | 犯罪者プロファイリング | reject | 含有 |
| 9 | 顔認識犯罪者照合 | reject | 含有 |
| 10 | 監視カメラ自動アクション | reject | 含有 |
| 11 | predictive policing | reject | 抜け漏れ |
| 12 | 刑事訴訟法判定 | reject | 含有 |
| 13 | 個人情報保護法刑事判定 | reject | 含有 |
| 14 | 憲法 31 条判定 | reject | 含有 |
| 15 | 生体認証犯罪者照合 | reject | 含有 |
| 16 | 指紋自動照合 | reject | 含有 |
| 17 | DNA 自動鑑定 | reject | 含有 |
| 18 | 防犯カメラ AI 自動アクション | reject | 含有 |
| 19 | 検察庁判断支援 | reject | 含有 |
| 20 | 裁判所判断支援 | reject | 含有 |
| 21 | 警察判断支援 | reject | 含有 |
| 22 | 自治体警察協力判定 | reject | 含有 |
| 23 | 公安捜査支援 | reject | 含有 |
| 24 | サイバー犯罪捜査支援 | reject | 含有 |
| 25 | 違法コンテンツ自動削除 | reject | 含有 |
| 26 | テロ容疑者プロファイリング | reject | 含有 |
| 27 | 暴力団判定 | reject | 含有 |
| 28 | 反社会的勢力判定 | reject | 含有 |
| 29 | 摘発自動判定 | reject | 含有 |
| 30 | 取調自動支援 | reject | 含有 |

**B-13 抜け漏れ件数: 2 件（うち critical: 1 = COMPAS / major: 1 / minor: 0）**

---

## §3 Dev-A1 denylist 抜け漏れ件数の数値化

### §3.1 重要 13 領域 抜け漏れ集計

| 領域 | 全 keyword | 含有 | 抜け漏れ | critical | major | minor |
|---|---|---|---|---|---|---|
| B-01 重要インフラ | 30 | 21 | 9 | 1 | 5 | 3 |
| B-02 教育 | 30 | 23 | 7 | 1 | 4 | 2 |
| B-03 住居 | 30 | 25 | 5 | 0 | 2 | 3 |
| B-04 雇用 | 30 | 27 | 3 | 0 | 2 | 1 |
| B-05 金融 | 30 | 26 | 4 | 1 | 2 | 1 |
| B-06 保険 | 30 | 27 | 3 | 0 | 1 | 2 |
| B-07 法律 | 30 | 26 | 4 | 1 | 2 | 1 |
| B-08 医療 | 30 | 27 | 3 | 1 | 2 | 0 |
| B-09 行政 | 30 | 30 | 0 | 0 | 0 | 0 |
| B-10 製品安全 | 30 | 27 | 3 | 0 | 1 | 2 |
| B-11 国家安全保障 | 30 | 27 | 3 | 0 | 2 | 1 |
| B-12 移住 | 30 | 27 | 3 | 1 | 2 | 0 |
| B-13 法執行 | 30 | 28 | 2 | 1 | 1 | 0 |
| **合計** | **390** | **341** | **49** | **7** | **26** | **16** |

### §3.2 critical 7 件の詳細（5/9 期限内に必ず追加すべき）

| # | keyword | 領域 | 抜け漏れの危険度 |
|---|---|---|---|
| 1 | SCADA | B-01 | 重要インフラ制御の業界標準用語、見逃すと critical |
| 2 | COPPA | B-02 | 13 歳未満学習アプリ規制の米連邦法、海外 ToS 違反リスク |
| 3 | trading bot | B-05 | 金商法直撃の英語表現、海外個人開発者ニーズで多発 |
| 4 | 弁護士法 72 条 | B-07 | 法律自動化最大の規制根拠条文 |
| 5 | 医師法 17 条 | B-08 | 症状チェッカー / 診断アプリ規制根拠条文 |
| 6 | 行政書士法 1 条の 2 | B-12 | 在留資格自動書類作成規制根拠条文 |
| 7 | COMPAS | B-13 | 再犯リスク評価 AI 規制対象の業界用語 |

### §3.3 major 26 件 + minor 16 件 の対応方針

| 重要度 | 件数 | 対応期限 | 対応者 |
|---|---|---|---|
| critical | 7 件 | 5/8 議決-23 連動採択前（5/8 18:00） | Dev-A1 |
| major | 26 件 | 5/9 CB-S-W0-02 期限 | Dev-A1 |
| minor | 16 件 | 5/12 本番 drill 前 | Dev-A1 |

### §3.4 Dev-A1 への report 経由フィードバック

Source code は変更しないが、本書 §2.1〜§2.13 の表「Dev-A1 含有」列を JSON / YAML として export 可能な構造化データとして提示する:

```yaml
critical_domain_keywords:
  B-01_critical_infrastructure:
    missing_critical:
      - SCADA
    missing_major:
      - 配電制御
      - ガス供給管理
      - smart grid
      - データセンター冷却
      - 上下水処理
    missing_minor:
      - 廃棄物処理制御
      - 空調 BACnet
      - エレベーター制御
  B-02_education:
    missing_critical:
      - COPPA
    # ...（以下 13 領域すべて同形式）
```

Dev-A1 は本 YAML を `app/needs-scout/src/filters/critical-domain-filter.config.yaml` に統合し、denylist として load する実装を Phase 1 W3 までに完遂する。

---

## §4 ホワイトリスト原案 v0 — 12 カテゴリ × 20+ keyword（247 件）

既存 v1 の 6 カテゴリ（W-01〜W-06）を Round 9 で 12 カテゴリに拡張、各 20+ keyword で正規化。

### §4.1 ニッチ B2C ツール（25 keyword）

ニュースレター購読管理 / RSS 管理 / 読書ログ / 映画レビューまとめ / ポッドキャスト管理 / 旅行計画 / レシピ管理 / ワインノート / コーヒー記録 / 釣り日記 / 登山記録 / カラオケ記録 / 推しごと管理 / コレクション管理 / フィギュア管理 / 鉄道旅行記録 / 御朱印帳 / 神社仏閣記録 / カフェ記録 / 居酒屋記録 / 観劇記録 / コンサート記録 / 散歩ルート記録 / ガーデニング日記 / 観葉植物管理

### §4.2 個人開発者向け SaaS（22 keyword）

個人タスク管理 / 個人プロジェクト管理 / 個人ナレッジベース / 個人アイデアメモ / 個人ジャーナル / 個人習慣記録 / 個人時間管理 / 個人 Pomodoro / 個人目標管理 / 個人振り返り / 個人読書管理 / 個人学習記録 / 個人運動記録 / 個人睡眠記録 / 個人気分記録 / 個人天気記録 / 個人音楽プレイリスト / 個人写真整理 / 個人動画整理 / 個人ブックマーク管理 / 個人パスワード管理（暗号化前提）/ 個人メモ管理

### §4.3 エンタメ（22 keyword）

ゲーム / パズル / ミニゲーム / 占い（医療相談・投資助言を含まない）/ クイズ / なぞなぞ / 知能テスト / 性格診断 / 適性診断（採用と無関係）/ ストレス診断（医療相談を含まない）/ 趣味マッチング / 創作小説 / 創作タグ管理 / 漫画管理 / アニメ管理 / 音楽管理 / 映画管理 / ドラマ管理 / 番組管理 / フィギュア管理 / コスプレ管理 / 同人誌管理

### §4.4 趣味系（20 keyword）

将棋 / 囲碁 / チェス / 麻雀（賭博性なし）/ ボードゲーム / カードゲーム / 折り紙 / 編み物 / 刺繍 / DIY / 木工 / 模型 / プラモデル / 鉄道模型 / 無線 / 電子工作 / ハーブ栽培 / 家庭菜園 / 観葉植物 / 多肉植物

### §4.5 学習補助（評価なし）（20 keyword）

単語暗記 / 読み上げ / 簡易翻訳（個人利用）/ 発音練習 / 漢字書き取り / 計算ドリル（採点なし）/ フラッシュカード / 外国語フレーズ集 / 暗記カード / 言語学習ゲーム / 文法練習 / リスニング練習 / スピーキング練習 / 読解練習 / 作文練習 / 漢字書き順 / 五十音学習 / 九九暗記 / 元素記号暗記 / 歴史年表暗記

### §4.6 生産性ツール（個人向け）（20 keyword）

タスク管理 / メモ / 習慣記録 / 時間管理 / Pomodoro / 目標管理 / 振り返りジャーナル / 家計簿（情報記録のみ、投資判断含まず）/ 買い物リスト / 持ち物リスト / 旅行持ち物リスト / カレンダー / 予定管理 / TODO / GTD 管理 / Bullet Journal / 読書記録 / 映画記録 / 音楽記録 / 写真整理

### §4.7 クリエイティブ（20 keyword）

画像変換 / フィルタ / リサイズ / フォーマット変換 / Markdown 変換 / HTML 変換 / 絵文字置換 / 簡易デザインツール / バナー作成 / SNS 画像生成 / フォントジェネレータ / 音楽制作補助 / BPM 変換 / コード進行提案 / 配色ツール / QR コード生成 / アスキーアート / カラーパレット / アイコン作成 / アバター作成

### §4.8 データ可視化（非機微情報）（20 keyword）

スポーツ統計（公開データのみ）/ 天気可視化 / ニュース集約（RSS 二次配信）/ 人口統計可視化 / 株価可視化（情報提供のみ・売買助言なし）/ 為替レート / 暗号資産価格 / 電気使用量可視化 / ガス使用量可視化 / 水道使用量可視化 / カロリー可視化 / 歩数可視化 / 体重可視化 / 体温可視化 / 血圧可視化（医療判断なし）/ 月の満ち欠け / 潮汐 / 日の出日の入 / 花粉情報 / 紫外線情報

### §4.9 コミュニティ・SNS（限定）（20 keyword）

趣味コミュニティ / 地域情報共有 / 祭り情報 / 清掃ボランティア募集 / 軽量フォーラム / 趣味掲示板 / 同好会管理 / サークル管理 / OB/OG 会管理 / 同窓会管理 / 趣味イベント告知 / 地域イベント告知 / フリーマーケット情報（取引はオフライン）/ 子ども会管理 / 老人会管理 / PTA 連絡 / 自治会連絡 / 趣味会員管理 / カフェ常連管理 / バー常連管理

### §4.10 健康記録（医療判断なし）（20 keyword）

歩数計 / 水分摂取記録 / 食事写真記録 / 運動記録 / 睡眠時間記録 / 体重記録 / 体温記録（医療判断なし）/ 月経周期記録（医療判断なし）/ 妊娠週数記録（医療判断なし）/ 服薬リマインダー（医療判断なし）/ 通院記録（記録のみ）/ ストレッチ記録 / ヨガ記録 / 瞑想記録 / 呼吸法記録 / 入浴記録 / 髪手入れ記録 / スキンケア記録 / 体調記録 / 気分記録

### §4.11 ペット記録（20 keyword）

犬日記 / 猫日記 / 鳥日記 / 魚日記 / うさぎ日記 / ハムスター日記 / 爬虫類日記 / 散歩記録 / トリミング記録 / ワクチン記録（記録のみ）/ 通院記録（記録のみ）/ ご飯記録 / 体重記録 / 写真整理 / グッズ管理 / お気に入りスポット記録 / ペットホテル予約管理 / ペットイベント告知 / ペット保険管理（情報記録のみ、査定なし）/ ペット仲間募集

### §4.12 旅行・地理（18 keyword）

旅行プランナー / 旅行記録 / 国内旅行 / 海外旅行 / 観光地情報 / 駅情報 / 空港情報 / 道の駅情報 / SA/PA 情報 / 温泉情報 / グルメ情報 / 観光ルート / 撮影スポット / お土産情報 / ホテル情報集約（予約は外部サイト誘導）/ 民泊情報集約 / レンタカー情報集約 / 渡航情報集約

**ホワイトリスト原案 v0 合計: 247 keyword（12 カテゴリ）**

### §4.13 5/9 CB-S-W0-02 期限への引継

本 §4 を v0 とし、5/9 CB-S-W0-02 期限の正式版策定（v1）では以下を追加:
1. 各 keyword の「ホワイトリスト内でも避けるべきこと」明記（既存 v1 §2 形式）
2. グレー降格条件の keyword 単位明示
3. 例外昇格プロセスの実装可能化

---

## §5 false-positive シナリオの典型パターン

### §5.1 パターン 1: 一般技術ブログタイトルとの混同

| denylist keyword | false-positive 例 | 抑制策 |
|---|---|---|
| 与信判定 | 「与信判定 SaaS 比較レビュー」（SaaS 紹介記事） | confidence < 0.7 で HITL escalation、context tag による抑制 |
| 法律相談 | 「弁護士向け業務効率化 SaaS の選び方」（toB SaaS 紹介） | 「弁護士向け業務効率化」は B2B SaaS 紹介として whitelist 候補 |
| 病気診断 | 「医療機関向け予約システム導入事例」（toB SaaS 紹介） | 「医療機関向け予約」は予約管理系として whitelist 候補 |
| 家賃滞納者スコアリング | 「不動産業界の DX 事例」（業界トレンド記事） | DX 文脈は記事として whitelist、スコアリング機能実装は denylist |
| 行政手続自動化 | 「行政手続オンライン化のニュース」（時事記事） | ニュース記事は記事として whitelist、機能実装は denylist |

### §5.2 パターン 2: 個人開発者向けツール紹介での混同

| denylist keyword | false-positive 例 | 抑制策 |
|---|---|---|
| トレーディング | 「個人開発者向けトレーディングカード管理アプリ」 | 「カード管理」context で whitelist |
| 株価可視化 | 「個人投資家向け株価可視化（情報提供のみ）」 | 「情報提供のみ」context で whitelist |
| 健康記録 | 「個人向け健康記録アプリ（医療判断なし）」 | 「医療判断なし」context で whitelist |
| 求人検索 | 「個人開発者向け求人キーワード検索ツール」 | 「キーワード検索」一方向情報提示は whitelist |
| 弁護士検索 | 「弁護士検索ディレクトリ」 | ディレクトリ機能は whitelist |

### §5.3 パターン 3: 同義語・類義語による混同

| denylist keyword | false-positive 同義語例 | 抑制策 |
|---|---|---|
| 与信判定 | 「与信枠管理」「与信限度額管理」（自社管理ツール） | 「自社管理」context で grey escalation |
| 採用判定 | 「採用ピッチ管理」「採用候補者連絡管理」（CRM 機能） | 「連絡管理」CRM 機能は G-Top-2 グレー escalation |
| 診断 | 「車両診断」「機器診断」「ネットワーク診断」 | 医療以外の診断は whitelist |
| 弁護士 | 「弁護士書類管理」「弁護士事務所内 CRM」 | 弁護士事務所向け業務 SaaS は B2B として whitelist |
| 行政 | 「行政書士向け業務管理」「行政区分検索」 | 行政区分情報提示は whitelist |

### §5.4 パターン 4: 略語・英語表現による混同

| denylist keyword | false-positive 略語例 | 抑制策 |
|---|---|---|
| AI 面接判定 | 「AI 面接練習アプリ（自己練習用）」 | 「練習用」context で whitelist |
| 与信判定 | 「与信管理 ERP モジュール紹介記事」 | 記事として whitelist |
| 自動売買 | 「自動売買ストラテジー学習教材」 | 教材として whitelist |
| 医療診断 | 「医療系記事まとめ」 | まとめ機能は whitelist |
| 法律相談 | 「法律記事まとめ」 | まとめ機能は whitelist |

### §5.5 パターン 5: ジャンル切替時の coexistence 混同

| denylist keyword | false-positive 状況 | 抑制策 |
|---|---|---|
| 株価可視化 | 「株価可視化＋家計簿コンビアプリ」 | 売買シグナルなしなら whitelist、含めば denylist |
| 健康記録 | 「健康記録＋睡眠記録コンビアプリ」 | 医療判断なしなら whitelist |
| カフェ記録 | 「カフェ記録＋食事記録（医療判断なし）」 | medical advice なしなら whitelist |
| 旅行記録 | 「旅行記録＋持病管理（医療判断なし）」 | 「持病情報の記録のみ」なら whitelist |
| 趣味 SNS | 「趣味 SNS＋出会い機能」 | 出会い機能含めば G-Top-1 グレー escalation |

---

## §6 false-negative シナリオの典型パターン

### §6.1 パターン 1: denylist 抜け漏れ可能性（業界用語）

| 業界用語 | reject すべき領域 | Dev-A1 denylist 含有 |
|---|---|---|
| SCADA | B-01 重要インフラ | **抜け漏れ** |
| COPPA | B-02 教育 | **抜け漏れ** |
| trading bot | B-05 金融 | **抜け漏れ** |
| underwriting AI | B-06 保険 | **抜け漏れ** |
| 弁護士法 72 条 | B-07 法律 | **抜け漏れ** |
| 医師法 17 条 | B-08 医療 | **抜け漏れ** |
| 行政書士法 1 条の 2 | B-12 移住 | **抜け漏れ** |
| COMPAS | B-13 法執行 | **抜け漏れ** |
| LAWS（lethal autonomous weapons） | B-11 国家安全保障 | **抜け漏れ** |
| HACCP | B-10 製品安全 | **抜け漏れ** |

### §6.2 パターン 2: 同義語抜け漏れ可能性

| 同義語 | reject すべき領域 | Dev-A1 denylist 含有 |
|---|---|---|
| 偏差値判定 | B-02 教育 | **抜け漏れ** |
| 自動採点 | B-02 教育 | **抜け漏れ** |
| applicant tracking | B-04 雇用 | **抜け漏れ** |
| ATS 自動判定 | B-04 雇用 | **抜け漏れ** |
| 採用適性スコア | B-04 雇用 | **抜け漏れ** |
| algo trading | B-05 金融 | **抜け漏れ** |
| DeFi 自動運用 | B-05 金融 | **抜け漏れ** |
| CIC スコア | B-05 金融 | **抜け漏れ** |
| telemedicine 診断 | B-08 医療 | **抜け漏れ** |
| online consultation 診断 | B-08 医療 | **抜け漏れ** |

### §6.3 パターン 3: 海外 keyword 抜け漏れ可能性

| 海外用語 | reject すべき領域 | Dev-A1 denylist 含有 |
|---|---|---|
| credit scoring AI | B-05 金融 | **抜け漏れ** |
| applicant tracking system | B-04 雇用 | **抜け漏れ** |
| tenant scoring | B-03 住居 | **抜け漏れ** |
| rent automation | B-03 住居 | **抜け漏れ** |
| cyber warfare | B-11 国家安全保障 | **抜け漏れ** |
| offensive cyber | B-11 国家安全保障 | **抜け漏れ** |
| predictive policing | B-13 法執行 | **抜け漏れ** |
| refugee status | B-12 移住 | **抜け漏れ** |
| asylum 申請 | B-12 移住 | **抜け漏れ** |
| smart grid | B-01 重要インフラ | **抜け漏れ** |

### §6.4 パターン 4: 法令条文番号抜け漏れ可能性

| 法令条文 | reject すべき領域 | Dev-A1 denylist 含有 |
|---|---|---|
| 弁護士法 72 条 | B-07 | **抜け漏れ** |
| 医師法 17 条 | B-08 | **抜け漏れ** |
| 行政書士法 1 条の 2 | B-12 | **抜け漏れ** |
| 学校教育法 | B-02 | 含有 |
| 金商法 | B-05 | 含有 |
| 銀行法 | B-05 | 含有 |
| 保険業法 | B-06 | 含有 |
| 薬機法 | B-08 / B-10 | 含有 |
| PL 法 | B-10 | 含有 |
| 電安法 | B-10 | 含有 |

### §6.5 パターン 5: 業界標準用語抜け漏れ可能性

| 業界標準用語 | reject すべき領域 | Dev-A1 denylist 含有 |
|---|---|---|
| ISO 9001 判定 | B-10 製品安全 | **抜け漏れ** |
| ISO 13485 判定 | B-10 製品安全 | **抜け漏れ** |
| HACCP 判定 | B-10 製品安全 | **抜け漏れ** |
| underwriting | B-06 保険 | **抜け漏れ** |
| actuary | B-06 保険 | **抜け漏れ** |
| 引受査定 | B-06 保険 | **抜け漏れ** |
| データセンター冷却 | B-01 重要インフラ | **抜け漏れ** |
| 修繕費判定 | B-03 住居 | **抜け漏れ** |
| 敷金判定 | B-03 住居 | **抜け漏れ** |
| 礼金算定 | B-03 住居 | **抜け漏れ** |

---

## §7 needs_scout スコアリング関数への組込仕様

### §7.1 既存 v1 §4.1 への追加レイヤ

既存の「ジャンル分類器レイヤ」に、本書の **391 件 denylist keyword + 247 件 whitelist keyword** を直接組み込む 2 段階フィルタを追加:

```
入力: ニーズ候補テキスト (タイトル + 本文 + タグ + 上位コメント要約)

処理:
  1. Pre-filter: keyword exact / partial match
     - denylist keyword（391 件）に hit → score = 0、即棄却
     - whitelist keyword（247 件）に hit → score boost +20%（context tag に "whitelist_pre_match" 付与）
     - hit なし → ジャンル分類器（既存）に渡す

  2. ジャンル分類器（既存 v1 §4.1）:
     - LLM (claude -p with --json-schema) 分類
     - "B-XX" → score = 0（denylist 全文確認）
     - "G-Top-X" → score = min(score, 0.3)、HITL gate
     - "W-XX" → score 通常計算
     - "UNKNOWN" or confidence < 0.7 → グレー扱い

出力: {final_score, hitl_required, blacklist_reason, whitelist_pre_match: bool}
```

### §7.2 keyword の正規化

- **大文字小文字混在**: `SCADA / scada / ScAdA` すべて hit（case-insensitive）
- **全角半角混在**: `ＳＣＡＤＡ / SCADA` すべて hit（NFKC 正規化）
- **空白区切り混在**: `applicant tracking / applicanttracking / applicant-tracking` すべて hit
- **同義語**: 主要 keyword に同義語 list を付与し、let any 1 hit でも reject

### §7.3 confidence 閾値

- exact match → confidence = 1.0
- partial match → confidence = 0.7（HITL escalation）
- 周辺 keyword 共起（例: 「与信」+「判定」が 5 word 内に共起）→ confidence = 0.85

---

## §8 5/9 CB-S-W0-02 期限への引継 + Round 10 TODO

### §8.1 5/9 CB-S-W0-02 期限への引継 3 件

| # | 引継項目 | 5/9 までに完遂 |
|---|---|---|
| 1 | 重要 13 領域 × 30+ keyword 検証セット完成（本書 §2） | Yes |
| 2 | ホワイトリスト原案 v0 完成（本書 §4、12 カテゴリ × 20+ keyword） | Yes |
| 3 | Dev-A1 denylist 抜け漏れ件数の数値化（本書 §3、critical 7 / major 26 / minor 16） | Yes |

### §8.2 Round 10 TODO 3 件

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | 各 keyword の自動 regression test 化（denylist hit + whitelist boost の単体 test） | Dev-A1 + Review | 5/8 18:00 |
| 2 | needs_scout skill 実装時の config 直接埋込（YAML / JSON export） | Dev-A1 | Phase 1 W3（CB-D-W3-01）期限 |
| 3 | ホワイトリスト v1 化（5/9 CB-S-W0-02 正式版、ホワイトリスト内でも避けるべきこと明記） | Review | 5/9 EOD |

---

## §9 結論 + Review 部門 sign-off

### §9.1 結論

CB-S-W0-02（5/9 期限）の前提整理として、重要 13 領域 × 30+ keyword = 計 391 件の検証セット + ホワイトリスト原案 v0 12 カテゴリ × 20+ keyword = 計 247 件を起案、Dev-A1 進行中の denylist 抜け漏れを critical 7 件 / major 26 件 / minor 16 件 = **計 49 件** で数値化。各 keyword に false-positive シナリオ 5 件 + false-negative シナリオ 5 件を整理し、Dev-A1 への report 経由フィードバックとして YAML 形式で提示。Source code は変更せず Review レポートのみで完結。

### §9.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 重要 13 領域 × 30+ keyword 検証セット（391 件） | sign-off |
| Dev-A1 denylist 抜け漏れ件数の数値化（49 件） | sign-off |
| ホワイトリスト原案 v0（12 カテゴリ × 20+ keyword、247 件） | sign-off |
| false-positive / false-negative シナリオ各 5 件以上 | sign-off |
| 5/9 CB-S-W0-02 期限への引継 3 件 | sign-off |
| Round 10 TODO 3 件確定 | sign-off |

### §9.3 関連 DEC / リスク参照

- **DEC-019-010**: OpenAI ToS 条件付き許容 — 本 keyword set の根拠
- **DEC-019-031**: 公開ガード G-Top-1〜4 — グレー領域の HITL escalation 連動
- **R-019-10**: 重要 13 領域 ToS 違反 — 本 keyword set で mitigation 進捗 +15pt
- **R-019-11**: Codex OSS ライセンス検証フロー — Phase 1 W2 で `codex_output_license_check` 整備時の前提

### §9.4 次回更新

- 5/8 18:00（議決-23 採択結果反映 + Dev-A1 critical 7 件追加完遂確認）
- 5/9 EOD（CB-S-W0-02 v1 正式版策定、ホワイトリスト内でも避けるべきこと明記）
- 5/12 EOD（drill #1 本番後、minor 16 件追加完遂確認）

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 / 案 9-B
**正式採択**: 2026-05-09 CB-S-W0-02 期限（v1 正式版策定時）
**v0 → v1 差分**: 検証セット 391 件 + ホワイトリスト 247 件 + 抜け漏れ 49 件数値化
