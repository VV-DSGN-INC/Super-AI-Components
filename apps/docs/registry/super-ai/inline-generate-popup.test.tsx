import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InlineGeneratePopup } from "./inline-generate-popup";

const PROMPT = "Three bullets on why churn moved";
const GENERATED = "Churn moved because onboarding shortened, pricing simplified, and support got faster.";

function popup() {
  return document.querySelector('[data-slot="inline-generate-popup"]')!;
}

describe("InlineGeneratePopup", () => {
  it("renders the idle state", () => {
    render(<InlineGeneratePopup context="Q3 revenue drivers" />);
    expect(popup()).toHaveAttribute("data-state", "idle");
    // An empty prompt is not a request.
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    // Nothing is being announced yet — the live region exists, empty, so it is
    // in the tree before it has anything to say.
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("renders the generating state", () => {
    render(<InlineGeneratePopup state="generating" defaultPrompt={PROMPT} onCancel={vi.fn()} />);
    expect(popup()).toHaveAttribute("data-state", "generating");
    // The transition is announced, not just spun.
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Generating");
    // A real, named Cancel control — not a spinner you have to wait out.
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
  });

  it("renders the cancelled state", () => {
    render(<InlineGeneratePopup state="cancelled" defaultPrompt={PROMPT} />);
    expect(popup()).toHaveAttribute("data-state", "cancelled");
    // Distinguishable by words, not by a faded border: the state survives a
    // greyscale screenshot and reaches a screen reader.
    expect(screen.getByRole("status")).toHaveTextContent("Cancelled. Nothing was inserted.");
    // The prompt survived, and the retry is one click away.
    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveValue(PROMPT);
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  // ── "The popover generates, it does not commit" ───────────────────────────
  it("hands the generated text to the host and never draws it", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<InlineGeneratePopup state="generating" defaultPrompt={PROMPT} onCommit={onCommit} />);
    rerender(<InlineGeneratePopup state="idle" defaultPrompt={PROMPT} result={GENERATED} onCommit={onCommit} />);

    expect(onCommit).toHaveBeenCalledWith(GENERATED);
    // The output belongs to a K1 ai-doc-block, so it is nowhere in this popup.
    expect(screen.queryByText(GENERATED)).toBeNull();
    expect(document.body.textContent).not.toContain(GENERATED);
  });

  it("closes once the result has been handed off", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<InlineGeneratePopup state="generating" onOpenChange={onOpenChange} />);
    rerender(<InlineGeneratePopup state="idle" result={GENERATED} onOpenChange={onOpenChange} />);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(popup()).toBeNull();
  });

  it("emits each result once", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<InlineGeneratePopup result={GENERATED} onCommit={onCommit} />);
    rerender(<InlineGeneratePopup result={GENERATED} onCommit={onCommit} className="nudge" />);
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it("commits nothing once the run has been cancelled", () => {
    const onCommit = vi.fn();
    render(<InlineGeneratePopup state="cancelled" defaultPrompt={PROMPT} result={GENERATED} onCommit={onCommit} />);
    // Cancelled means no output was committed — a late result is discarded, not
    // quietly inserted after the user said stop.
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps the prompt when the run is cancelled", async () => {
    const onCancel = vi.fn();
    render(<InlineGeneratePopup state="generating" defaultPrompt={PROMPT} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", { name: "Prompt" })).toHaveValue(PROMPT);
  });

  // ── Accessible name: Base UI renders the popup as role="dialog" ───────────
  it("names the dialog with its visible title", () => {
    render(<InlineGeneratePopup title="Generate here" />);
    // aria-dialog-name has shipped broken on this surface before.
    expect(screen.getByRole("dialog", { name: "Generate here" })).toBe(popup());
  });

  // ── Caret anchoring is the host's measurement, not ours ───────────────────
  it("records the placement decision instead of measuring it", () => {
    render(<InlineGeneratePopup placement="above" />);
    expect(popup()).toHaveAttribute("data-placement", "above");
  });

  it("drops the fallback trigger when the host supplies a caret anchor", () => {
    const caret = document.createElement("span");
    document.body.append(caret);
    render(<InlineGeneratePopup anchor={caret} />);
    // The click that produced the caret already opened it; there is nothing left
    // to press.
    expect(screen.queryByRole("button", { name: "Ask AI" })).toBeNull();
    expect(popup()).toBeInTheDocument();
  });

  it("opens from a trigger when there is no caret to point at", async () => {
    render(<InlineGeneratePopup defaultOpen={false} triggerLabel="Ask AI" />);
    expect(popup()).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Ask AI" }));
    expect(popup()).toBeInTheDocument();
  });

  // ── Surrounding structure is the instruction ──────────────────────────────
  it("shows the structure it inherited and describes the dialog with it", () => {
    render(<InlineGeneratePopup context="Q3 revenue drivers" contextLabel="Under" />);
    const context = document.querySelector('[data-slot="inline-generate-popup-context"]')!;
    expect(context).toHaveTextContent("Under Q3 revenue drivers");
    expect(popup()).toHaveAttribute("aria-describedby", context.id);
  });

  it("keeps the placeholder short rather than demanding an instruction", () => {
    render(<InlineGeneratePopup />);
    const field = screen.getByRole("textbox", { name: "Prompt" });
    expect(field).toHaveAttribute("placeholder", "What should go here?");
    expect(field.getAttribute("placeholder")!.split(" ").length).toBeLessThanOrEqual(6);
  });

  // ── Keyboard contract ─────────────────────────────────────────────────────
  it("submits the trimmed prompt on Enter and breaks the line on Shift+Enter", async () => {
    const onSubmit = vi.fn();
    render(<InlineGeneratePopup onSubmit={onSubmit} />);
    const field = screen.getByRole("textbox", { name: "Prompt" });

    await userEvent.click(field);
    await userEvent.paste(`  ${PROMPT}  `);
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveValue(`  ${PROMPT}  \n`);

    await userEvent.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith(PROMPT);
  });

  it("ignores Enter while a run is in flight", async () => {
    const onSubmit = vi.fn();
    render(<InlineGeneratePopup state="generating" defaultPrompt={PROMPT} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("textbox", { name: "Prompt" }));
    await userEvent.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resubmits the preserved prompt after a cancel", async () => {
    const onSubmit = vi.fn();
    render(<InlineGeneratePopup state="cancelled" defaultPrompt={PROMPT} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onSubmit).toHaveBeenCalledWith(PROMPT);
  });

  it("passes className through", () => {
    render(<InlineGeneratePopup className="test-class" />);
    expect(document.querySelector('[data-slot="inline-generate-popup"]')!.className).toContain("test-class");
  });
});
