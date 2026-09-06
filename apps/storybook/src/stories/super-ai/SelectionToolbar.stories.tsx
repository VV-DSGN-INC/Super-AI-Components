import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Bold, Crop, Italic, Languages, Scissors, SpellCheck, Trash2 } from "lucide-react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";
import {
  SelectionToolbar,
  type SelectionSurface,
  type SelectionVerb,
} from "@/registry/super-ai/selection-toolbar";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { SelectionToolbarDocs } from "@/content/components/selection-toolbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SELECTION =
  "It is our belief that the current onboarding process is not optimal and could probably be improved in a number of different ways going forward.";

const meta: Meta<typeof SelectionToolbar> = {
  title: "Super AI/Selection Toolbar",
  component: SelectionToolbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SelectionToolbarDocs) } },
  args: {
    selectionText: SELECTION,
    onIntent: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SelectionToolbar>;

/**
 * The resting bar. Improve is index 0, filled, and never eligible for
 * overflow — everything after it is a plain verb.
 */
export const Improve: Story = {
  args: { pending: null },
};

/**
 * Shorten in flight. The bar stays exactly where it was and announces itself;
 * the paragraph behind it is untouched, because the rewrite comes back as a
 * change to review rather than a replacement.
 */
export const Shorten: Story = {
  args: { pending: "shorten" },
};

/**
 * Expand against a terse selection. Same contract — a request, not an edit.
 */
export const Expand: Story = {
  args: {
    selectionText: "Onboarding needs work.",
    pending: "expand",
  },
};

/**
 * Tone is one verb with a submenu behind it, not five buttons in the bar. In a
 * generation panel the same list belongs in an E4 `preset-grid` instead.
 */
export const ToneSubmenu: Story = {
  args: {
    open: "tone",
    tones: [
      { id: "professional", label: "Professional" },
      { id: "friendly", label: "Friendly" },
      { id: "casual", label: "Casual" },
      { id: "confident", label: "Confident" },
      { id: "direct", label: "Direct" },
    ],
  },
};

/**
 * Free text, submitted in place. A popover with a textarea — never a
 * navigation to a panel that leaves the selection behind.
 */
export const CustomPrompt: Story = {
  args: {
    open: "custom",
    promptPlaceholder: "Tell the model what to do with the selection",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this bar meets over real prose, as opposed to
 * the five verbs above. See docs/design-system/story-conventions.md.
 *
 * All eight are true, so there are no `case-skip` lines. The reasons belong to
 * K4 rather than to I3 `context-toolbar` underneath it: two Base UI popup
 * surfaces of its own (a second and third focus scope inside the bar's), a
 * real `open`/`onOpenChange` pair, and a default vocabulary of five *drawn*
 * labels — which is what makes `Mobile` a finding here and a non-event in I3,
 * whose eight targets are icons.
 *
 * Deliberately not re-derived: `ContextToolbar.stories.tsx` already proves the
 * bar is one tab stop with a roving index that wraps, that Escape out of a
 * popup returns focus to its trigger, and that the bar's source carries no
 * physical direction class. The stories below take those as settled and test
 * the seams K4 adds on top of them.
 * ---------------------------------------------------------------------- */

/** Caller-supplied verbs. Ordinary `actions`, so they overflow first. */
const EXTRA_ACTIONS: ContextToolbarAction[] = [
  { id: "translate", label: "Translate", icon: <Languages /> },
  { id: "spelling", label: "Fix spelling", icon: <SpellCheck /> },
];

/**
 * `dir` on the document rather than a wrapper. Both of this component's popups
 * are portalled to `<body>`, so a `<div dir="rtl">` around the story cannot
 * reach them — and the alignment assertion below is about a portalled surface.
 */
function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/** A portalled surface, once Base UI has mounted it. */
function openedSurface(slot: string): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
    if (!el) throw new Error(`${slot} never opened`);
    return el;
  });
}

/**
 * A popup left mid-dismissal is measured by axe at its transitional opacity,
 * which fails `color-contrast` only under full-suite load. Every dismissal in
 * this file waits for the surface to be gone before returning.
 */
function dismissedSurface(slot: string): Promise<unknown> {
  return waitFor(() => {
    if (document.querySelector(`[data-slot="${slot}"]`)) {
      throw new Error(`${slot} is still mounted`);
    }
  });
}

/**
 * Right-to-left, and the two halves of it answer differently — which is the
 * point of the story.
 *
 * **The bar mirrors.** I3 records why (no physical direction class in its
 * source); what is new here is that K4's two extra buttons are `children` of
 * `Toolbar.Root` rather than rows in `actions`, so nothing guarantees they
 * follow the same order — and they do. Measured left edges, right to left:
 * Improve 1106, Shorten 1008, Expand 921, Tone 850, Custom prompt 712.
 *
 * **The tone menu mirrors too, and only because `dir` is on the document.**
 * `align="start"` is resolved by floating-ui through `platform.isRTL`, which
 * reads the positioner's *computed* direction — so the menu's start (right)
 * edge lands on the trigger's start edge, measured equal at 919px. A wrapper
 * `<div dir="rtl">` would leave the portalled positioner at the document's
 * `ltr` and align it to the left instead, silently. That is why this story
 * uses `RtlDocument` and not the wrapper other RTL stories use, and it is a
 * narrower claim than wave 1's "Base UI composites never learn about RTL":
 * *positioning* reads computed style, *keyboard travel* reads React context.
 *
 * **Keyboard travel does not mirror**, and this component inherits it whole.
 * Measured: from Improve, ArrowRight moves to Shorten — which paints to the
 * *left*. `CompositeRoot` takes its axis from `useDirection()`, no
 * `DirectionProvider` is mounted anywhere in the repo, so the fallback is
 * `ltr`. Recorded in `CONTINUE.md` §8 from `mode-tabs`; nothing here asserts
 * it, because asserting it would pin it.
 */
export const RTL: Story = {
  render: (args) => (
    <RtlDocument>
      <SelectionToolbar {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const improve = canvas.getByRole("button", { name: "Improve" });
    const tone = canvas.getByRole("button", { name: "Tone" });
    const custom = canvas.getByRole("button", { name: "Custom prompt" });

    // 1. Mirrored, not merely reordered in the DOM: the first button paints
    //    furthest right and the last furthest left, K4's own children included.
    await expect(improve.getBoundingClientRect().left).toBeGreaterThan(tone.getBoundingClientRect().left);
    await expect(tone.getBoundingClientRect().left).toBeGreaterThan(custom.getBoundingClientRect().left);

    // 2. The portalled menu resolves `align="start"` against the writing
    //    direction: start edges flush, which in RTL means the right edges.
    await userEvent.click(tone);
    const menu = await openedSurface("selection-toolbar-tone-menu");
    await expect(getComputedStyle(menu).direction).toBe("rtl");
    await expect(
      Math.abs(menu.getBoundingClientRect().right - tone.getBoundingClientRect().right),
    ).toBeLessThanOrEqual(1);

    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-tone-menu");
  },
};

/** A host that owns `pending`, which is the only way to reach the spinner. */
function PendingShell() {
  const [pending, setPending] = React.useState<SelectionVerb | null>(null);
  return (
    <SelectionToolbar
      selectionText={SELECTION}
      pending={pending}
      onIntent={(intent) => {
        if (intent.verb !== "action") setPending(intent.verb);
      }}
    />
  );
}

/**
 * `prefers-reduced-motion`, and this component was carrying three unbranched
 * animations of its own — the last unrestated `DropdownMenuContent` in the
 * registry among them.
 *
 * All three are fixed in-wave as mechanical repairs, and the two halves take
 * *different* remedies, which is the fact worth keeping:
 *
 * - The three `Loader2` spinners take the plain
 *   `animate-spin motion-reduce:animate-none`, the `task-tray` idiom, because
 *   the animation is on an ordinary class with no competing variant.
 * - The tone menu and the prompt popover animate through
 *   `data-open:animate-in`, where the plain remedy is inert: Tailwind emits the
 *   `motion-reduce:` block before the `data-*` variants and the tie goes to
 *   source order, so `animation-name` keeps reading `"enter"`. Both take the
 *   restated pair
 *   `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`.
 *
 * `vitest.config.ts` emulates reduce for every test, so every assertion below
 * reads `animationName` off the live surface rather than checking for a class.
 * Against the unfixed source the menu and the popover each read `"enter"` and
 * the spinner reads `"spin"`.
 */
export const ReducedMotion: Story = {
  render: () => <PendingShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. The tone menu.
    await userEvent.click(canvas.getByRole("button", { name: "Tone" }));
    const menu = await openedSurface("selection-toolbar-tone-menu");
    await expect(menu).toHaveAttribute("data-open");
    await expect(getComputedStyle(menu).animationName).toBe("none");
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-tone-menu");

    // 2. The prompt popover — the larger travel of the two, zooming out of a
    //    small button into a 320px dialog.
    await userEvent.click(canvas.getByRole("button", { name: "Custom prompt" }));
    const popover = await openedSurface("selection-toolbar-prompt");
    await expect(popover).toHaveAttribute("data-open");
    await expect(getComputedStyle(popover).animationName).toBe("none");
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-prompt");

    // 3. The in-flight spinner, reached the way a host reaches it: the intent
    //    fires, the host sets `pending`, and the verb's icon is replaced.
    const shorten = canvas.getByRole("button", { name: "Shorten" });
    await userEvent.click(shorten);
    const spinner = await waitFor(() => {
      const svg = shorten.querySelector("svg");
      if (!svg?.classList.contains("animate-spin")) throw new Error("the spinner never appeared");
      return svg;
    });
    await expect(getComputedStyle(spinner).animationName).toBe("none");

    // The bar stayed put and said so, which is the whole contract of `pending`.
    const status = canvasElement.querySelector('[data-slot="selection-toolbar-status"]');
    await expect(status).toHaveTextContent(
      "Shortening the selection. The result will arrive as a change you can review.",
    );
  },
};

/**
 * Three focus scopes nested inside one another, which is what K4 adds to I3.
 *
 * The bar is a `role="toolbar"` composite — one tab stop, arrow travel, wraps —
 * and I3 proves that. What is only provable here is what happens when a stop
 * *opens something*: Tone is a menu trigger sitting inside the roving index,
 * and Custom prompt is a dialog trigger beside it. So the walk enters the
 * submenu, laps it, leaves it, and checks the roving index survived the trip.
 *
 * Measured order, five stops: Improve, Shorten, Expand, Tone, Custom prompt.
 * Escape returns focus to the trigger in both scopes, and the roving index is
 * still on that trigger afterwards, so ArrowRight resumes along the bar rather
 * than restarting at Improve.
 *
 * **Two focus checks, because they answer different questions**, and on this
 * component they disagree by design:
 *
 * - The bar's buttons paint a real `focus-visible:ring-3`, so `settledFocusRing`
 *   passes and the differential confirms focus is what painted it. The wait
 *   matters: the vendored `Button` carries `transition-all`, so an immediate
 *   read catches a transparent zero-size shadow.
 * - The **menu rows paint no ring at all** — the vendored `DropdownMenuItem`
 *   marks focus with `focus:bg-accent`, a background change neither helper
 *   reads, since `focusTreatmentSignature` covers outline, box-shadow and
 *   border colour only. So the row walk takes its own signature including
 *   `background-color`. That is also the regression guard for the
 *   `focus:bg-transparent` override F7 `approval-card` and I4 `ai-tools-menu`
 *   both carry on their menu rows, which leaves the focused row distinguishable
 *   by title colour alone: this component does not carry that override, and if
 *   anyone adds one here the assertion below fails.
 *
 * The submit button in the popover is `disabled` while the instruction is
 * empty, and Base UI still leaves `tabindex="0"` on it — so the walk types
 * first and counts stops by `:disabled`, never by `[tabindex]`.
 */
export const KeyboardOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "AI writing tools" });
    const stops = Array.from(toolbar.querySelectorAll<HTMLElement>("button"));

    await expect(stops.map((el) => el.textContent?.trim())).toEqual([
      "Improve",
      "Shorten",
      "Expand",
      "Tone",
      "Custom prompt",
    ]);

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLElement)} [${el.textContent?.trim() ?? ""}]`;

    /** The focused stop, once focus has provably left `previous`. */
    const settledStop = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on the bar: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    // 1. One tab stop for five buttons. That is the composite, not a row.
    await expect(stops.filter((el) => el.tabIndex === 0)).toHaveLength(1);

    const improveBefore = focusTreatmentSignature(stops[0]);
    await userEvent.tab();
    const start = await settledStop();
    await expect(nameOf(start)).toBe(nameOf(stops[0]));
    await settledFocusRing(start, waitFor);
    await expect(focusTreatmentSignature(start)).not.toBe(improveBefore);

    // 2. One control per press, no repeats — and the differential is read off
    //    the *next* stop before focus reaches it, so nothing is blurred and the
    //    walk is undisturbed.
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      const before = focusTreatmentSignature(stops[i]);
      await userEvent.keyboard("{ArrowRight}");
      const focused = await settledStop(previous);
      await expect(nameOf(focused)).toBe(nameOf(stops[i]));
      await settledFocusRing(focused, waitFor);
      await expect(`${nameOf(focused)} changed=${focusTreatmentSignature(focused) !== before}`).toBe(
        `${nameOf(focused)} changed=true`,
      );
      previous = focused;
    }

    // 3. …and the lap closes rather than stopping dead at the last verb.
    await userEvent.keyboard("{ArrowRight}");
    await expect(nameOf(await settledStop(previous))).toBe(nameOf(stops[0]));

    /* --- the second scope: the tone submenu ----------------------------- */

    const tone = stops[3];
    tone.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await openedSurface("selection-toolbar-tone-menu");
    const rows = Array.from(menu.querySelectorAll<HTMLElement>('[data-slot="selection-toolbar-tone-item"]'));
    await expect(rows).toHaveLength(5);

    // A menu row marks focus with a background, which neither focus-ring helper
    // reads — so this is the signature that matters here.
    const rowSignature = (el: Element) => {
      const s = getComputedStyle(el);
      return `${s.backgroundColor}|${s.color}|${s.boxShadow}|${s.outlineStyle}`;
    };
    const rowNameOf = (el: Element | null) =>
      el === null ? "nothing" : `row#${rows.indexOf(el as HTMLElement)} [${el.textContent?.trim()}]`;

    const settledRow = async (previousRow?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!rows.includes(active as HTMLElement)) {
          throw new Error(`focus is not on a tone row: ${rowNameOf(active)}`);
        }
        if (previousRow && active === previousRow) {
          throw new Error(`focus has not moved off ${rowNameOf(previousRow)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    // Opening the menu lands focus on the first tone — the walk is seeded from
    // where focus actually went, never from an assumed first element.
    const firstRow = await settledRow();
    await expect(rowNameOf(firstRow)).toBe(rowNameOf(rows[0]));

    let previousRow = firstRow;
    for (let i = 1; i < rows.length; i += 1) {
      const before = rowSignature(rows[i]);
      await userEvent.keyboard("{ArrowDown}");
      const focused = await settledRow(previousRow);
      await expect(rowNameOf(focused)).toBe(rowNameOf(rows[i]));
      await expect(`${rowNameOf(focused)} marked=${rowSignature(focused) !== before}`).toBe(
        `${rowNameOf(focused)} marked=true`,
      );
      previousRow = focused;
    }

    // Leaving the second scope: Escape dismisses and hands focus back to Tone…
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-tone-menu");
    await waitFor(() => expect(document.activeElement).toBe(tone));

    // …and the roving index came back with it, so travel resumes where it left
    // off rather than restarting at Improve.
    await userEvent.keyboard("{ArrowRight}");
    await expect(nameOf(await settledStop(tone))).toBe(nameOf(stops[4]));

    /* --- the third scope: the prompt popover ---------------------------- */

    const custom = stops[4];
    await userEvent.keyboard("{Enter}");
    const popover = await openedSurface("selection-toolbar-prompt");
    const textarea = popover.querySelector<HTMLTextAreaElement>(
      '[data-slot="selection-toolbar-prompt-input"]',
    )!;
    const submit = popover.querySelector<HTMLButtonElement>('[data-slot="selection-toolbar-prompt-submit"]')!;

    // The dialog focuses its own first tabbable descendant: the instruction
    // field, which is the only thing a user opened it to do.
    await waitFor(() => expect(document.activeElement).toBe(textarea));
    await settledFocusRing(textarea, waitFor);

    // Submit is *natively* disabled while the instruction is empty — and Base
    // UI leaves `tabindex="0"` on it anyway, so counting stops by `[tabindex]`
    // would count an inert control.
    await expect(submit.disabled).toBe(true);
    await expect(submit.tabIndex).toBe(0);

    await userEvent.type(textarea, "Make it one sentence");
    await waitFor(() => expect(submit.disabled).toBe(false));
    const submitBefore = focusTreatmentSignature(submit);
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(submit));
    await settledFocusRing(submit, waitFor);
    await expect(focusTreatmentSignature(submit)).not.toBe(submitBefore);

    // Leaving the third scope returns focus to its own trigger.
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-prompt");
    await waitFor(() => expect(document.activeElement).toBe(custom));
  },
};

/**
 * `open` / `onOpenChange` is a real controlled pair over a union
 * (`"tone" | "custom" | null`), and this shell holds it the hard way: the host
 * records what the toolbar asked for and applies it only when told to.
 *
 * In order: clicking Tone does not open the menu; the callback still fires with
 * the surface a host needs to apply; re-rendering with an unchanged `open`
 * leaves it shut; applying opens it. The last step is load-bearing because the
 * menu is a portal — an uncontrolled Base UI menu would have opened on the
 * first click and no later assertion could tell the two apart.
 *
 * **The menu's callback does not arrive synchronously with the click**, and
 * that cost this story a failure worth keeping. Read on the tick after
 * `userEvent.click` resolves, the host has recorded nothing; the popover's
 * equivalent *is* synchronous, so a shell that mirrors both surfaces into one
 * piece of state sees them report at different times. Measured by clicking Tone
 * and then Custom prompt in one play: the host's log read `["custom", "tone"]`,
 * the menu's request arriving after a click that happened later. Every read of
 * a requested surface below therefore waits rather than asserting immediately.
 *
 * Then the half a one-way callback cannot express: choosing a tone emits the
 * intent **and** requests `null`, and the menu stays open until the host
 * applies it. A host can therefore keep the menu up while its request is in
 * flight — which is not obviously the right product decision, but it is the
 * host's to make, and it is the difference between this pair and I2
 * `property-inspector`'s after-the-fact callback.
 *
 * What is *not* controlled: `pending` is a separate prop, and the prompt
 * textarea's text is internal — a host driving `open` still cannot read or seed
 * the instruction being typed.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tone = canvas.getByRole("button", { name: "Tone" });
    const menuIsOpen = () => document.querySelector('[data-slot="selection-toolbar-tone-menu"]') !== null;

    await expect(menuIsOpen()).toBe(false);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(tone);
    await expect(menuIsOpen()).toBe(false);

    // 2. …but the callback fired, with the surface the host has to apply. It
    //    lands a beat after the click, so this waits rather than reads.
    await waitFor(() => expect(canvas.getByTestId("requested")).toHaveTextContent("tone"));

    // 3. Re-render with an unchanged `open`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(menuIsOpen()).toBe(false);

    // 4. The payload was sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    const menu = await openedSurface("selection-toolbar-tone-menu");

    // 5. Choosing a tone emits the intent and *requests* the close; the surface
    //    is still the host's until it applies that request.
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Confident" }));
    await expect(canvas.getByTestId("intent")).toHaveTextContent("tone:confident");
    await waitFor(() => expect(canvas.getByTestId("requested")).toHaveTextContent("closed"));
    await expect(menuIsOpen()).toBe(true);

    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await dismissedSurface("selection-toolbar-tone-menu");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState<SelectionSurface | null>(null);
  const [requested, setRequested] = React.useState<SelectionSurface | null | "unset">("unset");
  const [intent, setIntent] = React.useState("—");
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-4">
      <SelectionToolbar
        selectionText={SELECTION}
        open={applied}
        onOpenChange={setRequested}
        onIntent={(next) => setIntent(next.verb === "tone" ? `tone:${next.tone}` : next.verb)}
      />

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>open prop</dt>
          <dd data-testid="applied">{applied ?? "closed"}</dd>
          <dt>last onOpenChange</dt>
          <dd data-testid="requested">{requested === "unset" ? "—" : (requested ?? "closed")}</dd>
          <dt>last onIntent</dt>
          <dd data-testid="intent">{intent}</dd>
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
            disabled={requested === "unset"}
            onClick={() => requested !== "unset" && setApplied(requested)}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Every optional text slot at its emptiest legitimate setting: no `label`
 * string, no `selectionText`, no `tones`, and caller verbs with no `showLabel`
 * — so the bar is carrying two icon-only tap targets, which is where a name
 * usually goes missing.
 *
 * What holds: the icon-only verbs keep their names from I3's `sr-only` span, so
 * they resolve with no tooltip open anywhere in the document; `tones={[]}`
 * removes the Tone verb entirely rather than leaving a trigger with no menu;
 * and dropping `selectionText` removes the popover's quoted description while
 * the popover keeps its name from its title, so it is still a named dialog.
 *
 * **Two collapses this story does not render, both measured.**
 *
 * - `promptPlaceholder=""` leaves the textarea with `aria-label=""` *and*
 *   `placeholder=""`, so it has no accessible name and axe fails `label`
 *   outright — a red gate, verified by rendering it once. The name and the
 *   placeholder are one string here (the source says why), so emptying the
 *   placeholder deletes the name with it.
 * - `label=""` reaches I3's `label ?? SELECTION_LABEL[selection]`, and `""` is
 *   not nullish — so the bar renders `role="toolbar"` with `aria-label=""` and
 *   is nameless. Nothing fails: no axe rule requires a toolbar to be named,
 *   which is what makes it the worse of the two. Same shape as H7 `stem-mixer`
 *   and J7, recorded in `CONTINUE.md` §8's empty-string class.
 */
export const EmptyLabel: Story = {
  args: {
    selectionText: undefined,
    tones: [],
    actions: EXTRA_ACTIONS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No `label` was passed; the name came from I3's `selection` default.
    canvas.getByRole("toolbar", { name: "AI writing tools" });

    // `tones: []` drops the verb rather than leaving a trigger with no menu.
    await expect(canvas.queryByRole("button", { name: "Tone" })).toBeNull();

    // Nothing has been hovered, so no tooltip exists…
    await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();

    // …and the icon-only verbs are still named.
    for (const name of ["Improve", "Translate", "Fix spelling", "Custom prompt"]) {
      canvas.getByRole("button", { name });
    }

    // With no selection text the popover keeps its name and loses its quote.
    await userEvent.click(canvas.getByRole("button", { name: "Custom prompt" }));
    const popover = await openedSurface("selection-toolbar-prompt");
    await expect(popover).toHaveAccessibleName("Custom instruction");
    await expect(popover.querySelector('[data-slot="selection-toolbar-prompt-selection"]')).toBeNull();

    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-prompt");
  },
};

/** 76 characters, which is what a product-specific verb actually looks like. */
const LONG_LABEL = "Rewrite this so a first-time reader understands it without any prior context";

/** 197 characters across three lines, the way a real selection arrives. */
const LONG_SELECTION = `It is our belief that the current onboarding process is not optimal.

\tWe should probably improve it in a number of different ways going forward, starting with the parts new users see first.`;

/**
 * Author-supplied text reaches this component through two slots, and it makes
 * two different decisions about them.
 *
 * **The selection is truncated, and the truncation is in JavaScript, not CSS.**
 * `previewOf` collapses runs of whitespace to single spaces and cuts at 80
 * characters including the ellipsis — so a 197-character three-line selection
 * renders as one 82-character string inside the quotes. That is the right call
 * for a 320px popup and it is invisible to a CSS-only audit, which is why it is
 * asserted here rather than assumed. Note what it costs: the quoted context is
 * the only place a user sees *which* text is about to be rewritten, and past 80
 * characters two different selections can look identical.
 *
 * **The labels are not truncated at all.** A 76-character `customLabel` renders
 * `white-space: nowrap` with `scrollWidth === clientWidth` — no ellipsis, no
 * clip, no second line — so the button grows to 492px and takes the bar to
 * 849px with it. That is I3's `whitespace-nowrap` reaching K4 through a slot K4
 * always draws, and unlike I3 there is no escape: `showLabel: true` is
 * hardcoded on Shorten and Expand, and Improve, Tone and Custom prompt always
 * draw. Recorded, not fixed — making labels optional is an API change.
 *
 * Inside the popover the same length of string wraps instead: the title is an
 * `h2` in a fixed 320px box and takes two lines rather than widening it. So the
 * popup handles long text and the bar does not, which is the argument for
 * keeping product verbs in `actions`, where they can overflow.
 */
export const LongContent: Story = {
  args: {
    selectionText: LONG_SELECTION,
    customLabel: LONG_LABEL,
    promptTitle: LONG_LABEL,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "AI writing tools" });
    const custom = canvas.getByRole("button", { name: LONG_LABEL });

    // 1. One line, full width — no ellipsis, no wrap, no clipping.
    const style = getComputedStyle(custom);
    await expect(style.whiteSpace).toBe("nowrap");
    await expect(style.textOverflow).toBe("clip");
    await expect(custom.scrollWidth).toBe(custom.clientWidth);
    await expect(toolbar.getBoundingClientRect().width).toBeGreaterThan(custom.getBoundingClientRect().width);

    // 2. The selection is cut in JS: whitespace collapsed, 80 characters plus
    //    the surrounding quotes, ending in an ellipsis rather than a word.
    await userEvent.click(custom);
    const popover = await openedSurface("selection-toolbar-prompt");
    const quote = popover.querySelector<HTMLElement>('[data-slot="selection-toolbar-prompt-selection"]')!;
    const text = quote.textContent ?? "";
    await expect(text).toHaveLength(82);
    await expect(text.endsWith("…”")).toBe(true);
    await expect(text).not.toContain("\n");
    await expect(text).not.toContain("\t");
    await expect(text).not.toContain("  ");

    // 3. In the popup the long title wraps instead of widening it: 320px is
    //    `w-80`, and the heading takes two lines to stay inside it.
    const title = popover.querySelector<HTMLElement>("h2")!;
    await expect(Math.round(popover.getBoundingClientRect().width)).toBe(320);
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(custom.getBoundingClientRect().height);

    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-prompt");
  },
};

/**
 * 375px, and this is the story that does not pass its own headline.
 *
 * **The default vocabulary does not fit a phone.** Measured with nothing but
 * the five verbs the component ships: Improve 89px, Shorten 88, Expand 85, Tone
 * 70, Custom prompt 135, and the bar 493px inside a 375px column — 118px over,
 * `scrollWidth` 493 against `clientWidth` 375. I3 fits eight targets in the
 * same width because they are icons; every one of K4's is a drawn label, and no
 * prop turns them off (`showLabel: true` is hardcoded on Shorten and Expand,
 * and the other three always draw). `tones={[]}` buys back 70px and still
 * leaves it 48px over.
 *
 * So the overflow is real and it is *not* asserted, because asserting it would
 * pin it. What is asserted is the part that stays true and would regress
 * quietly: the bar is `w-fit` with no scroll container and `overflow: visible`,
 * so nothing is clipped — every verb is still present, named and hit-testable,
 * and the failure is layout rather than access. And both popups are narrower
 * than the phone, so the surfaces the bar opens are sized for one even though
 * the bar is not.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <SelectionToolbar {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "AI writing tools" });

    // Nothing is clipped: no scroll container, no hidden overflow, so every
    // verb the caller passed is still there and still named.
    await expect(getComputedStyle(toolbar).overflowX).toBe("visible");
    for (const name of ["Improve", "Shorten", "Expand", "Tone", "Custom prompt"]) {
      await expect(canvas.getByRole("button", { name }).getBoundingClientRect().width).toBeGreaterThan(0);
    }

    // The surfaces it opens are phone-sized even though the bar is not.
    await userEvent.click(canvas.getByRole("button", { name: "Tone" }));
    const menu = await openedSurface("selection-toolbar-tone-menu");
    await expect(menu.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-tone-menu");

    await userEvent.click(canvas.getByRole("button", { name: "Custom prompt" }));
    const popover = await openedSurface("selection-toolbar-prompt");
    await expect(popover.getBoundingClientRect().width).toBeLessThanOrEqual(375);
    await userEvent.keyboard("{Escape}");
    await dismissedSurface("selection-toolbar-prompt");
  },
};

/**
 * The ceiling counts buttons the user can see, which is the arithmetic a caller
 * needs when the bar above is too wide: `maxActions: 5` with four extra verbs
 * draws exactly five buttons and pushes all four into overflow, because Tone
 * and Custom prompt are subtracted from the ceiling before I3 ever sees it.
 * Without that reservation the same call would draw seven.
 */
export const ActionCeiling: Story = {
  args: {
    maxActions: 5,
    actions: [
      ...EXTRA_ACTIONS,
      { id: "cite", label: "Add citations" },
      { id: "simplify", label: "Simplify" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", { name: "AI writing tools" });
    const drawn = Array.from(toolbar.querySelectorAll<HTMLElement>("button"))
      .map((el) => el.textContent?.trim())
      .filter((name) => name !== "More actions");

    await expect(drawn).toEqual(["Improve", "Shorten", "Expand", "Tone", "Custom prompt"]);
    await expect(toolbar).toHaveAttribute("data-overflow-count", "4");
  },
};

const CANVAS_ACTIONS: ContextToolbarAction[] = [
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "remove-bg", label: "Remove background", icon: <Scissors /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

const FLATTENED_WRITING: ContextToolbarAction[] = [
  { id: "shorten", label: "Shorten", icon: <Bold />, showLabel: true },
  { id: "expand", label: "Expand", icon: <Italic />, showLabel: true },
  { id: "tone", label: "Tone", showLabel: true },
  { id: "custom", label: "Custom prompt", showLabel: true },
];

/**
 * Against I3 `context-toolbar`, the neighbour K4 is built on and the one most
 * likely to be reached for by mistake. From a screenshot the three bars below
 * are the same component; the difference is what the bar knows.
 *
 * - **I3 with canvas verbs (top)** is what I3 is for: you pass `actions` for
 *   whatever is selected, it enforces the eight-action cap and the AI-first
 *   rule, and every action is a flat `{ id, label }` row behind one `onAction`.
 * - **K4 (middle)** is the same bar with the writing vocabulary already in it,
 *   returning a typed `onIntent` instead of an id. Its `base` is `i3`, so
 *   choosing it is not a fork.
 * - **I3 with the writing verbs flattened (bottom)** is what rebuilding K4 by
 *   hand produces, and the reason it does not work is visible: Tone and Custom
 *   prompt are rows, and a row cannot be a trigger. Tone either becomes five
 *   buttons — the docs module's own don't-example — or a dead end, and the
 *   custom prompt has nowhere to put a textarea. K4 passes both through I3's
 *   `children` slot instead, which is the seam that makes it a configuration
 *   rather than a fork.
 *
 * The rule: **if your verbs need popups of their own, or you are writing
 * "Improve" for the second time, you want K4.** If the vocabulary is yours and
 * every verb fires immediately, I3. If more than eight verbs apply, neither —
 * that is I2 `property-inspector`, the boundary the spec's cap draws. And if
 * there is no selection to act on, the neighbour is K2 `inline-generate-popup`,
 * which anchors to the caret and generates new text rather than asking for a
 * rewrite of text that already exists.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          I3 context toolbar — verbs you supply, one flat onAction
        </p>
        <ContextToolbar selection="image" actions={CANVAS_ACTIONS} onAction={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          K4 selection toolbar — the writing vocabulary, built on I3
        </p>
        <SelectionToolbar
          selectionText="The model timed out before the second pass finished."
          onIntent={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          I3 rebuilt by hand — Tone and Custom prompt are rows, so neither can open anything
        </p>
        <ContextToolbar
          selection="text"
          label="Writing actions rebuilt on I3"
          aiLabel="Improve"
          actions={FLATTENED_WRITING}
          onAction={() => {}}
        />
      </section>
    </div>
  ),
};
