import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { ConnectionManager, type ConnectionProvider } from "@/registry/super-ai/connection-manager";
import { EnvStatus } from "@/registry/super-ai/env-status";
import { ConnectionManagerDocs } from "@/content/components/connection-manager.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof ConnectionManager> = {
  title: "Super AI/Connection Manager",
  component: ConnectionManager,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ConnectionManagerDocs) } },
};

export default meta;
type Story = StoryObj<typeof ConnectionManager>;

/** Nothing stored: a labelled password field, and nothing to test yet. */
export const NotSet: Story = {
  args: {
    label: "Model providers",
    description: "Bring your own keys, or run a model on this machine.",
    providers: [{ id: "openai", name: "OpenAI", status: "not-set" }],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Stored and verified. The key is a fingerprint from here on, never a value. */
export const Valid: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "openai",
        name: "OpenAI",
        status: "valid",
        fingerprint: "sk-live ···· 4f2a",
        testedAt: "Tested 4 minutes ago",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** The provider answered, and refused the key. The user's problem: replace it. */
export const Invalid: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "anthropic",
        name: "Anthropic",
        status: "invalid",
        fingerprint: "sk-ant ···· 91bd",
        testedAt: "Tested just now",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Not the user's problem. Opposite advice to Invalid, and deliberately no Replace key. */
export const Unreachable: Story = {
  args: {
    label: "Model providers",
    providers: [
      {
        id: "replicate",
        name: "Replicate",
        status: "unreachable",
        fingerprint: "r8 ···· 0c17",
        testedAt: "Tested 30 seconds ago",
      },
    ],
    onSaveKey: () => {},
    onTest: () => {},
  },
};

/** Hardware requirements on the same row, stated before the download — and blocking it. */
export const LocalModel: Story = {
  args: {
    label: "Local models",
    providers: [
      {
        id: "llama",
        name: "Llama 3.1 8B",
        status: "not-set",
        local: {
          size: "4.7 GB",
          requirements: [
            { label: "Memory", value: "16 GB RAM", met: true },
            { label: "Disk", value: "12 GB free", met: true },
            { label: "Accelerator", value: "Apple silicon or CUDA GPU", met: false },
          ],
        },
      },
    ],
    onDownload: () => {},
    onTest: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a settings page meets, as opposed to the five
 * prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true for this component, so there are no `case-skip` lines.
 * That follows from the shape: a card of rows carrying author-supplied
 * provider names, a real `<input type="password">` and four buttons whose
 * presence is decided by the row's state, one `animate-spin` on the in-flight
 * test, a `providers`-in / callbacks-out pair that is controlled in every
 * sense the convention asks about, and a near-twin the spec names outright
 * (N7 `env-status`).
 * ---------------------------------------------------------------------- */

const FINGERPRINT = "sk-live ···· 4f2a";
/** Arabic for "tested 4 minutes ago" — what an RTL shell localises `testedAt` to. */
const TESTED_AR = "اختبر قبل 4 دقائق";

const boxes = {
  left: (el: Element) => el.getBoundingClientRect().left,
  right: (el: Element) => el.getBoundingClientRect().right,
};

/**
 * Right-to-left. The row is A9 `entity-row` — icon, then title and the
 * fingerprint line, so under `dir="rtl"` the status glyph has to sit at the
 * **right** edge with the text running away from it. The key field is the
 * second directional claim: `Input` then `Save key` in one flex row, so Save
 * must land to the *left* of the field it commits.
 *
 * A wrapper `<div dir="rtl">` is enough here, unlike the portalled components
 * in this registry: nothing in this tree renders through a portal, so the
 * wrapper's direction is the one the whole card computes against.
 *
 * **The mirror is free, because nothing in the file picks a side.**
 * `connection-manager.tsx` carries no `pl-`/`ml-`/`border-l`/`text-left` at
 * all — every edge it sets is symmetric (`px-3`, `py-1`, `gap-2`) — and A9
 * already swapped to `text-start`. There was no logical-property sweep to make
 * here, which is worth stating because the absence of a fix is otherwise
 * indistinguishable from an unexamined file.
 *
 * **The fingerprint line is a bidi seam, and it happens to resolve
 * correctly.** `secondary.join(" · ")` concatenates a Latin fingerprint, a
 * neutral `·` and a localised `testedAt` into one text node with no `<bdi>`
 * isolation — the shape D5 `quote-reply` recorded on its `<cite>`. Measured
 * here it reads right: each segment is a single directional run, so the
 * fingerprint takes the rightmost position and the Arabic phrase sits to its
 * left, which is source order under RTL. The isolation is still absent, so a
 * segment that mixes scripts *internally* would reorder around the separator;
 * this story proves the common case, not the general one.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <ConnectionManager
        label="مزودو النماذج"
        providers={[
          { id: "openai", name: "OpenAI", status: "not-set" },
          {
            id: "anthropic",
            name: "Anthropic",
            status: "valid",
            fingerprint: FINGERPRINT,
            testedAt: TESTED_AR,
          },
        ]}
        onSaveKey={() => {}}
        onTest={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    await expect(getComputedStyle(root).direction).toBe("rtl");

    // The glyph leads the row, so it paints at the right edge.
    const notSet = root.querySelector<HTMLElement>('[data-provider-id="openai"]')!;
    const entity = notSet.querySelector<HTMLElement>('[data-slot="entity-row"]')!;
    const icon = entity.querySelector<HTMLElement>('[data-slot="entity-row-icon"]')!;
    const title = entity.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(`icon right of title: ${boxes.right(icon) > boxes.right(title)}`).toBe(
      "icon right of title: true",
    );
    // A9's swap, proved by the resolved value rather than by the class list.
    await expect(getComputedStyle(entity).textAlign).toBe("start");

    // Save commits the field beside it, and lands on the inline-end side of it.
    const input = notSet.querySelector<HTMLElement>('[data-slot="connection-manager-key-input"]')!;
    const save = within(notSet).getByRole("button", { name: "Save key" });
    await expect(`save left of input: ${boxes.right(save) <= boxes.left(input)}`).toBe(
      "save left of input: true",
    );

    // The bidi seam in the joined description line.
    const valid = root.querySelector<HTMLElement>('[data-provider-id="anthropic"]')!;
    const description = valid.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(description.childNodes).toHaveLength(1);
    const text = description.firstChild as Text;
    await expect(text.data).toBe(`${FINGERPRINT} · ${TESTED_AR}`);
    const rectOf = (from: number, to: number) => {
      const range = document.createRange();
      range.setStart(text, from);
      range.setEnd(text, to);
      return range.getBoundingClientRect();
    };
    const latin = rectOf(0, FINGERPRINT.length);
    const arabic = rectOf(text.data.length - TESTED_AR.length, text.data.length);
    await expect(`fingerprint right of localised time: ${latin.left >= arabic.right}`).toBe(
      "fingerprint right of localised time: true",
    );
  },
};

/**
 * The only thing in this component that moves is the spinner beside
 * `Test connection` while `testing` is set, and it now branches:
 * `motion-reduce:animate-none` beside the `animate-spin`, the house idiom, so
 * `animation-name` reads back `"none"` under emulated reduce instead of
 * `"spin"`. That class was missing and is a mechanical fix landed in this wave
 * (spec §3.4) — the assertion below was written first and failed with
 * `animation-name: spin`, so it is a check that can fail rather than one the
 * primitive was going to satisfy anyway (the H1 `transport-controls` trap).
 *
 * Nothing else in the file animates. The vendored `Button`'s `transition-all`
 * press nudge is registry-wide chrome recorded in `CONTINUE.md` §8, not this
 * component's branch, and the vendored `Input`'s `transition-colors` only
 * crossfades a border, which mechanical fact 3 says is not motion.
 *
 * **Suppressing the spin costs nothing, and that is what the pairing below
 * proves.** E4 `preset-grid` loses the only signal separating loading from
 * failed when its pulse stops, and K5 `source-panel`'s stalled bar starts
 * reading as finished. Here both halves of the live region change with
 * `testing` — "Testing this connection…" over a sentence promising the verdict
 * — and the button relabels to "Testing…" and disables. A reduced-motion user
 * and an animated one are told the same thing, asserted here beside a settled
 * row so the two are provably distinguishable without the spinner.
 */
export const ReducedMotion: Story = {
  render: () => (
    <ConnectionManager
      label="Model providers"
      providers={[
        {
          id: "openai",
          name: "OpenAI",
          status: "valid",
          fingerprint: FINGERPRINT,
          testedAt: "Tested 4 minutes ago",
          testing: true,
        },
        {
          id: "anthropic",
          name: "Anthropic",
          status: "valid",
          fingerprint: "sk-ant ···· 91bd",
          testedAt: "Tested 4 minutes ago",
        },
      ]}
      onSaveKey={() => {}}
      onTest={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    const testing = root.querySelector<HTMLElement>('[data-provider-id="openai"]')!;
    const settled = root.querySelector<HTMLElement>('[data-provider-id="anthropic"]')!;

    const spinner = testing.querySelector<HTMLElement>("svg.animate-spin")!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");

    // The state survives the suppression, in words, in both places it is said.
    const condition = testing.querySelector<HTMLElement>('[data-slot="connection-manager-condition"]')!;
    await expect(condition).toHaveTextContent("Testing this connection…");
    await expect(within(testing).getByRole("button", { name: "Testing…" })).toBeDisabled();

    // …and the two rows are distinguishable with no motion at all.
    const settledCondition = settled.querySelector<HTMLElement>(
      '[data-slot="connection-manager-condition"]',
    )!;
    await expect(settledCondition.textContent).not.toBe(condition.textContent);
    await expect(within(settled).getByRole("button", { name: "Test connection" })).toBeEnabled();
  },
};

const KEYBOARD_PROVIDERS: ConnectionProvider[] = [
  { id: "openai", name: "OpenAI", status: "not-set" },
  {
    id: "anthropic",
    name: "Anthropic",
    status: "valid",
    fingerprint: "sk-ant ···· 91bd",
    testedAt: "Tested 4 minutes ago",
  },
  {
    id: "replicate",
    name: "Replicate",
    status: "unreachable",
    fingerprint: "r8 ···· 0c17",
    testedAt: "Tested 30 seconds ago",
  },
];

/**
 * **How many stops a row has is decided by its state**, which is the whole
 * keyboard contract and is asserted here rather than left to the docs page.
 * Three rows in three states offer four stops between them: the untouched
 * provider offers its key field (and *not* its Save button, which is
 * `disabled` while the field is empty), the connected one offers
 * `Test connection` and `Replace key`, and the unreachable one offers
 * `Test connection` alone. That last count is this component's central
 * decision made keyboard-visible — a provider that never rejected your key
 * gives you no way to replace it, deliberately.
 *
 * **A visible focus treatment at every stop, proved twice.** Mechanical fact 5
 * asks for both checks because they answer different questions.
 * `settledFocusRing` waits for the ring to arrive, since the vendored `Button`
 * fades it in through `transition-all` and an immediate read is a false
 * negative; the differential against a resting signature taken before the walk
 * proves focus is what painted it rather than a permanent shadow. Both are
 * needed here, because the four stops are two different primitives: `Input`
 * moves its *border* colour on focus, and `Button` composes five ring layers
 * that are always present and transparent when off.
 *
 * **Recorded, not asserted — three ways this flow loses the user's place.**
 * Each is behavioural (spec §3.4) and each is already in the docs module's
 * focus notes; all three were measured again while writing this walk. Pressing
 * `Replace key` unmounts `Replace key`, so the press that opens the field
 * destroys the control holding focus and `document.activeElement` falls to
 * `<body>`. Committing with `Save key` does the same, at the end of the one
 * flow on this page most likely to be keyboard-driven. And `Enter` in the key
 * field does nothing at all, because the field is not inside a `<form>` and
 * Save is a plain `onClick`. Nothing below asserts any of the three — pinning
 * them green is the forbidden move — so the walk stops where the component
 * behaves as designed.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <ConnectionManager
      label="Model providers"
      providers={KEYBOARD_PROVIDERS}
      onSaveKey={() => {}}
      onTest={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    const row = (id: string) => root.querySelector<HTMLElement>(`[data-provider-id="${id}"]`)!;

    const notSet = row("openai");
    const valid = row("anthropic");
    const unreachable = row("replicate");

    const input = notSet.querySelector<HTMLElement>('[data-slot="connection-manager-key-input"]')!;
    const save = within(notSet).getByRole("button", { name: "Save key" });
    const testValid = within(valid).getByRole("button", { name: "Test connection" });
    const replaceValid = within(valid).getByRole("button", { name: "Replace key" });
    const testUnreachable = within(unreachable).getByRole("button", { name: "Test connection" });

    // The state decides the offer: no Replace key where the key was never
    // rejected, and no Save stop while there is nothing to save.
    await expect(within(unreachable).queryByRole("button", { name: "Replace key" })).toBeNull();
    await expect(save).toBeDisabled();

    const stops = [input, testValid, replaceValid, testUnreachable];
    // Resting signatures, taken before anything is focused, so each stop is
    // asserted against its own baseline rather than against an absolute.
    const resting = new Map(stops.map((el) => [el, focusTreatmentSignature(el)]));
    const nameOf = (el: Element | null) => {
      if (el === null) return "nothing";
      const owner = el.closest("[data-provider-id]")?.getAttribute("data-provider-id") ?? "outside";
      const own = el.getAttribute("data-slot") ?? el.textContent?.trim() ?? el.tagName.toLowerCase();
      return `${owner}/${own}`;
    };

    await userEvent.tab();
    for (const stop of stops) {
      await expect(nameOf(document.activeElement)).toBe(nameOf(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(resting.get(stop)));
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last row is outside the card.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // One character is what makes Save reachable, and it becomes the stop
    // immediately after the field — the order the flow needs.
    await userEvent.click(input);
    await userEvent.keyboard("x");
    await expect(save).toBeEnabled();
    await userEvent.tab();
    await expect(nameOf(document.activeElement)).toBe(nameOf(save));
    await settledFocusRing(save, waitFor);
  },
};

/** A host that applies what it is told, and nothing more. */
function ControlledHost({ onSaveKey }: { onSaveKey: (providerId: string, key: string) => void }) {
  const [providers, setProviders] = React.useState<ConnectionProvider[]>([
    { id: "openai", name: "OpenAI", status: "not-set" },
  ]);
  const [renders, setRenders] = React.useState(0);

  return (
    <div className="flex flex-col gap-3" data-testid="controlled-host">
      <ConnectionManager
        label="Applies the result"
        providers={providers}
        onSaveKey={(providerId, key) => {
          onSaveKey(providerId, key);
          // Saving stored a credential and proved nothing about it, so the row
          // gets a fingerprint while its status stays `not-set` — the
          // saved-but-untested reading. Never `valid`: that is the docs
          // module's fourth pitfall, made executable.
          setProviders((current) =>
            current.map((provider) =>
              provider.id === providerId
                ? { ...provider, fingerprint: `sk-live ···· ${key.slice(-4)}` }
                : provider,
            ),
          );
        }}
        onTest={() => {}}
      />
      {/* A host re-render for reasons of its own, with the identical array. */}
      <button type="button" data-testid="host-rerender" onClick={() => setRenders((n) => n + 1)}>
        Re-render host ({renders})
      </button>
    </div>
  );
}

/**
 * `providers` is the value and the callbacks are the only way anything moves,
 * so the convention's three controlled assertions all have a subject here —
 * and the security question this component exists to answer rides on the same
 * proof.
 *
 * **Interaction alone moves nothing.** The second card's `onSaveKey` applies
 * no result. Typing a key and pressing Save leaves it reading "Not connected.
 * No key is saved for this provider." — the component reports no verdict and
 * invents no state from having been used.
 *
 * **The callback carries what a consumer needs to apply it.** `(providerId,
 * key)`, exactly once, and the first card's host turns that into a fingerprint
 * on the same row. What comes back is `not-set` *with* a fingerprint, so the
 * row reads "Saved, but never tested" — the state that makes the separate test
 * action worth pressing.
 *
 * **What the key field exposes afterwards: nothing.** There is no `keyValue`
 * prop to read back and no reveal toggle to press, and that is asserted rather
 * than described: after Save, no `<input>` in the tree holds the typed string,
 * the serialised DOM does not contain it, and the only characters left on
 * screen are the four the *host* chose to echo into its fingerprint. The field
 * is `type="password"` with `autocomplete="off"` throughout, so the value was
 * never rendered as text and was never offered to a browser credential store.
 *
 * **A host re-render holds everything fixed, including an unfinished paste.**
 * Re-rendering with the identical array leaves both cards' rendered state
 * unchanged, and the uncontrolled input keeps a draft the user has not
 * committed — a host that re-rendered mid-paste and ate the key would be worse
 * than one that never re-rendered.
 *
 * **Recorded, not asserted:** which row has its key field open is internal
 * (`editingId`), with no prop and no callback, so a host swapping `providers`
 * cannot close a field it did not open — the host-unreachable-state shape E4
 * `preset-grid`, J2 `filter-panel` and J4 `artifact-grid` are already recorded
 * under. This is the mildest form of it: the field holds nothing worth losing,
 * because the draft is all that is in it and its row is identified by `id`.
 */
export const Controlled: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <ControlledHost onSaveKey={fn().mockName("onSaveKey (applying host)")} />
      <div data-testid="refusing-host">
        <ConnectionManager
          label="Applies nothing"
          providers={[{ id: "mistral", name: "Mistral", status: "not-set" }]}
          onSaveKey={fn().mockName("onSaveKey (refusing host)")}
          onTest={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const TYPED = "example-connection-key-0000";
    const scope = (testId: string) => canvasElement.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!;
    const conditionIn = (host: HTMLElement, providerId: string) =>
      host.querySelector<HTMLElement>(
        `[data-provider-id="${providerId}"] [data-slot="connection-manager-condition"]`,
      )!;

    // 1. Interaction alone does not move the rendered value.
    const refusing = scope("refusing-host");
    const refusingBefore = conditionIn(refusing, "mistral").textContent;
    await expect(refusingBefore).toBe("Not connected. No key is saved for this provider.");
    const refusingInput = refusing.querySelector<HTMLInputElement>(
      '[data-slot="connection-manager-key-input"]',
    )!;
    await userEvent.click(refusingInput);
    await userEvent.paste(TYPED);
    await userEvent.click(within(refusing).getByRole("button", { name: "Save key" }));
    await expect(conditionIn(refusing, "mistral").textContent).toBe(refusingBefore);
    await expect(refusing.querySelector<HTMLElement>('[data-provider-id="mistral"]')!.dataset.status).toBe(
      "not-set",
    );

    // 2. The callback carries the payload, and an applying host lands on
    //    saved-but-untested rather than on `valid`.
    const applying = scope("controlled-host");
    const applyingInput = applying.querySelector<HTMLInputElement>(
      '[data-slot="connection-manager-key-input"]',
    )!;
    await userEvent.click(applyingInput);
    await userEvent.paste(TYPED);
    await userEvent.click(within(applying).getByRole("button", { name: "Save key" }));
    await waitFor(() =>
      expect(conditionIn(applying, "openai").textContent).toBe(
        "Saved, but never tested. Nothing has checked this key yet.",
      ),
    );
    const openai = applying.querySelector<HTMLElement>('[data-provider-id="openai"]')!;
    await expect(openai.dataset.status).toBe("not-set");
    await expect(openai.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!.textContent).toBe(
      "sk-live ···· 0000",
    );

    // 3. What the field exposes afterwards: nothing.
    const everyInput = Array.from(canvasElement.querySelectorAll("input"));
    await expect(everyInput.map((el) => el.value).join("|")).toBe("");
    await expect(`key survives in the DOM: ${canvasElement.innerHTML.includes(TYPED)}`).toBe(
      "key survives in the DOM: false",
    );
    await expect(refusingInput.type).toBe("password");
    await expect(refusingInput.autocomplete).toBe("off");
    await expect(within(canvasElement).queryByRole("button", { name: /show|reveal/i })).toBeNull();

    // 4. Re-rendering with an unchanged value holds it fixed — and keeps an
    //    uncommitted draft.
    await userEvent.click(refusingInput);
    await userEvent.paste("half-typed");
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="host-rerender"]')!);
    await expect(conditionIn(applying, "openai").textContent).toBe(
      "Saved, but never tested. Nothing has checked this key yet.",
    );
    await expect(conditionIn(refusing, "mistral").textContent).toBe(refusingBefore);
    await expect(refusingInput.value).toBe("half-typed");
  },
};

/**
 * Every optional text slot emptied at once, because three of the five states
 * are failures and a failure that cannot name itself is the one that costs
 * someone a working credential.
 *
 * **What holds.** The condition and the remedy are never author-supplied —
 * they come from the component's own tables — so every row still states what
 * it is *and* what to do about it however little the caller passed. That is
 * asserted for all three rows here, and it is the contract that makes the rest
 * survivable. A requirement whose `met` is undefined correctly says nothing:
 * no `data-met`, no "— met" and no "— this machine does not meet it", because
 * a host that cannot detect a capability must not be made to guess. And the
 * key field keeps an accessible name with no provider name to build one from,
 * so the empty case is not an axe failure.
 *
 * **Three collapses, recorded rather than pinned.** Each is behavioural
 * (spec §3.4), each was measured in this story, and none is asserted:
 *
 * 1. `fingerprint=""` puts the row in a state it should not be able to reach.
 *    `untested` is computed as `fingerprint !== undefined` while the display
 *    line is guarded on `if (fingerprint)` — two different truthiness tests on
 *    one field — so the row states "Saved, but never tested", offers
 *    `Replace key` and `Test connection`, and shows no fingerprint at all. It
 *    claims a stored credential and displays no evidence of one.
 * 2. `name=""` degrades the key field's label from "OpenAI API key" to
 *    "API key". Non-empty, so no rule fires; but two unnamed providers produce
 *    two fields with the same name, the per-row naming contract that has
 *    already failed on `property-inspector`, `context-chips`, `result-card`
 *    and `thread-list`.
 * 3. `label=""` defeats its own `label = "Connections"` default and leaves the
 *    card titleless. Silent, because `CardTitle` renders a `<div>` rather than
 *    a heading — so the list has no programmatic heading either way, and the
 *    empty case takes away the only visible one. Same shape as J7 and H7.
 */
export const EmptyLabel: Story = {
  render: () => (
    <ConnectionManager
      label=""
      providers={[
        { id: "unnamed", name: "", status: "not-set" },
        { id: "blank-fingerprint", name: "Anthropic", status: "not-set", fingerprint: "" },
        {
          id: "llama",
          name: "Llama 3.1 8B",
          status: "not-set",
          local: { requirements: [{ label: "Memory", value: "16 GB RAM" }] },
        },
      ]}
      onSaveKey={() => {}}
      onTest={() => {}}
      onDownload={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    const row = (id: string) => root.querySelector<HTMLElement>(`[data-provider-id="${id}"]`)!;

    // No `description` passed means no description element, rather than an
    // empty one holding the slot open.
    await expect(root.querySelector('[data-slot="card-description"]')).toBeNull();

    // Every row still says what it is and what to do, whatever was emptied.
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="connection-manager-provider"]'));
    await expect(rows).toHaveLength(3);
    for (const provider of rows) {
      const id = provider.dataset.providerId;
      const condition = provider.querySelector<HTMLElement>('[data-slot="connection-manager-condition"]')!;
      const remedy = provider.querySelector<HTMLElement>('[data-slot="connection-manager-remedy"]')!;
      await expect(
        `${id}: ${condition.textContent!.length > 0 ? "condition" : "blank"} + ${
          remedy.textContent!.length > 0 ? "remedy" : "blank"
        }`,
      ).toBe(`${id}: condition + remedy`);
    }

    // The key field is still named, with nothing to name it after.
    const unnamedField = row("unnamed").querySelector<HTMLInputElement>(
      '[data-slot="connection-manager-key-input"]',
    )!;
    await expect(within(row("unnamed")).getByLabelText(/API key/)).toBe(unnamedField);

    // An undetectable requirement says nothing rather than guessing, and does
    // not block the download.
    const requirement = row("llama").querySelector<HTMLElement>(
      '[data-slot="connection-manager-requirement"]',
    )!;
    await expect(requirement.hasAttribute("data-met")).toBe(false);
    await expect(requirement.textContent).toBe("Memory: 16 GB RAM");
    await expect(row("llama").querySelector('[data-slot="connection-manager-blocked"]')).toBeNull();
    await expect(within(row("llama")).getByRole("button", { name: "Download model" })).toBeEnabled();
  },
};

const LONG_NAME = "Meta Llama 3.1 8B Instruct, Q4_K_M quantized build for Apple silicon and CUDA GPUs";
const UNREACHABLE_REMEDY =
  "Keep the saved key — it was not rejected, and replacing it will not help. Check the provider's status page and test again shortly.";

/**
 * ~90 characters in every author-supplied slot, and the answer is different in
 * each — which is the decision worth recording, because two of the three are
 * inherited from A9 `entity-row` rather than chosen here.
 *
 * **The failure text never truncates, and that is the one that matters.**
 * `unreachable` carries this component's longest remedy, and condition and
 * remedy are plain paragraphs with no clamp: the sentence that tells someone
 * *not* to rotate a working key renders in full or the component has failed at
 * its only job. Asserted as an exact string plus an unclipped box, at the
 * card's own width.
 *
 * **The fingerprint line wraps, because this component reached into A9 to make
 * it.** A9 truncates its description to one line, which is right for a menu
 * row and wrong for a line carrying a fingerprint *and* a test time;
 * `ENTITY_ROW_WRAP` rebinds it to `whitespace-normal` at the call site. The
 * story proves the override survives — a long fingerprint plus a long
 * `testedAt` wraps to a second line instead of losing the time.
 *
 * **The provider name still truncates, and there is no way to read the rest.**
 * A9's title keeps `truncate`, so an 82-character model name is clipped with an
 * ellipsis. The clip is A9's documented decision and is asserted here. What is
 * *recorded rather than asserted* is that nothing recovers the hidden text: A9
 * sets no `title` attribute and offers no tooltip slot, so two local builds of
 * one model differing only in their quantisation suffix are indistinguishable
 * on this page. Fixing that means changing A9, which is another component's
 * file.
 */
export const LongContent: Story = {
  render: () => (
    <ConnectionManager
      label="Model providers, including community and locally hosted builds"
      description="Bring your own keys, or run a model on this machine. Keys are stored write-only."
      providers={[
        {
          id: "replicate",
          name: "Replicate (organisation account, shared across the workspace)",
          status: "unreachable",
          fingerprint: "r8 ···· 0c17",
          testedAt: "Tested 30 seconds ago from the eu-west region worker, after two automatic retries",
        },
        {
          id: "llama",
          name: LONG_NAME,
          status: "not-set",
          local: {
            size: "4.7 GB",
            requirements: [
              {
                label: "Accelerator",
                value: "Apple silicon (M1 or newer) or an NVIDIA GPU with CUDA 12 and 8 GB of VRAM",
                met: false,
              },
            ],
          },
        },
      ]}
      onSaveKey={() => {}}
      onTest={() => {}}
      onDownload={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    const row = (id: string) => root.querySelector<HTMLElement>(`[data-provider-id="${id}"]`)!;
    const unclipped = (el: HTMLElement) =>
      el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;

    // The advice not to rotate a working key, in full and unclipped.
    const remedy = row("replicate").querySelector<HTMLElement>('[data-slot="connection-manager-remedy"]')!;
    await expect(remedy.textContent).toBe(UNREACHABLE_REMEDY);
    await expect(`remedy unclipped: ${unclipped(remedy)}`).toBe("remedy unclipped: true");
    await expect(getComputedStyle(remedy).whiteSpace).toBe("normal");

    // The call-site override on A9's description survives, and wraps.
    const description = row("replicate").querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;
    await expect(getComputedStyle(description).whiteSpace).toBe("normal");
    await expect(`description unclipped: ${unclipped(description)}`).toBe("description unclipped: true");
    // Line boxes, counted rather than inferred from a height: a Range over the
    // text node returns one rect per rendered line, so two rects is the wrap
    // itself and not a computed line-height that could read `normal`.
    const descriptionRange = document.createRange();
    descriptionRange.selectNodeContents(description.firstChild!);
    await expect(`description line boxes: ${descriptionRange.getClientRects().length >= 2}`).toBe(
      "description line boxes: true",
    );

    // A9's title keeps its clamp: clipped, ellipsised, one line.
    const title = row("llama").querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(title.textContent).toBe(LONG_NAME);
    await expect(`name length: ${LONG_NAME.length >= 80}`).toBe("name length: true");
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");
    await expect(getComputedStyle(title).whiteSpace).toBe("nowrap");
    await expect(`title truncated: ${title.scrollWidth > title.clientWidth}`).toBe("title truncated: true");

    // A long requirement wraps rather than pushing the card sideways, and the
    // blocked sentence still lands under it.
    const requirement = row("llama").querySelector<HTMLElement>(
      '[data-slot="connection-manager-requirement"]',
    )!;
    await expect(`requirement unclipped: ${unclipped(requirement)}`).toBe("requirement unclipped: true");
    await expect(row("llama").querySelector('[data-slot="connection-manager-blocked"]')).not.toBeNull();
    await expect(`card overflows: ${root.scrollWidth > root.clientWidth}`).toBe("card overflows: false");
  },
};

/**
 * 375px, wrapper-constrained. The card is `w-full max-w-xl`, so the frame is
 * what decides its width here rather than the max — and there are no `sm:` or
 * `md:` variants in `connection-manager.tsx` at all, so unlike `preset-grid`
 * and `generation-wizard` this really is the phone layout rather than a
 * desktop grid squeezed narrow. The one breakpoint in the tree is the vendored
 * `Input`'s `md:text-sm`, which still applies inside the frame because the
 * gate's chromium is 1200px wide; it changes type size, not layout.
 *
 * **The row at risk is the key field**, which is why this story is more than a
 * screenshot. `Input` sits beside `Save key` in a single non-wrapping flex row,
 * so at 375px the field has to give up width instead of pushing the button off
 * the card — `w-full min-w-0` is what makes that happen, and `min-w-0` is the
 * half that is easy to lose in a refactor. With a key already stored the row
 * grows a third control (`Cancel`), asserted here too, at the width where three
 * controls in one row is most likely to break.
 *
 * The actions row is the opposite decision: `flex-wrap`, so two buttons stack
 * rather than compress. Both are asserted against the frame's own edges rather
 * than `canvasElement` — the meta's `layout: "centered"` makes the first child
 * a ~1200px centring div, and measuring that would pass for the wrong reason.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="connection-manager-frame" className="w-[375px] max-w-full">
      <ConnectionManager
        label="Model providers"
        description="Bring your own keys, or run a model on this machine."
        providers={[
          { id: "openai", name: "OpenAI", status: "not-set" },
          {
            id: "anthropic",
            name: "Anthropic",
            status: "invalid",
            fingerprint: "sk-ant ···· 91bd",
            testedAt: "Tested just now",
          },
          {
            id: "llama",
            name: "Llama 3.1 8B",
            status: "not-set",
            local: {
              size: "4.7 GB",
              requirements: [
                { label: "Memory", value: "16 GB RAM", met: true },
                { label: "Accelerator", value: "Apple silicon or CUDA GPU", met: false },
              ],
            },
          },
        ]}
        onSaveKey={() => {}}
        onTest={() => {}}
        onDownload={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="connection-manager-frame"]')!;
    const root = frame.querySelector<HTMLElement>('[data-slot="connection-manager"]')!;
    const fits = (el: HTMLElement) => el.scrollWidth <= el.clientWidth + 1;

    await expect(`frame overflows: ${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows: false");
    await expect(`card within frame: ${root.getBoundingClientRect().width <= 375}`).toBe(
      "card within frame: true",
    );

    // The key field gives up width instead of pushing Save off the card.
    const keyField = root.querySelector<HTMLElement>('[data-slot="connection-manager-key-field"]')!;
    await expect(`key field fits: ${fits(keyField)}`).toBe("key field fits: true");
    const edge = frame.getBoundingClientRect().right;
    for (const control of Array.from(root.querySelectorAll<HTMLElement>("button, input"))) {
      const label = control.textContent?.trim() || control.getAttribute("data-slot") || "control";
      await expect(`${label} on screen: ${control.getBoundingClientRect().right <= edge}`).toBe(
        `${label} on screen: true`,
      );
    }

    // Actions wrap rather than compress; requirements wrap rather than scroll.
    for (const actions of Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="connection-manager-actions"]'),
    )) {
      await expect(`actions fit: ${fits(actions)}`).toBe("actions fit: true");
    }
    const requirements = root.querySelector<HTMLElement>('[data-slot="connection-manager-requirements"]')!;
    await expect(`requirements fit: ${fits(requirements)}`).toBe("requirements fit: true");

    // Replacing a key puts a third control in that same non-wrapping row.
    await userEvent.click(
      within(root.querySelector<HTMLElement>('[data-provider-id="anthropic"]')!).getByRole("button", {
        name: "Replace key",
      }),
    );
    const replaceField = root.querySelector<HTMLElement>(
      '[data-provider-id="anthropic"] [data-slot="connection-manager-key-field"]',
    )!;
    await expect(within(replaceField).getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(`three-control row fits: ${fits(replaceField)}`).toBe("three-control row fits: true");
    await expect(`frame still steady: ${frame.scrollWidth > frame.clientWidth}`).toBe(
      "frame still steady: false",
    );
  },
};

const SHARED_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "ollama", name: "Ollama" },
];

/**
 * The identity constraint the spec states, made executable. M7 and N7
 * `env-status` are "two surfaces over one set of facts" and "must not be able
 * to disagree", so both cards below are driven from a single
 * `SHARED_PROVIDERS` array and the story asserts that the names each one
 * renders are that array, in that order. `env-status.tsx` already shapes its
 * `id`/`name` fields to match `ConnectionProvider` for exactly this reason;
 * this is the check that the shaping survives a change to either file.
 *
 * **The choosing rule, from this side.** Reach for `connection-manager` when
 * the question is *what is stored and what should the user do about it* — it
 * owns the key field, the fingerprint, `Test connection` and `Replace key`,
 * and it is the only one of the two that can change anything. Reach for
 * `env-status` when the question is *is it answering right now*: read-only, no
 * input and no button, and its states are reachability (`ok`, `degraded`,
 * `not-running`) rather than configuration. The overlap is one state under two
 * names — M7's `invalid` is N7's `key-invalid` — and it is the only state
 * where the runtime view should send someone here, which is why N7's remedy
 * for it says so in words ("replace the key for this provider in Connections")
 * instead of drawing a red dot.
 *
 * They are not interchangeable in the other direction either: a provider with
 * no key saved has no runtime state at all, and one that is `valid` here can
 * still be `degraded` there. A stored key says nothing about whether the
 * request will return.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <div data-testid="configuration">
        <ConnectionManager
          label="Connections"
          description="What is stored, and what to do about it."
          providers={[
            {
              ...SHARED_PROVIDERS[0],
              status: "valid",
              fingerprint: FINGERPRINT,
              testedAt: "Tested 4 minutes ago",
            },
            {
              ...SHARED_PROVIDERS[1],
              status: "invalid",
              fingerprint: "sk-ant ···· 91bd",
              testedAt: "Tested just now",
            },
            {
              ...SHARED_PROVIDERS[2],
              status: "valid",
              local: { requirements: [{ label: "Memory", value: "16 GB RAM", met: true }] },
            },
          ]}
          onSaveKey={() => {}}
          onTest={() => {}}
        />
      </div>
      <div data-testid="runtime">
        <EnvStatus
          label="Runtime"
          providers={[
            { ...SHARED_PROVIDERS[0], state: "degraded", checkedAt: "Checked just now" },
            { ...SHARED_PROVIDERS[1], state: "key-invalid", checkedAt: "Checked just now" },
            { ...SHARED_PROVIDERS[2], state: "not-running", checkedAt: "Checked just now" },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scope = (testId: string) => canvasElement.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!;
    const titlesIn = (host: HTMLElement) =>
      Array.from(host.querySelectorAll<HTMLElement>('[data-slot="entity-row-title"]')).map(
        (el) => el.textContent,
      );

    // One provider identity, two surfaces. Same names, same order, no drift.
    const expected = SHARED_PROVIDERS.map((provider) => provider.name);
    const configuration = scope("configuration");
    const runtime = scope("runtime");
    await expect(titlesIn(configuration)).toEqual(expected);
    await expect(titlesIn(runtime)).toEqual(expected);

    // Only the configuration surface can change anything.
    await expect(within(configuration).getAllByRole("button", { name: "Test connection" })).toHaveLength(3);
    await expect(within(configuration).getAllByRole("button", { name: "Replace key" })).toHaveLength(2);
    await expect(runtime.querySelectorAll("input")).toHaveLength(0);
    await expect(within(runtime).queryAllByRole("button")).toHaveLength(0);

    // The one overlapping state names itself differently on each side, and the
    // runtime side is the one that points here.
    const rejectedHere = configuration.querySelector<HTMLElement>(
      '[data-provider-id="anthropic"] [data-slot="connection-manager-condition"]',
    )!;
    await expect(rejectedHere).toHaveTextContent("Key rejected");
    await expect(runtime).toHaveTextContent("replace the key for this provider in Connections");
  },
};
