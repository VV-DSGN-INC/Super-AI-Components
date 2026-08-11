import type { Meta, StoryObj } from "@storybook/react-vite";

import { LibraryShellDocs } from "@/content/components/library-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { LibraryShell, type LibraryShellProps } from "@/registry/super-ai/library-shell";

const FACETS: LibraryShellProps["facets"] = [
  {
    id: "type",
    label: "Type",
    facets: [
      { value: "image", label: "Image", count: 1284 },
      { value: "video", label: "Video", count: 96 },
      { value: "audio", label: "Audio", count: 18 },
      // The dead end, stated before the click rather than after it.
      { value: "3d", label: "3D", count: 0 },
    ],
  },
  {
    id: "model",
    label: "Model",
    visibleCount: 3,
    facets: [
      { value: "v7", label: "Aurora v7", count: 812 },
      { value: "v6", label: "Aurora v6", count: 401 },
      { value: "sketch", label: "Sketch", count: 121 },
      { value: "legacy", label: "Legacy", count: 64 },
    ],
  },
  {
    id: "format",
    label: "Format",
    facets: [
      { value: "portrait", label: "Portrait", count: 604 },
      { value: "landscape", label: "Landscape", count: 588 },
      { value: "square", label: "Square", count: 206 },
    ],
  },
];

const SAVED_SEARCHES = [
  { id: "upscaled", label: "Upscaled keepers", count: 42 },
  { id: "client", label: "Client-ready", count: 17 },
];

/**
 * Decorative stand-ins for real media — an archive's thumbnails are the
 * caller's. Solid semantic fills rather than gradients: axe cannot resolve a
 * gradient to a colour, so a gradient thumbnail would leave every tile's
 * overlay label permanently "incomplete" in the contrast report.
 */
const swatch = (tint: string) => <div aria-hidden className={`h-full w-full ${tint}`} />;

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";
const spanFor = (phrase: string) => ({
  start: PROMPT.indexOf(phrase),
  end: PROMPT.indexOf(phrase) + phrase.length,
});

const GROUPS: LibraryShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "a1",
        name: "Red bicycle, sunlit wall",
        thumbnail: swatch("bg-primary/20"),
        prompt: PROMPT,
        highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
        params: [
          { label: "Seed", value: "4471", copyable: true },
          { label: "Sampler", value: "Euler a" },
          { label: "Steps", value: "32" },
          { label: "Model", value: "Aurora v7" },
        ],
      },
      { id: "a2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
      { id: "a3", name: "Rain on glass", thumbnail: swatch("bg-accent") },
      { id: "a4", name: "Market stall", thumbnail: swatch("bg-muted") },
      { id: "a5", name: "Bridge at noon", thumbnail: swatch("bg-primary/10") },
      { id: "a6", name: "Studio portrait", thumbnail: swatch("bg-card") },
      { id: "a7", name: "Cold open", thumbnail: swatch("bg-primary/10") },
      { id: "a8", name: "Paper texture", thumbnail: swatch("bg-muted") },
    ],
  },
  {
    id: "last-week",
    label: "Last week",
    items: [
      { id: "b1", name: "Harbour at dusk", thumbnail: swatch("bg-primary/30") },
      { id: "b2", name: "Neon alley", thumbnail: swatch("bg-secondary") },
      { id: "b3", name: "Upscaling", state: "loading" },
      { id: "b4", name: "Locked render", state: "locked", thumbnail: swatch("bg-secondary") },
    ],
  },
];

const FULL_ARGS: LibraryShellProps = {
  title: "Library",
  facets: FACETS,
  savedSearches: SAVED_SEARCHES,
  defaultSelectedFacets: { type: ["image"] },
  groups: GROUPS,
  onCopyPrompt: () => {},
  onRemix: () => {},
  onEditAsset: () => {},
  onSpanSelect: () => {},
};

const meta: Meta<typeof LibraryShell> = {
  title: "Super AI/Library Shell",
  component: LibraryShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(LibraryShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LibraryShell>;

/** The working archive: counted facets, one filter applied, two date buckets, eight-up. */
export const Archive: Story = { args: FULL_ARGS };

/**
 * Day one. Facets exist but count nothing, and the grid falls to L1 as an
 * in-grid tile rather than a page takeover — the columns stay, so the archive
 * still looks like an archive. Mandatory export for the block contract.
 */
export const Empty: Story = {
  args: {
    title: "Library",
    facets: [
      {
        id: "type",
        label: "Type",
        facets: [
          { value: "image", label: "Image", count: 0 },
          { value: "video", label: "Video", count: 0 },
        ],
      },
    ],
  },
};

/**
 * Narrow viewport. Below `md` the shell stacks: the facet rail becomes a short
 * scrolling band above the header instead of disappearing, and the grid steps
 * down to three columns at `compact`. Mandatory export for the block contract —
 * a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking
 * configured, so `options` is declared explicitly rather than relying on a
 * built-in list.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
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

/** Thumbnail size is the reader's preference: the same archive at four-up. */
export const Comfortable: Story = { args: { ...FULL_ARGS, density: "comfortable" } };

/** Select mode: every tile toggles instead of opening, and F2's bulk bar appears. */
export const SelectMode: Story = {
  args: {
    ...FULL_ARGS,
    selectMode: true,
    selectedIds: ["a2", "a4"],
    onSelectionChange: () => {},
    bulkActions: (
      <>
        <button type="button" className="rounded-md border px-2 py-1 text-xs">
          Download
        </button>
        <button type="button" className="rounded-md border px-2 py-1 text-xs">
          Delete
        </button>
      </>
    ),
  },
};

/** F3 open on the one asset with full provenance — the reason the archive is worth keeping. */
export const AssetOpen: Story = { args: { ...FULL_ARGS, openAssetId: "a1", onOpenAssetChange: () => {} } };
