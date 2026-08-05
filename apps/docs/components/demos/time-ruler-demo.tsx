"use client";

import * as React from "react";

import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { TimeRuler, formatTimecode } from "@/registry/super-ai/time-ruler";
import { Button } from "@/components/ui/button";

const DURATION = 90;
const ZOOMS = [
  { id: "fit", label: "Whole clip", zoom: 8 },
  { id: "seconds", label: "Seconds", zoom: 40 },
  { id: "frames", label: "Frames", zoom: 160 },
];

/** Two stand-in lanes, so the playhead has more than the ruler to cross. */
function Lane({ title, tone }: { title: string; tone: string }) {
  return (
    <div className="bg-background flex h-12 items-center border-b">
      <div className={`text-foreground mx-1 flex h-9 flex-1 items-center rounded px-2 text-xs ${tone}`}>
        {title}
      </div>
    </div>
  );
}

export default function TimeRulerDemo() {
  const [zoomId, setZoomId] = React.useState("seconds");
  const [snapOn, setSnapOn] = React.useState(true);
  const [playhead, setPlayhead] = React.useState(21);
  const [range, setRange] = React.useState({ in: 12, out: 54 });

  const zoom = ZOOMS.find((z) => z.id === zoomId)?.zoom ?? 40;
  const snap = snapOn ? 0.5 : undefined;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChoiceChips value={zoomId} onValueChange={setZoomId} aria-label="Zoom">
          {ZOOMS.map((z) => (
            <ChoiceChip key={z.id} value={z.id}>
              {z.label}
            </ChoiceChip>
          ))}
        </ChoiceChips>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSnapOn((on) => !on)}>
            Snap {snapOn ? "on" : "off"}
          </Button>
          <span className="text-foreground text-xs tabular-nums">
            {formatTimecode(playhead, 2)} · in {formatTimecode(range.in)} · out{" "}
            {formatTimecode(range.out)}
          </span>
        </div>
      </div>

      {/* The scroll container belongs to the caller: it is what keeps the ruler
          and the lanes moving together. Focusable, so a keyboard can reach it. */}
      <div
        role="region"
        aria-label="Timeline"
        tabIndex={0}
        className="focus-visible:ring-ring w-full overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
      >
        <div className="w-max">
          <TimeRuler
            duration={DURATION}
            zoom={zoom}
            playhead={playhead}
            onPlayheadChange={setPlayhead}
            snap={snap}
            inPoint={range.in}
            outPoint={range.out}
            onRangeChange={setRange}
            // The playhead is drawn down the lanes as well as the ruler.
            style={{ "--time-ruler-playhead-height": "128px" } as React.CSSProperties}
          />
          <Lane title="Interview A — take 3" tone="bg-primary/15" />
          <Lane title="Room tone" tone="bg-secondary" />
        </div>
      </div>
    </div>
  );
}
