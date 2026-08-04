import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaPromptBar } from "./media-prompt-bar";

describe("MediaPromptBar", () => {
  it("renders the floating state — collapses the settings strip even if one is passed", () => {
    render(
      <MediaPromptBar
        presentation="floating"
        settings={<div data-testid="settings-strip">settings</div>}
      />,
    );

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("data-presentation", "floating");
    expect(screen.getByRole("textbox", { name: /prompt/i })).toBeInTheDocument();
    expect(screen.queryByTestId("settings-strip")).not.toBeInTheDocument();
  });

  it("renders the docked state — hosts the settings strip (A7) in place", () => {
    render(
      <MediaPromptBar
        presentation="docked"
        settings={<div data-testid="settings-strip">settings</div>}
      />,
    );

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("data-presentation", "docked");
    expect(screen.getByTestId("settings-strip")).toBeInTheDocument();
  });

  it("renders the node-embedded state — drops the negative prompt entirely", () => {
    render(<MediaPromptBar presentation="node-embedded" negativePrompt />);

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("data-presentation", "node-embedded");

    // Forced closed regardless of the negativePrompt prop, and no toggle to open it.
    expect(root.querySelector('[data-slot="media-prompt-bar-negative"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /negative prompt/i })).not.toBeInTheDocument();
  });

  it("renders the locked state — the paywall CTA replaces the input row in place, not a separate banner", () => {
    const onUnlock = vi.fn();
    render(
      <MediaPromptBar
        locked
        lockedTitle="You've hit your plan's limit"
        lockedCtaLabel="Upgrade"
        onUnlock={onUnlock}
      />,
    );

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("data-locked", "true");

    // No textarea anywhere — swapped out, not disabled and not hidden behind it.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    const cta = screen.getByRole("button", { name: "Upgrade" });
    expect(root).toContainElement(cta);
    expect(root.querySelector('[data-slot="media-prompt-bar-paywall"]')).toContainElement(cta);
  });

  it("locked CTA calls onUnlock", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();
    render(<MediaPromptBar locked onUnlock={onUnlock} />);
    await user.click(screen.getByRole("button", { name: /upgrade/i }));
    expect(onUnlock).toHaveBeenCalledOnce();
  });

  it("renders the negative-prompt state — toggled open in place below the prompt", async () => {
    const user = userEvent.setup();
    const onNegativePromptChange = vi.fn();
    render(<MediaPromptBar onNegativePromptChange={onNegativePromptChange} />);

    // Closed by default: toggle visible, field not yet rendered.
    expect(screen.queryByRole("textbox", { name: /negative prompt/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add negative prompt/i }));

    expect(onNegativePromptChange).toHaveBeenCalledWith(true);
    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("data-negative-prompt", "true");
    const negativeField = screen.getByRole("textbox", { name: /negative prompt/i });
    expect(root.querySelector('[data-slot="media-prompt-bar-negative"]')).toContainElement(negativeField);

    // Collapsible again via its own control, independent of the main prompt value.
    await user.click(screen.getByRole("button", { name: /remove negative prompt/i }));
    expect(onNegativePromptChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("textbox", { name: /negative prompt/i })).not.toBeInTheDocument();
  });

  it("supports controlled negativePrompt without an internal toggle re-closing it", () => {
    render(<MediaPromptBar negativePrompt />);
    expect(screen.getByRole("textbox", { name: /negative prompt/i })).toBeInTheDocument();
  });

  it("submits the current value and shows the cost at the point of spend", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MediaPromptBar onSubmit={onSubmit} cost={8} />);

    expect(screen.getByText(/8\s*credits/)).toBeInTheDocument();

    const textarea = screen.getByRole("textbox", { name: /prompt/i });
    await user.type(textarea, "A slow dolly-in on a neon alley");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(onSubmit).toHaveBeenCalledWith("A slow dolly-in on a neon alley");
  });

  it("running state exposes Cancel instead of a disabled submit", () => {
    render(<MediaPromptBar generating generatingLabel="Rendering your clip…" />);

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Rendering your clip…");
    expect(screen.queryByRole("button", { name: /^generate$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop generating/i })).toBeInTheDocument();
  });

  it("hosts D2 reference-strip and D3 context-chips as opaque slots, composed by the caller", () => {
    render(
      <MediaPromptBar
        referenceStrip={<div data-testid="reference-strip">refs</div>}
        contextChips={<span data-testid="context-chips">chips</span>}
      />,
    );

    const root = document.querySelector('[data-slot="media-prompt-bar"]')!;
    expect(root.querySelector('[data-slot="media-prompt-bar-reference"]')).toContainElement(
      screen.getByTestId("reference-strip"),
    );
    expect(root.querySelector('[data-slot="media-prompt-bar-chips"]')).toContainElement(
      screen.getByTestId("context-chips"),
    );
  });

  it("passes className through", () => {
    render(<MediaPromptBar className="test-class" />);
    expect(document.querySelector('[data-slot="media-prompt-bar"]')!.className).toContain("test-class");
  });
});
