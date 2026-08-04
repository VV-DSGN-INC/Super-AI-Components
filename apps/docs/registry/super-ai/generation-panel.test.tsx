import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GenerationPanel } from "./generation-panel";

describe("GenerationPanel", () => {
  it("renders the dropzone state", () => {
    const onFilesAdd = vi.fn();
    const onFileRemove = vi.fn();
    render(
      <GenerationPanel
        dropzoneLabel="Upload source image"
        onFilesAdd={onFilesAdd}
        onFileRemove={onFileRemove}
        files={[{ id: "1", name: "photo.png" }]}
      />,
    );

    // Operable by keyboard, not only by drag: a real, focusable button
    // triggers the file picker.
    const trigger = screen.getByRole("button", { name: "Upload source image" });
    expect(trigger).toBeInTheDocument();

    const input = screen.getByLabelText("Upload source image", { selector: "input" });
    const file = new File(["hello"], "new.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesAdd).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect(onFileRemove).toHaveBeenCalledWith("1");
  });

  it("renders the directions state", () => {
    const onDirectionsChange = vi.fn();
    render(<GenerationPanel directions="" onDirectionsChange={onDirectionsChange} />);

    const textarea = screen.getByRole("textbox", { name: "Directions" });
    fireEvent.change(textarea, { target: { value: "make it cinematic" } });
    expect(onDirectionsChange).toHaveBeenCalledWith("make it cinematic");
  });

  it("renders the presets state", () => {
    render(<GenerationPanel presets={<div>Style presets go here</div>} />);

    expect(screen.getByRole("heading", { name: "Presets" })).toBeInTheDocument();
    expect(screen.getByText("Style presets go here")).toBeInTheDocument();
  });

  it("renders the settings state", () => {
    render(<GenerationPanel settings={<div>Model + parameter controls</div>} />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Model + parameter controls")).toBeInTheDocument();
  });

  it("renders the cost-and-generate state with cost and Generate in the same row (F1)", () => {
    render(<GenerationPanel cost={12} generate={<button type="button">Generate</button>} />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    const costText = screen.getByText("12 credits");
    // F1: the price belongs at the point of spend — pin that cost and the
    // generate action are always in the same container, never split across
    // sections of the panel.
    const footer = document.querySelector('[data-slot="generation-panel-generate"]');
    expect(footer).toContainElement(generateButton);
    expect(footer).toContainElement(costText);
  });

  it("passes className through", () => {
    render(<GenerationPanel className="test-class" />);
    expect(document.querySelector('[data-slot="generation-panel"]')!.className).toContain("test-class");
  });
});
