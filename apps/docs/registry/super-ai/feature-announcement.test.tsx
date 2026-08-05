import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FEATURE_ANNOUNCEMENT_LEVELS,
  FeatureAnnouncement,
  type FeatureAnnouncementLevel,
} from "./feature-announcement";

const NEWS = {
  id: "multi-track-timeline",
  title: "Multi-track timeline",
  description: "Stack audio and video on independent tracks.",
  ctaLabel: "Open the timeline",
} as const;

function renderAt(level: FeatureAnnouncementLevel, overrides: Record<string, unknown> = {}) {
  const onDismiss = vi.fn();
  render(<FeatureAnnouncement {...NEWS} level={level} onDismiss={onDismiss} {...overrides} />);
  return { onDismiss };
}

describe("FeatureAnnouncement", () => {
  it("renders the modal state", () => {
    renderAt("modal");
    // Loudest level: it interrupts, so it is a real dialog.
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-level", "modal");
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
  });

  it("renders the anchored state", () => {
    renderAt("anchored", { anchorLabel: "What is new" });
    // The popover points at a control; the anchor is the trigger.
    expect(screen.getByRole("button", { name: "What is new" })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="feature-announcement"]')).toHaveAttribute("data-level", "anchored");
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
  });

  it("renders the inline-card state", () => {
    renderAt("inline-card");
    const root = document.querySelector('[data-slot="feature-announcement"]')!;
    expect(root).toHaveAttribute("data-level", "inline-card");
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
    expect(screen.getByText(NEWS.description)).toBeInTheDocument();
  });

  it("renders the dismissible-chip state", () => {
    renderAt("dismissible-chip");
    const root = document.querySelector('[data-slot="feature-announcement"]')!;
    expect(root).toHaveAttribute("data-level", "dismissible-chip");
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
  });

  it("renders the stage-badge state", () => {
    renderAt("inline-card", { stage: "Beta" });
    const badge = document.querySelector('[data-slot="feature-announcement-stage"]')!;
    // Stage badges set expectations — and they do it with a word, never colour
    // alone, so the stage survives for colourblind and screen-reader users.
    expect(badge).toHaveTextContent("Beta");
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it.each(["New", "Beta", "Preview", "v2.4"])("renders %s as readable stage text", (stage) => {
    renderAt("dismissible-chip", { stage });
    expect(screen.getByText(stage)).toBeInTheDocument();
  });

  // ── The four presentations are a prop, not four components ────────────────
  it.each(FEATURE_ANNOUNCEMENT_LEVELS)("renders the same content at level %s", (level) => {
    renderAt(level, { stage: "New" });
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
    expect(screen.getByText(NEWS.description)).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: NEWS.ctaLabel })).toBeInTheDocument();
  });

  // ── Dismissal ─────────────────────────────────────────────────────────────
  it.each(FEATURE_ANNOUNCEMENT_LEVELS)("emits the announcement id when dismissed at level %s", async (level) => {
    const { onDismiss } = renderAt(level);
    await userEvent.click(screen.getByRole("button", { name: /dismiss announcement/i }));
    // Dismissal persists per announcement id, so the event has to carry the id
    // — a bare onDismiss() cannot tell the host which announcement to remember.
    expect(onDismiss).toHaveBeenCalledWith(NEWS.id);
  });

  it.each(FEATURE_ANNOUNCEMENT_LEVELS)("names what it dismisses at level %s", (level) => {
    renderAt(level);
    // Not "Close": an icon-only ✕ needs an accessible name that says which
    // announcement is going away.
    expect(screen.getByRole("button", { name: `Dismiss announcement: ${NEWS.title}` })).toBeInTheDocument();
  });

  it.each(FEATURE_ANNOUNCEMENT_LEVELS)("renders nothing once dismissed at level %s", (level) => {
    renderAt(level, { dismissed: true });
    expect(screen.queryByText(NEWS.title)).toBeNull();
    expect(document.querySelector('[data-slot="feature-announcement"]')).toBeNull();
  });

  it("treats closing the modal as dismissal", async () => {
    const { onDismiss } = renderAt("modal");
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledWith(NEWS.id);
  });

  it("never persists dismissal itself — it emits, the host stores", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { onDismiss } = renderAt("inline-card");
    await userEvent.click(screen.getByRole("button", { name: /dismiss announcement/i }));
    expect(onDismiss).toHaveBeenCalledWith(NEWS.id);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("stays visible after dismissal until the host says otherwise", async () => {
    // Controlled by design: nothing disappears on its own, because the thing
    // that remembers the dismissal is the consumer, not the component.
    const { onDismiss } = renderAt("inline-card");
    await userEvent.click(screen.getByRole("button", { name: /dismiss announcement/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByText(NEWS.title)).toBeInTheDocument();
  });

  it("renders media at the louder levels and drops it in the chip", () => {
    const { unmount } = render(
      <FeatureAnnouncement {...NEWS} level="inline-card" media={<div data-testid="shot" />} onDismiss={vi.fn()} />,
    );
    expect(document.querySelector('[data-slot="feature-announcement-media"]')).not.toBeNull();
    unmount();

    render(
      <FeatureAnnouncement
        {...NEWS}
        level="dismissible-chip"
        media={<div data-testid="shot" />}
        onDismiss={vi.fn()}
      />,
    );
    expect(document.querySelector('[data-slot="feature-announcement-media"]')).toBeNull();
  });

  it("uses the caller's own control as the anchor when one is given", () => {
    render(
      <FeatureAnnouncement
        {...NEWS}
        level="anchored"
        anchor={<button type="button">Timeline</button>}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Timeline" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<FeatureAnnouncement {...NEWS} className="test-class" onDismiss={vi.fn()} />);
    expect(document.querySelector('[data-slot="feature-announcement"]')!.className).toContain("test-class");
  });
});
