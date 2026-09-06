import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { TrustDialog } from "@/registry/super-ai/trust-dialog";
import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { TrustDialogDocs } from "@/content/components/trust-dialog.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof TrustDialog> = {
  title: "Super AI/Trust Dialog",
  component: TrustDialog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrustDialogDocs) } },
};

export default meta;
type Story = StoryObj<typeof TrustDialog>;

const TEMPLATE_PREVIEW = `{
  "name": "landing-page-starter",
  "postinstall": "curl -fsSL https://community-templates.example/setup.sh | sh",
  "permissions": ["filesystem:write", "network:fetch"]
}`;

const ACCOUNTS = [
  { id: "personal", name: "Personal", description: "Only you can see this" },
  { id: "acme", name: "Acme Corp", description: "Shared with 12 teammates" },
];

/** The preview always renders above the warning — never the reverse, never collapsed behind a toggle. */
export const Preview: Story = {
  args: {
    open: true,
    title: "Review before running",
    description: "A community template you haven't run before.",
    preview: TEMPLATE_PREVIEW,
  },
};

/** A specific warning, naming what this template can actually do — never the generic default softened into reassurance. */
export const Warning: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    warning: "This template can write to your filesystem and make network requests during install.",
  },
};

/** Continue starts disabled and only clears once the checkbox is ticked — shown here already ticked, since the other three stories all show it unchecked. */
export const TrustCheckbox: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    trustLabel: "I've reviewed this template and trust the source",
    defaultTrusted: true,
  },
};

/** Two or more accounts attach a destination picker directly to Continue — part of the same control, not a separate step. */
export const AccountPicker: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
  },
};

/*
 * Case stories — the situations this gate meets in a product.
 *
 * All eight are written and nothing is skipped, because all eight are true
 * here: the dialog has directional layout, animates, is made almost entirely of
 * focusables, exposes three controlled pairs, defaults seven text slots, takes
 * author-supplied copy in every one of them, and has two near-twins in the
 * catalog.
 *
 * One thing to know before reading any of them. The manifest gives this item
 * `cssVars: WARNING_CSS_VARS`, and `apps/storybook/src/index.css` defines
 * neither `--warning` nor `--color-warning`. Tailwind v4 emits nothing for an
 * undefined utility rather than failing, so the warning block's
 * `border-warning/40 bg-warning/5` and its `text-warning` icon render
 * **unpainted** in every story below — the border falls back to the vendored
 * Alert's own `border`, the tint is absent, and the icon inherits
 * `currentColor`. Every green axe pass in this file is therefore a pass on a
 * colourless warning, and says nothing about the contrast of the surface this
 * component ships to a consumer who installs the token. `CONTINUE.md` §8 and
 * `a11y-baseline.md` ("Gate hole") carry the mechanism and the six components
 * in this position.
 */

/**
 * A right-to-left rendering, which is the only place three physical decisions
 * inside this dialog become visible. `dir` goes on the document element rather
 * than a wrapper: an alert dialog portals to the end of `document.body`, so a
 * `<div dir="rtl">` in the canvas is never an ancestor of the thing under test
 * (`story-conventions.md`, mechanical fact 5's closing note; the `RtlDocument`
 * idiom is `account-menu`'s).
 *
 * The copy stays English, as it does in every other RTL story in this repo:
 * what is under test is the layout's direction, not a translation nobody here
 * can check.
 *
 * What mirrors, because it follows the DOM's own direction: the header, the
 * preview block, the checkbox row's `items-start gap-2.5`, and the footer's
 * `sm:justify-end`, which moves Cancel and Continue to the left edge.
 *
 * What does not, all of it in vendored primitives this component consumes and
 * does not own — measured here rather than read off a class list:
 *
 * - **`components/ui/button-group.tsx` joins its children physically.** The
 *   measurements are in the play function. Continue carries `rounded-r-none`
 *   and the Select trigger `rounded-l-none border-l-0`, so under RTL the square
 *   corners and the missing border land on the group's *outer* edges while the
 *   rounded pair meets at the seam — exactly inverted. Third measurement of
 *   this defect after E8 `generation-wizard` and K1 `ai-doc-block`; K1's
 *   narrowing holds here too, since Continue is `variant="default"` and its
 *   border is transparent, so what a reader sees is the radii.
 * - **`components/ui/alert.tsx` sets `text-left` on its root**, so the warning
 *   block's title and body stay left-aligned inside an otherwise mirrored
 *   dialog. Fifth vendored primitive in this class after switch, button-group,
 *   toggle-group and table.
 * - **`components/ui/alert-dialog.tsx`'s header carries
 *   `sm:group-data-[size=default]/alert-dialog-content:text-left`**, which
 *   applies at the gate's 1200px chromium, so the title and description are
 *   left-aligned too.
 *
 * None of the three is this component's to swap, and none is byte-identical in
 * LTR at a call site, so all three are recorded rather than fixed.
 */
export const RTL: Story = {
  args: {
    open: true,
    description: "A community template you haven't run before.",
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
  },
  render: (args) => (
    <RtlDocument>
      <TrustDialog {...args} />
    </RtlDocument>
  ),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog");
    await expect(getComputedStyle(dialog).direction).toBe("rtl");

    // The footer's logical `justify-end` follows direction: Cancel sits to the
    // right of the Continue group, which is what "end" means here.
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const group = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-continue-group"]')!;
    await expect(
      `cancel right of group: ${cancel.getBoundingClientRect().left > group.getBoundingClientRect().left}`,
    ).toBe("cancel right of group: true");

    // The button group does not mirror. Continue is the first child, so under
    // RTL it paints on the right — the group's outer edge — while carrying the
    // squared-off corners meant for the seam.
    const continueButton = within(dialog).getByRole("button", { name: "Continue" });
    const accountTrigger = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-account-trigger"]')!;
    const continueBox = continueButton.getBoundingClientRect();
    const triggerBox = accountTrigger.getBoundingClientRect();
    await expect(`continue right of trigger: ${continueBox.left > triggerBox.left}`).toBe(
      "continue right of trigger: true",
    );

    const continueStyle = getComputedStyle(continueButton);
    const triggerStyle = getComputedStyle(accountTrigger);
    // Outer edges square, seam rounded — the inverse of the intent.
    await expect(
      [
        `continue outer(right)=${continueStyle.borderTopRightRadius}`,
        `continue seam(left)=${continueStyle.borderTopLeftRadius}`,
        `trigger outer(left)=${triggerStyle.borderTopLeftRadius}`,
        `trigger seam(right)=${triggerStyle.borderTopRightRadius}`,
      ].join(" "),
    ).toBe(
      "continue outer(right)=0px continue seam(left)=10px trigger outer(left)=0px trigger seam(right)=10px",
    );
    // `border-l-0` strips the border from the group's visual outer edge here,
    // not from the seam it was written for.
    await expect(`trigger outer border=${triggerStyle.borderLeftWidth}`).toBe("trigger outer border=0px");

    // The vendored Alert pins its own text to the physical left.
    const warning = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-warning"]')!;
    await expect(`warning textAlign=${getComputedStyle(warning).textAlign}`).toBe("warning textAlign=left");

    // As does the vendored alert-dialog header at this viewport.
    const header = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-header"]')!;
    await expect(`header textAlign=${getComputedStyle(header).textAlign}`).toBe("header textAlign=left");
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
 * The reduced-motion branch, and the surface underneath it that still has none.
 *
 * The popup is the half a call site can reach, and this component now reaches
 * it: `AlertDialogContent`'s class string carries
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`,
 * the *restated* pair. A bare `motion-reduce:animate-none` is inert on a Base
 * UI popup — Tailwind compiles both sides to one class of specificity and emits
 * the plain variant first, so `animation-name` still reads `"enter"` under
 * emulated reduce (`story-conventions.md`, mechanical fact 3). The assertion
 * below reads the computed `animationName` back rather than trusting the class,
 * which is the only form of this assertion that can fail.
 *
 * **The backdrop was fading too, and no call site could have fixed it.** Wave 6
 * put the restated pair on `DialogOverlay`'s own class string in both copies of
 * `components/ui/dialog.tsx`. `components/ui/alert-dialog.tsx` is a separate
 * file and did not get it, and `AlertDialogContent` renders
 * `<AlertDialogOverlay />` with no `className` threaded through — no prop to
 * pass, no class to merge. Measured here under emulated reduce before the fix:
 * the popup read `animation-name: none` while the backdrop it sits on read
 * `enter`, `animation-duration: 0.1s`, `opacity: 0`, still mid-fade at the
 * moment of measurement. N8 `permission-prompt` measured the same values
 * independently in the same wave, after it had already fixed its own panel.
 * Fixed centrally in both copies of the primitive; it is shared by every alert
 * dialog in the registry — `permission-prompt`, `thread-list` and
 * `voice-clone-recorder` as well as this one — so the assertion below is a
 * regression guard for all four.
 *
 * **The account picker's popup cannot fail this assertion either way**, which
 * is worth saying rather than quietly leaving out. `components/ui/select.tsx`
 * defaults `alignItemWithTrigger` to `true` and the content carries
 * `data-[align-trigger=true]:animate-none`, so a default `SelectContent`
 * computes `animation-name: none` with or without any suppression at all (H1
 * `transport-controls` found this by watching the assertion pass before the fix
 * was applied). No claim is made about it here.
 *
 * Nothing else in the dialog moves. The vendored `Checkbox` crossfades a colour
 * (`transition-colors`) and its indicator is explicitly `transition-none`; the
 * vendored `Button`'s press nudge is a registry-wide posture recorded in
 * `CONTINUE.md` §8, not this component's to branch on.
 */
export const ReducedMotion: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog");

    // The claim, read back from the computed style rather than the class.
    await waitFor(() => expect(getComputedStyle(dialog).animationName).toBe("none"));

    // The backdrop, on the vendored primitive rather than on this component.
    // Guarded here because no call site can reach the overlay, so a revert in
    // `components/ui/alert-dialog.tsx` would be silent in all four consumers.
    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await waitFor(() => expect(getComputedStyle(overlay!).animationName).toBe("none"));
  },
};

/**
 * The keyboard contract, which on a consent surface is the whole contract: a
 * trust checkbox that cannot be reached or named from the keyboard is a consent
 * that was never given. E10 `voice-clone-recorder` walked the same shape in
 * wave 2 and left one finding explicitly addressed to "whoever owns the gate
 * shape that N2 `trust-dialog` shares with this one" — it is answered at the
 * bottom of this block.
 *
 * What it pins:
 *
 * 1. **The dialog is named.** Base UI renders the popup `role="alertdialog"`
 *    and takes its name from `AlertDialogTitle`, which this component always
 *    renders — so it is not in the class of unnamed popups the D/I wave found
 *    on bare `PopoverContent`s.
 * 2. **The checkbox's accessible name is the whole sentence.** It is named by
 *    the `<label>` that wraps it, so a screen-reader user hears what they are
 *    agreeing to rather than "checkbox".
 * 3. **Unchecked, the trap holds three stops; ticked, four.** Continue is
 *    genuinely `disabled` rather than dimmed, and disabled buttons are skipped,
 *    so the gate is a real change to the tab sequence and not a visual one.
 *    Both laps are walked as exactly one cycle each, so the counts are proofs
 *    rather than allowances. This is the docs module's keyboard claim,
 *    measured.
 * 4. **Every stop paints a focus treatment that focus itself caused.** Two
 *    checks, because they answer different questions: `settledFocusRing` waits
 *    for the vendored `Button`'s `transition-all` ring to arrive and asserts
 *    something is painted, and the differential (the next stop's signature read
 *    while focus is still on the previous one, the J5/J2 idiom) asserts focus
 *    is what painted it.
 * 5. **Focus returns to the trigger on Escape.** This story renders a trigger
 *    for exactly that reason: `voice-clone-recorder`'s consent dialog has none,
 *    so its focus falls to `<body>` on close and it could assert no
 *    destination. Here there is one, and it is asserted.
 *
 * Each read waits for focus to *leave* the stop it was on rather than for focus
 * to be on *some* expected stop. Inside a portal the weaker wait returns a
 * stale read and reports a lap that ended a row early — it passed thirteen warm
 * runs on `ai-tools-menu` and failed the first cold one (`story-conventions.md`
 * fact 4).
 *
 * **The gap, recorded and not pinned.** Continue becoming available is
 * imperceptible to a screen-reader user. While the box is unchecked the button
 * is absent from the tab order entirely, it carries no `aria-describedby` back
 * to the checkbox, and ticking the box announces the checkbox's own state and
 * nothing else — so the sequence is: read the sentence, tab, land on Cancel,
 * tab, land on a destination picker, with nothing saying a Continue button
 * exists or what would reveal it. The three-stop lap below is asserted because
 * it is *true*, not because it is right. The remedy is a design choice (an
 * `aria-describedby` from Continue to the checkbox, a live region, or an
 * enabled button that explains its refusal) and it is one decision across this
 * component and E10.
 */
export const KeyboardOrder: Story = {
  args: {
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
    trigger: <Button variant="outline">Run this template</Button>,
    trustLabel: "I've reviewed this template and trust the source",
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Run this template" });

    // One stop in the page before the gate opens.
    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await settledFocusRing(trigger, waitFor);

    await userEvent.keyboard("{Enter}");

    // 1. A named alertdialog, not an anonymous popup.
    const dialog = await body.findByRole("alertdialog", { name: "Review before running" });
    const scope = within(dialog);

    // 2. Named by the sentence a person has to agree to.
    const checkbox = scope.getByRole("checkbox", {
      name: "I've reviewed this template and trust the source",
    });
    const cancel = scope.getByRole("button", { name: "Cancel" });
    const continueButton = scope.getByRole("button", { name: "Continue" });
    const accountTrigger = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-account-trigger"]')!;

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `${el.getAttribute("role") ?? el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 24) ?? ""}"`;

    const settled = async (stops: HTMLElement[], previous?: HTMLElement) => {
      await waitFor(() => {
        const active = document.activeElement;
        if (!stops.includes(active as HTMLElement)) {
          throw new Error(`focus is not on an expected stop: ${nameOf(active)}`);
        }
        if (previous && active === previous) {
          throw new Error(`focus has not moved off ${nameOf(previous)} yet`);
        }
      });
      return document.activeElement as HTMLElement;
    };

    const walk = async (stops: HTMLElement[]) => {
      const start = await settled(stops);
      const seen = new Set<HTMLElement>([start]);
      let previous = start;
      for (let i = 1; i < stops.length; i += 1) {
        // The differential, taken on the stop focus is about to reach while it
        // is still unfocused. No blur, so the walk under test is undisturbed.
        const next = stops[(stops.indexOf(previous) + 1) % stops.length];
        const before = focusTreatmentSignature(next);

        await userEvent.tab();
        const focused = await settled(stops, previous);
        // The order is asserted rather than inferred, which is also what keeps
        // the differential below honest: were `next` ever the wrong element it
        // would silently compare a signature nobody focused.
        await expect(nameOf(focused)).toBe(nameOf(next));
        await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(
          `${nameOf(focused)} repeat=false`,
        );
        await expect(`${nameOf(focused)} focusVisible=${focused.matches(":focus-visible")}`).toBe(
          `${nameOf(focused)} focusVisible=true`,
        );
        // Something is painted…
        await settledFocusRing(focused, waitFor);
        // …and focus is what painted it.
        await waitFor(() =>
          expect(`${nameOf(focused)} changed=${focusTreatmentSignature(focused) !== before}`).toBe(
            `${nameOf(focused)} changed=true`,
          ),
        );
        seen.add(focused);
        previous = focused;
      }
      // The cycle closes: one more tab returns to where the lap began.
      await userEvent.tab();
      await expect(nameOf(await settled(stops, previous))).toBe(nameOf(start));
      return seen;
    };

    // 3a. Unchecked: Continue is disabled, so the trap holds three stops.
    await expect(continueButton).toBeDisabled();
    await expect((await walk([checkbox, cancel, accountTrigger])).size).toBe(3);

    // 3b. Tick the box from the keyboard, on the checkbox itself.
    await settled([checkbox]);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(continueButton).toBeEnabled());
    await expect((await walk([checkbox, cancel, continueButton, accountTrigger])).size).toBe(4);

    // 5. Escape closes the gate and hands focus back to the trigger.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * All three controlled pairs, driven from outside and refusing to move on their
 * own — which on a safety gate is the property that matters most. A host that
 * holds `trusted` at `false` holds the gate shut no matter what the person
 * clicks, and this story is where that is provable rather than asserted in
 * prose.
 *
 * What the play function pins, in order:
 *
 * - **`trusted` / `onTrustedChange`.** Clicking the checkbox does not tick it.
 *   The callback fires with `true` — the payload a consumer needs to apply the
 *   change — and because this render never applies it, the box comes back
 *   unchecked and Continue stays `disabled`. Re-rendering with the same
 *   `trusted={false}` holds it fixed.
 * - **`selectedAccountId` / `onAccountChange`.** Choosing the second account
 *   leaves the trigger reading the first, and the callback carries the id.
 * - **`open` / `onOpenChange`.** Escape reports the intent and the dialog stays
 *   on screen, because `open` is the host's. This is the same shape E10's
 *   consent dialog has and the reason its docs sentence about Escape "closing"
 *   the dialog was corrected: on a controlled gate, Escape only asks.
 *
 * One asymmetry worth knowing before you reach for these props, read off the
 * source rather than measured here. `trusted` and `open` are *optionally*
 * controlled — omit them and the component owns the state — but
 * `selectedAccountId` has no uncontrolled half at all: `currentAccount` is
 * `accounts.find(id === selectedAccountId) ?? accounts[0]`, with no state
 * behind it. So a caller who passes `accounts` and omits `selectedAccountId`
 * gets the first account pinned forever, and clicking a row reports through
 * `onAccountChange` while changing nothing on screen — the same rendering the
 * second half of this play function produces deliberately, except that this
 * caller chose it. A host reading the three props as one convention will be
 * caught by that.
 */
export const Controlled: Story = {
  args: {
    // A host that reads every change and applies none of them.
    open: true,
    trusted: false,
    selectedAccountId: "personal",
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    trustLabel: "I've reviewed this template and trust the source",
    onTrustedChange: fn(),
    onAccountChange: fn(),
    onOpenChange: fn(),
  },
  play: async ({ args }) => {
    const body = within(document.body);
    const spies = args as unknown as {
      onTrustedChange: ReturnType<typeof fn>;
      onAccountChange: ReturnType<typeof fn>;
      onOpenChange: ReturnType<typeof fn>;
    };
    const dialog = await body.findByRole("alertdialog");
    const scope = within(dialog);

    const checkbox = scope.getByRole("checkbox", {
      name: "I've reviewed this template and trust the source",
    });
    const continueButton = scope.getByRole("button", { name: "Continue" });

    // Interaction alone does not move the value.
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await waitFor(() => expect(spies.onTrustedChange).toHaveBeenCalledWith(true));
    await expect(checkbox).not.toBeChecked();
    await expect(continueButton).toBeDisabled();

    // Re-rendering with an unchanged `trusted` holds it fixed: a second click
    // reports again and still changes nothing.
    await userEvent.click(checkbox);
    await waitFor(() => expect(spies.onTrustedChange).toHaveBeenCalledTimes(2));
    await expect(checkbox).not.toBeChecked();
    await expect(continueButton).toBeDisabled();

    // The account picker, same shape. The trigger keeps reading the host's value.
    const accountTrigger = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-account-trigger"]')!;
    await expect(accountTrigger.textContent).toContain("Personal");
    await userEvent.click(accountTrigger);
    const listbox = await body.findByRole("listbox", { name: "Run in" });
    await userEvent.click(within(listbox).getByText("Acme Corp"));
    await waitFor(() => expect(spies.onAccountChange).toHaveBeenCalledWith("acme"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(accountTrigger.textContent).toContain("Personal");

    // `open` is the host's too: Escape reports and the gate stays. Base UI
    // hands a second argument the component does not forward or document — the
    // event details, whose `reason` is what separates an Escape from an outside
    // press. A host wanting to treat the two differently reads it from there.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(spies.onOpenChange).toHaveBeenCalled());
    const [openArg, details] = spies.onOpenChange.mock.calls[0] as [boolean, { reason?: string }];
    await expect(`open=${openArg} reason=${details?.reason}`).toBe("open=false reason=escape-key");
    await expect(body.queryByRole("alertdialog")).not.toBeNull();
  },
};

/**
 * This component defaults seven text slots, and emptying them splits cleanly in
 * two. What is rendered here is the half that degrades quietly. The other half
 * is a red gate, so it is measured and described rather than rendered — H4
 * `transcript-editor` handled its own red empty-string case the same way.
 *
 * **Emptied here, and silent.** `previewLabel=""` deletes a decorative caption
 * and leaves the preview box intact, because the box is not an ARIA anything
 * and had no name to lose. `warningTitle=""` with `warning=""` leaves the
 * `role="note"` block as an empty bordered rectangle containing only its icon —
 * strictly worse than the default copy, and a violation of nothing, since a
 * note is not required to have content. `description` omitted is the ordinary
 * case three of the four declared-state stories already render.
 *
 * `accountLabel=""` is the sharp one. The trigger's name is built as
 * `` `${accountLabel}: ${name}` ``, so emptying it does not fall back to a
 * default — it interpolates, and the destination control ends up accessibly
 * named `": Personal"`. Nothing catches a name that starts with a colon. Same
 * class as D3 `context-chips`, H7 `stem-mixer` and J7's collapses, and the
 * asserted line below is the measurement.
 *
 * **Measured, not rendered — four slots take a control's whole accessible name
 * with them.** Each was run through the gate in this file before being removed
 * from the args, and between them they raise five violations under axe 4.12:
 *
 * - `trustLabel=""` empties the `<span>` inside the `<label>` that names the
 *   checkbox. Base UI renders the box as `<span role="checkbox">` with
 *   `aria-labelledby` pointing at that now-empty label, so the rule is
 *   **`aria-toggle-field-name`**, not `label`. On a consent surface it is the
 *   worst one available: the box still ticks, and nothing says what was agreed
 *   to.
 * - `title=""` empties `AlertDialogTitle`, which is both the popup's
 *   `aria-labelledby` target and an `<h2>` — so it raises two,
 *   **`aria-dialog-name`** and **`empty-heading`**.
 * - `continueLabel=""` and `cancelLabel=""` each leave a button with no
 *   discernible text — **`button-name`**, one each.
 *
 * None of the four falls back; each renders exactly what it was handed, because
 * the defaults are default *parameters* and `""` is a value. The fix is the same
 * in all four places (`trustLabel || DEFAULT`), but changing what a caller's
 * `""` means is an API decision rather than a drift correction, so it is
 * recorded here and in `CONTINUE.md` §8 rather than swept.
 */
export const EmptyLabel: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    previewLabel: "",
    warningTitle: "",
    warning: "",
    accountLabel: "",
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog", { name: "Review before running" });

    // The preview survives its caption being deleted.
    const preview = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-preview-content"]')!;
    await expect(preview.textContent).toContain("landing-page-starter");

    // The warning note is now an empty bordered box with an icon in it.
    const warning = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-warning"]')!;
    await expect(warning.textContent?.trim()).toBe("");
    await expect(warning.getAttribute("role")).toBe("note");

    // The account trigger does not fall back — it interpolates the empty string.
    const accountTrigger = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-account-trigger"]')!;
    await expect(accountTrigger.getAttribute("aria-label")).toBe(": Personal");

    // The two names that are not optional are still there, which is what makes
    // the four unrenderable cases above a matter of the slot rather than of the
    // component.
    await expect(
      within(dialog).getByRole("checkbox", {
        name: "I've reviewed this and trust the source",
      }),
    ).toBeInTheDocument();
    await expect(within(dialog).getByRole("button", { name: "Continue" })).toBeInTheDocument();
  },
};

/**
 * Author-supplied copy at ~90 characters in every slot that takes it. The
 * decision this component makes about prose is **wrap, never clip**: the title,
 * description, warning and trust sentence all grow the dialog downward and stay
 * fully readable, which on a consent surface is the right default — the
 * sentence a person agrees to must not be truncated.
 *
 * The decision it makes about *the footer* is where this story earns its place.
 *
 * - **The preview scrolls, and cannot be scrolled from the keyboard.**
 *   `max-h-40 overflow-auto` caps it at 160px. The docs module already records
 *   the consequence; this is the measurement behind it: the container has no
 *   `tabIndex`, no role and no name, and nothing inside it is focusable, so
 *   past the cap the content the gate exists to make people read is mouse-only.
 *   That is axe's `scrollable-region-focusable` shape, and it would be the
 *   registry's fourth after L5 `shortcuts-sheet`, P1 `data-views`' kanban board
 *   and `components/ui/table.tsx`. This story deliberately keeps its preview
 *   under the cap, because rendering the overflowing case would fail the gate on
 *   a defect the story invented rather than found; the cap and the absence of
 *   any focusable are asserted instead, so the claim stays checkable.
 *
 * - **A long account name pushes the footer out of the dialog. Measured, and
 *   recorded rather than pinned.** `button-group.tsx` gives a select trigger
 *   `w-fit` and the vendored trigger is `whitespace-nowrap`, so the trigger
 *   takes its content's width without limit. With the 58-character workspace
 *   name in these args: the popup is 384px wide, the account trigger alone is
 *   439px, Continue is another 223px, and the dialog's `scrollWidth` is 768px
 *   against a `clientWidth` of 384 — the Continue group spills 384px past the
 *   rounded box it is supposed to sit in. Nothing catches it: the popup sets no
 *   `overflow`, so there is no scroll container for axe to flag, and the
 *   content simply paints outside.
 *
 *   The `entity-row` inside each option *does* carry truncation — asserted
 *   below as `white-space: nowrap`, `overflow: hidden`, `text-overflow:
 *   ellipsis`, one 20px line — and it never engages, because
 *   `SelectContent` is `w-(--anchor-width)` and the anchor is the same
 *   over-wide trigger. The mechanism that would have saved the row is sized by
 *   the thing that broke it.
 *
 * One smaller thing found while measuring the above, since it changes what the
 * numbers mean: **this component's own `sm:max-w-md` never applies.** The
 * vendored popup carries `data-[size=default]:sm:max-w-sm`, whose attribute
 * selector outranks a plain `sm:` utility at equal media query, and
 * tailwind-merge keeps both because the modifiers differ. Every dialog in this
 * file therefore renders at 384px rather than the 448px the class asks for.
 */
export const LongContent: Story = {
  args: {
    open: true,
    title: "Review this community template before it runs anything on your machine",
    description:
      "Published by an account you have not installed from before, and not reviewed by anyone on your team.",
    previewLabel: "What this template will run during installation, in full",
    preview: "postinstall: curl -fsSL https://community-templates.example/setup.sh | sh --profile release",
    warningTitle: "This is third-party content and it has not been reviewed by anyone",
    warning: "It can write anywhere in your project directory and make network requests while installing.",
    trustLabel: "I have read what this template will run, and I trust the account that published it",
    continueLabel: "Continue and run the template",
    accounts: [
      {
        id: "personal",
        name: "Personal workspace for prototypes and one-off template runs",
        description: "Only you can see anything that this template creates or changes here",
      },
      { id: "acme", name: "Acme Corp", description: "Shared with 12 teammates" },
    ],
    selectedAccountId: "personal",
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog");

    // The trust sentence wraps rather than clipping — the whole of it is there.
    const label = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-checkbox-row"]')!;
    await expect(label.textContent).toContain("I trust the account that published it");
    await expect(label.scrollHeight).toBeLessThanOrEqual(label.clientHeight);

    // The preview is capped at 160px and this content stays under the cap, so
    // the keyboard-unreachable scroll container is documented, not rendered.
    const preview = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-preview-content"]')!;
    const previewStyle = getComputedStyle(preview);
    await expect(`${previewStyle.maxHeight} / ${previewStyle.overflowY}`).toBe("160px / auto");
    await expect(`preview overflows: ${preview.scrollHeight > preview.clientHeight}`).toBe(
      "preview overflows: false",
    );
    // And it is unreachable if it ever does: no stop of its own, none inside.
    await expect(preview.getAttribute("tabindex")).toBeNull();
    await expect(preview.querySelector("button, a[href], input, [tabindex]")).toBeNull();

    // The Continue label does not wrap.
    const continueButton = within(dialog).getByRole("button", {
      name: "Continue and run the template",
    });
    await expect(getComputedStyle(continueButton).whiteSpace).toBe("nowrap");

    // The account rows are configured to truncate rather than wrap, measured in
    // the popup because that is the only place they render. The popup is closed
    // again before this play returns, and the close is waited on: a popup still
    // fading out is a moving target for the axe scan that follows.
    const accountTrigger = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-account-trigger"]')!;
    await expect(getComputedStyle(accountTrigger).whiteSpace).toBe("nowrap");
    await userEvent.click(accountTrigger);
    const listbox = await body.findByRole("listbox", { name: "Run in" });
    // The row has truncation configured — one line, hidden overflow, ellipsis —
    // which is the stable claim. Whether it ever engages is the recorded part.
    const rowTitle = within(listbox).getByText(/^Personal workspace/);
    const rowStyle = getComputedStyle(rowTitle);
    await expect(
      `${rowStyle.whiteSpace} ${rowStyle.overflow} ${rowStyle.textOverflow} h=${Math.round(rowTitle.getBoundingClientRect().height)}`,
    ).toBe("nowrap hidden ellipsis h=20");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

/**
 * 375px. The usual `<div className="w-[375px]">` wrapper is a no-op twice over
 * here — the dialog portals out of the canvas, and it is `position: fixed`, so
 * it measures against the viewport rather than any ancestor. Width has to
 * arrive through `className`, which this component forwards to
 * `AlertDialogContent`, where tailwind-merge resolves it against the popup's
 * own `w-full`. `shortcuts-sheet` established the idiom on the same primitive
 * family. The dialog's max-width does not enter into it: as `LongContent`
 * records, the popup renders at the vendored `sm:max-w-sm`'s 384px rather than
 * this component's requested 448px, and neither clamps 375.
 *
 * The gate's chromium is 1200×900, so `sm:` still applies inside the 375px box
 * (`story-conventions.md`, mechanical fact 2): the footer keeps its
 * `sm:flex-row sm:justify-end` row rather than the phone's stacked
 * `flex-col-reverse`. That makes this the *harder* case, not the phone case —
 * Cancel, Continue and the account picker share one 375px line — and it is
 * where the footer is under most pressure.
 *
 * What it keeps true: nothing scrolls sideways. The preview's own
 * `overflow-auto` is the one horizontal scroller in the dialog and it is
 * measured to be idle at this width. The footer is the thing at risk, so it is
 * measured directly against the popup rather than against the story's frame —
 * `layout: "centered"` wraps every story, so `canvasElement.firstElementChild`
 * is the centring div and an overflow assertion against it passes for the wrong
 * reason (E7 `member-gate-row`; here the popup is not even inside it).
 */
export const Mobile: Story = {
  args: {
    open: true,
    preview: TEMPLATE_PREVIEW,
    accounts: ACCOUNTS,
    selectedAccountId: "personal",
    className: "w-[375px] max-w-full",
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog");

    await expect(Math.round(dialog.getBoundingClientRect().width)).toBe(375);
    await expect(`popup scrolls sideways: ${dialog.scrollWidth > dialog.clientWidth}`).toBe(
      "popup scrolls sideways: false",
    );

    // The footer keeps a single row at this width, so the three controls share
    // 375px minus padding rather than stacking.
    const footer = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-footer"]')!;
    await expect(getComputedStyle(footer).flexDirection).toBe("row");
    await expect(`footer scrolls sideways: ${footer.scrollWidth > footer.clientWidth}`).toBe(
      "footer scrolls sideways: false",
    );

    const preview = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-preview-content"]')!;
    await expect(`preview scrolls sideways: ${preview.scrollWidth > preview.clientWidth}`).toBe(
      "preview scrolls sideways: false",
    );
  },
};

/**
 * The three surfaces in this registry that ask a person to approve something,
 * and the rule for choosing between them is **who proposed it and whether
 * anything can proceed without an answer.**
 *
 * - **Trust dialog** gates content *the user chose to run* — a template, a
 *   shared automation, a pasted script. The decision is about provenance, the
 *   thing being decided can be read in full before deciding, and the gate is a
 *   checkbox rather than a verb because there is only one way forward.
 * - **N8 `permission-prompt`** gates an action *the agent proposed* mid-run.
 *   Four verbs, not one, because denying is a real outcome and editing first is
 *   a better one; the run is paused behind it.
 * - **F7 `approval-card`** is the same four verbs with the modality removed: it
 *   sits inline in the stream, other work continues around it, and it can be
 *   left unanswered. If the decision can wait, it is a card.
 *
 * The short form: one checkbox and one way forward means a trust dialog; four
 * verbs on a paused agent means a permission prompt; four verbs that can wait
 * means an approval card.
 *
 * The modality is not a styling choice, and the play function measures what it
 * actually costs: while the dialog is up, the whole canvas behind it — the
 * approval card and its four verbs included — is `aria-hidden="true"` and
 * marked `data-base-ui-inert`, so those controls leave the accessibility tree
 * entirely. That is the difference between "answer this now" and "answer this
 * when you like", stated in the DOM rather than in prose.
 *
 * **A rendering assumption that did not survive being measured.** N8
 * `permission-prompt` is left out because two alert dialogs open at once would
 * be two focus traps fighting, which is a story artefact rather than a fact
 * about either component. But the *card* was going to be left out for the same
 * reason L5 `shortcuts-sheet` gives — that focusable controls inside an
 * `aria-hidden` subtree would manufacture an `aria-hidden-focus` violation the
 * story invented — and that turns out not to happen here. Measured: the canvas
 * is `aria-hidden="true"` with `data-base-ui-inert` and **no** real `inert`
 * attribute (`element.inert === false`), and axe 4.12.1 raises nothing, because
 * `aria-hidden-focus` carries a `focusable-modal-open` check that exempts
 * anything sitting behind an open modal. So both surfaces render live, which is
 * the comparison this story is for.
 */
export const Boundary: Story = {
  args: { open: true, preview: TEMPLATE_PREVIEW },
  render: (args) => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Approval card — four verbs, inline, and it can wait
        </p>
        <ApprovalCard
          title="Send the Q3 invoice to finance"
          summary="Drafted from the thread, ready to send."
          detail="to: finance@example.com · subject: Q3 invoice, ready for review"
          onConfirm={() => {}}
          onEdit={() => {}}
          onRegenerate={() => {}}
          onSkip={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Trust dialog — one checkbox, modal, and the content is the user&apos;s own choice
        </p>
        <TrustDialog {...args} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await body.findByRole("alertdialog", { name: "Review before running" });

    // The inline neighbour offers four verbs. They are read off the DOM rather
    // than by role, which is itself the point: see the next assertion.
    const cardVerbs = Array.from(canvasElement.querySelectorAll("button"))
      .map((button) => button.textContent?.trim())
      .filter((text) => ["Confirm", "Edit", "Regenerate", "Skip"].includes(text ?? ""));
    await expect(cardVerbs.sort()).toEqual(["Confirm", "Edit", "Regenerate", "Skip"]);

    // Modality, measured: the card is out of the accessibility tree while the
    // gate is up, so none of those four verbs is reachable by role.
    const hiddenAncestor = canvasElement.querySelector("button")!.closest("[aria-hidden]");
    await expect(
      `aria-hidden=${hiddenAncestor?.getAttribute("aria-hidden")} base-ui-inert=${hiddenAncestor?.hasAttribute("data-base-ui-inert")}`,
    ).toBe("aria-hidden=true base-ui-inert=true");
    await expect(within(canvasElement).queryByRole("button", { name: "Confirm" })).toBeNull();

    // One way forward, and it is shut until the box is ticked — against the
    // card's four, all of which are live the moment it renders.
    await expect(within(dialog).getByRole("button", { name: "Continue" })).toBeDisabled();
    await expect(within(dialog).getAllByRole("checkbox")).toHaveLength(1);

    // And the thing being decided is readable in full before deciding, which is
    // what separates this from a prompt about an action nobody has seen yet.
    const preview = dialog.querySelector<HTMLElement>('[data-slot="trust-dialog-preview-content"]')!;
    await expect(preview.textContent).toContain("landing-page-starter");
  },
};
