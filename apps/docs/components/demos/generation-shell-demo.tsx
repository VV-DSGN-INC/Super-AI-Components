"use client";

import * as React from "react";

import { GenerationShell } from "@/registry/super-ai/generation-shell";
import { ParameterSlider } from "@/registry/super-ai/parameter-panel";

const PRESETS = [
  { id: "cinematic", label: "Cinematic" },
  { id: "anime", label: "Anime" },
  { id: "claymation", label: "Claymation" },
  { id: "watercolour", label: "Watercolour" },
  { id: "noir", label: "Film noir" },
  { id: "isometric", label: "Isometric" },
];

const MODELS = [
  {
    id: "veo",
    name: "Veo 3.1",
    group: "Text → video",
    description: "Best motion coherence. 8s at 1080p.",
    runtime: "cloud" as const,
    price: 55,
    priceUnit: "credits",
    capabilities: ["1080p", "Audio"],
  },
  {
    id: "wan",
    name: "Wan 2.2",
    group: "Text → video",
    description: "Runs on your own GPU. Slower, free.",
    runtime: "local" as const,
    hardware: "16 GB VRAM",
    capabilities: ["720p"],
  },
];

function Swatch({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div className={`flex aspect-video items-center justify-center text-xs font-medium ${tone}`}>
      {children}
    </div>
  );
}

const EXAMPLE_PAIR = {
  before: {
    content: (
      <Swatch tone="bg-secondary text-secondary-foreground">
        <span>Flat still</span>
      </Swatch>
    ),
    label: "Your photo",
  },
  after: {
    content: (
      <Swatch tone="bg-primary text-primary-foreground">
        <span>8s of motion</span>
      </Swatch>
    ),
    label: "Generated clip",
  },
  caption: "“A lighthouse at dusk, slow push in” · Cinematic · Veo 3.1",
};

const RESULTS = [
  { id: "r1", state: "done" as const, label: "A lighthouse at dusk, slow push in" },
  { id: "r2", state: "done" as const, label: "A lighthouse at dusk, static wide" },
  { id: "r3", state: "streaming" as const, progress: 62, label: "A lighthouse at dawn" },
  { id: "r4", state: "queued" as const, label: "A lighthouse in fog" },
];

export default function GenerationShellDemo() {
  const [directions, setDirections] = React.useState("A lighthouse at dusk, slow push in");
  const [preset, setPreset] = React.useState<string | string[]>("cinematic");
  const [model, setModel] = React.useState("veo");
  const [motion, setMotion] = React.useState(60);

  return (
    <GenerationShell
      className="h-[42rem]"
      title="Video generator"
      topbar={{ privacy: { label: "Private" } }}
      balance={414}
      creditsTotal={1000}
      credits={{ onManage: () => {} }}
      panel={{
        directions,
        onDirectionsChange: setDirections,
        directionsPlaceholder: "Describe the shot…",
      }}
      presets={PRESETS}
      presetValue={preset}
      onPresetChange={setPreset}
      presetVisibleCount={4}
      models={MODELS}
      modelId={model}
      onModelChange={setModel}
      parameters={
        <ParameterSlider
          label="Motion"
          value={motion}
          defaultValue={60}
          onValueChange={setMotion}
          endpoints={["Held still", "Constant movement"]}
          description="How much the camera and subject move over the clip."
        />
      }
      parametersModified={motion !== 60}
      onResetParameters={() => setMotion(60)}
      cost={55}
      run={{ state: "idle", onRun: () => {} }}
      results={RESULTS}
      examplePair={EXAMPLE_PAIR}
    />
  );
}
