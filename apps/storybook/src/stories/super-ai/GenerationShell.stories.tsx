import type { Meta, StoryObj } from "@storybook/react-vite";

import { GenerationShell, type GenerationShellProps } from "@/registry/super-ai/generation-shell";
import { ParameterSlider } from "@/registry/super-ai/parameter-panel";
import { GenerationShellDocs } from "@/content/components/generation-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PRESETS = [
  { id: "cinematic", label: "Cinematic" },
  { id: "anime", label: "Anime" },
  { id: "claymation", label: "Claymation" },
  { id: "watercolour", label: "Watercolour" },
  { id: "noir", label: "Film noir" },
  { id: "isometric", label: "Isometric" },
];

const MODELS: GenerationShellProps["models"] = [
  {
    id: "veo",
    name: "Veo 3.1",
    group: "Text → video",
    description: "Best motion coherence. 8s at 1080p.",
    runtime: "cloud",
    price: 55,
    priceUnit: "credits",
    capabilities: ["1080p", "Audio"],
  },
  {
    id: "wan",
    name: "Wan 2.2",
    group: "Text → video",
    description: "Runs on your own GPU. Slower, free.",
    runtime: "local",
    hardware: "16 GB VRAM",
    capabilities: ["720p"],
  },
];

const PARAMETERS = (
  <ParameterSlider
    label="Motion"
    value={60}
    defaultValue={60}
    onValueChange={() => {}}
    endpoints={["Held still", "Constant movement"]}
    description="How much the camera and subject move over the clip."
  />
);

const EXAMPLE_PAIR: GenerationShellProps["examplePair"] = {
  before: {
    content: (
      <div className="bg-secondary text-secondary-foreground flex aspect-video items-center justify-center text-xs font-medium">
        Flat still
      </div>
    ),
    label: "Your photo",
  },
  after: {
    content: (
      <div className="bg-primary text-primary-foreground flex aspect-video items-center justify-center text-xs font-medium">
        8s of motion
      </div>
    ),
    label: "Generated clip",
  },
  caption: "A lighthouse at dusk, slow push in · Cinematic · Veo 3.1",
};

const RESULTS: GenerationShellProps["results"] = [
  { id: "r1", state: "done", label: "A lighthouse at dusk, slow push in" },
  { id: "r2", state: "done", label: "A lighthouse at dusk, static wide" },
  { id: "r3", state: "done", label: "A lighthouse at dawn" },
  { id: "r4", state: "done", label: "A lighthouse in fog" },
];

const FULL_ARGS: GenerationShellProps = {
  title: "Video generator",
  topbar: { privacy: { label: "Private" } },
  balance: 414,
  creditsTotal: 1000,
  credits: { onManage: () => {} },
  panel: {
    directions: "A lighthouse at dusk, slow push in",
    onDirectionsChange: () => {},
    directionsPlaceholder: "Describe the shot…",
  },
  presets: PRESETS,
  presetValue: "cinematic",
  onPresetChange: () => {},
  presetVisibleCount: 4,
  models: MODELS,
  modelId: "veo",
  onModelChange: () => {},
  parameters: PARAMETERS,
  onResetParameters: () => {},
  cost: 55,
  run: { state: "idle", onRun: () => {} },
  results: RESULTS,
  examplePair: EXAMPLE_PAIR,
};

const meta: Meta<typeof GenerationShell> = {
  title: "Super AI/Generation Shell",
  component: GenerationShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(GenerationShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GenerationShell>;

/** The working tool: a configured panel, a quoted price, and four results. */
export const Tool: Story = { args: FULL_ARGS };

/**
 * Day one. Nothing generated, so the whole right pane is L1's before → after
 * pair — the version most new users actually see, and the only thing on screen
 * that says what this tool does. Mandatory export for the block contract.
 */
export const Empty: Story = {
  args: {
    ...FULL_ARGS,
    panel: { directions: "", onDirectionsChange: () => {}, directionsPlaceholder: "Describe the shot…" },
    presetValue: undefined,
    results: [],
  },
};

/**
 * Narrow viewport. The two panes stack, and the config column stays
 * height-bounded so cost + Generate is still pinned below its own scroll
 * rather than falling to the bottom of the page. Mandatory export for the
 * block contract — a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API;
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing
 * while looking configured. `options` is declared explicitly so the selection
 * cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout here is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/** A run in flight: E5 draws its progress and offers Cancel, results stream into F2. */
export const Generating: Story = {
  args: {
    ...FULL_ARGS,
    run: { state: "running", progress: 62, runningLabel: "Generating…", onCancel: () => {} },
    results: [
      { id: "r1", state: "streaming", progress: 62, label: "A lighthouse at dusk, slow push in" },
      { id: "r2", state: "queued", label: "A lighthouse at dusk, static wide" },
      { id: "r3", state: "queued", label: "A lighthouse at dawn" },
      { id: "r4", state: "queued", label: "A lighthouse in fog" },
    ],
  },
};

/**
 * The handoff the cost contract exists for: A2 still quotes the price, M2 shows
 * the balance that cannot cover it, and E5 swaps Generate for Add credits with
 * the shortfall spelled out from the same two numbers.
 */
export const InsufficientCredits: Story = {
  args: {
    ...FULL_ARGS,
    balance: 12,
    run: { state: "insufficient-credits", onBuyCredits: () => {} },
    results: [],
  },
};

/** Select mode: F1's hover actions give way to checkboxes and F2's bulk bar. */
export const SelectMode: Story = {
  args: {
    ...FULL_ARGS,
    selectMode: true,
    selectedResultIds: ["r1", "r2"],
    onSelectionChange: () => {},
    bulkActions: <span className="text-foreground text-xs">Download · Delete</span>,
  },
};
