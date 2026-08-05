"use client";

import * as React from "react";

import { CompareViewer, type CompareMode } from "@/registry/super-ai/compare-viewer";

function Pane({ tone, caption }: { tone: string; caption: string }) {
  return (
    <div className={`flex h-64 w-full items-end p-3 ${tone}`}>
      <span className="bg-background text-foreground rounded px-2 py-1 text-xs">{caption}</span>
    </div>
  );
}

export default function CompareViewerDemo() {
  const [mode, setMode] = React.useState<CompareMode>("side");
  const [activePaneId, setActivePaneId] = React.useState("a");
  const [wipePosition, setWipePosition] = React.useState(50);

  return (
    <div className="w-full max-w-2xl">
      <CompareViewer
        mode={mode}
        onModeChange={setMode}
        activePaneId={activePaneId}
        onActivePaneChange={setActivePaneId}
        wipePosition={wipePosition}
        onWipePositionChange={setWipePosition}
        syncKey="upscale-demo"
        panes={[
          {
            id: "a",
            label: "Original",
            content: <Pane tone="bg-foreground/10" caption="1080p source" />,
          },
          {
            id: "b",
            label: "Upscaled 4x",
            content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" />,
          },
        ]}
      />
    </div>
  );
}
