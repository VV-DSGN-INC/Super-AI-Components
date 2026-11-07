import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DataControls } from "@/registry/super-ai/data-controls";
import {
  MemoryManager,
  MemorySavedChip,
  type MemoryItem,
  type MemoryManagerProps,
} from "@/registry/super-ai/memory-manager";
import { PrivateSessionNotice } from "@/registry/super-ai/private-session-notice";
import { MemoryManagerDocs } from "@/content/components/memory-manager.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

/**
 * Fixtures are memories a real assistant could hold: a writing preference, a
 * job, a team habit, a trip. No invented company, no figures.
 */
const MEMORIES: MemoryItem[] = [
  {
    id: "p1",
    text: "Keep answers short and lead with the conclusion.",
    kind: "preference",
    addedAt: "2026-09-14",
    source: "Chat: Release notes draft",
    scope: "global",
  },
  {
    id: "p2",
    text: "Use British spelling in documents.",
    kind: "preference",
    addedAt: "2026-08-30",
    source: "Added by you",
    scope: "global",
  },
  {
    id: "f1",
    text: "Works as a product designer on a design systems team.",
    kind: "fact",
    addedAt: "2026-09-02",
    source: "Chat: Portfolio review",
    scope: "global",
  },
  {
    id: "f2",
    text: "The team reviews designs on Thursdays.",
    kind: "fact",
    addedAt: "2026-10-01",
    source: "Chat: Sprint planning",
    scope: { workspace: "Work" },
  },
  {
    id: "f3",
    text: "Planning a trip to Lisbon in March.",
    kind: "fact",
    addedAt: "2026-10-03",
    source: "Chat: Trip planning",
    scope: { workspace: "Personal" },
  },
];

const meta: Meta<typeof MemoryManager> = {
  title: "Super AI/Memory Manager",
  component: MemoryManager,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MemoryManagerDocs) } },
};

export default meta;
type Story = StoryObj<typeof MemoryManager>;

/** Holds the list and the switch, which the component leaves to its host. */
function Host(props: Partial<MemoryManagerProps> & { initial?: MemoryItem[] }) {
  const { initial = MEMORIES, enabled: enabledProp = true, onReset, ...rest } = props;
  const [memories, setMemories] = React.useState(initial);
  const [enabled, setEnabled] = React.useState(enabledProp);
  return (
    <MemoryManager
      memories={memories}
      enabled={enabled}
      onEnabledChange={setEnabled}
      onEdit={(id, text) => setMemories((all) => all.map((m) => (m.id === id ? { ...m, text } : m)))}
      onDelete={(id) => setMemories((all) => all.filter((m) => m.id !== id))}
      onReset={() => {
        onReset?.();
        setMemories([]);
      }}
      {...rest}
    />
  );
}

const body = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/**
 * Nothing saved yet. One sentence says how a memory arrives and that it can be
 * edited or deleted, the switch stays, and there is no Reset because there is
 * nothing to reset.
 */
export const Empty: Story = {
  render: () => <Host initial={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nothing remembered yet/)).toBeInTheDocument();
    await expect(canvas.getByRole("switch", { name: "Memory" })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Reset all memories" })).toBeNull();
  },
};

/**
 * Preferences and facts as two labelled groups, each row with its scope, date
 * and source in text. The play deletes one row and checks the others and the
 * count stay consistent.
 */
export const Populated: Story = {
  render: () => <Host />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const groups = canvasElement.querySelectorAll('[data-slot="memory-manager-group"]');
    await expect(groups).toHaveLength(2);
    await expect(within(groups[0] as HTMLElement).getByText("Preferences")).toBeInTheDocument();
    await expect(within(groups[1] as HTMLElement).getByText("Facts")).toBeInTheDocument();
    const metas = canvasElement.querySelectorAll('[data-slot="memory-manager-meta"]');
    await expect(metas).toHaveLength(MEMORIES.length);
    for (const meta of metas) await expect(meta.textContent).toMatch(/Added \w{3} \d{1,2}, 2026/);
    await userEvent.click(canvas.getByRole("button", { name: "Delete Use British spelling in documents." }));
    await expect(canvas.queryByText("Use British spelling in documents.")).toBeNull();
    await expect(canvas.getByText("Keep answers short and lead with the conclusion.")).toBeInTheDocument();
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="memory-manager-title"]')).toHaveFocus(),
    );
  },
};

/**
 * Two memory sets, Work and Personal. The card names the active set, and a
 * memory held for the other workspace says in text that it is not used here.
 */
export const Scoped: Story = {
  render: () => <Host activeWorkspace="Work" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Active memory set: Work/)).toBeInTheDocument();
    await expect(canvas.getAllByText("Not used in Work")).toHaveLength(1);
    await expect(canvas.getByText("Workspace: Personal")).toBeInTheDocument();
  },
};

const onReview = fn();

/**
 * The capture moment. The chip lives in the conversation, so it is drawn above
 * the card the way a host would place it; the card marks the new row. The play
 * clicks Review and reads that the host received the call.
 */
export const JustSaved: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <MemorySavedChip onReview={onReview} />
      <Host justSavedId="f3" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onReview.mockClear();
    await expect(canvas.getByText("Memory updated")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Review Memory updated" }));
    await expect(onReview).toHaveBeenCalledTimes(1);
    await expect(canvas.getAllByText("Just added")).toHaveLength(1);
  },
};

/**
 * One row in the editor: a labelled field, Save and Cancel. The play edits,
 * saves and reads the new text back, then confirms focus returned to that
 * row's Edit button rather than the top of the document.
 */
export const Editing: Story = {
  render: () => <Host defaultEditingId="p2" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Edit memory" });
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.clear(field);
    await userEvent.type(field, "Use American spelling in documents.");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByText("Use American spelling in documents.")).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Edit Use American spelling in documents." })).toHaveFocus(),
    );
  },
};

/**
 * Memory off. The sentence beside the switch says what stops and what stays,
 * private sessions are named in copy, and the saved list remains visible so
 * the person can still delete from it.
 */
export const MemoryOff: Story = {
  render: () => <Host enabled={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch", { name: "Memory" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByText(/nothing new is saved/)).toBeInTheDocument();
    await expect(canvas.getByText(/Private sessions never save memories/)).toBeInTheDocument();
    await expect(canvas.getAllByRole("button", { name: /^Delete / })).toHaveLength(MEMORIES.length);
  },
};

const onReset = fn();

/**
 * Reset all, confirm step open. The copy names what goes (every saved memory,
 * in every workspace) and what stays (the account and the chats). The play
 * cancels first and checks nothing was deleted, then confirms and checks the
 * list is empty.
 */
export const ResetConfirm: Story = {
  render: () => <Host defaultResetOpen onReset={onReset} />,
  play: async ({ canvasElement }) => {
    const dialog = await body(canvasElement).findByRole("alertdialog");
    onReset.mockClear();
    await expect(dialog).toHaveTextContent("Your account and your chats are kept");
    await userEvent.click(within(dialog).getByRole("button", { name: "Keep memories" }));
    await waitFor(() => expect(body(canvasElement).queryByRole("alertdialog")).toBeNull());
    await expect(onReset).not.toHaveBeenCalled();
    const reset = within(canvasElement).getByRole("button", { name: "Reset all memories" });
    await userEvent.click(reset);
    await userEvent.click(
      within(await body(canvasElement).findByRole("alertdialog")).getByRole("button", {
        name: "Keep memories",
      }),
    );
    await waitFor(() => expect(body(canvasElement).queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(reset).toHaveFocus());
    await userEvent.click(reset);
    await userEvent.click(await body(canvasElement).findByRole("button", { name: "Delete all memories" }));
    await expect(onReset).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body(canvasElement).queryByRole("alertdialog")).toBeNull());
    await expect(within(canvasElement).getByText(/Nothing remembered yet/)).toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — memory-manager.tsx carries no animate-* or transition-* class (grep returns nothing); the only motion is the vendored Switch thumb and the alert-dialog popup, whose motion-reduce pair is restated inside ui/alert-dialog.tsx
 * // case-skip: EmptyLabel — the text each control is named from (the memory sentence, the switch label, the dialog title) is required; the only optional text is `source` and `description`, and an absent one omits its segment without leaving an unnamed control
 */

/**
 * `enabled` is the host's. The host here records the request and applies it
 * only when told to: clicking the switch does not move it, the callback fires
 * with the value the host needs, a re-render with the same value holds it, and
 * applying the request moves it.
 */
const spyEnabled = fn();
export const Controlled: Story = {
  render: () => {
    function Held() {
      const [enabled, setEnabled] = React.useState(true);
      const [tick, setTick] = React.useState(0);
      return (
        <div className="flex flex-col gap-3">
          <MemoryManager memories={MEMORIES} enabled={enabled} onEnabledChange={spyEnabled} />
          <button type="button" data-testid="rerender" onClick={() => setTick((n) => n + 1)}>
            Re-render {tick}
          </button>
          <button type="button" data-testid="apply" onClick={() => setEnabled(false)}>
            Apply
          </button>
        </div>
      );
    }
    return <Held />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    spyEnabled.mockClear();
    const sw = canvas.getByRole("switch", { name: "Memory" });
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(spyEnabled).toHaveBeenCalledWith(false);
    await userEvent.click(canvas.getByTestId("rerender"));
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await userEvent.click(canvas.getByTestId("apply"));
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
    await expect(canvas.getByText(/nothing new is saved/)).toBeInTheDocument();
  },
};

/**
 * Tab order: the switch, then Edit and Delete for each row top to bottom,
 * then Reset all memories. Every stop paints a settled focus ring. The walk
 * asserts the sequence directly rather than counting tabs inside a budget.
 */
export const KeyboardOrder: Story = {
  render: () => <Host initial={MEMORIES.slice(0, 2)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("switch", { name: "Memory" }),
      canvas.getByRole("button", { name: "Edit Keep answers short and lead with the conclusion." }),
      canvas.getByRole("button", { name: "Delete Keep answers short and lead with the conclusion." }),
      canvas.getByRole("button", { name: "Edit Use British spelling in documents." }),
      canvas.getByRole("button", { name: "Delete Use British spelling in documents." }),
      canvas.getByRole("button", { name: "Reset all memories" }),
    ];
    await userEvent.tab();
    for (const stop of stops) {
      await waitFor(() => expect(document.activeElement).toBe(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      if (stop !== stops[stops.length - 1]) await userEvent.tab();
    }
  },
};

/**
 * About 90 characters of memory text and a long source. Both wrap; nothing
 * truncates, because the sentence is the thing the person is judging. The
 * buttons keep their place beside it.
 */
export const LongContent: Story = {
  render: () => (
    <Host
      initial={[
        {
          id: "long",
          text: "Prefers a plain, direct tone in emails to external partners, with the request in the first line.",
          kind: "preference",
          addedAt: "2026-09-20",
          source: "Chat: Rewriting the partner onboarding email after the second review round",
          scope: { workspace: "Work" },
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const text = canvasElement.querySelector<HTMLElement>('[data-slot="memory-manager-text"]')!;
    await expect(getComputedStyle(text).whiteSpace).toBe("normal");
    await expect(`text wraps=${text.getBoundingClientRect().height > 24}`).toBe("text wraps=true");
    const meta = canvasElement.querySelector<HTMLElement>('[data-slot="memory-manager-meta"]')!;
    await expect(getComputedStyle(meta).flexWrap).toBe("wrap");
    const edit = within(canvasElement).getByRole("button", { name: /^Edit / });
    await expect(edit.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.querySelector<HTMLElement>('[data-slot="memory-manager"]')!.getBoundingClientRect().right,
    );
  },
};

/**
 * 375px. The wrapper constrains width, not the breakpoint, and nothing here
 * keys on a breakpoint. The row, its two buttons and the meta line must fit
 * without sideways scroll.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <Host activeWorkspace="Work" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
    for (const item of canvasElement.querySelectorAll('[data-slot="memory-manager-item"]')) {
      await expect(`item overflows=${item.scrollWidth > item.clientWidth}`).toBe("item overflows=false");
    }
  },
};

/**
 * Under dir="rtl" the row mirrors: the memory text starts at the right edge
 * and its Edit button sits to the left of it. The meta line uses logical
 * padding, so the same holds there.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" data-testid="rtl" className="w-[480px] max-w-full">
      <Host initial={MEMORIES.slice(0, 2)} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const text = canvasElement.querySelector<HTMLElement>('[data-slot="memory-manager-text"]')!;
    const edit = within(canvasElement).getAllByRole("button", { name: /^Edit / })[0];
    await expect(getComputedStyle(text).direction).toBe("rtl");
    await expect(
      `edit is left of text=${edit.getBoundingClientRect().left < text.getBoundingClientRect().left}`,
    ).toBe("edit is left of text=true");
  },
};

/**
 * Three neighbours, one question each: what is being decided?
 *
 * - **Memory manager**: what the assistant recalls about me, editable per item.
 * - **Data controls**: whether my conversations train models, and how long
 *   they are kept. Not memory.
 * - **Private session notice**: this one session remembers nothing. The
 *   manager names it in a sentence and never renders it.
 *
 * Settings dialog hosts this card as a section and asset library holds a
 * person's files; neither is drawn here.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Memory manager: what the assistant recalls</p>
        <Host initial={MEMORIES.slice(0, 2)} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Data controls: training and retention</p>
        <DataControls
          training={{
            label: "Improve the model for everyone",
            description:
              "Your chats help train future models, which improves answers for everyone. You share what you write; you get better results over time.",
            effect: "Right now your chats are not used to train models.",
            learnMoreHref: "#training",
            checked: false,
          }}
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Private session notice: this session remembers nothing
        </p>
        <PrivateSessionNotice
          state="entering"
          form="banner"
          statement="This chat will not be saved to history or memory, and will not be used to train models."
        />
      </section>
    </div>
  ),
};
