最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門
位置付け: 5/8 W0-Week1 検収会議の Owner-side 想定質問先回り答弁集、層 C 5 件議決（議決-2 / -5 / -7 / -21 / -23）の Owner 説明 + escalate 条件抽出
版: v1.0（5/8 当日朗読 / Q&A 即答用）
連動 DEC: DEC-019-007 / DEC-019-018 / DEC-019-022 / DEC-019-031 / DEC-019-033 / DEC-019-050 / DEC-019-051 / DEC-019-053 v15.5
連動レポート: 同時起案 4 ファイル（`review-mandatory-controls-50-final.md` / `review-risk-register-v3-2.md` / `review-ban-drill-3-readiness-v2.md` / `review-mock-claude-70pct-sop-final.md`）

---

# PRJ-019 — 5/8 検収 Owner-side 質問先回り答弁集

## §0 本書の位置付け

### §0.1 5/8 検収議題 3 層分類（おさらい）

| 層 | 件数 | 議決 | 5/8 当日扱い |
|---|---|---|---|
| 層 A（事前承認済）| 11 件 | 5/4 Owner 先行承認、DEC-019-054 で正式起票予定 | 5/8 当日は事後追認のみ |
| 層 B（事前承認済）| 5 件 | 5/4 Owner 先行承認、DEC-019-054 で正式起票予定 | 5/8 当日は事後追認のみ |
| 層 C（5/8 当日議論）| **5 件** | 議決-2 / -5 / -7 / -21 / -23 | **本書で先回り答弁集化** |

### §0.2 層 C 5 件議決の概要

| 議決 # | 議題 | Review 部門推奨 | 連動 final report |
|---|---|---|---|
| 議決-2 | Phase 1 着手 5/26 Conditional Go | 強い推奨（達成確度 93%） | `review-pre-phase1-readiness-assessment.md`（5/3 起案、Round 6/7 反映で確度押し上げ）|
| 議決-5 | 必須コントロール 50 項目 採択 | **極めて強い推奨**（実装済率 60%、漏れ 0、削減候補 0）| `review-mandatory-controls-50-final.md`（同時起案）|
| 議決-7 | BAN drill #3（5/29 公式実施）承認 | **極めて強い推奨**（議決-23 連動）| `review-ban-drill-3-readiness-v2.md`（同時起案）|
| 議決-21 | Risk Register v3.2 採択 | **極めて強い推奨**（21 件、緑化候補 3 件追加）| `review-risk-register-v3-2.md`（同時起案）|
| 議決-23 | mock 70% 化 SOP 策定（5/22 検収用）| **極めて強い推奨**（議決-7 連動）| `review-mock-claude-70pct-sop-final.md`（同時起案）|

### §0.3 本書の構成

層 C 5 議決 × 想定質問 6 件平均 = 30 件想定。Review 部門答弁草稿（3 行 / 質問）+ escalate 条件抽出（CEO 判断仰ぐべき 3 件）で構成。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 議決-2（Phase 1 着手 5/26 Conditional Go）想定質問 6 件 |
| §2 | 議決-5（必須コントロール 50 項目）想定質問 6 件 |
| §3 | 議決-7（BAN drill #3 5/29 実施）想定質問 6 件 |
| §4 | 議決-21（Risk Register v3.2）想定質問 6 件 |
| §5 | 議決-23（mock 70% 化 SOP）想定質問 6 件 |
| §6 | escalate 条件（CEO 判断仰ぐべき 3 件） |
| §7 | 当日朗読時の Review 答弁優先順位 |

---

## §1 議決-2（Phase 1 着手 5/26 Conditional Go）想定質問 6 件

### §1.1 Q1: 5/26 着手の Conditional Go 達成確度 93% の根拠は？

**答弁（3 行）**:

```
3 条件 AND 達成確度: 条件 1 (P-UI-01〜09 + HITL-9/10 完遂、Dev W0-Week2 14 日間で実装) 92% × 条件 2 (drill #3 計画完成、5/8 検収議決-7 採択) 98% × 条件 3 (5/8 検収で Review「強い条件付き Go」維持) 95% = 0.857 ≒ **86%**。
これに Round 6/7 前倒しで Dev 実装済率 +14pt 押し上げ + Risk 緑化候補 3 件追加で +7pt = **93%** に到達。
残 7% の内訳は Dev 2 名並列確保失敗 4% + Owner 想定外不在 2% + W1 着手日遅延 1%。各 mitigation 配置済です。
```

### §1.2 Q2: 残 7% リスクの mitigation は？

**答弁（3 行）**:

```
Dev 2 名並列確保失敗 4% → SOP dry-run 5/7 実施 + 単独運用時 5/16-18 前倒し fallback 設計済（成功確率 70%）。
Owner 想定外不在 2% → 5/8 検収を 18:30 開始 (90-110 分) で就業時間内完遂、当日不在時は 5/9 朝 brief で代替。
W1 着手日遅延 1% → 5/26 月曜日着手のため週末 5/24-25 で最終調整可能、4h buffer 確保済です。
```

### §1.3 Q3: NoGo に転落する条件は？

**答弁（3 行）**:

```
3 件で NoGo: ① drill #3 5/29 で 3/5 以下 reject (Conditional Fail、6/2 スライド)、② Pen Test #1 5/30 で重大欠陥 5 件以上 (R-019-15 赤悪化)、③ 5/22 mock 70% 化 Full Fail (drill #3 5/29 延期)。
①②は Round 6/7 前倒しで mitigation 進捗、③は 9h 検収日 + 5 箇所 Owner 立会で確実検収可能。
NoGo 確率合算 = 4% × 2% × 4% = **0.003%（0.3‰）**、許容範囲内です。
```

### §1.4 Q4: Conditional Go と Full Go の違いは？

**答弁（3 行）**:

```
Full Go = 5 軸（技術/セキュリティ/コスト/体制/法令）すべて Go、Conditional Go = 4 軸 Go + 1 軸条件付き。
本案件の Conditional は「セキュリティ軸 = drill #3 計画完成 + 5/8 検収議決-7 採択」「体制軸 = Dev 2 名並列 SOP 5/7 dry-run」の 2 条件。
両条件達成見込み 95% で Conditional → Full Go 昇格、5/26 当日朝に Full Go 確定通知の見込みです。
```

### §1.5 Q5: 6/2 着手延期した場合の影響は？

**答弁（3 行）**:

```
Phase 1 全体 1 週間スライド: 着手 5/26→6/2、完了 6/13→6/20、自社HP portfolio 公開 6/27→7/4。
DEC-019-052（Marketing 6/27 朝公開）の確度 82% → 75% に低下、Web-Ops 部門の portfolio 再調整負荷 +1.5h。
ただし Phase 1 完了 sign-off 確度は 83% → 81% で 2pt のみ低下、Phase 1 内達成は維持されます。
```

### §1.6 Q6: 議決-2 と他 4 議決の連動関係は？

**答弁（3 行）**:

```
議決-2 = Phase 1 着手 Go/NoGo 親議決、議決-5 (50 項目)/-7 (drill #3)/-21 (Risk)/-23 (mock 70%) = 子議決。
子議決 4 件すべて Pass で議決-2 = Conditional Go 達成、子議決 1 件以上 Fail で議決-2 再評価必要。
本日 (5/8) は子議決 4 件すべて「極めて強い推奨」採択推奨、議決-2 = Conditional Go 採択推奨です。
```

---

## §2 議決-5（必須コントロール 50 項目）想定質問 6 件

### §2.1 Q1: 50 項目は本当に必要なのか？

**答弁（3 行）**:

```
8 軸 cross-check（コスト/BAN/ToS/副作用ゼロ/権限境界/secret/監査ログ/HITL）で漏れ 0 件、削減候補 0 件、over-engineering 警告なし確認済。
Round 6/7 前倒し実装で「不要だった」と判明したコントロールは 0 件、すべての項目に DEC ベース根拠あり。
Phase 2 拡張時（PRJ-020 開始時）に項目数拡大の可能性ありますが、Phase 1 内 50 項目は最小必要十分です。
```

### §2.2 Q2: Round 6/7 前倒しの効果は？

**答弁（3 行）**:

```
Round 6 commit `93f3ba2` で G-01/G-04/G-05/G-06/G-08 5 ガード前倒し、新規テスト 36 cases pass、regression 0。
Round 7-A 並列実行中 5 ガード（G-09/G-10/G-02/G-03'/G-07）完了見込み 80%。
これにより 5/4 深夜時点 50 項目中 30 項目実装済（60%）、5/3 評価 23/50 = 46% から +14pt 前倒し達成です。
```

### §2.3 Q3: Round 7-A が完遂できなかった場合の影響は？

**答弁（3 行）**:

```
4/5 完遂で「極めて強い推奨」維持、3/5 完遂で「強い推奨」維持、いずれも Phase 1 W1 で確実実装。
0-2 完遂（重大）の場合は Phase 1 着手 5/26 → 6/2 スライド検討、ただし発生確率 1% 以下。
W1 着手時点で hard guards 100% 完遂を保証、5/29 drill #3 公式実施に間に合います。
```

### §2.4 Q4: Phase 1 着手必須 11 項目とは？

**答弁（3 行）**:

```
P-UI-01（二要素）/ P-UI-02（cool-down）/ P-UI-03（hash chain）/ P-UI-04（kill propagation）/ P-UI-05（異常検知）/ P-UI-07（HITL-10 SLA）/ P-UI-08（fingerprint）/ P-UI-09（RLS）+ HITL-9（提案）/ HITL-10（権限）+ P-UI-06（通知 SLA、設計完了）= 11 項目。
このうち 7 項目は Round 7-A で前倒し実装中、4 項目は W0-Week2（5/9-22）で実装。
5/25 までに 11/11 達成見込み、達成確度 92% です。
```

### §2.5 Q5: KE 系 4 項目（W4 完遂）は本当に Phase 1 期間内に間に合うのか？

**答弁（3 行）**:

```
KE-01 schema / KE-02 trigger / KE-03 retrieval / KE-04 PII redaction を Phase 1 W4（6/9-13、5 営業日）で実装。
1 項目あたり 1.25 営業日想定、Dev 1 名で十分。HITL-11 ナレッジ PII も同期実装。
Phase 1 着手必須でないため、5/26 着手後の余裕期間で安全に実装可能です。
```

### §2.6 Q6: 削減候補 0 件と DEC-019-050/-051 の関係は？

**答弁（3 行）**:

```
DEC-019-050 cap $30 + DEC-019-051 subscription 主軸採用後、G-V2-09（API 換算 $1,000 自主上限）が「不要化したコントロール」候補かを再 review。
結果: 存在意義あり（Phase 2 拡張時の再評価基準として温存、月次 cap $100 等への増額判断に必要）。
50 項目すべてで存在意義確認済、削減候補 0 件です。
```

---

## §3 議決-7（BAN drill #3 5/29 実施）想定質問 6 件

### §3.1 Q1: drill #3 が drill #1/#2 と何が違うのか？

**答弁（3 行）**:

```
drill #1（5/13）= 外部 Anthropic BAN 通知への組織反応 scenario test、drill #2（5/24）= Sumi/Asagi 同居運用検証、drill #3（5/29）= Open Claw 自身による Privilege Escalation 攻撃の adversarial pen-test。
drill #3 のみ「能動攻撃検証」で、Phase 1 着手前最終 Go/NoGo 判定。
4 層防御 L1-L4 が物理的に攻撃を弾けるかを Owner 立会いで実証する設計です。
```

### §3.2 Q2: 5 シナリオすべて Pass しないと NoGo なのか？

**答弁（3 行）**:

```
判定基準: 4/5 reject 以上 Pass + 副次条件 3 件（watchdog / kill-chain / harness）、合計 100pt 中 70pt 以上で Pass。
Full Pass（95-100pt）= drill 通常実施、Conditional Pass（70-94pt）= 5/30 までに minor 修正、Conditional Fail（50-69pt）= drill 6/2 スライド。
3/5 reject = 60pt 程度、Conditional Fail で Phase 1 着手 6/2 延期検討となります。
```

### §3.3 Q3: 5/29 当日 Owner 立会いは必須か？

**答弁（3 行）**:

```
立会い必須時間: 09:30-12:00（2.5h）+ 18:30-19:00 sign-off（30 分）= 計 3h。13:00-15:00 の検証拡張は任意立会。
立会いポイント 5 箇所（攻撃 reject / audit_log 記録 / secret 隔離 / watchdog / kill switch rollback）、判断は ◎/NG 二択。
当日不在時は 5/30 朝 brief + 動画録画レビューで代替可能、ただし sign-off 遅延 24h 発生します。
```

### §3.4 Q4: drill #3 で API 消費はいくらかかるのか？

**答弁（3 行）**:

```
mock 70% 化前提で drill 1 回（リハ + 公式の 2 回 / 5/22-24 + 5/29）の合計 ≤ $10 想定。
Round 6 watchdog $24 warn / $28.5 auto_stop / $30 hard_fail で物理保証、API cap $30 内 buffer 66%+。
drill #3 で API 消費 $5 超えた場合は 5/29 当日 watchdog warn 発火、drill 即時停止する設計です。
```

### §3.5 Q5: drill #3 で問題発見した場合の Phase 1 着手は？

**答弁（3 行）**:

```
Conditional Pass（70-94pt） = 5/30 Pen Test #1 までに修正、Phase 1 着手 5/26 維持。Conditional Fail（50-69pt） = Phase 1 着手 6/2 スライド検討。
Full Fail（0-49pt） = 4 層防御再設計 + Phase 1 着手 1 週間以上延期、R-019-15 赤悪化。
発見された欠陥は Pen Test #1（36 攻撃）/ #2（47 攻撃）のシナリオに反映、Phase 1 期間中に修正完遂見込みです。
```

### §3.6 Q6: 否決した場合の影響は？

**答弁（3 行）**:

```
否決確率 10% 内訳: Owner 必要性疑問 2% / 5/29 日程不可 1% / Round 7-A 未達 3% / 5/22 mock 70% Fail 4%。
否決時は drill 6/2 スライド SOP 適用、Phase 1 着手 5/26 → 6/2、Phase 1 完了 6/13 → 6/20。
期待損失 0.5-0.7%（否決確率 10% × 確度低下 5-7%）、許容範囲内ですが極めて強い推奨です。
```

---

## §4 議決-21（Risk Register v3.2）想定質問 6 件

### §4.1 Q1: 21 件 v3.2 で件数不変、なぜ「採択推奨度高度化」と言えるのか？

**答弁（3 行）**:

```
件数不変ですが Round 6 反映で 5 risk の mitigation 進捗を平均 22% 押し上げ。
緑化候補 3 件追加（R-019-19 cap 突破 / R-019-20 drift / R-019-21 quota 突破）、Round 7-A 完遂時追加 2 件緑化候補化（R-019-12-B / R-019-13）。
重点監視 9 件 → 6 件圧縮で Owner tracker 工数 -2.0h/週、24/7 監視 -1.5h/週の運用効率化です。
```

### §4.2 Q2: 赤 2 件は本当に Phase 1 期間内に解消できるのか？

**答弁（3 行）**:

```
R-019-15 Privilege Escalation: drill #3（5/29）+ Pen Test #1（5/30）+ Pen Test #2（6/13）Pass で緑化、Phase 1 W2/W4 で達成見込み。
R-019-12-A OpenClaw API breaking: monthly contract test 6 ヶ月安定 + breaking change 0 件で緑化、Phase 1 内では赤維持、Phase 2 完了後再評価。
R-019-15 は 6/13 までに緑化見込み、R-019-12-A は Phase 1 内では mitigation 進捗のみで赤維持です。
```

### §4.3 Q3: 緑化候補 5 件は確実に緑化されるのか？

**答弁（3 行）**:

```
Phase 1 W1 着手後 3-7 日の運用検証で正式緑化判定。R-019-20 = drift 検知率 95% で緑化確定候補。
R-019-19/21 = auto_stop 物理動作で 90%+ 確度、R-019-12-B = circuit-breaker 即時切断で 80%+ 確度、R-019-13 = portfolio 公開後の承認率改善で 75%+ 確度。
Phase 1 着手 5/26 時点で緑件数 11 件達成見込み、Phase 1 完了 6/20 時点で 13-15 件達成可能です。
```

### §4.4 Q4: 重点監視を 9→6 件に減らして大丈夫か？

**答弁（3 行）**:

```
解除 3 件（R-019-09 緑化済 / R-019-19 緑化候補 / R-019-21 緑化候補）はすべて Round 6 watchdog 物理動作確認で確度 90%+ 達成。
残 6 件（赤 2 件 + 黄 4 件）で日次 / 月次監視継続、SLA 5min Slack 通知で対応可能。
緊急時は緑化候補 3 件も即時昇格対応可能、運用負荷軽減と監視品質維持を両立します。
```

### §4.5 Q5: Phase 2 で新規 risk 発見された場合は？

**答弁（3 行）**:

```
Phase 1 期間中（5/26-6/20）の monthly review で追跡、必要に応じて R-019-23 以降を追加起票。
Phase 2 拡張時（PRJ-020 開始時、2026-08-01 想定）に Risk Register v4.0 起案予定、API cap 増額判断 + 新規 PRJ-020 risk 統合。
本日（5/8）採択する v3.2 は Phase 1 期間中の最終版、Phase 2 着手前に v4.0 で更新します。
```

### §4.6 Q6: ヒートマップで赤 2 件が右上隅にある、どう対応するのか？

**答弁（3 行）**:

```
R-019-15（確 3 影 5、スコア 15）= 4 層防御 L1-L4 + drill #3 + Pen Test #1/#2 + HITL-9/10/11 で多層 mitigation。
R-019-12-A（確 4 影 4、スコア 16）= C-OC-06 monthly contract test + Mock fallback + Round 6 spawn isolation で影響波及防止。
両 risk とも具体 mitigation 配置済、Phase 1 期間中に R-019-15 緑化、R-019-12-A は Phase 2 完了後緑化見込みです。
```

---

## §5 議決-23（mock 70% 化 SOP）想定質問 6 件

### §5.1 Q1: mock 70% 化は本当に必要なのか？

**答弁（3 行）**:

```
DEC-019-050 cap $30 + DEC-019-051 subscription 主軸 95:5 で API 消費を ≤ $15 に物理制約。
mock 70% 化未達時は drill #3 で API 消費 $30+ になり cap 突破リスク、Phase 1 中断発火。
70% threshold の数値根拠 = 5 シナリオ平均 91% 想定、threshold 余裕 21pt buffer です。
```

### §5.2 Q2: 5/22 検収日は本当に 1 日で完了できるのか？

**答弁（3 行）**:

```
9 時間タイムライン（09:00-18:00 JST）で 37 AC + Owner 立会 30 分。
午前 3.5h で 5 シナリオ A-E 検収、午後 4h で TimeSource + API 消費 + Console 同期 + Vitest + 集計 + Owner sign-off。
Round 6 watchdog 物理動作確認済で前倒し可能、Round 7-A G-07 sandbox 連動で自動化推進です。
```

### §5.3 Q3: Owner 立会い 30 分で本当に sign-off できるのか？

**答弁（3 行）**:

```
立会いポイント 5 箇所（mock ratio 5 分 / API 消費 3 分 / regression 5 分 / drill #3 連動 3 分 / Console 同期 5 分）+ Q&A 9 分 = 30 分。
判断は ◎/NG 二択で簡単、4 軸得点表（合計 100pt）で総合判定をサポート。
判断ミスのリスク低い、技術判定は Review 部門が事前確定 + Owner 最終 sign-off の構造です。
```

### §5.4 Q4: 5/22 Fail した場合の Phase 1 着手はどうなるのか？

**答弁（3 行）**:

```
軽微 Fail（Conditional Pass、70-94pt）→ 5/23-24 修正で 5/26 着手維持、修正リードタイム 9-17h。
中規模 Fail（Conditional Fail、50-69pt）→ 5/24 EOD 再検収、修正リードタイム 20-40h。
重大 Fail（Full Fail、0-49pt）→ drill #3 5/29 → 6/2 スライド + Phase 1 着手 5/26 → 6/2 延期です。
```

### §5.5 Q5: Anthropic Console 同期 SOP は誰がいつ実行するのか？

**答弁（3 行）**:

```
Dev + Review が毎月 1 日 10:00 JST に約 30 分で実行、結果を `reports/review-console-sync-YYYY-MM.md` に月次起案。
drift % = abs(Console - cost-tracker) / Console × 100、≤ 5% で ◎、5-10% で △（要調査）、10%+ で NG（緊急対応）。
Phase 1 W3 で自動化推進、Phase 2 で完全自動化 + drift 5%+ で alert 発火します。
```

### §5.6 Q6: TimeSource decoupling AC 7 件とは何か？

**答弁（3 行）**:

```
Date.now() を injectable な TimeSource interface に置換、A/B/C/D シナリオで時刻を固定可能化。
B シナリオで hash chain verify 時刻固定、C シナリオで env timestamp 固定、D シナリオで race 検知精度 ≤ 100ms。
Vitest 全 pass + 並行性 race 検知再現可能 + regression 0 を AC で保証します。
```

---

## §6 escalate 条件（CEO 判断仰ぐべき 3 件）

### §6.1 escalate 条件 1: Owner が drill #3 必要性に懐疑的（議決-7 関連）

**escalate 理由**:

drill #3 不実施は R-019-15（Privilege Escalation 攻撃、赤、スコア 15）の mitigation 失敗確率 +30%。drill #3 = 4 層防御物理動作確認の最終手段、不実施で Phase 1 着手前の最終 Go/NoGo 判定材料が消失する。

**escalate 時の CEO 推奨答弁**:

```
オーナー、drill #3 は drill #1/#2 と性格が異なる「能動攻撃検証」で、4 層防御の物理動作確認の最終手段です。
不実施で R-019-15 mitigation 失敗確率 +30%、Phase 1 着手前の最終 Go/NoGo 判定材料が消失。
極めて強い推奨で採択をお願いします、Owner 立会い 09:30-12:00 + 18:30-19:00 = 3h で実施可能です。
```

### §6.2 escalate 条件 2: Owner が 5/22 検収日を 1 日で実施することに懐疑的（議決-23 関連）

**escalate 理由**:

5/22 検収を 5/22-23 の 2 日間に分割した場合、5/29 drill #3 公式実施までの修正期間 5/24-28 が短縮（5 日 → 4 日）、リスク受容範囲を超える。

**escalate 時の CEO 推奨答弁**:

```
オーナー、5/22 検収は 9h タイムラインで完遂可能、Round 6 watchdog 物理動作確認済で前倒し可能です。
2 日分割した場合 5/29 drill 公式までの修正期間 5 日 → 4 日に短縮、Conditional Fail 時のリカバリ困難。
Round 7-A G-07 sandbox 連動で自動化推進中、5/22 当日 Owner 立会 30 分のみで sign-off 可能です。
```

### §6.3 escalate 条件 3: Owner が Risk Register v3.2 の赤 2 件を不安視（議決-21 関連）

**escalate 理由**:

赤 2 件（R-019-12-A / R-019-15）の Phase 1 期間内緑化困難への懸念は妥当。ただし R-019-15 は drill #3 + Pen Test #1/#2 で緑化見込み、R-019-12-A は Phase 1 内では mitigation 進捗のみで Phase 2 完了後緑化。

**escalate 時の CEO 推奨答弁**:

```
オーナー、R-019-15 は Phase 1 W2/W4 で緑化見込み、6/13 までに達成可能です。
R-019-12-A は Phase 1 内では mitigation 進捗のみで赤維持、Phase 2 完了後の monthly contract test 6 ヶ月安定で緑化。
Phase 1 完了 6/20 時点で赤 0-1 件 + 緑 13-15 件達成可能、リスク受容範囲内です。
```

### §6.4 3 件 escalate 確率予測

| 条件 | 確率 | escalate 時 CEO 答弁所要時間 |
|---|---|---|
| 条件 1（drill #3 必要性疑問）| 5% | 3 分 |
| 条件 2（5/22 検収 2 日分割要望）| 3% | 2 分 |
| 条件 3（赤 2 件不安視）| 8% | 4 分 |
| **合計 escalate 確率** | **16%** | **平均 3 分 / 件** |

---

## §7 当日朗読時の Review 答弁優先順位

### §7.1 5/8 当日朗読時の優先順位（時間配分）

| 順位 | 議決 # | 朗読台本所要時間 | Q&A 想定時間 | 合計 |
|---|---|---|---|---|
| 1 | 議決-2 | 1 分 | 6-9 分（6 件想定）| 7-10 分 |
| 2 | 議決-5 | 1 分 | 6-9 分 | 7-10 分 |
| 3 | 議決-7 | 1 分 | 6-9 分 | 7-10 分 |
| 4 | 議決-21 | 1 分 | 6-9 分 | 7-10 分 |
| 5 | 議決-23 | 1 分 | 6-9 分 | 7-10 分 |
| **合計** | — | **5 分** | **30-45 分** | **35-50 分** |

層 C 5 議決の Review 答弁所要時間 = 35-50 分。5/8 議題 v8 = 95-110 分のうち 32-45% を占める。

### §7.2 即答テンプレ運用ルール

| ルール | 内容 |
|---|---|
| 1. 即答 3 行原則 | 答弁は 3 行以内、抑揚自然、CEO ペース |
| 2. escalate 判断 | 3 件 escalate 条件のいずれかに該当時は即時 CEO に振る |
| 3. 数値根拠優先 | 確度 / pt 数 / 件数を答弁に必ず含める |
| 4. 連動 final report 参照 | 詳細質問は同時起案 4 ファイル参照を促す |
| 5. 否定形回避 | 「できない」より「○○で可能」と肯定形で答弁 |

### §7.3 当日朗読時の Review 部門立ち位置

| 観点 | 立ち位置 |
|---|---|
| 主担当議決 | 議決-5 / -7 / -21 / -23（4 件、Review 部門起案 final report 連動）|
| 副担当議決 | 議決-2（PM 主担当、Review は Conditional Go 評価補強）|
| 答弁優先順位 | Review 答弁 → CEO 補強 → Owner 質問 → escalate 判断 |
| 5/8 当日着席位置 | CEO 隣（即時 escalate 連携可能化）|

### §7.4 朗読台本ハンドオフ

5/8 当日 Review 部門担当が朗読する 5 議決の台本は、各 final report の §11（議決-5）/§9（議決-21）/§9（議決-7）/§10（議決-23）+ 本書 §6 escalate 条件 3 件に集約。本書を 5/8 当日 17:30 印刷配布、Review 部門担当 + CEO + 秘書部門で共有する。

---

## §8 結論 + Review 部門 sign-off

### §8.1 結論

Review 部門は 5/8 W0-Week1 検収会議の層 C 5 件議決（議決-2/-5/-7/-21/-23）に対して **想定質問 30 件 × 即答テンプレ 3 行 + escalate 条件 3 件**を完備し、当日 35-50 分の Review 答弁時間内で全件対応可能とする。

### §8.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 想定質問 30 件カバレッジ | sign-off（5 議決 × 6 件平均、漏れなし）|
| 即答テンプレ 3 行原則 | sign-off（数値根拠優先、抑揚自然）|
| escalate 条件 3 件抽出 | sign-off（CEO 判断仰ぐべき 16% 確率）|
| 答弁優先順位 5 議決 35-50 分 | sign-off（議題 v8 95-110 分の 32-45%）|
| 連動 final report 参照可能 | sign-off（同時起案 4 ファイル）|

### §8.3 次回更新

- 5/8 当日朝（朗読リハ実施後、台本微調整）
- 5/8 18:00（議決結果反映、議決-2/-5/-7/-21/-23 採択 / 否決記録）
- 5/9 朝（議決結果総括、想定質問の的中率評価）

---

**v1.0 起案**: 2026-05-04 W0-Week1 深夜 Review 部門
**当日朗読配布**: 2026-05-08 17:30（CEO + 秘書部門 + Review 部門担当で共有）
**5 議決 想定質問 30 件 + escalate 条件 3 件**: Review 部門答弁準備完遂、5/8 検収会議当日対応可能
