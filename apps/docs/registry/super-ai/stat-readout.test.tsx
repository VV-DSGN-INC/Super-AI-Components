import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatReadout } from "./stat-readout";

describe("StatReadout", () => {
  it("renders a missing value as an em-dash, never an empty cell", () => {
    // Absence must look deliberate — a blank cell reads as a rendering bug.
    render(<StatReadout items={[{ label: "Seed", value: undefined }]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders dt/dd pairs inside a dl", () => {
    render(<StatReadout items={[{ label: "Model", value: "flux-1" }]} />);
    const dl = document.querySelector('[data-slot="stat-readout"]')!;
    expect(dl.tagName).toBe("DL");
    expect(dl.querySelector("dt")!.textContent).toBe("Model");
    expect(dl.querySelector("dd")!.textContent).toBe("flux-1");
  });

  it("changes layout but not content when columns changes", () => {
    const items = [
      { label: "Seed", value: "12345" },
      { label: "Sampler", value: "euler" },
    ];
    const two = render(<StatReadout items={items} columns={2} />);
    const twoClass = document.querySelector('[data-slot="stat-readout"]')!.className;
    const twoText = document.querySelector('[data-slot="stat-readout"]')!.textContent;
    two.unmount();

    render(<StatReadout items={items} columns={1} />);
    const one = document.querySelector('[data-slot="stat-readout"]')!;
    expect(one.className).not.toBe(twoClass);
    expect(one.textContent).toBe(twoText);
  });

  it("exposes a copy control only for copyable items", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <StatReadout
        items={[
          { label: "Seed", value: "12345", copyable: true },
          { label: "Model", value: "flux-1" },
        ]}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]);
    expect(writeText).toHaveBeenCalledWith("12345");
  });

  it("does not offer copy for a missing value", () => {
    render(<StatReadout items={[{ label: "Seed", copyable: true }]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
