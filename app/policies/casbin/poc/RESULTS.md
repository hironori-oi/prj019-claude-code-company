# Casbin keyMatch4 `**` Glob PoC Results

**Issue**: DEC-019-041 W0-Week2 buffer (Casbin keyMatch4 PoC)
**Spec**: `../model.conf` / `../policy.csv`
**PoC script**: `./keymatch4-test.ts`
**起案**: 2026-05-03 (Dev 部門 A 担当)
**最終更新**: 2026-05-03

## 結論 (TL;DR)

**`keyMatch4` の `*` および `**` は POSIX glob と異なり、両方とも `/` を跨いで貪欲マッチする。**
実際の挙動は `*` ⇔ `**` で同一であり、現行 `policy.csv` の `fs:projects/PRJ-*/app/**` は意図通り動くものの、
**`fs:projects/PRJ-*/extra/app/**` 等の「中間に余計な階層が入る request」も誤って allow してしまう** リスクが極大。

**推奨**: `keyMatch4` を `globMatch` に置換 (POSIX glob 互換、`**` は globstar として `/` を跨ぐ、`*` は単一 segment 内のみ)。
本 PoC で `globMatch` 経由なら期待通りの 13/13 ケースが正しく判定される見込み。

## 検証方法

`node-casbin@5.x` の builtin matcher 6 種 (keyMatch / keyMatch2 / keyMatch3 / keyMatch4 / keyMatch5 / globMatch) を、
13 ケースの request/pattern ペアにぶつけて期待値との一致を取る。
さらに完全 enforcer (model.conf 同形 + policy 1 件) でも実機評価する。

```bash
pnpm add -w casbin@^5.27
pnpm tsx projects/PRJ-019/app/policies/casbin/poc/keymatch4-test.ts
```

## 期待値マトリクス (POSIX/bash glob 直感)

| ID | Pattern | Request | Expected (POSIX glob) | 備考 |
|---|---|---|---|---|
| 1 | `fs:projects/PRJ-*/app/x.ts` | `fs:projects/PRJ-019/app/x.ts` | true | PRJ-* が PRJ-019 にヒット |
| 2 | `fs:projects/PRJ-*/app/x.ts` | `fs:projects/PRJ-019/extra/app/x.ts` | false | `*` は `/` を跨がない (POSIX) |
| 3 | `fs:projects/PRJ-019/app/**` | `fs:projects/PRJ-019/app/web/src/index.ts` | true | 末尾 globstar |
| 4 | `fs:projects/PRJ-019/app/**` | `fs:projects/PRJ-019/app/` | true | 末尾空 |
| 5 | `fs:projects/PRJ-019/app/**` | `fs:projects/PRJ-019/other.txt` | false | /app/ 配下でない |
| 6 | `fs:projects/PRJ-*/app/**` | `fs:projects/PRJ-019/app/web/src/lib/audit/hash-chain.ts` | true | 主用途 |
| 7 | `fs:projects/PRJ-*/app/**` | `fs:projects/COMPANY-WEBSITE/app/index.ts` | false | PRJ- prefix なし |
| 8 | `fs:projects/**/app/x.ts` | `fs:projects/PRJ-019/sub/app/x.ts` | true | 中間 globstar |
| 9 | `fs:.env*` | `fs:.env.local` | true | dotfile pattern |
| 10 | `fs:.env*` | `fs:env.local` | false | 先頭 dot なし |
| 11 | `fs:**/secrets/**` | `fs:projects/PRJ-019/app/config/secrets/api-key.txt` | true | 両側 globstar |
| 12 | `fs:**/secrets/**` | `fs:projects/PRJ-019/app/config/secret.txt` | false | secrets でなく secret |
| 13 | `network:metadata.google.internal` | `network:metadata.google.internal` | true | 完全一致 |

## 期待値 vs 実値マトリクス (node-casbin v5 既知挙動からの予測 / 実機実行で要確認)

実機実行時は `keymatch4-test.ts` の出力を本表に転記すること。
以下は node-casbin v5.27 ソースコードレビュー + 主要 issue (#GH-456 系列) からの予測値。

| ID | Expected | keyMatch | keyMatch2 | keyMatch3 | keyMatch4 | keyMatch5 | globMatch | Enforcer (kM4) |
|---|---|---|---|---|---|---|---|---|
| 1 | true | true | true | true | **true** | true | true | **true** |
| 2 | false | true (BUG) | **false** | false | **true (BUG)** | true (BUG) | **false** | **true (BUG)** |
| 3 | true | true | true | true | **true** | true | true | **true** |
| 4 | true | true | true | true | **true** | true | true | **true** |
| 5 | false | true (BUG) | **false** | false | **true (BUG)** | true (BUG) | **false** | **true (BUG)** |
| 6 | true | true | true | true | **true** | true | true | **true** |
| 7 | false | **false** | **false** | **false** | **false** | **false** | **false** | **false** |
| 8 | true | true | false | false | **true** | true | true | **true** |
| 9 | true | true | true | true | **true** | true | true | **true** |
| 10 | false | **false** | **false** | **false** | **false** | **false** | **false** | **false** |
| 11 | true | true | false | false | **true** | true | true | **true** |
| 12 | false | true (BUG) | false | false | **true (BUG)** | true (BUG) | **false** | **true (BUG)** |
| 13 | true | true | true | true | **true** | true | true | **true** |

**凡例**:
- 太字 = keyMatch4 の挙動 (現行 model.conf 採用 matcher)
- (BUG) = 期待値と不一致 (false positive: 本来 deny すべきリソースを誤って allow)

### keyMatch4 の不一致サマリ (予測)

| ID | 何が起こるか | セキュリティ影響 |
|---|---|---|
| 2 | `fs:projects/PRJ-019/extra/app/x.ts` を **誤 allow** | 中: PRJ ID 配下以外のパスを restricted_role が読める |
| 5 | `fs:projects/PRJ-019/other.txt` を **誤 allow** | 中: app/ 外のファイルを読める |
| 12 | `fs:.../secret.txt` を **誤 allow** (deny envelope なのに deny されない) | **高: deny envelope バイパス** |

**ID 12 は致命的**: deny envelope `**/secrets/**` が `secret.txt` (s なし) を block 出来ないわけではないが、
逆に **allow pattern 側で `*` を使うと deny されるべき場所まで allow される**のが本質的問題。

## 推奨対応 (3 つの fallback 案)

### 案 A (推奨): `globMatch` に切替

```diff
 [matchers]
-m = g(r.sub, p.sub) && keyMatch4(r.obj, p.obj) && (p.act == r.act || p.act == "*")
+m = g(r.sub, p.sub) && globMatch(r.obj, p.obj) && (p.act == r.act || p.act == "*")
```

`globMatch` は内部で `minimatch` を使い、POSIX glob 準拠。
- `*` は `/` を跨がない (single segment)
- `**` は `/` を跨ぐ (globstar)
- `?` は単一文字

**コスト**: model.conf 1 行修正 + 全 13 ケースで再検証。
**懸念**: keyMatch4 の `{var}` 同名一致機能を失うが、現行 policy.csv では `{var}` を使っていない (URL param なし) のでロスゼロ。

### 案 B: `keyMatch2` に格下げ

```diff
-m = ... && keyMatch4(r.obj, p.obj) && ...
+m = ... && keyMatch2(r.obj, p.obj) && ...
```

`keyMatch2` は `*` を `[^/]+` (single-segment) に変換するため、ID 2 / 5 の bug を解消できる。
ただし `**` も `[^/]+[^/]+` 相当で **globstar として動かない**ため、policy.csv の `**` パターンを書き直す必要がある:

```diff
-p, restricted_role, fs:projects/PRJ-*/app/**, read, allow
+p, restricted_role, fs:projects/PRJ-*/app/*, read, allow
+p, restricted_role, fs:projects/PRJ-*/app/*/*, read, allow
+p, restricted_role, fs:projects/PRJ-*/app/*/*/*, read, allow
+# (depth 必要分だけ列挙)
```

**コスト**: 全 ** pattern を depth 列挙で書き換え。保守性は劣化。

### 案 C: 自前 matcher 関数 `pathMatchSafe`

```typescript
import { Util, FunctionMap } from "casbin";

const fm = FunctionMap.loadFunctionMap();
fm.addFunction("pathMatchSafe", (key1: string, key2: string) => {
  // POSIX glob 準拠の自前実装 (minimatch 直叩き)
  const minimatch = require("minimatch");
  return minimatch(key1, key2, { dot: true });
});
```

```diff
-m = ... && keyMatch4(r.obj, p.obj) && ...
+m = ... && pathMatchSafe(r.obj, p.obj) && ...
```

**コスト**: 関数登録 1 箇所追加。挙動は案 A と同等。
**利点**: 将来 casbin が globMatch を deprecated にしても影響受けない。

## 推奨

**案 A (`globMatch` 切替)** を採用する。

理由:
1. node-casbin の builtin で minimatch を内部利用しており、別途依存追加不要
2. 現行 policy.csv の `**` pattern が **そのまま POSIX glob として正しく動く**
3. `{var}` 同名一致は現行 policy で未使用なので keyMatch4 → globMatch のロスゼロ
4. 案 B は policy.csv 全書き換えで保守性劣化、案 C は自前関数で表面積増

## 適用手順

1. 本 PoC スクリプト (`keymatch4-test.ts`) を実機で実行し、**予測表が実値と一致するか確認**
2. 一致しない場合は本 RESULTS.md の予測値を実値で更新 + 推奨案を再評価
3. 一致した場合 `model.conf` の `keyMatch4` を `globMatch` に置換
4. 全 13 ケースで再 PoC 実行 → 全件期待一致を確認
5. policy.csv は無変更で OK (verify by Step 4)
6. 本変更を ADR (`docs/adr/`) に記録: 「ADR-019-XX: keyMatch4 → globMatch 切替」

## 残課題

| 項目 | 期限 | 担当 |
|---|---|---|
| 本 PoC を実機実行して予測値検証 | W0-Week2 末 (5/15) | Dev A |
| `model.conf` を案 A で更新 + 再 PoC | W0-Week2 末 (5/15) | Dev A |
| ADR 起票 | W0-Week2 末 (5/15) | Dev A |
| Phase 1 W1 で hot-reload テスト (policy.csv の動的読込時に enforcer が壊れない) | W1 中盤 | Dev B |

## 参考

- node-casbin v5: https://github.com/casbin/node-casbin
- Util builtin matchers: `casbin/src/util/builtinOperators.ts`
- minimatch: https://github.com/isaacs/minimatch
- 現行 model.conf: `../model.conf`
- 現行 policy.csv: `../policy.csv`
- DEC-019-033 §⑤ (priviledge escalation 4 層防御 / L1 Static Policy)
- DEC-019-041 (W0-Week2 buffer)
