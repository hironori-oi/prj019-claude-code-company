/**
 * workflow-yaml.test — openclaw-monitor.yml 整合性 lint。
 *
 * 出典: Round 5 W0-Week2 5 日前倒し / Plan A 由来
 *   - DEC-019-053 v15.2 / Plan A: standalone repo root に workflow 配置
 *   - DEC-019-053 Plan A hotfix: pnpm workspace 経由で monitor 起動
 *   - DEC-019-049: 3 Slack webhook (HITL/MONITOR/DRILL) 必須
 *
 * 検証項目:
 *   1. .github/workflows/openclaw-monitor.yml が存在する
 *   2. workflow に schedule (cron) と workflow_dispatch の両方が設定されている
 *   3. Tier 1 必須 Secrets 7 件が env に注入されている
 *      (SLACK_WEBHOOK_HITL/MONITOR/DRILL, RESEND_API_KEY,
 *       OWNER_NOTIFY_EMAIL, DEV_NOTIFY_EMAIL, GH_PAT_READ_ONLY)
 *   4. defaults.run.working-directory: app
 *   5. cache-dependency-path: app/pnpm-lock.yaml
 *
 * 設計: yaml parser を harness deps に追加しない方針 (依存最小化)。
 * 文字列ベース正規表現で必須 key を確認する軽量 lint。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// harness/src/__tests__ → ../../../.github/workflows
const WORKFLOW_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'openclaw-monitor.yml',
)

describe('openclaw-monitor.yml integrity (Plan A 整合 lint)', () => {
  it('workflow file exists at standalone repo root', () => {
    expect(existsSync(WORKFLOW_PATH)).toBe(true)
  })

  it('has both schedule (cron) and workflow_dispatch triggers', () => {
    const yaml = readFileSync(WORKFLOW_PATH, 'utf-8')
    expect(yaml).toMatch(/^on:/m)
    expect(yaml).toMatch(/schedule:/)
    // 03:00 JST = 18:00 UTC を維持
    expect(yaml).toMatch(/cron:\s*'0 18 \* \* \*'/)
    expect(yaml).toMatch(/workflow_dispatch:/)
  })

  it('has Tier 1 required secrets injected as env (DEC-019-053 v15.2 Plan B)', () => {
    const yaml = readFileSync(WORKFLOW_PATH, 'utf-8')
    // DEC-019-049: 3 channel Slack webhook
    expect(yaml).toMatch(/SLACK_WEBHOOK_HITL:\s*\$\{\{\s*secrets\.SLACK_WEBHOOK_HITL\s*\}\}/)
    expect(yaml).toMatch(/SLACK_WEBHOOK_MONITOR:\s*\$\{\{\s*secrets\.SLACK_WEBHOOK_MONITOR\s*\}\}/)
    expect(yaml).toMatch(/SLACK_WEBHOOK_DRILL:\s*\$\{\{\s*secrets\.SLACK_WEBHOOK_DRILL\s*\}\}/)
    // Resend (Slack 失敗時 fallback + L3 直送)
    expect(yaml).toMatch(/RESEND_API_KEY:\s*\$\{\{\s*secrets\.RESEND_API_KEY\s*\}\}/)
    expect(yaml).toMatch(/OWNER_NOTIFY_EMAIL:\s*\$\{\{\s*secrets\.OWNER_NOTIFY_EMAIL\s*\}\}/)
    expect(yaml).toMatch(/DEV_NOTIFY_EMAIL:\s*\$\{\{\s*secrets\.DEV_NOTIFY_EMAIL\s*\}\}/)
    // GitHub PAT (GH_ prefix で登録、env 名は GITHUB_PAT_READ_ONLY)
    expect(yaml).toMatch(/GITHUB_PAT_READ_ONLY:\s*\$\{\{\s*secrets\.GH_PAT_READ_ONLY\s*\}\}/)
  })

  it('uses pnpm workspace structure with working-directory: app (Plan A hotfix)', () => {
    const yaml = readFileSync(WORKFLOW_PATH, 'utf-8')
    expect(yaml).toMatch(/working-directory:\s*app/)
    expect(yaml).toMatch(/cache-dependency-path:\s*'app\/pnpm-lock\.yaml'/)
    // pnpm --filter で monitor を起動
    expect(yaml).toMatch(/pnpm\s+--filter\s+@prj-019\/openclaw-monitor/)
  })

  it('has fail-fast safeguards: timeout, concurrency, permissions', () => {
    const yaml = readFileSync(WORKFLOW_PATH, 'utf-8')
    expect(yaml).toMatch(/timeout-minutes:/)
    expect(yaml).toMatch(/concurrency:/)
    expect(yaml).toMatch(/permissions:[\s\S]+contents:\s*read/)
  })

  /**
   * Secrets 不在シミュレーション: workflow 内で `${{ secrets.X }}` が
   * 1 件でも欠落すると CI 起動時に env 注入が空文字列になり、
   * downstream の sources.ts / notify.ts が早期 throw する想定 (fail-fast)。
   *
   * 本テストでは「workflow YAML に必須 7 件の secrets reference が
   * 全て present であること」をもって fail-fast 構成成立を担保する。
   * (実 runtime fail-fast は openclaw-monitor 側 sources.ts のテスト範囲)
   */
  it('all 7 required secrets are referenced (fail-fast invariant)', () => {
    const yaml = readFileSync(WORKFLOW_PATH, 'utf-8')
    const required = [
      'SLACK_WEBHOOK_HITL',
      'SLACK_WEBHOOK_MONITOR',
      'SLACK_WEBHOOK_DRILL',
      'RESEND_API_KEY',
      'OWNER_NOTIFY_EMAIL',
      'DEV_NOTIFY_EMAIL',
      'GH_PAT_READ_ONLY',
    ]
    const missing = required.filter((s) => !yaml.includes(`secrets.${s}`))
    expect(missing).toEqual([])
  })
})
