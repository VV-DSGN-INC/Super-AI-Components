import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import { GenerationPanelDocs } from "@/content/components/generation-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { GenerationPanel, type GenerationPanelProps } from "@/registry/super-ai/generation-panel";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

// E4 preset-grid, E2 model-picker, E3 parameter-panel and E5 run-button are
// being built concurrently elsewhere in this catalog and can't be imported
// here yet — these stories fill `presets`/`settings`/`generate` with shipped
// A8 preview-tile, A7 gen-settings-bar and a plain Button to prove the
// arrangement, the same substitution the docs demo makes.
const PRESETS = (
  <div className="grid grid-cols-3 gap-2">
    {["Cinematic", "Anime", "Watercolor"].map((preset) => (
      <PreviewTile key={preset} aspect="square" label={preset}>
        {/* preview-tile's frame is bg-muted (contractExempt legacy — see
            a11y-baseline.md). text-muted-foreground on it is 4.34:1, under
            4.5:1; text-foreground keeps the tile's muted fill and clears
            contrast, the same fix used at every other bg-muted call site. */}
        <div className="text-foreground flex h-full w-full items-center justify-center text-[0.6rem]">
          {preset}
        </div>
      </PreviewTile>
    ))}
  </div>
);

const SETTINGS = (
  <GenSettingsBar>
    <GenSettingsItem aria-pressed>16:9</GenSettingsItem>
    <GenSettingsItem>9:16</GenSettingsItem>
    <GenSettingsItem>1:1</GenSettingsItem>
  </GenSettingsBar>
);

function GenerationPanelShell(args: GenerationPanelProps) {
  return (
    <div className="h-[32rem] w-72">
      <GenerationPanel {...args} />
    </div>
  );
}

const meta: Meta<typeof GenerationPanel> = {
  title: "Super AI/Generation Panel",
  component: GenerationPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationPanelDocs) } },
  render: (args) => <GenerationPanelShell {...args} />,
};

export default meta;
type Story = StoryObj<typeof GenerationPanel>;

// Each story shows the whole panel — the five declared states are stages of
// one assembly, not variants — while emphasising the stage named by the
// story via which slot carries real data.

export const Dropzone: Story = {
  args: {
    onFilesAdd: () => {},
    onFileRemove: () => {},
    dropzoneLabel: "Upload reference image",
    files: [
      { id: "1", name: "reference.png", preview: "https://placehold.co/200x200?text=Ref" },
      { id: "2", name: "mood-board.jpg" },
    ],
  },
};

export const Directions: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    onDirectionsChange: () => {},
  },
};

export const Presets: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
  },
};

export const Settings: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
    settings: SETTINGS,
  },
};

export const CostAndGenerate: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
    settings: SETTINGS,
    cost: 12,
    generate: <Button type="button">Generate</Button>,
  },
};
