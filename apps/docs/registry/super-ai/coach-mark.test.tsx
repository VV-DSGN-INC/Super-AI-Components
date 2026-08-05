import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CoachMark } from "./coach-mark";

const root = () => document.querySelector('[data-slot="coach-mark"]')!;
const scrim = () => document.querySelector('[data-slot="coach-mark-scrim"]');
const content = () => document.querySelector('[data-slot="coach-mark-content"]')!;

function Anchor() {
  return <button type="button">Generate</button>;
}

describe("CoachMark", () => {
  it("renders the spotlight state", async () => {
    render(
      <CoachMark title="Start here" step={1} total={3} onSkip={() => {}} onNext={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    expect(await screen.findByRole("dialog", { name: "Start here" })).toBeInTheDocument();
    expect(root()).toHaveAttribute("data-spotlight", "on");

    // The load-bearing sentence: "the scrim has a cut-out so the anchored
    // element stays legible." The scrim paints *outside* its own box via a
    // 9999px shadow spread, so the cut-out is the anchor's box, and it never
    // swallows pointer events aimed at the anchor.
    const dimmer = scrim()!;
    expect(dimmer.className).toContain("shadow-[0_0_0_9999px_var(--foreground)]");
    expect(dimmer.className).toContain("pointer-events-none");
    expect(dimmer).toHaveAttribute("aria-hidden", "true");

    // …and the anchor is a sibling of the scrim, not a descendant of it, so
    // nothing is layered on top of the thing being pointed at.
    const anchor = screen.getByRole("button", { name: "Generate" });
    expect(dimmer.contains(anchor)).toBe(false);
    expect(root().contains(anchor)).toBe(true);
  });

  it("renders the no-spotlight state", async () => {
    render(
      <CoachMark
        title="Rename anytime"
        description="Double-click the title to rename this project."
        spotlight={false}
        step={2}
        total={3}
        onSkip={() => {}}
      >
        <Anchor />
      </CoachMark>,
    );

    expect(await screen.findByRole("dialog", { name: "Rename anytime" })).toBeInTheDocument();
    expect(root()).toHaveAttribute("data-spotlight", "off");
    // No scrim at all — not a transparent one, not a zero-opacity one.
    expect(scrim()).toBeNull();
    // The step counter and Skip survive the spotlight being switched off.
    expect(within(content() as HTMLElement).getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  });

  it("renders the step-counter state", () => {
    render(
      <CoachMark title="Third of five" step={3} total={5} onSkip={() => {}} onNext={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    // "Step counter and Skip are mandatory." The counter is text, not dots
    // alone — the dots are aria-hidden decoration layered over a sentence.
    const counter = document.querySelector('[data-slot="coach-mark-step"]')!;
    expect(counter).toHaveTextContent("Step 3 of 5");
    expect(root()).toHaveAttribute("data-step", "3");
    expect(root()).toHaveAttribute("data-total", "5");
  });

  it("renders the arrow-flip state", async () => {
    const { unmount } = render(
      <CoachMark title="Below" side="bottom" step={1} total={2} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    await screen.findByRole("dialog", { name: "Below" });
    expect(document.querySelector('[data-slot="coach-mark-arrow"]')).toHaveAttribute(
      "data-side",
      "bottom",
    );
    unmount();

    render(
      <CoachMark title="Above" side="top" step={2} total={2} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    await screen.findByRole("dialog", { name: "Above" });
    // The arrow follows the popup to whichever side it landed on, so the
    // pointer never detaches from the anchor when the popover flips.
    expect(document.querySelector('[data-slot="coach-mark-arrow"]')).toHaveAttribute(
      "data-side",
      "top",
    );
    expect(content()).toHaveAttribute("data-side", "top");
  });

  it("passes className through", () => {
    render(
      <CoachMark className="test-class" title="Anchored" step={1} total={1} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );
    expect(root().className).toContain("test-class");
  });

  // "Step counter and Skip are mandatory." Not props a caller can switch off:
  // Skip is rendered even for a single-step mark with no Next and no Back.
  it("always renders Skip, even with no other control", async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();
    render(
      <CoachMark title="One and done" step={1} total={1} onSkip={onSkip}>
        <Anchor />
      </CoachMark>,
    );

    const skip = await screen.findByRole("button", { name: "Skip tour" });
    expect(within(content() as HTMLElement).getByText("Step 1 of 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    // Reachable by keyboard, not just by mouse.
    await user.tab();
    expect(skip).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  // "A tour is a sequence of coach-marks with shared state, not a separate
  // component." The mark advances nothing on its own: it reports, the host
  // decides. If this ever starts owning the index, a <Tour> has grown here.
  it("reports intent instead of advancing itself", async () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <CoachMark title="Middle" step={2} total={4} onSkip={() => {}} onNext={onNext} onBack={onBack}>
        <Anchor />
      </CoachMark>,
    );

    await user.click(await screen.findByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    // Still step 2 of 4 — nothing moved, because nothing here owns the index.
    expect(document.querySelector('[data-slot="coach-mark-step"]')).toHaveTextContent(
      "Step 2 of 4",
    );
  });

  it("labels the last step's primary action as the end of the tour", async () => {
    render(
      <CoachMark title="Last" step={4} total={4} onSkip={() => {}} onNext={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    expect(await screen.findByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("hides Back on the first step even when onBack is supplied", async () => {
    render(
      <CoachMark title="First" step={1} total={3} onSkip={() => {}} onBack={() => {}} onNext={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    await screen.findByRole("dialog", { name: "First" });
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("clamps an out-of-range step into the tour it declares", () => {
    render(
      <CoachMark title="Clamped" step={9} total={3} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    expect(document.querySelector('[data-slot="coach-mark-step"]')).toHaveTextContent(
      "Step 3 of 3",
    );
    expect(root()).toHaveAttribute("data-step", "3");
  });

  it("keeps the anchor out of the tab order it does not belong in", async () => {
    render(
      <CoachMark title="Anchored" step={1} total={2} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    await screen.findByRole("dialog", { name: "Anchored" });
    // The trigger exists only to position the popup. If it became a real
    // control wrapping `children`, a tour pointing at a button would nest one
    // interactive inside another.
    const anchor = document.querySelector('[data-slot="coach-mark-anchor"]')!;
    expect(anchor).toHaveAttribute("aria-hidden", "true");
    expect(anchor).toHaveAttribute("tabindex", "-1");
    expect(anchor.querySelector("button")).toBeNull();
  });

  // The other half of "never dim what you point at": a modal popover would
  // have Base UI mark the rest of the document aria-hidden, which dims the
  // anchor for anyone using a screen reader even though it looks lit up.
  it("leaves the anchored element visible to assistive technology", async () => {
    render(
      <CoachMark title="Anchored" step={1} total={2} onSkip={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    await screen.findByRole("dialog", { name: "Anchored" });
    const anchor = screen.getByRole("button", { name: "Generate" });
    expect(anchor).not.toHaveAttribute("aria-hidden");
    expect(anchor.closest("[aria-hidden='true']")).toBeNull();
  });

  it("takes focus when it opens so Skip is one Tab away", async () => {
    const user = userEvent.setup();
    render(
      <CoachMark title="Focused" step={1} total={2} onSkip={() => {}} onNext={() => {}}>
        <Anchor />
      </CoachMark>,
    );

    const dialog = await screen.findByRole("dialog", { name: "Focused" });
    expect(dialog).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Skip tour" })).toHaveFocus();
  });

  it("accepts a custom step label", () => {
    render(
      <CoachMark
        title="Localised"
        step={2}
        total={3}
        onSkip={() => {}}
        stepLabel={(s, t) => `${s} / ${t}`}
      >
        <Anchor />
      </CoachMark>,
    );

    expect(document.querySelector('[data-slot="coach-mark-step"]')).toHaveTextContent("2 / 3");
  });

  it("is controllable by the host that owns the tour", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CoachMark title="Closed" open={false} step={1} total={2} onSkip={() => {}} onOpenChange={onOpenChange}>
        <Anchor />
      </CoachMark>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // No scrim while closed — a tour that is not showing must not dim the app.
    expect(scrim()).toBeNull();

    rerender(
      <CoachMark title="Closed" open step={1} total={2} onSkip={() => {}} onOpenChange={onOpenChange}>
        <Anchor />
      </CoachMark>,
    );
    expect(await screen.findByRole("dialog", { name: "Closed" })).toBeInTheDocument();
    expect(scrim()).not.toBeNull();
  });
});
