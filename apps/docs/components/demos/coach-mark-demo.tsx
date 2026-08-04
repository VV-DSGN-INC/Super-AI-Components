"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachMark, type CoachMarkSide } from "@/registry/super-ai/coach-mark";

/**
 * The tour lives here, in the host — not in the component. `CoachMark` renders
 * one step; this array, this index and this "seen" flag are the shared state
 * the spec means by "a tour is a sequence of coach-marks".
 */
const TOUR: { id: string; title: string; description: string; side: CoachMarkSide }[] = [
  {
    id: "prompt",
    title: "Start with a prompt",
    description: "Describe the shot you want. Everything else on this bar is optional.",
    side: "bottom",
  },
  {
    id: "model",
    title: "Swap the model anytime",
    description: "Faster models cost less. You can change this between runs without losing work.",
    side: "bottom",
  },
  {
    id: "run",
    title: "Generate when ready",
    description: "The cost is confirmed here before anything is spent.",
    side: "top",
  },
];

export default function CoachMarkDemo() {
  const [index, setIndex] = React.useState<number | null>(null);

  const start = () => setIndex(0);
  const stop = () => setIndex(null);
  const next = () => setIndex((i) => (i === null || i >= TOUR.length - 1 ? null : i + 1));
  const back = () => setIndex((i) => (i === null || i === 0 ? i : i - 1));

  // One helper, applied to every step: the props that describe *where in the
  // sequence* a mark sits are derived from the host's index, never stored on
  // the mark itself.
  const stepProps = (position: number) => {
    const step = TOUR[position];
    return {
      title: step.title,
      description: step.description,
      side: step.side,
      step: position + 1,
      total: TOUR.length,
      open: index === position,
      onOpenChange: (open: boolean) => {
        if (!open && index === position) stop();
      },
      onSkip: stop,
      onNext: next,
      onBack: back,
    };
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="flex w-full max-w-xl items-end gap-2 rounded-xl border p-3">
        <CoachMark {...stepProps(0)} className="flex-1">
          <label className="flex flex-col gap-1.5 text-xs">
            Prompt
            <Input defaultValue="A kestrel hovering over a wheat field at dusk" />
          </label>
        </CoachMark>

        <CoachMark {...stepProps(1)}>
          <Button variant="outline" size="lg" type="button">
            <Sparkles /> Veo 3.1 Fast
          </Button>
        </CoachMark>

        <CoachMark {...stepProps(2)}>
          <Button size="lg" type="button">
            Generate
          </Button>
        </CoachMark>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" type="button" onClick={start} disabled={index !== null}>
          Start tour
        </Button>
        <p aria-live="polite" className="text-xs">
          {index === null ? "Tour not running" : `Showing step ${index + 1} of ${TOUR.length}`}
        </p>
      </div>
    </div>
  );
}
