"use client";

import { useState } from "react";

import {
  ParameterPanel,
  ParameterSegmented,
  ParameterSlider,
  ParameterTabs,
} from "@/registry/super-ai/parameter-panel";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";

const GUIDANCE_DEFAULT = 7;
const SEED_DEFAULT = 8;

export default function ParameterPanelDemo() {
  const [guidance, setGuidance] = useState(GUIDANCE_DEFAULT);
  const [quality, setQuality] = useState("standard");
  const [seed, setSeed] = useState(SEED_DEFAULT);

  const guidanceModified = guidance !== GUIDANCE_DEFAULT;
  const anyModified = guidanceModified || quality !== "standard";

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Reset-all — group scope (A11)</p>
        <ParameterPanel
          title="Sampling"
          modified={anyModified}
          onResetAll={() => {
            setGuidance(GUIDANCE_DEFAULT);
            setQuality("standard");
          }}
        >
          <ParameterSlider
            label="Guidance"
            value={guidance}
            min={0}
            max={20}
            step={0.5}
            endpoints={["More creative", "More literal"]}
            description="How closely the result follows the prompt. Higher values stay literal but can look over-processed."
            onValueChange={setGuidance}
            reset={
              guidanceModified ? (
                <ResetAffordance state="modified" onReset={() => setGuidance(GUIDANCE_DEFAULT)} />
              ) : (
                <ResetAffordance state="default" />
              )
            }
          />
          <ParameterSegmented
            label="Quality"
            options={[
              { value: "draft", label: "Draft" },
              { value: "standard", label: "Standard" },
              { value: "high", label: "High" },
            ]}
            value={quality}
            onValueChange={setQuality}
          />
        </ParameterPanel>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Tabbed — Basic / Advanced groups</p>
        <ParameterTabs
          groups={[
            {
              value: "basic",
              label: "Basic",
              content: (
                <ParameterSlider
                  label="Steps"
                  value={20}
                  min={1}
                  max={50}
                  unit=""
                  endpoints={["Faster", "More detail"]}
                  onValueChange={() => {}}
                />
              ),
            },
            {
              value: "advanced",
              label: "Advanced",
              content: (
                <ParameterSlider
                  label="Seed"
                  value={seed}
                  min={0}
                  max={9999}
                  unit=""
                  description="Fixing the seed reproduces the same result across runs with identical settings."
                  onValueChange={setSeed}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
