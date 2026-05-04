/**
 * audit-dispatch-sink — DispatchSink を audit log (FileAuditLogStore) に
 * append する hash chain 連動 sink。
 *
 * 既存 audit-store.ts の append() を呼ぶだけで、内部実装には触れない。
 */
import type { AuditLogStore } from '@clawbridge/audit'
import type {
  DispatchSink,
  SinkAck,
} from '@clawbridge/openclaw-runtime'

export interface AuditDispatchSinkOptions {
  /** sink name (default 'audit-log') */
  name?: string
  /** audit event の source 値 (default 'orchestrator') */
  auditSource?: 'harness' | 'openclaw-runtime' | 'claude-bridge' | 'orchestrator' | 'sandbox' | 'other'
}

export function createAuditDispatchSink(
  audit: AuditLogStore,
  opts: AuditDispatchSinkOptions = {},
): DispatchSink {
  const name = opts.name ?? 'audit-log'
  const source = opts.auditSource ?? 'orchestrator'
  return {
    name,
    async deliver(message): Promise<SinkAck> {
      const r = await audit.append({
        type: 'other',
        source,
        payload: {
          dispatchedMessage: message,
        },
      })
      return {
        ok: true,
        meta: {
          auditId: r.id,
          auditHash: r.hash,
          messageType: message.messageType,
        },
      }
    },
  }
}
