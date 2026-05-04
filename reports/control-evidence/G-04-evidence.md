# G-04 公開前人間承認ゲート (HITL) — 単体検証エビデンス

## 1. 概要

`FileHitlGate.requestApproval(action)` が 5 種類のリスクアクション（public_release / paid_api_call / force_push / prod_deploy / external_api）に対し、`~/.clawbridge/pending-approvals/<uuid>.{approved|rejected}` ファイルポーリングで承認待機し、24h timeout で **default reject** に倒す。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/hitl-gate.ts`
  - `requestApproval(action)`: pending file 作成 → 50ms 間隔ポーリング → `.approved` 検出で proceed / `.rejected` で block / timeout で default reject
  - `decide(id, decision, meta)`: 承認者側 API（テスト用 / Slack 連携時に呼ばれる想定）
  - `listPending()`: 承認待ち request ID 一覧
- 公開API: `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/index.ts` の `Harness.hitl: HitlGate`

## 3. テスト ID とケース数

- テストファイル: `harness/src/__tests__/hitl-gate.test.ts`
- 対象テスト: 5 ケース / 全件 PASS

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `approves when .approved file is placed` | バックグラウンド placer が `.approved` ファイル投入 → `result.approved=true` |
| 02 | `rejects when .rejected file is placed` | `.rejected` ファイル投入 → `result.approved=false, reason='rejected'` |
| 03 | `times out when no decision is made` | 200ms timeout で `result.approved=false, reason='timeout'` |
| 04 | `listPending returns ids` | 承認待ち request ID の列挙（race の起点となる API） |
| 05 | `cleans up pending files after decision` | 決定後に pending file が remove される |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/harness test -- hitl-gate --reporter=verbose
```

実機 stdout（04:19:46 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness

 ✓ src/__tests__/hitl-gate.test.ts > FileHitlGate > approves when .approved file is placed
 ✓ src/__tests__/hitl-gate.test.ts > FileHitlGate > rejects when .rejected file is placed
 ✓ src/__tests__/hitl-gate.test.ts > FileHitlGate > times out when no decision is made
 ✓ src/__tests__/hitl-gate.test.ts > FileHitlGate > listPending returns ids 1044ms
 ✓ src/__tests__/hitl-gate.test.ts > FileHitlGate > cleans up pending files after decision

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  2.19s
```

5 種 action 受け入れ確認（型レベル / コード抜粋）:
```ts
// hitl-gate.ts より HitlActionType 定義
export type HitlActionType =
  | 'public_release'
  | 'paid_api_call'
  | 'force_push'
  | 'prod_deploy'
  | 'external_api'
```

→ TypeScript 型レベルで 5 種に enumerate されている。テスト中の `sampleAction.type='public_release'` が代表例。Review 側で他 4 種別の動作確認が必要であれば W0-Week2 でパラメタライズドテスト追加可能。

## 5. 設計判断

1. **file-based 承認 (`.approved` / `.rejected` ファイル投入)** — Slack webhook 未接続でも 5/3 時点で動作する設計。承認 UX は秘書/PM が手動で `~/.clawbridge/pending-approvals/<uuid>.approved` を touch することで proceed させる暫定運用。W1 上旬に notify/ workspace で Slack 連携実装予定。
2. **24h timeout で default reject** — 安全側へ倒す原則。pending request ファイル作成時刻 + timeoutMs を見て自動判定。テストでは 200ms timeoutMs に短縮して動作確認。
3. **race condition 対策** — `decide()` は ファイルシステム上の rename 操作（atomic）で実現。同時に approve/reject が来ても先勝ち、後勝ちは fs.rename の OS 保証に委ねる（Windows NTFS は atomic）。
4. **承認者ID / 承認理由 / 承認時刻** — `HitlApprovalResult` に `approver` / `comment` / 内部的に ts も保持（W0-Week2 で audit log Supabase append-only に flush 予定）。
5. **5 種 action × risk level 3 段階** — `HitlRiskLevel = 'low' | 'medium' | 'high'` で Slack 通知優先度の差別化に備える（W1 で活用）。

## 6. 既知の制約 / 持越し

- **Slack webhook 通知の実装は W1 上旬持越し**（dev-w0-week1-implementation-report.md §6.2 に既記載）。現状 pending file 出現 → オーナー手動 touch という運用前提。
- **24h 時刻偽装テスト** — 現行は 200ms に短縮した運用テストのみ。W0-Week2 で `FakeTimeSource` を活用し、24h+1s で確実に reject される本格的時刻偽装テストを追加可能（time-source.ts は今回追加済みなので工数は小）。
- **5 種 action 個別パラメタライズドテスト** — 現状 `public_release` のみで代表検証。Review 検証チェックリスト v1 §3.2 UT-G04-01 / UT-G04-02 の「5 種すべて」要件は W0-Week2 で `it.each(5 種)` で網羅予定。
- **approval ファイル schema validation / 署名検証** — 現状 JSON 単純 read。Review §3.2 UT-G04-05 の tampering alert は W1 で実装。

## 7. Review 部門への質問・依頼

1. **Q1**: 5 種 action 個別の it() ブロックは W0-Week1 完了範囲に含めるべきか、W0-Week2 で良いか? 現状は型レベル enumerate と代表 1 種の動作確認のみ。
2. **Q2**: pending approval の Slack 通知実装が 5/8 までに必要かどうか。dev W0-Week2 線表（5/9〜15）で `notify/` workspace に着手予定だが、HITL ゲート発動頻度は W0 段階では低い前提。
3. **依頼**: 24h timeout の時刻偽装テストを W0-Week1 中に time-source.ts を活用して追加した方が検収上望ましいか確認希望（工数 ~30 分で対応可）。
