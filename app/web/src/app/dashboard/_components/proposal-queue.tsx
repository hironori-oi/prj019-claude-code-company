/**
 * PRJ-019 Dashboard (f) 提案待ち件数
 * source: hitl_requests where gate_kind = 'dev_kickoff_approval' AND status='pending'
 * HITL-9 D9-08 Owner 1-click approve/reject の動線。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, relativeTime } from "@/lib/utils";
import type { HitlPayloadDevKickoffApproval, HitlRequest } from "@/types/hitl";

export function ProposalQueuePanel({ items }: { items: HitlRequest[] }) {
  const proposals = items.filter(
    (i) => i.gateKind === "dev_kickoff_approval" && i.status === "pending",
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>(f) 提案待ち件数</CardTitle>
        <CardDescription>HITL-9 dev_kickoff_approval / Owner 承認待ち</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">承認待ち</span>
          <Badge variant={proposals.length > 0 ? "warning" : "muted"} className="font-mono">
            {proposals.length} 件
          </Badge>
        </div>
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">提案はありません</p>
        ) : (
          <ul className="space-y-3">
            {proposals.slice(0, 5).map((p) => {
              const payload = p.payload as HitlPayloadDevKickoffApproval;
              return (
                <li key={p.id} className="rounded-md border p-3">
                  <p className="line-clamp-2 text-sm font-medium">{payload.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-mono">
                      {formatUsd(payload.estimatedCostUsd)}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {payload.devPeriodDays}d
                    </Badge>
                    <Badge variant={payload.tosGrayJudgment.verdict === "white" ? "success" : "warning"}>
                      ToS {payload.tosGrayJudgment.verdict}
                    </Badge>
                    <span className="font-mono text-muted-foreground">
                      SLA {relativeTime(p.slaDeadline)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
