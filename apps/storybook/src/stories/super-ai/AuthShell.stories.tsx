import type { Meta, StoryObj } from "@storybook/react-vite";
import { Apple, Building2, Globe, Sparkles } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { AuthShellDocs } from "@/content/components/auth-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { AuthShell, type AuthShellMode, type AuthShellProps } from "@/registry/super-ai/auth-shell";
import { OnboardingWizard } from "@/registry/super-ai/onboarding-wizard";

// Neutral marks: lucide ships no brand glyphs, and this registry ships no
// brand assets either — a provider's own logo is the caller's to supply.
const PROVIDERS: AuthShellProps["providers"] = [
  {
    id: "google",
    name: "Google",
    icon: <Globe className="size-4" />,
    description: "ada@northwind.com",
    trailing: <span className="text-foreground text-xs">Last used</span>,
  },
  { id: "apple", name: "Apple", icon: <Apple className="size-4" /> },
  {
    id: "sso",
    name: "Northwind SSO",
    icon: <Building2 className="size-4" />,
    description: "Single sign-on for everyone on your domain",
  },
];

const MARKETING = (
  <>
    <Sparkles aria-hidden className="text-foreground size-5" />
    <p className="text-foreground text-lg font-medium text-balance">
      Northwind turns a brief into a finished render in about a minute.
    </p>
    <p className="text-foreground/70 text-sm">
      Your first ten renders are free, and everything you make stays private until you share it.
    </p>
  </>
);

const FULL_ARGS: AuthShellProps = {
  mode: "sign-in",
  providers: PROVIDERS,
  marketing: MARKETING,
  onSelectProvider: () => {},
  onEmailSubmit: () => {},
  onModeChange: () => {},
  terms: { label: "Terms of Service", href: "/terms" },
  privacy: { label: "Privacy Policy", href: "/privacy" },
};

const meta: Meta<typeof AuthShell> = {
  title: "Super AI/Auth Shell",
  component: AuthShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(AuthShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthShell>;

/** The working screen: three providers, a pitch pane, the email fallback and the legal line. */
export const SignIn: Story = { args: FULL_ARGS };

/** The same screen with sign-up copy. One component, two modes, no second layout. */
export const SignUp: Story = { args: { ...FULL_ARGS, mode: "sign-up" } };

/**
 * Day one, before anyone has wired an identity stack up: no providers, no
 * pitch. Both regions stay mounted and fall to L1 rather than collapsing, so
 * the shape of the screen is visible before it has any content — and the email
 * form below is a complete sign-in route on its own. Mandatory export for the
 * block contract.
 */
export const Empty: Story = {
  args: { onEmailSubmit: () => {} },
};

/**
 * An identity provider that exists but is not available to this person. It is
 * a real `<button disabled>`, and the reason is written out — dimming on its
 * own is state conveyed by colour, and it leaves a dead row with no
 * explanation.
 */
export const ProviderUnavailable: Story = {
  args: {
    ...FULL_ARGS,
    providers: [
      PROVIDERS![0],
      PROVIDERS![1],
      {
        id: "sso",
        name: "Northwind SSO",
        icon: <Building2 className="size-4" />,
        disabled: true,
        disabledReason: "Ask an admin to enable SAML",
      },
    ],
  },
};

/**
 * Narrow viewport. Below `md` the split collapses to one column, the pitch pane
 * drops under the form (it is after the form in the DOM whichever side it sits
 * on, so reading order never changed), and the card takes the full width.
 * Mandatory export for the block contract — a shell is a layout, and layout is
 * what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing at all while looking
 * configured. `options` is declared explicitly rather than relying on a
 * built-in list, so the selection cannot silently resolve to nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout here is verified by hand, not by a gate — and `Mobile` below is the
 * export that makes the narrow claim mechanically, by moving the real viewport.
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
 * Case stories — the situations a sign-in screen meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. One is recorded as a skip, and it is the
 * only skip in family O, so here is the measurement behind it rather than the
 * conclusion. Under the gate's emulated `prefers-reduced-motion: reduce` every
 * element in the rendered tree was read back for a live `animationName` or a
 * non-zero `transitionDuration`. Nothing animates. Three things transition:
 * A9's rows and the email input carry `transition-colors` — a crossfade of
 * colour, background, border and outline only, which moves nothing and which
 * the convention names as not worth a story; the five vendored `Button`s carry
 * the registry-wide `transition-all` and its one-pixel press nudge, which
 * CONTINUE.md §8 holds as a primitive-wide posture no case story patches; and
 * L6's dot rail, the one component in this composition that owns a real
 * `motion-reduce:` branch, computes `display: none` here because the shell
 * suppresses the whole progress region. So the branch exists in the source
 * this shell composes and cannot be reached through it. A story would render
 * pixel-for-pixel identically to `SignIn` and imply coverage of a branch that
 * is switched off.
 *
 * // case-skip: ReducedMotion — read back under emulated reduce, nothing in the rendered tree animates: A9 and the input carry transition-colors (a crossfade), the five vendored Buttons carry the registry-wide transition-all press nudge that CONTINUE.md §8 keeps as a primitive-wide posture, and L6's dot rail — the only motion-reduce branch in the composition — computes display:none because this shell suppresses the progress region
 *
 * Three defects came out of this set, none of them a class. Two are recorded
 * and asserted nowhere, per the fix policy: every provider row announces as a
 * toggle button (`KeyboardOrder`), and a provider whose title is icon-only
 * produces a nameless credential handoff (`EmptyLabel`). The third *is*
 * asserted, because it is a collapse an `EmptyLabel` story exists to record
 * rather than a behaviour anyone would defend — an empty `emailLabel` leaves
 * the field associated and nameless while axe passes it on the placeholder.
 * All three live in the components this shell composes, not in the shell. No
 * source change was needed or made — no
 * reduced-motion branch to add, no contrast rebind to add (the shell already
 * carries the one it needs), and no physical class to swap: `grep -n
 * 'pl-\|pr-\|ml-\|mr-\|text-left\|border-l\|border-r\|left-\|right-'
 * auth-shell.tsx` returns nothing.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document rather than on a wrapper. Nothing here portals,
 *  but `direction` is what A9's `text-start` and L6's grid resolve against,
 *  and the document is the honest place to flip it. */
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

const rect = (el: Element) => el.getBoundingClientRect();

/**
 * Right-to-left, with `marketingSide="start"` — the side that has to move.
 *
 * **The split mirrors, and it mirrors because both halves were already
 * logical.** L6 places the pane with `md:order-first` inside a CSS grid, and
 * grid order follows the inline axis, so nothing about the arrangement is
 * physical: measured in a 1200px frame, the pane occupies 168..588 in LTR and
 * 612..1032 in RTL while the form takes the other column, and the card itself
 * is unmoved at 152..1048. A9's rows mirror with it — computed `direction:
 * rtl`, `text-align: start`, and the title inset 41px from the row's inline
 * start in both directions, so the icon leads and the text follows on
 * whichever edge that is.
 *
 * **The legal sentence does not mirror, and that is correct.** "By continuing,
 * you agree to our Terms of Service and Privacy Policy." is an unbroken run of
 * strong-LTR characters, so the bidi algorithm keeps it as one LTR run and
 * right-aligns it in the RTL paragraph: Terms lands at 387..482 and Privacy at
 * 510..588, flush with the footer's right edge, in the order they were
 * written. A reader translating this copy gets RTL flow for free; a reader
 * leaving it in English gets a correctly aligned English sentence. What would
 * be wrong is the links swapping, and they do not.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  decorators: [
    (Story) => (
      <RtlDocument>
        <Story />
      </RtlDocument>
    ),
  ],
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const q = <T extends HTMLElement>(s: string) => shell.querySelector<T>(s)!;

    const pane = q('[data-slot="onboarding-wizard-panel"]');
    const rows = q('[data-region="provider-rows"]');
    const email = q('[data-region="email-fallback"]');

    // The pane asked for the start side; under RTL that is the right.
    await expect(pane.getAttribute("data-side")).toBe("start");
    await expect(rect(pane).left).toBeGreaterThan(rect(rows).right);
    // The form column stays one column: providers and email share an edge.
    await expect(Math.round(rect(rows).left)).toBe(Math.round(rect(email).left));

    // A9 resolves its own inline start rather than a physical left.
    const row = q('[data-provider-id="google"]');
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    await expect(getComputedStyle(row).direction).toBe("rtl");
    await expect(getComputedStyle(row).textAlign).toBe("start");
    // 41px from the row's inline start — the same inset the LTR frame gives on
    // the left, so the icon leads the title on whichever edge that is.
    await expect(Math.round(rect(row).right - rect(title).right)).toBe(41);

    // The legal run stays in written order and ends flush with the footer.
    const legal = q('[data-slot="auth-shell-legal"]');
    const [terms, privacy] = Array.from(legal.querySelectorAll("a"));
    await expect(rect(terms).right).toBeLessThan(rect(privacy).left);
    await expect(Math.round(rect(privacy).right)).toBe(Math.round(rect(legal).right));

    // And nothing overflowed sideways in the process.
    await expect(shell.scrollWidth).toBe(shell.clientWidth);
  },
};

/**
 * The whole keyboard surface, walked as a cycle rather than counted inside an
 * allowance: eight stops, one lap, one closing tab that leaves the shell.
 * There is no portal here and nothing traps.
 *
 * **The suppression is the interesting stop, because it is the one that is not
 * there.** L6 always draws Back, Skip and a primary action; this shell hides
 * that footer and the progress rail with `display: none`, which is the whole
 * reason the override is `hidden` and not `invisible` or `opacity-0`. The walk
 * asserts both halves — the three buttons are still in the DOM, and the tab
 * sequence never reaches them — so a future `className` that fights those two
 * utilities fails here rather than shipping three dead controls.
 *
 * **Both focus checks, because they answer different questions.** Every stop
 * is asserted twice: `settledFocusRing` proves something is painted after the
 * vendored `Button`'s 150ms fade settles, and a `focusTreatmentSignature`
 * differential — read on the next stop while focus is still on the previous
 * one, so nothing is blurred — proves focus is what painted it. All eight
 * pass, and the two halves disagree about *what* paints: the six controls
 * paint a Tailwind ring through `box-shadow` with `outline` still `none`,
 * while the two legal links have no `focus-visible` utility of their own and
 * fall back to the user agent's `outline: auto 1px`, coloured by globals.css's
 * `outline-ring/50` on `*`. That is a treatment, and it is not the registry's.
 *
 * **Recorded, not asserted: every provider row announces as a toggle.** A9
 * sets `aria-pressed={selected}` on its button branch unconditionally, so all
 * three rows carry `aria-pressed="false"` — "Continue with Google, toggle
 * button, not pressed" — for an action that navigates away and can never be
 * un-pressed. A9 has no opt-out; that is the same shape as §8's A8
 * `preview-tile` finding, in a second component. Pinning it with an assertion
 * would pin the bug, so this walk stays silent about it.
 */
export const KeyboardOrder: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const q = <T extends HTMLElement>(s: string) => shell.querySelector<T>(s)!;
    const legalLinks = Array.from(
      q('[data-slot="auth-shell-legal"]').querySelectorAll<HTMLAnchorElement>("a"),
    );

    // The expected cycle, named up front so the walk asserts a sequence rather
    // than a count: three providers, the email pair, the mode switch, the two
    // legal links.
    const STOPS: HTMLElement[] = [
      q('[data-provider-id="google"]'),
      q('[data-provider-id="apple"]'),
      q('[data-provider-id="sso"]'),
      q('[data-slot="input"]'),
      q('[data-slot="auth-shell-email-submit"]'),
      q('[data-slot="auth-shell-mode-switch"] button'),
      ...legalLinks,
    ];

    // L6's chrome: present in the DOM, switched off by display, and therefore
    // absent from the walk below.
    for (const slot of [
      "onboarding-wizard-progress",
      "onboarding-wizard-back",
      "onboarding-wizard-skip",
      "onboarding-wizard-primary",
    ]) {
      const el = q(`[data-slot="${slot}"]`);
      await expect(el).toBeInTheDocument();
      await expect(el.offsetParent).toBeNull();
    }

    (document.activeElement as HTMLElement | null)?.blur();
    let previous: Element = document.body;
    const outlineWhileFocused: string[] = [];
    for (const stop of STOPS) {
      // The differential's baseline, taken while focus is still elsewhere.
      const before = focusTreatmentSignature(stop);
      await userEvent.tab();
      // Settle on departure, not on arrival (story-conventions.md, fact 4).
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      // Something is painted…
      await settledFocusRing(stop, waitFor);
      // …and focus is what painted it.
      await waitFor(() => expect(focusTreatmentSignature(stop)).not.toBe(before));
      outlineWhileFocused.push(getComputedStyle(stop).outlineStyle);
      previous = stop;
    }

    // The two mechanisms, read while each stop actually had focus: a Tailwind
    // ring on the six controls (outline still `none`), the user agent's own
    // `outline: auto` on the two links, which carry no focus utility at all.
    await expect(outlineWhileFocused).toEqual([
      "none",
      "none",
      "none",
      "none",
      "none",
      "none",
      "auto",
      "auto",
    ]);

    // One more tab and the lap is over.
    await userEvent.tab();
    await waitFor(() => expect(shell.contains(document.activeElement)).toBe(false));
  },
};

/** A host that holds `mode` and applies it, holds `email` and refuses to. The
 *  refusal is the point: a controlled value the host never writes back is the
 *  only way to prove the component is not quietly holding it too. */
function ControlledHost({
  onEmailChange,
  onModeChange,
  ...props
}: AuthShellProps & { onEmailChange: (email: string) => void }) {
  const [mode, setMode] = React.useState<AuthShellMode>("sign-in");
  return (
    <AuthShell
      {...props}
      mode={mode}
      email="ada@northwind.example"
      onEmailChange={onEmailChange}
      onModeChange={(next) => {
        onModeChange?.(next);
        setMode(next);
      }}
    />
  );
}

/**
 * Two controlled pairs, driven from outside, measured against all three
 * clauses the convention asks for.
 *
 * **Interaction alone does not move the value.** Typing into a field whose
 * `email` prop is fixed leaves `input.value` at `ada@northwind.example`.
 *
 * **The callback carries what a consumer needs to apply it.**
 * `onEmailChange` fires once with `"ada@northwind.exampleX"` — the whole next
 * value, not a delta and not the keystroke — so a host can assign it
 * unmodified. `onEmailSubmit` reports the *prop* value, which is the same
 * string the host already had, and `onSelectProvider` reports the row's `id`
 * rather than its label, so a renamed provider does not change the payload.
 *
 * **Re-rendering with an unchanged `value` holds the component fixed.** The
 * mode switch is the second pair and the cheapest way to force that
 * re-render honestly: the host applies `mode`, every string on the screen
 * changes, and the email field still reads the same fixed value afterwards.
 *
 * **Recorded while it was in front of us.** The mode-switch button keeps focus
 * across that re-render — correct — but its own label flips underneath the
 * cursor, "Create an account" becoming "Sign in", with the heading, the
 * provider group's name and the submit copy all changing at once and nothing
 * announcing any of it. The shell has no live region. That is a design
 * decision about who owns the announcement, so it is written here and in the
 * docs module's focus notes rather than asserted into place.
 */
export const Controlled: Story = {
  args: {
    ...FULL_ARGS,
    onEmailChange: fn(),
    onEmailSubmit: fn(),
    onModeChange: fn(),
    onSelectProvider: fn(),
  },
  render: (args) => <ControlledHost {...(args as AuthShellProps & { onEmailChange: (e: string) => void })} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const input = shell.querySelector<HTMLInputElement>('[data-slot="input"]')!;

    // 1. Interaction alone moves nothing.
    await userEvent.click(input);
    await userEvent.type(input, "X");
    await expect(input.value).toBe("ada@northwind.example");
    await expect(args.onEmailChange).toHaveBeenCalledTimes(1);
    await expect(args.onEmailChange).toHaveBeenCalledWith("ada@northwind.exampleX");

    // 2. The payloads a host applies: the row's id, and the value it already had.
    await userEvent.click(canvas.getByRole("button", { name: /Continue with Google/ }));
    await expect(args.onSelectProvider).toHaveBeenCalledWith("google");
    await userEvent.click(shell.querySelector<HTMLButtonElement>('[data-slot="auth-shell-email-submit"]')!);
    await expect(args.onEmailSubmit).toHaveBeenCalledWith("ada@northwind.example");

    // 3. The second pair, applied — and the whole screen re-renders.
    const modeSwitch = shell.querySelector<HTMLButtonElement>('[data-slot="auth-shell-mode-switch"] button')!;
    await userEvent.click(modeSwitch);
    await expect(args.onModeChange).toHaveBeenCalledWith("sign-up");
    await waitFor(() => expect(canvas.getByRole("heading")).toHaveTextContent("Create your account"));
    await expect(canvas.getByRole("group", { name: "Sign-up providers" })).toBeInTheDocument();

    // The email survived the re-render unchanged, and focus stayed on the
    // control whose own label just changed under it.
    await expect(shell.querySelector<HTMLInputElement>('[data-slot="input"]')!.value).toBe(
      "ada@northwind.example",
    );
    await expect(document.activeElement).toBe(modeSwitch);
    await expect(modeSwitch).toHaveTextContent("Sign in");
  },
};

/**
 * Every optional text slot emptied at once, which on this screen is not a
 * cosmetic question. A sign-in row is where someone hands over a credential,
 * so a row that cannot say which provider it belongs to is a security-adjacent
 * defect rather than a ragged one.
 *
 * **What survives.** The rows keep their 56px height from A9's `min-h-14`, so
 * nothing here is a shrunken tap target — the failures are all in the name.
 * `legalPrefix=""` leaves "Terms of Service and Privacy Policy." with both
 * links still named. An omitted `marketing` falls to L1 rather than collapsing
 * the pane, so the split survives its own empty state. An empty `description`
 * renders no element at all rather than an empty paragraph.
 *
 * **What degrades, measured.** A provider with `name: ""` gives a button
 * announced as exactly "Continue with" — a complete, plausible-sounding
 * sentence that names nothing, which is worse than an obviously broken label
 * because it does not read as broken.
 *
 * **And `emailLabel=""` is the one the gate cannot see.** The `<label>` is
 * still there and still associated — `input.labels` has one entry — so the
 * accessible name is not missing, it is the empty string, and nothing falls
 * back to the placeholder once a label exists. Measured: the field's
 * accessible name is `""`. Axe passes it anyway, because `label`'s
 * `non-empty-placeholder` check accepts `you@company.com` as a labelling
 * mechanism the accessible-name algorithm does not. So this story is green,
 * the a11y gate is green, and the email field on a sign-in page has no name.
 * That divergence is why the assertion below reads the name directly rather
 * than trusting the scan.
 *
 * **Recorded, not rendered.** One step further collapses the name entirely:
 * `title` given as an icon-only node produces a `<button>` with no text at
 * all, since A9's `icon` slot is decorative and the title is the whole
 * accessible name. That is a real `button-name` violation, so it is described
 * here rather than shipped into the axe gate — the point being that the
 * component offers no floor. A9 will happily name a credential handoff
 * nothing.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    marketing: undefined,
    description: "",
    legalPrefix: "",
    emailLabel: "",
    providers: [
      { id: "anon", name: "", icon: <Globe className="size-4" /> },
      { id: "apple", name: "Apple" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;

    // The collapse, exactly as a screen reader gets it.
    const anon = canvas.getByRole("button", { name: "Continue with" });
    await expect(anon).toHaveAttribute("data-provider-id", "anon");
    // Geometry is untouched — this is a naming failure, not a target failure.
    await expect(Math.round(rect(anon).height)).toBe(56);
    await expect(Math.round(rect(canvas.getByRole("button", { name: "Continue with Apple" })).height)).toBe(
      56,
    );

    // The field loses its visible label and keeps a name from the placeholder.
    const field = shell.querySelector<HTMLLabelElement>("label")!;
    const input = canvas.getByRole("textbox") as HTMLInputElement;
    await expect(field).toHaveTextContent("");
    // Still associated — one label, wired by `htmlFor` — and still nameless,
    // because an empty label is a name of "" rather than a missing one. This
    // assertion records the collapse; it is not the contract anyone wants.
    await expect(input.labels).toHaveLength(1);
    await expect(input).toHaveAccessibleName("");
    await expect(input).toHaveAttribute("placeholder", "you@company.com");

    // Regions that go empty show their own affordance rather than collapsing.
    await expect(
      shell.querySelector('[data-region="marketing-panel"] [data-slot="empty-state"]'),
    ).not.toBeNull();
    await expect(shell.querySelector('[data-slot="card-description"]')).toBeNull();

    // The legal line still names both destinations without its lead-in.
    await expect(shell.querySelector('[data-slot="auth-shell-legal"]')).toHaveTextContent(
      "Terms of Service and Privacy Policy.",
    );
  },
};

/**
 * Author-supplied text at the length a real provider list reaches — a
 * federated SSO name and the sentence explaining who it covers.
 *
 * **The shell makes two different decisions, and the split is the point.** A9
 * truncates: the row title is `nowrap` with `text-overflow: ellipsis`, so 533px
 * of title is shown in 299px and 234px of it is unreadable, with the
 * description clipping the same way at 594px into 299px. L6's pane wraps: the
 * same order of characters becomes four lines in 388px with nothing clipped.
 * That is the right pair of decisions — a row has to stay one row for a list
 * to be scannable, and a pitch has nothing to line up with — but it means the
 * two halves of this screen answer "too long" in opposite ways, and only one
 * of them tells you.
 *
 * **Truncation moves text out of reach without moving it out of the
 * accessible name.** The row's name is the full 190 characters, title and
 * description and trailing slot together; a screen-reader user hears the whole
 * federation sentence and a sighted user sees an ellipsis. The row height
 * never changes — 56px, the same as every other row — so nothing about the
 * layout reveals that anything was cut. The docs module's fifth pitfall says
 * to keep a `disabledReason` to about four words; this is the measurement
 * behind that sentence, and it applies just as much to `description`.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    providers: [
      {
        id: "sso",
        name: "Northwind Identity Cloud single sign-on for enterprise workspaces",
        icon: <Building2 className="size-4" />,
        description:
          "Everyone on the northwind.example domain, plus the four contractor accounts IT provisioned last quarter",
        trailing: <span className="text-foreground text-xs">Last used</span>,
      },
      PROVIDERS![1],
    ],
    marketing: (
      <p className="text-foreground text-lg font-medium text-balance">
        Northwind turns a written brief into a finished, colour-graded render in about a minute, and keeps
        every version.
      </p>
    ),
  },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const row = shell.querySelector<HTMLElement>('[data-provider-id="sso"]')!;
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    const description = row.querySelector<HTMLElement>('[data-slot="entity-row-description"]')!;

    // The row truncates, both lines, and says so in its computed style.
    await expect(getComputedStyle(title).whiteSpace).toBe("nowrap");
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(description.scrollWidth).toBeGreaterThan(description.clientWidth);
    // …and gives up nothing from the accessible name while doing it.
    await expect(row).toHaveAccessibleName(
      expect.stringContaining("plus the four contractor accounts IT provisioned last quarter"),
    );
    // The list stays scannable: a truncated row is the same height as a short one.
    await expect(Math.round(rect(row).height)).toBe(56);
    await expect(Math.round(rect(row).height)).toBe(
      Math.round(rect(shell.querySelector<HTMLElement>('[data-provider-id="apple"]')!).height),
    );

    // The pane wraps instead, and clips nothing.
    const pitch = shell.querySelector<HTMLElement>('[data-region="marketing-panel"] p')!;
    await expect(pitch.scrollWidth).toBe(pitch.clientWidth);
    await expect(rect(pitch).height).toBeGreaterThan(60);

    // Nothing pushed the page sideways.
    await expect(shell.scrollWidth).toBe(shell.clientWidth);
  },
};

/**
 * A real 375×812 viewport, not a 375px box: `page.viewport` resizes the test
 * iframe, so `window.innerWidth` reads 375 and the media queries flip. A width
 * wrapper would have rendered L6's `md:grid-cols-2` split inside a narrow box
 * and reported success (`story-conventions.md`, fact 2). Six providers, so the
 * card is 936px tall in an 812px viewport and the scrolling claim below is
 * about something that actually scrolls.
 *
 * **What happens to the marketing panel: nothing is lost, and it moves as far
 * as it can go.** The grid collapses to a single 311px column and the pane
 * stays mounted and painted — no `display: none` anywhere in this shell — but
 * `md:order-first` stops applying, and L6 renders the pane *after* the
 * question in the DOM precisely so reading order is question-first. The
 * consequence at 375px is that the pitch, which is the first thing on the
 * screen at desktop width, becomes the last thing on the page: measured at
 * 760px down, below the legal small print at 636px. The pitch is what
 * persuades someone to make the account, and on a phone they have to scroll
 * past the terms to reach it. That is a layout decision this shell inherits
 * rather than owns — L6 has one pane and one `panelSide`, and no way to say
 * "above the question when the columns collapse".
 *
 * **The centring claim, verified.** The shell's own source argues for `m-auto`
 * on the card over `items-center` on the row, because a flex item taller than
 * its scrolling parent puts its overflow *above* the scroll origin where no
 * scrollbar can reach it. This is that case: 936px of card in 812px of
 * viewport, and the card's top sits at the padding edge with `scrollTop` at 0,
 * so the heading is the first thing on screen rather than the first thing
 * clipped.
 */
export const Mobile: Story = {
  args: {
    ...FULL_ARGS,
    providers: [
      ...PROVIDERS!,
      { id: "ms", name: "Microsoft Entra ID", icon: <Building2 className="size-4" /> },
      { id: "gh", name: "GitHub", icon: <Globe className="size-4" /> },
      {
        id: "okta",
        name: "Okta",
        icon: <Building2 className="size-4" />,
        description: "ada@northwind.example",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // Moves the iframe itself, and does not leak into the next story.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);

    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const q = <T extends HTMLElement>(s: string) => shell.querySelector<T>(s)!;
    const card = q('[data-slot="onboarding-wizard"]');
    const pane = q('[data-region="marketing-panel"]');
    const legal = q('[data-region="legal-footer"]');

    // One column, and the split really collapsed rather than being squeezed.
    const grid = q('[data-slot="onboarding-wizard-content"]').parentElement!;
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(1);

    // Every region is still mounted and still painted — nothing is hidden here.
    for (const id of ["marketing-panel", "provider-rows", "email-fallback", "legal-footer"]) {
      const region = q(`[data-region="${id}"]`);
      await expect(region).toBeInTheDocument();
      await expect(getComputedStyle(region).display).not.toBe("none");
    }

    // The pitch is last, below the legal line. Recorded, not endorsed.
    await expect(rect(pane).top).toBeGreaterThan(rect(legal).top);

    // The card overflows the viewport, and overflows downward.
    await expect(card.scrollHeight).toBeGreaterThan(shell.clientHeight);
    await expect(shell.scrollTop).toBe(0);
    await expect(rect(card).top).toBeGreaterThanOrEqual(rect(shell).top);
    await expect(rect(q("h3")).top).toBeGreaterThanOrEqual(rect(shell).top);

    // And the page does not scroll sideways, which is the claim this story owes.
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    await expect(shell.scrollWidth).toBe(shell.clientWidth);
  },
};

/**
 * O14 beside L6 `onboarding-wizard` in its split-panel state — the component
 * this shell is built out of, and the only near-twin it has. The spec says the
 * relationship out loud: "the marketing panel is the same split layout as L6 —
 * auth and first-run are one visual family". So the pair below is not two
 * things that look alike, it is one layout rendered twice, once with the
 * wizard's chrome and once without.
 *
 * **The choosing rule is whether the flow has more than one step.** Reach for
 * L6 when there is a sequence — questions with an order, a position worth
 * showing, a Back that can go somewhere and a Skip that means "leave this
 * unanswered". Reach for O14 when there is exactly one step and it is the
 * unauthenticated one: a provider list, an email fallback and the legal line
 * are a screen, not a flow, and the wizard's rail would read "step 1 of 1,
 * last step" over a Back button that can never be pressed. That is what O14
 * suppresses, and the suppression is the visible difference below — L6 paints
 * its dot rail and its Back / Skip / primary footer; O14 paints neither.
 *
 * **The other difference is the legal footer, and it is the one that cannot be
 * papered over.** L6 has no slot for it. Terms and privacy are not decoration
 * on a sign-up screen, they are the thing consent attaches to, so O14 declares
 * them as a region with real link props rather than leaving a slot someone
 * remembers to fill. If you find yourself passing legal copy into a wizard's
 * `content`, you wanted this shell.
 */
export const Boundary: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="min-h-0 shrink-0 overflow-hidden rounded-lg border">
        <AuthShell {...args} providers={[PROVIDERS![0], PROVIDERS![1]]} />
      </div>
      <div className="min-h-0 shrink-0 rounded-lg border p-4">
        <OnboardingWizard
          label="Setup"
          steps={[
            {
              id: "role",
              title: "What are you making?",
              description: "This picks your starting templates. You can change it later.",
              choices: [
                { value: "film", label: "Film", description: "Storyboards, shot lists, animatics" },
                { value: "print", label: "Print", description: "Posters, covers, key art" },
              ],
              effect: "Sets the default aspect ratio and the sample project we load.",
              panel: (
                <p className="text-foreground text-sm">
                  The same split, one layer down: L6 owns the pane, O14 borrows it.
                </p>
              ),
              panelSide: "start",
            },
            { id: "team", title: "Who else is working on this?" },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')!;
    const wizard = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="onboarding-wizard"]'),
    ).find((el) => !shell.contains(el))!;

    // Same layout: both put a pane in L6's own panel slot, on the start side.
    for (const root of [shell, wizard]) {
      const pane = root.querySelector<HTMLElement>('[data-slot="onboarding-wizard-panel"]')!;
      await expect(pane.getAttribute("data-side")).toBe("start");
    }

    // The chrome is the difference, in both directions.
    await expect(
      shell.querySelector<HTMLElement>('[data-slot="onboarding-wizard-progress"]')!.offsetParent,
    ).toBeNull();
    await expect(
      shell.querySelector<HTMLElement>('[data-slot="onboarding-wizard-nav"]')!.offsetParent,
    ).toBeNull();
    await expect(
      wizard.querySelector<HTMLElement>('[data-slot="onboarding-wizard-progress"]')!.offsetParent,
    ).not.toBeNull();
    await expect(
      wizard.querySelector<HTMLElement>('[data-slot="onboarding-wizard-nav"]')!.offsetParent,
    ).not.toBeNull();

    // And the region L6 has no slot for.
    await expect(shell.querySelector('[data-region="legal-footer"]')).not.toBeNull();
    await expect(wizard.querySelector('[data-region="legal-footer"]')).toBeNull();
  },
};
