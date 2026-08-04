import { MessageSquare, Users } from "lucide-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModeTabs } from "./mode-tabs";

const TEXT_MODES = [
  { value: "chat", label: "Chat" },
  { value: "cowork", label: "Cowork" },
];

const ICON_MODES = [
  { value: "chat", label: "Chat", icon: <MessageSquare /> },
  { value: "cowork", label: "Cowork", icon: <Users /> },
  { value: "build", label: "Build" },
];

describe("ModeTabs", () => {
  it("renders the default state as text-only triggers with programmatic selection", () => {
    render(<ModeTabs modes={TEXT_MODES} defaultValue="chat" onValueChange={vi.fn()} />);

    const chat = screen.getByRole("button", { name: "Chat" });
    const cowork = screen.getByRole("button", { name: "Cowork" });
    expect(chat).toHaveAttribute("aria-pressed", "true");
    expect(cowork).toHaveAttribute("aria-pressed", "false");
    // Text-only: no icon wrapper should be present in the default variant.
    expect(document.querySelector('[data-slot="mode-tabs"][data-variant="default"]')).toBeInTheDocument();
  });

  it("renders the with-icon state pairing a visible icon with a visible label", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ModeTabs
        modes={ICON_MODES}
        variant="with-icon"
        defaultValue="chat"
        onValueChange={onValueChange}
      />,
    );

    const cowork = screen.getByRole("button", { name: "Cowork" });
    // Label stays visible (not sr-only) in this variant.
    expect(cowork.querySelector("span:not([aria-hidden])")?.className).not.toContain("sr-only");
    expect(cowork.querySelector("svg")).toBeInTheDocument();

    await user.click(cowork);
    expect(onValueChange).toHaveBeenCalledWith("cowork");

    // A mode without an icon still renders fine alongside icon modes.
    expect(screen.getByRole("button", { name: "Build" })).toBeInTheDocument();
  });

  it("renders the with-tooltip state as icon-only triggers whose accessible name never depends on the tooltip alone", () => {
    render(<ModeTabs modes={ICON_MODES.slice(0, 2)} variant="with-tooltip" defaultValue="chat" />);

    // The accessible name comes from real (sr-only) button content, not the
    // hover/focus-only tooltip popup — mirrors modality-rail.tsx's fix for
    // the same failure mode.
    const chat = screen.getByRole("button", { name: "Chat" });
    expect(chat).toHaveAccessibleName("Chat");
    expect(chat.querySelector("span.sr-only")).toHaveTextContent("Chat");
    expect(chat.querySelector("svg")).toBeInTheDocument();
  });

  it("never lands on an unselected mode when the active trigger is pressed again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ModeTabs modes={TEXT_MODES} defaultValue="chat" onValueChange={onValueChange} />);

    const chat = screen.getByRole("button", { name: "Chat" });
    await user.click(chat);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(chat).toHaveAttribute("aria-pressed", "true");
  });

  it("passes className through", () => {
    render(<ModeTabs modes={TEXT_MODES} className="test-class" />);
    expect(document.querySelector('[data-slot="mode-tabs"]')!.className).toContain("test-class");
  });
});
