import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import { CostProvider } from "@/registry/super-ai/cost";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { PaywallMessageDocs } from "@/content/components/paywall-message.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const PROMPT = "A slow dolly across a rain-lit Tokyo alley at night, neon reflections in the puddles";

/**
 * Case-story fixtures. Prompts, model ids and plan names a generation tool
 * really emits — the long model is a repo-id slug of the shape hosted weights
 * actually ship under, which is also the string most likely to break wrapping,
 * because its only break opportunities are its slash and its hyphens.
 */
const LONG_PROMPT =
  "Regrade the whole interview sequence to match the 4pm window light in the establishing shot";
const LONG_MODEL = "stabilityai/stable-video-diffusion-img2vid-xt-1-1-fp16-safetensors";
const LONG_PREVIEW =
  "Twelve shots, 1080p at 24fps, colour-matched to the reference still and cut to the existing edit points.";

const meta: Meta<typeof PaywallMessage> = {
  title: "Super AI/Paywall Message",
  component: PaywallMessage,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PaywallMessageDocs) } },
  // Every story sits inside the cost contract: the shortfall line under the
  // price is derived from this balance, never passed to the card as a prop.
  decorators: [
    (Story) => (
      <CostProvider balance={120} onTopUp={() => {}}>
        <div className="w-[28rem] max-w-full">
          <Story />
        </div>
      </CostProvider>
    ),
  ],
  args: {
    prompt: PROMPT,
    model: "Veo 3.1",
    onUpgrade: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PaywallMessage>;

/** The model is not on the plan. The prompt and the model both survive the block. */
export const LockedModel: Story = {
  args: {
    state: "locked-model",
    requirement: "Pro",
    cost: { amount: 900, per: "min" },
    preview: "8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt.",
    before:
      "I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything.",
    after:
      "Your prompt and model are held here — upgrading picks this back up exactly where it stopped. In the meantime I can storyboard it as stills.",
  },
};

/** The balance falls short, so the shortfall line derives itself from the contract. */
export const QuotaExhausted: Story = {
  args: {
    state: "quota-exhausted",
    prompt: "Upscale the final cut to 4K and export an MP4 for the client review",
    model: "Topaz Video AI",
    cost: { amount: 900 },
    preview: "One 4K MP4, roughly 90 seconds, H.264.",
    before: "You are out of credits for this billing period, so I did not start the export.",
    after: "Credits reset on the 1st. I have kept the export settings, so nothing needs rebuilding.",
  },
};

/** A capability the account never had — no price to quote, only work to hold. */
export const FeatureLocked: Story = {
  args: {
    state: "feature-locked",
    requirement: "Studio",
    prompt: "Give the narrator my cloned voice and lip-sync it to the presenter shot",
    model: "ElevenLabs v3",
    preview: "A 40-second voice track, lip-synced to the presenter take.",
    before:
      "Voice cloning is a Studio feature, so I stopped at the script rather than generating something you cannot use.",
    after: "Everything else in this edit is done — this is the only step waiting on the plan.",
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this card meets in a product, as opposed to
 * the three prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — `grep -n "animate-\|transition-" paywall-message.tsx` returns nothing; the only class in the composed tree that moves anything is the vendored Button's press nudge, a primitive-wide posture no call site owns
 * The grep is the whole reason. `paywall-message.tsx` has no `animate-*` and
 * no `transition-*` at all: the card does not enter, the sections do not
 * expand, and nothing here mounts on a delay — the whole turn is rendered by
 * the host in one pass and then holds still until the host replaces it. What
 * does move sits below this component in `components/ui/button.tsx`, which
 * pairs `transition-all` with `active:not-aria-[haspopup]:translate-y-px`, so
 * both buttons nudge a pixel while pressed under emulated reduce. Wave 1 found
 * that on `quote-reply` and `media-prompt-bar` and recorded it as a
 * primitive-wide posture; the class is in no registry component's file, so no
 * case story can branch it. Worth stating precisely, because it is easy to
 * assume the gate has an opinion here and it does not: MOT-2's `scope` in
 * `packages/ds-rules/src/core.ts` is `registry/super-ai` and
 * `registry/marketing` only, so that `transition-all` is not a demoted warning
 * — it is outside the token gate's scope entirely, one step further out than
 * the vendored demotion `vendored-token-findings.md` describes. `ui/badge.tsx`
 * carries `transition-all` too, but only ring and border colours change on it,
 * which is the `reset-affordance` case the convention names: a crossfade that
 * moves nothing documents no branch. So a `ReducedMotion` story here would
 * render pixel-for-pixel identically to `LockedModel` and imply coverage of a
 * branch that does not exist.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with the card that has every directional part on it at once:
 * a leading icon, a trailing requirement badge, the preview's edge rule, and a
 * price. Three of the four mirror; the fourth is pinned LTR on purpose and is
 * the thing to notice.
 *
 * **The preview rule needed the swap and got it.** The block carried
 * `border-l-2 pl-3`, so under RTL the rule that marks "this is quoted output"
 * sat on the far edge from the text it belonged to, with the padding on the
 * wrong side to match. Swapped to `border-s-2 ps-3` in this wave — the
 * byte-identical logical swap `CONTINUE.md` §8 sanctions, and safe here by the
 * F5 test: every participant in that block's layout is a class, there is no
 * clip geometry and no inline `left` deciding the side alongside them. The
 * play asserts the resolved widths rather than the class name, which is H3
 * `track-lane`'s pattern and is what stops the swap silently regressing.
 *
 * **The header mirrors for free.** `CardHeader` becomes
 * `grid-cols-[1fr_auto]` when a `CardAction` is present and `CardAction` is
 * `justify-self-end`; grid columns and `justify-self` are both writing-mode
 * relative, so the requirement badge crosses to the left edge with no help.
 * The title's icon is a flex sibling and leads on the right for the same
 * reason.
 *
 * **The price stays in Latin order, and that is a decision made two levels
 * down.** A2 `cost-chip` hard-codes `dir="ltr"` on its amount span, so
 * "900 credits/min" reads left-to-right inside a right-to-left card. That is
 * correct for a numeral-and-slash rate — bidi would otherwise reorder the
 * `/min` — but it is the primitive's call, not this card's, and a caller
 * cannot turn it off. Asserted here so that if A2's retrofit ever drops the
 * attribute, a paywall story is one of the places that notices.
 *
 * **A docs correction falls out of the same read.** The docs module's screen
 * reader notes say the chip "is passed `unit=""`, so it announces as a naked
 * number: 300 … nothing saying what 300 is", and that the derived shortfall is
 * "the only place the unit is spoken". It is not: this card passes
 * `amount={formatCost(resolved.cost)}`, and `formatCost` has already put the
 * unit and the rate *inside* the amount string — the `unit=""` is there to stop
 * A2 appending a second "credits". The span reads "900 credits/min", asserted
 * below. Correcting that prose is outside this wave's file list, so it is
 * recorded here and in the report.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex w-full flex-col">
      <PaywallMessage
        state="locked-model"
        requirement="Pro"
        prompt={PROMPT}
        model="Veo 3.1"
        cost={{ amount: 900, per: "min" }}
        preview="8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt."
        before="I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything."
        after="Your prompt and model are held here — upgrading picks this back up exactly where it stopped."
        onUpgrade={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const q = (slot: string) => canvasElement.querySelector(`[data-slot="${slot}"]`) as HTMLElement;

    // The swap resolved: the rule and its padding are both on the right (start)
    // edge under RTL. Before it, this read `left=2px` / `paddingLeft=12px`.
    const preview = getComputedStyle(q("paywall-message-preview"));
    await expect(
      `start border=${preview.borderRightWidth} end border=${preview.borderLeftWidth}` +
        ` start pad=${preview.paddingRight} end pad=${preview.paddingLeft}`,
    ).toBe("start border=2px end border=0px start pad=12px end pad=0px");

    const centre = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    };

    // The badge crosses to the left, the title (with its leading icon) stays
    // right. Compared as centres so padding cannot flip the reading.
    await expect(
      `badge left of title=${centre(q("paywall-message-requirement")) < centre(q("paywall-message-title"))}`,
    ).toBe("badge left of title=true");

    // The icon leads, which under RTL means it is the rightmost thing in the title.
    const icon = q("paywall-message-title").querySelector("svg") as unknown as HTMLElement;
    await expect(`icon right of title centre=${centre(icon) > centre(q("paywall-message-title"))}`).toBe(
      "icon right of title centre=true",
    );

    // A2 pins the amount LTR inside an RTL card. Recorded because it is the
    // primitive's decision and a caller has no way to opt out of it.
    const amount = canvasElement.querySelector('[data-slot="cost-chip-amount"]') as HTMLElement;
    await expect(
      `card dir=${getComputedStyle(q("paywall-message")).direction} amount dir=${getComputedStyle(amount).direction}`,
    ).toBe("card dir=rtl amount dir=ltr");

    // And what that span actually says, because the docs module claims
    // otherwise — see the description.
    await expect(`chip text=${amount.textContent?.trim()}`).toBe("chip text=900 credits/min");
  },
};

/**
 * Between zero and two stops, and this story renders the two-stop maximum: a
 * locked model whose price the balance also cannot cover, which is the harder
 * of the two routes to both buttons at once (the other is any
 * `quota-exhausted` card inside a contract that offers a top-up at all).
 * Everything else on the card is text — the held prompt is a `<p>`, not a
 * field, so there is no keyboard route to copy or edit it from inside the
 * card, and the group itself is not focusable.
 *
 * **Both focus checks run at every stop, because they answer different
 * questions and can disagree.** `settledFocusRing` asks whether anything is
 * painted, after the vendored `Button`'s `transition-all` has faded the ring
 * in; the differential asks whether focus is what painted it, which an
 * absolute check can never tell from a permanent shadow. Neither is a
 * substitute: K3 measured that this exact primitive rests at
 * `box-shadow: none`, so the differential flips on the transition's first
 * frame while all five ring layers are still transparent and zero-sized, and
 * only the settled read proves the ring actually arrives. The signature for
 * each stop is read while focus is still on the *previous* one, so no blur
 * ever disturbs the walk.
 *
 * **The two buttons are named apart by their own copy**, per-state and
 * per-purpose: "Upgrade to use this model" against "Top up". That is the
 * per-row naming contract holding, which is worth pinning given how often it
 * has failed elsewhere in this registry.
 *
 * **Where this stops, and why.** Nothing in the card moves focus, and that is
 * correct while the card is on screen. The gap is at the other end: the docs
 * page says a host that swaps this turn for the resumed run has to land focus
 * itself, because the focused button unmounts with the turn and focus falls to
 * `<body>`. That is the focus-loss-on-unmount shape wave 1 found in four
 * components, it is the host's to fix rather than the card's, and the play
 * deliberately stops short of asserting it.
 */
export const KeyboardOrder: Story = {
  args: {
    state: "locked-model",
    requirement: "Pro",
    cost: { amount: 900, per: "min" },
    preview: "8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt.",
    before: "I have the shot ready to go, but Veo 3.1 is not on your current plan.",
    after: "Upgrading picks this back up exactly where it stopped.",
    onUpgrade: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Only real stops: Base UI leaves `tabindex="0"` on natively-disabled
    // buttons elsewhere in this registry, so filter rather than trusting the
    // attribute.
    const tabbable = Array.from(
      canvasElement.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]"),
    ).filter((el) => el.getAttribute("tabindex") !== "-1" && !(el as HTMLButtonElement).disabled);
    await expect(`stops=${tabbable.length}`).toBe("stops=2");

    const cta = canvas.getByRole("button", { name: "Upgrade to use this model" });
    const topUp = canvas.getByRole("button", { name: "Top up" });
    const stops: HTMLElement[] = [cta, topUp];
    await expect(`dom order=${tabbable[0] === cta && tabbable[1] === topUp}`).toBe("dom order=true");

    // The group is a landmark for reading, not a stop for tabbing.
    const card = canvasElement.querySelector('[data-slot="paywall-message-card"]') as HTMLElement;
    await expect(card).toHaveAttribute("role", "group");
    await expect(card).toHaveAccessibleName("This model is not on your plan");
    await expect(card.hasAttribute("tabindex")).toBe(false);

    // Resting signature for the first stop, taken before anything is focused;
    // every later stop is read while focus is still on its predecessor.
    const resting = new Map<HTMLElement, string>([[stops[0], focusTreatmentSignature(stops[0])]]);

    await userEvent.tab();
    for (let i = 0; i < stops.length; i += 1) {
      const stop = stops[i];
      await expect(document.activeElement).toBe(stop);
      await expect(`${stop.textContent} focus-visible=${stop.matches(":focus-visible")}`).toBe(
        `${stop.textContent} focus-visible=true`,
      );
      // Something is painted, once the ring has faded in…
      await settledFocusRing(stop, waitFor);
      // …and focus is what painted it.
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(resting.get(stop)));

      const next = stops[i + 1];
      if (next) resting.set(next, focusTreatmentSignature(next));
      await userEvent.tab();
    }

    // Nothing traps: the card is a turn in a stream, not a dialog.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Both are real buttons, so Enter activates — the docs page's keyboard note
    // claims it, and a div-with-onClick is the failure mode that would break it.
    await expect(`cta=${cta.tagName}/${cta.getAttribute("type")}`).toBe("cta=BUTTON/button");
    cta.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onUpgrade).toHaveBeenCalledWith({ prompt: PROMPT, model: "Veo 3.1" });

    // Stops here. Focus after the host replaces the turn is the host's job —
    // see the description.
  },
};

/**
 * The controlled pair on this card is not a value and a change handler. It is
 * the cost contract, and this is the component where that contract is actually
 * enforced.
 *
 * `insufficient` and `shortfall` are deliberately not props: `useCost` derives
 * both from the estimate and the balance in `CostProvider`, so the card and the
 * run button cannot print two different answers about the same job. This story
 * holds both cards' props **completely fixed** and moves only the host's
 * balance. Everything derived moves with it, and the play asserts the ordinary
 * controlled trio on the way: `onTopUp` records the request and applies
 * nothing, so pressing Top up leaves the card exactly where it was; `onUpgrade`
 * fires with `{ prompt, model }`, the whole resume payload a consumer needs to
 * re-run the exact work, and changes nothing on screen either; and a re-render
 * with an unchanged balance holds the card fixed, checked against a render
 * counter so "nothing changed" cannot mean "nothing re-rendered".
 *
 * **The two cards are identical except for `state`, and that is the finding.**
 * Raising the balance to 1,200 against a 900-credit job clears the shortfall
 * line on both — derived, from a number neither card receives as a prop. The
 * top-up button then disappears from the `locked-model` card and **stays on the
 * `quota-exhausted` one**, because `canTopUp` is
 * `onTopUp && (state === "quota-exhausted" || insufficient)` and the first
 * disjunct is a prop. So a host that tops the balance up without also changing
 * `state` ships a card titled "You are out of credits" with no shortfall under
 * it and a button offering to sell more. That is the seam in an otherwise
 * airtight design: affordability is derived, the gate that fired is accepted,
 * and nothing reconciles the two. Recorded, not pinned — which of the two
 * should win is a design decision, since deriving the state would break the
 * case where the quota is a hard cap rather than a balance, so the play asserts
 * only what the component does today.
 *
 * **Worth naming, because `CONTINUE.md` §5 says the opposite is the norm.**
 * E5 `run-button` and E7 `member-gate-row` are the registry's other two cost
 * placements and neither calls `useCost`, so the derive-never-accept rule is
 * unenforced on both. M5 is where it holds, and this story is what would catch
 * an `insufficient` prop being added later to make a story easier to write.
 */
export const Controlled: Story = {
  render: function ControlledHost() {
    const [balance, setBalance] = React.useState(120);
    const [tick, setTick] = React.useState(0);
    const [topUpRequests, setTopUpRequests] = React.useState(0);
    const [resume, setResume] = React.useState("none");
    const renders = React.useRef(0);
    renders.current += 1;

    return (
      // A nested provider so this host owns the balance; the meta's provider is
      // the ambient one every other story reads.
      <CostProvider balance={balance} onTopUp={() => setTopUpRequests((n) => n + 1)}>
        <div className="flex flex-col gap-4">
          <PaywallMessage
            data-testid="quota"
            state="quota-exhausted"
            prompt={PROMPT}
            model="Veo 3.1"
            cost={{ amount: 900 }}
            before="You are out of credits for this billing period, so I did not start the render."
            after="Your prompt is held here — nothing needs rebuilding once the balance is back."
            onUpgrade={(payload) => setResume(`${payload.model} · ${payload.prompt.length} chars`)}
          />
          <PaywallMessage
            data-testid="locked"
            state="locked-model"
            requirement="Pro"
            prompt={PROMPT}
            model="Veo 3.1"
            cost={{ amount: 900 }}
            before="Veo 3.1 is not on your current plan, so I stopped before spending anything."
            onUpgrade={() => {}}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              data-testid="apply-top-up"
              className="rounded-md border px-2 py-1"
              onClick={() => setBalance(1200)}
            >
              Apply the top-up (host)
            </button>
            <button
              type="button"
              data-testid="rerender"
              className="rounded-md border px-2 py-1"
              onClick={() => setTick((n) => n + 1)}
            >
              Re-render, same balance
            </button>
            <span data-testid="host-state">
              balance={balance} · top-up requests={topUpRequests} · resume={resume} · tick={tick} · renders=
              {renders.current}
            </span>
          </div>
        </div>
      </CostProvider>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const quotaCard = canvas.getByTestId("quota");
    const lockedCard = canvas.getByTestId("locked");
    const quota = within(quotaCard);
    const q = (root: HTMLElement, slot: string) => root.querySelector(`[data-slot="${slot}"]`);
    const hostState = () => canvas.getByTestId("host-state").textContent ?? "";

    // Derived, on both cards, from a balance neither of them sees as a prop.
    for (const card of [quotaCard, lockedCard]) {
      await expect(q(card, "paywall-message-shortfall")).toHaveTextContent("Need 900 credits, you have 120");
    }

    // Interaction alone moves nothing. Top up reports the request; the balance,
    // the shortfall line and the button are all exactly where they were.
    await userEvent.click(quota.getByRole("button", { name: "Top up" }));
    await expect(hostState()).toContain("top-up requests=1");
    await expect(hostState()).toContain("balance=120");
    await expect(q(quotaCard, "paywall-message-shortfall")).toHaveTextContent(
      "Need 900 credits, you have 120",
    );

    // Upgrade hands back the resume payload rather than acting.
    await userEvent.click(quota.getByRole("button", { name: "Upgrade for more credits" }));
    await expect(hostState()).toContain(`resume=Veo 3.1 · ${PROMPT.length} chars`);
    await expect(q(quotaCard, "paywall-message-prompt")).toHaveTextContent(PROMPT);

    // A re-render with an unchanged balance holds both cards fixed — and really
    // did re-render, which the counter is there to prove.
    const rendersBefore = Number(/renders=(\d+)/.exec(hostState())?.[1]);
    await userEvent.click(canvas.getByTestId("rerender"));
    await waitFor(() =>
      expect(Number(/renders=(\d+)/.exec(hostState())?.[1])).toBeGreaterThan(rendersBefore),
    );
    await expect(q(quotaCard, "paywall-message-shortfall")).toHaveTextContent(
      "Need 900 credits, you have 120",
    );

    // Only the host's balance moves. No prop of either card changes here.
    await userEvent.click(canvas.getByTestId("apply-top-up"));

    // Derived: the shortfall goes from both, because both derive it.
    await waitFor(() => expect(q(quotaCard, "paywall-message-shortfall")).toBeNull());
    await expect(q(lockedCard, "paywall-message-shortfall")).toBeNull();

    // Accepted: the top-up button goes only where affordability was the sole
    // thing keeping it. The seam described above, measured.
    await expect(
      `quota top-up=${q(quotaCard, "paywall-message-top-up") !== null}` +
        ` locked top-up=${q(lockedCard, "paywall-message-top-up") !== null}`,
    ).toBe("quota top-up=true locked top-up=false");
    // …under a title that still says the balance is spent.
    await expect(q(quotaCard, "paywall-message-title")).toHaveTextContent("You are out of credits");

    // The price survives on both; it is the shortfall that was derived, not the cost.
    await expect(q(quotaCard, "paywall-message-cost")).toBeInTheDocument();
    await expect(quota.getByRole("button", { name: "Upgrade for more credits" })).toBeInTheDocument();
  },
};

/**
 * Every optional slot emptied with `""` rather than omitted, which on this card
 * is two different mechanisms with two different outcomes — and the second is
 * the ninth component in this registry to be caught by it.
 *
 * **The truthiness guards degrade quietly and correctly.** `requirement`,
 * `model`, `preview` and `after` are all rendered behind `x ? … : null`, so an
 * empty string is treated as absent: the badge, the model line, the preview
 * block and the follow-on prose simply do not render. Nothing is announced
 * wrong, and the card is merely poorer. `before` is guarded the same way, and
 * that one costs something — it is a **required** prop whose whole job is to
 * keep the card from reading as an ad, and `before=""` deletes it silently. The
 * docs page's first "don't" is literally that failure, and the type system says
 * the prop is required, so nothing anywhere catches the string that reproduces
 * it.
 *
 * **The `??` defaults do not degrade — they collapse.** `title ?? copy.title`
 * and `description ?? copy.description` only fall back on `undefined`, so `""`
 * survives into the DOM. `description=""` deletes "The run was not started, so
 * nothing was charged", the one sentence on the card that says the user has not
 * been billed. `title=""` is worse: the title carries the `id` that
 * `aria-labelledby` points at, so an empty title leaves `role="group"` with an
 * accessible name of `""` — a card announcing as an unnamed group, with the
 * icon `aria-hidden` and no other text saying which gate fired. Both are
 * asserted below. This is the same shape as H4's `?? "Unknown speaker"` and
 * J7/H7's `label=""` defeating its own default.
 *
 * **Two empties are a red gate and are recorded rather than rendered.**
 * `ctaLabel=""` and `topUpLabel=""` reach `ctaLabel ?? copy.cta` and the
 * `topUpLabel = "Top up"` default parameter respectively; both keep the empty
 * string, and a `<Button>` with no text and no icon is an outright
 * `button-name` violation under a gate that runs at `test: "error"`. Rendering
 * them would fail the build, so they are written down here — the H4 word-token
 * precedent.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <PaywallMessage
        data-testid="emptied"
        state="locked-model"
        title=""
        description=""
        requirement=""
        model=""
        preview=""
        before=""
        after=""
        prompt={PROMPT}
        cost={{ amount: 900, per: "min" }}
        onUpgrade={() => {}}
      />
      <PaywallMessage
        data-testid="populated"
        state="locked-model"
        requirement="Pro"
        model="Veo 3.1"
        preview="8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt."
        before="I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything."
        after="Upgrading picks this back up exactly where it stopped."
        prompt={PROMPT}
        cost={{ amount: 900, per: "min" }}
        onUpgrade={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptied = canvas.getByTestId("emptied");
    const populated = canvas.getByTestId("populated");
    const slot = (root: HTMLElement, name: string) => root.querySelector(`[data-slot="${name}"]`);

    // The truthiness-guarded slots are absent on the emptied card and present
    // on its twin, so the difference is visible side by side.
    for (const name of [
      "paywall-message-requirement",
      "paywall-message-model",
      "paywall-message-preview",
      "paywall-message-before",
      "paywall-message-after",
    ]) {
      await expect(
        `${name} emptied=${slot(emptied, name) !== null} populated=${slot(populated, name) !== null}`,
      ).toBe(`${name} emptied=false populated=true`);
    }

    // `??` keeps the empty string, so these two render and render blank.
    await expect(slot(emptied, "paywall-message-title")).toHaveTextContent("");
    await expect(slot(populated, "paywall-message-title")).toHaveTextContent(
      "This model is not on your plan",
    );
    await expect(slot(emptied, "paywall-message-description")).toHaveTextContent("");
    await expect(slot(populated, "paywall-message-description")).toHaveTextContent(
      "The run was not started, so nothing was charged.",
    );

    // And the group loses its accessible name with the title, because the title
    // is what `aria-labelledby` points at.
    await expect(slot(emptied, "paywall-message-card")).toHaveAccessibleName("");
    await expect(slot(populated, "paywall-message-card")).toHaveAccessibleName(
      "This model is not on your plan",
    );

    // What survives on the emptied card: the held work, and a named CTA. The
    // prompt is required and unguarded, which is the one thing this component
    // refuses to lose.
    await expect(slot(emptied, "paywall-message-prompt")).toHaveTextContent(PROMPT);
    await expect(canvas.getAllByRole("button", { name: "Upgrade to use this model" })).toHaveLength(2);
  },
};

/**
 * A 91-character prompt and a 66-character repo-id model name, which is where
 * this card's one layout decision shows: **it wraps everything and truncates
 * nothing.** The resume block is a `flex-col` of unclamped `<p>` and `<span>`,
 * so a long prompt grows the card downward rather than clipping — right for a
 * paywall, because a truncated prompt is a prompt the user cannot verify was
 * kept, which is the entire promise of the component.
 *
 * The model slug is the interesting half. `stabilityai/stable-video-…` has no
 * spaces, so its only break opportunities are its slash and its hyphens; the
 * play measures that it does break there, onto two lines, and stays inside the
 * block rather than pushing the card wide. A slug with no separators at all
 * would have nothing to break on and there is no `break-words` to fall back to
 * — the vendored `Card` is `overflow-hidden`, so that string would be **clipped
 * by the card**, silently truncating the one field the component exists to keep
 * verbatim. Grounded on the card's computed overflow rather than rendered with
 * a model id no host could emit.
 *
 * The requirement badge is the other thing a long string reaches, and it does
 * not wrap: `Badge` is `whitespace-nowrap shrink-0 overflow-hidden` inside
 * `CardHeader`'s `grid-cols-[1fr_auto]`, so a long plan name takes its width
 * straight out of the title's column. The second card swaps "Pro" for "Studio
 * (annual billing)" and nothing else, and the play measures the title column
 * narrowing by exactly that much in the same card width. A plan name is a
 * layout input here, not a caption — the same finding E7 `member-gate-row`
 * recorded for its tier badge.
 */
export const LongContent: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <PaywallMessage
        data-testid="short-tier"
        state="locked-model"
        requirement="Pro"
        prompt={LONG_PROMPT}
        model={LONG_MODEL}
        preview={LONG_PREVIEW}
        cost={{ amount: 1200, per: "min" }}
        before="I have the sequence ready, but that checkpoint is not on your current plan, so I stopped before spending anything."
        after="The prompt and the exact checkpoint are held here, so upgrading resumes this rather than restarting it."
        onUpgrade={() => {}}
      />
      <PaywallMessage
        data-testid="long-tier"
        state="locked-model"
        requirement="Studio (annual billing)"
        prompt={LONG_PROMPT}
        model={LONG_MODEL}
        preview={LONG_PREVIEW}
        cost={{ amount: 1200, per: "min" }}
        before="I have the sequence ready, but that checkpoint is not on your current plan, so I stopped before spending anything."
        after="The prompt and the exact checkpoint are held here, so upgrading resumes this rather than restarting it."
        onUpgrade={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shortTier = canvas.getByTestId("short-tier");
    const longTier = canvas.getByTestId("long-tier");
    const slot = (root: HTMLElement, name: string) =>
      root.querySelector(`[data-slot="${name}"]`) as HTMLElement;
    const lines = (el: HTMLElement) =>
      Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));

    // Wrapped, not clipped: more than one line and nothing overflowing.
    const prompt = slot(shortTier, "paywall-message-prompt");
    await expect(
      `prompt lines>1=${lines(prompt) > 1} clipped=${prompt.scrollWidth > prompt.clientWidth}`,
    ).toBe("prompt lines>1=true clipped=false");

    // The slug breaks on its own separators and stays inside the resume block.
    const model = slot(shortTier, "paywall-message-model");
    const resume = slot(shortTier, "paywall-message-resume");
    await expect(
      `model lines=${lines(model)} overflows=${model.scrollWidth > model.clientWidth}` +
        ` resume overflows=${resume.scrollWidth > resume.clientWidth}`,
    ).toBe("model lines=2 overflows=false resume overflows=false");

    // What happens to a slug with no separators at all is decided one level up:
    // the vendored `Card` is `overflow-hidden`, so an unbreakable token is
    // clipped by the card rather than scrolling the page. Grounded here rather
    // than asserted with a model id that could not exist.
    await expect(`card overflow=${getComputedStyle(slot(shortTier, "paywall-message-card")).overflowX}`).toBe(
      "card overflow=hidden",
    );

    // Nothing sideways at the root of either card.
    for (const card of [shortTier, longTier]) {
      await expect(`card overflows=${card.scrollWidth > card.clientWidth}`).toBe("card overflows=false");
    }

    // The long plan name is paid for by the title, in the same card width.
    const cards = [slot(shortTier, "paywall-message-card"), slot(longTier, "paywall-message-card")];
    await expect(`cards same width=${cards[0].clientWidth === cards[1].clientWidth}`).toBe(
      "cards same width=true",
    );
    const titles = [slot(shortTier, "paywall-message-title"), slot(longTier, "paywall-message-title")];
    await expect(`long tier narrows title=${titles[1].clientWidth < titles[0].clientWidth}`).toBe(
      "long tier narrows title=true",
    );
    const badge = slot(longTier, "paywall-message-requirement");
    await expect(`badge lines=${lines(badge)}`).toBe("badge lines=1");
  },
};

/**
 * 375px, which for this card is the width it actually ships at — it lives in a
 * message stream on a phone as often as anywhere else.
 *
 * Nothing here has a narrow-width branch and nothing needs one: the card is a
 * single `flex-col` at every width, `max-w-md` stops constraining below 448px,
 * and the one row that could run out of room — the actions — is
 * `flex flex-wrap`, so a long CTA beside Top up stacks instead of scrolling.
 * The play measures the frame rather than trusting it, on the widest thing this
 * component can produce: the two-button card, a requirement badge and a price
 * chip all at once.
 *
 * What is worth watching at this width is the header grid. `CardHeader` is
 * `grid-cols-[1fr_auto]` with the badge in the `auto` column, so at 375px the
 * badge still takes its intrinsic width first and the title absorbs the loss by
 * wrapping — which is the right trade here, because the title is the sentence
 * carrying which gate fired and it is allowed to run to two lines, where the
 * badge would have had to clip.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="flex w-[375px] max-w-full flex-col gap-6">
      <PaywallMessage
        state="locked-model"
        requirement="Pro"
        prompt={PROMPT}
        model="Veo 3.1"
        cost={{ amount: 900, per: "min" }}
        preview="8 seconds, 1080p — handheld drift past a ramen counter, sign flicker on wet asphalt."
        before="I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything."
        after="Upgrading picks this back up exactly where it stopped."
        onUpgrade={() => {}}
      />
      <PaywallMessage
        state="feature-locked"
        requirement="Studio"
        prompt="Give the narrator my cloned voice and lip-sync it to the presenter shot"
        model="ElevenLabs v3"
        before="Voice cloning is a Studio feature, so I stopped at the script."
        after="Everything else in this edit is done."
        onUpgrade={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Not `canvasElement.firstElementChild`: `layout: "centered"` plus the
    // meta's own 28rem wrapper sit above the frame, so measuring the first
    // child would measure the centring div and pass for the wrong reason.
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");

    for (const root of canvasElement.querySelectorAll('[data-slot="paywall-message"]')) {
      await expect(`root overflows=${root.scrollWidth > root.clientWidth}`).toBe("root overflows=false");
    }
    for (const block of canvasElement.querySelectorAll('[data-slot="paywall-message-resume"]')) {
      await expect(`resume overflows=${block.scrollWidth > block.clientWidth}`).toBe(
        "resume overflows=false",
      );
    }

    // Two buttons and a badge at 375px, and the actions row wraps rather than
    // scrolling — so both controls stay reachable and fully hittable.
    const actions = canvasElement.querySelector('[data-slot="paywall-message-actions"]') as HTMLElement;
    await expect(`actions wrap=${getComputedStyle(actions).flexWrap}`).toBe("actions wrap=wrap");
    for (const button of within(canvasElement).getAllByRole("button")) {
      const r = button.getBoundingClientRect();
      await expect(
        `${button.textContent} fits=${Math.round(r.width) <= 375} tall enough=${r.height >= 24}`,
      ).toBe(`${button.textContent} fits=true tall enough=true`);
    }
  },
};

/**
 * Three ways of telling someone they cannot run the thing they just asked for,
 * chosen by one question: **is the answer no, not yet, or not now** — and
 * whether the user asked a question at all.
 *
 * - **Paywall message (M5)** — the answer is *no, until you buy something*, and
 *   they asked. It replaces the result in the stream, holds the prompt and the
 *   model so upgrading resumes rather than restarts, and the agent's own prose
 *   wraps it. Reach for it the moment a specific run is refused for a plan
 *   reason.
 * - **Rate limit banner (M6)** — the answer is *not yet, and waiting fixes it*.
 *   Nothing has to be bought, so it counts down instead of selling, and it
 *   distinguishes the cap you bought from a model that is busy. It sits above
 *   the composer because the constraint outlives any one message.
 * - **Promo card (B5)** — nobody asked. It is the only paywall placement not
 *   attached to an action, so it is the only one that is dismissible and the
 *   only one that has to persist that dismissal.
 *
 * So: a paywall that is not replacing a refused run has become a promo card,
 * and a promo card that names the exact prompt someone just wrote should have
 * been a paywall message. The tell is whether there is a held payload — if
 * `onUpgrade` has nothing to resume, this is the wrong component.
 *
 * **Choosing between M5's own three states** is a second question, and it is
 * about what the money would buy. `quota-exhausted` is the only one where more
 * credits are the fix, which is why it is the only state that offers Top up
 * unconditionally; on `locked-model` and `feature-locked` the card offers a
 * top-up only if the contract separately derives a shortfall, because selling
 * credits for a model you are not allowed to run sells the wrong thing.
 * `locked-model` and `feature-locked` differ in what is missing: a specific
 * model against a capability, which is why the held payload carries `model` and
 * the copy differs. If waiting would fix it, none of the three is right — that
 * is M6.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Paywall message — a specific run refused, with the work held
        </p>
        <PaywallMessage
          state="locked-model"
          requirement="Pro"
          prompt={PROMPT}
          model="Veo 3.1"
          cost={{ amount: 900, per: "min" }}
          before="I have the shot ready to go, but Veo 3.1 is not on your current plan, so I stopped before spending anything."
          after="Upgrading picks this back up exactly where it stopped."
          onUpgrade={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Rate limit banner — the same wall, but waiting is the fix
        </p>
        <RateLimitBanner
          cause="your-limit"
          resource="Video generations · 20 of 20 used today"
          remainingSeconds={1847}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Promo card — the pitch, attached to nothing anyone asked
        </p>
        <PromoCard
          flavour="upgrade"
          title="Upgrade to Pro"
          description="Higher resolutions, longer clips, and priority queue time."
          ctaLabel="See plans"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The structural difference, asserted rather than described: only the
    // paywall holds a payload, and only the promo can be dismissed.
    await expect(canvasElement.querySelector('[data-slot="paywall-message-prompt"]')).toHaveTextContent(
      PROMPT,
    );
    await expect(canvasElement.querySelector('[data-slot="rate-limit-banner"]')).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();

    // And the countdown is M6's alone — nothing on the paywall implies waiting
    // will help, because it will not.
    await expect(canvasElement.querySelector('[data-slot="paywall-message"]')?.textContent).not.toMatch(
      /resets in/i,
    );
  },
};
