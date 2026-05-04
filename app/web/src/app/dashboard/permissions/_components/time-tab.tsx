/**
 * PRJ-019 Permissions Tab (6) 時間帯ウィンドウ
 * 7 (日-土) x 24 行列 (JST)。緑が許可、薄色が拒否。
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TimePolicy } from "@/types/policy";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function TimeTab({ policy }: { policy: TimePolicy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>(6) 時間帯ウィンドウ (JST)</CardTitle>
        <CardDescription>
          曜日 × 時間帯マトリクス。許可帯のみ Open Claw が起動可能。変更は HITL-10 経由。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="grid"
          aria-label="time policy matrix"
          className="overflow-x-auto"
        >
          <table className="text-xs">
            <thead>
              <tr>
                <th className="w-8 p-1 text-left font-mono text-muted-foreground"></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th
                    key={h}
                    className="w-6 p-1 text-center font-mono text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policy.matrix.map((row, day) => (
                <tr key={DAYS[day]}>
                  <td className="p-1 pr-2 font-medium">{DAYS[day]}</td>
                  {row.map((allowed, hour) => (
                    <td key={hour} className="p-0.5">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-sm",
                          allowed
                            ? "bg-emerald-500/80"
                            : "bg-muted",
                        )}
                        aria-label={`${DAYS[day]} ${hour}時 ${allowed ? "許可" : "拒否"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
