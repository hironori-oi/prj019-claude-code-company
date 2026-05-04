/**
 * PRJ-019 Dashboard (b) 思考過程
 * source: subprocess の stream-json events
 * Phase 1 W2 で Supabase Realtime に置換。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJstDateTime } from "@/lib/utils";

export interface ThoughtTraceEvent {
  id: string;
  ts: string;
  phase: "plan" | "act" | "observe" | "reflect";
  summary: string;
}

const SAMPLE: ThoughtTraceEvent[] = [
  {
    id: "t1",
    ts: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    phase: "plan",
    summary: "Phase 1 W1 prefetch 範囲確認",
  },
  {
    id: "t2",
    ts: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    phase: "act",
    summary: "HITL dispatcher を分離して 4 routes を実装",
  },
  {
    id: "t3",
    ts: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    phase: "observe",
    summary: "supabase env 未配備のため memory fallback を実装",
  },
  {
    id: "t4",
    ts: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    phase: "reflect",
    summary: "Phase 1 W2 で Owner ガード追加と Realtime 統合が必要",
  },
];

export function ThoughtTracePanel({ events }: { events?: ThoughtTraceEvent[] }) {
  const data = events ?? SAMPLE;
  return (
    <Card>
      <CardHeader>
        <CardTitle>(b) 思考過程</CardTitle>
        <CardDescription>Plan / Act / Observe / Reflect の stream-json events</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">思考イベントはまだありません</p>
        ) : (
          <ol className="space-y-3">
            {data.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <PhaseBadge phase={e.phase} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{e.summary}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatJstDateTime(e.ts)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function PhaseBadge({ phase }: { phase: ThoughtTraceEvent["phase"] }) {
  const variant =
    phase === "plan"
      ? "secondary"
      : phase === "act"
        ? "default"
        : phase === "observe"
          ? "muted"
          : "warning";
  return (
    <Badge variant={variant} className="mt-0.5 shrink-0 font-mono uppercase">
      {phase}
    </Badge>
  );
}
