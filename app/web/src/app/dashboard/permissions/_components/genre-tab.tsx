/**
 * PRJ-019 Permissions Tab (7) ジャンル
 * whitelist / blocklist。13 prohibited 系は network tab で永遠 deny として扱う。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GenrePolicy } from "@/types/policy";

export function GenreTab({ policy }: { policy: GenrePolicy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>(7) ジャンル</CardTitle>
        <CardDescription>
          提案ジャンル whitelist / blocklist。adult / weapons / drugs などは永遠 deny。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground">whitelist</h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {policy.whitelist.map((g) => (
              <li key={g}>
                <Badge variant="success" className="font-mono">
                  {g}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground">blocklist</h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {policy.blocklist.map((g) => (
              <li key={g}>
                <Badge variant="destructive" className="font-mono">
                  {g}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
