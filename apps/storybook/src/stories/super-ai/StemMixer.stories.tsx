import type { Meta, StoryObj } from "@storybook/react-vite";

import { StemMixer, type Stem } from "@/registry/super-ai/stem-mixer";
import { StemMixerDocs } from "@/content/components/stem-mixer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof StemMixer> = {
  title: "Super AI/Stem Mixer",
  component: StemMixer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(StemMixerDocs) } },
};

export default meta;
type Story = StoryObj<typeof StemMixer>;

const SEPARATED: Stem["lineage"] = {
  origin: "separated",
  source: "Midnight Drive (master).wav",
  detail: "Demucs v4",
};

const STEMS: Stem[] = [
  { id: "drums", name: "Drums", volume: 84, pan: 0 },
  { id: "bass", name: "Bass", volume: 71, pan: -12 },
  { id: "vocals", name: "Vocals", volume: 92, pan: 0 },
  { id: "pads", name: "Pads", volume: 58, pan: 34 },
];

/** One solo, and every other lane says why it has gone quiet. */
export const ExclusiveSolo: Story = {
  args: {
    label: "Midnight Drive stems",
    soloMode: "exclusive",
    stems: STEMS.map((stem) => ({ ...stem, soloed: stem.id === "vocals" })),
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Same markup, same controls — two stems held up together instead of one. */
export const AdditiveSolo: Story = {
  args: {
    label: "Midnight Drive stems",
    soloMode: "additive",
    stems: STEMS.map((stem) => ({
      ...stem,
      soloed: stem.id === "drums" || stem.id === "bass",
    })),
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Levels arrive from whatever is playing; a muted lane still says "Muted". */
export const LiveMeters: Story = {
  args: {
    label: "Midnight Drive stems",
    stems: [
      { ...STEMS[0], level: 74 },
      { ...STEMS[1], level: 52 },
      { ...STEMS[2], level: 31 },
      { ...STEMS[3], muted: true, level: 0 },
    ],
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Three stems pulled out of a master, one the model wrote from a prompt. */
export const StemLineage: Story = {
  args: {
    label: "Midnight Drive stems",
    stems: [
      { ...STEMS[0], lineage: SEPARATED },
      { ...STEMS[1], lineage: SEPARATED },
      { ...STEMS[2], lineage: SEPARATED },
      {
        ...STEMS[3],
        lineage: { origin: "generated", source: "warm analogue pad, A minor", detail: "take 3" },
      },
    ],
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};
