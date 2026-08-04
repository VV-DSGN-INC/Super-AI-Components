import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Feedback, type FeedbackProps, type FeedbackState, type FeedbackValue } from "@/registry/super-ai/feedback";
import { FeedbackDocs } from "@/content/components/feedback.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof Feedback> = {
  title: "Super AI/Feedback",
  component: Feedback,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FeedbackDocs) } },
};

export default meta;
type Story = StoryObj<typeof Feedback>;

// Feedback is controlled — it owns none of the idle/rating/submitted state
// itself. The play tests below need clicks to actually move it forward, so
// this wrapper stands in for the persistence a real consumer would own.
function ControlledFeedback(props: FeedbackProps) {
  const [state, setState] = useState<FeedbackState>(props.state ?? "idle");
  const [value, setValue] = useState<FeedbackValue | undefined>(props.value);
  const [reason, setReason] = useState(props.reason ?? "");

  return (
    <Feedback
      {...props}
      state={state}
      value={value}
      reason={reason}
      onReasonChange={setReason}
      onRate={(next) => {
        setValue(next);
        if (next === "down") setState("rating");
        props.onRate?.(next);
      }}
      onSubmit={(payload) => {
        setState("submitted");
        props.onSubmit?.(payload);
      }}
      onRatingCancel={() => {
        setState("idle");
        setValue(undefined);
        props.onRatingCancel?.();
      }}
      onUndo={() => {
        setState("idle");
        setValue(undefined);
        setReason("");
        props.onUndo?.();
      }}
    />
  );
}

export const Idle: Story = {
  args: {
    onRate: () => {},
    onSubmit: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const up = canvas.getByRole("button", { name: "Helpful" });
    const down = canvas.getByRole("button", { name: "Not helpful" });
    await expect(up).toHaveAttribute("aria-pressed", "false");
    await expect(down).toHaveAttribute("aria-pressed", "false");

    // Positive feedback is one click straight to "submitted".
    await userEvent.click(up);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Thanks for the feedback!");
  },
};

export const Rating: Story = {
  args: {
    state: "rating",
    value: "down",
    onRate: () => {},
    onSubmit: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    // The reason popover renders in a portal, outside canvasElement.
    const body = within(document.body);
    await expect(await body.findByText("What went wrong?")).toBeInTheDocument();

    // Free text never blocks submission.
    const send = await body.findByRole("button", { name: "Send feedback" });
    await userEvent.click(send);

    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Thanks for the feedback!");
  },
};

export const Submitted: Story = {
  args: {
    state: "submitted",
    value: "up",
    onUndo: () => {},
  },
  render: (args) => <ControlledFeedback {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Thanks for the feedback!");
    await expect(canvas.getByRole("button", { name: "Helpful" })).toBeDisabled();

    // Retracting is always available — feedback that can't be undone is
    // feedback people stop giving.
    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await expect(canvas.getByRole("button", { name: "Helpful" })).not.toBeDisabled();
  },
};
