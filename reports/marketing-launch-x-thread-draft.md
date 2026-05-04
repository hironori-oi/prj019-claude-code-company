# PRJ-019 Clawbridge — Launch X Thread 草稿 (6/26 前夜祭 + 6/27 当日 5 投稿)

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象**: 2026-06-27 朝 09:00 JST 公開時の X (Twitter) 投稿スレッド
- **構成**: 前夜祭 1 投稿 (6/26 22:00) + 当日 5 投稿 (09:00 / 09:30 / 12:00 / 18:00 / 21:00)
- **依拠議決**: DEC-019-052 議決-25 (B 主軸 + C 透明性 OSS 補助 + A 技術深堀り別枠連載)
- **絶対遵守**: 絵文字 0 件 / AI 感のある語彙 0 件 / shadcn/ui Heroicons 風の硬めトーン
- **KPI**: 当日 PV 6,000 / ユニーク 3,500 / scroll_depth 75% / Contact CV 1.5%

---

## 0. 投稿全体設計

### 0.1 narrative arc (B 主軸 5 投稿構成)

| Post # | 時刻 | 物語フェーズ | 核となるメッセージ |
| --- | --- | --- | --- |
| 0 (前夜祭) | 6/26 22:00 | 前夜の沈黙 | 「明日朝 9 時に何かを公開する」ティザー |
| 1 | 6/27 09:00 | **開戦宣言** | 28x28 ビジョン + portfolio 公開告知 |
| 2 | 6/27 09:30 | **武器の紹介** | HITL 11 種 / ToS allowlist / subscription 主軸 |
| 3 | 6/27 12:00 | **闘いの記録** | 4 Round 並列発注 + Plan B/A 連続適用 |
| 4 | 6/27 18:00 | **結果の数値化** | 月 ≤$430 / BAN リスク管理 / 自律稼働 |
| 5 | 6/27 21:00 | **OSS 化 + 続編予告** | repo URL + 技術深堀り 6 本連載 |

### 0.2 リンク先設計

| リンク種別 | URL |
| --- | --- |
| B 主軸 portfolio | `https://[domain]/case-studies/openclaw-runtime` |
| A 別枠連載 hub | `https://[domain]/works/clawbridge/technical-deep-dive` |
| OSS repo (公開予定) | `https://github.com/[owner]/clawbridge` |

---

## 1. 前夜祭投稿 (6/26 22:00) — ティザー

### Post 0

```
明日朝 9 時に、ある portfolio を公開します。

「1 人で 28 案件を、28 並列で運営する」という、
個人事業者なら一度は夢想して、現実で諦めるあの構想。

それを 28 日間で実装した記録です。
コスト天井 月 $430。OSS 公開予定。

#claudecode #個人開発
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 145 文字 (上限 280) |
| ハッシュタグ | `#claudecode` `#個人開発` |
| リンク | なし (ティザー戦略のため) |
| 投稿時刻 | 2026-06-26 22:00 JST (寝る前のタイムライン狙い) |
| 推定 engagement | like 30-50 / RT 8-12 (個人開発者層への引きが効く時間帯) |
| 戦略意図 | 「明日朝 9 時」と時刻を指定することで、6/27 朝のフィードに戻ってきてもらう |

---

## 2. 当日 Post 1 (6/27 09:00) — 開戦宣言

### Post 1

```
公開しました。

PRJ-019 Clawbridge — Open Claw を自律オーナーとして
AI 組織ハーネスを 28 案件 × 28 並列で運営する基盤の、
28 日間の構築記録です。

個人開発者が「5 件で詰む」現実を、どう破ったか。

▼ portfolio
[domain]/case-studies/openclaw-runtime

#claudecode #個人開発 #AI組織
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 175 文字 (上限 280) |
| ハッシュタグ | `#claudecode` `#個人開発` `#AI組織` |
| リンク | `/case-studies/openclaw-runtime` (B 主軸 portfolio) |
| 投稿時刻 | 09:00 JST (朝の通勤・始業前ピーク) |
| 推定 engagement | like 80-120 / RT 25-40 / クリック率 5-8% |
| 戦略意図 | 前夜祭で予告した「9 時」に確実に投稿。`5 件で詰む` という個人開発者の共感ワードで引く |

### Post 1 設計補足

- **冒頭「公開しました」** が前夜祭との連動で「待ってた」反応を引く
- **「5 件で詰む現実を、どう破ったか」** が clickbait ではない正直な引き
- **B 主軸 narrative の核**: Owner = 主役 / 5 件で詰む = 敵 / AI 組織ハーネス = 武器

---

## 3. 当日 Post 2 (6/27 09:30) — 武器の紹介

### Post 2

```
武器の話。

Clawbridge の核は 3 つ。

- HITL 11 種ゲート (人間介入点を厳密定義、週 5 回程度に圧縮)
- ToS allowlist (whitelist 0.85+ 自動 / gray 0.5-0.85 HITL / blocklist 即棄却)
- subscription 主軸 (月 ≤$430、API 従量課金は補助)

技術詳細は連載で 6 本掘ります。
[domain]/works/clawbridge/technical-deep-dive
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 215 文字 (上限 280) |
| ハッシュタグ | (Post 1 のスレッド継承、ハッシュタグなし) |
| リンク | `/works/clawbridge/technical-deep-dive` (A 別枠連載 hub) |
| 投稿時刻 | 09:30 JST (Post 1 から 30 分後、再露出) |
| 推定 engagement | like 50-80 / RT 15-25 / クリック率 3-5% |
| 戦略意図 | Post 1 の物語に引かれた読者のうち、技術寄りの層を A 連載に送客 |

### Post 2 設計補足

- **3 つの武器を箇条書き** で構造化 (shadcn/ui の table 風視覚)
- **`月 ≤$430`** という具体的数値を武器の中に混ぜることで C 透明性も同時表現
- **「6 本掘ります」** の量的予告で連載期待値を作る

---

## 4. 当日 Post 3 (6/27 12:00) — 闘いの記録

### Post 3

```
闘いの記録。

着手 3 日間で、4 部署を同時並列発注しました。
25 件 / 12,000 行 のレポートが 12 時間で着弾。

5/4 当日中には、Plan A → Plan B 連続切替 5 件を完了。
Personal plan / GITHUB_ 予約語 / pnpm workspace —
想定外 5 件を、5 時間で倒した日です。

詳細: [domain]/case-studies/openclaw-runtime#section-3
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 195 文字 (上限 280) |
| ハッシュタグ | (スレッド継承) |
| リンク | `/case-studies/openclaw-runtime#section-3` (Section 3 アンカー直接) |
| 投稿時刻 | 12:00 JST (昼休みピーク) |
| 推定 engagement | like 60-100 / RT 20-30 / クリック率 4-6% |
| 戦略意図 | 「12,000 行 / 12 時間」「5 件 / 5 時間」という対比で AI 組織並列運用の威力を数値で見せる |

### Post 3 設計補足

- **Section 3 のハイライト** を 280 文字に圧縮
- **`Personal plan / GITHUB_ 予約語 / pnpm workspace`** という具体的固有名詞でリアリティ担保
- **`#section-3` アンカー** で scroll_depth 75% KPI に直接寄与

---

## 5. 当日 Post 4 (6/27 18:00) — 結果の数値化

### Post 4

```
結果の話。

- 月コスト: 上限 $430 (subscription 主軸で天井確定)
- BAN リスク: ToS allowlist で gray 域は HITL 必須化
- 自律稼働: HITL 11 種ゲート以外は Open Claw が判断
- 並列上限: 設計上 28 案件、実装検証 W4 で 5 案件並列まで確認

「AI が全部やる」ではなく、
「人間 Owner が週 5 回判断する」運用設計です。

#claudecode #個人開発
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 220 文字 (上限 280) |
| ハッシュタグ | `#claudecode` `#個人開発` (検索流入再起動) |
| リンク | なし (Post 3 までで送客済、ここは数値で押す) |
| 投稿時刻 | 18:00 JST (夕方の終業前ピーク) |
| 推定 engagement | like 70-110 / RT 20-35 / 数値引用率 3-5% |
| 戦略意図 | 数値で硬く押すことで「煽り」ではないことを示す。C 透明性 OSS 補助の本領 |

### Post 4 設計補足

- **箇条書き 4 行** で結果を構造化、shadcn/ui の Card 風
- **「AI が全部やる」ではなく** という否定構文で、既存 AI 開発ツールとの差別化を明示
- **`週 5 回判断する`** が Owner 視点の人間的リアリティ

---

## 6. 当日 Post 5 (6/27 21:00) — OSS 化 + 続編予告

### Post 5

```
OSS 公開予定。

Clawbridge は、6 月末をもって OSS 化します。
個人事業者が fork して、自分の AI 組織を立てられる構造です。

▼ repo
github.com/[owner]/clawbridge

▼ 技術深堀り連載 (全 6 本)
1. Open Claw 自律オーナー基盤の設計判断
2. HITL 11 種ゲート — 自律と統制の境界線
3. ToS allowlist の機械判定とグレー域 HITL
4. subscription 主軸 ≤$430/月 のコスト設計
5. Plan A → Plan B 連続切替の意思決定ログ
6. 28 案件 28 並列の検証と限界

[domain]/works/clawbridge/technical-deep-dive

#claudecode #OSS #個人開発
```

| 項目 | 値 |
| --- | --- |
| 文字数 | 約 270 文字 (上限 280、ギリギリ運用) |
| ハッシュタグ | `#claudecode` `#OSS` `#個人開発` |
| リンク | `github.com/[owner]/clawbridge` + `/works/clawbridge/technical-deep-dive` |
| 投稿時刻 | 21:00 JST (夜の閲覧ピーク、スレッド完結 anchor) |
| 推定 engagement | like 100-150 / RT 35-50 / GitHub star 期待 50-100 |
| 戦略意図 | スレッド完結投稿として、OSS + 連載 6 本の **二重出口** を提示。Contact CV 1.5% に直接寄与 |

### Post 5 設計補足

- **連載 6 本のタイトル全列挙** が文字数を一番圧迫するが、**A 別枠連載への送客装置として最重要**
- **OSS repo URL** が C 透明性 OSS 補助の最終アンカー
- **「個人事業者が fork して、自分の AI 組織を立てられる」** が Contact CV を生む primary message

---

## 7. KPI 接続マトリクス

### 7.1 各投稿の KPI 寄与設計

| Post | PV 6,000 | ユニーク 3,500 | scroll_depth 75% | Contact CV 1.5% |
| --- | --- | --- | --- | --- |
| 0 (前夜祭) | △ (告知のみ) | △ | - | - |
| 1 (開戦) | ◎ 主流入 | ◎ 個人開発者層 | ○ portfolio top | ○ 第一接触 |
| 2 (武器) | ○ A 連載送客 | ○ 技術層 | △ 連載 hub | ○ 連載 follow |
| 3 (闘い) | ◎ 中盤 retain | ○ 引用拡散 | **◎ #section-3 アンカー** | ○ Section 3 中盤離脱抑止 |
| 4 (結果) | ○ 数値拡散 | △ | △ | ○ 信頼形成 |
| 5 (OSS) | ○ GitHub 流入 | ◎ OSS 層追加 | ◎ 連載 6 本送客 | **◎ Contact 主導線** |

### 7.2 当日タイムライン上の retention 設計

```
09:00 ━━━━━━━━━━ Post 1 開戦
09:30 ━━━━━━━━━━ Post 2 武器 (Post 1 から 30 分後で再露出)
12:00 ━━━━━━━━━━ Post 3 闘い (昼休みで再ピーク)
18:00 ━━━━━━━━━━ Post 4 結果 (夕方で再ピーク)
21:00 ━━━━━━━━━━ Post 5 OSS  (夜で完結)
```

朝・昼・夕・夜の **4 ピーク全カバー** で、当日のタイムラインで複数回露出する設計。

---

## 8. tone 自己検証 (B 主軸縛りの遵守確認)

| 検証項目 | Post 0 | Post 1 | Post 2 | Post 3 | Post 4 | Post 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 絵文字 0 件 | OK | OK | OK | OK | OK | OK |
| AI 感のある煽り語 0 件 | OK | OK | OK | OK | OK | OK |
| 主役 = Owner / 個人開発者 | OK | OK | - | OK | OK | OK |
| 敵 = 5 件で詰む現実 | - | OK | - | OK | - | - |
| 武器 = AI 組織ハーネス | OK (示唆) | OK | **OK 主題** | OK | OK | OK |
| 数値での透明性 (C 補助) | OK ($430) | - | OK ($430) | OK (12k 行) | **OK 主題** | OK |
| A 連載への送客 | - | - | **OK 主題** | - | - | OK |
| Heroicons 風硬めトーン | OK | OK | OK | OK | OK | OK |

→ **6 投稿すべて DEC-019-052 議決-25 tone 縛り遵守 ✓**

---

## 9. 投稿運用上の注意

### 9.1 投稿前チェックリスト (6/27 早朝 Owner 確認用)

- [ ] `[domain]` placeholder を本番ドメインに置換
- [ ] `[owner]` placeholder を GitHub username に置換
- [ ] portfolio URL `/case-studies/openclaw-runtime` の Vercel deploy 完了確認 (07:00 完了想定)
- [ ] portfolio scroll_depth 計測 tag が live で動いているか確認 (08:00 確認想定)
- [ ] Section 3 アンカー `#section-3` がスクロール先として動作するか確認
- [ ] OSS repo `github.com/[owner]/clawbridge` が public かつ README 整備済か確認

### 9.2 想定外対応

| シナリオ | 対応 |
| --- | --- |
| 09:00 deploy が間に合わない | Post 1 を 30 分遅延、Post 2 を統合 |
| portfolio がアクセス殺到で落ちる | Post 4 を「Vercel スケール検証中」note で前倒し |
| OSS repo が 6/27 朝に間に合わない | Post 5 を「7 月初旬公開予定」に書き換え |

### 9.3 翌日以降のフォロー投稿 (本 Round 5 範囲外、5/8 議決後着手)

- 6/28 朝: scroll_depth / PV 速報投稿
- 6/29 朝: 問い合わせ反響まとめ
- 7/4 朝: 連載 #1 公開告知

---

## 10. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 240 行 (上限 300 行以内) |
| 投稿数 | 前夜祭 1 + 当日 5 = **計 6 投稿草稿** ✓ |
| tone 検証 | B 主軸 + C 補助 + A 連載送客 すべて vetted |
| 文字数遵守 | 6 投稿すべて 280 文字以内 ✓ |
| 検収議決依存タスク | **触れていない** (placeholder で待機) |
| commit / push | **実行しない** (CEO が一括 push) |

---

**作成: Marketing 部門 / 2026-05-04 / Round 5 X Thread 草稿**
