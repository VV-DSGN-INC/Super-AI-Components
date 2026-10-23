import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectAccessibleName } from "@/lib/test-utils";
import { Widget, WidgetAction, type WidgetSize } from "./widget";

const root = () => document.querySelector<HTMLElement>('[data-slot="widget"]')!;
const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("Widget sizes", () => {
  it.each<WidgetSize>(["small", "medium", "large"])("renders the %s state", (size) => {
    render(
      <Widget size={size} title="Credits left" meta="Resets Nov 1">
        360 of 2,000
      </Widget>,
    );
    expect(root().getAttribute("data-size")).toBe(size);
    expect(screen.getByRole("group", { name: "Credits left" })).toBe(root());
    expect(slot("widget-title")!.textContent).toBe("Credits left");
    expect(slot("widget-meta")!.textContent).toBe("Resets Nov 1");
    expect(slot("widget-content")!.textContent).toBe("360 of 2,000");
  });

  it("is sized by its grid item: full height, no width or breakpoint class", () => {
    render(
      <Widget size="medium" title="Failed overnight">
        3 of 26
      </Widget>,
    );
    const cls = root().className;
    expect(cls).toContain("h-full");
    expect(cls).toContain("min-h-0");
    expect(cls).not.toMatch(/(^|\s)(w-|min-w-|max-w-|sm:|md:|lg:|xl:|@)/);
  });

  it("truncates the title and clips, never scrolls, the body", () => {
    render(
      <Widget size="small" title="x">
        body
      </Widget>,
    );
    expect(slot("widget-title")!.className).toContain("truncate");
    expect(slot("widget-content")!.className).toContain("overflow-hidden");
    expect(slot("widget-content")!.className).not.toMatch(/overflow-(auto|scroll|y-)/);
  });
});

describe("Widget loading", () => {
  it("swaps only the body for a skeleton and keeps the header", () => {
    render(
      <Widget size="large" title="Running now" meta="3 runs" loading>
        <p>Podcast intro, music bed</p>
      </Widget>,
    );
    expect(slot("widget-skeleton")).not.toBeNull();
    expect(slot("widget-skeleton")!.getAttribute("data-size")).toBe("large");
    expect(screen.queryByText("Podcast intro, music bed")).toBeNull();
    expect(slot("widget-title")!.textContent).toBe("Running now");
    expect(slot("widget-meta")!.textContent).toBe("3 runs");
    expect(root().getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Loading Running now");
  });

  it("does not set aria-busy when loaded", () => {
    render(
      <Widget size="small" title="Credits left">
        360
      </Widget>,
    );
    expect(root().hasAttribute("aria-busy")).toBe(false);
  });
});

describe("Widget openable", () => {
  const openLabel = "Credits left, 360 of 2,000. Ask how much was spent this week";

  it("is one native button named by openLabel, first in the tab order", async () => {
    const onOpen = vi.fn();
    render(
      <Widget size="small" title="Credits left" onOpen={onOpen} openLabel={openLabel}>
        360
      </Widget>,
    );
    const open = screen.getByRole("button");
    expect(open.tagName).toBe("BUTTON");
    expect(open.getAttribute("data-slot")).toBe("widget-open");
    expectAccessibleName(open, openLabel);
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await userEvent.tab();
    expect(document.activeElement).toBe(open);
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledTimes(1);
    await userEvent.click(open);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("hides the header and body from assistive tech so the open label is the only text", () => {
    render(
      <Widget size="small" title="Credits left" onOpen={() => {}} openLabel={openLabel}>
        360
      </Widget>,
    );
    expect(slot("widget-header")!.getAttribute("aria-hidden")).toBe("true");
    expect(slot("widget-content")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws its focus ring on the overlay, inset, and changes only the ring on hover", () => {
    render(
      <Widget size="small" title="Credits left" onOpen={() => {}} openLabel={openLabel}>
        360
      </Widget>,
    );
    const cls = slot("widget-open")!.className;
    expect(cls).toContain("focus-visible:ring-inset");
    expect(cls).toContain("absolute");
    expect(cls).toContain("inset-0");
    const hover = cls.split(/\s+/).filter((c) => c.startsWith("hover:"));
    expect(hover.length).toBeGreaterThan(0);
    for (const c of hover) expect(c).toMatch(/^hover:ring-/);
  });

  it("has no open overlay without onOpen", () => {
    render(
      <Widget size="small" title="Credits left">
        360
      </Widget>,
    );
    expect(slot("widget-open")).toBeNull();
    expect(slot("widget-header")!.hasAttribute("aria-hidden")).toBe(false);
  });

  it("rejects onOpen together with action at the type level", () => {
    // Compile-time assertions: typecheck fails if the unions stop excluding each other.
    const a = (
      // @ts-expect-error action is `never` when onOpen is given
      <Widget size="small" title="t" onOpen={() => {}} openLabel="x" action={<span />} />
    );
    const b = (
      // @ts-expect-error openLabel is required with onOpen
      <Widget size="small" title="t" onOpen={() => {}} />
    );
    const c = (
      // @ts-expect-error onOpen is `never` when an action is given
      <Widget size="small" title="t" action={<span />} onOpen={() => {}} />
    );
    expect([a, b, c]).toHaveLength(3);
  });
});

describe("Widget header-hidden", () => {
  it("moves the header to sr-only without removing it", () => {
    render(
      <Widget size="medium" title="Failed overnight" meta="3 of 26 runs" hideHeader>
        3
      </Widget>,
    );
    expect(slot("widget-header")!.className).toContain("sr-only");
    expect(slot("widget-title")!.textContent).toBe("Failed overnight");
    expect(screen.getByRole("group", { name: "Failed overnight" })).toBe(root());
  });

  it("floats the action over the body and keeps clearance for it", () => {
    render(
      <Widget
        size="medium"
        title="Failed overnight"
        hideHeader
        action={
          <WidgetAction label="Retry timed-out runs">
            <svg />
          </WidgetAction>
        }
      >
        3
      </Widget>,
    );
    const floated = document.querySelector('[data-slot="widget-action-slot"][data-floated]')!;
    expect(floated).not.toBeNull();
    expect(floated.className).toContain("absolute");
    expect(slot("widget-header")!.contains(floated)).toBe(false);
    expect(slot("widget-content")!.className).toMatch(/(^|\s)pe-/);
    expect(screen.getByRole("button", { name: "Retry timed-out runs" })).toBeTruthy();
  });

  it("leaves the action in the header when the header is shown", () => {
    render(
      <Widget
        size="medium"
        title="Failed overnight"
        action={
          <WidgetAction label="Retry timed-out runs">
            <svg />
          </WidgetAction>
        }
      >
        3
      </Widget>,
    );
    const btn = screen.getByRole("button", { name: "Retry timed-out runs" });
    expect(slot("widget-header")!.contains(btn)).toBe(true);
    expect(slot("widget-content")!.className).not.toMatch(/(^|\s)pe-/);
  });
});

describe("WidgetAction", () => {
  it("is named by its label and is a tooltip trigger", async () => {
    const onClick = vi.fn();
    render(
      <WidgetAction label="Retry timed-out runs" onClick={onClick}>
        <svg />
      </WidgetAction>,
    );
    const btn = screen.getByRole("button");
    expectAccessibleName(btn, "Retry timed-out runs");
    expect(btn.getAttribute("data-slot")).toBe("widget-action");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);

    // The tooltip popup does not open under jsdom (no real pointer geometry); the
    // visual repeat is asserted in the story. Here: the button is a tooltip trigger.
    expect(btn.hasAttribute("data-base-ui-tooltip-trigger")).toBe(true);
  });
});

describe("Widget passthrough", () => {
  it("passes className through", () => {
    render(<Widget size="small" title="Credits left" className="test-class" />);
    expect(root().className).toContain("test-class");
  });

  it("passes other props through", () => {
    render(<Widget size="small" title="Credits left" data-testid="tile" />);
    expect(screen.getByTestId("tile")).toBe(root());
  });
});
