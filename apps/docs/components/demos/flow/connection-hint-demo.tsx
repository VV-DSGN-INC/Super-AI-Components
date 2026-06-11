"use client";

import { useState } from "react";
import { ConnectionHint } from "@/registry/super-ai/flow/connection-hint";

const catalog = [
  {
    kind: "video-node",
    label: "Video Generator",
    description: "Generate video from image + text",
    in: ["image", "text"],
    out: ["video"],
  },
  {
    kind: "tts-node",
    label: "Text to Speech",
    description: "Convert text to audio",
    in: ["text"],
    out: ["audio"],
  },
  {
    kind: "caption-node",
    label: "Captioner",
    description: "Add captions to video",
    in: ["video", "text"],
    out: ["video"],
  },
];

export default function ConnectionHintDemo() {
  const [lastPick, setLastPick] = useState<string | null>(null);

  return (
    <div className="flex gap-10 p-8">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Dragging from &quot;image&quot; output
        </p>
        <div className="relative h-48 w-56 rounded-lg border bg-muted/30">
          <ConnectionHint
            dataType="image"
            catalog={catalog}
            position={{ x: 16, y: 16 }}
            onPick={(kind) => setLastPick(kind)}
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Dragging from &quot;text&quot; output
        </p>
        <div className="relative h-48 w-56 rounded-lg border bg-muted/30">
          <ConnectionHint
            dataType="text"
            catalog={catalog}
            position={{ x: 16, y: 16 }}
            onPick={(kind) => setLastPick(kind)}
          />
        </div>
      </div>
      {lastPick && <p className="self-center text-sm text-muted-foreground">Added: {lastPick}</p>}
    </div>
  );
}
