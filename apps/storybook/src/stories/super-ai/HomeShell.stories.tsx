import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clapperboard, Image as ImageIcon, Mic, Sparkles, Type, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeShell, type HomeShellProps } from "@/registry/super-ai/home-shell";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { HomeShellDocs } from "@/content/components/home-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const NAV = (
  <SidebarNav
    activeId="home"
    sections={[
      {
        label: "Workspace",
        items: [
          { id: "home", label: "Home", icon: <Sparkles /> },
          { id: "projects", label: "Projects", icon: <Clapperboard />, count: 12 },
          { id: "assets", label: "Assets", icon: <ImageIcon /> },
        ],
      },
    ]}
  />
);

const SUGGESTIONS: HomeShellProps["suggestions"] = [
  { id: "s1", suggestion: "Draft a launch announcement", icon: <Type /> },
  { id: "s2", suggestion: "Turn the Q3 deck into a narrated video", icon: <Clapperboard /> },
  { id: "s3", suggestion: "Clean up the audio on this interview", icon: <Mic /> },
];

const FEATURES: HomeShellProps["features"] = [
  {
    id: "image",
    icon: <ImageIcon />,
    title: "Generate images",
    description: "From a prompt, a sketch or a reference frame.",
  },
  {
    id: "video",
    icon: <Clapperboard />,
    title: "Edit video",
    description: "Cut, caption and export without leaving the browser.",
  },
  {
    id: "voice",
    icon: <Mic />,
    title: "Clone a voice",
    description: "Thirty seconds of clean audio is enough.",
  },
  {
    id: "restyle",
    icon: <WandSparkles />,
    title: "Restyle a project",
    description: "Apply one look across every asset at once.",
  },
];

const RECENTS: HomeShellProps["recents"] = [
  { id: "r1", title: "Northwind brand audit", editedAgo: "Edited 19 hours ago" },
  { id: "r2", title: "Q3 launch film", durationLabel: "12:04", editedAgo: "Edited 2 days ago" },
  { id: "r3", title: "Pricing page hero", editedAgo: "Edited 4 days ago" },
  { id: "r4", title: "Onboarding voiceover", durationLabel: "03:41", editedAgo: "Edited last week" },
];

const RECOMMENDATIONS: HomeShellProps["recommendations"] = [
  {
    id: "digest",
    icon: <Sparkles />,
    title: "Turn new uploads into a Friday digest",
    description: "Watches a folder and writes the week up for you.",
    apps: ["Drive", "Slack"],
    steps: [
      "Watch the Northwind shared folder",
      "Summarise anything that lands in it",
      "Post the summary to #northwind every Friday",
    ],
    onDismiss: () => {},
    onTry: () => {},
  },
  {
    id: "subtitles",
    icon: <Clapperboard />,
    title: "Subtitle every export automatically",
    description: "Adds burned-in captions in the project's language.",
    apps: ["Projects"],
    steps: ["Detect the spoken language", "Generate captions", "Burn them into the export"],
    onDismiss: () => {},
    onTry: () => {},
  },
];

const FULL_ARGS: HomeShellProps = {
  title: "Northwind",
  headline: "Good afternoon",
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  nav: NAV,
  credits: { balance: 420, total: 1000, form: "ring", onManage: () => {} },
  omnibox: {
    models: [
      { value: "fast", label: "Fast" },
      { value: "quality", label: "Quality" },
    ],
    model: "fast",
    cost: 4,
  },
  suggestions: SUGGESTIONS,
  suggestionsOverflow: { href: "#", count: 12 },
  features: FEATURES,
  recents: RECENTS,
  recentsEmptyAction: <Button size="sm">New project</Button>,
  recommendations: RECOMMENDATIONS,
};

const meta: Meta<typeof HomeShell> = {
  title: "Super AI/Home Shell",
  component: HomeShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(HomeShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomeShell>;

/** The loaded launcher: composer, starters, features, recents, inspiration — in that order. */
export const Launcher: Story = { args: FULL_ARGS };

/**
 * Day one, at its emptiest: nothing pinned, no features configured, no recents,
 * nothing recommended — four empty affordances at once, and the version most
 * new users actually see. Three of them are L1; the recents band is C4's own
 * in-grid tile, carrying the caller's verb rather than a generic one. The
 * starters stay, because a starter is product copy rather than user data, and
 * they are the only path out of an empty page. Mandatory export for the block
 * contract, and the story worth checking axe against — every empty affordance
 * in the shell is on screen at once here.
 */
export const Empty: Story = {
  args: {
    title: "Northwind",
    headline: "Let's make something",
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    credits: { balance: 1000, total: 1000, onManage: () => {}, onTopUp: () => {} },
    suggestions: SUGGESTIONS,
    recentsEmptyAction: <Button size="sm">New project</Button>,
  },
};

/** Day one for a configured product: the feature row is populated before anyone has made anything. */
export const FirstRun: Story = {
  args: {
    ...Empty.args,
    features: FEATURES,
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the topbar trigger becomes the only way in and
 * every band takes the full width; C3's carousel and C2's chip row both become
 * horizontal scrollers. Mandatory export for the block contract — a shell is a
 * layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API.
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing while
 * looking configured, so `options` is declared explicitly and the selection
 * cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner has no manager to resize an iframe, so `pnpm test:stories` renders and
 * axe-checks this story at the browser's default width. The narrow layout here
 * was verified by hand.
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

/** Recents as a list rather than a grid — the same C4, one prop apart. */
export const RecentsAsList: Story = {
  args: { ...FULL_ARGS, recentsLayout: "list" },
};

/**
 * The composer mid-run. C1 owns the generating state, its announcement and its
 * stop control; the shell only stops emphasising anything else while it happens.
 */
export const Generating: Story = {
  args: {
    ...FULL_ARGS,
    promptValue: "Turn the Q3 deck into a narrated video",
    omnibox: { ...FULL_ARGS.omnibox, state: "generating", onStop: () => {} },
  },
};

/**
 * Out of credits. M2 goes to its `empty` state in the title bar and C1 goes to
 * `locked` — two components, each announcing the same fact in its own contract,
 * neither of them the shell's business.
 */
export const OutOfCredits: Story = {
  args: {
    ...FULL_ARGS,
    credits: { balance: 0, total: 1000, onManage: () => {} },
    omnibox: { ...FULL_ARGS.omnibox, state: "locked", onUnlock: () => {} },
  },
};
