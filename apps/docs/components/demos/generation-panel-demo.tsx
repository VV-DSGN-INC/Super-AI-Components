"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { GenerationPanel, type GenerationPanelFile } from "@/registry/super-ai/generation-panel";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

// E4 preset-grid, E3 parameter-panel, E2 model-picker and E5 run-button are
// being built concurrently elsewhere in this catalog, so they can't be
// imported here yet. `presets` and `settings` are filled with the shipped
// A8 preview-tile and A7 gen-settings-bar instead, purely to prove the
// arrangement holds — a real integration swaps these for PresetGrid,
// ModelPicker + ParameterPanel, and RunButton without changing GenerationPanel
// itself.
const PRESET_STYLES = ["Cinematic", "Anime", "Watercolor", "Isometric", "Product shot", "Vintage film"];

export default function GenerationPanelDemo() {
  const [files, setFiles] = React.useState<GenerationPanelFile[]>([
    { id: "1", name: "reference.png", preview: "https://placehold.co/200x200?text=Ref" },
  ]);
  const [directions, setDirections] = React.useState("A lighthouse at dusk, cinematic lighting");
  const [selectedPreset, setSelectedPreset] = React.useState("Cinematic");
  const [format, setFormat] = React.useState("16:9");

  const handleFilesAdd = (fileList: FileList) => {
    const added: GenerationPanelFile[] = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
    }));
    setFiles((current) => [...current, ...added]);
  };

  const handleFileRemove = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  };

  return (
    <div className="h-[32rem] w-full max-w-xs">
      <GenerationPanel
        files={files}
        onFilesAdd={handleFilesAdd}
        onFileRemove={handleFileRemove}
        dropzoneLabel="Upload reference image"
        directions={directions}
        onDirectionsChange={setDirections}
        presets={
          <div className="grid grid-cols-3 gap-2">
            {PRESET_STYLES.map((preset) => (
              <PreviewTile
                key={preset}
                aspect="square"
                label={preset}
                selected={selectedPreset === preset}
                onSelect={() => setSelectedPreset(preset)}
              >
                {/* preview-tile's frame is bg-muted (contractExempt legacy —
                    see docs/design-system/a11y-baseline.md). text-muted-foreground
                    on it is 4.34:1, under 4.5:1; text-foreground keeps the
                    tile's muted fill and clears contrast. */}
                <div className="text-foreground flex h-full w-full items-center justify-center text-[0.6rem]">
                  {preset}
                </div>
              </PreviewTile>
            ))}
          </div>
        }
        settings={
          <GenSettingsBar>
            {(["1:1", "16:9", "9:16"] as const).map((ratio) => (
              <GenSettingsItem
                key={ratio}
                aria-pressed={format === ratio}
                onClick={() => setFormat(ratio)}
                className={format === ratio ? "bg-accent text-accent-foreground" : undefined}
              >
                {ratio}
              </GenSettingsItem>
            ))}
          </GenSettingsBar>
        }
        cost={12}
        generate={<Button type="button">Generate</Button>}
      />
    </div>
  );
}
