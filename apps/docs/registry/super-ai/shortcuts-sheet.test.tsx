import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShortcutsSheet } from "./shortcuts-sheet";

const sections = [
  { title: "Editor", shortcuts: [{ label: "Undo", keys: ["⌘", "Z"] }] },
  { title: "Player", shortcuts: [{ label: "Play/Pause", keys: ["Space"] }] },
];

describe("ShortcutsSheet", () => {
  it("opens from its trigger and renders sections with keycaps", async () => {
    render(<ShortcutsSheet sections={sections} trigger={<button>Shortcuts</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.getByText("Space")).toBeInTheDocument();
  });
  it("supports controlled open and exposes data-slot", () => {
    render(<ShortcutsSheet sections={sections} open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="shortcuts-sheet"]')).not.toBeNull();
  });
});
