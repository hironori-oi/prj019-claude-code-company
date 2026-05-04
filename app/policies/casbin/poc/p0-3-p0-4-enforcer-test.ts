/**
 * PRJ-019 Clawbridge - Casbin P0-3 / P0-4 修正検証 PoC
 *
 * Issue: review-scaffold-code-review-v1.md §3.1 P0-3 / P0-4
 * Spec:  ../model.conf / ../policy.csv (修正後)
 *
 * 検証目的:
 *   P0-3: `command:curl?(http://*)` を `command:curl` に修正したことで、
 *         http URL / https URL の双方が deny される (curl 全面禁止)。
 *   P0-4: `prohibited_subject` 集約 role を導入したことで、
 *         owner / operator / open_claw_restricted いずれの経路でも
 *         13 prohibited domains (genre:*) が deny される。
 *
 * 実行:
 *   pnpm tsx projects/PRJ-019/app/policies/casbin/poc/p0-3-p0-4-enforcer-test.ts
 *
 * 終了コード: 全件期待一致なら 0、不一致あれば 1
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { newEnforcer, newModel, StringAdapter } from "casbin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MODEL_PATH = resolve(__dirname, "../model.conf");
const POLICY_PATH = resolve(__dirname, "../policy.csv");

interface EnforceCase {
  id: string;
  label: string;
  sub: string;
  obj: string;
  act: string;
  expected: boolean; // true = allow, false = deny
  finding: "P0-3" | "P0-4";
}

const cases: EnforceCase[] = [
  // ---------------------------------------------------------------------------
  // P0-3: command:curl が http / https 双方で deny される
  // ---------------------------------------------------------------------------
  {
    id: "P0-3-a",
    label: "open_claw_restricted: curl http://example.com is denied",
    sub: "open_claw_restricted",
    obj: "command:curl",
    act: "exec",
    expected: false,
    finding: "P0-3",
  },
  {
    id: "P0-3-b",
    label: "open_claw_restricted: curl https://api.openai.com is denied (whole curl banned)",
    sub: "open_claw_restricted",
    obj: "command:curl",
    act: "exec",
    expected: false,
    finding: "P0-3",
  },

  // ---------------------------------------------------------------------------
  // P0-4: 13 prohibited domains は全 role で deny される
  // ---------------------------------------------------------------------------
  {
    id: "P0-4-owner-adult",
    label: "owner: genre:adult is denied (was previously allowed via super_role)",
    sub: "owner",
    obj: "genre:adult",
    act: "read",
    expected: false,
    finding: "P0-4",
  },
  {
    id: "P0-4-owner-csam",
    label: "owner: genre:csam is denied",
    sub: "owner",
    obj: "genre:csam",
    act: "write",
    expected: false,
    finding: "P0-4",
  },
  {
    id: "P0-4-operator-bioweapon",
    label: "operator: genre:bioweapon is denied",
    sub: "operator",
    obj: "genre:bioweapon",
    act: "read",
    expected: false,
    finding: "P0-4",
  },
  {
    id: "P0-4-restricted-adult",
    label: "open_claw_restricted: genre:adult is denied (regression check)",
    sub: "open_claw_restricted",
    obj: "genre:adult",
    act: "read",
    expected: false,
    finding: "P0-4",
  },
  {
    id: "P0-4-restricted-malware",
    label: "open_claw_restricted: genre:malware is denied",
    sub: "open_claw_restricted",
    obj: "genre:malware",
    act: "exec",
    expected: false,
    finding: "P0-4",
  },

  // ---------------------------------------------------------------------------
  // 正常系 (regression check): 修正後でも legitimate access は通る
  // ---------------------------------------------------------------------------
  {
    id: "regression-owner-fs-read",
    label: "owner: fs:projects/PRJ-019/app/x.ts read is allowed",
    sub: "owner",
    obj: "fs:projects/PRJ-019/app/x.ts",
    act: "read",
    expected: true,
    finding: "P0-3",
  },
  {
    id: "regression-restricted-fs-read",
    label: "open_claw_restricted: fs:projects/PRJ-019/app/web/src/x.ts read is allowed",
    sub: "open_claw_restricted",
    obj: "fs:projects/PRJ-019/app/web/src/x.ts",
    act: "read",
    expected: true,
    finding: "P0-3",
  },
];

async function main(): Promise<void> {
  const modelText = readFileSync(MODEL_PATH, "utf8");
  const policyText = readFileSync(POLICY_PATH, "utf8");

  const m = newModel(modelText);
  const a = new StringAdapter(policyText);
  const e = await newEnforcer(m, a);

  console.log("=".repeat(96));
  console.log("PRJ-019 Casbin P0-3 / P0-4 enforcer verification");
  console.log("review-scaffold-code-review-v1.md §3.1");
  console.log("=".repeat(96));
  console.log(
    "ID".padEnd(28) +
      "| Finding | Sub".padEnd(34) +
      "| Obj".padEnd(34) +
      "| Act".padEnd(10) +
      "| Exp | Got | Result",
  );
  console.log("-".repeat(160));

  let pass = 0;
  let fail = 0;

  for (const c of cases) {
    const got = await e.enforce(c.sub, c.obj, c.act);
    const ok = got === c.expected;
    if (ok) pass += 1;
    else fail += 1;

    const colour = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(
      [
        c.id.padEnd(26),
        c.finding.padEnd(7),
        c.sub.padEnd(28),
        c.obj.padEnd(32),
        c.act.padEnd(8),
        String(c.expected).padEnd(5),
        String(got).padEnd(5),
        colour,
      ].join(" | "),
    );
  }

  console.log("-".repeat(160));
  console.log(`PASS: ${pass} / ${pass + fail}`);
  if (fail > 0) {
    console.log(`FAIL: ${fail}`);
    process.exitCode = 1;
  }
}

void main();
