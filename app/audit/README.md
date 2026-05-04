# audit/ — 監査ログ・トレース層

## 責務

すべての prompt / response / cost / decision / tool_use を **append-only** で Supabase に記録し、90 日保持、replay 可能化する。改ざん検出のため各行に SHA-256 ハッシュチェーンを付与。

## 入力

- claude-bridge/ からの stream-json 全 event
- harness/ からの判定イベント（allow / block / warn）
- orchestrator/ からの決定ログ
- sandbox/ からの起動・終了ログ
- openclaw-runtime/ からの skill 実行ログ

## 出力

- Supabase `clawbridge_audit_events` テーブル（append-only）
- replay 用 JSON export（オーナー / Review 部門が必要時に取得）

## スキーマ（W2 で確定、W0 はドラフト）

```sql
-- audit/schema/001-init.sql （ドラフト）
CREATE TABLE clawbridge_audit_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  task_id TEXT,
  parent_task_id TEXT,
  event_type TEXT NOT NULL,  -- 'spawn' | 'tool_use' | 'cost' | 'decision' | 'block' | 'warn' | ...
  source TEXT NOT NULL,      -- 'claude-bridge' | 'harness' | 'orchestrator' | 'sandbox' | 'openclaw-runtime'
  payload JSONB NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL         -- SHA-256(prev_hash || payload)
);

-- append-only 強制
CREATE POLICY no_delete ON clawbridge_audit_events FOR DELETE USING (false);
CREATE POLICY no_update ON clawbridge_audit_events FOR UPDATE USING (false);
```

## 依存関係

- Supabase クライアント（`@supabase/supabase-js`）
- `harness/secret_isolation.ts` — Supabase service role key の Tier-S1 注入

## 主要 API

```typescript
interface AuditAPI {
  appendEvent(event: AuditEvent): Promise<{ id: number; hash: string }>
  query(filter: AuditFilter): AsyncIterable<AuditEvent>
  verifyHashChain(fromId?: number): Promise<{ valid: boolean; brokenAt?: number }>
}
```

## W0 段階の到達目標

- DDL ドラフト作成（`audit/schema/001-init.sql`）
- I/F 設計のみ、実装は W2（CB-1-W2-04, 05）

## 保持ポリシー

- 最低 90 日（review v2 §3.3）
- 推奨 1 年（重大インシデントの遡及調査用）
- nightly backup を S3 / R2 等の別 region に push

## 関連必須コントロール

G-09（監査ログ全件保存）／ G-V2-12（投入経路文書化と監査ログ replay）
