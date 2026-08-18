import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EntityRow } from "./entity-row";

const rowClassName = () => document.querySelector('[data-slot="entity-row"]')!.className;

describe("EntityRow", () => {
  it("keeps row height identical with and without a description", () => {
    // A menu of mixed rows must not look ragged — the row reserves its height
    // whether or not the description slot is filled.
    const withDesc = render(<EntityRow title="Summarize" description="Condense a document" />);
    const a = rowClassName();
    withDesc.unmount();

    render(<EntityRow title="Summarize" />);
    expect(rowClassName()).toBe(a);
  });

  it("renders the trailing slot without changing the row grid", () => {
    const plain = render(<EntityRow title="Row" />);
    const a = rowClassName();
    plain.unmount();

    render(<EntityRow title="Row" trailing={<span>PRO</span>} />);
    expect(rowClassName()).toBe(a);
    expect(screen.getByText("PRO")).toBeInTheDocument();
  });

  it("is a button carrying aria-pressed when selectable", async () => {
    const onSelect = vi.fn();
    render(<EntityRow title="Pick me" onSelect={onSelect} selected />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("exposes no button and is not focusable when not selectable", () => {
    render(<EntityRow title="Static" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not fire onSelect when disabled", async () => {
    const onSelect = vi.fn();
    render(<EntityRow title="Nope" onSelect={onSelect} disabled />);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  // `selected` used to default to `false`, so every interactive row emitted
  // aria-pressed="false" and a navigation row announced as an unpressed toggle
  // it does not have. Presence of the prop is now what makes a row a toggle.
  it("reports no aria-pressed when the row acts rather than toggles", () => {
    render(<EntityRow title="Fine-tune a model" onSelect={() => {}} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("still reports aria-pressed=false when the caller opts into toggle semantics", () => {
    render(<EntityRow title="Summarize" onSelect={() => {}} selected={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  // pointer-events-none stopped the mouse and nothing else, so a control handed
  // to `trailing` stayed tabbable on a row that reads as disabled.
  it("makes a disabled non-interactive row inert, so trailing controls die with it", () => {
    render(<EntityRow title="Off" disabled trailing={<button type="button">Toggle</button>} />);
    expect(document.querySelector('[data-slot="entity-row"]')).toHaveAttribute("inert");
  });

  it("leaves an enabled row's trailing control reachable", () => {
    render(<EntityRow title="On" trailing={<button type="button">Toggle</button>} />);
    expect(document.querySelector('[data-slot="entity-row"]')).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
  });

  it("renders icon, title and description in their slots", () => {
    render(<EntityRow icon={<span>ICON</span>} title="Title" description="Description" />);
    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="entity-row-title"]')!.textContent).toBe("Title");
    expect(document.querySelector('[data-slot="entity-row-description"]')!.textContent).toBe(
      "Description",
    );
  });
});
