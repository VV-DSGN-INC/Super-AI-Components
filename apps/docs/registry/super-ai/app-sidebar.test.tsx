import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

const DEFAULT_WIDTH = window.innerWidth;

afterEach(() => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: DEFAULT_WIDTH });
});

function renderShell(
  appSidebarProps: Partial<React.ComponentProps<typeof AppSidebar>> = {},
  providerProps: Partial<React.ComponentProps<typeof SidebarProvider>> = {},
) {
  return render(
    <SidebarProvider {...providerProps}>
      <SidebarTrigger />
      <AppSidebar
        switcher={<div>Acme Workspace</div>}
        nav={<nav aria-label="Primary">Primary nav content</nav>}
        {...appSidebarProps}
      />
    </SidebarProvider>,
  );
}

describe("AppSidebar", () => {
  it("renders the expanded state with switcher and nav visible", () => {
    renderShell({}, { defaultOpen: true });
    // The vendored Sidebar's outer state wrapper is the one node carrying
    // data-state — a11y-inert, but the reliable signal of desktop width.
    const stateRoot = document.querySelector("[data-state]")!;
    expect(stateRoot.getAttribute("data-state")).toBe("expanded");
    expect(screen.getByText("Acme Workspace")).toBeVisible();
    expect(screen.getByText("Primary nav content")).toBeVisible();
  });

  it("renders the icon-rail state without unmounting the slotted content", () => {
    renderShell({}, { defaultOpen: false });
    const stateRoot = document.querySelector("[data-state]")!;
    expect(stateRoot.getAttribute("data-state")).toBe("collapsed");
    expect(stateRoot.getAttribute("data-collapsible")).toBe("icon");
    // Collapsing to icon-rail is a CSS width change, not three different
    // components — the switcher and nav content stay mounted.
    expect(screen.getByText("Acme Workspace")).toBeInTheDocument();
    expect(screen.getByText("Primary nav content")).toBeInTheDocument();
  });

  // An icon rail is 3rem wide, and the switcher slot takes whatever the host
  // passes, a text brand included. The vendored SidebarContent already clips
  // itself at that width; the switcher header must too, or a brand wider than
  // the rail paints over the column beside it. Seen on the docs shell, whose
  // "Northwind" ran under the doc-nav trigger.
  it("clips the switcher slot at icon-rail width so a wide brand cannot paint over the next column", () => {
    renderShell({}, { defaultOpen: false });
    const header = document.querySelector('[data-slot="app-sidebar-switcher"]')!;
    expect(header.className).toContain("group-data-[collapsible=icon]:overflow-hidden");
  });

  it("renders the mobile-drawer state behind the trigger, below the mobile breakpoint", async () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 500 });
    renderShell();
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Primary nav content")).toBeInTheDocument();
  });

  it("passes className through", () => {
    renderShell({ className: "test-class" });
    expect(document.querySelector('[data-slot="app-sidebar"]')!.className).toContain("test-class");
  });
});
