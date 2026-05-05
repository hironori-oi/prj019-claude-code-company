# PM-U R28 DEC-019-068 v2 議決手続レポート

- 起案者: PM-U (Round 28 / 10 件目 PM sprint)
- 起案日時: 2026-05-06
- 対象: DEC-019-068 v2 議決 timeline 設計（80-100 min）

## 1. 背景
- R27 Sec-V が DEC-019-068 v2 起案 246 行を decisions.md に物理化済（DEC-080-081 連動）
- R28 で DEC-068 v2 を採決完遂し、DEC-082（W5 完遂宣言）軸 5 と DEC-083（W6 入口条件 #4）の前提条件を確定する必要

## 2. 議決 timeline 設計（80-100 min / 6/9 火 09:00-10:40 JST 想定）

| 段階 | 時刻 | 所要 | 担当 | 内容 |
|------|------|------|------|------|
| T+0 | 09:00 | 5 min | PM-U | 議決開始宣言 / DEC-068 v2 起案 246 行 + DEC-080/081/082/083 連動性 確認 |
| T+5 | 09:05 | 15 min | Sec-V | 起案内容朗読（trigger 4/4 baseline JSON v2.0 / yml 統合 / monitor spec） |
| T+20 | 09:20 | 20 min | 9 役 | 質疑応答（PM-U/PM-V/PM-T/PM-S/PM-R/Sec-V/Sec-V-2/Sec-V-3/AAA） |
| T+40 | 09:40 | 15 min | AAA | 反証セッション（pros/cons 各 軸 evidence based） |
| T+55 | 09:55 | 10 min | PM-U | 修正動議受付（必要時 v2.1 として fix-forward） |
| T+65 | 10:05 | 10 min | 9 役 | 採決投票（6/9 賛成で confirmed） |
| T+75 | 10:15 | 15 min | PM-U | 採決結果 closeout / DEC-082/083 連動議決 開始準備 |
| T+90 | 10:30 | 10 min | Sec-V | post-vote SOP（baseline JSON v3.0 起票準備、R29 Sec-W 引継 prep） |
| T+100 | 10:40 | - | - | 議決完遂 / Owner 拘束 0 分維持 |

## 3. 採決ライン
- 9 役 6/9 賛成で confirmed
- 5/9 以下: revised（v2.1 起案 fix-forward）
- 反対多数: rejected → R29 で再起案 trigger

## 4. 連動議決の処理
- DEC-082（W5 完遂宣言）: DEC-068 v2 confirmed 後に投票（軸 5 前提条件確定）
- DEC-083（W6 入口条件）: DEC-082 confirmed 後に投票（DEC-068 v2 を入口条件 #4 として参照）
- 統合採決 pattern（R27 確立）を踏襲: 3 件まとめ採決 1 session で完遂可能

## 5. 制約遵守
- 8 file md5 1 byte 不変厳守継承
- API call $0 / 副作用 0 / 絵文字 0
- Owner 拘束 0 分（7 層 lock 継承）
- fix forward-only 厳守

## 6. R29 引継
- DEC-068 v2 採決結果に応じた baseline JSON v3.0 起票（Sec-W 担当）
- T-5 物理化 IMPL 3/3（yml 統合）= R29 Sec-W 担当継承
- 連続 14 round milestone evidence の R29 確定
