import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import {
  AgentPresence,
  AgentPresenceRegion,
  type AgentPresenceProps,
  type AgentPresenceState,
} from "@/registry/super-ai/agent-presence";
import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { TaskTray } from "@/registry/super-ai/task-tray";
import { AgentPresenceDocs } from "@/content/components/agent-presence.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const SCOPE = "Can see and use this tab";

const meta: Meta<typeof AgentPresence> = {
  title: "Super AI/Agent Presence",
  component: AgentPresence,
  args: { scope: SCOPE },
  parameters: { layout: "centered", docs: { page: componentDocsPage(AgentPresenceDocs) } },
};

export default meta;
type Story = StoryObj<typeof AgentPresence>;

const body = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** The chip inside the region it controls, the way a host would place it. */
function Placed(props: AgentPresenceProps) {
  return (
    <AgentPresenceRegion state={props.state} className="flex w-96 max-w-full flex-col gap-3 rounded-lg p-4">
      <AgentPresence {...props} />
      <p className="text-sm text-foreground">Flight search results</p>
    </AgentPresenceRegion>
  );
}

const state = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-slot="agent-presence"]') as HTMLElement;
const status = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-slot="agent-presence-status"]') as HTMLElement;

/**
 * Nothing is running. The chip still states the scope, and offers no menu
 * because there is nothing to pause or take over. The region draws no outline.
 */
export const Idle: Story = {
  args: { state: "idle" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(state(canvasElement)).toHaveAttribute("data-state", "idle");
    await expect(status(canvasElement)).toHaveTextContent("Agent is idle");
    await expect(within(canvasElement).getByText(SCOPE)).toBeInTheDocument();
    await expect(within(canvasElement).queryByRole("button", { name: "Agent controls" })).toBeNull();
  },
};

/** The agent is looking at the page and not acting. Dashed outline, no pulse. */
export const Watching: Story = {
  args: { state: "watching" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent("Agent is watching");
    const outline = canvasElement.querySelector('[data-slot="agent-presence-outline"]')!;
    await expect(getComputedStyle(outline).outlineStyle).toBe("dashed");
  },
};

/** The agent is acting. Solid outline, and the dot pulses. */
export const Acting: Story = {
  args: { state: "acting", agentName: "Comet" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent("Comet is acting");
    const outline = canvasElement.querySelector('[data-slot="agent-presence-outline"]')!;
    await expect(getComputedStyle(outline).outlineStyle).toBe("solid");
  },
};

/**
 * The agent is blocked. The chip names the approval in text and the page stays
 * usable: no dialog opens, and nothing here approves anything.
 */
export const NeedsYou: Story = {
  args: { state: "needs-you", need: "Approve sending the draft" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent("Agent needs you");
    await expect(status(canvasElement)).toHaveTextContent("Approve sending the draft");
    await expect(body(canvasElement).queryByRole("dialog")).toBeNull();
    await expect(body(canvasElement).queryByRole("alertdialog")).toBeNull();
  },
};

/** The agent is waiting. Dotted outline, and Resume replaces Pause in the menu. */
export const Paused: Story = {
  args: { state: "paused" },
  render: (args) => <Placed {...args} onPause={() => {}} onResume={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent("Agent is paused");
    const outline = canvasElement.querySelector('[data-slot="agent-presence-outline"]')!;
    await expect(getComputedStyle(outline).outlineStyle).toBe("dotted");
  },
};

/** Control is back with the person. No outline, and the agent's menu is gone. */
export const TakenOver: Story = {
  args: { state: "taken-over" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(status(canvasElement)).toHaveTextContent("Control is back with you");
    await expect(within(canvasElement).queryByRole("button", { name: "Agent controls" })).toBeNull();
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: EmptyLabel — every text the component owns is required or has a default (`state`, `scope`, `agentName`); `need` only adds a segment in needs-you, and the menu button is named by a fixed aria-label
 */

/**
 * `state` is the host's. The host here records the Pause request and applies
 * it only when told to: choosing Pause does not move the chip, the callback
 * fires, a re-render with the same state holds it, and applying the request
 * changes the announced sentence.
 */
const spyPause = fn();
export const Controlled: Story = {
  args: { state: "acting" },
  render: () => {
    function Held() {
      const [current, setCurrent] = React.useState<AgentPresenceState>("acting");
      const [tick, setTick] = React.useState(0);
      return (
        <div className="flex flex-col items-start gap-3">
          <AgentPresence state={current} scope={SCOPE} onPause={spyPause} />
          <button type="button" data-testid="rerender" onClick={() => setTick((n) => n + 1)}>
            Re-render {tick}
          </button>
          <button type="button" data-testid="apply" onClick={() => setCurrent("paused")}>
            Apply
          </button>
        </div>
      );
    }
    return <Held />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    spyPause.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Agent controls" }));
    await userEvent.click(await body(canvasElement).findByRole("menuitem", { name: "Pause agent" }));
    await waitFor(() => expect(body(canvasElement).queryByRole("menu")).toBeNull());
    await expect(spyPause).toHaveBeenCalledTimes(1);
    await expect(state(canvasElement)).toHaveAttribute("data-state", "acting");
    await userEvent.click(canvas.getByTestId("rerender"));
    await expect(state(canvasElement)).toHaveAttribute("data-state", "acting");
    await userEvent.click(canvas.getByTestId("apply"));
    await waitFor(() => expect(status(canvasElement)).toHaveTextContent("Agent is paused"));
  },
};

/**
 * The chip adds one tab stop, the Agent controls button, with a settled focus
 * ring. Enter opens the menu, arrows walk Pause agent, Take over and View
 * agent steps in order, and Escape closes it and returns focus to the button.
 * The region adds no stops.
 */
export const KeyboardOrder: Story = {
  args: { state: "acting" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} onOpenSteps={() => {}} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Agent controls" });
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(button));
    await expect(button.matches(":focus-visible")).toBe(true);
    await settledFocusRing(button, waitFor);

    await userEvent.keyboard("{Enter}");
    const menu = await body(canvasElement).findByRole("menu");
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    const names: string[] = [];
    let previous: Element | null = null;
    for (let i = 0; i < 3; i += 1) {
      if (i > 0) {
        await userEvent.keyboard("{ArrowDown}");
        const departed = previous;
        await waitFor(() => expect(document.activeElement).not.toBe(departed));
      }
      await waitFor(() => expect(document.activeElement?.getAttribute("role")).toBe("menuitem"));
      previous = document.activeElement;
      names.push(previous!.textContent ?? "");
    }
    await expect(names).toEqual(["Pause agent", "Take over", "View agent steps"]);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body(canvasElement).queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(button));
  },
};

/**
 * needs-you is the state with the most motion: the dot and the region outline
 * both pulse. The play reads the class that provides the reduced form and
 * then the computed `animation-name` back, because the test run emulates
 * `prefers-reduced-motion: reduce`. The pulse stops and the cue stays: the
 * outline is still solid and still drawn. The menu popup carries the paired
 * `motion-reduce:data-open` and `data-closed` variants, which the play reads
 * back while the menu is open.
 */
export const ReducedMotion: Story = {
  args: { state: "needs-you", need: "Approve sending the draft" },
  render: (args) => <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />,
  play: async ({ canvasElement }) => {
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    const dot = canvasElement.querySelector('[data-slot="agent-presence-dot"]')!;
    const outline = canvasElement.querySelector('[data-slot="agent-presence-outline"]')!;
    for (const el of [dot, outline]) {
      await expect(el.className).toContain("animate-pulse");
      await expect(el.className).toContain("motion-reduce:animate-none");
      await expect(getComputedStyle(el).animationName).toBe("none");
    }
    await expect(getComputedStyle(outline).outlineStyle).toBe("solid");
    await expect(getComputedStyle(outline).outlineWidth).toBe("2px");

    await userEvent.click(within(canvasElement).getByRole("button", { name: "Agent controls" }));
    const popup = await body(canvasElement).findByRole("menu");
    await expect(getComputedStyle(popup).animationName).toBe("none");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body(canvasElement).queryByRole("menu")).toBeNull());
  },
};

/**
 * A 90-character scope and a long approval name. Both wrap onto further lines
 * inside the chip rather than truncating, because the scope is the boundary
 * and has to be read whole. The menu button stays inside the chip.
 */
export const LongContent: Story = {
  args: {
    state: "needs-you",
    scope: "Can see and use every tab in this window, including pages that need you to be signed in",
    need: "Approve sending the draft reply to the whole team thread",
  },
  render: (args) => (
    <div data-testid="frame" className="w-96 max-w-full">
      <AgentPresence {...args} onPause={() => {}} onTakeOver={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    const root = state(canvasElement);
    const scope = canvasElement.querySelector<HTMLElement>('[data-slot="agent-presence-scope"]')!;
    await expect(`scope wraps=${scope.getBoundingClientRect().height > 24}`).toBe("scope wraps=true");
    await expect(getComputedStyle(scope).textOverflow).not.toBe("ellipsis");
    await expect(`chip overflows=${root.scrollWidth > root.clientWidth}`).toBe("chip overflows=false");
    await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(frame.getBoundingClientRect().right);
    const button = canvas.getByRole("button", { name: "Agent controls" });
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
      root.getBoundingClientRect().right,
    );
  },
};

/**
 * 375px. The wrapper constrains width, not the breakpoint, and nothing here
 * keys on a breakpoint. The chip wraps its scope and approval text and the
 * frame must not scroll sideways.
 */
export const Mobile: Story = {
  args: { state: "needs-you", need: "Approve sending the draft" },
  render: (args) => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <Placed {...args} onPause={() => {}} onTakeOver={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
  },
};

/**
 * Under dir="rtl" the chip mirrors: the state starts at the right edge and the
 * menu button sits to the left of the scope text. The padding is logical, so
 * the extra start padding follows.
 */
export const RTL: Story = {
  args: { state: "acting" },
  render: (args) => (
    <div dir="rtl" data-testid="rtl" className="w-96 max-w-full">
      <AgentPresence {...args} onPause={() => {}} onTakeOver={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvasElement.querySelector<HTMLElement>('[data-slot="agent-presence-badge"]')!;
    const button = canvas.getByRole("button", { name: "Agent controls" });
    await expect(getComputedStyle(state(canvasElement)).direction).toBe("rtl");
    await expect(
      `menu is left of status=${button.getBoundingClientRect().left < badge.getBoundingClientRect().left}`,
    ).toBe("menu is left of status=true");
  },
};

/**
 * Four neighbours, one question each: what is the person deciding?
 *
 * - **Agent presence**: is the agent here, and what can it reach? An ambient cue.
 * - **Permission prompt**: may the agent do this one thing? The approval itself.
 * - **Task tray**: where did the work I started go? Work that outlives the view.
 *
 * Trace timeline (the agent's steps) and autonomy selector (how much it may
 * do unasked) are reached through `onOpenSteps` and settings, so they are not
 * drawn here. In needs-you the chip names the approval and the prompt makes
 * the decision; the two are never one component.
 */
export const Boundary: Story = {
  args: { state: "needs-you", need: "Approve sending the draft" },
  render: (args) => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Agent presence: ambient, names the approval</p>
        <AgentPresence {...args} onTakeOver={() => {}} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Permission prompt: the approval itself</p>
        <PermissionPrompt
          action="Send the draft reply"
          trigger={<Button variant="outline">Review approval</Button>}
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Task tray: work that outlives the view</p>
        <TaskTray
          tasks={[{ id: "draft", title: "Draft reply", status: "needs-input" }]}
          trigger={<Button variant="outline">Open task tray</Button>}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(body(canvasElement).queryByRole("dialog")).toBeNull();
    await expect(body(canvasElement).queryByRole("alertdialog")).toBeNull();
    await expect(within(canvasElement).getByRole("button", { name: "Review approval" })).toBeInTheDocument();
  },
};
