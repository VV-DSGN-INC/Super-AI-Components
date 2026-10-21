import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
import {
  AutoFill,
  AutoFillCell,
  AutoFillPanel,
  type AutoFillPanelProps,
  type AutoFillRecord,
  type AutoFillSample,
} from "./auto-fill";

const FIELDS = [
  { id: "industry", label: "Industry" },
  { id: "size", label: "Company size" },
];

const RECORDS: AutoFillRecord[] = [
  { id: "r1", label: "Northwind Traders", current: null },
  { id: "r2", label: "Fabrikam", current: "Manufacturing" },
  { id: "r3", label: "Contoso", current: "" },
  { id: "r4", label: "Tailspin Toys", current: "Retail" },
  { id: "r5", label: "Litware", current: null },
];

const SAMPLES: AutoFillSample[] = [
  { id: "r1", value: "Wholesale", reason: "Imports and resells goods.", cost: 2, durationMs: 1240 },
  { id: "r2", value: "Industrial manufacturing", cost: 2, durationMs: 980 },
  { id: "r3", value: "Software", durationMs: 1100 },
];

function setup(overrides: Partial<AutoFillPanelProps> = {}) {
  const onSample = vi.fn().mockResolvedValue(SAMPLES);
  const onApply = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  const utils = render(
    <AutoFillPanel fields={FIELDS} records={RECORDS} onSample={onSample} onApply={onApply} {...overrides} />,
  );
  return { user, onSample, onApply, ...utils };
}

describe("AutoFill", () => {
  it("renders the configuring state", () => {
    setup();
    expect(document.querySelector('[data-slot="auto-fill-panel"]')).toHaveAttribute(
      "data-phase",
      "configuring",
    );
    expect(screen.getByRole("combobox", { name: "Field to fill" })).toBeInTheDocument();
    // The default prompt is visible and editable, never hidden.
    const prompt = screen.getByRole("textbox", { name: "Prompt" }) as HTMLTextAreaElement;
    expect(prompt.value).not.toBe("");
    expect(prompt).not.toBeDisabled();
    // Nothing runs until the person asks.
    expect(screen.queryByRole("button", { name: "Apply to all" })).toBeNull();
  });

  it("keeps overwrite off by default and states how many filled cells it would change", async () => {
    const { user } = setup();
    const overwrite = screen.getByRole("switch", { name: "Overwrite filled cells" });
    expect(overwrite).toHaveAttribute("aria-checked", "false");
    expect(overwrite).toHaveAccessibleDescription(/Would change 2 filled cells/);
    await user.click(overwrite);
    expect(overwrite).toHaveAccessibleDescription("Will replace 2 filled cells.");
  });

  it("renders the sample-preview state on the first three records and writes nothing", async () => {
    const { user, onSample, onApply } = setup();
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    expect(onSample).toHaveBeenCalledWith(
      expect.any(String),
      ["r1", "r2", "r3"],
      expect.objectContaining({ field: "industry" }),
    );
    const rows = document.querySelectorAll('[data-slot="auto-fill-sample"]');
    expect(rows).toHaveLength(3);
    // The result sits beside the existing value, with cost and time.
    const second = rows[1] as HTMLElement;
    expect(within(second).getByText("Manufacturing")).toBeInTheDocument();
    expect(within(second).getByText("Industrial manufacturing")).toBeInTheDocument();
    expect(within(second).getByText("2 credits")).toBeInTheDocument();
    expect(within(second).getByText("1.0 s")).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is written until you apply/)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("honours sampleSize", async () => {
    const { user, onSample } = setup({ sampleSize: 2 });
    await user.click(screen.getByRole("button", { name: "Preview on first 2 records" }));
    await waitFor(() => expect(onSample).toHaveBeenCalled());
    expect(onSample.mock.calls[0][1]).toEqual(["r1", "r2"]);
  });

  it("passes the edited prompt and the overwrite choice to the apply callback", async () => {
    const { user, onApply } = setup();
    const prompt = screen.getByRole("textbox", { name: "Prompt" });
    await user.clear(prompt);
    await user.type(prompt, "Name the industry");
    await user.click(screen.getByRole("switch", { name: "Overwrite filled cells" }));
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    const apply = screen.getByRole("button", { name: "Apply to all" });
    expect(apply).toHaveAccessibleDescription(/replacing 2 filled cells/);
    await user.click(apply);
    expect(onApply).toHaveBeenCalledWith(
      "Name the industry",
      true,
      expect.objectContaining({ field: "industry" }),
    );
  });

  it("skips filled cells by default when applying", async () => {
    const { user, onApply } = setup();
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    expect(screen.getByRole("button", { name: "Apply to all" })).toHaveAccessibleDescription(
      "Nothing is written until you apply. Apply will write 3 empty cells and skip 2 filled cells.",
    );
    await user.click(screen.getByRole("button", { name: "Apply to all" }));
    expect(onApply.mock.calls[0][1]).toBe(false);
  });

  it("renders the applying state with progress and a cancel that stops the run", async () => {
    const onCancel = vi.fn();
    let signal: AbortSignal | undefined;
    const onApply = vi.fn().mockImplementation(
      (_p: string, _o: boolean, ctx: { signal: AbortSignal }) =>
        new Promise<void>(() => {
          signal = ctx.signal;
        }),
    );
    const { user } = setup({ onApply, onCancel, progress: { done: 2, total: 5 } });
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    await user.click(screen.getByRole("button", { name: "Apply to all" }));
    expect(document.querySelector('[data-slot="auto-fill-panel"]')).toHaveAttribute("data-phase", "applying");
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("2 of 5 cells")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(signal?.aborted).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Cancelled. Existing values were not changed.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Prompt" })).toBeInTheDocument();
  });

  it("renders the failed state and says every existing value was kept", async () => {
    const onApply = vi.fn().mockRejectedValue(new Error("Rate limit reached."));
    const { user } = setup({ onApply });
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    await user.click(screen.getByRole("button", { name: "Apply to all" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Industry was not filled.");
    expect(alert).toHaveTextContent("Rate limit reached.");
    expect(alert).toHaveTextContent("Every existing value was kept. Nothing was written.");
    await user.click(within(alert).getByRole("button", { name: "Back to prompt" }));
    expect(screen.getByRole("textbox", { name: "Prompt" })).toBeInTheDocument();
  });

  it("fails the preview without touching anything", async () => {
    const onSample = vi.fn().mockRejectedValue(new Error("Model unavailable."));
    const { user, onApply } = setup({ onSample });
    await user.click(screen.getByRole("button", { name: "Preview on first 3 records" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The preview did not run.");
    expect(alert).toHaveTextContent("Every existing value was kept.");
    expect(onApply).not.toHaveBeenCalled();
  });

  it("opens the panel from the column-header action and closes it after an apply", async () => {
    const onSample = vi.fn().mockResolvedValue(SAMPLES);
    const onApply = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AutoFill fields={FIELDS} records={RECORDS} onSample={onSample} onApply={onApply} />);
    expect(screen.queryByRole("textbox", { name: "Prompt" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Auto fill" }));
    await user.click(await screen.findByRole("button", { name: "Preview on first 3 records" }));
    await screen.findByText("Wholesale");
    await user.click(screen.getByRole("button", { name: "Apply to all" }));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Prompt" })).toBeNull());
  });

  it("renders the suggested state marked as generated, with a reason and both actions", async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoFillCell
        status="suggested"
        value="Wholesale"
        label="Northwind Traders, Industry"
        previous="Distribution"
        reason="Imports and resells goods."
        onAccept={onAccept}
      />,
    );
    const mark = screen.getByRole("note");
    expectAccessibleName(mark, "Generated by AI");
    expect(mark).toHaveAttribute("data-variant", "generated");
    expect(screen.getByText("Reason: Imports and resells goods.")).toBeInTheDocument();
    expect(screen.getByText("Replaces: Distribution")).toBeInTheDocument();
    const accept = screen.getByRole("button", { name: "Accept suggestion for Northwind Traders, Industry" });
    expect(
      screen.getByRole("button", { name: "Override suggestion for Northwind Traders, Industry" }),
    ).toBeInTheDocument();
    await user.click(accept);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("renders the accepted state without the mark or the actions", () => {
    render(<AutoFillCell status="accepted" value="Wholesale" label="Northwind Traders, Industry" />);
    expect(screen.queryByRole("note")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector('[data-slot="auto-fill-cell"]')).toHaveAttribute("data-status", "accepted");
    expect(screen.getByText("Wholesale")).toBeInTheDocument();
  });

  it("moves focus to the value when accepting removes the buttons", async () => {
    const user = userEvent.setup();
    function Host() {
      const [status, setStatus] = useState<"suggested" | "accepted">("suggested");
      return (
        <AutoFillCell status={status} value="Wholesale" label="Row" onAccept={() => setStatus("accepted")} />
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Accept suggestion for Row" }));
    expect(document.querySelector('[data-slot="auto-fill-cell-value"]')).toHaveFocus();
  });

  it("renders the overridden state and sends the new value with its optional reason", async () => {
    const onOverride = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <AutoFillCell status="suggested" value="Wholesale" label="Row" onOverride={onOverride} />,
    );
    await user.click(screen.getByRole("button", { name: "Override suggestion for Row" }));
    const value = await screen.findByRole("textbox", { name: "New value" });
    await user.clear(value);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.type(value, "Retail");
    await user.type(screen.getByRole("textbox", { name: "Reason (optional)" }), "Sells to shoppers");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onOverride).toHaveBeenCalledWith("Retail", "Sells to shoppers");

    rerender(<AutoFillCell status="overridden" value="Retail" label="Row" reason="Sells to shoppers" />);
    expect(screen.queryByRole("note")).toBeNull();
    expect(screen.getByText("Edited by you")).toBeInTheDocument();
    expect(screen.getByText("Your reason: Sells to shoppers")).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(
      <AutoFillPanel
        className="test-class"
        fields={FIELDS}
        records={RECORDS}
        onSample={vi.fn()}
        onApply={vi.fn()}
      />,
    );
    expect(document.querySelector('[data-slot="auto-fill-panel"]')!.className).toContain("test-class");
    render(<AutoFillCell className="cell-class" status="accepted" value="x" label="y" />);
    expect(document.querySelector('[data-slot="auto-fill-cell"]')!.className).toContain("cell-class");
    render(
      <AutoFill
        className="trigger-class"
        fields={FIELDS}
        records={RECORDS}
        onSample={vi.fn()}
        onApply={vi.fn()}
      />,
    );
    expect(document.querySelector('[data-slot="auto-fill"]')!.className).toContain("trigger-class");
  });
});
