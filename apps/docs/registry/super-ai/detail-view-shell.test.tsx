import userEvent from "@testing-library/user-event";
import {
  DetailFields,
  DetailTabs,
  DetailViewShell,
  type DetailChannel,
  type DetailField,
  type DetailTabItem,
  useContainerWidth,
} from "@/registry/super-ai/detail-view-shell";
import { installResizeObserver, resizeTo, uninstallResizeObserver } from "@/test/resize-observer";
import { render, screen, waitFor } from "@testing-library/react";
import { act, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* ─── ported from components/ui/detail-view-shell.test.tsx ─── */
{
  const CHANNELS: DetailChannel[] = [
    { id: "activity", label: "Activity", count: 2, content: <p>comment feed</p> },
    { id: "files", label: "Files", content: <p>file list</p> },
  ];

  function setup(props: Partial<React.ComponentProps<typeof DetailViewShell>> = {}) {
    render(
      <DetailViewShell
        open
        onOpenChange={() => {}}
        mode="fullscreen"
        header={<h1>Header</h1>}
        attributes={<p>attribute content</p>}
        conversation={CHANNELS}
        ariaLabel="Record"
        {...props}
      />,
    );
  }

  describe("DetailViewShell", () => {
    it("renders one column and no tabs without a conversation", () => {
      setup({ conversation: undefined });
      act(() => resizeTo(1200));
      expect(screen.getByText("attribute content")).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("treats an empty channel list as no conversation", () => {
      setup({ conversation: [] });
      act(() => resizeTo(1200));
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("shows both panes at once when wide", () => {
      setup();
      act(() => resizeTo(1200));
      expect(screen.getByText("attribute content")).toBeInTheDocument();
      expect(screen.getByText("comment feed")).toBeInTheDocument();
      // Wide means side by side, so there is no pane switcher.
      expect(screen.queryByRole("tablist", { name: "Detail section" })).not.toBeInTheDocument();
    });

    it("hides the channel strip when there is only one channel", () => {
      setup({ conversation: [CHANNELS[0]] });
      act(() => resizeTo(1200));
      expect(screen.queryByRole("tablist", { name: "Conversation channel" })).not.toBeInTheDocument();
      expect(screen.getByText("comment feed")).toBeInTheDocument();
    });

    it("shows the channel strip with two or more channels", () => {
      setup();
      act(() => resizeTo(1200));
      expect(screen.getByRole("tablist", { name: "Conversation channel" })).toBeInTheDocument();
    });

    it("switches channel", async () => {
      setup();
      act(() => resizeTo(1200));
      await userEvent.click(screen.getByRole("tab", { name: "Files" }));
      expect(screen.getByText("file list")).toBeInTheDocument();
      expect(screen.queryByText("comment feed")).not.toBeInTheDocument();
    });

    it("collapses to pane tabs when narrow", () => {
      setup();
      act(() => resizeTo(500));
      expect(screen.getByRole("tablist", { name: "Detail section" })).toBeInTheDocument();
      expect(screen.getByText("attribute content")).toBeInTheDocument();
      expect(screen.queryByText("comment feed")).not.toBeInTheDocument();
    });

    it("sums channel counts onto the collapsed activity tab", () => {
      setup();
      act(() => resizeTo(500));
      expect(screen.getByRole("tab", { name: "Activity, 2" })).toBeInTheDocument();
    });

    it("reaches the conversation through the pane tabs", async () => {
      setup();
      act(() => resizeTo(500));
      await userEvent.click(screen.getByRole("tab", { name: /^Activity/ }));
      expect(screen.getByText("comment feed")).toBeInTheDocument();
    });

    it("stacks instead of tabbing when told to", () => {
      setup({ collapse: "stack" });
      act(() => resizeTo(500));
      expect(screen.queryByRole("tablist", { name: "Detail section" })).not.toBeInTheDocument();
      expect(screen.getByText("attribute content")).toBeInTheDocument();
      expect(screen.getByText("comment feed")).toBeInTheDocument();
    });

    it("gives the stacked conversation a heading, since no tab names it", () => {
      setup({ collapse: "stack" });
      act(() => resizeTo(500));
      expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
    });

    /* The measured size is exposed on the DOM deliberately. A hidden or
     non-painting browser tab suspends ResizeObserver delivery entirely, so
     `data-size` is the only way to tell "measured narrow" apart from "never
     measured" when debugging outside this suite. */
    it("exposes the measured size on the content element", () => {
      setup();
      const content = document.querySelector("[data-slot='detail-content']");
      expect(content).toHaveAttribute("data-size", "narrow");
      act(() => resizeTo(1200));
      expect(content).toHaveAttribute("data-size", "wide");
    });

    it("keeps the selected channel across a resize", async () => {
      // Resizing a window must not silently throw the reader back to tab one.
      setup();
      act(() => resizeTo(1200));
      await userEvent.click(screen.getByRole("tab", { name: "Files" }));
      act(() => resizeTo(500));
      await userEvent.click(screen.getByRole("tab", { name: /^Activity/ }));
      expect(screen.getByText("file list")).toBeInTheDocument();
    });
  });
}

/* ─── ported from components/ui/detail-tabs.test.tsx ─── */
{
  const ITEMS: DetailTabItem[] = [
    { id: "details", label: "Details" },
    { id: "activity", label: "Activity", count: 3 },
  ];

  describe("DetailTabs", () => {
    it("marks only the active tab as selected", () => {
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={() => {}} ariaLabel="Pane" />);
      expect(screen.getByRole("tab", { name: /^Details/ })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /^Activity/ })).toHaveAttribute("aria-selected", "false");
    });

    it("puts the count in the accessible name, not just a badge", () => {
      // Colour and a bare number are not available to a screen reader.
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={() => {}} ariaLabel="Pane" />);
      expect(screen.getByRole("tab", { name: "Activity, 3" })).toBeInTheDocument();
    });

    it("omits the count when there is none", () => {
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={() => {}} ariaLabel="Pane" />);
      expect(screen.getByRole("tab", { name: "Details" })).toBeInTheDocument();
    });

    it("reports the chosen tab", async () => {
      const onSelect = vi.fn();
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={onSelect} ariaLabel="Pane" />);
      await userEvent.click(screen.getByRole("tab", { name: /^Activity/ }));
      expect(onSelect).toHaveBeenCalledWith("activity");
    });

    it("exposes exactly one tab stop", () => {
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={() => {}} ariaLabel="Pane" />);
      const tabs = screen.getAllByRole("tab");
      expect(tabs.filter((t) => t.getAttribute("tabindex") === "0")).toHaveLength(1);
    });

    /* Same reasoning as ViewSwitcher: the `+ length` in
     `(index + delta + length) % length` only matters at the left edge, so the
     left edge is asserted directly. */
    it("wraps backwards from the first tab to the last", async () => {
      const onSelect = vi.fn();
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={onSelect} ariaLabel="Pane" />);
      screen.getByRole("tab", { name: /^Details/ }).focus();
      await userEvent.keyboard("{ArrowLeft}");
      expect(onSelect).toHaveBeenLastCalledWith("activity");
    });

    it("wraps forwards from the last tab to the first", async () => {
      const onSelect = vi.fn();
      render(<DetailTabs items={ITEMS} activeId="activity" onSelect={onSelect} ariaLabel="Pane" />);
      screen.getByRole("tab", { name: /^Activity/ }).focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(onSelect).toHaveBeenLastCalledWith("details");
    });

    function Stateful() {
      const [activeId, setActiveId] = useState("details");
      return <DetailTabs items={ITEMS} activeId={activeId} onSelect={setActiveId} ariaLabel="Pane" />;
    }

    it("moves focus to the newly selected tab", async () => {
      render(<Stateful />);
      screen.getByRole("tab", { name: /^Details/ }).focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /^Activity/ })).toHaveFocus();
      });
    });

    it("names the tablist", () => {
      render(<DetailTabs items={ITEMS} activeId="details" onSelect={() => {}} ariaLabel="Pane" />);
      expect(screen.getByRole("tablist", { name: "Pane" })).toBeInTheDocument();
    });
  });
}

/* ─── ported from components/ui/detail-fields.test.tsx ─── */
{
  const FIELDS: DetailField[] = [
    { id: "status", label: "Status", value: "To do" },
    { id: "assignee", label: "Assignee", value: "Ada Okafor" },
    { id: "priority", label: "Priority", value: "P1" },
    { id: "due", label: "Due", value: "2026-08-14" },
  ];

  /* Queried by slot, not by role: <dl> carries no implicit `list` role in this
   ARIA mapping, so getByRole("list") finds nothing even though the markup is
   correct. */
  function list(): HTMLElement {
    const el = document.querySelector<HTMLElement>("[data-slot='detail-fields']");
    if (!el) throw new Error("detail-fields not rendered");
    return el;
  }

  describe("DetailFields", () => {
    it("renders a definition list", () => {
      // The term/definition relationship is semantic; the collapse is only
      // presentation, so the dl survives both layouts.
      render(<DetailFields fields={FIELDS} />);
      expect(list().tagName).toBe("DL");
    });

    it("renders every label and value", () => {
      render(<DetailFields fields={FIELDS} />);
      for (const field of FIELDS) {
        expect(screen.getByText(field.label)).toBeInTheDocument();
      }
      expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    });

    it("stacks into one pair per row before measurement", () => {
      render(<DetailFields fields={FIELDS} />);
      expect(list()).toHaveAttribute("data-columns", "1");
    });

    it("uses two pairs per row once wide enough", () => {
      render(<DetailFields fields={FIELDS} />);
      act(() => resizeTo(500));
      expect(list()).toHaveAttribute("data-columns", "2");
    });

    it("returns to one pair per row when it shrinks", () => {
      render(<DetailFields fields={FIELDS} />);
      act(() => resizeTo(500));
      act(() => resizeTo(300));
      expect(list()).toHaveAttribute("data-columns", "1");
    });

    it("still renders a dl when wide", () => {
      render(<DetailFields fields={FIELDS} />);
      act(() => resizeTo(500));
      expect(list().tagName).toBe("DL");
    });

    it("renders nothing for an empty field list", () => {
      const { container } = render(<DetailFields fields={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });
}

/* ─── ported from lib/use-container-width.test.tsx ─── */
{
  function Probe({ threshold = 720 }: { threshold?: number }) {
    const [ref, size] = useContainerWidth<HTMLDivElement>(threshold);
    return (
      <div ref={ref}>
        <span data-testid="size">{size}</span>
      </div>
    );
  }

  function size() {
    return screen.getByTestId("size").textContent;
  }

  describe("useContainerWidth", () => {
    afterEach(() => {
      installResizeObserver();
    });

    it("starts narrow before anything is measured", () => {
      // One column is always valid; two columns in a 400px box is not. The
      // pessimistic default is the safe one.
      render(<Probe />);
      expect(size()).toBe("narrow");
    });

    it("goes wide at the threshold", () => {
      render(<Probe />);
      act(() => resizeTo(720));
      expect(size()).toBe("wide");
    });

    it("stays narrow one pixel below the threshold", () => {
      render(<Probe />);
      act(() => resizeTo(719));
      expect(size()).toBe("narrow");
    });

    it("goes back to narrow when the container shrinks", () => {
      render(<Probe />);
      act(() => resizeTo(1000));
      expect(size()).toBe("wide");
      act(() => resizeTo(500));
      expect(size()).toBe("narrow");
    });

    it("honours a custom threshold", () => {
      render(<Probe threshold={400} />);
      act(() => resizeTo(450));
      expect(size()).toBe("wide");
    });

    it("stays narrow forever without a ResizeObserver", () => {
      uninstallResizeObserver();
      render(<Probe />);
      expect(size()).toBe("narrow");
    });

    /* Regression: the first implementation used useLayoutEffect plus a ref
     object, so it ran once, found ref.current still null, and bailed. Radix
     mounts Dialog and Sheet content through a portal on a later pass, so the
     shell's container was measured never — two columns simply never appeared
     in a popup or an overlay. A callback ref attaches whenever the node
     arrives, which is what this asserts. */
    it("measures a container that only mounts on a later pass", () => {
      function Deferred() {
        const [mounted, setMounted] = useState(false);
        const [ref, size] = useContainerWidth<HTMLDivElement>(720);
        return (
          <>
            <button onClick={() => setMounted(true)}>mount</button>
            <span data-testid="size">{size}</span>
            {mounted ? <div ref={ref} /> : null}
          </>
        );
      }

      render(<Deferred />);
      // The observed node does not exist yet on the first pass.
      act(() => resizeTo(1200));
      expect(size()).toBe("narrow");

      act(() => screen.getByRole("button", { name: "mount" }).click());
      act(() => resizeTo(1200));
      expect(size()).toBe("wide");
    });
  });
}
