import { Wand2 } from "lucide-react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalityRail } from "./modality-rail";

const ITEM = (id: string, label: string) => ({ id, label, icon: <Wand2 /> });

const SIX_ITEMS = [
  ITEM("select", "Select"),
  ITEM("draw", "Draw"),
  ITEM("text", "Text"),
  ITEM("shapes", "Shapes"),
  ITEM("audio", "Audio"),
  ITEM("effects", "Effects"),
];

const PINNED = [ITEM("settings", "Settings"), ITEM("plugins", "Plugins"), ITEM("help", "Help")];

describe("ModalityRail", () => {
  it("renders the active state with a programmatic (not colour-only) indicator", () => {
    render(<ModalityRail items={SIX_ITEMS} activeId="draw" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /draw/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /select/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the overflow state as a chevron affordance, not a scrollbar", async () => {
    const user = userEvent.setup();
    const items = [...SIX_ITEMS, ITEM("masks", "Masks"), ITEM("filters", "Filters")];
    const { container } = render(<ModalityRail items={items} maxVisible={6} onSelect={vi.fn()} />);

    // The scrollable middle never grows scroll styling — overflow is a chevron.
    const scrollRegion = container.querySelector('[data-slot="modality-rail-scroll"]');
    expect(scrollRegion?.className).not.toMatch(/overflow-(y-)?(auto|scroll)/);

    expect(screen.queryByRole("button", { name: /masks/i })).not.toBeInTheDocument();
    const overflowButton = container.querySelector('[data-slot="modality-rail-overflow"]');
    expect(overflowButton).toBeInTheDocument();
    expect(overflowButton).toHaveAccessibleName();

    await user.click(overflowButton!);
    expect(await screen.findByRole("button", { name: /masks/i })).toBeInTheDocument();
  });

  it("renders the with-badge state with a discernible name beyond the tooltip", () => {
    const items = [ITEM("draw", "Draw"), { ...ITEM("upscale", "Upscale"), badge: "pro" as const }];
    render(<ModalityRail items={items} onSelect={vi.fn()} />);

    const proButton = screen.getByRole("button", { name: /upscale/i });
    // The badge's name is baked into the button's accessible name via visible
    // (or sr-only) content — not solely dependent on a hover-only tooltip.
    expect(proButton).toHaveAccessibleName(/upscale.*pro/i);
    expect(proButton.querySelector('[data-slot="modality-rail-badge"][data-badge="pro"]')).toBeInTheDocument();
  });

  it("renders the bottom-pinned state as a group structurally separate from the scrollable middle", () => {
    const { container } = render(<ModalityRail items={SIX_ITEMS} pinned={PINNED} onSelect={vi.fn()} />);

    const scrollRegion = container.querySelector('[data-slot="modality-rail-scroll"]');
    const pinnedGroup = container.querySelector('[data-slot="modality-rail-pinned"]');

    expect(scrollRegion).toBeInTheDocument();
    expect(pinnedGroup).toBeInTheDocument();
    // Pinned items never end up inside the scrollable middle, and vice versa.
    expect(within(scrollRegion as HTMLElement).queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
    expect(within(pinnedGroup as HTMLElement).getByRole("button", { name: /settings/i })).toBeInTheDocument();
    expect(scrollRegion?.contains(pinnedGroup)).toBe(false);
  });

  it("passes className through", () => {
    render(<ModalityRail items={SIX_ITEMS} onSelect={vi.fn()} className="test-class" />);
    expect(document.querySelector('[data-slot="modality-rail"]')!.className).toContain("test-class");
  });
});
