import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  AutoFill,
  AutoFillCell,
  AutoFillPanel,
  type AutoFillPanelProps,
  type AutoFillRecord,
  type AutoFillSample,
} from "@/registry/super-ai/auto-fill";
import { AutoFillDocs } from "@/content/components/auto-fill.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

/**
 * Fixtures are records a CRM column could hold: company names and industries.
 * No invented figures beyond a per-record cost in credits.
 */
const FIELDS = [
  { id: "industry", label: "Industry" },
  { id: "size", label: "Company size" },
];

const RECORDS: AutoFillRecord[] = [
  { id: "r1", label: "Northwind Traders", current: null },
  { id: "r2", label: "Fabrikam", current: "Manufacturing" },
  { id: "r3", label: "Contoso", current: null },
  { id: "r4", label: "Tailspin Toys", current: "Retail" },
  { id: "r5", label: "Litware", current: null },
];

const SAMPLES: AutoFillSample[] = [
  { id: "r1", value: "Wholesale", reason: "Imports and resells goods.", cost: 2, durationMs: 1240 },
  { id: "r2", value: "Industrial manufacturing", cost: 2, durationMs: 980 },
  { id: "r3", value: "Software", reason: "Sells licences for a desktop suite.", cost: 2, durationMs: 1100 },
];

const meta: Meta<typeof AutoFill> = {
  title: "Super AI/Auto Fill",
  component: AutoFill,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AutoFillDocs) } },
};

export default meta;
type Story = StoryObj<typeof AutoFill>;

function Panel(props: Partial<AutoFillPanelProps>) {
  return (
    <div data-testid="frame" className="w-96 max-w-full">
      <AutoFillPanel
        fields={FIELDS}
        records={RECORDS}
        onSample={async () => SAMPLES}
        onApply={async () => {}}
        {...props}
      />
    </div>
  );
}

const never = () => new Promise<never>(() => {});

async function preview(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: /^Preview on first/ }));
  await canvas.findByText("Wholesale");
  return canvas;
}

/**
 * The target field, a prompt that is already filled in and editable, and an
 * overwrite switch that is off and says how many filled cells it would change.
 * Nothing runs until Preview is pressed.
 */
export const Configuring: Story = {
  render: () => <Panel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Prompt" })).not.toHaveValue("");
    const overwrite = canvas.getByRole("switch", { name: "Overwrite filled cells" });
    await expect(overwrite).toHaveAttribute("aria-checked", "false");
    await expect(overwrite).toHaveAccessibleDescription(/Would change 2 filled cells/);
    await expect(canvas.queryByRole("button", { name: "Apply to all" })).toBeNull();
  },
};

/**
 * The prompt has run on the first three records. Each result sits beside the
 * value already there, with its cost and time. Nothing is written yet, and the
 * line above Apply to all says how many cells it will write and skip.
 */
export const SamplePreview: Story = {
  render: () => <Panel />,
  play: async ({ canvasElement }) => {
    const canvas = await preview(canvasElement);
    await expect(canvasElement.querySelectorAll('[data-slot="auto-fill-sample"]')).toHaveLength(3);
    await expect(canvas.getByText("Industrial manufacturing")).toBeInTheDocument();
    await expect(canvas.getAllByText("2 credits")).toHaveLength(3);
    await expect(canvas.getByText(/Nothing is written until you apply/)).toBeInTheDocument();
  },
};

/**
 * Apply to all has been pressed. Progress is the host's number, and Cancel is
 * always there. The run never resolves here so the state holds.
 */
export const Applying: Story = {
  render: () => <Panel onApply={never} progress={{ done: 2, total: 3 }} />,
  play: async ({ canvasElement }) => {
    const canvas = await preview(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Apply to all" }));
    await expect(Math.round(Number(canvas.getByRole("progressbar").getAttribute("aria-valuenow")))).toBe(67);
    await expect(canvas.getByText("2 of 3 cells")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  },
};

/**
 * One generated value, marked as generated, with the model's reason, the
 * value it would replace, and Accept and Override named for their row.
 */
export const Suggested: Story = {
  render: () => (
    <AutoFillCell
      status="suggested"
      value="Wholesale"
      previous="Distribution"
      reason="Imports and resells goods."
      label="Northwind Traders, Industry"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("note", { name: "Generated by AI" })).toBeInTheDocument();
    await expect(canvas.getByText("Replaces: Distribution")).toBeInTheDocument();
  },
};

/** Accepting removes the mark and the buttons. The value reads like any value a person typed. */
export const Accepted: Story = {
  render: () => <AutoFillCell status="accepted" value="Wholesale" label="Northwind Traders, Industry" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("note")).toBeNull();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** A person replaced the suggestion and left a reason. Not marked as generated. */
export const Overridden: Story = {
  render: () => (
    <AutoFillCell
      status="overridden"
      value="Retail"
      reason="Sells to shoppers, not to resellers."
      label="Northwind Traders, Industry"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("note")).toBeNull();
    await expect(canvas.getByText("Edited by you")).toBeInTheDocument();
  },
};

/**
 * The run failed. The message is an alert and says every existing value was
 * kept; Back to prompt returns to the configuration with the prompt intact.
 */
export const Failed: Story = {
  render: () => <Panel onApply={() => Promise.reject(new Error("Rate limit reached."))} />,
  play: async ({ canvasElement }) => {
    const canvas = await preview(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Apply to all" }));
    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("Every existing value was kept. Nothing was written.");
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: RTL — auto-fill.tsx has no left/right/ml/mr/pl/pr/translate-x class and no directional icon (grep returns nothing); the layout is flex and grid, which mirror with the document
 * // case-skip: EmptyLabel — the trigger text defaults to "Auto fill" and every control is named from required text (field label, Prompt, switch label, cell label prop); no optional text slot exists
 * // case-skip: Boundary — no near-twin: data-views draws the collection this plugs into, approval-card and diff-review review one artifact, run-button starts one generation; the docs insteadUse carries the choosing rule
 */

function ControlledHost() {
  const onAccept = fn();
  const [status, setStatus] = React.useState<"suggested" | "accepted">("suggested");
  return (
    <div className="flex flex-col gap-2">
      <AutoFillCell
        status={status}
        value="Wholesale"
        label="Northwind Traders, Industry"
        onAccept={onAccept}
      />
      <button type="button" className="w-fit text-sm underline" onClick={() => setStatus("accepted")}>
        Host accepts
      </button>
    </div>
  );
}

/**
 * `AutoFillCell` shows what the host says. Pressing Accept does not change the
 * cell: the callback fires, the cell stays suggested, and only the host
 * re-rendering with a new status moves it.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Accept suggestion/ }));
    await expect(canvasElement.querySelector('[data-slot="auto-fill-cell"]')).toHaveAttribute(
      "data-status",
      "suggested",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Host accepts" }));
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="auto-fill-cell"]')).toHaveAttribute(
        "data-status",
        "accepted",
      ),
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="auto-fill-cell-value"]')).toHaveFocus(),
    );
  },
};

/**
 * Two suggested cells in a column. Each cell's buttons carry the row in their
 * names, so the column is not a list of identical Accept buttons. The tab
 * order inside the panel is the field select, the prompt, the overwrite
 * switch, then Preview, and each stop paints a ring.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Panel />
      <div className="flex gap-6">
        <AutoFillCell status="suggested" value="Wholesale" label="Northwind Traders, Industry" />
        <AutoFillCell status="suggested" value="Software" label="Contoso, Industry" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("combobox", { name: "Field to fill" }),
      canvas.getByRole("textbox", { name: "Prompt" }),
      canvas.getByRole("switch", { name: "Overwrite filled cells" }),
      canvas.getByRole("button", { name: /^Preview on first/ }),
    ];
    stops[0].focus();
    for (const [i, stop] of stops.entries()) {
      if (i > 0) await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(stop));
      await settledFocusRing(stop, waitFor);
    }
    const accepts = canvas.getAllByRole("button", { name: /^Accept suggestion for / });
    await expect(new Set(accepts.map((b) => b.getAttribute("aria-label"))).size).toBe(2);
  },
};

/**
 * The preview step at 375px. The wrapper constrains width only, so this proves
 * the wide layout squeezed narrow does not scroll sideways, not that a phone
 * breakpoint exists; the component has no media query.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile" className="w-[375px] max-w-full">
      <Panel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await preview(canvasElement);
    const frame = within(canvasElement).getByTestId("mobile");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
  },
};

/**
 * A record label and a suggestion of about ninety characters each. Both wrap
 * inside their column; nothing truncates, because the person is about to
 * decide on this text.
 */
export const LongContent: Story = {
  render: () => {
    const long =
      "Wholesale distribution of imported kitchenware, glassware and seasonal gifts to independent retailers";
    return (
      <Panel
        records={[
          {
            id: "r1",
            label: "Northwind Traders and Associated Distribution Partners, Regional Holdings Limited",
            current: null,
          },
        ]}
        onSample={async () => [{ id: "r1", value: long, durationMs: 1300, cost: 2 }]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Preview on first/ }));
    await canvas.findByText(/Wholesale distribution of imported/);
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("overflows=false");
  },
};

/**
 * While the preview runs, the spinner is the only thing that animates. It
 * carries motion-reduce:animate-none, and the test runner emulates reduced
 * motion, so the computed animation reads back as none.
 */
export const ReducedMotion: Story = {
  render: () => <Panel onSample={never} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Preview on first/ }));
    const spinner = await waitFor(() => {
      const el = canvasElement.querySelector('[data-slot="auto-fill-sampling"] svg');
      if (!el) throw new Error("spinner not rendered");
      return el;
    });
    await expect(getComputedStyle(spinner).animationName).toBe("none");
  },
};
