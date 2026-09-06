import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ConnectionManager } from "@/registry/super-ai/connection-manager";
import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";
import { EnvStatus } from "@/registry/super-ai/env-status";
import { EnvStatusDocs } from "@/content/components/env-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are real provider and model identifiers — the strings a host
 * polling reachability would actually be holding. Nothing here is an invented
 * vendor.
 */
const LONG_PROVIDER_NAME =
  "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo — Together AI, us-east-1 dedicated endpoint";
const LONG_CHECKED_AT = "Checked 2 minutes ago · last successful response 47 minutes ago";

/**
 * One list of provider identities, shared by `Boundary` between the runtime
 * surface and the configuration surface. It exists as a single constant on
 * purpose: the spec's rule is that the two must not be able to disagree about
 * a provider's identity, and the only way to demonstrate that is to drive both
 * from the same array rather than from two hand-written ones.
 */
const SHARED_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "llama-local", name: "Llama 3.1 8B (local)" },
] as const;

const meta: Meta<typeof EnvStatus> = {
  title: "Super AI/Env Status",
  component: EnvStatus,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EnvStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof EnvStatus>;

/** Reachable. Nothing to do — the remedy for the state where nothing is wrong. */
export const Ok: Story = {
  args: {
    label: "Model providers",
    providers: [{ id: "openai", name: "OpenAI", state: "ok", checkedAt: "Checked 30 seconds ago" }],
  },
};

/**
 * Slower than usual, but succeeding. The remedy is to wait — never to touch a credential.
 *
 * **This state has never actually been measured, and a green axe pass here is
 * not evidence about it.** `degraded` is the one state drawn entirely in
 * `--warning`: `border-warning/40` on the row and `text-warning` on both the
 * icon and the badge. That token is defined in `apps/docs/app/globals.css` and
 * in *neither* the `@theme inline` block nor the `:root` block of
 * `apps/storybook/src/index.css`, and Tailwind v4 emits no rule at all for a
 * utility whose theme key does not exist rather than failing. So under the gate
 * that renders every story in this file, all three warning classes are dead
 * text in a `class` attribute.
 *
 * Measured in this file's own gate run, reading `getComputedStyle` off the LTR
 * half of the four-state list `RTL` renders, with `key-invalid` as the control
 * that proves the probe works:
 *
 * | | border | badge text | icon |
 * | --- | --- | --- | --- |
 * | `ok` (untinted) | `oklch(0.922 0 0)` | `oklch(0.205 0 0)` | `oklch(0.145 0 0)` |
 * | `degraded` | `oklch(0.922 0 0)` | `oklch(0.145 0 0)` | `oklch(0.556 0 0)` |
 * | `key-invalid` | `oklab(0.577 0.218 0.112 / 0.4)` | `oklch(1 0 0)` | `oklch(0.577 0.245 27.325)` |
 *
 * The degraded border is byte-identical to the row with no tone class at all,
 * while `border-destructive/40` on the next row resolves in the same paint — so
 * the token is missing rather than the measurement being wrong.
 *
 * The icon is the sharpest reading. `text-warning` not resolving does not leave
 * the glyph at the foreground colour: it falls through to
 * `entity-row-icon`'s own `text-muted-foreground`, `oklch(0.556 0 0)` — the
 * same grey as the timestamp beneath it. So under this gate the one state that
 * is supposed to draw attention renders *less* emphasised than `ok` and
 * `not-running`, which both resolve `text-foreground` at `oklch(0.145 0 0)`.
 * That is the same inversion `credits-indicator`'s `low` story records, reached
 * through a different fallback.
 *
 * Nothing here says the shipped colour is safe either. Where `--warning` does
 * resolve, in the docs app, `text-warning` on the page background measures
 * about 2.2:1 against a 4.5:1 minimum — so the axe pass on this story is
 * evidence about the fallback grey and about nothing else.
 *
 * What survives the hole is the reason the component is built this way: the
 * badge word "Degraded" and both sentences below the row are real text, so the
 * state still reads correctly with every warning class inert. Under this gate
 * the words are not the belt-and-braces channel — they are the only one that
 * works, which is why `RTL` pins the four badge words rather than any colour.
 *
 * Recorded rather than repaired. Defining `--warning` in the Storybook
 * stylesheet turns several components red at once and picking its value is a
 * design decision — `a11y-baseline.md`, "Gate hole", and `CONTINUE.md` §8.
 */
export const Degraded: Story = {
  args: {
    label: "Model providers",
    providers: [{ id: "anthropic", name: "Anthropic", state: "degraded", checkedAt: "Checked just now" }],
  },
};

/** The provider answered and rejected the credential — the user's problem to fix. */
export const KeyInvalid: Story = {
  args: {
    label: "Model providers",
    providers: [
      { id: "replicate", name: "Replicate", state: "key-invalid", checkedAt: "Checked 2 minutes ago" },
    ],
  },
};

/** Nothing answered — no local runtime is up. The remedy is to start it locally. */
export const NotRunning: Story = {
  args: {
    label: "Model providers",
    providers: [
      { id: "llama", name: "Llama 3.1 8B (local)", state: "not-running", checkedAt: "Checked 1 minute ago" },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply, and why the three missing here are missing.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the rendered tree moves; the one animation-capable class belongs to a vendored primitive and never fires here
 * `grep -nE "animate-|transition-" apps/docs/registry/super-ai/env-status.tsx`
 * returns nothing: the file has no `animate-*` and no `transition-*` class at
 * all. The two composed pieces were read rather than assumed. `entity-row`'s
 * only motion is `transition-colors`, and it is gated on `interactive` —
 * `typeof onSelect === "function"` — which `EnvStatus` never satisfies, because
 * it passes no `onSelect` on purpose (the source's own comment says so: an
 * informational row, never a button). The vendored `Badge` does carry
 * `transition-all` in its base string, but its only transitioning declarations
 * are `[a]:hover:*` variants and a `focus-visible` ring; this badge is rendered
 * as a `<span>` with no `render` prop and no focusability, so neither variant
 * can ever match and nothing transitions. Since `vitest.config.ts` already
 * forces `reducedMotion: "reduce"` on every test, a ReducedMotion story here
 * would be pixel-identical to `Degraded` and would imply a branch that does not
 * exist. The `transition-all` on the vendored `Badge` is the registry-wide
 * primitive posture CONTINUE.md §8 records, not this component's to fix.
 *
 * // case-skip: KeyboardOrder — the component renders zero focusable elements, and `Boundary` asserts that rather than leaving it a claim
 * Every row composes `entity-row` without `onSelect`, so each renders as a
 * `div` rather than a `button`; the badge is a `<span>`; the condition and
 * remedy are `<p>`s; the list is a plain `ul`/`li`. There is no `tabIndex`
 * anywhere in the file. A KeyboardOrder story would have no stops to walk and
 * no focus treatment to check. The claim is checkable rather than asserted
 * here: `Boundary`'s play counts
 * `button, a[href], input, textarea, select, [tabindex]` inside the
 * `env-status` subtree and requires zero, in the same render where
 * `connection-manager` contributes several — which is the actual difference
 * between the two surfaces. The consequence is recorded in the docs page's
 * keyboard notes and is not a defect: the remedies are instructions, so the
 * control that acts on one has to live outside this component.
 *
 * // case-skip: Controlled — there is no value/onChange pair, and no callback of any kind
 * `EnvStatusProps` is `label`, `providers` and the div props it spreads;
 * `grep -n "on[A-Z]" apps/docs/registry/super-ai/env-status.tsx` returns
 * nothing, so unlike the six wave-1 skips there is not even an intent callback
 * to argue about. The file contains no `useState` and no `useRef`: every row is
 * a pure render of the `state` string a host hands it, and the docs page states
 * the same rule from the other side (the component never fetches and holds no
 * timer). With no held value and no change event, the convention's three
 * assertions — that interaction does not move the rendered value, that the
 * callback carries a payload, that an unchanged `value` holds it fixed — have
 * no subject.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with all four states in one list so the tinted rows and the
 * untinted ones mirror together.
 *
 * A wrapper `<div dir="rtl">` is enough here, and that is worth saying because
 * the convention's usual caveat does not apply: this component portals nothing
 * — no dialog, popover or menu — so there is no subtree outside the wrapper for
 * `dir` to miss. It also mounts no Base UI composite, so the missing
 * `DirectionProvider` recorded in `CONTINUE.md` §8 costs it nothing; there are
 * no arrow keys here to travel the wrong way.
 *
 * The mirror is clean, and the reason is that there is nothing to mirror
 * badly. `grep -nE "pl-|pr-|ml-|mr-|border-l|border-r|text-left|text-right|left-|right-"`
 * over `env-status.tsx` returns nothing: every box is `flex`, `gap-*`, `px-*`
 * or `py-*`, all of which flip on their own, and `entity-row` already carries
 * the sanctioned `text-start`. So the logical-property sweep in `CONTINUE.md`
 * §8 has nothing to swap in this file. The play asserts the flip rather than
 * trusting it — the status icon leads the row and the badge trails it, in both
 * directions.
 *
 * **What does not mirror is the prose, and the component has no say in it.**
 * `STATE_CONDITIONS` is a table of English sentences compiled into the source,
 * so an Arabic or Hebrew host gets a right-to-left row whose condition and
 * remedy are still English — there is no prop to localise them through. The
 * caller-supplied halves have a smaller version of the same problem: `name`
 * and `checkedAt` reach `entity-row`'s title and description as bare strings
 * with no `<bdi>` and no `dir` isolation, so a mixed-script provider name
 * reorders around its own neutrals, the way `context-chips` and `quote-reply`
 * already record for their caller-supplied text. Recorded, not asserted.
 */
export const RTL: Story = {
  render: () => {
    const providers = [
      { id: "openai", name: "OpenAI", state: "ok" as const, checkedAt: "Checked 30 seconds ago" },
      { id: "anthropic", name: "Anthropic", state: "degraded" as const, checkedAt: "Checked just now" },
      {
        id: "replicate",
        name: "Replicate",
        state: "key-invalid" as const,
        checkedAt: "Checked 2 minutes ago",
      },
      {
        id: "llama-local",
        name: "Llama 3.1 8B (local)",
        state: "not-running" as const,
        checkedAt: "Checked 1 minute ago",
      },
    ];

    return (
      <div className="flex flex-col gap-6">
        <section data-testid="rtl" dir="rtl">
          <EnvStatus label="حالة المزودين" providers={providers} />
        </section>
        <section data-testid="ltr" dir="ltr">
          <EnvStatus label="Provider status" providers={providers} />
        </section>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const leadsWithIcon = (scope: string, id: string) => {
      const row = canvasElement.querySelector<HTMLElement>(
        `[data-testid="${scope}"] [data-provider-id="${id}"]`,
      )!;
      const icon = row.querySelector<HTMLElement>('[data-slot="entity-row-icon"]')!;
      const badge = row.querySelector<HTMLElement>('[data-slot="env-status-badge"]')!;
      return icon.getBoundingClientRect().left > badge.getBoundingClientRect().left;
    };

    // The status icon leads the row and the badge trails it. Under RTL "leads"
    // means the icon sits to the right of the badge; under LTR, to its left.
    for (const id of ["openai", "anthropic", "replicate", "llama-local"]) {
      await expect(`rtl ${id} icon after badge=${leadsWithIcon("rtl", id)}`).toBe(
        `rtl ${id} icon after badge=true`,
      );
      await expect(`ltr ${id} icon after badge=${leadsWithIcon("ltr", id)}`).toBe(
        `ltr ${id} icon after badge=false`,
      );
    }

    // Neither direction scrolls sideways: nothing in the tree is positioned.
    const rtl = canvasElement.querySelector<HTMLElement>('[data-testid="rtl"]')!;
    await expect(`rtl overflows=${rtl.scrollWidth > rtl.clientWidth}`).toBe("rtl overflows=false");

    // The four states are still told apart by their words, whichever of the two
    // tone tokens happens to resolve in the app rendering them. This is the
    // claim that survives the `--warning` gate hole `Degraded`'s description
    // measures, so it is the one worth pinning.
    const badgeWords = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-testid="rtl"] [data-slot="env-status-badge"]'),
    ).map((badge) => badge.textContent);
    await expect(`rtl badge words=${JSON.stringify(badgeWords)}`).toBe(
      'rtl badge words=["Ok","Degraded","Key invalid","Not running"]',
    );
  },
};

/**
 * The optional and empty-string text slots, all in one render, because they
 * fail in three different ways and only one of them is loud.
 *
 * - **Row 1 omits `checkedAt`.** The clean case: `entity-row` renders no
 *   description element at all rather than an empty one, and the row keeps its
 *   `min-h-14` so it does not sit shorter than its neighbours. Asserted.
 * - **Row 2 passes `name: ""`.** The row still states its condition, its remedy
 *   and its badge word, and names no provider — so the reader is told a key was
 *   rejected without being told whose. `entity-row`'s title is a plain `<span>`
 *   inside a `<div>`, so no name computation happens and **no axe rule fires**;
 *   this story is green with the defect in it. Same silent shape as J4
 *   `artifact-grid`'s empty session label, and the opposite of J1
 *   `asset-library`, where an empty string is a red gate. `name` is typed
 *   `string` rather than optional, so this is a caller passing through a value
 *   that has not loaded yet, not someone opting out of a heading.
 * - **The list passes `label: ""`.** The heading is a bare `<span>` with a
 *   default of "Provider status", so an empty string defeats the default and
 *   leaves a zero-height element that the parent's `gap-3` still spaces around.
 *   The docs page already records that the heading is not wired to the list, so
 *   there is no accessible name to lose here — but there is also nothing left
 *   saying what the list is about. Asserted as measured, not as correct.
 *
 * The one optional slot that is not text is `icon`, which overrides the
 * per-state glyph; row 3 uses it. It is `aria-hidden` either way, so an
 * override cannot add or remove meaning — which is the point of the component's
 * second rule.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div data-testid="empty-label" className="flex flex-col gap-6">
      <EnvStatus
        label=""
        providers={[
          { id: "openai", name: "OpenAI", state: "ok" },
          { id: "replicate", name: "", state: "key-invalid", checkedAt: "Checked 2 minutes ago" },
          {
            id: "llama-local",
            name: "Llama 3.1 8B (local)",
            state: "not-running",
            icon: (
              <span aria-hidden className="text-xs">
                ■
              </span>
            ),
            checkedAt: "Checked 1 minute ago",
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="env-status"]')!;

    // The heading survives as an empty box rather than being dropped, so the
    // list keeps a gap where its title used to be.
    const heading = root.firstElementChild as HTMLElement;
    await expect(`heading text=${JSON.stringify(heading.textContent)}`).toBe('heading text=""');
    await expect(`heading height=${heading.getBoundingClientRect().height}`).toBe("heading height=0");

    // Omitting `checkedAt` removes the description element entirely.
    const ok = root.querySelector<HTMLElement>('[data-provider-id="openai"]')!;
    await expect(
      `ok description nodes=${ok.querySelectorAll('[data-slot="entity-row-description"]').length}`,
    ).toBe("ok description nodes=0");

    // ...and the row is still full height, so a description-less row does not
    // read as a different kind of row.
    const okRow = ok.querySelector<HTMLElement>('[data-slot="entity-row"]')!;
    await expect(`ok row min height ok=${okRow.getBoundingClientRect().height >= 56}`).toBe(
      "ok row min height ok=true",
    );

    // The empty-name row: no subject, full verdict. Both halves measured.
    const nameless = root.querySelector<HTMLElement>('[data-provider-id="replicate"]')!;
    const title = nameless.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(`nameless title=${JSON.stringify(title.textContent)}`).toBe('nameless title=""');
    await expect(
      `nameless badge=${nameless.querySelector('[data-slot="env-status-badge"]')?.textContent}`,
    ).toBe("nameless badge=Key invalid");
    await expect(
      `nameless states a condition=${
        (nameless.querySelector('[data-slot="env-status-condition"]')?.textContent ?? "").length > 0
      }`,
    ).toBe("nameless states a condition=true");
  },
};

/**
 * A ~88-character model id and a two-clause `checkedAt`, which is roughly what
 * a host that names an endpoint alongside a model actually holds.
 *
 * `entity-row` puts `truncate` on both slots, but at this component's own
 * `max-w-xl` only one of them bites, and the measurement is worth having
 * because the obvious guess is wrong. The 88-character model id is cut. The
 * 63-character `checkedAt` is not: at `text-xs` it still fits the row, so the
 * "last successful response" clause survives here and disappears only when the
 * column narrows — `Mobile` renders the same string at 375px and asserts the
 * cut there. So the description's truncation is a phone-width fact, not a
 * long-string fact.
 *
 * Neither cut is recoverable. No `title` attribute is set on either slot, so a
 * mouse user has no way to read what was removed; the full string does stay in
 * `textContent`, so a screen-reader user hears all of it. Sighted-user-only
 * loss, the same asymmetry `quote-reply` records for its clamp and
 * `context-chips` records for its missing `title`.
 *
 * **The twin makes a different choice with the same primitive, and that is
 * worth knowing before a host pairs them.** `connection-manager` passes
 * `[&_[data-slot=entity-row-description]]:whitespace-normal` into `entity-row`
 * so its fingerprint-and-test-time line can wrap; `env-status` passes nothing.
 * Because the cut only appears at narrow widths, the two surfaces agree on a
 * desktop column and diverge on a phone — the configuration surface wraps the
 * timestamp onto a second line where the runtime surface silently drops the end
 * of it. Recorded rather than swept: adding the override changes row geometry
 * for every consumer, which is a design decision.
 *
 * The list heading is the one slot with no limit — a `<span>` blockified as a
 * flex item, so a long label wraps and grows the block instead of being cut.
 * The condition and remedy sentences are compiled-in constants and cannot grow
 * at all, which is why the states stay readable however long a name gets.
 */
export const LongContent: Story = {
  args: {
    label: "Model providers configured for this workspace, checked every 30 seconds",
    providers: [
      {
        id: "together-llama-70b",
        name: LONG_PROVIDER_NAME,
        state: "degraded",
        checkedAt: LONG_CHECKED_AT,
      },
      { id: "openai", name: "OpenAI", state: "ok", checkedAt: "Checked 30 seconds ago" },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="env-status"]')!;
    const row = root.querySelector<HTMLElement>('[data-provider-id="together-llama-70b"]')!;
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const description = row.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;

    // The model id is cut at this width; the timestamp is not. Both are pinned,
    // because "the long one truncates" is the intuition the measurement
    // corrected — see the description.
    await expect(`title truncated=${title.scrollWidth > title.clientWidth}`).toBe("title truncated=true");
    await expect(`description truncated=${description.scrollWidth > description.clientWidth}`).toBe(
      "description truncated=false",
    );

    // The cut is visual only. The whole string is still in the accessible text.
    await expect(`title text intact=${title.textContent === LONG_PROVIDER_NAME}`).toBe(
      "title text intact=true",
    );
    await expect(`description text intact=${description.textContent === LONG_CHECKED_AT}`).toBe(
      "description text intact=true",
    );

    // And neither cut is recoverable with a pointer: no `title` attribute is set
    // on either slot. Recorded, not a claim that this is right.
    await expect(`title attr on title=${title.hasAttribute("title")}`).toBe("title attr on title=false");
    await expect(`title attr on description=${description.hasAttribute("title")}`).toBe(
      "title attr on description=false",
    );

    // The heading takes the other decision: it wraps rather than truncating.
    const heading = root.firstElementChild as HTMLElement;
    await expect(`heading truncated=${heading.scrollWidth > heading.clientWidth}`).toBe(
      "heading truncated=false",
    );

    // Nothing pushes the list wider than its own box.
    await expect(`root overflows=${root.scrollWidth > root.clientWidth}`).toBe("root overflows=false");
  },
};

/**
 * 375px. The root is `w-full max-w-xl`, so the 576px cap stops binding and the
 * list simply fills the column — there is no narrow-width branch to see, and
 * this file has no responsive variants at all
 * (`grep -nE "sm:|md:|lg:" env-status.tsx` returns nothing), so the convention's
 * warning about a wrapper constraining width rather than the breakpoint does
 * not apply here. What is shown is a real phone layout, not a wide one squeezed.
 *
 * Two things carry the width, and both are load-bearing rather than incidental.
 * `entity-row` gives the title column `min-w-0 flex-1` and the trailing slot
 * `shrink-0`, so a long model id truncates instead of pushing the badge off the
 * row — without `min-w-0` the flex child's intrinsic width would win and the
 * whole list would scroll sideways. And the badge is `whitespace-nowrap`, so
 * "Not running" — the longest of the four state words — stays on one line and
 * sets the floor for how much room the name can have. The play measures the
 * worst pairing in the file: the 88-character name against that badge.
 *
 * This is also the width where `entity-row`'s second `truncate` starts costing
 * something. The same 63-character `checkedAt` that survives intact at the
 * component's own 576px cap is cut here, so the twin's wrap override matters on
 * a phone and nowhere else — `LongContent` carries the desktop half of that
 * pair.
 *
 * The condition and remedy sentences below the row are the channel that does
 * not shrink: full-width prose, wrapping rather than clipping. That is why the
 * four states stay distinguishable at this width even with the badge column
 * squeezed to a word, and it is asserted rather than assumed.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="env-status-frame" className="w-[375px] max-w-full">
      <EnvStatus
        label="Model providers"
        providers={[
          { id: "openai", name: "OpenAI", state: "ok", checkedAt: "Checked 30 seconds ago" },
          {
            id: "together-llama-70b",
            name: LONG_PROVIDER_NAME,
            state: "not-running",
            checkedAt: LONG_CHECKED_AT,
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="env-status-frame"]')!;

    // Measure the 375px frame, not the `layout: "centered"` wrapper around it.
    await expect(`frame width=${frame.getBoundingClientRect().width}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");

    const edge = frame.getBoundingClientRect().right;
    for (const id of ["openai", "together-llama-70b"]) {
      const row = frame.querySelector<HTMLElement>(`[data-provider-id="${id}"]`)!;
      const badge = row.querySelector<HTMLElement>('[data-slot="env-status-badge"]')!;

      // The badge never leaves the column, whatever the name does.
      await expect(`${id} badge on screen=${badge.getBoundingClientRect().right <= edge}`).toBe(
        `${id} badge on screen=true`,
      );
      // ...and it never wraps to a second line.
      await expect(`${id} badge lines=${badge.getBoundingClientRect().height <= 24}`).toBe(
        `${id} badge lines=true`,
      );
    }

    // The name column is what gives, and it gives by truncating — both slots
    // this time. The timestamp survives intact at the component's own 576px cap
    // (`LongContent` pins that) and is cut here, so this is the width at which
    // the second `truncate` starts costing something.
    const longRow = frame.querySelector<HTMLElement>('[data-provider-id="together-llama-70b"]')!;
    const longTitle = longRow.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const longDescription = longRow.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(`long title truncated=${longTitle.scrollWidth > longTitle.clientWidth}`).toBe(
      "long title truncated=true",
    );
    await expect(
      `long description truncated=${longDescription.scrollWidth > longDescription.clientWidth}`,
    ).toBe("long description truncated=true");

    // The condition and remedy below the row are the channel that does not
    // shrink: full-width prose, wrapping rather than clipping, so the four
    // states stay told apart at the width where the badge column is squeezed to
    // a word.
    const condition = longRow.querySelector<HTMLElement>('[data-slot="env-status-condition"]')!;
    const remedy = longRow.querySelector<HTMLElement>('[data-slot="env-status-remedy"]')!;
    await expect(`condition clipped=${condition.scrollWidth > condition.clientWidth}`).toBe(
      "condition clipped=false",
    );
    await expect(`remedy clipped=${remedy.scrollWidth > remedy.clientWidth}`).toBe("remedy clipped=false");
    // The condition is the sentence long enough to prove the wrap rather than
    // assume it: 73 characters at `text-sm` cannot fit one 351px line.
    await expect(`condition wraps=${condition.getBoundingClientRect().height > 24}`).toBe(
      "condition wraps=true",
    );
  },
};

/**
 * Three surfaces over one set of providers, and the rule for choosing between
 * them is a question about time: what is true *now*, what is *stored*, and what
 * is *left*.
 *
 * - **Env status** — liveness. Can I call this provider at this moment. It is
 *   read-only by construction and offers no control, because every remedy it
 *   names belongs to somewhere else.
 * - **Connection manager (M7)** — configuration. Is a credential stored, is a
 *   model installed, and is the stored thing any good. It owns the key field
 *   and the test action, so it is where a remedy is actually carried out.
 * - **Credits indicator (M2)** — spend. How much allowance is left. The spec
 *   pairs it with this component explicitly, as *"reachability vs spend"*,
 *   because a run can fail with a full balance when a key has expired and a
 *   balance widget will never say so — the gap D12 restored this component to
 *   close.
 *
 * So: if it says whether a call would work right now, it is env status. If it
 * lets you change what a call would use, it is connection manager. If it counts
 * what a call costs, it is credits indicator.
 *
 * The three rows make that concrete rather than abstract. Anthropic's key is
 * accepted and the provider is answering slowly, so the configuration surface
 * reads "Connected" while the runtime surface reads `degraded` — compatible
 * facts, not a stale panel. The local model's files are intact and its runtime
 * is not answering, so both surfaces agree and point at the same next step,
 * which only the configuration surface can carry out. **That asymmetry is the
 * reason to render them together:** every remedy `env-status` states is an
 * instruction, and `connection-manager` is where three of the four are actually
 * performed.
 *
 * **The one rule the spec states as a prohibition is asserted here.** The two
 * surfaces "must not be able to disagree about a provider's identity", so both
 * components are driven from one `SHARED_PROVIDERS` array and the play checks
 * the identity actually reaching the DOM: the same three `data-provider-id`s in
 * the same order, and the same visible title text for each. A future change
 * that let one surface rename or drop a provider fails here. The state fields
 * are deliberately *not* compared — those are the facts that are allowed to
 * differ, and comparing them would pin the opposite of what the spec says.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <section data-testid="runtime" className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Env status — reachable right now, and what to do if not
        </p>
        <EnvStatus
          label="Provider status"
          providers={[
            { ...SHARED_PROVIDERS[0], state: "ok", checkedAt: "Checked 30 seconds ago" },
            { ...SHARED_PROVIDERS[1], state: "degraded", checkedAt: "Checked just now" },
            { ...SHARED_PROVIDERS[2], state: "not-running", checkedAt: "Checked 1 minute ago" },
          ]}
        />
      </section>

      <section data-testid="configuration" className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Connection manager — what is stored, and where a remedy is carried out
        </p>
        <ConnectionManager
          label="Connections"
          providers={[
            {
              ...SHARED_PROVIDERS[0],
              status: "valid",
              fingerprint: "sk-live ···· 4f2a",
              testedAt: "Tested 4 minutes ago",
            },
            {
              ...SHARED_PROVIDERS[1],
              status: "valid",
              fingerprint: "sk-ant ···· 91c7",
              testedAt: "Tested 4 minutes ago",
            },
            {
              ...SHARED_PROVIDERS[2],
              status: "unreachable",
              local: { size: "4.7 GB", requirements: [{ label: "Memory", value: "16 GB RAM", met: true }] },
            },
          ]}
          onTest={() => {}}
        />
      </section>

      <section data-testid="spend" className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Credits indicator — how much allowance is left, which says nothing about reachability
        </p>
        <CreditsIndicator balance={414} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const runtime = canvasElement.querySelector<HTMLElement>('[data-testid="runtime"]')!;
    const configuration = canvasElement.querySelector<HTMLElement>('[data-testid="configuration"]')!;

    const identities = (scope: HTMLElement, slot: string) =>
      Array.from(scope.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).map((row) => ({
        id: row.getAttribute("data-provider-id"),
        name: row.querySelector('[data-slot="entity-row-title"]')?.textContent,
      }));

    const runtimeIdentities = identities(runtime, "env-status-provider");
    const configIdentities = identities(configuration, "connection-manager-provider");

    // The spec's prohibition, as a test: the two surfaces cannot disagree about
    // which providers exist or what they are called. States are not compared —
    // those are the facts that are supposed to differ.
    await expect(`runtime identities=${JSON.stringify(runtimeIdentities)}`).toBe(
      `runtime identities=${JSON.stringify(configIdentities)}`,
    );
    await expect(`identity count=${runtimeIdentities.length}`).toBe("identity count=3");

    // The surface difference the docs page claims, measured: this component is a
    // report and contributes no tab stops, in the same render where the
    // configuration surface contributes several controls.
    const focusableSelector = "button, a[href], input, textarea, select, [tabindex]";
    const runtimeStops = runtime.querySelectorAll(focusableSelector).length;
    await expect(`runtime stops=${runtimeStops}`).toBe("runtime stops=0");
    await expect(
      `configuration has controls=${configuration.querySelectorAll(focusableSelector).length > 0}`,
    ).toBe("configuration has controls=true");
  },
};
