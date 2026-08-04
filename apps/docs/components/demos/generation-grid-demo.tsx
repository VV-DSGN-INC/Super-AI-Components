"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { GenerationGrid, type GenerationGridDensity } from "@/registry/super-ai/generation-grid";
import { ResultCard, type ResultCardState } from "@/registry/super-ai/result-card";

interface Result {
  id: string;
  prompt: string;
  state: ResultCardState;
}

const TODAY: Result[] = [
  { id: "1", prompt: "Rooftop garden, golden hour", state: "done" },
  { id: "2", prompt: "Neon alley, rain reflections", state: "streaming" },
  { id: "3", prompt: "Studio portrait, soft light", state: "queued" },
  { id: "4", prompt: "Glass sculpture on marble", state: "failed" },
];

const YESTERDAY: Result[] = [
  { id: "5", prompt: "Coastal cliffs at dawn", state: "done" },
  { id: "6", prompt: "Paper texture close-up", state: "done" },
];

function Media() {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-6" />
    </div>
  );
}

export default function GenerationGridDemo() {
  const [density, setDensity] = React.useState<GenerationGridDensity>("comfortable");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setDensity((d) => (d === "comfortable" ? "default" : d === "default" ? "compact" : "comfortable"))
          }
        >
          Density: {density}
        </Button>
        <Button
          size="sm"
          variant={selectMode ? "default" : "outline"}
          onClick={() => {
            setSelectMode((s) => !s);
            setSelectedIds([]);
          }}
        >
          {selectMode ? "Done selecting" : "Select"}
        </Button>
      </div>

      <GenerationGrid
        density={density}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        groups={[
          { id: "today", label: "Today", items: TODAY },
          { id: "yesterday", label: "Yesterday", items: YESTERDAY },
        ]}
        getItemId={(item) => item.id}
        bulkActions={
          <>
            <Button size="sm" variant="outline">
              Download
            </Button>
            <Button size="sm" variant="outline">
              Delete
            </Button>
          </>
        }
        renderItem={(item, ctx) => (
          <ResultCard
            state={item.state}
            aspect="square"
            progress={54}
            label={item.prompt}
            selectable={ctx.selectMode}
            selected={ctx.selected}
            onSelect={ctx.toggleSelected}
            onRetry={() => {}}
            actions={
              <Button size="icon-sm" variant="secondary" aria-label={`Download ${item.prompt}`}>
                <Sparkles aria-hidden />
              </Button>
            }
            footer={item.state === "done" ? <span>17 credits</span> : null}
          >
            <Media />
          </ResultCard>
        )}
      />
    </div>
  );
}
