import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CritiquePanel, type CritiqueIteration } from "./critique-panel";

const iterations: CritiqueIteration[] = [
  { draft: "Quantum computers break RSA.", critique: "Too absolute; cite Shor's algorithm and timelines.", verdict: "needs-work" },
  { draft: "Shor's algorithm threatens RSA within 10–20 years.", critique: "No further critiques found.", verdict: "approved" },
];

describe("CritiquePanel", () => {
  it("shows iteration counter and latest panes by default", () => {
    render(<CritiquePanel iterations={iterations} onAccept={vi.fn()} onIterate={vi.fn()} />);
    expect(screen.getByText("Iteration 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Shor's algorithm threatens RSA within 10–20 years.")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("steps back to a previous iteration", async () => {
    render(<CritiquePanel iterations={iterations} onAccept={vi.fn()} onIterate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Previous iteration" }));
    expect(screen.getByText("Iteration 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Quantum computers break RSA.")).toBeInTheDocument();
  });

  it("fires onAccept and onIterate", async () => {
    const onAccept = vi.fn();
    const onIterate = vi.fn();
    render(<CritiquePanel iterations={iterations} onAccept={onAccept} onIterate={onIterate} />);
    await userEvent.click(screen.getByRole("button", { name: "Accept draft" }));
    expect(onAccept).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Run another iteration" }));
    expect(onIterate).toHaveBeenCalledOnce();
  });

  it("renders an empty state instead of crashing with no iterations", () => {
    render(<CritiquePanel iterations={[]} onAccept={vi.fn()} onIterate={vi.fn()} />);
    expect(screen.getByText("No iterations yet.")).toBeInTheDocument();
  });

  it("disables stepper buttons at the bounds", () => {
    render(<CritiquePanel iterations={iterations} onAccept={vi.fn()} onIterate={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next iteration" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous iteration" })).toBeEnabled();
  });
});
