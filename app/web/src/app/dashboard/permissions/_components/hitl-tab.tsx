/**
 * PRJ-019 Permissions Tab (4) HITL Gate
 * 11 種 Gate の ON/OFF + SLA 表示。デフォルトは全 ON。
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
import { HITL_GATE_DEFAULTS, type HitlGateKind } from "@/types/hitl";
import type { HitlPolicy } from "@/types/policy";

const GATE_LABELS: Record<HitlGateKind, string> = {
  network_external: "1. network_external",
  cost_threshold: "2. cost_threshold",
  secret_access: "3. secret_access",
  prod_deploy: "4. prod_deploy",
  unsafe_command: "5. unsafe_command",
  tos_gray_review: "6. tos_gray_review",
  external_api: "7. external_api",
  emergency_stop: "8. emergency_stop",
  dev_kickoff_approval: "9. dev_kickoff_approval",
  permission_change_review: "10. permission_change_review",
  knowledge_pii_review: "11. knowledge_pii_review",
};

export function HitlTab({ policy }: { policy: HitlPolicy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>(4) HITL Gate 11 種</CardTitle>
        <CardDescription>
          各 Gate の有効/無効 + SLA + default action。pm-v4-hitl-gates-9-10-11-wbs.md 準拠。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gate</TableHead>
              <TableHead className="w-20">SLA(h)</TableHead>
              <TableHead className="w-24">default</TableHead>
              <TableHead className="w-20">enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.keys(GATE_LABELS) as HitlGateKind[]).map((kind) => {
              const def = HITL_GATE_DEFAULTS[kind];
              const enabled = policy.gateEnabled[kind] ?? true;
              const sla = policy.slaHoursOverride?.[kind] ?? def.slaHours;
              return (
                <TableRow key={kind}>
                  <TableCell className="font-mono text-xs">{GATE_LABELS[kind]}</TableCell>
                  <TableCell className="font-mono text-xs">{sla}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {def.defaultAction}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={enabled ? "success" : "muted"}>
                      {enabled ? "ON" : "OFF"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
