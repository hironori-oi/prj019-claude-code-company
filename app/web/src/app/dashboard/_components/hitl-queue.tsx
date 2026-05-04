/**
 * PRJ-019 Dashboard (e) HITL 滞留
 * source: hitl_requests
 * 11 種 Gate ごとの pending 件数 + SLA 残時間。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { relativeTime } from "@/lib/utils";
import type { HitlGateKind, HitlRequest } from "@/types/hitl";

const GATE_LABELS: Record<HitlGateKind, string> = {
  network_external: "1 Network",
  cost_threshold: "2 Cost",
  secret_access: "3 Secret",
  prod_deploy: "4 ProdDeploy",
  unsafe_command: "5 UnsafeCmd",
  tos_gray_review: "6 TosGray",
  external_api: "7 ExternalAPI",
  emergency_stop: "8 Emergency",
  dev_kickoff_approval: "9 DevKickoff",
  permission_change_review: "10 PermChange",
  knowledge_pii_review: "11 PII",
};

export function HitlQueuePanel({ items }: { items: HitlRequest[] }) {
  const pending = items.filter((i) => i.status === "pending");
  const counts = countByGate(pending);
  const upcoming = [...pending]
    .sort((a, b) => (a.slaDeadline < b.slaDeadline ? -1 : 1))
    .slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>(e) HITL 滞留</CardTitle>
        <CardDescription>11 種 Gate の pending キューと SLA 残時間</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(counts).map(([k, n]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-xs">{GATE_LABELS[k as HitlGateKind]}</span>
              <Badge variant={n > 0 ? "warning" : "muted"} className="font-mono">
                {n}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-muted-foreground">SLA 直近 5 件</h4>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">pending はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gate</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{GATE_LABELS[r.gateKind]}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {relativeTime(r.slaDeadline)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {r.defaultAction}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function countByGate(items: HitlRequest[]): Record<HitlGateKind, number> {
  const init = Object.keys(GATE_LABELS).reduce(
    (acc, k) => {
      acc[k as HitlGateKind] = 0;
      return acc;
    },
    {} as Record<HitlGateKind, number>,
  );
  for (const i of items) {
    init[i.gateKind] = (init[i.gateKind] ?? 0) + 1;
  }
  return init;
}
