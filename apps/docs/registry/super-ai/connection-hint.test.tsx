import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { compatibleTargets, ConnectionHint, PortChips } from "@/registry/super-ai/connection-hint";

const catalog = [
  { kind: "video-node", label: "Video", in: ["image", "text"], out: ["video"] },
  { kind: "tts-node", label: "Text to Speech", in: ["text"], out: ["speech"] },
];

describe("ConnectionHint", () => {
  it("filters the catalog by compatible input type", () => {
    expect(compatibleTargets("image", catalog).map((c) => c.kind)).toEqual(["video-node"]);
  });
  it("renders options, focuses the first, and fires onPick", async () => {
    const onPick = vi.fn();
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 10, y: 10 }} onPick={onPick} />);
    expect(screen.getByRole("button", { name: "Video" })).toHaveFocus();
    await userEvent.click(screen.getByText("Text to Speech"));
    expect(onPick).toHaveBeenCalledWith("tts-node");
  });
  it("is a dialog labelled by its heading", () => {
    render(<ConnectionHint dataType="text" catalog={catalog} position={{ x: 0, y: 0 }} onPick={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Add compatible node" })).toBeInTheDocument();
  });
  it("dismisses on Escape", async () => {
    const onDismiss = vi.fn();
    render(
      <ConnectionHint
        dataType="text"
        catalog={catalog}
        position={{ x: 0, y: 0 }}
        onPick={() => {}}
        onDismiss={onDismiss}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledOnce();
  });
  it("shows the empty state when nothing is compatible", () => {
    render(<ConnectionHint dataType="3d" catalog={catalog} position={{ x: 0, y: 0 }} onPick={() => {}} />);
    expect(screen.getByText("No compatible nodes")).toBeInTheDocument();
  });
  it("passes className through", () => {
    render(
      <ConnectionHint
        dataType="text"
        catalog={catalog}
        position={{ x: 0, y: 0 }}
        onPick={() => {}}
        className="test-class"
      />,
    );
    expect(document.querySelector('[data-slot="connection-hint"]')!.className).toContain("test-class");
  });
});

describe("PortChips", () => {
  it("renders IN and OUT rows with one chip per port", () => {
    render(<PortChips in={["text", "image"]} out={["video"]} />);
    expect(screen.getByText("IN").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(2);
    expect(screen.getByText("OUT").parentElement?.querySelectorAll("[data-slot=port-chip]")).toHaveLength(1);
    expect(screen.getByText("Video")).toBeInTheDocument();
  });
  it("marks satisfied ports, and unsatisfied ones as false rather than absent", () => {
    render(<PortChips in={["text", "image"]} satisfied={["text"]} />);
    expect(screen.getByText("Text").closest("[data-slot=port-chip]")).toHaveAttribute(
      "data-satisfied",
      "true",
    );
    expect(screen.getByText("Image").closest("[data-slot=port-chip]")).toHaveAttribute(
      "data-satisfied",
      "false",
    );
  });
});
