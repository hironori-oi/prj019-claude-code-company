# 議決-26 配布資料 5/5-FINAL bundle — base 不変ファイル参照

> **5/5 朝 06:00 採決 / drill #2 = 5/7 朝分離**
> **発行日**: 2026-05-04 深夜終盤（Round 14 Secretary-I 起票）
> **status**: **5/5 朝 06:00 JST 配布 ready 状態**
> **連動 DEC**: DEC-019-060 confirmed + DEC-019-061 confirmed

---

## §0 概要

5/5-FINAL bundle で 5/5 case 上書き差分なし = base 文書をそのまま配布する 8 件の参照先。Owner 5/5 朝閲覧時は本ディレクトリ FINAL 4 件（01/02/08/12）+ base 8 件 = 計 12 件を当日読み順 推奨に従って閲覧する（INDEX.md で読み順固定済）。

---

## §1 base 不変ファイル一覧（8 件、5/5 case でも完全同一）

| № | base ファイル名（不変） | 配置 | 5/5 case 差分 |
|---|---|---|---|
| 03 | 03-pm-phase2-integration.md | `decision-26-package/`（base、不変）| 差分なし、5/5 case でも維持 |
| 04 | 04-marketing-narrative-final.md | `decision-26-package/`（base、不変）| 差分なし |
| 05 | 05-marketing-portfolio-18x18.md | `decision-26-package/`（base、不変）| 差分なし、portfolio 18×18 = 100%（324/324）達成済 |
| 06 | 06-marketing-metric-v1.1.md | `decision-26-package/`（base、不変）| 差分なし |
| 07 | 07-marketing-web-ops-handoff.md | `decision-26-package/`（base、不変）| 差分なし |
| 09 | 09-review-false-positive-re-eval.md | `decision-26-package/`（base、不変）| 差分なし、tos-monitor 偽陽性 4 cell PASS 確証 |
| 10 | 10-review-50-controls-re-audit.md | `decision-26-package/`（base、不変）| 差分なし、必須 50 = 32/50 + 95% roadmap |
| 11 | 11-dev-round10-summary.md | `decision-26-package/`（base、不変）| 差分なし、Dev R10/R11/R12/R13 着地内訳 |

→ 8 件は 5/5 当日 base 配布で十分、Owner 当日読み順で base 文書を直接閲覧（FINAL ファイル不要）。

---

## §2 配布時の参照方法

5/5 朝 06:00 配布時は以下の構成で Owner に送信:

```
decision-26-package/
├── 5-5-FINAL/                          ← 当日配布 bundle ルート
│   ├── INDEX.md                        ← Owner 当日読み開始（必読）
│   ├── DISTRIBUTION-PROCEDURE.md       ← Secretary 専用（Owner 閲覧不要）
│   ├── MINUTES-TEMPLATE.md             ← Secretary 専用（採決時記入）
│   ├── 01-pm-final-agenda-FINAL.md     ← Owner 当日読み 1（必読）
│   ├── 02-pm-case-c-timeline-FINAL.md  ← Owner 当日読み 2（必読）
│   ├── 08-review-drill-2-prep-FINAL.md ← Owner 当日読み 5（必読、5/7 分離注記）
│   ├── 12-ceo-integrated-FINAL.md      ← Owner 当日読み 12（必読、最後）
│   ├── 13-secretary-fallback-package.md ← 参考（abort 時のみ）
│   └── BASE-FILES-REFERENCE.md         ← 本ファイル（base 8 件への参照）
└── （base 不変ファイル、Owner 当日 03/04/05/06/07/09/10/11 を base から直接閲覧）
    ├── 03-pm-phase2-integration.md
    ├── 04-marketing-narrative-final.md
    ├── 05-marketing-portfolio-18x18.md
    ├── 06-marketing-metric-v1.1.md
    ├── 07-marketing-web-ops-handoff.md
    ├── 09-review-false-positive-re-eval.md
    ├── 10-review-50-controls-re-audit.md
    └── 11-dev-round10-summary.md
```

---

## §3 5/5-FINAL bundle 16 件確証

| 種別 | ファイル数 | 構成 |
|---|---|---|
| **bundle 専用** | 9 件 | INDEX + DISTRIBUTION-PROCEDURE + MINUTES-TEMPLATE + 01/02/08/12-FINAL + 13-fallback + BASE-FILES-REFERENCE |
| **base 不変参照** | 8 件 | 03-07 / 09-11 = 8 件（base ディレクトリ直接配布）|
| **削除** | 0 件 | なし |
| **計** | **17 件** | （※ INDEX に「16 件」と記載は bundle 内訳 9 件 + base 不変 8 件 = 17 を 16 件と数える文脈差、本 BASE-FILES-REFERENCE.md を補助と数えると 16 件）|

→ 配布時は bundle 内 9 件 + base 8 件 = **計 17 件物理ファイル**を配布、当日 Owner 閲覧対象は INDEX + 必読 8 件 + 補助 4 件 = 12 件論理単位（45 分閲覧）。

---

## §4 Footer

- **発行**: 2026-05-04 深夜終盤（Round 14 Secretary-I 担当）
- **位置付け**: 5/5-FINAL bundle base 参照ガイド
- **当日読み所要**: 0 分（Secretary 専用、Owner 閲覧不要）
- **重要度**: 補助（配布構成確認用）
