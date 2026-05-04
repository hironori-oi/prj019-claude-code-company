/**
 * PRJ-019 Dashboard (c) 中間出力
 * source: proposals.summary (提案・実装の中間成果物)
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJstDateTime, formatUsd } from "@/lib/utils";

export interface IntermediateOutput {
  id: string;
  ts: string;
  kind: "proposal" | "code_diff" | "design";
  title: string;
  estimatedCostUsd: number;
}

const SAMPLE: IntermediateOutput[] = [
  {
    id: "p1",
    ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    kind: "proposal",
    title: "リサーチ ダッシュボード自動更新 機能提案",
    estimatedCostUsd: 12.5,
  },
  {
    id: "p2",
    ts: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    kind: "code_diff",
    title: "lib/hitl/dispatcher.ts 11 種統合",
    estimatedCostUsd: 0,
  },
];

export function IntermediateOutputPanel({ items }: { items?: IntermediateOutput[] }) {
  const data = items ?? SAMPLE;
  return (
    <Card>
      <CardHeader>
        <CardTitle>(c) 中間出力</CardTitle>
        <CardDescription>提案書 / コード差分 / 設計案の途中成果物</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">中間出力はまだありません</p>
        ) : (
          <ul className="space-y-3">
            {data.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{o.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {o.kind}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatJstDateTime(o.ts)}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatUsd(o.estimatedCostUsd)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
