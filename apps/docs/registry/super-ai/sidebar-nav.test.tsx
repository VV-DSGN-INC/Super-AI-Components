import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarNav } from "./sidebar-nav";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" as const },
      { id: "inbox", label: "Inbox", unread: true },
      { id: "runs", label: "Runs", running: true },
    ],
  },
];

describe("SidebarNav", () => {
  it("renders the count-badge state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the tier-badge state without hiding the row", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeVisible();
  });

  it("renders the unread-dot state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="sidebar-nav-unread"]')).not.toBeNull();
  });

  it("renders the running state", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="sidebar-nav-running"]')).not.toBeNull();
  });

  it("renders the pinned-group state above the sections", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" pinned={[{ id: "home", label: "Home" }]} />);
    const nav = document.querySelector('[data-slot="sidebar-nav"]')!;
    expect(nav.textContent!.indexOf("Home")).toBeLessThan(nav.textContent!.indexOf("Workspace"));
  });

  it("marks the active row with a filled background, never a left border", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    const active = document.querySelector('[data-slot="sidebar-nav-item"][data-active="true"]')!;
    expect(active.className).toMatch(/bg-/);
    expect(active.className).not.toMatch(/border-l/);
  });

  it("uses section-header for section labels", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" />);
    expect(document.querySelector('[data-slot="section-header"]')).not.toBeNull();
  });

  it("passes className through", () => {
    render(<SidebarNav sections={SECTIONS} activeId="chat" className="test-class" />);
    expect(document.querySelector('[data-slot="sidebar-nav"]')!.className).toContain("test-class");
  });
});
