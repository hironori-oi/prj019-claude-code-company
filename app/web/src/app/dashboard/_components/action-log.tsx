/**
 * PRJ-019 Dashboard (a) 行動ログ
 * source: audit_log (Open Claw の tool_call 履歴)
 * Phase 1 W2 で Supabase Realtime に置換。本実装は初期 fetch + manual refresh のみ。
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
import { formatJstDateTime } from "@/lib/utils";

export interface ActionLogEntry {
  id: string;
  ts: string;
  actorKind: "owner" | "operator" | "open_claw" | "system" | "subprocess";
  eventKind: string;
  resource: string;
}

const SAMPLE_ENTRIES: ActionLogEntry[] = [
  {
    id: "scaffold-1",
    ts: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    actorKind: "open_claw",
    eventKind: "tool.bash",
    resource: "ls projects/PRJ-019",
  },
  {
    id: "scaffold-2",
    ts: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    actorKind: "open_claw",
    eventKind: "tool.read",
    resource: "src/types/hitl.ts",
  },
  {
    id: "scaffold-3",
    ts: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    actorKind: "owner",
    eventKind: "hitl.approve",
    resource: "hitl_requests:scaffold-tos-1",
  },
];

export function ActionLogPanel({ entries }: { entries?: ActionLogEntry[] }) {
  const data = entries ?? SAMPLE_ENTRIES;
  return (
    <Card>
      <CardHeader>
        <CardTitle>(a) 行動ログ</CardTitle>
        <CardDescription>Open Claw の tool_call / Owner 操作 audit_log</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="記録された行動はまだありません" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">時刻</TableHead>
                <TableHead className="w-24">actor</TableHead>
                <TableHead className="w-32">event</TableHead>
                <TableHead>resource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">
                    {formatJstDateTime(e.ts)}
                  </TableCell>
                  <TableCell>
                    <ActorBadge kind={e.actorKind} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.eventKind}</TableCell>
                  <TableCell className="truncate text-xs text-muted-foreground">
                    {e.resource}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ActorBadge({ kind }: { kind: ActionLogEntry["actorKind"] }) {
  const variant =
    kind === "owner"
      ? "default"
      : kind === "open_claw"
        ? "secondary"
        : kind === "system"
          ? "muted"
          : "outline";
  return <Badge variant={variant}>{kind}</Badge>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
