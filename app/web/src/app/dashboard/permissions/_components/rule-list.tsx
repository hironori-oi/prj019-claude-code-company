/**
 * PRJ-019 Permissions - 共通 RuleList コンポーネント
 * fs / command / network カテゴリで共有。allow/deny + pattern + locked 表示。
 */
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PolicyRule } from "@/types/policy";

interface RuleListProps {
  rules: PolicyRule[];
  emptyMessage?: string;
}

export function RuleList({ rules, emptyMessage }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? "ルールはまだ登録されていません"}
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">effect</TableHead>
          <TableHead>pattern</TableHead>
          <TableHead className="w-40">description</TableHead>
          <TableHead className="w-16">envelope</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((r) => (
          <TableRow key={r.id} className={r.locked ? "opacity-70" : undefined}>
            <TableCell>
              <Badge variant={r.effect === "allow" ? "success" : "destructive"}>
                {r.effect}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{r.pattern}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {r.description ?? "—"}
            </TableCell>
            <TableCell>
              {r.locked ? (
                <Badge variant="muted" className="font-mono">
                  locked
                </Badge>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
