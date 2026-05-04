"use client";
/**
 * PRJ-019 Dashboard 手動リフレッシュ button (Phase 1 W1 期)
 * Phase 1 W2 で Supabase Realtime に置換した後、本 button は最終手動リカバリ用に残す。
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label="ダッシュボードを再取得"
    >
      <ArrowPathIcon className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {pending ? "更新中…" : "再取得"}
    </Button>
  );
}
