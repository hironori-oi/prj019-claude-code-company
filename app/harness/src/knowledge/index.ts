/**
 * @clawbridge/harness/knowledge — Round 13 Dev-E 前倒し (KE 系 5 件 W4→W2 push).
 *
 * 構成:
 *   - KE-01 schema             (ke-01-schema.ts)
 *   - KE-02 trigger            (ke-02-trigger.ts)
 *   - KE-03 retrieval          (ke-03-retrieval.ts)
 *   - KE-04 PII redaction      (ke-04-pii-redaction.ts)
 *   - HITL-11 knowledge PII    (hitl-11-knowledge-pii.ts)
 *
 * 全 module は **副作用なし** + Object.freeze で immutable, API $0.
 */
export {
  KnowledgeBody,
  KnowledgeEntry,
  KnowledgeFrontmatter,
  KnowledgeSchemaError,
  CommonFrontmatter,
  PatternFrontmatter,
  DecisionFrontmatter,
  PitfallFrontmatter,
  QualityScore,
  KnowledgeKindSchema,
  Hitl11WebhookKindSchema,
  detectKnowledgeKind,
  isValidKnowledgeEntry,
  kindToIdPrefix,
  idPrefixToKind,
  validateKnowledgeEntry,
  type KnowledgeEntryType,
  type KnowledgeFrontmatterType,
  type CommonFrontmatterType,
  type PatternFrontmatterType,
  type DecisionFrontmatterType,
  type PitfallFrontmatterType,
  type QualityScoreType,
  type KnowledgeKind,
  type Hitl11WebhookKind,
} from './ke-01-schema.js'

export {
  formatSlackNotification as formatExtractionSlackNotification,
  planExtraction,
  shouldTrigger,
  type KnowledgeDraft,
  type ProjectCompletionEvent,
  type ProjectStatus,
  type SkipReason,
  type TriggerResult,
} from './ke-02-trigger.js'

export {
  formatProposalCitation,
  retrieve,
  summarizeIndex,
  type IndexedKnowledge,
  type RetrieveQuery,
  type RetrieveResult,
  type ScoredHit,
} from './ke-03-retrieval.js'

export {
  containsPii,
  redactPii,
  summarizeHits,
  type PiiCategory,
  type PiiHit,
  type RedactOptions,
  type RedactResult,
} from './ke-04-pii-redaction.js'

export {
  HITL11_AUTO_ESCALATE_THRESHOLD,
  HITL11_AUTO_REJECT_THRESHOLD,
  applyReviewerActions,
  autoEvaluate,
  formatHitl11Summary,
  type Hitl11Decision,
  type Hitl11ReviewInput,
  type Hitl11ReviewResult,
} from './hitl-11-knowledge-pii.js'
