import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
import {
  DataControls,
  type DataControlsProps,
  type DataControlsRetention,
  type DataControlsTraining,
} from "./data-controls";

const PERIODS = [
  { value: "30d", label: "30 days" },
  { value: "1y", label: "1 year" },
  { value: "forever", label: "Until I delete them" },
];

const TRAINING_COPY = {
  label: "Improve the model for everyone",
  description:
    "Your chats help train future models, which improves answers for everyone. In return you get better results over time; nothing is shown to other people.",
  learnMoreHref: "/policy/training",
};

const RETENTION_COPY = {
  label: "Keep my chats",
  description: "How long chats stay in your history before they are deleted.",
  learnMoreHref: "/policy/retention",
};

function training(extra: Partial<DataControlsTraining> = {}): DataControlsTraining {
  return {
    ...TRAINING_COPY,
    effect: "Right now your chats are used to train models.",
    checked: true,
    ...extra,
  } as DataControlsTraining;
}

function retention(extra: Partial<DataControlsRetention> = {}): DataControlsRetention {
  return {
    ...RETENTION_COPY,
    effect: "Right now chats are deleted after 30 days.",
    value: "30d",
    periods: PERIODS,
    ...extra,
  } as DataControlsRetention;
}

function renderControls(props: Partial<DataControlsProps> = {}) {
  return render(<DataControls training={training()} {...props} />);
}

const row = (name: "training" | "retention") =>
  document.querySelector<HTMLElement>(`[data-slot="data-controls-row"][data-row="${name}"]`)!;

describe("DataControls", () => {
  it("renders the training-on state: a checked switch named by the row label", () => {
    renderControls({ training: training({ checked: true }) });
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expectAccessibleName(sw, "Improve the model for everyone");
    expect(screen.getByText("Right now your chats are used to train models.")).toBeInTheDocument();
  });

  it("renders the training-off state: an unchecked switch, with the effect sentence the caller wrote for it", () => {
    renderControls({
      training: training({ checked: false, effect: "Right now your chats are not used to train models." }),
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Right now your chats are not used to train models.")).toBeInTheDocument();
  });

  it("renders the retention state: a period select showing the current period, in its own row", () => {
    renderControls({ retention: retention() });
    const trigger = within(row("retention")).getByRole("combobox");
    expect(trigger).toHaveTextContent("30 days");
    expectAccessibleName(trigger, "Keep my chats 30 days");
    expect(within(row("training")).queryByRole("combobox")).toBeNull();
    expect(within(row("retention")).queryByRole("switch")).toBeNull();
  });

  it("changing the training switch never calls the retention handler, and the reverse", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const onValueChange = vi.fn();
    renderControls({
      training: training({ onCheckedChange }),
      retention: retention({ onValueChange }),
    });
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "1 year" }));
    expect(onValueChange).toHaveBeenCalledWith("1y");
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it("states the effect in one sentence with a link to the long version, in every editable row", () => {
    renderControls({ retention: retention() });
    for (const [name, href, label] of [
      ["training", "/policy/training", "Improve the model for everyone"],
      ["retention", "/policy/retention", "Keep my chats"],
    ] as const) {
      const scope = within(row(name));
      const link = scope.getByRole("link");
      expect(link).toHaveAttribute("href", href);
      expectAccessibleName(link, `Read the full policy: ${label}`);
      expect(scope.getByText(/^Right now/)).toBeInTheDocument();
    }
  });

  it("describes every row: the description text is the control's accessible description", () => {
    renderControls({ retention: retention() });
    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      new RegExp(`${TRAINING_COPY.description.slice(0, 20)}.*Right now your chats`),
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(/before they are deleted/);
  });

  it("renders the plan-locked state: lock, plan name, an inert switch that keeps the row, and onUpgrade", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    const onCheckedChange = vi.fn();
    renderControls({
      training: training({
        kind: "plan-locked",
        plan: "Pro",
        onUpgrade,
        checked: true,
        onCheckedChange,
      } as never),
    });
    const scope = within(row("training"));
    expect(row("training")).toHaveAttribute("data-kind", "plan-locked");
    expect(scope.getByText("Pro")).toBeInTheDocument();
    expect(scope.getByText("Changing this needs the Pro plan.")).toBeInTheDocument();
    const sw = scope.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAccessibleDescription(/Changing this needs the Pro plan/);
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();

    await user.click(scope.getByRole("button", { name: "Upgrade to Pro" }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("plan-locked without onUpgrade still says the plan and renders no button", () => {
    renderControls({ training: training({ kind: "plan-locked", plan: "Team" } as never) });
    expect(screen.getByText("Changing this needs the Team plan.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the none-collected state: the section stays, there is no switch, and the reason is shown", () => {
    renderControls({
      training: {
        ...TRAINING_COPY,
        effect: "Nothing you write is used to train models.",
        kind: "none-collected",
        reason: "Chats are processed to answer you and then discarded, so there is nothing to opt out of.",
      },
    });
    expect(screen.getByRole("group", { name: "Data controls" })).toBeInTheDocument();
    expect(row("training")).toHaveAttribute("data-kind", "none-collected");
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByText("Not collected")).toBeInTheDocument();
    expect(screen.getByText(/so there is nothing to opt out of/)).toBeInTheDocument();
    expect(screen.getByText("Nothing you write is used to train models.")).toBeInTheDocument();
  });

  it("renders the admin-managed state: policy and who to ask, an inert control, and the row never hidden", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    renderControls({
      training: training({
        kind: "admin-managed",
        policy: "chats are never used for training.",
        contact: "your workspace admin",
        checked: false,
        onCheckedChange,
      } as never),
      retention: retention({
        kind: "admin-managed",
        policy: "chats are kept for 30 days.",
        contact: "security@example.com",
      } as never),
    });
    expect(row("training")).toHaveAttribute("data-kind", "admin-managed");
    expect(row("retention")).toHaveAttribute("data-kind", "admin-managed");
    expect(screen.getByText(/chats are never used for training\./)).toHaveTextContent(
      "Set by your administrator: chats are never used for training. To change it, ask your workspace admin.",
    );
    expect(screen.getByText(/ask security@example\.com/)).toBeInTheDocument();
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("names the section and levels its heading", () => {
    renderControls({ title: "Your data", headingLevel: 2 });
    expect(screen.getByRole("group", { name: "Your data" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Your data" })).toBeInTheDocument();
  });

  it("omits the retention row when none is given", () => {
    renderControls();
    expect(row("retention")).toBeNull();
  });

  it("passes className through", () => {
    renderControls({ className: "test-class" });
    expect(document.querySelector('[data-slot="data-controls"]')!.className).toContain("test-class");
  });
});
