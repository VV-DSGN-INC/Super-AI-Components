"use client";
import { useState } from "react";

import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

const WORKSPACE_LIST = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
  { id: "north-star", name: "North Star Studio", plan: "Free" },
];

const MULTI_PRODUCT = [
  { id: "acme-video", name: "Acme Video", plan: "Pro", description: "Video generation workspace" },
  { id: "acme-copy", name: "Acme Copy", plan: "Pro", description: "Marketing copy workspace" },
  { id: "personal", name: "Personal", plan: "Free", description: "Solo experiments" },
];

export default function WorkspaceSwitcherDemo() {
  const [listCurrentId, setListCurrentId] = useState("acme");
  const [multiCurrentId, setMultiCurrentId] = useState("acme-video");
  const [badgeCurrentId, setBadgeCurrentId] = useState("acme");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Workspace list</p>
        <WorkspaceSwitcher
          workspaces={WORKSPACE_LIST}
          currentId={listCurrentId}
          onSelect={setListCurrentId}
          onCreate={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Multi-product, with descriptions</p>
        <WorkspaceSwitcher
          workspaces={MULTI_PRODUCT}
          currentId={multiCurrentId}
          onSelect={setMultiCurrentId}
          onCreate={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Plan badge on the trigger</p>
        <WorkspaceSwitcher
          workspaces={WORKSPACE_LIST.filter((w) => w.id !== "north-star")}
          currentId={badgeCurrentId}
          onSelect={setBadgeCurrentId}
        />
      </div>
    </div>
  );
}
