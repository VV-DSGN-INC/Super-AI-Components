import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { PermissionPromptDocs } from "@/content/components/permission-prompt.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof PermissionPrompt> = {
  title: "Super AI/Permission Prompt",
  component: PermissionPrompt,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PermissionPromptDocs) } },
  args: {
    open: true,
    onAllowOnce: () => {},
    onAlwaysAllow: () => {},
    onDeny: () => {},
    onEditFirst: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PermissionPrompt>;

const EMAIL_ARGS = [
  { key: "to", value: "finance@example.com" },
  { key: "subject", value: "Q3 invoice — ready for review" },
  { key: "attachment", value: "q3-invoice.pdf" },
];

/** Approves this one call only — nothing persists past it. Allow once and Edit first render with identical weight. */
export const AllowOnce: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason:
      "The invoice PDF finished rendering and this recipient is on the approved list from the last three runs.",
    args: EMAIL_ARGS,
  },
};

/** Writes a standing grant, but the choice is all this component emits — the grant's review-and-revoke surface is N9 autonomy-selector. */
export const AlwaysAllow: Story = {
  args: {
    action: "Read ~/.ssh/config",
    reason: "Checking which git remotes are configured before pushing the branch.",
    args: [{ key: "path", value: "~/.ssh/config" }],
  },
};

/** Terminal, and safe to press — Deny is the dialog's own Close path, so pressing it does nothing but end the surface. */
export const Deny: Story = {
  args: {
    action: "Force-push to main",
    reason: "The agent believes the last commit needs to be rewritten to fix a bad merge.",
    args: [
      { key: "branch", value: "main" },
      { key: "force", value: "true" },
    ],
  },
};

/** Edit-first swaps the arguments block for an inline editor instead of discarding the call like Deny would. */
export const EditFirst: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason: "The invoice PDF finished rendering.",
    args: EMAIL_ARGS,
    defaultEditing: true,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this gate meets in a product, as opposed to
 * the four verbs above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from the shape: an alert dialog with directional layout, one
 * thing that turns, five tab stops behind a focus trap, three real controlled
 * pairs (`open`, `argsExpanded`, `editing`), an optional `reason` and four
 * defaulted verb labels, author-supplied arguments of unbounded size, and a
 * near-twin (F7 `approval-card`) that landed with the same four-verb shape.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with `dir` on the document rather than on a wrapper — the
 * dialog portals to `document.body`, so a `<div dir="rtl">` around the story
 * cannot reach it (`story-conventions.md`, fact 5's closing note).
 *
 * Reading order is the safety contract here. The four verbs mean four
 * different things and only their order tells them apart at a glance, so if
 * the row does not mirror, a reader whose eye starts at the right edge starts
 * on Allow once instead of Deny.
 *
 * **It mirrors, and nothing in this component's own source had to change.**
 * `permission-prompt.tsx` carries no physical inline utility anywhere — no
 * `pl-`, `ml-`, `left-`, `border-l`, `text-left` — only `flex`, `grid`,
 * `gap-*` and `items-start`, all of which resolve against the writing
 * direction. There is nothing here for the logical-property sweep in
 * `CONTINUE.md` §8 to swap. Measured under `dir="rtl"` and asserted below:
 * Deny paints at 720, Always allow 606, Edit first 521, Allow once 419 — the
 * first verb at the right edge, the last at the left. The argument grid
 * mirrors with it (`grid-cols-[6rem_1fr]` puts the key column at 669 and the
 * value at 430), and the expand toggle moves to the inline start.
 *
 * **What does not mirror is the vendored `AlertDialogHeader`, and this is a
 * sixth instance of the physical-class shape §8 has been collecting.**
 * `components/ui/alert-dialog.tsx` gives the header
 * `sm:group-data-[size=default]/alert-dialog-content:text-left` beside a
 * logical `place-items-start`. Measured here: `place-items` correctly puts the
 * title box at the inline start (title at 504..776, hugging the right edge)
 * while `text-align` computes to `left` on the header, the title and the
 * description alike. The title is shrink-to-fit so nothing shows; the
 * description is full-width (419..776), so **its ragged edge lands on the
 * right — the side an Arabic or Hebrew reader starts from.** The reason the
 * agent gives for wanting the permission is the one block of prose here, and
 * it is the block that reads wrong.
 *
 * Not swapped and not asserted: `text-left` → `text-start` is byte-identical
 * in LTR and would fix every dialog in the registry at once, but it lives in a
 * vendored primitive shared by four `super-ai` components and both copies of
 * `components/ui`, so it is one change for whoever owns that file rather than
 * a sweep from one consumer's story. Recorded in the wave report.
 *
 * The chevron needs no mirroring — it rotates about the vertical axis
 * (down → up), which is the same gesture in both directions.
 */
export const RTL: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason:
      "The invoice PDF finished rendering and this recipient is on the approved list from the last three runs.",
    args: EMAIL_ARGS,
    defaultArgsExpanded: true,
  },
  render: (args) => (
    <RtlDocument>
      <PermissionPrompt {...args} />
    </RtlDocument>
  ),
  play: async () => {
    const slot = (name: string) =>
      document.querySelector<HTMLElement>(`[data-slot="permission-prompt-${name}"]`)!;
    const leftOf = (el: Element) => el.getBoundingClientRect().left;

    // 1. The verb row mirrors: Deny at the reading start (the right edge),
    //    Allow once at the far end, and the two middle verbs in between.
    const order = ["deny", "always-allow", "edit-first", "allow-once"].map((name) =>
      Math.round(leftOf(slot(name))),
    );
    await expect(`descending=${order.every((x, i) => i === 0 || x < order[i - 1])}`).toBe("descending=true");

    // 2. The argument grid mirrors with it — key column at the reading start,
    //    value column after it.
    const list = slot("arguments-list");
    await expect(
      `key right of value=${leftOf(list.querySelector("dt")!) > leftOf(list.querySelector("dd")!)}`,
    ).toBe("key right of value=true");

    // 3. `items-start` on the arguments block is logical, so the toggle sits at
    //    the inline start rather than pinned left.
    const prompt = document.querySelector<HTMLElement>('[data-slot="permission-prompt"]')!;
    const midpoint = prompt.getBoundingClientRect().left + prompt.getBoundingClientRect().width / 2;
    await expect(`toggle past midpoint=${leftOf(slot("arguments-expand")) > midpoint}`).toBe(
      "toggle past midpoint=true",
    );
  },
};

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

/**
 * `prefers-reduced-motion`, on the three things that move when this gate
 * appears. Two of them are fixed here as mechanical repairs (spec §3.4); the
 * third cannot be reached from this file and is recorded.
 *
 * **1. The chevron.** `CONTINUE.md` §8 named
 * `permission-prompt.tsx:184` as one of four rotating chevrons the E/P wave
 * left for the family that owns the file — verified still live before this
 * story: `transition-property` read back `"transform, translate, scale,
 * rotate"` under emulated reduce. It now carries
 * `motion-reduce:transition-none` beside its `transition-transform`, the
 * `pricing-table` / `generation-panel` idiom for the second sanctioned shape
 * in `story-conventions.md` fact 3 — a 180° turn is travel, not a colour
 * crossfade. The rotation itself is kept, so the affordance survives.
 *
 * **2. The dialog panel.** `AlertDialogContent` opens with
 * `data-open:animate-in fade-in-0 zoom-in-95`, none of which reads the media
 * feature. Measured before the fix: `animation-name` read `"enter"`, and
 * because a `zoom-in-95` was still in flight the panel measured 365px against
 * its own 384px width — so the animation was not only visible under reduce, it
 * was making every geometry read in this file 5% small. The restated pair
 * (`motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`)
 * now sits on the component's own class string, because a bare
 * `motion-reduce:animate-none` loses the source-order tie to `data-open:` —
 * fact 3's correction, measured again here.
 *
 * **3. The backdrop, which is a defect this story found and could not fix.**
 * The K/L wave put the restated pair on `DialogOverlay` in
 * `components/ui/dialog.tsx`, with a comment saying no call site can reach a
 * backdrop. **`components/ui/alert-dialog.tsx` never got that change**, and it
 * has the identical shape: `AlertDialogContent` renders `<AlertDialogOverlay />`
 * with no `className` threaded through. Measured here with the panel fixed —
 * panel `animation-name: none`, **overlay `animation-name: enter`** — which is
 * exactly the split L3 `feature-announcement` measured on the dialog before it
 * was repaired centrally. It is one line in a vendored file shared by
 * `permission-prompt`, `thread-list`, `trust-dialog` and `voice-clone-recorder`
 * (and duplicated across both copies of `components/ui`), so it belongs with
 * whoever owns that file rather than in one consumer's story. Not asserted:
 * pinning `animationName === "enter"` would pin the bug.
 *
 * Also left alone, and for the reason §8 already records: the vendored
 * `Button` carries `transition-all` and a one-pixel `active:` press nudge, so
 * all four verbs still move a pixel while pressed under reduce. That is a
 * primitive-wide posture, not this component's.
 */
export const ReducedMotion: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason: "The invoice PDF finished rendering.",
    args: EMAIL_ARGS,
  },
  play: async () => {
    const body = within(document.body);
    const toggle = () =>
      document.querySelector<HTMLElement>('[data-slot="permission-prompt-arguments-expand"]')!;

    // 1. The chevron's transition is suppressed — read back off the live
    //    element rather than trusting the class, because a `motion-reduce:`
    //    variant can lose a specificity tie and read as if it were absent.
    const chevron = () => toggle().querySelector("svg")!;
    await expect(getComputedStyle(chevron()).transitionProperty).toBe("none");

    // 2. …and it still turns, so a reduced-motion reader keeps the affordance
    //    that says the arguments are folded rather than missing.
    const resting = getComputedStyle(chevron()).rotate;
    await userEvent.click(toggle());
    await expect(body.getByRole("button", { name: "Hide arguments" })).toBeInTheDocument();
    await expect(getComputedStyle(chevron()).rotate).not.toBe(resting);

    // 3. The panel's restated pair, read on the frame a bare
    //    `motion-reduce:animate-none` fails to reach.
    const panel = document.querySelector<HTMLElement>('[data-slot="permission-prompt"]')!;
    await expect(panel).toHaveAttribute("data-open");
    await expect(getComputedStyle(panel).animationName).toBe("none");

    // 4. With the panel's zoom suppressed the dialog measures its own declared
    //    width rather than 95% of it — the geometry every other story reads.
    await expect(`width=${getComputedStyle(panel).maxWidth}`).toBe(
      `width=${Math.round(panel.getBoundingClientRect().width)}px`,
    );
  },
};

/**
 * Five stops behind a focus trap, and the order is the argument: the arguments
 * toggle comes **first**, so a keyboard user reaches "Show all 3 arguments" on
 * the way to every verb rather than past them. A footer-first order would let
 * someone approve a call without passing the only affordance that reveals what
 * the call is.
 *
 * What the walk pins:
 *
 * - **Opening from a trigger lands on the toggle**, not on the first verb —
 *   the walk is seeded from where focus actually went rather than from an
 *   assumed first element, so the stop it opened on is counted.
 * - **Five stops, then it cycles.** One more Tab past Allow once returns to the
 *   toggle rather than leaving for the page, which is what "modal" has to mean
 *   on a surface that is asking a question.
 * - **A visible treatment at every stop, caused by focus.** Both checks, for
 *   the reason `story-conventions.md` fact 5 gives: `settledFocusRing` proves
 *   something is painted (and waits, because the vendored `Button` fades its
 *   ring in over ~250ms), while the differential proves focus is what painted
 *   it. The differential is taken by reading the *next* stop's signature while
 *   focus is still on the previous one, so nothing has to be blurred and the
 *   sequence under test is undisturbed.
 * - **Escape closes and returns focus to the trigger**, and the play waits for
 *   the dialog to be gone before it reads anything — a popup caught
 *   mid-dismissal is what hands axe a transitional opacity.
 *
 * Each read waits for focus to *leave* the previous stop rather than for focus
 * to be on *some* expected stop: inside a portal the trailing focus guard
 * re-enters through a `requestAnimationFrame`, so an immediate read returns
 * either the guard or the control it redirects to, and the weaker wait cannot
 * see a press that has not applied yet because the stale stop is expected too.
 * That is `ai-tools-menu`'s finding (fact 4), reused rather than re-derived.
 *
 * **Recorded, not asserted, because pinning it would pin the bug.** Pressing
 * Edit first unmounts the button holding focus and puts focus nowhere: measured
 * here, focus lands back on the dialog panel itself, so the person who just
 * asked to edit has to Tab into the editor they opened, and Back has the same
 * shape in reverse. The docs module already carries the sentence; this is the
 * measurement behind it. Also unasserted: Escape closes without calling
 * `onDeny`, so the agent's call ends neither approved nor refused — an API
 * decision (`onOpenChange(false)` as a refusal) rather than a class swap.
 */
export const KeyboardOrder: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason: "The invoice PDF finished rendering.",
    args: EMAIL_ARGS,
    open: undefined,
    trigger: <button type="button">Review the paused call</button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole("button", { name: "Review the paused call" });

    // 1. One stop in the page; the dialog contributes none until it opens.
    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await settledFocusRing(trigger, waitFor);

    await userEvent.keyboard("{Enter}");
    const dialog = await body.findByRole("alertdialog", {
      name: "Send email to finance@example.com",
    });
    const stops = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    await expect(stops.map((el) => el.dataset.slot)).toEqual([
      "permission-prompt-arguments-expand",
      "permission-prompt-deny",
      "permission-prompt-always-allow",
      "permission-prompt-edit-first",
      "permission-prompt-allow-once",
    ]);

    const nameOf = (el: Element | null) =>
      el === null ? "nothing" : `stop#${stops.indexOf(el as HTMLButtonElement)}`;

    /** The focused control once Base UI has finished moving focus off
     *  `previous` — fact 4's settle-on-departure form. */
    const settledStop = async (previous?: HTMLButtonElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLButtonElement)) {
          throw new Error(`focus is not on one of the dialog's controls: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLButtonElement;
    };

    // 2. Focus entered on the toggle. Seed the lap from where it landed.
    const start = await settledStop();
    await expect(nameOf(start)).toBe("stop#0");
    await expect(`${nameOf(start)} focusVisible=${start.matches(":focus-visible")}`).toBe(
      `${nameOf(start)} focusVisible=true`,
    );
    await settledFocusRing(start, waitFor);

    // 3. One lap. Each stop is new, paints a treatment, and the treatment is
    //    one focus caused — the next stop's signature is read while focus is
    //    still on the previous one, so nothing has to be blurred.
    const seen = new Set<HTMLButtonElement>([start]);
    let previous = start;
    for (let i = 1; i < stops.length; i += 1) {
      const before = focusTreatmentSignature(stops[i]);
      await userEvent.tab();
      const focused = await settledStop(previous);
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
        `${nameOf(focused)} focusVisible=true`,
      );
      await settledFocusRing(focused, waitFor);
      await waitFor(() => expect(focusTreatmentSignature(focused)).not.toBe(before));
      seen.add(focused);
      previous = focused;
    }
    await expect(seen.size).toBe(stops.length);

    // 4. It cycles rather than leaving: the stop after Allow once is the
    //    toggle again, so the question cannot be tabbed away from.
    await userEvent.tab();
    await expect(nameOf(await settledStop(previous))).toBe(nameOf(start));

    // 5. Escape closes and hands focus back to the trigger. Wait for the
    //    dialog to be gone before reading, so axe is never given a surface
    //    caught mid-dismissal.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * All three controlled pairs at once, held the hard way: the host records what
 * the prompt asked for and applies it only when told to.
 *
 * Controlling this component is not a nicety. `open` is what lets an approval
 * queue decide when the gate goes away, `argsExpanded` is what lets a host
 * remember that this reviewer always reads the arguments, and `editing` is
 * what lets a paused-call flow resume straight into the editor. The
 * component's own comment says the last of those is the point of the prop.
 *
 * What the play proves, in order: pressing Deny does **not** close a
 * controlled dialog; pressing the toggle does **not** expand it, and
 * `aria-expanded` follows the prop rather than the click, so a screen reader
 * is never told the arguments are open while the DOM holds none; pressing Edit
 * first does **not** swap in the editor; every one of those still fires its
 * callback with the payload a host needs; a re-render with unchanged props
 * moves nothing; and applying the requests moves everything.
 *
 * The host panel is queried by `data-testid` rather than by role on purpose —
 * while the modal is open Base UI hides the rest of the page from the
 * accessibility tree, so `getByRole` cannot see the harness. Clicks still
 * land, which is what a host's own code would do anyway.
 *
 * **The defect this story found, recorded and not pinned: the editor is
 * seeded once at mount and never re-seeded, so a reused prompt approves the
 * previous call.** `editedValues` comes from a `useState` initializer over
 * `args`, and nothing re-runs it. A permission gate is the natural singleton —
 * one mounted prompt, a new paused call swapped into it — and in that shape it
 * fails three ways at once. Measured by swapping
 * `to/subject/attachment` for `to/subject/amount_usd` on a mounted prompt and
 * opening the editor: the two carried-over fields still show the **old**
 * values (`finance@example.com`, `Q3 invoice — ready for review`), the new
 * `amount_usd` field renders **empty**, and Approve edited emits
 * `{"to":"finance@example.com","subject":"Q3 invoice — ready for review","attachment":"q3-invoice.pdf"}`
 * — the previous call's three arguments, including one the current call does
 * not have, and without the amount at all. The read-only list is fresh
 * throughout, so the surface shows the new call and edits the old one. The
 * repair is a decision (re-seed on `args` identity, or require a `key` from
 * the host, and either way choose what happens to edits already typed), so it
 * stays recorded. The story asserts only the controlled contract.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const read = (id: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.textContent;
    const press = async (id: string) =>
      userEvent.click(canvasElement.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!);

    const dialogIsOpen = () => document.querySelector('[data-slot="permission-prompt"]') !== null;
    const editorIsOpen = () => document.querySelector('[data-slot="permission-prompt-editor"]') !== null;
    const listIsOpen = () =>
      document.querySelector('[data-slot="permission-prompt-arguments-list"]') !== null;

    await expect(dialogIsOpen()).toBe(true);
    await expect(listIsOpen()).toBe(false);
    await expect(editorIsOpen()).toBe(false);

    // 1. The arguments toggle: interaction alone does not open the list…
    await userEvent.click(body.getByRole("button", { name: "Show all 3 arguments" }));
    await expect(listIsOpen()).toBe(false);

    // 2. …and the control does not claim otherwise. This is the step most
    //    likely to regress: an optimistic internal flip would announce open
    //    arguments over an empty DOM.
    await expect(body.getByRole("button", { name: "Show all 3 arguments" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(read("args-requested")).toBe("true");

    // 3. Edit first does not swap the footer.
    await userEvent.click(body.getByRole("button", { name: "Edit first" }));
    await expect(editorIsOpen()).toBe(false);
    await expect(body.getByRole("button", { name: "Edit first" })).toBeInTheDocument();
    await expect(read("editing-requested")).toBe("true");

    // 4. Deny does not close a controlled dialog — the one that matters most,
    //    because a host that owns `open` owns whether the question is over.
    await userEvent.click(body.getByRole("button", { name: "Deny" }));
    await expect(dialogIsOpen()).toBe(true);
    await expect(read("open-requested")).toBe("false");

    // 5. A re-render with unchanged props moves nothing. Prove the pass first.
    await expect(read("render-pass")).toBe("1");
    await press("rerender");
    await expect(read("render-pass")).toBe("2");
    await expect(`${dialogIsOpen()}/${listIsOpen()}/${editorIsOpen()}`).toBe("true/false/false");

    // 6. Applying the requests moves all three: the payloads were sufficient.
    await press("apply-args");
    await waitFor(() => expect(listIsOpen()).toBe(true));
    await expect(body.getByRole("button", { name: "Hide arguments" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await press("apply-editing");
    await waitFor(() => expect(editorIsOpen()).toBe(true));
    // The editor replaces the arguments block rather than stacking under it.
    await expect(listIsOpen()).toBe(false);

    await press("apply-open");
    await waitFor(() => expect(dialogIsOpen()).toBe(false));
  },
};

function ControlledShell() {
  const [open, setOpen] = React.useState(true);
  const [argsExpanded, setArgsExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  const [openRequest, setOpenRequest] = React.useState<boolean | null>(null);
  const [argsRequest, setArgsRequest] = React.useState<boolean | null>(null);
  const [editingRequest, setEditingRequest] = React.useState<boolean | null>(null);
  const [pass, setPass] = React.useState(1);

  const show = (value: boolean | null) => (value === null ? "—" : String(value));

  return (
    <div className="flex w-96 max-w-full flex-col gap-3">
      <PermissionPrompt
        action="Send email to finance@example.com"
        reason="The invoice PDF finished rendering."
        args={EMAIL_ARGS}
        open={open}
        onOpenChange={setOpenRequest}
        argsExpanded={argsExpanded}
        onArgsExpandedChange={setArgsRequest}
        editing={editing}
        onEditingChange={setEditingRequest}
        onAllowOnce={() => {}}
        onAlwaysAllow={() => {}}
        onDeny={() => {}}
        onEditFirst={() => {}}
      />

      <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt>last onOpenChange</dt>
        <dd data-testid="open-requested">{show(openRequest)}</dd>
        <dt>last onArgsExpandedChange</dt>
        <dd data-testid="args-requested">{show(argsRequest)}</dd>
        <dt>last onEditingChange</dt>
        <dd data-testid="editing-requested">{show(editingRequest)}</dd>
        <dt>host render pass</dt>
        <dd data-testid="render-pass" className="tabular-nums">
          {pass}
        </dd>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="rerender" onClick={() => setPass((n) => n + 1)}>
          Re-render
        </button>
        <button
          type="button"
          data-testid="apply-args"
          onClick={() => argsRequest !== null && setArgsExpanded(argsRequest)}
        >
          Apply arguments
        </button>
        <button
          type="button"
          data-testid="apply-editing"
          onClick={() => editingRequest !== null && setEditing(editingRequest)}
        >
          Apply editing
        </button>
        <button
          type="button"
          data-testid="apply-open"
          onClick={() => openRequest !== null && setOpen(openRequest)}
        >
          Apply open
        </button>
      </div>
    </div>
  );
}

/**
 * Every optional slot emptied, one dialog at a time — they are opened in turn
 * from their own triggers rather than stacked, because three modal alert
 * dialogs on one canvas would fight over the focus trap.
 *
 * 1. **No `reason`.** Measured: the alert dialog carries no `aria-describedby`
 *    at all and no description element is rendered, so the plain-language
 *    `action` is the whole announcement. That is the state to check the action
 *    string against — "Send email" alone tells a screen-reader user nothing
 *    about the recipient, and there is no second slot to recover it from.
 * 2. **No `args`.** The expand toggle is not disabled or empty, it is absent,
 *    and the dialog drops to four tab stops. A prompt in this shape asks for a
 *    decision with nothing to inspect, which is the shape the component's own
 *    rule 2 exists to prevent — worth seeing rendered, because nothing in the
 *    API stops a caller reaching it.
 * 3. **An argument with an empty value.** The row survives with its key and an
 *    empty `<dd>`, so "the parameter is set to nothing" and "the parameter is
 *    missing" look identical — on a call where `force` or `confirm` is the
 *    argument in question, those are different calls.
 *
 * **Three empty-string shapes are recorded rather than rendered, because each
 * would ship a red gate into the a11y run** — the class `CONTINUE.md` §8 has
 * been collecting since D3:
 *
 * - `action=""` leaves `role="alertdialog"` with no accessible name
 *   (`aria-dialog-name`), and unlike a card this surface has no other text to
 *   fall back to;
 * - any of `denyLabel` / `alwaysAllowLabel` / `editFirstLabel` /
 *   `allowOnceLabel` set to `""` renders a verb with no name at all
 *   (`button-name`) — the defaults are parameter defaults, so `""` defeats
 *   them exactly as it did on H7 and J7;
 * - an argument whose `key` is `""` gives the editor a `<label for>` with no
 *   text and a `<Textarea>` with no placeholder, which is K1 `ai-doc-block`'s
 *   `editLabel=""` shape and fails `label`.
 *
 * One more, recorded because no rule covers it: `fieldId` is
 * `${useId()}-${arg.key}`, so two arguments sharing a key produce two elements
 * with the same `id` and both labels point at the first field.
 */
export const EmptyLabel: Story = {
  args: { open: undefined },
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <PermissionPrompt
        {...args}
        action="Send email"
        args={EMAIL_ARGS}
        trigger={<button type="button">No reason</button>}
      />
      <PermissionPrompt
        {...args}
        action="Restart the render worker"
        reason="The worker stopped reporting progress four minutes ago."
        trigger={<button type="button">No arguments</button>}
      />
      <PermissionPrompt
        {...args}
        action="Delete the draft branch"
        reason="The branch has no commits the agent did not write."
        args={[
          { key: "branch", value: "agent/draft-8841" },
          { key: "force", value: "" },
        ]}
        defaultArgsExpanded
        trigger={<button type="button">Empty value</button>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const open = async (name: string) => {
      await userEvent.click(canvas.getByRole("button", { name }));
      return body.findByRole("alertdialog");
    };
    const close = async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    };

    // 1. No reason: a name and nothing else.
    const noReason = await open("No reason");
    await expect(noReason).not.toHaveAttribute("aria-describedby");
    await expect(document.querySelector('[data-slot="alert-dialog-description"]')).toBeNull();
    await close();

    // 2. No args: the toggle is absent rather than empty, and the four verbs
    //    are the whole tab order.
    const noArgs = await open("No arguments");
    await expect(noArgs.querySelector('[data-slot="permission-prompt-arguments"]')).toBeNull();
    await expect(
      Array.from(noArgs.querySelectorAll<HTMLButtonElement>("button:not([disabled])")).map(
        (el) => el.dataset.slot,
      ),
    ).toEqual([
      "permission-prompt-deny",
      "permission-prompt-always-allow",
      "permission-prompt-edit-first",
      "permission-prompt-allow-once",
    ]);
    await close();

    // 3. An empty value keeps its row, so the argument reads as present and
    //    blank rather than as absent. Left open so axe scans this rendering.
    const emptyValue = await open("Empty value");
    const rows = Array.from(
      emptyValue.querySelectorAll<HTMLElement>('[data-slot="permission-prompt-arguments-list"] > div'),
    );
    await expect(rows).toHaveLength(2);
    await expect(rows[1].querySelector("dt")!.textContent).toBe("force");
    await expect(rows[1].querySelector("dd")!.textContent).toBe("");
  },
};

/**
 * A real long call: a file write whose `contents` argument is the thing the
 * human most needs to read. Roughly 90 characters in the action, again in the
 * reason, and a body of the size an agent actually emits.
 *
 * **What the component gets right, and it is the half that matters most.**
 * Values carry `font-mono break-all`, so a 130-character URL, a bearer token
 * or a 24-line file body wraps completely rather than clipping: measured, the
 * value column reports `scrollWidth === clientWidth` and the argument list
 * never scrolls sideways. Nothing is summarised, nothing is elided, and the
 * page itself does not scroll horizontally. For a component whose stated job
 * is to stop people approving what they cannot read, that is the right
 * decision and it is asserted below.
 *
 * **Two things it gets wrong, measured and recorded rather than pinned.**
 *
 * 1. **The key column truncates with no way to recover it.** `<dt>` is
 *    `truncate` inside a fixed `grid-cols-[6rem_1fr]`, with no `title` and no
 *    tooltip. Measured on a realistic HTTP call: `authorization_header`
 *    reports 145px of text in a 96px box and `timeout_seconds` 108px in 96 —
 *    two of five keys cut, silently. The *name* of an argument is what tells
 *    you what its value means, so a clipped key is the same failure as a
 *    clipped value one level up. The repair is a `title`, a wider column or a
 *    wrapping key; all three are layout decisions.
 *
 * 2. **Expanding the arguments can put every verb off the screen, and nothing
 *    scrolls.** `AlertDialogContent` is `fixed top-1/2 -translate-y-1/2` with
 *    no `max-height` and no `overflow`, so the panel grows without bound and
 *    is then centred past both edges of the viewport. Measured with the
 *    24-line body below, expanded, in the gate's 1200×900 chromium: the dialog
 *    renders **1193px tall**, its top at **-146** and its bottom at **1047**,
 *    with the footer holding all four verbs at **982..1047 — entirely below
 *    the fold.** `scrollHeight === clientHeight` on the panel and the document
 *    reports 900/900, so **there is no scrollbar anywhere**: not on the
 *    dialog, not on the page. The toggle that would fold the arguments back
 *    up has gone off the top by the same move. Tab still reaches the verbs and
 *    a fixed element cannot be scrolled into view, so a keyboard user is
 *    pressing buttons they cannot see and a pointer user has only Escape —
 *    which, per the docs module, reports nothing to the agent.
 *
 *    That is this component's own thesis inverted: reading the full arguments
 *    is what removes the ability to allow, refuse or edit them. It arrives
 *    much earlier than the numbers suggest, because the gate's viewport is
 *    900px and a phone's is nearer 660. The repair is a scroll region — on the
 *    panel, or on the arguments list alone — and choosing which part scrolls
 *    while the footer stays put is a design decision, so it stays recorded.
 *
 * 3. **Every argument is edited through the same two-row window.** The
 *    editor's `Textarea` is a fixed `rows={2}` whatever the value is, so the
 *    24-line body is changed through a slit that reports its own overflow;
 *    measured below. A `path` and a file body are not the same editing task.
 */
export const LongContent: Story = {
  args: {
    action: "Write src/lib/billing/reconcile.ts and re-run the invoice job against it",
    reason:
      "The reconcile helper is missing, so the invoice job has nothing to call and the run stalled at step two of five.",
    args: [
      { key: "path", value: "src/lib/billing/reconcile.ts" },
      {
        key: "contents",
        value: Array.from(
          { length: 24 },
          (_, i) => `export function step${i}(input: LedgerRow[]): LedgerRow[] { return input; }`,
        ).join("\n"),
      },
    ],
  },
  play: async () => {
    const body = within(document.body);
    const panel = () => document.querySelector<HTMLElement>('[data-slot="permission-prompt"]')!;

    // 1. Collapsed — the state a reader meets first — fits, and the long
    //    action and reason wrap rather than clipping.
    for (const slot of ["alert-dialog-title", "alert-dialog-description"]) {
      const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      const style = getComputedStyle(el);
      await expect(`${slot} overflow=${style.textOverflow} wrap=${style.whiteSpace}`).toBe(
        `${slot} overflow=clip wrap=normal`,
      );
      await expect(`${slot} clipped=${el.scrollWidth > el.clientWidth}`).toBe(`${slot} clipped=false`);
    }

    // 2. The editor gives the file body the same two-row window as the path.
    await userEvent.click(body.getByRole("button", { name: "Edit first" }));
    const fields = Array.from(
      document.querySelectorAll<HTMLTextAreaElement>('[data-slot="permission-prompt-editor-field"]'),
    );
    await expect(fields).toHaveLength(2);
    await expect(`rows=${fields.map((f) => f.rows).join(",")}`).toBe("rows=2,2");
    // The whole body is present and reachable, just not visible at once.
    await expect(fields[1].value.split("\n")).toHaveLength(24);
    await userEvent.click(body.getByRole("button", { name: "Back" }));

    // 3. Expanded, the values wrap completely: `break-all` means nothing is
    //    cut off the right edge and nothing scrolls sideways.
    await userEvent.click(body.getByRole("button", { name: "Show all 2 arguments" }));
    const list = document.querySelector<HTMLElement>('[data-slot="permission-prompt-arguments-list"]')!;
    const values = Array.from(list.querySelectorAll<HTMLElement>("dd"));
    for (const dd of values) {
      await expect(`wordBreak=${getComputedStyle(dd).wordBreak}`).toBe("wordBreak=break-all");
      await expect(`value clipped=${dd.scrollWidth > dd.clientWidth}`).toBe("value clipped=false");
    }
    await expect(`list scrolls=${list.scrollWidth > list.clientWidth}`).toBe("list scrolls=false");
    await expect(
      `page scrolls=${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
    ).toBe("page scrolls=false");

    // Every value is inside the panel's box, so nothing is cut off the side.
    const panelRight = panel().getBoundingClientRect().right;
    for (const dd of values) {
      await expect(`value inside=${dd.getBoundingClientRect().right <= panelRight}`).toBe(
        "value inside=true",
      );
    }
  },
};

/**
 * 375px. The frame has to be applied to the dialog itself rather than to a
 * wrapper around the story: `AlertDialogContent` is `position: fixed` inside a
 * portal, so it is not a descendant of anything the story renders and a
 * `<div className="w-[375px]">` cannot reach it. The width class goes through
 * `className`, which is the same sanctioned test condition the convention
 * allows for the wrapper.
 *
 * **This measures the wide arrangement squeezed narrow, not the phone.** The
 * gate's chromium is 1200×900, so `sm:` still applies inside the 375px box:
 * the footer renders `flex-direction: row` with all four verbs side by side.
 * A real 375px viewport gets `flex-col-reverse` — the docs module's keyboard
 * note is about exactly that stack, where Allow once sits nearest the thumb
 * and the tab order still starts at Deny. So this story proves the stronger,
 * different claim (`story-conventions.md`, fact 2), and the phone's own
 * arrangement is not reachable from a story file.
 *
 * What it pins: no page-level horizontal scroll, all four verbs still
 * rendered, and — the one that matters on a gate — **no verb clipped by the
 * dialog's edge**, since a verb you cannot see is a verb you cannot press.
 *
 * **How little room is left, recorded because the assertion above cannot say
 * it.** Measured at 375px: Deny 56px, Always allow 106px, Edit first 78px,
 * Allow once 94px, plus three 8px gaps and the footer's own 32px of padding
 * comes to **389px of content in a 375px dialog**. The buttons are
 * `shrink-0 whitespace-nowrap` and the footer is `-mx-4` with no `flex-wrap`,
 * so the row cannot compress; the panel has no `overflow-hidden`, so what
 * gives is the footer bar itself, which paints **14px past the dialog's right
 * edge** (footer 413..802 against a panel 413..788) with its rounded corner
 * and its top border hanging outside the card. Allow once's own right edge
 * lands at 786 against the panel's 788 — **two pixels of margin** on the most
 * consequential control. German alone ("Immer erlauben", "Zuerst bearbeiten")
 * spends that several times over. Not asserted, because pinning today's
 * spill would pin the defect; the repair is `flex-wrap` on the footer, or the
 * narrow stack applied on container width rather than viewport width.
 */
export const Mobile: Story = {
  args: {
    action: "Send email to finance@example.com",
    reason: "The invoice PDF finished rendering.",
    args: EMAIL_ARGS,
    className: "w-[375px]",
  },
  play: async () => {
    const panel = document.querySelector<HTMLElement>('[data-slot="permission-prompt"]')!;
    const panelRect = panel.getBoundingClientRect();
    await expect(`panel=${Math.round(panelRect.width)}px`).toBe("panel=375px");

    // No sideways scroll at 375px on the page. (The panel's own `scrollWidth`
    // is structurally larger than its `clientWidth` in every story, because
    // `AlertDialogFooter` is `-mx-4` and bleeds into the panel's padding by
    // design — so a panel-level overflow check measures the bleed, not this
    // story's condition, and is not taken.)
    await expect(
      `page scrolls=${document.documentElement.scrollWidth > document.documentElement.clientWidth}`,
    ).toBe("page scrolls=false");

    // All four verbs are present and none is cut off by the panel's edge.
    const verbs = ["deny", "always-allow", "edit-first", "allow-once"].map(
      (name) => document.querySelector<HTMLElement>(`[data-slot="permission-prompt-${name}"]`)!,
    );
    await expect(verbs.filter(Boolean)).toHaveLength(4);
    for (const verb of verbs) {
      const rect = verb.getBoundingClientRect();
      await expect(
        `${verb.dataset.slot} inside=${rect.left >= panelRect.left && rect.right <= panelRect.right}`,
      ).toBe(`${verb.dataset.slot} inside=true`);
    }
  },
};

/**
 * Against F7 `approval-card`, the near-twin. Both hold work behind four verbs
 * in a fixed order, both keep every verb live while the decision is open, and
 * from a screenshot of the footer alone they are the same idea. F7's own
 * `Boundary` already states the rule from its side; this is the other half,
 * with the test made measurable.
 *
 * **The choosing rule is whether the work can continue while the question
 * stands.** F7 is a card in the flow: the artifact is elsewhere, the reader
 * can scroll past it, and Edit and Regenerate hand them back to it. N8 is an
 * alert dialog: it interrupts, because the agent is *paused* and nothing else
 * it might do is safe until this is answered. The play function measures that
 * difference rather than asserting it in prose — with the prompt open, the
 * approval card's four verbs are no longer in the accessibility tree at all,
 * so a screen-reader user genuinely cannot work around the question. If your
 * decision does not deserve that, it is an approval card.
 *
 * The verbs differ too, and in a way worth stating: F7's Skip declines *this
 * artifact*, and N8's Deny declines *the action* and reports the refusal back
 * to the agent. F7 has no equivalent of Always allow, because a standing grant
 * only means something for a repeated side effect.
 *
 * **Inward, and a finding rather than a rule.** The component's own rule 1 is
 * that Edit first carries equal visual weight with Allow once, and it holds —
 * both are `variant="default"`, measured byte-identical at
 * `background-color: oklch(0.205 0 0)`. But the same measurement shows the
 * other two are byte-identical to *each other*: **Deny and Always allow both
 * render `oklch(1 0 0)` on `oklch(0.922 0 0)`**, so the safest verb in the set
 * and the only one that writes a permanent permission are the same button
 * until you read the words. The four verbs paint as two pairs, and the pairing
 * groups "refuse" with "grant forever". A third treatment for the standing
 * grant is a design decision across the registry's button variants, so it is
 * recorded, not swept — and it is why the spec's insistence that the grant's
 * review-and-revoke surface lives in N9 `autonomy-selector` is load-bearing:
 * N9 is where a grant made by mistake here can be found again.
 */
export const Boundary: Story = {
  args: { open: undefined },
  render: (args) => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          F7 approval card — an artifact is held; the reader can scroll past it and come back
        </p>
        <ApprovalCard
          title="Send the Q3 summary to the team"
          summary="Three paragraphs drafted from last quarter's metrics, ready to post in #general."
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </section>

      <section className="flex flex-col items-start gap-2">
        <p className="text-foreground text-xs font-medium">
          N8 permission prompt — a side effect is paused; nothing else is safe until it is answered
        </p>
        <PermissionPrompt
          {...args}
          action="Send email to finance@example.com"
          reason="The invoice PDF finished rendering."
          args={EMAIL_ARGS}
          trigger={<button type="button">The agent wants to send an email</button>}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Both surfaces are reachable while only the card is on screen.
    for (const name of ["Confirm", "Edit", "Regenerate", "Skip"]) {
      await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
    }

    // Opening the prompt takes the card out of the accessibility tree
    // entirely: the interruption is the boundary, and it is measurable.
    await userEvent.click(canvas.getByRole("button", { name: /wants to send an email/ }));
    await body.findByRole("alertdialog");
    for (const name of ["Confirm", "Edit", "Regenerate", "Skip"]) {
      await expect(canvas.queryByRole("button", { name })).toBeNull();
    }
    for (const name of ["Deny", "Always allow", "Edit first", "Allow once"]) {
      await expect(body.getByRole("button", { name })).toBeInTheDocument();
    }

    // Leave the canvas as axe finds it easiest to read, and never hand it a
    // surface caught mid-dismissal.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(canvas.getByRole("button", { name: "Confirm" })).toBeVisible());
  },
};
