import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shuffle, Volume2 } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";
import {
  GenSettingsBar,
  GenSettingsItem,
  GenSettingsQuality,
  type GenQuality,
} from "@/registry/super-ai/gen-settings-bar";
import { GenSettingsBarDocs } from "@/content/components/gen-settings-bar.docs";
import { settledFocusRing } from "@/lib/focus-ring";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GenSettingsBar> = {
  title: "Super AI/Gen Settings Bar",
  component: GenSettingsBar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenSettingsBarDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenSettingsBar>;

/**
 * A video model, which is the widest the strip gets: model, aspect,
 * resolution, duration and batch. Duration is present because the selected
 * model produces time-based output — the segment list follows the model,
 * not the surface.
 */
export const VideoModel: Story = {
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
    </GenSettingsBar>
  ),
};

/**
 * The same strip for an image model. Duration is gone rather than greyed
 * out, because an image has no duration to set — a disabled segment would
 * imply the parameter exists and is temporarily unavailable, which is a
 * different claim.
 */
export const ImageModel: Story = {
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Imagen 4 Ultra</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>1:1</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>2K</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>×4</GenSettingsItem>
    </GenSettingsBar>
  ),
};

/**
 * Locked while a generation is in flight. One `disabled` on the bar travels
 * to every segment through context, so the five cannot drift apart, and the
 * strip keeps showing the parameters the running job was launched with
 * rather than blanking them.
 */
export const Running: Story = {
  args: { disabled: true },
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
    </GenSettingsBar>
  ),
};

/**
 * The escape hatch from that lock: a bar-wide `disabled` with one segment
 * explicitly re-enabled. The batch count is the honest example — in a
 * queueing product it applies to the next run rather than the one currently
 * rendering, so it stays live while everything baked into the in-flight job
 * is frozen.
 *
 * Worth its own state because the override is asymmetric: `disabled` on a
 * segment is read as `disabled ?? bar`, so leaving it off inherits the lock
 * and only an explicit `disabled={false}` escapes it. That is easy to write
 * by accident and impossible to see in the markup.
 */
export const PartiallyLocked: Story = {
  args: { disabled: true },
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
      <GenSettingsItem onClick={() => {}} disabled={false}>
        ×3
      </GenSettingsItem>
    </GenSettingsBar>
  ),
};

/**
 * The optional draft/final quality segment, shown because the host passed
 * `quality` and `onQualityChange`. Draft is named as lower quality in text
 * ("Draft, lower quality"), never only as cheaper, so the trade is visible
 * before the run. Picking an option calls the same handler every segment
 * reports through; in a product that handler updates the settings and
 * re-estimates cost, so the price shown beside Run follows the choice.
 * Leave either prop off and the segment is not rendered at all.
 */
export const Draft: Story = {
  render: (args) => {
    const [quality, setQuality] = React.useState<GenQuality>("draft");
    return (
      <GenSettingsBar aria-label="Generation settings" {...args}>
        <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
        <GenSettingsQuality quality={quality} onQualityChange={setQuality} />
      </GenSettingsBar>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const draft = canvas.getByRole("button", { name: "Draft, lower quality" });
    const final = canvas.getByRole("button", { name: "Final" });
    await expect(draft).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(final);
    await expect(final).toHaveAttribute("aria-pressed", "true");
    await expect(draft).toHaveAttribute("aria-pressed", "false");
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing animates; the only timed declaration is a hover colour fade
 * The bar is a static flex row and the segment is a plain button. The whole
 * file contains no keyframe, no transform and no `animate-*`; the single
 * time-based declaration is `transition-colors` on hover, a colour
 * cross-fade with no movement, which is not what `prefers-reduced-motion`
 * exists to suppress and which Tailwind does not branch on anyway. A story
 * here would render identically to `VideoModel`.
 *
 * // case-skip: Controlled — there is no value/onChange pair to control
 * `GenSettingsItem` is a plain `<button>`: the value it displays is its
 * `children`, and `onClick` receives a MouseEvent. Neither props type
 * carries `value`, `defaultValue`, `selected` or a change callback, so two
 * of the convention's three clauses are vacuous (children cannot be moved
 * by the component) and the third is unsatisfiable (no change payload
 * exists for a consumer to apply). A story would assert that React works.
 * The missing value API is a real gap and is recorded in the retrofit
 * report and in the docs module's second pitfall, rather than dressed up as
 * coverage here.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The strip is an ordered reading rather than an unordered
 * set — the model comes first and the segments after it qualify that
 * choice — so direction is load-bearing: under `dir="rtl"` the flex row
 * mirrors and the model lands at the right edge, where the sentence now
 * starts.
 *
 * The values are the part that does not mirror, correctly: digits keep
 * their own left-to-right order inside an RTL run, so "16:9" is still
 * sixteen-to-nine and "720p" still reads as a resolution.
 *
 * The batch segment is the exception, and it is a caller problem rather
 * than a component one. "×3" opens with a mathematical symbol — a
 * bidi-neutral character with no direction of its own — so it takes the
 * paragraph direction and lands on the far side of the digit. Measured on
 * this story: the "×" paints at x=356 and the "3" at x=349, i.e. the glyphs
 * render as "3×". Nothing in this component can fix that, because the
 * component never sees the value; a caller shipping a bare "×N" batch count
 * should wrap it `dir="ltr"` or author it as "3 clips". Recorded in the
 * retrofit report rather than patched here.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <GenSettingsBar aria-label="Generation settings" {...args}>
        <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
      </GenSettingsBar>
    </div>
  ),
};

/**
 * The keyboard contract `role="toolbar"` promises under the ARIA authoring
 * practices, which this story used to record as missing: five segments were
 * five tab stops and the arrows did nothing. The bar now composes Base UI's
 * `Toolbar`, the same primitive `context-toolbar` builds on, so:
 *
 * 1. **The strip is one tab stop.** Tab enters on the first segment and the
 *    next Tab leaves the canvas, whatever the segment count.
 * 2. **Right arrow walks every segment exactly once and wraps.** The lap is
 *    asserted as a cycle (each stop new, then back to the start) rather than
 *    as "reached N stops within M presses", per `story-conventions.md` fact 4.
 *    Left arrow steps back across the wrap.
 * 3. **Every stop paints a settled ring.** `settledFocusRing` rather than the
 *    older `boxShadow !== "none"` check, which a Tailwind ring passes while
 *    painting nothing.
 *
 * Disabled segments stay natively disabled and leave the walk
 * (`focusableWhenDisabled={false}`); `gen-settings-bar.test.tsx` covers the
 * tab-stop half in jsdom, where Base UI's arrow handling does not run.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
    </GenSettingsBar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("toolbar", { name: "Generation settings" });
    const segments = canvas.getAllByRole("button");
    await expect(segments).toHaveLength(5);
    await expect(segments.every((segment) => bar.contains(segment))).toBe(true);
    const nameOf = (el: Element | null) => el?.textContent?.trim() ?? "nothing";

    // 1. One tab stop.
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(segments[0]));
    await userEvent.tab();
    await expect(`after one tab: inside=${canvasElement.contains(document.activeElement)}`).toBe(
      "after one tab: inside=false",
    );
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(document.activeElement).toBe(segments[0]));

    // 2 and 3. One lap of ArrowRight, settling on departure from each stop.
    const start = document.activeElement as HTMLElement;
    await expect(start.matches(":focus-visible")).toBe(true);
    await settledFocusRing(start, waitFor);
    const seen = new Set<Element>([start]);
    let previous: Element = start;
    for (let i = 1; i < segments.length; i += 1) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(focused.matches(":focus-visible")).toBe(true);
      await settledFocusRing(focused, waitFor);
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(segments.length);
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(document.activeElement).toBe(start));
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(document.activeElement).toBe(segments[segments.length - 1]));
  },
};

/**
 * Segments with no text, which is what the strip's tail looks like at
 * compact density: an audio toggle and a re-roll beside the values that
 * still print. `children` is a segment's only source of an accessible
 * name — there is no `label` prop and no title fallback — so each of these
 * has to carry its own `aria-label` or it ships as an unnamed button.
 *
 * The second thing this renders is the target. The segment's padding is
 * tuned for a text value at 12px, so with the text removed the button
 * collapses to the icon plus its padding — measured here at 30×22 CSS
 * pixels, under the 24×24 minimum WCAG 2.2 asks for. It sits in a strip of
 * other controls rather than in isolation, which is the exception the
 * criterion allows, and axe does not flag it. But 22px is the smallest
 * thing this component can produce, and it is worth seeing before an
 * icon-only segment is made a primary affordance.
 */
export const EmptyLabel: Story = {
  render: (args) => (
    <GenSettingsBar aria-label="Generation settings" {...args}>
      <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
      <GenSettingsItem onClick={() => {}} aria-label="Mute generated audio">
        <Volume2 aria-hidden className="size-3.5" />
      </GenSettingsItem>
      <GenSettingsItem onClick={() => {}} aria-label="Randomize seed">
        <Shuffle aria-hidden className="size-3.5" />
      </GenSettingsItem>
    </GenSettingsBar>
  ),
};

/**
 * A long value in the model segment, inside a 320px box standing in for a
 * composer's settings slot. The strip's answer to long content is to do
 * nothing: there is no `truncate`, no `max-w`, no `flex-wrap` and no scroll
 * container anywhere in the component, so it is an inline-flex that grows
 * and then overruns whatever holds it.
 *
 * That is worth rendering because A7's home is somebody else's slot —
 * `media-prompt-bar` takes it as `settings`, `generation-panel` names it as
 * the lighter alternative to a parameter panel — and in both the caller,
 * not the component, decides what gives.
 *
 * The convention's ~90 characters is not reachable with content this
 * system would really emit. The honest ceiling for a segment is a
 * community fine-tune name carrying its variant, which is what is here;
 * padding it to 90 would be testing a string rather than the component.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-80 rounded-md border p-2">
      <GenSettingsBar aria-label="Generation settings" {...args}>
        <GenSettingsItem onClick={() => {}}>Wan 2.2 Animate 14B — character replacement</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
      </GenSettingsBar>
    </div>
  ),
};

/**
 * 375px, in the arrangement it ships in: the settings strip on the line
 * under a composer. The five segments measure 242px here, so the full
 * video configuration clears a phone with room to spare — which is the
 * case the pattern was drawn for, and the reason the values are terse.
 * "720p", not "720p HD".
 *
 * The strip has no fallback beyond that fitting. It cannot wrap and it
 * cannot scroll, so the segment past the edge does not reflow and does not
 * announce itself; see `LongContent` for what one long value does to the
 * same row. At this width the segment count is a product decision rather
 * than a styling one, and the component gives no affordance for getting it
 * wrong.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <div className="flex flex-col gap-2 border-t p-2">
        <p className="text-muted-foreground text-xs">A drone shot pulling back over the harbour at dawn</p>
        <GenSettingsBar aria-label="Generation settings" {...args}>
          <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
        </GenSettingsBar>
      </div>
    </div>
  ),
};

/**
 * The three strips of parameters, side by side. They share a shape — a row
 * of small controls with values on them — and answer different questions.
 * The choosing rule is what a click changes:
 *
 * - **Gen settings bar (A7)** — changes what you get next. Nothing on
 *   screen moves when you use it; the effect appears in the run you have
 *   not launched yet, which is why the segments show values rather than
 *   states.
 * - **Filter bar (A5)** — changes what you are looking at now. It acts on
 *   a list that already exists, so its chips carry applied/unapplied
 *   state, a remove affordance and a way to clear everything.
 * - **Field row (A6)** — the same parameters, given room. One per line
 *   with a label, an optional hint and a place for a reset, for a panel
 *   where a value needs explaining rather than merely showing.
 *
 * The short test: if the control changes what is on screen, it is a
 * filter. If it changes what comes out next, it is a settings bar. If it
 * needs a label to be understood at all, it has outgrown the strip and
 * belongs in a row.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Gen settings bar — sets the next run</p>
        <GenSettingsBar aria-label="Generation settings">
          <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
          <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
        </GenSettingsBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Filter bar — narrows what is already listed</p>
        <FilterBar>
          <FilterChip active onClick={() => {}} onRemove={() => {}}>
            Videos
          </FilterChip>
          <FilterChip onClick={() => {}}>Images</FilterChip>
          <AddFilterChip onClick={() => {}}>Model</AddFilterChip>
          <FiltersButton onClick={() => {}} />
        </FilterBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Field row — one parameter, with room to explain it
        </p>
        <FieldRow label="Duration" hint="Longer clips cost proportionally more credits">
          {(controlId, describedBy) => (
            <UnitInput id={controlId} aria-describedby={describedBy} unit="s" defaultValue={4} />
          )}
        </FieldRow>
      </section>
    </div>
  ),
};
