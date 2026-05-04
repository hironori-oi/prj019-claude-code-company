/**
 * PRJ-019 Clawbridge - Casbin keyMatch4 `**` glob PoC
 *
 * Issue: DEC-019-041 W0-Week2 buffer (Casbin keyMatch4 PoC)
 * Spec: ../model.conf / ../policy.csv
 * Result spec: ./RESULTS.md
 *
 * 検証目的:
 *   現行 model.conf は `m = ... && keyMatch4(r.obj, p.obj) && ...` を採用
 *   policy.csv は `fs:projects/PRJ-*\/app/**` 等の `**` glob pattern を含む
 *   node-casbin v5 の keyMatch4 が `**` をどう解釈するかを 10+ ケース実機検証
 *
 * 実行:
 *   pnpm tsx projects/PRJ-019/app/policies/casbin/poc/keymatch4-test.ts
 *   または:
 *   node --import tsx projects/PRJ-019/app/policies/casbin/poc/keymatch4-test.ts
 *
 * 依存:
 *   - casbin >= 5.27 (node-casbin)
 *
 * 出力:
 *   - stdout: 期待 vs 実値 マトリクス (ASCII テーブル)
 *   - 終了コード: 全件期待一致なら 0、不一致あれば 1
 */

import {
  newEnforcer,
  newModel,
  StringAdapter,
  Util,
} from "casbin";

interface TestCase {
  id: number;
  label: string;
  pattern: string; // policy 側 obj
  request: string; // request 側 obj
  expected: boolean; // glob 直感での期待
  notes?: string;
}

// node-casbin が公開する内部 builtin: keyMatch / keyMatch2 / keyMatch3 / keyMatch4 / keyMatch5 / globMatch
// それぞれの挙動を直接ぶつけて挙動マトリクスを取る。
const builtins = {
  keyMatch: Util.keyMatchFunc,
  keyMatch2: Util.keyMatch2Func,
  keyMatch3: Util.keyMatch3Func,
  keyMatch4: Util.keyMatch4Func,
  keyMatch5: (Util as unknown as Record<string, (a: unknown[]) => unknown>).keyMatch5Func,
  globMatch: Util.globMatchFunc,
} as const;

const cases: TestCase[] = [
  // --- 1. 単一階層 `*` の挙動 ---
  {
    id: 1,
    label: "single * matches single segment",
    pattern: "fs:projects/PRJ-*/app/x.ts",
    request: "fs:projects/PRJ-019/app/x.ts",
    expected: true,
    notes: "PRJ-* が PRJ-019 にヒットする最低限ケース",
  },
  {
    id: 2,
    label: "single * does NOT cross /",
    pattern: "fs:projects/PRJ-*/app/x.ts",
    request: "fs:projects/PRJ-019/extra/app/x.ts",
    expected: false,
    notes: "* は / を跨がない (POSIX glob 標準)",
  },

  // --- 2. globstar `**` の挙動 (本 PoC の中心) ---
  {
    id: 3,
    label: "** at tail crosses multiple segments",
    pattern: "fs:projects/PRJ-019/app/**",
    request: "fs:projects/PRJ-019/app/web/src/index.ts",
    expected: true,
    notes: "現行 policy.csv の主要 pattern",
  },
  {
    id: 4,
    label: "** at tail matches empty",
    pattern: "fs:projects/PRJ-019/app/**",
    request: "fs:projects/PRJ-019/app/",
    expected: true,
    notes: "末尾が空のケース (POSIX bash globstar は最近マッチ)",
  },
  {
    id: 5,
    label: "** at tail does not match parent",
    pattern: "fs:projects/PRJ-019/app/**",
    request: "fs:projects/PRJ-019/other.txt",
    expected: false,
    notes: "/app/ より前は対象外",
  },

  // --- 3. PRJ-* と ** の組み合わせ ---
  {
    id: 6,
    label: "PRJ-* + ** combo (deep nesting)",
    pattern: "fs:projects/PRJ-*/app/**",
    request: "fs:projects/PRJ-019/app/web/src/lib/audit/hash-chain.ts",
    expected: true,
    notes: "現行 restricted_role の主用途",
  },
  {
    id: 7,
    label: "PRJ-* + ** combo (rejects non-PRJ)",
    pattern: "fs:projects/PRJ-*/app/**",
    request: "fs:projects/COMPANY-WEBSITE/app/index.ts",
    expected: false,
    notes: "PRJ- prefix なし → reject",
  },

  // --- 4. ** が中間に出現するケース (一般に keyMatch4 では非対応の可能性) ---
  {
    id: 8,
    label: "** in middle of pattern",
    pattern: "fs:projects/**/app/x.ts",
    request: "fs:projects/PRJ-019/sub/app/x.ts",
    expected: true,
    notes: "中間 globstar — keyMatch4 は対応してない可能性大",
  },

  // --- 5. .env* dotfile match ---
  {
    id: 9,
    label: ".env* matches .env.local",
    pattern: "fs:.env*",
    request: "fs:.env.local",
    expected: true,
    notes: "deny envelope の .env* pattern (現行 policy.csv より)",
  },
  {
    id: 10,
    label: ".env* does not match env.local (no leading dot)",
    pattern: "fs:.env*",
    request: "fs:env.local",
    expected: false,
  },

  // --- 6. **/secrets/** (両側 globstar) ---
  {
    id: 11,
    label: "**/secrets/** matches deep path",
    pattern: "fs:**/secrets/**",
    request: "fs:projects/PRJ-019/app/config/secrets/api-key.txt",
    expected: true,
    notes: "現行 policy.csv の secrets deny envelope",
  },
  {
    id: 12,
    label: "**/secrets/** does not match similar dir",
    pattern: "fs:**/secrets/**",
    request: "fs:projects/PRJ-019/app/config/secret.txt",
    expected: false,
    notes: "secret(s) でなく secret なので reject 期待",
  },

  // --- 7. metadata.google.internal (literal) ---
  {
    id: 13,
    label: "literal exact match",
    pattern: "network:metadata.google.internal",
    request: "network:metadata.google.internal",
    expected: true,
    notes: "完全一致 (metadata SSRF deny)",
  },
];

interface MatcherFn {
  (key1: string, key2: string): boolean;
}

function safeCall(fn: unknown, a: string, b: string): boolean | string {
  if (typeof fn !== "function") return "N/A";
  try {
    const f = fn as MatcherFn;
    return f(a, b);
  } catch (e) {
    return `ERR:${(e as Error).message.slice(0, 30)}`;
  }
}

function colorize(actual: boolean | string, expected: boolean): string {
  if (typeof actual !== "boolean") return `\x1b[33m${actual}\x1b[0m`;
  if (actual === expected) return `\x1b[32m${actual}\x1b[0m`;
  return `\x1b[31m${actual}\x1b[0m`;
}

async function runEnforcerCase(c: TestCase): Promise<boolean | string> {
  // 実環境 (model.conf + policy.csv) と同形のミニ enforcer を構築
  const modelText = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = !some(where (p.eft == deny)) && some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch4(r.obj, p.obj) && (p.act == r.act || p.act == "*")
`.trim();

  const policyText = [
    `g, alice, role_test`,
    `p, role_test, ${c.pattern}, read, allow`,
  ].join("\n");

  try {
    const m = newModel(modelText);
    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);
    return await e.enforce("alice", c.request, "read");
  } catch (err) {
    return `ENF_ERR:${(err as Error).message.slice(0, 40)}`;
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(120));
  console.log("PRJ-019 Casbin keyMatch4 / glob ** PoC");
  console.log("DEC-019-041 W0-Week2 buffer");
  console.log("=".repeat(120));

  const headers = [
    "ID",
    "Pattern",
    "Request",
    "Exp",
    "kM",
    "kM2",
    "kM3",
    "kM4",
    "kM5",
    "glob",
    "Enforcer",
  ];
  console.log(headers.map((h) => h.padEnd(12)).join("|"));
  console.log("-".repeat(120));

  let mismatchKM4 = 0;
  let mismatchEnforcer = 0;
  let total = 0;

  for (const c of cases) {
    total += 1;
    const km = safeCall(builtins.keyMatch, c.pattern, c.request);
    const km2 = safeCall(builtins.keyMatch2, c.pattern, c.request);
    const km3 = safeCall(builtins.keyMatch3, c.pattern, c.request);
    const km4 = safeCall(builtins.keyMatch4, c.pattern, c.request);
    const km5 = safeCall(builtins.keyMatch5, c.pattern, c.request);
    const gm = safeCall(builtins.globMatch, c.pattern, c.request);
    const enf = await runEnforcerCase(c);

    if (typeof km4 === "boolean" && km4 !== c.expected) mismatchKM4 += 1;
    if (typeof enf === "boolean" && enf !== c.expected) mismatchEnforcer += 1;

    console.log(
      [
        String(c.id).padEnd(4),
        c.pattern.slice(0, 28).padEnd(30),
        c.request.slice(0, 36).padEnd(38),
        String(c.expected).padEnd(5),
        colorize(km, c.expected).padEnd(15),
        colorize(km2, c.expected).padEnd(15),
        colorize(km3, c.expected).padEnd(15),
        colorize(km4, c.expected).padEnd(15),
        colorize(km5, c.expected).padEnd(15),
        colorize(gm, c.expected).padEnd(15),
        colorize(enf, c.expected).padEnd(15),
      ].join("|"),
    );
  }

  console.log("-".repeat(120));
  console.log(`TOTAL: ${total} cases`);
  console.log(`keyMatch4 mismatches: ${mismatchKM4} / ${total}`);
  console.log(`Enforcer (model.conf + policy) mismatches: ${mismatchEnforcer} / ${total}`);

  if (mismatchKM4 > 0 || mismatchEnforcer > 0) {
    console.log("\n!!! WARNING: ** glob semantics do not behave as POSIX/bash expectation !!!");
    console.log("    See ./RESULTS.md for fallback recommendation.");
    process.exitCode = 1;
  } else {
    console.log("\nOK: All cases match expected. keyMatch4 with ** is safe to use as-is.");
  }
}

void main();
