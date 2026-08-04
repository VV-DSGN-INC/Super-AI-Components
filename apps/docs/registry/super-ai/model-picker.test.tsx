import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelPicker, type ModelPickerModel } from "./model-picker";

const MODELS: ModelPickerModel[] = [
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    description: "Google's flagship text-to-video model",
    group: "Text → video",
    price: 20,
    capabilities: ["1080p", "Audio"],
    runtime: "cloud",
  },
  {
    id: "svd-local",
    name: "Stable Video Diffusion",
    description: "Runs entirely on your machine",
    group: "Image → video",
    price: 0,
    capabilities: ["720p"],
    runtime: "local",
    hardware: "12GB VRAM",
  },
];

describe("ModelPicker", () => {
  it("renders the dropdown state, grouped by task signature with a name-bearing trigger", async () => {
    const user = userEvent.setup();
    render(<ModelPicker models={MODELS} selectedId="veo-3-1" onSelect={vi.fn()} />);

    // The trigger's accessible name includes the current selection, not a
    // static "Model" label.
    const trigger = screen.getByRole("combobox", { name: "Model: Veo 3.1" });
    await user.click(trigger);

    // Grouped by task signature (data), never alphabetically re-sorted.
    expect(await screen.findByText("Text → video")).toBeInTheDocument();
    expect(screen.getByText("Image → video")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Stable Video Diffusion/ })).toBeInTheDocument();
  });

  it("renders the expanded-cards state as interactive, programmatically-selected rows", () => {
    render(<ModelPicker presentation="expanded-cards" models={MODELS} selectedId="veo-3-1" onSelect={vi.fn()} />);

    const selected = screen.getByRole("button", { name: /Veo 3.1/ });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    const unselected = screen.getByRole("button", { name: /Stable Video Diffusion/ });
    expect(unselected).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the node-inline state as a compact trigger that opens a popover of rows", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ModelPicker presentation="node-inline" models={MODELS} selectedId="veo-3-1" onSelect={onSelect} />);

    const trigger = screen.getByRole("button", { name: "Model: Veo 3.1" });
    await user.click(trigger);

    const other = await screen.findByRole("button", { name: /Stable Video Diffusion/ });
    await user.click(other);
    expect(onSelect).toHaveBeenCalledWith("svd-local");
  });

  it("badges price, capability and runtime as text, not colour alone — local models surface hardware requirements", () => {
    render(<ModelPicker presentation="expanded-cards" models={MODELS} selectedId="veo-3-1" onSelect={vi.fn()} />);

    expect(screen.getByText(/20\s*credits/)).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
    expect(screen.getByText("Local · 12GB VRAM")).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ModelPicker models={MODELS} className="test-class" />);
    expect(document.querySelector('[data-slot="model-picker"]')!.className).toContain("test-class");
  });
});
