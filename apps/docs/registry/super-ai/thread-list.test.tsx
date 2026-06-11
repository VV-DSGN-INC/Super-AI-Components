import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThreadList, ThreadListItem, ThreadListSection } from "./thread-list";

function renderList() {
  const handlers = {
    onSelect: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onTogglePin: vi.fn(),
  };
  render(
    <ThreadList aria-label="Conversations">
      <ThreadListSection label="Today">
        <ThreadListItem id="t1" title="Brand video script" active unread {...handlers} />
      </ThreadListSection>
    </ThreadList>,
  );
  return handlers;
}

describe("ThreadList", () => {
  it("renders nav landmark, active item gets aria-current, click selects", async () => {
    const h = renderList();
    expect(screen.getByRole("navigation", { name: "Conversations" })).toBeInTheDocument();
    const item = screen.getByRole("button", { name: /Brand video script/ });
    expect(item).toHaveAttribute("aria-current", "page");
    await userEvent.click(item);
    expect(h.onSelect).toHaveBeenCalledWith("t1");
  });
  it("renames inline: menu → Rename → type → Enter fires onRename", async () => {
    const h = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Thread actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
    const input = await screen.findByRole("textbox", { name: "Thread title" });
    await userEvent.clear(input);
    await userEvent.type(input, "New title{Enter}");
    expect(h.onRename).toHaveBeenCalledWith("t1", "New title");
  });
  it("escape cancels rename without firing onRename", async () => {
    const h = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Thread actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
    const input = await screen.findByRole("textbox", { name: "Thread title" });
    await userEvent.type(input, "{Escape}");
    expect(h.onRename).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Brand video script/ })).toBeInTheDocument();
  });
  it("delete requires confirmation, then fires onDelete", async () => {
    const h = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Thread actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(h.onDelete).toHaveBeenCalledWith("t1");
  });
  it("pin action fires onTogglePin", async () => {
    const h = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Thread actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Pin" }));
    expect(h.onTogglePin).toHaveBeenCalledWith("t1");
  });
});
