import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";
import { DataControls, type DataControlsProps } from "@/registry/super-ai/data-controls";
import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { MemberGateRow } from "@/registry/super-ai/member-gate-row";
import { DataControlsDocs } from "@/content/components/data-controls.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are sentences a settings screen really carries: a training opt-out
 * that states both sides of the trade, a retention period, a plan name. No
 * invented company, no figures.
 */
const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "1y", label: "1 year" },
  { value: "forever", label: "Until I delete them" },
];

const TRAINING_LABEL = "Improve the model for everyone";
const TRAINING_DESCRIPTION =
  "Your chats help train future models, which improves answers for everyone. You share what you write; you get better results over time.";
const LONG_DESCRIPTION =
  "Your chats, including files you attach, help train future models, which improves answers for everyone. You share what you write, and what you share can be reviewed by trained staff; you get better results over time.";

const trainingEffect = (on: boolean) =>
  on
    ? "Right now your chats are used to train models."
    : "Right now your chats are not used to train models.";

const retentionEffect = (value: string) =>
  `Right now chats are deleted after ${PERIODS.find((p) => p.value === value)?.label}.`;

const trainingCopy = {
  label: TRAINING_LABEL,
  description: TRAINING_DESCRIPTION,
  learnMoreHref: "#training-policy",
};

const retentionCopy = {
  label: "Keep my chats",
  description: "How long chats stay in your history before they are deleted.",
  learnMoreHref: "#retention-policy",
};

const meta: Meta<typeof DataControls> = {
  title: "Super AI/Data Controls",
  component: DataControls,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DataControlsDocs) } },
};

export default meta;
type Story = StoryObj<typeof DataControls>;

/** Holds the two values the component leaves to its host. */
function Host(props: Partial<DataControlsProps> & { initialTraining?: boolean; initialPeriod?: string }) {
  const { initialTraining = true, initialPeriod = "30d", ...rest } = props;
  const [training, setTraining] = React.useState(initialTraining);
  const [period, setPeriod] = React.useState(initialPeriod);
  return (
    <DataControls
      training={{
        ...trainingCopy,
        effect: trainingEffect(training),
        checked: training,
        onCheckedChange: setTraining,
      }}
      retention={{
        ...retentionCopy,
        effect: retentionEffect(period),
        value: period,
        periods: PERIODS,
        onValueChange: setPeriod,
      }}
      {...rest}
    />
  );
}

/**
 * Training on. The description states both sides of the trade, and the line
 * under it states what is true right now, with the link to the long version.
 * The play flips the switch and reads the sentence change: the effect line is
 * derived from the same value as `checked`, so it can never describe the old
 * setting.
 */
export const TrainingOn: Story = {
  render: () => <Host initialTraining />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole("switch");
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByText(trainingEffect(true))).toBeInTheDocument();
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByText(trainingEffect(false))).toBeInTheDocument();
  },
};

/** Training off: the same row, the sentence the host wrote for this value. */
export const TrainingOff: Story = {
  render: () => <Host initialTraining={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByText(trainingEffect(false))).toBeInTheDocument();
  },
};

/**
 * Retention is its own row with its own control. The play changes the period
 * and asserts the training switch did not move, which is the "two controls
 * make that structural" bullet asserted instead of described.
 */
export const Retention: Story = {
  render: () => <Host initialPeriod="30d" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await expect(trigger).toHaveTextContent("30 days");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "1 year" }));
    await waitFor(() => expect(canvas.getByRole("combobox")).toHaveTextContent("1 year"));
    await expect(canvas.getByText(retentionEffect("1y"))).toBeInTheDocument();
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    // Wait for the popup to be gone before axe scans a half-faded listbox.
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

/**
 * The opt-out sits behind a plan. The row stays, the lock and the plan name
 * are text, the switch is inert, and the only way forward is `onUpgrade`. The
 * host opens its own paywall message from that callback; the play asserts no
 * dialog appears from here.
 */
export const PlanLocked: Story = {
  args: {
    training: {
      ...trainingCopy,
      effect: trainingEffect(true),
      kind: "plan-locked",
      plan: "Pro",
      checked: true,
      onUpgrade: fn(),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Pro")).toBeInTheDocument();
    await expect(canvas.getByText("Changing this needs the Pro plan.")).toBeInTheDocument();
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Upgrade to Pro" }));
    const training = args.training as { onUpgrade?: () => void };
    await expect(training.onUpgrade).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole("dialog")).toBeNull();
  },
};

/**
 * A product that collects nothing still renders the section. The badge and the
 * reason replace the switch, so silence cannot be read as "no controls exist".
 */
export const NoneCollected: Story = {
  args: {
    training: {
      ...trainingCopy,
      description: "Models are trained on licensed and public data only.",
      effect: "Nothing you write is used to train models.",
      kind: "none-collected",
      reason: "Chats are processed to answer you and then discarded, so there is nothing to opt out of.",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("switch")).toBeNull();
    await expect(canvas.getByText("Not collected")).toBeInTheDocument();
    await expect(canvas.getByText(/nothing to opt out of/)).toBeInTheDocument();
  },
};

/**
 * The disabled-shaped state: an administrator set the policy. Both rows stay,
 * both controls are inert, and each row says what was set and who to ask.
 */
export const AdminManaged: Story = {
  args: {
    training: {
      ...trainingCopy,
      effect: trainingEffect(false),
      kind: "admin-managed",
      policy: "chats are never used for training.",
      contact: "your workspace admin",
      checked: false,
    },
    retention: {
      ...retentionCopy,
      effect: retentionEffect("30d"),
      kind: "admin-managed",
      policy: "chats are kept for 30 days.",
      contact: "your workspace admin",
      value: "30d",
      periods: PERIODS,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByRole("combobox")).toBeDisabled();
    await expect(canvas.getAllByText(/To change it, ask your workspace admin/)).toHaveLength(2);
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: RTL — data-controls.tsx has no physical left/right class (grep for pl-, pr-, ml-, mr-, left-, right-, text-left returns nothing); the one physical pair, SelectTrigger's pr-2/pl-2.5, lives in the vendored ui/select and is primitive-wide
 * // case-skip: ReducedMotion — data-controls.tsx carries no animate-* or transition-* class; the only motion is the vendored Switch thumb, whose class list is hard-coded in ui/switch.tsx and cannot be branched from here, and the Select popup, where the motion-reduce pair is restated at the call site
 * // case-skip: EmptyLabel — every text slot a control is named from is required (label, description, effect); the only optional text, the card description, names nothing
 */

/**
 * `checked` and `value` are the host's. The host here records what the row
 * asks for and applies it only when told to, so the play proves four things in
 * order: clicking does not move the rendered value, the callback fires with
 * the payload a host needs, a re-render with the same value holds the switch
 * where it was, and applying the request moves it. The retention handler is
 * never called by the switch.
 */
const spies = { checked: fn(), value: fn() };

export const Controlled: Story = {
  render: () => {
    function Held() {
      const [checked, setChecked] = React.useState(true);
      const [tick, setTick] = React.useState(0);
      return (
        <div className="flex flex-col gap-3">
          <DataControls
            training={{
              ...trainingCopy,
              effect: trainingEffect(checked),
              checked,
              onCheckedChange: (next) => spies.checked(next),
            }}
            retention={{
              ...retentionCopy,
              effect: retentionEffect("30d"),
              value: "30d",
              periods: PERIODS,
              onValueChange: (next) => spies.value(next),
            }}
          />
          <button type="button" onClick={() => setTick((n) => n + 1)} data-testid="rerender">
            Re-render {tick}
          </button>
          <button type="button" onClick={() => setChecked(false)} data-testid="apply">
            Apply
          </button>
        </div>
      );
    }
    return <Held />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    spies.checked.mockClear();
    spies.value.mockClear();
    const sw = canvas.getByRole("switch");
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(spies.checked).toHaveBeenCalledWith(false);
    await expect(spies.value).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByTestId("rerender"));
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await userEvent.click(canvas.getByTestId("apply"));
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
    await expect(canvas.getByText(trainingEffect(false))).toBeInTheDocument();
    await expect(canvas.getByRole("combobox")).toHaveTextContent("30 days");
  },
};

/**
 * Tab order in an editable card: switch, training link, retention select,
 * retention link. Each stop paints a focus treatment (settled, not the string
 * check), and Space toggles the switch, and so does Enter: Base UI's switch
 * handles both keys.
 */
export const KeyboardOrder: Story = {
  render: () => <Host />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("switch"),
      canvas.getByRole("link", { name: /Read the full policy: Improve the model/ }),
      canvas.getByRole("combobox"),
      canvas.getByRole("link", { name: /Read the full policy: Keep my chats/ }),
    ];
    await userEvent.tab();
    for (const stop of stops) {
      await waitFor(() => expect(document.activeElement).toBe(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      if (stop !== stops[stops.length - 1]) await userEvent.tab();
    }
    stops[0].focus();
    await userEvent.keyboard(" ");
    await expect(stops[0]).toHaveAttribute("aria-checked", "false");
    await userEvent.keyboard("{Enter}");
    await expect(stops[0].getAttribute("aria-checked")).toBe("true");
  },
};

/**
 * About 200 characters of description and a long label. Description and label
 * wrap; nothing truncates, because the sentence that states the trade is the
 * thing a person is deciding on. The control keeps its width.
 */
export const LongContent: Story = {
  render: () => (
    <Host
      training={{
        ...trainingCopy,
        label: "Allow my conversations and attached files to be used to improve models for everyone",
        description: LONG_DESCRIPTION,
        effect: trainingEffect(true),
        checked: true,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="data-controls-row-label"]')!;
    const description = canvasElement.querySelector<HTMLElement>(
      '[data-slot="data-controls-row-description"]',
    )!;
    await expect(`description wraps=${description.getBoundingClientRect().height > 30}`).toBe(
      "description wraps=true",
    );
    await expect(getComputedStyle(label.parentElement!).whiteSpace).toBe("normal");
    await expect(getComputedStyle(description).whiteSpace).toBe("normal");
    await expect(Math.round(within(canvasElement).getByRole("switch").getBoundingClientRect().width)).toBe(
      32,
    );
  },
};

/**
 * 375px, every state at once is not shown; the two widest are: the editable
 * pair (switch plus select trigger in the trailing slot) and plan-locked
 * (badge in the title, upgrade button below). The wrapper constrains width,
 * not the breakpoint, and nothing here keys on a breakpoint.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="flex w-[375px] max-w-full flex-col gap-4">
      <Host />
      <DataControls
        training={{
          ...trainingCopy,
          effect: trainingEffect(true),
          kind: "plan-locked",
          plan: "Pro",
          checked: true,
          onUpgrade: () => {},
        }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
    for (const row of canvasElement.querySelectorAll('[data-slot="data-controls-row"]')) {
      await expect(`row overflows=${row.scrollWidth > row.clientWidth}`).toBe("row overflows=false");
    }
  },
};

/**
 * Four neighbours, one question each: what is the person deciding?
 *
 * - **Data controls**: what happens to my data (training, retention).
 * - **Member gate row**: one feature is behind a plan and nothing about data
 *   is at stake. Data controls borrows the lock for its own two rows only.
 * - **Disclaimer note**: a caveat to read, with no control to change.
 *
 * Settings dialog hosts data controls as a section and connection manager
 * holds keys and local models; neither is a data-handling choice, so they are
 * not drawn here.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Data controls: what happens to my data</p>
        <Host />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Member gate row: a feature behind a plan</p>
        <MemberGateRow label="4K export" description="Render at full resolution" state="locked" tier="Pro" />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Disclaimer note: a caveat, no control</p>
        <DisclaimerNote>Answers can be wrong. Check anything that matters.</DisclaimerNote>
      </section>
    </div>
  ),
};
