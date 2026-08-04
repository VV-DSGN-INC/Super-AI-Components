"use client";
import { useState } from "react";

import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";

const MODES = [
  { value: "ask", label: "Ask" },
  { value: "build", label: "Build" },
];

const MODELS = [
  { value: "veo-3.1", label: "Veo 3.1" },
  { value: "sora-2", label: "Sora 2" },
];

export default function HeroOmniboxDemo() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("ask");
  const [model, setModel] = useState("veo-3.1");
  const [generating, setGenerating] = useState(false);

  return (
    <HeroOmnibox
      state={generating ? "generating" : "idle"}
      value={value}
      onValueChange={setValue}
      modes={MODES}
      mode={mode}
      onModeChange={setMode}
      models={MODELS}
      model={model}
      onModelChange={setModel}
      cost={5}
      onSubmit={() => {
        setGenerating(true);
        setTimeout(() => setGenerating(false), 1500);
      }}
      onStop={() => setGenerating(false)}
    />
  );
}
