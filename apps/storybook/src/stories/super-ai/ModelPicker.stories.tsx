import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Film, Image as ImageIcon } from "lucide-react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";
import { ModelPicker, type ModelPickerModel } from "@/registry/super-ai/model-picker";
import { ModelPickerDocs } from "@/content/components/model-picker.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const MODELS: ModelPickerModel[] = [
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    icon: <Film aria-hidden className="size-4" />,
    description: "Google's flagship text-to-video model",
    group: "Text → video",
    price: 20,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
  {
    id: "sora-2",
    name: "Sora 2",
    icon: <Film aria-hidden className="size-4" />,
    description: "OpenAI's video model with native audio",
    group: "Text → video",
    price: 25,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
  {
    id: "kling-2-5",
    name: "Kling 2.5",
    icon: <ImageIcon aria-hidden className="size-4" />,
    description: "Image-to-video with strong motion control",
    group: "Image → video",
    price: 15,
    capabilities: ["4K"],
    runtime: "cloud",
  },
  {
    id: "svd-local",
    name: "Stable Video Diffusion",
    icon: <ImageIcon aria-hidden className="size-4" />,
    description: "Runs entirely on your machine",
    group: "Image → video",
    price: 0,
    capabilities: ["720p"],
    runtime: "local",
    hardware: "12GB VRAM",
  },
];

const meta: Meta<typeof ModelPicker> = {
  title: "Super AI/Model Picker",
  component: ModelPicker,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModelPickerDocs) } },
  args: { models: MODELS, selectedId: "veo-3-1" },
};

export default meta;
type Story = StoryObj<typeof ModelPicker>;

/**
 * The toolbar shape: one `combobox` whose accessible name already carries the
 * current model ("Model: Veo 3.1"), so the choice is announced without
 * opening anything. The task-signature groups become real `SelectGroup`s,
 * which is the only presentation where the grouping reaches a screen reader
 * — `expanded-cards` and `node-inline` draw the same headings with A12
 * `section-header`, whose title is a `<span>`.
 *
 * The rows inside the listbox are `entity-row` **without** `onSelect`, on
 * purpose: `SelectItem` is already the `role="option"` element, so an
 * interactive row here would nest a button inside an option and trip axe's
 * `nested-interactive`.
 *
 * This is also the presentation where the badges do not survive. The vendored
 * `SelectContent` is `w-(--anchor-width) overflow-x-hidden`, so the listbox is
 * exactly as wide as the trigger — and the trigger's floor is `min-w-56`
 * (224px) while a row of title, description, runtime badge, capability badges
 * and cost chip needs 370px. Measured on this story's own args: the badge row
 * alone is 277px and 142px of it is clipped away, unreachable, with no
 * horizontal scroll. `LongContent` carries the rest of that finding.
 */
export const Dropdown: Story = { args: { presentation: "dropdown" } };

/**
 * Model choice as the primary decision on a screen: every model, every badge,
 * nothing behind a trigger. This is the only presentation with no popup, so
 * it is also the only one where the whole list is in the tab order — four
 * models is four stops, and the group headings are not stops, so there is no
 * way to skip a task signature you do not care about.
 *
 * A row here is `entity-row`'s button branch, which means selection is a
 * toggle button with `aria-pressed` rather than an option in a listbox. Four
 * mutually exclusive toggles, exclusive only by the host's convention.
 */
export const ExpandedCards: Story = { args: { presentation: "expanded-cards" } };

/**
 * Sized to sit inside a canvas or workflow node without dominating it: a 28px
 * trigger capped at `max-w-40`, and a popover rather than a listbox.
 *
 * The distinction that catches people is what the popup is. `dropdown` opens
 * a listbox you arrow through; this opens a `role="dialog"` full of buttons
 * you **Tab** through. Same data, same badges, different keyboard model — and
 * the reason `onSelect` comes back to the rows here while `dropdown` leaves
 * them inert.
 */
export const NodeInline: Story = { args: { presentation: "node-inline" } };

/* -------------------------------------------------------------------------
 * Case stories — the situations a model chooser meets in a product, as
 * opposed to the three containers above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from the shape rather than from thoroughness: three containers
 * with three different keyboard models, a Base UI popup that animated with no
 * reduced-motion branch, a real `selectedId`/`onSelect` pair, four optional
 * text slots, an entirely author-supplied model list, and two near-twins in
 * the catalog that already duplicate it (A7 `gen-settings-bar`, C1
 * `hero-omnibox`).
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, all three containers at once, because only one of them can
 * actually be judged from a wrapper-level `dir`.
 *
 * **`expanded-cards` mirrors, and this is the record of why.**
 * `model-picker.tsx` contains no physical direction class at all — no `pl-`,
 * `ml-`, `border-l` or `text-left` — and A6 `entity-row` is already on logical
 * properties (`text-start`, `gap-3`, `px-3`), so the icon lands at the visual
 * right and the badge row at the visual left with nothing added. The price
 * inside `cost-chip` stays LTR because the chip isolates its own amount with
 * `dir="ltr"`, so "20 credits" does not come out as "credits 20". A future
 * edit reaching for `ml-auto` or `text-left` would break this story and
 * nothing else.
 *
 * **Neither popup can be judged here, and the reason is worth writing down.**
 * Both portal to `document.body`, outside the `dir="rtl"` wrapper, so the
 * listbox's computed direction reads back `ltr` and its contents lay out LTR
 * inside an RTL page. In a real app `dir` sits on `<html>` and the portal
 * inherits it, so that part is a property of how RTL stories are written in
 * this repo rather than a defect — every RTL story here wraps rather than
 * setting the document.
 *
 * **What does not mirror in either case is the alignment.** `node-inline`
 * passes `align="start"`, and Base UI resolves that against `useDirection()`,
 * which the D/I wave found has no `DirectionProvider` anywhere in this repo
 * and therefore always answers `"ltr"` (`CONTINUE.md` §8). Measured in this
 * story with room on both sides: the trigger occupies [559, 641] and the
 * popover [559, 847] — the *left* edges line up, where an RTL reader expects
 * the right ones to. Recorded, not asserted; the fix is one provider at the
 * app shell, which is a shell-level decision.
 *
 * The wrapper centres its children instead of the usual `items-start`, so the
 * popover has room on both sides — flush against the viewport edge, a
 * collision shift produces the same numbers as a correct RTL alignment and
 * the measurement proves nothing.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex flex-col items-center gap-6">
      <ModelPicker {...args} presentation="dropdown" />
      <ModelPicker {...args} presentation="expanded-cards" />
      <ModelPicker {...args} presentation="node-inline" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // expanded-cards: the row is a button, so its parts are addressable.
    const row = canvas.getByRole("button", { name: /Stable Video Diffusion/ });
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const trailing = row.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;
    const icon = row.querySelector<HTMLElement>('[data-slot="entity-row-icon"]')!;

    // Mirrored, not merely reordered in the DOM: icon at the visual right,
    // badges at the visual left, title between them.
    await expect(icon.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().left);
    await expect(trailing.getBoundingClientRect().left).toBeLessThan(title.getBoundingClientRect().left);

    // The price is a number with a unit, so it is the one string in the row
    // that must NOT mirror. cost-chip isolates it.
    const amount = within(row).getByText(/credits/);
    await expect(amount).toHaveAttribute("dir", "ltr");

    // The popover is the one popup this component names itself — the in-wave
    // `aria-label` fix — so opening it here also puts it under axe in RTL.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-presentation="node-inline"] [data-slot="model-picker-trigger"]',
    )!;
    await userEvent.click(trigger);
    const popover = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[role="dialog"][data-slot="model-picker-content"]');
      if (!el) throw new Error("the popover never opened");
      return el;
    });
    await expect(popover).toHaveAttribute("aria-label", "Model: Veo 3.1");

    // Deliberately not asserted: the popover's alignment. Measured in this
    // story at a viewport with room on both sides — trigger [559, 641],
    // popover [559, 847] — the left edges line up, which is `align="start"`
    // resolved as LTR. Asserting it would pin the missing DirectionProvider.
  },
};

/**
 * `prefers-reduced-motion`. Nothing in `model-picker.tsx` carries an
 * `animate-*` class, which is exactly how this stayed invisible to a
 * class-level audit — the motion belongs to the two Base UI popup surfaces it
 * opens, and this component is named in `CONTINUE.md` §8's list of 33
 * registry items in that position.
 *
 * Fixed in-wave as a mechanical repair on `node-inline`'s popover, using the
 * restated form, because the plain one-class remedy is inert on a Base UI
 * popup: `motion-reduce:data-open:animate-none
 * motion-reduce:data-closed:animate-none`. Against the bare variant the
 * surface reads `animationName: "enter"` under emulated reduce.
 *
 * `dropdown` needed nothing, and the reason is worth recording rather than
 * assuming: the vendored `SelectContent` ships
 * `data-[align-trigger=true]:animate-none` and defaults
 * `alignItemWithTrigger` to `true`, so its popup is already unanimated for
 * every reader, not only a reduced-motion one. The assertion below holds it
 * to that — if a future edit passes `alignItemWithTrigger={false}` the
 * listbox starts animating with no reduced-motion branch, and this story is
 * where that shows up.
 *
 * `vitest.config.ts` emulates reduce for every test, so both assertions read
 * `animationName` off the live surface rather than checking for a class.
 */
export const ReducedMotion: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <ModelPicker {...args} presentation="dropdown" />
      <ModelPicker {...args} presentation="node-inline" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const settledPopup = async (slot: string) => {
      let popup: HTMLElement | null = null;
      await waitFor(() => {
        popup = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
        if (!popup) throw new Error(`${slot} never opened`);
      });
      return popup as unknown as HTMLElement;
    };

    // 1. node-inline's popover — the surface that zooms out of a 28px trigger
    //    into a 288px panel, and the one that needed the fix.
    await userEvent.click(canvas.getByRole("button", { name: "Model: Veo 3.1" }));
    const popover = await settledPopup("model-picker-content");
    await expect(popover).toHaveAttribute("data-open");
    await expect(getComputedStyle(popover).animationName).toBe("none");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[data-slot="model-picker-content"]')).toBeNull());

    // 2. dropdown's listbox — unanimated by the primitive's own
    //    align-with-trigger branch, asserted so a change to that is visible.
    await userEvent.click(canvas.getByRole("combobox", { name: "Model: Veo 3.1" }));
    const listbox = await settledPopup("model-picker-content");
    await expect(getComputedStyle(listbox).animationName).toBe("none");
  },
};

/**
 * Three containers, three different keyboard models — the single fact this
 * component's accessibility notes spend five bullets on, proved here.
 *
 * The page below is the three presentations stacked, so the tab order is the
 * comparison: **one** stop for `dropdown`, **four** for `expanded-cards` (one
 * per model, headings excluded), **one** for `node-inline`. Six stops for
 * twelve models, and the middle four are the whole cost of drawing the list.
 *
 * Then what each popup does with the keys:
 *
 * - `dropdown` opens a listbox. Arrows move the highlight inside it, Escape
 *   closes and focus lands back on the trigger.
 * - `node-inline` opens a `role="dialog"`. Arrows do nothing; the rows are
 *   buttons you Tab between, and Escape returns focus to its trigger too.
 *
 * The in-popup walk uses the settle-on-departure form from
 * `story-conventions.md` fact 4 — wait for focus to leave the previous stop
 * before reading, so every press is provably one move rather than a count
 * inside an allowance.
 *
 * `expanded-cards` has no popup and moves focus nowhere: selecting a row
 * leaves focus on that row, which is right, because the row stays mounted.
 * That is the contrast with E6 `generation-queue`, whose rows unmount.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <ModelPicker {...args} presentation="dropdown" />
      <ModelPicker {...args} presentation="expanded-cards" />
      <ModelPicker {...args} presentation="node-inline" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // `[tabindex="-1"]` is excluded from every branch, not only the bare
    // `[tabindex]` one: Base UI's Select ships a hidden `<input>` beside its
    // trigger for form submission, carrying `tabindex="-1" aria-hidden="true"`,
    // and a looser selector counts it as a seventh stop that no one can reach.
    const stops = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
      ),
    ).filter((el) => el.getAttribute("tabindex") !== "-1" && el.getAttribute("aria-hidden") !== "true");

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} [${el.textContent?.trim().slice(0, 28) ?? ""}]`;

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    // 1. One trigger + four rows + one trigger. The eight group headings
    //    across the three pickers are chrome, not stops.
    await expect(stops).toHaveLength(6);

    // 2. Walk the page in order, one control per Tab, no repeats, every stop
    //    visibly focused.
    const seen = new Set<HTMLElement>();
    for (let i = 0; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(nameOf(focused)).toBe(nameOf(stops[i]));
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // 3. dropdown: arrows travel inside the listbox, Escape returns focus.
    const combobox = canvas.getByRole("combobox", { name: "Model: Veo 3.1" });
    combobox.focus();
    await userEvent.keyboard("{ArrowDown}");
    const listbox = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="model-picker-content"]');
      if (!el) throw new Error("the listbox never opened");
      return el;
    });
    const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
    await expect(options).toHaveLength(4);

    const settledOption = async (previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!options.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the listbox's options: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off the previous option yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    let previous = await settledOption();
    const walked = new Set<HTMLElement>([previous]);
    for (let i = 1; i < options.length; i += 1) {
      await userEvent.keyboard("{ArrowDown}");
      const focused = await settledOption(previous);
      await expect(`option ${options.indexOf(focused)} repeat=${walked.has(focused)}`).toBe(
        `option ${options.indexOf(focused)} repeat=false`,
      );
      walked.add(focused);
      previous = focused;
    }
    await expect(walked.size).toBe(options.length);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(combobox));
    // Base UI's Select popup does not unmount on Escape — it stays in the DOM
    // as an inert `role="presentation"` node carrying `data-closed`, still
    // holding its four `entity-row` divs. Both popups share
    // `data-slot="model-picker-content"`, so waiting for that slot to
    // disappear hangs, and an unscoped query below would walk the closed
    // listbox instead of the popover. Every query past here names the role.
    await waitFor(() =>
      expect(document.querySelector('[data-slot="model-picker-content"]')).toHaveAttribute("data-closed"),
    );

    // 4. node-inline: the popup is a dialog of buttons, so the rows are Tab
    //    stops rather than arrow targets, and Escape returns focus too.
    const trigger = canvas.getByRole("button", { name: "Model: Veo 3.1" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const popover = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[role="dialog"][data-slot="model-picker-content"]');
      if (!el) throw new Error("the popover never opened");
      return el;
    });
    const rows = Array.from(popover.querySelectorAll<HTMLElement>('[data-slot="entity-row"]'));
    await expect(rows).toHaveLength(4);

    const settledRow = async (prev?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!rows.includes(active as HTMLElement)) {
          throw new Error(`focus is not on one of the popover's rows: ${nameOf(active)}`);
        }
        if (prev && active === prev) throw new Error("focus has not moved off the previous row yet");
      });
      return document.activeElement as HTMLElement;
    };

    let prevRow = await settledRow();
    const tabbed = new Set<HTMLElement>([prevRow]);
    for (let i = 1; i < rows.length; i += 1) {
      await userEvent.tab();
      const focused = await settledRow(prevRow);
      await expect(`row ${rows.indexOf(focused)} repeat=${tabbed.has(focused)}`).toBe(
        `row ${rows.indexOf(focused)} repeat=false`,
      );
      await assertVisiblyFocused(focused);
      tabbed.add(focused);
      prevRow = focused;
    }
    await expect(tabbed.size).toBe(rows.length);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * `selectedId` / `onSelect` is a real controlled pair, and the shell below
 * holds it the hard way: it records what the picker asked for and applies it
 * only when told to.
 *
 * Both containers are wired to the **same** held value, which is the fact
 * worth proving. What it shows, in order: clicking a row does not move the
 * rendered selection; the callback still fires with the id a host needs; a
 * re-render with an unchanged `selectedId` leaves everything where it was;
 * and applying the request moves `expanded-cards`' `aria-pressed` **and** the
 * `dropdown` trigger's accessible name together, because both read the one
 * value.
 *
 * The `dropdown` half is the half a reader would doubt. Base UI's `Select`
 * normally holds its own value, and this component passes `value={selectedId}`
 * without a `defaultValue`, so the primitive is controlled too — a click on
 * an option cannot move the trigger's name on its own.
 *
 * What is *not* controlled: the open state of either popup. There is no
 * `open`/`onOpenChange` pair on `ModelPickerProps`, so a host that wants to
 * close the picker when something behind it changes cannot.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const veoRow = () => canvas.getByRole("button", { name: /Veo 3\.1/ });
    const soraRow = () => canvas.getByRole("button", { name: /Sora 2/ });

    await expect(veoRow()).toHaveAttribute("aria-pressed", "true");
    await expect(soraRow()).toHaveAttribute("aria-pressed", "false");
    canvas.getByRole("combobox", { name: "Model: Veo 3.1" });

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(soraRow());
    await expect(soraRow()).toHaveAttribute("aria-pressed", "false");
    await expect(veoRow()).toHaveAttribute("aria-pressed", "true");

    // 2. …but the callback fired, with the id the host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("sora-2");

    // 3. Re-render with an unchanged `selectedId`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(soraRow()).toHaveAttribute("aria-pressed", "false");

    // 4. The payload was enough to apply the change — and it moves both
    //    containers, because they read one value.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(async () => {
      await expect(soraRow()).toHaveAttribute("aria-pressed", "true");
    });
    await expect(veoRow()).toHaveAttribute("aria-pressed", "false");
    canvas.getByRole("combobox", { name: "Model: Sora 2" });
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState("veo-3-1");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex flex-col gap-4">
      <ModelPicker presentation="dropdown" models={MODELS} selectedId={applied} onSelect={setRequested} />
      <ModelPicker
        presentation="expanded-cards"
        models={MODELS.slice(0, 2)}
        selectedId={applied}
        onSelect={setRequested}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>selectedId prop</dt>
        <dd data-testid="applied">{applied}</dd>
        <dt>last onSelect</dt>
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
        <Button size="sm" disabled={requested === null} onClick={() => requested && setApplied(requested)}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * Every optional text slot emptied at once: no `label` prefix, no
 * `selectedId` so the placeholder stands in for a name, and models carrying
 * only a `name` — no `description`, no `capabilities`, no `price`, no
 * `hardware`.
 *
 * What survives is the point. The runtime badge is not optional, so a row
 * stripped to nothing still says "Cloud" or "Local" in words rather than by
 * colour, and both triggers stay named — a picker with nothing chosen
 * announces "Select a model", not silence.
 *
 * **The defect this surfaces, recorded and not asserted.** `label` is a
 * defaulted prop, so `label=""` reaches the template rather than falling back
 * to "Model", and both triggers come out named `": Select a model"` — a name
 * that opens with a dangling colon, and `": Veo 3.1"` once something is
 * chosen. It is not a `button-name` violation, and WCAG 2.5.3 Label in Name
 * still holds because the drawn text is inside the computed name; it is also
 * not a class fix, because dropping the separator when the prefix is empty is
 * a small API decision. Same shape as the D/I wave's empty-string
 * accessible-name findings on D3 `context-chips` and I2
 * `property-inspector`. The assertions below check that the name still
 * contains what is drawn on screen, and deliberately do not pin the colon.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ModelPicker
        presentation="dropdown"
        label=""
        models={BARE_MODELS}
        onSelect={() => {}}
      />
      <ModelPicker
        presentation="expanded-cards"
        label=""
        models={BARE_MODELS}
        onSelect={() => {}}
      />
      <ModelPicker presentation="node-inline" label="" models={BARE_MODELS} onSelect={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing is selected, so the placeholder is what both triggers draw and
    // what a screen reader is given. Named, not silent.
    const combobox = canvas.getByRole("combobox");
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-presentation="node-inline"] [data-slot="model-picker-trigger"]',
    )!;
    for (const el of [combobox, trigger]) {
      const name = el.getAttribute("aria-label") ?? "";
      await expect(name.trim().length).toBeGreaterThan(0);
      // Label in Name: whatever is drawn is inside the accessible name.
      await expect(name).toContain("Select a model");
    }

    // A row with no description, no price and no capabilities still carries
    // its runtime in words.
    const row = canvas.getByRole("button", { name: /Stable Video Diffusion/ });
    await expect(row.querySelector('[data-slot="entity-row-description"]')).toBeNull();
    within(row).getByText("Local");
    await expect(within(row).queryByText(/credits/)).toBeNull();
  },
};

const BARE_MODELS: ModelPickerModel[] = [
  { id: "veo-3-1", name: "Veo 3.1", group: "Text → video", runtime: "cloud" },
  { id: "svd-local", name: "Stable Video Diffusion", group: "Image → video", runtime: "local" },
];

/**
 * A model name and a description well past what the containers were drawn
 * for — the whole list is author-supplied, so a registry of community
 * checkpoints has exactly this shape.
 *
 * A6 `entity-row` sets `truncate` on both its title and its description, so
 * nothing wraps and no row grows taller; what changes between containers is
 * how much fits before the ellipsis:
 *
 * - `expanded-cards` is `max-w-md`, the widest, and still cuts a
 *   48-character checkpoint id.
 * - `node-inline`'s popover is a fixed `w-72`, and its trigger is `max-w-40`
 *   with its own `truncate` — the same string cut twice, at two widths.
 * - `dropdown`'s listbox is `w-(--anchor-width)`, so it matches the trigger:
 *   widening the trigger is the only way to read more of an option.
 *
 * **Two things recorded rather than asserted.**
 *
 * 1. `entity-row` sets no `title` attribute on either truncated span, so a
 *    name cut at the ellipsis is unrecoverable — no hover, no focus, nothing.
 *    The D/I wave logged the identical shape on D3 `context-chips`' `max-w-40`
 *    label. It belongs to A6, not to this file.
 * 2. `dropdown` does not truncate its badges, it **clips** them. The listbox
 *    inherits the trigger's width and `overflow-x-hidden`, and at the
 *    trigger's `min-w-56` floor a 370px row is shown through a 216px option:
 *    the runtime badge, the capability badges and the cost chip are cut off
 *    with no scroll and no ellipsis. The spec's first two bullets are "local
 *    vs cloud is a first-class badge with hardware requirements" and price
 *    from one source, so the presentation most likely to sit in a toolbar is
 *    the one that drops both unless the host sizes the trigger past ~380px.
 *    Fixing it is a design choice — widen the popup off the anchor, or drop
 *    the badges to a second line — so it stays recorded.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ModelPicker presentation="dropdown" models={LONG_MODELS} selectedId="svd-xt" onSelect={() => {}} />
      <ModelPicker
        presentation="expanded-cards"
        models={LONG_MODELS}
        selectedId="svd-xt"
        onSelect={() => {}}
      />
      <ModelPicker presentation="node-inline" models={LONG_MODELS} selectedId="svd-xt" onSelect={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = within(
      canvasElement.querySelector<HTMLElement>('[data-presentation="expanded-cards"]')!,
    );

    const row = cards.getByRole("button", { name: /stable-video-diffusion/ });
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const description = row.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;

    // Truncate, not wrap: one line each, and the row keeps a single-row
    // height rather than growing to fit.
    for (const el of [title, description]) {
      const style = getComputedStyle(el);
      await expect(style.whiteSpace).toBe("nowrap");
      await expect(style.textOverflow).toBe("ellipsis");
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
    }

    // …and there is no recovery for what was cut.
    await expect(title.getAttribute("title")).toBeNull();

    // The node-inline trigger cuts the same string a second time, harder.
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-presentation="node-inline"] [data-slot="model-picker-trigger"]',
    )!;
    const label = trigger.querySelector<HTMLElement>("span.truncate")!;
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(trigger.getBoundingClientRect().width).toBeLessThan(
      row.getBoundingClientRect().width,
    );
  },
};

const LONG_MODELS: ModelPickerModel[] = [
  {
    id: "svd-xt",
    name: "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
    description: "Image-to-video at 576×1024, 25 frames, with a temporal consistency pass on decode",
    group: "Image → video",
    price: 0,
    capabilities: ["576×1024"],
    runtime: "local",
    hardware: "16GB VRAM",
  },
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    description: "Google's flagship text-to-video model",
    group: "Text → video",
    price: 20,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
];

/**
 * 375px, all three containers. Nothing scrolls sideways — and the way
 * `expanded-cards` achieves that is the finding.
 *
 * A row is title-plus-description on one side and the badge row on the other,
 * and the badge row wins outright. `entity-row` marks its trailing slot
 * `shrink-0`, so the slot resolves to max-content and never compresses; the
 * `flex-wrap` inside `ModelPickerBadges` is therefore never handed a narrower
 * line box to wrap into. Measured here: the badge row takes **277px of 375**
 * on a single line, leaving the title column **34px**, and "Veo 3.1"
 * truncates. The model name — the thing being chosen — is the first casualty
 * of its own metadata at phone width.
 *
 * `dropdown` is the second finding and it is not phone-specific. Its root is
 * `inline-flex`, so `w-full` on the trigger resolves against a shrink-to-fit
 * box and lands on the `min-w-56` floor: 224px inside a 375px column, with
 * the badge clipping `LongContent` describes. Widening the column does not
 * widen it.
 *
 * Both are behavioural — the honest fixes are letting the trailing slot
 * shrink, or moving the badges under the title below some width, and either
 * is a design decision — so the assertions below hold only what is true: no
 * horizontal scroll anywhere, and every picker inside 375px.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <div className="flex flex-col items-start gap-6">
        <ModelPicker {...args} presentation="dropdown" />
        <ModelPicker {...args} presentation="expanded-cards" />
        <ModelPicker {...args} presentation="node-inline" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");

    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);

    for (const picker of Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="model-picker"]'),
    )) {
      await expect(picker.getBoundingClientRect().width).toBeLessThanOrEqual(375);
      await expect(picker.scrollWidth).toBeLessThanOrEqual(picker.clientWidth);
    }
  },
};

/**
 * Against the two places in this catalog where a model is already being
 * chosen by something that is not this component.
 *
 * The rule is **who owns the capability list**:
 *
 * - **E2 model-picker** owns it. It knows each model's runtime, price and
 *   capabilities, which is what lets the settings strip below it rewrite
 *   itself when the choice changes. If choosing the model changes what
 *   settings apply, the picker has to be the source of that, and the
 *   `node-inline` presentation exists precisely so it fits somewhere small.
 * - **A7 gen-settings-bar** renders the parameters that *follow* from the
 *   choice. Its own demo currently draws the model as a plain-text item, as
 *   below — this component's docs module names that as a pitfall and
 *   `CONTINUE.md` §5.2 has it as an open decision: A7 should compose E2's
 *   `node-inline` rather than duplicating it with an idiom that has neither
 *   the grouping nor the badges.
 * - **C1 hero-omnibox** embeds its own inline model `Select`. That one is a
 *   deliberate composition (a composer's own settings row), but it names its
 *   trigger a static `"Model"` where this component names it
 *   `"Model: Veo 3.1"` — so a screen-reader user is told the current model in
 *   one place and not the other. `CONTINUE.md` §5.3 records it as an open
 *   decision; both spellings are visible side by side here.
 *
 * Cited, not fixed: §5.2 and §5.3 both need a human, and neither is this
 * story's to settle.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E2 model-picker — owns runtime, price and capabilities
        </p>
        <ModelPicker presentation="node-inline" models={MODELS} selectedId="veo-3-1" onSelect={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          A7 gen-settings-bar — the parameters that follow, with the model as inert text
        </p>
        <GenSettingsBar aria-label="Generation settings">
          <GenSettingsItem>Veo 3.1</GenSettingsItem>
          <GenSettingsItem>16:9</GenSettingsItem>
          <GenSettingsItem>8s</GenSettingsItem>
          <GenSettingsItem>1080p</GenSettingsItem>
        </GenSettingsBar>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C1 hero-omnibox — its own inline model select, named &ldquo;Model&rdquo;
        </p>
        <HeroOmnibox
          models={[
            { value: "veo-3-1", label: "Veo 3.1" },
            { value: "sora-2", label: "Sora 2" },
          ]}
          model="veo-3-1"
          onModelChange={() => {}}
          onSubmit={() => {}}
        />
      </section>
    </div>
  ),
};
