import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionHeader } from "./section-header";

describe("SectionHeader", () => {
  it("renders the action as a link, never a button", () => {
    // "View all" navigates, it does not act.
    render(<SectionHeader title="Recent" action={<a href="/all">View all</a>} />);
    expect(screen.getByRole("link", { name: "View all" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("omits the count element entirely when count is not given", () => {
    const withCount = render(<SectionHeader title="Assets" count={12} />);
    expect(document.querySelector('[data-slot="section-header-count"]')!.textContent).toBe("12");
    withCount.unmount();

    render(<SectionHeader title="Assets" />);
    expect(document.querySelector('[data-slot="section-header-count"]')).toBeNull();
  });

  it("toggles uncontrolled disclosure from defaultOpen", async () => {
    render(<SectionHeader title="Filters" collapsible defaultOpen />);
    const trigger = screen.getByRole("button", { name: /Filters/ });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("respects controlled open and reports changes without self-toggling", async () => {
    const onOpenChange = vi.fn();
    render(<SectionHeader title="Filters" collapsible open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: /Filters/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled: still false until the consumer re-renders with open=true.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders header only — it never wraps content", () => {
    render(
      <>
        <SectionHeader title="Group" collapsible defaultOpen />
        <p>panel content</p>
      </>,
    );
    const header = document.querySelector('[data-slot="section-header"]')!;
    expect(header.textContent).not.toContain("panel content");
  });

  it("distinguishes the sm size from default", () => {
    const def = render(<SectionHeader title="T" />);
    const a = document.querySelector('[data-slot="section-header"]')!.className;
    def.unmount();

    render(<SectionHeader title="T" size="sm" />);
    expect(document.querySelector('[data-slot="section-header"]')!.className).not.toBe(a);
  });

  it("is not a button when not collapsible", () => {
    render(<SectionHeader title="Plain" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
