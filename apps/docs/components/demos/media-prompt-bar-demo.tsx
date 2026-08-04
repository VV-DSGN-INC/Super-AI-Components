"use client";

import { useState } from "react";

import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";

export default function MediaPromptBarDemo() {
  const [value, setValue] = useState("");
  const [negativeValue, setNegativeValue] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(false);
  const [generating, setGenerating] = useState(false);

  return (
    <MediaPromptBar
      value={value}
      onValueChange={setValue}
      negativeValue={negativeValue}
      onNegativeValueChange={setNegativeValue}
      negativePrompt={negativePrompt}
      onNegativePromptChange={setNegativePrompt}
      generating={generating}
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
