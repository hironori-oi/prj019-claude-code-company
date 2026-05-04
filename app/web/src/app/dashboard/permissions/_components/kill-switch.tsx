"use client";
/**
 * PRJ-019 Permissions - Kill Switch
 *
 * 押下時 -> 確認 dialog -> POST /api/hitl (gateKind: "emergency_stop") を発火し、
 * dispatcher 側で他の全 pending HITL を cancel する (DEC-019-033 §⑤ + pm-v4 §4.2)。
 *
 * Owner ガードは middleware で先送り (TODO Phase 1 W2)。
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";

export function KillSwitch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onConfirm = async () => {
    setError(null);
    try {
      const res = await fetch("/api/hitl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateKind: "emergency_stop",
          payload: {
            reason: "Owner kill switch から起動",
            source: "owner_manual",
          },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open Claw 緊急停止 (Kill Switch)"
      >
        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden />
        Kill Switch
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setError(null);
        }}
        title="Open Claw を緊急停止しますか？"
        description="emergency_stop (HITL-8) を発火し、すべての pending HITL を取り消します。実行中の subprocess は SIGTERM で停止されます (Phase 1 W2 で統合予定)。"
        confirmLabel="緊急停止する"
        cancelLabel="やめる"
        variant="destructive"
        onConfirm={onConfirm}
      >
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
