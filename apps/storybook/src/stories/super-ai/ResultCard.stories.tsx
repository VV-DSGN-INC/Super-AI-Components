import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Sparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { ResultCard } from "@/registry/super-ai/result-card";
import { ResultCardDocs } from "@/content/components/result-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

function Media({ label }: { label: string }) {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-8" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * A ~90-character prompt excerpt. Prompts are the one text slot a caller
 * genuinely cannot bound, so this is the fixture for `LongContent` and for the
 * narrow-width stories.
 */
const LONG_PROMPT =
  "a red bicycle leaning on a sunlit wall in the late afternoon, 35mm, shallow depth of field";

const SHORT_PROMPT = "A red bicycle leaning on a sunlit wall";

/** Provenance a real generation would carry: cost, seed, model, size, age. */
const LONG_FOOTER = "17 credits · seed 4471 · flux-1.1-pro · 1024×1024 · finished 4 minutes ago";

const meta: Meta<typeof ResultCard> = {
  title: "Super AI/Result Card",
  component: ResultCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ResultCardDocs) } },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: {
    aspect: "square",
    label: SHORT_PROMPT,
  },
};

export default meta;
type Story = StoryObj<typeof ResultCard>;

/**
 * The slot before anything has been asked of the server. It is already the
 * card's final size — that is the entire reason this state exists rather than
 * rendering nothing until the first byte arrives — and the only thing telling
 * a reader it has not started is the sr-only status region, since the media
 * frame is the same empty `bg-muted` box `queued` and `streaming` use.
 */
export const Idle: Story = {
  args: { state: "idle" },
};

/**
 * Accepted, waiting for capacity. Nothing in the frame differs from `idle`;
 * the queue position in `badge` is doing the work, which is why a queue UI
 * that omits it leaves two states looking identical.
 */
export const Queued: Story = {
  args: { state: "queued", badge: "3rd in queue" },
};

/**
 * The only state that moves. `progress` drives a determinate bar pinned over
 * the top of the frame, and the status region reads "Generating, 62%" — the
 * number reaches assistive tech through the status text, not through the bar,
 * which is not a live region. Pass no number and you get an indeterminate bar
 * with nothing in it; see `ReducedMotion`.
 */
export const Streaming: Story = {
  args: {
    state: "streaming",
    progress: 62,
    children: <Media label="Generating" />,
  },
};

/**
 * Resolved. This is the first state with anything in the footer, and the
 * footer's height was already reserved in the three before it — so the card
 * does not grow at the moment the result lands, which is what keeps a grid
 * still. Hover actions live over the frame and cost no layout either.
 */
export const Done: Story = {
  args: {
    state: "done",
    badge: "Image",
    footer: <span>17 credits · seed 4471</span>,
    children: <Media label="The finished result" />,
    actions: (
      <Button size="icon-sm" variant="secondary" aria-label="Download result">
        <Download aria-hidden />
      </Button>
    ),
  },
};

/**
 * Failure rendered where the result would have been, with Retry inside the
 * card — the spec's second bullet, and the reason a toast is not enough at
 * twenty tiles. The tile stops being a button here: it hosts a control now,
 * and a nested interactive is both an axe failure and the wrong affordance.
 * Note the children are dropped entirely, so a partial render is not shown.
 */
export const Failed: Story = {
  args: {
    state: "failed",
    onRetry: () => {},
    children: <Media label="What failed to generate" />,
  },
};

/**
 * Paywalled, and the children stay mounted under a scrim — the spec's third
 * bullet, "the shape of what would have been made, then the CTA". An empty
 * box with a padlock would tell a reader nothing about whether the thing
 * behind it is worth paying for.
 */
export const Locked: Story = {
  args: {
    state: "locked",
    children: <Media label="A preview of the locked result" />,
    lockedAction: <Button size="sm">Upgrade to unlock</Button>,
  },
};

/**
 * The media is opaque to the card: an image, a clip, a waveform or a block of
 * generated text all sit in the same frame, which is why this is one component
 * rather than five.
 */
export const MediaTypes: Story = {
  render: (args) => (
    <div className="grid w-[34rem] grid-cols-3 gap-3">
      <ResultCard {...args} state="done" aspect="square" label="Image · 1:1">
        <Media label="A generated image" />
      </ResultCard>
      <ResultCard {...args} state="done" aspect="square" label="Audio · 0:32">
        <Media label="A generated audio clip" />
      </ResultCard>
      <ResultCard {...args} state="done" aspect="square" label="Text · 240 words">
        <p className="text-foreground h-full overflow-hidden p-3 text-xs">
          The bicycle leaned against a wall the colour of turned earth, its frame catching what was left of
          the afternoon.
        </p>
      </ResultCard>
    </div>
  ),
};

/**
 * Select mode. The checkbox takes the slot the hover actions would occupy —
 * the two are never live at the same time.
 */
export const SelectMode: Story = {
  args: {
    state: "done",
    selectable: true,
    selected: true,
    onSelect: () => {},
    footer: <span>17 credits</span>,
    children: <Media label="A selected result" />,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations one result card meets in a gallery, as
 * opposed to the lifecycle enumeration above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines:
 * it has absolutely-positioned corner slots, a state that animates, several
 * focusables whose set changes with the state, a `selected`/`onSelect` pair a
 * host holds, three optional text slots, an author-supplied prompt excerpt,
 * and two near-twins (A8 `preview-tile` underneath it, C4 `recent-grid`
 * beside it).
 *
 * A ninth, `StableGeometry`, is the spec's first bullet measured. It is an
 * extra export rather than one of the eight, and it is the only place in the
 * repo where "card geometry is identical in all states" is checked rather
 * than asserted in prose.
 * ---------------------------------------------------------------------- */

/**
 * Every helper below reads a *settled* computed style. That matters more here
 * than in most files: the vendored `Button` carries `transition-all` with a
 * 150ms duration and no reduced-motion branch (`CONTINUE.md` §8), so its
 * focus ring **fades in**. Measured on Retry under emulated reduce: at focus
 * time and again after one animation frame `boxShadow` reads
 * `oklab(0 0 0 / 0) 0px 0px 0px 0px`; at 250ms it reads
 * `oklab(0.708 0 0 / 0.5) 0px 0px 0px 3px`.
 *
 * That is the mechanism behind §8's note that the shared ring check is weaker
 * than it reads — the false positive is not only a weak predicate, it is a
 * *transient value*. So this file does two things differently: it polls with
 * `waitFor` instead of reading once, and it requires a shadow layer with a
 * non-zero length **and** a non-transparent colour rather than a string that
 * merely is not "none".
 */
function shadowLayers(boxShadow: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of boxShadow) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) layers.push(current.trim());
  return layers;
}

function hasVisibleRing(el: Element): boolean {
  const style = getComputedStyle(el);
  const painted = shadowLayers(style.boxShadow).some((layer) => {
    const lengths = [...layer.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => Number(m[1]));
    if (lengths.length === 0 || lengths.every((n) => n === 0)) return false;
    // `oklab(… / 0)` and `rgba(…, 0)` are both fully transparent.
    return !/\/\s*0\s*\)/.test(layer) && !/rgba?\([^)]*,\s*0\s*\)/.test(layer);
  });
  if (painted) return true;
  return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
}

async function expectVisiblyFocused(el: HTMLElement, name: string) {
  await expect(`${name} focus-visible=${el.matches(":focus-visible")}`).toBe(`${name} focus-visible=true`);
  await waitFor(async () => {
    await expect(`${name} ring=${hasVisibleRing(el)}`).toBe(`${name} ring=true`);
  });
}

/**
 * The spec's first bullet, measured rather than asserted in prose: *card
 * geometry is identical in all states, so grids never reflow when a result
 * resolves.* Six cards, one per state, each with the content that state would
 * really carry — a queue position, a progress bar, a footer only `done` has,
 * a Retry button, an unlock CTA — and all six measure **173×221** with a 36px
 * footer, which is the reserved minimum in five of the six.
 *
 * The grid is `items-start` on purpose. A default `grid` stretches every cell
 * in a row to the tallest, which would make the six agree for a reason that
 * has nothing to do with the component: the first version of this measurement
 * passed against a stretching grid and proved nothing. With `items-start`
 * each card takes its natural height and the agreement is the component's.
 *
 * This is a grid of every state, which the convention normally forbids. It
 * earns the exception by being a measuring rig for one claim rather than a
 * menu of options — these are six moments in one lifecycle, not six variants
 * a designer picks between. `LongContent` records the one input that does
 * break the agreement.
 */
export const StableGeometry: Story = {
  render: () => (
    <div className="grid w-[34rem] grid-cols-3 items-start gap-3">
      {(["idle", "queued", "streaming", "done", "failed", "locked"] as const).map((state) => (
        <ResultCard
          key={state}
          data-testid={`geometry-${state}`}
          state={state}
          aspect="square"
          label={SHORT_PROMPT}
          badge={state === "queued" ? "3rd in queue" : "Image"}
          progress={state === "streaming" ? 62 : undefined}
          footer={state === "done" ? <span>17 credits · seed 4471</span> : undefined}
          onRetry={state === "failed" ? () => {} : undefined}
          lockedAction={state === "locked" ? <Button size="sm">Upgrade to unlock</Button> : undefined}
        >
          <Media label={state} />
        </ResultCard>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sizes = new Map<string, string>();

    for (const state of ["idle", "queued", "streaming", "done", "failed", "locked"]) {
      const card = canvas.getByTestId(`geometry-${state}`);
      const box = card.getBoundingClientRect();
      const footer = card.querySelector('[data-slot="result-card-footer"]')!.getBoundingClientRect();
      sizes.set(
        state,
        `${Math.round(box.width)}x${Math.round(box.height)} footer=${Math.round(footer.height)}`,
      );
    }

    // One string per state so a failure names the state that drifted.
    for (const [state, size] of sizes) {
      await expect(`${state}: ${size}`).toBe(`${state}: 173x221 footer=36`);
    }
  },
};

/**
 * Right-to-left, with the prompt excerpt in Arabic so the overlay label is
 * doing real bidi work rather than sitting in a mirrored box. The text side
 * is clean: the label's computed `direction` follows the container to `rtl`
 * and its `text-align: start` resolves to the right edge, because nothing in
 * the card pins the text direction.
 *
 * **The corners do not mirror, and the finding is that they cannot be fixed
 * here alone.** Measured against the tile's own box in both directions: the
 * badge sits 8px from the *physical right* edge and the select checkbox 8px
 * from the *physical left* edge, in LTR and RTL alike. So the arrangement
 * inverts — in LTR the checkbox leads and the badge trails; in RTL the
 * checkbox trails and the badge leads.
 *
 * Two classes produce it, and they live in two files. `result-card.tsx` puts
 * `left-2` on both the select slot and the hover-action slot; A8's badge slot
 * is `right-2`, which is already a row in `CONTINUE.md` §8's logical-property
 * sweep table (`preview-tile.tsx:150`, `right-2` → `end-2`). **Swapping only
 * this component's half would be worse than leaving it**: `start-2` under RTL
 * resolves to the right edge, which is exactly where the un-swept badge still
 * is, so the checkbox would land on top of the badge. The two swaps are one
 * change, and this wave could not make it — F1 may not edit A8. Recorded, not
 * swept.
 *
 * The play function pins the invariant that survives either outcome: the
 * badge and the select control never overlap. It fails on the half-swap and
 * passes on the full one, which is the assertion worth having.
 */
export const RTL: Story = {
  render: () => (
    <div className="flex w-[34rem] items-start gap-3">
      <div data-testid="ltr" dir="ltr" className="w-64">
        <ResultCard
          state="done"
          label={SHORT_PROMPT}
          badge="Image"
          selectable
          selected={false}
          onSelect={() => {}}
          footer={<span>17 credits · seed 4471</span>}
        >
          <Media label="A generated image" />
        </ResultCard>
      </div>
      <div data-testid="rtl" dir="rtl" className="w-64">
        <ResultCard
          state="done"
          label="دراجة حمراء تستند إلى جدار مشمس"
          badge="صورة"
          selectable
          selected={false}
          onSelect={() => {}}
          footer={<span>١٧ رصيدًا · البذرة ٤٤٧١</span>}
        >
          <Media label="A generated image" />
        </ResultCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const dir of ["ltr", "rtl"]) {
      const root = canvas.getByTestId(dir);
      const label = root.querySelector('[data-slot="preview-tile-label"]')!;

      // The text half mirrors on its own — no `dir` pin anywhere in the card.
      await expect(`${dir} label direction=${getComputedStyle(label).direction}`).toBe(
        `${dir} label direction=${dir}`,
      );

      // The invariant, whichever way the corner slots are eventually pinned:
      // the badge and the select control occupy different corners.
      const badge = root.querySelector('[data-slot="preview-tile-badge"]')!.getBoundingClientRect();
      const select = root.querySelector('[data-slot="result-card-select"]')!.getBoundingClientRect();
      const overlaps = Math.min(badge.right, select.right) > Math.max(badge.left, select.left);
      await expect(`${dir} badge overlaps select=${overlaps}`).toBe(`${dir} badge overlaps select=false`);
    }
  },
};

/**
 * `prefers-reduced-motion: reduce`, which the whole vitest project runs under.
 * One branch really exists and the story proves it: A8's skeleton carries
 * `motion-reduce:animate-none`, so `animationName` reads back `"none"` on the
 * `idle` and `streaming` tiles instead of the pulse.
 *
 * **The E/P wave's `preset-grid` finding does not reproduce here, and that is
 * the useful half.** Wave 2 recorded that under reduced motion a loading tile
 * and a failed tile collapse into the same grey box, because A8 paints both
 * on `bg-muted` and E4 passes no `action` node. F1 does pass one: the failed
 * card renders the words "Generation failed" plus Retry inside the frame, so
 * the two states stay distinguishable with the pulse suppressed. The play
 * function asserts exactly that, so the distinguishing text cannot be
 * refactored away silently.
 *
 * **What does collapse here is `idle` against a `streaming` card with no
 * progress number.** Measured: the skeleton is `oklch(0.97 0 0)` on a frame
 * of `oklch(0.97 0 0)`, so with the pulse off it is invisible; and an
 * indeterminate `Progress` renders a track in that same `oklch(0.97 0 0)`
 * with a zero-width indicator, because the vendored primitive has no
 * indeterminate treatment. `state="streaming"` with `progress` omitted —
 * which the prop's own doc comment offers as "an indeterminate bar" — is
 * therefore pixel-identical to `idle` for a reduced-motion user. The
 * separation survives only in the sr-only status text, which is what the last
 * assertion records. Both cards are rendered side by side; nothing asserts
 * they look alike, because that is the bug, not the contract.
 *
 * One more transition is deliberately left alone. The hover-action slot has
 * `transition-opacity`, and a crossfade moves nothing — the qualifier in
 * `story-conventions.md` fact 3 that keeps `reset-affordance` from carrying a
 * `motion-reduce:` class it does not need. The progress *indicator* is a
 * different matter: it inherits `transition-all` from the vendored
 * `components/ui/progress.tsx`, so pushing a new percentage animates the bar
 * width with no reduced-motion branch. Vendored, so it is the same posture as
 * §8's `Button` press nudge — recorded, not patched from a case story.
 */
export const ReducedMotion: Story = {
  render: () => (
    <div className="grid w-[34rem] grid-cols-3 items-start gap-3">
      <ResultCard data-testid="rm-idle" state="idle" label={SHORT_PROMPT}>
        <Media label="Not started" />
      </ResultCard>
      <ResultCard data-testid="rm-streaming" state="streaming" label={SHORT_PROMPT}>
        <Media label="Generating" />
      </ResultCard>
      <ResultCard data-testid="rm-failed" state="failed" label={SHORT_PROMPT} onRetry={() => {}}>
        <Media label="What failed to generate" />
      </ResultCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The branch that exists: the skeleton stops pulsing.
    for (const state of ["idle", "streaming"]) {
      const skeleton = canvas.getByTestId(`rm-${state}`).querySelector('[data-slot="preview-tile-loading"]')!;
      await expect(`${state} skeleton animation=${getComputedStyle(skeleton).animationName}`).toBe(
        `${state} skeleton animation=none`,
      );
    }

    // Failure keeps a visible, non-colour signal with the pulse suppressed —
    // the collapse `preset-grid` records does not happen here.
    const failedFrame = canvas.getByTestId("rm-failed").querySelector('[data-slot="preview-tile-failed"]')!;
    await expect(failedFrame.textContent).toContain("Generation failed");
    const idleFrame = canvas.getByTestId("rm-idle").querySelector('[data-slot="preview-tile-frame"]')!;
    await expect(`idle frame has failure text=${idleFrame.textContent?.includes("Generation failed")}`).toBe(
      "idle frame has failure text=false",
    );

    // …and the channel that still separates `idle` from an unnumbered
    // `streaming`, which is the only one left once the pulse is off.
    const statusOf = (state: string) =>
      canvas.getByTestId(`rm-${state}`).querySelector('[data-slot="result-card-status"]')!.textContent;
    await expect(`${statusOf("idle")} / ${statusOf("streaming")}`).toBe("Not started / Generating");
  },
};

/**
 * Two cards, four stops, and the point is that the set of stops is decided by
 * the state rather than by the props. The `done` card contributes three — the
 * tile itself (a button because `onSelect` is passed), the hover action, and
 * a footer control — while the `failed` card contributes exactly one, Retry,
 * because a frame that hosts a control stops being a button. A keyboard user
 * moving through a grid therefore finds the stop count changing under them as
 * results resolve.
 *
 * The hover action is the stop worth watching. It is mounted at `opacity-0`
 * and revealed by `group-focus-within`, never `display: none`, so Tab reaches
 * it *and* it becomes visible on arrival — the assertion below is the
 * difference between a reachable control and a reachable invisible one.
 *
 * Every stop is checked for a ring with the settled, alpha-aware helper at
 * the top of this file rather than the usual `boxShadow !== "none"`; three of
 * these four stops read a fully transparent, zero-size shadow if you read
 * them at focus time, which is the false positive `CONTINUE.md` §8 describes.
 *
 * **Recorded, not asserted: focus is lost on every state transition.** When
 * `streaming` becomes `failed`, the focusable tile is replaced by an inert
 * frame plus Retry; when a retry succeeds, Retry unmounts. Either way the
 * element under focus disappears on a polling tick rather than a keypress and
 * focus falls to `<body>`. The card's docs page already carries it; this walk
 * stops short of driving a transition, because asserting where focus lands
 * today would pin the loss green.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex w-[34rem] items-start gap-3">
      <div className="w-64">
        <ResultCard
          state="done"
          label={SHORT_PROMPT}
          badge="Image"
          onSelect={() => {}}
          actions={
            <Button size="icon-sm" variant="secondary" aria-label="Download this result">
              <Download aria-hidden />
            </Button>
          }
          footer={
            <Button size="sm" variant="ghost">
              Remix
            </Button>
          }
        >
          <Media label="The finished result" />
        </ResultCard>
      </div>
      <div className="w-64">
        <ResultCard state="failed" label={SHORT_PROMPT} onRetry={() => {}}>
          <Media label="What failed to generate" />
        </ResultCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const stops = [...canvasElement.querySelectorAll<HTMLElement>("button, a[href], [tabindex]")];
    await expect(`stops=${stops.length}`).toBe("stops=4");

    // Three from the resolved card, one from the failed one — whose frame is
    // a div, not a button, because it hosts Retry.
    const failedFrame = canvasElement.querySelectorAll('[data-slot="preview-tile-frame"]')[1];
    await expect(`failed frame tag=${failedFrame.tagName}`).toBe("failed frame tag=DIV");

    // Identified by slot or accessible name rather than text: the tile's own
    // text is the media's sr-only string plus the badge plus the prompt.
    const idOf = (el: HTMLElement) => {
      for (const slot of ["preview-tile-frame", "result-card-retry"]) {
        if (el.matches(`[data-slot="${slot}"]`)) return slot;
      }
      return el.getAttribute("aria-label") ?? el.textContent?.trim();
    };

    const order = ["preview-tile-frame", "Download this result", "Remix", "result-card-retry"];
    for (const [index, expected] of order.entries()) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(`stop ${index}=${idOf(focused)}`).toBe(`stop ${index}=${expected}`);
      await expectVisiblyFocused(focused, `stop ${index}`);
    }

    // The hover action is revealed by focus, not merely reachable while
    // invisible. Its own fade is why this is a `waitFor`.
    const actions = canvasElement.querySelector('[data-slot="result-card-actions"]')!;
    const download = within(canvasElement).getByRole("button", { name: "Download this result" });
    download.focus();
    await waitFor(async () => {
      await expect(`actions opacity=${getComputedStyle(actions).opacity}`).toBe("actions opacity=1");
    });
  },
};

/**
 * The card holds no selection of its own: `selected` is the host's value and
 * `onSelect` is the request to change it. Both routes into it are driven
 * here, because they are different controls with the same contract — the
 * checkbox that `selectable` mounts, and the tile itself, which becomes a
 * toggle button reporting `aria-pressed` when `selectable` is off.
 *
 * All three of the convention's assertions hold. Clicking either control
 * leaves the rendered value where it was; the callback fires once; the value
 * moves only when the host applies it; and re-rendering with an unchanged
 * `selected` holds the card fixed.
 *
 * **What the readout on the right records is the gap: `onSelect` is
 * `() => void`.** Measured — the handler is invoked with zero arguments, in
 * both routes. A8's `onSelect` carries no payload and F1 drops the boolean
 * Base UI's checkbox hands it (`onCheckedChange={() => onSelect()}`), so a
 * host learns *that* a card was toggled and never *to what*. In select mode
 * that is recoverable, since the host holds `selected` for the card it
 * mounted; in a bulk flow driven by keyboard where several cards can change
 * in a tick, it makes `onSelect` a strictly weaker signal than the primitive
 * it wraps. The count is displayed rather than asserted — freezing the
 * argument count would pin the shortcoming.
 */
export const Controlled: Story = {
  render: function ControlledShell() {
    const [checkboxSelected, setCheckboxSelected] = React.useState(false);
    const [tileSelected, setTileSelected] = React.useState(false);
    const [calls, setCalls] = React.useState<number[]>([]);
    const [pass, setPass] = React.useState(1);
    const record = (...args: unknown[]) => setCalls((c) => [...c, args.length]);

    return (
      <div className="flex w-[34rem] items-start gap-4">
        <div className="w-64">
          <ResultCard
            data-testid="checkbox-card"
            state="done"
            label={SHORT_PROMPT}
            selectable
            selected={checkboxSelected}
            onSelect={record}
            footer={<span>17 credits</span>}
          >
            <Media label="A result in select mode" />
          </ResultCard>
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-40">
            <ResultCard
              data-testid="tile-card"
              state="done"
              label={SHORT_PROMPT}
              selected={tileSelected}
              onSelect={record}
              footer={<span>9 credits</span>}
            >
              <Media label="A browsable result" />
            </ResultCard>
          </div>

          <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt>selected props</dt>
            <dd data-testid="values">{`${checkboxSelected} / ${tileSelected}`}</dd>
            <dt>onSelect arg counts</dt>
            <dd data-testid="arg-counts">{calls.join(",") || "—"}</dd>
            <dt>host render pass</dt>
            <dd data-testid="render-pass" className="tabular-nums">
              {pass}
            </dd>
          </dl>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
              Re-render
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCheckboxSelected(true);
                setTileSelected(true);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    const tile = canvas.getByRole("button", { name: /A browsable result/ });

    // Interaction alone moves nothing: both controls report and wait.
    await userEvent.click(checkbox);
    await userEvent.click(tile);
    await expect(`checkbox=${checkbox.getAttribute("aria-checked")}`).toBe("checkbox=false");
    await expect(`tile=${tile.getAttribute("aria-pressed")}`).toBe("tile=false");
    await expect(canvas.getByTestId("values")).toHaveTextContent("false / false");

    // …but both reported. Two clicks, two callbacks.
    await expect(canvas.getByTestId("arg-counts").textContent?.split(",")).toHaveLength(2);

    // A host re-render with unchanged values holds the card fixed.
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(`checkbox=${checkbox.getAttribute("aria-checked")}`).toBe("checkbox=false");
    await expect(`tile=${tile.getAttribute("aria-pressed")}`).toBe("tile=false");

    // The value moves when, and only when, the host applies it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(async () => {
      await expect(`checkbox=${checkbox.getAttribute("aria-checked")}`).toBe("checkbox=true");
    });
    await expect(
      `tile=${canvas.getByRole("button", { name: /A browsable result/ }).getAttribute("aria-pressed")}`,
    ).toBe("tile=true");
  },
};

/**
 * Every text slot on this card is optional — `label`, `badge` and `footer` —
 * and a gallery that has not resolved its prompts yet renders all three
 * empty. The layout survives it exactly as designed: an unlabelled card
 * measures the same as a labelled one, because the overlay label is
 * absolutely positioned and the footer's height is reserved rather than
 * derived from its contents. The play function measures both against each
 * other rather than against a constant.
 *
 * The state word still reaches assistive tech: the sr-only status region is
 * not a text slot a caller can empty, so a card with nothing in it still
 * announces "Result ready".
 *
 * **The defect this story exists to find, recorded and deliberately not
 * rendered.** Add `onSelect` to an unlabelled card and A8 makes the frame a
 * `<button>` whose only content is the media — so with no `label`, no
 * `badge`, and an `<img alt="">` or a decorative div inside, the button has
 * no accessible name at all. Measured by rendering it: axe fails
 * `button-name` on
 * `button[data-slot="preview-tile-frame"]` with "Element does not have inner
 * text that is visible to screen readers". A8 has the escape hatch for
 * exactly this case — `frameLabel`, documented as "for the one case the
 * component cannot name itself" — and F1 does not forward it, so a caller who
 * wants a selectable card without a visible prompt has no way to name it.
 * Adding the passthrough is an API change, so it is recorded here and in the
 * report rather than made from a story. The story keeps the tiles inert,
 * which is the only configuration that is currently correct.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-[34rem] items-start gap-3">
      <div className="w-64">
        <ResultCard
          data-testid="labelled"
          state="done"
          label={SHORT_PROMPT}
          badge="Image"
          footer={<span>17 credits</span>}
        >
          <Media label="The finished result" />
        </ResultCard>
      </div>
      <div className="w-64">
        <ResultCard data-testid="bare" state="done">
          <Media label="The finished result" />
        </ResultCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const labelled = canvas.getByTestId("labelled");
    const bare = canvas.getByTestId("bare");

    // No label element at all, and no badge — the empty case, not a blank string.
    await expect(`bare label nodes=${bare.querySelectorAll('[data-slot="preview-tile-label"]').length}`).toBe(
      "bare label nodes=0",
    );

    // Emptying every text slot changes nothing about the box.
    const height = (el: HTMLElement) => Math.round(el.getBoundingClientRect().height);
    await expect(`bare height=${height(bare)}`).toBe(`bare height=${height(labelled)}`);
    await expect(
      `bare footer=${Math.round(
        bare.querySelector('[data-slot="result-card-footer"]')!.getBoundingClientRect().height,
      )}`,
    ).toBe("bare footer=36");

    // The one channel a caller cannot empty.
    await expect(bare.querySelector('[data-slot="result-card-status"]')).toHaveTextContent("Result ready");

    // Inert, so nothing here is an unnamed control. See the description for
    // what happens when `onSelect` is added.
    await expect(`bare frame tag=${bare.querySelector('[data-slot="preview-tile-frame"]')!.tagName}`).toBe(
      "bare frame tag=DIV",
    );
  },
};

/**
 * A ~90-character prompt and a full provenance line, which is what a real
 * generation carries once seed, model and size are in it. The two slots make
 * opposite decisions, and only one of them keeps the card's promise.
 *
 * **The label truncates and costs nothing.** A8's overlay label is `truncate`
 * — `white-space: nowrap` with an ellipsis — so the 90-character prompt lays
 * out at 507px inside a 224px frame and is cut to one line. The whole string
 * stays in the accessible name, so a screen-reader user hears the prompt a
 * sighted user only sees the start of; the play function asserts that, since
 * a `title` attribute would be the obvious "fix" and would not add anything
 * the name does not already carry.
 *
 * **The footer wraps and grows the card, which is the one input that breaks
 * `StableGeometry`.** Measured at the same 224px width: the short footer is
 * 36px and the card 304px; the long footer is 41px and the card **309px**.
 * `min-h-9` is a floor, not a fixed height, so a provenance line long enough
 * to wrap makes one card in a grid taller than its neighbours — precisely the
 * reflow the component's docs say it exists to prevent, arriving through the
 * slot nobody measures. The media half of the guarantee still holds and is
 * asserted; the footer half is recorded and left unasserted, because pinning
 * `309 > 304` would freeze the defect.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-[34rem] items-start gap-3">
      <div className="w-64">
        <ResultCard
          data-testid="short"
          state="done"
          label="A red bicycle"
          badge="Image"
          footer={<span>17 credits</span>}
        >
          <Media label="The finished result" />
        </ResultCard>
      </div>
      <div className="w-64">
        <ResultCard
          data-testid="long"
          state="done"
          label={LONG_PROMPT}
          badge="Image · 1024×1024"
          footer={<span>{LONG_FOOTER}</span>}
        >
          <Media label="The finished result" />
        </ResultCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const long = canvas.getByTestId("long");
    const label = long.querySelector('[data-slot="preview-tile-label"]') as HTMLElement;

    // Cut visually, on one line.
    await expect(`label white-space=${getComputedStyle(label).whiteSpace}`).toBe("label white-space=nowrap");
    await expect(`label clipped=${label.scrollWidth > label.clientWidth}`).toBe("label clipped=true");

    // …and whole in the text, which is where the prompt actually has to survive.
    await expect(label).toHaveTextContent(LONG_PROMPT);

    // The media half of the geometry guarantee holds whatever the text does.
    const frameHeight = (id: string) =>
      Math.round(
        canvas.getByTestId(id).querySelector('[data-slot="preview-tile-frame"]')!.getBoundingClientRect()
          .height,
      );
    await expect(`long frame=${frameHeight("long")}`).toBe(`long frame=${frameHeight("short")}`);

    // The badge grows with its own text and stays inside the frame.
    const badge = long.querySelector('[data-slot="preview-tile-badge"]')!.getBoundingClientRect();
    const frame = long.querySelector('[data-slot="preview-tile-frame"]')!.getBoundingClientRect();
    await expect(`badge inside frame=${badge.left >= frame.left && badge.right <= frame.right}`).toBe(
      "badge inside frame=true",
    );
  },
};

/**
 * 375px, which for this card means a 343px square of media and a card 423px
 * tall — a single result taking most of a phone screen, so the footer's
 * contents matter more here than anywhere else.
 *
 * The frame is `w-[375px]` with **no `max-w-full`**, which is a deliberate
 * departure from the convention's wrapper. This file's meta decorator wraps
 * every story in `w-64`, so `max-w-full` resolves against 256px and the
 * "375px" frame silently measures 256 — the same class of wrong-for-the-
 * wrong-reason measurement that `layout: "centered"` produces, one level in.
 * The width is asserted rather than assumed for that reason.
 *
 * The component has no `sm:`/`md:` variants, so the caveat about a wrapper
 * constraining width rather than the breakpoint does not apply: this is the
 * real narrow-width layout, not a desktop layout squeezed. Nothing scrolls
 * sideways, the prompt truncates instead of pushing the card wide, and Retry
 * measures 73×28 — above WCAG 2.2's 24×24 floor, which is worth stating
 * because it is the only control a failed card offers.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="flex w-[375px] flex-col gap-3">
      <ResultCard
        data-testid="mobile-streaming"
        state="streaming"
        progress={62}
        label={LONG_PROMPT}
        badge="Image · 1024×1024"
        footer={<span>17 credits · seed 4471</span>}
      >
        <Media label="Generating" />
      </ResultCard>
      <ResultCard
        data-testid="mobile-failed"
        state="failed"
        label={SHORT_PROMPT}
        onRetry={() => {}}
        footer={<span>0 credits · nothing charged</span>}
      >
        <Media label="What failed to generate" />
      </ResultCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");

    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");

    for (const id of ["mobile-streaming", "mobile-failed"]) {
      const card = canvas.getByTestId(id);
      await expect(`${id} overflows=${card.scrollWidth > card.clientWidth}`).toBe(`${id} overflows=false`);
      await expect(
        `${id} card=${Math.round(card.getBoundingClientRect().width)}x${Math.round(
          card.getBoundingClientRect().height,
        )}`,
      ).toBe(`${id} card=375x423`);
    }

    // The prompt is cut, not allowed to widen the card.
    const label = canvas.getByTestId("mobile-streaming").querySelector('[data-slot="preview-tile-label"]')!;
    await expect(`prompt clipped=${label.scrollWidth > label.clientWidth}`).toBe("prompt clipped=true");

    // The only control a failed card offers, against WCAG 2.2's 24×24.
    const retry = canvas.getByRole("button", { name: "Retry" }).getBoundingClientRect();
    await expect(`retry=${Math.round(retry.width)}x${Math.round(retry.height)}`).toBe("retry=73x28");
  },
};

/**
 * Three tiles with a picture in them, chosen by one question: what is the
 * thing in the frame, and who is waiting for it.
 *
 * - **Preview tile (A8)** — the frame itself, and nothing else. It has no
 *   lifecycle and no footer; its states are about what the *frame* is doing
 *   (loading, locked, failed), not about a job. Reach for it when the tile is
 *   a cell in a picker and the content already exists.
 * - **Result card (F1)** — one asset moving through a generation. It adds the
 *   lifecycle, the reserved footer, retry and the paywall, and it is the only
 *   one of the three that has to look right *before* there is anything to
 *   show. F2 `generation-grid` is a grid of these; F1 is the single card.
 * - **Recent grid (C4)** — finished work you are coming back to. Every cell
 *   is already resolved, so its metadata is about age and duration rather
 *   than cost and seed, and there is no state in which it is waiting.
 *
 * So: if it can be pending, it is a result card. If it can only be opened, it
 * is a recent grid cell. If it is neither — no job, no history, just a framed
 * thumbnail — it is a preview tile, and wrapping it in a card adds a footer
 * nobody has anything to put in.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[34rem] flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Preview tile — a frame, no lifecycle</p>
        <div className="w-40">
          <PreviewTile aspect="square" label="Watercolour" labelPlacement="below">
            <Media label="A style thumbnail" />
          </PreviewTile>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Result card — one asset being generated</p>
        <div className="w-40">
          <ResultCard state="streaming" progress={62} label={SHORT_PROMPT} badge="Image">
            <Media label="Generating" />
          </ResultCard>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recent grid — finished work, returned to</p>
        <RecentGrid
          items={[
            {
              id: "bicycle",
              title: "Red bicycle study",
              editedAgo: "2 hours ago",
              thumbnail: <Media label="A saved project" />,
              onOpen: () => {},
            },
            {
              id: "wall",
              title: "Sunlit wall textures",
              editedAgo: "yesterday",
              thumbnail: <Media label="A saved project" />,
              onOpen: () => {},
            },
          ]}
        />
      </section>
    </div>
  ),
};
