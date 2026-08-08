import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatShell } from "./chat-shell";

const REGIONS = ["sidebar", "topbar", "message-stream", "artifact-cards", "composer"];

const THREADS = [
  {
    id: "today",
    label: "Today",
    threads: [
      { id: "t1", title: "Brand audit" },
      { id: "t2", title: "Export the deck", running: true },
    ],
  },
];

describe("ChatShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<ChatShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<ChatShell className="test-class" />);
    expect(document.querySelector('[data-slot="chat-shell"]')!.className).toContain("test-class");
  });

  // "The sidebar doubles as a job queue: running tasks show spinners in B6, so
  // background work is visible without leaving the thread." A running job must
  // be readable as text, not as a spinning glyph alone — B6 has no `running`
  // prop, so the shell renders the status beside the row it belongs to.
  it("announces a running background job beside its thread", () => {
    render(<ChatShell threadGroups={THREADS} />);
    // Announced, not just spun: role="status" is what makes a job that starts
    // while you are reading another thread reach a screen reader at all.
    const running = screen.getAllByRole("status").filter((node) => /running/i.test(node.textContent ?? ""));
    // Exactly one — the quiet thread gets no status of any kind.
    expect(running).toHaveLength(1);
    // Addressed by the thread it belongs to, so the queue and the list cannot
    // drift apart.
    expect(running[0].closest("[data-thread-id]")?.getAttribute("data-thread-id")).toBe("t2");
  });

  it("composes B6 thread rows rather than rendering its own", () => {
    render(<ChatShell threadGroups={THREADS} activeThreadId="t1" />);
    const rows = document.querySelectorAll('[data-slot="thread-list-item"]');
    expect(rows).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Brand audit" })).toHaveAttribute("aria-current", "page");
  });

  it("selects a thread through B6's own row control", async () => {
    const onSelectThread = vi.fn();
    render(<ChatShell threadGroups={THREADS} onSelectThread={onSelectThread} />);
    await userEvent.click(screen.getByRole("button", { name: "Brand audit" }));
    expect(onSelectThread).toHaveBeenCalledWith("t1");
  });

  // "Artifacts render as cards inside the stream." The artifact region is a
  // child of the stream, not a sibling of it — the conversation is where
  // artifacts live, and a sibling region would make it a separate page.
  it("nests the artifact region inside the message stream", () => {
    const { container } = render(<ChatShell />);
    const stream = container.querySelector('[data-region="message-stream"]')!;
    expect(stream.querySelector('[data-region="artifact-cards"]')).not.toBeNull();
  });

  it("renders artifacts as J4 cards grouped by session", () => {
    render(
      <ChatShell
        artifacts={[
          {
            id: "s1",
            label: "Brand audit",
            items: [{ id: "a1", excerpt: "Positioning summary", type: "markdown" }],
          },
        ]}
      />,
    );
    expect(document.querySelector('[data-slot="artifact-grid-card"]')).not.toBeNull();
    expect(screen.getByText("Positioning summary")).toBeVisible();
  });

  // "The whole page is the empty state on day one. That is the version most new
  // users actually see." Both the stream and the thread list must be empty-able
  // independently, and both fall to L1.
  it("falls to L1 in both the stream and the thread list on day one", () => {
    const { container } = render(<ChatShell />);
    const stream = container.querySelector('[data-region="message-stream"]')!;
    const sidebar = container.querySelector('[data-region="sidebar"]')!;
    expect(stream.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(sidebar.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  it("drops the stream empty state as soon as there is a turn", () => {
    const { container } = render(
      <ChatShell messages={[{ id: "m1", role: "user", content: "Audit my brand" }]} />,
    );
    const stream = container.querySelector('[data-region="message-stream"]')!;
    expect(stream.querySelector('[data-slot="empty-state"]')).toBeNull();
    expect(screen.getByText("Audit my brand")).toBeVisible();
  });

  // "M5 lives in the stream, which is why monetization cannot be deferred."
  // The paywall is a turn in the conversation, not an interstitial over it.
  it("renders the paywall as the last turn inside the stream", () => {
    const { container } = render(
      <ChatShell
        messages={[{ id: "m1", role: "user", content: "Render the 4K export" }]}
        paywall={{
          state: "quota-exhausted",
          prompt: "Render the 4K export",
          before: "You are out of credits, so I did not start the export.",
        }}
      />,
    );
    const stream = container.querySelector('[data-region="message-stream"]')!;
    const paywall = stream.querySelector('[data-slot="paywall-message"]')!;
    expect(paywall).not.toBeNull();
    const turns = stream.querySelectorAll("[data-message-id], [data-slot='paywall-message']");
    expect(turns[turns.length - 1]).toBe(paywall);
  });

  it("puts D3 chips and D4 modes inside the composer, with N3 under it", () => {
    const { container } = render(
      <ChatShell
        contextChips={[{ id: "c1", kind: "file", label: "brand.pdf" }]}
        modes={[
          { value: "ask", label: "Ask" },
          { value: "build", label: "Build" },
        ]}
        mode="ask"
      />,
    );
    const composer = container.querySelector('[data-region="composer"]')!;
    expect(within(composer as HTMLElement).getByText("brand.pdf")).toBeVisible();
    expect(composer.querySelector('[data-slot="mode-tabs"]')).not.toBeNull();
    expect(composer.querySelector('[data-slot="media-prompt-bar"]')).not.toBeNull();
    expect(composer.querySelector('[data-slot="disclaimer-note"]')).not.toBeNull();
  });

  // The stream scrolls, so it has to be reachable by keyboard on its own
  // (axe `scrollable-region-focusable`) and it has to have a name.
  it("gives the scrolling stream a name and a tab stop", () => {
    const { container } = render(<ChatShell />);
    const stream = container.querySelector('[data-region="message-stream"]')!;
    expect(stream).toHaveAttribute("tabindex", "0");
    expect(stream).toHaveAccessibleName("Conversation");
  });

  it("titles the topbar with the active conversation", () => {
    const { container } = render(<ChatShell title="Brand audit" />);
    const topbar = container.querySelector('[data-region="topbar"]')!;
    expect(within(topbar as HTMLElement).getByText("Brand audit")).toBeVisible();
  });
});
