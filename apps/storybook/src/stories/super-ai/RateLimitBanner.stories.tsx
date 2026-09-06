import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import { QuotaMeter } from "@/registry/super-ai/quota-meter";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { RateLimitBannerDocs } from "@/content/components/rate-limit-banner.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof RateLimitBanner> = {
  title: "Super AI/Rate Limit Banner",
  component: RateLimitBanner,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RateLimitBannerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[32rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RateLimitBanner>;

/** The ceiling is on the account — stated as a plan boundary, not a reprimand. */
export const YourLimit: Story = {
  args: {
    cause: "your-limit",
    resource: "Image generations · 50 of 50 used today",
    remainingSeconds: 1847,
  },
};

/**
 * Same wall, different truth: the model is saturated. The copy clears the user
 * of fault outright, because the alternative is selling them an upgrade that
 * fixes nothing.
 */
export const ProviderCapacity: Story = {
  args: {
    cause: "provider-capacity",
    resource: "Claude Opus 4.5",
    remainingSeconds: 95,
  },
};

/**
 * `remainingSeconds` is host-owned — this story renders one frame of it. The
 * component starts no interval; a real host re-passes the value each second.
 */
export const LiveCountdown: Story = {
  args: {
    cause: "your-limit",
    resource: "Video renders",
    remainingSeconds: 154,
  },
};

/**
 * No estimate to give, so the opt-in replaces the countdown rather than a
 * vaguer sentence. `notifyEnabled` is controlled by the host — flip it in the
 * controls to see the taken state, which reads as text plus `aria-pressed`,
 * never as a colour change alone.
 */
export const NotifyMe: Story = {
  args: {
    cause: "provider-capacity",
    resource: "Claude Opus 4.5",
    onNotifyMe: () => {},
    notifyEnabled: false,
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this banner meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * READ THIS BEFORE TRUSTING ANY GREEN RUN ON THIS FILE. The banner's own
 * surface is `border-warning/40 bg-warning/5`, and `--warning` is undefined in
 * `apps/storybook/src/index.css`, so Tailwind v4 emits no rule for either
 * class and **the frame renders unpainted under the axe gate**. Every
 * contrast pass below is a pass against an inherited background, not against
 * the warning tint this component ships. The same token is missing from the
 * manifest entry's (absent) `cssVars`, so a consumer's `shadcn add` installs
 * the banner colourless too. Both are recorded and deliberately unfixed —
 * a11y-baseline.md "Gate hole", CONTINUE.md §8 and §9 — because defining the
 * variable turns several components red at once and `text-warning` measures
 * about 2.2:1 where it does resolve. Restated in `Boundary`, which is where
 * the frame is the subject.
 *
 * Seven of the eight are written. Not written for this component,
 * deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the rendered tree animates, and the countdown is a text re-render the media feature cannot reach
 * `grep -nE "animate-|transition-|motion-|@keyframes" rate-limit-banner.tsx`
 * returns nothing, and neither copy of the vendored `alert.tsx` carries a
 * transition or a keyframe (checked `apps/storybook/src/components/ui/alert.tsx`,
 * which is the copy the gate renders, as well as the docs one). The only
 * moving thing in the tree is the vendored `Button`'s
 * `transition-all` + `active:not-aria-[haspopup]:translate-y-px` press nudge,
 * which CONTINUE.md §8 records as a primitive-wide posture that no case story
 * fixes.
 *
 * The interesting half is that a live countdown looks like it should have a
 * reduced-motion branch and does not: `remainingSeconds` is a prop, so the
 * clock changes by re-render, and `prefers-reduced-motion` has no bearing on
 * React re-rendering text. There is nothing to suppress and no branch to
 * document. That is also why suppression cannot collapse two states here the
 * way it does on E4 `preset-grid`, or make one state read as another the way
 * it does on K5 `source-panel`: every state this banner has is spelled out in
 * words in the same slot, and the clock is a value rather than the signal.
 * What is genuinely missing is an off switch — WCAG 2.2 SC 2.2.2 asks for a
 * mechanism to pause, stop or hide auto-updating information, and a banner
 * that reprints a number once a second for the length of a rate limit has
 * none, offers the host no signal that one is wanted, and does not mention it
 * in its docs. Recorded as a gap, not a class fix, because the interval it
 * would have to govern lives in the host.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and this banner mirrors in every part it owns while the
 * vendored frame underneath it does not.
 *
 * **What mirrors.** The `Alert` is `grid-cols-[auto_1fr]`, so the cause glyph
 * moves to the right and the whole text column to the left of it. The
 * description stack is `flex flex-col items-start`, a logical alignment, so
 * body, resource, clock, opt-in and confirmation all sit against the inline
 * start. Nothing in `rate-limit-banner.tsx` is physical: there is no `pl-`,
 * `ml-`, `border-l`, `left-` or `text-left` in the file, so this wave's
 * sanctioned physical-to-logical swap has nothing to swap.
 *
 * **What does not, and it is not this component's to fix.** `alertVariants`
 * in `components/ui/alert.tsx` carries a physical `text-left` in its base
 * string, and `AlertTitle` is a grid item filling the whole `1fr` column — so
 * the title's text is pinned to the column's physical left edge while every
 * span in the description is pushed to the inline start by `items-start`.
 * Measured in this story's 32rem frame: the text column runs **11..477**, the
 * title paints **11..221**, and the resource line paints **369..477**. The
 * heading ends 148px short of where the line under it begins, and sits 256px
 * from the inline start the whole rest of the banner lines up against.
 * `text-align` reads `left` throughout while `direction` reads `rtl`, which is
 * the whole mechanism in two words.
 *
 * That makes `alert.tsx` the sixth vendored primitive on the §8 list, after
 * `switch`, `button-group`, `toggle-group`, `table` and `carousel`, and it is
 * the same class J1 `asset-library` measured on `table.tsx`'s `<th>`. Recorded
 * rather than swept: overriding `text-left` from this one call site would
 * repair one alert and hide the defect in every other. **Not asserted below
 * either** — a passing test that reads back `textAlign: "left"` would mean the
 * defect surviving is what keeps the file green, which is the one forbidden
 * move. The numbers above are the record; the play function asserts only the
 * half that is correct.
 *
 * **The clock is deliberately not mirrored.** `formatCountdown` emits `2:34`,
 * and the span carrying it sets `dir="ltr"` so the digits keep their own
 * direction inside an Arabic sentence. Asserted rather than described, because
 * it is the kind of attribute a tidy-up deletes.
 *
 * **And the sentences stay English, because there is no way to change them.**
 * `COPY` is a module-level constant, not exported and not reachable through a
 * prop — deliberately, since a caller who could pass the title would collapse
 * the two causes back into one generic "rate limited" string, which is the
 * failure the component exists to prevent. The cost lands here: an Arabic
 * shell gets an Arabic `resource`, an Arabic `action`, and eight fixed English
 * strings in between, with the title, the body, the countdown prefix, the
 * ready line, the no-estimate line, the opt-in label and its confirmation all
 * untranslatable. The `aria-label` on the clock is spelled in English too, so
 * a screen reader in an Arabic shell announces "2 minutes 34 seconds". Not
 * this wave's to fix — the resolution is a copy map or an intl layer, and both
 * have to keep the per-cause distinction the constant is protecting.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="flex w-[32rem] max-w-full flex-col gap-6">
      <RateLimitBanner {...args} />
      <RateLimitBanner
        data-testid="rtl-capacity"
        cause="provider-capacity"
        resource="Claude Opus 4.5"
        onNotifyMe={() => {}}
        action={
          <Button size="sm" variant="outline">
            تبديل النموذج
          </Button>
        }
      />
    </div>
  ),
  args: {
    cause: "your-limit",
    resource: "إنشاء الصور · 50 من 50",
    remainingSeconds: 154,
  },
  play: async ({ canvasElement }) => {
    const r = (el: Element) => el.getBoundingClientRect();
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner"]')!;

    // 1. The frame really is right-to-left, and the grid mirrored with it: the
    //    cause glyph is now the rightmost thing in the banner.
    await expect(getComputedStyle(root).direction).toBe("rtl");
    const glyph = root.querySelector("svg")!;
    const title = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-title"]')!;
    await expect(`glyph right of title column: ${r(glyph).left >= r(title).right}`).toBe(
      "glyph right of title column: true",
    );

    // 2. The description stack mirrors, because `items-start` is logical: the
    //    body sits against the inline start, which under RTL is the right.
    const description = root.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
    const body = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-body"]')!;
    await expect(Math.round(r(description).right - r(body).right)).toBe(0);

    // 3. The resource line mirrors on the same rule, and it is the short one,
    //    so it is the honest witness that the stack really is inline-end
    //    aligned rather than merely wide enough to reach the edge.
    const resource = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-resource"]')!;
    await expect(Math.round(r(description).right - r(resource).right)).toBe(0);
    await expect(Math.round(r(resource).width)).toBeLessThan(Math.round(r(description).width));

    // The vendored `text-left` failure is deliberately NOT asserted here — the
    // numbers are in this story's description, and pinning `textAlign: "left"`
    // would make a green run mean the defect survives. J1 `asset-library` set
    // that precedent for the identical class in `table.tsx`: assert what is
    // right, record what is wrong.

    // 4. The clock keeps its own direction inside the Arabic line, and the
    //    prefix still reads before it.
    const countdown = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-countdown"]')!;
    const clock = countdown.querySelector<HTMLElement>("span[dir]")!;
    await expect(clock.getAttribute("dir")).toBe("ltr");
    await expect(getComputedStyle(clock).direction).toBe("ltr");
    await expect(clock.textContent).toBe("2:34");
    const digits = clock.firstChild as Text;
    const digitRange = document.createRange();
    digitRange.setStart(digits, 0);
    digitRange.setEnd(digits, 1);
    const head = digitRange.getBoundingClientRect();
    digitRange.setStart(digits, digits.length - 1);
    digitRange.setEnd(digits, digits.length);
    const tail = digitRange.getBoundingClientRect();
    await expect(`clock reads left to right: ${head.left < tail.left}`).toBe(
      "clock reads left to right: true",
    );

    // 5. The second banner's controls mirror as a row: the opt-in is the first
    //    child of a logical flex row, so it sits furthest to the right.
    const capacity = canvasElement.querySelector<HTMLElement>('[data-testid="rtl-capacity"]')!;
    const notify = capacity.querySelector<HTMLElement>('[data-slot="rate-limit-banner-notify"]')!;
    const action = capacity.querySelector<HTMLElement>('[data-slot="rate-limit-banner-action"]')!;
    await expect(`opt-in right of action: ${r(notify).left >= r(action).right}`).toBe(
      "opt-in right of action: true",
    );
  },
};

/**
 * Two tab stops and no more, in DOM order, each painting a ring that focus is
 * what causes.
 *
 * The banner adds itself in front of the composer, so its stop count is a real
 * cost to every keystroke below it: one for the opt-in, plus whatever the host
 * puts in `action`. Nothing else here is focusable — the frame is
 * `role="note"`, the title, body, resource and clock are static spans, and the
 * live region is `sr-only` with no `tabindex`. Asserted by counting, so a
 * future change that makes the frame or the clock focusable fails here.
 *
 * Both checks from `@/lib/focus-ring` are used, because they answer different
 * questions. `settledFocusRing` proves something is painted and waits out the
 * vendored `Button`'s `transition-all` fade, which an immediate read reports
 * as no ring at all. The differential proves focus is what painted it, taken
 * on the *next* stop while focus is still on the previous one, so nothing
 * blurs mid-walk.
 *
 * The last assertion is the docs' focus claim, pinned: taking the opt-in
 * leaves focus on the button, and it survives the host flipping
 * `notifyEnabled` underneath it — the icon swaps and a confirmation line
 * appears below, but React relabels the same node in the same slot rather than
 * replacing it, which is K2 `inline-generate-popup`'s shape.
 */
export const KeyboardOrder: Story = {
  render: () => <NotifyShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner"]')!;

    // 1. Exactly two stops, and they are the two controls.
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    );
    await expect(focusable).toHaveLength(2);
    const notify = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-notify"]')!;
    const switchModel = canvas.getByRole("button", { name: "Switch to Sonnet 4.5" });
    await expect(focusable[0]).toBe(notify);
    await expect(focusable[1]).toBe(switchModel);

    // 2. Walk them in DOM order. The second stop's signature is read while
    //    focus is still on the first, so the differential costs no blur.
    const before = focusTreatmentSignature(switchModel);
    await userEvent.tab();
    await expect(document.activeElement).toBe(notify);
    await settledFocusRing(notify, waitFor);

    await userEvent.tab();
    await expect(document.activeElement).toBe(switchModel);
    await settledFocusRing(switchModel, waitFor);
    await waitFor(() => expect(focusTreatmentSignature(switchModel)).not.toBe(before));

    // 3. Tab off the end and focus leaves the banner entirely — there is no
    //    trap and no wrap, because there is no portal.
    await userEvent.tab();
    await expect(root.contains(document.activeElement)).toBe(false);

    // 4. The docs' focus claim. Activation leaves focus where it was, and the
    //    host flipping `notifyEnabled` does not move it either.
    notify.focus();
    await userEvent.keyboard(" ");
    await expect(document.activeElement).toBe(notify);
    await waitFor(() => expect(notify.getAttribute("aria-pressed")).toBe("true"));
    await expect(document.activeElement).toBe(notify);
    await expect(canvas.getByText("We'll let you know the moment capacity returns.")).toBeInTheDocument();
  },
};

/**
 * The opt-in is the controlled pair, and clicking it moves nothing on its own.
 *
 * `notifyEnabled` in, `onNotifyMe` out, and the subscription is the host's —
 * which is the docs' fourth pitfall, asserted here rather than asked for. The
 * three checks the convention requires are numbered in the play function; the
 * fourth shows the host applying the change, which is the only thing that moves
 * the banner. It needs no payload to do it, because **`onNotifyMe` is declared
 * `() => void`** and the host already holds the cause, the resource and the
 * subscription. Nothing comes back: no id, no cause, no intended next state.
 *
 * What actually arrives at runtime is the click event, because the prop is
 * wired straight to the button's `onClick`. The declared type says otherwise,
 * so nothing a consumer writes in TypeScript can reach it, and the payload
 * assertion below records the shape rather than endorsing it — a host reading
 * `e.currentTarget` from here is depending on an implementation detail, and one
 * that would disappear the moment the component wrapped the handler.
 *
 * The missing next-state is worth naming separately. `aria-pressed` makes this
 * a toggle button, so a screen-reader user who has already opted in hears
 * "pressed" and reasonably reads a second press as turning it off — but the
 * call that fires is indistinguishable from the first, and neither the
 * component nor its docs says whether a second press means unsubscribe. The
 * docs ask for an idempotent subscribe, which answers a different question.
 * Recorded, not pinned: the story asserts what the component does and stops
 * there.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notify = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner-notify"]')!;

    // 1. Interaction alone does not move the rendered state.
    await expect(notify).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(notify);
    await expect(notify).toHaveAttribute("aria-pressed", "false");
    await expect(canvasElement.querySelector('[data-slot="rate-limit-banner-notify-status"]')).toBeNull();

    // 2. The callback fired anyway — twice over, since nothing guards it. The
    //    declared type is `() => void`, and what actually arrives is the click
    //    event, because `onClick={onNotifyMe}` wires the prop straight through.
    await userEvent.click(notify);
    await expect(canvas.getByTestId("calls")).toHaveTextContent("calls:2");
    await expect(canvas.getByTestId("payload")).toHaveTextContent("payload:1:click");

    // 3. A re-render with an unchanged `notifyEnabled` holds it fixed. Prove
    //    the re-render happened first — by comparison rather than by an
    //    absolute count, since the two clicks above already re-rendered the
    //    shell and React is free to render more often than it is asked to.
    const passes = () => Number(canvas.getByTestId("render-pass").textContent);
    const before = passes();
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await waitFor(() => expect(passes()).toBeGreaterThan(before));
    await expect(notify).toHaveAttribute("aria-pressed", "false");

    // 4. Only the host applying it moves the banner — and when it does, the
    //    label stays put while `aria-pressed` and a visible sentence change.
    const label = notify.textContent;
    await userEvent.click(canvas.getByRole("button", { name: "Apply subscription" }));
    await waitFor(() => expect(notify).toHaveAttribute("aria-pressed", "true"));
    await expect(notify.textContent).toBe(label);
    await expect(canvas.getByText("We'll let you know the moment capacity returns.")).toBeInTheDocument();
  },
};

/**
 * Every optional slot omitted or emptied, which for this banner is the
 * reassuring case rather than the usual one.
 *
 * The program's most repeated finding is a component whose accessible name
 * collapses when a caller passes `""` — it has landed in families D, H, J and
 * K, and it is a red axe gate in at least three of them (H4's word token, J1's
 * search field, K1's edit label). This banner cannot land there, and the reason
 * is a design decision rather than luck: `title` and `body` are looked up from
 * `cause` and are not props at all, so the only text a caller controls is
 * `resource`, which is decoration. The first banner below passes nothing
 * optional and is still fully named; the second passes `resource=""` and drops
 * the slot cleanly instead of rendering an empty line.
 *
 * The third is the same question asked of a number, and it is the one seam
 * found here. `remainingSeconds` is clamped for display but tested for
 * readiness against zero exactly, so a host computing
 * `(resetAt - Date.now()) / 1000` — the obvious implementation, and the one
 * the docs ask for — spends its last whole second showing "Resets in 0:00"
 * while the copy still says to wait. Sub-second values are unreachable by any
 * other route, since the component holds no clock. Recorded, not fixed: which
 * way it should round is a product decision, and `Math.ceil` would trade this
 * for an off-by-one at the top of the wait.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-[32rem] max-w-full flex-col gap-6">
      <RateLimitBanner data-testid="bare" cause="your-limit" />
      <RateLimitBanner data-testid="empty-resource" cause="provider-capacity" resource="" />
      <RateLimitBanner data-testid="almost-zero" cause="your-limit" remainingSeconds={0.4} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    // 1. Nothing optional passed, and the banner still says which constraint
    //    this is, that it is not the user's fault, and that no reset time is
    //    known. No focusable control, because there is no opt-in to take.
    const bare = at("bare");
    await expect(bare.querySelector('[data-slot="rate-limit-banner-title"]')!.textContent).toBe(
      "You've reached your plan's limit",
    );
    await expect(bare.querySelector('[data-slot="rate-limit-banner-no-eta"]')!.textContent).toBe(
      "No reset time reported yet.",
    );
    await expect(bare.querySelectorAll("button")).toHaveLength(0);
    await expect(bare.querySelector('[data-slot="rate-limit-banner-resource"]')).toBeNull();

    // 2. `resource=""` removes the slot rather than leaving an empty span in
    //    the stack, so the gap it would have opened never appears.
    const empty = at("empty-resource");
    await expect(empty.querySelector('[data-slot="rate-limit-banner-resource"]')).toBeNull();
    await expect(empty.querySelector('[data-slot="rate-limit-banner-title"]')!.textContent).toBe(
      "The model is at capacity",
    );

    // 3. The seam. Under a second left, the clock reads zero and the sentence
    //    around it still says to wait.
    const almost = at("almost-zero");
    const countdown = almost.querySelector<HTMLElement>('[data-slot="rate-limit-banner-countdown"]')!;
    await expect(countdown.textContent).toBe("Resets in 0:00");
    await expect(countdown.querySelector("span[dir]")!.getAttribute("aria-label")).toBe("0 seconds");

    // 4. The live region stays coarse and never contradicts itself: under a
    //    minute it says so in words, and it is the same string it would carry
    //    at 59 seconds.
    const status = almost.querySelector<HTMLElement>('[data-slot="rate-limit-banner-status"]')!;
    await expect(status.getAttribute("role")).toBe("status");
    await expect(status.textContent).toBe("You've reached your plan's limit. less than a minute left");
  },
};

/**
 * Eighty-two characters of author-supplied `resource`, plus a thirty-seven
 * character escape hatch, against a fixed 32rem frame.
 *
 * The banner's decision is to wrap, and it holds: the resource line is the
 * only place a caller's own prose lands, and it sits in a `flex flex-col`
 * inside the `1fr` grid column, so it takes as many lines as it needs and the
 * column never grows. Worth an assertion rather than a look, because a grid
 * item's `min-width: auto` is what usually breaks this shape — a long
 * unbreakable run pushes the column past the card instead of wrapping. The
 * model id below is the realistic version of that run, and it survives on its
 * hyphens.
 *
 * The `action` slot is where the same content becomes a real risk, since a
 * caller's button has `whitespace-nowrap` from the vendored `Button` and
 * cannot wrap at all. The row it sits in is `flex-wrap`, so a long opt-in and
 * a long action stack rather than overflow — measured below at the frame's
 * own width.
 */
export const LongContent: Story = {
  render: () => (
    <div data-testid="long-frame" className="w-[32rem] max-w-full">
      <RateLimitBanner
        cause="provider-capacity"
        resource="claude-opus-4-5-20260514 · shared capacity pool, 12 requests queued ahead of yours"
        remainingSeconds={4215}
        onNotifyMe={() => {}}
        action={
          <Button size="sm" variant="outline">
            Switch to Sonnet 4.5 and run this now
          </Button>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="long-frame"]')!;
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner"]')!;

    // 1. Nothing escapes the frame, at either level.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);

    // 2. The resource wrapped rather than stretched the column — more than one
    //    line tall, and no wider than the column it sits in.
    const description = root.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
    const resource = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-resource"]')!;
    const lineHeight = parseFloat(getComputedStyle(resource).lineHeight);
    await expect(resource.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
    await expect(Math.round(resource.getBoundingClientRect().width)).toBeLessThanOrEqual(
      Math.round(description.getBoundingClientRect().width),
    );

    // 3. Past an hour the clock grows a third field, and the accessible name
    //    spells all three rather than reading the punctuation.
    const clock = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-countdown"] span[dir]')!;
    await expect(clock.textContent).toBe("1:10:15");
    await expect(clock.getAttribute("aria-label")).toBe("1 hour 10 minutes 15 seconds");

    // 4. The announced phrase does not grow with it. This is the throttle
    //    doing its job: an hour-long wait is one coarse sentence, not a clock.
    const status = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-status"]')!;
    await expect(status.textContent).toBe("The model is at capacity. about 2 hours left");

    // 5. Two long controls stack instead of overflowing, because the row that
    //    holds them wraps and the buttons themselves cannot.
    const notify = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-notify"]')!;
    const action = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-action"]')!;
    await expect(getComputedStyle(notify).whiteSpace).toBe("nowrap");
    await expect(
      `action wrapped below opt-in: ${action.getBoundingClientRect().top >= notify.getBoundingClientRect().bottom}`,
    ).toBe("action wrapped below opt-in: true");
  },
};

/**
 * 375px, which is the width this component is actually used at — it renders
 * above the composer, and the composer is the whole screen on a phone.
 *
 * The frame is wrapper-constrained rather than set through
 * `parameters.viewport`, and the assertion measures the frame by its
 * `data-testid`: the meta's `layout: "centered"` wraps every story in a
 * ~1200px div, so `canvasElement.firstElementChild` would pass for the wrong
 * reason. The gate's chromium is 1200px wide, so `md:` still applies inside
 * the box — the only `md:` rule reaching this tree is `AlertDescription`'s
 * `md:text-pretty`, which changes line breaking and not layout, so the narrow
 * claim here is honest.
 *
 * What the width actually tests is the control row: an opt-in whose label is a
 * sentence, beside an escape hatch, inside a card that has already spent 24px
 * on the cause glyph. Both buttons are `whitespace-nowrap`, so if either
 * outgrew the column it would push the banner sideways rather than wrap. The
 * `sr-only` status span is excluded from the per-child sweep on purpose: it is
 * a 1×1 clipped box that always reports as overflowing, which has nothing to
 * do with layout.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <RateLimitBanner
        cause="your-limit"
        resource="Image generations · 50 of 50 used today"
        remainingSeconds={1847}
        onNotifyMe={() => {}}
        action={
          <Button size="sm" variant="outline">
            See plans
          </Button>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(Math.round(frame.getBoundingClientRect().width)).toBe(375);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);

    const root = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner"]')!;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    const description = root.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
    for (const el of Array.from(description.children) as HTMLElement[]) {
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    }

    // Both controls fit the column at this width, and the opt-in — the widest
    // fixed string in the component — is what proves it.
    const notify = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-notify"]')!;
    await expect(notify.getBoundingClientRect().width).toBeLessThanOrEqual(
      description.getBoundingClientRect().width,
    );
    await expect(notify.textContent).toContain("Notify me when my limit resets");

    // The clock still reads as a clock rather than collapsing onto its prefix.
    const countdown = root.querySelector<HTMLElement>('[data-slot="rate-limit-banner-countdown"]')!;
    await expect(countdown.textContent).toBe("Resets in 30:47");
  },
};

/**
 * The three walls a user can hit in this family, side by side, and the rule
 * that chooses between them is **what removes the wall**.
 *
 * - M3 `quota-meter` reports headroom. Nobody is stopped; it exists so the
 *   decision happens before the wall does.
 * - M6, this component, is the wall that only time removes. It is inline,
 *   persistent, and its whole content is a clock plus which of two constraints
 *   produced it.
 * - M5 `paywall-message` is the wall that money removes. It carries the prompt
 *   that did not run, because the wait here is a purchase rather than a delay.
 *
 * Getting the pair wrong is the failure the spec names: a rate limit shown as
 * a paywall sells an upgrade that changes nothing, and a paywall shown as a
 * rate limit asks someone to wait for a reset that will never come. The two
 * even share a glyph: `paywall-message`'s `quota-exhausted` and this banner's
 * `your-limit` both draw lucide's `Gauge`, so the icon cannot be the thing a
 * user reads the difference from. The words are, and that is why they are
 * fixed per cause and not overridable. The glyph collision is an observation
 * rather than a contract — neither component promises it — so the play
 * function asserts the titles and leaves the icons alone.
 *
 * **The colour caveat, restated where it bites.** Two of the three paint with
 * `--warning` — this banner's `border-warning/40 bg-warning/5` frame, and the
 * meter's near-limit bar and value, which the 41-of-50 row above is deliberately
 * over the threshold to render. Storybook defines the token nowhere, so both
 * arrive with no tint: a warning frame that looks like a plain card, beside a
 * "near limit" bar the same colour as a healthy one. Nothing on this page is
 * evidence about the warning surface, its axe pass included — see the block
 * comment above, and a11y-baseline.md's "Gate hole" for why it stays that way.
 * `paywall-message` is the one of the three that never reaches for the token.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[32rem] max-w-full flex-col gap-8">
      <QuotaMeter
        data-testid="neighbour-quota"
        resources={[
          { label: "Image generations", used: 41, limit: 50, resetsIn: "Resets in 3 hours" },
          { label: "Video renders", used: 2, limit: 10, resetsIn: "Resets in 3 hours" },
        ]}
      />
      <RateLimitBanner
        cause="your-limit"
        resource="Image generations · 50 of 50 used today"
        remainingSeconds={1847}
      />
      <PaywallMessage
        data-testid="neighbour-paywall"
        state="quota-exhausted"
        before="You're out of credits for this month, so I stopped before running it."
        prompt="Storyboard the opening 20 seconds as six frames"
        model="Claude Opus 4.5"
        requirement="Pro"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector<HTMLElement>('[data-slot="rate-limit-banner"]')!;
    const quota = canvasElement.querySelector<HTMLElement>('[data-testid="neighbour-quota"]')!;
    const paywall = canvasElement.querySelector<HTMLElement>('[data-testid="neighbour-paywall"]')!;

    // 1. Only the paywall keeps the work. That is the clearest structural
    //    difference between the two walls: one is waited out, the other is
    //    resumed.
    await expect(paywall.textContent).toContain("Storyboard the opening 20 seconds as six frames");
    await expect(banner.textContent).not.toContain("Storyboard");
    await expect(paywall.textContent).toContain("Claude Opus 4.5");

    // 2. Only this banner carries a clock, and only the meter carries a
    //    measured ratio — neither borrows the other's job.
    await expect(banner.querySelector('[data-slot="rate-limit-banner-countdown"]')!.textContent).toBe(
      "Resets in 30:47",
    );
    await expect(quota.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    await expect(banner.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
    // The meter's first row is over its 0.8 threshold, so the description's
    // claim about an untinted near-limit bar is about a row that really is in
    // that state rather than a hypothetical one.
    await expect(quota.querySelector('[data-slot="quota-meter-row"]')!.getAttribute("data-state")).toBe(
      "near-limit",
    );

    // 3. The titles are what a reader tells the two walls apart by, so they
    //    are asserted and the glyphs are not: both draw `Gauge` today (see the
    //    description), but neither component promises that, and pinning it
    //    would make a paywall icon change fail this file for no reason.
    await expect(banner.querySelector('[data-slot="rate-limit-banner-title"]')!.textContent).toBe(
      "You've reached your plan's limit",
    );
    await expect(paywall.querySelector('[data-slot="paywall-message-title"]')!.textContent).toContain(
      "You are out of credits",
    );
    await expect(banner.querySelector('[data-slot="rate-limit-banner-body"]')!.textContent).toContain(
      "not a problem with your request",
    );

    // 4. Nothing here is assertive. Three neighbouring surfaces that all
    //    announce a constraint, and none of them interrupts.
    await expect(banner.getAttribute("role")).toBe("note");
    await expect(canvasElement.querySelectorAll('[role="alert"]')).toHaveLength(0);
  },
};

/**
 * The host that owns the subscription. `notifyEnabled` only moves when this
 * shell applies it, which is the point of both `Controlled` and the focus
 * claim in `KeyboardOrder`.
 */
function NotifyShell() {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <RateLimitBanner
      cause="provider-capacity"
      resource="Claude Opus 4.5"
      remainingSeconds={95}
      notifyEnabled={enabled}
      onNotifyMe={() => setEnabled(true)}
      action={
        <Button size="sm" variant="outline">
          Switch to Sonnet 4.5
        </Button>
      }
    />
  );
}

/**
 * A host that deliberately does *not* apply the opt-in on the callback, so the
 * controlled contract is visible: the count and the payload are recorded, and
 * the banner only moves when "Apply subscription" is pressed.
 */
function ControlledShell() {
  const [enabled, setEnabled] = React.useState(false);
  const [calls, setCalls] = React.useState(0);
  // Not `JSON.stringify(args)`: the argument is a React synthetic event whose
  // `target` closes a cycle back through the fiber, and stringifying it throws
  // out of the click handler. Shape only.
  const [payload, setPayload] = React.useState<string>("none");
  const renderPass = React.useRef(0);
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  renderPass.current += 1;

  return (
    <div className="flex w-[32rem] max-w-full flex-col gap-3">
      <RateLimitBanner
        cause="provider-capacity"
        resource="Claude Opus 4.5"
        notifyEnabled={enabled}
        onNotifyMe={(...args: unknown[]) => {
          setCalls((n) => n + 1);
          setPayload(
            args.length === 0
              ? "none"
              : `${args.length}:${(args[0] as { type?: string } | null)?.type ?? typeof args[0]}`,
          );
        }}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button size="sm" variant="outline" onClick={() => force()}>
          Re-render
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEnabled(true)}>
          Apply subscription
        </Button>
        <span data-testid="calls">calls:{calls}</span>
        <span data-testid="payload">payload:{payload}</span>
        <span data-testid="render-pass">{renderPass.current}</span>
      </div>
    </div>
  );
}
