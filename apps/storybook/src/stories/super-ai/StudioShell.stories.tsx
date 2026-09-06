import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brush, Image as ImageIcon, LayoutTemplate, Settings, Shapes, Sparkles, Type } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { PropertyRow } from "@/registry/super-ai/property-inspector";
import { StudioShell, type StudioShellProps } from "@/registry/super-ai/studio-shell";
import { TimelineShell } from "@/registry/super-ai/timeline-shell";
import { StudioShellDocs } from "@/content/components/studio-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MODALITIES = [
  { id: "templates", label: "Templates", icon: <LayoutTemplate /> },
  { id: "elements", label: "Elements", icon: <Shapes /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "media", label: "Media", icon: <ImageIcon />, badge: "new" as const },
  { id: "draw", label: "Draw", icon: <Brush /> },
];

const PINNED = [{ id: "settings", label: "Settings", icon: <Settings /> }];

const FRAMES = ["Title", "Problem", "Approach", "Results"].map((name, index) => ({
  id: `p${index + 1}`,
  label: `${index + 1}. ${name}`,
}));

const TOOL_PANELS: StudioShellProps["toolPanels"] = {
  templates: {
    searchable: true,
    searchPlaceholder: "Search templates",
    presets: {
      label: "Styles",
      items: [
        { id: "editorial", label: "Bold editorial" },
        { id: "pastel", label: "Soft pastel" },
        { id: "mono", label: "Monospace brief" },
        { id: "dark", label: "Dark keynote" },
      ],
      defaultValue: "editorial",
    },
  },
  elements: {
    sections: [
      {
        id: "shapes",
        title: "Shapes",
        count: 4,
        items: [
          { id: "rect", label: "Rectangle", onSelect: () => {} },
          { id: "circle", label: "Ellipse", onSelect: () => {} },
          { id: "line", label: "Line", onSelect: () => {} },
          { id: "arrow", label: "Arrow", onSelect: () => {} },
        ],
      },
    ],
  },
  text: {
    sections: [
      {
        id: "styles",
        title: "Text styles",
        items: [
          { id: "heading", label: "Heading", onSelect: () => {} },
          { id: "body", label: "Body", onSelect: () => {} },
        ],
      },
    ],
  },
  media: {
    presets: {
      label: "Looks",
      content: "filter",
      items: [
        { id: "warm", label: "Warm film" },
        { id: "cool", label: "Cool matte" },
        { id: "bw", label: "Black and white" },
      ],
      defaultValue: "warm",
    },
    results: {
      label: "Generated",
      items: [
        { id: "r1", state: "done", label: "A quiet harbour at dawn", footer: <span>Ready</span> },
        { id: "r2", state: "streaming", progress: 62, label: "The same harbour at dusk" },
      ],
    },
  },
  draw: {
    sections: [
      {
        id: "brushes",
        title: "Brushes",
        items: [
          { id: "ink", label: "Ink pen", onSelect: () => {} },
          { id: "marker", label: "Marker", onSelect: () => {} },
        ],
      },
    ],
    drawing: {
      tools: [
        { id: "brush", label: "Brush", icon: <Brush /> },
        { id: "shape", label: "Shape", icon: <Shapes /> },
      ],
      activeToolId: "brush",
      onToolChange: () => {},
      brush: { size: 24, hardness: 70, opacity: 100 },
      onBrushChange: () => {},
      swatches: [
        { id: "ink", name: "Ink", value: "var(--foreground)" },
        { id: "brand", name: "Brand primary", value: "var(--primary)" },
      ],
      activeSwatchId: "ink",
      onSwatchChange: () => {},
    },
  },
};

const INSPECTOR: StudioShellProps["inspector"] = {
  sections: {
    text: [
      {
        id: "type",
        label: "Type",
        state: "modified",
        onReset: () => {},
        content: (
          <>
            <PropertyRow label="Font" state="modified" onReset={() => {}}>
              {(id) => <Input id={id} defaultValue="Geist Sans" />}
            </PropertyRow>
            <PropertyRow label="Size" hint="Points at 100% zoom">
              {(id, describedBy) => (
                <Input id={id} aria-describedby={describedBy} defaultValue="48" inputMode="numeric" />
              )}
            </PropertyRow>
          </>
        ),
      },
      {
        id: "layout",
        label: "Layout",
        content: (
          <PropertyRow label="X">{(id) => <Input id={id} defaultValue="120" inputMode="numeric" />}</PropertyRow>
        ),
      },
    ],
  },
};

const ARTBOARD = (
  <div className="bg-card text-card-foreground flex aspect-video w-full max-w-2xl flex-col justify-center gap-3 rounded-lg border p-10 shadow-sm">
    <p className="text-3xl font-semibold">Northwind, Series A</p>
    <p className="text-muted-foreground text-sm">The calm position is uncontested. Here is what it is worth.</p>
  </div>
);

const FULL_ARGS: StudioShellProps = {
  title: "Series A deck",
  topbar: { zoomLabel: "72%", savedLabel: "Saved just now" },
  modalities: MODALITIES,
  pinnedModalities: PINNED,
  activeModalityId: "templates",
  onModalityChange: () => {},
  toolPanels: TOOL_PANELS,
  selection: { type: "text", label: "Heading" },
  toolbar: {
    actions: [
      { id: "font", label: "Font", showLabel: true },
      { id: "colour", label: "Colour", showLabel: true },
      { id: "align", label: "Align", icon: <Type /> },
    ],
    aiIcon: <Sparkles />,
    onAction: () => {},
    onAiSelect: () => {},
  },
  inspector: INSPECTOR,
  frames: FRAMES,
  frameKind: "slides",
  activeFrameId: "p1",
  onFrameChange: () => {},
  onAddFrame: () => {},
  children: ARTBOARD,
};

const meta: Meta<typeof StudioShell> = {
  title: "Super AI/Studio Shell",
  component: StudioShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(StudioShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StudioShell>;

/** The working editor: a template panel, a selected heading, an artboard, four pages. */
export const Editing: Story = { args: FULL_ARGS };

/**
 * Nothing selected — the state the editor actually sits in most of the time.
 * The inspector falls to its own empty affordance and the floating toolbar does
 * not render at all, while the canvas and the panel carry on unchanged.
 */
export const NothingSelected: Story = {
  args: { ...FULL_ARGS, selection: undefined },
};

/**
 * The draw modality: I5 pinned below the panel, outside its scroll region.
 * The canvas is byte-for-byte the same node it was under Templates — the rail
 * chooses the panel and nothing else.
 */
export const Drawing: Story = {
  args: { ...FULL_ARGS, activeModalityId: "draw", selection: { type: "shape", label: "Rectangle" } },
};

/** The media modality generating: E4 looks above, F1 result cards below. */
export const Generating: Story = {
  args: { ...FULL_ARGS, activeModalityId: "media", selection: { type: "image", label: "Photo" } },
};

/**
 * Day one. No document, no selection, no pages — four empty affordances at
 * once: I1's, L1 on the canvas, I2's, and H5's own add tile standing in for the
 * page strip. Mandatory export for the block contract, and the version most new
 * users actually see.
 */
export const Empty: Story = {
  args: {
    title: "Untitled design",
    topbar: { zoomLabel: "100%" },
    modalities: MODALITIES,
    pinnedModalities: PINNED,
    onModalityChange: () => {},
    onAddFrame: () => {},
  },
};

/**
 * Narrow viewport. Below `md` the three middle regions stack into one scrolling
 * column — tool panel, canvas, page strip, inspector — rather than being
 * hidden, so nothing becomes unreachable. Mandatory export for the block
 * contract: a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API.
 * `parameters.viewport.defaultViewport` was removed in 9 and does nothing while
 * looking configured, so `options` is declared explicitly here and the
 * selection cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a six-region editor meets, as opposed to the
 * modality tours above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this shell, so there are no `case-skip` lines. That
 * follows from the layer: a block is arrangement, and every one of the eight
 * is a question about arrangement. It owns directional geometry (RTL), a
 * composed tree that animates (ReducedMotion), six regions' worth of tab
 * stops (KeyboardOrder), two value/onChange pairs (Controlled), four optional
 * name slots (EmptyLabel), five author-supplied text slots (LongContent), a
 * breakpoint (Mobile) and a declared variant in the same family (Boundary).
 *
 * Two conventions this file follows and the older shell stories do not:
 * `Mobile` moves the real viewport rather than wrapping a 375px box, and the
 * focus checks come from `@/lib/focus-ring` rather than the inline
 * `boxShadow !== "none"` string that 63 story files still carry.
 * ---------------------------------------------------------------------- */

/** Where a region's box sits, and which of its two inline edges is painted. */
function inlineEdges(canvasElement: HTMLElement, region: string) {
  const el = canvasElement.querySelector<HTMLElement>(`[data-region="${region}"]`)!;
  const box = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    left: Math.round(box.left),
    right: Math.round(box.right),
    borderLeft: style.borderLeftWidth,
    borderRight: style.borderRightWidth,
  };
}

/**
 * The whole shell mirrored. A studio is the most directional layout in the
 * catalog — two full-height edges with a stack of columns between them — so
 * everything here is about which edge each region takes and where the seams
 * between them are painted.
 *
 * **What this story fixed.** The two seams were physical (`md:border-r` on
 * the panel, `md:border-l` on the inspector) and both landed on the wrong
 * edge under RTL: the panel's border stacked against the rail's own
 * `border-e` at x=1108 while the panel/canvas seam at x=820 went unpainted,
 * and the inspector's border painted the shell's outer edge instead of the
 * canvas seam. `md:border-e` / `md:border-s` is the sanctioned swap and it is
 * byte-identical here — measured in the LTR frame before and after, because
 * N6 `usage-dashboard` showed the swap is only free on the element that
 * paints the border: panel 92..380 with a 1px right border and inspector
 * 912..1200 with a 1px left border, both times. The assertions below are the
 * regression guard, in H3 `track-lane`'s form.
 *
 * **What still does not mirror, and is not this shell's to fix.** H5
 * `frame-strip` pins its carousel arrows with `left-2` / `right-2`, and both
 * stay physical: in this mirrored frame Previous sits 20px from the strip's
 * *left* edge (308 inside a strip spanning 288..820) and Next 20px from its
 * right, so the arrow that means "earlier page" points at the end the strip
 * now finishes at. Underneath it, the vendored `Carousel` is never told
 * `direction` at all — J6 `template-detail` measured the worse half of that,
 * where both arrows go natively disabled under RTL and four previews become
 * unreachable. B4's rail and I3's toolbar are Base UI composites, so their
 * arrow travel still follows DOM order rather than direction: no
 * `DirectionProvider` is mounted anywhere in the registry.
 *
 * A wrapper is enough for everything asserted here because all of it is
 * in-flow layout. It would **not** be enough for I3's popovers: floating-ui
 * reads `align` off computed style, so a portalled surface needs `dir` on the
 * document (the `RtlDocument` idiom) — which is why this story asserts
 * geometry and `KeyboardOrder` opens the popover in LTR.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="h-full w-full">
      <StudioShell {...args} />
    </div>
  ),
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const rail = inlineEdges(canvasElement, "modality-rail");
    const panel = inlineEdges(canvasElement, "tool-panel");
    const canvas = inlineEdges(canvasElement, "canvas");
    const inspector = inlineEdges(canvasElement, "inspector");

    // 1. Mirrored, not merely reordered in the DOM: the first region paints
    //    at the frame's right edge and the last at its left.
    await expect(rail.left).toBeGreaterThan(panel.left);
    await expect(panel.left).toBeGreaterThan(canvas.left);
    await expect(canvas.left).toBeGreaterThan(inspector.left);
    await expect(inspector.left).toBe(0);

    // 2. Every seam paints on the edge it separates. The panel's border faces
    //    the canvas (its left, under RTL) and not the rail; the inspector's
    //    faces the canvas (its right) and not the shell's outer edge.
    await expect(`panel ${panel.borderLeft}/${panel.borderRight}`).toBe("panel 1px/0px");
    await expect(`inspector ${inspector.borderLeft}/${inspector.borderRight}`).toBe("inspector 0px/1px");

    // 3. …and the seams are where the regions actually meet, which is the
    //    part a class name alone cannot promise.
    await expect(panel.left).toBe(canvas.right);
    await expect(inspector.right).toBe(canvas.left);
  },
};

/**
 * `prefers-reduced-motion`. The shell itself has no `animate-*` and no
 * `transition-*` anywhere — it is arrangement — so everything that moves here
 * belongs to something it composes, and this story exists to say which and to
 * read the branch back rather than trust a class.
 *
 * Two surfaces reach it. A8 `preview-tile`'s skeleton pulse, which arrives
 * through E4 `preset-grid` (`items[].state`) and F1 `result-card`
 * (`state="streaming"`), carries the plain `motion-reduce:animate-none` and
 * that is enough because it sits on a real `animate-pulse`. I3's AI popover
 * is a Base UI popup and needs the restated
 * `motion-reduce:data-open:animate-none` pair, which `context-toolbar.tsx`
 * has carried since wave 1; a bare variant would read back `"enter"` here.
 * `vitest.config.ts` emulates reduce for every test, so both are read off the
 * live surfaces.
 *
 * **What suppressing the pulse costs, measured and not asserted.** E4 passes
 * no `action` node to A8, so its `failed` tile's only text is the preset's
 * own label — "Black and white" — while F1's failed card reads "Generation
 * failed / Retry" because it does pass one. With the pulse stopped, E4's
 * `loading` tile and its `failed` tile are two `bg-muted` squares that differ
 * in nothing a user can perceive. Both are rendered below; nothing asserts
 * they are distinguishable, because they are not. This is E4's gap
 * (`CONTINUE.md` §8, E/P wave) reached from a shell that puts the two states
 * in the same grid.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    activeModalityId: "media",
    selection: { type: "image", label: "Photo" },
    toolbar: {
      ...FULL_ARGS.toolbar,
      aiMenu: (
        <div className="flex flex-col gap-0.5 p-1 text-sm">
          <span className="rounded-md px-2 py-1.5">Remove background</span>
          <span className="rounded-md px-2 py-1.5">Upscale 2×</span>
        </div>
      ),
    },
    toolPanels: {
      ...TOOL_PANELS,
      media: {
        presets: {
          label: "Looks",
          content: "filter",
          items: [
            { id: "warm", label: "Warm film" },
            { id: "cool", label: "Cool matte", state: "loading" },
            { id: "bw", label: "Black and white", state: "failed" },
          ],
          defaultValue: "warm",
        },
        results: {
          label: "Generated",
          items: [{ id: "r2", state: "streaming", progress: 62, label: "The same harbour at dusk" }],
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The skeleton branch, read as a computed value — and paired with the
    //    class, so this cannot pass the way H1 `transport-controls` found a
    //    whole family of these passing: on an element that declares no
    //    animation in the first place, "none" is not evidence of a branch.
    const pulses = Array.from(document.querySelectorAll<HTMLElement>(".animate-pulse"));
    await expect(pulses.length).toBeGreaterThan(0);
    for (const pulse of pulses) {
      const state = pulse.closest("[data-slot='preview-tile']")?.getAttribute("data-state");
      await expect(`${state} declares=${pulse.classList.contains("animate-pulse")}`).toBe(
        `${state} declares=true`,
      );
      await expect(`${state} animation=${getComputedStyle(pulse).animationName}`).toBe(
        `${state} animation=none`,
      );
    }

    // 2. The one popup surface this shell opens. Base UI needs the restated
    //    pair; a bare `motion-reduce:animate-none` reads back "enter" here.
    await userEvent.click(canvas.getByRole("button", { name: "AI tools" }));
    const popover = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="context-toolbar-ai-menu"]');
      if (!el) throw new Error("the AI popover never opened");
      return el;
    });
    await expect(popover).toHaveAttribute("data-open");
    await expect(getComputedStyle(popover).animationName).toBe("none");

    // 3. Leave nothing mid-dismissal: axe runs the moment this returns, and a
    //    surface still fading out is measured at its transitional opacity.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[data-slot="context-toolbar-ai-menu"]')).toBeNull());
  },
};

/**
 * How a keyboard user gets between six regions. The answer is **Tab, and
 * nothing else** — there is no skip link, no region shortcut, and no arrow
 * key that crosses a region boundary. Arrow keys are owned by the composites
 * *inside* the regions and stop at their edges; two are asserted below, the
 * rail's travel and the canvas surface's refusal to move focus at all (it
 * takes arrows for scrolling, which is the whole reason it is a tab stop).
 *
 * So the cost of the layout is a number, and this story measures it: even
 * this deliberately small editor — two modalities, two presets, one action,
 * two pages, one property group — is **16 tab stops**, and the inspector's
 * own stop is the fifteenth, 14 presses from the rail through every control
 * in the middle three regions. That is the fact behind the docs page's "in a
 * full editor that is a long way": with the `Editing` fixture above it is 29
 * stops and the inspector is the twenty-second.
 *
 * Three of those stops are the shell's own rather than a composed
 * component's, and they exist because each is a scroll container with nothing
 * focusable inside it when empty (axe `scrollable-region-focusable`): I1's
 * body, the canvas surface, the inspector column. So an editor with nothing
 * in it is still three tab stops.
 *
 * **Every** stop is checked twice, because the two focus checks answer
 * different questions. `settledFocusRing` says something is painted, and
 * waits, because the vendored `Button`'s `transition-all` fades a ring in
 * over ~250ms — an immediate read on F1's Retry is where that was first
 * measured. The differential says focus is what painted it, taken here on the
 * next stop while focus is still on the previous one, so nothing blurs and
 * the sequence under test is undisturbed. Neither substitutes for the other:
 * a permanent `shadow-sm` passes the first, and a control resting at
 * `box-shadow: none` flips the second on the transition's first frame.
 *
 * **Recorded, not asserted.** Tab enters each of B4's toggle groups at its
 * *first* item rather than the pressed one — measured with `media` active and
 * `aria-pressed="true"`, `Templates` was the tabbable. The same defect
 * `mode-tabs` recorded in wave 1, on the same Base UI composite. This story
 * keeps the first modality active so the walk encodes nothing wrong. B4's
 * stacked label also paints at zero height (`ToggleGroupItem`'s `h-8`, see
 * `LongContent`), so every stop in the rail is visually an icon with a
 * tooltip.
 *
 * And the stop count is not stable across a session, which is the part no
 * assertion can carry: selecting something inserts I3's stop into the middle
 * of the order, and *clearing* the selection unmounts I3 — so focus on one of
 * its actions falls to `<body>` and the next Tab restarts from the top of the
 * page. The one return the shell can rely on is the one asserted below,
 * Escape from I3's own popover, because I3 owns it. Moving focus back to the
 * canvas after a selection is cleared is the host's job, and the docs page
 * says so.
 */
export const KeyboardOrder: Story = {
  args: {
    title: "Series A deck",
    topbar: { zoomLabel: "72%" },
    modalities: [MODALITIES[0], MODALITIES[1]],
    pinnedModalities: PINNED,
    activeModalityId: "templates",
    onModalityChange: () => {},
    toolPanels: {
      templates: {
        presets: {
          label: "Styles",
          items: [
            { id: "editorial", label: "Bold editorial" },
            { id: "pastel", label: "Soft pastel" },
          ],
          defaultValue: "editorial",
        },
      },
    },
    selection: { type: "text", label: "Heading" },
    toolbar: {
      actions: [{ id: "font", label: "Font", showLabel: true }],
      aiIcon: <Sparkles />,
      onAction: () => {},
      aiMenu: <div className="p-2 text-sm">Rewrite this heading</div>,
    },
    inspector: {
      sections: {
        text: [{ id: "layout", label: "Layout", content: <p className="text-sm">Nothing to change yet</p> }],
      },
    },
    frames: [FRAMES[0], FRAMES[1]],
    activeFrameId: "p1",
    onFrameChange: () => {},
    children: ARTBOARD,
  },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell"]')!;
    const REGIONS = ["modality-rail", "topbar", "tool-panel", "canvas", "page-strip", "inspector"];
    const regionOf = (el: Element | null) => el?.closest("[data-region]")?.getAttribute("data-region") ?? "—";
    const name = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${regionOf(el)}/${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? ""}]` +
          `{${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}}`;

    // Base UI leaves tabindex="0" on a natively-disabled button, and H5's
    // carousel disables an arrow once Embla settles — so wait for the layout
    // to stop moving, then take the stops Tab will actually visit.
    let stops: HTMLElement[] = [];
    await waitFor(() => {
      stops = Array.from(
        shell.querySelectorAll<HTMLElement>('a[href],button,input,[tabindex]:not([tabindex="-1"])'),
      ).filter(
        (el) => el.tabIndex === 0 && !el.matches(":disabled") && el.getAttribute("aria-disabled") !== "true",
      );
      if (stops.length === 0) throw new Error("no tab stops");
      if (!shell.querySelector('[data-slot="frame-strip-next"]')) throw new Error("strip not settled");
    });

    // 1. B4 is a composite, so a rail of two modalities plus a pinned group is
    //    two stops, not three. That is the fact a column of loose buttons
    //    would not have.
    const railItems = Array.from(shell.querySelectorAll<HTMLElement>('[data-slot="modality-rail-item"]'));
    await expect(railItems).toHaveLength(3);
    await expect(railItems.filter((el) => el.tabIndex === 0)).toHaveLength(2);

    // 2. Walk one lap. Every stop is new, every stop is in the region the
    //    layout puts it in, and the region index never goes backwards — which
    //    is the whole claim "tab order is the layout" amounts to.
    document.body.focus();
    let regionIndex = -1;
    const seen = new Set<HTMLElement>();
    for (let i = 0; i < stops.length; i += 1) {
      const expected = stops[i];
      // The differential, taken while focus is still on the *previous* stop —
      // no blur, so nothing disturbs the sequence under test.
      const before = focusTreatmentSignature(expected);

      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(`stop#${i} ${name(focused)}`).toBe(`stop#${i} ${name(expected)}`);
      await expect(`stop#${i} repeat=${seen.has(focused)}`).toBe(`stop#${i} repeat=false`);
      seen.add(focused);

      const at = REGIONS.indexOf(regionOf(focused));
      await expect(`stop#${i} ${regionOf(focused)} backwards=${at < regionIndex}`).toBe(
        `stop#${i} ${regionOf(focused)} backwards=false`,
      );
      regionIndex = at;

      // Both checks: something is painted, and focus is what painted it.
      await settledFocusRing(focused, waitFor);
      await expect(`stop#${i} ${name(focused)} changed`).toBe(
        `stop#${i} ${name(focused)} ${focusTreatmentSignature(focused) === before ? "unchanged" : "changed"}`,
      );
    }

    // 3. All six regions were visited, and one more Tab leaves the shell.
    await expect(new Set(stops.map((el) => regionOf(el)))).toEqual(new Set(REGIONS));
    await userEvent.tab();
    await expect(shell.contains(document.activeElement)).toBe(false);

    // 4. The distance the docs page describes, as a number.
    const inspectorStop = stops.findIndex(
      (el) => el === canvasElement.querySelector('[data-region="inspector"]'),
    );
    await expect(`${stops.length} stops, inspector at ${inspectorStop}`).toBe("16 stops, inspector at 14");

    // 5. Nothing but Tab crosses a region. The canvas surface takes arrow keys
    //    for scrolling and keeps focus; the rail's arrows travel inside the
    //    rail and stop at its own group.
    const surface = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell-canvas-surface"]')!;
    surface.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect(name(document.activeElement)).toBe(name(surface));

    railItems[0].focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect(regionOf(document.activeElement)).toBe("modality-rail");

    // 6. The one focus return the shell can rely on is I3's: Escape from the
    //    AI popover comes back to the trigger rather than dropping on <body>.
    const ai = within(canvasElement).getByRole("button", { name: "AI tools" });
    ai.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      if (!document.querySelector('[data-slot="context-toolbar-ai-menu"]')) {
        throw new Error("the AI popover never opened");
      }
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(ai));
    await waitFor(() => expect(document.querySelector('[data-slot="context-toolbar-ai-menu"]')).toBeNull());
  },
};

function ControlledStudio() {
  const [modality, setModality] = React.useState("templates");
  const [frame, setFrame] = React.useState("p1");
  const [requested, setRequested] = React.useState<{ modality?: string; frame?: string }>({});
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b p-2 text-xs">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3">
          <dt>activeModalityId</dt>
          <dd data-testid="modality">{modality}</dd>
          <dt>last onModalityChange</dt>
          <dd data-testid="requested-modality">{requested.modality ?? "—"}</dd>
          <dt>activeFrameId</dt>
          <dd data-testid="frame">{frame}</dd>
          <dt>last onFrameChange</dt>
          <dd data-testid="requested-frame">{requested.frame ?? "—"}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass">{pass}</dd>
        </dl>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            disabled={!requested.modality && !requested.frame}
            onClick={() => {
              if (requested.modality) setModality(requested.modality);
              if (requested.frame) setFrame(requested.frame);
            }}
          >
            Apply
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <StudioShell
          {...FULL_ARGS}
          // `visibleCount` on both preset grids so the fold the description
          // records is reproducible by hand rather than only in prose: see
          // more under Styles, choose Media, Apply.
          toolPanels={{
            ...TOOL_PANELS,
            templates: {
              ...TOOL_PANELS!.templates,
              presets: { ...TOOL_PANELS!.templates.presets!, visibleCount: 2 },
            },
            media: { ...TOOL_PANELS!.media, presets: { ...TOOL_PANELS!.media.presets!, visibleCount: 2 } },
          }}
          activeModalityId={modality}
          onModalityChange={(id) => setRequested((r) => ({ ...r, modality: id }))}
          activeFrameId={frame}
          onFrameChange={(id) => setRequested((r) => ({ ...r, frame: id }))}
        />
      </div>
    </div>
  );
}

/**
 * Everything the rail and the strip decide belongs to the host. The shell has
 * two real controlled pairs — `activeModalityId`/`onModalityChange` and
 * `activeFrameId`/`onFrameChange` — plus `selection`, which is a pure input
 * with no callback at all, because the shell cannot see a canvas it does not
 * own. This story holds both pairs the hard way: the host records what was
 * asked for and applies it only when told.
 *
 * What that proves, in order: pressing a rail item does not swap the panel;
 * the callback still fires with the id a host needs; a re-render with an
 * unchanged value leaves the panel where it was; and applying the request
 * swaps it. The same four for the page strip's `aria-current`.
 *
 * **The gap this surfaced, recorded rather than pinned.** One piece of the
 * panel's state is *not* on that surface and cannot be put there: E4
 * `preset-grid`'s see-more expansion lives in the grid's own `useState`, and
 * this shell gives every modality's preset section the same id,
 * `studio-presets`, so React reconciles two modalities' grids as one
 * instance. Both grids here carry `visibleCount: 2`, so the sequence is
 * reproducible without a debugger: press "See more" under Styles, choose
 * Media in the rail, press Apply — Media's grid renders all three of its
 * looks with no see-more tile, and the `visibleCount` the host set is ignored
 * from then on. That is E4's host-unreachable fold (`CONTINUE.md` §8, E/P
 * wave) with a consequence particular to a shell: not a stale expansion on
 * the same content, but one modality's fold leaking into another's. The
 * source fix is E4 exposing `expanded`/`onExpandedChange`; the shell-side
 * workaround, deliberately not applied here, would be keying the section id
 * by modality. Nothing below asserts the leak, because asserting it would
 * pin it.
 */
export const Controlled: Story = {
  render: () => <ControlledStudio />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panelHas = (slot: string) =>
      canvasElement.querySelector(`[data-region="tool-panel"] [data-slot="${slot}"]`) !== null;
    const currentFrame = () =>
      canvasElement
        .querySelector('[data-slot="frame-strip-frame"][aria-current="true"]')
        ?.textContent?.trim();

    await expect(panelHas("preset-grid")).toBe(true);
    await expect(currentFrame()).toBe("1. Title");

    // 1. Interaction alone moves nothing.
    await userEvent.click(canvas.getByRole("button", { name: "Draw" }));
    await userEvent.click(canvas.getByRole("button", { name: "2. Problem" }));
    await expect(panelHas("drawing-tools")).toBe(false);
    await expect(currentFrame()).toBe("1. Title");

    // 2. …but both callbacks fired with the payload a host has to apply.
    await expect(canvas.getByTestId("requested-modality")).toHaveTextContent("draw");
    await expect(canvas.getByTestId("requested-frame")).toHaveTextContent("p2");

    // 3. A re-render with unchanged values holds the shell fixed. Prove the
    //    re-render happened first, or this assertion is vacuous.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(panelHas("drawing-tools")).toBe(false);
    await expect(currentFrame()).toBe("1. Title");

    // 4. Applying the requests is what moves it — and the canvas is untouched
    //    by the rail, which is the spec's load-bearing separation.
    const canvasHtml = canvasElement.querySelector('[data-region="canvas"]')!.innerHTML;
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(panelHas("drawing-tools")).toBe(true));
    await expect(currentFrame()).toBe("2. Problem");
    await expect(canvasElement.querySelector('[data-region="canvas"]')!.innerHTML).toBe(canvasHtml);
  },
};

/**
 * Four of this shell's name slots are optional and all four default, so the
 * empty string is the case nobody passes on purpose and every host reaches
 * eventually — a document with no name yet, a label built from an
 * untranslated key.
 *
 * The interesting result is that **not one of them fails the gate**, and two
 * of them delete an accessible name outright. `canvasLabel=""` and
 * `inspectorLabel=""` put `aria-label=""` on the two `role="group"` scroll
 * containers the shell adds for axe's own `scrollable-region-focusable`: the
 * groups keep their tab stop, lose their only name, and no rule covers it
 * because a group is not name-from-content and not a landmark. `title=""`
 * removes the document name from the topbar with nothing standing in. Only
 * `selection.label` degrades gracefully, and only halfway — I3 derives "Shape
 * selection actions" from the selection kind, while I2's status line
 * announces the raw lookup key, `"shape"`.
 *
 * **The one red case is not rendered.** A frame `label` of `""` is H5's, not
 * this shell's, and it fails `button-name` outright — measured here, then
 * removed rather than excluded, on H4 `transcript-editor`'s precedent. So the
 * strip below carries real labels and this paragraph is the record.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    title: "",
    canvasLabel: "",
    inspectorLabel: "",
    activeModalityId: "elements",
    selection: { type: "shape" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell-canvas-surface"]')!;
    const inspector = canvasElement.querySelector<HTMLElement>('[data-region="inspector"]')!;

    // 1. Two named scroll containers become two unnamed ones, and stay
    //    focusable — the shape no rule sees.
    await expect(surface).toHaveAttribute("aria-label", "");
    await expect(surface).not.toHaveAccessibleName();
    await expect(surface.tabIndex).toBe(0);
    await expect(inspector).toHaveAttribute("aria-label", "");
    await expect(inspector).not.toHaveAccessibleName();
    await expect(inspector.tabIndex).toBe(0);

    // 2. The document loses its name with nothing in its place.
    const topbar = canvasElement.querySelector<HTMLElement>('[data-region="topbar"]')!;
    await expect(topbar.textContent).toBe("72%Saved just now");

    // 3. The panel's name is derived from the rail, so it survives untouched —
    //    the one link between rail and panel that assistive tech has.
    canvas.getByRole("group", { name: "Elements tools" });

    // 4. I3 derives its own name from the selection kind…
    canvas.getByRole("toolbar", { name: "Shape selection actions" });
    // …and I2 announces the lookup key instead of a label. Recorded in wave 1
    // against `property-inspector`; this is the shell reaching it.
    const status = canvasElement.querySelector('[data-region="inspector"] [role="status"]');
    await expect(status?.textContent?.trim()).toBe("shape");
  },
};

const LONG_TITLE = "A calm editorial cover built from the Northwind pitch deck's second revision";

/**
 * Seventy-five characters in every author-supplied slot at once. Nothing
 * wraps and nothing widens — every slot in this shell truncates — so the real
 * finding is not *whether* a long name is cut but **how much of it survives**,
 * and the answer is set by whichever component happens to own the box.
 *
 * The same 444px of text is drawn three times as an A8 overlay caption, with
 * the same `nowrap` + `ellipsis`, into three different budgets: 124px in H5's
 * page strip, 88px in F1's result card, and **53px in E4's preset tile** —
 * about an eighth of the name, in the one place where nothing else on screen
 * repeats it. The topbar title is a fourth truncation and the only one with
 * room to spare at this width — a 499px box for 499px of text, so the
 * ellipsis is declared and never drawn. It takes whatever is left after zoom
 * and history, which means a phone is where it starts cutting.
 *
 * **A rail label is the exception, and only because it is never painted.**
 * B4's stacked span carries the whole truncation machinery — `nowrap`,
 * `ellipsis`, `overflow: hidden`, a 63px box against a 406px `scrollWidth` —
 * inside a `ToggleGroupItem` whose `toggleVariants` base is a fixed `h-8`, so
 * the span computes to **zero height** and the ellipsis is never drawn. The
 * accessible name survives in full and is asserted below; the visible label
 * does not exist, at any length. `CONTINUE.md` §8 records this as pre-existing
 * and verified in a browser by O4. Still live, and this is the measurement.
 *
 * Nothing scrolls sideways at 1200px in any of the cases, which is the claim
 * worth having: long author text costs legibility here, never layout.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title: LONG_TITLE,
    activeModalityId: "media",
    modalities: [{ id: "media", label: LONG_TITLE, icon: <ImageIcon /> }],
    toolPanels: {
      media: {
        presets: {
          label: LONG_TITLE,
          content: "filter",
          items: [{ id: "warm", label: LONG_TITLE }],
          defaultValue: "warm",
        },
        results: { label: "Generated", items: [{ id: "r1", state: "done", label: LONG_TITLE }] },
      },
    },
    frames: [{ id: "p1", label: LONG_TITLE }, FRAMES[1]],
    selection: { type: "image", label: LONG_TITLE },
  },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell"]')!;

    // 1. The topbar title truncates on one line — and at this width it is the
    //    only slot with room, so the ellipsis it declares is never drawn.
    const title = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-region="topbar"] span')).find(
      (el) => el.textContent === LONG_TITLE,
    )!;
    const titleStyle = getComputedStyle(title);
    await expect(`${titleStyle.whiteSpace}/${titleStyle.textOverflow}`).toBe("nowrap/ellipsis");
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);

    // 2. Every tile label is the same A8 overlay caption with the same
    //    treatment and a different budget — one line, clipped by the tile.
    const labels = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile-label"]'),
    ).filter((el) => el.textContent === LONG_TITLE);
    await expect(labels).toHaveLength(3);
    const widths = labels.map((el) => `${el.clientWidth}/${el.scrollWidth}`);
    for (const el of labels) {
      const style = getComputedStyle(el);
      await expect(`${style.whiteSpace}/${style.textOverflow}`).toBe("nowrap/ellipsis");
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
    }
    // The preset tile is the tightest of the three: it shows an eighth of the
    // name the panel, the grid and the strip are all pointing at.
    await expect(widths.join(" ")).toBe("53/444 88/444 124/444");

    // 3. The rail label keeps the whole name for assistive tech. What it does
    //    not do is paint — see the description; not asserted, because a zero
    //    height is the defect and not the contract.
    const railItem = canvasElement.querySelector<HTMLElement>('[data-slot="modality-rail-item"]')!;
    await expect(railItem).toHaveAccessibleName(LONG_TITLE);

    // 4. No sideways scroll anywhere, in any of the five slots.
    await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    for (const region of ["tool-panel", "canvas", "page-strip", "inspector"]) {
      const el = canvasElement.querySelector<HTMLElement>(`[data-region="${region}"]`)!;
      await expect(`${region} ${el.scrollWidth <= el.clientWidth}`).toBe(`${region} true`);
    }
  },
};

/**
 * 375×812, with the **real** viewport moved rather than a 375px box drawn
 * around a desktop render. That distinction is the whole point here: this
 * shell's narrow layout keys on a `md` media query, so a width wrapper would
 * have rendered the three-column desktop editor inside a phone-shaped div and
 * reported success. `page.viewport` resizes the test iframe itself —
 * `window.innerWidth` 1200 → 375, `matchMedia("(min-width: 768px)")` true →
 * false — and does not leak into the next story, so nothing is restored.
 *
 * What the phone actually gets, measured: the rail stays a fixed 92px column,
 * the three middle regions stack into one scrolling column 283px wide, and
 * nothing scrolls sideways. Two consequences worth stating plainly.
 *
 * **A quarter of the screen is permanent chrome.** 92 of 375px is the rail,
 * before any content — and because B4's stacked label paints at zero height
 * (`LongContent`), those 92px carry six icons and no words. The docs page
 * already says a real mobile editor should replace the panel and the
 * inspector with sheets; this is the number behind that sentence, and the
 * rail belongs on the same list.
 *
 * **Stacking is a deliberate trade, not a fallback.** Every region stays
 * reachable — the alternative, hiding one below `md`, is what makes a region
 * unreachable rather than merely distant. The cost is that the canvas now
 * shares a scroll container with the panel and the inspector, so the artboard
 * is 238px tall between a 384px panel and the strip.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // Two things about this import, both measured rather than assumed.
    //
    // It is `vitest/browser`, not the `@vitest/browser/context` the
    // convention names: vitest 4.1.8 still resolves the older specifier but
    // prints `DEPRECATED … will stop working in the next major version` on
    // every run that loads this file, and both paths land on the same module.
    //
    // And it is dynamic, inside the play, rather than at the top of the file.
    // Outside Browser Mode that module *throws on evaluation* ("can be
    // imported only inside the Browser Mode"), so a top-level import would
    // take the whole story file down in a built Storybook — every story in it,
    // not just this one. Here the blast radius is one play function.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);

    // 1. The breakpoint really moved. A wrapper cannot do this, and every
    //    assertion below is meaningless without it.
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);

    const box = (region: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-region="${region}"]`)!.getBoundingClientRect();
    const rail = box("modality-rail");
    const panel = box("tool-panel");
    const canvas = box("canvas");
    const strip = box("page-strip");
    const inspector = box("inspector");

    // 2. The rail does not collapse: a fixed 92px of a 375px screen.
    await expect(rail.width).toBe(92);
    await expect(rail.left).toBe(0);

    // 3. The three middle regions stack, in region order, each the full width
    //    of what the rail left behind.
    for (const [label, rect] of [
      ["panel", panel],
      ["canvas", canvas],
      ["strip", strip],
      ["inspector", inspector],
    ] as const) {
      await expect(`${label} left=${rect.left} width=${Math.round(rect.width)}`).toBe(
        `${label} left=92 width=283`,
      );
    }
    await expect(panel.bottom).toBeLessThanOrEqual(canvas.top);
    await expect(canvas.bottom).toBeLessThanOrEqual(strip.top);
    await expect(strip.bottom).toBeLessThanOrEqual(inspector.top);

    // 4. The inline seams are gone with the columns; only the block-axis
    //    dividers remain. This is the other half of the RTL swap's guard —
    //    `md:border-e` is a column rule and must not survive the stack.
    const panelStyle = getComputedStyle(canvasElement.querySelector('[data-region="tool-panel"]')!);
    await expect(
      `${panelStyle.borderLeftWidth}/${panelStyle.borderRightWidth}/${panelStyle.borderBottomWidth}`,
    ).toBe("0px/0px/1px");

    // 5. Nothing scrolls sideways — not the shell, not the page.
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell"]')!;
    await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/**
 * O3 beside O4 `timeline-shell`, the only near-twin in the catalog and one
 * the spec names outright: "same regions as O3, but the bottom dock is a time
 * ruler with tracks instead of a page strip."
 *
 * From a screenshot they are the same product — rail, panel, stage,
 * inspector, dock — and three of those regions are literally the same
 * components (B4, I1, I2) taking the same shape of props in both files. So
 * the choosing rule cannot be about the frame. It is about **what the bottom
 * dock indexes**:
 *
 * - **Studio shell** docks H5 `frame-strip`: a list of *places* — pages,
 *   artboards, frames. Choosing one replaces what is on the canvas. There is
 *   one canvas and one thing on it at a time.
 * - **Timeline shell** docks H2 `time-ruler` over H3 `track-lane`s: one
 *   *duration* with everything laid along it at once. Choosing a moment does
 *   not replace the stage, it moves the playhead — which is why O4 wires
 *   `currentTime` and `onSeek` through the whole shell and O3 has no
 *   equivalent prop at all.
 *
 * The other tell is the topbar. O3 has one (B7 in `editor` context, with zoom
 * and history) because a document has a name you save; O4's spec names no B7
 * and it renders none, because a timeline's chrome is the transport.
 *
 * If the object you are editing has a running time, you want O4 — even for
 * something visual, and even if you are drawing on it. If it has pages, you
 * want this one. If it has neither, you want O6 `generation-shell` rather
 * than a studio with a dock that stays empty: a single artboard with no
 * pages, no frames and no timeline is a tool, not an editor, and O6 is the
 * shell for that.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4">
      <section className="flex min-h-0 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          O3 studio shell — the dock is a list of pages; choosing one replaces the canvas
        </p>
        <div className="h-[22rem] overflow-hidden rounded-lg border">
          <StudioShell
            title="Series A deck"
            topbar={{ zoomLabel: "72%" }}
            modalities={[MODALITIES[0], MODALITIES[1]]}
            activeModalityId="templates"
            onModalityChange={() => {}}
            toolPanels={{
              templates: {
                presets: {
                  label: "Styles",
                  items: [
                    { id: "editorial", label: "Bold editorial" },
                    { id: "pastel", label: "Soft pastel" },
                  ],
                  defaultValue: "editorial",
                },
              },
            }}
            canvasLabel="Slide canvas"
            inspectorLabel="Slide properties"
            frames={[FRAMES[0], FRAMES[1]]}
            activeFrameId="p1"
            onFrameChange={() => {}}
          >
            {ARTBOARD}
          </StudioShell>
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          O4 timeline shell — the dock is one duration; choosing a moment moves the playhead
        </p>
        <div className="h-[22rem] overflow-hidden rounded-lg border">
          <TimelineShell
            railItems={[
              { id: "media", label: "Media", icon: <ImageIcon /> },
              { id: "audio", label: "Audio", icon: <Brush /> },
            ]}
            activeRailId="media"
            onRailSelect={() => {}}
            panel={{
              sections: [
                {
                  id: "recent",
                  title: "Recent clips",
                  items: [
                    { id: "m1", label: "Harbour, wide" },
                    { id: "m2", label: "Interview A" },
                  ],
                },
              ],
            }}
            previewLabel="Player"
            preview={<p className="text-sm">Harbour film — 0:13</p>}
            duration={13}
            currentTime={3.2}
            onSeek={() => {}}
            zoom={44}
            transport={{ variant: "frame-accurate", fps: 24 }}
            tracks={[
              {
                id: "video",
                name: "Video",
                type: "filmstrip",
                clips: [{ id: "v1", label: "Harbour, wide", start: 0, end: 5.5 }],
              },
            ]}
            selectedClipId="v1"
            onSelectClip={() => {}}
          />
        </div>
      </section>
    </div>
  ),
};
