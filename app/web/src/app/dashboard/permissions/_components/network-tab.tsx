/**
 * PRJ-019 Permissions Tab (3) ネットワーク
 *
 * 13 prohibited domains (DEC-019-033 §⑤) は永遠 deny envelope として disabled で表示。
 * Owner / operator / Open Claw のいずれも override できない (Casbin policy hard envelope)。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import type { NetworkPolicy } from "@/types/policy";
import { RuleList } from "./rule-list";

export function NetworkTab({ policy }: { policy: NetworkPolicy }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>(3) ネットワーク (allow / deny)</CardTitle>
          <CardDescription>
            ドメイン単位での allow / deny。tenant 内で外部 API 呼出時に Casbin が評価。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RuleList rules={policy.rules} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockClosedIcon className="h-4 w-4" aria-hidden />
            13 prohibited domains (永遠 deny)
          </CardTitle>
          <CardDescription>
            DEC-019-033 §⑤ に基づく永遠 deny envelope。Owner も override 不可 / UI からは閲覧のみ。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul
            className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3"
            aria-disabled="true"
          >
            {policy.prohibitedDomains.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 opacity-70"
              >
                <span className="font-mono text-xs">{d}</span>
                <Badge variant="destructive" className="font-mono text-[10px]">
                  deny
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
