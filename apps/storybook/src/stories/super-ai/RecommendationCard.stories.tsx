import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { RecommendationCard, type RecommendationCardProps } from "@/registry/super-ai/recommendation-card";
import { RecommendationCardDocs } from "@/content/components/recommendation-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

const meta: Meta<typeof RecommendationCard> = {
  title: "Super AI/Recommendation Card",
  component: RecommendationCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RecommendationCardDocs) } },
};

export default meta;
type Story = StoryObj<typeof RecommendationCard>;

const BASE_ARGS = {
  title: "Automate your weekly report",
  description: "Zapier can pull last week's numbers into Sheets and post a summary to Slack.",
  apps: ["Sheets", "Slack"],
  steps: [
    "Connect your Sheets and Slack accounts",
    "Pick which sheet holds this week's numbers",
    "Review the summary format and turn it on",
  ],
  onTry: () => {},
  onSaveForLater: () => {},
  onDismiss: () => {},
} satisfies Partial<RecommendationCardProps>;

// RecommendationCard is controlled — it owns none of the dismissed/saved
// state itself. These play tests need the card to actually reflect a click,
// so this wrapper stands in for the persistence a real consumer would own.
function ControlledRecommendationCard(props: RecommendationCardProps) {
  const [dismissed, setDismissed] = useState(props.dismissed ?? false);
  const [saved, setSaved] = useState(props.saved ?? false);
  return (
    <RecommendationCard
      {...props}
      dismissed={dismissed}
      onDismiss={() => {
        setDismissed(true);
        props.onDismiss();
      }}
      saved={saved}
      onSaveForLater={() => {
        setSaved(true);
        props.onSaveForLater?.();
      }}
    />
  );
}

export const Collapsed: Story = {
  args: { ...BASE_ARGS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Automate your weekly report")).toBeInTheDocument();
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Try it" })).toHaveAttribute("aria-expanded", "false");
  },
};

export const Expanded: Story = {
  args: { ...BASE_ARGS, defaultOpen: true },
  play: async ({ canvasElement }) => {
    // The dialog renders in a portal, outside canvasElement, so this story
    // asserts against the document rather than the story canvas.
    const dialog = await within(document.body).findByRole("dialog", { name: "Automate your weekly report" });
    await expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
  },
};

export const Dismissible: Story = {
  args: { ...BASE_ARGS },
  render: (args) => <ControlledRecommendationCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Automate your weekly report")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));

    await expect(canvas.queryByText("Automate your weekly report")).not.toBeInTheDocument();
  },
};

export const SaveForLater: Story = {
  args: { ...BASE_ARGS },
  render: (args) => <ControlledRecommendationCard {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: "Save for later" });

    await userEvent.click(save);

    await expect(canvas.getByRole("button", { name: "Saved" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Save for later" })).not.toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Nothing is skipped: all eight are true here. The two that are usually not
 * are worth saying out loud rather than leaving to the reader.
 *
 * `ReducedMotion` is true because the modal is a Base UI popup that animates
 * on open — but the branch had to be *created* before a story could document
 * it, and that fix is in the registry file, not here.
 *
 * `EmptyLabel` is true on the optional-text-slot reading rather than the
 * missing-accessible-name one: `description`, `icon` and `apps` are all
 * optional and all omittable together. Every accessible name in this
 * component is defaulted instead (`dismissLabel`, `triggerLabel`,
 * `saveLabel`, `savedLabel`, `commitLabel`), so the only route to an
 * unlabelled control is a caller passing `""` — a caller error that would
 * ship an axe `button-name` violation into a gate running at `test: "error"`,
 * and that belongs in the docs page's donts.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The row's directional decision is the dismiss control: it is
 * absolutely positioned, so it does not mirror on its own, and the padding
 * that keeps the title clear of it has to move with it or the two come apart.
 * Both are logical properties (`end-2`, `pe-6`) as of this story — physical
 * `right-2`/`pr-6` left the X sitting where an RTL reader's title *starts*,
 * with 24px of empty gutter reserved on the far side. The play function pins
 * the pair by geometry rather than by class name, so a regression to either
 * physical form fails here instead of shipping.
 *
 * Two things this story deliberately does not cover. The modal portals to
 * `document.body`, so a `dir="rtl"` wrapper in the canvas is never its
 * ancestor — the numbered `<ol>` and the footer are plain flex rows that
 * mirror correctly, but seeing that needs the document-level treatment
 * `ShortcutsSheet.stories.tsx` uses. And the modal's own close button is
 * `absolute top-2 right-2` in `components/ui/dialog.tsx`, shared by every
 * dialog in the repo and not this component's to fix.
 */
export const RTL: Story = {
  args: { ...BASE_ARGS },
  render: (args) => (
    <div dir="rtl" className="w-full max-w-sm">
      <RecommendationCard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="recommendation-card"]')!;
    const dismiss = within(canvasElement).getByRole("button", { name: "Dismiss" });

    const cardBox = card.getBoundingClientRect();
    const dismissBox = dismiss.getBoundingClientRect();

    // Mirrored: the dismiss control sits against the card's *left* edge under
    // RTL, which is its inline-end. Measured as a comparison rather than a
    // pixel value so it survives any padding change.
    await expect(dismissBox.left - cardBox.left).toBeLessThan(cardBox.right - dismissBox.right);

    // …and the title starts at the opposite edge, clear of it.
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="recommendation-card-title"]')!;
    await expect(title.getBoundingClientRect().right).toBeGreaterThan(dismissBox.right);
  },
};

/**
 * The reduced-motion branch, which did not exist until this story went
 * looking for it. `DialogContent` opens with `data-open:animate-in
 * zoom-in-95` and neither half reads the media feature, so the modal zoomed
 * in for a reduced-motion user exactly as it does for everyone else.
 *
 * The registry's usual one-class remedy — a bare `motion-reduce:animate-none`
 * beside the `animate-*`, as `task-tray` and `trace-timeline` use — is inert
 * on a Base UI popup and inert *silently*: Tailwind v4 wraps the
 * data-attribute test in `:where()`, so both classes are one class of
 * specificity and the tie falls to source order, which Tailwind emits in the
 * plain variant's favour. Restating the variant on both halves
 * (`motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`)
 * sorts after its counterpart and wins. `recommendation-card` is one of the
 * 33 components CONTINUE.md §9 lists as carrying this shape; measured here
 * before the fix, `animation-name` read back `"enter"`.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every
 * test, so the assertion below is the rendered result rather than a
 * class-name check — which is the only form that can tell the two apart.
 *
 * Not covered: the backdrop still fades. `DialogOverlay`'s animation classes
 * live in `components/ui/dialog.tsx`, which this component cannot reach
 * through `className`.
 */
export const ReducedMotion: Story = {
  args: { ...BASE_ARGS, defaultOpen: true },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toHaveAttribute("data-open");
    await expect(getComputedStyle(dialog).animationName).toBe("none");
  },
};

/**
 * The tab sequence, and the one question this component owns: what a
 * dismissal does to focus.
 *
 * What is pinned:
 *
 * 1. Three stops on the row, in DOM order — Dismiss, Try it, Save for later.
 *    Dismiss is first because it is rendered first, even though it paints in
 *    the corner: a keyboard user meets the way out before the offer, which is
 *    the right order for an unsolicited card.
 * 2. Every stop matches `:focus-visible` and paints a ring or an outline.
 * 3. The row is not a trap — tabbing off Save for later leaves the card.
 * 4. Opening from the keyboard moves focus into the modal, which has three
 *    stops of its own (Save for later, Get started, Close) and traps them.
 *    The walk is one lap, not a budget: `settledStop` waits for Base UI's
 *    trailing focus guard to finish redirecting before reading
 *    `document.activeElement`, which is the race written up as mechanical
 *    fact 4 in story-conventions.md.
 * 5. Escape closes the modal and returns focus to Try it. Base UI restores it
 *    correctly here, so it is asserted rather than described — the same
 *    holds for committing with Get started.
 *
 * **Recorded, not asserted: dismissing the card drops focus to
 * `document.body`.** `dismissed` unmounts the whole card (`if (dismissed)
 * return null`) and nothing moves focus first, so a keyboard user who
 * dismisses the second recommendation in a feed is returned to the top of the
 * document and has to traverse back. Measured rather than assumed: with the
 * dismiss button focused and Enter pressed, `document.activeElement` is
 * `<body>` immediately after and still `<body>` a frame later, so this is not
 * the focus-guard race above — no portal is involved. It is the same shape as
 * E6 `generation-queue`'s resolved-row finding (CONTINUE.md §9) and it is
 * deliberately not pinned by an assertion, because asserting it would make it
 * permanent. The component cannot know what should receive focus next — the
 * feed is the consumer's — but it can say so, and neither `onDismiss`'s
 * documentation nor the docs module's pitfalls mentions it today. B5
 * `promo-card` has the identical shape.
 */
export const KeyboardOrder: Story = {
  args: { ...BASE_ARGS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="recommendation-card"]')!;

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : (el.getAttribute("data-slot") ?? el.tagName);

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      // The treatment is measured rather than merely present — see
      // `expectPerceptibleFocus`.
      await expectPerceptibleFocus(el, { label: id });
    };

    // --- the row ---
    const rowStops = Array.from(card.querySelectorAll<HTMLElement>("button"));
    await expect(rowStops.map(nameOf)).toEqual([
      "recommendation-card-dismiss",
      "recommendation-card-trigger",
      "recommendation-card-save",
    ]);

    await userEvent.tab();
    for (const stop of rowStops) {
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await assertVisiblyFocused(stop);
      await userEvent.tab();
    }
    // Not a trap: the last tab left the card entirely.
    await expect(card.contains(document.activeElement)).toBe(false);

    // --- the modal ---
    const trigger = canvas.getByRole("button", { name: "Try it" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await within(document.body).findByRole("dialog");

    const dialogStops = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
    );
    await expect(dialogStops.map(nameOf)).toEqual([
      "recommendation-card-save",
      "recommendation-card-commit",
      "dialog-close",
    ]);

    /**
     * The focused stop, once Base UI has finished moving focus. Tabbing off
     * the last stop lands on the popup's trailing focus guard, whose
     * `onFocus` re-enters the panel through a `requestAnimationFrame` — so an
     * immediate read returns either the guard or its destination depending on
     * whether the frame painted, and a walk that counts the miss steps over
     * the stop the redirect had just reached.
     */
    const settledStop = async () => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!dialogStops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the modal's stops: ${nameOf(active)}`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    // A portal focuses its own first tabbable descendant on open, so the walk
    // is seeded from where focus actually landed rather than from stop zero.
    const start = await settledStop();
    await expect(nameOf(start)).toBe(nameOf(dialogStops[0]));
    await assertVisiblyFocused(start);

    const seen = new Set<HTMLElement>([start]);
    for (let i = 1; i < dialogStops.length; i += 1) {
      await userEvent.tab();
      const focused = await settledStop();
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(dialogStops.length);

    // Trapped: the tab past the last stop closes the lap on the first one
    // rather than leaking to the inert row behind the modal.
    await userEvent.tab();
    await expect(nameOf(await settledStop())).toBe(nameOf(start));

    // Escape dismisses the modal and the trigger gets the ring back — the
    // half of "where focus returns" that this component gets right.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * Three controlled pairs, one story, and a parent that refuses all three.
 * `dismissed`/`onDismiss`, `saved`/`onSaveForLater` and `open`/`onOpenChange`
 * are each fully controlled — the component renders the choice, the consumer
 * owns persisting it — and that claim is only worth anything if the component
 * genuinely holds still when the consumer does not apply the change.
 *
 * The parent below records every request and re-renders with all three values
 * unchanged. So each assertion is really two: the callback fired with what a
 * consumer needs to act on, and the interaction alone moved nothing. That is
 * the difference between "Save for later flips to Saved" and "Save for later
 * flips to Saved *because you fed `saved` back in*" — the third pitfall in
 * the docs module, made mechanical.
 *
 * `onDismiss` and `onSaveForLater` take no argument, so the payload is the
 * call itself; `onOpenChange` carries the boolean. The probe is read by test
 * id because a rejected dismiss leaves a card that is still in the DOM but
 * whose state lives entirely in the parent.
 */
export const Controlled: Story = {
  args: { ...BASE_ARGS },
  render: () => <RejectingParent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const calls = canvas.getByTestId("recommendation-card-calls");

    // Try it asks to open. The parent says no, so no modal is mounted at all.
    await userEvent.click(canvas.getByRole("button", { name: "Try it" }));
    await waitFor(() => expect(calls).toHaveTextContent("open:true"));
    await expect(within(document.body).queryByRole("dialog")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Try it" })).toHaveAttribute("aria-expanded", "false");

    // Save asks to be saved. The button does not flip itself.
    await userEvent.click(canvas.getByRole("button", { name: "Save for later" }));
    await waitFor(() => expect(calls).toHaveTextContent("open:true,save"));
    await expect(canvas.getByRole("button", { name: "Save for later" })).toBeEnabled();
    await expect(canvas.queryByRole("button", { name: "Saved" })).not.toBeInTheDocument();

    // Dismiss asks to be hidden. The card does not remove itself.
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(calls).toHaveTextContent("open:true,save,dismiss"));
    await expect(canvas.getByText(BASE_ARGS.title)).toBeInTheDocument();
  },
};

function RejectingParent() {
  const [calls, setCalls] = useState<string[]>([]);
  const record = (call: string) => setCalls((previous) => [...previous, call]);

  return (
    <>
      {/* A probe, not a control — the three values it reports never change. */}
      <output data-testid="recommendation-card-calls" className="sr-only">
        {calls.join(",")}
      </output>
      <RecommendationCard
        {...BASE_ARGS}
        open={false}
        onOpenChange={(next) => record(`open:${next}`)}
        saved={false}
        onSaveForLater={() => record("save")}
        dismissed={false}
        onDismiss={() => record("dismiss")}
      />
    </>
  );
}

/**
 * Every optional slot emptied: no `description`, no `icon`, no `apps` — a
 * title and its steps, which is all the component requires. This is the shape
 * a feed shows when the recommendation has a name but no generated teaser,
 * and the prop docs' claim that "a bare title still reads fine" is only
 * checkable here.
 *
 * What it changes downstream is the part worth seeing: with `description`
 * omitted the modal renders no `DialogDescription`, so the dialog has no
 * accessible description at all and the title carries the whole pitch — the
 * apps row disappears from both levels too, leaving "How it works" as the
 * only evidence a user gets before committing. A recommendation stripped this
 * far is close to the instruction the spec says it must not become; the steps
 * are what keep it auditable, which is why they are required and the teaser
 * is not.
 */
export const EmptyLabel: Story = {
  args: {
    title: "Summarize this week's changes",
    steps: ["Pick the folder to summarize", "Choose how far back to look", "Review the summary and turn it on"],
    onTry: () => {},
    onSaveForLater: () => {},
    onDismiss: () => {},
  },
};

/**
 * An ~85-character title and a ~95-character teaser, which is what arrives the
 * first time recommendations are generated rather than written by hand.
 *
 * The row's answer is to wrap, not truncate: the title is
 * `text-sm leading-snug font-medium` with no `truncate` or `line-clamp`
 * anywhere, inside a card capped at `max-w-sm`, so a long title grows the card
 * downward and the one-line row the spec describes becomes a three-line one.
 * Nothing is hidden, which is the right trade for a card whose whole argument
 * is legibility — but it is also why a feed of these cards loses its rhythm as
 * soon as titles run long.
 *
 * The same string is reused as the modal's `DialogTitle` (one source, two
 * renders), where `font-heading text-base` against `sm:max-w-sm` wraps it
 * again, and the long step below wraps beside its number rather than pushing
 * the digit out of line — the numbered column is `shrink-0`, the text is not.
 */
export const LongContent: Story = {
  args: {
    ...BASE_ARGS,
    title: "Turn last week's numbers into a Monday morning summary and post it before the standup",
    description: "Reads the sheet you updated on Friday, writes the summary, and posts it to the channel you pick.",
    steps: [
      "Connect your Sheets and Slack accounts",
      "Review the summary format and confirm which channel it posts to before turning it on",
    ],
  },
};

/**
 * 375px, wrapper-constrained. The card is `w-full max-w-sm`, so this is the
 * first width at which it is narrower than its cap and the row's own layout
 * decisions start to matter: the actions row is `flex flex-wrap`, so Try it
 * and Save for later stay on one line here and would stack rather than clip
 * if either label grew, and the apps row wraps by the same rule.
 *
 * The assertion is the point — no horizontal scroll — because the dismiss
 * control is absolutely positioned and the padding that clears it (`pe-6`) is
 * the only thing keeping a long title from running underneath it at this
 * width.
 *
 * What this cannot reach: the modal is portaled and `position: fixed`, so it
 * measures against the viewport, not this wrapper, and its footer's
 * `sm:flex-row` breakpoint answers to the real window. A narrow-viewport
 * rendering of the modal needs a viewport the gate does not set — see
 * mechanical fact 2 in story-conventions.md.
 */
export const Mobile: Story = {
  args: { ...BASE_ARGS },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <RecommendationCard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="recommendation-card"]')!;
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

/**
 * Three dismissible cards that look alike and mean different things. Seen
 * from this component's seat, the rule is about **what the card asks you to
 * do, and what happens if you say not now**:
 *
 * - **Promo card** (B5) sells a capability you do not have — a plan, a seat,
 *   an install. Nothing on screen changed and no action was blocked; it only
 *   ever asks, and Dismiss is the only way out.
 * - **Recommendation card** (C5) proposes a next action *inside* the product
 *   and shows its work before you take it: which apps it touches, and
 *   numbered steps behind "How it works". It is the only one of the three
 *   with a middle option — Save for later — because it is the only one whose
 *   answer can legitimately be "later".
 * - **Feature announcement** (L3) reports a change that already happened.
 *   There is nothing to buy and nothing to run; the stage badge sets
 *   expectations and the `id` keeps it from re-showing.
 *
 * The deciding question is what the user gains: a capability by paying, an
 * outcome by running something, or only knowledge. If the card has steps you
 * could audit before committing, it is a recommendation — and if it has no
 * middle option, it should not be one.
 *
 * **What rendering all three together shows, and nothing else does:** two of
 * the dismiss controls are called plain "Dismiss". `feature-announcement`
 * defaults its own to name the announcement ("Dismiss announcement: New brush
 * engine") precisely because several can share a screen — and a feed of
 * recommendations is exactly that case. A screen-reader user meeting three
 * cards hears "Dismiss, Dismiss" and one useful name. Recorded, not fixed:
 * changing the default is an API change and would break the shipped unit
 * test's `{ name: "Dismiss" }` lookups, and `promo-card` (B5) needs the same
 * decision made with it, not around it.
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
        <p className="text-foreground text-xs font-medium">
          Recommendation card — suggests a next action, and shows its steps
        </p>
        <RecommendationCard {...BASE_ARGS} />
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

