"use client";
/**
 * PRJ-019 Permissions - 7 tab container (client component)
 * Tabs primitive を controlled で扱う。タブ value を URL hash と同期するのは Phase 1 W2 (TODO)。
 */
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PolicySnapshot } from "@/types/policy";
import { POLICY_CATEGORY_LABELS } from "@/types/policy";
import { FsTab } from "./fs-tab";
import { CommandTab } from "./command-tab";
import { NetworkTab } from "./network-tab";
import { HitlTab } from "./hitl-tab";
import { CostTab } from "./cost-tab";
import { TimeTab } from "./time-tab";
import { GenreTab } from "./genre-tab";
import { SaveBar } from "./save-bar";

const TAB_ORDER = ["fs", "command", "network", "hitl", "cost", "time", "genre"] as const;

export function PermissionsTabs({ policy }: { policy: PolicySnapshot }) {
  const [active, setActive] = React.useState<(typeof TAB_ORDER)[number]>("fs");
  return (
    <div className="space-y-4">
      <Tabs value={active} onValueChange={(v) => setActive(v as (typeof TAB_ORDER)[number])}>
        <TabsList className="w-full">
          {TAB_ORDER.map((key) => (
            <TabsTrigger key={key} value={key}>
              {POLICY_CATEGORY_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="fs">
          <FsTab policy={policy.fs} />
        </TabsContent>
        <TabsContent value="command">
          <CommandTab policy={policy.command} />
        </TabsContent>
        <TabsContent value="network">
          <NetworkTab policy={policy.network} />
        </TabsContent>
        <TabsContent value="hitl">
          <HitlTab policy={policy.hitl} />
        </TabsContent>
        <TabsContent value="cost">
          <CostTab policy={policy.cost} />
        </TabsContent>
        <TabsContent value="time">
          <TimeTab policy={policy.time} />
        </TabsContent>
        <TabsContent value="genre">
          <GenreTab policy={policy.genre} />
        </TabsContent>
      </Tabs>
      <SaveBar category={active} prePolicyVersionId={policy.versionId} />
    </div>
  );
}
