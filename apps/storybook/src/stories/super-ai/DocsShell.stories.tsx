import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, Blocks, Image as ImageIcon, Rocket } from "lucide-react";

import { DocsShell, type DocsShellProps } from "@/registry/super-ai/docs-shell";
import { DocsShellDocs } from "@/content/components/docs-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const AREAS: DocsShellProps["areas"] = [
  { id: "platform", label: "Platform", icon: <Blocks /> },
  { id: "images", label: "Image models", icon: <ImageIcon /> },
  { id: "audio", label: "Audio models", icon: <AudioLines /> },
  { id: "deploy", label: "Deploy", icon: <Rocket /> },
];

const NAV_SECTIONS: DocsShellProps["navSections"] = [
  {
    label: "Get started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "authentication", label: "Authentication" },
      { id: "rate-limits", label: "Rate limits", tier: "Pro" },
    ],
  },
  {
    label: "Generate",
    items: [
      { id: "text-to-image", label: "Text to image" },
      { id: "image-to-image", label: "Image to image" },
      { id: "upscale", label: "Upscale", count: 2 },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "errors", label: "Errors" },
      { id: "changelog", label: "Changelog", unread: true },
      { id: "status", label: "Status page", href: "https://example.com/status", external: true },
    ],
  },
];

const SECTIONS: DocsShellProps["sections"] = [
  {
    id: "overview",
    title: "Overview",
    body: "Every image request is a POST to /v1/images with a JSON body. The response streams progress events until the final asset URL arrives, so a client can show partial results without polling for them.",
  },
  {
    id: "sizes",
    title: "Supported sizes",
    body: "Square, portrait and landscape are billed identically. Anything above 2048px on the long edge is billed at the upscale rate, whether or not you asked for an upscale.",
    citations: [
      {
        id: "pricing",
        label: "1",
        source: "Pricing — image generation",
        quote: "Outputs above 2048px on the long edge bill at the upscale rate.",
      },
    ],
  },
  {
    id: "errors",
    title: "Errors",
    body: "A 429 carries a Retry-After header in seconds. A 402 means the workspace is out of credits and will not clear on its own.",
    citations: [
      {
        id: "rfc",
        label: "2",
        source: "RFC 6585 §4",
        quote: "The 429 status code indicates that the user has sent too many requests.",
      },
      { id: "orphan", label: "3", state: "unresolved" },
    ],
  },
];

const FULL_ARGS: DocsShellProps = {
  railBrand: <div className="px-1 text-sm font-medium">NW</div>,
  areas: AREAS,
  activeAreaId: "images",
  onSelectArea: () => {},
  navSections: NAV_SECTIONS,
  activePageId: "text-to-image",
  onSelectPage: () => {},
  announcements: [
    {
      id: "streaming-2026-08",
      title: "Streaming image progress",
      description: "Partial frames now arrive before the final asset.",
      stage: "Beta",
      ctaLabel: "Read the guide",
      onCtaClick: () => {},
    },
  ],
  onDismissAnnouncement: () => {},
  title: "Text to image",
  lede: "Generate an image from a prompt, with optional reference images and a seed for reproducibility.",
  sections: SECTIONS,
};

const meta: Meta<typeof DocsShell> = {
  title: "Super AI/Docs Shell",
  component: DocsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame. It is also what
  // makes the rail's bottom-anchored footer slot usable at all.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(DocsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocsShell>;

/** The working shell: four product areas, a sectioned page nav, one announcement, a cited page. */
export const Reference: Story = {
  args: {
    ...FULL_ARGS,
    // Safe here and nowhere else: the story frame is viewport-tall, so B1's
    // bottom-anchored footer is not clipped by the shell's containment.
    railFooter: <div className="px-1 py-1 text-center text-xs">NV</div>,
  },
};

/**
 * Day one. No areas in the rail, no pages in the nav, no announcements, nothing
 * written on the page — the nav and the content column both fall to L1, and the
 * rail and the strip are empty because neither B1 nor L3 has an empty form.
 * Mandatory export for the block contract, and the version a new docs site
 * actually starts from.
 */
export const Empty: Story = {
  args: { railBrand: <div className="px-1 text-sm font-medium">NW</div> },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, the page nav stops being a column and stacks above
 * the content as a short scrollable strip, and the content column keeps its
 * measure because the measure is a max, not a width. Mandatory export for the
 * block contract — a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing at all while looking
 * configured, so `options` is declared explicitly rather than relying on a
 * built-in list.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width like any
 * other. The narrow layout here is verified by hand, not by a gate.
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

/**
 * The rail expanded to full width. Same rows, same landmark, labels no longer
 * clipped — this is what the vendored sidebar's ⌘B binding toggles to, and the
 * reason the shell advertises that binding with keycaps beside the trigger.
 */
export const RailExpanded: Story = {
  args: { ...FULL_ARGS, defaultRailExpanded: true },
};

/**
 * A quiet page: no news pinned above it. The strip is still mounted, it just
 * has nothing to paint — which is why the region exists on every page rather
 * than appearing the first time there is something to say.
 */
export const NoAnnouncements: Story = {
  args: { ...FULL_ARGS, announcements: [] },
};

/**
 * A product area with nothing published yet. The rail still switches, the page
 * nav falls to L1, and the content column keeps whatever you were reading —
 * three regions in three different states at once.
 */
export const AreaWithoutPages: Story = {
  args: { ...FULL_ARGS, activeAreaId: "audio", navSections: [], activePageId: undefined },
};
