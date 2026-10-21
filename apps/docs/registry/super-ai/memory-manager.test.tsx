import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
import { MemoryManager, MemorySavedChip, type MemoryItem } from "./memory-manager";

const MEMORIES: MemoryItem[] = [
  {
    id: "p1",
    text: "Keep answers short and lead with the conclusion.",
    kind: "preference",
    addedAt: "2026-09-14T10:00:00Z",
    source: "Chat: Release notes draft",
    scope: "global",
  },
  {
    id: "p2",
    text: "Use British spelling in documents.",
    kind: "preference",
    addedAt: "2026-08-30",
    source: "Added by you",
    scope: "global",
  },
  {
    id: "f1",
    text: "Works as a product designer on a design systems team.",
    kind: "fact",
    addedAt: "2026-09-02",
    source: "Chat: Portfolio review",
    scope: "global",
  },
  {
    id: "f2",
    text: "The team reviews designs on Thursdays.",
    kind: "fact",
    addedAt: "2026-10-01",
    scope: { workspace: "Work" },
  },
  {
    id: "f3",
    text: "Planning a trip to Lisbon in March.",
    kind: "fact",
    addedAt: "2026-10-03",
    source: "Chat: Trip planning",
    scope: { workspace: "Personal" },
  },
];

function rowOf(text: string) {
  return screen.getByText(text).closest('[data-slot="memory-manager-item"]') as HTMLElement;
}

describe("MemoryManager", () => {
  it("renders the empty state: a sentence, no groups, no reset", () => {
    render(<MemoryManager memories={[]} />);
    expect(screen.getByText(/Nothing remembered yet/)).toBeInTheDocument();
    expect(document.querySelector('[data-slot="memory-manager-group"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset all memories" })).toBeNull();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("renders the populated state as two labelled groups, preferences first", () => {
    render(<MemoryManager memories={MEMORIES} />);
    const groups = document.querySelectorAll('[data-slot="memory-manager-group"]');
    expect(groups).toHaveLength(2);
    const [prefs, facts] = Array.from(groups) as HTMLElement[];
    expect(within(prefs).getByText("Preferences")).toBeInTheDocument();
    expect(within(facts).getByText("Facts")).toBeInTheDocument();
    expect(within(prefs).getByText("Use British spelling in documents.")).toBeInTheDocument();
    expect(within(facts).getByText("Planning a trip to Lisbon in March.")).toBeInTheDocument();
    expect(within(prefs).queryByText("Planning a trip to Lisbon in March.")).toBeNull();
    expect(screen.getByRole("group", { name: "Memory" })).toBeInTheDocument();
  });

  it("states scope, date and source as text on every row", () => {
    render(<MemoryManager memories={MEMORIES} />);
    const global = rowOf("Keep answers short and lead with the conclusion.");
    expect(global).toHaveTextContent("All workspaces");
    expect(global).toHaveTextContent("Added Sep 14, 2026");
    expect(global).toHaveTextContent("Chat: Release notes draft");
    expect(within(global).getByText("Sep 14, 2026").tagName).toBe("TIME");
    expect(rowOf("The team reviews designs on Thursdays.")).toHaveTextContent("Workspace: Work");
    document.querySelectorAll('[data-slot="memory-manager-item"]').forEach((row) => {
      expect(row.querySelector('[data-slot="memory-manager-scope"]')).not.toBeNull();
      expect(row.querySelector("time")).not.toBeNull();
    });
  });

  it("renders the scoped state: names the active set and marks rows held for another workspace", () => {
    render(<MemoryManager memories={MEMORIES} activeWorkspace="Work" />);
    expect(screen.getByText(/Active memory set: Work/)).toBeInTheDocument();
    expect(rowOf("Planning a trip to Lisbon in March.")).toHaveTextContent("Not used in Work");
    expect(rowOf("The team reviews designs on Thursdays.")).not.toHaveTextContent("Not used in");
    expect(rowOf("Use British spelling in documents.")).not.toHaveTextContent("Not used in");
  });

  it("renders the just-saved state: the chip beside a row marked Just added", async () => {
    const onReview = vi.fn();
    render(
      <>
        <MemorySavedChip onReview={onReview} />
        <MemoryManager memories={MEMORIES} justSavedId="f3" />
      </>,
    );
    const chip = document.querySelector('[data-slot="memory-saved-chip"]') as HTMLElement;
    expect(chip).toHaveAttribute("role", "status");
    expect(chip).toHaveTextContent("Memory updated");
    const review = within(chip).getByRole("button");
    expectAccessibleName(review, "Review Memory updated");
    await userEvent.click(review);
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(within(rowOf("Planning a trip to Lisbon in March.")).getByText("Just added")).toBeInTheDocument();
    expect(screen.getAllByText("Just added")).toHaveLength(1);
  });

  it("MemorySavedChip omits the review action when there is no handler", () => {
    render(<MemorySavedChip />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Memory updated")).toBeInTheDocument();
  });

  it("renders the editing state: a labelled field, Save and Cancel, focus in the field", () => {
    render(<MemoryManager memories={MEMORIES} defaultEditingId="p2" />);
    const field = screen.getByRole("textbox", { name: "Edit memory" });
    expect(field).toHaveValue("Use British spelling in documents.");
    expect(field).toHaveFocus();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    // Only the edited row swaps; the others keep Edit and Delete.
    expect(screen.getAllByRole("button", { name: /^Edit / })).toHaveLength(MEMORIES.length - 1);
  });

  it("saves the trimmed text and returns focus to that row's Edit button", async () => {
    const onEdit = vi.fn();
    render(<MemoryManager memories={MEMORIES} defaultEditingId="p2" onEdit={onEdit} />);
    const field = screen.getByRole("textbox", { name: "Edit memory" });
    await userEvent.clear(field);
    await userEvent.type(field, "  Use American spelling.  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onEdit).toHaveBeenCalledWith("p2", "Use American spelling.");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Edit Use British spelling in documents." })).toHaveFocus();
  });

  it("cancels an edit without calling onEdit, and Save is off for an empty field", async () => {
    const onEdit = vi.fn();
    render(<MemoryManager memories={MEMORIES} defaultEditingId="p2" onEdit={onEdit} />);
    await userEvent.clear(screen.getByRole("textbox", { name: "Edit memory" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("opens the editor from a row's Edit button and closes it on Escape", async () => {
    render(<MemoryManager memories={MEMORIES} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Use British spelling in documents." }));
    expect(screen.getByRole("textbox", { name: "Edit memory" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("deletes one memory by id, and each button names its own row", async () => {
    const onDelete = vi.fn();
    render(<MemoryManager memories={MEMORIES} onDelete={onDelete} />);
    const del = screen.getByRole("button", { name: "Delete Planning a trip to Lisbon in March." });
    expectAccessibleName(del, "Delete Planning a trip to Lisbon in March.");
    await userEvent.click(del);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("f3");
  });

  it("renders the memory-off state: the switch is off and one sentence says what stops", async () => {
    const onEnabledChange = vi.fn();
    render(<MemoryManager memories={MEMORIES} enabled={false} onEnabledChange={onEnabledChange} />);
    const sw = screen.getByRole("switch", { name: "Memory" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    const statement = document.querySelector('[data-slot="memory-manager-statement"]') as HTMLElement;
    expect(statement).toHaveTextContent(/nothing new is saved/);
    expect(sw).toHaveAccessibleDescription(statement.textContent!);
    expect(screen.getByText(/Private sessions never save memories/)).toBeInTheDocument();
    await userEvent.click(sw);
    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("does not import or render the private-session notice, only names it in copy", () => {
    render(<MemoryManager memories={MEMORIES} />);
    expect(document.querySelector('[data-slot="private-session-notice"]')).toBeNull();
  });

  it("renders the reset-confirm state: says what it deletes and keeps, and nothing fires yet", () => {
    const onReset = vi.fn();
    render(<MemoryManager memories={MEMORIES} defaultResetOpen onReset={onReset} />);
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Reset all memories?")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("deletes all 5 saved memories");
    expect(dialog).toHaveTextContent("Your account and your chats are kept");
    expect(onReset).not.toHaveBeenCalled();
  });

  it("fires onReset only on confirm, not on cancel", async () => {
    const onReset = vi.fn();
    render(<MemoryManager memories={MEMORIES} onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset all memories" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Keep memories" }),
    );
    expect(onReset).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Reset all memories" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete all memories" }),
    );
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("announces edits, deletes and resets through one polite status region", async () => {
    render(<MemoryManager memories={MEMORIES} onDelete={() => {}} />);
    const status = document.querySelector('[data-slot="memory-manager-status"]') as HTMLElement;
    expect(status).toHaveAttribute("role", "status");
    await userEvent.click(screen.getByRole("button", { name: /^Delete Use British/ }));
    expect(status).toHaveTextContent("Memory deleted.");
  });

  it("passes className through", () => {
    render(<MemoryManager memories={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="memory-manager"]')!.className).toContain("test-class");
  });
});
