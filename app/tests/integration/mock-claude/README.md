# mock-claude

PRJ-019 Clawbridge — 公式 `claude` CLI 互換の最小スタブ実装。

## 目的

Review 部門のペネトレーション風シナリオ B5（連続稼働超過）と B6（BAN 模倣）の検証用に、
本物の Claude CLI を叩かずに claude-bridge の挙動を end-to-end で検証する。

- 課金回避（実 API key / OAuth を一切使わない）
- 決定論的な失敗パス再現（auth_failed / silent_revoke / rate_limit_429）
- timeout テスト用の slow パス
- Windows / WSL2 / POSIX 全環境で動作（Node.js のみ依存）

## ファイル構成

```
mock-claude/
├── bin/
│   └── mock-claude.mjs          # スタブ本体
├── __tests__/
│   └── scenario-smoke.test.ts   # 5 シナリオ × 1 ケースのスモーク
└── README.md                    # 本書
```

## シナリオ一覧（環境変数 `MOCK_CLAUDE_SCENARIO` で切替）

| シナリオ          | 挙動                                                                                                   | spawn.ts 期待結果        |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| `success`（既定） | system → tool_use → assistant_message + usage → result の通常フロー、exit 0                            | `success: true`          |
| `auth_failed`     | exit 1 + stderr に `missing credential` / `not logged in` を含む                                       | `error.type='auth_failed'` |
| `rate_limit_429`  | stream-json に 429 エラーメッセージ + stderr に `429 too many requests` + exit 0                       | `error.type='rate_limited'` (※下記注) |
| `silent_revoke`   | exit 1 + stderr に `401 Unauthorized` / `Session token has been revoked`                               | `error.type='auth_failed'` |
| `slow`            | 5 秒スリープしてから success ペイロード（timeout テスト用）                                            | `error.type='timeout'` (timeoutMs<5000 設定時) |

注: `rate_limit_429` は exit 0 で流すため、現行 spawn.ts は exit code = 0 → `success: true` を返す。
B6 BAN 模倣用に exit 0 のまま 429 を含むケース（usage-monitor 側で判定する経路）と、
exit 1 + 429 stderr のケース（spawn.ts が `rate_limited` 分類する経路）の両方を持たせるかは
W0-Week2 で claude-bridge 拡張時に再検討。本 W0-Week1 では「stderr に 429 が出る場合 spawn.ts が
`rate_limited` を返す」既存挙動の検証のみカバー。

## 使い方（claude-bridge spawn からの呼び出し）

`ClaudeBridge` の `command` オプション、または環境変数 `CLAUDE_CLI_PATH` で mock-claude を指定する。

### Node.js から

```ts
import { ClaudeBridge } from '@clawbridge/claude-bridge'
import { join } from 'node:path'

const mockPath = join(
  __dirname,
  '../tests/integration/mock-claude/bin/mock-claude.mjs',
)

const bridge = new ClaudeBridge({
  // shell:true で起動するので `node <path>` 形式でフルコマンドを渡す
  command: `${process.execPath} ${mockPath}`,
  skipAuthCheck: true,
})

// シナリオ切替は extraEnv 経由
const r1 = await bridge.executeTask('hello', {
  extraEnv: { MOCK_CLAUDE_SCENARIO: 'success' },
})

const r2 = await bridge.executeTask('test 401', {
  extraEnv: { MOCK_CLAUDE_SCENARIO: 'silent_revoke' },
})
```

### CLI から手動確認

```bash
# Windows
node "projects\PRJ-019\app\tests\integration\mock-claude\bin\mock-claude.mjs" -p "hi" --output-format stream-json --verbose

# POSIX
node projects/PRJ-019/app/tests/integration/mock-claude/bin/mock-claude.mjs -p "hi" --output-format stream-json --verbose

# シナリオ切替
MOCK_CLAUDE_SCENARIO=silent_revoke node .../mock-claude.mjs -p "hi"
```

## libfaketime 代替（時刻操作）

mock-claude は時刻に依存しないが、Review シナリオ B5（連続稼働 12h 超過）の決定論的検証には
`@clawbridge/harness` の `TimeSource` 注入を使う。

- `harness/src/time-source.ts` に `RealTimeSource` / `FakeTimeSource` を実装
- `usage-monitor.ts` / `cost-tracker.ts` / `circuit-breaker.ts` 全てに `timeSource` オプションを追加
- 既存テストは `now: () => Date` callback を引き続きサポート（後方互換）

これにより、Linux 中心の libfaketime に依存せず Windows 11 上でも 12h ルーフタイム検知や
60s 窓レート異常の決定論的テストが可能になる。

## 実行コマンド

```bash
# mock-claude スモークのみ
cd projects/PRJ-019/app
pnpm test -- mock-claude

# 全テスト（67 + time-source 11 + scenario-smoke 5 = 83 想定）
pnpm test
```

## 既知の制約

- 本 mock-claude は stream-json 形式の最小再現。公式 CLI の最新 schema 拡張（thinking ブロック、
  tool_result 詳細など）には追従していない。実機 live integration は W0-Week2 でオーナー OAuth
  を使い 1 回だけ実施する。
- `rate_limit_429` シナリオの spawn.ts 分類は exit code 0 の場合 `success: true` になる現行仕様。
  必要であれば W0-Week2 で「stream-json 内の error メッセージを見る」ロジックを spawn.ts に追加する。
