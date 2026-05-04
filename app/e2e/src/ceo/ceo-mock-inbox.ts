/**
 * ceo-mock-inbox — CEO 層の mock 受信箱。
 *
 * 役割:
 *   - dispatcher 経由で fan-out された OpenclawToCeoMessage を in-memory に蓄積。
 *   - DispatchSink contract を実装する CeoInboxSink から呼ばれる (./ceo-inbox-sink.ts)。
 *   - test では受信内容を assert するための query を提供する。
 *
 * 設計原則:
 *   - 副作用ゼロ (fs / network / spawn 一切叩かない)。
 *   - 決定論的 (counter ベースの ack id、ts は注入)。
 *   - 既存 dispatcher / openclaw-runtime 側のコードを 1 行も変更しない。
 */
import type {
  OpenclawToCeoMessage,
  OpenclawToCeoMessageType,
} from '@clawbridge/openclaw-runtime'

export interface CeoInboxEntry {
  /** ack id (1-based, monotonic) */
  ackId: number
  /** ISO8601 受信時刻 (注入された now か Date.now()) */
  receivedAt: string
  /** dispatcher が送ってきた message (immutable shallow copy 推奨だが型上は readonly のみ) */
  message: OpenclawToCeoMessage
}

export class CeoMockInbox {
  private readonly entries: CeoInboxEntry[] = []
  private counter = 0

  constructor(private readonly nowIso: () => string = () => new Date().toISOString()) {}

  /** dispatcher から受信した message を 1 件登録し、ack id を返す。 */
  receive(message: OpenclawToCeoMessage): { ackId: number; receivedAt: string } {
    this.counter += 1
    const ackId = this.counter
    const receivedAt = this.nowIso()
    this.entries.push({ ackId, receivedAt, message })
    return { ackId, receivedAt }
  }

  /** 全件取得 (insertion 順序固定)。 */
  list(): readonly CeoInboxEntry[] {
    return this.entries.slice()
  }

  /** messageType でフィルタした件数。 */
  countByType(type: OpenclawToCeoMessageType): number {
    let n = 0
    for (const e of this.entries) {
      if (e.message.messageType === type) n += 1
    }
    return n
  }

  /** 最後に受信した entry。 */
  last(): CeoInboxEntry | undefined {
    return this.entries[this.entries.length - 1]
  }

  /** 受信内容をリセット (recovery test 用)。 */
  reset(): void {
    this.entries.length = 0
    this.counter = 0
  }

  get size(): number {
    return this.entries.length
  }
}
