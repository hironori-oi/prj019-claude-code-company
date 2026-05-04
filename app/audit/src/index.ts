/**
 * @clawbridge/audit — append-only 監査ログ層 (G-10 公開エントリ)。
 *
 * 関連必須コントロール:
 *   G-09 (監査ログ全件保存) / G-10 (90 日 retention + SHA-256 hash chain)
 *   G-V2-12 (投入経路文書化と監査ログ replay)
 *
 * 設計方針:
 *   - W0/W1: ローカル append-only JSON Lines。Supabase 連携は W2 で追加。
 *   - SHA-256 hash chain: 各 entry に prev_hash + hash を必須化、改ざん検出可能。
 *   - 90 日 retention: 古い entry は別 archive ディレクトリへ rotate (削除はしない)。
 *   - spawn / kill-switch / hitl decision の 3 イベントを最低限カバー。
 */
export {
  FileAuditLogStore,
  computeHash,
  AuditLogStoreError,
  type AuditLogStore,
  type AuditEvent,
  type AuditEventType,
  type AuditEventSource,
  type AuditEventInput,
  type AuditQuery,
  type AuditAppendResult,
  type AuditVerifyResult,
  type FileAuditLogStoreOptions,
  type AuditRotationPolicy,
  type PidGuard,
} from './audit-store.js'
