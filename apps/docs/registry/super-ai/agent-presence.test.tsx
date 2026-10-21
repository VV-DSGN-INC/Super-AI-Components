import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AgentPresence,
  AgentPresenceRegion,
  type AgentPresenceProps,
  type AgentPresenceState,
} from "./agent-presence";

const SCOPE = "Can see and use this tab";

const view = (props: Partial<AgentPresenceProps> = {}) =>
  render(<AgentPresence state="acting" scope={SCOPE} {...props} />);

const status = () => document.querySelector('[data-slot="agent-presence-status"]')!;
const root = () => document.querySelector('[data-slot="agent-presence"]')!;

describe("AgentPresence", () => {
  it("renders the idle state", () => {
    view({ state: "idle", onPause: () => {}, onTakeOver: () => {} });
    expect(root()).toHaveAttribute("data-state", "idle");
    expect(status()).toHaveTextContent("Agent is idle");
    // Nothing is running, so there is nothing to pause or take over.
    expect(screen.queryByRole("button", { name: "Agent controls" })).toBeNull();
  });

  it("renders the watching state", () => {
    view({ state: "watching" });
    expect(root()).toHaveAttribute("data-state", "watching");
    expect(status()).toHaveTextContent("Agent is watching");
  });

  it("renders the acting state with the agent's name", () => {
    view({ state: "acting", agentName: "Comet" });
    expect(status()).toHaveTextContent("Comet is acting");
  });

  it("renders needs-you and names the approval in copy only", () => {
    view({ state: "needs-you", need: "Approve sending the draft", onPause: () => {} });
    expect(status()).toHaveTextContent("Agent needs you");
    expect(status()).toHaveTextContent("Approve sending the draft");
    // The approval itself is permission-prompt's: no Approve or Deny control here.
    expect(screen.queryByRole("button", { name: /approve|deny|allow/i })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the paused state", () => {
    view({ state: "paused" });
    expect(status()).toHaveTextContent("Agent is paused");
  });

  it("renders taken-over as control being back with the person", () => {
    view({ state: "taken-over", onTakeOver: () => {}, onPause: () => {} });
    expect(status()).toHaveTextContent("Control is back with you");
    expect(screen.queryByRole("button", { name: "Agent controls" })).toBeNull();
  });

  it("always shows the scope as text", () => {
    for (const state of ["idle", "watching", "acting", "needs-you", "paused", "taken-over"] as const) {
      const { unmount } = view({ state });
      expect(document.querySelector('[data-slot="agent-presence-scope"]')).toHaveTextContent(SCOPE);
      unmount();
    }
  });

  it("keeps one persistent polite status element across state changes", () => {
    const { rerender } = view({ state: "watching" });
    const before = status();
    expect(before).toHaveAttribute("role", "status");
    rerender(<AgentPresence state="needs-you" scope={SCOPE} need="Approve the purchase" />);
    expect(status()).toBe(before);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(status()).toHaveTextContent("Agent needs you");
  });

  it("offers Pause while the agent runs and Resume while paused, never both", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const { rerender } = view({ state: "acting", onPause, onResume });
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    expect(await screen.findByRole("menuitem", { name: "Pause agent" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Resume agent" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Pause agent" }));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();

    rerender(<AgentPresence state="paused" scope={SCOPE} onPause={onPause} onResume={onResume} />);
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    expect(await screen.findByRole("menuitem", { name: "Resume agent" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Pause agent" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Resume agent" }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("takes over in one menu action and leaves the state to the host", async () => {
    const user = userEvent.setup();
    const onTakeOver = vi.fn();
    view({ state: "acting", onTakeOver });
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    await user.click(await screen.findByRole("menuitem", { name: "Take over" }));
    expect(onTakeOver).toHaveBeenCalledTimes(1);
    expect(root()).toHaveAttribute("data-state", "acting");
  });

  it("lists Pause and Take over in the same menu", async () => {
    const user = userEvent.setup();
    view({ state: "watching", onPause: () => {}, onTakeOver: () => {} });
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    const names = (await screen.findAllByRole("menuitem")).map((el) => el.textContent);
    expect(names).toEqual(["Pause agent", "Take over"]);
  });

  it("offers the steps link only when the host wires it", async () => {
    const user = userEvent.setup();
    const onOpenSteps = vi.fn();
    const { unmount } = view({ state: "acting", onPause: () => {} });
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    expect(await screen.findByRole("menuitem", { name: "Pause agent" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "View agent steps" })).toBeNull();
    unmount();

    view({ state: "acting", onPause: () => {}, onOpenSteps });
    await user.click(screen.getByRole("button", { name: "Agent controls" }));
    await user.click(await screen.findByRole("menuitem", { name: "View agent steps" }));
    expect(onOpenSteps).toHaveBeenCalledTimes(1);
  });

  it("opens no modal for any state", () => {
    for (const state of ["idle", "watching", "acting", "needs-you", "paused", "taken-over"] as const) {
      const { unmount } = view({ state, need: "Approve the purchase", onPause: () => {} });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.queryByRole("alertdialog")).toBeNull();
      unmount();
    }
  });

  it("never claims that watching keeps anyone safe", () => {
    const states: AgentPresenceState[] = ["idle", "watching", "acting", "needs-you", "paused", "taken-over"];
    for (const state of states) {
      const { unmount } = view({ state, need: "Approve the purchase" });
      expect(root().textContent).not.toMatch(/\b(safe|secure|protected|prevent|guard)/i);
      unmount();
    }
  });

  it("drops the dot pulse under reduced motion but keeps the dot", () => {
    view({ state: "needs-you" });
    const dot = document.querySelector('[data-slot="agent-presence-dot"]')!;
    expect(dot.className).toContain("animate-pulse");
    expect(dot.className).toContain("motion-reduce:animate-none");
  });

  it("passes className through", () => {
    view({ className: "test-class" });
    expect(root().className).toContain("test-class");
  });
});

describe("AgentPresenceRegion", () => {
  it("carries data-state and wraps its children", () => {
    render(
      <AgentPresenceRegion state="acting" className="region-class">
        <p>Tab content</p>
      </AgentPresenceRegion>,
    );
    const region = document.querySelector('[data-slot="agent-presence-region"]')!;
    expect(region).toHaveAttribute("data-state", "acting");
    expect(region.className).toContain("region-class");
    expect(screen.getByText("Tab content")).toBeInTheDocument();
  });

  it("outlines with a line style that differs by state, so colour is not the only cue", () => {
    const style = (state: AgentPresenceState) => {
      const { unmount } = render(<AgentPresenceRegion state={state}>x</AgentPresenceRegion>);
      const cls = document.querySelector('[data-slot="agent-presence-outline"]')!.className;
      unmount();
      return ["outline-dashed", "outline-dotted", "outline-solid"].find((s) => cls.includes(s));
    };
    expect(style("watching")).toBe("outline-dashed");
    expect(style("acting")).toBe("outline-solid");
    expect(style("paused")).toBe("outline-dotted");
  });

  it("draws no outline when idle or taken over", () => {
    for (const state of ["idle", "taken-over"] as const) {
      const { unmount } = render(<AgentPresenceRegion state={state}>x</AgentPresenceRegion>);
      expect(document.querySelector('[data-slot="agent-presence-outline"]')!.className).toContain(
        "outline-transparent",
      );
      unmount();
    }
  });

  it("keeps the outline overlay out of the accessibility tree and out of the pointer path", () => {
    render(<AgentPresenceRegion state="needs-you">x</AgentPresenceRegion>);
    const outline = document.querySelector('[data-slot="agent-presence-outline"]')!;
    expect(outline).toHaveAttribute("aria-hidden", "true");
    expect(outline.className).toContain("pointer-events-none");
  });

  it("pulses the needs-you outline with a reduced-motion form that keeps the outline", () => {
    render(<AgentPresenceRegion state="needs-you">x</AgentPresenceRegion>);
    const cls = document.querySelector('[data-slot="agent-presence-outline"]')!.className;
    expect(cls).toContain("animate-pulse");
    expect(cls).toContain("motion-reduce:animate-none");
    expect(cls).toContain("outline-solid");
  });
});
