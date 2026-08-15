import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { ResultCard } from "@/registry/super-ai/result-card";
import { PreviewTileDocs } from "@/content/components/preview-tile.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PreviewTile> = {
  title: "Super AI/Preview Tile",
  component: PreviewTile,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PreviewTileDocs) } },
  // The frame is w-full inside a flex column, so it has no intrinsic width —
  // in a centered layout it would collapse to nothing. Every consumer sizes
  // it from a grid track; this stands in for one.
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PreviewTile>;

/**
 * Colour fill standing in for whatever media a tile holds — this component
 * never knows. Nameless by default, because the children are the only thing
 * an interactive frame can take its accessible name from; `name` is the
 * `role="img"` workaround that becomes necessary wherever the label sits
 * outside the frame (see `EmptyLabel`).
 */
function Fill({ className, name }: { className: string; name?: string }) {
  return <div role={name ? "img" : undefined} aria-label={name} className={`h-full w-full ${className}`} />;
}

/* -------------------------------------------------------------------------
 * Declared states. Proposed normalization of the manifest's
 * ["image/video/colour/text/3D", "selected", "locked", "loading", "failed"]:
 * the first cell packed five media kinds into one state, but media kind is
 * an axis — image, video, colour, text and 3D all arrive through the same
 * children slot and the primitive never inspects them — so it is shown
 * across these stories rather than enumerated as five states.
 *
 *   ready · selectable · selected · loading · locked · failed
 *
 * `ready` rather than `default`: the prop value is still "default", but a
 * state named `default` would become a `Default` export, which the house
 * rule forbids. Renaming the prop value to match is an API change and is
 * carried in the report instead.
 * ---------------------------------------------------------------------- */

/**
 * A tile that is only a picture. No `onSelect`, so the frame renders as an
 * inert div: no tab stop, no button semantics, nothing to press. This is the
 * form `frame-strip` and `preset-grid` use when a parent element owns the
 * click, and it is the base every other state is a variation on.
 */
export const Ready: Story = {
  args: {
    label: "Neon noir",
    children: <Fill className="bg-primary" />,
  },
};

/**
 * The same tile offered as a choice. `onSelect` swaps the frame to a native
 * button — Enter and Space, focus and disabled semantics for free — and adds
 * `aria-pressed="false"`. Worth knowing before you reach for it: pressed is
 * toggle semantics, so a grid where exactly one tile can win wants a radio
 * around an inert tile instead (see the `Boundary` and `Controlled` notes).
 */
export const Selectable: Story = {
  args: {
    label: "Pastel",
    onSelect: () => {},
    children: <Fill className="bg-secondary" />,
  },
};

/**
 * The chosen tile. The ring is a box-shadow drawn outside the box, so
 * selecting contributes no layout and a grid never reflows as the choice
 * moves — the reason the spec insists on a ring and not a border.
 */
export const Selected: Story = {
  args: {
    label: "Neon noir",
    selected: true,
    onSelect: () => {},
    children: <Fill className="bg-primary" />,
  },
};

/**
 * Waiting. The skeleton fills the frame the finished picture will occupy, at
 * the same aspect ratio, so the cell is exactly as tall now as it will be
 * when the result lands. Label and badge stay put — only the content is
 * replaced.
 *
 * The badge is a real `Badge`, not a bare string, and that is not decoration:
 * the badge slot paints no surface of its own, so plain text in it inherits
 * `text-foreground` and lands on whatever the picture happens to be. Over a
 * dark thumbnail that is a contrast failure the component cannot see coming
 * — measured on this story's neighbours. Every consumer passes a `Badge`.
 */
export const Loading: Story = {
  args: {
    label: "Overhead harbour at dawn",
    state: "loading",
    badge: <Badge variant="secondary">2nd in queue</Badge>,
  },
};

/**
 * Behind the paywall. The children stay rendered and a scrim goes over them,
 * so the tile shows the shape of what would have been made and then the CTA
 * — never an empty box with a padlock.
 *
 * The frame is deliberately not interactive here: `action` renders *inside*
 * the frame, so an `onSelect` as well would nest the Upgrade button inside a
 * button. That is invalid markup and axe fails it, which is why `result-card`
 * drops its own handler in this state.
 */
export const Locked: Story = {
  args: {
    label: "Cinematic 4K",
    state: "locked",
    action: (
      <Button type="button" size="sm" variant="secondary">
        Upgrade
      </Button>
    ),
    children: <Fill className="bg-primary" />,
  },
};

/**
 * The generation did not come back. Content is replaced rather than dimmed,
 * and `action` carries whatever comes next.
 *
 * The text here is `text-foreground`, not the `text-destructive` this
 * component used to inherit: destructive body text on the frame's `bg-muted`
 * measures 4.34:1 against a 4.5:1 minimum. Both real consumers already
 * overrode it back at the call site, so the fix made the shipped look the
 * default. Colour now rides on the icon, where 4.0:1 is enough and no meaning
 * is carried by colour alone.
 *
 * The play function is here because that promotion created a dependency
 * nothing else can see: `result-card.tsx:129` and `frame-strip.tsx:162`
 * deleted their local overrides and now cite this default in comments, so if
 * it moves — or is simply dropped, leaving the overlay to inherit again —
 * both regress and every gate stays green.
 */
export const Failed: Story = {
  args: {
    label: "Overhead harbour at dawn",
    state: "failed",
    action: (
      <>
        <AlertTriangle aria-hidden className="text-destructive size-4" />
        <span>Generation failed</span>
        <Button type="button" size="sm" variant="outline">
          Retry
        </Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const tile = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile"]');
    const overlay = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-failed"]');
    await expect(tile).not.toBeNull();
    await expect(overlay).not.toBeNull();

    // What `text-foreground` resolves to in this theme, read back rather than
    // written as a literal: the token is free to move, the coupling is not.
    const probe = document.createElement("span");
    probe.className = "text-foreground";
    canvasElement.appendChild(probe);
    const foreground = getComputedStyle(probe).color;
    probe.remove();

    // Colour the tile from outside with the destructive value this overlay
    // used to inherit. Storybook's own body is already `text-foreground`, so
    // without a differing ancestor an inheriting overlay would read back as
    // foreground anyway and this assertion would prove nothing.
    const restore = tile!.style.color;
    tile!.style.color = "var(--destructive)";
    await expect(getComputedStyle(tile!).color).not.toBe(foreground);

    // Painted, not inherited.
    await expect(getComputedStyle(overlay!).color).toBe(foreground);
    tile!.style.color = restore;
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no case-skip lines. That is unusual
 * and worth one sentence of justification rather than being read as
 * box-ticking: this primitive animates (`ReducedMotion`), forks between a
 * button and a div (`KeyboardOrder`), exposes a selected/onSelect controlled
 * pair (`Controlled`), has an optional label with a `none` placement
 * (`EmptyLabel`), takes author-supplied caption text (`LongContent`), pins
 * its badge with physical rather than logical classes (`RTL`), and has two
 * card-shaped neighbours built on top of it (`Boundary`).
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and one thing here does not mirror.
 *
 * What does: the label overlay is `inset-x-0` and takes its alignment from
 * direction, so the caption right-aligns and truncates from the left, and the
 * grid lays its tiles out right to left.
 *
 * What does not: the badge is `absolute top-2 right-2` — physical classes —
 * so it stays visually top-right, which under `dir="rtl"` is the *start* of
 * the tile rather than its end. In a strip of frames marked "In"/"Out" that
 * puts the mark on the wrong corner of every tile.
 *
 * Recorded rather than fixed. No component in this registry uses logical
 * inset utilities (`start-*`/`end-*` appear zero times across all 114, while
 * 23 files use the physical pair), so adopting them here would make this the
 * only one — a system-wide decision, not a per-component one. Same posture
 * as `credits-indicator`'s RTL story, which documents an identical defect in
 * its divider. Carried in the retrofit report.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="grid grid-cols-2 gap-3">
      <PreviewTile {...args} label="Neon noir" badge={<Badge variant="secondary">12:04</Badge>} selected>
        <Fill className="bg-primary" />
      </PreviewTile>
      <PreviewTile {...args} label="Pastel" badge={<Badge variant="secondary">3:41</Badge>}>
        <Fill className="bg-secondary" />
      </PreviewTile>
    </div>
  ),
  args: { aspect: "video", onSelect: () => {} },
};

/**
 * The skeleton is the only thing in this component that moves, and until this
 * retrofit it moved for everyone: a bare `animate-pulse` with no
 * `motion-reduce:` branch, one of the fourteen animating components
 * `CONTINUE.md` §9 records as ignoring the media feature. It now carries
 * `motion-reduce:animate-none`.
 *
 * The play function is what makes this story worth more than a screenshot.
 * `vitest.config.ts` runs every test under Playwright's
 * `reducedMotion: "reduce"`, so the branch is live in the gate and the
 * skeleton's computed `animation-name` must be `none` — an assertion that
 * fails the moment somebody drops the class again. Open the same story in
 * the Storybook UI without the preference set and it pulses, which is the
 * point: the animation is still there, it is just no longer unconditional.
 */
export const ReducedMotion: Story = {
  args: { label: "Overhead harbour at dawn", state: "loading" },
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector('[data-slot="preview-tile-loading"]');
    await expect(skeleton).not.toBeNull();
    await expect(getComputedStyle(skeleton as Element).animationName).toBe("none");
  },
};

/**
 * Tab traversal across a row of tiles, and the load-bearing fact is which
 * ones are *not* in it. Handing a tile `onSelect` is the single decision that
 * makes it a control; without one the frame is an inert div that still draws
 * the ring and still shows its label, and takes no focus at all. Two of the
 * three tiles below are pickable, so the row has exactly two stops.
 *
 * A defect this story deliberately does not pin: `locked` and `failed` do not
 * gate anything. There is no `disabled` prop, and a locked tile handed an
 * `onSelect` stays focusable and still fires on click — the scrim is paint,
 * not a lock. Consumers work around it by withholding the handler
 * (`result-card` does exactly this). Asserting the current behaviour would
 * make it permanent, so it is written down here and in the docs page instead.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3">
      <PreviewTile label="Neon noir" selected onSelect={() => {}}>
        <Fill className="bg-primary" />
      </PreviewTile>
      <PreviewTile label="Pastel" onSelect={() => {}}>
        <Fill className="bg-secondary" />
      </PreviewTile>
      <PreviewTile label="Reference">
        <Fill className="bg-accent" />
      </PreviewTile>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The inert tile contributes nothing focusable, so the row is two stops
    // long, not three.
    const stops = [
      canvas.getByRole("button", { name: "Neon noir" }),
      canvas.getByRole("button", { name: "Pastel" }),
    ];
    await expect(canvasElement.querySelectorAll("button, a[href]")).toHaveLength(stops.length);

    for (const expected of stops) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      // Every stop is visibly focused, not merely focusable.
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }
  },
};

/**
 * Harness for `Controlled`: the consumer owns the selection, and refuses one
 * of the picks — the pro preset needs an upgrade this account does not have.
 */
function ControlledPresetGrid() {
  const [selected, setSelected] = React.useState("neon-noir");
  const [picks, setPicks] = React.useState(0);

  const request = (id: string) => {
    setPicks((n) => n + 1);
    if (id !== "cinematic-4k") setSelected(id);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-3">
        <PreviewTile
          label="Neon noir"
          selected={selected === "neon-noir"}
          onSelect={() => request("neon-noir")}
        >
          <Fill className="bg-primary" />
        </PreviewTile>
        <PreviewTile label="Pastel" selected={selected === "pastel"} onSelect={() => request("pastel")}>
          <Fill className="bg-secondary" />
        </PreviewTile>
        <PreviewTile
          label="Cinematic 4K"
          selected={selected === "cinematic-4k"}
          onSelect={() => request("cinematic-4k")}
        >
          <Fill className="bg-accent" />
        </PreviewTile>
      </div>
      <p className="text-foreground text-xs">Picks requested: {picks}</p>
    </div>
  );
}

/**
 * The ring follows the prop, never the click. `selected` and `onSelect` are a
 * controlled pair with no internal state behind them: pressing a tile fires
 * the callback and changes nothing on screen until the owner re-renders with
 * a new `selected`. Here the owner refuses the pro preset, so clicking it
 * counts the pick and leaves the ring where it was — which is what makes a
 * paywalled or validated picker possible without the grid lying for a frame
 * first.
 *
 * Two clauses of the convention's `Controlled` shape need naming rather than
 * faking. `onSelect` is a bare `() => void` with no payload, so the caller
 * has to close over the item's identity itself (`() => request(preset.id)`
 * above) — there is nothing arriving with the callback to apply. And the
 * interactive frame reports itself with `aria-pressed`, which is toggle
 * semantics: correct for a filter you turn on and off, wrong for the
 * mutually-exclusive grid rendered here. `preset-grid` avoids it by keeping
 * the tile inert and wrapping it in its own `role="radio"` button. Both are
 * API-shaped and carried in the report rather than patched here.
 */
export const Controlled: Story = {
  render: () => <ControlledPresetGrid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const neon = canvas.getByRole("button", { name: "Neon noir" });
    const pastel = canvas.getByRole("button", { name: "Pastel" });
    const pro = canvas.getByRole("button", { name: "Cinematic 4K" });

    await expect(neon).toHaveAttribute("aria-pressed", "true");

    // Refused pick: the callback fires, the rendered selection does not move.
    await userEvent.click(pro);
    await expect(canvas.getByText("Picks requested: 1")).toBeInTheDocument();
    await expect(pro).toHaveAttribute("aria-pressed", "false");
    await expect(neon).toHaveAttribute("aria-pressed", "true");

    // Re-picking the tile that is already selected re-renders with an
    // unchanged value and holds everything fixed.
    await userEvent.click(neon);
    await expect(canvas.getByText("Picks requested: 2")).toBeInTheDocument();
    await expect(neon).toHaveAttribute("aria-pressed", "true");

    // Only the owner moves the ring.
    await userEvent.click(pastel);
    await expect(pastel).toHaveAttribute("aria-pressed", "true");
    await expect(neon).toHaveAttribute("aria-pressed", "false");
  },
};

/**
 * `labelPlacement="none"` — a picture with no caption, which is how
 * `frame-strip` and `recent-grid`'s list layout both use this component. It
 * is also where an icon-only tap target fails, and this retrofit found the
 * failure is wider than the `none` placement.
 *
 * **The frame is named by its contents and by nothing else.** The overlay
 * label renders inside the frame, so it names the button; the `below` label
 * renders as a *sibling* of the frame, so it does not; `none` renders no
 * label at all. Two of the three placements therefore leave an interactive
 * tile with a decorative fill as a button with no accessible name — and
 * `recent-grid`'s grid layout ships exactly that pair (`labelPlacement="below"`
 * with `onSelect`). It has never been caught because its own stories pass no
 * `onOpen`, so every tile there renders as an inert div.
 *
 * It cannot be fixed from outside either: props spread onto the outer
 * wrapper, so an `aria-label` on `<PreviewTile>` lands on the div around the
 * tile and never reaches the `<button>`. The workaround is the left tile
 * below — name the picture itself with `role="img"`, which is what makes the
 * button announce "Frame 12 — harbour at dawn". The real fix is an
 * `aria-labelledby` from the frame to the label element; that is API-shaped,
 * so it is recorded rather than done here. The unnamed case is described and
 * not rendered, because shipping it would put a live `button-name` violation
 * into a gate that runs at `test: "error"`.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <PreviewTile aspect="video" labelPlacement="none" onSelect={() => {}}>
        <Fill className="bg-primary" name="Frame 12 — harbour at dawn" />
      </PreviewTile>
      <PreviewTile aspect="video" labelPlacement="none">
        <Fill className="bg-secondary" />
      </PreviewTile>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One control, and its name comes from the picture rather than a label
    // slot or a prop.
    const named = canvas.getByRole("button", { name: "Frame 12 — harbour at dawn" });
    await expect(named).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll("button")).toHaveLength(1);
  },
};

/**
 * An 87-character prompt excerpt, which is what a result tile's caption
 * actually is in this system. Both placements answer it the same way and it
 * is worth seeing side by side: `truncate` clips to one line, overlaid on the
 * left and below the frame on the right, so neither cell can grow taller than
 * its neighbour no matter how long the prompt was.
 *
 * Truncation is CSS, so the full string stays in the DOM: a screen reader
 * gets the whole prompt, a sighted user gets about forty characters and no
 * tooltip, because the component sets no `title`. If the rest matters, put it
 * somewhere the eye can reach.
 *
 * Only the left tile is interactive, and the asymmetry is the point rather
 * than an oversight. An overlay label lives inside the frame and so names the
 * button; a `below` label is a sibling of the frame and names nothing.
 * Handing the right tile an `onSelect` would ship an unnamed button — see
 * `EmptyLabel`, where that defect is recorded.
 */
export const LongContent: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-3">
      <PreviewTile {...args} labelPlacement="overlay" onSelect={() => {}}>
        <Fill className="bg-primary" />
      </PreviewTile>
      <PreviewTile {...args} labelPlacement="below">
        <Fill className="bg-primary" />
      </PreviewTile>
    </div>
  ),
  args: {
    aspect: "video",
    label: "Overhead drone shot of a harbour at dawn, long exposure, fog rolling over the breakwater",
  },
};

/**
 * 375px, in the two arrangements this component actually ships in: a
 * three-column preset grid with overlay labels, and a two-column project
 * shelf with the title below.
 *
 * No horizontal scroll, and the reason is structural — the frame takes its
 * height from its width, so a tile cannot have a minimum size to overflow
 * with. What the width costs is the caption. In the top row each tile is
 * about 105px wide and the overlay label truncates to roughly a word, which
 * is the whole argument for `below` placement in the bottom row and the
 * reason `recent-grid` uses it while `preset-grid` does not.
 *
 * The bottom row also carries both workarounds this component currently
 * needs from its callers: the duration is a `Badge` rather than bare text
 * (the badge slot paints no surface, so plain text lands on the picture), and
 * each thumbnail names itself, because a `below` label sits outside the frame
 * and cannot name the button. Both are recorded in `EmptyLabel` and the docs
 * page rather than patched here.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-4 p-2">
      <div className="grid grid-cols-3 gap-2">
        <PreviewTile label="Neon noir" selected onSelect={() => {}}>
          <Fill className="bg-primary" />
        </PreviewTile>
        <PreviewTile label="Pastel" onSelect={() => {}}>
          <Fill className="bg-secondary" />
        </PreviewTile>
        <PreviewTile label="Mono" onSelect={() => {}}>
          <Fill className="bg-accent" />
        </PreviewTile>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PreviewTile
          aspect="video"
          label="Q3 Launch Trailer"
          labelPlacement="below"
          badge={<Badge variant="secondary">12:04</Badge>}
          onSelect={() => {}}
        >
          <Fill className="bg-primary" name="Q3 Launch Trailer" />
        </PreviewTile>
        <PreviewTile
          aspect="video"
          label="Brand Explainer"
          labelPlacement="below"
          badge={<Badge variant="secondary">3:41</Badge>}
          onSelect={() => {}}
        >
          <Fill className="bg-secondary" name="Brand Explainer" />
        </PreviewTile>
      </div>
    </div>
  ),
};

/**
 * The tile and the two card-shaped components built on top of it. All three
 * are a picture in a fixed frame with a caption underneath, and they are not
 * interchangeable. The rule is what the caption is *about*:
 *
 * - **Preview tile (A8)** — nothing but the picture. A frame, a label, a
 *   badge, a ring. It has no metadata of its own and no opinion about what
 *   it holds, which is why thirteen components can build on it.
 * - **Recent grid (C4)** — a shelf of work you already have. Adds the things
 *   that make a project findable: how long it runs, when you last touched it,
 *   hover actions, and a first-class empty tile when there is nothing yet.
 * - **Result card (F1)** — one generated asset, with a run's lifecycle
 *   (idle → queued → streaming → done → failed → locked) and a footer whose
 *   height is reserved in every state so a grid never reflows as results land.
 *
 * The short test: if there is nothing to say under the picture, it is A8. If
 * what you have to say is about a saved project, it is C4. If it is about a
 * run — a cost, a seed, a retry — it is F1. Reaching for A8 and then adding
 * your own caption row under it is the failure mode all three of these exist
 * to prevent, because a caption the tile does not own is what makes one cell
 * taller than its neighbours.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[32rem] max-w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Preview tile — the frame and nothing else</p>
        <div className="w-40">
          <PreviewTile aspect="video" label="Q3 Launch Trailer" labelPlacement="below" onSelect={() => {}}>
            <Fill className="bg-primary" name="Q3 Launch Trailer" />
          </PreviewTile>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Recent grid — projects you already have</p>
        <RecentGrid
          items={[
            {
              id: "1",
              title: "Q3 Launch Trailer",
              durationLabel: "12:04",
              editedAgo: "Edited 19 hours ago",
              thumbnail: <Fill className="bg-primary" />,
            },
            {
              id: "2",
              title: "Brand Explainer",
              durationLabel: "3:41",
              editedAgo: "Edited 2 days ago",
              thumbnail: <Fill className="bg-secondary" />,
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Result card — one generated asset, with its run</p>
        <div className="w-40">
          <ResultCard
            state="done"
            aspect="video"
            label="Overhead harbour at dawn"
            footer={<span className="text-foreground text-xs">55 credits · Veo 3.1</span>}
          >
            <Fill className="bg-primary" />
          </ResultCard>
        </div>
      </section>
    </div>
  ),
};
