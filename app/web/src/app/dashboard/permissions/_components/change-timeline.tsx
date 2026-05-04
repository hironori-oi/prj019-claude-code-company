/**
 * PRJ-019 Permissions - 変更履歴 timeline
 * source: policy_audit_log
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJstDateTime } from "@/lib/utils";
import type { PolicyAuditEntry } from "@/types/policy";

export function ChangeTimeline({ entries }: { entries: PolicyAuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>変更履歴</CardTitle>
        <CardDescription>
          policy_audit_log から取得 (Phase 1 W2 で hash chain 検証と連動)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">変更履歴はまだありません</p>
        ) : (
          <ol className="space-y-3 border-l pl-4">
            {entries.slice(0, 20).map((e) => (
              <li key={e.id} className="relative">
                <span
                  className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-foreground/40"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {e.category}
                  </Badge>
                  <Badge variant="muted" className="font-mono">
                    {e.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{e.actor}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatJstDateTime(e.ts)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{e.summary}</p>
                {e.hitlRequestId ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    HITL: {e.hitlRequestId}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
