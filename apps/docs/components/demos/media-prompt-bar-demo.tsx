"use client";

import { useState } from "react";

import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";

const STARTERS = [
  "A slow dolly-in on a rain-soaked neon alley at night",
  "A paper boat drifting down a gutter after a storm",
  "Macro shot of a watch mechanism, shallow depth of field",
];

export default function MediaPromptBarDemo() {
  const [value, setValue] = useState("");
  const [negativeValue, setNegativeValue] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [roll, setRoll] = useState(0);

  return (
    <MediaPromptBar
      value={value}
      onValueChange={setValue}
      negativeValue={negativeValue}
      onNegativeValueChange={setNegativeValue}
      negativePrompt={negativePrompt}
      onNegativePromptChange={setNegativePrompt}
      generating={generating}
      onRandomize={() => {
        setRoll((n) => n + 1);
        return STARTERS[roll % STARTERS.length];
      }}
      settings={
        <GenSettingsBar aria-label="Generation settings">
          <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
          <GenSettingsItem>16:9</GenSettingsItem>
          <GenSettingsItem>720p</GenSettingsItem>
        </GenSettingsBar>
      }
      cost={5}
      onSubmit={() => {
        setGenerating(true);
        setTimeout(() => setGenerating(false), 1500);
      }}
      onStop={() => setGenerating(false)}
    />
  );
}
