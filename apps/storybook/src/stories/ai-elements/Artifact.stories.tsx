import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { CopyIcon, DownloadIcon, RefreshCwIcon } from "lucide-react";

const meta: Meta<typeof Artifact> = {
  title: "AI Elements/Artifact",
  component: Artifact,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Artifact>;

const scriptText = `Scene 1 — Hook (0:00–0:03)
Fast cut of the product box opening, upbeat synth-pop sting.

Scene 2 — Problem (0:03–0:08)
Tired founder staring at a spreadsheet at 2am. Desaturated grade.

Scene 3 — Solution (0:08–0:18)
Dashboard animates in. Numbers tick up. Warm color grade returns.

Scene 4 — Call to action (0:18–0:22)
Logo lockup. "Start your free trial." End card with URL.`;

export const Default: Story = {
  render: () => (
    <Artifact className="w-[480px]">
      <ArtifactHeader>
        <div>
          <ArtifactTitle>Marketing Video Script</ArtifactTitle>
          <ArtifactDescription>22-second product launch promo</ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction icon={RefreshCwIcon} tooltip="Regenerate" />
          <ArtifactAction icon={CopyIcon} tooltip="Copy" />
          <ArtifactAction icon={DownloadIcon} tooltip="Download" />
          <ArtifactClose />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {scriptText}
        </pre>
      </ArtifactContent>
    </Artifact>
  ),
};
