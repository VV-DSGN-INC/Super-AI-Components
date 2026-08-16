import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { PromoCard, type PromoCardProps } from "@/registry/super-ai/promo-card";
import { RecommendationCard } from "@/registry/super-ai/recommendation-card";
import { PromoCardDocs } from "@/content/components/promo-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof PromoCard> = {
  title: "Super AI/Promo Card",
  component: PromoCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromoCardDocs) } },
};

export default meta;
type Story = StoryObj<typeof PromoCard>;

// PromoCard is controlled — it owns none of the dismissal state itself. The
// play test below needs the card to actually leave the DOM after a click, so
// this wrapper stands in for the persistence a real consumer would own.
function ControlledPromoCard(props: PromoCardProps) {
  const [dismissed, setDismissed] = useState(props.dismissed ?? false);
  return (
    <PromoCard
      {...props}
      dismissed={dismissed}
      onDismiss={() => {
        setDismissed(true);
        props.onDismiss();
      }}
    />
  );
}

export const Upgrade: Story = {
  args: {
    flavour: "upgrade",
    title: "Upgrade to Pro",
    description: "Unlock unlimited generations and priority rendering.",
    ctaLabel: "Upgrade",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => <ControlledPromoCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Upgrade to Pro")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /dismiss/i }));

    await expect(canvas.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
  },
};

export const Invite: Story = {
  args: {
    flavour: "invite",
    title: "Invite your team",
    description: "Projects are better with collaborators. Invites are free.",
    ctaLabel: "Invite teammates",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const UpdateAvailable: Story = {
  args: {
    flavour: "update-available",
    title: "Update available",
    description: "Version 2.4 adds faster exports and a new brush engine.",
    ctaLabel: "Update now",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const QuotaWarning: Story = {
  args: {
    flavour: "quota-warning",
    title: "You're near your limit",
    description: "You've used 90% of this month's generation credits.",
    ctaLabel: "Manage usage",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

export const Dismissed: Story = {
  args: {
    flavour: "upgrade",
    title: "Upgrade to Pro",
    dismissed: true,
    onDismiss: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing this component owns animates; the only timed rule is Button's shared base
 * `promo-card.tsx` contains no `animate-*` and no `transition-*` of its own:
 * the tree is a Card, an icon, two paragraphs and two Buttons. Dismissal is
 * an unmount rather than an exit — `dismissed` returns `null` — so there is
 * no leave transition to reduce either.
 *
 * The one timed declaration that reaches this card comes from the shared
 * `components/ui/button.tsx` base: `transition-all` carrying a 1px
 * `active:not-aria-[haspopup]:translate-y-px` press nudge. That is genuine
 * movement, but it is not this component's to suppress — it sits under every
 * button in the registry, and adding `motion-reduce:transition-none` to
 * promo-card's own two buttons would document a branch only promo-card has
 * while the other ~110 components keep the nudge. The shipped precedent for
 * Button-composing components is to leave it: see the `ReducedMotion` skips
 * on `safety-block` and `escalation-handoff`.
 * ---------------------------------------------------------------------- */

/** Decorative stand-in for the optional `art` slot; a real placement passes a product shot. */
function PromoArt() {
  return (
    <div
      aria-hidden
      className="bg-foreground/10 text-foreground flex aspect-video w-full items-center justify-center text-xs"
    >
      Release notes
    </div>
  );
}

/**
 * Right-to-left. Two pieces of this card are positioned rather than laid out,
 * and both used to be physical: the ✕ was pinned with `right-2`, and the
 * icon/text row reserved its gutter with `pr-6`. Under `dir="rtl"` that put
 * the ✕ on the left and the 24px of reserved space on the right — the gutter
 * and the thing it was reserved for on opposite sides of the card, with the
 * text running straight under the ✕.
 *
 * Both are now `end-2` / `pe-6`, which compile byte-identically in LTR and
 * mirror here. The play function reads geometry and computed padding rather
 * than class names, so a revert to the physical properties fails this story
 * instead of merely looking wrong in a screenshot.
 *
 * Nothing else needs mirroring. The flavour glyphs (sparkle, person, refresh,
 * triangle) carry no direction, and icon-before-text is a flex `gap`, which
 * flips on its own.
 */
export const RTL: Story = {
  args: {
    flavour: "upgrade",
    title: "Upgrade to Pro",
    description: "Unlock unlimited generations and priority rendering.",
    ctaLabel: "Upgrade",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => (
    <div dir="rtl" className="w-full">
      <PromoCard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="promo-card"]')!;
    const cardBox = card.getBoundingClientRect();

    // The ✕ pins to the logical end, which under dir="rtl" is the left edge.
    const dismissBox = canvas.getByRole("button", { name: "Dismiss" }).getBoundingClientRect();
    await expect(dismissBox.left - cardBox.left).toBeLessThan(cardBox.right - dismissBox.right);

    // …and the gutter reserved for it moved to the same side, on every line
    // of the text column rather than only the first.
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="promo-card-title"]')!.parentElement!
      .parentElement!;
    const rowStyle = getComputedStyle(row);
    await expect(rowStyle.paddingLeft).toBe("24px");
    await expect(rowStyle.paddingRight).toBe("0px");

    // The CTA's `self-start` follows the writing direction too, so the whole
    // card mirrors and not just the two properties changed above.
    const ctaBox = canvas.getByRole("button", { name: "Upgrade" }).getBoundingClientRect();
    await expect(cardBox.right - ctaBox.right).toBeLessThan(ctaBox.left - cardBox.left);
  },
};

/**
 * Two stops, and their order is the part worth pinning: the ✕ is rendered
 * before `CardContent`, so a keyboard user reaches "Dismiss" first and the CTA
 * second — the reverse of the visual reading order, where the ✕ floats in a
 * corner and the CTA sits at the bottom. For an ambient card nobody asked
 * for, that is the right order: the first thing a keyboard user can do with
 * an unsolicited promo is get rid of it.
 *
 * Open gap, deliberately not asserted: where focus goes when the card is
 * dismissed. `PromoCard` returns `null` the moment `dismissed` flips, so the
 * ✕ that had focus leaves the document and focus falls back to `<body>` — the
 * keyboard user loses their place and tabs again from the top of the page.
 * The component cannot fully own the fix (it does not know what surrounds it),
 * and no prop today lets a consumer hand it a focus target. Recorded rather
 * than pinned: asserting focus lands on `<body>` would lock in the behaviour
 * a fix has to change.
 */
export const KeyboardOrder: Story = {
  args: {
    flavour: "invite",
    title: "Invite your team",
    description: "Projects are better with collaborators. Invites are free.",
    ctaLabel: "Invite teammates",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const [first, second] = canvas.getAllByRole("button");
    await expect(first).toHaveAccessibleName("Dismiss");
    await expect(second).toHaveAccessibleName("Invite teammates");

    // The new KeyboardOrder must-show: every stop is visibly focused.
    let stops = 0;
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      // The ring is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(focused);
      stops += 1;
      await userEvent.tab();
    }
    await expect(stops).toBe(2);
  },
};

// Deliberately does NOT persist: `dismissed` is pinned to false so the story
// below can show what a promo card does when its host ignores the dismissal.
function IgnoredDismissal({ onDismiss, ...props }: PromoCardProps) {
  const [attempts, setAttempts] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <PromoCard
        {...props}
        dismissed={false}
        onDismiss={() => {
          setAttempts((n) => n + 1);
          onDismiss();
        }}
      />
      <p className="text-foreground text-xs">
        {`dismissed held at false — ${attempts} dismiss ${attempts === 1 ? "call" : "calls"} ignored`}
      </p>
    </div>
  );
}

/**
 * The host above deliberately ignores the dismissal: it counts the call and
 * re-renders with `dismissed` still `false`, so clicking ✕ does nothing
 * visible. That is not a broken story — it is the rendered form of the docs
 * page's first don't. `dismissed`/`onDismiss` is a controlled pair, and a
 * consumer who wires `onDismiss` to a value that resets (a `useState` that
 * starts false, a session flag) ships exactly this: a ✕ that is decorative.
 *
 * The counter is what makes the two halves separable. It proves the callback
 * fired *and* the component re-rendered, while the card stayed put — so the
 * card leaving is attributable to the `dismissed` prop moving and to nothing
 * else. `Upgrade` above is the same component with the state wired up; the
 * only difference between them is who owns the boolean.
 */
export const Controlled: Story = {
  args: {
    flavour: "update-available",
    title: "Update available",
    description: "Version 2.4 adds faster exports and a new brush engine.",
    ctaLabel: "Update now",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => <IgnoredDismissal {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("dismissed held at false — 0 dismiss calls ignored")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));

    // The callback fired and the tree re-rendered…
    await expect(canvas.getByText("dismissed held at false — 1 dismiss call ignored")).toBeInTheDocument();
    // …and the card is still on screen, because `dismissed` never moved.
    await expect(canvas.getByText("Update available")).toBeInTheDocument();

    // A second render with `dismissed` unchanged holds it fixed just the same.
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await expect(canvas.getByText("dismissed held at false — 2 dismiss calls ignored")).toBeInTheDocument();
    await expect(canvas.getByText("Update available")).toBeInTheDocument();
  },
};

/**
 * Every optional slot omitted: no `description`, no `art`, and — the one that
 * actually removes the button — no `onCtaClick`. `ctaLabel` is passed here on
 * purpose and renders nothing, which is the pitfall the docs page states in
 * prose: the CTA is opt-in on the handler, so a promo can never ship a button
 * that goes nowhere.
 *
 * What is left is a flavour glyph, one line of title, and the ✕ — which is now
 * the card's only control, and is icon-only. This is where a lost `aria-label`
 * shows up as a button with no accessible name at all, with no second button
 * on the card to hide behind and no visible text to fall back on.
 */
export const EmptyLabel: Story = {
  args: {
    flavour: "invite",
    title: "Invite your team",
    ctaLabel: "Invite teammates",
    onDismiss: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(1);
    await expect(buttons[0]).toHaveAccessibleName("Dismiss");
    // ctaLabel without onCtaClick renders no button, not a dead one.
    await expect(canvas.queryByText("Invite teammates")).not.toBeInTheDocument();
  },
};

/**
 * ~90 characters in each author-supplied slot, in a card capped at `max-w-sm`.
 * Neither slot truncates: `leading-snug` text wraps and the card grows
 * downward, which is the right answer for a sidebar promo — a truncated pitch
 * is a pitch nobody finishes reading.
 *
 * The fact only visible here is the gutter. `pe-6` sits on the row holding the
 * glyph and the text column, not on the first line, so *every* wrapped line is
 * inset 24px from the end edge — not just the one that would otherwise run
 * under the floating ✕. The CTA is a sibling of that row and is not inset, so
 * it starts at the content edge and can sit wider than the paragraph above it.
 * At three or four wrapped lines that reads as a deliberate measure rather
 * than a mistake, which is why the gutter has not been narrowed to line one.
 */
export const LongContent: Story = {
  args: {
    flavour: "quota-warning",
    title: "You have used 90% of this month's generation credits, with 11 days left in the cycle",
    description:
      "Generations pause when the cap is reached; upgrading or adding credits resumes them immediately.",
    ctaLabel: "Manage usage",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
};

/**
 * 375px. `PromoCard` is `w-full max-w-sm` — 384px — so at this width the cap
 * never binds and the card simply fills the column. That is what lets the same
 * component serve a desktop rail and a mobile drawer without a variant.
 *
 * `art` is exercised here rather than anywhere else because it is the slot
 * most likely to break the box: it is consumer-supplied and lands inside an
 * `overflow-hidden rounded-lg` wrapper, so anything wider than the card is
 * clipped rather than allowed to push the layout sideways. The stand-in below
 * is a plain block; a real product shot behaves the same, because the clipping
 * belongs to the component and not to the asset.
 */
export const Mobile: Story = {
  args: {
    flavour: "update-available",
    title: "Version 2.4 is ready to install",
    description: "Faster exports and a new brush engine. Restart to finish installing.",
    art: <PromoArt />,
    ctaLabel: "Update now",
    onCtaClick: () => {},
    onDismiss: () => {},
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <PromoCard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="promo-card"]')!;
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

/**
 * Three dismissible cards that look alike and are not interchangeable. The
 * rule is about what the card is *for*, not how it is shaped:
 *
 * - **Promo card** sells something the user does not have yet — a plan, a
 *   seat, an install, more headroom. It is unprovoked: nothing on screen
 *   changed, and no action was blocked. It only ever asks.
 * - **Recommendation card** (C5) proposes a next action *inside* the product
 *   and shows its work — which apps it touches, and numbered steps behind
 *   "How it works" — plus Save for later, so dismissal is not the only exit.
 *   The pitch is "run this", not "buy this".
 * - **Feature announcement** (L3) reports a change that already happened. It
 *   is news, keyed by an `id` so it never re-shows, with nothing to buy and
 *   nothing to run.
 *
 * If the user gains a capability by paying or inviting, it is a promo. If they
 * gain an outcome by running something, it is a recommendation. If the product
 * already changed and they only need to know, it is an announcement.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Promo card — sells a capability</p>
        <PromoCard
          flavour="upgrade"
          title="Upgrade to Pro"
          description="Unlock unlimited generations and priority rendering."
          ctaLabel="Upgrade"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recommendation card — suggests a next action</p>
        <RecommendationCard
          title="Batch-export last week's renders"
          description="Runs the export preset across everything in the Drafts folder."
          apps={["Renders", "Exports"]}
          steps={[
            "Pick the Drafts folder as the source",
            "Choose an export preset",
            "Queue the batch and leave it running",
          ]}
          onTry={() => {}}
          onSaveForLater={() => {}}
          onDismiss={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Feature announcement — reports a change</p>
        <FeatureAnnouncement
          id="brush-engine-2-4"
          level="inline-card"
          stage="New"
          title="New brush engine"
          description="Version 2.4 replaces the brush engine and makes exports faster."
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
};
