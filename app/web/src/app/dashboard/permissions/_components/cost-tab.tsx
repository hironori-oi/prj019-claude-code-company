/**
 * PRJ-019 Permissions Tab (5) コスト上限
 * 月次 / 件次 / 提案次の 3 階層。月次 $300 ハードキャップは pm-cost-and-controls-plan-v4-1 準拠。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";
import type { CostPolicy } from "@/types/policy";

export function CostTab({ policy }: { policy: CostPolicy }) {
  const items: Array<{ label: string; value: number; detail: string }> = [
    {
      label: "月次 cap",
      value: policy.monthlyCapUsd,
      detail: "pm-cost-and-controls-plan-v4-1 ハードキャップ",
    },
    {
      label: "案件 cap",
      value: policy.projectCapUsd,
      detail: "1 案件あたり",
    },
    {
      label: "提案 cap",
      value: policy.proposalCapUsd,
      detail: "1 提案 (Stage A) あたり",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>(5) コスト上限 (3 階層)</CardTitle>
        <CardDescription>
          超過時は HITL-2 cost_threshold (1h pause / SLA) を発火。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-3">
          {items.map((i) => (
            <li key={i.label} className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              <p className="mt-1 font-mono text-lg font-semibold">{formatUsd(i.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
