/**
 * PRJ-019 Permissions Tab (2) シェルコマンド
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommandPolicy } from "@/types/policy";
import { RuleList } from "./rule-list";

export function CommandTab({ policy }: { policy: CommandPolicy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>(2) シェルコマンド</CardTitle>
        <CardDescription>
          コマンド whitelist + 引数正規表現。`rm -rf *` 系の destructive 系は永遠 deny。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RuleList rules={policy.rules} />
      </CardContent>
    </Card>
  );
}
