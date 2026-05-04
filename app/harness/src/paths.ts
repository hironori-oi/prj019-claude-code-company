/**
 * Clawbridge ランタイム状態ファイルのパス定義。
 *
 * すべての状態ファイルは `~/.clawbridge/` 配下に配置する。
 * Windows では `%USERPROFILE%\.clawbridge\` 相当。
 *
 * これらのパスは重要 — `app/.gitignore` で `.clawbridge/` を除外しているのは
 * このディレクトリが home dir 配下にある前提で、リポ内に絶対に commit
 * されない設計（OAuth トークンや決済 ledger を誤コミットしないため）。
 */
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Clawbridge ランタイム root (ホームディレクトリ配下) */
export const CLAWBRIDGE_ROOT = process.env['CLAWBRIDGE_ROOT'] ?? join(homedir(), '.clawbridge')

/** コスト ledger（4 層キャップ判定の基礎データ） */
export const COST_LEDGER_PATH = join(CLAWBRIDGE_ROOT, 'cost-ledger.json')

/** 使用量モニタ ledger（API call / OAuth call 履歴） */
export const USAGE_LEDGER_PATH = join(CLAWBRIDGE_ROOT, 'usage-ledger.json')

/** 緊急停止 signal ファイル(touch されたら即停止) */
export const KILL_SIGNAL_PATH = join(CLAWBRIDGE_ROOT, 'STOP')

/** kill switch 発動履歴 */
export const KILL_HISTORY_PATH = join(CLAWBRIDGE_ROOT, 'kill-history.json')

/** HITL 承認待ちディレクトリ */
export const HITL_PENDING_DIR = join(CLAWBRIDGE_ROOT, 'pending-approvals')

/** circuit-breaker 状態ファイル */
export const CIRCUIT_STATE_PATH = join(CLAWBRIDGE_ROOT, 'circuit-state.json')

/** ハーネス起動時刻 (連続稼働 12h カウンタ用) */
export const HARNESS_BOOT_PATH = join(CLAWBRIDGE_ROOT, 'boot.json')
