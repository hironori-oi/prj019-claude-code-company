/**
 * ceo-inbox-sink — DispatchSink contract を実装する CEO 受信 sink。
 *
 * dispatcher.ts の DispatchSinks にそのまま渡せる shape を返す factory。
 * 内部では CeoMockInbox.receive() を呼び、ack id を meta に含める。
 */
import type {
  DispatchSink,
  SinkAck,
} from '@clawbridge/openclaw-runtime'

import type { CeoMockInbox } from './ceo-mock-inbox.js'

export interface CeoInboxSinkOptions {
  /** sink name (logging / outcome 用、default 'ceo-mock-inbox') */
  name?: string
  /** failNthAttempt: 1-based で N 回目を失敗 (retry 検証用、default なし) */
  failNthAttempt?: number
  /** throwNthAttempt: 1-based で N 回目を throw (retry 検証用、default なし) */
  throwNthAttempt?: number
}

/**
 * CEO mock inbox を受信箱とする DispatchSink を生成する。
 *
 * 失敗注入 (failNthAttempt / throwNthAttempt) は dispatcher の retry policy を
 * e2e test で揺さぶるために提供。 default は常時成功。
 */
export function createCeoInboxSink(
  inbox: CeoMockInbox,
  opts: CeoInboxSinkOptions = {},
): DispatchSink {
  const name = opts.name ?? 'ceo-mock-inbox'
  let attempt = 0
  return {
    name,
    async deliver(message): Promise<SinkAck> {
      attempt += 1
      if (opts.throwNthAttempt !== undefined && attempt === opts.throwNthAttempt) {
        throw new Error(`ceo-inbox-sink: injected throw at attempt ${attempt}`)
      }
      if (opts.failNthAttempt !== undefined && attempt === opts.failNthAttempt) {
        return {
          ok: false,
          meta: { reason: 'injected ok:false', attempt },
        }
      }
      const r = inbox.receive(message)
      return {
        ok: true,
        meta: {
          ackId: r.ackId,
          receivedAt: r.receivedAt,
          attempt,
          messageType: message.messageType,
        },
      }
    },
  }
}
