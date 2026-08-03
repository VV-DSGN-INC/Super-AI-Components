import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitationRef } from "./citation-ref";

describe("CitationRef", () => {
  it("still renders when unresolved, and says so", () => {
    // Silently dropping a citation is how a document stops being verifiable.
    render(<CitationRef label="3" state="unresolved" />);
    const marker = document.querySelector('[data-slot="citation-ref"]')!;
    expect(marker).toBeInTheDocument();
    expect(marker.getAttribute("data-state")).toBe("unresolved");
    expect(marker.getAttribute("aria-label")).toContain("source unavailable");
  });

  it("does not jump to source from a state that has no source yet", async () => {
    const onJumpToSource = vi.fn();
    const loading = render(<CitationRef label="1" state="loading" onJumpToSource={onJumpToSource} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onJumpToSource).not.toHaveBeenCalled();
    loading.unmount();

    render(<CitationRef label="1" state="unresolved" onJumpToSource={onJumpToSource} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onJumpToSource).not.toHaveBeenCalled();
  });

  it("jumps to source when resolved", async () => {
    const onJumpToSource = vi.fn();
    render(<CitationRef label="1" source="Policy.pdf" onJumpToSource={onJumpToSource} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onJumpToSource).toHaveBeenCalled();
  });

  it("shows the quoted chunk on hover, not just the document name", async () => {
    render(<CitationRef label="1" source="Benefits policy 2026" quote="Out-of-network scans require…" />);
    await userEvent.hover(screen.getByRole("button"));
    expect(await screen.findByText("Out-of-network scans require…")).toBeInTheDocument();
    expect(screen.getByText("Benefits policy 2026")).toBeInTheDocument();
  });
});
