import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";
import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { MediaPromptBarDocs } from "@/content/components/media-prompt-bar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MediaPromptBar> = {
  title: "Super AI/Media Prompt Bar",
  component: MediaPromptBar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MediaPromptBarDocs) } },
};

export default meta;
type Story = StoryObj<typeof MediaPromptBar>;

const SETTINGS = (
  <GenSettingsBar aria-label="Generation settings">
    <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
    <GenSettingsItem>16:9</GenSettingsItem>
    <GenSettingsItem>720p</GenSettingsItem>
  </GenSettingsBar>
);

/**
 * Over a canvas, with nothing else competing for the space. This is the
 * presentation that *drops* something: `showSettings` is gated on
 * `!isFloating`, so the A7 strip passed in here is not rendered at all — the
 * bar keeps its own controls and lets the canvas keep the room. The `max-w-2xl`
 * cap and the ring/shadow are what make it read as floating rather than docked,
 * and they are the only two visual differences.
 */
export const Floating: Story = {
  args: {
    presentation: "floating",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

/**
 * The default, anchored to the bottom of a generation workspace. Everything the
 * bar can carry is present at once here — settings strip, cost chip, attach,
 * negative-prompt toggle — which is why the docked variant is the one with a
 * `rounded-t-2xl border-b-0` shape: it is drawn as the bottom edge of the
 * viewport, not as a card floating in it.
 */
export const Docked: Story = {
  args: {
    presentation: "docked",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

/**
 * The compact form: `max-w-sm`, `text-sm`, and no negative prompt — the toggle
 * is not disabled, it is never rendered, because `canHaveNegativePrompt` is
 * false for this presentation regardless of what a caller passes.
 *
 * Read the name as historical. The workflow node this presentation was sized
 * for is family G, cut by decision D9, so nothing in the catalog embeds it
 * today. What ships is a standalone narrow composer, and that is what this
 * story renders — the presentation is real, its host is not.
 */
export const NodeEmbedded: Story = {
  args: {
    presentation: "node-embedded",
    cost: 2,
    onSubmit: () => {},
  },
};

/**
 * The plan limit, gated where the spend would have happened. The whole
 * `media-prompt-bar-field` subtree is gone — textarea, toolbar, submit — and
 * the paywall row takes its place inside the same bar, which is the point: a
 * user cannot type a prompt they are not allowed to run.
 *
 * The unlock button is the only focusable element left, so this state is one
 * tab stop. That is also where the recorded focus gap bites: switching `locked`
 * on unmounts whatever held focus with nothing catching it, and no live region
 * announces the change (see the docs page's focus and screen-reader notes).
 */
export const Locked: Story = {
  args: {
    locked: true,
    lockedTitle: "You've hit your plan's limit",
    lockedDescription: "Upgrade to keep generating.",
    lockedCtaLabel: "Upgrade",
    onUnlock: () => {},
  },
};

/**
 * The "what to avoid" field, opened in place below the prompt. Two things are
 * worth noticing: the toggle button is replaced by an X *inside* the new row
 * rather than staying in the toolbar, so opening the row rearranges the tab
 * sequence; and the row is a plain div with a real `<label>` but no group role,
 * so a screen reader meets two independently named textareas rather than a
 * prompt and its negation.
 */
export const NegativePrompt: Story = {
  args: {
    negativePrompt: true,
    negativeValue: "blurry, low quality, watermark",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply and
 * why the one that is missing here is missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — the only transition D1 adds crossfades a colour
 * The bar declares no `animate-*` anywhere, and the single `transition-*` it
 * owns is `transition-colors` on the root. That crossfades a colour and moves
 * nothing, which is the case the convention's third mechanical fact rules out
 * by name (`reset-affordance` is the recorded precedent) — suppressing it would
 * document no branch. The negative-prompt row appears by conditional render,
 * not by transition, and the textarea's growth is `field-sizing` layout rather
 * than an animation.
 *
 * One thing here does move under `prefers-reduced-motion`, and it is not D1's:
 * the vendored `Button` primitive carries `transition-all` with
 * `active:not-aria-[haspopup]:translate-y-px`, so every button in the bar
 * shifts a pixel while pressed. That class lives in
 * `apps/docs/components/ui/button.tsx` and is shared by every button in the
 * registry, so it is a primitive-wide posture rather than something D1 branches
 * on. Recorded in the wave report, not swept into this component.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. Direction is load-bearing in three places, and the third one
 * deliberately refuses to flip:
 *
 * - The toolbar is `justify-between`, so attach / negative-toggle / settings /
 *   cost move to the right edge and **Generate** moves to the left. Nothing in
 *   the bar uses a physical `pl-`/`ml-`/`text-left` class, so this is the flex
 *   axis doing the work rather than a mirrored stylesheet.
 * - The negative row's header is `justify-between` too, so its visible label and
 *   its dismiss X swap ends together.
 * - The cost chip does **not** flip: `cost-chip` pins `dir="ltr"` on its amount,
 *   so `5 credits` keeps the number before the unit instead of reordering
 *   around it.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="w-full">
      <MediaPromptBar {...args} />
    </div>
  ),
  args: {
    presentation: "docked",
    negativePrompt: true,
    negativeValue: "blurry, low quality, watermark",
    value: "A slow dolly-in through morning fog",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
};

/**
 * The tab sequence with the negative prompt open, which is the arrangement the
 * docs page claims and the only one where the order is surprising: the second
 * field and its dismiss X sit **between** the prompt and the toolbar, because
 * the negative row is a sibling of the textarea rather than part of the
 * toolbar. Opening the row does not append a stop, it inserts two in the middle
 * and takes the toggle off the end.
 *
 * The play function walks that sequence and asserts a visible focus treatment
 * at every **button** stop. It stops short of asserting one on either textarea,
 * and that is not an oversight: D1 passes `border-none focus-visible:ring-0` to
 * suppress the field's own ring on the understanding that the container carries
 * it, and no presentation adds a `focus-within` treatment. So the two textareas
 * are tab stops with no visible focus indication beyond the caret. Recorded in
 * the docs page's focus notes and in the wave report; pinning the current
 * appearance with an assertion would freeze the defect.
 */
export const KeyboardOrder: Story = {
  render: (args) => <MediaPromptBar {...args} />,
  args: {
    presentation: "docked",
    negativePrompt: true,
    value: "A slow dolly-in through morning fog",
    cost: 5,
    onSubmit: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const stops = [
      canvas.getByRole("textbox", { name: "Prompt" }),
      canvas.getByRole("button", { name: "Remove negative prompt" }),
      canvas.getByRole("textbox", { name: "Negative prompt" }),
      canvas.getByRole("button", { name: "Attach reference" }),
      canvas.getByRole("button", { name: "Generate" }),
    ];

    // Baseline, so the ring assertions below cannot pass vacuously: an
    // unfocused Button paints no box-shadow at all.
    await expect(getComputedStyle(stops[4]).boxShadow).toBe("none");

    stops[0].focus();
    await expect(document.activeElement).toBe(stops[0]);

    for (const stop of stops.slice(1)) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(stop);

      if (stop.tagName === "BUTTON") {
        await expect(stop.matches(":focus-visible")).toBe(true);
        const style = getComputedStyle(stop);
        await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
      }
    }
  },
};

/**
 * The prompt driven entirely from outside. `value ?? internalValue` means a
 * supplied `value` wins in every render, so typing into the field reports the
 * edit and leaves the rendering where the host put it — the host decides
 * whether a keystroke becomes a prompt.
 *
 * The payload matters as much as the refusal: `onValueChange` fires with
 * `event.target.value`, the whole next prompt rather than the character that
 * was typed, so a host can apply it unmodified — which is what **Apply** does.
 * **Re-render** proves the third part of the contract. The component keeps a
 * private `internalValue` and updates it on every keystroke, so a re-render
 * with an unchanged `value` is exactly where that private copy would surface if
 * the precedence ran the other way.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prompt = canvas.getByRole("textbox", { name: "Prompt" }) as HTMLTextAreaElement;
    const applied = "A slow dolly-in through morning fog";

    await expect(prompt).toHaveValue(applied);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.type(prompt, "!", {
      initialSelectionStart: applied.length,
      initialSelectionEnd: applied.length,
    });
    await expect(prompt).toHaveValue(applied);

    // 2. …but the callback fired, with the whole next prompt as its payload.
    await expect(canvas.getByTestId("requested")).toHaveTextContent(`${applied}!`);

    // 3. Re-render with an unchanged `value`. Confirm the pass really happened
    //    first, so the value assertion after it is not vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(prompt).toHaveValue(applied);

    // The reported payload was enough to apply the change unmodified.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(prompt).toHaveValue(`${applied}!`);
  },
};

function ControlledHost() {
  const [applied, setApplied] = React.useState("A slow dolly-in through morning fog");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <MediaPromptBar
        presentation="docked"
        value={applied}
        onValueChange={setRequested}
        cost={5}
        onSubmit={() => {}}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>value prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onValueChange</dt>
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
 * Every optional slot emptied — no placeholder, no settings strip, no cost
 * chip, no reference strip, no context chips. What is left is the bar's
 * irreducible form, and it is mostly empty space: the prompt field has no
 * visible label by design (the `<label>` is `sr-only` and `aria-label` carries
 * the same string), so clearing `placeholder` leaves a blank box with nothing
 * on screen saying what it is for. The name survives; the affordance does not.
 *
 * Submit is disabled here too — it is gated on a non-empty trimmed value — so
 * the empty bar has one fewer reachable control than a filled one. The
 * icon-only attach button keeps its name from `attachLabel`'s default;
 * emptying *that* would ship an unnamed control, which the docs page files
 * under don'ts rather than something this story renders into an axe gate
 * running at `test: "error"`.
 */
export const EmptyLabel: Story = {
  args: {
    presentation: "docked",
    placeholder: "",
    onSubmit: () => {},
  },
};

/**
 * The bar's answer to a long prompt is **wrap, grow, never scroll and never
 * truncate** — but the growth does not start where you would expect, which is
 * why this story renders two lengths rather than one.
 *
 * The convention's ~90 characters change nothing at all. `min-h-16` is 64px and
 * a wrapped line here is 20px, so the field ships with room for two full lines
 * plus its `py-2` before it has to move: a 99-character prompt wraps invisibly
 * inside that headroom and the bar stays exactly the height it was empty.
 *
 * Past two lines the vendored `Textarea`'s `field-sizing-content` takes over —
 * D1 overrides that field's border, background, padding, ring and `min-h` but
 * never `field-sizing` — and the field grows a line at a time. Nothing caps it:
 * there is no `max-h` on the textarea or on the root, and `resize-none` removes
 * the handle a user could have pulled back, so a long enough prompt grows the
 * bar until it runs out of viewport. That matters most in the presentation
 * shown here, because floating over a canvas is exactly where an uncapped
 * composer eats the thing it is composing for.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          99 characters — absorbed by the field's own headroom
        </p>
        <MediaPromptBar
          presentation="floating"
          value="A slow dolly-in through morning fog toward a lighthouse, shot on 35mm, muted palette, no lens flare"
          cost={5}
          onSubmit={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          259 characters — past two lines, the field grows
        </p>
        <MediaPromptBar
          presentation="floating"
          value="A slow dolly-in through morning fog toward a lighthouse, shot on 35mm with a shallow depth of field, muted blue-grey palette, gulls crossing the frame twice, no lens flare and no visible camera shake, holding on the lamp room for a beat before the horn sounds"
          cost={5}
          onSubmit={() => {}}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [short, long] = canvas.getAllByRole("textbox", { name: "Prompt" }) as HTMLTextAreaElement[];

    // Two lines fit inside `min-h-16`, so the shorter prompt does not lift the
    // floor — and it does not scroll either.
    await expect(short.clientHeight).toBe(64);
    await expect(short.scrollHeight).toBeLessThanOrEqual(short.clientHeight);

    // The longer one is past the headroom, so growth is what happens instead of
    // a scrollbar. Both halves matter: taller than the floor, and nothing
    // hidden inside it.
    //
    // The sample is 259 characters rather than the 199 it started at. How many
    // lines a string wraps to is font-derived, and 199 crossed the two-line
    // boundary in the Google-hosted Geist and stopped crossing it in the
    // self-hosted one — the assertion went red on a fixture that was only just
    // long enough. Per D21 the fix is a sample that is unambiguously past two
    // lines in any reasonable stack, not a weaker assertion.
    await expect(long.clientHeight).toBeGreaterThan(short.clientHeight);
    await expect(long.scrollHeight).toBeLessThanOrEqual(long.clientHeight);
  },
};

/**
 * 375px, with everything the docked bar can carry. The toolbar is `flex-wrap`,
 * so the answer to a narrow viewport is to stack rather than scroll: the
 * actions group and **Generate** end up on separate lines and the bar grows
 * downward. Nothing here is horizontally scrollable, which the play function
 * pins — the settings strip is the piece most likely to break that, since
 * `gen-settings-bar` is an `inline-flex` row with no wrap of its own.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <MediaPromptBar {...args} />
    </div>
  ),
  args: {
    presentation: "docked",
    value: "A slow dolly-in through morning fog",
    settings: SETTINGS,
    cost: 5,
    onSubmit: () => {},
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot='media-prompt-bar']");
    await expect(root).not.toBeNull();
    await expect(root!.scrollWidth).toBeLessThanOrEqual(root!.clientWidth);
  },
};

/**
 * D1 beside C1 `hero-omnibox`. Both are a textarea with a toolbar and a cost
 * chip, and they are not interchangeable — the rule is what is already on
 * screen:
 *
 * - **Hero omnibox** is the empty state's only content. It is centred, it asks
 *   the open question, and it carries the decisions taken once before the first
 *   run: mode tabs and a model select. After it submits, it is gone.
 * - **Media prompt bar** is the working composer. It sits over or under output
 *   that already exists, it is used again for every iteration, and it carries
 *   the apparatus that only matters once a result is on screen — the negative
 *   prompt, the D2 reference-strip slot, the A7 settings strip, and the three
 *   presentations that let it dock, float or shrink.
 *
 * If the screen is empty, it is C1. If there is something to iterate on, it is
 * D1. And if the prompt belongs to one spot inside a document rather than to
 * the screen, it is neither: that is K2 `inline-generate-popup`, a popover
 * anchored to a caret.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Hero omnibox — the empty screen asks once</p>
        <HeroOmnibox cost={5} onSubmit={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Media prompt bar — the composer you keep using</p>
        <MediaPromptBar presentation="docked" settings={SETTINGS} cost={5} onSubmit={() => {}} />
      </section>
    </div>
  ),
};
