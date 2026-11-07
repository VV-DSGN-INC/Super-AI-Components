import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pin, RotateCw, Undo2, X } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { expectAccessibleName } from "@/lib/test-utils";

import {
  ViewFrame,
  ViewFrameAction,
  ViewFrameActions,
  ViewFrameContent,
  ViewFrameDescription,
  ViewFrameFoot,
  ViewFrameFooter,
  ViewFrameHeader,
  ViewFrameTitle,
} from "./view-frame";

function Frame({
  actions,
  content,
  foot,
}: {
  actions?: React.ReactNode;
  content?: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <ViewFrame title="Failed runs this week">
      <ViewFrameHeader>
        <ViewFrameTitle>Failed runs this week</ViewFrameTitle>
        <ViewFrameDescription>All projects · updated just now</ViewFrameDescription>
        <ViewFrameActions>
          {actions ?? (
            <>
              <ViewFrameAction label="Undo">
                <Undo2 />
              </ViewFrameAction>
              <ViewFrameAction label="Rerun">
                <RotateCw />
              </ViewFrameAction>
              <ViewFrameAction label="Pin">
                <Pin />
              </ViewFrameAction>
              <ViewFrameAction label="Close">
                <X />
              </ViewFrameAction>
            </>
          )}
        </ViewFrameActions>
      </ViewFrameHeader>
      <ViewFrameContent>{content ?? <p>Onboarding video, Timed out</p>}</ViewFrameContent>
      <ViewFrameFoot>{foot}</ViewFrameFoot>
      <ViewFrameFooter origin="Made in chat: Track failed runs" version="v2 · board" />
    </ViewFrame>
  );
}

const part = (slot: string) => document.querySelector(`[data-slot="${slot}"]`);

describe("ViewFrame", () => {
  it("renders the docked state: a named section that fills a narrow container", () => {
    render(
      <div className="h-96 w-80">
        <Frame />
      </div>,
    );
    const frame = screen.getByRole("region", { name: "Failed runs this week" });
    expect(frame.tagName).toBe("SECTION");
    expect(frame).toHaveAttribute("data-slot", "view-frame");
    expect(frame.className).toContain("h-full");
    expect(frame.className).toContain("min-h-0");
    expect(screen.getByRole("heading", { name: "Failed runs this week" })).toBeInTheDocument();
    expect(screen.getByText("All projects · updated just now")).toBeInTheDocument();
  });

  it("renders the page state: one frame, header to footer in document order", () => {
    render(
      <div className="h-screen w-full">
        <Frame foot={<input aria-label="Ask about this view" />} />
      </div>,
    );
    const order = ["view-frame-header", "view-frame-content", "view-frame-foot", "view-frame-footer"].map(
      (slot) => part(slot)!,
    );
    order.forEach((el) => expect(el).not.toBeNull());
    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i].compareDocumentPosition(order[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("renders the with-modes state: the caller's panelless tabs sit in the actions", () => {
    render(
      <Frame
        actions={
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />,
    );
    const actions = part("view-frame-actions") as HTMLElement;
    expect(within(actions).getByRole("tablist")).toBeInTheDocument();
    expect(within(actions).getByRole("tab", { name: "Table", selected: true })).toBeInTheDocument();
    expect(within(actions).getByRole("tab", { name: "Board", selected: false })).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).toBeNull();
  });

  it("renders the with-ask-bar state: the foot is an in-flow slot between body and footer", () => {
    render(<Frame foot={<input aria-label="Ask about this view" placeholder="Ask about this view" />} />);
    const foot = part("view-frame-foot") as HTMLElement;
    expect(within(foot).getByRole("textbox", { name: "Ask about this view" })).toBeInTheDocument();
    expect(foot.className).not.toMatch(/\b(absolute|fixed|sticky)\b/);
    expect(part("view-frame-content")!.contains(foot)).toBe(false);
  });

  it("renders nothing at all for an empty foot", () => {
    const { rerender } = render(<Frame />);
    expect(part("view-frame-foot")).toBeNull();
    rerender(<Frame foot={false} />);
    expect(part("view-frame-foot")).toBeNull();
    rerender(<Frame foot={<input aria-label="Ask" />} />);
    expect(part("view-frame-foot")).not.toBeNull();
  });

  it("renders the rerunning state: the caller's skeleton lives inside the scroll region", () => {
    render(
      <Frame
        content={
          <div role="status" aria-label="Rerunning">
            <Skeleton className="h-6 w-full" />
          </div>
        }
      />,
    );
    const content = part("view-frame-content") as HTMLElement;
    expect(within(content).getByRole("status", { name: "Rerunning" })).toBeInTheDocument();
    expect(content.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Failed runs this week" })).toBeInTheDocument();
  });

  it("renders the failed state: the caller's alert and Retry stay inside the body", async () => {
    let retried = 0;
    render(
      <Frame
        content={
          <Alert variant="destructive">
            <AlertDescription>This view could not run. The runs service did not answer.</AlertDescription>
            <Button
              onClick={() => {
                retried++;
              }}
            >
              Retry
            </Button>
          </Alert>
        }
      />,
    );
    const content = part("view-frame-content") as HTMLElement;
    expect(within(content).getByRole("alert")).toHaveTextContent(
      "This view could not run. The runs service did not answer.",
    );
    await userEvent.click(within(content).getByRole("button", { name: "Retry" }));
    expect(retried).toBe(1);
    // the chrome did not change shape: every action is still there
    expect(screen.getByRole("button", { name: "Rerun" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ViewFrame className="test-class" />);
    expect(document.querySelector('[data-slot="view-frame"]')!.className).toContain("test-class");
  });

  it("passes className through on every part", () => {
    render(
      <ViewFrame className="c0">
        <ViewFrameHeader className="c1">
          <ViewFrameTitle className="c2">T</ViewFrameTitle>
          <ViewFrameDescription className="c3">D</ViewFrameDescription>
          <ViewFrameActions className="c4">
            <ViewFrameAction className="c5" label="Pin">
              <Pin />
            </ViewFrameAction>
          </ViewFrameActions>
        </ViewFrameHeader>
        <ViewFrameContent className="c6" />
        <ViewFrameFoot className="c7">
          <span>x</span>
        </ViewFrameFoot>
        <ViewFrameFooter className="c8" origin="o" version="v" />
      </ViewFrame>,
    );
    [
      "view-frame",
      "view-frame-header",
      "view-frame-title",
      "view-frame-description",
      "view-frame-actions",
      "button",
      "view-frame-content",
      "view-frame-foot",
      "view-frame-footer",
    ].forEach((slot, i) => expect(part(slot)!.className).toContain(`c${i}`));
  });

  describe("naming", () => {
    it("names the section from `title`", () => {
      render(<ViewFrame title="Failed runs this week" />);
      expectAccessibleName(
        screen.getByRole("region", { name: "Failed runs this week" }),
        "Failed runs this week",
      );
    });

    it("lets a caller's aria-labelledby win over `title`", () => {
      render(
        <ViewFrame title="Ignored" aria-labelledby="own-heading">
          <h2 id="own-heading">Failed runs this week</h2>
        </ViewFrame>,
      );
      const frame = document.querySelector('[data-slot="view-frame"]')!;
      expect(frame).not.toHaveAttribute("aria-label");
      expectAccessibleName(frame, "Failed runs this week");
    });
  });

  describe("ViewFrameAction", () => {
    it("uses label as both the accessible name and the hover title", () => {
      render(
        <ViewFrameAction label="Rerun">
          <RotateCw />
        </ViewFrameAction>,
      );
      const button = screen.getByRole("button", { name: "Rerun" });
      expectAccessibleName(button, "Rerun");
      expect(button).toHaveAttribute("title", "Rerun");
      expect(button).toHaveAttribute("type", "button");
    });

    it("grows to a 44px target below md", () => {
      render(
        <ViewFrameAction label="Pin">
          <Pin />
        </ViewFrameAction>,
      );
      expect(screen.getByRole("button", { name: "Pin" }).className).toContain("max-md:size-11");
    });

    it("fires onClick and honours disabled", async () => {
      let n = 0;
      render(
        <>
          <ViewFrameAction label="Undo" onClick={() => n++}>
            <Undo2 />
          </ViewFrameAction>
          <ViewFrameAction label="Close" disabled onClick={() => n++}>
            <X />
          </ViewFrameAction>
        </>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Undo" }));
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(n).toBe(1);
    });
  });

  describe("ViewFrameContent", () => {
    it("is the one scroll region: focusable and named", () => {
      render(<Frame />);
      const content = screen.getByRole("region", { name: "View content" });
      expect(content).toHaveAttribute("tabindex", "0");
      expect(content.className).toContain("overflow-auto");
      expect(content.className).toContain("min-h-0");
      expect(content.className).toContain("flex-1");
      expect(document.querySelectorAll(".overflow-auto, .overflow-y-auto")).toHaveLength(1);
    });

    it("takes a caller's name over the default", () => {
      render(<ViewFrameContent aria-label="Failed runs table" />);
      expect(screen.getByRole("region", { name: "Failed runs table" })).toBeInTheDocument();
    });
  });

  describe("layout parts", () => {
    it("gives the title a basis-56 floor and lets the header wrap", () => {
      render(<Frame />);
      expect(part("view-frame-title")!.className).toContain("basis-56");
      expect(part("view-frame-header")!.className).toContain("flex-wrap");
    });

    it("wraps the actions full width below md and beside the title from md", () => {
      render(<Frame />);
      const cls = part("view-frame-actions")!.className;
      expect(cls).toContain("w-full");
      expect(cls).toContain("flex-wrap");
      expect(cls).toContain("justify-end");
      expect(cls).toContain("md:w-auto");
    });

    it("shows origin at one end and version at the other, and truncates only the origin", () => {
      render(<Frame />);
      const footer = part("view-frame-footer") as HTMLElement;
      const origin = within(footer).getByText("Made in chat: Track failed runs");
      const version = within(footer).getByText("v2 · board");
      expect(footer.firstElementChild).toBe(origin);
      expect(footer.lastElementChild).toBe(version);
      expect(footer.className).toContain("justify-between");
      expect(origin.className).toContain("truncate");
      expect(version.className).toContain("shrink-0");
      expect(version.className).not.toContain("truncate");
    });
  });

  it("keeps the chrome's tab order: actions, then the body, then the foot", async () => {
    render(<Frame foot={<input aria-label="Ask about this view" />} />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("region", { name: "View content" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("textbox", { name: "Ask about this view" })).toHaveFocus();
  });
});
