import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NodePrompt } from "./node-prompt";

describe("NodePrompt", () => {
  it("controlled value + onChange", async () => {
    const onChange = vi.fn();
    render(<NodePrompt value="a cat" onChange={onChange} placeholder="Describe the image…" />);
    await userEvent.type(screen.getByPlaceholderText("Describe the image…"), "!");
    expect(onChange).toHaveBeenLastCalledWith("a cat!");
  });
  it("renders reference chips with type dot and remove", async () => {
    const onRemove = vi.fn();
    render(
      <NodePrompt
        value=""
        onChange={() => {}}
        references={[{ id: "r1", label: "@Image 1", dataType: "image", thumbnailUrl: "/t.png" }]}
        onRemoveReference={onRemove}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove @Image 1" }));
    expect(onRemove).toHaveBeenCalledWith("r1");
  });
  it("collapses to summary when collapsed", () => {
    render(<NodePrompt value="long prompt text here" onChange={() => {}} collapsed />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("long prompt text here")).toBeInTheDocument();
  });
  it("clicking collapsed summary calls onExpand", async () => {
    const onExpand = vi.fn();
    render(<NodePrompt value="my prompt" onChange={() => {}} collapsed onExpand={onExpand} />);
    await userEvent.click(screen.getByRole("button", { name: /edit prompt/i }));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });
  it("textarea receives consumer aria-label via rest props", () => {
    render(<NodePrompt value="" onChange={() => {}} aria-label="Prompt for image generation" />);
    expect(screen.getByRole("textbox", { name: "Prompt for image generation" })).toBeInTheDocument();
  });
});
