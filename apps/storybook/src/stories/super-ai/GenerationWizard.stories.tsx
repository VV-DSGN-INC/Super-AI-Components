import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { GenerationWizard, type GenerationWizardStep } from "@/registry/super-ai/generation-wizard";
import { OnboardingWizard } from "@/registry/super-ai/onboarding-wizard";
import { GenerationWizardDocs } from "@/content/components/generation-wizard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GenerationWizard> = {
  title: "Super AI/Generation Wizard",
  component: GenerationWizard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationWizardDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenerationWizard>;

const STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    description: "Pick the engine this generation runs on.",
    content: (
      <ChoiceChips defaultValue="fast">
        <ChoiceChip value="fast">Fast</ChoiceChip>
        <ChoiceChip value="quality">Quality</ChoiceChip>
      </ChoiceChips>
    ),
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Fast model</p>
        <CostChip amount={2} className="text-foreground" />
      </div>
    ),
  },
  {
    id: "style",
    title: "Set style",
    description: "Applied to every frame in this generation.",
    content: (
      <ChoiceChips defaultValue="cinematic">
        <ChoiceChip value="cinematic">Cinematic</ChoiceChip>
        <ChoiceChip value="anime">Anime</ChoiceChip>
      </ChoiceChips>
    ),
    preview: <p className="text-foreground text-center text-sm">Cinematic, 16:9, +1 credit</p>,
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm before spending credits.",
    content: <p className="text-foreground text-sm">Fast model · Cinematic style · 1 clip</p>,
    preview: (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Total cost</p>
        <CostChip amount={3} className="text-foreground" />
      </div>
    ),
  },
];

/**
 * The stepper: position and total are exposed programmatically — the step
 * list carries an accessible name of "Step 1 of 3" and the current step
 * carries `aria-current` — rather than being left to the marker trail, which
 * is decoration a screen reader never sees. Both the number and the check
 * glyph are `aria-hidden`, so shape and colour are the sighted half of a
 * fact the ordered list and `aria-current` carry on their own.
 */
export const Stepper: Story = {
  args: { steps: STEPS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas.getByRole("list", { name: "Step 1 of 3" });
    await expect(stepper).toBeInTheDocument();
    // Scoped to the stepper itself: the active step's title ("Choose model")
    // is also echoed as the section-header heading for the content below it,
    // so an unscoped canvas.getByText would match both and throw.
    const current = within(stepper).getByText("Choose model").closest("[data-slot='generation-wizard-step']");
    await expect(current).toHaveAttribute("aria-current", "step");
  },
};

/**
 * The preview pane: it reflects the *active* step's choices, which is the
 * whole difference between this and a form cut into pages — the cost of a
 * wrong choice is visible before Next rather than after Generate. Started
 * mid-flow, so the pane is proved to be step two's consequence rather than
 * step one's carried forward.
 */
export const PreviewPane: Story = {
  args: { steps: STEPS, defaultStep: "style" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = canvasElement.querySelector('[data-slot="generation-wizard-preview"]');
    await expect(preview).toHaveTextContent("Cinematic, 16:9, +1 credit");
    await expect(canvas.getByRole("list", { name: "Step 2 of 3" })).toBeInTheDocument();
  },
};

/**
 * The nav row, started on the middle step so all three controls exist at
 * once. The hierarchy is the point: Back and Skip are both `outline` and only
 * the primary is filled, so a user scanning for "the way forward" finds
 * exactly one candidate. Back is live here and `disabled` on step one; Skip
 * is here and gone on the last step, where the primary commits instead of
 * continuing.
 */
export const SkipBackPrimary: Story = {
  args: { steps: STEPS, defaultStep: "style" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const back = canvas.getByRole("button", { name: "Back" });
    const skip = canvas.getByRole("button", { name: "Skip" });
    const next = canvas.getByRole("button", { name: "Next" });
    await expect(back).toHaveAttribute("data-slot", "generation-wizard-back");
    await expect(skip).toHaveAttribute("data-slot", "generation-wizard-skip");
    await expect(next).toHaveAttribute("data-slot", "generation-wizard-primary");
    await expect(back).not.toBeDisabled();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this wizard meets in a product, as opposed
 * to the three regions above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. Worth stating what the component is *not*:
 * the catalog and the spec both name Dialog as a base, and
 * `generation-wizard.tsx` mounts none — it is a plain `div` a caller puts
 * inside whatever surface it owns. So none of the Base UI portal machinery
 * applies here. There are no focus guards to settle around, no
 * `data-open:animate-in` pair to restate, and `document.activeElement` can be
 * read straight after a tab: mechanical fact 4 is about portals, and this is
 * not one.
 *
 * // case-skip: ReducedMotion — the wizard owns no animation or transition, and the two things in its tree that do move are not its branch
 * `generation-wizard.tsx` carries no `animate-*` and no `transition-*` class
 * at all; a step change is an unanimated swap of the content and preview
 * nodes. Two things in the composed tree move, and neither is a branch this
 * component could own. The shared `Button` primitive carries `transition-all`
 * plus a one-pixel `active:` nudge, which CONTINUE.md §8 records as a
 * library-wide press posture rather than any one component's — no case story
 * adds a `motion-reduce:` class for it. And `choice-chips`, used as demo
 * field content here, already carries its own `motion-reduce:transition-none`
 * beside its `transition-colors`. Since `vitest.config.ts` forces
 * `reducedMotion: "reduce"` on every test anyway, a ReducedMotion story would
 * render pixel-identical to `SkipBackPrimary` and imply a branch that does
 * not exist.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Two orderings have to mirror together and between them they
 * are the whole layout: the stepper runs first-step-to-last in reading order,
 * and the nav row puts Back at the inline start with Skip and the primary at
 * the inline end.
 *
 * Both mirror for free, and the reason is worth recording —
 * `generation-wizard.tsx` contains no physical inline utility anywhere (no
 * `pl-`, `ml-`, `border-l`, `left-`, `text-left`). The stepper is a plain
 * `flex` `<ol>` with a symmetric `mx-2` connector and the nav is `flex
 * justify-between`, so there is nothing here for the logical-property sweep
 * in CONTINUE.md §8 to swap. The check glyph is the only icon and it is not
 * directional.
 *
 * **What does not mirror is the vendored `ButtonGroup` around Skip and the
 * primary.** `components/ui/button-group.tsx` joins its children with
 * physical classes — `*:data-slot:rounded-r-none`, `rounded-r-lg!`,
 * `rounded-l-none`, `border-l-0` — and those are resolved against the
 * viewport, not the writing direction. Measured here under `dir="rtl"`, where
 * Skip paints to the right of the primary: Skip keeps 10px radii on its left
 * (the seam) and 0 on its right (the group's outer edge), the primary is the
 * mirror of that, and the `border-l-0` join removes the border from the
 * group's outer left edge while leaving two borders stacked at the seam. So
 * the pair reads as two separate controls that happen to touch, with one
 * outer edge missing its border.
 *
 * Not asserted below: asserting today's values would pin them. The fix is
 * logical radius and border utilities in the vendored primitive, where it
 * would repair every `ButtonGroup` in the registry at once — not something a
 * case story on one consumer of it should sweep.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-full max-w-3xl">
      <GenerationWizard {...args} steps={STEPS} defaultStep="style" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas.getByRole("list", { name: "Step 2 of 3" });
    const markers = Array.from(stepper.querySelectorAll<HTMLElement>('[data-slot="generation-wizard-step"]'));
    await expect(markers).toHaveLength(3);

    // Mirrored, not merely reordered in the DOM: step one paints at the right
    // edge and step three at the left.
    await expect(markers[0].getBoundingClientRect().left).toBeGreaterThan(
      markers[2].getBoundingClientRect().left,
    );

    // The nav row flips with it — Back trails the forward pair rather than
    // leading it.
    const back = canvas.getByRole("button", { name: "Back" });
    const forward = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard-nav-forward"]')!;
    await expect(back.getBoundingClientRect().left).toBeGreaterThan(forward.getBoundingClientRect().left);
  },
};

/**
 * The tab sequence, which is where all three of this component's spec bullets
 * land. Three facts, none of them visible on screen:
 *
 * 1. **The stepper's tabbability is positional.** Only a completed step is a
 *    `<button>`; current and upcoming steps are `<span>`s. So the step list
 *    has zero tab stops on step one and gains one per step behind you. This
 *    story starts on step two, walks a one-stop stepper, then goes back to
 *    step one and finds none — "completed steps stay clickable" expressed as
 *    a keyboard fact rather than a hover affordance.
 * 2. **The lap is provable rather than counted inside an allowance.** Every
 *    stop is asserted to be the expected element *and* to carry a visible
 *    ring, and one closing tab is asserted to leave the wizard entirely.
 * 3. **Advancing or retreating a step does not drop focus.** Back changes
 *    meaning under the finger — it disables itself on arrival at step one —
 *    and Skip unmounts outright on the last step; either would strand focus
 *    on `<body>`. `generation-wizard.tsx` forestalls both by focusing the new
 *    step's title on every change of the active step.
 *
 * **Recorded, not asserted:** that title is a `<span tabIndex={-1}>` carrying
 * `outline-none`, and it *does* match `:focus-visible` when the move lands —
 * the browser is asking for an indicator and getting `outlineStyle: "none"`,
 * `boxShadow: "none"`. So the move a screen-reader user hears is invisible to
 * a sighted keyboard user: focus is somewhere and nothing on screen says
 * where. The ring check below skips that one element deliberately, and the
 * assertion at step 5 pins only the half that survives a fix. Giving the
 * target a ring is a design decision — a focus ring around a heading is
 * unusual chrome — which makes it a gap rather than a sweep.
 */
export const KeyboardOrder: Story = {
  args: { steps: STEPS, defaultStep: "style" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard"]')!;
    const stepper = canvas.getByRole("list", { name: "Step 2 of 3" });

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `${el.tagName.toLowerCase()}[${el.textContent?.trim().slice(0, 24) ?? ""}]`;

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // 1. On step two the stepper contributes exactly one stop: step one,
    //    completed and therefore a button. Steps two and three are spans.
    await expect(stepper.querySelectorAll("button")).toHaveLength(1);

    // The step title is the component's focus target, not part of the
    // sequence — tabIndex -1, reachable only by the focus move in step 4.
    const title = root.querySelector<HTMLElement>('[data-slot="section-header-title"] > span')!;
    await expect(title.tabIndex).toBe(-1);

    // 2. One lap: the completed step, the two field chips, then Back, Skip
    //    and the primary. Each tab moves by exactly one control.
    const expected = [
      canvas.getByRole("button", { name: "Completed: Choose model" }),
      canvas.getByRole("radio", { name: "Cinematic" }),
      canvas.getByRole("radio", { name: "Anime" }),
      canvas.getByRole("button", { name: "Back" }),
      canvas.getByRole("button", { name: "Skip" }),
      canvas.getByRole("button", { name: "Next" }),
    ];

    for (const stop of expected) {
      await userEvent.tab();
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await assertVisiblyFocused(stop);
    }

    // 3. …and one more tab leaves the wizard rather than cycling inside it.
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);

    // 4. Back disables itself on arrival, and focus does not fall to <body>
    //    when it does — it lands on the new step's title, inside the wizard.
    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(document.activeElement).toBe(title));
    await expect(canvas.getByRole("button", { name: "Back" })).toBeDisabled();

    // 5. On step one the stepper has no stops at all, and the first tab from
    //    the title resumes in the step body rather than back at the nav —
    //    the title sits above the fields, not beside the button just pressed.
    await expect(stepper.querySelectorAll("button")).toHaveLength(0);

    // The browser agrees this focus deserves an indicator — the title matches
    // :focus-visible. That is the half of the gap that is safe to assert: it
    // is true today and stays true once the treatment is added. What is
    // missing (outlineStyle "none", boxShadow "none" as measured here) is left
    // unasserted so a fix does not turn this story red.
    await expect(title.matches(":focus-visible")).toBe(true);

    await userEvent.tab();
    await expect(document.activeElement).toBe(canvas.getByRole("radio", { name: "Fast" }));
  },
};

/** A host that records what the wizard asks for and applies it only on demand. */
function ControlledShell() {
  const [applied, setApplied] = React.useState("model");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [leaving, setLeaving] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <GenerationWizard steps={STEPS} step={applied} onStepChange={setRequested} onNext={setLeaving} />
      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>step prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onStepChange</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>last onNext</dt>
        <dd data-testid="leaving">{leaving ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render host
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (requested) setApplied(requested);
          }}
        >
          Apply requested step
        </Button>
      </div>
    </div>
  );
}

/**
 * `step` / `onStepChange` is a real controlled pair, and this host holds it
 * the hard way: it records what the wizard asked for and applies it only when
 * told to.
 *
 * What that proves, in order: pressing Next does not advance the wizard on
 * its own; the callback still fires with the id of the step to move *to*,
 * which is what a host has to apply; a host re-render with an unchanged
 * `step` leaves the wizard where it was; and applying the request finally
 * moves it.
 *
 * Two things about the payload shape are worth knowing before wiring this up.
 * `onStepChange` fires for every route into a step change — the primary,
 * Skip, Back, and a click on a completed step marker — so a host that listens
 * to it alone gets the whole machine. `onNext` and `onSkip` fire with the
 * step being *left*, not the one being entered, so the two callbacks carry
 * different ids on the same press; this shell renders both side by side,
 * because conflating them is the likely first bug.
 *
 * **Recorded, not asserted:** the focus move fires on any change of the
 * active step, including one the host drives, and only the very first render
 * is exempt. So a host that persists wizard position across a page load and
 * applies it a tick after mount yanks focus into the wizard from wherever the
 * user was. Distinguishing a user-driven change from a host-driven one is an
 * API decision, not a class swap.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepName = () => canvas.getByRole("list").getAttribute("aria-label");

    await expect(stepName()).toBe("Step 1 of 3");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(stepName()).toBe("Step 1 of 3");
    await expect(canvas.getByTestId("applied")).toHaveTextContent("model");

    // 2. …but both callbacks fired, and with different ids: the destination
    //    on onStepChange, the step being left on onNext.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("style");
    await expect(canvas.getByTestId("leaving")).toHaveTextContent("model");

    // 3. A host re-render with `step` unchanged holds the wizard fixed.
    await userEvent.click(canvas.getByRole("button", { name: "Re-render host" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(stepName()).toBe("Step 1 of 3");

    // 4. Applying the request is the only thing that moves it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply requested step" }));
    await waitFor(() => expect(stepName()).toBe("Step 2 of 3"));
  },
};

const NO_DESCRIPTION_STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Choose model",
    content: (
      <ChoiceChips defaultValue="fast">
        <ChoiceChip value="fast">Fast</ChoiceChip>
        <ChoiceChip value="quality">Quality</ChoiceChip>
      </ChoiceChips>
    ),
    preview: <p className="text-foreground text-center text-sm">Fast model, 2 credits</p>,
  },
  {
    id: "style",
    title: "Set style",
    content: (
      <ChoiceChips defaultValue="cinematic">
        <ChoiceChip value="cinematic">Cinematic</ChoiceChip>
        <ChoiceChip value="anime">Anime</ChoiceChip>
      </ChoiceChips>
    ),
    // A step whose choices change nothing the user can be shown yet.
    preview: null,
  },
  {
    id: "review",
    title: "Review",
    content: (
      <p data-testid="fields" className="text-foreground text-sm">
        Fast model · Cinematic style · 1 clip
      </p>
    ),
    preview: <p className="text-foreground text-center text-sm">3 credits</p>,
  },
];

/**
 * Every optional text slot emptied at once: no step carries a `description`,
 * and the middle step's `preview` node is `null`.
 *
 * Two things hold. The description is a real branch, so with none supplied
 * the step body is its header and then its fields, with no empty paragraph
 * left behind reserving vertical space. And an empty preview does not
 * collapse the pane — `previewLabel` defaults to "Preview", so what a caller
 * gets is a labelled empty frame rather than a lopsided grid, which is the
 * right answer for a step whose consequence is not computable yet.
 *
 * The completed-step markers are the accessible-name case underneath this.
 * Once a step is behind you it becomes a button whose entire visible content
 * can be a check glyph: the glyph is `aria-hidden`, and below the `sm`
 * breakpoint the title collapses to `sr-only`. It stays named anyway, because
 * `sr-only` keeps the title in the accessible tree where `hidden` would drop
 * it — which is the reason that class pair is there rather than a `hidden
 * sm:inline`.
 *
 * The four button labels (`backLabel`, `skipLabel`, `nextLabel`,
 * `finishLabel`) are deliberately *not* emptied here. All four are defaulted,
 * and forcing the empty case would ship an axe `button-name` violation into a
 * gate running at `test: "error"` — the same reason `quote-reply` and
 * `suggestion-chips` record for their own skips. `previewLabel` is the one
 * label whose empty case is survivable, since it names a region rather than a
 * control; it is left at its default so the pane's frame is what is under
 * test.
 */
export const EmptyLabel: Story = {
  args: { steps: NO_DESCRIPTION_STEPS, defaultStep: "review" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard-content"]')!;

    // The header, then the fields — nothing between them.
    await expect(content.children).toHaveLength(2);
    await expect(content.children[1]).toBe(canvas.getByTestId("fields"));

    // The empty preview still arrives inside a labelled frame.
    const preview = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard-preview"]')!;
    await expect(preview).toHaveTextContent("Preview");

    // Both completed markers are still named, with no visible title needed.
    canvas.getByRole("button", { name: "Completed: Choose model" });
    canvas.getByRole("button", { name: "Completed: Set style" });
  },
};

const LONG_TITLE = "Choose the model this generation runs on and how many passes it takes";
const LONG_DESCRIPTION =
  "Applied to every frame in this generation, including the ones already rendered in the draft pass.";

const LONG_STEPS: GenerationWizardStep[] = [
  { ...STEPS[0], title: LONG_TITLE, description: LONG_DESCRIPTION },
  { ...STEPS[1], description: LONG_DESCRIPTION },
  { ...STEPS[2] },
];

/**
 * A ~70-character step title and a ~100-character description, and the
 * component gives the same title two different answers depending on where it
 * lands.
 *
 * In the step body it **truncates**: A12 `section-header` wraps whatever it
 * is given in a `truncate` span, so the heading clips to one line with an
 * ellipsis and the "Step 1 of 3" caption beside it keeps its place. In the
 * stepper it **wraps**: the label span carries no truncate and no
 * `whitespace-nowrap`, so a long title reflows inside its `<li>` and pushes
 * the whole stepper taller while the connectors shrink around it.
 *
 * So the same string is clipped in one place and complete in the other, and
 * the clipped copy is the one a mouse user hovers. Recorded, not fixed:
 * nothing sets a `title` attribute on the truncated heading, so the full step
 * name is unavailable there — the same shape `context-chips` carries on its
 * `max-w-40` label. Worth knowing before writing a step title, because it is
 * the one string this component renders in two places under two different
 * overflow rules.
 *
 * The description wraps freely and is the slot that takes long copy without
 * argument.
 */
export const LongContent: Story = {
  args: { steps: LONG_STEPS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvasElement.querySelector<HTMLElement>('[data-slot="section-header-title"]')!;

    // The body heading clips rather than wrapping or pushing the caption out.
    const style = getComputedStyle(heading);
    await expect(style.textOverflow).toBe("ellipsis");
    await expect(style.whiteSpace).toBe("nowrap");
    await expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);

    // The same string in the stepper is complete, and taller for it.
    const stepper = canvas.getByRole("list", { name: "Step 1 of 3" });
    const label = within(stepper).getByText(LONG_TITLE);
    await expect(getComputedStyle(label).textOverflow).toBe("clip");
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(
      heading.getBoundingClientRect().height,
    );
  },
};

/**
 * 375px, and the honest reading of this story is narrower than it looks.
 *
 * Every adaptation this component has is keyed to the **viewport** rather
 * than to its own width: the two-column split is `md:grid-cols-[3fr_2fr]` and
 * the stepper labels are `sr-only sm:not-sr-only`. A wrapper cannot reach a
 * viewport breakpoint, and the gate runs headless chromium at 1200×900 — so
 * what renders inside this 375px box is the **widest** branch. Measured: the
 * grid resolves to two live tracks (211px and 140px) and the step labels are
 * `position: static` at ~95px rather than collapsed to `sr-only`. A phone
 * gets the other branch, which this story structurally cannot show.
 *
 * That makes it a stronger claim than the phone case needs, and it is the one
 * worth having: the desktop layout, squeezed to phone width, still does not
 * scroll sideways. It survives because nothing in the tree is fixed-width —
 * the root is `w-full max-w-3xl`, the content column is `min-w-0`, the
 * fraction grid divides whatever it is given, and the nav row is
 * `justify-between` around two auto-width groups. The thing most likely to
 * break it is a long step title, which `LongContent` above shows wrapping
 * rather than extending.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <GenerationWizard {...args} steps={STEPS} defaultStep="style" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard"]')!;

    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    // The nav row is the densest line — three controls plus the gap between
    // the two groups — and it still fits without overflowing.
    const nav = canvasElement.querySelector<HTMLElement>('[data-slot="generation-wizard-nav"]')!;
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
  },
};

/**
 * Against L6 `onboarding-wizard`, which is not a lookalike but a deliberate
 * relative: L6's source says outright that it is built on E8's step machinery
 * (`steps[]`, a controlled/uncontrolled `step`, `onStepChange`, and a Back /
 * Skip / primary footer) so that two multi-step contracts in one registry
 * cannot drift apart. Three differences decide which one you want, and all
 * three follow from what the last step means.
 *
 * - **E8's last step commits.** It spends credits, so Skip disappears there
 *   and the primary swaps to a verb ("Generate"). The preview pane exists to
 *   make that spend legible one step early.
 * - **L6's last step is just the last question.** Skip survives onto it,
 *   because an onboarding answer left unset is a valid outcome and nothing is
 *   being spent.
 * - **E8 holds no answers; L6 does.** Each E8 step's fields are the caller's
 *   `content` node entirely — the wizard never sees a value. L6 owns
 *   `answers` / `onAnswerChange`, because onboarding answers exist to be
 *   applied downstream and have to leave the component in one shape.
 *
 * So: if the flow ends in a spend and the fields are yours, E8. If it ends in
 * a profile and the questions are single-select, L6. A third case belongs to
 * neither — a single-screen form does not need a stepper at all, and a
 * surface that already draws its own progress and footer cannot host L6,
 * which CONTINUE.md §8 records against L6 as a missing `progress={false}` /
 * `nav={false}` opt-out. E8 has the same shape and the same absence: its
 * stepper and nav row are unconditional too, so anything that suppresses one
 * of them is fighting the component.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E8 generation wizard — your fields, a per-step preview, a last step that spends
        </p>
        <GenerationWizard steps={STEPS} defaultStep="review" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          L6 onboarding wizard — its choice cards, its answers, a last step you may still skip
        </p>
        <OnboardingWizard
          steps={[
            {
              id: "role",
              title: "What do you make?",
              choices: [
                { value: "marketing", label: "Marketing video" },
                { value: "film", label: "Film and story" },
              ],
              effect: "Sets your default aspect ratio and the sample project we open first.",
            },
            {
              id: "volume",
              title: "How much do you expect to make?",
              choices: [
                { value: "few", label: "A few a month" },
                { value: "daily", label: "Every day" },
              ],
              effect: "Picks your credit pack and whether the batch queue starts on.",
            },
          ]}
        />
      </section>
    </div>
  ),
};
