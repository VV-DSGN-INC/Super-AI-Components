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

const STARTERS = [
  "Summarize the attached earnings call and list every open commitment",
  "Draft a reply to the vendor that asks for a revised timeline",
  "Explain this error log and suggest the smallest fix",
];

export default function HeroOmniboxDemo() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("ask");
  const [model, setModel] = useState("veo-3.1");
  const [generating, setGenerating] = useState(false);
  const [roll, setRoll] = useState(0);

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
      onRandomize={() => {
        setRoll((n) => n + 1);
        return STARTERS[roll % STARTERS.length];
      }}
      onSubmit={() => {
        setGenerating(true);
        setTimeout(() => setGenerating(false), 1500);
      }}
      onStop={() => setGenerating(false)}
    />
  );
}
