import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HomeShell, type HomeShellProps } from "./home-shell";

// C2's chip row is a Base UI `ScrollArea`, whose viewport schedules a timeout
// that calls `getAnimations()` on itself. jsdom implements no Web Animations
// API, so that call throws — and because it lands on a timer *after* the test
// that triggered it has resolved, it surfaces as an unhandled exception that
// fails the run while every assertion passes. `suggestion-chips.test.tsx` is
// short enough that the timer never fires; a shell's suite is not. Shimmed
// here rather than in the shared `vitest.setup.ts`, which is not this task's
// to edit — it belongs there, alongside the ResizeObserver stub.
window.Element.prototype.getAnimations ??= () => [];

const REGIONS = ["sidebar", "topbar", "hero-omnibox", "feature-cards", "recents-grid"];

const SUGGESTIONS = [
  { id: "s1", suggestion: "Draft a launch announcement" },
  { id: "s2", suggestion: "Turn this deck into a video" },
];

const FEATURES = [
  { id: "f1", title: "Generate images", description: "From a prompt or a reference." },
  { id: "f2", title: "Edit video", description: "Cut, caption and export." },
];

const RECENTS = [
  { id: "r1", title: "Northwind brand audit", editedAgo: "Edited 19 hours ago" },
  { id: "r2", title: "Q3 launch video", durationLabel: "12:04" },
];

const RECOMMENDATIONS: HomeShellProps["recommendations"] = [
  {
    id: "rec1",
    title: "Summarise new files into a weekly digest",
    apps: ["Drive", "Slack"],
    steps: ["Watch a folder", "Summarise what lands", "Post the digest on Friday"],
    onDismiss: () => {},
  },
];

describe("HomeShell", () => {
  it.each(REGIONS)("renders the %s region", (region) => {
    const { container } = render(<HomeShell />);
    expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
  });

  it("passes className through", () => {
    render(<HomeShell className="test-class" />);
    expect(document.querySelector('[data-slot="home-shell"]')!.className).toContain("test-class");
  });

  // "Order is invariant across all five reference products: composer →
  // starters → features → recents → inspiration." The order is the archetype,
  // so it is hard-coded rather than configurable — and this is the test that
  // stops a later prop from making it configurable by accident. Starters are
  // asserted inside the hero region, which is where "composer → starters"
  // puts them.
  it("keeps the invariant band order: composer, starters, features, recents, inspiration", () => {
    const { container } = render(<HomeShell suggestions={SUGGESTIONS} />);
    const page = container.querySelector('[data-slot="home-shell-page"]')!;
    const order = Array.from(
      page.querySelectorAll("[data-region], [data-slot='home-shell-inspiration']"),
    ).map((node) => node.getAttribute("data-region") ?? node.getAttribute("data-slot"));

    expect(order).toEqual([
      "hero-omnibox",
      "feature-cards",
      "recents-grid",
      "home-shell-inspiration",
    ]);

    const hero = container.querySelector('[data-region="hero-omnibox"]')!;
    expect(hero.querySelector('[data-slot="hero-omnibox"]')).not.toBeNull();
    expect(hero.querySelector('[data-slot="suggestion-chips"]')).not.toBeNull();
  });

  // C2's whole contract: "Chips are prompts, not filters — onSelect exists to
  // fill the composer, never to submit or navigate." The shell owns the
  // composer's value so this is true by default rather than by convention.
  it("fills the composer from a starter chip without submitting", async () => {
    const onSubmit = vi.fn();
    const onSelectSuggestion = vi.fn();
    render(
      <HomeShell
        suggestions={SUGGESTIONS}
        onSelectSuggestion={onSelectSuggestion}
        omnibox={{ onSubmit }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Draft a launch announcement" }));

    expect(screen.getByRole("textbox", { name: "What can I help you with?" })).toHaveValue(
      "Draft a launch announcement",
    );
    expect(onSelectSuggestion).toHaveBeenCalledWith("Draft a launch announcement");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lets a caller control the composer's value", async () => {
    const onPromptChange = vi.fn();
    render(<HomeShell promptValue="held by the caller" onPromptChange={onPromptChange} />);
    const field = screen.getByRole("textbox", { name: "What can I help you with?" });
    expect(field).toHaveValue("held by the caller");
    await userEvent.type(field, "!");
    expect(onPromptChange).toHaveBeenCalledWith("held by the caller!");
  });

  // "Overflow resolves to a real link, never a chip that gets clipped."
  it("resolves starter overflow through C2's link, not another chip", () => {
    render(
      <HomeShell suggestions={SUGGESTIONS} suggestionsOverflow={{ href: "/prompts", count: 12 }} />,
    );
    const overflow = screen.getByRole("link", { name: "12 more" });
    expect(overflow).toHaveAttribute("href", "/prompts");
    expect(overflow.getAttribute("data-slot")).toBe("suggestion-chips-overflow");
  });

  it("composes C3 feature cards rather than rendering its own", () => {
    const { container } = render(<HomeShell features={FEATURES} />);
    const region = container.querySelector('[data-region="feature-cards"]')!;
    expect(region.querySelectorAll('[data-slot="feature-card-row-card"]')).toHaveLength(2);
    expect(within(region as HTMLElement).getByText("Generate images")).toBeVisible();
  });

  it("composes C4 recent tiles rather than rendering its own", () => {
    const { container } = render(<HomeShell recents={RECENTS} />);
    const region = container.querySelector('[data-region="recents-grid"]')!;
    expect(region.querySelectorAll('[data-slot="recent-grid-item"]')).toHaveLength(2);
    expect(region.querySelectorAll('[data-slot="preview-tile"]')).toHaveLength(2);
    expect(screen.getByText("Edited 19 hours ago")).toBeVisible();
  });

  it("composes C5 recommendation cards rather than rendering its own", async () => {
    render(<HomeShell recommendations={RECOMMENDATIONS} />);
    expect(document.querySelector('[data-slot="recommendation-card"]')).not.toBeNull();
    // The steps are C5's audit affordance and live behind its own modal — the
    // shell must not have flattened the card into a row of its own.
    await userEvent.click(screen.getByRole("button", { name: "Try it" }));
    expect(await screen.findByText("Watch a folder")).toBeVisible();
  });

  it("composes M2 into B7's trailing slot", () => {
    const { container } = render(<HomeShell credits={{ balance: 420, total: 1000 }} />);
    const topbar = container.querySelector('[data-region="topbar"]')!;
    const credits = topbar.querySelector('[data-slot="credits-indicator"]')!;
    expect(credits).not.toBeNull();
    expect(within(topbar as HTMLElement).getByText("420 credits")).toBeVisible();
    // This call site used to rebind `--muted-foreground` to compensate for M2
    // pairing muted text with its own muted fill, and asserted the rebind here.
    // M2 was fixed at source instead — its alarm states now colour the surface
    // and "Top up" inherits — so the compensation is gone and the assertion with
    // it. The a11y gate (`pnpm test:stories`) is what holds M2 to it now.
  });

  it("keeps a caller's own topbar actions when M2 is present", () => {
    const { container } = render(
      <HomeShell credits={{ balance: 12 }} topbar={{ actions: <button type="button">Share</button> }} />,
    );
    const topbar = container.querySelector('[data-region="topbar"]')!;
    expect(within(topbar as HTMLElement).getByRole("button", { name: "Share" })).toBeVisible();
    expect(topbar.querySelector('[data-slot="credits-indicator"]')).not.toBeNull();
  });

  it("titles the topbar with the workspace", () => {
    const { container } = render(<HomeShell title="Northwind" />);
    const topbar = container.querySelector('[data-region="topbar"]')!;
    expect(within(topbar as HTMLElement).getByText("Northwind")).toBeVisible();
  });

  it("fills the sidebar with the nav it was given", () => {
    const { container } = render(<HomeShell nav={<nav aria-label="Main">Projects</nav>} />);
    const sidebar = container.querySelector('[data-region="sidebar"]')!;
    expect(within(sidebar as HTMLElement).getByRole("navigation", { name: "Main" })).toBeVisible();
  });

  // "The whole page is C4's empty state on day one. That is the version most
  // new users actually see." Day one is not a special render: every region is
  // mounted and every one of them shows an empty affordance. Where the
  // composed component ships its own — C4 does — that one wins; where it does
  // not, L1 fills in.
  it("shows C4's own empty tile on day one, not a substitute", () => {
    const { container } = render(<HomeShell />);
    const region = container.querySelector('[data-region="recents-grid"]')!;
    expect(region.querySelector('[data-slot="recent-grid-empty"]')).not.toBeNull();
    expect(region.querySelector('[data-slot="empty-state"]')).toBeNull();
  });

  it("falls to L1 where the composed component has no empty affordance", () => {
    const { container } = render(<HomeShell />);
    const features = container.querySelector('[data-region="feature-cards"]')!;
    const sidebar = container.querySelector('[data-region="sidebar"]')!;
    const inspiration = container.querySelector('[data-slot="home-shell-inspiration"]')!;
    expect(features.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(sidebar.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(inspiration.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });

  // "The hero omnibox is ... the only emphasised element on the page.
  // Everything else is a path back into existing work." On day one that has a
  // sharp mechanical reading: the bands below the hero contribute no call to
  // action of their own. L1 deliberately has no `ctaLabel` for the same
  // reason — a generic "Get started" would be the path of least resistance.
  it("emphasises nothing below the hero on day one", () => {
    const { container } = render(<HomeShell />);
    const page = container.querySelector('[data-slot="home-shell-page"]')!;
    const belowHero = Array.from(
      page.querySelectorAll("[data-region='feature-cards'], [data-region='recents-grid'], [data-slot='home-shell-inspiration']"),
    ).flatMap((band) => Array.from(band.querySelectorAll("button, a")));
    expect(belowHero).toHaveLength(0);
  });

  it("still mounts every region when the shell is fully loaded", () => {
    const { container } = render(
      <HomeShell
        suggestions={SUGGESTIONS}
        features={FEATURES}
        recents={RECENTS}
        recommendations={RECOMMENDATIONS}
        credits={{ balance: 420, total: 1000 }}
      />,
    );
    for (const region of REGIONS) {
      expect(container.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-slot="home-shell-inspiration"]')).not.toBeNull();
  });

  it("renders the headline as the page's h1", () => {
    render(<HomeShell headline="Good afternoon" />);
    expect(screen.getByRole("heading", { level: 1, name: "Good afternoon" })).toBeVisible();
  });
});
