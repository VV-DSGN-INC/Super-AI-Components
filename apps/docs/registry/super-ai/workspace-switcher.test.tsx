import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSwitcher } from "./workspace-switcher";

const WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

describe("WorkspaceSwitcher", () => {
  it("renders the workspace-list state as a checked list", async () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    const current = await screen.findByRole("menuitemradio", { name: /Acme/ });
    expect(current).toHaveAttribute("aria-checked", "true");
  });

  it("renders the multi-product state as rows with descriptions", async () => {
    render(
      <WorkspaceSwitcher
        workspaces={WORKSPACES.map((w) => ({ ...w, description: `${w.name} workspace` }))}
        currentId="acme"
        onSelect={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    expect(await screen.findByText("Personal workspace")).toBeInTheDocument();
  });

  it("renders the with-plan-badge state on the trigger", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} />);
    // The plan badge is the cheapest upgrade prompt in the shell — it must be on
    // the trigger, not only inside the open menu.
    expect(screen.getByRole("button", { name: /Acme/ })).toHaveTextContent("Pro");
  });

  it("puts creation last, below a separator", async () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} onCreate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
    const items = await screen.findAllByRole("menuitem");
    expect(items[items.length - 1]).toHaveTextContent(/create/i);
  });

  it("does not render a create affordance on the trigger", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Acme/ })).not.toHaveTextContent(/create|\+/i);
  });

  it("passes className through", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={vi.fn()} className="test-class" />);
    expect(document.querySelector('[data-slot="workspace-switcher"]')!.className).toContain("test-class");
  });
});
