import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";
import { PrivateSessionChip, PrivateSessionNotice } from "@/registry/super-ai/private-session-notice";
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { PrivateSessionNoticeDocs } from "@/content/components/private-session-notice.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const STATEMENT =
  "This chat will not be saved to history or memory, and will not be used to train models. Your prompts, files and outputs stay out of personalisation.";

const CONNECTORS = [
  { name: "Calendar", scope: "off" as const },
  { name: "Drive", scope: "reduced" as const, detail: "Read-only, no history" },
  { name: "Web search", scope: "reduced" as const, detail: "Queries are not linked to your account" },
];

const meta: Meta<typeof PrivateSessionNotice> = {
  title: "Super AI/Private Session Notice",
  component: PrivateSessionNotice,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PrivateSessionNoticeDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PrivateSessionNotice>;

/**
 * Before the first message. The statement sits above the input, visible, with no
 * control: this is the one moment the person has not yet typed anything they
 * would regret, so it is shown rather than offered.
 */
export const Entering: Story = {
  args: { state: "entering", statement: STATEMENT },
};

/**
 * The session is under way. The chip is the persistent part; the statement is
 * one press away. The play function drives that toggle because it is the one
 * behaviour this component owns.
 */
export const Active: Story = {
  args: { state: "active", statement: STATEMENT },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(STATEMENT)).toBeNull();
    const toggle = canvas.getByRole("button", { name: "What a private session keeps" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(STATEMENT)).toBeVisible();
    await userEvent.click(toggle);
    await waitFor(() => expect(canvas.queryByText(STATEMENT)).toBeNull());
  },
};

/** Each connector with its scope as a word ("Off", "Reduced"), never as colour alone. */
export const ConnectorsReduced: Story = {
  args: { state: "connectors-reduced", statement: STATEMENT, connectors: CONNECTORS },
};

/** The retention outcome as a sentence: here, deleted after a period. */
export const Exiting: Story = {
  args: { state: "exiting", statement: STATEMENT, retention: { kind: "deleted-after", period: "30 days" } },
};

/** Disabled-shaped: private mode is not available, and the reason is a plan limit. */
export const Unavailable: Story = {
  args: {
    state: "unavailable",
    statement: STATEMENT,
    reason: "plan",
    action: (
      <a href="#plan" className="text-foreground text-sm underline underline-offset-2">
        View plan settings
      </a>
    ),
  },
};

/*
 * Case stories. Skipped on purpose, each reason checkable:
 *
 * // case-skip: ReducedMotion — `grep -nE "animate-|duration-|transition" private-session-notice.tsx` returns nothing, and the statement mounts and unmounts with no enter or exit animation; Badge, Alert and the ghost Button contribute only colour changes on hover and focus
 * // case-skip: Controlled — the only state is an internal open flag for the statement toggle; there is no value/onChange pair, `state` is a rendering input
 * // case-skip: EmptyLabel — the only optional text slots are a connector's `detail` and an `action`, and ConnectorsReduced and Unavailable already render with each present; leaving them out removes a line, not a control name
 */

/**
 * `dir="rtl"`. The vendored Alert hard-codes `text-left`; the component restates
 * `text-start` on every Alert so the statement follows the reading direction
 * rather than staying pinned to the physical left. Connector rows already use
 * `text-start` inside A9.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="flex w-96 max-w-full flex-col gap-4" data-testid="rtl">
      <PrivateSessionNotice
        state="entering"
        statement="لن تُحفظ هذه المحادثة في السجل أو الذاكرة، ولن تُستخدم لتدريب النماذج."
      />
      <PrivateSessionNotice state="connectors-reduced" statement={STATEMENT} connectors={CONNECTORS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rtl");
    const alerts = root.querySelectorAll<HTMLElement>('[role="note"]');
    await expect(alerts.length).toBeGreaterThanOrEqual(2);
    for (const alert of Array.from(alerts)) {
      await expect(getComputedStyle(alert).textAlign).not.toBe("left");
    }
    const row = root.querySelector<HTMLElement>('[data-slot="entity-row"]')!;
    const trailing = row.querySelector<HTMLElement>('[data-slot="entity-row-trailing"]')!;
    const title = row.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    // The scope badge trails the name, so under RTL it sits to the left of it.
    await expect(trailing.getBoundingClientRect().right).toBeLessThanOrEqual(
      title.getBoundingClientRect().left + 1,
    );
  },
};

/**
 * One tab stop in `active`: the statement toggle. The chip is text and takes
 * none. Enter and Space open the statement; focus stays on the toggle. Both the
 * settled ring and the before/after differential are asserted, because either
 * alone has been wrong on this registry's vendored Button.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex w-96 max-w-full flex-col gap-4" data-testid="order">
      <PrivateSessionNotice state="active" statement={STATEMENT} />
      <button type="button" className="border-border w-fit rounded-lg border px-2 py-1 text-sm">
        Next control
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "What a private session keeps" });
    const next = canvas.getByRole("button", { name: "Next control" });
    const resting = focusTreatmentSignature(toggle);

    await userEvent.tab();
    await expect(document.activeElement).toBe(toggle);
    await expect(toggle.matches(":focus-visible")).toBe(true);
    await settledFocusRing(toggle, waitFor);
    await waitFor(() => expect(focusTreatmentSignature(toggle)).not.toBe(resting));

    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(document.activeElement).toBe(toggle);
    await expect(canvas.getByText(STATEMENT)).toBeVisible();

    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    // The chip is not a stop: the next tab leaves the component.
    await userEvent.tab();
    await expect(document.activeElement).toBe(next);
  },
};

/**
 * Author-supplied text at length: a ~190 character statement, a connector with a
 * long name and detail. The statement wraps (it is never truncated, because
 * truncating it would hide the claim). A9's title and detail truncate with an
 * ellipsis, which hides the end of a long connector name, so the full name is
 * available as the row's title attribute here.
 */
export const LongContent: Story = {
  render: () => (
    <div className="w-96 max-w-full" data-testid="long">
      <PrivateSessionNotice
        state="connectors-reduced"
        statement="Nothing from this conversation is saved to history, added to memory, used to personalise later answers, shared with your team workspace, or used to train or evaluate models, for as long as this session stays private."
        connectors={[
          {
            name: "Shared team drive: Quarterly planning and customer interview recordings",
            scope: "reduced",
            detail: "Read-only access to documents you opened this session, with no browsing history kept",
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const long = within(canvasElement).getByTestId("long");
    await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
    const title = long.querySelector<HTMLElement>('[data-slot="entity-row-title"]')!;
    // Overflow here is A9's documented truncation, not a layout break.
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");
  },
};

/**
 * 375px, wrapper-constrained (story-conventions.md, fact 2). Both forms: the
 * banner states do not scroll sideways, and the chip stays on one line. The
 * wrapper constrains width, not the breakpoint, and nothing here keys on a
 * breakpoint.
 */
export const Mobile: Story = {
  render: () => (
    <div className="flex w-[375px] max-w-full flex-col gap-4" data-testid="viewport">
      <PrivateSessionNotice state="entering" statement={STATEMENT} />
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="text-sm font-medium">Untitled chat</span>
        <PrivateSessionChip state="connectors-reduced" />
      </div>
      <PrivateSessionNotice state="connectors-reduced" statement={STATEMENT} connectors={CONNECTORS} />
      <PrivateSessionNotice state="exiting" statement={STATEMENT} retention={{ kind: "kept-locally" }} />
      <PrivateSessionNotice state="unavailable" statement={STATEMENT} reason="admin" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const viewport = within(canvasElement).getByTestId("viewport");
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    for (const notice of Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="private-session-notice"]'),
    )) {
      await expect(notice.scrollWidth).toBeLessThanOrEqual(notice.clientWidth);
    }
  },
};

/**
 * Four things that sit near this one, and the choosing rule is what each is
 * about.
 *
 * - **Private session notice** — about the session itself: what is and is not
 *   remembered. Permanent for the session, and the chip never closes.
 * - **Disclaimer note** — about the output: it can be wrong. Same permanence,
 *   different subject.
 * - **Safety block** — about one request that a policy stopped. Private mode
 *   never blocks anything; it only changes what is kept.
 * - **Feature announcement** — a dismissible promo that private mode exists.
 *   Dismissing it does not turn the mode off, and dismissing this notice is
 *   not possible.
 *
 * B7 `app-topbar` is the slot that renders the chip. It is not a neighbour on
 * this page because it is a container, not a competing message.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Private session notice — what the session keeps</p>
        <PrivateSessionNotice state="entering" statement={STATEMENT} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Disclaimer note — the output can be wrong</p>
        <DisclaimerNote variant="inline" />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Safety block — this request was stopped by policy
        </p>
        <SafetyBlock
          variant="input-blocked"
          policy="Personal data policy"
          alternatives="Ask again without the participant names."
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Feature announcement — private mode is new</p>
        <FeatureAnnouncement
          id="private-sessions"
          level="inline-card"
          stage="New"
          title="Private sessions"
          description="Chats you start in private mode are not saved to history."
          onDismiss={() => {}}
        />
      </section>
    </div>
  ),
};
