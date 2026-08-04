"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ParameterPanel, ParameterSlider } from "@/registry/super-ai/parameter-panel";

/**
 * Live examples for parameter-panel.docs.tsx.
 *
 * Kept as a client sidecar for the same reason as workspace-switcher's: the
 * docs module is plain data read by a Server Component and cannot itself
 * carry "use client" or inline event handlers. Every example here is a
 * zero-prop component referenced from the docs module as e.g. `<GoodEndpoints />`.
 */

export function GoodEndpoints() {
  return (
    <ParameterPanel>
      <ParameterSlider
        label="Guidance"
        value={7}
        min={0}
        max={20}
        step={0.5}
        endpoints={["More creative", "More literal"]}
        onValueChange={() => {}}
      />
    </ParameterPanel>
  );
}

export function BadRawEndpoints() {
  return (
    <ParameterPanel>
      <ParameterSlider
        label="Guidance"
        value={7}
        min={0}
        max={20}
        step={0.5}
        endpoints={["0.0", "20.0"]}
        onValueChange={() => {}}
      />
    </ParameterPanel>
  );
}

export function GoodInlineEducation() {
  return (
    <ParameterPanel>
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={1}
        step={0.1}
        description="Controls how much the model varies its wording between runs."
        onValueChange={() => {}}
      />
    </ParameterPanel>
  );
}

export function BadTooltipOnly() {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-[6rem_1fr] items-center gap-3">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          Temperature
          <Tooltip>
            <TooltipTrigger
              render={
                <button type="button" aria-label="What is temperature?">
                  <Info className="size-3.5" aria-hidden />
                </button>
              }
            />
            <TooltipContent>Controls how much the model varies its wording between runs.</TooltipContent>
          </Tooltip>
        </span>
        <div className="bg-muted h-1 w-full rounded-full" />
      </div>
    </TooltipProvider>
  );
}
