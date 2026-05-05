# PRJ-019 Round 26 Dev-VV — W4 第 5 弾候補 5-B (stream-json-parser fuzz / chaos) spec 草案 (Round 27 carry-over)

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R26 Dev-VV (W5 第 3 弾物理化 5-A の付随 spec / R27 物理化想定)
位置付け: Round 26 で 5-A (claude-bridge integration e2e) を物理化完了 (`phase2-w5-claude-bridge-integration-e2e.test.ts` 650 行 / 13 tests / 5 groups / harness 836→849 PASS) を踏まえ、Dev-TT R25 spec §1.2 で示された **第 5 弾候補 5-B = stream-json-parser fuzz / chaos** を Round 27 物理化想定で base spec として草案化する持ち越し報告書。
版: v0.9 (草案 / R27 で v1.0 確定想定)
連動 DEC: DEC-019-006 (P-D 改 / subprocess spawn) / 033 (HITL 第 9 種) / 041 (ARCH-01 paths alias) / 049 (Sec hardening) / 062 (stagger 圧縮 SOP) / 074-077 (5/19 統合採決 4 件)
連動 spec / file (絶対無改変):
- `app/claude-bridge/src/stream-json-parser.ts` (parseStreamJsonText / parseStreamJsonLine / parseStreamJsonChunks / extractUsage / ClaudeMessageSchema / ClaudeUsageSchema / 既存 154 行)
- `app/harness/src/__tests__/phase2-w5-cross-orchestrator-e2e.test.ts` (R25 Dev-SS / 754 行 / 12 tests / 不可侵)
- `app/harness/src/__tests__/phase2-w5-cross-package-extension.test.ts` (R25 Dev-TT / 613 行 / 8 tests / 不可侵)
- `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts` (R26 Dev-VV / 650 行 / 13 tests / 不可侵)
- R24 W4 4 段 4 file (Dev-JJ/KK/MM/QQ historical baseline / 不可侵)
- `projects/PRJ-019/reports/dev-tt-r25-claude-bridge-integration-e2e-spec.md` (5-A spec 親書)
物理化対象 file (R27 想定):
- `app/harness/src/__tests__/phase2-w5-stream-json-fuzz-chaos.test.ts` (R27 物理化 / 600-800 行 想定 / 14-18 tests / 5-6 groups)

---

## §0 サマリ (CEO 200 字)

W4 完成第 5 弾候補 5-B = **stream-json-parser fuzz / chaos** spec を物理化レベルで草案化。検証対象: parseStreamJsonText / parseStreamJsonLine / parseStreamJsonChunks の 3 entrypoint × ランダム化された壊れ / 部分壊れ / 巨大入力 / chunk boundary / Unicode edge / Zod schema passthrough 互換 の 6 軸 fuzz/chaos。**test 物理化は R27 想定 / R26 では spec 草案のみ**。工数 5-7h / 中-高優先度 / 5-6 groups / 14-18 tests / failure scenario 10 件 (corrupted 4 + boundary 3 + extreme 3)。R26 5-A 完遂 (harness 849 PASS) を起点に R27 物理化で W4 累計 67-71 tests = +59-69% 増加見込。API call $0 / 実 spawn 0 / file IO は OS tmp のみ (or 完全 in-memory)。R25 Dev-SS / Dev-TT / R26 Dev-VV の物理 file 全件 absolute 無改変保護。決定的 PRNG (seeded) によりテスト再現性を確保し、CI flakiness 0 を担保する。R27 物理化時の base spec として提出可能な水準まで本書で確定。

---

## §1 W4 5 弾累計の到達点と第 5 弾候補 5-B の位置付け

### 1.1 W4 5 弾の構造 (R26 完遂着地 reference)

| 弾 | round | 担当 | 主軸 | tests | 行数 | 物理 file |
|---|---|---|---|---|---|---|
| 第 1 弾 | R22 | Dev-JJ | production e2e 拡張 | +10 | 561 | `17day-path-w4-production-e2e-extended.test.ts` |
| 第 2 弾 | R22 | Dev-KK | breach stress / chaos | +9 | 555 | `file-breach-counter-stress-chaos.test.ts` |
| 第 3 弾 | R23 | Dev-MM | HITL gates 統合 e2e | +9 | 626 | `17day-path-w4-hitl-gates-integration.test.ts` |
| 第 4 弾 | R24 | Dev-QQ | HITL × hardguards cross | +12 | 907 | `17day-path-w4-hitl-hardguards-cross.test.ts` |
| 1M longrun | R22 | Sec-Q | 連続稼働 stability | +5 | - | `heartbeat-1m-10digit-longrun-stability.test.ts` |
| 第 5 弾 5-A | R26 | Dev-VV | claude-bridge integration e2e | +13 | 650 | `phase2-w5-claude-bridge-integration-e2e.test.ts` |
| **計 (R26 着地)** | - | - | - | **58** | - | - |

### 1.2 第 5 弾候補 5-B の位置付け

R25 Dev-TT 親書 §1.2 で示された 3 案 (5-A / 5-B / 5-C) のうち、5-A は R26 Dev-VV で物理化完遂 (本書起案者)。残る 2 案のうち **5-B = stream-json-parser fuzz / chaos** は parser 系 robustness の根幹補完であり、R27 物理化候補の **筆頭** として提出する。

5-C (auth-detector subscription-vs-API-key 切替 e2e) は R28 以降の別起案想定。

### 1.3 W4 完成 5-B 反映後の累計試算

| 観点 | R26 完遂時 | 5-B 物理化後 (R27 想定) | Δ |
|---|---|---|---|
| W4 累計 tests | 58 (R24:42 + R26:13 + Sec-Q:5-3 重複調整) | 67-71 (14-18 件追加 = 5-B のみ) | +14-18 |
| harness PASS | 849 | 863-867 (5-B 14-18 追加) | +14-18 |
| 物理 file 件数 (W4 系列) | 6 | 7 | +1 |
| parser 系 coverage | 基本 path のみ | fuzz / chaos / boundary 完備 | qualitative gain |

---

## §2 5-B 物理化 spec — 全体像

### 2.1 物理化 6 軸サマリ

| 軸 | 内容 | 物理化レベル | R27 担当 |
|---|---|---|---|
| 1 | groups + tests 設計 (5-6 groups / 14-18 tests) | spec 草案 | Dev-WW (R27 dispatch 想定) |
| 2 | seeded PRNG 注入による決定的 fuzz 戦略 | spec 草案 + draft | Dev-WW |
| 3 | corrupted / boundary / extreme failure scenario 列挙 (10 件) | spec 草案 | Dev-WW |
| 4 | API call $0 / file IO 最小化 / in-memory 完結 担保戦略 | spec 草案 | Dev-WW (verify) |
| 5 | 物理 file path 案 + 命名衝突回避 | spec 草案 | Dev-WW (起案) |
| 6 | chunk boundary 跨ぎ + AsyncIterable 経路 chaos 戦略 | spec 草案 | Dev-WW |

### 2.2 設計原則 (R27 物理化時に厳守)

1. **stream-json-parser production code 無改変**: 全 fuzz は parser の 3 entrypoint (parseStreamJsonText / parseStreamJsonLine / parseStreamJsonChunks) を test 内から呼ぶのみ
2. **決定的 PRNG**: seed 固定で同一入力が CI 再実行で 100% 再現可能であること (flakiness 0 担保)
3. **API call $0**: parser は純粋関数 / network 0 / spawn 0 / 何も外部に出さない
4. **file IO は OS tmp 経由 or 完全 in-memory**: 巨大 fixture (>1MB) も `os.tmpdir()` 上で構築 + afterEach cleanup、もしくは Buffer in-memory 完結
5. **R25 Dev-SS / Dev-TT / R26 Dev-VV / R24 W4 4 段 historical baseline 無改変**: 既存 file は import せず、本 5-B は独立 file として並列存在

---

## §3 groups + tests 設計 (5-6 groups / 14-18 tests)

### 3.1 Group F-1 (parseStreamJsonText random fuzz, 3 tests)

**目的**: ランダム生成 NDJSON 入力に対し parseStreamJsonText が 例外 throw 0 / messages + unparseable 整合性維持 を確証。

| test ID | 検証内容 |
|---|---|
| F-1-1 | seeded PRNG で valid NDJSON 100 行生成 → parseStreamJsonText で全件 messages に分類 / unparseable=0 |
| F-1-2 | seeded PRNG で 50% 比率 corrupted JSON (引用符欠 / brace 欠 / 末尾カンマ) → unparseable count >= 期待値 / 例外 0 |
| F-1-3 | mixed 100 行入力 (valid + corrupted + 空行) → messages.length + unparseable.length が non-空行件数と一致 |

### 3.2 Group F-2 (parseStreamJsonLine boundary fuzz, 3 tests)

**目的**: 単行 parser に対し境界条件 (empty / whitespace only / 巨大単行 / Unicode) の robust 性を確証。

| test ID | 検証内容 |
|---|---|
| F-2-1 | 空文字 / 半角スペースのみ / タブのみ → JSON parse error として不可解析判定 (例外なし) |
| F-2-2 | 1MB 単行 valid JSON (`{"type":"system","data":"<1MB string>"}`) → ok=true / message.type='system' |
| F-2-3 | Unicode edge (絵文字 4byte / 結合文字 / ゼロ幅スペース / RTL) を含む valid JSON → ok=true / 文字化けなし |

### 3.3 Group F-3 (parseStreamJsonChunks chunk boundary chaos, 4 tests)

**目的**: chunk 境界が改行を跨ぐ / 1byte 細切れ / 巨大 buffer の AsyncIterable 経路 robust 性を確証。

| test ID | 検証内容 |
|---|---|
| F-3-1 | 改行を含む 10 行 NDJSON を 1 byte ずつ AsyncIterable 化 → yield された messages.length === 10 |
| F-3-2 | 改行が chunk 末尾でなく中間に来る 偏った chunk 分割 → 全 message 復元 / 順序保持 |
| F-3-3 | 末尾改行なし NDJSON → tail 行も yield される |
| F-3-4 | Buffer (utf-8) chunk と string chunk 混在 → 両方 OK / 文字化けなし |

### 3.4 Group F-4 (Zod schema passthrough fuzz, 3 tests)

**目的**: ClaudeMessageSchema / ClaudeUsageSchema の `.passthrough()` 仕様により、未知 field が含まれても保持されることを確証 (forward compat invariant)。

| test ID | 検証内容 |
|---|---|
| F-4-1 | 未知 type (`type:'future_unknown_x'`) を含む JSON 行 → ok=true / message.type='future_unknown_x' 保持 |
| F-4-2 | usage 内に未知 field (`usage:{input_tokens:1, future_field:42}`) → ClaudeUsageSchema 通過 / future_field 保持 |
| F-4-3 | message 直下に未知 field 10 件 → 全 field 保持 (passthrough 確認) |

### 3.5 Group F-5 (extractUsage chaos accumulation, 3 tests)

**目的**: 大量 messages からの usage 抽出で 加算 overflow / partial usage / cost USD ロジック (Math.max) の正しさを確証。

| test ID | 検証内容 |
|---|---|
| F-5-1 | 1000 件 messages に partial usage 散在 → inputTokens / outputTokens 合算が手計算 sum と一致 |
| F-5-2 | total_cost_usd が複数 message に分散 (0.01 / 0.05 / 0.03) → ExtractedUsage.totalCostUsd === 0.05 (Math.max) |
| F-5-3 | usage 全件欠損 + total_cost_usd 全件欠損 → ExtractedUsage 全 field === 0 |

### 3.6 Group F-6 (extreme size + recovery, 2-3 tests / optional)

**目的**: 極端入力 (10000 行 / 数 MB / 全行 corrupted) でも parser が hang / crash しないことを確証。

| test ID | 検証内容 |
|---|---|
| F-6-1 | 10000 行 valid NDJSON (合計 ~5MB) → parseStreamJsonText 完了 / messages.length === 10000 / 実行時間 < 5s |
| F-6-2 | 10000 行 全 corrupted → unparseable.length === 10000 / messages.length === 0 / 例外 0 |
| F-6-3 (optional) | parseStreamJsonChunks に空 AsyncIterable 入力 → yield 0 件 / 例外 0 |

**合計**: 5 groups (F-1〜F-5) 確定 + 6 group 目 (F-6) 2-3 tests = **14-18 tests** 範囲内。

---

## §4 seeded PRNG 注入 + 決定的 fuzz 戦略 spec

### 4.1 PRNG 戦略

CI flakiness 0 担保のため、Math.random() は **絶対使用禁止**。代わりに seeded PRNG (mulberry32 等の純 32-bit hash 系) を test 内 局所 helper として実装する。

```typescript
// 本 5-B 物理化 file 内 局所 helper (production code 無改変)
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED_BASE = 0x5A4D7E2F  // 固定 seed (R27 物理化時に確定)
```

### 4.2 valid JSON 行 generator

```typescript
function genValidLine(rng: () => number): string {
  const types = ['system', 'user', 'assistant', 'result', 'error']
  const type = types[Math.floor(rng() * types.length)]
  const obj: Record<string, unknown> = { type }
  if (rng() < 0.5) obj.session_id = `s-${Math.floor(rng() * 1000)}`
  if (rng() < 0.3) obj.usage = { input_tokens: Math.floor(rng() * 100) }
  return JSON.stringify(obj)
}
```

### 4.3 corrupted JSON generator (4 mutation 種別)

```typescript
function genCorruptedLine(rng: () => number, base: string): string {
  const r = rng()
  if (r < 0.25) return base.slice(0, base.length - 2)        // 末尾切り落とし
  if (r < 0.50) return base.replace(':', '')                  // colon 欠
  if (r < 0.75) return base.replace('}', ',}')                // 末尾カンマ + brace
  return base.replace(/"/g, "'")                              // 引用符を single に
}
```

### 4.4 決定論性 invariant

- 同一 SEED_BASE で複数回 test を回しても 100% 同じ messages / unparseable 件数
- CI 環境 (Linux x64) と dev 環境 (Windows x64) で同一結果 (Math.imul は ECMAScript 仕様で挙動一致)
- vitest reporter 上で test 実行順序が並列 / 直列で変動しても各 test 内 PRNG は局所 seed 起点で独立

---

## §5 failure scenario 列挙 (10 件 / categorized)

### 5.1 corrupted 系 (4 件)

| # | scenario | 想定発火点 | 期待振る舞い |
|---|---|---|---|
| C-1 | JSON.parse 例外 (引用符欠等) | parseStreamJsonLine internal try/catch | `{ ok: false, error: 'JSON parse error: ...' }` |
| C-2 | Zod schema validation 失敗 (例: type が string 以外) | safeParse | `{ ok: false, error: 'schema validation failed: ...' }` |
| C-3 | 改行のみ (空行) | parseStreamJsonText の `if (!line) continue` | スキップ / messages++ せず unparseable++ もせず |
| C-4 | binary 混入 (NUL byte 等) | JSON.parse | C-1 系経路で捕捉 / 例外なし |

### 5.2 boundary 系 (3 件)

| # | scenario | 想定発火点 | 期待振る舞い |
|---|---|---|---|
| B-1 | chunk が改行を含まない (1 行が複数 chunk に分割) | parseStreamJsonChunks の buffer 蓄積 | 改行到達まで yield 0 件 / その後 yield |
| B-2 | 末尾改行なし | parseStreamJsonChunks tail 処理 | tail 行も yield |
| B-3 | 1MB 単行 valid JSON | parseStreamJsonLine | ok=true / message 完全復元 |

### 5.3 extreme 系 (3 件)

| # | scenario | 想定発火点 | 期待振る舞い |
|---|---|---|---|
| E-1 | 10000 行入力 (~5MB) | parseStreamJsonText | 完了 / 実行時間 < 5s / 例外なし |
| E-2 | 10000 行 全 corrupted | parseStreamJsonText | unparseable 10000 件 / messages 0 件 / 例外なし |
| E-3 | 空 AsyncIterable 入力 | parseStreamJsonChunks | yield 0 件 / 例外なし / generator 完了 |

### 5.4 categorization

- **corrupted = 安全側 reject + 詳細 error message 必須**: C-1 / C-2 / C-3 / C-4
- **boundary = 仕様通り continuation 必須**: B-1 / B-2 / B-3
- **extreme = hang / crash / OOM 0 必須**: E-1 / E-2 / E-3

5-B の各 test は対応する scenario に明示的に紐付け、回帰時の root cause 特定を加速する。

---

## §6 API call $0 / 実 spawn 0 / file IO 最小化 担保戦略

### 6.1 API call $0 担保

| layer | 担保手段 |
|---|---|
| parseStreamJsonText | 純粋関数 / 入力 string のみ / 副作用なし (parser 仕様より自明) |
| parseStreamJsonLine | 純粋関数 / 入力 string / 出力 ParseLineResult |
| parseStreamJsonChunks | AsyncGenerator / 入力 AsyncIterable / 副作用なし (yield のみ) |
| extractUsage | 純粋関数 / 入力 ClaudeMessage[] / 出力 ExtractedUsage |

### 6.2 実 spawn 0 担保

parser は子プロセス起動経路を持たないため、構造的に spawn 0 が保証される。test 内でも spawn ライブラリ import 0。

### 6.3 file IO 最小化

| 用途 | 場所 | cleanup |
|---|---|---|
| 巨大 fixture (E-1) 5MB | **完全 in-memory** (`Buffer` join 経由 / fs touch せず) | GC |
| 5MB 超フィクスチャ (もし必要なら) | `os.tmpdir()/clawbridge-w5-5b-fuzz-XXXX` | afterEach で `fs.rm({recursive:true})` |
| heartbeat / breach counter | **本 5-B では touch しない** (R22 Dev-JJ baseline 不可侵) | - |

### 6.4 実行時間予算

| group | 想定実行時間 |
|---|---|
| F-1 / F-2 / F-3 / F-4 / F-5 | 各 < 200ms |
| F-6 (extreme) | 各 < 5s |
| **合計 (file 単位)** | **< 20s** (vitest single file) |

CI 全体 budget (harness 全 file) への影響は +20s 程度を想定し、許容範囲内。

---

## §7 物理 file path 案 + 命名衝突回避

### 7.1 物理 file path 案

| file | path | 行数 想定 |
|---|---|---|
| 本 5-B test file | `app/harness/src/__tests__/phase2-w5-stream-json-fuzz-chaos.test.ts` | 600-800 |
| 本 spec | `projects/PRJ-019/reports/dev-vv-r26-w4-fifth-candidate-spec.md` (本書 / 草案) | 320-400 |
| (R27 v1.0 確定時) Dev-WW spec 確定書 | `projects/PRJ-019/reports/dev-ww-r27-w4-5b-spec-final.md` | 280-360 |
| (R27 完遂時) Dev-WW 完遂報告書 | `projects/PRJ-019/reports/dev-ww-r27-w4-5b-completion.md` | 200-250 |

### 7.2 命名衝突回避

R26 完遂時点 / R27 計画中の file 一覧 (衝突回避対象):
- `phase2-w5-cross-orchestrator-e2e.test.ts` (Dev-SS R25)
- `phase2-w5-cross-package-extension.test.ts` (Dev-TT R25)
- `phase2-w5-claude-bridge-integration-e2e.test.ts` (Dev-VV R26)
- `17day-path-w4-*.test.ts` 4 件 (W4 第 1-4 弾 / 不可侵)

R27 物理化対象 5-B の file 名 `phase2-w5-stream-json-fuzz-chaos.test.ts` は 上記いずれとも prefix `phase2-w5-` は共有するが suffix `-stream-json-fuzz-chaos` は unique で衝突なし。

---

## §8 工数 + 優先度 + 依存関係 + 想定 test 数

### 8.1 工数見積もり (R27 物理化時 / Dev-WW 担当)

| task | 工数 (h) |
|---|---|
| 5-B test file 雛形構築 (groups skeleton + describe/it ブロック 14-18 件) | 1.0 |
| seeded PRNG helper + corrupted/valid generator 実装 | 0.5 |
| Group F-1 (3 tests / random fuzz) 実装 + assertions | 0.5 |
| Group F-2 (3 tests / boundary) 実装 | 0.5 |
| Group F-3 (4 tests / chunk boundary) 実装 | 1.0 |
| Group F-4 (3 tests / passthrough) 実装 | 0.5 |
| Group F-5 (3 tests / extractUsage) 実装 | 0.5 |
| Group F-6 (2-3 tests / extreme) 実装 + 実行時間検証 | 0.5-1.0 |
| 10 failure scenario の test 内 assertion 紐付け確認 | 0.5 |
| harness 849+ PASS regression 0 verify | 0.5 |
| **合計** | **5.5-7.0** |

工数 spec range: **5-7h** (5-A よりやや軽量 / pure function 中心)。

### 8.2 優先度

**中-高**: 理由 4 件:
1. parser 系 robustness の根幹補完 (R26 までの基本 path 検証から fuzz/chaos 領域への拡張)
2. forward compat invariant (Zod `.passthrough()` 仕様) の自動回帰検出が可能になる
3. CI flakiness 0 を seeded PRNG で構造的に担保する pattern を W4 系列に確立
4. 5-A (R26 Dev-VV 完遂) と組み合わせて W4 第 5 弾完成宣言の最終裏付け

5-A よりやや優先度が低い理由: 5-A は cross-package coverage 未充填領域だったが、5-B は parser 単体 robustness なので scope が局所的。

### 8.3 依存関係

**前提**:
- R26 完遂 W4 5 段 historical baseline 確定 (OK R26 完遂時点で satisfied / 本書起案時)
- claude-bridge stream-json-parser API 安定 (OK Round 26 まで stabilization 維持)
- Zod >= 3.22 で `.passthrough()` 挙動安定 (OK pinned)

**並列可能**:
- 5-C (auth-detector subscription-vs-API-key 切替 e2e) R28 物理化 (独立)
- W6 / W7 系列の起案 (独立)

**直列必要**:
- なし (5-B は self-contained)

### 8.4 想定 test 数

- Group F-1: 3 tests
- Group F-2: 3 tests
- Group F-3: 4 tests
- Group F-4: 3 tests
- Group F-5: 3 tests
- Group F-6: 2-3 tests (F-6-3 optional)
- **合計**: **14-18 tests** (5-6 groups)

---

## §9 R27 物理化想定 + Round 26 引継

### 9.1 R27 物理化時の制約 (Dev-WW 担当用 checklist)

- [x] 本 spec 草案を pre-read (本書 320-400 行)
- [ ] 本 spec を v1.0 確定 (R27 序盤で `dev-ww-r27-w4-5b-spec-final.md` として起案、本書 inline 修正は許容)
- [ ] R25 / R26 物理 file 3 件 + R24 W4 4 段 4 file の現行行数 / md5 を pre-flight 確認
- [ ] 本 5-B test file を `phase2-w5-stream-json-fuzz-chaos.test.ts` に物理化
- [ ] groups F-1〜F-6 を §3 通りに実装
- [ ] seeded PRNG (mulberry32) + corrupted/valid generator を §4 spec で実装 (test 内局所 helper)
- [ ] failure scenario 10 件を §5 categorization に従い assert
- [ ] harness 849+ PASS / openclaw-runtime 394 PASS / regression 0 検証
- [ ] CI flakiness 0 検証 (3 回連続 PASS)
- [ ] DEC-019-XYZ 関連 ack に Y 1 件追加できる水準で完遂報告書起案

### 9.2 Round 26 引継 (CEO / PM 部門宛)

| 引継 item | 担当想定 (R27) | 工数 |
|---|---|---|
| 本 5-B 物理化 (test file + 完遂報告書) | Dev-WW | 5.5-7h |
| W4 累計 67-71 tests baseline JSON 起票 | Sec-U | 1.5h |
| INDEX-v15 への 5-B 由来 entry 追加 (PAT-XXX 候補 / fuzz pattern) | Knowledge-U | 1.0h |
| DEC-019-XYZ 起案 (5-B 完遂を踏まえた W4 完成最終宣言議決) | PM-S | 2.0h |

---

## §10 制約遵守 (本 spec 草案起案時 / R26 Dev-VV)

- [x] R25 Dev-SS / Dev-TT / R26 Dev-VV (本書起案者の R26 5-A 物理化) 物理 file absolute 無改変
- [x] R24 W4 4 段 historical baseline absolute 無改変
- [x] claude-bridge / openclaw-runtime / harness production code 無改変 (本書は spec 草案のみ)
- [x] API call $0 / 副作用 0 / 絵文字 0
- [x] 物理化 file は R27 想定 (R26 では起案しない)
- [x] R26 5-A 物理 file (`phase2-w5-claude-bridge-integration-e2e.test.ts`) と本 5-B file 名衝突なし
- [x] R26 5-A 完遂着地 (harness 836→849 / +13) baseline 維持 (本 spec 起案で +0 tests)

---

## §11 結語

W4 完成第 5 弾候補 5-B = stream-json-parser fuzz / chaos の物理化 spec を 6 軸 + 10 failure scenario + 14-18 tests / 5-6 groups の水準で草案化。R27 物理化想定 / R26 では spec 草案のみ。R25 Dev-SS / Dev-TT / R26 Dev-VV (本書起案者) 物理 file と命名衝突なし。R27 Dev-WW 担当で 5.5-7h 工数で物理化可能な base spec として CEO / PM 部門に持ち越す。

R26 完遂時点 W4 5 段 historical baseline は absolute 無改変保護、API コスト $0、副作用 0、絵文字 0、harness 849 PASS / openclaw-runtime 394 PASS 維持を担保。R27 物理化完遂時の見込みは harness 863-867 PASS (+14-18) / W4 累計 72-76 tests = +71-81% 増加。

5-C (auth-detector subscription-vs-API-key 切替 e2e) は本書のスコープ外、R28 以降の別 spec として別起案する。
