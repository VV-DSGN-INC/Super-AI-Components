import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { MemberGateRow, type MemberGateRowProps, type MemberGateRowState } from "@/registry/super-ai/member-gate-row";
import { MemberGateRowDocs } from "@/content/components/member-gate-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MemberGateRow> = {
  title: "Super AI/Member Gate Row",
  component: MemberGateRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MemberGateRowDocs) } },
};

export default meta;
type Story = StoryObj<typeof MemberGateRow>;

// MemberGateRow is controlled — it owns none of the locked/inline-upsell
// transition itself. The Locked story's play test needs the row to actually
// reveal the upsell panel after a click, so this wrapper stands in for the
// state a real consumer would own (see onRequestUpgrade in the docs).
function ControlledMemberGateRow(props: MemberGateRowProps) {
  const [state, setState] = useState<MemberGateRowState>(props.state);
  return (
    <MemberGateRow
      {...props}
      state={state}
      onRequestUpgrade={() => setState("inline-upsell")}
      onDismissUpsell={() => setState("locked")}
    />
  );
}

export const Locked: Story = {
  args: {
    label: "4K export",
    description: "Render at full resolution",
    state: "locked",
    tier: "Pro",
    upsellDescription: "4K export is a Pro feature. Upgrade to render at full resolution.",
    onUpgrade: () => {},
  },
  render: (args) => <ControlledMemberGateRow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("4K export")).toBeInTheDocument();
    await expect(canvas.getByText("Pro")).toBeInTheDocument();

    const gateSwitch = canvas.getByRole("switch");
    await expect(gateSwitch).toHaveAttribute("aria-checked", "false");

    // Activating a locked row reveals the upsell inline — never a modal.
    await userEvent.click(gateSwitch);
    // Scoped to the upsell title: /upgrade to pro/i also matches the CTA
    // button's own "Upgrade to Pro" label, so an unscoped canvas.getByText
    // would match both and throw.
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell-title"]')).toHaveTextContent(
      /upgrade to pro/i,
    );
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
    // The switch itself never actually turns on.
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  },
};

export const Unlocked: Story = {
  args: {
    label: "Background removal",
    state: "unlocked",
    checked: true,
    onCheckedChange: () => {},
  },
};

export const TrialAvailable: Story = {
  args: {
    label: "Voice cloning",
    description: "Clone a voice from a short sample",
    state: "trial-available",
    trialLabel: "Free trial ×1",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const InlineUpsell: Story = {
  args: {
    label: "4K export",
    description: "Render at full resolution",
    state: "inline-upsell",
    tier: "Pro",
    upsellDescription: "4K export is a Pro feature. Upgrade to render at full resolution.",
    onUpgrade: () => {},
    onDismissUpsell: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Scoped to the upsell title: /upgrade to pro/i also matches the CTA
    // button's own "Upgrade to Pro" label, so an unscoped canvas.getByText
    // would match both and throw.
    await expect(canvasElement.querySelector('[data-slot="member-gate-row-upsell-title"]')).toHaveTextContent(
      /upgrade to pro/i,
    );
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /not now/i }));
  },
};
