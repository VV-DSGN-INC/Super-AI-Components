import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenerationPanelDocs } from "@/content/components/generation-panel.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { GenerationPanel, type GenerationPanelProps } from "@/registry/super-ai/generation-panel";
import { ParameterPanel, ParameterSlider } from "@/registry/super-ai/parameter-panel";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

// E4 preset-grid, E2 model-picker, E3 parameter-panel and E5 run-button are
// being built concurrently elsewhere in this catalog and can't be imported
// here yet — these stories fill `presets`/`settings`/`generate` with shipped
// A8 preview-tile, A7 gen-settings-bar and a plain Button to prove the
// arrangement, the same substitution the docs demo makes. (E3 has since
// landed and `Boundary` below imports it directly, because that story is
// about the three components' relationship rather than about the slot.)
const PRESETS = (
  <div className="grid grid-cols-3 gap-2">
    {["Cinematic", "Anime", "Watercolor"].map((preset) => (
      <PreviewTile key={preset} aspect="square" label={preset}>
        {/* preview-tile's frame is bg-muted (pre-Wave-1.5 legacy — see
            a11y-baseline.md). text-muted-foreground on it is 4.34:1, under
            4.5:1; text-foreground keeps the tile's muted fill and clears
            contrast, the same fix used at every other bg-muted call site. */}
        <div className="text-foreground flex h-full w-full items-center justify-center text-[0.6rem]">
          {preset}
        </div>
      </PreviewTile>
    ))}
  </div>
);

const SETTINGS = (
  <GenSettingsBar>
    <GenSettingsItem aria-pressed>16:9</GenSettingsItem>
    <GenSettingsItem>9:16</GenSettingsItem>
    <GenSettingsItem>1:1</GenSettingsItem>
  </GenSettingsBar>
);

function GenerationPanelShell(args: GenerationPanelProps) {
  return (
    <div className="h-[32rem] w-72">
      <GenerationPanel {...args} />
    </div>
  );
}

const meta: Meta<typeof GenerationPanel> = {
  title: "Super AI/Generation Panel",
  component: GenerationPanel,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationPanelDocs) } },
  render: (args) => <GenerationPanelShell {...args} />,
};

export default meta;
type Story = StoryObj<typeof GenerationPanel>;

// Each story shows the whole panel — the five declared states are stages of
// one assembly, not variants — while emphasising the stage named by the
// story via which slot carries real data.

/**
 * Stage 1, and the only stage whose presence is decided by a handler rather
 * than by data: `onFilesAdd` is what turns it on, so a tool that accepts no
 * uploads simply omits it and the section never renders. Both intake paths
 * are here — a drop target on the wrapper and a real button that opens the
 * native picker — and the two files show the fork inside a tile: one with a
 * `preview` renders the image, one without renders its filename twice, once
 * inside the tile and once as the tile's label below it.
 */
export const Dropzone: Story = {
  args: {
    onFilesAdd: () => {},
    onFileRemove: () => {},
    dropzoneLabel: "Upload reference image",
    files: [
      { id: "1", name: "reference.png", preview: "https://placehold.co/200x200?text=Ref" },
      { id: "2", name: "mood-board.jpg" },
    ],
  },
};

/**
 * Stage 2 — the prompt, and the one stage that is always rendered: no prop
 * hides it, because a generation tool with no way to say what to generate is
 * not one. The field is a plain textarea, so Enter inserts a newline and
 * nothing here submits; the only route to Generate is the footer.
 */
export const Directions: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    onDirectionsChange: () => {},
  },
};

/**
 * Stage 3. Presets sit below directions and above settings, which is the
 * order the spec fixes and this component does not expose as a prop — a
 * preset is a shortcut for settings you would otherwise dial in, so it has to
 * be read after the prompt and before the dials. The slot takes E4
 * preset-grid; the tiles here stand in for it.
 */
export const Presets: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
  },
};

/**
 * Stage 4 — the dials, as a `ReactNode` the panel arranges but never owns.
 * Whatever goes in keeps its own semantics: A7's strip stays a
 * `role="toolbar"` with its own pressed state, and the panel adds only the
 * heading and the collapse. That is why presets and settings are slots rather
 * than props — the panel is an arrangement, and arrangements do not
 * reimplement their contents.
 */
export const Settings: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
    settings: SETTINGS,
  },
};

/**
 * Stage 5, and the only one that is not a collapsible section. Cost and
 * Generate render in a `CardFooter` outside the scrolling body, so no
 * combination of open sections can separate them — F1's "the price belongs at
 * the point of spend", made structural rather than advisory.
 *
 * The number itself is still a plain prop. `CONTINUE.md` §5.9 records the open
 * item: the spec says the cost shown here, on E5 and on D1 comes from one
 * source, and the `cost.tsx` contract that would enforce it exists but neither
 * this panel nor `cost-chip` calls `useCost` yet. Two surfaces showing two
 * different prices is still reachable through the props.
 */
export const CostAndGenerate: Story = {
  args: {
    directions: "A lighthouse at dusk, cinematic lighting, wide shot",
    presets: PRESETS,
    settings: SETTINGS,
    cost: 12,
    generate: <Button type="button">Generate</Button>,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this panel meets in a product, as opposed to
 * the stages above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from what it is: a height-constrained column with a genuine
 * controlled pair (`directions`/`onDirectionsChange`), four collapsible
 * sections that add and remove tab stops, three defaulted text slots, a
 * chevron that rotates as a section opens, and two near-twins in family E
 * that nest inside it rather than replace it.
 * ---------------------------------------------------------------------- */

const APPLIED_PROMPT = "A lighthouse at dusk, cinematic lighting, wide shot";

/** ~95 characters — the convention's long-content floor. */
const LONG_PROMPT =
  "A lighthouse at dusk seen from the water, cinematic lighting, heavy fog rolling in from the left";

/** What a user actually pastes once they have iterated a few times. */
const PASTED_PROMPT =
  "A lighthouse at dusk seen from the water, cinematic lighting, heavy fog rolling in from the left, long exposure so the beam smears across the frame, muted blues against one warm window, no people, no text, shot on 35mm";

/** A visible focus treatment, wherever the focused thing happens to draw it. */
const hasRing = (el: Element) => {
  const style = getComputedStyle(el);
  return style.boxShadow !== "none" || style.outlineStyle !== "none";
};

/**
 * Right-to-left, and the panel is mostly free: every row that has to mirror is
 * a `justify-between` flex, so each stage's heading moves to the right with
 * its chevron to the left, and the footer puts the cost chip at the right and
 * Generate at the left without a single `rtl:` utility. The file grid is a
 * plain `grid-cols-3` and flows from the right on its own.
 *
 * One physical class did exist and was swapped in-wave: the section trigger
 * carried `text-left`, now `text-start` — byte-identical in LTR, and the swap
 * `CONTINUE.md` §8's logical-property entry sanctions.
 *
 * **Two things this story shows and does not assert.** The per-file remove
 * control stays at the visual *right* of its tile, because it is passed
 * through A8 `preview-tile`'s `badge` slot and that slot is `absolute top-2
 * right-2` — measured here, and the same finding §8 already records against
 * A8 from two wave-1 agents. Fixing it means editing another component's file,
 * so it is recorded rather than swept. And the cost chip's amount is
 * deliberately *not* mirrored: `cost-chip` puts `dir="ltr"` on the number so
 * "12 credits" keeps its reading order inside an RTL panel.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="h-[32rem] w-72">
      <GenerationPanel
        onFilesAdd={() => {}}
        onFileRemove={() => {}}
        dropzoneLabel="Upload reference image"
        files={[{ id: "1", name: "mood-board.jpg" }]}
        directions={APPLIED_PROMPT}
        onDirectionsChange={() => {}}
        settings={SETTINGS}
        cost={12}
        generate={<Button type="button">Generate</Button>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByText("Directions", { selector: "h3" });
    const chevron = heading.parentElement!.querySelector("svg")!;
    const cost = canvasElement.querySelector<HTMLElement>('[data-slot="generation-panel-cost"]')!;
    const generate = canvas.getByRole("button", { name: "Generate" });

    // The stage heading leads at the right, its chevron trails at the left.
    await expect(heading.getBoundingClientRect().left).toBeGreaterThan(chevron.getBoundingClientRect().left);

    // The footer mirrors with it: price first, then the button that spends it.
    await expect(cost.getBoundingClientRect().left).toBeGreaterThan(generate.getBoundingClientRect().left);

    // Stops here. The remove badge's side is A8's to fix — see the description.
  },
};

/**
 * `prefers-reduced-motion`. Exactly one thing in this panel moves: the stage
 * chevron rotates 180° as a section opens. It did not branch before this wave,
 * so `motion-reduce:transition-none` landed on it as a mechanical repair —
 * the same one-class idiom `pricing-table` uses beside its sliding switch
 * thumb, and the second of the two sanctioned forms in `story-conventions.md`
 * fact 3 (a rotation is travel, not a colour crossfade).
 *
 * The two `transition-colors` in the tree are deliberately *not* suppressed
 * and this story asserts that they survive, so nobody "completes" the fix
 * later: the drop target's border-and-fill change on drag-over and the
 * textarea's focus border are colour crossfades at a fixed position and size —
 * the `reset-affordance` case, where suppressing motion would document no
 * branch. The collapse itself is not animated at all: Base UI's
 * `Collapsible.Panel` ships no keyframes here, so a stage snaps open.
 *
 * Not this component's branch, and named so it is not re-found as new: the
 * vendored `Button` carries `transition-all` plus a one-pixel `active:` nudge,
 * which is library-wide press chrome recorded in `CONTINUE.md` §8.
 *
 * `vitest.config.ts` emulates reduce for every test, so the reads below are
 * the real branch. Drop the `motion-reduce:` class and the first one reads
 * back `transform` instead of `none`.
 */
export const ReducedMotion: Story = {
  render: () => (
    <GenerationPanelShell
      onFilesAdd={() => {}}
      dropzoneLabel="Upload reference image"
      directions={APPLIED_PROMPT}
      onDirectionsChange={() => {}}
      settings={SETTINGS}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chevron = canvas.getByRole("button", { name: "Settings" }).querySelector("svg")!;
    const dropTarget = canvasElement.querySelector<HTMLElement>(
      '[data-slot="generation-panel-dropzone"] > div',
    )!;
    const textarea = canvas.getByRole("textbox", { name: "Directions" });

    // The one moving part is suppressed.
    await expect(getComputedStyle(chevron).transitionProperty).toBe("none");

    // …and the two colour crossfades are not, on purpose.
    for (const el of [dropTarget, textarea]) {
      await expect(getComputedStyle(el).transitionProperty).toContain("background-color");
    }
  },
};

/**
 * Tab traversal down a full panel with one stage collapsed, which is the
 * arrangement that makes the order worth pinning.
 *
 * **A collapsed stage costs exactly one stop.** Base UI's `Collapsible.Panel`
 * unmounts rather than hides, so the closed Settings stage contributes its
 * trigger and nothing else — its three toolbar buttons are absent from the
 * document, not merely skipped, which the play function asserts in both
 * directions. Expanding a stage therefore *adds* tab stops as you go, and a
 * keyboard user's stop count is a function of what is open.
 *
 * **The upload stage costs two stops, and the first one is invisible.** The
 * `<input type="file">` is `sr-only` — clipped to 1×1 rather than hidden, so
 * it stays focusable — and it precedes the visible trigger with the same
 * accessible name. That first stop is excluded from this story's focus-ring
 * check, and the exclusion is proved rather than assumed: the walk asserts the
 * element really is clipped to a pixel, which is exactly why the outline the
 * browser draws on it cannot be seen. Recorded, not asserted green: a keyboard
 * user's first Tab into this panel's upload stage lands somewhere with no
 * visible indication of where they are. Making the input reachable only
 * through the button is an API decision (`display:none` on the input, picker
 * opened from the trigger), so it is left to the docs' focus notes.
 *
 * Everything else the walk pins is a guarantee worth keeping: nine of the ten
 * stops draw a ring and match `:focus-visible`, per-file remove controls carry
 * distinct names, and one more Tab leaves the panel — it does not trap.
 *
 * Recorded, not asserted: removing a file unmounts the control that had focus
 * and nothing restores it, so focus falls to `<body>`. The docs module already
 * carries it; asserting it would pin behaviour the panel should not keep.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="h-[32rem] w-72">
      <GenerationPanel
        onFilesAdd={() => {}}
        onFileRemove={() => {}}
        dropzoneLabel="Upload reference image"
        files={[
          { id: "1", name: "reference.png" },
          { id: "2", name: "mood-board.jpg" },
        ]}
        directions={APPLIED_PROMPT}
        onDirectionsChange={() => {}}
        presets={PRESETS}
        settings={SETTINGS}
        defaultOpenSections={["dropzone", "directions", "presets"]}
        cost={12}
        generate={<Button type="button">Generate</Button>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bySlot = (slot: string) =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`));

    // The collapsed stage kept its trigger and lost its contents outright.
    const triggers = bySlot("generation-panel-section-trigger");
    await expect(triggers).toHaveLength(4);
    await expect(canvas.getByRole("button", { name: "Settings" })).toHaveAttribute("aria-expanded", "false");
    await expect(bySlot("gen-settings-item")).toHaveLength(0);
    await expect(canvas.queryByRole("button", { name: "16:9" })).not.toBeInTheDocument();

    // Every per-file control names the file it drops.
    const removes = bySlot("generation-panel-dropzone-remove");
    const names = removes.map((el) => el.getAttribute("aria-label"));
    await expect(names).toEqual(["Remove reference.png", "Remove mood-board.jpg"]);

    const srOnlyInput = bySlot("generation-panel-dropzone-input")[0];
    const expected = [
      triggers[0],
      srOnlyInput,
      bySlot("generation-panel-dropzone-trigger")[0],
      ...removes,
      triggers[1],
      bySlot("generation-panel-directions-textarea")[0],
      triggers[2],
      triggers[3],
      canvas.getByRole("button", { name: "Generate" }),
    ];

    // The one stop whose ring cannot be seen, and the reason: it is clipped.
    await expect(srOnlyInput.getBoundingClientRect().width).toBeLessThanOrEqual(1);

    for (const stop of expected) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      if (focused === srOnlyInput) continue;
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expect(hasRing(focused)).toBe(true);
    }

    // The panel does not trap: the stop after the last one is outside it.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

function ControlledDirectionsHost() {
  const [applied, setApplied] = React.useState(APPLIED_PROMPT);
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[22rem] w-72">
        <GenerationPanel
          directions={applied}
          onDirectionsChange={setRequested}
          settings={SETTINGS}
          cost={12}
          generate={<Button type="button">Generate</Button>}
        />
      </div>

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>directions prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onDirectionsChange</dt>
        <dd data-testid="requested">{requested ?? "—"}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </Button>
        <Button size="sm" disabled={!requested} onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * `directions` / `onDirectionsChange` is a real controlled pair, and the only
 * one this panel has. The host below refuses every keystroke until Apply is
 * pressed, which is what makes the three assertions mean anything: typing does
 * not move the field, the callback still reports the whole next prompt rather
 * than a diff, and a re-render with an unchanged `directions` holds it fixed.
 * Leave `directions` undefined and the textarea is uncontrolled instead — the
 * component supplies no `defaultDirections`, so an uncontrolled panel's prompt
 * is unreadable from outside.
 *
 * **The collapse state is the half that is not controlled, and not reportable
 * either.** `defaultOpenSections` is an initial-state prop with no
 * `openSections` counterpart and no change callback at all, so a host cannot
 * refuse a collapse *or* observe one — it cannot persist which stages a user
 * left open across a reload. That is one step further than I2
 * `property-inspector`, whose `onSectionOpenChange` at least fires after the
 * fact. Recorded here rather than fixed: adding the pair is an API change.
 */
export const Controlled: Story = {
  render: () => <ControlledDirectionsHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prompt = canvas.getByRole("textbox", { name: "Directions" }) as HTMLTextAreaElement;

    await expect(prompt).toHaveValue(APPLIED_PROMPT);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.type(prompt, "!", {
      initialSelectionStart: APPLIED_PROMPT.length,
      initialSelectionEnd: APPLIED_PROMPT.length,
    });
    await expect(prompt).toHaveValue(APPLIED_PROMPT);

    // 2. …but the callback fired, with the whole next prompt as its payload.
    await expect(canvas.getByTestId("requested")).toHaveTextContent(`${APPLIED_PROMPT}!`);

    // 3. Re-render with an unchanged `directions`. Confirm the pass really
    //    happened first, so the value assertion after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(prompt).toHaveValue(APPLIED_PROMPT);

    // The reported payload was enough to apply the change unmodified.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(prompt).toHaveValue(`${APPLIED_PROMPT}!`);
  },
};

/**
 * The optional text emptied, in the two slots where emptying it changes what
 * renders rather than what is announced.
 *
 * `dropzoneDescription` is the upload stage's only visible words. Clear it and
 * the trigger becomes an icon alone: still named — `dropzoneLabel` supplies
 * `aria-label` on both the button and the input — and still a legal target,
 * but 26px tall against WCAG 2.2's 24px minimum, which it clears by two
 * pixels and only because `gap-1.5` survives the emptied span. The play
 * function pins that floor. A screen-reader user loses nothing here; a sighted
 * user loses the sentence that said drag-and-drop was available at all.
 * `directionsPlaceholder` is the second: the `<label>` is `sr-only` and
 * `aria-label` carries the same string, so an empty placeholder leaves a blank
 * box with nothing on screen saying what it is for.
 *
 * **Two slots are deliberately not emptied here**, because doing so would ship
 * an axe violation into a gate that runs at `test: "error"` rather than
 * document a rendering. `dropzoneLabel=""` empties the name of both the input
 * and the button at once, and `sectionTitles={{ dropzone: "" }}` leaves a
 * trigger whose only other child is an `aria-hidden` chevron — both are
 * `button-name` failures, and both are caller errors that belong in the docs
 * page's donts. Same reasoning `suggestion-chips` and `quote-reply` record.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Defaults</p>
        <div className="h-[18rem] w-64">
          <GenerationPanel
            onFilesAdd={() => {}}
            dropzoneLabel="Upload reference image"
            directions=""
            onDirectionsChange={() => {}}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">No description, no placeholder</p>
        <div className="h-[18rem] w-64">
          <GenerationPanel
            onFilesAdd={() => {}}
            dropzoneLabel="Upload reference image"
            dropzoneDescription={null}
            directions=""
            onDirectionsChange={() => {}}
            directionsPlaceholder=""
          />
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const triggers = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="generation-panel-dropzone-trigger"]'),
    );
    await expect(triggers).toHaveLength(2);

    // The name survives the emptied description; the visible sentence does not.
    for (const trigger of triggers) {
      await expect(trigger).toHaveAttribute("aria-label", "Upload reference image");
    }
    await expect(triggers[1].textContent).toBe("");

    // …and what is left is still a 24×24 target, with two pixels to spare.
    await expect(triggers[1].getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  },
};

/**
 * Long author-supplied text, in the two slots that take it.
 *
 * **The prompt grows; it never scrolls or truncates.** The vendored `Textarea`
 * carries `field-sizing-content`, so the field is as tall as its content: 80px
 * at the panel's `min-h-20` floor for the ~95-character prompt on the left,
 * and 158px for the pasted paragraph on the right, with no internal scrollbar
 * in either. `resize-none` means a user cannot drag it back down, so a long
 * prompt permanently costs that height — the sections below it move down and
 * the panel *body* is what gains a scrollbar. That is the intended trade, and
 * the footer is unaffected, which is the whole point of it sitting outside.
 *
 * **A long filename gets two different answers in one tile.** The name renders
 * inside the frame with `break-all`, so it wraps and shows in full, and again
 * below the frame through `preview-tile`'s `truncate` label, where it is cut
 * with an ellipsis. Recorded, not fixed: there is no `title` on the truncated
 * label, so the cut half is unrecoverable by hover — the same gap `CONTINUE.md`
 * §8 records against D3 `context-chips`, at a second call site.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="h-[32rem] w-72">
        <GenerationPanel
          onFilesAdd={() => {}}
          onFileRemove={() => {}}
          dropzoneLabel="Upload reference image"
          files={[{ id: "1", name: "lighthouse-reference-final-v3-approved.png" }]}
          directions={LONG_PROMPT}
          onDirectionsChange={() => {}}
          settings={SETTINGS}
          cost={12}
          generate={<Button type="button">Generate</Button>}
        />
      </div>
      <div className="h-[32rem] w-72">
        <GenerationPanel
          directions={PASTED_PROMPT}
          onDirectionsChange={() => {}}
          settings={SETTINGS}
          cost={12}
          generate={<Button type="button">Generate</Button>}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [atFloor, pasted] = canvas.getAllByRole("textbox", { name: "Directions" });
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    const inner = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-frame"] span')!;

    // Neither field scrolls; the taller one is taller because it grew.
    for (const field of [atFloor, pasted]) {
      await expect(field.scrollHeight).toBeLessThanOrEqual(field.clientHeight);
    }
    await expect(pasted.getBoundingClientRect().height).toBeGreaterThan(
      atFloor.getBoundingClientRect().height,
    );

    // The same filename, complete inside the frame and ellipsised below it.
    await expect(inner.scrollHeight).toBeLessThanOrEqual(inner.clientHeight);
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

/**
 * 375px, and the width is the easy half: the column is a single stack, the
 * file grid stays at `grid-cols-3` with 109px tiles, and nothing overflows
 * sideways.
 *
 * The load-bearing claim is the spec's second bullet — "the Generate row is
 * pinned to the bottom, never requires scrolling" — and it is **conditional on
 * the host giving the panel a height**, which nothing in the component says or
 * enforces. Both panels below are 375px wide and identical apart from that.
 *
 * - Constrained to a 600px phone column (left): `flex-1` and `overflow-y-auto`
 *   engage, the body scrolls, and the footer's bottom edge is the card's
 *   bottom edge. The guarantee holds and the play function pins it.
 * - Unconstrained (right): the root's `h-full` resolves against an auto-height
 *   parent, so it resolves to auto, the body never becomes a scroller, and the
 *   card grows to its content — measured at **740px** for this same content.
 *   On a 600px-tall phone viewport the Generate row is then 140px below the
 *   fold and the page scrolls to it, which is the thing the spec says must
 *   never happen.
 *
 * Recorded, not asserted, and not fixed: the remedy is either a `max-h-full`
 * default on the root or a documented "give this panel a height" requirement,
 * and choosing between them is a design decision. The docs module's focus note
 * ("the footer sits outside the scrolling body, so Generate can never be
 * scrolled away from") is true only of the left-hand case and should say so.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-6" data-testid="viewport">
      <div className="h-[600px]">
        <GenerationPanel
          onFilesAdd={() => {}}
          onFileRemove={() => {}}
          dropzoneLabel="Upload reference image"
          files={[
            { id: "1", name: "reference.png" },
            { id: "2", name: "mood-board.jpg" },
            { id: "3", name: "palette.png" },
          ]}
          directions={LONG_PROMPT}
          onDirectionsChange={() => {}}
          presets={PRESETS}
          settings={SETTINGS}
          cost={12}
          generate={<Button type="button">Generate</Button>}
        />
      </div>

      <div data-testid="unconstrained">
        <GenerationPanel
          onFilesAdd={() => {}}
          onFileRemove={() => {}}
          dropzoneLabel="Upload reference image"
          files={[
            { id: "1", name: "reference.png" },
            { id: "2", name: "mood-board.jpg" },
            { id: "3", name: "palette.png" },
          ]}
          directions={LONG_PROMPT}
          onDirectionsChange={() => {}}
          presets={PRESETS}
          settings={SETTINGS}
          cost={12}
          generate={<Button type="button">Generate</Button>}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="generation-panel"]')!;
    const body = card.querySelector<HTMLElement>('[data-slot="card-content"]')!;
    const footer = card.querySelector<HTMLElement>('[data-slot="generation-panel-generate"]')!;
    const tile = card.querySelector<HTMLElement>('[data-slot="preview-tile-frame"]')!;

    // Nothing scrolls sideways at 375px, and the grid keeps three columns.
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    await expect(tile.getBoundingClientRect().width).toBeLessThan(viewport.getBoundingClientRect().width / 3);

    // Given a height, the body is the scroller and the footer is the floor.
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(Math.round(footer.getBoundingClientRect().bottom)).toBe(
      Math.round(card.getBoundingClientRect().bottom),
    );

    // Stops here. The unconstrained panel beside it is evidence, not a
    // guarantee — see the description.
  },
};

/**
 * Three places a generation tool's controls can live. They look alike because
 * they hold the same dials, and the rule is about what surrounds them:
 *
 * - **Generation panel (E1)** — the whole left column, in the fixed order
 *   upload → directions → presets → settings → cost + Generate. It is the only
 *   one of the three that ends in a button that spends money, and the only one
 *   that owns any input of its own.
 * - **Parameter panel (E3)** — one group of a model's parameters, with human
 *   endpoints and inline education. It goes *inside* E1's `settings` slot, as
 *   on the left here; omit its `title` there and the stage heading names it.
 *   It runs nothing and it has no cost.
 * - **Gen settings bar (A7)** — the same choices flattened to one row, for a
 *   surface with no column at all: a chat composer, a mobile sheet. It is a
 *   `role="toolbar"`, not a panel, and it has no headings to collapse.
 *
 * So: if it ends in Generate it is the panel; if it is a group of dials it
 * belongs inside one; if there is no column to put it in, it is the bar. A
 * parameter panel that grew a Generate button has become a generation panel
 * with the stages missing, and a settings bar that grew section headings has
 * become a parameter panel that cannot scroll.
 *
 * The fourth thing that looks like this is I2 `property-inspector`, and it is
 * not in the family: same collapsible rail, but it edits a selection that
 * already exists on a canvas rather than describing something to make.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Generation panel — the column that spends</p>
        <div className="h-[24rem] w-64">
          <GenerationPanel
            directions={APPLIED_PROMPT}
            onDirectionsChange={() => {}}
            settings={
              <ParameterPanel>
                <ParameterSlider
                  label="Guidance"
                  value={7}
                  min={1}
                  max={20}
                  endpoints={["More variable", "More literal"]}
                  onValueChange={() => {}}
                />
              </ParameterPanel>
            }
            cost={12}
            generate={<Button type="button">Generate</Button>}
          />
        </div>
      </section>

      <section className="flex w-56 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Parameter panel — one group of dials</p>
        <ParameterPanel title="Sampling">
          <ParameterSlider
            label="Guidance"
            value={7}
            min={1}
            max={20}
            endpoints={["More variable", "More literal"]}
            description="How closely the model follows the prompt."
            onValueChange={() => {}}
          />
        </ParameterPanel>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Gen settings bar — the same, with no column</p>
        {SETTINGS}
      </section>
    </div>
  ),
};
