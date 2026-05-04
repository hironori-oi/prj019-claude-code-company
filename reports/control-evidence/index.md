# PRJ-019 W0-Week1 必須コントロール 単体検証エビデンス索引

- 案件: PRJ-019 Clawbridge — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 開発 (`/dev`)
- 作成日: 2026-05-03
- 対象: W0-Week1 (5/2〜5/8) 必須コントロール 7 項目の単体検証エビデンス
- 検証環境: Windows 11 Home (10.0.26200) / Node 24.11.1 / pnpm 9.12.0
- 全体テスト合計: 10 ファイル / 83 ケース / 全緑（W0-Week1 baseline 67 + time-source 11 + scenario-smoke 5）
- 5/8 18:00 検収会議用エビデンス（5/3 内前倒し提出）

## 1. エビデンス一覧

| ID | 名称 | 実装ファイル | 該当テスト | ケース数 | エビデンスファイル |
|----|------|-------------|-----------|---------|------------------|
| **G-01** | コスト上限 4 層ハードキャップ | `harness/src/cost-tracker.ts` | `harness/src/__tests__/cost-tracker.test.ts` | 12/12 PASS | [G-01-evidence.md](G-01-evidence.md) |
| **G-04** | 公開前人間承認ゲート (HITL) | `harness/src/hitl-gate.ts` | `harness/src/__tests__/hitl-gate.test.ts` | 5/5 PASS | [G-04-evidence.md](G-04-evidence.md) |
| **G-05** | サーキットブレーカ | `harness/src/circuit-breaker.ts` | `harness/src/__tests__/circuit-breaker.test.ts` | 8/8 PASS | [G-05-evidence.md](G-05-evidence.md) |
| **G-06** | レート異常検知 → kill | `harness/src/usage-monitor.ts` | `harness/src/__tests__/usage-monitor.test.ts` | 5/5 PASS | [G-06-evidence.md](G-06-evidence.md) |
| **G-08** | 連続稼働 12h 上限 / 緊急停止 (Kill-switch) | `harness/src/kill-switch.ts` + `usage-monitor.ts` | `harness/src/__tests__/kill-switch.test.ts` | 8/8 PASS | [G-08-evidence.md](G-08-evidence.md) |
| **G-V2-03** | 起動元偽装 / OAuth 直 spawn 全面禁止 | `claude-bridge/src/spawn.ts` | `claude-bridge/src/__tests__/spawn.test.ts` | 10/10 PASS | [G-V2-03-evidence.md](G-V2-03-evidence.md) |
| **G-V2-11** | OAuth トークン到達禁止（**最重要**） | `claude-bridge/src/auth-detector.ts` + `spawn.ts` | `auth-detector.test.ts` (6) + `spawn.test.ts` (G-V2-11 ケース 1) | 7/7 PASS | [G-V2-11-evidence.md](G-V2-11-evidence.md) |

## 2. 表記法

各 G-XX ファイルは以下のセクション構成で統一する:
1. 概要（達成したコントロールの一行定義）
2. 実装ファイル（絶対パス）
3. テスト ID とケース数（vitest テストファイル名と PASS 件数）
4. 検証コマンドと出力（実機）
5. 設計判断
6. 既知の制約 / 持越し
7. Review 部門への質問・依頼

## 3. 全件 PASS ベースライン（実機）

```
$ pnpm test
 Test Files  10 passed (10)
      Tests  83 passed (83)
   Duration  ~8.0s (Windows 11 / Node 24.11.1 / pnpm 9.12.0)

内訳:
- harness/src/__tests__/circuit-breaker.test.ts        (8)  → G-05
- harness/src/__tests__/cost-tracker.test.ts          (12)  → G-01
- harness/src/__tests__/hitl-gate.test.ts              (5)  → G-04
- harness/src/__tests__/kill-switch.test.ts            (8)  → G-08
- harness/src/__tests__/usage-monitor.test.ts          (5)  → G-06
- harness/src/__tests__/time-source.test.ts           (11)  → libfaketime 代替（W0-Week1 5/6 期限の追加）
- claude-bridge/src/__tests__/auth-detector.test.ts    (6)  → G-V2-11 (credentials.json 非読込)
- claude-bridge/src/__tests__/spawn.test.ts           (10)  → G-V2-03 / G-V2-11 (env allow-list)
- claude-bridge/src/__tests__/stream-json-parser.test.ts (13) → 補助 (stream-json schema 耐性)
- tests/integration/mock-claude/__tests__/scenario-smoke.test.ts (5) → B5 / B6 検証用 mock スモーク
```

## 4. W0-Week1 検収会議向け補足

- **G-V2-11 を最重要**として位置付け、auth-detector が credentials.json を読まないことと、spawn の env allow-list が ANTHROPIC_API_KEY / OPENAI_API_KEY / `*secret*` をブロックすることを 2 系統のテスト出力で実証。
- **G-01 の 4 層境界値**（session $5 / project $50 / day $30 / month $300）について、各層独立の reject ケースをテストで実機実行確認。
- 5/8 終了時に PASS 想定の 5 項目（G-04, G-05, G-08, G-V2-03, G-V2-11）はすべてエビデンス完備。
- 部分 PASS の 2 項目（G-01, G-06）は単体テスト PASS、Console 設定 screenshot はオーナー残タスク（5/12 / 5/18 まで）として持越し。

## 5. 関連ドキュメント

- W0-Week1 実装報告: `projects/PRJ-019/reports/dev-w0-week1-implementation-report.md`
- Review 検証チェックリスト: `projects/PRJ-019/reports/review-w0-week1-verification-checklist.md`
- Review 検収会議アジェンダ: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`
- Review ペネトレシナリオ: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- CEO 連結報告: `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md`
- mock-claude スタブ: `projects/PRJ-019/app/tests/integration/mock-claude/README.md`
