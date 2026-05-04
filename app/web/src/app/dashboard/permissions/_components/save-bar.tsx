"use client";
/**
 * PRJ-019 Permissions - Save Bar
 *
 * 各タブの編集を確定する保存 button。
 * 押下時に HITL 第10種 `permission_change_review` を起票し、Owner 承認後に hot-reload。
 * 本 Phase 1 W1 期では編集 UI 自体は未実装なので、本 button は HITL 起票テストのフックとして機能する。
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { PolicyCategory } from "@/types/policy";

interface SaveBarProps {
  category: PolicyCategory;
  prePolicyVersionId: string;
}

export function SaveBar({ category, prePolicyVersionId }: SaveBarProps) {
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
          gateKind: "permission_change_review",
          payload: {
            changeId: `pol-${Date.now()}`,
            triggerKind: "external_import",
            category,
            diffJson: { note: "scaffold edit (Phase 1 W1)" },
            prePolicyVersionId,
            postPolicyVersionId: prePolicyVersionId,
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
    <div className="flex items-center justify-end gap-2 rounded-md border bg-muted/30 p-3">
      <p className="mr-auto text-xs text-muted-foreground">
        変更保存時は HITL-10 permission_change_review (24h SLA / default reject) を発火します。
      </p>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="変更を保存して HITL-10 を起票"
      >
        <CheckIcon className="h-4 w-4" aria-hidden />
        変更を保存 (HITL-10 起票)
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setError(null);
        }}
        title="HITL-10 を起票しますか？"
        description="permission_change_review (24h SLA / default reject) を発火します。Owner が承認するまで現行 policy が維持されます。"
        confirmLabel="HITL-10 を起票"
        cancelLabel="やめる"
        onConfirm={onConfirm}
      >
        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
