/**
 * PRJ-019 Permissions Tab (1) FS 書込範囲
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FsPolicy } from "@/types/policy";
import { RuleList } from "./rule-list";

export function FsTab({ policy }: { policy: FsPolicy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>(1) FS 書込範囲</CardTitle>
        <CardDescription>
          Open Claw が書込可能なパスを glob 単位で allow / deny 指定。.env / secrets は永遠 deny。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RuleList rules={policy.rules} />
      </CardContent>
    </Card>
  );
}
