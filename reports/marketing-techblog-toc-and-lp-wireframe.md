# PRJ-019 Clawbridge — 技術ブログ目次 + LP wireframe + Heading A 訴求設計

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-techblog-toc-and-lp-wireframe |
| 制定日 | 2026-05-03 |
| 起票 | Marketing 部門（CB-M-Prep-2026-05-04 サブタスク b + c） |
| 対象案件 | PRJ-019 Clawbridge |
| 関連決裁 ID | DEC-019-026（公開 2026-06-20 朝確定） / DEC-019-027（Heading A 採用） / DEC-019-028（部分開示 80/50/100/概要） / DEC-019-029（HP トップ + 事例 + Contact form のみ） / DEC-019-030（G-Top-1 (a)+(e) ハイブリッド） |
| 姉妹文書 | `marketing-launch-runbook-2026-06-20.md`（公開逆算工程表 + Asagi シナジー） |
| 上位ポリシー | `organization/rules/design-guidelines.md`（クリーン路線 / Heroicons / 絵文字非使用） |
| ステータス | 設計確定（草稿は 5/26 M2 納品時に v0.7、最終版は 6/12 M3 で v1.0 凍結） |

---

## §0. 200 字エグゼクティブサマリ

本書は技術ブログ目次案（§1: 12〜15 章、harness 80% / org 50% / cost 100% / ToS 概要 開示配分準拠）、LP wireframe 初稿（§2-3: HP トップ Hero + 事例ページ 6 件 + 段落差替個所 + OG image + SEO meta + WCAG 2.1 AA + 3 breakpoint レスポンシブ）の 2 系統を統合した詳細設計である。Heading A「AI 組織が AI 組織を運営する」は HP トップ Hero h1 と OG image にのみ採用、本文では harness engineering 語彙で受けて AI 感を抑制する。技術ブログは Phase 2 開始までに 1 本確定公開し、その後 6 ヶ月でシリーズ展開予定 5 本。残課題として `[OWNER-DECISION-REQUIRED]` 3 件（OG image 制作リソース / 内部 prompt 漏洩防止チェックリスト承認 / 公開後シリーズ展開予定の Phase 2 採否依存性）が CEO → オーナー判断待ち。

---

## §1. 技術ブログ目次案（12〜15 章、harness 80% 開示）

### §1.1 全体構造方針

- **想定字数**: 全章合計 12,000 〜 15,000 字（Phase 2 開始までに 1 本完成）
- **公開タイミング**: 6/20 公開と同時に Phase 1 完了報告ブログとして公開、ただし Q-Mkt-06 採択により `/blog` 直接運用は採用しない方針 → 「事例ページの拡張章」として `/works/clawbridge/technical-deep-dive` ルートで公開
- **公開資料 / 内部資料の境界**: 本目次の各章は「公開資料（事例ページ拡張）」用。社内向け詳細は K1 lessons-learned として別管理（`marketing-knowledge-reflection-design-v2.md` §3.1）
- **開示配分の章別整合**: harness 80% / org 50% / cost 100% / ToS 概要 を全 13 章に配分、各章で「何を出して何を伏せるか」を §1.2 表で明記

### §1.2 各章の詳細目次（13 章構成、想定 13,500 字）

#### §1.2.1 章別概要表

| # | 章タイトル | 想定字数 | 開示配分（harness/org/cost/ToS） | Heading A 整合点 | 競合差別化要素 |
|---|---|---|---|---|---|
| 序章 | プロジェクト経緯と Heading A の位置 | 600 字 | -/30%/-/- | Heading A の採用根拠を読者と共有 | 自社 PoC として透明性を訴求、商用 SaaS とは立ち位置が異なる |
| 1 | 組織構造 — 7 部署 + harness 層 | 800 字 | -/50%/-/- | 「AI 組織が AI 組織を運営する」の主体側組織を可視化 | Devin / OpenHands は組織記述なし、本件は組織図 + プロンプト概念のみ公開 |
| 2 | harness 設計思想 — MUST/MUST-NOT 対 | 1,500 字 | 80%/-/-/- | harness 40% 訴求の最前面、 Heading A の運用主体側を支える基盤 | 「権限境界を先に書く」設計は商用 SaaS にもみられない |
| 3 | HITL 7 種詳解 | 1,200 字 | 80%/-/-/概要 | 自律運用の中で人間ゲートを 7 種設計、Heading A の「運営」側面を支える | OpenHands は HITL 任意、Devin は内蔵不透明、本件は明示的 7 種 |
| 4 | mock-claude + TimeSource 設計 | 1,200 字 | 80%/-/-/- | テスト工学の柱、副作用ゼロ証明の前提 | Windows 上での決定論テストは libfaketime 不可、独自 TimeSource 注入は他社にない |
| 5 | openclaw-runtime ラッパ設計 | 1,000 字 | 80%/-/-/概要 | 商用 AI コーディング基盤を harness 層で包む設計 | OpenClaw 上流の OSS リポは存在するが、ラッパ設計は本件独自 |
| 6 | BAN drill 設計 | 900 字 | 80%/-/-/概要 | Phase 1 期間中の 2 回 BAN drill 設計、運用側で能動的に解釈 | 商用 SaaS は提供側責任、本件は運用側で予防訓練 |
| 7 | changelog 監視 4 系統 | 800 字 | 80%/-/-/概要 | Anthropic / OpenAI / Vercel / Open Claw の 4 系統 changelog を harness で監視 | 商用 SaaS 利用者で changelog 監視を運用化している例は珍しい |
| 8 | コスト計画 100% 開示 | 1,200 字 | -/-/100%/- | $300 ハードキャップ、$200+$200 計算根拠、Vercel Hobby→Pro 段階移行 | コスト 100% 開示は他社で珍しい、中小企業発注検討者に最も刺さる |
| 9 | G-Top-1〜4 / Q-Mkt-01〜08 採択経緯 | 800 字 | -/50%/-/- | 「組織が組織を運営する」中の意思決定プロセス | 自社 PoC の意思決定経緯を公開する例は希少 |
| 10 | Phase 1 結果（DoD 達成度） | 1,300 字 | 80%/50%/100%/概要 | 4 軸全 ての達成度を提示、Heading A 訴求の証拠 | 67→83 テスト全緑、9→34 必須コントロール、$300 内、副作用 0 行 |
| 11 | 副作用ゼロ実証 | 800 字 | 80%/-/-/- | grep + 自動スクリプトの二重確認の実装 | 自動化された副作用検証スクリプトは他社で珍しい |
| 12 | Phase 2 展望 / 学び / KPT | 1,200 字 | -/50%/100%/概要 | 「組織が組織を運営する」の継続改善側面 | KPT 振り返りを公開する例は希少 |
| 終章 | まとめと次の試行 | 200 字 | -/-/-/- | Heading A の余韻 | — |

合計: **13 章 / 13,500 字想定**

#### §1.2.2 各章の Heading A 整合点（詳細）

- **序章**: 「AI 組織が AI 組織を運営する」というキャッチコピーが事業方針「AI 感を出さないクリーン」とどう両立するかを冒頭で説明、矛盾を読者に提示してから章を進める
- **章 1 組織構造**: 「運営される側」も「運営する側」も AI 組織であるという事実を組織図で示す
- **章 2 harness 設計思想**: 「運営する」の手段を harness で実装、Heading A の運用主体側基盤
- **章 3 HITL 7 種**: Heading A だけでなく「人間が監督する」運用の存在を明示、過剰擬人化リスクを回避
- **章 4 〜 章 7**: 技術詳細、Heading A の余韻として「これだけ厳密に設計しているからこの主張ができる」と支える
- **章 8 コスト**: Heading A 訴求の中で「実際にどれだけお金がかかったか」を transparent に示す
- **章 9 採択経緯**: 「組織が組織を運営する」中で人間オーナーがどこに介入したかを開示
- **章 10 Phase 1 結果**: Heading A の証拠
- **章 11 副作用ゼロ**: Heading A の運用が他案件を巻き込まなかった証拠
- **章 12 Phase 2 展望**: Heading A の継続性

### §1.3 ToS 詳細伏字ガイドライン

#### §1.3.1 一次条文公開禁止の根拠

OpenAI Service Terms / Anthropic Usage Policy / Vercel Terms of Service の一次条文を引用公開することは、契約上グレーである：
- 一次条文の引用は著作権法上の引用要件（必然性 / 主従関係 / 出典明示）を満たす範囲では合法
- ただし、一次条文の解釈表現（「グレー」「条件付き許容」「黙認」等）を併記すると、ベンダーから「事実誤認」または「不当評価」の指摘を受けるリスクが残る
- 本件 Phase 1 は ToS リスクを能動的に評価して受容しているため、一次条文を伏せ「判定方針のみ公開」することで両立を図る

#### §1.3.2 ToS 詳細伏字ルール（13 章共通）

- [ ] 一次条文の直接引用は **行わない**（引用記号 `>` で囲んだ条文文章は全章 NG）
- [ ] 「Anthropic」「OpenAI」「Vercel」「Open Claw」の固有名詞 + ToS 解釈表現の組合せ（「Anthropic ToS では...」「OpenAI のグレーゾーン...」等）は **行わない**
- [ ] 代替表現は「商用 AI コーディングプラットフォーム」「商用 AI サブスクリプションサービス」「クラウドホスティング基盤」等の婉曲名
- [ ] 解釈方針の表現は「重大運用リスクを定量評価して受容」「人間が監督できる時間帯のみ稼働」「半年ごとに ToS 解釈を再評価」等
- [ ] 数値閾値（12h/日 / $1,000/月 / 12 ヶ月以内 BAN 確率 30〜60%）は **直接出さない**、代わりに「上限値を運用ルールで制約」「重大リスクを定量評価」と婉曲
- [ ] BAN drill / multi-account / OAuth トークン経路 / API キー切替 等の具体仕様は伏字、原則のみ
- [ ] 競合（Devin / OpenHands / Cursor / Codex）の ToS 解釈には触れない（自社で判断する立場のみ）

#### §1.3.3 章別 ToS 伏字対応表

| 章 | ToS 開示範囲 | 伏字対象 | 公開対象 |
|---|---|---|---|
| 序章 | 概要 | 一次条文 | 「ToS を読み込んで運用設計した」事実のみ |
| 章 3 HITL 7 種 | 概要 | HITL 第 6 種 `tos_gray_review` の発動条件詳細 | 7 種があるという事実、Heading A 整合性 |
| 章 5 ラッパ設計 | 概要 | OAuth 経路詳細、API キー env 切替 | 「商用基盤を harness 層で包む」設計原則 |
| 章 6 BAN drill | 概要 | 具体シナリオ名 (`silent_revoke` / `auth_failed`) / 12h 閾値 | 「2 回の BAN drill を訓練」事実 |
| 章 7 changelog 監視 | 概要 | 各ベンダーの changelog 一次 URL / 監視頻度 | 4 系統 changelog を監視する設計 |
| 章 8 コスト | — | — | 100% 開示、ただし API キー切替手順は伏字 |
| 章 9 採択経緯 | 概要 | Q-Mkt-01〜08 の各議題詳細 | 8 議題 + DEC 4 件の事実 |
| 章 10 結果 | 概要 | NG-1〜3 暫定値 | DoD 達成度の数値 |
| 章 12 Phase 2 展望 | 概要 | 半年再評価対象の具体項目 | 「半年ごとに ToS 解釈を再評価」原則 |

### §1.4 内部 prompt 漏洩防止チェックリスト（org 50% で部署プロンプト詳細は非公開）

#### §1.4.1 漏洩防止対象一覧

- [ ] 各部署プロンプトの全文（CEO / Marketing / PM / Dev / Research / Review / 秘書 / Web 運営 の 8 部署）
- [ ] 部署プロンプトの抜粋（重要セクションだけでも非公開）
- [ ] HITL ゲート 6 種の具体仕様（`tos_gray_review` / `cost_breach` / `auth_failed` / `kill_switch` 等のシナリオ名）
- [ ] mock-claude スタブのコード片 / シナリオ名（5 シナリオ全名称）
- [ ] kill-switch シグナル仕様（HUP / TERM / KILL の使い分け詳細）
- [ ] G-Top-1 デモアプリ生成プロンプト全文
- [ ] BAN drill 内部 prompt（drill #1 / #2 のシナリオプロンプト）
- [ ] cost_check skill の prompt template
- [ ] auth-detector の `stat()` 呼出仕様 + env block-list の正規表現

#### §1.4.2 漏洩検知ルール

- [ ] 公開前 grep: `prompt|プロンプト|tos_gray|silent_revoke|auth_failed|kill_switch|HUP|TERM|KILL` の全件確認
- [ ] 公開前 grep: 部署名 + コロン (`CEO:` / `Marketing:` 等) の全件確認、内部対話形式が露出していないか
- [ ] 公開前 Review 部門 二次チェック: 部署プロンプト全文の照合（社内マスタ vs 公開資料）
- [ ] 公開後モニタリング: SNS 引用 RT / コメントで「内部 prompt が漏れているのでは」と指摘された場合、24h 以内に該当箇所修正 / 取り下げ判断

#### §1.4.3 漏洩発生時のエスカレーション

1. Marketing 第一発見者 → CEO 即時連絡（10 分以内）
2. CEO → 取り下げ判断（最大 30 分）
3. 取り下げ判断確定 → Marketing 即時取り下げ（最大 60 分）
4. 取り下げ後 24h 以内に「漏洩事故報告書」起票（CEO 主導、Marketing / Review / Dev 共同）
5. 半年棚卸し（10 月末）で再発防止策を anti-pattern として登録（K8/K9 同様、PRJ ID 伏字 + 教訓全面公開）

### §1.5 公開後 6 ヶ月のシリーズ展開予定（Phase 2 後継エントリ候補 5 件）

#### §1.5.1 シリーズ全体方針

- 6/20 公開を「第 1 弾」と位置づけ、6 ヶ月以内（〜 12 月末）で 5 件の後継ブログを順次公開
- 各エントリは Phase 2 進捗 / 半年再評価 / KPT 結果 等の自然なトリガーに合わせる
- 「公開頻度を作る」ことを目的とせず、「実績ベースで自然な公開」を維持
- 全エントリで Heading A の一貫使用は不要、各エントリ固有の見出しを採用

#### §1.5.2 後継エントリ候補（5 件）

| # | 公開予定 | 仮タイトル | 想定字数 | 主要トピック | 開示配分 | 公開条件 |
|---|---|---|---|---|---|---|
| BE-1 | 2026-08（Phase 2 W2） | 「harness を多案件並走で運用する 6 週」 | 8,000 字 | Phase 2 で harness を Sumi / Asagi に展開した結果、副作用ゼロ運用の継続検証 | 80%/50%/100%/概要 | Phase 2 GO 採択（6/13 同時決裁）+ Phase 2 W2 完了 |
| BE-2 | 2026-09 | 「半年棚卸しで見つかった ToS 解釈の変化」 | 6,000 字 | 半年再評価で見つかった ToS 改定 / 運用調整内容、changelog 監視 4 系統の精度評価 | 30%/-/-/概要 | 10 月末半年棚卸し前倒し or 9 月中旬の changelog 重要変更検知 |
| BE-3 | 2026-10 | 「自社 PoC で得た受託案件用 harness 設計のひな型」 | 7,000 字 | Phase 1 + Phase 2 の harness 知見を中小企業向け受託の standard template に展開した結果 | 80%/-/-/概要 | 受託案件で harness 設計を実装した実績 1 件以上 |
| BE-4 | 2026-11 | 「mock-first テスト戦略の Web / モバイル受託への展開」 | 6,500 字 | TimeSource pattern を Vercel / Supabase / Expo 等の受託案件に展開、Windows 環境での決定論テスト確立 | 80%/-/-/- | 受託案件で TimeSource を採用した実績 1 件以上 |
| BE-5 | 2026-12 | 「Phase 1 〜 Phase 2 の 6 ヶ月で副作用ゼロを維持した運用」 | 7,500 字 | Phase 1 完了から 6 ヶ月の grep + 自動スクリプト累計実行結果、副作用ゼロが破れなかった証拠 | 80%/50%/100%/概要 | Phase 2 完了 + 副作用ゼロ維持 |

#### §1.5.3 シリーズ展開リスク

- Phase 2 NoGo 時: BE-1 / BE-3 / BE-5 の 3 件は公開条件未達 → BE-2 / BE-4 のみ公開、シリーズ縮小
- 半年再評価で重大 ToS 改定検知時: BE-2 を前倒しで 9 月公開、または「半年再評価結果を伏字で公開」する例外運用
- 受託案件での harness 採用が 1 件もない場合: BE-3 / BE-4 公開不可、シリーズ完結 BE-5 のみ

---

## §2. LP wireframe 初稿 — HP トップ Hero セクション

### §2.1 HP トップ Hero セクション設計

#### §2.1.1 配置方針

DEC-019-029（HP トップ + 事例 + Contact form のみ）採択により、HP トップページの Hero セクションに Clawbridge 訴求枠を新設。既存 GENサイト参考デザイン（COMPANY-WEBSITE 設計）の Hero 直下「下層第 2 ブロック」または Hero 直下に配置する。

- **配置案 A**: Hero 直下（既存 Hero の下に Clawbridge ブロック挿入、Hero 自体は維持）→ **採用**
- **配置案 B**: Hero と置換（Hero 自体を Clawbridge 訴求に書き換え）→ **不採用**（GENサイトデザインの世界観毀損）
- **配置案 C**: 下層フッタ近接（Footer 直前）→ **不採用**（下層スクロール深度が低く、訴求効果不足）

#### §2.1.2 Heading A コピー（h1 + subhead 案 3 件 + CTA 配置）

```
（h1, 36px Bold, Geist Sans）
AI 組織が AI 組織を運営する。

（subhead 案 1, 18px Regular, 110 字）
自社プロダクトを 4 週間で安全に検証するために、月次予算を固定したまま
既存案件に副作用を出さず、自律運用基盤を harness 設計で完遂しました。

（subhead 案 2, 18px Regular, 105 字）
商用 AI コーディング基盤を組み合わせた自律運用 PoC の harness 設計と
運用結果を公開します。月次予算 $300 内、副作用 0 行で完遂。

（subhead 案 3, 18px Regular, 100 字）
組織が組織を運営する側面を含む自社 PoC を、副作用ゼロで完遂した
記録です。harness engineering の運用設計を公開しました。

（CTA, primary button, 16px Medium）
事例を読む → /works/clawbridge

（CTA, secondary link, 14px Regular）
他の実績を見る → /works
```

#### §2.1.3 subhead 案の選定方針

- subhead 案 1（**Marketing 第 1 推奨**）: 訴求軸 4 軸（4 週間 / 月次予算固定 / 副作用ゼロ / harness）を全て含み、Heading A の余韻を具体化
- subhead 案 2: 数値訴求が前面、harness engineering 40% 配分と整合
- subhead 案 3: 抽象度高、AI 感を抑える効果は最大、ただし読者に伝わりにくいリスク

CEO 採択は M2 中間レビュー（5/26）で確定する。

#### §2.1.4 ビジュアル指示

- Hero 流用または橋のメタファ縮小版（Clawbridge の bridge 命名と整合）
- 写真ジャンル: 抽象的な格子・橋・接続のメタファ
- AI 系のアブストラクト 3D / グロウ系は **不採用**（design-guidelines.md 「AI 感を出さない」原則）
- 画像形式: WebP（`next/image` 経由）、ライト / ダーク両対応
- 推奨サイズ: 1920x800 desktop / 1280x600 tablet / 750x500 mobile
- 画像配置: subhead の右側または subhead の上部背景に半透明オーバーレイ

### §2.2 トップページ段落差替個所一覧（現行 vs 6/20 公開後）

#### §2.2.1 現行 HP（`https://ai-company-ten.vercel.app/`）の構造前提

COMPANY-WEBSITE 既存構成（progress.md 100% 完了済）:
- Hero（GENサイト参考、既存）
- Services セクション（既存）
- Portfolio セクション（既存、PRJ-XXX の事例カード並列）
- Blog セクション（既存）
- About セクション（既存）
- Contact セクション（既存、Phase 1 では `/contact` ページ自体を除外していた可能性 → 要確認 W3 着手前に Web 運営確認）
- Footer

#### §2.2.2 6/20 公開後の HP 段落差替個所

| # | 配置 | 現行 | 6/20 公開後 | 差替範囲 |
|---|---|---|---|---|
| 1 | Hero 直下 | 既存（GENサイト参考の Hero のみ） | **Clawbridge 訴求ブロック新設**（§2.1 Heading A + subhead + CTA） | 新規挿入、200〜250 字 |
| 2 | Portfolio セクション | 既存事例カード（PRJ-001〜018） | **Clawbridge 事例カード追加**（事例カード 1 枚、§3 で詳述） | 新規 1 枚追加 |
| 3 | About セクション「強み」段落 | 既存（中小企業向け Web アプリ受託 4 強み: スピード / AI 活用 / コスパ / 実装柔軟性） | **改訂なし**（Q-Mkt-06 採択により About 追記は不採用、トップ訴求枠で代替） | 改訂なし |
| 4 | Services セクション | 既存 | **改訂なし**（自社 PoC は受託提供ではないためサービスメニューに紛れ込ませない） | 改訂なし |
| 5 | Blog セクション | 既存 | **改訂なし**（Q-Mkt-06 採択により `/blog` 直接運用は採用しない、技術ブログは事例ページの拡張章 `/works/clawbridge/technical-deep-dive` で運用） | 改訂なし |
| 6 | Contact セクション | 既存（mailto fallback） | **改訂なし**（Q-Mkt-06 採択により Contact form のみ） | 改訂なし |

### §2.3 事例ページ wireframe（`/works/clawbridge`、Phase 1 G-Top-1 デモ作品 6 件分）

#### §2.3.1 事例ページ全体構造

ポートフォリオ v2 §3.1 で確定の S1 〜 S7 構造を踏襲。本書では S5 Tech Stack の下に「Phase 1 G-Top-1 デモ作品 6 件」のサブセクションを新設し、(a) HN trending TS リポジトリ Web 化 4 件 + (e) 自社 PRJ-001〜018 リファクタ 2 件 = 計 6 件の作品カードを配置する。

#### §2.3.2 G-Top-1 デモ作品 6 件のカード構成

W1〜W3 で (a) HN trending TS Web 化 4 件、W4 で (e) 自社リファクタ 2 件 を実施するため、6 件構成。

| # | 出自 | 仮題材 | 技術スタック | 開示範囲 |
|---|---|---|---|---|
| Card 1 | (a) HN W1 第 1 件 | TS 製 CLI ツール → Web UI ラップ（仮題材、5/19 W1 着手後確定） | TypeScript / Next.js / Vercel | harness 80% / cost 100% |
| Card 2 | (a) HN W1 第 2 件 | TS 製 lint ルール → Web UI 公開（仮題材） | TypeScript / Next.js / Vercel | 同上 |
| Card 3 | (a) HN W2 | TS 製 SDK → Web playground（仮題材） | TypeScript / Next.js / Vercel | 同上 |
| Card 4 | (a) HN W3 | TS 製 static analyzer → Web UI（仮題材） | TypeScript / Next.js / Vercel | 同上 |
| Card 5 | (e) 自社 W4 第 1 件 | PRJ-005 リファクタ scratch branch（自社 Web アプリ、書込安全） | TypeScript / Next.js / Vercel / Supabase | harness 80% / org 50% / cost 100% |
| Card 6 | (e) 自社 W4 第 2 件 | PRJ-014 リファクタ scratch branch（同上、書込安全） | TypeScript / Next.js / Vercel / Supabase | 同上 |

#### §2.3.3 各カードの構成（Card 共通テンプレ）

```
[作品サムネイル, 16:9, 480x270px, WebP]

タイトル（h3, 24px Semibold）: {作品題材}
出自（補足, 14px Regular, color zinc-500）: HN trending TS / 自社 PRJ-XXX リファクタ
公開日（補足, 14px Regular）: 2026-MM-DD
preview deploy URL（リンク, 14px Regular, primary accent）: https://...vercel.app
技術スタック（badge × 3〜5）: TypeScript / Next.js / Vercel / Supabase / その他

説明（本文, 16px Regular, 100〜120 字）:
{作品の harness engineering 訴求点を 1 段落で説明、「自律運用」「副作用ゼロ」「コスト範囲内」の
うち最も該当する 1〜2 軸を強調}

[共通 footer]
所要時間: {30〜60 分} ／ コスト: ${1.5〜5}
```

#### §2.3.4 カードのデザイン指示

- shadcn/ui の Card コンポーネント標準
- 角丸統一（`rounded-md` で shadcn デフォルト）
- ボーダー `border border-zinc-200 dark:border-zinc-800`
- ホバー時: `hover:shadow-md transition-shadow duration-200 ease-out`（150-300ms ease-out のガイドライン準拠）
- アイコン: Heroicons outline、`ArrowTopRightOnSquareIcon` で外部リンク表示
- 絵文字非使用、装飾アニメーション最小

### §2.4 OG image 設計

#### §2.4.1 OG image 仕様

- **サイズ**: 1200x630px（X / Facebook 標準）、PNG + WebP の 2 形式
- **ライト / ダーク 2 種**: ダークモード対応のため両方制作
- **ファイル名**: `og-clawbridge-light.png` / `og-clawbridge-dark.png`（同 .webp）
- **配置**: `/public/og/` ディレクトリ
- **配信**: Next.js metadata `openGraph.images`、Twitter card `twitter.images`

#### §2.4.2 OG image レイアウト指示

```
+------------------------------------------+
|                                          |
|   [improver ロゴ, 左上, 32x32px]          |
|                                          |
|   AI 組織が AI 組織を運営する。            |  <- h1 相当, 60px Bold, Geist Sans
|                                          |
|   自社プロダクトを 4 週間で安全に検証する     |  <- subhead, 24px Regular
|   harness 設計と運用結果を公開しました。     |
|                                          |
|   [improver.jp/works/clawbridge, 下部]     |  <- URL, 18px Regular Mono
|                                          |
|                          [橋メタファ画像]    |  <- 右側に背景画像
+------------------------------------------+
```

#### §2.4.3 ブランドカラー指示

- **ライト**: 背景 `#FAFAFA`（zinc-50） / テキスト `#18181B`（zinc-900） / アクセント `#52525B`（zinc-600）
- **ダーク**: 背景 `#09090B`（zinc-950） / テキスト `#FAFAFA`（zinc-50） / アクセント `#A1A1AA`（zinc-400）
- アクセント 1 色のみ、多色使い不可（design-guidelines.md 準拠）
- グラデーション NG、フラットデザイン
- AI 系のアブストラクト 3D / グロウ系 NG

#### §2.4.4 OG image 制作リソース

- **第 1 候補**: AIDesigner で 3 案生成 → CEO 採択（5/19 着手、5/26 M2 までに v0.5）
- **第 2 候補**: Marketing 自前で Figma 制作（外注予算ゼロ、ただし制作工数 8〜12h）
- **不採用**: 外部委託（予算 $300 ハードキャップを圧迫）

[OWNER-DECISION-REQUIRED] OG image 制作リソース確保（AIDesigner / 自前 / 外部委託）の選定

### §2.5 SEO meta tags 設計

#### §2.5.1 トップページ（HP `/`）

- title 改訂は不要（既存 HP のタイトルを維持）
- description は Hero 直下 Clawbridge ブロック新設に応じて改訂候補（要 Web 運営確認）

#### §2.5.2 事例ページ（`/works/clawbridge`）

```html
<title>Clawbridge — 自社プロダクト 4 週間 PoC の運用設計 | improver</title>
<meta name="description" content="商用 AI コーディング基盤を組み合わせた高難度 PoC を、月次予算を固定したまま既存案件に副作用を出さず完遂した自社内記録。" />
<link rel="canonical" href="https://improver.jp/works/clawbridge" />
<meta name="robots" content="index, follow" />

<!-- OpenGraph -->
<meta property="og:title" content="Clawbridge — 自社プロダクト 4 週間 PoC の運用設計" />
<meta property="og:description" content="AI 組織が AI 組織を運営する。月次予算を固定したまま既存案件に副作用を出さず、4 週間で完遂した自社 PoC の harness 設計と運用結果を公開します。" />
<meta property="og:image" content="https://improver.jp/og/og-clawbridge-light.png" />
<meta property="og:url" content="https://improver.jp/works/clawbridge" />
<meta property="og:type" content="article" />
<meta property="article:published_time" content="2026-06-20T00:00:00+09:00" />
<meta property="article:author" content="improver" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Clawbridge — 自社プロダクト 4 週間 PoC の運用設計" />
<meta name="twitter:description" content="AI 組織が AI 組織を運営する。月次予算を固定したまま既存案件に副作用を出さず、4 週間で完遂した自社 PoC の harness 設計と運用結果を公開します。" />
<meta name="twitter:image" content="https://improver.jp/og/og-clawbridge-light.png" />

<!-- 構造化データ JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "AI 組織が AI 組織を運営する。",
  "description": "自社プロダクト 4 週間 PoC の harness 設計と運用結果。",
  "author": {
    "@type": "Organization",
    "name": "improver"
  },
  "publisher": {
    "@type": "Organization",
    "name": "improver"
  },
  "datePublished": "2026-06-20T00:00:00+09:00",
  "image": "https://improver.jp/og/og-clawbridge-light.png",
  "url": "https://improver.jp/works/clawbridge"
}
</script>
```

#### §2.5.3 取り下げ時の SEO meta 切替

ポートフォリオ取り下げ判断発動時:
- `<meta name="robots" content="noindex, nofollow" />` に切替
- `<title>` を「Page not available」または取り下げメッセージに変更
- canonical タグは維持（外部リンクの整合性のため）
- OG image を取り下げ告知画像に差し替え（または削除）

### §2.6 アクセシビリティ要件（WCAG 2.1 AA / Heroicons / 絵文字非使用）

#### §2.6.1 WCAG 2.1 AA 必須項目

- [ ] **コントラスト比**: 通常テキスト 4.5:1 以上、大きいテキスト（18px+）3:1 以上、UI 部品 3:1 以上
- [ ] **キーボードナビ**: 全操作可能要素が Tab 順で到達可能、フォーカスリング表示
- [ ] **alt テキスト**: 全 img 要素に意味のある alt（装飾画像は `alt=""`）
- [ ] **見出し階層**: h1 → h2 → h3 の順で省略なく階層化
- [ ] **言語属性**: `<html lang="ja">` 設定
- [ ] **フォーカス可視**: フォーカスリング `outline-2 outline-offset-2` 等
- [ ] **アニメーション制御**: `prefers-reduced-motion` を尊重
- [ ] **画像の文字情報**: 画像内テキストは alt または近接テキストで補完
- [ ] **リンクテキスト**: 「ここをクリック」など曖昧表現を避ける、行先を明示
- [ ] **エラーメッセージ**: フォーム送信エラーは form 内で明示、aria-live="polite"

#### §2.6.2 Heroicons 使用ルール

- [ ] Heroicons outline 24x24（Tailwind `h-5 w-5` または `h-6 w-6`）
- [ ] Solid アイコンはアクティブ状態 / 強調表示にのみ使用
- [ ] アイコン単体ボタンには `aria-label` 必須
- [ ] アイコンの色は親要素の color を継承

#### §2.6.3 絵文字非使用ルール

- [ ] 全 UI 要素で絵文字（Unicode Emoji）使用禁止
- [ ] 装飾目的の絵文字も使用禁止
- [ ] 絵文字代替は Heroicons または短いテキストラベル

#### §2.6.4 アクセシビリティ最終確認手順

- M3 (6/12) 最終締切前に Lighthouse a11y 監査実行、スコア 100 達成
- axe-core 監査実行、エラーゼロ達成
- スクリーンリーダー（VoiceOver macOS / NVDA Windows）で事例ページ全章を読み上げ確認
- キーボードのみで全操作完遂可能確認（マウス使用禁止 5 分テスト）

### §2.7 スマホ対応 wireframe（375 / 768 / 1280px の 3 breakpoint）

#### §2.7.1 ブレークポイント設計

design-guidelines.md レスポンシブブレークポイント表に準拠:

| ブレークポイント | Tailwind | 用途 |
|---|---|---|
| < 640px | デフォルト（375px 想定） | モバイル |
| ≥ 768px | `md:` | タブレット |
| ≥ 1280px | `xl:` | 大画面デスクトップ |

#### §2.7.2 375px モバイル wireframe（HP トップ Hero ブロック）

```
+----------------------+
| [improver ロゴ]       |
+----------------------+
| (既存 Hero、画像 +    |
|  キャッチコピー)       |
+----------------------+
| AI 組織が AI 組織を    |
| 運営する。            |  <- h1, 28px Bold (32px → 28px に縮小)
|                      |
| 自社プロダクトを 4    |  <- subhead, 16px Regular
| 週間で安全に検証する  |
| ため、月次予算を固定  |
| したまま既存案件に副  |
| 作用を出さず、自律運  |
| 用基盤を harness 設   |
| 計で完遂しました。    |
|                      |
| [事例を読む →]        |  <- primary button, 全幅, 48px height
| [他の実績を見る]      |  <- secondary link
+----------------------+
| (Services, Portfolio,|
|  About, Contact, etc)|
+----------------------+
```

#### §2.7.3 768px タブレット wireframe（HP トップ Hero ブロック）

```
+--------------------------------+
| [improver ロゴ]                 |
+--------------------------------+
| (既存 Hero、2 段組)              |
+--------------------------------+
|                  +-------------+|
| AI 組織が AI 組織を| [橋メタファ ] |
| 運営する。        | [画像        ] |  <- h1 32px / subhead 17px
|                  +-------------+|
| 自社プロダクトを 4 週間で安全...   |
|                                |
| [事例を読む →] [他の実績を見る]    |
+--------------------------------+
```

#### §2.7.4 1280px デスクトップ wireframe（HP トップ Hero ブロック）

```
+------------------------------------------+
| [improver ロゴ]              [Nav menu]  |
+------------------------------------------+
| (既存 Hero、2 段組 / 3 段組)               |
+------------------------------------------+
|                              +----------+|
| AI 組織が AI 組織を運営する。  | [橋メタ ] ||
|                              | [ファ画 ] ||  <- h1 36px / subhead 18px
| 自社プロダクトを 4 週間で安全に | [像   ] ||
| 検証するために、月次予算を固定 |          ||
| したまま既存案件に副作用を出さ |          ||
| ず、自律運用基盤を harness 設  |          ||
| 計で完遂しました。            +----------+|
|                                          |
| [事例を読む →]  [他の実績を見る]            |
+------------------------------------------+
```

#### §2.7.5 事例ページ `/works/clawbridge` の breakpoint 別構造

| breakpoint | レイアウト |
|---|---|
| 375px | 縦 1 列、S1〜S7 順次表示、Card 1 列 |
| 768px | 縦 1 列、Card 2 列グリッド（Tech Stack カード / G-Top-1 デモ作品カード） |
| 1280px | 縦 1 列、Card 3 列グリッド、サイドバー目次（位置固定）追加候補 |

---

## §3. オーナー判断要事項一覧（3 件）

| # | 事項 | 判断期日 | CEO 推奨 |
|---|---|---|---|
| 1 | [OWNER-DECISION-REQUIRED] OG image 制作リソース確保（AIDesigner で 3 案生成 / Marketing 自前 Figma / 外部委託） | 5/19 | AIDesigner で 3 案生成 → CEO 採択、外部委託は不採用 |
| 2 | [OWNER-DECISION-REQUIRED] 内部 prompt 漏洩防止チェックリスト（§1.4）の承認、および公開前 grep / Review 二次チェックの運用 | 5/15 | チェックリスト全項目承認、Review 二次チェック実施 |
| 3 | [OWNER-DECISION-REQUIRED] 公開後 6 ヶ月のシリーズ展開予定（BE-1〜BE-5）の実施可否、Phase 2 採否依存性 | 6/13 Phase 1 完了決裁時 | Phase 2 GO 採択時のみ BE-1 / BE-3 / BE-5 公開予定、BE-2 / BE-4 は Phase 2 NoGo でも公開可 |

---

## §4. 関連レポート / 双方向リンク

| 種別 | ファイル / ID |
|---|---|
| 姉妹文書 | `marketing-launch-runbook-2026-06-20.md`（公開逆算工程表 + Asagi シナジー） |
| 上位 v2 設計 | `marketing-portfolio-reflection-design-v2.md`（ポートフォリオ反映） |
| 上位 v2 設計 | `marketing-knowledge-reflection-design-v2.md`（社内ナレッジ反映） |
| 採択根拠 | `ceo-q-mkt-01-08-formal-adoption-2026-05-03.md`（Q-Mkt-01〜08 公式採択書） |
| ジャンル選定 | `ceo-g-top-1-genre-comparison.md`（G-Top-1 (a)+(e) ハイブリッド） |
| 主決裁 | DEC-019-026 / DEC-019-027 / DEC-019-028 / DEC-019-029 / DEC-019-030 |
| 自社 HP | `projects/COMPANY-WEBSITE/`（本番 https://ai-company-ten.vercel.app/）|
| デザイン規範 | `organization/rules/design-guidelines.md` |

---

**制定**: Marketing 部門 ／ **経由**: 本書発行は CB-M-Prep-2026-05-04 タスクの納品物 ／ **次回更新**: M2 中間納品（2026-05-26）
