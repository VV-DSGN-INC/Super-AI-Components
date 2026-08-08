import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChatShell, type ChatShellProps } from "@/registry/super-ai/chat-shell";
import { ChatShellDocs } from "@/content/components/chat-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const THREAD_GROUPS = [
  {
    id: "today",
    label: "Today",
    threads: [
      { id: "brand-audit", title: "Brand audit for Northwind" },
      {
        id: "deck-export",
        title: "Export the Q3 deck",
        running: true,
        runningLabel: "Rendering slides",
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    threads: [
      { id: "onboarding", title: "Onboarding email rewrite", pinned: true },
      { id: "pricing", title: "Pricing page copy", unread: true },
    ],
  },
];

const MESSAGES: ChatShellProps["messages"] = [
  {
    id: "m1",
    role: "user",
    content: "Audit Northwind's brand voice against the three competitors in the deck.",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "I read all four voice guides and pulled the overlap. Northwind is the only one that leads with reassurance rather than speed — that is the position worth defending. The summary is written up as an artifact below.",
    feedback: { state: "idle", onRate: () => {}, onSubmit: () => {} },
  },
];

const ARTIFACTS: ChatShellProps["artifacts"] = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private",
      },
      {
        id: "a2",
        excerpt: "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
        type: "code",
        editedAgo: "Edited 9 minutes ago",
        viewCount: 3,
        visibility: "shared",
      },
    ],
  },
];

const FULL_ARGS: ChatShellProps = {
  title: "Brand audit for Northwind",
  topbar: { privacy: { label: "Private" }, savedLabel: "Saved just now" },
  switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
  threadGroups: THREAD_GROUPS,
  activeThreadId: "brand-audit",
  onSelectThread: () => {},
  messages: MESSAGES,
  artifacts: ARTIFACTS,
  contextChips: [{ id: "c1", kind: "file", label: "brand-guide.pdf", onRemove: () => {} }],
  modes: [
    { value: "ask", label: "Ask" },
    { value: "build", label: "Build" },
  ],
  mode: "ask",
};

const meta: Meta<typeof ChatShell> = {
  title: "Super AI/Chat Shell",
  component: ChatShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(ChatShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatShell>;

/** The working shell: history, a running job, a turn, its artifacts, a loaded composer. */
export const Conversation: Story = { args: FULL_ARGS };

/**
 * Day one. No threads, no turns, nothing produced — three empty affordances at
 * once, which is the version most new users actually see. Mandatory export for
 * the block contract.
 */
export const Empty: Story = {
  args: {
    switcher: <div className="px-2 text-sm font-medium">Northwind</div>,
    modes: [
      { value: "ask", label: "Ask" },
      { value: "build", label: "Build" },
    ],
    mode: "ask",
  },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, so the topbar trigger becomes the only way in and
 * the stream, artifacts and composer take the full width. Mandatory export for
 * the block contract — a shell is a layout, and layout is what breaks.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

/** The sidebar as a job queue: two background runs visible from another thread. */
export const JobQueue: Story = {
  args: {
    ...FULL_ARGS,
    activeThreadId: "brand-audit",
    threadGroups: [
      {
        id: "today",
        label: "Today",
        threads: [
          { id: "brand-audit", title: "Brand audit for Northwind" },
          {
            id: "deck-export",
            title: "Export the Q3 deck",
            running: true,
            runningLabel: "Rendering slides",
          },
          {
            id: "transcripts",
            title: "Transcribe the customer calls",
            running: true,
            runningLabel: "Transcribing 12 of 40",
          },
        ],
      },
    ],
  },
};

/** M5 as the final turn: the run that did not happen, held open inside the stream. */
export const Paywalled: Story = {
  args: {
    ...FULL_ARGS,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Render the whole audit as a narrated 4K walkthrough.",
      },
    ],
    artifacts: [],
    paywall: {
      state: "quota-exhausted",
      prompt: "Render the whole audit as a narrated 4K walkthrough",
      model: "Veo 3.1",
      before: "You are out of credits for this billing period, so I stopped before spending anything.",
      after: "Everything up to the render is done — the audit itself is finished and saved.",
      onUpgrade: () => {},
    },
  },
};
